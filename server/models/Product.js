const mongoose = require('mongoose');
const slugify = require('slugify');
const { PRODUCT_CATEGORIES, PRODUCT_UNITS, QUALITY_GRADES } = require('../config/constants');

const productSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, index: true },
    description: { type: String, maxlength: 2000 },
    category: { type: String, enum: PRODUCT_CATEGORIES, required: true },
    variety: { type: String, trim: true },
    grade: { type: String, enum: QUALITY_GRADES, default: 'ungraded' },
    images: [{ type: String }],

    unit: { type: String, enum: PRODUCT_UNITS, required: true },
    price: { type: Number, required: true, min: 0 }, // retail price per unit
    wholesale: {
      enabled: { type: Boolean, default: false },
      minQuantity: { type: Number, min: 0, default: 0 },
      pricePerUnit: { type: Number, min: 0 },
    },

    quantityAvailable: { type: Number, required: true, min: 0, default: 0 },
    quantityReserved: { type: Number, min: 0, default: 0 }, // held by pending orders/pre-orders/group-buys

    harvestDate: Date,
    expiryOrFreshUntil: Date,

    deliveryOptions: {
      pickup: { type: Boolean, default: true },
      delivery: { type: Boolean, default: false },
      deliveryFee: { type: Number, default: 0, min: 0 },
      estimatedDays: { type: Number, default: 1, min: 0 },
    },

    isActive: { type: Boolean, default: true },
    isSurplusDiscount: { type: Boolean, default: false },
    surplusDiscountPercent: { type: Number, min: 0, max: 90, default: 0 },

    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },

    location: {
      district: String,
      state: String,
    },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', variety: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ farmer: 1 });
productSchema.index({ price: 1 });

productSchema.virtual('effectivePrice').get(function effectivePrice() {
  if (this.isSurplusDiscount && this.surplusDiscountPercent > 0) {
    return +(this.price * (1 - this.surplusDiscountPercent / 100)).toFixed(2);
  }
  return this.price;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.pre('validate', function setSlug(next) {
  if (this.name) {
    this.slug = slugify(`${this.name}-${Date.now().toString(36)}`, { lower: true, strict: true });
  }
  next();
});

// available-to-buy quantity, guards against overselling
productSchema.methods.availableToSell = function availableToSell() {
  return Math.max(0, this.quantityAvailable - this.quantityReserved);
};

module.exports = mongoose.model('Product', productSchema);
