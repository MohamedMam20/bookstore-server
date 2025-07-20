const {body} = require("express-validator"); //i will validate the body
const User = require("../models/usersModel");

const emailValidation = body("email").isEmail().withMessage("Please Enter A Valid Email").custom(async (email) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Email already exists");
    }
    return true;
  });


const emailloginValidation = body("email").isEmail().withMessage("Please Enter A Valid Email").custom(async (email) => {
    const existingUser = await User.findOne({ email });
    if (existingUser=== null) {
      throw new Error("Email or Password Not Found");
    }
  });


  
const passwordValidation = body("password").isLength({min:8,max:16}).withMessage("password must be between 8-16").matches(/^(?=.*[a-z])/)
  .withMessage("Password must contain at least one lowercase letter")
  .matches(/^(?=.*[A-Z])/)
  .withMessage("Password must contain at least one uppercase letter")
  .matches(/^(?=.*\d)/)
  .withMessage("Password must contain at least one number")
  .matches(/^(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?])/)
  .withMessage("Password must contain at least one special character");



const firstNameValidation = body("firstName").trim().escape().isString().notEmpty().withMessage("Please Enter A Valid Name");
const lastNameValidation = body("lastName").trim().escape().isString().withMessage("Please Enter A Valid Name");



const passwordConfirm = body("confirmPassword").custom((value,{req})=>{
    if(value!=req.body.password){
        throw new Error("passwords don't match");
    }
    return true;
})

const oldpasswordValidation = body("oldPassword").isLength({min:8,max:16}).optional().withMessage("password must be between 8-16");
const newpasswordValidation = body("newPassword").isLength({min:8,max:16}).optional().withMessage("password must be between 8-16")  .matches(/^(?=.*[a-z])/)
  .withMessage("Password must contain at least one lowercase letter")
  .matches(/^(?=.*[A-Z])/)
  .withMessage("Password must contain at least one uppercase letter")
  .matches(/^(?=.*\d)/)
  .withMessage("Password must contain at least one number")
  .matches(/^(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?])/)
  .withMessage("Password must contain at least one special character");




module.exports={
    emailValidation, passwordValidation, firstNameValidation,lastNameValidation,passwordConfirm,emailloginValidation,oldpasswordValidation,newpasswordValidation
}

