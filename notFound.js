// Bat tat ca link goi sai duong dan (404).
module.exports = function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy endpoint: ${req.method} ${req.originalUrl}`,
  });
};
