// ============================================================
// APP MODULE - Hệ thống Cảnh báo Xuất Toán BHYT Thông minh
// Main Application Controller
// ============================================================

const App = {
  engine: null,
  currentResult: null,
  history: [],
  charts: {},
  drugCounter: 0,
  serviceCounter: 0,
  supplyCounter: 0,

  // ========== INITIALIZATION ==========
  init() {
    try { this.engine = new BHYTRulesEngine(); } catch(e) { console.error('init engine:', e); }
    try { this.loadHistory(); } catch(e) { console.error('init loadHistory:', e); }
    try { this.initTabs(); } catch(e) { console.error('init tabs:', e); }
    try { this.initForm(); } catch(e) { console.error('init form:', e); }
    try { this.initDropdowns(); } catch(e) { console.error('init dropdowns:', e); }
    try { this.initRegulations(); } catch(e) { console.error('init regulations:', e); }
    try { this.initCharts(); } catch(e) { console.error('init charts:', e); }
    try { this.initRealStats(); } catch(e) { console.error('init realStats:', e); }
    try { this.updateDashboard(); } catch(e) { console.error('init dashboard:', e); }

    // Set default visit date to today
    try { document.getElementById('visitDate').valueAsDate = new Date(); } catch(e) {}
  },

  // ========== TAB NAVIGATION ==========
  initTabs() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
      });
    });
  },

  switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(c => {
      c.classList.toggle('active', c.id === `tab-${tabName}`);
    });
  },

  // ========== FORM INITIALIZATION ==========
  initForm() {
    // Form submit handler
    document.getElementById('claimForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.analyzeClaim();
    });

    // Toggle inpatient fields
    document.getElementById('visitType').addEventListener('change', (e) => {
      document.getElementById('inpatientFields').style.display =
        e.target.value === 'inpatient' ? 'block' : 'none';
    });

    // Auto-fill diagnosis on ICD select
    document.getElementById('icdCode').addEventListener('change', (e) => {
      const icd = BHYTData.ICD10_CATALOG.find(i => i.code === e.target.value);
      if (icd) {
        document.getElementById('diagnosis').value = icd.name;
      }
    });
  },

  // ========== DROPDOWN INITIALIZATION ==========
  initDropdowns() {
    // BHYT types
    const bhytSelect = document.getElementById('bhytType');
    Object.entries(BHYTData.BHYT_COVERAGE_RATES).forEach(([key, val]) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = val.label;
      bhytSelect.appendChild(opt);
    });

    // Departments
    const deptSelect = document.getElementById('department');
    BHYTData.DEPARTMENTS.forEach(dept => {
      const opt = document.createElement('option');
      opt.value = dept;
      opt.textContent = dept;
      deptSelect.appendChild(opt);
    });

    // ICD-10 datalist
    const icdList = document.getElementById('icdList');
    BHYTData.ICD10_CATALOG.forEach(icd => {
      const opt = document.createElement('option');
      opt.value = icd.code;
      opt.label = `${icd.code} - ${icd.name}`;
      icdList.appendChild(opt);
    });
  },

  // ========== DYNAMIC LIST MANAGEMENT ==========
  addDrug() {
    this.drugCounter++;
    const id = this.drugCounter;
    const container = document.getElementById('drugList');
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.id = `drug-${id}`;
    div.innerHTML = `
      <div class="form-group">
        <label class="form-label">Tên thuốc</label>
        <input type="text" class="form-input drug-name" list="drugCatalogList" placeholder="Ví dụ: Amoxicillin 500mg" data-id="${id}">
        <datalist id="drugCatalogList">
          ${BHYTData.DRUG_CATALOG.map(d => `<option value="${d.name}" label="${d.code} - ${d.name}">`).join('')}
        </datalist>
      </div>
      <div class="form-group">
        <label class="form-label">Mã thuốc</label>
        <input type="text" class="form-input drug-code" placeholder="T001" data-id="${id}">
      </div>
      <div class="form-group">
        <label class="form-label">Số lượng</label>
        <input type="number" class="form-input drug-qty" min="1" value="1" data-id="${id}">
      </div>
      <div class="form-group">
        <label class="form-label">Đơn giá (VNĐ)</label>
        <input type="number" class="form-input drug-price" placeholder="1500" data-id="${id}">
      </div>
      <button type="button" class="btn-remove-item" onclick="App.removeDrug(${id})">✕</button>
    `;
    container.appendChild(div);

    // Auto-fill code & price on name select
    div.querySelector('.drug-name').addEventListener('change', (e) => {
      const drug = BHYTData.DRUG_CATALOG.find(d => d.name === e.target.value);
      if (drug) {
        div.querySelector('.drug-code').value = drug.code;
        div.querySelector('.drug-price').value = drug.maxPrice;
      }
    });
  },

  removeDrug(id) {
    const el = document.getElementById(`drug-${id}`);
    if (el) el.remove();
  },

  addService() {
    this.serviceCounter++;
    const id = this.serviceCounter;
    const container = document.getElementById('serviceList');
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.id = `service-${id}`;
    div.innerHTML = `
      <div class="form-group">
        <label class="form-label">Tên DVKT</label>
        <input type="text" class="form-input svc-name" list="svcCatalogList" placeholder="Ví dụ: Xét nghiệm công thức máu" data-id="${id}">
        <datalist id="svcCatalogList">
          ${BHYTData.SERVICE_CATALOG.map(s => `<option value="${s.name}" label="${s.code} - ${s.name}">`).join('')}
        </datalist>
      </div>
      <div class="form-group">
        <label class="form-label">Mã DVKT</label>
        <input type="text" class="form-input svc-code" placeholder="DV001" data-id="${id}">
      </div>
      <div class="form-group">
        <label class="form-label">Số lượng</label>
        <input type="number" class="form-input svc-qty" min="1" value="1" data-id="${id}">
      </div>
      <div class="form-group">
        <label class="form-label">Đơn giá (VNĐ)</label>
        <input type="number" class="form-input svc-price" placeholder="52000" data-id="${id}">
      </div>
      <button type="button" class="btn-remove-item" onclick="App.removeService(${id})">✕</button>
    `;
    container.appendChild(div);

    div.querySelector('.svc-name').addEventListener('change', (e) => {
      const svc = BHYTData.SERVICE_CATALOG.find(s => s.name === e.target.value);
      if (svc) {
        div.querySelector('.svc-code').value = svc.code;
        div.querySelector('.svc-price').value = svc.maxPrice;
      }
    });
  },

  removeService(id) {
    const el = document.getElementById(`service-${id}`);
    if (el) el.remove();
  },

  addSupply() {
    this.supplyCounter++;
    const id = this.supplyCounter;
    const container = document.getElementById('supplyList');
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.id = `supply-${id}`;
    div.innerHTML = `
      <div class="form-group">
        <label class="form-label">Tên VTYT</label>
        <input type="text" class="form-input sup-name" list="supCatalogList" placeholder="Ví dụ: Bơm tiêm 5ml" data-id="${id}">
        <datalist id="supCatalogList">
          ${BHYTData.SUPPLY_CATALOG.map(s => `<option value="${s.name}" label="${s.code} - ${s.name}">`).join('')}
        </datalist>
      </div>
      <div class="form-group">
        <label class="form-label">Mã VTYT</label>
        <input type="text" class="form-input sup-code" placeholder="VT001" data-id="${id}">
      </div>
      <div class="form-group">
        <label class="form-label">Số lượng</label>
        <input type="number" class="form-input sup-qty" min="1" value="1" data-id="${id}">
      </div>
      <div class="form-group">
        <label class="form-label">Đơn giá (VNĐ)</label>
        <input type="number" class="form-input sup-price" placeholder="3500" data-id="${id}">
      </div>
      <button type="button" class="btn-remove-item" onclick="App.removeSupply(${id})">✕</button>
    `;
    container.appendChild(div);

    div.querySelector('.sup-name').addEventListener('change', (e) => {
      const sup = BHYTData.SUPPLY_CATALOG.find(s => s.name === e.target.value);
      if (sup) {
        div.querySelector('.sup-code').value = sup.code;
        div.querySelector('.sup-price').value = sup.maxPrice;
      }
    });
  },

  removeSupply(id) {
    const el = document.getElementById(`supply-${id}`);
    if (el) el.remove();
  },

  // ========== COLLECT FORM DATA ==========
  collectFormData() {
    // Collect drugs
    const drugs = [];
    document.querySelectorAll('#drugList .dynamic-item').forEach(item => {
      const name = item.querySelector('.drug-name').value;
      const code = item.querySelector('.drug-code').value;
      const qty = parseInt(item.querySelector('.drug-qty').value) || 1;
      const price = parseInt(item.querySelector('.drug-price').value) || 0;
      if (name || code) drugs.push({ name, code, quantity: qty, price });
    });

    // Collect services
    const services = [];
    document.querySelectorAll('#serviceList .dynamic-item').forEach(item => {
      const name = item.querySelector('.svc-name').value;
      const code = item.querySelector('.svc-code').value;
      const qty = parseInt(item.querySelector('.svc-qty').value) || 1;
      const price = parseInt(item.querySelector('.svc-price').value) || 0;
      if (name || code) services.push({ name, code, quantity: qty, price });
    });

    // Collect supplies
    const supplies = [];
    document.querySelectorAll('#supplyList .dynamic-item').forEach(item => {
      const name = item.querySelector('.sup-name').value;
      const code = item.querySelector('.sup-code').value;
      const qty = parseInt(item.querySelector('.sup-qty').value) || 1;
      const price = parseInt(item.querySelector('.sup-price').value) || 0;
      if (name || code) supplies.push({ name, code, quantity: qty, price });
    });

    const visitType = document.getElementById('visitType').value;

    const claim = {
      patientName: document.getElementById('patientName').value,
      cardNumber: document.getElementById('cardNumber').value,
      cardExpiry: document.getElementById('cardExpiry').value,
      registeredFacility: document.getElementById('registeredFacility').value,
      bhytType: document.getElementById('bhytType').value,
      hasReferral: document.getElementById('hasReferral').checked,
      visitType,
      visitDate: document.getElementById('visitDate').value,
      icdCode: document.getElementById('icdCode').value,
      diagnosis: document.getElementById('diagnosis').value,
      department: document.getElementById('department').value,
      isSecondVisitSameDay: document.getElementById('isSecondVisit').checked,
      drugs,
      services,
      supplies
    };

    // Inpatient fields
    if (visitType === 'inpatient') {
      claim.admissionDate = document.getElementById('admissionDate').value;
      claim.dischargeDate = document.getElementById('dischargeDate').value;
      const bedType = document.getElementById('bedType').value;
      const bedDays = parseInt(document.getElementById('bedDays').value) || 0;
      const bedPrice = parseInt(document.getElementById('bedPrice').value) || 0;
      if (bedType) {
        claim.bed = { type: bedType, days: bedDays, pricePerDay: bedPrice };
      }
    }

    return claim;
  },

  // ========== ANALYZE CLAIM ==========
  analyzeClaim() {
    const claim = this.collectFormData();

    // Show spinner
    const spinner = document.getElementById('spinnerOverlay');
    spinner.classList.add('active');

    // Simulate AI processing delay
    setTimeout(() => {
      const result = this.engine.checkClaim(claim);
      this.currentResult = { claim, result };

      // Save to history
      this.saveToHistory(claim, result);

      // Render results
      this.renderResults(claim, result);

      // Update dashboard
      this.updateDashboard();

      // Hide spinner and switch to results tab
      spinner.classList.remove('active');
      this.switchTab('results');

      // Update results badge
      const badge = document.getElementById('resultsBadge');
      if (result.totalWarnings > 0) {
        badge.style.display = 'inline-flex';
        badge.textContent = result.totalWarnings;
      } else {
        badge.style.display = 'none';
      }
    }, 1500);
  },

  // ========== RENDER RESULTS ==========
  renderResults(claim, result) {
    document.getElementById('noResults').style.display = 'none';
    document.getElementById('analysisResults').classList.add('visible');

    // Risk gauge animation
    const circumference = 2 * Math.PI * 85; // ~534
    const offset = circumference - (result.riskScore / 100) * circumference;
    const gaugeFill = document.getElementById('gaugeFill');
    gaugeFill.style.stroke = result.riskLevel.color;
    gaugeFill.style.strokeDashoffset = offset;

    // Risk score counter animation
    this.animateCounter('riskScoreDisplay', result.riskScore);

    // Risk level badge
    const badge = document.getElementById('riskLevelBadge');
    badge.style.background = `${result.riskLevel.color}22`;
    badge.style.border = `1px solid ${result.riskLevel.color}55`;
    badge.style.color = result.riskLevel.color;
    document.getElementById('riskLevelText').textContent = result.riskLevel.label;

    // Warning counts
    document.getElementById('criticalCountDisplay').textContent = result.criticalCount;
    document.getElementById('warningCountDisplay').textContent = result.warningCount;
    document.getElementById('infoCountDisplay').textContent = result.infoCount;

    // Patient summary
    const costRate = BHYTData.BHYT_COVERAGE_RATES[claim.bhytType];
    document.getElementById('patientSummary').innerHTML = `
      <div class="form-grid" style="gap: 12px;">
        <div style="padding: 12px 16px; background: var(--bg-surface); border-radius: var(--radius-md);">
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Bệnh nhân</div>
          <div style="font-weight: 600;">${claim.patientName || 'N/A'}</div>
        </div>
        <div style="padding: 12px 16px; background: var(--bg-surface); border-radius: var(--radius-md);">
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Thẻ BHYT</div>
          <div style="font-weight: 600; font-family: var(--font-mono);">${claim.cardNumber || 'N/A'}</div>
        </div>
        <div style="padding: 12px 16px; background: var(--bg-surface); border-radius: var(--radius-md);">
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Chẩn đoán</div>
          <div style="font-weight: 600;">${claim.icdCode ? `[${claim.icdCode}] ` : ''}${claim.diagnosis || 'N/A'}</div>
        </div>
        <div style="padding: 12px 16px; background: var(--bg-surface); border-radius: var(--radius-md);">
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Loại KCB</div>
          <div style="font-weight: 600;">${claim.visitType === 'inpatient' ? '🏥 Nội trú' : '🚶 Ngoại trú'}</div>
        </div>
        <div style="padding: 12px 16px; background: var(--bg-surface); border-radius: var(--radius-md);">
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Mức hưởng</div>
          <div style="font-weight: 600;">${costRate ? costRate.label : 'N/A'}</div>
        </div>
        <div style="padding: 12px 16px; background: var(--bg-surface); border-radius: var(--radius-md);">
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Tổng chi phí ước tính</div>
          <div style="font-weight: 600; color: var(--accent-cyan);">${this.formatCurrency(claim._totalCost || 0)}</div>
        </div>
      </div>
    `;

    // Warning list
    this.renderWarningList(result.warnings);
  },

  renderWarningList(warnings, filter = 'all') {
    const container = document.getElementById('warningList');
    const noWarnings = document.getElementById('noWarnings');

    const filtered = filter === 'all' ? warnings : warnings.filter(w => w.severity === filter);

    if (filtered.length === 0) {
      container.innerHTML = '';
      noWarnings.style.display = 'flex';
      return;
    }

    noWarnings.style.display = 'none';

    container.innerHTML = filtered.map((w, i) => `
      <div class="warning-item ${w.severity}" style="animation-delay: ${i * 0.1}s">
        <div class="warning-item-header">
          <div class="warning-item-title">
            <span>${w.severity === 'critical' ? '🚨' : w.severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span>${w.title}</span>
          </div>
          <div style="display:flex; gap: 6px;">
            <span class="warning-severity-badge ${w.severity}">
              ${w.severity === 'critical' ? 'Nghiêm trọng' : w.severity === 'warning' ? 'Cảnh báo' : 'Gợi ý'}
            </span>
            <span class="warning-category">${w.category}</span>
          </div>
        </div>
        <div class="warning-item-desc">${w.description}</div>
        <div class="warning-item-action">
          <span class="action-icon">💡</span>
          <span>${w.recommendation}</span>
        </div>
      </div>
    `).join('');
  },

  filterWarnings(filter) {
    if (!this.currentResult) return;
    this.renderWarningList(this.currentResult.result.warnings, filter);

    // Update active filter button
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.classList.toggle('btn-primary', false);
      btn.classList.toggle('btn-secondary', true);
    });
    const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
    if (activeBtn) {
      activeBtn.classList.toggle('btn-primary', true);
      activeBtn.classList.toggle('btn-secondary', false);
    }
  },

  // ========== COUNTER ANIMATION ==========
  animateCounter(elementId, target) {
    const el = document.getElementById(elementId);
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      el.textContent = current;
    }, 30);
  },

  // ========== HISTORY MANAGEMENT ==========
  saveToHistory(claim, result) {
    const entry = {
      id: Date.now(),
      date: new Date().toISOString(),
      patientName: claim.patientName,
      cardNumber: claim.cardNumber,
      diagnosis: claim.diagnosis,
      icdCode: claim.icdCode,
      visitType: claim.visitType,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      totalWarnings: result.totalWarnings,
      criticalCount: result.criticalCount,
      warningCount: result.warningCount,
      infoCount: result.infoCount,
      totalCost: claim._totalCost || 0
    };
    this.history.unshift(entry);
    if (this.history.length > 100) this.history.pop();
    localStorage.setItem('bhyt_history', JSON.stringify(this.history));
    this.renderHistory();
  },

  loadHistory() {
    try {
      this.history = JSON.parse(localStorage.getItem('bhyt_history') || '[]');
    } catch {
      this.history = [];
    }
    this.renderHistory();
  },

  renderHistory() {
    const container = document.getElementById('historyContent');
    const recentContainer = document.getElementById('recentHistory');

    if (this.history.length === 0) {
      if (container) container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📁</div>
          <h3>Chưa có lịch sử kiểm tra</h3>
          <p>Các hồ sơ đã kiểm tra sẽ được lưu tại đây</p>
        </div>
      `;
      if (recentContainer) recentContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3>Chưa có dữ liệu</h3>
          <p>Bắt đầu kiểm tra hồ sơ BHYT để xem lịch sử tại đây</p>
        </div>
      `;
      return;
    }

    const tableHTML = this.buildHistoryTable(this.history);
    if (container) container.innerHTML = tableHTML;

    const recentTableHTML = this.buildHistoryTable(this.history.slice(0, 5));
    if (recentContainer) recentContainer.innerHTML = recentTableHTML;
  },

  buildHistoryTable(data) {
    return `
      <table class="history-table">
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Bệnh nhân</th>
            <th>Mã thẻ BHYT</th>
            <th>Chẩn đoán</th>
            <th>Loại KCB</th>
            <th>Rủi ro</th>
            <th>Cảnh báo</th>
            <th>Chi phí</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(e => `
            <tr>
              <td style="white-space:nowrap; font-size: 0.8rem;">${this.formatDateTime(e.date)}</td>
              <td style="font-weight: 600;">${e.patientName || 'N/A'}</td>
              <td style="font-family: var(--font-mono); font-size: 0.8rem;">${e.cardNumber || 'N/A'}</td>
              <td>${e.icdCode ? `<span style="color:var(--accent-cyan)">[${e.icdCode}]</span> ` : ''}${e.diagnosis || 'N/A'}</td>
              <td>${e.visitType === 'inpatient' ? '🏥 Nội trú' : '🚶 Ngoại trú'}</td>
              <td><span class="risk-dot ${e.riskLevel.level}" style="color: ${e.riskLevel.color}">${e.riskScore}%</span></td>
              <td>
                ${e.criticalCount > 0 ? `<span style="color:var(--status-critical)">🚨${e.criticalCount}</span> ` : ''}
                ${e.warningCount > 0 ? `<span style="color:var(--status-warning)">⚠️${e.warningCount}</span> ` : ''}
                ${e.infoCount > 0 ? `<span style="color:var(--status-info)">ℹ️${e.infoCount}</span>` : ''}
                ${e.totalWarnings === 0 ? '<span style="color:var(--status-success)">✅ An toàn</span>' : ''}
              </td>
              <td style="font-family: var(--font-mono); font-size: 0.8rem;">${this.formatCurrency(e.totalCost)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  clearHistory() {
    if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử kiểm tra?')) {
      this.history = [];
      localStorage.removeItem('bhyt_history');
      this.renderHistory();
      this.updateDashboard();
    }
  },

  // ========== DASHBOARD ==========
  updateDashboard() {
    const total = this.history.length;
    const critical = this.history.filter(h => h.criticalCount > 0).length;
    const warned = this.history.filter(h => h.totalWarnings > 0 && h.criticalCount === 0).length;
    const safe = this.history.filter(h => h.totalWarnings === 0).length;

    document.getElementById('kpiTotal').textContent = total;
    document.getElementById('kpiCritical').textContent = critical;
    document.getElementById('kpiWarning').textContent = warned;
    document.getElementById('kpiSafe').textContent = safe;

    this.updateCharts();
  },

  // ========== CHARTS ==========
  initCharts() {
    // Chart defaults
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // Warning types doughnut chart
    const ctx1 = document.getElementById('chartWarningTypes').getContext('2d');
    this.charts.warningTypes = new Chart(ctx1, {
      type: 'doughnut',
      data: {
        labels: ['Nghiêm trọng', 'Cảnh báo', 'Gợi ý', 'An toàn'],
        datasets: [{
          data: [0, 0, 0, 0],
          backgroundColor: ['#ff3b5c', '#ff9500', '#00b4d8', '#30d158'],
          borderColor: 'transparent',
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } }
          }
        }
      }
    });

    // Top errors bar chart
    const ctx2 = document.getElementById('chartTopErrors').getContext('2d');
    this.charts.topErrors = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: ['Thiếu mã ICD', 'Vượt giá trần', 'Thẻ hết hạn', 'Chống chỉ định', 'Trái tuyến', 'VTYT riêng'],
        datasets: [{
          label: 'Số lần',
          data: [0, 0, 0, 0, 0, 0],
          backgroundColor: [
            'rgba(255, 59, 92, 0.6)',
            'rgba(255, 149, 0, 0.6)',
            'rgba(139, 92, 246, 0.6)',
            'rgba(244, 63, 94, 0.6)',
            'rgba(0, 180, 216, 0.6)',
            'rgba(0, 201, 167, 0.6)'
          ],
          borderColor: [
            '#ff3b5c',
            '#ff9500',
            '#8b5cf6',
            '#f43f5e',
            '#00b4d8',
            '#00c9a7'
          ],
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: 'rgba(148,163,184,0.06)' },
            ticks: { font: { size: 11 } }
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          }
        }
      }
    });
  },

  updateCharts() {
    if (!this.charts.warningTypes) return;

    const criticalCt = this.history.filter(h => h.criticalCount > 0).length;
    const warningCt = this.history.filter(h => h.warningCount > 0 && h.criticalCount === 0).length;
    const infoCt = this.history.filter(h => h.infoCount > 0 && h.warningCount === 0 && h.criticalCount === 0).length;
    const safeCt = this.history.filter(h => h.totalWarnings === 0).length;

    this.charts.warningTypes.data.datasets[0].data = [criticalCt, warningCt, infoCt, safeCt];
    this.charts.warningTypes.update();

    // Simulate top error counts from history length
    const base = Math.max(1, Math.ceil(this.history.length / 3));
    this.charts.topErrors.data.datasets[0].data = [
      Math.ceil(base * 1.5),
      Math.ceil(base * 1.2),
      Math.ceil(base * 0.8),
      Math.ceil(base * 0.6),
      Math.ceil(base * 0.5),
      Math.ceil(base * 0.4)
    ];
    this.charts.topErrors.update();
  },

  // ========== REGULATIONS ==========
  initRegulations() {
    const regGrid = document.getElementById('regGrid');
    regGrid.innerHTML = BHYTData.REGULATIONS.map(reg => `
      <div class="reg-card">
        <span class="reg-badge">${reg.category}</span>
        <h3 class="reg-title">${reg.title}</h3>
        <div class="reg-date">📅 Hiệu lực: ${this.formatDate(reg.effectiveDate)}</div>
        <p class="reg-summary">${reg.summary}</p>
      </div>
    `).join('');

    const ncList = document.getElementById('ncList');
    ncList.innerHTML = BHYTData.NON_COVERED_CASES.map((nc, i) => `
      <div class="nc-item">
        <div class="nc-number">${i + 1}</div>
        <div class="nc-content">
          <h4>${nc.title}</h4>
          <p>${nc.description}</p>
        </div>
      </div>
    `).join('');

    // Real rejection categories from BHXH audit
    const rrList = document.getElementById('realRejectionList');
    if (rrList && BHYTData.REAL_REJECTION_RULES) {
      rrList.innerHTML = BHYTData.REAL_REJECTION_RULES.map((r, i) => `
        <div class="nc-item">
          <div class="nc-number" style="background: ${r.severity === 'critical' ? 'var(--status-critical-bg)' : 'var(--status-warning-bg)'}; color: ${r.severity === 'critical' ? 'var(--status-critical)' : 'var(--status-warning)'}; font-size: 0.6rem;">
            ${r.code}
          </div>
          <div class="nc-content">
            <h4>${r.title} <span style="font-size:0.7rem; color:var(--text-tertiary); font-weight:400;">[${r.category}]</span></h4>
            <p>${r.desc}</p>
            ${r.amount ? `<p style="font-size: 0.75rem; color: var(--status-critical); font-weight: 600; margin-top: 4px;">💰 ${r.amount.toLocaleString('vi-VN')} VNĐ</p>` : ''}
          </div>
        </div>
      `).join('');
    }
  },

  // ========== TEST CASES ==========
  testCases: [
    {
      id: 1,
      name: '✅ Hồ sơ An toàn — Ngoại trú Tăng huyết áp',
      desc: 'Bệnh nhân tăng huyết áp khám ngoại trú đúng tuyến, thuốc hợp lệ. Kỳ vọng: AN TOÀN.',
      expected: 'low',
      data: {
        patientName: 'Trần Thị Lan', cardNumber: 'DN4950198700123', cardExpiry: '2027-12-31',
        registeredFacility: 'BV ĐKKV Phú Thọ', bhytType: 'DN', hasReferral: false,
        visitType: 'outpatient', icdCode: 'I10', diagnosis: 'Tăng huyết áp nguyên phát',
        department: 'Khoa Nội Tim mạch', isSecondVisit: false,
        drugs: [
          { name: 'Amlodipine 5mg', code: 'T004', qty: 30, price: 2000 },
          { name: 'Losartan 50mg', code: 'T007', qty: 30, price: 2500 }
        ],
        services: [
          { name: 'Khám bệnh ngoại trú', code: 'DV001', qty: 1, price: 39000 },
          { name: 'Điện tâm đồ', code: 'DV009', qty: 1, price: 45000 }
        ],
        supplies: []
      }
    },
    {
      id: 2,
      name: '🚨 Viêm dạ dày — Chống chỉ định + Thẻ hết hạn',
      desc: 'Viêm dạ dày kê Diclofenac (NSAIDs chống chỉ định), Vitamin B ngoài danh mục, thẻ hết hạn, trái tuyến. Kỳ vọng: RỦI RO RẤT CAO.',
      expected: 'critical',
      data: {
        patientName: 'Nguyễn Văn Minh', cardNumber: 'DN4950123456789', cardExpiry: '2025-12-31',
        registeredFacility: 'Trạm Y tế xã Thanh Ba', bhytType: 'DN', hasReferral: false,
        visitType: 'outpatient', icdCode: 'K29.7', diagnosis: 'Viêm dạ dày, không đặc hiệu',
        department: 'Khoa Nội Tiêu hóa', isSecondVisit: false,
        drugs: [
          { name: 'Omeprazole 20mg', code: 'T005', qty: 30, price: 3500 },
          { name: 'Diclofenac 50mg', code: 'T011', qty: 20, price: 1500 },
          { name: 'Vitamin B Complex', code: 'T017', qty: 30, price: 500 }
        ],
        services: [
          { name: 'Khám bệnh ngoại trú', code: 'DV001', qty: 1, price: 39000 },
          { name: 'Nội soi dạ dày', code: 'DV010', qty: 1, price: 350000 }
        ],
        supplies: []
      }
    },
    {
      id: 3,
      name: '⚠️ Nội trú Phẫu thuật — Giường sai & VTYT riêng',
      desc: 'Viêm ruột thừa cấp nhập viện phẫu thuật, sai số ngày giường + giá giường vượt trần + VTYT nội trú kê riêng. Kỳ vọng: RỦI RO CAO.',
      expected: 'high',
      data: {
        patientName: 'Lê Hoàng Nam', cardNumber: 'HN2950234567890', cardExpiry: '2027-06-30',
        registeredFacility: 'BV ĐKKV Phú Thọ', bhytType: 'HN', hasReferral: false,
        visitType: 'inpatient', icdCode: 'K35.8', diagnosis: 'Viêm ruột thừa cấp, khác',
        department: 'Khoa Ngoại tổng hợp', isSecondVisit: false,
        admissionDate: '2026-03-10', dischargeDate: '2026-03-14',
        bed: { type: 'surgery', days: 6, pricePerDay: 280000 },
        drugs: [
          { name: 'Ceftriaxone 1g', code: 'T006', qty: 8, price: 45000 },
          { name: 'Paracetamol 500mg', code: 'T002', qty: 20, price: 800 }
        ],
        services: [
          { name: 'Phẫu thuật ruột thừa', code: 'DV012', qty: 1, price: 3500000 },
          { name: 'Xét nghiệm công thức máu', code: 'DV002', qty: 2, price: 52000 },
          { name: 'Siêu âm ổ bụng tổng quát', code: 'DV005', qty: 1, price: 105000 }
        ],
        supplies: [
          { name: 'Bơm tiêm 5ml', code: 'VT001', qty: 10, price: 3500 },
          { name: 'Dây truyền dịch', code: 'VT003', qty: 5, price: 15000 },
          { name: 'Chỉ phẫu thuật tự tiêu', code: 'VT007', qty: 2, price: 250000 }
        ]
      }
    },
    {
      id: 4,
      name: '🚨 Tiểu đường — Corticoid + Thuốc suy thận',
      desc: 'Đái tháo đường type 2 nhưng kê Prednisolone (corticoid tăng đường huyết) + Metformin khi có bệnh thận kèm theo. Kỳ vọng: RỦI RO RẤT CAO.',
      expected: 'critical',
      data: {
        patientName: 'Phạm Đức Hùng', cardNumber: 'HT1950345678901', cardExpiry: '2027-12-31',
        registeredFacility: 'BV ĐKKV Phú Thọ', bhytType: 'HT', hasReferral: false,
        visitType: 'outpatient', icdCode: 'E11', diagnosis: 'Đái tháo đường type 2',
        department: 'Khoa Nội tổng hợp', isSecondVisit: false,
        drugs: [
          { name: 'Metformin 500mg', code: 'T003', qty: 60, price: 1200 },
          { name: 'Prednisolone 5mg', code: 'T013', qty: 30, price: 1800 },
          { name: 'Insulin Mixtard 30', code: 'T008', qty: 2, price: 185000 }
        ],
        services: [
          { name: 'Khám bệnh ngoại trú', code: 'DV001', qty: 1, price: 39000 },
          { name: 'Sinh hóa máu 17 thông số', code: 'DV003', qty: 1, price: 145000 },
          { name: 'Xét nghiệm HbA1c', code: 'DV017', qty: 1, price: 85000 }
        ],
        supplies: []
      }
    },
    {
      id: 5,
      name: '⚠️ Thiếu Hồ sơ — Không có ICD, không chẩn đoán',
      desc: 'Bệnh nhân ngoại trú nhưng thiếu mã ICD-10, không ghi chẩn đoán, không ghi khoa. Kỳ vọng: CẦN XEM XÉT.',
      expected: 'medium',
      data: {
        patientName: 'Hoàng Minh Tuấn', cardNumber: 'TC3950456789012', cardExpiry: '2027-06-30',
        registeredFacility: 'BV ĐKKV Phú Thọ', bhytType: 'TC', hasReferral: false,
        visitType: 'outpatient', icdCode: '', diagnosis: '',
        department: '', isSecondVisit: false,
        drugs: [
          { name: 'Amoxicillin 500mg', code: 'T001', qty: 21, price: 1500 },
          { name: 'Paracetamol 500mg', code: 'T002', qty: 10, price: 800 }
        ],
        services: [
          { name: 'Khám bệnh ngoại trú', code: 'DV001', qty: 1, price: 39000 },
          { name: 'X-quang ngực thẳng', code: 'DV004', qty: 1, price: 68000 }
        ],
        supplies: []
      }
    },
    {
      id: 6,
      name: '🚫 Dịch vụ Thẩm mỹ — Trường hợp không thanh toán',
      desc: 'Bệnh nhân yêu cầu dịch vụ thẩm mỹ, thuộc 12 trường hợp không được BHYT thanh toán. Kỳ vọng: RỦI RO RẤT CAO.',
      expected: 'critical',
      data: {
        patientName: 'Nguyễn Thị Hoa', cardNumber: 'DN4950567890123', cardExpiry: '2027-12-31',
        registeredFacility: 'BV ĐKKV Phú Thọ', bhytType: 'DN', hasReferral: false,
        visitType: 'outpatient', icdCode: 'L90.5', diagnosis: 'Sẹo và xơ hóa da - phẫu thuật thẩm mỹ',
        department: 'Khoa Ngoại tổng hợp', isSecondVisit: false,
        drugs: [
          { name: 'Cefuroxime 500mg', code: 'T020', qty: 14, price: 12000 }
        ],
        services: [
          { name: 'Khám bệnh ngoại trú', code: 'DV001', qty: 1, price: 39000 }
        ],
        supplies: []
      }
    },
    {
      id: 7,
      name: '⚠️ Tim mạch Nặng — Chi phí cao + Vượt giá trần',
      desc: 'Nhồi máu cơ tim nội trú, sử dụng stent mạch vành giá cao, DVKT cấp trung ương (MRI), vượt giá trần nhiều hạng mục. Kỳ vọng: RỦI RO CAO.',
      expected: 'high',
      data: {
        patientName: 'Vũ Quang Thắng', cardNumber: 'CC1950678901234', cardExpiry: '2027-12-31',
        registeredFacility: 'BV ĐKKV Phú Thọ', bhytType: 'CC', hasReferral: false,
        visitType: 'inpatient', icdCode: 'I21.9', diagnosis: 'Nhồi máu cơ tim cấp, không đặc hiệu',
        department: 'Khoa Nội Tim mạch', isSecondVisit: false,
        admissionDate: '2026-03-08', dischargeDate: '2026-03-14',
        bed: { type: 'icu', days: 3, pricePerDay: 400000 },
        drugs: [
          { name: 'Aspirin 81mg', code: 'T015', qty: 30, price: 600 },
          { name: 'Clopidogrel 75mg', code: 'T016', qty: 30, price: 10000 },
          { name: 'Atorvastatin 20mg', code: 'T009', qty: 30, price: 4500 }
        ],
        services: [
          { name: 'Điện tâm đồ', code: 'DV009', qty: 3, price: 45000 },
          { name: 'Siêu âm tim', code: 'DV006', qty: 2, price: 180000 },
          { name: 'MRI sọ não', code: 'DV008', qty: 1, price: 2200000 },
          { name: 'Xét nghiệm công thức máu', code: 'DV002', qty: 3, price: 52000 },
          { name: 'Sinh hóa máu 17 thông số', code: 'DV003', qty: 2, price: 145000 }
        ],
        supplies: [
          { name: 'Stent mạch vành', code: 'VT004', qty: 1, price: 32000000 }
        ]
      }
    },
    // ===== REAL DATA TEST CASES (từ dvkt02_25002.xlsx) =====
    {
      id: 8,
      name: '🏥 [THỰC TẾ] DVKT02 — BS trùng lịch PT (Khoa Ngoại)',
      desc: 'Dựa trên dữ liệu thực Q2/2025: BS kê y lệnh cho BN ngoại trú trong khi đang mổ nạo VA cho BN khác. BHXH xuất toán 153.8M cho lỗi này.',
      expected: 'critical',
      data: {
        patientName: 'Cao Minh Thuyết', cardNumber: 'GD4252520208424', cardExpiry: '2026-02-24',
        registeredFacility: 'BV ĐKKV Phú Thọ', bhytType: 'GD', hasReferral: false,
        visitType: 'outpatient', icdCode: 'J06.0', diagnosis: 'Viêm họng - thanh quản cấp',
        department: 'Khoa Ngoại tổng hợp', isSecondVisit: false,
        drugs: [
          { name: 'Amoxicillin 500mg', code: 'T001', qty: 21, price: 1500 },
          { name: 'Dexamethasone 0.5mg', code: 'T022', qty: 10, price: 500 }
        ],
        services: [
          { name: 'Khám Tai mũi họng', code: 'DV018', qty: 1, price: 45000 },
          { name: 'Nội soi Tai mũi họng', code: 'DV019', qty: 1, price: 120000 }
        ],
        supplies: []
      }
    },
    {
      id: 9,
      name: '📋 [THỰC TẾ] DVKT38+51 — SA ổ bụng + SA tuyến giáp trùng',
      desc: 'BN khám nội, chỉ định đồng thời SA ổ bụng + SA tiết niệu (trùng lặp) + SA tuyến giáp không nghi ngờ bệnh lý. 2 lỗi BHXH phổ biến.',
      expected: 'high',
      data: {
        patientName: 'Nguyễn Thị Thu Hà', cardNumber: 'DN4252500367892', cardExpiry: '2026-12-31',
        registeredFacility: 'BV ĐKKV Phú Thọ', bhytType: 'DN', hasReferral: false,
        visitType: 'outpatient', icdCode: 'K29.5', diagnosis: 'Viêm dạ dày mạn tính không đặc hiệu',
        department: 'Khoa Nội tổng hợp', isSecondVisit: false,
        drugs: [
          { name: 'Omeprazol 20mg', code: 'T004', qty: 28, price: 2400 },
          { name: 'Sucralfate 1g', code: 'T023', qty: 28, price: 3500 }
        ],
        services: [
          { name: 'Khám bệnh ngoại trú', code: 'DV001', qty: 1, price: 39000 },
          { name: 'Siêu âm ổ bụng tổng quát', code: 'DV005', qty: 1, price: 105000 },
          { name: 'Siêu âm hệ tiết niệu', code: 'DV020', qty: 1, price: 85000 },
          { name: 'Siêu âm tuyến giáp', code: 'DV021', qty: 1, price: 90000 },
          { name: 'Xét nghiệm công thức máu', code: 'DV002', qty: 1, price: 52000 }
        ],
        supplies: []
      }
    },
    {
      id: 10,
      name: '⚠️ [THỰC TẾ] DVKT09+18 — CRP hs + XN sai thời gian chạy thận',
      desc: 'BN chạy thận chu kỳ, chỉ định CRP hs không đủ điều kiện TT50 + XN sai thời gian. Lỗi CRP chiếm 15.3M trong Q2.',
      expected: 'high',
      data: {
        patientName: 'Lê Văn Đức', cardNumber: 'BT4252500489012', cardExpiry: '2027-06-30',
        registeredFacility: 'BV ĐKKV Phú Thọ', bhytType: 'BT', hasReferral: false,
        visitType: 'inpatient', icdCode: 'N18.5', diagnosis: 'Suy thận mạn giai đoạn 5 - chạy thận chu kỳ',
        department: 'Khoa Hồi sức cấp cứu', isSecondVisit: false,
        admissionDate: '2026-03-10', dischargeDate: '2026-03-13',
        bed: { type: 'normal', days: 3, pricePerDay: 230000 },
        drugs: [
          { name: 'Erythropoietin 2000IU', code: 'T024', qty: 3, price: 120000 },
          { name: 'Calci carbonat 1250mg', code: 'T025', qty: 30, price: 800 }
        ],
        services: [
          { name: 'Chạy thận nhân tạo', code: 'DV022', qty: 3, price: 500000 },
          { name: 'Định lượng CRP hs', code: 'DV023', qty: 2, price: 85000 },
          { name: 'Xét nghiệm công thức máu', code: 'DV002', qty: 2, price: 52000 },
          { name: 'Sinh hóa máu 17 thông số', code: 'DV003', qty: 1, price: 145000 }
        ],
        supplies: [
          { name: 'Quả lọc thận', code: 'VT010', qty: 3, price: 350000 }
        ]
      }
    },
    {
      id: 11,
      name: '🚨 [THỰC TẾ] THUOC_01 — Galantamin sai chỉ định',
      desc: 'BN tai biến mạch máu não, kê Galantamin (chỉ dành cho Alzheimer). BHXH xuất toán 6.3M cho lỗi này trong Q2.',
      expected: 'critical',
      data: {
        patientName: 'Phạm Văn Hải', cardNumber: 'HT4252500567123', cardExpiry: '2027-12-31',
        registeredFacility: 'BV ĐKKV Phú Thọ', bhytType: 'HT', hasReferral: false,
        visitType: 'inpatient', icdCode: 'I63.9', diagnosis: 'Tai biến nhồi máu não không đặc hiệu',
        department: 'Khoa Nội tổng hợp', isSecondVisit: false,
        admissionDate: '2026-03-07', dischargeDate: '2026-03-14',
        bed: { type: 'normal', days: 7, pricePerDay: 230000 },
        drugs: [
          { name: 'Galantamin (Nivalin) 5mg', code: 'T026', qty: 14, price: 45000 },
          { name: 'Piracetam 800mg', code: 'T027', qty: 28, price: 3500 },
          { name: 'Aspirin 81mg', code: 'T015', qty: 30, price: 600 }
        ],
        services: [
          { name: 'Khám bệnh ngoại trú', code: 'DV001', qty: 1, price: 39000 },
          { name: 'Chụp CT Scanner sọ não', code: 'DV024', qty: 1, price: 850000 },
          { name: 'Xét nghiệm công thức máu', code: 'DV002', qty: 2, price: 52000 }
        ],
        supplies: [
          { name: 'Dây truyền dịch', code: 'VT003', qty: 7, price: 15000 }
        ]
      }
    },
    {
      id: 12,
      name: '📋 [THỰC TẾ] THUOC_06+07 — Pantoprazol + Famotidine trùng nhóm',
      desc: 'BN viêm loét dạ dày kê cả Pantoprazol (PPI) lẫn Famotidine (H2RA) — trùng nhóm thuốc ức chế acid. Tổng xuất toán 2 thuốc này: 6.6M Q2.',
      expected: 'high',
      data: {
        patientName: 'Đỗ Thị Mai Anh', cardNumber: 'DN4252500678234', cardExpiry: '2027-12-31',
        registeredFacility: 'BV ĐKKV Phú Thọ', bhytType: 'DN', hasReferral: false,
        visitType: 'outpatient', icdCode: 'K25.7', diagnosis: 'Loét dạ dày mạn tính không chảy máu, không thủng',
        department: 'Khoa Nội tổng hợp', isSecondVisit: false,
        drugs: [
          { name: 'Pantoprazol 40mg', code: 'T028', qty: 28, price: 8500 },
          { name: 'Famotidine 40mg', code: 'T029', qty: 28, price: 4200 },
          { name: 'Sucralfate 1g', code: 'T023', qty: 28, price: 3500 }
        ],
        services: [
          { name: 'Khám bệnh ngoại trú', code: 'DV001', qty: 1, price: 39000 },
          { name: 'Nội soi dạ dày', code: 'DV025', qty: 1, price: 350000 },
          { name: 'Sinh hóa máu 17 thông số', code: 'DV003', qty: 1, price: 145000 }
        ],
        supplies: []
      }
    }
  ],

  // Show test case picker modal
  fillSampleData() {
    this.showCasePicker();
  },

  showCasePicker() {
    // Remove existing modal if any
    const existing = document.getElementById('casePickerModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'casePickerModal';
    modal.style.cssText = `
      position: fixed; inset: 0; z-index: 2000;
      background: rgba(3,7,18,0.88); backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px; animation: fadeSlideIn 0.3s ease;
    `;
    modal.innerHTML = `
      <div style="background: var(--bg-base); border: 1px solid var(--border-default);
        border-radius: var(--radius-xl); max-width: 720px; width: 100%; max-height: 85vh;
        overflow-y: auto; box-shadow: 0 24px 64px rgba(0,0,0,0.5);">
        <div style="padding: 24px 28px; border-bottom: 1px solid var(--border-subtle);
          display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h2 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 4px;">
              🧪 Chọn Test Case
            </h2>
            <p style="font-size: 0.8rem; color: var(--text-secondary);">
              7 tình huống khác nhau để kiểm thử hệ thống cảnh báo xuất toán
            </p>
          </div>
          <button onclick="document.getElementById('casePickerModal').remove()"
            style="width:36px;height:36px;border-radius:var(--radius-sm);border:1px solid var(--border-default);
              background:var(--bg-surface);color:var(--text-primary);cursor:pointer;font-size:1.1rem;">✕</button>
        </div>
        <div style="padding: 16px 28px 28px; display:flex; flex-direction:column; gap: 10px;">
          ${this.testCases.map(tc => `
            <button onclick="App.loadTestCase(${tc.id}); document.getElementById('casePickerModal').remove();"
              style="text-align:left; padding: 16px 20px; background: var(--bg-surface);
                border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
                color: var(--text-primary); cursor: pointer; font-family: var(--font-sans);
                transition: all 0.2s ease; display: flex; flex-direction: column; gap: 6px;"
              onmouseover="this.style.borderColor='var(--primary-400)';this.style.background='var(--bg-elevated)'"
              onmouseout="this.style.borderColor='var(--border-subtle)';this.style.background='var(--bg-surface)'">
              <div style="font-weight: 700; font-size: 0.95rem;">${tc.name}</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">${tc.desc}</div>
            </button>
          `).join('')}
          <div style="margin-top: 8px; text-align: center;">
            <button onclick="App.runAllTestCases(); document.getElementById('casePickerModal').remove();"
              style="padding: 14px 32px; background: var(--gradient-primary); border: none;
                border-radius: var(--radius-md); color: white; font-weight: 700; font-size: 0.9rem;
                cursor: pointer; font-family: var(--font-sans); box-shadow: 0 4px 16px rgba(10,132,208,0.3);">
              🚀 Chạy TẤT CẢ 7 test cases liên tiếp
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  // Load a specific test case
  loadTestCase(id) {
    const tc = this.testCases.find(t => t.id === id);
    if (!tc) return;
    const d = tc.data;

    // Reset form
    this.resetForm();

    // Patient info
    document.getElementById('patientName').value = d.patientName;
    document.getElementById('cardNumber').value = d.cardNumber;
    document.getElementById('cardExpiry').value = d.cardExpiry;
    document.getElementById('registeredFacility').value = d.registeredFacility;
    document.getElementById('bhytType').value = d.bhytType;
    document.getElementById('hasReferral').checked = d.hasReferral;

    // Visit info
    document.getElementById('visitType').value = d.visitType;
    document.getElementById('visitDate').valueAsDate = new Date();
    document.getElementById('icdCode').value = d.icdCode;
    document.getElementById('diagnosis').value = d.diagnosis;
    document.getElementById('department').value = d.department;
    document.getElementById('isSecondVisit').checked = d.isSecondVisit;

    // Inpatient
    if (d.visitType === 'inpatient') {
      document.getElementById('inpatientFields').style.display = 'block';
      if (d.admissionDate) document.getElementById('admissionDate').value = d.admissionDate;
      if (d.dischargeDate) document.getElementById('dischargeDate').value = d.dischargeDate;
      if (d.bed) {
        document.getElementById('bedType').value = d.bed.type;
        document.getElementById('bedDays').value = d.bed.days;
        document.getElementById('bedPrice').value = d.bed.pricePerDay;
      }
    } else {
      document.getElementById('inpatientFields').style.display = 'none';
    }

    // Add drugs
    (d.drugs || []).forEach((drug, i) => {
      this.addDrug();
      const el = document.getElementById(`drug-${this.drugCounter}`);
      el.querySelector('.drug-name').value = drug.name;
      el.querySelector('.drug-code').value = drug.code;
      el.querySelector('.drug-qty').value = drug.qty;
      el.querySelector('.drug-price').value = drug.price;
    });

    // Add services
    (d.services || []).forEach((svc, i) => {
      this.addService();
      const el = document.getElementById(`service-${this.serviceCounter}`);
      el.querySelector('.svc-name').value = svc.name;
      el.querySelector('.svc-code').value = svc.code;
      el.querySelector('.svc-qty').value = svc.qty;
      el.querySelector('.svc-price').value = svc.price;
    });

    // Add supplies
    (d.supplies || []).forEach((sup, i) => {
      this.addSupply();
      const el = document.getElementById(`supply-${this.supplyCounter}`);
      el.querySelector('.sup-name').value = sup.name;
      el.querySelector('.sup-code').value = sup.code;
      el.querySelector('.sup-qty').value = sup.qty;
      el.querySelector('.sup-price').value = sup.price;
    });
  },

  // Run all test cases sequentially
  runAllTestCases() {
    const spinner = document.getElementById('spinnerOverlay');
    spinner.querySelector('.spinner-text').textContent = '🚀 Đang chạy 7 test cases...';
    spinner.classList.add('active');

    let index = 0;
    const runNext = () => {
      if (index >= this.testCases.length) {
        spinner.classList.remove('active');
        spinner.querySelector('.spinner-text').textContent = '🤖 AI đang phân tích hồ sơ BHYT...';
        this.switchTab('history');
        this.updateDashboard();
        return;
      }

      const tc = this.testCases[index];
      spinner.querySelector('.spinner-text').textContent =
        `🧪 Test ${index + 1}/7: ${tc.name.replace(/[✅🚨⚠️🚫]/g, '').trim()}...`;

      // Build claim data directly from test case
      const d = tc.data;
      const claim = {
        patientName: d.patientName, cardNumber: d.cardNumber, cardExpiry: d.cardExpiry,
        registeredFacility: d.registeredFacility, bhytType: d.bhytType,
        hasReferral: d.hasReferral, visitType: d.visitType,
        visitDate: new Date().toISOString().split('T')[0],
        icdCode: d.icdCode, diagnosis: d.diagnosis, department: d.department,
        isSecondVisitSameDay: d.isSecondVisit,
        drugs: (d.drugs || []).map(dr => ({ name: dr.name, code: dr.code, quantity: dr.qty, price: dr.price })),
        services: (d.services || []).map(sv => ({ name: sv.name, code: sv.code, quantity: sv.qty, price: sv.price })),
        supplies: (d.supplies || []).map(sp => ({ name: sp.name, code: sp.code, quantity: sp.qty, price: sp.price }))
      };
      if (d.bed) claim.bed = d.bed;
      if (d.admissionDate) claim.admissionDate = d.admissionDate;
      if (d.dischargeDate) claim.dischargeDate = d.dischargeDate;

      const result = this.engine.checkClaim(claim);
      this.saveToHistory(claim, result);
      this.currentResult = { claim, result };
      this.renderResults(claim, result);

      index++;
      setTimeout(runNext, 600);
    };

    setTimeout(runNext, 500);
  },

  // ========== RESET FORM ==========
  resetForm() {
    document.getElementById('claimForm').reset();
    document.getElementById('drugList').innerHTML = '';
    document.getElementById('serviceList').innerHTML = '';
    document.getElementById('supplyList').innerHTML = '';
    document.getElementById('inpatientFields').style.display = 'none';
    this.drugCounter = 0;
    this.serviceCounter = 0;
    this.supplyCounter = 0;
    document.getElementById('visitDate').valueAsDate = new Date();
  },

  // ========== EXPORT REPORT ==========
  exportReport() {
    if (!this.currentResult) return;
    const { claim, result } = this.currentResult;

    let report = `
═══════════════════════════════════════════════════════════════
  BÁO CÁO KIỂM TRA XUẤT TOÁN BHYT
  Hệ thống AI Cảnh báo - BV Đa khoa Khu vực Phú Thọ
  Ngày tạo: ${this.formatDateTime(new Date().toISOString())}
═══════════════════════════════════════════════════════════════

📋 THÔNG TIN HỒ SƠ
─────────────────────
  Bệnh nhân:    ${claim.patientName || 'N/A'}
  Thẻ BHYT:     ${claim.cardNumber || 'N/A'}
  Loại KCB:     ${claim.visitType === 'inpatient' ? 'Nội trú' : 'Ngoại trú'}
  Ngày KCB:     ${claim.visitDate || 'N/A'}
  Mã ICD-10:    ${claim.icdCode || 'N/A'}
  Chẩn đoán:    ${claim.diagnosis || 'N/A'}
  Khoa:         ${claim.department || 'N/A'}

📊 KẾT QUẢ PHÂN TÍCH AI
─────────────────────
  Điểm rủi ro:        ${result.riskScore}/100 (${result.riskLevel.label})
  Tổng cảnh báo:      ${result.totalWarnings}
    - Nghiêm trọng:   ${result.criticalCount}
    - Cảnh báo:        ${result.warningCount}
    - Gợi ý:           ${result.infoCount}

`;

    if (result.warnings.length > 0) {
      report += `⚠️ CHI TIẾT CẢNH BÁO\n─────────────────────\n`;
      result.warnings.forEach((w, i) => {
        const severity = w.severity === 'critical' ? '🚨 NGHIÊM TRỌNG' :
          w.severity === 'warning' ? '⚠️ CẢNH BÁO' : 'ℹ️ GỢI Ý';
        report += `
  ${i + 1}. [${severity}] ${w.title}
     Mô tả:  ${w.description}
     Đề xuất: ${w.recommendation}
     Nhóm:    ${w.category}
`;
      });
    } else {
      report += `\n✅ HỒ SƠ AN TOÀN - Có thể gửi lên cổng thanh toán BHXH\n`;
    }

    report += `
═══════════════════════════════════════════════════════════════
  Lưu ý: Đây là kết quả phân tích tự động bằng AI.
  Vui lòng xác nhận với phòng BHXH trước khi gửi hồ sơ.
═══════════════════════════════════════════════════════════════
`;

    // Download as text file
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-bhyt-${claim.patientName || 'unknown'}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // ========== UTILITY ==========
  formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  },

  formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  },

  formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  },

  // ========== REAL STATS DASHBOARD ==========
  initRealStats() {
    var stats = window.BHYTData && window.BHYTData.REAL_STATS;
    if (!stats || !stats.topRejections) {
      setTimeout(function() { App.initRealStats(); }, 500);
      return;
    }

    // Top 5 rejections
    var topEl = document.getElementById('topRejectionsChart');
    if (topEl) {
      var maxAmt = stats.topRejections[0].amount;
      var colors = ['#ff3b5c', '#ff9500', '#ffd60a', '#5e5ce6', '#30d158'];
      var html = '';
      for (var i = 0; i < stats.topRejections.length; i++) {
        var r = stats.topRejections[i];
        var pct = (r.amount / stats.totalRejectionAmount * 100).toFixed(1);
        var barW = (r.amount / maxAmt * 100).toFixed(0);
        var c = colors[i];
        html += '<div style="margin-bottom:14px;">';
        html += '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">';
        html += '<span style="color:var(--text-primary);font-size:0.85rem;font-weight:500;">';
        html += '<span style="color:' + c + '">●</span> [' + r.code + '] ' + r.title;
        html += '</span>';
        html += '<span style="color:' + c + ';font-weight:700;font-size:0.85rem;">' + r.amount.toLocaleString('vi-VN') + 'đ (' + pct + '%)</span>';
        html += '</div>';
        html += '<div style="background:rgba(255,255,255,0.05);border-radius:6px;height:8px;overflow:hidden;">';
        html += '<div style="background:' + c + ';height:100%;width:' + barW + '%;border-radius:6px;transition:width 1s ease;"></div>';
        html += '</div></div>';
      }
      topEl.innerHTML = html;
    }

    // Department breakdown
    var deptEl = document.getElementById('deptBreakdown');
    if (deptEl && stats.topDepartments) {
      var maxDept = stats.topDepartments[0].amount;
      var dhtml = '';
      for (var j = 0; j < stats.topDepartments.length; j++) {
        var d = stats.topDepartments[j];
        var dp = (d.amount / maxDept * 100).toFixed(0);
        dhtml += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding:10px 14px;background:rgba(255,255,255,0.03);border-radius:10px;">';
        dhtml += '<div style="flex:1;">';
        dhtml += '<div style="color:var(--text-primary);font-size:0.85rem;font-weight:500;">' + d.name + '</div>';
        dhtml += '<div style="color:var(--text-tertiary);font-size:0.7rem;">' + d.patients + ' BN · ' + d.records + ' bản ghi</div>';
        dhtml += '</div>';
        dhtml += '<div style="width:120px;"><div style="background:rgba(255,255,255,0.05);border-radius:4px;height:6px;overflow:hidden;">';
        dhtml += '<div style="background:#5e5ce6;height:100%;width:' + dp + '%;border-radius:4px;"></div>';
        dhtml += '</div></div>';
        dhtml += '<div style="color:#5e5ce6;font-weight:600;font-size:0.8rem;min-width:90px;text-align:right;">' + d.amount.toLocaleString('vi-VN') + 'đ</div>';
        dhtml += '</div>';
      }
      deptEl.innerHTML = dhtml;
    }
  },

  // ========== EXCEL IMPORT ==========
  handleExcelDrop(event) {
    const file = event.dataTransfer.files[0];
    if (file) this.handleExcelFile(file);
  },

  handleExcelFile(file) {
    if (!file) return;
    const resultsDiv = document.getElementById('excelImportResults');
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `<div style="text-align:center; padding:20px;">
      <div class="spinner" style="margin:0 auto 12px;"></div>
      <p style="color:var(--text-secondary);">🤖 AI đang phân tích file: ${file.name}...</p>
    </div>`;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        this.processExcelData(workbook, file.name);
      } catch (err) {
        resultsDiv.innerHTML = `<div style="padding:16px; background:rgba(255,59,92,0.1); border:1px solid rgba(255,59,92,0.3); border-radius:12px;">
          <p style="color:#ff3b5c; font-weight:600;">❌ Lỗi đọc file: ${err.message}</p>
          <p style="color:var(--text-secondary); font-size:0.8rem;">Vui lòng kiểm tra file Excel có đúng định dạng không.</p>
        </div>`;
      }
    };
    reader.readAsArrayBuffer(file);
  },

  processExcelData(workbook, fileName) {
    const resultsDiv = document.getElementById('excelImportResults');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!jsonData.length) {
      resultsDiv.innerHTML = `<div style="padding:16px; background:rgba(255,149,0,0.1); border:1px solid rgba(255,149,0,0.3); border-radius:12px;">
        <p style="color:#ff9500;">⚠️ File không có dữ liệu hoặc định dạng không nhận dạng được.</p>
      </div>`;
      return;
    }

    // Auto-detect file type
    const cols = Object.keys(jsonData[0]);
    const colsLower = cols.map(c => c.toLowerCase());
    const isDvkt = colsLower.some(c => c.includes('ho_ten') || c.includes('ma_bn') || c.includes('ma_benh'));
    const isSummary = colsLower.some(c => c.includes('chuyen_de') || c.includes('chuyên đề'));

    let html = '';
    if (isDvkt) {
      // Process dvkt02-style file
      const totalRows = jsonData.length;
      const patients = new Set();
      const violations = {};
      const departments = {};
      let totalAmount = 0;

      jsonData.forEach(row => {
        const name = row.HO_TEN || row.ho_ten || '';
        const ma = row.MA_BN || row.ma_bn || '';
        const dept = row.MA_KHOA || row.ma_khoa || '';
        const amount = parseFloat(row.tien_de_nghi_kt || row.THANH_TIEN || 0);
        const violation = row.ten_chuyen_de || row.TEN_CHUYEN_DE || '';
        const reason = row.LY_DO_TC || row.ly_do_tc || '';

        if (name) patients.add(ma || name);
        if (dept) departments[dept] = (departments[dept] || 0) + 1;
        if (violation) violations[violation] = (violations[violation] || 0) + 1;
        totalAmount += amount;
      });

      const sortedViolations = Object.entries(violations).sort((a, b) => b[1] - a[1]).slice(0, 10);
      const sortedDepts = Object.entries(departments).sort((a, b) => b[1] - a[1]);

      html = `
        <div style="margin-bottom:16px; padding:16px; background:rgba(48,209,88,0.1); border:1px solid rgba(48,209,88,0.3); border-radius:12px;">
          <h4 style="color:#30d158; margin-bottom:8px;">✅ Phân tích thành công: ${fileName}</h4>
          <p style="color:var(--text-secondary); font-size:0.85rem;">Sheet: ${sheetName} · ${totalRows} bản ghi</p>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:10px; margin-bottom:16px;">
          <div style="background:rgba(255,59,92,0.1); border:1px solid rgba(255,59,92,0.3); border-radius:10px; padding:12px; text-align:center;">
            <div style="font-size:1.3rem; font-weight:700; color:#ff3b5c;">${totalRows.toLocaleString()}</div>
            <div style="font-size:0.7rem; color:var(--text-secondary);">Bản ghi vi phạm</div>
          </div>
          <div style="background:rgba(255,149,0,0.1); border:1px solid rgba(255,149,0,0.3); border-radius:10px; padding:12px; text-align:center;">
            <div style="font-size:1.3rem; font-weight:700; color:#ff9500;">${patients.size}</div>
            <div style="font-size:0.7rem; color:var(--text-secondary);">Bệnh nhân</div>
          </div>
          <div style="background:rgba(94,92,230,0.1); border:1px solid rgba(94,92,230,0.3); border-radius:10px; padding:12px; text-align:center;">
            <div style="font-size:1.3rem; font-weight:700; color:#5e5ce6;">${sortedDepts.length}</div>
            <div style="font-size:0.7rem; color:var(--text-secondary);">Khoa</div>
          </div>
          <div style="background:rgba(48,209,88,0.1); border:1px solid rgba(48,209,88,0.3); border-radius:10px; padding:12px; text-align:center;">
            <div style="font-size:1.3rem; font-weight:700; color:#30d158;">${totalAmount > 0 ? (totalAmount / 1000000).toFixed(1) + 'M' : 'N/A'}</div>
            <div style="font-size:0.7rem; color:var(--text-secondary);">Tổng đề nghị KT</div>
          </div>
        </div>
        <h4 style="color:var(--text-primary); margin-bottom:8px;">📊 Top loại vi phạm</h4>
        ${sortedViolations.map(([name, count]) => `
          <div style="display:flex; justify-content:space-between; padding:8px 12px; margin-bottom:4px; background:rgba(255,255,255,0.03); border-radius:8px;">
            <span style="color:var(--text-primary); font-size:0.8rem;">${name}</span>
            <span style="color:#ff9500; font-weight:600; font-size:0.8rem;">${count} bản ghi</span>
          </div>
        `).join('')}
        <h4 style="color:var(--text-primary); margin:12px 0 8px;">🏢 Phân bổ theo khoa</h4>
        ${sortedDepts.map(([dept, count]) => `
          <div style="display:flex; justify-content:space-between; padding:8px 12px; margin-bottom:4px; background:rgba(255,255,255,0.03); border-radius:8px;">
            <span style="color:var(--text-primary); font-size:0.8rem;">${dept}</span>
            <span style="color:#5e5ce6; font-weight:600; font-size:0.8rem;">${count} bản ghi</span>
          </div>
        `).join('')}`;
    } else {
      // Generic Excel file - show summary
      html = `
        <div style="padding:16px; background:rgba(48,209,88,0.1); border:1px solid rgba(48,209,88,0.3); border-radius:12px; margin-bottom:12px;">
          <h4 style="color:#30d158;">✅ Đọc file thành công: ${fileName}</h4>
          <p style="color:var(--text-secondary); font-size:0.85rem;">${workbook.SheetNames.length} sheet · ${jsonData.length} dòng dữ liệu</p>
        </div>
        <div style="max-height:300px; overflow:auto; border:1px solid rgba(255,255,255,0.1); border-radius:8px;">
          <table style="width:100%; border-collapse:collapse; font-size:0.75rem;">
            <thead><tr style="background:rgba(255,255,255,0.05);">
              ${cols.slice(0, 8).map(c => `<th style="padding:6px 8px; text-align:left; color:var(--text-secondary); border-bottom:1px solid rgba(255,255,255,0.1);">${c}</th>`).join('')}
            </tr></thead>
            <tbody>
              ${jsonData.slice(0, 20).map(row => `<tr>
                ${cols.slice(0, 8).map(c => `<td style="padding:4px 8px; color:var(--text-primary); border-bottom:1px solid rgba(255,255,255,0.05);">${String(row[c] || '').substring(0, 30)}</td>`).join('')}
              </tr>`).join('')}
            </tbody>
          </table>
          ${jsonData.length > 20 ? `<p style="color:var(--text-tertiary); font-size:0.75rem; padding:8px; text-align:center;">Hiển thị 20/${jsonData.length} dòng đầu tiên</p>` : ''}
        </div>`;
    }

    resultsDiv.innerHTML = html;
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
