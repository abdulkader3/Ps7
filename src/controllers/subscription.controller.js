import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandlers } from "../utils/asyncHandlers.js";



const subscribe_to_channel = asyncHandlers( async (req,res) => {
    
    // is user logged in
    console.log(req.user?._id ? "user logged in": "user logged out");

    // get channel id
    const {channel_id} = req.params;
    if(!channel_id || channel_id.trim() === ""){
        throw new ApiError(400, "channel id is required!")
    }

    // check is user already subscribed ?
    const alreadySubscribed = await Subscription.findOne(
        {channel :channel_id},
        { subscriber : req.user._id}
    )
    if(alreadySubscribed){
        throw new ApiError(400, "user already subscribed to this channel's")
    }

    const channelSubscription = await Subscription.create({
        channel : channel_id,
        subscriber : req.user._id
    })

    if(!channelSubscription){
        throw new ApiError(500, "Sorry, server issue. We couldn't create a database entry for your subscription.")
    }


    return res
    .status(200)
    .json(
        new ApiResponse(200, channelSubscription, `${req.user?.userName} is subscribed to this channel's`)
    )



} );


const unsubscribe_to_channel = asyncHandlers( async (req,res) => {
    
    // is user logged in to unsubscribe a channel's ?
    console.log(req.user?._id && "user is logged in") // only for development

    // get channel id
    const {channel_id} = req.params;
    if(!channel_id || channel_id.trim() === ""){
        throw new ApiError(400, "channel id is required!")
    }

    // get channel from database
    const channelDB = await Subscription.findOneAndDelete({
        channel : channel_id,
        subscriber : req.user._id
    })

    if(!channelDB){
        throw new ApiError(400, "User is not subscribed to this channel. ")
    }

    // return
    return res
    .status(200)
    .json(
        new ApiResponse(200,{}, `${req.user.userName} is unsubscribe to this channel's`)
    )
} );



export{
    subscribe_to_channel,
    unsubscribe_to_channel
}