import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js"
import { User } from "../models/user.models.js";
import { emailVerificationContentGeneration, sendEmail } from "../utils/email.js";
import { verifyJWT } from "../middlewares/auth.middlware.js";


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
        verificationUrl: `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`//generating the url dynamically where protocol means http or https and host means localhost or example.com
    })
   })
   console.log("Heyyo", typeof newUser.username);
   

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

export {registerUser, loginUser, logoutUser};