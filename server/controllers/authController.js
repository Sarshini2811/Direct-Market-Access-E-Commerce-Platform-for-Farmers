const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function sendAuthResponse(res, statusCode, user) {
  const token = signToken(user._id);
  const cookieDays = Number(process.env.JWT_COOKIE_EXPIRES_DAYS || 7);
  res.cookie('token', token, {
    httpOnly: true,
    expires: new Date(Date.now() + cookieDays * 24 * 60 * 60 * 1000),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return sendSuccess(res, statusCode, { user: user.toSafeObject(), token }, null, 'Success');
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  const user = await User.create({
    name,
    email,
    password,
    role: role && ['farmer', 'buyer'].includes(role) ? role : 'buyer', // admins are never self-registered
    phone,
  });

  if (user.role === 'farmer') {
    await FarmerProfile.create({
      user: user._id,
      farmName: `${name}'s Farm`,
    });
  }

  sendAuthResponse(res, 201, user);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Incorrect email or password.');
  }
  if (user.accountStatus !== 'active') {
    throw new ApiError(403, `Your account is ${user.accountStatus}. Contact support.`);
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  sendAuthResponse(res, 200, user);
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  sendSuccess(res, 200, null, null, 'Logged out');
});

const getMe = asyncHandler(async (req, res) => {
  let extra = {};
  if (req.user.role === 'farmer') {
    extra.farmerProfile = await FarmerProfile.findOne({ user: req.user._id });
  }
  sendSuccess(res, 200, { user: req.user.toSafeObject(), ...extra });
});

const updateMe = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'address', 'avatarUrl'];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  sendSuccess(res, 200, { user: user.toSafeObject() }, null, 'Profile updated');
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    throw new ApiError(422, 'New password must be at least 8 characters.');
  }
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect.');
  }
  user.password = newPassword;
  await user.save();
  sendAuthResponse(res, 200, user);
});

module.exports = { register, login, logout, getMe, updateMe, changePassword };
