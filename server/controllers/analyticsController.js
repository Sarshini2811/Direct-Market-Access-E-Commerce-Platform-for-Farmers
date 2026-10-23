const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const VerificationRequest = require('../models/VerificationRequest');

// ---- Farmer analytics: revenue over time, best sellers, completion rate, category split ----
const farmerAnalytics = asyncHandler(async (req, res) => {
  const farmerId = new mongoose.Types.ObjectId(req.user._id);

  const [revenueOverTime, bestSellers, statusBreakdown, categorySales, inventorySummary] = await Promise.all([
    Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.farmer': farmerId, status: 'delivered' } },
      {
        $group: {
          _id: { y: { $year: '$updatedAt' }, m: { $month: '$updatedAt' } },
          revenue: { $sum: '$items.lineTotal' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
    Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.farmer': farmerId, status: 'delivered' } },
      { $group: { _id: '$items.nameSnapshot', unitsSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.lineTotal' } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
    Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.farmer': farmerId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Product.aggregate([
      { $match: { farmer: farmerId } },
      { $group: { _id: '$category', totalSold: { $sum: '$totalSold' } } },
    ]),
    Product.aggregate([
      { $match: { farmer: farmerId, isActive: true } },
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          totalAvailable: { $sum: '$quantityAvailable' },
          totalReserved: { $sum: '$quantityReserved' },
          surplusListings: { $sum: { $cond: ['$isSurplusDiscount', 1, 0] } },
        },
      },
    ]),
  ]);

  const totalOrders = statusBreakdown.reduce((sum, s) => sum + s.count, 0);
  const completed = statusBreakdown.find((s) => s._id === 'delivered')?.count || 0;

  sendSuccess(res, 200, {
    revenueOverTime: revenueOverTime.map((r) => ({ period: `${r._id.y}-${String(r._id.m).padStart(2, '0')}`, revenue: +r.revenue.toFixed(2) })),
    bestSellers,
    orderCompletionRate: totalOrders ? +((completed / totalOrders) * 100).toFixed(1) : 0,
    statusBreakdown,
    categorySales,
    inventorySummary: inventorySummary[0] || { totalListings: 0, totalAvailable: 0, totalReserved: 0, surplusListings: 0 },
  });
});

// ---- Admin analytics: registrations, order volume, transaction value, category distribution ----
const adminAnalytics = asyncHandler(async (req, res) => {
  const [registrationTrend, orderVolumeTrend, transactionValueTrend, categoryDistribution, verificationStats] = await Promise.all([
    User.aggregate([
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' }, role: '$role' }, count: { $sum: 1 } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
    Order.aggregate([
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
    Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: { y: { $year: '$updatedAt' }, m: { $month: '$updatedAt' } }, value: { $sum: '$totalAmount' } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
    Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
    VerificationRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  sendSuccess(res, 200, {
    registrationTrend: registrationTrend.map((r) => ({ period: `${r._id.y}-${String(r._id.m).padStart(2, '0')}`, role: r._id.role, count: r.count })),
    orderVolumeTrend: orderVolumeTrend.map((r) => ({ period: `${r._id.y}-${String(r._id.m).padStart(2, '0')}`, count: r.count })),
    transactionValueTrend: transactionValueTrend.map((r) => ({ period: `${r._id.y}-${String(r._id.m).padStart(2, '0')}`, value: +r.value.toFixed(2) })),
    categoryDistribution,
    verificationStats,
  });
});

module.exports = { farmerAnalytics, adminAnalytics };
