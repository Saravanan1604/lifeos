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
  // Build 740: calm, simple money card — one number, two bars, one line
  function heroHtml() {
    const F = _homeFacts(), hide = STATE.settings && STATE.settings.showTotal === false;
    const H = v => hide ? '••••' : v;
    const net = F.income - F.spent, neg = net < 0;
    const mx = Math.max(F.income, F.spent, 1);
    const wi = F.income / mx * 100, wo = F.spent / mx * 100;
    const foot = [`${F.daysLeft} day${F.daysLeft === 1 ? '' : 's'} left`];
    if (F.billsLeft) foot.push(`<button onclick="event.stopPropagation();navigate('upcoming')">${H(S(F.billsLeft))} bills due <i data-lucide="chevron-right"></i></button>`);
    return `<div class="hc ${neg ? 'neg' : 'pos'}" onclick="navigate('insights')">
      <div class="hc-top"><span>${!F.income && !F.spent ? 'Nothing logged yet' : neg ? 'Overspent this month' : 'Left this month'}</span>
        <button class="hc-eye" onclick="event.stopPropagation();recToggleTotal()" aria-label="${hide ? 'Show' : 'Hide'} amounts"><i data-lucide="${hide ? 'eye-off' : 'eye'}"></i></button></div>
      <b class="hc-big">${hide ? '••••••' : (neg ? '−' : '') + fmt(Math.round(Math.abs(net)))}</b>
      <div class="hc-rows">
        <div class="hc-r"><span><i class="in"></i>Earned</span><b>${H(fmt(Math.round(F.income)))}</b><span class="hc-bar"><i class="in" style="width:${wi.toFixed(1)}%"></i></span></div>
        <div class="hc-r"><span><i class="out"></i>Spent</span><b>${H(fmt(Math.round(F.spent)))}</b><span class="hc-bar"><i class="out" style="width:${wo.toFixed(1)}%"></i></span></div>
      </div>
      <div class="hc-foot">${foot.join('<span class="hc-sep">·</span>')}</div>
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
