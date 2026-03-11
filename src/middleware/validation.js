const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validate
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

const threadValidation = [
  body('title').trim().isLength({ min: 5, max: 255 }).withMessage('Title must be between 5 and 255 characters'),
  body('content').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  validate
];

const postValidation = [
  body('content').trim().isLength({ min: 1 }).withMessage('Content cannot be empty'),
  validate
];

module.exports = {
  registerValidation,
  loginValidation,
  threadValidation,
  postValidation
};