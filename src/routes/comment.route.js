import { Router } from "express";
import { JWTverify } from "../middlewares/auth.middleware.js";
import { commentCreate, get_comment } from "../controllers/comment.controller.js";



const router = Router();



// get comment
router.route("/:video").get(get_comment);

// comment in a video
router.route("/:video").post(JWTverify, commentCreate);



export default router;