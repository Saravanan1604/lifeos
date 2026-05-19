// ===== ACHIEVEMENTS =====
const ACHIEVEMENTS_DEF = [
  { id:'first_tx', emoji:'🌱', title:'First Step', desc:'Log your first transaction', xp:100, check:s=>s.transactions?.length>=1 },
  { id:'ten_tx', emoji:'💳', title:'Tracking Pro', desc:'Log 10 transactions', xp:200, check:s=>s.transactions?.length>=10 },
  { id:'first_habit', emoji:'🔥', title:'Habit Starter', desc:'Create your first habit', xp:100, check:s=>s.habits?.length>=1 },
  { id:'streak_7', emoji:'🌟', title:'Week Warrior', desc:'7-day streak', xp:300, check:s=>s.streak>=7 },
  { id:'streak_30', emoji:'👑', title:'Consistency King', desc:'30-day streak', xp:1000, check:s=>s.streak>=30 },
  { id:'first_goal', emoji:'🚀', title:'Goal Setter', desc:'Create your first goal', xp:150, check:s=>s.goals?.length>=1 },
  { id:'goal_done', emoji:'🏆', title:'Goal Crusher', desc:'Complete a goal', xp:500, check:s=>s.goals?.some(g=>g.current>=g.target) },
  { id:'first_inv', emoji:'📈', title:'Investor', desc:'Track your first investment', xp:200, check:s=>s.investments?.length>=1 },
  { id:'health_7', emoji:'💪', title:'Health Conscious', desc:'Log health for 7 days', xp:300, check:s=>s.healthEntries?.length>=7 },
  { id:'skill_5', emoji:'🎓', title:'Skill Builder', desc:'Add 5 skills', xp:250, check:s=>s.skills?.length>=5 },
  { id:'journal_7', emoji:'😊', title:'Self Aware', desc:'Journal for 7 days', xp:300, check:s=>s.emotionEntries?.length>=7 },
  { id:'lakh_saver', emoji:'💰', title:'Lakh Club', desc:'Save ₹1,00,000', xp:1000, check:s=>{const i=s.transactions?.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0)||0;const e=s.transactions?.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0)||0;return(i-e)>=100000;} },
  { id:'lvl5', emoji:'⚡', title:'Level 5', desc:'Reach Level 5', xp:500, check:s=>s.level>=5 },
  { id:'all_modules', emoji:'🌐', title:'Life OS User', desc:'Use all 10 modules', xp:1000, check:s=>s.transactions?.length>0&&s.habits?.length>0&&s.goals?.length>0&&s.healthEntries?.length>0&&s.skills?.length>0&&s.emotionEntries?.length>0 },
];

function checkAchievements() {
  STATE.unlockedAchievements = STATE.unlockedAchievements || [];
  let newUnlocks = 0;
  ACHIEVEMENTS_DEF.forEach(a => {
    if (!STATE.unlockedAchievements.includes(a.id) && a.check(STATE)) {
      STATE.unlockedAchievements.push(a.id);
      addXP(a.xp, `Achievement: ${a.title}`);
      setTimeout(() => toast(`🏆 Achievement Unlocked: ${a.title}! +${a.xp} XP`, 'success'), newUnlocks * 1500);
      newUnlocks++;
    }
  });
  if (newUnlocks) saveState();
}

function renderAchievements() {
  const unlocked = STATE.unlockedAchievements || [];
  const totalXP = ACHIEVEMENTS_DEF.filter(a => unlocked.includes(a.id)).reduce((s, a) => s + a.xp, 0);

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header"><h1 class="page-title">🏆 Achievements</h1><p class="page-subtitle">Earn XP and unlock badges by using LifeOS</p></div>
      <div class="stat-grid">
        <div class="stat-card bg-gold"><span class="stat-card-icon">🏆</span><div class="stat-card-value">${unlocked.length}</div><div class="stat-card-label">Badges Earned</div></div>
        <div class="stat-card bg-indigo"><span class="stat-card-icon">⚡</span><div class="stat-card-value">${STATE.xp||0}</div><div class="stat-card-label">Total XP</div></div>
        <div class="stat-card bg-purple"><span class="stat-card-icon">🎮</span><div class="stat-card-value">Level ${STATE.level||1}</div><div class="stat-card-label">Current Level</div></div>
        <div class="stat-card bg-amber"><span class="stat-card-icon">🔥</span><div class="stat-card-value">${STATE.streak||0}</div><div class="stat-card-label">Day Streak</div></div>
      </div>

      <!-- XP Progress -->
      <div class="glass-card" style="padding:20px;margin-bottom:20px">
        <div class="section-header"><p class="section-title">⚡ XP Progress</p><span style="font-weight:700;color:#fbbf24">Level ${STATE.level||1}</span></div>
        ${['Beginner','Explorer','Achiever','Warrior','Champion','Legend','Master','Grandmaster','Elite','Life OS Pro'].map((n,i)=>`
          <div style="display:flex;align-items:center;gap:12px;padding:7px 8px;border-radius:10px;background:${(STATE.level||1)>i?'rgba(99,102,241,0.1)':'transparent'}">
            <span style="width:22px;height:22px;border-radius:50%;background:${(STATE.level||1)>i?'linear-gradient(135deg,#6366f1,#8b5cf6)':'rgba(148,163,184,0.2)'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;color:${(STATE.level||1)>i?'#fff':'var(--text3)'}">${(STATE.level||1)>i?'✓':i+1}</span>
            <span style="font-size:13px;font-weight:${(STATE.level||1)>i?'600':'400'};color:${(STATE.level||1)>i?'var(--text)':'var(--text3)'}">${n}</span>
            <span style="font-size:11px;color:var(--text3);margin-left:auto">${(i+1)*1000} XP</span>
          </div>`).join('')}
      </div>

      <!-- Badges -->
      <div class="achievement-grid">
        ${ACHIEVEMENTS_DEF.map(a => {
          const isUnlocked = unlocked.includes(a.id);
          return `<div class="achievement-card ${isUnlocked?'unlocked':'locked'}" title="${a.desc}">
            <span class="achievement-icon">${a.emoji}</span>
            <div class="achievement-title">${a.title}</div>
            <div class="achievement-desc">${a.desc}</div>
            <div class="achievement-xp">+${a.xp} XP ${isUnlocked?'✓':''}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

// ===== AI DATA ENGINE =====

function _monthData(offset) {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + offset);
  const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const txns = (STATE.transactions||[]).filter(t=>(t.date||'').startsWith(key));
  const income  = txns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense = txns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  return { key, income, expense, savings: income-expense, txns };
}

function _pctChg(curr, prev) {
  if (!prev && !curr) return '0%';
  if (!prev) return '+100%';
  const p = ((curr-prev)/prev*100).toFixed(1);
  return (p>0?'+':'')+p+'%';
}
function _arrow(curr, prev) { return curr>prev?'↑':curr<prev?'↓':'→'; }
function _arrowColor(curr, prev, higherIsBetter=true) {
  if (curr===prev) return '#94a3b8';
  return (curr>prev)===higherIsBetter ? '#10b981' : '#ef4444';
}

const NEEDS_CATS = ['Rent','EMI','Utilities','Bills','Insurance','Groceries','Health','Fuel','Transport'];
const WANTS_CATS = ['Entertainment','Shopping','Travel','Gifts','Food','Education'];

function _503020() {
  const curr = _monthData(0);
  let needs=0, wants=0;
  curr.txns.filter(t=>t.type==='expense').forEach(t=>{
    if (NEEDS_CATS.includes(t.category)) needs+=t.amount;
    else if (WANTS_CATS.includes(t.category)) wants+=t.amount;
  });
  const totalExp = curr.txns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const other = totalExp - needs - wants;
  const inc = curr.income;
  return {
    income: inc, needs, wants, other, totalExp,
    savings: curr.savings,
    needsPct:   inc>0?(needs/inc*100).toFixed(1):0,
    wantsPct:   inc>0?(wants/inc*100).toFixed(1):0,
    savingsPct: inc>0?(curr.savings/inc*100).toFixed(1):0,
    targetNeeds:  inc*0.5, targetWants: inc*0.3, targetSavings: inc*0.2,
  };
}

function _emergencyFund() {
  let totalExp=0, months=0;
  for (let i=-6;i<0;i++) { const d=_monthData(i); if(d.expense>0){totalExp+=d.expense;months++;} }
  const avgExp = months>0 ? totalExp/months : 0;
  const target = avgExp*6;
  const goal = (STATE.goals||[]).find(g=>g.name?.toLowerCase().includes('emergency'));
  const saved = goal?.current||0;
  return { avgExp, target, saved, monthsCovered: avgExp>0?(saved/avgExp).toFixed(1):0, goal };
}

function _catBreakdown(monthOffset=0) {
  const d = _monthData(monthOffset);
  const inc = d.income;
  const catMap = {};
  d.txns.filter(t=>t.type==='expense').forEach(t=>{ catMap[t.category]=(catMap[t.category]||0)+t.amount; });
  return Object.entries(catMap).sort(([,a],[,b])=>b-a).map(([cat,amt])=>({
    cat, amt, pct: inc>0?(amt/inc*100).toFixed(1):0
  }));
}

function _buildComparisonWidget() {
  const curr = _monthData(0), prev = _monthData(-1);
  const rows = [
    { label:'Income',  curr:curr.income,  prev:prev.income,  good:true },
    { label:'Expense', curr:curr.expense, prev:prev.expense, good:false },
    { label:'Savings', curr:curr.savings, prev:prev.savings, good:true },
  ];
  return rows.map(r=>{
    const chg = _pctChg(r.curr, r.prev);
    const col = _arrowColor(r.curr, r.prev, r.good);
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--glass-border)">
      <span style="font-size:12px;color:var(--text2)">${r.label}</span>
      <div style="text-align:right">
        <div style="font-size:13px;font-weight:700">${fmt(r.curr)}</div>
        <div style="font-size:10px;color:${col}">${_arrow(r.curr,r.prev)} ${chg} vs last</div>
      </div>
    </div>`;
  }).join('');
}

function _build503020Widget() {
  const r = _503020();
  if (!r.income) return `<p style="font-size:12px;color:var(--text3);text-align:center;padding:8px 0">Add income to see 50/30/20</p>`;
  const bar = (pct, target, color) => {
    const over = parseFloat(pct) > target;
    return `<div style="height:5px;border-radius:3px;background:var(--glass-border);margin-top:3px"><div style="height:5px;border-radius:3px;width:${Math.min(100,pct)}%;background:${over?'#ef4444':color}"></div></div>`;
  };
  return [
    { label:'Needs', pct:r.needsPct,   target:50, color:'#6366f1' },
    { label:'Wants', pct:r.wantsPct,   target:30, color:'#f59e0b' },
    { label:'Saves', pct:r.savingsPct, target:20, color:'#10b981' },
  ].map(s=>`<div style="margin-bottom:8px">
    <div style="display:flex;justify-content:space-between;font-size:11px">
      <span style="color:var(--text2)">${s.label} <span style="color:var(--text3)">(${s.target}%)</span></span>
      <span style="font-weight:700;color:${parseFloat(s.pct)>(s.label==='Saves'?s.target-1:s.target)?'#ef4444':'#10b981'}">${s.pct}%</span>
    </div>${bar(s.pct, s.target, s.color)}
  </div>`).join('');
}

// ===== AI COACH =====
function renderAICoach() {
  const history = STATE.chatHistory || [];
  const curr = _monthData(0), prev = _monthData(-1);
  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header"><h1 class="page-title">🧠 AI Data Coach</h1><p class="page-subtitle">Data-driven insights & financial rule analysis</p></div>
      <div style="display:grid;grid-template-columns:1fr 300px;gap:20px" class="ai-layout">

        <!-- Chat -->
        <div class="glass-card" style="overflow:hidden;display:flex;flex-direction:column;min-height:520px">
          <div style="padding:14px 20px;border-bottom:1px solid var(--glass-border)">
            <p class="section-title">💬 Data Engineer Chat</p>
            <p style="font-size:12px;color:var(--text3);margin-top:2px">Ask for comparisons, rule checks, category deep-dives & investment advice</p>
          </div>
          <div class="chat-messages" id="chat-messages">
            ${history.length===0
              ? `<div class="chat-msg ai" style="white-space:pre-line">👋 Hi! I'm your AI Data Coach — I think like a data engineer.

I can run:
📊 Month-over-month comparisons
📐 50/30/20 budget rule check
🛡️ Emergency fund analysis
🔍 Category spend breakdown
📈 Investment allocation advice
🎯 Goal & habit tracking

What would you like to analyse?</div>`
              : history.map(m=>`<div class="chat-msg ${m.role}" style="white-space:pre-line">${m.content}</div>`).join('')}
          </div>
          <div class="chat-input-row">
            <input type="text" id="chat-input" class="chat-input" placeholder="e.g. Compare this vs last month..." onkeydown="if(event.key==='Enter')sendAIMessage()"/>
            <button class="btn-primary btn-sm" onclick="sendAIMessage()">Send →</button>
          </div>
        </div>

        <!-- Right Sidebar -->
        <div style="display:flex;flex-direction:column;gap:12px">

          <!-- MoM Snapshot -->
          <div class="glass-card" style="padding:16px">
            <p class="section-title" style="margin-bottom:10px">📊 Month Comparison</p>
            ${_buildComparisonWidget()}
          </div>

          <!-- 50/30/20 Live -->
          <div class="glass-card" style="padding:16px">
            <p class="section-title" style="margin-bottom:10px">📐 50/30/20 Rule</p>
            ${_build503020Widget()}
          </div>

          <!-- Quick Prompts -->
          <div class="glass-card" style="padding:16px">
            <p class="section-title" style="margin-bottom:10px">⚡ Quick Analysis</p>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${[
                ['📊','Compare this vs last month'],
                ['📐','Run 50/30/20 rule check'],
                ['🛡️','Check my emergency fund'],
                ['🔍','Show category breakdown'],
                ['📈','Give investment advice'],
                ['💰','Full financial health report'],
                ['🎯','How are my goals going?'],
                ['🔥','Check my habit streaks'],
              ].map(([icon,p])=>`<button class="btn-secondary btn-sm" onclick="quickPrompt('${p}')" style="text-align:left;justify-content:flex-start;gap:6px;font-size:11px">${icon} ${p}</button>`).join('')}
            </div>
          </div>

          <!-- Daily Tip -->
          <div class="glass-card" style="padding:16px">
            <p class="section-title" style="margin-bottom:8px">🌟 Rule of the Day</p>
            <p style="font-size:12px;color:var(--text2);line-height:1.6">${getDailyTip()}</p>
          </div>
        </div>
      </div>
    </div>`;

  if (window.innerWidth < 700) {
    const el = document.querySelector('.ai-layout');
    if (el) el.style.gridTemplateColumns = '1fr';
  }
  scrollChat();
}

function getDailyTip() {
  const tips = [
    '📐 50/30/20 Rule: 50% needs, 30% wants, 20% savings/investments.',
    '🛡️ Emergency Fund: Keep 6 months of expenses liquid in a savings account.',
    '📈 Rule of 72: Divide 72 by your return rate to know when money doubles (72÷12% = 6 years).',
    '💳 Debt Rule: Never let EMIs exceed 40% of monthly income.',
    '🔥 Pay Yourself First: Invest 20% of income the day salary arrives — before spending.',
    '📊 Zero-Based Budget: Every rupee must have a job. Assign all income to needs/wants/savings.',
    '🏦 High-Interest Trap: Credit card interest (36-42% pa) destroys wealth faster than any investment builds it.',
    '🎯 Goal-Based Investing: Each financial goal needs a separate fund with a deadline and target.',
  ];
  return tips[new Date().getDate() % tips.length];
}

function getAIResponse(message) {
  const msg = message.toLowerCase();
  const curr = _monthData(0), prev = _monthData(-1);
  const txnsAll = STATE.transactions || [];
  const goals = STATE.goals || [];
  const health = STATE.healthEntries || [];
  const habits = STATE.habits || [];
  const comps = STATE.habitCompletions || [];
  const todayDone = comps.filter(c=>c.date===today()).length;

  // ── Month-over-month comparison ──
  if (msg.includes('compar') || msg.includes('last month') || msg.includes('vs') || msg.includes('month over') || msg.includes('trend')) {
    if (!curr.income && !prev.income) return `📊 No financial data found. Add transactions to enable period comparisons.`;
    const cats0 = _catBreakdown(0), cats1 = _catBreakdown(-1);
    const topCurrCat = cats0[0], topPrevCat = cats1[0];
    return `📊 Month-over-Month Report
━━━━━━━━━━━━━━━━━━━━━━━━━
Metric      This Month    Last Month    Δ
─────────────────────────────────────────
Income     ${fmt(curr.income).padStart(10)}  ${fmt(prev.income).padStart(10)}  ${_arrow(curr.income,prev.income)} ${_pctChg(curr.income,prev.income)}
Expense    ${fmt(curr.expense).padStart(10)}  ${fmt(prev.expense).padStart(10)}  ${_arrow(curr.expense,prev.expense)} ${_pctChg(curr.expense,prev.expense)}
Savings    ${fmt(curr.savings).padStart(10)}  ${fmt(prev.savings).padStart(10)}  ${_arrow(curr.savings,prev.savings)} ${_pctChg(curr.savings,prev.savings)}
━━━━━━━━━━━━━━━━━━━━━━━━━

Top spend this month: ${topCurrCat?topCurrCat.cat+' ('+fmt(topCurrCat.amt)+')':'—'}
Top spend last month: ${topPrevCat?topPrevCat.cat+' ('+fmt(topPrevCat.amt)+')':'—'}

${curr.expense > prev.expense
  ? `⚠️ Expenses rose ${_pctChg(curr.expense,prev.expense)}. Biggest driver: ${topCurrCat?.cat||'Unknown'}. Target a 10% cut = ${fmt(curr.expense*0.1)} saved.`
  : `✅ Expenses down ${_pctChg(curr.expense,prev.expense)} — great cost control!`}
${curr.savings > prev.savings
  ? `🚀 Savings improved by ${fmt(curr.savings-prev.savings)} — excellent!`
  : curr.savings < prev.savings
  ? `⚠️ Savings fell by ${fmt(prev.savings-curr.savings)}. Review discretionary spending.`
  : `→ Savings unchanged.`}`;
  }

  // ── 50/30/20 Rule ──
  if (msg.includes('50') || msg.includes('rule') || msg.includes('budget') || msg.includes('allocat') || msg.includes('50/30') || msg.includes('503020')) {
    const r = _503020();
    if (!r.income) return `📐 Add income transactions this month to run the 50/30/20 analysis.`;
    const mn = new Date().toLocaleString('default',{month:'long'});
    const needsOk = parseFloat(r.needsPct)<=50, wantsOk = parseFloat(r.wantsPct)<=30, savOk = parseFloat(r.savingsPct)>=20;
    return `📐 50/30/20 Budget Analysis — ${mn}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Category    Actual   Target   Status   Gap
──────────────────────────────────────────
Needs       ${r.needsPct}%    50%     ${needsOk?'✅ OK   ':'⚠️ OVER '} ${needsOk?fmt(r.targetNeeds-r.needs)+' room':fmt(r.needs-r.targetNeeds)+' over'}
Wants       ${r.wantsPct}%    30%     ${wantsOk?'✅ OK   ':'⚠️ OVER '} ${wantsOk?fmt(r.targetWants-r.wants)+' room':fmt(r.wants-r.targetWants)+' over'}
Savings     ${r.savingsPct}%    20%     ${savOk?'✅ OK   ':'❌ LOW  '} ${savOk?fmt(r.savings-r.targetSavings)+' surplus':fmt(r.targetSavings-r.savings)+' short'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Income: ${fmt(r.income)} | Total spend: ${fmt(r.totalExp)}

${!savOk ? `🎯 Action Plan:
• Need ${fmt(r.targetSavings-r.savings)} more in savings
• ${!wantsOk?`Cut Wants by ${fmt(r.wants-r.targetWants)} (reduce entertainment/shopping)`:''}
• ${!needsOk?`Renegotiate Needs — rent/EMI/bills eating too much`:''}`
: `🚀 You're following the 50/30/20 rule! Invest the ${fmt(r.savings-r.targetSavings)} surplus.`}`;
  }

  // ── Emergency Fund ──
  if (msg.includes('emergency') || msg.includes('fund') || msg.includes('safety') || msg.includes('liquid')) {
    const ef = _emergencyFund();
    if (!ef.avgExp) return `🛡️ Log at least 1 month of expenses so I can size your emergency fund.`;
    const pct = ef.target>0?Math.min(100,(ef.saved/ef.target*100).toFixed(1)):0;
    const status = ef.monthsCovered>=6?'✅ FULLY FUNDED':ef.monthsCovered>=3?'⚡ PARTIAL':'❌ CRITICAL';
    return `🛡️ Emergency Fund Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━
Avg monthly expenses: ${fmt(ef.avgExp)}
6-month target:       ${fmt(ef.target)}
Currently saved:      ${fmt(ef.saved)}
Coverage:             ${ef.monthsCovered} months
Status:               ${status}
Progress:             ${pct}%
━━━━━━━━━━━━━━━━━━━━━━━━━
${ef.monthsCovered>=6
  ? `✅ Emergency fund complete! Redirect surplus ${fmt(ef.saved-ef.target)} to investments.`
  : `❌ Shortfall: ${fmt(ef.target-ef.saved)} remaining.
Monthly target to complete in ${Math.ceil((ef.target-ef.saved)/(ef.avgExp*0.2))} months: ${fmt(ef.avgExp*0.2)}

💡 Rule: Build emergency fund BEFORE any investment.
${!ef.goal?`→ Create a Goal "Emergency Fund" with target ${fmt(ef.target)} to track this.`:'→ Keep saving to your Emergency Fund goal!'}`}`;
  }

  // ── Category breakdown ──
  if (msg.includes('categor') || msg.includes('breakdown') || msg.includes('where') || msg.includes('top spend') || msg.includes('spend')) {
    const cats = _catBreakdown(0);
    if (!cats.length) return `🔍 No expense transactions this month. Start logging to see your breakdown.`;
    const totalExp = cats.reduce((s,c)=>s+c.amt,0);
    const curr2 = _monthData(0);
    const top = cats[0];
    return `🔍 Spending Breakdown — ${new Date().toLocaleString('default',{month:'long'})}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total expenses: ${fmt(totalExp)} | Income: ${fmt(curr2.income)}

#  Category        Amount       % of Income  Type
───────────────────────────────────────────────
${cats.slice(0,8).map((c,i)=>`${String(i+1).padEnd(2)} ${c.cat.padEnd(15)} ${fmt(c.amt).padStart(10)}   ${String(c.pct+'%').padEnd(10)}   ${NEEDS_CATS.includes(c.cat)?'Need':WANTS_CATS.includes(c.cat)?'Want':'Other'}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ Top: ${top.cat} = ${top.pct}% of income
${parseFloat(top.pct)>20?`💡 Reduce ${top.cat} by 20% → save ${fmt(top.amt*0.2)}/month (${fmt(top.amt*2.4)}/year)`:'✅ Top category within healthy range.'}`;
  }

  // ── Investment advice ──
  if (msg.includes('invest') || msg.includes('sip') || msg.includes('mutual') || msg.includes('stock') || msg.includes('wealth') || msg.includes('portfolio')) {
    const r = _503020();
    const ef = _emergencyFund();
    const surplus = Math.max(0, r.savings);
    return `📈 Investment Roadmap
━━━━━━━━━━━━━━━━━━━━━━━━━
Monthly surplus: ${fmt(surplus)}

PRIORITY ORDER (follow strictly):
1️⃣  Emergency Fund (6 months) — ${ef.monthsCovered>=6?'✅ Done':'❌ Not complete (do first)'}
2️⃣  High-interest debt (CC at 36% pa) — pay off immediately
3️⃣  PPF — ₹1.5L/year, tax-free at 7.1%
4️⃣  ELSS — ₹1.5L/year, 80C deduction, 3yr lock
5️⃣  Index Fund SIP — Nifty 50, low cost, 12% CAGR
6️⃣  NPS — extra ₹50K deduction (80CCD)
7️⃣  Direct stocks — only after above are set

SUGGESTED SPLIT (${fmt(surplus)}/month):
• Emergency/Debt:   ${fmt(surplus*0.4)} (40%)
• ELSS/PPF:         ${fmt(surplus*0.3)} (30%)
• Index Fund SIP:   ${fmt(surplus*0.2)} (20%)
• Direct stocks:    ${fmt(surplus*0.1)} (10%)

💡 Rule of 72: At 12% returns → money doubles in 6 yrs
💡 SIP of ${fmt(5000)}/month for 20 years @12% = ₹49.9L`;
  }

  // ── Full financial report ──
  if (msg.includes('financ') || msg.includes('money') || msg.includes('saving') || msg.includes('report') || msg.includes('health report')) {
    if (!curr.income && !txnsAll.length) return `📊 No data yet. Add transactions in Finance to unlock your health report!`;
    const r = _503020();
    const ef = _emergencyFund();
    const cats = _catBreakdown(0);
    return `💰 Financial Health Report
━━━━━━━━━━━━━━━━━━━━━━━━━
📅 THIS MONTH
Income:   ${fmt(curr.income)}
Expense:  ${fmt(curr.expense)}
Savings:  ${fmt(curr.savings)} (${r.savingsPct}%)

📊 vs LAST MONTH
Income:  ${_arrow(curr.income,prev.income)} ${_pctChg(curr.income,prev.income)}
Expense: ${_arrow(curr.expense,prev.expense)} ${_pctChg(curr.expense,prev.expense)}
Savings: ${_arrow(curr.savings,prev.savings)} ${_pctChg(curr.savings,prev.savings)}

📐 50/30/20 RULE
Needs:   ${r.needsPct}% ${parseFloat(r.needsPct)<=50?'✅':'⚠️ over 50%'}
Wants:   ${r.wantsPct}% ${parseFloat(r.wantsPct)<=30?'✅':'⚠️ over 30%'}
Savings: ${r.savingsPct}% ${parseFloat(r.savingsPct)>=20?'✅':'❌ below 20%'}

🛡️ EMERGENCY FUND
Coverage: ${ef.monthsCovered} months ${ef.monthsCovered>=6?'✅':'❌ need 6'}
Shortfall: ${ef.monthsCovered>=6?'None':fmt(ef.target-ef.saved)}

🔍 TOP SPEND: ${cats[0]?cats[0].cat+' '+fmt(cats[0].amt)+' ('+cats[0].pct+'%)':'No data'}

🎯 NEXT ACTION
${parseFloat(r.savingsPct)<20
  ? `→ Boost savings by ${fmt(r.targetSavings-r.savings)}/month`
  : ef.monthsCovered<6
  ? `→ Build emergency fund: ${fmt(ef.target-ef.saved)} more needed`
  : `→ Invest surplus ${fmt(r.savings-r.targetSavings)} in index funds`}`;
  }

  // ── Sleep / health ──
  if (msg.includes('sleep') || msg.includes('health')) {
    const avgSleep = health.length?(health.slice(-7).reduce((s,e)=>s+(e.sleep||7),0)/Math.min(7,health.length)).toFixed(1):null;
    if (!avgSleep) return `😴 No health data. Log sleep, steps, and mood in Health Hub daily for trend analysis.`;
    const last7 = health.slice(-7);
    const avgMood = last7.length?(last7.reduce((s,e)=>s+(e.mood||5),0)/last7.length).toFixed(1):null;
    return `🏥 Health Data Report
━━━━━━━━━━━━━━━━━━
Avg sleep (7d): ${avgSleep} hrs  ${parseFloat(avgSleep)>=7?'✅':'⚠️ below 7hrs'}
Avg mood (7d):  ${avgMood||'—'}/10  ${avgMood&&parseFloat(avgMood)>=7?'✅':'⚡ room to improve'}

Sleep quality benchmark:
• < 6h → cognitive decline, poor decisions
• 6-7h → sub-optimal, impacts productivity
• 7-9h → ✅ optimal recovery zone
• > 9h → oversleeping, check for burnout

${parseFloat(avgSleep)<7?`💡 Sleep debt costs: reduced focus, higher impulsive spending, lower productivity. Going to bed 30 min earlier adds 3.5h/week.`:'✅ Your sleep is in the healthy range!'}`;
  }

  // ── Goals ──
  if (msg.includes('goal') || msg.includes('target')) {
    if (!goals.length) return `🎯 No goals yet! Start with:\n1. Emergency Fund — ${fmt(_emergencyFund().target)} target\n2. A savings goal\n3. A health milestone\n\nGo to Goals → Add Goal.`;
    const done = goals.filter(g=>g.current>=g.target).length;
    const active = goals.filter(g=>g.current<g.target);
    return `🎯 Goals Summary
━━━━━━━━━━━━━━━━━━
Total: ${goals.length} | Completed: ${done} | Active: ${active.length}

${active.slice(0,5).map(g=>{
  const pct = g.target>0?Math.round(g.current/g.target*100):0;
  const bar = '█'.repeat(Math.round(pct/10))+'░'.repeat(10-Math.round(pct/10));
  return `${g.emoji} ${g.name}\n   [${bar}] ${pct}% — ${fmt(g.current)} / ${fmt(g.target)}`;
}).join('\n\n')}

${done>0?`🏆 ${done} goal(s) crushed!`:'Keep pushing — consistency compounds!'}`;
  }

  // ── Habits ──
  if (msg.includes('habit') || msg.includes('streak')) {
    if (!habits.length) return `🔥 No habits created. Start with 2-3 small daily habits — consistency beats intensity.`;
    return `🔥 Habit Tracker
━━━━━━━━━━━━━━━━━━
Active habits: ${habits.length}
Done today:    ${todayDone}/${habits.length} (${habits.length>0?Math.round(todayDone/habits.length*100):0}%)
Streak:        ${STATE.streak||0} days

${STATE.streak>=30?'👑 30+ day streak — you\'ve built a real habit!':STATE.streak>=7?'🔥 7+ days — momentum is building!':STATE.streak>=3?'💪 3+ days — keep going!':'🌱 Start your streak today!'}

💡 Habit science: 66 days average to form a habit. You're ${STATE.streak||0}/66 days in.`;
  }

  // ── Achievements ──
  if (msg.includes('achiev') || msg.includes('badge') || msg.includes('close') || msg.includes('xp')) {
    const unlocked = STATE.unlockedAchievements || [];
    const next = ACHIEVEMENTS_DEF.filter(a=>!unlocked.includes(a.id)).slice(0,3);
    if (!next.length) return `🏆 All ${ACHIEVEMENTS_DEF.length} achievements unlocked! You're a LifeOS Master!`;
    return `🏆 Next Achievements
━━━━━━━━━━━━━━━━━━
${next.map(a=>`${a.emoji} ${a.title} (+${a.xp} XP)\n   ${a.desc}`).join('\n\n')}

Total XP available: ${next.reduce((s,a)=>s+a.xp,0)}`;
  }

  return `🧠 I'm your AI Data Coach. Try asking:

• "Compare this vs last month"
• "Run 50/30/20 rule check"
• "Check my emergency fund"
• "Show category breakdown"
• "Give investment advice"
• "Full financial health report"
• "How are my goals going?"`;
}

function sendAIMessage() {
  const input = document.getElementById('chat-input');
  const msg = input?.value?.trim();
  if (!msg) return;
  input.value = '';
  STATE.chatHistory = STATE.chatHistory || [];
  STATE.chatHistory.push({ role: 'user', content: msg });
  const response = getAIResponse(msg);
  STATE.chatHistory.push({ role: 'ai', content: response });
  if (STATE.chatHistory.length > 40) STATE.chatHistory = STATE.chatHistory.slice(-40);
  saveState();
  const chatEl = document.getElementById('chat-messages');
  if (chatEl) {
    chatEl.innerHTML += `<div class="chat-msg user">${msg}</div>`;
    chatEl.innerHTML += `<div class="chat-msg ai" style="white-space:pre-line">${response}</div>`;
    scrollChat();
  }
}

function quickPrompt(prompt) {
  const input = document.getElementById('chat-input');
  if (input) { input.value = prompt; sendAIMessage(); }
}

function scrollChat() {
  const el = document.getElementById('chat-messages');
  if (el) el.scrollTop = el.scrollHeight;
}
