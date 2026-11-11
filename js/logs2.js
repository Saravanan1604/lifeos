// ============================================================
//  logs2.js — build 721
//  • New history card for Banks / Cash / Cards (app): newest first,
//    one row per account per day, signed changes, plain-language
//    reason, real card usage % (can exceed 100), tap to see entries.
//  • Tidy old log entries (one per account per day after 60 days).
//  • Storage meter + a clear warning when a save fails.
// ============================================================
const _LG = {
  bank: { key: 'bankBalanceHistory', idF: 'accountId', val: 'balance', prev: 'prevBalance', accts: () => STATE.bankAccounts || [], name: a => a.bankName || a.name || 'Bank', sel: () => bankTrackerAccount, title: 'Balance history', chat: 'balance-chat', ic: 'landmark',
          add: id => `openQuickBalanceModal(${id ? `'${id}'` : ''})`, del: 'deleteBankHistoryEntry', empty: 'No balance updates yet. Tap Update to log what your bank app shows.' },
  cash: { key: 'cashBalanceHistory', idF: 'accountId', val: 'balance', prev: 'prevBalance', accts: () => STATE.cashAccounts || [], name: a => a.name || 'Cash', sel: () => bankTrackerCash, title: 'Cash history', chat: 'cash-chat', ic: 'wallet',
          add: id => `openQuickCashModal(${id ? `'${id}'` : ''})`, del: 'deleteCashHistoryEntry', empty: 'No cash updates yet. Tap Update to log the cash you have.' },
  card: { key: 'creditCardHistory', idF: 'cardId', val: 'outstanding', prev: 'prevOutstanding', accts: () => STATE.creditCards || [], name: a => a.bankName || a.name || 'Card', sel: () => bankTrackerCard, title: 'Card dues history', chat: 'cc-chat', ic: 'credit-card',
          add: id => `openUpdateCCModal('${id || ((STATE.creditCards || [])[0] || {}).id || ''}')`, del: 'deleteCCHistoryEntry', empty: 'No card updates yet. Tap Update after a payment or a new statement.' },
};
let _lgLimit = 30;
const _lgE = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// Plain-language reason for one log entry
function _lgWhy(h) {
  const n = h.note || '';
  let m;
  if (h.merged) return `${h.merged} changes that day`;
  if ((m = n.match(/Income: (.*) \(₹/))) return 'Income · ' + m[1];
  if ((m = n.match(/Expense: (.*) \(₹/))) return 'Spent · ' + m[1];
  if ((m = n.match(/Transfer in ← (.*)/))) return 'Transfer in from ' + m[1];
  if ((m = n.match(/Transfer out → (.*)/))) return 'Transfer out to ' + m[1];
  if (h.via === 'import') return 'Imported' + (n ? ' · ' + n : '');
  if (/voice/i.test(n)) return 'Updated by voice';
  if (!n || n === 'Manual update') return h[('prevBalance' in h) ? 'prevBalance' : 'prevOutstanding'] == null ? 'Starting balance' : 'Balance typed in';
  return n;
}
function _lgDelta(kind, d) {
  if (d == null) return '';
  if (Math.abs(d) < 0.005) return '<em class="same">No change</em>';
  const up = d > 0, good = kind === 'card' ? !up : up;
  const word = kind === 'card' ? (up ? 'more due' : 'paid off') : (up ? 'more' : 'less');
  return `<em class="${good ? 'good' : 'bad'}">${up ? '▲ +' : '▼ −'}${fmt(Math.abs(d))} ${word}</em>`;
}
function logCardApp(kind) {
  const L = _LG[kind], selId = L.sel(), accts = L.accts();
  const byId = {}; accts.forEach(a => { byId[a.id] = a; });
  const all = (STATE[L.key] || []).filter(h => h && (!selId || h[L.idF] === selId));
  const order = (a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || '').localeCompare(b.createdAt || '');
  const groups = {};   // date|acct → entries (oldest → newest)
  all.slice().sort(order).forEach(h => { const k = h.date + '|' + h[L.idF]; (groups[k] = groups[k] || []).push(h); });
  const keys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  const days = [...new Set(keys.map(k => k.split('|')[0]))];
  const showDays = new Set(days.slice(0, _lgLimit));
  const td = Money.ymd(new Date()), y = new Date(); y.setDate(y.getDate() - 1); const yd = Money.ymd(y);
  const dayLbl = d => d === td ? 'Today' : d === yd ? 'Yesterday' : new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: d.slice(0, 4) === td.slice(0, 4) ? undefined : 'numeric' });
  const sub = (h, i, date) => { const p = h[L.prev], d = p == null ? null : h[L.val] - p;
    return `<div class="lg-e"><span class="lg-e-t">${typeof _logTimeLabel === 'function' ? _logTimeLabel(h) : ''}</span><span class="lg-e-w">${_lgE(_lgWhy(h))}</span>
      <span class="lg-e-v">${fmt(h[L.val])}${_lgDelta(kind, d)}</span>
      <button onclick="event.stopPropagation();if(confirm('Remove this entry from the history?'))${L.del}('${h.id || ''}','${date}',${i})" aria-label="Remove"><i data-lucide="x"></i></button></div>`; };
  let html = '', lastDay = '';
  keys.forEach(k => {
    const [date, aid] = k.split('|'); if (!showDays.has(date)) return;
    const g = groups[k], a = byId[aid], first = g[0], last = g[g.length - 1];
    const d = first[L.prev] == null ? null : last[L.val] - first[L.prev];
    const col = (a && a.color) || '#8B5CF6';
    let extra = '';
    if (kind === 'card' && a && +a.limit > 0) { const pct = Math.round(last[L.val] / a.limit * 100), over = last[L.val] - a.limit;
      extra = `<span class="lg-use ${pct > 100 ? 'over' : pct > 80 ? 'high' : ''}"><i style="width:${Math.min(100, pct)}%"></i></span><small class="lg-use-t ${pct > 100 ? 'over' : ''}">${pct}% of ${fmt(a.limit)} limit${over > 0 ? ' · over by ' + fmt(Math.round(over)) : ''}</small>`; }
    if (date !== lastDay) { html += `<p class="lg-day">${dayLbl(date)}</p>`; lastDay = date; }
    html += `<details class="lg-row"><summary>
        <span class="lg-ic" style="--c:${col}"><i data-lucide="${L.ic}"></i></span>
        <span class="lg-m"><b>${_lgE(a ? L.name(a) : 'Removed account')}</b><small>${g.length > 1 ? `${g.length} changes · tap to see` : _lgE(_lgWhy(last))}</small>${extra}</span>
        <span class="lg-r"><b>${fmt(last[L.val])}</b>${_lgDelta(kind, d)}</span>
      </summary><div class="lg-sub">${g.slice().reverse().map((h, i) => sub(h, g.length - 1 - i, date)).join('')}</div></details>`;
  });
  const selA = selId ? byId[selId] : null;
  return `<div class="lgx" data-kind="${kind}">
    <div class="lg-head"><div><b>${L.title}</b><small>${selA ? _lgE(L.name(selA)) : 'All accounts'} · ${all.length} ${all.length === 1 ? 'entry' : 'entries'} · newest first</small></div>
      <button onclick="${L.add(selId)}"><i data-lucide="plus"></i>Update</button></div>
    ${keys.length ? html : `<p class="lg-empty">${L.empty}</p>`}
    ${days.length > _lgLimit ? `<button class="lg-more" onclick="_lgLimit+=60;renderBankTracker()">Show older (${days.length - _lgLimit} more days)</button>` : ''}
  </div>`;
}
(function () {
  if (!window.__IS_APP) return;
  function swap() {
    const kind = bankTrackerTab === 'cards' ? 'card' : bankTrackerTab === 'cash' ? 'cash' : 'bank';
    const chat = document.getElementById(_LG[kind].chat); if (!chat || !chat.parentElement) return;
    const host = chat.parentElement, pc = document.getElementById('page-container');
    host.className = 'lg-host'; host.removeAttribute('style');
    host.innerHTML = logCardApp(kind);
    const z = pc ? (parseFloat(getComputedStyle(pc).zoom) || 1) : 1; host.style.zoom = (1 / z).toFixed(4);
    if (typeof _lucideRefresh === 'function') _lucideRefresh();
  }
  ['renderBankTracker', 'renderCCTracker', 'renderCashTracker'].forEach(fn => {
    const f = window[fn]; if (typeof f !== 'function') return;
    window[fn] = function () { const r = f.apply(this, arguments); try { swap(); } catch (e) { console.log('log card', e); } return r; };
  });
})();

// ── Tidy old entries: after `days`, keep one entry per account per day ──
// The kept entry is that day's closing value, so balances and trend charts
// don't change. Returns how many entries were removed.
function tidyLogs(days) {
  const cut = new Date(); cut.setDate(cut.getDate() - (days == null ? 60 : days)); const cutS = Money.ymd(cut);
  let removed = 0;
  Object.values(_LG).forEach(L => {
    const arr = STATE[L.key]; if (!Array.isArray(arr) || !arr.length) return;
    const order = (a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || '').localeCompare(b.createdAt || '');
    const groups = {}, keep = [];
    arr.slice().sort(order).forEach(h => { if (!h || !h.date || h.date >= cutS) { keep.push(h); return; } (groups[h.date + '|' + h[L.idF]] = groups[h.date + '|' + h[L.idF]] || []).push(h); });
    Object.values(groups).forEach(g => {
      if (g.length === 1) { keep.push(g[0]); return; }
      const last = { ...g[g.length - 1] };
      last[L.prev] = g[0][L.prev]; last.merged = g.reduce((n, h) => n + (h.merged || 1), 0); delete last.txId; last.note = '';
      keep.push(last); removed += g.length - 1;
    });
    if (removed) STATE[L.key] = keep.sort(order);
  });
  if (removed) saveState();
  return removed;
}
function tidyLogsNow() {
  const n = tidyLogs(60);
  toast(n ? `Tidied ${n} old log entries` : 'Logs are already tidy', 'success');
  if (document.getElementById('modal-overlay')) { try { openStorage(); } catch (_) {} }
}

// ── Storage meter ───────────────────────────────────────────
const _ST_LIMIT = 5000000;   // browsers allow about 5 million characters per site
function storageInfo() {
  const len = v => { try { return JSON.stringify(v || []).length; } catch (_) { return 0; } };
  let total = 0; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); total += k.length + (localStorage.getItem(k) || '').length; } } catch (_) {}
  const tx = STATE.transactions || [];
  const receipts = tx.reduce((s, t) => s + (t.receipt ? t.receipt.length : 0), 0) + (STATE.purchases || []).reduce((s, p) => s + (p.receipt ? String(p.receipt).length : 0), 0);
  const logs = len(STATE.bankBalanceHistory) + len(STATE.creditCardHistory) + len(STATE.cashBalanceHistory);
  const txs = len(tx) - receipts, main = len(STATE);
  return { total, pct: Math.round(total / _ST_LIMIT * 100), parts: [['Transactions', txs], ['Receipt photos', receipts], ['Balance & card logs', logs], ['Everything else', Math.max(0, total - txs - receipts - logs)]], main,
    logCount: (STATE.bankBalanceHistory || []).length + (STATE.creditCardHistory || []).length + (STATE.cashBalanceHistory || []).length, receiptCount: tx.filter(t => t.receipt).length };
}
function openStorage() {
  const S = storageInfo(), mb = v => (v / 1048576).toFixed(v < 104857 ? 2 : 1) + ' MB';
  const tone = S.pct >= 90 ? 'exp' : S.pct >= 70 ? 'warn' : 'inc';
  openModal('Storage on this phone', `<div class="sg">
    <div class="sg-top t-${tone}"><b>${S.pct}%</b><span>used · ${mb(S.total)} of about ${mb(_ST_LIMIT)}</span></div>
    <span class="sg-bar"><i class="t-${tone}" style="width:${Math.min(100, Math.max(2, S.pct))}%"></i></span>
    ${DB.lastSaveOk === false ? '<p class="sg-warn">The last save on this phone failed. Free some space below, then make any small change to save again.</p>' : ''}
    <div class="sg-list">${S.parts.map(([l, v]) => `<div><span>${l}</span><b>${mb(v)}</b></div>`).join('')}</div>
    <p class="sg-note">Your data is kept in this phone's browser storage, which has a fixed limit. If it fills up, new entries can't be saved on the phone.</p>
    <button class="sg-btn" onclick="tidyLogsNow()"><i data-lucide="list-collapse"></i><span><b>Tidy old log entries</b><small>${S.logCount.toLocaleString('en-IN')} entries · keeps one per account per day after 60 days. Balances don't change.</small></span></button>
    ${S.receiptCount ? `<button class="sg-btn" onclick="removeOldReceipts()"><i data-lucide="image-minus"></i><span><b>Remove receipt photos older than 1 year</b><small>${S.receiptCount} photos saved. The transactions stay.</small></span></button>` : ''}
    <button class="sg-btn" onclick="closeModal();openBackupChoice(typeof _canDriveApi==='function'&&_canDriveApi()?'gdrive':'drive')"><i data-lucide="cloud-upload"></i><span><b>Back up first</b><small>Save a copy before removing anything</small></span></button>
  </div>`);
  if (typeof _lucideRefresh === 'function') _lucideRefresh();
}
function removeOldReceipts() {
  const cut = new Date(); cut.setFullYear(cut.getFullYear() - 1); const cutS = Money.ymd(cut);
  const hit = (STATE.transactions || []).filter(t => t.receipt && Money.day(t) < cutS);
  if (!hit.length) { toast('No receipt photos older than 1 year', 'info'); return; }
  if (!confirm(`Remove ${hit.length} receipt photo${hit.length === 1 ? '' : 's'} from transactions older than 1 year? The transactions stay. This can't be undone.`)) return;
  hit.forEach(t => { t.receipt = ''; }); saveState(); toast(`Removed ${hit.length} photos`, 'success'); openStorage();
}
let _saveFailShown = 0;
function storageSaveFailed() {
  if (Date.now() - _saveFailShown < 60000) return; _saveFailShown = Date.now();
  let b = document.getElementById('save-fail'); if (b) b.remove();
  b = document.createElement('div'); b.id = 'save-fail';
  b.innerHTML = `<span><b>Couldn't save on this phone</b> — storage is full. Your last change may be lost if you close the app.</span><button onclick="this.parentElement.remove();openStorage()">Free space</button>`;
  document.body.appendChild(b);
}
// once a day: tidy entries older than 60 days, and warn when storage is nearly full
(function () {
  if (typeof isDemoMode === 'function' && isDemoMode()) return;
  setTimeout(() => { try {
    const today = Money.ymd(new Date());
    if (localStorage.getItem('lifeos_tidy_day') !== today) { localStorage.setItem('lifeos_tidy_day', today); tidyLogs(60); }
    const p = storageInfo().pct; if (p >= 85 && typeof toast === 'function') toast(`Phone storage for atworth is ${p}% full — open Settings › Storage`, 'warning');
  } catch (_) {} }, 8000);
})();
