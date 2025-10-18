const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Validation result checker middleware
 * Checks for validation errors from express-validator
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));

    throw new ApiError(400, 'Validation failed', true, {
      errors: extractedErrors
    });
  }

  next();
};

module.exports = validate;
