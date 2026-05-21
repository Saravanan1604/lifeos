// ===== FINANCE PAGE =====
let _finPeriod = 'month'; // 'day' | 'week' | 'month' | 'year' | 'all'
let _finType     = 'all';        // 'all' | 'income' | 'expense'
let _finCategory = 'all';        // 'all' | <category name>
let _finSort     = 'date-desc';  // 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'alpha-asc' | 'alpha-desc'
let _finSelected = new Set();    // Selected transaction IDs (for bulk delete)

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
  const txnsAll = [...(STATE.transactions || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const txns    = filterTxByPeriod(txnsAll, _finPeriod);
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
        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            ${periodTabsHtml(_finPeriod, 'setFinPeriod')}
            <button class="btn-primary btn-sm" onclick="openAddTxModal()">+ Add Transaction</button>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn-secondary btn-sm" onclick="openCsvImport()" style="display:flex;align-items:center;gap:6px">📊 Import CSV</button>
          <button class="btn-secondary btn-sm" onclick="openBulkEntry()" style="display:flex;align-items:center;gap:6px">📅 Bulk Entry</button>
          <button class="btn-secondary btn-sm" onclick="openStatementPaste()" style="display:flex;align-items:center;gap:6px">📄 Paste Statement</button>
          <button class="btn-secondary btn-sm" onclick="openSmsParser()" style="display:flex;align-items:center;gap:6px">📲 Scan SMS</button>
          <button class="btn-secondary btn-sm" onclick="openPdfImport()" style="display:flex;align-items:center;gap:6px">📑 Import PDF</button>
          </div>
        </div>
      </div>

      <!-- Kaasu-style Hero Balance Card -->
      <div style="position:relative;overflow:hidden;border-radius:24px;background:linear-gradient(135deg,#00c9a7,#0acf83,#00b09b);padding:28px;margin-bottom:20px;box-shadow:0 20px 60px rgba(0,201,167,0.35)">
        <div style="position:absolute;top:-60px;right:-60px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,0.15)"></div>
        <div style="position:absolute;bottom:-40px;left:-40px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,0.08)"></div>
        <div style="position:relative">
          <p style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(0,60,50,0.75);margin-bottom:6px">💰 Total Balance</p>
          <p id="fin-balance" style="font-size:48px;font-weight:900;color:#001a14;letter-spacing:-2px;line-height:1">${fmt(savings)}</p>
          <div style="display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap">
            <span id="fin-rate" style="font-size:12px;font-weight:700;padding:5px 12px;border-radius:20px;background:rgba(255,255,255,0.4);color:${savingsOk?'#004d3a':'#7f0000'}">
              ${savingsOk?'📈':'📉'} ${savingsRate}% savings rate
            </span>
            <span style="font-size:12px;font-weight:600;color:rgba(0,50,40,0.8)">✨ ${userName}'s wallet</span>
          </div>
          <div style="display:flex;gap:32px;margin-top:20px;flex-wrap:wrap">
            <div>
              <p style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,60,50,0.7);margin-bottom:4px">💚 Income</p>
              <p id="fin-income" style="font-size:22px;font-weight:900;color:#003326">+${fmt(income)}</p>
            </div>
            <div>
              <p style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,60,50,0.7);margin-bottom:4px">❤️ Expenses</p>
              <p id="fin-expense" style="font-size:22px;font-weight:900;color:#7f0000">-${fmt(expense)}</p>
            </div>
            <div>
              <p style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,60,50,0.7);margin-bottom:4px">💜 Savings</p>
              <p id="fin-savings" style="font-size:22px;font-weight:900;color:${savingsOk?'#001a14':'#7f0000'}">${savingsOk?'+':''}${fmt(savings)}</p>
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
                  <button onclick="openUpdateCCModal('${c.id}')" style="background:rgba(0,201,167,0.25);border:none;color:#00ffd5;font-size:11px;padding:3px 8px;border-radius:6px;cursor:pointer">↑ Pay</button>
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
          { id:'fin-stat-count', label:'Total Txns',   value: txnsAll.length,  icon:'⚡', color:'rgba(99,102,241,0.15)', tc:'#6366f1' },
          { id:'fin-stat-month', label:periodLabel(_finPeriod), value: txns.length, icon:'🎯', color:'rgba(16,185,129,0.15)', tc:'#10b981' },
          { id:'fin-stat-rate',  label:'Savings Rate', value: savingsRate+'%', icon:'📈', color:'rgba(139,92,246,0.15)', tc:'#8b5cf6' },
        ].map(s=>`
          <div class="glass-card" style="padding:16px;text-align:center">
            <div style="display:inline-flex;padding:8px;border-radius:10px;background:${s.color};font-size:18px;margin-bottom:8px">${s.icon}</div>
            <p id="${s.id}" style="font-size:20px;font-weight:800;color:${s.tc}">${s.value}</p>
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

      <!-- Transactions with period filter -->
      <div class="glass-card" style="overflow:hidden;margin-bottom:20px">
        <div style="padding:12px 16px;border-bottom:1px solid var(--glass-border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <p class="section-title" style="margin:0">💳 Transactions</p>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${periodTabsHtml(_finPeriod, 'setFinPeriod')}
            <span id="fin-tx-count" style="font-size:11px;color:var(--text3)"></span>
          </div>
        </div>

        <!-- Type / Category / Sort filters -->
        <div style="padding:10px 16px;border-bottom:1px solid var(--glass-border);display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <select id="fin-type" onchange="_finType=this.value;renderFinanceTxList()"
            style="background:#1e293b;border:1px solid var(--glass-border);color:#f1f5f9;border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer;color-scheme:dark">
            <option value="all"     style="background:#1e293b;color:#f1f5f9">All types</option>
            <option value="income"  style="background:#1e293b;color:#f1f5f9">💚 Income only</option>
            <option value="expense" style="background:#1e293b;color:#f1f5f9">❤️ Expense only</option>
          </select>

          <select id="fin-cat" onchange="_finCategory=this.value;renderFinanceTxList()"
            style="background:#1e293b;border:1px solid var(--glass-border);color:#f1f5f9;border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer;color-scheme:dark">
            <option value="all" style="background:#1e293b;color:#f1f5f9">All categories</option>
            ${_finCategoryOptions()}
          </select>

          <select id="fin-sort" onchange="_finSort=this.value;renderFinanceTxList()"
            style="background:#1e293b;border:1px solid var(--glass-border);color:#f1f5f9;border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer;color-scheme:dark">
            <option value="date-desc"   style="background:#1e293b;color:#f1f5f9">📅 Newest first</option>
            <option value="date-asc"    style="background:#1e293b;color:#f1f5f9">📅 Oldest first</option>
            <option value="amount-desc" style="background:#1e293b;color:#f1f5f9">💰 Highest amount</option>
            <option value="amount-asc"  style="background:#1e293b;color:#f1f5f9">💰 Lowest amount</option>
            <option value="alpha-asc"   style="background:#1e293b;color:#f1f5f9">🔤 A → Z</option>
            <option value="alpha-desc"  style="background:#1e293b;color:#f1f5f9">🔤 Z → A</option>
          </select>

          <button onclick="_finType='all';_finCategory='all';_finSort='date-desc';renderFinance()"
            style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:#ef4444;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:11px;font-weight:700">Clear filters</button>
        </div>

        <!-- Bulk action bar (only visible when ≥1 row selected) -->
        <div id="fin-bulk-bar" style="display:none;position:sticky;top:0;z-index:50;padding:10px 16px;background:linear-gradient(135deg,rgba(0,201,167,0.15),rgba(99,102,241,0.15));border-bottom:1px solid rgba(0,201,167,0.3);backdrop-filter:blur(12px);align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;color:var(--text2)">
              <input type="checkbox" id="fin-select-all" onchange="toggleSelectAllTx(this.checked)" style="cursor:pointer;width:16px;height:16px;accent-color:#00c9a7"/>
              Select all visible
            </label>
            <span id="fin-bulk-count" style="font-size:12px;font-weight:700;color:#00c9a7"></span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button onclick="openBulkCategoryChange()" style="padding:6px 14px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer">🏷️ Change Category</button>
            <button onclick="openBulkTypeChange()" style="padding:6px 14px;border-radius:8px;background:linear-gradient(135deg,#f59e0b,#ef4444);border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer">🔄 Change Type</button>
            <button onclick="deleteSelectedTx()" style="padding:6px 14px;border-radius:8px;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.4);color:#ef4444;font-size:12px;font-weight:700;cursor:pointer">🗑️ Delete Selected</button>
            <button onclick="clearSelectedTx()" style="padding:6px 14px;border-radius:8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:var(--text2);font-size:12px;cursor:pointer">✕ Clear</button>
          </div>
        </div>

        <div id="fin-tx-list"></div>
      </div>

    </div>`;

  renderFinanceChart(txnsAll);
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


// ===== PARTIAL REFRESH — update hero + stats + list without full page re-render =====
function refreshFinancePage() {
  if (!document.getElementById('fin-tx-list')) { renderFinance(); return; }

  const txnsAll = [...(STATE.transactions || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const txns    = filterTxByPeriod(txnsAll, _finPeriod);
  const income  = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = income - expense;
  const savingsOk = savings >= 0;
  const rate    = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('fin-balance',    fmt(savings));
  set('fin-income',     '+' + fmt(income));
  set('fin-expense',    '-' + fmt(expense));
  set('fin-savings',    (savingsOk ? '+' : '') + fmt(savings));
  set('fin-rate',       `${savingsOk ? '📈' : '📉'} ${rate}% savings rate`);
  set('fin-stat-count', txnsAll.length);
  set('fin-stat-month', txns.length);
  set('fin-stat-rate',  rate + '%');

  const savEl = document.getElementById('fin-savings');
  if (savEl) savEl.style.color = savingsOk ? '#001a14' : '#7f0000';

  renderFinanceTxList();
}

// ===== TRANSACTION LIST — PERIOD FILTER =====

function setFinPeriod(p) {
  _finPeriod = p;
  document.querySelectorAll('.period-tabs .period-tab').forEach(b => b.classList.toggle('active', b.textContent.toLowerCase() === p));
  refreshFinancePage();
}

// Build <option>s for the category dropdown from every category the user
// has actually used, sorted alphabetically.
function _finCategoryOptions() {
  const cats = new Set();
  (STATE.transactions || []).forEach(t => { if (t.category) cats.add(t.category); });
  return [...cats].sort((a, b) => a.localeCompare(b))
    .map(c => `<option value="${c}" style="background:#1e293b;color:#f1f5f9">${c}</option>`).join('');
}

function renderFinanceTxList() {
  const container = document.getElementById('fin-tx-list');
  if (!container) return;

  let txns = filterTxByPeriod([...(STATE.transactions || [])], _finPeriod);
  // Type filter (income / expense)
  if (_finType !== 'all')     txns = txns.filter(t => t.type === _finType);
  // Category filter
  if (_finCategory !== 'all') txns = txns.filter(t => t.category === _finCategory);

  // Sorting
  const cmp = {
    'date-desc':   (a, b) => new Date(b.date) - new Date(a.date),
    'date-asc':    (a, b) => new Date(a.date) - new Date(b.date),
    'amount-desc': (a, b) => (b.amount || 0) - (a.amount || 0),
    'amount-asc':  (a, b) => (a.amount || 0) - (b.amount || 0),
    'alpha-asc':   (a, b) => (a.description || a.category || '').localeCompare(b.description || b.category || ''),
    'alpha-desc':  (a, b) => (b.description || b.category || '').localeCompare(a.description || a.category || ''),
  }[_finSort] || ((a, b) => new Date(b.date) - new Date(a.date));
  txns.sort(cmp);

  // Restore dropdown values (after a full re-render the selects reset to their defaults)
  const typeSel = document.getElementById('fin-type'); if (typeSel) typeSel.value = _finType;
  const catSel  = document.getElementById('fin-cat');  if (catSel)  catSel.value  = _finCategory;
  const sortSel = document.getElementById('fin-sort'); if (sortSel) sortSel.value = _finSort;

  const countEl = document.getElementById('fin-tx-count');
  if (countEl) countEl.textContent = `${txns.length} entr${txns.length === 1 ? 'y' : 'ies'}`;

  if (!txns.length) {
    container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">💳</span><p>No transactions${_finPeriod !== 'all' ? ' for ' + periodLabel(_finPeriod) : ' yet'}. Add your first one!</p></div>`;
    // remove bulk bar if empty
    const bb = document.getElementById('fin-bulk-bar'); if (bb) bb.style.display = 'none';
    return;
  }

  // Inject sticky bulk-action bar before the list container (once)
  let bulkBar = document.getElementById('fin-bulk-bar');
  if (!bulkBar) {
    container.insertAdjacentHTML('beforebegin',
      `<div id="fin-bulk-bar" style="display:none;position:sticky;top:0;z-index:50;padding:10px 16px;background:linear-gradient(135deg,rgba(0,201,167,0.18),rgba(99,102,241,0.18));border-bottom:1px solid rgba(0,201,167,0.3);backdrop-filter:blur(12px);align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px"><span id='bulk-count-label' style='font-size:13px;font-weight:700;color:#00c9a7'>0 selected</span><div style='display:flex;gap:8px;flex-wrap:wrap'><button onclick='openBulkCategoryChange()' style='padding:6px 14px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer'>🏷️ Change Category</button><button onclick='openBulkTypeChange()' style='padding:6px 14px;border-radius:8px;background:linear-gradient(135deg,#f59e0b,#ef4444);border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer'>🔄 Change Type</button><button onclick='deleteSelectedTx()' style='padding:6px 14px;border-radius:8px;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.4);color:#ef4444;font-size:12px;font-weight:700;cursor:pointer'>🗑️ Delete Selected</button><button onclick='clearTxSelection()' style='padding:6px 14px;border-radius:8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:var(--text2);font-size:12px;cursor:pointer'>✕ Clear</button></div></div>`);
    bulkBar = document.getElementById('fin-bulk-bar');
  } else {
    bulkBar.style.display = 'none';
  }

  // Select-all header + rows
  container.innerHTML =
    `<div id="fin-select-all-row" style="display:flex;align-items:center;gap:10px;padding:8px 16px;background:rgba(0,201,167,0.05);border-bottom:1px solid rgba(0,201,167,0.15)">
       <input type="checkbox" id="chk-select-all" onchange="toggleSelectAll(this.checked)"
         style="width:16px;height:16px;accent-color:#00c9a7;cursor:pointer"/>
       <span style="font-size:12px;color:var(--text3);user-select:none">Select All &nbsp;<span id="sel-count-label"></span></span>
     </div>` +
    txns.map(tx => `
    <div id="txrow-${tx.id}" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.04);transition:.2s"
         onmouseover="this.style.background='rgba(255,255,255,0.04)'" onmouseout="if(!document.getElementById('chk-${tx.id}')?.checked)this.style.background=''">
      <div style="display:flex;align-items:center;gap:12px">
        <input type="checkbox" id="chk-${tx.id}" data-txid="${tx.id}" class="fin-tx-chk"
          onchange="onTxCheckChange()"
          style="width:16px;height:16px;accent-color:#00c9a7;cursor:pointer;flex-shrink:0"/>
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

  _updateBulkBar();
}

// ===== BULK SELECT / DELETE =====
function _updateBulkBar() {
  // Sync the sticky bar visibility based on how many checkboxes are ticked
  const all  = document.querySelectorAll('.fin-tx-chk');
  const chkd = document.querySelectorAll('.fin-tx-chk:checked');
  const n    = chkd.length;
  const bar  = document.getElementById('fin-bulk-bar');
  if (bar) bar.style.display = n > 0 ? 'flex' : 'none';
}

// ===== BULK SELECTION HELPERS =====
function getSelectedTxIds() {
  return [...document.querySelectorAll('.fin-tx-chk:checked')].map(c => c.dataset.txid);
}

function onTxCheckChange() {
  const all  = document.querySelectorAll('.fin-tx-chk');
  const chkd = document.querySelectorAll('.fin-tx-chk:checked');
  const n    = chkd.length;
  const bar  = document.getElementById('fin-bulk-bar');

  // Static bar elements (id="fin-select-all", id="fin-bulk-count")
  const saStatic  = document.getElementById('fin-select-all');
  const cntStatic = document.getElementById('fin-bulk-count');
  // Dynamic bar elements (id="chk-select-all", id="sel-count-label", id="bulk-count-label")
  const saDyn  = document.getElementById('chk-select-all');
  const lbl    = document.getElementById('sel-count-label');
  const blbl   = document.getElementById('bulk-count-label');

  if (bar) bar.style.display = n > 0 ? 'flex' : 'none';

  // Update count labels
  const countText = n > 0 ? `${n} selected` : '';
  if (cntStatic) cntStatic.textContent = countText;
  if (blbl)      blbl.textContent      = countText;
  if (lbl)       lbl.textContent       = n > 0 ? `(${n} selected)` : '';

  // Update select-all checkboxes
  [saStatic, saDyn].forEach(el => {
    if (!el) return;
    el.indeterminate = n > 0 && n < all.length;
    if (n === all.length && n > 0) el.checked = true;
    if (n === 0) el.checked = false;
  });

  // Highlight selected rows
  document.querySelectorAll('.fin-tx-chk').forEach(c => {
    const row = document.getElementById('txrow-' + c.dataset.txid);
    if (row) row.style.background = c.checked ? 'rgba(0,201,167,0.08)' : '';
  });
}

function toggleSelectAll(checked) {
  document.querySelectorAll('.fin-tx-chk').forEach(c => { c.checked = checked; });
  onTxCheckChange();
}

// toggleSelectAllTx — called by the static bar's "Select all visible" checkbox
function toggleSelectAllTx(checked) {
  toggleSelectAll(checked);
}

function clearSelectedTx() {
  clearTxSelection();
}

function toggleSelectAll(checked) {
  document.querySelectorAll('.fin-tx-chk').forEach(c => { c.checked = checked; });
  onTxCheckChange();
}

function clearTxSelection() {
  toggleSelectAll(false);
}

function openBulkCategoryChange() {
  const ids = getSelectedTxIds();
  if (!ids.length) { toast('Select at least one transaction', 'error'); return; }
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const opts = allCats.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('');
  openModal(`🏷️ Change Category (${ids.length} transactions)`,
    `<div class="form-group"><label class="form-label">New Category</label>
     <select id="bulk-cat" class="form-input">${opts}</select></div>
     <div class="modal-actions">
       <button class="btn-secondary" onclick="closeModal()">Cancel</button>
       <button class="btn-primary" onclick='applyBulkCategory(${JSON.stringify(ids)})'>✅ Apply to All</button>
     </div>`);
}

function applyBulkCategory(ids) {
  const cat = document.getElementById('bulk-cat')?.value;
  if (!cat) return;
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const icon = allCats.find(c => c.name === cat)?.icon || '💳';
  STATE.transactions = (STATE.transactions || []).map(t =>
    ids.includes(t.id) ? { ...t, category: cat, icon } : t
  );
  saveState();
  closeModal();
  toast(`Category updated to "${cat}" for ${ids.length} transaction${ids.length > 1 ? 's' : ''} ✅`, 'success');
  renderFinanceTxList();
}

function openBulkTypeChange() {
  const ids = getSelectedTxIds();
  if (!ids.length) { toast('Select at least one transaction', 'error'); return; }
  openModal(`🔄 Change Type (${ids.length} transactions)`,
    `<div class="form-group"><label class="form-label">New Type</label>
     <select id="bulk-type" class="form-input">
       <option value="expense">❤️ Expense</option>
       <option value="income">💚 Income</option>
     </select></div>
     <div class="modal-actions">
       <button class="btn-secondary" onclick="closeModal()">Cancel</button>
       <button class="btn-primary" onclick='applyBulkType(${JSON.stringify(ids)})'>✅ Apply to All</button>
     </div>`);
}

function applyBulkType(ids) {
  const type = document.getElementById('bulk-type')?.value;
  if (!type) return;
  STATE.transactions = (STATE.transactions || []).map(t =>
    ids.includes(t.id) ? { ...t, type } : t
  );
  saveState();
  closeModal();
  toast(`Type changed to "${type}" for ${ids.length} transaction${ids.length > 1 ? 's' : ''} ✅`, 'success');
  renderFinanceTxList();
}

function deleteSelectedTx() {
  const ids = getSelectedTxIds();
  if (!ids.length) { toast('Select at least one transaction', 'error'); return; }
  if (!confirm(`Delete ${ids.length} selected transaction${ids.length > 1 ? 's' : ''}?`)) return;
  STATE.transactions = (STATE.transactions || []).filter(t => !ids.includes(t.id));
  saveState();
  if (typeof autoSyncGoals === 'function') autoSyncGoals();
  toast(`${ids.length} transaction${ids.length > 1 ? 's' : ''} deleted`, 'info');
  renderFinanceTxList();
  refreshFinancePage();
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
  refreshFinancePage();
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
    <div class="form-group" style="margin-top:-5px">
      <label style="font-size:12px;color:var(--text2);display:flex;align-items:center;gap:8px;cursor:pointer;">
        <input type="checkbox" id="etx-apply-all" checked style="accent-color:#00c9a7;width:14px;height:14px;" />
        Auto-update all transactions with this description
      </label>
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
  const applyAll = document.getElementById('etx-apply-all')?.checked;

  if (!amount || amount <= 0) { toast('Enter a valid amount', 'error'); return; }

  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  tx.type        = type;
  tx.amount      = amount;
  tx.date        = date;
  tx.category    = cat;
  tx.icon        = allCats.find(c => c.name === cat)?.icon || tx.icon || '💳';
  tx.description = desc;

  let extraMsg = '';
  if (applyAll && desc) {
    let count = 0;
    STATE.transactions.forEach(t => {
      if (t.id !== id && t.description === desc && t.category !== cat) {
        t.category = cat;
        t.icon = tx.icon;
        count++;
      }
    });
    if (count > 0) extraMsg = ` & ${count} others updated`;
  }

  saveState();
  if (typeof autoSyncGoals === 'function') autoSyncGoals();
  closeModal();
  toast(`Transaction updated ✅${extraMsg}`, 'success');
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
  refreshFinancePage();
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

    // Live price badge
    const hasTicker = inv.ticker && inv.qty > 0;
    const lastUp    = inv.lastUpdated ? _timeSince(inv.lastUpdated) : null;
    const liveTag   = hasTicker
      ? `<span style="display:inline-flex;align-items:center;gap:3px;padding:1px 6px;border-radius:4px;
            font-size:9px;font-weight:700;letter-spacing:.3px;margin-left:5px;
            background:${lastUp?'rgba(16,185,129,0.12)':'rgba(100,116,139,0.1)'};
            border:1px solid ${lastUp?'rgba(16,185,129,0.3)':'rgba(100,116,139,0.2)'};
            color:${lastUp?'#10b981':'#64748b'}">
          ${lastUp ? '🟢' : '⚪'} ${inv.ticker}
        </span>` : '';
    const liveSub = hasTicker
      ? `${inv.qty} units${inv.livePrice?' · ₹'+inv.livePrice.toLocaleString('en-IN',{maximumFractionDigits:2})+'/unit':''}${lastUp?' · Updated '+lastUp:'  · Not fetched yet'}`
      : '';

    return `<tr style="border-bottom:1px solid rgba(255,255,255,0.04);transition:.15s"
        onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background=''">
      <td style="padding:12px 16px;width:48px;text-align:center">
        <div style="display:flex;flex-direction:column;gap:0">${moveBtn('up','moveInv',inv.id,list)}${moveBtn('down','moveInv',inv.id,list)}</div>
      </td>
      <td style="padding:12px 16px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:38px;height:38px;border-radius:10px;background:rgba(99,102,241,0.15);
              display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${assetIcon(inv.type)}</div>
          <div>
            <p style="font-weight:700;font-size:13px;display:flex;align-items:center;gap:4px;flex-wrap:wrap">
              ${inv.name}${liveTag}
            </p>
            <p style="font-size:11px;color:var(--text3)">${inv.type}${liveSub ? ' · '+liveSub : (inv.notes?' · '+inv.notes:'')}${!liveSub&&inv.notes?' · '+inv.notes:''}</p>
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
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <button id="refresh-prices-btn" class="btn-secondary btn-sm" onclick="fetchLivePrices()"
            title="Fetch live prices for Stocks & Crypto with ticker symbols"
            style="background:rgba(16,185,129,0.1);border-color:rgba(16,185,129,0.3);color:#10b981;font-weight:700">
            🔄 Live Prices
          </button>
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
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <p style="font-size:16px;font-weight:800">💹 Investments & Assets</p>
          <button id="refresh-prices-btn" onclick="fetchLivePrices()"
            style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;
              border:1px solid rgba(16,185,129,0.4);background:rgba(16,185,129,0.12);
              color:#10b981;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s"
            onmouseover="this.style.background='rgba(16,185,129,0.22)'"
            onmouseout="this.style.background='rgba(16,185,129,0.12)'">
            🔄 Refresh Live Prices
          </button>
        </div>
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

// Show/hide ticker fields when asset type changes
function toggleTickerFields(prefix) {
  const type = document.getElementById(`${prefix}-type`)?.value || '';
  const needsTicker = type === 'Stocks' || type === 'Crypto' || type === 'Gold';
  const el = document.getElementById(`${prefix}-ticker-fields`);
  if (el) el.style.display = needsTicker ? 'block' : 'none';

  // Gold-specific guidance (physical gold priced per gram)
  const isGold   = type === 'Gold';
  const tk        = document.getElementById(`${prefix}-ticker`);
  const qtyLabel  = document.getElementById(`${prefix}-qty-label`);
  const goldHint  = document.getElementById(`${prefix}-gold-hint`);
  const stdHint   = document.getElementById(`${prefix}-std-hint`);
  if (tk)       tk.placeholder      = isGold ? 'GOLD24K · GOLD22K · GOLDBEES.NS' : 'RELIANCE.NS · INFY.BO · BTC-INR';
  if (qtyLabel) qtyLabel.textContent = isGold ? 'Qty (grams / ETF units)' : 'Qty (shares / units)';
  if (goldHint) goldHint.style.display = isGold ? 'block' : 'none';
  if (stdHint)  stdHint.style.display  = isGold ? 'none'  : 'block';
}

function _tickerFieldsHtml(prefix, ticker = '', qty = '') {
  return `
    <div id="${prefix}-ticker-fields" style="display:none">
      <div class="input-row">
        <div class="form-group">
          <label class="form-label">Ticker Symbol
            <a href="https://finance.yahoo.com/lookup" target="_blank"
              style="font-size:10px;color:var(--teal);margin-left:6px;text-decoration:none">lookup ↗</a>
          </label>
          <input type="text" id="${prefix}-ticker" class="form-input"
            value="${ticker}" placeholder="RELIANCE.NS · INFY.BO · BTC-INR"
            style="text-transform:uppercase" oninput="this.value=this.value.toUpperCase()"/>
        </div>
        <div class="form-group">
          <label class="form-label" id="${prefix}-qty-label">Qty (shares / units)</label>
          <input type="number" id="${prefix}-qty" class="form-input"
            value="${qty}" placeholder="10" min="0" step="any"/>
        </div>
      </div>
      <div id="${prefix}-std-hint" style="background:rgba(0,201,167,0.07);border:1px solid rgba(0,201,167,0.2);
          border-radius:8px;padding:8px 12px;margin-bottom:4px">
        <p style="font-size:11px;color:#00c9a7;margin:0">
          💡 NSE → <b>SYMBOL.NS</b> &nbsp;|&nbsp; BSE → <b>SYMBOL.BO</b> &nbsp;|&nbsp; Crypto → <b>BTC-INR</b> &nbsp;|&nbsp;
          After saving, hit <b>🔄 Live Prices</b> on the page to auto-fetch.
        </p>
      </div>
      <div id="${prefix}-gold-hint" style="display:none;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);
          border-radius:8px;padding:8px 12px;margin-bottom:4px">
        <p style="font-size:11px;color:#f59e0b;margin:0;line-height:1.7">
          🥇 Physical gold → ticker <b>GOLD24K</b> or <b>GOLD22K</b>, Qty = <b>grams</b> (fetches live ₹/gram).<br>
          Gold ETF → <b>GOLDBEES.NS</b>, Qty = units held. Then hit <b>🔄 Live Prices</b>.
        </p>
      </div>
    </div>`;
}

function openAddInvModal() {
  openModal('➕ Add Asset', `
    <div class="form-group"><label class="form-label">Name</label>
      <input type="text" id="inv-name" class="form-input" placeholder="e.g. Infosys shares, Axis FD, Gold 10g"/></div>
    <div class="form-group"><label class="form-label">Asset Type</label>
      <select id="inv-type" class="form-input" onchange="toggleTickerFields('inv')">${_invTypeOptions('')}</select></div>

    ${_tickerFieldsHtml('inv')}

    <div class="input-row">
      <div class="form-group"><label class="form-label">Invested Amount (₹)</label>
        <input type="number" id="inv-amount" class="form-input" placeholder="0"/></div>
      <div class="form-group"><label class="form-label">Current Value (₹)</label>
        <input type="number" id="inv-current" class="form-input" placeholder="auto from ticker or enter manually"/></div>
    </div>
    <div class="form-group"><label class="form-label">Notes (optional)</label>
      <input type="text" id="inv-notes" class="form-input" placeholder="e.g. pledged, maturity date…"/></div>
    <div class="form-group"><label class="form-label">Start Date</label>
      <input type="date" id="inv-date" class="form-input" value="${today()}"/></div>
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
  const ticker  = (document.getElementById('inv-ticker')?.value || '').trim().toUpperCase();
  const qty     = parseFloat(document.getElementById('inv-qty')?.value) || 0;
  if (!name || !amount) { toast('Enter name and amount', 'error'); return; }
  STATE.investments = STATE.investments || [];
  const inv = { id: genId(), name, type, amount, currentValue: current, notes, date: date || today() };
  if (ticker) { inv.ticker = ticker; inv.qty = qty; }
  STATE.investments.push(inv);
  saveState(); addXP(25, 'Asset added'); closeModal();
  toast('Asset tracked! +25 XP', 'success'); renderInvestments();
}

function openEditInvModal(id) {
  const inv = (STATE.investments || []).find(i => i.id === id);
  if (!inv) return;
  const hasTicker = inv.type === 'Stocks' || inv.type === 'Crypto' || inv.type === 'Gold';
  openModal('✏️ Edit Asset', `
    <div class="form-group"><label class="form-label">Name</label>
      <input type="text" id="einv-name" class="form-input" value="${inv.name}"/></div>
    <div class="form-group"><label class="form-label">Asset Type</label>
      <select id="einv-type" class="form-input" onchange="toggleTickerFields('einv')">${_invTypeOptions(inv.type)}</select></div>

    ${_tickerFieldsHtml('einv', inv.ticker || '', inv.qty || '')}

    <div class="input-row">
      <div class="form-group"><label class="form-label">Invested Amount (₹)</label>
        <input type="number" id="einv-amount" class="form-input" value="${inv.amount}"/></div>
      <div class="form-group"><label class="form-label">Current Value (₹)</label>
        <input type="number" id="einv-current" class="form-input" value="${inv.currentValue ?? inv.amount}"/></div>
    </div>
    <div class="form-group"><label class="form-label">Notes</label>
      <input type="text" id="einv-notes" class="form-input" value="${inv.notes||''}"/></div>
    <div class="form-group"><label class="form-label">Date</label>
      <input type="date" id="einv-date" class="form-input" value="${inv.date||today()}"/></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveEditInv('${id}')">💾 Save Changes</button>
    </div>`);
  // Show ticker fields if needed
  if (hasTicker) setTimeout(() => toggleTickerFields('einv'), 30);
}

function saveEditInv(id) {
  const inv = (STATE.investments || []).find(i => i.id === id);
  if (!inv) return;
  const name   = document.getElementById('einv-name').value.trim();
  const amount = parseFloat(document.getElementById('einv-amount').value);
  if (!name || !amount) { toast('Enter name and amount', 'error'); return; }
  const ticker = (document.getElementById('einv-ticker')?.value || '').trim().toUpperCase();
  const qty    = parseFloat(document.getElementById('einv-qty')?.value) || 0;
  inv.name         = name;
  inv.type         = document.getElementById('einv-type').value;
  inv.amount       = amount;
  inv.currentValue = parseFloat(document.getElementById('einv-current').value) || amount;
  inv.notes        = document.getElementById('einv-notes').value.trim();
  inv.date         = document.getElementById('einv-date').value || today();
  if (ticker) { inv.ticker = ticker; inv.qty = qty; }
  else { delete inv.ticker; delete inv.qty; }
  saveState(); closeModal(); toast('Asset updated ✅', 'success'); renderInvestments();
}

// ── Live Price Fetch ──────────────────────────────────────────────────────────
function _timeSince(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

async function _fetchYahooPrice(ticker) {
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(proxyUrl, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (!price) throw new Error('No price');
    return price;
  } finally { clearTimeout(timer); }
}

const GRAMS_PER_TROY_OZ = 31.1035;

// Live gold price in INR per gram (24K / 999 purity).
// Tries XAUINR (gold/INR per ounce) directly, falls back to gold-USD × USD-INR.
async function _fetchGoldPerGramInr() {
  try {
    const perOz = await _fetchYahooPrice('XAUINR=X');
    if (perOz > 0) return perOz / GRAMS_PER_TROY_OZ;
  } catch (e) { /* fall through to computed rate */ }
  const usdPerOz = await _fetchYahooPrice('GC=F');   // gold futures, USD/oz
  const usdInr   = await _fetchYahooPrice('INR=X');  // USD → INR
  return (usdPerOz * usdInr) / GRAMS_PER_TROY_OZ;
}

async function _fetchTickerPrice(ticker) {
  const t = (ticker || '').toUpperCase();
  // Physical gold pseudo-tickers — return INR per gram
  if (t === 'GOLD' || t === 'GOLD24K' || t === 'GOLD999') {
    return Math.round((await _fetchGoldPerGramInr()) * 100) / 100;
  }
  if (t === 'GOLD22K' || t === 'GOLD916') {
    return Math.round((await _fetchGoldPerGramInr()) * 0.9167 * 100) / 100;
  }
  // Everything else → standard Yahoo symbol (stocks, crypto, ETFs incl. GOLDBEES.NS)
  return _fetchYahooPrice(ticker);
}

async function fetchLivePrices() {
  const tickerInvs = (STATE.investments || []).filter(i => i.ticker && i.qty > 0);
  if (!tickerInvs.length) {
    toast('Add Ticker + Qty to your Stocks / Crypto / Gold first, then refresh.', 'info'); return;
  }
  const btn = document.getElementById('refresh-prices-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Fetching…'; }
  let ok = 0, fail = 0;
  for (const inv of tickerInvs) {
    try {
      const price = await _fetchTickerPrice(inv.ticker);
      inv.livePrice    = price;
      inv.currentValue = Math.round(price * inv.qty * 100) / 100;
      inv.lastUpdated  = new Date().toISOString();
      ok++;
    } catch (e) { console.warn(`[LivePrice] ${inv.ticker}:`, e.message); fail++; }
  }
  saveState();
  if (ok)   toast(`✅ ${ok} holding${ok>1?'s':''} updated with live prices!`, 'success');
  if (fail) toast(`⚠️ ${fail} ticker${fail>1?'s':''} failed — check symbols (e.g. RELIANCE.NS, BTC-INR)`, 'warning');
  if (typeof softRefresh === 'function') softRefresh(); else renderInvestments();
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
let _budgetPeriod = 'month';
function setBudgetPeriod(p) { _budgetPeriod = p; renderBudget(); }

// Convert stored budget to the limit for a given view period
function getBudgetLimit(b, viewPeriod) {
  const period = b.period || 'month';
  const amount = b.amount != null ? b.amount : (b.limit || 0);
  const daily = period === 'day' ? amount : period === 'month' ? amount / 30 : amount / 365;
  if (viewPeriod === 'day')   return Math.round(daily);
  if (viewPeriod === 'week')  return Math.round(daily * 7);
  if (viewPeriod === 'month') return Math.round(daily * 30);
  if (viewPeriod === 'year')  return Math.round(daily * 365);
  return Math.round(daily * 365); // 'all' → yearly equivalent
}

function selectBudgetPeriod(p) {
  const el = document.getElementById('b-period');
  if (el) el.value = p;
  ['day','month','year'].forEach(x => {
    const btn = document.getElementById('bp-' + x);
    if (btn) btn.classList.toggle('active', x === p);
  });
}

function renderBudget() {
  const budgets = STATE.budgets || [];
  const txns = STATE.transactions || [];
  const filteredTxns = filterTxByPeriod(txns, _budgetPeriod).filter(t => t.type === 'expense');

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div>
          <h1 class="page-title">🎯 Budget Planner</h1>
          <p class="page-subtitle">${periodLabel(_budgetPeriod)} spending vs budget limits</p>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          ${periodTabsHtml(_budgetPeriod, 'setBudgetPeriod')}
          <button class="btn-primary btn-sm" onclick="openAddBudgetModal(-1)">+ Add Budget</button>
        </div>
      </div>
      ${budgets.length === 0
        ? `<div class="glass-card" style="padding:40px"><div class="empty-state"><span class="empty-state-icon">🎯</span><p>Set budgets for your expense categories to track spending.</p></div></div>`
        : `<div style="display:flex;flex-direction:column;gap:12px">
          ${budgets.map((b, bi) => {
            const limit  = getBudgetLimit(b, _budgetPeriod);
            const spent  = filteredTxns.filter(t => t.category?.trim().toLowerCase() === b.category?.trim().toLowerCase()).reduce((s,t) => s+t.amount, 0);
            const pct    = Math.min(100, limit > 0 ? (spent / limit) * 100 : 0);
            const over   = spent > limit;
            const cat    = CATEGORIES.find(c => c.name === b.category);
            const bPeriod = b.period || 'month';
            const bAmount = b.amount != null ? b.amount : (b.limit || 0);
            const bDaily  = bPeriod === 'day' ? bAmount : bPeriod === 'month' ? bAmount / 30 : bAmount / 365;
            const breakdown = `${fmt(Math.round(bDaily))}/day · ${fmt(Math.round(bDaily*30))}/mo · ${fmt(Math.round(bDaily*365))}/yr`;
            return `<div class="glass-card" style="padding:18px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <div style="display:flex;align-items:center;gap:10px">
                  <span style="font-size:22px">${cat?.icon||'📦'}</span>
                  <div>
                    <div style="font-weight:600;font-size:14px">${b.category}</div>
                    <div style="font-size:11px;color:var(--text3)">Set: ₹${fmt(bAmount)}/${bPeriod}</div>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-size:13px;color:${over?'#ef4444':'#10b981'};font-weight:700">${fmt(spent)} / ${fmt(limit)}</span>
                  ${over ? '<span class="tag tag-red" style="font-size:11px">Over!</span>' : ''}
                  <button onclick="openAddBudgetModal(${bi})" style="background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);color:#6366f1;border-radius:8px;padding:4px 9px;cursor:pointer;font-size:12px">✏️</button>
                  <button onclick="deleteBudget(${bi})" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#ef4444;border-radius:8px;padding:4px 9px;cursor:pointer;font-size:12px">✕</button>
                </div>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${over?'#ef4444':pct>80?'#f59e0b':'#10b981'}"></div></div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
                <p style="font-size:11px;color:var(--text3)">${over ? `₹${(spent-limit).toLocaleString('en-IN')} over budget` : `₹${(limit-spent).toLocaleString('en-IN')} remaining · ${pct.toFixed(0)}% used`}</p>
                <p style="font-size:10px;color:var(--text3);opacity:0.7">₹${breakdown}</p>
              </div>
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

function openAddBudgetModal(editIndex) {
  const isEdit  = editIndex >= 0;
  const b       = isEdit ? (STATE.budgets||[])[editIndex] : null;
  const ePeriod = b ? (b.period || 'month') : 'month';
  const eAmount = b ? (b.amount != null ? b.amount : (b.limit || '')) : '';
  const catOptions = CATEGORIES
    .filter(c => !['Salary','Business','Freelance'].includes(c.name))
    .map(c => `<option value="${c.name}"${b?.category===c.name?' selected':''}>${c.icon} ${c.name}</option>`)
    .join('');

  openModal(isEdit ? `Edit Budget — ${b.category}` : 'Set Budget', `
    <div class="form-group">
      <label class="form-label">Category</label>
      <select id="b-cat" class="form-input"${isEdit?' disabled':''}>${catOptions}</select>
    </div>
    <div class="form-group">
      <label class="form-label">Budget Period</label>
      <div class="period-tabs" style="width:100%">
        <button class="period-tab${ePeriod==='day'?' active':''}" id="bp-day"   onclick="selectBudgetPeriod('day')">Day</button>
        <button class="period-tab${ePeriod==='month'?' active':''}" id="bp-month" onclick="selectBudgetPeriod('month')">Month</button>
        <button class="period-tab${ePeriod==='year'?' active':''}" id="bp-year"  onclick="selectBudgetPeriod('year')">Year</button>
      </div>
      <input type="hidden" id="b-period" value="${ePeriod}">
    </div>
    <div class="form-group">
      <label class="form-label">Budget Limit (₹)</label>
      <input type="number" id="b-limit" class="form-input" placeholder="e.g. 5000" value="${eAmount}"/>
      <p style="font-size:11px;color:var(--text3);margin-top:6px">Auto-splits to daily / monthly / yearly when viewing other periods.</p>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveBudget(${isEdit ? editIndex : -1})">${isEdit ? 'Update' : 'Save Budget'}</button>
    </div>`);
}

function saveBudget(editIndex) {
  const category = document.getElementById('b-cat').value;
  const amount   = parseFloat(document.getElementById('b-limit').value);
  const period   = document.getElementById('b-period').value || 'month';
  if (!amount || amount <= 0) { toast('Enter a valid limit', 'error'); return; }
  STATE.budgets = STATE.budgets || [];
  if (editIndex >= 0) {
    STATE.budgets[editIndex] = { ...STATE.budgets[editIndex], amount, period };
  } else {
    const existing = STATE.budgets.findIndex(b => b.category === category);
    if (existing >= 0) STATE.budgets[existing] = { ...STATE.budgets[existing], amount, period };
    else STATE.budgets.push({ id: genId(), category, amount, period });
  }
  saveState(); closeModal(); toast(editIndex >= 0 ? 'Budget updated!' : 'Budget set!', 'success'); renderBudget();
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

// ── Quick update outstanding (like bank ↑ Bal) ───────────────────────────
function openUpdateCCModal(cardId) {
  const card = (STATE.creditCards||[]).find(c => c.id === cardId);
  if (!card) return;
  const todayStr = today();
  const yday  = (() => { const d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); })();
  const y2day = (() => { const d=new Date(); d.setDate(d.getDate()-2); return d.toISOString().slice(0,10); })();
  openModal(`💳 Update ${card.bankName} Card`, `
    <div style="padding:10px 14px;border-radius:10px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);margin-bottom:14px;font-size:12px;color:var(--text2)">
      Current outstanding: <strong style="color:#ef4444">${fmt(card.outstanding||0)}</strong> &nbsp;·&nbsp; Limit: <strong>${fmt(card.limit||0)}</strong>
    </div>
    <div class="form-group">
      <label class="form-label">New Outstanding Balance (₹)</label>
      <input type="number" id="cc-upd-outstanding" class="form-input" placeholder="Enter current outstanding" step="0.01" min="0" autofocus value="${card.outstanding||0}"/>
    </div>
    <div class="form-group">
      <label class="form-label">Date</label>
      <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
        <button type="button" id="cc-btn-today" onclick="setCcDate('${todayStr}','today')" style="padding:6px 14px;border-radius:8px;border:1px solid rgba(239,68,68,0.5);background:rgba(239,68,68,0.15);color:#ef4444;font-size:12px;font-weight:600;cursor:pointer">Today</button>
        <button type="button" id="cc-btn-yday"  onclick="setCcDate('${yday}','yday')"   style="padding:6px 14px;border-radius:8px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.06);color:var(--text2);font-size:12px;cursor:pointer">Yesterday</button>
        <button type="button" id="cc-btn-y2day" onclick="setCcDate('${y2day}','y2day')" style="padding:6px 14px;border-radius:8px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.06);color:var(--text2);font-size:12px;cursor:pointer">2 days ago</button>
        <button type="button" onclick="document.getElementById('cc-upd-date').showPicker?document.getElementById('cc-upd-date').showPicker():document.getElementById('cc-upd-date').focus()" style="padding:6px 14px;border-radius:8px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.06);color:var(--text2);font-size:12px;cursor:pointer">📅 Pick</button>
      </div>
      <input type="date" id="cc-upd-date" class="form-input" value="${todayStr}"/>
    </div>
    <div class="form-group">
      <label class="form-label">Note (optional)</label>
      <input type="text" id="cc-upd-note" class="form-input" placeholder="e.g. After payment, new purchase…"/>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveCCUpdate('${cardId}')" style="background:linear-gradient(135deg,#ef4444,#b91c1c)">💾 Save</button>
    </div>`);
}

function setCcDate(dateStr, key) {
  document.getElementById('cc-upd-date').value = dateStr;
  ['today','yday','y2day'].forEach(k => {
    const btn = document.getElementById(`cc-btn-${k}`);
    if (!btn) return;
    const active = k === key;
    btn.style.background  = active ? 'rgba(239,68,68,0.15)'  : 'rgba(255,255,255,0.06)';
    btn.style.borderColor = active ? 'rgba(239,68,68,0.5)'   : 'var(--glass-border)';
    btn.style.color       = active ? '#ef4444'               : 'var(--text2)';
    btn.style.fontWeight  = active ? '600'                   : '400';
  });
}

function saveCCUpdate(cardId) {
  const card = (STATE.creditCards||[]).find(c => c.id === cardId);
  if (!card) return;
  const newOut  = parseFloat(document.getElementById('cc-upd-outstanding')?.value);
  const date    = document.getElementById('cc-upd-date')?.value || today();
  const note    = document.getElementById('cc-upd-note')?.value.trim() || 'Balance update';
  if (isNaN(newOut) || newOut < 0) { toast('Enter a valid amount', 'error'); return; }
  const oldOut = card.outstanding || 0;
  card.outstanding = newOut;
  STATE.creditCardHistory = STATE.creditCardHistory || [];
  STATE.creditCardHistory.push({
    id: genId(), cardId,
    outstanding: newOut, prevOutstanding: oldOut,
    date, note, createdAt: new Date().toISOString()
  });
  saveState(); closeModal();
  toast(`${card.bankName} → outstanding ${fmt(newOut)} saved ✅`, 'success');
  renderFinance();
}

// ===== CSV IMPORT =====
let _csvResults = [];

function openCsvImport() {
  _csvResults = [];
  openModal('📊 Import CSV', `
    <div style="padding:10px 14px;border-radius:10px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);margin-bottom:14px;font-size:12px;color:var(--text2);line-height:1.6">
      Upload a CSV exported from <strong>Google Pay</strong> or <strong>PhonePe</strong>.<br>
      Auto-detects the format and maps all transactions.
    </div>

    <div class="form-group" style="margin-bottom:12px">
      <label class="form-label">Select CSV file</label>
      <input type="file" id="csv-file-input" accept=".csv,text/csv" class="form-input"
        onchange="handleCsvFileSelect(this)"
        style="padding:10px;cursor:pointer"/>
    </div>

    <div id="csv-status" style="display:none;font-size:12px;font-weight:600;margin-bottom:12px;padding:8px 12px;border-radius:8px"></div>

    <div class="modal-actions" style="margin-bottom:14px">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
    </div>

    <div id="csv-results-wrap" style="display:none">
      <div style="height:1px;background:var(--glass-border);margin-bottom:14px"></div>
      <p style="font-size:11px;font-weight:700;color:#00c9a7;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Detected transactions — edit if needed</p>
      <div id="csv-results-list" style="max-height:45vh;overflow-y:auto;padding-right:2px"></div>
      <div id="csv-summary" style="margin:12px 0;padding:10px 14px;border-radius:10px;background:rgba(0,201,167,0.08);border:1px solid rgba(0,201,167,0.2);font-size:13px;font-weight:600"></div>
      <button class="btn-primary" onclick="saveAllCsvTx()" style="width:100%;background:linear-gradient(135deg,#00c9a7,#0acf83);padding:12px">💾 Save All Transactions</button>
    </div>`);
}

function handleCsvFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      _csvResults = parseCsvText(e.target.result);
      if (!_csvResults.length) {
        _showImportStatus('csv', 'No valid transactions found in this CSV. Make sure it\'s a GPay or PhonePe export.', 'warn');
        return;
      }
      renderCsvResults();
      _showImportStatus('csv', `✅ Found ${_csvResults.length} transaction${_csvResults.length > 1 ? 's' : ''}`, 'ok');
    } catch(err) {
      _showImportStatus('csv', 'Could not parse CSV: ' + err.message, 'warn');
    }
  };
  reader.readAsText(file);
}

function parseCsvText(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  // Normalize CSV line (handle quoted fields with commas inside)
  function splitCsvLine(line) {
    const result = [];
    let cur = '', inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { result.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    result.push(cur.trim());
    return result;
  }

  const headers = splitCsvLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim());
  const rows = lines.slice(1).map(l => splitCsvLine(l));

  // Detect format
  const fmt = _detectCsvFormat(headers);
  const results = [];

  rows.forEach(row => {
    if (row.length < 2) return;
    const cell = i => (row[i] || '').trim().replace(/^"|"$/g, '');

    let type, amount, date, description;

    if (fmt === 'gpay') {
      // GPay: Transaction ID | Date | Description | Amount (INR) | Status
      const [iDate, iDesc, iAmt] = [fmt === 'gpay' ? headers.indexOf('date') : -1,
        headers.findIndex(h => h.includes('description') || h.includes('remarks')),
        headers.findIndex(h => h.includes('amount'))];
      const dateIdx = headers.indexOf('date') !== -1 ? headers.indexOf('date') : headers.findIndex(h => h.includes('date'));
      const descIdx = headers.findIndex(h => h.includes('description') || h.includes('remarks'));
      const amtIdx  = headers.findIndex(h => h.includes('amount'));
      if (amtIdx === -1) return;

      const rawAmt = parseFloat(cell(amtIdx).replace(/,/g, ''));
      if (!rawAmt || isNaN(rawAmt)) return;
      amount = Math.abs(rawAmt);
      type = rawAmt < 0 ? 'expense' : 'income';
      description = descIdx >= 0 ? cell(descIdx) : '';
      date = dateIdx >= 0 ? _parseCsvDate(cell(dateIdx)) : today();

    } else if (fmt === 'phonepe') {
      // PhonePe: Transaction Date | Transaction ID | Remarks | Transaction Type | Amount (INR) | ...
      const dateIdx = headers.findIndex(h => h.includes('date'));
      const typeIdx = headers.findIndex(h => h.includes('type'));
      const amtIdx  = headers.findIndex(h => h.includes('amount'));
      const descIdx = headers.findIndex(h => h.includes('remarks') || h.includes('description'));
      if (amtIdx === -1) return;

      const rawAmt = parseFloat(cell(amtIdx).replace(/,/g, ''));
      if (!rawAmt || isNaN(rawAmt)) return;
      amount = Math.abs(rawAmt);
      const txType = (cell(typeIdx) || '').toLowerCase();
      type = (txType.includes('debit') || txType.includes('paid') || txType.includes('sent')) ? 'expense' : 'income';
      description = descIdx >= 0 ? cell(descIdx) : '';
      date = dateIdx >= 0 ? _parseCsvDate(cell(dateIdx)) : today();

    } else {
      // Generic: try to guess columns
      const dateIdx = headers.findIndex(h => h.includes('date'));
      const amtIdx  = headers.findIndex(h => h.includes('amount') || h.includes('debit') || h.includes('credit'));
      const descIdx = headers.findIndex(h => h.includes('description') || h.includes('narration') || h.includes('remarks') || h.includes('particulars'));
      const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('transaction type'));

      // Try debit/credit separate columns (bank statement style)
      const debitIdx  = headers.findIndex(h => h === 'debit' || h === 'withdrawal' || h === 'dr');
      const creditIdx = headers.findIndex(h => h === 'credit' || h === 'deposit' || h === 'cr');

      if (debitIdx >= 0 || creditIdx >= 0) {
        const debitAmt  = parseFloat((cell(debitIdx)  || '0').replace(/,/g,''));
        const creditAmt = parseFloat((cell(creditIdx) || '0').replace(/,/g,''));
        if (!debitAmt && !creditAmt) return;
        if (debitAmt > 0)  { amount = debitAmt;  type = 'expense'; }
        else               { amount = creditAmt; type = 'income';  }
      } else if (amtIdx >= 0) {
        const rawAmt = parseFloat(cell(amtIdx).replace(/,/g, ''));
        if (!rawAmt || isNaN(rawAmt)) return;
        amount = Math.abs(rawAmt);
        const txType = typeIdx >= 0 ? (cell(typeIdx) || '').toLowerCase() : '';
        type = (rawAmt < 0 || txType.includes('debit') || txType.includes('dr')) ? 'expense' : 'income';
      } else return;

      description = descIdx >= 0 ? cell(descIdx) : '';
      date = dateIdx >= 0 ? _parseCsvDate(cell(dateIdx)) : today();
    }

    if (!amount || amount <= 0) return;
    if (!description) description = type === 'income' ? 'Credit' : 'Debit';
    const lo = description.toLowerCase();
    const category = smsCategoryGuess(lo, lo, type);
    results.push({ type, amount, date: date || today(), description, category });
  });

  return results;
}

function _detectCsvFormat(headers) {
  const h = headers.join(' ');
  if (h.includes('transaction id') && h.includes('amount') && (h.includes('description') || !h.includes('remarks'))) return 'gpay';
  if (h.includes('transaction type') && h.includes('remarks')) return 'phonepe';
  return 'generic';
}

function _parseCsvDate(raw) {
  if (!raw) return today();
  raw = raw.trim();
  // DD/MM/YYYY or DD-MM-YYYY
  let m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const yr = m[3].length === 2 ? '20' + m[3] : m[3];
    return `${yr}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  }
  // YYYY-MM-DD (already correct)
  m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return raw.slice(0, 10);
  // "05 Jan 2025" or "Jan 05, 2025" or "05 January 2025"
  const MONTHS = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
    january:'01',february:'02',march:'03',april:'04',june:'06',july:'07',august:'08',september:'09',october:'10',november:'11',december:'12'};
  m = raw.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (m) { const mo = MONTHS[m[2].toLowerCase()]; if (mo) return `${m[3]}-${mo}-${m[1].padStart(2,'0')}`; }
  m = raw.match(/([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (m) { const mo = MONTHS[m[1].toLowerCase()]; if (mo) return `${m[3]}-${mo}-${m[2].padStart(2,'0')}`; }
  // Try native parse as fallback
  const d = new Date(raw);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  return today();
}

function _showImportStatus(prefix, msg, type) {
  const el = document.getElementById(`${prefix}-status`);
  if (!el) return;
  el.style.display    = '';
  el.textContent      = msg;
  el.style.background = type === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)';
  el.style.color      = type === 'ok' ? '#10b981'               : '#f59e0b';
}

function renderCsvResults() {
  const list = document.getElementById('csv-results-list');
  const wrap = document.getElementById('csv-results-wrap');
  if (!list || !wrap) return;
  list.innerHTML = _csvResults.map((r, i) => `
    <div id="csv-card-${i}" style="background:var(--card-bg);border:1px solid var(--glass-border);border-radius:12px;padding:12px;margin-bottom:10px;position:relative">
      <button onclick="removeCsvResult(${i})" title="Remove" style="position:absolute;top:8px;right:10px;background:rgba(239,68,68,0.12);border:none;color:#ef4444;border-radius:6px;cursor:pointer;padding:2px 9px;font-size:13px;line-height:1.6">✕</button>
      <div style="display:grid;grid-template-columns:auto 1fr 1fr;gap:8px;margin-bottom:8px;padding-right:36px">
        <select class="form-input" id="cv-type-${i}" onchange="updateCsvSummary()" style="font-size:12px;padding:4px 8px">
          <option value="expense" ${r.type === 'expense' ? 'selected' : ''}>❤️ Expense</option>
          <option value="income"  ${r.type === 'income'  ? 'selected' : ''}>💚 Income</option>
        </select>
        <input type="number" class="form-input" id="cv-amount-${i}" value="${r.amount}" step="0.01" min="0"
          oninput="updateCsvSummary()" style="font-size:13px;font-weight:700;padding:4px 8px"/>
        <input type="date" class="form-input" id="cv-date-${i}" value="${r.date}" style="font-size:12px;padding:4px 8px"/>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <select class="form-input" id="cv-cat-${i}" style="font-size:12px;padding:4px 8px">${_makeSrCatOptions(r.category)}</select>
        <input type="text" class="form-input" id="cv-desc-${i}" value="${(r.description||'').replace(/"/g,'&quot;')}" placeholder="Description" style="font-size:12px;padding:4px 8px"/>
      </div>
    </div>`).join('');
  wrap.style.display = '';
  updateCsvSummary();
}

function removeCsvResult(i) {
  const card = document.getElementById(`csv-card-${i}`);
  if (card) card.style.display = 'none';
  updateCsvSummary();
}

function updateCsvSummary() {
  let totalExpense = 0, totalIncome = 0, count = 0;
  _csvResults.forEach((_, i) => {
    const card = document.getElementById(`csv-card-${i}`);
    if (!card || card.style.display === 'none') return;
    const type   = document.getElementById(`cv-type-${i}`)?.value;
    const amount = parseFloat(document.getElementById(`cv-amount-${i}`)?.value) || 0;
    if (type === 'expense') totalExpense += amount; else totalIncome += amount;
    count++;
  });
  const el = document.getElementById('csv-summary');
  if (!el) return;
  if (!count) { el.innerHTML = '<span style="color:var(--text3)">No transactions selected</span>'; return; }
  const parts = [];
  if (totalExpense > 0) parts.push(`<span style="color:#ef4444">💸 Expense: ₹${totalExpense.toLocaleString('en-IN',{minimumFractionDigits:2})}</span>`);
  if (totalIncome  > 0) parts.push(`<span style="color:#10b981">💰 Income: ₹${totalIncome.toLocaleString('en-IN',{minimumFractionDigits:2})}</span>`);
  el.innerHTML = `${parts.join(' &nbsp;·&nbsp; ')} &nbsp;·&nbsp; <span style="color:var(--text2)">${count} transaction${count>1?'s':''}</span>`;
}

function saveAllCsvTx() {
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const toSave  = [];
  _csvResults.forEach((_, i) => {
    const card = document.getElementById(`csv-card-${i}`);
    if (!card || card.style.display === 'none') return;
    const type     = document.getElementById(`cv-type-${i}`)?.value;
    const amount   = parseFloat(document.getElementById(`cv-amount-${i}`)?.value);
    const date     = document.getElementById(`cv-date-${i}`)?.value || today();
    const category = document.getElementById(`cv-cat-${i}`)?.value;
    const desc     = document.getElementById(`cv-desc-${i}`)?.value?.trim() || '';
    if (!amount || amount <= 0) return;
    const icon = allCats.find(c => c.name === category)?.icon || '💳';
    toSave.push({ id: genId(), type, amount, date, category, icon, description: desc, createdAt: new Date().toISOString() });
  });
  if (!toSave.length) { toast('No valid transactions to save', 'error'); return; }
  STATE.transactions = STATE.transactions || [];
  [...toSave].reverse().forEach(tx => STATE.transactions.unshift(tx));
  saveState();
  if (typeof addXP === 'function') addXP(10 * toSave.length, `${toSave.length} CSV transaction${toSave.length>1?'s':''} imported`);
  if (typeof autoSyncGoals === 'function') autoSyncGoals();
  closeModal();
  toast(`${toSave.length} transaction${toSave.length>1?'s':''} imported from CSV! 🎉`, 'success');
  refreshFinancePage();
}

// ===== BULK DATE ENTRY =====
let _bulkRows = 0;

function openBulkEntry() {
  _bulkRows = 0;
  openModal('📅 Bulk Date Entry', `
    <div style="padding:10px 14px;border-radius:10px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);margin-bottom:14px;font-size:12px;color:var(--text2);line-height:1.6">
      Pick a date, then add as many transactions as you need at once.
    </div>
    <div class="form-group" style="margin-bottom:14px">
      <label class="form-label">Date for all entries</label>
      <input type="date" id="bulk-date" class="form-input" value="${today()}" onchange="updateBulkRowDates()"/>
    </div>
    <div id="bulk-rows-wrap"></div>
    <button class="btn-secondary" onclick="addBulkRow()" style="width:100%;margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:6px">+ Add Row</button>
    <div id="bulk-summary" style="display:none;margin-bottom:12px;padding:10px 14px;border-radius:10px;background:rgba(0,201,167,0.08);border:1px solid rgba(0,201,167,0.2);font-size:13px;font-weight:600"></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveBulkEntries()" style="background:linear-gradient(135deg,#00c9a7,#0acf83)">💾 Save All</button>
    </div>`);
  addBulkRow();
  addBulkRow();
}

function addBulkRow() {
  const i = _bulkRows++;
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const catOpts = allCats.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('');
  const date = document.getElementById('bulk-date')?.value || today();
  const wrap = document.getElementById('bulk-rows-wrap');
  if (!wrap) return;
  const div = document.createElement('div');
  div.id = `bulk-row-${i}`;
  div.style.cssText = 'background:var(--card-bg);border:1px solid var(--glass-border);border-radius:12px;padding:12px;margin-bottom:10px;position:relative';
  div.innerHTML = `
    <button onclick="removeBulkRow(${i})" title="Remove" style="position:absolute;top:8px;right:10px;background:rgba(239,68,68,0.12);border:none;color:#ef4444;border-radius:6px;cursor:pointer;padding:2px 9px;font-size:13px;line-height:1.6">✕</button>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:8px;margin-bottom:8px;padding-right:44px">
      <select class="form-input" id="br-type-${i}" oninput="updateBulkSummary()" style="font-size:12px;padding:4px 8px">
        <option value="expense">❤️ Expense</option>
        <option value="income">💚 Income</option>
      </select>
      <input type="number" class="form-input" id="br-amount-${i}" placeholder="Amount ₹" min="0" step="0.01"
        oninput="updateBulkSummary()" style="font-size:13px;font-weight:700;padding:4px 8px"/>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <select class="form-input" id="br-cat-${i}" style="font-size:12px;padding:4px 8px">${catOpts}</select>
      <input type="text" class="form-input" id="br-desc-${i}" placeholder="Description" style="font-size:12px;padding:4px 8px"/>
    </div>`;
  wrap.appendChild(div);
}

function removeBulkRow(i) {
  const row = document.getElementById(`bulk-row-${i}`);
  if (row) row.style.display = 'none';
  updateBulkSummary();
}

function updateBulkRowDates() {
  // date is shared — nothing per-row to update, but keep hook for future use
}

function updateBulkSummary() {
  let totalExpense = 0, totalIncome = 0, count = 0;
  for (let i = 0; i < _bulkRows; i++) {
    const row = document.getElementById(`bulk-row-${i}`);
    if (!row || row.style.display === 'none') continue;
    const type   = document.getElementById(`br-type-${i}`)?.value;
    const amount = parseFloat(document.getElementById(`br-amount-${i}`)?.value) || 0;
    if (!amount) continue;
    if (type === 'expense') totalExpense += amount; else totalIncome += amount;
    count++;
  }
  const el = document.getElementById('bulk-summary');
  if (!el) return;
  if (!count) { el.style.display = 'none'; return; }
  el.style.display = '';
  const parts = [];
  if (totalExpense > 0) parts.push(`<span style="color:#ef4444">💸 Expense: ₹${totalExpense.toLocaleString('en-IN',{minimumFractionDigits:2})}</span>`);
  if (totalIncome  > 0) parts.push(`<span style="color:#10b981">💰 Income: ₹${totalIncome.toLocaleString('en-IN',{minimumFractionDigits:2})}</span>`);
  el.innerHTML = `${parts.join(' &nbsp;·&nbsp; ')} &nbsp;·&nbsp; <span style="color:var(--text2)">${count} entr${count>1?'ies':'y'}</span>`;
}

function saveBulkEntries() {
  const date = document.getElementById('bulk-date')?.value || today();
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const toSave  = [];
  for (let i = 0; i < _bulkRows; i++) {
    const row = document.getElementById(`bulk-row-${i}`);
    if (!row || row.style.display === 'none') continue;
    const type     = document.getElementById(`br-type-${i}`)?.value;
    const amount   = parseFloat(document.getElementById(`br-amount-${i}`)?.value);
    const category = document.getElementById(`br-cat-${i}`)?.value;
    const desc     = document.getElementById(`br-desc-${i}`)?.value?.trim() || '';
    if (!amount || amount <= 0) continue;
    const icon = allCats.find(c => c.name === category)?.icon || '💳';
    toSave.push({ id: genId(), type, amount, date, category, icon, description: desc, createdAt: new Date().toISOString() });
  }
  if (!toSave.length) { toast('Add at least one valid amount', 'error'); return; }
  STATE.transactions = STATE.transactions || [];
  [...toSave].reverse().forEach(tx => STATE.transactions.unshift(tx));
  saveState();
  if (typeof addXP === 'function') addXP(10 * toSave.length, `${toSave.length} bulk transaction${toSave.length>1?'s':''} logged`);
  if (typeof autoSyncGoals === 'function') autoSyncGoals();
  closeModal();
  toast(`${toSave.length} transaction${toSave.length>1?'s':''} saved! +${toSave.length * 10} XP 🎉`, 'success');
  refreshFinancePage();
}

// ===== SMART STATEMENT PASTE (GPay / PhonePe) =====
let _stmtResults = [];

function openStatementPaste() {
  _stmtResults = [];
  openModal('📄 Paste Statement', `
    <div style="padding:10px 14px;border-radius:10px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);margin-bottom:14px;font-size:12px;color:var(--text2);line-height:1.6">
      Copy text from your <strong>GPay</strong> or <strong>PhonePe</strong> transaction history page and paste it below.<br>
      Works with both app copy-paste and browser page text.
    </div>
    <div class="form-group" style="margin-bottom:12px">
      <label class="form-label">Paste transaction history</label>
      <textarea id="stmt-raw" class="form-input" rows="6"
        placeholder="Paste copied text from GPay or PhonePe transaction history..."
        style="font-size:12px;line-height:1.6;resize:vertical"></textarea>
    </div>
    <div id="stmt-status" style="display:none;font-size:12px;font-weight:600;margin-bottom:12px;padding:8px 12px;border-radius:8px"></div>
    <div class="modal-actions" style="margin-bottom:14px">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="parseStatement()" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">🔍 Parse</button>
    </div>
    <div id="stmt-results-wrap" style="display:none">
      <div style="height:1px;background:var(--glass-border);margin-bottom:14px"></div>
      <p style="font-size:11px;font-weight:700;color:#00c9a7;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Detected transactions — edit if needed</p>
      <div id="stmt-results-list" style="max-height:45vh;overflow-y:auto;padding-right:2px"></div>
      <div id="stmt-summary" style="margin:12px 0;padding:10px 14px;border-radius:10px;background:rgba(0,201,167,0.08);border:1px solid rgba(0,201,167,0.2);font-size:13px;font-weight:600"></div>
      <button class="btn-primary" onclick="saveAllStmtTx()" style="width:100%;background:linear-gradient(135deg,#00c9a7,#0acf83);padding:12px">💾 Save All Transactions</button>
    </div>`);
}

function parseStatement() {
  const raw = document.getElementById('stmt-raw')?.value?.trim();
  if (!raw) { toast('Paste some text first', 'error'); return; }
  _stmtResults = _parseStatementText(raw);
  if (!_stmtResults.length) {
    _showImportStatus('stmt', 'Could not detect any transactions. Make sure you pasted from GPay or PhonePe transaction history.', 'warn');
    return;
  }
  renderStmtResults();
  _showImportStatus('stmt', `✅ Found ${_stmtResults.length} transaction${_stmtResults.length > 1 ? 's' : ''}`, 'ok');
}

function _parseStatementText(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
  const results = [];

  // Strategy: scan line by line looking for ₹ amount lines, then look around for date/merchant/type
  const MONTHS = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
    january:'01',february:'02',march:'03',april:'04',june:'06',july:'07',august:'08',september:'09',october:'10',november:'11',december:'12'};

  function parseLineDate(s) {
    // "12 May 2025" or "May 12, 2025" or "12/05/2025" or "2025-05-12"
    let m = s.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
    if (m) { const mo = MONTHS[m[2].toLowerCase()]; if (mo) return `${m[3]}-${mo}-${m[1].padStart(2,'0')}`; }
    m = s.match(/([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (m) { const mo = MONTHS[m[1].toLowerCase()]; if (mo) return `${m[3]}-${mo}-${m[2].padStart(2,'0')}`; }
    m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) return m[0];
    m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (m) { const yr = m[3].length===2?'20'+m[3]:m[3]; return `${yr}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; }
    return null;
  }

  function parseLineAmount(s) {
    // ₹350 or ₹1,299.00 or Rs. 350 or INR 350
    const m = s.match(/(?:₹|rs\.?\s*|inr\s*)([\d,]+(?:\.\d{1,2})?)/i);
    if (m) return parseFloat(m[1].replace(/,/g,''));
    // Bare number like "350.00" as own line
    const m2 = s.match(/^([\d,]+(?:\.\d{1,2})?)$/);
    if (m2) { const v = parseFloat(m2[1].replace(/,/g,'')); if (v > 0) return v; }
    return null;
  }

  function detectType(s) {
    const lo = s.toLowerCase();
    if (/\b(paid|debit|debited|sent|spent|withdrawn|payment)\b/.test(lo)) return 'expense';
    if (/\b(received|credit|credited|added|money received|refund|cashback)\b/.test(lo)) return 'income';
    return null;
  }

  // Collect all (lineIdx, amount) pairs first
  const amtLines = [];
  lines.forEach((l, idx) => {
    const amt = parseLineAmount(l);
    if (amt && amt > 0) amtLines.push({ idx, amt });
  });

  // For each amount line, gather context (±5 lines) to find date, description, type
  amtLines.forEach(({ idx, amt }) => {
    const window = [];
    for (let d = -4; d <= 4; d++) {
      if (idx + d >= 0 && idx + d < lines.length && d !== 0) window.push({ d, line: lines[idx + d] });
    }

    // Find date in window (prefer lines before the amount)
    let date = null;
    for (const { line } of [...window].sort((a,b) => Math.abs(a.d) - Math.abs(b.d))) {
      date = parseLineDate(line);
      if (date) break;
    }
    if (!date) date = today();

    // Find type signal
    let type = null;
    for (const { line } of window) {
      const t = detectType(line);
      if (t) { type = t; break; }
    }
    // Also check the amount line itself
    if (!type) type = detectType(lines[idx]);

    // Find description: prefer merchant-looking lines (not date/amount/type keywords) before or after
    let description = '';
    const skipRe = /₹|rs\.|inr|^[\d,]+(\.\d+)?$|paid|received|credit|debit|debited|credited|success|completed|utr|ref|transaction|pending/i;
    const dateRe  = /\d{1,2}\s+[a-zA-Z]+\s+\d{4}|[a-zA-Z]+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/;
    for (const { d, line } of [...window].sort((a,b) => Math.abs(a.d)-Math.abs(b.d))) {
      if (skipRe.test(line)) continue;
      if (dateRe.test(line)) continue;
      if (line.length < 3 || line.length > 80) continue;
      description = line;
      break;
    }
    if (!description) description = type === 'income' ? 'Received' : 'Payment';

    // Default type from description if still null
    if (!type) {
      const lo = description.toLowerCase();
      type = (lo.includes('paid') || lo.includes('sent') || lo.includes('to ')) ? 'expense' : 'income';
    }

    const lo = description.toLowerCase();
    const category = smsCategoryGuess(lo, lo, type);
    results.push({ type, amount: amt, date, description, category });
  });

  // Deduplicate by amount+date+description
  const seen = new Set();
  return results.filter(r => {
    const key = `${r.amount}|${r.date}|${r.description}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderStmtResults() {
  const list = document.getElementById('stmt-results-list');
  const wrap = document.getElementById('stmt-results-wrap');
  if (!list || !wrap) return;
  list.innerHTML = _stmtResults.map((r, i) => `
    <div id="st-card-${i}" style="background:var(--card-bg);border:1px solid var(--glass-border);border-radius:12px;padding:12px;margin-bottom:10px;position:relative">
      <button onclick="removeStmtResult(${i})" title="Remove" style="position:absolute;top:8px;right:10px;background:rgba(239,68,68,0.12);border:none;color:#ef4444;border-radius:6px;cursor:pointer;padding:2px 9px;font-size:13px;line-height:1.6">✕</button>
      <div style="display:grid;grid-template-columns:auto 1fr 1fr;gap:8px;margin-bottom:8px;padding-right:36px">
        <select class="form-input" id="st-type-${i}" onchange="updateStmtSummary()" style="font-size:12px;padding:4px 8px">
          <option value="expense" ${r.type === 'expense' ? 'selected' : ''}>❤️ Expense</option>
          <option value="income"  ${r.type === 'income'  ? 'selected' : ''}>💚 Income</option>
        </select>
        <input type="number" class="form-input" id="st-amount-${i}" value="${r.amount}" step="0.01" min="0"
          oninput="updateStmtSummary()" style="font-size:13px;font-weight:700;padding:4px 8px"/>
        <input type="date" class="form-input" id="st-date-${i}" value="${r.date}" style="font-size:12px;padding:4px 8px"/>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <select class="form-input" id="st-cat-${i}" style="font-size:12px;padding:4px 8px">${_makeSrCatOptions(r.category)}</select>
        <input type="text" class="form-input" id="st-desc-${i}" value="${(r.description||'').replace(/"/g,'&quot;')}" placeholder="Description" style="font-size:12px;padding:4px 8px"/>
      </div>
    </div>`).join('');
  wrap.style.display = '';
  updateStmtSummary();
}

function removeStmtResult(i) {
  const card = document.getElementById(`st-card-${i}`);
  if (card) card.style.display = 'none';
  updateStmtSummary();
}

function updateStmtSummary() {
  let totalExpense = 0, totalIncome = 0, count = 0;
  _stmtResults.forEach((_, i) => {
    const card = document.getElementById(`st-card-${i}`);
    if (!card || card.style.display === 'none') return;
    const type   = document.getElementById(`st-type-${i}`)?.value;
    const amount = parseFloat(document.getElementById(`st-amount-${i}`)?.value) || 0;
    if (type === 'expense') totalExpense += amount; else totalIncome += amount;
    count++;
  });
  const el = document.getElementById('stmt-summary');
  if (!el) return;
  if (!count) { el.innerHTML = '<span style="color:var(--text3)">No transactions selected</span>'; return; }
  const parts = [];
  if (totalExpense > 0) parts.push(`<span style="color:#ef4444">💸 Expense: ₹${totalExpense.toLocaleString('en-IN',{minimumFractionDigits:2})}</span>`);
  if (totalIncome  > 0) parts.push(`<span style="color:#10b981">💰 Income: ₹${totalIncome.toLocaleString('en-IN',{minimumFractionDigits:2})}</span>`);
  el.innerHTML = `${parts.join(' &nbsp;·&nbsp; ')} &nbsp;·&nbsp; <span style="color:var(--text2)">${count} transaction${count>1?'s':''}</span>`;
}

function saveAllStmtTx() {
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const toSave  = [];
  _stmtResults.forEach((_, i) => {
    const card = document.getElementById(`st-card-${i}`);
    if (!card || card.style.display === 'none') return;
    const type     = document.getElementById(`st-type-${i}`)?.value;
    const amount   = parseFloat(document.getElementById(`st-amount-${i}`)?.value);
    const date     = document.getElementById(`st-date-${i}`)?.value || today();
    const category = document.getElementById(`st-cat-${i}`)?.value;
    const desc     = document.getElementById(`st-desc-${i}`)?.value?.trim() || '';
    if (!amount || amount <= 0) return;
    const icon = allCats.find(c => c.name === category)?.icon || '💳';
    toSave.push({ id: genId(), type, amount, date, category, icon, description: desc, createdAt: new Date().toISOString() });
  });
  if (!toSave.length) { toast('No valid transactions to save', 'error'); return; }
  STATE.transactions = STATE.transactions || [];
  [...toSave].reverse().forEach(tx => STATE.transactions.unshift(tx));
  saveState();
  if (typeof addXP === 'function') addXP(10 * toSave.length, `${toSave.length} statement transaction${toSave.length>1?'s':''} imported`);
  if (typeof autoSyncGoals === 'function') autoSyncGoals();
  closeModal();
  toast(`${toSave.length} transaction${toSave.length>1?'s':''} imported! 🎉`, 'success');
  refreshFinancePage();
}

// ===== PDF IMPORT =====
let _pdfResults = [];

function openPdfImport() {
  _pdfResults = [];
  openModal('📑 Import PDF Statement', `
    <div style="padding:10px 14px;border-radius:10px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);margin-bottom:14px;font-size:12px;color:var(--text2);line-height:1.6">
      Upload a PDF bank statement from <strong>GPay, PhonePe, SBI, HDFC, ICICI, Axis</strong> or any bank.<br>
      Text is extracted from the PDF and auto-parsed for transactions.
    </div>

    <div class="form-group" style="margin-bottom:12px">
      <label class="form-label">Select PDF file</label>
      <input type="file" id="pdf-file-input" accept=".pdf,application/pdf" class="form-input"
        onchange="handlePdfFileSelect(this)"
        style="padding:10px;cursor:pointer"/>
    </div>

    <div id="pdf-status" style="display:none;font-size:12px;font-weight:600;margin-bottom:12px;padding:8px 12px;border-radius:8px"></div>
    <div id="pdf-progress" style="display:none;margin-bottom:12px">
      <div style="font-size:12px;color:var(--text2);margin-bottom:6px" id="pdf-progress-label">Extracting text…</div>
      <div style="background:var(--glass-border);border-radius:4px;height:6px;overflow:hidden">
        <div id="pdf-progress-bar" style="background:linear-gradient(90deg,#6366f1,#8b5cf6);height:100%;width:0%;transition:width 0.3s"></div>
      </div>
    </div>

    <div class="modal-actions" style="margin-bottom:14px">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
    </div>

    <div id="pdf-results-wrap" style="display:none">
      <div style="height:1px;background:var(--glass-border);margin-bottom:14px"></div>
      <p style="font-size:11px;font-weight:700;color:#00c9a7;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Detected transactions — edit if needed</p>
      <div id="pdf-results-list" style="max-height:45vh;overflow-y:auto;padding-right:2px"></div>
      <div id="pdf-summary" style="margin:12px 0;padding:10px 14px;border-radius:10px;background:rgba(0,201,167,0.08);border:1px solid rgba(0,201,167,0.2);font-size:13px;font-weight:600"></div>
      <button class="btn-primary" onclick="saveAllPdfTx()" style="width:100%;background:linear-gradient(135deg,#00c9a7,#0acf83);padding:12px">💾 Save All Transactions</button>
    </div>`);
}

async function handlePdfFileSelect(input) {
  const file = input.files[0];
  if (!file) return;

  if (typeof pdfjsLib === 'undefined') {
    _showImportStatus('pdf', 'PDF library not loaded yet — please wait a moment and try again.', 'warn');
    return;
  }

  // Show progress
  const prog = document.getElementById('pdf-progress');
  const progBar = document.getElementById('pdf-progress-bar');
  const progLabel = document.getElementById('pdf-progress-label');
  if (prog) prog.style.display = '';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    let fullText = '';

    for (let p = 1; p <= totalPages; p++) {
      if (progLabel) progLabel.textContent = `Reading page ${p} of ${totalPages}…`;
      if (progBar) progBar.style.width = `${(p / totalPages) * 100}%`;
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();

      // Font-height aware line grouping: collect all items with (x, y, height),
      // sort top→bottom then left→right, then group items whose y is within
      // half a line-height of the running row baseline.
      const items = content.items.map(it => ({
        str: (it.str || '').replace(/\s+/g, ' '),
        x: it.transform ? it.transform[4] : 0,
        y: it.transform ? it.transform[5] : 0,
        h: it.height || 10
      })).filter(it => it.str.trim() || it.str === ' ');

      items.sort((a, b) => (b.y - a.y) || (a.x - b.x));

      const rows = [];
      let curRow = [];
      let curY = null;
      let curH = 10;
      items.forEach(it => {
        const tol = Math.max(2, (it.h || curH) * 0.5);
        if (curY === null || Math.abs(curY - it.y) <= tol) {
          curRow.push(it);
          curY = curY === null ? it.y : (curY * curRow.length + it.y) / (curRow.length + 1);
          curH = it.h || curH;
        } else {
          if (curRow.length) rows.push(curRow);
          curRow = [it];
          curY = it.y;
          curH = it.h || 10;
        }
      });
      if (curRow.length) rows.push(curRow);

      const pageLines = rows.map(row =>
        row.sort((a, b) => a.x - b.x).map(i => i.str).join(' ').replace(/\s+/g, ' ').trim()
      ).filter(l => l);

      fullText += pageLines.join('\n') + '\n';
    }

    if (prog) prog.style.display = 'none';

    // Try PhonePe/GPay UPI-statement parser first (most specific)
    _pdfResults = _parseUpiStatementPdf(fullText);

    // Then CSV-style tabular bank statements
    if (!_pdfResults.length) _pdfResults = _parsePdfAsTable(fullText);

    // Last resort: generic statement-text parser
    if (!_pdfResults.length) _pdfResults = _parseStatementText(fullText);

    if (!_pdfResults.length) {
      // Expose first 400 chars of extracted text + total length so the user can
      // share what the PDF actually contained when the parser fails.
      const snippet = (fullText || '').replace(/\s+/g, ' ').slice(0, 400);
      const len = (fullText || '').length;
      console.log('[PDF Import] Extracted text length:', len);
      console.log('[PDF Import] First 2000 chars:\n', (fullText || '').slice(0, 2000));
      _showImportStatus('pdf',
        `No transactions found in ${len.toLocaleString()} chars of extracted text. ` +
        `This PDF may be scanned/image-based, password-protected, or use a layout we don't handle yet. ` +
        `Open the browser console (F12) — the first 2000 chars were logged so you can share them.`, 'warn');
      return;
    }

    renderPdfResults();
    _showImportStatus('pdf', `✅ Found ${_pdfResults.length} transaction${_pdfResults.length > 1 ? 's' : ''} across ${totalPages} page${totalPages > 1 ? 's' : ''}`, 'ok');

  } catch (err) {
    if (prog) prog.style.display = 'none';
    _showImportStatus('pdf', 'Could not read PDF: ' + (err.message || err), 'warn');
  }
}

function _parsePdfAsTable(text) {
  // Many bank statement PDFs have tabular rows like:
  // "05/01/2025  UPI-Swiggy  350.00  Cr  12,500.00"
  // or "05 Jan 2025  NEFT to John  1000.00  Dr  11,500.00"
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const results = [];

  const MONTHS = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};

  function tryParseDate(s) {
    let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) { const yr = m[3].length===2?'20'+m[3]:m[3]; return `${yr}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; }
    m = s.match(/^(\d{1,2})[\s\-]([a-zA-Z]{3,})[\s\-](\d{2,4})$/);
    if (m) { const mo = MONTHS[m[2].toLowerCase().slice(0,3)]; if (mo) { const yr = m[3].length===2?'20'+m[3]:m[3]; return `${yr}-${mo}-${m[1].padStart(2,'0')}`; } }
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return s;
    return null;
  }

  lines.forEach(line => {
    // Must contain a number that looks like a rupee amount
    if (!/[\d,]+\.\d{2}/.test(line)) return;

    // Try to find a date token at the start of the line
    const tokens = line.split(/\s{2,}|\t/); // split on 2+ spaces or tab (column separator)
    if (tokens.length < 3) return;

    const date = tryParseDate(tokens[0].trim());
    if (!date) return;

    // Last token with decimal = balance, second-last or earlier = amount
    const numTokens = tokens.map(t => ({ t, v: parseFloat(t.replace(/,/g,'')) }))
                            .filter(x => !isNaN(x.v) && x.v > 0 && /\d+\.\d{2}/.test(x.t));
    if (numTokens.length < 1) return;

    // Description = middle tokens (skip date, skip trailing numbers)
    const descTokens = tokens.slice(1, tokens.length - numTokens.length);
    const description = descTokens.join(' ').replace(/\s+/g, ' ').trim();
    if (!description || description.length < 2) return;

    // Type: look for Dr/Cr marker
    const lineLo = line.toLowerCase();
    let type = null;
    if (/\bdr\b|debit|withdrawal|paid/.test(lineLo)) type = 'expense';
    else if (/\bcr\b|credit|deposit|received/.test(lineLo)) type = 'income';
    if (!type) type = smsCategoryGuess(lineLo, description.toLowerCase(), null) === 'Salary' ? 'income' : 'expense';

    // Amount = first numeric token after description (not balance)
    const amount = numTokens[0].v;
    if (!amount || amount <= 0) return;

    const lo = description.toLowerCase();
    const category = smsCategoryGuess(lo, lo, type);
    results.push({ type, amount, date, description, category });
  });

  // Deduplicate
  const seen = new Set();
  return results.filter(r => {
    const key = `${r.amount}|${r.date}|${r.description}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Parser specialised for PhonePe / Google Pay PDF statements where each
// transaction has lines like:
//   "May 18, 2026   Paid to Kannan catering services   DEBIT   ₹20"
//   "01:22 pm       Transaction ID T2605..."
//   "               UTR No. 620965608717"
//   "               Paid by 652868XXXXXXXX07"
function _parseUpiStatementPdf(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const results = [];
  const MONTHS = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
    january:'01',february:'02',march:'03',april:'04',june:'06',july:'07',august:'08',september:'09',october:'10',november:'11',december:'12'};

  function parseUpiDate(s) {
    if (!s) return null;
    // "May 18, 2026" / "May 18,2026" / "18 May 2026" / "May 18 2026"
    let m = s.match(/([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (m) { const mo = MONTHS[m[1].toLowerCase().slice(0,3)]; if (mo) return `${m[3]}-${mo}-${m[2].padStart(2,'0')}`; }
    m = s.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
    if (m) { const mo = MONTHS[m[2].toLowerCase().slice(0,3)]; if (mo) return `${m[3]}-${mo}-${m[1].padStart(2,'0')}`; }
    m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (m) { const yr = m[3].length===2?'20'+m[3]:m[3]; return `${yr}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; }
    return null;
  }

  // Match transaction-start markers. Captures: action, name, type, amount (last two optional inline).
  // Covers older "Paid to / Received from" and newer "Sent to / Money received from" wording.
  const TX_RE = /(Paid to|Sent to|Money sent to|Received from|Money received from|Transfer to|Payment to|Mobile recharged|FASTag Recharge for)\s+(.+?)(?:\s+(DEBIT|CREDIT))?(?:\s*(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?))?\s*$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(TX_RE);
    if (!m) continue;

    const action = m[1].toLowerCase();
    let merchant = m[2].trim();
    let type = /received|credited/.test(action) ? 'income' : 'expense';
    let amount = null;

    if (m[3]) type = m[3].toUpperCase() === 'CREDIT' ? 'income' : 'expense';
    if (m[4]) amount = parseFloat(m[4].replace(/,/g,''));

    // If type/amount missing, scan the surrounding window (±5 lines)
    if (!amount || !m[3]) {
      for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 6); j++) {
        if (j === i) continue;
        const near = lines[j];
        if (!amount) {
          const a = near.match(/(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i);
          if (a) { const v = parseFloat(a[1].replace(/,/g,'')); if (v > 0) amount = v; }
        }
        if (!m[3]) {
          if (/\bCREDIT\b/.test(near)) type = 'income';
          else if (/\bDEBIT\b/.test(near)) type = 'expense';
        }
      }
    }

    if (!amount || amount <= 0) continue;

    // Clean trailing DEBIT/CREDIT/₹amount stuck to the name
    merchant = merchant
      .replace(/\s+(DEBIT|CREDIT)\s*₹?\s*[\d,.]*\s*$/i, '')
      .replace(/\s*₹\s*[\d,.]+\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!merchant) continue;

    // Find date — check current line first, then walk backward ±8 lines
    let date = parseUpiDate(line);
    if (!date) {
      for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
        date = parseUpiDate(lines[j]);
        if (date) break;
      }
    }
    if (!date) date = today();

    const lo = merchant.toLowerCase();
    const category = smsCategoryGuess(lo, lo, type);

    // Use Transaction ID (if present in next few lines) as a stable dedupe key
    let txId = null;
    for (let j = i; j < Math.min(lines.length, i + 5); j++) {
      const t = lines[j].match(/Transaction ID\s+(\S+)/i);
      if (t) { txId = t[1]; break; }
    }

    results.push({ type, amount, date, description: merchant, category, _txId: txId });
  }

  // Dedupe by Transaction ID when available, otherwise by amount|date|description
  const seen = new Set();
  return results.filter(r => {
    const key = r._txId || `${r.amount}|${r.date}|${r.description}`;
    if (seen.has(key)) return false;
    seen.add(key);
    delete r._txId;
    return true;
  });
}

function renderPdfResults() {
  const list = document.getElementById('pdf-results-list');
  const wrap = document.getElementById('pdf-results-wrap');
  if (!list || !wrap) return;
  list.innerHTML = _pdfResults.map((r, i) => `
    <div id="pdf-card-${i}" style="background:var(--card-bg);border:1px solid var(--glass-border);border-radius:12px;padding:12px;margin-bottom:10px;position:relative">
      <button onclick="removePdfResult(${i})" title="Remove" style="position:absolute;top:8px;right:10px;background:rgba(239,68,68,0.12);border:none;color:#ef4444;border-radius:6px;cursor:pointer;padding:2px 9px;font-size:13px;line-height:1.6">✕</button>
      <div style="display:grid;grid-template-columns:auto 1fr 1fr;gap:8px;margin-bottom:8px;padding-right:36px">
        <select class="form-input" id="pf-type-${i}" onchange="updatePdfSummary()" style="font-size:12px;padding:4px 8px">
          <option value="expense" ${r.type==='expense'?'selected':''}>❤️ Expense</option>
          <option value="income"  ${r.type==='income' ?'selected':''}>💚 Income</option>
        </select>
        <input type="number" class="form-input" id="pf-amount-${i}" value="${r.amount}" step="0.01" min="0"
          oninput="updatePdfSummary()" style="font-size:13px;font-weight:700;padding:4px 8px"/>
        <input type="date" class="form-input" id="pf-date-${i}" value="${r.date}" style="font-size:12px;padding:4px 8px"/>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <select class="form-input" id="pf-cat-${i}" style="font-size:12px;padding:4px 8px">${_makeSrCatOptions(r.category)}</select>
        <input type="text" class="form-input" id="pf-desc-${i}" value="${(r.description||'').replace(/"/g,'&quot;')}" placeholder="Description" style="font-size:12px;padding:4px 8px"/>
      </div>
    </div>`).join('');
  wrap.style.display = '';
  updatePdfSummary();
}

function removePdfResult(i) {
  const card = document.getElementById(`pdf-card-${i}`);
  if (card) card.style.display = 'none';
  updatePdfSummary();
}

function updatePdfSummary() {
  let totalExpense = 0, totalIncome = 0, count = 0;
  _pdfResults.forEach((_, i) => {
    const card = document.getElementById(`pdf-card-${i}`);
    if (!card || card.style.display === 'none') return;
    const type   = document.getElementById(`pf-type-${i}`)?.value;
    const amount = parseFloat(document.getElementById(`pf-amount-${i}`)?.value) || 0;
    if (type === 'expense') totalExpense += amount; else totalIncome += amount;
    count++;
  });
  const el = document.getElementById('pdf-summary');
  if (!el) return;
  if (!count) { el.innerHTML = '<span style="color:var(--text3)">No transactions selected</span>'; return; }
  const parts = [];
  if (totalExpense > 0) parts.push(`<span style="color:#ef4444">💸 Expense: ₹${totalExpense.toLocaleString('en-IN',{minimumFractionDigits:2})}</span>`);
  if (totalIncome  > 0) parts.push(`<span style="color:#10b981">💰 Income: ₹${totalIncome.toLocaleString('en-IN',{minimumFractionDigits:2})}</span>`);
  el.innerHTML = `${parts.join(' &nbsp;·&nbsp; ')} &nbsp;·&nbsp; <span style="color:var(--text2)">${count} transaction${count>1?'s':''}</span>`;
}

function saveAllPdfTx() {
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : CATEGORIES;
  const toSave  = [];
  _pdfResults.forEach((_, i) => {
    const card = document.getElementById(`pdf-card-${i}`);
    if (!card || card.style.display === 'none') return;
    const type     = document.getElementById(`pf-type-${i}`)?.value;
    const amount   = parseFloat(document.getElementById(`pf-amount-${i}`)?.value);
    const date     = document.getElementById(`pf-date-${i}`)?.value || today();
    const category = document.getElementById(`pf-cat-${i}`)?.value;
    const desc     = document.getElementById(`pf-desc-${i}`)?.value?.trim() || '';
    if (!amount || amount <= 0) return;
    const icon = allCats.find(c => c.name === category)?.icon || '💳';
    toSave.push({ id: genId(), type, amount, date, category, icon, description: desc, createdAt: new Date().toISOString() });
  });
  if (!toSave.length) { toast('No valid transactions to save', 'error'); return; }
  STATE.transactions = STATE.transactions || [];
  [...toSave].reverse().forEach(tx => STATE.transactions.unshift(tx));
  saveState();
  if (typeof addXP === 'function') addXP(10 * toSave.length, `${toSave.length} PDF transaction${toSave.length>1?'s':''} imported`);
  if (typeof autoSyncGoals === 'function') autoSyncGoals();
  closeModal();
  toast(`${toSave.length} transaction${toSave.length>1?'s':''} imported from PDF! 🎉`, 'success');
  refreshFinancePage();
}
