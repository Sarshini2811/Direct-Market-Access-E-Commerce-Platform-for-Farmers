const Notification = require('../models/Notification');

// Centralizes notification creation so every module (orders, pre-orders,
// group-buys, inventory, verification, reviews) writes them consistently.
// The frontend consumes these via polling (GET /api/notifications), which is
// a practical, honest stand-in when no real-time infra (sockets) is configured.

async function notify({ userId, type, title, message, link = null, relatedId = null }) {
  return Notification.create({ user: userId, type, title, message, link, relatedId });
}

async function notifyMany(userIds, payload) {
  const docs = userIds.map((userId) => ({ user: userId, ...payload }));
  if (docs.length === 0) return [];
  return Notification.insertMany(docs);
}

module.exports = { notify, notifyMany };
