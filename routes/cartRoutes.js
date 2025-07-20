const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { verifyToken } = require("../middlewares/verifyToken");

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Cart management
 */

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: View cart items
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the list of cart items.
 *       500:
 *         description: Server error
 */
router.get("/", verifyToken, cartController.viewCart);

/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: Add a book to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookId
 *             properties:
 *               bookId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: Book added to cart
 *       400:
 *         description: Bad request or book not available
 *       500:
 *         description: Server error
 */
router.post("/add", verifyToken, cartController.addToCart);

/**
 * @swagger
 * /cart:
 *   delete:
 *     summary: Remove an item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item removed
 *       404:
 *         description: Item not found
 *       500:
 *         description: Server error
 */
router.delete("/", verifyToken, cartController.removeFromCart);

/**
 * @swagger
 * /cart/clear:
 *   delete:
 *     summary: Clear all items from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 *       500:
 *         description: Server error
 */
router.delete("/clear", verifyToken, cartController.clearCart);

module.exports = router;
