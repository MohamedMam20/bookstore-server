/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication routes
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: yassmin
 *               lastName:
 *                 type: string
 *                 example: sayed
 *               email:
 *                 type: string
 *                 example: yassmin@example.com
 *               password:
 *                 type: string
 *                 example: MySecret123
 *               confirmPassword:
 *                 type: string
 *                 example: MySecret123
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: yassmin.sayed868@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456789aA@
 *     responses:
 *       200:
 *         description: Successful login
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /auth/googleLogin:
 *   post:
 *     summary: Login with Google
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: GoogleAccessTokenHere
 *     responses:
 *       200:
 *         description: Successful Google login
 *       400:
 *         description: Invalid Google token
 */

/**
 * @swagger
 * /auth/requestPasswordReset:
 *   post:
 *     summary: Request password reset link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset link sent
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /auth/resetPassword:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: ResetToken123
 *               newPassword:
 *                 type: string
 *                 example: NewPassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid token or validation error
 */









require("dotenv").config();

const { Router } = require("express");

const router = Router();

const { User } = require("../models/usersModel");

const authController = require("../controllers/authController");

const {
  emailValidation,
  passwordValidation,
  firstNameValidation,
  lastNameValidation,
  passwordConfirm,
  emailloginValidation,
  newpasswordValidation,
} = require("../middlewares/authValidation");

//register
router.post(
  "/register",
  firstNameValidation,
  lastNameValidation,
  emailValidation,
  passwordValidation,
  passwordConfirm,
  authController.register
);

//login
router.post("/login", emailloginValidation, authController.login);

router.post("/googleLogin", authController.googleLogin);

router.post("/requestPasswordReset", authController.requestPasswordReset);

router.post(
  "/resetPassword",
  newpasswordValidation,
  authController.resetPassword
);

module.exports = router;
