/**
 * @swagger
 * /otp/send-otp:
 *   post:
 *     summary: Verify OTP sent to user
 *     tags: [OTP]
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
 *               otp:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid OTP or email
 */


const express = require('express');
const otpController = require('../controllers/otpController');
const router = express.Router();

router.post('/send-otp', otpController.verifyOTP);

module.exports = router;
