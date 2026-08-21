import { Router } from "express";
import { changeAvatar, changeCoverImage, changeUser_email, changeUser_fullName, changeUserPassword, get_new_refreshed_token, getCurrentUserData_DB, loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { JWTverify } from "../middlewares/auth.middleware.js";



const router = Router();


// register and multer middleware
router.route("/register").post(upload.fields([
    {name : "avatar", maxCount : 1},
    {name : "coverImage", maxCount : 1}
]), registerUser);

// login user and auth middleware is not needed 
router.route("/login").post(loginUser);








// secure route   ////////////////////////////////////////////////


// logout user and injected auth middleware
router.route("/logout").post(JWTverify, logoutUser);

// get current user data from database and injected auth middleware
router.route("/get-user-data").post(JWTverify, getCurrentUserData_DB);

// get current user new refreshed token and injected auth middleware
router.route("/refreshed-token").post(JWTverify, get_new_refreshed_token);

//change user password and injected auth middleware
router.route("/change-password").post(JWTverify, changeUserPassword);

// change user Full name and and injected auth middleware
router.route("/change-fullName").post(JWTverify, changeUser_fullName);

// change user Email and and injected auth middleware
router.route("/change-email").post(JWTverify, changeUser_email);

// change user Avatar and injected auth middleware
router.route("/change-avatar").post(JWTverify, upload.single('avatar'), changeAvatar);

// change user coverImage and injected auth middleware
router.route("/change-coverImage").post(JWTverify, upload.single('coverImage'), changeCoverImage);




export default router;