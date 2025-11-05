import {Router} from "express"
import {logoutUser, registerUser} from "../controllers/auth.controllers.js"
import { validate } from "../middlewares/validator.middleware.js";
import { userRegisterationValidator, userForgotPasswordValidator, userLoginValidator, userResetForgotPasswordValidator, userChangeCurrentPasswordValidator } from "../validators/index.js";
import { loginUser } from "../controllers/auth.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlware.js";

const router = Router();

//when the request comes into /register then we do run registerUser but now we want to implement some middleware between them, that's why we have imported validate and userRegisterationValidator, we have to run userRegisterationValidator() this method and don't run validate() we just have to pass the reference

//unsecured routes- does not require verifyJWT
router.route("/register").post(userRegisterationValidator(), validate, registerUser)

router.route("/login").post(userLoginValidator(), validate, loginUser)

router.route("verify-email/:verificationToken").get(verifyEmail)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/forgot-password").post(userForgotPasswordValidator(), validate, forgotPasswordRequest)

router.route("/reset-password/:resetToken").post(userResetForgotPasswordValidator(), validate, resetForgotPassword)

//secured routes- require verifyJWT
router.route("/logout").post(verifyJWT, logoutUser)

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/change-password").post(verifyJWT,userChangeCurrentPasswordValidator(), validate,  changeCurrentPassword)

router.route("/resend-email-verification").post(verifyJWT,resendEmailVerification )

export default router;