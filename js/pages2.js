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
