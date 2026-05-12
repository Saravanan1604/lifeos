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

// ===== AI COACH =====
function renderAICoach() {
  const history = STATE.chatHistory || [];
  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header"><h1 class="page-title">🧠 AI Life Coach</h1><p class="page-subtitle">Your personal AI-powered life advisor</p></div>
      <div style="display:grid;grid-template-columns:1fr 280px;gap:20px" class="ai-layout">
        <!-- Chat -->
        <div class="glass-card" style="overflow:hidden;display:flex;flex-direction:column">
          <div style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.08)">
            <p class="section-title">💬 Chat with AI Coach</p>
            <p style="font-size:12px;color:rgba(241,245,249,0.5);margin-top:2px">Ask anything about your finances, health, or life goals</p>
          </div>
          <div class="chat-messages" id="chat-messages">
            ${history.length===0?`<div class="chat-msg ai">👋 Hi! I'm your AI Life Coach. I can analyze your finances, health trends, and give personalized advice. What would you like to explore today?</div>`:history.map(m=>`<div class="chat-msg ${m.role}">${m.content}</div>`).join('')}
          </div>
          <div class="chat-input-row">
            <input type="text" id="chat-input" class="chat-input" placeholder="Ask me anything..." onkeydown="if(event.key==='Enter')sendAIMessage()"/>
            <button class="btn-primary btn-sm" onclick="sendAIMessage()">Send →</button>
          </div>
        </div>
        <!-- Quick Prompts -->
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="glass-card" style="padding:16px">
            <p class="section-title" style="margin-bottom:12px">⚡ Quick Insights</p>
            <div style="display:flex;flex-direction:column;gap:8px">
              ${[
                ['📊','Analyze my finances'],['😴','Review my sleep patterns'],['🎯','How are my goals going?'],
                ['🔥','Check my habit streaks'],['💡','Give me money-saving tips'],['🏆','What achievements am I close to?'],
              ].map(([icon,prompt])=>`<button class="btn-secondary btn-sm" onclick="quickPrompt('${prompt}')" style="text-align:left;justify-content:flex-start;gap:8px">${icon} ${prompt}</button>`).join('')}
            </div>
          </div>
          <div class="glass-card" style="padding:16px">
            <p class="section-title" style="margin-bottom:8px">🌟 Today's Tip</p>
            <p style="font-size:13px;color:rgba(241,245,249,0.7);line-height:1.6">${getDailyTip()}</p>
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
    '💡 The 50/30/20 rule: 50% needs, 30% wants, 20% savings. Start tracking today!',
    '🌙 Sleep 7-9 hours for peak cognitive performance and better financial decisions.',
    '🔥 Habits take 66 days on average to form. Stay consistent with your daily checklist.',
    '📈 SIP investments compound powerfully. Even ₹500/month grows to ₹1L+ over 10 years.',
    '🧘 Practice mindfulness for 10 min daily. It reduces impulsive spending by 30%.',
    '🎯 Write your goals down. People who write goals are 42% more likely to achieve them.',
    '💪 Walk 8,000 steps daily. It lowers risk of depression and improves focus.',
    '📚 Read 30 min/day. It builds knowledge that compounds like money.',
  ];
  return tips[new Date().getDate() % tips.length];
}

function getAIResponse(message) {
  const msg = message.toLowerCase();
  const txns = STATE.transactions || [];
  const income = txns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense = txns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const savings = income - expense;
  const savRate = income>0?((savings/income)*100).toFixed(1):0;
  const goals = STATE.goals || [];
  const health = STATE.healthEntries || [];
  const avgSleep = health.length ? (health.slice(-7).reduce((s,e)=>s+(e.sleep||7),0)/Math.min(7,health.length)).toFixed(1) : null;
  const habits = STATE.habits || [];
  const comps = STATE.habitCompletions || [];
  const todayDone = comps.filter(c=>c.date===today()).length;

  if (msg.includes('financ') || msg.includes('money') || msg.includes('saving')) {
    if (income === 0) return `📊 I don't see any financial data yet. Start by adding your income and expenses in the Finance section. Once you do, I can give you powerful insights!`;
    let resp = `💰 **Financial Analysis:**\n\nIncome: ₹${income.toLocaleString('en-IN')}\nExpenses: ₹${expense.toLocaleString('en-IN')}\nSavings: ₹${savings.toLocaleString('en-IN')} (${savRate}%)\n\n`;
    if (savRate >= 30) resp += `🚀 Excellent! Your ${savRate}% savings rate is outstanding. Keep investing the surplus.\n`;
    else if (savRate >= 10) resp += `👍 Your ${savRate}% savings rate is decent but push towards 30% for financial freedom.\n`;
    else resp += `⚠️ Your savings rate of ${savRate}% is low. Review discretionary expenses and cut 10% from the top category.\n`;
    if (savings > 0) resp += `\n🔮 **Yearly projection:** ₹${(savings*12).toLocaleString('en-IN')} if you maintain this pace.`;
    return resp;
  }
  if (msg.includes('sleep') || msg.includes('health')) {
    if (!avgSleep) return `😴 No health data found. Go to Health Hub and log your sleep, steps, and mood daily. I'll analyze patterns after a few days!`;
    let resp = `🏥 **Health Analysis:**\n\nAvg sleep (7 days): ${avgSleep} hours\n\n`;
    if (parseFloat(avgSleep) < 6) resp += `⚠️ You're severely sleep deprived! Less than 6 hours impacts cognitive function, mood, and even financial decisions. Aim for 7-8 hours.\n`;
    else if (parseFloat(avgSleep) < 7) resp += `😴 You're slightly under the recommended 7-9 hours. Try going to bed 30 minutes earlier.\n`;
    else resp += `✅ Your sleep is in the healthy range. Great recovery habits!\n`;
    return resp;
  }
  if (msg.includes('goal') || msg.includes('target')) {
    if (goals.length === 0) return `🎯 No goals set yet! Go to the Goals section to create your first life goal. I recommend starting with a financial goal (like Emergency Fund = 6 months expenses).`;
    const done = goals.filter(g=>g.current>=g.target).length;
    const pcts = goals.map(g=>g.target>0?Math.round(g.current/g.target*100):0);
    return `🎯 **Goals Summary:**\n\n${goals.length} active goals | ${done} completed\n\n${goals.map((g,i)=>`${g.emoji} ${g.name}: ${pcts[i]}% complete`).join('\n')}\n\n${done>0?`🏆 Amazing! You've crushed ${done} goal(s)!`:'Keep pushing! You\'re making progress every day.'}`;
  }
  if (msg.includes('habit') || msg.includes('streak')) {
    if (habits.length === 0) return `🔥 No habits created yet! Go to Habits and start with 2-3 small daily habits. Consistency beats intensity every time.`;
    return `🔥 **Habit Status:**\n\n${habits.length} active habits\nCompleted today: ${todayDone}/${habits.length}\nStreak: ${STATE.streak||0} days\n\n${STATE.streak>=7?'👑 You\'re on fire! Your consistency is building real change.':STATE.streak>=3?'💪 Good momentum! Keep going to build your streak.':'🌱 Get back on track today. Every day is a fresh start!'}`;
  }
  if (msg.includes('tip') || msg.includes('advice') || msg.includes('suggest')) {
    const tips = [`💡 **Top 3 Life OS Tips:**\n\n1. Log every transaction — even small ones add up\n2. Complete at least 1 habit daily to maintain your streak\n3. Check your Life Score weekly to see overall progress`];
    return tips[0];
  }
  if (msg.includes('achiev') || msg.includes('badge') || msg.includes('close')) {
    const unlocked = STATE.unlockedAchievements || [];
    const next = ACHIEVEMENTS_DEF.filter(a=>!unlocked.includes(a.id)).slice(0,3);
    if (next.length === 0) return `🏆 Incredible! You've unlocked all achievements! You're a true Life OS Master!`;
    return `🏆 **Achievements to unlock next:**\n\n${next.map(a=>`${a.emoji} **${a.title}**: ${a.desc} (+${a.xp} XP)`).join('\n\n')}\n\nFocus on these and earn ${next.reduce((s,a)=>s+a.xp,0)} more XP!`;
  }
  const general = [
    `🧠 I'm your AI Life Coach! Ask me about:\n• 📊 Financial analysis\n• 😴 Sleep & health review\n• 🎯 Goals progress\n• 🔥 Habit streaks\n• 🏆 Achievements\n• 💡 Tips & advice`,
    `✨ Here's a universal truth: **Track → Analyze → Improve**. Use every module in LifeOS daily and watch your life transform in 90 days!`,
    `💪 The best investment you can make is in yourself. Track your habits, optimize your health, and watch your wealth follow!`
  ];
  return general[Math.floor(Math.random() * general.length)];
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
