import {ApiResponse} from "../utils/api-response.js"
import { asyncHandler } from "../utils/asyncHandler.js";

//this fmethod will send response when the health check api endpoint is hitted
const healthCheck = asyncHandler((req, res) => {
    res
        .status(200)
        .json(new ApiResponse(200, {message : "server is still running"}));
})

export {healthCheck};