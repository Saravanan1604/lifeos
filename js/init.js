// ===== HAPTICS — subtle vibration on taps (installed app) =====
(function initHaptics() {
  if (!('vibrate' in navigator)) return;
  document.addEventListener('click', (e) => {
    if (!document.documentElement.classList.contains('is-app')) return;
    const el = e.target.closest('button, .bn-item, #fab-add, .nav-item, .period-tab, .welcome-grid > div, .qa-grid > div, .tx-row, .fin-dark-card');
    if (el) navigator.vibrate(10);
  }, true);
})();

// ===== NATIVE (Capacitor) BRIDGES — all optional & guarded =====
// These only do anything inside the installed Android app once the matching
// Capacitor plugins are added. Until then every block fails its capability
// check and silently no-ops, so the web build is unaffected.
function _initNativeBridges() {
  const P = (window.Capacitor && window.Capacitor.Plugins) || {};

  // #5 Status bar — tint it to the brand teal with dark icons so the top of
  // the app looks finished instead of the default black bar.
  if (P.StatusBar) {
    try { P.StatusBar.setBackgroundColor({ color: '#00c9a7' }); } catch (_) {}
    try { P.StatusBar.setStyle({ style: 'DARK' }); } catch (_) {}
    try { P.StatusBar.setOverlaysWebView({ overlay: false }); } catch (_) {}
  }

  // #3 Hardware back button — close any open overlay first, then walk back to
  // the dashboard, and only exit from there. This is far more reliable than
  // the history-shim and matches what users expect on Android.
  if (P.App && P.App.addListener) {
    P.App.addListener('backButton', () => {
      const lock = document.getElementById('app-lock');
      if (lock && lock.style.display === 'flex') return;            // can't dismiss lock
      const modal = document.getElementById('modal-overlay');
      if (modal && getComputedStyle(modal).display !== 'none') { if (typeof closeModal === 'function') closeModal(); return; }
      const sb = document.getElementById('sidebar');
      if (sb && sb.classList.contains('mobile-open')) { if (typeof _closeMobileDrawer === 'function') _closeMobileDrawer(); return; }
      if (typeof currentPage !== 'undefined' && currentPage && currentPage !== 'dashboard' && currentPage !== 'transactions') {
        navigate('transactions'); return;
      }
      try { P.App.exitApp(); } catch (_) {}
    });
  }

  // #9 Recurring due reminders — a local notification when auto-repeating
  // entries are due, so users don't have to open the app to post them.
  if (P.LocalNotifications) {
    (async () => {
      try {
        const perm = await P.LocalNotifications.requestPermissions();
        if (perm && perm.display !== 'granted') return;
        const today = new Date().toISOString().slice(0, 10);
        const due = (STATE.recurring || []).filter(r => (r.nextDate || '') <= today);
        if (!due.length) return;
        await P.LocalNotifications.schedule({
          notifications: [{
            id: 9001,
            title: 'atworth — Recurring due',
            body: `${due.length} recurring ${due.length === 1 ? 'entry is' : 'entries are'} due to post.`,
            schedule: { at: new Date(Date.now() + 4000) }
          }]
        });
      } catch (_) {}
    })();
  }

  // #1 Google Sign-In — webviews block Google OAuth. If the native GoogleAuth
  // plugin is present, route the sign-in button through it. Falls back to the
  // existing web GIS flow otherwise. (Full activation also needs the plugin's
  // serverClientId configured — see the lifeos-dev skill notes.)
  if (P.GoogleAuth) {
    window.__nativeGoogleSignIn = async function () {
      try {
        const res = await P.GoogleAuth.signIn();
        const email = res && (res.email || (res.authentication && res.email));
        if (email && typeof handleGoogleSignIn === 'function') {
          handleGoogleSignIn({ credential: null, _native: res, email: email, name: res.name || res.givenName || email });
        }
      } catch (e) { if (typeof toast === 'function') toast('Google sign-in cancelled', 'info'); }
    };
  }
}

// ===== APP INIT =====
window.addEventListener('DOMContentLoaded', () => {
  initParticles();
  STATE = DB.load();

  // Installed app: charts draw instantly. Re-animating every chart from
  // zero on each tab switch made navigation feel like a page reload.
  if (window.__IS_APP && window.Chart) {
    try { Chart.defaults.animation = false; } catch (_) {}
  }

  // Native Capacitor integrations — each is guarded so it no-ops cleanly when
  // the plugin isn't installed yet. To activate, in the project run:
  //   npm i @capacitor/app @capacitor/status-bar @capacitor/local-notifications
  //   npx cap sync android
  if (window.__IS_APP) { try { _initNativeBridges(); } catch (e) { console.log('native bridge init skipped', e); } }

  // Apply saved global text-size (Default / Large / XL)
  if (typeof applyAppScale === 'function') { try { applyAppScale(); } catch (_) {} }

  // Apply saved theme. Default is 'auto' = follow the device's system
  // (light/dark) setting.
  if (typeof applyThemeClass === 'function') applyThemeClass(STATE.settings?.theme || 'auto');
  else if (STATE.settings?.theme === 'light') document.body.classList.add('light');

  // Live-update when the device switches light/dark, but only while the
  // theme is set to System ('auto'). Explicit themes stay put.
  if (window.matchMedia) {
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        if ((STATE.settings && STATE.settings.theme ? STATE.settings.theme : 'auto') === 'auto' && typeof applyThemeClass === 'function') {
          applyThemeClass('auto');
        }
      });
    } catch (_) {}
  }

  // Apply saved hero-number display font (Settings > Number Style, app-only CSS)
  if (window.__IS_APP) document.body.classList.toggle('numfont', STATE.settings?.numFont === 'grotesk');

  // Inject the floating theme toggle (sun/moon). On web it floats top-right;
  // in the app, CSS pins it top-right next to the notification bell.
  document.body.appendChild(_makeThemeBtn());

  applyTimeTheme();
  initMouseGlow();

  // Check if already authenticated (token + user in localStorage)
  const token = localStorage.getItem('lifeos_token');

  if (STATE.user) {
    // User object exists locally — go straight to app (works offline too)
    showApp();
    renderCalcBody();
    if (typeof maybeShowMorningDigest === 'function') maybeShowMorningDigest();
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

        // Clear any stale offline flag so live sync re-enables
        if (STATE.user) STATE.user.offline = false;

        DB.save(STATE);
        // Push the merged state back to cloud so the web app can pick it up
        _syncStateToCloud();
      } else {
        // Cloud returned empty — keep local data entirely
        STATE = localState;
        if (STATE.user) STATE.user.offline = false;
        DB.save(STATE);
        _syncStateToCloud();
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
  document.querySelectorAll('.theme-toggle').forEach(b => b.textContent = isLight ? '🌙' : '☀️');
  toast(isLight ? '☀️ Light mode on' : '🌙 Dark mode on', 'info');
}

// Build a fresh theme-toggle button element.
function _makeThemeBtn() {
  const b = document.createElement('button');
  b.className = 'theme-toggle';
  b.title = 'Toggle Light/Dark Mode';
  b.textContent = (STATE.settings?.theme === 'light') ? '🌙' : '☀️';
  b.onclick = toggleTheme;
  return b;
}

// In the installed mobile app, DOCK the theme button inside the current
// page header's right-side action group (grouped with "+ Add ..." with a
// gap) instead of floating. On the web/desktop it stays floating as before.
function _dockThemeToggle() {
  return;   // disabled — the sun/moon now stays pinned top-right near the bell (see mobile.css)
  if (!document.documentElement.classList.contains('is-app')) return;
  const header = document.querySelector('#page-container .page-header');
  if (!header) return;
  // The actions live in the last <div> of the header (flex row).
  let group = null;
  for (let i = header.children.length - 1; i >= 0; i--) {
    if (header.children[i].tagName === 'DIV') { group = header.children[i]; break; }
  }
  if (!group) return;
  // The previous header was wiped on re-render, so its button is gone — make one.
  let btn = group.querySelector('.theme-toggle');
  if (!btn) btn = _makeThemeBtn();
  btn.classList.add('theme-toggle-docked');
  group.appendChild(btn);     // appendChild moves the node if it already exists
}
