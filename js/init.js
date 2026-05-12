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

  if (STATE.user) {
    showApp();
    renderCalcBody();
  } else {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
  }

  setInterval(() => { if (STATE.user) checkAchievements(); }, 30000);
  checkAchievements();
});

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
