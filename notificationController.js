const mongoose = require('mongoose');
const { saveSubscription, sendReminderToStudent } = require('../services/pushService');
const env = require('../config/env');

/**
 * GET /api/v1/notifications/vapid-public-key
 * FE cần public key này để gọi PushManager.subscribe() ở trình duyệt.
 */
function getPublicKey(req, res) {
  return res.json({ success: true, data: { publicKey: env.vapid.publicKey } });
}

/**
 * POST /api/v1/notifications/subscribe
 * body: { student_id, subscription: PushSubscriptionJSON }
 */
async function subscribe(req, res, next) {
  try {
    const { student_id, subscription } = req.body;

    if (!student_id || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ success: false, message: 'Thiếu student_id hoặc subscription không hợp lệ' });
    }
    if (!mongoose.isValidObjectId(student_id)) {
      return res.status(400).json({ success: false, message: 'student_id không hợp lệ' });
    }

    const saved = await saveSubscription({
      studentId: student_id,
      subscription,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: { id: saved._id } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/notifications/send-reminder
 * body: { student_id, title, body, url }
 * Endpoint để trigger thủ công (vd từ trang Admin) hoặc gọi bởi cronjob reminderJob.
 */
async function sendReminder(req, res, next) {
  try {
    const { student_id, title, body, url, icon } = req.body;

    if (!student_id || !title || !body) {
      return res.status(400).json({ success: false, message: 'Thiếu student_id, title hoặc body' });
    }

    const result = await sendReminderToStudent(student_id, {
      title,
      body,
      icon: icon || '/icons/zim-logo-192.png',
      url: url || '/',
    });

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPublicKey, subscribe, sendReminder };
