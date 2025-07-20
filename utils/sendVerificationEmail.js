const mailSender = require('./mailSender');

const sendVerificationEmail = async (email, otp) => {
  try {
    const mailResponse = await mailSender(
      email,
      "Verification Email",
      `<h2 style="color:#6C63FF;">Welcome to Book Shelf 📚</h2>
        <p>Hi there,</p>
<p>To complete your registration, please use the following OTP:</p>
<h3 style="color:#FF5722;">${otp}</h3>
<p>This OTP is valid for 5 minutes.</p>
<p>Happy reading! 📖</p>
<hr />
<small>Book Shelf Team</small>
`
    );
    console.log("Email sent successfully: ", mailResponse);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
};

module.exports = sendVerificationEmail;
