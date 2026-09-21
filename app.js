const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const env = require('./config/env');

const app = express();

app.use(helmet());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// Rate limit riêng cho các API public-facing dễ bị spam (tạo đơn hàng).
const orderCreateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều yêu cầu tạo đơn, vui lòng thử lại sau' },
});
app.use('/api/v1/orders/create', orderCreateLimiter);

/*
 * QUAN TRỌNG: route webhook cần RAW BODY để tính HMAC-SHA256 chính xác,
 * nên phải mount express.raw() CHO RIÊNG route này TRƯỚC express.json() global.
 * Ta lưu lại rawBody (Buffer) rồi tự parse JSON để gán vào req.body,
 * để phần còn lại của code (controller) vẫn dùng req.body như JSON bình thường.
 */
app.use(
  '/api/v1/payments/webhook',
  express.raw({ type: '*/*', limit: '1mb' }),
  (req, res, next) => {
    req.rawBody = req.body; // Buffer, dùng để verify HMAC
    try {
      req.body = req.body && req.body.length ? JSON.parse(req.body.toString('utf8')) : {};
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Payload không phải JSON hợp lệ' });
    }
    next();
  }
);

// JSON body parser cho tất cả các route còn lại.
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => res.json({ success: true, uptime: process.uptime() }));

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
