// ============================================================
//  LifeOS — Multilingual (English / தமிழ் / हिन्दी) + Voice Control
//  Uses the Web Speech API (SpeechRecognition + SpeechSynthesis).
//  No external dependencies, fully offline-capable in supporting browsers.
// ============================================================

// ---- Supported languages -----------------------------------
const VOICE_LANGS = {
  en: { label: 'English',  flag: '🇬🇧', speech: 'en-IN', tts: 'en-IN' },
  ta: { label: 'தமிழ்',    flag: '🇮🇳', speech: 'ta-IN', tts: 'ta-IN' },
  hi: { label: 'हिन्दी',   flag: '🇮🇳', speech: 'hi-IN', tts: 'hi-IN' },
};

// Current language is persisted in STATE.settings.lang (defaults to 'en').
function getLang() {
  try { return (STATE && STATE.settings && STATE.settings.lang) || 'en'; }
  catch { return 'en'; }
}

// ---- UI string dictionary ----------------------------------
// Keyed by the ENGLISH source string so existing markup can be
// translated in place without touching every template.
const I18N = {
  // Sidebar nav + group labels
  'Overview':        { ta: 'மேலோட்டம்',      hi: 'अवलोकन' },
  'Dashboard':       { ta: 'டாஷ்போர்டு',     hi: 'डैशबोर्ड' },
  'Finance':         { ta: 'நிதி',           hi: 'वित्त' },
  'All Assets':      { ta: 'அனைத்து சொத்துகள்', hi: 'सभी संपत्तियाँ' },
  'Budget':          { ta: 'பட்ஜெட்',         hi: 'बजट' },
  'Bank Tracker':    { ta: 'வங்கி டிராக்கர்',  hi: 'बैंक ट्रैकर' },
  'Life':            { ta: 'வாழ்க்கை',        hi: 'जीवन' },
  'Health Hub':      { ta: 'சுகாதார மையம்',   hi: 'स्वास्थ्य हब' },
  'Habits':          { ta: 'பழக்கங்கள்',      hi: 'आदतें' },
  'Goals':           { ta: 'இலக்குகள்',       hi: 'लक्ष्य' },
  'Journal':         { ta: 'நாட்குறிப்பு',    hi: 'जर्नल' },
  'Categories':      { ta: 'வகைகள்',          hi: 'श्रेणियाँ' },
  'Growth':          { ta: 'வளர்ச்சி',        hi: 'विकास' },
  'Achievements':    { ta: 'சாதனைகள்',        hi: 'उपलब्धियाँ' },
  'Analytics':       { ta: 'பகுப்பாய்வு',     hi: 'विश्लेषण' },
  'AI Coach':        { ta: 'AI பயிற்சியாளர்', hi: 'AI कोच' },
  'Settings':        { ta: 'அமைப்புகள்',      hi: 'सेटिंग्स' },
  'Help & Support':  { ta: 'உதவி & ஆதரவு',   hi: 'सहायता और समर्थन' },
  'Sign Out':        { ta: 'வெளியேறு',        hi: 'साइन आउट' },
  // Voice feedback strings
  'voice_listening':   { en: 'Listening…',                ta: 'கேட்கிறேன்…',                 hi: 'सुन रहा हूँ…' },
  'voice_not_supported': { en: 'Voice control is not supported in this browser.', ta: 'இந்த உலாவியில் குரல் கட்டுப்பாடு ஆதரிக்கப்படவில்லை.', hi: 'इस ब्राउज़र में वॉयस कंट्रोल समर्थित नहीं है।' },
  'voice_no_match':    { en: "Sorry, I didn't understand that.", ta: 'மன்னிக்கவும், எனக்குப் புரியவில்லை.', hi: 'क्षमा करें, मैं समझ नहीं पाया।' },
  'voice_lang_set':    { en: 'Language changed',          ta: 'மொழி மாற்றப்பட்டது',         hi: 'भाषा बदल गई' },
};

// Translate a single English source string into the active language.
function t(en) {
  const lang = getLang();
  if (lang === 'en') {
    // Some keys (voice_*) have an English entry too
    if (I18N[en] && I18N[en].en) return I18N[en].en;
    return en;
  }
  const entry = I18N[en];
  if (entry && entry[lang]) return entry[lang];
  return en; // graceful fallback to English
}

// Walk the sidebar (and any [data-i18n] nodes) and translate text in place.
// Original English text is stashed in dataset.en so switching back works.
function applyTranslations() {
  document.querySelectorAll('.nav-text, .nav-group-label').forEach(el => {
    if (!el.dataset.en) el.dataset.en = el.textContent.trim();
    el.textContent = t(el.dataset.en);
  });
  document.querySelectorAll('[data-i18n]').forEach(el => {
    if (!el.dataset.en) el.dataset.en = el.getAttribute('data-i18n');
    el.textContent = t(el.dataset.en);
  });
  // Reflect on <html lang="">
  document.documentElement.lang = getLang();
  // Refresh language pill if present
  const pill = document.getElementById('voice-lang-pill');
  if (pill) pill.textContent = VOICE_LANGS[getLang()].flag;
}

function setLanguage(lang) {
  if (!VOICE_LANGS[lang]) return;
  STATE.settings = STATE.settings || {};
  STATE.settings.lang = lang;
  if (typeof saveState === 'function') saveState();
  applyTranslations();
  if (typeof toast === 'function') toast(`${VOICE_LANGS[lang].flag} ${t('voice_lang_set')}: ${VOICE_LANGS[lang].label}`, 'success');
}

// Cycle language from the floating pill (en → ta → hi → en)
function cycleLanguage() {
  const order = ['en', 'ta', 'hi'];
  const next = order[(order.indexOf(getLang()) + 1) % order.length];
  setLanguage(next);
}

// ============================================================
//  VOICE COMMAND ENGINE
// ============================================================

// Each command: list of keyword triggers (across all 3 languages,
// native script + common transliterations) and an action to run.
// Matching is substring-based and case-insensitive, so natural
// phrases like "go to finance" or "நிதி காட்டு" both work.
const VOICE_COMMANDS = [
  // ----- Navigation -----
  { keys: ['dashboard', 'home', 'டாஷ்போர்டு', 'முகப்பு', 'डैशबोर्ड', 'होम'], run: () => navigate('dashboard'), say: 'Dashboard' },
  { keys: ['finance', 'transaction', 'money', 'நிதி', 'பணம்', 'वित्त', 'पैसा', 'लेनदेन'], run: () => navigate('finance'), say: 'Finance' },
  { keys: ['asset', 'investment', 'சொத்து', 'முதலீடு', 'संपत्ति', 'निवेश'], run: () => navigate('investments'), say: 'Assets' },
  { keys: ['budget', 'பட்ஜெட்', 'बजट'], run: () => navigate('budget'), say: 'Budget' },
  { keys: ['bank', 'வங்கி', 'बैंक'], run: () => navigate('bank-tracker'), say: 'Bank Tracker' },
  { keys: ['health', 'சுகாதார', 'உடல்நலம்', 'स्वास्थ्य', 'सेहत'], run: () => navigate('health'), say: 'Health Hub' },
  { keys: ['habit', 'பழக்க', 'आदत'], run: () => navigate('habits'), say: 'Habits' },
  { keys: ['goal', 'இலக்கு', 'लक्ष्य'], run: () => navigate('goals'), say: 'Goals' },
  { keys: ['journal', 'diary', 'நாட்குறிப்பு', 'जर्नल', 'डायरी'], run: () => navigate('journal'), say: 'Journal' },
  { keys: ['category', 'categories', 'வகை', 'श्रेणी'], run: () => navigate('categories'), say: 'Categories' },
  { keys: ['achievement', 'சாதனை', 'उपलब्धि'], run: () => navigate('achievements'), say: 'Achievements' },
  { keys: ['analytic', 'report', 'பகுப்பாய்வு', 'அறிக்கை', 'विश्लेषण', 'रिपोर्ट'], run: () => navigate('analytics'), say: 'Analytics' },
  { keys: ['coach', 'assistant', 'பயிற்சி', 'कोच', 'सहायक'], run: () => navigate('ai-coach'), say: 'AI Coach' },
  { keys: ['setting', 'அமைப்பு', 'सेटिंग'], run: () => navigate('settings'), say: 'Settings' },
  { keys: ['help', 'support', 'உதவி', 'सहायता', 'मदद'], run: () => navigate('help'), say: 'Help' },

  // ----- Quick actions -----
  { keys: ['add income', 'log income', 'வருமானம்', 'आय', 'इनकम'],
    run: () => { navigate('finance'); setTimeout(() => openAddTxModal('income'), 150); }, say: 'Add income' },
  { keys: ['add expense', 'add spending', 'log expense', 'செலவு', 'खर्च', 'व्यय'],
    run: () => { navigate('finance'); setTimeout(() => openAddTxModal('expense'), 150); }, say: 'Add expense' },
  { keys: ['add habit', 'new habit', 'புதிய பழக்கம்', 'नई आदत'],
    run: () => { navigate('habits'); setTimeout(() => { if (typeof openAddHabitModal === 'function') openAddHabitModal(); }, 150); }, say: 'Add habit' },
  { keys: ['add goal', 'new goal', 'புதிய இலக்கு', 'नया लक्ष्य'],
    run: () => { navigate('goals'); setTimeout(() => { if (typeof openAddGoalModal === 'function') openAddGoalModal(); }, 150); }, say: 'Add goal' },
  { keys: ['write journal', 'new entry', 'நாட்குறிப்பு எழுது', 'जर्नल लिखो'],
    run: () => { navigate('journal'); setTimeout(() => { if (typeof openAddJournalModal === 'function') openAddJournalModal(); }, 150); }, say: 'Journal entry' },
  { keys: ['calculator', 'calculate', 'கணிப்பான்', 'கால்குலேட்டர்', 'कैलकुलेटर'],
    run: () => { if (typeof toggleCalculator === 'function') toggleCalculator(); }, say: 'Calculator' },

  // ----- App control -----
  { keys: ['light mode', 'dark mode', 'theme', 'வண்ண', 'தீம்', 'थीम', 'मोड'],
    run: () => { if (typeof toggleTheme === 'function') toggleTheme(); }, say: 'Theme toggled' },
  { keys: ['sync', 'refresh', 'ஒத்திசை', 'सिंक', 'रिफ्रेश'],
    run: () => { if (typeof pullFromCloud === 'function') pullFromCloud(); }, say: 'Syncing' },
  { keys: ['logout', 'sign out', 'வெளியேறு', 'लॉग आउट', 'साइन आउट'],
    run: () => { if (typeof handleLogout === 'function') handleLogout(); }, say: 'Signing out' },

  // ----- Language switching by voice -----
  { keys: ['english', 'ஆங்கிலம்', 'अंग्रेज़ी', 'इंग्लिश'], run: () => setLanguage('en'), say: 'English' },
  { keys: ['tamil', 'தமிழ்', 'तमिल'], run: () => setLanguage('ta'), say: 'தமிழ்' },
  { keys: ['hindi', 'हिंदी', 'हिन्दी', 'இந்தி'], run: () => setLanguage('hi'), say: 'हिन्दी' },
];

let _recognition = null;
let _listening = false;

function _speak(text) {
  try {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = VOICE_LANGS[getLang()].tts;
    u.rate = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

function _setMicState(active) {
  _listening = active;
  const btn = document.getElementById('voice-mic-btn');
  if (btn) {
    btn.classList.toggle('voice-listening', active);
    btn.title = active ? t('voice_listening') : 'Voice command';
  }
}

// Parse a recognized phrase and run the first matching command.
function handleVoiceTranscript(raw) {
  const text = (raw || '').toLowerCase().trim();
  if (!text) return;
  for (const cmd of VOICE_COMMANDS) {
    if (cmd.keys.some(k => text.includes(k.toLowerCase()))) {
      cmd.run();
      _speak(cmd.say);
      if (typeof toast === 'function') toast(`🎙️ ${cmd.say}`, 'success');
      return;
    }
  }
  if (typeof toast === 'function') toast(`🎙️ "${raw}" — ${t('voice_no_match')}`, 'warning');
  _speak(t('voice_no_match'));
}

function startVoiceControl() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    if (typeof toast === 'function') toast(t('voice_not_supported'), 'error');
    return;
  }
  if (_listening) { stopVoiceControl(); return; }

  _recognition = new SR();
  _recognition.lang = VOICE_LANGS[getLang()].speech;
  _recognition.interimResults = false;
  _recognition.maxAlternatives = 3;
  _recognition.continuous = false;

  _recognition.onstart = () => { _setMicState(true); if (typeof toast === 'function') toast(`🎙️ ${t('voice_listening')}`, 'info'); };
  _recognition.onerror = (e) => { _setMicState(false); if (e.error === 'not-allowed') toast('🎙️ Microphone permission denied', 'error'); };
  _recognition.onend = () => _setMicState(false);
  _recognition.onresult = (e) => {
    // Try every alternative across the single result for best match
    const results = e.results[0];
    let handled = false;
    for (let i = 0; i < results.length && !handled; i++) {
      const phrase = results[i].transcript;
      const before = _listening;
      handleVoiceTranscript(phrase);
      handled = true; // handleVoiceTranscript always resolves (match or no-match)
    }
  };

  try { _recognition.start(); }
  catch { _setMicState(false); }
}

function stopVoiceControl() {
  if (_recognition) { try { _recognition.stop(); } catch {} }
  _setMicState(false);
}

function toggleVoiceControl() {
  if (_listening) stopVoiceControl();
  else startVoiceControl();
}

// ============================================================
//  INIT — inject mic + language pill, apply saved language
// ============================================================
function initVoiceControl() {
  applyTranslations();

  const dock = document.getElementById('float-dock');
  if (dock && !document.getElementById('voice-mic-btn')) {
    // Language pill (cycles en → ta → hi)
    const pill = document.createElement('button');
    pill.id = 'voice-lang-pill';
    pill.className = 'float-dock-btn dock-btn';
    pill.title = 'Change language (English / தமிழ் / हिन्दी)';
    pill.style.fontSize = '18px';
    pill.textContent = VOICE_LANGS[getLang()].flag;
    pill.onclick = cycleLanguage;

    // Mic button
    const mic = document.createElement('button');
    mic.id = 'voice-mic-btn';
    mic.className = 'float-dock-btn dock-btn';
    mic.title = 'Voice command';
    mic.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
    mic.onclick = toggleVoiceControl;

    dock.appendChild(pill);
    dock.appendChild(mic);
  }
}

// Re-apply translations whenever a page is (re)rendered so dynamically
// injected [data-i18n] nodes stay localized.
document.addEventListener('DOMContentLoaded', () => {
  // Defer until STATE + sidebar exist; showApp() also calls initVoiceControl().
  setTimeout(() => { if (typeof STATE !== 'undefined' && STATE && STATE.user) initVoiceControl(); }, 400);
});
