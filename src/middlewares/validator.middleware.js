import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js";

//most of the middlewares have req, res, next in their parameters
const validate = (req, res, next) => {
    //errors is an array here, whatever error is there in the validation it will come into validationResult and we are using then by storing into errors array
    const errors = validationResult(req);

    //if array is empty that means no error is there then we will call next() to do the remaining 
    if(errors.isEmpty()){
        return next()
    }

    //if errors are there then we have to extract error and save into extractedErrors(it has array of objects having err.path as key and err.msg as the value). I have used errors.array() to make sure that errors are actually array and then looping through map(), we can directly push err also in that instead of object
    const extractedErrors = errors.array().map((err) => extractedErrors.push(
        {
            [err.path]: err.msg
        }
    ))

    //then we will throw error and pass this extractedErrors to it.
    throw new ApiError(422, "Received data is not valid", extractedErrors);
}

export {validate}