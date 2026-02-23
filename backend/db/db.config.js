import mongoose from "mongoose";
import { MONGO_URI, DB_NAME } from "../constants.js";

export const connectDB = async ()=>{
    try {
        const conn = await mongoose.connect(`${MONGO_URI}/${DB_NAME}`,{autoIndex:false,serverSelectionTimeoutMS:5000});
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log("DB Error",error)
        throw error;
    }
}
