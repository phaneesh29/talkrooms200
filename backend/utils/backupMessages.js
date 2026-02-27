import { Message } from '../models/message.model.js';
import { Room } from '../models/room.model.js';
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from '../constants.js';

/**
 * Builds a JSON backup of all messages grouped by room,
 * and sends it as a document to Telegram.
 */
export const backupAndSendMessages = async () => {
    const rooms = await Room.find().populate('host', 'username email');

    if (!rooms.length) {
        console.log('📦 No rooms found, skipping backup.');
        return;
    }

    const backup = [];

    for (const room of rooms) {
        const messages = await Message.find({ room: room._id })
            .populate('sender', 'username email')
            .sort({ createdAt: 1 });

        if (!messages.length) continue;

        backup.push({
            roomName: room.name,
            roomCode: room.code,
            createdAt: room.createdAt,
            host: {
                username: room.host?.username || 'Unknown',
                email: room.host?.email || 'Unknown',
            },
            messageCount: messages.length,
            messages: messages.map(m => ({
                sender: m.sender?.username || 'Deleted User',
                email: m.sender?.email || '',
                text: m.text,
                sentAt: m.createdAt,
            })),
        });
    }

    if (!backup.length) {
        console.log('📦 No messages to backup.');
        return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `talkrooms200_backup_${timestamp}.json`;
    const jsonContent = JSON.stringify(backup, null, 2);

    await sendToTelegram(fileName, jsonContent);
    console.log(`✅ Backup sent to Telegram: ${fileName} (${backup.length} rooms, ${backup.reduce((acc, r) => acc + r.messageCount, 0)} messages)`);
};

/**
 * Sends a JSON string as a document to Telegram using the Bot API.
 */
const sendToTelegram = async (fileName, jsonContent) => {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn('⚠️ Telegram credentials not set. Skipping backup send.');
        return;
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`;

    // Build multipart form data manually using Blob + FormData
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('document', blob, fileName);
    formData.append('caption', `📦 TalkRooms200 Daily Backup — ${new Date().toISOString().split('T')[0]}`);

    const response = await fetch(url, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Telegram API error: ${response.status} — ${error}`);
    }
};
