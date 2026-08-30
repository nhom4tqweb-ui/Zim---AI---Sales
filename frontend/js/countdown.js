// countdown.js
// Đồng hồ đếm ngược 15:00 cho khối "Chốt đơn & Cổng thanh toán"

function startCountdown(durationInSeconds, displayElementId) {
  const display = document.getElementById(displayElementId);
  if (!display) return;

  let remaining = durationInSeconds;

  const timer = setInterval(() => {
    const minutes = Math.floor(remaining / 60).toString().padStart(2, "0");
    const seconds = (remaining % 60).toString().padStart(2, "0");
    display.textContent = `${minutes}:${seconds}`;

    if (remaining <= 0) {
      clearInterval(timer);
      display.textContent = "Hết thời gian ưu đãi";
    }
    remaining--;
  }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  startCountdown(15 * 60, "countdown-timer");
});
