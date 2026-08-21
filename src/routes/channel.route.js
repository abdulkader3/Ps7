import Router from "express"
import { JWTverify } from "../middlewares/auth.middleware.js";
import { getChannel_details_DB, user_watch_history_DB } from "../controllers/channel.controller.js";


const router = Router()



// get channel details from database throw username and injected auth middleware
router.route("/user-channel/:username").post(JWTverify, getChannel_details_DB);

// get user watch History
router.route("/get-user-watchHistory").post(JWTverify, user_watch_history_DB);




export default router;