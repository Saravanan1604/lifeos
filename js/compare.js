// ============================================================
//  LifeOS — Compare page
//  Day-to-day, week-to-week, month-to-month, year-to-year
//  side-by-side comparison of Income / Expense / Savings.
// ============================================================

// Local YYYY-MM-DD (avoids UTC off-by-one from toISOString).
function _cmpISO(d) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

// Sum income/expense/savings for transactions within [start,end] inclusive.
function _cmpSum(start, end) {
  let income = 0, expense = 0;
  (STATE.transactions || []).forEach(t => {
    if (!t.date) return;
    const d = t.date.slice(0, 10);
    if (d >= start && d <= end) {
      if (t.type === 'income') income += (t.amount || 0);
      else expense += (t.amount || 0);
    }
  });
  return { income, expense, savings: income - expense };
}

// Build the 4 comparison periods with current + previous ranges.
function _cmpPeriods() {
  const now = new Date();

  // Day: today vs yesterday
  const y = new Date(now); y.setDate(y.getDate() - 1);
  const dCur = _cmpISO(now), dPrev = _cmpISO(y);

  // Week: Monday→Sunday this week vs last week
  const ws = new Date(now); const dow = (ws.getDay() + 6) % 7; ws.setDate(ws.getDate() - dow);
  const we = new Date(ws); we.setDate(we.getDate() + 6);
  const lws = new Date(ws); lws.setDate(lws.getDate() - 7);
  const lwe = new Date(ws); lwe.setDate(lwe.getDate() - 1);

  // Month: this month vs last month
  const ms = new Date(now.getFullYear(), now.getMonth(), 1);
  const me = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const lms = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lme = new Date(now.getFullYear(), now.getMonth(), 0);

  // Year: this year vs last year
  const ys = new Date(now.getFullYear(), 0, 1);
  const ye = new Date(now.getFullYear(), 11, 31);
  const lys = new Date(now.getFullYear() - 1, 0, 1);
  const lye = new Date(now.getFullYear() - 1, 11, 31);

  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return [
    { key: 'day',   icon: '📅', titleEN: 'Day vs Day',     curLabel: 'Today',       prevLabel: 'Yesterday',
      cur: _cmpSum(dCur, dCur),   prev: _cmpSum(dPrev, dPrev) },
    { key: 'week',  icon: '🗓️', titleEN: 'Week vs Week',   curLabel: 'This Week',   prevLabel: 'Last Week',
      cur: _cmpSum(_cmpISO(ws), _cmpISO(we)), prev: _cmpSum(_cmpISO(lws), _cmpISO(lwe)) },
    { key: 'month', icon: '📆', titleEN: 'Month vs Month', curLabel: MON[ms.getMonth()] + ' ' + String(ms.getFullYear()).slice(2), prevLabel: MON[lms.getMonth()] + ' ' + String(lms.getFullYear()).slice(2),
      cur: _cmpSum(_cmpISO(ms), _cmpISO(me)), prev: _cmpSum(_cmpISO(lms), _cmpISO(lme)) },
    { key: 'year',  icon: '🗂️', titleEN: 'Year vs Year',   curLabel: String(ys.getFullYear()), prevLabel: String(lys.getFullYear()),
      cur: _cmpSum(_cmpISO(ys), _cmpISO(ye)), prev: _cmpSum(_cmpISO(lys), _cmpISO(lye)) },
  ];
}

// % change badge (expense going down = good → green).
function _cmpDelta(cur, prev, lowerIsBetter) {
  if (prev === 0 && cur === 0) return { txt: '—', color: 'var(--text3)' };
  if (prev === 0) return { txt: 'new', color: '#6366f1' };
  const pct = ((cur - prev) / Math.abs(prev)) * 100;
  const up = pct >= 0;
  const good = lowerIsBetter ? !up : up;
  const color = pct === 0 ? 'var(--text3)' : (good ? '#10b981' : '#ef4444');
  const arrow = pct === 0 ? '' : (up ? '↑' : '↓');
  return { txt: `${arrow} ${Math.abs(pct).toFixed(1)}%`, color };
}

function _cmpRow(label, cur, prev, lowerIsBetter, valColor) {
  const d = _cmpDelta(cur, prev, lowerIsBetter);
  return `<div style="display:grid;grid-template-columns:1fr auto auto auto;gap:8px;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
    <span style="font-size:13px;color:var(--text2);font-weight:600">${label}</span>
    <span style="font-size:13px;font-weight:800;color:${valColor};min-width:90px;text-align:right">${fmt(cur)}</span>
    <span style="font-size:12px;color:var(--text3);min-width:90px;text-align:right">${fmt(prev)}</span>
    <span style="font-size:12px;font-weight:800;color:${d.color};min-width:62px;text-align:right">${d.txt}</span>
  </div>`;
}

function renderCompare() {
  const periods = _cmpPeriods();

  const cards = periods.map(p => {
    const savColor = p.cur.savings >= 0 ? '#10b981' : '#ef4444';
    return `<div class="glass-card" style="padding:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <p class="section-title" data-i18n="${p.titleEN}">${typeof t === 'function' ? t(p.titleEN) : p.titleEN}</p>
        <button onclick="speakCompare('${p.key}')" title="Read aloud"
          style="background:rgba(0,201,167,0.12);border:1px solid rgba(0,201,167,0.3);color:#00c9a7;border-radius:8px;padding:4px 10px;font-size:12px;font-weight:700;cursor:pointer">🔊</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr auto auto auto;gap:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.1)">
        <span style="font-size:10px;letter-spacing:.5px;text-transform:uppercase;color:var(--text3)"></span>
        <span style="font-size:10px;letter-spacing:.5px;text-transform:uppercase;color:#00c9a7;min-width:90px;text-align:right">${p.curLabel}</span>
        <span style="font-size:10px;letter-spacing:.5px;text-transform:uppercase;color:var(--text3);min-width:90px;text-align:right">${p.prevLabel}</span>
        <span style="font-size:10px;letter-spacing:.5px;text-transform:uppercase;color:var(--text3);min-width:62px;text-align:right" data-i18n="Change">${typeof t === 'function' ? t('Change') : 'Change'}</span>
      </div>
      ${_cmpRow(t ? t('Income') : 'Income',   p.cur.income,  p.prev.income,  false, '#10b981')}
      ${_cmpRow(t ? t('Expense') : 'Expense', p.cur.expense, p.prev.expense, true,  '#ef4444')}
      ${_cmpRow(t ? t('Savings') : 'Savings', p.cur.savings, p.prev.savings, false, savColor)}
      <div style="margin-top:14px;height:150px"><canvas id="cmp-chart-${p.key}"></canvas></div>
    </div>`;
  }).join('');

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <h1 class="page-title" data-i18n="Compare">${typeof t === 'function' ? t('Compare') : 'Compare'}</h1>
        <p class="page-subtitle" data-i18n="Side-by-side: Day · Week · Month · Year">${typeof t === 'function' ? t('Side-by-side: Day · Week · Month · Year') : 'Side-by-side: Day · Week · Month · Year'}</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px">${cards}</div>
    </div>`;

  // Charts (grouped bars: current vs previous for Income/Expense/Savings)
  if (typeof Chart !== 'undefined') {
    periods.forEach(p => {
      const el = document.getElementById('cmp-chart-' + p.key);
      if (!el) return;
      const ctx = el.getContext('2d');
      chartInstances['cmp-' + p.key] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: [t ? t('Income') : 'Income', t ? t('Expense') : 'Expense', t ? t('Savings') : 'Savings'],
          datasets: [
            { label: p.curLabel,  data: [p.cur.income, p.cur.expense, p.cur.savings],  backgroundColor: 'rgba(0,201,167,0.75)',  borderRadius: 5 },
            { label: p.prevLabel, data: [p.prev.income, p.prev.expense, p.prev.savings], backgroundColor: 'rgba(148,163,184,0.5)', borderRadius: 5 },
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } } },
            tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${fmt(c.parsed.y)}` } } },
          scales: {
            x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } },
            y: { ticks: { color: '#94a3b8', callback: v => '₹' + (Math.abs(v) >= 1000 ? (v/1000).toFixed(0) + 'k' : v) }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    });
  }
}

// Speak a spoken summary of one period in the active language.
function speakCompare(key) {
  const p = _cmpPeriods().find(x => x.key === key);
  if (!p) return;
  const lang = (typeof getLang === 'function') ? getLang() : 'en';
  const cur = p.cur, prev = p.prev;
  const sym = (STATE.settings && STATE.settings.currency) || '₹';
  const n = v => `${sym}${Math.round(Math.abs(v)).toLocaleString('en-IN')}`;
  const savedMore = cur.savings >= prev.savings;
  let msg;
  if (lang === 'ta') {
    msg = `${p.curLabel}: வருமானம் ${n(cur.income)}, செலவு ${n(cur.expense)}, சேமிப்பு ${n(cur.savings)}. ` +
          `முந்தைய காலத்தில் சேமிப்பு ${n(prev.savings)}. நீங்கள் ${savedMore ? 'அதிகம்' : 'குறைவாக'} சேமித்துள்ளீர்கள்.`;
  } else if (lang === 'hi') {
    msg = `${p.curLabel}: आय ${n(cur.income)}, खर्च ${n(cur.expense)}, बचत ${n(cur.savings)}. ` +
          `पिछली अवधि में बचत ${n(prev.savings)}. आपने ${savedMore ? 'अधिक' : 'कम'} बचत की है।`;
  } else {
    msg = `${p.curLabel}: income ${n(cur.income)}, expense ${n(cur.expense)}, savings ${n(cur.savings)}. ` +
          `Previously you saved ${n(prev.savings)}. You saved ${savedMore ? 'more' : 'less'} this time.`;
  }
  if (typeof _speak === 'function') _speak(msg);
  if (typeof toast === 'function') toast(`🔊 ${p.curLabel}: ${t ? t('Savings') : 'Savings'} ${fmt(cur.savings)}`, 'info');
}
