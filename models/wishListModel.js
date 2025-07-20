const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  language: {
    type: String,
    default: "en",
  },
});

module.exports = mongoose.model("WishlistItem", wishlistSchema);
