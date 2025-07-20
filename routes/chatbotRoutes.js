// routes/bookAIRoutes.js
const express = require("express");
const router = express.Router();
const chatBotConroller = require("../controllers/chatBotController");
/**
 * @swagger
 * tags:
 *   name: AI Chat
 *   description: Endpoints for chatting with the Book AI
 */

/**
 * @swagger
 * /ai:
 *   post:
 *     summary: Chat with AI about books
 *     description: Sends a user message to the AI and returns a reply related to books or book genres.
 *     tags: [AI Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Can you recommend a good fantasy book?"
 *     responses:
 *       200:
 *         description: Successful AI response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                   example: "I recommend reading 'The Hobbit' by J.R.R. Tolkien."
 *       400:
 *         description: Bad Request - Missing or empty message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                   example: "Message cannot be empty."
 *       500:
 *         description: Server Error - Cohere API issue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                   example: "Something went wrong."
 */
router.post("/", chatBotConroller.chatWithAI);

module.exports = router;
