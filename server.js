const env = require('./config/env');
const { connectDB } = require('./config/db');
const app = require('./app');
const { scheduleReconciliationJob } = require('./jobs/reconciliationJob');
const { scheduleReminderJob } = require('./jobs/reminderJob');

async function main() {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`[Server] ZIM Academy Backend đang chạy tại http://localhost:${env.port}`);
  });

  scheduleReconciliationJob();
  scheduleReminderJob(); // truyền getUpcomingDeadlines thật vào đây khi module Bài tập sẵn sàng
}

main().catch((err) => {
  console.error('[Server] Không thể khởi động:', err);
  process.exit(1);
});
