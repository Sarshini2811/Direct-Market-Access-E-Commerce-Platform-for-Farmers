const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const FarmerProfile = require('../models/FarmerProfile');
const { notify } = require('../services/notificationService');

async function recalcProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { product: productId, isHidden: false } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = stats[0] || {};
  await Product.findByIdAndUpdate(productId, { ratingAverage: +avg.toFixed(2), ratingCount: count });
}

async function recalcFarmerRating(farmerId) {
  const stats = await Review.aggregate([
    { $match: { farmer: farmerId, isHidden: false } },
    { $group: { _id: '$farmer', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = stats[0] || {};
  await FarmerProfile.findOneAndUpdate({ user: farmerId }, { ratingAverage: +avg.toFixed(2), ratingCount: count });
}

// Reviews are only allowed against a completed purchase the buyer actually made.
const createReview = asyncHandler(async (req, res) => {
  const { orderId, productId, rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) throw new ApiError(422, 'Rating must be between 1 and 5.');

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found.');
  if (String(order.buyer) !== String(req.user._id)) throw new ApiError(403, 'Not your order.');
  if (!order.isReviewEligible || order.status !== 'delivered') {
    throw new ApiError(400, 'You can only review products from delivered orders.');
  }

  const item = order.items.find((i) => String(i.product) === String(productId));
  if (!item) throw new ApiError(400, 'This product was not part of that order.');

  const existing = await Review.findOne({ buyer: req.user._id, product: productId, order: orderId });
  if (existing) throw new ApiError(409, 'You already reviewed this product for this order.');

  const review = await Review.create({
    buyer: req.user._id,
    product: productId,
    farmer: item.farmer,
    order: orderId,
    rating,
    comment,
  });

  await recalcProductRating(productId);
  await recalcFarmerRating(item.farmer);

  await notify({
    userId: item.farmer,
    type: 'review',
    title: 'New review received',
    message: `A buyer left a ${rating}-star review on ${item.nameSnapshot}.`,
    link: `/farmer/products/${productId}`,
    relatedId: review._id,
  });

  sendSuccess(res, 201, { review }, null, 'Review submitted');
});

const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, isHidden: false })
    .populate('buyer', 'name avatarUrl')
    .sort('-createdAt');
  sendSuccess(res, 200, { reviews });
});

const getEligibleReviewTargets = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    buyer: req.user._id,
    status: 'delivered',
    isReviewEligible: true,
  });

  const alreadyReviewed = await Review.find({ buyer: req.user._id }).select('order product');
  const reviewedSet = new Set(alreadyReviewed.map((r) => `${r.order}_${r.product}`));

  const targets = [];
  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (!reviewedSet.has(`${order._id}_${item.product}`)) {
        targets.push({
          orderId: order._id,
          productId: item.product,
          productName: item.nameSnapshot,
          deliveredAt: order.updatedAt,
        });
      }
    });
  });

  sendSuccess(res, 200, { targets });
});

module.exports = { createReview, getProductReviews, getEligibleReviewTargets };
