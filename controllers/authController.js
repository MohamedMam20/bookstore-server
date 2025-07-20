require("dotenv").config();

const { validationResult } = require("express-validator");
const User = require("../models/usersModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const OTP = require("../models/otpModel");
const otpGenerator = require("otp-generator");
const sendResetPasswordEmail = require("../utils/sendResetPasswordEmail");

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "Failure",
        // message: errors.array(),
        message: errors.array()[0].msg,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    await OTP.create({ email, otp });

    res.status(200).json({
      success: true,
      message:
        "OTP sent to your email. Please confirm to complete registration.",
      data: { firstName, lastName, email, password },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { body } = req;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "Failure",
        //message: errors.array(),
        message: errors.array()[0].msg,
      });
    }

    const user = await User.findOne({ email: body.email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Email or Password are not valid" });
    }

    const isMatch = await bcrypt.compare(body.password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Email or Password are not valid" });
    }
    const token = generateAccessToken({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      status: "Success",
      message: "Logged in successfully",
      token: token,
    });
  } catch (err) {
    return res.status(500).json({
      status: "Failure",
      message: "Internal server error",
      error: err.message,
    });
  }
};
const generateAccessToken = (userData) => {
  return jwt.sign(userData, process.env.TOKEN_SECRET, { expiresIn: "3d" });
};

// export const requestPasswordReset = async (req, res, next) => {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: "User doesn't exist" });

//     const secret = process.env.JWT + user.password;
//     const token = jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn: '1h' });

//      const resetURL = `https://your-backend-url/resetpassword?id=${user._id}&token=${token}`;

//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: 't1129172@gmail.com',
//         pass: 'password',
//       },
//     });

//     const mailOptions = {
//       to: user.email,
//       from: process.env.EMAIL,
//       subject: 'Password Reset Request',
//       text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
//       Please click on the following link, or paste this into your browser to complete the process:\n\n
//       ${resetURL}\n\n
//       If you did not request this, please ignore this email and your password will remain unchanged.\n`,
//     };

//     await transporter.sendMail(mailOptions);

//     res.status(200).json({ message: 'Password reset link sent' });
//   } catch (error) {
//     res.status(500).json({ message: 'Something went wrong' });
//   }
// };

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Prevent spamming
    const previousOtp = await OTP.findOne({ email, type: "reset" }).sort({
      createdAt: -1,
    });
    if (previousOtp && Date.now() - previousOtp.createdAt < 60 * 1000) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting another OTP.",
      });
    }

    // Generate and hash OTP
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const salt = await bcrypt.genSalt(Number(process.env.SALT_ROUNDS));
    const hashedOtp = await bcrypt.hash(otp, salt);

    // Save OTP in DB
    await OTP.create({ email, otp: hashedOtp, type: "reset" });

    // Send email
    await sendResetPasswordEmail(email, otp);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email for password reset",
    });
  } catch (error) {
    console.error("Error in requestPasswordReset:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//

// export const resetPassword = async (req, res, next) => {
//   const { id, token } = req.params;
//   const { password } = req.body;

//   try {
//     const user = await User.findOne({ _id: id });
//     if (!user) {
//       return res.status(400).json({ message: "User not exists!" });
//     }

//     const secret = process.env.JWT + user.password;

//     const verify = jwt.verify(token, secret);
//     const encryptedPassword = await bcrypt.hash(password, 10);
//     await User.updateOne(
//       {
//         _id: id,
//       },
//       {
//         $set: {
//           password: encryptedPassword,
//         },
//       }
//     );

//     await user.save();

//     res.status(200).json({ message: 'Password has been reset' });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: 'Something went wrong' });
//   }
//};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "Failure",
        message: errors.array(),
      });
    }

    const recentOtp = await OTP.findOne({ email, type: "reset" }).sort({
      createdAt: -1,
    });
    if (!recentOtp) {
      return res
        .status(400)
        .json({ success: false, message: "No OTP found for this email." });
    }

    const isExpired =
      recentOtp.createdAt.getTime() + 5 * 60 * 1000 < Date.now();
    if (isExpired) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired." });
    }

    const isValid = await bcrypt.compare(otp, recentOtp.otp);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT_ROUNDS));
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await OTP.deleteMany({ email, type: "reset" });

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("Error in resetPassword:", error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong during password reset",
      error: error.message,
    });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log("Decoded payload:", payload);

    const { email, given_name: firstName, family_name: lastName } = payload;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email not found in token" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        firstName: firstName || "GoogleUser",
        lastName: lastName || "",
        isGoogleUser: true,
        role: "user",
      });
    }

    const tokenRes = generateAccessToken({
      id: user._id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: "Google login successful",
      token: tokenRes,
      user,
    });
  } catch (error) {
    console.error("Google login error:", error.message);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: "Google login failed",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  requestPasswordReset,
  resetPassword,
  googleLogin,
};
