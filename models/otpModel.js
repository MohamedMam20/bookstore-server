const mongoose = require("mongoose");
const sendVerificationEmail = require("../utils/sendVerificationEmail");
const bcrypt = require("bcrypt");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 5, // 5 minutes
  },
  type: {
    type: String,
    enum: ["register", "reset"],
    default: "register",
  },
});

otpSchema.pre("save", async function (next) {
  const existing = await this.constructor
    .findOne({ email: this.email })
    .sort({ createdAt: -1 });
  if (this.type === "register") {
    if (existing && Date.now() - existing.createdAt < 60 * 1000) {
      throw new Error("Please wait before requesting another OTP.");
    }

    const plainOtp = this.otp;
    const saltRounds = Number(process.env.SALT_ROUNDS);
    const salt = await bcrypt.genSalt(saltRounds);
    this.otp = await bcrypt.hash(this.otp, salt);

    //   if (this.type === 'register') {
    const sendVerificationEmail = require("../utils/sendVerificationEmail");
    await sendVerificationEmail(this.email, plainOtp);
    console.log("Verification OTP email sent.");
  } else {
    console.log("No email sent for reset OTP.");
  }

  next();
});

module.exports = mongoose.model("OTP", otpSchema);
