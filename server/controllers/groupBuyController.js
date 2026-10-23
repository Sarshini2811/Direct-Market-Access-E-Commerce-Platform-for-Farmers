const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const GroupBuy = require('../models/GroupBuy');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { notify, notifyMany } = require('../services/notificationService');

const listGroupBuys = asyncHandler(async (req, res) => {
  const { status = 'open', page = 1, limit = 12 } = req.query;
  const filter = status === 'all' ? {} : { status };
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    GroupBuy.find(filter).populate('product', 'name images unit').populate('farmer', 'name').sort('closesAt').skip(skip).limit(Number(limit)),
    GroupBuy.countDocuments(filter),
  ]);
  sendPaginated(res, items, page, limit, total);
});

const getGroupBuy = asyncHandler(async (req, res) => {
  const groupBuy = await GroupBuy.findById(req.params.id)
    .populate('product')
    .populate('farmer', 'name')
    .populate('participants.buyer', 'name');
  if (!groupBuy) throw new ApiError(404, 'Group buy not found.');
  sendSuccess(res, 200, { groupBuy });
});

// Any buyer can start a group-buy request against a wholesale-enabled product
const createGroupBuy = asyncHandler(async (req, res) => {
  const { productId, targetQuantity, closesAt } = req.body;
  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, 'Product not found.');
  if (!product.wholesale.enabled) throw new ApiError(400, 'This product is not enabled for bulk/group buying.');

  if (new Date(closesAt) <= new Date()) throw new ApiError(422, 'Closing time must be in the future.');

  const groupBuy = await GroupBuy.create({
    product: product._id,
    farmer: product.farmer,
    createdBy: req.user._id,
    pricePerUnit: product.wholesale.pricePerUnit,
    targetQuantity,
    closesAt,
    status: 'open',
  });

  sendSuccess(res, 201, { groupBuy }, null, 'Group buy created — invite others to join before it closes');
});

// Buyer joins an existing group-buy, committing a quantity
const joinGroupBuy = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) throw new ApiError(422, 'Quantity must be at least 1.');

  const groupBuy = await GroupBuy.findById(req.params.id);
  if (!groupBuy) throw new ApiError(404, 'Group buy not found.');
  if (groupBuy.status !== 'open') throw new ApiError(400, `This group buy is ${groupBuy.status}.`);
  if (new Date() > groupBuy.closesAt) throw new ApiError(400, 'This group buy has expired.');

  const alreadyJoined = groupBuy.participants.some((p) => String(p.buyer) === String(req.user._id));
  if (alreadyJoined) throw new ApiError(409, 'You have already joined this group buy.');

  const product = await Product.findById(groupBuy.product);
  const remainingCapacity = product.availableToSell();
  if (remainingCapacity < quantity) throw new ApiError(400, `Only ${remainingCapacity} ${product.unit} of stock exists for this product.`);

  groupBuy.participants.push({ buyer: req.user._id, quantity });
  groupBuy.quantityCommitted += quantity;

  if (groupBuy.quantityCommitted >= groupBuy.targetQuantity) {
    groupBuy.status = 'target_reached';
  }
  await groupBuy.save();

  sendSuccess(res, 200, { groupBuy }, null, 'Joined group buy');
});

// System/admin/cron-style endpoint: closes a group buy at target or expiry and
// creates real Orders for every committed participant — never marks it fulfilled
// before its actual conditions (target reached, or admin/farmer force-closes it) are met.
const finalizeGroupBuy = asyncHandler(async (req, res) => {
  const groupBuy = await GroupBuy.findById(req.params.id).populate('product');
  if (!groupBuy) throw new ApiError(404, 'Group buy not found.');

  const isOwnerFarmer = String(groupBuy.farmer) === String(req.user._id);
  if (!isOwnerFarmer && req.user.role !== 'admin') throw new ApiError(403, 'Not authorized to finalize this group buy.');

  const targetMet = groupBuy.quantityCommitted >= groupBuy.targetQuantity;
  const expired = new Date() > groupBuy.closesAt;
  if (!targetMet && !expired) {
    throw new ApiError(400, 'Group buy has neither reached its target nor expired yet.');
  }

  if (!targetMet && expired) {
    groupBuy.status = 'expired';
    await groupBuy.save();
    await notifyMany(groupBuy.participants.map((p) => String(p.buyer)), {
      type: 'groupbuy',
      title: 'Group buy expired',
      message: `The group buy for ${groupBuy.product.name} expired without reaching its target and was cancelled. No charge was made.`,
      relatedId: groupBuy._id,
    });
    return sendSuccess(res, 200, { groupBuy }, null, 'Group buy expired below target — cancelled, nothing charged');
  }

  // Target reached: create one order per participant at the group price
  const createdOrders = [];
  for (const p of groupBuy.participants) {
    const lineTotal = +(groupBuy.pricePerUnit * p.quantity).toFixed(2);
    const order = await Order.create({
      buyer: p.buyer,
      items: [{
        product: groupBuy.product._id,
        farmer: groupBuy.farmer,
        nameSnapshot: groupBuy.product.name,
        unit: groupBuy.product.unit,
        quantity: p.quantity,
        pricePerUnit: groupBuy.pricePerUnit,
        isWholesale: true,
        lineTotal,
      }],
      itemsTotal: lineTotal,
      deliveryFee: 0,
      totalAmount: lineTotal,
      deliveryMethod: 'pickup',
      statusHistory: [{ status: 'placed', note: 'Created from fulfilled group buy' }],
      tracking: { currentStage: 'placed', lastUpdatedAt: new Date() },
    });
    createdOrders.push(order._id);

    groupBuy.product.quantityReserved += p.quantity;
  }
  await groupBuy.product.save();

  groupBuy.status = 'fulfilled';
  groupBuy.resultingOrder = createdOrders[0];
  await groupBuy.save();

  await notifyMany(groupBuy.participants.map((p) => String(p.buyer)), {
    type: 'groupbuy',
    title: 'Group buy successful',
    message: `Your group buy for ${groupBuy.product.name} reached its target! An order has been created for you.`,
    relatedId: groupBuy._id,
  });

  sendSuccess(res, 200, { groupBuy, createdOrders }, null, 'Group buy fulfilled and orders created');
});

module.exports = { listGroupBuys, getGroupBuy, createGroupBuy, joinGroupBuy, finalizeGroupBuy };
