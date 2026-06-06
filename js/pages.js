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
  const tickC = isLight ? '#374151' : '#64748b';
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
  const tickC = isLight ? '#374151' : '#64748b';
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
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color: isLight?'#374151':'#94a3b8'}}}, scales:{x:{ticks:{color: isLight?'#374151':'#64748b'},grid:{color:gridCol}},y:{ticks:{color: isLight?'#374151':'#64748b',callback:v=>`₹${(v/1000).toFixed(0)}k`},grid:{color:gridCol}}} }
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
          <p class="section-title" style="margin-bottom:12px">🌐 Web Version</p>
          <p style="font-size:13px;color:var(--text3);margin-bottom:14px">Open LifeOS in your browser — same account, bigger screen.</p>
          <button class="btn-primary" onclick="window.open('https://lifeos-psi-roan.vercel.app','_blank')">🌐 Open Web App ↗</button>
        </div>
        <div class="glass-card" style="padding:22px">
          <p class="section-title" style="margin-bottom:12px">🔒 App Lock</p>
          <p style="font-size:13px;color:var(--text3);margin-bottom:14px">Require a PIN or fingerprint / face to open LifeOS.</p>
          ${(typeof appLockEnabled==='function' && appLockEnabled())
            ? `<p style="font-size:13px;color:#00c9a7;font-weight:700;margin-bottom:12px">✅ Lock ON — ${ (typeof lockType==='function'&&lockType()==='bio') ? 'Biometric' : 'PIN' }</p>
               <div style="display:flex;gap:10px;flex-wrap:wrap">
                 <button class="btn-secondary" onclick="setupAppLock()">Set PIN</button>
                 <button class="btn-secondary" onclick="enableBiometricLock()">Use Biometric</button>
                 <button class="btn-secondary" onclick="disableAppLock()" style="color:#ef4444;border-color:rgba(239,68,68,0.3)">Disable Lock</button>
               </div>`
            : `<div style="display:flex;gap:10px;flex-wrap:wrap">
                 <button class="btn-primary" onclick="enableBiometricLock()">🔐 Enable Biometric Lock</button>
                 <button class="btn-secondary" onclick="setupAppLock()">Use a PIN instead</button>
               </div>`}
        </div>
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
          <div class="form-group" style="margin-top:12px"><label class="form-label">🌐 Language / மொழி / भाषा</label>
            <select id="s-lang" class="form-input" onchange="setLanguage(this.value)">
              <option value="en" ${getLang()==='en'?'selected':''}>🇬🇧 English</option>
              <option value="ta" ${getLang()==='ta'?'selected':''}>🇮🇳 தமிழ் (Tamil)</option>
              <option value="hi" ${getLang()==='hi'?'selected':''}>🇮🇳 हिन्दी (Hindi)</option>
            </select>
          </div>
          <p style="font-size:11px;color:rgba(241,245,249,0.4);margin-top:4px">🎙️ Tap the mic in the floating dock to control the app by voice in your language.</p>
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
            <button onclick="setTheme('amoled')" class="btn-secondary" style="flex:1;min-width:90px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px">
              <span style="font-size:22px">⬛</span><span style="font-size:12px;font-weight:600">AMOLED</span>
            </button>
            <button onclick="setTheme('ocean')" class="btn-secondary" style="flex:1;min-width:90px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px">
              <span style="font-size:22px">🌊</span><span style="font-size:12px;font-weight:600">Ocean</span>
            </button>
          </div>
          <p style="font-size:11px;color:rgba(241,245,249,0.4);margin-top:8px">Auto switches theme based on time of day</p>
        </div>

        <div class="glass-card" style="padding:22px">
          <p class="section-title" style="margin-bottom:12px">🌌 Background Animation</p>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
            ${[['network','🕸️','Network'],['bubbles','🫧','Bubbles'],['stars','✨','Stars'],['snow','❄️','Snow'],['aurora','🌈','Aurora'],['none','⬛','Plain']]
              .map(([m,e,l]) => {
                const on = ((STATE.settings && STATE.settings.bgAnim) || 'network') === m;
                return `<button onclick="setBgAnim('${m}')" class="btn-secondary" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px;${on?'border:1.5px solid #00c9a7;background:rgba(0,201,167,0.12)':''}">
                  <span style="font-size:22px">${e}</span><span style="font-size:12px;font-weight:600">${l}</span></button>`;
              }).join('')}
          </div>
          <p style="font-size:11px;color:rgba(241,245,249,0.4);margin-top:8px">Choose a moving background — or “Plain” to turn it off (saves battery).</p>
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
          <p class="section-title" style="margin-bottom:12px">📄 Legal</p>
          <div style="display:flex;flex-direction:column;gap:10px">
            <a href="/privacy.html" target="_blank" rel="noopener" class="btn-secondary" style="justify-content:flex-start;gap:10px;text-align:left;text-decoration:none">
              🔒 &nbsp;<span><strong>Privacy Policy</strong> — How your data is handled</span>
            </a>
            <a href="/terms.html" target="_blank" rel="noopener" class="btn-secondary" style="justify-content:flex-start;gap:10px;text-align:left;text-decoration:none">
              📜 &nbsp;<span><strong>Terms of Service</strong></span>
            </a>
          </div>
        </div>

        <div class="glass-card" style="padding:22px">
          <p class="section-title" style="margin-bottom:8px;color:#ef4444">⚠️ Danger Zone</p>
          <p style="font-size:12px;color:rgba(241,245,249,0.5);margin-bottom:14px">Permanently deletes all your data. Cannot be undone.</p>
          <button class="btn-danger" onclick="confirmReset()">Reset All Data</button>
        </div>

        <div style="text-align:center;padding:18px 0 8px">
          <div style="display:flex;align-items:center;justify-content:center;gap:7px;opacity:.7">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#00c9a7"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span style="font-size:13px;font-weight:700;color:var(--text2)">LifeOS</span>
          </div>
          <p style="font-size:12px;color:var(--text3);margin-top:5px">Version ${APP_VERSION} (build ${APP_BUILD})</p>
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
  applyThemeClass(mode);
  const btn = document.querySelector('.theme-toggle');
  if (btn) btn.textContent = document.body.classList.contains('light') ? '🌙' : '☀️';
  toast(`Theme: ${mode} ✅`, 'success');
  if (typeof currentPage !== 'undefined' && currentPage === 'settings' && typeof navigate === 'function') navigate('settings', true);
}
// Apply a theme by toggling body classes (dark is the default = no class)
function applyThemeClass(mode) {
  const body = document.body;
  body.classList.remove('light', 'amoled', 'ocean', 'sunset');
  const h = new Date().getHours();
  if (mode === 'light') body.classList.add('light');
  else if (mode === 'amoled') body.classList.add('amoled');
  else if (mode === 'ocean') body.classList.add('ocean');
  else if (mode === 'sunset') body.classList.add('sunset');
  else if (mode === 'auto') { if (h >= 6 && h < 19) body.classList.add('light'); }
  // 'dark' → no class
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

// ===================================================================
//  MONEY RULES — 9 personal-finance rules of thumb, each with a live
//  calculator pre-filled from the user's own data where possible.
// ===================================================================
function _mrMonthly() {
  // Average monthly income & expense from the user's transactions.
  const txs = STATE.transactions || [];
  if (!txs.length) return { income: 0, expense: 0 };
  const byMonth = {};
  txs.forEach(t => {
    const k = (t.date || '').slice(0, 7); if (!k) return;
    byMonth[k] = byMonth[k] || { income: 0, expense: 0 };
    if (t.type === 'income') byMonth[k].income += +t.amount || 0;
    else byMonth[k].expense += +t.amount || 0;
  });
  const months = Object.values(byMonth);
  if (!months.length) return { income: 0, expense: 0 };
  const sum = months.reduce((a, m) => ({ income: a.income + m.income, expense: a.expense + m.expense }), { income: 0, expense: 0 });
  return { income: sum.income / months.length, expense: sum.expense / months.length };
}

// Selected period for the Money Rules page (week | month | year | all).
let _mrPeriod = 'month';
let _mrAnchor = today();                    // which week/month/year we're viewing
function mrSetPeriod(p) { _mrPeriod = p; _mrAnchor = today(); renderMoneyRules(); }
const _MR_PERIOD_LABEL = { week: 'This Week', month: 'This Month', year: 'This Year', all: 'All Time' };

// Step the viewing window back (-1) or forward (+1) by one period unit.
function mrShiftPeriod(dir) {
  const d = new Date(_mrAnchor + 'T00:00:00');
  if (_mrPeriod === 'week') d.setDate(d.getDate() + dir * 7);
  else if (_mrPeriod === 'month') d.setMonth(d.getMonth() + dir);
  else if (_mrPeriod === 'year') d.setFullYear(d.getFullYear() + dir);
  else return;                              // 'all' has no navigation
  const t = new Date();
  if (d > t) return;                        // don't go into the future
  _mrAnchor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  renderMoneyRules();
}

// Human label for the window currently in view.
function _mrAnchorLabel() {
  const d = new Date(_mrAnchor + 'T00:00:00');
  const now = new Date();
  if (_mrPeriod === 'all') return 'All Time';
  if (_mrPeriod === 'year') return String(d.getFullYear());
  if (_mrPeriod === 'month') {
    const same = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    return same ? 'This Month' : d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }
  // week → Monday–Sunday range containing the anchor
  const dow = (d.getDay() + 6) % 7; const mon = new Date(d); mon.setDate(d.getDate() - dow);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return `${mon.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${sun.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
}
// True when we can't step forward (already at the current period).
function _mrAtPresent() {
  const d = new Date(_mrAnchor + 'T00:00:00'), now = new Date();
  if (_mrPeriod === 'year') return d.getFullYear() >= now.getFullYear();
  if (_mrPeriod === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  if (_mrPeriod === 'week') { const a = new Date(d); a.setDate(a.getDate() + 7); return a > now; }
  return true;
}

// Transactions filtered to the selected period + anchor.
function _mrFilteredTx() {
  return filterTxByAnchor(STATE.transactions || [], _mrPeriod === 'all' ? 'all' : _mrPeriod, _mrAnchor);
}
// Monthly-equivalent income/expense from a period's transactions (so the
// rule-of-thumb cards stay on a consistent monthly basis regardless of period).
function _mrMonthlyEquiv(txs) {
  let inc = 0, exp = 0;
  txs.forEach(t => { const a = +t.amount || 0; if (t.type === 'income') inc += a; else exp += a; });
  let div = 1;
  if (_mrPeriod === 'week') div = 7 / 30.44;        // → ×4.35
  else if (_mrPeriod === 'month') div = 1;
  else if (_mrPeriod === 'year') div = 12;
  else { const ms = new Set(txs.map(t => (t.date || '').slice(0, 7))); div = Math.max(1, ms.size); }
  return { income: inc / div, expense: exp / div };
}

// Financial Health — 7 axes scored 0–100 from the user's own data (heuristic).
// flowTxs = period-filtered (for rate/DTI/budget); allTxs = all-time (for stock metrics).
function _mrFinHealth(flowTxs, monthly, allTxs) {
  const txs = flowTxs || STATE.transactions || [];
  const allT = allTxs || STATE.transactions || [];
  const inc = monthly.income, exp = monthly.expense, annualInc = inc * 12;
  const clamp = (n) => Math.max(0, Math.min(100, Math.round(n || 0)));
  const catHit = (re, type) => txs.filter(t => t.type === type && re.test(((t.category || '') + ' ' + (t.subcategory || '')).toLowerCase()));
  const monthlyAvg = (arr) => {
    if (!arr.length) return 0;
    const ms = new Set(arr.map(t => (t.date || '').slice(0, 7)));
    return arr.reduce((a, t) => a + (+t.amount || 0), 0) / Math.max(1, ms.size);
  };
  // Cumulative net saved (rough liquid savings) — always all-time (a stock metric)
  const netSaved = allT.reduce((a, t) => a + (t.type === 'income' ? +t.amount : -+t.amount || 0), 0);

  const savingsRate = inc > 0 ? ((inc - exp) / inc) * 100 : 0;
  const emi = monthlyAvg(catHit(/emi|loan|mortgage/, 'expense'));
  const dti = inc > 0 ? (emi / inc) : 1;                       // lower is better; 40% = 0 score
  const emFundMonths = exp > 0 ? (netSaved / exp) : 0;
  const invValue = (STATE.investments || []).reduce((a, i) => a + (+i.currentValue || +i.amount || +i.value || 0), 0);
  const retireVal = (STATE.investments || []).filter(i => /retire|pension|nps|ppf|epf/i.test((i.name || '') + (i.type || ''))).reduce((a, i) => a + (+i.currentValue || +i.amount || +i.value || 0), 0);
  const cover = +(STATE.settings?.mrCover) || 0;
  const hasInsurance = cover > 0 || catHit(/insurance|premium|lic|policy/, 'expense').length > 0;
  const insScore = cover > 0 ? Math.round(Math.min(100, (cover / (annualInc * 10 || 1)) * 100)) : (catHit(/insurance|premium|lic|policy/, 'expense').length ? 60 : 20);
  const budgets = STATE.budgets || [];
  let budgetScore = 50;
  if (budgets.length) {
    const ok = budgets.filter(b => {
      const spent = txs.filter(t => t.type === 'expense' && t.category === b.category && (t.date || '').startsWith(today().slice(0, 7))).reduce((a, t) => a + (+t.amount || 0), 0);
      return spent <= (+b.limit || +b.amount || Infinity);
    }).length;
    budgetScore = (ok / budgets.length) * 100;
  }

  const axes = [
    { k: 'Savings Rate',     v: clamp(savingsRate / 0.3),                      tip: 'Aim to save 20–30% of income.' },
    { k: 'Debt-to-Income',   v: clamp(100 - (dti / 0.4) * 100),               tip: 'Keep loan EMIs under 40% of income.' },
    { k: 'Emergency Fund',   v: clamp((emFundMonths / 6) * 100),              tip: 'Build 6 months of expenses in cash.' },
    { k: 'Retirement',       v: clamp(annualInc > 0 ? (retireVal / annualInc) * 100 : 0), tip: 'Start a retirement fund (NPS/PPF/EPF).' },
    { k: 'Investments',      v: clamp(annualInc > 0 ? (invValue / annualInc) * 100 : 0),  tip: 'Invest beyond savings to grow wealth.' },
    { k: 'Insurance',        v: insScore,                                      tip: 'Get life cover of 10–15× annual income.' },
    { k: 'Budget Adherence', v: clamp(budgetScore),                           tip: 'Set category budgets and stick to them.' },
  ];
  const overall = Math.round(axes.reduce((a, x) => a + x.v, 0) / axes.length);
  return { axes, overall };
}

// Seven Income Streams — classify income transactions into the 7 wealth streams.
function _mrIncomeStreams(srcTxs) {
  const txs = (srcTxs || STATE.transactions || []).filter(t => t.type === 'income');
  const defs = [
    { k: 'Earned',        re: /salary|wage|job|payroll|stipend/ },
    { k: 'Profit',        re: /business|profit|sale|ecommerce|shop|flip/ },
    { k: 'Interest',      re: /interest|fd|deposit|hysa|saving/ },
    { k: 'Dividends',     re: /dividend/ },
    { k: 'Rental',        re: /rent/ },
    { k: 'Capital Gains', re: /capital|stock|share|equity|mutual|trading|gain/ },
    { k: 'Royalties',     re: /royalt|book|music|patent|license/ },
  ];
  const sums = defs.map(d => {
    const total = txs.filter(t => d.re.test(((t.category || '') + ' ' + (t.subcategory || '') + ' ' + (t.description || '')).toLowerCase()))
      .reduce((a, t) => a + (+t.amount || 0), 0);
    return { k: d.k, total };
  });
  const active = sums.filter(s => s.total > 0).length;
  return { sums, active };
}

// Money flow — income sources, expense categories, and savings (for given txs).
function _mrFlow(srcTxs) {
  const txs = srcTxs || STATE.transactions || [];
  const incBy = {}, expBy = {};
  let totalInc = 0, totalExp = 0;
  txs.forEach(t => {
    const amt = +t.amount || 0; const cat = t.category || 'Other';
    if (t.type === 'income') { incBy[cat] = (incBy[cat] || 0) + amt; totalInc += amt; }
    else { expBy[cat] = (expBy[cat] || 0) + amt; totalExp += amt; }
  });
  const savings = Math.max(0, totalInc - totalExp);
  const invValue = (STATE.investments || []).reduce((a, i) => a + (+i.currentValue || +i.amount || +i.value || 0), 0);
  return { incBy, expBy, totalInc, totalExp, savings, invValue };
}

// Compact INR formatter for live (oninput) updates on the rule cards.
function _mrINR(n) { return '₹' + Math.round(+n || 0).toLocaleString('en-IN'); }

// Period transactions exposed for node-detail popups.
let _mrLastTx = [];

// Save one of the personalising inputs (age | mrCorpus | mrCover) and re-render.
function mrSaveField(key, val) {
  STATE.settings = STATE.settings || {};
  const n = parseFloat(val);
  if (!isFinite(n) || n <= 0) delete STATE.settings[key]; else STATE.settings[key] = Math.round(n);
  saveState();
  renderMoneyRules();
}

// Tap a Sankey node (or chip) → list the matching transactions with dates + total.
function mrShowNode(name) {
  if (typeof openModal !== 'function') return;
  const txs = _mrLastTx || [];
  if (name === 'Savings') {
    let inc = 0, exp = 0; txs.forEach(t => { const a = +t.amount || 0; if (t.type === 'income') inc += a; else exp += a; });
    openModal('💰 Savings', `<p style="font-size:14px;color:var(--text2);line-height:1.9">
        Income: <b style="color:#10b981">${fmt(inc)}</b><br>Expenses: <b style="color:#ef4444">${fmt(exp)}</b><br>
        <span style="font-size:18px">Net Saved: <b style="color:#10b981">${fmt(Math.max(0, inc - exp))}</b></span></p>`);
    return;
  }
  const matched = txs.filter(t => (t.category || 'Other') === name).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const total = matched.reduce((a, t) => a + (+t.amount || 0), 0);
  const pos = matched[0] && matched[0].type === 'income';
  const rows = matched.length ? matched.map(t => `
    <div style="display:flex;justify-content:space-between;gap:10px;padding:11px 0;border-bottom:1px solid var(--glass-border)">
      <div style="min-width:0"><p style="font-weight:600;font-size:14px">${esc(t.description || t.subcategory || name)}</p>
        <p style="font-size:12px;color:var(--text3)">${fmtDate(t.date)}${t.source ? ' · ' + esc(t.source) : ''}</p></div>
      <b style="color:${t.type === 'income' ? '#10b981' : '#ef4444'};white-space:nowrap">${t.type === 'income' ? '' : '-'}${fmt(t.amount)}</b>
    </div>`).join('') : '<p style="color:var(--text3);padding:14px 0">No transactions in this period.</p>';
  openModal(`${name} — ${matched.length} entr${matched.length === 1 ? 'y' : 'ies'}`, `
    <div style="display:flex;justify-content:space-between;padding:10px 14px;border-radius:12px;background:var(--glass);margin-bottom:8px">
      <span style="font-weight:700">Total</span><b style="font-size:18px;color:${pos ? '#10b981' : '#ef4444'}">${fmt(total)}</b>
    </div>
    <div style="max-height:50vh;overflow-y:auto">${rows}</div>`);
}

// ---- Pin a Money-Rules graph onto another page (live, re-rendering copy) ----
function mrPinChart(chartKey, title) {
  if (typeof openModal !== 'function') return;
  openModal('📌 Pin "' + title + '" to…', `
    <p style="font-size:13px;color:var(--text3);margin-bottom:14px">A live copy will appear on the page you choose and update with your data.</p>
    <div style="display:flex;flex-direction:column;gap:10px">
      <button class="btn-primary" onclick="mrAddPin('${chartKey}','budget','${esc(title)}')">Add to Budget</button>
      <button class="btn-primary" onclick="mrAddPin('${chartKey}','goals','${esc(title)}')">Add to Goals</button>
      <button class="btn-primary" onclick="mrAddPin('${chartKey}','notes','${esc(title)}')">Add to Notes</button>
    </div>`);
}
function mrAddPin(chartKey, page, title) {
  STATE.settings = STATE.settings || {};
  STATE.settings.mrPins = STATE.settings.mrPins || [];
  if (!STATE.settings.mrPins.some(p => p.chart === chartKey && p.page === page)) {
    STATE.settings.mrPins.push({ chart: chartKey, page, title });
    saveState();
  }
  if (typeof closeModal === 'function') closeModal();
  if (typeof toast === 'function') toast(`📌 Pinned to ${page.charAt(0).toUpperCase() + page.slice(1)}`, 'success');
}
function mrUnpin(chartKey, page) {
  STATE.settings = STATE.settings || {};
  STATE.settings.mrPins = (STATE.settings.mrPins || []).filter(p => !(p.chart === chartKey && p.page === page));
  saveState();
  if (typeof navigate === 'function') navigate(currentPage, true);
}

// Render pinned Money-Rules charts at the bottom of Budget/Goals/Notes pages.
// Called from _renderPage after the page's own content is in place.
function _mrRenderPins(page) {
  const pins = (STATE.settings?.mrPins || []).filter(p => p.page === page);
  if (!pins.length) return;
  const container = document.getElementById('page-container');
  const fadeIn = container && container.querySelector('.fade-in');
  if (!fadeIn) return;
  const ptx = _mrFilteredTx();
  const fh = _mrFinHealth(ptx, _mrMonthlyEquiv(ptx), STATE.transactions || []);
  const strm = _mrIncomeStreams(ptx);
  const flow = _mrFlow(ptx);
  const titles = { health: 'Financial Health', stream: '7 Income Streams', flow: 'Where Your Money Goes' };
  const canvasId = { health: 'mr-health-chart', stream: 'mr-stream-chart', flow: 'mr-flow-chart' };
  const html = `<div style="margin-top:18px">
    <p style="font-size:13px;color:var(--text3);font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px"><i data-lucide="pin" style="width:15px;height:15px"></i> Pinned from Money Rules</p>
    ${pins.map(p => `
      <div class="glass-card" style="padding:16px;margin-bottom:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <p style="font-size:16px;font-weight:800">${esc(p.title || titles[p.chart] || 'Chart')}</p>
          <button onclick="mrUnpin('${p.chart}','${page}')" style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);color:#ef4444;border-radius:9px;padding:5px 9px;cursor:pointer;font-size:12px;font-weight:700">Unpin</button>
        </div>
        <div style="position:relative;height:300px"><canvas id="${canvasId[p.chart]}"></canvas></div>
      </div>`).join('')}
  </div>`;
  fadeIn.insertAdjacentHTML('beforeend', html);
  setTimeout(() => {
    if (window.lucide && lucide.createIcons) { try { lucide.createIcons(); } catch (_) {} }
    _mrDrawCharts(fh, strm, flow);
  }, 30);
}

function renderMoneyRules() {
  const ptx = _mrFilteredTx();                 // transactions in the selected period
  const allTx = STATE.transactions || [];
  const m = _mrMonthlyEquiv(ptx);              // monthly-equivalent for the rule cards
  const inc = Math.round(m.income), exp = Math.round(m.expense);
  const annualInc = inc * 12;
  // Actual period totals (for the banner)
  let pInc = 0, pExp = 0; ptx.forEach(t => { const a = +t.amount || 0; if (t.type === 'income') pInc += a; else pExp += a; });
  const pNet = pInc - pExp;
  const fh = _mrFinHealth(ptx, m, allTx);
  const strm = _mrIncomeStreams(ptx);
  const flow = _mrFlow(ptx);

  // ---- Extra figures pulled from the user's data (used to PREFILL + SUGGEST) ----
  _mrLastTx = ptx;                                                           // expose for node-detail popups
  const S = STATE.settings || {};
  const invValue = flow.invValue;                                            // total investments
  const netSaved = Math.max(0, allTx.reduce((a, t) => a + (t.type === 'income' ? +t.amount : -+t.amount || 0), 0)); // cumulative savings
  const corpusGuess = Math.round(+S.mrCorpus || (invValue + netSaved)) || 1000000;            // suggested retirement corpus
  const age = Math.round(+S.mrAge || +(STATE.user?.age) || (STATE.user?.dob ? (new Date().getFullYear() - new Date(STATE.user.dob).getFullYear()) : 0) || 30);
  const cover = +S.mrCover || 0;                                             // user's current life cover
  const emiTx = ptx.filter(t => t.type === 'expense' && /emi|loan|mortgage/i.test((t.category || '') + (t.subcategory || '')));
  const emiMonthly = Math.round(_mrMonthlyEquiv(emiTx).expense);             // current monthly EMIs
  // Which of the personalising inputs are still missing?
  const missing = [];
  if (!S.mrAge) missing.push('age');
  if (!S.mrCorpus) missing.push('retirement corpus');
  if (!S.mrCover) missing.push('insurance cover');
  const f = (n) => fmt(Math.round(n || 0));
  const Si = 'width:100%;padding:12px 14px;font-size:16px;border-radius:12px;background:var(--glass);border:1px solid var(--glass-border);color:var(--text);box-sizing:border-box';
  const Sl = 'display:block;font-size:13px;color:var(--text2);margin-bottom:6px';
  const So = 'font-size:15px;color:var(--text2);margin-top:10px';
  const Sfo = 'font-size:13px;color:var(--text3);margin-top:12px;padding-top:10px;border-top:1px dashed var(--glass-border);font-style:italic';
  const Sbig = 'font-size:26px;font-weight:800;color:#00c9a7;margin-bottom:4px';
  const Sdot = 'width:12px;height:12px;border-radius:50%;flex-shrink:0;display:inline-block';

  // helper: a rule card (layout is INLINE so it never depends on cached CSS)
  const card = (accent, icon, title, desc, body) => `
    <div class="glass-card mr-card" style="padding:0;overflow:hidden;border:1px solid ${accent}40">
      <div class="mr-head" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid ${accent}33;background:${accent}1a">
        <span class="mr-ic" style="width:46px;height:46px;border-radius:13px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;background:${accent}26;color:${accent}"><i data-lucide="${icon}" style="width:26px;height:26px"></i></span>
        <div style="min-width:0"><p style="font-size:17px;font-weight:800">${title}</p><p style="font-size:13px;color:var(--text3);margin-top:2px">${desc}</p></div>
      </div>
      <div class="mr-body" style="padding:14px 16px 16px">${body}</div>
    </div>`;

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <div><h1 class="page-title"><i data-lucide="scale"></i> Money Rules</h1>
        <p class="page-subtitle">Personal-finance insights — auto-filled with your numbers</p></div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          ${_mrPeriod!=='all'?`
          <div style="display:flex;align-items:center;gap:6px;background:var(--glass);border:1px solid var(--glass-border);border-radius:12px;padding:4px">
            <button onclick="mrShiftPeriod(-1)" style="background:none;border:none;color:var(--text);cursor:pointer;padding:6px 8px;display:flex" title="Previous"><i data-lucide="chevron-left" style="width:20px;height:20px"></i></button>
            <span style="font-size:14px;font-weight:700;min-width:96px;text-align:center">${_mrAnchorLabel()}</span>
            <button onclick="mrShiftPeriod(1)" ${_mrAtPresent()?'disabled':''} style="background:none;border:none;color:${_mrAtPresent()?'var(--text3)':'var(--text)'};cursor:${_mrAtPresent()?'default':'pointer'};padding:6px 8px;display:flex;opacity:${_mrAtPresent()?0.4:1}" title="Next"><i data-lucide="chevron-right" style="width:20px;height:20px"></i></button>
          </div>`:''}
          <select onchange="mrSetPeriod(this.value)" style="padding:10px 14px;font-size:15px;font-weight:700;border-radius:12px;background:var(--glass);border:1px solid var(--glass-border);color:var(--text);cursor:pointer">
            <option value="week"${_mrPeriod==='week'?' selected':''}>Week</option>
            <option value="month"${_mrPeriod==='month'?' selected':''}>Month</option>
            <option value="year"${_mrPeriod==='year'?' selected':''}>Year</option>
            <option value="all"${_mrPeriod==='all'?' selected':''}>All</option>
          </select>
        </div>
      </div>

      <div class="glass-card mr-banner" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:16px;margin-bottom:16px;text-align:center">
        <div><p style="font-size:12px;color:var(--text3);margin-bottom:4px">Income · ${_mrAnchorLabel()}</p><p style="font-size:17px;font-weight:800;color:#10b981">${f(pInc)}</p></div>
        <div><p style="font-size:12px;color:var(--text3);margin-bottom:4px">Expense · ${_mrAnchorLabel()}</p><p style="font-size:17px;font-weight:800;color:#ef4444">${f(pExp)}</p></div>
        <div><p style="font-size:12px;color:var(--text3);margin-bottom:4px">Net Saved</p><p style="font-size:17px;font-weight:800;color:${pNet>=0?'#10b981':'#ef4444'}">${f(pNet)}</p></div>
      </div>

      <div class="glass-card" style="padding:16px;margin-bottom:16px;${missing.length?'border:1px solid rgba(245,158,11,0.45)':''}">
        <p style="font-size:16px;font-weight:800;display:flex;align-items:center;gap:8px;margin-bottom:${missing.length?'4px':'12px'}"><i data-lucide="user-cog" style="width:19px;height:19px;color:#f59e0b"></i> Your Details</p>
        ${missing.length?`<p style="font-size:13px;color:#f59e0b;margin-bottom:12px">Add your ${missing.join(', ')} to personalise the results below.</p>`:''}
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          <div><label style="${Sl}">Age</label><input type="number" value="${S.mrAge||''}" placeholder="30" style="${Si}" onchange="mrSaveField('mrAge',this.value)"></div>
          <div><label style="${Sl}">Retirement corpus</label><input type="number" value="${S.mrCorpus||''}" placeholder="${invValue+netSaved||1000000}" style="${Si}" onchange="mrSaveField('mrCorpus',this.value)"></div>
          <div><label style="${Sl}">Insurance cover</label><input type="number" value="${S.mrCover||''}" placeholder="0" style="${Si}" onchange="mrSaveField('mrCover',this.value)"></div>
        </div>
      </div>

      <div class="glass-card" style="padding:16px;margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <p style="font-size:17px;font-weight:800;display:flex;align-items:center;gap:8px"><i data-lucide="activity" style="width:20px;height:20px;color:#6366f1"></i> Financial Health <button onclick="mrPinChart('health','Financial Health')" style="background:none;border:none;color:var(--text3);cursor:pointer;padding:2px" title="Pin to a page"><i data-lucide="pin" style="width:16px;height:16px"></i></button></p>
          <span style="font-size:22px;font-weight:900;color:${fh.overall>=70?'#10b981':fh.overall>=40?'#f59e0b':'#ef4444'}">${fh.overall}<span style="font-size:13px;color:var(--text3)">/100</span></span>
        </div>
        <div style="position:relative;height:300px"><canvas id="mr-health-chart"></canvas></div>
        <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">
          ${fh.axes.filter(a=>a.v<50).slice(0,3).map(a=>`<p style="font-size:12px;color:var(--text3);display:flex;gap:6px"><i data-lucide="alert-circle" style="width:15px;height:15px;color:#f59e0b;flex-shrink:0"></i><span><b style="color:var(--text2)">${a.k} (${a.v}):</b> ${a.tip}</span></p>`).join('') || '<p style="font-size:12px;color:#10b981;display:flex;gap:6px;align-items:center"><i data-lucide="check-circle-2" style="width:15px;height:15px"></i> Strong across the board — keep it up!</p>'}
        </div>
      </div>

      <div class="glass-card" style="padding:16px;margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <p style="font-size:17px;font-weight:800;display:flex;align-items:center;gap:8px"><i data-lucide="layers" style="width:20px;height:20px;color:#10b981"></i> 7 Income Streams <button onclick="mrPinChart('stream','7 Income Streams')" style="background:none;border:none;color:var(--text3);cursor:pointer;padding:2px" title="Pin to a page"><i data-lucide="pin" style="width:16px;height:16px"></i></button></p>
          <span style="font-size:15px;font-weight:800;color:var(--text2)">${strm.active}<span style="font-size:13px;color:var(--text3)"> / 7 active</span></span>
        </div>
        <p style="font-size:12px;color:var(--text3);margin-bottom:8px">The average millionaire has 7 streams of income.</p>
        <div style="position:relative;height:300px"><canvas id="mr-stream-chart"></canvas></div>
        <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${strm.sums.map(s=>`<div style="display:flex;align-items:center;gap:7px;font-size:13px;padding:7px 10px;border-radius:10px;background:var(--glass);opacity:${s.total>0?1:0.5}"><span style="width:9px;height:9px;border-radius:50%;flex-shrink:0;background:${s.total>0?'#10b981':'#6b7280'}"></span><span style="flex:1;min-width:0;font-weight:600">${s.k}</span>${s.total>0?`<b style="font-size:12px">${f(s.total)}</b>`:'<i data-lucide="plus" style="width:14px;height:14px;color:var(--text3)"></i>'}</div>`).join('')}
        </div>
      </div>

      ${(()=>{ const steps=[
          {k:'Income',     v:flow.totalInc, c:'#3b82f6', ic:'arrow-down-circle'},
          {k:'Expenses',   v:flow.totalExp, c:'#f59e0b', ic:'shopping-cart'},
          {k:'Savings',    v:flow.savings,  c:'#10b981', ic:'piggy-bank'},
          {k:'Investment', v:flow.invValue, c:'#8b5cf6', ic:'trending-up'},
        ]; return `
      <div class="glass-card" style="padding:16px;margin-bottom:16px">
        <p style="font-size:17px;font-weight:800;display:flex;align-items:center;gap:8px;margin-bottom:14px"><i data-lucide="refresh-cw" style="width:20px;height:20px;color:#10b981"></i> Money Flow Cycle</p>
        <div style="display:flex;align-items:stretch;justify-content:space-between;gap:4px">
          ${steps.map((s,i)=>`
            <div style="flex:1;text-align:center">
              <div style="width:54px;height:54px;margin:0 auto 8px;border-radius:50%;background:${s.c}22;color:${s.c};display:flex;align-items:center;justify-content:center"><i data-lucide="${s.ic}" style="width:26px;height:26px"></i></div>
              <p style="font-size:12px;color:var(--text3);font-weight:600">${s.k}</p>
              <p style="font-size:13px;font-weight:800;color:${s.c};word-break:break-word">${f(s.v)}</p>
            </div>
            ${i<steps.length-1?`<div style="display:flex;align-items:center;color:var(--text3)"><i data-lucide="chevron-right" style="width:18px;height:18px"></i></div>`:''}
          `).join('')}
        </div>
        <p style="${Sfo}">Income → spend → save → invest → repeat</p>
      </div>`; })()}

      <div class="glass-card" style="padding:16px;margin-bottom:16px">
        <p style="font-size:17px;font-weight:800;display:flex;align-items:center;gap:8px;margin-bottom:4px"><i data-lucide="git-fork" style="width:20px;height:20px;color:#3b82f6"></i> Where Your Money Goes <button onclick="mrPinChart('flow','Where Your Money Goes')" style="background:none;border:none;color:var(--text3);cursor:pointer;padding:2px;margin-left:auto" title="Pin to a page"><i data-lucide="pin" style="width:16px;height:16px"></i></button></p>
        <p style="font-size:12px;color:var(--text3);margin-bottom:10px">Tap any source or category to see its transactions.</p>
        <div style="position:relative;height:340px"><canvas id="mr-flow-chart"></canvas></div>
        <p id="mr-flow-fallback" style="display:none;font-size:13px;color:var(--text3);text-align:center;padding:20px">Money-flow chart needs an internet connection the first time. Reopen online to load it.</p>
        <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:7px">
          ${[...Object.keys(flow.incBy), ...Object.keys(flow.expBy)].filter((v,i,a)=>a.indexOf(v)===i).map(k=>`<button onclick="mrShowNode('${esc(k).replace(/'/g,"\\'")}')" style="font-size:12px;font-weight:600;padding:6px 11px;border-radius:16px;background:var(--glass);border:1px solid var(--glass-border);color:var(--text2);cursor:pointer">${esc(k)}</button>`).join('')}
          ${flow.savings>0?`<button onclick="mrShowNode('Savings')" style="font-size:12px;font-weight:600;padding:6px 11px;border-radius:16px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);color:#10b981;cursor:pointer">Savings</button>`:''}
        </div>
      </div>

      <div class="mr-grid" style="display:flex;flex-direction:column;gap:14px">

        ${card('#6366f1', 'trending-up', 'Rule of 72', 'Years for your money to double.',
          `<div>
             <label style="${Sl}">Interest rate (%) — editable</label>
             <input type="number" value="12" style="${Si}" oninput="var y=this.value>0?(72/this.value):0;document.getElementById('mr72').textContent=(y?y.toFixed(1):'—')+' yrs';if(document.getElementById('mr72inv'))document.getElementById('mr72inv').textContent=(y?y.toFixed(1):'—')+' yrs'">
             <p style="${So}">Doubles in <b style="color:var(--text);font-size:17px" id="mr72">6.0 yrs</b></p>
             ${invValue>0?`<p style="${So}">💡 Your <b style="color:var(--text)">${f(invValue)}</b> → <b style="color:var(--text)">${f(invValue*2)}</b> in <b style="color:#10b981" id="mr72inv">6.0 yrs</b></p>`:''}
           </div>
           <p style="${Sfo}">Years = 72 ÷ Interest Rate</p>`)}

        ${card('#f59e0b', 'trending-down', 'Rule of 70', 'Years for inflation to halve your money.',
          `<div>
             <label style="${Sl}">Inflation rate (%) — editable</label>
             <input type="number" value="6" style="${Si}" oninput="document.getElementById('mr70').textContent=(this.value>0?(70/this.value).toFixed(1):'—')+' yrs'">
             <p style="${So}">Value halves in <b style="color:var(--text);font-size:17px" id="mr70">11.7 yrs</b></p>
             ${exp>0?`<p style="${So}">💡 Today's <b style="color:var(--text)">${f(exp)}</b>/mo spend will feel like <b style="color:var(--text)">${f(exp*2)}</b> then</p>`:''}
           </div>
           <p style="${Sfo}">Years = 70 ÷ Inflation Rate</p>`)}

        ${card('#00c9a7', 'clipboard-list', '4% Withdrawal Rule', 'Safe annual retirement withdrawal.',
          `<div>
             <label style="${Sl}">Retirement corpus (₹) — prefilled from your assets, editable</label>
             <input type="number" value="${corpusGuess}" style="${Si}" oninput="document.getElementById('mr4').textContent=window._mrINR(this.value*0.04)+' / yr';document.getElementById('mr4m').textContent=window._mrINR(this.value*0.04/12)+' / mo'">
             <p style="${So}">Withdraw <b style="color:var(--text);font-size:17px" id="mr4">${_mrINR(corpusGuess*0.04)} / yr</b> · <b style="color:var(--text)" id="mr4m">${_mrINR(corpusGuess*0.04/12)} / mo</b></p>
             <p style="${So}">💡 Based on your current assets + savings.</p>
           </div>
           <p style="${Sfo}">Annual Withdrawal = 4% of corpus</p>`)}

        ${card('#3b82f6', 'scale', '100 Minus Age Rule', 'Ideal equity vs debt allocation.',
          `<div>
             <label style="${Sl}">Your age — editable</label>
             <input type="number" value="${age}" style="${Si}" oninput="var e=Math.max(0,Math.min(100,100-this.value));document.getElementById('mreq').textContent=e+'% equity / '+(100-e)+'% debt';if(document.getElementById('mreqe')){document.getElementById('mreqe').textContent=window._mrINR(${invValue}*e/100);document.getElementById('mreqd').textContent=window._mrINR(${invValue}*(100-e)/100)}">
             <p style="${So}"><b style="color:var(--text);font-size:17px" id="mreq">${100-age}% equity / ${age}% debt</b></p>
             ${invValue>0?`<p style="${So}">💡 Of your <b style="color:var(--text)">${f(invValue)}</b>: <b style="color:#10b981" id="mreqe">${_mrINR(invValue*(100-age)/100)}</b> equity · <b style="color:#3b82f6" id="mreqd">${_mrINR(invValue*age/100)}</b> debt</p>`:''}
           </div>
           <p style="${Sfo}">Equity % = 100 − Age</p>`)}

        ${card('#8b5cf6', 'pie-chart', '10 · 5 · 3 Rule', 'Expected long-term returns by asset class.',
          `<ul style="list-style:none;display:flex;flex-direction:column;gap:10px;margin:0;padding:0">
             <li style="display:flex;align-items:center;gap:9px;font-size:16px;font-weight:600"><span style="${Sdot};background:#8b5cf6"></span>10% — Equity / Stocks</li>
             <li style="display:flex;align-items:center;gap:9px;font-size:16px;font-weight:600"><span style="${Sdot};background:#3b82f6"></span>5% — Debt / Bonds</li>
             <li style="display:flex;align-items:center;gap:9px;font-size:16px;font-weight:600"><span style="${Sdot};background:#f59e0b"></span>3% — Savings Account</li>
           </ul>
           ${invValue>0?`<p style="${So}">💡 Your <b style="color:var(--text)">${f(invValue)}</b> at 10% ≈ <b style="color:#10b981">${f(invValue*0.1)}</b>/yr in equity</p>`:''}`)}

        ${card('#10b981', 'wallet', '50 · 30 · 20 Rule', 'Budget split of your income.',
          `<div>
             <label style="${Sl}">Monthly income (₹) — prefilled, editable</label>
             <input type="number" value="${inc}" style="${Si}" oninput="document.getElementById('s50n').textContent=window._mrINR(this.value*0.5);document.getElementById('s50w').textContent=window._mrINR(this.value*0.3);document.getElementById('s50s').textContent=window._mrINR(this.value*0.2)">
           </div>
           <div style="display:flex;flex-direction:column;gap:12px;margin-top:12px">
             <div style="display:flex;align-items:center;gap:9px;font-size:15px;font-weight:600"><span style="${Sdot};background:#3b82f6"></span>Needs 50%<b style="margin-left:auto;font-size:16px;font-weight:800" id="s50n">${_mrINR(inc*0.5)}</b></div>
             <div style="display:flex;align-items:center;gap:9px;font-size:15px;font-weight:600"><span style="${Sdot};background:#f59e0b"></span>Wants 30%<b style="margin-left:auto;font-size:16px;font-weight:800" id="s50w">${_mrINR(inc*0.3)}</b></div>
             <div style="display:flex;align-items:center;gap:9px;font-size:15px;font-weight:600"><span style="${Sdot};background:#10b981"></span>Savings 20%<b style="margin-left:auto;font-size:16px;font-weight:800" id="s50s">${_mrINR(inc*0.2)}</b></div>
           </div>
           <p style="${Sfo}">Target split of your monthly income</p>`)}

        ${card('#ef4444', 'shield', '6× Emergency Rule', 'Emergency fund you should hold.',
          `<div>
             <label style="${Sl}">Monthly expense (₹) — prefilled, editable</label>
             <input type="number" value="${exp}" style="${Si}" oninput="var t=this.value*6;document.getElementById('em6').textContent=window._mrINR(t);var g=t-${netSaved};document.getElementById('emgap').textContent=g>0?('Save '+window._mrINR(g)+' more'):'✓ Fully funded';document.getElementById('emgap').style.color=g>0?'#f59e0b':'#10b981'">
             <p style="${Sbig};margin-top:10px" id="em6">${_mrINR(exp*6)}</p>
             <p style="${So}">💡 You have <b style="color:var(--text)">${f(netSaved)}</b> saved · <b id="emgap" style="color:${exp*6-netSaved>0?'#f59e0b':'#10b981'}">${exp*6-netSaved>0?('Save '+_mrINR(exp*6-netSaved)+' more'):'✓ Fully funded'}</b></p>
           </div>
           <p style="${Sfo}">Emergency Fund = 6 × Monthly Expenses</p>`)}

        ${card('#ec4899', 'home', '40% EMI Rule', 'Keep loan EMIs stress-free.',
          `<div>
             <label style="${Sl}">Monthly income (₹) — prefilled, editable</label>
             <input type="number" value="${inc}" style="${Si}" oninput="var mx=this.value*0.4;document.getElementById('emi40').textContent=window._mrINR(mx);var ok=${emiMonthly}<=mx;document.getElementById('emistat').textContent=${emiMonthly}>0?(ok?'✓ Within limit':'⚠ Over limit'):'No EMIs logged';document.getElementById('emistat').style.color=ok?'#10b981':'#ef4444'">
             <p style="${Sbig};margin-top:10px" id="emi40">${_mrINR(inc*0.4)}</p>
             <p style="${So}">💡 Your current EMIs: <b style="color:var(--text)">${f(emiMonthly)}</b>/mo · <b id="emistat" style="color:${emiMonthly<=inc*0.4?'#10b981':'#ef4444'}">${emiMonthly>0?(emiMonthly<=inc*0.4?'✓ Within limit':'⚠ Over limit'):'No EMIs logged'}</b></p>
           </div>
           <p style="${Sfo}">EMI ≤ 40% of Monthly Income</p>`)}

        ${card('#06b6d4', 'umbrella', 'Life Insurance Rule', 'Ideal life-cover amount.',
          `<div>
             <label style="${Sl}">Annual income (₹) — prefilled, editable</label>
             <input type="number" value="${annualInc}" style="${Si}" oninput="document.getElementById('liclo').textContent=window._mrINR(this.value*10);document.getElementById('lichi').textContent=window._mrINR(this.value*15)">
             <p style="${Sbig};margin-top:10px"><span id="liclo">${_mrINR(annualInc*10)}</span> – <span id="lichi">${_mrINR(annualInc*15)}</span></p>
             ${cover>0
               ? `<p style="${So}">💡 Your cover: <b style="color:var(--text)">${f(cover)}</b> · <b style="color:${cover>=annualInc*10?'#10b981':'#f59e0b'}">${cover>=annualInc*10?'✓ Adequate':'Top up '+_mrINR(annualInc*10-cover)}</b></p>`
               : `<p style="${So}">💡 Add your current cover in “Your Details” to see the gap.</p>`}
           </div>
           <p style="${Sfo}">Cover = 10–15 × Annual Income</p>`)}

      </div>
      <p style="text-align:center;color:var(--text3);font-size:12px;margin:18px 0 8px">These are general rules of thumb, not personalised advice.</p>
    </div>`;

  // Refresh Lucide icons (needed when re-rendered via the period dropdown,
  // which bypasses _renderPage's icon pass) and draw the charts.
  setTimeout(() => {
    if (window.lucide && lucide.createIcons) { try { lucide.createIcons(); } catch (_) {} }
    _mrDrawCharts(fh, strm, flow);
  }, 30);
}

function _mrDrawCharts(fh, strm, flow) {
  if (!window.Chart) return;
  const isLight = document.body.classList.contains('light');
  const grid = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)';
  const tick = isLight ? '#64748b' : '#94a3b8';
  chartInstances = chartInstances || {};

  // Financial Health radar
  const c1 = document.getElementById('mr-health-chart');
  if (c1) {
    try { chartInstances.mrHealth && chartInstances.mrHealth.destroy(); } catch (_) {}
    chartInstances.mrHealth = new Chart(c1.getContext('2d'), {
      type: 'radar',
      data: {
        labels: fh.axes.map(a => a.k),
        datasets: [{
          data: fh.axes.map(a => a.v),
          borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.25)',
          borderWidth: 2, pointBackgroundColor: '#6366f1', pointRadius: 4,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false } },
        scales: { r: {
          min: 0, max: 100, ticks: { stepSize: 20, color: tick, backdropColor: 'transparent', font: { size: 10 } },
          grid: { color: grid }, angleLines: { color: grid },
          pointLabels: { color: tick, font: { size: 12, weight: '600' } }
        } }
      }
    });
  }

  // 7 Income Streams radar (heptagon)
  const c2 = document.getElementById('mr-stream-chart');
  if (c2) {
    try { chartInstances.mrStream && chartInstances.mrStream.destroy(); } catch (_) {}
    const max = Math.max(1, ...strm.sums.map(s => s.total));
    chartInstances.mrStream = new Chart(c2.getContext('2d'), {
      type: 'radar',
      data: {
        labels: strm.sums.map(s => s.k),
        datasets: [{
          data: strm.sums.map(s => Math.round((s.total / max) * 100)),
          borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.30)',
          borderWidth: 2, pointBackgroundColor: '#10b981', pointRadius: 4,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => fmt(strm.sums[ctx.dataIndex].total) } } },
        scales: { r: {
          min: 0, max: 100, ticks: { display: false, stepSize: 25 },
          grid: { color: grid }, angleLines: { color: grid },
          pointLabels: { color: tick, font: { size: 12, weight: '600' } }
        } }
      }
    });
  }

  // Money-flow Sankey (income sources → Income → expense categories + Savings)
  const c3 = document.getElementById('mr-flow-chart');
  if (c3 && flow) {
    const hasSankey = !!(window.Chart.registry && Chart.registry.controllers && Chart.registry.controllers.items && Chart.registry.controllers.items.sankey);
    if (!hasSankey || flow.totalInc <= 0) {
      const fb = document.getElementById('mr-flow-fallback');
      if (fb) { fb.style.display = 'block'; fb.textContent = flow.totalInc <= 0 ? 'Add some income to see your money flow.' : 'Money-flow chart needs an internet connection the first time. Reopen online to load it.'; }
      c3.style.display = 'none';
      return;
    }
    try { chartInstances.mrFlow && chartInstances.mrFlow.destroy(); } catch (_) {}
    const palette = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899','#6366f1','#14b8a6','#f97316'];
    let ci = 0; const colorMap = {};
    const colorOf = (k) => (colorMap[k] = colorMap[k] || palette[(ci++) % palette.length]);
    const data = [];
    Object.entries(flow.incBy).forEach(([k, v]) => { if (v > 0) { data.push({ from: k, to: 'Income', flow: Math.round(v) }); colorOf(k); } });
    // top expense categories (cap at 8, group rest as "Other")
    const exps = Object.entries(flow.expBy).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const top = exps.slice(0, 8); const restSum = exps.slice(8).reduce((a, e) => a + e[1], 0);
    top.forEach(([k, v]) => { data.push({ from: 'Income', to: k, flow: Math.round(v) }); colorOf(k); });
    if (restSum > 0) { data.push({ from: 'Income', to: 'Other', flow: Math.round(restSum) }); colorOf('Other'); }
    if (flow.savings > 0) { data.push({ from: 'Income', to: 'Savings', flow: Math.round(flow.savings) }); }
    colorMap['Income'] = '#22c55e'; colorMap['Savings'] = '#10b981';

    chartInstances.mrFlow = new Chart(c3.getContext('2d'), {
      type: 'sankey',
      data: { datasets: [{
        data,
        colorFrom: (c) => colorOf(c.dataset.data[c.dataIndex].from),
        colorTo: (c) => colorOf(c.dataset.data[c.dataIndex].to),
        colorMode: 'gradient',
        labels: {},
        color: tick,
        font: { size: 11, weight: '600' },
        borderWidth: 0,
      }] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        onClick: (evt, els, chart) => {
          const pts = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
          if (!pts.length) return;
          const raw = chart.data.datasets[0].data[pts[0].index];
          if (!raw) return;
          const node = raw.from === 'Income' ? raw.to : raw.from;
          if (typeof mrShowNode === 'function') mrShowNode(node);
        },
        plugins: { legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `${ctx.raw.from} → ${ctx.raw.to}: ${fmt(ctx.raw.flow)}` } } },
      }
    });
  }
}
