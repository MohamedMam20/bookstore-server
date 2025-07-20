const express = require("express");
const router = express.Router();
const { getBestSellers } = require("../controllers/bestsellersController");

router.get("/", getBestSellers);

module.exports = router;
