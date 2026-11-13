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

function setAnPeriod(p) { _anPeriod = p; _anOffset = 0; renderAnalyticsApp(); }
function anNav(d) { _anOffset = Math.min(0, _anOffset + d); renderAnalyticsApp(); }



// ══════════════════════════════════════════════════════════
// Assets 2.0 helpers (build 675): net-worth trend, A/L ratio,
// debt-free shortcut — injected into renderInvestmentsApp's hero.
// ══════════════════════════════════════════════════════════
let _nwRange = 90;
function setNwRange(d) { _nwRange = d; if (typeof navigate === 'function') navigate('investments', true); }

