// ============================================================
//  banks2.js — build 728: new Banks · Cash · Cards page (app)
//  One page for all three: hero with what you really have, quick
//  actions, a tab per kind, account rows with a one-tap Update
//  button and "updated X ago" (amber when old), card limit bars,
//  a trend line you can filter by account, then the history card.
//  Same data, same Update / options pop-ups. Classic web unchanged.
// ============================================================
(function () {
  if (!window.__IS_APP) return;
  const S = v => (typeof _asShort === 'function' ? _asShort(v) : fmt(v));
  const E = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const KIND = {
    banks: { lg: 'bank', list: () => STATE.bankAccounts || [], hist: 'bankBalanceHistory', idF: 'accountId', val: 'balance', sel: () => bankTrackerAccount, set: v => { bankTrackerAccount = v; }, ic: 'landmark', nm: a => a.bankName || a.name || 'Bank', upd: a => `openQuickBalanceModal('${a.id}')`, menu: 'bank', add: 'addBankAccount()', word: 'Bank' },
    cash:  { lg: 'cash', list: () => STATE.cashAccounts || [], hist: 'cashBalanceHistory', idF: 'accountId', val: 'balance', sel: () => bankTrackerCash, set: v => { bankTrackerCash = v; }, ic: 'wallet', nm: a => a.name || 'Cash', upd: a => `openQuickCashModal('${a.id}')`, menu: 'cash', add: 'addCashAccount()', word: 'Wallet' },
    cards: { lg: 'card', list: () => STATE.creditCards || [], hist: 'creditCardHistory', idF: 'cardId', val: 'outstanding', sel: () => bankTrackerCard, set: v => { bankTrackerCard = v; }, ic: 'credit-card', nm: a => a.bankName || a.name || 'Card', upd: a => `openUpdateCCModal('${a.id}')`, menu: 'card', add: 'addCreditCard()', word: 'Card' },
  };
  const ago = (K, id) => {
    const h = (STATE[K.hist] || []).filter(x => x[K.idF] === id).sort((a, b) => ((b.createdAt || b.date || '') + '').localeCompare((a.createdAt || a.date || '') + ''))[0];
    if (!h) return { t: 'never updated', old: true };
    const d = Math.floor((Date.now() - new Date(h.createdAt || h.date + 'T12:00:00')) / 864e5);
    return { t: d <= 0 ? 'updated today' : d === 1 ? 'updated yesterday' : `updated ${d} days ago`, old: d >= 7 };
  };
  window.bkDots = el => { const w = el.firstElementChild ? el.firstElementChild.offsetWidth + 12 : 1, i = Math.round(el.scrollLeft / w); el.nextElementSibling && [...el.nextElementSibling.children].forEach((d, k) => d.classList.toggle('on', k === i)); };
  window.bkTab = t => { bankTrackerTab = t; renderBankTracker(); };
  window.bkPick = (t, id) => { const K = KIND[t]; K.set(K.sel() === id ? null : id); renderBankTracker(); };

  function trend(K, items) {
    const { labels, data } = buildTrendSeries(trendPeriod, items, STATE[K.hist] || [], K.idF, K.val);
    const pts = data.map((v, i) => [i, v]).filter(p => p[1] != null);
    if (pts.length < 2) return `<p class="ldx-empty">Update a balance a few times to see the trend here.</p>`;
    const vs = pts.map(p => p[1]), lo = Math.min(...vs), hi = Math.max(...vs), rg = (hi - lo) || 1, n = data.length - 1 || 1;
    const W = 320, H = 120, x = i => i / n * W, y = v => H - 8 - (v - lo) / rg * (H - 20);
    const line = pts.map(p => `${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(' ');
    const first = vs[0], last = vs[vs.length - 1], d = last - first, good = K.lg === 'card' ? d <= 0 : d >= 0;
    const lp = pts[pts.length - 1];
    return `<svg viewBox="0 0 ${W} ${H + 16}" class="adx-svg ${good ? '' : 'down'}"><defs><linearGradient id="adxg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="s0"/><stop offset="1" class="s1"/></linearGradient></defs>
      <polygon points="${x(pts[0][0]).toFixed(1)},${H} ${line} ${x(lp[0]).toFixed(1)},${H}" fill="url(#adxg)" class="adx-area"/><polyline points="${line}" class="adx-line"/><circle cx="${x(lp[0])}" cy="${y(lp[1])}" r="5" class="adx-dot"/>
      <text x="0" y="${H + 13}">${labels[0] || ''}</text><text x="${W}" y="${H + 13}" text-anchor="end">${labels[labels.length - 1] || ''}</text></svg>
      <p class="anx-cap">High <b>${S(hi)}</b> · Low <b>${S(lo)}</b> · ${d === 0 ? 'no change' : `<b class="${good ? 'up' : 'down'}">${d > 0 ? '+' : '−'}${S(Math.abs(d))}</b> ${K.lg === 'card' ? (d > 0 ? 'more due' : 'paid off') : ''} over this time`}</p>`;
  }

  let _bkWk = 0, _bkDay = -1;
  window.bkWeek = d => { _bkWk = Math.min(0, _bkWk + d); _bkDay = -1; renderBankTracker(); };
  window.bkDay = i => { _bkDay = _bkDay === i ? -1 : i; renderBankTracker(); };
  const ymd = d => Money.ymd(d);
  const dayTot = d => { const k = ymd(d); let i = 0, o = 0; Money.all().forEach(t => { if (Money.day(t) !== k) return; if (Money.isIncome(t)) i += Money.amt(t); else o += Money.amt(t); }); return { i, o }; };
  const spark = (vals, cls) => { const W = 70, H = 24, mx = Math.max(...vals, 1), n = vals.length - 1 || 1;
    return `<svg viewBox="0 0 ${W} ${H}" class="bk-spark ${cls}"><polyline points="${vals.map((v, i) => `${(i / n * W).toFixed(1)},${(H - 2 - v / mx * (H - 4)).toFixed(1)}`).join(' ')}"/></svg>`; };
  function wave(banks, cash) {
    const a = buildTrendSeries('30d', banks, STATE.bankBalanceHistory || [], 'accountId', 'balance');
    const b = buildTrendSeries('30d', cash, STATE.cashBalanceHistory || [], 'accountId', 'balance');
    const v = a.data.map((x, i) => (x == null && b.data[i] == null) ? null : (+x || 0) + (+b.data[i] || 0));
    const pts = v.map((x, i) => [i, x]).filter(p => p[1] != null);
    if (pts.length < 2) return { svg: '', d: 0 };
    const lo = Math.min(...pts.map(p => p[1])), hi = Math.max(...pts.map(p => p[1])), rg = (hi - lo) || 1, n = v.length - 1, W = 320, H = 90;
    const xy = p => [p[0] / n * W, H - 10 - (p[1] - lo) / rg * (H - 30)];
    let d = `M${xy(pts[0]).map(z => z.toFixed(1)).join(',')}`;
    for (let k = 1; k < pts.length; k++) { const [x0, y0] = xy(pts[k - 1]), [x1, y1] = xy(pts[k]), cx = (x0 + x1) / 2; d += ` C${cx.toFixed(1)},${y0.toFixed(1)} ${cx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`; }
    const [lx, ly] = xy(pts[pts.length - 1]), [fx] = xy(pts[0]);
    return { d: pts[pts.length - 1][1] - pts[0][1], svg: `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="bk-wave"><defs><linearGradient id="bkw" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><path d="${d} L${lx.toFixed(1)},${H} L${fx.toFixed(1)},${H} Z" fill="url(#bkw)"/><path d="${d}" class="ln"/><line x1="${lx.toFixed(1)}" x2="${lx.toFixed(1)}" y1="${ly.toFixed(1)}" y2="${H}" class="vl"/></svg><span class="bk-wdot" style="left:${(lx / W * 100).toFixed(1)}%;top:${(ly / H * 100).toFixed(1)}%"></span>` };
  }

  function render() {
    try { reconcileCurrentBalances(); } catch (_) {}
    const c = document.getElementById('page-container'); if (!c) return;
    const tab = KIND[bankTrackerTab] ? bankTrackerTab : 'banks', K = KIND[tab];
    const banks = STATE.bankAccounts || [], cash = STATE.cashAccounts || [], cards = STATE.creditCards || [];
    const tb = banks.reduce((s, a) => s + (+a.balance || 0), 0), tc = cash.reduce((s, a) => s + (+a.balance || 0), 0), td = cards.reduce((s, a) => s + (+a.outstanding || 0), 0);
    const net = tb + tc - td;
    const list = K.list(), sel = K.sel(), items = sel ? list.filter(a => a.id === sel) : list;
    const stale = [...banks.map(a => ago(KIND.banks, a.id)), ...cash.map(a => ago(KIND.cash, a.id)), ...cards.map(a => ago(KIND.cards, a.id))].filter(x => x.old).length;
    // last change per account (from its newest log entry)
    const lastD = a => { const h = (STATE[K.hist] || []).filter(x => x[K.idF] === a.id).sort((x, y) => ((x.date || '') + (x.createdAt || '')).localeCompare((y.date || '') + (y.createdAt || ''))).pop(); const pv = h && h[K.lg === 'card' ? 'prevOutstanding' : 'prevBalance']; return h && pv != null ? h[K.val] - pv : null; };
    const row = (a, i) => {
      const col = _PK_COLS[(i + ['banks', 'cash', 'cards'].indexOf(tab) * 3) % _PK_COLS.length];
      const u = ago(K, a.id), on = sel === a.id, nm = K.nm(a);
      const val = tab === 'cards' ? +a.outstanding || 0 : +a.balance || 0, dl = lastD(a);
      const good = dl == null ? true : tab === 'cards' ? dl <= 0 : dl >= 0;
      const kindTxt = `${E(a.type || (tab === 'cash' ? 'Cash' : tab === 'cards' ? 'Credit card' : 'Bank account'))}${a.lastFour ? ' ·· ' + E(a.lastFour) : ''}`;
      let use = '';
      if (tab === 'cards') { const lim = +a.limit || 0, pct = lim > 0 ? Math.round(val / lim * 100) : null;
        const due = a.dueDate ? new Date(a.dueDate + 'T00:00:00') : null, dd = due ? Math.ceil((due - new Date().setHours(0, 0, 0, 0)) / 864e5) : null;
        use = pct != null ? `<span class="as-prog bk-use ${pct > 80 ? 'hi' : ''}"><i style="width:${Math.min(100, pct)}%"></i></span><small class="as-prog-t">${pct}% of ${S(lim)} used${dd != null && val > 0 ? ` · <span class="${dd <= 3 ? 'down' : ''}">${dd < 0 ? 'due date passed' : dd === 0 ? 'due today' : 'due in ' + dd + 'd'}</span>` : ''}</small>` : ''; }
      return `<div class="bk-pill ${on ? 'on' : ''}" onclick="bkPick('${tab}','${a.id}')">
        <span class="bk-logo" style="--c:${col}">${E((nm.match(/[A-Za-z0-9]/g) || ['?']).slice(0, 2).join('').toUpperCase())}</span>
        <span class="bk-pm"><b>${E(nm)}${a.inactive ? ' <em class="bk-off">inactive</em>' : ''}</b><small>${kindTxt}</small><small class="bk-ago ${u.old ? 'old' : ''}"><i data-lucide="${u.old ? 'alert-circle' : 'check-circle-2'}"></i>${u.t}</small>${use}</span>
        <span class="bk-pr"><b class="${tab === 'cards' && val > 0 ? 'neg' : ''}">${fmt(Math.round(val))}</b>${dl ? `<em class="${good ? 'up' : 'down'}">${dl > 0 ? '↗' : '↘'} ${S(Math.abs(dl))}</em>` : ''}
          <span><button class="bk-up ${u.old ? 'old' : ''}" onclick="event.stopPropagation();${K.upd(a)}">${tab === 'cards' ? 'Pay' : 'Update'}</button><button class="bk-more" onclick="event.stopPropagation();openAccountMenu('${K.menu}',${i})" aria-label="Options"><i data-lucide="more-horizontal"></i></button></span></span></div>`;
    };
    const GR = [['#4C1D95', '#7C4DFF'], ['#0E7490', '#22D3EE'], ['#9F1239', '#F43F5E'], ['#065F46', '#10B981'], ['#92400E', '#F59E0B'], ['#1E3A8A', '#3B82F6'], ['#701A75', '#D946EF']];
    const card = (a, i) => {
      const g = GR[(i + ['banks', 'cash', 'cards'].indexOf(tab) * 2) % GR.length], u = ago(K, a.id), on = sel === a.id, nm = K.nm(a);
      const val = tab === 'cards' ? +a.outstanding || 0 : +a.balance || 0, dl = lastD(a);
      let foot = `<span class="bk-cago ${u.old ? 'old' : ''}">${u.old ? '⚠ ' : ''}${u.t}</span>${dl ? `<span class="bk-cdl">${dl > 0 ? '↗ +' : '↘ −'}${S(Math.abs(dl))}</span>` : ''}`;
      if (tab === 'cards') { const lim = +a.limit || 0, pct = lim > 0 ? Math.round(val / lim * 100) : null, due = a.dueDate ? new Date(a.dueDate + 'T00:00:00') : null, dd = due ? Math.ceil((due - new Date().setHours(0, 0, 0, 0)) / 864e5) : null;
        foot = (pct != null ? `<span class="bk-climit"><i style="width:${Math.min(100, pct)}%"></i></span><span class="bk-cago">${pct}% of ${S(lim)} limit${dd != null && val > 0 ? ' · ' + (dd < 0 ? 'due date passed' : dd === 0 ? 'due today' : 'due in ' + dd + 'd') : ''}</span>` : '') + `<span class="bk-cago ${u.old ? 'old' : ''}">${u.t}</span>`; }
      return `<div class="bk-card ${on ? 'on' : ''}" style="--g1:${g[0]};--g2:${g[1]}" onclick="bkPick('${tab}','${a.id}')">
        <div class="bk-ct"><span class="bk-cn">${E(nm)}${a.inactive ? ' · inactive' : ''}</span><button onclick="event.stopPropagation();openAccountMenu('${K.menu}',${i})" aria-label="Options"><i data-lucide="more-horizontal"></i></button></div>
        <small class="bk-ck">${tab === 'cards' ? 'Due now' : 'Balance'}</small><b class="bk-cv">${fmt(Math.round(val))}</b>
        <span class="bk-cm">${E(a.type || (tab === 'cash' ? 'Cash' : tab === 'cards' ? 'Credit card' : 'Bank account'))}${a.lastFour ? ' •••• ' + E(a.lastFour) : ''}</span>
        <div class="bk-cf"><div>${foot}</div><button class="bk-cup ${u.old ? 'old' : ''}" onclick="event.stopPropagation();${K.upd(a)}">${tab === 'cards' ? 'Pay' : 'Update'}</button></div>
      </div>`;
    };
    // cash-flow week
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) + _bkWk * 7);
    const days = [...Array(7)].map((_, k) => { const d = new Date(mon); d.setDate(mon.getDate() + k); return { d, ...dayTot(d), fut: d > now, today: +d === +now }; });
    const wi = days.reduce((s, x) => s + x.i, 0), wo = days.reduce((s, x) => s + x.o, 0);
    const past = days.filter(x => !x.fut), avg = past.length ? wo / past.length : 0, mx = Math.max(1, ...days.map(x => x.o), avg);
    const pick = days[_bkDay] || null;
    const bars = days.map((x, k) => `<button class="bk-bar ${x.today ? 'today' : ''} ${_bkDay === k ? 'sel' : ''} ${x.fut ? 'fut' : ''}" style="--h:${Math.max(2, x.o / mx * 100)}%;--d:${k * 60}ms" onclick="bkDay(${k})"><span class="tr"><span class="t"><i></i></span></span><small>${x.d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</small></button>`).join('');
    // 14-day sparklines
    const last14 = [...Array(14)].map((_, k) => { const d = new Date(now); d.setDate(now.getDate() - 13 + k); return dayTot(d); });
    const sum = (arr, f) => arr.reduce((s, x) => s + x[f], 0);
    const chip = (a, b, goodUp) => { if (!(b > 0)) return '<em class="bk-chip">new</em>'; const p = Math.round((a / b - 1) * 100), g = goodUp ? p >= 0 : p <= 0; return `<em class="bk-chip ${g ? 'g' : 'b'}">${p >= 0 ? '↑' : '↓'} ${Math.abs(p)}%</em>`; };
    const inN = sum(last14.slice(7), 'i'), inP = sum(last14.slice(0, 7), 'i'), outN = sum(last14.slice(7), 'o'), outP = sum(last14.slice(0, 7), 'o');
    const W = wave(banks, cash);
    const tabs = [['banks', 'Banks', banks.length], ['cash', 'Cash', cash.length], ['cards', 'Cards', cards.length]];
    const updOn = tab === 'cards' ? (cards[0] ? `openUpdateCCModal('${(sel || cards[0].id)}')` : 'addCreditCard()') : tab === 'cash' ? `openQuickCashModal(${sel ? `'${sel}'` : ''})` : `openQuickBalanceModal(${sel ? `'${sel}'` : ''})`;
    c.innerHTML = `<div class="pk asx bkx">
      <div class="anx-top bk-top"><h1>Banks &amp; Cards</h1><button class="bk-black" onclick="${updOn}"><i data-lucide="${tab === 'cards' ? 'credit-card' : 'refresh-cw'}"></i>${tab === 'cards' ? 'Pay card' : 'Update balance'}</button></div>
      <div class="bk-wcard ${net < 0 ? 'neg' : ''}" style="grid-area:wave">
        <div class="bk-wh"><span>Money you really have</span>${stale ? `<em>${stale} to update</em>` : '<em>All up to date</em>'}</div>
        <b class="bk-wv">${net < 0 ? '−' : ''}${fmt(Math.abs(Math.round(net)))}</b><small class="bk-wt">Today</small>
        <div class="bk-wbox">${W.svg}</div>
        ${W.d ? `<span class="bk-wchg">${W.d >= 0 ? '↑' : '↓'} ${S(Math.abs(W.d))} in 30 days</span>` : ''}
        <div class="bk-chips">${[['banks', 'Banks', tb], ['cash', 'Cash', tc], ['cards', 'Card dues', td]].map(([k, l, v]) => `<button class="${tab === k ? 'on' : ''}" onclick="bkTab('${k}')"><small>${l}</small><b>${k === 'cards' && v > 0 ? '−' : ''}${S(v)}</b></button>`).join('')}</div>
      </div>
      <div class="bk-minis" style="grid-area:minis">
        <div class="bk-mini"><span>Money in <small>last 7 days</small></span>${spark(last14.map(x => x.i), 'in')}<b>${S(inN)}</b>${chip(inN, inP, true)}</div>
        <div class="bk-mini"><span>Money out <small>last 7 days</small></span>${spark(last14.map(x => x.o), 'out')}<b>${S(outN)}</b>${chip(outN, outP, false)}</div>
      </div>
      <div class="pk-card bk-acc" style="grid-area:acc">
        <div class="bk-ah"><span>Your accounts</span><button class="bk-more" onclick="${K.add}" aria-label="Add"><i data-lucide="plus"></i></button></div>
        <div class="bk-tabs">${tabs.map(([k, l, n]) => `<button class="${tab === k ? 'on' : ''}" onclick="bkTab('${k}')">${l}<small>${n}</small></button>`).join('')}</div>
        ${list.length ? `<div class="bk-cards" onscroll="bkDots(this)">${list.map(card).join('')}<button class="bk-cadd" onclick="${K.add}"><i data-lucide="plus"></i>Add ${K.word.toLowerCase()}</button></div><div class="bk-dots">${list.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}<i></i></div>
          <div class="bk-af"><span>${sel ? `Showing <b>${E(K.nm(list.find(a => a.id === sel) || {}))}</b> only` : 'Swipe your cards · tap one to see only its history'}</span>${sel ? `<button class="bk-ghost" onclick="bkPick('${tab}','${sel}')">Show all</button>` : banks.length >= 2 && tab === 'banks' ? `<button class="bk-purple" onclick="openTransferModal()"><i data-lucide="arrow-left-right"></i>Move money</button>` : `<button class="bk-ghost" onclick="openBalanceImport('${tab === 'cards' ? 'card' : 'bank'}')">Import</button>`}</div>`
        : _pk.empty({ ic: K.ic, t: `No ${tab === 'cards' ? 'cards' : tab === 'cash' ? 'wallets' : 'bank accounts'} yet`, s: tab === 'cards' ? 'Add a credit card to track what you owe and when it is due.' : tab === 'cash' ? 'Add a wallet to keep track of the cash you carry.' : 'Add your bank account and update its balance from your bank app now and then.', btns: [[`Add ${K.word.toLowerCase()}`, K.add, 1]] })}
      </div>
      <div class="pk-card bk-flow" style="grid-area:flow">
        <div class="bk-fh"><span>Cash flow</span><div class="bk-wk"><button onclick="bkWeek(-1)" aria-label="Previous week"><i data-lucide="chevron-left"></i></button><b>${_bkWk === 0 ? 'This week' : _bkWk === -1 ? 'Last week' : mon.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</b><button onclick="bkWeek(1)" ${_bkWk >= 0 ? 'disabled' : ''} aria-label="Next week"><i data-lucide="chevron-right"></i></button></div></div>
        <div class="bk-io"><div><span class="ic in"><i data-lucide="arrow-down-left"></i></span><span><small>Income</small><b>${fmt(Math.round(wi))}</b></span></div><div><span class="ic out"><i data-lucide="arrow-up-right"></i></span><span><small>Outgoing</small><b>${fmt(Math.round(wo))}</b></span></div></div>
        <div class="bk-chart" style="--a:${(avg / mx).toFixed(3)}"><span class="bk-avg"><em>avg ${S(avg)}/day</em></span>${bars}</div>
        <p class="anx-cap">${pick ? `<b>${pick.d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</b> · in <b class="up">${fmt(Math.round(pick.i))}</b> · out <b class="down">${fmt(Math.round(pick.o))}</b>` : 'Tap a day to see its money in and out'}</p>
      </div>
      ${sel && list.length ? `<div class="pk-card ldx-card bk-tr" style="grid-area:tr"><div class="ldx-ct"><span>${E(K.nm(list.find(a => a.id === sel) || {}))} trend</span><div class="nw-chips bk-per"><button class="${trendPeriod !== '1y' ? 'on' : ''}" onclick="setTrendPeriod('30d')">30 days</button><button class="${trendPeriod === '1y' ? 'on' : ''}" onclick="setTrendPeriod('1y')">1 year</button></div></div>${trend(K, items)}</div>` : ''}
      ${list.length ? `<div class="lg-host bk-log" style="grid-area:log">${typeof logCardApp === 'function' ? logCardApp(K.lg) : ''}</div>` : ''}
    </div>`;
    _pk.done(c);
  }
  window.renderBankTracker = render;
  window.renderCashTracker = () => { bankTrackerTab = 'cash'; render(); };
  window.renderCCTracker = () => { bankTrackerTab = 'cards'; render(); };
})();
