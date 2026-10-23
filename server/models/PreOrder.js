const mongoose = require('mongoose');
const { PREORDER_STATUS } = require('../config/constants');

// Represents an upcoming harvest a farmer publishes ahead of time,
// with buyers able to reserve quantity before it becomes live stock.

const reservationSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quantity: { type: Number, required: true, min: 1 },
    pricePerUnitAtReservation: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    cancelled: { type: Boolean, default: false },
  },
  { _id: true }
);

const preOrderSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productName: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    unit: { type: String, required: true },
    image: String,

    expectedHarvestDate: { type: Date, required: true }, // clearly an ESTIMATE
    isFarmerConfirmed: { type: Boolean, default: false }, // farmer-confirmed readiness
    confirmedAt: Date,

    estimatedQuantity: { type: Number, required: true, min: 0 },
    quantityReserved: { type: Number, default: 0, min: 0 },
    maxPerBuyer: { type: Number, default: 0 }, // 0 = no explicit limit

    pricePerUnit: { type: Number, required: true, min: 0 },

    status: { type: String, enum: PREORDER_STATUS, default: 'upcoming' },
    delayNote: String, // farmer-entered update if harvest is delayed

    reservations: [reservationSchema],

    // set once farmer confirms and this transitions to a live Product
    linkedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  },
  { timestamps: true }
);

preOrderSchema.index({ farmer: 1, status: 1 });
preOrderSchema.index({ expectedHarvestDate: 1 });

preOrderSchema.methods.remainingToReserve = function remainingToReserve() {
  return Math.max(0, this.estimatedQuantity - this.quantityReserved);
};

module.exports = mongoose.model('PreOrder', preOrderSchema);
