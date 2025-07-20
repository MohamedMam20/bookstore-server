/**
 * @swagger
 * tags:
 *   name: Books
 *   description: API endpoints for managing books
 */

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: List of all books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: Book Title
 *                   author:
 *                     type: string
 *                     example: Author Name
 *                   slug:
 *                     type: string
 *                     example: book-title
 */

/**
 * @swagger
 * /books/{slug}:
 *   get:
 *     summary: Get a book by its slug
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug of the book
 *     responses:
 *       200:
 *         description: Book found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                   example: Book Title
 *                 author:
 *                   type: string
 *                   example: Author Name
 *                 slug:
 *                   type: string
 *                   example: book-title
 *       404:
 *         description: Book not found
 */

const express = require("express");
const router = express.Router();
bookController = require("../controllers/BooksController");

router.get("/", bookController.getBooks);
router.get("/:slug", bookController.getBookBySlug);

module.exports = router;
