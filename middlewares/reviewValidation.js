const {body} = require("express-validator");
const Review = require("../models/reviewModel");

const ratingValidation = body("rating").isInt({min:1 , max:5}).withMessage("Rating must be a number between 1 and 5");
const reviewTextValidation = body("review").trim().notEmpty().withMessage("Review text is required").isLength({ max: 500 }).withMessage("Review must not exceed 500 characters");

module.exports = {
  ratingValidation,
  reviewTextValidation,
};
