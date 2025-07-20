require('dotenv').config(); 
const User = require("../models/usersModel");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");


const getAllUsers = async (req, res) => {
 const users = await User.find({}, { name: 1, email: 1 });

 res.status(200).json({
   status: "Success",
   message: "Users fetched successfully",
   data: users,
 });
};

const getmyProfile = async(req,res)=>{
try{
const email = req.user.email;
const user = await User.findOne({ email }).select("-password");


if (!user) {
     return res.status(404).json({ message: "User not found" });
   }

   res.status(200).json({
     status: "Success",
     message: "User profile loaded",
     data: user,
   });
}catch(err){
     res.status(500).json({
     status: "Failure",
     message: "Internal server error",
   });
}
}

const updatemyProfile = async(req,res)=>{
try{
const email = req.user.email;
const updates = req.body;
const user = await User.findOne({email});
const errors = validationResult(req);

if(!errors.isEmpty()){
   return res.status(400).json({
           status: "Failure",
      // message: errors.array(),
                     message: errors.array()[0].msg


   });
} 

   if (!user) {
     return res.status(404).json({ message: "User not found" });
   }

       if (updates.firstName) user.firstName = updates.firstName;
       // if (updates.lastName) user.lastName = updates.lastName;
if (updates.hasOwnProperty("lastName")) {
 if (updates.lastName === "") {
   user.lastName = undefined;
 } else {
   user.lastName = updates.lastName;
 }
}

// Handle phone update
if (updates.hasOwnProperty("phone")) {
  user.phone = updates.phone;
}

// Handle billing address update
if (updates.billingAddress) {
  user.billingAddress = updates.billingAddress;
}

// Handle shipping address update
if (updates.shippingAddress) {
  user.shippingAddress = updates.shippingAddress;
}

// Handle adding a new payment method
if (updates.paymentMethod) {
  if (!user.paymentMethods) {
    user.paymentMethods = [];
  }
  
  // If this is the first payment method, make it default
  if (user.paymentMethods.length === 0) {
    updates.paymentMethod.isDefault = true;
  }
  
  user.paymentMethods.push(updates.paymentMethod);
}

// Handle removing a payment method
if (updates.removePaymentMethod) {
  if (user.paymentMethods && user.paymentMethods.length > 0) {
    const paymentMethodId = updates.removePaymentMethod;
    const index = user.paymentMethods.findIndex(pm => pm._id.toString() === paymentMethodId);
    
    if (index !== -1) {
      const wasDefault = user.paymentMethods[index].isDefault;
      user.paymentMethods.splice(index, 1);
      
      // If the removed payment method was the default and there are other payment methods,
      // set the first one as default
      if (wasDefault && user.paymentMethods.length > 0) {
        user.paymentMethods[0].isDefault = true;
      }
    }
  }
}

// Handle setting a default payment method
if (updates.defaultPaymentMethod) {
  if (user.paymentMethods && user.paymentMethods.length > 0) {
    const paymentMethodId = updates.defaultPaymentMethod;
    
    // Set all payment methods to non-default
    user.paymentMethods.forEach(pm => {
      pm.isDefault = (pm._id.toString() === paymentMethodId);
    });
  }
}

if (updates.newPassword) {

 if (!updates.oldPassword) {
   return res.status(400).json({ message: "Old password is required to set a new password" });
 }

 const isMatch = await bcrypt.compare(updates.oldPassword, user.password);
 if (!isMatch) {
   return res.status(400).json({ message: "Old password is incorrect" });
 }

 const salt = await bcrypt.genSalt(Number(process.env.SALT_ROUNDS));
 user.password = await bcrypt.hash(updates.newPassword, salt);
}


       if (updates.email && updates.email !== email) {
     return res.status(400).json({ message: "Email change not allowed" });
   }

   await user.save();

       res.status(200).json({
     status: "Success",
     message: "Profile updated successfully",
     data: {
       firstName: user.firstName,
       lastName: user.lastName,
       email: user.email,
       phone: user.phone,
       role: user.role,
       billingAddress: user.billingAddress,
       shippingAddress: user.shippingAddress,
       paymentMethods: user.paymentMethods
     }
   });


}catch(err){
       res.status(500).json({
     status: "Failure",
     message: "Internal server error",
     error: err.message
   });

}
}

module.exports = {getAllUsers,getmyProfile,updatemyProfile};