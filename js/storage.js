// ===== APP VERSION =====
const APP_VERSION = '1.0.0';
const APP_BUILD = 424;

// ===== STORAGE UTILITIES =====
const DB = {
  KEY: 'lifeos_v1',
  defaults() {
    return {
      user: null,
      xp: 0, level: 1, streak: 0, lastActive: null,
      unlockedAchievements: [],
      settings: { theme: 'amoled', currency: '₹', name: 'User', bgAnim: 'aurora' },
      transactions: [],
      accounts: [{ id: '1', name: 'Cash Wallet', type: 'cash', balance: 0 }],
      budgets: [],
      investments: [],
      goals: [],
      healthEntries: [],
      habits: [],
      habitCompletions: [],
      skills: [],
      jobApplications: [],
      emotionEntries: [],
      tasks: [],
      chatHistory: [],
      notes: [],               // Google Keep�style notes
      recurring: [],           // [{ id, type, amount, category, icon, description, source, subcategory, frequency, nextDate }]
      customCategories: [],    // user-created categories
      bankBalanceHistory: [],  // [{ accountId, balance, date, note }]
      bankTransfers: [],       // [{ id, fromId, toId, amount, date, note }]
      creditCards: [],
      creditCardHistory: [],   // [{ id, cardId, outstanding, prevOutstanding, date, note, createdAt }]
      deletedIds: []           // tombstones: [{ id, at }] � lets deletions sync across devices
    };
  },
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return this.defaults();
      return Object.assign(this.defaults(), JSON.parse(raw));
    } catch { return this.defaults(); }
  },
  save(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch {}
  }
};

let STATE = DB.load();
const API_URL = 'https://lifeos-backend-mangodb.onrender.com/api';

const stateHistory = []; // Keeps last 5 states for undo

function saveState() {
  const lastSavedStr = localStorage.getItem(DB.KEY);

  // Auto-tombstone: any id that was present last save but is gone now was deleted.
  // This lets deletions propagate across devices (the union-merge can't otherwise
  // represent a removal, so the item would resurrect on the next pull).
  if (lastSavedStr) {
    try {
      const prev = JSON.parse(lastSavedStr);
      STATE.deletedIds = STATE.deletedIds || [];
      const tombId = new Set(STATE.deletedIds.map(d => d.id));
      const now = Date.now();
      LIVE_SYNC_KEYS.forEach(k => {
        if (!Array.isArray(prev[k]) || !Array.isArray(STATE[k])) return;
        const curIds = new Set(STATE[k].map(x => x && x.id).filter(Boolean));
        prev[k].forEach(item => {
          if (item && item.id && !curIds.has(item.id) && !tombId.has(item.id)) {
            STATE.deletedIds.push({ id: item.id, at: now });
            tombId.add(item.id);
          }
        });
      });
      // Prune tombstones older than 60 days (longer than any realistic offline gap)
      const cutoff = now - 60 * 24 * 60 * 60 * 1000;
      STATE.deletedIds = STATE.deletedIds.filter(d => d.at >= cutoff);
    } catch {}
  }

  // Store current state for undo (after tombstone bookkeeping)
  const currentStr = JSON.stringify(STATE);
  if (lastSavedStr && currentStr !== lastSavedStr) {
    stateHistory.push(lastSavedStr);
    if (stateHistory.length > 5) stateHistory.shift();
  }

  DB.save(STATE);

  // Push to cloud immediately (only when logged in)
  const token = localStorage.getItem('lifeos_token');
  if (token && STATE.user && !STATE.user.offline) {
    setSyncDot('syncing');
    const payload = JSON.stringify({ state: STATE });
    fetch(`${API_URL}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: payload
    })
      .then(r => {
        if (r.ok) { setSyncDot('ok'); _pendingSave = null; }
        else       { setSyncDot('error'); _pendingSave = payload; }
      })
      .catch(() => { setSyncDot('error'); _pendingSave = payload; });
  }
}

// ===== UNDO / REDO =====
const redoHistory = [];

function _syncStateToCloud() {
  const token = localStorage.getItem('lifeos_token');
  if (token && STATE.user) {
    fetch(`${API_URL}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ state: STATE })
    }).catch(() => {});
  }
}

function undoLastAction() {
  if (stateHistory.length > 0) {
    redoHistory.push(JSON.stringify(STATE));   // remember current so we can redo
    if (redoHistory.length > 10) redoHistory.shift();
    const prevStateStr = stateHistory.pop();
    STATE = JSON.parse(prevStateStr);
    DB.save(STATE);
    _syncStateToCloud();
    toast('Action undone', 'success');
    if (typeof navigate === 'function') navigate(currentPage || 'dashboard', true);
  } else {
    toast('Nothing to undo!', 'warning');
  }
}

function redoLastAction() {
  if (redoHistory.length > 0) {
    stateHistory.push(JSON.stringify(STATE));   // so undo works again
    const nextStateStr = redoHistory.pop();
    STATE = JSON.parse(nextStateStr);
    DB.save(STATE);
    _syncStateToCloud();
    toast('Action redone', 'success');
    if (typeof navigate === 'function') navigate(currentPage || 'dashboard', true);
  } else {
    toast('Nothing to redo!', 'warning');
  }
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function fmt(n, currency = STATE.settings?.currency || '₹') {
  return `${currency}${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function filterTxByPeriod(txns, period) {
  return filterTxByAnchor(txns, period, null);
}

// Local YYYY-MM-DD (no UTC shift � important so an anchored date isn't off by a day).
function _ymdLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// anchor: 'YYYY-MM-DD' string or null (= today)
function filterTxByAnchor(txns, period, anchor) {
  const base = anchor ? new Date(anchor + 'T00:00:00') : new Date();
  const d0   = _ymdLocal(base);
  if (period === 'day') return txns.filter(t => (t.date || '').slice(0, 10) === d0);
  if (period === 'week') {
    // Mon?Sun week that contains the anchor date
    const dow = (base.getDay() + 6) % 7; // 0=Mon
    const mon = new Date(base); mon.setDate(base.getDate() - dow);
    const sun = new Date(mon);  sun.setDate(mon.getDate() + 6);
    const s = _ymdLocal(mon), e = _ymdLocal(sun);
    return txns.filter(t => { const d = (t.date || '').slice(0, 10); return d >= s && d <= e; });
  }
  if (period === 'month') {
    const ym = `${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,'0')}`;
    return txns.filter(t => (t.date||'').startsWith(ym));
  }
  if (period === 'year') return txns.filter(t => (t.date||'').startsWith(String(base.getFullYear())));
  return txns;
}

function periodTabsHtml(active, fn) {
  const labels = { day: 'Day', week: 'Week', month: 'Month', year: 'Year', all: 'All' };
  return `<div class="period-tabs">${Object.keys(labels).map(p => `<button class="period-tab${active === p ? ' active' : ''}" onclick="${fn}('${p}')">${labels[p]}</button>`).join('')}</div>`;
}

function periodLabel(period) {
  return { day: 'Today', week: 'This Week', month: 'This Month', year: 'This Year', all: 'All Time' }[period] || 'All Time';
}

function getGreeting(name) {
  const h = new Date().getHours();
  const g = h < 12 ? '?? Good morning' : h < 17 ? '?? Good afternoon' : h < 20 ? '?? Good evening' : '?? Good night';
  return `${g}, ${name}!`;
}

// ===== LIVE SYNC ENGINE =====
const LIVE_SYNC_KEYS = [
  'investments', 'loans', 'transactions', 'bankAccounts',
  'bankBalanceHistory', 'bankTransfers', 'creditCards', 'creditCardHistory', 'goals', 'habits',
  'habitCompletions', 'healthEntries', 'tasks', 'budgets',
  'jobApplications', 'emotionEntries', 'skills', 'chatHistory',
  'customAssetTypes', 'customLoanTypes', 'xp', 'level', 'streak',
  'unlockedAchievements', 'deletedIds', 'categoryRules', 'notes',
  'recurring', 'customCategories'
];

let _syncTimer     = null;
let _syncBusy      = false;
let _lastCloudHash = '';
let _pendingSave   = null; // queued when cloud push fails (Render sleeping)

// Sync dot indicator in sidebar + sync button (mobile top-tools)
function setSyncDot(status) {
  // Record the last successful sync time (powers the "not backed up in N
  // days" nudge on the Records page).
  if (status === 'ok') { try { localStorage.setItem('lifeos_lastSyncOk', String(Date.now())); } catch (_) {} }
  const cfg = {
    syncing: { bg: '#f59e0b', title: 'Syncing�',     anim: 'pulse 1s infinite', btnColor: '#f59e0b', spin: true  },
    ok:      { bg: '#10b981', title: 'Live � synced', anim: 'none',              btnColor: '#10b981', spin: false },
    offline: { bg: '#64748b', title: 'Offline mode',  anim: 'none',              btnColor: '#64748b', spin: false },
    error:   { bg: '#ef4444', title: 'Sync failed',   anim: 'none',              btnColor: '#ef4444', spin: false },
  };
  const c = cfg[status] || cfg.ok;
  // Sidebar dot
  const dot = document.getElementById('sync-dot');
  if (dot) { dot.style.background = c.bg; dot.style.animation = c.anim; dot.title = c.title; }
  // Top-tools sync button (app)
  const btn  = document.getElementById('sync-btn');
  const icon = document.getElementById('sync-btn-icon');
  if (btn)  { btn.style.color = c.btnColor; btn.title = c.title; }
  if (icon) { icon.style.animation = c.spin ? 'syncSpin 1s linear infinite' : 'none'; }
}

// Manual sync tap � spin the icon and pull from cloud
function _syncBtnTap() {
  const icon = document.getElementById('sync-btn-icon');
  if (icon) icon.style.animation = 'syncSpin 1s linear infinite';
  if (typeof pullFromCloud === 'function') {
    pullFromCloud().then(() => {
      toast('Synced!', 'success');
    }).catch(() => {
      toast('Sync failed', 'error');
    }).finally(() => {
      if (icon) icon.style.animation = 'none';
    });
  }
}

// Merge two arrays by id.
// Strategy: cloud wins for items that exist in cloud (so edits from any device propagate).
//           items that are ONLY local (not yet pushed) are preserved.
// deletedSet (Set of tombstoned ids) is excluded from BOTH sides.
function _mergeById(local, cloud, deletedSet) {
  const del = deletedSet || new Set();
  const l = (Array.isArray(local) ? local : []).filter(x => !(x && x.id && del.has(x.id)));
  const c = (Array.isArray(cloud) ? cloud : []).filter(x => !(x && x.id && del.has(x.id)));
  if (!c.length) return l;
  if (!l.length) return c;

  const cloudMap = new Map(c.filter(x => x.id).map(x => [x.id, x]));
  // Keep local-only items (created offline, not yet pushed to cloud)
  const localOnly = l.filter(x => x.id && !cloudMap.has(x.id));
  // Cloud is authoritative for everything it knows about � edits propagate across devices
  return [...c, ...localOnly];
}

// Pull latest state from cloud and merge into local STATE
async function pullFromCloud() {
  if (_syncBusy) return;
  const token = localStorage.getItem('lifeos_token');
  if (!token || !STATE.user || STATE.user.offline) { setSyncDot('offline'); return; }

  _syncBusy = true;
  try {
    const res = await fetch(`${API_URL}/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });
    if (!res.ok) { setSyncDot('error'); return; }

    const data = await res.json();
    if (!data.state || !Object.keys(data.state).length) { setSyncDot('ok'); return; }

    // Hash based on content checksum � detects edits to existing items, not just length changes
    const hashObj = {};
    LIVE_SYNC_KEYS.forEach(k => {
      if (Array.isArray(data.state[k])) {
        // Checksum: length + sum of each item's serialized size (catches edits without full JSON cost)
        const arr = data.state[k];
        const checksum = arr.reduce((s, x) => s + JSON.stringify(x).length, arr.length);
        hashObj[k] = checksum;
      } else {
        hashObj[k] = data.state[k] ?? null;
      }
    });
    const hash = JSON.stringify(hashObj);
    if (hash === _lastCloudHash) { setSyncDot('ok'); return; }
    _lastCloudHash = hash;

    // Union tombstones (local + cloud), keeping the newest timestamp per id.
    const delMap = {};
    [...(STATE.deletedIds || []), ...(data.state.deletedIds || [])].forEach(d => {
      if (d && d.id) delMap[d.id] = Math.max(delMap[d.id] || 0, d.at || 0);
    });
    STATE.deletedIds = Object.entries(delMap).map(([id, at]) => ({ id, at }));
    const deletedSet = new Set(Object.keys(delMap));

    // Merge cloud into current STATE
    let changed = false;
    LIVE_SYNC_KEYS.forEach(k => {
      if (k === 'deletedIds') return; // handled above via delMap union
      const cloud = data.state[k];
      if (Array.isArray(cloud)) {
        const merged = _mergeById(STATE[k], cloud, deletedSet);
        // Compare content (not just length) so edits to existing items are detected
        if (JSON.stringify(merged) !== JSON.stringify(STATE[k] || [])) {
          STATE[k] = merged;
          changed = true;
        }
      } else if (cloud !== undefined && typeof cloud !== 'object') {
        if (cloud > (STATE[k] || 0)) { STATE[k] = cloud; changed = true; }
      }
    });

    if (changed) {
      DB.save(STATE);
      if (typeof currentPage !== 'undefined' && typeof navigate === 'function') {
        navigate(currentPage, true);
      }
      if (typeof updateSidebar === 'function') updateSidebar();
      // Silently refresh � dot flashes green; no toast spam on 3-second polls
    }
    setSyncDot('ok');

    // Retry any save that failed while Render was sleeping
    if (_pendingSave) {
      const tok = localStorage.getItem('lifeos_token');
      if (tok) {
        fetch(`${API_URL}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
          body: _pendingSave
        }).then(r => { if (r.ok) { _pendingSave = null; setSyncDot('ok'); } }).catch(() => {});
      }
    }
  } catch {
    setSyncDot('error');
  } finally {
    _syncBusy = false;
  }
}

// Start polling + visibility-based sync
function startLiveSync() {
  const token = localStorage.getItem('lifeos_token');
  if (!token || !STATE.user || STATE.user.offline) { setSyncDot('offline'); return; }

  setSyncDot('ok');

  // Pull immediately so laptop/desktop sees mobile changes right on open
  pullFromCloud();

  // Poll every 3 seconds for near-real-time cross-device sync
  if (_syncTimer) clearInterval(_syncTimer);
  _syncTimer = setInterval(pullFromCloud, 3000);

  // Sync immediately when user returns to the tab/app
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) pullFromCloud();
  });

  // Sync when app regains network connection � push pending local changes first, then pull
  window.addEventListener('online', async () => {
    if (_pendingSave) {
      const tok = localStorage.getItem('lifeos_token');
      if (tok) {
        try {
          const r = await fetch(`${API_URL}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
            body: _pendingSave
          });
          if (r.ok) { _pendingSave = null; setSyncDot('ok'); }
        } catch {}
      }
    }
    pullFromCloud();
  });
}
