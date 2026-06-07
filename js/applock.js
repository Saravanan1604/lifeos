// ============================================================
//  App Lock — opt-in 4-digit PIN (default OFF, never locks unless set)
// ============================================================
const LOCK_PIN_KEY  = 'lifeos_pin';
const LOCK_ON_KEY   = 'lifeos_lock_on';
const LOCK_TYPE_KEY = 'lifeos_lock_type';  // 'pin' | 'bio'
const LOCK_BIO_KEY  = 'lifeos_bio_cred';   // base64 credential id

let _lockBuffer  = '';
let _lockMode    = 'verify';   // 'verify' | 'set' | 'confirm'
let _lockTempPin = '';

function appLockEnabled() {
  if (localStorage.getItem(LOCK_ON_KEY) !== '1') return false;
  const t = localStorage.getItem(LOCK_TYPE_KEY) || 'pin';
  return t === 'bio' ? !!localStorage.getItem(LOCK_BIO_KEY) : !!localStorage.getItem(LOCK_PIN_KEY);
}
function lockType() { return localStorage.getItem(LOCK_TYPE_KEY) || 'pin'; }

/* ---------- Biometric (WebAuthn platform authenticator) ---------- */
function _b64(buf)  { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function _unb64(s)  { return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }

async function biometricSupported() {
  try {
    return !!(window.PublicKeyCredential &&
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
  } catch { return false; }
}

async function enableBiometricLock() {
  if (!(await biometricSupported())) {
    if (typeof toast === 'function') toast('Biometric not available on this device', 'warning');
    return;
  }
  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'atworth', id: location.hostname },
        user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'lifeos-user', displayName: 'atworth User' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
        timeout: 60000, attestation: 'none'
      }
    });
    localStorage.setItem(LOCK_BIO_KEY, _b64(cred.rawId));
    localStorage.setItem(LOCK_TYPE_KEY, 'bio');
    localStorage.setItem(LOCK_ON_KEY, '1');
    if (typeof toast === 'function') toast('🔐 Biometric lock enabled', 'success');
    if (typeof navigate === 'function') navigate('settings', true);
  } catch (e) {
    if (typeof toast === 'function') toast('Could not set up biometric', 'error');
  }
}

async function _tryBiometric() {
  try {
    await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: 'public-key', id: _unb64(localStorage.getItem(LOCK_BIO_KEY)) }],
        userVerification: 'required', timeout: 60000
      }
    });
    _markUnlocked(); _hideLockScreen();      // success → unlock
    if (navigator.vibrate) navigator.vibrate(12);
  } catch (e) {
    const st = document.getElementById('app-lock-bio-status');
    if (st) st.textContent = 'Authentication failed — tap to retry';
    if (navigator.vibrate) navigator.vibrate([30,40,30]);
  }
}

// Light obfuscation (not real crypto — just so the PIN isn't plain text)
function _hashPin(p) {
  let h = 0;
  for (let i = 0; i < p.length; i++) { h = ((h << 5) - h + p.charCodeAt(i)) | 0; }
  return 'h' + h;
}

const SESSION_UNLOCK = 'lifeos_unlocked';   // sessionStorage — survives refresh, cleared on app close

function _markUnlocked() { try { sessionStorage.setItem(SESSION_UNLOCK, '1'); } catch {} }
function _isUnlockedThisSession() { try { return sessionStorage.getItem(SESSION_UNLOCK) === '1'; } catch { return false; } }

function maybeShowAppLock() {
  if (!appLockEnabled()) return;
  if (_isUnlockedThisSession()) return;        // already unlocked → don't re-ask on refresh/focus
  if (lockType() === 'bio') { _showBioScreen(); _tryBiometric(); }
  else { _lockMode = 'verify'; _lockBuffer = ''; _showLockScreen('Enter your PIN'); }
}

function _showBioScreen() {
  const ov = document.getElementById('app-lock');
  const pad = document.getElementById('app-lock-pin');
  const bio = document.getElementById('app-lock-bio');
  if (!ov) return;
  if (pad) pad.style.display = 'none';
  if (bio) bio.style.display = 'flex';
  const t = document.getElementById('app-lock-title');
  if (t) t.textContent = 'Unlock atworth';
  ov.style.display = 'flex';
}

function _showLockScreen(title) {
  const ov = document.getElementById('app-lock');
  if (!ov) return;
  const pad = document.getElementById('app-lock-pin');
  const bio = document.getElementById('app-lock-bio');
  if (pad) pad.style.display = 'block';
  if (bio) bio.style.display = 'none';
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
      _lockBuffer = ''; _markUnlocked(); _hideLockScreen();
      if (navigator.vibrate) navigator.vibrate(12);
    } else { _lockShake(); _lockBuffer = ''; _renderLockDots(); }
  } else if (_lockMode === 'set') {
    _lockTempPin = _lockBuffer; _lockBuffer = ''; _lockMode = 'confirm';
    _showLockScreen('Confirm your PIN');
  } else if (_lockMode === 'confirm') {
    if (_lockBuffer === _lockTempPin) {
      localStorage.setItem(LOCK_PIN_KEY, _hashPin(_lockBuffer));
      localStorage.setItem(LOCK_ON_KEY, '1');
      localStorage.setItem(LOCK_TYPE_KEY, 'pin');
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
  localStorage.removeItem(LOCK_TYPE_KEY);
  localStorage.removeItem(LOCK_BIO_KEY);
  if (typeof toast === 'function') toast('App Lock disabled', 'info');
  if (typeof navigate === 'function') navigate('settings', true);
}
function retryBiometric() { _tryBiometric(); }
function cancelAppLockSetup() {
  if (_lockMode === 'verify') return;   // can't dismiss the lock when verifying
  _lockBuffer = ''; _hideLockScreen();
}

// Lock on load; re-lock only after the app has been in the background a while
let _hiddenAt = 0;
const RELOCK_AFTER_MS = 60000;   // re-ask only if backgrounded > 60s
window.addEventListener('DOMContentLoaded', () => setTimeout(maybeShowAppLock, 50));
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    _hiddenAt = Date.now();
  } else {
    // Returned to foreground — only re-lock if it was backgrounded long enough
    if (_hiddenAt && (Date.now() - _hiddenAt) > RELOCK_AFTER_MS) {
      try { sessionStorage.removeItem(SESSION_UNLOCK); } catch {}
      maybeShowAppLock();
    }
    _hiddenAt = 0;
  }
});
