// ============================================================
//  App Lock — opt-in 4-digit PIN (default OFF, never locks unless set)
// ============================================================
const LOCK_PIN_KEY = 'lifeos_pin';
const LOCK_ON_KEY  = 'lifeos_lock_on';

let _lockBuffer  = '';
let _lockMode    = 'verify';   // 'verify' | 'set' | 'confirm'
let _lockTempPin = '';

function appLockEnabled() {
  return localStorage.getItem(LOCK_ON_KEY) === '1' && !!localStorage.getItem(LOCK_PIN_KEY);
}

// Light obfuscation (not real crypto — just so the PIN isn't plain text)
function _hashPin(p) {
  let h = 0;
  for (let i = 0; i < p.length; i++) { h = ((h << 5) - h + p.charCodeAt(i)) | 0; }
  return 'h' + h;
}

function maybeShowAppLock() {
  if (!appLockEnabled()) return;
  _lockMode = 'verify'; _lockBuffer = '';
  _showLockScreen('Enter your PIN');
}

function _showLockScreen(title) {
  const ov = document.getElementById('app-lock');
  if (!ov) return;
  const t = document.getElementById('app-lock-title');
  if (t) t.textContent = title;
  ov.style.display = 'flex';
  _renderLockDots();
}
function _hideLockScreen() {
  const ov = document.getElementById('app-lock');
  if (ov) ov.style.display = 'none';
}
function _renderLockDots() {
  const dots = document.getElementById('app-lock-dots');
  if (!dots) return;
  dots.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const d = document.createElement('span');
    d.className = 'lock-dot' + (i < _lockBuffer.length ? ' filled' : '');
    dots.appendChild(d);
  }
}

function lockKey(n) {
  if (_lockBuffer.length >= 4) return;
  _lockBuffer += String(n);
  _renderLockDots();
  if (navigator.vibrate) navigator.vibrate(8);
  if (_lockBuffer.length === 4) setTimeout(_lockSubmit, 140);
}
function lockDel() { _lockBuffer = _lockBuffer.slice(0, -1); _renderLockDots(); }

function _lockShake() {
  const c = document.getElementById('app-lock-card');
  if (c) { c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); }
  if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
}

function _lockSubmit() {
  if (_lockMode === 'verify') {
    if (_hashPin(_lockBuffer) === localStorage.getItem(LOCK_PIN_KEY)) {
      _lockBuffer = ''; _hideLockScreen();
      if (navigator.vibrate) navigator.vibrate(12);
    } else { _lockShake(); _lockBuffer = ''; _renderLockDots(); }
  } else if (_lockMode === 'set') {
    _lockTempPin = _lockBuffer; _lockBuffer = ''; _lockMode = 'confirm';
    _showLockScreen('Confirm your PIN');
  } else if (_lockMode === 'confirm') {
    if (_lockBuffer === _lockTempPin) {
      localStorage.setItem(LOCK_PIN_KEY, _hashPin(_lockBuffer));
      localStorage.setItem(LOCK_ON_KEY, '1');
      _lockBuffer = ''; _hideLockScreen();
      if (typeof toast === 'function') toast('🔒 App Lock enabled', 'success');
      if (typeof navigate === 'function') navigate('settings', true);
    } else {
      _lockShake(); _lockBuffer = ''; _lockMode = 'set';
      _showLockScreen('PINs did not match — set PIN');
    }
  }
}

// Called from Settings
function setupAppLock() { _lockMode = 'set'; _lockBuffer = ''; _lockTempPin = ''; _showLockScreen('Set a 4-digit PIN'); }
function disableAppLock() {
  localStorage.removeItem(LOCK_PIN_KEY);
  localStorage.removeItem(LOCK_ON_KEY);
  if (typeof toast === 'function') toast('App Lock disabled', 'info');
  if (typeof navigate === 'function') navigate('settings', true);
}
function cancelAppLockSetup() {
  if (_lockMode === 'verify') return;   // can't dismiss the lock when verifying
  _lockBuffer = ''; _hideLockScreen();
}

// Lock on load + when the app returns to the foreground
window.addEventListener('DOMContentLoaded', () => setTimeout(maybeShowAppLock, 50));
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') maybeShowAppLock();
});
