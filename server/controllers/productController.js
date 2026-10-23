const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const Product = require('../models/Product');
const FarmerProfile = require('../models/FarmerProfile');
const { filesToUrls } = require('../services/uploadService');

// multer (multipart/form-data) delivers flat string fields only — nested objects like
// `wholesale` or `deliveryOptions` arrive as JSON strings from the client and must be parsed.
function parseJsonFields(body, fields) {
  fields.forEach((key) => {
    if (typeof body[key] === 'string') {
      try {
        body[key] = JSON.parse(body[key]);
      } catch {
        delete body[key];
      }
    }
  });
  return body;
}

// Public marketplace listing: search, filter, sort, paginate
const listProducts = asyncHandler(async (req, res) => {
  const {
    q, category, minPrice, maxPrice, state, district,
    grade, surplusOnly, wholesaleOnly, farmer, verifiedOnly,
    sort = '-createdAt', page = 1, limit = 12,
  } = req.query;

  const filter = { isActive: true };
  if (q) filter.$text = { $search: q };
  if (category) filter.category = category;
  if (grade) filter.grade = grade;
  if (farmer) filter.farmer = farmer;
  if (surplusOnly === 'true') filter.isSurplusDiscount = true;
  if (wholesaleOnly === 'true') filter['wholesale.enabled'] = true;
  if (state) filter['location.state'] = state;
  if (district) filter['location.district'] = district;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  // only show products with something actually sellable
  filter.$expr = { $gt: ['$quantityAvailable', '$quantityReserved'] };

  let farmerIdsFilter = null;
  if (verifiedOnly === 'true') {
    const verifiedProfiles = await FarmerProfile.find({ verificationStatus: 'verified' }).select('user');
    farmerIdsFilter = verifiedProfiles.map((p) => p.user);
    filter.farmer = filter.farmer ? filter.farmer : { $in: farmerIdsFilter };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('farmer', 'name avatarUrl')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  sendPaginated(res, items, page, limit, total);
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('farmer', 'name avatarUrl phone');
  if (!product) throw new ApiError(404, 'Product not found.');

  const farmerProfile = await FarmerProfile.findOne({ user: product.farmer._id }).select(
    'farmName location verificationStatus ratingAverage ratingCount farmingType'
  );

  sendSuccess(res, 200, { product, farmerProfile });
});

const getMyProducts = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { farmer: req.user._id };
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;

  const products = await Product.find(filter).sort('-createdAt');
  sendSuccess(res, 200, { products });
});

const createProduct = asyncHandler(async (req, res) => {
  const farmerProfile = await FarmerProfile.findOne({ user: req.user._id });
  const images = req.files ? filesToUrls(req, req.files) : [];
  parseJsonFields(req.body, ['wholesale', 'deliveryOptions']);

  const product = await Product.create({
    ...req.body,
    farmer: req.user._id,
    images,
    location: farmerProfile ? farmerProfile.location : undefined,
  });

  sendSuccess(res, 201, { product }, null, 'Product listed successfully');
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found.');
  if (String(product.farmer) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'You do not own this listing.');
  }

  const disallowed = ['farmer', 'totalSold', 'quantityReserved', 'ratingAverage', 'ratingCount'];
  disallowed.forEach((key) => delete req.body[key]);
  parseJsonFields(req.body, ['wholesale', 'deliveryOptions']);

  if (req.files && req.files.length) {
    const newImages = filesToUrls(req, req.files);
    product.images = [...product.images, ...newImages];
  }

  Object.assign(product, req.body);
  await product.save();

  sendSuccess(res, 200, { product }, null, 'Product updated');
});

const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found.');
  if (String(product.farmer) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'You do not own this listing.');
  }
  product.images = product.images.filter((img) => img !== req.body.imageUrl);
  await product.save();
  sendSuccess(res, 200, { product }, null, 'Image removed');
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found.');
  if (String(product.farmer) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'You do not own this listing.');
  }

  // Soft-delete pattern preserves order history integrity
  product.isActive = false;
  await product.save();

  sendSuccess(res, 200, null, null, 'Listing removed from marketplace');
});

const updateStock = asyncHandler(async (req, res) => {
  const { quantityAvailable, isSurplusDiscount, surplusDiscountPercent } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found.');
  if (String(product.farmer) !== String(req.user._id)) throw new ApiError(403, 'You do not own this listing.');

  if (quantityAvailable !== undefined) {
    if (quantityAvailable < product.quantityReserved) {
      throw new ApiError(400, `Cannot set stock below ${product.quantityReserved} already reserved by pending orders.`);
    }
    product.quantityAvailable = quantityAvailable;
  }
  if (isSurplusDiscount !== undefined) product.isSurplusDiscount = isSurplusDiscount;
  if (surplusDiscountPercent !== undefined) product.surplusDiscountPercent = surplusDiscountPercent;

  await product.save();
  sendSuccess(res, 200, { product }, null, 'Stock updated');
});

const getCategories = asyncHandler(async (req, res) => {
  const { PRODUCT_CATEGORIES, PRODUCT_UNITS, QUALITY_GRADES } = require('../config/constants');
  sendSuccess(res, 200, { categories: PRODUCT_CATEGORIES, units: PRODUCT_UNITS, grades: QUALITY_GRADES });
});

module.exports = {
  listProducts, getProduct, getMyProducts, createProduct,
  updateProduct, deleteProduct, deleteProductImage, updateStock, getCategories,
};
