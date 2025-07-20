const express = require("express");
const router = express.Router();
const bookController = require("../controllers/searchController");
/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Search books
 */

/**
 * @swagger
 * /search/books:
 *   get:
 *     summary: Search books by title
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Text to search for in book titles
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: List of matching books
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalItems:
 *                   type: integer
 *                 results:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *       500:
 *         description: Server error
 */
router.get("/books", bookController.searchBooks);

module.exports = router;
