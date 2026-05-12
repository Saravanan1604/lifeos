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
      chatHistory: []
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

function saveState() { DB.save(STATE); }

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
