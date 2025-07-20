/**
 * @swagger
 * tags:
 *   name: PayPal
 *   description: PayPal payment routes
 */

/**
 * @swagger
 * /paypal/create:
 *   post:
 *     summary: Create a new PayPal order
 *     tags: [PayPal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PayPal order created
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /paypal/capture:
 *   get:
 *     summary: Capture a PayPal order
 *     tags: [PayPal]
 *     responses:
 *       200:
 *         description: Payment captured successfully
 *       400:
 *         description: Invalid request
 */



const express = require("express");
const router = express.Router();
const { createOrder , captureOrder} = require("../controllers/paypalController");
const { verifyToken } = require("../middlewares/verifyToken");

router.get ('/capture', captureOrder);  

router.post("/create", verifyToken,createOrder);

module.exports = router;
