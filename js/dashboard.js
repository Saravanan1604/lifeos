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

  return [
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
    card({label:'Habits Today', value:habits.length>0?`${doneToday}/${habits.length}`:'—',
      sub:habits.length>0?`${Math.round(doneToday/habits.length*100)}% done today`:'Add habits to track',
      subColor:habits.length>0&&doneToday===habits.length?'#10b981':'var(--text3)',
      sparkData:null, sparkColor:'#f59e0b', page:'habits', accent:'#f59e0b', alarm:false, warn:false}),
  ].join('');
}

// Bank balances · credit cards · goals · budget — overview cards
function _buildAccountsGoalsBudget() {
  const banks   = STATE.bankAccounts || [];
  const cards   = STATE.creditCards  || [];
  const goals   = STATE.goals        || [];
  const budgets = STATE.budgets      || [];
  const totalBank  = banks.reduce((s,b)=>s+(b.balance||0),0);
  const totalOut   = cards.reduce((s,c)=>s+(c.outstanding||0),0);
  const totalLimit = cards.reduce((s,c)=>s+(c.limit||0),0);

  // This-month expense per category (for budget bars)
  const monthExp = filterTxByPeriod(STATE.transactions||[], 'month').filter(t=>t.type==='expense');
  const spentByCat = {};
  monthExp.forEach(t => { const k=(t.category||'').toLowerCase().trim(); spentByCat[k]=(spentByCat[k]||0)+t.amount; });

  const bar = (pct,color) => `<div style="height:5px;border-radius:3px;background:rgba(255,255,255,0.1)"><div style="height:5px;border-radius:3px;width:${pct}%;background:${color};transition:.4s"></div></div>`;
  const wrap = (inner) => `<div style="display:flex;flex-direction:column;gap:10px;max-height:230px;overflow-y:auto;padding-right:2px">${inner}</div>`;
  const empty = (txt) => `<p style="font-size:12px;color:var(--text3);padding:8px 0">${txt}</p>`;

  // 🏦 Banks
  const banksCard = `
    <div class="glass-card" style="padding:18px;cursor:pointer" onclick="navigate('bank-tracker')" onmouseover="this.style.borderColor='rgba(0,201,167,0.35)'" onmouseout="this.style.borderColor=''">
      <div class="section-header" style="margin-bottom:12px">
        <p class="section-title">🏦 Bank Balances</p>
        <span style="font-size:14px;font-weight:800;color:var(--teal)">${fmt(totalBank)}</span>
      </div>
      ${banks.length===0 ? empty('No bank accounts yet') : wrap(banks.map(b=>`
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${b.color||'#1e293b'},${b.color2||'#0f172a'});font-size:14px;flex-shrink:0">${b.icon||'🏦'}</div>
          <span style="font-size:12px;font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b.bankName}</span>
          <span style="font-size:13px;font-weight:700">${fmt(b.balance||0)}</span>
        </div>`).join(''))}
    </div>`;

  // 💳 Credit cards
  const cardsCard = `
    <div class="glass-card" style="padding:18px;cursor:pointer" onclick="bankTrackerTab='cards';navigate('bank-tracker')" onmouseover="this.style.borderColor='rgba(239,68,68,0.35)'" onmouseout="this.style.borderColor=''">
      <div class="section-header" style="margin-bottom:12px">
        <p class="section-title">💳 Credit Cards</p>
        <span style="font-size:12px;font-weight:700;color:#ef4444">${fmt(totalOut)} / ${fmt(totalLimit)}</span>
      </div>
      ${cards.length===0 ? empty('No credit cards yet') : wrap(cards.map(c=>{
        const used=c.outstanding||0, lim=c.limit||1, pct=Math.min(100,Math.round(used/lim*100));
        const uc=pct>80?'#ef4444':pct>50?'#f59e0b':'#10b981';
        return `<div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
            <span style="font-weight:600">💳 ${c.bankName}</span>
            <span style="color:var(--text3)">${fmt(used)} / ${fmt(c.limit||0)} · ${pct}%</span>
          </div>${bar(pct,uc)}</div>`;
      }).join(''))}
    </div>`;

  // 🎯 Goals
  const goalsDone = goals.filter(g=>g.current>=g.target).length;
  const goalsCard = `
    <div class="glass-card" style="padding:18px;cursor:pointer" onclick="navigate('goals')" onmouseover="this.style.borderColor='rgba(139,92,246,0.35)'" onmouseout="this.style.borderColor=''">
      <div class="section-header" style="margin-bottom:12px">
        <p class="section-title">🎯 Goals</p>
        <span style="font-size:12px;color:var(--text3)">${goalsDone}/${goals.length} done</span>
      </div>
      ${goals.length===0 ? empty('No goals yet') : wrap(goals.slice(0,6).map(g=>{
        const pct=g.target>0?Math.min(100,Math.round(g.current/g.target*100)):0;
        const done=g.current>=g.target;
        return `<div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
            <span style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px">${g.emoji||'🎯'} ${g.name}</span>
            <span style="color:${done?'#10b981':'var(--text3)'};font-weight:700">${pct}%</span>
          </div>${bar(pct,done?'#10b981':'linear-gradient(90deg,#8b5cf6,#6366f1)')}</div>`;
      }).join(''))}
    </div>`;

  // 📊 Budget
  const budgetCard = `
    <div class="glass-card" style="padding:18px;cursor:pointer" onclick="navigate('budget')" onmouseover="this.style.borderColor='rgba(245,158,11,0.35)'" onmouseout="this.style.borderColor=''">
      <div class="section-header" style="margin-bottom:12px">
        <p class="section-title">📊 Budget — ${new Date().toLocaleString('default',{month:'short'})}</p>
      </div>
      ${budgets.length===0 ? empty('No budgets set') : wrap(budgets.slice(0,6).map(b=>{
        const lim=b.amount!=null?b.amount:(b.limit||0);
        const spent=spentByCat[(b.category||'').toLowerCase().trim()]||0;
        const pct=lim>0?Math.min(100,Math.round(spent/lim*100)):0;
        const over=spent>lim;
        const bc=over?'#ef4444':pct>80?'#f59e0b':'#10b981';
        return `<div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
            <span style="font-weight:600">${b.category}</span>
            <span style="color:${over?'#ef4444':'var(--text3)'}">${fmt(spent)} / ${fmt(lim)}</span>
          </div>${bar(pct,bc)}</div>`;
      }).join(''))}
    </div>`;

  return `
    <div style="display:flex;align-items:center;gap:10px;margin:8px 0 16px;padding-bottom:10px;border-bottom:1px solid var(--glass-border)">
      <span style="font-size:16px">💼</span>
      <h2 style="font-size:16px;font-weight:800;color:var(--text)">Accounts, Cards, Goals &amp; Budget</h2>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px" class="dash-agb-grid">
      ${banksCard}${cardsCard}${goalsCard}${budgetCard}
    </div>`;
}

// ===== DASHBOARD =====
function renderDashboard() {
  const scores = calcLifeScore();
  const txnsAll = STATE.transactions || [];
  const txns = filterTxByAnchor(txnsAll, _dashPeriod, _dashAnchorDate);
  const recent = [...txns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  // For day/week views income (salary) is monthly — fall back to the anchor's month.
  const _incPeriod = (_dashPeriod === 'day' || _dashPeriod === 'week') ? 'month' : _dashPeriod;
  const incomeTxns = _incPeriod === _dashPeriod ? txns : filterTxByAnchor(txnsAll, _incPeriod, _dashAnchorDate);
  const totalIncome = incomeTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netWorth = totalIncome - totalExpense;
  const habits = STATE.habits || [];
  const comps = STATE.habitCompletions || [];
  const doneToday = comps.filter(c => c.date === today()).length;
  const scoreBarColor = s => s >= 70 ? '#10b981' : s >= 40 ? '#f59e0b' : '#ef4444';

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <!-- Header -->
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:20px">
        <div>
          <h1 class="page-title">Dashboard</h1>
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

      ${_buildInsightBar()}

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

      <!-- Life Score -->
      <div style="margin-bottom:20px">
        <div class="glass-card" style="padding:20px">
          <div class="section-header" style="margin-bottom:14px">
            <p class="section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:6px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Life Score</p>
            <span style="font-size:26px;font-weight:900;color:var(--teal)" onclick="navigate('analytics')" style="cursor:pointer">${scores.overall}<span style="font-size:13px;font-weight:400;color:var(--text3)">/100</span></span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:center" class="life-score-grid">
            <div style="height:230px;position:relative"><canvas id="dash-radar-chart"></canvas></div>
            <div style="display:flex;flex-direction:column;gap:9px">
              ${[
                {label:'Wealth',    val:scores.wealthScore,   page:'finance',  c:'#10b981'},
                {label:'Health',    val:scores.healthScore,   page:'health',   c:'#3b82f6'},
                {label:'Productivity',val:scores.prodScore,   page:'habits',   c:'#f59e0b'},
                {label:'Career',    val:scores.careerScore,   page:'goals',    c:'#8b5cf6'},
                {label:'Emotional', val:scores.emotionalScore,page:'journal',  c:'#ec4899'},
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

      <!-- Finance Charts Row (Income vs Expense + Spending by Category) -->
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:20px" class="dash-charts-row">
        <div class="glass-card" style="padding:20px">
          <div class="section-header" style="margin-bottom:14px">
            <p class="section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:6px"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>Income vs Expenses</p>
            <button class="btn-icon btn-sm" onclick="navigate('finance')" style="color:var(--teal);border-color:rgba(0,201,167,0.3)">View All →</button>
          </div>
          <div style="height:200px;position:relative"><canvas id="dash-income-chart"></canvas></div>
        </div>
        <div class="glass-card" style="padding:20px">
          <div class="section-header" style="margin-bottom:14px">
            <p class="section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:6px"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>Spending</p>
          </div>
          <div id="dash-pie-chart" style="display:flex;flex-direction:column;gap:8px;padding-top:4px"></div>
        </div>
      </div>

      <!-- 50/30/20 + Category breakdown row -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px" class="analytics-row-1">

          <!-- 50/30/20 Card -->
          <div class="glass-card" style="padding:20px">
            <p class="section-title" style="margin-bottom:10px">📐 50/30/20 — ${new Date().toLocaleString('default',{month:'long'})}</p>
            <div style="height:175px;position:relative"><canvas id="dash-5030-chart"></canvas></div>
            <div style="display:flex;gap:6px;margin-top:10px">
              ${(()=>{
                const NEEDS=['Rent','EMI','Utilities','Bills','Insurance','Groceries','Health','Fuel','Transport'];
                const WANTS=['Entertainment','Shopping','Travel','Gifts','Food','Education'];
                const inc=txns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
                let needs=0,wants=0;
                txns.filter(t=>t.type==='expense').forEach(t=>{if(NEEDS.includes(t.category))needs+=t.amount;else if(WANTS.includes(t.category))wants+=t.amount;});
                const totalExp=txns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
                const sav=inc-totalExp;
                const np=inc>0?(needs/inc*100).toFixed(1):0,wp=inc>0?(wants/inc*100).toFixed(1):0,sp=inc>0?(sav/inc*100).toFixed(1):0;
                if(!inc) return '<p style="font-size:11px;color:var(--text3)">Add income to see</p>';
                return [{l:'Needs',p:np,t:50,c:'#6366f1'},{l:'Wants',p:wp,t:30,c:'#f59e0b'},{l:'Savings',p:sp,t:20,c:'#10b981'}]
                  .map(r=>`<div style="flex:1;text-align:center;padding:7px 4px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06)">
                    <p style="font-size:9px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.6px">${r.l}</p>
                    <p style="font-size:15px;font-weight:900;color:${parseFloat(r.p)>(r.l==='Savings'?r.t-1:r.t)?'#ef4444':r.c};margin-top:2px">${r.p}%</p>
                    <p style="font-size:9px;color:var(--text3);margin-top:1px">target ${r.t}%</p>
                  </div>`).join('');
              })()}
            </div>
          </div>

          <!-- Category Polar Chart -->
          <div class="glass-card" style="padding:20px">
            <p class="section-title" style="margin-bottom:10px">🔍 Spending by Category</p>
            <div style="height:225px;position:relative"><canvas id="dash-polar-chart"></canvas></div>
          </div>
        </div>

      <!-- Quick Access -->
      <div class="section" style="margin-bottom:20px">
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


      <!-- Net Worth Graph -->
      <div class="glass-card" style="padding:22px;margin-bottom:20px">
        <div class="section-header" style="margin-bottom:16px">
          <p class="section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00c9a7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:6px"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>Net Worth Over Time</p>
          <span style="font-size:13px;font-weight:700;color:${netWorth >= 0 ? '#00c9a7' : '#ef4444'}">${netWorth >= 0 ? '+' : ''}${fmt(netWorth)}</span>
        </div>
        <div style="height:200px;position:relative">
          <canvas id="networth-chart"></canvas>
        </div>
      </div>

      <!-- Accounts · Cards · Goals · Budget -->
      ${_buildAccountsGoalsBudget()}

      <!-- Recent Transactions -->
      <div class="glass-card" style="overflow:hidden">
        <div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center">
          <p class="section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:6px"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>Recent Transactions</p>
          <button class="btn-secondary btn-sm" onclick="navigate('finance')">View All →</button>
        </div>
        ${recent.length === 0
          ? `<div class="empty-state"><span class="empty-state-icon">💸</span><p>No transactions yet. <span onclick="navigate('finance')" style="color:#00c9a7;cursor:pointer;text-decoration:underline">Add one now →</span></p></div>`
          : recent.map(tx => `
            <div onclick="navigate('finance')" style="display:flex;align-items:center;justify-content:space-between;padding:13px 20px;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer;transition:.15s" onmouseover="this.style.background='rgba(0,201,167,0.04)'" onmouseout="this.style.background=''">
              <div style="display:flex;align-items:center;gap:12px">
                <div style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:${tx.type==='income'?'rgba(0,201,167,0.15)':'rgba(239,68,68,0.15)'};font-size:18px;flex-shrink:0">${tx.icon||(tx.type==='income'?'💚':'❤️')}</div>
                <div>
                  <p style="font-size:13px;font-weight:600">${tx.description||tx.category}</p>
                  <p style="font-size:11px;color:var(--text3)">${tx.category} · ${fmtDate(tx.date)}</p>
                </div>
              </div>
              <span style="font-weight:700;font-size:14px;color:${tx.type==='income'?'#00c9a7':'#ef4444'}">${tx.type==='income'?'+':'-'}${fmt(tx.amount)}</span>
            </div>`).join('')}
      </div>

      <!-- ═══ ANALYTICS SECTION ═══ -->
      <div style="margin-top:8px">
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
            <div class="stat-card-value">${(STATE.unlockedAchievements||[]).length}/${ACHIEVEMENTS_DEF.length}</div><div class="stat-card-label">Achievements</div>
          </div>
        </div>
      </div>

    </div>`;

  if (window.innerWidth < 700) {
    const twoCol = document.querySelector('.dash-two-col');
    if (twoCol) twoCol.style.gridTemplateColumns = '1fr';
    const qa = document.querySelector('.qa-grid');
    if (qa) qa.style.gridTemplateColumns = 'repeat(2,1fr)';
    const kpi = document.querySelector('.kpi-grid');
    if (kpi) kpi.style.gridTemplateColumns = 'repeat(2,1fr)';
    const agb = document.querySelector('.dash-agb-grid');
    if (agb) agb.style.gridTemplateColumns = '1fr';
  }

  // Render net worth chart after DOM is ready
  setTimeout(() => {
    renderNetWorthChart(txnsAll);
    renderDashIncomeChart(txnsAll);
    renderDashPieChart(txns);
    render5030Chart(txns);
    renderPolarCatChart(txns);
    renderLifeScoreRadar(scores);
    if (window.innerWidth < 700) {
      const r1 = document.querySelector('.analytics-row-1');
      if (r1) r1.style.gridTemplateColumns = '1fr';
      const lsg = document.querySelector('.life-score-grid');
      if (lsg) lsg.style.gridTemplateColumns = '1fr';
    }
  }, 50);
}

function renderNetWorthChart(txns) {
  const canvas = document.getElementById('networth-chart');
  if (!canvas) return;

  // Build monthly cumulative net worth
  const monthMap = {};
  const sorted = [...txns].sort((a, b) => a.date.localeCompare(b.date));
  sorted.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (!monthMap[key]) monthMap[key] = { label, net: 0 };
    monthMap[key].net += t.type === 'income' ? t.amount : -t.amount;
  });

  // Accumulate running total
  let running = 0;
  const entries = Object.entries(monthMap).sort(([a],[b]) => a.localeCompare(b)).slice(-12);
  const labels = entries.map(([, v]) => v.label);
  const data   = entries.map(([, v]) => { running += v.net; return Math.round(running); });

  // If no data, show flat zero
  if (labels.length === 0) { labels.push('Now'); data.push(0); }

  const isLight = document.body.classList.contains('light');
  const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
  const tickColor = isLight ? '#64748b' : '#64748b';
  const lastVal = data[data.length - 1] || 0;
  const lineColor = lastVal >= 0 ? '#00c9a7' : '#ef4444';
  const fillColorTop = lastVal >= 0 ? 'rgba(0,201,167,0.25)' : 'rgba(239,68,68,0.2)';
  const fillColorBot = lastVal >= 0 ? 'rgba(0,201,167,0.0)' : 'rgba(239,68,68,0.0)';

  chartInstances['networth'] = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Net Worth',
        data,
        borderColor: lineColor,
        borderWidth: 2.5,
        pointBackgroundColor: lineColor,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return fillColorTop;
          const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, fillColorTop);
          gradient.addColorStop(1, fillColorBot);
          return gradient;
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.92)',
          titleColor: '#94a3b8',
          bodyColor: '#fff',
          padding: 12,
          borderColor: 'rgba(0,201,167,0.3)',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` Net Worth: ${ctx.parsed.y >= 0 ? '+' : ''}₹${ctx.parsed.y.toLocaleString('en-IN')}`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: tickColor, font: { size: 11 } },
          grid: { color: gridColor }
        },
        y: {
          ticks: {
            color: tickColor,
            font: { size: 11 },
            callback: v => `₹${Math.abs(v) >= 100000 ? (v/100000).toFixed(1)+'L' : Math.abs(v) >= 1000 ? (v/1000).toFixed(0)+'k' : v}`
          },
          grid: { color: gridColor }
        }
      }
    }
  });
}

function renderDashIncomeChart(txns) {
  const canvas = document.getElementById('dash-income-chart');
  if (!canvas) return;

  // Build buckets based on active period + anchor date
  const base = _dashAnchorDate ? new Date(_dashAnchorDate + 'T00:00:00') : new Date();
  const buckets = {};
  let orderedKeys = [];

  if (_dashPeriod === 'day' || _dashPeriod === 'week') {
    // Daily buckets — 7 days of the anchor's week (Mon→Sun)
    const dow = (base.getDay() + 6) % 7;
    const mon = new Date(base); mon.setDate(base.getDate() - dow);
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon); d.setDate(mon.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleString('default', { weekday: 'short', day: 'numeric' });
      buckets[key] = { label, income: 0, expense: 0 };
      orderedKeys.push(key);
    }
    txns.forEach(t => {
      if (buckets[t.date]) {
        if (t.type === 'income') buckets[t.date].income += t.amount;
        else buckets[t.date].expense += t.amount;
      }
    });
  } else if (_dashPeriod === 'month') {
    // Weekly buckets — weeks in the anchor's month
    const yr = base.getFullYear(), mo = base.getMonth();
    for (let w = 1; w <= 5; w++) { buckets[`W${w}`] = { label: `Week ${w}`, income: 0, expense: 0 }; orderedKeys.push(`W${w}`); }
    txns.forEach(t => {
      const d = new Date(t.date);
      if (d.getFullYear() === yr && d.getMonth() === mo) {
        const key = `W${Math.min(5, Math.ceil(d.getDate() / 7))}`;
        if (t.type === 'income') buckets[key].income += t.amount;
        else buckets[key].expense += t.amount;
      }
    });
    // drop empty trailing weeks
    while (orderedKeys.length > 1 && !buckets[orderedKeys[orderedKeys.length-1]].income && !buckets[orderedKeys[orderedKeys.length-1]].expense) orderedKeys.pop();
  } else {
    // year / all — monthly buckets (up to 12 months in anchor's year)
    txns.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!buckets[key]) buckets[key] = { label: d.toLocaleString('default', { month: 'short', year: '2-digit' }), income: 0, expense: 0 };
      if (t.type === 'income') buckets[key].income += t.amount;
      else buckets[key].expense += t.amount;
    });
    orderedKeys = Object.keys(buckets).sort().slice(-12);
  }

  const entries = orderedKeys.map(k => buckets[k] || { label: k, income: 0, expense: 0 });
  const labels  = entries.map(v => v.label);
  const incData = entries.map(v => v.income);
  const expData = entries.map(v => v.expense);
  const savData = entries.map(v => v.income - v.expense);
  if (!labels.length) { labels.push('—'); incData.push(0); expData.push(0); savData.push(0); }

  const isLight  = document.body.classList.contains('light');
  const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
  const c = canvas.getContext('2d');

  const mkGrad = (top, bot) => {
    const g = c.createLinearGradient(0, 0, 0, canvas.offsetHeight || 200);
    g.addColorStop(0, top); g.addColorStop(1, bot); return g;
  };

  chartInstances['dash-income'] = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets: [
      { label:'Income',  data:incData, borderColor:'#10b981', borderWidth:2.5,
        backgroundColor: mkGrad('rgba(16,185,129,0.35)','rgba(16,185,129,0.0)'),
        fill:true, tension:0.42, pointBackgroundColor:'#10b981', pointRadius:4, pointHoverRadius:7, order:2 },
      { label:'Expense', data:expData, borderColor:'#ef4444', borderWidth:2.5,
        backgroundColor: mkGrad('rgba(239,68,68,0.3)','rgba(239,68,68,0.0)'),
        fill:true, tension:0.42, pointBackgroundColor:'#ef4444', pointRadius:4, pointHoverRadius:7, order:3 },
      { label:'Savings', data:savData, borderColor:'rgba(99,102,241,0.9)', borderWidth:2,
        backgroundColor:'transparent', fill:false, tension:0.42,
        pointBackgroundColor:'#6366f1', pointRadius:3, pointHoverRadius:6,
        borderDash:[5,3], order:1 }
    ]},
    options: {
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      plugins:{
        legend:{ labels:{ color:'#94a3b8', font:{family:'Inter',size:11}, padding:12, usePointStyle:true, pointStyleWidth:8 } },
        tooltip:{
          backgroundColor:'rgba(13,17,35,0.92)', titleColor:'#94a3b8', bodyColor:'#fff',
          padding:12, borderColor:'rgba(0,201,167,0.3)', borderWidth:1,
          callbacks:{ label: ctx => ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString('en-IN')}` }
        }
      },
      scales:{
        x:{ ticks:{color:'#64748b',font:{size:11}}, grid:{color:gridColor} },
        y:{ ticks:{color:'#64748b',font:{size:11},
              callback: v => `₹${Math.abs(v)>=100000?(v/100000).toFixed(1)+'L':Math.abs(v)>=1000?(v/1000).toFixed(0)+'k':v}`
            }, grid:{color:gridColor} }
      }
    }
  });
}

function renderDashPieChart(txns) {
  const el = document.getElementById('dash-pie-chart');
  if (!el) return;
  el.style.cssText = 'padding:0;display:block';

  const catMap = {};
  txns.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });
  const topCats = Object.entries(catMap).sort(([,a],[,b]) => b - a).slice(0, 5);
  if (!topCats.length) {
    el.innerHTML = '<p style="font-size:12px;color:#64748b;text-align:center;padding:40px 0">No expense data</p>';
    return;
  }

  const total = topCats.reduce((s,[,v]) => s + v, 0);
  const COLORS = ['#3b82f6','#f59e0b','#10b981','#ec4899','#8b5cf6'];
  const CAT_ICONS = {Food:'🍔',Shopping:'🛍️',Transport:'🚗',Fuel:'⛽',Rent:'🏠',Bills:'💡',Health:'💊',Entertainment:'🎬',Travel:'✈️',Other:'📦',Education:'📚',Groceries:'🛒',Insurance:'🛡️',Utilities:'🔌',EMI:'🏦',Gifts:'🎁'};
  const fmt = v => v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : v >= 1000 ? `₹${(v/1000).toFixed(1)}k` : `₹${v}`;

  // ── geometry ──
  const cx = 110, cy = 110, R = 78, sw = 34;
  const circ  = 2 * Math.PI * R;
  const gapLen = (5 / 360) * circ;           // 5° gap between segments
  const dashOff = (circ / 4).toFixed(2);     // shift start to 12-o'clock
  const toRad = deg => (deg - 90) * Math.PI / 180;

  // ── build segments ──
  let cum = 0;
  const segs = topCats.map(([name, val], i) => {
    const pct = val / total;
    const sweep = pct * 360;
    const mid = cum + sweep / 2;
    const seg = { name, val, pct, sweep, segLen: Math.max(2, pct * circ - gapLen),
                  start: cum, mid, color: COLORS[i % COLORS.length],
                  icon: CAT_ICONS[name] || '💳', fmt: fmt(val) };
    cum += sweep;
    return seg;
  });

  // ── arcs ──
  const arcs = segs.map(s => `
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none"
      stroke="${s.color}" stroke-width="${sw}" stroke-linecap="round"
      stroke-dasharray="${s.segLen.toFixed(1)} ${circ.toFixed(1)}"
      stroke-dashoffset="${dashOff}"
      transform="rotate(${s.start.toFixed(1)},${cx},${cy})"
      style="filter:drop-shadow(0 4px 12px ${s.color}70)"/>`).join('');

  // ── emoji icons — sit ON the arc at its midpoint ──
  const icons = segs.map(s => {
    const r = toRad(s.mid);
    return `<text x="${(cx + R * Math.cos(r)).toFixed(1)}" y="${(cy + R * Math.sin(r)).toFixed(1)}"
      text-anchor="middle" dominant-baseline="middle" font-size="15">${s.icon}</text>`;
  }).join('');

  // ── % badge — just outside the arc, at midpoint ──
  const badges = segs.map(s => {
    const r    = toRad(s.mid);
    const outR = R + sw / 2 + 14;
    const bx = (cx + outR * Math.cos(r)).toFixed(1);
    const by = (cy + outR * Math.sin(r)).toFixed(1);
    return `
      <rect x="${(+bx - 13).toFixed(1)}" y="${(+by - 8).toFixed(1)}"
        width="26" height="16" rx="8"
        fill="${s.color}22" stroke="${s.color}66" stroke-width="1"/>
      <text x="${bx}" y="${by}" text-anchor="middle" dominant-baseline="middle"
        font-size="9" font-weight="800" fill="${s.color}" font-family="Inter,sans-serif"
        >${(s.pct * 100).toFixed(0)}%</text>`;
  }).join('');

  const totalFmt = fmt(total);
  const innerR   = R - sw / 2 - 5;

  // ── compact legend rows below chart ──
  const legend = segs.map(s => `
    <div style="display:flex;align-items:center;gap:7px;padding:4px 6px;border-radius:8px;
        background:${s.color}12;border:1px solid ${s.color}25;
        transition:background .15s" onmouseover="this.style.background='${s.color}22'"
        onmouseout="this.style.background='${s.color}12'">
      <span style="font-size:14px;line-height:1">${s.icon}</span>
      <span style="flex:1;font-size:10.5px;font-weight:600;color:#cbd5e1;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name}</span>
      <span style="font-size:10px;font-weight:700;color:${s.color}">${s.fmt}</span>
      <span style="font-size:9px;color:#475569;min-width:26px;text-align:right">${(s.pct*100).toFixed(0)}%</span>
    </div>`).join('');

  el.innerHTML = `
    <svg width="100%" viewBox="0 0 220 220"
        style="display:block;margin:0 auto;overflow:visible;max-height:210px">
      <defs>
        <radialGradient id="dpie-c" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stop-color="rgba(25,28,58,1)"/>
          <stop offset="100%" stop-color="rgba(8,10,28,1)"/>
        </radialGradient>
      </defs>

      <!-- ghost track -->
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="none"
        stroke="rgba(255,255,255,0.035)" stroke-width="${sw}"/>

      <!-- segments -->
      ${arcs}

      <!-- inner fill -->
      <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="url(#dpie-c)"
        stroke="rgba(255,255,255,0.07)" stroke-width="1.5"/>

      <!-- center text -->
      <text x="${cx}" y="${cy-12}" text-anchor="middle"
        font-size="8" fill="#475569" letter-spacing="1.5" font-family="Inter,sans-serif">SPENT</text>
      <text x="${cx}" y="${cy+7}" text-anchor="middle"
        font-size="17" font-weight="900" fill="#f1f5f9" font-family="Inter,sans-serif">${totalFmt}</text>
      <text x="${cx}" y="${cy+20}" text-anchor="middle"
        font-size="7.5" fill="#334155" font-family="Inter,sans-serif">this period</text>

      <!-- icons on arc -->
      ${icons}

      <!-- % pill badges -->
      ${badges}
    </svg>

    <!-- legend -->
    <div style="display:flex;flex-direction:column;gap:4px;padding:2px 4px 4px">
      ${legend}
    </div>`;
}

// ── Doughnut: 50/30/20 Rule ──
function render5030Chart(txns) {
  const canvas = document.getElementById('dash-5030-chart');
  if (!canvas) return;
  const NEEDS=['Rent','EMI','Utilities','Bills','Insurance','Groceries','Health','Fuel','Transport'];
  const WANTS=['Entertainment','Shopping','Travel','Gifts','Food','Education'];
  const inc=txns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  if (!inc) return;
  let needs=0, wants=0;
  txns.filter(t=>t.type==='expense').forEach(t=>{if(NEEDS.includes(t.category))needs+=t.amount;else if(WANTS.includes(t.category))wants+=t.amount;});
  const totalExp=txns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const sav=Math.max(0,inc-totalExp);
  const np=needs/inc*100, wp=wants/inc*100, sp=sav/inc*100;
  const savRate=((inc-totalExp)/inc*100);
  const isLight=document.body.classList.contains('light');
  chartInstances['dash-5030']=new Chart(canvas,{
    type:'doughnut',
    data:{
      labels:['Needs','Wants','Savings'],
      datasets:[{
        data:[np,wp,Math.max(0,sp)],
        backgroundColor:['rgba(99,102,241,0.88)','rgba(245,158,11,0.88)','rgba(16,185,129,0.88)'],
        borderWidth:3,
        borderColor:isLight?'#fff':'rgba(13,17,35,0.9)',
        hoverOffset:12,hoverBorderWidth:0
      }]
    },
    options:{
      responsive:true,maintainAspectRatio:false,cutout:'66%',
      plugins:{
        legend:{position:'right',labels:{color:isLight?'#475569':'#94a3b8',font:{size:11,family:'Inter'},padding:14,boxWidth:10,usePointStyle:true,pointStyleWidth:8}},
        tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.toFixed(1)}%  (${ctx.label})`}}
      }
    },
    plugins:[{id:'donutCenter',beforeDraw(chart){
      const{ctx,chartArea:{left,right,top,bottom}}=chart;
      const cx=(left+right)/2, cy=(top+bottom)/2;
      ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
      const sr=savRate.toFixed(0);
      ctx.fillStyle=parseFloat(sr)<0?'#ef4444':parseFloat(sr)<10?'#f59e0b':'#10b981';
      ctx.font='bold 20px Inter'; ctx.fillText(sr+'%',cx,cy-8);
      ctx.fillStyle='#64748b'; ctx.font='10px Inter'; ctx.fillText('saved',cx,cy+10);
      ctx.restore();
    }}]
  });
}

// ── Polar Area: Spending by Category ──
function renderPolarCatChart(txns) {
  const canvas = document.getElementById('dash-polar-chart');
  if (!canvas) return;
  const catMap={};
  txns.filter(t=>t.type==='expense').forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+t.amount;});
  const cats=Object.entries(catMap).sort(([,a],[,b])=>b-a).slice(0,6);
  if (!cats.length) { canvas.parentElement.innerHTML='<p style="font-size:12px;color:#64748b;text-align:center;padding:40px 0">No expense data</p>'; return; }
  const COLORS=['rgba(99,102,241,0.82)','rgba(16,185,129,0.82)','rgba(245,158,11,0.82)','rgba(239,68,68,0.82)','rgba(236,72,153,0.82)','rgba(59,130,246,0.82)'];
  const isLight=document.body.classList.contains('light');
  chartInstances['dash-polar']=new Chart(canvas,{
    type:'polarArea',
    data:{
      labels:cats.map(([n])=>n),
      datasets:[{data:cats.map(([,v])=>v),backgroundColor:COLORS,borderWidth:0,borderColor:'transparent'}]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{
        legend:{position:'right',labels:{color:isLight?'#475569':'#94a3b8',font:{size:10,family:'Inter'},padding:10,boxWidth:8,usePointStyle:true}},
        tooltip:{callbacks:{label:ctx=>' ₹'+Math.round(ctx.parsed.r).toLocaleString('en-IN')}}
      },
      scales:{r:{ticks:{display:false},grid:{color:isLight?'rgba(0,0,0,0.06)':'rgba(255,255,255,0.07)'},pointLabels:{display:false}}}
    }
  });
}

// ── Radar: Life Score ──
function renderLifeScoreRadar(scores) {
  const canvas = document.getElementById('dash-radar-chart');
  if (!canvas) return;
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
