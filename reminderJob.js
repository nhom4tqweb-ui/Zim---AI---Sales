const cron = require('node-cron');
const { sendReminderToStudent } = require('../services/pushService');

/**
 * LƯU Ý QUAN TRỌNG:
 * Model "Assignment" / "bài tập" không nằm trong phạm vi 3 bảng được giao cho
 * Backend 3 (Orders, Enrollments, PushSubscriptions), nó được quản lý bởi phần
 * module Bài tập/Lộ trình (kết hợp cùng FE 3). File này viết ở dạng "pluggable":
 * chỉ cần cung cấp hàm `getUpcomingDeadlines()` trỏ tới model/service thật của
 * module đó (import vào, hoặc gọi API nội bộ) là job chạy được ngay.
 *
 * Input mong đợi từ getUpcomingDeadlines(): mảng các object
 *   { studentId, assignmentTitle, dueAt, assignmentUrl }
 */
async function defaultGetUpcomingDeadlines() {
  // TODO: thay bằng query thật, ví dụ:
  // return Assignment.find({
  //   dueAt: { $gte: now, $lte: in2Hours },
  //   reminderSentAt: null,
  // }).lean();
  console.warn('[ReminderJob] getUpcomingDeadlines() chưa được nối với module Bài tập thật, trả về mảng rỗng');
  return [];
}

async function runReminderSweep(getUpcomingDeadlines = defaultGetUpcomingDeadlines) {
  try {
    const upcoming = await getUpcomingDeadlines();

    for (const item of upcoming) {
      const result = await sendReminderToStudent(item.studentId, {
        title: 'Nhắc nộp bài tập ⏰',
        body: `Bài "${item.assignmentTitle}" sắp đến hạn nộp.`,
        url: item.assignmentUrl || '/',
      });
      console.log(`[ReminderJob] Đã gửi nhắc nhở cho student ${item.studentId}:`, result);
      // TODO: đánh dấu reminderSentAt trên Assignment để tránh gửi lặp lại ở lần quét sau.
    }
  } catch (err) {
    console.error('[ReminderJob] Lỗi khi chạy reminder sweep:', err.message);
  }
}

/** Chạy mỗi 15 phút, kiểm tra bài tập sắp đến hạn để nhắc học viên. */
function scheduleReminderJob(getUpcomingDeadlines) {
  cron.schedule('*/15 * * * *', () => runReminderSweep(getUpcomingDeadlines));
  console.log('[ReminderJob] Đã lên lịch reminderJob (mỗi 15 phút)');
}

module.exports = { scheduleReminderJob, runReminderSweep };
