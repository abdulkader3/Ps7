import mongoose, { Schema } from "mongoose";


const tweetsSchema = new Schema({
    content : {
        type : String
    },
    video : {
        type : Schema.Types.ObjectId,
        ref : "Video"
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }
},{timestamps : true});



export const Tweets = mongoose.model("Tweets", tweetsSchema);