// ============================================================
//  recap.js — build 716: monthly recap card
//  Days 1–7 of each month, Home shows last month at a glance:
//  spent, income, saved %, change vs the month before, top
//  category, biggest spend, no-spend days. Share as an image.
//  Dismiss hides it until next month. "View recap" in Reports.
// ============================================================
function _recapData(offset) {
  const now = new Date(), m = new Date(now.getFullYear(), now.getMonth() - (offset || 1), 1);
  const ym = Money.ym(m), pm = Money.ym(new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const list = Money.inMonth(ym), T = Money.totals(list), P = Money.monthTotals(pm);
  const cats = Object.entries(Money.byCategory(list, 'spend')).sort((a, b) => b[1] - a[1]);
  const spends = list.filter(Money.isSpend).sort((a, b) => Money.amt(b) - Money.amt(a));
  const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const spendDays = new Set(list.filter(Money.isSpend).map(t => Money.day(t)));
  return { ym, label: m.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }), short: m.toLocaleDateString('en-IN', { month: 'long' }),
    T, P, top: cats[0] || null, cats: cats.slice(0, 3), big: spends[0] || null, noSpend: days - spendDays.size, days,
    rate: T.income > 0 ? Math.round(T.net / T.income * 100) : null, chg: P.spend > 0 ? Math.round((T.spend / P.spend - 1) * 100) : null, n: list.length };
}
function homeRecapHtml() {
  try {
    const now = new Date(); if (now.getDate() > 7) return '';
    const R = _recapData(1); if (!R.n) return '';
    if (localStorage.getItem('lifeos_recap_seen') === R.ym) return '';
    return _recapCard(R, true);
  } catch (e) { return ''; }
}
function _recapCard(R, home) {
  const sv = R.rate == null ? '—' : R.rate + '%';
  return `<div class="rc">
    <div class="rc-top"><span>${R.label} recap</span>${home ? `<button onclick="recapDismiss('${R.ym}')" aria-label="Hide"><i data-lucide="x"></i></button>` : ''}</div>
    <p class="rc-big">You ${R.T.net >= 0 ? 'saved' : 'overspent'} <b>${fmt(Math.round(Math.abs(R.T.net)))}</b></p>
    <div class="rc-grid">
      <div><small>Spent</small><b>${fmt(Math.round(R.T.spend))}</b>${R.chg != null ? `<em class="${R.chg > 0 ? 'up' : 'down'}">${R.chg > 0 ? '▲' : '▼'} ${Math.abs(R.chg)}% vs before</em>` : ''}</div>
      <div><small>Income</small><b>${fmt(Math.round(R.T.income))}</b><em>saved ${sv}</em></div>
      <div><small>Top category</small><b>${R.top ? R.top[0] : '—'}</b><em>${R.top ? fmt(Math.round(R.top[1])) : ''}</em></div>
      <div><small>No-spend days</small><b>${R.noSpend}</b><em>of ${R.days}</em></div>
    </div>
    ${R.big ? `<p class="rc-note">Biggest spend: <b>${fmt(Math.round(Money.amt(R.big)))}</b> on ${String(R.big.description || R.big.category || '').replace(/</g, '&lt;')} (${fmtDate(R.big.date)})</p>` : ''}
    <div class="rc-act"><button onclick="recapShare('${R.ym}')"><i data-lucide="share-2"></i>Share</button><button onclick="navigate('yearly')"><i data-lucide="file-bar-chart-2"></i>Full report</button></div>
  </div>`;
}
function recapDismiss(ym) { try { localStorage.setItem('lifeos_recap_seen', ym); } catch (_) {} navigate('transactions', true); }

// Share as a 1080×1350 image (falls back to download)
async function recapShare(ym) {
  const off = (() => { const n = new Date(); const [y, m] = ym.split('-').map(Number); return (n.getFullYear() - y) * 12 + (n.getMonth() + 1 - m); })();
  const R = _recapData(off);
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 1080, 1350); g.addColorStop(0, '#2A1170'); g.addColorStop(.55, '#6D3BEA'); g.addColorStop(1, '#0E7490');
  x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
  const T = (t, px, y, w, col, al) => { x.font = `${w || 700} ${px}px Inter, system-ui, sans-serif`; x.fillStyle = col || '#fff'; x.textAlign = al || 'left'; x.fillText(t, al === 'center' ? 540 : 90, y); };
  const r = v => '₹' + Math.round(Math.abs(v)).toLocaleString('en-IN');
  T('atworth', 40, 120, 800, 'rgba(255,255,255,.8)');
  T(R.label.toUpperCase(), 40, 200, 800, 'rgba(255,255,255,.75)');
  T(R.T.net >= 0 ? 'I saved' : 'I overspent', 64, 320, 700);
  T(r(R.T.net), 150, 470, 800);
  T(R.rate != null ? `${R.rate}% of my income` : '', 44, 540, 600, 'rgba(255,255,255,.85)');
  const box = (bx, by, lbl, val, sub) => { x.fillStyle = 'rgba(255,255,255,.14)'; x.beginPath(); x.roundRect(bx, by, 420, 230, 36); x.fill();
    x.font = '700 34px Inter, system-ui'; x.fillStyle = 'rgba(255,255,255,.75)'; x.textAlign = 'left'; x.fillText(lbl, bx + 40, by + 70);
    x.font = '800 62px Inter, system-ui'; x.fillStyle = '#fff'; x.fillText(val, bx + 40, by + 150);
    x.font = '600 30px Inter, system-ui'; x.fillStyle = 'rgba(255,255,255,.75)'; x.fillText(sub || '', bx + 40, by + 200); };
  box(90, 620, 'Spent', r(R.T.spend), R.chg != null ? `${R.chg > 0 ? '▲' : '▼'} ${Math.abs(R.chg)}% vs last month` : '');
  box(570, 620, 'Income', r(R.T.income), '');
  box(90, 890, 'Top category', R.top ? R.top[0].slice(0, 12) : '—', R.top ? r(R.top[1]) : '');
  box(570, 890, 'No-spend days', String(R.noSpend), `of ${R.days}`);
  T('Tracked with atworth', 34, 1270, 600, 'rgba(255,255,255,.7)', 'center');
  const blob = await new Promise(res => c.toBlob(res, 'image/png'));
  const file = new File([blob], `atworth-${R.ym}-recap.png`, { type: 'image/png' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: `${R.label} recap` }); return; } }
  catch (e) { if (e && e.name === 'AbortError') return; }
  const url = URL.createObjectURL(file); const a = document.createElement('a'); a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url);
  toast('Recap image saved', 'success');
}
