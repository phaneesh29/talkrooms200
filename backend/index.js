import "dotenv/config";
import http from "http";
import { app } from "./app.js";
import { PORT } from "./constants.js";
import { connectDB } from "./db/db.config.js";
import mongoose from "mongoose";
import { initSocket } from "./sockets/index.js";
import { initCronJobs } from "./cron/room.cron.js";

const server = http.createServer(app);
const io = initSocket(server);

const startServer = async () => {
    try {
        await connectDB();

        initCronJobs();

        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT} | PID: ${process.pid}`);
        })
    } catch (error) {
        console.error('🔴 Startup failed');
        console.error(error);
        process.exit(1);
    }
}

startServer();

const shutdown = (signal) => {
    console.log(`\n🔴 Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
        console.log("🔴 Server closed. Exiting process.");

        try {
            await mongoose.connection.close();
            console.log('🟢 MongoDB connection closed');
        } catch (err) {
            console.error('🔴 Error closing MongoDB', err);
        }

        process.exit(0);
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
