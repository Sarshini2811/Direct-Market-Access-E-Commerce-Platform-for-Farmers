const mongoose = require('mongoose');
const { ORDER_STATUS, PAYMENT_STATUS, DELIVERY_METHODS } = require('../config/constants');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    nameSnapshot: String,
    unit: String,
    quantity: { type: Number, required: true, min: 1 },
    pricePerUnit: { type: Number, required: true, min: 0 },
    isWholesale: { type: Boolean, default: false },
    lineTotal: { type: Number, required: true, min: 0 },
    itemStatus: { type: String, enum: ORDER_STATUS, default: 'placed' },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },

    itemsTotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    status: { type: String, enum: ORDER_STATUS, default: 'placed' },
    paymentStatus: { type: String, enum: PAYMENT_STATUS, default: 'pending' },
    paymentRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentRecord' },

    deliveryMethod: { type: String, enum: DELIVERY_METHODS, required: true },
    deliveryAddress: {
      line1: String,
      city: String,
      state: String,
      pincode: String,
    },

    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUS },
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],

    // status-based tracking only — no fabricated live GPS
    tracking: {
      currentStage: { type: String, enum: ORDER_STATUS, default: 'placed' },
      deliveryPartnerName: String,
      estimatedDeliveryDate: Date,
      lastUpdatedAt: Date,
    },

    cancelReason: String,
    isReviewEligible: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ 'items.farmer': 1, createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
