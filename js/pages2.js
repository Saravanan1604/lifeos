// ============================================================
//  pages2.js — build 694: app redesign of list pages
//  Tags · Recurring · Purchases · Renewals · Split
//  Shared kit: header, gradient summary card, icon rows, empty state.
//  Web layouts are untouched (each renderer only runs in the app).
// ============================================================
const _pk = {
  e: s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
  q: s => String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;'),
  head(o) { // { title, sub, back, action:{label, on, ic} }
    return `<div class="pk-head">
      ${o.back ? `<button class="pk-back" onclick="${o.back}" aria-label="Back"><i data-lucide="arrow-left"></i></button>` : ''}
      <div class="pk-ht"><h1>${o.title}</h1>${o.sub ? `<p>${o.sub}</p>` : ''}</div>
      ${o.action ? `<button class="pk-act" onclick="${o.action.on}"><i data-lucide="${o.action.ic || 'plus'}"></i>${o.action.label}</button>` : ''}
    </div>`;
  },
  hero(o) { // { tone, label, big, sub, stats:[[label,value,cls]], extra }
    return `<div class="pk-hero t-${o.tone || 'pri'}">
      <div class="pk-hero-m">${o.extra || ''}<div class="pk-hero-v"><span>${o.label}</span><b>${o.big}</b>${o.sub ? `<small>${o.sub}</small>` : ''}</div></div>
      ${o.stats && o.stats.length ? `<div class="pk-stats">${o.stats.map(([l, v, c]) => `<div class="${c || ''}"><b>${v}</b><small>${l}</small></div>`).join('')}</div>` : ''}
    </div>`;
  },
  sec(title, right) { return `<div class="pk-sec"><span>${title}</span>${right || ''}</div>`; },
  row(o) { // { ic (html), col, t, s, r, rs, rcls, on, cls, tail }
    return `<div class="pk-row ${o.cls || ''}" ${o.on ? `onclick="${o.on}"` : ''}>
      <span class="pk-ic" style="--c:${o.col || 'var(--cx-pri)'}">${o.ic}</span>
      <div class="pk-mid"><b>${o.t}</b>${o.s ? `<small>${o.s}</small>` : ''}${o.bar != null ? `<span class="pk-bar"><i style="width:${Math.max(2, Math.min(100, o.bar))}%;background:${o.col}"></i></span>` : ''}</div>
      ${o.r != null || o.rs ? `<div class="pk-r"><b class="${o.rcls || ''}">${o.r != null ? o.r : ''}</b>${o.rs ? `<small>${o.rs}</small>` : ''}</div>` : ''}
      ${o.tail || ''}
    </div>`;
  },
  empty(o) { // { ic, t, s, btns:[[label,on,primary]] }
    return `<div class="pk-empty"><span class="pk-empty-ic"><i data-lucide="${o.ic}"></i></span><b>${o.t}</b><p>${o.s}</p>
      <div class="pk-empty-b">${(o.btns || []).map(([l, on, p]) => `<button class="${p ? 'p' : ''}" onclick="${on}">${l}</button>`).join('')}</div></div>`;
  },
  pill(txt, tone) { return `<span class="pk-pill t-${tone}">${txt}</span>`; },
  daysPill(dateStr) {
    if (!dateStr) return '';
    const d = Math.ceil((new Date(dateStr + 'T00:00:00') - new Date(new Date().toDateString())) / 86400000);
    if (isNaN(d)) return '';
    if (d < 0) return this.pill(`${-d}d ago`, 'exp');
    if (d === 0) return this.pill('Today', 'exp');
    if (d <= 30) return this.pill(`in ${d}d`, 'warn');
    return this.pill(`${d}d left`, 'inc');
  },
  done(c) { c.dataset.pk = '1'; if (typeof _lucideRefresh === 'function') _lucideRefresh(); },
};
const _PK_COLS = ['#8B5CF6', '#22D3EE', '#F59E0B', '#F05260', '#10B981', '#EC4899', '#3B82F6', '#F97316', '#14B8A6', '#A3E635'];

// ── Tags ────────────────────────────────────────────────────
function renderTagsApp() {
  const c = document.getElementById('page-container'); if (!c) return;
  const by = {};
  (STATE.transactions || []).forEach(t => {
    if (!t.tag) return;
    const v = by[t.tag] || (by[t.tag] = { total: 0, n: 0, last: '' });
    if (t.type !== 'income') v.total += +t.amount || 0;
    v.n++; if ((t.date || '') > v.last) v.last = t.date || '';
  });
  const tags = Object.entries(by).map(([tag, v]) => ({ tag, ...v })).sort((a, b) => b.total - a.total);
  const grand = tags.reduce((s, t) => s + t.total, 0);
  const cols = tags.map((_, i) => _PK_COLS[i % _PK_COLS.length]);
  const ent = tags.filter(t => t.total > 0).map(t => [t.tag, t.total]);
  const subs = {}; tags.forEach(t => { subs[t.tag] = `${grand ? Math.round(t.total / grand * 100) : 0}% · ${t.n} ${t.n === 1 ? 'entry' : 'entries'}`; });
  const ring = ent.length && typeof _homeRoseSvg === 'function'
    ? `<div class="pk-ring"><div class="hx-rose">${_homeRoseSvg(ent, grand, cols.slice(0, ent.length), subs)}<div class="hx-donut-c"><span>All tags</span><b>${fmt(Math.round(grand))}</b><em>${tags.length} tag${tags.length === 1 ? '' : 's'} · tap a slice</em></div></div></div>` : '';
  c.innerHTML = `<div class="pk">
    ${_pk.head({ title: 'Tags', sub: 'Group spends across categories — a trip, a wedding, a project', back: "navigate('finance')", action: { label: 'Tag a spend', on: "openTxPad('expense')" } })}
    ${tags.length ? `<div class="pk-card">${ring}</div>
      ${_pk.sec('Your tags', `<em>${tags.length}</em>`)}
      <div class="pk-list">${tags.map((t, i) => _pk.row({
        ic: '<b class="pk-hash">#</b>', col: cols[i], t: _pk.e(t.tag),
        s: `${t.n} ${t.n === 1 ? 'entry' : 'entries'}${t.last ? ' · last ' + fmtDate(t.last) : ''}`,
        r: fmt(Math.round(t.total)), rs: `${grand ? Math.round(t.total / grand * 100) : 0}%`,
        bar: grand ? t.total / grand * 100 : 0, on: `openTagDetail('${_pk.q(t.tag)}')` })).join('')}</div>`
    : _pk.empty({ ic: 'hash', t: 'No tags yet', s: 'When you add an expense, type a Tag like “Goa trip” or “Wedding”. Every spend with that tag is added up here, across all categories.', btns: [['Add a tagged expense', "openTxPad('expense')", 1]] })}
  </div>`;
  _pk.done(c);
}

// ── Recurring ───────────────────────────────────────────────
const _PK_PER_MONTH = { daily: 30, weekly: 52 / 12, monthly: 1, '2monthly': 1 / 2, '3monthly': 1 / 3, '6monthly': 1 / 6, yearly: 1 / 12, '2yearly': 1 / 24, '3yearly': 1 / 36 };
function renderRecurringApp() {
  const c = document.getElementById('page-container'); if (!c) return;
  const rec = STATE.recurring || [];
  const todayS = typeof _ymdLocal === 'function' ? _ymdLocal(new Date()) : new Date().toISOString().slice(0, 10);
  const on = r => r.enabled !== false;
  const pm = r => (+r.amount || 0) * (_PK_PER_MONTH[r.frequency] || 1);
  const inc = rec.filter(r => r.type === 'income'), exp = rec.filter(r => r.type !== 'income');
  const incM = inc.filter(on).reduce((s, r) => s + pm(r), 0), expM = exp.filter(on).reduce((s, r) => s + pm(r), 0);
  const net = incM - expM;
  const due = rec.filter(r => on(r) && (r.nextDate || '') && r.nextDate <= todayS);
  const next = rec.filter(r => on(r) && r.nextDate > todayS).sort((a, b) => a.nextDate.localeCompare(b.nextDate))[0];
  const cI = typeof catIconHtml === 'function' ? catIconHtml : () => '';
  const row = r => {
    const isInc = r.type === 'income', live = on(r), isDue = live && r.nextDate && r.nextDate <= todayS;
    return _pk.row({
      cls: live ? '' : 'off', ic: cI(r.category), col: catColor(r.category),
      t: _pk.e(r.description || r.category),
      s: `${recurFreqLabel(r.frequency)} · ${_pk.e(r.category)}<br>${live ? (isDue ? '<em class="due">Due now</em>' : `Next ${fmtDate(r.nextDate)}`) : '<em>Paused</em>'}`,
      r: `${isInc ? '+' : '−'}${fmt(r.amount)}`, rcls: isInc ? 'inc' : 'exp', on: `editRecurring('${r.id}')`,
      tail: `<label class="pk-sw" onclick="event.stopPropagation()"><input type="checkbox" ${live ? 'checked' : ''} onchange="toggleRecurring('${r.id}')"><span></span></label>`,
    });
  };
  const list = (title, arr, tot, cls) => arr.length ? `${_pk.sec(title, `<b class="${cls}">${cls === 'inc' ? '+' : '−'}${fmt(Math.round(tot))}<small>/mo</small></b>`)}<div class="pk-list">${arr.map(row).join('')}</div>` : '';
  c.innerHTML = `<div class="pk">
    ${_pk.head({ title: 'Recurring', sub: 'Salary, EMIs, rent and subscriptions that repeat', action: { label: 'Add', on: "openAddTxModal('expense')" } })}
    ${rec.length ? _pk.hero({
      tone: net >= 0 ? 'inc' : 'pri', label: 'Net every month', big: `${net >= 0 ? '+' : '−'}${fmt(Math.round(Math.abs(net)))}`,
      sub: next ? `Next: ${_pk.e(next.description || next.category)} · ${fmtDate(next.nextDate)}` : 'Only active items are counted',
      stats: [['Comes in', '+' + fmt(Math.round(incM))], ['Goes out', '−' + fmt(Math.round(expM))], ['Active', `${rec.filter(on).length}/${rec.length}`]] }) : ''}
    ${due.length ? `<button class="pk-cta" onclick="if(typeof processRecurring==='function'){processRecurring();}navigate('recurring',true);"><i data-lucide="alarm-clock"></i> Post ${due.length} due ${due.length === 1 ? 'entry' : 'entries'} now</button>` : ''}
    ${rec.length ? list('Income', inc, incM, 'inc') + list('Expenses', exp, expM, 'exp')
      : _pk.empty({ ic: 'repeat', t: 'Nothing repeating yet', s: 'Add an expense or income and set <b>Repeat</b> to Monthly (or any schedule). It will be posted automatically on its date.', btns: [['Add a recurring entry', "openAddTxModal('expense')", 1]] })}
    ${rec.length ? '<p class="pk-foot">Monthly figures convert weekly / yearly items to a per-month amount. Toggle off to pause.</p>' : ''}
  </div>`;
  _pk.done(c);
}

// ── Purchases ───────────────────────────────────────────────
function renderPurchasesApp() {
  const c = document.getElementById('page-container'); if (!c) return;
  const items = [...(STATE.purchases || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const total = items.reduce((s, p) => s + (+p.amount || 0), 0);
  const nowS = new Date().toISOString().slice(0, 10);
  const inW = items.filter(p => p.warrantyEnd && p.warrantyEnd >= nowS).length;
  const yr = String(new Date().getFullYear()), thisYr = items.filter(p => (p.date || '').startsWith(yr)).reduce((s, p) => s + (+p.amount || 0), 0);
  c.innerHTML = `<div class="pk">
    ${_pk.head({ title: 'Purchases', sub: 'Things you bought — bill, shop and warranty in one place', action: { label: 'Add', on: 'openPurchaseModal()' } })}
    ${items.length ? _pk.hero({ tone: 'acc', label: 'Total spent on purchases', big: fmt(Math.round(total)),
        stats: [['Items', items.length], ['This year', fmt(Math.round(thisYr))], ['In warranty', inW]] })
      + _pk.sec('All purchases', `<em>${items.length}</em>`)
      + `<div class="pk-list">${items.map(p => _pk.row({
          ic: typeof catIconHtml === 'function' && p.category ? catIconHtml(p.category) : '<i data-lucide="shopping-bag"></i>', col: catColor(p.category),
          t: _pk.e(p.name || 'Untitled'), s: [p.model, p.seller, p.date ? fmtDate(p.date) : ''].filter(Boolean).map(_pk.e).join(' · '),
          r: (+p.amount) ? fmt(+p.amount) : '', rs: p.warrantyEnd ? _pk.daysPill(p.warrantyEnd).replace('left', 'warranty') : '', on: `openPurchaseModal('${p.id}')` })).join('')}</div>`
      : _pk.empty({ ic: 'shopping-bag', t: 'No purchases yet', s: 'Log a phone, bike or appliance with its bill number, shop and <b>warranty end date</b>. You get a reminder before the warranty runs out.', btns: [['Add your first purchase', 'openPurchaseModal()', 1]] })}
  </div>`;
  _pk.done(c);
}

// ── Renewals & Expiry ───────────────────────────────────────
function renderRenewalsApp() {
  const c = document.getElementById('page-container'); if (!c) return;
  const items = typeof _renewalItems === 'function' ? _renewalItems() : [];
  const todayS = typeof _ymdLocal === 'function' ? _ymdLocal(new Date()) : new Date().toISOString().slice(0, 10);
  const d30 = new Date(); d30.setDate(d30.getDate() + 30); const in30 = typeof _ymdLocal === 'function' ? _ymdLocal(d30) : d30.toISOString().slice(0, 10);
  const up = items.filter(i => i.date >= todayS), ex = items.filter(i => i.date < todayS), soon = up.filter(i => i.date <= in30);
  const icFor = i => /warranty/i.test(i.kind) ? 'shield-check' : /receive/i.test(i.kind) ? 'hand-coins' : /sell/i.test(i.kind) ? 'home' : 'calendar-clock';
  const r = i => _pk.row({ ic: `<i data-lucide="${icFor(i)}"></i>`, col: i.color, t: _pk.e(i.name), s: `${_pk.e(i.kind)} · ${fmtDate(i.date)}`, rs: _pk.daysPill(i.date), on: i.open });
  c.innerHTML = `<div class="pk">
    ${_pk.head({ title: 'Renewals', sub: 'Warranties and due dates — so nothing lapses' })}
    ${items.length ? _pk.hero({ tone: soon.length ? 'warn' : 'inc', label: 'Due in the next 30 days', big: String(soon.length),
        sub: up[0] ? `Next: ${_pk.e(up[0].name)} · ${fmtDate(up[0].date)}` : 'Nothing coming up', stats: [['Upcoming', up.length], ['Expired', ex.length], ['Tracked', items.length]] })
      + (up.length ? _pk.sec('Coming up') + `<div class="pk-list">${up.map(r).join('')}</div>` : '')
      + (ex.length ? _pk.sec('Expired') + `<div class="pk-list dim">${ex.map(r).join('')}</div>` : '')
      : _pk.empty({ ic: 'bell-ring', t: 'Nothing to renew yet', s: 'Dates show up here automatically from two places: a <b>warranty end</b> on a Purchase, and an <b>expected date</b> on a Money-lent or Real-estate asset.', btns: [['Add a purchase', 'openPurchaseModal()', 1], ['Open assets', "navigate('investments')"]] })}
  </div>`;
  _pk.done(c);
}

// ── Split ───────────────────────────────────────────────────
function renderSplitApp() {
  const c = document.getElementById('page-container'); if (!c) return;
  const splits = [...(STATE.splits || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  let owed = 0, owe = 0;
  splits.forEach(s => { const n = _splitMyNet(s); if (n > 0) owed += n; else owe += -n; });
  const net = owed - owe;
  const st = s => (s.people || []).filter(p => p.name !== s.payer).every(p => p.paid);
  const open = splits.filter(s => !st(s)), done = splits.filter(st);
  const r = s => {
    const n = _splitMyNet(s), ok = st(s);
    return _pk.row({ ic: '<i data-lucide="receipt-text"></i>', col: ok ? '#94A3B8' : n >= 0 ? '#10B981' : '#F05260', t: _pk.e(s.description || 'Split'),
      s: `${_isMe(s.payer) ? 'You paid' : _pk.e(s.payer) + ' paid'} ${fmt(s.amount)} · ${(s.people || []).length} people${s.date ? ' · ' + fmtDate(s.date) : ''}`,
      r: ok ? '' : fmt(Math.abs(n)), rcls: n >= 0 ? 'inc' : 'exp', rs: ok ? _pk.pill('Settled', 'mute') : n > 0 ? 'owed to you' : n < 0 ? 'you owe' : '', on: `openSplitDetail('${s.id}')` });
  };
  c.innerHTML = `<div class="pk">
    ${_pk.head({ title: 'Split', sub: 'Shared bills with friends and family — who owes whom', action: { label: 'Split', on: 'openSplitModal()' } })}
    ${splits.length ? _pk.hero({ tone: net >= 0 ? 'inc' : 'exp', label: net > 0 ? 'Friends owe you' : net < 0 ? 'You owe friends' : 'All square', big: fmt(Math.round(Math.abs(net))),
        stats: [["You're owed", fmt(Math.round(owed))], ['You owe', fmt(Math.round(owe))], ['Open', open.length]] })
      + (open.length ? _pk.sec('Open') + `<div class="pk-list">${open.map(r).join('')}</div>` : '')
      + (done.length ? _pk.sec('Settled') + `<div class="pk-list dim">${done.map(r).join('')}</div>` : '')
      : _pk.empty({ ic: 'users', t: 'No splits yet', s: 'Paid for dinner or a trip? Add the total and who shared it — atworth works out each share and tracks who has paid you back.', btns: [['Split a bill', 'openSplitModal()', 1]] })}
  </div>`;
  _pk.done(c);
}

// ── Report (Day / Week / Month / Year) ──────────────────────
function renderReportApp() {
  const c = document.getElementById('page-container'); if (!c) return;
  const data = _reportData(_rptPeriod, _rptAnchor);
  const rows = data.rows;
  const tInc = rows.reduce((s, r) => s + r.inc, 0), tExp = rows.reduce((s, r) => s + r.exp, 0), net = tInc - tExp;
  const rate = tInc > 0 ? Math.round(net / tInc * 100) : null;
  const sgn = v => (v >= 0 ? '+' : '−') + fmt(Math.round(Math.abs(v)));
  const tabs = [['day', 'Day'], ['week', 'Week'], ['month', 'Month'], ['year', 'Year']];
  const max = Math.max(1, ...rows.map(r => Math.max(r.inc, r.exp)));
  const unitLbl = { year: 'month', month: 'day', week: 'day', day: 'category' }[_rptPeriod];
  const active = rows.filter(r => r.inc || r.exp);
  const best = _rptPeriod !== 'day' && active.length ? active.reduce((a, b) => (b.exp > a.exp ? b : a)) : null;

  const chart = _rptPeriod === 'day' ? '' : `<div class="pk-card rp-chart">
      <div class="rp-cap" id="rp-cap">${best ? `Highest spend: <b>${_pk.e(best.label)}</b> · ${fmt(Math.round(best.exp))}` : 'No entries in this period'}</div>
      <div class="rp-bars ${rows.length > 14 ? 'dense' : ''}">${rows.map(r => `<button class="rp-col" onclick="rpTap(this)" data-cap="<b>${_pk.e(r.label)}</b> · in ${fmt(Math.round(r.inc))} · out ${fmt(Math.round(r.exp))}">
        <span class="rp-pair"><i class="in" style="height:${r.inc / max * 100}%"></i><i class="out" style="height:${r.exp / max * 100}%"></i></span>
        <small>${_pk.e(rows.length > 14 ? (+r.label % 5 === 0 || r.label === '1' ? r.label : '') : r.label)}</small></button>`).join('')}</div>
      <div class="rp-leg"><span><i class="in"></i>Income</span><span><i class="out"></i>Expense</span></div>
    </div>`;

  const list = active.length ? `${_pk.sec(_rptPeriod === 'day' ? 'By category' : 'Breakdown', `<em>${active.length} ${unitLbl}${active.length === 1 ? '' : 's'}</em>`)}
    <div class="pk-list">${active.map(r => {
      const n = r.inc - r.exp;
      return `<div class="pk-row rp-row">
        <span class="rp-lbl">${_pk.e(_rptPeriod === 'month' ? r.label : r.label)}</span>
        <div class="pk-mid"><small><span class="inc">in ${fmt(Math.round(r.inc))}</span> · <span class="exp">out ${fmt(Math.round(r.exp))}</span></small>
          <span class="rp-mini"><i class="in" style="width:${r.inc / max * 100}%"></i><i class="out" style="width:${r.exp / max * 100}%"></i></span></div>
        <div class="pk-r"><b class="${n >= 0 ? 'inc' : 'exp'}">${sgn(n)}</b>${data.useBal ? `<small>running ${sgn(r.bal)}</small>` : ''}</div>
      </div>`; }).join('')}</div>`
    : _pk.empty({ ic: 'file-bar-chart-2', t: 'No entries in this period', s: 'Use the arrows to move to another period, or add an entry.', btns: [['Add an entry', "openTxPad('expense')", 1]] });

  c.innerHTML = `<div class="pk">
    ${_pk.head({ title: 'Report', sub: 'Money in, money out and what was left', action: { label: 'PDF', ic: 'download', on: 'exportYearlyPDF()' } })}
    <div class="rp-tabs">${tabs.map(([k, l]) => `<button class="${_rptPeriod === k ? 'on' : ''}" onclick="setReportPeriod('${k}')">${l}</button>`).join('')}</div>
    <div class="rp-nav"><button onclick="reportNav(-1)" aria-label="Previous"><i data-lucide="chevron-left"></i></button><b>${_pk.e(data.title)}</b><button onclick="reportNav(1)" aria-label="Next"><i data-lucide="chevron-right"></i></button></div>
    ${_pk.hero({ tone: net >= 0 ? 'inc' : 'exp', label: net >= 0 ? 'You saved' : 'You overspent', big: fmt(Math.round(Math.abs(net))),
      sub: rate != null ? (net >= 0 ? `${rate}% of what came in` : `${Math.abs(rate)}% more than you earned`) : (tExp ? 'No income recorded in this period' : ''),
      stats: [['Income', fmt(Math.round(tInc))], ['Expense', fmt(Math.round(tExp))], [_rptPeriod === 'day' ? 'Categories' : 'Active ' + unitLbl + 's', active.length]] })}
    ${chart}${list}
  </div>`;
  _pk.done(c);
}
function rpTap(b) {
  document.querySelectorAll('.rp-col.on').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  const cap = document.getElementById('rp-cap'); if (cap) cap.innerHTML = b.dataset.cap;
  if (navigator.vibrate) { try { navigator.vibrate(6); } catch (_) {} }
}

// ── Dashboard: Health + 7 Income tabs (app) ────────────────
const _STREAM_HINT = { Earned: 'Salary or wages', Profit: 'Business or side-hustle profit', Interest: 'FD, RD or savings interest', Dividends: 'Dividends from shares / MFs', Rental: 'Rent from a property', 'Capital Gains': 'Profit when you sell shares, MFs, gold', Royalties: 'Books, music, apps, patents' };
const _STREAM_IC = { Earned: 'briefcase', Profit: 'store', Interest: 'piggy-bank', Dividends: 'trending-up', Rental: 'home', 'Capital Gains': 'line-chart', Royalties: 'music' };
function _dashHealthApp(fh) {
  const box = document.getElementById('dash-mr-health'); if (!box || !fh) return;
  const o = fh.overall, col = o >= 70 ? 'var(--cx-inc)' : o >= 40 ? 'var(--cx-warn)' : 'var(--cx-exp)';
  const R = 52, C = 2 * Math.PI * R;
  const axes = (fh.axes || []).slice().sort((a, b) => a.v - b.v);
  box.classList.add('dx-card');
  box.innerHTML = `<div class="dx-h"><i data-lucide="activity"></i><b>Financial health</b><button onclick="mrPinChart('health','Financial Health')" aria-label="Pin"><i data-lucide="pin"></i></button></div>
    <div class="dx-score"><div class="dx-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="${R}" class="hx-ring-bg"/><circle cx="60" cy="60" r="${R}" class="hx-ring-fg" stroke="${col}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}" data-off="${(C * (1 - o / 100)).toFixed(1)}"/></svg><span><b>${o}</b><small>/ 100</small></span></div>
      <div class="dx-score-t"><b style="color:${col}">${o >= 70 ? 'Strong' : o >= 40 ? 'Fair — room to grow' : 'Needs attention'}</b><p>Average of 7 checks below. Fix the weakest first — they’re at the top.</p></div></div>
    <div class="dx-axes">${axes.map(a => { const c = a.v >= 70 ? 'var(--cx-inc)' : a.v >= 40 ? 'var(--cx-warn)' : 'var(--cx-exp)'; return `<div class="dx-ax">
      <div class="dx-ax-t"><span>${a.k}</span><b style="color:${c}">${Math.round(a.v)}</b></div>
      <span class="dx-track"><i style="width:${Math.max(2, a.v)}%;background:${c}"></i></span>
      ${a.v < 50 ? `<small>${a.tip}</small>` : ''}</div>`; }).join('')}</div>`;
  requestAnimationFrame(() => setTimeout(() => box.querySelectorAll('.hx-ring-fg[data-off]').forEach(c => { c.style.strokeDashoffset = c.dataset.off; }), 60));
}
function _dashStreamApp(strm) {
  const box = document.getElementById('dash-mr-stream'); if (!box || !strm) return;
  const sums = strm.sums || [], tot = sums.reduce((s, x) => s + x.total, 0);
  const on = sums.filter(s => s.total > 0).sort((a, b) => b.total - a.total), off = sums.filter(s => !(s.total > 0));
  box.classList.add('dx-card');
  box.innerHTML = `<div class="dx-h"><i data-lucide="layers"></i><b>7 income streams</b><button onclick="mrPinChart('stream','7 Income Streams')" aria-label="Pin"><i data-lucide="pin"></i></button></div>
    <div class="dx-streams-top"><div class="dx-dots">${sums.map(s => `<i class="${s.total > 0 ? 'on' : ''}"></i>`).join('')}</div><b>${strm.active} of 7 active</b>
      <p>Many wealthy people have several sources of income. Every new stream makes you less dependent on one paycheque.</p></div>
    ${on.length ? `<p class="dx-sub">Earning now</p><div class="dx-list">${on.map(s => `<div class="dx-st on"><span class="dx-st-ic"><i data-lucide="${_STREAM_IC[s.k] || 'circle'}"></i></span>
      <div class="dx-st-m"><b>${s.k}</b><span class="dx-track"><i style="width:${tot ? Math.max(3, s.total / tot * 100) : 0}%"></i></span></div>
      <div class="dx-st-r"><b>${fmt(Math.round(s.total))}</b><small>${tot ? Math.round(s.total / tot * 100) : 0}%</small></div></div>`).join('')}</div>` : ''}
    ${off.length ? `<p class="dx-sub">Next streams to build</p><div class="dx-list">${off.map(s => `<div class="dx-st"><span class="dx-st-ic"><i data-lucide="${_STREAM_IC[s.k] || 'circle'}"></i></span>
      <div class="dx-st-m"><b>${s.k}</b><small>${_STREAM_HINT[s.k] || ''}</small></div><i data-lucide="plus" class="dx-plus"></i></div>`).join('')}</div>` : ''}
    <p class="dx-foot">Streams are detected from your income categories for the selected period.</p>`;
}
(function () {
  const orig = typeof _mrDrawCharts === 'function' ? _mrDrawCharts : null;
  if (!orig) return;
  window._mrDrawCharts = function (fh, strm, flow) {
    if (window.__IS_APP) { try { _dashHealthApp(fh); _dashStreamApp(strm); if (typeof _lucideRefresh === 'function') _lucideRefresh(); } catch (e) { console.log(e); } }
    return orig.apply(this, arguments);
  };
})();

// ── Categories (build 700) ─────────────────────────────────
let _catTab = 'expense';
function setCatTab(t) { _catTab = t; navigate('categories', true); }
function renderCategoriesApp() {
  const c = document.getElementById('page-container'); if (!c) return;
  const all = getAllCategories();
  const tx = STATE.transactions || [];
  const ym = (typeof _ymdLocal === 'function' ? _ymdLocal(new Date()) : new Date().toISOString()).slice(0, 7);
  const st = {};
  tx.forEach(t => { const k = t.category || 'Other'; const s = st[k] || (st[k] = { n: 0, m: 0 }); s.n++; if ((t.date || '').startsWith(ym)) s.m += +t.amount || 0; });
  const weak = tx.filter(t => !t.category || t.category === 'Other').length;
  const list = all.filter(x => x.type === _catTab || x.type === 'both').sort((a, b) => ((st[b.name] || {}).m || 0) - ((st[a.name] || {}).m || 0) || ((st[b.name] || {}).n || 0) - ((st[a.name] || {}).n || 0));
  const yours = list.filter(x => !x.isDefault), built = list.filter(x => x.isDefault);
  const ic = x => x.isDefault && typeof catIconHtml === 'function' ? catIconHtml(x.name) : `<span class="pk-emo">${_pk.e(x.icon || '🏷️')}</span>`;
  const r = x => { const s = st[x.name] || { n: 0, m: 0 };
    return _pk.row({ ic: ic(x), col: catColor(x.name), t: _pk.e(x.name) + (x.type === 'both' ? ' <em class="ct-both">both</em>' : ''),
      s: s.n ? `${s.n} ${s.n === 1 ? 'entry' : 'entries'}` : 'Not used yet', r: s.m ? fmt(Math.round(s.m)) : '', rs: s.m ? 'this month' : '',
      on: `openCategoryDetail('${_pk.q(x.name)}')`,
      tail: x.isDefault ? '' : `<button class="ct-ed" onclick="event.stopPropagation();openEditCategoryModal('${x.id}')" aria-label="Edit"><i data-lucide="pencil"></i></button>` }); };
  c.innerHTML = `<div class="pk">
    ${_pk.head({ title: 'Categories', sub: 'Sort your money so reports and budgets make sense', action: { label: 'New', on: 'openAddCategoryModal()' } })}
    ${weak ? `<button class="ct-ai" onclick="openGeminiCategorize()"><span><i data-lucide="sparkles"></i></span><div><b>${weak} entries are in “Other”</b><small>Sort them automatically with AI</small></div><i data-lucide="chevron-right"></i></button>` : ''}
    <div class="ct-tools">
      <button onclick="openMergeCategoriesModal()"><i data-lucide="git-merge"></i>Merge</button>
      <button onclick="openManageTypesModal('asset')"><i data-lucide="trending-up"></i>Asset types</button>
      <button onclick="openManageTypesModal('loan')"><i data-lucide="landmark"></i>Loan types</button>
    </div>
    <div class="rp-tabs ct-tabs"><button class="${_catTab === 'expense' ? 'on' : ''}" onclick="setCatTab('expense')">Expense</button><button class="${_catTab === 'income' ? 'on' : ''}" onclick="setCatTab('income')">Income</button></div>
    ${yours.length ? _pk.sec('Your categories', `<em>${yours.length}</em>`) + `<div class="pk-list">${yours.map(r).join('')}</div>` : ''}
    ${_pk.sec('Built-in', `<em>${built.length}</em>`)}<div class="pk-list">${built.map(r).join('')}</div>
    <p class="pk-foot">Tap a category to see its entries and trend. Built-in categories can’t be deleted.</p>
  </div>`;
  _pk.done(c);
}

// Modal helpers: tag the modal body so app styles target only the right popup
(function () {
  if (typeof openModal !== 'function') return;
  const om = openModal;
  window.openModal = function () { const r = om.apply(this, arguments); const b = document.getElementById('modal-body'); if (b) b.dataset.kind = ''; return r; };
  const tag = (fn, kind, after) => { const f = window[fn]; if (typeof f !== 'function') return;
    window[fn] = function () { const r = f.apply(this, arguments); if (window.__IS_APP) { const b = document.getElementById('modal-body'); if (b) { b.dataset.kind = kind; if (after) after(b); } } return r; }; };
  tag('openManageTypesModal', 'types');
  tag('openAddCategoryModal', 'catform');
  tag('openEditCategoryModal', 'catform');
  tag('openGeminiCategorize', 'aifix', b => {
    const pr = document.getElementById('gem-prompt'); const prompt = pr ? pr.value : '';
    const n = ((b.querySelector('p b') || {}).textContent || '0');
    b.innerHTML = `<div class="af">
      <div class="af-hero"><b>${_pk.e(n)}</b><span>entries in “Other”</span><small>Let Gemini or ChatGPT sort them for you — free, 1 minute.</small></div>
      <div class="af-step"><span class="af-n">1</span><div><b>Copy the request</b><small>It lists your entries and your categories.</small>
        <div class="af-btns"><button class="p" onclick="navigator.clipboard.writeText(document.getElementById('gem-prompt').value).then(()=>toast('Copied — now open Gemini','success'))"><i data-lucide="copy"></i>Copy</button>
        <button onclick="window.open('https://gemini.google.com/app','_blank')"><i data-lucide="external-link"></i>Open Gemini</button></div>
        <details><summary>See what will be sent</summary><textarea id="gem-prompt" readonly>${_pk.e(prompt)}</textarea></details></div></div>
      <div class="af-step"><span class="af-n">2</span><div><b>Paste its answer here</b><small>Copy the reply from the AI and paste it below.</small>
        <textarea id="gem-answer" placeholder='{"Swiggy order":"Food", …}'></textarea>
        <div class="af-btns"><button onclick="navigator.clipboard.readText().then(t=>{document.getElementById('gem-answer').value=t;toast('Pasted','success')}).catch(()=>toast('Long-press the box and choose Paste','info'))"><i data-lucide="clipboard-paste"></i>Paste</button></div></div></div>
      <button class="af-go" onclick="applyGeminiCategories()"><i data-lucide="sparkles"></i>Apply categories</button>
    </div>`;
    if (typeof _lucideRefresh === 'function') _lucideRefresh();
  });
})();
