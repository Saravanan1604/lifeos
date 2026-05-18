// ===== STORAGE UTILITIES =====
const DB = {
  KEY: 'lifeos_v1',
  defaults() {
    return {
      user: null,
      xp: 0, level: 1, streak: 0, lastActive: null,
      unlockedAchievements: [],
      settings: { theme: 'dark', currency: '₹', name: 'User' },
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
      bankBalanceHistory: [],  // [{ accountId, balance, date, note }]
      bankTransfers: []        // [{ id, fromId, toId, amount, date, note }]
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
const API_URL = 'https://lifeos-backend-r42c.onrender.com/api'; // Live Render Backend

const stateHistory = []; // Keeps last 5 states for undo

function saveState() {
  // Store current state for undo
  const currentStr = JSON.stringify(STATE);
  const lastSavedStr = localStorage.getItem(DB.KEY);
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

// ===== UNDO FUNCTION =====
function undoLastAction() {
  if (stateHistory.length > 0) {
    const prevStateStr = stateHistory.pop();
    STATE = JSON.parse(prevStateStr);
    DB.save(STATE);
    
    // Cloud Sync Undo
    const token = localStorage.getItem('lifeos_token');
    if (token && STATE.user) {
      fetch(`${API_URL}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ state: STATE })
      }).catch(err => {});
    }
    
    toast('Action undone successfully!', 'success');
    if (typeof navigate === 'function') navigate(currentPage || 'dashboard', true);
  } else {
    toast('Nothing to undo!', 'warning');
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

function getGreeting(name) {
  const h = new Date().getHours();
  const g = h < 12 ? '🌅 Good morning' : h < 17 ? '☀️ Good afternoon' : h < 20 ? '🌆 Good evening' : '🌙 Good night';
  return `${g}, ${name}!`;
}

// ===== LIVE SYNC ENGINE =====
const LIVE_SYNC_KEYS = [
  'investments', 'loans', 'transactions', 'bankAccounts',
  'bankBalanceHistory', 'bankTransfers', 'goals', 'habits',
  'habitCompletions', 'healthEntries', 'tasks', 'budgets',
  'jobApplications', 'emotionEntries', 'skills', 'chatHistory',
  'customAssetTypes', 'customLoanTypes', 'xp', 'level', 'streak',
  'unlockedAchievements'
];

let _syncTimer     = null;
let _syncBusy      = false;
let _lastCloudHash = '';
let _pendingSave   = null; // queued when cloud push fails (Render sleeping)

// Sync dot indicator in sidebar
function setSyncDot(status) {
  const dot = document.getElementById('sync-dot');
  if (!dot) return;
  const cfg = {
    syncing: { bg: '#f59e0b', title: 'Syncing…',       anim: 'pulse 1s infinite' },
    ok:      { bg: '#10b981', title: 'Live — synced',   anim: 'none' },
    offline: { bg: '#64748b', title: 'Offline mode',    anim: 'none' },
    error:   { bg: '#ef4444', title: 'Sync failed',     anim: 'none' },
  };
  const c = cfg[status] || cfg.ok;
  dot.style.background = c.bg;
  dot.style.animation  = c.anim;
  dot.title = c.title;
}

// Merge two arrays by id — local items win on conflict
function _mergeById(local, cloud) {
  const l = Array.isArray(local) ? local : [];
  const c = Array.isArray(cloud) ? cloud : [];
  if (!c.length) return l;
  if (!l.length) return c;
  const seen = new Set(l.map(x => x.id).filter(Boolean));
  return [...l, ...c.filter(x => x.id && !seen.has(x.id))];
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

    // Hash based on array lengths + scalar values — reliable even when transactions grow
    const hashObj = {};
    LIVE_SYNC_KEYS.forEach(k => {
      hashObj[k] = Array.isArray(data.state[k]) ? data.state[k].length : (data.state[k] ?? null);
    });
    const hash = JSON.stringify(hashObj);
    if (hash === _lastCloudHash) { setSyncDot('ok'); return; }
    _lastCloudHash = hash;

    // Merge cloud into current STATE
    let changed = false;
    LIVE_SYNC_KEYS.forEach(k => {
      const cloud = data.state[k];
      if (Array.isArray(cloud)) {
        const merged = _mergeById(STATE[k], cloud);
        if (merged.length !== (STATE[k] || []).length) {
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
      toast('🔄 Updated from another device', 'info');
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

  // Poll every 30 seconds
  if (_syncTimer) clearInterval(_syncTimer);
  _syncTimer = setInterval(pullFromCloud, 30000);

  // Sync immediately when user returns to the tab/app
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) pullFromCloud();
  });

  // Sync when app regains network connection
  window.addEventListener('online', pullFromCloud);
}
