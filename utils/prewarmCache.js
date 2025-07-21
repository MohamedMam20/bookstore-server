const Book = require("../models/booksModel");
const cache = require("./cache");

/**
 * Cache a specific page of books
 * @param {number} page - Page number to cache
 * @param {number} limit - Number of items per page
 * @param {string} sort - Sort order
 * @returns {Promise<Object>} - The cached response object
 */
async function cacheBooksPage(page, limit, sort) {
  const cacheKey = `books:${JSON.stringify({ page, limit, sort })}`;
  
  // Check if already cached
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch books with lean() to get plain JavaScript objects
  const books = await Book.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await Book.countDocuments();
  const totalPages = Math.ceil(total / limit);

  // Create a response with plain JavaScript objects
  const response = {
    status: "success",
    sort,
    page,
    limit,
    totalItems: total,
    totalPages,
    results: books.length,
    data: books,
  };

  // Store in cache
  cache.set(cacheKey, response);
  console.log(`✅ Cached page ${page}/${totalPages}`);
  
  // No longer automatically cache next pages
  // Progressive caching is now handled only by controllers when pages are accessed

  return response;
}

async function preWarmHomepageCache() {
  try {
    const page = 1;
    const limit = 6;
    const sort = "createdAt_desc";
    
    // Only cache the first page on server startup
    await cacheBooksPage(page, limit, sort);
    console.log("✅ Prewarmed homepage cache");
  } catch (error) {
    console.error("❌ Cache prewarm failed:", error.message);
    console.error(error); // Log the full error for more details
  }
}

module.exports = preWarmHomepageCache;
module.exports.cacheSinglePage = cacheBooksPage;
