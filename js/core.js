// ===== PARTICLES =====
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;
  window.addEventListener('resize', () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  // Dark mode: teal glow network
  const darkColors = [
    'rgba(0,201,167,', 'rgba(0,229,190,', 'rgba(10,207,131,',
    'rgba(0,201,167,', 'rgba(0,229,190,', 'rgba(99,102,241,',
  ];
  // Light mode: indigo/violet — visible on white background
  const lightColors = [
    'rgba(79,70,229,', 'rgba(99,102,241,', 'rgba(139,92,246,',
    'rgba(0,130,110,', 'rgba(16,120,100,', 'rgba(109,40,217,',
  ];

  const particles = Array.from({ length: 40 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 2.2 + 1.2,
    dx: (Math.random() - 0.5) * 0.18,
    dy: (Math.random() - 0.5) * 0.18,
    colorIdx: Math.floor(Math.random() * darkColors.length),
    opacity: Math.random() * 0.5 + 0.35,
    pulse: Math.random() * Math.PI * 2,
  }));

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const isLight = document.body.classList.contains('light');
    const colors = isLight ? lightColors : darkColors;
    const lineRGB = isLight ? '79,70,229' : '0,201,167';
    const lineAlpha = isLight ? 0.14 : 0.35;
    const lineW = isLight ? 0.55 : 0.9;

    // ─── Lines behind dots ───
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const ddx = particles[i].x - particles[j].x;
        const ddy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dist < 200) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${lineRGB},${lineAlpha * (1 - dist / 200)})`;
          ctx.lineWidth = lineW;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // ─── Dots ───
    particles.forEach(p => {
      p.pulse += 0.012;
      const breathe = p.opacity + Math.sin(p.pulse) * 0.08;
      const col = colors[p.colorIdx % colors.length];

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      grad.addColorStop(0, col + (breathe * 0.7) + ')');
      grad.addColorStop(0.5, col + (breathe * 0.25) + ')');
      grad.addColorStop(1, col + '0)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = col + breathe + ')';
      ctx.fill();

      p.x += p.dx; p.y += p.dy;
      if (p.x < 0 || p.x > W) p.dx *= -1;
      if (p.y < 0 || p.y > H) p.dy *= -1;
    });

    requestAnimationFrame(draw);
  }
  draw();
}


// ===== TOAST =====
function toast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 3000);
}

// ===== MODAL =====
function openModal(title, bodyHTML) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-overlay').style.display = 'flex';
}
function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

// ===== AUTH =====
function switchAuthTab(tab) {
  document.getElementById('login-form').style.display = tab === 'login' ? 'flex' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'flex' : 'none';
  const forgotForm = document.getElementById('forgot-form');
  if (forgotForm) forgotForm.style.display = tab === 'forgot' ? 'flex' : 'none';

  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  const forgotTab = document.getElementById('tab-forgot');
  if (forgotTab) forgotTab.classList.toggle('active', tab === 'forgot');
}

async function handleForgotPassword() {
  const mobile = document.getElementById('forgot-mobile').value.trim();
  const email = document.getElementById('forgot-email').value.trim();
  const newPassword = document.getElementById('forgot-password').value.trim();

  if (!mobile || !email || !newPassword) { toast('Please enter mobile number, email and new password', 'error'); return; }

  try {
    const btn = document.querySelector('#forgot-form button');
    const oldText = btn.innerHTML;
    btn.innerHTML = '<span>Resetting...</span>';
    
    const res = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, email, newPassword })
    });
    const data = await res.json();
    
    btn.innerHTML = oldText;

    if (!res.ok) throw new Error(data.error || 'Failed to reset password');

    toast(data.message, 'success');
    
    // Clear fields
    document.getElementById('forgot-mobile').value = '';
    document.getElementById('forgot-email').value = '';
    document.getElementById('forgot-password').value = '';
    
    // Switch to login and prefill email
    switchAuthTab('login');
    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = '';
    
  } catch (err) {
    toast(err.message, 'error');
  }
}


async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  if (!email || !pass) { toast('Enter email and password', 'error'); return; }

  // Snapshot local data BEFORE any network call — never lose it
  const localState = DB.load();

  const btn = document.querySelector('#login-form button');
  const origText = btn.textContent;
  btn.textContent = 'Signing in…';

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });

    const data = await res.json();
    btn.textContent = origText;

    if (!res.ok) {
      // Server returned an error (user not found, wrong password, etc.)
      const msg = data.error || 'Login failed';
      toast('❌ ' + msg, 'error');

      // If account not found on server but local data exists → offer offline login
      const notFound = /not found|not exist|no account|invalid|does not exist/i.test(msg);
      if (notFound && localState && Object.keys(localState).length > 0) {
        toast('💡 You have data saved on this device. Use "Continue with Saved Data" below.', 'info');
        if (typeof showOfflineBannerIfApplicable === 'function') showOfflineBannerIfApplicable();
      }
      return;
    }

    // ── Successful login ──────────────────────────────────────────────
    localStorage.setItem('lifeos_token', data.token);

    // Merge cloud + local so neither overwrites the other
    if (data.state && Object.keys(data.state).length > 0) {
      const cloud = { ...DB.defaults(), ...data.state };
      const KEYS  = [
        'investments', 'loans', 'transactions', 'bankAccounts',
        'bankBalanceHistory', 'bankTransfers', 'goals', 'habits',
        'habitCompletions', 'healthEntries', 'tasks', 'budgets',
        'jobApplications', 'emotionEntries', 'skills', 'chatHistory',
        'customAssetTypes', 'customLoanTypes'
      ];
      STATE = cloud;
      KEYS.forEach(k => { STATE[k] = _mergeById(localState[k], cloud[k]); });
      if (localState.settings) STATE.settings = { ...cloud.settings, ...localState.settings };
    } else {
      // Cloud has no data — keep all local data, just update user
      STATE = { ...localState, user: data.user || localState.user };
    }

    if (data.user) STATE.user = data.user;
    DB.save(STATE);

    toast('✅ Logged in successfully!', 'success');
    showApp();
    renderCalcBody();

  } catch (err) {
    btn.textContent = origText;

    // Network / fetch error = backend unreachable (Render sleeping)
    const isNetworkErr = err instanceof TypeError || /fetch|network/i.test(err.message);
    if (isNetworkErr) {
      // Backend is sleeping — use local data if available
      if (localState && localState.user) {
        STATE = localState;
        toast('⚠️ Server unreachable — loaded your saved local data', 'warning');
        showApp();
        renderCalcBody();
      } else {
        toast('❌ Server offline. Use "Continue with Saved Data" below.', 'error');
        if (typeof showOfflineBannerIfApplicable === 'function') showOfflineBannerIfApplicable();
      }
    } else {
      toast('❌ ' + err.message, 'error');
    }
  }
}


async function handleRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const mobile = document.getElementById('reg-mobile').value.trim();
  const pass = document.getElementById('reg-password').value;
  if (!name || !email || !mobile || !pass) { toast('Fill all fields', 'error'); return; }

  try {
    const btn = document.querySelector('#register-form button');
    btn.textContent = 'Creating account...';

    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, mobile, password: pass })
    });

    const data = await res.json();
    btn.textContent = 'Create Account';

    if (!res.ok) throw new Error(data.error || 'Registration failed');

    // Save Token and State
    localStorage.setItem('lifeos_token', data.token);
    STATE = { ...DB.defaults(), ...data.state };
    DB.save(STATE);

    toast('Account created!', 'success');
    showApp();
    renderCalcBody();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function _decodeGoogleJWT(credential) {
  try {
    const payload = credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch { return null; }
}

async function handleGoogleSignIn(response) {
  const localState = DB.load();

  // Decode Google's JWT locally (already verified by GIS library)
  const gUser = _decodeGoogleJWT(response.credential);
  if (!gUser || !gUser.email) { toast('Google sign-in failed', 'error'); return; }
  const { name, email, picture } = gUser;

  // Try backend for cloud sync; fall back to local session if unavailable
  try {
    const res = await fetch(`${API_URL}/google-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential })
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }

    if (data && res.ok) {
      localStorage.setItem('lifeos_token', data.token);
      const KEYS = [
        'investments', 'loans', 'transactions', 'bankAccounts',
        'bankBalanceHistory', 'bankTransfers', 'goals', 'habits',
        'habitCompletions', 'healthEntries', 'tasks', 'budgets',
        'jobApplications', 'emotionEntries', 'skills', 'chatHistory',
        'customAssetTypes', 'customLoanTypes'
      ];
      if (data.state && Object.keys(data.state).length > 0) {
        const cloud = { ...DB.defaults(), ...data.state };
        STATE = cloud;
        KEYS.forEach(k => { STATE[k] = mergeById(localState[k], cloud[k]); });
        if (localState.settings) STATE.settings = { ...cloud.settings, ...localState.settings };
      } else {
        STATE = { ...localState };
      }
      if (data.user) STATE.user = data.user;
      DB.save(STATE);
      toast('Signed in with Google!', 'success');
      showApp();
      renderCalcBody();
      return;
    }
  } catch (_) { /* backend unreachable, fall through */ }

  // Local session fallback
  STATE = { ...DB.defaults(), ...localState };
  STATE.user = { name, email, picture, authProvider: 'google', joinDate: new Date().toISOString() };
  DB.save(STATE);
  toast('Signed in with Google!', 'success');
  showApp();
  renderCalcBody();
}

function handleLogout() {
  localStorage.removeItem('lifeos_token');
  // Clear only auth — keep all data so it survives logout/login cycles
  STATE.user = null;
  DB.save(STATE);
  if (_syncTimer) { clearInterval(_syncTimer); _syncTimer = null; }
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  if (typeof showOfflineBannerIfApplicable === 'function') showOfflineBannerIfApplicable();
}

function showApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'flex';
  updateSidebar();
  checkStreak();
  navigate('dashboard');
  if (typeof startLiveSync === 'function') startLiveSync();
}

// ===== SIDEBAR =====
let sidebarCollapsed = false;
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ct = document.getElementById('content');
  
  if (window.innerWidth <= 768) {
    // Mobile mode: just show/hide the sidebar fully
    sb.classList.toggle('mobile-open');
  } else {
    // Desktop mode: toggle collapse (shrink width)
    sidebarCollapsed = !sidebarCollapsed;
    sb.classList.toggle('collapsed', sidebarCollapsed);
    ct.classList.toggle('expanded', sidebarCollapsed);
  }
}

function updateSidebar() {
  const name = STATE.settings.name || STATE.user?.name || 'User';
  document.getElementById('sidebar-name').textContent = name;
  const levels = ['Beginner', 'Explorer', 'Achiever', 'Warrior', 'Champion', 'Legend', 'Master', 'Grandmaster', 'Elite', 'Life OS Pro'];
  const lvl = STATE.level || 1;
  document.getElementById('sidebar-level').textContent = `Level ${lvl} · ${levels[Math.min(lvl - 1, levels.length - 1)]}`;
  const xpForNext = lvl * 1000;
  const xpPct = Math.min(100, ((STATE.xp % xpForNext) / xpForNext) * 100);
  document.getElementById('sidebar-xp-fill').style.width = xpPct + '%';
  document.getElementById('sidebar-xp-label').textContent = `${STATE.xp % xpForNext} / ${xpForNext} XP`;
}

// ===== STREAK =====
function checkStreak() {
  const t = today();
  if (STATE.lastActive === t) return;
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  if (STATE.lastActive === yStr) { STATE.streak = (STATE.streak || 0) + 1; }
  else if (STATE.lastActive && STATE.lastActive !== t) { STATE.streak = 1; }
  else if (!STATE.lastActive) { STATE.streak = 1; }
  STATE.lastActive = t;
  saveState();
}

// ===== XP & GAMIFICATION =====
function addXP(amount, reason = '') {
  STATE.xp = (STATE.xp || 0) + amount;
  const xpForNext = (STATE.level || 1) * 1000;
  if (STATE.xp >= xpForNext) {
    STATE.level = (STATE.level || 1) + 1;
    toast(`🎉 Level Up! You're now Level ${STATE.level}!`, 'success');
  }
  saveState();
  updateSidebar();
  if (reason) toast(`+${amount} XP · ${reason}`, 'info');
}

// ===== ROUTER =====
let currentPage = 'dashboard';
let chartInstances = {};

function destroyCharts() {
  Object.values(chartInstances).forEach(c => { try { c.destroy(); } catch {} });
  chartInstances = {};
}

function _renderPage(page) {
  const container = document.getElementById('page-container');
  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'finance': renderFinance(); break;
    case 'investments': renderInvestments(); break;
    case 'budget': renderBudget(); break;
    case 'bank-tracker': renderBankTracker(); break;
    case 'health': renderHealth(); break;
    case 'habits': renderHabits(); break;
    case 'goals': renderGoals(); break;
    case 'journal': renderJournal(); break;
    case 'achievements': renderAchievements(); break;
    case 'ai-coach': renderAICoach(); break;
    case 'analytics': renderAnalytics(); break;
    case 'categories': renderCategories(); break;
    case 'settings': renderSettings(); break;
    case 'help': renderHelp(); break;
    default: container.innerHTML = '<p style="padding:40px;color:rgba(255,255,255,0.4)">Page coming soon</p>';
  }
}

function navigate(page, skipHistory = false) {
  // Re-rendering the page you're already on (live-sync poll, price refresh,
  // post-action update) is a soft refresh — no spinner flash, keep scroll.
  const softRefresh = (page === currentPage) && skipHistory;
  currentPage = page;
  destroyCharts();

  if (!skipHistory) {
    history.pushState({ page: page }, '', `#${page}`);
  }

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('mobile-open');
    sidebarCollapsed = false;
  }

  const container = document.getElementById('page-container');

  if (softRefresh) {
    const y = window.scrollY;
    container.classList.add('no-anim');        // suppress fadeInUp replay
    _renderPage(page);
    requestAnimationFrame(() => {
      window.scrollTo(0, y);                    // restore scroll position
      requestAnimationFrame(() => container.classList.remove('no-anim'));
    });
    return;
  }

  // Genuine navigation to a different page → show transition spinner
  container.classList.remove('no-anim');
  container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:24px" class="loading-spin">⚡</div>';
  setTimeout(() => _renderPage(page), 80);
}

// Re-render the current page in place without a full-screen flash.
function softRefresh() {
  navigate(currentPage, true);
}

// ===== HARDWARE BACK BUTTON (ANDROID PWA) =====
window.addEventListener('popstate', (e) => {
  if (e.state && e.state.page) {
    navigate(e.state.page, true);
  } else {
    // default
    navigate('dashboard', true);
  }
});
