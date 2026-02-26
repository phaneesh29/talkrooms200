import { JWT_REFRESH_SECRET } from "../constants.js";
import { User } from "../models/user.model.js";
import { generateAccessToken, generateRefreshToken, hashToken } from "../utils/token.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";

export const registerController = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    if (!username?.trim() || !email?.trim() || !password?.trim()) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
        return res.status(409).json({ message: 'Username or email already in use' });
    }
    const newUser = await User.create({ username, email, password });
    return res.status(201).json({ message: 'User registered successfully' })
});

export const loginController = asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier?.trim() || !password?.trim()) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    const user = await User.findOne({
        $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }]
    }).select("+password +refreshToken");
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = hashToken(refreshToken);
    await user.save();
    return res.status(200).cookie("accessToken", accessToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 60 * 60 * 1000, }).cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 }).json({ message: 'Login successful' });
});

export const profileController = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const user = await User.findById(userId).select("-password -refreshToken -__v").populate('lastJoinedRoom', 'name code');
    if (!user) {
        return res.status(404).json({ message: 'Not found User' });
    }
    return res.status(200).json({ user });
});

export const logoutController = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
        const hashed = hashToken(refreshToken);
        await User.findOneAndUpdate({ refreshToken: hashed }, { $unset: { refreshToken: 1 } });
    }
    return res.clearCookie("accessToken").clearCookie("refreshToken").status(200).json({ message: 'Logout successful' });
});

export const refreshTokenController = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(payload.id).select('+refreshToken');
    if (!user || !user.refreshToken) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const incomingHashed = hashToken(refreshToken);
    if (incomingHashed !== user.refreshToken) {
        return res.status(401).json({ message: 'Token mismatch' });
    }
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = hashToken(newRefreshToken);
    await user.save();
    return res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 60 * 60 * 1000,
    }).cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    }).status(200).json({
        success: true,
        message: 'Token refreshed',
    });
});

export const updateProfileController = asyncHandler(async (req, res) => {
    const { username } = req.body;
    const userId = req.userId;

    const existingUser = await User.findOne({ username, _id: { $ne: userId } });
    if (existingUser) {
        return res.status(409).json({ message: 'Username already in use' });
    }

    const user = await User.findByIdAndUpdate(userId, { username }, { new: true }).select("-password -refreshToken -__v");
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ message: 'Profile updated successfully', user });
});

export const changePasswordController = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId).select("+password");
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid old password' });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: 'Password changed successfully' });
});