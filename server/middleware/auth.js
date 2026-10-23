const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

// Verifies the JWT (from Authorization header or httpOnly cookie) and attaches req.user
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) throw new ApiError(401, 'Not authenticated. Please log in.');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired session. Please log in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'The user for this session no longer exists.');
  if (user.accountStatus !== 'active') {
    throw new ApiError(403, `Your account is ${user.accountStatus}. Contact support.`);
  }

  req.user = user;
  next();
});

// Optional auth: attaches req.user if a valid token is present, but never blocks the request
const attachUserIfPresent = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  let token;
  if (header && header.startsWith('Bearer ')) token = header.split(' ')[1];
  else if (req.cookies && req.cookies.token) token = req.cookies.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.accountStatus === 'active') req.user = user;
    } catch (err) {
      // ignore invalid token in optional mode
    }
  }
  next();
});

// Restrict to one or more roles, e.g. restrictTo('admin'), restrictTo('farmer', 'admin')
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user) throw new ApiError(401, 'Not authenticated.');
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, `Role '${req.user.role}' is not permitted to perform this action.`);
    }
    next();
  };
}

module.exports = { protect, attachUserIfPresent, restrictTo };
