const AuditLog = require('../models/AuditLog');

async function logAction({ actorId, action, targetType, targetId, metadata }) {
  return AuditLog.create({ actor: actorId, action, targetType, targetId, metadata });
}

module.exports = { logAction };
