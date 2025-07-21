const Category = require('../models/categoryModel');
const { validationResult } = require('express-validator');
const { isValidObjectId } = require('mongoose');
const cache = require('../utils/cache');

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Count total categories for pagination
    const totalCategories = await Category.countDocuments();
    
    // Get categories with pagination - only populate if fields exist
    const categories = await Category.find()
      .populate('parentCategory', 'name')
      .populate('createdBy', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "Success",
      message: "Categories fetched successfully",
      page,
      totalPages: Math.ceil(totalCategories / limit),
      totalItems: totalCategories,
      data: categories
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      status: "Failure",
      message: "Error fetching categories",
      error: error.message
    });
  }
};

// Get category by ID or slug
const getCategoryById = async (req, res) => {
  try {
    const identifier = req.params.id;
    console.log('🔍 Getting category by identifier:', identifier);
    
    let category;
    
    // Check if the identifier is an ObjectId or a slug
    if (isValidObjectId(identifier)) {
      console.log('✅ Identifier is a valid ObjectId, searching by ID');
      category = await Category.findById(identifier)
        .populate('parentCategory', 'name')
        .populate('createdBy', 'firstName lastName');
    } else {
      console.log('🔤 Identifier is not an ObjectId, searching by slug');
      category = await Category.findOne({ slug: identifier })
        .populate('parentCategory', 'name')
        .populate('createdBy', 'firstName lastName');
    }
    
    if (!category) {
      console.log('❌ Category not found for identifier:', identifier);
      return res.status(404).json({
        status: "Failure",
        message: "Category not found"
      });
    }
    
    console.log('✅ Category found:', category._id, category.name);
    res.status(200).json({
      status: "Success",
      data: category
    });
  } catch (error) {
    console.error('❌ Error in getCategoryById:', error);
    res.status(500).json({
      status: "Failure",
      message: "Error fetching category",
      error: error.message
    });
  }
};

// Get category by slug
const getCategoryBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;
    
    const category = await Category.findOne({ slug })
      .populate('parentCategory', 'name')
      .populate('createdBy', 'firstName lastName');
    
    if (!category) {
      return res.status(404).json({
        status: "Failure",
        message: "Category not found"
      });
    }
    
    res.status(200).json({
      status: "Success",
      data: category
    });
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Error fetching category",
      error: error.message
    });
  }
};

// Create a new category
const createCategory = async (req, res) => {
  try {
    console.log("📝 Create Category - Request Headers:", req.headers);
    console.log("📝 Create Category - Request Body:", req.body);
    console.log("📝 Create Category - Request User:", req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Create Category - Validation errors:", errors.array());
      return res.status(400).json({
        status: "Failure",
        message: errors.array()[0].msg
      });
    }

    if (!req.user || !req.user.id) {
      console.log("❌ Create Category - No user or user ID found");
      return res.status(401).json({
        status: "Failure",
        message: "Unauthorized: User not authenticated"
      });
    }

    const { name, description } = req.body;
    
    const newCategory = await Category.create({
      name,
      description,
      // parentCategory is removed
      createdBy: req.user.id
    });
    
    res.status(201).json({
      status: "Success",
      message: "Category created successfully",
      data: newCategory
    });
    
    // Invalidate book caches since a new category could affect filtering
    process.nextTick(() => {
      cache.invalidateBookCaches();
    });
  } catch (error) {
    console.error("❌ Category creation failed:", error);
    res.status(500).json({
      status: "Failure",
      message: "Error creating category",
      error: error.message
    });
  }
};


// Update a category
const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "Failure",
        message: errors.array()[0].msg
      });
    }

    const identifier = req.params.id;
    const { name, description } = req.body;
    
    let category;

    // Check if the identifier is an ObjectId or a slug
    if (isValidObjectId(identifier)) {
      category = await Category.findById(identifier);
    } else {
      category = await Category.findOne({ slug: identifier });
    }
    
    if (!category) {
      return res.status(404).json({
        status: "Failure",
        message: "Category not found"
      });
    }
    
    // Check if new name already exists (if name is being updated)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({
          status: "Failure",
          message: "Category with this name already exists"
        });
      }
    }
    
    // Update fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    
    await category.save();
    
    res.status(200).json({
      status: "Success",
      message: "Category updated successfully",
      data: category
    });
    
    // Invalidate specific genre cache and general book caches
    process.nextTick(() => {
      if (category.name) {
        cache.invalidateGenreCache(category.name);
      }
      cache.invalidateBookCaches();
    });
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Error updating category",
      error: error.message
    });
  }
};

// Delete a category
const deleteCategory = async (req, res) => {
  try {
    const identifier = req.params.id;
    let category;
    
    // Check if the identifier is an ObjectId or a slug
    if (isValidObjectId(identifier)) {
      // Check if category has children
      const hasChildren = await Category.findOne({ parentCategory: identifier });
      if (hasChildren) {
        return res.status(400).json({
          status: "Failure",
          message: "Cannot delete category with subcategories. Please delete or reassign subcategories first."
        });
      }
      
      category = await Category.findByIdAndDelete(identifier);
    } else {
      const foundCategory = await Category.findOne({ slug: identifier });
      if (foundCategory) {
        // Check if category has children
        const hasChildren = await Category.findOne({ parentCategory: foundCategory._id });
        if (hasChildren) {
          return res.status(400).json({
            status: "Failure",
            message: "Cannot delete category with subcategories. Please delete or reassign subcategories first."
          });
        }
        
        category = await Category.findByIdAndDelete(foundCategory._id);
      }
    }
    
    if (!category) {
      return res.status(404).json({
        status: "Failure",
        message: "Category not found"
      });
    }
    
    res.status(200).json({
      status: "Success",
      message: "Category deleted successfully"
    });
    
    // Invalidate specific genre cache and general book caches
    process.nextTick(() => {
      if (category.name) {
        cache.invalidateGenreCache(category.name);
      }
      cache.invalidateBookCaches();
    });
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Error deleting category",
      error: error.message
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
};