/**
 * COUNTDOWN.JS
 * -----------------------------------------------------------
 * Xử lý đồng hồ đếm ngược thời gian giữ ưu đãi (FOMO/Scarcity).
 * - Thời lượng mặc định: 10 phút (có thể chỉnh COUNTDOWN_MINUTES).
 * - Khi hết giờ: ẩn form/QR, hiển thị màn hình "Hết hạn" (#stepExpired).
 * - Lưu mốc thời gian hết hạn vào sessionStorage để nếu học viên
 *   lỡ tay F5 (refresh) thì đồng hồ vẫn tiếp tục đếm đúng,
 *   không bị "reset" lại giúp tăng độ tin cậy của ưu đãi.
 * -----------------------------------------------------------
 */

const COUNTDOWN_MINUTES = 10; // Có thể đổi thành 15 theo yêu cầu đề bài
let countdownTimerId = null;

/**
 * Khởi tạo / tiếp tục đếm ngược khi mở modal.
 */
function startCountdown() {
  const STORAGE_KEY = "zim_promo_deadline";

  // Nếu đã có deadline lưu trong session -> dùng lại (tránh reset khi F5)
  let deadline = sessionStorage.getItem(STORAGE_KEY);

  if (!deadline) {
    deadline = Date.now() + COUNTDOWN_MINUTES * 60 * 1000;
    sessionStorage.setItem(STORAGE_KEY, deadline);
  }
  deadline = Number(deadline);

  // Xóa interval cũ nếu có (tránh chạy trùng nhiều timer)
  if (countdownTimerId) clearInterval(countdownTimerId);

  updateCountdownDisplay(deadline); // Chạy ngay lần đầu, không đợi 1s
  countdownTimerId = setInterval(() => updateCountdownDisplay(deadline), 1000);
}

/**
 * Tính toán thời gian còn lại và cập nhật giao diện.
 * @param {number} deadline - Mốc thời gian (timestamp ms) hết hạn ưu đãi
 */
function updateCountdownDisplay(deadline) {
  const remainingMs = deadline - Date.now();

  const minutesEl = document.getElementById("cdMinutes");
  const secondsEl = document.getElementById("cdSeconds");
  const wrapperEl = document.getElementById("countdownWrapper");

  if (remainingMs <= 0) {
    // Hết giờ -> dừng timer & chuyển sang màn hình hết hạn
    clearInterval(countdownTimerId);
    minutesEl.textContent = "00";
    secondsEl.textContent = "00";
    handleCountdownExpired();
    return;
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  minutesEl.textContent = String(minutes).padStart(2, "0");
  secondsEl.textContent = String(seconds).padStart(2, "0");

  // Tạo hiệu ứng nhấp nháy khẩn cấp khi còn dưới 60 giây
  if (totalSeconds <= 60) {
    wrapperEl.classList.add("urgent");
  } else {
    wrapperEl.classList.remove("urgent");
  }
}

/**
 * Xử lý khi hết thời gian giữ ưu đãi:
 * ẩn form nhập liệu & khung QR, hiện thông báo hết hạn.
 */
function handleCountdownExpired() {
  document.getElementById("stepFormInfo")?.classList.add("d-none");
  document.getElementById("stepQRPayment")?.classList.add("d-none");
  document.getElementById("stepExpired")?.classList.remove("d-none");

  // Vô hiệu hóa nút submit (phòng trường hợp form vẫn còn hiển thị)
  const btn = document.getElementById("btnGenerateQR");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Ưu đãi đã hết hạn";
  }
}
