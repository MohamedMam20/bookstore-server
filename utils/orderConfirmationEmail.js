// const mailSender = require('./mailSender');

// const OrderConfirmationEmail = async (email, firstName, orderId, totalPrice) => {
//   try {
//     const mailResponse = await mailSender(
//       email,
//       `Your Book Shelf Order #${orderId} Confirmation 📦`,
//       `<h2 style="color:#6C63FF;">Hello, ${firstName}!</h2>
//       <p>Thank you for your order from <strong>Book Shelf</strong>. 🎉</p>
//       <p>We’re happy to let you know that we’ve received your order and it's currently being processed.</p>
//       <h3 style="color:#333;">🧾 Order Summary:</h3>
//       <ul>
//         <li><strong>Order ID:</strong> ${orderId}</li>
//         <li><strong>Total:</strong> $${totalPrice.toFixed(2)}</li>
//         <li><strong>Status:</strong> Pending</li>
//       </ul>
//       <p>You’ll get another email when your order status changes.</p>
//       <hr />
//       <p>Thank you for choosing us. Happy Reading! 📚</p>
//       <small>— The Book Shelf Team</small>`
//     );

//     console.log("Order confirmation email sent:", mailResponse);
//   } catch (error) {
//     console.error("Error sending order confirmation email:", error);
//     throw error;
//   }
// };

// module.exports = OrderConfirmationEmail;

const mailSender = require('./mailSender');

const OrderConfirmationEmail = async (email, firstName, orderId, totalPrice, books = []) => {
  try {
    const bookListHTML = books.map((b) => {
      return `<li><strong>${b.title}</strong> — Quantity: ${b.quantity}</li>`;
    }).join('');

    const mailResponse = await mailSender(
      email,
      `Your Book Shelf Order #${orderId} Confirmation 📦`,
      `<h2 style="color:#6C63FF;">Hello, ${firstName}!</h2>
      <p>Thanks for your order from <strong>Book Shelf</strong>! 🎉</p>

      <h3>🧾 Order Summary:</h3>
      <ul>
        <li><strong>Order ID:</strong> ${orderId}</li>
        <li><strong>Total:</strong> $${totalPrice.toFixed(2)}</li>
        <li><strong>Status:</strong> Pending</li>
      </ul>

      <h3>📚 Books Ordered:</h3>
      <ul>
        ${bookListHTML}
      </ul>

      <p>We’ll notify you when your order status updates.</p>

      <hr/>
      <p>Happy Reading!<br/><small>— The Book Shelf Team</small></p>`
    );

    console.log("Order confirmation email sent:", mailResponse);
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    throw error;
  }
};

module.exports = OrderConfirmationEmail;
