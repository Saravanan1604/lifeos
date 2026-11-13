// ============================================================
//  home2.js — build 731: clearer Home money card + Today card (app)
//  One card that answers "how am I doing this month": what's left,
//  a bar of spent vs earned, and three tappable facts (vs last
//  month, bank + cash, bills still to come). Today card: tidy grid,
//  plain message, streak, no overlapping button.
// ============================================================
(function () {
  if (!window.__IS_APP) return;
  const S = v => (typeof _asShort === 'function' ? _asShort(v) : fmt(v));
  function heroHtml() {
    const F = _homeFacts(), hide = STATE.settings && STATE.settings.showTotal === false;
    const H = v => hide ? '••••' : v;
    const net = F.income - F.spent, neg = net < 0;
    const base = F.income > 0 ? F.income : F.budget;
    const pct = base > 0 ? F.spent / base * 100 : null;
    const mName = F.now.toLocaleDateString('en-IN', { month: 'long' });
    const chg = F.pSameDay > 0 ? Math.round((F.spent / F.pSameDay - 1) * 100) : null;
    const have = F.liquid - F.cardDue;
    const say = !F.income && !F.spent ? `Nothing logged in ${mName} yet.`
      : !F.income ? `You've spent <b>${H(S(F.spent))}</b> — add your income to see what's left.`
      : neg ? `You've spent <b>${H(S(-net))}</b> more than you earned.` : `You still have <b>${H(S(net))}</b> of this month's income.`;
    return `<div class="hm-hero ${neg ? 'neg' : 'pos'}">
      <div class="hm-top"><span>${mName} · ${F.daysLeft} day${F.daysLeft === 1 ? '' : 's'} left</span><button class="hm-eye" onclick="event.stopPropagation();recToggleTotal()" aria-label="${hide ? 'Show' : 'Hide'} amounts"><i data-lucide="${hide ? 'eye-off' : 'eye'}"></i></button></div>
      <small class="hm-l">${neg ? 'Overspent this month' : 'Left this month'}</small>
      <b class="hm-big">${hide ? '••••••' : (neg ? '−' : '') + fmt(Math.round(Math.abs(net)))}</b>
      <p class="hm-say">${say}</p>
      ${pct != null ? `<div class="hm-bar"><i style="width:${Math.min(100, pct)}%"></i>${pct > 100 ? `<s style="left:${(100 / pct * 100).toFixed(1)}%"></s>` : ''}</div>
      <div class="hm-bl"><span>${Math.round(pct)}% of your ${F.income > 0 ? 'income' : 'budget'} used</span><span>${pct > 100 ? 'over by ' + H(S(F.spent - base)) : H(S(base - F.spent)) + ' to go'}</span></div>` : ''}
      <div class="hm-io">
        <button onclick="event.stopPropagation();navigate('insights')"><span class="i in"><i data-lucide="arrow-down-left"></i></span><span><small>Earned</small><b>${H('+' + S(F.income))}</b></span></button>
        <button onclick="event.stopPropagation();navigate('insights')"><span class="i out"><i data-lucide="arrow-up-right"></i></span><span><small>Spent</small><b>${H('−' + S(F.spent))}</b></span></button>
      </div>
      <div class="hm-facts">
        ${chg != null ? `<button onclick="event.stopPropagation();navigate('insights')"><i data-lucide="${chg > 0 ? 'trending-up' : 'trending-down'}"></i><span><b style="color:${chg > 0 ? '#FECDD3' : '#A7F3D0'} !important">${chg > 0 ? '+' : '−'}${Math.abs(chg)}%</b><small>spend vs ${F.prev.toLocaleDateString('en-IN', { month: 'short' })}</small></span></button>` : ''}
        ${(STATE.bankAccounts || []).length || (STATE.cashAccounts || []).length ? `<button onclick="event.stopPropagation();navigate('bank-tracker')"><i data-lucide="landmark"></i><span><b>${H((have < 0 ? '−' : '') + S(Math.abs(have)))}</b><small>in accounts</small></span></button>` : ''}
        ${F.billsLeft ? `<button onclick="event.stopPropagation();navigate('upcoming')"><i data-lucide="receipt"></i><span><b>${H(S(F.billsLeft))}</b><small>bills to pay</small></span></button>` : ''}
      </div>
    </div>`;
  }
  const orig = window.renderRecordsMyMoney;
  window.renderRecordsMyMoney = function () {
    const r = orig.apply(this, arguments);
    try {
      const old = document.querySelector('#page-container .mm-hero');
      if (old && old.querySelector('.hx-hero-extra')) { old.outerHTML = heroHtml(); if (typeof _lucideRefresh === 'function') _lucideRefresh(); }
    } catch (e) { console.log('home hero', e); }
    return r;
  };

  window.homeTodayHtml = function (F) {
    const tdy = _ymdLocal(new Date());
    const list = (STATE.transactions || []).filter(t => t.type !== 'income' && (t.date || '').slice(0, 10) === tdy);
    const spent = list.reduce((s, t) => s + Money.amt(t), 0);
    let allow = null;
    if (F && F.budget) { const left = F.budget - (F.spent - spent); allow = left > 0 ? left / F.daysLeft : 0; }
    const pct = allow ? Math.min(100, spent / allow * 100) : (spent ? 100 : 0);
    const over = allow != null && allow > 0 && spent > allow, usedUp = allow === 0;
    const st = logStreak();
    const R = 26, C = 2 * Math.PI * R;
    const col = allow == null ? 'var(--cx-pri)' : over || usedUp ? 'var(--cx-exp)' : pct >= 80 ? 'var(--cx-warn)' : 'var(--cx-inc)';
    const msg = allow == null ? (list.length ? `${list.length} entr${list.length === 1 ? 'y' : 'ies'} today` : 'No spending logged today')
      : usedUp ? 'Budget for the month is used up — a no-spend day helps'
      : over ? `${fmt(Math.round(spent - allow))} over today's limit` : `You can spend <b>${fmt(Math.floor(allow - spent))}</b> more today`;
    return `<div class="hx-card td2">
      <div class="td-ring"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="${R}" class="hx-ring-bg"/><circle cx="32" cy="32" r="${R}" class="hx-ring-fg" stroke="${col}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}" data-off="${(C * (1 - pct / 100)).toFixed(1)}"/></svg><i data-lucide="${over || usedUp ? 'alert-triangle' : 'sun'}"></i></div>
      <div class="td2-m"><small>Spent today</small><b>${fmt(Math.round(spent))}${allow ? `<em> / ${fmt(Math.floor(allow))} limit</em>` : ''}</b><span>${msg}</span></div>
      <div class="td2-st ${st.today ? 'on' : ''}"><b>🔥 ${st.n}</b><small>day streak</small></div>
      ${st.today ? '' : `<button class="td2-add" onclick="openTxPad('expense')"><i data-lucide="plus"></i>${st.n ? `Log today to keep your ${st.n}-day streak` : 'Log today\'s first entry'}</button>`}
    </div>`;
  };
})();
