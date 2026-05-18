// ===== FINANCE PAGE =====
let _finMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM" — current month by default

const CATEGORIES = [
  { name: 'Salary', icon: '💰' }, { name: 'Business', icon: '🏢' }, { name: 'Freelance', icon: '💻' },
  { name: 'Food', icon: '🍔' }, { name: 'Transport', icon: '🚗' }, { name: 'Shopping', icon: '🛍️' },
  { name: 'Health', icon: '🏥' }, { name: 'Bills', icon: '🧾' }, { name: 'EMI', icon: '🏦' },
  { name: 'Insurance', icon: '🛡️' }, { name: 'Investment', icon: '📈' }, { name: 'Entertainment', icon: '🎬' },
  { name: 'Education', icon: '📚' }, { name: 'Travel', icon: '✈️' }, { name: 'Gifts', icon: '🎁' },
  { name: 'Fuel', icon: '⛽' }, { name: 'Groceries', icon: '🛒' }, { name: 'Rent', icon: '🏠' },
  { name: 'Utilities', icon: '💡' }, { name: 'Other', icon: '📦' }
];

function renderFinance() {
  const txns = [...(STATE.transactions || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const income  = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = income - expense;
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;
  const savingsOk = savings >= 0;
  const userName = (STATE.user?.name || STATE.user?.email || 'Your').split(' ')[0];

  // Build category spending map for "Spending by Category"
  const catMap = {};
  txns.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });
  const topCats = Object.entries(catMap).sort(([,a],[,b]) => b - a).slice(0, 6);

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in" style="max-width:900px;margin:0 auto">

      <!-- Header -->
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px">
        <div>
          <h1 class="page-title">💰 Finance</h1>
          <p class="page-subtitle">${new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-secondary btn-sm" onclick="openSmsParser()" style="display:flex;align-items:center;gap:6px">📲 Scan SMS</button>
          <button class="btn-primary btn-sm" onclick="openAddTxModal()">+ Add Transaction</button>
        </div>
      </div>

      <!-- Kaasu-style Hero Balance Card -->
      <div style="position:relative;overflow:hidden;border-radius:24px;background:linear-gradient(135deg,#00c9a7,#0acf83,#00b09b);padding:28px;margin-bottom:20px;box-shadow:0 20px 60px rgba(0,201,167,0.35)">
        <div style="position:absolute;top:-60px;right:-60px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,0.15)"></div>
        <div style="position:absolute;bottom:-40px;left:-40px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,0.08)"></div>
        <div style="position:relative">
          <p style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(0,60,50,0.75);margin-bottom:6px">💰 Total Balance</p>
          <p style="font-size:48px;font-weight:900;color:#001a14;letter-spacing:-2px;line-height:1">${fmt(savings)}</p>
          <div style="display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap">
            <span style="font-size:12px;font-weight:700;padding:5px 12px;border-radius:20px;background:rgba(255,255,255,0.4);color:${savingsOk?'#004d3a':'#7f0000'}">
              ${savingsOk?'📈':'📉'} ${savingsRate}% savings rate
            </span>
            <span style="font-size:12px;font-weight:600;color:rgba(0,50,40,0.8)">✨ ${userName}'s wallet</span>
          </div>
          <div style="display:flex;gap:32px;margin-top:20px;flex-wrap:wrap">
            <div>
              <p style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,60,50,0.7);margin-bottom:4px">💚 Income</p>
              <p style="font-size:22px;font-weight:900;color:#003326">+${fmt(income)}</p>
            </div>
            <div>
              <p style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,60,50,0.7);margin-bottom:4px">❤️ Expenses</p>
              <p style="font-size:22px;font-weight:900;color:#7f0000">-${fmt(expense)}</p>
            </div>
            <div>
              <p style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,60,50,0.7);margin-bottom:4px">💜 Savings</p>
              <p style="font-size:22px;font-weight:900;color:${savingsOk?'#001a14':'#7f0000'}">${savingsOk?'+':''}${fmt(savings)}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Bank Accounts -->
      <div class="glass-card" style="padding:20px;margin-bottom:20px">
        <div class="section-header" style="margin-bottom:16px">
          <p class="section-title">🏦 Bank Accounts
            <span style="font-size:11px;font-weight:500;color:var(--text3);margin-left:8px">${(STATE.bankAccounts||[]).length} accounts</span>
          </p>
          <button class="btn-primary btn-sm" onclick="addBankAccount()">+ Add Bank</button>
        </div>
        ${(STATE.bankAccounts||[]).length === 0
          ? `<div class="empty-state" style="padding:28px 0"><span class="empty-state-icon">🏦</span><p>No bank accounts yet. Add your first one!</p></div>`
          : `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-bottom:16px">
            ${(STATE.bankAccounts||[]).map((b,i) => `
            <div style="padding:16px;border-radius:14px;background:linear-gradient(135deg,${b.color||'#1e293b'},${b.color2||'#0f172a'});position:relative;overflow:hidden">
              <div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.08)"></div>
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div style="font-size:22px">${b.icon||'🏦'}</div>
                <div style="display:flex;gap:6px">
                  <button onclick="updateBankBalance(${i})" style="background:rgba(0,201,167,0.25);border:none;color:#00ffd5;font-size:11px;padding:3px 8px;border-radius:6px;cursor:pointer">↑ Bal</button>
                  <button onclick="editBankAccount(${i})" style="background:rgba(255,255,255,0.15);border:none;color:#fff;font-size:11px;padding:3px 8px;border-radius:6px;cursor:pointer">Edit</button>
                  <button onclick="deleteBankAccount(${i})" style="background:rgba(239,68,68,0.25);border:none;color:#fca5a5;font-size:11px;padding:3px 8px;border-radius:6px;cursor:pointer">✕</button>
                </div>
              </div>
              <p style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.55);margin:10px 0 4px">${b.bankName}</p>
              <p style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px">${fmt(b.balance)}</p>
              <div style="display:flex;justify-content:space-between;margin-top:8px">
                <span style="font-size:11px;color:rgba(255,255,255,0.5)">${b.type||'Savings'}</span>
                ${b.lastFour ? `<span style="font-size:11px;color:rgba(255,255,255,0.5)">•••• ${b.lastFour}</span>` : ''}
              </div>
            </div>`).join('')}
          </div>
          <div style="padding:12px 16px;border-radius:12px;background:rgba(0,201,167,0.1);border:1px solid rgba(0,201,167,0.2);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:13px;font-weight:600;color:var(--teal)">💰 Total Bank Balance</span>
            <span style="font-size:20px;font-weight:900;color:var(--teal)">${fmt((STATE.bankAccounts||[]).reduce((s,b)=>s+b.balance,0))}</span>
          </div>`}
      </div>

      <!-- Credit Cards -->
      <div class="glass-card" style="padding:20px;margin-bottom:20px">
        <div class="section-header" style="margin-bottom:16px">
          <p class="section-title">💳 Credit Cards
            <span style="font-size:11px;font-weight:500;color:var(--text3);margin-left:8px">${(STATE.creditCards||[]).length} cards</span>
          </p>
          <button class="btn-primary btn-sm" onclick="addCreditCard()">+ Add Card</button>
        </div>
        ${(STATE.creditCards||[]).length === 0
          ? `<div class="empty-state" style="padding:28px 0"><span class="empty-state-icon">💳</span><p>No credit cards yet. Add your first one!</p></div>`
          : `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin-bottom:16px">
            ${(STATE.creditCards||[]).map((c,i) => {
              const used = c.outstanding || 0;
              const limit = c.limit || 1;
              const pct = Math.min(100, Math.round((used/limit)*100));
              const utilColor = pct>80?'#ef4444':pct>50?'#f59e0b':'#10b981';
              return `
            <div style="padding:18px;border-radius:16px;background:linear-gradient(135deg,${c.color||'#1e293b'},${c.color2||'#0f172a'});position:relative;overflow:hidden">
              <div style="position:absolute;top:-25px;right:-25px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.07)"></div>
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div>
                  <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5)">${c.network||'VISA'}</div>
                  <div style="font-size:14px;font-weight:800;color:#fff;margin-top:2px">${c.bankName}</div>
                </div>
                <div style="display:flex;gap:6px">
                  <button onclick="editCreditCard(${i})" style="background:rgba(255,255,255,0.15);border:none;color:#fff;font-size:11px;padding:3px 8px;border-radius:6px;cursor:pointer">Edit</button>
                  <button onclick="deleteCreditCard(${i})" style="background:rgba(239,68,68,0.25);border:none;color:#fca5a5;font-size:11px;padding:3px 8px;border-radius:6px;cursor:pointer">✕</button>
                </div>
              </div>
              ${c.lastFour?`<div style="font-size:13px;letter-spacing:3px;color:rgba(255,255,255,0.45);margin:10px 0 4px">•••• •••• •••• ${c.lastFour}</div>`:''}
              <div style="margin-top:10px">
                <div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.55);margin-bottom:5px">
                  <span>Outstanding</span><span>Limit</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:900;color:#fff;margin-bottom:8px">
                  <span style="color:${pct>80?'#fca5a5':'#fff'}">${fmt(used)}</span>
                  <span style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.6)">${fmt(limit)}</span>
                </div>
                <div style="height:5px;border-radius:4px;background:rgba(255,255,255,0.15)">
                  <div style="height:5px;border-radius:4px;width:${pct}%;background:${utilColor};transition:.3s"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:5px">
                  <span style="font-size:10px;color:rgba(255,255,255,0.45)">${pct}% utilised</span>
                  ${c.dueDate?`<span style="font-size:10px;color:rgba(255,255,255,0.45)">Due: ${c.dueDate}</span>`:''}
                </div>
              </div>
            </div>`}).join('')}
          </div>
          <div style="padding:12px 16px;border-radius:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:13px;font-weight:600;color:#ef4444">💳 Total Outstanding</span>
            <span style="font-size:20px;font-weight:900;color:#ef4444">${fmt((STATE.creditCards||[]).reduce((s,c)=>s+(c.outstanding||0),0))}</span>
          </div>`}
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
        ${[
          { label:'Transactions', value: txns.length, icon:'⚡', color:'rgba(99,102,241,0.15)', tc:'#6366f1' },
          { label:'This Month',   value: txns.filter(t=>{const d=new Date(t.date),n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();}).length, icon:'🎯', color:'rgba(16,185,129,0.15)', tc:'#10b981' },
          { label:'Savings Rate', value: savingsRate+'%', icon:'📈', color:'rgba(139,92,246,0.15)', tc:'#8b5cf6' },
        ].map(s=>`
          <div class="glass-card" style="padding:16px;text-align:center">
            <div style="display:inline-flex;padding:8px;border-radius:10px;background:${s.color};font-size:18px;margin-bottom:8px">${s.icon}</div>
            <p style="font-size:20px;font-weight:800;color:${s.tc}">${s.value}</p>
            <p style="font-size:11px;color:var(--text3);margin-top:2px">${s.label}</p>
          </div>`).join('')}
      </div>

      <!-- Charts Row -->
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:20px" class="fin-charts-row">
        <div class="glass-card" style="padding:20px">
          <p class="section-title" style="margin-bottom:16px">📈 Income vs Expenses</p>
          <div class="chart-container"><canvas id="finance-chart"></canvas></div>
        </div>
        <div class="glass-card" style="padding:20px">
          <p class="section-title" style="margin-bottom:16px">🥧 Spending by Category</p>
          ${topCats.length === 0
            ? `<div style="display:flex;align-items:center;justify-content:center;height:180px;color:var(--text3);font-size:13px">No expense data yet.</div>`
            : `<div class="chart-container"><canvas id="finance-pie-chart"></canvas></div>`}
        </div>
      </div>

      <!-- Transactions with live month filter -->
      <div class="glass-card" style="overflow:hidden;margin-bottom:20px">
        <div style="padding:12px 16px;border-bottom:1px solid var(--glass-border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <p class="section-title" style="margin:0">💳 Transactions</p>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <button onclick="shiftFinMonth(-1)" style="background:var(--glass-bg);border:1px solid var(--glass-border);color:var(--text1);border-radius:8px;padding:4px 10px;cursor:pointer;font-size:14px">◀</button>
            <input type="month" id="fin-month" value="${_finMonth}"
              oninput="applyFinanceFilter()"
              style="background:var(--glass-bg);border:1px solid var(--glass-border);color:var(--text1);border-radius:8px;padding:4px 8px;font-size:12px;cursor:pointer"/>
            <button onclick="shiftFinMonth(1)" style="background:var(--glass-bg);border:1px solid var(--glass-border);color:var(--text1);border-radius:8px;padding:4px 10px;cursor:pointer;font-size:14px">▶</button>
            <button onclick="_finMonth='';document.getElementById('fin-month').value='';renderFinanceTxList()" style="background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);color:#6366f1;border-radius:8px;padding:4px 10px;cursor:pointer;font-size:11px;font-weight:700">All</button>
            <span id="fin-tx-count" style="font-size:11px;color:var(--text3)"></span>
          </div>
        </div>
        <div id="fin-tx-list"></div>
      </div>

    </div>`;

  renderFinanceChart(txns);
  if (topCats.length > 0) renderFinancePieChart(topCats);
  renderFinanceTxList();
}

function renderFinanceChart(txns) {
  const canvas = document.getElementById('finance-chart');
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
  const sorted = Object.entries(monthMap).sort(([a],[b])=>a.localeCompare(b)).slice(-8);
  const labels = sorted.map(([,v])=>v.label);
  const incomeData = sorted.map(([,v])=>v.income);
  const expenseData = sorted.map(([,v])=>v.expense);
  chartInstances['finance'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Income', data: incomeData, backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6 },
        { label: 'Expense', data: expenseData, backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 6 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter' } } } },
      scales: {
        x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#64748b', callback: v => `₹${(v/1000).toFixed(0)}k` }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

function renderFinancePieChart(topCats) {
  const canvas = document.getElementById('finance-pie-chart');
  if (!canvas) return;
  const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
  chartInstances['finance-pie'] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: topCats.map(([name]) => name),
      datasets: [{
        data: topCats.map(([,v]) => v),
        backgroundColor: COLORS,
        borderWidth: 2,
        borderColor: 'rgba(15,15,35,0.5)',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, padding: 12, boxWidth: 10 } },
        tooltip: { callbacks: { label: ctx => ` ₹${ctx.parsed.toLocaleString('en-IN')}` } }
      }
    }
  });
}


// ===== TRANSACTION LIST — LIVE MONTH FILTER =====

function applyFinanceFilter() {
  _finMonth = document.getElementById('fin-month')?.value || '';
  renderFinanceTxList();
}

function shiftFinMonth(dir) {
  const cur = _finMonth || new Date().toISOString().slice(0, 7);
  const [y, mo] = cur.split('-').map(Number);
  const d = new Date(y, mo - 1 + dir, 1);
  _finMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const inp = document.getElementById('fin-month');
  if (inp) inp.value = _finMonth;
  renderFinanceTxList();
}

function renderFinanceTxList() {
  const container = document.getElementById('fin-tx-list');
  if (!container) return;

  let txns = [...(STATE.transactions || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (_finMonth) txns = txns.filter(t => (t.date || '').startsWith(_finMonth));

  const countEl = document.getElementById('fin-tx-count');
  if (countEl) countEl.textContent = `${txns.length} entr${txns.length === 1 ? 'y' : 'ies'}`;

  if (!txns.length) {
    container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">💳</span><p>No transactions${_finMonth ? ' for this period' : ' yet'}. Add your first one!</p></div>`;
    return;
  }

  container.innerHTML = txns.map(tx => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.04);transition:.2s"
         onmouseover="this.style.background='rgba(255,255,255,0.04)'" onmouseout="this.style.background=''">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:${tx.type === 'income' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'};font-size:18px">${tx.icon || '💳'}</div>
        <div>
          <p style="font-size:13px;font-weight:600">${tx.description || tx.category}</p>
          <p style="font-size:11px;color:var(--text3)">${tx.category} · ${fmtDate(tx.date)}</p>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-weight:700;font-size:14px;color:${tx.type === 'income' ? '#10b981' : '#ef4444'}">${tx.type === 'income' ? '+' : '-'}${fmt(tx.amount)}</span>
        <button class="btn-icon btn-sm" onclick="openEditTxModal('${tx.id}')" style="font-size:13px" title="Edit">✏️</button>
        <button class="btn-icon btn-sm" onclick="deleteTx('${tx.id}')" style="font-size:13px;color:#ef4444;border-color:rgba(239,68,68,0.3)" title="Delete">✕</button>
      </div>
    </div>`).join('');
}

function openAddTxModal() {
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const catOptions = allCats.map(c => `<option value="${c.name}" data-icon="${c.icon}">${c.icon} ${c.name}</option>`).join('');

  openModal('Add Transaction', `
    <div class="form-group"><label class="form-label">Type</label>
      <select id="tx-type" class="form-input"><option value="expense">❤️ Expense</option><option value="income">💚 Income</option></select></div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Amount (₹)</label><input type="number" id="tx-amount" class="form-input" placeholder="0.00" min="0" step="0.01"/></div>
      <div class="form-group"><label class="form-label">Date</label><input type="date" id="tx-date" class="form-input" value="${today()}"/></div>
    </div>
    <div class="form-group"><label class="form-label">Category</label><select id="tx-cat" class="form-input">${catOptions}</select></div>
    <div class="form-group"><label class="form-label">Description</label><input type="text" id="tx-desc" class="form-input" placeholder="What was this for?"/></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveTx()">Save Transaction</button>
    </div>`);
}

function saveTx() {
  const type = document.getElementById('tx-type').value;
  const amount = parseFloat(document.getElementById('tx-amount').value);
  const date = document.getElementById('tx-date').value;
  const catEl = document.getElementById('tx-cat');
  const category = catEl.value;
  const icon = CATEGORIES.find(c => c.name === category)?.icon || '💳';
  const description = document.getElementById('tx-desc').value.trim();
  if (!amount || amount <= 0) { toast('Enter a valid amount', 'error'); return; }
  STATE.transactions = STATE.transactions || [];
  STATE.transactions.unshift({ id: genId(), type, amount, date: date || today(), category, icon, description, createdAt: new Date().toISOString() });
  saveState();
  addXP(10, 'Transaction logged');
  if (typeof autoSyncGoals === 'function') autoSyncGoals();
  closeModal();
  toast('Transaction saved! +10 XP', 'success');
  renderFinance();
}

function deleteTx(id) {
  STATE.transactions = (STATE.transactions || []).filter(t => t.id !== id);
  saveState();
  if (typeof autoSyncGoals === 'function') autoSyncGoals();
  toast('Transaction deleted', 'info');
  renderFinanceTxList(); // instant remove from list
}

function openEditTxModal(id) {
  const tx = (STATE.transactions || []).find(t => t.id === id);
  if (!tx) return;
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const catOptions = allCats.map(c =>
    `<option value="${c.name}" ${c.name === tx.category ? 'selected' : ''}>${c.icon} ${c.name}</option>`
  ).join('');

  openModal('✏️ Edit Transaction', `
    <div class="form-group">
      <label class="form-label">Type</label>
      <select id="etx-type" class="form-input">
        <option value="expense" ${tx.type === 'expense' ? 'selected' : ''}>❤️ Expense</option>
        <option value="income"  ${tx.type === 'income'  ? 'selected' : ''}>💚 Income</option>
      </select>
    </div>
    <div class="input-row">
      <div class="form-group">
        <label class="form-label">Amount (₹)</label>
        <input type="number" id="etx-amount" class="form-input" value="${tx.amount}" step="0.01" min="0"/>
      </div>
      <div class="form-group">
        <label class="form-label">Date</label>
        <input type="date" id="etx-date" class="form-input" value="${tx.date}"/>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Category</label>
      <select id="etx-cat" class="form-input">${catOptions}</select>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <input type="text" id="etx-desc" class="form-input" value="${tx.description || ''}" placeholder="What was this for?"/>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveEditTx('${id}')">💾 Save Changes</button>
    </div>`);
}

function saveEditTx(id) {
  const tx = (STATE.transactions || []).find(t => t.id === id);
  if (!tx) return;

  const type   = document.getElementById('etx-type')?.value;
  const amount = parseFloat(document.getElementById('etx-amount')?.value);
  const date   = document.getElementById('etx-date')?.value || today();
  const cat    = document.getElementById('etx-cat')?.value;
  const desc   = document.getElementById('etx-desc')?.value.trim();

  if (!amount || amount <= 0) { toast('Enter a valid amount', 'error'); return; }

  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  tx.type        = type;
  tx.amount      = amount;
  tx.date        = date;
  tx.category    = cat;
  tx.icon        = allCats.find(c => c.name === cat)?.icon || tx.icon || '💳';
  tx.description = desc;

  saveState();
  if (typeof autoSyncGoals === 'function') autoSyncGoals();
  closeModal();
  toast('Transaction updated ✅', 'success');
  renderFinanceTxList(); // instant list refresh without full page re-render
}

// ===== BANK ACCOUNTS =====
const BANK_PRESETS = [
  { label:'SBI',          icon:'🏛️', color:'#1a237e', color2:'#0d1757' },
  { label:'HDFC',         icon:'🔴', color:'#b71c1c', color2:'#7f1212' },
  { label:'ICICI',        icon:'🟠', color:'#e65100', color2:'#bf360c' },
  { label:'Axis',         icon:'🟣', color:'#4a148c', color2:'#2d0066' },
  { label:'Kotak',        icon:'🔴', color:'#c62828', color2:'#8e1919' },
  { label:'Yes Bank',     icon:'🟢', color:'#1b5e20', color2:'#0d3311' },
  { label:'Federal Bank', icon:'🔵', color:'#1565c0', color2:'#0d3b7a' },
  { label:'IndusInd',     icon:'🟡', color:'#f57f17', color2:'#c46200' },
  { label:'PNB',          icon:'🟠', color:'#bf360c', color2:'#8b1a00' },
  { label:'Canara',       icon:'🔵', color:'#0277bd', color2:'#004d8e' },
  { label:'PayTM',        icon:'💙', color:'#006cb7', color2:'#004c87' },
  { label:'Other',        icon:'🏦', color:'#1e293b', color2:'#0f172a' },
];

function addBankAccount() {
  const presetOpts = BANK_PRESETS.map(p => `<option value="${p.label}">${p.icon} ${p.label}</option>`).join('');
  openModal('Add Bank Account', `
    <div class="form-group"><label class="form-label">Bank Name</label>
      <select id="bank-preset" class="form-input" onchange="applyBankPreset(this.value)">
        <option value="">-- Select Bank --</option>${presetOpts}
        <option value="custom">✏️ Custom</option>
      </select>
    </div>
    <div class="form-group" id="bank-custom-row" style="display:none">
      <label class="form-label">Custom Bank Name</label>
      <input type="text" id="bank-custom-name" class="form-input" placeholder="My Bank Name"/>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Account Type</label>
        <select id="bank-type" class="form-input">
          <option>Savings</option><option>Current</option><option>Salary</option><option>Fixed Deposit</option><option>Wallet</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">Balance (₹)</label>
        <input type="number" id="bank-balance" class="form-input" placeholder="0.00" min="0" step="0.01"/>
      </div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Balance As Of Date</label>
        <input type="date" id="bank-bal-date" class="form-input" value="${today()}"/>
      </div>
      <div class="form-group"><label class="form-label">Last 4 digits of Account No. (optional)</label>
        <input type="text" id="bank-last4" class="form-input" maxlength="4" placeholder="XXXX"/>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveBankAccount(null)">Save Account</button>
    </div>`);
}

function applyBankPreset(val) {
  const customRow = document.getElementById('bank-custom-row');
  if (customRow) customRow.style.display = val === 'custom' ? 'flex' : 'none';
}

function editBankAccount(i) {
  const b = (STATE.bankAccounts||[])[i];
  if (!b) return;
  const presetOpts = BANK_PRESETS.map(p => `<option value="${p.label}" ${b.bankName===p.label?'selected':''}>${p.icon} ${p.label}</option>`).join('');
  openModal('Edit Bank Account', `
    <div class="form-group"><label class="form-label">Bank Name</label>
      <select id="bank-preset" class="form-input">
        <option value="">-- Select Bank --</option>${presetOpts}
        <option value="custom" ${!BANK_PRESETS.find(p=>p.label===b.bankName)?'selected':''}>✏️ Custom</option>
      </select>
    </div>
    <div class="form-group" id="bank-custom-row" style="display:${!BANK_PRESETS.find(p=>p.label===b.bankName)?'flex':'none'}">
      <label class="form-label">Custom Bank Name</label>
      <input type="text" id="bank-custom-name" class="form-input" value="${b.bankName||''}"/>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Account Type</label>
        <select id="bank-type" class="form-input">
          ${['Savings','Current','Salary','Fixed Deposit','Wallet'].map(t=>`<option ${b.type===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Balance (₹)</label>
        <input type="number" id="bank-balance" class="form-input" value="${b.balance||0}" min="0" step="0.01"/>
      </div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Balance As Of Date</label>
        <input type="date" id="bank-bal-date" class="form-input" value="${today()}"/>
      </div>
      <div class="form-group"><label class="form-label">Last 4 digits</label>
        <input type="text" id="bank-last4" class="form-input" maxlength="4" value="${b.lastFour||''}"/>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveBankAccount(${i})">Update Account</button>
    </div>`);
}

function saveBankAccount(editIndex) {
  const preset   = document.getElementById('bank-preset')?.value;
  const isCustom = preset === 'custom' || preset === '';
  const bankName = isCustom
    ? (document.getElementById('bank-custom-name')?.value.trim() || 'My Bank')
    : preset;
  const balance  = parseFloat(document.getElementById('bank-balance')?.value) || 0;
  const type     = document.getElementById('bank-type')?.value || 'Savings';
  const lastFour = document.getElementById('bank-last4')?.value.trim().slice(-4) || '';
  const balDate  = document.getElementById('bank-bal-date')?.value || today();

  const found = BANK_PRESETS.find(p => p.label === bankName);
  const icon  = found?.icon  || '🏦';
  const color = found?.color || '#1e293b';
  const color2= found?.color2|| '#0f172a';

  const account = { id: genId(), bankName, type, balance, lastFour, icon, color, color2 };
  STATE.bankAccounts = STATE.bankAccounts || [];

  if (editIndex !== null && editIndex >= 0) {
    account.id = STATE.bankAccounts[editIndex].id;
    STATE.bankAccounts[editIndex] = account;
    toast('Bank account updated! ✅', 'success');
  } else {
    STATE.bankAccounts.push(account);
    toast('Bank account added! 🏦', 'success');
  }
  // Auto-log balance history snapshot with the user-supplied date
  STATE.bankBalanceHistory = STATE.bankBalanceHistory || [];
  STATE.bankBalanceHistory.push({
    accountId: account.id,
    balance,
    date: balDate,
    note: editIndex !== null && editIndex >= 0 ? 'Balance updated' : 'Account added'
  });
  saveState();
  closeModal();
  renderFinance();
}

function deleteBankAccount(i) {
  STATE.bankAccounts = (STATE.bankAccounts||[]).filter((_,idx)=>idx!==i);
  saveState();
  toast('Bank account removed', 'info');
  renderFinance();
}

function updateBankBalance(i) {
  const b = (STATE.bankAccounts||[])[i];
  if (!b) return;
  // Use the rich modal from bank-tracker (date shortcuts, chat history, etc.)
  openQuickBalanceModal(b.id);
}

function saveBalanceUpdate(i) {
  const newBal = parseFloat(document.getElementById('upd-balance')?.value);
  const note   = document.getElementById('upd-note')?.value.trim() || 'Manual update';
  const date   = document.getElementById('upd-date')?.value || today();
  if (isNaN(newBal) || newBal < 0) { toast('Enter a valid balance', 'error'); return; }

  const b = (STATE.bankAccounts||[])[i];
  if (!b) return;
  const oldBal = b.balance;
  b.balance = newBal;

  // Log history
  STATE.bankBalanceHistory = STATE.bankBalanceHistory || [];
  STATE.bankBalanceHistory.push({ accountId: b.id, balance: newBal, prevBalance: oldBal, date, note });

  saveState();
  closeModal();
  toast(`${b.bankName} balance updated to ${fmt(newBal)} ✅`, 'success');
  renderFinance();
}

// ===== SMS PARSER (multi-SMS) =====

let _smsResults = []; // parsed results for current modal session

function openSmsParser() {
  _smsResults = [];
  openModal('📲 Scan Bank SMS', `
    <div style="padding:10px 14px;border-radius:10px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);margin-bottom:14px;font-size:12px;color:var(--text2);line-height:1.6">
      Paste one or multiple bank SMS messages below.<br>
      <strong>Separate multiple SMS with a blank line.</strong> Works with HDFC, SBI, ICICI, Axis, Kotak, UPI and most Indian banks.
    </div>

    <div class="form-group" style="margin-bottom:12px">
      <label class="form-label">Paste SMS messages</label>
      <textarea id="sms-raw" class="form-input" rows="5"
        placeholder="Paste one SMS — or paste many, separated by a blank line between each message..."
        style="font-size:12px;line-height:1.6;resize:vertical"></textarea>
    </div>

    <div id="sms-status" style="display:none;font-size:12px;font-weight:600;margin-bottom:12px;padding:8px 12px;border-radius:8px"></div>

    <div class="modal-actions" style="margin-bottom:14px">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="parseAllSmsBlocks()" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">🔍 Parse All</button>
    </div>

    <!-- Results appear here after parsing -->
    <div id="sms-results-wrap" style="display:none">
      <div style="height:1px;background:var(--glass-border);margin-bottom:14px"></div>
      <p style="font-size:11px;font-weight:700;color:#00c9a7;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">✅ Detected transactions — edit if needed</p>
      <div id="sms-results-list" style="max-height:45vh;overflow-y:auto;padding-right:2px"></div>
      <div id="sms-summary" style="margin:12px 0;padding:10px 14px;border-radius:10px;background:rgba(0,201,167,0.08);border:1px solid rgba(0,201,167,0.2);font-size:13px;font-weight:600"></div>
      <button class="btn-primary" onclick="saveAllParsedSms()" style="width:100%;background:linear-gradient(135deg,#00c9a7,#0acf83);padding:12px">💾 Save All Transactions</button>
    </div>`);
}

function parseAllSmsBlocks() {
  const raw = document.getElementById('sms-raw')?.value?.trim();
  if (!raw) { toast('Paste at least one SMS first', 'error'); return; }

  // Split by one or more blank lines
  const blocks = raw.split(/\n[ \t]*\n+/).map(b => b.trim()).filter(b => b.length > 10);
  if (!blocks.length) {
    showSmsStatus('No SMS blocks found. Separate multiple SMS with a blank line between each.', 'warn');
    return;
  }

  _smsResults = [];
  let failed = 0;
  blocks.forEach((block, i) => {
    const parsed = parseBankSms(block);
    if (parsed) _smsResults.push({ ...parsed, _idx: i });
    else failed++;
  });

  if (!_smsResults.length) {
    showSmsStatus(`Could not parse any of the ${blocks.length} SMS block(s). Make sure they are bank transaction messages.`, 'warn');
    return;
  }

  renderSmsResults();

  const total = _smsResults.length + failed;
  if (failed > 0) showSmsStatus(`Parsed ${_smsResults.length} of ${total} messages. ${failed} could not be read.`, 'warn');
  else showSmsStatus(`✅ Parsed ${_smsResults.length} message${_smsResults.length > 1 ? 's' : ''} successfully`, 'ok');
}

function _makeSrCatOptions(selectedCat) {
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  return allCats.map(c => `<option value="${c.name}" ${c.name === selectedCat ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('');
}

function renderSmsResults() {
  const list = document.getElementById('sms-results-list');
  const wrap = document.getElementById('sms-results-wrap');
  if (!list || !wrap) return;

  list.innerHTML = _smsResults.map((r, i) => `
    <div id="sms-card-${i}" style="background:var(--card-bg);border:1px solid var(--glass-border);border-radius:12px;padding:12px;margin-bottom:10px;position:relative">
      <button onclick="removeSmsResult(${i})" title="Remove" style="position:absolute;top:8px;right:10px;background:rgba(239,68,68,0.12);border:none;color:#ef4444;border-radius:6px;cursor:pointer;padding:2px 9px;font-size:13px;line-height:1.6">✕</button>

      <div style="display:grid;grid-template-columns:auto 1fr 1fr;gap:8px;margin-bottom:8px;padding-right:36px">
        <select class="form-input" id="sr-type-${i}" onchange="updateSmsSummary()" style="font-size:12px;padding:4px 8px">
          <option value="expense" ${r.type === 'expense' ? 'selected' : ''}>❤️ Expense</option>
          <option value="income"  ${r.type === 'income'  ? 'selected' : ''}>💚 Income</option>
        </select>
        <input type="number" class="form-input" id="sr-amount-${i}" value="${r.amount}" step="0.01" min="0"
          oninput="updateSmsSummary()" style="font-size:13px;font-weight:700;padding:4px 8px"/>
        <input type="date" class="form-input" id="sr-date-${i}" value="${r.date}" style="font-size:12px;padding:4px 8px"/>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <select class="form-input" id="sr-cat-${i}" style="font-size:12px;padding:4px 8px">
          ${_makeSrCatOptions(r.category)}
        </select>
        <input type="text" class="form-input" id="sr-desc-${i}" value="${r.description}" placeholder="Description" style="font-size:12px;padding:4px 8px"/>
      </div>

      ${r.balance !== null ? `<div style="font-size:11px;color:var(--text3);margin-top:6px">💰 Bal after: ₹${r.balance.toLocaleString('en-IN', {minimumFractionDigits:2})}</div>` : ''}
    </div>
  `).join('');

  wrap.style.display = '';
  updateSmsSummary();
}

function removeSmsResult(i) {
  const card = document.getElementById(`sms-card-${i}`);
  if (card) card.style.display = 'none';
  updateSmsSummary();
}

function updateSmsSummary() {
  let totalExpense = 0, totalIncome = 0, count = 0;
  _smsResults.forEach((r, i) => {
    const card = document.getElementById(`sms-card-${i}`);
    if (!card || card.style.display === 'none') return;
    const type   = document.getElementById(`sr-type-${i}`)?.value;
    const amount = parseFloat(document.getElementById(`sr-amount-${i}`)?.value) || 0;
    if (type === 'expense') totalExpense += amount;
    else totalIncome += amount;
    count++;
  });

  const el = document.getElementById('sms-summary');
  if (!el) return;
  if (!count) { el.innerHTML = '<span style="color:var(--text3)">No transactions selected</span>'; return; }

  const parts = [];
  if (totalExpense > 0) parts.push(`<span style="color:#ef4444">💸 Total Expense: ₹${totalExpense.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>`);
  if (totalIncome  > 0) parts.push(`<span style="color:#10b981">💰 Total Income: ₹${totalIncome.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>`);
  el.innerHTML = `${parts.join(' &nbsp;·&nbsp; ')} &nbsp;·&nbsp; <span style="color:var(--text2)">${count} transaction${count>1?'s':''}</span>`;
}

function showSmsStatus(msg, type) {
  const el = document.getElementById('sms-status');
  if (!el) return;
  el.style.display    = '';
  el.textContent      = msg;
  el.style.background = type === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)';
  el.style.color      = type === 'ok' ? '#10b981'               : '#f59e0b';
}

function saveAllParsedSms() {
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const toSave  = [];

  _smsResults.forEach((r, i) => {
    const card = document.getElementById(`sms-card-${i}`);
    if (!card || card.style.display === 'none') return;

    const type     = document.getElementById(`sr-type-${i}`)?.value;
    const amount   = parseFloat(document.getElementById(`sr-amount-${i}`)?.value);
    const date     = document.getElementById(`sr-date-${i}`)?.value || today();
    const category = document.getElementById(`sr-cat-${i}`)?.value;
    const desc     = document.getElementById(`sr-desc-${i}`)?.value?.trim() || '';

    if (!amount || amount <= 0) return;
    const icon = allCats.find(c => c.name === category)?.icon || '💳';
    toSave.push({ id: genId(), type, amount, date, category, icon, description: desc, createdAt: new Date().toISOString() });
  });

  if (!toSave.length) { toast('No valid transactions to save', 'error'); return; }

  STATE.transactions = STATE.transactions || [];
  // Prepend newest-first (reverse so the first SMS in the list ends up first in array)
  [...toSave].reverse().forEach(tx => STATE.transactions.unshift(tx));
  saveState();

  if (typeof addXP === 'function') addXP(10 * toSave.length, `${toSave.length} SMS transaction${toSave.length>1?'s':''} logged`);
  if (typeof autoSyncGoals === 'function') autoSyncGoals();

  closeModal();
  const expTotal = toSave.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const incTotal = toSave.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  let summary = `${toSave.length} transaction${toSave.length>1?'s':''} saved!`;
  if (expTotal > 0) summary += ` Expense: ₹${expTotal.toLocaleString('en-IN',{minimumFractionDigits:2})}`;
  if (incTotal > 0) summary += ` Income: ₹${incTotal.toLocaleString('en-IN',{minimumFractionDigits:2})}`;
  toast(summary + ' 🎉', 'success');
  renderFinance();
}

// ── Core SMS parsing engine ────────────────────────────────────────────────
function parseBankSms(sms) {
  const lo = sms.toLowerCase();

  // Type
  // "credit card" is a card type, not a credit transaction — strip it before checking
  const loNoCc   = lo.replace(/credit\s+card/g, 'cc');
  const isCredit = /\b(credited|received|deposited|refund|cashback|salary|added|money received)\b/.test(loNoCc) ||
                   /\bcredit\b/.test(loNoCc);
  const isDebit  = /\b(debited|debit|spent|paid|withdrawn|charged|payment of|sent|purchase)\b/.test(lo);
  if (!isCredit && !isDebit) return null;
  // Debit always wins when both signals are present ("Credit Card XX debited")
  const type = isDebit ? 'expense' : 'income';

  // Amount — try several patterns in priority order
  let amount = null;
  const amtRe = [
    /(?:inr|rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,      // INR 1,234.56
    /([\d,]+(?:\.\d{1,2})?)\s*\/-/,                     // Rs.500/-
    /([\d,]+(?:\.\d{1,2})?)\s*(?:inr|rs\.?)/i,          // 1234 Rs
    /(?:of|for|amount[:\s]+)(?:inr|rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  ];
  for (const re of amtRe) {
    const m = sms.match(re);
    if (m) { amount = parseFloat(m[1].replace(/,/g, '')); if (amount > 0) break; }
  }
  if (!amount) return null;

  // Date
  let date = today();
  const dateRe = [
    {
      re: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
      fn: ([,d,mo,y]) => {
        const yr = y.length === 2 ? '20'+y : y;
        return `${yr}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;
      }
    },
    {
      re: /(\d{1,2})[\s\-]?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[\s\-]?(\d{2,4})/i,
      fn: ([,d,mo,y]) => {
        const MONTHS = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
        const yr = y.length === 2 ? '20'+y : y;
        return `${yr}-${MONTHS[mo.toLowerCase()]}-${d.padStart(2,'0')}`;
      }
    }
  ];
  for (const { re, fn } of dateRe) {
    const m = sms.match(re);
    if (m) { try { const d = fn(m); if (d) date = d; } catch {} break; }
  }

  // Merchant / description
  let description = '';
  const mercRe = [
    /(?:to vpa|at |merchant[:\s]+|towards |for )\s*([A-Za-z0-9@._\- ]{3,40}?)(?=[,.\s](?:avl|bal|ref|utr|on\s|\d{2}[\/\-]|$))/i,
    /info[:\s]+([A-Za-z0-9@._\- ]{3,40}?)(?:[,.\s]|$)/i,
    /upi[- ]([A-Za-z0-9@._\- ]{3,40}?)(?=[,.\s]|$)/i,
    /via ([A-Za-z0-9 ]{3,30}?)(?:\s+on\s|\s+ref|[,.]|$)/i,
  ];
  for (const re of mercRe) {
    const m = sms.match(re);
    if (m?.[1]?.trim().length > 2) {
      description = m[1].trim().replace(/@\S+/g, '').replace(/\s+/g,' ').trim();
      break;
    }
  }
  if (!description) description = type === 'income' ? 'Credit received' : 'Debit transaction';

  // Available balance
  let balance = null;
  const balM = sms.match(/(?:avl\.?|available|bal\.?|balance)[^₹\d]*([\d,]+(?:\.\d{1,2})?)/i);
  if (balM) balance = parseFloat(balM[1].replace(/,/g,''));

  const category = smsCategoryGuess(lo, description.toLowerCase(), type);
  return { type, amount, date, description, category, balance };
}

function smsCategoryGuess(lo, desc, type) {
  const t = lo + ' ' + desc;
  if (type === 'income') {
    if (/salary|payroll|paycheck/.test(t))   return 'Salary';
    if (/freelance|invoice/.test(t))          return 'Freelance';
    if (/refund|cashback|reversal/.test(t))   return 'Other';
    if (/interest|dividend/.test(t))          return 'Investment';
    return 'Business';
  }
  if (/swiggy|zomato|foodpanda|restaurant|eat|dunzo|blinkit|biryani|pizza|burger|cafe|coffee/.test(t)) return 'Food';
  if (/petrol|fuel|hpcl|iocl|bpcl|hp pump/.test(t))   return 'Fuel';
  if (/uber|ola|rapido|metro|irctc|train|bus|cab|flight|airline|makemytrip|goibibo/.test(t))           return 'Transport';
  if (/amazon|flipkart|myntra|meesho|ajio|nykaa|shopping|mall/.test(t))                               return 'Shopping';
  if (/bigbasket|dmart|jiomart|grocer|vegetable|zepto|milkbasket/.test(t))                            return 'Groceries';
  if (/emi|home loan|car loan|personal loan/.test(t))                                                 return 'EMI';
  if (/insurance|lic|term plan|health plan/.test(t))                                                  return 'Insurance';
  if (/electricity|broadband|internet|jio|airtel|bsnl|vodafone|recharge|utility|wifi/.test(t))        return 'Bills';
  if (/hospital|doctor|medicine|pharmacy|apollo|medplus|diagnostic/.test(t))                          return 'Health';
  if (/netflix|hotstar|spotify|prime video|youtube premium|subscription|ott/.test(t))                 return 'Entertainment';
  if (/school|college|course|udemy|fee|education/.test(t))                                            return 'Education';
  if (/hotel|resort|airbnb|holiday|trip|tour/.test(t))                                               return 'Travel';
  if (/rent|landlord|maintenance|society fee/.test(t))                                               return 'Rent';
  if (/mutual fund|sip|zerodha|groww|stock|share|demat/.test(t))                                     return 'Investment';
  if (/gift|present/.test(t))                                                                        return 'Gifts';
  return 'Other';
}

// ===== INVESTMENTS PAGE =====
// ===== ALL ASSETS + LOANS =====

const DEFAULT_ASSET_TYPES = [
  { key: 'Mutual Fund',   icon: '📈' },
  { key: 'Stocks',        icon: '📊' },
  { key: 'SIP',           icon: '🔄' },
  { key: 'Fixed Deposit', icon: '🏛️' },
  { key: 'Gold',          icon: '🥇' },
  { key: 'Crypto',        icon: '₿'  },
  { key: 'Real Estate',   icon: '🏠' },
  { key: 'PPF / EPF',     icon: '🏢' },
  { key: 'Insurance',     icon: '🛡️' },
  { key: 'Other',         icon: '🗃️' },
];

const DEFAULT_LOAN_TYPES = [
  { key: 'Home Loan',      icon: '🏠' },
  { key: 'Car Loan',       icon: '🚗' },
  { key: 'Personal Loan',  icon: '👤' },
  { key: 'Education Loan', icon: '🎓' },
  { key: 'Gold Loan',      icon: '🥇' },
  { key: 'Business Loan',  icon: '🏢' },
  { key: 'Credit Card',    icon: '💳' },
  { key: 'Other',          icon: '📋' },
];

function getAssetTypes() {
  const custom = STATE.customAssetTypes || [];
  return [...DEFAULT_ASSET_TYPES, ...custom];
}
function getLoanTypes() {
  const custom = STATE.customLoanTypes || [];
  return [...DEFAULT_LOAN_TYPES, ...custom];
}
function assetIcon(t) { return getAssetTypes().find(x => x.key === t)?.icon || '📊'; }
function loanIcon(t)  { return getLoanTypes().find(x => x.key === t)?.icon  || '📋'; }

let invFilter = 'All';

function renderInvestments() {
  const investments = STATE.investments || [];
  const loans       = STATE.loans || [];

  // ── Totals ───────────────────────────────────────────────────────────
  const totalInvested  = investments.reduce((s, i) => s + (i.amount || 0), 0);
  const totalCurrent   = investments.reduce((s, i) => s + (i.currentValue ?? i.amount ?? 0), 0);
  const totalPnL       = totalCurrent - totalInvested;
  const totalROI       = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : '0.00';
  const totalLoan      = loans.reduce((s, l) => s + (l.outstanding || 0), 0);
  const netWorth       = totalCurrent - totalLoan;

  // filter tabs include 'All' + asset types
  const allAssetTypes  = [{ key: 'All', icon: '🏦' }, ...getAssetTypes()];
  const filtered       = invFilter === 'All' ? investments : investments.filter(i => i.type === invFilter);

  // ── Row builder helpers ───────────────────────────────────────────────
  function moveBtn(dir, fn, id, list) {
    const idx = list.findIndex(x => x.id === id);
    const disabled = dir === 'up' ? idx === 0 : idx === list.length - 1;
    return `<button onclick="${fn}('${id}','${dir}')" style="background:none;border:none;color:${disabled?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.4)'};font-size:14px;cursor:${disabled?'default':'pointer'};padding:2px 4px;line-height:1;transition:.15s" ${disabled?'disabled':''}>${dir==='up'?'↑':'↓'}</button>`;
  }

  function invRow(inv, idx, list) {
    const curr = inv.currentValue ?? inv.amount;
    const pnl  = curr - inv.amount;
    const roi  = inv.amount > 0 ? ((pnl / inv.amount) * 100).toFixed(2) : '0.00';
    const pos  = pnl >= 0;
    return `<tr style="border-bottom:1px solid rgba(255,255,255,0.04);transition:.15s" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background=''">
      <td style="padding:12px 16px;width:48px;text-align:center">
        <div style="display:flex;flex-direction:column;gap:0">${moveBtn('up','moveInv',inv.id,list)}${moveBtn('down','moveInv',inv.id,list)}</div>
      </td>
      <td style="padding:12px 16px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:38px;height:38px;border-radius:10px;background:rgba(99,102,241,0.15);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${assetIcon(inv.type)}</div>
          <div>
            <p style="font-weight:700;font-size:13px">${inv.name}</p>
            <p style="font-size:11px;color:var(--text3)">${inv.type}${inv.notes?' · '+inv.notes:''}</p>
          </div>
        </div>
      </td>
      <td style="padding:12px 16px;text-align:right;font-size:13px;color:var(--text2)">${fmt(inv.amount)}</td>
      <td style="padding:12px 16px;text-align:right;font-size:13px;font-weight:600;color:#00c9a7">${fmt(curr)}</td>
      <td style="padding:12px 16px;text-align:right;font-size:13px;font-weight:700;color:${pos?'#10b981':'#ef4444'}">${pos?'+':''}${fmt(pnl)}</td>
      <td style="padding:12px 16px;text-align:right;font-size:13px;font-weight:700;color:${pos?'#10b981':'#ef4444'}">${pos?'+':''}${roi}%</td>
      <td style="padding:12px 16px;text-align:center;white-space:nowrap">
        <button class="btn-icon btn-sm" onclick="openEditInvModal('${inv.id}')" style="font-size:12px;margin-right:4px" title="Edit">✏️</button>
        <button class="btn-icon btn-sm" onclick="deleteInv('${inv.id}')" style="color:#ef4444;border-color:rgba(239,68,68,0.3);font-size:12px" title="Delete">✕</button>
      </td>
    </tr>`;
  }

  function loanRow(loan, idx, list) {
    const paid = (loan.principal || 0) - (loan.outstanding || 0);
    const pct  = loan.principal > 0 ? Math.min(100, Math.round((paid / loan.principal) * 100)) : 0;
    const monthlyInt = loan.outstanding > 0 && loan.interestRate > 0
      ? Math.round(loan.outstanding * (loan.interestRate / 100) / 12) : 0;
    return `<tr style="border-bottom:1px solid rgba(255,255,255,0.04);transition:.15s" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background=''">
      <td style="padding:12px 16px;width:48px;text-align:center">
        <div style="display:flex;flex-direction:column;gap:0">${moveBtn('up','moveLoan',loan.id,list)}${moveBtn('down','moveLoan',loan.id,list)}</div>
      </td>
      <td style="padding:12px 16px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:38px;height:38px;border-radius:10px;background:rgba(239,68,68,0.12);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${loanIcon(loan.type)}</div>
          <div>
            <p style="font-weight:700;font-size:13px">${loan.name}</p>
            <p style="font-size:11px;color:var(--text3)">${loan.type}${loan.lender?' · '+loan.lender:''}${loan.interestRate?' · '+loan.interestRate+'%':''}</p>
          </div>
        </div>
      </td>
      <td style="padding:12px 16px;text-align:right;font-size:13px;color:var(--text2)">${fmt(loan.principal||0)}</td>
      <td style="padding:12px 16px;text-align:right;font-size:13px;font-weight:700;color:#ef4444">${fmt(loan.outstanding||0)}</td>
      <td style="padding:12px 16px;text-align:right;font-size:13px;color:var(--text2)">${fmt(loan.emi||0)}<br><span style="font-size:10px;color:var(--text3)">EMI/mo</span></td>
      <td style="padding:12px 16px">
        <div style="min-width:80px">
          <div style="height:4px;border-radius:3px;background:rgba(255,255,255,0.1);margin-bottom:3px">
            <div style="height:4px;border-radius:3px;width:${pct}%;background:linear-gradient(90deg,#10b981,#00c9a7)"></div>
          </div>
          <span style="font-size:10px;color:var(--text3)">${pct}% paid</span>
        </div>
      </td>
      <td style="padding:12px 16px;text-align:center;white-space:nowrap">
        <button class="btn-icon btn-sm" onclick="openEditLoanModal('${loan.id}')" style="font-size:12px;margin-right:4px" title="Edit">✏️</button>
        <button class="btn-icon btn-sm" onclick="deleteLoan('${loan.id}')" style="color:#ef4444;border-color:rgba(239,68,68,0.3);font-size:12px" title="Delete">✕</button>
      </td>
    </tr>`;
  }

  // ── Render ────────────────────────────────────────────────────────────
  document.getElementById('page-container').innerHTML = `
    <div class="fade-in" style="max-width:1000px;margin:0 auto">

      <!-- Header -->
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px">
        <div><h1 class="page-title">📊 All Assets</h1><p class="page-subtitle">Investments, loans & net worth</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-secondary btn-sm" onclick="openManageTypesModal('asset')">⚙️ Asset Types</button>
          <button class="btn-secondary btn-sm" onclick="openManageTypesModal('loan')">⚙️ Loan Types</button>
          <button class="btn-primary btn-sm" onclick="openAddLoanModal()" style="background:linear-gradient(135deg,#ef4444,#dc2626)">+ Add Loan</button>
          <button class="btn-primary btn-sm" onclick="openAddInvModal()">+ Add Asset</button>
        </div>
      </div>

      <!-- Net Worth Hero -->
      <div style="position:relative;overflow:hidden;border-radius:24px;background:linear-gradient(135deg,#1a1a4e,#0d0d2e);border:1px solid rgba(99,102,241,0.25);padding:28px;margin-bottom:20px;box-shadow:0 20px 60px rgba(0,0,0,0.4)">
        <div style="position:absolute;top:-50px;right:-50px;width:180px;height:180px;border-radius:50%;background:rgba(99,102,241,0.08)"></div>
        <div style="position:relative;display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:20px;flex-wrap:wrap" class="nw-grid">
          <div>
            <p style="font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:6px">NET WORTH 🏆</p>
            <p style="font-size:36px;font-weight:900;color:${netWorth>=0?'#00c9a7':'#ef4444'};letter-spacing:-1.5px">${fmt(netWorth)}</p>
          </div>
          <div>
            <p style="font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:6px">ASSETS 💹</p>
            <p style="font-size:24px;font-weight:900;color:#10b981">${fmt(totalCurrent)}</p>
            <p style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px">Invested ${fmt(totalInvested)}</p>
          </div>
          <div>
            <p style="font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:6px">LIABILITIES 💸</p>
            <p style="font-size:24px;font-weight:900;color:#ef4444">${fmt(totalLoan)}</p>
            <p style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px">${loans.length} active loan${loans.length!==1?'s':''}</p>
          </div>
          <div>
            <p style="font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:6px">P&L 🚀</p>
            <p style="font-size:24px;font-weight:900;color:${totalPnL>=0?'#10b981':'#ef4444'}">${totalPnL>=0?'+':''}${fmt(totalPnL)}</p>
            <p style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px">ROI ${totalROI}%</p>
          </div>
        </div>
      </div>

      <!-- ── INVESTMENTS ─────────────────────────────────────────── -->
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">
        <p style="font-size:16px;font-weight:800">💹 Investments & Assets</p>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${allAssetTypes.map(t => `
            <button onclick="invFilter='${t.key}';renderInvestments()" style="padding:5px 12px;border-radius:16px;border:1px solid ${invFilter===t.key?'rgba(0,201,167,0.5)':'rgba(255,255,255,0.1)'};background:${invFilter===t.key?'rgba(0,201,167,0.15)':'transparent'};color:${invFilter===t.key?'#00c9a7':'var(--text2)'};font-size:11px;font-weight:${invFilter===t.key?700:400};cursor:pointer;transition:.15s">${t.icon} ${t.key}</button>`).join('')}
        </div>
      </div>

      <div class="glass-card" style="overflow:hidden;margin-bottom:20px">
        ${filtered.length === 0
          ? `<div class="empty-state"><span class="empty-state-icon">📈</span><p>${investments.length===0?'No assets yet. Add your first!':'Nothing in this category.'}</p></div>`
          : `<div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;min-width:700px">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.08)">
                  <th style="width:48px"></th>
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">Asset</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">Invested</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">Current</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">P&amp;L</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">ROI</th>
                  <th style="width:80px"></th>
                </tr>
              </thead>
              <tbody>${filtered.map((inv,i) => invRow(inv,i,filtered)).join('')}</tbody>
            </table>
          </div>`}
      </div>

      <!-- ── LOANS ───────────────────────────────────────────────── -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <p style="font-size:16px;font-weight:800">💸 Loans & Liabilities</p>
        <span style="font-size:12px;color:var(--text3)">${loans.length} loan${loans.length!==1?'s':''} · Total outstanding ${fmt(totalLoan)}</span>
      </div>

      <div class="glass-card" style="overflow:hidden;margin-bottom:20px">
        ${loans.length === 0
          ? `<div class="empty-state"><span class="empty-state-icon">🏦</span><p>No loans tracked. Add one to monitor your liabilities.</p></div>`
          : `<div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;min-width:720px">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.08)">
                  <th style="width:48px"></th>
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">Loan</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">Principal</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">Outstanding</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">EMI</th>
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">Progress</th>
                  <th style="width:80px"></th>
                </tr>
              </thead>
              <tbody>${loans.map((loan,i) => loanRow(loan,i,loans)).join('')}</tbody>
            </table>
          </div>`}
      </div>

    </div>`;

  // Responsive net worth grid
  setTimeout(() => {
    const g = document.querySelector('.nw-grid');
    if (g && window.innerWidth < 600) g.style.gridTemplateColumns = '1fr 1fr';
  }, 40);
}

// ── Move helpers ────────────────────────────────────────────────────────────
function moveInv(id, dir) {
  const arr = STATE.investments || [];
  const i = arr.findIndex(x => x.id === id);
  const j = dir === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  STATE.investments = arr;
  saveState(); renderInvestments();
}
function moveLoan(id, dir) {
  const arr = STATE.loans || [];
  const i = arr.findIndex(x => x.id === id);
  const j = dir === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  STATE.loans = arr;
  saveState(); renderInvestments();
}

// ── Asset CRUD ───────────────────────────────────────────────────────────────
function _invTypeOptions(sel) {
  return getAssetTypes().map(t => `<option value="${t.key}" ${t.key===sel?'selected':''}>${t.icon} ${t.key}</option>`).join('');
}

function openAddInvModal() {
  openModal('➕ Add Asset', `
    <div class="form-group"><label class="form-label">Name</label><input type="text" id="inv-name" class="form-input" placeholder="e.g. Infosys shares, Axis FD, Gold 10g"/></div>
    <div class="form-group"><label class="form-label">Asset Type</label>
      <select id="inv-type" class="form-input">${_invTypeOptions('')}</select></div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Invested Amount (₹)</label><input type="number" id="inv-amount" class="form-input" placeholder="0"/></div>
      <div class="form-group"><label class="form-label">Current Value (₹)</label><input type="number" id="inv-current" class="form-input" placeholder="Leave blank = invested amount"/></div>
    </div>
    <div class="form-group"><label class="form-label">Notes (optional)</label><input type="text" id="inv-notes" class="form-input" placeholder="e.g. 13 pavun, pledged, maturity date…"/></div>
    <div class="form-group"><label class="form-label">Start Date</label><input type="date" id="inv-date" class="form-input" value="${today()}"/></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveInv()">Save Asset</button>
    </div>`);
}

function saveInv() {
  const name    = document.getElementById('inv-name').value.trim();
  const type    = document.getElementById('inv-type').value;
  const amount  = parseFloat(document.getElementById('inv-amount').value);
  const current = parseFloat(document.getElementById('inv-current').value) || amount;
  const notes   = document.getElementById('inv-notes').value.trim();
  const date    = document.getElementById('inv-date').value;
  if (!name || !amount) { toast('Enter name and amount', 'error'); return; }
  STATE.investments = STATE.investments || [];
  STATE.investments.push({ id: genId(), name, type, amount, currentValue: current, notes, date: date || today() });
  saveState(); addXP(25, 'Asset added'); closeModal();
  toast('Asset tracked! +25 XP', 'success'); renderInvestments();
}

function openEditInvModal(id) {
  const inv = (STATE.investments || []).find(i => i.id === id);
  if (!inv) return;
  openModal('✏️ Edit Asset', `
    <div class="form-group"><label class="form-label">Name</label><input type="text" id="einv-name" class="form-input" value="${inv.name}"/></div>
    <div class="form-group"><label class="form-label">Asset Type</label>
      <select id="einv-type" class="form-input">${_invTypeOptions(inv.type)}</select></div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Invested Amount (₹)</label><input type="number" id="einv-amount" class="form-input" value="${inv.amount}"/></div>
      <div class="form-group"><label class="form-label">Current Value (₹)</label><input type="number" id="einv-current" class="form-input" value="${inv.currentValue ?? inv.amount}"/></div>
    </div>
    <div class="form-group"><label class="form-label">Notes</label><input type="text" id="einv-notes" class="form-input" value="${inv.notes||''}"/></div>
    <div class="form-group"><label class="form-label">Date</label><input type="date" id="einv-date" class="form-input" value="${inv.date||today()}"/></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveEditInv('${id}')">💾 Save Changes</button>
    </div>`);
}

function saveEditInv(id) {
  const inv = (STATE.investments || []).find(i => i.id === id);
  if (!inv) return;
  const name = document.getElementById('einv-name').value.trim();
  const amount = parseFloat(document.getElementById('einv-amount').value);
  if (!name || !amount) { toast('Enter name and amount', 'error'); return; }
  inv.name         = name;
  inv.type         = document.getElementById('einv-type').value;
  inv.amount       = amount;
  inv.currentValue = parseFloat(document.getElementById('einv-current').value) || amount;
  inv.notes        = document.getElementById('einv-notes').value.trim();
  inv.date         = document.getElementById('einv-date').value || today();
  saveState(); closeModal(); toast('Asset updated ✅', 'success'); renderInvestments();
}

function deleteInv(id) {
  STATE.investments = (STATE.investments || []).filter(i => i.id !== id);
  saveState(); toast('Asset deleted', 'info'); renderInvestments();
}

// ── Loan CRUD ────────────────────────────────────────────────────────────────
function _loanTypeOptions(sel) {
  return getLoanTypes().map(t => `<option value="${t.key}" ${t.key===sel?'selected':''}>${t.icon} ${t.key}</option>`).join('');
}

function _loanFormHTML(l) {
  // l = existing loan object for edit, or null for add
  const v = (id, def='') => l ? (l[id] ?? def) : def;
  return `
    <div class="form-group"><label class="form-label">Loan Name</label>
      <input type="text" id="ln-name" class="form-input" value="${v('name')}" placeholder="e.g. SBI Home Loan, HDFC Car Loan"/></div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Loan Type</label>
        <select id="ln-type" class="form-input">${_loanTypeOptions(v('type'))}</select></div>
      <div class="form-group"><label class="form-label">Lender</label>
        <input type="text" id="ln-lender" class="form-input" value="${v('lender')}" placeholder="e.g. SBI, HDFC, Bajaj…"/></div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Principal Amount (₹)</label>
        <input type="number" id="ln-principal" class="form-input" value="${v('principal')}" placeholder="Original loan amount"/></div>
      <div class="form-group"><label class="form-label">Outstanding (₹)</label>
        <input type="number" id="ln-outstanding" class="form-input" value="${v('outstanding')}" placeholder="Remaining balance"/></div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">EMI / Month (₹)</label>
        <input type="number" id="ln-emi" class="form-input" value="${v('emi')}" placeholder="Monthly EMI"/></div>
      <div class="form-group"><label class="form-label">Interest Rate (%)</label>
        <input type="number" id="ln-rate" class="form-input" value="${v('interestRate')}" placeholder="e.g. 8.5" step="0.01"/></div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">EMI Date (day of month)</label>
        <input type="number" id="ln-emidate" class="form-input" value="${v('emiDate')}" placeholder="e.g. 5" min="1" max="31"/></div>
      <div class="form-group"><label class="form-label">Tenure (months)</label>
        <input type="number" id="ln-tenure" class="form-input" value="${v('tenure')}" placeholder="e.g. 240"/></div>
    </div>
    <div class="form-group"><label class="form-label">Start Date</label>
      <input type="date" id="ln-date" class="form-input" value="${v('startDate', today())}"/></div>
    <div class="form-group"><label class="form-label">Notes (optional)</label>
      <input type="text" id="ln-notes" class="form-input" value="${v('notes')}" placeholder="e.g. property address, co-applicant…"/></div>`;
}

function _loanFormValues() {
  return {
    name:        document.getElementById('ln-name').value.trim(),
    type:        document.getElementById('ln-type').value,
    lender:      document.getElementById('ln-lender').value.trim(),
    principal:   parseFloat(document.getElementById('ln-principal').value) || 0,
    outstanding: parseFloat(document.getElementById('ln-outstanding').value) || 0,
    emi:         parseFloat(document.getElementById('ln-emi').value) || 0,
    interestRate:parseFloat(document.getElementById('ln-rate').value) || 0,
    emiDate:     parseInt(document.getElementById('ln-emidate').value) || 0,
    tenure:      parseInt(document.getElementById('ln-tenure').value) || 0,
    startDate:   document.getElementById('ln-date').value || today(),
    notes:       document.getElementById('ln-notes').value.trim(),
  };
}

function openAddLoanModal() {
  openModal('➕ Add Loan', `
    ${_loanFormHTML(null)}
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveLoan()" style="background:linear-gradient(135deg,#ef4444,#dc2626)">Save Loan</button>
    </div>`);
}

function saveLoan() {
  const v = _loanFormValues();
  if (!v.name) { toast('Enter a loan name', 'error'); return; }
  if (!v.principal && !v.outstanding) { toast('Enter principal or outstanding amount', 'error'); return; }
  if (!v.outstanding) v.outstanding = v.principal;
  STATE.loans = STATE.loans || [];
  STATE.loans.push({ id: genId(), ...v });
  saveState(); closeModal(); toast('Loan added ✅', 'success'); renderInvestments();
}

function openEditLoanModal(id) {
  const loan = (STATE.loans || []).find(l => l.id === id);
  if (!loan) return;
  openModal('✏️ Edit Loan', `
    ${_loanFormHTML(loan)}
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveEditLoan('${id}')" style="background:linear-gradient(135deg,#ef4444,#dc2626)">💾 Save Changes</button>
    </div>`);
}

function saveEditLoan(id) {
  const loan = (STATE.loans || []).find(l => l.id === id);
  if (!loan) return;
  const v = _loanFormValues();
  if (!v.name) { toast('Enter a loan name', 'error'); return; }
  Object.assign(loan, v);
  saveState(); closeModal(); toast('Loan updated ✅', 'success'); renderInvestments();
}

function deleteLoan(id) {
  STATE.loans = (STATE.loans || []).filter(l => l.id !== id);
  saveState(); toast('Loan deleted', 'info'); renderInvestments();
}

// ── Custom Type Manager ─────────────────────────────────────────────────────
function openManageTypesModal(kind) {
  const isAsset = kind === 'asset';
  const stateKey = isAsset ? 'customAssetTypes' : 'customLoanTypes';
  const customs  = STATE[stateKey] || [];
  const defaults = isAsset ? DEFAULT_ASSET_TYPES : DEFAULT_LOAN_TYPES;
  const title    = isAsset ? '⚙️ Asset Types' : '⚙️ Loan Types';

  const renderList = () => {
    const customs = STATE[stateKey] || [];
    const el = document.getElementById('ctype-list');
    if (!el) return;
    el.innerHTML = customs.length === 0
      ? `<p style="font-size:12px;color:var(--text3);text-align:center;padding:12px">No custom types yet</p>`
      : customs.map((t, i) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:8px;background:rgba(255,255,255,0.05);margin-bottom:6px">
          <span style="font-size:14px">${t.icon} <span style="font-size:13px;font-weight:600;margin-left:6px">${t.key}</span></span>
          <button onclick="removeCustomType('${kind}',${i})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px;padding:2px 6px">✕</button>
        </div>`).join('');
  };

  openModal(title, `
    <p style="font-size:12px;color:var(--text3);margin-bottom:14px">Default types cannot be removed. Add your own below.</p>

    <div style="margin-bottom:14px">
      <p style="font-size:11px;font-weight:700;color:var(--text3);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Built-in</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${defaults.map(t=>`<span style="padding:4px 10px;border-radius:16px;background:rgba(255,255,255,0.06);font-size:12px">${t.icon} ${t.key}</span>`).join('')}
      </div>
    </div>

    <div style="margin-bottom:14px">
      <p style="font-size:11px;font-weight:700;color:var(--text3);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Custom</p>
      <div id="ctype-list"></div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:6px">
      <input type="text" id="ctype-icon" class="form-input" placeholder="Emoji" style="width:70px;text-align:center;font-size:18px"/>
      <input type="text" id="ctype-name" class="form-input" placeholder="Type name (e.g. NPS, Chit Fund…)" style="flex:1"/>
      <button class="btn-primary btn-sm" onclick="addCustomType('${kind}')">+ Add</button>
    </div>

    <div class="modal-actions" style="margin-top:14px">
      <button class="btn-primary" onclick="closeModal()">Done</button>
    </div>`);

  renderList();
  // expose renderList so addCustomType/removeCustomType can refresh the list
  window._ctypeRenderList = renderList;
  window._ctypeStateKey   = stateKey;
}

function addCustomType(kind) {
  const icon = document.getElementById('ctype-icon')?.value.trim() || '📌';
  const name = document.getElementById('ctype-name')?.value.trim();
  if (!name) { toast('Enter a type name', 'error'); return; }
  const stateKey = kind === 'asset' ? 'customAssetTypes' : 'customLoanTypes';
  STATE[stateKey] = STATE[stateKey] || [];
  if (STATE[stateKey].find(t => t.key === name)) { toast('Type already exists', 'warning'); return; }
  STATE[stateKey].push({ key: name, icon });
  saveState();
  document.getElementById('ctype-icon').value = '';
  document.getElementById('ctype-name').value = '';
  if (window._ctypeRenderList) window._ctypeRenderList();
  toast(`"${name}" added`, 'success');
}

function removeCustomType(kind, idx) {
  const stateKey = kind === 'asset' ? 'customAssetTypes' : 'customLoanTypes';
  STATE[stateKey] = (STATE[stateKey] || []).filter((_, i) => i !== idx);
  saveState();
  if (window._ctypeRenderList) window._ctypeRenderList();
}


// ===== BUDGET PAGE =====
function renderBudget() {
  const budgets = STATE.budgets || [];
  const txns = STATE.transactions || [];
  const now = new Date();
  const monthTxns = txns.filter(t => { const d = new Date(t.date); return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear() && t.type==='expense'; });

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div><h1 class="page-title">🎯 Budget Planner</h1><p class="page-subtitle">Monthly budget vs actual spending</p></div>
        <button class="btn-primary btn-sm" onclick="openAddBudgetModal()">+ Add Budget</button>
      </div>
      ${budgets.length === 0
        ? `<div class="glass-card" style="padding:40px"><div class="empty-state"><span class="empty-state-icon">🎯</span><p>Set budgets for your expense categories to track spending.</p></div></div>`
        : `<div style="display:flex;flex-direction:column;gap:12px">
          ${budgets.map((b,bi) => {
            const spent = monthTxns.filter(t => t.category?.trim().toLowerCase() === b.category?.trim().toLowerCase()).reduce((s,t) => s+t.amount, 0);
            const pct = Math.min(100, b.limit > 0 ? (spent/b.limit)*100 : 0);
            const over = spent > b.limit;
            const cat = CATEGORIES.find(c => c.name === b.category);
            return `<div class="glass-card" style="padding:18px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <div style="display:flex;align-items:center;gap:8px"><span style="font-size:22px">${cat?.icon||'📦'}</span><span style="font-weight:600">${b.category}</span></div>
                <div style="display:flex;align-items:center;gap:10px">
                  <span style="font-size:13px;color:${over?'#ef4444':'#10b981'};font-weight:700">${fmt(spent)} / ${fmt(b.limit)}</span>
                  ${over ? '<span class="tag tag-red" style="font-size:11px">Over!</span>' : ''}
                  <button onclick="deleteBudget(${bi})" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#ef4444;border-radius:8px;padding:3px 8px;cursor:pointer;font-size:12px">✕</button>
                </div>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${over?'#ef4444':pct>80?'#f59e0b':'#10b981'}"></div></div>
              <p style="font-size:11px;color:var(--text3);margin-top:6px">${over ? `₹${(spent-b.limit).toLocaleString('en-IN')} over budget` : `₹${(b.limit-spent).toLocaleString('en-IN')} remaining · ${pct.toFixed(0)}% used`}</p>
            </div>`;
          }).join('')}
        </div>`}
    </div>`;
}

function deleteBudget(index) {
  STATE.budgets = (STATE.budgets||[]).filter((_,i) => i !== index);
  saveState();
  toast('Budget removed', 'info');
  renderBudget();
}

function openAddBudgetModal() {
  const catOptions = CATEGORIES.filter(c => !['Salary','Business','Freelance'].includes(c.name)).map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('');
  openModal('Set Budget', `
    <div class="form-group"><label class="form-label">Category</label><select id="b-cat" class="form-input">${catOptions}</select></div>
    <div class="form-group"><label class="form-label">Monthly Limit (₹)</label><input type="number" id="b-limit" class="form-input" placeholder="e.g. 5000"/></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveBudget()">Save Budget</button>
    </div>`);
}

function saveBudget() {
  const category = document.getElementById('b-cat').value;
  const limit = parseFloat(document.getElementById('b-limit').value);
  if (!limit || limit <= 0) { toast('Enter a valid limit', 'error'); return; }
  STATE.budgets = STATE.budgets || [];
  const existing = STATE.budgets.findIndex(b => b.category === category);
  if (existing >= 0) STATE.budgets[existing].limit = limit;
  else STATE.budgets.push({ id: genId(), category, limit });
  saveState(); closeModal(); toast('Budget set!', 'success'); renderBudget();
}

// ===== CREDIT CARDS =====
const CARD_PRESETS = [
  { label:'HDFC',         color:'#1a237e', color2:'#0d47a1', network:'VISA'       },
  { label:'SBI',          color:'#1b5e20', color2:'#0d3311', network:'RuPay'      },
  { label:'ICICI',        color:'#bf360c', color2:'#7f1b07', network:'VISA'       },
  { label:'Axis',         color:'#4a148c', color2:'#2d0066', network:'VISA'       },
  { label:'Kotak',        color:'#b71c1c', color2:'#7f1212', network:'Mastercard' },
  { label:'Yes Bank',     color:'#004d40', color2:'#00251a', network:'VISA'       },
  { label:'IndusInd',     color:'#e65100', color2:'#bf360c', network:'Mastercard' },
  { label:'AMEX',         color:'#006064', color2:'#00363a', network:'AmEx'       },
  { label:'Citi',         color:'#0d47a1', color2:'#072b6d', network:'Mastercard' },
  { label:'AU Bank',      color:'#33691e', color2:'#1b5e20', network:'VISA'       },
  { label:'Other',        color:'#263238', color2:'#102027', network:'VISA'       },
];

function addCreditCard() {
  const opts = CARD_PRESETS.map(p => `<option value="${p.label}">${p.label}</option>`).join('');
  openModal('Add Credit Card', `
    <div class="input-row">
      <div class="form-group"><label class="form-label">Bank / Card Name</label>
        <select id="cc-bank" class="form-input">${opts}<option value="custom">✏️ Custom</option></select></div>
      <div class="form-group"><label class="form-label">Network</label>
        <select id="cc-network" class="form-input">
          <option>VISA</option><option>Mastercard</option><option>RuPay</option><option>AmEx</option>
        </select></div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Credit Limit (₹)</label>
        <input type="number" id="cc-limit" class="form-input" placeholder="e.g. 100000" min="0"/></div>
      <div class="form-group"><label class="form-label">Outstanding (₹)</label>
        <input type="number" id="cc-outstanding" class="form-input" placeholder="0" min="0"/></div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Last 4 Digits (optional)</label>
        <input type="text" id="cc-last4" class="form-input" maxlength="4" placeholder="XXXX"/></div>
      <div class="form-group"><label class="form-label">Due Date (optional)</label>
        <input type="date" id="cc-due" class="form-input"/></div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveCreditCard(null)">Save Card</button>
    </div>`);
}

function editCreditCard(i) {
  const c = (STATE.creditCards||[])[i];
  if (!c) return;
  const opts = CARD_PRESETS.map(p => `<option value="${p.label}" ${c.bankName===p.label?'selected':''}>${p.label}</option>`).join('');
  openModal('Edit Credit Card', `
    <div class="input-row">
      <div class="form-group"><label class="form-label">Bank / Card Name</label>
        <select id="cc-bank" class="form-input">${opts}<option value="custom" ${!CARD_PRESETS.find(p=>p.label===c.bankName)?'selected':''}>✏️ Custom</option></select></div>
      <div class="form-group"><label class="form-label">Network</label>
        <select id="cc-network" class="form-input">
          ${['VISA','Mastercard','RuPay','AmEx'].map(n=>`<option ${c.network===n?'selected':''}>${n}</option>`).join('')}
        </select></div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Credit Limit (₹)</label>
        <input type="number" id="cc-limit" class="form-input" value="${c.limit||0}" min="0"/></div>
      <div class="form-group"><label class="form-label">Outstanding (₹)</label>
        <input type="number" id="cc-outstanding" class="form-input" value="${c.outstanding||0}" min="0"/></div>
    </div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Last 4 Digits</label>
        <input type="text" id="cc-last4" class="form-input" maxlength="4" value="${c.lastFour||''}"/></div>
      <div class="form-group"><label class="form-label">Due Date</label>
        <input type="date" id="cc-due" class="form-input" value="${c.dueDate||''}"/></div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveCreditCard(${i})">Update Card</button>
    </div>`);
}

function saveCreditCard(editIndex) {
  const bankName    = document.getElementById('cc-bank')?.value || 'Other';
  const network     = document.getElementById('cc-network')?.value || 'VISA';
  const limit       = parseFloat(document.getElementById('cc-limit')?.value) || 0;
  const outstanding = parseFloat(document.getElementById('cc-outstanding')?.value) || 0;
  const lastFour    = document.getElementById('cc-last4')?.value.trim().slice(-4) || '';
  const dueDate     = document.getElementById('cc-due')?.value || '';

  const preset = CARD_PRESETS.find(p => p.label === bankName);
  const color  = preset?.color  || '#263238';
  const color2 = preset?.color2 || '#102027';

  const card = { id: genId(), bankName, network, limit, outstanding, lastFour, dueDate, color, color2 };
  STATE.creditCards = STATE.creditCards || [];

  if (editIndex !== null && editIndex >= 0) {
    card.id = STATE.creditCards[editIndex].id;
    STATE.creditCards[editIndex] = card;
    toast('Card updated! ✅', 'success');
  } else {
    STATE.creditCards.push(card);
    toast('Credit card added! 💳', 'success');
  }
  saveState(); closeModal(); renderFinance();
}

function deleteCreditCard(i) {
  STATE.creditCards = (STATE.creditCards||[]).filter((_,idx)=>idx!==i);
  saveState(); toast('Card removed', 'info'); renderFinance();
}
