import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ORIGIN } from './constants.js';

import healthRouter from "./routes/health.route.js"
import authRouter from "./routes/auth.route.js"
import chatRouter from "./routes/chat.route.js"
import { globalLimiter } from './middlewares/rateLimit.middleware.js'
import { globalErrorHandler } from './middlewares/error.middleware.js';

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",
        ORIGIN
    ],
    credentials: true,
}));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())


app.use(globalLimiter)

import roomRouter from "./routes/room.route.js"

app.use("/api/health", healthRouter)
app.use("/api/auth", authRouter)
app.use("/api/chat", chatRouter)
app.use("/api/room", roomRouter)

app.use(globalErrorHandler);

export { app };