import { Message } from "../models/message.model.js";
import { Room } from "../models/room.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllMessagesController = asyncHandler(async (req, res) => {
    const { room: code } = req.params;

    const roomDoc = await Room.findOne({ code });
    if (!roomDoc) return res.status(404).json({ message: "Room not found" });

    const messages = await Message.find({ room: roomDoc._id }).populate('sender', 'username email');
    return res.status(200).json({ messages });
});