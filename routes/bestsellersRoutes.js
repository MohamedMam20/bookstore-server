/**
 * @swagger
 * tags:
 *   name: Bestsellers
 *   description: Bestselling books endpoints
 */

/**
 * @swagger
 * /bestsellers:
 *   get:
 *     summary: Get bestselling books
 *     tags: [Bestsellers]
 *     responses:
 *       200:
 *         description: List of bestselling books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   author:
 *                     type: string
 *                   price:
 *                     type: number
 *                   sales:
 *                     type: number
 */

const express = require("express");
const router = express.Router();
const { getBestSellers } = require("../controllers/bestsellersController");

router.get("/", getBestSellers);

module.exports = router;
