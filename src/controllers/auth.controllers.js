import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js"
import { User } from "../models/user.models.js";
import { emailVerificationContentGeneration, forgotPasswordEmailGeneration, sendEmail } from "../utils/email.js";
import jwt from "jsonwebtoken"
import crypto from "crypto";

// function to generate access token and refresh token, access token will be send to the user and refresh token will be saved into db, somebody will pass me userid
const generateAccessAndRefreshToken = async (userId) => {
     try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}

     } catch (error) {
        throw new ApiError(500, "something went wrong will generating access or refresh token")
     }
}

//asyncHandler - it removes writing of try catch inside controller
const registerUser = asyncHandler(async(req, res) => {
    //1. accepting the user data
    // req.body - this will give all the data, we just have to destructure that
    const {username, email, password, role} = req.body;

    //3. checking if the user already exists in the DB (either username or email exists then we assume user already exists)
    //database call always returns promise because it will take time that's why we will wait until that promise is resolved
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    //validate if the user exists then throw error otherwise save the user in the database
    if(existedUser){
        //i don't want to proceed, i want to return an error message
        throw new ApiError(409, "User already exists with the username or email", [])
    }

    //4. saving the user to the database if it doesn't exists in the database(we are not saving all the data instead some of the fields only)
    const newUser = await User.create({
        email,
        username,
        password,
        isEmailVerified: false
    })

    //5. send verification email to the user - for this will generate tokens we have defined inside userSchema and save into the db and will send to user also.
   const {unHashedToken, hashedToken, tokenExpiry} = newUser.generateTemporaryToken();

   //we are saving the data for the two fields of the userschema
   newUser.emailVerificationToken = hashedToken;
   newUser.emailVerificationExpiry = tokenExpiry;

   newUser.save({validateBeforeSave: false})

   //sending email so that we can send these tokens to the user also.
   sendEmail({
    to: newUser?.email,
    subject: "Please verify your email",
    mailgenContent: emailVerificationContentGeneration({
        username: newUser.username,
        verificationUrl: `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}`//generating the url dynamically where protocol means http or https and host means localhost or example.com
    })
   })   

   //6. sending response back to the requested api

   //(we don't want to send all the details of the user as a response)
   const selectedFieldsForResponse = await User.findById(newUser._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry")

   return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            {user: selectedFieldsForResponse},
            "User registered successfully"
        )
    )
})

//controller for user login
const loginUser = asyncHandler(async(req, res) => {

    //taking the data from the user
    const {email, password} = req.body

    if(!email){
        throw new ApiError(400, "email is required")
    }

    const user = await User.findOne({email})

    if(!user){
        throw new ApiError(400, "User does not exists")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(400, "Invalid Credentials")
    }

    //generate tokens
   const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

   //we will send user info as the data as a response but we will not send all the fileds of the user, only send selected fields
   const loggedInUser = await User.findById(user._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry")

   //cookie accepts some options which is nothing but simple object
   const options = {
    httpOnly: true,
    secure: true
   }

   //send the cookie along with the data and status code in response
   return res
    .status(200)
    .cookie("accessToken", accessToken, options)//setting accessToken in cookie
    .cookie("refreshToken", refreshToken, options)//setting refreshToken in cookie
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )
    
})

//controller for user logout
const logoutUser = asyncHandler(async(req, res) => {
    //remove the refresh token from the DB, we will take the help of verifyJWT middleware we have made it will extract user info from the access token and inject into request object
    
    //remove the refresh token from the DB, when we attach verifyJWT in the route it will inject user into req object
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: ""//this is the updated value of refreshToken that is empty string
            }
        },
        {
            new: true//this means give me the most updated object that we have although we are not storing into some variable
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    
    //remove the cookie that is stored in user's browser in response
    return res 
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logout successfully"
            )
        )
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                req.user, 
                "Current user fetched successfully")
        )
})

const verifyEmail = asyncHandler(async(req,res) => {

    //grab the verificationToken from url, like req.body we have req.params
    const {verificationToken} = req.params;
    
    if(!verificationToken){
        throw new ApiError(400, "Email verification token is missing");
    }
    
    //when the user register then we have given unhashedToken to the user in the email and saved hashedToken in the DB, we now hashed the unhashed one and match with the db, if matches then the email will be verified
    // For hashing use the crypto module
    const hash = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
    
    const user = await User.findOne({
        emailVerificationToken: hash,
        emailVerificationExpiry: {$gt: Date.now()}
    })
    
    if(!user){
        throw new ApiError(400, "Token is invalid or expired")
    }

    user.isEmailVerified = true;

    //cleanup the email verification field as the email is verified
    user.emailVerificationToken = undefined
    user.emailVerificationExpiry = undefined
    
    await user.save({validateBeforeSave: false})

    //sending the response back to the user
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    isEmailVerified: true,
                },
                "Email is verified successfully"
            )
        )
        
})

const resendEmailVerification = asyncHandler(async(req, res) => {
    //we will send the verification email to those who are logged in, if the user is logged in then we have generated access and refresh token, we will use verifyJWT as the middleware to set the req.user
    const user = await User.findById(req.user?._id)
    
    if(!user){
        throw new ApiError(404, "User does not exist.")
    }
    
    if(user.isEmailVerified){
        throw new ApiError(409, "Email is already verified.")
    }
    
    //send the email with verification token and store the hashed token in the db also
    // It is a best practice to send unhashedToken to the user and save hashed to the DB
    const {unHashedToken, hashedToken, tokenExpiry} = user.generateTemporaryToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    user.save({validateBeforeSave: false})

    await sendEmail({
        to: user?.email,
        subject: "Please verify your email",
        mailgenContent: emailVerificationContentGeneration({
            username: user.username,
            verificationUrl: `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
        })
   })  

   return res
   .status(200)
   .json(
        new ApiResponse(
            200,
            {},
            "Mail has been sent to your email ID"
        )
    )

})

const refreshAccessToken = asyncHandler(async(req, res) => {
    //when the user hits this route, then browser automatically sends the cookie also which has tokens
    const incomingRefreshToken = req.cookies.refreshToken;

    //if there is no incomingRefreshToken then we should not refresh access token
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized access")
    }
    
   try {
        //decode the refresh token as we have stored user info into it
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)
        
        if(!user){
            throw new ApiError(400, "Invalid refresh token")
        }

        //if there is no refresh token presnt on the db then we have to check that also(extra security check)
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(400, "Refresh Token is expired");
        }

        //generating access token
        const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefreshToken(user._id)
        
        //add the newly generated refresh token to the db
        user.refreshToken = newRefreshToken;
        await user.save()

        //send the newly generated token to user via cookies
        const options = {
            httpOnly: true,
            secure: true
        }
        
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200, 
                    {
                        accessToken, refreshToken: newRefreshToken
                    },
                    "Access token is refreshed successfully"
                )
            )
        } catch (error) {
    throw new ApiError(400, "Invalid refresh token")
   }
})

const forgotPasswordRequest = asyncHandler(async(req, res) => {
    const {email} = req.body;

    const user = await User.findOne({email});
    
    if(!user){
        throw new ApiError(404, "User does not exists");
    }
    
    const {unHashedToken, hashedToken, tokenExpiry} = await user.generateTemporaryToken()

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;
    await user.save({validateBeforeSave: false})

    await sendEmail({
        to: user?.email,
        subject: "Password reset request",
        mailgenContent: forgotPasswordEmailGeneration(
            user?.username,
            `${req.protocol}://${req.get("host")}/api/v1/auth/reset-password/${unHashedToken}`
        )
    })

    return res  
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset mail has been sent on your email ID"
            )
        )
}) 

const resetForgotPassword = asyncHandler(async(req, res) => {
    const {newPassword} = req.body;
    const {resetToken} = req.params;

    const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");


    //we are finding the user in the db based on hashedToken and also we should concern about password expiry that means the link should be clicked within time limit
    const user = await User.findOne({forgotPasswordToken: hashedToken, forgotPasswordExpiry: {$gt: Date.now()}})

    if(!user){
        throw new ApiError(400, "Token is invalid or expired")
    }

    // set the new password to the db and also cleanup password token and expiry because we are done
    user.password = newPassword;
    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;

    await user.save({validateBeforeSave: false})

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset successfully"
            )
        )
})

//for the users who are already logged in and want to change password
const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body;

    //we cannot match the password directly because they are hashed
    const user = await User.findById(req.user?._id);

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid){
        throw new ApiError(400, "Old password is not valid")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res  
        .status(200)
        .json(
            new ApiResponse(200,
                {},
                "Password Changed Successfully"
            )
        )
})

export {registerUser, loginUser, logoutUser, getCurrentUser, verifyEmail, resendEmailVerification, refreshAccessToken, forgotPasswordRequest, resetForgotPassword, changeCurrentPassword}