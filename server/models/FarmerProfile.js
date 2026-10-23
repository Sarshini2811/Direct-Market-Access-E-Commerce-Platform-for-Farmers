const mongoose = require('mongoose');
const { VERIFICATION_STATUS } = require('../config/constants');

const farmerProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    farmName: { type: String, required: true, trim: true, maxlength: 120 },
    farmingType: { type: String, trim: true }, // e.g. organic, conventional, mixed
    location: {
      village: String,
      district: String,
      state: String,
      pincode: String,
      geo: {
        lat: Number,
        lng: Number,
      },
    },
    bio: { type: String, maxlength: 1000 },
    yearsFarming: { type: Number, min: 0 },
    verificationStatus: { type: String, enum: VERIFICATION_STATUS, default: 'unverified' },
    verifiedAt: Date,
    certifications: [
      {
        name: String,
        issuedBy: String,
        documentUrl: String,
        addedAt: { type: Date, default: Date.now },
      },
    ],
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    payoutInfo: {
      accountHolder: String,
      accountNumberMasked: String, // never store full account numbers
      ifsc: String,
    },
  },
  { timestamps: true }
);

farmerProfileSchema.index({ verificationStatus: 1 });
farmerProfileSchema.index({ 'location.state': 1, 'location.district': 1 });

module.exports = mongoose.model('FarmerProfile', farmerProfileSchema);
