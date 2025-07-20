const NodeCache = require("node-cache");

// TTL = 3600 seconds (1 hour)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Export the original cache instance
const cacheModule = (module.exports = cache);

/**
 * Get books from cache and optionally trigger progressive caching
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} sort - Sort order
 * @returns {Object|null} - Cached data or null
 */
cacheModule.getBooks = function (page, limit, sort) {
  const cacheKey = `books:${JSON.stringify({ page, limit, sort })}`;
  const data = this.get(cacheKey);

  if (data) {
    // If this is accessed and we have the next page, trigger caching of the next page
    // This is done in background and won't block the response
    const nextPage = page + 1;
    if (nextPage <= data.totalPages) {
      // Defer the cache warm operation to not block the current request
      const nextPageKey = `books:${JSON.stringify({
        page: nextPage,
        limit,
        sort,
      })}`;
      if (!this.has(nextPageKey)) {
        process.nextTick(() => {
          // Import here to avoid circular dependency
          const cacheNextPage = require("./prewarmCache").cacheSinglePage;
          if (typeof cacheNextPage === "function") {
            cacheNextPage(nextPage, limit, sort).catch((err) => {
              console.error(
                `Progressive caching failed for page ${nextPage}: ${err.message}`
              );
            });
          }
        });
      }
    }
  }

  return data;
};

/**
 * Invalidate all book-related caches when data changes
 * This should be called whenever books are created, updated, or deleted
 */
cacheModule.invalidateBookCaches = function () {
  //console.log('🔄 Invalidating book caches due to data change');

  // Get all keys in the cache
  const keys = this.keys();

  // Filter keys related to books and delete them
  const bookKeys = keys.filter((key) => key.startsWith("books:"));

  // If there are book-related keys, delete them
  if (bookKeys.length > 0) {
    //console.log(`🗑️ Removing ${bookKeys.length} book-related cache entries`);
    bookKeys.forEach((key) => this.del(key));
  }
};

/**
 * Invalidate cache for a specific genre
 * @param {string} genre - Genre to invalidate
 */
cacheModule.invalidateGenreCache = function (genre) {
  if (!genre) return;

  //console.log(`🔄 Invalidating cache for genre: ${genre}`);

  // Get all keys in the cache
  const keys = this.keys();

  // Filter keys related to the specific genre
  const genreKeys = keys.filter((key) => {
    if (!key.startsWith("books:")) return false;

    try {
      // Extract the JSON part from the key
      const jsonPart = key.substring(6); // after 'books:'
      const params = JSON.parse(jsonPart);

      // Check if the key relates to this genre
      if (params.genre === genre) return true;

      // Check for multi-genre keys that include this genre
      if (typeof params.genre === "string" && params.genre.includes(",")) {
        const genres = params.genre.split(",");
        return genres.includes(genre);
      }

      return false;
    } catch (e) {
      return false;
    }
  });

  // If there are genre-related keys, delete them
  if (genreKeys.length > 0) {
    //console.log(`🗑️ Removing ${genreKeys.length} genre-related cache entries for "${genre}"`);
    genreKeys.forEach((key) => this.del(key));
  }
};
