const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { verifyToken } = require("../middlewares/verifyToken");
const { admin } = require("../middlewares/admin");
const { body } = require("express-validator");

// Validation middleware for category
const validateCategory = [
  body("name")
    .notEmpty()
    .withMessage("Category name is required")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category name must be between 2 and 50 characters"),
  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters")
];

// Public route - Get all categories
router.get("/", categoryController.getAllCategories);

// Specific route for slug - MUST come before the generic :id route
router.get("/slug/:slug", categoryController.getCategoryBySlug);

// Admin routes - Protected
router.post("/", verifyToken, validateCategory, categoryController.createCategory);
router.put("/:id", verifyToken, admin, validateCategory, categoryController.updateCategory);
router.delete("/:id", verifyToken, admin, categoryController.deleteCategory);

// Generic route for ID or slug - MUST come after more specific routes
router.get("/:id", categoryController.getCategoryById);

module.exports = router;