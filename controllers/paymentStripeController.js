const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const mongoose = require("mongoose");
const Book = require("../models/booksModel");
const Order = require("../models/ordersModel");
const CartItem = require("../models/cartModel");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MY_EMAIL,
    pass: process.env.MY_EMAIL_PASSWORD,
  },
});

const sendUserEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: "BookStore 📚 <" + process.env.MY_EMAIL + ">",
    to,
    subject,
    html,
  });
};

const notifyAdmin = async (order, req) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const subject = "New Order Placed 📅";
  const html = `
    <h2>New Order Notification</h2>
    <p><strong>Order ID:</strong> ${order._id}</p>
    <p><strong>User:</strong> ${order.user}</p>
    <p><strong>Total:</strong> ${order.totalPrice} EGP</p>
    <p><strong>Status:</strong> ${order.status}</p>
    <p>View the order in the admin dashboard.</p>
  `;
  await sendUserEmail(adminEmail, subject, html);
  
  // Add socket notification for real-time updates
  if (req && req.app && req.app.locals.io) {
    const io = req.app.locals.io;
    
    // Track sent notifications to prevent duplicates
    if (!req.app.locals.sentNotifications) {
      req.app.locals.sentNotifications = new Set();
    }
    
    // Check if we've already sent a notification for this order
    const notificationKey = `order_${order._id}`;
    if (req.app.locals.sentNotifications.has(notificationKey)) {
      console.log("⏩ Skipping duplicate socket notification for order:", order._id);
      return;
    }
    
    try {
      // Get book details from the order
      const bookDetails = order.books.map(item => ({
        title: (item.book && item.book.title) ? item.book.title : 'Unknown Book',
        quantity: item.quantity || 1,
        price: item.price || 0
      }));
      
      // Get user details
      let userName = 'a customer';
      if (req.user && req.user.firstName) {
        userName = `${req.user.firstName} ${req.user.lastName || ''}`.trim();
      }
      
      io.emit('newOrderNotification', {
        orderId: order._id,
        userName: userName,
        totalAmount: order.totalPrice,
        timestamp: new Date().toISOString(),
        books: bookDetails, // Add book details to the notification
        user: {
          name: userName,
          email: req.user ? req.user.email : 'unknown'
        },
        data: {
          orderId: order._id,
          totalAmount: order.totalPrice,
          status: order.status
        }
      });
      
      // Mark this notification as sent
      req.app.locals.sentNotifications.add(notificationKey);
      
      // Set a timeout to remove the notification from the set after 5 minutes
      // to prevent the set from growing indefinitely
      setTimeout(() => {
        req.app.locals.sentNotifications.delete(notificationKey);
      }, 5 * 60 * 1000);
      
      console.log("🔔 Socket notification sent for new order:", order._id);
    } catch (error) {
      console.error("❌ Error formatting notification data:", error);
    }
  } else {
    console.log("❌ Socket.io not available for notification");
  }
};

exports.createCheckout = async (req, res) => {
  console.log("📥 Received body:", req.body);
  const { productId, quantity, amount, cartItems, language } = req.body;
  const userId = req.user.id;
  const email = req.user.email;

  if (!userId || !email) {
    return res.status(400).json({ error: "Unauthorized" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let lineItems = [];
    let totalAmount = 0;
    let orderBooks = [];
    let cart = cartItems;

    if (!cartItems || cartItems.length === 0) {
      const userCart = await CartItem.find({ user: userId }).lean();
      if (!userCart.length) {
        await session.abortTransaction();
        return res.status(400).json({ error: "Your cart is empty." });
      }
      cart = userCart;
    }

    if (cart && cart.length > 0) {
      for (const item of cart) {
        const productId = item.productId || item.book;
        const language = item.language;
        const quantity = item.quantity;

        const book = await Book.findById(productId).session(session);
        if (!book || book.stock[language] < quantity) {
          await session.abortTransaction();
          return res.status(400).json({
            error: `Out of stock: ${book?.title || "Unknown"}`,
          });
        }

        lineItems.push({
          price_data: {
            currency: "EGP",
            product_data: { name: book.title },
            unit_amount: book.price * 100,
          },
          quantity,
        });

        totalAmount += book.price * quantity;
        orderBooks.push({
          book: productId,
          quantity,
          language,
          price: book.price,
        });
      }
    } else if (productId && quantity) {
      const book = await Book.findById(productId).session(session);

      if (!book || book.stock[language] < quantity) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ error: "Product out of stock or not found" });
      }

      lineItems.push({
        price_data: {
          currency: "EGP",
          product_data: { name: book.title },
          unit_amount: book.price * 100,
        },
        quantity,
      });

      totalAmount = book.price * quantity;
      orderBooks.push({
        book: productId,
        quantity,
        language,
        price: book.price,
      });
    } else {
      await session.abortTransaction();
      return res.status(400).json({ error: "Missing product or cart items" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100,
      currency: "EGP",
      payment_method_types: ["card"],
      metadata: { userId },
    });

    const [order] = await Order.create(
      [
        {
          user: userId,
          books: orderBooks,
          totalPrice: totalAmount,
          status: "pending",
        },
      ],
      { session }
    );

    await session.commitTransaction();

    // In createCheckout function (around line 150)
    await notifyAdmin(order, req);

    // In confirmPayment function (around line 235)
    // Remove this duplicate call
    // await notifyAdmin(order, req);

    res.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order._id,
    });
  } catch (error) {
    console.error("❌ Checkout error:", error);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    res.status(500).json({ error: "Checkout failed" });
  } finally {
    session.endSession();
  }
};

exports.confirmPayment = async (req, res) => {
  const { paymentIntentId, orderId, mode } = req.body;

  if (!paymentIntentId || !orderId) {
    return res
      .status(400)
      .json({ error: "Missing paymentIntentId or orderId" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const confirmedPaymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId
    );

    if (confirmedPaymentIntent.status !== "succeeded") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Payment not completed" });
    }

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Order not found" });
    }

    for (const orderBook of order.books) {
      const book = await Book.findById(orderBook.book).session(session);
      if (
        !book ||
        book.stock[orderBook.language || "ar"] < orderBook.quantity
      ) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({
            error: `Stock no longer available for ${book?.title || "Unknown"}`,
          });
      }

      book.stock[orderBook.language || "ar"] -= orderBook.quantity;
      await book.save({ session });
    }

    order.status = "processing";
    order.paymentIntentId = paymentIntentId;
    order.statusHistory.push({ status: "processing", timestamp: new Date() });
    await order.save({ session });

    const userId = req.user.id;

    if (mode === "buyNow") {
      for (const orderBook of order.books) {
        await CartItem.deleteOne({
          user: userId,
          book: orderBook.book,
          language: orderBook.language,
        });
      }
    } else {
      await CartItem.deleteMany({ user: userId });
    }

    await session.commitTransaction();

    // Remove this call to prevent duplicate notifications
    // try {
    //   // In confirmPayment function (if it calls notifyAdmin)
    //   await notifyAdmin(order, req);
    // } catch (emailError) {
    //   console.error(
    //     "❌ Admin email failed, but payment processed:",
    //     emailError
    //   );
    // }

    await sendUserEmail(
      req.user.email,
      "Your Payment was Successful ✅",
      `
      <h2>Thank you for your purchase!</h2>
      <p>Your order <strong>${order._id}</strong> has been completed successfully.</p>
      <p>Total Paid: ${order.totalPrice} EGP</p>
    `
    );

    res.json({ success: true });
  } catch (error) {
    await session.abortTransaction();
    console.error("Payment confirmation error:", error);
    res.status(500).json({ error: "Payment confirmation failed" });
  } finally {
    session.endSession();
  }
};
// exports.cancelOrder = async (req, res) => {
//   const { orderId } = req.body;
//   const userId = req.user.id;

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const order = await Order.findById(orderId).session(session);
//     if (!order) {
//       await session.abortTransaction();
//       return res.status(404).json({ error: 'Order not found' });
//     }

//     if (order.user.toString() !== userId) {
//       await session.abortTransaction();
//       return res.status(403).json({ error: 'Unauthorized to cancel this order' });
//     }

//     if (order.status !== 'completed') {
//       await session.abortTransaction();
//       return res.status(400).json({ error: 'Only completed orders can be cancelled' });
//     }

//     const orderDate = new Date(order.createdAt);
//     const now = new Date();
//     const hoursDiff = (now - orderDate) / (1000 * 60 * 60);

//     if (hoursDiff > 24) {
//       await session.abortTransaction();
//       return res.status(400).json({ error: 'Cannot cancel order after 24 hours' });
//     }

//     if (!order.paymentIntentId) {
//       await session.abortTransaction();
//       return res.status(400).json({ error: 'No payment information found for this order' });
//     }

//     const refund = await stripe.refunds.create({
//       payment_intent: order.paymentIntentId
//     });

//     for (const orderBook of order.books) {
//       const book = await Book.findById(orderBook.book).session(session);
//       if (book) {
//         book.stock[orderBook.language || 'ar'] += orderBook.quantity;
//         await book.save({ session });
//       }
//     }

//     order.status = 'cancelled';
//     order.statusHistory.push({
//       status: 'cancelled',
//       timestamp: new Date(),
//       refundStatus: refund.status === 'succeeded' ? 'completed' : 'pending'
//     });
//     await order.save({ session });
//     console.log("✅ Order saved as cancelled");
//     await session.commitTransaction();

//     await sendUserEmail(req.user.email, 'Your Order Has Been Cancelled', `
//       <h2>Order Cancellation Confirmation</h2>
//       <p>Your order <strong>${order._id}</strong> has been cancelled successfully.</p>
//       <p>Refund Status: ${refund.status === 'succeeded' ? 'Completed' : 'Pending'}</p>
//       <p>Total Refunded: ${order.totalPrice} EGP</p>
//     `);

//     await sendUserEmail(process.env.ADMIN_EMAIL, 'Order Cancelled Notification', `
//       <h2>Order Cancellation Notification</h2>
//       <p><strong>Order ID:</strong> ${order._id}</p>
//       <p><strong>User:</strong> ${order.user}</p>
//       <p><strong>Total Refunded:</strong> ${order.totalPrice} EGP</p>
//       <p><strong>Refund Status:</strong> ${refund.status}</p>
//     `);

//     res.json({ success: true, refundStatus: refund.status });
//   } catch (error) {
//     await session.abortTransaction();
//     console.error('Order cancellation error:', error);
//     res.status(500).json({ error: 'Order cancellation failed' });
//   } finally {
//     session.endSession();
//   }
// };
