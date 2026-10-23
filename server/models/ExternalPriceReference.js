const mongoose = require('mongoose');

// Optional, manually-curated regional reference prices (e.g. mandi/APMC style
// data an admin enters). Every row must carry its source and date so the UI
// can show provenance instead of presenting it as platform data.

const externalPriceReferenceSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    productName: { type: String, required: true },
    unit: { type: String, required: true },
    referencePrice: { type: Number, required: true, min: 0 },
    state: String,
    district: String,
    source: { type: String, required: true }, // e.g. "e-NAM", "Local APMC bulletin"
    sourceDate: { type: Date, required: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

externalPriceReferenceSchema.index({ category: 1, productName: 1, sourceDate: -1 });

module.exports = mongoose.model('ExternalPriceReference', externalPriceReferenceSchema);
