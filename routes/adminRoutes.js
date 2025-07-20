const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken } = require("../middlewares/verifyToken");
const { admin } = require("../middlewares/admin");
const { user } = require("../middlewares/user");

// Admin routes
router.get("/", verifyToken, admin, adminController.getAllUsers);
router.get("/:id", verifyToken, admin, adminController.getUserById);
router.post("/", verifyToken, admin, adminController.createUser); // New route for creating users
router.patch("/:id", verifyToken, admin, adminController.updateUser);
router.delete("/:id", verifyToken, admin, adminController.deleteUser);

router.get("/metrics/users", verifyToken, admin, adminController.getTotalUsers);
router.get(
  "/metrics/orders",
  verifyToken,
  admin,
  adminController.getTotalOrders
);
router.get(
  "/metrics/revenue",
  verifyToken,
  admin,
  adminController.getTotalRevenue
);

module.exports = router;
