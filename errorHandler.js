// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[Error]', err);

  if (err.code === 11000) {
    // MongoDB duplicate key error (vd trùng orderCode, trùng bankTransactionId)
    return res.status(409).json({
      success: false,
      message: 'Duplicate key - resource already exists',
      keyValue: err.keyValue,
    });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFoundHandler };
