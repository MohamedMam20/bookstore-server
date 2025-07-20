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