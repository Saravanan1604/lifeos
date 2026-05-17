// ===== BANK TRACKER PAGE =====
let bankTrackerAccount = null; // currently selected account id

function formatRelativeDate(dateStr) {
  const now = new Date(); now.setHours(0,0,0,0);
  const d   = new Date(dateStr); d.setHours(0,0,0,0);
  const diff = Math.round((now - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff === 2) return '2 days ago';
  if (diff <= 7)  return `${diff} days ago`;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

function renderBankTracker() {
  const accounts  = STATE.bankAccounts || [];
  const history   = STATE.bankBalanceHistory || [];
  const transfers = STATE.bankTransfers || [];

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const getAccountById = id => accounts.find(a => a.id === id);
  const selId = bankTrackerAccount;

  // ── 30-day chart data ──────────────────────────────────────────────
  const last30days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    last30days.push(d.toISOString().slice(0, 10));
  }
  const chartAccounts = selId ? accounts.filter(a => a.id === selId) : accounts;

  function getBalanceOnDate(accountId, dateStr) {
    const snaps = history
      .filter(h => h.accountId === accountId && h.date <= dateStr)
      .sort((a, b) => a.date.localeCompare(b.date));
    return snaps.length ? snaps[snaps.length - 1].balance : null;
  }
  function getFirstSnapDate(accountId) {
    const snaps = history.filter(h => h.accountId === accountId).sort((a,b)=>a.date.localeCompare(b.date));
    return snaps.length ? snaps[0].date : null;
  }
  const chartLabels = last30days.map(d => new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short'}));
  const chartData   = last30days.map(d => {
    let total = 0, hasData = false;
    chartAccounts.forEach(a => {
      const firstDate = getFirstSnapDate(a.id);
      if (!firstDate || d < firstDate) return;
      const bal = getBalanceOnDate(a.id, d);
      if (bal !== null) { total += bal; hasData = true; }
    });
    return hasData ? total : null;
  });

  // ── Chat history grouped by date ───────────────────────────────────
  const filteredHistory = [...history]
    .filter(h => !selId || h.accountId === selId)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt||'').localeCompare(b.createdAt||''));

  const grouped = {};
  filteredHistory.forEach(h => {
    if (!grouped[h.date]) grouped[h.date] = [];
    grouped[h.date].push(h);
  });
  const sortedDates = Object.keys(grouped).sort();

  // ── Build chat bubbles ─────────────────────────────────────────────
  let chatHTML = '';
  if (!sortedDates.length) {
    chatHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:12px;text-align:center">
        <div style="font-size:48px">💬</div>
        <p style="font-weight:700;font-size:16px">No balance history yet</p>
        <p style="color:var(--text3);font-size:13px">Tap "+ Log Balance" to start tracking.<br>You can add entries for past dates too!</p>
        <button class="btn-primary btn-sm" onclick="openQuickBalanceModal(${selId?`'${selId}'`:''})" style="background:linear-gradient(135deg,#00c9a7,#0acf83)">+ Log Balance</button>
      </div>`;
  } else {
    sortedDates.forEach(date => {
      // Date separator
      chatHTML += `
        <div style="display:flex;align-items:center;gap:10px;margin:18px 0 10px">
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.07)"></div>
          <span style="font-size:11px;font-weight:700;color:var(--text3);white-space:nowrap;padding:4px 12px;background:rgba(255,255,255,0.05);border-radius:20px">${formatRelativeDate(date)} &nbsp;·&nbsp; ${new Date(date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</span>
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.07)"></div>
        </div>`;

      grouped[date].forEach((h, idx) => {
        const acc    = getAccountById(h.accountId);
        const delta  = (h.prevBalance !== undefined && h.prevBalance !== null) ? h.balance - h.prevBalance : null;
        const up     = delta !== null && delta > 0;
        const same   = delta === 0;
        const dc     = same ? '#94a3b8' : up ? '#10b981' : '#ef4444';
        const di     = same ? '→' : up ? '↑' : '↓';
        const isIn   = (h.note||'').includes('Transfer in ←');
        const isOut  = (h.note||'').includes('Transfer out →');
        const isTx   = isIn || isOut;
        const bubbleBg     = isTx ? 'rgba(245,158,11,0.1)'  : 'rgba(0,201,167,0.08)';
        const bubbleBorder = isTx ? 'rgba(245,158,11,0.3)'  : 'rgba(0,201,167,0.25)';
        const entryId = h.id || `${date}-${idx}`;

        chatHTML += `
          <div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:12px;padding:0 4px">
            <div style="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${acc?`linear-gradient(135deg,${acc.color||'#1e293b'},${acc.color2||'#0f172a'})`:'rgba(99,102,241,0.2)'};font-size:17px;flex-shrink:0">${acc?.icon||'🏦'}</div>
            <div style="max-width:78%">
              <div style="font-size:10px;color:var(--text3);margin-bottom:3px;font-weight:600;padding-left:2px">${!selId?(acc?.bankName||'Bank')+' · ':''}${isTx?(isIn?'💸 Transfer In':'💸 Transfer Out'):'💰 Balance Update'}</div>
              <div style="background:${bubbleBg};border:1px solid ${bubbleBorder};border-radius:4px 16px 16px 16px;padding:12px 16px">
                <div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.5px">${fmt(h.balance)}</div>
                ${delta !== null ? `
                  <div style="display:flex;align-items:center;gap:8px;margin-top:5px;flex-wrap:wrap">
                    <span style="font-size:12px;font-weight:700;color:${dc}">${di} ${same?'No change':(up?'+':'')+fmt(Math.abs(delta))}</span>
                    ${h.prevBalance !== undefined ? `<span style="font-size:10px;color:var(--text3)">from ${fmt(h.prevBalance)}</span>` : ''}
                  </div>` : ''}
                ${h.note && h.note !== 'Manual update' ? `<div style="font-size:11px;color:var(--text3);margin-top:8px;padding-top:7px;border-top:1px solid rgba(255,255,255,0.07)">${h.note}</div>` : ''}
                <div style="display:flex;justify-content:flex-end;margin-top:6px">
                  <button onclick="deleteBankHistoryEntry('${entryId}','${date}',${idx})" style="background:none;border:none;color:rgba(239,68,68,0.35);cursor:pointer;font-size:11px;padding:2px 6px;border-radius:4px;transition:.2s" onmouseover="this.style.color='#ef4444';this.style.background='rgba(239,68,68,0.1)'" onmouseout="this.style.color='rgba(239,68,68,0.35)';this.style.background='none'">✕ delete</button>
                </div>
              </div>
            </div>
          </div>`;
      });
    });
  }

  // ── Render page ────────────────────────────────────────────────────
  document.getElementById('page-container').innerHTML = `
    <div class="fade-in" style="max-width:960px;margin:0 auto">

      <!-- Header -->
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px">
        <div>
          <h1 class="page-title">🏦 Bank Tracker</h1>
          <p class="page-subtitle">Balance history across all your accounts</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-secondary btn-sm" onclick="navigate('finance')">← Finance</button>
          ${accounts.length >= 2 ? `<button class="btn-primary btn-sm" onclick="openTransferModal()" style="background:linear-gradient(135deg,#f59e0b,#d97706)">⇄ Transfer</button>` : ''}
          <button class="btn-primary btn-sm" onclick="openQuickBalanceModal(${selId?`'${selId}'`:''})" style="background:linear-gradient(135deg,#00c9a7,#0acf83)">+ Log Balance</button>
        </div>
      </div>

      ${!accounts.length ? `
        <div class="glass-card" style="padding:60px;text-align:center">
          <div style="font-size:60px;margin-bottom:16px">🏦</div>
          <p style="font-size:18px;font-weight:700;margin-bottom:8px">No Bank Accounts Yet</p>
          <p style="color:var(--text3);margin-bottom:20px">Add bank accounts in Finance to start tracking</p>
          <button class="btn-primary" onclick="navigate('finance')">+ Add Bank Account</button>
        </div>` : `

      <!-- Total Balance Hero + Bank Selector -->
      <div style="position:relative;overflow:hidden;border-radius:24px;background:linear-gradient(135deg,#1a1a4e,#0d0d2e,#1a1a4e);border:1px solid rgba(0,201,167,0.25);padding:28px;margin-bottom:20px;box-shadow:0 20px 60px rgba(0,0,0,0.4)">
        <div style="position:absolute;top:-60px;right:-60px;width:220px;height:220px;border-radius:50%;background:rgba(0,201,167,0.07)"></div>
        <div style="position:relative">
          <p style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(0,201,167,0.7);margin-bottom:6px">🏦 Total Bank Balance</p>
          <p style="font-size:52px;font-weight:900;color:#00c9a7;letter-spacing:-2px;line-height:1">${fmt(totalBalance)}</p>
          <!-- Bank selector pills -->
          <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;overflow-x:auto;padding-bottom:4px">
            <!-- ALL pill -->
            <div onclick="bankTrackerAccount=null;renderBankTracker()" style="flex-shrink:0;padding:10px 16px;border-radius:14px;background:${!selId?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.06)'};border:1px solid ${!selId?'rgba(99,102,241,0.6)':'rgba(255,255,255,0.1)'};cursor:pointer;transition:.2s;text-align:center;min-width:70px">
              <p style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${!selId?'#818cf8':'rgba(255,255,255,0.45)'}">ALL</p>
              <p style="font-size:14px;font-weight:800;color:${!selId?'#818cf8':'rgba(255,255,255,0.65)'};margin-top:2px">${accounts.length} banks</p>
            </div>
            ${accounts.map(a => {
              const isActive = selId === a.id;
              const lastSnap = [...history].filter(h=>h.accountId===a.id).sort((x,y)=>y.date.localeCompare(x.date))[0];
              const lastDate = lastSnap ? formatRelativeDate(lastSnap.date) : 'No entries';
              return `
              <div onclick="bankTrackerAccount='${a.id}';renderBankTracker()" style="flex-shrink:0;padding:10px 16px;border-radius:14px;background:${isActive?'rgba(0,201,167,0.2)':'rgba(255,255,255,0.06)'};border:1px solid ${isActive?'rgba(0,201,167,0.5)':'rgba(255,255,255,0.08)'};cursor:pointer;transition:.2s;min-width:120px">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                  <span style="font-size:16px">${a.icon||'🏦'}</span>
                  <p style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.5)">${a.bankName}</p>
                </div>
                <p style="font-size:18px;font-weight:900;color:#fff">${fmt(a.balance||0)}</p>
                <p style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:2px">Updated ${lastDate}</p>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Chart + Stats row -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px" id="bt-main-grid">

        <!-- Trend Chart -->
        <div class="glass-card" style="padding:20px">
          <p class="section-title" style="font-size:13px;margin-bottom:12px">📈 30-Day Trend
            <span style="font-size:10px;font-weight:500;color:var(--text3);margin-left:6px">${selId?(getAccountById(selId)?.bankName||'Account'):'All Accounts'}</span>
          </p>
          ${!history.filter(h=>!selId||h.accountId===selId).length
            ? `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:160px;gap:8px"><div style="font-size:32px">📊</div><p style="color:var(--text3);font-size:12px;text-align:center">Log a balance to see the trend</p></div>`
            : `<div style="height:180px;position:relative"><canvas id="bank-trend-chart"></canvas></div>`}
        </div>

        <!-- Stats + Quick Log -->
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            ${[
              { label:'Accounts',  value:accounts.length,                                           icon:'🏦', tc:'#818cf8' },
              { label:'Entries',   value:history.filter(h=>!selId||h.accountId===selId).length,     icon:'📸', tc:'#00c9a7' },
              { label:'Transfers', value:transfers.length,                                          icon:'⇄',  tc:'#fbbf24' },
              { label:'Days',      value:sortedDates.length,                                        icon:'📅', tc:'#ec4899' },
            ].map(s=>`
              <div class="glass-card" style="padding:14px;text-align:center">
                <div style="font-size:16px;margin-bottom:6px">${s.icon}</div>
                <p style="font-size:20px;font-weight:800;color:${s.tc}">${s.value}</p>
                <p style="font-size:10px;color:var(--text3);margin-top:2px">${s.label}</p>
              </div>`).join('')}
          </div>
          <!-- Quick-log per bank -->
          <div class="glass-card" style="padding:14px;flex:1">
            <p style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:10px;letter-spacing:1px;text-transform:uppercase">Quick Log</p>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${accounts.map(a=>`
                <button onclick="openQuickBalanceModal('${a.id}')" style="display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:10px;background:rgba(0,201,167,0.08);border:1px solid rgba(0,201,167,0.2);color:#00c9a7;font-size:12px;font-weight:600;cursor:pointer;transition:.2s" onmouseover="this.style.background='rgba(0,201,167,0.18)'" onmouseout="this.style.background='rgba(0,201,167,0.08)'"><span>${a.icon||'🏦'}</span>${a.bankName}</button>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Chat-style Balance History -->
      <div class="glass-card" style="overflow:hidden;margin-bottom:20px">
        <!-- Chat header -->
        <div style="padding:14px 20px;border-bottom:1px solid var(--glass-border);display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,0.25)">
          <div style="display:flex;align-items:center;gap:10px">
            ${selId
              ? `<div style="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${getAccountById(selId)?.color||'#1e293b'},${getAccountById(selId)?.color2||'#0f172a'});font-size:18px">${getAccountById(selId)?.icon||'🏦'}</div>`
              : `<div style="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(99,102,241,0.2);font-size:18px">🏦</div>`}
            <div>
              <p style="font-size:14px;font-weight:700">${selId?(getAccountById(selId)?.bankName||'Account'):'All Banks'} — Balance Log</p>
              <p style="font-size:11px;color:var(--text3)">${filteredHistory.length} entries · newest at bottom</p>
            </div>
          </div>
          <button class="btn-primary btn-sm" onclick="openQuickBalanceModal(${selId?`'${selId}'`:''})" style="background:linear-gradient(135deg,#00c9a7,#0acf83)">+ Log</button>
        </div>

        <!-- Messages -->
        <div id="balance-chat" style="padding:16px 16px 8px;max-height:520px;overflow-y:auto;scroll-behavior:smooth">
          ${chatHTML}
        </div>

        <!-- Bottom input bar -->
        <div style="padding:10px 14px;border-top:1px solid var(--glass-border);background:rgba(0,0,0,0.2);display:flex;gap:10px;align-items:center">
          <div onclick="openQuickBalanceModal(${selId?`'${selId}'`:''})" style="flex:1;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid var(--glass-border);border-radius:10px;font-size:13px;color:var(--text3);cursor:pointer;transition:.2s" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
            Log balance for ${selId?(getAccountById(selId)?.bankName||'selected bank'):'any bank'}…
          </div>
          <button class="btn-primary" onclick="openQuickBalanceModal(${selId?`'${selId}'`:''})" style="background:linear-gradient(135deg,#00c9a7,#0acf83);padding:10px 18px;border-radius:10px;white-space:nowrap">+ Log</button>
        </div>
      </div>

      <!-- Transfer Log -->
      ${transfers.length ? `
      <div class="glass-card" style="overflow:hidden;margin-bottom:20px">
        <div style="padding:14px 20px;border-bottom:1px solid var(--glass-border);display:flex;justify-content:space-between;align-items:center">
          <p class="section-title">⇄ Transfer Log</p>
          <span style="font-size:12px;color:var(--text3)">${transfers.length} transfers</span>
        </div>
        ${[...transfers].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10).map(t=>{
          const from=getAccountById(t.fromId), to=getAccountById(t.toId);
          return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.04)">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="font-size:20px">⇄</div>
              <div>
                <p style="font-size:13px;font-weight:600">${from?.bankName||'?'} → ${to?.bankName||'?'}</p>
                <p style="font-size:11px;color:var(--text3)">${t.note||''} · ${fmtDate(t.date)}</p>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-weight:800;font-size:15px;color:#f59e0b">${fmt(t.amount)}</span>
              <button class="btn-icon btn-sm" onclick="deleteTransfer('${t.id}')" style="color:#ef4444;border-color:rgba(239,68,68,0.3)">✕</button>
            </div>
          </div>`;
        }).join('')}
      </div>` : ''}

      `}
    </div>`;

  // Scroll chat to bottom after render
  setTimeout(() => {
    const chat = document.getElementById('balance-chat');
    if (chat && sortedDates.length) chat.scrollTop = chat.scrollHeight;
  }, 80);

  // Responsive grid
  setTimeout(() => {
    const grid = document.getElementById('bt-main-grid');
    if (grid && window.innerWidth < 640) grid.style.gridTemplateColumns = '1fr';
  }, 50);

  // Render trend chart
  if (history.filter(h => !selId || h.accountId === selId).length) {
    setTimeout(() => renderBankTrendChart(chartLabels, chartData), 60);
  }
}

// ── Chart ──────────────────────────────────────────────────────────────────
function renderBankTrendChart(labels, data) {
  const canvas = document.getElementById('bank-trend-chart');
  if (!canvas) return;
  const isLight   = document.body.classList.contains('light');
  const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';

  chartInstances['bank-trend'] = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Balance',
        data,
        borderColor: '#00c9a7',
        borderWidth: 2.5,
        pointBackgroundColor: '#00c9a7',
        pointRadius: 3,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
        spanGaps: false,
        backgroundColor: ctx => {
          const { ctx: c, chartArea } = ctx.chart;
          if (!chartArea) return 'rgba(0,201,167,0.2)';
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, 'rgba(0,201,167,0.25)');
          g.addColorStop(1, 'rgba(0,201,167,0)');
          return g;
        }
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.95)', titleColor: '#94a3b8',
          bodyColor: '#fff', padding: 12,
          borderColor: 'rgba(0,201,167,0.3)', borderWidth: 1,
          callbacks: { label: ctx => ` ₹${ctx.parsed.y.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}` }
        }
      },
      scales: {
        x: { ticks: { color:'#64748b', font:{size:10}, maxRotation:45 }, grid: { color:gridColor } },
        y: {
          ticks: {
            color:'#64748b', font:{size:11},
            callback: v => `₹${Math.abs(v)>=100000?(v/100000).toFixed(1)+'L':Math.abs(v)>=1000?(v/1000).toFixed(0)+'k':v}`
          },
          grid: { color:gridColor }
        }
      }
    }
  });
}

// ── Log Balance Modal ──────────────────────────────────────────────────────
function openQuickBalanceModal(preSelectedId) {
  const accounts = STATE.bankAccounts || [];
  if (!accounts.length) { toast('Add a bank account first in Finance', 'error'); return; }

  const opts = accounts.map(a =>
    `<option value="${a.id}" ${preSelectedId === a.id ? 'selected' : ''}>${a.icon||'🏦'} ${a.bankName} — ${fmt(a.balance||0)}</option>`
  ).join('');

  const todayStr = today();
  const yday  = (() => { const d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); })();
  const y2day = (() => { const d=new Date(); d.setDate(d.getDate()-2); return d.toISOString().slice(0,10); })();

  openModal('💰 Log Bank Balance', `
    <div class="form-group">
      <label class="form-label">Account</label>
      <select id="qb-account" class="form-input">${opts}</select>
    </div>

    <div class="form-group">
      <label class="form-label">Balance Amount (₹)</label>
      <input type="number" id="qb-balance" class="form-input" placeholder="Enter current balance" step="0.01" min="0" autofocus/>
    </div>

    <div class="form-group">
      <label class="form-label">Date — When was this balance?</label>
      <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
        <button type="button" id="qb-btn-today" onclick="setQbDate('${todayStr}','today')" style="padding:6px 14px;border-radius:8px;border:1px solid rgba(0,201,167,0.5);background:rgba(0,201,167,0.15);color:#00c9a7;font-size:12px;font-weight:600;cursor:pointer">Today</button>
        <button type="button" id="qb-btn-yday"  onclick="setQbDate('${yday}','yday')"   style="padding:6px 14px;border-radius:8px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.06);color:var(--text2);font-size:12px;cursor:pointer">Yesterday</button>
        <button type="button" id="qb-btn-y2day" onclick="setQbDate('${y2day}','y2day')" style="padding:6px 14px;border-radius:8px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.06);color:var(--text2);font-size:12px;cursor:pointer">2 days ago</button>
        <button type="button" onclick="document.getElementById('qb-date').showPicker?document.getElementById('qb-date').showPicker():document.getElementById('qb-date').focus()" style="padding:6px 14px;border-radius:8px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.06);color:var(--text2);font-size:12px;cursor:pointer">📅 Pick date</button>
      </div>
      <input type="date" id="qb-date" class="form-input" value="${todayStr}" onchange="syncQbDateBtns(this.value,'${todayStr}','${yday}','${y2day}')"/>
    </div>

    <div class="form-group">
      <label class="form-label">Note (optional)</label>
      <input type="text" id="qb-note" class="form-input" placeholder="e.g. After salary credit, ATM withdrawal…"/>
    </div>

    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveQuickBalance()" style="background:linear-gradient(135deg,#00c9a7,#0acf83)">💾 Save Balance</button>
    </div>`);
}

function setQbDate(dateStr, key) {
  document.getElementById('qb-date').value = dateStr;
  ['today','yday','y2day'].forEach(k => {
    const btn = document.getElementById(`qb-btn-${k}`);
    if (!btn) return;
    const active = k === key;
    btn.style.background    = active ? 'rgba(0,201,167,0.15)' : 'rgba(255,255,255,0.06)';
    btn.style.borderColor   = active ? 'rgba(0,201,167,0.5)'  : 'var(--glass-border)';
    btn.style.color         = active ? '#00c9a7'              : 'var(--text2)';
    btn.style.fontWeight    = active ? '600' : '400';
  });
}

function syncQbDateBtns(val, todayStr, yday, y2day) {
  const map = { 'qb-btn-today': todayStr, 'qb-btn-yday': yday, 'qb-btn-y2day': y2day };
  Object.entries(map).forEach(([id, d]) => {
    const btn = document.getElementById(id); if (!btn) return;
    const active = val === d;
    btn.style.background  = active ? 'rgba(0,201,167,0.15)' : 'rgba(255,255,255,0.06)';
    btn.style.borderColor = active ? 'rgba(0,201,167,0.5)'  : 'var(--glass-border)';
    btn.style.color       = active ? '#00c9a7'              : 'var(--text2)';
    btn.style.fontWeight  = active ? '600' : '400';
  });
}

function saveQuickBalance() {
  const accountId = document.getElementById('qb-account')?.value;
  const newBal    = parseFloat(document.getElementById('qb-balance')?.value);
  const note      = document.getElementById('qb-note')?.value.trim() || 'Manual update';
  const date      = document.getElementById('qb-date')?.value || today();

  if (!accountId)           { toast('Select an account', 'error'); return; }
  if (isNaN(newBal) || newBal < 0) { toast('Enter a valid balance', 'error'); return; }

  const accounts = STATE.bankAccounts || [];
  const b = accounts.find(a => a.id === accountId);
  if (!b) return;

  // Find the previous balance snapshot on or before this date
  const prevSnap = [...(STATE.bankBalanceHistory||[])]
    .filter(h => h.accountId === accountId && h.date <= date)
    .sort((x, y) => y.date.localeCompare(x.date) || (y.createdAt||'').localeCompare(x.createdAt||''))[0];
  const oldBal = prevSnap !== undefined ? prevSnap.balance : b.balance;

  // Update current account balance only when logging for today or future
  if (date >= today()) b.balance = newBal;

  STATE.bankBalanceHistory = STATE.bankBalanceHistory || [];
  STATE.bankBalanceHistory.push({
    id: genId(),
    accountId,
    balance: newBal,
    prevBalance: oldBal,
    date,
    note,
    createdAt: new Date().toISOString()
  });

  saveState();
  closeModal();
  if (typeof addXP === 'function') addXP(3, 'Balance logged');
  toast(`${b.bankName} → ${fmt(newBal)} saved ✅`, 'success');
  bankTrackerAccount = accountId; // Switch to this bank's chat view
  renderBankTracker();
}

// ── Delete a balance history entry ─────────────────────────────────────────
function deleteBankHistoryEntry(id, date, idx) {
  const history = STATE.bankBalanceHistory || [];
  let target = history.find(h => h.id === id);
  if (!target) target = history.filter(h => h.date === date)[idx]; // fallback for old entries without id
  if (!target) return;
  STATE.bankBalanceHistory = history.filter(h => h !== target);
  saveState();
  toast('Entry removed', 'info');
  renderBankTracker();
}

// ── Transfer Modal ──────────────────────────────────────────────────────────
function openTransferModal() {
  const accounts = STATE.bankAccounts || [];
  if (accounts.length < 2) { toast('Need at least 2 accounts to transfer', 'warning'); return; }
  const opts = accounts.map(a => `<option value="${a.id}">${a.icon||'🏦'} ${a.bankName} (${fmt(a.balance||0)})</option>`).join('');
  openModal('⇄ Transfer Between Accounts', `
    <div class="form-group"><label class="form-label">From Account</label>
      <select id="tf-from" class="form-input">${opts}</select></div>
    <div class="form-group"><label class="form-label">To Account</label>
      <select id="tf-to" class="form-input">${opts}</select></div>
    <div class="form-group"><label class="form-label">Amount (₹)</label>
      <input type="number" id="tf-amount" class="form-input" placeholder="0.00" min="0.01" step="0.01"/></div>
    <div class="form-group"><label class="form-label">Note (optional)</label>
      <input type="text" id="tf-note" class="form-input" placeholder="e.g. Salary transfer, emergency fund…"/></div>
    <div class="form-group"><label class="form-label">Date</label>
      <input type="date" id="tf-date" class="form-input" value="${today()}"/></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveTransfer()" style="background:linear-gradient(135deg,#f59e0b,#d97706)">⇄ Transfer</button>
    </div>`);
}

function saveTransfer() {
  const fromId = document.getElementById('tf-from')?.value;
  const toId   = document.getElementById('tf-to')?.value;
  const amount = parseFloat(document.getElementById('tf-amount')?.value);
  const note   = document.getElementById('tf-note')?.value.trim() || 'Transfer';
  const date   = document.getElementById('tf-date')?.value || today();

  if (fromId === toId)        { toast('Select different accounts', 'error'); return; }
  if (!amount || amount <= 0) { toast('Enter a valid amount', 'error'); return; }

  const accounts = STATE.bankAccounts || [];
  const from = accounts.find(a => a.id === fromId);
  const to   = accounts.find(a => a.id === toId);
  if (!from || !to) return;
  if (from.balance < amount) { toast(`Insufficient balance in ${from.bankName}`, 'error'); return; }

  from.balance -= amount;
  to.balance   += amount;

  STATE.bankTransfers = STATE.bankTransfers || [];
  STATE.bankTransfers.push({ id: genId(), fromId, toId, amount, date, note });

  STATE.bankBalanceHistory = STATE.bankBalanceHistory || [];
  const ts = new Date().toISOString();
  STATE.bankBalanceHistory.push({ id: genId(), accountId: fromId, balance: from.balance, prevBalance: from.balance + amount, date, note: `Transfer out → ${to.bankName}`,   createdAt: ts });
  STATE.bankBalanceHistory.push({ id: genId(), accountId: toId,   balance: to.balance,   prevBalance: to.balance - amount,   date, note: `Transfer in ← ${from.bankName}`, createdAt: ts });

  saveState();
  closeModal();
  if (typeof addXP === 'function') addXP(5, 'Transfer logged');
  toast(`⇄ Transferred ${fmt(amount)} from ${from.bankName} to ${to.bankName} ✅`, 'success');
  renderBankTracker();
}

function deleteTransfer(id) {
  STATE.bankTransfers = (STATE.bankTransfers || []).filter(t => t.id !== id);
  saveState();
  toast('Transfer removed', 'info');
  renderBankTracker();
}
