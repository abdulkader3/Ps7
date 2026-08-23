import { Router } from "express";
import { JWTverify } from "../middlewares/auth.middleware.js";
import { subscribe_to_channel, unsubscribe_to_channel } from "../controllers/subscription.controller.js";


const router = Router();


// subscribe
router.route("/subscribe/:channel_id").post(JWTverify, subscribe_to_channel)


// unsubscribe
router.route("/unsubscribe/:channel_id").post(JWTverify, unsubscribe_to_channel)


export default router;