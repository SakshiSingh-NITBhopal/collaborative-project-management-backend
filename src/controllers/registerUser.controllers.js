import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js"
import { User } from "../models/user.models.js";
import { emailVerificationContentGeneration, sendEmail } from "../utils/email.js";

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

   res
    .status(201)
    .json(
        new ApiResponse(
            200,
            {user: selectedFieldsForResponse},
            "User registered successfully"
        )
    )
})

export {registerUser};