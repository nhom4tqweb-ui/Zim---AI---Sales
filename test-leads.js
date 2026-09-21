// ============================================================================
// test-leads.js — BỘ TEST TỰ ĐỘNG CHO THUẬT TOÁN CỦA BE2
// ----------------------------------------------------------------------------
// Chạy: npm test    (không cần mở server, không cần cài thêm thư viện nào)
// Kiểm tra 3 đầu việc của đề bài + các tình huống biên trong edge-cases.md
// ============================================================================

const { suyRaPhanLoai, goiYKichBanFollowUp, tinhBandTrungBinh, formatLead } = require('./leadsService');
const { LEAD_CLASSIFICATION, validateLeadPayload } = require('./Lead');

let soDat = 0;
let soTruot = 0;

function kiemTra(tenTinhHuong, ketQua, mongDoi) {
  const dat = JSON.stringify(ketQua) === JSON.stringify(mongDoi);
  if (dat) {
    soDat++;
    console.log(`  [DAT]   ${tenTinhHuong}`);
  } else {
    soTruot++;
    console.log(`  [TRUOT] ${tenTinhHuong}`);
    console.log(`          mong doi: ${JSON.stringify(mongDoi)}`);
    console.log(`          nhan duoc: ${JSON.stringify(ketQua)}`);
  }
}

console.log('\n=== 1. THUAT TOAN GAN NHAN TU DONG ===');

kiemTra(
  'Chi co khao sat -> da_dien_form',
  suyRaPhanLoai({}, null),
  LEAD_CLASSIFICATION.DA_DIEN_FORM
);

kiemTra(
  'Co diem Micro Test -> da_lam_micro_test',
  suyRaPhanLoai({ microTestBands: { Listening: 6 } }, LEAD_CLASSIFICATION.DA_DIEN_FORM),
  LEAD_CLASSIFICATION.DA_LAM_MICRO_TEST
);

kiemTra(
  'Mo man thanh toan -> da_de_lai_thong_tin_thanh_toan',
  suyRaPhanLoai({ reachedCheckout: true }, LEAD_CLASSIFICATION.DA_LAM_MICRO_TEST),
  LEAD_CLASSIFICATION.DA_DE_LAI_THONG_TIN_THANH_TOAN
);

console.log('\n=== 2. NHAN CHI TIEN, KHONG LUI (edge-cases muc 1) ===');

kiemTra(
  'Da thanh toan + gui lai chi co khao sat -> GIU NGUYEN, khong tut hang',
  suyRaPhanLoai({}, LEAD_CLASSIFICATION.DA_DE_LAI_THONG_TIN_THANH_TOAN),
  LEAD_CLASSIFICATION.DA_DE_LAI_THONG_TIN_THANH_TOAN
);

kiemTra(
  'Da lam test + gui lai chi co khao sat -> GIU NGUYEN',
  suyRaPhanLoai({}, LEAD_CLASSIFICATION.DA_LAM_MICRO_TEST),
  LEAD_CLASSIFICATION.DA_LAM_MICRO_TEST
);

kiemTra(
  'Da thanh toan + gui lai co diem test -> VAN GIU muc cao nhat',
  suyRaPhanLoai({ microTestBands: { Listening: 6 } }, LEAD_CLASSIFICATION.DA_DE_LAI_THONG_TIN_THANH_TOAN),
  LEAD_CLASSIFICATION.DA_DE_LAI_THONG_TIN_THANH_TOAN
);

console.log('\n=== 3. KICH BAN FOLLOW-UP THEO CAP DO ROT ===');

const kichBanThanhToan = goiYKichBanFollowUp({ classification: LEAD_CLASSIFICATION.DA_DE_LAI_THONG_TIN_THANH_TOAN });
kiemTra('Khach ket o thanh toan -> kich ban nhac goi trong 2 gio', kichBanThanhToan.includes('2 giờ'), true);

const kichBanTest = goiYKichBanFollowUp({ classification: LEAD_CLASSIFICATION.DA_LAM_MICRO_TEST, target_band: '6.5' });
kiemTra('Khach da test -> kich ban nhac band muc tieu cu the', kichBanTest.includes('band 6.5'), true);

const kichBanForm = goiYKichBanFollowUp({ classification: LEAD_CLASSIFICATION.DA_DIEN_FORM });
kiemTra('Khach moi dien form -> kich ban moi lam Micro Test', kichBanForm.includes('Micro Test'), true);

kiemTra(
  '3 cap do sinh ra 3 kich ban KHAC NHAU',
  new Set([kichBanThanhToan, kichBanTest, kichBanForm]).size,
  3
);

console.log('\n=== 4. TINH BAND TRUNG BINH ===');

kiemTra('Trung binh 4 ky nang', tinhBandTrungBinh({ Listening: 6, Reading: 5, Writing: 5.5, Speaking: 5 }), 5.4);
kiemTra('Chua lam test -> null', tinhBandTrungBinh(null), null);
kiemTra('Object rong -> null', tinhBandTrungBinh({}), null);
kiemTra(
  'Bo qua gia tri sai kieu, khong tra NaN (edge-cases muc 6)',
  tinhBandTrungBinh({ Listening: 6, Reading: 'sau' }),
  6
);

console.log('\n=== 5. VALIDATE DU LIEU DAU VAO ===');

kiemTra('Thieu sessionId -> bao loi', validateLeadPayload({}).length > 0, true);
kiemTra(
  'Dau pheu chua co ten/SDT/email -> VAN HOP LE (edge-cases muc 3)',
  validateLeadPayload({ sessionId: 'abc' }).length,
  0
);
kiemTra('Email sai dinh dang -> bao loi', validateLeadPayload({ sessionId: 'abc', email: 'sai-dinh-dang' }).length > 0, true);
kiemTra('Diem ngoai thang 0-9 -> bao loi', validateLeadPayload({ sessionId: 'abc', microTestBands: { Reading: 99 } }).length > 0, true);

console.log('\n=== 6. FORMAT LEAD TRA VE DU TRUONG CHO MAN HINH CRM ===');

const leadMau = formatLead(
  {
    id: 1,
    session_id: 's1',
    name: 'Nguyen Van An',
    phone: '0981234567',
    email: 'an@gmail.com',
    goal: 'IELTS',
    reason: 'Du hoc',
    daily_time: '1-2h/ngay',
    deadline: '3 thang',
    target_band: '6.5',
    micro_test_bands: JSON.stringify({ Listening: 6, Reading: 5, Writing: 5.5, Speaking: 5 }),
    classification: LEAD_CLASSIFICATION.DA_DE_LAI_THONG_TIN_THANH_TOAN,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  { donHang: { amount: 12500000, status: 'pending' } }
);

const truongBatBuoc = [
  'followUpScript', 'dropOffReason', 'salesOffer',
  'estimatedBand', 'amount', 'orderStatus', 'isUrgent', 'minutesSinceUpdate',
];
kiemTra('Co du cac truong phuc vu Sales', truongBatBuoc.filter((k) => !(k in leadMau)), []);
kiemTra('Band chan doan tinh tu diem test', leadMau.estimatedBand, 5.4);
kiemTra('Gia tri don hang lay tu bang orders', leadMau.amount, 12500000);
kiemTra('Khach ket thanh toan -> isUrgent = true', leadMau.isUrgent, true);

console.log('\n' + '='.repeat(60));
console.log(`KET QUA: ${soDat} dat / ${soTruot} truot (tong ${soDat + soTruot})`);
console.log('='.repeat(60) + '\n');
process.exit(soTruot > 0 ? 1 : 0);
