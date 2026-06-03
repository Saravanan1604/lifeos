// ===== FINANCE PAGE =====
let _finPeriod = 'month'; // 'day' | 'week' | 'month' | 'year' | 'all'
let _finAnchor = null;    // specific date 'YYYY-MM-DD' the tx list is anchored to (null = current period)
let _finType     = 'all';        // 'all' | 'income' | 'expense'
let _finCategory = 'all';        // 'all' | <category name>
let _finSort     = 'date-desc';  // 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'alpha-asc' | 'alpha-desc'
let _finSelected = new Set();    // Selected transaction IDs (for bulk delete)
let _recPeriod = 'month';        // Records page period: day|week|month|year|all (app only)
let _recAnchor = new Date();     // Records page anchor date (app only)
let _recSearch = '';             // Records page search text (app only)
let _recSelectMode = false;      // Records multi-select (long-press) mode
let _recSel = new Set();         // selected transaction ids
let _recSuppressTap = false;     // ignore the tap that follows a gesture

const CATEGORIES = [
  { name: 'Salary', icon: '💰' }, { name: 'Business', icon: '🏢' }, { name: 'Freelance', icon: '💻' },
  { name: 'Food', icon: '🍔' }, { name: 'Transport', icon: '🚗' }, { name: 'Shopping', icon: '🛍️' },
  { name: 'Health', icon: '🏥' }, { name: 'Bills', icon: '🧾' }, { name: 'EMI', icon: '🏦' },
  { name: 'Insurance', icon: '🛡️' }, { name: 'Investment', icon: '📈' }, { name: 'Entertainment', icon: '🎬' },
  { name: 'Education', icon: '📚' }, { name: 'Travel', icon: '✈️' }, { name: 'Gifts', icon: '🎁' },
  { name: 'Fuel', icon: '⛽' }, { name: 'Groceries', icon: '🛒' }, { name: 'Rent', icon: '🏠' },
  { name: 'Utilities', icon: '💡' }, { name: 'Warranties', icon: '🛡️' }, { name: 'Other', icon: '📦' }
];

// Consistent colour per category (used for circle icons + detail card)
const CAT_COLORS = {
  Salary:'#10b981', Business:'#0ea5e9', Freelance:'#22c55e', Food:'#f59e0b',
  Transport:'#3b82f6', Shopping:'#ec4899', Health:'#ef4444', Bills:'#8b5cf6',
  EMI:'#6366f1', Insurance:'#14b8a6', Investment:'#10b981', Entertainment:'#a855f7',
  Education:'#0ea5e9', Travel:'#06b6d4', Gifts:'#f43f5e', Fuel:'#f97316',
  Groceries:'#84cc16', Rent:'#eab308', Utilities:'#eab308', Warranties:'#f59e0b', Other:'#94a3b8'
};
function catIcon(name)  { return (CATEGORIES.find(c => c.name === name) || {}).icon || '📦'; }
function catColor(name) { return CAT_COLORS[name] || '#6366f1'; }

// Global HTML-escape helper (some functions defined their own local `esc`;
// this one is available everywhere).
if (typeof window.esc !== 'function') {
  window.esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Current local time HH:MM (used as the non-mandatory default)
function _nowTime() { const d = new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
// Format "15:07" → "3:07 PM"
function _fmtTime(t) {
  if (!t || !/^\d{1,2}:\d{2}/.test(t)) return '';
  let [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${h}:${String(m).padStart(2,'0')} ${ap}`;
}

// Distinct subcategories already used (for the datalist suggestions)
function _subcatSuggestions() {
  const set = new Set();
  (STATE.transactions || []).forEach(t => { if (t.subcategory) set.add(t.subcategory); });
  return [...set].sort().map(s => `<option value="${esc(s)}"></option>`).join('');
}

// Advance a date string by a recurring frequency
function _advanceDate(dateStr, freq) {
  const d = new Date(dateStr + 'T00:00:00');
  if (freq === 'daily')   d.setDate(d.getDate() + 1);
  if (freq === 'weekly')  d.setDate(d.getDate() + 7);
  if (freq === 'monthly') d.setMonth(d.getMonth() + 1);
  if (freq === 'yearly')  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

// On app open: auto-generate any due recurring transactions (catches up if missed)
function processRecurring() {
  STATE.recurring = STATE.recurring || [];
  if (!STATE.recurring.length) return;
  const todayStr = today();
  let created = 0;
  STATE.recurring.forEach(r => {
    let guard = 0;
    while (r.nextDate && r.nextDate <= todayStr && guard < 400) {
      const tx = {
        id: genId(), type: r.type, amount: r.amount, date: r.nextDate,
        category: r.category, icon: r.icon, description: r.description,
        source: r.source || '', subcategory: r.subcategory || '',
        recurringId: r.id, createdAt: new Date().toISOString()
      };
      STATE.transactions = STATE.transactions || [];
      STATE.transactions.unshift(tx);
      if (typeof _applyTxToAccount === 'function') _applyTxToAccount(tx);
      r.nextDate = _advanceDate(r.nextDate, r.frequency);
      created++; guard++;
    }
  });
  if (created) {
    saveState();
    if (typeof toast === 'function') toast(`🔁 ${created} recurring transaction${created > 1 ? 's' : ''} added`, 'info');
  }
}

// ===== MyMoney-style Records page (installed app only) =====
function recNav(delta) {
  const d = new Date(_recAnchor);
  if (_recPeriod === 'day')   d.setDate(d.getDate() + delta);
  if (_recPeriod === 'week')  d.setDate(d.getDate() + 7 * delta);
  if (_recPeriod === 'month') d.setMonth(d.getMonth() + delta);
  if (_recPeriod === 'year')  d.setFullYear(d.getFullYear() + delta);
  _recAnchor = d;
  renderRecordsMyMoney();
}
function recSetPeriod(p) { _recPeriod = p; renderRecordsMyMoney(); }

function _recPeriodLabel() {
  const a = _recAnchor;
  if (_recPeriod === 'all') return 'All Time';
  if (_recPeriod === 'year') return String(a.getFullYear());
  if (_recPeriod === 'month') return a.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  if (_recPeriod === 'day') return a.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  // week → Mon–Sun range containing the anchor
  const dow = (a.getDay() + 6) % 7;
  const mon = new Date(a); mon.setDate(a.getDate() - dow);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const o = { day: '2-digit', month: 'short' };
  return `${mon.toLocaleDateString('en-IN', o)} – ${sun.toLocaleDateString('en-IN', o)}`;
}

// Last calendar day (YYYY-MM-DD) of the currently displayed period
function _recPeriodEndYmd() {
  const a = _recAnchor;
  if (_recPeriod === 'day')   return _ymdLocal(a);
  if (_recPeriod === 'week')  { const dow = (a.getDay() + 6) % 7; const sun = new Date(a); sun.setDate(a.getDate() - dow + 6); return _ymdLocal(sun); }
  if (_recPeriod === 'month') return _ymdLocal(new Date(a.getFullYear(), a.getMonth() + 1, 0));
  if (_recPeriod === 'year')  return `${a.getFullYear()}-12-31`;
  return _ymdLocal(new Date());
}

// Records page control toggles + calendar jump
function recToggleTotal() {
  STATE.settings = STATE.settings || {};
  STATE.settings.showTotal = STATE.settings.showTotal === false ? true : false;
  saveState(); renderRecordsMyMoney();
}
function recToggleCarry() {
  STATE.settings = STATE.settings || {};
  STATE.settings.carryForward = !STATE.settings.carryForward;
  saveState(); renderRecordsMyMoney();
}
function recCarrySettings() {
  STATE.settings = STATE.settings || {};
  const on = STATE.settings.carryForward === true;
  const from = STATE.settings.carryFrom || '';
  openModal('↪ Carry Forward Balance', `
    <label style="display:flex;align-items:center;gap:12px;font-size:1.3rem;font-weight:700;margin-bottom:16px;cursor:pointer">
      <input type="checkbox" id="cf-on" ${on ? 'checked' : ''} style="width:24px;height:24px;accent-color:#00c9a7"/>
      Carry the running balance forward
    </label>
    <p style="font-size:1.05rem;color:var(--text2);margin:-6px 0 16px">When on, TOTAL becomes a running BALANCE that carries across periods.</p>
    <div class="form-group"><label class="form-label">Start counting from</label>
      <input type="date" id="cf-from" class="form-input" value="${from}"/>
      <p style="font-size:1rem;color:var(--text2);margin-top:6px">Leave blank to include all transactions.</p>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px">
      <button class="btn-secondary btn-sm" onclick="_cfQuick('week')">This week</button>
      <button class="btn-secondary btn-sm" onclick="_cfQuick('month')">This month</button>
      <button class="btn-secondary btn-sm" onclick="_cfQuick('year')">This year</button>
      <button class="btn-secondary btn-sm" onclick="_cfQuick('all')">All time</button>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="recCarrySave()">Save</button>
    </div>`);
}
function _cfQuick(kind) {
  const el = document.getElementById('cf-from'); if (!el) return;
  const n = new Date();
  if (kind === 'all') { el.value = ''; return; }
  let d;
  if (kind === 'week')  { const dow = (n.getDay() + 6) % 7; d = new Date(n); d.setDate(n.getDate() - dow); }
  if (kind === 'month') d = new Date(n.getFullYear(), n.getMonth(), 1);
  if (kind === 'year')  d = new Date(n.getFullYear(), 0, 1);
  el.value = _ymdLocal(d);
  const on = document.getElementById('cf-on'); if (on) on.checked = true;
}
function recCarrySave() {
  STATE.settings = STATE.settings || {};
  STATE.settings.carryForward = !!document.getElementById('cf-on')?.checked;
  STATE.settings.carryFrom = document.getElementById('cf-from')?.value || '';
  saveState(); closeModal(); renderRecordsMyMoney();
}
function recPickDay(v) {
  if (!v) return;
  _recAnchor = new Date(v + 'T00:00:00');
  _recPeriod = 'day';
  renderRecordsMyMoney();
}

function renderRecordsMyMoney() {
  const anchorYmd = _ymdLocal(_recAnchor);
  const periodTxns = filterTxByAnchor([...(STATE.transactions || [])], _recPeriod, anchorYmd);
  const periodLabelTxt = _recPeriodLabel();

  // summary reflects the whole period (independent of active filters)
  const expense = periodTxns.filter(t => t.type !== 'income').reduce((s, t) => s + (+t.amount || 0), 0);
  let income    = periodTxns.filter(t => t.type === 'income').reduce((s, t) => s + (+t.amount || 0), 0);
  // Carry income forward for the FULL month when viewing a day or week
  // (e.g. salary credited on the 1st still counts when you look at any day).
  let incomeCarried = false;
  if (_recPeriod === 'day' || _recPeriod === 'week') {
    const ym = `${_recAnchor.getFullYear()}-${String(_recAnchor.getMonth() + 1).padStart(2, '0')}`;
    income = (STATE.transactions || [])
      .filter(t => t.type === 'income' && (t.date || '').startsWith(ym))
      .reduce((s, t) => s + (+t.amount || 0), 0);
    incomeCarried = true;
  }
  let total = income - expense;

  // Carry forward to next month: TOTAL becomes the running balance — the net of
  // ALL transactions up to the end of the displayed period (so each month opens
  // with the previous month's closing balance).
  const carryForward = STATE.settings && STATE.settings.carryForward === true;
  if (carryForward && _recPeriod !== 'all') {
    const periodEnd = _recPeriodEndYmd();
    const from = (STATE.settings && STATE.settings.carryFrom) || '';   // optional start date
    total = (STATE.transactions || [])
      .filter(t => { const d = (t.date || '').slice(0, 10); return d <= periodEnd && (!from || d >= from); })
      .reduce((s, t) => s + (t.type === 'income' ? (+t.amount || 0) : -(+t.amount || 0)), 0);
  }

  // apply our existing filters (type / category / search)
  const q = _recSearch.trim().toLowerCase();
  let all = periodTxns;
  if (_finType !== 'all')     all = all.filter(t => t.type === _finType);
  if (_finCategory !== 'all') all = all.filter(t => t.category === _finCategory);
  if (q) all = all.filter(t =>
    (t.description || '').toLowerCase().includes(q) ||
    (t.category || '').toLowerCase().includes(q) ||
    (t.subcategory || '').toLowerCase().includes(q));

  const filterActive = _finType !== 'all' || _finCategory !== 'all' || _finSort !== 'date-desc' || !!q;
  const amtSort = _finSort === 'amount-desc' || _finSort === 'amount-asc';
  const tkey = t => `${t.date || ''}T${t.time || '00:00'}`;
  const within = (a, b) => {
    if (_finSort === 'amount-desc') return (+b.amount) - (+a.amount);
    if (_finSort === 'amount-asc')  return (+a.amount) - (+b.amount);
    if (_finSort === 'date-asc')    return tkey(a).localeCompare(tkey(b)) || (new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    return tkey(b).localeCompare(tkey(a)) || (new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  };

  // group by day
  const byDay = {};
  all.forEach(t => { (byDay[(t.date || '').slice(0, 10)] = byDay[(t.date || '').slice(0, 10)] || []).push(t); });
  const days = Object.keys(byDay).sort((a, b) => _finSort === 'date-asc' ? a.localeCompare(b) : b.localeCompare(a));

  const dayHeader = (d) => {
    const dt = new Date(d + 'T00:00:00');
    return `${dt.toLocaleDateString('en-IN', { month: 'short' })} ${String(dt.getDate()).padStart(2, '0')}, ${dt.toLocaleDateString('en-IN', { weekday: 'long' })}`;
  };

  const rows = days.map(d => {
    const dayExp = byDay[d].filter(t => t.type !== 'income').reduce((s, t) => s + (+t.amount || 0), 0);
    return `
    <div class="mm-day"><span>${dayHeader(d)}</span><span class="mm-day-total">-${fmt(dayExp)}</span></div>
    ${byDay[d].sort(within).map(t => {
      const inc = t.type === 'income';
      const src = t.source ? _sourceLabel(t.source) : '';
      const isCard = /card|credit/i.test(t.source || '');
      const chip = src ? `<span class="mm-chip">${isCard ? '💳' : '💵'} ${esc(src)}</span>` : '';
      const note = t.description ? `<span class="mm-note">“${esc(t.description)}”</span>` : '';
      const sub = t.subcategory ? `<span class="mm-note">› ${esc(t.subcategory)}</span>` : '';
      const tm = t.time ? `<span class="mm-note">🕒 ${_fmtTime(t.time)}</span>` : '';
      const seld = _recSel.has(t.id);
      return `
      <div class="mm-row ${seld ? 'sel' : ''}" data-id="${t.id}" onclick="recRowTap('${t.id}')">
        ${_recSelectMode ? `<span class="mm-check ${seld ? 'on' : ''}">${seld ? '✓' : ''}</span>` : ''}
        <div class="mm-ic" style="background:${catColor(t.category)}">${t.icon || catIcon(t.category)}</div>
        <div class="mm-mid">
          <p class="mm-cat">${esc(t.category || '—')}${t.recurringId ? ' 🔁' : ''}</p>
          <div class="mm-meta">${chip}${note}${sub}${tm}</div>
        </div>
        <div class="mm-amt ${inc ? 'pos' : 'neg'}">${inc ? '' : '-'}${fmt(t.amount)}</div>
      </div>`;
    }).join('')}
  `;
  }).join('');

  const showTotal = !(STATE.settings && STATE.settings.showTotal === false);
  const tabs = ['day', 'week', 'month', 'year', 'all'];
  const tabLabels = { day: 'Day', week: 'Week', month: 'Month', year: 'Year', all: 'All' };
  const periodTabs = tabs.map(p =>
    `<button class="mm-ptab ${_recPeriod === p ? 'active' : ''}" onclick="recSetPeriod('${p}')">${tabLabels[p]}</button>`).join('');

  const selBar = _recSelectMode ? `
      <div class="mm-selbar">
        <button class="mm-selx" onclick="recCancelSelect()">✕</button>
        <span class="mm-selcount">${_recSel.size} selected</span>
        <button class="mm-selact" onclick="recBulkCategory()">🏷️ Category</button>
        <button class="mm-selact del" onclick="recBulkDelete()">🗑️ Delete</button>
      </div>` : '';

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in mymoney-records ${_recSelectMode ? 'selmode' : ''}">
      <div class="mm-ptabs">${periodTabs}</div>
      <div class="mm-monthbar">
        ${_recPeriod === 'all' ? '<span class="mm-navbtn" style="visibility:hidden">‹</span>' : `<button class="mm-navbtn" onclick="recNav(-1)">‹</button>`}
        <span class="mm-month">${periodLabelTxt}</span>
        ${_recPeriod === 'all' ? '<span class="mm-navbtn" style="visibility:hidden">›</span>' : `<button class="mm-navbtn" onclick="recNav(1)">›</button>`}
      </div>
      ${showTotal ? `<div class="mm-summary">
        <div><span class="mm-s-lbl">EXPENSE</span><span class="mm-s-val neg">${fmt(expense)}</span></div>
        <div><span class="mm-s-lbl">INCOME${incomeCarried ? ' <span style="opacity:.7;font-weight:600">(month)</span>' : ''}</span><span class="mm-s-val pos">${fmt(income)}</span></div>
        <div><span class="mm-s-lbl">${carryForward ? 'BALANCE' : 'TOTAL'}</span><span class="mm-s-val ${total < 0 ? 'neg' : 'pos'}">${total < 0 ? '-' : ''}${fmt(total)}</span></div>
      </div>` : ''}
      <div class="mm-ctrls">
        <label class="mm-cbtn" title="Pick a day">📅 Day
          <input type="date" value="${anchorYmd}" onchange="recPickDay(this.value)"/>
        </label>
        <button class="mm-cbtn ${showTotal ? 'on' : ''}" onclick="recToggleTotal()">Σ Total</button>
        <button class="mm-cbtn ${carryForward ? 'on' : ''}" onclick="recCarrySettings()">↪ Carry fwd</button>
      </div>
      <button class="mm-filterbar ${filterActive ? 'on' : ''}" onclick="openRecordsFilter()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="17" x2="14" y2="17"/></svg>
        <span>${filterActive ? 'Filters active — tap to edit' : 'Filter & Sort'}</span>
      </button>
      ${selBar}
      <div class="mm-list">
        ${days.length ? rows : `<div class="mm-empty">${filterActive ? 'No transactions match your filters.' : `No transactions in ${periodLabelTxt}.<br/>Tap ➕ to add one.`}</div>`}
      </div>
    </div>`;
  if (typeof initRecordsGestures === 'function') initRecordsGestures();
}

// ===== Records row gestures: long-press select, swipe-right delete, swipe-left edit =====
function recRowTap(id) {
  if (_recSuppressTap) return;            // ignore the click that follows a long-press
  if (_recSelectMode) { recToggleSel(id); return; }
  openEditTxModal(id);                    // tap → edit
}
function recToggleSel(id) {
  if (_recSel.has(id)) _recSel.delete(id); else _recSel.add(id);
  if (_recSel.size === 0) _recSelectMode = false;
  renderRecordsMyMoney();
}
function recEnterSelect(id) {
  _recSelectMode = true; _recSel = new Set([id]);
  if (navigator.vibrate) try { navigator.vibrate(25); } catch (e) {}
  renderRecordsMyMoney();
}
function recCancelSelect() { _recSelectMode = false; _recSel = new Set(); renderRecordsMyMoney(); }

function recBulkDelete() {
  const n = _recSel.size; if (!n) return;
  openModal('🗑️ Delete Transactions', `
    <p style="font-size:1.3rem;text-align:center;margin:6px 0 20px">Delete ${n} selected transaction${n > 1 ? 's' : ''}?</p>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" style="background:#ef4444" onclick="recBulkDeleteConfirm()">Delete</button>
    </div>`);
}
function recBulkDeleteConfirm() {
  const ids = [..._recSel];
  ids.forEach(id => { const tx = (STATE.transactions || []).find(t => t.id === id); if (tx && typeof _reverseTxFromAccount === 'function') _reverseTxFromAccount(tx); });
  STATE.transactions = (STATE.transactions || []).filter(t => !ids.includes(t.id));
  saveState();
  if (typeof autoSyncGoals === 'function') autoSyncGoals();
  _recSelectMode = false; _recSel = new Set();
  closeModal(); toast(`${ids.length} deleted`, 'info'); renderRecordsMyMoney();
}
function recBulkCategory() {
  if (!_recSel.size) return;
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const opts = allCats.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('');
  openModal('🏷️ Change Category', `
    <div class="form-group"><label class="form-label">New Category (${_recSel.size} selected)</label>
      <select id="recbulk-cat" class="form-input">${opts}</select></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="recBulkCategoryConfirm()">Apply</button>
    </div>`);
}
function recBulkCategoryConfirm() {
  const cat = document.getElementById('recbulk-cat')?.value; if (!cat) return;
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const icon = allCats.find(c => c.name === cat)?.icon || '💳';
  const ids = [..._recSel];
  (STATE.transactions || []).forEach(t => { if (ids.includes(t.id)) { t.category = cat; t.icon = icon; } });
  saveState();
  _recSelectMode = false; _recSel = new Set();
  closeModal(); toast('Category updated', 'success'); renderRecordsMyMoney();
}

function initRecordsGestures() {
  const list = document.querySelector('.mymoney-records .mm-list');
  if (!list) return;
  // Tap → edit (handled by onclick). Long-press (hold) → bulk multi-select.
  // No swipe gestures — plain swipes are left for page navigation / scrolling.
  let startX = 0, startY = 0, id = null, moved = false, lpTimer = null;

  list.addEventListener('touchstart', e => {
    const r = e.target.closest('.mm-row'); if (!r) return;
    id = r.dataset.id; const t = e.touches[0];
    startX = t.clientX; startY = t.clientY; moved = false;
    clearTimeout(lpTimer);
    lpTimer = setTimeout(() => {
      if (!moved) {
        _recSuppressTap = true; setTimeout(() => _recSuppressTap = false, 450);
        if (navigator.vibrate) try { navigator.vibrate(25); } catch (_) {}
        if (_recSelectMode) recToggleSel(id); else recEnterSelect(id);
      }
    }, 400);
  }, { passive: true });

  list.addEventListener('touchmove', e => {
    const t = e.touches[0];
    if (Math.abs(t.clientX - startX) > 8 || Math.abs(t.clientY - startY) > 8) { moved = true; clearTimeout(lpTimer); }
  }, { passive: true });

  list.addEventListener('touchend', () => { clearTimeout(lpTimer); });
  list.addEventListener('touchcancel', () => { clearTimeout(lpTimer); });
}

// Records filter modal — reuses the existing _finType / _finCategory / _finSort + search
function openRecordsFilter() {
  const cats = [...new Set((STATE.transactions || []).map(t => t.category).filter(Boolean))].sort();
  const catOpts = `<option value="all">All categories</option>` +
    cats.map(c => `<option value="${esc(c)}" ${_finCategory === c ? 'selected' : ''}>${catIcon(c)} ${esc(c)}</option>`).join('');
  const sel = (v, cur) => v === cur ? 'selected' : '';
  openModal('🔍 Filter Records', `
    <div class="form-group"><label class="form-label">Search</label>
      <input type="text" id="rf-search" class="form-input" value="${esc(_recSearch)}" placeholder="Name, category or note"/></div>
    <div class="form-group"><label class="form-label">Type</label>
      <select id="rf-type" class="form-input">
        <option value="all" ${sel('all', _finType)}>All types</option>
        <option value="income" ${sel('income', _finType)}>💚 Income only</option>
        <option value="expense" ${sel('expense', _finType)}>❤️ Expense only</option>
      </select></div>
    <div class="form-group"><label class="form-label">Category</label>
      <select id="rf-cat" class="form-input">${catOpts}</select></div>
    <div class="form-group"><label class="form-label">Sort by</label>
      <select id="rf-sort" class="form-input">
        <option value="date-desc" ${sel('date-desc', _finSort)}>📅 Newest first</option>
        <option value="date-asc" ${sel('date-asc', _finSort)}>📅 Oldest first</option>
        <option value="amount-desc" ${sel('amount-desc', _finSort)}>💰 Highest amount</option>
        <option value="amount-asc" ${sel('amount-asc', _finSort)}>💰 Lowest amount</option>
      </select></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="clearRecordsFilter()">Clear all</button>
      <button class="btn-primary" onclick="applyRecordsFilter()">Apply</button>
    </div>`);
}

function applyRecordsFilter() {
  _recSearch   = document.getElementById('rf-search')?.value || '';
  _finType     = document.getElementById('rf-type')?.value || 'all';
  _finCategory = document.getElementById('rf-cat')?.value || 'all';
  _finSort     = document.getElementById('rf-sort')?.value || 'date-desc';
  closeModal();
  renderRecordsMyMoney();
}

function clearRecordsFilter() {
  _recSearch = ''; _finType = 'all'; _finCategory = 'all'; _finSort = 'date-desc';
  closeModal();
  renderRecordsMyMoney();
}

// MyMoney-style colour-coded transaction detail card
function openTxDetail(id) {
  const tx = (STATE.transactions || []).find(t => t.id === id);
  if (!tx) return;
  const isInc = tx.type === 'income';
  // lighter red / green for better text visibility
  const col   = isInc ? 'linear-gradient(135deg,#34d399,#10b981)' : 'linear-gradient(135deg,#fb7185,#f43f5e)';
  const acct  = tx.source ? _sourceLabel(tx.source) : '—';
  const esc   = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const note  = (tx.note || tx.notes || '').trim() || 'No notes';
  openModal('', `
    <div class="txd">
      <div class="txd-head" style="background:${col}">
        <button class="txd-x" onclick="closeModal()">✕</button>
        <div class="txd-actions">
          <button onclick="txdEdit('${id}')" title="Edit">✏️</button>
          <button onclick="txdDelete('${id}')" title="Delete">🗑️</button>
        </div>
        <p class="txd-type">${isInc ? 'INCOME' : 'EXPENSE'}</p>
        <p class="txd-amt">${isInc ? '+' : '-'}${fmt(tx.amount)}</p>
        <p class="txd-date">${fmtDate(tx.date)}${tx.time ? ' · ' + _fmtTime(tx.time) : ''}</p>
      </div>
      <div class="txd-body">
        <div class="txd-row"><span>Account</span><b>${esc(acct)}</b></div>
        <div class="txd-row"><span>Category</span><b><span class="txd-cat-ic" style="background:${catColor(tx.category)}">${catIcon(tx.category)}</span>${esc(tx.category || '—')}</b></div>
        ${tx.subcategory ? `<div class="txd-row"><span>Subcategory</span><b>${esc(tx.subcategory)}</b></div>` : ''}
        <div class="txd-row"><span>Name</span><b>${esc(tx.description || '—')}</b></div>
        <div class="txd-row" style="border:none"><span>Notes</span><b style="font-weight:500;opacity:.85">${esc(note)}</b></div>
      </div>
    </div>`);
  // the detail card has its own close/header — hide the generic modal header bar
  const _hd = document.querySelector('#modal-overlay .modal-header');
  if (_hd) _hd.style.display = 'none';
}

// Detail-card edit / delete (custom confirm — browser confirm() is unreliable in the TWA)
function txdEdit(id) { closeModal(); openEditTxModal(id); }
function txdDelete(id) {
  openModal('🗑️ Delete Transaction', `
    <p style="font-size:1.3rem;text-align:center;margin:6px 0 20px">Delete this transaction permanently?</p>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" style="background:#ef4444" onclick="_txdDoDelete('${id}')">Delete</button>
    </div>`);
}
function _txdDoDelete(id) { deleteTx(id); closeModal(); }

function renderFinance() {
  if (typeof reconcileCurrentBalances === 'function') reconcileCurrentBalances();
  const txnsAll = [...(STATE.transactions || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const txns    = filterTxByPeriod(txnsAll, _finPeriod);
  const income  = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = income - expense;
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;
  const savingsOk = savings >= 0;
  const userName = (STATE.user?.name || STATE.user?.email || 'Your').split(' ')[0];

  // Real-time net worth from actual account balances
  const _bankTotal = (STATE.bankAccounts  || []).reduce((s, b) => s + (b.balance     || 0), 0);
  const _cashTotal = (STATE.cashAccounts  || []).reduce((s, c) => s + (c.balance     || 0), 0);
  const _cardTotal = (STATE.creditCards   || []).reduce((s, c) => s + (c.outstanding || 0), 0);
  const _hasAccounts = (STATE.bankAccounts||[]).length + (STATE.cashAccounts||[]).length + (STATE.creditCards||[]).length > 0;
  const _netWorth  = _hasAccounts ? _bankTotal + _cashTotal - _cardTotal : savings;

  // Build category spending map for "Spending by Category"
  const catMap = {};
  txns.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });
  const topCats = Object.entries(catMap).sort(([,a],[,b]) => b - a).slice(0, 6);

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in" style="max-width:900px;margin:0 auto">

      <!-- Header -->
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px">
        <div>
          <h1 class="page-title">💰 Finance</h1>
          <p class="page-subtitle">${new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            ${window.__IS_APP ? '' : periodTabsHtml(_finPeriod, 'setFinPeriod')}
            ${window.__IS_APP ? '' : `<button class="btn-primary btn-sm" onclick="openAddTxModal()">+ Add Transaction</button>`}
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn-secondary btn-sm" onclick="openCsvImport()" style="display:flex;align-items:center;gap:6px">📊 Import CSV</button>
          <button class="btn-secondary btn-sm" onclick="openBulkEntry()" style="display:flex;align-items:center;gap:6px">📅 Bulk Entry</button>
          <button class="btn-secondary btn-sm" onclick="openSmsParser()" style="display:flex;align-items:center;gap:6px">📲 Scan SMS</button>
          <button class="btn-secondary btn-sm" onclick="openPdfImport()" style="display:flex;align-items:center;gap:6px">📑 Import PDF</button>
          </div>
        </div>
      </div>

      <!-- Kaasu-style Hero Balance Card -->
      <div style="position:relative;overflow:hidden;border-radius:24px;background:linear-gradient(135deg,#00c9a7,#0acf83,#00b09b);padding:28px;margin-bottom:20px;box-shadow:0 20px 60px rgba(0,201,167,0.35)">
        <div style="position:absolute;top:-60px;right:-60px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,0.15)"></div>
        <div style="position:absolute;bottom:-40px;left:-40px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,0.08)"></div>
        <div style="position:relative">
          <p style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(0,60,50,0.75);margin-bottom:6px">💰 Net Worth ${_hasAccounts ? '<span style="font-size:9px;opacity:0.6;font-weight:600">(Bank + Cash − Cards)</span>' : ''}</p>
          <p id="fin-balance" style="font-size:48px;font-weight:900;color:#001a14;letter-spacing:-2px;line-height:1">${fmt(_netWorth)}</p>
          <div style="display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap">
            <span id="fin-rate" style="font-size:12px;font-weight:700;padding:5px 12px;border-radius:20px;background:rgba(255,255,255,0.4);color:${savingsOk?'#004d3a':'#7f0000'}">
              ${savingsOk?'📈':'📉'} ${savingsRate}% savings rate
            </span>
            ${_hasAccounts ? `<span style="font-size:11px;font-weight:600;color:rgba(0,50,40,0.7)">🏦 ${fmt(_bankTotal)} &nbsp;💵 ${fmt(_cashTotal)} &nbsp;💳 -${fmt(_cardTotal)}</span>` : ''}
            <span style="font-size:12px;font-weight:600;color:rgba(0,50,40,0.8)">✨ ${userName}'s wallet</span>
          </div>
          ${(()=>{
            const chips = typeof buildPeriodComparisonChips === 'function' ? buildPeriodComparisonChips(_finPeriod) : {incomeChip:'',expenseChip:''};
            return `<div style="display:flex;gap:32px;margin-top:20px;flex-wrap:wrap" class="fin-hero-stats">
            <div>
              <p style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,60,50,0.7);margin-bottom:4px">💚 Income</p>
              <p id="fin-income" style="font-size:22px;font-weight:900;color:#003326">+${fmt(income)}${chips.incomeChip}</p>
            </div>
            <div>
              <p style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,60,50,0.7);margin-bottom:4px">❤️ Expenses</p>
              <p id="fin-expense" style="font-size:22px;font-weight:900;color:#7f0000">-${fmt(expense)}${chips.expenseChip}</p>
            </div>
            <div>
              <p style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,60,50,0.7);margin-bottom:4px">💜 Savings</p>
              <p id="fin-savings" style="font-size:22px;font-weight:900;color:${savingsOk?'#001a14':'#7f0000'}">${savingsOk?'+':''}${fmt(savings)}</p>
            </div>
          </div>`;
          })()}
        </div>
      </div>

      <!-- Bank Accounts -->
      <div class="glass-card" style="padding:20px;margin-bottom:20px">
        <div class="section-header" style="margin-bottom:16px">
          <p class="section-title">🏦 Bank Accounts
            <span style="font-size:11px;font-weight:500;color:var(--text3);margin-left:8px">${(STATE.bankAccounts||[]).length} accounts</span>
          </p>
          <button class="btn-primary btn-sm" onclick="addBankAccount()">+ Add Bank</button>
        </div>
        ${(STATE.bankAccounts||[]).length === 0
          ? `<div class="empty-state" style="padding:28px 0"><span class="empty-state-icon">🏦</span><p>No bank accounts yet. Add your first one!</p></div>`
          : `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-bottom:16px" class="fin-bank-grid">
            ${(STATE.bankAccounts||[]).map((b,i) => `
            <div class="fin-dark-card" onclick="if(!event.target.closest('button'))navigate('bank-tracker')" style="--c1:${b.color||'#1e293b'};--c2:${b.color2||'#0f172a'};padding:16px;border-radius:14px;background:linear-gradient(135deg,${b.color||'#1e293b'},${b.color2||'#0f172a'});position:relative;overflow:hidden;cursor:pointer">
              <div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.08)"></div>
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div style="font-size:22px">${b.icon||'🏦'}</div>
                <div style="display:flex;gap:6px">
                  <button onclick="updateBankBalance(${i})" style="background:rgba(0,201,167,0.25);border:none;color:#00ffd5;font-size:11px;padding:3px 8px;border-radius:6px;cursor:pointer">↑ Bal</button>
                  <button onclick="editBankAccount(${i})" style="background:rgba(255,255,255,0.15);border:none;color:#fff;font-size:11px;padding:3px 8px;border-radius:6px;cursor:pointer">Edit</button>
                  <button onclick="deleteBankAccount(${i})" style="background:rgba(239,68,68,0.25);border:none;color:#fca5a5;font-size:11px;padding:3px 8px;border-radius:6px;cursor:pointer">✕</button>
                </div>
              </div>
              <p style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.55);margin:10px 0 4px">${b.bankName}</p>
              <p style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px">${fmt(b.balance)}</p>
              <div style="display:flex;justify-content:space-between;margin-top:8px">
                <span style="font-size:11px;color:rgba(255,255,255,0.5)">${b.type||'Savings'}</span>
                ${b.lastFour ? `<span style="font-size:11px;color:rgba(255,255,255,0.5)">•••• ${b.lastFour}</span>` : ''}
              </div>
            </div>`).join('')}
          </div>
          <div style="padding:12px 16px;border-radius:12px;background:rgba(0,201,167,0.1);border:1px solid rgba(0,201,167,0.2);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:13px;font-weight:600;color:var(--teal)">💰 Total Bank Balance</span>
            <span style="font-size:20px;font-weight:900;color:var(--teal)">${fmt((STATE.bankAccounts||[]).reduce((s,b)=>s+b.balance,0))}</span>
          </div>`}
      </div>

      <!-- Credit Cards -->
      <div class="glass-card" style="padding:20px;margin-bottom:20px">
        <div class="section-header" style="margin-bottom:16px">
          <p class="section-title">💳 Credit Cards
            <span style="font-size:11px;font-weight:500;color:var(--text3);margin-left:8px">${(STATE.creditCards||[]).length} cards</span>
          </p>
          <button class="btn-primary btn-sm" onclick="addCreditCard()">+ Add Card</button>
        </div>
        ${(STATE.creditCards||[]).length === 0
          ? `<div class="empty-state" style="padding:28px 0"><span class="empty-state-icon">💳</span><p>No credit cards yet. Add your first one!</p></div>`
          : `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin-bottom:16px" class="fin-card-grid">
            ${(STATE.creditCards||[]).map((c,i) => {
              const used = c.outstanding || 0;
              const limit = c.limit || 1;
              const pct = Math.min(100, Math.round((used/limit)*100));
              const utilColor = pct>80?'#ef4444':pct>50?'#f59e0b':'#10b981';
              return `
            <div class="fin-dark-card" onclick="if(!event.target.closest('button'))navigate('bank-tracker')" style="--c1:${c.color||'#1e293b'};--c2:${c.color2||'#0f172a'};padding:18px;border-radius:16px;background:linear-gradient(135deg,${c.color||'#1e293b'},${c.color2||'#0f172a'});position:relative;overflow:hidden;cursor:pointer">
              <div style="position:absolute;top:-25px;right:-25px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.07);pointer-events:none"></div>
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div>
                  <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5)">${c.network||'VISA'}</div>
                  <div style="font-size:14px;font-weight:800;color:#fff;margin-top:2px">${c.bankName}</div>
                </div>
                <div style="display:flex;gap:6px">
                  <button onclick="openUpdateCCModal('${c.id}')" style="background:rgba(0,201,167,0.25);border:none;color:#00ffd5;font-size:11px;padding:3px 8px;border-radius:6px;cursor:pointer">↑ Pay</button>
                  <button onclick="editCreditCard(${i})" style="background:rgba(255,255,255,0.15);border:none;color:#fff;font-size:11px;padding:3px 8px;border-radius:6px;cursor:pointer">Edit</button>
                  <button onclick="deleteCreditCard(${i})" style="background:rgba(239,68,68,0.25);border:none;color:#fca5a5;font-size:11px;padding:3px 8px;border-radius:6px;cursor:pointer">✕</button>
                </div>
              </div>
              ${c.lastFour?`<div style="font-size:13px;letter-spacing:3px;color:rgba(255,255,255,0.45);margin:10px 0 4px">•••• •••• •••• ${c.lastFour}</div>`:''}
              <div style="margin-top:10px">
                <div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.55);margin-bottom:5px">
                  <span>Outstanding</span><span>Limit</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:900;color:#fff;margin-bottom:8px">
                  <span style="color:${pct>80?'#fca5a5':'#fff'}">${fmt(used)}</span>
                  <span style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.6)">${fmt(limit)}</span>
                </div>
                <div style="height:5px;border-radius:4px;background:rgba(255,255,255,0.15)">
                  <div style="height:5px;border-radius:4px;width:${pct}%;background:${utilColor};transition:.3s"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:5px">
                  <span style="font-size:10px;color:rgba(255,255,255,0.45)">${pct}% utilised</span>
                  ${c.dueDate?`<span style="font-size:10px;color:rgba(255,255,255,0.45)">Due: ${c.dueDate}</span>`:''}
                </div>
              </div>
            </div>`}).join('')}
          </div>
          <div style="padding:12px 16px;border-radius:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:13px;font-weight:600;color:#ef4444">💳 Total Outstanding</span>
            <span style="font-size:20px;font-weight:900;color:#ef4444">${fmt((STATE.creditCards||[]).reduce((s,c)=>s+(c.outstanding||0),0))}</span>
          </div>`}
      </div>

      <!-- Cash Accounts -->
      <div class="glass-card" style="padding:20px;margin-bottom:20px">
        <div class="section-header" style="margin-bottom:16px">
          <p class="section-title">💵 Cash Accounts
            <span style="font-size:11px;font-weight:500;color:var(--text3);margin-left:8px">${(STATE.cashAccounts||[]).length} wallets</span>
          </p>
          <button class="btn-primary btn-sm" onclick="addCashAccount()">+ Add Cash</button>
        </div>
        ${(STATE.cashAccounts||[]).length === 0
          ? `<div class="empty-state" style="padding:28px 0"><span class="empty-state-icon">💵</span><p>No cash wallets yet. Track your physical cash!</p></div>`
          : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:16px" class="fin-cash-grid">
            ${(STATE.cashAccounts||[]).map((ca,i) => `
            <div class="fin-dark-card" onclick="if(!event.target.closest('button'))navigate('bank-tracker')" style="--c1:#a16207;--c2:#78350f;position:relative;overflow:hidden;border-radius:16px;background:linear-gradient(135deg,#78350f,#92400e);padding:16px;box-shadow:0 8px 24px rgba(120,53,15,0.3);cursor:pointer">
              <div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.08)"></div>
              <div style="display:flex;justify-content:space-between;align-items:start;position:relative">
                <div style="font-size:22px">💵</div>
                <div style="display:flex;gap:4px">
                  <button onclick="updateCashBalance(${i})" style="background:rgba(251,191,36,0.3);border:none;color:#fbbf24;font-size:11px;padding:3px 8px;border-radius:6px;cursor:pointer">↑ Bal</button>
                  <button onclick="editCashAccount(${i})" style="background:rgba(255,255,255,0.15);border:none;color:#fff;font-size:11px;padding:3px 8px;border-radius:6px;cursor:pointer">Edit</button>
                  <button onclick="deleteCashAccount(${i})" style="background:rgba(239,68,68,0.25);border:none;color:#fca5a5;font-size:11px;padding:3px 8px;border-radius:6px;cursor:pointer">✕</button>
                </div>
              </div>
              <p style="font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.55);margin:10px 0 4px">${ca.name}</p>
              <p style="font-size:24px;font-weight:900;color:#fff">${fmt(ca.balance||0)}</p>
            </div>`).join('')}
          </div>
          <div style="padding:12px 16px;border-radius:12px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:13px;font-weight:600;color:#f59e0b">💵 Total Cash</span>
            <span style="font-size:20px;font-weight:900;color:#f59e0b">${fmt((STATE.cashAccounts||[]).reduce((s,ca)=>s+(ca.balance||0),0))}</span>
          </div>`}
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px" class="fin-stat-row">
        ${[
          { id:'fin-stat-count', label:'Total Txns',   value: txnsAll.length,  icon:'⚡', color:'rgba(99,102,241,0.15)', tc:'#6366f1' },
          { id:'fin-stat-month', label:periodLabel(_finPeriod), value: txns.length, icon:'🎯', color:'rgba(16,185,129,0.15)', tc:'#10b981' },
          { id:'fin-stat-rate',  label:'Savings Rate', value: savingsRate+'%', icon:'📈', color:'rgba(139,92,246,0.15)', tc:'#8b5cf6' },
        ].map(s=>`
          <div class="glass-card" style="padding:16px;text-align:center">
            <div style="display:inline-flex;padding:8px;border-radius:10px;background:${s.color};font-size:18px;margin-bottom:8px">${s.icon}</div>
            <p id="${s.id}" style="font-size:20px;font-weight:800;color:${s.tc}">${s.value}</p>
            <p style="font-size:11px;color:var(--text3);margin-top:2px">${s.label}</p>
          </div>`).join('')}
      </div>

      <!-- Charts Row -->
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:20px" class="fin-charts-row">
        <div class="glass-card" style="padding:20px">
          <p class="section-title" style="margin-bottom:16px">📈 Income vs Expenses</p>
          <div class="chart-container"><canvas id="finance-chart"></canvas></div>
        </div>
        <div class="glass-card" style="padding:20px">
          <p class="section-title" style="margin-bottom:16px">🥧 Spending by Category</p>
          ${topCats.length === 0
            ? `<div style="display:flex;align-items:center;justify-content:center;height:180px;color:var(--text3);font-size:13px">No expense data yet.</div>`
            : `<div class="chart-container"><canvas id="finance-pie-chart"></canvas></div>`}
        </div>
      </div>

      <!-- Transactions with period filter -->
      <div class="glass-card" id="fin-tx-section" style="overflow:hidden;margin-bottom:20px">
        <div style="padding:12px 16px;border-bottom:1px solid var(--glass-border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <p class="section-title" style="margin:0">💳 Transactions</p>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${periodTabsHtml(_finPeriod, 'setFinPeriod')}
            <span id="fin-tx-count" style="font-size:11px;color:var(--text3)"></span>
          </div>
        </div>

        <!-- Specific period picker + Add Transaction -->
        <div style="padding:10px 16px;border-bottom:1px solid var(--glass-border);display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <span style="font-size:11px;color:var(--text3);font-weight:600">📆 Jump to:</span>
            <span id="fin-period-picker">${_finPickerHTML()}</span>
          </div>
          <button class="btn-primary btn-sm" onclick="openAddTxModal('expense')"
            style="background:linear-gradient(135deg,#00c9a7,#6366f1);font-weight:700;padding:7px 16px;white-space:nowrap">+ Add Transaction</button>
        </div>

        <!-- Search + Type / Category / Sort filters -->
        <div style="padding:10px 16px;border-bottom:1px solid var(--glass-border);display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <!-- Text Search -->
          <div id="fin-search-wrap">
            <span class="search-icon">🔍</span>
            <input id="fin-search-input" type="text" placeholder="Search transactions…" value="${_finSearch||''}"
              oninput="setFinSearch(this.value)" onkeydown="if(event.key==='Escape'){clearFinSearch();this.blur()}" autocomplete="off"/>
          </div>
          <select id="fin-type" onchange="_finType=this.value;renderFinanceTxList()"
            style="background:#1e293b;border:1px solid var(--glass-border);color:#f1f5f9;border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer;color-scheme:dark">
            <option value="all"     style="background:#1e293b;color:#f1f5f9">All types</option>
            <option value="income"  style="background:#1e293b;color:#f1f5f9">💚 Income only</option>
            <option value="expense" style="background:#1e293b;color:#f1f5f9">❤️ Expense only</option>
          </select>

          <select id="fin-cat" onchange="_finCategory=this.value;renderFinanceTxList()"
            style="background:#1e293b;border:1px solid var(--glass-border);color:#f1f5f9;border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer;color-scheme:dark">
            <option value="all" style="background:#1e293b;color:#f1f5f9">All categories</option>
            ${_finCategoryOptions()}
          </select>

          <select id="fin-sort" onchange="_finSort=this.value;renderFinanceTxList()"
            style="background:#1e293b;border:1px solid var(--glass-border);color:#f1f5f9;border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer;color-scheme:dark">
            <option value="date-desc"   style="background:#1e293b;color:#f1f5f9">📅 Newest first</option>
            <option value="date-asc"    style="background:#1e293b;color:#f1f5f9">📅 Oldest first</option>
            <option value="amount-desc" style="background:#1e293b;color:#f1f5f9">💰 Highest amount</option>
            <option value="amount-asc"  style="background:#1e293b;color:#f1f5f9">💰 Lowest amount</option>
            <option value="alpha-asc"   style="background:#1e293b;color:#f1f5f9">🔤 A → Z</option>
            <option value="alpha-desc"  style="background:#1e293b;color:#f1f5f9">🔤 Z → A</option>
          </select>

          <button onclick="_finType='all';_finCategory='all';_finSort='date-desc';renderFinance()"
            style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:#ef4444;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:11px;font-weight:700">Clear filters</button>
        </div>

        <!-- Bulk action bar (only visible when ≥1 row selected) -->
        <div id="fin-bulk-bar" style="display:none;position:sticky;top:0;z-index:50;padding:10px 16px;background:linear-gradient(135deg,rgba(0,201,167,0.15),rgba(99,102,241,0.15));border-bottom:1px solid rgba(0,201,167,0.3);backdrop-filter:blur(12px);align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;color:var(--text2)">
              <input type="checkbox" id="fin-select-all" onchange="toggleSelectAllTx(this.checked)" style="cursor:pointer;width:16px;height:16px;accent-color:#00c9a7"/>
              Select all visible
            </label>
            <span id="fin-bulk-count" style="font-size:12px;font-weight:700;color:#00c9a7"></span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button onclick="openBulkCategoryChange()" style="padding:6px 14px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer">🏷️ Change Category</button>
            <button onclick="openBulkTypeChange()" style="padding:6px 14px;border-radius:8px;background:linear-gradient(135deg,#f59e0b,#ef4444);border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer">🔄 Change Type</button>
            <button onclick="deleteSelectedTx()" style="padding:6px 14px;border-radius:8px;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.4);color:#ef4444;font-size:12px;font-weight:700;cursor:pointer">🗑️ Delete Selected</button>
            <button onclick="clearSelectedTx()" style="padding:6px 14px;border-radius:8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:var(--text2);font-size:12px;cursor:pointer">✕ Clear</button>
          </div>
        </div>

        <div id="fin-tx-list"></div>
      </div>

    </div>`;

  renderFinanceChart(txnsAll);
  if (topCats.length > 0) renderFinancePieChart(topCats);
  renderFinanceTxList();
}

function renderFinanceChart(txns) {
  const canvas = document.getElementById('finance-chart');
  if (!canvas) return;
  const monthMap = {};
  txns.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (!monthMap[key]) monthMap[key] = { label, income: 0, expense: 0 };
    if (t.type === 'income') monthMap[key].income += t.amount;
    else monthMap[key].expense += t.amount;
  });
  const sorted = Object.entries(monthMap).sort(([a],[b])=>a.localeCompare(b)).slice(-8);
  const labels = sorted.map(([,v])=>v.label);
  const incomeData = sorted.map(([,v])=>v.income);
  const expenseData = sorted.map(([,v])=>v.expense);
  chartInstances['finance'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Income', data: incomeData, backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6 },
        { label: 'Expense', data: expenseData, backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 6 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter' } } } },
      scales: {
        x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#64748b', callback: v => `₹${(v/1000).toFixed(0)}k` }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

function renderFinancePieChart(topCats) {
  const canvas = document.getElementById('finance-pie-chart');
  if (!canvas) return;
  const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
  chartInstances['finance-pie'] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: topCats.map(([name]) => name),
      datasets: [{
        data: topCats.map(([,v]) => v),
        backgroundColor: COLORS,
        borderWidth: 2,
        borderColor: 'rgba(15,15,35,0.5)',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: { position: (window.__IS_APP ? 'right' : 'bottom'), labels: { color: '#94a3b8', font: { family: 'Inter', size: 13 }, padding: 14, boxWidth: 12 } },
        tooltip: { callbacks: { label: ctx => ` ₹${ctx.parsed.toLocaleString('en-IN')}` } }
      }
    }
  });
}


// ===== PARTIAL REFRESH — update hero + stats + list without full page re-render =====
function refreshFinancePage() {
  // MyMoney-style Records page (app) — re-render it instead of the finance page
  if (window.__IS_APP && typeof currentPage !== 'undefined' && currentPage === 'transactions'
      && typeof renderRecordsMyMoney === 'function') { renderRecordsMyMoney(); return; }
  if (!document.getElementById('fin-tx-list')) { renderFinance(); return; }

  const txnsAll = [...(STATE.transactions || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const txns    = filterTxByPeriod(txnsAll, _finPeriod);
  const income  = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = income - expense;
  const savingsOk = savings >= 0;
  const rate    = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;

  const bankTotal = (STATE.bankAccounts  || []).reduce((s, b) => s + (b.balance     || 0), 0);
  const cashTotal = (STATE.cashAccounts  || []).reduce((s, c) => s + (c.balance     || 0), 0);
  const cardTotal = (STATE.creditCards   || []).reduce((s, c) => s + (c.outstanding || 0), 0);
  const hasAccounts = (STATE.bankAccounts||[]).length + (STATE.cashAccounts||[]).length + (STATE.creditCards||[]).length > 0;
  const netWorth  = hasAccounts ? bankTotal + cashTotal - cardTotal : savings;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('fin-balance',    fmt(netWorth));
  set('fin-income',     '+' + fmt(income));
  set('fin-expense',    '-' + fmt(expense));
  set('fin-savings',    (savingsOk ? '+' : '') + fmt(savings));
  set('fin-rate',       `${savingsOk ? '📈' : '📉'} ${rate}% savings rate`);
  set('fin-stat-count', txnsAll.length);
  set('fin-stat-month', txns.length);
  set('fin-stat-rate',  rate + '%');

  const savEl = document.getElementById('fin-savings');
  if (savEl) savEl.style.color = savingsOk ? '#001a14' : '#7f0000';

  renderFinanceTxList();
}

// ===== TRANSACTION LIST — PERIOD FILTER =====

function setFinPeriod(p) {
  _finPeriod = p;
  _finAnchor = null;   // reset to current when switching period type
  document.querySelectorAll('.period-tabs .period-tab').forEach(b => b.classList.toggle('active', b.textContent.toLowerCase() === p));
  const pk = document.getElementById('fin-period-picker');
  if (pk) pk.innerHTML = _finPickerHTML();   // swap picker to the right input type
  refreshFinancePage();
}

// ── Specific period picker for the transaction list ──────────────────────────
function _finIsoWeekStr(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dn = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - dn + 3);
  const firstThu = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((t - firstThu) / 864e5 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
function _finWeekToMonday(val) {
  const m = val.match(/(\d{4})-W(\d{2})/); if (!m) return null;
  const year = +m[1], week = +m[2];
  const jan4 = new Date(year, 0, 4);
  const dow = (jan4.getDay() + 6) % 7;
  const wk1Mon = new Date(jan4); wk1Mon.setDate(jan4.getDate() - dow);
  const mon = new Date(wk1Mon); mon.setDate(wk1Mon.getDate() + (week - 1) * 7);
  const z = new Date(mon.getTime() - mon.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
function _finDefaultPickerValue(p) {
  const now = new Date();
  if (p === 'day')   return now.toISOString().slice(0, 10);
  if (p === 'week')  return _finIsoWeekStr(now);
  if (p === 'month') return now.toISOString().slice(0, 7);
  if (p === 'year')  return String(now.getFullYear());
  return '';
}
function _finAnchorToPickerValue(p, anchor) {
  if (p === 'day')   return anchor;
  if (p === 'month') return anchor.slice(0, 7);
  if (p === 'year')  return anchor.slice(0, 4);
  if (p === 'week')  return _finIsoWeekStr(new Date(anchor + 'T00:00:00'));
  return '';
}
function _finPickerHTML() {
  const p = _finPeriod;
  if (p === 'all') return '<span style="font-size:12px;color:var(--text3)">All time</span>';
  const type = p === 'day' ? 'date' : p === 'week' ? 'week' : p === 'month' ? 'month' : 'number';
  const val  = _finAnchor ? _finAnchorToPickerValue(p, _finAnchor) : _finDefaultPickerValue(p);
  return `<input type="${type}" id="fin-anchor-input" value="${val}" onchange="setFinAnchor(this.value)"
    ${p === 'year' ? 'min="2000" max="2100" step="1"' : ''}
    style="background:#1e293b;border:1px solid var(--glass-border);color:#f1f5f9;border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer;color-scheme:dark${p === 'year' ? ';width:90px' : ''}"/>`;
}
function _finAnchorFromPicker(p, val) {
  if (!val) return null;
  if (p === 'day')   return val;
  if (p === 'month') return val + '-01';
  if (p === 'year')  return val + '-01-01';
  if (p === 'week')  return _finWeekToMonday(val);
  return null;
}
function setFinAnchor(val) {
  _finAnchor = _finAnchorFromPicker(_finPeriod, val);
  renderFinanceTxList();
}

// Build <option>s for the category dropdown from every category the user
// has actually used, sorted alphabetically.
function _finCategoryOptions() {
  const cats = new Set();
  (STATE.transactions || []).forEach(t => { if (t.category) cats.add(t.category); });
  return [...cats].sort((a, b) => a.localeCompare(b))
    .map(c => `<option value="${c}" style="background:#1e293b;color:#f1f5f9">${c}</option>`).join('');
}

function renderFinanceTxList() {
  if (window.__IS_APP && typeof currentPage !== 'undefined' && currentPage === 'transactions'
      && typeof renderRecordsMyMoney === 'function') { renderRecordsMyMoney(); return; }
  const container = document.getElementById('fin-tx-list');
  if (!container) return;

  let txns = filterTxByAnchor([...(STATE.transactions || [])], _finPeriod, _finAnchor);
  // Type filter (income / expense)
  if (_finType !== 'all')     txns = txns.filter(t => t.type === _finType);
  // Category filter
  if (_finCategory !== 'all') txns = txns.filter(t => t.category === _finCategory);
  // Text search filter
  if (typeof _applyFinTextSearch === 'function') txns = _applyFinTextSearch(txns);

  // Sorting
  const cmp = {
    'date-desc':   (a, b) => new Date(b.date) - new Date(a.date),
    'date-asc':    (a, b) => new Date(a.date) - new Date(b.date),
    'amount-desc': (a, b) => (b.amount || 0) - (a.amount || 0),
    'amount-asc':  (a, b) => (a.amount || 0) - (b.amount || 0),
    'alpha-asc':   (a, b) => (a.description || a.category || '').localeCompare(b.description || b.category || ''),
    'alpha-desc':  (a, b) => (b.description || b.category || '').localeCompare(a.description || a.category || ''),
  }[_finSort] || ((a, b) => new Date(b.date) - new Date(a.date));
  txns.sort(cmp);

  // Restore dropdown values (after a full re-render the selects reset to their defaults)
  const typeSel = document.getElementById('fin-type'); if (typeSel) typeSel.value = _finType;
  const catSel  = document.getElementById('fin-cat');  if (catSel)  catSel.value  = _finCategory;
  const sortSel = document.getElementById('fin-sort'); if (sortSel) sortSel.value = _finSort;

  const countEl = document.getElementById('fin-tx-count');
  if (countEl) countEl.textContent = `${txns.length} entr${txns.length === 1 ? 'y' : 'ies'}`;

  if (!txns.length) {
    container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">💳</span><p>No transactions${_finPeriod !== 'all' ? ' for ' + periodLabel(_finPeriod) : ' yet'}. Add your first one!</p></div>`;
    // remove bulk bar if empty
    const bb = document.getElementById('fin-bulk-bar'); if (bb) bb.style.display = 'none';
    return;
  }

  // Inject sticky bulk-action bar before the list container (once)
  let bulkBar = document.getElementById('fin-bulk-bar');
  if (!bulkBar) {
    container.insertAdjacentHTML('beforebegin',
      `<div id="fin-bulk-bar" style="display:none;position:sticky;top:0;z-index:50;padding:10px 16px;background:linear-gradient(135deg,rgba(0,201,167,0.18),rgba(99,102,241,0.18));border-bottom:1px solid rgba(0,201,167,0.3);backdrop-filter:blur(12px);align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px"><span id='bulk-count-label' style='font-size:13px;font-weight:700;color:#00c9a7'>0 selected</span><div style='display:flex;gap:8px;flex-wrap:wrap'><button onclick='openBulkCategoryChange()' style='padding:6px 14px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer'>🏷️ Change Category</button><button onclick='openBulkTypeChange()' style='padding:6px 14px;border-radius:8px;background:linear-gradient(135deg,#f59e0b,#ef4444);border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer'>🔄 Change Type</button><button onclick='deleteSelectedTx()' style='padding:6px 14px;border-radius:8px;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.4);color:#ef4444;font-size:12px;font-weight:700;cursor:pointer'>🗑️ Delete Selected</button><button onclick='clearTxSelection()' style='padding:6px 14px;border-radius:8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:var(--text2);font-size:12px;cursor:pointer'>✕ Clear</button></div></div>`);
    bulkBar = document.getElementById('fin-bulk-bar');
  } else {
    bulkBar.style.display = 'none';
  }

  // Select-all header + rows
  container.innerHTML =
    `<div id="fin-select-all-row" style="display:flex;align-items:center;gap:10px;padding:8px 16px;background:rgba(0,201,167,0.05);border-bottom:1px solid rgba(0,201,167,0.15)">
       <input type="checkbox" id="chk-select-all" onchange="toggleSelectAll(this.checked)"
         style="width:16px;height:16px;accent-color:#00c9a7;cursor:pointer"/>
       <span style="font-size:12px;color:var(--text3);user-select:none">Select All &nbsp;<span id="sel-count-label"></span></span>
     </div>` +
    txns.map(tx => `
    <div id="txrow-${tx.id}" class="tx-row" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.04);transition:.2s;cursor:pointer"
         onclick="if(!event.target.closest('button')&&!event.target.closest('input'))openTxDetail('${tx.id}')"
         onmouseover="this.style.background='rgba(255,255,255,0.04)'" onmouseout="if(!document.getElementById('chk-${tx.id}')?.checked)this.style.background=''">
      <div style="display:flex;align-items:center;gap:12px">
        <input type="checkbox" id="chk-${tx.id}" data-txid="${tx.id}" class="fin-tx-chk"
          onchange="onTxCheckChange()"
          style="width:16px;height:16px;accent-color:#00c9a7;cursor:pointer;flex-shrink:0"/>
        <div class="tx-ic" style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${catColor(tx.category)}26;border:1px solid ${catColor(tx.category)}55;font-size:18px">${tx.icon || catIcon(tx.category)}</div>
        <div>
          <p style="font-size:13px;font-weight:600">${tx.description || tx.category}${tx.recurringId ? ' <span title="Recurring" style="font-size:11px">🔁</span>' : ''}</p>
          <p style="font-size:11px;color:var(--text3)">${tx.category}${tx.subcategory ? ' › <span style="color:#a5b4fc">' + esc(tx.subcategory) + '</span>' : ''} · ${fmtDate(tx.date)}${tx.source ? ' · <span style="color:#f59e0b">' + _sourceLabel(tx.source) + '</span>' : ''}</p>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-weight:700;font-size:14px;color:${tx.type === 'income' ? '#10b981' : '#ef4444'}">${tx.type === 'income' ? '+' : '-'}${fmt(tx.amount)}</span>
        <button class="btn-icon btn-sm" onclick="openEditTxModal('${tx.id}')" style="font-size:13px" title="Edit">✏️</button>
        <button class="btn-icon btn-sm" onclick="deleteTx('${tx.id}')" style="font-size:13px;color:#ef4444;border-color:rgba(239,68,68,0.3)" title="Delete">✕</button>
      </div>
    </div>`).join('');

  _updateBulkBar();
}

// ===== BULK SELECT / DELETE =====
function _updateBulkBar() {
  // Sync the sticky bar visibility based on how many checkboxes are ticked
  const all  = document.querySelectorAll('.fin-tx-chk');
  const chkd = document.querySelectorAll('.fin-tx-chk:checked');
  const n    = chkd.length;
  const bar  = document.getElementById('fin-bulk-bar');
  if (bar) bar.style.display = n > 0 ? 'flex' : 'none';
}

// ===== BULK SELECTION HELPERS =====
function getSelectedTxIds() {
  return [...document.querySelectorAll('.fin-tx-chk:checked')].map(c => c.dataset.txid);
}

function onTxCheckChange() {
  const all  = document.querySelectorAll('.fin-tx-chk');
  const chkd = document.querySelectorAll('.fin-tx-chk:checked');
  const n    = chkd.length;
  const bar  = document.getElementById('fin-bulk-bar');

  // Static bar elements (id="fin-select-all", id="fin-bulk-count")
  const saStatic  = document.getElementById('fin-select-all');
  const cntStatic = document.getElementById('fin-bulk-count');
  // Dynamic bar elements (id="chk-select-all", id="sel-count-label", id="bulk-count-label")
  const saDyn  = document.getElementById('chk-select-all');
  const lbl    = document.getElementById('sel-count-label');
  const blbl   = document.getElementById('bulk-count-label');

  if (bar) bar.style.display = n > 0 ? 'flex' : 'none';

  // Update count labels
  const countText = n > 0 ? `${n} selected` : '';
  if (cntStatic) cntStatic.textContent = countText;
  if (blbl)      blbl.textContent      = countText;
  if (lbl)       lbl.textContent       = n > 0 ? `(${n} selected)` : '';

  // Update select-all checkboxes
  [saStatic, saDyn].forEach(el => {
    if (!el) return;
    el.indeterminate = n > 0 && n < all.length;
    if (n === all.length && n > 0) el.checked = true;
    if (n === 0) el.checked = false;
  });

  // Highlight selected rows
  document.querySelectorAll('.fin-tx-chk').forEach(c => {
    const row = document.getElementById('txrow-' + c.dataset.txid);
    if (row) row.style.background = c.checked ? 'rgba(0,201,167,0.08)' : '';
  });
}

function toggleSelectAll(checked) {
  document.querySelectorAll('.fin-tx-chk').forEach(c => { c.checked = checked; });
  onTxCheckChange();
}

// toggleSelectAllTx — called by the static bar's "Select all visible" checkbox
function toggleSelectAllTx(checked) {
  toggleSelectAll(checked);
}

function clearSelectedTx() {
  clearTxSelection();
}

function toggleSelectAll(checked) {
  document.querySelectorAll('.fin-tx-chk').forEach(c => { c.checked = checked; });
  onTxCheckChange();
}

function clearTxSelection() {
  toggleSelectAll(false);
}

function openBulkCategoryChange() {
  const ids = getSelectedTxIds();
  if (!ids.length) { toast('Select at least one transaction', 'error'); return; }
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const opts = allCats.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('');
  openModal(`🏷️ Change Category (${ids.length} transactions)`,
    `<div class="form-group"><label class="form-label">New Category</label>
     <select id="bulk-cat" class="form-input">${opts}</select></div>
     <label style="display:flex;gap:8px;align-items:flex-start;margin-top:12px;font-size:13px;color:var(--text2);cursor:pointer;line-height:1.5">
       <input type="checkbox" id="bulk-cat-samename" checked style="width:16px;height:16px;accent-color:#00c9a7;margin-top:2px;flex-shrink:0"/>
       <span>Apply to <strong>all transactions with the same name</strong>, and remember it for future entries &amp; imports</span>
     </label>
     <div class="modal-actions">
       <button class="btn-secondary" onclick="closeModal()">Cancel</button>
       <button class="btn-primary" onclick='applyBulkCategory(${JSON.stringify(ids)})'>✅ Apply</button>
     </div>`);
}

function applyBulkCategory(ids) {
  const cat = document.getElementById('bulk-cat')?.value;
  if (!cat) return;
  const sameName = document.getElementById('bulk-cat-samename')?.checked;
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const icon = allCats.find(c => c.name === cat)?.icon || '💳';
  const txs = STATE.transactions || [];

  // Collect the names of the selected transactions
  const names = new Set(
    txs.filter(t => ids.includes(t.id))
       .map(t => (t.description || '').trim().toLowerCase())
       .filter(Boolean)
  );

  let count = 0;
  STATE.transactions = txs.map(t => {
    const selected  = ids.includes(t.id);
    const sameNamed = sameName && names.has((t.description || '').trim().toLowerCase());
    if (selected || sameNamed) { count++; return { ...t, category: cat, icon }; }
    return t;
  });

  // Remember the rule so future adds/imports with this name auto-categorize
  if (sameName) names.forEach(n => setCategoryRule(n, cat));

  saveState();
  closeModal();
  toast(`Category "${cat}" applied to ${count} transaction${count > 1 ? 's' : ''}${sameName ? ' · saved for future' : ''} ✅`, 'success');
  renderFinanceTxList();
}

// ── Auto-categorization rules: remember "name → category" ──────────────────
function getCategoryRule(desc) {
  if (!desc) return null;
  const rules = STATE.categoryRules || {};
  return rules[desc.trim().toLowerCase()] || null;
}
function setCategoryRule(desc, cat) {
  if (!desc || !cat) return;
  STATE.categoryRules = STATE.categoryRules || {};
  STATE.categoryRules[desc.trim().toLowerCase()] = cat;
}

function openBulkTypeChange() {
  const ids = getSelectedTxIds();
  if (!ids.length) { toast('Select at least one transaction', 'error'); return; }
  openModal(`🔄 Change Type (${ids.length} transactions)`,
    `<div class="form-group"><label class="form-label">New Type</label>
     <select id="bulk-type" class="form-input">
       <option value="expense">❤️ Expense</option>
       <option value="income">💚 Income</option>
     </select></div>
     <div class="modal-actions">
       <button class="btn-secondary" onclick="closeModal()">Cancel</button>
       <button class="btn-primary" onclick='applyBulkType(${JSON.stringify(ids)})'>✅ Apply to All</button>
     </div>`);
}

function applyBulkType(ids) {
  const type = document.getElementById('bulk-type')?.value;
  if (!type) return;
  STATE.transactions = (STATE.transactions || []).map(t =>
    ids.includes(t.id) ? { ...t, type } : t
  );
  saveState();
  closeModal();
  toast(`Type changed to "${type}" for ${ids.length} transaction${ids.length > 1 ? 's' : ''} ✅`, 'success');
  renderFinanceTxList();
}

function deleteSelectedTx() {
  const ids = getSelectedTxIds();
  if (!ids.length) { toast('Select at least one transaction', 'error'); return; }
  if (!confirm(`Delete ${ids.length} selected transaction${ids.length > 1 ? 's' : ''}?`)) return;
  STATE.transactions = (STATE.transactions || []).filter(t => !ids.includes(t.id));
  saveState();
  if (typeof autoSyncGoals === 'function') autoSyncGoals();
  toast(`${ids.length} transaction${ids.length > 1 ? 's' : ''} deleted`, 'info');
  renderFinanceTxList();
  refreshFinancePage();
}

function openAddTxModal(defaultType) {
  const _defType = defaultType || 'expense';
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const catOptions = allCats.map(c => `<option value="${c.name}" data-icon="${c.icon}">${c.icon} ${c.name}</option>`).join('');
  const srcOptions = _buildAccountSourceOptions('');

  openModal('Add Transaction', `
    <div class="form-group"><label class="form-label">Type</label>
      <select id="tx-type" class="form-input">
        <option value="expense" ${_defType==='expense'?'selected':''}>❤️ Expense</option>
        <option value="income" ${_defType==='income'?'selected':''}>💚 Income</option>
      </select></div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Amount (₹)</label><input type="number" id="tx-amount" class="form-input" placeholder="0.00" min="0" step="0.01"/></div>
      <div class="form-group"><label class="form-label">Date</label><input type="date" id="tx-date" class="form-input" value="${today()}"/></div>
    </div>
    <div class="form-group"><label class="form-label">Time <span style="opacity:.6;font-weight:400">(optional)</span></label><input type="time" id="tx-time" class="form-input" value="${_nowTime()}"/></div>
    <div class="form-group"><label class="form-label">Category</label><select id="tx-cat" class="form-input">${catOptions}</select></div>
    <div class="form-group"><label class="form-label">Subcategory <span style="opacity:.6;font-weight:400">(optional)</span></label>
      <input type="text" id="tx-subcat" class="form-input" list="subcat-list" placeholder="e.g. Groceries, Labour cost, Restaurant"/>
      <datalist id="subcat-list">${_subcatSuggestions()}</datalist></div>
    <div class="form-group"><label class="form-label">💳 Account / Paid From</label>
      <select id="tx-source" class="form-input">${srcOptions}</select></div>
    <div class="form-group"><label class="form-label">🔁 Repeat</label>
      <select id="tx-repeat" class="form-input">
        <option value="">None (one-time)</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select></div>
    <div class="form-group"><label class="form-label">Description</label><input type="text" id="tx-desc" class="form-input" placeholder="What was this for?"/></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveTx()">Save Transaction</button>
    </div>`);
}

let _pendingTx = null; // holds values while duplicate-confirmation modal is open

function saveTx() {
  const type = document.getElementById('tx-type').value;
  const amount = parseFloat(document.getElementById('tx-amount').value);
  const date = document.getElementById('tx-date').value || today();
  const catEl = document.getElementById('tx-cat');
  const category = catEl.value;
  const icon = CATEGORIES.find(c => c.name === category)?.icon || '💳';
  const description = document.getElementById('tx-desc').value.trim();
  const source = document.getElementById('tx-source')?.value || '';
  const subcategory = (document.getElementById('tx-subcat')?.value || '').trim();
  const frequency = document.getElementById('tx-repeat')?.value || '';
  const time = document.getElementById('tx-time')?.value || '';
  if (!amount || amount <= 0) { toast('Enter a valid amount', 'error'); return; }
  const dupe = _findDuplicate(amount, date, description, null);
  if (dupe) {
    _pendingTx = { type, amount, date, category, icon, description, source, subcategory, frequency, time };
    openModal('⚠️ Possible Duplicate', `
      <p style="font-size:13px;color:var(--text2);margin-bottom:14px">A similar transaction already exists:</p>
      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:12px;margin-bottom:16px;font-size:13px">
        <strong>${dupe.description || dupe.category}</strong><br/>
        <span style="color:var(--text3)">${dupe.category} · ${fmtDate(dupe.date)}</span><br/>
        <span style="color:#ef4444;font-weight:700">${dupe.type === 'income' ? '+' : '-'}${fmt(dupe.amount)}</span>
      </div>
      <p style="font-size:12px;color:var(--text3);margin-bottom:16px">Is this a double entry or a new transaction?</p>
      <div class="modal-actions">
        <button class="btn-secondary" onclick="closeModal()">Cancel (don't save)</button>
        <button class="btn-primary" onclick="confirmSaveTx()">Save Anyway</button>
      </div>`);
    return;
  }
  _commitTx({ type, amount, date, category, icon, description, source, subcategory, frequency, time });
}

function confirmSaveTx() {
  if (_pendingTx) { _commitTx(_pendingTx); _pendingTx = null; }
}

function _commitTx(tx) {
  STATE.transactions = STATE.transactions || [];
  const frequency = tx.frequency || '';
  delete tx.frequency;
  // Auto-apply a remembered category rule for this name (if one exists)
  const ruled = getCategoryRule(tx.description);
  if (ruled) {
    tx = { ...tx, category: ruled };
    const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
    tx.icon = allCats.find(c => c.name === ruled)?.icon || tx.icon || '💳';
  }
  const newTx = { id: genId(), ...tx, createdAt: new Date().toISOString() };
  STATE.transactions.unshift(newTx);
  _applyTxToAccount(newTx);
  // Register a recurring rule (next occurrence after this one)
  if (frequency) {
    STATE.recurring = STATE.recurring || [];
    STATE.recurring.push({
      id: genId(), type: tx.type, amount: tx.amount, category: tx.category,
      icon: tx.icon, description: tx.description, source: tx.source || '',
      subcategory: tx.subcategory || '', frequency,
      nextDate: _advanceDate(newTx.date, frequency), createdAt: new Date().toISOString()
    });
  }
  saveState();
  addXP(10, 'Transaction logged');
  if (typeof autoSyncGoals === 'function') autoSyncGoals();
  closeModal();
  toast(frequency ? `Transaction saved & set to repeat ${frequency}! +10 XP` : 'Transaction saved! +10 XP', 'success');
  refreshFinancePage();
}

function deleteTx(id) {
  const tx = (STATE.transactions || []).find(t => t.id === id);
  if (tx) _reverseTxFromAccount(tx);
  STATE.transactions = (STATE.transactions || []).filter(t => t.id !== id);
  saveState();
  if (typeof autoSyncGoals === 'function') autoSyncGoals();
  toast('Transaction deleted', 'info');
  renderFinanceTxList();
}

function openEditTxModal(id) {
  const tx = (STATE.transactions || []).find(t => t.id === id);
  if (!tx) return;
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const catOptions = allCats.map(c =>
    `<option value="${c.name}" ${c.name === tx.category ? 'selected' : ''}>${c.icon} ${c.name}</option>`
  ).join('');

  const srcOptions = _buildAccountSourceOptions(tx.source || '');
  openModal('✏️ Edit Transaction', `
    <div class="form-group">
      <label class="form-label">Type</label>
      <select id="etx-type" class="form-input">
        <option value="expense" ${tx.type === 'expense' ? 'selected' : ''}>❤️ Expense</option>
        <option value="income"  ${tx.type === 'income'  ? 'selected' : ''}>💚 Income</option>
      </select>
    </div>
    <div class="input-row">
      <div class="form-group">
        <label class="form-label">Amount (₹)</label>
        <input type="number" id="etx-amount" class="form-input" value="${tx.amount}" step="0.01" min="0"/>
      </div>
      <div class="form-group">
        <label class="form-label">Date</label>
        <input type="date" id="etx-date" class="form-input" value="${tx.date}"/>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Time <span style="opacity:.6;font-weight:400">(optional)</span></label>
      <input type="time" id="etx-time" class="form-input" value="${tx.time || ''}"/>
    </div>
    <div class="form-group">
      <label class="form-label">Category</label>
      <select id="etx-cat" class="form-input">${catOptions}</select>
    </div>
    <div class="form-group">
      <label class="form-label">Subcategory <span style="opacity:.6;font-weight:400">(optional)</span></label>
      <input type="text" id="etx-subcat" class="form-input" list="subcat-list" value="${esc(tx.subcategory || '')}" placeholder="e.g. Groceries, Labour cost"/>
      <datalist id="subcat-list">${_subcatSuggestions()}</datalist>
    </div>
    <div class="form-group">
      <label class="form-label">💳 Account / Paid From</label>
      <select id="etx-source" class="form-input">${srcOptions}</select>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <input type="text" id="etx-desc" class="form-input" value="${tx.description || ''}" placeholder="What was this for?"/>
    </div>
    <div class="form-group" style="margin-top:-5px">
      <label style="font-size:12px;color:var(--text2);display:flex;align-items:center;gap:8px;cursor:pointer;">
        <input type="checkbox" id="etx-apply-all" checked style="accent-color:#00c9a7;width:14px;height:14px;" />
        Auto-update all transactions with this description
      </label>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveEditTx('${id}')">💾 Save Changes</button>
    </div>`);
}

function saveEditTx(id) {
  const tx = (STATE.transactions || []).find(t => t.id === id);
  if (!tx) return;

  const type   = document.getElementById('etx-type')?.value;
  const amount = parseFloat(document.getElementById('etx-amount')?.value);
  const date   = document.getElementById('etx-date')?.value || today();
  const cat    = document.getElementById('etx-cat')?.value;
  const desc   = document.getElementById('etx-desc')?.value.trim();
  const source = document.getElementById('etx-source')?.value || tx.source || '';
  const subcategory = (document.getElementById('etx-subcat')?.value || '').trim();
  const time = document.getElementById('etx-time')?.value || '';
  const applyAll = document.getElementById('etx-apply-all')?.checked;

  if (!amount || amount <= 0) { toast('Enter a valid amount', 'error'); return; }

  _reverseTxFromAccount(tx); // undo old balance effect before changing fields

  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  tx.type        = type;
  tx.amount      = amount;
  tx.date        = date;
  tx.category    = cat;
  tx.icon        = allCats.find(c => c.name === cat)?.icon || tx.icon || '💳';
  tx.description = desc;
  tx.source      = source;
  tx.subcategory = subcategory;
  tx.time        = time;

  _applyTxToAccount(tx); // apply new balance effect

  let extraMsg = '';
  if (applyAll && desc) {
    let count = 0;
    STATE.transactions.forEach(t => {
      if (t.id !== id && t.description === desc && t.category !== cat) {
        t.category = cat;
        t.icon = tx.icon;
        count++;
      }
    });
    if (count > 0) extraMsg = ` & ${count} others updated`;
  }

  saveState();
  if (typeof autoSyncGoals === 'function') autoSyncGoals();
  closeModal();
  toast(`Transaction updated ✅${extraMsg}`, 'success');
  renderFinanceTxList(); // instant list refresh without full page re-render
}

// ===== REAL-TIME ACCOUNT BALANCE SYNC =====
// When a transaction with a `source` is saved, the linked account balance is
// updated immediately and a history entry is logged so it can be reversed on edit/delete.

function _applyTxToAccount(tx) {
  if (!tx.source || !tx.id) return;
  const [type, id] = tx.source.split(':');
  const note = `${tx.type === 'income' ? '💚 Income' : '❤️ Expense'}: ${tx.description || tx.category} (₹${tx.amount})`;
  const date = tx.date || today();

  if (type === 'bank') {
    const acc = (STATE.bankAccounts || []).find(a => a.id === id);
    if (!acc) return;
    const delta = tx.type === 'income' ? tx.amount : -tx.amount;
    const prev = acc.balance || 0;
    acc.balance = Math.max(0, prev + delta);
    STATE.bankBalanceHistory = STATE.bankBalanceHistory || [];
    STATE.bankBalanceHistory.push({ id: genId(), accountId: id, balance: acc.balance, prevBalance: prev, date, note, txId: tx.id, createdAt: new Date().toISOString() });

  } else if (type === 'card') {
    const card = (STATE.creditCards || []).find(c => c.id === id);
    if (!card) return;
    // expense = more debt (outstanding ↑), income/refund = less debt (outstanding ↓)
    const delta = tx.type === 'expense' ? tx.amount : -tx.amount;
    const prev = card.outstanding || 0;
    card.outstanding = Math.max(0, prev + delta);
    STATE.creditCardHistory = STATE.creditCardHistory || [];
    STATE.creditCardHistory.push({ id: genId(), cardId: id, outstanding: card.outstanding, prevOutstanding: prev, date, note, txId: tx.id, createdAt: new Date().toISOString() });

  } else if (type === 'cash') {
    const acc = (STATE.cashAccounts || []).find(a => a.id === id);
    if (!acc) return;
    const delta = tx.type === 'income' ? tx.amount : -tx.amount;
    const prev = acc.balance || 0;
    acc.balance = Math.max(0, prev + delta);
    STATE.cashBalanceHistory = STATE.cashBalanceHistory || [];
    STATE.cashBalanceHistory.push({ id: genId(), accountId: id, balance: acc.balance, prevBalance: prev, date, note, txId: tx.id, createdAt: new Date().toISOString() });
  }
}

function _reverseTxFromAccount(tx) {
  if (!tx.source || !tx.id) return;
  const [type, id] = tx.source.split(':');

  if (type === 'bank') {
    const hist = STATE.bankBalanceHistory || [];
    const entry = hist.find(h => h.txId === tx.id);
    if (!entry) return;
    const acc = (STATE.bankAccounts || []).find(a => a.id === id);
    if (acc) acc.balance = entry.prevBalance;
    STATE.bankBalanceHistory = hist.filter(h => h !== entry);

  } else if (type === 'card') {
    const hist = STATE.creditCardHistory || [];
    const entry = hist.find(h => h.txId === tx.id);
    if (!entry) return;
    const card = (STATE.creditCards || []).find(c => c.id === id);
    if (card) card.outstanding = entry.prevOutstanding;
    STATE.creditCardHistory = hist.filter(h => h !== entry);

  } else if (type === 'cash') {
    const hist = STATE.cashBalanceHistory || [];
    const entry = hist.find(h => h.txId === tx.id);
    if (!entry) return;
    const acc = (STATE.cashAccounts || []).find(a => a.id === id);
    if (acc) acc.balance = entry.prevBalance;
    STATE.cashBalanceHistory = hist.filter(h => h !== entry);
  }
}

// ===== DOUBLE-ENTRY / DUPLICATE DETECTION =====

function _findDuplicate(amount, date, description, excludeId) {
  const txns = STATE.transactions || [];
  const targetDate = new Date(date);
  return txns.find(t => {
    if (excludeId && t.id === excludeId) return false;
    if (t.amount !== amount) return false;
    const d = new Date(t.date);
    const dayDiff = Math.abs((targetDate - d) / 86400000);
    if (dayDiff > 1) return false;
    if (description && t.description && t.description.toLowerCase() === description.toLowerCase()) return true;
    if (!description || !t.description) return dayDiff === 0; // same day + same amount = suspect
    return false;
  }) || null;
}

// ===== ACCOUNT SOURCE HELPERS =====

function _buildAccountSourceOptions(selected) {
  const opts = [`<option value="">-- No Account --</option>`];
  (STATE.cashAccounts || []).forEach(ca => {
    const val = `cash:${ca.id}`;
    opts.push(`<option value="${val}" ${selected === val ? 'selected' : ''}>💵 ${ca.name} (Cash)</option>`);
  });
  (STATE.bankAccounts || []).forEach(b => {
    const val = `bank:${b.id}`;
    opts.push(`<option value="${val}" ${selected === val ? 'selected' : ''}>🏦 ${b.bankName}${b.lastFour ? ' ····' + b.lastFour : ''}</option>`);
  });
  (STATE.creditCards || []).forEach(c => {
    const val = `card:${c.id}`;
    opts.push(`<option value="${val}" ${selected === val ? 'selected' : ''}>💳 ${c.bankName}${c.lastFour ? ' ····' + c.lastFour : ''}</option>`);
  });
  return opts.join('');
}

function _sourceLabel(source) {
  if (!source) return '';
  const [type, id] = source.split(':');
  if (type === 'cash') {
    const ca = (STATE.cashAccounts || []).find(c => c.id === id);
    return ca ? `💵 ${ca.name}` : '💵 Cash';
  }
  if (type === 'bank') {
    const b = (STATE.bankAccounts || []).find(a => a.id === id);
    return b ? `🏦 ${b.bankName}` : '🏦 Bank';
  }
  if (type === 'card') {
    const c = (STATE.creditCards || []).find(cc => cc.id === id);
    return c ? `💳 ${c.bankName}` : '💳 Card';
  }
  return source;
}

// ===== CASH ACCOUNTS =====

function addCashAccount() {
  openModal('💵 Add Cash Wallet', `
    <div class="form-group"><label class="form-label">Wallet Name</label>
      <input type="text" id="cash-name" class="form-input" placeholder="e.g. Wallet, Petty Cash, Savings Jar"/>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Current Balance (₹)</label>
        <input type="number" id="cash-balance" class="form-input" placeholder="0.00" min="0" step="0.01"/>
      </div>
      <div class="form-group"><label class="form-label">Balance As Of Date</label>
        <input type="date" id="cash-bal-date" class="form-input" value="${today()}"/>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveCashAccount(null)">💾 Save Wallet</button>
    </div>`);
}

function editCashAccount(i) {
  const ca = (STATE.cashAccounts || [])[i];
  if (!ca) return;
  openModal('✏️ Edit Cash Wallet', `
    <div class="form-group"><label class="form-label">Wallet Name</label>
      <input type="text" id="cash-name" class="form-input" value="${ca.name}"/>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveCashAccount(${i})">💾 Save Changes</button>
    </div>`);
}

function saveCashAccount(editIndex) {
  const name = document.getElementById('cash-name')?.value.trim();
  if (!name) { toast('Enter a wallet name', 'error'); return; }
  STATE.cashAccounts = STATE.cashAccounts || [];
  STATE.cashBalanceHistory = STATE.cashBalanceHistory || [];
  if (editIndex !== null && editIndex >= 0) {
    STATE.cashAccounts[editIndex].name = name;
    toast('Cash wallet updated ✅', 'success');
  } else {
    const balance = parseFloat(document.getElementById('cash-balance')?.value) || 0;
    const balDate = document.getElementById('cash-bal-date')?.value || today();
    const id = genId();
    STATE.cashAccounts.push({ id, name, balance });
    STATE.cashBalanceHistory.push({ accountId: id, balance, date: balDate, note: 'Wallet created' });
    toast('Cash wallet added! 💵', 'success');
  }
  saveState();
  closeModal();
  renderFinance();
}

function deleteCashAccount(i) {
  const ca = (STATE.cashAccounts || [])[i];
  if (!ca) return;
  if (!confirm(`Delete "${ca.name}" cash wallet?`)) return;
  STATE.cashAccounts = (STATE.cashAccounts || []).filter((_, idx) => idx !== i);
  saveState();
  toast('Cash wallet removed', 'info');
  renderFinance();
}

function updateCashBalance(i) {
  const ca = (STATE.cashAccounts || [])[i];
  if (!ca) return;
  openModal(`💵 Update ${ca.name} Balance`, `
    <p style="font-size:12px;color:var(--text3);margin-bottom:14px">Current: <strong>${fmt(ca.balance || 0)}</strong></p>
    <div class="input-row">
      <div class="form-group"><label class="form-label">New Balance (₹)</label>
        <input type="number" id="cash-upd-bal" class="form-input" value="${ca.balance || 0}" step="0.01" min="0"/>
      </div>
      <div class="form-group"><label class="form-label">Date</label>
        <input type="date" id="cash-upd-date" class="form-input" value="${today()}"/>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Note (optional)</label>
      <input type="text" id="cash-upd-note" class="form-input" placeholder="e.g. Counted cash"/>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveCashBalanceUpdate(${i})">💾 Update</button>
    </div>`);
}

function saveCashBalanceUpdate(i) {
  const ca = (STATE.cashAccounts || [])[i];
  if (!ca) return;
  const newBal = parseFloat(document.getElementById('cash-upd-bal')?.value);
  const date   = document.getElementById('cash-upd-date')?.value || today();
  const note   = document.getElementById('cash-upd-note')?.value.trim() || 'Manual update';
  if (isNaN(newBal) || newBal < 0) { toast('Enter a valid balance', 'error'); return; }
  const oldBal = ca.balance;
  ca.balance = newBal;
  STATE.cashBalanceHistory = STATE.cashBalanceHistory || [];
  STATE.cashBalanceHistory.push({ accountId: ca.id, balance: newBal, prevBalance: oldBal, date, note });
  saveState();
  closeModal();
  toast(`${ca.name} updated to ${fmt(newBal)} ✅`, 'success');
  renderFinance();
}

// ===== BANK ACCOUNTS =====
const BANK_PRESETS = [
  { label:'SBI',          icon:'🏛️', color:'#1a237e', color2:'#0d1757' },
  { label:'HDFC',         icon:'🔴', color:'#b71c1c', color2:'#7f1212' },
  { label:'ICICI',        icon:'🟠', color:'#e65100', color2:'#bf360c' },
  { label:'Axis',         icon:'🟣', color:'#4a148c', color2:'#2d0066' },
  { label:'Kotak',        icon:'🔴', color:'#c62828', color2:'#8e1919' },
  { label:'Yes Bank',     icon:'🟢', color:'#1b5e20', color2:'#0d3311' },
  { label:'Federal Bank', icon:'🔵', color:'#1565c0', color2:'#0d3b7a' },
  { label:'IndusInd',     icon:'🟡', color:'#f57f17', color2:'#c46200' },
  { label:'PNB',          icon:'🟠', color:'#bf360c', color2:'#8b1a00' },
  { label:'Canara',       icon:'🔵', color:'#0277bd', color2:'#004d8e' },
  { label:'PayTM',        icon:'💙', color:'#006cb7', color2:'#004c87' },
  { label:'Other',        icon:'🏦', color:'#1e293b', color2:'#0f172a' },
];

function addBankAccount() {
  const presetOpts = BANK_PRESETS.map(p => `<option value="${p.label}">${p.icon} ${p.label}</option>`).join('');
  openModal('Add Bank Account', `
    <div class="form-group"><label class="form-label">Bank Name</label>
      <select id="bank-preset" class="form-input" onchange="applyBankPreset(this.value)">
        <option value="">-- Select Bank --</option>${presetOpts}
        <option value="custom">✏️ Custom</option>
      </select>
    </div>
    <div class="form-group" id="bank-custom-row" style="display:none">
      <label class="form-label">Custom Bank Name</label>
      <input type="text" id="bank-custom-name" class="form-input" placeholder="My Bank Name"/>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Account Type</label>
        <select id="bank-type" class="form-input">
          <option>Savings</option><option>Current</option><option>Salary</option><option>Fixed Deposit</option><option>Wallet</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">Balance (₹)</label>
        <input type="number" id="bank-balance" class="form-input" placeholder="0.00" min="0" step="0.01"/>
      </div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Balance As Of Date</label>
        <input type="date" id="bank-bal-date" class="form-input" value="${today()}"/>
      </div>
      <div class="form-group"><label class="form-label">Last 4 digits of Account No. (optional)</label>
        <input type="text" id="bank-last4" class="form-input" maxlength="4" placeholder="XXXX"/>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveBankAccount(null)">Save Account</button>
    </div>`);
}

function applyBankPreset(val) {
  const customRow = document.getElementById('bank-custom-row');
  if (customRow) customRow.style.display = val === 'custom' ? 'flex' : 'none';
}

function editBankAccount(i) {
  const b = (STATE.bankAccounts||[])[i];
  if (!b) return;
  const presetOpts = BANK_PRESETS.map(p => `<option value="${p.label}" ${b.bankName===p.label?'selected':''}>${p.icon} ${p.label}</option>`).join('');
  openModal('Edit Bank Account', `
    <div class="form-group"><label class="form-label">Bank Name</label>
      <select id="bank-preset" class="form-input">
        <option value="">-- Select Bank --</option>${presetOpts}
        <option value="custom" ${!BANK_PRESETS.find(p=>p.label===b.bankName)?'selected':''}>✏️ Custom</option>
      </select>
    </div>
    <div class="form-group" id="bank-custom-row" style="display:${!BANK_PRESETS.find(p=>p.label===b.bankName)?'flex':'none'}">
      <label class="form-label">Custom Bank Name</label>
      <input type="text" id="bank-custom-name" class="form-input" value="${b.bankName||''}"/>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Account Type</label>
        <select id="bank-type" class="form-input">
          ${['Savings','Current','Salary','Fixed Deposit','Wallet'].map(t=>`<option ${b.type===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Balance (₹)</label>
        <input type="number" id="bank-balance" class="form-input" value="${b.balance||0}" min="0" step="0.01"/>
      </div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Balance As Of Date</label>
        <input type="date" id="bank-bal-date" class="form-input" value="${today()}"/>
      </div>
      <div class="form-group"><label class="form-label">Last 4 digits</label>
        <input type="text" id="bank-last4" class="form-input" maxlength="4" value="${b.lastFour||''}"/>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveBankAccount(${i})">Update Account</button>
    </div>`);
}

function saveBankAccount(editIndex) {
  const preset   = document.getElementById('bank-preset')?.value;
  const isCustom = preset === 'custom' || preset === '';
  const bankName = isCustom
    ? (document.getElementById('bank-custom-name')?.value.trim() || 'My Bank')
    : preset;
  const balance  = parseFloat(document.getElementById('bank-balance')?.value) || 0;
  const type     = document.getElementById('bank-type')?.value || 'Savings';
  const lastFour = document.getElementById('bank-last4')?.value.trim().slice(-4) || '';
  const balDate  = document.getElementById('bank-bal-date')?.value || today();

  const found = BANK_PRESETS.find(p => p.label === bankName);
  const icon  = found?.icon  || '🏦';
  const color = found?.color || '#1e293b';
  const color2= found?.color2|| '#0f172a';

  const account = { id: genId(), bankName, type, balance, lastFour, icon, color, color2 };
  STATE.bankAccounts = STATE.bankAccounts || [];

  if (editIndex !== null && editIndex >= 0) {
    account.id = STATE.bankAccounts[editIndex].id;
    STATE.bankAccounts[editIndex] = account;
    toast('Bank account updated! ✅', 'success');
  } else {
    STATE.bankAccounts.push(account);
    toast('Bank account added! 🏦', 'success');
  }
  // Auto-log balance history snapshot with the user-supplied date
  STATE.bankBalanceHistory = STATE.bankBalanceHistory || [];
  STATE.bankBalanceHistory.push({
    accountId: account.id,
    balance,
    date: balDate,
    note: editIndex !== null && editIndex >= 0 ? 'Balance updated' : 'Account added'
  });
  saveState();
  closeModal();
  renderFinance();
}

function deleteBankAccount(i) {
  STATE.bankAccounts = (STATE.bankAccounts||[]).filter((_,idx)=>idx!==i);
  saveState();
  toast('Bank account removed', 'info');
  renderFinance();
}

function updateBankBalance(i) {
  const b = (STATE.bankAccounts||[])[i];
  if (!b) return;
  // Use the rich modal from bank-tracker (date shortcuts, chat history, etc.)
  openQuickBalanceModal(b.id);
}

function saveBalanceUpdate(i) {
  const newBal = parseFloat(document.getElementById('upd-balance')?.value);
  const note   = document.getElementById('upd-note')?.value.trim() || 'Manual update';
  const date   = document.getElementById('upd-date')?.value || today();
  if (isNaN(newBal) || newBal < 0) { toast('Enter a valid balance', 'error'); return; }

  const b = (STATE.bankAccounts||[])[i];
  if (!b) return;
  const oldBal = b.balance;
  b.balance = newBal;

  // Log history
  STATE.bankBalanceHistory = STATE.bankBalanceHistory || [];
  STATE.bankBalanceHistory.push({ accountId: b.id, balance: newBal, prevBalance: oldBal, date, note });

  saveState();
  closeModal();
  toast(`${b.bankName} balance updated to ${fmt(newBal)} ✅`, 'success');
  renderFinance();
}

// ===== SMS PARSER (multi-SMS) =====

let _smsResults = []; // parsed results for current modal session

function openSmsParser() {
  _smsResults = [];
  openModal('📲 Scan Bank SMS', `
    <div style="padding:10px 14px;border-radius:10px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);margin-bottom:14px;font-size:12px;color:var(--text2);line-height:1.6">
      Paste one or multiple bank SMS messages below.<br>
      <strong>Separate multiple SMS with a blank line.</strong> Works with HDFC, SBI, ICICI, Axis, Kotak, UPI and most Indian banks.
    </div>

    <div class="form-group" style="margin-bottom:12px">
      <label class="form-label">Paste SMS messages</label>
      <textarea id="sms-raw" class="form-input" rows="5"
        placeholder="Paste one SMS — or paste many, separated by a blank line between each message..."
        style="font-size:12px;line-height:1.6;resize:vertical"></textarea>
    </div>

    <div id="sms-status" style="display:none;font-size:12px;font-weight:600;margin-bottom:12px;padding:8px 12px;border-radius:8px"></div>

    <div class="modal-actions" style="margin-bottom:14px">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="parseAllSmsBlocks()" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">🔍 Parse All</button>
    </div>

    <!-- Results appear here after parsing -->
    <div id="sms-results-wrap" style="display:none">
      <div style="height:1px;background:var(--glass-border);margin-bottom:14px"></div>
      <p style="font-size:11px;font-weight:700;color:#00c9a7;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">✅ Detected transactions — edit if needed</p>
      <div id="sms-results-list" style="max-height:45vh;overflow-y:auto;padding-right:2px"></div>
      <div id="sms-summary" style="margin:12px 0;padding:10px 14px;border-radius:10px;background:rgba(0,201,167,0.08);border:1px solid rgba(0,201,167,0.2);font-size:13px;font-weight:600"></div>
      <button class="btn-primary" onclick="saveAllParsedSms()" style="width:100%;background:linear-gradient(135deg,#00c9a7,#0acf83);padding:12px">💾 Save All Transactions</button>
    </div>`);
}

function parseAllSmsBlocks() {
  const raw = document.getElementById('sms-raw')?.value?.trim();
  if (!raw) { toast('Paste at least one SMS first', 'error'); return; }

  // Split by one or more blank lines
  const blocks = raw.split(/\n[ \t]*\n+/).map(b => b.trim()).filter(b => b.length > 10);
  if (!blocks.length) {
    showSmsStatus('No SMS blocks found. Separate multiple SMS with a blank line between each.', 'warn');
    return;
  }

  _smsResults = [];
  let failed = 0;
  blocks.forEach((block, i) => {
    const parsed = parseBankSms(block);
    if (parsed) _smsResults.push({ ...parsed, _idx: i });
    else failed++;
  });

  if (!_smsResults.length) {
    showSmsStatus(`Could not parse any of the ${blocks.length} SMS block(s). Make sure they are bank transaction messages.`, 'warn');
    return;
  }

  renderSmsResults();

  const total = _smsResults.length + failed;
  if (failed > 0) showSmsStatus(`Parsed ${_smsResults.length} of ${total} messages. ${failed} could not be read.`, 'warn');
  else showSmsStatus(`✅ Parsed ${_smsResults.length} message${_smsResults.length > 1 ? 's' : ''} successfully`, 'ok');
}

function _makeSrCatOptions(selectedCat) {
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  return allCats.map(c => `<option value="${c.name}" ${c.name === selectedCat ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('');
}

function renderSmsResults() {
  const list = document.getElementById('sms-results-list');
  const wrap = document.getElementById('sms-results-wrap');
  if (!list || !wrap) return;

  list.innerHTML = _smsResults.map((r, i) => `
    <div id="sms-card-${i}" style="background:var(--card-bg);border:1px solid var(--glass-border);border-radius:12px;padding:12px;margin-bottom:10px;position:relative">
      <button onclick="removeSmsResult(${i})" title="Remove" style="position:absolute;top:8px;right:10px;background:rgba(239,68,68,0.12);border:none;color:#ef4444;border-radius:6px;cursor:pointer;padding:2px 9px;font-size:13px;line-height:1.6">✕</button>

      <div style="display:grid;grid-template-columns:auto 1fr 1fr;gap:8px;margin-bottom:8px;padding-right:36px">
        <select class="form-input" id="sr-type-${i}" onchange="updateSmsSummary()" style="font-size:12px;padding:4px 8px">
          <option value="expense" ${r.type === 'expense' ? 'selected' : ''}>❤️ Expense</option>
          <option value="income"  ${r.type === 'income'  ? 'selected' : ''}>💚 Income</option>
        </select>
        <input type="number" class="form-input" id="sr-amount-${i}" value="${r.amount}" step="0.01" min="0"
          oninput="updateSmsSummary()" style="font-size:13px;font-weight:700;padding:4px 8px"/>
        <input type="date" class="form-input" id="sr-date-${i}" value="${r.date}" style="font-size:12px;padding:4px 8px"/>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <select class="form-input" id="sr-cat-${i}" style="font-size:12px;padding:4px 8px">
          ${_makeSrCatOptions(r.category)}
        </select>
        <input type="text" class="form-input" id="sr-desc-${i}" value="${r.description}" placeholder="Description" style="font-size:12px;padding:4px 8px"/>
      </div>

      ${r.balance !== null ? `<div style="font-size:11px;color:var(--text3);margin-top:6px">💰 Bal after: ₹${r.balance.toLocaleString('en-IN', {minimumFractionDigits:2})}</div>` : ''}
    </div>
  `).join('');

  wrap.style.display = '';
  updateSmsSummary();
}

function removeSmsResult(i) {
  const card = document.getElementById(`sms-card-${i}`);
  if (card) card.style.display = 'none';
  updateSmsSummary();
}

function updateSmsSummary() {
  let totalExpense = 0, totalIncome = 0, count = 0;
  _smsResults.forEach((r, i) => {
    const card = document.getElementById(`sms-card-${i}`);
    if (!card || card.style.display === 'none') return;
    const type   = document.getElementById(`sr-type-${i}`)?.value;
    const amount = parseFloat(document.getElementById(`sr-amount-${i}`)?.value) || 0;
    if (type === 'expense') totalExpense += amount;
    else totalIncome += amount;
    count++;
  });

  const el = document.getElementById('sms-summary');
  if (!el) return;
  if (!count) { el.innerHTML = '<span style="color:var(--text3)">No transactions selected</span>'; return; }

  const parts = [];
  if (totalExpense > 0) parts.push(`<span style="color:#ef4444">💸 Total Expense: ₹${totalExpense.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>`);
  if (totalIncome  > 0) parts.push(`<span style="color:#10b981">💰 Total Income: ₹${totalIncome.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>`);
  el.innerHTML = `${parts.join(' &nbsp;·&nbsp; ')} &nbsp;·&nbsp; <span style="color:var(--text2)">${count} transaction${count>1?'s':''}</span>`;
}

function showSmsStatus(msg, type) {
  const el = document.getElementById('sms-status');
  if (!el) return;
  el.style.display    = '';
  el.textContent      = msg;
  el.style.background = type === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)';
  el.style.color      = type === 'ok' ? '#10b981'               : '#f59e0b';
}

function saveAllParsedSms() {
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const toSave  = [];

  _smsResults.forEach((r, i) => {
    const card = document.getElementById(`sms-card-${i}`);
    if (!card || card.style.display === 'none') return;

    const type     = document.getElementById(`sr-type-${i}`)?.value;
    const amount   = parseFloat(document.getElementById(`sr-amount-${i}`)?.value);
    const date     = document.getElementById(`sr-date-${i}`)?.value || today();
    const category = document.getElementById(`sr-cat-${i}`)?.value;
    const desc     = document.getElementById(`sr-desc-${i}`)?.value?.trim() || '';

    if (!amount || amount <= 0) return;
    const icon = allCats.find(c => c.name === category)?.icon || '💳';
    toSave.push({ id: genId(), type, amount, date, category, icon, description: desc, createdAt: new Date().toISOString() });
  });

  if (!toSave.length) { toast('No valid transactions to save', 'error'); return; }

  STATE.transactions = STATE.transactions || [];
  // Prepend newest-first (reverse so the first SMS in the list ends up first in array)
  [...toSave].reverse().forEach(tx => STATE.transactions.unshift(tx));
  saveState();

  if (typeof addXP === 'function') addXP(10 * toSave.length, `${toSave.length} SMS transaction${toSave.length>1?'s':''} logged`);
  if (typeof autoSyncGoals === 'function') autoSyncGoals();

  closeModal();
  const expTotal = toSave.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const incTotal = toSave.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  let summary = `${toSave.length} transaction${toSave.length>1?'s':''} saved!`;
  if (expTotal > 0) summary += ` Expense: ₹${expTotal.toLocaleString('en-IN',{minimumFractionDigits:2})}`;
  if (incTotal > 0) summary += ` Income: ₹${incTotal.toLocaleString('en-IN',{minimumFractionDigits:2})}`;
  toast(summary + ' 🎉', 'success');
  refreshFinancePage();
}

// ── Core SMS parsing engine ────────────────────────────────────────────────
function parseBankSms(sms) {
  const lo = sms.toLowerCase();

  // Type
  // "credit card" is a card type, not a credit transaction — strip it before checking
  const loNoCc   = lo.replace(/credit\s+card/g, 'cc');
  const isCredit = /\b(credited|received|deposited|refund|cashback|salary|added|money received)\b/.test(loNoCc) ||
                   /\bcredit\b/.test(loNoCc);
  const isDebit  = /\b(debited|debit|spent|paid|withdrawn|charged|payment of|sent|purchase)\b/.test(lo);
  if (!isCredit && !isDebit) return null;
  // Debit always wins when both signals are present ("Credit Card XX debited")
  const type = isDebit ? 'expense' : 'income';

  // Amount — try several patterns in priority order
  let amount = null;
  const amtRe = [
    /(?:inr|rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,      // INR 1,234.56
    /([\d,]+(?:\.\d{1,2})?)\s*\/-/,                     // Rs.500/-
    /([\d,]+(?:\.\d{1,2})?)\s*(?:inr|rs\.?)/i,          // 1234 Rs
    /(?:of|for|amount[:\s]+)(?:inr|rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  ];
  for (const re of amtRe) {
    const m = sms.match(re);
    if (m) { amount = parseFloat(m[1].replace(/,/g, '')); if (amount > 0) break; }
  }
  if (!amount) return null;

  // Date
  let date = today();
  const dateRe = [
    {
      re: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
      fn: ([,d,mo,y]) => {
        const yr = y.length === 2 ? '20'+y : y;
        return `${yr}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;
      }
    },
    {
      re: /(\d{1,2})[\s\-]?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[\s\-]?(\d{2,4})/i,
      fn: ([,d,mo,y]) => {
        const MONTHS = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
        const yr = y.length === 2 ? '20'+y : y;
        return `${yr}-${MONTHS[mo.toLowerCase()]}-${d.padStart(2,'0')}`;
      }
    }
  ];
  for (const { re, fn } of dateRe) {
    const m = sms.match(re);
    if (m) { try { const d = fn(m); if (d) date = d; } catch {} break; }
  }

  // Merchant / description
  let description = '';
  const mercRe = [
    /(?:to vpa|at |merchant[:\s]+|towards |for )\s*([A-Za-z0-9@._\- ]{3,40}?)(?=[,.\s](?:avl|bal|ref|utr|on\s|\d{2}[\/\-]|$))/i,
    /info[:\s]+([A-Za-z0-9@._\- ]{3,40}?)(?:[,.\s]|$)/i,
    /upi[- ]([A-Za-z0-9@._\- ]{3,40}?)(?=[,.\s]|$)/i,
    /via ([A-Za-z0-9 ]{3,30}?)(?:\s+on\s|\s+ref|[,.]|$)/i,
  ];
  for (const re of mercRe) {
    const m = sms.match(re);
    if (m?.[1]?.trim().length > 2) {
      description = m[1].trim().replace(/@\S+/g, '').replace(/\s+/g,' ').trim();
      break;
    }
  }
  if (!description) description = type === 'income' ? 'Credit received' : 'Debit transaction';

  // Available balance
  let balance = null;
  const balM = sms.match(/(?:avl\.?|available|bal\.?|balance)[^₹\d]*([\d,]+(?:\.\d{1,2})?)/i);
  if (balM) balance = parseFloat(balM[1].replace(/,/g,''));

  const category = smsCategoryGuess(lo, description.toLowerCase(), type);
  return { type, amount, date, description, category, balance };
}

function smsCategoryGuess(lo, desc, type) {
  const t = lo + ' ' + desc;
  if (type === 'income') {
    if (/salary|payroll|paycheck/.test(t))   return 'Salary';
    if (/freelance|invoice/.test(t))          return 'Freelance';
    if (/refund|cashback|reversal/.test(t))   return 'Other';
    if (/interest|dividend/.test(t))          return 'Investment';
    return 'Business';
  }
  if (/swiggy|zomato|foodpanda|restaurant|eat|dunzo|blinkit|biryani|pizza|burger|cafe|coffee/.test(t)) return 'Food';
  if (/petrol|fuel|hpcl|iocl|bpcl|hp pump/.test(t))   return 'Fuel';
  if (/uber|ola|rapido|metro|irctc|train|bus|cab|flight|airline|makemytrip|goibibo/.test(t))           return 'Transport';
  if (/amazon|flipkart|myntra|meesho|ajio|nykaa|shopping|mall/.test(t))                               return 'Shopping';
  if (/bigbasket|dmart|jiomart|grocer|vegetable|zepto|milkbasket/.test(t))                            return 'Groceries';
  if (/emi|home loan|car loan|personal loan/.test(t))                                                 return 'EMI';
  if (/insurance|lic|term plan|health plan/.test(t))                                                  return 'Insurance';
  if (/electricity|broadband|internet|jio|airtel|bsnl|vodafone|recharge|utility|wifi/.test(t))        return 'Bills';
  if (/hospital|doctor|medicine|pharmacy|apollo|medplus|diagnostic/.test(t))                          return 'Health';
  if (/netflix|hotstar|spotify|prime video|youtube premium|subscription|ott/.test(t))                 return 'Entertainment';
  if (/school|college|course|udemy|fee|education/.test(t))                                            return 'Education';
  if (/hotel|resort|airbnb|holiday|trip|tour/.test(t))                                               return 'Travel';
  if (/rent|landlord|maintenance|society fee/.test(t))                                               return 'Rent';
  if (/mutual fund|sip|zerodha|groww|stock|share|demat/.test(t))                                     return 'Investment';
  if (/gift|present/.test(t))                                                                        return 'Gifts';
  return 'Other';
}

// ===== INVESTMENTS PAGE =====
// ===== ALL ASSETS + LOANS =====

const DEFAULT_ASSET_TYPES = [
  { key: 'Mutual Fund',   icon: '📈' },
  { key: 'Stocks',        icon: '📊' },
  { key: 'SIP',           icon: '🔄' },
  { key: 'Fixed Deposit', icon: '🏛️' },
  { key: 'Gold',          icon: '🥇' },
  { key: 'Crypto',        icon: '₿'  },
  { key: 'Real Estate',   icon: '🏠' },
  { key: 'PPF / EPF',     icon: '🏢' },
  { key: 'Insurance',     icon: '🛡️' },
  { key: 'Other',         icon: '🗃️' },
];

const DEFAULT_LOAN_TYPES = [
  { key: 'Home Loan',      icon: '🏠' },
  { key: 'Car Loan',       icon: '🚗' },
  { key: 'Personal Loan',  icon: '👤' },
  { key: 'Education Loan', icon: '🎓' },
  { key: 'Gold Loan',      icon: '🥇' },
  { key: 'Business Loan',  icon: '🏢' },
  { key: 'Credit Card',    icon: '💳' },
  { key: 'Other',          icon: '📋' },
];

function getAssetTypes() {
  const custom = STATE.customAssetTypes || [];
  return [...DEFAULT_ASSET_TYPES, ...custom];
}
function getLoanTypes() {
  const custom = STATE.customLoanTypes || [];
  return [...DEFAULT_LOAN_TYPES, ...custom];
}
function assetIcon(t) { return getAssetTypes().find(x => x.key === t)?.icon || '📊'; }
function loanIcon(t)  { return getLoanTypes().find(x => x.key === t)?.icon  || '📋'; }

let invFilter = 'All';
const ASSET_CAT_COLORS = ['#6366f1','#10b981','#f59e0b','#ec4899','#8b5cf6','#3b82f6','#00c9a7','#ef4444','#f97316','#14b8a6','#a855f7','#eab308'];
const LIAB_CAT_COLORS  = ['#ef4444','#f97316','#f59e0b','#ec4899','#dc2626','#ea580c','#e11d48','#b91c1c','#c2410c','#be123c','#9f1239','#7f1d1d'];

function renderLiabCategoryChart(entries) {
  const canvas = document.getElementById('liab-category-chart');
  if (!canvas || !entries.length || typeof Chart === 'undefined') return;
  chartInstances['liab-category'] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: entries.map(([t]) => t),
      datasets: [{
        data: entries.map(([,v]) => v),
        backgroundColor: entries.map((_, i) => LIAB_CAT_COLORS[i % LIAB_CAT_COLORS.length]),
        borderColor: 'rgba(10,10,30,0.5)', borderWidth: 2
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ₹${ctx.parsed.toLocaleString('en-IN',{maximumFractionDigits:0})}` } }
      }
    }
  });
}

function renderAssetCategoryChart(entries) {
  const canvas = document.getElementById('inv-category-chart');
  if (!canvas || !entries.length || typeof Chart === 'undefined') return;
  chartInstances['inv-category'] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: entries.map(([t]) => t),
      datasets: [{
        data: entries.map(([,v]) => v),
        backgroundColor: entries.map((_, i) => ASSET_CAT_COLORS[i % ASSET_CAT_COLORS.length]),
        borderColor: 'rgba(10,10,30,0.5)', borderWidth: 2
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ₹${ctx.parsed.toLocaleString('en-IN',{maximumFractionDigits:0})}` } }
      }
    }
  });
}

function renderInvestments() {
  const investments = STATE.investments || [];
  const loans       = STATE.loans || [];

  // ── Totals ───────────────────────────────────────────────────────────
  const totalInvested  = investments.reduce((s, i) => s + (i.amount || 0), 0);
  const totalCurrent   = investments.reduce((s, i) => s + (i.currentValue ?? i.amount ?? 0), 0);
  const totalPnL       = totalCurrent - totalInvested;
  const totalROI       = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : '0.00';
  const totalLoan      = loans.reduce((s, l) => s + (l.outstanding || 0), 0);
  const netWorth       = totalCurrent - totalLoan;

  // filter tabs include 'All' + asset types
  const allAssetTypes  = [{ key: 'All', icon: '🏦' }, ...getAssetTypes()];
  const filtered       = invFilter === 'All' ? investments : investments.filter(i => i.type === invFilter);

  // ── Category allocation (current value grouped by asset type) ──────────
  const catByType = {};
  investments.forEach(i => {
    const v = i.currentValue ?? i.amount ?? 0;
    catByType[i.type] = (catByType[i.type] || 0) + v;
  });
  const catEntries = Object.entries(catByType).sort(([,a],[,b]) => b - a);

  // ── Row builder helpers ───────────────────────────────────────────────
  function moveBtn(dir, fn, id, list) {
    const idx = list.findIndex(x => x.id === id);
    const disabled = dir === 'up' ? idx === 0 : idx === list.length - 1;
    return `<button onclick="${fn}('${id}','${dir}')" style="background:none;border:none;color:${disabled?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.4)'};font-size:14px;cursor:${disabled?'default':'pointer'};padding:2px 4px;line-height:1;transition:.15s" ${disabled?'disabled':''}>${dir==='up'?'↑':'↓'}</button>`;
  }

  function invRow(inv, idx, list) {
    const curr = inv.currentValue ?? inv.amount;
    const pnl  = curr - inv.amount;
    const roi  = inv.amount > 0 ? ((pnl / inv.amount) * 100).toFixed(2) : '0.00';
    const pos  = pnl >= 0;

    // Live price badge
    const hasTicker = inv.ticker && inv.qty > 0;
    const lastUp    = inv.lastUpdated ? _timeSince(inv.lastUpdated) : null;
    const liveTag   = hasTicker
      ? `<span style="display:inline-flex;align-items:center;gap:3px;padding:1px 6px;border-radius:4px;
            font-size:9px;font-weight:700;letter-spacing:.3px;margin-left:5px;
            background:${lastUp?'rgba(16,185,129,0.12)':'rgba(100,116,139,0.1)'};
            border:1px solid ${lastUp?'rgba(16,185,129,0.3)':'rgba(100,116,139,0.2)'};
            color:${lastUp?'#10b981':'#64748b'}">
          ${lastUp ? '🟢' : '⚪'} ${inv.ticker}
        </span>` : '';
    const liveSub = hasTicker
      ? `${inv.qty} units${inv.livePrice?' · ₹'+inv.livePrice.toLocaleString('en-IN',{maximumFractionDigits:2})+'/unit':''}${lastUp?' · Updated '+lastUp:'  · Not fetched yet'}`
      : '';

    return `<tr draggable="true" data-id="${inv.id}"
        ondragstart="rowDragStart(event)" ondragover="rowDragOver(event)"
        ondrop="rowDrop(event)" ondragend="rowDragEnd(event,'inv')"
        style="border-bottom:1px solid rgba(255,255,255,0.04);transition:background .15s"
        onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background=''">
      <td style="padding:12px 16px;width:48px;text-align:center;cursor:grab" title="Drag to reorder">
        <span style="font-size:17px;color:rgba(255,255,255,0.35);line-height:1;user-select:none">⠿</span>
      </td>
      <td style="padding:12px 16px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:38px;height:38px;border-radius:10px;background:rgba(99,102,241,0.15);
              display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${assetIcon(inv.type)}</div>
          <div>
            <p style="font-weight:700;font-size:13px;display:flex;align-items:center;gap:4px;flex-wrap:wrap">
              ${inv.name}${liveTag}
            </p>
            <p style="font-size:11px;color:var(--text3)">${inv.type}${liveSub ? ' · '+liveSub : (inv.notes?' · '+inv.notes:'')}${!liveSub&&inv.notes?' · '+inv.notes:''}</p>
          </div>
        </div>
      </td>
      <td style="padding:12px 16px;text-align:right;font-size:13px;color:var(--text2)">${fmt(inv.amount)}</td>
      <td style="padding:12px 16px;text-align:right;font-size:13px;font-weight:600;color:#00c9a7">${fmt(curr)}</td>
      <td style="padding:12px 16px;text-align:right;font-size:13px;font-weight:700;color:${pos?'#10b981':'#ef4444'}">${pos?'+':''}${fmt(pnl)}</td>
      <td style="padding:12px 16px;text-align:right;font-size:13px;font-weight:700;color:${pos?'#10b981':'#ef4444'}">${pos?'+':''}${roi}%</td>
      <td style="padding:12px 16px;text-align:center;white-space:nowrap">
        <button class="btn-icon btn-sm" onclick="openEditInvModal('${inv.id}')" style="font-size:12px;margin-right:4px" title="Edit">✏️</button>
        <button class="btn-icon btn-sm" onclick="deleteInv('${inv.id}')" style="color:#ef4444;border-color:rgba(239,68,68,0.3);font-size:12px" title="Delete">✕</button>
      </td>
    </tr>`;
  }

  function loanRow(loan, idx, list) {
    const paid = (loan.principal || 0) - (loan.outstanding || 0);
    const pct  = loan.principal > 0 ? Math.min(100, Math.round((paid / loan.principal) * 100)) : 0;
    const monthlyInt = loan.outstanding > 0 && loan.interestRate > 0
      ? Math.round(loan.outstanding * (loan.interestRate / 100) / 12) : 0;
    return `<tr draggable="true" data-id="${loan.id}"
        ondragstart="rowDragStart(event)" ondragover="rowDragOver(event)"
        ondrop="rowDrop(event)" ondragend="rowDragEnd(event,'loan')"
        style="border-bottom:1px solid rgba(255,255,255,0.04);transition:background .15s" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background=''">
      <td style="padding:12px 16px;width:48px;text-align:center;cursor:grab" title="Drag to reorder">
        <span style="font-size:17px;color:rgba(255,255,255,0.35);line-height:1;user-select:none">⠿</span>
      </td>
      <td style="padding:12px 16px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:38px;height:38px;border-radius:10px;background:rgba(239,68,68,0.12);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${loanIcon(loan.type)}</div>
          <div>
            <p style="font-weight:700;font-size:13px">${loan.name}</p>
            <p style="font-size:11px;color:var(--text3)">${loan.type}${loan.lender?' · '+loan.lender:''}${loan.interestRate?' · '+loan.interestRate+'%':''}</p>
          </div>
        </div>
      </td>
      <td style="padding:12px 16px;text-align:right;font-size:13px;color:var(--text2)">${fmt(loan.principal||0)}</td>
      <td style="padding:12px 16px;text-align:right;font-size:13px;font-weight:700;color:#ef4444">${fmt(loan.outstanding||0)}</td>
      <td style="padding:12px 16px;text-align:right;font-size:13px;color:var(--text2)">${fmt(loan.emi||0)}<br><span style="font-size:10px;color:var(--text3)">EMI/mo</span></td>
      <td style="padding:12px 16px">
        <div style="min-width:80px">
          <div style="height:4px;border-radius:3px;background:rgba(255,255,255,0.1);margin-bottom:3px">
            <div style="height:4px;border-radius:3px;width:${pct}%;background:linear-gradient(90deg,#10b981,#00c9a7)"></div>
          </div>
          <span style="font-size:10px;color:var(--text3)">${pct}% paid</span>
        </div>
      </td>
      <td style="padding:12px 16px;text-align:center;white-space:nowrap">
        <button class="btn-icon btn-sm" onclick="openEditLoanModal('${loan.id}')" style="font-size:12px;margin-right:4px" title="Edit">✏️</button>
        <button class="btn-icon btn-sm" onclick="deleteLoan('${loan.id}')" style="color:#ef4444;border-color:rgba(239,68,68,0.3);font-size:12px" title="Delete">✕</button>
      </td>
    </tr>`;
  }

  // ── Render ────────────────────────────────────────────────────────────
  document.getElementById('page-container').innerHTML = `
    <div class="fade-in" style="max-width:1000px;margin:0 auto">

      <!-- Header -->
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px">
        <div><h1 class="page-title">📊 All Assets</h1><p class="page-subtitle">Investments, loans & net worth</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <button id="refresh-prices-btn" class="btn-secondary btn-sm" onclick="fetchLivePrices()"
            title="Fetch live prices for Stocks & Crypto with ticker symbols"
            style="background:rgba(16,185,129,0.1);border-color:rgba(16,185,129,0.3);color:#10b981;font-weight:700">
            🔄 Live Prices
          </button>
          <button class="btn-secondary btn-sm" onclick="openManageTypesModal('asset')">⚙️ Asset Types</button>
          <button class="btn-secondary btn-sm" onclick="openManageTypesModal('loan')">⚙️ Loan Types</button>
          <button class="btn-primary btn-sm" onclick="openAddLoanModal()" style="background:linear-gradient(135deg,#ef4444,#dc2626)">+ Add Loan</button>
          <button class="btn-primary btn-sm" onclick="openAddInvModal()">+ Add Asset</button>
        </div>
      </div>

      <!-- Net Worth Hero -->
      <div class="fin-dark-card" style="position:relative;overflow:hidden;border-radius:24px;background:linear-gradient(135deg,#1a1a4e,#0d0d2e);border:1px solid rgba(99,102,241,0.25);padding:28px;margin-bottom:20px;box-shadow:0 20px 60px rgba(0,0,0,0.4)">
        <div style="position:absolute;top:-50px;right:-50px;width:180px;height:180px;border-radius:50%;background:rgba(99,102,241,0.08)"></div>
        <div style="position:relative;display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:20px;flex-wrap:wrap" class="nw-grid">
          <div>
            <p style="font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:6px">NET WORTH 🏆</p>
            <p style="font-size:36px;font-weight:900;color:${netWorth>=0?'#00c9a7':'#ef4444'};letter-spacing:-1.5px">${fmt(netWorth)}</p>
          </div>
          <div>
            <p style="font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:6px">ASSETS 💹</p>
            <p style="font-size:24px;font-weight:900;color:#10b981">${fmt(totalCurrent)}</p>
            <p style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px">Invested ${fmt(totalInvested)}</p>
          </div>
          <div>
            <p style="font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:6px">LIABILITIES 💸</p>
            <p style="font-size:24px;font-weight:900;color:#ef4444">${fmt(totalLoan)}</p>
            <p style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px">${loans.length} active loan${loans.length!==1?'s':''}</p>
          </div>
          <div>
            <p style="font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:6px">P&L 🚀</p>
            <p style="font-size:24px;font-weight:900;color:${totalPnL>=0?'#10b981':'#ef4444'}">${totalPnL>=0?'+':''}${fmt(totalPnL)}</p>
            <p style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px">ROI ${totalROI}%</p>
          </div>
        </div>
      </div>

      <!-- ── ASSET + LIABILITY CHARTS (side by side) ───────────────── -->
      ${(investments.length === 0 && loans.length === 0) ? '' : `
      <div style="display:grid;grid-template-columns:${investments.length && loans.length ? '1fr 1fr' : '1fr'};gap:16px;margin-bottom:20px" class="alloc-charts-row">

        ${investments.length === 0 ? '' : `
        <div class="glass-card" style="padding:20px">
          <div class="section-header" style="margin-bottom:14px">
            <p class="section-title">🗂️ Asset Allocation by Category</p>
            <span style="font-size:12px;color:var(--text3)">${fmt(totalCurrent)} total</span>
          </div>
          <div style="display:grid;grid-template-columns:160px 1fr;gap:20px;align-items:center" class="asset-cat-grid">
            <div style="height:180px;position:relative"><canvas id="inv-category-chart"></canvas></div>
            <div style="display:flex;flex-direction:column;gap:8px">
              ${catEntries.map(([type,val],idx) => {
                const pct = totalCurrent > 0 ? (val/totalCurrent*100).toFixed(1) : 0;
                const color = ASSET_CAT_COLORS[idx % ASSET_CAT_COLORS.length];
                return `<div onclick="invFilter='${type}';renderInvestments()" style="display:flex;align-items:center;gap:8px;cursor:pointer" onmouseover="this.style.opacity='.75'" onmouseout="this.style.opacity='1'">
                  <span style="width:10px;height:10px;border-radius:2px;background:${color};flex-shrink:0"></span>
                  <span style="font-size:13px">${assetIcon(type)}</span>
                  <span style="font-size:12px;font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${type}</span>
                  <span style="font-size:12px;font-weight:700;color:#00c9a7">${fmt(val)}</span>
                  <span style="font-size:10px;color:var(--text3);width:40px;text-align:right">${pct}%</span>
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>`}

        ${loans.length === 0 ? '' : (() => {
          const liabByType = {};
          loans.forEach(l => { liabByType[l.type] = (liabByType[l.type] || 0) + (l.outstanding || 0); });
          const liabEntries = Object.entries(liabByType).sort(([,a],[,b]) => b - a);
          return `
        <div class="glass-card" style="padding:20px">
          <div class="section-header" style="margin-bottom:14px">
            <p class="section-title">💸 Liabilities by Category</p>
            <span style="font-size:12px;color:var(--text3)">${fmt(totalLoan)} total</span>
          </div>
          <div style="display:grid;grid-template-columns:160px 1fr;gap:20px;align-items:center" class="liab-cat-grid">
            <div style="height:180px;position:relative"><canvas id="liab-category-chart"></canvas></div>
            <div style="display:flex;flex-direction:column;gap:8px">
              ${liabEntries.map(([type,val],idx) => {
                const pct = totalLoan > 0 ? (val/totalLoan*100).toFixed(1) : 0;
                const color = LIAB_CAT_COLORS[idx % LIAB_CAT_COLORS.length];
                return `<div style="display:flex;align-items:center;gap:8px">
                  <span style="width:10px;height:10px;border-radius:2px;background:${color};flex-shrink:0"></span>
                  <span style="font-size:13px">${loanIcon(type)}</span>
                  <span style="font-size:12px;font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${type}</span>
                  <span style="font-size:12px;font-weight:700;color:#ef4444">${fmt(val)}</span>
                  <span style="font-size:10px;color:var(--text3);width:40px;text-align:right">${pct}%</span>
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>`;
        })()}

      </div>`}

      <!-- ── INVESTMENTS ─────────────────────────────────────────── -->
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <p style="font-size:16px;font-weight:800">💹 Investments & Assets</p>
          <button id="refresh-prices-btn" onclick="fetchLivePrices()"
            style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;
              border:1px solid rgba(16,185,129,0.4);background:rgba(16,185,129,0.12);
              color:#10b981;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s"
            onmouseover="this.style.background='rgba(16,185,129,0.22)'"
            onmouseout="this.style.background='rgba(16,185,129,0.12)'">
            🔄 Refresh Live Prices
          </button>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${allAssetTypes.map(t => `
            <button onclick="invFilter='${t.key}';renderInvestments()" style="padding:5px 12px;border-radius:16px;border:1px solid ${invFilter===t.key?'rgba(0,201,167,0.5)':'rgba(255,255,255,0.1)'};background:${invFilter===t.key?'rgba(0,201,167,0.15)':'transparent'};color:${invFilter===t.key?'#00c9a7':'var(--text2)'};font-size:11px;font-weight:${invFilter===t.key?700:400};cursor:pointer;transition:.15s">${t.icon} ${t.key}</button>`).join('')}
        </div>
      </div>

      <div class="glass-card" style="overflow:hidden;margin-bottom:20px">
        ${filtered.length === 0
          ? `<div class="empty-state"><span class="empty-state-icon">📈</span><p>${investments.length===0?'No assets yet. Add your first!':'Nothing in this category.'}</p></div>`
          : `<div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;min-width:700px">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.08)">
                  <th style="width:48px"></th>
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">Asset</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">Invested</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">Current</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">P&amp;L</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">ROI</th>
                  <th style="width:80px"></th>
                </tr>
              </thead>
              <tbody>${filtered.map((inv,i) => invRow(inv,i,filtered)).join('')}</tbody>
            </table>
          </div>`}
      </div>

      <!-- ── LOANS ───────────────────────────────────────────────── -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <p style="font-size:16px;font-weight:800">💸 Loans & Liabilities</p>
        <span style="font-size:12px;color:var(--text3)">${loans.length} loan${loans.length!==1?'s':''} · Total outstanding ${fmt(totalLoan)}</span>
      </div>

      <div class="glass-card" style="overflow:hidden;margin-bottom:20px">
        ${loans.length === 0
          ? `<div class="empty-state"><span class="empty-state-icon">🏦</span><p>No loans tracked. Add one to monitor your liabilities.</p></div>`
          : `<div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;min-width:720px">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.08)">
                  <th style="width:48px"></th>
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">Loan</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">Principal</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">Outstanding</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">EMI</th>
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">Progress</th>
                  <th style="width:80px"></th>
                </tr>
              </thead>
              <tbody>${loans.map((loan,i) => loanRow(loan,i,loans)).join('')}</tbody>
            </table>
          </div>`}
      </div>

    </div>`;

  // Responsive net worth grid + category charts
  const liabByType2 = {};
  loans.forEach(l => { liabByType2[l.type] = (liabByType2[l.type] || 0) + (l.outstanding || 0); });
  const liabEntries2 = Object.entries(liabByType2).sort(([,a],[,b]) => b - a);
  setTimeout(() => {
    const g = document.querySelector('.nw-grid');
    if (g && window.innerWidth < 600) g.style.gridTemplateColumns = '1fr 1fr';
    const row = document.querySelector('.alloc-charts-row');
    if (row && window.innerWidth < 700) row.style.gridTemplateColumns = '1fr';
    const ac = document.querySelector('.asset-cat-grid');
    if (ac && window.innerWidth < 480) ac.style.gridTemplateColumns = '1fr';
    const lc = document.querySelector('.liab-cat-grid');
    if (lc && window.innerWidth < 480) lc.style.gridTemplateColumns = '1fr';
    renderAssetCategoryChart(catEntries);
    renderLiabCategoryChart(liabEntries2);
  }, 40);
}

// ── Move helpers ────────────────────────────────────────────────────────────
function moveInv(id, dir) {
  const arr = STATE.investments || [];
  const i = arr.findIndex(x => x.id === id);
  const j = dir === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  STATE.investments = arr;
  saveState(); renderInvestments();
}
function moveLoan(id, dir) {
  const arr = STATE.loans || [];
  const i = arr.findIndex(x => x.id === id);
  const j = dir === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  STATE.loans = arr;
  saveState(); renderInvestments();
}

// ── Smooth drag-and-drop reordering for asset & loan tables ──────────────────
// Rows reorder live in the DOM while dragging (no full page re-render), so it
// stays buttery; we persist the new order to storage only on drop.
let _draggingTr = null;

function rowDragStart(e) {
  _draggingTr = e.currentTarget;
  try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', _draggingTr.dataset.id || ''); } catch (_) {}
  // Add the "lifted" class after the browser captures the drag image,
  // otherwise the ghost would also be faded.
  setTimeout(() => { if (_draggingTr) _draggingTr.classList.add('row-dragging'); }, 0);
}

function rowDragOver(e) {
  e.preventDefault();
  try { e.dataTransfer.dropEffect = 'move'; } catch (_) {}
  const tr = e.currentTarget;
  if (!_draggingTr || tr === _draggingTr) return;
  if (tr.parentNode !== _draggingTr.parentNode) return;   // same table only
  const rect = tr.getBoundingClientRect();
  const after = (e.clientY - rect.top) > rect.height / 2;
  tr.parentNode.insertBefore(_draggingTr, after ? tr.nextSibling : tr);
}

function rowDragEnd(e, listName) {
  if (_draggingTr) _draggingTr.classList.remove('row-dragging');
  _persistRowOrder(listName);
  _draggingTr = null;
}

// keep these for the inline ondrop attribute; the live reorder already happened
function rowDrop(e) { if (e && e.preventDefault) e.preventDefault(); }

// Read the current DOM row order and write it back into STATE (hidden/filtered
// items keep their positions; only the visible ones are reordered).
function _persistRowOrder(listName) {
  const tbody = _draggingTr ? _draggingTr.parentNode : null;
  if (!tbody) return;
  const ids = [...tbody.querySelectorAll('tr[data-id]')].map(r => r.dataset.id);
  const arr = listName === 'inv' ? (STATE.investments || []) : (STATE.loans || []);
  const byId = {}; arr.forEach(x => { byId[x.id] = x; });
  const visibleIdxs = [];
  arr.forEach((x, i) => { if (ids.indexOf(x.id) >= 0) visibleIdxs.push(i); });
  const reordered = ids.map(id => byId[id]).filter(Boolean);
  visibleIdxs.forEach((idx, k) => { if (reordered[k]) arr[idx] = reordered[k]; });
  if (listName === 'inv') STATE.investments = arr; else STATE.loans = arr;
  saveState();
}

// ── Asset CRUD ───────────────────────────────────────────────────────────────
function _invTypeOptions(sel) {
  return getAssetTypes().map(t => `<option value="${t.key}" ${t.key===sel?'selected':''}>${t.icon} ${t.key}</option>`).join('');
}

// Show/hide ticker fields when asset type changes
function toggleTickerFields(prefix) {
  const type = document.getElementById(`${prefix}-type`)?.value || '';
  const needsTicker = type === 'Stocks' || type === 'Crypto' || type === 'Gold';
  const el = document.getElementById(`${prefix}-ticker-fields`);
  if (el) el.style.display = needsTicker ? 'block' : 'none';

  // Gold-specific guidance (physical gold priced per gram)
  const isGold   = type === 'Gold';
  const tk        = document.getElementById(`${prefix}-ticker`);
  const qtyLabel  = document.getElementById(`${prefix}-qty-label`);
  const goldHint  = document.getElementById(`${prefix}-gold-hint`);
  const stdHint   = document.getElementById(`${prefix}-std-hint`);
  if (tk)       tk.placeholder      = isGold ? 'GOLD24K · GOLD22K · GOLDBEES.NS' : 'RELIANCE.NS · INFY.BO · BTC-INR';
  if (qtyLabel) qtyLabel.textContent = isGold ? 'Qty (grams / ETF units)' : 'Qty (shares / units)';
  if (goldHint) goldHint.style.display = isGold ? 'block' : 'none';
  if (stdHint)  stdHint.style.display  = isGold ? 'none'  : 'block';
}

function _tickerFieldsHtml(prefix, ticker = '', qty = '') {
  return `
    <div id="${prefix}-ticker-fields" style="display:none">
      <div class="input-row">
        <div class="form-group">
          <label class="form-label">Ticker Symbol
            <a href="https://finance.yahoo.com/lookup" target="_blank"
              style="font-size:10px;color:var(--teal);margin-left:6px;text-decoration:none">lookup ↗</a>
          </label>
          <input type="text" id="${prefix}-ticker" class="form-input"
            value="${ticker}" placeholder="RELIANCE.NS · INFY.BO · BTC-INR"
            style="text-transform:uppercase" oninput="this.value=this.value.toUpperCase()"/>
        </div>
        <div class="form-group">
          <label class="form-label" id="${prefix}-qty-label">Qty (shares / units)</label>
          <input type="number" id="${prefix}-qty" class="form-input"
            value="${qty}" placeholder="10" min="0" step="any"/>
        </div>
      </div>
      <div id="${prefix}-std-hint" style="background:rgba(0,201,167,0.07);border:1px solid rgba(0,201,167,0.2);
          border-radius:8px;padding:8px 12px;margin-bottom:4px">
        <p style="font-size:11px;color:#00c9a7;margin:0">
          💡 NSE → <b>SYMBOL.NS</b> &nbsp;|&nbsp; BSE → <b>SYMBOL.BO</b> &nbsp;|&nbsp; Crypto → <b>BTC-INR</b> &nbsp;|&nbsp;
          After saving, hit <b>🔄 Live Prices</b> on the page to auto-fetch.
        </p>
      </div>
      <div id="${prefix}-gold-hint" style="display:none;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);
          border-radius:8px;padding:8px 12px;margin-bottom:4px">
        <p style="font-size:11px;color:#f59e0b;margin:0;line-height:1.7">
          🥇 Physical gold → ticker <b>GOLD24K</b> or <b>GOLD22K</b>, Qty = <b>grams</b> (fetches live ₹/gram).<br>
          Gold ETF → <b>GOLDBEES.NS</b>, Qty = units held. Then hit <b>🔄 Live Prices</b>.
        </p>
      </div>
    </div>`;
}

function openAddInvModal() {
  openModal('➕ Add Asset', `
    <div class="form-group"><label class="form-label">Name</label>
      <input type="text" id="inv-name" class="form-input" placeholder="e.g. Infosys shares, Axis FD, Gold 10g"/></div>
    <div class="form-group"><label class="form-label">Asset Type</label>
      <select id="inv-type" class="form-input" onchange="toggleTickerFields('inv')">${_invTypeOptions('')}</select></div>

    ${_tickerFieldsHtml('inv')}

    <div class="input-row">
      <div class="form-group"><label class="form-label">Invested Amount (₹)</label>
        <input type="number" id="inv-amount" class="form-input" placeholder="0"/></div>
      <div class="form-group"><label class="form-label">Current Value (₹)</label>
        <input type="number" id="inv-current" class="form-input" placeholder="auto from ticker or enter manually"/></div>
    </div>
    <div class="form-group"><label class="form-label">Notes (optional)</label>
      <input type="text" id="inv-notes" class="form-input" placeholder="e.g. pledged, maturity date…"/></div>
    <div class="form-group"><label class="form-label">Start Date</label>
      <input type="date" id="inv-date" class="form-input" value="${today()}"/></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveInv()">Save Asset</button>
    </div>`);
}

function saveInv() {
  const name    = document.getElementById('inv-name').value.trim();
  const type    = document.getElementById('inv-type').value;
  const amount  = parseFloat(document.getElementById('inv-amount').value);
  const current = parseFloat(document.getElementById('inv-current').value) || amount;
  const notes   = document.getElementById('inv-notes').value.trim();
  const date    = document.getElementById('inv-date').value;
  const ticker  = (document.getElementById('inv-ticker')?.value || '').trim().toUpperCase();
  const qty     = parseFloat(document.getElementById('inv-qty')?.value) || 0;
  if (!name || !amount) { toast('Enter name and amount', 'error'); return; }
  STATE.investments = STATE.investments || [];
  const inv = { id: genId(), name, type, amount, currentValue: current, notes, date: date || today() };
  if (ticker) { inv.ticker = ticker; inv.qty = qty; }
  STATE.investments.push(inv);
  saveState(); addXP(25, 'Asset added'); closeModal();
  toast('Asset tracked! +25 XP', 'success'); renderInvestments();
}

function openEditInvModal(id) {
  const inv = (STATE.investments || []).find(i => i.id === id);
  if (!inv) return;
  const hasTicker = inv.type === 'Stocks' || inv.type === 'Crypto' || inv.type === 'Gold';
  openModal('✏️ Edit Asset', `
    <div class="form-group"><label class="form-label">Name</label>
      <input type="text" id="einv-name" class="form-input" value="${inv.name}"/></div>
    <div class="form-group"><label class="form-label">Asset Type</label>
      <select id="einv-type" class="form-input" onchange="toggleTickerFields('einv')">${_invTypeOptions(inv.type)}</select></div>

    ${_tickerFieldsHtml('einv', inv.ticker || '', inv.qty || '')}

    <div class="input-row">
      <div class="form-group"><label class="form-label">Invested Amount (₹)</label>
        <input type="number" id="einv-amount" class="form-input" value="${inv.amount}"/></div>
      <div class="form-group"><label class="form-label">Current Value (₹)</label>
        <input type="number" id="einv-current" class="form-input" value="${inv.currentValue ?? inv.amount}"/></div>
    </div>
    <div class="form-group"><label class="form-label">Notes</label>
      <input type="text" id="einv-notes" class="form-input" value="${inv.notes||''}"/></div>
    <div class="form-group"><label class="form-label">Date</label>
      <input type="date" id="einv-date" class="form-input" value="${inv.date||today()}"/></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveEditInv('${id}')">💾 Save Changes</button>
    </div>`);
  // Show ticker fields if needed
  if (hasTicker) setTimeout(() => toggleTickerFields('einv'), 30);
}

function saveEditInv(id) {
  const inv = (STATE.investments || []).find(i => i.id === id);
  if (!inv) return;
  const name   = document.getElementById('einv-name').value.trim();
  const amount = parseFloat(document.getElementById('einv-amount').value);
  if (!name || !amount) { toast('Enter name and amount', 'error'); return; }
  const ticker = (document.getElementById('einv-ticker')?.value || '').trim().toUpperCase();
  const qty    = parseFloat(document.getElementById('einv-qty')?.value) || 0;
  inv.name         = name;
  inv.type         = document.getElementById('einv-type').value;
  inv.amount       = amount;
  inv.currentValue = parseFloat(document.getElementById('einv-current').value) || amount;
  inv.notes        = document.getElementById('einv-notes').value.trim();
  inv.date         = document.getElementById('einv-date').value || today();
  if (ticker) { inv.ticker = ticker; inv.qty = qty; }
  else { delete inv.ticker; delete inv.qty; }
  saveState(); closeModal(); toast('Asset updated ✅', 'success'); renderInvestments();
}

// ── Live Price Fetch ──────────────────────────────────────────────────────────
function _timeSince(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

async function _fetchYahooPrice(ticker) {
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(proxyUrl, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (!price) throw new Error('No price');
    return price;
  } finally { clearTimeout(timer); }
}

const GRAMS_PER_TROY_OZ = 31.1035;

// Live gold price in INR per gram (24K / 999 purity).
// Tries XAUINR (gold/INR per ounce) directly, falls back to gold-USD × USD-INR.
async function _fetchGoldPerGramInr() {
  try {
    const perOz = await _fetchYahooPrice('XAUINR=X');
    if (perOz > 0) return perOz / GRAMS_PER_TROY_OZ;
  } catch (e) { /* fall through to computed rate */ }
  const usdPerOz = await _fetchYahooPrice('GC=F');   // gold futures, USD/oz
  const usdInr   = await _fetchYahooPrice('INR=X');  // USD → INR
  return (usdPerOz * usdInr) / GRAMS_PER_TROY_OZ;
}

async function _fetchTickerPrice(ticker) {
  const t = (ticker || '').toUpperCase();
  // Physical gold pseudo-tickers — return INR per gram
  if (t === 'GOLD' || t === 'GOLD24K' || t === 'GOLD999') {
    return Math.round((await _fetchGoldPerGramInr()) * 100) / 100;
  }
  if (t === 'GOLD22K' || t === 'GOLD916') {
    return Math.round((await _fetchGoldPerGramInr()) * 0.9167 * 100) / 100;
  }
  // Everything else → standard Yahoo symbol (stocks, crypto, ETFs incl. GOLDBEES.NS)
  return _fetchYahooPrice(ticker);
}

async function fetchLivePrices() {
  const tickerInvs = (STATE.investments || []).filter(i => i.ticker && i.qty > 0);
  if (!tickerInvs.length) {
    toast('Add Ticker + Qty to your Stocks / Crypto / Gold first, then refresh.', 'info'); return;
  }
  const btn = document.getElementById('refresh-prices-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Fetching…'; }
  let ok = 0, fail = 0;
  for (const inv of tickerInvs) {
    try {
      const price = await _fetchTickerPrice(inv.ticker);
      inv.livePrice    = price;
      inv.currentValue = Math.round(price * inv.qty * 100) / 100;
      inv.lastUpdated  = new Date().toISOString();
      ok++;
    } catch (e) { console.warn(`[LivePrice] ${inv.ticker}:`, e.message); fail++; }
  }
  saveState();
  if (ok)   toast(`✅ ${ok} holding${ok>1?'s':''} updated with live prices!`, 'success');
  if (fail) toast(`⚠️ ${fail} ticker${fail>1?'s':''} failed — check symbols (e.g. RELIANCE.NS, BTC-INR)`, 'warning');
  if (typeof softRefresh === 'function') softRefresh(); else renderInvestments();
}

function deleteInv(id) {
  STATE.investments = (STATE.investments || []).filter(i => i.id !== id);
  saveState(); toast('Asset deleted', 'info'); renderInvestments();
}

// ── Loan CRUD ────────────────────────────────────────────────────────────────
function _loanTypeOptions(sel) {
  return getLoanTypes().map(t => `<option value="${t.key}" ${t.key===sel?'selected':''}>${t.icon} ${t.key}</option>`).join('');
}

function _loanFormHTML(l) {
  // l = existing loan object for edit, or null for add
  const v = (id, def='') => l ? (l[id] ?? def) : def;
  return `
    <div class="form-group"><label class="form-label">Loan Name</label>
      <input type="text" id="ln-name" class="form-input" value="${v('name')}" placeholder="e.g. SBI Home Loan, HDFC Car Loan"/></div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Loan Type</label>
        <select id="ln-type" class="form-input">${_loanTypeOptions(v('type'))}</select></div>
      <div class="form-group"><label class="form-label">Lender</label>
        <input type="text" id="ln-lender" class="form-input" value="${v('lender')}" placeholder="e.g. SBI, HDFC, Bajaj…"/></div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Principal Amount (₹)</label>
        <input type="number" id="ln-principal" class="form-input" value="${v('principal')}" placeholder="Original loan amount"/></div>
      <div class="form-group"><label class="form-label">Outstanding (₹)</label>
        <input type="number" id="ln-outstanding" class="form-input" value="${v('outstanding')}" placeholder="Remaining balance"/></div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">EMI / Month (₹)</label>
        <input type="number" id="ln-emi" class="form-input" value="${v('emi')}" placeholder="Monthly EMI"/></div>
      <div class="form-group"><label class="form-label">Interest Rate (%)</label>
        <input type="number" id="ln-rate" class="form-input" value="${v('interestRate')}" placeholder="e.g. 8.5" step="0.01"/></div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">EMI Date (day of month)</label>
        <input type="number" id="ln-emidate" class="form-input" value="${v('emiDate')}" placeholder="e.g. 5" min="1" max="31"/></div>
      <div class="form-group"><label class="form-label">Tenure (months)</label>
        <input type="number" id="ln-tenure" class="form-input" value="${v('tenure')}" placeholder="e.g. 240"/></div>
    </div>
    <div class="form-group"><label class="form-label">Start Date</label>
      <input type="date" id="ln-date" class="form-input" value="${v('startDate', today())}"/></div>
    <div class="form-group"><label class="form-label">Notes (optional)</label>
      <input type="text" id="ln-notes" class="form-input" value="${v('notes')}" placeholder="e.g. property address, co-applicant…"/></div>`;
}

function _loanFormValues() {
  return {
    name:        document.getElementById('ln-name').value.trim(),
    type:        document.getElementById('ln-type').value,
    lender:      document.getElementById('ln-lender').value.trim(),
    principal:   parseFloat(document.getElementById('ln-principal').value) || 0,
    outstanding: parseFloat(document.getElementById('ln-outstanding').value) || 0,
    emi:         parseFloat(document.getElementById('ln-emi').value) || 0,
    interestRate:parseFloat(document.getElementById('ln-rate').value) || 0,
    emiDate:     parseInt(document.getElementById('ln-emidate').value) || 0,
    tenure:      parseInt(document.getElementById('ln-tenure').value) || 0,
    startDate:   document.getElementById('ln-date').value || today(),
    notes:       document.getElementById('ln-notes').value.trim(),
  };
}

function openAddLoanModal() {
  openModal('➕ Add Loan', `
    ${_loanFormHTML(null)}
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveLoan()" style="background:linear-gradient(135deg,#ef4444,#dc2626)">Save Loan</button>
    </div>`);
}

function saveLoan() {
  const v = _loanFormValues();
  if (!v.name) { toast('Enter a loan name', 'error'); return; }
  if (!v.principal && !v.outstanding) { toast('Enter principal or outstanding amount', 'error'); return; }
  if (!v.outstanding) v.outstanding = v.principal;
  STATE.loans = STATE.loans || [];
  STATE.loans.push({ id: genId(), ...v });
  saveState(); closeModal(); toast('Loan added ✅', 'success'); renderInvestments();
}

function openEditLoanModal(id) {
  const loan = (STATE.loans || []).find(l => l.id === id);
  if (!loan) return;
  openModal('✏️ Edit Loan', `
    ${_loanFormHTML(loan)}
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveEditLoan('${id}')" style="background:linear-gradient(135deg,#ef4444,#dc2626)">💾 Save Changes</button>
    </div>`);
}

function saveEditLoan(id) {
  const loan = (STATE.loans || []).find(l => l.id === id);
  if (!loan) return;
  const v = _loanFormValues();
  if (!v.name) { toast('Enter a loan name', 'error'); return; }
  Object.assign(loan, v);
  saveState(); closeModal(); toast('Loan updated ✅', 'success'); renderInvestments();
}

function deleteLoan(id) {
  STATE.loans = (STATE.loans || []).filter(l => l.id !== id);
  saveState(); toast('Loan deleted', 'info'); renderInvestments();
}

// ── Custom Type Manager ─────────────────────────────────────────────────────
function openManageTypesModal(kind) {
  const isAsset = kind === 'asset';
  const stateKey = isAsset ? 'customAssetTypes' : 'customLoanTypes';
  const customs  = STATE[stateKey] || [];
  const defaults = isAsset ? DEFAULT_ASSET_TYPES : DEFAULT_LOAN_TYPES;
  const title    = isAsset ? '⚙️ Asset Types' : '⚙️ Loan Types';

  const renderList = () => {
    const customs = STATE[stateKey] || [];
    const el = document.getElementById('ctype-list');
    if (!el) return;
    el.innerHTML = customs.length === 0
      ? `<p style="font-size:12px;color:var(--text3);text-align:center;padding:12px">No custom types yet</p>`
      : customs.map((t, i) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:8px;background:rgba(255,255,255,0.05);margin-bottom:6px">
          <span style="font-size:14px">${t.icon} <span style="font-size:13px;font-weight:600;margin-left:6px">${t.key}</span></span>
          <button onclick="removeCustomType('${kind}',${i})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px;padding:2px 6px">✕</button>
        </div>`).join('');
  };

  openModal(title, `
    <p style="font-size:12px;color:var(--text3);margin-bottom:14px">Default types cannot be removed. Add your own below.</p>

    <div style="margin-bottom:14px">
      <p style="font-size:11px;font-weight:700;color:var(--text3);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Built-in</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${defaults.map(t=>`<span style="padding:4px 10px;border-radius:16px;background:rgba(255,255,255,0.06);font-size:12px">${t.icon} ${t.key}</span>`).join('')}
      </div>
    </div>

    <div style="margin-bottom:14px">
      <p style="font-size:11px;font-weight:700;color:var(--text3);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Custom</p>
      <div id="ctype-list"></div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:6px">
      <input type="text" id="ctype-icon" class="form-input" placeholder="Emoji" style="width:70px;text-align:center;font-size:18px"/>
      <input type="text" id="ctype-name" class="form-input" placeholder="Type name (e.g. NPS, Chit Fund…)" style="flex:1"/>
      <button class="btn-primary btn-sm" onclick="addCustomType('${kind}')">+ Add</button>
    </div>

    <div class="modal-actions" style="margin-top:14px">
      <button class="btn-primary" onclick="closeModal()">Done</button>
    </div>`);

  renderList();
  // expose renderList so addCustomType/removeCustomType can refresh the list
  window._ctypeRenderList = renderList;
  window._ctypeStateKey   = stateKey;
}

function addCustomType(kind) {
  const icon = document.getElementById('ctype-icon')?.value.trim() || '📌';
  const name = document.getElementById('ctype-name')?.value.trim();
  if (!name) { toast('Enter a type name', 'error'); return; }
  const stateKey = kind === 'asset' ? 'customAssetTypes' : 'customLoanTypes';
  STATE[stateKey] = STATE[stateKey] || [];
  if (STATE[stateKey].find(t => t.key === name)) { toast('Type already exists', 'warning'); return; }
  STATE[stateKey].push({ key: name, icon });
  saveState();
  document.getElementById('ctype-icon').value = '';
  document.getElementById('ctype-name').value = '';
  if (window._ctypeRenderList) window._ctypeRenderList();
  toast(`"${name}" added`, 'success');
}

function removeCustomType(kind, idx) {
  const stateKey = kind === 'asset' ? 'customAssetTypes' : 'customLoanTypes';
  STATE[stateKey] = (STATE[stateKey] || []).filter((_, i) => i !== idx);
  saveState();
  if (window._ctypeRenderList) window._ctypeRenderList();
}


// ===== BUDGET PAGE =====
let _budgetPeriod = 'month';
function setBudgetPeriod(p) { _budgetPeriod = p; renderBudget(); }

// Convert stored budget to the limit for a given view period
function getBudgetLimit(b, viewPeriod) {
  const period = b.period || 'month';
  const amount = b.amount != null ? b.amount : (b.limit || 0);
  const daily = period === 'day' ? amount : period === 'month' ? amount / 30 : amount / 365;
  if (viewPeriod === 'day')   return Math.round(daily);
  if (viewPeriod === 'week')  return Math.round(daily * 7);
  if (viewPeriod === 'month') return Math.round(daily * 30);
  if (viewPeriod === 'year')  return Math.round(daily * 365);
  return Math.round(daily * 365); // 'all' → yearly equivalent
}

function selectBudgetPeriod(p) {
  const el = document.getElementById('b-period');
  if (el) el.value = p;
  ['day','month','year'].forEach(x => {
    const btn = document.getElementById('bp-' + x);
    if (btn) btn.classList.toggle('active', x === p);
  });
}

function renderBudget() {
  const budgets = STATE.budgets || [];
  const txns = STATE.transactions || [];
  const filteredTxns = filterTxByPeriod(txns, _budgetPeriod).filter(t => t.type === 'expense');

  // Compute per-budget totals
  const budgetRows = budgets.map((b, bi) => {
    const limit = getBudgetLimit(b, _budgetPeriod);
    const spent = filteredTxns.filter(t => t.category?.trim().toLowerCase() === b.category?.trim().toLowerCase()).reduce((s,t) => s+t.amount, 0);
    return { b, bi, limit, spent };
  });
  const totalLimit = budgetRows.reduce((s, r) => s + r.limit, 0);
  const totalSpent = budgetRows.reduce((s, r) => s + r.spent, 0);
  const totalRemaining = totalLimit - totalSpent;
  const totalPct = totalLimit > 0 ? Math.min(100, (totalSpent / totalLimit) * 100) : 0;
  const BUDGET_COLORS = ['#6366f1','#10b981','#f59e0b','#ec4899','#8b5cf6','#3b82f6','#00c9a7','#ef4444','#f97316','#14b8a6','#a855f7','#eab308'];

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div>
          <h1 class="page-title">🎯 Budget Planner</h1>
          <p class="page-subtitle">${periodLabel(_budgetPeriod)} spending vs budget limits</p>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          ${periodTabsHtml(_budgetPeriod, 'setBudgetPeriod')}
          <button class="btn-primary btn-sm" onclick="openAddBudgetModal(-1)">+ Add Budget</button>
        </div>
      </div>

      ${budgets.length === 0 ? `<div class="glass-card" style="padding:40px"><div class="empty-state"><span class="empty-state-icon">🎯</span><p>Set budgets for your expense categories to track spending.</p></div></div>` : `

      <!-- ── BUDGET SUMMARY + CHART ─────────────────────────────────── -->
      <div class="glass-card" style="padding:22px;margin-bottom:20px">
        <div class="section-header" style="margin-bottom:18px">
          <p class="section-title">📊 Total Budget Overview</p>
          <span style="font-size:12px;color:var(--text3)">${periodLabel(_budgetPeriod)}</span>
        </div>
        <div style="display:grid;grid-template-columns:200px 1fr;gap:28px;align-items:center" class="budget-overview-grid">

          <!-- Doughnut -->
          <div style="position:relative;height:190px">
            <canvas id="budget-donut-chart"></canvas>
            <div class="budget-donut-center" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none">
              <span style="font-size:13px;font-weight:900;color:var(--text1)">${fmt(totalLimit)}</span>
              <span style="font-size:10px;color:var(--text3);margin-top:2px">total budget</span>
            </div>
          </div>

          <!-- Right side: stat chips + per-category legend -->
          <div>
            <!-- 3 stat chips -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
              <div style="padding:12px;border-radius:12px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);text-align:center">
                <p style="font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#6366f1;margin-bottom:4px">Total Budget</p>
                <p style="font-size:17px;font-weight:900;color:#6366f1">${fmt(totalLimit)}</p>
              </div>
              <div style="padding:12px;border-radius:12px;background:rgba(${totalSpent>totalLimit?'239,68,68':'16,185,129'},0.1);border:1px solid rgba(${totalSpent>totalLimit?'239,68,68':'16,185,129'},0.2);text-align:center">
                <p style="font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:${totalSpent>totalLimit?'#ef4444':'#10b981'};margin-bottom:4px">Total Spent</p>
                <p style="font-size:17px;font-weight:900;color:${totalSpent>totalLimit?'#ef4444':'#10b981'}">${fmt(totalSpent)}</p>
              </div>
              <div style="padding:12px;border-radius:12px;background:rgba(${totalRemaining<0?'239,68,68':'245,158,11'},0.1);border:1px solid rgba(${totalRemaining<0?'239,68,68':'245,158,11'},0.2);text-align:center">
                <p style="font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:${totalRemaining<0?'#ef4444':'#f59e0b'};margin-bottom:4px">${totalRemaining<0?'Over Budget':'Remaining'}</p>
                <p style="font-size:17px;font-weight:900;color:${totalRemaining<0?'#ef4444':'#f59e0b'}">${fmt(Math.abs(totalRemaining))}</p>
              </div>
            </div>

            <!-- Overall progress bar -->
            <div style="margin-bottom:14px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
                <span style="font-size:11px;color:var(--text3)">Overall usage</span>
                <span style="font-size:11px;font-weight:700;color:${totalPct>=100?'#ef4444':totalPct>80?'#f59e0b':'#10b981'}">${totalPct.toFixed(1)}%</span>
              </div>
              <div style="height:8px;border-radius:4px;background:rgba(255,255,255,0.08);overflow:hidden">
                <div style="height:100%;border-radius:4px;width:${totalPct}%;background:${totalPct>=100?'#ef4444':totalPct>80?'#f59e0b':'#10b981'};transition:width .4s"></div>
              </div>
            </div>

            <!-- Per-category legend rows -->
            <div style="display:flex;flex-direction:column;gap:7px">
              ${budgetRows.map(({b, limit, spent}, idx) => {
                const cat = CATEGORIES.find(c => c.name === b.category);
                const pct = limit > 0 ? Math.min(100, (spent/limit)*100) : 0;
                const color = BUDGET_COLORS[idx % BUDGET_COLORS.length];
                const over = spent > limit;
                return `<div style="display:flex;align-items:center;gap:8px">
                  <span style="width:10px;height:10px;border-radius:2px;background:${color};flex-shrink:0"></span>
                  <span style="font-size:13px">${cat?.icon||'📦'}</span>
                  <span style="font-size:12px;font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b.category}</span>
                  <span style="font-size:11px;color:${over?'#ef4444':'var(--text3)'};font-weight:${over?700:400}">${fmt(spent)}<span style="color:var(--text3);font-weight:400"> / ${fmt(limit)}</span></span>
                  <span style="font-size:10px;width:36px;text-align:right;color:${over?'#ef4444':pct>80?'#f59e0b':'#10b981'};font-weight:700">${pct.toFixed(0)}%</span>
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- ── CATEGORY CARDS ──────────────────────────────────────────── -->
      <div style="display:flex;flex-direction:column;gap:12px">
        ${budgetRows.map(({b, bi, limit, spent}) => {
            const pct    = Math.min(100, limit > 0 ? (spent / limit) * 100 : 0);
            const over   = spent > limit;
            const cat    = CATEGORIES.find(c => c.name === b.category);
            const bPeriod = b.period || 'month';
            const bAmount = b.amount != null ? b.amount : (b.limit || 0);
            const bDaily  = bPeriod === 'day' ? bAmount : bPeriod === 'month' ? bAmount / 30 : bAmount / 365;
            const breakdown = `${fmt(Math.round(bDaily))}/day · ${fmt(Math.round(bDaily*30))}/mo · ${fmt(Math.round(bDaily*365))}/yr`;
            return `<div class="glass-card" style="padding:18px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <div style="display:flex;align-items:center;gap:10px">
                  <span style="font-size:22px">${cat?.icon||'📦'}</span>
                  <div>
                    <div style="font-weight:600;font-size:14px">${b.category}</div>
                    <div style="font-size:11px;color:var(--text3)">Set: ${fmt(bAmount)}/${bPeriod}</div>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-size:13px;color:${over?'#ef4444':'#10b981'};font-weight:700">${fmt(spent)} / ${fmt(limit)}</span>
                  ${over ? '<span class="tag tag-red" style="font-size:11px">Over!</span>' : ''}
                  <button onclick="openAddBudgetModal(${bi})" style="background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);color:#6366f1;border-radius:8px;padding:4px 9px;cursor:pointer;font-size:12px">✏️</button>
                  <button onclick="deleteBudget(${bi})" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#ef4444;border-radius:8px;padding:4px 9px;cursor:pointer;font-size:12px">✕</button>
                </div>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${over?'#ef4444':pct>80?'#f59e0b':'#10b981'}"></div></div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
                <p style="font-size:11px;color:var(--text3)">${over ? `₹${(spent-limit).toLocaleString('en-IN')} over budget` : `₹${(limit-spent).toLocaleString('en-IN')} remaining · ${pct.toFixed(0)}% used`}</p>
                <p style="font-size:10px;color:var(--text3);opacity:0.7">₹${breakdown}</p>
              </div>
              ${b.notes ? `<p style="font-size:11px;color:var(--text2);margin-top:8px;padding:8px 10px;background:rgba(255,255,255,0.04);border-left:3px solid rgba(99,102,241,0.5);border-radius:6px">📝 ${String(b.notes).replace(/</g,'&lt;')}</p>` : ''}
            </div>`;
        }).join('')}
      </div>
      `}
    </div>`;

  // Render doughnut chart after DOM is ready
  if (budgets.length > 0) {
    setTimeout(() => {
      const bg = document.querySelector('.budget-overview-grid');
      if (bg && window.innerWidth < 640) bg.style.gridTemplateColumns = '1fr';
      const canvas = document.getElementById('budget-donut-chart');
      if (!canvas || typeof Chart === 'undefined') return;
      if (chartInstances['budget-donut']) { chartInstances['budget-donut'].destroy(); delete chartInstances['budget-donut']; }
      const isLight = document.body.classList.contains('light');
      chartInstances['budget-donut'] = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: budgetRows.map(r => r.b.category),
          datasets: [{
            data: budgetRows.map(r => r.limit),
            backgroundColor: budgetRows.map((_, i) => BUDGET_COLORS[i % BUDGET_COLORS.length]),
            borderColor: 'rgba(10,10,30,0.5)',
            borderWidth: 2,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '62%',
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmt(ctx.parsed)} (${totalLimit>0?(ctx.parsed/totalLimit*100).toFixed(1):0}%)` } }
          }
        }
      });
    }, 40);
  }
}

function deleteBudget(index) {
  STATE.budgets = (STATE.budgets||[]).filter((_,i) => i !== index);
  saveState();
  toast('Budget removed', 'info');
  renderBudget();
}

function openAddBudgetModal(editIndex) {
  const isEdit  = editIndex >= 0;
  const b       = isEdit ? (STATE.budgets||[])[editIndex] : null;
  const ePeriod = b ? (b.period || 'month') : 'month';
  const eAmount = b ? (b.amount != null ? b.amount : (b.limit || '')) : '';
  const catOptions = CATEGORIES
    .filter(c => !['Salary','Business','Freelance'].includes(c.name))
    .map(c => `<option value="${c.name}"${b?.category===c.name?' selected':''}>${c.icon} ${c.name}</option>`)
    .join('');

  openModal(isEdit ? `Edit Budget — ${b.category}` : 'Set Budget', `
    <div class="form-group">
      <label class="form-label">Category</label>
      <select id="b-cat" class="form-input"${isEdit?' disabled':''}>${catOptions}</select>
    </div>
    <div class="form-group">
      <label class="form-label">Budget Period</label>
      <div class="period-tabs" style="width:100%">
        <button class="period-tab${ePeriod==='day'?' active':''}" id="bp-day"   onclick="selectBudgetPeriod('day')">Day</button>
        <button class="period-tab${ePeriod==='month'?' active':''}" id="bp-month" onclick="selectBudgetPeriod('month')">Month</button>
        <button class="period-tab${ePeriod==='year'?' active':''}" id="bp-year"  onclick="selectBudgetPeriod('year')">Year</button>
      </div>
      <input type="hidden" id="b-period" value="${ePeriod}">
    </div>
    <div class="form-group">
      <label class="form-label">Budget Limit (₹)</label>
      <input type="number" id="b-limit" class="form-input" placeholder="e.g. 5000" value="${eAmount}"/>
      <p style="font-size:11px;color:var(--text3);margin-top:6px">Auto-splits to daily / monthly / yearly when viewing other periods.</p>
    </div>
    <div class="form-group">
      <label class="form-label">📝 Notes (optional)</label>
      <textarea id="b-notes" class="form-input" rows="2" placeholder="e.g. Includes weekend dining, festival months higher…">${b?.notes ? String(b.notes).replace(/</g,'&lt;') : ''}</textarea>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveBudget(${isEdit ? editIndex : -1})">${isEdit ? 'Update' : 'Save Budget'}</button>
    </div>`);
}

function saveBudget(editIndex) {
  const category = document.getElementById('b-cat').value;
  const amount   = parseFloat(document.getElementById('b-limit').value);
  const period   = document.getElementById('b-period').value || 'month';
  const notes    = (document.getElementById('b-notes')?.value || '').trim();
  if (!amount || amount <= 0) { toast('Enter a valid limit', 'error'); return; }
  STATE.budgets = STATE.budgets || [];
  if (editIndex >= 0) {
    STATE.budgets[editIndex] = { ...STATE.budgets[editIndex], amount, period, notes };
  } else {
    const existing = STATE.budgets.findIndex(b => b.category === category);
    if (existing >= 0) STATE.budgets[existing] = { ...STATE.budgets[existing], amount, period, notes };
    else STATE.budgets.push({ id: genId(), category, amount, period, notes });
  }
  saveState(); closeModal(); toast(editIndex >= 0 ? 'Budget updated!' : 'Budget set!', 'success'); renderBudget();
}

// ===== CREDIT CARDS =====
const CARD_PRESETS = [
  { label:'HDFC',         color:'#1a237e', color2:'#0d47a1', network:'VISA'       },
  { label:'SBI',          color:'#1b5e20', color2:'#0d3311', network:'RuPay'      },
  { label:'ICICI',        color:'#bf360c', color2:'#7f1b07', network:'VISA'       },
  { label:'Axis',         color:'#4a148c', color2:'#2d0066', network:'VISA'       },
  { label:'Kotak',        color:'#b71c1c', color2:'#7f1212', network:'Mastercard' },
  { label:'Yes Bank',     color:'#004d40', color2:'#00251a', network:'VISA'       },
  { label:'IndusInd',     color:'#e65100', color2:'#bf360c', network:'Mastercard' },
  { label:'AMEX',         color:'#006064', color2:'#00363a', network:'AmEx'       },
  { label:'Citi',         color:'#0d47a1', color2:'#072b6d', network:'Mastercard' },
  { label:'AU Bank',      color:'#33691e', color2:'#1b5e20', network:'VISA'       },
  { label:'Other',        color:'#263238', color2:'#102027', network:'VISA'       },
];

function addCreditCard() {
  const opts = CARD_PRESETS.map(p => `<option value="${p.label}">${p.label}</option>`).join('');
  openModal('Add Credit Card', `
    <div class="input-row">
      <div class="form-group"><label class="form-label">Bank / Card Name</label>
        <select id="cc-bank" class="form-input">${opts}<option value="custom">✏️ Custom</option></select></div>
      <div class="form-group"><label class="form-label">Network</label>
        <select id="cc-network" class="form-input">
          <option>VISA</option><option>Mastercard</option><option>RuPay</option><option>AmEx</option>
        </select></div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Credit Limit (₹)</label>
        <input type="number" id="cc-limit" class="form-input" placeholder="e.g. 100000" min="0"/></div>
      <div class="form-group"><label class="form-label">Outstanding (₹)</label>
        <input type="number" id="cc-outstanding" class="form-input" placeholder="0" min="0"/></div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Last 4 Digits (optional)</label>
        <input type="text" id="cc-last4" class="form-input" maxlength="4" placeholder="XXXX"/></div>
      <div class="form-group"><label class="form-label">Due Date (optional)</label>
        <input type="date" id="cc-due" class="form-input"/></div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveCreditCard(null)">Save Card</button>
    </div>`);
}

function editCreditCard(i) {
  const c = (STATE.creditCards||[])[i];
  if (!c) return;
  const opts = CARD_PRESETS.map(p => `<option value="${p.label}" ${c.bankName===p.label?'selected':''}>${p.label}</option>`).join('');
  openModal('Edit Credit Card', `
    <div class="input-row">
      <div class="form-group"><label class="form-label">Bank / Card Name</label>
        <select id="cc-bank" class="form-input">${opts}<option value="custom" ${!CARD_PRESETS.find(p=>p.label===c.bankName)?'selected':''}>✏️ Custom</option></select></div>
      <div class="form-group"><label class="form-label">Network</label>
        <select id="cc-network" class="form-input">
          ${['VISA','Mastercard','RuPay','AmEx'].map(n=>`<option ${c.network===n?'selected':''}>${n}</option>`).join('')}
        </select></div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Credit Limit (₹)</label>
        <input type="number" id="cc-limit" class="form-input" value="${c.limit||0}" min="0"/></div>
      <div class="form-group"><label class="form-label">Outstanding (₹)</label>
        <input type="number" id="cc-outstanding" class="form-input" value="${c.outstanding||0}" min="0"/></div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Last 4 Digits</label>
        <input type="text" id="cc-last4" class="form-input" maxlength="4" value="${c.lastFour||''}"/></div>
      <div class="form-group"><label class="form-label">Due Date</label>
        <input type="date" id="cc-due" class="form-input" value="${c.dueDate||''}"/></div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveCreditCard(${i})">Update Card</button>
    </div>`);
}

function saveCreditCard(editIndex) {
  const bankName    = document.getElementById('cc-bank')?.value || 'Other';
  const network     = document.getElementById('cc-network')?.value || 'VISA';
  const limit       = parseFloat(document.getElementById('cc-limit')?.value) || 0;
  const outstanding = parseFloat(document.getElementById('cc-outstanding')?.value) || 0;
  const lastFour    = document.getElementById('cc-last4')?.value.trim().slice(-4) || '';
  const dueDate     = document.getElementById('cc-due')?.value || '';

  const preset = CARD_PRESETS.find(p => p.label === bankName);
  const color  = preset?.color  || '#263238';
  const color2 = preset?.color2 || '#102027';

  const card = { id: genId(), bankName, network, limit, outstanding, lastFour, dueDate, color, color2 };
  STATE.creditCards = STATE.creditCards || [];

  if (editIndex !== null && editIndex >= 0) {
    const old = STATE.creditCards[editIndex];
    card.id = old.id;
    STATE.creditCards[editIndex] = card;
    // If outstanding was changed in the edit form, log a snapshot so it
    // remains the latest entry (otherwise reconcile would revert it).
    if ((old.outstanding || 0) !== outstanding) {
      STATE.creditCardHistory = STATE.creditCardHistory || [];
      STATE.creditCardHistory.push({
        id: genId(), cardId: card.id,
        outstanding, prevOutstanding: old.outstanding || 0,
        date: today(), note: 'Edited via card', createdAt: new Date().toISOString()
      });
    }
    toast('Card updated! ✅', 'success');
  } else {
    STATE.creditCards.push(card);
    // Seed an initial snapshot so the tracker has a baseline
    if (outstanding > 0) {
      STATE.creditCardHistory = STATE.creditCardHistory || [];
      STATE.creditCardHistory.push({
        id: genId(), cardId: card.id,
        outstanding, prevOutstanding: outstanding,
        date: today(), note: 'Card added', createdAt: new Date().toISOString()
      });
    }
    toast('Credit card added! 💳', 'success');
  }
  saveState(); closeModal(); renderFinance();
}

function deleteCreditCard(i) {
  STATE.creditCards = (STATE.creditCards||[]).filter((_,idx)=>idx!==i);
  saveState(); toast('Card removed', 'info'); renderFinance();
}

// ── Quick update outstanding (like bank ↑ Bal) ───────────────────────────
function openUpdateCCModal(cardId) {
  const card = (STATE.creditCards||[]).find(c => c.id === cardId);
  if (!card) return;
  const todayStr = today();
  const yday  = (() => { const d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); })();
  const y2day = (() => { const d=new Date(); d.setDate(d.getDate()-2); return d.toISOString().slice(0,10); })();
  openModal(`💳 Update ${card.bankName} Card`, `
    <div style="padding:10px 14px;border-radius:10px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);margin-bottom:14px;font-size:12px;color:var(--text2)">
      Current outstanding: <strong style="color:#ef4444">${fmt(card.outstanding||0)}</strong> &nbsp;·&nbsp; Limit: <strong>${fmt(card.limit||0)}</strong>
    </div>
    <div class="form-group">
      <label class="form-label">New Outstanding Balance (₹)</label>
      <input type="number" id="cc-upd-outstanding" class="form-input" placeholder="Enter current outstanding" step="0.01" min="0" autofocus value="${card.outstanding||0}"/>
    </div>
    <div class="form-group">
      <label class="form-label">Date</label>
      <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
        <button type="button" id="cc-btn-today" onclick="setCcDate('${todayStr}','today')" style="padding:6px 14px;border-radius:8px;border:1px solid rgba(239,68,68,0.5);background:rgba(239,68,68,0.15);color:#ef4444;font-size:12px;font-weight:600;cursor:pointer">Today</button>
        <button type="button" id="cc-btn-yday"  onclick="setCcDate('${yday}','yday')"   style="padding:6px 14px;border-radius:8px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.06);color:var(--text2);font-size:12px;cursor:pointer">Yesterday</button>
        <button type="button" id="cc-btn-y2day" onclick="setCcDate('${y2day}','y2day')" style="padding:6px 14px;border-radius:8px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.06);color:var(--text2);font-size:12px;cursor:pointer">2 days ago</button>
        <button type="button" onclick="document.getElementById('cc-upd-date').showPicker?document.getElementById('cc-upd-date').showPicker():document.getElementById('cc-upd-date').focus()" style="padding:6px 14px;border-radius:8px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.06);color:var(--text2);font-size:12px;cursor:pointer">📅 Pick</button>
      </div>
      <input type="date" id="cc-upd-date" class="form-input" value="${todayStr}"/>
    </div>
    <div class="form-group">
      <label class="form-label">Note (optional)</label>
      <input type="text" id="cc-upd-note" class="form-input" placeholder="e.g. After payment, new purchase…"/>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveCCUpdate('${cardId}')" style="background:linear-gradient(135deg,#ef4444,#b91c1c)">💾 Save</button>
    </div>`);
}

function setCcDate(dateStr, key) {
  document.getElementById('cc-upd-date').value = dateStr;
  ['today','yday','y2day'].forEach(k => {
    const btn = document.getElementById(`cc-btn-${k}`);
    if (!btn) return;
    const active = k === key;
    btn.style.background  = active ? 'rgba(239,68,68,0.15)'  : 'rgba(255,255,255,0.06)';
    btn.style.borderColor = active ? 'rgba(239,68,68,0.5)'   : 'var(--glass-border)';
    btn.style.color       = active ? '#ef4444'               : 'var(--text2)';
    btn.style.fontWeight  = active ? '600'                   : '400';
  });
}

function saveCCUpdate(cardId) {
  const card = (STATE.creditCards||[]).find(c => c.id === cardId);
  if (!card) return;
  const newOut  = parseFloat(document.getElementById('cc-upd-outstanding')?.value);
  const date    = document.getElementById('cc-upd-date')?.value || today();
  const note    = document.getElementById('cc-upd-note')?.value.trim() || 'Balance update';
  if (isNaN(newOut) || newOut < 0) { toast('Enter a valid amount', 'error'); return; }
  const oldOut = card.outstanding || 0;
  card.outstanding = newOut;
  STATE.creditCardHistory = STATE.creditCardHistory || [];
  STATE.creditCardHistory.push({
    id: genId(), cardId,
    outstanding: newOut, prevOutstanding: oldOut,
    date, note, createdAt: new Date().toISOString()
  });
  saveState(); closeModal();
  toast(`${card.bankName} → outstanding ${fmt(newOut)} saved ✅`, 'success');
  renderFinance();
}

// ===== CSV IMPORT =====
let _csvResults = [];

function openCsvImport() {
  _csvResults = [];
  openModal('📊 Import CSV / Excel', `
    <div style="padding:10px 14px;border-radius:10px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);margin-bottom:14px;font-size:12px;color:var(--text2);line-height:1.6">
      Upload a <strong>CSV or Excel</strong> file (.csv, .xls, .xlsx) — e.g. a
      <strong>Google Pay / PhonePe</strong> export or a day-to-day expense sheet
      with <em>Date, Income, Expense, Category</em> columns.<br>
      Auto-detects the format and maps all transactions.
    </div>

    <div class="form-group" style="margin-bottom:12px">
      <label class="form-label">Select CSV / Excel file</label>
      <input type="file" id="csv-file-input" accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="form-input"
        onchange="handleCsvFileSelect(this)"
        style="padding:10px;cursor:pointer"/>
    </div>

    <div id="csv-status" style="display:none;font-size:12px;font-weight:600;margin-bottom:12px;padding:8px 12px;border-radius:8px"></div>

    <div class="modal-actions" style="margin-bottom:14px">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
    </div>

    <div id="csv-results-wrap" style="display:none">
      <div style="height:1px;background:var(--glass-border);margin-bottom:14px"></div>
      <p style="font-size:11px;font-weight:700;color:#00c9a7;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Detected transactions — edit if needed</p>
      <div id="csv-results-list" style="max-height:45vh;overflow-y:auto;padding-right:2px"></div>
      <div id="csv-summary" style="margin:12px 0;padding:10px 14px;border-radius:10px;background:rgba(0,201,167,0.08);border:1px solid rgba(0,201,167,0.2);font-size:13px;font-weight:600"></div>
      <button class="btn-primary" onclick="saveAllCsvTx()" style="width:100%;background:linear-gradient(135deg,#00c9a7,#0acf83);padding:12px">💾 Save All Transactions</button>
    </div>`);
}

function handleCsvFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  const name = (file.name || '').toLowerCase();
  const isExcel = name.endsWith('.xls') || name.endsWith('.xlsx') ||
    /spreadsheet|ms-excel/.test(file.type || '');
  const reader = new FileReader();

  reader.onload = e => {
    try {
      if (isExcel) {
        if (typeof XLSX === 'undefined') {
          _showImportStatus('csv', 'Excel support is still loading — try again in a moment.', 'warn');
          return;
        }
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        // Prefer a sheet named "Transactions", else the first non-empty sheet
        let sheetName = wb.SheetNames.find(n => /transaction/i.test(n)) || wb.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, blankrows: false, raw: false });
        _csvResults = parseSheetRows(rows);
      } else {
        _csvResults = parseCsvText(e.target.result);
      }

      if (!_csvResults.length) {
        _showImportStatus('csv', 'No valid transactions found. Make sure the file has Date + Income/Expense (or Amount) columns.', 'warn');
        return;
      }
      renderCsvResults();
      _showImportStatus('csv', `✅ Found ${_csvResults.length} transaction${_csvResults.length > 1 ? 's' : ''}`, 'ok');
    } catch (err) {
      _showImportStatus('csv', 'Could not parse file: ' + err.message, 'warn');
    }
  };

  if (isExcel) reader.readAsArrayBuffer(file);
  else reader.readAsText(file);
}

// Parse a sheet (array-of-arrays incl. header row) into transaction results.
// Handles separate Income/Expense (or Debit/Credit) columns AND a single
// Amount column. Used for Excel imports and generic spreadsheets.
function parseSheetRows(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = (rows[0] || []).map(h => String(h == null ? '' : h).toLowerCase().replace(/[^a-z0-9]/g, ' ').trim());
  const find = (...names) => {
    for (const n of names) { const i = headers.findIndex(h => h === n || h.includes(n)); if (i >= 0) return i; }
    return -1;
  };
  const iDate = find('date');
  const iInc  = find('income', 'credit', 'deposit', 'cr');
  const iExp  = find('expense', 'debit', 'withdrawal', 'dr');
  const iAmt  = find('amount', 'value');
  const iCat  = find('category');
  const iType = find('type');
  // Collect ALL possible name/description columns; per row use the first non-empty
  // (e.g. this sheet has both "Purpose" (the real name) and an empty "Description")
  const descIdxs = ['purpose', 'description', 'remarks', 'narration', 'particulars', 'note', 'details', 'name']
    .map(n => headers.findIndex(h => h === n || h.includes(n)))
    .filter(i => i >= 0);
  const num = v => parseFloat(String(v == null ? '' : v).replace(/[, ₹]/g, ''));

  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]; if (!row || !row.length) continue;
    const cell = i => (i >= 0 && row[i] != null ? String(row[i]).trim() : '');
    let type, amount;

    if (iInc >= 0 || iExp >= 0) {
      const inc = num(cell(iInc)), exp = num(cell(iExp));
      if (inc > 0) { type = 'income'; amount = inc; }
      else if (exp > 0) { type = 'expense'; amount = exp; }
      else continue;
    } else if (iAmt >= 0) {
      const raw = num(cell(iAmt)); if (!raw || isNaN(raw)) continue;
      amount = Math.abs(raw);
      const t = (cell(iType) || '').toLowerCase();
      type = (raw < 0 || t.includes('debit') || t.includes('expense') || t.includes('dr')) ? 'expense' : 'income';
    } else continue;

    if (!amount || amount <= 0) continue;
    let description = '';
    for (const di of descIdxs) { const v = cell(di); if (v) { description = v; break; } }
    if (!description) description = type === 'income' ? 'Credit' : 'Debit';
    const date = iDate >= 0 ? _parseCsvDate(cell(iDate)) : today();
    const lo = description.toLowerCase();
    // Remembered rule wins, then the file's Category column, then a guess
    const category = getCategoryRule(description) || _matchImportCategory(cell(iCat)) || smsCategoryGuess(lo, lo, type);
    out.push({ type, amount, date: date || today(), description, category });
  }
  return out;
}

// Map an imported category string to one of the app's categories (or null to guess).
function _matchImportCategory(raw) {
  if (!raw) return null;
  const c = raw.toLowerCase().trim();
  const cats = (typeof CATEGORIES !== 'undefined') ? CATEGORIES : [];
  const exact = cats.find(x => x.name.toLowerCase() === c);
  if (exact) return exact.name;
  const syn = {
    gas: 'Fuel', petrol: 'Fuel', diesel: 'Fuel',
    drinks: 'Food', tea: 'Food', coffee: 'Food', juice: 'Food', restaurant: 'Food', dining: 'Food', snacks: 'Food',
    grocery: 'Groceries', groceries: 'Groceries',
    movie: 'Entertainment', movies: 'Entertainment', games: 'Entertainment',
    rent: 'Rent', salary: 'Salary', medical: 'Health', medicine: 'Health', hospital: 'Health',
    transport: 'Transport', taxi: 'Transport', uber: 'Transport', ola: 'Transport', bus: 'Transport', train: 'Transport',
    shopping: 'Shopping', bill: 'Bills', bills: 'Bills', recharge: 'Bills', electricity: 'Utilities', water: 'Utilities'
  };
  if (syn[c]) return syn[c];
  // If it matches a category name loosely, use it
  const loose = cats.find(x => c.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(c));
  return loose ? loose.name : null;
}

function parseCsvText(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  // Normalize CSV line (handle quoted fields with commas inside)
  function splitCsvLine(line) {
    const result = [];
    let cur = '', inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { result.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    result.push(cur.trim());
    return result;
  }

  const headers = splitCsvLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim());
  const rows = lines.slice(1).map(l => splitCsvLine(l));

  // Detect format
  const fmt = _detectCsvFormat(headers);
  const results = [];

  rows.forEach(row => {
    if (row.length < 2) return;
    const cell = i => (row[i] || '').trim().replace(/^"|"$/g, '');

    let type, amount, date, description;

    if (fmt === 'gpay') {
      // GPay: Transaction ID | Date | Description | Amount (INR) | Status
      const [iDate, iDesc, iAmt] = [fmt === 'gpay' ? headers.indexOf('date') : -1,
        headers.findIndex(h => h.includes('description') || h.includes('remarks')),
        headers.findIndex(h => h.includes('amount'))];
      const dateIdx = headers.indexOf('date') !== -1 ? headers.indexOf('date') : headers.findIndex(h => h.includes('date'));
      const descIdx = headers.findIndex(h => h.includes('description') || h.includes('remarks'));
      const amtIdx  = headers.findIndex(h => h.includes('amount'));
      if (amtIdx === -1) return;

      const rawAmt = parseFloat(cell(amtIdx).replace(/,/g, ''));
      if (!rawAmt || isNaN(rawAmt)) return;
      amount = Math.abs(rawAmt);
      type = rawAmt < 0 ? 'expense' : 'income';
      description = descIdx >= 0 ? cell(descIdx) : '';
      date = dateIdx >= 0 ? _parseCsvDate(cell(dateIdx)) : today();

    } else if (fmt === 'phonepe') {
      // PhonePe: Transaction Date | Transaction ID | Remarks | Transaction Type | Amount (INR) | ...
      const dateIdx = headers.findIndex(h => h.includes('date'));
      const typeIdx = headers.findIndex(h => h.includes('type'));
      const amtIdx  = headers.findIndex(h => h.includes('amount'));
      const descIdx = headers.findIndex(h => h.includes('remarks') || h.includes('description'));
      if (amtIdx === -1) return;

      const rawAmt = parseFloat(cell(amtIdx).replace(/,/g, ''));
      if (!rawAmt || isNaN(rawAmt)) return;
      amount = Math.abs(rawAmt);
      const txType = (cell(typeIdx) || '').toLowerCase();
      type = (txType.includes('debit') || txType.includes('paid') || txType.includes('sent')) ? 'expense' : 'income';
      description = descIdx >= 0 ? cell(descIdx) : '';
      date = dateIdx >= 0 ? _parseCsvDate(cell(dateIdx)) : today();

    } else {
      // Generic: try to guess columns
      const dateIdx = headers.findIndex(h => h.includes('date'));
      const amtIdx  = headers.findIndex(h => h.includes('amount') || h.includes('debit') || h.includes('credit'));
      const descIdx = headers.findIndex(h => h.includes('description') || h.includes('narration') || h.includes('remarks') || h.includes('particulars'));
      const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('transaction type'));

      // Try debit/credit separate columns (bank statement style)
      const debitIdx  = headers.findIndex(h => h === 'debit' || h === 'withdrawal' || h === 'dr');
      const creditIdx = headers.findIndex(h => h === 'credit' || h === 'deposit' || h === 'cr');

      if (debitIdx >= 0 || creditIdx >= 0) {
        const debitAmt  = parseFloat((cell(debitIdx)  || '0').replace(/,/g,''));
        const creditAmt = parseFloat((cell(creditIdx) || '0').replace(/,/g,''));
        if (!debitAmt && !creditAmt) return;
        if (debitAmt > 0)  { amount = debitAmt;  type = 'expense'; }
        else               { amount = creditAmt; type = 'income';  }
      } else if (amtIdx >= 0) {
        const rawAmt = parseFloat(cell(amtIdx).replace(/,/g, ''));
        if (!rawAmt || isNaN(rawAmt)) return;
        amount = Math.abs(rawAmt);
        const txType = typeIdx >= 0 ? (cell(typeIdx) || '').toLowerCase() : '';
        type = (rawAmt < 0 || txType.includes('debit') || txType.includes('dr')) ? 'expense' : 'income';
      } else return;

      description = descIdx >= 0 ? cell(descIdx) : '';
      date = dateIdx >= 0 ? _parseCsvDate(cell(dateIdx)) : today();
    }

    if (!amount || amount <= 0) return;
    if (!description) description = type === 'income' ? 'Credit' : 'Debit';
    const lo = description.toLowerCase();
    const category = getCategoryRule(description) || smsCategoryGuess(lo, lo, type);
    results.push({ type, amount, date: date || today(), description, category });
  });

  return results;
}

function _detectCsvFormat(headers) {
  const h = headers.join(' ');
  if (h.includes('transaction id') && h.includes('amount') && (h.includes('description') || !h.includes('remarks'))) return 'gpay';
  if (h.includes('transaction type') && h.includes('remarks')) return 'phonepe';
  return 'generic';
}

function _parseCsvDate(raw) {
  if (!raw) return today();
  raw = raw.trim();
  // DD/MM/YYYY or DD-MM-YYYY
  let m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const yr = m[3].length === 2 ? '20' + m[3] : m[3];
    return `${yr}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  }
  // YYYY-MM-DD (already correct)
  m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return raw.slice(0, 10);
  // "05 Jan 2025" or "Jan 05, 2025" or "05 January 2025"
  const MONTHS = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
    january:'01',february:'02',march:'03',april:'04',june:'06',july:'07',august:'08',september:'09',october:'10',november:'11',december:'12'};
  m = raw.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (m) { const mo = MONTHS[m[2].toLowerCase()]; if (mo) return `${m[3]}-${mo}-${m[1].padStart(2,'0')}`; }
  m = raw.match(/([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (m) { const mo = MONTHS[m[1].toLowerCase()]; if (mo) return `${m[3]}-${mo}-${m[2].padStart(2,'0')}`; }
  // Try native parse as fallback
  const d = new Date(raw);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  return today();
}

function _showImportStatus(prefix, msg, type) {
  const el = document.getElementById(`${prefix}-status`);
  if (!el) return;
  el.style.display    = '';
  el.textContent      = msg;
  el.style.background = type === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)';
  el.style.color      = type === 'ok' ? '#10b981'               : '#f59e0b';
}

function renderCsvResults() {
  const list = document.getElementById('csv-results-list');
  const wrap = document.getElementById('csv-results-wrap');
  if (!list || !wrap) return;
  list.innerHTML = _csvResults.map((r, i) => `
    <div id="csv-card-${i}" style="background:var(--card-bg);border:1px solid var(--glass-border);border-radius:12px;padding:12px;margin-bottom:10px;position:relative">
      <button onclick="removeCsvResult(${i})" title="Remove" style="position:absolute;top:8px;right:10px;background:rgba(239,68,68,0.12);border:none;color:#ef4444;border-radius:6px;cursor:pointer;padding:2px 9px;font-size:13px;line-height:1.6">✕</button>
      <div style="display:grid;grid-template-columns:auto 1fr 1fr;gap:8px;margin-bottom:8px;padding-right:36px">
        <select class="form-input" id="cv-type-${i}" onchange="updateCsvSummary()" style="font-size:12px;padding:4px 8px">
          <option value="expense" ${r.type === 'expense' ? 'selected' : ''}>❤️ Expense</option>
          <option value="income"  ${r.type === 'income'  ? 'selected' : ''}>💚 Income</option>
        </select>
        <input type="number" class="form-input" id="cv-amount-${i}" value="${r.amount}" step="0.01" min="0"
          oninput="updateCsvSummary()" style="font-size:13px;font-weight:700;padding:4px 8px"/>
        <input type="date" class="form-input" id="cv-date-${i}" value="${r.date}" style="font-size:12px;padding:4px 8px"/>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <select class="form-input" id="cv-cat-${i}" style="font-size:12px;padding:4px 8px">${_makeSrCatOptions(r.category)}</select>
        <input type="text" class="form-input" id="cv-desc-${i}" value="${(r.description||'').replace(/"/g,'&quot;')}" placeholder="Description" style="font-size:12px;padding:4px 8px"/>
      </div>
    </div>`).join('');
  wrap.style.display = '';
  updateCsvSummary();
}

function removeCsvResult(i) {
  const card = document.getElementById(`csv-card-${i}`);
  if (card) card.style.display = 'none';
  updateCsvSummary();
}

function updateCsvSummary() {
  let totalExpense = 0, totalIncome = 0, count = 0;
  _csvResults.forEach((_, i) => {
    const card = document.getElementById(`csv-card-${i}`);
    if (!card || card.style.display === 'none') return;
    const type   = document.getElementById(`cv-type-${i}`)?.value;
    const amount = parseFloat(document.getElementById(`cv-amount-${i}`)?.value) || 0;
    if (type === 'expense') totalExpense += amount; else totalIncome += amount;
    count++;
  });
  const el = document.getElementById('csv-summary');
  if (!el) return;
  if (!count) { el.innerHTML = '<span style="color:var(--text3)">No transactions selected</span>'; return; }
  const parts = [];
  if (totalExpense > 0) parts.push(`<span style="color:#ef4444">💸 Expense: ₹${totalExpense.toLocaleString('en-IN',{minimumFractionDigits:2})}</span>`);
  if (totalIncome  > 0) parts.push(`<span style="color:#10b981">💰 Income: ₹${totalIncome.toLocaleString('en-IN',{minimumFractionDigits:2})}</span>`);
  el.innerHTML = `${parts.join(' &nbsp;·&nbsp; ')} &nbsp;·&nbsp; <span style="color:var(--text2)">${count} transaction${count>1?'s':''}</span>`;
}

function saveAllCsvTx() {
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const toSave  = [];
  _csvResults.forEach((_, i) => {
    const card = document.getElementById(`csv-card-${i}`);
    if (!card || card.style.display === 'none') return;
    const type     = document.getElementById(`cv-type-${i}`)?.value;
    const amount   = parseFloat(document.getElementById(`cv-amount-${i}`)?.value);
    const date     = document.getElementById(`cv-date-${i}`)?.value || today();
    const category = document.getElementById(`cv-cat-${i}`)?.value;
    const desc     = document.getElementById(`cv-desc-${i}`)?.value?.trim() || '';
    if (!amount || amount <= 0) return;
    const icon = allCats.find(c => c.name === category)?.icon || '💳';
    toSave.push({ id: genId(), type, amount, date, category, icon, description: desc, createdAt: new Date().toISOString() });
  });
  if (!toSave.length) { toast('No valid transactions to save', 'error'); return; }
  STATE.transactions = STATE.transactions || [];
  [...toSave].reverse().forEach(tx => STATE.transactions.unshift(tx));
  saveState();
  if (typeof addXP === 'function') addXP(10 * toSave.length, `${toSave.length} CSV transaction${toSave.length>1?'s':''} imported`);
  if (typeof autoSyncGoals === 'function') autoSyncGoals();
  closeModal();
  toast(`${toSave.length} transaction${toSave.length>1?'s':''} imported from CSV! 🎉`, 'success');
  refreshFinancePage();
}

// ===== BULK DATE ENTRY =====
let _bulkRows = 0;

function openBulkEntry() {
  _bulkRows = 0;
  openModal('📅 Bulk Date Entry', `
    <div style="padding:10px 14px;border-radius:10px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);margin-bottom:14px;font-size:12px;color:var(--text2);line-height:1.6">
      Pick a date, then add as many transactions as you need at once.
    </div>
    <div class="form-group" style="margin-bottom:14px">
      <label class="form-label">Date for all entries</label>
      <input type="date" id="bulk-date" class="form-input" value="${today()}" onchange="updateBulkRowDates()"/>
    </div>
    <div id="bulk-rows-wrap"></div>
    <button class="btn-secondary" onclick="addBulkRow()" style="width:100%;margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:6px">+ Add Row</button>
    <div id="bulk-summary" style="display:none;margin-bottom:12px;padding:10px 14px;border-radius:10px;background:rgba(0,201,167,0.08);border:1px solid rgba(0,201,167,0.2);font-size:13px;font-weight:600"></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveBulkEntries()" style="background:linear-gradient(135deg,#00c9a7,#0acf83)">💾 Save All</button>
    </div>`);
  addBulkRow();
  addBulkRow();
}

function addBulkRow() {
  const i = _bulkRows++;
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const catOpts = allCats.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('');
  const date = document.getElementById('bulk-date')?.value || today();
  const wrap = document.getElementById('bulk-rows-wrap');
  if (!wrap) return;
  const div = document.createElement('div');
  div.id = `bulk-row-${i}`;
  div.style.cssText = 'background:var(--card-bg);border:1px solid var(--glass-border);border-radius:12px;padding:12px;margin-bottom:10px;position:relative';
  div.innerHTML = `
    <button onclick="removeBulkRow(${i})" title="Remove" style="position:absolute;top:8px;right:10px;background:rgba(239,68,68,0.12);border:none;color:#ef4444;border-radius:6px;cursor:pointer;padding:2px 9px;font-size:13px;line-height:1.6">✕</button>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:8px;margin-bottom:8px;padding-right:44px">
      <select class="form-input" id="br-type-${i}" oninput="updateBulkSummary()" style="font-size:12px;padding:4px 8px">
        <option value="expense">❤️ Expense</option>
        <option value="income">💚 Income</option>
      </select>
      <input type="number" class="form-input" id="br-amount-${i}" placeholder="Amount ₹" min="0" step="0.01"
        oninput="updateBulkSummary()" style="font-size:13px;font-weight:700;padding:4px 8px"/>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <select class="form-input" id="br-cat-${i}" style="font-size:12px;padding:4px 8px">${catOpts}</select>
      <input type="text" class="form-input" id="br-desc-${i}" placeholder="Description" style="font-size:12px;padding:4px 8px"/>
    </div>`;
  wrap.appendChild(div);
}

function removeBulkRow(i) {
  const row = document.getElementById(`bulk-row-${i}`);
  if (row) row.style.display = 'none';
  updateBulkSummary();
}

function updateBulkRowDates() {
  // date is shared — nothing per-row to update, but keep hook for future use
}

function updateBulkSummary() {
  let totalExpense = 0, totalIncome = 0, count = 0;
  for (let i = 0; i < _bulkRows; i++) {
    const row = document.getElementById(`bulk-row-${i}`);
    if (!row || row.style.display === 'none') continue;
    const type   = document.getElementById(`br-type-${i}`)?.value;
    const amount = parseFloat(document.getElementById(`br-amount-${i}`)?.value) || 0;
    if (!amount) continue;
    if (type === 'expense') totalExpense += amount; else totalIncome += amount;
    count++;
  }
  const el = document.getElementById('bulk-summary');
  if (!el) return;
  if (!count) { el.style.display = 'none'; return; }
  el.style.display = '';
  const parts = [];
  if (totalExpense > 0) parts.push(`<span style="color:#ef4444">💸 Expense: ₹${totalExpense.toLocaleString('en-IN',{minimumFractionDigits:2})}</span>`);
  if (totalIncome  > 0) parts.push(`<span style="color:#10b981">💰 Income: ₹${totalIncome.toLocaleString('en-IN',{minimumFractionDigits:2})}</span>`);
  el.innerHTML = `${parts.join(' &nbsp;·&nbsp; ')} &nbsp;·&nbsp; <span style="color:var(--text2)">${count} entr${count>1?'ies':'y'}</span>`;
}

function saveBulkEntries() {
  const date = document.getElementById('bulk-date')?.value || today();
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const toSave  = [];
  for (let i = 0; i < _bulkRows; i++) {
    const row = document.getElementById(`bulk-row-${i}`);
    if (!row || row.style.display === 'none') continue;
    const type     = document.getElementById(`br-type-${i}`)?.value;
    const amount   = parseFloat(document.getElementById(`br-amount-${i}`)?.value);
    const category = document.getElementById(`br-cat-${i}`)?.value;
    const desc     = document.getElementById(`br-desc-${i}`)?.value?.trim() || '';
    if (!amount || amount <= 0) continue;
    const icon = allCats.find(c => c.name === category)?.icon || '💳';
    toSave.push({ id: genId(), type, amount, date, category, icon, description: desc, createdAt: new Date().toISOString() });
  }
  if (!toSave.length) { toast('Add at least one valid amount', 'error'); return; }
  STATE.transactions = STATE.transactions || [];
  [...toSave].reverse().forEach(tx => STATE.transactions.unshift(tx));
  saveState();
  if (typeof addXP === 'function') addXP(10 * toSave.length, `${toSave.length} bulk transaction${toSave.length>1?'s':''} logged`);
  if (typeof autoSyncGoals === 'function') autoSyncGoals();
  closeModal();
  toast(`${toSave.length} transaction${toSave.length>1?'s':''} saved! +${toSave.length * 10} XP 🎉`, 'success');
  refreshFinancePage();
}

// ===== SMART STATEMENT PASTE (GPay / PhonePe) =====
let _stmtResults = [];

function openStatementPaste() {
  _stmtResults = [];
  openModal('📄 Paste Statement', `
    <div style="padding:10px 14px;border-radius:10px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);margin-bottom:14px;font-size:12px;color:var(--text2);line-height:1.6">
      Copy text from your <strong>GPay</strong> or <strong>PhonePe</strong> transaction history page and paste it below.<br>
      Works with both app copy-paste and browser page text.
    </div>
    <div class="form-group" style="margin-bottom:12px">
      <label class="form-label">Paste transaction history</label>
      <textarea id="stmt-raw" class="form-input" rows="6"
        placeholder="Paste copied text from GPay or PhonePe transaction history..."
        style="font-size:12px;line-height:1.6;resize:vertical"></textarea>
    </div>
    <div id="stmt-status" style="display:none;font-size:12px;font-weight:600;margin-bottom:12px;padding:8px 12px;border-radius:8px"></div>
    <div class="modal-actions" style="margin-bottom:14px">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="parseStatement()" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">🔍 Parse</button>
    </div>
    <div id="stmt-results-wrap" style="display:none">
      <div style="height:1px;background:var(--glass-border);margin-bottom:14px"></div>
      <p style="font-size:11px;font-weight:700;color:#00c9a7;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Detected transactions — edit if needed</p>
      <div id="stmt-results-list" style="max-height:45vh;overflow-y:auto;padding-right:2px"></div>
      <div id="stmt-summary" style="margin:12px 0;padding:10px 14px;border-radius:10px;background:rgba(0,201,167,0.08);border:1px solid rgba(0,201,167,0.2);font-size:13px;font-weight:600"></div>
      <button class="btn-primary" onclick="saveAllStmtTx()" style="width:100%;background:linear-gradient(135deg,#00c9a7,#0acf83);padding:12px">💾 Save All Transactions</button>
    </div>`);
}

function parseStatement() {
  const raw = document.getElementById('stmt-raw')?.value?.trim();
  if (!raw) { toast('Paste some text first', 'error'); return; }
  _stmtResults = _parseStatementText(raw);
  if (!_stmtResults.length) {
    _showImportStatus('stmt', 'Could not detect any transactions. Make sure you pasted from GPay or PhonePe transaction history.', 'warn');
    return;
  }
  renderStmtResults();
  _showImportStatus('stmt', `✅ Found ${_stmtResults.length} transaction${_stmtResults.length > 1 ? 's' : ''}`, 'ok');
}

function _parseStatementText(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
  const results = [];

  // Strategy: scan line by line looking for ₹ amount lines, then look around for date/merchant/type
  const MONTHS = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
    january:'01',february:'02',march:'03',april:'04',june:'06',july:'07',august:'08',september:'09',october:'10',november:'11',december:'12'};

  function parseLineDate(s) {
    // "12 May 2025" or "May 12, 2025" or "12/05/2025" or "2025-05-12"
    let m = s.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
    if (m) { const mo = MONTHS[m[2].toLowerCase()]; if (mo) return `${m[3]}-${mo}-${m[1].padStart(2,'0')}`; }
    m = s.match(/([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (m) { const mo = MONTHS[m[1].toLowerCase()]; if (mo) return `${m[3]}-${mo}-${m[2].padStart(2,'0')}`; }
    m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) return m[0];
    m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (m) { const yr = m[3].length===2?'20'+m[3]:m[3]; return `${yr}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; }
    return null;
  }

  function parseLineAmount(s) {
    // ₹350 or ₹1,299.00 or Rs. 350 or INR 350
    const m = s.match(/(?:₹|rs\.?\s*|inr\s*)([\d,]+(?:\.\d{1,2})?)/i);
    if (m) return parseFloat(m[1].replace(/,/g,''));
    // Bare number like "350.00" as own line
    const m2 = s.match(/^([\d,]+(?:\.\d{1,2})?)$/);
    if (m2) { const v = parseFloat(m2[1].replace(/,/g,'')); if (v > 0) return v; }
    return null;
  }

  function detectType(s) {
    const lo = s.toLowerCase();
    if (/\b(paid|debit|debited|sent|spent|withdrawn|payment)\b/.test(lo)) return 'expense';
    if (/\b(received|credit|credited|added|money received|refund|cashback)\b/.test(lo)) return 'income';
    return null;
  }

  // Collect all (lineIdx, amount) pairs first
  const amtLines = [];
  lines.forEach((l, idx) => {
    const amt = parseLineAmount(l);
    if (amt && amt > 0) amtLines.push({ idx, amt });
  });

  // For each amount line, gather context (±5 lines) to find date, description, type
  amtLines.forEach(({ idx, amt }) => {
    const window = [];
    for (let d = -4; d <= 4; d++) {
      if (idx + d >= 0 && idx + d < lines.length && d !== 0) window.push({ d, line: lines[idx + d] });
    }

    // Find date in window (prefer lines before the amount)
    let date = null;
    for (const { line } of [...window].sort((a,b) => Math.abs(a.d) - Math.abs(b.d))) {
      date = parseLineDate(line);
      if (date) break;
    }
    if (!date) date = today();

    // Find type signal
    let type = null;
    for (const { line } of window) {
      const t = detectType(line);
      if (t) { type = t; break; }
    }
    // Also check the amount line itself
    if (!type) type = detectType(lines[idx]);

    // Find description: prefer merchant-looking lines (not date/amount/type keywords) before or after
    let description = '';
    const skipRe = /₹|rs\.|inr|^[\d,]+(\.\d+)?$|paid|received|credit|debit|debited|credited|success|completed|utr|ref|transaction|pending/i;
    const dateRe  = /\d{1,2}\s+[a-zA-Z]+\s+\d{4}|[a-zA-Z]+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/;
    for (const { d, line } of [...window].sort((a,b) => Math.abs(a.d)-Math.abs(b.d))) {
      if (skipRe.test(line)) continue;
      if (dateRe.test(line)) continue;
      if (line.length < 3 || line.length > 80) continue;
      description = line;
      break;
    }
    if (!description) description = type === 'income' ? 'Received' : 'Payment';

    // Default type from description if still null
    if (!type) {
      const lo = description.toLowerCase();
      type = (lo.includes('paid') || lo.includes('sent') || lo.includes('to ')) ? 'expense' : 'income';
    }

    const lo = description.toLowerCase();
    const category = smsCategoryGuess(lo, lo, type);
    results.push({ type, amount: amt, date, description, category });
  });

  // Deduplicate by amount+date+description
  const seen = new Set();
  return results.filter(r => {
    const key = `${r.amount}|${r.date}|${r.description}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderStmtResults() {
  const list = document.getElementById('stmt-results-list');
  const wrap = document.getElementById('stmt-results-wrap');
  if (!list || !wrap) return;
  list.innerHTML = _stmtResults.map((r, i) => `
    <div id="st-card-${i}" style="background:var(--card-bg);border:1px solid var(--glass-border);border-radius:12px;padding:12px;margin-bottom:10px;position:relative">
      <button onclick="removeStmtResult(${i})" title="Remove" style="position:absolute;top:8px;right:10px;background:rgba(239,68,68,0.12);border:none;color:#ef4444;border-radius:6px;cursor:pointer;padding:2px 9px;font-size:13px;line-height:1.6">✕</button>
      <div style="display:grid;grid-template-columns:auto 1fr 1fr;gap:8px;margin-bottom:8px;padding-right:36px">
        <select class="form-input" id="st-type-${i}" onchange="updateStmtSummary()" style="font-size:12px;padding:4px 8px">
          <option value="expense" ${r.type === 'expense' ? 'selected' : ''}>❤️ Expense</option>
          <option value="income"  ${r.type === 'income'  ? 'selected' : ''}>💚 Income</option>
        </select>
        <input type="number" class="form-input" id="st-amount-${i}" value="${r.amount}" step="0.01" min="0"
          oninput="updateStmtSummary()" style="font-size:13px;font-weight:700;padding:4px 8px"/>
        <input type="date" class="form-input" id="st-date-${i}" value="${r.date}" style="font-size:12px;padding:4px 8px"/>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <select class="form-input" id="st-cat-${i}" style="font-size:12px;padding:4px 8px">${_makeSrCatOptions(r.category)}</select>
        <input type="text" class="form-input" id="st-desc-${i}" value="${(r.description||'').replace(/"/g,'&quot;')}" placeholder="Description" style="font-size:12px;padding:4px 8px"/>
      </div>
    </div>`).join('');
  wrap.style.display = '';
  updateStmtSummary();
}

function removeStmtResult(i) {
  const card = document.getElementById(`st-card-${i}`);
  if (card) card.style.display = 'none';
  updateStmtSummary();
}

function updateStmtSummary() {
  let totalExpense = 0, totalIncome = 0, count = 0;
  _stmtResults.forEach((_, i) => {
    const card = document.getElementById(`st-card-${i}`);
    if (!card || card.style.display === 'none') return;
    const type   = document.getElementById(`st-type-${i}`)?.value;
    const amount = parseFloat(document.getElementById(`st-amount-${i}`)?.value) || 0;
    if (type === 'expense') totalExpense += amount; else totalIncome += amount;
    count++;
  });
  const el = document.getElementById('stmt-summary');
  if (!el) return;
  if (!count) { el.innerHTML = '<span style="color:var(--text3)">No transactions selected</span>'; return; }
  const parts = [];
  if (totalExpense > 0) parts.push(`<span style="color:#ef4444">💸 Expense: ₹${totalExpense.toLocaleString('en-IN',{minimumFractionDigits:2})}</span>`);
  if (totalIncome  > 0) parts.push(`<span style="color:#10b981">💰 Income: ₹${totalIncome.toLocaleString('en-IN',{minimumFractionDigits:2})}</span>`);
  el.innerHTML = `${parts.join(' &nbsp;·&nbsp; ')} &nbsp;·&nbsp; <span style="color:var(--text2)">${count} transaction${count>1?'s':''}</span>`;
}

function saveAllStmtTx() {
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const toSave  = [];
  _stmtResults.forEach((_, i) => {
    const card = document.getElementById(`st-card-${i}`);
    if (!card || card.style.display === 'none') return;
    const type     = document.getElementById(`st-type-${i}`)?.value;
    const amount   = parseFloat(document.getElementById(`st-amount-${i}`)?.value);
    const date     = document.getElementById(`st-date-${i}`)?.value || today();
    const category = document.getElementById(`st-cat-${i}`)?.value;
    const desc     = document.getElementById(`st-desc-${i}`)?.value?.trim() || '';
    if (!amount || amount <= 0) return;
    const icon = allCats.find(c => c.name === category)?.icon || '💳';
    toSave.push({ id: genId(), type, amount, date, category, icon, description: desc, createdAt: new Date().toISOString() });
  });
  if (!toSave.length) { toast('No valid transactions to save', 'error'); return; }
  STATE.transactions = STATE.transactions || [];
  [...toSave].reverse().forEach(tx => STATE.transactions.unshift(tx));
  saveState();
  if (typeof addXP === 'function') addXP(10 * toSave.length, `${toSave.length} statement transaction${toSave.length>1?'s':''} imported`);
  if (typeof autoSyncGoals === 'function') autoSyncGoals();
  closeModal();
  toast(`${toSave.length} transaction${toSave.length>1?'s':''} imported! 🎉`, 'success');
  refreshFinancePage();
}

// ===== PDF IMPORT =====
let _pdfResults = [];

function openPdfImport() {
  _pdfResults = [];
  openModal('📑 Import PDF Statement', `
    <div style="padding:10px 14px;border-radius:10px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);margin-bottom:14px;font-size:12px;color:var(--text2);line-height:1.6">
      Upload a PDF bank statement from <strong>GPay, PhonePe, SBI, HDFC, ICICI, Axis</strong> or any bank.<br>
      Text is extracted from the PDF and auto-parsed for transactions.
    </div>

    <div class="form-group" style="margin-bottom:12px">
      <label class="form-label">Select PDF file</label>
      <input type="file" id="pdf-file-input" accept=".pdf,application/pdf" class="form-input"
        onchange="handlePdfFileSelect(this)"
        style="padding:10px;cursor:pointer"/>
    </div>

    <div id="pdf-status" style="display:none;font-size:12px;font-weight:600;margin-bottom:12px;padding:8px 12px;border-radius:8px"></div>
    <div id="pdf-progress" style="display:none;margin-bottom:12px">
      <div style="font-size:12px;color:var(--text2);margin-bottom:6px" id="pdf-progress-label">Extracting text…</div>
      <div style="background:var(--glass-border);border-radius:4px;height:6px;overflow:hidden">
        <div id="pdf-progress-bar" style="background:linear-gradient(90deg,#6366f1,#8b5cf6);height:100%;width:0%;transition:width 0.3s"></div>
      </div>
    </div>

    <div class="modal-actions" style="margin-bottom:14px">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
    </div>

    <div id="pdf-results-wrap" style="display:none">
      <div style="height:1px;background:var(--glass-border);margin-bottom:14px"></div>
      <p style="font-size:11px;font-weight:700;color:#00c9a7;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Detected transactions — edit if needed</p>
      <div id="pdf-results-list" style="max-height:45vh;overflow-y:auto;padding-right:2px"></div>
      <div id="pdf-summary" style="margin:12px 0;padding:10px 14px;border-radius:10px;background:rgba(0,201,167,0.08);border:1px solid rgba(0,201,167,0.2);font-size:13px;font-weight:600"></div>
      <button class="btn-primary" onclick="saveAllPdfTx()" style="width:100%;background:linear-gradient(135deg,#00c9a7,#0acf83);padding:12px">💾 Save All Transactions</button>
    </div>`);
}

async function handlePdfFileSelect(input) {
  const file = input.files[0];
  if (!file) return;

  if (typeof pdfjsLib === 'undefined') {
    _showImportStatus('pdf', 'PDF library not loaded yet — please wait a moment and try again.', 'warn');
    return;
  }

  // Show progress
  const prog = document.getElementById('pdf-progress');
  const progBar = document.getElementById('pdf-progress-bar');
  const progLabel = document.getElementById('pdf-progress-label');
  if (prog) prog.style.display = '';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    let fullText = '';

    for (let p = 1; p <= totalPages; p++) {
      if (progLabel) progLabel.textContent = `Reading page ${p} of ${totalPages}…`;
      if (progBar) progBar.style.width = `${(p / totalPages) * 100}%`;
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();

      // Font-height aware line grouping: collect all items with (x, y, height),
      // sort top→bottom then left→right, then group items whose y is within
      // half a line-height of the running row baseline.
      const items = content.items.map(it => ({
        str: (it.str || '').replace(/\s+/g, ' '),
        x: it.transform ? it.transform[4] : 0,
        y: it.transform ? it.transform[5] : 0,
        h: it.height || 10
      })).filter(it => it.str.trim() || it.str === ' ');

      items.sort((a, b) => (b.y - a.y) || (a.x - b.x));

      const rows = [];
      let curRow = [];
      let curY = null;
      let curH = 10;
      items.forEach(it => {
        const tol = Math.max(2, (it.h || curH) * 0.5);
        if (curY === null || Math.abs(curY - it.y) <= tol) {
          curRow.push(it);
          curY = curY === null ? it.y : (curY * curRow.length + it.y) / (curRow.length + 1);
          curH = it.h || curH;
        } else {
          if (curRow.length) rows.push(curRow);
          curRow = [it];
          curY = it.y;
          curH = it.h || 10;
        }
      });
      if (curRow.length) rows.push(curRow);

      const pageLines = rows.map(row =>
        row.sort((a, b) => a.x - b.x).map(i => i.str).join(' ').replace(/\s+/g, ' ').trim()
      ).filter(l => l);

      fullText += pageLines.join('\n') + '\n';
    }

    if (prog) prog.style.display = 'none';

    // Try PhonePe/GPay UPI-statement parser first (most specific)
    _pdfResults = _parseUpiStatementPdf(fullText);

    // Then CSV-style tabular bank statements
    if (!_pdfResults.length) _pdfResults = _parsePdfAsTable(fullText);

    // Last resort: generic statement-text parser
    if (!_pdfResults.length) _pdfResults = _parseStatementText(fullText);

    if (!_pdfResults.length) {
      // Expose first 400 chars of extracted text + total length so the user can
      // share what the PDF actually contained when the parser fails.
      const snippet = (fullText || '').replace(/\s+/g, ' ').slice(0, 400);
      const len = (fullText || '').length;
      console.log('[PDF Import] Extracted text length:', len);
      console.log('[PDF Import] First 2000 chars:\n', (fullText || '').slice(0, 2000));
      _showImportStatus('pdf',
        `No transactions found in ${len.toLocaleString()} chars of extracted text. ` +
        `This PDF may be scanned/image-based, password-protected, or use a layout we don't handle yet. ` +
        `Open the browser console (F12) — the first 2000 chars were logged so you can share them.`, 'warn');
      return;
    }

    renderPdfResults();
    _showImportStatus('pdf', `✅ Found ${_pdfResults.length} transaction${_pdfResults.length > 1 ? 's' : ''} across ${totalPages} page${totalPages > 1 ? 's' : ''}`, 'ok');

  } catch (err) {
    if (prog) prog.style.display = 'none';
    _showImportStatus('pdf', 'Could not read PDF: ' + (err.message || err), 'warn');
  }
}

function _parsePdfAsTable(text) {
  // Many bank statement PDFs have tabular rows like:
  // "05/01/2025  UPI-Swiggy  350.00  Cr  12,500.00"
  // or "05 Jan 2025  NEFT to John  1000.00  Dr  11,500.00"
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const results = [];

  const MONTHS = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};

  function tryParseDate(s) {
    let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) { const yr = m[3].length===2?'20'+m[3]:m[3]; return `${yr}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; }
    m = s.match(/^(\d{1,2})[\s\-]([a-zA-Z]{3,})[\s\-](\d{2,4})$/);
    if (m) { const mo = MONTHS[m[2].toLowerCase().slice(0,3)]; if (mo) { const yr = m[3].length===2?'20'+m[3]:m[3]; return `${yr}-${mo}-${m[1].padStart(2,'0')}`; } }
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return s;
    return null;
  }

  lines.forEach(line => {
    // Must contain a number that looks like a rupee amount
    if (!/[\d,]+\.\d{2}/.test(line)) return;

    // Try to find a date token at the start of the line
    const tokens = line.split(/\s{2,}|\t/); // split on 2+ spaces or tab (column separator)
    if (tokens.length < 3) return;

    const date = tryParseDate(tokens[0].trim());
    if (!date) return;

    // Last token with decimal = balance, second-last or earlier = amount
    const numTokens = tokens.map(t => ({ t, v: parseFloat(t.replace(/,/g,'')) }))
                            .filter(x => !isNaN(x.v) && x.v > 0 && /\d+\.\d{2}/.test(x.t));
    if (numTokens.length < 1) return;

    // Description = middle tokens (skip date, skip trailing numbers)
    const descTokens = tokens.slice(1, tokens.length - numTokens.length);
    const description = descTokens.join(' ').replace(/\s+/g, ' ').trim();
    if (!description || description.length < 2) return;

    // Type: look for Dr/Cr marker
    const lineLo = line.toLowerCase();
    let type = null;
    if (/\bdr\b|debit|withdrawal|paid/.test(lineLo)) type = 'expense';
    else if (/\bcr\b|credit|deposit|received/.test(lineLo)) type = 'income';
    if (!type) type = smsCategoryGuess(lineLo, description.toLowerCase(), null) === 'Salary' ? 'income' : 'expense';

    // Amount = first numeric token after description (not balance)
    const amount = numTokens[0].v;
    if (!amount || amount <= 0) return;

    const lo = description.toLowerCase();
    const category = smsCategoryGuess(lo, lo, type);
    results.push({ type, amount, date, description, category });
  });

  // Deduplicate
  const seen = new Set();
  return results.filter(r => {
    const key = `${r.amount}|${r.date}|${r.description}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Parser specialised for PhonePe / Google Pay PDF statements where each
// transaction has lines like:
//   "May 18, 2026   Paid to Kannan catering services   DEBIT   ₹20"
//   "01:22 pm       Transaction ID T2605..."
//   "               UTR No. 620965608717"
//   "               Paid by 652868XXXXXXXX07"
function _parseUpiStatementPdf(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const results = [];
  const MONTHS = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
    january:'01',february:'02',march:'03',april:'04',june:'06',july:'07',august:'08',september:'09',october:'10',november:'11',december:'12'};

  function parseUpiDate(s) {
    if (!s) return null;
    // "May 18, 2026" / "May 18,2026" / "18 May 2026" / "May 18 2026"
    let m = s.match(/([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (m) { const mo = MONTHS[m[1].toLowerCase().slice(0,3)]; if (mo) return `${m[3]}-${mo}-${m[2].padStart(2,'0')}`; }
    m = s.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
    if (m) { const mo = MONTHS[m[2].toLowerCase().slice(0,3)]; if (mo) return `${m[3]}-${mo}-${m[1].padStart(2,'0')}`; }
    m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (m) { const yr = m[3].length===2?'20'+m[3]:m[3]; return `${yr}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; }
    return null;
  }

  // Match transaction-start markers. Captures: action, name, type, amount (last two optional inline).
  // Covers older "Paid to / Received from" and newer "Sent to / Money received from" wording.
  const TX_RE = /(Paid to|Sent to|Money sent to|Received from|Money received from|Transfer to|Payment to|Mobile recharged|FASTag Recharge for)\s+(.+?)(?:\s+(DEBIT|CREDIT))?(?:\s*(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?))?\s*$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(TX_RE);
    if (!m) continue;

    const action = m[1].toLowerCase();
    let merchant = m[2].trim();
    let type = /received|credited/.test(action) ? 'income' : 'expense';
    let amount = null;

    if (m[3]) type = m[3].toUpperCase() === 'CREDIT' ? 'income' : 'expense';
    if (m[4]) amount = parseFloat(m[4].replace(/,/g,''));

    // If type/amount missing, scan the surrounding window (±5 lines)
    if (!amount || !m[3]) {
      for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 6); j++) {
        if (j === i) continue;
        const near = lines[j];
        if (!amount) {
          const a = near.match(/(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i);
          if (a) { const v = parseFloat(a[1].replace(/,/g,'')); if (v > 0) amount = v; }
        }
        if (!m[3]) {
          if (/\bCREDIT\b/.test(near)) type = 'income';
          else if (/\bDEBIT\b/.test(near)) type = 'expense';
        }
      }
    }

    if (!amount || amount <= 0) continue;

    // Clean trailing DEBIT/CREDIT/₹amount stuck to the name
    merchant = merchant
      .replace(/\s+(DEBIT|CREDIT)\s*₹?\s*[\d,.]*\s*$/i, '')
      .replace(/\s*₹\s*[\d,.]+\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!merchant) continue;

    // Find date — check current line first, then walk backward ±8 lines
    let date = parseUpiDate(line);
    if (!date) {
      for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
        date = parseUpiDate(lines[j]);
        if (date) break;
      }
    }
    if (!date) date = today();

    const lo = merchant.toLowerCase();
    const category = smsCategoryGuess(lo, lo, type);

    // Use Transaction ID (if present in next few lines) as a stable dedupe key
    let txId = null;
    for (let j = i; j < Math.min(lines.length, i + 5); j++) {
      const t = lines[j].match(/Transaction ID\s+(\S+)/i);
      if (t) { txId = t[1]; break; }
    }

    results.push({ type, amount, date, description: merchant, category, _txId: txId });
  }

  // Dedupe by Transaction ID when available, otherwise by amount|date|description
  const seen = new Set();
  return results.filter(r => {
    const key = r._txId || `${r.amount}|${r.date}|${r.description}`;
    if (seen.has(key)) return false;
    seen.add(key);
    delete r._txId;
    return true;
  });
}

function renderPdfResults() {
  const list = document.getElementById('pdf-results-list');
  const wrap = document.getElementById('pdf-results-wrap');
  if (!list || !wrap) return;
  list.innerHTML = _pdfResults.map((r, i) => `
    <div id="pdf-card-${i}" style="background:var(--card-bg);border:1px solid var(--glass-border);border-radius:12px;padding:12px;margin-bottom:10px;position:relative">
      <button onclick="removePdfResult(${i})" title="Remove" style="position:absolute;top:8px;right:10px;background:rgba(239,68,68,0.12);border:none;color:#ef4444;border-radius:6px;cursor:pointer;padding:2px 9px;font-size:13px;line-height:1.6">✕</button>
      <div style="display:grid;grid-template-columns:auto 1fr 1fr;gap:8px;margin-bottom:8px;padding-right:36px">
        <select class="form-input" id="pf-type-${i}" onchange="updatePdfSummary()" style="font-size:12px;padding:4px 8px">
          <option value="expense" ${r.type==='expense'?'selected':''}>❤️ Expense</option>
          <option value="income"  ${r.type==='income' ?'selected':''}>💚 Income</option>
        </select>
        <input type="number" class="form-input" id="pf-amount-${i}" value="${r.amount}" step="0.01" min="0"
          oninput="updatePdfSummary()" style="font-size:13px;font-weight:700;padding:4px 8px"/>
        <input type="date" class="form-input" id="pf-date-${i}" value="${r.date}" style="font-size:12px;padding:4px 8px"/>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <select class="form-input" id="pf-cat-${i}" style="font-size:12px;padding:4px 8px">${_makeSrCatOptions(r.category)}</select>
        <input type="text" class="form-input" id="pf-desc-${i}" value="${(r.description||'').replace(/"/g,'&quot;')}" placeholder="Description" style="font-size:12px;padding:4px 8px"/>
      </div>
    </div>`).join('');
  wrap.style.display = '';
  updatePdfSummary();
}

function removePdfResult(i) {
  const card = document.getElementById(`pdf-card-${i}`);
  if (card) card.style.display = 'none';
  updatePdfSummary();
}

function updatePdfSummary() {
  let totalExpense = 0, totalIncome = 0, count = 0;
  _pdfResults.forEach((_, i) => {
    const card = document.getElementById(`pdf-card-${i}`);
    if (!card || card.style.display === 'none') return;
    const type   = document.getElementById(`pf-type-${i}`)?.value;
    const amount = parseFloat(document.getElementById(`pf-amount-${i}`)?.value) || 0;
    if (type === 'expense') totalExpense += amount; else totalIncome += amount;
    count++;
  });
  const el = document.getElementById('pdf-summary');
  if (!el) return;
  if (!count) { el.innerHTML = '<span style="color:var(--text3)">No transactions selected</span>'; return; }
  const parts = [];
  if (totalExpense > 0) parts.push(`<span style="color:#ef4444">💸 Expense: ₹${totalExpense.toLocaleString('en-IN',{minimumFractionDigits:2})}</span>`);
  if (totalIncome  > 0) parts.push(`<span style="color:#10b981">💰 Income: ₹${totalIncome.toLocaleString('en-IN',{minimumFractionDigits:2})}</span>`);
  el.innerHTML = `${parts.join(' &nbsp;·&nbsp; ')} &nbsp;·&nbsp; <span style="color:var(--text2)">${count} transaction${count>1?'s':''}</span>`;
}

function saveAllPdfTx() {
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const toSave  = [];
  _pdfResults.forEach((_, i) => {
    const card = document.getElementById(`pdf-card-${i}`);
    if (!card || card.style.display === 'none') return;
    const type     = document.getElementById(`pf-type-${i}`)?.value;
    const amount   = parseFloat(document.getElementById(`pf-amount-${i}`)?.value);
    const date     = document.getElementById(`pf-date-${i}`)?.value || today();
    const category = document.getElementById(`pf-cat-${i}`)?.value;
    const desc     = document.getElementById(`pf-desc-${i}`)?.value?.trim() || '';
    if (!amount || amount <= 0) return;
    const icon = allCats.find(c => c.name === category)?.icon || '💳';
    toSave.push({ id: genId(), type, amount, date, category, icon, description: desc, createdAt: new Date().toISOString() });
  });
  if (!toSave.length) { toast('No valid transactions to save', 'error'); return; }
  STATE.transactions = STATE.transactions || [];
  [...toSave].reverse().forEach(tx => STATE.transactions.unshift(tx));
  saveState();
  if (typeof addXP === 'function') addXP(10 * toSave.length, `${toSave.length} PDF transaction${toSave.length>1?'s':''} imported`);
  if (typeof autoSyncGoals === 'function') autoSyncGoals();
  closeModal();
  toast(`${toSave.length} transaction${toSave.length>1?'s':''} imported from PDF! 🎉`, 'success');
  refreshFinancePage();
}
