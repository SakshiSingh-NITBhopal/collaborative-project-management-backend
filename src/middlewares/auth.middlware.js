//We don't want to decode access token in multiple controllers that's why we have written separate middleware for decoding access token
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// in all the middleware's there is "next"
export const verifyJWT = asyncHandler(async(req, res, next) => {
    //accessing the token from either cookie or bearer header. Actually in the Bearer token we want only the token value not the Bearer space tokenValue that's why we cut out the Bearer space from the token and extract its value only using js replace(). And in the cookie carefully write the accessToken name and it is just same as accessToken you have passed as a response to the user 
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
    if(!token){
        throw new ApiError(400, "Unauthorized request")
    }

    //decode the token using jwt module, we're using try-catch even if there is asyncHandler because we want to be very careful
    try {
        //jwt has verify() to decode and verify the token, we just need to pass the secret also without which it cannot be decoded
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        //extracting user info from the db for injecting into req object. Actually we had injected _id, username and email into accessToken and we are accessing _id and searching for that particular user
        const user = await User.findById(decodedToken._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry");

        //if the user does not exist then throw error
        if(!user){
            throw new ApiError(401, "Invalid access token")
        }

        //inject new prop into "req" which is user and whose value is the user we have extracted above
        req.user = user
        //then hop onto next middleware or the controller itself
        next()
    } catch (error) {
        throw new ApiError(401, "Invalid access token")
    }
})