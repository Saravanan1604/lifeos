// ===== APP INIT =====
window.addEventListener('DOMContentLoaded', () => {
  initParticles();
  STATE = DB.load();

  // Apply saved theme
  if (STATE.settings?.theme === 'light') document.body.classList.add('light');

  // Inject theme toggle button
  const themeBtn = document.createElement('button');
  themeBtn.className = 'theme-toggle';
  themeBtn.title = 'Toggle Light/Dark Mode';
  themeBtn.textContent = STATE.settings?.theme === 'light' ? '🌙' : '☀️';
  themeBtn.onclick = toggleTheme;
  document.body.appendChild(themeBtn);

  applyTimeTheme();
  initMouseGlow();

  // Check if already authenticated (token + user in localStorage)
  const token = localStorage.getItem('lifeos_token');

  if (STATE.user) {
    // User object exists locally — go straight to app (works offline too)
    showApp();
    renderCalcBody();
  } else if (token) {
    // Token exists but user object missing — try auto-restore from cloud
    tryAutoRestore(token);
  } else {
    // No session at all — show auth screen
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
    // Show offline banner if any local data exists (transactions, etc.)
    showOfflineBannerIfApplicable();
  }

  setInterval(() => { if (STATE.user) checkAchievements(); }, 30000);
  checkAchievements();
});

// Show the "Continue with Saved Data" button if device has any meaningful data
function showOfflineBannerIfApplicable() {
  const raw = localStorage.getItem(DB.KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    const hasData = [
      'transactions', 'bankAccounts', 'habits', 'goals',
      'investments', 'loans', 'bankBalanceHistory', 'budgets'
    ].some(k => (saved[k] || []).length > 0);
    if (hasData) {
      const banner = document.getElementById('offline-banner');
      if (banner) banner.style.display = 'block';
    }
  } catch {}
}

// Load local data without requiring login (offline mode)
function loadLocalData() {
  STATE = DB.load();
  // If no user object, create a minimal one so the app can run
  if (!STATE.user) {
    STATE.user = {
      name: STATE.settings?.name || 'My Account',
      email: 'local@device',
      joinDate: new Date().toISOString(),
      offline: true
    };
    saveState();
  }
  toast('📱 Loaded saved data from this device', 'success');
  showApp();
  renderCalcBody();
}

// Merge two arrays by id — keeps all unique items from both sides
function mergeById(local, cloud) {
  const localArr = Array.isArray(local) ? local : [];
  const cloudArr = Array.isArray(cloud) ? cloud : [];
  if (!cloudArr.length) return localArr;
  if (!localArr.length) return cloudArr;
  const seen = new Set(localArr.map(x => x.id).filter(Boolean));
  // Start with local (device wins), then append any cloud items not already present
  return [...localArr, ...cloudArr.filter(x => x.id && !seen.has(x.id))];
}

// Try to restore session from cloud using existing token
async function tryAutoRestore(token) {
  // Always load local data first — it is the source of truth
  const localState = DB.load();

  try {
    const res = await fetch(`${API_URL}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.state && Object.keys(data.state).length > 0) {
        // Base: cloud state merged over defaults
        const cloud = { ...DB.defaults(), ...data.state };

        // For every array field, merge local + cloud so neither wipes the other
        const ARRAY_KEYS = [
          'investments', 'loans', 'transactions', 'bankAccounts',
          'bankBalanceHistory', 'bankTransfers', 'goals', 'habits',
          'habitCompletions', 'healthEntries', 'tasks', 'budgets',
          'jobApplications', 'emotionEntries', 'skills', 'chatHistory',
          'customAssetTypes', 'customLoanTypes'
        ];
        STATE = cloud;
        ARRAY_KEYS.forEach(k => {
          STATE[k] = mergeById(localState[k], cloud[k]);
        });

        // Prefer local settings (theme, currency, name) if they exist
        if (localState.settings) STATE.settings = { ...cloud.settings, ...localState.settings };

        DB.save(STATE);
      } else {
        // Cloud returned empty — keep local data entirely
        STATE = localState;
      }
      if (!STATE.user && data.user) { STATE.user = data.user; saveState(); }
      showApp();
      renderCalcBody();
      return;
    }
  } catch {}
  // Backend unreachable — keep local data, fall through to auth screen
  STATE = localState;
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('main-app').style.display = 'none';
  showOfflineBannerIfApplicable();
  toast('⚠️ Server unreachable. Use Saved Data to continue offline.', 'warning');
}

// ===== THEME TOGGLE =====
function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  STATE.settings = STATE.settings || {};
  STATE.settings.theme = isLight ? 'light' : 'dark';
  saveState();
  const btn = document.querySelector('.theme-toggle');
  if (btn) btn.textContent = isLight ? '🌙' : '☀️';
  toast(isLight ? '☀️ Light mode on' : '🌙 Dark mode on', 'info');
}
