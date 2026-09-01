import { Router } from "express";
import { JWTverify } from "../middlewares/auth.middleware.js";
import {  get_comment } from "../controllers/comment.controller.js";
import { createTweets, delete_a_tweet, get_tweets } from "../controllers/tweets.controller.js";



const router = Router();



// get comment
router.route("/:video").get(get_tweets);

// Tweets in a video
router.route("/:video").post(JWTverify, createTweets );

// delete comment
router.route("/delete/:tweet").post(JWTverify, delete_a_tweet);



export default router;