import { asyncHandlers } from "../utils/asyncHandlers.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comments.model.js";
import { Tweets } from "../models/tweets.model.js";



// get all the tweets
const get_tweets = asyncHandlers( async (req,res) => {
    
    // to get comment user don't have to be logged in

    const {video} = req.params;
    if(!video ||  video.trim() === ""){
        throw new ApiError(400, "video id is required")
    }

    // get comment list
    const tweetsDB = await Tweets.find({ video })

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweetsDB, "all the tweets for this video fetched from database")
    )
} );

// create Tweets
const createTweets = asyncHandlers( async (req,res) => {
    
    // we have user - get video id
    const {video} = req.params;

    if(!video || video.trim() === ""){
        throw new ApiError(400, "video id is required")
    }

    // get the content
    const {content} = req.body;

    if(!content || content.trim() === ""){
        throw new ApiError(400, "content is required")
    }

    // find the video
    const videoDB = await Video.findById(video);
    if(!videoDB){
        throw new ApiError(404, "video not found - id you provided that is most likely to be incorrect")
    }

    // create the comment model schema
    const tweets = await Tweets.create({
        content,
        video,
        owner : req.user?._id
    })

    if(!tweets){
        throw new ApiError(500, "Sorry, we failed to create a database entry for your comment")
    }

    // return response
    return res
    .status(201)
    .json(
        new ApiResponse(201,tweets,"Your Tweet is placed under the video successfully")
    )

} );


// now delete the comment
const delete_a_tweet = asyncHandlers( async (req,res) => {
    
    // user have to be logged in To determine whether that user is authorized to delete that specific comment 

    const {tweet} = req.params;
    if(!tweet || tweet.trim() === ""){
        throw new ApiError(400, "tweet id is required" )
    }

    const tweetDB = await Tweets.findOneAndDelete(
        {_id : tweet, owner : req.user._id}
    )

    if(!tweetDB){
        throw new ApiError(404, "Tweet not found - maybe user is not authorize")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Tweet is deleted successfully")
    )
} );



export{
    get_tweets,
    createTweets,
    delete_a_tweet
}