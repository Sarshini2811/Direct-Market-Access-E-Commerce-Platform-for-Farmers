const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const PreOrder = require('../models/PreOrder');
const Product = require('../models/Product');
const { notify, notifyMany } = require('../services/notificationService');
const { filesToUrls } = require('../services/uploadService');

const listPreOrders = asyncHandler(async (req, res) => {
  const { status = 'upcoming,open', category, page = 1, limit = 12 } = req.query;
  const filter = { status: { $in: status.split(',') } };
  if (category) filter.category = category;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    PreOrder.find(filter).populate('farmer', 'name').sort('expectedHarvestDate').skip(skip).limit(Number(limit)),
    PreOrder.countDocuments(filter),
  ]);
  sendPaginated(res, items, page, limit, total);
});

const getPreOrder = asyncHandler(async (req, res) => {
  const preOrder = await PreOrder.findById(req.params.id).populate('farmer', 'name phone');
  if (!preOrder) throw new ApiError(404, 'Pre-order listing not found.');
  sendSuccess(res, 200, { preOrder });
});

const getMyPreOrders = asyncHandler(async (req, res) => {
  const preOrders = await PreOrder.find({ farmer: req.user._id }).sort('-createdAt');
  sendSuccess(res, 200, { preOrders });
});

// Farmer publishes an upcoming harvest. expectedHarvestDate is explicitly an ESTIMATE.
const createPreOrder = asyncHandler(async (req, res) => {
  const image = req.file ? filesToUrls(req, [req.file])[0] : undefined;

  const preOrder = await PreOrder.create({
    ...req.body,
    farmer: req.user._id,
    image,
    status: 'upcoming',
  });

  sendSuccess(res, 201, { preOrder }, null, 'Upcoming harvest published (dates are estimates until you confirm readiness)');
});

const updatePreOrder = asyncHandler(async (req, res) => {
  const preOrder = await PreOrder.findById(req.params.id);
  if (!preOrder) throw new ApiError(404, 'Pre-order not found.');
  if (String(preOrder.farmer) !== String(req.user._id)) throw new ApiError(403, 'Not your listing.');
  if (['fulfilled', 'cancelled'].includes(preOrder.status)) {
    throw new ApiError(400, 'This harvest listing is already closed.');
  }

  const allowed = ['expectedHarvestDate', 'estimatedQuantity', 'pricePerUnit', 'maxPerBuyer', 'delayNote'];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) preOrder[key] = req.body[key];
  });
  await preOrder.save();

  // Notify existing reservers of harvest date/delay changes — honest, no fake guarantees
  const buyerIds = preOrder.reservations.filter((r) => !r.cancelled).map((r) => r.buyer);
  if (buyerIds.length) {
    await notifyMany([...new Set(buyerIds.map(String))], {
      type: 'harvest',
      title: 'Harvest update',
      message: req.body.delayNote
        ? `Update on ${preOrder.productName}: ${req.body.delayNote}`
        : `The expected harvest date for ${preOrder.productName} has been updated.`,
      link: `/preorders/${preOrder._id}`,
      relatedId: preOrder._id,
    });
  }

  sendSuccess(res, 200, { preOrder }, null, 'Harvest listing updated');
});

// Buyer reserves quantity ahead of harvest — validated against remaining estimate
const reservePreOrder = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) throw new ApiError(422, 'Quantity must be at least 1.');

  const preOrder = await PreOrder.findById(req.params.id);
  if (!preOrder) throw new ApiError(404, 'Pre-order not found.');
  if (!['upcoming', 'open'].includes(preOrder.status)) {
    throw new ApiError(400, 'This harvest is no longer accepting reservations.');
  }
  if (preOrder.maxPerBuyer > 0 && quantity > preOrder.maxPerBuyer) {
    throw new ApiError(400, `Maximum ${preOrder.maxPerBuyer} ${preOrder.unit} per buyer.`);
  }
  if (preOrder.remainingToReserve() < quantity) {
    throw new ApiError(400, `Only ${preOrder.remainingToReserve()} ${preOrder.unit} left to reserve.`);
  }

  preOrder.reservations.push({
    buyer: req.user._id,
    quantity,
    pricePerUnitAtReservation: preOrder.pricePerUnit,
  });
  preOrder.quantityReserved += quantity;
  if (preOrder.status === 'upcoming') preOrder.status = 'open';
  await preOrder.save();

  await notify({
    userId: preOrder.farmer,
    type: 'preorder',
    title: 'New harvest reservation',
    message: `A buyer reserved ${quantity} ${preOrder.unit} of ${preOrder.productName}.`,
    link: `/farmer/preorders/${preOrder._id}`,
    relatedId: preOrder._id,
  });

  sendSuccess(res, 200, { preOrder }, null, 'Reservation confirmed — estimate only until the farmer confirms readiness');
});

const cancelReservation = asyncHandler(async (req, res) => {
  const preOrder = await PreOrder.findById(req.params.id);
  if (!preOrder) throw new ApiError(404, 'Pre-order not found.');

  const reservation = preOrder.reservations.id(req.params.reservationId);
  if (!reservation) throw new ApiError(404, 'Reservation not found.');
  if (String(reservation.buyer) !== String(req.user._id)) throw new ApiError(403, 'Not your reservation.');
  if (reservation.cancelled) throw new ApiError(400, 'Already cancelled.');

  reservation.cancelled = true;
  preOrder.quantityReserved = Math.max(0, preOrder.quantityReserved - reservation.quantity);
  await preOrder.save();

  sendSuccess(res, 200, { preOrder }, null, 'Reservation cancelled');
});

// Farmer confirms the harvest is ready: transitions pre-order into a live Product.
const confirmHarvest = asyncHandler(async (req, res) => {
  const preOrder = await PreOrder.findById(req.params.id);
  if (!preOrder) throw new ApiError(404, 'Pre-order not found.');
  if (String(preOrder.farmer) !== String(req.user._id)) throw new ApiError(403, 'Not your listing.');
  if (preOrder.isFarmerConfirmed) throw new ApiError(400, 'Already confirmed.');

  const { actualQuantity, unit, deliveryOptions } = req.body;
  const finalQuantity = actualQuantity || preOrder.estimatedQuantity;

  const product = await Product.create({
    farmer: preOrder.farmer,
    name: preOrder.productName,
    category: preOrder.category,
    unit: unit || preOrder.unit,
    price: preOrder.pricePerUnit,
    quantityAvailable: finalQuantity,
    quantityReserved: preOrder.quantityReserved, // honor active reservations
    harvestDate: new Date(),
    images: preOrder.image ? [preOrder.image] : [],
    deliveryOptions: deliveryOptions || { pickup: true, delivery: false },
  });

  preOrder.isFarmerConfirmed = true;
  preOrder.confirmedAt = new Date();
  preOrder.status = 'fulfilled';
  preOrder.linkedProduct = product._id;
  await preOrder.save();

  const buyerIds = [...new Set(preOrder.reservations.filter((r) => !r.cancelled).map((r) => String(r.buyer)))];
  await notifyMany(buyerIds, {
    type: 'harvest',
    title: 'Harvest ready!',
    message: `${preOrder.productName} has been harvested and is now available. Your reservation is ready to order.`,
    link: `/products/${product._id}`,
    relatedId: product._id,
  });

  sendSuccess(res, 200, { preOrder, product }, null, 'Harvest confirmed and moved to live stock');
});

module.exports = {
  listPreOrders, getPreOrder, getMyPreOrders, createPreOrder,
  updatePreOrder, reservePreOrder, cancelReservation, confirmHarvest,
};
