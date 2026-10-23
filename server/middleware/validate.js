const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Run this after an array of express-validator chains to collect and format errors.
module.exports = function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  next(new ApiError(422, 'Validation failed', formatted));
};
