const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const VerificationRequest = require('../models/VerificationRequest');
const FarmerProfile = require('../models/FarmerProfile');
const { notify } = require('../services/notificationService');
const { logAction } = require('../services/auditService');

const listRequests = asyncHandler(async (req, res) => {
  const { status = 'pending', page = 1, limit = 10 } = req.query;
  const filter = status === 'all' ? {} : { status };
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    VerificationRequest.find(filter)
      .populate('farmer', 'name email phone')
      .populate('farmerProfile', 'farmName location')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    VerificationRequest.countDocuments(filter),
  ]);
  sendPaginated(res, items, page, limit, total);
});

const getRequest = asyncHandler(async (req, res) => {
  const request = await VerificationRequest.findById(req.params.id)
    .populate('farmer', 'name email phone')
    .populate('farmerProfile');
  if (!request) throw new ApiError(404, 'Verification request not found.');
  sendSuccess(res, 200, { request });
});

const decideRequest = asyncHandler(async (req, res) => {
  const { decision, adminNote } = req.body; // decision: 'approved' | 'rejected'
  if (!['approved', 'rejected'].includes(decision)) throw new ApiError(422, "decision must be 'approved' or 'rejected'.");

  const request = await VerificationRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, 'Verification request not found.');
  if (request.status !== 'pending') throw new ApiError(400, 'This request has already been decided.');

  request.status = decision;
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  request.adminNote = adminNote;
  await request.save();

  const profile = await FarmerProfile.findById(request.farmerProfile);
  if (profile) {
    profile.verificationStatus = decision === 'approved' ? 'verified' : 'rejected';
    if (decision === 'approved') profile.verifiedAt = new Date();
    await profile.save();
  }

  await notify({
    userId: request.farmer,
    type: 'verification',
    title: decision === 'approved' ? 'Farm verified!' : 'Verification not approved',
    message:
      decision === 'approved'
        ? 'Your farm has been verified. A verification badge now appears on your listings.'
        : `Your verification request was not approved. ${adminNote || ''}`.trim(),
    link: '/farmer/profile',
    relatedId: request._id,
  });

  await logAction({
    actorId: req.user._id,
    action: `verification.${decision}`,
    targetType: 'VerificationRequest',
    targetId: request._id,
    metadata: { adminNote },
  });

  sendSuccess(res, 200, { request }, null, `Verification request ${decision}`);
});

module.exports = { listRequests, getRequest, decideRequest };
