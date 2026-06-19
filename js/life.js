// ===== HEALTH HUB =====
function renderHealth() {
  const entries = [...(STATE.healthEntries || [])].sort((a, b) => b.date.localeCompare(a.date));
  const todayEntry = entries.find(e => e.date === today());
  const last7 = entries.slice(0, 7);
  const avgSleep = last7.length ? (last7.reduce((s,e)=>s+(e.sleep||0),0)/last7.length).toFixed(1) : 0;
  const avgMood = last7.length ? (last7.reduce((s,e)=>s+(e.mood||5),0)/last7.length).toFixed(1) : 0;
  const totalSteps = last7.reduce((s,e)=>s+(e.steps||0),0);
  const avgWater = last7.length ? (last7.reduce((s,e)=>s+(e.water||0),0)/last7.length).toFixed(1) : 0;
  const moodEmojis = ['','😞','😟','😐','🙂','😊','😄','😁','🤩','😍','🥰'];

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header"><h1 class="page-title"><i data-lucide="heart-pulse"></i> Health Hub</h1><p class="page-subtitle">Track sleep, steps, mood & water daily</p></div>
      <div class="stat-grid">
        <div class="stat-card bg-blue"><span class="stat-card-icon">😴</span><div class="stat-card-value">${avgSleep}h</div><div class="stat-card-label">Avg Sleep (7 days)</div></div>
        <div class="stat-card bg-pink"><span class="stat-card-icon">😊</span><div class="stat-card-value">${avgMood}/10</div><div class="stat-card-label">Avg Mood (7 days)</div></div>
        <div class="stat-card bg-emerald"><span class="stat-card-icon">👟</span><div class="stat-card-value">${totalSteps.toLocaleString('en-IN')}</div><div class="stat-card-label">Steps (7 days)</div></div>
        <div class="stat-card bg-indigo"><span class="stat-card-icon">💧</span><div class="stat-card-value">${avgWater}</div><div class="stat-card-label">Avg Water (glasses)</div></div>
      </div>

      <!-- Today's Log -->
      <div class="glass-card" style="padding:22px;margin-bottom:20px">
        <div class="section-header"><p class="section-title"><i data-lucide="clipboard-list"></i> Today's Health Log</p>
          ${todayEntry ? '<span class="tag tag-green">✓ Logged today</span>' : '<span class="tag tag-gold">⚠ Not logged yet</span>'}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="health-form-grid">
          <div class="form-group"><label class="form-label">😴 Sleep Hours</label><input type="number" id="h-sleep" class="form-input" min="0" max="24" step="0.5" placeholder="7.5" value="${todayEntry?.sleep||''}"/></div>
          <div class="form-group"><label class="form-label">⭐ Sleep Quality (1-5)</label><input type="number" id="h-slq" class="form-input" min="1" max="5" placeholder="4" value="${todayEntry?.sleepQuality||''}"/></div>
          <div class="form-group"><label class="form-label">👟 Steps Walked</label><input type="number" id="h-steps" class="form-input" min="0" placeholder="8000" value="${todayEntry?.steps||''}"/></div>
          <div class="form-group"><label class="form-label">💧 Water (glasses)</label><input type="number" id="h-water" class="form-input" min="0" max="20" placeholder="8" value="${todayEntry?.water||''}"/></div>
        </div>
        <div class="form-group" style="margin-top:14px"><label class="form-label">😊 Mood Score (1-10)</label>
          <div class="mood-grid" id="mood-grid">
            ${[1,2,3,4,5,6,7,8,9,10].map(n => `<button class="mood-btn${todayEntry?.mood===n?' selected':''}" onclick="selectMood(${n})" id="mood-${n}">${moodEmojis[n]||n}<span style="font-size:10px;display:block">${n}</span></button>`).join('')}
          </div>
        </div>
        <div class="form-group" style="margin-top:12px"><label class="form-label">📝 How are you feeling?</label><textarea id="h-note" class="form-input" placeholder="Write how your day went..." style="min-height:70px">${todayEntry?.note||''}</textarea></div>
        <button class="btn-primary" style="margin-top:14px" onclick="saveHealthEntry()">Save Today's Health</button>
      </div>

      <!-- History Chart -->
      ${last7.length > 1 ? `<div class="glass-card" style="padding:20px;margin-bottom:20px">
        <p class="section-title" style="margin-bottom:16px"><i data-lucide="bar-chart-3"></i> 7-Day Sleep & Mood</p>
        <div class="chart-container"><canvas id="health-chart"></canvas></div>
      </div>` : ''}

      <!-- History -->
      ${entries.length > 0 ? `<div class="glass-card" style="overflow:hidden">
        <div style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.08)"><p class="section-title"><i data-lucide="calendar"></i> History</p></div>
        ${entries.slice(0,10).map(e => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.04)">
            <div><p style="font-weight:600;font-size:13px">${fmtDate(e.date)}</p><p style="font-size:11px;color:var(--text3)">${e.note||'No note'}</p></div>
            <div style="display:flex;gap:12px;text-align:center">
              <div><p style="font-size:14px">😴</p><p style="font-size:11px;color:rgba(241,245,249,0.6)">${e.sleep||'-'}h</p></div>
              <div><p style="font-size:14px">${moodEmojis[e.mood||5]}</p><p style="font-size:11px;color:rgba(241,245,249,0.6)">${e.mood||'-'}/10</p></div>
              <div><p style="font-size:14px">👟</p><p style="font-size:11px;color:rgba(241,245,249,0.6)">${(e.steps||0).toLocaleString()}</p></div>
              <div><p style="font-size:14px">💧</p><p style="font-size:11px;color:rgba(241,245,249,0.6)">${e.water||0}g</p></div>
            </div>
          </div>`).join('')}
      </div>` : ''}
    </div>`;

  if (window.innerWidth < 600) {
    const g = document.querySelector('.health-form-grid');
    if (g) g.style.gridTemplateColumns = '1fr';
  }
  if (last7.length > 1) renderHealthChart(last7.reverse());
}

let selectedMood = null;
function selectMood(n) {
  selectedMood = n;
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('mood-' + n)?.classList.add('selected');
}

function saveHealthEntry() {
  const sleep = parseFloat(document.getElementById('h-sleep').value) || 0;
  const sleepQuality = parseInt(document.getElementById('h-slq').value) || 3;
  const steps = parseInt(document.getElementById('h-steps').value) || 0;
  const water = parseInt(document.getElementById('h-water').value) || 0;
  const mood = selectedMood || 5;
  const note = document.getElementById('h-note').value.trim();
  STATE.healthEntries = STATE.healthEntries || [];
  const idx = STATE.healthEntries.findIndex(e => e.date === today());
  const entry = { id: genId(), date: today(), sleep, sleepQuality, steps, water, mood, note };
  if (idx >= 0) STATE.healthEntries[idx] = { ...STATE.healthEntries[idx], ...entry };
  else STATE.healthEntries.push(entry);
  saveState();
  addXP(15, 'Health logged');
  toast('Health logged! +15 XP 🏥', 'success');
  selectedMood = null;
  renderHealth();
}

function renderHealthChart(data) {
  const canvas = document.getElementById('health-chart');
  if (!canvas) return;
  chartInstances['health'] = new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.map(e => fmtDate(e.date).split(' ').slice(0,2).join(' ')),
      datasets: [
        { label: 'Sleep (hrs)', data: data.map(e=>e.sleep||0), borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.12)',  tension: 0.4, fill: true, borderWidth: 2.5, pointRadius: 3 },
        { label: 'Mood (/10)',   data: data.map(e=>e.mood||0),  borderColor: '#ec4899', backgroundColor: 'rgba(236,72,153,0.12)', tension: 0.4, fill: true, borderWidth: 2.5, pointRadius: 3 },
        { label: 'Water (gl)',   data: data.map(e=>e.water||0), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.12)', tension: 0.4, fill: true, borderWidth: 2.5, pointRadius: 3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8' } } },
      scales: {
        x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

function getHabitGridHTML(habits, comps) {
  const cells = [];
  const todayObj = new Date();
  const currentDayOfWeek = todayObj.getDay(); // 0 is Sunday, 6 is Saturday
  
  // Align grid to end on Saturday of the current week
  const endDate = new Date(todayObj);
  endDate.setDate(todayObj.getDate() + (6 - currentDayOfWeek));
  
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 139); // 20 weeks * 7 days = 140 days
  
  const todayStr = today();
  
  for (let i = 0; i < 140; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const ds = d.toISOString().slice(0, 10);
    const isFuture = ds > todayStr;
    
    if (isFuture) {
      cells.push(`<div class="habit-grid-cell future" title="Future" style="width:12px;height:12px;border-radius:2px;background:transparent;border:1.5px dashed rgba(255,255,255,0.04)"></div>`);
    } else {
      const completedCount = habits.filter(h => {
        if (!h.target) {
          return comps.some(c => c.habitId === h.id && c.date === ds);
        } else {
          return ((STATE.habitLogs?.[h.id]?.[ds]) || 0) >= h.target;
        }
      }).length;
      
      const activeCount = habits.length;
      let level = 0;
      if (activeCount > 0 && completedCount > 0) {
        const ratio = completedCount / activeCount;
        if (ratio <= 0.25) level = 1;
        else if (ratio <= 0.50) level = 2;
        else if (ratio <= 0.75) level = 3;
        else level = 4;
      }
      
      const formattedDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      const completionText = completedCount === 1 ? '1 habit completed' : `${completedCount} habits completed`;
      const title = `${completionText} on ${formattedDate}`;
      
      cells.push(`<div class="habit-grid-cell level-${level}" title="${title}" style="width:12px;height:12px;border-radius:2px;"></div>`);
    }
  }
  return cells.join('');
}

// ===== HABITS PAGE =====
function renderHabits() {
  const habits = STATE.habits || [];
  const comps  = STATE.habitCompletions || [];
  const logs   = STATE.habitLogs || {};          // { habitId: { date: amount } }
  const todayStr = today();

  // A habit is "done" today if: no target → toggled on, or has target → logged >= target
  function isDone(h) {
    if (!h.target) return comps.some(c => c.habitId === h.id && c.date === todayStr);
    const logged = (logs[h.id] && logs[h.id][todayStr]) || 0;
    return logged >= h.target;
  }
  function getLogged(h) { return (logs[h.id] && logs[h.id][todayStr]) || 0; }
  function getPct(h)    { return h.target ? Math.min(100, Math.round((getLogged(h) / h.target) * 100)) : (isDone(h) ? 100 : 0); }

  const doneCount = habits.filter(h => isDone(h)).length;
  const completionPct = habits.length > 0 ? Math.round(doneCount / habits.length * 100) : 0;

  function getStreak(habitId) {
    let streak = 0;
    const d = new Date();
    while (true) {
      const ds = d.toISOString().slice(0, 10);
      const h  = habits.find(x => x.id === habitId);
      let doneThat = false;
      if (h && h.target) {
        doneThat = ((STATE.habitLogs?.[habitId]?.[ds]) || 0) >= h.target;
      } else {
        doneThat = comps.some(c => c.habitId === habitId && c.date === ds);
      }
      if (doneThat) { streak++; d.setDate(d.getDate() - 1); } else break;
    }
    return streak;
  }

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div><h1 class="page-title"><i data-lucide="flame"></i> Habit Tracker</h1><p class="page-subtitle">Build life-changing daily habits</p></div>
        <button class="btn-primary btn-sm" onclick="openAddHabitModal()">+ New Habit</button>
      </div>

      <!-- Daily Progress -->
      <div class="glass-card" style="padding:20px;margin-bottom:20px">
        <div class="section-header"><p class="section-title">Today's Progress</p><span style="font-size:22px;font-weight:900;color:${completionPct===100?'#10b981':'#fbbf24'}">${completionPct}%</span></div>
        <div class="progress-bar" style="height:12px;margin-bottom:8px"><div class="progress-fill" style="width:${completionPct}%;background:${completionPct===100?'linear-gradient(90deg,#10b981,#059669)':'linear-gradient(90deg,#f59e0b,#f97316)'}"></div></div>
        <p style="font-size:12px;color:var(--text3)">${doneCount} of ${habits.length} habits completed today</p>
      </div>

      <!-- Habits Contribution Heatmap -->
      <div class="glass-card habit-heatmap-card" style="padding:20px;margin-bottom:20px;overflow-x:auto">
        <div class="section-header" style="margin-bottom:10px">
          <p class="section-title" style="font-size:16px"><i data-lucide="calendar"></i> Consistency Grid</p>
          <span style="font-size:12px;color:var(--text3)">Last 140 days</span>
        </div>
        <div class="habit-heatmap-container" style="display:flex;flex-direction:column;gap:8px">
          <div class="habit-heatmap-grid" style="display:grid;grid-template-rows:repeat(7, 1fr);grid-auto-flow:column;gap:4px;width:max-content;margin:0 auto">
            ${getHabitGridHTML(habits, comps)}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;color:var(--text3);margin-top:4px">
            <span>Less</span>
            <div style="display:flex;gap:3px;align-items:center">
              <span class="heatmap-legend-cell level-0" style="width:10px;height:10px;border-radius:2px;"></span>
              <span class="heatmap-legend-cell level-1" style="width:10px;height:10px;border-radius:2px;"></span>
              <span class="heatmap-legend-cell level-2" style="width:10px;height:10px;border-radius:2px;"></span>
              <span class="heatmap-legend-cell level-3" style="width:10px;height:10px;border-radius:2px;"></span>
              <span class="heatmap-legend-cell level-4" style="width:10px;height:10px;border-radius:2px;"></span>
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

      <!-- Habits List -->
      ${habits.length === 0
        ? `<div class="glass-card" style="padding:40px"><div class="empty-state"><span class="empty-state-icon"><i data-lucide="flame"></i></span><p>No habits yet. Add your first habit to start building streaks!</p></div></div>`
        : habits.map(h => {
          const done    = isDone(h);
          const streak  = getStreak(h.id);
          const logged  = getLogged(h);
          const pct     = getPct(h);
          const hasTarget = !!h.target;

          return `<div class="habit-item" style="flex-direction:column;align-items:stretch;gap:10px;padding:16px 18px">
            <div style="display:flex;align-items:center;gap:12px">
              <button class="habit-check ${done?'done':''}" onclick="${hasTarget ? `logHabitFull('${h.id}')` : `toggleHabit('${h.id}')`}" title="${done?'Mark undone':'Mark done'}">${done?'✓':''}</button>
              <div class="habit-info" style="flex:1">
                <div class="habit-name">${h.emoji||'⭕'} ${h.name}${hasTarget ? `<span style="font-size:11px;font-weight:400;color:var(--text3);margin-left:8px">Target: ${h.target} ${h.unit||''}</span>` : ''}</div>
                ${streak > 0
                  ? `<div class="habit-streak">🔥 ${streak}-day streak</div>`
                  : `<div class="habit-streak" style="color:var(--text3)">Start your streak today!</div>`}
              </div>
              <button class="btn-icon btn-sm" onclick="deleteHabit('${h.id}')" style="color:#ef4444;border-color:rgba(239,68,68,0.3)">✕</button>
            </div>

            ${hasTarget ? `
            <!-- Progress bar for target habits -->
            <div>
              <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3);margin-bottom:5px">
                <span>${logged} / ${h.target} ${h.unit||''}</span>
                <span style="font-weight:700;color:${done?'#10b981':'#fbbf24'}">${pct}%</span>
              </div>
              <div class="progress-bar" style="height:8px;margin-bottom:10px">
                <div class="progress-fill" style="width:${pct}%;background:${done?'linear-gradient(90deg,#10b981,#059669)':'linear-gradient(90deg,#00b09b,#00c9a7)'}"></div>
              </div>
              <div style="display:flex;gap:8px;align-items:center">
                <input type="number" id="log-${h.id}" class="form-input" placeholder="How much did you do? (${h.unit||'units'})" style="flex:1;padding:8px 12px;font-size:13px" min="0" max="${h.target}"/>
                <button class="btn-primary btn-sm" onclick="logHabitProgress('${h.id}')">+ Log</button>
                ${logged > 0 ? `<button class="btn-secondary btn-sm" onclick="resetHabitLog('${h.id}')" style="font-size:11px">↺ Reset</button>` : ''}
              </div>
            </div>` : ''}
          </div>`;
        }).join('')}
    </div>`;
}

function toggleHabit(id) {
  const todayStr = today();
  STATE.habitCompletions = STATE.habitCompletions || [];
  const idx = STATE.habitCompletions.findIndex(c => c.habitId === id && c.date === todayStr);
  if (idx >= 0) { STATE.habitCompletions.splice(idx, 1); }
  else { STATE.habitCompletions.push({ id: genId(), habitId: id, date: todayStr }); addXP(5, 'Habit completed'); toast('+5 XP 🔥', 'success'); }
  saveState();
  renderHabits();
}

function logHabitProgress(id) {
  const h = (STATE.habits || []).find(x => x.id === id);
  if (!h) return;
  const input = document.getElementById('log-' + id);
  const amount = parseFloat(input?.value) || 0;
  if (amount <= 0) { toast('Enter how much you did', 'error'); return; }

  STATE.habitLogs = STATE.habitLogs || {};
  STATE.habitLogs[id] = STATE.habitLogs[id] || {};
  const prev = STATE.habitLogs[id][today()] || 0;
  STATE.habitLogs[id][today()] = Math.min(h.target, prev + amount);

  const newLogged = STATE.habitLogs[id][today()];
  const done = newLogged >= h.target;
  if (done) { addXP(5, 'Habit completed'); toast(`✅ ${h.name} complete! +5 XP 🔥`, 'success'); }
  else { toast(`Logged ${newLogged}/${h.target} ${h.unit||''} 👍`, 'info'); }

  saveState();
  renderHabits();
}

function logHabitFull(id) {
  // Toggle full completion for target habits
  const h = (STATE.habits || []).find(x => x.id === id);
  if (!h) return;
  STATE.habitLogs = STATE.habitLogs || {};
  STATE.habitLogs[id] = STATE.habitLogs[id] || {};
  const curr = STATE.habitLogs[id][today()] || 0;
  if (curr >= h.target) { STATE.habitLogs[id][today()] = 0; toast('Marked undone', 'info'); }
  else { STATE.habitLogs[id][today()] = h.target; addXP(5, 'Habit completed'); toast(`✅ +5 XP 🔥`, 'success'); }
  saveState();
  renderHabits();
}

function resetHabitLog(id) {
  STATE.habitLogs = STATE.habitLogs || {};
  if (STATE.habitLogs[id]) STATE.habitLogs[id][today()] = 0;
  saveState();
  renderHabits();
  toast('Progress reset', 'info');
}

function openAddHabitModal() {
  openModal('New Habit', `
    <div class="form-group"><label class="form-label">Habit Name</label><input type="text" id="hab-name" class="form-input" placeholder="e.g. Read, Morning Run, Drink Water"/></div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Emoji Icon</label><input type="text" id="hab-emoji" class="form-input" placeholder="📚" maxlength="4"/></div>
      <div class="form-group"><label class="form-label">Type</label>
        <select id="hab-hasTarget" class="form-input" onchange="document.getElementById('hab-target-row').style.display=this.value==='target'?'flex':'none'">
          <option value="simple">✅ Simple (done/not done)</option>
          <option value="target">📊 With Target (track progress)</option>
        </select>
      </div>
    </div>
    <div class="input-row" id="hab-target-row" style="display:none">
      <div class="form-group"><label class="form-label">Daily Target</label><input type="number" id="hab-target" class="form-input" placeholder="e.g. 60"/></div>
      <div class="form-group"><label class="form-label">Unit</label><input type="text" id="hab-unit" class="form-input" placeholder="mins / glasses / pages"/></div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveHabit()">Create Habit</button>
    </div>`);
}

function saveHabit() {
  const name      = document.getElementById('hab-name').value.trim();
  const emoji     = document.getElementById('hab-emoji').value.trim() || '⭕';
  const hasTarget = document.getElementById('hab-hasTarget').value === 'target';
  const target    = hasTarget ? parseFloat(document.getElementById('hab-target').value) : null;
  const unit      = hasTarget ? document.getElementById('hab-unit').value.trim() : null;
  if (!name) { toast('Enter habit name', 'error'); return; }
  if (hasTarget && (!target || target <= 0)) { toast('Enter a valid target number', 'error'); return; }
  STATE.habits = STATE.habits || [];
  STATE.habits.push({ id: genId(), name, emoji, target: target || null, unit: unit || null, createdAt: new Date().toISOString() });
  saveState(); addXP(20, 'New habit created'); closeModal(); toast('Habit created! +20 XP', 'success'); renderHabits();
}

function deleteHabit(id) {
  STATE.habits = (STATE.habits || []).filter(h => h.id !== id);
  STATE.habitCompletions = (STATE.habitCompletions || []).filter(c => c.habitId !== id);
  if (STATE.habitLogs) delete STATE.habitLogs[id];
  saveState(); toast('Habit deleted', 'info'); renderHabits();
}

// ===== GOALS PAGE =====

// Helper to display clean sync source labels on goal cards
function _goalSyncSourceLabel(g) {
  if (!g.autoSync) return '';
  const sources = g.syncSources || ['net-savings'];
  if (sources.length === 1 && sources[0] === 'net-savings') return 'Auto-synced';
  
  const resolved = [];
  sources.forEach(src => {
    if (src === 'net-savings') resolved.push('Net Savings');
    else if (src === 'bank-cash') resolved.push('Bank & Cash');
    else if (src === 'investments') resolved.push('Investments');
    else if (src === 'net-worth') resolved.push('Net Worth');
    else if (src.startsWith('bank:')) {
      const id = src.slice(5);
      const acct = (STATE.bankAccounts || []).find(b => b.id === id);
      if (acct) resolved.push(acct.name);
    } else if (src.startsWith('invest:')) {
      const id = src.slice(7);
      const inv = (STATE.investments || []).find(i => i.id === id);
      if (inv) resolved.push(inv.name);
    }
  });
  if (resolved.length === 0) return 'Auto-synced';
  return 'Synced: ' + resolved.join(', ');
}

// Auto-sync savings goals with transaction data & custom sources (bank/investments/etc)
function autoSyncGoals() {
  const txns = STATE.transactions || [];
  const income  = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netSavings = Math.max(0, income - expense);
  
  const bankAccounts = STATE.bankAccounts || [];
  const cashAccounts = STATE.cashAccounts || [];
  const investments = STATE.investments || [];
  
  let changed = false;
  (STATE.goals || []).forEach(g => {
    if (g.autoSync && g.type === 'savings') {
      let sum = 0;
      const sources = g.syncSources || ['net-savings'];
      
      sources.forEach(src => {
        if (src === 'net-savings') {
          sum += netSavings;
        } else if (src === 'bank-cash') {
          const bankTot = bankAccounts.reduce((s,b)=>s+(b.balance||0),0);
          const cashTot = cashAccounts.reduce((s,c)=>s+(c.balance||0),0);
          sum += (bankTot + cashTot);
        } else if (src === 'investments') {
          sum += investments.reduce((s,i)=>s+(+i.currentValue || +i.amount || +i.value || 0),0);
        } else if (src === 'net-worth') {
          const bankTot = bankAccounts.reduce((s,b)=>s+(b.balance||0),0);
          const cashTot = cashAccounts.reduce((s,c)=>s+(c.balance||0),0);
          const cardOut = (STATE.creditCards || []).reduce((s,c)=>s+(c.outstanding||0),0);
          const loanDebt = (STATE.loans || []).reduce((s,l)=>s+(+l.outstanding||0),0);
          const invVal = investments.reduce((s,i)=>s+(+i.currentValue || +i.amount || +i.value || 0),0);
          sum += (bankTot + cashTot + invVal - cardOut - loanDebt);
        } else if (src.startsWith('bank:')) {
          const id = src.slice(5);
          const acct = bankAccounts.find(b => b.id === id);
          if (acct) sum += (acct.balance || 0);
        } else if (src.startsWith('invest:')) {
          const id = src.slice(7);
          const inv = investments.find(i => i.id === id);
          if (inv) sum += (+inv.currentValue || +inv.amount || +inv.value || 0);
        }
      });
      
      g.current = Math.min(g.target, sum);
      changed = true;
    }
  });
  if (changed) saveState();
}

function renderGoals() {
  // Always auto-sync before rendering
  autoSyncGoals();
  const goals = STATE.goals || [];
  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div><h1 class="page-title"><i data-lucide="rocket"></i> Goals</h1><p class="page-subtitle">Track your life goals with AI-powered insights</p></div>
        <button class="btn-primary btn-sm" onclick="openAddGoalModal()">+ New Goal</button>
      </div>
      ${goals.length === 0
        ? `<div class="glass-card" style="padding:40px"><div class="empty-state"><span class="empty-state-icon"><i data-lucide="rocket"></i></span><p>No goals yet. Set your first life goal!</p></div></div>`
        : `<div style="display:flex;flex-direction:column;gap:14px">
          ${goals.map(g => {
            const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
            const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000) : null;
            const done = pct >= 100;
            return `<div class="glass-card goal-card" style="padding:18px${done?';border-color:rgba(16,185,129,0.4)':''};cursor:pointer" onclick="openEditGoalModal('${g.id}')">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px">
                <div style="display:flex;align-items:center;gap:11px;flex:1;min-width:0">
                  <span class="goal-ic" style="background:${done?'rgba(16,185,129,0.15)':'rgba(99,102,241,0.15)'};color:${done?'#10b981':'#8b5cf6'}"><i data-lucide="${done?'check-circle-2':'target'}"></i></span>
                  <div style="min-width:0">
                    <p style="font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${g.name}</p>
                    <p style="font-size:12px;color:var(--text3);display:flex;align-items:center;gap:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${g.category||'Personal'}${g.autoSync ? ' · <i data-lucide="link" class="goal-mini-ic" style="color:#00c9a7"></i> <span style="color:#00c9a7">' + _goalSyncSourceLabel(g) + '</span>' : ''}</p>
                  </div>
                </div>
                <button class="goal-x" onclick="event.stopPropagation();deleteGoal('${g.id}')" title="Delete goal"><i data-lucide="x"></i></button>
              </div>
              <div class="goal-chips" style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:14px" onclick="event.stopPropagation()">
                ${done ? '<span class="tag tag-green">Complete</span>' : daysLeft !== null ? `<span class="tag ${daysLeft<7?'tag-red':daysLeft<30?'tag-gold':'tag-blue'}">${daysLeft>0?daysLeft+' days left':'Overdue'}</span>` : ''}
                ${!g.autoSync && g.type==='savings' ? `<button class="goal-chip-btn" title="Sync with sources" onclick="toggleGoalSync('${g.id}')" style="color:#00c9a7;border-color:rgba(0,201,167,0.35)"><i data-lucide="link"></i> Sync</button>` : ''}
                ${g.autoSync ? `<button class="goal-chip-btn" title="Disable auto-sync" onclick="toggleGoalSync('${g.id}')" style="color:#f59e0b;border-color:rgba(245,158,11,0.35)"><i data-lucide="lock"></i> Manual</button>` : ''}
              </div>
              ${g.type === 'savings' ? `
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
                  <span style="color:var(--text2)">Progress: ${fmt(g.current)} / ${fmt(g.target)}</span>
                  <span style="font-weight:700;color:${done?'#10b981':'#fbbf24'}">${pct}%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${done?'#10b981':'linear-gradient(90deg,#00b09b,#00c9a7)'}"></div></div>
                ${!g.autoSync ? `
                <div style="margin-top:12px;display:flex;gap:8px" onclick="event.stopPropagation()">
                  <input type="number" id="goal-upd-${g.id}" class="form-input" placeholder="Add amount manually" style="flex:1"/>
                  <button class="btn-primary btn-sm" onclick="updateGoalProgress('${g.id}')">+ Add</button>
                </div>` : `<p style="font-size:11px;color:var(--text3);margin-top:8px;display:flex;align-items:center;gap:5px"><i data-lucide="link" class="goal-mini-ic"></i> Automatically updates from your linked source(s)</p>`}
              ` : `
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
                  <span style="color:var(--text2)">${g.description||'Milestone goal'}</span>
                  <span style="font-weight:700;color:${done?'#10b981':'#fbbf24'}">${pct}%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${done?'#10b981':'linear-gradient(90deg,#6366f1,#8b5cf6)'}"></div></div>`}
            </div>`;
          }).join('')}
        </div>`}
    </div>`;
}

// Build the auto-sync source picker (shared by the New / Edit Goal modals).
// `checked` is the list of selected source values. Checkboxes use the
// `.auto-cb` class so the broad `html.is-app input` rule doesn't stretch them
// into full-width glass blocks (the cause of the old broken layout).
function _goalSourcesHTML(checked) {
  const sel = new Set(checked || []);
  const row = (value, icon, name, val) => `
    <label class="gl-src-row" style="display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:11px;background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);cursor:pointer;font-size:13px">
      <input type="checkbox" class="auto-cb" name="g-source" value="${value}" ${sel.has(value) ? 'checked' : ''}/>
      <span class="gl-src-ic" style="font-size:16px;flex-shrink:0">${icon}</span>
      <span class="gl-src-name" style="flex:1;font-weight:600;min-width:0">${name}</span>
      ${val != null ? `<span class="gl-src-val" style="color:var(--text3);font-weight:600;white-space:nowrap">${val}</span>` : ''}
    </label>`;
  let html = `<div class="gl-src-list" style="display:flex;flex-direction:column;gap:8px;margin-top:10px">`;
  html += row('net-savings', '🔗', 'Net Savings (Income − Expenses)');
  html += row('bank-cash', '🏦', 'Total Bank &amp; Cash Balance');
  html += row('investments', '📈', 'Total Investment Value');
  const banks = STATE.bankAccounts || [];
  if (banks.length) {
    html += `<p class="gl-src-head" style="font-size:11px;font-weight:700;color:var(--text3);letter-spacing:.5px;margin:6px 0 0">BANK ACCOUNTS</p>`;
    banks.forEach(b => { html += row('bank:' + b.id, '🏦', esc(b.name), fmt(b.balance)); });
  }
  const invs = STATE.investments || [];
  if (invs.length) {
    html += `<p class="gl-src-head" style="font-size:11px;font-weight:700;color:var(--text3);letter-spacing:.5px;margin:6px 0 0">INVESTMENTS</p>`;
    invs.forEach(i => { const v = +i.currentValue || +i.amount || +i.value || 0; html += row('invest:' + i.id, '📈', esc(i.name), fmt(v)); });
  }
  return html + `</div>`;
}

function openAddGoalModal() {
  const sourcesHTML = _goalSourcesHTML(['net-savings']);

  openModal('New Goal', `
    <div class="form-group"><label class="form-label">Goal Name</label><input type="text" id="g-name" class="form-input" placeholder="e.g. Emergency Fund, Learn Python"/></div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Type</label><select id="g-type" class="form-input" onchange="document.getElementById('g-sync-wrap').style.display=this.value==='savings'?'block':'none'"><option value="savings">💰 Savings Goal</option><option value="milestone">🎯 Milestone</option></select></div>
      <div class="form-group"><label class="form-label">Emoji</label><input type="text" id="g-emoji" class="form-input" placeholder="🎯" maxlength="4"/></div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Target Amount / %</label><input type="number" id="g-target" class="form-input" placeholder="100000"/></div>
      <div class="form-group"><label class="form-label">Deadline</label><input type="date" id="g-deadline" class="form-input"/></div>
    </div>
    <div class="form-group" id="g-sync-wrap" style="padding:12px;background:rgba(0,201,167,0.08);border:1px solid rgba(0,201,167,0.2);border-radius:10px">
      <label style="display:flex;align-items:center;gap:10px;cursor:pointer" onclick="var ch = document.getElementById('g-autosync'); document.getElementById('g-sources-container').style.display = ch.checked ? 'block' : 'none'">
        <input type="checkbox" class="auto-cb" id="g-autosync" onchange="document.getElementById('g-sources-container').style.display = this.checked ? 'block' : 'none'"/>
        <div>
          <p style="font-weight:600;font-size:13px">🔗 Auto-sync with sources</p>
          <p style="font-size:11px;color:var(--text3)">Select one or multiple financial sources below to sync progress automatically</p>
        </div>
      </label>
      <div id="g-sources-container" style="display:none;border-top:1px solid rgba(0,201,167,0.15);margin-top:8px;padding-top:6px">
        ${sourcesHTML}
      </div>
    </div>
    <div class="form-group"><label class="form-label">Description</label><input type="text" id="g-desc" class="form-input" placeholder="Why is this goal important?"/></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveGoal()">Create Goal</button>
    </div>`);
}

function saveGoal() {
  const name = document.getElementById('g-name').value.trim();
  const type = document.getElementById('g-type').value;
  const target = parseFloat(document.getElementById('g-target').value) || 100;
  const emoji = document.getElementById('g-emoji').value.trim() || '🎯';
  const deadline = document.getElementById('g-deadline').value;
  const description = document.getElementById('g-desc').value.trim();
  const autoSync = type === 'savings' && (document.getElementById('g-autosync')?.checked || false);
  
  const syncSources = [];
  if (autoSync) {
    document.querySelectorAll('input[name="g-source"]:checked').forEach(cb => {
      syncSources.push(cb.value);
    });
  }
  
  if (!name) { toast('Enter goal name', 'error'); return; }
  STATE.goals = STATE.goals || [];
  STATE.goals.push({ 
    id: genId(), 
    name, 
    type, 
    target, 
    current: 0, 
    emoji, 
    deadline, 
    description, 
    autoSync, 
    syncSources: syncSources.length ? syncSources : ['net-savings'],
    createdAt: new Date().toISOString() 
  });
  saveState(); addXP(30, 'Goal created'); closeModal(); toast('Goal created! +30 XP 🚀', 'success');
  autoSyncGoals();
  renderGoals();
}

function toggleGoalSync(id) {
  const goal = (STATE.goals || []).find(g => g.id === id);
  if (!goal) return;
  goal.autoSync = !goal.autoSync;
  if (goal.autoSync && (!goal.syncSources || !goal.syncSources.length)) {
    goal.syncSources = ['net-savings'];
  }
  saveState();
  autoSyncGoals();
  renderGoals();
  toast(goal.autoSync ? '🔗 Auto-sync ON' : '🔓 Manual mode', 'info');
}

function updateGoalProgress(id) {
  const input = document.getElementById('goal-upd-' + id);
  const amount = parseFloat(input?.value) || 0;
  if (!amount) { toast('Enter an amount', 'error'); return; }
  const goal = (STATE.goals || []).find(g => g.id === id);
  if (!goal) return;
  goal.current = Math.min(goal.target, (goal.current || 0) + amount);
  saveState(); addXP(10); toast('Progress updated! +10 XP', 'success'); renderGoals();
}

function deleteGoal(id) {
  STATE.goals = (STATE.goals || []).filter(g => g.id !== id);
  saveState(); toast('Goal deleted', 'info'); renderGoals();
}

function openEditGoalModal(id) {
  const goal = (STATE.goals || []).find(g => g.id === id);
  if (!goal) return;

  const sourcesHTML = _goalSourcesHTML(goal.syncSources || []);

  openModal('Edit Goal', `
    <div class="form-group"><label class="form-label">Goal Name</label><input type="text" id="g-name" class="form-input" value="${esc(goal.name || '')}"/></div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Type</label><select id="g-type" class="form-input" onchange="document.getElementById('g-sync-wrap').style.display=this.value==='savings'?'block':'none'"><option value="savings" ${goal.type==='savings'?'selected':''}>💰 Savings Goal</option><option value="milestone" ${goal.type==='milestone'?'selected':''}>🎯 Milestone</option></select></div>
      <div class="form-group"><label class="form-label">Emoji</label><input type="text" id="g-emoji" class="form-input" value="${esc(goal.emoji || '🎯')}" maxlength="4"/></div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Target Amount / %</label><input type="number" id="g-target" class="form-input" value="${goal.target || 100}"/></div>
      <div class="form-group"><label class="form-label">Current Progress</label><input type="number" id="g-current" class="form-input" value="${goal.current || 0}" ${goal.autoSync ? 'disabled style="opacity:0.5"' : ''}/></div>
    </div>
    <div class="form-group"><label class="form-label">Deadline</label><input type="date" id="g-deadline" class="form-input" value="${goal.deadline || ''}"/></div>
    
    <div class="form-group" id="g-sync-wrap" style="padding:12px;background:rgba(0,201,167,0.08);border:1px solid rgba(0,201,167,0.2);border-radius:10px;display:${goal.type==='savings'?'block':'none'}">
      <label style="display:flex;align-items:center;gap:10px;cursor:pointer" onclick="var ch = document.getElementById('g-autosync'); document.getElementById('g-sources-container').style.display = ch.checked ? 'block' : 'none'">
        <input type="checkbox" class="auto-cb" id="g-autosync" ${goal.autoSync ? 'checked' : ''} onchange="document.getElementById('g-sources-container').style.display = this.checked ? 'block' : 'none'; document.getElementById('g-current').disabled = this.checked; document.getElementById('g-current').style.opacity = this.checked ? '0.5' : '1';"/>
        <div>
          <p style="font-weight:600;font-size:13px">🔗 Auto-sync with sources</p>
          <p style="font-size:11px;color:var(--text3)">Select one or multiple financial sources below to sync progress automatically</p>
        </div>
      </label>
      <div id="g-sources-container" style="display:${goal.autoSync ? 'block' : 'none'};border-top:1px solid rgba(0,201,167,0.15);margin-top:8px;padding-top:6px">
        ${sourcesHTML}
      </div>
    </div>
    <div class="form-group"><label class="form-label">Description</label><input type="text" id="g-desc" class="form-input" value="${esc(goal.description || '')}" placeholder="Why is this goal important?"/></div>
    <div class="modal-actions">
      <button class="btn-secondary" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:#ef4444" onclick="event.stopPropagation(); deleteGoal('${goal.id}'); closeModal();">Delete</button>
      <div style="display:flex;gap:8px">
        <button class="btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn-primary" onclick="updateGoal('${goal.id}')">Save Changes</button>
      </div>
    </div>`);
}

function updateGoal(id) {
  const goal = (STATE.goals || []).find(g => g.id === id);
  if (!goal) return;

  const name = document.getElementById('g-name').value.trim();
  const type = document.getElementById('g-type').value;
  const target = parseFloat(document.getElementById('g-target').value) || 100;
  const emoji = document.getElementById('g-emoji').value.trim() || '🎯';
  const deadline = document.getElementById('g-deadline').value;
  const description = document.getElementById('g-desc').value.trim();
  const autoSync = type === 'savings' && (document.getElementById('g-autosync')?.checked || false);
  const current = parseFloat(document.getElementById('g-current').value) || 0;

  const syncSources = [];
  if (autoSync) {
    document.querySelectorAll('input[name="g-source"]:checked').forEach(cb => {
      syncSources.push(cb.value);
    });
  }

  if (!name) { toast('Enter goal name', 'error'); return; }

  goal.name = name;
  goal.type = type;
  goal.target = target;
  goal.emoji = emoji;
  goal.deadline = deadline;
  goal.description = description;
  goal.autoSync = autoSync;
  if (autoSync) {
    goal.syncSources = syncSources.length ? syncSources : ['net-savings'];
  } else {
    goal.current = current;
    delete goal.syncSources;
  }

  saveState();
  closeModal();
  toast('Goal updated successfully!', 'success');
  autoSyncGoals();
  renderGoals();
}
