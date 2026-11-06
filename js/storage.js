// ===== APP VERSION =====
const APP_VERSION = '1.0.0';
const APP_BUILD = 686;

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
      notes: [],               // Google Keep-style notes
      recurring: [],           // [{ id, type, amount, category, icon, description, source, subcategory, frequency, nextDate }]
      customCategories: [],    // user-created categories
      bankBalanceHistory: [],  // [{ accountId, balance, date, note }]
      bankTransfers: [],       // [{ id, fromId, toId, amount, date, note }]
      creditCards: [],
      creditCardHistory: [],   // [{ id, cardId, outstanding, prevOutstanding, date, note, createdAt }]
      deletedIds: [],          // tombstones: [{ id, at }]  lets deletions sync across devices
      customPages: [],         // [{ id, name, icon, order }]  user-created custom pages
      customPageLayouts: {}    // { custom_page_xxx: { cardKey: { order, hidden, size } } }
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

let _skipHistory = false;   // set by undo/redo so they don't re-push onto the undo stack

function saveState() {
  const lastSavedStr = localStorage.getItem(DB.KEY);
  const now = Date.now();

  if (lastSavedStr) {
    try {
      const prev = JSON.parse(lastSavedStr);
      STATE.deletedIds = STATE.deletedIds || [];
      const tombId = new Set(STATE.deletedIds.map(d => d.id));
      const resurrected = new Set();
      LIVE_SYNC_KEYS.forEach(k => {
        if (k === 'deletedIds' || !Array.isArray(STATE[k])) return;
        const prevArr = Array.isArray(prev[k]) ? prev[k] : [];
        const prevById = new Map();
        prevArr.forEach(x => { if (x && x.id) prevById.set(x.id, x); });
        const curIds = new Set();
        STATE[k].forEach(item => {
          if (!item || typeof item !== 'object' || !item.id) return;
          curIds.add(item.id);
          // Edit-stamp: any new or changed item gets _u = now. The merge uses
          // it so the NEWEST edit wins across devices (before, the cloud copy
          // always won, so an edit made while the server was asleep got
          // silently reverted on the next pull).
          const old = prevById.get(item.id);
          if (!old || JSON.stringify(old) !== JSON.stringify(item)) item._u = now;
          // Undo of a delete → lift the tombstone so the item isn't eaten again.
          if (tombId.has(item.id)) { resurrected.add(item.id); item._u = now; }
        });
        // Auto-tombstone: present last save, gone now → deleted.
        prevArr.forEach(item => {
          if (item && item.id && !curIds.has(item.id) && !tombId.has(item.id)) {
            STATE.deletedIds.push({ id: item.id, at: now });
            tombId.add(item.id);
          }
        });
      });
      if (resurrected.size) STATE.deletedIds = STATE.deletedIds.filter(d => !resurrected.has(d.id));
      // Prune tombstones older than 60 days (longer than any realistic offline gap)
      const cutoff = now - 60 * 24 * 60 * 60 * 1000;
      STATE.deletedIds = STATE.deletedIds.filter(d => d.at >= cutoff);
    } catch {}
  }

  // Store current state for undo (after tombstone bookkeeping)
  const currentStr = JSON.stringify(STATE);
  if (!_skipHistory && lastSavedStr && currentStr !== lastSavedStr) {
    stateHistory.push(lastSavedStr);
    if (stateHistory.length > 5) stateHistory.shift();
  }

  DB.save(STATE);

  // Queue a cloud push (debounced; survives app restarts via the dirty flag)
  if (_canSync()) { _markDirty(); _schedulePush(); }

  // Auto-refresh custom pages on save so they update in real-time
  if (typeof currentPage !== 'undefined' && typeof navigate === 'function' && typeof isCustomPage === 'function' && isCustomPage(currentPage)) {
    if (typeof _loEdit === 'undefined' || !_loEdit) {
      navigate(currentPage, true);
    }
  }
}

// ===== UNDO / REDO =====
const redoHistory = [];

// Kept for older call sites (login / restore): queue a safe pull-merge-push.
function _syncStateToCloud() {
  if (_canSync()) { _markDirty(); _schedulePush(50); }
}

function undoLastAction() {
  if (stateHistory.length > 0) {
    redoHistory.push(JSON.stringify(STATE));   // remember current so we can redo
    if (redoHistory.length > 10) redoHistory.shift();
    const prevStateStr = stateHistory.pop();
    STATE = JSON.parse(prevStateStr);
    _skipHistory = true; try { saveState(); } finally { _skipHistory = false; }
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
    _skipHistory = true; try { saveState(); } finally { _skipHistory = false; }
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
  const formatted = Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const clean = formatted.endsWith('.00') ? formatted.slice(0, -3) : formatted;
  return `${currency}${clean}`;
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

// Local YYYY-MM-DD (no UTC shift — important so an anchored date isn't off by a day).
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
  const g = h < 12 ? '☀️ Good morning' : h < 17 ? '🌤️ Good afternoon' : h < 20 ? '🌇 Good evening' : '🌙 Good night';
  return `${g}, ${name}!`;
}

// ===== LIVE SYNC ENGINE =====
const LIVE_SYNC_KEYS = [
  'investments', 'loans', 'transactions', 'accounts', 'bankAccounts',
  'bankBalanceHistory', 'bankTransfers', 'creditCards', 'creditCardHistory', 'goals', 'habits',
  'habitCompletions', 'healthEntries', 'tasks', 'budgets',
  'jobApplications', 'emotionEntries', 'skills', 'chatHistory',
  'customAssetTypes', 'customLoanTypes', 'xp', 'level', 'streak',
  'unlockedAchievements', 'deletedIds', 'categoryRules', 'notes',
  'recurring', 'customCategories', 'customPages', 'customPageLayouts',
  'purchases', 'tagBudgets', 'splits', 'dismissedSubs', 'alertState'
];

let _syncTimer     = null;
let _syncBusy      = false;
let _lastCloudHash = '';

// Sync dot indicator in sidebar + sync button (mobile top-tools)
function setSyncDot(status) {
  // Record the last successful sync time (powers the "not backed up in N
  // days" nudge on the Records page).
  if (status === 'ok') { try { localStorage.setItem('lifeos_lastSyncOk', String(Date.now())); } catch (_) {} }
  const cfg = {
    syncing: { bg: '#f59e0b', title: 'Syncing…',     anim: 'pulse 1s infinite', btnColor: '#f59e0b', spin: true  },
    ok:      { bg: '#10b981', title: 'Live · synced', anim: 'none',              btnColor: '#10b981', spin: false },
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

// Manual sync tap — spin the icon and pull from cloud
async function _syncBtnTap() {
  if (typeof pullFromCloud !== 'function') return;
  const icon = document.getElementById('sync-btn-icon');
  if (icon) icon.style.animation = 'syncSpin 1s linear infinite';
  const wait = ms => new Promise(r => setTimeout(r, ms));
  try {
    let r = await pullFromCloud();
    // A background poll was mid-flight — give it a moment, then try again.
    if (r === 'busy') { await wait(1500); r = await pullFromCloud(); }
    // Render's free tier sleeps when idle; waking takes up to 30s.
    // Retry up to 3 times with increasing waits (10s, 15s, 15s = ~40s total).
    if (r === 'error') {
      toast('Waking the server… please wait (~30s)', 'info');
      const delays = [10000, 15000, 15000];
      for (const delay of delays) {
        await wait(delay);
        r = await pullFromCloud();
        if (r === 'ok') break;
      }
    }
    if (r === 'ok')           toast('Synced ✓', 'success');
    else if (r === 'offline') toast("You're offline — sign in to sync", 'warning');
    else                      toast('Sync failed — server may be down, try again later', 'error');
  } catch (_) {
    toast('Sync failed', 'error');
  } finally {
    if (icon) icon.style.animation = 'none';
  }
}

// ── Sync helpers ────────────────────────────────────────────────────────────
function _canSync() {
  return !!(localStorage.getItem('lifeos_token') && STATE.user && !STATE.user.offline);
}
function _markDirty()  { try { localStorage.setItem('lifeos_dirty', '1'); } catch (_) {} }
function _clearDirty() { try { localStorage.removeItem('lifeos_dirty'); } catch (_) {} }
function _isDirty()    { try { return localStorage.getItem('lifeos_dirty') === '1'; } catch (_) { return false; } }

let _pushTimer = null;
let _lastPullOk = 0;     // ms timestamp of the last successful pull
let _pushRetry = 0;
function _schedulePush(delay) {
  clearTimeout(_pushTimer);
  _pushTimer = setTimeout(_pushToCloud, delay == null ? 1200 : delay);
}

// Tombstone-aware: an item is dropped only if it wasn't edited AFTER it was deleted.
function _isDeleted(x, delMap) {
  if (!x || !x.id || !delMap) return false;
  const at = delMap instanceof Map ? delMap.get(x.id) : (delMap[x.id]);
  if (at == null) return false;
  return (x._u || 0) <= at;
}

// Merge two arrays by id. For items on both sides the NEWER edit (_u stamp)
// wins (ties → cloud). Local-only items (not pushed yet) are kept.
// delMap: Map/obj of tombstoned id → deletedAt (or a Set, legacy).
function _mergeById(local, cloud, delMap) {
  if (delMap instanceof Set) { const m = new Map(); delMap.forEach(id => m.set(id, Infinity)); delMap = m; }
  const l = (Array.isArray(local) ? local : []).filter(x => !_isDeleted(x, delMap));
  const c = (Array.isArray(cloud) ? cloud : []).filter(x => !_isDeleted(x, delMap));
  if (!c.length) return l;
  if (!l.length) return c;
  const localMap = new Map(l.filter(x => x && x.id).map(x => [x.id, x]));
  const cloudIds = new Set();
  const out = c.map(x => {
    if (!x || !x.id) return x;
    cloudIds.add(x.id);
    const mine = localMap.get(x.id);
    return (mine && (mine._u || 0) > (x._u || 0)) ? mine : x;
  });
  l.forEach(x => { if (x && x.id && !cloudIds.has(x.id)) out.push(x); });
  return out;
}

// Merge a cloud state object into STATE. Returns { changed, needPush }.
function _mergeCloudIntoState(cloudState) {
  const delMap = new Map();
  [...(STATE.deletedIds || []), ...(cloudState.deletedIds || [])].forEach(d => {
    if (d && d.id) delMap.set(d.id, Math.max(delMap.get(d.id) || 0, d.at || 0));
  });
  const mergedDel = [...delMap.entries()].map(([id, at]) => ({ id, at }));
  let changed = JSON.stringify(mergedDel) !== JSON.stringify(STATE.deletedIds || []);
  let needPush = mergedDel.length !== (cloudState.deletedIds || []).length;
  STATE.deletedIds = mergedDel;

  LIVE_SYNC_KEYS.forEach(k => {
    if (k === 'deletedIds') return;
    const cloud = cloudState[k];
    const local = STATE[k];
    if (Array.isArray(cloud) || Array.isArray(local)) {
      const merged = _mergeById(local, cloud, delMap);
      const mStr = JSON.stringify(merged);
      if (mStr !== JSON.stringify(local || [])) { STATE[k] = merged; changed = true; }
      if (mStr !== JSON.stringify(cloud || [])) needPush = true;
    } else if (cloud && typeof cloud === 'object') {
      // Plain objects (categoryRules, customPageLayouts): key-union, local wins on clash
      const merged = Object.assign({}, cloud, (local && typeof local === 'object') ? local : {});
      const mStr = JSON.stringify(merged);
      if (mStr !== JSON.stringify(local || {})) { STATE[k] = merged; changed = true; }
      if (mStr !== JSON.stringify(cloud)) needPush = true;
    } else if (local && typeof local === 'object') {
      needPush = true;
    } else if (typeof cloud === 'number' || typeof local === 'number') {
      const c = +cloud || 0, l = +local || 0;
      if (c > l) { STATE[k] = c; changed = true; }
      else if (l > c) needPush = true;
    }
  });
  return { changed, needPush };
}

async function _fetchCloud(token) {
  const res = await fetch(`${API_URL}/me`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
  if (res.status === 401 || res.status === 403) { _onAuthExpired(); return { status: 'auth' }; }
  if (!res.ok) return { status: 'error' };
  const data = await res.json();
  return { status: 'ok', state: (data && data.state) || {} };
}

let _authWarned = false;
function _onAuthExpired() {
  setSyncDot('error');
  if (!_authWarned && typeof toast === 'function') {
    _authWarned = true;
    toast('Sync paused — your login expired. Log out and sign in again to resume sync (your data is safe on this device).', 'warning');
  }
}

// Pull latest state from cloud and merge into local STATE
async function pullFromCloud() {
  if (_syncBusy) return 'busy';
  const token = localStorage.getItem('lifeos_token');
  if (!token || !STATE.user || STATE.user.offline) { setSyncDot('offline'); return 'offline'; }

  _syncBusy = true;
  try {
    const r = await _fetchCloud(token);
    if (r.status !== 'ok') { if (r.status !== 'auth') setSyncDot('error'); return 'error'; }
    _lastPullOk = Date.now();
    if (!Object.keys(r.state).length) {
      // Empty cloud: seed it from this device
      if (_hasAnyData(STATE)) { _markDirty(); _schedulePush(50); }
      setSyncDot('ok'); return 'ok';
    }

    const hash = JSON.stringify(r.state).length + ':' + _quickHash(JSON.stringify(r.state));
    if (hash === _lastCloudHash && !_isDirty()) { setSyncDot('ok'); return 'ok'; }
    _lastCloudHash = hash;

    const { changed, needPush } = _mergeCloudIntoState(r.state);
    if (changed) {
      DB.save(STATE);
      if (typeof currentPage !== 'undefined' && typeof navigate === 'function' && !document.getElementById('txpad') && !_modalOpen()) {
        navigate(currentPage, true);
      }
      if (typeof updateSidebar === 'function') updateSidebar();
    }
    // This device holds things the cloud doesn't (offline edits, failed pushes)
    if (needPush || _isDirty()) { _markDirty(); _schedulePush(300); }
    setSyncDot('ok');
    return 'ok';
  } catch {
    setSyncDot('error');
    return 'error';
  } finally {
    _syncBusy = false;
  }
}

function _modalOpen() {
  const ov = document.getElementById('modal-overlay');
  return !!(ov && ov.style.display === 'flex');
}
function _hasAnyData(st) {
  return ['transactions', 'bankAccounts', 'notes', 'budgets', 'investments', 'loans', 'creditCards']
    .some(k => Array.isArray(st[k]) && st[k].length);
}
function _quickHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// Safe push: pull + merge first (so we never overwrite another device's newer
// data on the server, which replaces the whole state), then POST the result.
async function _pushToCloud() {
  if (!_canSync()) return;
  if (_syncBusy) { _schedulePush(800); return; }
  const token = localStorage.getItem('lifeos_token');
  _syncBusy = true;
  setSyncDot('syncing');
  try {
    if (Date.now() - _lastPullOk > 15000) {
      const r = await _fetchCloud(token);
      if (r.status === 'auth') return;
      if (r.status !== 'ok') throw new Error('pull failed');
      _lastPullOk = Date.now();
      if (Object.keys(r.state).length) {
        const { changed } = _mergeCloudIntoState(r.state);
        if (changed) {
          DB.save(STATE);
          if (typeof currentPage !== 'undefined' && typeof navigate === 'function' && !document.getElementById('txpad')) navigate(currentPage, true);
        }
      }
    }
    const res = await fetch(`${API_URL}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ state: STATE })
    });
    if (res.status === 401 || res.status === 403) { _onAuthExpired(); return; }
    if (res.status === 413) {
      setSyncDot('error');
      if (typeof toast === 'function') toast('Sync failed: data too large for the server. Remove big receipts/photos and try again.', 'error');
      return;
    }
    if (!res.ok) throw new Error('push ' + res.status);
    _clearDirty();
    _pushRetry = 0;
    _lastCloudHash = '';     // force the next pull to re-read
    setSyncDot('ok');
  } catch (_) {
    setSyncDot('error');
    // Render's free tier sleeps — back off and retry (5s, 10s, 20s … max 60s)
    _pushRetry = Math.min(_pushRetry + 1, 5);
    _schedulePush(Math.min(60000, 2500 * Math.pow(2, _pushRetry)));
  } finally {
    _syncBusy = false;
  }
}

// Start polling + visibility-based sync
function startLiveSync() {
  const token = localStorage.getItem('lifeos_token');
  if (!token || !STATE.user || STATE.user.offline) { setSyncDot('offline'); return; }

  setSyncDot('ok');

  _authWarned = false;
  // Pull immediately so laptop/desktop sees mobile changes right on open.
  // pullFromCloud also pushes anything left unsent from last session.
  pullFromCloud();

  // Poll for cross-device sync — but ONLY while the app is actually visible,
  // and at a relaxed interval. The old 3s poll downloaded the entire STATE
  // ~20×/min even when nothing changed AND kept firing with the app in your
  // pocket (screen off). That burned ~5GB/month of bandwidth and got the
  // Render backend suspended. Visibility-gated 30s polling cuts that ~95%
  // while still feeling live (a focused tab also pulls instantly on
  // visibilitychange below, so re-opening the app is still snappy).
  if (_syncTimer) clearInterval(_syncTimer);
  _syncTimer = setInterval(() => {
    if (document.hidden) return;     // don't poll a backgrounded / screen-off app
    pullFromCloud();
  }, 30000);

  // Sync immediately when user returns to the tab/app, and when the network
  // comes back. These are bound ONCE (guarded) — startLiveSync can run again
  // on re-login, and re-adding the listeners each time stacked duplicate
  // pullFromCloud calls that multiplied bandwidth.
  if (!startLiveSync._eventsBound) {
    startLiveSync._eventsBound = true;

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) pullFromCloud();
    });

    // Network restored — pull-merge, then push anything pending
    window.addEventListener('online', () => {
      pullFromCloud().then(() => { if (_isDirty()) _schedulePush(200); });
    });
    // Leaving / backgrounding the app with unsent changes → push right away
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && _isDirty() && _canSync()) { clearTimeout(_pushTimer); _pushToCloud(); }
    });
  }
}
