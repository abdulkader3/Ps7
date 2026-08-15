import mongoose from "mongoose";
import { DB_Name } from "../constance.js";


const ConnectDB = async () => {
    try {
        
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`);
        console.log(`DB connected successfully 😍👍 Host : ${connectionInstance.connection.host}`);

    } catch (error) {
        console.log("MongoDB connection Error src > db > index.js ", error);
        process.exit(1);
    }
}

export{ConnectDB}