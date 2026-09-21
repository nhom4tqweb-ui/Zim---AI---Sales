import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { createOrder, getOrder, confirmPayment } from '../api/ordersApi'
import { formatVnd } from '../data/zimData'
import { PATHS } from '../../../routes/paths'

// ============================================================================
// DỮ LIỆU PROFILE GIẢNG VIÊN & HỌC VIÊN BAND CAO
// ============================================================================
const lecturersData = [
  {
    id: 'lec-1',
    name: 'ThS. Đặng Vũ Hải',
    role: 'Head of Academic · ZIM Academy',
    badge: 'IELTS 8.5 (Listening 9.0, Reading 9.0)',
    experience: '9+ năm kinh nghiệm luyện thi chuyên sâu',
    avatar: '/teachers/teacher_hai.jpg',
    bio: 'Thạc sĩ Ngôn ngữ học Ứng dụng (University of Melbourne). Cố vấn học thuật cho hơn 4.200 học viên đạt target 7.0 - 8.5+.',
    skills: ['Writing Task 2 Band 8.5', 'Phương pháp Tư duy Tuyến tính Linear Thinking', 'Sửa bài 1-1 qua AI'],
  },
  {
    id: 'lec-2',
    name: 'Cô Hoàng Minh Thư',
    role: 'Lead IELTS Trainer',
    badge: 'IELTS 8.5 Overall · Cựu Trợ giảng ĐH Ngoại Thương',
    experience: '7+ năm đào tạo Speaking & Writing',
    avatar: '/teachers/teacher_thu.jpg',
    bio: 'Chứng chỉ TESOL Quốc tế loại Xuất sắc. Chuyên gia gỡ rối phát âm và nâng band Speaking thần tốc từ 5.5 lên 7.5+.',
    skills: ['Speaking Phản xạ Tự nhiên', 'Accent Chuẩn Quốc tế', 'Tâm lý phòng thi'],
  },
  {
    id: 'lec-3',
    name: 'Thầy Nguyễn Quang Huy',
    role: 'Senior IELTS & TOEIC Specialist',
    badge: 'IELTS 8.5 · TOEIC 990/990',
    experience: '8+ năm giảng dạy & Biên soạn giáo trình ZIM',
    avatar: '/teachers/teacher_huy.jpg',
    bio: 'Tác giả sách "Giải Mã Từ Vựng Học Thuật Academic Collocations". Chuyên gia chẩn đoán và lấp lỗ hổng ngữ pháp logic.',
    skills: ['Reading Skimming/Scanning đỉnh cao', 'Listening bẫy âm', 'TOEIC 900+ thần tốc'],
  },
]

const topStudentsData = [
  {
    id: 'stu-1',
    name: 'Trần Bảo Ngọc',
    school: 'ĐH Kinh Tế Quốc Dân (NEU)',
    target: 'Mục tiêu: 6.5 ➔ Đạt được: 8.0 IELTS',
    avatar: '/students/student_ngoc.jpg',
    scoreDetails: 'L: 8.5 | R: 8.5 | W: 7.5 | S: 7.5',
    achievement: 'Giành Học bổng Toàn phần Erasmus Mundus 2026',
    review:
      'Lộ trình AI chẩn đoán đúng ngay điểm yếu phân tích đề Writing của em. Chỉ sau 2 tháng học cùng trợ lý AI và thầy Hải, em bứt phá từ 6.0 lên 8.0!',
  },
  {
    id: 'stu-2',
    name: 'Lê Hoàng Nam',
    school: 'ĐH Bách Khoa Hà Nội',
    target: 'Mục tiêu: 7.0 ➔ Đạt được: 8.5 IELTS',
    avatar: '/students/student_nam.jpg',
    scoreDetails: 'L: 9.0 | R: 9.0 | W: 8.0 | S: 7.5',
    achievement: 'Đạt IELTS 8.5 chỉ sau 1 lần thi duy nhất',
    review:
      'Học với ZIM không cần học vẹt từ vựng. Hệ thống Linear Thinking và AI gợi ý bài tập theo thời gian thực giúp em tiết kiệm đến 70% thời gian ôn luyện.',
  },
  {
    id: 'stu-3',
    name: 'Nguyễn Thùy Linh',
    school: 'ĐH Ngoại Thương TP.HCM',
    target: 'Mục tiêu: 6.5 ➔ Đạt được: 7.5 IELTS',
    avatar: '/students/student_linh.jpg',
    scoreDetails: 'L: 8.0 | R: 8.0 | W: 7.0 | S: 7.0',
    achievement: 'Được tuyển thẳng vào công ty đa quốc gia Big4',
    review:
      'Em từng mất gốc tiếng Anh và sợ nói kinh khủng. Nhờ cô Thư và AI chấm phát âm chi tiết từng từ, em đã tự tin đạt 7.0 Speaking.',
  },
]

// ============================================================================
// 1. COMPONENT HEADER CHUẨN RESPONSIVE TRÊN DI ĐỘNG
// ============================================================================
export function ResponsiveHeader({ onGoToStep }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleNavClick = (stepNum, targetId) => {
    setIsMobileMenuOpen(false)
    if (stepNum && onGoToStep) {
      onGoToStep(stepNum)
      document.getElementById('sales-funnel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (targetId) {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-40 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <a
          href="#hero-section"
          onClick={(e) => {
            e.preventDefault()
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="flex items-center gap-3.5 group"
        >
          <div className="w-11 h-11 bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md shadow-rose-200 group-hover:scale-105 transition-transform border border-white/20">
            Z
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl text-slate-900 tracking-tight leading-none">
              ZIM{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-rose-700">
                ACADEMY
              </span>
            </span>
            <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mt-1">
              EdTech & AI Personalization
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-bold text-slate-600">
          <a
            href="#banner-profiles"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('banner-profiles')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="hover:text-rose-600 transition-colors"
          >
            Giảng viên & Học viên
          </a>
          <button onClick={() => handleNavClick(1)} className="hover:text-rose-600 transition-colors cursor-pointer">
            1. Khảo sát
          </button>
          <button onClick={() => handleNavClick(2)} className="hover:text-rose-600 transition-colors cursor-pointer">
            2. Micro Test
          </button>
          <button onClick={() => handleNavClick(3)} className="hover:text-rose-600 transition-colors cursor-pointer">
            3. Lộ trình
          </button>
          <button onClick={() => handleNavClick(4)} className="hover:text-rose-600 transition-colors cursor-pointer">
            4. Học phí
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <span>AI Consultant 4.0</span>
          </div>
        </nav>

        {/* Action Button & Hamburger Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavClick(1)}
            className="hidden sm:inline-flex btn-shimmer bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white text-xs sm:text-sm font-extrabold py-3 px-5 rounded-2xl shadow-lg shadow-rose-200 hover:shadow-xl transition-all transform hover:-translate-y-0.5 border border-rose-500/30 cursor-pointer"
          >
            Tư vấn lộ trình AI
          </button>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation"
            className="lg:hidden p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 shadow-xl px-4 pt-3 pb-6 space-y-3 animate-fade-up">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh mục điều hướng</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Trợ lý AI sẵn sàng
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 pt-1 font-bold text-slate-700 text-sm">
            <button
              onClick={() => handleNavClick(null, 'banner-profiles')}
              className="text-left py-2.5 px-3 rounded-xl hover:bg-slate-50 flex items-center justify-between"
            >
              <span>Giảng viên & Học viên tiêu biểu</span>
              <span className="text-xs text-rose-600">8.5+</span>
            </button>
            <button
              onClick={() => handleNavClick(1)}
              className="text-left py-2.5 px-3 rounded-xl hover:bg-slate-50 flex items-center justify-between"
            >
              <span>Bước 1: Khảo sát mục tiêu học tập</span>
              <span className="text-xs text-slate-400">→</span>
            </button>
            <button
              onClick={() => handleNavClick(2)}
              className="text-left py-2.5 px-3 rounded-xl hover:bg-slate-50 flex items-center justify-between"
            >
              <span>Bước 2: Thi thử Micro Test 5 phút</span>
              <span className="text-xs text-indigo-600 font-bold">Miễn phí</span>
            </button>
            <button
              onClick={() => handleNavClick(3)}
              className="text-left py-2.5 px-3 rounded-xl hover:bg-slate-50 flex items-center justify-between"
            >
              <span>Bước 3: Xem lộ trình cá nhân hóa</span>
              <span className="text-xs text-slate-400">→</span>
            </button>
            <button
              onClick={() => handleNavClick(4)}
              className="text-left py-2.5 px-3 rounded-xl hover:bg-slate-50 flex items-center justify-between"
            >
              <span>Bước 4: Bảng học phí & Ưu đãi hôm nay</span>
              <span className="text-xs text-rose-600 font-bold">Hot</span>
            </button>
          </div>
          <button
            onClick={() => handleNavClick(1)}
            className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-extrabold rounded-xl text-center shadow-md shadow-rose-200 mt-3"
          >
            Bắt đầu nhận lộ trình AI ngay
          </button>
        </div>
      )}
    </header>
  )
}

// ============================================================================
// 2. KHỐI BANNER TRANG CHỦ (PROFILE GIẢNG VIÊN & HỌC VIÊN BAND CAO)
// ============================================================================
export function HomeBannerProfiles({ onGoToStep }) {
  const [activeTab, setActiveTab] = useState('lecturers') // 'lecturers' | 'students'

  return (
    <section
      id="banner-profiles"
      className="w-full bg-gradient-to-b from-white via-slate-50/70 to-white border border-slate-200/90 rounded-[2.5rem] p-6 sm:p-10 md:p-12 shadow-xl space-y-10 relative overflow-hidden"
    >
      {/* Decorative background glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header of Section */}
      <div className="text-center max-w-3xl mx-auto space-y-3 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black tracking-wide uppercase shadow-xs">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
          <span>Bảo Chứng Chất Lượng Đào Tạo ZIM</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          Học Cùng Giảng Viên Tinh Hoa · Bứt Phá Band Điểm Cùng Học Viên Xuất Sắc
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Đội ngũ 100% giảng viên sở hữu chứng chỉ IELTS 8.0 - 8.5+ kết hợp cùng trợ lý ZIM AI đồng hành giúp hơn
          30.000 học viên đạt chuẩn đầu ra cam kết.
        </p>

        {/* Tab Switcher */}
        <div className="pt-4 flex items-center justify-center">
          <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner max-w-full">
            <button
              onClick={() => setActiveTab('lecturers')}
              className={`py-2.5 px-5 sm:px-7 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 ${
                activeTab === 'lecturers'
                  ? 'bg-white text-rose-600 shadow-md border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                />
              </svg>
              <span>Giảng Viên Chuyên Môn (8.5+)</span>
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`py-2.5 px-5 sm:px-7 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 ${
                activeTab === 'students'
                  ? 'bg-white text-rose-600 shadow-md border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
              <span>Bảng Vàng Học Viên (7.5 - 8.5)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: GIẢNG VIÊN */}
      {activeTab === 'lecturers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative z-10 animate-fade-up">
          {lecturersData.map((lec) => (
            <div
              key={lec.id}
              className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={lec.avatar}
                      alt={lec.name}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-rose-500/20 shadow-md group-hover:border-rose-600 transition"
                    />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                      ✓
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-rose-600 transition-colors">
                      {lec.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">{lec.role}</p>
                    <p className="text-[11px] text-rose-700 font-bold mt-1 bg-rose-50 px-2 py-0.5 rounded-md inline-block border border-rose-100">
                      {lec.badge}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                  <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="text-amber-500">★</span> {lec.experience}
                  </p>
                  <p className="line-clamp-3 text-slate-500 leading-relaxed italic">"{lec.bio}"</p>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Thế mạnh đào tạo:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {lec.skills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100">
                <button
                  onClick={() => onGoToStep && onGoToStep(1)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-bold text-xs rounded-xl transition text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Nhận tư vấn cùng giảng viên</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: HỌC VIÊN BAND CAO */}
      {activeTab === 'students' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative z-10 animate-fade-up">
          {topStudentsData.map((stu) => (
            <div
              key={stu.id}
              className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={stu.avatar}
                      alt={stu.name}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-indigo-500/20 shadow-md group-hover:border-indigo-600 transition"
                    />
                    <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                      TOP
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">{stu.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{stu.school}</p>
                    <span className="inline-block mt-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {stu.target}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/70 text-xs font-mono font-bold text-indigo-700 text-center">
                  {stu.scoreDetails}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                    <span>🏆</span>
                    <span>{stu.achievement}</span>
                  </div>
                  <p className="text-xs text-slate-600 italic bg-amber-50/40 p-3 rounded-xl border border-amber-100/60 leading-relaxed">
                    "{stu.review}"
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100">
                <button
                  onClick={() => onGoToStep && onGoToStep(2)}
                  className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 font-bold text-xs rounded-xl transition text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Làm test để đạt target như bạn ấy</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trust banner statistics bar */}
      <div className="relative z-10 pt-6 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-3 bg-white/70 rounded-2xl border border-slate-200/60">
          <span className="block text-2xl sm:text-3xl font-black text-rose-600">100%</span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Giảng viên 8.0 - 8.5+
          </span>
        </div>
        <div className="p-3 bg-white/70 rounded-2xl border border-slate-200/60">
          <span className="block text-2xl sm:text-3xl font-black text-slate-900">30.000+</span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Học viên vượt Target
          </span>
        </div>
        <div className="p-3 bg-white/70 rounded-2xl border border-slate-200/60">
          <span className="block text-2xl sm:text-3xl font-black text-emerald-600">98.4%</span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tỷ lệ đỗ ngay lần đầu</span>
        </div>
        <div className="p-3 bg-white/70 rounded-2xl border border-slate-200/60">
          <span className="block text-2xl sm:text-3xl font-black text-indigo-600">Cam kết</span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bằng văn bản pháp lý</span>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// 3. COMPONENT FOOTER CHUẨN RESPONSIVE ĐẦY ĐỦ
// ============================================================================
export function ResponsiveFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300 mt-20 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-600 to-rose-800 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md">
                Z
              </div>
              <span className="font-black text-xl text-white tracking-tight">
                ZIM <span className="text-rose-500">ACADEMY</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hệ thống giáo dục & luyện thi chứng chỉ Anh ngữ hàng đầu áp dụng AI cá nhân hóa và phương pháp Tư duy
              Tuyến tính Linear Thinking độc quyền.
            </p>
            <div className="text-xs space-y-1 text-slate-400">
              <p>
                <strong className="text-slate-200">Hotline tư vấn 24/7:</strong> 1900 6868
              </p>
              <p>
                <strong className="text-slate-200">Email:</strong> cskh@zim.vn
              </p>
            </div>
          </div>

          {/* Hệ thống cơ sở */}
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Hệ Thống Cơ Sở</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <strong className="text-slate-300">Hà Nội:</strong> 65 Yên Lãng, Đống Đa | 16 Trần Phú, Hà Đông | 308
                Cầu Giấy
              </li>
              <li>
                <strong className="text-slate-300">TP. Hồ Chí Minh:</strong> 308 Trần Phú, Q.5 | 12 Khuất Duy Tiến, Tân
                Bình | 133 Nguyễn Thị Thập, Q.7
              </li>
              <li>
                <strong className="text-slate-300">Đà Nẵng:</strong> 163 Nguyễn Văn Linh, Hải Châu
              </li>
            </ul>
          </div>

          {/* Các khóa học trọng tâm */}
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Chương Trình Đào Tạo</h4>
            <ul className="space-y-2 text-slate-400">
              <li>• Luyện thi IELTS Foundation (3.5 - 5.0)</li>
              <li>• Khóa IELTS Bứt Phá Mục Tiêu (5.5 - 6.5)</li>
              <li>• Khóa IELTS Master Cao Cấp (7.0 - 8.5+)</li>
              <li>• Luyện thi TOEIC 4 Kỹ năng Cấp Tốc</li>
              <li>• Trợ lý ZIM AI Chấm chữa bài Writing & Speaking 24/7</li>
            </ul>
          </div>

          {/* Chính sách cam kết */}
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Cam Kết & Pháp Lý</h4>
            <div className="space-y-2 text-slate-400">
              <p className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Cam kết đầu ra bằng hợp đồng đào tạo
              </p>
              <p className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Miễn phí 100% học lại nếu không đạt target
              </p>
              <p className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Bảo lưu linh hoạt không giới hạn lý do
              </p>
              <div className="pt-2 flex items-center gap-2">
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-slate-300 rounded text-[10px] font-bold">
                  Đã thông báo Bộ Công Thương
                </span>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-slate-300 rounded text-[10px] font-bold">
                  ISO 9001:2015
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 ZIM Academy. Bản quyền học thuật và công nghệ trí tuệ nhân tạo được bảo hộ.</p>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-slate-300 transition">
              Chính sách bảo mật
            </a>
            <a href="#terms" className="hover:text-slate-300 transition">
              Điều khoản dịch vụ
            </a>
            <a href="#help" className="hover:text-slate-300 transition">
              Trung tâm trợ giúp
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ============================================================================
// 4. MODAL THANH TOÁN (STEP 5) VỚI ĐẾM NGƯỢC KHAN HIẾM, VIETQR ĐỘNG & POLLING
// ============================================================================
const VIETQR_BANK_NAME = 'VPBank (Ngân hàng TMCP Việt Nam Thịnh Vượng)'
const VIETQR_BANK_BIN = '970432'
const VIETQR_BANK_ACCOUNT = '0383228001'
const VIETQR_ACCOUNT_NAME = 'VU NGOC HIEU'
const PHONE_REGEX = /^(0|\+84)[0-9]{9,10}$/



export function PaymentStep5Modal({ pkg, onClose }) {
  const navigate = useNavigate()
  const open = Boolean(pkg)

  // Countdown khan hiếm (10 phút = 600 giây)
  const [timeLeft, setTimeLeft] = useState(600)
  const [modalStep, setModalStep] = useState('form') // 'form' | 'qr_loading' | 'success'
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [order, setOrder] = useState(null)
  const [dynamicQrUrl, setDynamicQrUrl] = useState('')
  const [copiedKey, setCopiedKey] = useState(null)

  // Polling ref & simulation loading
  const pollingTimerRef = useRef(null)
  const [isSimulating, setIsSimulating] = useState(false)

  // Countdown timer effect
  useEffect(() => {
    if (!open) return
    setTimeLeft(600)
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [open, pkg])

  // Reset khi đổi package
  useEffect(() => {
    if (!pkg) return
    setModalStep('form')
    setName('')
    setPhone('')
    setEmail('')
    setPhoneError('')
    setSubmitError('')
    setOrder(null)
    setDynamicQrUrl('')
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)
  }, [pkg])

  // Clean polling khi unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)
    }
  }, [])

  // Đóng bằng phím Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!pkg) return null

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const seconds = String(timeLeft % 60).padStart(2, '0')
  const isUrgent = timeLeft < 180 && timeLeft > 0
  const isExpired = timeLeft === 0

  // -------------------------------------------------------------
  // Xử lý nộp form tạo order từ Backend & sinh URL VietQR động
  // -------------------------------------------------------------
  async function handleCreateOrder(e) {
    e.preventDefault()
    if (!PHONE_REGEX.test(phone)) {
      setPhoneError('Vui lòng nhập số điện thoại hợp lệ (10 số).')
      return
    }
    setPhoneError('')
    setSubmitError('')
    setSubmitting(true)

    try {
      let createdOrder = null
      try {
        createdOrder = await createOrder({
          packageId: pkg.id,
          packageName: pkg.name,
          price: pkg.price,
          originalPrice: pkg.originalPrice,
          customerName: name,
          customerPhone: phone,
          customerEmail: email || undefined,
        })
      } catch (apiErr) {
        console.warn('API createOrder offline/failed, fallback to client-side order:', apiErr)
        const fallbackCode = 'ZIM' + Math.floor(1000 + Math.random() * 9000)
        createdOrder = {
          orderCode: fallbackCode,
          packageId: pkg.id,
          packageName: pkg.name,
          price: pkg.price,
          originalPrice: pkg.originalPrice,
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          status: 'pending',
        }
      }

      setOrder(createdOrder)

      // Xử lý ghép nối URL động của VietQR (img.vietqr.io) về VPBank - STK: 0383228001
      const transferContent = `${createdOrder.orderCode} ${phone}`
      const params = new URLSearchParams({
        amount: String(createdOrder.price),
        addInfo: transferContent,
        accountName: VIETQR_ACCOUNT_NAME,
      })
      const qrUrl =
        createdOrder.qrUrl && createdOrder.qrUrl.includes('0383228001')
          ? createdOrder.qrUrl
          : `https://img.vietqr.io/image/${VIETQR_BANK_BIN}-${VIETQR_BANK_ACCOUNT}-compact2.jpg?${params.toString()}`

      setDynamicQrUrl(qrUrl)
      setModalStep('qr_loading')

      // Khởi động Polling tự động kiểm tra trạng thái đơn hàng mỗi 2.5s
      startPolling(createdOrder.orderCode)
    } catch (err) {
      console.error(err)
      setSubmitError('Không thể tạo mã thanh toán, vui lòng kiểm tra kết nối và thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  // -------------------------------------------------------------
  // Cơ chế Polling (cứ 2.5 giây gọi nhẹ API kiểm tra trạng thái)
  // -------------------------------------------------------------
  function startPolling(orderCode) {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)

    pollingTimerRef.current = setInterval(async () => {
      try {
        const orderData = await getOrder(orderCode)
        if (orderData && orderData.status === 'paid') {
          // Khi trạng thái đổi thành "Đã thanh toán"
          clearInterval(pollingTimerRef.current)
          setModalStep('success')

          // Tự động chuyển hướng sang Landing Page chào mừng thành công sau 1.2s để tạo cảm giác mượt mà
          setTimeout(() => {
            onClose()
            navigate(`${PATHS.WELCOME}?orderCode=${orderCode}&name=${encodeURIComponent(name)}&pkg=${encodeURIComponent(pkg.name)}`)
          }, 1200)
        }
      } catch (err) {
        console.warn('Polling check error:', err)
      }
    }, 2500)
  }

  // -------------------------------------------------------------
  // Mô phỏng thanh toán thành công (hỗ trợ kiểm thử trực tiếp)
  // -------------------------------------------------------------
  async function handleSimulatePayment() {
    if (!order) return
    setIsSimulating(true)
    try {
      await confirmPayment(order.orderCode)
      // Sau khi gọi API confirm thành công, lượt polling tiếp theo hoặc gọi trực tiếp sẽ redirect
      setModalStep('success')
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)
      setTimeout(() => {
        onClose()
        navigate(
          `${PATHS.WELCOME}?orderCode=${order.orderCode}&name=${encodeURIComponent(name || order.customerName)}&pkg=${encodeURIComponent(pkg.name)}&amount=${pkg.price}`
        )
      }, 1000)
    } catch (err) {
      console.error('Lỗi khi xác nhận mô phỏng:', err)
      // Fallback redirect nếu BE offline
      setModalStep('success')
      setTimeout(() => {
        onClose()
        navigate(
          `${PATHS.WELCOME}?orderCode=${order.orderCode}&name=${encodeURIComponent(name || 'Học viên')}&pkg=${encodeURIComponent(pkg.name)}`
        )
      }, 1000)
    } finally {
      setIsSimulating(false)
    }
  }

  // Helper sao chép clipboard
  function copyToClipboard(text, key) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    }
  }

  return (
    <div
      className={`fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto ${
        open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      } transition-all duration-300`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative my-auto max-h-[95vh] overflow-y-auto border border-slate-100">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/25 hover:bg-black/40 w-8 h-8 rounded-full flex items-center justify-center text-sm z-20 transition"
        >
          ✕
        </button>

        {/* Khối Header Modal với đồng hồ đếm ngược khan hiếm */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-rose-900 text-white p-6 text-center space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border border-white/20 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Bước 5 · Hoàn tất giữ suất ưu đãi
            </span>
          </div>

          <h3 className="text-xl font-black">{pkg.name}</h3>

          <p className="text-xs text-rose-100">
            🔥 Chỉ còn <span className="font-extrabold text-amber-300">3 suất học bổng</span> giữ giá ưu đãi trước khi
            đồng hồ hết giờ:
          </p>

          {/* Đồng hồ đếm ngược */}
          <div
            className={`flex items-center justify-center gap-2 pt-1 font-mono ${
              isUrgent ? 'text-amber-300 scale-105 transition-transform' : 'text-white'
            }`}
          >
            <div className="bg-black/35 px-3 py-1.5 rounded-xl text-center min-w-[56px] border border-white/10 shadow-inner">
              <span className="block text-2xl font-black">{minutes}</span>
              <span className="text-[9px] uppercase tracking-wider text-rose-200 font-bold">Phút</span>
            </div>
            <span className="text-xl font-bold animate-pulse">:</span>
            <div className="bg-black/35 px-3 py-1.5 rounded-xl text-center min-w-[56px] border border-white/10 shadow-inner">
              <span className="block text-2xl font-black">{seconds}</span>
              <span className="text-[9px] uppercase tracking-wider text-rose-200 font-bold">Giây</span>
            </div>
          </div>
        </div>

        {/* Nội dung bên trong Modal */}
        <div className="p-5 sm:p-7 space-y-5">
          {/* Trạng thái hết giờ */}
          {isExpired && (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl">
                ⚠️
              </div>
              <h4 className="text-base font-bold text-slate-900">Đã hết thời gian giữ suất ưu đãi</h4>
              <p className="text-xs text-slate-500">
                Suất học bổng của bạn đã được nhường cho học viên trong danh sách chờ. Vui lòng làm mới để kiểm tra lại
                bảng giá.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="py-2.5 px-6 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                Làm mới trang
              </button>
            </div>
          )}

          {/* Màn hình FORM đăng ký */}
          {!isExpired && modalStep === 'form' && (
            <div className="space-y-4 animate-fade-up">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Học phí niêm yết:</span>
                  <span className="line-through">{formatVnd(pkg.originalPrice)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm">
                  <span className="text-slate-800">Học phí giữ chỗ hôm nay:</span>
                  <span className="text-rose-600 text-base font-black">{formatVnd(pkg.price)}</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold pt-1 border-t border-slate-200/60">
                  ✓ Bao gồm toàn bộ tài khoản AI, giáo trình và bảo đảm đầu ra bằng hợp đồng.
                </p>
              </div>

              <form onSubmit={handleCreateOrder} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và tên học viên <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:bg-white focus:border-rose-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại nhận mã kích hoạt <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0987654321"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:bg-white focus:border-rose-500 outline-none transition"
                  />
                  {phoneError && <p className="text-[11px] text-rose-600 mt-1">{phoneError}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email nhận bài test & tài liệu học tập
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="an.nguyen@gmail.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:bg-white focus:border-rose-500 outline-none transition"
                  />
                </div>

                {submitError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-shimmer w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-black rounded-2xl text-xs sm:text-sm shadow-lg shadow-rose-200 transition mt-2 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Đang khởi tạo mã đơn hàng...</span>
                    </>
                  ) : (
                    <span>Tạo Mã VietQR & Giữ Chỗ Ưu Đãi ➔</span>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                  <span>🔒</span>
                  <span>Bảo mật 100% · Nhận orderCode chính xác từ hệ thống ZIM</span>
                </p>
              </form>
            </div>
          )}

          {/* Màn hình QR VÀ LOADING "Đang chờ xác nhận thanh toán..." */}
          {!isExpired && modalStep === 'qr_loading' && order && (
            <div className="space-y-4 animate-fade-up text-center">
              {/* Màn hình Loading trạng thái */}
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-3.5 flex items-center justify-center gap-3">
                <div className="relative flex items-center justify-center">
                  <span className="w-3 h-3 bg-indigo-600 rounded-full animate-ping absolute"></span>
                  <span className="w-2.5 h-2.5 bg-indigo-700 rounded-full"></span>
                </div>
                <div className="text-left">
                  <span className="block text-xs font-black text-indigo-950">
                    Đang chờ xác nhận thanh toán...
                  </span>
                  <span className="text-[11px] text-indigo-700">
                    Hệ thống tự động lắng nghe giao dịch (polling mỗi 2-3 giây).
                  </span>
                </div>
              </div>

              {/* Khối hiển thị ảnh VietQR */}
              <div className="relative inline-block p-3 rounded-2xl border-2 border-dashed border-rose-500 bg-white shadow-md group">
                <img
                  src={dynamicQrUrl}
                  alt={`VietQR ${order.orderCode}`}
                  className="w-52 h-52 sm:w-56 sm:h-56 mx-auto object-contain rounded-lg"
                />
                <div className="mt-2 text-[11px] font-bold text-slate-500 flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Quét bằng ứng dụng của bất kỳ Ngân hàng nào</span>
                </div>
              </div>

              {/* Thông tin chuyển khoản sao chép nhanh */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-left space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Ngân hàng:</span>
                  <span className="font-bold text-slate-800">{VIETQR_BANK_NAME}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Chủ tài khoản:</span>
                  <div className="flex items-center gap-2 font-bold text-slate-900 uppercase">
                    <span>{VIETQR_ACCOUNT_NAME}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(VIETQR_ACCOUNT_NAME, 'name')}
                      className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-[10px] cursor-pointer"
                    >
                      {copiedKey === 'name' ? '✓ Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Số tài khoản:</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-slate-900">
                    <span>{VIETQR_BANK_ACCOUNT}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(VIETQR_BANK_ACCOUNT, 'acc')}
                      className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-[10px] cursor-pointer"
                    >
                      {copiedKey === 'acc' ? '✓ Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Mã đơn hàng:</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-indigo-700">
                    <span>{order.orderCode}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(order.orderCode, 'code')}
                      className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-[10px] cursor-pointer"
                    >
                      {copiedKey === 'code' ? '✓ Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Số tiền chính xác:</span>
                  <div className="flex items-center gap-2 font-bold text-rose-600">
                    <span>{formatVnd(order.price)}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(String(order.price), 'price')}
                      className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-[10px] text-slate-700 cursor-pointer"
                    >
                      {copiedKey === 'price' ? '✓ Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 font-medium block">Nội dung chuyển khoản:</span>
                    <span className="text-[10px] text-slate-400 italic">(orderCode + SĐT nhận từ BE)</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">
                    <span>{`${order.orderCode} ${phone}`}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`${order.orderCode} ${phone}`, 'content')}
                      className="px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold cursor-pointer"
                    >
                      {copiedKey === 'content' ? '✓ Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Nút sao chép link thanh toán gửi cho người khác */}
              <button
                type="button"
                onClick={() => {
                  const shareUrl = `${window.location.origin}${PATHS.CHECKOUT}?orderCode=${order.orderCode}&pkg=${encodeURIComponent(pkg.name)}&amount=${order.price}&name=${encodeURIComponent(name)}&phone=${phone}`
                  copyToClipboard(shareUrl, 'share_link')
                }}
                className="w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-2xl text-xs border border-indigo-200 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span className="text-base">🔗</span>
                <span>
                  {copiedKey === 'share_link'
                    ? '✓ Đã sao chép link thanh toán! Hãy dán gửi qua Zalo / Messenger'
                    : 'Sao chép link thanh toán gửi cho người khác'}
                </span>
              </button>

              {/* Nút mô phỏng thanh toán trực tiếp để kiểm thử luồng chuyển trang */}
              <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isSimulating}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSimulating ? (
                    'Đang xử lý...'
                  ) : (
                    <>
                      <span>⚡ Mô Phỏng Thanh Toán Thành Công (Test)</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setModalStep('form')}
                  className="py-3 px-4 border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-xl text-slate-600 transition cursor-pointer"
                >
                  ← Sửa thông tin
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                💡 Ngay sau khi ngân hàng báo chuyển tiền thành công, trang web sẽ tự động chuyển hướng sang trang Chào
                mừng.
              </p>
            </div>
          )}

          {/* Màn hình SUCCESS tạm trước khi redirect */}
          {modalStep === 'success' && (
            <div className="text-center py-8 space-y-4 animate-fade-up">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl animate-bounce">
                ✓
              </div>
              <h4 className="text-lg font-black text-slate-900">Xác Nhận Thanh Toán Thành Công!</h4>
              <p className="text-xs text-slate-500">
                Đang tự động chuyển hướng bạn sang Landing Page Chào Mừng Học Viên...
              </p>
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 5. LANDING PAGE RIÊNG CHÀO MỪNG HỌC VIÊN SAU THANH TOÁN (WELCOME SUCCESS PAGE)
// ============================================================================
export function WelcomeSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderCode = searchParams.get('orderCode') || 'ZIM-VIP2026'
  const studentName = searchParams.get('name') || 'Học viên ZIM'
  const packageName = searchParams.get('pkg') || 'Khóa Học IELTS Chuyên Sâu'

  const [orderDetail, setOrderDetail] = useState(null)
  const [loading, setLoading] = useState(Boolean(orderCode))

  useEffect(() => {
    window.scrollTo(0, 0)
    if (orderCode) {
      getOrder(orderCode)
        .then((res) => {
          setOrderDetail(res)
        })
        .catch(() => {
          // ignore or fallback
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [orderCode])


  return (
    <div className="min-h-screen bg-slate-50 bg-mesh-pattern text-slate-800 antialiased flex flex-col justify-between selection:bg-rose-100 selection:text-rose-600 relative">
      <ResponsiveHeader />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 space-y-10">
        {/* Banner chúc mừng thành công */}
        <div className="bg-white border border-slate-200/90 rounded-[2.5rem] p-6 sm:p-12 shadow-xl text-center space-y-6 relative overflow-hidden">
          {/* Confetti & Glow decoration */}
          <div className="absolute -top-10 -right-10 w-60 h-60 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />

          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-200 text-4xl sm:text-5xl animate-bounce">
            🎉
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 py-1 px-4 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Giao Dịch Đã Xác Nhận Thành Công
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Chào Mừng <span className="text-rose-600">{decodeURIComponent(studentName)}</span> Gia Nhập ZIM Academy!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              Hệ thống đã nhận được học phí và tự động kích hoạt mã học viên cho bạn. Dưới đây là biên lai xác nhận và
              các bước để bạn bắt đầu lộ trình học ngay.
            </p>
          </div>

          {/* Thẻ thông tin đơn hàng */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 text-left max-w-lg mx-auto space-y-3 text-xs sm:text-sm shadow-inner">
            {loading && (
              <div className="text-center text-xs text-indigo-600 font-semibold py-1 flex items-center justify-center gap-2 bg-indigo-50/70 rounded-xl">
                <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                <span>Đang đồng bộ dữ liệu xác nhận giao dịch...</span>
              </div>
            )}
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Mã đơn hàng:</span>
              <span className="font-mono font-black text-indigo-700 text-sm sm:text-base">{orderCode}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Khóa học đăng ký:</span>
              <span className="font-bold text-slate-900 text-right">
                {orderDetail?.packageName || decodeURIComponent(packageName)}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Trạng thái thanh toán:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs">
                ✓ Đã thanh toán (Hoàn tất)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Học phí:</span>
              <span className="font-black text-rose-600 text-sm sm:text-base">
                {orderDetail ? formatVnd(orderDetail.price) : 'Đã xác nhận'}
              </span>
            </div>
          </div>

          {/* Hướng dẫn 3 bước bắt đầu học ngay */}
          <div className="pt-6 border-t border-slate-200 text-left space-y-4">
            <h3 className="text-base sm:text-lg font-black text-slate-900 text-center">
              3 Bước Để Bắt Đầu Lộ Trình Học Ngay Hôm Nay
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 font-black text-sm flex items-center justify-center">
                  1
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">Kích Hoạt ZIM AI</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Thông tin đăng nhập tài khoản ZIM AI đã gửi về SMS/Email của bạn. Đăng nhập để làm test chi tiết.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 font-black text-sm flex items-center justify-center">
                  2
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">Vào Nhóm Lớp Zalo</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Trợ giảng học thuật sẽ liên hệ qua Zalo trong vòng 15 phút để mời bạn vào nhóm lớp và gửi lịch học.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 font-black text-sm flex items-center justify-center">
                  3
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">Nhận Giáo Trình Độc Quyền</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Bộ sách Linear Thinking và bài tập luyện thi được gửi về địa chỉ nhà hoặc nhận trực tiếp tại trung tâm.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={PATHS.HOME}
              className="btn-shimmer w-full sm:w-auto py-3.5 px-8 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-lg shadow-rose-200 transition text-center"
            >
              Về Trang Chủ Khám Phá Thêm
            </Link>
            <a
              href="tel:19006868"
              className="w-full sm:w-auto py-3.5 px-6 border border-slate-300 hover:bg-slate-100/80 bg-white text-slate-700 text-xs sm:text-sm font-bold rounded-2xl transition text-center shadow-xs"
            >
              📞 Hotline Hỗ Trợ 24/7 (1900 6868)
            </a>
          </div>
        </div>
      </main>

      <ResponsiveFooter />
    </div>
  )
}

// ============================================================================
// 6. TRANG THANH TOÁN ĐỘC LẬP (SHAREABLE CHECKOUT PAGE)
// Dùng để gửi link trực tiếp cho học viên / khách hàng thanh toán từ xa
// ============================================================================
export function ShareableCheckoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const orderCode = searchParams.get('orderCode') || 'ZIM' + Math.floor(1000 + Math.random() * 9000)
  const packageName = searchParams.get('pkg') || 'Khóa Học IELTS Chuyên Sâu ZIM AI'
  const amount = Number(searchParams.get('amount')) || 13900000
  const customerName = searchParams.get('name') || 'Học viên ZIM'
  const phone = searchParams.get('phone') || '0972169226'

  // Countdown khan hiếm (10 phút)
  const [timeLeft, setTimeLeft] = useState(600)
  const [copiedKey, setCopiedKey] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const pollingTimerRef = useRef(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Polling tự động kiểm tra trạng thái
  useEffect(() => {
    if (!orderCode) return
    pollingTimerRef.current = setInterval(async () => {
      try {
        const orderData = await getOrder(orderCode)
        if (orderData && orderData.status === 'paid') {
          clearInterval(pollingTimerRef.current)
          navigate(
            `${PATHS.WELCOME}?orderCode=${orderCode}&name=${encodeURIComponent(customerName)}&pkg=${encodeURIComponent(packageName)}`
          )
        }
      } catch {
        // ignore
      }
    }, 2500)
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)
    }
  }, [orderCode, customerName, packageName, navigate])

  function copyToClipboard(text, key) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    }
  }

  async function handleSimulatePayment() {
    setIsSimulating(true)
    try {
      await confirmPayment(orderCode)
      setTimeout(() => {
        navigate(
          `${PATHS.WELCOME}?orderCode=${orderCode}&name=${encodeURIComponent(customerName)}&pkg=${encodeURIComponent(packageName)}`
        )
      }, 800)
    } catch {
      navigate(
        `${PATHS.WELCOME}?orderCode=${orderCode}&name=${encodeURIComponent(customerName)}&pkg=${encodeURIComponent(packageName)}`
      )
    } finally {
      setIsSimulating(false)
    }
  }

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const seconds = String(timeLeft % 60).padStart(2, '0')
  const isUrgent = timeLeft < 180 && timeLeft > 0

  const transferContent = `${orderCode} ${phone}`
  const qrParams = new URLSearchParams({
    amount: String(amount),
    addInfo: transferContent,
    accountName: VIETQR_ACCOUNT_NAME,
  })
  const qrUrl = `https://img.vietqr.io/image/${VIETQR_BANK_BIN}-${VIETQR_BANK_ACCOUNT}-compact2.jpg?${qrParams.toString()}`

  return (
    <div className="min-h-screen bg-slate-50 bg-mesh-pattern text-slate-800 antialiased flex flex-col justify-between selection:bg-rose-100 selection:text-rose-600 relative">
      <ResponsiveHeader />

      <main className="flex-grow max-w-xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xl">
          {/* Header Countdown */}
          <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-rose-900 text-white p-6 text-center space-y-2">
            <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border border-white/20">
              Cổng Thanh Toán Học Phí Trực Tuyến ZIM
            </span>
            <h1 className="text-xl font-black">{decodeURIComponent(packageName)}</h1>
            <p className="text-xs text-rose-100">
              Học viên: <strong className="text-white">{decodeURIComponent(customerName)}</strong> ({phone})
            </p>
            <div
              className={`flex items-center justify-center gap-2 pt-2 font-mono ${
                isUrgent ? 'text-amber-300' : 'text-white'
              }`}
            >
              <div className="bg-black/35 px-3 py-1 rounded-xl text-center min-w-[50px] border border-white/10">
                <span className="block text-xl font-black">{minutes}</span>
                <span className="text-[9px] uppercase tracking-wider text-rose-200 font-bold">Phút</span>
              </div>
              <span className="text-lg font-bold animate-pulse">:</span>
              <div className="bg-black/35 px-3 py-1 rounded-xl text-center min-w-[50px] border border-white/10">
                <span className="block text-xl font-black">{seconds}</span>
                <span className="text-[9px] uppercase tracking-wider text-rose-200 font-bold">Giây</span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5 text-center">
            {/* Status Loading */}
            <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-3 flex items-center justify-center gap-2.5">
              <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-ping"></span>
              <span className="text-xs font-black text-indigo-950">
                Hệ thống đang tự động kiểm tra biến động số dư (polling mỗi 2-3s)...
              </span>
            </div>

            {/* QR Code */}
            <div className="inline-block p-3 rounded-2xl border-2 border-dashed border-rose-500 bg-white shadow-md">
              <img src={qrUrl} alt={`VietQR ${orderCode}`} className="w-56 h-56 mx-auto object-contain rounded-lg" />
              <div className="mt-2 text-[11px] font-bold text-slate-500">
                Mở ứng dụng Ngân hàng bất kỳ hoặc VPBank NEO để quét mã
              </div>
            </div>

            {/* Thông tin chuyển khoản */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-left space-y-2.5 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-500">Ngân hàng:</span>
                <span className="font-bold text-slate-800">{VIETQR_BANK_NAME}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <div className="flex items-center gap-2 font-bold text-slate-900 uppercase">
                  <span>{VIETQR_ACCOUNT_NAME}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(VIETQR_ACCOUNT_NAME, 'share_name')}
                    className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-[10px] cursor-pointer"
                  >
                    {copiedKey === 'share_name' ? '✓ Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-500">Số tài khoản:</span>
                <div className="flex items-center gap-2 font-mono font-bold text-slate-900">
                  <span>{VIETQR_BANK_ACCOUNT}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(VIETQR_BANK_ACCOUNT, 'share_acc')}
                    className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-[10px] cursor-pointer"
                  >
                    {copiedKey === 'share_acc' ? '✓ Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-500">Số tiền:</span>
                <div className="flex items-center gap-2 font-black text-rose-600">
                  <span>{formatVnd(amount)}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(String(amount), 'share_amount')}
                    className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-[10px] text-slate-700 cursor-pointer"
                  >
                    {copiedKey === 'share_amount' ? '✓ Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <div>
                  <span className="text-slate-500 font-medium block">Nội dung chuyển khoản:</span>
                  <span className="text-[10px] text-slate-400 italic">(Chính xác mã đơn + SĐT)</span>
                </div>
                <div className="flex items-center gap-2 font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">
                  <span>{transferContent}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(transferContent, 'share_content')}
                    className="px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold cursor-pointer"
                  >
                    {copiedKey === 'share_content' ? '✓ Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
            </div>

            {/* Test Simulation Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isSimulating}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-200 transition cursor-pointer"
              >
                {isSimulating ? 'Đang xử lý...' : '⚡ Mô Phỏng Thanh Toán Thành Công (Test)'}
              </button>
            </div>
          </div>
        </div>
      </main>

      <ResponsiveFooter />
    </div>
  )
}

