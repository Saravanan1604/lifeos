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
    const hasTxns = (saved.transactions || []).length > 0;
    const hasBanks = (saved.bankAccounts || []).length > 0;
    const hasHabits = (saved.habits || []).length > 0;
    const hasGoals = (saved.goals || []).length > 0;
    if (hasTxns || hasBanks || hasHabits || hasGoals) {
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

// Try to restore session from cloud using existing token
async function tryAutoRestore(token) {
  try {
    const res = await fetch(`${API_URL}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.state && Object.keys(data.state).length > 0) {
        STATE = { ...DB.defaults(), ...data.state };
        DB.save(STATE);
      }
      if (!STATE.user && data.user) {
        STATE.user = data.user;
        saveState();
      }
      showApp();
      renderCalcBody();
      return;
    }
  } catch {}
  // Backend unreachable — fall through to auth screen
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
