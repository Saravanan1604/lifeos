// ===== DEMO DATA SEEDER =====
function seedDemoData() {
  if (!confirm('This will fill your atworth with realistic demo data so you can explore all features. Continue?')) return;

  const now = new Date();
  function daysAgo(n) { const d = new Date(now); d.setDate(d.getDate() - n); return d.toISOString().slice(0,10); }

  // Transactions
  STATE.transactions = [
    { id: genId(), type: 'income', amount: 85000, date: daysAgo(1), category: 'Salary', icon: '💰', description: 'Monthly Salary - Tech Corp' },
    { id: genId(), type: 'income', amount: 12000, date: daysAgo(5), category: 'Freelance', icon: '💻', description: 'UI Design Project' },
    { id: genId(), type: 'expense', amount: 22000, date: daysAgo(1), category: 'Rent', icon: '🏠', description: 'Monthly Rent' },
    { id: genId(), type: 'expense', amount: 4200, date: daysAgo(2), category: 'Food', icon: '🍔', description: 'Groceries & Dining' },
    { id: genId(), type: 'expense', amount: 1800, date: daysAgo(3), category: 'Transport', icon: '🚗', description: 'Ola/Uber rides' },
    { id: genId(), type: 'expense', amount: 3500, date: daysAgo(4), category: 'Shopping', icon: '🛍️', description: 'Amazon purchases' },
    { id: genId(), type: 'expense', amount: 1500, date: daysAgo(5), category: 'Utilities', icon: '💡', description: 'Electricity + Internet' },
    { id: genId(), type: 'expense', amount: 599, date: daysAgo(6), category: 'Entertainment', icon: '🎬', description: 'Netflix + Spotify' },
    { id: genId(), type: 'expense', amount: 8500, date: daysAgo(7), category: 'EMI', icon: '🏦', description: 'Car Loan EMI' },
    { id: genId(), type: 'expense', amount: 2200, date: daysAgo(8), category: 'Insurance', icon: '🛡️', description: 'LIC Premium' },
    { id: genId(), type: 'income', amount: 85000, date: daysAgo(32), category: 'Salary', icon: '💰', description: 'Monthly Salary - Tech Corp' },
    { id: genId(), type: 'expense', amount: 5800, date: daysAgo(33), category: 'Food', icon: '🍔', description: 'Restaurants & Groceries' },
    { id: genId(), type: 'expense', amount: 22000, date: daysAgo(32), category: 'Rent', icon: '🏠', description: 'Monthly Rent' },
    { id: genId(), type: 'expense', amount: 12000, date: daysAgo(35), category: 'Shopping', icon: '🛍️', description: 'Phone accessories' },
    { id: genId(), type: 'income', amount: 8000, date: daysAgo(40), category: 'Freelance', icon: '💻', description: 'Logo design work' },
    { id: genId(), type: 'expense', amount: 8500, date: daysAgo(38), category: 'EMI', icon: '🏦', description: 'Car Loan EMI' },
    { id: genId(), type: 'income', amount: 85000, date: daysAgo(62), category: 'Salary', icon: '💰', description: 'Monthly Salary - Tech Corp' },
    { id: genId(), type: 'expense', amount: 22000, date: daysAgo(62), category: 'Rent', icon: '🏠', description: 'Monthly Rent' },
    { id: genId(), type: 'expense', amount: 3100, date: daysAgo(65), category: 'Food', icon: '🍔', description: 'Swiggy + Zomato' },
    { id: genId(), type: 'expense', amount: 8500, date: daysAgo(68), category: 'EMI', icon: '🏦', description: 'Car Loan EMI' },
  ];

  // Investments
  STATE.investments = [
    { id: genId(), name: 'SBI Blue Chip Fund', type: 'Mutual Fund', amount: 60000, currentValue: 72400, date: daysAgo(180), icon: '📈' },
    { id: genId(), name: 'Reliance Industries', type: 'Stocks', amount: 25000, currentValue: 31500, date: daysAgo(120), icon: '📊' },
    { id: genId(), name: 'Nifty 50 Index Fund SIP', type: 'SIP', amount: 36000, currentValue: 41200, date: daysAgo(365), icon: '🔄' },
    { id: genId(), name: 'Digital Gold', type: 'Gold', amount: 15000, currentValue: 17800, date: daysAgo(90), icon: '🥇' },
    { id: genId(), name: 'HDFC FD 5yr', type: 'Fixed Deposit', amount: 100000, currentValue: 114490, date: daysAgo(500), icon: '🏦' },
  ];

  // Budgets
  STATE.budgets = [
    { id: genId(), category: 'Food', limit: 6000 },
    { id: genId(), category: 'Transport', limit: 3000 },
    { id: genId(), category: 'Shopping', limit: 5000 },
    { id: genId(), category: 'Entertainment', limit: 1500 },
    { id: genId(), category: 'Utilities', limit: 2500 },
  ];

  // Goals
  STATE.goals = [
    { id: genId(), name: 'Emergency Fund (6 months)', type: 'savings', target: 300000, current: 145000, emoji: '🛡️', deadline: daysAgo(-180), category: 'Finance', createdAt: new Date().toISOString() },
    { id: genId(), name: 'Europe Vacation 2026', type: 'savings', target: 150000, current: 38000, emoji: '✈️', deadline: daysAgo(-270), category: 'Travel', createdAt: new Date().toISOString() },
    { id: genId(), name: 'MacBook Pro', type: 'savings', target: 200000, current: 200000, emoji: '💻', deadline: daysAgo(-30), category: 'Tech', createdAt: new Date().toISOString() },
    { id: genId(), name: 'Learn System Design', type: 'milestone', target: 100, current: 65, emoji: '🎓', deadline: daysAgo(-60), category: 'Career', description: 'Complete course and side project', createdAt: new Date().toISOString() },
    { id: genId(), name: 'Run 5K under 25 min', type: 'milestone', target: 100, current: 40, emoji: '🏃', deadline: daysAgo(-90), category: 'Health', description: 'Train 3x/week consistently', createdAt: new Date().toISOString() },
  ];

  // Habits
  const habitDefs = [
    { name: 'Morning Run', emoji: '🏃' },
    { name: 'Read 30 mins', emoji: '📚' },
    { name: 'Drink 8 glasses water', emoji: '💧' },
    { name: 'Meditate 10 mins', emoji: '🧘' },
    { name: 'Code 1 hour', emoji: '💻' },
    { name: 'No junk food', emoji: '🥗' },
  ];
  STATE.habits = habitDefs.map(h => ({ id: genId(), ...h, createdAt: new Date().toISOString() }));

  // Habit completions (last 21 days, with some misses for realism)
  STATE.habitCompletions = [];
  const skipPattern = [2, 5, 9, 13, 17]; // days with some misses
  STATE.habits.forEach((h, hi) => {
    for (let i = 0; i < 21; i++) {
      // Skip a few to be realistic
      if (skipPattern.includes(i) && hi % 3 === 0) continue;
      if (i === 0 && hi > 3) continue;
      STATE.habitCompletions.push({ id: genId(), habitId: h.id, date: daysAgo(i) });
    }
  });

  // Health entries (last 14 days)
  const sleepData = [7.5, 6.5, 8.0, 7.0, 6.0, 7.5, 8.5, 7.0, 7.5, 6.5, 8.0, 7.5, 7.0, 6.0];
  const moodData =  [8, 6, 9, 7, 5, 8, 9, 7, 8, 6, 9, 8, 7, 6];
  const stepsData = [8500, 6200, 10200, 7800, 5500, 9000, 11000, 8200, 7600, 6800, 9500, 8800, 7200, 6500];
  const waterData = [8, 6, 9, 7, 5, 8, 10, 7, 8, 6, 9, 8, 7, 6];
  STATE.healthEntries = sleepData.map((sleep, i) => ({
    id: genId(), date: daysAgo(13 - i),
    sleep, sleepQuality: Math.round(sleep / 2),
    steps: stepsData[i], water: waterData[i], mood: moodData[i],
    note: i % 3 === 0 ? 'Felt great today!' : i % 3 === 1 ? 'Busy day, slightly tired' : 'Good energy levels',
  }));

  // Emotion journal (last 10 days)
  const moods = [8,6,9,7,5,8,9,7,8,6];
  const jNotes = [
    'Had a great productive day. Finished the project on time!',
    'Feeling a bit stressed about deadlines but managing.',
    'Incredible day! Got appreciation from manager.',
    'Normal day. Focused on health goals.',
    'Low energy. Need better sleep routine.',
    'Motivated after workout. Goals feel achievable!',
    'Great conversations with family. Feeling grateful.',
    'Completed 3 habits today. Consistency is building.',
    'Investing wisely gives me confidence.',
    'Slightly anxious about expenses. Will review budget.'
  ];
  const jTags = [['Happy','Grateful'],['Stressed'],['Excited','Happy'],['Calm','Focused'],['Tired'],['Motivated','Happy'],['Grateful','Calm'],['Motivated'],['Calm','Focused'],['Anxious']];
  STATE.emotionEntries = moods.map((m, i) => ({
    id: genId(), date: daysAgo(9 - i), moodScore: m, note: jNotes[i], tags: jTags[i], createdAt: new Date().toISOString()
  }));

  // Skills
  STATE.skills = [
    { id: genId(), name: 'React', category: 'Tech', proficiency: 4 },
    { id: genId(), name: 'Node.js', category: 'Tech', proficiency: 3 },
    { id: genId(), name: 'UI/UX Design', category: 'Creative', proficiency: 4 },
    { id: genId(), name: 'Python', category: 'Tech', proficiency: 3 },
    { id: genId(), name: 'Financial Planning', category: 'Business', proficiency: 3 },
    { id: genId(), name: 'Communication', category: 'Soft', proficiency: 5 },
    { id: genId(), name: 'System Design', category: 'Tech', proficiency: 2 },
    { id: genId(), name: 'Leadership', category: 'Soft', proficiency: 3 },
  ];

  // Job Applications
  STATE.jobApplications = [
    { id: genId(), company: 'Google', role: 'Senior Frontend Engineer', status: 'Interview', date: daysAgo(10) },
    { id: genId(), company: 'Flipkart', role: 'SDE-2', status: 'Applied', date: daysAgo(5) },
    { id: genId(), company: 'Swiggy', role: 'Tech Lead', status: 'Offer', date: daysAgo(30) },
    { id: genId(), company: 'Zomato', role: 'Senior Dev', status: 'Rejected', date: daysAgo(45) },
  ];

  // XP + Streak
  STATE.xp = 1250;
  STATE.level = 2;
  STATE.streak = 8;
  STATE.lastActive = today();
  STATE.unlockedAchievements = ['first_tx', 'first_habit', 'first_goal', 'first_inv', 'ten_tx'];
  STATE.chatHistory = [
    { role: 'ai', content: '👋 Hi! I\'m your AI Life Coach. I can see you\'ve loaded demo data! Ask me to analyze your finances, health, or goals.' },
  ];

  saveState();
  checkAchievements();
  updateSidebar();
  navigate('dashboard');
  toast('🎉 Demo data loaded! Explore all modules now.', 'success');
  setTimeout(() => showCelebration('Demo Data Loaded!', 'Your atworth is now fully populated with realistic data. Explore every module! 🚀'), 500);
}

// ===== CELEBRATION ANIMATION =====
function showCelebration(title, msg) {
  const el = document.createElement('div');
  el.id = 'celebration';
  el.style.cssText = `position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);animation:fadeInUp .4s ease`;
  el.innerHTML = `
    <div style="text-align:center;padding:40px;max-width:400px">
      <div style="font-size:80px;animation:bounce 1s infinite alternate">🎉</div>
      <h2 style="font-size:28px;font-weight:900;margin:16px 0 8px;background:linear-gradient(135deg,#6366f1,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${title}</h2>
      <p style="color:rgba(241,245,249,0.7);font-size:15px;line-height:1.6">${msg}</p>
      <button onclick="document.getElementById('celebration').remove()" style="margin-top:24px;padding:12px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;border-radius:50px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;transition:.2s">Let's Go! ⚡</button>
    </div>`;
  document.body.appendChild(el);
  el.addEventListener('click', e => { if (e.target === el) el.remove(); });
}

// ===== XP CELEBRATION =====
function showXPPop(amount, x, y) {
  const el = document.createElement('div');
  el.textContent = `+${amount} XP`;
  el.style.cssText = `position:fixed;left:${x}px;top:${y}px;font-size:16px;font-weight:800;color:#fbbf24;pointer-events:none;z-index:9999;animation:xpFloat 1.2s ease-out forwards;text-shadow:0 0 10px rgba(251,191,36,0.8)`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

// ===== ANIMATED COUNTER =====
function animateCounter(el, target, duration = 1200, prefix = '', suffix = '') {
  if (!el) return;
  const start = 0;
  const startTime = performance.now();
  const update = (time) => {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.round(start + (target - start) * ease);
    el.textContent = prefix + current.toLocaleString('en-IN') + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// ===== MOUSE GLOW EFFECT =====
function initMouseGlow() {
  document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.glass-card, .stat-card');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x > -100 && x < rect.width + 100 && y > -100 && y < rect.height + 100) {
        const nx = (x / rect.width) * 100;
        const ny = (y / rect.height) * 100;
        card.style.setProperty('--glow-x', nx + '%');
        card.style.setProperty('--glow-y', ny + '%');
        card.classList.add('mouse-glow');
      } else {
        card.classList.remove('mouse-glow');
      }
    });
  });
}

// ===== TIME-BASED THEME =====
function applyTimeTheme() {
  const h = new Date().getHours();
  const root = document.documentElement;
  if (h >= 5 && h < 12) {
    // Morning - warm golden
    root.style.setProperty('--theme-orb-1', '#f59e0b');
    root.style.setProperty('--theme-orb-2', '#6366f1');
    root.style.setProperty('--theme-orb-3', '#10b981');
  } else if (h >= 12 && h < 17) {
    // Afternoon - cool blue
    root.style.setProperty('--theme-orb-1', '#3b82f6');
    root.style.setProperty('--theme-orb-2', '#6366f1');
    root.style.setProperty('--theme-orb-3', '#8b5cf6');
  } else if (h >= 17 && h < 20) {
    // Evening - sunset purple/pink
    root.style.setProperty('--theme-orb-1', '#ec4899');
    root.style.setProperty('--theme-orb-2', '#8b5cf6');
    root.style.setProperty('--theme-orb-3', '#f59e0b');
  } else {
    // Night - deep indigo
    root.style.setProperty('--theme-orb-1', '#6366f1');
    root.style.setProperty('--theme-orb-2', '#8b5cf6');
    root.style.setProperty('--theme-orb-3', '#3b82f6');
  }
}

// ===== SPARKLINE HELPER =====
function renderSparkline(canvasId, data, color = '#6366f1') {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !data || data.length < 2) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth;
  const h = canvas.height = canvas.offsetHeight;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
  grad.addColorStop(1, color.replace(')', ', 0)').replace('rgb', 'rgba'));

  ctx.clearRect(0, 0, w, h);
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    if (i === 0) ctx.moveTo(x, y);
    else {
      const cx = (i - 0.5) * step;
      ctx.bezierCurveTo(cx, y + 5, cx, y, x, y);
    }
  });
  const lastX = (data.length - 1) * step;
  const lastY = h - ((data[data.length - 1] - min) / range) * (h - 4) - 2;
  ctx.lineTo(lastX, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  data.forEach((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    if (i === 0) ctx.moveTo(x, y);
    else {
      const cx = (i - 0.5) * step;
      ctx.bezierCurveTo(cx, y + 5, cx, y, x, y);
    }
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}
