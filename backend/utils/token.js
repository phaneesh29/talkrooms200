import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from '../constants.js';

export const generateAccessToken = (userId) => {
    return jwt.sign(
        { id: userId },
        JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
    );
}

export const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
}

export const hashToken = (token) =>{
    return crypto.createHash("sha256").update(token).digest("hex");
}