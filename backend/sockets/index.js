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
                users.push({ userId: val.userId.toString(), username: val.username });
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
            userSocketMap.set(socket.id, { userId: user._id, username: user.username, roomCode: code });

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

        socket.on('disconnect', () => {
            console.log('❌ socket disconnected:', socket.id);
            const userData = userSocketMap.get(socket.id);
            if (userData) {
                userSocketMap.delete(socket.id);
                emitRoomUsers(userData.roomCode);
            }
        });
    })
    return io;
}