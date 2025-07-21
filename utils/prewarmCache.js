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

  // Determine sort option
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

  // Fetch books with correct sorting
  const books = await Book.find()
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await Book.countDocuments();
  const totalPages = Math.ceil(total / limit);

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
  return response;
}

async function preWarmHomepageCache() {
  try {
    const page = 1;
    const limit = 6;
    const sort = "createdAt_desc";
    await cacheBooksPage(page, limit, sort);
  } catch (error) {
    console.error("❌ Cache prewarm failed:", error.message);
  }
}

module.exports = preWarmHomepageCache;
module.exports.cacheSinglePage = cacheBooksPage;
