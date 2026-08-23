import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";




const app = express();


app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))


app.use(express.urlencoded({limit: "16kb",extended : true}))
app.use(express.json({limit: "16kb"}))
app.use(express.static('public'))
app.use(cookieParser())


// import router
import userRouter from "./routes/user.route.js"
import channelRouter from "./routes/channel.route.js";
import videoRouter from "./routes/video.route.js";
import subscriptionRouter from "./routes/subscription.route.js";
import playlistRouter from "./routes/playlist.route.js";





// route
app.use("/api/v1/users", userRouter);

//route channel
app.use("/api/v1/channel", channelRouter);

// route video
app.use("/api/v1/videos", videoRouter);

// route subscription
app.use("/api/v1/subscription", subscriptionRouter);

// route playlist
app.use("/api/v1/playlist", playlistRouter);


export{app};