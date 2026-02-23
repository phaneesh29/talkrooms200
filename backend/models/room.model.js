import { Schema, model } from 'mongoose';
import { Message } from './message.model.js';

const roomSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    host: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastUsedTime: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

roomSchema.pre('findOneAndDelete', async function () {
    const room = await this.model.findOne(this.getQuery());
    if (room) {
        await Message.deleteMany({ room: room._id });
    }
});

roomSchema.pre('deleteOne', { document: true, query: false }, async function () {
    await Message.deleteMany({ room: this._id });
});

export const Room = model('Room', roomSchema);
