const Joi = require("joi");

const bookSchema = Joi.object({
  title: Joi.string().min(3).required().messages({
    "string.base": "Title must be a string",
    "string.empty": "Title is required",
    "string.min": "Title must be at least 3 characters long",
  }),

  category: Joi.string().min(3).required().messages({
    "string.empty": "Category is required",
    "string.min": "Category must be at least 3 characters long",
  }),

  author: Joi.string().min(3).required().messages({
    "string.empty": "Author is required",
    "string.min": "Author must be at least 3 characters long",
  }),

  authorDescription: Joi.string().min(10).required().messages({
    "string.empty": "Author description is required",
    "string.min": "Author description must be at least 10 characters long",
  }),

  price: Joi.number().positive().required().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be greater than 0",
    "any.required": "Price is required",
  }),

  description: Joi.string().min(10).required().messages({
    "string.empty": "Description is required",
    "string.min": "Description must be at least 10 characters long",
  }),

  stockAr: Joi.number().integer().min(0).required().messages({
    "number.base": "Arabic stock must be a number",
    "number.integer": "Arabic stock must be an integer",
    "number.min": "Arabic stock cannot be negative",
    "any.required": "Arabic stock is required",
  }),

  stockEn: Joi.number().integer().min(0).required().messages({
    "number.base": "English stock must be a number",
    "number.integer": "English stock must be an integer",
    "number.min": "English stock cannot be negative",
    "any.required": "English stock is required",
  }),

  stockFr: Joi.number().integer().min(0).required().messages({
    "number.base": "French stock must be a number",
    "number.integer": "French stock must be an integer",
    "number.min": "French stock cannot be negative",
    "any.required": "French stock is required",
  }),
});

module.exports = (req, res, next) => {
  const { error } = bookSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      status: "fail",
      message: "Validation error",
      errors: error.details.map((e) => e.message),
    });
  }

  next();
};
