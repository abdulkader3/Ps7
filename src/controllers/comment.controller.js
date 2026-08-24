import { asyncHandlers } from "../utils/asyncHandlers.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comments.model.js";



// get all the comment
const get_comment = asyncHandlers( async (req,res) => {
    
    // to get comment user don't have to be logged in

    const {video} = req.params;
    if(!video ||  video.trim() === ""){
        throw new ApiError(400, "video id is required")
    }

    // get comment list
    const commentDB = await Comment.find({ video })

    return res
    .status(200)
    .json(
        new ApiResponse(200, commentDB, "all the comment for this video fetched from database")
    )
} );

// create comment
const commentCreate = asyncHandlers( async (req,res) => {
    
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
    const comment = await Comment.create({
        content,
        video,
        owner : req.user?._id
    })

    if(!comment){
        throw new ApiError(500, "Sorry, we failed to create a database entry for your comment")
    }

    // return response
    return res
    .status(201)
    .json(
        new ApiResponse(201,comment,"Your comment is placed under the video successfully")
    )

} );


// now delete the comment



export{
    commentCreate,
    get_comment
}