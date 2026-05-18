// ===== ANALYTICS PAGE =====
function renderAnalytics() {
  const scores = calcLifeScore();
  const txns = STATE.transactions || [];
  const income = txns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense = txns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const catMap = {};
  txns.filter(t=>t.type==='expense').forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+t.amount;});
  const topCats = Object.entries(catMap).sort(([,a],[,b])=>b-a).slice(0,6);
  const health = STATE.healthEntries || [];
  const last14 = health.slice(-14);

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header"><h1 class="page-title">Life Analytics</h1><p class="page-subtitle">Deep insights across all life dimensions</p></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px" class="analytics-grid">
        <div class="glass-card" style="padding:20px">
          <p class="section-title" style="margin-bottom:16px">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:6px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Life Score Breakdown
          </p>
          <div style="display:flex;flex-direction:column;gap:14px">
            ${[
              {label:'Wealth',      icon:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>', val:scores.wealthScore,    color:'#6366f1', page:'finance' },
              {label:'Health',      icon:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',                                                                                                                             val:scores.healthScore,    color:'#10b981', page:'health' },
              {label:'Productivity',icon:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',                                                                                                     val:scores.prodScore,      color:'#f59e0b', page:'habits' },
              {label:'Emotional',   icon:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>', val:scores.emotionalScore, color:'#3b82f6', page:'journal' },
            ].map(s=>`
              <div onclick="navigate('${s.page}')" style="cursor:pointer;padding:6px 8px;border-radius:10px;transition:.15s" onmouseover="this.style.background='rgba(0,201,167,0.08)'" onmouseout="this.style.background=''">
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px">
                  <span style="display:flex;align-items:center;gap:5px">${s.icon}${s.label}</span>
                  <span style="font-weight:700;color:${s.color}">${s.val}/100 ↗</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width:${s.val}%;background:${s.color}"></div></div>
              </div>`).join('')}
          </div>
          <div onclick="navigate('analytics')" style="margin-top:16px;text-align:center;padding:16px;background:rgba(251,191,36,0.1);border-radius:12px;border:1px solid rgba(251,191,36,0.2);cursor:pointer">
            <p style="font-size:36px;font-weight:900;color:#fbbf24">${scores.overall}</p>
            <p style="font-size:13px;color:rgba(241,245,249,0.6)">Overall Life Score</p>
          </div>
        </div>
        <div class="glass-card" style="padding:20px">
          <p class="section-title" style="margin-bottom:16px">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:6px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Spending by Category
          </p>
          ${topCats.length===0
            ?`<div class="empty-state"><span class="empty-state-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span><p>Add transactions to see spending analysis.</p></div>`
            :`<div class="chart-container" style="height:180px"><canvas id="cat-chart"></canvas></div>
              <div style="margin-top:12px;display:flex;flex-direction:column;gap:6px">
                ${topCats.map(([cat,amt])=>`
                  <div onclick="navigate('finance')" style="display:flex;justify-content:space-between;font-size:12px;cursor:pointer;padding:3px 4px;border-radius:6px;transition:.1s" onmouseover="this.style.background='rgba(0,201,167,0.06)'" onmouseout="this.style.background=''">
                    <span>${cat}</span><span style="font-weight:600">${fmt(amt)}</span>
                  </div>`).join('')}
              </div>`}
        </div>
      </div>
      <div class="glass-card" style="padding:20px;margin-bottom:20px">
        <p class="section-title" style="margin-bottom:16px">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:6px"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>Income vs Expenses (Monthly)
        </p>
        <div class="chart-container"><canvas id="analytics-finance-chart"></canvas></div>
      </div>
      ${last14.length>1?`<div class="glass-card" style="padding:20px;margin-bottom:20px">
        <p class="section-title" style="margin-bottom:16px">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:6px"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>Health Trends (14 days)
        </p>
        <div class="chart-container"><canvas id="analytics-health-chart"></canvas></div>
      </div>`:''}
      <div class="stat-grid">
        <div class="stat-card bg-indigo" onclick="navigate('finance')" style="cursor:pointer">
          <span class="stat-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></span>
          <div class="stat-card-value">${txns.length}</div><div class="stat-card-label">Transactions</div>
        </div>
        <div class="stat-card bg-emerald" onclick="navigate('goals')" style="cursor:pointer">
          <span class="stat-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></span>
          <div class="stat-card-value">${(STATE.goals||[]).filter(g=>g.current>=g.target).length}</div><div class="stat-card-label">Goals Completed</div>
        </div>
        <div class="stat-card bg-amber" onclick="navigate('habits')" style="cursor:pointer">
          <span class="stat-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></svg></span>
          <div class="stat-card-value">${STATE.streak||0}</div><div class="stat-card-label">Day Streak</div>
        </div>
        <div class="stat-card bg-gold" onclick="navigate('achievements')" style="cursor:pointer">
          <span class="stat-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg></span>
          <div class="stat-card-value">${(STATE.unlockedAchievements||[]).length}/${ACHIEVEMENTS_DEF.length}</div><div class="stat-card-label">Achievements</div>
        </div>
      </div>
    </div>`;

  if (window.innerWidth < 700) { const el = document.querySelector('.analytics-grid'); if (el) el.style.gridTemplateColumns = '1fr'; }
  if (topCats.length > 0) renderCatChart(topCats);
  renderAnalyticsFinanceChart(txns);
  if (last14.length > 1) renderAnalyticsHealthChart(last14);
}

function renderCatChart(cats) {
  const canvas = document.getElementById('cat-chart');
  if (!canvas) return;
  const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#ec4899','#3b82f6'];
  chartInstances['cat'] = new Chart(canvas, {
    type: 'doughnut',
    data: { labels: cats.map(([c])=>c), datasets: [{ data: cats.map(([,v])=>v), backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12 } } } }
  });
}

function renderAnalyticsFinanceChart(txns) {
  const canvas = document.getElementById('analytics-finance-chart');
  if (!canvas) return;
  const monthMap = {};
  txns.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = d.toLocaleString('default',{month:'short',year:'2-digit'});
    if (!monthMap[key]) monthMap[key] = {label,income:0,expense:0};
    if (t.type==='income') monthMap[key].income+=t.amount; else monthMap[key].expense+=t.amount;
  });
  const sorted = Object.entries(monthMap).sort(([a],[b])=>a.localeCompare(b)).slice(-12);
  chartInstances['afinance'] = new Chart(canvas, {
    type: 'line',
    data: { labels: sorted.map(([,v])=>v.label), datasets: [
      { label:'Income', data:sorted.map(([,v])=>v.income), borderColor:'#10b981', backgroundColor:'rgba(16,185,129,0.08)', tension:0.4, fill:true },
      { label:'Expense', data:sorted.map(([,v])=>v.expense), borderColor:'#ef4444', backgroundColor:'rgba(239,68,68,0.08)', tension:0.4, fill:true }
    ]},
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#94a3b8'}}}, scales:{x:{ticks:{color:'#64748b'},grid:{color:'rgba(255,255,255,0.05)'}},y:{ticks:{color:'#64748b',callback:v=>`₹${(v/1000).toFixed(0)}k`},grid:{color:'rgba(255,255,255,0.05)'}}} }
  });
}

function renderAnalyticsHealthChart(data) {
  const canvas = document.getElementById('analytics-health-chart');
  if (!canvas) return;
  chartInstances['ahealth'] = new Chart(canvas, {
    type:'line',
    data:{ labels:data.map(e=>fmtDate(e.date).split(' ').slice(0,2).join(' ')), datasets:[
      {label:'Sleep (hrs)', data:data.map(e=>e.sleep||0), borderColor:'#f97316', backgroundColor:'rgba(249,115,22,0.12)',  tension:0.4, fill:true, borderWidth:2.5, pointRadius:3},
      {label:'Mood (/10)',   data:data.map(e=>e.mood||0),  borderColor:'#ec4899', backgroundColor:'rgba(236,72,153,0.12)', tension:0.4, fill:true, borderWidth:2.5, pointRadius:3},
      {label:'Water (glasses)', data:data.map(e=>e.water||0), borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,0.12)', tension:0.4, fill:true, borderWidth:2.5, pointRadius:3}
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#94a3b8'}}},scales:{x:{ticks:{color:'#64748b'},grid:{color:'rgba(255,255,255,0.05)'}},y:{ticks:{color:'#64748b'},grid:{color:'rgba(255,255,255,0.05)'}}}}
  });
}

// ===== SETTINGS =====
function renderSettings() {
  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header"><h1 class="page-title">⚙️ Settings</h1><p class="page-subtitle">Manage your LifeOS preferences</p></div>
      <div style="display:flex;flex-direction:column;gap:16px;max-width:500px">
        <div class="glass-card" style="padding:22px">
          <p class="section-title" style="margin-bottom:16px">👤 Profile</p>
          <div class="form-group"><label class="form-label">Display Name</label><input type="text" id="s-name" class="form-input" value="${STATE.settings?.name||''}"/></div>
          <div class="form-group" style="margin-top:12px"><label class="form-label">Currency Symbol</label>
            <select id="s-currency" class="form-input">
              <option value="₹" ${STATE.settings?.currency==='₹'?'selected':''}>₹ Indian Rupee</option>
              <option value="$" ${STATE.settings?.currency==='$'?'selected':''}>$ US Dollar</option>
              <option value="€" ${STATE.settings?.currency==='€'?'selected':''}>€ Euro</option>
              <option value="£" ${STATE.settings?.currency==='£'?'selected':''}>£ British Pound</option>
            </select>
          </div>
          <button class="btn-primary" style="margin-top:14px" onclick="saveSettings()">Save Profile</button>
        </div>

        <div class="glass-card" style="padding:22px">
          <p class="section-title" style="margin-bottom:12px">🎨 Theme</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button onclick="setTheme('dark')" class="btn-secondary" style="flex:1;min-width:90px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px">
              <span style="font-size:22px">🌙</span><span style="font-size:12px;font-weight:600">Dark</span>
            </button>
            <button onclick="setTheme('light')" class="btn-secondary" style="flex:1;min-width:90px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px">
              <span style="font-size:22px">☀️</span><span style="font-size:12px;font-weight:600">Light</span>
            </button>
            <button onclick="setTheme('auto')" class="btn-secondary" style="flex:1;min-width:90px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px">
              <span style="font-size:22px">🌗</span><span style="font-size:12px;font-weight:600">Auto</span>
            </button>
          </div>
          <p style="font-size:11px;color:rgba(241,245,249,0.4);margin-top:8px">Auto switches theme based on time of day</p>
        </div>

        <div class="glass-card" style="padding:22px">
          <p class="section-title" style="margin-bottom:8px">🤖 AI Demo Data</p>
          <p style="font-size:13px;color:rgba(241,245,249,0.6);margin-bottom:14px">Fill all modules with realistic sample data to explore every feature instantly.</p>
          <button class="btn-primary" onclick="seedDemoData()" style="background:linear-gradient(135deg,#10b981,#059669)">🚀 Load AI Demo Data</button>
        </div>

        <div class="glass-card" style="padding:22px">
          <p class="section-title" style="margin-bottom:12px">💾 Backup &amp; Data</p>
          <div style="display:flex;flex-direction:column;gap:10px">
            <button class="btn-secondary" onclick="exportData()" style="justify-content:flex-start;gap:10px;text-align:left">
              📤 &nbsp;<span><strong>Export Backup</strong> — Download all data as JSON</span>
            </button>
            <button class="btn-secondary" onclick="document.getElementById('import-file').click()" style="justify-content:flex-start;gap:10px;text-align:left">
              📥 &nbsp;<span><strong>Import Backup</strong> — Restore from JSON backup</span>
            </button>
            <button class="btn-secondary" onclick="exportCSV()" style="justify-content:flex-start;gap:10px;text-align:left">
              📊 &nbsp;<span><strong>Export Transactions CSV</strong> — Open in Excel / Sheets</span>
            </button>
            <input type="file" id="import-file" accept=".json" style="display:none" onchange="importData(event)"/>
          </div>
        </div>

        <div class="glass-card" style="padding:22px">
          <p class="section-title" style="margin-bottom:16px">📊 Your Stats</p>
          <div style="display:flex;flex-direction:column;gap:10px;font-size:13px">
            ${[
              ['Joined', fmtDate(STATE.user?.joinDate||new Date().toISOString())],
              ['Transactions logged', (STATE.transactions||[]).length],
              ['Habits created', (STATE.habits||[]).length],
              ['Goals set', (STATE.goals||[]).length],
              ['Health entries', (STATE.healthEntries||[]).length],
              ['Total XP earned', STATE.xp||0],
              ['Achievements unlocked', (STATE.unlockedAchievements||[]).length+'/'+ACHIEVEMENTS_DEF.length],
            ].map(([k,v])=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)"><span style="color:rgba(241,245,249,0.6)">${k}</span><span style="font-weight:600">${v}</span></div>`).join('')}
          </div>
        </div>

        <div class="glass-card" style="padding:22px">
          <p class="section-title" style="margin-bottom:8px;color:#ef4444">⚠️ Danger Zone</p>
          <p style="font-size:12px;color:rgba(241,245,249,0.5);margin-bottom:14px">Permanently deletes all your data. Cannot be undone.</p>
          <button class="btn-danger" onclick="confirmReset()">Reset All Data</button>
        </div>
      </div>
    </div>`;
}

function saveSettings() {
  STATE.settings = STATE.settings || {};
  STATE.settings.name = document.getElementById('s-name').value.trim() || STATE.settings.name;
  STATE.settings.currency = document.getElementById('s-currency').value;
  saveState(); updateSidebar(); toast('Settings saved! ✅', 'success');
}

function setTheme(mode) {
  STATE.settings = STATE.settings || {};
  STATE.settings.theme = mode;
  saveState();
  const h = new Date().getHours();
  if (mode === 'light') document.body.classList.add('light');
  else if (mode === 'dark') document.body.classList.remove('light');
  else { if (h >= 6 && h < 19) document.body.classList.add('light'); else document.body.classList.remove('light'); }
  const btn = document.querySelector('.theme-toggle');
  if (btn) btn.textContent = document.body.classList.contains('light') ? '🌙' : '☀️';
  toast(`Theme: ${mode} mode ✅`, 'success');
}

function exportData() {
  const blob = new Blob([JSON.stringify(STATE, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `LifeOS_Backup_${today()}.json`; a.click();
  URL.revokeObjectURL(url);
  toast('✅ Full backup downloaded!', 'success');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported || typeof imported !== 'object') throw new Error();
      STATE = Object.assign(DB.defaults(), imported);
      saveState(); updateSidebar(); navigate('dashboard');
      toast('✅ Data imported!', 'success');
      setTimeout(() => showCelebration('Data Restored! 🎉', 'Your LifeOS backup has been successfully restored!'), 500);
    } catch { toast('❌ Invalid backup file', 'error'); }
  };
  reader.readAsText(file);
}

function exportCSV() {
  const txns = STATE.transactions || [];
  if (!txns.length) { toast('No transactions to export', 'error'); return; }
  const rows = [['Date','Type','Category','Description','Amount (₹)'],
    ...txns.map(t => [t.date, t.type, t.category, (t.description||'').replace(/,/g,';'), t.amount])];
  const blob = new Blob([rows.map(r=>r.join(',')).join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `LifeOS_Transactions_${today()}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast(`✅ ${txns.length} transactions exported as CSV!`, 'success');
}

async function confirmReset() {
  if (!confirm('Delete ALL LifeOS data? This cannot be undone.')) return;

  const token = localStorage.getItem('lifeos_token');
  const wasLoggedIn = token && STATE.user && !STATE.user.offline;

  // Build a truly empty state so the cloud copy is wiped too.
  // Preserve the user object so the sync endpoint still recognises the owner.
  const emptyState = { user: STATE.user || null };

  if (wasLoggedIn) {
    try {
      setSyncDot && setSyncDot('syncing');
      await fetch(`${API_URL}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ state: emptyState })
      });
      setSyncDot && setSyncDot('ok');
    } catch (e) {
      // If the cloud wipe fails, warn the user — otherwise login will restore everything.
      if (!confirm('Could not reach the cloud to wipe your synced data. Reset local data anyway? (Next login may restore data from the cloud.)')) return;
    }
  }

  localStorage.removeItem(DB.KEY);
  STATE = DB.load();
  handleLogout();
  toast('Data reset. Fresh start! 🌱', 'info');
}
