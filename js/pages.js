// ===== ANALYTICS PAGE =====
let _analyticsPeriod = 'month';

function setAnalyticsPeriod(p) {
  _analyticsPeriod = p;
  renderAnalytics();
}

function _getPeriodHistory(periodType) {
  const all = STATE.transactions || [];
  const now = new Date();
  if (periodType === 'all') {
    const inc = all.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const exp = all.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    return [{ label:'All Time', income:inc, expense:exp, savings:inc-exp }];
  }
  const pts = [];
  if (periodType === 'day') {
    for (let i=6;i>=0;i--) {
      const d=new Date(now); d.setDate(d.getDate()-i);
      const ds=d.toISOString().slice(0,10);
      const t=all.filter(x=>x.date===ds);
      const inc=t.filter(x=>x.type==='income').reduce((s,x)=>s+x.amount,0);
      const exp=t.filter(x=>x.type==='expense').reduce((s,x)=>s+x.amount,0);
      pts.push({label:d.toLocaleString('default',{weekday:'short',month:'numeric',day:'numeric'}),income:inc,expense:exp,savings:inc-exp});
    }
  } else if (periodType === 'week') {
    for (let i=5;i>=0;i--) {
      const end=new Date(now); end.setDate(end.getDate()-i*7);
      const start=new Date(end); start.setDate(start.getDate()-6);
      const s0=start.toISOString().slice(0,10), e0=end.toISOString().slice(0,10);
      const t=all.filter(x=>x.date>=s0&&x.date<=e0);
      const inc=t.filter(x=>x.type==='income').reduce((s,x)=>s+x.amount,0);
      const exp=t.filter(x=>x.type==='expense').reduce((s,x)=>s+x.amount,0);
      pts.push({label:start.toLocaleString('default',{month:'short',day:'numeric'}),income:inc,expense:exp,savings:inc-exp});
    }
  } else if (periodType === 'month') {
    for (let i=5;i>=0;i--) {
      const d=new Date(now); d.setDate(1); d.setMonth(d.getMonth()-i);
      const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const t=all.filter(x=>(x.date||'').startsWith(key));
      const inc=t.filter(x=>x.type==='income').reduce((s,x)=>s+x.amount,0);
      const exp=t.filter(x=>x.type==='expense').reduce((s,x)=>s+x.amount,0);
      pts.push({label:d.toLocaleString('default',{month:'short',year:'2-digit'}),income:inc,expense:exp,savings:inc-exp});
    }
  } else if (periodType === 'year') {
    const yr=now.getFullYear();
    for (let y=yr-4;y<=yr;y++) {
      const t=all.filter(x=>(x.date||'').startsWith(String(y)));
      const inc=t.filter(x=>x.type==='income').reduce((s,x)=>s+x.amount,0);
      const exp=t.filter(x=>x.type==='expense').reduce((s,x)=>s+x.amount,0);
      pts.push({label:String(y),income:inc,expense:exp,savings:inc-exp});
    }
  }
  return pts;
}

function renderAnalytics() {
  const txnsAll = STATE.transactions || [];
  const txns    = filterTxByPeriod(txnsAll, _analyticsPeriod);
  const expTxns = txns.filter(t=>t.type==='expense');
  const income  = txns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense = expTxns.reduce((s,t)=>s+t.amount,0);
  const savings = income - expense;
  const savRate = income>0?(savings/income*100).toFixed(1):0;

  const catMap = {};
  expTxns.forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+t.amount;});
  const topCats = Object.entries(catMap).sort(([,a],[,b])=>b-a).slice(0,7);

  const budgets = STATE.budgets || [];
  const totalBudget = budgets.reduce((s,b)=>s+(typeof getBudgetLimit==='function'?getBudgetLimit(b,_analyticsPeriod):0),0);
  const budgetUsedPct = totalBudget>0 ? Math.min(999,(expense/totalBudget*100)).toFixed(0) : null;

  const history = _getPeriodHistory(_analyticsPeriod);
  const periodTitle = {day:'Daily — last 7 days',week:'Weekly — last 6 weeks',month:'Monthly — last 6 months',year:'Yearly — last 5 years',all:'All Time'}[_analyticsPeriod]||'';

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
        <div>
          <h1 class="page-title">📊 Cross Analytics</h1>
          <p class="page-subtitle">Overlay view — Income · Expense · Savings · Budget · Category</p>
        </div>
        ${periodTabsHtml(_analyticsPeriod,'setAnalyticsPeriod')}
      </div>

      <!-- KPI Strip -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px" class="cross-kpi-grid">
        <div class="glass-card" style="padding:16px;border-top:3px solid #10b981">
          <p style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;font-weight:700">💰 Income</p>
          <p style="font-size:22px;font-weight:900;margin:6px 0;color:#10b981">${fmt(income)}</p>
          <p style="font-size:11px;color:var(--text3)">${periodLabel(_analyticsPeriod)}</p>
        </div>
        <div class="glass-card" style="padding:16px;border-top:3px solid #ef4444">
          <p style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;font-weight:700">💳 Expense</p>
          <p style="font-size:22px;font-weight:900;margin:6px 0;color:#ef4444">${fmt(expense)}</p>
          <p style="font-size:11px;color:var(--text3)">${income>0?(expense/income*100).toFixed(1):0}% of income</p>
        </div>
        <div class="glass-card" style="padding:16px;border-top:3px solid #00c9a7">
          <p style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;font-weight:700">🏦 Savings</p>
          <p style="font-size:22px;font-weight:900;margin:6px 0;color:${savings>=0?'#00c9a7':'#ef4444'}">${savings<0?'-':''}${fmt(Math.abs(savings))}</p>
          <p style="font-size:11px;color:var(--text3)">${savRate}% rate ${parseFloat(savRate)>=20?'✅':'⚠️'}</p>
        </div>
        <div class="glass-card" style="padding:16px;border-top:3px solid ${budgetUsedPct>100?'#ef4444':budgetUsedPct>80?'#f59e0b':'#6366f1'}">
          <p style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;font-weight:700">🎯 Budget Used</p>
          <p style="font-size:22px;font-weight:900;margin:6px 0;color:${budgetUsedPct>100?'#ef4444':budgetUsedPct>80?'#f59e0b':'#6366f1'}">${budgetUsedPct!==null?budgetUsedPct+'%':'—'}</p>
          <p style="font-size:11px;color:var(--text3)">${totalBudget>0?fmt(expense)+' / '+fmt(totalBudget):'Set budgets to unlock'}</p>
        </div>
      </div>

      <!-- Master Overlay: Bars (Income/Expense) + Line (Savings) -->
      <div class="glass-card" style="padding:20px;margin-bottom:20px">
        <div class="section-header" style="margin-bottom:14px">
          <p class="section-title">📈 Income · Expense · Savings — ${periodTitle}</p>
          <div style="display:flex;gap:14px;font-size:11px;color:var(--text3)">
            <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#10b981;margin-right:4px"></span>Income</span>
            <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#ef4444;margin-right:4px"></span>Expense</span>
            <span><span style="display:inline-block;width:14px;height:2px;background:#00c9a7;margin-right:4px;border-radius:2px;vertical-align:middle"></span>Savings (line)</span>
          </div>
        </div>
        <div style="height:240px;position:relative"><canvas id="cross-main-chart"></canvas></div>
      </div>

      <!-- Category vs Budget  +  Donut allocation -->
      <div style="display:grid;grid-template-columns:3fr 2fr;gap:16px;margin-bottom:20px" class="cross-mid-row">
        <div class="glass-card" style="padding:20px">
          <div class="section-header" style="margin-bottom:12px">
            <p class="section-title">🔍 Category — Actual vs Budget</p>
            <span style="font-size:10px;color:var(--text3)">🟥 over budget · 🟦 within budget · 🟡 budget limit</span>
          </div>
          <div style="height:${Math.max(160,topCats.length*38)}px;position:relative">
            ${topCats.length?'<canvas id="cross-cat-chart"></canvas>':'<p style="font-size:12px;color:var(--text3);text-align:center;padding-top:40px">No expenses this period</p>'}
          </div>
        </div>
        <div class="glass-card" style="padding:20px">
          <div class="section-header" style="margin-bottom:12px">
            <p class="section-title">🥧 Spend Split</p>
          </div>
          <div style="height:160px;position:relative"><canvas id="cross-alloc-chart"></canvas></div>
          ${income>0?`<div style="margin-top:12px;display:flex;flex-direction:column;gap:5px;font-size:12px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block"></span>Expense</span>
              <span style="font-weight:700">${fmt(expense)} <span style="color:var(--text3);font-weight:400">${income>0?(expense/income*100).toFixed(1):0}%</span></span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:50%;background:#00c9a7;display:inline-block"></span>Savings</span>
              <span style="font-weight:700">${fmt(Math.max(0,savings))} <span style="color:var(--text3);font-weight:400">${savRate}%</span></span>
            </div>
          </div>`:'<p style="font-size:12px;color:var(--text3);text-align:center;margin-top:16px">Add income to see split</p>'}
        </div>
      </div>

      <!-- Period Breakdown Table -->
      ${history.length>1?`<div class="glass-card" style="overflow-x:auto">
        <div style="padding:16px 20px;border-bottom:1px solid var(--glass-border)">
          <p class="section-title">📋 Period-by-Period Comparison</p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="background:rgba(0,0,0,0.06)">
              <th style="text-align:left;padding:9px 16px;color:var(--text3);font-weight:600">Period</th>
              <th style="text-align:right;padding:9px 14px;color:#10b981;font-weight:600">Income</th>
              <th style="text-align:right;padding:9px 14px;color:#ef4444;font-weight:600">Expense</th>
              <th style="text-align:right;padding:9px 14px;color:#00c9a7;font-weight:600">Savings</th>
              <th style="text-align:right;padding:9px 14px;color:#6366f1;font-weight:600">Rate</th>
              <th style="text-align:right;padding:9px 14px;color:var(--text3);font-weight:600">vs Prev</th>
            </tr>
          </thead>
          <tbody>
            ${history.map((h,i)=>{
              const rate = h.income>0?(h.savings/h.income*100).toFixed(1):0;
              const prev = history[i-1];
              const delta = prev ? h.savings - prev.savings : null;
              const isNow = i===history.length-1;
              return `<tr style="border-top:1px solid var(--glass-border);background:${isNow?'rgba(0,201,167,0.04)':''}">
                <td style="padding:9px 16px;font-weight:${isNow?700:400};color:${isNow?'var(--teal)':'var(--text)'}">${h.label}${isNow?' ◀ Now':''}</td>
                <td style="padding:9px 14px;text-align:right;color:#10b981">${fmt(h.income)}</td>
                <td style="padding:9px 14px;text-align:right;color:#ef4444">${fmt(h.expense)}</td>
                <td style="padding:9px 14px;text-align:right;color:${h.savings>=0?'#00c9a7':'#ef4444'};font-weight:600">${h.savings>=0?'+':''}${fmt(h.savings)}</td>
                <td style="padding:9px 14px;text-align:right;color:${parseFloat(rate)>=20?'#10b981':'#94a3b8'}">${rate}%</td>
                <td style="padding:9px 14px;text-align:right;color:${delta===null?'#94a3b8':delta>=0?'#10b981':'#ef4444'}">${delta===null?'—':delta>=0?'↑ '+fmt(delta):'↓ '+fmt(Math.abs(delta))}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`:''}
    </div>`;

  if (window.innerWidth < 700) {
    const kpi = document.querySelector('.cross-kpi-grid');
    if (kpi) kpi.style.gridTemplateColumns = 'repeat(2,1fr)';
    const mid = document.querySelector('.cross-mid-row');
    if (mid) mid.style.gridTemplateColumns = '1fr';
  }

  setTimeout(() => {
    renderCrossMainChart(history);
    if (topCats.length) renderCrossCatChart(topCats, budgets, _analyticsPeriod);
    renderCrossAllocChart(income, expense, savings);
  }, 60);
}

function renderCrossMainChart(history) {
  const canvas = document.getElementById('cross-main-chart');
  if (!canvas) return;
  const isLight = document.body.classList.contains('light');
  const gridC = isLight?'rgba(0,0,0,0.06)':'rgba(255,255,255,0.05)';
  const tickC = '#64748b';
  chartInstances['cross-main'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: history.map(h=>h.label),
      datasets: [
        { type:'bar',  label:'Income',  data:history.map(h=>h.income),
          backgroundColor:'rgba(16,185,129,0.65)', borderColor:'#10b981', borderWidth:1.5, borderRadius:4, order:2 },
        { type:'bar',  label:'Expense', data:history.map(h=>h.expense),
          backgroundColor:'rgba(239,68,68,0.65)',  borderColor:'#ef4444', borderWidth:1.5, borderRadius:4, order:2 },
        { type:'line', label:'Savings', data:history.map(h=>h.savings),
          borderColor:'#00c9a7', backgroundColor:'rgba(0,201,167,0.08)',
          borderWidth:2.5, tension:0.4, fill:true,
          pointRadius:4, pointBackgroundColor:'#00c9a7', pointBorderColor:'#fff', pointBorderWidth:1.5, order:1 },
      ],
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      plugins:{
        legend:{ display:false },
        tooltip:{ callbacks:{ label:ctx=>`  ${ctx.dataset.label}: ₹${(ctx.raw||0).toLocaleString('en-IN')}` } },
      },
      scales:{
        x:{ grid:{color:gridC}, ticks:{color:tickC,font:{size:11}} },
        y:{ grid:{color:gridC}, ticks:{color:tickC,font:{size:10},callback:v=>'₹'+fmt(v)} },
      },
    },
  });
}

function renderCrossCatChart(topCats, budgets, period) {
  const canvas = document.getElementById('cross-cat-chart');
  if (!canvas) return;
  const isLight = document.body.classList.contains('light');
  const gridC = isLight?'rgba(0,0,0,0.06)':'rgba(255,255,255,0.05)';
  const tickC = '#64748b';
  const names   = topCats.map(([c])=>c);
  const actuals = topCats.map(([,v])=>v);
  const limits  = names.map(n=>{ const b=budgets.find(x=>x.category===n); return b&&typeof getBudgetLimit==='function'?getBudgetLimit(b,period):0; });
  const fillCols   = actuals.map((a,i)=>limits[i]>0&&a>limits[i]?'rgba(239,68,68,0.7)':'rgba(99,102,241,0.7)');
  const borderCols = actuals.map((a,i)=>limits[i]>0&&a>limits[i]?'#ef4444':'#6366f1');
  chartInstances['cross-cat'] = new Chart(canvas, {
    type:'bar',
    data:{
      labels:names,
      datasets:[
        { label:'Actual Spend', data:actuals, backgroundColor:fillCols, borderColor:borderCols, borderWidth:1.5, borderRadius:3 },
        { label:'Budget Limit', data:limits,  backgroundColor:'rgba(245,158,11,0.18)', borderColor:'rgba(245,158,11,0.7)', borderWidth:1.5, borderDash:[4,3], borderRadius:3 },
      ],
    },
    options:{
      indexAxis:'y', responsive:true, maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      plugins:{
        legend:{ labels:{color:tickC,font:{size:11},boxWidth:12} },
        tooltip:{ callbacks:{ label:ctx=>`  ${ctx.dataset.label}: ₹${(ctx.raw||0).toLocaleString('en-IN')}` } },
      },
      scales:{
        x:{ grid:{color:gridC}, ticks:{color:tickC,font:{size:10},callback:v=>'₹'+fmt(v)} },
        y:{ grid:{color:gridC}, ticks:{color:tickC,font:{size:11}} },
      },
    },
  });
}

function renderCrossAllocChart(income, expense, savings) {
  const canvas = document.getElementById('cross-alloc-chart');
  if (!canvas) return;
  if (!income) {
    const ctx=canvas.getContext('2d'); ctx.fillStyle='#64748b'; ctx.font='12px sans-serif';
    ctx.textAlign='center'; ctx.fillText('No income data',canvas.width/2,canvas.height/2); return;
  }
  chartInstances['cross-alloc'] = new Chart(canvas, {
    type:'doughnut',
    data:{
      labels:['Expense','Savings'],
      datasets:[{ data:[expense, Math.max(0,savings)],
        backgroundColor:['rgba(239,68,68,0.75)','rgba(0,201,167,0.75)'],
        borderColor:['#ef4444','#00c9a7'], borderWidth:2, hoverOffset:5 }],
    },
    options:{
      responsive:true, maintainAspectRatio:false, cutout:'65%',
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:ctx=>`₹${(ctx.raw||0).toLocaleString('en-IN')}`}} },
    },
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
  const gridCol = document.body.classList.contains('light') ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)';
  const sorted = Object.entries(monthMap).sort(([a],[b])=>a.localeCompare(b)).slice(-12);
  chartInstances['afinance'] = new Chart(canvas, {
    type: 'line',
    data: { labels: sorted.map(([,v])=>v.label), datasets: [
      { label:'Income', data:sorted.map(([,v])=>v.income), borderColor:'#10b981', backgroundColor:'rgba(16,185,129,0.08)', tension:0.4, fill:true },
      { label:'Expense', data:sorted.map(([,v])=>v.expense), borderColor:'#ef4444', backgroundColor:'rgba(239,68,68,0.08)', tension:0.4, fill:true }
    ]},
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#94a3b8'}}}, scales:{x:{ticks:{color:'#64748b'},grid:{color:gridCol}},y:{ticks:{color:'#64748b',callback:v=>`₹${(v/1000).toFixed(0)}k`},grid:{color:gridCol}}} }
  });
}

function renderAnalyticsHealthChart(data) {
  const canvas = document.getElementById('analytics-health-chart');
  if (!canvas) return;
  const gridCol = document.body.classList.contains('light') ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)';
  chartInstances['ahealth'] = new Chart(canvas, {
    type:'line',
    data:{ labels:data.map(e=>fmtDate(e.date).split(' ').slice(0,2).join(' ')), datasets:[
      {label:'Sleep (hrs)', data:data.map(e=>e.sleep||0), borderColor:'#f97316', backgroundColor:'rgba(249,115,22,0.12)',  tension:0.4, fill:true, borderWidth:2.5, pointRadius:3},
      {label:'Mood (/10)',   data:data.map(e=>e.mood||0),  borderColor:'#ec4899', backgroundColor:'rgba(236,72,153,0.12)', tension:0.4, fill:true, borderWidth:2.5, pointRadius:3},
      {label:'Water (glasses)', data:data.map(e=>e.water||0), borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,0.12)', tension:0.4, fill:true, borderWidth:2.5, pointRadius:3}
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#94a3b8'}}},scales:{x:{ticks:{color:'#64748b'},grid:{color:gridCol}},y:{ticks:{color:'#64748b'},grid:{color:gridCol}}}}
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
