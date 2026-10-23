const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farmerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'FarmerProfile', required: true },
    documents: [{ name: String, url: String }],
    farmerNote: { type: String, maxlength: 1000 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    adminNote: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

verificationRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);
