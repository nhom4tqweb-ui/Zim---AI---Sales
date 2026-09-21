// Bat moi loi logic trong qua trinh chay, chuyen thanh JSON de server khong bi crash.
module.exports = function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi máy chủ không xác định.',
  });
};
