import jwt from "jsonwebtoken"
import { JWT_ACCESS_SECRET } from "../constants.js";
import { User } from "../models/user.model.js";

export const protectAuth = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
        if (!accessToken) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const decoded = jwt.verify(accessToken,JWT_ACCESS_SECRET)
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized error' });
    }
}