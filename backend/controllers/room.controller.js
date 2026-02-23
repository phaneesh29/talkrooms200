import { Room } from '../models/room.model.js';
import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';

const generateCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();

export const createRoom = asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Room name is required" });

    let code;
    let isUnique = false;
    while (!isUnique) {
        code = generateCode();
        const existing = await Room.findOne({ code });
        if (!existing) isUnique = true;
    }

    const room = await Room.create({
        name: name.trim(),
        code,
        host: req.userId,
        lastUsedTime: new Date()
    });

    res.status(201).json({ room });
});

export const getMyRooms = asyncHandler(async (req, res) => {
    const rooms = await Room.find({ host: req.userId }).sort({ createdAt: -1 });
    res.status(200).json({ rooms });
});

export const getRoomByCode = asyncHandler(async (req, res) => {
    const { code } = req.params;
    const room = await Room.findOne({ code }).populate('host', 'username email');
    if (!room) return res.status(404).json({ message: "Room not found" });

    res.status(200).json({ room });
});

export const updateRoom = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    const room = await Room.findOneAndUpdate(
        { _id: id, host: req.userId },
        { name: name?.trim() },
        { new: true }
    );

    if (!room) return res.status(404).json({ message: "Room not found or unauthorized" });
    res.status(200).json({ room });
});

export const deleteRoom = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const room = await Room.findOneAndDelete({ _id: id, host: req.userId });

    if (!room) return res.status(404).json({ message: "Room not found or unauthorized" });
    res.status(200).json({ message: "Room deleted successfully" });
});
