// ============================================================
//  Money Heatmap Calendar Page
// ============================================================

let _heatmapAnchorDate = new Date();
let _heatmapMode = 'expense'; // 'expense' | 'income' | 'net'
let _heatmapSelectedDateYmd = today();

function shiftHeatmapPeriod(val) {
  _heatmapAnchorDate.setMonth(_heatmapAnchorDate.getMonth() + val);
  renderHeatmap();
}

function resetHeatmapAnchor() {
  _heatmapAnchorDate = new Date();
  _heatmapSelectedDateYmd = today();
  renderHeatmap();
}

function setHeatmapMode(mode) {
  _heatmapMode = mode;
  renderHeatmap();
}

function _selectHeatmapDay(ymd) {
  _heatmapSelectedDateYmd = ymd;
  // Soft refresh: rerender to update borders and selected list
  renderHeatmap();
}

function renderHeatmap() {
  const container = document.getElementById('page-container');
  if (!container) return;

  const yr = _heatmapAnchorDate.getFullYear();
  const mo = _heatmapAnchorDate.getMonth();
  const mLabel = _heatmapAnchorDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Get and group transactions for active month
  const txnsAll = STATE.transactions || [];
  const startPrefix = `${yr}-${String(mo + 1).padStart(2, '0')}`;
  const monthTxns = txnsAll.filter(t => t.date && t.date.startsWith(startPrefix));

  const dailyIncome = {};
  const dailyExpense = {};
  monthTxns.forEach(t => {
    const ymd = t.date;
    const amt = parseFloat(t.amount) || 0;
    if (t.type === 'income') {
      dailyIncome[ymd] = (dailyIncome[ymd] || 0) + amt;
    } else {
      dailyExpense[ymd] = (dailyExpense[ymd] || 0) + amt;
    }
  });

  // Calculate scaling maxes for normalization
  const incValues = Object.values(dailyIncome);
  const expValues = Object.values(dailyExpense);
  const maxIncome = incValues.length ? Math.max(...incValues) : 0;
  const maxExpense = expValues.length ? Math.max(...expValues) : 0;

  let maxNetPositive = 0;
  let maxNetNegative = 0;
  const netValues = {};
  const allDays = new Set([...Object.keys(dailyIncome), ...Object.keys(dailyExpense)]);
  allDays.forEach(ymd => {
    const inc = dailyIncome[ymd] || 0;
    const exp = dailyExpense[ymd] || 0;
    const net = inc - exp;
    netValues[ymd] = net;
    if (net > 0) maxNetPositive = Math.max(maxNetPositive, net);
    if (net < 0) maxNetNegative = Math.max(maxNetNegative, Math.abs(net));
  });

  // Calendar parameters
  const firstDayIndex = (new Date(yr, mo, 1).getDay() + 6) % 7; // 0=Mon, 6=Sun
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();

  // Mode active classes
  const act = m => _heatmapMode === m ? 'active' : '';

  // Generate calendar cells HTML
  let cellsHTML = '';
  // Empty slots for previous month padding
  for (let i = 0; i < firstDayIndex; i++) {
    cellsHTML += `<div class="hm-day-cell empty"></div>`;
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = String(d).padStart(2, '0');
    const ymd = `${yr}-${String(mo + 1).padStart(2, '0')}-${dStr}`;
    const inc = dailyIncome[ymd] || 0;
    const exp = dailyExpense[ymd] || 0;

    let color = 'rgba(255, 255, 255, 0.03)';
    let tooltipVal = '';

    if (_heatmapMode === 'expense') {
      const val = exp;
      if (val > 0) {
        const ratio = maxExpense > 0 ? (val / maxExpense) : 0;
        color = `rgba(239, 68, 68, ${0.18 + ratio * 0.82})`;
        tooltipVal = `Expense: ${fmt(val)}`;
      } else {
        tooltipVal = 'No expenses';
      }
    } else if (_heatmapMode === 'income') {
      const val = inc;
      if (val > 0) {
        const ratio = maxIncome > 0 ? (val / maxIncome) : 0;
        color = `rgba(16, 185, 129, ${0.18 + ratio * 0.82})`;
        tooltipVal = `Income: ${fmt(val)}`;
      } else {
        tooltipVal = 'No income';
      }
    } else { // 'net'
      const net = netValues[ymd] || 0;
      if (net > 0) {
        const ratio = maxNetPositive > 0 ? (net / maxNetPositive) : 0;
        color = `rgba(16, 185, 129, ${0.18 + ratio * 0.82})`;
        tooltipVal = `Net: +${fmt(net)}`;
      } else if (net < 0) {
        const ratio = maxNetNegative > 0 ? (Math.abs(net) / maxNetNegative) : 0;
        color = `rgba(239, 68, 68, ${0.18 + ratio * 0.82})`;
        tooltipVal = `Net: -${fmt(Math.abs(net))}`;
      } else {
        tooltipVal = 'Net: zero';
      }
    }

    const isSelected = ymd === _heatmapSelectedDateYmd;
    const isToday = ymd === today();

    cellsHTML += `
      <div onclick="_selectHeatmapDay('${ymd}')" class="hm-day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" style="background:${color}" title="${d} ${mLabel} · ${tooltipVal}">
        <span class="hm-day-num">${d}</span>
      </div>`;
  }

  // Selected date transactions detail
  const selectParts = _heatmapSelectedDateYmd.split('-');
  const selDateObj = new Date(parseInt(selectParts[0]), parseInt(selectParts[1]) - 1, parseInt(selectParts[2]));
  const formattedSelDate = selDateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const dayTxns = txnsAll.filter(t => t.date === _heatmapSelectedDateYmd).sort((a,b) => b.id.localeCompare(a.id));

  // Sums for selected day
  const selDayInc = dayTxns.filter(t => t.type === 'income').reduce((s,t) => s + (t.amount || 0), 0);
  const selDayExp = dayTxns.filter(t => t.type === 'expense').reduce((s,t) => s + (t.amount || 0), 0);

  // Mode specific legend labels
  let legendLabelLeft = 'Less';
  let legendLabelRight = 'More';
  let legendColors = '';

  if (_heatmapMode === 'expense') {
    legendColors = `
      <span style="background:rgba(255,255,255,0.03)"></span>
      <span style="background:rgba(239, 68, 68, 0.25)"></span>
      <span style="background:rgba(239, 68, 68, 0.5)"></span>
      <span style="background:rgba(239, 68, 68, 0.75)"></span>
      <span style="background:rgba(239, 68, 68, 1)"></span>
    `;
  } else if (_heatmapMode === 'income') {
    legendColors = `
      <span style="background:rgba(255,255,255,0.03)"></span>
      <span style="background:rgba(16, 185, 129, 0.25)"></span>
      <span style="background:rgba(16, 185, 129, 0.5)"></span>
      <span style="background:rgba(16, 185, 129, 0.75)"></span>
      <span style="background:rgba(16, 185, 129, 1)"></span>
    `;
  } else {
    legendLabelLeft = 'Expense';
    legendLabelRight = 'Income';
    legendColors = `
      <span style="background:rgba(239, 68, 68, 0.9)"></span>
      <span style="background:rgba(239, 68, 68, 0.4)"></span>
      <span style="background:rgba(255,255,255,0.03)"></span>
      <span style="background:rgba(16, 185, 129, 0.4)"></span>
      <span style="background:rgba(16, 185, 129, 0.9)"></span>
    `;
  }

  container.innerHTML = `
    <div class="fade-in hm-page">
      <div class="page-header">
        <div>
          <h1 class="page-title"><i data-lucide="calendar-range"></i> Heatmap</h1>
          <p class="page-subtitle">Visual month activity analyzer</p>
        </div>
      </div>

      <!-- Month Selector Row -->
      <div class="mm-monthbar" style="margin-bottom:16px">
        <button class="mm-navbtn" onclick="shiftHeatmapPeriod(-1)">‹</button>
        <button class="mm-month" style="cursor:default">${mLabel}</button>
        <button class="mm-navbtn" onclick="shiftHeatmapPeriod(1)">›</button>
        <button class="mm-today" onclick="resetHeatmapAnchor()">Today</button>
      </div>

      <!-- Segment Tabs (Mode selection) -->
      <div class="hm-mode-tabs glass-card" style="margin-bottom: 20px; display: flex; padding: 6px; border-radius: 14px; gap: 4px;">
        <button onclick="setHeatmapMode('expense')" class="hm-tab-btn expense-btn ${act('expense')}" style="flex: 1; text-align: center; font-weight: 700; padding: 10px; border-radius: 10px; border: none; font-size: 1.25rem;">💸 Expense</button>
        <button onclick="setHeatmapMode('income')" class="hm-tab-btn income-btn ${act('income')}" style="flex: 1; text-align: center; font-weight: 700; padding: 10px; border-radius: 10px; border: none; font-size: 1.25rem;">💰 Income</button>
        <button onclick="setHeatmapMode('net')" class="hm-tab-btn net-btn ${act('net')}" style="flex: 1; text-align: center; font-weight: 700; padding: 10px; border-radius: 10px; border: none; font-size: 1.25rem;">⚖️ Net</button>
      </div>

      <!-- Calendar Heatmap Grid Card -->
      <div class="glass-card hm-card" style="padding: 20px; margin-bottom: 20px;">
        <!-- Week Day Labels -->
        <div class="hm-week-labels" style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 12px; font-weight: 800; font-size: 1.15rem; color: var(--text3);">
          <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
        </div>

        <!-- Heatmap Grid -->
        <div class="hm-days-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
          ${cellsHTML}
        </div>

        <!-- Legend -->
        <div class="hm-legend-row" style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 20px; font-size: 1.1rem; color: var(--text3);">
          <span>${legendLabelLeft}</span>
          <div class="hm-legend-scale" style="display: flex; gap: 4px; align-items: center;">
            ${legendColors}
          </div>
          <span>${legendLabelRight}</span>
        </div>
      </div>

      <!-- Daily Transactions List Card -->
      <div class="glass-card hm-details-card" style="padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 12px; margin-bottom: 14px;">
          <div>
            <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text); margin: 0;">${formattedSelDate}</h3>
            <p style="font-size: 1.1rem; color: var(--text3); margin: 3px 0 0;">Logged activity for this day</p>
          </div>
          <div style="text-align: right;">
            ${selDayInc > 0 ? `<span style="color:#00c9a7; font-weight:700; font-size:1.2rem; display:block;">+${fmt(selDayInc)}</span>` : ''}
            ${selDayExp > 0 ? `<span style="color:#ef4444; font-weight:700; font-size:1.2rem; display:block;">-${fmt(selDayExp)}</span>` : ''}
          </div>
        </div>

        <div class="hm-tx-list" style="display: flex; flex-direction: column; gap: 8px;">
          ${dayTxns.length === 0 
            ? `<p style="text-align: center; padding: 24px 0; margin: 0; color: var(--text3); font-size: 1.2rem;">No transactions logged on this day.</p>`
            : dayTxns.map(tx => `
                <div class="tx-row" onclick="if(typeof openTxDetail==='function')openTxDetail('${tx.id}')" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:12px;border:1px solid var(--glass-border);background:var(--card-bg);cursor:pointer;transition:.15s" onmouseover="this.style.background='rgba(0,201,167,0.04)'" onmouseout="this.style.background=''">
                  <div style="display:flex;align-items:center;gap:12px">
                    <div class="tx-ic" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${(typeof catColor==='function'?catColor(tx.category):'#6366f1')}26;border:1px solid ${(typeof catColor==='function'?catColor(tx.category):'#6366f1')}55;color:${(typeof catColor==='function'?catColor(tx.category):'#6366f1')};font-size:18px;flex-shrink:0">${typeof catIconHtml==='function'?catIconHtml(tx.category):(tx.icon||'')}</div>
                    <div>
                      <p style="font-size:1.25rem;font-weight:600;margin:0;color:var(--text);">${tx.description||tx.category}</p>
                      <p style="font-size:1.1rem;color:var(--text3);margin:2px 0 0;">${tx.category} · ${tx.account || ''}</p>
                    </div>
                  </div>
                  <span style="font-weight:700;font-size:1.3rem;color:${tx.type==='income'?'#00c9a7':'#ef4444'}">${tx.type==='income'?'+':'-'}${fmt(tx.amount)}</span>
                </div>
              `).join('')}
        </div>
      </div>
    </div>`;

  _lucideRefresh();
}
