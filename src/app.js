import express from "express"
import cors from 'cors'

const app = express();

//basic configurations
app.use(express.json({limit : "16kb"}));
app.use(express.urlencoded({extended: true, limit : "16kb"}));
app.use(express.static("public"));

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

export default app;