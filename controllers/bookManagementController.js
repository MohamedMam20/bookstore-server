const Book = require("../models/booksModel");
const slugify = require("slugify");
const cloudinary = require("../utils/cloudinary");
const cache = require("../utils/cache");

//const { extractTextFromImage } = require("../utils/vision");

const getAllBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';

    // Build search condition
    let searchCondition = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      searchCondition = {
        $or: [
          { title: regex },
          { author: regex },
          { description: regex },
          { 'category.name': regex }
        ]
      };
    }
    if (category) {
      // If search is also present, combine with $and
      const categoryCond = { 'category.name': { $regex: new RegExp(`^${category}$`, 'i') } };
      if (Object.keys(searchCondition).length > 0) {
        searchCondition = { $and: [searchCondition, categoryCond] };
      } else {
        searchCondition = categoryCond;
      }
    }

    // Count total books for pagination (with search)
    const totalBooks = await Book.countDocuments(searchCondition);

    // Get books with pagination (with search)
    const books = await Book.find(searchCondition)
      .populate('user', 'name')
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      status: 'success',
      page,
      totalPages: Math.ceil(totalBooks / limit),
      totalItems: totalBooks,
      results: books.length,
      data: books,
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: 'Error fetching books',
      error: err.message,
    });
  }
};


const createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      authorDescription,
      price,
      description,
      stockAr,
      stockEn,
      stockFr,
      categoryId,
      categoryName
    } = req.body;

    console.log('Request body:', req.body); // Debug log

    // Get category from request body - fix the parsing for form data
    let category = { _id: '', name: '' };
    
    // Approach 1: Check if category was sent as JSON string
    if (req.body.category && typeof req.body.category === 'string') {
      try {
        category = JSON.parse(req.body.category);
      } catch (e) {
        console.error('Error parsing category JSON:', e);
      }
    } 
    // Approach 2: Check for bracket notation fields
    else if (req.body['category[_id]']) {
      category = {
        _id: req.body['category[_id]'],
        name: req.body['category[name]'] || ''
      };
    } 
    // Approach 3: Check for flat fields
    else if (categoryId) {
      category = {
        _id: categoryId,
        name: categoryName || ''
      };
    }
    // Approach 4: Check if category is an object directly
    else if (req.body.category && typeof req.body.category === 'object') {
      category = {
        _id: req.body.category._id || '',
        name: req.body.category.name || ''
      };
    }
    
    console.log('Parsed category:', category); // Debug log

    let imageUrl = null;

    // ✅ Upload to Cloudinary if image is uploaded
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "bookStore" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      imageUrl = result.secure_url;
    }

    // ✅ Check for required fields
    if (!title || !price) {
      return res.status(400).json({
        status: "fail",
        message: "Missing required fields: title or price.",
      });
    }

    const newBook = await Book.create({
      title,
      category,
      author,
      authorDescription,
      price,
      description,
      stock: {
        ar: parseInt(stockAr) || 0,
        en: parseInt(stockEn) || 0,
        fr: parseInt(stockFr) || 0,
      },
      image: imageUrl,
      slug: slugify(title, { lower: true }),
      user: req.user.id,
    });

    res.status(201).json({
      status: "success",
      message: "Book added successfully.",
      data: newBook,
    });
    
    // Invalidate any book caches since we've added a new book
    // This should happen after the response is sent to avoid delaying the response
    process.nextTick(() => {
      if (newBook.category && newBook.category.name) {
        cache.invalidateGenreCache(newBook.category.name);
      }
      cache.invalidateBookCaches();
    });
  } catch (err) {
    console.error("Book creation error:", err);
    res.status(500).json({
      status: "error",
      message: "Book creation failed.",
      error: err.message,
    });
  }
};


const updateBook = async (req, res) => {
  try {
    console.log("Decoded user from token:", req.user);

    const { id } = req.params; // Can be either an ID or slug

    const {
      title,
      author,
      authorDescription,
      price,
      description,
      stockAr,
      stockEn,
      stockFr,
      categoryId,
      categoryName
    } = req.body;

    console.log('Update Request body:', req.body); // Debug log

    // Get category from request body - fix the parsing for form data
    let category = { _id: '', name: '' };
    
    // Approach 1: Check if category was sent as JSON string
    if (req.body.category && typeof req.body.category === 'string') {
      try {
        category = JSON.parse(req.body.category);
      } catch (e) {
        console.error('Error parsing category JSON:', e);
      }
    } 
    // Approach 2: Check for bracket notation fields
    else if (req.body['category[_id]']) {
      category = {
        _id: req.body['category[_id]'],
        name: req.body['category[name]'] || ''
      };
    } 
    // Approach 3: Check for flat fields
    else if (categoryId) {
      category = {
        _id: categoryId,
        name: categoryName || ''
      };
    }
    // Approach 4: Check if category is an object directly
    else if (req.body.category && typeof req.body.category === 'object') {
      category = {
        _id: req.body.category._id || '',
        name: req.body.category.name || ''
      };
    }
    
    console.log('Parsed category for update:', category); // Debug log

    if (!title || !price) {
      return res.status(400).json({
        status: "fail",
        message: "title and price are required.",
      });
    }

    // Create the updatedData object including the category
    const updatedData = {
      title,
      category,
      author,
      authorDescription,
      price: parseFloat(price),
      description,
      stock: {
        ar: parseInt(stockAr) || 0,
        en: parseInt(stockEn) || 0,
        fr: parseInt(stockFr) || 0,
      },
      slug: slugify(title, { lower: true }),
      user: req.user.id,
    };

    // ✅ If image file is uploaded, handle it
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "bookStore" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      updatedData.image = result.secure_url;
    }

    // Check if the ID parameter is a valid MongoDB ObjectID
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let updatedBook;
    
    if (isValidObjectId) {
      // If it's a valid ObjectID, update by ID
      updatedBook = await Book.findByIdAndUpdate(id, updatedData, {
        new: true,
        runValidators: true,
      });
    } else {
      // Otherwise, try to update by slug
      updatedBook = await Book.findOneAndUpdate({ slug: id }, updatedData, {
        new: true,
        runValidators: true,
      });
    }

    if (!updatedBook) {
      return res.status(404).json({
        status: "fail",
        message: "Book not found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Book updated successfully.",
      data: updatedBook,
    });
    
    // Invalidate any book caches since we've updated a book
    // This should happen after the response is sent to avoid delaying the response
    process.nextTick(() => {
      if (updatedBook.category && updatedBook.category.name) {
        cache.invalidateGenreCache(updatedBook.category.name);
      }
      cache.invalidateBookCaches();
    });
  } catch (err) {
    console.error("Update failed:", err);
    res.status(500).json({
      status: "fail",
      message: "Book update failed",
      error: err.message,
    });
  }
};

// DELETE BOOK
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params; // Can be either an ID or slug
    
    // Check if the ID parameter is a valid MongoDB ObjectID
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let deletedBook;
    
    if (isValidObjectId) {
      // If it's a valid ObjectID, delete by ID
      deletedBook = await Book.findByIdAndDelete(id);
    } else {
      // Otherwise, try to delete by slug
      deletedBook = await Book.findOneAndDelete({ slug: id });
    }

    if (!deletedBook) {
      return res.status(404).json({
        status: "fail",
        message: "Book not found.",
      });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
    
    // Invalidate any book caches since we've deleted a book
    // This should happen after the response is sent to avoid delaying the response
    process.nextTick(() => {
      if (deletedBook.category && deletedBook.category.name) {
        cache.invalidateGenreCache(deletedBook.category.name);
      }
      cache.invalidateBookCaches();
    });
  } catch (err) {
    console.error("DELETE failed:", err);
    res.status(500).json({
      status: "error",
      message: "Server error.",
    });
  }
};

// GET BOOK BY SLUG
const getBookBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const book = await Book.findOne({ slug });
    
    if (!book) {
      return res.status(404).json({
        status: "fail",
        message: "Book not found."
      });
    }
    
    res.status(200).json({
      status: "success",
      data: book
    });
  } catch (err) {
    console.error("Error fetching book by slug:", err);
    res.status(500).json({
      status: "fail",
      message: "Error fetching book",
      error: err.message
    });
  }
};

// GET BOOK BY ID
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the ID is a valid MongoDB ObjectID
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let book;
    
    if (isValidObjectId) {
      // If it's a valid ObjectID, fetch by ID
      book = await Book.findById(id);
    } else {
      // Otherwise, try to find by slug
      book = await Book.findOne({ slug: id });
    }
    
    if (!book) {
      return res.status(404).json({
        status: "fail",
        message: "Book not found."
      });
    }
    
    res.status(200).json({
      status: "success",
      data: book
    });
  } catch (err) {
    console.error("Error fetching book:", err);
    res.status(500).json({
      status: "fail",
      message: "Error fetching book",
      error: err.message
    });
  }
};

module.exports = {
  updateBook,
  deleteBook,
  createBook,
  getAllBooks,
  getBookById,
  getBookBySlug
};
