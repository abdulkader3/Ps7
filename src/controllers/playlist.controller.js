import { asyncHandlers } from "../utils/asyncHandlers.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";




const get_playlist = asyncHandlers(async (req,res) => {
    
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



export{
    get_playlist,
    create_playlist,
}