import express from "express"
import cors from 'cors'
import cookieParser from "cookie-parser";

const app = express();

//basic configurations for middlewares- which acts between request and response
app.use(express.json({limit : "16kb"}));
app.use(express.urlencoded({extended: true, limit : "16kb"}));
app.use(express.static("public"));

//making express to acess cookie
app.use(cookieParser())

//cors configurations
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    methods : ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials : true,
    allowedHeaders : ["content-type", "authorization"]
}))

app.get("/", (req, res) => {
    res.send("this is our landing page");
})

app.get("/about", (req, res) => {
    res.send("this is our about page");
})

import healthCheckRoute from "./routes/healthcheck.routes.js"
import registerationRoute from "./routes/auth.routes.js"

app.use("/api/v1/healthcheck", healthCheckRoute);
app.use("/api/v1/auth/", registerationRoute);

export default app;