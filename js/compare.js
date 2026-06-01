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

// ---- Custom (user-picked) comparison ----------------------
let _cmpMode = 'month';   // day | week | month | year
const _MON3 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ISO week string "YYYY-Www" for a date (used as <input type=week> value).
function _isoWeekStr(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dn = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - dn + 3);            // Thursday of this week
  const firstThu = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((t - firstThu) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// Default A/B input values for the current mode.
function _cmpDefaults(mode) {
  const now = new Date();
  if (mode === 'day') {
    const y = new Date(now); y.setDate(y.getDate() - 1);
    return [_cmpISO(now), _cmpISO(y)];
  }
  if (mode === 'week') {
    const lw = new Date(now); lw.setDate(lw.getDate() - 7);
    return [_isoWeekStr(now), _isoWeekStr(lw)];
  }
  if (mode === 'year') return [String(now.getFullYear()), String(now.getFullYear() - 1)];
  // month
  const ym = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return [ym(now), ym(lm)];
}

// "2026-W23" → {start,end} Monday..Sunday.
function _isoWeekToRange(val) {
  const m = val.match(/(\d{4})-W(\d{2})/);
  if (!m) return null;
  const year = +m[1], week = +m[2];
  const jan4 = new Date(year, 0, 4);
  const dow = (jan4.getDay() + 6) % 7;
  const wk1Mon = new Date(jan4); wk1Mon.setDate(jan4.getDate() - dow);
  const start = new Date(wk1Mon); start.setDate(wk1Mon.getDate() + (week - 1) * 7);
  const end = new Date(start); end.setDate(start.getDate() + 6);
  return { start, end };
}

// Convert a picker value to {start,end (ISO), label} for the active mode.
function _rangeFromValue(mode, val) {
  if (!val) return null;
  if (mode === 'day') {
    return { start: val, end: val, label: fmtDate(val) };
  }
  if (mode === 'week') {
    const r = _isoWeekToRange(val); if (!r) return null;
    return { start: _cmpISO(r.start), end: _cmpISO(r.end), label: val.replace('-W', ' Wk ') };
  }
  if (mode === 'year') {
    const y = parseInt(val, 10); if (!y) return null;
    return { start: `${y}-01-01`, end: `${y}-12-31`, label: String(y) };
  }
  // month "YYYY-MM"
  const m = val.match(/(\d{4})-(\d{2})/); if (!m) return null;
  const y = +m[1], mo = +m[2] - 1;
  const start = new Date(y, mo, 1), end = new Date(y, mo + 1, 0);
  return { start: _cmpISO(start), end: _cmpISO(end), label: _MON3[mo] + ' ' + String(y).slice(2) };
}

function setCompareMode(mode) {
  _cmpMode = mode;
  const card = document.getElementById('cmp-custom-card');
  if (card) { card.innerHTML = _customCardHTML(); runCustomCompare(); }
}

function _customCardHTML() {
  const T = (typeof t === 'function') ? t : (x => x);
  const [da, db] = _cmpDefaults(_cmpMode);
  const inputType = _cmpMode === 'day' ? 'date' : _cmpMode === 'week' ? 'week' : _cmpMode === 'month' ? 'month' : 'number';
  const yrAttr = _cmpMode === 'year' ? 'min="2000" max="2100" step="1"' : '';
  const modeBtn = (m, label) => `<button onclick="setCompareMode('${m}')"
    style="flex:1;min-width:64px;padding:8px 6px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid ${_cmpMode===m?'rgba(0,201,167,0.5)':'rgba(255,255,255,0.1)'};background:${_cmpMode===m?'rgba(0,201,167,0.18)':'rgba(255,255,255,0.04)'};color:${_cmpMode===m?'#00c9a7':'var(--text2)'}">${label}</button>`;
  return `
    <p class="section-title" style="margin-bottom:12px">🔍 ${T('Custom Compare')}</p>
    <div style="display:flex;gap:8px;margin-bottom:14px">
      ${modeBtn('day', T('Day'))}${modeBtn('week', T('Week'))}${modeBtn('month', T('Month'))}${modeBtn('year', T('Year'))}
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
      <div class="form-group" style="margin:0;flex:1;min-width:130px"><label class="form-label">${T('Period A')}</label>
        <input type="${inputType}" id="cmp-a" class="form-input" value="${da}" ${yrAttr}/></div>
      <div class="form-group" style="margin:0;flex:1;min-width:130px"><label class="form-label">${T('Period B')}</label>
        <input type="${inputType}" id="cmp-b" class="form-input" value="${db}" ${yrAttr}/></div>
      <button class="btn-primary" style="padding:10px 18px" onclick="runCustomCompare()">${T('Compare')}</button>
    </div>
    <div id="cmp-custom-result" style="margin-top:16px"></div>`;
}

function runCustomCompare() {
  const T = (typeof t === 'function') ? t : (x => x);
  const av = document.getElementById('cmp-a')?.value;
  const bv = document.getElementById('cmp-b')?.value;
  const ra = _rangeFromValue(_cmpMode, av), rb = _rangeFromValue(_cmpMode, bv);
  const out = document.getElementById('cmp-custom-result');
  if (!out) return;
  if (!ra || !rb) { out.innerHTML = `<p style="font-size:13px;color:var(--text3)">${T('Pick two periods to compare')}</p>`; return; }
  const cur = _cmpSum(ra.start, ra.end), prev = _cmpSum(rb.start, rb.end);
  const savColor = cur.savings >= 0 ? '#10b981' : '#ef4444';
  out.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr auto auto auto;gap:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.1)">
      <span></span>
      <span style="font-size:10px;letter-spacing:.5px;text-transform:uppercase;color:#00c9a7;min-width:90px;text-align:right">${ra.label}</span>
      <span style="font-size:10px;letter-spacing:.5px;text-transform:uppercase;color:var(--text3);min-width:90px;text-align:right">${rb.label}</span>
      <span style="font-size:10px;letter-spacing:.5px;text-transform:uppercase;color:var(--text3);min-width:62px;text-align:right">${T('Change')}</span>
    </div>
    ${_cmpRow(T('Income'),  cur.income,  prev.income,  false, '#10b981')}
    ${_cmpRow(T('Expense'), cur.expense, prev.expense, true,  '#ef4444')}
    ${_cmpRow(T('Savings'), cur.savings, prev.savings, false, savColor)}
    <div style="margin-top:14px;height:160px"><canvas id="cmp-custom-chart"></canvas></div>`;

  if (typeof Chart !== 'undefined') {
    try { if (chartInstances['cmp-custom']) chartInstances['cmp-custom'].destroy(); } catch (e) {}
    const el = document.getElementById('cmp-custom-chart');
    if (el) chartInstances['cmp-custom'] = new Chart(el.getContext('2d'), {
      type: 'bar',
      data: {
        labels: [T('Income'), T('Expense'), T('Savings')],
        datasets: [
          { label: ra.label, data: [cur.income, cur.expense, cur.savings],  backgroundColor: 'rgba(0,201,167,0.75)',  borderRadius: 5 },
          { label: rb.label, data: [prev.income, prev.expense, prev.savings], backgroundColor: 'rgba(148,163,184,0.5)', borderRadius: 5 },
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
  }
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
      <div id="cmp-custom-card" class="glass-card" style="padding:20px;margin-bottom:16px">${_customCardHTML()}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px">${cards}</div>
    </div>`;

  // Render the custom comparison result with its default A/B periods
  runCustomCompare();

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
