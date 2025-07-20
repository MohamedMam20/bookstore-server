/**
 * @swagger
 * tags:
 *   name: Review
 *   description: Review routes for books
 */

/**
 * @swagger
 * /review:
 *   get:
 *     summary: Get all reviews
 *     tags: [Reviews]
 *     responses:
 *       200:
 *         description: List of all reviews
 */

/**
 * @swagger
 * /review/{slug}:
 *   get:
 *     summary: Get reviews for a specific book
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The slug of the book
 *     responses:
 *       200:
 *         description: Reviews for the book
 */

/**
 * @swagger
 * /review/{slug}:
 *   post:
 *     summary: Submit a new review for a book
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Book slug
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 example: 4
 *               review:
 *                 type: string
 *                 example: "Amazing book!"
 *     responses:
 *       201:
 *         description: Review submitted
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /review/{slug}:
 *   patch:
 *     summary: Update an existing review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Book slug
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 example: 5
 *               review:
 *                 type: string
 *                 example: "Updated review text"
 *     responses:
 *       200:
 *         description: Review updated
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /review/{slug}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Book slug
 *     responses:
 *       200:
 *         description: Review deleted
 *       401:
 *         description: Unauthorized
 */
const express = require("express");
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const {ratingValidation,reviewTextValidation} = require('../middlewares/reviewValidation');
const { verifyToken } = require("../middlewares/verifyToken");

router.get("/",reviewController.getReviews);
router.get("/:slug",reviewController.getBookReviews);
 router.post("/:slug",verifyToken,ratingValidation,reviewTextValidation,reviewController.submitReview);
 router.patch("/:slug",verifyToken,ratingValidation.optional(),reviewTextValidation.optional(),reviewController.updateReview);
 router.delete("/:slug",verifyToken,reviewController.deleteReview);

module.exports = router;

