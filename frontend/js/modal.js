/**
 * MODAL.JS
 * -----------------------------------------------------------
 * Điều khiển toàn bộ hành vi của Modal chốt khóa học (Step 5):
 * 1. Mở/đóng modal.
 * 2. Submit form -> gọi API backend (POST /api/orders) để:
 *      - Tạo mã đơn hàng
 *      - Tính giá sau ưu đãi
 *      - Sinh URL ảnh VietQR
 *      - Lưu đơn hàng vào MySQL (thực hiện ở backend)
 * 3. Hiển thị khung QR + thông tin chuyển khoản.
 * 4. Polling (gọi API định kỳ) để kiểm tra học viên đã thanh
 *    toán hay chưa -> mô phỏng luồng "thanh toán không chạm".
 * -----------------------------------------------------------
 */

// Đổi thành domain thật khi deploy (vd: https://api.zimenglish.vn)
const API_BASE_URL = "http://localhost:3000/api";

let currentOrderCode = null;
let paymentPollingId = null;

document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("btnOpenPaymentModal");
  const closeBtn = document.getElementById("btnCloseModal");
  const overlay = document.getElementById("paymentModalOverlay");
  const form = document.getElementById("enrollmentForm");
  const backBtn = document.getElementById("btnBackToForm");

  // ---- Mở modal + đổ dữ liệu khóa học từ data-attribute ----
  openBtn.addEventListener("click", () => {
    document.getElementById("modalCourseName").textContent =
      openBtn.dataset.courseName;
    document.getElementById("sumOriginalPrice").textContent = formatVND(
      openBtn.dataset.originalPrice
    );
    document.getElementById("sumFinalPrice").textContent = formatVND(
      openBtn.dataset.finalPrice
    );

    overlay.classList.add("active");
    startCountdown(); // Bắt đầu đếm ngược khi modal mở (countdown.js)
  });

  // ---- Đóng modal ----
  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  function closeModal() {
    overlay.classList.remove("active");
    if (paymentPollingId) clearInterval(paymentPollingId);
  }

  // ---- Quay lại chỉnh sửa thông tin ----
  backBtn.addEventListener("click", () => {
    document.getElementById("stepQRPayment").classList.add("d-none");
    document.getElementById("stepFormInfo").classList.remove("d-none");
    if (paymentPollingId) clearInterval(paymentPollingId);
  });

  // ---- Submit form: gọi API tạo đơn hàng ----
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById("btnGenerateQR");
    submitBtn.disabled = true;
    submitBtn.textContent = "Đang tạo mã QR...";

    const payload = {
      courseId: openBtn.dataset.courseId,
      courseName: openBtn.dataset.courseName,
      originalPrice: Number(openBtn.dataset.originalPrice),
      finalPrice: Number(openBtn.dataset.finalPrice),
      studentName: document.getElementById("studentName").value.trim(),
      studentPhone: document.getElementById("studentPhone").value.trim(),
      studentEmail: document.getElementById("studentEmail").value.trim(),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Không thể tạo đơn hàng");
      const data = await res.json();

      renderQRStep(data);
      startPaymentPolling(data.orderCode);
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Tạo mã QR thanh toán ngay";
    }
  });
});

/**
 * Hiển thị bước QR sau khi backend trả về thông tin đơn hàng.
 * @param {Object} data - Response từ POST /api/orders
 */
function renderQRStep(data) {
  currentOrderCode = data.orderCode;

  document.getElementById("stepFormInfo").classList.add("d-none");
  document.getElementById("stepQRPayment").classList.remove("d-none");

  document.getElementById("vietQRImage").src = data.qrUrl;
  document.getElementById("infoOrderCode").textContent = data.orderCode;
  document.getElementById("infoAmount").textContent = formatVND(data.finalPrice);
  document.getElementById("infoTransferContent").textContent = data.transferContent;

  // Reset trạng thái hiển thị "đang chờ thanh toán"
  const statusBox = document.getElementById("paymentStatusBox");
  statusBox.classList.remove("paid");
  statusBox.innerHTML = `
    <div class="spinner-border spinner-border-sm text-danger me-2" role="status"></div>
    <span>Đang chờ xác nhận thanh toán...</span>
  `;
}

/**
 * Polling định kỳ (mỗi 4s) để kiểm tra trạng thái thanh toán
 * -> mô phỏng luồng "QR không chạm": học viên chuyển khoản xong,
 *    hệ thống tự nhận diện, không cần thao tác thủ công.
 * (Ở bản thật: có thể thay bằng Webhook từ cổng thanh toán/ngân hàng
 *  hoặc WebSocket để cập nhật tức thời thay vì polling.)
 */
function startPaymentPolling(orderCode) {
  if (paymentPollingId) clearInterval(paymentPollingId);

  paymentPollingId = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderCode}/status`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.paymentStatus === "paid") {
        clearInterval(paymentPollingId);
        const statusBox = document.getElementById("paymentStatusBox");
        statusBox.classList.add("paid");
        statusBox.innerHTML = "✅ Thanh toán thành công! Đang kích hoạt khóa học...";
      }
    } catch (err) {
      console.error("Lỗi khi kiểm tra trạng thái thanh toán:", err);
    }
  }, 4000);
}

/**
 * Định dạng số tiền theo chuẩn VNĐ.
 * @param {number|string} value
 * @returns {string} vd: "2.990.000đ"
 */
function formatVND(value) {
  return Number(value).toLocaleString("vi-VN") + "đ";
}
