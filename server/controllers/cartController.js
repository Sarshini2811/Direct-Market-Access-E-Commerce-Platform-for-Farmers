const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

async function getOrCreateCart(buyerId) {
  let cart = await Cart.findOne({ buyer: buyerId });
  if (!cart) cart = await Cart.create({ buyer: buyerId, items: [] });
  return cart;
}

const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const populated = await cart.populate({
    path: 'items.product',
    select: 'name images price wholesale unit quantityAvailable quantityReserved isActive farmer isSurplusDiscount surplusDiscountPercent',
    populate: { path: 'farmer', select: 'name' },
  });

  // Filter out items whose product was deleted/deactivated, but report it
  const validItems = [];
  const removedItems = [];
  populated.items.forEach((item) => {
    if (!item.product || !item.product.isActive) removedItems.push(item);
    else validItems.push(item);
  });

  if (removedItems.length) {
    populated.items = validItems;
    await populated.save();
  }

  sendSuccess(res, 200, { cart: populated, removedCount: removedItems.length });
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, isWholesale = false } = req.body;
  if (quantity < 1) throw new ApiError(422, 'Quantity must be at least 1.');

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, 'Product not available.');

  if (isWholesale) {
    if (!product.wholesale.enabled) throw new ApiError(400, 'Wholesale is not enabled for this product.');
    if (quantity < product.wholesale.minQuantity) {
      throw new ApiError(400, `Wholesale minimum order is ${product.wholesale.minQuantity} ${product.unit}.`);
    }
  }

  const available = product.availableToSell();
  if (available < quantity) throw new ApiError(400, `Only ${available} ${product.unit} available.`);

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find(
    (i) => String(i.product) === String(productId) && i.isWholesale === isWholesale
  );
  const priceSnapshot = isWholesale ? product.wholesale.pricePerUnit : product.effectivePrice;

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (product.availableToSell() < newQty) {
      throw new ApiError(400, `Only ${product.availableToSell()} ${product.unit} available.`);
    }
    existing.quantity = newQty;
    existing.priceSnapshot = priceSnapshot;
  } else {
    cart.items.push({ product: productId, quantity, isWholesale, priceSnapshot });
  }

  await cart.save();
  sendSuccess(res, 200, { cart }, null, 'Added to cart');
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (quantity < 1) throw new ApiError(422, 'Quantity must be at least 1.');

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Cart item not found.');

  const product = await Product.findById(item.product);
  if (!product) throw new ApiError(404, 'Product no longer exists.');
  const availableExcludingThis = product.quantityAvailable - product.quantityReserved;
  if (availableExcludingThis < quantity) {
    throw new ApiError(400, `Only ${availableExcludingThis} ${product.unit} available.`);
  }

  item.quantity = quantity;
  await cart.save();
  sendSuccess(res, 200, { cart }, null, 'Cart updated');
});

const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((i) => String(i._id) !== req.params.itemId);
  await cart.save();
  sendSuccess(res, 200, { cart }, null, 'Item removed');
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  sendSuccess(res, 200, { cart }, null, 'Cart cleared');
});

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart, getOrCreateCart };
