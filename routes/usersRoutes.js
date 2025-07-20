/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management routes
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /users/myprofile:
 *   get:
 *     summary: Get logged-in user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /users/myprofile:
 *   patch:
 *     summary: Update logged-in user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Yassmin"
 *               lastName:
 *                 type: string
 *                 example: "Sayed"
 *               oldPassword:
 *                 type: string
 *                 example: "oldpass123"
 *               newPassword:
 *                 type: string
 *                 example: "newpass456"
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 */
const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController")
const {verifyToken} = require("../middlewares/verifyToken");
const {admin} = require("../middlewares/admin");
const {user} = require ("../middlewares/user")
const { firstNameValidation,lastNameValidation, oldpasswordValidation, newpasswordValidation} = require("../middlewares/authValidation");



//router.post("/", createUser);

router.get("/", verifyToken,admin,usersController.getAllUsers);
router.get("/myprofile",verifyToken,usersController.getmyProfile);
router.patch("/myprofile",verifyToken,firstNameValidation.optional(),lastNameValidation,newpasswordValidation,usersController.updatemyProfile);



module.exports = router;