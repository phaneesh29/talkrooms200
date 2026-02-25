import cron from 'node-cron';
import { Room } from '../models/room.model.js';


export const initCronJobs = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily cleanup for inactive rooms...');
        try {
            const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
            const staleRooms = await Room.find({ lastUsedTime: { $lt: fiveDaysAgo } });

            for (const room of staleRooms) {
                await room.deleteOne();
            }
            console.log(`Cleanup complete: deleted ${staleRooms.length} inactive rooms.`);
        } catch (err) {
            console.error("Error during room cleanup:", err);
        }
    });

    // ping our own health endpoint every 30 seconds to prevent sleep / verify uptime
    cron.schedule('*/30 * * * * *', async () => {
        try {
            const url = process.env.HEALTH_URL || 'https://talkrooms200.onrender.com/api/health';
            const res = await fetch(url);
            if (res.ok) {
                console.log(`Health ping succeeded at ${new Date().toISOString()}`);
            } else {
                console.warn(`Health ping returned ${res.status}`);
            }
        } catch (err) {
            console.error('Health ping failed:', err);
        }
    });
};
