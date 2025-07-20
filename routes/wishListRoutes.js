const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishListController");
const { verifyToken } = require("../middlewares/verifyToken");

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: Wishlist management
 */

/**
 * @swagger
 * /wishlist/view:
 *   get:
 *     summary: View user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       bookId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       price:
 *                         type: number
 *                       image:
 *                         type: string
 *                       language:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get("/view", verifyToken, wishlistController.viewWishlist);

/**
 * @swagger
 * /wishlist/add:
 *   post:
 *     summary: Add a book to wishlist
 *     tags: [Wishlist]
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
 *               language:
 *                 type: string
 *                 default: en
 *     responses:
 *       200:
 *         description: Added to wishlist or already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     book:
 *                       $ref: '#/components/schemas/Book'
 *       400:
 *         description: Missing book ID
 *       500:
 *         description: Server error
 */
router.post("/add", verifyToken, wishlistController.addToWishlist);

/**
 * @swagger
 * /wishlist/remove:
 *   delete:
 *     summary: Remove a book from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bookId
 *         schema:
 *           type: string
 *         required: false
 *         description: Book ID to remove (can also be sent in body as `id`)
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully removed from wishlist
 *       404:
 *         description: Item not found
 *       400:
 *         description: Book ID missing
 *       500:
 *         description: Server error
 */
router.delete("/remove", verifyToken, wishlistController.removeFromWishlist);

module.exports = router;
