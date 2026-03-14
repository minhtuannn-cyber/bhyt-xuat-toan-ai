// ============================================================
// RULES ENGINE - Hệ thống Cảnh báo Xuất Toán BHYT Thông minh
// AI-powered Rule Engine with Risk Scoring
// ============================================================

class BHYTRulesEngine {
  constructor() {
    this.data = window.BHYTData;
    this.warnings = [];
    this.riskScore = 0;
  }

  // ========== MAIN CHECK ==========
  checkClaim(claim) {
    this.warnings = [];
    this.riskScore = 0;

    // Run all rule groups
    this.checkInsuranceCard(claim);
    this.checkNonCoveredCases(claim);
    this.checkDrugs(claim);
    this.checkServices(claim);
    this.checkSupplies(claim);
    this.checkBedDays(claim);
    this.checkDocumentation(claim);
    this.checkConsultationLimits(claim);
    this.checkTotalCost(claim);
    this.checkDuplicates(claim);
    // Real BHXH rejection rules
    this.checkRealDrugRules(claim);
    this.checkConcurrentServices(claim);
    this.checkStaffConflicts(claim);

    // Calculate overall risk score
    this.calculateRiskScore();

    return {
      warnings: this.warnings,
      riskScore: this.riskScore,
      riskLevel: this.getRiskLevel(),
      totalWarnings: this.warnings.length,
      criticalCount: this.warnings.filter(w => w.severity === 'critical').length,
      warningCount: this.warnings.filter(w => w.severity === 'warning').length,
      infoCount: this.warnings.filter(w => w.severity === 'info').length,
      timestamp: new Date().toISOString()
    };
  }

  // ========== RULE GROUP 1: INSURANCE CARD ==========
  checkInsuranceCard(claim) {
    if (!claim.cardNumber) {
      this.addWarning('critical', 'CARD_01', 'Thiếu số thẻ BHYT',
        'Hồ sơ không có số thẻ BHYT. Không thể thanh toán BHYT.',
        'Bổ sung số thẻ BHYT của bệnh nhân.', 'Thẻ BHYT');
      return;
    }

    // Validate card format (2 ký tự chữ + 1 số + 12 ký tự)
    const cardPattern = /^[A-Z]{2}\d{1}\d{12}$/;
    if (!cardPattern.test(claim.cardNumber.replace(/\s/g, ''))) {
      this.addWarning('warning', 'CARD_02', 'Mã thẻ BHYT không đúng định dạng',
        `Mã thẻ "${claim.cardNumber}" không đúng định dạng chuẩn (2 chữ + 1 số + 12 số). Có thể bị xuất toán do sai thông tin thẻ.`,
        'Kiểm tra lại mã thẻ BHYT với bệnh nhân.', 'Thẻ BHYT');
    }

    // Check card expiry
    if (claim.cardExpiry) {
      const expiry = new Date(claim.cardExpiry);
      const visitDate = claim.visitDate ? new Date(claim.visitDate) : new Date();
      if (expiry < visitDate) {
        this.addWarning('critical', 'CARD_03', 'Thẻ BHYT đã hết hạn',
          `Thẻ BHYT hết hạn ngày ${this.formatDate(expiry)}, nhưng ngày KCB là ${this.formatDate(visitDate)}.`,
          'Yêu cầu bệnh nhân gia hạn thẻ BHYT trước khi thanh toán.', 'Thẻ BHYT');
      }
    }

    // Check visiting correct facility
    if (claim.registeredFacility && claim.visitType === 'outpatient') {
      const registeredLower = (claim.registeredFacility || '').toLowerCase();
      if (!registeredLower.includes('phú thọ') && !registeredLower.includes('phu tho') && !claim.hasReferral) {
        this.addWarning('warning', 'CARD_04', 'Có thể KCB trái tuyến',
          `Nơi đăng ký KCB ban đầu: "${claim.registeredFacility}". Bệnh nhân KCB ngoại trú tại BV ĐKKV Phú Thọ có thể trái tuyến.`,
          'Kiểm tra giấy chuyển tuyến. Nếu không có, bệnh nhân chỉ được hưởng tỷ lệ KCB trái tuyến.', 'Thẻ BHYT');
      }
    }
  }

  // ========== RULE GROUP 2: NON-COVERED CASES (12 trường hợp) ==========
  checkNonCoveredCases(claim) {
    const diagnosisLower = (claim.diagnosis || '').toLowerCase();
    const servicesText = (claim.services || []).map(s => s.name.toLowerCase()).join(' ');
    const combinedText = `${diagnosisLower} ${servicesText}`;

    this.data.NON_COVERED_CASES.forEach(nc => {
      const matched = nc.keywords.some(kw => combinedText.includes(kw.toLowerCase()));
      if (matched) {
        this.addWarning('critical', `NC_${nc.id}`, `Trường hợp không thanh toán: ${nc.title}`,
          nc.description,
          'Hồ sơ có dấu hiệu thuộc trường hợp không được BHYT thanh toán theo Luật BHYT sửa đổi 2024. Cần xem xét lại trước khi gửi lên cổng BHXH.',
          'Quy định');
      }
    });
  }

  // ========== RULE GROUP 3: DRUGS ==========
  checkDrugs(claim) {
    if (!claim.drugs || claim.drugs.length === 0) return;

    // Check if ICD code exists on prescription
    if (!claim.icdCode) {
      this.addWarning('critical', 'DRUG_01', 'Đơn thuốc thiếu mã bệnh ICD-10',
        'Đơn thuốc không có mã bệnh ICD-10. Đây là lỗi xuất toán phổ biến nhất trong điều trị ngoại trú.',
        'Bổ sung mã bệnh ICD-10 lên đơn thuốc trước khi thanh toán.', 'Thuốc');
    }

    claim.drugs.forEach((drug, index) => {
      // Find drug in catalog
      const catalogDrug = this.data.DRUG_CATALOG.find(d =>
        d.code === drug.code || d.name.toLowerCase() === (drug.name || '').toLowerCase()
      );

      // Check if drug is in BHYT catalog
      if (catalogDrug && !catalogDrug.bhytCovered) {
        this.addWarning('critical', `DRUG_02_${index}`, `Thuốc ngoài danh mục BHYT: ${drug.name || drug.code}`,
          `"${catalogDrug.name}" không thuộc danh mục thuốc được BHYT thanh toán.`,
          'Thay thế bằng thuốc tương đương trong danh mục BHYT hoặc thông báo bệnh nhân tự chi trả.', 'Thuốc');
      }

      // Check price ceiling
      if (catalogDrug && drug.price > catalogDrug.maxPrice) {
        const overAmount = drug.price - catalogDrug.maxPrice;
        this.addWarning('warning', `DRUG_03_${index}`, `Giá thuốc vượt trần: ${drug.name || drug.code}`,
          `Giá kê: ${this.formatCurrency(drug.price)}/đơn vị. Giá trần BHYT: ${this.formatCurrency(catalogDrug.maxPrice)}/đơn vị. Vượt: ${this.formatCurrency(overAmount)}.`,
          'Điều chỉnh giá theo giá trúng thầu hoặc giá trần quy định.', 'Thuốc');
      }

      // Check contraindications
      if (catalogDrug && claim.icdCode) {
        const conflicts = this.data.DISEASE_DRUG_CONFLICTS.filter(c =>
          c.diseaseCode === claim.icdCode && c.drugCodes.includes(catalogDrug.code)
        );
        conflicts.forEach(conflict => {
          this.addWarning('critical', `DRUG_04_${index}`, `Chống chỉ định: ${drug.name || drug.code}`,
            `${conflict.reason}. Kê thuốc chống chỉ định là lỗi nghiêm trọng, ảnh hưởng đến sức khỏe bệnh nhân và chắc chắn bị xuất toán.`,
            'Thay đổi thuốc phù hợp với tình trạng bệnh lý của bệnh nhân.', 'Thuốc');
        });
      }

      // Check quantity reasonableness
      if (drug.quantity && drug.quantity > 90 && claim.visitType === 'outpatient') {
        this.addWarning('info', `DRUG_05_${index}`, `Số lượng thuốc lớn: ${drug.name || drug.code}`,
          `Kê ${drug.quantity} ${catalogDrug ? catalogDrug.unit : 'đơn vị'} cho điều trị ngoại trú. Số lượng lớn cần có lý do hợp lý.`,
          'Kiểm tra lại số lượng kê. Ngoại trú thường kê tối đa 30 ngày dùng thuốc.', 'Thuốc');
      }
    });
  }

  // ========== RULE GROUP 4: SERVICES ==========
  checkServices(claim) {
    if (!claim.services || claim.services.length === 0) return;

    claim.services.forEach((service, index) => {
      const catalogService = this.data.SERVICE_CATALOG.find(s =>
        s.code === service.code || s.name.toLowerCase() === (service.name || '').toLowerCase()
      );

      // Check price ceiling
      if (catalogService && service.price > catalogService.maxPrice) {
        const overAmount = service.price - catalogService.maxPrice;
        this.addWarning('warning', `SVC_01_${index}`, `Giá DVKT vượt trần: ${service.name || service.code}`,
          `Giá kê: ${this.formatCurrency(service.price)}. Giá trần: ${this.formatCurrency(catalogService.maxPrice)}. Vượt: ${this.formatCurrency(overAmount)}.`,
          'Điều chỉnh giá dịch vụ theo mức trần quy định.', 'DVKT');
      }

      // Check service level appropriateness
      if (catalogService && catalogService.level === 'central') {
        this.addWarning('warning', `SVC_02_${index}`, `DVKT vượt phạm vi chuyên môn: ${service.name || service.code}`,
          `"${catalogService.name}" là DVKT cấp trung ương. BV ĐKKV Phú Thọ (tuyến tỉnh) có thể không đủ thẩm quyền thực hiện.`,
          'Xác nhận BV đã được phê duyệt thực hiện DVKT này. Nếu không, chuyển bệnh nhân lên tuyến trên.', 'DVKT');
      }
    });

    // Check for duplicate services
    const serviceNames = claim.services.map(s => s.name || s.code);
    const duplicates = serviceNames.filter((s, i) => serviceNames.indexOf(s) !== i);
    if (duplicates.length > 0) {
      this.addWarning('warning', 'SVC_03', 'Dịch vụ trùng lặp',
        `Phát hiện dịch vụ trùng lặp: ${[...new Set(duplicates)].join(', ')}.`,
        'Kiểm tra lại chỉ định. Dịch vụ trùng lặp sẽ bị BHXH từ chối thanh toán.', 'DVKT');
    }
  }

  // ========== RULE GROUP 5: SUPPLIES ==========
  checkSupplies(claim) {
    if (!claim.supplies || claim.supplies.length === 0) return;

    claim.supplies.forEach((supply, index) => {
      const catalogSupply = this.data.SUPPLY_CATALOG.find(s =>
        s.code === supply.code || s.name.toLowerCase() === (supply.name || '').toLowerCase()
      );

      // Check if supply can be paid separately (inpatient only)
      if (catalogSupply && !catalogSupply.paidSeparately && claim.visitType === 'inpatient') {
        this.addWarning('info', `SUP_01_${index}`, `VTYT không thanh toán riêng: ${supply.name || supply.code}`,
          `"${catalogSupply.name}" là VTYT không được thanh toán riêng trong điều trị nội trú. Chi phí đã bao gồm trong phí giường bệnh.`,
          'Không kê riêng VTYT này. Đây là lỗi xuất toán nội trú phổ biến.', 'VTYT');
      }

      // Check price ceiling
      if (catalogSupply && supply.price > catalogSupply.maxPrice) {
        this.addWarning('warning', `SUP_02_${index}`, `Giá VTYT vượt trần: ${supply.name || supply.code}`,
          `Giá kê: ${this.formatCurrency(supply.price)}. Giá trần: ${this.formatCurrency(catalogSupply.maxPrice)}.`,
          'Điều chỉnh giá theo giá trúng thầu hoặc giá trần.', 'VTYT');
      }
    });
  }

  // ========== RULE GROUP 6: BED DAYS ==========
  checkBedDays(claim) {
    if (claim.visitType !== 'inpatient' || !claim.bed) return;

    const bedRule = this.data.BED_RULES[claim.bed.type];
    if (!bedRule) return;

    // Check bed price
    if (claim.bed.pricePerDay > bedRule.maxPrice) {
      this.addWarning('warning', 'BED_01', 'Giá giường vượt trần',
        `Giá giường ${bedRule.name}: ${this.formatCurrency(claim.bed.pricePerDay)}/ngày. Trần: ${this.formatCurrency(bedRule.maxPrice)}/ngày.`,
        'Điều chỉnh giá giường theo mức trần quy định.', 'Giường bệnh');
    }

    // Check max days for special beds
    if (bedRule.maxDays && claim.bed.days > bedRule.maxDays) {
      this.addWarning('warning', 'BED_02', 'Số ngày giường vượt quy định',
        `${bedRule.name}: ${claim.bed.days} ngày, tối đa cho phép: ${bedRule.maxDays} ngày.`,
        'Chuyển bệnh nhân sang loại giường phù hợp hoặc có giải trình lý do.', 'Giường bệnh');
    }

    // Check admission/discharge date reasonableness
    if (claim.admissionDate && claim.dischargeDate) {
      const admission = new Date(claim.admissionDate);
      const discharge = new Date(claim.dischargeDate);
      const days = Math.ceil((discharge - admission) / (1000 * 60 * 60 * 24));

      if (days !== claim.bed.days) {
        this.addWarning('warning', 'BED_03', 'Số ngày giường không khớp thời gian nằm viện',
          `Ngày vào: ${this.formatDate(admission)}, Ngày ra: ${this.formatDate(discharge)} = ${days} ngày. Kê: ${claim.bed.days} ngày.`,
          'Kiểm tra lại số ngày giường kê với thời gian nằm viện thực tế.', 'Giường bệnh');
      }
    }
  }

  // ========== RULE GROUP 7: DOCUMENTATION ==========
  checkDocumentation(claim) {
    // Check ICD code validity
    if (claim.icdCode) {
      const validICD = this.data.ICD10_CATALOG.find(icd => icd.code === claim.icdCode);
      if (!validICD) {
        this.addWarning('info', 'DOC_01', 'Mã ICD-10 không có trong danh mục phổ biến',
          `Mã ICD-10 "${claim.icdCode}" không thuộc danh mục phổ biến. Cần xác nhận tính hợp lệ.`,
          'Kiểm tra mã ICD-10 trong bảng phân loại quốc tế.', 'Hồ sơ');
      }
    }

    // Check if diagnosis exists
    if (!claim.diagnosis) {
      this.addWarning('warning', 'DOC_02', 'Thiếu chẩn đoán bệnh',
        'Hồ sơ không có chẩn đoán bệnh. Đây là thông tin bắt buộc cho thanh toán BHYT.',
        'Bổ sung chẩn đoán bệnh vào hồ sơ KCB.', 'Hồ sơ');
    }

    // Check department
    if (!claim.department) {
      this.addWarning('info', 'DOC_03', 'Thiếu thông tin khoa điều trị',
        'Hồ sơ không ghi rõ khoa điều trị.',
        'Bổ sung thông tin khoa điều trị.', 'Hồ sơ');
    }
  }

  // ========== RULE GROUP 8: CONSULTATION LIMITS ==========
  checkConsultationLimits(claim) {
    if (claim.visitType !== 'outpatient') return;

    // Check if second visit same day
    if (claim.isSecondVisitSameDay) {
      this.addWarning('info', 'CONSULT_01', 'Lượt khám thứ 2 trở đi cùng ngày',
        `Bệnh nhân khám lần thứ 2 trở đi trong cùng ngày. Theo TT39/2024, chỉ tính 30% giá một lần khám (${this.formatCurrency(Math.round(39000 * 0.3))}).`,
        'Đảm bảo hệ thống tính đúng 30% giá khám cho lượt khám tiếp theo.', 'Khám bệnh');
    }

    // Check desk consultation volume
    if (claim.deskVisitsToday && claim.deskVisitsToday > this.data.CONSULTATION_LIMITS.maxPerDesk) {
      this.addWarning('critical', 'CONSULT_02', 'Vượt giới hạn 65 lượt khám/bàn/ngày',
        `Bàn khám đã đạt ${claim.deskVisitsToday} lượt/ngày, vượt giới hạn 65 lượt/bàn/ngày (TT39/2024). BHXH sẽ không thanh toán từ lượt thứ 66.`,
        'Phân bổ bệnh nhân sang bàn khám khác hoặc hẹn ngày khác.', 'Khám bệnh');
    }
  }

  // ========== RULE GROUP 9: TOTAL COST ==========
  checkTotalCost(claim) {
    let totalCost = 0;
    
    // Sum drug costs
    if (claim.drugs) {
      claim.drugs.forEach(d => { totalCost += (d.price || 0) * (d.quantity || 1); });
    }
    // Sum service costs
    if (claim.services) {
      claim.services.forEach(s => { totalCost += (s.price || 0) * (s.quantity || 1); });
    }
    // Sum supply costs
    if (claim.supplies) {
      claim.supplies.forEach(s => { totalCost += (s.price || 0) * (s.quantity || 1); });
    }
    // Sum bed costs
    if (claim.bed) {
      totalCost += (claim.bed.pricePerDay || 0) * (claim.bed.days || 0);
    }

    claim._totalCost = totalCost;

    // Flag unusually high outpatient costs
    if (claim.visitType === 'outpatient' && totalCost > 5000000) {
      this.addWarning('warning', 'COST_01', 'Chi phí ngoại trú cao bất thường',
        `Tổng chi phí ngoại trú: ${this.formatCurrency(totalCost)}. Mức trung bình ngoại trú thường dưới 5 triệu đồng.`,
        'Xem xét lại các chỉ định. Chi phí cao bất thường có thể bị giám định viên BHXH kiểm tra.', 'Chi phí');
    }

    // Flag unusually high inpatient costs
    if (claim.visitType === 'inpatient' && totalCost > 50000000) {
      this.addWarning('info', 'COST_02', 'Chi phí nội trú cao',
        `Tổng chi phí nội trú: ${this.formatCurrency(totalCost)}. Cần đảm bảo đầy đủ hồ sơ, chứng từ cho tất cả chi phí.`,
        'Chuẩn bị đầy đủ hồ sơ giải trình nếu BHXH yêu cầu giám định.', 'Chi phí');
    }
  }

  // ========== RULE GROUP 10: DUPLICATES & PATTERNS ==========
  checkDuplicates(claim) {
    // Check for suspiciously frequent visits (from history)
    if (claim.visitHistory && claim.visitHistory.length >= 3) {
      const recentVisits = claim.visitHistory.filter(v => {
        const visitDate = new Date(v.date);
        const now = new Date();
        const diffDays = (now - visitDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      });

      if (recentVisits.length >= 3) {
        this.addWarning('warning', 'PATTERN_01', 'Tần suất KCB bất thường',
          `Bệnh nhân đã khám ${recentVisits.length} lần trong 7 ngày gần nhất. Có thể bị BHXH giám định.`,
          'Kiểm tra lý do khám bệnh nhiều lần. Đảm bảo đầy đủ bệnh án để giải trình.', 'Mẫu hình');
      }
    }
  }

  // ========== RULE GROUP 11: REAL DRUG RULES (BHXH Phú Thọ) ==========
  checkRealDrugRules(claim) {
    if (!claim.drugs || claim.drugs.length === 0) return;
    const rules = (this.data.REAL_REJECTION_RULES || []).filter(r => r.category === 'Thuốc');
    const diagLower = (claim.diagnosis || '').toLowerCase();
    const icd = claim.icdCode || '';

    claim.drugs.forEach((drug, idx) => {
      const drugName = (drug.name || '').toLowerCase();
      rules.forEach(rule => {
        const matched = rule.keywords.some(kw => drugName.includes(kw.toLowerCase()));
        if (!matched) return;

        // Specific contraindication checks
        if (rule.code === 'THUOC_11' && drugName.includes('metformin')) {
          // Metformin: chống chỉ định bệnh thận, gan, suy tim
          if (/N18|K7[0-7]|I50|suy thận|suy gan|suy tim/i.test(diagLower + ' ' + icd)) {
            this.addWarning('critical', `REAL_${rule.code}_${idx}`,
              `⚠️ [${rule.code}] ${rule.title}: ${drug.name}`,
              `${rule.desc}. BN có chẩn đoán "${claim.diagnosis}" — Metformin chống chỉ định. BHXH đã xuất toán ${this.formatCurrency(rule.amount)} Q2/2025.`,
              'Thay thế Metformin bằng thuốc tiểu đường khác phù hợp.', 'Thuốc');
          }
        } else if (rule.code === 'THUOC_14' && drugName.includes('ebitac')) {
          if (/chống chỉ định|suy gan|suy thận/i.test(diagLower)) {
            this.addWarning('critical', `REAL_${rule.code}_${idx}`,
              `⚠️ [${rule.code}] ${rule.title}: ${drug.name}`,
              `${rule.desc}. BHXH đã xuất toán ${this.formatCurrency(rule.amount)} Q2/2025.`,
              'Kiểm tra tờ HDSD và đối chiếu chống chỉ định.', 'Thuốc');
          }
        } else if (rule.code === 'THUOC_15' && drugName.includes('mg-tan')) {
          this.addWarning('critical', `REAL_${rule.code}_${idx}`,
            `⚠️ [${rule.code}] ${rule.title}: ${drug.name}`,
            `${rule.desc}. BHXH đã xuất toán ${this.formatCurrency(rule.amount)} Q2/2025.`,
            'Kiểm tra chống chỉ định trên tờ HDSD thuốc.', 'Thuốc');
        } else if (['THUOC_06','THUOC_05','THUOC_10','THUOC_16'].includes(rule.code)) {
          // Thuốc sai TT37: cảnh báo chung
          this.addWarning('warning', `REAL_${rule.code}_${idx}`,
            `📋 [${rule.code}] ${rule.title}: ${drug.name}`,
            `${rule.desc}. BHXH đã xuất toán ${this.formatCurrency(rule.amount)} Q2/2025. Cần đối chiếu Thông tư 37.`,
            'Kiểm tra chỉ định có phù hợp Thông tư 37/TT-BYT không.', 'Thuốc');
        } else if (rule.code === 'THUOC_01' && drugName.includes('galantam')) {
          // Galantamin: chỉ cho Alzheimer
          if (!/alzheimer|sa sút trí tuệ|F00|G30/i.test(diagLower + ' ' + icd)) {
            this.addWarning('critical', `REAL_${rule.code}_${idx}`,
              `⚠️ [${rule.code}] ${rule.title}: ${drug.name}`,
              `Galantamin chỉ được BHYT thanh toán cho sa sút trí tuệ Alzheimer (F00/G30). Chẩn đoán hiện tại: "${claim.diagnosis}". BHXH đã xuất toán ${this.formatCurrency(rule.amount)} Q2/2025.`,
              'Chỉ kê Galantamin cho bệnh nhân Alzheimer có ICD F00/G30.', 'Thuốc');
          }
        } else {
          // Generic drug warning for other matched rules
          this.addWarning(rule.severity === 'critical' ? 'critical' : 'warning',
            `REAL_${rule.code}_${idx}`,
            `📋 [${rule.code}] ${rule.title}: ${drug.name}`,
            `${rule.desc}. BHXH đã xuất toán ${this.formatCurrency(rule.amount)} Q2/2025.`,
            'Kiểm tra tờ HDSD thuốc và đối chiếu chỉ định với chẩn đoán.', 'Thuốc');
        }
      });
    });
  }

  // ========== RULE GROUP 12: CONCURRENT SERVICES (BHXH Phú Thọ) ==========
  checkConcurrentServices(claim) {
    if (!claim.services || claim.services.length < 2) return;
    const svcText = claim.services.map(s => (s.name || '').toLowerCase()).join('||');
    const diagLower = (claim.diagnosis || '').toLowerCase();
    const icd = claim.icdCode || '';

    // DVKT22: SA tuyến giáp + SA hạch cổ
    if (/siêu âm.*tuyến giáp|sa.*tuyến giáp/i.test(svcText) && /siêu âm.*hạch|sa.*hạch/i.test(svcText)) {
      this.addWarning('warning', 'REAL_DVKT22', '📋 [DVKT22] SA tuyến giáp + SA hạch cổ đồng thời',
        'Chỉ định đồng thời SA tuyến giáp và SA hạch vùng cổ — BHXH xuất toán 161.150đ Q2/2025.',
        'Chỉ nên chỉ định 1 trong 2, hoặc có giải trình lâm sàng.', 'DVKT');
    }
    // DVKT23: X-quang + CT/MRI lồng ngực
    if (/x.?quang.*tim|x.?quang.*phổi|x.?quang.*ngực/i.test(svcText) && /ct.*ngực|mri.*ngực|ct.*lồng|mri.*lồng/i.test(svcText)) {
      this.addWarning('warning', 'REAL_DVKT23', '📋 [DVKT23] X-quang tim phổi + CT/MRI lồng ngực',
        'X-quang tim phổi đồng thời với CT/MRI lồng ngực — trùng lặp. BHXH xuất toán 293.200đ Q2/2025.',
        'CT/MRI đã bao gồm thông tin X-quang. Bỏ X-quang nếu đã có CT/MRI.', 'DVKT');
    }
    // DVKT35: Oxy + Thở máy
    if (/oxy/i.test(svcText) && /thở máy|ventilat/i.test(svcText)) {
      this.addWarning('warning', 'REAL_DVKT35', '📋 [DVKT35] Oxy + Thở máy đồng thời',
        'Oxy thanh toán đồng thời với thở máy — chi phí trùng. BHXH xuất toán 2.425.766đ Q2/2025.',
        'Thở máy đã bao gồm oxy. Không thanh toán riêng.', 'DVKT');
    }
    // DVKT38: SA ổ bụng + SA tiết niệu/tử cung
    if (/siêu âm.*ổ bụng|sa.*ổ bụng/i.test(svcText) && /siêu âm.*tiết niệu|siêu âm.*tử cung|sa.*tiết niệu|sa.*tử cung/i.test(svcText)) {
      this.addWarning('warning', 'REAL_DVKT38', '📋 [DVKT38] SA ổ bụng + SA tiết niệu/tử cung',
        'SA ổ bụng đồng thời SA tiết niệu/tử cung qua đường bụng — trùng lặp. BHXH xuất toán 199.240đ Q2/2025.',
        'SA ổ bụng đã bao gồm quan sát tiết niệu/tử cung. Chỉ kê 1.', 'DVKT');
    }
    // DVKT27: Hút đờm trùng quy trình
    if (/hút đờm/i.test(svcText)) {
      this.addWarning('info', 'REAL_DVKT27', '📋 [DVKT27] Hút đờm có thể trùng quy trình DVKT',
        'Hút đờm có thể đã nằm trong quy trình DVKT khác. BHXH xuất toán 42.300đ Q2/2025.',
        'Kiểm tra hút đờm có nằm trong quy trình DVKT đang thực hiện không.', 'DVKT');
    }
    // DVKT09: CRP hs
    if (/crp|c.?reactive/i.test(svcText)) {
      this.addWarning('warning', 'REAL_DVKT09', '⚠️ [DVKT09] CRP hs — cần kiểm tra TT50/2017',
        'Chỉ định CRP hs cần phù hợp TT50/2017/TT-BYT. Đây là lỗi xuất toán lớn thứ 2: 15.364.440đ Q2/2025.',
        'Đảm bảo CRP hs có đủ 2 điều kiện theo Khoản 4 Điều 17 TT50.', 'DVKT');
    }
    // DVKT51: SA tuyến giáp không nghi ngờ bệnh lý
    if (/siêu âm.*tuyến giáp|sa.*tuyến giáp/i.test(svcText)) {
      if (!/tuyến giáp|bướu|giáp|E0[0-7]|thyroid/i.test(diagLower + ' ' + icd)) {
        this.addWarning('warning', 'REAL_DVKT51', '📋 [DVKT51] SA tuyến giáp không nghi ngờ bệnh lý',
          'SA tuyến giáp khi chẩn đoán không liên quan tuyến giáp. BHXH xuất toán 2.449.480đ Q2/2025.',
          'Chỉ chỉ định SA tuyến giáp khi có nghi ngờ bệnh lý tuyến giáp.', 'DVKT');
      }
    }
    // DVKT54: Nội soi TMH
    if (/nội soi.*tai|nội soi.*mũi|nội soi.*họng|nội soi.*tmh/i.test(svcText)) {
      if (!/tai|mũi|họng|amidan|J3[0-9]|H6[0-9]|J0[0-6]/i.test(diagLower + ' ' + icd)) {
        this.addWarning('warning', 'REAL_DVKT54', '📋 [DVKT54] Nội soi TMH không phù hợp chẩn đoán',
          'Nội soi TMH khi chẩn đoán không liên quan TMH. BHXH xuất toán 2.077.200đ Q2/2025.',
          'Chỉ chỉ định nội soi TMH khi chẩn đoán liên quan tai, mũi, họng.', 'DVKT');
      }
    }
  }

  // ========== RULE GROUP 13: STAFF CONFLICTS (BHXH Phú Thọ) ==========
  checkStaffConflicts(claim) {
    const dept = (claim.department || '').toLowerCase();
    const icd = claim.icdCode || '';
    const visitType = claim.visitType || '';

    // DVKT01: Cảnh báo nguy cơ trùng lịch PT — lỗi lớn nhất (153.8M, 69.7%)
    if (visitType === 'inpatient' && /ngoại|phẫu thuật|phụ sản|sản/i.test(dept)) {
      this.addWarning('info', 'REAL_DVKT01', '🚨 [DVKT01] Kiểm tra trùng lịch phẫu thuật',
        'Khoa Ngoại/Phụ sản là nơi bị xuất toán nhiều nhất do NVYT phát sinh y lệnh khi đang PTTT. Lỗi này chiếm 69.7% tổng xuất toán (153.835.687đ Q2/2025).',
        'Đối chiếu lịch mổ của BS chỉ định với thời gian y lệnh. Đảm bảo BS không đang trong ca mổ.', 'DVKT');
    }
    // DVKT33: Vượt công suất
    this.addWarning('info', 'REAL_DVKT33', '📋 [DVKT33] Lưu ý công suất khám',
      'BHXH kiểm tra NVYT vượt công suất. Xuất toán 510.750đ Q2/2025.',
      'Đảm bảo mỗi BS không khám quá 65 lượt/ngày. Kiểm tra log hệ thống.', 'DVKT');
    // DVKT29: Khám sức khỏe tổng quát
    if (/khám sức khỏe|tổng quát|health check/i.test((claim.diagnosis || '') + ' ' + (claim.services || []).map(s => s.name).join(' '))) {
      this.addWarning('critical', 'REAL_DVKT29', '⚠️ [DVKT29] Khám sức khỏe tổng quát',
        'Khám sức khỏe tổng quát KHÔNG thuộc phạm vi thanh toán BHYT. BHXH xuất toán 45.000đ Q2/2025.',
        'Không thanh toán BHYT cho khám sức khỏe tổng quát. BN tự chi trả.', 'DVKT');
    }
    // DVKT49: Sai ngày giường ngoại khoa
    if (visitType === 'inpatient' && claim.bed && /ngoại/i.test(dept)) {
      if (claim.bed.type === 'surgery' || /phẫu thuật/i.test(dept)) {
        this.addWarning('info', 'REAL_DVKT49', '📋 [DVKT49] Kiểm tra ngày giường ngoại khoa sau PT',
          'BHXH kiểm tra phân loại giường ngoại khoa theo VB 17/VBHN-BYT. Xuất toán 405.440đ Q2/2025.',
          'Đối chiếu loại giường với phân loại phẫu thuật (loại 1/2/3/đặc biệt).', 'Giường bệnh');
      }
    }
  }

  // ========== HELPER METHODS ==========
  addWarning(severity, code, title, description, recommendation, category) {
    this.warnings.push({
      severity,
      code,
      title,
      description,
      recommendation,
      category,
      timestamp: new Date().toISOString()
    });
  }

  calculateRiskScore() {
    let score = 0;
    this.warnings.forEach(w => {
      switch (w.severity) {
        case 'critical': score += 30; break;
        case 'warning': score += 15; break;
        case 'info': score += 5; break;
      }
    });
    this.riskScore = Math.min(100, score);
  }

  getRiskLevel() {
    if (this.riskScore >= 70) return { level: 'critical', label: 'RỦI RO RẤT CAO', color: '#ff3b5c' };
    if (this.riskScore >= 40) return { level: 'high', label: 'RỦI RO CAO', color: '#ff9500' };
    if (this.riskScore >= 15) return { level: 'medium', label: 'CẦN XEM XÉT', color: '#ffd60a' };
    return { level: 'low', label: 'AN TOÀN', color: '#30d158' };
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }

  formatDate(date) {
    return new Intl.DateTimeFormat('vi-VN').format(date);
  }
}

// Export
window.BHYTRulesEngine = BHYTRulesEngine;
