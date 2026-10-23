const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const VerificationRequest = require('../models/VerificationRequest');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const { logAction } = require('../services/auditService');
const { ACCOUNT_STATUS } = require('../config/constants');

const dashboardStats = asyncHandler(async (req, res) => {
  const [
    totalFarmers, totalBuyers, pendingVerifications,
    totalListings, activeListings, totalOrders, completedOrders,
    openReports, gmvAgg,
  ] = await Promise.all([
    User.countDocuments({ role: 'farmer' }),
    User.countDocuments({ role: 'buyer' }),
    VerificationRequest.countDocuments({ status: 'pending' }),
    Product.countDocuments({}),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments({}),
    Order.countDocuments({ status: 'delivered' }),
    Report.countDocuments({ status: 'open' }),
    Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, gmv: { $sum: '$totalAmount' } } },
    ]),
  ]);

  const recentOrders = await Order.find({}).sort('-createdAt').limit(8).populate('buyer', 'name');

  sendSuccess(res, 200, {
    totals: {
      totalFarmers,
      totalBuyers,
      pendingVerifications,
      totalListings,
      activeListings,
      totalOrders,
      completedOrders,
      openReports,
      grossMerchandiseValue: gmvAgg[0]?.gmv || 0,
    },
    recentOrders,
    note: 'All figures are computed live from stored application data (demo seed records included).',
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const { role, status, q, page = 1, limit = 15 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.accountStatus = status;
  if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);
  sendPaginated(res, items, page, limit, total);
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { accountStatus } = req.body;
  if (!ACCOUNT_STATUS.includes(accountStatus)) throw new ApiError(422, `accountStatus must be one of: ${ACCOUNT_STATUS.join(', ')}`);

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (user.role === 'admin') throw new ApiError(400, 'Cannot change status of an admin account.');

  user.accountStatus = accountStatus;
  await user.save();

  await logAction({
    actorId: req.user._id,
    action: 'user.status_change',
    targetType: 'User',
    targetId: user._id,
    metadata: { accountStatus },
  });

  sendSuccess(res, 200, { user: user.toSafeObject() }, null, 'User status updated');
});

const listAllListings = asyncHandler(async (req, res) => {
  const { active, page = 1, limit = 15 } = req.query;
  const filter = {};
  if (active !== undefined) filter.isActive = active === 'true';

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Product.find(filter).populate('farmer', 'name email').sort('-createdAt').skip(skip).limit(Number(limit)),
    Product.countDocuments(filter),
  ]);
  sendPaginated(res, items, page, limit, total);
});

const moderateListing = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!product) throw new ApiError(404, 'Product not found.');

  await logAction({
    actorId: req.user._id,
    action: 'product.moderate',
    targetType: 'Product',
    targetId: product._id,
    metadata: { isActive },
  });

  sendSuccess(res, 200, { product }, null, 'Listing moderated');
});

const listAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 15 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Order.find(filter).populate('buyer', 'name').sort('-createdAt').skip(skip).limit(Number(limit)),
    Order.countDocuments(filter),
  ]);
  sendPaginated(res, items, page, limit, total);
});

const getAuditLog = asyncHandler(async (req, res) => {
  const { page = 1, limit = 25 } = req.query;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    AuditLog.find({}).populate('actor', 'name role').sort('-createdAt').skip(skip).limit(Number(limit)),
    AuditLog.countDocuments({}),
  ]);
  sendPaginated(res, items, page, limit, total);
});

module.exports = {
  dashboardStats, listUsers, updateUserStatus,
  listAllListings, moderateListing, listAllOrders, getAuditLog,
};
