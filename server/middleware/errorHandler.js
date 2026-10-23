const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    let statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
    let message = err.message || 'Internal server error';

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      statusCode = 400;
      message = Object.values(err.errors).map((e) => e.message).join(', ');
    }
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
      statusCode = 400;
      message = `Invalid value for field '${err.path}'`;
    }
    // Duplicate key
    if (err.code === 11000) {
      statusCode = 409;
      const field = Object.keys(err.keyValue || {})[0];
      message = field ? `An account or record with this ${field} already exists.` : 'Duplicate record.';
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid authentication token.';
    }
    if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Session expired. Please log in again.';
    }

    error = new ApiError(statusCode, message);
  }

  if (process.env.NODE_ENV !== 'production' && !error.isOperational) {
    console.error(err);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(error.details ? { details: error.details } : {}),
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
}

module.exports = { notFound, errorHandler };
