import { asyncHandlers } from "../utils/asyncHandlers.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";




const JWTverify = asyncHandlers( async (req,res,next) => {
    try {
        
        const token = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "");

        if(!token){
            throw new ApiError(401, "invalidate token or missing token");
        }

        const decodeToken = await jwt.verify(token, process.env.REFRESH_TOKEN_SECRETE)
        if(!decodeToken){
            throw new ApiError(401, "invalidate token");
        };

        // console.log("decode refreshToken : ", decodeToken || "token invalidate"); // only for development

        const userDB = await User.findById(decodeToken?._id).select("-password");
        if(!userDB){
            throw new ApiError(404, "token expired")
        }

        req.user = userDB;
        next();

    } catch (error) {
        throw new ApiError(401, "User is not logged in!\nsrc > middleware > auth.middleware.js : also token not validate")
    }
} )



const JWTverifyOptional = asyncHandlers( async (req,res,next) => {
    try {
        
        const token = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "");

        if(!token){
            req.user = null;
            return next();
        }

        const decodeToken = await jwt.verify(token, process.env.REFRESH_TOKEN_SECRETE)
        if(!decodeToken){
            req.user = null;
            return next();
        };

        console.log("decode refreshToken : ", decodeToken || "token invalidate"); // only for development

        const userDB = await User.findById(decodeToken?._id).select("-password");
        if(!userDB){
            req.user = null;
            return next();
        }

        req.user = userDB;
        next();

    } catch (error) {
        req.user = null;
        return next();
    }
} )


export{JWTverify,JWTverifyOptional};