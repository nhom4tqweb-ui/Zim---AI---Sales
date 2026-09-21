const crypto = require('crypto');
const env = require('../config/env');

/**
 * Middleware xác thực webhook gọi tới từ cổng thanh toán / bank gateway
 * (SePay, Casso, hoặc ngân hàng trực tiếp).
 *
 * Hỗ trợ 2 cơ chế, bật cơ chế nào tùy theo .env đã cấu hình cơ chế đó ở
 * phía dashboard của cổng (chỉ nên bật 1 trong 2, ưu tiên HMAC nếu cổng hỗ trợ):
 *
 *  1) API Key: header  "Authorization: Apikey <WEBHOOK_API_KEY>"
 *     (đây là cách phổ biến nhất của SePay/Casso)
 *
 *  2) HMAC-SHA256: cổng ký raw body bằng WEBHOOK_HMAC_SECRET và gửi kèm
 *     header WEBHOOK_SIGNATURE_HEADER (mặc định "x-signature").
 *
 * QUAN TRỌNG: middleware này cần raw body (Buffer), không phải JSON đã parse,
 * để HMAC tính đúng. Xem cách mount trong app.js (express.raw trước express.json).
 */
function timingSafeEqualStr(a, b) {
  const bufA = Buffer.from(a || '', 'utf8');
  const bufB = Buffer.from(b || '', 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyApiKey(req) {
  if (!env.webhook.apiKey) return { ok: false, reason: 'API key chưa được cấu hình ở server' };

  const authHeader = req.headers['authorization'] || '';
  const [scheme, value] = authHeader.split(' ');

  if (!scheme || scheme.toLowerCase() !== 'apikey' || !value) {
    return { ok: false, reason: 'Thiếu hoặc sai định dạng header Authorization' };
  }

  const ok = timingSafeEqualStr(value, env.webhook.apiKey);
  return ok ? { ok: true } : { ok: false, reason: 'API key không khớp' };
}

function verifyHmac(req) {
  if (!env.webhook.hmacSecret) return { ok: false, reason: 'HMAC secret chưa được cấu hình ở server' };

  const signature = req.headers[env.webhook.signatureHeader];
  if (!signature) return { ok: false, reason: `Thiếu header ${env.webhook.signatureHeader}` };

  const rawBody = req.rawBody; // Buffer, gán ở app.js khi mount express.raw
  if (!rawBody) return { ok: false, reason: 'Server thiếu raw body để tính HMAC' };

  const computed = crypto
    .createHmac('sha256', env.webhook.hmacSecret)
    .update(rawBody)
    .digest('hex');

  const ok = timingSafeEqualStr(signature, computed);
  return ok ? { ok: true } : { ok: false, reason: 'Chữ ký HMAC không khớp' };
}

function verifyWebhookSignature(req, res, next) {
  // Ưu tiên HMAC nếu đã cấu hình secret, fallback về API Key.
  const strategy = env.webhook.hmacSecret ? verifyHmac : verifyApiKey;
  const result = strategy(req);

  if (!result.ok) {
    console.warn('[Webhook] Xác thực thất bại:', result.reason);
    // Trả 401 - KHÔNG trả 200 khi auth fail, để tránh false-positive log là "đã xử lý".
    return res.status(401).json({ success: false, message: 'Unauthorized webhook request' });
  }

  next();
}

module.exports = { verifyWebhookSignature };
