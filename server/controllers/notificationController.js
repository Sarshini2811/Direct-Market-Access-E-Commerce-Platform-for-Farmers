const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const Notification = require('../models/Notification');

// Consumed via polling (simple GET, called every N seconds by the frontend)
// as an honest stand-in for real-time infrastructure not configured here.
const listMyNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly } = req.query;
  const filter = { user: req.user._id };
  if (unreadOnly === 'true') filter.isRead = false;

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).sort('-createdAt').limit(50),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  sendSuccess(res, 200, { notifications, unreadCount });
});

const markRead = asyncHandler(async (req, res) => {
  await Notification.updateOne(
    { _id: req.params.id, user: req.user._id },
    { isRead: true }
  );
  sendSuccess(res, 200, null, null, 'Marked read');
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  sendSuccess(res, 200, null, null, 'All notifications marked read');
});

module.exports = { listMyNotifications, markRead, markAllRead };
