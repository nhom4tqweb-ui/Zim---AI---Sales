// Boc route handler async — Express 4 KHONG tu bat duoc Promise reject tu handler
// async, loi se roi thanh unhandled rejection thay vi di qua errorHandler.js.
module.exports = function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
