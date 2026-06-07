// ============================================================
//  Yearly Report — Income / Expense / Balance per month + PDF
// ============================================================
let _yearSel = new Date().getFullYear();

function _yearlyRows(year) {
  const out = []; let bal = 0;
  for (let m = 0; m < 12; m++) {
    const ym = `${year}-${String(m + 1).padStart(2, '0')}`;
    let inc = 0, exp = 0;
    (STATE.transactions || []).forEach(t => {
      if ((t.date || '').startsWith(ym)) { if (t.type === 'income') inc += t.amount; else exp += t.amount; }
    });
    bal += inc - exp;
    out.push({ label: new Date(year, m, 1).toLocaleString('default', { month: 'short' }), inc, exp, net: inc - exp, bal });
  }
  return out;
}

function _yearlyTableHTML(rows) {
  const tInc = rows.reduce((s, r) => s + r.inc, 0);
  const tExp = rows.reduce((s, r) => s + r.exp, 0);
  return `<table class="yearly-tbl">
    <thead><tr><th>Month</th><th>Income</th><th>Expense</th><th>Balance</th></tr></thead>
    <tbody>${rows.map(r => `<tr>
      <td>${r.label}</td>
      <td style="color:#10b981">${fmt(r.inc)}</td>
      <td style="color:#ef4444">${fmt(r.exp)}</td>
      <td style="color:${r.bal >= 0 ? '#00c9a7' : '#ef4444'}">${fmt(r.bal)}</td>
    </tr>`).join('')}</tbody>
    <tfoot><tr>
      <th>Total</th>
      <th style="color:#10b981">${fmt(tInc)}</th>
      <th style="color:#ef4444">${fmt(tExp)}</th>
      <th>${fmt(tInc - tExp)}</th>
    </tr></tfoot>
  </table>`;
}

function renderYearly() {
  const rows = _yearlyRows(_yearSel);
  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div><h1 class="page-title">📑 Yearly Report</h1><p class="page-subtitle">Income · Expense · Balance by month</p></div>
        <button class="btn-primary btn-sm" onclick="exportYearlyPDF()">⬇ Export PDF</button>
      </div>
      <div style="display:flex;align-items:center;justify-content:center;gap:20px;margin-bottom:16px">
        <button class="btn-icon btn-sm" onclick="_yearSel--;navigate('yearly',true)">‹</button>
        <span style="font-size:20px;font-weight:800;color:var(--text)">${_yearSel}</span>
        <button class="btn-icon btn-sm" onclick="_yearSel++;navigate('yearly',true)">›</button>
      </div>
      <div class="glass-card" id="yearly-report" style="padding:16px;overflow-x:auto">
        ${_yearlyTableHTML(rows)}
      </div>
    </div>`;
}

function exportYearlyPDF() {
  const rows = _yearlyRows(_yearSel);
  const name = (STATE.settings && STATE.settings.name) || 'atworth User';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>atworth Yearly Report ${_yearSel}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;padding:28px;color:#111}
      h1{font-size:22px;margin:0 0 4px} .sub{color:#666;font-size:13px;margin:0 0 18px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #e2e8f0;padding:9px 12px;text-align:right;font-size:13px}
      th:first-child,td:first-child{text-align:left}
      thead th{background:#00c9a7;color:#fff}
      tfoot th{background:#f1f5f9;font-weight:800}
    </style></head><body>
      <h1>atworth — Yearly Report ${_yearSel}</h1>
      <p class="sub">${name} · Generated ${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</p>
      ${_yearlyTableHTML(rows)}
      <script>setTimeout(function(){window.print();},350);<\/script>
    </body></html>`;
  const w = window.open('', '_blank');
  if (!w) { if (typeof toast === 'function') toast('Allow pop-ups to export the PDF', 'warning'); return; }
  w.document.open(); w.document.write(html); w.document.close();
}
