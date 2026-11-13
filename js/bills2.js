// ============================================================
//  bills2.js — build 730: new Upcoming (Bills & Due) page (app)
//  Hero with what goes out in 30 days and what is left after bills,
//  a tappable 30-day timeline, bills already due but not posted,
//  coloured rows with countdown chips and Paid / Skip.
// ============================================================
(function () {
  let _upPick = null, _upMon = 0;
  window.upMonth = d => { _upMon = Math.max(0, Math.min(1, _upMon + d)); _upPick = null; renderUpcoming(); };
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
    // month calendar (this month / next month)
    const byDay = {}; items.forEach(i => { (byDay[i.date] = byDay[i.date] || []).push(i); });
    const m0 = new Date(t0.getFullYear(), t0.getMonth() + _upMon, 1), dim = new Date(m0.getFullYear(), m0.getMonth() + 1, 0).getDate();
    const lead = (m0.getDay() + 6) % 7;
    const mTot = Object.entries(byDay).filter(([k]) => k.startsWith(_ymdLocal(m0).slice(0, 7)) && k >= todayS).reduce((s2, [, l]) => s2 + sum(l), 0);
    let cells = '<span class="uc-wd">M</span><span class="uc-wd">T</span><span class="uc-wd">W</span><span class="uc-wd">T</span><span class="uc-wd">F</span><span class="uc-wd">S</span><span class="uc-wd">S</span>' + '<span></span>'.repeat(lead);
    for (let n = 1; n <= dim; n++) { const d = new Date(m0.getFullYear(), m0.getMonth(), n), k = _ymdLocal(d), l = byDay[k], past = k < todayS;
      cells += `<button class="uc-d ${l ? 'has' : ''} ${k === todayS ? 'today' : ''} ${_upPick === k ? 'on' : ''} ${past ? 'past' : ''}" ${l ? `onclick="upPickDay('${k}')"` : 'disabled'} style="--d:${n * 12}ms"><b>${n}</b>${l ? `<i>${l.slice(0, 3).map((_, z) => '<s></s>').join('')}</i><em>${S(sum(l))}</em>` : ''}</button>`; }
    const strip = `<div class="uc-head"><button onclick="upMonth(-1)" ${_upMon <= 0 ? 'disabled' : ''} aria-label="Previous month"><i data-lucide="chevron-left"></i></button><span><b>${m0.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</b><small>${mTot ? S(mTot) + ' still to pay' : 'nothing left to pay'}</small></span><button onclick="upMonth(1)" ${_upMon >= 1 ? 'disabled' : ''} aria-label="Next month"><i data-lucide="chevron-right"></i></button></div><div class="uc-grid">${cells}</div>`;
    const pickL = _upPick ? items.filter(i => i.date === _upPick) : null;
    const nx = items[0];
    const thisW = w7, next30 = w30.filter(i => i.date > in7);
    const sumHtml = `<div class="ub-sum ${after < 0 ? 'neg' : ''}"><div class="ub-s1"><span><small>Going out · 30 days</small><b>${fmt(Math.round(sum(w30)))}</b></span><span><small>This week</small><b>${S(sum(w7))}</b></span><span><small>Left after bills</small><b class="${after < 0 ? 'down' : 'up'}">${after < 0 ? '−' : ''}${S(Math.abs(after))}</b></span></div>
        ${nx ? `<p>Next: <b>${E(nx.name)}</b> · ${fmt(Math.round(nx.amount))} · ${_upDays(nx.date) <= 0 ? 'today' : _upDays(nx.date) === 1 ? 'tomorrow' : 'in ' + _upDays(nx.date) + ' days'}</p>` : ''}</div>`;
    c.innerHTML = `<div class="pk ubx">
      ${overdue.length ? `<div class="ldx-warn"><i data-lucide="alarm-clock"></i><div><b>${overdue.length} bill${overdue.length === 1 ? ' was' : 's were'} due and not added yet</b><p>${overdue.slice(0, 3).map(r => E(r.description || r.category)).join(', ')}${overdue.length > 3 ? '…' : ''}. Add them to your records so balances stay right.</p><button onclick="if(typeof processRecurring==='function')processRecurring();navigate('upcoming',true)">Add ${overdue.length === 1 ? 'it' : 'them'} now</button></div></div>` : ''}
      ${items.length ? `<div class="pk-card uc-card">${strip}<p class="uc-tip">${_upPick ? `<button class="ub-clr" onclick="upPickDay('${_upPick}')">Show all bills</button>` : 'Tap a day with a dot to see its bills'}</p></div>${sumHtml}
      ${pickL ? `<div class="pk-sec"><span>${new Date(_upPick + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</span><b>${fmt(Math.round(sum(pickL)))}</b></div><div class="pk-list ub-list">${pickL.map(row).join('')}</div>`
        : grp('This week', thisW, 0) + grp('Rest of the 30 days', next30, thisW.length) + grp('Later', later, w30.length)}
      <p class="pk-foot">From your repeating payments and loan EMIs (an EMI already set up as repeating is counted once). Tap a bill to change it.</p>`
      : _pk.empty({ ic: 'calendar-clock', t: 'No bills coming up', s: 'Add an expense and set <b>Repeat</b> (rent, phone, subscriptions), or add a loan with an EMI — they show up here before they are due.', btns: [['Add a repeating bill', "openAddTxModal('expense')", 1]] })}
    </div>`;
    _pk.done(c);
    
  };
})();
