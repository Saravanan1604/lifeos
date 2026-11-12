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

  function render() {
    try { reconcileCurrentBalances(); } catch (_) {}
    const c = document.getElementById('page-container'); if (!c) return;
    const tab = KIND[bankTrackerTab] ? bankTrackerTab : 'banks', K = KIND[tab];
    const banks = STATE.bankAccounts || [], cash = STATE.cashAccounts || [], cards = STATE.creditCards || [];
    const tb = banks.reduce((s, a) => s + (+a.balance || 0), 0), tc = cash.reduce((s, a) => s + (+a.balance || 0), 0), td = cards.reduce((s, a) => s + (+a.outstanding || 0), 0);
    const net = tb + tc - td, have = tb + tc;
    const list = K.list(), sel = K.sel(), items = sel ? list.filter(a => a.id === sel) : list;
    const stale = [...banks.map(a => ago(KIND.banks, a.id)), ...cash.map(a => ago(KIND.cash, a.id)), ...cards.map(a => ago(KIND.cards, a.id))].filter(x => x.old).length;
    const row = (a, i) => {
      const col = _PK_COLS[(i + ['banks', 'cash', 'cards'].indexOf(tab) * 3) % _PK_COLS.length];
      const u = ago(K, a.id), on = sel === a.id;
      const kindTxt = `${E(a.type || (tab === 'cash' ? 'Cash' : tab === 'cards' ? '' : ''))}${a.lastFour ? ' •••• ' + E(a.lastFour) : ''}`;
      let mid = `${kindTxt ? `<small>${kindTxt}</small>` : ''}<small class="bk-ago ${u.old ? 'old' : ''}"><i data-lucide="${u.old ? 'alert-circle' : 'check-circle-2'}"></i>${u.t}</small>`, val = +a.balance || 0, cls = '';
      if (tab === 'cards') { val = +a.outstanding || 0; cls = val > 0 ? 'neg' : '';
        const lim = +a.limit || 0, pct = lim > 0 ? Math.round(val / lim * 100) : null;
        const due = a.dueDate ? new Date(a.dueDate + 'T00:00:00') : null, dd = due ? Math.ceil((due - new Date().setHours(0, 0, 0, 0)) / 864e5) : null;
        mid += pct != null ? `<span class="as-prog bk-use ${pct > 80 ? 'hi' : ''}"><i style="width:${Math.min(100, pct)}%"></i></span><small class="as-prog-t">${pct}% of ${S(lim)} used${dd != null && val > 0 ? ` · <span class="${dd <= 3 ? 'down' : ''}">${dd < 0 ? 'due date passed' : dd === 0 ? 'due today' : 'due in ' + dd + ' days'}</span>` : ''}</small>` : ''; }
      return `<div class="bk-row ${on ? 'on' : ''}" onclick="bkPick('${tab}','${a.id}')"><span class="as-ic" style="--c:${col}"><i data-lucide="${K.ic}"></i></span>
        <span class="as-m"><b>${E(K.nm(a))}${a.inactive ? ' <em class="bk-off">inactive</em>' : ''}</b>${mid}</span>
        <span class="bk-r"><b class="${cls}">${fmt(Math.round(val))}</b><span><button class="bk-up ${u.old ? 'old' : ''}" onclick="event.stopPropagation();${K.upd(a)}">${tab === 'cards' ? 'Pay' : 'Update'}</button><button class="bk-more" onclick="event.stopPropagation();openAccountMenu('${K.menu}',${i})" aria-label="Options"><i data-lucide="more-horizontal"></i></button></span></span></div>`;
    };
    const tabs = [['banks', 'Banks', banks.length, tb], ['cash', 'Cash', cash.length, tc], ['cards', 'Cards', cards.length, td]];
    c.innerHTML = `<div class="pk asx bkx">
      <div class="anx-top"><h1>Banks &amp; Cards</h1><button onclick="${K.add}"><i data-lucide="plus"></i>Add ${K.word.toLowerCase()}</button></div>
      <div class="as-hero ${net < 0 ? 'neg' : ''} bk-hero">
        <div class="as-hero-top"><span>Money you really have</span>${stale ? `<em class="anx-rate">${stale} need${stale === 1 ? 's' : ''} an update</em>` : ''}</div>
        <b class="as-nw">${net < 0 ? '−' : ''}${fmt(Math.abs(Math.round(net)))}</b>
        <p class="as-say">${td > 0 ? `Bank + cash <b>${S(have)}</b> minus card dues <b>${S(td)}</b>` : `In your banks and wallets`}</p>
        <div class="bk-chips">${tabs.map(([k, l, n, v]) => `<button class="${tab === k ? 'on' : ''}" onclick="bkTab('${k}')"><small>${l}</small><b>${k === 'cards' && v > 0 ? '−' : ''}${S(v)}</b></button>`).join('')}</div>
      </div>
      <div class="as-acts">
        <button onclick="${tab === 'cards' ? (cards[0] ? `openUpdateCCModal('${(sel || cards[0].id)}')` : 'addCreditCard()') : tab === 'cash' ? `openQuickCashModal(${sel ? `'${sel}'` : ''})` : `openQuickBalanceModal(${sel ? `'${sel}'` : ''})`}"><span class="xg"><i data-lucide="refresh-cw"></i></span>${tab === 'cards' ? 'Pay card' : 'Update'}</button>
        <button onclick="${banks.length >= 2 ? 'openTransferModal()' : "toast('Add a second bank account to move money between them','info')"}"><span class="xc"><i data-lucide="arrow-left-right"></i></span>Move money</button>
        <button onclick="openBalanceImport('${tab === 'cards' ? 'card' : 'bank'}')"><span class="xp"><i data-lucide="file-up"></i></span>Import</button>
        <button onclick="${K.add}"><span class="xr"><i data-lucide="plus"></i></span>Add ${K.word.toLowerCase()}</button>
      </div>
      <div class="as-seg bk-seg">${tabs.map(([k, l, n]) => `<button class="${tab === k ? 'on' : ''}" onclick="bkTab('${k}')">${l} <small>${n}</small></button>`).join('')}</div>
      ${list.length ? `<div class="pk-list bk-list">${list.map(row).join('')}</div>
        ${sel ? `<button class="bk-all" onclick="bkPick('${tab}','${sel}')"><i data-lucide="x"></i>Showing ${E(K.nm(list.find(a => a.id === sel) || {}))} only — show all</button>` : `<p class="bk-tip">Tap an account to see only its trend and history.</p>`}
        <div class="pk-card ldx-card"><div class="ldx-ct"><span>${tab === 'cards' ? 'Card dues' : 'Balance'} trend</span><div class="nw-chips bk-per"><button class="${trendPeriod !== '1y' ? 'on' : ''}" onclick="setTrendPeriod('30d')">30 days</button><button class="${trendPeriod === '1y' ? 'on' : ''}" onclick="setTrendPeriod('1y')">1 year</button></div></div>${trend(K, items)}</div>
        <div class="lg-host bk-log">${typeof logCardApp === 'function' ? logCardApp(K.lg) : ''}</div>`
      : _pk.empty({ ic: K.ic, t: `No ${tab === 'cards' ? 'cards' : tab === 'cash' ? 'wallets' : 'bank accounts'} yet`, s: tab === 'cards' ? 'Add a credit card to track what you owe and when it is due.' : tab === 'cash' ? 'Add a wallet to keep track of the cash you carry.' : 'Add your bank account and update its balance from your bank app now and then.', btns: [[`Add ${K.word.toLowerCase()}`, K.add, 1]] })}
    </div>`;
    _pk.done(c);
  }
  window.renderBankTracker = render;
  window.renderCashTracker = () => { bankTrackerTab = 'cash'; render(); };
  window.renderCCTracker = () => { bankTrackerTab = 'cards'; render(); };
})();
