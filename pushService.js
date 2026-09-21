const webpush = require('web-push');
const env = require('../config/env');
const PushSubscription = require('../models/PushSubscription');

let configured = false;

function ensureConfigured() {
  if (configured) return;
  if (!env.vapid.publicKey || !env.vapid.privateKey) {
    throw new Error('VAPID keys chưa được cấu hình - chạy `npx web-push generate-vapid-keys`');
  }
  webpush.setVapidDetails(env.vapid.subject, env.vapid.publicKey, env.vapid.privateKey);
  configured = true;
}

async function saveSubscription({ studentId, subscription, userAgent }) {
  ensureConfigured();
  const { endpoint, keys } = subscription;

  return PushSubscription.findOneAndUpdate(
    { endpoint },
    { studentId, endpoint, keys, userAgent, isActive: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/**
 * Gửi 1 thông báo tới 1 subscription cụ thể.
 * Tự động deactivate subscription nếu trình duyệt trả về 404/410
 * (nghĩa là subscription đã hết hạn / user đã gỡ quyền thông báo).
 */
async function sendToSubscription(subDoc, payload) {
  ensureConfigured();
  try {
    await webpush.sendNotification(
      { endpoint: subDoc.endpoint, keys: subDoc.keys },
      JSON.stringify(payload)
    );
    return { ok: true };
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      await PushSubscription.updateOne({ _id: subDoc._id }, { $set: { isActive: false } });
      return { ok: false, reason: 'SUBSCRIPTION_EXPIRED' };
    }
    console.error('[Push] Gửi thất bại:', err.message);
    return { ok: false, reason: err.message };
  }
}

/**
 * Gửi nhắc nhở bài tập tới 1 học viên (tất cả thiết bị đã subscribe của họ).
 * payload dạng: { title, body, icon, url }
 */
async function sendReminderToStudent(studentId, payload) {
  const subs = await PushSubscription.find({ studentId, isActive: true });
  const results = await Promise.all(subs.map((sub) => sendToSubscription(sub, payload)));
  return {
    total: subs.length,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
  };
}

module.exports = { saveSubscription, sendToSubscription, sendReminderToStudent };
