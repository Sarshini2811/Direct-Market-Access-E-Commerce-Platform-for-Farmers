const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const Report = require('../models/Report');
const Product = require('../models/Product');
const Review = require('../models/Review');
const User = require('../models/User');
const { logAction } = require('../services/auditService');

const createReport = asyncHandler(async (req, res) => {
  const { targetType, targetId, reason } = req.body;
  if (!['product', 'user', 'review'].includes(targetType)) throw new ApiError(422, 'Invalid target type.');
  if (!reason || reason.trim().length < 5) throw new ApiError(422, 'Please describe the issue (min 5 characters).');

  const report = await Report.create({
    reportedBy: req.user._id,
    targetType,
    targetId,
    reason: reason.trim(),
  });

  sendSuccess(res, 201, { report }, null, 'Report submitted for admin review');
});

const listReports = asyncHandler(async (req, res) => {
  const { status = 'open', page = 1, limit = 15 } = req.query;
  const filter = status === 'all' ? {} : { status };
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Report.find(filter).populate('reportedBy', 'name email').sort('-createdAt').skip(skip).limit(Number(limit)),
    Report.countDocuments(filter),
  ]);
  sendPaginated(res, items, page, limit, total);
});

const resolveReport = asyncHandler(async (req, res) => {
  const { action, resolutionNote } = req.body; // action: 'dismiss' | 'remove_content' | 'suspend_user'
  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, 'Report not found.');
  if (report.status === 'resolved' || report.status === 'dismissed') {
    throw new ApiError(400, 'Report already handled.');
  }

  if (action === 'remove_content') {
    if (report.targetType === 'product') {
      await Product.findByIdAndUpdate(report.targetId, { isActive: false });
    } else if (report.targetType === 'review') {
      await Review.findByIdAndUpdate(report.targetId, { isHidden: true });
    }
    report.status = 'resolved';
  } else if (action === 'suspend_user') {
    if (report.targetType !== 'user') throw new ApiError(400, 'suspend_user only applies to user reports.');
    await User.findByIdAndUpdate(report.targetId, { accountStatus: 'suspended' });
    report.status = 'resolved';
  } else if (action === 'dismiss') {
    report.status = 'dismissed';
  } else {
    throw new ApiError(422, 'Invalid action.');
  }

  report.resolvedBy = req.user._id;
  report.resolutionNote = resolutionNote;
  report.resolvedAt = new Date();
  await report.save();

  await logAction({
    actorId: req.user._id,
    action: `report.${action}`,
    targetType: report.targetType,
    targetId: report.targetId,
    metadata: { resolutionNote },
  });

  sendSuccess(res, 200, { report }, null, 'Report resolved');
});

module.exports = { createReport, listReports, resolveReport };
