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
  // Build 732: Home leads with ADDING — a slim one-line summary instead of a big card
  function heroHtml() {
    const F = _homeFacts(), hide = STATE.settings && STATE.settings.showTotal === false;
    const H = v => hide ? '••••' : v;
    const net = F.income - F.spent, neg = net < 0;
    const base = F.income > 0 ? F.income : F.budget;
    const pct = base > 0 ? Math.round(F.spent / base * 100) : null;
    const have = F.liquid - F.cardDue;
    return `<div class="hm-slim ${neg ? 'neg' : ''}" onclick="navigate('insights')">
      <div class="hm-s1"><span class="hm-dot"></span><b>${hide ? '••••' : (neg ? '−' : '') + S(Math.abs(net))}</b><span>${neg ? 'over' : 'left'} · ${F.daysLeft} day${F.daysLeft === 1 ? '' : 's'} to go</span>
        <button class="hm-eye2" onclick="event.stopPropagation();recToggleTotal()" aria-label="${hide ? 'Show' : 'Hide'} amounts"><i data-lucide="${hide ? 'eye-off' : 'eye'}"></i></button></div>
      ${pct != null ? `<div class="hm-sbar"><i style="width:${Math.min(100, pct)}%"></i></div>` : ''}
      <div class="hm-s2"><span>In <b class="in">${H(S(F.income))}</b></span><span>Out <b class="out">${H(S(F.spent))}</b></span>${(STATE.bankAccounts || []).length ? `<span onclick="event.stopPropagation();navigate('bank-tracker')">Accounts <b>${H(S(have))}</b></span>` : ''}${F.billsLeft ? `<span onclick="event.stopPropagation();navigate('upcoming')">Bills <b class="warn">${H(S(F.billsLeft))}</b></span>` : ''}</div>
    </div>`;
  }
  function latestHtml() {
    const all = (STATE.transactions || []).slice().sort((a, b) => ((b.date || '') + (b.time || '') + (b.createdAt || '')).localeCompare((a.date || '') + (a.time || '') + (a.createdAt || ''))).slice(0, 4);
    if (!all.length) return '';
    const td = _ymdLocal(new Date()), y = new Date(); y.setDate(y.getDate() - 1); const yd = _ymdLocal(y);
    const when = d => d === td ? 'Today' : d === yd ? 'Yesterday' : fmtDate(d);
    const E = x => String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return `<div class="hm-latest"><div class="hm-lh"><span>Just added</span><button onclick="document.querySelector('.mm-subhead')?.scrollIntoView({behavior:'smooth',block:'start'})">See all <i data-lucide="chevron-down"></i></button></div>
      ${all.map((t, k) => { const inc = t.type === 'income'; return `<button class="hm-tx" style="--d:${k * 50}ms" onclick="openTxDetail('${t.id}')"><span class="hm-tic" style="--c:${typeof catColor === 'function' ? catColor(t.category) : '#8B5CF6'}">${typeof catIconHtml === 'function' ? catIconHtml(t.category) : ''}</span><span class="hm-tm"><b>${E(t.description || t.category)}</b><small>${E(t.category || '')} · ${when((t.date || '').slice(0, 10))}</small></span><b class="${inc ? 'in' : ''}">${inc ? '+' : '−'}${fmt(Money.amt(t))}</b></button>`; }).join('')}</div>`;
  }
  const orig = window.renderRecordsMyMoney;
  window.renderRecordsMyMoney = function () {
    const r = orig.apply(this, arguments);
    try {
      const old = document.querySelector('#page-container .mm-hero');
      if (old && old.querySelector('.hx-hero-extra')) {
        old.outerHTML = heroHtml();
        const qa = document.querySelector('#page-container .qa'), acts = document.querySelector('#page-container .hx-qa'), slim = document.querySelector('#page-container .hm-slim');
        if (qa && slim) { slim.after(qa); qa.classList.add('hm-qa-top'); }
        if (acts && qa) qa.after(acts);
        const lt = latestHtml(); if (lt && acts) acts.insertAdjacentHTML('afterend', lt);
        if (typeof _lucideRefresh === 'function') _lucideRefresh();
      }
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
