// ╔══════════════════════════════════════════════════════════╗
// ║              atworth PREMIUM FEATURES                     ║
// ║  Command Palette · Heatmap · CSV · Templates · SIP      ║
// ║  Confetti · Recurring · Subscriptions · Export · More   ║
// ╚══════════════════════════════════════════════════════════╝

// ═══════════════════════════════════════════════════════════
// 1. COMMAND PALETTE  (Ctrl+K / Cmd+K)
// ═══════════════════════════════════════════════════════════
const PALETTE_COMMANDS = [
  // ── Navigate ──
  {icon:'📊',label:'Dashboard',          keys:'home overview',         group:'Navigate', fn:()=>navigate('dashboard')},
  {icon:'💰',label:'Finance',            keys:'transactions income expense',group:'Navigate',fn:()=>navigate('finance')},
  {icon:'🏦',label:'Bank Tracker',       keys:'bank balance account',  group:'Navigate', fn:()=>navigate('bank-tracker')},
  {icon:'📋',label:'Budget',             keys:'budget limit spend',    group:'Navigate', fn:()=>navigate('budget')},
  {icon:'📈',label:'Investments',        keys:'invest asset portfolio',group:'Navigate', fn:()=>navigate('investments')},
  {icon:'✅',label:'Habits',             keys:'habits routine daily',  group:'Navigate', fn:()=>navigate('habits')},
  {icon:'🎯',label:'Goals',              keys:'goals target savings',  group:'Navigate', fn:()=>navigate('goals')},
  {icon:'❤️',label:'Health Hub',         keys:'health sleep mood steps',group:'Navigate',fn:()=>navigate('health')},
  {icon:'📝',label:'Journal',            keys:'journal emotion diary', group:'Navigate', fn:()=>navigate('journal')},
  {icon:'🏆',label:'Achievements',       keys:'achievements badges xp',group:'Navigate', fn:()=>navigate('achievements')},
  {icon:'🤖',label:'AI Coach',           keys:'ai coach assistant',    group:'Navigate', fn:()=>navigate('ai-coach')},
  {icon:'⚙️',label:'Settings',           keys:'settings theme name',   group:'Navigate', fn:()=>navigate('settings')},
  {icon:'❓',label:'Help & Support',     keys:'help faq guide support',group:'Navigate', fn:()=>navigate('help')},
  // ── Add ──
  {icon:'💰',label:'Add Income',         keys:'add income salary',     group:'Add', fn:()=>{navigate('finance');setTimeout(()=>openAddTxModal('income'),120);}},
  {icon:'💸',label:'Add Expense',        keys:'add expense spend buy', group:'Add', fn:()=>{navigate('finance');setTimeout(()=>openAddTxModal('expense'),120);}},
  {icon:'📊',label:'Add Budget',         keys:'add budget category',   group:'Add', fn:()=>{navigate('budget');setTimeout(()=>openAddBudgetModal(),120);}},
  {icon:'📈',label:'Add Investment',     keys:'add invest asset stock',group:'Add', fn:()=>{navigate('investments');setTimeout(()=>openAddInvModal(),120);}},
  {icon:'🏦',label:'Add Liability/Loan', keys:'add loan liability emi',group:'Add', fn:()=>{navigate('investments');setTimeout(()=>openAddLoanModal(),120);}},
  {icon:'✅',label:'Add Habit',          keys:'add habit routine',     group:'Add', fn:()=>{navigate('habits');setTimeout(()=>openAddHabitModal(),120);}},
  {icon:'🎯',label:'Add Goal',           keys:'add goal target',       group:'Add', fn:()=>{navigate('goals');setTimeout(()=>openAddGoalModal(),120);}},
  // ── Tools ──
  {icon:'📤',label:'Import CSV / Bank Statement', keys:'import csv upload bank',group:'Tools', fn:()=>{navigate('finance');setTimeout(()=>openCSVImportModal(),120);}},
  {icon:'💾',label:'Export Transactions CSV',     keys:'export download csv',   group:'Tools', fn:()=>exportTransactionsCSV()},
  {icon:'📱',label:'SIP Calculator',              keys:'sip calculator mutual fund return',group:'Tools',fn:()=>{navigate('investments');setTimeout(()=>openSIPCalculator(),120);}},
  {icon:'💳',label:'Debt Payoff Planner',         keys:'debt loan emi payoff',  group:'Tools', fn:()=>{navigate('investments');setTimeout(()=>openDebtPlanner(),120);}},
  {icon:'🧮',label:'Calculator',                  keys:'calculator compute math',group:'Tools',fn:()=>toggleCalculator()},
  {icon:'🌙',label:'Toggle Dark/Light Mode',      keys:'theme dark light mode', group:'Tools', fn:()=>toggleTheme()},
  {icon:'🔄',label:'Manage Recurring Transactions',keys:'recurring repeat auto monthly',group:'Tools',fn:()=>{navigate('finance');setTimeout(()=>openRecurringManager(),120);}},
  {icon:'🗂️',label:'Transaction Templates',       keys:'template quick add fast',group:'Tools',fn:()=>{navigate('finance');setTimeout(()=>openTemplateManager(),120);}},
];

let _paletteCurIdx = 0;

function openCommandPalette() {
  const el = document.getElementById('cmd-palette-overlay');
  if (!el) return;
  el.style.display = 'flex';
  const inp = document.getElementById('cmd-palette-input');
  if (inp) { inp.value = ''; inp.focus(); }
  _renderPaletteList('');
}

function closeCommandPalette() {
  const el = document.getElementById('cmd-palette-overlay');
  if (el) el.style.display = 'none';
}

function _renderPaletteList(q) {
  const ql = q.toLowerCase().trim();
  const hits = ql
    ? PALETTE_COMMANDS.filter(c => c.label.toLowerCase().includes(ql) || c.keys.includes(ql) || c.group.toLowerCase().includes(ql))
    : PALETTE_COMMANDS;

  const GC = { Navigate:'#6366f1', Add:'#10b981', Tools:'#f59e0b' };
  const groups = {};
  hits.forEach(c => { (groups[c.group] = groups[c.group]||[]).push(c); });

  const list = document.getElementById('cmd-palette-list');
  if (!list) return;
  _paletteCurIdx = 0;

  if (!hits.length) {
    list.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text3);font-size:13px">No results for "<b>${q}</b>"</div>`;
    return;
  }
  list.innerHTML = Object.entries(groups).map(([g, cmds]) => `
    <div style="padding:5px 16px 2px;font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:${GC[g]||'#94a3b8'};">${g}</div>
    ${cmds.map(c => {
      const idx = PALETTE_COMMANDS.indexOf(c);
      return `<div class="pal-item" data-idx="${idx}" onclick="executePaletteCmd(${idx})"
        style="display:flex;align-items:center;gap:12px;padding:10px 16px;margin:1px 6px;border-radius:9px;cursor:pointer;transition:.1s"
        onmouseover="this.style.background='rgba(99,102,241,0.14)';_paletteCurIdx=${idx}"
        onmouseout="this.style.background=''">
        <span style="font-size:19px;width:28px;flex-shrink:0;text-align:center">${c.icon}</span>
        <span style="font-size:13px;font-weight:500;color:var(--text);flex:1">${c.label}</span>
        <span style="font-size:10px;color:var(--text3);background:rgba(255,255,255,0.06);padding:2px 8px;border-radius:5px;font-weight:600">${g}</span>
      </div>`;
    }).join('')}`).join('');

  // Highlight first
  const first = list.querySelector('.pal-item');
  if (first) { first.style.background = 'rgba(99,102,241,0.14)'; _paletteCurIdx = +first.dataset.idx; }
}

function executePaletteCmd(idx) {
  closeCommandPalette();
  setTimeout(() => PALETTE_COMMANDS[idx]?.fn(), 60);
}

document.addEventListener('keydown', e => {
  // Open/close
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    const el = document.getElementById('cmd-palette-overlay');
    if (el && el.style.display !== 'none') closeCommandPalette();
    else openCommandPalette();
    return;
  }
  const el = document.getElementById('cmd-palette-overlay');
  if (!el || el.style.display === 'none') return;

  if (e.key === 'Escape') { closeCommandPalette(); return; }
  const items = [...document.querySelectorAll('.pal-item')];
  if (!items.length) return;
  const cur = items.findIndex(i => +i.dataset.idx === _paletteCurIdx);

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const next = Math.min(cur + 1, items.length - 1);
    items.forEach(i => i.style.background = '');
    items[next].style.background = 'rgba(99,102,241,0.14)';
    _paletteCurIdx = +items[next].dataset.idx;
    items[next].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prev = Math.max(cur - 1, 0);
    items.forEach(i => i.style.background = '');
    items[prev].style.background = 'rgba(99,102,241,0.14)';
    _paletteCurIdx = +items[prev].dataset.idx;
    items[prev].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter') {
    executePaletteCmd(_paletteCurIdx);
  }
});


// ═══════════════════════════════════════════════════════════
// 2. CONFETTI + MILESTONE CELEBRATIONS
// ═══════════════════════════════════════════════════════════
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  canvas.style.display = 'block';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const COLORS = ['#00c9a7','#6366f1','#f59e0b','#ef4444','#ec4899','#3b82f6','#10b981','#fbbf24','#a78bfa'];
  const pieces = Array.from({length:180}, () => ({
    x: Math.random()*canvas.width, y: Math.random()*canvas.height*0.3 - canvas.height*0.3,
    w: Math.random()*9+4, h: Math.random()*14+7,
    color: COLORS[Math.floor(Math.random()*COLORS.length)],
    vx:(Math.random()-0.5)*5, vy:Math.random()*5+3,
    rot:Math.random()*360, rv:(Math.random()-0.5)*10, opacity:1
  }));
  let raf;
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let alive = false;
    pieces.forEach(p => {
      if (p.opacity <= 0) return; alive = true;
      p.y += p.vy; p.x += p.vx; p.rot += p.rv;
      if (p.y > canvas.height*0.6) p.opacity = Math.max(0, p.opacity - 0.025);
      ctx.save(); ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI/180);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.roundRect(-p.w/2,-p.h/2,p.w,p.h,2);
      ctx.fill(); ctx.restore();
    });
    if (alive) raf = requestAnimationFrame(draw);
    else { canvas.style.display='none'; ctx.clearRect(0,0,canvas.width,canvas.height); }
  }
  draw();
  setTimeout(() => { cancelAnimationFrame(raf); canvas.style.display='none'; }, 5000);
}

function showMilestoneCelebration(title, sub) {
  launchConfetti();
  const el = document.getElementById('milestone-banner');
  if (!el) return;
  el.innerHTML = `
    <div style="text-align:center">
      <div style="font-size:48px;margin-bottom:8px;animation:bounceIn .5s">🏆</div>
      <p style="font-size:22px;font-weight:900;color:#fff;margin-bottom:4px">${title}</p>
      <p style="font-size:14px;color:rgba(255,255,255,0.75)">${sub}</p>
    </div>`;
  el.style.display = 'flex';
  setTimeout(() => { el.style.opacity='0'; setTimeout(()=>{el.style.display='none';el.style.opacity='1';},500); }, 3500);
}

function showLevelUpBanner(level) {
  launchConfetti();
  const el = document.getElementById('levelup-banner');
  if (!el) return;
  el.innerHTML = `
    <div style="text-align:center">
      <div style="font-size:56px;margin-bottom:6px">⚡</div>
      <p style="font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:4px">LEVEL UP</p>
      <p style="font-size:48px;font-weight:900;color:#fff;line-height:1">Level ${level}</p>
      <p style="font-size:14px;color:rgba(255,255,255,0.7);margin-top:6px">You're on a roll! Keep going 🚀</p>
    </div>`;
  el.style.display = 'flex';
  setTimeout(() => { el.style.opacity='0'; setTimeout(()=>{el.style.display='none';el.style.opacity='1';},500); }, 3000);
}

function checkGoalMilestones() {
  const goals = STATE.goals || [];
  const celebrated = STATE.celebratedGoals || [];
  goals.forEach(g => {
    if (g.current >= g.target && !celebrated.includes(g.id)) {
      showMilestoneCelebration(`🎯 Goal Achieved!`, `"${g.name}" is complete!`);
      addXP(100, `Goal completed: ${g.name}`);
      if (!STATE.celebratedGoals) STATE.celebratedGoals = [];
      STATE.celebratedGoals.push(g.id);
      saveState();
    }
  });
}


// ═══════════════════════════════════════════════════════════
// 3. CSV IMPORT
// ═══════════════════════════════════════════════════════════
let _csvRows = [];

function openCSVImportModal() {
  _csvRows = [];
  openModal('📤 Import Bank Statement (CSV)', `
    <p style="font-size:12px;color:var(--text3);margin-bottom:14px">Supports CSV exports from SBI, HDFC, ICICI, Axis, Kotak, Paytm, PhonePe, GPay and most Indian banks.</p>
    <div id="csv-dropzone" onclick="document.getElementById('csv-file-in').click()"
      style="border:2px dashed rgba(0,201,167,0.35);border-radius:14px;padding:28px;text-align:center;cursor:pointer;transition:.2s;margin-bottom:14px"
      onmouseover="this.style.borderColor='rgba(0,201,167,0.7)'" onmouseout="this.style.borderColor='rgba(0,201,167,0.35)'">
      <div style="font-size:36px;margin-bottom:8px">📄</div>
      <p style="font-size:13px;font-weight:700;color:var(--text)">Click to choose CSV file</p>
      <p style="font-size:11px;color:var(--text3);margin-top:4px">or drag & drop · max 5MB</p>
    </div>
    <input type="file" id="csv-file-in" accept=".csv,.txt" style="display:none" onchange="parseCSVUpload(this)">
    <div id="csv-col-map" style="display:none;margin-bottom:12px">
      <p style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:8px">Map CSV columns:</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px" id="csv-col-selects"></div>
    </div>
    <div id="csv-preview-box"></div>
    <div id="csv-import-actions" style="display:none" class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="doCSVImport()">✅ Import All</button>
    </div>`);

  // Drag & drop
  setTimeout(() => {
    const dz = document.getElementById('csv-dropzone');
    if (!dz) return;
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.style.borderColor='rgba(0,201,167,0.9)'; });
    dz.addEventListener('dragleave', () => dz.style.borderColor='rgba(0,201,167,0.35)');
    dz.addEventListener('drop', e => { e.preventDefault(); dz.style.borderColor='rgba(0,201,167,0.35)'; if (e.dataTransfer.files[0]) _processCSVFile(e.dataTransfer.files[0]); });
  }, 50);
}

function parseCSVUpload(input) { if (input.files[0]) _processCSVFile(input.files[0]); }

function _processCSVFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const lines = e.target.result.split('\n').filter(l => l.trim());
    if (lines.length < 2) { toast('CSV appears empty', 'error'); return; }
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g,''));
    _csvRows = lines.slice(1).map(l => {
      const vals = _parseCSVLine(l);
      const row = {};
      headers.forEach((h,i) => row[h] = (vals[i]||'').trim().replace(/"/g,''));
      return row;
    }).filter(r => Object.values(r).some(v => v));

    // Auto-detect column mapping
    const lower = headers.map(h=>h.toLowerCase());
    const dateCol   = headers[lower.findIndex(h=>h.includes('date'))] || headers[0];
    const descCol   = headers[lower.findIndex(h=>h.includes('desc')||h.includes('narr')||h.includes('particular')||h.includes('remark'))] || headers[1];
    const amtCol    = headers[lower.findIndex(h=>h.includes('amount')||h.includes('amt')||h.includes('debit')||h.includes('credit'))] || headers[2];
    const typeCol   = headers[lower.findIndex(h=>h.includes('type')||h.includes('cr/dr')||h.includes('dr/cr')||h.includes('debit')||h.includes('credit'))];

    // Render column mapping dropdowns
    const sel = (id, val) => `<div class="form-group"><label class="form-label">${id}</label><select class="form-input" id="csv-${id.toLowerCase().replace(' ','-')}">
      <option value="">-- skip --</option>
      ${headers.map(h=>`<option value="${h}" ${h===val?'selected':''}>${h}</option>`).join('')}
    </select></div>`;
    const colMapEl = document.getElementById('csv-col-selects');
    if (colMapEl) colMapEl.innerHTML = sel('Date', dateCol) + sel('Description', descCol) + sel('Amount', amtCol) + sel('Type Column', typeCol||'');
    const mapEl = document.getElementById('csv-col-map');
    if (mapEl) mapEl.style.display = 'block';

    _renderCSVPreview(headers, dateCol, descCol, amtCol);
  };
  reader.readAsText(file);
}

function _parseCSVLine(line) {
  const res = []; let cur = ''; let inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === ',' && !inQ) { res.push(cur); cur = ''; }
    else cur += ch;
  }
  res.push(cur);
  return res;
}

function _renderCSVPreview(headers, dateCol, descCol, amtCol) {
  const preview = _csvRows.slice(0, 5).map(row => {
    const raw = parseFloat((row[amtCol]||'0').replace(/[₹,\s]/g,'').replace(/[()]/g,'')) || 0;
    const isExp = (row[amtCol]||'').match(/dr|debit|\(|\-/i) || raw < 0;
    return `<tr>
      <td style="padding:6px 10px;font-size:11px;color:var(--text3)">${row[dateCol]||'-'}</td>
      <td style="padding:6px 10px;font-size:11px;color:var(--text);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${row[descCol]||'-'}</td>
      <td style="padding:6px 10px;font-size:11px;font-weight:700;color:${isExp?'#ef4444':'#10b981'}">${isExp?'-':'+'}₹${Math.abs(raw).toLocaleString('en-IN')}</td>
    </tr>`;
  }).join('');

  const pb = document.getElementById('csv-preview-box');
  if (pb) pb.innerHTML = `
    <p style="font-size:12px;color:var(--text3);margin-bottom:8px">Preview (first 5 of ${_csvRows.length} rows):</p>
    <div style="overflow:auto;border-radius:10px;border:1px solid var(--glass-border);margin-bottom:4px">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:rgba(255,255,255,0.05)">
          <th style="padding:7px 10px;font-size:10px;text-align:left;color:var(--text3)">Date</th>
          <th style="padding:7px 10px;font-size:10px;text-align:left;color:var(--text3)">Description</th>
          <th style="padding:7px 10px;font-size:10px;text-align:left;color:var(--text3)">Amount</th>
        </tr></thead>
        <tbody>${preview}</tbody>
      </table>
    </div>`;
  const acts = document.getElementById('csv-import-actions');
  if (acts) acts.style.display = 'flex';
}

function doCSVImport() {
  const dateCol = document.getElementById('csv-date')?.value;
  const descCol = document.getElementById('csv-description')?.value;
  const amtCol  = document.getElementById('csv-amount')?.value;
  const typeCol = document.getElementById('csv-type-column')?.value;
  if (!dateCol || !amtCol) { toast('Please map Date and Amount columns', 'error'); return; }

  const allCats = typeof getAllCategories==='function' ? getAllCategories() : [];
  const catNames = allCats.map(c=>c.name);
  let imported = 0, skipped = 0;

  _csvRows.forEach(row => {
    const rawAmt = parseFloat((row[amtCol]||'0').replace(/[₹,\s]/g,'').replace(/[()]/g,''));
    if (!rawAmt || isNaN(rawAmt)) { skipped++; return; }
    const abs = Math.abs(rawAmt);

    // Type detection
    let type = 'expense';
    if (typeCol && row[typeCol]) {
      type = /cr|credit/i.test(row[typeCol]) ? 'income' : 'expense';
    } else if (rawAmt > 0 && !row[amtCol].match(/\(|-/)) {
      type = /salary|income|credit|cr/i.test(row[descCol]||'') ? 'income' : 'expense';
    }

    // Smart category from description
    const desc = (row[descCol]||'').toLowerCase();
    let cat = 'Other';
    if (/salary|payroll|wages/i.test(desc)) cat = 'Salary';
    else if (/zomato|swiggy|food|restau|cafe|hotel|eat/i.test(desc)) cat = 'Food';
    else if (/amazon|flipkart|shop|mall|store/i.test(desc)) cat = 'Shopping';
    else if (/uber|ola|metro|bus|petrol|fuel|fastag/i.test(desc)) cat = 'Transport';
    else if (/rent|house|pg|hostel/i.test(desc)) cat = 'Rent';
    else if (/electricity|water|gas|internet|broadband|postpaid|jio|airtel/i.test(desc)) cat = 'Utilities';
    else if (/netflix|prime|spotify|hotstar|sub/i.test(desc)) cat = 'Entertainment';
    else if (/lic|insurance|premium/i.test(desc)) cat = 'Insurance';
    else if (/emi|loan|equated/i.test(desc)) cat = 'EMI';
    else if (/hospital|pharma|medical|doctor|health/i.test(desc)) cat = 'Health';

    // Parse date — try multiple formats
    let dateStr = today();
    const raw = row[dateCol] || '';
    const cleaned = raw.replace(/['"]/g,'').trim();
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
      dateStr = parsed.toISOString().slice(0,10);
    } else {
      // Try DD/MM/YYYY or DD-MM-YYYY
      const m = cleaned.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (m) {
        const yr = m[3].length===2 ? '20'+m[3] : m[3];
        const d2 = new Date(`${yr}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`);
        if (!isNaN(d2.getTime())) dateStr = d2.toISOString().slice(0,10);
      }
    }

    STATE.transactions = STATE.transactions || [];
    STATE.transactions.push({
      id: genId(), type, amount: abs, date: dateStr,
      category: cat, description: row[descCol]||'Imported', icon: type==='income'?'💰':'💸'
    });
    imported++;
  });

  saveState();
  addXP(imported*2, `Imported ${imported} transactions`);
  closeModal();
  toast(`✅ Imported ${imported} transactions${skipped?' · '+skipped+' skipped':''}`, 'success');
  navigate('finance', true);
}

function exportTransactionsCSV() {
  const txns = STATE.transactions || [];
  if (!txns.length) { toast('No transactions to export', 'warning'); return; }
  const rows = [['Date','Type','Category','Description','Amount'],...txns.map(t=>[t.date,t.type,t.category,t.description||'',t.amount])];
  const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `atworth-transactions-${today()}.csv`; a.click();
  toast('✅ Transactions exported!', 'success');
}


// ═══════════════════════════════════════════════════════════
// 4. TRANSACTION TEMPLATES
// ═══════════════════════════════════════════════════════════
function openTemplateManager() {
  const templates = STATE.txTemplates || [];
  openModal('🗂️ Transaction Templates', `
    <p style="font-size:12px;color:var(--text3);margin-bottom:14px">Save frequent transactions as 1-tap templates.</p>
    <div style="display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto;margin-bottom:14px">
      ${templates.length===0
        ? `<div style="text-align:center;padding:24px;color:var(--text3);font-size:13px">No templates yet.<br>Save a transaction as template to start.</div>`
        : templates.map((t,i)=>`
          <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:var(--glass);border:1px solid var(--glass-border)">
            <span style="font-size:20px">${t.icon||'💳'}</span>
            <div style="flex:1;min-width:0">
              <p style="font-size:13px;font-weight:700;color:var(--text)">${t.name}</p>
              <p style="font-size:11px;color:var(--text3)">${t.category} · ${fmt(t.amount)} · ${t.type}</p>
            </div>
            <button onclick="useTemplate(${i})" style="padding:5px 12px;border-radius:8px;background:rgba(0,201,167,0.15);border:1px solid rgba(0,201,167,0.3);color:#00c9a7;font-size:11px;font-weight:700;cursor:pointer">Use</button>
            <button onclick="deleteTemplate(${i})" style="padding:5px 9px;border-radius:8px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:#ef4444;font-size:12px;cursor:pointer">✕</button>
          </div>`).join('')}
    </div>
    <p style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:8px">Create New Template:</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div class="form-group"><label class="form-label">Name</label><input id="tpl-name" class="form-input" placeholder="e.g. Morning Coffee"/></div>
      <div class="form-group"><label class="form-label">Type</label><select id="tpl-type" class="form-input"><option value="expense">💸 Expense</option><option value="income">💰 Income</option></select></div>
      <div class="form-group"><label class="form-label">Amount (₹)</label><input id="tpl-amount" type="number" class="form-input" placeholder="0"/></div>
      <div class="form-group"><label class="form-label">Category</label>
        <select id="tpl-cat" class="form-input">${(typeof getAllCategories==='function'?getAllCategories():[]).map(c=>`<option>${c.name}</option>`).join('')}</select>
      </div>
      <div class="form-group" style="grid-column:1/-1"><label class="form-label">Description</label><input id="tpl-desc" class="form-input" placeholder="Optional note"/></div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Close</button>
      <button class="btn-primary" onclick="saveTemplate()">💾 Save Template</button>
    </div>`);
}

function saveTemplate() {
  const name = document.getElementById('tpl-name')?.value.trim();
  const type = document.getElementById('tpl-type')?.value;
  const amount = parseFloat(document.getElementById('tpl-amount')?.value);
  const cat = document.getElementById('tpl-cat')?.value;
  const desc = document.getElementById('tpl-desc')?.value.trim();
  if (!name || !amount) { toast('Name and amount are required', 'error'); return; }
  const icons = {Food:'🍔',Shopping:'🛍️',Transport:'🚗',Rent:'🏠',Salary:'💰',Freelance:'💻',Entertainment:'🎬',Utilities:'💡',Health:'💊',EMI:'🏦',Insurance:'🛡️',Other:'💳'};
  STATE.txTemplates = STATE.txTemplates || [];
  STATE.txTemplates.push({ name, type, amount, category:cat, description:desc, icon:icons[cat]||'💳' });
  saveState();
  toast('Template saved!', 'success');
  openTemplateManager();
}

function deleteTemplate(i) {
  STATE.txTemplates = STATE.txTemplates || [];
  STATE.txTemplates.splice(i, 1);
  saveState();
  openTemplateManager();
}

function useTemplate(i) {
  const t = (STATE.txTemplates||[])[i];
  if (!t) return;
  closeModal();
  setTimeout(() => {
    openAddTxModal(t.type);
    setTimeout(() => {
      const amt = document.getElementById('tx-amount'); if (amt) amt.value = t.amount;
      const cat = document.getElementById('tx-cat'); if (cat) cat.value = t.category;
      const desc = document.getElementById('tx-desc'); if (desc) desc.value = t.description||'';
    }, 60);
  }, 80);
}

function saveCurrentAsTxTemplate() {
  const type = document.getElementById('tx-type')?.value;
  const amount = parseFloat(document.getElementById('tx-amount')?.value);
  const cat = document.getElementById('tx-cat')?.value;
  const desc = document.getElementById('tx-desc')?.value.trim();
  if (!amount) { toast('Enter amount first', 'error'); return; }
  const icons = {Food:'🍔',Shopping:'🛍️',Transport:'🚗',Rent:'🏠',Salary:'💰',Freelance:'💻',Entertainment:'🎬',Utilities:'💡',Health:'💊',EMI:'🏦',Insurance:'🛡️',Other:'💳'};
  STATE.txTemplates = STATE.txTemplates || [];
  STATE.txTemplates.push({ name:desc||cat, type, amount, category:cat, description:desc, icon:icons[cat]||'💳' });
  saveState();
  toast('✅ Saved as template!', 'success');
}


// ═══════════════════════════════════════════════════════════
// 5. RECURRING TRANSACTIONS
// ═══════════════════════════════════════════════════════════
function openRecurringManager() {
  const recs = STATE.recurringTx || [];
  const freqLabels = { daily:'Daily', weekly:'Weekly', monthly:'Monthly', yearly:'Yearly' };
  openModal('🔄 Recurring Transactions', `
    <p style="font-size:12px;color:var(--text3);margin-bottom:14px">Auto-add transactions on a schedule. Processed when you open the app.</p>
    <div style="display:flex;flex-direction:column;gap:8px;max-height:250px;overflow-y:auto;margin-bottom:14px">
      ${recs.length===0
        ? `<div style="text-align:center;padding:24px;color:var(--text3);font-size:13px">No recurring transactions. Set up your salary, rent, EMI etc.</div>`
        : recs.map((r,i)=>`
          <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:var(--glass);border:1px solid var(--glass-border)">
            <div style="width:36px;height:36px;border-radius:10px;background:${r.type==='income'?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)'};display:flex;align-items:center;justify-content:center;font-size:17px">${r.icon||'🔄'}</div>
            <div style="flex:1;min-width:0">
              <p style="font-size:13px;font-weight:700;color:var(--text)">${r.description||r.category}</p>
              <p style="font-size:11px;color:var(--text3)">${freqLabels[r.frequency]||r.frequency} · ${fmt(r.amount)} · Next: ${r.nextDate}</p>
            </div>
            <span style="font-size:12px;font-weight:700;color:${r.type==='income'?'#10b981':'#ef4444'}">${r.type==='income'?'+':'-'}${fmt(r.amount)}</span>
            <button onclick="deleteRecurring(${i})" style="padding:5px 9px;border-radius:8px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:#ef4444;font-size:12px;cursor:pointer">✕</button>
          </div>`).join('')}
    </div>
    <p style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:8px">New Recurring:</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div class="form-group"><label class="form-label">Type</label><select id="rec-type" class="form-input"><option value="expense">💸 Expense</option><option value="income">💰 Income</option></select></div>
      <div class="form-group"><label class="form-label">Frequency</label>
        <select id="rec-freq" class="form-input"><option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="yearly">Yearly</option><option value="daily">Daily</option></select>
      </div>
      <div class="form-group"><label class="form-label">Amount (₹)</label><input id="rec-amt" type="number" class="form-input" placeholder="0"/></div>
      <div class="form-group"><label class="form-label">Start Date</label><input id="rec-date" type="date" class="form-input" value="${today()}"/></div>
      <div class="form-group"><label class="form-label">Category</label>
        <select id="rec-cat" class="form-input">${(typeof getAllCategories==='function'?getAllCategories():[]).map(c=>`<option>${c.name}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">Description</label><input id="rec-desc" class="form-input" placeholder="e.g. Netflix, Rent"/></div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Close</button>
      <button class="btn-primary" onclick="saveRecurring()">💾 Save Recurring</button>
    </div>`);
}

function saveRecurring() {
  const type = document.getElementById('rec-type')?.value;
  const freq = document.getElementById('rec-freq')?.value;
  const amount = parseFloat(document.getElementById('rec-amt')?.value);
  const startDate = document.getElementById('rec-date')?.value;
  const cat = document.getElementById('rec-cat')?.value;
  const desc = document.getElementById('rec-desc')?.value.trim();
  if (!amount || !startDate) { toast('Amount and start date required', 'error'); return; }
  const icons = {Food:'🍔',Rent:'🏠',Salary:'💰',Entertainment:'🎬',Utilities:'💡',EMI:'🏦',Insurance:'🛡️',Freelance:'💻'};
  STATE.recurringTx = STATE.recurringTx || [];
  STATE.recurringTx.push({ id:genId(), type, frequency:freq, amount, nextDate:startDate, category:cat, description:desc, icon:icons[cat]||'🔄' });
  saveState();
  toast('✅ Recurring transaction saved!', 'success');
  openRecurringManager();
}

function deleteRecurring(i) {
  STATE.recurringTx = STATE.recurringTx || [];
  STATE.recurringTx.splice(i, 1);
  saveState();
  openRecurringManager();
}

function processRecurringTransactions() {
  const recs = STATE.recurringTx || [];
  const todayStr = today();
  let added = 0;
  recs.forEach(r => {
    while (r.nextDate <= todayStr) {
      STATE.transactions = STATE.transactions || [];
      STATE.transactions.push({ id:genId(), type:r.type, amount:r.amount, date:r.nextDate, category:r.category, description:(r.description||r.category)+' (auto)', icon:r.icon||'🔄' });
      added++;
      r.nextDate = _advanceDate(r.nextDate, r.frequency);
    }
  });
  if (added > 0) { saveState(); toast(`🔄 ${added} recurring transaction${added>1?'s':''} auto-added`, 'info'); }
}

function _advanceDate(dateStr, freq) {
  const d = new Date(dateStr + 'T00:00:00');
  if (freq==='daily')   d.setDate(d.getDate()+1);
  if (freq==='weekly')  d.setDate(d.getDate()+7);
  if (freq==='monthly') d.setMonth(d.getMonth()+1);
  if (freq==='yearly')  d.setFullYear(d.getFullYear()+1);
  return d.toISOString().slice(0,10);
}


// ═══════════════════════════════════════════════════════════
// 6. SIP CALCULATOR
// ═══════════════════════════════════════════════════════════
function openSIPCalculator() {
  openModal('📱 SIP Calculator', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group"><label class="form-label">Monthly Investment (₹)</label><input id="sip-amt" type="number" class="form-input" placeholder="5000" oninput="calcSIP()"/></div>
      <div class="form-group"><label class="form-label">Expected Annual Return (%)</label><input id="sip-rate" type="number" class="form-input" placeholder="12" value="12" step="0.1" oninput="calcSIP()"/></div>
      <div class="form-group"><label class="form-label">Duration (Years)</label><input id="sip-years" type="number" class="form-input" placeholder="10" value="10" oninput="calcSIP()"/></div>
      <div class="form-group"><label class="form-label">Investment Type</label>
        <select id="sip-type" class="form-input" onchange="calcSIP()">
          <option value="sip">SIP (Monthly)</option>
          <option value="lumpsum">Lumpsum (One-time)</option>
        </select>
      </div>
    </div>
    <div id="sip-result" style="margin:16px 0;padding:18px;border-radius:14px;background:linear-gradient(135deg,rgba(0,201,167,0.12),rgba(99,102,241,0.08));border:1px solid rgba(0,201,167,0.25);text-align:center">
      <p style="font-size:12px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Enter values above to calculate</p>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Close</button>
      <button class="btn-primary" onclick="addSIPAsInvestment()">➕ Add as Investment</button>
    </div>`);
  calcSIP();
}

function calcSIP() {
  const amt = parseFloat(document.getElementById('sip-amt')?.value)||0;
  const rate = parseFloat(document.getElementById('sip-rate')?.value)||12;
  const years = parseFloat(document.getElementById('sip-years')?.value)||10;
  const type = document.getElementById('sip-type')?.value||'sip';
  const el = document.getElementById('sip-result');
  if (!el || !amt) return;

  let maturity, invested, gains;
  if (type === 'sip') {
    const n = years*12, r = rate/100/12;
    maturity = r>0 ? amt * (((Math.pow(1+r,n)-1)/r) * (1+r)) : amt*n;
    invested = amt*n;
  } else {
    maturity = amt * Math.pow(1+rate/100, years);
    invested = amt;
  }
  gains = maturity - invested;
  const fmt2 = v => v>=10000000?`₹${(v/10000000).toFixed(2)}Cr`:v>=100000?`₹${(v/100000).toFixed(2)}L`:v>=1000?`₹${(v/1000).toFixed(1)}k`:`₹${Math.round(v).toLocaleString('en-IN')}`;
  const pct = invested>0?((gains/invested)*100).toFixed(1):0;

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px">
      <div><p style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.8px">Invested</p><p style="font-size:18px;font-weight:900;color:#f59e0b">${fmt2(invested)}</p></div>
      <div><p style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.8px">Est. Gains</p><p style="font-size:18px;font-weight:900;color:#10b981">+${fmt2(gains)}</p></div>
      <div><p style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.8px">Maturity</p><p style="font-size:18px;font-weight:900;color:#00c9a7">${fmt2(maturity)}</p></div>
    </div>
    <div style="height:8px;border-radius:8px;background:rgba(255,255,255,0.1);overflow:hidden;margin-bottom:8px">
      <div style="height:8px;border-radius:8px;width:${Math.min(100,(invested/maturity*100)).toFixed(1)}%;background:linear-gradient(90deg,#f59e0b,#fbbf24)"></div>
    </div>
    <p style="font-size:12px;color:var(--text3)">Returns: <b style="color:#10b981">+${pct}%</b> · Wealth ratio: <b style="color:#00c9a7">${(maturity/invested).toFixed(2)}x</b></p>`;
}

function addSIPAsInvestment() {
  const amt = parseFloat(document.getElementById('sip-amt')?.value)||0;
  const rate = parseFloat(document.getElementById('sip-rate')?.value)||12;
  const years = parseFloat(document.getElementById('sip-years')?.value)||10;
  const type = document.getElementById('sip-type')?.value||'sip';
  if (!amt) { toast('Enter amount first', 'error'); return; }
  const label = type==='sip'?`SIP ₹${amt}/mo @${rate}% for ${years}y`:`Lumpsum ₹${amt} @${rate}% for ${years}y`;
  STATE.investments = STATE.investments || [];
  STATE.investments.push({ id:genId(), name:label, type:type==='sip'?'SIP':'Mutual Fund', amount:amt*(type==='sip'?years*12:1), currentValue:amt*(type==='sip'?years*12:1), date:today(), icon:'📱' });
  saveState();
  closeModal();
  toast('✅ Added as investment!', 'success');
  navigate('investments', true);
}


// ═══════════════════════════════════════════════════════════
// 7. DEBT PAYOFF PLANNER
// ═══════════════════════════════════════════════════════════
function openDebtPlanner() {
  const loans = (STATE.investments||[]).filter(i=>i.type==='Loan'||i.type==='EMI'||i.type==='Credit Card');
  openModal('💳 Debt Payoff Planner', `
    <p style="font-size:12px;color:var(--text3);margin-bottom:14px">Compare Snowball (smallest debt first) vs Avalanche (highest interest first) strategies.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <div class="form-group"><label class="form-label">Total Debt (₹)</label><input id="dp-debt" type="number" class="form-input" placeholder="${(loans.reduce((s,l)=>s+(l.amount||0),0))||50000}" oninput="calcDebtPayoff()"/></div>
      <div class="form-group"><label class="form-label">Monthly Payment (₹)</label><input id="dp-payment" type="number" class="form-input" placeholder="5000" oninput="calcDebtPayoff()"/></div>
      <div class="form-group"><label class="form-label">Annual Interest Rate (%)</label><input id="dp-rate" type="number" class="form-input" placeholder="18" value="18" step="0.1" oninput="calcDebtPayoff()"/></div>
      <div class="form-group"><label class="form-label">Extra Monthly Payment (₹)</label><input id="dp-extra" type="number" class="form-input" placeholder="0" value="0" oninput="calcDebtPayoff()"/></div>
    </div>
    <div id="dp-result"></div>
    <div class="modal-actions"><button class="btn-secondary" onclick="closeModal()">Close</button></div>`);
  calcDebtPayoff();
}

function calcDebtPayoff() {
  const debt = parseFloat(document.getElementById('dp-debt')?.value)||0;
  const payment = parseFloat(document.getElementById('dp-payment')?.value)||0;
  const rate = parseFloat(document.getElementById('dp-rate')?.value)||18;
  const extra = parseFloat(document.getElementById('dp-extra')?.value)||0;
  const el = document.getElementById('dp-result');
  if (!el||!debt||!payment) return;

  const r = rate/100/12;
  // Months without extra
  const m1 = r>0 ? Math.ceil(Math.log(payment/(payment-r*debt)) / Math.log(1+r)) : Math.ceil(debt/payment);
  const interest1 = payment*m1 - debt;
  // Months with extra
  const totalPayment = payment + extra;
  const m2 = r>0 ? Math.ceil(Math.log(totalPayment/(totalPayment-r*debt)) / Math.log(1+r)) : Math.ceil(debt/totalPayment);
  const interest2 = totalPayment*m2 - debt;
  const saved = Math.max(0, interest1 - interest2);
  const monthsSaved = m1 - m2;

  const fmt2 = v => `₹${Math.abs(v).toLocaleString('en-IN',{maximumFractionDigits:0})}`;

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div style="padding:14px;border-radius:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2)">
        <p style="font-size:11px;font-weight:700;color:#ef4444;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">Current Plan</p>
        <p style="font-size:22px;font-weight:900;color:var(--text)">${m1} months</p>
        <p style="font-size:11px;color:var(--text3)">Total interest: <b style="color:#ef4444">${fmt2(Math.max(0,interest1))}</b></p>
        <p style="font-size:11px;color:var(--text3)">Total paid: ${fmt2(payment*m1)}</p>
      </div>
      <div style="padding:14px;border-radius:12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2)">
        <p style="font-size:11px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">With Extra ${fmt2(extra)}</p>
        <p style="font-size:22px;font-weight:900;color:var(--text)">${m2} months</p>
        <p style="font-size:11px;color:var(--text3)">Total interest: <b style="color:#10b981">${fmt2(Math.max(0,interest2))}</b></p>
        <p style="font-size:11px;color:var(--text3)">Total paid: ${fmt2(totalPayment*m2)}</p>
      </div>
    </div>
    ${extra>0?`<div style="margin-top:12px;padding:12px 16px;border-radius:10px;background:rgba(0,201,167,0.09);border:1px solid rgba(0,201,167,0.25);text-align:center">
      <p style="font-size:13px;font-weight:700;color:#00c9a7">💡 Extra ${fmt2(extra)}/month saves you <b>${fmt2(saved)}</b> in interest and pays off <b>${monthsSaved} months early!</b></p>
    </div>`:''}`;
}


// ═══════════════════════════════════════════════════════════
// 8. SPENDING HEATMAP
// ═══════════════════════════════════════════════════════════
function renderSpendingHeatmap(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const txns = (STATE.transactions||[]).filter(t=>t.type==='expense');
  const dayMap = {};
  txns.forEach(t => { dayMap[t.date] = (dayMap[t.date]||0) + t.amount; });
  const max = Math.max(...Object.values(dayMap), 1);

  // Build last 365 days
  const days = [];
  for (let i=364; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const k = d.toISOString().slice(0,10);
    days.push({ date:k, amount:dayMap[k]||0, day:d.getDay(), label:d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) });
  }

  const months = []; let lastMonth = -1;
  days.forEach((d,i) => {
    const m = new Date(d.date).getMonth();
    if (m !== lastMonth) { months.push({label:new Date(d.date).toLocaleString('default',{month:'short'}), col:Math.floor(i/7)}); lastMonth=m; }
  });

  const getColor = (amt) => {
    if (!amt) return 'rgba(255,255,255,0.05)';
    const ratio = Math.min(amt/max, 1);
    if (ratio < 0.25) return 'rgba(239,68,68,0.3)';
    if (ratio < 0.5)  return 'rgba(239,68,68,0.55)';
    if (ratio < 0.75) return 'rgba(239,68,68,0.8)';
    return '#ef4444';
  };

  // Group into weeks
  const weeks = [];
  for (let i=0; i<days.length; i+=7) weeks.push(days.slice(i,i+7));

  el.innerHTML = `
    <div style="overflow-x:auto;padding-bottom:4px">
      <div style="position:relative;min-width:660px">
        <div style="display:flex;gap:2px;margin-bottom:6px;padding-left:28px">
          ${months.map(m=>`<div style="position:absolute;left:${28+m.col*13}px;font-size:9px;color:var(--text3);white-space:nowrap">${m.label}</div>`).join('')}
        </div>
        <div style="display:flex;gap:2px;margin-top:18px">
          <div style="display:flex;flex-direction:column;gap:2px;margin-right:4px">
            ${['','M','','W','','F',''].map(d=>`<div style="height:11px;font-size:8px;color:var(--text3);line-height:11px">${d}</div>`).join('')}
          </div>
          ${weeks.map(week=>`
            <div style="display:flex;flex-direction:column;gap:2px">
              ${week.map(d=>`
                <div title="${d.label}: ${d.amount?fmt(d.amount):'No spending'}"
                  style="width:11px;height:11px;border-radius:2px;background:${getColor(d.amount)};cursor:pointer;transition:.1s"
                  onmouseover="showHeatmapTip(this,'${d.label}: ${d.amount?'₹'+Math.round(d.amount).toLocaleString('en-IN'):'No spending'}')"
                  onmouseout="hideHeatmapTip()"></div>`).join('')}
            </div>`).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:10px;justify-content:flex-end">
          <span style="font-size:10px;color:var(--text3)">Less</span>
          ${['rgba(255,255,255,0.05)','rgba(239,68,68,0.3)','rgba(239,68,68,0.55)','rgba(239,68,68,0.8)','#ef4444'].map(c=>`<div style="width:11px;height:11px;border-radius:2px;background:${c}"></div>`).join('')}
          <span style="font-size:10px;color:var(--text3)">More</span>
        </div>
      </div>
    </div>
    <div id="heatmap-tip" style="position:fixed;background:rgba(10,14,30,0.95);border:1px solid rgba(0,201,167,0.3);color:#e2e8f0;font-size:11px;padding:6px 10px;border-radius:7px;pointer-events:none;display:none;z-index:9999;white-space:nowrap"></div>`;
}

function showHeatmapTip(el, text) {
  const tip = document.getElementById('heatmap-tip');
  if (!tip) return;
  const r = el.getBoundingClientRect();
  tip.textContent = text;
  tip.style.left = (r.left + 16) + 'px';
  tip.style.top = (r.top - 32) + 'px';
  tip.style.display = 'block';
}

function hideHeatmapTip() {
  const tip = document.getElementById('heatmap-tip');
  if (tip) tip.style.display = 'none';
}


// ═══════════════════════════════════════════════════════════
// 9. WEEKLY SUMMARY CARD HTML
// ═══════════════════════════════════════════════════════════
function buildWeeklySummaryHTML() {
  const txns = STATE.transactions || [];
  const now = new Date();
  const dow = (now.getDay()+6)%7; // Mon=0
  const weekStart = new Date(now); weekStart.setDate(now.getDate()-dow); weekStart.setHours(0,0,0,0);
  const prevStart = new Date(weekStart); prevStart.setDate(weekStart.getDate()-7);

  const inRange = (t, from, to) => { const d=new Date(t.date+'T00:00:00'); return d>=from && d<to; };
  const thisWeek = txns.filter(t=>inRange(t,weekStart,now));
  const lastWeek = txns.filter(t=>inRange(t,prevStart,weekStart));

  const inc  = arr => arr.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const exp  = arr => arr.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const tInc=inc(thisWeek),tExp=exp(thisWeek),lInc=inc(lastWeek),lExp=exp(lastWeek);
  const delta=(a,b)=>b>0?((a-b)/b*100).toFixed(1):null;
  const expDelta=delta(tExp,lExp), incDelta=delta(tInc,lInc);
  const badge=(v,invert=false)=>{ if(!v) return ''; const pos=(parseFloat(v)>0)!==invert; return `<span style="font-size:10px;font-weight:700;color:${pos?'#10b981':'#ef4444'}">${parseFloat(v)>0?'↑':'↓'}${Math.abs(v)}%</span>`; };

  // Top category this week
  const catMap={};
  thisWeek.filter(t=>t.type==='expense').forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+t.amount;});
  const topCat=Object.entries(catMap).sort(([,a],[,b])=>b-a)[0];

  return `
  <div class="glass-card" style="padding:18px;margin-bottom:20px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:16px">📅</span>
        <p style="font-size:14px;font-weight:800;color:var(--text)">This Week</p>
        <span style="font-size:11px;color:var(--text3)">${weekStart.toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – Today</span>
      </div>
      <span style="font-size:11px;color:var(--text3)">${thisWeek.length} transactions</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
      <div style="padding:12px;border-radius:12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2)">
        <p style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.7px;margin-bottom:4px">Income</p>
        <p style="font-size:18px;font-weight:900;color:#10b981">${fmt(tInc)}</p>
        ${badge(incDelta)}
      </div>
      <div style="padding:12px;border-radius:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2)">
        <p style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.7px;margin-bottom:4px">Spent</p>
        <p style="font-size:18px;font-weight:900;color:#ef4444">${fmt(tExp)}</p>
        ${badge(expDelta,true)}
      </div>
      <div style="padding:12px;border-radius:12px;background:rgba(0,201,167,0.08);border:1px solid rgba(0,201,167,0.2)">
        <p style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.7px;margin-bottom:4px">Saved</p>
        <p style="font-size:18px;font-weight:900;color:${tInc-tExp>=0?'#00c9a7':'#ef4444'}">${fmt(Math.abs(tInc-tExp))}</p>
        <span style="font-size:10px;color:${tInc-tExp>=0?'#00c9a7':'#ef4444'};font-weight:700">${tInc-tExp>=0?'Surplus':'Deficit'}</span>
      </div>
    </div>
    ${topCat?`<div style="margin-top:10px;padding:8px 12px;border-radius:9px;background:rgba(255,255,255,0.04);display:flex;align-items:center;gap:8px">
      <span style="font-size:11px;color:var(--text3)">Top spend:</span>
      <span style="font-size:12px;font-weight:700;color:var(--text)">${topCat[0]}</span>
      <span style="font-size:12px;font-weight:700;color:#ef4444;margin-left:auto">${fmt(topCat[1])}</span>
    </div>`:''}
  </div>`;
}


// ═══════════════════════════════════════════════════════════
// 10. DAILY FINANCIAL CHALLENGE
// ═══════════════════════════════════════════════════════════
const DAILY_CHALLENGES = [
  {icon:'☕',title:'Coffee Budget',text:'Keep food spend under ₹300 today.',target:'food',limit:300},
  {icon:'🚗',title:'No Cab Day',text:'Avoid cab/Uber spend today. Walk or take public transport.',target:'transport',limit:0},
  {icon:'📝',title:'Log Everything',text:'Add every expense you make today — even small ones.',target:'log',limit:0},
  {icon:'💰',title:'Save 20%',text:'If you receive income today, save at least 20% of it immediately.',target:'save',limit:0},
  {icon:'🍱',title:'Cook at Home',text:'No food delivery today. Cook at home and save!',target:'food_delivery',limit:0},
  {icon:'🛍️',title:'No-Buy Day',text:'No shopping or impulse purchases today.',target:'shopping',limit:0},
  {icon:'💡',title:'Review Budget',text:'Check your budget page and see where you\'re overspending.',target:'visit',page:'budget'},
  {icon:'🎯',title:'Goal Progress',text:'Add any amount towards one of your savings goals.',target:'goal',limit:0},
  {icon:'📊',title:'Track Net Worth',text:'Update your bank balance and check your net worth.',target:'visit',page:'bank-tracker'},
  {icon:'🔄',title:'Set Up Recurring',text:'Automate one recurring expense or income this week.',target:'recurring',limit:0},
  {icon:'💳',title:'Pay Down Debt',text:'Make any extra payment on a loan or credit card.',target:'debt',limit:0},
  {icon:'🏆',title:'Savings Streak',text:'Transfer any amount to savings today to keep your streak alive.',target:'save',limit:0},
  {icon:'📱',title:'Run SIP Calc',text:'Calculate how much your current SIP grows in 10 years.',target:'calc',page:'investments'},
  {icon:'❤️',title:'Health = Wealth',text:'Log your health metrics today — mind & body matter!',target:'visit',page:'health'},
  {icon:'✅',title:'Habit Warrior',text:'Complete all your habits today for maximum XP.',target:'habits',limit:0},
];

function buildDailyChallengeHTML() {
  const todayStr = today();
  const seed = todayStr.replace(/-/g,'').split('').reduce((a,c)=>a*31+c.charCodeAt(0),0);
  const ch = DAILY_CHALLENGES[seed % DAILY_CHALLENGES.length];
  const completed = (STATE.challengeLog || {})[todayStr];

  return `
  <div class="glass-card" style="padding:16px 18px;margin-bottom:20px;border:1px solid ${completed?'rgba(16,185,129,0.3)':'rgba(245,158,11,0.25)'};background:${completed?'rgba(16,185,129,0.06)':'rgba(245,158,11,0.05)'}">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:42px;height:42px;border-radius:12px;background:${completed?'rgba(16,185,129,0.2)':'rgba(245,158,11,0.2)'};display:flex;align-items:center;justify-content:center;font-size:21px;flex-shrink:0">${completed?'✅':ch.icon}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
          <p style="font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${completed?'#10b981':'#f59e0b'}">Daily Challenge</p>
          ${completed?'<span style="font-size:10px;background:rgba(16,185,129,0.2);color:#10b981;padding:1px 7px;border-radius:10px;font-weight:700">Completed +25 XP</span>':''}
        </div>
        <p style="font-size:13px;font-weight:700;color:var(--text)">${ch.title}</p>
        <p style="font-size:11px;color:var(--text3)">${ch.text}</p>
      </div>
      ${completed?'':`<button onclick="completeChallenge('${todayStr}')" style="padding:7px 14px;border-radius:20px;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.35);color:#f59e0b;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0">Mark Done ✓</button>`}
    </div>
  </div>`;
}

function completeChallenge(dateStr) {
  STATE.challengeLog = STATE.challengeLog || {};
  STATE.challengeLog[dateStr] = true;
  addXP(25, 'Daily challenge completed');
  saveState();
  navigate('dashboard', true);
  toast('🏆 Daily challenge completed! +25 XP', 'success');
}


// ═══════════════════════════════════════════════════════════
// 11. SAVINGS PROJECTION
// ═══════════════════════════════════════════════════════════
function buildSavingsProjectionHTML() {
  const txns = STATE.transactions || [];
  const now = new Date();
  // Last 3 months avg savings
  let totalSavings = 0, months = 0;
  for (let i = 0; i < 3; i++) {
    const yr = now.getFullYear(), mn = now.getMonth() - i;
    const d = new Date(yr, mn, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const mTxns = txns.filter(t => t.date.startsWith(key));
    const inc = mTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const exp = mTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    if (inc > 0 || exp > 0) { totalSavings += (inc-exp); months++; }
  }
  const avgMonthlySavings = months > 0 ? totalSavings/months : 0;
  if (avgMonthlySavings <= 0) return '';

  const proj = [3,6,12].map(m => ({ months:m, amount: avgMonthlySavings*m }));
  const maxP = Math.max(...proj.map(p=>p.amount));
  const fmt2 = v => v>=100000?`₹${(v/100000).toFixed(1)}L`:v>=1000?`₹${(v/1000).toFixed(0)}k`:`₹${Math.round(v).toLocaleString('en-IN')}`;

  return `
  <div class="glass-card" style="padding:18px;margin-bottom:20px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
      <span style="font-size:16px">🔮</span>
      <p style="font-size:14px;font-weight:800;color:var(--text)">Savings Projection</p>
      <span style="font-size:11px;color:var(--text3)">at ${fmt2(avgMonthlySavings)}/month avg</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${proj.map(p=>`
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:11px;color:var(--text3);width:50px;flex-shrink:0">${p.months} months</span>
          <div style="flex:1;height:8px;border-radius:6px;background:rgba(255,255,255,0.07);overflow:hidden">
            <div style="height:8px;border-radius:6px;width:${(p.amount/maxP*100).toFixed(1)}%;background:linear-gradient(90deg,#00c9a7,#6366f1);transition:.5s;box-shadow:0 0 8px rgba(0,201,167,0.4)"></div>
          </div>
          <span style="font-size:13px;font-weight:900;color:#00c9a7;width:62px;text-align:right;flex-shrink:0">${fmt2(p.amount)}</span>
        </div>`).join('')}
    </div>
    <p style="font-size:10px;color:var(--text3);margin-top:10px">* Based on last ${months} month${months!==1?'s':''} avg savings. Invest it for higher returns →
      <span onclick="navigate('investments')" style="color:#00c9a7;cursor:pointer;text-decoration:underline">View Investments</span>
    </p>
  </div>`;
}


// ═══════════════════════════════════════════════════════════
// 12. BUDGET WARNING HELPER
// ═══════════════════════════════════════════════════════════
function getBudgetWarnings() {
  const budgets = STATE.budgets || [];
  const txns = STATE.transactions || [];
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const monthExp = txns.filter(t => t.type==='expense' && t.date.startsWith(monthStr));
  const spent = {};
  monthExp.forEach(t => { const k=(t.category||'').toLowerCase(); spent[k]=(spent[k]||0)+t.amount; });

  return budgets.map(b => {
    const limit = b.amount ?? b.limit ?? 0;
    const used = spent[(b.category||'').toLowerCase()] || 0;
    const pct = limit>0 ? Math.round(used/limit*100) : 0;
    return { category:b.category, limit, used, pct, over:pct>100, warn:pct>=80&&pct<=100 };
  }).filter(b => b.warn || b.over);
}

function buildBudgetWarningHTML() {
  const warnings = getBudgetWarnings();
  if (!warnings.length) return '';
  return `
  <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:18px">
    ${warnings.map(w=>`
      <div onclick="navigate('budget')" style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;background:${w.over?'rgba(239,68,68,0.1)':'rgba(245,158,11,0.08)'};border:1px solid ${w.over?'rgba(239,68,68,0.3)':'rgba(245,158,11,0.25)'};cursor:pointer">
        <span style="font-size:16px">${w.over?'🚨':'⚠️'}</span>
        <div style="flex:1">
          <span style="font-size:12px;font-weight:700;color:${w.over?'#ef4444':'#f59e0b'}">${w.category} budget ${w.over?'exceeded!':'is almost full!'}</span>
          <span style="font-size:11px;color:var(--text3);margin-left:8px">₹${Math.round(w.used).toLocaleString('en-IN')} of ₹${Math.round(w.limit).toLocaleString('en-IN')} (${w.pct}%)</span>
        </div>
        <div style="font-size:12px;color:${w.over?'#ef4444':'#f59e0b'};font-weight:700">${w.over?`Over by ₹${Math.round(w.used-w.limit).toLocaleString('en-IN')}`:`₹${Math.round(w.limit-w.used).toLocaleString('en-IN')} left`}</div>
      </div>`).join('')}
  </div>`;
}


// ═══════════════════════════════════════════════════════════
// 13. SUBSCRIPTION TRACKER
// ═══════════════════════════════════════════════════════════
function buildSubscriptionHTML() {
  const recs = STATE.recurringTx || [];
  const subs = recs.filter(r => r.type==='expense' && r.frequency==='monthly');
  if (!subs.length) return `
    <div style="text-align:center;padding:24px;color:var(--text3)">
      <p style="font-size:13px;margin-bottom:12px">No subscriptions tracked yet.</p>
      <button onclick="openRecurringManager()" class="btn-primary" style="font-size:12px">+ Add Subscription</button>
    </div>`;

  const total = subs.reduce((s,r)=>s+r.amount,0);
  const ICONS = {Netflix:'🎬',Spotify:'🎵',Prime:'📦',Hotstar:'📺',YouTube:'▶️',Gym:'🏋️',Jio:'📱',Airtel:'📡'};

  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <p style="font-size:14px;font-weight:800;color:var(--text)">Monthly Total</p>
      <p style="font-size:22px;font-weight:900;color:#ef4444">${fmt(total)}</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${subs.map(s=>{
        const name = s.description || s.category;
        const icon = Object.entries(ICONS).find(([k])=>name.toLowerCase().includes(k.toLowerCase()))?.[1] || s.icon || '📱';
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:var(--glass);border:1px solid var(--glass-border)">
          <span style="font-size:20px">${icon}</span>
          <div style="flex:1"><p style="font-size:13px;font-weight:600;color:var(--text)">${name}</p><p style="font-size:11px;color:var(--text3)">Monthly · next: ${s.nextDate}</p></div>
          <span style="font-size:13px;font-weight:700;color:#ef4444">${fmt(s.amount)}</span>
        </div>`;
      }).join('')}
    </div>
    <div style="margin-top:14px;padding:10px;border-radius:10px;background:rgba(239,68,68,0.07);text-align:center">
      <p style="font-size:11px;color:var(--text3)">Annual subscription cost: <b style="color:#ef4444">${fmt(total*12)}</b></p>
    </div>
    <button onclick="openRecurringManager()" class="btn-secondary" style="width:100%;margin-top:10px;font-size:12px">+ Add Subscription</button>`;
}


// ═══════════════════════════════════════════════════════════
// 14. MONTH-OVER-MONTH TABLE
// ═══════════════════════════════════════════════════════════
function buildMoMTableHTML() {
  const txns = STATE.transactions || [];
  const now = new Date();
  const getMonth = off => {
    const d = new Date(now.getFullYear(), now.getMonth()+off, 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  };
  const thisM = getMonth(0), lastM = getMonth(-1);
  const filter = (m, type) => txns.filter(t=>t.date.startsWith(m)&&t.type===type);

  const cats = [...new Set(txns.filter(t=>t.type==='expense').map(t=>t.category))];
  if (!cats.length) return '';

  const spent = (m, cat) => filter(m,'expense').filter(t=>t.category===cat).reduce((s,t)=>s+t.amount,0);
  const rows = cats.map(cat => {
    const t = spent(thisM,cat), l = spent(lastM,cat);
    const delta = l>0 ? ((t-l)/l*100).toFixed(0) : null;
    return { cat, this:t, last:l, delta };
  }).filter(r=>r.this>0||r.last>0).sort((a,b)=>b.this-a.this).slice(0,8);

  return `
  <div style="overflow-x:auto;margin-bottom:20px">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="border-bottom:1px solid var(--glass-border)">
          <th style="padding:8px 12px;text-align:left;color:var(--text3);font-weight:700">Category</th>
          <th style="padding:8px 12px;text-align:right;color:var(--text3);font-weight:700">${new Date(now.getFullYear(),now.getMonth()-1,1).toLocaleString('default',{month:'short'})}</th>
          <th style="padding:8px 12px;text-align:right;color:var(--text3);font-weight:700">${new Date().toLocaleString('default',{month:'short'})}</th>
          <th style="padding:8px 12px;text-align:right;color:var(--text3);font-weight:700">Change</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r=>`<tr style="border-bottom:1px solid rgba(255,255,255,0.04)">
          <td style="padding:8px 12px;color:var(--text);font-weight:600">${r.cat}</td>
          <td style="padding:8px 12px;text-align:right;color:var(--text3)">${r.last?fmt(r.last):'—'}</td>
          <td style="padding:8px 12px;text-align:right;font-weight:700;color:var(--text)">${r.this?fmt(r.this):'—'}</td>
          <td style="padding:8px 12px;text-align:right;font-weight:700;color:${!r.delta?'var(--text3)':parseFloat(r.delta)>0?'#ef4444':'#10b981'}">${r.delta?`${parseFloat(r.delta)>0?'↑':'↓'}${Math.abs(r.delta)}%`:'—'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}


// ═══════════════════════════════════════════════════════════
// 15. SMART AUTOCOMPLETE FOR DESCRIPTION INPUT
// ═══════════════════════════════════════════════════════════
function attachTxAutocomplete() {
  const descEl = document.getElementById('tx-desc');
  const catEl  = document.getElementById('tx-cat');
  if (!descEl) return;

  // Build lookup from past transactions
  const past = STATE.transactions || [];
  const lookup = {};
  past.forEach(t => {
    const key = (t.description||'').toLowerCase().trim();
    if (key) lookup[key] = { category:t.category, amount:t.amount };
  });

  descEl.addEventListener('input', () => {
    const q = descEl.value.toLowerCase().trim();
    if (!q || q.length < 2) { _removeTxSuggestions(); return; }
    const matches = Object.entries(lookup).filter(([k])=>k.includes(q)).slice(0,5);
    if (!matches.length) { _removeTxSuggestions(); return; }

    let box = document.getElementById('tx-autocomplete');
    if (!box) {
      box = document.createElement('div');
      box.id = 'tx-autocomplete';
      box.style.cssText = 'position:absolute;background:var(--card-bg);border:1px solid var(--glass-border);border-radius:10px;z-index:1000;width:100%;max-height:160px;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.4);margin-top:2px';
      descEl.parentElement.style.position = 'relative';
      descEl.insertAdjacentElement('afterend', box);
    }
    box.innerHTML = matches.map(([k,v])=>`
      <div onclick="applyTxSuggestion('${k}','${v.category}',${v.amount})"
        style="padding:9px 12px;cursor:pointer;font-size:12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.04)"
        onmouseover="this.style.background='rgba(0,201,167,0.1)'" onmouseout="this.style.background=''">
        <span style="color:var(--text)">${k}</span>
        <span style="color:var(--text3);font-size:11px">${v.category} · ${fmt(v.amount)}</span>
      </div>`).join('');
  });

  descEl.addEventListener('blur', () => setTimeout(_removeTxSuggestions, 200));
}

function applyTxSuggestion(desc, cat, amount) {
  const d = document.getElementById('tx-desc'); if(d) d.value = desc;
  const c = document.getElementById('tx-cat');  if(c) c.value = cat;
  const a = document.getElementById('tx-amount'); if(a && !a.value) a.value = amount;
  _removeTxSuggestions();
}

function _removeTxSuggestions() {
  const box = document.getElementById('tx-autocomplete');
  if (box) box.remove();
}


// ═══════════════════════════════════════════════════════════
// 16. FLOATING ACTION BUTTON (FAB) — Quick-Add fan menu
// ═══════════════════════════════════════════════════════════
let _fabOpen = false;

function toggleFab() {
  _fabOpen ? closeFab() : openFab();
}

function openFab() {
  _fabOpen = true;
  const menu     = document.getElementById('fab-menu');
  const btn      = document.getElementById('fab-main');
  const backdrop = document.getElementById('fab-backdrop');
  if (menu)     menu.classList.add('fab-open');
  if (btn)      btn.classList.add('fab-open');
  if (backdrop) backdrop.style.display = 'block';
}

function closeFab() {
  _fabOpen = false;
  const menu     = document.getElementById('fab-menu');
  const btn      = document.getElementById('fab-main');
  const backdrop = document.getElementById('fab-backdrop');
  if (menu)     menu.classList.remove('fab-open');
  if (btn)      btn.classList.remove('fab-open');
  if (backdrop) backdrop.style.display = 'none';
}

// Helper: navigate to journal page and focus the entry textarea
function openAddJournalModal() {
  navigate('journal');
  setTimeout(() => {
    const ta = document.getElementById('journal-text') || document.querySelector('textarea[id*="journal"]');
    if (ta) { ta.focus(); ta.scrollIntoView({ behavior:'smooth', block:'center' }); }
  }, 200);
}

// Keyboard shortcut Q opens FAB
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
  if (e.key === 'q' || e.key === 'Q') {
    e.preventDefault();
    toggleFab();
  }
  if (e.key === '?' || (e.shiftKey && e.key === '/')) {
    e.preventDefault();
    openShortcutsPanel();
  }
  if (e.key === 'Escape') {
    closeFab();
    closeNotifPanel();
    closeShortcutsPanel();
  }
});


// ═══════════════════════════════════════════════════════════
// 17. SMART NOTIFICATION BELL
// ═══════════════════════════════════════════════════════════
function buildNotifications() {
  const notifs = [];
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  // ── Budget warnings ──
  const budgets = STATE.budgets || [];
  const txns = STATE.transactions || [];
  const monthExp = txns.filter(t => t.type==='expense' && t.date.startsWith(monthStr));
  const spentMap = {};
  monthExp.forEach(t => { const k=(t.category||'').toLowerCase(); spentMap[k]=(spentMap[k]||0)+t.amount; });

  budgets.forEach(b => {
    const limit = b.amount ?? b.limit ?? 0;
    const used  = spentMap[(b.category||'').toLowerCase()] || 0;
    const pct   = limit > 0 ? Math.round(used/limit*100) : 0;
    if (pct > 100) {
      notifs.push({ type:'danger',  icon:'🚨', title:`${b.category} budget exceeded!`, sub:`Spent ${fmt(used)} of ${fmt(limit)} (${pct}%)`, action:`navigate('budget')` });
    } else if (pct >= 80) {
      notifs.push({ type:'warning', icon:'⚠️', title:`${b.category} at ${pct}% of budget`, sub:`${fmt(used)} spent / ${fmt(limit)} limit`, action:`navigate('budget')` });
    }
  });

  // ── Upcoming recurring transactions ──
  const recurring = STATE.recurringTxns || [];
  const todayStr = now.toISOString().slice(0,10);
  recurring.forEach(r => {
    const nextDue = _calcNextRecurringDate(r);
    if (!nextDue) return;
    const daysLeft = Math.round((new Date(nextDue) - now) / 86400000);
    if (daysLeft >= 0 && daysLeft <= 3) {
      notifs.push({ type: daysLeft === 0 ? 'danger' : 'warning', icon:'🔄', title:`${r.description || r.category} due ${daysLeft===0?'today':`in ${daysLeft} day${daysLeft>1?'s':''}`}`, sub:`${r.type==='expense'?'−':'+'} ${fmt(r.amount)} · ${r.category}`, action:`navigate('finance')` });
    }
  });

  // ── Goal progress encouragement ──
  const goals = STATE.goals || [];
  goals.forEach(g => {
    const pct = g.target > 0 ? Math.round((g.current||0)/g.target*100) : 0;
    if (pct >= 90 && pct < 100) {
      notifs.push({ type:'success', icon:'🎯', title:`"${g.name}" almost done!`, sub:`${pct}% — just ${fmt((g.target||0)-(g.current||0))} more to go!`, action:`navigate('goals')` });
    }
  });

  // ── Habit streak alerts ──
  const habits = STATE.habits || [];
  const completions = STATE.habitCompletions || [];
  const todayISO = now.toISOString().slice(0,10);
  const yesterISO = new Date(now - 86400000).toISOString().slice(0,10);
  habits.forEach(h => {
    const doneToday = completions.some(c => c.habitId === h.id && c.date === todayISO);
    const doneYest  = completions.some(c => c.habitId === h.id && c.date === yesterISO);
    // Streak about to break — done yesterday but not yet today, and it's past 6pm
    if (!doneToday && doneYest && now.getHours() >= 18) {
      notifs.push({ type:'warning', icon:'🔥', title:`"${h.name}" streak at risk!`, sub:`Haven't checked in today — don't lose your streak!`, action:`navigate('habits')` });
    }
  });

  // ── Low balance warning ──
  const banks = STATE.bankAccounts || [];
  banks.forEach(b => {
    if (b.balance >= 0 && b.balance < 5000) {
      notifs.push({ type:'danger', icon:'🏦', title:`Low balance in ${b.bankName}`, sub:`Only ${fmt(b.balance)} remaining`, action:`navigate('bank-tracker')` });
    }
  });

  // ── Savings insight ──
  const thisInc  = txns.filter(t=>t.type==='income'&&t.date.startsWith(monthStr)).reduce((s,t)=>s+t.amount,0);
  const thisExp  = txns.filter(t=>t.type==='expense'&&t.date.startsWith(monthStr)).reduce((s,t)=>s+t.amount,0);
  const savRate  = thisInc > 0 ? ((thisInc-thisExp)/thisInc*100) : 0;
  if (thisInc > 0 && savRate >= 30) {
    notifs.push({ type:'success', icon:'💚', title:`Great savings rate this month!`, sub:`${savRate.toFixed(1)}% savings rate — you're crushing it!`, action:`navigate('finance')` });
  } else if (thisInc > 0 && savRate < 0) {
    notifs.push({ type:'danger', icon:'📉', title:`Spending more than you earn!`, sub:`Expenses exceed income this month`, action:`navigate('finance')` });
  }

  if (!notifs.length) {
    notifs.push({ type:'info', icon:'✨', title:'All clear — you\'re on track!', sub:'No budget overruns, no upcoming bills due', action:null });
  }

  return notifs;
}

function _calcNextRecurringDate(r) {
  if (!r.nextDate) return r.startDate || null;
  return r.nextDate;
}

function openNotifPanel() {
  const panel   = document.getElementById('notif-panel');
  const backdrop= document.getElementById('notif-backdrop');
  const body    = document.getElementById('notif-panel-body');
  if (!panel) return;

  const notifs = buildNotifications();
  body.innerHTML = notifs.map(n => `
    <div class="notif-item notif-${n.type}" ${n.action?`onclick="${n.action};closeNotifPanel()" style="cursor:pointer"`:''}>
      <div style="font-size:22px;flex-shrink:0;line-height:1.2">${n.icon}</div>
      <div style="flex:1;min-width:0">
        <p style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:2px">${n.title}</p>
        <p style="font-size:11px;color:var(--text3)">${n.sub}</p>
      </div>
    </div>`).join('');

  panel.classList.add('notif-open');
  if (backdrop) backdrop.style.display = 'block';
  _updateNotifBadge();
}

function closeNotifPanel() {
  const panel   = document.getElementById('notif-panel');
  const backdrop= document.getElementById('notif-backdrop');
  if (panel)    panel.classList.remove('notif-open');
  if (backdrop) backdrop.style.display = 'none';
}

function _updateNotifBadge() {
  const badge = document.getElementById('notif-badge');
  if (!badge) return;
  const notifs = buildNotifications();
  const alerts = notifs.filter(n => n.type === 'danger' || n.type === 'warning');
  if (alerts.length > 0) {
    badge.style.cssText = badge.style.cssText.replace('display:none','');
    badge.style.display = 'flex';
    badge.textContent = alerts.length > 9 ? '9+' : String(alerts.length);
  } else {
    badge.style.display = 'none';
  }
}


// ═══════════════════════════════════════════════════════════
// 18. KEYBOARD SHORTCUTS PANEL
// ═══════════════════════════════════════════════════════════
const SHORTCUTS_LIST = [
  { group:'Navigation', items:[
    { keys:['Ctrl','K'],  desc:'Open command palette' },
    { keys:['Q'],          desc:'Open Quick-Add menu (FAB)' },
    { keys:['?'],          desc:'Show keyboard shortcuts' },
    { keys:['Escape'],     desc:'Close any panel / modal' },
  ]},
  { group:'Finance', items:[
    { keys:['I'],          desc:'Add Income (on Finance page)' },
    { keys:['E'],          desc:'Add Expense (on Finance page)' },
    { keys:['Ctrl','Z'],   desc:'Undo last action' },
  ]},
  { group:'Pages', items:[
    { keys:['G','D'],      desc:'Go → Dashboard' },
    { keys:['G','F'],      desc:'Go → Finance' },
    { keys:['G','H'],      desc:'Go → Habits' },
    { keys:['G','J'],      desc:'Go → Journal' },
    { keys:['G','G'],      desc:'Go → Goals' },
    { keys:['G','A'],      desc:'Go → Analytics' },
  ]},
  { group:'Tools', items:[
    { keys:['C'],          desc:'Toggle Calculator' },
    { keys:['T'],          desc:'Toggle Dark / Light theme' },
  ]},
];

let _gKeyPending = false;
let _gTimer = null;

// Two-key "G then X" page navigation
document.addEventListener('keydown', ev => {
  if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA' || ev.target.isContentEditable) return;
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;

  const k = ev.key.toUpperCase();

  if (_gKeyPending) {
    clearTimeout(_gTimer); _gKeyPending = false;
    const map = { D:'dashboard', F:'finance', H:'habits', J:'journal', G:'goals', A:'analytics' };
    if (map[k]) { ev.preventDefault(); navigate(map[k]); }
    return;
  }

  if (k === 'G') {
    _gKeyPending = true;
    _gTimer = setTimeout(() => { _gKeyPending = false; }, 800);
    return;
  }

  // Single-key shortcuts
  if (k === 'C' && !document.querySelector('#cmd-palette-overlay[style*="flex"]')) {
    ev.preventDefault(); toggleCalculator();
  }
  if (k === 'T' && !document.querySelector('#cmd-palette-overlay[style*="flex"]')) {
    ev.preventDefault(); toggleTheme();
  }
  // I / E quick-add on Finance page
  if (k === 'I' && STATE._currentPage === 'finance') { ev.preventDefault(); openAddTxModal('income'); }
  if (k === 'E' && STATE._currentPage === 'finance') { ev.preventDefault(); openAddTxModal('expense'); }
});

function openShortcutsPanel() {
  const overlay = document.getElementById('shortcuts-overlay');
  const body    = document.getElementById('shortcuts-body');
  if (!overlay) return;

  body.innerHTML = SHORTCUTS_LIST.map(g => `
    <div style="margin-bottom:20px">
      <p style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--teal);margin-bottom:8px">${g.group}</p>
      ${g.items.map(item => `
        <div class="shortcut-row">
          <span style="font-size:13px;color:var(--text2)">${item.desc}</span>
          <div class="shortcut-keys">${item.keys.map(k=>`<kbd>${k}</kbd>`).join('<span style="font-size:10px;color:var(--text3);padding:0 2px">+</span>')}</div>
        </div>`).join('')}
    </div>`).join('');

  overlay.classList.add('shortcuts-open');
  overlay.style.display = 'flex';
}

function closeShortcutsPanel() {
  const overlay = document.getElementById('shortcuts-overlay');
  if (overlay) { overlay.classList.remove('shortcuts-open'); overlay.style.display = 'none'; }
}

// Close shortcuts panel on overlay click
document.addEventListener('click', e => {
  const overlay = document.getElementById('shortcuts-overlay');
  if (overlay && e.target === overlay) closeShortcutsPanel();
});


// ═══════════════════════════════════════════════════════════
// 19. PERIOD COMPARISON CHIPS (finance summary)
// ═══════════════════════════════════════════════════════════
function buildPeriodComparisonChips(period) {
  const txns = STATE.transactions || [];
  const now  = new Date();

  function rangeFor(p, offset) {
    let start, end;
    if (p === 'month') {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      start = d.toISOString().slice(0,10);
      end   = new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().slice(0,10);
    } else if (p === 'week') {
      const dow = (now.getDay()+6)%7;
      const mon = new Date(now); mon.setDate(now.getDate() - dow + offset*7);
      start = mon.toISOString().slice(0,10);
      const sun = new Date(mon); sun.setDate(mon.getDate()+6);
      end = sun.toISOString().slice(0,10);
    } else if (p === 'year') {
      start = `${now.getFullYear()+offset}-01-01`;
      end   = `${now.getFullYear()+offset}-12-31`;
    } else return null;
    return { start, end };
  }

  const cur  = rangeFor(period, 0);
  const prev = rangeFor(period, -1);
  if (!cur || !prev) return { incomeChip:'', expenseChip:'' };

  const inRange = (t, r) => t.date >= r.start && t.date <= r.end;
  const sum = (t, r, type) => t.filter(tx => tx.type===type && inRange(tx,r)).reduce((s,tx)=>s+tx.amount,0);

  const curInc  = sum(txns, cur, 'income');  const prevInc  = sum(txns, prev, 'income');
  const curExp  = sum(txns, cur, 'expense'); const prevExp  = sum(txns, prev, 'expense');

  function chip(cur, prev, inverseColor) {
    if (prev === 0) return '';
    const delta = ((cur-prev)/prev*100);
    const dir   = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
    const cls   = delta === 0 ? 'flat' : (!inverseColor ? (delta>0?'up':'down') : (delta>0?'down':'up'));
    return `<span class="period-cmp-chip period-cmp-${cls}">${dir} ${Math.abs(delta).toFixed(0)}% vs prev</span>`;
  }

  return {
    incomeChip:  chip(curInc,  prevInc,  false),
    expenseChip: chip(curExp,  prevExp,  true),
  };
}


// ═══════════════════════════════════════════════════════════
// 20. TRANSACTION TEXT SEARCH
// ═══════════════════════════════════════════════════════════
let _finSearch = '';

function setFinSearch(val) {
  _finSearch = (val || '').toLowerCase().trim();
  renderFinanceTxList();
}

function clearFinSearch() {
  _finSearch = '';
  const inp = document.getElementById('fin-search-input');
  if (inp) inp.value = '';
  renderFinanceTxList();
}

// Patch renderFinanceTxList to apply text search filter
// Called right after existing filters — injected via monkey-patching on init
function _applyFinTextSearch(txns) {
  if (!_finSearch) return txns;
  return txns.filter(t =>
    (t.description || '').toLowerCase().includes(_finSearch) ||
    (t.category    || '').toLowerCase().includes(_finSearch) ||
    String(t.amount || '').includes(_finSearch) ||
    (t.note        || '').toLowerCase().includes(_finSearch)
  );
}


// ═══════════════════════════════════════════════════════════
// 21. SPENDING PULSE — Daily insight card for dashboard
// ═══════════════════════════════════════════════════════════
function buildSpendingPulseHTML() {
  const txns = STATE.transactions || [];
  const now  = new Date();
  const todayStr  = now.toISOString().slice(0,10);
  const monthStr  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  const todayTxns = txns.filter(t => t.date === todayStr);
  const todayExp  = todayTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const todayInc  = todayTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);

  // Days elapsed in month
  const daysElapsed = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();

  const monthExp  = txns.filter(t=>t.type==='expense'&&t.date.startsWith(monthStr)).reduce((s,t)=>s+t.amount,0);
  const dailyAvg  = daysElapsed > 0 ? monthExp / daysElapsed : 0;
  const projEnd   = dailyAvg * daysInMonth;

  // Top expense today
  const topToday = todayTxns.filter(t=>t.type==='expense').sort((a,b)=>b.amount-a.amount)[0];

  // Budget status
  const budgetWarns = getBudgetWarnings();
  const overCount   = budgetWarns.filter(b=>b.over).length;
  const warnCount   = budgetWarns.filter(b=>b.warn).length;

  const lines = [];
  if (todayExp > 0)   lines.push(`<span style="color:#ef4444">💸 Spent ${fmt(todayExp)} today</span>`);
  if (todayInc > 0)   lines.push(`<span style="color:#10b981">💚 Earned ${fmt(todayInc)} today</span>`);
  if (topToday)       lines.push(`<span style="color:var(--text2)">🏷️ Top: ${topToday.description||topToday.category} (${fmt(topToday.amount)})</span>`);
  if (dailyAvg > 0)   lines.push(`<span style="color:var(--text2)">📅 Daily avg: ${fmt(Math.round(dailyAvg))} · Proj month: ${fmt(Math.round(projEnd))}</span>`);
  if (overCount > 0)  lines.push(`<span style="color:#ef4444">🚨 ${overCount} budget${overCount>1?'s':''} exceeded!</span>`);
  else if (warnCount) lines.push(`<span style="color:#f59e0b">⚠️ ${warnCount} budget${warnCount>1?'s':''} near limit</span>`);

  if (!lines.length) {
    return `<div class="glass-card" style="padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;gap:12px">
      <span style="font-size:22px">✨</span>
      <span style="font-size:13px;color:var(--text2)">No transactions today yet — start tracking!</span>
      <button onclick="openAddTxModal('expense')" class="btn-primary btn-sm" style="margin-left:auto;flex-shrink:0">+ Add</button>
    </div>`;
  }

  return `
  <div class="glass-card" style="padding:14px 18px;margin-bottom:16px;border:1px solid rgba(0,201,167,0.18)">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <span style="font-size:16px">💡</span>
      <span style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--teal)">Today's Pulse</span>
      <button onclick="openNotifPanel()" style="margin-left:auto;background:rgba(0,201,167,0.1);border:1px solid rgba(0,201,167,0.2);color:var(--teal);border-radius:8px;padding:3px 9px;cursor:pointer;font-size:11px;font-weight:700">View All Alerts</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:5px;font-size:12px">
      ${lines.map(l=>`<div>${l}</div>`).join('')}
    </div>
  </div>`;
}


// ═══════════════════════════════════════════════════════════
// 22. DRAGGABLE + COLLAPSIBLE FLOATING DOCK
// ═══════════════════════════════════════════════════════════
const DOCK_POS_KEY = 'lifeos_dock_pos';
const DOCK_COLLAPSED_KEY = 'lifeos_dock_collapsed';

function initDraggableDock() {
  const dock   = document.getElementById('float-dock');
  const handle = document.getElementById('dock-handle');
  if (!dock || !handle) return;

  // ── Restore saved position ──
  const saved = _loadDockPos();
  if (saved) {
    dock.style.right  = 'auto';
    dock.style.bottom = 'auto';
    dock.style.left   = saved.x + 'px';
    dock.style.top    = saved.y + 'px';
  }

  // ── Restore collapsed state ──
  if (localStorage.getItem(DOCK_COLLAPSED_KEY) === '1') {
    _applyDockCollapse(true, false);
  }

  // ── Mouse drag ──
  let dragging = false, startX, startY, origX, origY;

  handle.addEventListener('mousedown', e => {
    if (e.target.closest('.dock-toggle-btn')) return; // don't drag when clicking toggle
    e.preventDefault();
    dragging = true;
    dock.classList.add('dragging');

    const rect = dock.getBoundingClientRect();
    origX = rect.left; origY = rect.top;
    startX = e.clientX; startY = e.clientY;

    // Switch from right/bottom to left/top for free drag
    dock.style.right  = 'auto';
    dock.style.bottom = 'auto';
    dock.style.left   = origX + 'px';
    dock.style.top    = origY + 'px';
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newX = Math.max(0, Math.min(window.innerWidth  - dock.offsetWidth,  origX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - dock.offsetHeight, origY + dy));
    dock.style.left = newX + 'px';
    dock.style.top  = newY + 'px';
  });

  document.addEventListener('mouseup', e => {
    if (!dragging) return;
    dragging = false;
    dock.classList.remove('dragging');
    _snapDockToEdge(dock);
  });

  // ── Touch drag (mobile) ──
  let touchId = null;
  handle.addEventListener('touchstart', e => {
    if (e.target.closest('.dock-toggle-btn')) return;
    const t = e.changedTouches[0];
    touchId = t.identifier;
    dragging = true;
    dock.classList.add('dragging');

    const rect = dock.getBoundingClientRect();
    origX = rect.left; origY = rect.top;
    startX = t.clientX; startY = t.clientY;

    dock.style.right  = 'auto';
    dock.style.bottom = 'auto';
    dock.style.left   = origX + 'px';
    dock.style.top    = origY + 'px';
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!dragging) return;
    const t = [...e.changedTouches].find(t => t.identifier === touchId);
    if (!t) return;
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    const newX = Math.max(0, Math.min(window.innerWidth  - dock.offsetWidth,  origX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - dock.offsetHeight, origY + dy));
    dock.style.left = newX + 'px';
    dock.style.top  = newY + 'px';
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (!dragging) return;
    const t = [...e.changedTouches].find(t => t.identifier === touchId);
    if (!t) return;
    dragging = false; touchId = null;
    dock.classList.remove('dragging');
    _snapDockToEdge(dock);
  });
}

// Snap to nearest vertical edge with a small margin
function _snapDockToEdge(dock) {
  const margin  = 16;
  const x       = parseInt(dock.style.left);
  const midX    = window.innerWidth / 2;
  const snapX   = x < midX
    ? margin
    : window.innerWidth - dock.offsetWidth - margin;

  dock.style.transition = 'left .25s cubic-bezier(0.34,1.56,0.64,1), top .25s cubic-bezier(0.34,1.56,0.64,1)';
  dock.style.left = snapX + 'px';
  setTimeout(() => { dock.style.transition = ''; }, 300);

  // Save position
  _saveDockPos(snapX, parseInt(dock.style.top));
}

function _saveDockPos(x, y) {
  try { localStorage.setItem(DOCK_POS_KEY, JSON.stringify({ x, y })); } catch(e) {}
}
function _loadDockPos() {
  try { return JSON.parse(localStorage.getItem(DOCK_POS_KEY)); } catch(e) { return null; }
}

// ── Collapse / Expand ──
let _dockCollapsed = false;

function toggleDockCollapse(e) {
  if (e) e.stopPropagation();
  _dockCollapsed = !_dockCollapsed;
  _applyDockCollapse(_dockCollapsed, true);
}

function _applyDockCollapse(collapsed, save) {
  _dockCollapsed = collapsed;
  const dock    = document.getElementById('float-dock');
  const btn     = document.getElementById('dock-collapse-btn');
  const buttons = dock?.querySelectorAll('.dock-btn');
  if (!dock) return;

  if (collapsed) {
    buttons?.forEach(b => {
      b.style.width   = '0';
      b.style.height  = '0';
      b.style.opacity = '0';
      b.style.overflow = 'hidden';
      b.style.margin  = '0';
      b.style.padding = '0';
      b.style.pointerEvents = 'none';
    });
    if (btn) { btn.textContent = '▸'; btn.title = 'Show dock'; }
  } else {
    buttons?.forEach(b => {
      b.style.width   = '';
      b.style.height  = '';
      b.style.opacity = '';
      b.style.overflow = '';
      b.style.margin  = '';
      b.style.padding = '';
      b.style.pointerEvents = '';
    });
    if (btn) { btn.textContent = '▾'; btn.title = 'Hide dock'; }
  }

  if (save) {
    try { localStorage.setItem(DOCK_COLLAPSED_KEY, collapsed ? '1' : '0'); } catch(e) {}
  }
}


// ═══════════════════════════════════════════════════════════
// INIT — called on app start
// ═══════════════════════════════════════════════════════════
function initPremiumFeatures() {
  processRecurringTransactions();
  checkGoalMilestones();
  // Delay badge update until STATE is fully loaded
  setTimeout(_updateNotifBadge, 800);
  // Refresh badge every 5 minutes
  setInterval(_updateNotifBadge, 300000);
  // Init draggable dock after DOM is ready
  setTimeout(initDraggableDock, 300);
}
