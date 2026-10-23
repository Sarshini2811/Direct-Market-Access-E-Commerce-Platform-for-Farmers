const mongoose = require('mongoose');

// One row is written per completed order line item, so price trend charts
// are always derived from actual stored platform transactions, never invented.

const priceHistorySchema = new mongoose.Schema(
  {
    productCategory: { type: String, required: true },
    productName: { type: String, required: true },
    unit: { type: String, required: true },
    pricePerUnit: { type: Number, required: true },
    quantity: { type: Number, required: true },
    state: String,
    district: String,
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

priceHistorySchema.index({ productCategory: 1, recordedAt: -1 });
priceHistorySchema.index({ productName: 'text' });

module.exports = mongoose.model('PriceHistory', priceHistorySchema);
