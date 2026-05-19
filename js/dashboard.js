let _dashPeriod = 'month';

function setDashPeriod(p) {
  _dashPeriod = p;
  renderDashboard();
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

// ===== DASHBOARD =====
function renderDashboard() {
  const scores = calcLifeScore();
  const insights = generateInsights();
  const txnsAll = STATE.transactions || [];
  const txns = filterTxByPeriod(txnsAll, _dashPeriod);
  const recent = [...txns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const totalIncome = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
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
          <button class="btn-primary btn-sm" onclick="navigate('finance')" style="background:linear-gradient(135deg,#00b09b,#0acf83)">+ Add Transaction</button>
          <span onclick="navigate('habits')" class="streak-badge"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:4px"><path d="M12 2c0 0-5 5-5 10a5 5 0 0 0 10 0c0-5-5-10-5-10z"/></svg>${STATE.streak || 0} Day Streak</span>
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

      <!-- Quick Stats — unique metrics (income/expense already in hero card) -->
      <div class="stat-grid" style="margin-bottom:20px">
        <div class="stat-card bg-teal" onclick="navigate('finance')" style="cursor:pointer">
          <span class="stat-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg></span>
          <div class="stat-card-value">${totalIncome > 0 ? Math.round((netWorth/totalIncome)*100) : 0}%</div>
          <div class="stat-card-label">Savings Rate ↗</div>
        </div>
        <div class="stat-card bg-indigo" onclick="navigate('investments')" style="cursor:pointer">
          <span class="stat-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="6" height="18" rx="1"/><rect x="9" y="8" width="6" height="13" rx="1"/><rect x="16" y="13" width="6" height="8" rx="1"/></svg></span>
          <div class="stat-card-value">${STATE.investments?.length || 0}</div>
          <div class="stat-card-label">All Assets ↗</div>
        </div>
        <div class="stat-card bg-emerald" onclick="navigate('goals')" style="cursor:pointer">
          <span class="stat-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></span>
          <div class="stat-card-value">${STATE.goals?.length || 0}</div>
          <div class="stat-card-label">Active Goals ↗</div>
        </div>
        <div class="stat-card bg-amber" onclick="navigate('habits')" style="cursor:pointer">
          <span class="stat-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></svg></span>
          <div class="stat-card-value">${habits.length > 0 ? Math.round(doneToday/habits.length*100) : 0}%</div>
          <div class="stat-card-label">Habits Today ↗</div>
        </div>
      </div>

      <!-- Life Score -->
      <div style="margin-bottom:20px">
        <div class="glass-card" style="padding:20px;cursor:pointer" onclick="navigate('analytics')">
          <div class="section-header">
            <p class="section-title"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:6px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Life Score</p>
            <span style="font-size:26px;font-weight:900;color:var(--teal)">${scores.overall}<span style="font-size:13px;font-weight:400;color:var(--text3)">/100</span></span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:15px">
            ${[
              { label:'Wealth',      icon:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>', val:scores.wealthScore,   page:'finance' },
              { label:'Health',      icon:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',  val:scores.healthScore,   page:'health' },
              { label:'Productivity',icon:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', val:scores.prodScore,     page:'habits' },
              { label:'Emotional',   icon:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>', val:scores.emotionalScore,page:'journal' },
            ].map(s => `
              <div onclick="event.stopPropagation();navigate('${s.page}')" style="cursor:pointer;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,0.03);border:1px solid var(--glass-border);transition:.15s" onmouseover="this.style.background='rgba(0,201,167,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px">
                  <span style="display:flex;align-items:center;gap:5px">${s.icon}${s.label}</span>
                  <span style="font-weight:700;color:${scoreBarColor(s.val)}">${s.val}% ↗</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width:${s.val}%;background:${scoreBarColor(s.val)}"></div></div>
              </div>`).join('')}
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
          <div style="height:200px;position:relative"><canvas id="dash-pie-chart"></canvas></div>
        </div>
      </div>

      <!-- 50/30/20 + Category breakdown row -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px" class="analytics-row-1">

          <!-- 50/30/20 Card -->
          <div class="glass-card" style="padding:20px">
            <p class="section-title" style="margin-bottom:14px">📐 50/30/20 Rule — ${new Date().toLocaleString('default',{month:'long'})}</p>
            ${(()=>{
              const NEEDS=['Rent','EMI','Utilities','Bills','Insurance','Groceries','Health','Fuel','Transport'];
              const WANTS=['Entertainment','Shopping','Travel','Gifts','Food','Education'];
              const inc=txns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
              let needs=0,wants=0;
              txns.filter(t=>t.type==='expense').forEach(t=>{if(NEEDS.includes(t.category))needs+=t.amount;else if(WANTS.includes(t.category))wants+=t.amount;});
              const totalExp=txns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
              const sav=inc-totalExp;
              const np=inc>0?(needs/inc*100).toFixed(1):0,wp=inc>0?(wants/inc*100).toFixed(1):0,sp=inc>0?(sav/inc*100).toFixed(1):0;
              if(!inc) return `<p style="font-size:12px;color:var(--text3);text-align:center;padding:20px 0">Add income transactions to see analysis</p>`;
              const bar=(p,target,col)=>`<div style="height:7px;border-radius:4px;background:var(--glass-border);margin-top:4px"><div style="height:7px;border-radius:4px;width:${Math.min(100,Math.abs(p))}%;background:${parseFloat(p)>(target+0.1)?'#ef4444':col};transition:.4s"></div></div>`;
              return [
                {l:'Needs',p:np,t:50,c:'#6366f1',a:fmt(needs)},
                {l:'Wants',p:wp,t:30,c:'#f59e0b',a:fmt(wants)},
                {l:'Savings',p:sp,t:20,c:'#10b981',a:fmt(sav)},
              ].map(r=>`<div style="margin-bottom:12px">
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">
                  <span style="color:var(--text2)">${r.l} <span style="color:var(--text3)">(target ${r.t}%)</span></span>
                  <span style="font-weight:700;color:${parseFloat(r.p)>(r.l==='Savings'?r.t-1:r.t)?'#ef4444':'#10b981'}">${r.p}% · ${r.a}</span>
                </div>${bar(r.p,r.t,r.c)}
              </div>`).join('');
            })()}
          </div>

          <!-- Category Table -->
          <div class="glass-card" style="padding:20px">
            <p class="section-title" style="margin-bottom:14px">🔍 Spending by Category</p>
            ${(()=>{
              const catMap={};
              txns.filter(t=>t.type==='expense').forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+t.amount;});
              const cats=Object.entries(catMap).sort(([,a],[,b])=>b-a).slice(0,6);
              const inc=txns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
              if(!cats.length) return `<p style="font-size:12px;color:var(--text3);text-align:center;padding:20px 0">No expense data for this period</p>`;
              return `<div style="display:flex;flex-direction:column;gap:7px">${cats.map(([cat,amt],i)=>{
                const pct=inc>0?(amt/inc*100).toFixed(1):0;
                const colors=['#6366f1','#10b981','#f59e0b','#ef4444','#ec4899','#3b82f6'];
                return `<div style="display:flex;align-items:center;gap:10px">
                  <span style="font-size:11px;color:var(--text3);width:14px;text-align:right">${i+1}</span>
                  <div style="flex:1">
                    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
                      <span style="color:var(--text2)">${cat}</span>
                      <span style="font-weight:700">${fmt(amt)} <span style="color:var(--text3);font-weight:400">${pct}%</span></span>
                    </div>
                    <div style="height:4px;border-radius:3px;background:var(--glass-border)"><div style="height:4px;border-radius:3px;width:${Math.min(100,pct)}%;background:${colors[i]};transition:.4s"></div></div>
                  </div>
                </div>`;
              }).join('')}</div>`;
            })()}
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
  }

  // Render net worth chart after DOM is ready
  setTimeout(() => {
    renderNetWorthChart(txnsAll);
    renderDashIncomeChart(txns);
    renderDashPieChart(txns);
    if (window.innerWidth < 700) {
      const r1 = document.querySelector('.analytics-row-1');
      if (r1) r1.style.gridTemplateColumns = '1fr';
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
  const monthMap = {};
  txns.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (!monthMap[key]) monthMap[key] = { label, income: 0, expense: 0 };
    if (t.type === 'income') monthMap[key].income += t.amount;
    else monthMap[key].expense += t.amount;
  });
  const sorted = Object.entries(monthMap).sort(([a],[b]) => a.localeCompare(b)).slice(-6);
  const labels = sorted.map(([,v]) => v.label);
  const incData = sorted.map(([,v]) => v.income);
  const expData = sorted.map(([,v]) => v.expense);
  if (!labels.length) { labels.push('Now'); incData.push(0); expData.push(0); }
  const isLight = document.body.classList.contains('light');
  const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
  chartInstances['dash-income'] = new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets: [
      { label: 'Income',  data: incData, backgroundColor: 'rgba(16,185,129,0.75)', borderRadius: 6, borderSkipped: false },
      { label: 'Expense', data: expData, backgroundColor: 'rgba(239,68,68,0.75)',  borderRadius: 6, borderSkipped: false }
    ]},
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, padding: 10 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString('en-IN')}` } } },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: gridColor } },
        y: { ticks: { color: '#64748b', font: { size: 11 }, callback: v => `₹${v>=100000?(v/100000).toFixed(1)+'L':v>=1000?(v/1000).toFixed(0)+'k':v}` }, grid: { color: gridColor } }
      }
    }
  });
}

function renderDashPieChart(txns) {
  const canvas = document.getElementById('dash-pie-chart');
  if (!canvas) return;
  const catMap = {};
  txns.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });
  const topCats = Object.entries(catMap).sort(([,a],[,b]) => b - a).slice(0, 6);
  if (!topCats.length) return;
  const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
  chartInstances['dash-pie'] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: topCats.map(([name]) => name),
      datasets: [{ data: topCats.map(([,v]) => v), backgroundColor: COLORS, borderWidth: 2, borderColor: 'rgba(15,15,35,0.5)', hoverOffset: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter', size: 10 }, padding: 8, boxWidth: 8 } },
        tooltip: { callbacks: { label: ctx => ` ₹${ctx.parsed.toLocaleString('en-IN')}` } }
      }
    }
  });
}
