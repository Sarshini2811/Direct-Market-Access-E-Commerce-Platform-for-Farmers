const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Order = require('../models/Order');
const { confirmPayment } = require('../services/paymentService');
const { notify } = require('../services/notificationService');

// Confirms/simulates payment for an order and moves it to 'accepted' pipeline entry point.
const confirm = asyncHandler(async (req, res) => {
  const { paymentRecordId, gatewayPaymentId, gatewaySignature } = req.body;
  const record = await confirmPayment({ paymentRecordId, gatewayPaymentId, gatewaySignature });

  const order = await Order.findById(record.order);
  if (!order) throw new ApiError(404, 'Order for this payment not found.');
  if (String(order.buyer) !== String(req.user._id)) throw new ApiError(403, 'Not your order.');

  order.paymentStatus = 'paid';
  order.paymentRecord = record._id;
  await order.save();

  const farmerIds = [...new Set(order.items.map((i) => String(i.farmer)))];
  await Promise.all(
    farmerIds.map((farmerId) =>
      notify({
        userId: farmerId,
        type: 'order',
        title: 'Payment received',
        message: `Payment confirmed for order #${order._id.toString().slice(-6)}. Please accept or reject it.`,
        link: `/farmer/orders/${order._id}`,
        relatedId: order._id,
      })
    )
  );

  sendSuccess(res, 200, { order, payment: record }, null, 'Payment confirmed (demo mode: simulated)');
});

module.exports = { confirm };
