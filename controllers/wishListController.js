const WishlistItem = require("../models/wishListModel");
const Book = require("../models/booksModel");

// =====================================
exports.addToWishlist = async (req, res) => {
  try {
    const { bookId, language } = req.body;
    const lang = language || "en";

    if (!bookId) {
      return res.status(400).json({
        status: "fail",
        message: "Book ID is required.",
      });
    }

    const userId = req.user.id;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        status: "fail",
        message: "Book not found.",
      });
    }

    const existing = await WishlistItem.findOne({
      book: bookId,
      user: userId,
      language: lang,
    });

    if (existing) {
      return res.status(200).json({
        status: "success",
        message: "Already in wishlist.",
      });
    }

    await WishlistItem.create({
      book: bookId,
      language: lang,
      user: userId,
    });

    res.status(200).json({
      status: "success",
      message: "Added to wishlist!",
      data: { book },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// =====================================
exports.viewWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const wishlistItems = await WishlistItem.find({ user: userId }).populate(
      "book"
    );
    const formatted = wishlistItems.map((item) => ({
      id: item._id,
      bookId: item.book._id,
      title: item.book.title,
      price: item.book.price,
      image: item.book.image,
      language: item.language,
    }));

    res.status(200).json({
      status: "success",
      data: formatted,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// =====================================
exports.removeFromWishlist = async (req, res) => {
  try {
    const bookId = req.query.bookId || req.body.id;
    const userId = req.user.id;
    
    if (!bookId) {
      return res.status(400).json({
        status: "fail",
        message: "Book ID is required.",
      });
    }

    const item = await WishlistItem.findOneAndDelete({
      book: bookId,
      user: userId,
    });

    if (!item) {
      return res.status(404).json({
        status: "fail",
        message: "Item not found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Item removed from wishlist.",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
