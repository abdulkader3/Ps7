import { asyncHandlers } from "../utils/asyncHandlers.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";




const get_playlist = asyncHandlers(async (req,res) => {
   
    // get playlist
    const playlist = await Playlist.find({
        owner : req.user?._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, `${req.user?.userName}'s playlist fetched from database`)
    )
});


// create playlist
const create_playlist = asyncHandlers( async (req,res) => {
    
    // get user
    console.log(`${req.user.userName} want's to create a playlist`);

    // get playlist name
    const {playlistName,description,videos} = req.body;
    if(!playlistName || playlistName.trim() === ""){
        throw new ApiError(400, "playlist name is required")
    }

    // create playlist and save
    const playlist_DB = await Playlist.create({
        playlistName,
        description : description || "",
        videos : videos || [],
        owner : req.user._id
    })

    if(!playlist_DB){
        throw new ApiError(500, "Sorry, we couldn't create your playlist at the moment")
    }


    return res
    .status(201)
    .json(
        new ApiResponse(200, playlist_DB, `${req.user.userName} have created ${playlist_DB.playlistName} playlist`)
    )
} );


// add video in playlist
const add_video_in_playlist = asyncHandlers( async (req,res) => {
    
    // get playlist and video
    const {playlist,video} = req.params;

    if([playlist, video].some( (superman)=> superman.trim() === "" ) ){
        throw new ApiError(400, "playlist and video both are required")
    }


    // find and update
    const updatePlaylist_DB = await Playlist.findOneAndUpdate(
        {
            _id : playlist,
            owner : req.user._id

        },
        {
            $addToSet : {
                videos : video
            }
        },
        {
            returnDocument : "after"
        }
    )

    if(!updatePlaylist_DB){
        throw new ApiError(404, "playlist not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatePlaylist_DB, "your video add to your playlist")
    )


} );



export{
    get_playlist,
    create_playlist,
    add_video_in_playlist,
}