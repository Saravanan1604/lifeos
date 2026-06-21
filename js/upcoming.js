// ============================================================
//  Upcoming Spendings — a forward look at money about to go out:
//  recurring expenses (from STATE.recurring) projected ahead + loan
//  EMIs. Routed as 'upcoming'. Read-only; nothing is auto-charged.
// ============================================================

function _upDays(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((d - t) / 86400000);
}
function _upWhenBadge(dateStr) {
  const days = _upDays(dateStr);
  let txt, col;
  if (days <= 0) { txt = 'Today'; col = '#ef4444'; }
  else if (days === 1) { txt = 'Tomorrow'; col = '#f59e0b'; }
  else if (days <= 7) { txt = `in ${days}d`; col = '#f59e0b'; }
  else { txt = `in ${days}d`; col = '#10b981'; }
  return `<span style="font-size:11px;font-weight:700;color:${col};background:${col}1a;padding:3px 10px;border-radius:20px;white-space:nowrap">${txt}</span>`;
}
function _freqLabel(f) {
  return ({ daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly',
    '2monthly': 'Every 2 mo', '3monthly': 'Every 3 mo', '6monthly': 'Every 6 mo' })[f] || (f || '');
}

// Build the list of upcoming spend events within `days` from today.
function _upcomingItems(days) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const todayS = _ymdLocal(t);
  const horizon = new Date(t); horizon.setDate(horizon.getDate() + days);
  const horizonS = _ymdLocal(horizon);
  const items = [];

  // Recurring EXPENSE rules — project each occurrence into the window.
  (STATE.recurring || []).forEach(r => {
    if (r.type === 'income') return;
    let d = r.nextDate, guard = 0;
    while (d && d <= horizonS && guard < 60) {
      if (d >= todayS) items.push({ date: d, amount: +r.amount || 0, name: r.description || r.category || 'Recurring', category: r.category || 'Other', sub: _freqLabel(r.frequency), kind: 'recurring' });
      d = (typeof _advanceDate === 'function') ? _advanceDate(d, r.frequency) : null;
      if (!r.frequency) break;
      guard++;
    }
  });

  // Loan EMIs — next monthly due dates within the window.
  (STATE.loans || []).forEach(l => {
    const emi = +l.emi || 0; if (emi <= 0) return;
    const start = l.startDate ? new Date(l.startDate + 'T00:00:00') : null;
    const dom = (start && !isNaN(start)) ? Math.min(start.getDate(), 28) : 1;
    let probe = new Date(t.getFullYear(), t.getMonth(), dom);
    let guard = 0;
    while (probe < t && guard < 3) { probe.setMonth(probe.getMonth() + 1); guard++; }
    guard = 0;
    while (_ymdLocal(probe) <= horizonS && guard < 12) {
      items.push({ date: _ymdLocal(probe), amount: emi, name: (l.name || l.type || 'Loan') + ' EMI', category: 'EMI', sub: 'Loan EMI', kind: 'emi' });
      probe.setMonth(probe.getMonth() + 1); guard++;
    }
  });

  return items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function renderUpcoming() {
  const container = document.getElementById('page-container');
  if (!container) return;
  const items = _upcomingItems(60);
  const todayS = _ymdLocal(new Date());
  const in7 = _ymdLocal((() => { const d = new Date(); d.setDate(d.getDate() + 7); return d; })());
  const in30 = _ymdLocal((() => { const d = new Date(); d.setDate(d.getDate() + 30); return d; })());
  const sum = (to) => items.filter(i => i.date <= to).reduce((s, i) => s + i.amount, 0);
  const total7 = sum(in7), total30 = sum(in30);

  const row = (i) => {
    const col = (typeof catColor === 'function') ? catColor(i.category) : '#6366f1';
    const ic = (typeof catIconHtml === 'function') ? catIconHtml(i.category) : '🔁';
    return `<div class="glass-card" style="display:flex;align-items:center;gap:14px;padding:14px 16px;margin-bottom:10px">
      <span style="width:46px;height:46px;border-radius:13px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px;background:${col}1a;color:${col}">${ic}</span>
      <div style="flex:1;min-width:0">
        <p style="margin:0;font-weight:700;font-size:16px;color:var(--text1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(i.name)}</p>
        <p style="margin:3px 0 0;font-size:12.5px;color:var(--text3)">${esc(i.category)}${i.sub ? ' · ' + esc(i.sub) : ''} · ${fmtDate(i.date)}</p>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">
        <b style="font-size:16px;color:#ef4444">-${fmt(i.amount)}</b>
        ${_upWhenBadge(i.date)}
      </div>
    </div>`;
  };

  container.innerHTML = `
    <div class="fade-in" style="max-width:760px;margin:0 auto">
      <div class="page-header"><h1 class="page-title">📅 Upcoming</h1>
        <p class="page-subtitle">Money about to go out — recurring bills, subscriptions & EMIs</p></div>

      ${items.length ? `
      <div class="glass-card" style="display:flex;gap:24px;flex-wrap:wrap;padding:18px 20px;margin-bottom:18px">
        <div><p style="margin:0;font-size:12px;color:var(--text3)">NEXT 7 DAYS</p><p style="margin:3px 0 0;font-size:24px;font-weight:900;color:#f59e0b">${fmt(total7)}</p></div>
        <div><p style="margin:0;font-size:12px;color:var(--text3)">NEXT 30 DAYS</p><p style="margin:3px 0 0;font-size:24px;font-weight:900;color:#ef4444">${fmt(total30)}</p></div>
        <div><p style="margin:0;font-size:12px;color:var(--text3)">ITEMS</p><p style="margin:3px 0 0;font-size:24px;font-weight:900;color:var(--text1)">${items.length}</p></div>
      </div>
      ${items.map(row).join('')}
      <p style="font-size:12px;color:var(--text3);text-align:center;margin:14px 0 28px">Projected from your recurring transactions & loan EMIs. Nothing is charged automatically.</p>
      ` : `
      <div class="glass-card" style="padding:48px 20px;text-align:center">
        <p style="font-size:40px;margin:0 0 10px">📅</p>
        <p style="margin:0 0 8px;color:var(--text2)">No upcoming spendings.</p>
        <p style="margin:0;font-size:13px;color:var(--text3)">Set a transaction to <b>Repeat</b> (or add a loan EMI) and it'll show here as an upcoming bill.</p>
      </div>`}
    </div>`;
  if (typeof _lucideRefresh === 'function') _lucideRefresh();
}
