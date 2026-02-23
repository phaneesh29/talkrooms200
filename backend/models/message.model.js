import { Schema, model } from "mongoose"

const messageSchema = new Schema({
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    text: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true })

export const Message = model('Message', messageSchema);