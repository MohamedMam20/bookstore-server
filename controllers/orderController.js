const mongoose = require("mongoose");
const CartItem = require("../models/cartModel");
const Book = require("../models/booksModel");
const Order = require("../models/ordersModel");
const User = require("../models/usersModel");
const OrderConfirmationEmail = require("../utils/orderConfirmationEmail");

const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userEmail = req.user.email;
    //Log user email
    //console.log("User email:", userEmail);
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        status: "Failure",
        message: "User not found",
      });
    }

    const cartItems = await CartItem.find({ user: user._id }).populate("book");
    if (cartItems.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        status: "Failure",
        message: "Cart is empty",
      });
    }

    let totalPrice = 0;
    const orderBooks = [];

    for (const item of cartItems) {
      const { book, quantity, language } = item;

      const stock = book.stock?.[language];

      if (stock === undefined) {
        await session.abortTransaction();
        return res.status(400).json({
          status: "Failure",
          message: `Language '${language}' not available for ${book.title}`,
        });
      }

      if (quantity > stock) {
        await session.abortTransaction();
        return res.status(400).json({
          status: "Failure",
          message: `Only ${stock} left in stock for ${book.title}`,
        });
      }

      book.stock[language] -= quantity;
      await book.save({ session });
      totalPrice += book.price * quantity;
      orderBooks.push({
        book: book._id,
        quantity,
        language,
        price: book.price,
      });
    }

    const newOrder = await Order.create(
      [
        {
          user: user._id,
          books: orderBooks,
          totalPrice,
          paymentMethod: "paypal",
        },
      ],
      { session }
    );

    await CartItem.deleteMany({ user: user._id }, { session });

    await session.commitTransaction();

    // await OrderConfirmationEmail(user.email, user.firstName, newOrder[0]._id, totalPrice);
    const orderedBooks = cartItems.map((item) => ({
      title: item.book.title,
      quantity: item.quantity,
    }));

    await OrderConfirmationEmail(
      user.email,
      user.firstName,
      newOrder[0]._id,
      totalPrice,
      orderedBooks
    );

    //notification to the admin using WebSocket
    const io = req.app.locals.io;
    //console.log("🔥🔥🔥 About to emit socket from placeOrder()");

    io.emit("newOrderNotification", {
      user: {
        name: user.firstName,
        email: user.email,
      },
      orderId: newOrder[0]._id,
      totalPrice,
      orderedBooks,
    });

    session.endSession();

    return res.status(201).json({
      status: "Success",
      message: "Order placed successfully",
      data: newOrder[0],
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      status: "Failure",
      message: "Internal Server Error",
      error: err.message || err,
    });
  }
};

// const getOrderHistory = async (req, res) => {
//   try {
//     const userEmail = req.user.email;

//     const orders = await Order.find()
//       .populate({
//         path: "user",
//         match: { email: userEmail },
//         select: "firstName email",
//       })
//       .populate({
//         path: "books.book",
//         select: "title price image",
//       })
//       .sort({ createdAt: -1 });

//     const userOrders = orders.filter((order) => order.user);

//     const formatted = userOrders.map((order) => ({
//       id: order._id,
//       createdAt: order.createdAt,
//       status: order.status,
//       totalPrice: order.totalPrice,
//       books: order.books.map((item) => ({
//         title: item.book?.title || "Deleted Book",
//         image: item.book?.image || "",
//         price: item.book?.price || 0,
//         quantity: item.quantity,
//       })),
//     }));

//     res.status(200).json({
//       status: "Success",
//       count: formatted.length,
//       data: formatted,
//     });
//   } catch (err) {
//     res.status(500).json({
//       status: "Failure",
//       message: "Error fetching order history",
//       error: err.message || err,
//     });
//   }
// };

const getOrderHistory = async (req, res) => {
  try {
    const userEmail = req.user.email;

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res
        .status(404)
        .json({ status: "Failure", message: "User not found" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments({ user: user._id });

    const orders = await Order.find({ user: user._id })
      .populate({
        path: "books.book",
        select: "title price image",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formatted = orders.map((order) => ({
      id: order._id,
      createdAt: order.createdAt,
      status: order.status,
      totalPrice: order.totalPrice,
      books: order.books.map((item) => ({
        title: item.book?.title || "Deleted Book",
        image: item.book?.image || "",
        price: item.book?.price || 0,
        quantity: item.quantity,
      })),
    }));

    res.status(200).json({
      status: "Success",
      page,
      limit,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      count: formatted.length,
      data: formatted,
    });
  } catch (err) {
    res.status(500).json({
      status: "Failure",
      message: "Error fetching order history",
      error: err.message || err,
    });
  }
};

// Admin: Get all orders with pagination
const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query object based on filters
    const query = {};

    // Add status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await Order.find(query)
      .populate({
        path: "user",
        select: "firstName lastName email",
      })
      .populate({
        path: "books.book",
        select: "title price image",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedOrders = orders.map((order) => ({
      id: order._id,
      customer: order.user
        ? `${order.user.firstName} ${order.user.lastName}`
        : "Unknown User",
      email: order.user ? order.user.email : "Unknown",
      date: order.createdAt,
      status: order.status,
      totalPrice: order.totalPrice,
      books: order.books.map((item) => ({
        title: item.book?.title || "Deleted Book",
        image: item.book?.image || "",
        price: item.price,
        quantity: item.quantity,
        language: item.language,
      })),
    }));

    res.status(200).json({
      status: "Success",
      count: formattedOrders.length,
      totalPages,
      currentPage: page,
      data: formattedOrders,
    });
  } catch (err) {
    res.status(500).json({
      status: "Failure",
      message: "Error fetching orders",
      error: err.message || err,
    });
  }
};

// Admin: Get order by ID
const getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId)
      .populate({
        path: "user",
        select: "firstName lastName email",
      })
      .populate({
        path: "books.book",
        select: "title price image",
      });

    if (!order) {
      return res.status(404).json({
        status: "Failure",
        message: "Order not found",
      });
    }

    const formattedOrder = {
      _id: order._id, // Ensure ID is included
      id: order._id, // Include both formats for compatibility
      orderNumber: order.orderNumber || order._id.toString().substr(-6),
      customer: order.user
        ? `${order.user.firstName} ${order.user.lastName}`
        : "Unknown User",
      email: order.user ? order.user.email : "Unknown",
      date: order.createdAt,
      status: order.status,
      totalPrice: order.totalPrice,
      books: order.books.map((item) => ({
        title: item.book?.title || "Deleted Book",
        image: item.book?.image || "",
        price: item.price,
        quantity: item.quantity,
        language: item.language,
      })),
    };

    res.status(200).json({
      status: "Success",
      data: formattedOrder,
    });
  } catch (err) {
    res.status(500).json({
      status: "Failure",
      message: "Error fetching order",
      error: err.message || err,
    });
  }
};

// Admin: Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        status: "Failure",
        message: "Status is required",
      });
    }

    // Validate status

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "completed",
      "paid",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: "Failure",
        message: "Invalid status value",
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        status: "Failure",
        message: "Order not found",
      });
    }

    res.status(200).json({
      status: "Success",
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  } catch (err) {
    res.status(500).json({
      status: "Failure",
      message: "Error updating order status",
      error: err.message || err,
    });
  }
};

// Admin: Delete order
const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({
        status: "Failure",
        message: "Order not found",
      });
    }

    res.status(200).json({
      status: "Success",
      message: "Order deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "Failure",
      message: "Error deleting order",
      error: err.message || err,
    });
  }
};

// Admin: Get recent orders for dashboard
const getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const orders = await Order.find()
      .populate({
        path: "user",
        select: "firstName lastName email",
      })
      .sort({ createdAt: -1 })
      .limit(limit);

    const formattedOrders = orders.map((order) => ({
      id: order._id,
      customer: order.user
        ? `${order.user.firstName} ${order.user.lastName}`
        : "Unknown User",
      date: order.createdAt.toISOString().split("T")[0],
      total: order.totalPrice,
      status: order.status,
    }));

    res.status(200).json({
      status: "Success",
      data: formattedOrders,
    });
  } catch (err) {
    res.status(500).json({
      status: "Failure",
      message: "Error fetching recent orders",
      error: err.message || err,
    });
  }
};

module.exports = {
  placeOrder,
  getOrderHistory,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getRecentOrders,
};
