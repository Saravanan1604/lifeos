// ============================================================
//  Lending ledger — "money that's still mine".
//  Track money you lent (they owe you) or borrowed (you owe), with
//  per-person balances, due reminders and one-tap settle-up incl.
//  partial repayments. Data lives in STATE.lending. Routed as 'lending'.
//  Kept separate from transactions on purpose: lending isn't spending,
//  so it never touches your expense totals.
// ============================================================

function _lendList() { STATE.lending = Array.isArray(STATE.lending) ? STATE.lending : []; return STATE.lending; }
function _lendOutstanding(e) { return Math.max(0, (+e.amount || 0) - (+e.repaid || 0)); }
function _lendBadge(dueStr) { return (typeof _trkDueBadge === 'function') ? _trkDueBadge(dueStr) : ''; }

function renderLending() {
  const container = document.getElementById('page-container');
  if (!container) return;
  const all = _lendList();
  const open = all.filter(e => !e.settled);
  const settled = all.filter(e => e.settled);
  const out = open.filter(e => e.direction !== 'in');   // they owe me
  const inc = open.filter(e => e.direction === 'in');   // I owe them

  const totalReceive = out.reduce((s, e) => s + _lendOutstanding(e), 0);
  const totalOwe = inc.reduce((s, e) => s + _lendOutstanding(e), 0);
  const net = totalReceive - totalOwe;

  const row = (e) => {
    const outstanding = _lendOutstanding(e);
    const partial = (+e.repaid || 0) > 0 && outstanding > 0;
    const isOut = e.direction !== 'in';
    const col = isOut ? '#10b981' : '#ef4444';
    const settleLabel = isOut ? 'Received' : 'Paid';
    return `<div class="glass-card lend-row" style="display:flex;align-items:center;gap:14px;padding:14px 16px;margin-bottom:10px">
      <span style="width:44px;height:44px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:20px;background:${col}1a;color:${col}">${isOut ? '↗' : '↘'}</span>
      <div style="flex:1;min-width:0;cursor:pointer" onclick="openLendingModal('${e.id}')">
        <p style="margin:0;font-weight:700;font-size:15px;color:var(--text1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(e.person || 'Someone')}</p>
        <p style="margin:3px 0 0;font-size:12px;color:var(--text3)">${isOut ? 'Owes you' : 'You owe'}${e.date ? ' · ' + fmtDate(e.date) : ''}${e.note ? ' · ' + esc(e.note) : ''}</p>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">
        <b style="font-size:15px;color:${col}">${fmt(outstanding)}</b>
        ${partial ? `<span style="font-size:11px;color:var(--text3)">of ${fmt(+e.amount)}</span>` : ''}
        ${_lendBadge(e.dueDate)}
      </div>
      <button class="btn-secondary" onclick="openSettleModal('${e.id}')" style="flex-shrink:0;padding:8px 12px;font-size:12px;font-weight:700;border-radius:10px">${settleLabel}</button>
    </div>`;
  };

  const settledRow = (e) => `<div class="glass-card" style="display:flex;align-items:center;gap:12px;padding:10px 14px;margin-bottom:8px;opacity:.7">
    <span style="font-size:16px;color:#10b981">✓</span>
    <div style="flex:1;min-width:0"><p style="margin:0;font-weight:600;font-size:14px;color:var(--text2)">${esc(e.person || 'Someone')}</p>
    <p style="margin:2px 0 0;font-size:11px;color:var(--text3)">Settled${e.settledAt ? ' · ' + fmtDate(e.settledAt.slice(0, 10)) : ''}</p></div>
    <b style="font-size:14px;color:var(--text3)">${fmt(+e.amount)}</b>
    <button onclick="deleteLending('${e.id}')" title="Remove" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:16px">✕</button>
  </div>`;

  container.innerHTML = `
    <div class="fade-in" style="max-width:760px;margin:0 auto">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div><h1 class="page-title">🤝 Lending</h1><p class="page-subtitle">Money that's still yours — who owes you & who you owe</p></div>
        <button class="btn-primary" onclick="openLendingModal()" style="white-space:nowrap">+ Add</button>
      </div>

      <div class="glass-card" style="display:flex;gap:20px;flex-wrap:wrap;padding:18px 20px;margin-bottom:18px">
        <div><p style="margin:0;font-size:12px;color:var(--text3)">TO RECEIVE</p><p style="margin:3px 0 0;font-size:24px;font-weight:900;color:#10b981">${fmt(totalReceive)}</p></div>
        <div><p style="margin:0;font-size:12px;color:var(--text3)">YOU OWE</p><p style="margin:3px 0 0;font-size:24px;font-weight:900;color:#ef4444">${fmt(totalOwe)}</p></div>
        <div><p style="margin:0;font-size:12px;color:var(--text3)">NET</p><p style="margin:3px 0 0;font-size:24px;font-weight:900;color:${net >= 0 ? '#10b981' : '#ef4444'}">${net >= 0 ? '+' : '-'}${fmt(Math.abs(net))}</p></div>
      </div>

      ${out.length ? `<p class="section-title" style="margin:18px 2px 10px">↗ To Receive</p>${out.map(row).join('')}` : ''}
      ${inc.length ? `<p class="section-title" style="margin:18px 2px 10px">↘ You Owe</p>${inc.map(row).join('')}` : ''}
      ${(!out.length && !inc.length) ? `<div class="glass-card" style="padding:48px 20px;text-align:center">
        <p style="font-size:40px;margin:0 0 10px">🤝</p>
        <p style="margin:0 0 16px;color:var(--text2)">Nothing outstanding. Add money you lent or borrowed.</p>
        <button class="btn-primary" onclick="openLendingModal()">+ Add your first</button>
      </div>` : ''}

      ${settled.length ? `<p class="section-title" style="margin:24px 2px 10px;color:var(--text3)">Settled</p>${settled.slice(0, 20).map(settledRow).join('')}` : ''}
    </div>`;

  if (typeof _lucideRefresh === 'function') _lucideRefresh();
}

function openLendingModal(id) {
  const e = id ? _lendList().find(x => x.id === id) : null;
  if (id && !e) return;
  const v = (k, d) => (e && e[k] != null) ? e[k] : (d != null ? d : '');
  const dir = v('direction', 'out');
  openModal(`🤝 ${id ? 'Edit' : 'Add'} Lending`, `
    <div class="form-group" style="margin-bottom:12px"><label class="form-label">Direction</label>
      <select id="lend-dir" class="form-input">
        <option value="out" ${dir !== 'in' ? 'selected' : ''}>↗ I lent — they'll repay me</option>
        <option value="in"  ${dir === 'in' ? 'selected' : ''}>↘ I borrowed — I'll repay</option>
      </select></div>
    <div class="form-group" style="margin-bottom:12px"><label class="form-label">Person *</label>
      <input type="text" id="lend-person" class="form-input" value="${esc(String(v('person', '')))}" placeholder="e.g. Appa, Ravi"/></div>
    <div class="form-group" style="margin-bottom:12px"><label class="form-label">Amount *</label>
      <input type="number" id="lend-amount" class="form-input" value="${e ? esc(String(v('amount', ''))) : ''}" placeholder="5000" step="0.01"/></div>
    <div class="form-group" style="margin-bottom:12px"><label class="form-label">Date</label>
      <input type="date" id="lend-date" class="form-input" value="${esc(String(v('date', (typeof today === 'function' ? today() : ''))))}"/></div>
    <div class="form-group" style="margin-bottom:12px"><label class="form-label">Expected return (optional)</label>
      <input type="date" id="lend-due" class="form-input" value="${esc(String(v('dueDate', '')))}"/></div>
    <div class="form-group" style="margin-bottom:12px"><label class="form-label">Note</label>
      <input type="text" id="lend-note" class="form-input" value="${esc(String(v('note', '')))}" placeholder="What for?"/></div>
    <div class="modal-actions" style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
      ${id ? `<button class="btn-secondary" onclick="deleteLending('${id}')" style="color:#ef4444;margin-right:auto">Delete</button>` : ''}
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveLending('${id || ''}')">${id ? 'Save' : 'Add'}</button>
    </div>`);
}

function saveLending(id) {
  const person = (document.getElementById('lend-person')?.value || '').trim();
  const amount = +(document.getElementById('lend-amount')?.value) || 0;
  const direction = document.getElementById('lend-dir')?.value === 'in' ? 'in' : 'out';
  const date = document.getElementById('lend-date')?.value || (typeof today === 'function' ? today() : '');
  const dueDate = document.getElementById('lend-due')?.value || '';
  const note = (document.getElementById('lend-note')?.value || '').trim();
  if (!person) { toast('Enter a name', 'error'); return; }
  if (!amount || amount <= 0) { toast('Enter an amount', 'error'); return; }

  const list = _lendList();
  if (id) {
    const e = list.find(x => x.id === id);
    if (e) {
      Object.assign(e, { person, amount, direction, date, dueDate, note });
      if ((+e.repaid || 0) < amount) e.settled = false;   // re-opened if amount raised
    }
  } else {
    list.unshift({ id: genId(), person, amount, direction, date, dueDate, note, repaid: 0, settled: false, createdAt: new Date().toISOString() });
    if (typeof addXP === 'function') addXP(5, 'Lending logged');
  }
  if (typeof saveState === 'function') saveState();
  closeModal();
  toast(id ? 'Updated' : 'Added to lending ledger', 'success');
  navigate('lending', true);
}

function deleteLending(id) {
  STATE.lending = _lendList().filter(x => x.id !== id);
  if (typeof saveState === 'function') saveState();
  closeModal();
  toast('Removed', 'info');
  navigate('lending', true);
}

// ---- Settle-up: record a (partial or full) repayment ----
function openSettleModal(id) {
  const e = _lendList().find(x => x.id === id);
  if (!e) return;
  const outstanding = _lendOutstanding(e);
  const isOut = e.direction !== 'in';
  openModal(`${isOut ? 'Mark Received' : 'Mark Paid'}`, `
    <p style="font-size:13px;color:var(--text2);margin:0 0 14px">
      ${esc(e.person || 'Someone')} — outstanding <b style="color:${isOut ? '#10b981' : '#ef4444'}">${fmt(outstanding)}</b>${(+e.amount) !== outstanding ? ` of ${fmt(+e.amount)}` : ''}.
    </p>
    <div class="form-group" style="margin-bottom:14px"><label class="form-label">Amount ${isOut ? 'received' : 'paid'}</label>
      <input type="number" id="settle-amt" class="form-input" value="${outstanding}" step="0.01" min="0"/></div>
    <div class="modal-actions" style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="applySettle('${id}')">Confirm</button>
    </div>`);
}

function applySettle(id) {
  const e = _lendList().find(x => x.id === id);
  if (!e) return;
  const amt = +(document.getElementById('settle-amt')?.value) || 0;
  if (!amt || amt <= 0) { toast('Enter an amount', 'error'); return; }
  e.repaid = Math.min(+e.amount || 0, (+e.repaid || 0) + amt);
  if (_lendOutstanding(e) <= 0) { e.settled = true; e.settledAt = new Date().toISOString(); }
  if (typeof saveState === 'function') saveState();
  closeModal();
  toast(e.settled ? 'Settled in full 🎉' : `Recorded — ${fmt(_lendOutstanding(e))} left`, 'success');
  navigate('lending', true);
}
