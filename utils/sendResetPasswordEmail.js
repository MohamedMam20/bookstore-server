const mailSender = require("./mailSender");

const sendResetPasswordEmail = async (email, otp) => {
  try {
    const mailResponse = await mailSender(
      email,
      "Reset Your Password - Book Shelf",
      `<h2 style="color:#6C63FF;">Reset Password Requested</h2>
      <p>We received a request to reset your password. Use the OTP below:</p>
      <h3 style="color:#FF5722;">${otp}</h3>
      <p>This OTP is valid for 5 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
      <hr />
      <small>Book Shelf Team</small>`
    );
    //console.log("Reset password email sent:", mailResponse);
  } catch (error) {
    console.error("Error sending reset password email:", error);
    throw error;
  }
};

module.exports = sendResetPasswordEmail;
