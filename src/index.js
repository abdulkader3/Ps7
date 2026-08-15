import dotenv from "dotenv";
import { ConnectDB } from "./db/index.js";
import { app } from "./app.js";
dotenv.config({path: "./.env"})
ConnectDB()

.then(()=>{
    const port = process.env.PORT || 4000;

    app.listen(port, ()=>{
        console.log(`app running on port http://localhost:${port}`)
    })
})

.catch((error)=>{
    console.log("connection error src > index.js : ", error)
})