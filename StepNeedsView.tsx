import React, { useState } from 'react';
import {
  GraduationCap,
  Briefcase,
  MessageCircle,
  Clock,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Home,
  Plane,
  TrendingUp,
  BookOpen,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface NeedsFormData {
  goal: string;        // mục tiêu học
  reason: string;      // lý do học
  timeBarrier: string; // rào cản thời gian
  budgetBarrier: string; // rào cản ngân sách
}

interface StepNeedsViewProps {
  /** Callback khi hoàn tất Step 1 – truyền dữ liệu form lên component cha */
  onComplete?: (data: NeedsFormData) => void;
}

// ─── Option helpers ───────────────────────────────────────────────────────────
const GOALS = [
  {
    id: 'ielts',
    label: 'IELTS',
    sub: 'Du học / Định cư / Việc làm quốc tế',
    icon: GraduationCap,
    color: 'border-red-600 bg-red-50',
    activeColor: 'ring-2 ring-red-600',
    iconColor: 'text-red-700',
  },
  {
    id: 'toeic',
    label: 'TOEIC',
    sub: 'Tốt nghiệp / Thăng chức / Tăng lương',
    icon: Briefcase,
    color: 'border-indigo-500 bg-indigo-50',
    activeColor: 'ring-2 ring-indigo-500',
    iconColor: 'text-indigo-600',
  },
  {
    id: 'communication',
    label: 'Giao tiếp',
    sub: 'Tự tin nói chuyện với người nước ngoài',
    icon: MessageCircle,
    color: 'border-emerald-500 bg-emerald-50',
    activeColor: 'ring-2 ring-emerald-500',
    iconColor: 'text-emerald-600',
  },
];

const REASONS = [
  { id: 'graduate', label: 'Ra trường / Tốt nghiệp', icon: BookOpen },
  { id: 'immigration', label: 'Định cư nước ngoài', icon: Plane },
  { id: 'salary', label: 'Tăng lương / Thăng chức', icon: TrendingUp },
  { id: 'abroad', label: 'Du học / Học bổng', icon: GraduationCap },
  { id: 'work', label: 'Công việc yêu cầu', icon: Briefcase },
  { id: 'home', label: 'Tự nâng cao bản thân', icon: Home },
];

const TIME_BARRIERS = [
  { id: 'very_busy', label: 'Rất bận, chỉ có < 30 phút/ngày' },
  { id: 'busy', label: 'Bận vừa, khoảng 30–60 phút/ngày' },
  { id: 'flexible', label: 'Khá rảnh, có thể 1–2 tiếng/ngày' },
  { id: 'no_barrier', label: 'Không có rào cản về thời gian' },
];

const BUDGET_BARRIERS = [
  { id: 'low', label: 'Dưới 5 triệu – cân nhắc kỹ chi phí' },
  { id: 'mid', label: '5 – 10 triệu – muốn đáng đồng tiền' },
  { id: 'high', label: '10 – 20 triệu – ưu tiên chất lượng' },
  { id: 'no_barrier', label: 'Ngân sách không phải vấn đề' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
const SectionTitle: React.FC<{ step: number; title: string; desc?: string }> = ({
  step,
  title,
  desc,
}) => (
  <div className="mb-4">
    <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
      <Sparkles size={12} />
      Câu {step}
    </span>
    <h3 className="text-base font-bold text-slate-800">{title}</h3>
    {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
  </div>
);

const RadioPill: React.FC<{
  selected: boolean;
  onClick: () => void;
  label: string;
}> = ({ selected, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 text-left
      ${selected
        ? 'border-red-600 bg-red-50 text-red-800 ring-2 ring-red-500/40'
        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      }`}
  >
    <span
      className={`w-4 h-4 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors
        ${selected ? 'border-red-600 bg-red-600' : 'border-slate-300 bg-white'}`}
    >
      {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
    </span>
    {label}
  </button>
);

// ─── Progress bar ─────────────────────────────────────────────────────────────
const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="flex items-center gap-2 mb-6">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-1.5 flex-1 rounded-full transition-all duration-300
          ${i < current ? 'bg-red-600' : 'bg-slate-200'}`}
      />
    ))}
    <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-1">
      {current}/{total}
    </span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const StepNeedsView: React.FC<StepNeedsViewProps> = ({ onComplete }) => {
  const [form, setForm] = useState<NeedsFormData>({
    goal: '',
    reason: '',
    timeBarrier: '',
    budgetBarrier: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const filledCount = [form.goal, form.reason, form.timeBarrier, form.budgetBarrier].filter(
    Boolean
  ).length;
  const isComplete = filledCount === 4;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;
    setSubmitted(true);
    onComplete?.(form);
  };

  // ── Submitted state ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div
        id="step-needs"
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-xl mx-auto text-center"
      >
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} className="text-emerald-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">
          Tuyệt vời! ZIM đã ghi nhận mục tiêu của bạn.
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          AI của ZIM đang phân tích và chuẩn bị bài kiểm tra đầu vào phù hợp nhất cho bạn…
        </p>
        {/* Summary chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {[
            GOALS.find((g) => g.id === form.goal)?.label,
            REASONS.find((r) => r.id === form.reason)?.label,
            TIME_BARRIERS.find((t) => t.id === form.timeBarrier)?.label,
            BUDGET_BARRIERS.find((b) => b.id === form.budgetBarrier)?.label,
          ]
            .filter(Boolean)
            .map((chip, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 py-1 px-3 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
              >
                <CheckCircle2 size={11} className="text-emerald-500" />
                {chip}
              </span>
            ))}
        </div>
        <div className="flex items-center gap-2 justify-center text-xs text-slate-400">
          <Sparkles size={14} className="text-indigo-500 animate-pulse" />
          <span>Đang chuyển sang bài Test đầu vào…</span>
        </div>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────
  return (
    <div
      id="step-needs"
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 max-w-xl mx-auto"
    >
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Sparkles size={12} />
            AI Sales Funnel · Bước 1/4
          </span>
        </div>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 leading-snug">
          Hãy cho ZIM biết mục tiêu của bạn! 🎯
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Chỉ 4 câu ngắn — AI của ZIM sẽ lập lộ trình học riêng cho bạn trong 2 phút.
        </p>
      </div>

      <ProgressBar current={filledCount} total={4} />

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Q1 – Mục tiêu */}
        <div>
          <SectionTitle
            step={1}
            title="Bạn muốn học chứng chỉ nào?"
            desc="Chọn 1 mục tiêu phù hợp nhất với bạn"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {GOALS.map((g) => {
              const Icon = g.icon;
              const isActive = form.goal === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setForm({ ...form, goal: g.id })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all duration-150 cursor-pointer
                    ${isActive
                      ? `${g.color} ${g.activeColor} shadow-sm`
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center
                      ${isActive ? 'bg-white shadow-sm' : 'bg-slate-100'}`}
                  >
                    <Icon
                      size={22}
                      className={isActive ? g.iconColor : 'text-slate-400'}
                    />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isActive ? 'text-slate-800' : 'text-slate-700'}`}>
                      {g.label}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{g.sub}</p>
                  </div>
                  {isActive && (
                    <CheckCircle2 size={16} className={g.iconColor} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Q2 – Lý do học */}
        <div>
          <SectionTitle
            step={2}
            title="Lý do chính bạn muốn học tiếng Anh?"
            desc="Giúp AI chọn nội dung và phương pháp phù hợp nhất"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {REASONS.map((r) => {
              const Icon = r.icon;
              const isActive = form.reason === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setForm({ ...form, reason: r.id })}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-xs font-medium transition-all duration-150
                    ${isActive
                      ? 'border-red-600 bg-red-50 text-red-800 ring-2 ring-red-500/30'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                >
                  <Icon size={14} className={isActive ? 'text-red-700 flex-shrink-0' : 'text-slate-400 flex-shrink-0'} />
                  <span className="leading-tight">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Q3 – Rào cản thời gian */}
        <div>
          <SectionTitle
            step={3}
            title="Thời gian bạn có thể dành mỗi ngày?"
            desc="ZIM có lịch học linh hoạt phù hợp với lịch bận rộn của bạn"
          />
          <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-500">
            <Clock size={13} className="text-amber-500 flex-shrink-0" />
            Chúng tôi sẽ thiết kế lịch học xung quanh cuộc sống của bạn
          </div>
          <div className="space-y-2">
            {TIME_BARRIERS.map((t) => (
              <RadioPill
                key={t.id}
                selected={form.timeBarrier === t.id}
                onClick={() => setForm({ ...form, timeBarrier: t.id })}
                label={t.label}
              />
            ))}
          </div>
        </div>

        {/* Q4 – Ngân sách */}
        <div>
          <SectionTitle
            step={4}
            title="Ngân sách học phí bạn đang cân nhắc?"
            desc="ZIM có nhiều gói học phù hợp với mọi điều kiện"
          />
          <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-500">
            <DollarSign size={13} className="text-emerald-500 flex-shrink-0" />
            Thông tin hoàn toàn bảo mật — chỉ dùng để tư vấn gói học phù hợp
          </div>
          <div className="space-y-2">
            {BUDGET_BARRIERS.map((b) => (
              <RadioPill
                key={b.id}
                selected={form.budgetBarrier === b.id}
                onClick={() => setForm({ ...form, budgetBarrier: b.id })}
                label={b.label}
              />
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={!isComplete}
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200
              ${isComplete
                ? 'bg-red-700 hover:bg-red-800 text-white shadow-md hover:shadow-lg active:scale-[0.98]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
          >
            {isComplete ? (
              <>
                <Sparkles size={16} className="animate-pulse" />
                Xem kết quả phân tích & Làm bài Test ngay
                <ArrowRight size={16} />
              </>
            ) : (
              <>Trả lời {4 - filledCount} câu còn lại để tiếp tục</>
            )}
          </button>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={11} className="text-emerald-500" />
              Miễn phí 100%
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={11} className="text-emerald-500" />
              Không spam
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={11} className="text-emerald-500" />
              Kết quả trong 2 phút
            </span>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StepNeedsView;
