import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { JWT_ACCESS_SECRET } from '../constants.js';

export const socketAuth = (socket, next) => {
    try {
        const cookies = socket.handshake.headers.cookie;
        if (!cookies) {
            return next(new Error('Unauthorized'));
        }
        const parsed = cookie.parse(cookies);
        const accessToken = parsed.accessToken;
        if (!accessToken) {
            return next(new Error('Unauthorized'));
        }
        const decoded = jwt.verify(accessToken, JWT_ACCESS_SECRET);
        socket.userId = decoded.id;
        next();
    } catch (error) {
        next(new Error('Unauthorized'));
    }
}