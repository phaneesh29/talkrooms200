import { Server } from "socket.io";
import { ORIGIN } from "../constants.js";
import { socketAuth } from './auth.js';
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import { Room } from "../models/room.model.js";
import { socketAsyncHandler } from "../utils/asyncHandler.js";

export const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: ORIGIN,
            credentials: true
        }
    })


    const userSocketMap = new Map();

    const emitRoomUsers = (code) => {
        const users = [];
        userSocketMap.forEach((val) => {
            if (val.roomCode === code && !users.some(u => u.userId === val.userId.toString())) {
                users.push({ userId: val.userId.toString(), username: val.username, inVoice: val.inVoice || false });
            }
        });
        io.to(code).emit("roomUsers", users);
    };

    io.use(socketAuth);
    io.on("connection", (socket) => {
        console.log('🔌 socket connected:', socket.id)

        socket.on("joinRoom", socketAsyncHandler(async ({ room: code }) => {
            const user = await User.findById(socket.userId).select('-password -refreshToken');
            const roomDoc = await Room.findOne({ code });

            if (!user || !roomDoc) {
                socket.emit("error", { message: "Room not found or unauthorized" });
                return;
            }

            roomDoc.lastUsedTime = new Date();
            await roomDoc.save();

            user.lastJoinedRoom = roomDoc._id;
            await user.save();

            const prevData = userSocketMap.get(socket.id);
            if (prevData && prevData.roomCode !== code) {
                socket.leave(prevData.roomCode);
                userSocketMap.delete(socket.id);
                emitRoomUsers(prevData.roomCode);
            }

            socket.join(code);
            userSocketMap.set(socket.id, { userId: user._id, username: user.username, roomCode: code, inVoice: false });

            socket.to(code).emit("userjoined", { username: user.username, message: `${user.username} has joined the room.` });
            emitRoomUsers(code);
        }, socket));

        socket.on("sendMessage", socketAsyncHandler(async ({ room: code, message }) => {
            if (!message?.trim()) return;

            const roomDoc = await Room.findOne({ code });
            if (!roomDoc) {
                socket.emit("error", { message: "Room not found" });
                return;
            }

            roomDoc.lastUsedTime = new Date();
            await roomDoc.save();

            const msg = await Message.create({
                room: roomDoc._id,
                sender: socket.userId,
                text: message.trim(),
            })
            const newMessage = await Message.findById(msg._id).populate('sender', 'username email');

            io.to(code).emit("newMessage", newMessage)
            io.to(code).emit('scrollToBottom')
        }, socket));


        socket.on("typing", socketAsyncHandler(async ({ room, isTyping }) => {
            const user = await User.findById(socket.userId).select('username');
            if (!user) return;
            socket.to(room).emit('typing', { username: user.username, isTyping });
        }, socket));

        // --- WebRTC Voice Chat Signaling ---

        // 1. User wants to enter voice chat
        socket.on("joinVoice", ({ room }) => {
            const userData = userSocketMap.get(socket.id);
            if (!userData || userData.roomCode !== room) return;

            // Count how many people are currently in voice in this room
            let voiceCount = 0;
            userSocketMap.forEach((val) => {
                if (val.roomCode === room && val.inVoice) {
                    voiceCount++;
                }
            });

            if (voiceCount >= 6) {
                // Reject connection if room is full
                socket.emit("voiceError", { message: "Voice channel is full (max 6 users)." });
                return;
            }

            // Mark user as in voice
            userData.inVoice = true;
            userSocketMap.set(socket.id, userData);

            // Tell others in the room that this user joined voice
            socket.to(room).emit("userJoinedVoice", {
                socketId: socket.id,
                userId: userData.userId.toString(),
                username: userData.username
            });

            // Update main user list to reflect Voice status
            emitRoomUsers(room);
        });

        // 2. Relay SDP Offer
        socket.on("webrtc-offer", ({ offer, to }) => {
            socket.to(to).emit("webrtc-offer", {
                offer,
                from: socket.id
            });
        });

        // 3. Relay SDP Answer
        socket.on("webrtc-answer", ({ answer, to }) => {
            socket.to(to).emit("webrtc-answer", {
                answer,
                from: socket.id
            });
        });

        // 4. Relay ICE Candidates
        socket.on("webrtc-ice-candidate", ({ candidate, to }) => {
            socket.to(to).emit("webrtc-ice-candidate", {
                candidate,
                from: socket.id
            });
        });

        // 5. User manually leaves voice chat
        socket.on("leaveVoice", ({ room }) => {
            const userData = userSocketMap.get(socket.id);
            if (userData) {
                userData.inVoice = false;
                userSocketMap.set(socket.id, userData);
            }

            socket.to(room).emit("userLeftVoice", { socketId: socket.id });
            emitRoomUsers(room);
        });

        socket.on('disconnect', () => {
            console.log('❌ socket disconnected:', socket.id);
            const userData = userSocketMap.get(socket.id);
            if (userData) {
                if (userData.inVoice) {
                    socket.to(userData.roomCode).emit("userLeftVoice", { socketId: socket.id });
                }
                userSocketMap.delete(socket.id);
                emitRoomUsers(userData.roomCode);
            }
        });
    })
    return io;
}