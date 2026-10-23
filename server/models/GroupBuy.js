const mongoose = require('mongoose');
const { GROUP_BUY_STATUS } = require('../config/constants');

const participantSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quantity: { type: Number, required: true, min: 1 },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const groupBuySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // buyer who started it

    pricePerUnit: { type: Number, required: true, min: 0 }, // group / bulk price
    targetQuantity: { type: Number, required: true, min: 1 },
    quantityCommitted: { type: Number, default: 0, min: 0 },

    closesAt: { type: Date, required: true },
    status: { type: String, enum: GROUP_BUY_STATUS, default: 'open' },

    participants: [participantSchema],

    resultingOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true }
);

groupBuySchema.index({ product: 1, status: 1 });
groupBuySchema.index({ closesAt: 1 });

groupBuySchema.methods.progressPercent = function progressPercent() {
  return Math.min(100, Math.round((this.quantityCommitted / this.targetQuantity) * 100));
};

module.exports = mongoose.model('GroupBuy', groupBuySchema);
