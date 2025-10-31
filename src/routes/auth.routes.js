import {Router} from "express"
import {registerUser} from "../controllers/auth.controllers.js"
import { validate } from "../middlewares/validator.middleware.js";
import { userRegisterationValidator } from "../validators/index.js";
import { loginUser } from "../controllers/auth.controllers.js";
import { userLoginValidator } from "../validators/index.js";

const router = Router();

//when the request comes into /register then we do run registerUser but now we want to implement some middleware between them, that's why we have imported validate and userRegisterationValidator, we have to run userRegisterationValidator() this method and don't run validate() we just have to pass the reference
router.route("/register").post(userRegisterationValidator(), validate, registerUser)

router.route("/login").post(userLoginValidator(), validate, loginUser)

export default router;