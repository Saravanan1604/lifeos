// ============================================================
//  home.js — Life OS 2.0 home intelligence (build 672, app home)
//  Everything here is computed from the user's REAL data:
//  transactions, budgets, recurring rules, loans, accounts.
//  Nothing is invented; estimates are labelled as estimates.
//   • Budget ring  — spent / remaining / daily allowance / status
//   • Insights     — budget pace, category spikes, top category,
//                    month-end forecast, bills due
//   • Health score — 0-100 from savings, budget, debt, emergency fund
//   • Analytics    — 7-day bars · 6-month income vs expense · donut
// ============================================================

const _H = {
  ym(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; },
  tx() { return STATE.transactions || []; },
  exp(t) { return Money.isSpend(t); },
  sum(list) { return list.reduce((s, t) => s + Money.amt(t), 0); },
  monthTx(ym) { return this.tx().filter(t => (t.date || '').startsWith(ym)); },
  pct(a, b) { return b > 0 ? Math.round(a / b * 100) : 0; },
  short(n) {
    const a = Math.abs(n), s = n < 0 ? '-' : '', c = (STATE.settings && STATE.settings.currency) || '₹';
    if (a >= 1e7) return s + c + (a / 1e7).toFixed(a >= 1e8 ? 0 : 1) + 'Cr';
    if (a >= 1e5) return s + c + (a / 1e5).toFixed(a >= 1e6 ? 0 : 1) + 'L';
    if (a >= 1e3) return s + c + (a / 1e3).toFixed(a >= 1e4 ? 0 : 1) + 'K';
    return s + c + Math.round(a);
  },
};

// ── month facts shared by every card ──
function _homeFacts() {
  const now = new Date();
  const ym = _H.ym(now);
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const pym = _H.ym(prev);
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const day = now.getDate();
  const daysLeft = dim - day + 1;                       // including today
  const mt = _H.monthTx(ym), pt = _H.monthTx(pym);
  const spent = _H.sum(mt.filter(_H.exp)), income = _H.sum(mt.filter(t => t.type === 'income'));
  const pSpent = _H.sum(pt.filter(_H.exp)), pIncome = _H.sum(pt.filter(t => t.type === 'income'));
  // spend at the SAME point of last month → fair "vs last month" comparison
  const pSameDay = _H.sum(pt.filter(t => _H.exp(t) && +(t.date || '').slice(8, 10) <= day));
  const budget = (STATE.budgets || []).reduce((s, b) => s + (typeof _budgetLimitMonthly === 'function' ? _budgetLimitMonthly(b) : (+b.amount || 0)), 0);
  const byCat = {};
  mt.filter(_H.exp).forEach(t => { const c = t.category || 'Other'; byCat[c] = (byCat[c] || 0) + (+t.amount || 0); });
  // upcoming recurring before month end (not yet posted)
  const todayS = _ymdLocal(now), endS = `${ym}-${String(dim).padStart(2, '0')}`;
  let billsLeft = 0, incomeLeft = 0;
  (STATE.recurring || []).forEach(r => {
    if (r.enabled === false || !r.nextDate) return;
    let d = r.nextDate, g = 0;
    while (d && d <= endS && g < 40) {
      if (d >= todayS) { if (r.type === 'income') incomeLeft += +r.amount || 0; else billsLeft += +r.amount || 0; }
      if (!r.frequency || typeof _advanceDate !== 'function') break;
      d = _advanceDate(d, r.frequency); g++;
    }
  });
  // liquid money: banks + cash − card dues
  const liquid = (STATE.bankAccounts || []).reduce((s, a) => s + (+a.balance || 0), 0)
               + (STATE.cashAccounts || []).reduce((s, a) => s + (+a.balance || 0), 0);
  const cardDue = (STATE.creditCards || []).reduce((s, c) => s + (+c.outstanding || +c.used || 0), 0);
  return { now, ym, pym, prev, dim, day, daysLeft, spent, income, pSpent, pIncome, pSameDay, budget, byCat, billsLeft, incomeLeft, liquid, cardDue };
}

// Everyday spending pace for forecasts: this month's expenses EXCLUDING
// fixed / one-off items (EMI, rent, insurance, recurring bills, unusual
// spends), divided by days elapsed. Projecting a one-off EMI as if it
// repeated daily made month-end forecasts wildly negative.
function homeEverydayPace(F) {
  const recKeys = new Set((STATE.recurring || []).map(r => ((r.description || r.category || '') + '').trim().toLowerCase()));
  const isFixed = t => !!t.recurringId || /^(emi|rent|insurance|loan|investment|sip)$/i.test(t.category || '')
    || recKeys.has(((t.description || '') + '').trim().toLowerCase())
    || (typeof _isUnusual === 'function' && _isUnusual(t));
  const ev = (STATE.transactions || []).filter(t => t.type !== 'income' && (t.date || '').startsWith(F.ym) && !isFixed(t));
  return ev.reduce((s, t) => s + (+t.amount || 0), 0) / Math.max(1, F.day);
}

// ══════════════════════════════════════════════════════════
// BUDGET RING
// ══════════════════════════════════════════════════════════
function _homeBudgetHtml(F) {
  if (!F.budget) {
    return `<div class="hx-card hx-budget-empty" onclick="navigate('budget')">
      <span class="hx-ic"><i data-lucide="target"></i></span>
      <div><p class="hx-t">Set a monthly budget</p><p class="hx-s">Get a daily spending allowance and alerts before you overspend.</p></div>
      <i data-lucide="chevron-right" class="hx-chev"></i></div>`;
  }
  const pct = F.spent / F.budget * 100;
  const left = F.budget - F.spent;
  // projected position vs where you "should" be by today
  const pace = F.day / F.dim * 100;
  const st = pct >= 100 ? { k: 'over', l: 'Over budget', c: '#F05260' }
           : (pct >= 80 || pct > pace + 10) ? { k: 'warn', l: pct >= 80 ? 'Near limit' : 'Spending fast', c: '#FBBF24' }
           : { k: 'ok', l: 'On track', c: '#10B981' };
  const R = 46, C = 2 * Math.PI * R, shown = Math.min(100, pct);
  const daily = left > 0 ? left / F.daysLeft : 0;
  return `<div class="hx-card hx-budget hx-${st.k}" onclick="navigate('budget')">
    <div class="hx-ring">
      <svg viewBox="0 0 110 110"><circle class="hx-ring-bg" cx="55" cy="55" r="${R}"/>
        <circle class="hx-ring-fg" cx="55" cy="55" r="${R}" stroke="${st.c}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}" data-off="${(C * (1 - shown / 100)).toFixed(1)}"/>
        <line class="hx-ring-pace" x1="55" y1="4" x2="55" y2="14" transform="rotate(${(pace * 3.6).toFixed(1)} 55 55)"/></svg>
      <div class="hx-ring-c"><b>${Math.round(pct)}%</b><span>spent</span></div>
    </div>
    <div class="hx-bud-info">
      <div class="hx-bud-top"><p class="hx-t">Monthly budget</p><span class="hx-pill" style="color:${st.c};background:${st.c}1f">${st.l}</span></div>
      <div class="hx-bud-grid">
        <div><span>Spent</span><b>${fmt(Math.round(F.spent))}</b></div>
        <div><span>${left >= 0 ? 'Left' : 'Over by'}</span><b style="color:${left >= 0 ? 'inherit' : '#F05260'}">${fmt(Math.round(Math.abs(left)))}</b></div>
        <div><span>Budget</span><b>${fmt(Math.round(F.budget))}</b></div>
        <div><span>Per day</span><b>${left > 0 ? fmt(Math.floor(daily)) : 'Used up'}</b></div>
      </div>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════════════
// FINANCIAL HEALTH SCORE (0-100)
// ══════════════════════════════════════════════════════════
function _homeHealth(F) {
  const parts = [];
  // 1. Savings rate (30) — this month, or last month if no income yet
  const inc = F.income || F.pIncome, ex = F.income ? F.spent : F.pSpent;
  const sr = inc > 0 ? (inc - ex) / inc : null;
  const sPts = sr == null ? 12 : Math.max(0, Math.min(30, Math.round(sr / 0.3 * 30)));
  parts.push({ n: 'Savings rate', v: sPts, of: 30, d: sr == null ? 'No income logged yet' : `${Math.round(sr * 100)}% of income saved (target 30%)` });
  // 2. Budget discipline (20)
  let bPts = 10, bD = 'No budget set';
  if (F.budget) {
    const ratio = (F.spent / F.budget) / Math.max(0.05, F.day / F.dim);   // 1 = exactly on pace
    bPts = ratio <= 1 ? 20 : Math.max(0, Math.round(20 - (ratio - 1) * 20));
    bD = ratio <= 1 ? 'Spending at or under budget pace' : `Spending ${Math.round((ratio - 1) * 100)}% faster than budget pace`;
  }
  parts.push({ n: 'Budget discipline', v: bPts, of: 20, d: bD });
  // 3. Debt load (25) — EMIs as share of income
  const emi = (STATE.loans || []).reduce((s, l) => s + (+l.emi || 0), 0);
  let dPts = 25, dD = 'No loan EMIs';
  if (emi > 0) {
    const r = inc > 0 ? emi / inc : 1;
    dPts = r <= 0.2 ? 25 : r >= 0.6 ? 0 : Math.round(25 * (0.6 - r) / 0.4);
    dD = inc > 0 ? `EMIs are ${Math.round(r * 100)}% of income (healthy ≤ 20%)` : 'EMIs with no income logged';
  }
  parts.push({ n: 'Debt load', v: dPts, of: 25, d: dD });
  // 4. Emergency fund (25) — liquid money ÷ avg monthly spend (last 3 months)
  let tot = 0, n = 0;
  for (let i = 1; i <= 3; i++) { const d = new Date(F.now.getFullYear(), F.now.getMonth() - i, 1); const s = _H.sum(_H.monthTx(_H.ym(d)).filter(_H.exp)); if (s > 0) { tot += s; n++; } }
  const avg = n ? tot / n : F.spent;
  const months = avg > 0 ? (F.liquid - F.cardDue) / avg : 0;
  const ePts = Math.max(0, Math.min(25, Math.round(months / 6 * 25)));
  parts.push({ n: 'Emergency fund', v: ePts, of: 25, d: avg > 0 ? `${Math.max(0, months).toFixed(1)} months of expenses in the bank (target 6)` : 'Not enough history yet' });
  const score = parts.reduce((s, p) => s + p.v, 0);
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs work';
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#22D3EE' : score >= 40 ? '#FBBF24' : '#F05260';
  return { score, label, color, parts };
}
function openHealthScore() {
  const h = _homeHealth(_homeFacts());
  openModal('💠 Financial health', `
    <div class="hs-top"><b style="color:${h.color}">${h.score}</b><span>/100 · ${h.label}</span></div>
    ${h.parts.map(p => `<div class="hs-row"><div class="hs-row-h"><span>${p.n}</span><b>${p.v}/${p.of}</b></div>
      <div class="hs-bar"><i style="width:${p.v / p.of * 100}%;background:${h.color}"></i></div><p>${p.d}</p></div>`).join('')}
    <p class="hs-note">Calculated on this device from your own transactions, budgets, loans and account balances.</p>`);
}


// ══════════════════════════════════════════════════════════
// ANALYTICS (inline SVG — instant, no chart library needed)
// ══════════════════════════════════════════════════════════
let _homeTab = 'week';
function setHomeTab(t) { _homeTab = t; const el = document.getElementById('hx-analytics'); if (el) { el.outerHTML = _homeAnalyticsHtml(_homeFacts()); _homeAfterRender(); } }
function _homeBarTap(el) {
  const box = el.closest('.hx-chart'); if (!box) return;
  if (navigator.vibrate) { try { navigator.vibrate(8); } catch (_) {} }
  box.querySelectorAll('.on').forEach(x => x.classList.remove('on'));
  el.classList.add('on');
  const cap = box.parentElement.querySelector('.hx-cap'); if (cap) cap.innerHTML = el.dataset.cap;
}
function _homeAnalyticsHtml(F) {
  const tabs = [['week', '7 days'], ['6m', '6 months'], ['cats', 'Categories']];
  let body = '', cap = '';
  if (_homeTab === 'week') {
    const days = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(F.now); d.setDate(d.getDate() - i); const k = _ymdLocal(d); days.push({ k, l: d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2), v: _H.sum(_H.tx().filter(t => _H.exp(t) && (t.date || '').slice(0, 10) === k)) }); }
    const max = Math.max(1, ...days.map(d => d.v)), tot = _H.sum(days.map(d => ({ amount: d.v })));
    cap = `<b>${fmt(Math.round(tot))}</b> spent in the last 7 days · avg ${fmt(Math.round(tot / 7))}/day`;
    body = `<div class="hx-chart hx-bars hx-bub-bars">${days.map((d, i) => `<button class="hx-bar ${i === 6 ? 'today on' : ''}" onclick="_homeBarTap(this)" data-cap="<b>${fmt(Math.round(d.v))}</b> on ${fmtDate(d.k)}"><div class="hx-trk"><i style="height:${Math.max(3, d.v / max * 100)}%"><em class="hx-bub">${_H.short(d.v)}</em></i></div><span>${d.l}</span></button>`).join('')}</div>`;
  } else if (_homeTab === '6m') {
    const ms = [];
    for (let i = 5; i >= 0; i--) { const d = new Date(F.now.getFullYear(), F.now.getMonth() - i, 1); const mt = _H.monthTx(_H.ym(d)); ms.push({ l: d.toLocaleDateString('en-IN', { month: 'short' }), inc: _H.sum(mt.filter(t => t.type === 'income')), exp: _H.sum(mt.filter(_H.exp)) }); }
    const max = Math.max(1, ...ms.map(m => Math.max(m.inc, m.exp)));
    const prevChg = F.pSameDay > 0 ? Math.round((F.spent / F.pSameDay - 1) * 100) : null;
    cap = prevChg == null ? 'Income vs expense, last 6 months' : `This month's spending is <b>${prevChg >= 0 ? '▲' : '▼'} ${Math.abs(prevChg)}%</b> vs the same point last month`;
    body = `<div class="hx-chart hx-bars hx-pairs">${ms.map(m => `<button class="hx-pair" onclick="_homeBarTap(this)" data-cap="${m.l}: income <b style='color:#10B981'>${fmt(Math.round(m.inc))}</b> · spent <b style='color:#F05260'>${fmt(Math.round(m.exp))}</b>"><div><i class="inc" style="height:${Math.max(2, m.inc / max * 100)}%"></i><i class="exp" style="height:${Math.max(2, m.exp / max * 100)}%"></i></div><span>${m.l}</span></button>`).join('')}</div>
      <div class="hx-legend"><span><i style="background:#10B981"></i>Income</span><span><i style="background:#F05260"></i>Expense</span></div>`;
  } else {
    const cols = ['#EC4899', '#8B5CF6', '#22D3EE', '#34D399', '#FBBF24', '#64748B'];
    let ent = Object.entries(F.byCat).sort((a, b) => b[1] - a[1]);
    if (ent.length > 5) { const rest = ent.slice(5).reduce((s, e) => s + e[1], 0); ent = ent.slice(0, 5).concat([['Others', rest]]); }
    const tot = ent.reduce((s, e) => s + e[1], 0);
    if (!tot) body = `<p class="hx-s" style="padding:24px 0;text-align:center">No spending this month yet.</p>`;
    else {
      body = `<div class="hx-rose-wrap"><div class="hx-rose">${_homeRoseSvg(ent, tot, cols)}<div class="hx-donut-c"><span>${F.now.toLocaleDateString('en-IN', { month: 'long' })}</span><b>${_H.short(tot)}</b></div></div></div>
        <div class="hx-crows">${ent.map(([c, v], i) => `<button class="hx-crow" style="--c:${cols[i]}" onclick="${c === 'Others' ? "navigate('spending')" : `openCategoryDetail('${c.replace(/'/g, "\\'")}')`}"><span class="hx-crow-ic">${c === 'Others' ? '<i data-lucide="layers"></i>' : (typeof catIconHtml === 'function' ? catIconHtml(c) : '')}</span><span class="hx-crow-m"><b>${esc(c)}</b><em>${_H.pct(v, tot)}%</em></span><b class="hx-crow-v">${fmt(Math.round(v))}</b></button>`).join('')}</div>`;
      cap = `This month by category · tap one to drill in`;
    }
  }
  return `<div class="hx-card hx-an" id="hx-analytics">
    <div class="hx-an-head"><p class="hx-t">Spending analytics</p><button class="hx-link" onclick="navigate('insights')">Details <i data-lucide="chevron-right"></i></button></div>
    <div class="hx-seg">${tabs.map(([k, l]) => `<button class="${_homeTab === k ? 'on' : ''}" onclick="setHomeTab('${k}')">${l}</button>`).join('')}</div>
    ${body}
    <p class="hx-cap">${cap}</p>
  </div>`;
}

// Variable-radius ("rose") donut: biggest share = thickest, outermost arc,
// with a soft glow in Night. Pure SVG paths, no chart library.
function _homeRoseSvg(ent, tot, cols, subs) {
  const cx = 80, cy = 80, rIn = 44, gap = 2.2;
  let a0 = -90;
  const arc = (r1, r2, s, e) => {
    const p = (r, a) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
    const large = e - s > 180 ? 1 : 0;
    const [x1, y1] = p(r2, s), [x2, y2] = p(r2, e), [x3, y3] = p(r1, e), [x4, y4] = p(r1, s);
    return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r2} ${r2} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L${x3.toFixed(2)} ${y3.toFixed(2)} A${r1} ${r1} 0 ${large} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}Z`;
  };
  const paths = ent.map(([c, v], i) => {
    const sweep = Math.max(0.5, v / tot * 360 - (ent.length > 1 ? gap : 0));
    const rOut = 64 + Math.max(0, 14 - i * 3);            // rank → thickness
    const d = arc(rIn, rOut, a0, a0 + Math.min(359.9, sweep));
    a0 += v / tot * 360;
    const q = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const sub = subs && subs[c] ? subs[c] : `${Math.round(v / tot * 100)}% of total`;
    return `<path d="${d}" fill="${cols[i]}" class="hx-rose-seg" style="--c:${cols[i]}" data-cat="${q(c)}" data-v="${Math.round(v)}" data-sub="${q(sub)}"/>`;
  }).join('');
  return `<svg viewBox="0 0 160 160">${paths}</svg>`;
}

// Quick actions under the balance (reference: Add · Send · Receive · Pay bill)
function homeQuickActionsHtml() {
  const due = typeof _billsDue === 'function' ? _billsDue(7).length : 0;
  const a = [
    ['plus', 'Expense', "openTxPad('expense')"],
    ['arrow-down-left', 'Income', "openTxPad('income')"],
    ['arrow-left-right', 'Transfer', "typeof openTransferModal==='function'?openTransferModal():navigate('finance')"],
    ['message-square-text', 'Scan SMS', "typeof openSmsParser==='function'&&openSmsParser()"],
    ['receipt', 'Bills', "navigate('upcoming')", due],
  ];
  return `<div class="hx-qa">${a.map(([ic, l, js, n]) => `<button onclick="${js}"><span><i data-lucide="${ic}"></i>${n ? `<em>${n}</em>` : ''}</span><b>${l}</b></button>`).join('')}</div>`;
}

// ══════════════════════════════════════════════════════════
// HERO extras: % vs last month, accounts link, count-up
// ══════════════════════════════════════════════════════════
function _homeHeroExtraHtml(F) {
  const chg = F.pSameDay > 0 ? Math.round((F.spent / F.pSameDay - 1) * 100) : null;
  const net = F.liquid - F.cardDue;
  return `<div class="hx-hero-extra">
    ${chg == null ? '' : `<span class="hx-chg ${chg > 0 ? 'up' : 'down'}"><i data-lucide="${chg > 0 ? 'trending-up' : 'trending-down'}"></i> Spending ${chg > 0 ? '+' : ''}${chg}% vs ${F.prev.toLocaleDateString('en-IN', { month: 'short' })}</span>`}
    ${(STATE.bankAccounts || []).length ? `<button class="hx-accts" onclick="event.stopPropagation();navigate('finance')"><i data-lucide="landmark"></i> In accounts ${STATE.settings && STATE.settings.showTotal === false ? '••••' : _H.short(net)} <i data-lucide="chevron-right"></i></button>` : ''}
  </div>`;
}
let _homeLastHero = null;
function _homeAfterRender() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll('.hx-ring-fg[data-off]').forEach(c => { c.style.strokeDashoffset = c.dataset.off; });
  }));
  if (window.lucide && lucide.createIcons) { try { lucide.createIcons(); } catch (_) {} }
}

// Entry point used by renderRecordsMyMoney (only for the current month view)
function homeDashboardHtml() {
  try {
    const F = _homeFacts();
    let chk = '';
    try { if (typeof dataCheckItems === 'function') { const it = dataCheckItems().filter(i => i.sev !== 'low');
      if (it.length) chk = `<button class="hx-card dc-home" onclick="navigate('data-check')"><span><i data-lucide="search-check"></i></span><div><b>${it.length} thing${it.length === 1 ? '' : 's'} to check in your data</b><small>${it[0].t}${it.length > 1 ? ` + ${it.length - 1} more` : ''} · tap to review</small></div><i data-lucide="chevron-right"></i></button>`; } } catch (_) {}
    if (!chk) try { const gs = Money.mismatches(); if (gs.length) { const n = gs.reduce((a, g) => a + g.ids.length, 0);
      chk = `<button class="hx-card dc-home" onclick="openDataCheck()"><span><i data-lucide="shield-alert"></i></span><div><b>${n} ${n === 1 ? 'entry looks' : 'entries look'} wrong</b><small>${gs[0].category} saved as ${gs[0].have}${gs.length > 1 ? ` + ${gs.length - 1} more` : ''} · tap to review</small></div><i data-lucide="chevron-right"></i></button>`; } } catch (_) {}
    return chk + (typeof homeRecapHtml === 'function' ? homeRecapHtml() : '') + (typeof homeBackupHtml === 'function' ? homeBackupHtml() : '') + (typeof homeTodayHtml === 'function' ? homeTodayHtml(F) : '') + _homeBudgetHtml(F) + _homeAnalyticsHtml(F);
  } catch (e) { console.log('home dash', e); return ''; }
}
function homeHeroExtra() { try { return _homeHeroExtraHtml(_homeFacts()); } catch (_) { return ''; } }

// ── header greeting (left of the minimal top bar) ──
function updateHeaderGreeting() {
  const el = document.getElementById('hdr-greet'); if (!el) return;
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night';
  const name = ((STATE.user && STATE.user.name) || (STATE.settings && STATE.settings.name) || '').split(' ')[0];
  el.innerHTML = `<b>${g}${name ? ', ' + esc(name) : ''}</b><span>${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</span>`;
}
document.addEventListener('DOMContentLoaded', () => { setTimeout(updateHeaderGreeting, 300); setInterval(updateHeaderGreeting, 60000); });
