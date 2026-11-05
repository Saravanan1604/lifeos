// ============================================================
//  smart.js — build 671 feature pack
//   1. Budget alerts      — warn at 80% / 100% of a category budget
//   2. SMS quick-import   — one-tap paste from clipboard + share-to-app
//   3. Loan payoff        — "debt-free by" card + payoff line per loan
//   4. Bill reminders     — bills due in 3 days in the bell, Paid now / Skip
//   5. Edit anywhere      — tap a row's category circle to recategorise,
//                           tap an account balance to update it
//   6. Quick actions      — ?action=… launch links (home-screen shortcuts)
//   7. Smart search       — "food > 500 last month" style Records search
// ============================================================

// ── shared: system notification (browser / installed PWA only) ──
function _sysNotify(title, body) {
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') { Notification.requestPermission().catch(() => {}); return; }
    if (Notification.permission !== 'granted') return;
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(reg => reg.showNotification(title, { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' })).catch(() => {});
    } else { new Notification(title, { body }); }
  } catch (_) {}
}

// ══════════════════════════════════════════════════════════
// 1. BUDGET ALERTS
// ══════════════════════════════════════════════════════════
function _budgetLimitMonthly(b) {
  const fac = { day: 30.44, week: 4.345, month: 1, year: 1 / 12 }[b.period || 'month'] || 1;
  return (+b.amount || +b.limit || 0) * fac;
}
function _budgetAlertCheck(cat) {
  try {
    if (!cat) return;
    const b = (STATE.budgets || []).find(x => (x.category || '').toLowerCase() === String(cat).toLowerCase());
    if (!b) return;
    const limit = _budgetLimitMonthly(b);
    if (!limit) return;
    const ym = _ymdLocal(new Date()).slice(0, 7);
    const spent = (STATE.transactions || [])
      .filter(t => t.type !== 'income' && (t.date || '').startsWith(ym) && (t.category || '').toLowerCase() === b.category.toLowerCase())
      .reduce((s, t) => s + (+t.amount || 0), 0);
    const pct = spent / limit * 100;
    const level = pct >= 100 ? 100 : pct >= 80 ? 80 : 0;
    if (!level) return;
    const key = 'lifeos_budalert_' + ym + '_' + b.category.toLowerCase();
    const prev = +(localStorage.getItem(key) || 0);
    if (prev >= level) return;           // already warned at this level this month
    localStorage.setItem(key, String(level));
    const msg = level === 100
      ? `${b.category} budget exceeded — ${fmt(spent)} of ${fmt(limit)}`
      : `${b.category} is at ${Math.round(pct)}% of budget — ${fmt(Math.max(0, limit - spent))} left`;
    setTimeout(() => { if (typeof toast === 'function') toast((level === 100 ? '🚨 ' : '⚠️ ') + msg, level === 100 ? 'error' : 'warning'); }, 650);
    _sysNotify('Budget alert', msg);
    if (typeof _updateNotifBadge === 'function') _updateNotifBadge();
  } catch (_) {}
}

// ══════════════════════════════════════════════════════════
// 2. SMS QUICK-IMPORT
// ══════════════════════════════════════════════════════════
async function smsPasteClipboard() {
  const ta = document.getElementById('sms-raw');
  try {
    const txt = await navigator.clipboard.readText();
    if (!txt || !txt.trim()) { toast('Clipboard is empty — copy a bank SMS first', 'warning'); return; }
    if (ta) ta.value = txt;
    if (typeof parseAllSmsBlocks === 'function') parseAllSmsBlocks();
  } catch (_) {
    toast('Allow clipboard access, or long-press the box and tap Paste', 'info');
    if (ta) ta.focus();
  }
}
// Open the SMS parser pre-filled (used by share-to-app and ?sms=… links)
function openSmsWithText(text) {
  if (typeof openSmsParser !== 'function') return;
  openSmsParser();
  setTimeout(() => {
    const ta = document.getElementById('sms-raw');
    if (ta) { ta.value = text; if (typeof parseAllSmsBlocks === 'function') parseAllSmsBlocks(); }
  }, 120);
}

// ══════════════════════════════════════════════════════════
// 3. LOAN PAYOFF
// ══════════════════════════════════════════════════════════
function _loanPayoff(l) {
  try {
    const out = typeof _loanOutstanding === 'function' ? _loanOutstanding(l) : (+l.outstanding || 0);
    if (out <= 0) return { done: true };
    const annual = typeof _loanAnnualRate === 'function' ? _loanAnnualRate(l) : (+l.interestRate || 0);
    const emi = typeof _workableEmi === 'function' ? _workableEmi(l, out, annual) : (+l.emi || 0);
    if (!(emi > 0)) return { noEmi: true, out };
    const s = _amortizeSchedule(out, annual, emi, 0, 0);
    if (s.neverCloses) return { never: true, out, emi };
    const end = new Date(); end.setMonth(end.getMonth() + s.months);
    return { months: s.months, end, interest: s.totalInterest, out, emi };
  } catch (_) { return {}; }
}
function _loanPayoffLine(l) {
  const p = _loanPayoff(l);
  if (p.done) return `<p class="ia-payoff ok">✓ Fully paid</p>`;
  if (p.never) return `<p class="ia-payoff bad">⚠ EMI ${fmt(p.emi)} is below the interest — this never closes</p>`;
  if (!p.months) return '';
  const when = p.end.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  return `<p class="ia-payoff">Free by <b>${when}</b> · ${p.months} mo left · ${fmt(Math.round(p.interest))} interest</p>`;
}
function _debtFreeCardHtml() {
  const loans = (STATE.loans || []);
  if (!loans.length) return '';
  let last = null, interest = 0, never = 0, monthly = 0;
  loans.forEach(l => {
    const p = _loanPayoff(l);
    if (p.never) never++;
    if (p.months) { interest += p.interest; monthly += p.emi; if (!last || p.end > last) last = p.end; }
  });
  if (!last && !never) return '';
  return `<div class="ia-card debtfree-card">
    <p class="df-lbl">Debt-free by</p>
    <p class="df-val">${last ? last.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}</p>
    <div class="df-row">
      <div><span>Monthly EMIs</span><b>${fmt(Math.round(monthly))}</b></div>
      <div><span>Interest still to pay</span><b>${fmt(Math.round(interest))}</b></div>
    </div>
    ${never ? `<p class="df-warn">⚠ ${never} loan${never > 1 ? 's' : ''} won't close at the current EMI — open it and try the what-if.</p>` : `<p class="df-tip">Tap a loan → What-if to see how an extra payment brings this date closer.</p>`}
  </div>`;
}

// ══════════════════════════════════════════════════════════
// 4. BILL REMINDERS
// ══════════════════════════════════════════════════════════
function _billsDue(days) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const lim = new Date(t); lim.setDate(lim.getDate() + (days == null ? 3 : days));
  const todayS = _ymdLocal(t), limS = _ymdLocal(lim);
  return (STATE.recurring || [])
    .filter(r => r.enabled !== false && r.type !== 'income' && r.nextDate && r.nextDate >= todayS && r.nextDate <= limS)
    .map(r => ({ r, days: Math.round((new Date(r.nextDate + 'T00:00:00') - t) / 86400000) }))
    .sort((a, b) => a.days - b.days);
}
function billPayNow(id) {
  const r = (STATE.recurring || []).find(x => x.id === id); if (!r) return;
  const tx = { id: genId(), type: r.type || 'expense', amount: r.amount, date: today(), time: '', category: r.category,
    icon: r.icon || (typeof catIcon === 'function' ? catIcon(r.category) : '💳'), description: r.description || r.category,
    subcategory: r.subcategory || '', source: r.source || '', createdAt: new Date().toISOString() };
  STATE.transactions = STATE.transactions || [];
  STATE.transactions.unshift(tx);
  if (typeof _applyTxToAccount === 'function') _applyTxToAccount(tx);
  // advance so the auto-post on the due date doesn't charge it twice
  r.nextDate = typeof _advanceDate === 'function' ? _advanceDate(r.nextDate, r.frequency) : r.nextDate;
  saveState();
  toast(`${r.description || r.category} marked paid ✓`, 'success');
  _budgetAlertCheck(r.category);
  _afterBillAction();
}
function billSkip(id) {
  const r = (STATE.recurring || []).find(x => x.id === id); if (!r) return;
  r.nextDate = typeof _advanceDate === 'function' ? _advanceDate(r.nextDate, r.frequency) : r.nextDate;
  saveState();
  toast(`Skipped this ${r.description || r.category} — next on ${fmtDate(r.nextDate)}`, 'info');
  _afterBillAction();
}
function _afterBillAction() {
  if (typeof _updateNotifBadge === 'function') _updateNotifBadge();
  const panel = document.getElementById('notif-panel');
  if (panel && panel.classList.contains('notif-open') && typeof openNotifPanel === 'function') openNotifPanel();
  if (typeof navigate === 'function' && typeof currentPage !== 'undefined') navigate(currentPage, true);
}
// Once a day on open: heads-up for bills due today / tomorrow
function _billDailyCheck() {
  try {
    if (!STATE.user) return;
    const key = 'lifeos_billcheck_' + today();
    if (localStorage.getItem(key)) return;
    const due = _billsDue(1);
    localStorage.setItem(key, '1');
    if (!due.length) return;
    const names = due.slice(0, 2).map(x => x.r.description || x.r.category).join(', ');
    const msg = `${due.length} bill${due.length > 1 ? 's' : ''} due ${due[0].days === 0 ? 'today' : 'tomorrow'}: ${names}${due.length > 2 ? '…' : ''}`;
    toast('🔔 ' + msg + ' — tap the bell', 'info');
    _sysNotify('Bills due', msg);
  } catch (_) {}
}

// mobile bell badge (the app's bell had none)
function _mobileBellBadge(n) {
  const btn = document.getElementById('mobile-notif-btn'); if (!btn) return;
  let b = btn.querySelector('.mnb-badge');
  if (!b) { b = document.createElement('span'); b.className = 'mnb-badge'; btn.appendChild(b); }
  b.textContent = n > 9 ? '9+' : String(n);
  b.style.display = n > 0 ? 'flex' : 'none';
}

// ══════════════════════════════════════════════════════════
// 5. EDIT ANYWHERE
// ══════════════════════════════════════════════════════════
function openQuickCat(id) {
  const tx = (STATE.transactions || []).find(t => t.id === id); if (!tx) return;
  const cats = getAllCategories().filter(c => !c.type || c.type === 'both' || c.type === (tx.type === 'income' ? 'income' : 'expense'));
  const name = (tx.description || '').trim();
  const same = name ? (STATE.transactions || []).filter(t => t.id !== id && (t.description || '').trim().toLowerCase() === name.toLowerCase()).length : 0;
  const safe = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  openModal('🏷️ Change category', `
    <p class="qc-for">${name ? `For <b>${esc(name)}</b> · ${fmt(tx.amount)}` : fmt(tx.amount)}</p>
    ${same ? `<label class="qc-same"><input type="checkbox" id="qc-same" checked/><span>Also move the other <b>${same}</b> "${esc(name)}" entr${same > 1 ? 'ies' : 'y'} &amp; remember it for new ones</span></label>` : ''}
    <div class="qc-grid">${cats.map(c => `
      <button class="qc-chip ${c.name === tx.category ? 'on' : ''}" onclick="applyQuickCat('${id}','${safe(c.name)}')">
        <span class="qc-ic" style="background:${catColor(c.name)}">${catIconHtml(c.name)}</span><span class="qc-nm">${esc(c.name)}</span>
      </button>`).join('')}</div>
    <button class="btn-secondary qc-detail" onclick="closeModal();openCategoryDetail('${safe(tx.category || 'Other')}')">See all ${esc(tx.category || 'Other')} spending →</button>`);
  if (window.lucide && lucide.createIcons) { try { lucide.createIcons(); } catch (_) {} }
}
function applyQuickCat(id, cat) {
  const tx = (STATE.transactions || []).find(t => t.id === id); if (!tx) return;
  const sameOn = document.getElementById('qc-same')?.checked;
  tx.category = cat;
  tx.icon = getAllCategories().find(c => c.name === cat)?.icon || tx.icon;
  let n = 0;
  if (tx.description && (sameOn || !document.getElementById('qc-same'))) n = applyCategoryToSameName(tx.description, cat, id, false);
  saveState();
  closeModal();
  toast(`Moved to ${cat}${n ? ` · ${n} more updated` : ''} ✓`, 'success');
  if (tx.type !== 'income') _budgetAlertCheck(cat);
  if (typeof navigate === 'function') navigate(currentPage || 'transactions', true);
}

// ══════════════════════════════════════════════════════════
// 6. QUICK ACTIONS (launch links / home-screen shortcuts)
// ══════════════════════════════════════════════════════════
function _runLaunchAction() {
  try {
    const qs = new URLSearchParams(location.search);
    const act = qs.get('action'), sms = qs.get('sms') || qs.get('text');
    if (!act && !sms) return;
    history.replaceState(null, '', location.pathname);   // run once
    if (!STATE.user) return;
    setTimeout(() => {
      if (sms) return openSmsWithText(sms);
      if (act === 'add-expense') return window.__IS_APP && typeof openTxPad === 'function' ? openTxPad('expense') : openAddTxModal('expense');
      if (act === 'add-income')  return window.__IS_APP && typeof openTxPad === 'function' ? openTxPad('income')  : openAddTxModal('income');
      if (act === 'scan-sms')    return openSmsParser();
      if (['records', 'budget', 'finance', 'investments', 'upcoming'].includes(act)) return navigate(act === 'records' ? 'transactions' : act);
    }, 700);
  } catch (_) {}
}

// ══════════════════════════════════════════════════════════
// 7. SMART SEARCH  — "food > 500 last month", "income this week",
//    "swiggy under 200", "last 7 days", "above 1000 shopping"
// ══════════════════════════════════════════════════════════
function _parseSmartQuery(q) {
  const out = { text: '', min: null, max: null, type: null, from: null, to: null, cats: [] };
  if (!q || !q.trim()) return out;
  let s = ' ' + q.toLowerCase().replace(/₹|rs\.?|inr/g, ' ').replace(/,/g, '') + ' ';
  const num = '(\\d+(?:\\.\\d+)?)\\s*(k)?';
  const val = (n, k) => (+n) * (k ? 1000 : 1);
  s = s.replace(new RegExp('(?:>=?|\\babove\\b|\\bover\\b|\\bmore than\\b|\\bmin\\b)\\s*' + num, 'g'), (_, n, k) => { out.min = val(n, k); return ' '; });
  s = s.replace(new RegExp('(?:<=?|\\bbelow\\b|\\bunder\\b|\\bless than\\b|\\bmax\\b)\\s*' + num, 'g'), (_, n, k) => { out.max = val(n, k); return ' '; });
  s = s.replace(new RegExp('\\bbetween\\s*' + num + '\\s*(?:and|-|to)\\s*' + num, 'g'), (_, a, ka, b, kb) => { out.min = val(a, ka); out.max = val(b, kb); return ' '; });
  if (/\b(income|credit|credited|received)\b/.test(s)) { out.type = 'income'; s = s.replace(/\b(income|credit|credited|received)\b/g, ' '); }
  if (/\b(expenses?|spent|spend|debit|debited|paid)\b/.test(s)) { out.type = 'expense'; s = s.replace(/\b(expenses?|spent|spend|debit|debited|paid)\b/g, ' '); }
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const ymd = d => _ymdLocal(d);
  const add = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const range = (a, b) => { out.from = ymd(a); out.to = ymd(b); };
  const rules = [
    [/\btoday\b/, () => range(t0, t0)],
    [/\byesterday\b/, () => range(add(t0, -1), add(t0, -1))],
    [/\blast (\d+) days?\b/, m => range(add(t0, -(+m[1] - 1)), t0)],
    [/\bthis week\b/, () => { const mon = add(t0, -((t0.getDay() + 6) % 7)); range(mon, add(mon, 6)); }],
    [/\blast week\b/, () => { const mon = add(t0, -((t0.getDay() + 6) % 7) - 7); range(mon, add(mon, 6)); }],
    [/\bthis month\b/, () => range(new Date(t0.getFullYear(), t0.getMonth(), 1), new Date(t0.getFullYear(), t0.getMonth() + 1, 0))],
    [/\blast month\b/, () => range(new Date(t0.getFullYear(), t0.getMonth() - 1, 1), new Date(t0.getFullYear(), t0.getMonth(), 0))],
    [/\bthis year\b/, () => range(new Date(t0.getFullYear(), 0, 1), new Date(t0.getFullYear(), 11, 31))],
    [/\blast year\b/, () => range(new Date(t0.getFullYear() - 1, 0, 1), new Date(t0.getFullYear() - 1, 11, 31))],
  ];
  for (const [re, fn] of rules) { const m = s.match(re); if (m) { fn(m); s = s.replace(re, ' '); break; } }
  // month names: "march", "mar 2026"
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  if (!out.from) {
    const mm = s.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b(?:\s+(\d{4}))?/);
    if (mm) {
      const mi = months.indexOf(mm[1]);
      let y = mm[2] ? +mm[2] : t0.getFullYear();
      if (!mm[2] && mi > t0.getMonth()) y--;                 // "dec" in Nov → last December
      range(new Date(y, mi, 1), new Date(y, mi + 1, 0));
      s = s.replace(mm[0], ' ');
    }
  }
  s = s.replace(/\b(in|on|for|at|from|the|of|and)\b/g, ' ');
  // remaining words that are category names → category filter
  const catNames = (typeof getAllCategories === 'function' ? getAllCategories() : []).map(c => c.name);
  const words = [];
  s.split(/\s+/).filter(Boolean).forEach(w => {
    const hit = catNames.find(c => c.toLowerCase() === w);
    if (hit) out.cats.push(hit); else words.push(w);
  });
  out.text = words.join(' ');
  return out;
}
// Apply a parsed query. `base` is the period-filtered list; if the query has
// its own date phrase, search all transactions in that range instead.
function _applySmartQuery(base, sq) {
  let list = sq.from ? (STATE.transactions || []).filter(t => { const d = (t.date || '').slice(0, 10); return d >= sq.from && d <= sq.to; }) : base;
  if (sq.type) list = list.filter(t => (sq.type === 'income') === (t.type === 'income'));
  if (sq.min != null) list = list.filter(t => (+t.amount || 0) >= sq.min);
  if (sq.max != null) list = list.filter(t => (+t.amount || 0) <= sq.max);
  if (sq.cats.length) list = list.filter(t => sq.cats.includes(t.category));
  if (sq.text) {
    const words = sq.text.split(/\s+/);
    list = list.filter(t => {
      const hay = ((t.description || '') + ' ' + (t.category || '') + ' ' + (t.subcategory || '') + ' ' + (t.tag || '') + ' ' + (t.note || '')).toLowerCase();
      return words.every(w => hay.includes(w));
    });
  }
  return list;
}
function _smartQueryLabel(sq) {
  const bits = [];
  if (sq.cats.length) bits.push(sq.cats.join(', '));
  if (sq.text) bits.push(`"${sq.text}"`);
  if (sq.type) bits.push(sq.type === 'income' ? 'income' : 'expenses');
  if (sq.min != null) bits.push('≥ ' + fmt(sq.min));
  if (sq.max != null) bits.push('≤ ' + fmt(sq.max));
  if (sq.from) bits.push(sq.from === sq.to ? fmtDate(sq.from) : `${fmtDate(sq.from)} – ${fmtDate(sq.to)}`);
  return bits.join(' · ');
}
function setRecSmartSearch(q) {
  _recSearch = q;
  const el = document.getElementById('rf-search'); if (el) el.value = q;
  if (typeof renderRecordsMyMoney === 'function') renderRecordsMyMoney();
  closeModal();
}

// ── boot ──
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(_runLaunchAction, 400);
  setTimeout(_billDailyCheck, 2500);
  setTimeout(() => { if (typeof _updateNotifBadge === 'function') _updateNotifBadge(); }, 1800);
  setInterval(() => { if (STATE.user && !document.hidden && typeof _updateNotifBadge === 'function') _updateNotifBadge(); }, 30000);
});
