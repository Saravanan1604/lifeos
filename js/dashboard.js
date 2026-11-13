let _dashPeriod = 'month';
let _dashAnchorDate = null; // null = today; 'YYYY-MM-DD' = specific anchor
let _dashActiveTab = 1; // 1 to 5
let _dashFH = null;
let _dashStrm = null;
let _dashFlow = null;

function setDashPeriod(p) {
  _dashPeriod = p;
  _dashAnchorDate = null; // reset anchor when changing period tab
  renderDashboard();
}

function setDashAnchor(val) {
  _dashAnchorDate = val || null;
  renderDashboard();
}

function resetDashAnchor() {
  _dashAnchorDate = null;
  renderDashboard();
}

function _dashPeriodLabel() {
  const anchor = _dashAnchorDate || today();
  const a = new Date(anchor + 'T00:00:00');
  if (_dashPeriod === 'all') return 'All Time';
  if (_dashPeriod === 'year') return String(a.getFullYear());
  if (_dashPeriod === 'month') return a.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  if (_dashPeriod === 'day') return a.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  // week → Mon–Sun range containing the anchor
  const dow = (a.getDay() + 6) % 7;
  const mon = new Date(a); mon.setDate(a.getDate() - dow);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const o = { day: '2-digit', month: 'short' };
  return `${mon.toLocaleDateString('en-IN', o)} – ${sun.toLocaleDateString('en-IN', o)}`;
}

function dashAtPresent() {
  if (!_dashAnchorDate) return true; // null is today/current period
  const d = new Date(_dashAnchorDate + 'T00:00:00');
  const now = new Date();
  if (_dashPeriod === 'all') return true;
  if (_dashPeriod === 'year') return d.getFullYear() >= now.getFullYear();
  if (_dashPeriod === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  if (_dashPeriod === 'week') {
    const dow = (d.getDay() + 6) % 7;
    const mon = new Date(d);
    mon.setDate(d.getDate() - dow);
    const nextMon = new Date(mon);
    nextMon.setDate(mon.getDate() + 7);
    return nextMon > now;
  }
  if (_dashPeriod === 'day') {
    return d.getFullYear() === now.getFullYear() &&
           d.getMonth() === now.getMonth() &&
           d.getDate() === now.getDate();
  }
  return false;
}

function shiftDashPeriod(dir) {
  const anchor = _dashAnchorDate || today();
  const d = new Date(anchor + 'T00:00:00');
  if (_dashPeriod === 'day') {
    d.setDate(d.getDate() + dir);
  } else if (_dashPeriod === 'week') {
    d.setDate(d.getDate() + dir * 7);
  } else if (_dashPeriod === 'month') {
    d.setMonth(d.getMonth() + dir);
  } else if (_dashPeriod === 'year') {
    d.setFullYear(d.getFullYear() + dir);
  } else {
    return; // 'all' has no shifting
  }
  const now = new Date();
  if (d > now) {
    if (dir > 0) {
      resetDashAnchor();
      return;
    }
    return;
  }
  _dashAnchorDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  renderDashboard();
}

function openDashPeriodSheet() {
  const tabs = ['day', 'week', 'month', 'year', 'all'];
  const lbl = { day: 'Day', week: 'Week', month: 'Month', year: 'Year', all: 'All' };
  const anchor = _dashAnchorDate || today();
  openModal('📅 View Period', `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">
      ${tabs.map(p => `<button onclick="closeModal();setDashPeriod('${p}')"
        style="flex:1;min-width:70px;padding:13px 6px;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;
        background:${_dashPeriod === p ? 'linear-gradient(135deg,#00c9a7,#0acf83)' : 'rgba(255,255,255,0.05)'};
        border:1px solid ${_dashPeriod === p ? 'transparent' : 'rgba(255,255,255,0.12)'};
        color:${_dashPeriod === p ? '#04211a' : 'var(--text)'}">${lbl[p]}</button>`).join('')}
    </div>
    <p style="font-size:13px;font-weight:600;color:var(--text3);margin-bottom:8px;letter-spacing:.5px;text-transform:uppercase">Jump to date</p>
    <input type="date" class="form-input" value="${anchor}" onchange="closeModal();setDashAnchor(this.value)" style="width:100%">
  `);
}

// Returns the display label for the current anchor+period combo
function dashAnchorLabel() {
  if (!_dashAnchorDate) return null;
  const d = new Date(_dashAnchorDate + 'T00:00:00');
  if (_dashPeriod === 'day')   return d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  if (_dashPeriod === 'week') {
    const dow = (d.getDay()+6)%7;
    const mon = new Date(d); mon.setDate(d.getDate()-dow);
    const sun = new Date(mon); sun.setDate(mon.getDate()+6);
    return mon.toLocaleDateString('en-IN',{day:'numeric',month:'short'})+' – '+sun.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  }
  if (_dashPeriod === 'month') return d.toLocaleDateString('en-IN',{month:'long',year:'numeric'});
  if (_dashPeriod === 'year')  return String(d.getFullYear());
  return null;
}

// Picker input type per period
function _pickerType() {
  return { day:'date', week:'date', month:'month', year:'number' }[_dashPeriod] || 'date';
}

// Convert anchor date → value for the picker input
function _pickerValue() {
  const d = _dashAnchorDate || today();
  if (_dashPeriod === 'month') return d.slice(0,7);
  if (_dashPeriod === 'year')  return d.slice(0,4);
  return d;
}

// Convert picker input value → YYYY-MM-DD anchor
function _pickerToAnchor(val) {
  if (!val) return null;
  if (_dashPeriod === 'month') return val + '-01';
  if (_dashPeriod === 'year')  return val + '-01-01';
  return val; // date already YYYY-MM-DD
}

// ===== LIFE SCORE =====
function calcLifeScore() {
  const txns = STATE.transactions || [];
  const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + Money.amt(t), 0);
  const expense = txns.filter(t => t.type !== 'income').reduce((s, t) => s + Money.amt(t), 0);
  const savRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  const wealthScore = Math.max(0, Math.min(100, Math.round(savRate * 1.5 + (STATE.investments?.length || 0) * 5)));

  const today7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10); });
  const recentHealth = (STATE.healthEntries || []).filter(e => today7.includes(e.date));
  const avgMood = recentHealth.length ? recentHealth.reduce((s, e) => s + (e.mood || 5), 0) / recentHealth.length : 5;
  const avgSleep = recentHealth.length ? recentHealth.reduce((s, e) => s + (e.sleep || 7), 0) / recentHealth.length : 7;
  const healthScore = Math.min(100, Math.round(avgMood * 6 + Math.min(avgSleep / 8, 1) * 40));

  const habits = STATE.habits || [];
  const comps = STATE.habitCompletions || [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const doneToday = comps.filter(c => c.date === todayStr).length;
  const prodScore = habits.length > 0 ? Math.round((doneToday / habits.length) * 100) : 50;

  const skills = STATE.skills || [];
  const avgSkill = skills.length > 0 ? skills.reduce((s, sk) => s + sk.proficiency, 0) / skills.length : 0;
  const careerScore = Math.min(100, Math.round(avgSkill * 20 + (STATE.jobApplications?.length || 0) * 5));

  const recentMood = (STATE.emotionEntries || []).slice(-7);
  const avgEmotion = recentMood.length ? recentMood.reduce((s, e) => s + (e.moodScore || 5), 0) / recentMood.length : 5;
  const emotionalScore = Math.min(100, Math.round(avgEmotion * 10));

  const overall = Math.round((wealthScore + healthScore + prodScore + careerScore + emotionalScore) / 5);
  return { overall, wealthScore, healthScore, prodScore, careerScore, emotionalScore };
}


// ── Insight Bar ──
function _buildInsightBar() {
  if (typeof _monthData !== 'function') return '';
  const curr = _monthData(0), prev = _monthData(-1);
  if (!curr.income && !curr.expense) return '';
  const savRate = curr.income > 0 ? (curr.savings/curr.income*100) : -999;
  const mn = off => { const d=new Date(); d.setMonth(d.getMonth()+off); return d.toLocaleString('default',{month:'long'}); };
  let type='info', text='', ctaPage='analytics';

  if (curr.income>0 && curr.expense > curr.income*1.5) {
    type='critical';
    text=`🚨 Spent ${fmt(curr.expense)} vs ${fmt(curr.income)} income in ${mn(0)} — ${((curr.expense/curr.income-1)*100).toFixed(0)}% over. Immediate review needed.`;
  } else if (savRate < 0 && curr.income > 0) {
    type='critical';
    text=`🔴 Savings rate is ${savRate.toFixed(1)}% — you're spending ${fmt(Math.abs(curr.savings))} more than you earn in ${mn(0)}.`;
  } else if (typeof _503020==='function') {
    const r=_503020();
    if (parseFloat(r.needsPct) > 60) {
      type='warning';
      text=`⚠️ Needs are ${r.needsPct}% of income (target 50%) in ${mn(0)} — cut fixed costs by ${fmt(Math.round(r.needs-r.targetNeeds))} to rebalance.`;
      ctaPage='budget';
    } else if (prev && curr.expense > prev.expense*1.2) {
      type='warning';
      text=`📈 Expenses up ${((curr.expense/prev.expense-1)*100).toFixed(0)}% vs ${mn(-1)} (${fmt(curr.expense-prev.expense)} more). Tap to see what changed.`;
    } else if (savRate >= 20) {
      type='success';
      text=`✅ Saving ${savRate.toFixed(1)}% in ${mn(0)}${prev&&curr.savings>prev.savings?` — up ${fmt(Math.round(curr.savings-prev.savings))} vs ${mn(-1)}`:''}. On track.`;
    } else {
      type='info';
      text=`💡 Save ${fmt(Math.max(0,Math.round(curr.income*0.2-curr.savings)))} more in ${mn(0)} to hit 20% savings rate.`;
    }
  } else if (savRate >= 20) {
    type='success'; text=`✅ Saving ${savRate.toFixed(1)}% in ${mn(0)}. Keep it up.`;
  } else {
    type='info'; text=`💡 Saving ${Math.max(0,savRate).toFixed(1)}% in ${mn(0)}. Target is 20%.`;
  }

  const C={critical:{bg:'rgba(239,68,68,0.1)',border:'#ef4444',tc:'#fca5a5'},warning:{bg:'rgba(245,158,11,0.09)',border:'#f59e0b',tc:'#fcd34d'},success:{bg:'rgba(16,185,129,0.09)',border:'#10b981',tc:'#6ee7b7'},info:{bg:'rgba(99,102,241,0.09)',border:'#6366f1',tc:'#a5b4fc'}}[type];
  return `<div id="insight-bar" style="display:flex;align-items:center;gap:12px;padding:11px 16px;background:${C.bg};border:1px solid ${C.border}50;border-left:3px solid ${C.border};border-radius:12px;margin-bottom:18px">
    <p style="font-size:13px;color:${C.tc};font-weight:500;line-height:1.5;flex:1;margin:0">${text} <span onclick="navigate('${ctaPage}')" style="text-decoration:underline;cursor:pointer;font-weight:700">View details →</span></p>
    <button onclick="document.getElementById('insight-bar').style.display='none'" style="background:none;border:none;color:${C.tc};font-size:16px;cursor:pointer;opacity:0.6;padding:2px 4px;flex-shrink:0">✕</button>
  </div>`;
}


// Bank balances · credit cards · goals · budget — colorful chart overview
const DASH_PALETTE = ['#6366f1','#10b981','#f59e0b','#ec4899','#8b5cf6','#3b82f6','#00c9a7','#ef4444','#f97316','#14b8a6'];







// ===== DASHBOARD =====
// Premium dashboard home hero (build 610) — greeting + gradient wealth card
// + quick actions. App-only; injected at the top of renderDashboard.
function _pdHero(bank, cash, inv, cardOut, hasAccts, income, expense) {
  const name = (STATE.settings && STATE.settings.name) || (STATE.user && STATE.user.name) || 'there';
  const hr = new Date().getHours();
  const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const initial = (String(name).trim()[0] || 'A').toUpperCase();
  let wealth = bank + cash + (inv || 0) - cardOut;
  if (!hasAccts && !(inv > 0)) wealth = income - expense;
  const monthNet = income - expense;
  const up = monthNet >= 0;
  return `
    <div class="pd-home">
      <div class="pd-greet">
        <div class="pd-avatar">${esc(initial)}</div>
        <div class="pd-greet-txt">
          <p class="pd-greet-sub">${greet},</p>
          <p class="pd-greet-name">${esc(name)}</p>
        </div>
        <button class="pd-bell" onclick="navigate('upcoming')" title="Upcoming bills">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        </button>
      </div>
    </div>`;
}

function renderDashboard() {
  try {
  const scores = calcLifeScore();
  const txnsAll = STATE.transactions || [];
  const txns = filterTxByAnchor(txnsAll, _dashPeriod, _dashAnchorDate);
  const recent = [...txns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  // For day/week views income (salary) is monthly — fall back to the anchor's month.
  const _incPeriod = (_dashPeriod === 'day' || _dashPeriod === 'week') ? 'month' : _dashPeriod;
  const incomeTxns = _incPeriod === _dashPeriod ? txns : filterTxByAnchor(txnsAll, _incPeriod, _dashAnchorDate);
  const totalIncome = incomeTxns.filter(t => t.type === 'income').reduce((s, t) => s + Money.amt(t), 0);
  const totalExpense = txns.filter(t => t.type !== 'income').reduce((s, t) => s + Money.amt(t), 0);
  const _banks = STATE.bankAccounts || [];
  const _cash  = STATE.cashAccounts || [];
  const _cards = STATE.creditCards  || [];
  const _bankTotal = _banks.reduce((s,b)=>s+(b.balance||0),0);
  const _cashTotal = _cash.reduce((s,c)=>s+(c.balance||0),0);
  const _cardOut   = _cards.reduce((s,c)=>s+(c.outstanding||0),0);
  const _hasAccts  = _banks.length + _cash.length + _cards.length > 0;
  const netWorth   = _hasAccts ? _bankTotal + _cashTotal - _cardOut : totalIncome - totalExpense;
  const habits = STATE.habits || [];
  const comps = STATE.habitCompletions || [];
  const doneToday = comps.filter(c => c.date === today()).length;
  const scoreBarColor = s => s >= 70 ? '#10b981' : s >= 40 ? '#f59e0b' : '#ef4444';

  // Money Rules calculations scoped to dashboard active period/anchor
  const ptx = filterTxByAnchor(STATE.transactions || [], _dashPeriod === 'all' ? 'all' : _dashPeriod, _dashAnchorDate || today());
  _mrLastTx = ptx; // expose globally for node drill-down modal lookup
  const m = typeof _mrMonthlyEquiv === 'function' ? _mrMonthlyEquiv(ptx) : { income: totalIncome, expense: totalExpense };
  const fh = typeof _mrFinHealth === 'function' ? _mrFinHealth(ptx, m, STATE.transactions || []) : { axes: [], overall: 50 };
  const strm = typeof _mrIncomeStreams === 'function' ? _mrIncomeStreams(ptx) : { sums: [], active: 0 };
  const flow = typeof _mrFlow === 'function' ? _mrFlow(ptx) : { invValue: 0, incBy: {}, expBy: {} };

  const S = STATE.settings || {};
  const invValue = flow.invValue || 0;
  const netSaved = Math.max(0, txnsAll.reduce((a, t) => a + (t.type === 'income' ? +t.amount : -+t.amount || 0), 0));
  const corpusGuess = Math.round(+S.mrCorpus || (invValue + netSaved)) || 1000000;
  const age = Math.round(+S.mrAge || +(STATE.user?.age) || (STATE.user?.dob ? (new Date().getFullYear() - new Date(STATE.user.dob).getFullYear()) : 0) || 30);
  const cover = +S.mrCover || 0;

  const missing = [];
  if (!S.mrAge) missing.push('age');
  if (!S.mrCorpus) missing.push('retirement corpus');
  if (!S.mrCover) missing.push('insurance cover');

  _dashFH = fh;
  _dashStrm = strm;
  _dashFlow = flow;

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      ${window.__IS_APP ? _pdHero(_bankTotal, _cashTotal, invValue, _cardOut, _hasAccts, totalIncome, totalExpense) : ''}
      <!-- Header -->
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:20px">
        <div class="dash-title-block">
          <div>
            <h1 class="page-title">Dashboard</h1>
            <p class="page-subtitle">${getGreeting(STATE.settings?.name || 'there')}</p>
          </div>
          ${window.__IS_APP ? `
          <button class="page-customize-btn" onclick="if(typeof toggleEditLayout==='function')toggleEditLayout()" title="Customize layout">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:2px"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg> Customize
          </button>
          ` : ''}
        </div>
        <p class="dash-date-p" style="font-size:12px;color:rgba(241,245,249,0.4);margin-top:2px">${new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        <div class="dash-filter-row" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          ${window.__IS_APP ? `
          <!-- Mobile-only Monthbar Period Navigator -->
          <div class="dash-monthbar-wrap" style="width:100%">
            <div class="mm-monthbar">
              <button class="mm-ring-btn" onclick="navigate('spending')" title="Spending & Budget">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
              </button>
              ${_dashPeriod === 'all' ? '<span class="mm-navbtn" style="visibility:hidden">‹</span>' : `<button class="mm-navbtn" onclick="shiftDashPeriod(-1)">‹</button>`}
              <button class="mm-month" onclick="openDashPeriodSheet()" title="Change period / pick a date">
                ${_dashPeriodLabel()} <span class="mm-month-chev">▾</span>
              </button>
              ${_dashPeriod === 'all' ? '<span class="mm-navbtn" style="visibility:hidden">›</span>' : `<button class="mm-navbtn" onclick="shiftDashPeriod(1)" ${dashAtPresent() ? 'disabled style="opacity: 0.4; cursor: default"' : ''}>›</button>`}
              <button class="mm-today" onclick="resetDashAnchor()" title="Jump to today">Today</button>
            </div>
          </div>
          ` : `
          <!-- Customize button (Desktop) -->
          <button class="page-customize-btn" onclick="if(typeof toggleEditLayout==='function')toggleEditLayout()" title="Customize layout">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:2px"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg> Customize Layout
          </button>

          ${periodTabsHtml(_dashPeriod, 'setDashPeriod')}

          <!-- Calendar picker -->
          <div style="position:relative;display:inline-flex;align-items:center">
            <button class="btn-icon btn-sm" title="Pick a specific ${_dashPeriod}"
              style="font-size:15px;padding:5px 9px;${_dashAnchorDate?'background:rgba(99,102,241,0.25);border-color:rgba(99,102,241,0.5);':''}"
              onclick="document.getElementById('_dashPicker').showPicker?document.getElementById('_dashPicker').showPicker():document.getElementById('_dashPicker').focus()">
              📅
            </button>
            <input id="_dashPicker"
              type="${_pickerType()}"
              value="${_pickerValue()}"
              ${_dashPeriod==='year'?`min="2000" max="${new Date().getFullYear()+1}"`:''}
              style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px"
              onchange="setDashAnchor(_pickerToAnchor(this.value))">
          </div>

          ${_dashAnchorDate ? `
          <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.4);font-size:11px;font-weight:600;color:#a5b4fc">
            📍 ${dashAnchorLabel()}
            <button onclick="resetDashAnchor()" style="background:none;border:none;cursor:pointer;color:#a5b4fc;font-size:13px;line-height:1;padding:0 2px" title="Back to today">✕</button>
          </span>` : ''}

          <button class="btn-primary btn-sm" onclick="navigate('finance')" style="background:linear-gradient(135deg,#00b09b,#0acf83)">+ Add Transaction</button>
          `}
          <span onclick="navigate('habits')" class="streak-badge"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:4px"><path d="M12 2c0 0-5 5-5 10a5 5 0 0 0 10 0c0-5-5-10-5-10z"/></svg>${STATE.streak || 0} Day Streak</span>
        </div>
      </div>

      <!-- App search bar (shown in installed app only via html.is-app) -->
      <div class="app-search" onclick="navigate('finance');setTimeout(()=>{var s=document.getElementById('fin-search-input');if(s)s.focus();},300)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span>Search transactions, pages…</span>
      </div>

      ${window.__IS_APP ? '' : _buildInsightBar()}

      ${(!window.__IS_APP && typeof buildSpendingPulseHTML === 'function') ? buildSpendingPulseHTML() : ''}

      <!-- Sliding Tab Bar -->
      <div class="dash-tabs-container">
        <div class="dash-tabs">
          <button class="dash-tab ${_dashActiveTab===1?'active':''}" data-tab="1" onclick="switchDashTab(1)">
            <span class="dash-tab-icon"><i data-lucide="calendar-days"></i></span>
            <span class="dash-tab-text">Heatmap</span>
          </button>
          <button class="dash-tab ${_dashActiveTab===2?'active':''}" data-tab="2" onclick="switchDashTab(2)">
            <span class="dash-tab-icon"><i data-lucide="arrow-left-right"></i></span>
            <span class="dash-tab-text">Money Flow</span>
          </button>
          <button class="dash-tab ${_dashActiveTab===3?'active':''}" data-tab="3" onclick="switchDashTab(3)">
            <span class="dash-tab-icon"><i data-lucide="landmark"></i></span>
            <span class="dash-tab-text">Wealth Flow</span>
          </button>
          <button class="dash-tab ${_dashActiveTab===4?'active':''}" data-tab="4" onclick="switchDashTab(4)">
            <span class="dash-tab-icon"><i data-lucide="activity"></i></span>
            <span class="dash-tab-text">Health</span>
          </button>
          <button class="dash-tab ${_dashActiveTab===5?'active':''}" data-tab="5" onclick="switchDashTab(5)">
            <span class="dash-tab-icon"><i data-lucide="banknote"></i></span>
            <span class="dash-tab-text">7 Income</span>
          </button>
        </div>
      </div>

      <!-- Date navigator (‹ label › + Today) — like the Records page.
           Tapping the label opens the Day/Week/Month/Year period sheet,
           so no separate period-tab bar is needed. -->
      ${_dashPeriod === 'all' ? '' : `
      <div class="dash-datenav">
        <button class="dash-datenav-arrow" onclick="shiftDashPeriod(-1)" aria-label="Previous">‹</button>
        <span class="dash-datenav-label" onclick="openDashPeriodSheet()">${_dashPeriodLabel()}</span>
        <button class="dash-datenav-arrow" onclick="shiftDashPeriod(1)" aria-label="Next" ${dashAtPresent() ? 'disabled' : ''}>›</button>
        ${!dashAtPresent() ? `<button class="dash-datenav-today" onclick="resetDashAnchor()">Today</button>` : ''}
      </div>`}

      <!-- Tab 1: Money Heatmap Card -->
      <div id="dash-heatmap-card" style="margin-bottom:20px; display: ${_dashActiveTab===1?'block':'none'}">
        <div id="dash-heatmap-container"></div>
      </div>

      <!-- Tab 2: Where Your Money Goes Card -->
      <div class="glass-card" id="dash-mr-flow" style="padding:22px;margin-bottom:20px; display: ${_dashActiveTab===2?'block':'none'}">
        <p class="section-title" style="margin:0 0 4px;display:flex;align-items:center;gap:8px">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle"><path d="M12 22v-6.5a2.5 2.5 0 0 0-5 0V22"/><path d="M12 2v6.5a2.5 2.5 0 0 0 5 0V2"/><path d="M12 2v20"/><path d="M17 12H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Where Your Money Goes
          <button onclick="mrToggleFlowAmt()" style="background:none;border:none;color:${typeof _mrShowFlowAmt !== 'undefined' && _mrShowFlowAmt ? '#00c9a7' : 'var(--text3)'};cursor:pointer;padding:2px;margin-left:auto" title="Show/hide amounts & %">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button onclick="mrPinChart('flow','Where Your Money Goes')" style="background:none;border:none;color:var(--text3);cursor:pointer;padding:2px" title="Pin to a page">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </button>
        </p>
        <p style="font-size:12px;color:var(--text3);margin-bottom:10px">${window.__IS_APP ? 'Where your income goes: spending, debt (EMI) and what you saved. Tap the income trunk for total income, or any node to drill in.' : 'Your full money lifecycle: income → spending, debt & savings → bank, cash & investments → net worth. Tap any node to drill in.'}</p>
        <div class="sankey-scroll-wrap">
          <div style="position:relative;height:${window.__IS_APP ? '480px' : '380px'}" class="sankey-inner">
            <canvas id="mr-flow-chart"></canvas>
          </div>
        </div>
        <p id="mr-flow-fallback" style="display:none;font-size:13px;color:var(--text3);text-align:center;padding:20px">Money-flow chart needs an internet connection the first time. Reopen online to load it.</p>
        <div class="mr-chips" style="margin-top:12px;display:flex;flex-wrap:wrap;gap:7px">
          ${flow.incBy && flow.expBy ? [...Object.keys(flow.incBy), ...Object.keys(flow.expBy)].filter((v,i,a)=>a.indexOf(v)===i).map(k=>`<button onclick="mrShowNode('${esc(k).replace(/'/g,"\\'")}')" style="font-size:12px;font-weight:600;padding:6px 11px;border-radius:16px;background:var(--glass);border:1px solid var(--glass-border);color:var(--text2);cursor:pointer">${esc(k)}</button>`).join('') : ''}
          ${(totalExpense>totalIncome?['From Savings / Debt']:['Savings']).concat(window.__IS_APP?[]:['Bank','Cash','Investments','Debt','Net Worth']).map(n=>{const neg=n==='From Savings / Debt';return `<button onclick="mrShowNode('${n}')" style="font-size:12px;font-weight:600;padding:6px 11px;border-radius:16px;background:${neg?'rgba(239,68,68,0.12)':'rgba(16,185,129,0.12)'};border:1px solid ${neg?'rgba(239,68,68,0.3)':'rgba(16,185,129,0.3)'};color:${neg?'#ef4444':'#10b981'};cursor:pointer">${n}</button>`;}).join('')}
        </div>
        <div id="mr-flow-detail" class="mr-inline-detail" style="display:none"></div>
      </div>

      <!-- Tab 3: Wealth Flow Card -->
      <div class="glass-card" id="dash-mr-wealth" style="padding:22px;margin-bottom:20px; display: ${_dashActiveTab===3?'block':'none'}">
        <p class="section-title" style="margin:0 0 4px;display:flex;align-items:center;gap:8px">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle"><path d="M12 22v-6.5a2.5 2.5 0 0 0-5 0V22"/><path d="M12 2v6.5a2.5 2.5 0 0 0 5 0V2"/><path d="M12 2v22"/><path d="M17 12H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Wealth Flow
          <button onclick="mrToggleFlowAmt()" style="background:none;border:none;color:${typeof _mrShowFlowAmt !== 'undefined' && _mrShowFlowAmt ? '#00c9a7' : 'var(--text3)'};cursor:pointer;padding:2px;margin-left:auto" title="Show/hide amounts & %">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button onclick="mrPinChart('wealth','Wealth Flow')" style="background:none;border:none;color:var(--text3);cursor:pointer;padding:2px" title="Pin to a page">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </button>
        </p>
        <p style="font-size:12px;color:var(--text3);margin-bottom:10px">Where your wealth sits: assets gather, then split into what you own (net worth) and what you owe (debt).</p>
        <div id="mr-wealth-wrap" class="sankey-scroll-wrap wealth-scroll-wrap">
          <div style="position:relative;height:${window.__IS_APP ? '460px' : '300px'}" class="sankey-inner">
            <canvas id="mr-wealth-chart"></canvas>
          </div>
        </div>
        <p id="mr-wealth-fallback" style="display:none;font-size:13px;color:var(--text3);text-align:center;padding:18px"></p>
        <div id="mr-wealth-detail" class="mr-inline-detail" style="display:none"></div>
      </div>

      <!-- Tab 4: Financial Health Card -->
      <div class="glass-card" id="dash-mr-health" style="padding:22px;margin-bottom:20px; display: ${_dashActiveTab===4?'block':'none'}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <p class="section-title" style="margin:0;display:flex;align-items:center;gap:6px">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Financial Health
            <button onclick="mrPinChart('health','Financial Health')" style="background:none;border:none;color:var(--text3);cursor:pointer;padding:2px" title="Pin to a page">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </button>
          </p>
          <span style="font-size:${window.__IS_APP ? '24px' : '22px'};font-weight:900;color:${fh.overall>=70?'#10b981':fh.overall>=40?'#f59e0b':'#ef4444'}">${fh.overall}<span style="font-size:${window.__IS_APP ? '13px' : '13px'};color:var(--text3)">/100</span></span>
        </div>
        <div style="position:relative;height:${window.__IS_APP ? '46vh' : '300px'}"><canvas id="mr-health-chart"></canvas></div>
        <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">
          ${fh.axes && fh.axes.filter(a=>a.v<50).slice(0,3).map(a=>`<p style="font-size:12px;color:var(--text3);display:flex;gap:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" style="display:inline-block;flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span><b style="color:var(--text2)">${a.k} (${a.v}):</b> ${a.tip}</span></p>`).join('') || `<p style="font-size:12px;color:#10b981;display:flex;gap:6px;align-items:center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" style="display:inline-block;flex-shrink:0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Strong across the board — keep it up!</p>`}
        </div>
      </div>

      <!-- Tab 5: 7 Income Streams Card -->
      <div class="glass-card" id="dash-mr-stream" style="padding:22px;margin-bottom:20px; display: ${_dashActiveTab===5?'block':'none'}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <p class="section-title" style="margin:0;display:flex;align-items:center;gap:8px">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
            7 Income Streams
            <button onclick="mrPinChart('stream','7 Income Streams')" style="background:none;border:none;color:var(--text3);cursor:pointer;padding:2px" title="Pin to a page">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </button>
          </p>
          <span style="font-size:${window.__IS_APP ? '18px' : '15px'};font-weight:800;color:var(--text2)">${strm.active}<span style="font-size:${window.__IS_APP ? '13px' : '13px'};color:var(--text3)"> / 7 active</span></span>
        </div>
        <p style="font-size:12px;color:var(--text3);margin-bottom:8px">The average millionaire has 7 streams of income.</p>
        <div style="position:relative;height:${window.__IS_APP ? '46vh' : '300px'}"><canvas id="mr-stream-chart"></canvas></div>
        <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${strm.sums && strm.sums.map(s=>`<div style="display:flex;align-items:center;gap:7px;font-size:13px;padding:7px 10px;border-radius:10px;background:var(--glass);opacity:${s.total>0?1:0.5}"><span style="width:9px;height:9px;border-radius:50%;flex-shrink:0;background:${s.total>0?'#10b981':'#6b7280'}"></span><span style="flex:1;min-width:0;font-weight:600">${s.k}</span>${s.total>0?`<b style="font-size:12px">${fmt(Math.round(s.total))}</b>`:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'}</div>`).join('')}
        </div>
      </div>

      <!-- Generic Bottom Sections (Hidden on Tab 1) -->
      <div id="dash-bottom-cards" style="display: ${_dashActiveTab===1?'none':'block'}">
        <!-- ── Spending Hero Ring (axio-style) ───────────────────────── -->
        ${(() => {
          if (window.__IS_APP) return '';   // app: "Spent in <month>" card hidden
          const pct = totalIncome > 0 ? Math.min(100, Math.round((totalExpense / totalIncome) * 100)) : (totalExpense > 0 ? 100 : 0);
          const sav = totalIncome - totalExpense;
          const mon = new Date().toLocaleString('default', { month: 'long' });
          return `<div class="spend-ring-card glass-card" id="dash-spendring-card" style="padding:24px 20px;margin-bottom:20px;text-align:center" onclick="navigate('finance')">
            <p style="font-size:13px;color:var(--text3);font-weight:600">Spent in <b style="color:var(--text)">${mon}</b></p>
            <div class="spend-ring" style="--pct:${pct};--col:${pct > 85 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#00c9a7'}">
              <div class="spend-ring-inner">
                <span class="spend-ring-amt">${fmt(totalExpense)}</span>
                <span class="spend-ring-sub">${pct}% of income</span>
              </div>
            </div>
            <div class="spend-ring-foot">
              <div><p class="srf-l">Income</p><p class="srf-v" style="color:#10b981">${fmt(totalIncome)}</p></div>
              <div style="border-left:1px solid var(--glass-border)"></div>
              <div><p class="srf-l">Saved</p><p class="srf-v" style="color:${sav >= 0 ? '#00c9a7' : '#ef4444'}">${fmt(sav)}</p></div>
            </div>
          </div>`;
        })()}

        <!-- ── Recent Transactions Card ───────────────────────── -->
        <div class="glass-card" id="dash-recent-tx" style="overflow:hidden;margin-bottom:20px">
          <div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center">
            <p class="section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:6px"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>Recent Transactions</p>
            <button class="btn-secondary btn-sm" onclick="navigate('finance')">View All →</button>
          </div>
          ${recent.length === 0
            ? `<div class="empty-state"><span class="empty-state-icon"><i data-lucide="receipt"></i></span><p>No transactions yet. <span onclick="navigate('finance')" style="color:#00c9a7;cursor:pointer;text-decoration:underline">Add one now →</span></p></div>`
            : recent.map(tx => `
              <div class="tx-row" onclick="if(typeof openTxDetail==='function')openTxDetail('${tx.id}')" style="display:flex;align-items:center;justify-content:space-between;padding:13px 20px;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer;transition:.15s" onmouseover="this.style.background='rgba(0,201,167,0.04)'" onmouseout="this.style.background=''">
                <div style="display:flex;align-items:center;gap:12px">
                  <div class="tx-ic" style="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${(typeof catColor==='function'?catColor(tx.category):'#6366f1')}26;border:1px solid ${(typeof catColor==='function'?catColor(tx.category):'#6366f1')}55;color:${(typeof catColor==='function'?catColor(tx.category):'#6366f1')};font-size:18px;flex-shrink:0">${typeof catIconHtml==='function'?catIconHtml(tx.category):(tx.icon||'')}</div>
                  <div>
                    <p style="font-size:13px;font-weight:600">${tx.description||tx.category}</p>
                    <p style="font-size:11px;color:var(--text3)">${tx.category} · ${fmtDate(tx.date)}</p>
                  </div>
                </div>
                <span style="font-weight:700;font-size:14px;color:${tx.type==='income'?'#00c9a7':'#ef4444'}">${tx.type==='income'?'+':'-'}${fmt(tx.amount)}</span>
              </div>`).join('')}
        </div>

        <!-- ── AI Rule of the Day Card (hidden in app) ─────────────────────── -->
        ${window.__IS_APP ? '' : `
        <div class="glass-card" id="dash-ai-rule" style="padding:22px;margin-bottom:20px;border-left:4px solid var(--indigo)">
          <p style="font-size:10px;font-weight:700;letter-spacing:1px;color:var(--indigo);margin-bottom:6px">💡 AI RULE OF THE DAY</p>
          <p style="font-size:13px;color:var(--text2);line-height:1.6;font-style:italic">${getDailyTip()}</p>
        </div>`}

        <!-- User-added chart widgets (from the layout customizer) -->
        <div id="home-widgets"></div>
      </div>
    </div>`;

  if (window.innerWidth < 700) {
    const twoCol = document.querySelector('.dash-two-col');
    if (twoCol) twoCol.style.gridTemplateColumns = '1fr';
    const qa = document.querySelector('.qa-grid');
    if (qa) qa.style.gridTemplateColumns = 'repeat(2,1fr)';
    const kpi = document.querySelector('.kpi-grid');
    if (kpi) kpi.style.gridTemplateColumns = 'repeat(2,1fr)';
    document.querySelectorAll('.dash-acct-grid, .dash-bg-grid').forEach(g => g.style.gridTemplateColumns = '1fr');
  }

  // Render charts after DOM is ready
  setTimeout(() => {
    // Re-assert tab visibility. applyPageLayout() (the layout customizer)
    // runs after this render and clears the inline display:none we set on
    // each tab card, which otherwise leaves every tab's card visible (and
    // blank, since only the active tab's chart is drawn). Re-hide the
    // non-active tab cards here so only the selected tab shows.
    if (window.__IS_APP) {
      [['dash-heatmap-card', 1], ['dash-mr-flow', 2], ['dash-mr-wealth', 3], ['dash-mr-health', 4], ['dash-mr-stream', 5]]
        .forEach(([id, tab]) => { const el = document.getElementById(id); if (el) el.style.display = (_dashActiveTab === tab ? 'block' : 'none'); });
      const _bc = document.getElementById('dash-bottom-cards');
      if (_bc) _bc.style.display = (_dashActiveTab === 1 ? 'none' : 'block');
    }

    // Render Heatmap and Money Rules charts if available
    if (_dashActiveTab === 1) {
      if (typeof renderHeatmap === 'function') {
        try { renderHeatmap(); } catch(e) { console.error('Error drawing dashboard heatmap:', e); }
      }
    } else {
      if (typeof _mrDrawCharts === 'function' && fh.axes.length > 0) {
        try { _mrDrawCharts(fh, strm, flow); } catch(e) { console.error('Error drawing dashboard money rules charts:', e); }
      }
    }

    // Render any chart widgets the user added to Home
    if (typeof renderHomeWidgets === 'function') renderHomeWidgets();

    // Hook up swiping gesture detector
    if (typeof initDashSwipe === 'function') initDashSwipe();
  }, 50);

  } catch(err) {
    console.error('[atworth] renderDashboard crashed:', err);
    const _pc = document.getElementById('page-container');
    if (_pc) _pc.innerHTML = `
      <div class="fade-in" style="padding:24px">
        <h1 class="page-title">Dashboard</h1>
        <div class="glass-card" style="padding:32px;text-align:center;margin-top:20px">
          <div style="font-size:40px;margin-bottom:12px">⚡</div>
          <p style="font-size:16px;font-weight:700;color:var(--text)">Welcome to atworth!</p>
          <p style="font-size:13px;color:var(--text3);margin:10px 0 20px">Get started — tap a button below to begin.</p>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:16px">
            <button onclick="navigate('finance')" class="btn-primary">+ Add Transaction</button>
            <button onclick="navigate('bank-tracker')" class="btn-secondary">Link Bank</button>
            <button onclick="navigate('budget')" class="btn-secondary">Set Budget</button>
          </div>
          <p style="font-size:10px;color:rgba(255,255,255,0.2);font-family:monospace">${err && err.message ? err.message : String(err)}</p>
        </div>
      </div>`;
  }
}

function switchDashTab(tabIdx) {
  _dashActiveTab = tabIdx;
  
  // Update button active state
  const tabs = document.querySelectorAll('.dash-tab');
  tabs.forEach(tab => {
    const dataTab = parseInt(tab.getAttribute('data-tab'), 10);
    if (dataTab === tabIdx) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Toggle card displays
  const card1 = document.getElementById('dash-heatmap-card');
  const card2 = document.getElementById('dash-mr-flow');
  const card3 = document.getElementById('dash-mr-wealth');
  const card4 = document.getElementById('dash-mr-health');
  const card5 = document.getElementById('dash-mr-stream');
  const bottomCards = document.getElementById('dash-bottom-cards');

  if (card1) card1.style.display = tabIdx === 1 ? 'block' : 'none';
  if (card2) card2.style.display = tabIdx === 2 ? 'block' : 'none';
  if (card3) card3.style.display = tabIdx === 3 ? 'block' : 'none';
  if (card4) card4.style.display = tabIdx === 4 ? 'block' : 'none';
  if (card5) card5.style.display = tabIdx === 5 ? 'block' : 'none';
  if (bottomCards) bottomCards.style.display = tabIdx === 1 ? 'none' : 'block';

  // Loading/swap animation: fade+rise the newly-shown card as the graph redraws
  const _active = [card1, card2, card3, card4, card5][tabIdx - 1];
  if (_active) { _active.classList.remove('dash-swap-in'); void _active.offsetWidth; _active.classList.add('dash-swap-in'); }

  // Redraw charts for the visible tab
  if (tabIdx === 1) {
    if (typeof renderHeatmap === 'function') {
      try { renderHeatmap(); } catch(e) { console.error('Error drawing dashboard heatmap:', e); }
    }
  } else {
    if (typeof _mrDrawCharts === 'function' && _dashFH && _dashFH.axes && _dashFH.axes.length > 0) {
      try { _mrDrawCharts(_dashFH, _dashStrm, _dashFlow); } catch(e) { console.error('Error drawing dashboard money rules charts:', e); }
    }
    if (typeof renderHomeWidgets === 'function') {
      try { renderHomeWidgets(); } catch(e) { console.error('Error rendering home widgets:', e); }
    }
  }
}

// Walk up from the touched element: if any ancestor can still scroll
// horizontally in the swipe direction, let it scroll instead of changing tab.
// dir < 0 = swipe left (content scrolls right); dir > 0 = swipe right.
function _dashCanScrollHoriz(el, dir) {
  while (el && el !== document.body && el.nodeType === 1) {
    if (el.scrollWidth - el.clientWidth > 4) {
      const max = el.scrollWidth - el.clientWidth;
      if (dir < 0 && el.scrollLeft < max - 2) return true;
      if (dir > 0 && el.scrollLeft > 2) return true;
    }
    el = el.parentElement;
  }
  return false;
}

// Bind the tab-swipe ONCE to the whole document so a left/right swipe works
// anywhere on the dashboard — over the graph card AND in the empty space below
// it (which lives outside #page-container). Guarded so it only acts on the
// dashboard page; passive so it never blocks scrolling or other gestures.
let _dashSwipeStartX = 0, _dashSwipeStartY = 0;
function initDashSwipe() {
  if (window.__dashSwipeBound) return;
  window.__dashSwipeBound = true;

  document.addEventListener('touchstart', (e) => {
    _dashSwipeStartX = e.changedTouches[0].clientX;
    _dashSwipeStartY = e.changedTouches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (typeof currentPage !== 'undefined' && currentPage !== 'dashboard') return;
    const ex = e.changedTouches[0].clientX, ey = e.changedTouches[0].clientY;
    const dx = ex - _dashSwipeStartX, dy = ey - _dashSwipeStartY;
    // Only a clear, big horizontal swipe
    if (Math.abs(dx) <= Math.abs(dy) * 1.3 || Math.abs(dx) <= 45) return;
    // Let a sideways-scrollable element (if any) scroll instead of switching tab
    const target = document.elementFromPoint(ex, ey);
    if (target && _dashCanScrollHoriz(target, dx)) return;
    if (dx < 0 && _dashActiveTab < 5) switchDashTab(_dashActiveTab + 1);
    else if (dx > 0 && _dashActiveTab > 1) switchDashTab(_dashActiveTab - 1);
    else return;
    const tabBtn = document.querySelector(`.dash-tab[data-tab="${_dashActiveTab}"]`);
    if (tabBtn) tabBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, { passive: true });
}




