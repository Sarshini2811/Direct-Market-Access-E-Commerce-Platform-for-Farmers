const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const FarmerProfile = require('../models/FarmerProfile');
const VerificationRequest = require('../models/VerificationRequest');
const Review = require('../models/Review');
const { notify } = require('../services/notificationService');

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await FarmerProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, 'Farmer profile not found.');
  sendSuccess(res, 200, { profile });
});

const getPublicProfile = asyncHandler(async (req, res) => {
  const profile = await FarmerProfile.findOne({ user: req.params.farmerId }).populate(
    'user',
    'name avatarUrl createdAt'
  );
  if (!profile) throw new ApiError(404, 'Farmer profile not found.');

  const reviews = await Review.find({ farmer: req.params.farmerId, isHidden: false })
    .populate('buyer', 'name avatarUrl')
    .sort('-createdAt')
    .limit(20);

  sendSuccess(res, 200, { profile, reviews });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const allowed = ['farmName', 'farmingType', 'location', 'bio', 'yearsFarming', 'payoutInfo'];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  const profile = await FarmerProfile.findOneAndUpdate({ user: req.user._id }, updates, {
    new: true,
    runValidators: true,
  });
  if (!profile) throw new ApiError(404, 'Farmer profile not found.');
  sendSuccess(res, 200, { profile }, null, 'Farm profile updated');
});

const submitVerification = asyncHandler(async (req, res) => {
  const profile = await FarmerProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, 'Farmer profile not found.');

  if (profile.verificationStatus === 'verified') {
    throw new ApiError(400, 'This farm is already verified.');
  }

  const documents = (req.body.documents || []).slice(0, 5);
  const request = await VerificationRequest.create({
    farmer: req.user._id,
    farmerProfile: profile._id,
    documents,
    farmerNote: req.body.farmerNote,
  });

  profile.verificationStatus = 'pending';
  await profile.save();

  sendSuccess(res, 201, { request }, null, 'Verification request submitted for admin review');
});

module.exports = { getMyProfile, getPublicProfile, updateMyProfile, submitVerification };
