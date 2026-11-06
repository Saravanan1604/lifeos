// ============================================================
//  analytics2.js — Life OS 2.0 Analytics page (build 674, app)
//  Week / Month / Quarter / Year with ‹ › to step back in time.
//  KPIs with change vs previous period, cash-flow trend line,
//  income vs expense bars, budget vs actual, category breakdown
//  with movers, and spending habits. Inline SVG, real data only.
// ============================================================

let _anPeriod = 'month';
let _anOffset = 0;

function _anRange(period, offset) {
  const n = new Date(); n.setHours(0, 0, 0, 0);
  let a, b;
  if (period === 'week') {
    const mon = new Date(n); mon.setDate(n.getDate() - ((n.getDay() + 6) % 7) + offset * 7);
    a = mon; b = new Date(mon); b.setDate(mon.getDate() + 6);
  } else if (period === 'month') {
    a = new Date(n.getFullYear(), n.getMonth() + offset, 1); b = new Date(a.getFullYear(), a.getMonth() + 1, 0);
  } else if (period === 'quarter') {
    const q = Math.floor(n.getMonth() / 3) + offset;
    a = new Date(n.getFullYear(), q * 3, 1); b = new Date(a.getFullYear(), a.getMonth() + 3, 0);
  } else {
    a = new Date(n.getFullYear() + offset, 0, 1); b = new Date(a.getFullYear(), 11, 31);
  }
  return { a, b, from: _ymdLocal(a), to: _ymdLocal(b) };
}
function _anLabel(period, r) {
  const o = { day: 'numeric', month: 'short' };
  if (period === 'week') return `${r.a.toLocaleDateString('en-IN', o)} – ${r.b.toLocaleDateString('en-IN', o)}`;
  if (period === 'month') return r.a.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  if (period === 'quarter') return `Q${Math.floor(r.a.getMonth() / 3) + 1} ${r.a.getFullYear()} · ${r.a.toLocaleDateString('en-IN', { month: 'short' })}–${r.b.toLocaleDateString('en-IN', { month: 'short' })}`;
  return String(r.a.getFullYear());
}
function _anTx(r) { return (STATE.transactions || []).filter(t => { const d = (t.date || '').slice(0, 10); return d >= r.from && d <= r.to; }); }
function _anSum(l) { return l.reduce((s, t) => s + Money.amt(t), 0); }
function _anBuckets(period, r, mode) {
  // mode 'flow' = finer (line); 'bars' = coarser (paired bars)
  const out = [];
  const push = (a, b, l) => out.push({ from: _ymdLocal(a), to: _ymdLocal(b), l });
  if ((period === 'week') || (period === 'month' && mode === 'flow')) {
    for (let d = new Date(r.a); d <= r.b; d.setDate(d.getDate() + 1)) push(new Date(d), new Date(d), period === 'week' ? d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2) : String(d.getDate()));
  } else if (period === 'month' || (period === 'quarter' && mode === 'flow')) {
    for (let d = new Date(r.a); d <= r.b; d.setDate(d.getDate() + 7)) { const e = new Date(d); e.setDate(d.getDate() + 6); push(new Date(d), e > r.b ? r.b : e, d.getDate() + ' ' + d.toLocaleDateString('en-IN', { month: 'short' })); }
  } else {
    for (let d = new Date(r.a); d <= r.b; d.setMonth(d.getMonth() + 1)) push(new Date(d), new Date(d.getFullYear(), d.getMonth() + 1, 0), d.toLocaleDateString('en-IN', { month: 'short' }));
  }
  return out;
}
function _anDelta(cur, prev, goodWhenUp) {
  if (!(prev > 0)) return '<span class="an-d none">—</span>';
  const p = Math.round((cur / prev - 1) * 100);
  const good = goodWhenUp ? p >= 0 : p <= 0;
  return `<span class="an-d ${good ? 'good' : 'bad'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p)}%</span>`;
}

function setAnPeriod(p) { _anPeriod = p; _anOffset = 0; renderAnalyticsApp(); }
function anNav(d) { _anOffset = Math.min(0, _anOffset + d); renderAnalyticsApp(); }

function renderAnalyticsApp() {
  const P = _anPeriod, r = _anRange(P, _anOffset), pr = _anRange(P, _anOffset - 1);
  // Like-for-like: while the current period is still running, compare with
  // the same number of elapsed days of the previous period (so day 5 of this
  // month is compared to days 1–5 of last month, not all of last month).
  let _partial = false;
  if (_anOffset === 0) {
    const el = Math.round((new Date().setHours(0, 0, 0, 0) - r.a) / 864e5);
    const pe = new Date(pr.a); pe.setDate(pe.getDate() + el);
    if (pe < pr.b) { pr.b = pe; pr.to = _ymdLocal(pe); _partial = true; }
  }
  const tx = _anTx(r), ptx = _anTx(pr);
  const inc = _anSum(tx.filter(t => t.type === 'income')), exp = _anSum(tx.filter(t => t.type !== 'income'));
  const pinc = _anSum(ptx.filter(t => t.type === 'income')), pexp = _anSum(ptx.filter(t => t.type !== 'income'));
  const net = inc - exp, pnet = pinc - pexp;
  const sr = inc > 0 ? Math.round(net / inc * 100) : null;
  const S = typeof _H !== 'undefined' ? _H.short.bind(_H) : (v => fmt(Math.round(v)));

  // ── cash-flow line (cumulative net) + previous period ghost ──
  const fb = _anBuckets(P, r, 'flow'), pfb = _anBuckets(P, pr, 'flow');
  const today = _ymdLocal(new Date());
  const cum = (bk, list) => { let c = 0; return bk.map(x => { if (x.from > today) return null; c += _anSum(list.filter(t => { const d = (t.date || '').slice(0, 10); return d >= x.from && d <= x.to; }).map(t => ({ amount: t.type === 'income' ? +t.amount : -t.amount }))); return c; }); };
  const cur = cum(fb, tx), prv = cum(pfb, ptx).slice(0, fb.length);
  const vals = [...cur, ...prv].filter(v => v != null);
  const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals, 1);
  const W = 320, H = 130, pad = 6;
  const x = i => pad + (fb.length > 1 ? i / (fb.length - 1) : 0.5) * (W - 2 * pad);
  const y = v => H - pad - (v - lo) / (hi - lo || 1) * (H - 2 * pad);
  const path = arr => arr.map((v, i) => v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`).filter(Boolean).join(' ');
  const curPts = path(cur), lastIdx = cur.reduce((m, v, i) => v != null ? i : m, -1);
  const area = curPts ? `${x(0).toFixed(1)},${y(0).toFixed(1)} ${curPts} ${x(lastIdx).toFixed(1)},${y(0).toFixed(1)}` : '';
  const endVal = lastIdx >= 0 ? cur[lastIdx] : 0;
  const flowSvg = `<svg viewBox="0 0 ${W} ${H}" class="an-line" preserveAspectRatio="none">
      <defs><linearGradient id="anG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${endVal >= 0 ? '#22D3EE' : '#F05260'}" stop-opacity=".35"/><stop offset="1" stop-color="${endVal >= 0 ? '#22D3EE' : '#F05260'}" stop-opacity="0"/></linearGradient></defs>
      <line x1="0" x2="${W}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}" class="an-zero"/>
      ${prv.some(v => v != null) ? `<polyline points="${path(prv)}" class="an-ghost"/>` : ''}
      ${area ? `<polygon points="${area}" fill="url(#anG)"/>` : ''}
      ${curPts ? `<polyline points="${curPts}" class="an-cur" stroke="${endVal >= 0 ? '#22D3EE' : '#F05260'}"/>` : ''}
      ${lastIdx >= 0 ? `<circle cx="${x(lastIdx).toFixed(1)}" cy="${y(endVal).toFixed(1)}" r="4" fill="${endVal >= 0 ? '#22D3EE' : '#F05260'}"/>` : ''}
    </svg>`;

  // ── income vs expense bars ──
  const bb = _anBuckets(P, r, 'bars').map(b => { const l = tx.filter(t => { const d = (t.date || '').slice(0, 10); return d >= b.from && d <= b.to; }); return { ...b, i: _anSum(l.filter(t => t.type === 'income')), e: _anSum(l.filter(t => t.type !== 'income')) }; });
  const bmax = Math.max(1, ...bb.map(b => Math.max(b.i, b.e)));
  const pairs = `<div class="hx-chart hx-bars hx-pairs an-bars">${bb.map(b => `<button class="hx-pair" onclick="_homeBarTap(this)" data-cap="${b.l}: in <b style='color:#10B981'>${fmt(Math.round(b.i))}</b> · out <b style='color:#F05260'>${fmt(Math.round(b.e))}</b>"><div><i class="inc" style="height:${Math.max(2, b.i / bmax * 100)}%"></i><i class="exp" style="height:${Math.max(2, b.e / bmax * 100)}%"></i></div><span>${b.l}</span></button>`).join('')}</div>`;

  // ── budget vs actual ──
  const fac = { week: 7 / 30.44, month: 1, quarter: 3, year: 12 }[P];
  const byCat = {}, pByCat = {};
  tx.filter(t => t.type !== 'income').forEach(t => { const c = t.category || 'Other'; byCat[c] = (byCat[c] || 0) + (+t.amount || 0); });
  ptx.filter(t => t.type !== 'income').forEach(t => { const c = t.category || 'Other'; pByCat[c] = (pByCat[c] || 0) + (+t.amount || 0); });
  const bud = (STATE.budgets || []).map(b => { const lim = (typeof _budgetLimitMonthly === 'function' ? _budgetLimitMonthly(b) : +b.amount || 0) * fac; const sp = byCat[b.category] || 0; return { c: b.category, lim, sp, pct: lim > 0 ? sp / lim * 100 : 0 }; }).filter(b => b.lim > 0).sort((a, b) => b.pct - a.pct);
  const budHtml = bud.length ? bud.map(b => { const col = b.pct >= 100 ? '#F05260' : b.pct >= 80 ? '#FBBF24' : '#10B981'; return `<div class="an-bud" onclick="openCategoryDetail('${b.c.replace(/'/g, "\\'")}')"><div class="an-bud-h"><span>${esc(b.c)}</span><b>${fmt(Math.round(b.sp))} <em>/ ${fmt(Math.round(b.lim))}</em></b></div><div class="an-bud-bar"><i style="width:${Math.min(100, b.pct)}%;background:${col}"></i>${b.pct > 100 ? `<s style="left:${Math.min(100, 100 / b.pct * 100)}%"></s>` : ''}</div></div>`; }).join('')
    : `<p class="hx-s">No budgets yet. <a onclick="navigate('budget')" class="an-a">Set one →</a></p>`;

  // ── categories + movers ──
  const cols = ['#8B5CF6', '#22D3EE', '#10B981', '#FBBF24', '#F05260', '#64748B'];
  let ent = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const catRows = ent.slice(0, 8).map(([c, v], i) => `<button class="an-cat" onclick="openCategoryDetail('${c.replace(/'/g, "\\'")}')"><i style="background:${cols[Math.min(i, 5)]}"></i><span>${esc(c)}</span><em>${exp > 0 ? Math.round(v / exp * 100) : 0}%</em><b>${fmt(Math.round(v))}</b>${_anDelta(v, pByCat[c] || 0, false)}</button>`).join('');
  const movers = Object.keys({ ...byCat, ...pByCat }).map(c => ({ c, d: (byCat[c] || 0) - (pByCat[c] || 0) })).filter(m => Math.abs(m.d) > 0).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 3);

  // ── habits: daily avg, biggest day, no-spend days ──
  const dayMap = {};
  tx.filter(t => t.type !== 'income').forEach(t => { const d = (t.date || '').slice(0, 10); dayMap[d] = (dayMap[d] || 0) + (+t.amount || 0); });
  const elapsed = Math.max(1, Math.min(Math.round((new Date(Math.min(Date.now(), r.b.getTime() + 864e5)) - r.a) / 864e5), Math.round((r.b - r.a) / 864e5) + 1));
  const big = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
  const noSpend = Math.max(0, elapsed - Object.keys(dayMap).length);

  const tabs = [['week', 'Week'], ['month', 'Month'], ['quarter', 'Quarter'], ['year', 'Year']];
  document.getElementById('page-container').innerHTML = `
    <div class="fade-in an-page">
      <div class="an-top">
        <h1 class="an-title">Analytics</h1>
        <button class="an-more" onclick="navigate('spending')"><i data-lucide="layout-grid"></i> Budget &amp; categories</button>
      </div>
      <button class="an-smart" onclick="navigate('smart')"><span><i data-lucide="sparkles"></i></span><div><b>Forecast &amp; automation</b><em>30/90-day cash-flow forecast · subscriptions found · unusual spends</em></div><i data-lucide="chevron-right"></i></button>
      <div class="hx-seg an-seg">${tabs.map(([k, l]) => `<button class="${P === k ? 'on' : ''}" onclick="setAnPeriod('${k}')">${l}</button>`).join('')}</div>
      <div class="an-nav"><button onclick="anNav(-1)"><i data-lucide="chevron-left"></i></button><span>${_anLabel(P, r)}</span><button onclick="anNav(1)" ${_anOffset >= 0 ? 'disabled' : ''}><i data-lucide="chevron-right"></i></button></div>

      <p class="an-cmp">Changes compare with ${_partial ? `the same point last ${P} (${fmtDate(pr.from)} – ${fmtDate(pr.to)})` : `the previous ${P}`}.</p>
      <div class="an-kpis">
        <div class="an-kpi"><span>Income</span><b class="inc">${S(inc)}</b>${_anDelta(inc, pinc, true)}</div>
        <div class="an-kpi"><span>Spent</span><b class="exp">${S(exp)}</b>${_anDelta(exp, pexp, false)}</div>
        <div class="an-kpi"><span>Net</span><b>${net < 0 ? '-' : '+'}${S(Math.abs(net))}</b>${pnet !== 0 ? `<span class="an-d ${net >= pnet ? 'good' : 'bad'}">${net >= pnet ? '▲' : '▼'} ${S(Math.abs(net - pnet))}</span>` : '<span class="an-d none">—</span>'}</div>
        <div class="an-kpi"><span>Saved</span><b>${sr == null ? '—' : sr < 0 ? '0%' : sr + '%'}</b><span class="an-d ${sr != null && sr < 0 ? 'bad' : 'none'}">${sr == null ? 'no income logged' : sr < 0 ? 'spent more than earned' : 'of income'}</span></div>
      </div>

      <div class="hx-card">
        <div class="hx-an-head"><p class="hx-t">Cash flow</p><span class="an-legend"><i class="c"></i>This ${P}<i class="g"></i>Previous</span></div>
        ${flowSvg}
        <p class="hx-cap">${lastIdx >= 0 ? `Running net ${endVal >= 0 ? '<b style="color:#10B981">+' : '<b style="color:#F05260">-'}${fmt(Math.round(Math.abs(endVal)))}</b> so far this ${P}` : 'Nothing logged in this period yet'}</p>
      </div>

      <div class="hx-card">
        <div class="hx-an-head"><p class="hx-t">Income vs expense</p></div>
        ${pairs}
        <div class="hx-legend"><span><i style="background:#10B981"></i>Income</span><span><i style="background:#F05260"></i>Expense</span></div>
        <p class="hx-cap">Tap a bar for exact amounts</p>
      </div>

      <div class="hx-card">
        <div class="hx-an-head"><p class="hx-t">Budget vs actual</p><button class="hx-link" onclick="navigate('budget')">Edit <i data-lucide="chevron-right"></i></button></div>
        ${budHtml}
      </div>

      <div class="hx-card">
        <div class="hx-an-head"><p class="hx-t">Where it went</p><span class="an-sub">vs ${_partial ? 'same point last ' + P : 'previous ' + P}</span></div>
        ${catRows || '<p class="hx-s">No spending in this period.</p>'}
        ${movers.length ? `<div class="an-movers">${movers.map(m => `<span class="${m.d > 0 ? 'bad' : 'good'}">${esc(m.c)} ${m.d > 0 ? '+' : '-'}${S(Math.abs(m.d))}</span>`).join('')}</div>` : ''}
      </div>

      <div class="hx-card an-habits">
        <div><span>Daily average</span><b>${fmt(Math.round(exp / elapsed))}</b></div>
        <div><span>Biggest day</span><b>${big ? fmt(Math.round(big[1])) : '—'}</b>${big ? `<em>${fmtDate(big[0])}</em>` : ''}</div>
        <div><span>No-spend days</span><b>${noSpend}</b><em>of ${elapsed}</em></div>
      </div>
    </div>`;
  if (window.lucide && lucide.createIcons) { try { lucide.createIcons(); } catch (_) {} }
}

// ══════════════════════════════════════════════════════════
// Assets 2.0 helpers (build 675): net-worth trend, A/L ratio,
// debt-free shortcut — injected into renderInvestmentsApp's hero.
// ══════════════════════════════════════════════════════════
let _nwRange = 90;
function setNwRange(d) { _nwRange = d; if (typeof navigate === 'function') navigate('investments', true); }
function nwTrendHtml() {
  const hist = (STATE.netWorthHistory || []).filter(p => p && p.date && isFinite(p.value));
  const cut = new Date(); cut.setDate(cut.getDate() - _nwRange);
  const pts = hist.filter(p => p.date >= _ymdLocal(cut));
  const chips = [[30, '1M'], [90, '3M'], [180, '6M']].map(([d, l]) => `<button class="${_nwRange === d ? 'on' : ''}" onclick="event.stopPropagation();setNwRange(${d})">${l}</button>`).join('');
  if (pts.length < 2) return `<div class="nw-trend"><div class="nw-trend-h"><span>Net-worth trend</span><div class="nw-chips">${chips}</div></div><p class="nw-empty">Your trend builds up as you open this page — one snapshot a day.</p></div>`;
  const W = 300, H = 70, lo = Math.min(...pts.map(p => p.value)), hi = Math.max(...pts.map(p => p.value));
  const x = i => (i / (pts.length - 1)) * W, y = v => H - 4 - (v - lo) / ((hi - lo) || 1) * (H - 8);
  const line = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const up = pts[pts.length - 1].value >= pts[0].value, c = up ? '#10B981' : '#F05260';
  const d = pts[pts.length - 1].value - pts[0].value;
  return `<div class="nw-trend">
    <div class="nw-trend-h"><span>Net-worth trend <b style="color:${c}">${d >= 0 ? '+' : '-'}${typeof _H !== 'undefined' ? _H.short(Math.abs(d)) : fmt(Math.abs(d))}</b></span><div class="nw-chips">${chips}</div></div>
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="nw-svg">
      <defs><linearGradient id="nwG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".3"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs>
      <polygon points="0,${H} ${line} ${W},${H}" fill="url(#nwG)"/>
      <polyline points="${line}" fill="none" stroke="${c}" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    </svg>
    <div class="nw-axis"><span>${fmtDate(pts[0].date)}</span><span>Today</span></div>
  </div>`;
}
function nwRatioHtml(assets, liab) {
  const tot = assets + liab;
  if (!(tot > 0)) return '';
  const ap = Math.round(assets / tot * 100);
  let df = '';
  if ((STATE.loans || []).length && typeof _loanPayoff === 'function') {
    let last = null;
    (STATE.loans || []).forEach(l => { const p = _loanPayoff(l); if (p.months && (!last || p.end > last)) last = p.end; });
    if (last) df = `<button class="nw-df" onclick="invSetView('liabilities')"><i data-lucide="flag"></i> Debt-free by <b>${last.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</b><i data-lucide="chevron-right"></i></button>`;
  }
  return `<div class="nw-ratio"><div class="nw-ratio-bar"><i class="a" style="width:${ap}%"></i><i class="l" style="width:${100 - ap}%"></i></div>
    <div class="nw-ratio-l"><span><i class="a"></i>Assets ${ap}%</span><span><i class="l"></i>Liabilities ${100 - ap}%</span></div></div>${df}`;
}

// ══════════════════════════════════════════════════════════
// build 687 — clearer net-worth overview for the Assets page.
// One idea: what you OWN vs what you OWE. Each number says what it is.
// ══════════════════════════════════════════════════════════
function nwOverviewHtml(o) {
  const S = typeof _H !== 'undefined' ? _H.short.bind(_H) : (v => fmt(Math.round(v)));
  const nw = o.netWorth, own = o.totalCurrent + Math.max(0, o.netCash), owe = o.totalLoan;
  const nwAll = own - owe;                                    // includes cash & bank
  const tot = own + owe, ap = tot > 0 ? Math.round(own / tot * 100) : 0;
  const n = new Date(), ym = _ymdLocal(n).slice(0, 7), pm = _ymdLocal(new Date(n.getFullYear(), n.getMonth() - 1, 1)).slice(0, 7);
  const incOf = m => (STATE.transactions || []).filter(t => t.type === 'income' && (t.date || '').startsWith(m)).reduce((s, t) => s + (+t.amount || 0), 0);
  const inc = incOf(ym) || incOf(pm);
  const emiPct = inc > 0 && o.emiMonth > 0 ? Math.round(o.emiMonth / inc * 100) : null;
  let df = null;
  if (typeof _loanPayoff === 'function') (STATE.loans || []).forEach(l => { const p = _loanPayoff(l); if (p.months && (!df || p.end > df)) df = p.end; });
  const neg = nwAll < 0;
  const sentence = !tot ? 'Add your assets and loans to see your net worth.'
    : neg ? `You owe <b>${S(-nwAll)}</b> more than you own.`
    : `You own <b>${S(nwAll)}</b> more than you owe.`;
  return `<div class="nw2">
    <div class="nw2-hero ${neg ? 'neg' : 'pos'}">
      <p class="nw2-lbl">Your net worth</p>
      <b class="nw2-val">${neg ? '−' : ''}${fmt(Math.abs(Math.round(nwAll)))}</b>
      <p class="nw2-say">${sentence}</p>
      ${o.chg ? `<span class="nw2-chg ${o.chg >= 0 ? 'up' : 'down'}">${o.chg >= 0 ? '▲' : '▼'} ${S(Math.abs(o.chg))} this month</span>` : ''}
    </div>
    <div class="nw2-tiles">
      <button class="nw2-tile own ${o.isAssets ? 'on' : ''}" onclick="invSetView('assets')">
        <span class="nw2-t">You own</span><b>${S(own)}</b>
        <span class="nw2-s">Investments ${S(o.totalCurrent)}${o.netCash > 0 ? ` + cash & bank ${S(o.netCash)}` : ''}</span>
      </button>
      <button class="nw2-tile owe ${!o.isAssets ? 'on' : ''}" onclick="invSetView('liabilities')">
        <span class="nw2-t">You owe</span><b>${S(owe)}</b>
        <span class="nw2-s">${(STATE.loans || []).length} loan${(STATE.loans || []).length === 1 ? '' : 's'} outstanding</span>
      </button>
    </div>
    ${tot ? `<div class="nw2-bar"><i class="a" style="width:${ap}%"></i><i class="l" style="width:${100 - ap}%"></i></div>
    <p class="nw2-bar-l">For every ₹100 you own, you owe ₹${own > 0 ? Math.round(owe / own * 100) : '—'}.</p>` : ''}
    <div class="nw2-facts">
      <div><span>Monthly EMIs</span><b>${o.emiMonth ? fmt(Math.round(o.emiMonth)) : '—'}</b><em>${emiPct == null ? 'no income logged' : emiPct + '% of your income' + (emiPct > 40 ? ' · high' : '')}</em></div>
      <div onclick="invSetView('liabilities')"><span>Debt-free by</span><b>${df ? df.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</b><em>${df ? 'at current EMIs →' : 'add EMIs to estimate'}</em></div>
    </div>
    <div class="nw2-trend">${typeof nwTrendHtml === 'function' ? nwTrendHtml() : ''}
      <p class="nw2-hint">A sudden jump usually means an asset or loan was added or edited, not money gained or lost.</p>
      <button class="nw2-proj" onclick="openNetWorthProjModal()"><i data-lucide="trending-up"></i> Net-worth projection</button></div>
  </div>`;
}
