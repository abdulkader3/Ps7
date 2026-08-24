import { Router } from "express";
import { JWTverify } from "../middlewares/auth.middleware.js";
import { commentCreate, delete_a_comment, get_comment } from "../controllers/comment.controller.js";



const router = Router();



// get comment
router.route("/:video").get(get_comment);

// comment in a video
router.route("/:video").post(JWTverify, commentCreate);

// delete comment
router.route("/delete/:comment").post(JWTverify, delete_a_comment);



export default router;