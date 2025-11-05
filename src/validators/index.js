//we will write all the validation logic into single file by using different functions that's why we have single file named index.js
import { body } from "express-validator"; //we are getting data through the form that comes up in the bosy that's why we are adding validations on the body itself

//this function will return an array containing fields having validation on user registeration
const userRegisterationValidator = () => {
    return[
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
        body("username")
            .trim()
            .notEmpty()
            .withMessage("Username is required")
            .isLowercase()
            .withMessage("Username must be in lowercase")
            .isLength({min: 3})
            .withMessage("Username must be atleast3 characters long"),
        body("password")
            .trim()
            .notEmpty()
            .withMessage("Password is required")

    ]
}

const userLoginValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail(),
            body("password")
            .notEmpty()
            .withMessage("Password is required"), 
    ]
} 

const userForgotPasswordValidator = () => {
    return [
        body("email")
        .isEmail().withMessage("Email is not valid")
        .notEmpty().withMessage("Email is required")
    ]
}

const userResetForgotPasswordValidator = () => {
    return [
        body("newPassword").notEmpty().withMessage("Password is required")
    ]
}

const userChangeCurrentPasswordValidator = () => {
    return [
        body("oldPassword").notEmpty().withMessage("Old password is required"),
        body("newPassword").notEmpty().withMessage("New password is required")
    ]
}

export {userRegisterationValidator, userLoginValidator, userForgotPasswordValidator, userResetForgotPasswordValidator, userChangeCurrentPasswordValidator}