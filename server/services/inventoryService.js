const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

// Reserve stock for a pending order. Atomic-ish via a conditional update so
// concurrent requests can't oversell the same product.
async function reserveStock(productId, quantity, session = null) {
  const product = await Product.findById(productId).session(session);
  if (!product) throw new ApiError(404, 'Product not found.');
  if (!product.isActive) throw new ApiError(400, `${product.name} is no longer listed.`);

  const available = product.availableToSell();
  if (available < quantity) {
    throw new ApiError(400, `Only ${available} ${product.unit} of ${product.name} available.`);
  }

  product.quantityReserved += quantity;
  await product.save({ session });
  return product;
}

// Called when an order/reservation is confirmed and stock is actually consumed.
async function commitStock(productId, quantity, session = null) {
  const product = await Product.findById(productId).session(session);
  if (!product) throw new ApiError(404, 'Product not found.');

  product.quantityAvailable = Math.max(0, product.quantityAvailable - quantity);
  product.quantityReserved = Math.max(0, product.quantityReserved - quantity);
  product.totalSold += quantity;
  await product.save({ session });
  return product;
}

// Called when an order/reservation is cancelled before stock is committed.
async function releaseStock(productId, quantity, session = null) {
  const product = await Product.findById(productId).session(session);
  if (!product) return null;

  product.quantityReserved = Math.max(0, product.quantityReserved - quantity);
  await product.save({ session });
  return product;
}

module.exports = { reserveStock, commitStock, releaseStock };
