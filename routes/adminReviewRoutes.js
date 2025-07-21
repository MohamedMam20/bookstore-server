const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { verifyToken } = require("../middlewares/verifyToken");
const { admin } = require("../middlewares/admin");

// Admin review routes - all protected by verifyToken and admin middleware
router.get("/", verifyToken, admin, reviewController.getAllReviews);
router.get("/:id", verifyToken, admin, reviewController.getReviewById);
//router.patch("/:id", verifyToken, admin, reviewController.updateReviewStatus);
router.delete("/:id", verifyToken, admin, reviewController.deleteReviewByAdmin);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Admin Reviews
 *   description: Review management endpoints for administrators
 */

/**
 * @swagger
 * /admin/reviews:
 *   get:
 *     summary: Get all reviews
 *     tags: [Admin Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all reviews
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */

/**
 * @swagger
 * /admin/reviews/{id}:
 *   get:
 *     summary: Get review by ID
 *     tags: [Admin Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Review not found
 *
 *   delete:
 *     summary: Delete review
 *     tags: [Admin Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Review not found
 */