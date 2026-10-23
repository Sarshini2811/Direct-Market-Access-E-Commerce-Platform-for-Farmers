const crypto = require('crypto');
const PaymentRecord = require('../models/PaymentRecord');
const ApiError = require('../utils/ApiError');

const PAYMENT_MODE = process.env.PAYMENT_MODE || 'mock';

// Step 1: create a payment intent/order for the given platform Order.
async function createPaymentIntent({ order, buyer }) {
  if (PAYMENT_MODE === 'razorpay') {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new ApiError(
        500,
        'PAYMENT_MODE=razorpay requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the server .env. ' +
        'Set PAYMENT_MODE=mock to use the demo flow instead.'
      );
    }
    // Real integration point: require('razorpay') and instances.orders.create(...)
    // Left unimplemented without live credentials — see README "Payments" section.
    throw new ApiError(501, 'Razorpay integration requires credentials to be configured by the operator.');
  }

  // ---- Mock mode: clearly-labeled simulated payment, no real money moves ----
  const record = await PaymentRecord.create({
    order: order._id,
    buyer: buyer._id,
    amount: order.totalAmount,
    mode: 'mock',
    status: 'created',
    gatewayOrderId: `mock_order_${crypto.randomBytes(8).toString('hex')}`,
    isSimulated: true,
  });

  return {
    mode: 'mock',
    isSimulated: true,
    paymentRecordId: record._id,
    gatewayOrderId: record.gatewayOrderId,
    amount: record.amount,
    currency: record.currency,
    instructions: 'Demo payment: call POST /api/payments/confirm with this paymentRecordId to simulate success.',
  };
}

// Step 2: confirm/verify payment. In mock mode this simply marks it paid.
// In a real gateway this MUST verify the signature server-side before trusting it.
async function confirmPayment({ paymentRecordId, gatewayPaymentId, gatewaySignature }) {
  const record = await PaymentRecord.findById(paymentRecordId);
  if (!record) throw new ApiError(404, 'Payment record not found.');

  if (record.mode === 'mock') {
    record.status = 'paid';
    record.gatewayPaymentId = gatewayPaymentId || `mock_pay_${crypto.randomBytes(8).toString('hex')}`;
    record.verifiedAt = new Date();
    await record.save();
    return record;
  }

  // Real gateway verification (e.g. Razorpay HMAC signature check) would go here.
  throw new ApiError(501, 'Live gateway verification is not configured in this environment.');
}

module.exports = { createPaymentIntent, confirmPayment };
