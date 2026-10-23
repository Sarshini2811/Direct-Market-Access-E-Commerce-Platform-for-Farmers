const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const Product = require('../models/Product');
const PriceHistory = require('../models/PriceHistory');
const ExternalPriceReference = require('../models/ExternalPriceReference');

// Compares a farmer's own listings against other active listings for the same
// category/name, using ONLY real stored data. Never invents a market price.
const compareListings = asyncHandler(async (req, res) => {
  const { category, productName } = req.query;
  if (!category) return sendSuccess(res, 200, { comparableListings: [], note: 'category is required' });

  const filter = { category, isActive: true };
  if (productName) filter.name = new RegExp(productName, 'i');

  const listings = await Product.find(filter)
    .select('name price wholesale unit farmer location createdAt')
    .populate('farmer', 'name')
    .limit(50);

  const prices = listings.map((l) => l.price);
  const summary = prices.length
    ? {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: +(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2),
        sampleSize: prices.length,
      }
    : { min: null, max: null, average: null, sampleSize: 0 };

  sendSuccess(res, 200, {
    source: 'platform_listings',
    comparableListings: listings,
    summary,
  });
});

// Historical price trend derived strictly from completed platform transactions.
const priceTrend = asyncHandler(async (req, res) => {
  const { category, productName, months = 6 } = req.query;
  const since = new Date();
  since.setMonth(since.getMonth() - Number(months));

  const filter = { recordedAt: { $gte: since } };
  if (category) filter.productCategory = category;
  if (productName) filter.productName = new RegExp(productName, 'i');

  const trend = await PriceHistory.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { y: { $year: '$recordedAt' }, m: { $month: '$recordedAt' } },
        avgPrice: { $avg: '$pricePerUnit' },
        totalQuantity: { $sum: '$quantity' },
        transactionCount: { $sum: 1 },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ]);

  const hasData = trend.length > 0;
  sendSuccess(res, 200, {
    source: 'platform_transaction',
    trend: trend.map((t) => ({
      period: `${t._id.y}-${String(t._id.m).padStart(2, '0')}`,
      averagePrice: +t.avgPrice.toFixed(2),
      totalQuantity: t.totalQuantity,
      transactionCount: t.transactionCount,
    })),
    note: hasData
      ? 'Derived from actual completed orders on this platform.'
      : 'No completed platform transactions in this window yet — trend unavailable rather than estimated.',
  });
});

// Regional/external reference prices (e.g. mandi rates), always source + date stamped.
const externalReferences = asyncHandler(async (req, res) => {
  const { category, productName, state } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (productName) filter.productName = new RegExp(productName, 'i');
  if (state) filter.state = state;

  const refs = await ExternalPriceReference.find(filter).sort('-sourceDate').limit(20);

  sendSuccess(res, 200, {
    source: 'external_reference',
    references: refs,
    note: refs.length
      ? 'Each reference shows its original source and date — verify against the source for decisions.'
      : 'No external reference price is available for this query yet.',
  });
});

// Lets a farmer estimate gross revenue — explicitly a user-entered estimate, not a promise.
const estimateRevenue = asyncHandler(async (req, res) => {
  const { quantity, pricePerUnit } = req.query;
  const qty = Number(quantity);
  const price = Number(pricePerUnit);
  if (!qty || !price) {
    return sendSuccess(res, 200, { estimatedGrossRevenue: null, note: 'Provide quantity and pricePerUnit.' });
  }
  sendSuccess(res, 200, {
    source: 'user_estimate',
    estimatedGrossRevenue: +(qty * price).toFixed(2),
    note: 'This is a user-entered estimate before fees, delivery costs, or unsold stock — not a guaranteed outcome.',
  });
});

module.exports = { compareListings, priceTrend, externalReferences, estimateRevenue };
