import { Router } from "express";
import { JWTverify, JWTverifyOptional } from "../middlewares/auth.middleware.js";
import { playVideo, upload_video } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";




const router = Router();



// upload video
router.route("/upload").post(JWTverify, upload.fields([
    {name : "video", maxCount : 1},
    {name : "thumbnail", maxCount : 1}
]) , upload_video);


// play video and views
router.route("/:video_id").post(JWTverifyOptional , playVideo)





export default router;