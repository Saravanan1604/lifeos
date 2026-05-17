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
  // Before saving, store current state for undo
  const currentStr = JSON.stringify(STATE);
  const lastSavedStr = localStorage.getItem(DB.KEY);
  if (lastSavedStr && currentStr !== lastSavedStr) {
    stateHistory.push(lastSavedStr);
    if (stateHistory.length > 5) stateHistory.shift(); // keep max 5
  }

  DB.save(STATE); 
  
  // Cloud Sync (only runs if logged in)
  const token = localStorage.getItem('lifeos_token');
  if (token && STATE.user) {
    fetch(`${API_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ state: STATE })
    }).catch(err => console.log('Background sync failed:', err));
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
