const mailSender = require("./mailSender");

const WelcomeEmail = async (email, firstName) => {
  try {
    const mailResponse = await mailSender(
      email,
      "Welcome to Book Shelf 🎉",
      `<h2 style="color:#6C63FF;">Welcome, ${firstName}!</h2>
      <p>We're thrilled to have you at <strong>Book Shelf</strong>.</p>
      <p>Start exploring amazing books, leave reviews, and enjoy your reading journey with us! 📚</p>
      <hr />
      <small>Happy Reading,<br/>The Book Shelf Team</small>`
    );
    console.log("Welcome email sent:", mailResponse);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
};

module.exports = WelcomeEmail;
