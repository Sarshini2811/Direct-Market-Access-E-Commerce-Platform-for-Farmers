const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const Order = require('../models/Order');
const Product = require('../models/Product');
const PriceHistory = require('../models/PriceHistory');
const { getOrCreateCart } = require('./cartController');
const { notify } = require('../services/notificationService');
const { createPaymentIntent } = require('../services/paymentService');

// Valid forward transitions for order status (prevents skipping/faking stages)
const NEXT_STATUS = {
  placed: ['accepted', 'rejected', 'cancelled'],
  accepted: ['packed', 'cancelled'],
  packed: ['dispatched', 'cancelled'],
  dispatched: ['delivered'],
  delivered: ['refunded'],
  rejected: [],
  cancelled: [],
  refunded: [],
};

// Checkout: turns the buyer's cart into an Order, reserving/consuming stock.
const placeOrder = asyncHandler(async (req, res) => {
  const { deliveryMethod, deliveryAddress } = req.body;
  const cart = await getOrCreateCart(req.user._id);
  await cart.populate('items.product');

  if (!cart.items.length) throw new ApiError(400, 'Your cart is empty.');

  const items = [];
  let itemsTotal = 0;
  let deliveryFee = 0;

  // Validate & lock stock for every line item before creating the order
  for (const line of cart.items) {
    const product = await Product.findById(line.product._id);
    if (!product || !product.isActive) {
      throw new ApiError(400, `${line.product.name || 'A product'} is no longer available.`);
    }
    const available = product.availableToSell();
    if (available < line.quantity) {
      throw new ApiError(400, `Only ${available} ${product.unit} of ${product.name} available now.`);
    }
    if (deliveryMethod === 'delivery' && !product.deliveryOptions.delivery) {
      throw new ApiError(400, `${product.name} is pickup-only.`);
    }
    if (deliveryMethod === 'pickup' && !product.deliveryOptions.pickup) {
      throw new ApiError(400, `${product.name} does not offer pickup.`);
    }

    const pricePerUnit = line.priceSnapshot;
    const lineTotal = +(pricePerUnit * line.quantity).toFixed(2);
    itemsTotal += lineTotal;
    if (deliveryMethod === 'delivery') deliveryFee += product.deliveryOptions.deliveryFee || 0;

    // Reserve stock now, commit on delivery-eligible transitions below
    product.quantityReserved += line.quantity;
    await product.save();

    items.push({
      product: product._id,
      farmer: product.farmer,
      nameSnapshot: product.name,
      unit: product.unit,
      quantity: line.quantity,
      pricePerUnit,
      isWholesale: line.isWholesale,
      lineTotal,
    });
  }

  const totalAmount = +(itemsTotal + deliveryFee).toFixed(2);

  const order = await Order.create({
    buyer: req.user._id,
    items,
    itemsTotal: +itemsTotal.toFixed(2),
    deliveryFee,
    totalAmount,
    deliveryMethod,
    deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : undefined,
    statusHistory: [{ status: 'placed', note: 'Order placed' }],
    tracking: { currentStage: 'placed', lastUpdatedAt: new Date() },
  });

  cart.items = [];
  await cart.save();

  const paymentIntent = await createPaymentIntent({ order, buyer: req.user });

  // notify each affected farmer
  const farmerIds = [...new Set(items.map((i) => String(i.farmer)))];
  await Promise.all(
    farmerIds.map((farmerId) =>
      notify({
        userId: farmerId,
        type: 'order',
        title: 'New order received',
        message: `You have a new order (#${order._id.toString().slice(-6)}) waiting for confirmation.`,
        link: `/farmer/orders/${order._id}`,
        relatedId: order._id,
      })
    )
  );

  sendSuccess(res, 201, { order, paymentIntent }, null, 'Order placed — complete payment to confirm');
});

const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const filter = { buyer: req.user._id };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
    Order.countDocuments(filter),
  ]);
  sendPaginated(res, orders, page, limit, total);
});

const getFarmerOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const filter = { 'items.farmer': req.user._id };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(filter).populate('buyer', 'name phone').sort('-createdAt').skip(skip).limit(Number(limit)),
    Order.countDocuments(filter),
  ]);
  sendPaginated(res, orders, page, limit, total);
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('buyer', 'name phone').populate('items.farmer', 'name phone');
  if (!order) throw new ApiError(404, 'Order not found.');

  const isBuyer = String(order.buyer._id) === String(req.user._id);
  const isFarmerOnOrder = order.items.some((i) => String(i.farmer._id) === String(req.user._id));
  if (!isBuyer && !isFarmerOnOrder && req.user.role !== 'admin') {
    throw new ApiError(403, 'You do not have access to this order.');
  }

  sendSuccess(res, 200, { order });
});

// Farmer (or admin) advances an order's status through the valid lifecycle
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');

  const isFarmerOnOrder = order.items.some((i) => String(i.farmer) === String(req.user._id));
  if (!isFarmerOnOrder && req.user.role !== 'admin') {
    throw new ApiError(403, 'Only the fulfilling farmer or an admin can update this order.');
  }

  const allowedNext = NEXT_STATUS[order.status] || [];
  if (!allowedNext.includes(status)) {
    throw new ApiError(400, `Cannot move order from '${order.status}' to '${status}'.`);
  }

  // Stock effects
  if (status === 'delivered') {
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantityAvailable = Math.max(0, product.quantityAvailable - item.quantity);
        product.quantityReserved = Math.max(0, product.quantityReserved - item.quantity);
        product.totalSold += item.quantity;
        await product.save();

        await PriceHistory.create({
          productCategory: product.category,
          productName: product.name,
          unit: product.unit,
          pricePerUnit: item.pricePerUnit,
          quantity: item.quantity,
          state: product.location?.state,
          district: product.location?.district,
          order: order._id,
          farmer: product.farmer,
        });
      }
    }
    order.isReviewEligible = true;
  }

  if (status === 'cancelled' || status === 'rejected') {
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantityReserved = Math.max(0, product.quantityReserved - item.quantity);
        await product.save();
      }
    }
  }

  order.status = status;
  order.tracking.currentStage = status;
  order.tracking.lastUpdatedAt = new Date();
  order.statusHistory.push({ status, note });
  await order.save();

  await notify({
    userId: order.buyer,
    type: 'order',
    title: `Order ${status}`,
    message: `Your order #${order._id.toString().slice(-6)} is now ${status}.`,
    link: `/orders/${order._id}`,
    relatedId: order._id,
  });

  sendSuccess(res, 200, { order }, null, 'Order status updated');
});

// Buyer-initiated cancellation, only while still cancellable
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');
  if (String(order.buyer) !== String(req.user._id)) throw new ApiError(403, 'Not your order.');
  if (!['placed', 'accepted'].includes(order.status)) {
    throw new ApiError(400, `Order can no longer be cancelled (current status: ${order.status}).`);
  }

  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      product.quantityReserved = Math.max(0, product.quantityReserved - item.quantity);
      await product.save();
    }
  }

  order.status = 'cancelled';
  order.cancelReason = req.body.reason || 'Cancelled by buyer';
  order.tracking.currentStage = 'cancelled';
  order.statusHistory.push({ status: 'cancelled', note: order.cancelReason });
  await order.save();

  sendSuccess(res, 200, { order }, null, 'Order cancelled and stock released');
});

module.exports = {
  placeOrder, getMyOrders, getFarmerOrders, getOrder, updateOrderStatus, cancelOrder,
};
