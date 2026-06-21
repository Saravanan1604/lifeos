// ============================================================
//  Split — split a bill with friends/family and track who owes whom.
//  Equal split among the named people; the payer is owed by the rest
//  (or you owe the payer if someone else paid). Settle per person.
//  Data: STATE.splits. Routed as 'split'. Self-contained — doesn't
//  touch your transactions/spending.
// ============================================================

function _splitList() { STATE.splits = Array.isArray(STATE.splits) ? STATE.splits : []; return STATE.splits; }
function _isMe(name) { return String(name || '').trim().toLowerCase() === 'me'; }

// Net effect of a split on YOU: + = you're owed, - = you owe, considering
// only unsettled shares.
function _splitMyNet(s) {
  let net = 0;
  (s.people || []).forEach(p => {
    if (p.paid || _isMe(p.name) === false && p.name === s.payer) return;
    if (p.name === s.payer) return;                 // payer doesn't owe themselves
    if (_isMe(s.payer) && !_isMe(p.name)) net += (+p.share || 0);   // they owe you
    if (!_isMe(s.payer) && _isMe(p.name)) net -= (+p.share || 0);   // you owe payer
  });
  return net;
}

function renderSplit() {
  const container = document.getElementById('page-container');
  if (!container) return;
  const splits = [..._splitList()].sort((a, b) => (b.date || '') < (a.date || '') ? -1 : 1);
  let owed = 0, owe = 0;
  splits.forEach(s => { const n = _splitMyNet(s); if (n > 0) owed += n; else owe += -n; });

  const row = (s) => {
    const net = _splitMyNet(s);
    const allPaid = (s.people || []).filter(p => p.name !== s.payer).every(p => p.paid);
    const netTxt = allPaid ? 'Settled' : net > 0 ? `you're owed ${fmt(net)}` : net < 0 ? `you owe ${fmt(-net)}` : '—';
    const col = allPaid ? 'var(--text3)' : net > 0 ? '#10b981' : '#ef4444';
    return `<div class="glass-card" onclick="openSplitDetail('${s.id}')" style="display:flex;align-items:center;gap:14px;padding:14px 16px;margin-bottom:10px;cursor:pointer">
      <span style="width:46px;height:46px;border-radius:13px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px;background:#6366f11a;color:#6366f1">🧾</span>
      <div style="flex:1;min-width:0">
        <p style="margin:0;font-weight:700;font-size:16px;color:var(--text1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.description || 'Split')}</p>
        <p style="margin:3px 0 0;font-size:12.5px;color:var(--text3)">${_isMe(s.payer) ? 'You paid' : esc(s.payer) + ' paid'} ${fmt(s.amount)} · ${(s.people || []).length} people${s.date ? ' · ' + fmtDate(s.date) : ''}</p>
      </div>
      <span style="font-size:13px;font-weight:700;color:${col};white-space:nowrap;flex-shrink:0">${netTxt}</span>
    </div>`;
  };

  container.innerHTML = `
    <div class="fade-in" style="max-width:760px;margin:0 auto">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div><h1 class="page-title">🧾 Split</h1><p class="page-subtitle">Split bills with friends & family — who owes whom</p></div>
        <button class="btn-primary" onclick="openSplitModal()" style="white-space:nowrap">+ Add Split</button>
      </div>

      ${splits.length ? `
      <div class="glass-card" style="display:flex;gap:24px;flex-wrap:wrap;padding:18px 20px;margin-bottom:18px">
        <div><p style="margin:0;font-size:12px;color:var(--text3)">YOU'RE OWED</p><p style="margin:3px 0 0;font-size:24px;font-weight:900;color:#10b981">${fmt(owed)}</p></div>
        <div><p style="margin:0;font-size:12px;color:var(--text3)">YOU OWE</p><p style="margin:3px 0 0;font-size:24px;font-weight:900;color:#ef4444">${fmt(owe)}</p></div>
      </div>
      ${splits.map(row).join('')}
      ` : `
      <div class="glass-card" style="padding:48px 20px;text-align:center">
        <p style="font-size:40px;margin:0 0 10px">🧾</p>
        <p style="margin:0 0 16px;color:var(--text2)">No splits yet.</p>
        <button class="btn-primary" onclick="openSplitModal()">+ Split a bill</button>
      </div>`}
    </div>`;
  if (typeof _lucideRefresh === 'function') _lucideRefresh();
}

function openSplitModal() {
  openModal('🧾 Split a Bill', `
    <div class="form-group" style="margin-bottom:12px"><label class="form-label">What for? *</label>
      <input type="text" id="sp-desc" class="form-input" placeholder="e.g. Dinner at Santhi"/></div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Total amount (₹) *</label>
        <input type="number" id="sp-amount" class="form-input" placeholder="0" step="0.01"/></div>
      <div class="form-group"><label class="form-label">Date</label>
        <input type="date" id="sp-date" class="form-input" value="${typeof today === 'function' ? today() : ''}"/></div>
    </div>
    <div class="form-group" style="margin-bottom:12px"><label class="form-label">Paid by</label>
      <input type="text" id="sp-payer" class="form-input" value="Me" placeholder="Me, or a name"/></div>
    <div class="form-group" style="margin-bottom:6px"><label class="form-label">Split between (comma-separated)</label>
      <input type="text" id="sp-people" class="form-input" placeholder="Me, Ravi, Kumar"/></div>
    <p style="font-size:11px;color:var(--text3);margin:0 0 12px">Split equally. Include <b>Me</b> for your own share.</p>
    <div class="modal-actions" style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveSplit()">Add</button>
    </div>`);
}

function saveSplit() {
  const desc = (document.getElementById('sp-desc')?.value || '').trim();
  const amount = +(document.getElementById('sp-amount')?.value) || 0;
  const date = document.getElementById('sp-date')?.value || (typeof today === 'function' ? today() : '');
  const payer = (document.getElementById('sp-payer')?.value || 'Me').trim() || 'Me';
  let names = (document.getElementById('sp-people')?.value || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!names.some(n => n.toLowerCase() === payer.toLowerCase())) names.unshift(payer);
  names = [...new Map(names.map(n => [n.toLowerCase(), n])).values()];   // dedupe (case-insensitive)
  if (!desc) { toast('Enter what the bill is for', 'error'); return; }
  if (!amount || amount <= 0) { toast('Enter the total amount', 'error'); return; }
  if (names.length < 2) { toast('Add at least 2 people', 'error'); return; }

  const share = Math.round(amount / names.length);
  const people = names.map(n => ({ name: n, share, paid: false }));
  _splitList().unshift({ id: genId(), description: desc, amount, date, payer, people, createdAt: new Date().toISOString() });
  if (typeof addXP === 'function') addXP(5, 'Bill split');
  if (typeof saveState === 'function') saveState();
  closeModal();
  toast('Split added', 'success');
  navigate('split', true);
}

function openSplitDetail(id) {
  const s = _splitList().find(x => x.id === id);
  if (!s) return;
  const rows = (s.people || []).map((p, idx) => {
    const isPayer = p.name === s.payer;
    const relation = isPayer ? 'paid the bill' : _isMe(s.payer) ? (p.paid ? 'paid you back' : `owes you ${fmt(p.share)}`) : (_isMe(p.name) ? (p.paid ? 'you paid' : `you owe ${fmt(p.share)}`) : `owes ${esc(s.payer)} ${fmt(p.share)}`);
    return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 4px;border-bottom:1px solid var(--glass-border)">
      <div style="min-width:0"><p style="margin:0;font-weight:600;font-size:14px">${esc(p.name)}${isPayer ? ' 👑' : ''}</p>
        <p style="margin:2px 0 0;font-size:12px;color:${p.paid && !isPayer ? '#10b981' : 'var(--text3)'}">${relation}</p></div>
      ${isPayer ? `<b style="font-size:13px;color:var(--text3)">${fmt(p.share)}</b>` : `<button class="btn-secondary" onclick="toggleSplitPaid('${id}',${idx})" style="padding:7px 12px;font-size:12px;font-weight:700;border-radius:10px;${p.paid ? 'color:#10b981;border-color:rgba(16,185,129,0.4)' : ''}">${p.paid ? '✓ Settled' : 'Settle'}</button>`}
    </div>`;
  }).join('');
  openModal(`🧾 ${esc(s.description || 'Split')}`, `
    <div class="mr-pop">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-radius:12px;background:var(--glass);margin-bottom:10px">
        <span style="font-weight:700">${_isMe(s.payer) ? 'You' : esc(s.payer)} paid · ${fmt(Math.round(s.amount / (s.people || [1]).length))}/person</span><b style="font-size:18px;color:#6366f1">${fmt(s.amount)}</b></div>
      <div>${rows}</div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px">
        <button class="btn-secondary" onclick="deleteSplit('${id}')" style="color:#ef4444;margin-right:auto">Delete</button>
        <button class="btn-primary" onclick="closeModal()">Done</button>
      </div>
    </div>`);
}

function toggleSplitPaid(id, idx) {
  const s = _splitList().find(x => x.id === id);
  if (!s || !s.people || !s.people[idx]) return;
  s.people[idx].paid = !s.people[idx].paid;
  if (typeof saveState === 'function') saveState();
  openSplitDetail(id);
  if (typeof navigate === 'function') { /* keep modal open; list refreshes on close */ }
}

function deleteSplit(id) {
  STATE.splits = _splitList().filter(x => x.id !== id);
  if (typeof saveState === 'function') saveState();
  closeModal();
  toast('Split deleted', 'info');
  navigate('split', true);
}
