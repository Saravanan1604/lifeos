// ============================================================
//  bills2.js — build 730: new Upcoming (Bills & Due) page (app)
//  Hero with what goes out in 30 days and what is left after bills,
//  a tappable 30-day timeline, bills already due but not posted,
//  coloured rows with countdown chips and Paid / Skip.
// ============================================================
(function () {
  let _upPick = null;
  window.upPickDay = d => { _upPick = _upPick === d ? null : d; renderUpcoming(); };
  window._renderUpcomingApp = function (c) {
    const S = v => (typeof _asShort === 'function' ? _asShort(v) : fmt(v));
    const E = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const items = _upcomingItems(60);
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    const ds = n => { const x = new Date(t0); x.setDate(x.getDate() + n); return _ymdLocal(x); };
    const todayS = ds(0), in7 = ds(7), in30 = ds(30);
    const sum = l => l.reduce((s, i) => s + i.amount, 0);
    const w7 = items.filter(i => i.date <= in7), w30 = items.filter(i => i.date <= in30), later = items.filter(i => i.date > in30);
    const have = (STATE.bankAccounts || []).reduce((s, a) => s + (+a.balance || 0), 0) + (STATE.cashAccounts || []).reduce((s, a) => s + (+a.balance || 0), 0);
    const after = have - sum(w30);
    const rec = STATE.recurring || [];
    const overdue = rec.filter(r => r.type !== 'income' && r.enabled !== false && r.nextDate && r.nextDate < todayS);
    const findRec = i => i.kind === 'recurring' ? (rec.find(r => (r.description || r.category) === i.name && r.nextDate === i.date) || rec.find(r => (r.description || r.category) === i.name && r.type !== 'income')) : null;
    const findLoan = i => i.kind === 'emi' ? (STATE.loans || []).find(l => (l.name || l.type || 'Loan') + ' EMI' === i.name) : null;
    const col = (i, k) => (typeof catColor === 'function' && i.category ? catColor(i.category) : null) || _PK_COLS[k % _PK_COLS.length];
    const row = (i, k) => {
      const days = _upDays(i.date), r = findRec(i), l = findLoan(i);
      const when = days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`;
      const tone = days <= 1 ? 'soon' : days <= 7 ? 'week' : 'far';
      const open = r ? `editRecurring('${r.id}')` : l ? `openLoanDetail('${l.id}')` : '';
      return `<div class="ub-row ${_upPick && _upPick !== i.date ? 'dim' : ''}" style="--d:${k * 40}ms" ${open ? `onclick="${open}"` : ''}>
        <span class="ub-ic" style="--c:${col(i, k)}">${i.kind === 'emi' ? '<i data-lucide="landmark"></i>' : typeof catIconHtml === 'function' ? catIconHtml(i.category) : '<i data-lucide="repeat"></i>'}</span>
        <span class="ub-m"><b>${E(i.name)}</b><small>${E(i.sub || i.category)} · ${new Date(i.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</small>
          ${r && days <= 7 ? `<span class="ub-act"><button class="ok" onclick="event.stopPropagation();billPayNow('${r.id}');navigate('upcoming',true)"><i data-lucide="check"></i>Paid</button><button onclick="event.stopPropagation();billSkip('${r.id}');navigate('upcoming',true)">Skip</button></span>` : ''}</span>
        <span class="ub-r"><b>${fmt(Math.round(i.amount))}</b><em class="${tone}">${when}</em></span></div>`;
    };
    const grp = (t, list, k0) => list.length ? `<div class="pk-sec"><span>${t}</span><b>${fmt(Math.round(sum(list)))}</b></div><div class="pk-list ub-list">${list.map((i, k) => row(i, k0 + k)).join('')}</div>` : '';
    // 30-day strip
    const byDay = {}; items.forEach(i => { if (i.date <= in30) (byDay[i.date] = byDay[i.date] || []).push(i); });
    const mx = Math.max(1, ...Object.values(byDay).map(sum));
    const strip = [...Array(31)].map((_, n) => { const k = ds(n), d = new Date(t0); d.setDate(d.getDate() + n); const l = byDay[k], v = l ? sum(l) : 0;
      return `<button class="ub-day ${l ? 'has' : ''} ${_upPick === k ? 'on' : ''} ${n === 0 ? 'today' : ''}" ${l ? `onclick="upPickDay('${k}')"` : 'disabled'}><small>${d.toLocaleDateString('en-IN', { weekday: 'narrow' })}</small><b>${d.getDate()}</b><span class="ub-bar"><i style="height:${l ? Math.max(18, v / mx * 100) : 0}%"></i></span>${l ? `<em>${S(v)}</em>` : '<em>&nbsp;</em>'}</button>`; }).join('');
    const pickL = _upPick ? items.filter(i => i.date === _upPick) : null;
    const nx = items[0];
    const thisW = w7, next30 = w30.filter(i => i.date > in7);
    c.innerHTML = `<div class="pk ubx">
      <div class="as-hero ub-hero ${after < 0 ? 'neg' : ''}">
        <div class="as-hero-top"><span>Going out · next 30 days</span><em class="anx-rate">${w30.length} bill${w30.length === 1 ? '' : 's'}</em></div>
        <b class="as-nw">${fmt(Math.round(sum(w30)))}</b>
        <p class="as-say">${nx ? `Next: <b>${E(nx.name)}</b> ${fmt(Math.round(nx.amount))} ${_upDays(nx.date) <= 0 ? 'today' : _upDays(nx.date) === 1 ? 'tomorrow' : 'in ' + _upDays(nx.date) + ' days'}` : 'Nothing due in the next 30 days.'}</p>
        <div class="bk-chips"><div><small>This week</small><b>${S(sum(w7))}</b></div><div><small>Bank + cash</small><b>${S(have)}</b></div><div><small>Left after bills</small><b>${after < 0 ? '−' : ''}${S(Math.abs(after))}</b></div></div>
      </div>
      ${overdue.length ? `<div class="ldx-warn"><i data-lucide="alarm-clock"></i><div><b>${overdue.length} bill${overdue.length === 1 ? ' was' : 's were'} due and not added yet</b><p>${overdue.slice(0, 3).map(r => E(r.description || r.category)).join(', ')}${overdue.length > 3 ? '…' : ''}. Add them to your records so balances stay right.</p><button onclick="if(typeof processRecurring==='function')processRecurring();navigate('upcoming',true)">Add ${overdue.length === 1 ? 'it' : 'them'} now</button></div></div>` : ''}
      ${items.length ? `<div class="pk-card ub-strip-card"><div class="ldx-ct"><span>Next 30 days</span><span class="ldx-leg">${_upPick ? `<button class="ub-clr" onclick="upPickDay('${_upPick}')">Show all</button>` : 'tap a day'}</span></div><div class="ub-strip">${strip}</div></div>
      ${pickL ? `<div class="pk-sec"><span>${new Date(_upPick + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</span><b>${fmt(Math.round(sum(pickL)))}</b></div><div class="pk-list ub-list">${pickL.map(row).join('')}</div>`
        : grp('This week', thisW, 0) + grp('Rest of the 30 days', next30, thisW.length) + grp('Later', later, w30.length)}
      <p class="pk-foot">From your repeating payments and loan EMIs (an EMI already set up as repeating is counted once). Tap a bill to change it.</p>`
      : _pk.empty({ ic: 'calendar-clock', t: 'No bills coming up', s: 'Add an expense and set <b>Repeat</b> (rent, phone, subscriptions), or add a loan with an EMI — they show up here before they are due.', btns: [['Add a repeating bill', "openAddTxModal('expense')", 1]] })}
    </div>`;
    _pk.done(c);
    const on = c.querySelector('.ub-day.on') || c.querySelector('.ub-day.today'); if (on && on.scrollIntoView) { const s = c.querySelector('.ub-strip'); if (s) s.scrollLeft = Math.max(0, on.offsetLeft - 40); }
  };
})();
