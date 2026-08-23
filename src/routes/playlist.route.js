import { Router } from "express";
import { JWTverify } from "../middlewares/auth.middleware.js";
import { add_video_in_playlist, create_playlist, get_playlist } from "../controllers/playlist.controller.js";



const router = Router();


// get playlist
router.route("/").get(JWTverify, get_playlist);

// create playlist
router.route("/create-playlist").post(JWTverify, create_playlist);

// add video in playlist [playlist,video]

router.route("/add-video-in-playlist/:playlist/:video").post(JWTverify, add_video_in_playlist);





export default router;