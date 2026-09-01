import fs from "fs";
import { asyncHandlers } from "../utils/asyncHandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary, deleteFileOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import { emailValidator } from "../utils/helper/email.validator.js";




// generate AccessToken And refreshToken and save in database
const generateAccessTokenAndRefreshToken_saveDB = async (user_id) => {
    try {
        const userDB = await User.findById(user_id);

        const accessToken  = userDB.generateAccessToken();
        const refreshToken = userDB.generateRefreshToken();

        userDB.refreshToken = refreshToken;
        await userDB.save({validateBeforeSave : false});

        return {accessToken,refreshToken};

    } catch (error) {
        throw new ApiError(500, "Sorry, we couldn't generate token for our user right now")
    }
}



// user Register
const registerUser = asyncHandlers( async (req,res) => {
    // get user data from frontend
    const {userName,fullName,email,password} = req.body;

    if(!emailValidator(email)){
        fs.unlinkSync(req.files?.avatar[0].path);
        fs.unlinkSync(req.files?.coverImage[0].path);
        throw new ApiError(400, "Invalid Email address")
    }
    console.log(`username : ${userName} \n fullName : ${fullName} \n email : ${email} \n password : ${password && "*******"}`) // only for development

    // validate user data in case of error delete file [avatar,coverImage]
    if([userName,fullName,email,password].some((superman)=> superman.trim() === "" ) ){
        fs.unlinkSync(req.files?.avatar[0].path);
        fs.unlinkSync(req.files?.coverImage[0].path);
        throw new ApiError(401, "All fields are required");
        
    }

    // check user already exist or not
    const userAlreadyExist = await User.findOne(
        {
            $or : [{ userName },{ email }]
        }
    )
    if(userAlreadyExist){
        fs.unlinkSync(req.files?.avatar[0].path);
        fs.unlinkSync(req.files?.coverImage[0].path);
        throw new ApiError(401, "user already exist")
    }


    // get user file & validate file
    const avatarLocalFilePath = req.files?.avatar[0]?.path;
    if(!avatarLocalFilePath){
        throw new ApiError(401, "avatar is required")
    }

    let coverImageLocalPath ;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalFilePath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError(500, "Sorry, we failed to upload the user avatar to the cloudinary");
    };

    // create database entry
    const userDB = await User.create(
        {
            userName : userName.toLowerCase(),
            
            fullName,
            email,
            password,
            
            avatar : avatar.url,
            avatar_public_id : avatar.public_id,

            coverImage : coverImage?.url || "",
            coverImag_public_id : coverImage?.public_id || ""

        }
    )

    // validate
    if(!userDB){
        throw new ApiError(500, "Sorry, our server failed to create a database entry for the user")
    }

    // remove password and refreshToken for response
    const userSecure = userDB.toObject();
    delete userSecure.password;
    delete userSecure.refreshToken;

    // return response
    return res
    .status(201)
    .json(
        new ApiResponse(201,userSecure,"user registered successfully 😍👍")
    )
} )

// user Login
const loginUser = asyncHandlers( async (req,res) => {
   // get user data from frontend
   const {userName,email,password} = req.body;
    console.log(`username : ${userName} \n email : ${email} \n password : ${password && "*******"}`) // only for development

   
   // validate user data is it Empty
   if(!userName && !email){
    throw new ApiError(401, "username or email are required")
   }
   if(!password){
    throw new ApiError(401, "password is required")
   }

   // check use is even exist ? or not
   const userDB = await User.findOne(
    {
        $or : [{userName},{email}]
    }
   )
   if(!userDB){
    throw new ApiError(404, "user not found")
   }


   // check user password
   const checkPassword = await userDB.isPasswordCorrect(password)
   if(!checkPassword){
    throw new ApiError(401, "incorrect password")
   }

   // generate token
   const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken_saveDB(userDB?._id);

   // options
   const options = {
    httpOnly : true,
    secure : true
   }

   // remove password and refreshToken
   const userSecure = userDB.toObject();
   delete userSecure.password;
   delete userSecure.refreshToken;


   // return response
   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
    new ApiResponse(200,userSecure,"user logged in successfully 😍👍")
   )
} )

// user Logout
const logoutUser = asyncHandlers( async (req,res) => {

    const userDB = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {refreshToken : ""}
        },
        {
            returnDocument : "after"
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200,{}, "user logged out successfully 😅👍")
    )
    
} )

// get current user data from database
const getCurrentUserData_DB = asyncHandlers( async (req,res) => {
    // injected middleware ?

    // console.log("yes user logged in") // only for development

    const user = req.user.toObject()

    return res.status(200).json( new ApiResponse(200, user, "User data fetched successfully 😍👍") )
} )

// refresh token
const get_new_refreshed_token = asyncHandlers( async (req,res) => {
    // get user id from injected middleware
    const user_id = req.user?._id;
    
    // get user model 
    const user = await User.findById(user_id).select("-password -refreshToken");

    // generate token
    const {accessToken,refreshToken} = await generateAccessTokenAndRefreshToken_saveDB(user_id);

    // options
    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,
            {
                user , accessToken : accessToken, refreshToken : refreshToken
            },
            "User's token has been refreshed successfully 😍👍"
        )
    )
} )

// change password
const changeUserPassword = asyncHandlers( async (req,res) => {
    // console.log("we are in conrtrooler.js") // development only
    const {oldPassword, newPassword} = req.body;
    console.log(`user Old Password : ${oldPassword && "********"} \n user new password : ${newPassword && "********"}`) // development only

    if([oldPassword,newPassword].some( (superman)=> superman.trim() === "" ) ){
        throw new ApiError(401, "Both Old and new password is required")
    }

    // get user from db
    const userDB = await User.findById(req.user?._id).select("-refreshToken");
    if(!userDB){
        throw new ApiError(404, "Sorry, we couldn't get the user from the database" )
    };


    // check password 
    const checkPassword = await userDB.isPasswordCorrect(oldPassword);
    if(!checkPassword){
        throw new ApiError(401, "incorrect password!")
    }

    userDB.password = newPassword;
    await userDB.save({validateBeforeSave : false});

    return res
    .status(200)
    .json(
        new ApiResponse(200,{}," User password changed successfully 😍👍")
    )
} )

// change user Full Name
const changeUser_fullName = asyncHandlers( async (req,res) => {
   // injected middleware //done
   
   // get user data 
   const {fullNameNew} = req.body;
   if(!fullNameNew){
    throw new ApiError(401, "New full name is required to change")
   }

   // update new fullName in database
   const userDB = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set : {fullName : fullNameNew}
    },
    {
        returnDocument : "after"
    }
   ).select("-password -refreshToken");

   if(!userDB){
    throw new ApiError(500, "Sorry, we couldn't save your full name to our database")
   }

   console.log(userDB && "it's Done !")

   return res
   .status(200)
   .json(
        new ApiResponse(200, userDB, "full name updated successfully 😍👍")
   )
} )

// change user email
const changeUser_email = asyncHandlers( async (req,res) => {
   // injected middleware //done
   
   // get user data 
   const {emailNew} = req.body;
   if(!emailNew){
    throw new ApiError(401, "New email is required to change")
   }

   // update new fullName in database
   const userDB = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set : {email : emailNew}
    },
    {
        returnDocument : "after"
    }
   ).select("-password -refreshToken");

   if(!userDB){
    throw new ApiError(500, "Sorry, we couldn't save your email to our database")
   }

   console.log(userDB && "it's Done !")

   return res
   .status(200)
   .json(
        new ApiResponse(200, userDB, "email updated successfully 😍👍")
   )
} )
// same as fullname & i'll do it letter


// change avatar
const changeAvatar = asyncHandlers( async (req,res) => {
    // injected middleware // done

    console.log(req.user && "user is logged in")

    // get user old avatar public_id to delete
    const old_public_id = req.user?.avatar_public_id;
    console.log('old public_id : ', old_public_id);

    // get local file to upload
    const avatarLocalFilePath = req.file?.path; // Since we are taking only a single file,
    console.log(avatarLocalFilePath);          // that's why we don't have to specify the name. Just the file?.path is enough here.

    if(!avatarLocalFilePath){
        throw new ApiError(401, "avatar is required")
    }

    const updated_Avatar = await uploadOnCloudinary(avatarLocalFilePath);
    if(!updated_Avatar){
        throw new ApiError(500, "Sorry, we failed to update your avatar file in our Cloudinary database")
    }

    const delete_Old_Avatar = await deleteFileOnCloudinary(old_public_id);
    console.log(delete_Old_Avatar,"deleted")

    // save in data base
    const userDB = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : updated_Avatar.url,
                avatar_public_id : updated_Avatar.public_id
            }
        },
        {
            returnDocument : "after"
        }
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200, userDB, "user avatar updated successfully 😍👍")
    )
} )

// change coverImage
const changeCoverImage = asyncHandlers( async (req,res) => {
    // injected middleware // done

    console.log(req.user && "user is logged in")

    // get user old avatar public_id to delete
    const old_public_id = req.user?.coverImag_public_id;
    console.log('old public_id : ', old_public_id);

    // get local file to upload
    const coverImageLocalPath = req.file?.path; // Since we are taking only a single file,
    console.log(coverImageLocalPath);          // that's why we don't have to specify the name. Just the file?.path is enough here.

    if(!coverImageLocalPath){
        throw new ApiError(401, "avatar is required")
    }

    const updated_CoverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!updated_CoverImage){
        throw new ApiError(500, "Sorry, we failed to update your avatar file in our Cloudinary database")
    }

    const delete_Old_CoverImage = await deleteFileOnCloudinary(old_public_id);
    console.log(delete_Old_CoverImage,"deleted")

    // save in data base
    const userDB = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverImage : updated_CoverImage.url,
                coverImag_public_id : updated_CoverImage.public_id
            }
        },
        {
            returnDocument : "after"
        }
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200, userDB, "user coverImage updated successfully 😍👍")
    )
} )

// change userName securely one time every 7 days












export{
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUserData_DB,
    get_new_refreshed_token,
    changeUserPassword,
    changeUser_fullName,
    changeAvatar,
    changeCoverImage,
    changeUser_email
}