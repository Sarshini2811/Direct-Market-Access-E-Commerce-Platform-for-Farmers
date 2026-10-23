// Ensures every endpoint replies with the same envelope shape, so the
// frontend service layer can rely on a single response contract.

function sendSuccess(res, statusCode, data = null, meta = null, message = 'OK') {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

function sendPaginated(res, items, page, limit, total, extra = {}) {
  return res.status(200).json({
    success: true,
    message: 'OK',
    data: items,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      ...extra,
    },
  });
}

module.exports = { sendSuccess, sendPaginated };
