const Book = require("../models/booksModel");
const Review = require("../models/reviewModel");
const mongoose = require("mongoose");
const cache = require("../utils/cache");

exports.getBooks = async (req, res) => {
  try {
    const { sort = "createdAt_desc", page = 1, limit = 6, genre, language, priceMin, priceMax } = req.query;

    // Parse page/limit
    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.max(parseInt(limit), 1);
    
    // Check if there are any filters applied
    const hasFilters = genre || language || priceMin || priceMax;
    
    // Only use cache for standard requests without filters
    if (!hasFilters) {
      // Try to get from cache first
      const cacheKey = `books:${JSON.stringify({ page: pageNum, limit: limitNum, sort })}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        console.log(`📖 Cache hit for books page ${pageNum}`);
        
        // Only trigger caching of the NEXT page (not a chain reaction)
        const nextPage = pageNum + 1;
        if (nextPage <= cachedData.totalPages) {
          const nextPageCacheKey = `books:${JSON.stringify({ page: nextPage, limit: limitNum, sort })}`;
          // If next page isn't cached, trigger caching in background
          if (!cache.has(nextPageCacheKey)) {
            process.nextTick(async () => {
              try {
                const { cacheSinglePage } = require("../utils/prewarmCache");
                await cacheSinglePage(nextPage, limitNum, sort);
                console.log(`🔄 Progressive caching triggered for page ${nextPage} after hit on page ${pageNum}`);
              } catch (err) {
                console.error(`Failed to progressively cache page ${nextPage}:`, err);
              }
            });
          }
        }
        
        return res.status(200).json(cachedData);
      }
    }

    const skip = (pageNum - 1) * limitNum;

    // Build sort option
    let sortOption;
    switch (sort) {
      case "title_asc":
        sortOption = { title: 1 };
        break;
      case "title_desc":
        sortOption = { title: -1 };
        break;
      case "price_asc":
        sortOption = { price: 1 };
        break;
      case "price_desc":
        sortOption = { price: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    console.log("Sort option:", sortOption);

    // Build query with filters
    const query = {};

    // FIX: Correctly query the nested 'category.name' field with case-insensitivity
    if (genre) {
      const fieldToQuery = "category.name";
      if (Array.isArray(genre)) {
        const genreRegexes = genre.map(g => new RegExp(`^${g}$`, 'i'));
        query[fieldToQuery] = { $in: genreRegexes };
      } else {
        query[fieldToQuery] = { $regex: new RegExp(`^${genre}$`, 'i') };
      }
    }

    // Price filter
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = Number(priceMin);
      if (priceMax) query.price.$lte = Number(priceMax);
    }

    // Language stock filter
    if (language) {
      // Map language name to stock key
      const stockFieldMap = {
        Arabic: "ar",
        English: "en",
        French: "fr",
      };

      const langKeys = Array.isArray(language) ? language : [language];

      // Build $or to match any selected language with stock > 0
      query.$or = langKeys
        .map((lang) => {
          const key = stockFieldMap[lang];
          if (!key) return null;
          return { [`stock.${key}`]: { $gt: 0 } };
        })
        .filter(Boolean);
    }

    // Query with filters
    const books = await Book.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean(); // Use lean for performance and to avoid document conversion issues
      
    const total = await Book.countDocuments(query);

    const response = {
      status: "success",
      sort,
      page: pageNum,
      limit: limitNum,
      totalItems: total,
      totalPages: Math.ceil(total / limitNum),
      results: books.length,
      data: books,
    };
    
    // Cache the result if there are no filters
    if (!hasFilters) {
      const cacheKey = `books:${JSON.stringify({ page: pageNum, limit: limitNum, sort })}`;
      cache.set(cacheKey, response);
      console.log(`💾 Cached books page ${pageNum}`);
      
      // Cache the next page only, not all subsequent pages
      const nextPage = pageNum + 1;
      if (nextPage <= response.totalPages) {
        const nextPageKey = `books:${JSON.stringify({ page: nextPage, limit: limitNum, sort })}`;
        if (!cache.has(nextPageKey)) {
          process.nextTick(async () => {
            try {
              const { cacheSinglePage } = require("../utils/prewarmCache");
              await cacheSinglePage(nextPage, limitNum, sort);
              console.log(`🔄 Proactively cached next page ${nextPage} after request for page ${pageNum}`);
            } catch (err) {
              console.error(`Failed to progressively cache page ${nextPage}:`, err);
            }
          });
        }
      }
    }

    res.status(200).json(response);
  } catch (err) {
    console.error("Failed to fetch books:", err);
    res.status(500).json({ message: err.message });
  }
};

// =====================================================

exports.getBookById = async (req, res) => {
  try {
    const bookId = req.params.id;
    console.log("ID received:", bookId);

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      console.log("Invalid ObjectId format");
      return res.status(400).json({ message: "Invalid book ID" });
    }
    // Note: This function doesn't do anything with the ID yet.
    // You would typically fetch and return a book here.
    res.status(200).json({ message: "Book ID is valid." });

  } catch (err) {
    console.error("Error in getBookById:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getBookBySlug = async (req, res) => {
  try {
    const book = await Book.findOne({ slug: req.params.slug }).populate(
      "reviews"
    ).lean(); // Use .lean() for a plain JS object to allow modification

    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Book not found" });
    }

    // FIX: The original code sent two responses, which causes a crash.
    // This has been fixed by calculating review data and sending one combined response.
    const reviews = await Review.find({ book: book._id });
    const reviewsCount = reviews.length;
    const averageRating = reviewsCount
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewsCount
      : 0;

    // Combine book data with calculated review data
    const responseData = {
      ...book,
      reviewsCount,
      averageRating: Number(averageRating.toFixed(1)),
    };

    res.status(200).json({
        success: true,
        data: responseData
    });

  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};
