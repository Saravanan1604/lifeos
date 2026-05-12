// ===== FINANCE PAGE =====
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
        <button class="btn-primary btn-sm" onclick="openAddTxModal()">+ Add Transaction</button>
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

      <!-- Recent Transactions -->
      <div class="glass-card" style="overflow:hidden;margin-bottom:20px">
        <div style="padding:16px 20px;border-bottom:1px solid var(--glass-border);display:flex;justify-content:space-between;align-items:center">
          <p class="section-title">Recent Transactions</p>
          <span style="font-size:12px;color:var(--text3)">${txns.length} entries</span>
        </div>
        ${txns.length === 0
          ? `<div class="empty-state"><span class="empty-state-icon">💳</span><p>No transactions yet. Add your first one!</p></div>`
          : txns.slice(0, 10).map(tx => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.04);transition:.2s" onmouseover="this.style.background='rgba(255,255,255,0.04)'" onmouseout="this.style.background=''">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:${tx.type==='income'?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)'};font-size:18px">${tx.icon || '💳'}</div>
              <div>
                <p style="font-size:13px;font-weight:600">${tx.description || tx.category}</p>
                <p style="font-size:11px;color:var(--text3)">${tx.category} · ${fmtDate(tx.date)}</p>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-weight:700;font-size:14px;color:${tx.type==='income'?'#10b981':'#ef4444'}">${tx.type==='income'?'+':'-'}${fmt(tx.amount)}</span>
              <button class="btn-icon btn-sm" onclick="deleteTx('${tx.id}')" style="font-size:13px;color:#ef4444;border-color:rgba(239,68,68,0.3)">✕</button>
            </div>
          </div>`).join('')}
      </div>

    </div>`;

  renderFinanceChart(txns);
  if (topCats.length > 0) renderFinancePieChart(topCats);
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
  renderFinance();
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
    <div class="form-group"><label class="form-label">Last 4 digits of Account No. (optional)</label>
      <input type="text" id="bank-last4" class="form-input" maxlength="4" placeholder="XXXX"/>
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
    <div class="form-group"><label class="form-label">Last 4 digits</label>
      <input type="text" id="bank-last4" class="form-input" maxlength="4" value="${b.lastFour||''}"/>
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

// ===== INVESTMENTS PAGE =====
const INV_TYPES = [
  { key: 'All',           icon: '🏦' },
  { key: 'Mutual Fund',   icon: '📈' },
  { key: 'Stocks',        icon: '📊' },
  { key: 'SIP',           icon: '🔄' },
  { key: 'Fixed Deposit', icon: '🏛️' },
  { key: 'Gold',          icon: '🥇' },
  { key: 'Crypto',        icon: '₿' },
  { key: 'Real Estate',   icon: '🏠' },
  { key: 'PPF / EPF',     icon: '🏢' },
  { key: 'Insurance',     icon: '🛡️' },
  { key: 'Other',         icon: '🗃️' },
];

let invFilter = 'All';

function renderInvestments() {
  const investments = STATE.investments || [];
  const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
  const totalCurrent  = investments.reduce((s, i) => s + (i.currentValue ?? i.amount), 0);
  const totalPnL      = totalCurrent - totalInvested;
  const totalROI      = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : '0.00';

  const filtered = invFilter === 'All' ? investments : investments.filter(i => i.type === invFilter);

  const typeIcon = (t) => INV_TYPES.find(x => x.key === t)?.icon || '📊';

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div><h1 class="page-title">📊 All Assets</h1><p class="page-subtitle">Track your portfolio &amp; all assets</p></div>
        <button class="btn-primary btn-sm" onclick="openAddInvModal()">+ Add Asset</button>
      </div>

      <!-- Summary cards — Kaasu style colored -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px" class="inv-summary-grid">
        <div style="padding:18px 20px;border-radius:18px;background:linear-gradient(135deg,#3b82f6,#2563eb);box-shadow:0 8px 24px rgba(59,130,246,0.35)">
          <p style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Total Invested 💰</p>
          <p style="font-size:22px;font-weight:900;color:#fff">${fmt(totalInvested)}</p>
        </div>
        <div style="padding:18px 20px;border-radius:18px;background:linear-gradient(135deg,#10b981,#059669);box-shadow:0 8px 24px rgba(16,185,129,0.35)">
          <p style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Current Value 💹</p>
          <p style="font-size:22px;font-weight:900;color:#fff">${fmt(totalCurrent)}</p>
        </div>
        <div style="padding:18px 20px;border-radius:18px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);box-shadow:0 8px 24px rgba(139,92,246,0.35)">
          <p style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">P&amp;L 🚀</p>
          <p style="font-size:22px;font-weight:900;color:#fff">${totalPnL >= 0 ? '+' : ''}${fmt(totalPnL)}</p>
        </div>
        <div style="padding:18px 20px;border-radius:18px;background:linear-gradient(135deg,#f59e0b,#d97706);box-shadow:0 8px 24px rgba(245,158,11,0.35)">
          <p style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">ROI 🎯</p>
          <p style="font-size:22px;font-weight:900;color:#fff">${totalROI >= 0 ? '+' : ''}${totalROI}%</p>
        </div>
      </div>

      <!-- Filter tabs -->
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px">
        ${INV_TYPES.map(t => `
          <button onclick="invFilter='${t.key}';renderInvestments()" style="padding:6px 14px;border-radius:20px;border:1px solid ${invFilter===t.key?'rgba(0,201,167,0.5)':'rgba(255,255,255,0.12)'};background:${invFilter===t.key?'rgba(0,201,167,0.18)':'transparent'};color:${invFilter===t.key?'#00c9a7':'var(--text2)'};font-size:12px;font-weight:${invFilter===t.key?700:400};cursor:pointer;transition:.15s">
            ${t.icon} ${t.key}
          </button>`).join('')}
      </div>

      <!-- Table -->
      <div class="glass-card" style="overflow:hidden">
        ${filtered.length === 0
          ? `<div class="empty-state"><span class="empty-state-icon">📈</span><p>${investments.length === 0 ? 'No investments yet. Add your first!' : 'No investments in this category.'}</p></div>`
          : `<div class="table-wrap" style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;min-width:680px">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.08)">
                  <th style="padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">Investment</th>
                  <th style="padding:12px 16px;text-align:right;font-size:12px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">Invested</th>
                  <th style="padding:12px 16px;text-align:right;font-size:12px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">Current Value</th>
                  <th style="padding:12px 16px;text-align:right;font-size:12px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">P&amp;L</th>
                  <th style="padding:12px 16px;text-align:right;font-size:12px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px">ROI</th>
                  <th style="padding:12px 16px;width:60px"></th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(inv => {
                  const curr = inv.currentValue ?? inv.amount;
                  const pnl  = curr - inv.amount;
                  const roi  = inv.amount > 0 ? ((pnl / inv.amount) * 100).toFixed(2) : '0.00';
                  const pos  = pnl >= 0;
                  return `<tr style="border-bottom:1px solid rgba(255,255,255,0.04);transition:.15s" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background=''">
                    <td style="padding:14px 16px">
                      <div style="display:flex;align-items:center;gap:12px">
                        <div style="width:40px;height:40px;border-radius:12px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${typeIcon(inv.type)}</div>
                        <div>
                          <p style="font-weight:700;font-size:14px;color:var(--text)">${inv.name}</p>
                          <p style="font-size:11px;color:var(--text3)">${inv.type}${inv.notes ? ' · ' + inv.notes : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td style="padding:14px 16px;text-align:right;font-size:13px;color:var(--text2)">${fmt(inv.amount)}</td>
                    <td style="padding:14px 16px;text-align:right;font-size:13px;font-weight:600;color:#00c9a7">${fmt(curr)}</td>
                    <td style="padding:14px 16px;text-align:right;font-size:13px;font-weight:700;color:${pos?'#10b981':'#ef4444'}">${pos?'+':''}${fmt(pnl)}</td>
                    <td style="padding:14px 16px;text-align:right;font-size:13px;font-weight:700;color:${pos?'#10b981':'#ef4444'}">${pos?'+':''}${roi}%</td>
                    <td style="padding:14px 16px;text-align:center">
                      <button class="btn-icon btn-sm" onclick="deleteInv('${inv.id}')" style="color:#ef4444;border-color:rgba(239,68,68,0.3)">✕</button>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>`}
      </div>
    </div>`;
}

function openAddInvModal() {
  openModal('Add Investment', `
    <div class="form-group"><label class="form-label">Investment Name</label><input type="text" id="inv-name" class="form-input" placeholder="e.g. Infosys PF, gold, Axis FD"/></div>
    <div class="form-group"><label class="form-label">Asset Type</label>
      <select id="inv-type" class="form-input">
        ${INV_TYPES.filter(t=>t.key!=='All').map(t=>`<option value="${t.key}">${t.icon} ${t.key}</option>`).join('')}
      </select></div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Invested Amount (₹)</label><input type="number" id="inv-amount" class="form-input" placeholder="0"/></div>
      <div class="form-group"><label class="form-label">Current Value (₹)</label><input type="number" id="inv-current" class="form-input" placeholder="Leave blank = same"/></div>
    </div>
    <div class="form-group"><label class="form-label">Notes (optional)</label><input type="text" id="inv-notes" class="form-input" placeholder="e.g. 13 pavun, for gold pledge, int"/></div>
    <div class="form-group"><label class="form-label">Start Date</label><input type="date" id="inv-date" class="form-input" value="${today()}"/></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveInv()">Save Investment</button>
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
  saveState();
  addXP(25, 'Investment added');
  closeModal();
  toast('Investment tracked! +25 XP', 'success');
  renderInvestments();
}

function deleteInv(id) {
  STATE.investments = (STATE.investments || []).filter(i => i.id !== id);
  saveState(); toast('Deleted', 'info'); renderInvestments();
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
