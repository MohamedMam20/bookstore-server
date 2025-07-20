const Book = require("../models/booksModel");

exports.searchBooks = async (req, res) => {
  try {
    const search = req.query.search || "";
    let { page = 1, limit = 6 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1) page = 1;
    if (limit < 1) limit = 6;

    const skip = (page - 1) * limit;

    const searchCondition = {
      $or: [{ title: { $regex: search, $options: "i" } }],
    };

    const books = await Book.find(searchCondition)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Book.countDocuments(searchCondition);

    res.status(200).json({
      status: "success",
      page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      results: books.length,
      data: books,
    });
  } catch (err) {
    console.error("Failed to search books:", err);
    res.status(500).json({
      status: "error",
      message: "Server Error",
    });
  }
};
