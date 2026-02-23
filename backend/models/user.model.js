import { Schema, model } from "mongoose"
import bcryptjs from "bcryptjs";


const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        index: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: 3,
        maxlength: 20,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        trim: true,
        select: false,
    },
    refreshToken: {
        type: String,
        select: false,
    },
    lastJoinedRoom: {
        type: Schema.Types.ObjectId,
        ref: 'Room',
        default: null
    }
}, { timestamps: true })

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return
    this.password = await bcryptjs.hash(this.password, 10)
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcryptjs.compare(password, this.password)
}


export const User = model("User", userSchema)