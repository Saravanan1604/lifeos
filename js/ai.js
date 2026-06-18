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
  const L = STATE.level || 1;
  const xpProgress = (STATE.xp || 0) - (L - 1) * 1000;
  const pct = Math.min(100, Math.max(0, Math.round((xpProgress / 1000) * 100)));
  const offset = 376.99 - (376.99 * pct / 100);

  const ranks = ['Beginner','Explorer','Achiever','Warrior','Champion','Legend','Master','Grandmaster','Elite','Life OS Pro'];
  const rankName = ranks[Math.min(ranks.length - 1, Math.floor(L - 1))];

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header"><h1 class="page-title">🏆 Achievements</h1><p class="page-subtitle">Earn XP and unlock badges by using atworth</p></div>
      <div class="stat-grid">
        <div class="stat-card bg-gold"><span class="stat-card-icon">🏆</span><div class="stat-card-value">${unlocked.length}</div><div class="stat-card-label">Badges Earned</div></div>
        <div class="stat-card bg-indigo"><span class="stat-card-icon">⚡</span><div class="stat-card-value">${STATE.xp||0}</div><div class="stat-card-label">Total XP</div></div>
        <div class="stat-card bg-purple"><span class="stat-card-icon">🎮</span><div class="stat-card-value">Level ${L}</div><div class="stat-card-label">Current Level</div></div>
        <div class="stat-card bg-amber"><span class="stat-card-icon">🔥</span><div class="stat-card-value">${STATE.streak||0}</div><div class="stat-card-label">Day Streak</div></div>
      </div>

      <!-- XP Progress -->
      <div class="glass-card" style="padding:24px;margin-bottom:20px">
        <div class="section-header" style="margin-bottom:20px">
          <p class="section-title"><i data-lucide="zap"></i> XP Progress</p>
          <span style="font-weight:700;color:#fbbf24;font-size:14px">Level ${L}</span>
        </div>
        
        <div class="xp-ring-flex-container" style="display:flex;align-items:center;justify-content:center;gap:32px;flex-wrap:wrap;margin-bottom:24px">
          <!-- Circular Progress Ring -->
          <div class="ring-container" style="position:relative;width:140px;height:140px">
            <svg class="ring-svg" width="140" height="140" viewBox="0 0 140 140" style="transform:rotate(-90deg)">
              <circle class="ring-track" cx="70" cy="70" r="60" style="fill:none;stroke-width:10"/>
              <circle class="ring-fill" cx="70" cy="70" r="60" stroke="url(#xpGrad)" stroke-dasharray="376.99" stroke-dashoffset="${offset}" style="fill:none;stroke-width:10;stroke-linecap:round;transition:stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)"/>
              <defs>
                <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#00c9a7" />
                  <stop offset="100%" stop-color="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <div class="ring-label" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center">
              <span class="ring-value" style="font-size:22px;font-weight:900;display:block;color:var(--text)">Lvl ${L}</span>
              <span class="ring-sub" style="font-size:11px;color:var(--text2);display:block;margin-top:2px">${xpProgress} / 1000 XP</span>
            </div>
          </div>
          
          <!-- XP Details Text -->
          <div style="flex:1;min-width:200px">
            <h3 style="font-size:16px;font-weight:700;margin-bottom:6px">Rank: ${rankName}</h3>
            <p style="font-size:13px;color:var(--text2);line-height:1.5">You have earned <strong>${STATE.xp || 0} XP</strong> in total. Complete habits, achieve goals, and log transactions to unlock more XP and level up!</p>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px">
          ${ranks.map((n,i)=>`
            <div style="display:flex;align-items:center;gap:12px;padding:8px 12px;border-radius:10px;background:${L>i?'rgba(0,201,167,0.06)':'transparent'};border:1px solid ${L>i?'rgba(0,201,167,0.12)':'transparent'}">
              <span style="width:24px;height:24px;border-radius:50%;background:${L>i?'linear-gradient(135deg,#00c9a7,#6366f1)':'rgba(255,255,255,0.06)'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;color:${L>i?'#fff':'var(--text3)'}">${L>i?'✓':i+1}</span>
              <span style="font-size:14px;font-weight:${L>i?'600':'400'};color:${L>i?'var(--text)':'var(--text3)'}">${n}</span>
              <span style="font-size:12px;color:var(--text3);margin-left:auto">${(i+1)*1000} XP</span>
            </div>`).join('')}
        </div>
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

function _projection() {
  // Average last 3 months for projections
  const months = [-2,-1,0].map(i => _monthData(i));
  const avgInc  = months.reduce((s,m)=>s+m.income,0)  / 3;
  const avgExp  = months.reduce((s,m)=>s+m.expense,0) / 3;
  const avgSav  = months.reduce((s,m)=>s+m.savings,0) / 3;
  const savRate = avgInc > 0 ? (avgSav/avgInc*100) : 0;
  // Goal projections
  const activeGoals = (STATE.goals||[]).filter(g=>g.current<g.target).map(g=>{
    const monthly = avgSav > 0 ? avgSav * 0.3 : 0; // assume 30% of savings goes to goals
    const remaining = g.target - g.current;
    const months = monthly > 0 ? Math.ceil(remaining/monthly) : null;
    return { ...g, remaining, monthsLeft: months };
  });
  // Future projections
  const proj3  = avgSav * 3;
  const proj6  = avgSav * 6;
  const proj12 = avgSav * 12;
  return { avgInc, avgExp, avgSav, savRate, proj3, proj6, proj12, activeGoals };
}

function _now() {
  return new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
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

function _renderMsg(m) {
  const isAI = m.role === 'ai';
  const time = m.time ? `<span class="chat-ts">${m.time}</span>` : '';
  const content = _md(m.content);
  if (isAI) return `
    <div class="chat-row ai-row">
      <div class="chat-avatar ai-avatar">🤖</div>
      <div class="chat-bubble-wrap">
        <div class="chat-meta">AI Coach ${time}</div>
        <div class="chat-msg ai">${content}</div>
      </div>
    </div>`;
  return `
    <div class="chat-row user-row">
      <div class="chat-bubble-wrap user-wrap">
        <div class="chat-meta user-meta">You ${time}</div>
        <div class="chat-msg user">${content}</div>
      </div>
      <div class="chat-avatar user-avatar">👤</div>
    </div>`;
}

function _md(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/`(.+?)`/g,'<code class="chat-code">$1</code>')
    .replace(/━+/g, s=>`<span class="chat-rule">${s}</span>`)
    .replace(/─+/g, s=>`<span class="chat-rule">${s}</span>`)
    .replace(/\n/g,'<br>');
}

// ===== AI COACH =====
function _buildKPICards() {
  const m0 = _monthData(0), m1 = _monthData(-1), m2 = _monthData(-2);
  const mn = off => { const d = new Date(); d.setMonth(d.getMonth()+off); return d.toLocaleString('default',{month:'short'}); };
  return [
    { label:'Income',   icon:'💰', curr:m0.income,  p1:m1.income,  p2:m2.income,  good:true },
    { label:'Expenses', icon:'💳', curr:m0.expense, p1:m1.expense, p2:m2.expense, good:false },
    { label:'Savings',  icon:'🏦', curr:m0.savings, p1:m1.savings, p2:m2.savings, good:true },
  ].map(r => {
    const c1 = _arrowColor(r.curr,r.p1,r.good), c2 = _arrowColor(r.curr,r.p2,r.good);
    const rising = r.curr > r.p1 && r.curr > r.p2, falling = r.curr < r.p1 && r.curr < r.p2;
    const trend = rising ? '↗' : falling ? '↘' : '→';
    const trendCol = (rising&&r.good)||(falling&&!r.good) ? '#10b981' : trend==='→' ? '#94a3b8' : '#ef4444';
    return `<div class="glass-card" style="padding:16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <p style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px;font-weight:700">${r.icon} ${r.label}</p>
        <span style="font-size:18px;font-weight:900;color:${trendCol}">${trend}</span>
      </div>
      <p style="font-size:22px;font-weight:900;color:var(--text);margin-bottom:10px">${fmt(r.curr)}</p>
      <div style="border-top:1px solid var(--glass-border);padding-top:7px;display:flex;flex-direction:column;gap:4px">
        <div style="display:flex;justify-content:space-between;font-size:11px">
          <span style="color:var(--text3)">L2 · ${mn(-1)}</span>
          <span style="color:${c1};font-weight:600">${_arrow(r.curr,r.p1)} ${fmt(r.p1)} <span style="opacity:0.7">(${_pctChg(r.curr,r.p1)})</span></span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px">
          <span style="color:var(--text3)">L3 · ${mn(-2)}</span>
          <span style="color:${c2};font-weight:600">${_arrow(r.curr,r.p2)} ${fmt(r.p2)} <span style="opacity:0.7">(${_pctChg(r.curr,r.p2)})</span></span>
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderAICoach() {
  const history = STATE.chatHistory || [];
  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
        <div>
          <h1 class="page-title">🧠 AI Data Coach</h1>
          <p class="page-subtitle">Triple-layer analytics · like Stripe · Notion · Linear</p>
        </div>
        <button onclick="clearChat()" class="btn-secondary btn-sm" style="font-size:11px">🗑 Clear</button>
      </div>

      <!-- Triple-Layer KPI Strip -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px" class="ai-kpi-grid">
        ${_buildKPICards()}
      </div>

      <!-- Charts Row: Grouped Bar + Category Comparison -->
      <div style="display:grid;grid-template-columns:3fr 2fr;gap:16px;margin-bottom:20px" class="ai-charts-row">
        <div class="glass-card" style="padding:20px">
          <div class="section-header" style="margin-bottom:12px">
            <p class="section-title">📊 3-Period Grouped Comparison</p>
            <span style="font-size:10px;padding:2px 8px;border-radius:10px;background:rgba(99,102,241,0.12);color:#6366f1;font-weight:700">Double + Triple Layer</span>
          </div>
          <div style="height:200px;position:relative"><canvas id="ai-grouped-chart"></canvas></div>
        </div>
        <div class="glass-card" style="padding:20px">
          <div class="section-header" style="margin-bottom:12px">
            <p class="section-title">🔍 Category Shift</p>
            <span style="font-size:10px;color:var(--text3)">This vs Last Month</span>
          </div>
          <div style="height:200px;position:relative"><canvas id="ai-category-chart"></canvas></div>
        </div>
      </div>

      <!-- 6-Month Trend Line -->
      <div class="glass-card" style="padding:20px;margin-bottom:20px">
        <div class="section-header" style="margin-bottom:12px">
          <p class="section-title">📈 6-Month Financial Trend</p>
          <span style="font-size:10px;color:var(--text3)">Income · Expenses · Net Savings</span>
        </div>
        <div style="height:150px;position:relative"><canvas id="ai-trend-chart"></canvas></div>
      </div>

      <!-- Chat + Sidebar -->
      <div style="display:grid;grid-template-columns:1fr 290px;gap:20px" class="ai-layout">

        <!-- Chat Terminal -->
        <div style="display:flex;flex-direction:column;gap:0;border-radius:16px;overflow:hidden;border:1px solid var(--glass-border);background:var(--glass)">
          <div style="padding:10px 16px;background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1));border-bottom:1px solid var(--glass-border);display:flex;align-items:center;gap:10px">
            <div style="display:flex;gap:5px">
              <span style="width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block"></span>
              <span style="width:10px;height:10px;border-radius:50%;background:#f59e0b;display:inline-block"></span>
              <span style="width:10px;height:10px;border-radius:50%;background:#10b981;display:inline-block"></span>
            </div>
            <span style="font-size:11px;color:var(--text3);font-family:monospace">atworth://ai-coach ~ data-engine v3</span>
            <span style="margin-left:auto;font-size:10px;padding:2px 8px;border-radius:20px;background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3)">● LIVE</span>
          </div>
          <div class="chat-messages" id="chat-messages" style="padding:20px;gap:16px;min-height:360px">
            ${history.length===0
              ? _renderMsg({role:'ai', content:`👋 **AI Data Coach v3** — Triple-layer analytics\n\nCharts above auto-update from your data.\n\n📊 "Compare 3 months" — triple-layer MoM\n📐 "50/30/20 check" — budget rule analysis\n🛡️ "Emergency fund" — safety net check\n🔍 "Category breakdown" — where money goes\n📈 "Investment advice" — priority roadmap\n💰 "Full report" — everything in one shot`, time: _now()})
              : history.map(m=>_renderMsg(m)).join('')}
          </div>
          <div style="padding:12px 16px;border-top:1px solid var(--glass-border);display:flex;gap:8px;align-items:center;background:var(--glass)">
            <span style="font-size:12px;color:var(--indigo);font-family:monospace;font-weight:700;flex-shrink:0">&gt;_</span>
            <input type="text" id="chat-input" class="chat-input" placeholder="compare 3 months · 50/30/20 · emergency fund · investment advice..." onkeydown="if(event.key==='Enter')sendAIMessage()" style="flex:1;background:transparent;border:none;outline:none;font-family:monospace;font-size:13px"/>
            <button class="btn-primary btn-sm" onclick="sendAIMessage()" style="flex-shrink:0">Run ↵</button>
          </div>
        </div>

        <!-- Right Sidebar -->
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="glass-card" style="padding:16px">
            <p class="section-title" style="margin-bottom:10px;font-size:12px">📊 MoM Snapshot</p>
            ${_buildComparisonWidget()}
          </div>
          <div class="glass-card" style="padding:16px">
            <p class="section-title" style="margin-bottom:10px;font-size:12px">📐 50/30/20 Live</p>
            ${_build503020Widget()}
          </div>
          <div class="glass-card" style="padding:14px">
            <p class="section-title" style="margin-bottom:8px;font-size:12px">⚡ Quick Queries</p>
            <div style="display:flex;flex-direction:column;gap:5px">
              ${[
                ['📊','Compare 3 months'],
                ['📐','50/30/20 rule check'],
                ['🛡️','Emergency fund check'],
                ['🔍','Category breakdown'],
                ['📈','Investment advice'],
                ['💰','Full financial report'],
                ['🎯','Goals progress'],
                ['🔥','Habit streaks'],
              ].map(([icon,p])=>`<button onclick="quickPrompt('${p}')" style="text-align:left;display:flex;align-items:center;gap:7px;padding:6px 8px;border:1px solid var(--glass-border);border-radius:7px;background:transparent;color:var(--text2);font-size:11px;cursor:pointer;transition:.15s;font-family:monospace" onmouseover="this.style.background='rgba(99,102,241,0.1)';this.style.color='var(--text)'" onmouseout="this.style.background='transparent';this.style.color='var(--text2)'">${icon} ${p}</button>`).join('')}
            </div>
          </div>
          ${window.__IS_APP ? '' : `<div class="glass-card" style="padding:14px;border-left:3px solid var(--indigo)">
            <p style="font-size:10px;font-weight:700;letter-spacing:1px;color:var(--indigo);margin-bottom:6px">RULE OF THE DAY</p>
            <p style="font-size:12px;color:var(--text2);line-height:1.6;font-style:italic">${getDailyTip()}</p>
          </div>`}
        </div>
      </div>
    </div>`;

  if (window.innerWidth < 700) {
    ['ai-kpi-grid','ai-charts-row','ai-layout'].forEach(cls => {
      const el = document.querySelector('.'+cls);
      if (el) el.style.gridTemplateColumns = '1fr';
    });
  }

  setTimeout(() => {
    renderAIGroupedChart();
    renderAICategoryChart();
    renderAITrendChart();
  }, 80);

  scrollChat();
}

function renderAIGroupedChart() {
  const canvas = document.getElementById('ai-grouped-chart');
  if (!canvas) return;
  if (chartInstances['ai-grouped']) {
    try { chartInstances['ai-grouped'].destroy(); } catch(e) {}
    delete chartInstances['ai-grouped'];
  }
  const m0 = _monthData(0), m1 = _monthData(-1), m2 = _monthData(-2);
  const mn = off => { const d = new Date(); d.setMonth(d.getMonth()+off); return d.toLocaleString('default',{month:'short'}); };
  const isLight = document.body.classList.contains('light');
  const gridC = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
  const tickC = '#64748b';
  chartInstances['ai-grouped'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['Income','Expenses','Savings'],
      datasets: [
        { label: mn(-2), data:[m2.income,m2.expense,m2.savings],
          backgroundColor:'rgba(148,163,184,0.4)', borderColor:'rgba(148,163,184,0.7)', borderWidth:1, borderRadius:4 },
        { label: mn(-1), data:[m1.income,m1.expense,m1.savings],
          backgroundColor:'rgba(99,102,241,0.5)', borderColor:'rgba(99,102,241,0.85)', borderWidth:1, borderRadius:4 },
        { label: mn(0)+' ▶', data:[m0.income,m0.expense,m0.savings],
          backgroundColor:['rgba(16,185,129,0.75)','rgba(239,68,68,0.75)','rgba(0,201,167,0.75)'],
          borderColor:['#10b981','#ef4444','#00c9a7'], borderWidth:2, borderRadius:4 },
      ],
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins: {
        legend:{ labels:{ color:tickC, font:{size:11}, boxWidth:12 } },
        tooltip:{ callbacks:{ label: ctx => ` ${ctx.dataset.label}: ₹${(ctx.raw||0).toLocaleString('en-IN')}` } },
      },
      scales: {
        x:{ grid:{color:gridC}, ticks:{color:tickC,font:{size:11}} },
        y:{ grid:{color:gridC}, ticks:{color:tickC,font:{size:10},callback:v=>'₹'+fmt(v)} },
      },
    },
  });
}

function renderAICategoryChart() {
  const canvas = document.getElementById('ai-category-chart');
  if (!canvas) return;
  if (chartInstances['ai-category']) {
    try { chartInstances['ai-category'].destroy(); } catch(e) {}
    delete chartInstances['ai-category'];
  }
  const cats0 = _catBreakdown(0).slice(0,6);
  const cats1 = _catBreakdown(-1);
  if (!cats0.length) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#64748b'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('No expense data this month', canvas.width/2, canvas.height/2);
    return;
  }
  const mn = off => { const d = new Date(); d.setMonth(d.getMonth()+off); return d.toLocaleString('default',{month:'short'}); };
  const names = cats0.map(c=>c.cat);
  const isLight = document.body.classList.contains('light');
  const gridC = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
  const tickC = '#64748b';
  chartInstances['ai-category'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: names,
      datasets: [
        { label: mn(-1), data: names.map(n=>cats1.find(c=>c.cat===n)?.amt||0),
          backgroundColor:'rgba(148,163,184,0.45)', borderColor:'rgba(148,163,184,0.7)', borderWidth:1, borderRadius:3 },
        { label: mn(0)+' ▶', data: cats0.map(c=>c.amt),
          backgroundColor:'rgba(99,102,241,0.65)', borderColor:'rgba(99,102,241,1)', borderWidth:1.5, borderRadius:3 },
      ],
    },
    options: {
      indexAxis:'y', responsive:true, maintainAspectRatio:false,
      plugins: {
        legend:{ labels:{ color:tickC, font:{size:11}, boxWidth:12 } },
        tooltip:{ callbacks:{ label: ctx => ` ${ctx.dataset.label}: ₹${(ctx.raw||0).toLocaleString('en-IN')}` } },
      },
      scales: {
        x:{ grid:{color:gridC}, ticks:{color:tickC,font:{size:10},callback:v=>'₹'+fmt(v)} },
        y:{ grid:{color:gridC}, ticks:{color:tickC,font:{size:11}} },
      },
    },
  });
}

function renderAITrendChart() {
  const canvas = document.getElementById('ai-trend-chart');
  if (!canvas) return;
  if (chartInstances['ai-trend']) {
    try { chartInstances['ai-trend'].destroy(); } catch(e) {}
    delete chartInstances['ai-trend'];
  }
  const pts = Array.from({length:6},(_,i) => {
    const off = i-5;
    const m = _monthData(off);
    const d = new Date(); d.setMonth(d.getMonth()+off);
    return { label:d.toLocaleString('default',{month:'short',year:'2-digit'}), income:m.income, expense:m.expense, savings:m.savings };
  });
  const isLight = document.body.classList.contains('light');
  const gridC = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
  const tickC = '#64748b';
  chartInstances['ai-trend'] = new Chart(canvas, {
    type: 'line',
    data: {
      labels: pts.map(p=>p.label),
      datasets: [
        { label:'Income',   data:pts.map(p=>p.income),  borderColor:'#10b981', backgroundColor:'rgba(16,185,129,0.06)', borderWidth:2, tension:0.4, fill:false, pointRadius:3.5, pointBackgroundColor:'#10b981' },
        { label:'Expenses', data:pts.map(p=>p.expense), borderColor:'#ef4444', backgroundColor:'rgba(239,68,68,0.06)',   borderWidth:2, tension:0.4, fill:false, pointRadius:3.5, pointBackgroundColor:'#ef4444' },
        { label:'Savings',  data:pts.map(p=>p.savings), borderColor:'#00c9a7', backgroundColor:'rgba(0,201,167,0.1)',   borderWidth:2, tension:0.4, fill:true,  pointRadius:3.5, pointBackgroundColor:'#00c9a7' },
      ],
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins: {
        legend:{ labels:{ color:tickC, font:{size:11}, boxWidth:12 } },
        tooltip:{ callbacks:{ label: ctx => ` ${ctx.dataset.label}: ₹${(ctx.raw||0).toLocaleString('en-IN')}` } },
      },
      scales: {
        x:{ grid:{color:gridC}, ticks:{color:tickC,font:{size:11}} },
        y:{ grid:{color:gridC}, ticks:{color:tickC,font:{size:10},callback:v=>'₹'+fmt(v)} },
      },
    },
  });
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

  // ── 3-Period comparison ──
  if (msg.includes('compar') || msg.includes('last month') || msg.includes('vs') || msg.includes('month over') || msg.includes('trend') || msg.includes('3 month')) {
    const m2 = _monthData(-2);
    const mn = off => { const d = new Date(); d.setMonth(d.getMonth()+off); return d.toLocaleString('default',{month:'short'}); };
    if (!curr.income && !prev.income && !m2.income) return `📊 No data yet. Add transactions to unlock comparisons.`;
    const avgSav = (m2.savings + prev.savings + curr.savings) / 3;
    const trend3 = curr.savings > m2.savings ? 'improving' : curr.savings < m2.savings ? 'declining' : 'flat';
    return `📊 Triple-Layer Comparison
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         ${mn(-2).padEnd(8)} ${mn(-1).padEnd(8)} ${mn(0)} (Now)
─────────────────────────────────────────
Income   ${fmt(m2.income).padStart(8)} ${fmt(prev.income).padStart(8)} ${fmt(curr.income).padStart(10)}
Expense  ${fmt(m2.expense).padStart(8)} ${fmt(prev.expense).padStart(8)} ${fmt(curr.expense).padStart(10)}
Savings  ${fmt(m2.savings).padStart(8)} ${fmt(prev.savings).padStart(8)} ${fmt(curr.savings).padStart(10)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Layer 2 (MoM): ${_arrow(curr.expense,prev.expense)} Expense ${_pctChg(curr.expense,prev.expense)} vs ${mn(-1)}
Layer 3 (QoQ): ${_arrow(curr.expense,m2.expense)} Expense ${_pctChg(curr.expense,m2.expense)} vs ${mn(-2)}

3-month savings trend: **${trend3}** (avg ₹${fmt(Math.round(avgSav))}/mo)

📌 Action:
${curr.expense > m2.expense ? `• Cut spending by ${fmt(Math.round((curr.expense-m2.expense)*0.5))} to beat ${mn(-2)} level` : `• ✅ Spending down vs 2 months ago`}
${curr.savings < prev.savings ? `• Savings fell ${fmt(prev.savings-curr.savings)} — redirect ${fmt(Math.round((prev.savings-curr.savings)*0.5))} from discretionary` : `• ✅ Savings holding or improving`}
• 3-month avg savings rate: ${curr.income>0?(avgSav/curr.income*100).toFixed(1):0}% of income

💡 See grouped bar chart above for visual layer view.`;
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

  // ── Projection & Forecast ──
  if (msg.includes('project') || msg.includes('forecast') || msg.includes('future') || msg.includes('predict') || msg.includes('3 month') || msg.includes('6 month') || msg.includes('next month') || msg.includes('how long') || msg.includes('when')) {
    const p = _projection();
    const ef = _emergencyFund();
    if (!p.avgInc) return `📡 Add at least 1 month of transactions to generate projections.`;
    const mn = off => { const d = new Date(); d.setMonth(d.getMonth()+off); return d.toLocaleString('default',{month:'short',year:'2-digit'}); };
    const goalLines = p.activeGoals.slice(0,3).map(g=>
      g.monthsLeft ? `  🎯 ${g.name}: ${fmt(g.remaining)} left → ~${g.monthsLeft} months (${mn(g.monthsLeft)})`
                   : `  🎯 ${g.name}: needs savings to build first`
    ).join('\n');
    return `📡 Financial Projection (based on 3-month avg)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Avg monthly income:  ${fmt(Math.round(p.avgInc))}
Avg monthly expense: ${fmt(Math.round(p.avgExp))}
Avg monthly savings: ${fmt(Math.round(p.avgSav))} (${p.savRate.toFixed(1)}% rate)

📈 SAVINGS FORECAST
  3 months  (${mn(3)}): +${fmt(Math.round(p.proj3))}
  6 months  (${mn(6)}): +${fmt(Math.round(p.proj6))}
  12 months (${mn(12)}): +${fmt(Math.round(p.proj12))}

🎯 GOAL ETAs${goalLines || '\n  No active goals — add goals to track ETAs'}

🛡️ EMERGENCY FUND: ${ef.monthsCovered} months covered${ef.monthsCovered<6?` — need ${fmt(ef.target-ef.saved)} more (${Math.ceil((ef.target-ef.saved)/Math.max(p.avgSav,1))} months at current rate)`:'  ✅'}

📌 To hit 20% savings rate, save ${fmt(Math.round(p.avgInc*0.2))} /month
   Currently saving ${fmt(Math.round(p.avgSav))} → ${p.avgSav < p.avgInc*0.2 ? `gap: ${fmt(Math.round(p.avgInc*0.2-p.avgSav))}` : '✅ target met'}`;
  }

  // ── Achievements ──
  if (msg.includes('achiev') || msg.includes('badge') || msg.includes('close') || msg.includes('xp')) {
    const unlocked = STATE.unlockedAchievements || [];
    const next = ACHIEVEMENTS_DEF.filter(a=>!unlocked.includes(a.id)).slice(0,3);
    if (!next.length) return `🏆 All ${ACHIEVEMENTS_DEF.length} achievements unlocked! You're a atworth Master!`;
    return `🏆 Next Achievements
━━━━━━━━━━━━━━━━━━
${next.map(a=>`${a.emoji} ${a.title} (+${a.xp} XP)\n   ${a.desc}`).join('\n\n')}

Total XP available: ${next.reduce((s,a)=>s+a.xp,0)}`;
  }

  // ── Smart default: give a useful snapshot instead of just listing commands ──
  const p = _projection();
  const r = _503020();
  const ef = _emergencyFund();
  if (!curr.income && !txnsAll.length) {
    return `👋 No data yet! Here's your **Getting Started** checklist:\n\n1️⃣ Add income → Finance → + Transaction\n2️⃣ Log daily expenses for 7 days\n3️⃣ Set a monthly budget goal\n4️⃣ Create an Emergency Fund goal\n\nOnce you have data, I'll project your savings, flag overspending, and give personalised advice.`;
  }
  const savOk = parseFloat(r.savingsPct) >= 20;
  const efOk  = parseFloat(ef.monthsCovered) >= 6;
  const nextAction = !efOk
    ? `Build emergency fund — ${fmt(ef.target-ef.saved)} more needed (${Math.ceil((ef.target-ef.saved)/Math.max(p.avgSav,1))} months)`
    : !savOk
    ? `Boost savings to 20% — save ${fmt(Math.round(r.income*0.2-r.savings))} more/month`
    : `Invest surplus ${fmt(Math.max(0,Math.round(r.savings-r.income*0.2)))}/month in index funds`;
  return `💡 **Quick Money Snapshot**
━━━━━━━━━━━━━━━━━━
This month: ${fmt(curr.income)} in · ${fmt(curr.expense)} out · ${fmt(curr.savings)} saved (${r.savingsPct}%)
Savings target (20%): ${savOk?'✅ On track':'❌ Below target'}
Emergency fund: ${efOk?'✅ 6+ months':'⚠️ '+ef.monthsCovered+' months (need 6)'}
Projected 12-month savings: ${fmt(Math.round(p.proj12))}

🎯 **Your next action:**
→ ${nextAction}

Ask me anything specific — "compare 3 months", "project my savings", "where is money going", "what should I invest in"`;
}

function sendAIMessage() {
  const input = document.getElementById('chat-input');
  const msg = input?.value?.trim();
  if (!msg) return;
  input.value = '';
  const t = _now();
  STATE.chatHistory = STATE.chatHistory || [];
  STATE.chatHistory.push({ role: 'user', content: msg, time: t });

  const chatEl = document.getElementById('chat-messages');
  if (chatEl) {
    chatEl.innerHTML += _renderMsg({ role: 'user', content: msg, time: t });
    chatEl.innerHTML += `<div class="chat-row ai-row" id="chat-thinking">
      <div class="chat-avatar ai-avatar">🤖</div>
      <div class="chat-bubble-wrap">
        <div class="chat-meta">AI Coach</div>
        <div class="chat-msg ai chat-thinking-bubble"><span class="chat-dot"></span><span class="chat-dot"></span><span class="chat-dot"></span></div>
      </div>
    </div>`;
    scrollChat();
  }

  setTimeout(() => {
    const response = getAIResponse(msg);
    const rt = _now();
    STATE.chatHistory.push({ role: 'ai', content: response, time: rt });
    if (STATE.chatHistory.length > 40) STATE.chatHistory = STATE.chatHistory.slice(-40);
    saveState();
    const thinking = document.getElementById('chat-thinking');
    if (thinking) thinking.outerHTML = _renderMsg({ role: 'ai', content: response, time: rt });
    scrollChat();
  }, 400);
}

function quickPrompt(prompt) {
  const input = document.getElementById('chat-input');
  if (input) { input.value = prompt; sendAIMessage(); }
}

function clearChat() {
  STATE.chatHistory = [];
  saveState();
  renderAICoach();
}

function scrollChat() {
  const el = document.getElementById('chat-messages');
  if (el) el.scrollTop = el.scrollHeight;
}
