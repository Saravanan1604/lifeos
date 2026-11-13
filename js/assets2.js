// ============================================================
//  assets2.js — build 725: new Assets page (app)
//  Net-worth hero with count-up and animated own-vs-owe bar, quick
//  actions, 4 insight tiles, Assets / Loans switch with totals, tappable
//  allocation ring, colourful rows with gain pills and loan progress,
//  debt-free plan, trend. Same data and same detail / add screens.
// ============================================================
function _asShort(v) {
  const a = Math.abs(v), s = v < 0 ? '−' : '';
  if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(a >= 1e8 ? 0 : 1).replace(/\.0$/, '') + 'Cr';
  if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(a >= 1e6 ? 0 : 1).replace(/\.0$/, '') + 'L';
  if (a >= 1e3) return s + '₹' + Math.round(a / 1e3) + 'K';
  return s + '₹' + Math.round(a);
}
function _asCountUp(el, target, neg) {
  if (!el || document.getElementById('page-container').classList.contains('no-anim')) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const t0 = performance.now(), dur = 900, final = el.textContent;
  const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = (neg ? '−' : '') + fmt(Math.round(target * e)); if (k < 1) requestAnimationFrame(step); else el.textContent = final; };
  requestAnimationFrame(step);
}
function asScrub(e) {
  const box = e.currentTarget, P = window.__asPts; if (!P || !P.length) return;
  const r = box.getBoundingClientRect(), f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  let best = P[0]; P.forEach(p => { if (Math.abs(p.x - f) < Math.abs(best.x - f)) best = p; });
  const dot = document.getElementById('asl-dot'), tip = document.getElementById('asl-tip'), big = document.getElementById('as-nw');
  if (dot) { dot.style.left = best.x * 100 + '%'; dot.style.top = best.y * 100 + '%'; }
  if (tip) { tip.style.left = Math.max(12, Math.min(88, best.x * 100)) + '%'; tip.textContent = new Date(best.d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); tip.classList.add('on'); }
  if (big) { if (!big.dataset.orig) big.dataset.orig = big.textContent; big.textContent = (best.v < 0 ? '−' : '') + fmt(Math.abs(Math.round(best.v))); }
}
function asScrubEnd() {
  const P = window.__asPts, big = document.getElementById('as-nw'), tip = document.getElementById('asl-tip'), dot = document.getElementById('asl-dot');
  if (big && big.dataset.orig) { big.textContent = big.dataset.orig; delete big.dataset.orig; }
  if (tip) tip.classList.remove('on');
  if (dot && P && P.length) { const l = P[P.length - 1]; dot.style.left = l.x * 100 + '%'; dot.style.top = l.y * 100 + '%'; }
}
function renderInvestmentsApp() {
  const c = document.getElementById('page-container'); if (!c) return;
  const inv = STATE.investments || [], loans = STATE.loans || [];
  const invested = inv.reduce((s, i) => s + (+i.amount || 0), 0);
  const assets = inv.reduce((s, i) => s + _assetCur(i), 0);
  const owe = loans.reduce((s, l) => s + _loanOutstanding(l), 0);
  const cash = (STATE.bankAccounts || []).reduce((s, b) => s + (+b.balance || 0), 0) + (STATE.cashAccounts || []).reduce((s, b) => s + (+b.balance || 0), 0);
  const own = assets, nw = assets - owe, neg = nw < 0;
  _recordNetWorthSnapshot(nw);
  const hist = STATE.netWorthHistory || [];
  const mStart = _ymdLocal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const base = hist.find(p => p.date >= mStart) || hist[0];
  const chg = base ? nw - base.value : 0;
  const emi = loans.reduce((s, l) => s + (+l.emi || 0), 0);
  const ym = _ymdLocal(new Date()).slice(0, 7), pm = _ymdLocal(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)).slice(0, 7);
  const inc = Money.monthTotals(ym).income || Money.monthTotals(pm).income;
  const emiPct = inc > 0 && emi > 0 ? Math.round(emi / inc * 100) : null;
  let df = null; if (typeof _loanPayoff === 'function') loans.forEach(l => { const p = _loanPayoff(l); if (p.months && (!df || p.end > df)) df = p.end; });
  const gain = assets - invested, gainPct = invested > 0 ? gain / invested * 100 : 0;
  const tot = own + owe, ap = tot > 0 ? Math.round(own / tot * 100) : 50;
  const isA = invView !== 'liabilities';
  const E = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  // allocation for the current view
  const alloc = {}; (isA ? inv : loans).forEach(x => { const v = isA ? _assetCur(x) : _loanOutstanding(x); if (v > 0) alloc[x.type || 'Other'] = (alloc[x.type || 'Other'] || 0) + v; });
  const ent = Object.entries(alloc).sort((a, b) => b[1] - a[1]), aTot = ent.reduce((s, e) => s + e[1], 0);
  const cols = ent.map(([t], i) => typeColor(isA ? 'asset' : 'loan', t) || ASSET_CAT_COLORS[i % ASSET_CAT_COLORS.length]);
  const subs = {}; ent.forEach(([t, v]) => { subs[t] = `${Math.round(v / aTot * 100)}% · ${(isA ? inv : loans).filter(x => (x.type || 'Other') === t).length} item(s)`; });

  const list = isA ? [...inv].sort((a, b) => _assetCur(b) - _assetCur(a)) : [...loans].sort((a, b) => _loanOutstanding(b) - _loanOutstanding(a));
  const shown = invShowAll ? list : list.slice(0, 6);
  const row = x => {
    const col = typeColor(isA ? 'asset' : 'loan', x.type) || '#8B5CF6';
    const ic = isA ? _assetLucide(x.type) : _loanLucide(x.type);
    if (isA) {
      const cur = _assetCur(x), g = cur - (+x.amount || 0), gp = x.amount > 0 ? g / x.amount * 100 : 0;
      const sub = x.type === 'Money Lent' ? `Lent${x.person ? ' to ' + E(x.person) : ''}` : `${E(x.type || '')}${x.date ? ' · ' + new Date(x.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}`;
      return `<button class="as-row" onclick="openAssetDetail('${x.id}')"><span class="as-ic" style="--c:${col}"><i data-lucide="${ic}"></i></span>
        <span class="as-m"><b>${E(x.name || x.type)}</b><small>${sub}</small></span>
        <span class="as-r"><b>${fmt(Math.round(cur))}</b>${x.amount > 0 && Math.abs(gp) >= 0.05 ? `<em class="${g >= 0 ? 'up' : 'down'}">${g >= 0 ? '▲' : '▼'} ${Math.abs(gp).toFixed(1)}%</em>` : '<em class="flat">—</em>'}</span></button>`;
    }
    const out = _loanOutstanding(x), prin = +x.principal || 0, pct = prin > 0 ? Math.max(0, Math.min(100, Math.round((prin - out) / prin * 100))) : 0;
    const p = typeof _loanPayoff === 'function' ? _loanPayoff(x) : {};
    const when = p.months ? `Free by ${p.end.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : p.never ? 'EMI below interest' : p.done ? 'Fully paid' : '';
    return `<button class="as-row" onclick="openLoanDetail('${x.id}')"><span class="as-ic" style="--c:${col}"><i data-lucide="${ic}"></i></span>
      <span class="as-m"><b>${E(x.name || x.type)}</b><small>${E(x.lender || x.type || '')}${x.emi ? ' · EMI ' + fmt(+x.emi) : ''}</small>
        ${prin > 0 ? `<span class="as-prog"><i style="width:${pct}%"></i></span><small class="as-prog-t">${pct}% paid${when ? ' · ' + when : ''}</small>` : when ? `<small class="as-prog-t">${when}</small>` : ''}</span>
      <span class="as-r"><b class="neg">${fmt(Math.round(out))}</b><em class="flat">left</em></span></button>`;
  };

  const cut = new Date(); cut.setDate(cut.getDate() - _nwRange); const cutS = _ymdLocal(cut);
  const sp = hist.filter(p => p && p.date >= cutS && isFinite(p.value));
  const sd = sp.length > 1 ? sp[sp.length - 1].value - sp[0].value : 0, rl = { 30: 'month', 90: '3 months', 180: '6 months' }[_nwRange] || 'all time';
  let chart = '';
  if (sp.length > 1) {
    const W = 340, H = 150, lo = Math.min(...sp.map(p => p.value)), hi = Math.max(...sp.map(p => p.value)), rg = (hi - lo) || 1;
    const X = i => i / (sp.length - 1) * W, Y = v => H - 10 - (v - lo) / rg * (H - 24);
    const line = sp.map((p, i) => `${X(i).toFixed(1)},${Y(p.value).toFixed(1)}`).join(' ');
    window.__asPts = sp.map((p, i) => ({ x: X(i) / W, y: Y(p.value) / H, v: p.value, d: p.date }));
    chart = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="asl-svg ${sd >= 0 ? '' : 'down'}"><defs><linearGradient id="aslg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="s0"/><stop offset="1" class="s1"/></linearGradient></defs><polygon points="0,${H} ${line} ${W},${H}" fill="url(#aslg)" class="a"/><polyline points="${line}" class="l"/></svg><span class="asl-dot" id="asl-dot" style="left:100%;top:${(Y(sp[sp.length - 1].value) / H * 100).toFixed(1)}%"></span><span class="asl-tip" id="asl-tip"></span>`;
  }
  c.innerHTML = `<div class="pk asx">
    <div class="asl">
      <div class="asl-top"><span>Net worth</span><button id="refresh-prices-btn" onclick="fetchLivePrices()" aria-label="Update live prices"><i data-lucide="refresh-cw"></i>Live prices</button></div>
      <b class="asl-big ${neg ? 'neg' : ''}" id="as-nw">${neg ? '−' : ''}${fmt(Math.abs(Math.round(nw)))}</b>
      <p class="asl-chg" id="asl-chg">${sp.length > 1 ? `<span class="${sd >= 0 ? 'up' : 'down'}">${sd >= 0 ? '▲' : '▼'} ${_asShort(Math.abs(sd))}${sp[0].value > 0 ? ` (${(sd / sp[0].value * 100).toFixed(1)}%)` : ''}</span> past ${rl}` : 'Your chart builds up day by day as you open this page'}</p>
      <div class="asl-chart" ${sp.length > 1 ? 'onpointermove="asScrub(event)" onpointerdown="asScrub(event)" onpointerleave="asScrubEnd()"' : ''}>${chart}</div>
      <div class="asl-rng">${[[30, '1M'], [90, '3M'], [180, '6M'], [3650, 'All']].map(([d, l]) => `<button class="${_nwRange === d ? 'on' : ''}" onclick="setNwRange(${d})">${l}</button>`).join('')}</div>
      ${tot ? `<div class="as-split asl-split"><i class="own" style="width:${ap}%"></i><i class="owe" style="width:${100 - ap}%"></i></div><div class="asl-sl"><button onclick="invSetView('assets')"><i class="d own"></i>Own <b>${_asShort(own)}</b></button><button onclick="invSetView('liabilities')"><i class="d owe"></i>Owe <b>${_asShort(owe)}</b></button></div>` : ''}
    </div>
    <div class="asl-acts"><button class="p" onclick="openAddInvModal()"><i data-lucide="plus"></i>Asset</button><button onclick="openAddLoanModal()"><i data-lucide="plus"></i>Loan</button><button onclick="openNetWorthProjModal()"><i data-lucide="trending-up"></i>Projection</button></div>
    <div class="asl-facts">
      <div><small>Assets grew</small><b class="${gain >= 0 ? 'up' : 'down'}">${gain >= 0 ? '+' : '−'}${_asShort(Math.abs(gain))}</b><em>${invested ? (gain >= 0 ? '+' : '') + gainPct.toFixed(1) + '%' : '—'}</em></div>
      <div onclick="navigate('bank-tracker')"><small>Cash & bank</small><b>${_asShort(cash)}</b><em>not counted above</em></div>
      <div><small>Monthly EMIs</small><b>${emi ? _asShort(emi) : '—'}</b><em class="${emiPct > 40 ? 'warn' : ''}">${emiPct == null ? 'no income' : emiPct + '% of income'}</em></div>
      <div onclick="invSetView('liabilities')"><small>Debt-free by</small><b>${df ? df.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</b><em>${df ? 'at current EMIs' : 'no EMIs'}</em></div>
    </div>
    <div class="as-seg"><button class="${isA ? 'on' : ''}" onclick="invSetView('assets')">What you own <small>${_asShort(assets)} · ${inv.length}</small></button><button class="${!isA ? 'on' : ''}" onclick="invSetView('liabilities')">What you owe <small>${_asShort(owe)} · ${loans.length}</small></button></div>
    ${ent.length ? `<div class="pk-card as-alloc"><div class="pk-ring"><div class="hx-rose">${_homeRoseSvg(ent, aTot, cols, subs)}<div class="hx-donut-c"><span>${isA ? 'Assets' : 'Loans'}</span><b>${_asShort(aTot)}</b><em>tap a slice</em></div></div></div>
      <div class="as-leg">${ent.map(([t, v], i) => `<div><i style="background:${cols[i]}"></i><span>${E(t)}</span><b>${Math.round(v / aTot * 100)}%</b><span class="as-leg-bar"><i style="width:${v / aTot * 100}%;background:${cols[i]}"></i></span></div>`).join('')}</div></div>` : ''}
    ${list.length ? _pk.sec(isA ? 'Your assets' : 'Your loans', `<em>${list.length}</em>`) + `<div class="pk-list">${shown.map(row).join('')}</div>${list.length > 6 ? `<button class="lg-more" onclick="invToggleShowAll()">${invShowAll ? 'Show less' : 'Show all ' + list.length}</button>` : ''}`
      : _pk.empty({ ic: isA ? 'gem' : 'landmark', t: isA ? 'No assets yet' : 'No loans — great!', s: isA ? 'Add gold, FDs, stocks, property or money you lent to see what you own grow over time.' : 'If you have a home, car or personal loan, add it to see your EMIs and the date you will be debt-free.', btns: [[isA ? 'Add an asset' : 'Add a loan', isA ? 'openAddInvModal()' : 'openAddLoanModal()', 1]] })}
    ${!isA && typeof _debtFreeCardHtml === 'function' ? _debtFreeCardHtml() : ''}
    <p class="as-hint asl-hint">A sudden jump in the chart usually means an asset or loan was added or edited, not money gained or lost.</p>
  </div>`;
  _pk.done(c);
  _asCountUp(document.getElementById('as-nw'), Math.abs(Math.round(nw)), neg);
}
