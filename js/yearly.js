// ============================================================
//  Report — Income / Expense / Balance with Day/Week/Month/Year
//  views + grouped bar chart + PDF export
// ============================================================
let _yearSel = new Date().getFullYear();      // legacy (year view)
let _rptPeriod = 'year';                       // day | week | month | year
let _rptAnchor = new Date();

function _rptYmd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Build {rows:[{label,inc,exp,bal}], unit, title, useBal} for the period.
function _reportData(period, anchor) {
  const tx = STATE.transactions || [];

  if (period === 'year') {
    const year = anchor.getFullYear(); let bal = 0; const rows = [];
    for (let m = 0; m < 12; m++) {
      const ym = `${year}-${String(m + 1).padStart(2, '0')}`;
      let inc = 0, exp = 0;
      tx.forEach(t => { if ((t.date || '').startsWith(ym)) { if (t.type === 'income') inc += t.amount; else exp += t.amount; } });
      bal += inc - exp;
      rows.push({ label: new Date(year, m, 1).toLocaleString('default', { month: 'short' }), inc, exp, bal });
    }
    return { rows, unit: 'Month', title: String(year), useBal: true };
  }

  if (period === 'month') {
    const y = anchor.getFullYear(), mo = anchor.getMonth(), days = new Date(y, mo + 1, 0).getDate();
    let bal = 0; const rows = [];
    for (let d = 1; d <= days; d++) {
      const ds = `${y}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      let inc = 0, exp = 0;
      tx.forEach(t => { if ((t.date || '').slice(0, 10) === ds) { if (t.type === 'income') inc += t.amount; else exp += t.amount; } });
      bal += inc - exp;
      rows.push({ label: String(d), inc, exp, bal });
    }
    return { rows, unit: 'Day', title: anchor.toLocaleString('default', { month: 'long', year: 'numeric' }), useBal: true };
  }

  if (period === 'week') {
    const a = new Date(anchor), dow = (a.getDay() + 6) % 7, mon = new Date(a); mon.setDate(a.getDate() - dow);
    let bal = 0; const rows = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon); d.setDate(mon.getDate() + i); const ds = _rptYmd(d);
      let inc = 0, exp = 0;
      tx.forEach(t => { if ((t.date || '').slice(0, 10) === ds) { if (t.type === 'income') inc += t.amount; else exp += t.amount; } });
      bal += inc - exp;
      rows.push({ label: d.toLocaleDateString('en-IN', { weekday: 'short' }), inc, exp, bal });
    }
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { rows, unit: 'Day', title: `${mon.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${sun.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`, useBal: true };
  }

  // day → breakdown by category for the selected day
  const ds = _rptYmd(anchor); const byCat = {};
  tx.forEach(t => {
    if ((t.date || '').slice(0, 10) !== ds) return;
    const c = t.category || 'Other'; if (!byCat[c]) byCat[c] = { inc: 0, exp: 0 };
    if (t.type === 'income') byCat[c].inc += t.amount; else byCat[c].exp += t.amount;
  });
  const rows = Object.entries(byCat).map(([c, v]) => ({ label: c, inc: v.inc, exp: v.exp, bal: v.inc - v.exp }))
    .sort((a, b) => (b.inc + b.exp) - (a.inc + a.exp));
  return { rows, unit: 'Category', title: anchor.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }), useBal: false };
}

function _reportTableHTML(data) {
  const tInc = data.rows.reduce((s, r) => s + r.inc, 0);
  const tExp = data.rows.reduce((s, r) => s + r.exp, 0);
  const balHead = data.useBal ? '<th>Balance</th>' : '<th>Net</th>';
  return `<table class="yearly-tbl">
    <thead><tr><th>${data.unit}</th><th>Income</th><th>Expense</th>${balHead}</tr></thead>
    <tbody>${data.rows.length ? data.rows.map(r => `<tr>
      <td>${_noteEsc ? _noteEsc(r.label) : r.label}</td>
      <td style="color:#10b981">${fmt(r.inc)}</td>
      <td style="color:#ef4444">${fmt(r.exp)}</td>
      <td style="color:${r.bal >= 0 ? '#00c9a7' : '#ef4444'}">${fmt(r.bal)}</td>
    </tr>`).join('') : `<tr><td colspan="4" style="text-align:center;color:var(--text3);padding:24px">No transactions in this period.</td></tr>`}</tbody>
    <tfoot><tr>
      <th>Total</th>
      <th style="color:#10b981">${fmt(tInc)}</th>
      <th style="color:#ef4444">${fmt(tExp)}</th>
      <th>${fmt(tInc - tExp)}</th>
    </tr></tfoot>
  </table>`;
}

function setReportPeriod(p) {
  _rptPeriod = p;
  if (p === 'year') _rptAnchor = new Date(_yearSel, 0, 1);
  renderYearly();
}
function reportNav(delta) {
  const d = new Date(_rptAnchor);
  if (_rptPeriod === 'day') d.setDate(d.getDate() + delta);
  else if (_rptPeriod === 'week') d.setDate(d.getDate() + 7 * delta);
  else if (_rptPeriod === 'month') d.setMonth(d.getMonth() + delta);
  else { d.setFullYear(d.getFullYear() + delta); _yearSel = d.getFullYear(); }
  _rptAnchor = d;
  renderYearly();
}

function renderYearly() {
  const data = _reportData(_rptPeriod, _rptAnchor);
  const tabs = [['day', 'Day'], ['week', 'Week'], ['month', 'Month'], ['year', 'Year']];

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div><h1 class="page-title"><i data-lucide="file-bar-chart-2"></i> Report</h1><p class="page-subtitle">Income · Expense · Balance</p></div>
        <button class="btn-primary btn-sm rpt-export-btn" onclick="exportYearlyPDF()">⬇ Export PDF</button>
      </div>

      <div class="rpt-tabs">
        ${tabs.map(([k, l]) => `<button class="rpt-tab ${_rptPeriod === k ? 'on' : ''}" onclick="setReportPeriod('${k}')">${l}</button>`).join('')}
      </div>

      <div class="rpt-navbar">
        <button class="mm-navbtn" onclick="reportNav(-1)">‹</button>
        <span class="rpt-title">${data.title}</span>
        <button class="mm-navbtn" onclick="reportNav(1)">›</button>
      </div>

      <div class="glass-card" style="padding:16px;margin-bottom:16px">
        <div style="height:${window.__IS_APP ? Math.max(320, Math.min(640, data.rows.length * 40 + 80)) : Math.max(220, Math.min(420, data.rows.length * 26 + 60))}px;position:relative">
          <canvas id="yearly-bar-chart"></canvas>
        </div>
      </div>

      <div class="glass-card" id="yearly-report" style="padding:16px;overflow-x:auto">
        ${_reportTableHTML(data)}
      </div>
    </div>`;

  setTimeout(() => {
    if (window.lucide && lucide.createIcons) { try { lucide.createIcons(); } catch (_) {} }
    _drawReportBar(data);
  }, 40);
}

function _drawReportBar(data) {
  const cv = document.getElementById('yearly-bar-chart');
  if (!cv || typeof Chart === 'undefined') return;
  if (chartInstances['yearly-bar']) { chartInstances['yearly-bar'].destroy(); delete chartInstances['yearly-bar']; }
  // Horizontal bars when many rows (month/day-by-category); vertical otherwise.
  const horizontal = data.rows.length > 12;
  chartInstances['yearly-bar'] = new Chart(cv, {
    type: 'bar',
    data: {
      labels: data.rows.map(r => r.label),
      datasets: [
        { label: 'Income', data: data.rows.map(r => r.inc), backgroundColor: 'rgba(16,185,129,0.85)', borderRadius: 5 },
        { label: 'Expense', data: data.rows.map(r => r.exp), backgroundColor: 'rgba(239,68,68,0.85)', borderRadius: 5 }
      ]
    },
    options: {
      indexAxis: horizontal ? 'y' : 'x',
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#94a3b8', boxWidth: 16, font: { size: window.__IS_APP ? 17 : 12 } } },
        tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ₹${(+c.parsed[horizontal ? 'x' : 'y']).toLocaleString('en-IN')}` } }
      },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: window.__IS_APP ? 15 : 11 }, callback: function (v) { const val = horizontal ? v : this.getLabelForValue(v); return horizontal ? '₹' + (Math.abs(val) >= 1000 ? (val / 1000).toFixed(0) + 'k' : val) : val; } }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#94a3b8', font: { size: window.__IS_APP ? 15 : 11 }, callback: function (v) { const val = horizontal ? this.getLabelForValue(v) : v; return horizontal ? val : '₹' + (Math.abs(val) >= 1000 ? (val / 1000).toFixed(0) + 'k' : val); } }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  });
}

function exportYearlyPDF() {
  const data = _reportData(_rptPeriod, _rptAnchor);
  const name = (STATE.settings && STATE.settings.name) || 'atworth User';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>atworth Report ${data.title}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;padding:28px;color:#111}
      h1{font-size:22px;margin:0 0 4px} .sub{color:#666;font-size:13px;margin:0 0 18px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #e2e8f0;padding:9px 12px;text-align:right;font-size:13px}
      th:first-child,td:first-child{text-align:left}
      thead th{background:#00c9a7;color:#fff}
      tfoot th{background:#f1f5f9;font-weight:800}
    </style></head><body>
      <h1>atworth — Report (${data.title})</h1>
      <p class="sub">${name} · Generated ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      ${_reportTableHTML(data)}
      <script>setTimeout(function(){window.print();},350);<\/script>
    </body></html>`;
  const w = window.open('', '_blank');
  if (!w) { if (typeof toast === 'function') toast('Allow pop-ups to export the PDF', 'warning'); return; }
  w.document.open(); w.document.write(html); w.document.close();
}
