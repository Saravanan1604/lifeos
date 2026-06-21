// ============================================================
//  Renewals & Expiry — one place for everything with a deadline:
//  product warranties (Purchases), insurance/FD/real-estate dates and
//  money-lent return dates (Assets). So nothing lapses unnoticed.
//  Routed as 'renewals'.
// ============================================================

function _renewBadge(dateStr) {
  if (!dateStr) return '';
  const due = new Date(dateStr + 'T00:00:00'); if (isNaN(due)) return '';
  const days = Math.ceil((due - new Date()) / 86400000);
  let txt, col;
  if (days < 0) { txt = `Overdue ${Math.abs(days)}d`; col = '#ef4444'; }
  else if (days === 0) { txt = 'Today'; col = '#ef4444'; }
  else if (days <= 30) { txt = `in ${days}d`; col = '#f59e0b'; }
  else { txt = `${days}d left`; col = '#10b981'; }
  return `<span style="font-size:11px;font-weight:700;color:${col};background:${col}1a;padding:3px 10px;border-radius:20px;white-space:nowrap;flex-shrink:0">${txt}</span>`;
}

function _renewalItems() {
  const items = [];
  // Warranties from Purchases
  (STATE.purchases || []).forEach(p => {
    if (!p.warrantyEnd) return;
    items.push({ date: p.warrantyEnd, name: p.name || 'Item', kind: 'Warranty ends', icon: '🛡️', color: '#10b981', open: `openPurchaseModal('${p.id}')` });
  });
  // Expected dates on assets (Money Lent return, Real Estate sell, etc.)
  (STATE.investments || []).forEach(i => {
    if (!i.expectedDate) return;
    const label = i.type === 'Money Lent' ? 'Money to receive' : i.type === 'Real Estate' ? 'Expected sell' : 'Expected';
    items.push({ date: i.expectedDate, name: i.name || i.type || 'Asset', kind: label, icon: '💰', color: '#6366f1', open: `openAssetDetail('${i.id}')` });
  });
  return items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function renderRenewals() {
  const container = document.getElementById('page-container');
  if (!container) return;
  const items = _renewalItems();
  const todayS = (typeof _ymdLocal === 'function') ? _ymdLocal(new Date()) : new Date().toISOString().slice(0, 10);
  const expired = items.filter(i => i.date < todayS);
  const upcoming = items.filter(i => i.date >= todayS);
  const in30 = (() => { const d = new Date(); d.setDate(d.getDate() + 30); return (typeof _ymdLocal === 'function') ? _ymdLocal(d) : d.toISOString().slice(0, 10); })();
  const soonCount = upcoming.filter(i => i.date <= in30).length;

  const row = (i) => `<div class="glass-card" onclick="${i.open}" style="display:flex;align-items:center;gap:14px;padding:14px 16px;margin-bottom:10px;cursor:pointer">
      <span style="width:46px;height:46px;border-radius:13px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px;background:${i.color}1a;color:${i.color}">${i.icon}</span>
      <div style="flex:1;min-width:0">
        <p style="margin:0;font-weight:700;font-size:16px;color:var(--text1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(i.name)}</p>
        <p style="margin:3px 0 0;font-size:12.5px;color:var(--text3)">${esc(i.kind)} · ${fmtDate(i.date)}</p>
      </div>
      ${_renewBadge(i.date)}
    </div>`;

  container.innerHTML = `
    <div class="fade-in" style="max-width:760px;margin:0 auto">
      <div class="page-header"><h1 class="page-title">🔔 Renewals & Expiry</h1>
        <p class="page-subtitle">Warranties, policies & dates — so nothing lapses</p></div>

      ${items.length ? `
      <div class="glass-card" style="display:flex;gap:24px;flex-wrap:wrap;padding:18px 20px;margin-bottom:18px">
        <div><p style="margin:0;font-size:12px;color:var(--text3)">DUE IN 30 DAYS</p><p style="margin:3px 0 0;font-size:24px;font-weight:900;color:#f59e0b">${soonCount}</p></div>
        ${expired.length ? `<div><p style="margin:0;font-size:12px;color:var(--text3)">EXPIRED</p><p style="margin:3px 0 0;font-size:24px;font-weight:900;color:#ef4444">${expired.length}</p></div>` : ''}
        <div><p style="margin:0;font-size:12px;color:var(--text3)">TOTAL</p><p style="margin:3px 0 0;font-size:24px;font-weight:900;color:var(--text1)">${items.length}</p></div>
      </div>
      ${upcoming.length ? `<p class="section-title" style="margin:18px 2px 10px">Coming up</p>${upcoming.map(row).join('')}` : ''}
      ${expired.length ? `<p class="section-title" style="margin:22px 2px 10px;color:var(--text3)">Expired</p>${expired.map(row).join('')}` : ''}
      ` : `
      <div class="glass-card" style="padding:48px 20px;text-align:center">
        <p style="font-size:40px;margin:0 0 10px">🔔</p>
        <p style="margin:0 0 8px;color:var(--text2)">Nothing to renew yet.</p>
        <p style="margin:0;font-size:13px;color:var(--text3)">Add a <b>Warranty end</b> to a Purchase, or an <b>Expected date</b> to a Money-Lent / Real-Estate asset, and it'll appear here.</p>
      </div>`}
    </div>`;
  if (typeof _lucideRefresh === 'function') _lucideRefresh();
}
