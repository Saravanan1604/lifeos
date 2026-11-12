// ============================================================
//  detail2.js — build 726: new Loan and Asset detail screens (app)
//  Loan: hero with what's left + % paid, a warning when the loan amount
//  and outstanding don't match, plan counted from TODAY's balance,
//  tappable yearly bars, simple what-if (extra / lump sum), schedule
//  starting this month. Asset: hero with value + gain, tiles, value chart.
//  Classic web keeps the old screens.
// ============================================================
(function () {
  const oldLoan = window.renderLoanDetail, oldAsset = window.renderAssetDetail, oldInv = window.renderInvestments;
  const E = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const S = v => (typeof _asShort === 'function' ? _asShort(v) : fmt(v));
  const mon = d => d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  const addM = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), 1); x.setMonth(x.getMonth() + n); return x; };
  let _ldAll = false, _ldBar = -1;

  // After Edit / Live update / delete the old code calls renderInvestments(); stay on the detail screen instead.
  window.renderInvestments = function () {
    if (window.__IS_APP && typeof currentPage !== 'undefined') {
      if (currentPage === 'loan-detail') return (STATE.loans || []).some(l => l.id === _loanDetailId) ? renderLoanDetail() : navigate('investments');
      if (currentPage === 'asset-detail') return (STATE.investments || []).some(i => i.id === _assetDetailId) ? renderAssetDetail() : navigate('investments');
    }
    return oldInv.apply(this, arguments);
  };

  function _ldPlan(loan, extra, lump) {
    const annual = _loanAnnualRate(loan), P = +loan.principal || +loan.outstanding || 0;
    const repay = loan.repayType || 'emi', emi = _workableEmi(loan, P, annual);
    const out = _loanOutstanding(loan), m = _monthsElapsed(loan.startDate);
    const now = addM(new Date(), 0);
    if (repay === 'emi') {
      const sch = _amortizeSchedule(Math.max(0, out), annual, emi, extra, lump);
      return { repay, annual, P, emi, out, m, start: now, ...sch };
    }
    const full = _buildSchedule(loan, { tenure: loan.tenure, lump });
    const st = loan.startDate ? new Date(loan.startDate + 'T00:00:00') : now;
    const rows = (full.rows || []).filter(r => r.m >= m).map((r, i) => ({ ...r, m: i }));
    return { repay, annual, P, emi, out, m, start: now, special: full.special, neverCloses: false, rows, months: rows.length, totalInterest: rows.reduce((s, r) => s + r.interest, 0), startFull: st };
  }

  function _ldBars(rows, start) {
    const by = {};
    rows.forEach(r => { const y = addM(start, r.m).getFullYear(); const o = by[y] = by[y] || { y, p: 0, i: 0, b: r.balance }; o.p += r.principal; o.i += r.interest; o.b = r.balance; });
    const ys = Object.values(by).sort((a, b) => a.y - b.y); if (!ys.length) return '';
    const max = Math.max(...ys.map(o => o.p + o.i)) || 1, bmax = Math.max(...ys.map(o => o.b), rows[0] ? rows[0].balance + rows[0].principal : 0) || 1;
    const W = 320, H = 150, n = ys.length, slot = W / n, bw = Math.min(34, slot * .55);
    const pts = ys.map((o, k) => `${(k * slot + slot / 2).toFixed(1)},${(H - o.b / bmax * (H - 10)).toFixed(1)}`).join(' ');
    const bars = ys.map((o, k) => { const x = k * slot + (slot - bw) / 2, hp = o.p / max * (H - 14), hi = o.i / max * (H - 14);
      return `<g class="ldv-bar ${_ldBar === k ? 'on' : ''}" style="--d:${k * 60}ms" onclick="ldPickBar(${k})"><rect x="${x}" y="${H - hp - hi}" width="${bw}" height="${hi}" rx="4" class="ldv-i"/><rect x="${x}" y="${H - hp}" width="${bw}" height="${hp}" rx="4" class="ldv-p"/><rect x="${k * slot}" y="0" width="${slot}" height="${H}" fill="transparent"/></g>`; }).join('');
    const pick = ys[_ldBar] || null;
    return `<svg viewBox="0 0 ${W} ${H + 18}" class="ldv-svg">${bars}<polyline points="${pts}" class="ldv-line"/>${ys.map((o, k) => n <= 12 || k % Math.ceil(n / 8) === 0 ? `<text x="${k * slot + slot / 2}" y="${H + 14}" text-anchor="middle">${String(o.y).slice(n > 5 ? 2 : 0)}${n > 5 ? '' : ''}</text>` : '').join('')}</svg>
      <div class="ldv-pick">${pick ? `<b>${pick.y}</b><span><i class="p"></i>Principal ${S(pick.p)}</span><span><i class="i"></i>Interest ${S(pick.i)}</span><span><i class="l"></i>Left ${S(pick.b)}</span>` : '<span class="mute">Tap a year to see its numbers</span>'}</div>`;
  }
  window.ldPickBar = k => { _ldBar = _ldBar === k ? -1 : k; _ldRefresh(); };
  window.ldToggleAll = () => { _ldAll = !_ldAll; _ldRefresh(); };
  window.ldExtra = v => { const el = document.getElementById('ld-extra'); if (el) { el.value = v; _ldRefresh(); } };

  function _ldRefresh() {
    const loan = (STATE.loans || []).find(l => l.id === _loanDetailId); if (!loan) return;
    const extra = parseFloat(document.getElementById('ld-extra')?.value) || 0, lump = parseFloat(document.getElementById('ld-lump')?.value) || 0;
    const base = _ldPlan(loan, 0, 0), plan = _ldPlan(loan, extra, lump);
    document.querySelectorAll('.ldx-chips button').forEach(b => b.classList.toggle('on', +b.dataset.v === extra));
    const res = document.getElementById('ldx-res');
    if (res) res.innerHTML = plan.neverCloses ? `<div class="ldx-note bad">This payment doesn't cover the monthly interest, so the loan never closes.</div>`
      : (extra > 0 || lump > 0) && !base.neverCloses ? `<div class="ldx-note good"><i data-lucide="party-popper"></i><span>Debt-free <b>${_fmtMonths(Math.max(0, base.months - plan.months))}</b> sooner (${mon(addM(plan.start, plan.months))}) and you save <b>${S(Math.max(0, base.totalInterest - plan.totalInterest))}</b> in interest.</span></div>` : '';
    const lb = document.getElementById('ldx-apply'); if (lb) lb.classList.toggle('hide', !(lump > 0));
    const chart = document.getElementById('ldx-chart'); if (chart) chart.innerHTML = plan.rows.length ? _ldBars(plan.rows, plan.start) : '<p class="ldx-empty">No payments left.</p>';
    const sch = document.getElementById('ldx-sched');
    if (sch) { const rows = _ldAll ? plan.rows : plan.rows.slice(0, 12); let y = null, h = '';
      rows.forEach(r => { const d = addM(plan.start, r.m); if (d.getFullYear() !== y) { y = d.getFullYear(); h += `<div class="ldx-yr">${y}</div>`; }
        h += `<div class="ldx-sr ${r.m === 0 ? 'now' : ''}"><span>${d.toLocaleDateString('en-IN', { month: 'short' })}${r.m === 0 ? ' <em>now</em>' : ''}</span><span class="i">${S(r.interest)}</span><span class="p">${S(r.principal)}</span><b>${S(r.balance)}</b></div>`; });
      sch.innerHTML = rows.length ? `<div class="ldx-sr hd"><span>Month</span><span>Interest</span><span>Principal</span><b>Left</b></div>${h}${plan.rows.length > 12 ? `<button class="lg-more" onclick="ldToggleAll()">${_ldAll ? 'Show less' : 'Show all ' + plan.rows.length + ' months'}</button>` : ''}` : '<p class="ldx-empty">Nothing left to pay.</p>'; }
    if (typeof _lucideRefresh === 'function') _lucideRefresh();
  }

  window.renderLoanDetail = function () {
    if (!window.__IS_APP) return oldLoan.apply(this, arguments);
    const loan = (STATE.loans || []).find(l => l.id === _loanDetailId); if (!loan) { navigate('investments'); return; }
    const c = document.getElementById('page-container');
    const p = _ldPlan(loan, 0, 0), out = p.out, P = p.P;
    const paid = P > 0 && out <= P ? Math.round((P - out) / P * 100) : 0;
    const col = typeColor('loan', loan.type) || '#F05260';
    const repayLbl = { emi: 'EMI', bullet: 'Pay all at the end', 'interest-only': 'Interest only' }[p.repay] || 'EMI';
    // does the stored outstanding match what the loan amount + EMIs say?
    let expect = P; if (p.repay === 'emi' && +loan.emi > 0 && p.m > 0) { const s = _amortizeSchedule(P, p.annual, p.emi, 0, 0); if (!s.neverCloses) expect = p.m >= s.rows.length ? 0 : s.rows[p.m - 1].balance; }
    const mismatch = !loan.autoCalc && P > 0 && out > 0 && (out > P * 1.05 || out < expect * 0.4 || out > expect * 2.5);
    const emiBig = p.repay === 'emi' && out > 0 && p.emi > out;
    const done = out <= 0;
    const closes = !done && !p.neverCloses && p.months ? addM(p.start, p.months) : null;
    const r = 2 * Math.PI * 34, dash = (paid / 100 * r).toFixed(1);
    c.innerHTML = `<div class="pk ldx">
      <div class="pk-head"><button class="pk-back" onclick="navigate('investments')" aria-label="Back"><i data-lucide="arrow-left"></i></button>
        <span class="ldx-hic" style="--c:${col}"><i data-lucide="${_loanLucide(loan.type)}"></i></span>
        <div class="pk-ht"><h1>${E(loan.name || loan.type)}</h1><p>${E(loan.type || 'Loan')}${loan.lender ? ' · ' + E(loan.lender) : ''}</p></div>
        <button class="ldx-ed" onclick="openEditLoanModal('${loan.id}')" aria-label="Edit"><i data-lucide="pencil"></i></button></div>
      <div class="ldx-hero t-loan ${done ? 'done' : ''}">
        <div class="ldx-hl"><span>${done ? 'All paid off' : 'Left to pay'}</span><b id="ldx-big">${fmt(Math.round(out))}</b>
          <div class="ldx-chips-h"><em>${(+loan.interestRate || 0)}% / ${loan.interestPeriod === 'month' ? 'month' : 'year'}</em><em>${repayLbl}</em>${closes ? `<em>Free by ${mon(closes)}</em>` : ''}</div></div>
        <svg class="ldx-ring" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" class="bg"/><circle cx="40" cy="40" r="34" class="fg" style="stroke-dasharray:${dash} ${r.toFixed(1)}"/><text x="40" y="40" text-anchor="middle">${mismatch ? '?' : paid + '%'}</text><text x="40" y="53" text-anchor="middle" class="s">paid</text></svg>
      </div>
      ${mismatch ? `<div class="ldx-warn"><i data-lucide="alert-triangle"></i><div><b>These numbers don't match</b><p>Loan amount is <b>${S(P)}</b> but what's left is <b>${S(out)}</b>. One of them may have an extra or missing digit. The plan below uses what's left (${S(out)}).</p><button onclick="openEditLoanModal('${loan.id}')">Check in Edit</button></div></div>`
        : emiBig ? `<div class="ldx-warn"><i data-lucide="alert-triangle"></i><div><b>EMI is bigger than what's left</b><p>EMI ${S(p.emi)} vs ${S(out)} left — check the EMI in Edit.</p><button onclick="openEditLoanModal('${loan.id}')">Check in Edit</button></div></div>` : ''}
      ${done ? `<div class="pk-empty"><span class="pk-empty-ic"><i data-lucide="party-popper"></i></span><b>This loan is fully paid</b><p>Nice work! You can keep it for your records or delete it.</p><div class="pk-empty-b"><button onclick="confirmDeleteLoan('${loan.id}')">Delete loan</button></div></div>` : `
      <div class="as-tiles">
        <div class="as-tile"><span class="ti xr"><i data-lucide="calendar-clock"></i></span><small>${p.repay === 'emi' ? 'EMI / month' : p.repay === 'bullet' ? 'Pay at the end' : 'Interest / month'}</small><b>${p.repay === 'emi' ? fmt(Math.round(p.emi)) : p.repay === 'bullet' ? S(out + p.totalInterest) : S(P * p.annual / 1200)}</b><em>${loan.emi && p.repay === 'emi' && Math.round(p.emi) !== Math.round(+loan.emi) ? 'worked out — saved EMI is too low' : 'every month'}</em></div>
        <div class="as-tile"><span class="ti xp"><i data-lucide="flag"></i></span><small>Debt-free in</small><b>${p.neverCloses ? 'Never' : _fmtMonths(p.months)}</b><em>${closes ? 'by ' + mon(closes) : p.special ? 'set the tenure in Edit' : 'EMI too low'}</em></div>
        <div class="as-tile"><span class="ti xo"><i data-lucide="percent"></i></span><small>Interest still to pay</small><b class="warnc">${S(p.totalInterest)}</b><em>from today</em></div>
        <div class="as-tile"><span class="ti xg"><i data-lucide="check-circle-2"></i></span><small>Paid so far</small><b class="up">${mismatch ? '—' : S(Math.max(0, P - out))}</b><em>${mismatch ? 'fix the loan amount first' : 'of ' + S(P) + ' borrowed'}</em></div>
      </div>
      <div class="pk-card ldx-card"><div class="ldx-ct"><span>Year by year</span><span class="ldx-leg"><i class="p"></i>Principal <i class="i"></i>Interest <i class="l"></i>Left</span></div><div id="ldx-chart"></div></div>
      <div class="pk-card ldx-card"><div class="ldx-ct"><span>Finish sooner</span></div>
        ${p.repay === 'emi' ? `<label class="ldx-l">Pay extra every month</label>
        <div class="ldx-chips">${[0, 1000, 5000, 10000, 25000].map(v => `<button data-v="${v}" onclick="ldExtra(${v})">${v ? '+' + S(v) : 'None'}</button>`).join('')}</div>
        <input id="ld-extra" class="ldx-in" type="number" inputmode="numeric" placeholder="or type an amount" oninput="window.__ldR()"/>` : '<input id="ld-extra" type="hidden" value="0"/>'}
        <label class="ldx-l">One-time payment now</label>
        <input id="ld-lump" class="ldx-in" type="number" inputmode="numeric" placeholder="₹0" oninput="window.__ldR()"/>
        <div id="ldx-res"></div>
        <button id="ldx-apply" class="ldx-btn hide" onclick="applyLoanLumpSum('${loan.id}')"><i data-lucide="check"></i>I paid this — reduce what's left</button>
      </div>
      <div class="pk-sec"><span>Payment schedule</span><em>from this month</em></div>
      <div class="pk-list ldx-sched" id="ldx-sched"></div>`}
      <div class="ldx-foot">${!done ? `<button onclick="if(confirm('Mark this loan as fully paid?'))markLoanPaid('${loan.id}')"><i data-lucide="check-check"></i>Mark as paid</button>` : ''}<button class="del" onclick="confirmDeleteLoan('${loan.id}')"><i data-lucide="trash-2"></i>Delete</button></div>
    </div>`;
    window.__ldR = _ldRefresh; _ldBar = -1;
    _pk.done(c); _ldRefresh();
  };

  // ── Asset detail ─────────────────────────────────────────────
  function _adChart(inv) {
    const { labels, values } = _assetSeries(inv); if (values.length < 2) return '';
    const W = 320, H = 130, lo = Math.min(...values), hi = Math.max(...values), rng = (hi - lo) || 1;
    const x = i => i / (values.length - 1) * W, y = v => H - 8 - (v - lo) / rng * (H - 20);
    const line = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    return `<svg viewBox="0 0 ${W} ${H + 16}" class="adx-svg ${values[values.length - 1] < values[0] ? 'down' : ''}"><defs><linearGradient id="adxg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="s0"/><stop offset="1" class="s1"/></linearGradient></defs>
      <polygon points="0,${H} ${line} ${W},${H}" fill="url(#adxg)" class="adx-area"/><polyline points="${line}" class="adx-line"/><circle cx="${x(values.length - 1)}" cy="${y(values[values.length - 1])}" r="5" class="adx-dot"/>
      <text x="0" y="${H + 13}">${labels[0]}</text><text x="${W}" y="${H + 13}" text-anchor="end">${labels[labels.length - 1]}</text></svg>`;
  }
  window.renderAssetDetail = function () {
    if (!window.__IS_APP) return oldAsset.apply(this, arguments);
    const inv = (STATE.investments || []).find(i => i.id === _assetDetailId); if (!inv) { navigate('investments'); return; }
    if (_recordAssetSnapshot(inv)) { try { saveState(); } catch (_) {} }
    const c = document.getElementById('page-container');
    const lent = inv.type === 'Money Lent', amt = +inv.amount || 0, cur = _assetCur(inv), g = cur - amt, up = g >= 0, pct = amt > 0 ? g / amt * 100 : 0;
    const st = inv.date ? new Date(inv.date + 'T00:00:00') : null, days = st && !isNaN(st) ? Math.max(0, Math.round((Date.now() - st) / 864e5)) : 0;
    const perM = days > 0 ? g / Math.max(days / 30.4375, .5) : 0, yr = days >= 365, perY = yr ? g / (days / 365.25) : g;
    const col = typeColor('asset', inv.type) || '#10B981';
    const live = inv.type === 'Stocks' || inv.type === 'Crypto' || inv.type === 'Gold' || inv.ticker;
    const exp = inv.expectedDate ? new Date(inv.expectedDate + 'T00:00:00') : null;
    const chart = _adChart(inv);
    const sg = v => (v >= 0 ? '+' : '−') + S(Math.abs(v));
    c.innerHTML = `<div class="pk ldx">
      <div class="pk-head"><button class="pk-back" onclick="navigate('investments')" aria-label="Back"><i data-lucide="arrow-left"></i></button>
        <span class="ldx-hic" style="--c:${col}"><i data-lucide="${_assetLucide(inv.type)}"></i></span>
        <div class="pk-ht"><h1>${E(inv.name || inv.type)}</h1><p>${E(inv.type || 'Asset')}${lent && inv.person ? ' · ' + E(inv.person) : ''}</p></div>
        <button class="ldx-ed" onclick="openEditInvModal('${inv.id}')" aria-label="Edit"><i data-lucide="pencil"></i></button></div>
      <div class="ldx-hero ${up ? 't-up' : 't-down'}">
        <div class="ldx-hl"><span>${lent ? 'Still to receive' : 'Worth today'}</span><b>${fmt(Math.round(cur))}</b>
          <div class="ldx-chips-h">${amt ? `<em>${up ? '▲' : '▼'} ${sg(g)} · ${Math.abs(pct).toFixed(1)}%</em>` : ''}${st && !isNaN(st) ? `<em>Since ${st.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</em>` : ''}</div></div>
        ${live ? `<button class="ldx-live" id="live-update-asset-btn" onclick="updateSingleAssetLivePrice('${inv.id}')"><i data-lucide="refresh-cw"></i>Live</button>` : ''}
      </div>
      <div class="as-tiles">
        <div class="as-tile"><span class="ti xc"><i data-lucide="wallet"></i></span><small>${lent ? 'You gave' : 'You put in'}</small><b>${S(amt)}</b><em>${days ? days + ' days ago' : 'recently'}</em></div>
        ${lent ? `<div class="as-tile"><span class="ti xg"><i data-lucide="hand-coins"></i></span><small>Received back</small><b class="up">${S(+inv.received || 0)}</b><em>${inv.interestRate ? inv.interestRate + '% / ' + (inv.interestMode === 'month' ? 'month' : 'year') : 'no interest'}</em></div>
        <div class="as-tile"><span class="ti xp"><i data-lucide="calendar-check"></i></span><small>Expected back</small><b>${exp ? mon(exp) : '—'}</b><em>${exp ? (exp < new Date() ? 'overdue' : Math.ceil((exp - Date.now()) / 864e5) + ' days to go') : 'add a date in Edit'}</em></div>`
        : `<div class="as-tile"><span class="ti ${up ? 'xg' : 'xr'}"><i data-lucide="${up ? 'trending-up' : 'trending-down'}"></i></span><small>${up ? 'Gain' : 'Loss'}</small><b class="${up ? 'up' : 'down'}">${sg(g)}</b><em>${amt ? (up ? '+' : '−') + Math.abs(pct).toFixed(1) + '% overall' : '—'}</em></div>
        <div class="as-tile"><span class="ti xp"><i data-lucide="gauge"></i></span><small>Per month</small><b class="${perM >= 0 ? 'up' : 'down'}">${days ? sg(perM) : '—'}</b><em>average so far</em></div>`}
        <div class="as-tile"><span class="ti xo"><i data-lucide="calendar-range"></i></span><small>${yr ? 'Per year' : 'So far'}</small><b class="${perY >= 0 ? 'up' : 'down'}">${days ? sg(perY) : '—'}</b><em>${yr ? 'yearly average' : 'held under a year'}</em></div>
      </div>
      <div class="pk-card ldx-card"><div class="ldx-ct"><span>Value over time</span></div>${chart || '<p class="ldx-empty">The chart fills in as the value is updated.</p>'}<p class="as-hint">Update the value from Edit${live ? ' or tap Live' : ''} — each day's value is saved here.</p></div>
      <div class="ldx-foot"><button onclick="openEditInvModal('${inv.id}')"><i data-lucide="pencil"></i>Update value</button><button class="del" onclick="if(confirm('Delete this asset? This can\\'t be undone.')){deleteInv('${inv.id}')}"><i data-lucide="trash-2"></i>Delete</button></div>
    </div>`;
    _pk.done(c);
  };
})();
