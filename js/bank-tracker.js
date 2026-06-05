// ===== BANK TRACKER PAGE =====
let bankTrackerAccount = null; // currently selected account id
let bankTrackerTab     = 'banks'; // 'banks' | 'cards' | 'cash'
let bankTrackerCard    = null;    // currently selected credit card id
let bankTrackerCash    = null;    // currently selected cash account id
let trendPeriod        = '30d';   // '30d' | '1y' — shared by bank, card & cash trend charts

function setTrendPeriod(p) { trendPeriod = p; renderBankTracker(); }

// The current balance / outstanding shown for an account/card must always be
// the value from its most recent DATED snapshot (newest date, then newest
// createdAt) — not whatever a stray edit or import last wrote. This self-heals
// any stored field that drifted out of sync with the history log.
function _latestSnapValue(history, idField, id, valField) {
  let latest = null;
  (history || []).forEach(h => {
    if (h[idField] !== id) return;
    if (!latest || h.date > latest.date ||
        (h.date === latest.date && (h.createdAt || '') > (latest.createdAt || ''))) {
      latest = h;
    }
  });
  return latest ? latest[valField] : null;
}

function reconcileCurrentBalances() {
  let changed = false;
  (STATE.creditCards || []).forEach(c => {
    const v = _latestSnapValue(STATE.creditCardHistory, 'cardId', c.id, 'outstanding');
    if (v !== null && c.outstanding !== v) { c.outstanding = v; changed = true; }
  });
  (STATE.bankAccounts || []).forEach(a => {
    const v = _latestSnapValue(STATE.bankBalanceHistory, 'accountId', a.id, 'balance');
    if (v !== null && a.balance !== v) { a.balance = v; changed = true; }
  });
  (STATE.cashAccounts || []).forEach(a => {
    const v = _latestSnapValue(STATE.cashBalanceHistory, 'accountId', a.id, 'balance');
    if (v !== null && a.balance !== v) { a.balance = v; changed = true; }
  });
  if (changed && typeof saveState === 'function') saveState();
}

// Build a balance/outstanding trend series.
//   items   : the accounts/cards to total (already filtered to selected or all)
//   history : bankBalanceHistory or creditCardHistory
//   idField : 'accountId' | 'cardId'
//   valField: 'balance' | 'outstanding'
// For each bucket the value is the CLOSING figure on that day — the most
// recent snapshot on or before the day (carry-forward), so a month shows the
// balance on its LAST day, not merely the last entry that was logged.
function buildTrendSeries(period, items, history, idField, valField) {
  const valOnDate = (id, dateStr) => {
    const snaps = history.filter(h => h[idField] === id && h.date <= dateStr)
                         .sort((a, b) => a.date.localeCompare(b.date));
    return snaps.length ? snaps[snaps.length - 1][valField] : null;
  };
  const firstDateOf = (id) => {
    const snaps = history.filter(h => h[idField] === id).sort((a, b) => a.date.localeCompare(b.date));
    return snaps.length ? snaps[0].date : null;
  };

  const buckets = [];
  if (period === '1y') {
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const m    = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const last = new Date(m.getFullYear(), m.getMonth() + 1, 0); // last calendar day of that month
      buckets.push({ label: m.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), date: last.toISOString().slice(0, 10) });
    }
  } else {
    for (let i = 29; i >= 0; i--) {
      const d  = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      buckets.push({ label: new Date(ds).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), date: ds });
    }
  }

  const labels = buckets.map(b => b.label);
  const data = buckets.map(b => {
    let total = 0, has = false;
    items.forEach(it => {
      const first = firstDateOf(it.id);
      if (!first || b.date < first) return;
      const v = valOnDate(it.id, b.date);
      if (v !== null) { total += v; has = true; }
    });
    return has ? total : null;
  });
  return { labels, data };
}

function _trendToggleHtml(accent) {
  const mk = (p, txt) => `<button onclick="setTrendPeriod('${p}')" style="padding:4px 12px;border-radius:14px;border:1px solid ${trendPeriod===p?accent:'rgba(255,255,255,0.12)'};background:${trendPeriod===p?accent+'22':'transparent'};color:${trendPeriod===p?accent:'var(--text3)'};font-size:11px;font-weight:700;cursor:pointer;transition:.15s">${txt}</button>`;
  return `<div style="display:flex;gap:6px">${mk('30d','30 Days')}${mk('1y','1 Year')}</div>`;
}

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
  reconcileCurrentBalances();
  if (bankTrackerTab === 'cards') { renderCCTracker(); return; }
  if (bankTrackerTab === 'cash')  { renderCashTracker(); return; }

  const accounts  = STATE.bankAccounts || [];
  const history   = STATE.bankBalanceHistory || [];
  const transfers = STATE.bankTransfers || [];
  const isLight   = document.body.classList.contains('light');

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const getAccountById = id => accounts.find(a => a.id === id);
  const selId = bankTrackerAccount;

  // ── Trend chart data (30 days or 1 year, closing balance per bucket) ──
  const chartAccounts = selId ? accounts.filter(a => a.id === selId) : accounts;
  const { labels: chartLabels, data: chartData } =
    buildTrendSeries(trendPeriod, chartAccounts, history, 'accountId', 'balance');

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
          <div style="flex:1;height:1px;background:${isLight?'rgba(0,0,0,0.1)':'rgba(255,255,255,0.07)'}"></div>
          <span style="font-size:11px;font-weight:700;color:var(--text3);white-space:nowrap;padding:4px 12px;background:${isLight?'rgba(0,0,0,0.05)':'rgba(255,255,255,0.05)'};border-radius:20px">${formatRelativeDate(date)} &nbsp;·&nbsp; ${new Date(date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</span>
          <div style="flex:1;height:1px;background:${isLight?'rgba(0,0,0,0.1)':'rgba(255,255,255,0.07)'}"></div>
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
        const bubbleBg     = isTx ? (isLight ? 'rgba(245,158,11,0.18)' : 'rgba(245,158,11,0.1)')  : (isLight ? 'rgba(0,201,167,0.14)' : 'rgba(0,201,167,0.08)');
        const bubbleBorder = isTx ? (isLight ? 'rgba(245,158,11,0.5)'  : 'rgba(245,158,11,0.3)')  : (isLight ? 'rgba(0,201,167,0.45)' : 'rgba(0,201,167,0.25)');
        const entryId = h.id || `${date}-${idx}`;

        chatHTML += `
          <div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:12px;padding:0 4px">
            <div style="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${acc?`linear-gradient(135deg,${acc.color||'#1e293b'},${acc.color2||'#0f172a'})`:'rgba(99,102,241,0.2)'};font-size:17px;flex-shrink:0">${acc?.icon||'🏦'}</div>
            <div style="max-width:78%">
              <div style="font-size:10px;color:var(--text3);margin-bottom:3px;font-weight:600;padding-left:2px">${!selId?(acc?.bankName||'Bank')+' · ':''}${isTx?(isIn?'💸 Transfer In':'💸 Transfer Out'):'💰 Balance Update'}</div>
              <div style="background:${bubbleBg};border:1px solid ${bubbleBorder};border-radius:4px 16px 16px 16px;padding:12px 16px">
                <div style="font-size:24px;font-weight:900;color:${isLight?'#065f46':'#fff'};letter-spacing:-0.5px">${fmt(h.balance)}</div>
                ${delta !== null ? `
                  <div style="display:flex;align-items:center;gap:8px;margin-top:5px;flex-wrap:wrap">
                    <span style="font-size:12px;font-weight:700;color:${dc}">${di} ${same?'No change':(up?'+':'')+fmt(Math.abs(delta))}</span>
                    ${h.prevBalance !== undefined ? `<span style="font-size:10px;color:var(--text3)">from ${fmt(h.prevBalance)}</span>` : ''}
                  </div>` : ''}
                ${h.note && h.note !== 'Manual update' ? `<div style="font-size:11px;color:var(--text3);margin-top:8px;padding-top:7px;border-top:1px solid ${isLight?'rgba(0,0,0,0.1)':'rgba(255,255,255,0.07)'}">${h.note}</div>` : ''}
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
          <h1 class="page-title"><i data-lucide="wallet"></i> Finance</h1>
          <p class="page-subtitle">Balance history across all your accounts</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-secondary btn-sm" onclick="navigate('finance')">← Finance</button>
          <button class="btn-secondary btn-sm" onclick="openBalanceImport('bank')">📥 Import PDF/Excel</button>
          ${accounts.length >= 2 ? `<button class="btn-primary btn-sm" onclick="openTransferModal()" style="background:linear-gradient(135deg,#f59e0b,#d97706)">⇄ Transfer</button>` : ''}
          <button class="btn-primary btn-sm" onclick="openQuickBalanceModal(${selId?`'${selId}'`:''})" style="background:linear-gradient(135deg,#00c9a7,#0acf83)">+ Log Balance</button>
        </div>
      </div>

      <!-- Tab Bar -->
      <div style="display:flex;gap:8px;margin-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:0">
        <button onclick="bankTrackerTab='banks';renderBankTracker()" style="padding:10px 20px;border:none;background:none;font-size:13px;font-weight:700;cursor:pointer;border-bottom:2px solid ${bankTrackerTab==='banks'?'#00c9a7':'transparent'};color:${bankTrackerTab==='banks'?'#00c9a7':'var(--text3)'};transition:.2s">🏦 Banks</button>
        <button onclick="bankTrackerTab='cards';renderBankTracker()" style="padding:10px 20px;border:none;background:none;font-size:13px;font-weight:700;cursor:pointer;border-bottom:2px solid ${bankTrackerTab==='cards'?'#ef4444':'transparent'};color:${bankTrackerTab==='cards'?'#ef4444':'var(--text3)'};transition:.2s">💳 Credit Cards</button>
        <button onclick="bankTrackerTab='cash';renderBankTracker()" style="padding:10px 20px;border:none;background:none;font-size:13px;font-weight:700;cursor:pointer;border-bottom:2px solid ${bankTrackerTab==='cash'?'#f59e0b':'transparent'};color:${bankTrackerTab==='cash'?'#f59e0b':'var(--text3)'};transition:.2s">💵 Cash</button>
      </div>

      ${!accounts.length ? `
        <div class="glass-card" style="padding:60px;text-align:center">
          <div style="font-size:60px;margin-bottom:16px">🏦</div>
          <p style="font-size:18px;font-weight:700;margin-bottom:8px">No Bank Accounts Yet</p>
          <p style="color:var(--text3);margin-bottom:20px">Add bank accounts in Finance to start tracking</p>
          <button class="btn-primary" onclick="navigate('finance')">+ Add Bank Account</button>
        </div>` : `

      <!-- Total Balance Hero + Bank Selector -->
      <div class="fin-dark-card" style="position:relative;overflow:hidden;border-radius:24px;background:linear-gradient(135deg,#1a1a4e,#0d0d2e,#1a1a4e);border:1px solid rgba(0,201,167,0.25);padding:28px;margin-bottom:20px;box-shadow:0 20px 60px rgba(0,0,0,0.4)">
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
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">
            <p class="section-title" style="font-size:13px;margin:0"><i data-lucide="trending-up"></i> ${trendPeriod==='1y'?'1-Year':'30-Day'} Trend
              <span style="font-size:10px;font-weight:500;color:var(--text3);margin-left:6px">${selId?(getAccountById(selId)?.bankName||'Account'):'All Accounts'}</span>
            </p>
            ${_trendToggleHtml('#00c9a7')}
          </div>
          ${!history.filter(h=>!selId||h.accountId===selId).length
            ? `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:160px;gap:8px"><div style="font-size:32px">📊</div><p style="color:var(--text3);font-size:12px;text-align:center">Log a balance to see the trend</p></div>`
            : `<div style="height:180px;position:relative"><canvas id="bank-trend-chart"></canvas></div>`}
        </div>

        <!-- Stats + Quick Log -->
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px" class="bt-stats">
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
          <div class="glass-card bt-quicklog" style="padding:14px;flex:1">
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
          <p class="section-title"><i data-lucide="arrow-left-right"></i> Transfer Log</p>
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

// ===== CREDIT CARD TRACKER =====
function renderCCTracker() {
  const cards   = STATE.creditCards || [];
  const history = STATE.creditCardHistory || [];
  const selId   = bankTrackerCard;
  const isLight = document.body.classList.contains('light');
  const getCardById = id => cards.find(c => c.id === id);

  const totalOutstanding = cards.reduce((s,c)=>s+(c.outstanding||0),0);
  const totalLimit       = cards.reduce((s,c)=>s+(c.limit||0),0);
  const overallUtil      = totalLimit > 0 ? Math.round((totalOutstanding/totalLimit)*100) : 0;
  const utilColor        = overallUtil > 80 ? '#ef4444' : overallUtil > 50 ? '#f59e0b' : '#10b981';

  // ── Trend chart data (30 days or 1 year, closing outstanding per bucket) ──
  const chartCards = selId ? cards.filter(c=>c.id===selId) : cards;
  const { labels: chartLabels, data: chartData } =
    buildTrendSeries(trendPeriod, chartCards, history, 'cardId', 'outstanding');

  // ── Chat history ──
  const filteredHistory = [...history]
    .filter(h => !selId || h.cardId === selId)
    .sort((a,b) => a.date.localeCompare(b.date) || (a.createdAt||'').localeCompare(b.createdAt||''));

  const grouped = {};
  filteredHistory.forEach(h => {
    if (!grouped[h.date]) grouped[h.date] = [];
    grouped[h.date].push(h);
  });
  const sortedDates = Object.keys(grouped).sort();

  let chatHTML = '';
  if (!sortedDates.length) {
    chatHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:12px;text-align:center">
        <div style="font-size:48px">💳</div>
        <p style="font-weight:700;font-size:16px">No payment history yet</p>
        <p style="color:var(--text3);font-size:13px">Tap "↑ Pay" on any credit card to start tracking.<br>Log payments, purchases, and statements!</p>
      </div>`;
  } else {
    sortedDates.forEach(date => {
      chatHTML += `
        <div style="display:flex;align-items:center;gap:10px;margin:18px 0 10px">
          <div style="flex:1;height:1px;background:${isLight?'rgba(0,0,0,0.1)':'rgba(255,255,255,0.07)'}"></div>
          <span style="font-size:11px;font-weight:700;color:var(--text3);white-space:nowrap;padding:4px 12px;background:${isLight?'rgba(0,0,0,0.05)':'rgba(255,255,255,0.05)'};border-radius:20px">${formatRelativeDate(date)} &nbsp;·&nbsp; ${new Date(date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</span>
          <div style="flex:1;height:1px;background:${isLight?'rgba(0,0,0,0.1)':'rgba(255,255,255,0.07)'}"></div>
        </div>`;
      grouped[date].forEach((h, idx) => {
        const card  = getCardById(h.cardId);
        const delta = (h.prevOutstanding !== undefined && h.prevOutstanding !== null) ? h.outstanding - h.prevOutstanding : null;
        const up    = delta !== null && delta > 0;  // outstanding went up = more debt
        const same  = delta === 0;
        const dc    = same ? '#94a3b8' : up ? '#ef4444' : '#10b981';
        const di    = same ? '→' : up ? '↑ More debt' : '↓ Paid off';
        const pct   = card ? Math.min(100, Math.round((h.outstanding/(card.limit||1))*100)) : 0;
        const uc    = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981';
        chatHTML += `
          <div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:12px;padding:0 4px">
            <div style="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${card?`linear-gradient(135deg,${card.color||'#1e293b'},${card.color2||'#0f172a'})`:'rgba(239,68,68,0.2)'};font-size:17px;flex-shrink:0">💳</div>
            <div style="max-width:78%">
              <div style="font-size:10px;color:var(--text3);margin-bottom:3px;font-weight:600;padding-left:2px">${!selId?(card?.bankName||'Card')+' · ':''}💳 Outstanding Update</div>
              <div style="background:${isLight?'rgba(239,68,68,0.12)':'rgba(239,68,68,0.08)'};border:1px solid ${isLight?'rgba(239,68,68,0.4)':'rgba(239,68,68,0.25)'};border-radius:4px 16px 16px 16px;padding:12px 16px">
                <div style="font-size:24px;font-weight:900;color:${isLight?'#b91c1c':'#fff'};letter-spacing:-0.5px">${fmt(h.outstanding)}</div>
                ${delta !== null ? `
                  <div style="display:flex;align-items:center;gap:8px;margin-top:5px;flex-wrap:wrap">
                    <span style="font-size:12px;font-weight:700;color:${dc}">${di}: ${same?'No change':(up?'+':'')+fmt(Math.abs(delta))}</span>
                    ${h.prevOutstanding !== undefined ? `<span style="font-size:10px;color:var(--text3)">from ${fmt(h.prevOutstanding)}</span>` : ''}
                  </div>` : ''}
                ${card ? `
                  <div style="margin-top:8px">
                    <div style="height:4px;border-radius:4px;background:${isLight?'rgba(0,0,0,0.1)':'rgba(255,255,255,0.1)'}"><div style="height:4px;border-radius:4px;width:${pct}%;background:${uc}"></div></div>
                    <span style="font-size:10px;color:var(--text3);margin-top:3px;display:block">${pct}% of ${fmt(card.limit||0)} limit</span>
                  </div>` : ''}
                ${h.note && h.note !== 'Balance update' ? `<div style="font-size:11px;color:var(--text3);margin-top:8px;padding-top:7px;border-top:1px solid ${isLight?'rgba(0,0,0,0.1)':'rgba(255,255,255,0.07)'}">${h.note}</div>` : ''}
                <div style="display:flex;justify-content:flex-end;margin-top:6px">
                  <button onclick="deleteCCHistoryEntry('${h.id||''}','${date}',${idx})" style="background:none;border:none;color:rgba(239,68,68,0.35);cursor:pointer;font-size:11px;padding:2px 6px;border-radius:4px;transition:.2s" onmouseover="this.style.color='#ef4444';this.style.background='rgba(239,68,68,0.1)'" onmouseout="this.style.color='rgba(239,68,68,0.35)';this.style.background='none'">✕ delete</button>
                </div>
              </div>
            </div>
          </div>`;
      });
    });
  }

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in" style="max-width:960px;margin:0 auto">

      <!-- Header -->
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px">
        <div>
          <h1 class="page-title"><i data-lucide="wallet"></i> Finance</h1>
          <p class="page-subtitle">Credit card outstanding history</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-secondary btn-sm" onclick="navigate('finance')">← Finance</button>
          <button class="btn-secondary btn-sm" onclick="openBalanceImport('card')">📥 Import PDF/Excel</button>
          ${selId ? `<button class="btn-primary btn-sm" onclick="openUpdateCCModal('${selId}')" style="background:linear-gradient(135deg,#ef4444,#b91c1c)">↑ Update Outstanding</button>` : ''}
        </div>
      </div>

      <!-- Tab Bar -->
      <div style="display:flex;gap:8px;margin-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:0">
        <button onclick="bankTrackerTab='banks';renderBankTracker()" style="padding:10px 20px;border:none;background:none;font-size:13px;font-weight:700;cursor:pointer;border-bottom:2px solid transparent;color:var(--text3);transition:.2s">🏦 Banks</button>
        <button onclick="bankTrackerTab='cards';renderBankTracker()" style="padding:10px 20px;border:none;background:none;font-size:13px;font-weight:700;cursor:pointer;border-bottom:2px solid #ef4444;color:#ef4444;transition:.2s">💳 Credit Cards</button>
        <button onclick="bankTrackerTab='cash';renderBankTracker()" style="padding:10px 20px;border:none;background:none;font-size:13px;font-weight:700;cursor:pointer;border-bottom:2px solid transparent;color:var(--text3);transition:.2s">💵 Cash</button>
      </div>

      ${!cards.length ? `
        <div class="glass-card" style="padding:60px;text-align:center">
          <div style="font-size:60px;margin-bottom:16px">💳</div>
          <p style="font-size:18px;font-weight:700;margin-bottom:8px">No Credit Cards Yet</p>
          <p style="color:var(--text3);margin-bottom:20px">Add credit cards in Finance to start tracking</p>
          <button class="btn-primary" onclick="navigate('finance')">+ Add Credit Card</button>
        </div>` : `

      <!-- Summary Hero -->
      <div class="fin-dark-card" style="position:relative;overflow:hidden;border-radius:24px;background:linear-gradient(135deg,#2d0a0a,#1a0505,#2d0a0a);border:1px solid rgba(239,68,68,0.25);padding:28px;margin-bottom:20px;box-shadow:0 20px 60px rgba(0,0,0,0.4)">
        <div style="position:absolute;top:-60px;right:-60px;width:220px;height:220px;border-radius:50%;background:rgba(239,68,68,0.07)"></div>
        <div style="position:relative">
          <p style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(239,68,68,0.7);margin-bottom:6px">💳 Total Outstanding</p>
          <p style="font-size:52px;font-weight:900;color:#ef4444;letter-spacing:-2px;line-height:1">${fmt(totalOutstanding)}</p>
          <div style="margin-top:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <span style="font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;background:rgba(239,68,68,0.15);color:${utilColor}">${overallUtil}% utilised</span>
            <span style="font-size:12px;color:rgba(255,255,255,0.5)">Total Limit: ${fmt(totalLimit)}</span>
          </div>
          <!-- Card selector pills -->
          <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;overflow-x:auto;padding-bottom:4px">
            <div onclick="bankTrackerCard=null;renderBankTracker()" style="flex-shrink:0;padding:10px 16px;border-radius:14px;background:${!selId?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.06)'};border:1px solid ${!selId?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.08)'};cursor:pointer;min-width:70px;text-align:center">
              <p style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${!selId?'#ef4444':'rgba(255,255,255,0.45)'}">ALL</p>
              <p style="font-size:14px;font-weight:800;color:${!selId?'#ef4444':'rgba(255,255,255,0.65)'};margin-top:2px">${cards.length} cards</p>
            </div>
            ${cards.map(c => {
              const isActive = selId === c.id;
              const lastSnap = [...history].filter(h=>h.cardId===c.id).sort((x,y)=>y.date.localeCompare(x.date))[0];
              const lastDate = lastSnap ? formatRelativeDate(lastSnap.date) : 'No entries';
              const pct = Math.min(100, Math.round(((c.outstanding||0)/(c.limit||1))*100));
              const uc  = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981';
              return `
              <div onclick="bankTrackerCard='${c.id}';renderBankTracker()" style="flex-shrink:0;padding:10px 16px;border-radius:14px;background:${isActive?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.06)'};border:1px solid ${isActive?'rgba(239,68,68,0.4)':'rgba(255,255,255,0.08)'};cursor:pointer;min-width:130px">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                  <span style="font-size:16px">💳</span>
                  <p style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.5)">${c.bankName}</p>
                </div>
                <p style="font-size:16px;font-weight:900;color:#ef4444">${fmt(c.outstanding||0)}</p>
                <div style="height:3px;border-radius:3px;background:rgba(255,255,255,0.1);margin-top:5px"><div style="height:3px;border-radius:3px;width:${pct}%;background:${uc}"></div></div>
                <p style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:3px">${pct}% · Updated ${lastDate}</p>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Chart + Stats -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px" id="cc-main-grid">
        <!-- Trend Chart -->
        <div class="glass-card" style="padding:20px">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">
            <p class="section-title" style="font-size:13px;margin:0"><i data-lucide="trending-up"></i> ${trendPeriod==='1y'?'1-Year':'30-Day'} Outstanding
              <span style="font-size:10px;font-weight:500;color:var(--text3);margin-left:6px">${selId?(getCardById(selId)?.bankName||'Card'):'All Cards'}</span>
            </p>
            ${_trendToggleHtml('#ef4444')}
          </div>
          ${!history.filter(h=>!selId||h.cardId===selId).length
            ? `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:160px;gap:8px"><div style="font-size:32px">📊</div><p style="color:var(--text3);font-size:12px;text-align:center">Log outstanding to see the trend</p></div>`
            : `<div style="height:180px;position:relative"><canvas id="cc-trend-chart"></canvas></div>`}
        </div>

        <!-- Stats + Cards overview -->
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px" class="bt-stats">
            ${[
              { label:'Cards',      value:cards.length,                                              icon:'💳', tc:'#ef4444' },
              { label:'Entries',    value:history.filter(h=>!selId||h.cardId===selId).length,        icon:'📸', tc:'#f59e0b' },
              { label:'Total Limit',value:fmt(totalLimit),                                           icon:'🔝', tc:'#8b5cf6' },
              { label:'Available',  value:fmt(Math.max(0,totalLimit-totalOutstanding)),              icon:'✅', tc:'#10b981' },
            ].map(s=>`
              <div class="glass-card" style="padding:14px;text-align:center">
                <div style="font-size:16px;margin-bottom:6px">${s.icon}</div>
                <p style="font-size:${s.value.toString().length>6?'14':'18'}px;font-weight:800;color:${s.tc}">${s.value}</p>
                <p style="font-size:10px;color:var(--text3);margin-top:2px">${s.label}</p>
              </div>`).join('')}
          </div>
          <!-- Quick update per card -->
          <div class="glass-card bt-quicklog" style="padding:14px;flex:1">
            <p style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:10px;letter-spacing:1px;text-transform:uppercase">Quick Update</p>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${cards.map(c=>`
                <button onclick="openUpdateCCModal('${c.id}')" style="display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:10px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#ef4444;font-size:12px;font-weight:600;cursor:pointer;transition:.2s" onmouseover="this.style.background='rgba(239,68,68,0.18)'" onmouseout="this.style.background='rgba(239,68,68,0.08)'">💳 ${c.bankName}</button>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Chat-style History -->
      <div class="glass-card" style="overflow:hidden;margin-bottom:20px">
        <div style="padding:14px 20px;border-bottom:1px solid var(--glass-border);display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,0.25)">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(239,68,68,0.2);font-size:18px">💳</div>
            <div>
              <p style="font-size:14px;font-weight:700">${selId?(getCardById(selId)?.bankName||'Card'):'All Cards'} — Outstanding Log</p>
              <p style="font-size:11px;color:var(--text3)">${filteredHistory.length} entries · newest at bottom</p>
            </div>
          </div>
          ${selId ? `<button class="btn-primary btn-sm" onclick="openUpdateCCModal('${selId}')" style="background:linear-gradient(135deg,#ef4444,#b91c1c)">+ Log</button>` : ''}
        </div>
        <div id="cc-chat" style="padding:16px 16px 8px;max-height:520px;overflow-y:auto;scroll-behavior:smooth">
          ${chatHTML}
        </div>
        <div style="padding:10px 14px;border-top:1px solid var(--glass-border);background:rgba(0,0,0,0.2);display:flex;gap:10px;align-items:center">
          <div onclick="${selId?`openUpdateCCModal('${selId}')`:'openUpdateCCModal((STATE.creditCards||[])[0]?.id)'}" style="flex:1;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid var(--glass-border);border-radius:10px;font-size:13px;color:var(--text3);cursor:pointer;transition:.2s">
            Update outstanding for ${selId?(getCardById(selId)?.bankName||'selected card'):'any card'}…
          </div>
          <button class="btn-primary" onclick="${selId?`openUpdateCCModal('${selId}')`:'openUpdateCCModal((STATE.creditCards||[])[0]?.id)'}" style="background:linear-gradient(135deg,#ef4444,#b91c1c);padding:10px 18px;border-radius:10px;white-space:nowrap">+ Log</button>
        </div>
      </div>

      `}
    </div>`;

  // Scroll chat to bottom
  setTimeout(() => {
    const chat = document.getElementById('cc-chat');
    if (chat && sortedDates.length) chat.scrollTop = chat.scrollHeight;
  }, 80);

  // Responsive grid
  setTimeout(() => {
    const grid = document.getElementById('cc-main-grid');
    if (grid && window.innerWidth < 640) grid.style.gridTemplateColumns = '1fr';
  }, 50);

  // Trend chart
  if (history.filter(h => !selId || h.cardId === selId).length) {
    setTimeout(() => renderCCTrendChart(chartLabels, chartData), 60);
  }
}

function renderCCTrendChart(labels, data) {
  const canvas = document.getElementById('cc-trend-chart');
  if (!canvas) return;
  const isLight   = document.body.classList.contains('light');
  const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';

  chartInstances['cc-trend'] = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Outstanding',
        data,
        borderColor: '#ef4444',
        borderWidth: 2.5,
        pointBackgroundColor: '#ef4444',
        pointRadius: 3,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
        spanGaps: false,
        backgroundColor: ctx => {
          const { ctx: c, chartArea } = ctx.chart;
          if (!chartArea) return 'rgba(239,68,68,0.2)';
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, 'rgba(239,68,68,0.25)');
          g.addColorStop(1, 'rgba(239,68,68,0)');
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
          borderColor: 'rgba(239,68,68,0.3)', borderWidth: 1,
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

function deleteCCHistoryEntry(id, date, idx) {
  const history = STATE.creditCardHistory || [];
  let target = history.find(h => h.id === id);
  if (!target) target = history.filter(h => h.date === date)[idx];
  if (!target) return;
  STATE.creditCardHistory = history.filter(h => h !== target);
  saveState();
  toast('Entry removed', 'info');
  renderBankTracker();
}

// ===== CASH TRACKER =====

function renderCashTracker() {
  const accounts = STATE.cashAccounts || [];
  const history  = STATE.cashBalanceHistory || [];
  const selId    = bankTrackerCash;
  const isLight  = document.body.classList.contains('light');
  const getById  = id => accounts.find(a => a.id === id);

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  const chartAccounts = selId ? accounts.filter(a => a.id === selId) : accounts;
  const { labels: chartLabels, data: chartData } =
    buildTrendSeries(trendPeriod, chartAccounts, history, 'accountId', 'balance');

  const filteredHistory = [...history]
    .filter(h => !selId || h.accountId === selId)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt||'').localeCompare(b.createdAt||''));

  const grouped = {};
  filteredHistory.forEach(h => {
    if (!grouped[h.date]) grouped[h.date] = [];
    grouped[h.date].push(h);
  });
  const sortedDates = Object.keys(grouped).sort();

  let chatHTML = '';
  if (!sortedDates.length) {
    chatHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:12px;text-align:center">
        <div style="font-size:48px">💵</div>
        <p style="font-weight:700;font-size:16px">No cash balance history yet</p>
        <p style="color:var(--text3);font-size:13px">Tap "+ Log Cash" to start tracking your physical cash.</p>
        <button class="btn-primary btn-sm" onclick="openQuickCashModal(${selId?`'${selId}'`:''})" style="background:linear-gradient(135deg,#f59e0b,#d97706)">+ Log Cash</button>
      </div>`;
  } else {
    sortedDates.forEach(date => {
      chatHTML += `
        <div style="display:flex;align-items:center;gap:10px;margin:18px 0 10px">
          <div style="flex:1;height:1px;background:${isLight?'rgba(0,0,0,0.1)':'rgba(255,255,255,0.07)'}"></div>
          <span style="font-size:11px;font-weight:700;color:var(--text3);white-space:nowrap;padding:4px 12px;background:${isLight?'rgba(0,0,0,0.05)':'rgba(255,255,255,0.05)'};border-radius:20px">${formatRelativeDate(date)} &nbsp;·&nbsp; ${new Date(date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</span>
          <div style="flex:1;height:1px;background:${isLight?'rgba(0,0,0,0.1)':'rgba(255,255,255,0.07)'}"></div>
        </div>`;
      grouped[date].forEach((h, idx) => {
        const acc   = getById(h.accountId);
        const delta = (h.prevBalance !== undefined && h.prevBalance !== null) ? h.balance - h.prevBalance : null;
        const up    = delta !== null && delta > 0;
        const same  = delta === 0;
        const dc    = same ? '#94a3b8' : up ? '#10b981' : '#ef4444';
        const di    = same ? '→' : up ? '↑' : '↓';
        const entryId = h.id || `${date}-${idx}`;
        chatHTML += `
          <div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:12px;padding:0 4px">
            <div style="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#78350f,#92400e);font-size:17px;flex-shrink:0">💵</div>
            <div style="max-width:78%">
              <div style="font-size:10px;color:var(--text3);margin-bottom:3px;font-weight:600;padding-left:2px">${!selId?(acc?.name||'Cash')+' · ':''}💵 Cash Balance Update</div>
              <div style="background:${isLight?'rgba(245,158,11,0.15)':'rgba(245,158,11,0.08)'};border:1px solid ${isLight?'rgba(245,158,11,0.45)':'rgba(245,158,11,0.25)'};border-radius:4px 16px 16px 16px;padding:12px 16px">
                <div style="font-size:24px;font-weight:900;color:${isLight?'#92400e':'#fff'};letter-spacing:-0.5px">${fmt(h.balance)}</div>
                ${delta !== null ? `
                  <div style="display:flex;align-items:center;gap:8px;margin-top:5px;flex-wrap:wrap">
                    <span style="font-size:12px;font-weight:700;color:${dc}">${di} ${same?'No change':(up?'+':'')+fmt(Math.abs(delta))}</span>
                    ${h.prevBalance !== undefined ? `<span style="font-size:10px;color:var(--text3)">from ${fmt(h.prevBalance)}</span>` : ''}
                  </div>` : ''}
                ${h.note && h.note !== 'Manual update' && h.note !== 'Wallet created' ? `<div style="font-size:11px;color:var(--text3);margin-top:8px;padding-top:7px;border-top:1px solid ${isLight?'rgba(0,0,0,0.1)':'rgba(255,255,255,0.07)'}">${h.note}</div>` : ''}
                <div style="display:flex;justify-content:flex-end;margin-top:6px">
                  <button onclick="deleteCashHistoryEntry('${entryId}','${date}',${idx})" style="background:none;border:none;color:rgba(239,68,68,0.35);cursor:pointer;font-size:11px;padding:2px 6px;border-radius:4px;transition:.2s" onmouseover="this.style.color='#ef4444';this.style.background='rgba(239,68,68,0.1)'" onmouseout="this.style.color='rgba(239,68,68,0.35)';this.style.background='none'">✕ delete</button>
                </div>
              </div>
            </div>
          </div>`;
      });
    });
  }

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in" style="max-width:960px;margin:0 auto">

      <!-- Header -->
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px">
        <div>
          <h1 class="page-title"><i data-lucide="wallet"></i> Finance</h1>
          <p class="page-subtitle">Cash wallet balance history</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-secondary btn-sm" onclick="navigate('finance')">← Finance</button>
          <button class="btn-primary btn-sm" onclick="openQuickCashModal(${selId?`'${selId}'`:''})" style="background:linear-gradient(135deg,#f59e0b,#d97706)">+ Log Cash</button>
        </div>
      </div>

      <!-- Tab Bar -->
      <div style="display:flex;gap:8px;margin-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:0">
        <button onclick="bankTrackerTab='banks';renderBankTracker()" style="padding:10px 20px;border:none;background:none;font-size:13px;font-weight:700;cursor:pointer;border-bottom:2px solid transparent;color:var(--text3);transition:.2s">🏦 Banks</button>
        <button onclick="bankTrackerTab='cards';renderBankTracker()" style="padding:10px 20px;border:none;background:none;font-size:13px;font-weight:700;cursor:pointer;border-bottom:2px solid transparent;color:var(--text3);transition:.2s">💳 Credit Cards</button>
        <button onclick="bankTrackerTab='cash';renderBankTracker()" style="padding:10px 20px;border:none;background:none;font-size:13px;font-weight:700;cursor:pointer;border-bottom:2px solid #f59e0b;color:#f59e0b;transition:.2s">💵 Cash</button>
      </div>

      ${!accounts.length ? `
        <div class="glass-card" style="padding:60px;text-align:center">
          <div style="font-size:60px;margin-bottom:16px">💵</div>
          <p style="font-size:18px;font-weight:700;margin-bottom:8px">No Cash Wallets Yet</p>
          <p style="color:var(--text3);margin-bottom:20px">Add cash wallets in Finance to start tracking</p>
          <button class="btn-primary" onclick="navigate('finance')">+ Add Cash Wallet</button>
        </div>` : `

      <!-- Total Cash Hero + Wallet Selector -->
      <div class="fin-dark-card" style="position:relative;overflow:hidden;border-radius:24px;background:linear-gradient(135deg,#2d1a00,#1a0e00,#2d1a00);border:1px solid rgba(245,158,11,0.25);padding:28px;margin-bottom:20px;box-shadow:0 20px 60px rgba(0,0,0,0.4)">
        <div style="position:absolute;top:-60px;right:-60px;width:220px;height:220px;border-radius:50%;background:rgba(245,158,11,0.07)"></div>
        <div style="position:relative">
          <p style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(245,158,11,0.7);margin-bottom:6px">💵 Total Cash</p>
          <p style="font-size:52px;font-weight:900;color:#f59e0b;letter-spacing:-2px;line-height:1">${fmt(totalBalance)}</p>
          <!-- Wallet selector pills -->
          <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;overflow-x:auto;padding-bottom:4px">
            <div onclick="bankTrackerCash=null;renderBankTracker()" style="flex-shrink:0;padding:10px 16px;border-radius:14px;background:${!selId?'rgba(245,158,11,0.25)':'rgba(255,255,255,0.06)'};border:1px solid ${!selId?'rgba(245,158,11,0.6)':'rgba(255,255,255,0.1)'};cursor:pointer;transition:.2s;text-align:center;min-width:70px">
              <p style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${!selId?'#f59e0b':'rgba(255,255,255,0.45)'}">ALL</p>
              <p style="font-size:14px;font-weight:800;color:${!selId?'#f59e0b':'rgba(255,255,255,0.65)'};margin-top:2px">${accounts.length} wallets</p>
            </div>
            ${accounts.map(a => {
              const isActive = selId === a.id;
              const lastSnap = [...history].filter(h=>h.accountId===a.id).sort((x,y)=>y.date.localeCompare(x.date))[0];
              const lastDate = lastSnap ? formatRelativeDate(lastSnap.date) : 'No entries';
              return `
              <div onclick="bankTrackerCash='${a.id}';renderBankTracker()" style="flex-shrink:0;padding:10px 16px;border-radius:14px;background:${isActive?'rgba(245,158,11,0.2)':'rgba(255,255,255,0.06)'};border:1px solid ${isActive?'rgba(245,158,11,0.5)':'rgba(255,255,255,0.08)'};cursor:pointer;transition:.2s;min-width:120px">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                  <span style="font-size:16px">💵</span>
                  <p style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.5)">${a.name}</p>
                </div>
                <p style="font-size:18px;font-weight:900;color:#fff">${fmt(a.balance||0)}</p>
                <p style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:2px">Updated ${lastDate}</p>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Chart + Stats -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px" id="cash-main-grid">
        <!-- Trend Chart -->
        <div class="glass-card" style="padding:20px">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">
            <p class="section-title" style="font-size:13px;margin:0"><i data-lucide="trending-up"></i> ${trendPeriod==='1y'?'1-Year':'30-Day'} Trend
              <span style="font-size:10px;font-weight:500;color:var(--text3);margin-left:6px">${selId?(getById(selId)?.name||'Wallet'):'All Wallets'}</span>
            </p>
            ${_trendToggleHtml('#f59e0b')}
          </div>
          ${!history.filter(h=>!selId||h.accountId===selId).length
            ? `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:160px;gap:8px"><div style="font-size:32px">📊</div><p style="color:var(--text3);font-size:12px;text-align:center">Log a balance to see the trend</p></div>`
            : `<div style="height:180px;position:relative"><canvas id="cash-trend-chart"></canvas></div>`}
        </div>

        <!-- Stats + Quick Log -->
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px" class="bt-stats">
            ${[
              { label:'Wallets',  value:accounts.length,                                           icon:'💵', tc:'#f59e0b' },
              { label:'Entries',  value:history.filter(h=>!selId||h.accountId===selId).length,    icon:'📸', tc:'#00c9a7' },
              { label:'Days',     value:sortedDates.length,                                        icon:'📅', tc:'#ec4899' },
              { label:'On Hand',  value:fmt(selId?(getById(selId)?.balance||0):totalBalance),     icon:'🪙', tc:'#10b981' },
            ].map(s=>`
              <div class="glass-card" style="padding:14px;text-align:center">
                <div style="font-size:16px;margin-bottom:6px">${s.icon}</div>
                <p style="font-size:${s.value.toString().length>6?'13':'18'}px;font-weight:800;color:${s.tc}">${s.value}</p>
                <p style="font-size:10px;color:var(--text3);margin-top:2px">${s.label}</p>
              </div>`).join('')}
          </div>
          <!-- Quick log per wallet -->
          <div class="glass-card bt-quicklog" style="padding:14px;flex:1">
            <p style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:10px;letter-spacing:1px;text-transform:uppercase">Quick Log</p>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${accounts.map(a=>`
                <button onclick="openQuickCashModal('${a.id}')" style="display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:10px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);color:#f59e0b;font-size:12px;font-weight:600;cursor:pointer;transition:.2s" onmouseover="this.style.background='rgba(245,158,11,0.18)'" onmouseout="this.style.background='rgba(245,158,11,0.08)'">💵 ${a.name}</button>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Chat-style Cash Balance History -->
      <div class="glass-card" style="overflow:hidden;margin-bottom:20px">
        <div style="padding:14px 20px;border-bottom:1px solid var(--glass-border);display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,0.25)">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#78350f,#92400e);font-size:18px">💵</div>
            <div>
              <p style="font-size:14px;font-weight:700">${selId?(getById(selId)?.name||'Wallet'):'All Wallets'} — Cash Log</p>
              <p style="font-size:11px;color:var(--text3)">${filteredHistory.length} entries · newest at bottom</p>
            </div>
          </div>
          <button class="btn-primary btn-sm" onclick="openQuickCashModal(${selId?`'${selId}'`:''})" style="background:linear-gradient(135deg,#f59e0b,#d97706)">+ Log</button>
        </div>
        <div id="cash-chat" style="padding:16px 16px 8px;max-height:520px;overflow-y:auto;scroll-behavior:smooth">
          ${chatHTML}
        </div>
        <div style="padding:10px 14px;border-top:1px solid var(--glass-border);background:rgba(0,0,0,0.2);display:flex;gap:10px;align-items:center">
          <div onclick="openQuickCashModal(${selId?`'${selId}'`:''})" style="flex:1;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid var(--glass-border);border-radius:10px;font-size:13px;color:var(--text3);cursor:pointer;transition:.2s" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
            Log cash for ${selId?(getById(selId)?.name||'wallet'):'any wallet'}…
          </div>
          <button class="btn-primary" onclick="openQuickCashModal(${selId?`'${selId}'`:''})" style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:10px 18px;border-radius:10px;white-space:nowrap">+ Log</button>
        </div>
      </div>

      `}
    </div>`;

  setTimeout(() => {
    const chat = document.getElementById('cash-chat');
    if (chat && sortedDates.length) chat.scrollTop = chat.scrollHeight;
  }, 80);
  setTimeout(() => {
    const grid = document.getElementById('cash-main-grid');
    if (grid && window.innerWidth < 640) grid.style.gridTemplateColumns = '1fr';
  }, 50);
  if (history.filter(h => !selId || h.accountId === selId).length) {
    setTimeout(() => renderCashTrendChart(chartLabels, chartData), 60);
  }
}

function renderCashTrendChart(labels, data) {
  const canvas = document.getElementById('cash-trend-chart');
  if (!canvas) return;
  const isLight   = document.body.classList.contains('light');
  const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
  chartInstances['cash-trend'] = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Cash Balance',
        data,
        borderColor: '#f59e0b',
        borderWidth: 2.5,
        pointBackgroundColor: '#f59e0b',
        pointRadius: 3,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
        spanGaps: false,
        backgroundColor: ctx => {
          const { ctx: c, chartArea } = ctx.chart;
          if (!chartArea) return 'rgba(245,158,11,0.2)';
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, 'rgba(245,158,11,0.25)');
          g.addColorStop(1, 'rgba(245,158,11,0)');
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
          borderColor: 'rgba(245,158,11,0.3)', borderWidth: 1,
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

function openQuickCashModal(preSelectedId) {
  const accounts = STATE.cashAccounts || [];
  if (!accounts.length) { toast('Add a cash wallet first in Finance', 'error'); return; }

  const opts = accounts.map(a =>
    `<option value="${a.id}" ${preSelectedId === a.id ? 'selected' : ''}>💵 ${a.name} — ${fmt(a.balance||0)}</option>`
  ).join('');

  const todayStr = today();
  const yday  = (() => { const d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); })();
  const y2day = (() => { const d=new Date(); d.setDate(d.getDate()-2); return d.toISOString().slice(0,10); })();

  openModal('💵 Log Cash Balance', `
    <div class="form-group">
      <label class="form-label">Wallet</label>
      <select id="qc-account" class="form-input">${opts}</select>
    </div>
    <div class="form-group">
      <label class="form-label">Cash on Hand (₹)</label>
      <input type="number" id="qc-balance" class="form-input" placeholder="Enter current cash amount" step="0.01" min="0" autofocus/>
    </div>
    <div class="form-group">
      <label class="form-label">Date</label>
      <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
        <button type="button" onclick="setQcDate('${todayStr}','today')" id="qc-btn-today" style="padding:6px 14px;border-radius:8px;border:1px solid rgba(245,158,11,0.5);background:rgba(245,158,11,0.15);color:#f59e0b;font-size:12px;font-weight:600;cursor:pointer">Today</button>
        <button type="button" onclick="setQcDate('${yday}','yday')"  id="qc-btn-yday"  style="padding:6px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:var(--text2);font-size:12px;font-weight:600;cursor:pointer">Yesterday</button>
        <button type="button" onclick="setQcDate('${y2day}','y2day')" id="qc-btn-y2day" style="padding:6px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:var(--text2);font-size:12px;font-weight:600;cursor:pointer">2 Days Ago</button>
      </div>
      <input type="date" id="qc-date" class="form-input" value="${todayStr}"/>
    </div>
    <div class="form-group">
      <label class="form-label">Note (optional)</label>
      <input type="text" id="qc-note" class="form-input" placeholder="e.g. Counted wallet, Received cash"/>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveQuickCashLog()" style="background:linear-gradient(135deg,#f59e0b,#d97706)">💾 Save</button>
    </div>`);
}

function setQcDate(dateStr, btnKey) {
  const input = document.getElementById('qc-date');
  if (input) input.value = dateStr;
  ['today','yday','y2day'].forEach(k => {
    const b = document.getElementById(`qc-btn-${k}`);
    if (b) {
      b.style.borderColor = k === btnKey ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.15)';
      b.style.background  = k === btnKey ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)';
      b.style.color       = k === btnKey ? '#f59e0b' : 'var(--text2)';
    }
  });
}

function saveQuickCashLog() {
  const accountId = document.getElementById('qc-account')?.value;
  const balance   = parseFloat(document.getElementById('qc-balance')?.value);
  const date      = document.getElementById('qc-date')?.value || today();
  const note      = document.getElementById('qc-note')?.value.trim() || 'Manual update';

  if (!accountId) { toast('Select a wallet', 'error'); return; }
  if (isNaN(balance) || balance < 0) { toast('Enter a valid amount', 'error'); return; }

  const acc = (STATE.cashAccounts || []).find(a => a.id === accountId);
  if (!acc) return;
  const prevBalance = acc.balance;
  acc.balance = balance;

  STATE.cashBalanceHistory = STATE.cashBalanceHistory || [];
  STATE.cashBalanceHistory.push({
    id: genId(),
    accountId,
    balance,
    prevBalance,
    date,
    note,
    createdAt: new Date().toISOString()
  });
  saveState();
  closeModal();
  toast(`${acc.name} logged at ${fmt(balance)} ✅`, 'success');
  renderBankTracker();
}

function deleteCashHistoryEntry(id, date, idx) {
  const history = STATE.cashBalanceHistory || [];
  let target = history.find(h => h.id === id);
  if (!target) target = history.filter(h => h.date === date)[idx];
  if (!target) return;
  STATE.cashBalanceHistory = history.filter(h => h !== target);
  saveState();
  toast('Entry removed', 'info');
  renderBankTracker();
}

// ===== BALANCE / OUTSTANDING IMPORT (PDF + Excel) =====
// Dedicated balance-snapshot import. Each row is a (date, balance) pair —
// NOT income/expense transactions. Updates bankBalanceHistory (banks) or
// creditCardHistory (cards) for the chosen account/card, respecting date.
let _balImport = { mode: 'bank', targetId: null, results: [] };

function openBalanceImport(mode) {
  const isBank = mode === 'bank';
  const items  = isBank ? (STATE.bankAccounts || []) : (STATE.creditCards || []);
  if (!items.length) {
    toast(isBank ? 'Add a bank account first' : 'Add a credit card first', 'error');
    return;
  }
  _balImport = { mode, targetId: items[0].id, results: [] };

  const opts = items.map(it =>
    `<option value="${it.id}">${isBank ? (it.icon||'🏦') : '💳'} ${it.bankName} — ${isBank ? fmt(it.balance||0) : 'out '+fmt(it.outstanding||0)}</option>`
  ).join('');

  const targetLabel = isBank ? 'Bank Account' : 'Credit Card';
  const valLabel    = isBank ? 'balance' : 'outstanding';
  const accent      = isBank ? '#00c9a7' : '#ef4444';
  const accent2     = isBank ? '#0acf83' : '#b91c1c';

  openModal(`📥 Import ${isBank ? 'Balance' : 'Statement'} (PDF / Excel)`, `
    <div style="padding:10px 14px;border-radius:10px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);margin-bottom:14px;font-size:12px;color:var(--text2);line-height:1.6">
      Upload a <strong>PDF</strong> or <strong>Excel / CSV</strong> file with <strong>dates and ${valLabel} amounts</strong>.<br>
      Each row sets the ${targetLabel.toLowerCase()}'s ${valLabel} for that date — income/expense are not mixed in.
    </div>
    <div class="form-group">
      <label class="form-label">Which ${targetLabel}?</label>
      <select id="bi-target" class="form-input" onchange="_balImport.targetId=this.value">${opts}</select>
    </div>
    <div class="form-group">
      <label class="form-label">Select file (.pdf, .xlsx, .xls, .csv)</label>
      <input type="file" id="bi-file" accept=".pdf,.xlsx,.xls,.csv,application/pdf" class="form-input"
        onchange="handleBalanceFile(this)" style="padding:10px;cursor:pointer"/>
    </div>
    <div id="bi-status" style="display:none;font-size:12px;font-weight:600;margin-bottom:12px;padding:8px 12px;border-radius:8px"></div>
    <div class="modal-actions" style="margin-bottom:14px">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
    </div>
    <div id="bi-results-wrap" style="display:none">
      <div style="height:1px;background:var(--glass-border);margin-bottom:14px"></div>
      <p style="font-size:11px;font-weight:700;color:${accent};letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Detected entries — edit if needed</p>
      <div id="bi-results-list" style="max-height:40vh;overflow-y:auto;padding-right:2px"></div>
      <button class="btn-primary" onclick="saveBalanceImport()" style="width:100%;background:linear-gradient(135deg,${accent},${accent2});padding:12px;margin-top:12px">💾 Save All Entries</button>
    </div>`);
}

function _biStatus(msg, type) {
  const el = document.getElementById('bi-status');
  if (!el) return;
  el.style.display    = '';
  el.textContent      = msg;
  el.style.background  = type === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)';
  el.style.color       = type === 'ok' ? '#10b981'              : '#f59e0b';
}

async function handleBalanceFile(input) {
  const file = input.files[0];
  if (!file) return;
  const name = file.name.toLowerCase();
  _biStatus('Reading file…', 'ok');
  try {
    let rows = [];
    if (name.endsWith('.pdf')) {
      rows = await _parseBalancePdf(file);
    } else if (/\.(xlsx|xls|csv)$/.test(name)) {
      rows = await _parseBalanceExcel(file);
    } else {
      _biStatus('Unsupported file type — use PDF, Excel or CSV', 'warn');
      return;
    }
    if (!rows.length) {
      _biStatus('No date + amount pairs found. Check the file has a date column and a balance/outstanding column.', 'warn');
      return;
    }
    _balImport.results = rows;
    renderBalanceImportResults();
    _biStatus(`✅ Found ${rows.length} entr${rows.length>1?'ies':'y'}`, 'ok');
  } catch (e) {
    _biStatus('Could not read file: ' + (e.message || e), 'warn');
  }
}

// ── Parsers ─────────────────────────────────────────────────────────────
function _biNum(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(String(v).replace(/[₹,\s]/g, ''));
  return isNaN(n) ? null : n;
}

function _biNormDate(v) {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  const MONTHS = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // Indian style DD/MM/YYYY
  m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) { const yr = m[3].length===2?'20'+m[3]:m[3]; return `${yr}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; }
  m = s.match(/^(\d{1,2})[\s\-]([a-zA-Z]{3,})[\s\-,]*(\d{2,4})$/);
  if (m) { const mo = MONTHS[m[2].toLowerCase().slice(0,3)]; if (mo) { const yr=m[3].length===2?'20'+m[3]:m[3]; return `${yr}-${mo}-${m[1].padStart(2,'0')}`; } }
  m = s.match(/^([a-zA-Z]{3,})[\s\-]+(\d{1,2}),?[\s\-]+(\d{2,4})$/);
  if (m) { const mo = MONTHS[m[1].toLowerCase().slice(0,3)]; if (mo) { const yr=m[3].length===2?'20'+m[3]:m[3]; return `${yr}-${mo}-${m[2].padStart(2,'0')}`; } }
  return null;
}

async function _parseBalanceExcel(file) {
  if (typeof XLSX === 'undefined') throw new Error('Excel library not loaded yet — wait a moment and retry');
  const buf   = await file.arrayBuffer();
  const wb    = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const aoa   = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  return _extractBalancePairs(aoa);
}

function _extractBalancePairs(aoa) {
  if (!aoa || !aoa.length) return [];
  let headerIdx = -1, dateCol = -1, valCol = -1, noteCol = -1;
  for (let i = 0; i < Math.min(aoa.length, 10); i++) {
    const row = (aoa[i] || []).map(c => String(c).toLowerCase().trim());
    const di = row.findIndex(c => c.includes('date'));
    const vi = row.findIndex(c => /balance|outstanding|amount|closing|due/.test(c));
    if (di >= 0 && vi >= 0) {
      headerIdx = i; dateCol = di; valCol = vi;
      noteCol = row.findIndex(c => /note|desc|remark|narration|particular/.test(c));
      break;
    }
  }
  const out = [];
  if (headerIdx >= 0) {
    for (let i = headerIdx + 1; i < aoa.length; i++) {
      const row  = aoa[i] || [];
      const date = _biNormDate(row[dateCol]);
      const val  = _biNum(row[valCol]);
      if (date && val !== null) out.push({ date, value: val, note: noteCol>=0 ? String(row[noteCol]||'').trim() : '' });
    }
  } else {
    // No recognizable header — assume first column is date, first numeric column is the value
    (aoa || []).forEach(row => {
      if (!row || !row.length) return;
      const date = _biNormDate(row[0]);
      if (!date) return;
      for (let j = 1; j < row.length; j++) {
        const val = _biNum(row[j]);
        if (val !== null) { out.push({ date, value: val, note: '' }); break; }
      }
    });
  }
  return out;
}

async function _parseBalancePdf(file) {
  if (typeof pdfjsLib === 'undefined') throw new Error('PDF library not loaded yet — wait a moment and retry');
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const lines = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page    = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items = content.items.map(it => ({
      str: (it.str || '').replace(/\s+/g, ' '),
      x: it.transform ? it.transform[4] : 0,
      y: it.transform ? it.transform[5] : 0,
      h: it.height || 10
    })).filter(it => it.str.trim());
    items.sort((a, b) => (b.y - a.y) || (a.x - b.x));
    let rows = [], cur = [], cy = null, ch = 10;
    items.forEach(it => {
      const tol = Math.max(2, (it.h || ch) * 0.5);
      if (cy === null || Math.abs(cy - it.y) <= tol) {
        cur.push(it); cy = cy === null ? it.y : (cy * cur.length + it.y) / (cur.length + 1); ch = it.h || ch;
      } else { if (cur.length) rows.push(cur); cur = [it]; cy = it.y; ch = it.h || 10; }
    });
    if (cur.length) rows.push(cur);
    rows.forEach(r => lines.push(r.sort((a, b) => a.x - b.x).map(i => i.str).join(' ').replace(/\s+/g, ' ').trim()));
  }
  return _extractBalanceFromLines(lines);
}

function _extractBalanceFromLines(lines) {
  const out = [];
  const dateRe = /(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}[\s\-][a-zA-Z]{3,}[\s\-,]*\d{2,4})/;
  lines.forEach(line => {
    const dm = line.match(dateRe);
    if (!dm) return;
    const date = _biNormDate(dm[1]);
    if (!date) return;
    const nums = line.match(/[\d,]+\.\d{2}/g);
    if (!nums || !nums.length) return;
    const val = _biNum(nums[nums.length - 1]); // rightmost figure = running balance
    if (val === null) return;
    const note = line.replace(dateRe, '').replace(/[\d,]+\.\d{2}/g, '').replace(/\b(cr|dr)\b/gi, '').replace(/\s+/g, ' ').trim().slice(0, 40);
    out.push({ date, value: val, note });
  });
  return out;
}

// ── Preview + save ──────────────────────────────────────────────────────
function renderBalanceImportResults() {
  const list = document.getElementById('bi-results-list');
  const wrap = document.getElementById('bi-results-wrap');
  if (!list || !wrap) return;
  list.innerHTML = _balImport.results.map((r, i) => `
    <div id="bi-row-${i}" style="background:var(--card-bg);border:1px solid var(--glass-border);border-radius:10px;padding:10px;margin-bottom:8px;position:relative">
      <button onclick="removeBalanceRow(${i})" title="Remove" style="position:absolute;top:6px;right:8px;background:rgba(239,68,68,0.12);border:none;color:#ef4444;border-radius:6px;cursor:pointer;padding:2px 8px;font-size:12px">✕</button>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding-right:30px">
        <input type="date" class="form-input" id="bi-date-${i}" value="${r.date}" style="font-size:12px;padding:4px 8px"/>
        <input type="number" class="form-input" id="bi-val-${i}" value="${r.value}" step="0.01" min="0" style="font-size:13px;font-weight:700;padding:4px 8px"/>
      </div>
      <input type="text" class="form-input" id="bi-note-${i}" value="${(r.note||'').replace(/"/g,'&quot;')}" placeholder="Note (optional)" style="font-size:12px;padding:4px 8px;margin-top:6px"/>
    </div>`).join('');
  wrap.style.display = '';
}

function removeBalanceRow(i) {
  const row = document.getElementById(`bi-row-${i}`);
  if (row) row.style.display = 'none';
}

function saveBalanceImport() {
  const isBank   = _balImport.mode === 'bank';
  const targetId = _balImport.targetId;
  const toSave   = [];
  _balImport.results.forEach((r, i) => {
    const row = document.getElementById(`bi-row-${i}`);
    if (!row || row.style.display === 'none') return;
    const date = document.getElementById(`bi-date-${i}`)?.value;
    const val  = parseFloat(document.getElementById(`bi-val-${i}`)?.value);
    const note = document.getElementById(`bi-note-${i}`)?.value?.trim() || 'Imported';
    if (!date || isNaN(val) || val < 0) return;
    toSave.push({ date, val, note });
  });
  if (!toSave.length) { toast('No valid entries to save', 'error'); return; }
  toSave.sort((a, b) => a.date.localeCompare(b.date)); // chronological so prev chains correctly

  if (isBank) {
    const acc = (STATE.bankAccounts||[]).find(a => a.id === targetId);
    if (!acc) { toast('Account not found', 'error'); return; }
    STATE.bankBalanceHistory = STATE.bankBalanceHistory || [];
    toSave.forEach(e => {
      const prev = [...STATE.bankBalanceHistory]
        .filter(h => h.accountId === targetId && h.date <= e.date)
        .sort((x, y) => y.date.localeCompare(x.date))[0];
      STATE.bankBalanceHistory.push({
        id: genId(), accountId: targetId,
        balance: e.val, prevBalance: prev ? prev.balance : e.val,
        date: e.date, note: e.note, createdAt: new Date().toISOString()
      });
    });
    acc.balance = toSave[toSave.length - 1].val; // latest imported date = current balance
  } else {
    const card = (STATE.creditCards||[]).find(c => c.id === targetId);
    if (!card) { toast('Card not found', 'error'); return; }
    STATE.creditCardHistory = STATE.creditCardHistory || [];
    toSave.forEach(e => {
      const prev = [...STATE.creditCardHistory]
        .filter(h => h.cardId === targetId && h.date <= e.date)
        .sort((x, y) => y.date.localeCompare(x.date))[0];
      STATE.creditCardHistory.push({
        id: genId(), cardId: targetId,
        outstanding: e.val, prevOutstanding: prev ? prev.outstanding : e.val,
        date: e.date, note: e.note, createdAt: new Date().toISOString()
      });
    });
    card.outstanding = toSave[toSave.length - 1].val;
  }

  saveState();
  closeModal();
  toast(`${toSave.length} ${isBank ? 'balance' : 'outstanding'} entr${toSave.length>1?'ies':'y'} imported ✅`, 'success');
  if (isBank) { bankTrackerTab = 'banks'; bankTrackerAccount = targetId; }
  else        { bankTrackerTab = 'cards'; bankTrackerCard = targetId; }
  renderBankTracker();
}
