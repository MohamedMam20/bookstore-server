const Book = require("../models/booksModel");
const mongoose = require("mongoose");

const getBestSellers = async (req, res) => {
  try {
    const bestsellerDoc = await mongoose.connection
      .collection("bestsellers")
      .findOne({ _id: "bestseller-list" });

    if (
      !bestsellerDoc ||
      !Array.isArray(bestsellerDoc.bookIds) ||
      bestsellerDoc.bookIds.length === 0
    ) {
      return res.status(404).json({
        status: "fail",
        message: "No bestsellers found.",
      });
    }

    const objectIds = bestsellerDoc.bookIds.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const books = await Book.find({ _id: { $in: objectIds } });

    if (!books || books.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No matching books found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Bestsellers fetched successfully.",
      results: books.length,
      data: books,
    });
  } catch (err) {
    console.error("Error fetching best sellers:", err);
    res.status(500).json({
      status: "error",
      message: "Server error while fetching bestsellers.",
      error: err.message,
    });
  }
};

module.exports = {
  getBestSellers,
};
