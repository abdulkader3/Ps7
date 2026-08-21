import { asyncHandlers } from "../utils/asyncHandlers.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";



// get a channel details from database with Aggregation pipeline 
const getChannel_details_DB = asyncHandlers( async (req,res) => {

    // get channel username from params
    const {username} = req.params;
    if(!username){
        throw new ApiError(401, "Channel's username is required")
    }
    const userName = username.toLowerCase();
    // console.log("from params : ", userName); // only for development

    const channel_details_DB = await User.aggregate([
        {
            $match : {userName}
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "channels_subscriber"
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "channels_user_subscribed_to"
            }
        },
        {
            $addFields : {
                channels_subscriber_count : { $size : "$channels_subscriber" },
                channels_user_subscribed_to_count : { $size : "$channels_user_subscribed_to" },

                is_logged_in_user_subscribed : {
                    $cond : {
                        if : { $in : [req.user?._id, "$channels_subscriber.subscriber"] },
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
            $project : {
                userName   : 1,
                fullName   : 1,
                email      : 1,
                avatar     : 1,
                coverImage : 1,
                channels_subscriber_count         : 1,
                is_logged_in_user_subscribed      : 1,
                channels_user_subscribed_to_count : 1
            }
        }
    ])

    if(!channel_details_DB.length){
        throw new ApiError(404, "channel not found")
    }

    console.log(channel_details_DB && "channel Found 😍👍👍👍 ✅")  // development only


    return res 
    .status(200)
    .json(
        new ApiResponse(200, channel_details_DB[0], "Channel fetched successfully from database 😍👍")
    )
} )

// get user watch History
const user_watch_history_DB = asyncHandlers( async (req,res) => {
    

    // start writing aggregate
    const userDB = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        userName : 1,
                                        email : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }
                ]

            }
        }
    ])


    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            userDB[0].watchHistory,
            "user watch history fetched successfully 😍👍"
        )
    )
})



export{
    getChannel_details_DB,
    user_watch_history_DB
}