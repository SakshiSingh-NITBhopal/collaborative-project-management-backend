import dotenv from 'dotenv';
import app from "./app.js";
import connectDB from './db/db-connection.js';
dotenv.config({
    path : "./.env"
})

const port = process.env.PORT || 3000;

connectDB()
    .then(() => {
        app.listen(port, () => {
        console.log(`server is listening to port http://localhost:${port}`);
})
    })
    .catch((err) => {
        console.error("Mongodb connection failed :", err);
        process.exit(1);
    })