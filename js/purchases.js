// ============================================================
//  Purchases — log what you buy with full detail: category, name,
//  variant/model, amount, purchase date, warranty end (with reminder),
//  bill no., seller/shop, payment mode and notes. Data lives in
//  STATE.purchases. Routed as 'purchases'.
// ============================================================

const PURCHASE_PAYMODES = ['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Net Banking', 'EMI', 'Cheque', 'Other'];

function _purchaseList() { STATE.purchases = Array.isArray(STATE.purchases) ? STATE.purchases : []; return STATE.purchases; }

// Coloured "due / expired / left" pill for a date (warranty end). Also used by
// the asset-detail page (expected sell / return date) — kept here so it stays
// defined app-wide.
function _trkDueBadge(dueStr) {
  if (!dueStr) return '';
  const due = new Date(dueStr + 'T00:00:00');
  if (isNaN(due)) return '';
  const days = Math.ceil((due - new Date()) / 86400000);
  let txt, col;
  if (days < 0) { txt = `Expired ${Math.abs(days)}d ago`; col = '#ef4444'; }
  else if (days === 0) { txt = 'Expires today'; col = '#ef4444'; }
  else if (days <= 30) { txt = `Warranty ${days}d`; col = '#f59e0b'; }
  else { txt = `${days}d warranty`; col = '#10b981'; }
  return `<span style="font-size:11px;font-weight:700;color:${col};background:${col}1a;padding:3px 10px;border-radius:20px;white-space:nowrap">${txt}</span>`;
}

function renderPurchases() {
  const container = document.getElementById('page-container');
  if (!container) return;
  const items = [..._purchaseList()].sort((a, b) => (b.date || '') < (a.date || '') ? -1 : 1);
  const total = items.reduce((s, p) => s + (+p.amount || 0), 0);
  const underWarranty = items.filter(p => { if (!p.warrantyEnd) return false; const d = new Date(p.warrantyEnd + 'T00:00:00'); return !isNaN(d) && d >= new Date(); }).length;

  const row = (p) => {
    const col = (typeof catColor === 'function') ? catColor(p.category) : '#6366f1';
    const ic = (typeof catIconHtml === 'function' && p.category) ? catIconHtml(p.category) : '🛍️';
    const sub = [p.category, p.model, p.seller, p.date ? fmtDate(p.date) : ''].filter(Boolean).join(' · ');
    return `<div class="glass-card" onclick="openPurchaseModal('${p.id}')" style="display:flex;align-items:center;gap:14px;padding:14px 16px;margin-bottom:10px;cursor:pointer">
      <span style="width:46px;height:46px;border-radius:13px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px;background:${col}1a;color:${col}">${ic}</span>
      <div style="flex:1;min-width:0">
        <p style="margin:0;font-weight:700;font-size:16px;color:var(--text1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.name || 'Untitled')}</p>
        ${sub ? `<p style="margin:3px 0 0;font-size:12.5px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(sub)}</p>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">
        ${(+p.amount) ? `<b style="font-size:16px;color:var(--text1)">${fmt(+p.amount)}</b>` : ''}
        ${_trkDueBadge(p.warrantyEnd)}
      </div>
    </div>`;
  };

  container.innerHTML = `
    <div class="fade-in" style="max-width:760px;margin:0 auto">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div><h1 class="page-title">🛍️ Purchases</h1><p class="page-subtitle">Everything you bought — with warranty, bill & shop details</p></div>
        <button class="btn-primary" onclick="openPurchaseModal()" style="white-space:nowrap">+ Add Purchase</button>
      </div>

      ${items.length ? `
      <div class="glass-card" style="display:flex;gap:22px;flex-wrap:wrap;padding:16px 20px;margin-bottom:16px">
        <div><p style="margin:0;font-size:12px;color:var(--text3)">ITEMS</p><p style="margin:2px 0 0;font-size:22px;font-weight:800;color:var(--text1)">${items.length}</p></div>
        <div><p style="margin:0;font-size:12px;color:var(--text3)">TOTAL SPENT</p><p style="margin:2px 0 0;font-size:22px;font-weight:800;color:#6366f1">${fmt(total)}</p></div>
        ${underWarranty ? `<div><p style="margin:0;font-size:12px;color:var(--text3)">IN WARRANTY</p><p style="margin:2px 0 0;font-size:22px;font-weight:800;color:#10b981">${underWarranty}</p></div>` : ''}
      </div>
      ${items.map(row).join('')}
      ` : `
      <div class="glass-card" style="padding:48px 20px;text-align:center">
        <p style="font-size:40px;margin:0 0 10px">🛍️</p>
        <p style="margin:0 0 16px;color:var(--text2)">No purchases yet.</p>
        <button class="btn-primary" onclick="openPurchaseModal()">+ Add your first</button>
      </div>`}
    </div>`;
  if (typeof _lucideRefresh === 'function') _lucideRefresh();
}

function _purchaseCatOptions(sel) {
  // Spend-side categories only (exclude income-only ones like Salary/Interest).
  const cats = (typeof getAllCategories === 'function')
    ? getAllCategories().filter(c => c.type !== 'income').map(c => c.name) : [];
  const uniq = [...new Set(cats.length ? cats : ['Shopping', 'Electronics', 'Appliances', 'Furniture', 'Bills', 'Other'])];
  if (sel && !uniq.includes(sel)) uniq.unshift(sel);
  return `<option value="">—</option>` + uniq.map(c => `<option value="${esc(c)}" ${sel === c ? 'selected' : ''}>${esc(c)}</option>`).join('');
}

function openPurchaseModal(id) {
  const p = id ? _purchaseList().find(x => x.id === id) : null;
  if (id && !p) return;
  const v = (k, d = '') => (p && p[k] != null) ? p[k] : d;
  openModal(`🛍️ ${id ? 'Edit' : 'Add'} Purchase`, `
    <div class="form-group" style="margin-bottom:12px"><label class="form-label">Name *</label>
      <input type="text" id="pu-name" class="form-input" value="${esc(String(v('name')))}" placeholder="e.g. LG Washing Machine"/></div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Category</label>
        <select id="pu-cat" class="form-input">${_purchaseCatOptions(v('category'))}</select></div>
      <div class="form-group"><label class="form-label">Variant / Model</label>
        <input type="text" id="pu-model" class="form-input" value="${esc(String(v('model')))}" placeholder="e.g. T65SKSF4Z"/></div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Amount (₹)</label>
        <input type="number" id="pu-amount" class="form-input" value="${p ? esc(String(v('amount'))) : ''}" placeholder="0" step="0.01"/></div>
      <div class="form-group"><label class="form-label">Payment mode</label>
        <select id="pu-paymode" class="form-input"><option value="">—</option>${PURCHASE_PAYMODES.map(m => `<option value="${m}" ${v('payMode') === m ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Purchase date</label>
        <input type="date" id="pu-date" class="form-input" value="${esc(String(v('date', (typeof today === 'function' ? today() : ''))))}"/></div>
      <div class="form-group"><label class="form-label">Warranty end</label>
        <input type="date" id="pu-warranty" class="form-input" value="${esc(String(v('warrantyEnd')))}"/></div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Bill no.</label>
        <input type="text" id="pu-bill" class="form-input" value="${esc(String(v('billNo')))}" placeholder="Invoice #"/></div>
      <div class="form-group"><label class="form-label">Seller / Shop</label>
        <input type="text" id="pu-seller" class="form-input" value="${esc(String(v('seller')))}" placeholder="e.g. Reliance Digital"/></div>
    </div>
    <div class="form-group" style="margin-bottom:12px"><label class="form-label">Notes</label>
      <input type="text" id="pu-notes" class="form-input" value="${esc(String(v('notes')))}" placeholder="Serial no., warranty card location…"/></div>
    <div class="modal-actions" style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
      ${id ? `<button class="btn-secondary" onclick="deletePurchase('${id}')" style="color:#ef4444;margin-right:auto">Delete</button>` : ''}
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="savePurchase('${id || ''}')">${id ? 'Save' : 'Add'}</button>
    </div>`);
}

function savePurchase(id) {
  const g = (i) => (document.getElementById(i)?.value || '').trim();
  const data = {
    name: g('pu-name'),
    category: g('pu-cat'),
    model: g('pu-model'),
    amount: +(document.getElementById('pu-amount')?.value) || 0,
    payMode: g('pu-paymode'),
    date: g('pu-date'),
    warrantyEnd: g('pu-warranty'),
    billNo: g('pu-bill'),
    seller: g('pu-seller'),
    notes: g('pu-notes'),
  };
  if (!data.name) { toast('Enter a name', 'error'); return; }
  const list = _purchaseList();
  if (id) {
    const p = list.find(x => x.id === id);
    if (p) Object.assign(p, data);
  } else {
    list.unshift(Object.assign({ id: genId(), createdAt: new Date().toISOString() }, data));
    if (typeof addXP === 'function') addXP(5, 'Purchase logged');
  }
  if (typeof saveState === 'function') saveState();
  closeModal();
  toast(id ? 'Purchase updated' : 'Purchase added', 'success');
  navigate('purchases', true);
}

function deletePurchase(id) {
  STATE.purchases = _purchaseList().filter(x => x.id !== id);
  if (typeof saveState === 'function') saveState();
  closeModal();
  toast('Purchase deleted', 'info');
  navigate('purchases', true);
}
