const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentStripeController");
const authMiddleware = require("../middlewares/payValidation");

router.post("/checkout", authMiddleware, paymentController.createCheckout);
router.post(
  "/checkout/confirm",
  authMiddleware,
  paymentController.confirmPayment
);
// "router.post('/cancel', authMiddleware, paymentController.cancelOrder);"

module.exports = router;
