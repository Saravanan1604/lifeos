// ============================================================
//  First-run Onboarding — welcome → profile → first action
// ============================================================
const ONBOARD_KEY = 'lifeos_onboarded';
let _obStep = 0;
const _OB_SLIDES = 3;

function shouldOnboard() {
  if (localStorage.getItem(ONBOARD_KEY) === '1') return false;
  // Only greet genuinely new users (no transactions yet)
  return !(typeof STATE !== 'undefined' && STATE.transactions && STATE.transactions.length);
}

function maybeShowOnboarding() {
  // App must be visible (user past the auth screen)
  const main = document.getElementById('main-app');
  if (!main || main.style.display === 'none') return;
  if (!shouldOnboard()) { localStorage.setItem(ONBOARD_KEY, '1'); return; }
  const ov = document.getElementById('onboarding');
  if (!ov) return;
  // Prefill profile fields
  const nm = document.getElementById('ob-name');
  if (nm && STATE.settings?.name && STATE.settings.name !== 'User') nm.value = STATE.settings.name;
  const cur = document.getElementById('ob-currency');
  if (cur && STATE.settings?.currency) cur.value = STATE.settings.currency;
  _obStep = 0;
  ov.style.display = 'flex';
  _obRender();
}

function _obRender() {
  document.querySelectorAll('#onboarding .ob-slide').forEach((s, i) => s.style.display = i === _obStep ? 'flex' : 'none');
  document.querySelectorAll('#onboarding .ob-dot').forEach((d, i) => d.classList.toggle('on', i === _obStep));
  const back = document.getElementById('ob-back');
  if (back) back.style.visibility = _obStep === 0 ? 'hidden' : 'visible';
  const next = document.getElementById('ob-next');
  if (next) next.textContent = _obStep === _OB_SLIDES - 1 ? '✓ Get Started' : 'Next →';
}

function obNext() {
  if (_obStep === 1) {            // save profile before leaving step 2
    const n = document.getElementById('ob-name')?.value.trim();
    const c = document.getElementById('ob-currency')?.value;
    STATE.settings = STATE.settings || {};
    if (n) STATE.settings.name = n;
    if (c) STATE.settings.currency = c;
    if (typeof saveState === 'function') saveState();
  }
  if (_obStep < _OB_SLIDES - 1) { _obStep++; _obRender(); }
  else obFinish();
}
function obBack() { if (_obStep > 0) { _obStep--; _obRender(); } }

function obFinish() {
  localStorage.setItem(ONBOARD_KEY, '1');
  const ov = document.getElementById('onboarding'); if (ov) ov.style.display = 'none';
  if (typeof navigate === 'function') navigate('dashboard', true);
  if (typeof toast === 'function') toast('Welcome to atworth! 🎉', 'success');
}
function obSkip() {
  localStorage.setItem(ONBOARD_KEY, '1');
  const ov = document.getElementById('onboarding'); if (ov) ov.style.display = 'none';
}
function obAddFirst(type) {
  obFinish();
  if (typeof navigate === 'function') {
    navigate('finance');
    setTimeout(() => { if (typeof openAddTxModal === 'function') openAddTxModal(type); }, 280);
  }
}
