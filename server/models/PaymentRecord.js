const mongoose = require('mongoose');

// Abstraction over payment gateways. In "mock" mode this records a
// clearly-labeled simulated transaction; in "razorpay" mode it stores the
// gateway order/payment ids and is verified server-side via signature check.

const paymentRecordSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    mode: { type: String, enum: ['mock', 'razorpay'], required: true },
    status: { type: String, enum: ['created', 'paid', 'failed', 'refunded'], default: 'created' },

    gatewayOrderId: String,
    gatewayPaymentId: String,
    gatewaySignature: String,
    verifiedAt: Date,

    isSimulated: { type: Boolean, default: true }, // true unless a real gateway confirmed it
    failureReason: String,
  },
  { timestamps: true }
);

paymentRecordSchema.index({ order: 1 });
paymentRecordSchema.index({ buyer: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentRecord', paymentRecordSchema);
