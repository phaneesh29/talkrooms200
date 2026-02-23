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
};
