// ============================================================
//  Life Trackers — a small reusable framework for simple list
//  trackers shown under "More": Events, Purchases, Maintenance,
//  Warranty, Appliances, Insurance, Trips. Each is a list of items
//  with a shared schema; data lives in STATE.trackers[key].
//  Pages are routed as 'track-<key>' (see core.js navigate switch).
// ============================================================

const TRACKERS = {
  events: {
    label: 'Events', emoji: '🎉', color: '#ec4899', sub: 'Functions & occasions', sortBy: 'date',
    fields: [
      { k: 'title', label: 'Event', req: true, ph: 'e.g. Sister’s wedding' },
      { k: 'date', label: 'Date', type: 'date' },
      { k: 'amount', label: 'Budget / Spent', type: 'number' },
      { k: 'place', label: 'Venue' },
      { k: 'notes', label: 'Notes' },
    ],
  },
  purchases: {
    label: 'Purchases', emoji: '🛍️', color: '#3b82f6', sub: 'Things you bought', sortBy: 'date',
    fields: [
      { k: 'title', label: 'Item', req: true, ph: 'e.g. Sony headphones' },
      { k: 'amount', label: 'Price', type: 'number' },
      { k: 'date', label: 'Bought on', type: 'date' },
      { k: 'place', label: 'Store / Seller' },
      { k: 'notes', label: 'Notes' },
    ],
  },
  maintenance: {
    label: 'Maintenance', emoji: '🔧', color: '#f59e0b', sub: 'Service & upkeep', sortBy: 'due',
    fields: [
      { k: 'title', label: 'What', req: true, ph: 'e.g. Car service' },
      { k: 'date', label: 'Last done', type: 'date' },
      { k: 'dueDate', label: 'Next due', type: 'date' },
      { k: 'amount', label: 'Cost', type: 'number' },
      { k: 'place', label: 'Provider' },
      { k: 'notes', label: 'Notes' },
    ],
  },
  warranty: {
    label: 'Warranty', emoji: '🛡️', color: '#10b981', sub: 'Product warranties', sortBy: 'due',
    fields: [
      { k: 'title', label: 'Product', req: true, ph: 'e.g. LG Washing Machine' },
      { k: 'date', label: 'Purchased', type: 'date' },
      { k: 'dueDate', label: 'Warranty expires', type: 'date' },
      { k: 'amount', label: 'Price', type: 'number' },
      { k: 'place', label: 'Store / Brand' },
      { k: 'notes', label: 'Serial no. / Notes' },
    ],
  },
  appliances: {
    label: 'Appliances', emoji: '🔌', color: '#6366f1', sub: 'Devices you own', sortBy: 'due',
    fields: [
      { k: 'title', label: 'Appliance', req: true, ph: 'e.g. Refrigerator' },
      { k: 'date', label: 'Purchased', type: 'date' },
      { k: 'dueDate', label: 'Warranty expires', type: 'date' },
      { k: 'amount', label: 'Price', type: 'number' },
      { k: 'place', label: 'Brand / Model' },
      { k: 'notes', label: 'Serial no. / Notes' },
    ],
  },
  insurance: {
    label: 'Insurance', emoji: '☂️', color: '#06b6d4', sub: 'Policies & renewals', sortBy: 'due',
    fields: [
      { k: 'title', label: 'Policy', req: true, ph: 'e.g. Health — Star' },
      { k: 'date', label: 'Start date', type: 'date' },
      { k: 'dueDate', label: 'Renewal date', type: 'date' },
      { k: 'amount', label: 'Premium', type: 'number' },
      { k: 'place', label: 'Insurer' },
      { k: 'notes', label: 'Policy no. / Notes' },
    ],
  },
  trips: {
    label: 'Trips', emoji: '✈️', color: '#8b5cf6', sub: 'Travel & expenses', sortBy: 'date',
    fields: [
      { k: 'title', label: 'Destination', req: true, ph: 'e.g. Goa' },
      { k: 'date', label: 'Start', type: 'date' },
      { k: 'dueDate', label: 'Return', type: 'date' },
      { k: 'amount', label: 'Budget / Spent', type: 'number' },
      { k: 'place', label: 'With / Notes' },
      { k: 'notes', label: 'Notes' },
    ],
  },
};

function _trkKey(page) { return String(page || '').replace(/^track-/, ''); }
function _trkItems(key) { STATE.trackers = STATE.trackers || {}; return STATE.trackers[key] || (STATE.trackers[key] = []); }
function _trkSingular(label) { return label.replace(/s$/, '') || label; }

// A coloured "due in / expired / left" pill for items that have a dueDate.
function _trkDueBadge(dueStr) {
  if (!dueStr) return '';
  const due = new Date(dueStr + 'T00:00:00');
  if (isNaN(due)) return '';
  const days = Math.ceil((due - new Date()) / 86400000);
  let txt, col;
  if (days < 0) { txt = `Expired ${Math.abs(days)}d ago`; col = '#ef4444'; }
  else if (days === 0) { txt = 'Due today'; col = '#ef4444'; }
  else if (days <= 30) { txt = `Due in ${days}d`; col = '#f59e0b'; }
  else { txt = `${days}d left`; col = '#10b981'; }
  return `<span style="font-size:11px;font-weight:700;color:${col};background:${col}1a;padding:3px 10px;border-radius:20px;white-space:nowrap">${txt}</span>`;
}

function renderTracker(page) {
  const key = _trkKey(page);
  const cfg = TRACKERS[key];
  const container = document.getElementById('page-container');
  if (!cfg || !container) { if (container) container.innerHTML = '<p style="padding:40px;color:var(--text3)">Tracker not found</p>'; return; }

  const items = [..._trkItems(key)];
  const hasDue = cfg.sortBy === 'due';
  items.sort((a, b) => {
    if (hasDue) {
      const da = a.dueDate || '9999-12-31', db = b.dueDate || '9999-12-31';
      if (da !== db) return da < db ? -1 : 1;
    }
    return (b.date || '') < (a.date || '') ? -1 : 1;   // newest first
  });

  const total = items.reduce((s, it) => s + (+it.amount || 0), 0);
  const c = cfg.color;

  const row = (it) => {
    const sub = [it.place, it.date ? fmtDate(it.date) : ''].filter(Boolean).join(' · ');
    return `<div class="glass-card trk-row" onclick="openTrackerItemModal('${key}','${it.id}')"
        style="display:flex;align-items:center;gap:14px;padding:14px 16px;margin-bottom:10px;cursor:pointer">
      <span style="width:44px;height:44px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px;background:${c}1a">${cfg.emoji}</span>
      <div style="flex:1;min-width:0">
        <p style="margin:0;font-weight:700;font-size:15px;color:var(--text1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(it.title || 'Untitled')}</p>
        ${sub ? `<p style="margin:3px 0 0;font-size:12px;color:var(--text3)">${esc(sub)}</p>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">
        ${(+it.amount) ? `<b style="font-size:15px;color:var(--text1)">${fmt(+it.amount)}</b>` : ''}
        ${_trkDueBadge(it.dueDate)}
      </div>
    </div>`;
  };

  container.innerHTML = `
    <div class="fade-in" style="max-width:760px;margin:0 auto">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div>
          <h1 class="page-title">${cfg.emoji} ${cfg.label}</h1>
          <p class="page-subtitle">${cfg.sub}</p>
        </div>
        <button class="btn-primary" onclick="openTrackerItemModal('${key}')" style="white-space:nowrap">+ Add ${esc(_trkSingular(cfg.label))}</button>
      </div>

      ${items.length ? `
      <div class="glass-card" style="display:flex;gap:24px;padding:16px 20px;margin-bottom:16px">
        <div><p style="margin:0;font-size:12px;color:var(--text3)">ITEMS</p><p style="margin:2px 0 0;font-size:22px;font-weight:800;color:var(--text1)">${items.length}</p></div>
        ${total > 0 ? `<div><p style="margin:0;font-size:12px;color:var(--text3)">TOTAL</p><p style="margin:2px 0 0;font-size:22px;font-weight:800;color:${c}">${fmt(total)}</p></div>` : ''}
      </div>
      ${items.map(row).join('')}
      ` : `
      <div class="glass-card" style="padding:48px 20px;text-align:center">
        <p style="font-size:40px;margin:0 0 10px">${cfg.emoji}</p>
        <p style="margin:0 0 16px;color:var(--text2)">No ${cfg.label.toLowerCase()} yet.</p>
        <button class="btn-primary" onclick="openTrackerItemModal('${key}')">+ Add your first</button>
      </div>`}
    </div>`;

  if (typeof _lucideRefresh === 'function') _lucideRefresh();
}

function _trkField(f, item) {
  const v = (item && item[f.k] != null) ? String(item[f.k]) : '';
  const type = f.type || 'text';
  const common = `id="trk-${f.k}" class="form-input"`;
  let input;
  if (type === 'number') input = `<input type="number" ${common} value="${v ? esc(v) : ''}" placeholder="${f.ph || '0'}" step="0.01"/>`;
  else if (type === 'date') input = `<input type="date" ${common} value="${esc(v)}"/>`;
  else input = `<input type="text" ${common} value="${esc(v)}" placeholder="${f.ph || ''}"/>`;
  return `<div class="form-group" style="margin-bottom:12px"><label class="form-label">${f.label}${f.req ? ' *' : ''}</label>${input}</div>`;
}

function openTrackerItemModal(key, id) {
  const cfg = TRACKERS[key]; if (!cfg) return;
  const item = id ? _trkItems(key).find(x => x.id === id) : null;
  if (id && !item) return;
  openModal(`${cfg.emoji} ${id ? 'Edit' : 'Add'} ${_trkSingular(cfg.label)}`, `
    ${cfg.fields.map(f => _trkField(f, item)).join('')}
    <div class="modal-actions" style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
      ${id ? `<button class="btn-secondary" onclick="deleteTrackerItem('${key}','${id}')" style="color:#ef4444;margin-right:auto">Delete</button>` : ''}
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveTrackerItem('${key}','${id || ''}')">${id ? 'Save' : 'Add'}</button>
    </div>`);
}

function saveTrackerItem(key, id) {
  const cfg = TRACKERS[key]; if (!cfg) return;
  const data = {};
  cfg.fields.forEach(f => {
    const el = document.getElementById('trk-' + f.k);
    let val = el ? el.value.trim() : '';
    if (f.type === 'number') val = val === '' ? '' : (+val || 0);
    data[f.k] = val;
  });
  if (!data.title) { toast('Enter a name', 'error'); return; }

  const list = _trkItems(key);
  if (id) {
    const it = list.find(x => x.id === id);
    if (it) Object.assign(it, data);
  } else {
    list.unshift(Object.assign({ id: genId(), createdAt: new Date().toISOString() }, data));
    if (typeof addXP === 'function') addXP(5, `${_trkSingular(cfg.label)} added`);
  }
  if (typeof saveState === 'function') saveState();
  closeModal();
  toast(`${_trkSingular(cfg.label)} ${id ? 'updated' : 'added'}`, 'success');
  navigate('track-' + key, true);
}

function deleteTrackerItem(key, id) {
  const cfg = TRACKERS[key]; if (!cfg) return;
  STATE.trackers = STATE.trackers || {};
  STATE.trackers[key] = (_trkItems(key)).filter(x => x.id !== id);
  if (typeof saveState === 'function') saveState();
  closeModal();
  toast(`${_trkSingular(cfg.label)} deleted`, 'info');
  navigate('track-' + key, true);
}
