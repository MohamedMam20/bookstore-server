// routes/bookRoutes.js
const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const { verifyToken } = require("../middlewares/verifyToken");
const { admin } = require("../middlewares/admin");
const validateIBook = require("../middlewares/validateIBook");
const {
  getAllBooks,
  createBook,
  updateBook,
  deleteBook,
  getBookById,
  getBookBySlug
} = require("../controllers/bookManagementController");

/**
 * @swagger
 * tags:
 *   name: Book Management
 *   description: Book management endpoints
 */

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Get all books
 *     tags: [Book Management]
 *     responses:
 *       200:
 *         description: List of all books
 *
 *   post:
 *     summary: Create new book
 *     tags: [Book Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - price
 *               - image
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Book created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: Get book by ID
 *     tags: [Book Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book details
 *       404:
 *         description: Book not found
 *
 *   put:
 *     summary: Update book
 *     tags: [Book Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Book updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Book not found
 *
 *   delete:
 *     summary: Delete book
 *     tags: [Book Management]
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
 *         description: Book deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Book not found
 */

/**
 * @swagger
 * /books/slug/{slug}:
 *   get:
 *     summary: Get book by slug
 *     tags: [Book Management]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book details
 *       404:
 *         description: Book not found
 */

// Create a new book
router.post("/", verifyToken, admin, validateIBook, upload.single("image"), createBook);

// Update a book - support both ID and slug
router.put("/:id", verifyToken, admin, validateIBook, upload.single("image"), updateBook);

// Delete a book - support both ID and slug
router.delete("/:id", verifyToken, admin, deleteBook);

// Get all books
router.get("/", getAllBooks);

// Get book by slug - more specific route first
router.get("/slug/:slug", getBookBySlug);

// Get book by ID (or slug as fallback)
router.get("/:id", getBookById);

module.exports = router;
