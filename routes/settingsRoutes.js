const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const { verifyToken } = require("../middlewares/verifyToken");
const { admin } = require("../middlewares/admin");

// Admin settings routes
router.get("/", verifyToken, admin, settingsController.getSettings);
router.put("/", verifyToken, admin, settingsController.updateSettings);

module.exports = router;