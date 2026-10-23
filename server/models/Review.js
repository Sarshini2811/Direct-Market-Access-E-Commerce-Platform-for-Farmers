const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
    isHidden: { type: Boolean, default: false }, // admin moderation
  },
  { timestamps: true }
);

// one review per buyer per product per order — enforces "eligible completed purchase" rule
reviewSchema.index({ buyer: 1, product: 1, order: 1 }, { unique: true });
reviewSchema.index({ product: 1 });
reviewSchema.index({ farmer: 1 });

module.exports = mongoose.model('Review', reviewSchema);
