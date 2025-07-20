/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: API endpoints for managing user orders
 */

/**
 * @swagger
 * /orders/place-order:
 *   post:
 *     summary: Place a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 description: List of products in the order
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       example: 64ab1234cd5678ef9012gh34
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *               paymentMethod:
 *                 type: string
 *                 example: "paypal"
 *     responses:
 *       201:
 *         description: Order placed successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       400:
 *         description: Bad request - Missing or invalid data
 */

/**
 * @swagger
 * /orders/history:
 *   get:
 *     summary: Get user's order history
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's past orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: 64f29a12d8c6ab8dfe331d4c
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         productId:
 *                           type: string
 *                         quantity:
 *                           type: integer
 *                   status:
 *                     type: string
 *                     example: "delivered"
 *                   totalAmount:
 *                     type: number
 *                     example: 39.99
 *       401:
 *         description: Unauthorized
 */


const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { verifyToken } = require("../middlewares/verifyToken");

router.post("/place-order", verifyToken,orderController.placeOrder);
router.get("/history",verifyToken,orderController.getOrderHistory);
module.exports = router;