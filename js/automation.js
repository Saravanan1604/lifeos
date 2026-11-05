// ============================================================
//  automation.js — Life OS 2.0 smart automation (build 676, app)
//   • Subscription detector  — repeating payments not yet tracked
//   • Unusual-spend alerts   — expense far above your category norm
//   • Cash-flow forecast     — 30 / 90-day balance projection
//   • Controls               — switch each alert type on/off
//  On-device, from the user's own data. Forecasts are estimates.
// ============================================================

function _smartPrefs() {
  STATE.settings = STATE.settings || {};
  const d = { budget: true, unusual: true, bills: true };
  return Object.assign(d, STATE.settings.smart || {});
}
function setSmartPref(k, on) {
  STATE.settings = STATE.settings || {};
  STATE.settings.smart = Object.assign(_smartPrefs(), { [k]: !!on });
  saveState();
  toast(`${{ budget: 'Budget alerts', unusual: 'Unusual-spend alerts', bills: 'Bill reminders' }[k]} ${on ? 'on' : 'off'}`, 'info');
}

// ══════════════════════════════════════════════════════════
// SUBSCRIPTION DETECTOR
// ══════════════════════════════════════════════════════════
function _subKey(desc) {
  return (desc || '').toLowerCase().replace(/[0-9#*\-_/.:]+/g, ' ').replace(/\b(upi|ref|txn|payment|paid|to|via|pvt|ltd|india)\b/g, ' ').replace(/\s+/g, ' ').trim();
}
function detectSubscriptions() {
  const since = new Date(); since.setMonth(since.getMonth() - 13);
  const sinceS = _ymdLocal(since);
  const groups = {};
  (STATE.transactions || []).forEach(t => {
    if (t.type === 'income' || !t.date || t.date < sinceS) return;
    const k = _subKey(t.description); if (k.length < 3) return;
    (groups[k] = groups[k] || []).push(t);
  });
  const tracked = new Set((STATE.recurring || []).map(r => _subKey(r.description || r.category)));
  const dismissed = new Set((STATE.dismissedSubs || []).map(d => d.id));
  const out = [];
  Object.entries(groups).forEach(([k, list]) => {
    if (list.length < 2 || tracked.has(k) || dismissed.has('sub_' + k)) return;
    list.sort((a, b) => a.date.localeCompare(b.date));
    const amts = list.map(t => +t.amount).sort((a, b) => a - b);
    const med = amts[Math.floor(amts.length / 2)];
    if (!(med > 0)) return;
    const similar = list.filter(t => Math.abs(t.amount - med) / med <= 0.15);
    if (similar.length < 2) return;
    const gaps = [];
    for (let i = 1; i < similar.length; i++) gaps.push((new Date(similar[i].date) - new Date(similar[i - 1].date)) / 864e5);
    const g = gaps.slice().sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
    let freq = null;
    if (g >= 26 && g <= 35 && similar.length >= 3) freq = 'monthly';
    else if (g >= 26 && g <= 35 && similar.length === 2) freq = 'monthly';
    else if (g >= 6 && g <= 8 && similar.length >= 4) freq = 'weekly';
    else if (g >= 85 && g <= 95) freq = '3monthly';
    else if (g >= 355 && g <= 375) freq = 'yearly';
    if (!freq) return;
    // consistency: most gaps near the median
    const ok = gaps.filter(x => Math.abs(x - g) <= Math.max(4, g * 0.15)).length / gaps.length;
    if (ok < 0.6) return;
    const last = similar[similar.length - 1];
    const next = typeof _advanceDate === 'function' ? _advanceDate(last.date.slice(0, 10), freq) : '';
    // stale: last seen more than 2 cycles ago → probably cancelled
    if ((Date.now() - new Date(last.date)) / 864e5 > g * 2.2) return;
    const monthly = freq === 'monthly' ? med : freq === 'weekly' ? med * 4.345 : freq === '3monthly' ? med / 3 : med / 12;
    out.push({ key: k, name: last.description || k, category: last.category, amount: Math.round(med), freq, next, count: similar.length, monthly, source: last.source || '' });
  });
  return out.sort((a, b) => b.monthly - a.monthly);
}
function trackSubscription(key) {
  const s = detectSubscriptions().find(x => x.key === key); if (!s) return;
  STATE.recurring = STATE.recurring || [];
  STATE.recurring.push({ id: genId(), type: 'expense', amount: s.amount, category: s.category, icon: typeof catIcon === 'function' ? catIcon(s.category) : '💳',
    description: s.name, source: s.source, subcategory: '', frequency: s.freq, nextDate: s.next, createdAt: new Date().toISOString() });
  saveState();
  toast(`${s.name} added to Recurring — you'll get a reminder before it's due ✓`, 'success');
  renderSmartApp();
}
function dismissSubscription(key) {
  STATE.dismissedSubs = STATE.dismissedSubs || [];
  STATE.dismissedSubs.push({ id: 'sub_' + key, at: Date.now() });
  saveState(); renderSmartApp();
}

// ══════════════════════════════════════════════════════════
// UNUSUAL SPENDING
// ══════════════════════════════════════════════════════════
function _catNorm(cat, beforeDate, excludeId) {
  const from = new Date(beforeDate || Date.now()); from.setDate(from.getDate() - 120);
  const fromS = _ymdLocal(from), toS = (beforeDate || _ymdLocal(new Date())).slice(0, 10);
  const amts = (STATE.transactions || []).filter(t => t.type !== 'income' && t.id !== excludeId && t.category === cat && (t.date || '') >= fromS && (t.date || '').slice(0, 10) <= toS).map(t => +t.amount || 0).sort((a, b) => a - b);
  if (amts.length < 5) return null;
  return { median: amts[Math.floor(amts.length / 2)], p90: amts[Math.floor(amts.length * 0.9)], n: amts.length };
}
function _isUnusual(t) {
  if (!t || t.type === 'income' || !(+t.amount >= 1000)) return null;
  const n = _catNorm(t.category, (t.date || '').slice(0, 10), t.id);
  if (!n || !(n.median > 0)) return null;
  const x = t.amount / n.median;
  if (x >= 3 && t.amount > n.p90 * 1.3) return { x, typical: n.median };
  return null;
}
function unusualThisMonth() {
  const ym = _ymdLocal(new Date()).slice(0, 7);
  return (STATE.transactions || []).filter(t => (t.date || '').startsWith(ym)).map(t => ({ t, u: _isUnusual(t) })).filter(o => o.u).sort((a, b) => b.t.amount - a.t.amount);
}
function _unusualCheck(t) {
  try {
    if (!_smartPrefs().unusual) return;
    const u = _isUnusual(t); if (!u) return;
    const msg = `Unusual spend: ${fmt(t.amount)} on ${t.category} is ${u.x.toFixed(1)}× your typical ${fmt(Math.round(u.typical))}`;
    setTimeout(() => toast('👀 ' + msg, 'warning'), 1200);
    if (typeof _sysNotify === 'function') _sysNotify('Unusual spending', msg);
  } catch (_) {}
}

// ══════════════════════════════════════════════════════════
// CASH-FLOW FORECAST
// ══════════════════════════════════════════════════════════
function cashForecast(days) {
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const end = new Date(t0); end.setDate(end.getDate() + days);
  const endS = _ymdLocal(end), todayS = _ymdLocal(t0);
  const start = (STATE.bankAccounts || []).reduce((s, a) => s + (+a.balance || 0), 0) + (STATE.cashAccounts || []).reduce((s, a) => s + (+a.balance || 0), 0);
  const events = {};
  const add = (d, v, label) => { (events[d] = events[d] || []).push({ v, label }); };
  const rec = (STATE.recurring || []).filter(r => r.enabled !== false && r.nextDate);
  rec.forEach(r => {
    let d = r.nextDate, g = 0;
    while (d && d <= endS && g < 400) { if (d >= todayS) add(d, (r.type === 'income' ? 1 : -1) * (+r.amount || 0), r.description || r.category); if (!r.frequency || typeof _advanceDate !== 'function') break; d = _advanceDate(d, r.frequency); g++; }
  });
  // loan EMIs not already covered by a recurring rule of the same amount
  (STATE.loans || []).forEach(l => {
    const emi = +l.emi || 0; if (!(emi > 0)) return;
    if (rec.some(r => r.type !== 'income' && Math.abs((+r.amount || 0) - emi) < 1)) return;
    const st = l.startDate ? new Date(l.startDate + 'T00:00:00') : null;
    const dom = st && !isNaN(st) ? Math.min(st.getDate(), 28) : 5;
    for (let m = 0; m <= Math.ceil(days / 28) + 1; m++) { const d = new Date(t0.getFullYear(), t0.getMonth() + m, dom); const s = _ymdLocal(d); if (s >= todayS && s <= endS) add(s, -emi, (l.name || 'Loan') + ' EMI'); }
  });
  // card dues: assume paid within the month
  const cardDue = (STATE.creditCards || []).reduce((s, c) => s + (+c.outstanding || 0), 0);
  // everyday spending = last 60 days expenses minus anything that looks recurring
  const from = new Date(t0); from.setDate(from.getDate() - 60);
  const recKeys = new Set(rec.map(r => _subKey(r.description || r.category)));
  const daily = (STATE.transactions || []).filter(t => t.type !== 'income' && (t.date || '') >= _ymdLocal(from) && (t.date || '').slice(0, 10) < todayS && !t.recurringId && !recKeys.has(_subKey(t.description)) && !/^emi$/i.test(t.category || ''))
    .reduce((s, t) => s + (+t.amount || 0), 0) / 60;
  const pts = []; let bal = start, low = { v: start, d: todayS };
  for (let i = 0; i <= days; i++) {
    const d = new Date(t0); d.setDate(d.getDate() + i); const s = _ymdLocal(d);
    if (i > 0) bal -= daily;
    if (i === Math.min(days, 25) && cardDue) bal -= cardDue;
    (events[s] || []).forEach(e => { bal += e.v; });
    pts.push({ d: s, v: bal });
    if (bal < low.v) low = { v: bal, d: s };
  }
  const upcoming = Object.entries(events).sort((a, b) => a[0].localeCompare(b[0])).flatMap(([d, l]) => l.map(e => ({ d, ...e })));
  return { start, end: bal, low, daily, cardDue, pts, upcoming };
}

// ══════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════
let _fcDays = 30;
function setFcDays(n) { _fcDays = n; renderSmartApp(); }
function renderSmartApp() {
  const F = cashForecast(_fcDays);
  const subs = detectSubscriptions();
  const unus = unusualThisMonth();
  const pref = _smartPrefs();
  const W = 320, H = 130, lo = Math.min(0, ...F.pts.map(p => p.v)), hi = Math.max(1, ...F.pts.map(p => p.v));
  const x = i => (i / Math.max(1, F.pts.length - 1)) * W, y = v => H - 6 - (v - lo) / ((hi - lo) || 1) * (H - 12);
  const line = F.pts.map((p, i) => `${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const neg = F.low.v < 0, c = neg ? '#F05260' : '#22D3EE';
  const li = F.pts.findIndex(p => p.d === F.low.d);
  const subTotal = subs.reduce((s, x) => s + x.monthly, 0);
  const trackedSubs = (STATE.recurring || []).filter(r => r.type !== 'income' && r.enabled !== false);
  const S = typeof _H !== 'undefined' ? _H.short.bind(_H) : (v => fmt(Math.round(v)));
  const tg = (k, l, d) => `<label class="sm-tg"><div><b>${l}</b><span>${d}</span></div><input type="checkbox" ${pref[k] ? 'checked' : ''} onchange="setSmartPref('${k}',this.checked)"/><i></i></label>`;

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in an-page sm-page">
      <div class="an-top"><h1 class="an-title">Forecast &amp; automation</h1></div>

      <div class="hx-card">
        <div class="hx-an-head"><p class="hx-t">Cash-flow forecast <em class="sm-est">estimate</em></p>
          <div class="nw-chips">${[30, 90].map(d => `<button class="${_fcDays === d ? 'on' : ''}" onclick="setFcDays(${d})">${d} days</button>`).join('')}</div></div>
        <div class="sm-fc-top">
          <div><span>Now</span><b>${S(F.start)}</b></div>
          <div><span>In ${_fcDays} days</span><b style="color:${F.end < 0 ? '#F05260' : 'inherit'}">${F.end < 0 ? '-' : ''}${S(Math.abs(F.end))}</b></div>
          <div><span>Lowest</span><b style="color:${c}">${F.low.v < 0 ? '-' : ''}${S(Math.abs(F.low.v))}</b><em>${fmtDate(F.low.d)}</em></div>
        </div>
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="an-line">
          <defs><linearGradient id="fcG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".3"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs>
          ${lo < 0 ? `<line x1="0" x2="${W}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}" class="an-zero"/>` : ''}
          <polygon points="0,${H} ${line} ${W},${H}" fill="url(#fcG)"/>
          <polyline points="${line}" class="an-cur" stroke="${c}"/>
          ${li >= 0 ? `<circle cx="${x(li).toFixed(1)}" cy="${y(F.low.v).toFixed(1)}" r="4" fill="${c}"/>` : ''}
        </svg>
        <p class="sm-note">${neg
          ? `⚠️ Looks like you'll run short around <b>${fmtDate(F.low.d)}</b> — about <b>${fmt(Math.round(-F.low.v))}</b> needed. Move money in or trim spending before then.`
          : `You stay above zero for the next ${_fcDays} days. Tightest point: <b>${fmtDate(F.low.d)}</b>.`}</p>
        <p class="sm-how">Based on your account balances, ${F.upcoming.length} scheduled income/bill/EMI events, ${F.cardDue ? `card dues of ${fmt(Math.round(F.cardDue))}, ` : ''}and everyday spending of about ${fmt(Math.round(F.daily))}/day (your last 60 days, excluding recurring).</p>
        ${F.upcoming.length ? `<div class="sm-ev">${F.upcoming.slice(0, 6).map(e => `<div><span>${fmtDate(e.d)}</span><p>${esc(e.label)}</p><b class="${e.v >= 0 ? 'inc' : 'exp'}">${e.v >= 0 ? '+' : '-'}${fmt(Math.round(Math.abs(e.v)))}</b></div>`).join('')}</div>` : ''}
      </div>

      <div class="hx-card">
        <div class="hx-an-head"><p class="hx-t">Subscriptions found</p>${subs.length ? `<span class="an-sub">~${fmt(Math.round(subTotal))}/mo</span>` : ''}</div>
        ${subs.length ? subs.map(s => `<div class="sm-sub">
            <div class="sm-sub-m"><b>${esc(s.name)}</b><span>${fmt(s.amount)} · ${typeof _freqLabel === 'function' ? _freqLabel(s.freq) : s.freq} · seen ${s.count}× · next ~${fmtDate(s.next)}</span></div>
            <div class="sm-sub-a"><button class="on" onclick="trackSubscription('${s.key.replace(/'/g, "\\'")}')">Track</button><button onclick="dismissSubscription('${s.key.replace(/'/g, "\\'")}')">Not one</button></div>
          </div>`).join('')
          : `<p class="hx-s">No untracked repeating payments found in the last year. ${trackedSubs.length ? `You're tracking ${trackedSubs.length} recurring payment${trackedSubs.length > 1 ? 's' : ''}.` : ''}</p>`}
        ${trackedSubs.length ? `<button class="hx-ask" onclick="navigate('recurring')"><i data-lucide="repeat"></i> Manage ${trackedSubs.length} recurring payment${trackedSubs.length > 1 ? 's' : ''}</button>` : ''}
      </div>

      <div class="hx-card">
        <div class="hx-an-head"><p class="hx-t">Unusual this month</p></div>
        ${unus.length ? unus.slice(0, 5).map(o => `<div class="sm-un" onclick="openEditTxModal('${o.t.id}')"><div><b>${fmt(o.t.amount)} · ${esc(o.t.category)}</b><span>${esc(o.t.description || '')} · ${fmtDate(o.t.date)}</span></div><em>${o.u.x.toFixed(1)}× usual</em></div>`).join('')
          : `<p class="hx-s">Nothing out of the ordinary — every expense this month is within your normal range for its category.</p>`}
      </div>

      <div class="hx-card">
        <div class="hx-an-head"><p class="hx-t">Alerts &amp; automation</p></div>
        ${tg('budget', 'Budget alerts', 'Warn at 80% and 100% of a category budget')}
        ${tg('unusual', 'Unusual-spend alerts', 'Flag an expense ≥3× your normal for its category')}
        ${tg('bills', 'Bill reminders', 'Daily heads-up for bills due today or tomorrow')}
        <p class="sm-how">Everything here is worked out on this phone from your own data.</p>
      </div>
    </div>`;
  if (window.lucide && lucide.createIcons) { try { lucide.createIcons(); } catch (_) {} }
}
