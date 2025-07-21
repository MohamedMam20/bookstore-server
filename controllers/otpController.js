const OTP = require('../models/otpModel');
const User = require('../models/usersModel');
const bcrypt = require("bcrypt");
const welcomeEmail = require("../utils/welcomeEmail"); 

const verifyOTP = async (req, res) => {
  try {
    const { firstName, lastName, email, password, otp } = req.body;

    const recentOtp = await OTP.findOne({ email }).sort({ createdAt: -1 });

    if (!recentOtp) {
      return res.status(400).json({ message: 'No OTP found for this email.' });
    }

    const isExpired = recentOtp.createdAt.getTime() + 5 * 60 * 1000 < Date.now();
    if (isExpired) {
      return res.status(400).json({ message: 'OTP has expired.' });
    }

    const isValid = await bcrypt.compare(otp, recentOtp.otp);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }


const saltRounds = Number(process.env.SALT_ROUNDS) ;
const hashedPassword = await bcrypt.hash(password, saltRounds);  
  const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    await welcomeEmail(newUser.email, newUser.firstName);


    await OTP.deleteMany({ email }); 

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports ={verifyOTP};