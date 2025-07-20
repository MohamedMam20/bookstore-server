// routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { verifyToken } = require("../middlewares/verifyToken");
const { admin } = require("../middlewares/admin");

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: API endpoints for managing orders (Admin protected)
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page (default 10)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *     responses:
 *       200:
 *         description: A list of orders
 *       401:
 *         description: Unauthorized
 */
router.get("/", verifyToken, admin, orderController.getAllOrders);

/**
 * @swagger
 * /orders/recent:
 *   get:
 *     summary: Get recent orders (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of recent orders (default 5)
 *     responses:
 *       200:
 *         description: A list of recent orders
 *       401:
 *         description: Unauthorized
 */
router.get("/recent", verifyToken, admin, orderController.getRecentOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get("/:id", verifyToken, admin, orderController.getOrderById);

/**
 * @swagger
 * /orders/{id}:
 *   patch:
 *     summary: Update order status (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: "shipped"
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid status or missing field
 *       404:
 *         description: Order not found
 */
router.patch("/:id", verifyToken, admin, orderController.updateOrderStatus);

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Delete order (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       404:
 *         description: Order not found
 */
router.delete("/:id", verifyToken, admin, orderController.deleteOrder);

module.exports = router;
