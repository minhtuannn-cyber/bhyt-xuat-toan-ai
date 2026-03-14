// ============================================================
// DATA MODULE - Hệ thống Cảnh báo Xuất Toán BHYT Thông minh
// Bệnh viện Đa khoa Khu vực Phú Thọ
// ============================================================

// ---- 12 trường hợp KHÔNG được BHYT thanh toán (Luật BHYT sửa đổi 2024, hiệu lực 01/7/2025) ----
const NON_COVERED_CASES = [
  {
    id: 'NC01',
    title: 'Chi phí đã được ngân sách nhà nước chi trả',
    description: 'KCB, phục hồi chức năng, khám thai định kỳ, sinh con, khám sàng lọc, chẩn đoán sớm một số bệnh, chi phí vận chuyển người bệnh từ tuyến huyện lên tuyến trên đối với một số đối tượng trong trường hợp cấp cứu hoặc đang điều trị nội trú phải chuyển tuyến.',
    keywords: ['ngân sách', 'nhà nước chi trả', 'khám sàng lọc', 'chẩn đoán sớm'],
    severity: 'critical'
  },
  {
    id: 'NC02',
    title: 'Điều dưỡng, an dưỡng tại cơ sở điều dưỡng, an dưỡng',
    description: 'Chi phí điều dưỡng, an dưỡng tại cơ sở điều dưỡng, an dưỡng không thuộc phạm vi thanh toán BHYT.',
    keywords: ['điều dưỡng', 'an dưỡng'],
    severity: 'critical'
  },
  {
    id: 'NC03',
    title: 'Khám sức khỏe',
    description: 'Chi phí khám sức khỏe định kỳ, khám sức khỏe cho mục đích xin việc, lái xe... không được BHYT chi trả.',
    keywords: ['khám sức khỏe', 'khám định kỳ', 'khám tuyển'],
    severity: 'critical'
  },
  {
    id: 'NC04',
    title: 'Xét nghiệm, chẩn đoán thai không nhằm mục đích điều trị',
    description: 'Các xét nghiệm và chẩn đoán liên quan đến thai sản mà không nhằm mục đích điều trị bệnh lý.',
    keywords: ['chẩn đoán thai', 'siêu âm thai', 'xét nghiệm thai'],
    severity: 'critical'
  },
  {
    id: 'NC05',
    title: 'Kỹ thuật hỗ trợ sinh sản, KHHGD, nạo hút thai, phá thai',
    description: 'Sử dụng kỹ thuật hỗ trợ sinh sản, dịch vụ kế hoạch hóa gia đình, nạo hút thai, phá thai. Trừ trường hợp phải đình chỉ thai nghén do nguyên nhân bệnh lý của thai nhi hoặc sản phụ.',
    keywords: ['hỗ trợ sinh sản', 'kế hoạch hóa', 'nạo hút thai', 'phá thai', 'IVF'],
    severity: 'critical'
  },
  {
    id: 'NC06',
    title: 'Dịch vụ thẩm mỹ',
    description: 'Mọi chi phí liên quan đến dịch vụ thẩm mỹ không được BHYT thanh toán.',
    keywords: ['thẩm mỹ', 'phẫu thuật thẩm mỹ', 'làm đẹp'],
    severity: 'critical'
  },
  {
    id: 'NC07',
    title: 'Điều trị lác và tật khúc xạ mắt (từ 18 tuổi)',
    description: 'Điều trị lác và tật khúc xạ của mắt đối với người từ đủ 18 tuổi trở lên.',
    keywords: ['lác mắt', 'khúc xạ', 'cận thị', 'viễn thị', 'loạn thị'],
    severity: 'critical'
  },
  {
    id: 'NC08',
    title: 'Thiết bị y tế thay thế',
    description: 'Chân giả, tay giả, mắt giả, răng giả, kính mắt, máy trợ thính, phương tiện trợ giúp vận động.',
    keywords: ['chân giả', 'tay giả', 'mắt giả', 'răng giả', 'kính mắt', 'máy trợ thính', 'trợ giúp vận động'],
    severity: 'critical'
  },
  {
    id: 'NC09',
    title: 'KCB trong trường hợp thảm họa',
    description: 'Khám bệnh, chữa bệnh, phục hồi chức năng trong trường hợp thảm họa.',
    keywords: ['thảm họa', 'thiên tai'],
    severity: 'critical'
  },
  {
    id: 'NC10',
    title: 'KCB nghiện ma túy, nghiện rượu, chất gây nghiện',
    description: 'Khám bệnh, chữa bệnh nghiện ma túy, nghiện rượu hoặc chất gây nghiện khác.',
    keywords: ['nghiện ma túy', 'nghiện rượu', 'chất gây nghiện', 'cai nghiện'],
    severity: 'critical'
  },
  {
    id: 'NC11',
    title: 'Giám định y khoa, giám định pháp y',
    description: 'Giám định y khoa, giám định pháp y, giám định pháp y tâm thần.',
    keywords: ['giám định y khoa', 'giám định pháp y', 'pháp y tâm thần'],
    severity: 'critical'
  },
  {
    id: 'NC12',
    title: 'Thử nghiệm lâm sàng, nghiên cứu khoa học',
    description: 'Tham gia thử nghiệm lâm sàng, nghiên cứu khoa học.',
    keywords: ['thử nghiệm lâm sàng', 'nghiên cứu khoa học', 'clinical trial'],
    severity: 'critical'
  }
];

// ---- Danh mục thuốc BHYT mẫu (phổ biến tại BV Đa khoa) ----
const DRUG_CATALOG = [
  { code: 'T001', name: 'Amoxicillin 500mg', category: 'Kháng sinh', maxPrice: 1500, unit: 'viên', bhytCovered: true, contraindications: ['dị ứng penicillin', 'suy thận nặng'] },
  { code: 'T002', name: 'Paracetamol 500mg', category: 'Giảm đau, hạ sốt', maxPrice: 800, unit: 'viên', bhytCovered: true, contraindications: ['suy gan nặng'] },
  { code: 'T003', name: 'Metformin 500mg', category: 'Tiểu đường', maxPrice: 1200, unit: 'viên', bhytCovered: true, contraindications: ['suy thận', 'nhiễm toan'] },
  { code: 'T004', name: 'Amlodipine 5mg', category: 'Tim mạch', maxPrice: 2000, unit: 'viên', bhytCovered: true, contraindications: ['hạ huyết áp nặng', 'sốc tim'] },
  { code: 'T005', name: 'Omeprazole 20mg', category: 'Dạ dày', maxPrice: 3500, unit: 'viên', bhytCovered: true, contraindications: [] },
  { code: 'T006', name: 'Ceftriaxone 1g', category: 'Kháng sinh', maxPrice: 45000, unit: 'lọ', bhytCovered: true, contraindications: ['dị ứng cephalosporin', 'trẻ sơ sinh vàng da'] },
  { code: 'T007', name: 'Losartan 50mg', category: 'Tim mạch', maxPrice: 2500, unit: 'viên', bhytCovered: true, contraindications: ['có thai', 'cho con bú'] },
  { code: 'T008', name: 'Insulin Mixtard 30', category: 'Tiểu đường', maxPrice: 185000, unit: 'bút tiêm', bhytCovered: true, contraindications: ['hạ đường huyết'] },
  { code: 'T009', name: 'Atorvastatin 20mg', category: 'Mỡ máu', maxPrice: 3000, unit: 'viên', bhytCovered: true, contraindications: ['bệnh gan hoạt động', 'có thai'] },
  { code: 'T010', name: 'Ciprofloxacin 500mg', category: 'Kháng sinh', maxPrice: 2800, unit: 'viên', bhytCovered: true, contraindications: ['có thai', 'trẻ em dưới 18', 'viêm gân'] },
  { code: 'T011', name: 'Diclofenac 50mg', category: 'Kháng viêm', maxPrice: 1500, unit: 'viên', bhytCovered: true, contraindications: ['loét dạ dày', 'suy thận', 'suy tim'] },
  { code: 'T012', name: 'Salbutamol 2mg', category: 'Hô hấp', maxPrice: 900, unit: 'viên', bhytCovered: true, contraindications: ['rối loạn nhịp tim nặng'] },
  { code: 'T013', name: 'Prednisolone 5mg', category: 'Corticoid', maxPrice: 1800, unit: 'viên', bhytCovered: true, contraindications: ['nhiễm nấm toàn thân', 'loét dạ dày tiến triển'] },
  { code: 'T014', name: 'Furosemide 40mg', category: 'Lợi tiểu', maxPrice: 1000, unit: 'viên', bhytCovered: true, contraindications: ['vô niệu', 'hạ kali máu nặng'] },
  { code: 'T015', name: 'Aspirin 81mg', category: 'Tim mạch', maxPrice: 600, unit: 'viên', bhytCovered: true, contraindications: ['xuất huyết tiêu hóa', 'hemophilia', 'trẻ em dưới 16'] },
  { code: 'T016', name: 'Clopidogrel 75mg', category: 'Tim mạch', maxPrice: 8500, unit: 'viên', bhytCovered: true, contraindications: ['xuất huyết hoạt động', 'suy gan nặng'] },
  { code: 'T017', name: 'Vitamin B Complex', category: 'Vitamin', maxPrice: 500, unit: 'viên', bhytCovered: false, contraindications: [] },
  { code: 'T018', name: 'Glucosamine 1500mg', category: 'Thực phẩm chức năng', maxPrice: 15000, unit: 'gói', bhytCovered: false, contraindications: ['dị ứng hải sản'] },
  { code: 'T019', name: 'Dexamethasone 4mg', category: 'Corticoid', maxPrice: 3500, unit: 'ống', bhytCovered: true, contraindications: ['nhiễm nấm toàn thân'] },
  { code: 'T020', name: 'Cefuroxime 500mg', category: 'Kháng sinh', maxPrice: 12000, unit: 'viên', bhytCovered: true, contraindications: ['dị ứng cephalosporin'] }
];

// ---- Danh mục Dịch vụ Kỹ thuật mẫu ----
const SERVICE_CATALOG = [
  { code: 'DV001', name: 'Khám bệnh ngoại trú', category: 'Khám bệnh', maxPrice: 39000, level: 'all' },
  { code: 'DV002', name: 'Xét nghiệm công thức máu', category: 'Xét nghiệm', maxPrice: 52000, level: 'all' },
  { code: 'DV003', name: 'Sinh hóa máu 17 thông số', category: 'Xét nghiệm', maxPrice: 145000, level: 'all' },
  { code: 'DV004', name: 'X-quang ngực thẳng', category: 'Chẩn đoán hình ảnh', maxPrice: 68000, level: 'all' },
  { code: 'DV005', name: 'Siêu âm ổ bụng tổng quát', category: 'Chẩn đoán hình ảnh', maxPrice: 105000, level: 'all' },
  { code: 'DV006', name: 'Siêu âm tim', category: 'Chẩn đoán hình ảnh', maxPrice: 155000, level: 'all' },
  { code: 'DV007', name: 'CT Scanner sọ não', category: 'Chẩn đoán hình ảnh', maxPrice: 790000, level: 'province' },
  { code: 'DV008', name: 'MRI sọ não', category: 'Chẩn đoán hình ảnh', maxPrice: 1800000, level: 'central' },
  { code: 'DV009', name: 'Điện tâm đồ', category: 'Thăm dò chức năng', maxPrice: 45000, level: 'all' },
  { code: 'DV010', name: 'Nội soi dạ dày', category: 'Nội soi', maxPrice: 350000, level: 'province' },
  { code: 'DV011', name: 'Nội soi đại tràng', category: 'Nội soi', maxPrice: 500000, level: 'province' },
  { code: 'DV012', name: 'Phẫu thuật ruột thừa', category: 'Phẫu thuật', maxPrice: 3500000, level: 'all' },
  { code: 'DV013', name: 'Mổ lấy thai', category: 'Phẫu thuật', maxPrice: 4500000, level: 'province' },
  { code: 'DV014', name: 'Xét nghiệm nước tiểu', category: 'Xét nghiệm', maxPrice: 35000, level: 'all' },
  { code: 'DV015', name: 'Đo loãng xương (DEXA)', category: 'Thăm dò chức năng', maxPrice: 250000, level: 'province' },
  { code: 'DV016', name: 'Phẫu thuật nội soi cắt túi mật', category: 'Phẫu thuật', maxPrice: 5500000, level: 'province' },
  { code: 'DV017', name: 'Xét nghiệm HbA1c', category: 'Xét nghiệm', maxPrice: 85000, level: 'all' },
  { code: 'DV018', name: 'Xét nghiệm HIV', category: 'Xét nghiệm', maxPrice: 65000, level: 'all' },
  { code: 'DV019', name: 'Đo chức năng hô hấp', category: 'Thăm dò chức năng', maxPrice: 95000, level: 'province' },
  { code: 'DV020', name: 'Truyền máu (1 đơn vị)', category: 'Điều trị', maxPrice: 450000, level: 'all' }
];

// ---- Danh mục Vật tư Y tế ----
const SUPPLY_CATALOG = [
  { code: 'VT001', name: 'Bơm tiêm 5ml', maxPrice: 3500, paidSeparately: false },
  { code: 'VT002', name: 'Kim luồn 20G', maxPrice: 12000, paidSeparately: false },
  { code: 'VT003', name: 'Dây truyền dịch', maxPrice: 15000, paidSeparately: false },
  { code: 'VT004', name: 'Stent mạch vành', maxPrice: 25000000, paidSeparately: true },
  { code: 'VT005', name: 'Khớp háng nhân tạo', maxPrice: 35000000, paidSeparately: true },
  { code: 'VT006', name: 'Nẹp xương titan', maxPrice: 8000000, paidSeparately: true },
  { code: 'VT007', name: 'Chỉ phẫu thuật tự tiêu', maxPrice: 250000, paidSeparately: false },
  { code: 'VT008', name: 'Ống nội khí quản', maxPrice: 85000, paidSeparately: false },
  { code: 'VT009', name: 'Catheter tiểu 2 nòng', maxPrice: 45000, paidSeparately: false },
  { code: 'VT010', name: 'Băng gạc vô trùng', maxPrice: 8000, paidSeparately: false }
];

// ---- Danh mục mã ICD-10 phổ biến (bổ sung mã từ dữ liệu thực tế BV) ----
const ICD10_CATALOG = [
  { code: 'J06.9', name: 'Nhiễm trùng hô hấp trên cấp, không đặc hiệu', category: 'Hô hấp' },
  { code: 'J06.0', name: 'Viêm họng cấp', category: 'Hô hấp' },
  { code: 'J18.9', name: 'Viêm phổi, không đặc hiệu', category: 'Hô hấp' },
  { code: 'J20', name: 'Viêm phế quản cấp', category: 'Hô hấp' },
  { code: 'J01.4', name: 'Viêm xoang hàm cấp', category: 'Hô hấp' },
  { code: 'J35.2', name: 'Phì đại vòm họng (VA)', category: 'Hô hấp' },
  { code: 'J35.3', name: 'Phì đại Amidan', category: 'Hô hấp' },
  { code: 'J45', name: 'Hen phế quản', category: 'Hô hấp' },
  { code: 'I10', name: 'Tăng huyết áp nguyên phát', category: 'Tim mạch' },
  { code: 'I20.9', name: 'Đau thắt ngực, không đặc hiệu', category: 'Tim mạch' },
  { code: 'I21.9', name: 'Nhồi máu cơ tim cấp, không đặc hiệu', category: 'Tim mạch' },
  { code: 'I50.9', name: 'Suy tim, không đặc hiệu', category: 'Tim mạch' },
  { code: 'E11', name: 'Đái tháo đường type 2', category: 'Nội tiết' },
  { code: 'E10', name: 'Đái tháo đường type 1', category: 'Nội tiết' },
  { code: 'E78.5', name: 'Rối loạn lipid máu, không đặc hiệu', category: 'Nội tiết' },
  { code: 'K29.7', name: 'Viêm dạ dày, không đặc hiệu', category: 'Tiêu hóa' },
  { code: 'K35.3', name: 'Viêm ruột thừa cấp kèm viêm phúc mạc khu trú', category: 'Tiêu hóa' },
  { code: 'K35.8', name: 'Viêm ruột thừa cấp, khác', category: 'Tiêu hóa' },
  { code: 'K19', name: 'Bệnh dạ dày - tá tràng, không đặc hiệu', category: 'Tiêu hóa' },
  { code: 'K80.2', name: 'Sỏi túi mật', category: 'Tiêu hóa' },
  { code: 'A09.9', name: 'Viêm dạ dày ruột, không đặc hiệu', category: 'Nhiễm trùng' },
  { code: 'A41', name: 'Nhiễm khuẩn huyết khác', category: 'Nhiễm trùng' },
  { code: 'N18.9', name: 'Bệnh thận mạn', category: 'Tiết niệu' },
  { code: 'N20', name: 'Sỏi thận và sỏi niệu quản', category: 'Tiết niệu' },
  { code: 'N20.1', name: 'Sỏi niệu quản', category: 'Tiết niệu' },
  { code: 'N39.0', name: 'Nhiễm trùng đường tiết niệu', category: 'Tiết niệu' },
  { code: 'H10', name: 'Viêm kết mạc', category: 'Mắt' },
  { code: 'H10.0', name: 'Viêm kết mạc mủ', category: 'Mắt' },
  { code: 'H66.0', name: 'Viêm tai giữa nung mủ cấp', category: 'Tai Mũi Họng' },
  { code: 'D23', name: 'U lành tính da', category: 'U bướu' },
  { code: 'Z96.0', name: 'Sự có mặt các dụng cụ cấy ghép tiết niệu', category: 'Ngoại' },
  { code: 'S01', name: 'Vết thương hở vùng đầu', category: 'Chấn thương' },
  { code: 'T07', name: 'Đa thương tích, không đặc hiệu', category: 'Chấn thương' },
  { code: 'M54.5', name: 'Đau thắt lưng', category: 'Cơ xương khớp' },
  { code: 'M17.9', name: 'Thoái hóa khớp gối', category: 'Cơ xương khớp' },
  { code: 'S72.0', name: 'Gãy cổ xương đùi', category: 'Chấn thương' },
  { code: 'O82', name: 'Mổ lấy thai', category: 'Sản khoa' },
  { code: 'O82.1', name: 'Mổ lấy thai cấp cứu', category: 'Sản khoa' },
  { code: 'Z34.8', name: 'Theo dõi thai bình thường khác', category: 'Sản khoa' },
  { code: 'O80', name: 'Sinh thường', category: 'Sản khoa' },
  { code: 'L90.5', name: 'Sẹo và xơ hóa da', category: 'Da liễu' },
  { code: 'G43.9', name: 'Đau nửa đầu, không đặc hiệu', category: 'Thần kinh' },
  { code: 'A09', name: 'Tiêu chảy và viêm dạ dày ruột', category: 'Nhiễm trùng' },
  { code: 'B18.1', name: 'Viêm gan B mạn', category: 'Nhiễm trùng' },
  { code: 'D50.9', name: 'Thiếu máu thiếu sắt', category: 'Huyết học' }
];

// ---- Danh mục bệnh có chống chỉ định cần kiểm tra ----
const DISEASE_DRUG_CONFLICTS = [
  { diseaseCode: 'N18.9', drugCodes: ['T003', 'T011'], reason: 'Suy thận - Chống chỉ định Metformin, Diclofenac' },
  { diseaseCode: 'K29.7', drugCodes: ['T011', 'T015'], reason: 'Viêm dạ dày - Chống chỉ định NSAIDs, Aspirin' },
  { diseaseCode: 'I50.9', drugCodes: ['T011', 'T004'], reason: 'Suy tim - Thận trọng với NSAIDs, Amlodipine' },
  { diseaseCode: 'E11', drugCodes: ['T013', 'T019'], reason: 'Tiểu đường - Corticoid làm tăng đường huyết' },
  { diseaseCode: 'O82', drugCodes: ['T007', 'T009', 'T010'], reason: 'Thai sản - Chống chỉ định Losartan, Atorvastatin, Ciprofloxacin' },
  { diseaseCode: 'O80', drugCodes: ['T007', 'T009', 'T010'], reason: 'Thai sản - Chống chỉ định Losartan, Atorvastatin, Ciprofloxacin' },
  { diseaseCode: 'B18.1', drugCodes: ['T002', 'T009'], reason: 'Viêm gan - Thận trọng Paracetamol, chống chỉ định Atorvastatin khi bệnh gan hoạt động' }
];

// ---- Quy định về giường bệnh ----
const BED_RULES = {
  icu: { name: 'Giường hồi sức tích cực (ICU)', maxPrice: 335000, maxDays: null },
  specialCare: { name: 'Giường cấp cứu', maxPrice: 235000, maxDays: 3 },
  surgery: { name: 'Giường sau phẫu thuật', maxPrice: 235000, maxDays: null },
  inpatient: { name: 'Giường nội trú thường', maxPrice: 185000, maxDays: null },
  daycare: { name: 'Giường ban ngày', maxPrice: 90000, maxDays: 1 }
};

// ---- Quy định về số lượt khám (TT39/2024) ----
const CONSULTATION_LIMITS = {
  maxPerDesk: 65, // Tối đa 65 lượt/bàn khám/ngày
  consecutiveMonths: 3, // Trong 3 tháng liên tiếp
  secondVisitDiscount: 0.3 // 30% giá khám từ lần 2 trở đi (cùng ngày)
};

// ---- Danh mục các khoa của BV Đa khoa Khu vực Phú Thọ ----
const DEPARTMENTS = [
  'Khoa Khám bệnh',
  'Khoa Cấp cứu',
  'Khoa Nội tổng hợp',
  'Khoa Nội Tim mạch',
  'Khoa Nội Tiêu hóa',
  'Khoa Ngoại tổng hợp',
  'Khoa Ngoại Chấn thương',
  'Khoa Sản',
  'Khoa Nhi',
  'Khoa Mắt',
  'Khoa Tai Mũi Họng',
  'Khoa Răng Hàm Mặt',
  'Khoa Da liễu',
  'Khoa Truyền nhiễm',
  'Khoa Hồi sức tích cực',
  'Khoa Phẫu thuật - Gây mê hồi sức',
  'Khoa Chẩn đoán hình ảnh',
  'Khoa Xét nghiệm',
  'Khoa Dược',
  'Khoa Y học cổ truyền',
  'Khoa Phục hồi chức năng',
  'Khoa Ung bướu',
  'Khoa Thận nhân tạo'
];

// ---- Bảng quy định BHYT tham chiếu ----
const REGULATIONS = [
  {
    id: 'REG01',
    title: 'Luật BHYT sửa đổi 2024',
    effectiveDate: '2025-07-01',
    summary: 'Sửa đổi, bổ sung một số điều của Luật BHYT năm 2008. Quy định 12 trường hợp không được BHYT thanh toán.',
    category: 'Luật'
  },
  {
    id: 'REG02',
    title: 'Thông tư 22/2024/TT-BYT',
    effectiveDate: '2025-01-01',
    summary: 'Quy định thanh toán chi phí thuốc và thiết bị y tế trực tiếp cho người có thẻ BHYT. Thuốc và TBYT phải phù hợp phạm vi chuyên môn, thuộc quyền lợi người tham gia BHYT.',
    category: 'Thông tư'
  },
  {
    id: 'REG03',
    title: 'Thông tư 39/2024/TT-BYT',
    effectiveDate: '2025-01-01',
    summary: 'Quy định số lần khám, mức giá và thanh toán tiền khám bệnh. Tối đa 65 lượt/bàn khám/ngày. Lần khám thứ 2 trở đi cùng ngày chỉ tính 30% giá.',
    category: 'Thông tư'
  },
  {
    id: 'REG04',
    title: 'Thông tư 20/2022/TT-BYT',
    effectiveDate: '2022-12-15',
    summary: 'Quy định về danh mục và tỷ lệ, điều kiện thanh toán đối với thuốc hóa dược, sinh phẩm, thuốc dược liệu và thuốc cổ truyền thuộc phạm vi được hưởng của người tham gia BHYT.',
    category: 'Thông tư'
  },
  {
    id: 'REG05',
    title: 'Nghị định 146/2018/NĐ-CP',
    effectiveDate: '2018-12-01',
    summary: 'Quy định chi tiết và hướng dẫn biện pháp thi hành Luật BHYT. Quy định về mức hưởng, thủ tục KCB BHYT.',
    category: 'Nghị định'
  }
];

// ---- Mức hưởng BHYT theo đối tượng ----
const BHYT_COVERAGE_RATES = {
  'DN': { rate: 0.80, label: '80% - Người lao động', description: 'Người lao động, chủ sử dụng lao động' },
  'HN': { rate: 0.80, label: '80% - Hộ gia đình', description: 'Người tham gia BHYT hộ gia đình' },
  'TE': { rate: 1.00, label: '100% - Trẻ em dưới 6 tuổi', description: 'Trẻ em dưới 6 tuổi' },
  'CC': { rate: 0.95, label: '95% - Người có công', description: 'Người có công với cách mạng' },
  'BT': { rate: 1.00, label: '100% - Bảo trợ xã hội', description: 'Đối tượng bảo trợ xã hội' },
  'HT': { rate: 1.00, label: '100% - Hưu trí', description: 'Người hưu trí, nghỉ việc hưởng BHXH' },
  'TC': { rate: 0.80, label: '80% - Tự nguyện', description: 'Người tham gia BHYT tự nguyện' },
  'CK': { rate: 0.95, label: '95% - Cận nghèo', description: 'Hộ cận nghèo' },
  'NG': { rate: 1.00, label: '100% - Hộ nghèo', description: 'Hộ nghèo' },
  'QN': { rate: 1.00, label: '100% - Quân nhân', description: 'Quân nhân, công an' },
  'HC': { rate: 1.00, label: '100% - HSSV', description: 'Học sinh, sinh viên' },
  'GD': { rate: 0.80, label: '80% - Hộ gia đình (người phụ thuộc)', description: 'Người phụ thuộc trong hộ gia đình' },
  'KC': { rate: 0.95, label: '95% - Cận nghèo (KV)', description: 'Hộ cận nghèo khu vực' }
};

// ---- 39 LOẠI XUẤT TOÁN THỰC TẾ - BV ĐKKV PHÚ THỌ QUÝ II/2025 ----
// (Trích xuất từ Google Sheets bản cập nhật - Tổng: 220,692,455 VNĐ)
const REAL_REJECTION_RULES = [
  // === DVKT (22 loại) — Tổng ~203.8M VNĐ ===
  { code: 'DVKT01', category: 'DVKT', title: 'NVYT phát sinh y lệnh khi đang PTTT',
    desc: 'Nhân viên y tế trong thời gian phẫu thuật/thủ thuật có phát sinh y lệnh cho bệnh nhân khác — chiếm 69.7% tổng xuất toán',
    amount: 153835687, keywords: ['phẫu thuật', 'y lệnh', 'trùng thời gian', 'PTTT'], severity: 'critical' },
  { code: 'DVKT02', category: 'DVKT', title: 'Thủy châm không đúng điều kiện',
    desc: 'Thủy châm do Y sỹ, điều dưỡng không phải đại học thực hiện',
    amount: 200460, keywords: ['thủy châm', 'y sỹ', 'điều dưỡng'], severity: 'warning' },
  { code: 'DVKT03', category: 'DVKT', title: 'BS đang điều trị vẫn chỉ định y lệnh',
    desc: 'Bác sĩ đang đi điều trị (nhập viện) vẫn chỉ định y lệnh hoặc thực hiện y lệnh',
    amount: 10747915, keywords: ['bác sĩ', 'điều trị', 'nhập viện'], severity: 'critical' },
  { code: 'DVKT04', category: 'DVKT', title: 'BS ngoại tỉnh vẫn chỉ định y lệnh',
    desc: 'Bác sĩ đang đi KCB ngoại tỉnh vẫn chỉ định y lệnh hoặc thực hiện y lệnh',
    amount: 1476612, keywords: ['ngoại tỉnh', 'bác sĩ', 'y lệnh'], severity: 'critical' },
  { code: 'DVKT05', category: 'DVKT', title: 'BN trùng KCB giữa các cơ sở',
    desc: 'Bệnh nhân trùng KCB giữa các cơ sở khám chữa bệnh',
    amount: 10772589, keywords: ['trùng', 'KCB', 'cơ sở'], severity: 'critical' },
  { code: 'DVKT08', category: 'DVKT', title: 'DVKT không phù hợp giới tính/chẩn đoán',
    desc: 'Chỉ định DVKT không phù hợp (không phù hợp giới tính, không phù hợp chẩn đoán)',
    amount: 90000, keywords: ['giới tính', 'chẩn đoán', 'không phù hợp'], severity: 'critical' },
  { code: 'DVKT09', category: 'DVKT', title: 'CRP hs không phù hợp TT50/2017',
    desc: 'Chỉ định XN Định Lượng CRP (CRP hs) không phù hợp Thông tư 50/2017/TT-BYT',
    amount: 15364440, keywords: ['CRP', 'CRP hs', 'TT50'], severity: 'warning' },
  { code: 'DVKT18', category: 'DVKT', title: 'XN sai thời gian chạy thận',
    desc: 'Chỉ định không đúng thời gian đối với các xét nghiệm trong chạy thận nhân tạo chu kỳ',
    amount: 1034880, keywords: ['chạy thận', 'xét nghiệm', 'thời gian'], severity: 'warning' },
  { code: 'DVKT22', category: 'DVKT', title: 'SA tuyến giáp + SA hạch cổ đồng thời',
    desc: 'Chỉ định đồng thời Siêu âm tuyến giáp và Siêu âm hạch vùng cổ',
    amount: 161150, keywords: ['siêu âm', 'tuyến giáp', 'hạch cổ'], severity: 'warning' },
  { code: 'DVKT23', category: 'DVKT', title: 'X-quang tim phổi + CT/MRI lồng ngực',
    desc: 'Chụp X quang số hóa tim phổi đồng thời với Chụp CT Scanner hoặc MRI lồng ngực',
    amount: 293200, keywords: ['x-quang', 'CT scanner', 'MRI', 'lồng ngực'], severity: 'warning' },
  { code: 'DVKT25', category: 'DVKT', title: 'Cơ sở KCB đẩy BN từ 2 lần trở lên',
    desc: 'Cơ sở KCB đẩy bệnh nhân đến từ 2 lần trở lên',
    amount: 770842, keywords: ['đẩy bệnh nhân', 'KCB'], severity: 'warning' },
  { code: 'DVKT27', category: 'DVKT', title: 'Hút đờm trong quy trình DVKT khác',
    desc: 'Hút đờm đã nằm trong quy trình của dịch vụ kỹ thuật khác, thanh toán trùng',
    amount: 42300, keywords: ['hút đờm', 'quy trình', 'trùng'], severity: 'warning' },
  { code: 'DVKT29', category: 'DVKT', title: 'Khám sức khỏe tổng quát',
    desc: 'Khám sức khỏe tổng quát không thuộc phạm vi thanh toán BHYT',
    amount: 45000, keywords: ['khám sức khỏe', 'tổng quát'], severity: 'critical' },
  { code: 'DVKT31', category: 'DVKT', title: 'CLS trả KQ quá lâu (nội trú)',
    desc: 'Kết quả CLS không phù hợp: thời gian chỉ định và trả KQ quá dài, không phục vụ chẩn đoán',
    amount: 402065, keywords: ['cận lâm sàng', 'thời gian', 'nội trú'], severity: 'warning' },
  { code: 'DVKT32', category: 'DVKT', title: 'CLS trả KQ sau ra viện (ngoại trú)',
    desc: 'Kết quả CLS trả sau ngày ra viện, không phục vụ chẩn đoán (ngoại trú)',
    amount: 293000, keywords: ['cận lâm sàng', 'ra viện', 'ngoại trú'], severity: 'warning' },
  { code: 'DVKT33', category: 'DVKT', title: 'NVYT KCB vượt công suất',
    desc: 'Nhân viên y tế khám chữa bệnh vượt công suất quy định',
    amount: 510750, keywords: ['vượt công suất', 'nhân viên', 'quá tải'], severity: 'critical' },
  { code: 'DVKT35', category: 'DVKT', title: 'Oxy thanh toán đồng thời với Thở máy',
    desc: 'Oxy thanh toán đồng thời với thở máy — chi phí trùng lặp',
    amount: 2425766, keywords: ['oxy', 'thở máy', 'đồng thời'], severity: 'warning' },
  { code: 'DVKT38', category: 'DVKT', title: 'SA ổ bụng đồng thời SA tiết niệu/tử cung',
    desc: 'Siêu âm ổ bụng làm đồng thời với SA hệ tiết niệu, SA tử cung phần phụ qua đường bụng',
    amount: 199240, keywords: ['siêu âm', 'ổ bụng', 'tiết niệu', 'tử cung'], severity: 'warning' },
  { code: 'DVKT47', category: 'DVKT', title: 'Tiền khám bệnh trong chạy thận chu kỳ',
    desc: 'Tiền khám bệnh trong chạy thận nhân tạo chu kỳ — không được thanh toán riêng',
    amount: 294750, keywords: ['khám bệnh', 'chạy thận', 'chu kỳ'], severity: 'warning' },
  { code: 'DVKT49', category: 'DVKT', title: 'Sai ngày giường ngoại khoa sau PT',
    desc: 'Tổng hợp sai ngày giường ngoại khoa sau phẫu thuật không đúng phân loại theo VB 17/VBHN-BYT',
    amount: 405440, keywords: ['ngày giường', 'ngoại khoa', 'phẫu thuật'], severity: 'warning' },
  { code: 'DVKT51', category: 'DVKT', title: 'SA tuyến giáp không nghi ngờ bệnh lý',
    desc: 'Siêu âm tuyến giáp không nghi ngờ bệnh lý tuyến giáp',
    amount: 2449480, keywords: ['siêu âm', 'tuyến giáp', 'bệnh lý'], severity: 'warning' },
  { code: 'DVKT54', category: 'DVKT', title: 'Nội soi TMH không phù hợp',
    desc: 'Nội soi Tai Mũi Họng không phù hợp với chẩn đoán',
    amount: 2077200, keywords: ['nội soi', 'tai mũi họng', 'TMH'], severity: 'warning' },
  // === THUỐC (17 loại) — Tổng ~16.9M VNĐ ===
  { code: 'THUOC_01', category: 'Thuốc', title: 'Galantanin (Nivalin) sai chỉ định',
    desc: 'Chỉ định Galantamin không đúng: chỉ thanh toán điều trị sa sút trí tuệ nhẹ đến trung bình',
    amount: 6347250, keywords: ['galantamin', 'nivalin', 'sa sút trí tuệ'], severity: 'critical' },
  { code: 'THUOC_02', category: 'Thuốc', title: 'Alphachymotrypsin sai TT37',
    desc: 'Chỉ định Alphachymotrypsin không phù hợp Thông tư 37',
    amount: 16080, keywords: ['alphachymotrypsin'], severity: 'warning' },
  { code: 'THUOC_03', category: 'Thuốc', title: 'Azithromycin liều tối đa',
    desc: 'Chỉ định hoạt chất Azithromycin (mã 40) liều dùng tối đa 1500mg',
    amount: 46410, keywords: ['azithromycin', 'liều tối đa'], severity: 'warning' },
  { code: 'THUOC_05', category: 'Thuốc', title: 'Omeprazol sai TT37',
    desc: 'Chỉ định Omeprazol không phù hợp Thông tư 37',
    amount: 46870, keywords: ['omeprazol', 'omeprazole'], severity: 'warning' },
  { code: 'THUOC_06', category: 'Thuốc', title: 'Pantoprazol sai TT37',
    desc: 'Chỉ định hoạt chất Pantoprazol không phù hợp Thông tư 37',
    amount: 3385920, keywords: ['pantoprazol', 'pantoprazole'], severity: 'warning' },
  { code: 'THUOC_07', category: 'Thuốc', title: 'Famotidine sai HDSD',
    desc: 'Chỉ định Famotidine viên hoặc tiêm không đúng tờ hướng dẫn sử dụng',
    amount: 3214800, keywords: ['famotidine'], severity: 'warning' },
  { code: 'THUOC_09', category: 'Thuốc', title: 'Bisoprolol sai HDSD',
    desc: 'Chỉ định hoạt chất Bisoprolol không đúng tờ hướng dẫn sử dụng',
    amount: 2650, keywords: ['bisoprolol'], severity: 'warning' },
  { code: 'THUOC_10', category: 'Thuốc', title: 'Tinh bột ester hóa sai TT37',
    desc: 'Chỉ định Tinh bột ester hóa không phù hợp Thông tư 37',
    amount: 1260765, keywords: ['tinh bột ester'], severity: 'warning' },
  { code: 'THUOC_11', category: 'Thuốc', title: 'Metformin chống chỉ định',
    desc: 'Chỉ định Metformin thuộc trường hợp chống chỉ định trong tờ HDSD thuốc',
    amount: 18795, keywords: ['metformin', 'chống chỉ định'], severity: 'critical' },
  { code: 'THUOC_12', category: 'Thuốc', title: 'Biviantac sai HDSD',
    desc: 'Chỉ định Biviantac (Magnesi hydroxyd + Nhôm hydroxyd + Simethicon) không đúng tờ HDSD',
    amount: 8978, keywords: ['biviantac', 'magnesi', 'nhôm hydroxyd'], severity: 'warning' },
  { code: 'THUOC_13', category: 'Thuốc', title: 'Duotrol/tiểu đường sai HDSD',
    desc: 'Chỉ định thuốc Duotrol và các chế phẩm cùng nhóm tiểu đường không đúng tờ HDSD',
    amount: 53360, keywords: ['duotrol', 'tiểu đường'], severity: 'warning' },
  { code: 'THUOC_14', category: 'Thuốc', title: 'Ebitac chống chỉ định',
    desc: 'Chỉ định thuốc Ebitac thuộc trường hợp chống chỉ định trên tờ HDSD',
    amount: 118730, keywords: ['ebitac', 'chống chỉ định'], severity: 'critical' },
  { code: 'THUOC_15', category: 'Thuốc', title: 'MG-TAN chống chỉ định',
    desc: 'Chỉ định thuốc MG-TAN cho trường hợp chống chỉ định',
    amount: 921375, keywords: ['mg-tan', 'chống chỉ định'], severity: 'critical' },
  { code: 'THUOC_16', category: 'Thuốc', title: 'Piracetam sai TT37',
    desc: 'Chỉ định thuốc Piracetam không phù hợp Thông tư 37',
    amount: 751500, keywords: ['piracetam'], severity: 'warning' },
  { code: 'THUOC_17', category: 'Thuốc', title: 'Silygamma/Sylimarin sai chỉ định',
    desc: 'Chỉ định Silygamma, Carsil 90mg (Sylimarin) không phù hợp với chỉ định trong Tờ HDSD',
    amount: 220605, keywords: ['silygamma', 'carsil', 'sylimarin'], severity: 'warning' },
  { code: 'THUOC_18', category: 'Thuốc', title: 'Xatral/Alfuzosin sai HDSD',
    desc: 'Chỉ định thuốc Xatral, Asiful (Alfuzosin) không đúng tờ HDSD',
    amount: 378000, keywords: ['xatral', 'asiful', 'alfuzosin'], severity: 'warning' },
  { code: 'THUOC_19', category: 'Thuốc', title: 'Melanov-M sai HDSD',
    desc: 'Thuốc Melanov-M, số đăng ký VN-20575-17 không đúng tờ hướng dẫn sử dụng về chỉ định',
    amount: 7600, keywords: ['melanov', 'melanov-m'], severity: 'warning' }
];

// ---- DỮ LIỆU THỐNG KÊ THỰC TẾ Q2/2025 - BV ĐKKV PHÚ THỌ ----
// (Cập nhật từ bản online BHXH mới nhất: 220,692,455 VNĐ)
const REAL_STATS = {
  hospitalCode: '25002',
  hospitalName: 'Bệnh viện Đa khoa Khu vực Phú Thọ',
  period: 'Quý II/2025',
  totalRejectionAmount: 220692455,
  dvktTotal: 203893366,
  thuocTotal: 16799089,
  totalCategories: 39,
  dvktCategories: 22,
  thuocCategories: 17,
  topRejections: [
    { code: 'DVKT01', title: 'NVYT trùng PT', amount: 153835687, percent: 69.7 },
    { code: 'DVKT09', title: 'CRP hs', amount: 15364440, percent: 7.0 },
    { code: 'DVKT05', title: 'BN trùng KCB', amount: 10772589, percent: 4.9 },
    { code: 'DVKT03', title: 'BS đang điều trị', amount: 10747915, percent: 4.9 },
    { code: 'THUOC_01', title: 'Galantanin', amount: 6347250, percent: 2.9 }
  ],
  topDepartments: [
    { name: 'Khoa Ngoại tổng hợp', patients: 235, records: 1022, amount: 54558147 },
    { name: 'Khoa Phụ sản', patients: 105, records: 328, amount: 21949808 },
    { name: 'Khoa Tai Mũi Họng - RHM - Mắt', patients: 62, records: 237, amount: 5801656 }
  ],
  topIcdCodes: ['O82.1', 'H10', 'K35.3', 'J06.0', 'A09.9', 'D23', 'J01.4', 'T07', 'J35.3'],
  topFlaggedServices: [
    'Natri clorid 0,9%', 'Nước cất ống nhựa', 'Senitram 2g/1g',
    'Đo hoạt độ ALT (GPT)', 'Đo hoạt độ AST (GOT)',
    'Tổng phân tích tế bào máu ngoại vi', 'Định lượng Creatinin',
    'Khám Mắt', 'Vitamin AD', 'Ofloxacin 0,3%'
  ]
};

// Export tất cả
window.BHYTData = {
  NON_COVERED_CASES,
  DRUG_CATALOG,
  SERVICE_CATALOG,
  SUPPLY_CATALOG,
  ICD10_CATALOG,
  DISEASE_DRUG_CONFLICTS,
  BED_RULES,
  CONSULTATION_LIMITS,
  DEPARTMENTS,
  REGULATIONS,
  BHYT_COVERAGE_RATES,
  REAL_REJECTION_RULES,
  REAL_STATS
};
