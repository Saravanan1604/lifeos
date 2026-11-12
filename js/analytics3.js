// ============================================================
//  analytics3.js — build 727: new Analytics page (app)
//  Hero with the period's net and a plain sentence, 4 tiles with
//  changes that say what they compare against, cash-flow line with
//  labels, income vs expense bars, budget vs actual, spending ring,
//  habits, and tools (forecast + deep dive) at the bottom.
// ============================================================
function renderAnalyticsApp() {
  const c = document.getElementById('page-container'); if (!c) return;
  const P = _anPeriod, r = _anRange(P, _anOffset), pr = _anRange(P, _anOffset - 1);
  let partial = false;
  if (_anOffset === 0) {
    const el = Math.round((new Date().setHours(0, 0, 0, 0) - r.a) / 864e5);
    const pe = new Date(pr.a); pe.setDate(pe.getDate() + el);
    if (pe < pr.b) { pr.b = pe; pr.to = _ymdLocal(pe); partial = true; }
  }
  const tx = _anTx(r), ptx = _anTx(pr);
  const T = Money.totals(tx), PT = Money.totals(ptx);
  const inc = T.income, exp = T.spend, net = T.net, pinc = PT.income, pexp = PT.spend, pnet = PT.net;
  const sr = inc > 0 ? Math.round(net / inc * 100) : null, psr = pinc > 0 ? Math.round(pnet / pinc * 100) : null;
  const S = v => (typeof _asShort === 'function' ? _asShort(v) : fmt(Math.round(v)));
  const E = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const vsWord = partial ? `same day last ${P}` : `last ${P}`;
  const delta = (cur, prev, goodUp) => {
    if (!(prev > 0)) return `<em class="flat">nothing ${vsWord.replace('same day ', '')} to compare</em>`;
    const p = Math.round((cur / prev - 1) * 100), good = goodUp ? p >= 0 : p <= 0;
    return `<em class="${p === 0 ? 'flat' : good ? 'good' : 'bad'}">${p > 0 ? '▲' : p < 0 ? '▼' : ''} ${Math.abs(p)}% <span>vs ${S(prev)} ${vsWord}</span></em>`;
  };
  const tdy = _ymdLocal(new Date());

  // cash-flow (running net) with previous period ghost
  const fb = _anBuckets(P, r, 'flow'), pfb = _anBuckets(P, pr, 'flow');
  const cum = (bk, list) => { let s = 0; return bk.map(x => { if (x.from > tdy) return null; list.forEach(t => { const d = Money.day(t); if (d >= x.from && d <= x.to) s += Money.isIncome(t) ? Money.amt(t) : -Money.amt(t); }); return s; }); };
  const cur = cum(fb, tx), prv = cum(pfb, ptx).slice(0, fb.length);
  const lastIdx = cur.reduce((m, v, i) => v != null ? i : m, -1), endVal = lastIdx >= 0 ? cur[lastIdx] : 0;
  const prvAt = prv[Math.min(lastIdx, prv.length - 1)];
  const vals = [...cur, ...prv].filter(v => v != null), lo = Math.min(0, ...vals), hi = Math.max(0, ...vals, 1);
  const W = 320, H = 140, pad = 8, x = i => pad + (fb.length > 1 ? i / (fb.length - 1) : .5) * (W - 2 * pad), y = v => H - pad - (v - lo) / (hi - lo || 1) * (H - 2 * pad);
  const path = a => a.map((v, i) => v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`).filter(Boolean).join(' ');
  const cp = path(cur), up = endVal >= 0;
  const flow = `<svg viewBox="0 0 ${W} ${H + 16}" class="anx-flow ${up ? '' : 'neg'}"><defs><linearGradient id="anxG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="s0"/><stop offset="1" class="s1"/></linearGradient></defs>
    <line x1="0" x2="${W}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}" class="z"/><text x="${W}" y="${(y(0) - 4).toFixed(1)}" text-anchor="end" class="zl">₹0</text>
    ${prv.some(v => v != null) ? `<polyline points="${path(prv)}" class="g"/>` : ''}
    ${cp ? `<polygon points="${x(0).toFixed(1)},${y(0).toFixed(1)} ${cp} ${x(lastIdx).toFixed(1)},${y(0).toFixed(1)}" fill="url(#anxG)" class="a"/><polyline points="${cp}" class="c"/><circle cx="${x(lastIdx).toFixed(1)}" cy="${y(endVal).toFixed(1)}" r="5" class="d"/>` : ''}
    <text x="0" y="${H + 13}">${fb[0] ? fb[0].l : ''}</text><text x="${W}" y="${H + 13}" text-anchor="end">${fb.length ? fb[fb.length - 1].l : ''}</text></svg>`;

  // income vs expense bars
  const bb = _anBuckets(P, r, 'bars').map(b => { const l = tx.filter(t => { const d = Money.day(t); return d >= b.from && d <= b.to; }); const t2 = Money.totals(l); return { ...b, i: t2.income, e: t2.spend }; });
  const bmax = Math.max(1, ...bb.map(b => Math.max(b.i, b.e)));
  const pairs = `<div class="hx-chart hx-bars hx-pairs an-bars anx-bars">${bb.map((b, k) => `<button class="hx-pair" style="--d:${k * 50}ms" onclick="_homeBarTap(this)" data-cap="${b.l}: in <b class='inc'>${fmt(Math.round(b.i))}</b> · out <b class='exp'>${fmt(Math.round(b.e))}</b>"><div><i class="inc" style="height:${Math.max(2, b.i / bmax * 100)}%"></i><i class="exp" style="height:${Math.max(2, b.e / bmax * 100)}%"></i></div><span>${b.l}</span></button>`).join('')}</div>`;

  // budget vs actual
  const fac = { week: 7 / 30.44, month: 1, quarter: 3, year: 12 }[P];
  const byCat = Money.byCategory(tx, 'spend'), pByCat = Money.byCategory(ptx, 'spend');
  const bud = (STATE.budgets || []).map(b => { const lim = (typeof _budgetLimitMonthly === 'function' ? _budgetLimitMonthly(b) : +b.amount || 0) * fac; const sp = byCat[b.category] || 0; return { c: b.category, lim, sp, pct: lim > 0 ? sp / lim * 100 : 0 }; }).filter(b => b.lim > 0).sort((a, b) => b.pct - a.pct);
  const over = bud.filter(b => b.pct >= 100).length;
  const budRow = b => { const t = b.pct >= 100 ? 'exp' : b.pct >= 80 ? 'warn' : 'inc', q = b.c.replace(/'/g, "\\'");
    return `<button class="anx-bud" onclick="openCategoryDetail('${q}')"><span class="anx-bud-h"><b>${E(b.c)}</b><small class="${t}">${b.pct >= 100 ? S(b.sp - b.lim) + ' over' : S(b.lim - b.sp) + ' left'}</small></span>
      <span class="anx-bud-bar"><i class="${t}" style="width:${Math.min(100, b.pct)}%"></i></span><span class="anx-bud-f"><span>${fmt(Math.round(b.sp))} of ${fmt(Math.round(b.lim))}</span><span>${Math.round(b.pct)}%</span></span></button>`; };
  const budShown = window.__anxBudAll ? bud : bud.slice(0, 5);

  // where it went
  const ent = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const top = ent.slice(0, 6), rest = ent.slice(6).reduce((s, e) => s + e[1], 0); if (rest > 0) top.push(['Other', rest]);
  const cols = top.map(([cn], i) => (typeof catColor === 'function' && cn !== 'Other' ? catColor(cn) : null) || _PK_COLS[i % _PK_COLS.length]);
  const subs = {}; top.forEach(([cn, v]) => { subs[cn] = `${exp > 0 ? Math.round(v / exp * 100) : 0}% of spending`; });
  const catRow = ([cn, v], i) => { const pv = pByCat[cn] || 0, d = v - pv, q = cn.replace(/'/g, "\\'");
    return `<button class="anx-cat" onclick="${cn === 'Other' && i >= 6 ? '' : `openCategoryDetail('${q}')`}"><span class="anx-dot" style="background:${cols[i]}"></span><span class="anx-cm"><b>${E(cn)}</b><small>${exp > 0 ? Math.round(v / exp * 100) : 0}%${pv > 0 && Math.round(d) !== 0 ? ` · <span class="${d > 0 ? 'exp' : 'inc'}">${d > 0 ? '+' : '−'}${S(Math.abs(d))}</span> vs ${vsWord}` : ''}</small></span><b>${fmt(Math.round(v))}</b></button>`; };

  // habits
  const dayMap = {}; tx.filter(Money.isSpend).forEach(t => { const d = Money.day(t); dayMap[d] = (dayMap[d] || 0) + Money.amt(t); });
  const elapsed = Math.max(1, Math.min(Math.round((new Date(Math.min(Date.now(), r.b.getTime() + 864e5)) - r.a) / 864e5), Math.round((r.b - r.a) / 864e5) + 1));
  const big = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
  const noSpend = Math.max(0, elapsed - Object.keys(dayMap).length);

  const tabs = [['week', 'Week'], ['month', 'Month'], ['quarter', 'Quarter'], ['year', 'Year']];
  const per = { week: 'this week', month: 'this month', quarter: 'this quarter', year: 'this year' }[P];
  const when = _anOffset === 0 ? per : 'in ' + _anLabel(P, r);
  const say = !inc && !exp ? `Nothing logged ${when} yet.` : net >= 0 ? `You kept <b>${S(net)}</b> of what you earned ${when}.` : `You spent <b>${S(-net)}</b> more than you earned ${when}.`;
  const ip = inc + exp > 0 ? Math.round(inc / (inc + exp) * 100) : 50;
  const deep = [[1, 'calendar-days', 'Heatmap'], [2, 'arrow-left-right', 'Money flow'], [3, 'landmark', 'Wealth'], [4, 'activity', 'Health'], [5, 'layers', 'Income streams']];

  c.innerHTML = `<div class="pk asx anx">
    <div class="anx-top"><h1>Analytics</h1><button onclick="navigate('spending')"><i data-lucide="layout-grid"></i>Budgets</button></div>
    <div class="as-seg anx-seg">${tabs.map(([k, l]) => `<button class="${P === k ? 'on' : ''}" onclick="setAnPeriod('${k}')">${l}</button>`).join('')}</div>
    <div class="anx-nav"><button onclick="anNav(-1)" aria-label="Previous"><i data-lucide="chevron-left"></i></button><span>${_anLabel(P, r)}</span><button onclick="anNav(1)" ${_anOffset >= 0 ? 'disabled' : ''} aria-label="Next"><i data-lucide="chevron-right"></i></button></div>
    <div class="as-hero ${net < 0 ? 'neg' : 'pos'} anx-hero">
      <div class="as-hero-top"><span>${net < 0 ? 'Overspent' : 'Saved'} ${_anOffset === 0 ? per : _anLabel(P, r)}</span>${sr != null ? `<em class="anx-rate">${sr}% of income</em>` : ''}</div>
      <b class="as-nw">${net < 0 ? '−' : '+'}${fmt(Math.abs(Math.round(net)))}</b>
      <p class="as-say">${say}</p>
      ${inc + exp > 0 ? `<div class="as-split"><i class="own" style="width:${ip}%"></i><i class="owe" style="width:${100 - ip}%"></i></div>
      <div class="as-split-l"><span><i class="d own"></i>In <b>${S(inc)}</b></span><span><i class="d owe"></i>Out <b>${S(exp)}</b></span></div>` : ''}
    </div>
    <div class="as-tiles anx-tiles">
      <div class="as-tile"><span class="ti xg"><i data-lucide="arrow-down-left"></i></span><small>Income</small><b class="up">${S(inc)}</b>${delta(inc, pinc, true)}</div>
      <div class="as-tile"><span class="ti xr"><i data-lucide="arrow-up-right"></i></span><small>Spent</small><b class="down">${S(exp)}</b>${delta(exp, pexp, false)}</div>
      <div class="as-tile"><span class="ti xp"><i data-lucide="piggy-bank"></i></span><small>Saving rate</small><b class="${sr == null ? '' : sr < 0 ? 'down' : 'up'}">${sr == null ? '—' : sr + '%'}</b><em class="flat">${sr == null ? 'no income logged' : psr != null ? `was ${psr}% ${vsWord}` : 'of your income'}</em></div>
      <div class="as-tile"><span class="ti xc"><i data-lucide="calendar"></i></span><small>Spent per day</small><b>${S(exp / elapsed)}</b><em class="flat">over ${elapsed} day${elapsed > 1 ? 's' : ''}</em></div>
    </div>
    <div class="pk-card ldx-card"><div class="ldx-ct"><span>Running balance</span><span class="ldx-leg"><i class="l"></i>${_anOffset === 0 ? 'Now' : 'This'} <i class="gh"></i>Last ${P}</span></div>${flow}
      <p class="anx-cap">${lastIdx >= 0 ? `<b class="${up ? 'up' : 'down'}">${up ? '+' : '−'}${S(Math.abs(endVal))}</b> so far${prvAt != null ? ` · last ${P} at this point <b class="${prvAt >= 0 ? 'up' : 'down'}">${prvAt >= 0 ? '+' : '−'}${S(Math.abs(prvAt))}</b>` : ''}` : 'Nothing logged in this period yet'}</p></div>
    <div class="pk-card ldx-card"><div class="ldx-ct"><span>Money in vs out</span><span class="ldx-leg"><i class="p"></i>In <i class="x"></i>Out</span></div>${pairs}<p class="hx-cap anx-cap">Tap a bar for exact amounts</p></div>
    ${bud.length ? _pk.sec('Budgets', `<em>${over ? over + ' over' : 'all on track'}</em>`) + `<div class="pk-list anx-buds">${budShown.map(budRow).join('')}${bud.length > 5 ? `<button class="lg-more" onclick="window.__anxBudAll=!window.__anxBudAll;renderAnalyticsApp()">${window.__anxBudAll ? 'Show less' : 'Show all ' + bud.length}</button>` : ''}</div>`
      : `<div class="pk-card ldx-card anx-nobud"><b>No budgets yet</b><p>Set a monthly limit for a few categories to see how you're doing.</p><button class="ldx-btn" onclick="navigate('budget')"><i data-lucide="plus"></i>Set a budget</button></div>`}
    ${typeof budgetSuggestBanner === 'function' ? budgetSuggestBanner() : ''}
    ${top.length ? _pk.sec('Where it went', `<em>${ent.length} categories</em>`) + `<div class="pk-card as-alloc"><div class="pk-ring"><div class="hx-rose">${_homeRoseSvg(top, exp, cols, subs)}<div class="hx-donut-c"><span>Spent</span><b>${S(exp)}</b><em>tap a slice</em></div></div></div></div><div class="pk-list anx-cats">${top.map(catRow).join('')}</div>` : ''}
    <div class="as-tiles anx-hab">
      <div class="as-tile"><span class="ti xo"><i data-lucide="flame"></i></span><small>Biggest day</small><b>${big ? S(big[1]) : '—'}</b><em class="flat">${big ? fmtDate(big[0]) : 'no spending'}</em></div>
      <div class="as-tile"><span class="ti xg"><i data-lucide="leaf"></i></span><small>No-spend days</small><b>${noSpend}</b><em class="flat">of ${elapsed} days</em></div>
    </div>
    ${_pk.sec('More insights', '')}
    <button class="anx-smart" onclick="navigate('smart')"><span><i data-lucide="sparkles"></i></span><span class="m"><b>Forecast &amp; subscriptions</b><small>Next 30/90 days, repeat payments, unusual spends</small></span><i data-lucide="chevron-right"></i></button>
    <div class="anx-deep">${deep.map(([t, ic, l]) => `<button onclick="openDeepDive(${t})"><span><i data-lucide="${ic}"></i></span>${l}</button>`).join('')}</div>
  </div>`;
  _pk.done(c);
}
