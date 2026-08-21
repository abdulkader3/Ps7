import { asyncHandlers } from "../utils/asyncHandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";





// upload video
const upload_video = asyncHandlers( async (req,res) => {
    
    // injected auth middleware and multer // done
    console.log(req.user?.userName ? `${req.user?.userName} is logged in`: "user is logged out",req.files?.video && `\n${req.files?.video[0]?.path}`) // development only

    const {title, description} = req.body;

    console.log(title && "we have title", description && "\nwe have description")
} )


// play video
const playVideo = asyncHandlers( async (req,res) => {
    
    // injected auth middleware // done
    console.log(req.user?.userName ? `${req.user?.userName} is logged in` : "user not logged in" ) // for development only

    // get video id from user params
    const {video_id} = req.params;

    console.log(video_id ? `we have video id : ${video_id}` : "we don't have video id") // for development only

    if(!video_id || video_id.trim() === ""){
        throw new ApiError(400, "video is is required")
    }

    const userDB = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $addToSet : {watchHistory : video_id}
        },
        {
            returnDocument : "after"
        }
    )

    const increaseViews = await Video.findByIdAndUpdate(
        video_id,
        {
            $inc : {views : 1}
        },
        {
            returnDocument : "after"
        }
    )

    if(!increaseViews){
        throw new ApiError(500, "Sorry, we are having an issue to increase the views")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, increaseViews , "Your video is ready to watch")
    )
} );



export{
    playVideo,
    upload_video,
}