// funnel.js
// Điều khiển logic 4 bước AI Sales Funnel (Step 1 -> Step 4)
// Nội dung từng bước (câu hỏi, kịch bản) nạp từ frontend/content/funnel-steps.json

let funnelState = {
  step: 1,
  goal: null,        // IELTS / TOEIC / Giao tiếp
  timeBarrier: null,
  budget: null,
  testAnswers: [],
  diagnosis: null,
};

async function loadFunnelContent() {
  const res = await fetch("content/funnel-steps.json");
  return res.json();
}

function goToStep(stepNumber) {
  document.querySelectorAll('[id^="funnel-step-"]').forEach(el => el.classList.add("hidden"));
  const target = document.getElementById(`funnel-step-${stepNumber}`);
  if (target) target.classList.remove("hidden");
  funnelState.step = stepNumber;

  if (stepNumber === 3) {
    renderStep3();
  }
}

// TODO: implement handlers cho từng step
// - Step 1: thu thập goal/timeBarrier/budget (phụ trách: Bạn 4)
// - Step 2: thu thập testAnswers, gọi backend để AI chẩn đoán (phụ trách: Bạn 5)
// - Step 3: hiển thị lộ trình dựa trên diagnosis (phụ trách: bạn - phần này)
// - Step 4: hiển thị bảng giá + xử lý objection qua chatbot.js

// ============================================================
// STEP 3 — Thẻ lộ trình cá nhân hóa (Personalized Roadmap Card)
// ============================================================
//
// HỢP ĐỒNG DỮ LIỆU (interface) với Bước 1 và Bước 2:
// - funnelState.goal      : string  -> "IELTS" | "TOEIC" | "Giao tiếp"
//                            (Bạn 4 set giá trị này ở Step 1)
// - funnelState.diagnosis : object  -> { level: "beginner" | "intermediate" | "advanced",
//                                        strengths: string[], gaps: string[] }
//                            (Bạn 5 set giá trị này sau khi gọi AI chẩn đoán ở Step 2)
//
// Nếu 2 bạn kia đặt tên field khác, chỉ cần sửa lại 2 dòng đọc dữ liệu
// trong renderStep3() bên dưới, phần còn lại giữ nguyên.

let roadmapContentCache = null;

async function loadRoadmapContent() {
  if (roadmapContentCache) return roadmapContentCache;
  const res = await fetch("content/roadmap.json");
  roadmapContentCache = await res.json();
  return roadmapContentCache;
}

/**
 * Được gọi khi người dùng chuyển sang Step 3 (ví dụ trong hàm goToStep(3)
 * hoặc ngay sau khi Bạn 5 nhận được kết quả chẩn đoán từ AI ở Step 2).
 */
async function renderStep3() {
  const container = document.getElementById("funnel-step-3");
  if (!container) return;

  const goal = funnelState.goal || "IELTS";          // fallback nếu Step 1 chưa set
  const level = funnelState.diagnosis?.level || "beginner"; // fallback nếu Step 2 chưa set

  const data = await loadRoadmapContent();
  const roadmap = data.roadmaps?.[goal]?.[level];
  const usp = data.usp_points || [];
  const comparison = data.self_study_vs_zim;

  if (!roadmap) {
    container.innerHTML = `<p class="text-slate-500 text-sm">Chưa có lộ trình phù hợp cho lựa chọn này.</p>`;
    return;
  }

  container.innerHTML = `
    <h3 class="text-lg md:text-xl font-semibold text-slate-800">Bước 3: Giải pháp & Khẳng định Giá trị</h3>

    <!-- Badge AI + tiêu đề lộ trình -->
    <div class="mt-4 flex items-center gap-2 flex-wrap">
      <span class="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
        AI Tư vấn
      </span>
      <span class="text-sm text-slate-500">Lộ trình được thiết kế riêng dựa trên kết quả Mini Test của bạn</span>
    </div>

    <!-- Thẻ lộ trình cá nhân hóa -->
    <div class="mt-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p class="text-xs font-semibold tracking-wide uppercase text-slate-500">${goal} · ${roadmap.level_label}</p>
          <p class="text-2xl font-bold text-red-700 mt-1">Mục tiêu: ${roadmap.target_score}</p>
        </div>
        <span class="text-sm text-slate-500">${roadmap.duration_weeks} tuần</span>
      </div>

      <!-- Timeline các mốc học tập -->
      <ol class="mt-6 space-y-4">
        ${roadmap.milestones.map((m, idx) => `
          <li class="flex gap-4">
            <div class="flex flex-col items-center">
              <div class="w-8 h-8 rounded-full bg-red-700 text-white text-sm font-semibold flex items-center justify-center">${idx + 1}</div>
              ${idx < roadmap.milestones.length - 1 ? '<div class="w-px flex-1 bg-slate-200 mt-1"></div>' : ""}
            </div>
            <div class="pb-4">
              <p class="text-xs font-semibold tracking-wide uppercase text-slate-500">${m.week}</p>
              <p class="text-base font-semibold text-slate-800">${m.title || "(Chưa có nội dung)"}</p>
              <p class="text-sm text-slate-500 leading-relaxed">${m.description || ""}</p>
            </div>
          </li>
        `).join("")}
      </ol>
    </div>

    <!-- USP: điểm bán hàng độc nhất -->
    <div class="mt-4 grid sm:grid-cols-3 gap-3">
      ${usp.map(u => `
        <div class="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <p class="text-sm font-semibold text-slate-800">${u.title}</p>
          <p class="text-xs text-slate-500 mt-1">${u.description || ""}</p>
        </div>
      `).join("")}
    </div>

    <!-- Bảng so sánh Tự học vs Học ZIM -->
    ${comparison ? `
      <div class="mt-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 overflow-x-auto">
        <p class="text-base font-semibold text-slate-800 mb-3">${comparison.title}</p>
        <table class="w-full text-sm text-left">
          <thead>
            <tr class="text-slate-500 text-xs uppercase">
              <th class="py-2 pr-4">Tiêu chí</th>
              <th class="py-2 pr-4">Tự học</th>
              <th class="py-2">Học cùng ZIM</th>
            </tr>
          </thead>
          <tbody>
            ${comparison.criteria.map(c => `
              <tr class="border-t border-slate-200">
                <td class="py-2 pr-4 font-medium text-slate-800">${c.label}</td>
                <td class="py-2 pr-4 text-slate-500">${c.self_study || "-"}</td>
                <td class="py-2 text-emerald-600 font-medium">${c.zim || "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : ""}

    <button onclick="goToStep(4)" class="mt-6 bg-red-700 hover:bg-red-800 text-white font-medium py-3 px-6 rounded-xl transition duration-200">
      Xem báo giá lộ trình này
    </button>
  `;
}
