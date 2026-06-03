let _dashPeriod = 'month';
let _dashAnchorDate = null; // null = today; 'YYYY-MM-DD' = specific anchor

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
  const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
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

// ===== AI INSIGHTS ENGINE =====
function generateInsights() {
  const txns = STATE.transactions || [];
  const now = new Date();
  const monthTxns = txns.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const income = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  const insights = [];

  if (income === 0 && txns.length === 0) {
    insights.push({ emoji: '👋', title: 'Welcome to LifeOS!', msg: 'Start by adding your income and expenses to unlock AI insights.' });
  } else {
    if (savRate >= 30) insights.push({ emoji: '🚀', title: 'Excellent Savings!', msg: `You're saving ${savRate.toFixed(1)}% of income this month. Outstanding!` });
    else if (savRate >= 10) insights.push({ emoji: '👍', title: 'Good Progress', msg: `${savRate.toFixed(1)}% savings rate. Push it above 30% for financial freedom.` });
    else if (income > 0) insights.push({ emoji: '⚠️', title: 'Low Savings Alert', msg: `Only ${savRate.toFixed(1)}% saved this month. Review discretionary expenses.` });

    const catMap = {};
    monthTxns.filter(t => t.type === 'expense').forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
    const topCat = Object.entries(catMap).sort(([, a], [, b]) => b - a)[0];
    if (topCat) insights.push({ emoji: '📊', title: `Top Spend: ${topCat[0]}`, msg: `₹${topCat[1].toLocaleString('en-IN')} on ${topCat[0]} this month.` });

    if (income - expense > 0) {
      const yearly = (income - expense) * 12;
      insights.push({ emoji: '🔮', title: 'Yearly Forecast', msg: `At this rate, you'll save ₹${yearly.toLocaleString('en-IN')} by year end.` });
    }
  }

  const streak = STATE.streak || 0;
  if (streak >= 7) insights.push({ emoji: '🔥', title: `${streak}-Day Streak!`, msg: 'Incredible consistency. You\'re building life-changing habits.' });

  const recentHealth = (STATE.healthEntries || []).slice(-3);
  if (recentHealth.length > 0) {
    const avgSleep = recentHealth.reduce((s, e) => s + (e.sleep || 7), 0) / recentHealth.length;
    if (avgSleep < 6) insights.push({ emoji: '😴', title: 'Sleep Deficit', msg: `Averaging ${avgSleep.toFixed(1)} hrs. Aim for 7-9 hours.` });
    else if (avgSleep >= 8) insights.push({ emoji: '✨', title: 'Excellent Sleep!', msg: `${avgSleep.toFixed(1)} hrs average — your recovery is optimal!` });
  }

  return insights.slice(0, 4);
}

// ── Sparkline SVG (no canvas needed) ──
function _sparklineSvg(data, w=80, h=26, color='#10b981') {
  if (!data || data.length < 2) return `<svg width="${w}" height="${h}"></svg>`;
  const max = Math.max(...data); const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v,i) => {
    const x = ((i/(data.length-1))*w).toFixed(1);
    const y = (h - 3 - (((v-min)/range)*(h-6))).toFixed(1);
    return `${x},${y}`;
  }).join(' ');
  const lx = w; const ly = (h - 3 - (((data[data.length-1]-min)/range)*(h-6))).toFixed(1);
  return `<svg width="${w}" height="${h}" style="overflow:visible;flex-shrink:0"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/><circle cx="${lx}" cy="${ly}" r="2.8" fill="${color}"/></svg>`;
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

// ── Rich KPI cards with sparklines + delta + alarm ──
function _buildKpiCards(totalIncome, totalExpense, netWorth, habits, doneToday) {
  // _incPeriod: for day/week views income is shown at month level
  const _incPeriod = (_dashPeriod === 'day' || _dashPeriod === 'week') ? 'month' : _dashPeriod;
  const curr = typeof _monthData==='function' ? _monthData(0) : null;
  const prev = typeof _monthData==='function' ? _monthData(-1) : null;
  const spark = key => Array.from({length:6},(_,i)=>{ const m=typeof _monthData==='function'?_monthData(i-5):null; return m?(key==='inc'?m.income:key==='exp'?m.expense:m.savings):0; });
  const delta = (c,p) => { if(!p) return null; const pct=((c-p)/Math.abs(p||1)*100); return {v:pct.toFixed(1),pos:pct>=0}; };

  const savRate = totalIncome>0?(netWorth/totalIncome*100):0;
  const incD = curr&&prev?delta(curr.income,prev.income):null;
  const expD = curr&&prev?delta(curr.expense,prev.expense):null;
  const savD = curr&&prev?delta(curr.savings,prev.savings):null;

  const card = ({label,value,sub,subColor,sparkData,sparkColor,page,accent,alarm,warn}) => `
    <div onclick="navigate('${page}')" style="cursor:pointer;padding:18px 16px;border-radius:14px;background:var(--glass);border:1px solid ${alarm?'rgba(239,68,68,0.45)':warn?'rgba(245,158,11,0.35)':'var(--glass-border)'};${alarm?'box-shadow:0 0 18px rgba(239,68,68,0.12);':''}transition:.2s" onmouseover="this.style.background='${accent}0d'" onmouseout="this.style.background='var(--glass)'">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <p style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;font-weight:700;margin:0">${alarm?'🚨 ':warn?'⚠️ ':''}${label}</p>
        ${sparkData?_sparklineSvg(sparkData,72,22,sparkColor):''}
      </div>
      <p style="font-size:24px;font-weight:900;color:${accent};line-height:1;margin:0 0 5px">${value}</p>
      <p style="font-size:11px;color:${subColor};font-weight:600;margin:0">${sub}</p>
      ${alarm?'<p style="font-size:10px;color:#ef4444;font-weight:700;margin-top:4px;letter-spacing:.5px">ACTION NEEDED</p>':''}
    </div>`;

  const _kpi = [
    card({label:'Income', value:fmt(totalIncome),
      sub: incD?`${incD.pos?'↑':'↓'} ${Math.abs(incD.v)}% vs last month`:periodLabel(_incPeriod),
      subColor: incD?(incD.pos?'#10b981':'#ef4444'):'var(--text3)',
      sparkData:spark('inc'), sparkColor:'#10b981', page:'finance', accent:'#10b981', alarm:false, warn:false}),
    card({label:'Expenses', value:fmt(totalExpense),
      sub: expD?`${expD.pos?'↑':'↓'} ${Math.abs(expD.v)}% vs last month`:`${periodLabel(_dashPeriod)}`,
      subColor: expD?(expD.pos?'#ef4444':'#10b981'):'var(--text3)',
      sparkData:spark('exp'), sparkColor:'#ef4444', page:'finance', accent:'#ef4444',
      alarm: expD&&parseFloat(expD.v)>25, warn: expD&&parseFloat(expD.v)>10&&parseFloat(expD.v)<=25}),
    card({label:'Net Savings', value:`${netWorth<0?'-':''}${fmt(Math.abs(netWorth))}`,
      sub: savD?`${savD.pos?'↑':'↓'} ${Math.abs(savD.v)}% vs last month`:`${savRate.toFixed(1)}% of income`,
      subColor: savRate<0?'#ef4444':savRate<10?'#f59e0b':'#10b981',
      sparkData:spark('sav'), sparkColor:savRate<0?'#ef4444':'#00c9a7', page:'analytics',
      accent:savRate<0?'#ef4444':savRate<10?'#f59e0b':'#00c9a7',
      alarm:savRate<0, warn:savRate>=0&&savRate<10}),
  ];
  if (window.__IS_APP) {
    // App: 4th card = Net Worth (Bank + Cash − Cards) → makes a 2×2 grid
    const _bankT = (STATE.bankAccounts||[]).reduce((s,b)=>s+(b.balance||0),0);
    const _cashT = (STATE.cashAccounts||[]).reduce((s,c)=>s+(c.balance||0),0);
    const _cardT = (STATE.creditCards||[]).reduce((s,c)=>s+(c.outstanding||0),0);
    const _nw = _bankT + _cashT - _cardT;
    _kpi.push(card({label:'Net Worth', value:`${_nw<0?'-':''}${fmt(Math.abs(_nw))}`,
      sub:'Bank + Cash − Cards', subColor:'var(--text3)',
      sparkData:null, sparkColor:'#00c9a7', page:'finance', accent:_nw<0?'#ef4444':'#00c9a7', alarm:false, warn:false}));
  } else {
    _kpi.push(card({label:'Habits Today', value:habits.length>0?`${doneToday}/${habits.length}`:'—',
      sub:habits.length>0?`${Math.round(doneToday/habits.length*100)}% done today`:'Add habits to track',
      subColor:habits.length>0&&doneToday===habits.length?'#10b981':'var(--text3)',
      sparkData:null, sparkColor:'#f59e0b', page:'habits', accent:'#f59e0b', alarm:false, warn:false}));
  }
  return _kpi.join('');
}

// Bank balances · credit cards · goals · budget — colorful chart overview
const DASH_PALETTE = ['#6366f1','#10b981','#f59e0b','#ec4899','#8b5cf6','#3b82f6','#00c9a7','#ef4444','#f97316','#14b8a6'];

function _buildAccountsGoalsBudget() {
  const banks   = STATE.bankAccounts || [];
  const cards   = STATE.creditCards  || [];
  const cash    = STATE.cashAccounts || [];
  const goals   = STATE.goals        || [];
  const budgets = STATE.budgets      || [];
  const totalBank  = banks.reduce((s,b)=>s+(b.balance||0),0);
  const totalOut   = cards.reduce((s,c)=>s+(c.outstanding||0),0);
  const totalLimit = cards.reduce((s,c)=>s+(c.limit||0),0);
  const totalCash  = cash.reduce((s,c)=>s+(c.balance||0),0);
  const overallUtil = totalLimit>0?Math.round(totalOut/totalLimit*100):0;

  const empty = (txt) => `<p style="font-size:12px;color:var(--text3);padding:18px 0;text-align:center">${txt}</p>`;
  const wrap  = (inner) => `<div style="display:flex;flex-direction:column;gap:12px;max-height:230px;overflow-y:auto;padding-right:2px">${inner}</div>`;

  // 🏦 Bank balances → doughnut + colored legend
  const posBanks = banks.filter(b=>(b.balance||0)>0);
  const bankLegend = posBanks.map((b,i)=>`
    <div style="display:flex;align-items:center;gap:7px;font-size:11px">
      <span style="width:10px;height:10px;border-radius:3px;background:${DASH_PALETTE[i%DASH_PALETTE.length]};flex-shrink:0;box-shadow:0 0 6px ${DASH_PALETTE[i%DASH_PALETTE.length]}88"></span>
      <span style="color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b.bankName}</span>
      <span style="color:var(--text);margin-left:auto;font-weight:700">${fmt(b.balance||0)}</span>
    </div>`).join('');
  const banksCard = `
    <div class="glass-card" style="padding:18px;cursor:pointer" onclick="navigate('bank-tracker')" onmouseover="this.style.borderColor='rgba(0,201,167,0.4)'" onmouseout="this.style.borderColor=''">
      <div class="section-header" style="margin-bottom:12px">
        <p class="section-title">🏦 Bank Balances</p>
        <span style="font-size:14px;font-weight:800;color:var(--teal)">${fmt(totalBank)}</span>
      </div>
      ${posBanks.length===0 ? empty('No bank balances yet') : `
      <div style="display:grid;grid-template-columns:140px 1fr;gap:16px;align-items:center">
        <div style="position:relative;height:140px">
          <canvas id="dash-bank-chart"></canvas>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none">
            <span style="font-size:8px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;font-weight:700">Total</span>
            <span style="font-size:13px;font-weight:900;color:#fff">${fmt(totalBank)}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:9px;max-height:150px;overflow-y:auto">${bankLegend}</div>
      </div>`}
    </div>`;

  // 📊 Budget → grouped bar chart (spent vs limit)
  const budgetCard = `
    <div class="glass-card" style="padding:18px;cursor:pointer" onclick="navigate('budget')" onmouseover="this.style.borderColor='rgba(245,158,11,0.4)'" onmouseout="this.style.borderColor=''">
      <div class="section-header" style="margin-bottom:12px">
        <p class="section-title">📊 Budget — ${new Date().toLocaleString('default',{month:'short'})}</p>
        <span style="font-size:11px;color:var(--text3)">spent vs limit</span>
      </div>
      ${budgets.length===0 ? empty('No budgets set') : `<div style="height:${Math.max(170, Math.min(8,budgets.length)*36)}px;position:relative"><canvas id="dash-budget-chart"></canvas></div>`}
    </div>`;

  // 💳 Credit cards → vivid gradient utilisation bars
  const cardsCard = `
    <div class="glass-card" style="padding:18px;cursor:pointer" onclick="bankTrackerTab='cards';navigate('bank-tracker')" onmouseover="this.style.borderColor='rgba(239,68,68,0.4)'" onmouseout="this.style.borderColor=''">
      <div class="section-header" style="margin-bottom:12px">
        <p class="section-title">💳 Credit Cards</p>
        <span style="font-size:12px;font-weight:700;color:#ef4444">${fmt(totalOut)} / ${fmt(totalLimit)} · ${overallUtil}%</span>
      </div>
      ${cards.length===0 ? empty('No credit cards yet') : wrap(cards.map(c=>{
        const used=c.outstanding||0, lim=c.limit||1, pct=Math.min(100,Math.round(used/lim*100));
        const uc=pct>80?'#ef4444':pct>50?'#f59e0b':'#10b981';
        const grad=pct>80?'linear-gradient(90deg,#f59e0b,#ef4444)':pct>50?'linear-gradient(90deg,#10b981,#f59e0b)':'linear-gradient(90deg,#00c9a7,#10b981)';
        return `<div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px">
            <span style="font-weight:600">💳 ${c.bankName}</span>
            <span style="color:var(--text3)">${fmt(used)} / ${fmt(c.limit||0)} · <b style="color:${uc}">${pct}%</b></span>
          </div>
          <div style="height:9px;border-radius:6px;background:rgba(255,255,255,0.07);overflow:hidden"><div style="height:9px;border-radius:6px;width:${pct}%;background:${grad};box-shadow:0 0 10px ${uc}77;transition:.5s"></div></div>
        </div>`;
      }).join(''))}
    </div>`;

  // 🎯 Goals → gradient progress bars
  const goalsDone = goals.filter(g=>g.current>=g.target).length;
  const goalsCard = `
    <div class="glass-card" style="padding:18px;cursor:pointer" onclick="navigate('goals')" onmouseover="this.style.borderColor='rgba(139,92,246,0.4)'" onmouseout="this.style.borderColor=''">
      <div class="section-header" style="margin-bottom:12px">
        <p class="section-title">🎯 Goals</p>
        <span style="font-size:12px;color:var(--text3)">${goalsDone}/${goals.length} done</span>
      </div>
      ${goals.length===0 ? empty('No goals yet') : wrap(goals.slice(0,6).map(g=>{
        const pct=g.target>0?Math.min(100,Math.round(g.current/g.target*100)):0;
        const done=g.current>=g.target;
        const grad=done?'linear-gradient(90deg,#10b981,#00c9a7)':'linear-gradient(90deg,#8b5cf6,#6366f1,#3b82f6)';
        const glow=done?'#10b98177':'#8b5cf677';
        return `<div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px">
            <span style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:170px">${g.emoji||'🎯'} ${g.name}</span>
            <span style="color:${done?'#10b981':'#a5b4fc'};font-weight:700">${pct}%</span>
          </div>
          <div style="height:9px;border-radius:6px;background:rgba(255,255,255,0.07);overflow:hidden"><div style="height:9px;border-radius:6px;width:${pct}%;background:${grad};box-shadow:0 0 10px ${glow};transition:.5s"></div></div>
        </div>`;
      }).join(''))}
    </div>`;

  // 💵 Cash wallets card
  const cashCard = `
    <div class="glass-card" style="padding:18px;cursor:pointer" onclick="bankTrackerTab='cash';navigate('bank-tracker')" onmouseover="this.style.borderColor='rgba(245,158,11,0.4)'" onmouseout="this.style.borderColor=''">
      <div class="section-header" style="margin-bottom:12px">
        <p class="section-title">💵 Cash Wallets</p>
        <span style="font-size:14px;font-weight:800;color:#f59e0b">${fmt(totalCash)}</span>
      </div>
      ${cash.length===0 ? empty('No cash wallets yet') : wrap(cash.map(c=>`
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px">
          <span style="font-weight:600">💵 ${c.name}</span>
          <span style="color:#f59e0b;font-weight:700">${fmt(c.balance||0)}</span>
        </div>`).join(''))}
    </div>`;

  const hasAccts = banks.length + cash.length + cards.length > 0;
  const netW = totalBank + totalCash - totalOut;

  // helper: unified hover card wrapper
  const cardWrap = (accent, onclick, inner) =>
    `<div onclick="${onclick}" style="background:var(--card-bg);border:1px solid var(--glass-border);border-radius:20px;padding:20px;cursor:pointer;transition:all .2s"
      onmouseover="this.style.borderColor='${accent}55';this.style.transform='translateY(-2px)';this.style.boxShadow='0 12px 36px ${accent}1a'"
      onmouseout="this.style.borderColor='';this.style.transform='';this.style.boxShadow=''">${inner}</div>`;

  // card header: icon badge + label + big value + "tap →"
  const cardHead = (icon, label, value, vc, sub) =>
    `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
       <div style="display:flex;align-items:center;gap:10px">
         <div style="width:38px;height:38px;border-radius:11px;background:${vc}22;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${icon}</div>
         <div>
           <p style="font-size:12px;font-weight:700;color:var(--text2)">${label}</p>
           <p style="font-size:10px;color:var(--text3);margin-top:1px">${sub}</p>
         </div>
       </div>
       <div style="text-align:right">
         <p style="font-size:17px;font-weight:900;color:${vc};letter-spacing:-0.5px">${value}</p>
         <p style="font-size:10px;color:var(--text3);margin-top:1px">tap to open ↗</p>
       </div>
     </div>`;

  // ── NET WORTH VISUAL CARD ──────────────────────────────────────────
  const nwBar = hasAccts ? (() => {
    const total = (totalBank + totalCash + totalOut) || 1;
    const bPct  = Math.max(1, Math.round((totalBank / total) * 100));
    const cPct  = Math.max(1, Math.round((totalCash / total) * 100));
    const dPct  = Math.max(1, Math.round((totalOut  / total) * 100));
    return `
    <div onclick="navigate('finance')" class="dash-nw-bar" style="background:linear-gradient(135deg,rgba(0,201,167,0.07),rgba(99,102,241,0.05));border:1px solid rgba(0,201,167,0.18);border-radius:20px;padding:18px 20px;margin-bottom:14px;cursor:pointer;transition:all .2s"
      onmouseover="this.style.borderColor='rgba(0,201,167,0.4)';this.style.transform='translateY(-1px)'" onmouseout="this.style.borderColor='rgba(0,201,167,0.18)';this.style.transform=''">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(0,201,167,0.15);display:flex;align-items:center;justify-content:center;font-size:17px">💼</div>
          <div>
            <p style="font-size:12px;font-weight:700;color:var(--text2)">Financial Net Worth</p>
            <p style="font-size:10px;color:var(--text3)">Bank + Cash − Debt · tap to view Finance ↗</p>
          </div>
        </div>
        <span style="font-size:26px;font-weight:900;color:${netW>=0?'#00c9a7':'#ef4444'};letter-spacing:-1px">${netW>=0?'+':''}${fmt(netW)}</span>
      </div>
      <div style="display:flex;height:10px;border-radius:10px;overflow:hidden;gap:3px;margin-bottom:12px">
        ${bPct>0?`<div style="flex:${bPct};background:linear-gradient(90deg,#00c9a7,#0acf83);border-radius:10px;box-shadow:0 0 8px rgba(0,201,167,0.5)"></div>`:''}
        ${cPct>0?`<div style="flex:${cPct};background:linear-gradient(90deg,#f59e0b,#fbbf24);border-radius:10px;box-shadow:0 0 8px rgba(245,158,11,0.5)"></div>`:''}
        ${dPct>0?`<div style="flex:${dPct};background:linear-gradient(90deg,#ef4444,#f87171);border-radius:10px;opacity:.75"></div>`:''}
      </div>
      <div style="display:flex;gap:20px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="width:9px;height:9px;border-radius:50%;background:#00c9a7;flex-shrink:0;box-shadow:0 0 5px rgba(0,201,167,0.7)"></span>
          <span style="font-size:11px;color:var(--text3)">Banks</span>
          <span style="font-size:12px;font-weight:700;color:#00c9a7">${fmt(totalBank)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="width:9px;height:9px;border-radius:50%;background:#f59e0b;flex-shrink:0;box-shadow:0 0 5px rgba(245,158,11,0.7)"></span>
          <span style="font-size:11px;color:var(--text3)">Cash</span>
          <span style="font-size:12px;font-weight:700;color:#f59e0b">${fmt(totalCash)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="width:9px;height:9px;border-radius:50%;background:#ef4444;flex-shrink:0;box-shadow:0 0 5px rgba(239,68,68,0.6)"></span>
          <span style="font-size:11px;color:var(--text3)">Debt</span>
          <span style="font-size:12px;font-weight:700;color:#ef4444">−${fmt(totalOut)}</span>
        </div>
      </div>
    </div>`;
  })() : '';

  // ── BANK card ─────────────────────────────────────────────────────
  const posBanks2 = banks.filter(b=>(b.balance||0)>0);
  const bankBody  = posBanks2.length===0
    ? `<div style="display:flex;flex-direction:column;align-items:center;padding:16px 0;gap:5px;opacity:.5"><span style="font-size:28px">🏦</span><p style="font-size:11px;color:var(--text3)">No bank accounts yet</p></div>`
    : `<div style="display:grid;grid-template-columns:120px 1fr;gap:14px;align-items:center">
         <div style="position:relative;height:120px">
           <canvas id="dash-bank-chart"></canvas>
           <div class="bank-donut-center" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none">
             <span style="font-size:8px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;font-weight:700">Total</span>
             <span style="font-size:12px;font-weight:900;color:#fff">${fmt(totalBank)}</span>
           </div>
         </div>
         <div style="display:flex;flex-direction:column;gap:7px;max-height:120px;overflow-y:auto">
           ${posBanks2.map((b,i)=>`
           <div style="display:flex;align-items:center;gap:7px">
             <span style="width:7px;height:7px;border-radius:50%;background:${DASH_PALETTE[i%DASH_PALETTE.length]};flex-shrink:0;box-shadow:0 0 5px ${DASH_PALETTE[i%DASH_PALETTE.length]}99"></span>
             <span style="font-size:11px;color:var(--text2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.bankName}</span>
             <span style="font-size:11px;font-weight:700;color:var(--text)">${fmt(b.balance||0)}</span>
           </div>`).join('')}
         </div>
       </div>`;
  const newBanksCard = cardWrap('#00c9a7',"navigate('bank-tracker')",
    cardHead('🏦','Bank Balances',fmt(totalBank),'#00c9a7',`${banks.length} account${banks.length!==1?'s':''}`) + bankBody);

  // ── CASH card ─────────────────────────────────────────────────────
  const cashBody = cash.length===0
    ? `<div style="display:flex;flex-direction:column;align-items:center;padding:16px 0;gap:5px;opacity:.5"><span style="font-size:28px">💵</span><p style="font-size:11px;color:var(--text3)">No cash wallets yet</p></div>`
    : `<div style="display:flex;flex-direction:column;gap:9px;max-height:130px;overflow-y:auto">
        ${cash.map(c=>{
          const pct=totalCash>0?Math.round(((c.balance||0)/totalCash)*100):0;
          return `<div>
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
              <span style="font-weight:600">💵 ${c.name}</span>
              <span style="color:#f59e0b;font-weight:700">${fmt(c.balance||0)}</span>
            </div>
            <div style="height:6px;border-radius:6px;background:rgba(255,255,255,0.07)"><div style="height:6px;border-radius:6px;width:${pct}%;background:linear-gradient(90deg,#f59e0b,#fbbf24);box-shadow:0 0 7px rgba(245,158,11,0.5);transition:.5s"></div></div>
          </div>`;
        }).join('')}
      </div>`;
  const newCashCard = cardWrap('#f59e0b',"bankTrackerTab='cash';navigate('bank-tracker')",
    cardHead('💵','Cash Wallets',fmt(totalCash),'#f59e0b',`${cash.length} wallet${cash.length!==1?'s':''}`) + cashBody);

  // ── CARDS card ────────────────────────────────────────────────────
  const utilC = overallUtil>80?'#ef4444':overallUtil>50?'#f59e0b':'#10b981';
  const cardsBody = cards.length===0
    ? `<div style="display:flex;flex-direction:column;align-items:center;padding:16px 0;gap:5px;opacity:.5"><span style="font-size:28px">💳</span><p style="font-size:11px;color:var(--text3)">No credit cards yet</p></div>`
    : `<div style="display:flex;flex-direction:column;gap:9px;max-height:130px;overflow-y:auto">
        ${cards.map(c=>{
          const used=c.outstanding||0,lim=c.limit||1,pct=Math.min(100,Math.round(used/lim*100));
          const uc=pct>80?'#ef4444':pct>50?'#f59e0b':'#10b981';
          const grad=pct>80?'linear-gradient(90deg,#f59e0b,#ef4444)':pct>50?'linear-gradient(90deg,#10b981,#f59e0b)':'linear-gradient(90deg,#00c9a7,#10b981)';
          return `<div>
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
              <span style="font-weight:600">💳 ${c.bankName}</span>
              <span style="color:var(--text3)">${fmt(used)}/${fmt(c.limit||0)} <b style="color:${uc}"> · ${pct}%</b></span>
            </div>
            <div style="height:6px;border-radius:6px;background:rgba(255,255,255,0.07)"><div style="height:6px;border-radius:6px;width:${pct}%;background:${grad};box-shadow:0 0 7px ${uc}66;transition:.5s"></div></div>
          </div>`;
        }).join('')}
      </div>`;
  const newCardsCard = cardWrap('#ef4444',"bankTrackerTab='cards';navigate('bank-tracker')",
    cardHead('💳','Credit Cards',fmt(totalOut),'#ef4444',`${overallUtil}% of ${fmt(totalLimit)} limit`) + cardsBody);

  // ── BUDGET card ───────────────────────────────────────────────────
  const mon = new Date().toLocaleString('default',{month:'long'});
  const budgetBody = budgets.length===0
    ? `<div style="display:flex;flex-direction:column;align-items:center;padding:16px 0;gap:5px;opacity:.5"><span style="font-size:28px">📊</span><p style="font-size:11px;color:var(--text3)">No budgets set yet</p></div>`
    : `<div style="height:${Math.max(160,Math.min(8,budgets.length)*34)}px;position:relative"><canvas id="dash-budget-chart"></canvas></div>`;
  const newBudgetCard = cardWrap('#f59e0b',"navigate('budget')",
    cardHead('📊','Budget',mon,'#f59e0b','spent vs limit this month') + budgetBody);

  // ── GOALS card ────────────────────────────────────────────────────
  const goalsDone2 = goals.filter(g=>g.current>=g.target).length;
  const goalsBody  = goals.length===0
    ? `<div style="display:flex;flex-direction:column;align-items:center;padding:16px 0;gap:5px;opacity:.5"><span style="font-size:28px">🎯</span><p style="font-size:11px;color:var(--text3)">No goals yet</p></div>`
    : `<div style="display:flex;flex-direction:column;gap:9px;max-height:200px;overflow-y:auto">
        ${goals.slice(0,6).map(g=>{
          const pct=g.target>0?Math.min(100,Math.round(g.current/g.target*100)):0;
          const done=g.current>=g.target;
          const grad=done?'linear-gradient(90deg,#10b981,#00c9a7)':'linear-gradient(90deg,#8b5cf6,#6366f1,#3b82f6)';
          const glow=done?'rgba(16,185,129,0.5)':'rgba(139,92,246,0.4)';
          return `<div>
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
              <span style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:170px">${g.emoji||'🎯'} ${g.name}</span>
              <span style="color:${done?'#10b981':'#a5b4fc'};font-weight:700;flex-shrink:0;margin-left:6px">${pct}%</span>
            </div>
            <div style="height:7px;border-radius:6px;background:rgba(255,255,255,0.07)"><div style="height:7px;border-radius:6px;width:${pct}%;background:${grad};box-shadow:0 0 8px ${glow};transition:.5s"></div></div>
          </div>`;
        }).join('')}
      </div>`;
  const newGoalsCard = cardWrap('#8b5cf6',"navigate('goals')",
    cardHead('🎯','Goals',`${goalsDone2}/${goals.length}`,'#8b5cf6',`${goals.length-goalsDone2} in progress`) + goalsBody);

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin:8px 0 14px;padding-bottom:12px;border-bottom:1px solid var(--glass-border);flex-wrap:wrap;gap:8px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:18px">💼</span>
        <h2 style="font-size:15px;font-weight:800;color:var(--text)">Financial Overview</h2>
      </div>
      <div style="display:flex;gap:8px">
        <button onclick="navigate('bank-tracker')" style="font-size:11px;padding:5px 12px;border-radius:9px;background:rgba(0,201,167,0.1);border:1px solid rgba(0,201,167,0.25);color:#00c9a7;cursor:pointer;font-weight:700;transition:.2s" onmouseover="this.style.background='rgba(0,201,167,0.2)'" onmouseout="this.style.background='rgba(0,201,167,0.1)'">Bank Tracker ↗</button>
        <button onclick="navigate('finance')" style="font-size:11px;padding:5px 12px;border-radius:9px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.25);color:#818cf8;cursor:pointer;font-weight:700;transition:.2s" onmouseover="this.style.background='rgba(99,102,241,0.2)'" onmouseout="this.style.background='rgba(99,102,241,0.1)'">Finance ↗</button>
      </div>
    </div>
    ${nwBar}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:14px" class="dash-acct-grid">
      ${newBanksCard}${newCashCard}${newCardsCard}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px" class="dash-bg-grid">
      ${newBudgetCard}${newGoalsCard}
    </div>`;
}

// Doughnut of bank balances per bank
function renderDashBankChart() {
  const canvas = document.getElementById('dash-bank-chart');
  if (!canvas || typeof Chart === 'undefined') return;
  const banks = (STATE.bankAccounts||[]).filter(b => (b.balance||0) > 0);
  if (!banks.length) return;
  chartInstances['dash-bank'] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: banks.map(b=>b.bankName),
      datasets: [{
        data: banks.map(b=>b.balance||0),
        backgroundColor: banks.map((_,i)=>DASH_PALETTE[i%DASH_PALETTE.length]),
        borderColor: 'rgba(10,10,30,0.6)', borderWidth: 2
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '64%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ₹${ctx.parsed.toLocaleString('en-IN',{maximumFractionDigits:0})}` } }
      }
    }
  });
}

// Grouped horizontal bar: spent vs limit per budget category (this month)
function renderDashBudgetChart() {
  const canvas = document.getElementById('dash-budget-chart');
  if (!canvas || typeof Chart === 'undefined') return;
  const budgets = (STATE.budgets||[]).slice(0,8);
  if (!budgets.length) return;
  const monthExp = filterTxByPeriod(STATE.transactions||[], 'month').filter(t=>t.type==='expense');
  const spentByCat = {};
  monthExp.forEach(t => { const k=(t.category||'').toLowerCase().trim(); spentByCat[k]=(spentByCat[k]||0)+t.amount; });
  const limits = budgets.map(b => b.amount!=null?b.amount:(b.limit||0));
  const spents = budgets.map(b => spentByCat[(b.category||'').toLowerCase().trim()]||0);
  const isLight = document.body.classList.contains('light');
  const labelC  = isLight ? '#374151' : '#cbd5e1';
  const xTickC  = isLight ? '#6b7280' : '#64748b';
  const gridC   = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
  const limitBg = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.14)';
  chartInstances['dash-budget'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: budgets.map(b=>b.category),
      datasets: [
        { label:'Spent', data:spents, borderRadius:5, barPercentage:0.8, categoryPercentage:0.7,
          backgroundColor: spents.map((s,i)=> s>limits[i]?'#ef4444' : s>limits[i]*0.8?'#f59e0b':'#10b981') },
        { label:'Limit', data:limits, borderRadius:5, barPercentage:0.8, categoryPercentage:0.7,
          backgroundColor: limitBg }
      ]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display:true, position:'top', labels:{ color: labelC, font:{size:10}, boxWidth:10, padding:8 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ₹${ctx.parsed.x.toLocaleString('en-IN',{maximumFractionDigits:0})}` } }
      },
      scales: {
        x: { ticks:{ color: xTickC, font:{size:10}, callback:v=>'₹'+(Math.abs(v)>=1000?(v/1000).toFixed(0)+'k':v) }, grid:{ color: gridC } },
        y: { ticks:{ color: labelC, font:{size:11,weight:'600'} }, grid:{ display:false } }
      }
    }
  });
}

// ===== DASHBOARD =====
function renderDashboard() {
  try {
  const scores = calcLifeScore();
  const txnsAll = STATE.transactions || [];
  const txns = filterTxByAnchor(txnsAll, _dashPeriod, _dashAnchorDate);
  const recent = [...txns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  // For day/week views income (salary) is monthly — fall back to the anchor's month.
  const _incPeriod = (_dashPeriod === 'day' || _dashPeriod === 'week') ? 'month' : _dashPeriod;
  const incomeTxns = _incPeriod === _dashPeriod ? txns : filterTxByAnchor(txnsAll, _incPeriod, _dashAnchorDate);
  const totalIncome = incomeTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
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

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <!-- Header -->
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:20px">
        <div>
          <h1 class="page-title">${window.__IS_APP ? 'Home' : 'Dashboard'}</h1>
          <p class="page-subtitle">${getGreeting(STATE.settings?.name || 'there')}</p>
          <p style="font-size:12px;color:rgba(241,245,249,0.4);margin-top:2px">${new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
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

      <!-- ── Quick Actions (always visible) ───────────────────────── -->
      <div class="glass-card" style="padding:20px;margin-bottom:20px;border:1px solid rgba(0,201,167,0.2);background:linear-gradient(135deg,rgba(0,201,167,0.06),rgba(99,102,241,0.06))">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#00c9a7,#6366f1);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">⚡</div>
          <div>
            <p style="font-size:15px;font-weight:800;color:var(--text);margin-bottom:1px">Quick Actions</p>
            <p style="font-size:11px;color:var(--text3)">Jump to any section instantly</p>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px" class="welcome-grid">
          ${[
            {icon:'💰', title:'Add Income',    sub:'Log income & salary',        fn:"openAddTxModal('income')",  c:'#10b981', bg:'rgba(16,185,129,0.1)',  bc:'rgba(16,185,129,0.25)'},
            {icon:'💸', title:'Add Expense',   sub:'Track your spending',        fn:"openAddTxModal('expense')", c:'#ef4444', bg:'rgba(239,68,68,0.1)',   bc:'rgba(239,68,68,0.25)'},
            {icon:'🏦', title:'Link Bank',     sub:'Add a bank account',         fn:"navigate('bank-tracker')",  c:'#3b82f6', bg:'rgba(59,130,246,0.1)',  bc:'rgba(59,130,246,0.25)'},
            {icon:'🎯', title:'Set Budget',    sub:'Plan monthly spend',         fn:"navigate('budget')",        c:'#f59e0b', bg:'rgba(245,158,11,0.1)',  bc:'rgba(245,158,11,0.25)'},
            {icon:'📈', title:'Add Asset',     sub:'Track investments & wealth', fn:"navigate('investments')",   c:'#8b5cf6', bg:'rgba(139,92,246,0.1)',  bc:'rgba(139,92,246,0.25)'},
            {icon:'✅', title:'Add Habit',     sub:'Build daily routines',       fn:"openAddHabitModal()",       c:'#00c9a7', bg:'rgba(0,201,167,0.1)',   bc:'rgba(0,201,167,0.25)'},
            {icon:'🎯', title:'Add Goal',      sub:'Set a savings goal',         fn:"openAddGoalModal()",        c:'#a78bfa', bg:'rgba(167,139,250,0.1)', bc:'rgba(167,139,250,0.25)'},
            {icon:'📝', title:'Write Journal', sub:'Record your emotions',       fn:"navigate('journal')",       c:'#60a5fa', bg:'rgba(96,165,250,0.1)',  bc:'rgba(96,165,250,0.25)'},
          ].map(a=>`
            <div onclick="${a.fn}" style="display:flex;align-items:center;gap:9px;padding:11px 12px;border-radius:12px;background:${a.bg};border:1px solid ${a.bc};cursor:pointer;transition:.2s"
              onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 14px ${a.bc}'" onmouseout="this.style.transform='';this.style.boxShadow=''">
              <span style="font-size:20px;flex-shrink:0">${a.icon}</span>
              <div style="min-width:0">
                <p style="font-size:12px;font-weight:700;color:${a.c};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.title}</p>
                <p style="font-size:10px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.sub}</p>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Hero Card — teal gradient -->
      <div class="hero-card" style="margin-bottom:20px;cursor:pointer;background:linear-gradient(135deg,#00b09b 0%,#0acf83 50%,#00c9a7 100%)" onclick="navigate('finance')">
        <div class="hero-orb" style="background:rgba(255,255,255,0.15)"></div>
        <p class="hero-label" style="color:rgba(0,40,30,0.7)">NET WORTH <span style="font-size:11px;opacity:0.6;margin-left:8px">tap to view →</span></p>
        <p class="hero-value" style="color:#003d2e">${fmt(netWorth)}</p>
        <div class="hero-sub">
          <div class="hero-sub-item" onclick="event.stopPropagation();navigate('finance')" style="cursor:pointer;padding:6px 10px;border-radius:10px;transition:.2s;background:rgba(0,0,0,0.08)" onmouseover="this.style.background='rgba(0,0,0,0.15)'" onmouseout="this.style.background='rgba(0,0,0,0.08)'">
            <label style="cursor:pointer;color:rgba(0,40,30,0.65)">Income</label>
            <span style="color:#003d2e;font-weight:800">+${fmt(totalIncome)}</span>
          </div>
          <div class="hero-sub-item" onclick="event.stopPropagation();navigate('finance')" style="cursor:pointer;padding:6px 10px;border-radius:10px;transition:.2s;background:rgba(0,0,0,0.08)" onmouseover="this.style.background='rgba(0,0,0,0.15)'" onmouseout="this.style.background='rgba(0,0,0,0.08)'">
            <label style="cursor:pointer;color:rgba(0,40,30,0.65)">Expenses</label>
            <span style="color:#c0392b;font-weight:800">-${fmt(totalExpense)}</span>
          </div>
          <div class="hero-sub-item" onclick="event.stopPropagation();navigate('analytics')" style="cursor:pointer;padding:6px 10px;border-radius:10px;transition:.2s;background:rgba(0,0,0,0.08)" onmouseover="this.style.background='rgba(0,0,0,0.15)'" onmouseout="this.style.background='rgba(0,0,0,0.08)'">
            <label style="cursor:pointer;color:rgba(0,40,30,0.65)">Life Score</label>
            <span style="color:#003d2e;font-weight:800">${scores.overall}/100</span>
          </div>
        </div>
      </div>

      <!-- KPI Cards with sparklines + delta + alarm states -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px" class="kpi-grid">
        ${_buildKpiCards(totalIncome, totalExpense, netWorth, habits, doneToday)}
      </div>

      <!-- ── Financial Overview + Spending side-by-side ─────────────── -->
      <div class="glass-card" id="dash-fin-overview" style="padding:22px;margin-bottom:20px">
        <!-- Header row -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div>
            <p class="section-title" style="margin-bottom:2px">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00c9a7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:6px"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>Financial Overview
            </p>
            <p style="font-size:11px;color:var(--text3);margin-top:2px">Last 12 months · Income · Expense · Savings · Net Worth</p>
          </div>
          <button class="btn-icon btn-sm" onclick="navigate('finance')" style="color:var(--teal);border-color:rgba(0,201,167,0.3)">View All →</button>
        </div>

        <!-- Two-column: chart | spending list -->
        <div style="display:grid;grid-template-columns:1fr 220px;gap:20px;align-items:start" class="fin-overview-grid">

          <!-- Chart -->
          <div style="height:240px;position:relative">
            <canvas id="dash-combined-chart"></canvas>
          </div>

          <!-- Spending by Category — compact list -->
          <div>
            <p style="font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--text3);margin-bottom:10px">Top Spending</p>
            <div id="dash-pie-chart" style="display:flex;flex-direction:column;gap:6px"></div>
          </div>

        </div>
      </div>

      <!-- Accounts · Cards · Goals · Budget -->
      ${_buildAccountsGoalsBudget()}

      <!-- Recent Transactions -->
      <div class="glass-card" id="dash-recent-tx" style="overflow:hidden">
        <div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center">
          <p class="section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:6px"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>Recent Transactions</p>
          <button class="btn-secondary btn-sm" onclick="navigate('finance')">View All →</button>
        </div>
        ${recent.length === 0
          ? `<div class="empty-state"><span class="empty-state-icon">💸</span><p>No transactions yet. <span onclick="navigate('finance')" style="color:#00c9a7;cursor:pointer;text-decoration:underline">Add one now →</span></p></div>`
          : recent.map(tx => `
            <div class="tx-row" onclick="navigate('finance')" style="display:flex;align-items:center;justify-content:space-between;padding:13px 20px;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer;transition:.15s" onmouseover="this.style.background='rgba(0,201,167,0.04)'" onmouseout="this.style.background=''">
              <div style="display:flex;align-items:center;gap:12px">
                <div class="tx-ic" style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:${tx.type==='income'?'rgba(0,201,167,0.15)':'rgba(239,68,68,0.15)'};font-size:18px;flex-shrink:0">${tx.icon||(tx.type==='income'?'💚':'❤️')}</div>
                <div>
                  <p style="font-size:13px;font-weight:600">${tx.description||tx.category}</p>
                  <p style="font-size:11px;color:var(--text3)">${tx.category} · ${fmtDate(tx.date)}</p>
                </div>
              </div>
              <span style="font-weight:700;font-size:14px;color:${tx.type==='income'?'#00c9a7':'#ef4444'}">${tx.type==='income'?'+':'-'}${fmt(tx.amount)}</span>
            </div>`).join('')}
      </div>

      <!-- ═══ ANALYTICS SECTION ═══ -->
      <div id="dash-life-analytics" style="margin-top:8px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--glass-border)">
          <span style="font-size:16px">📊</span>
          <h2 style="font-size:16px;font-weight:800;color:var(--text)">Life Analytics</h2>
          <span style="font-size:11px;color:var(--text3);margin-left:4px">— all insights in one place</span>
        </div>

        <!-- Analytics Stats -->
        <div class="stat-grid" style="margin-bottom:20px">
          <div class="stat-card bg-indigo" onclick="navigate('finance')" style="cursor:pointer">
            <span class="stat-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></span>
            <div class="stat-card-value">${txns.length}</div><div class="stat-card-label">${periodLabel(_dashPeriod)} Txns</div>
          </div>
          <div class="stat-card bg-emerald" onclick="navigate('goals')" style="cursor:pointer">
            <span class="stat-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></span>
            <div class="stat-card-value">${(STATE.goals||[]).filter(g=>g.current>=g.target).length}</div><div class="stat-card-label">Goals Done</div>
          </div>
          <div class="stat-card bg-amber" onclick="navigate('habits')" style="cursor:pointer">
            <span class="stat-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></svg></span>
            <div class="stat-card-value">${STATE.streak||0}</div><div class="stat-card-label">Day Streak</div>
          </div>
          <div class="stat-card bg-gold" onclick="navigate('achievements')" style="cursor:pointer">
            <span class="stat-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg></span>
            <div class="stat-card-value">${(STATE.unlockedAchievements||[]).length}/${(typeof ACHIEVEMENTS_DEF !== 'undefined' ? ACHIEVEMENTS_DEF.length : '?')}</div><div class="stat-card-label">Achievements</div>
          </div>
        </div>
      </div>

      <!-- Quick Access -->
      <div class="section" style="margin-top:20px;margin-bottom:20px">
        <p class="section-title" style="margin-bottom:14px"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:6px"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>Quick Access</p>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px" class="qa-grid">
          ${[
            ['<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>','Health Hub','health','bg-red'],
            ['<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></svg>','Habits','habits','bg-amber'],
            ['<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>','Goals','goals','bg-emerald'],
            ['<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="6" height="18" rx="1"/><rect x="9" y="8" width="6" height="13" rx="1"/><rect x="16" y="13" width="6" height="8" rx="1"/></svg>','All Assets','investments','bg-teal'],
            ['<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>','Journal','journal','bg-pink'],
            ['<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>','Achievements','achievements','bg-gold'],
            ['<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>','Analytics','analytics','bg-purple'],
            ['<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="16" y1="15" x2="16" y2="15"/></svg>','AI Coach','ai-coach','bg-indigo'],
          ].map(([icon, label, page, bg]) => `
            <div class="stat-card ${bg}" onclick="navigate('${page}')" style="cursor:pointer;text-align:center;padding:18px 10px" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform=''">
              <div style="margin-bottom:10px;display:flex;justify-content:center;opacity:0.9">${icon}</div>
              <div style="font-size:12px;font-weight:600">${label}</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Life Score -->
      <div style="margin-top:20px">
        <div class="glass-card" style="padding:20px">
          <div class="section-header" style="margin-bottom:14px">
            <p class="section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:6px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Life Score</p>
            <span style="font-size:26px;font-weight:900;color:var(--teal);cursor:pointer" onclick="navigate('analytics')">${scores.overall}<span style="font-size:13px;font-weight:400;color:var(--text3)">/100</span></span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:center" class="life-score-grid">
            <div style="height:230px;position:relative"><canvas id="dash-radar-chart"></canvas></div>
            <div style="display:flex;flex-direction:column;gap:9px">
              ${[
                {label:'Wealth',      val:scores.wealthScore,    page:'finance', c:'#10b981'},
                {label:'Health',      val:scores.healthScore,    page:'health',  c:'#3b82f6'},
                {label:'Productivity',val:scores.prodScore,      page:'habits',  c:'#f59e0b'},
                {label:'Career',      val:scores.careerScore,    page:'goals',   c:'#8b5cf6'},
                {label:'Emotional',   val:scores.emotionalScore, page:'journal', c:'#ec4899'},
              ].map(s=>`
                <div onclick="navigate('${s.page}')" style="cursor:pointer;display:flex;align-items:center;gap:8px" onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'">
                  <span style="font-size:11px;color:var(--text3);width:72px;flex-shrink:0">${s.label}</span>
                  <div style="flex:1;height:5px;border-radius:4px;background:rgba(255,255,255,0.07)">
                    <div style="height:5px;border-radius:4px;width:${s.val}%;background:${s.c};transition:.5s;box-shadow:0 0 6px ${s.c}66"></div>
                  </div>
                  <span style="font-size:12px;font-weight:700;color:${scoreBarColor(s.val)};width:34px;text-align:right">${s.val}</span>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- User-added chart widgets (from the layout customizer) -->
      <div id="home-widgets"></div>

    </div>`;

  if (window.innerWidth < 700) {
    const twoCol = document.querySelector('.dash-two-col');
    if (twoCol) twoCol.style.gridTemplateColumns = '1fr';
    const qa = document.querySelector('.qa-grid');
    if (qa) qa.style.gridTemplateColumns = 'repeat(2,1fr)';
    const kpi = document.querySelector('.kpi-grid');
    if (kpi) kpi.style.gridTemplateColumns = 'repeat(2,1fr)';
    document.querySelectorAll('.dash-agb-grid, .dash-agb-grid2').forEach(g => g.style.gridTemplateColumns = '1fr');
  }

  // Render charts after DOM is ready
  setTimeout(() => {
    renderDashCombinedChart(txnsAll);
    renderDashPieChart(txns);
    renderLifeScoreRadar(scores);
    renderDashBankChart();
    renderDashBudgetChart();
    if (window.innerWidth < 700) {
      const fog = document.querySelector('.fin-overview-grid');
      if (fog) fog.style.gridTemplateColumns = '1fr';
      const lsg = document.querySelector('.life-score-grid');
      if (lsg) lsg.style.gridTemplateColumns = '1fr';
      const wg = document.querySelector('.welcome-grid');
      if (wg) wg.style.gridTemplateColumns = 'repeat(2,1fr)';
    }
    // App: move Financial Overview to the bottom — but ONLY if the user hasn't
    // saved a custom layout (otherwise it fights the Layout Customizer).
    if (window.__IS_APP && !localStorage.getItem('lifeos_layout_dashboard')) {
      const fo = document.getElementById('dash-fin-overview');
      if (fo && fo.parentNode) fo.parentNode.appendChild(fo);
    }
    // Render any chart widgets the user added to Home
    if (typeof renderHomeWidgets === 'function') renderHomeWidgets();
  }, 50);

  } catch(err) {
    console.error('[LifeOS] renderDashboard crashed:', err);
    const _pc = document.getElementById('page-container');
    if (_pc) _pc.innerHTML = `
      <div class="fade-in" style="padding:24px">
        <h1 class="page-title">Dashboard</h1>
        <div class="glass-card" style="padding:32px;text-align:center;margin-top:20px">
          <div style="font-size:40px;margin-bottom:12px">⚡</div>
          <p style="font-size:16px;font-weight:700;color:var(--text)">Welcome to LifeOS!</p>
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

// ── Combined: Income / Expense / Savings / Net Worth ──
function renderDashCombinedChart(txns) {
  const canvas = document.getElementById('dash-combined-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  // Monthly buckets — last 12 months
  const monthMap = {};
  [...txns].sort((a,b) => a.date.localeCompare(b.date)).forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (!monthMap[key]) monthMap[key] = { label, income: 0, expense: 0 };
    if (t.type === 'income') monthMap[key].income += t.amount;
    else monthMap[key].expense += t.amount;
  });

  // Always show last 6 months as x-axis baseline even with no data
  const now2 = new Date();
  for (let i = 5; i >= 0; i--) {
    const d2 = new Date(now2.getFullYear(), now2.getMonth() - i, 1);
    const k2 = `${d2.getFullYear()}-${String(d2.getMonth()+1).padStart(2,'0')}`;
    const lbl2 = d2.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (!monthMap[k2]) monthMap[k2] = { label: lbl2, income: 0, expense: 0 };
  }
  const entries = Object.entries(monthMap).sort(([a],[b]) => a.localeCompare(b)).slice(-12);

  const labels  = entries.map(([,v]) => v.label);
  const incData = entries.map(([,v]) => Math.round(v.income));
  const expData = entries.map(([,v]) => Math.round(v.expense));
  const savData = entries.map(([,v]) => Math.round(v.income - v.expense));
  let run = 0;
  const nwData = entries.map(([,v]) => { run += (v.income - v.expense); return Math.round(run); });

  const isLight = document.body.classList.contains('light');
  const gridC  = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
  const tickC  = isLight ? '#374151' : '#64748b';
  const fmtY   = v => `₹${Math.abs(v)>=100000?(v/100000).toFixed(1)+'L':Math.abs(v)>=1000?(v/1000).toFixed(0)+'k':v}`;

  if (chartInstances['dash-combined']) { chartInstances['dash-combined'].destroy(); delete chartInstances['dash-combined']; }

  const ctx = canvas.getContext('2d');
  const mkGrad = (top, bot) => {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight || 260);
    g.addColorStop(0, top); g.addColorStop(1, bot); return g;
  };

  chartInstances['dash-combined'] = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        // Net Worth — teal gradient fill — RIGHT axis
        {
          label: 'Net Worth', data: nwData,
          borderColor: '#00c9a7', borderWidth: 2.8,
          backgroundColor: (c) => {
            const { ctx: cx, chartArea } = c.chart;
            if (!chartArea) return 'rgba(0,201,167,0.18)';
            const g = cx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, nwData[nwData.length-1]>=0?'rgba(0,201,167,0.28)':'rgba(239,68,68,0.22)');
            g.addColorStop(1, 'rgba(0,201,167,0.0)');
            return g;
          },
          fill: true, tension: 0.4,
          pointBackgroundColor: '#00c9a7', pointRadius: 4, pointHoverRadius: 7,
          yAxisID: 'yNW', order: 0
        },
        // Income — green line
        {
          label: 'Income', data: incData,
          borderColor: '#eab308', borderWidth: 2.2,
          backgroundColor: mkGrad('rgba(234,179,8,0.22)', 'rgba(234,179,8,0.0)'),
          fill: true, tension: 0.42,
          pointBackgroundColor: '#eab308', pointRadius: 3, pointHoverRadius: 6,
          yAxisID: 'y', order: 2
        },
        // Expense — red line
        {
          label: 'Expense', data: expData,
          borderColor: '#ef4444', borderWidth: 2.2,
          backgroundColor: mkGrad('rgba(239,68,68,0.18)', 'rgba(239,68,68,0.0)'),
          fill: true, tension: 0.42,
          pointBackgroundColor: '#ef4444', pointRadius: 3, pointHoverRadius: 6,
          yAxisID: 'y', order: 3
        },
        // Savings — indigo dashed
        {
          label: 'Savings', data: savData,
          borderColor: 'rgba(99,102,241,0.9)', borderWidth: 2,
          backgroundColor: 'transparent', fill: false, tension: 0.42,
          pointBackgroundColor: '#6366f1', pointRadius: 3, pointHoverRadius: 6,
          borderDash: [5, 3], yAxisID: 'y', order: 1
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: {
            color: isLight ? '#374151' : '#94a3b8', font: { family: 'Inter', size: 11 },
            padding: 16, usePointStyle: true, pointStyleWidth: 8
          }
        },
        tooltip: {
          backgroundColor: isLight ? 'rgba(255,255,255,0.97)' : 'rgba(10,14,30,0.95)',
          titleColor: isLight ? '#1a1f2e' : '#94a3b8', bodyColor: isLight ? '#374151' : '#e2e8f0',
          borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(0,201,167,0.3)',
          padding: 14, borderColor: 'rgba(0,201,167,0.3)', borderWidth: 1,
          cornerRadius: 10,
          callbacks: {
            label: ctx => {
              const v = ctx.parsed.y;
              return ` ${ctx.dataset.label}: ${v>=0?'+':''}₹${Math.abs(v).toLocaleString('en-IN')}`;
            }
          }
        }
      },
      scales: {
        x: { ticks: { color: tickC, font: { size: 11, family: 'Inter' } }, grid: { color: gridC } },
        y: {
          position: 'left',
          ticks: { color: tickC, font: { size: 11 }, callback: fmtY },
          grid: { color: gridC }
        },
        yNW: {
          position: 'right',
          ticks: { color: '#00c9a7', font: { size: 11 }, callback: fmtY },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

function renderDashPieChart(txns) {
  const el = document.getElementById('dash-pie-chart');
  if (!el) return;
  const isLight = document.body.classList.contains('light');

  const catMap = {};
  txns.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });
  const topCats = Object.entries(catMap).sort(([,a],[,b]) => b - a).slice(0, 6);
  if (!topCats.length) {
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 10px;text-align:center">
        <div style="width:64px;height:64px;border-radius:50%;border:3px dashed rgba(99,102,241,0.3);display:flex;align-items:center;justify-content:center;font-size:26px;margin-bottom:12px">📊</div>
        <p style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:4px">No spending yet</p>
        <p style="font-size:11px;color:var(--text3);margin-bottom:14px">Add expenses to see your category breakdown</p>
        <button onclick="navigate('finance')" style="padding:7px 16px;border-radius:20px;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.35);color:#6366f1;font-size:11px;font-weight:700;cursor:pointer">+ Add Expense</button>
      </div>`;
    return;
  }

  const total = topCats.reduce((s,[,v]) => s + v, 0);
  const COLORS = ['#f59e0b','#ec4899','#10b981','#6366f1','#8b5cf6','#3b82f6'];
  const CAT_ICONS = {Food:'🍔',Shopping:'🛍️',Transport:'🚗',Fuel:'⛽',Rent:'🏠',Bills:'💡',Health:'💊',Entertainment:'🎬',Travel:'✈️',Other:'📦',Education:'📚',Groceries:'🛒',Insurance:'🛡️',Utilities:'🔌',EMI:'🏦',Gifts:'🎁',Business:'💼'};
  const fmtV = v => v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : v >= 1000 ? `₹${(v/1000).toFixed(1)}k` : `₹${v}`;
  const totalFmt = fmtV(total);

  // Inject canvas + legend
  el.innerHTML = `
    <div style="position:relative;height:160px;margin-bottom:12px">
      <canvas id="dash-spending-donut"></canvas>
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none">
        <span style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#64748b">TOTAL</span>
        <span style="font-size:15px;font-weight:900;color:${isLight?'#1a1f2e':'#f1f5f9'};margin-top:2px">${totalFmt}</span>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:5px">
      ${topCats.map(([name, val], i) => {
        const pct = (val / total * 100).toFixed(0);
        const color = COLORS[i % COLORS.length];
        const icon = CAT_ICONS[name] || '💳';
        return `<div style="display:flex;align-items:center;gap:6px">
          <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></span>
          <span style="font-size:12px">${icon}</span>
          <span style="font-size:11px;font-weight:500;color:var(--text2);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</span>
          <span style="font-size:11px;font-weight:700;color:${color}">${fmtV(val)}</span>
          <span style="font-size:10px;color:var(--text3);width:26px;text-align:right">${pct}%</span>
        </div>`;
      }).join('')}
    </div>`;

  // Render Chart.js doughnut
  setTimeout(() => {
    const canvas = document.getElementById('dash-spending-donut');
    if (!canvas || typeof Chart === 'undefined') return;
    if (chartInstances['dash-spending']) { chartInstances['dash-spending'].destroy(); delete chartInstances['dash-spending']; }
    chartInstances['dash-spending'] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: topCats.map(([n]) => n),
        datasets: [{
          data: topCats.map(([,v]) => v),
          backgroundColor: COLORS.slice(0, topCats.length),
          borderColor: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(10,10,30,0.6)',
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isLight ? 'rgba(255,255,255,0.97)' : 'rgba(10,14,30,0.95)',
            titleColor: isLight ? '#475569' : '#94a3b8',
            bodyColor: isLight ? '#1a1f2e' : '#e2e8f0',
            padding: 10,
            borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: ctx => ` ${ctx.label}: ${fmtV(ctx.parsed)} (${(ctx.parsed/total*100).toFixed(1)}%)`
            }
          }
        }
      }
    });
  }, 10);
}


// ── Radar: Life Score ──
function renderLifeScoreRadar(scores) {
  const canvas = document.getElementById('dash-radar-chart');
  if (!canvas || typeof Chart === 'undefined') return;
  if (chartInstances['dash-radar']) { chartInstances['dash-radar'].destroy(); delete chartInstances['dash-radar']; }
  const isLight=document.body.classList.contains('light');
  const gridC=isLight?'rgba(0,0,0,0.08)':'rgba(255,255,255,0.08)';
  chartInstances['dash-radar']=new Chart(canvas,{
    type:'radar',
    data:{
      labels:['Wealth','Health','Productivity','Career','Emotional'],
      datasets:[{
        data:[scores.wealthScore,scores.healthScore,scores.prodScore,scores.careerScore,scores.emotionalScore],
        backgroundColor:'rgba(0,201,167,0.12)',
        borderColor:'rgba(0,201,167,0.85)',
        borderWidth:2.2,
        pointBackgroundColor:'#00c9a7',
        pointBorderColor:'rgba(0,201,167,0.5)',
        pointBorderWidth:2,
        pointRadius:5,
        pointHoverRadius:7
      }]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.raw}/100`}}},
      scales:{r:{
        min:0,max:100,
        ticks:{stepSize:25,display:false,backdropColor:'transparent'},
        grid:{color:gridC},
        angleLines:{color:gridC},
        pointLabels:{color:isLight?'#475569':'#94a3b8',font:{size:11,family:'Inter',weight:'700'}}
      }}
    }
  });
}
