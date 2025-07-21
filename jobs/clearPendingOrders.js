const cron = require("node-cron");
const Order = require("../models/ordersModel");
const Book = require("../models/booksModel");

cron.schedule("0 * * * *", async () => {
  // cron.schedule('*/5 * * * *', async () => {

  //console.log('[CRON] Job started');

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  // const oneDayAgo = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

  const oldPendingOrders = await Order.find({
    status: "pending",
    createdAt: { $lt: oneDayAgo },
    paymentMethod: "paypal",
  });

  //console.log(`[CRON] Found ${oldPendingOrders.length} old pending orders`);

  for (const order of oldPendingOrders) {
    for (const item of order.books) {
      const book = await Book.findById(item.book);
      if (book) {
        const lang = item.language || "ar";

        if (!book.stock || typeof book.stock !== "object") {
          book.stock = { ar: 0, en: 0, fr: 0 };
        }

        if (typeof book.stock[lang] !== "number") {
          book.stock[lang] = 0;
        }

        book.stock[lang] += item.quantity;

        await book.save();
      }
    }

    order.status = "cancelled";
    order.statusHistory = order.statusHistory || [];

    order.statusHistory.push({
      status: "cancelled",
      timestamp: new Date(),
      refundStatus: "none",
    });

    await order.save({ validateBeforeSave: false });

    await order.save({ validateBeforeSave: false });
  }

  //console.log(`[CRON] Cleared ${oldPendingOrders.length} old pending orders`);
});
