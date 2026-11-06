// ============================================================
//  settings2.js — build 693: app Settings redesign
//  Profile card + grouped rows (Appearance, Security, Data, Help,
//  About). Web keeps the original renderSettings layout.
// ============================================================
function _stEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

function _stRow(o) {
  // o: { ic, tone, t, s, on, right, danger, href }
  const tag = o.href ? 'a' : 'button';
  const act = o.href ? `href="${o.href}" target="_blank" rel="noopener"` : `type="button" onclick="${o.on || ''}"`;
  return `<${tag} class="st-row ${o.danger ? 'danger' : ''}" ${act}>
    <span class="st-ic t-${o.tone || 'pri'}"><i data-lucide="${o.ic}"></i></span>
    <span class="st-tx"><b>${o.t}</b>${o.s ? `<small>${o.s}</small>` : ''}</span>
    ${o.right != null ? o.right : '<i data-lucide="chevron-right" class="st-chev"></i>'}
  </${tag}>`;
}
function _stGroup(title, rows) { return `<p class="st-gh">${title}</p><div class="st-group">${rows.join('')}</div>`; }

let _stEditOpen = false;
function stToggleEdit() { _stEditOpen = !_stEditOpen; navigate('settings', true); }
function stSaveProfile() {
  if (typeof saveSettings === 'function') saveSettings();
  _stEditOpen = false; navigate('settings', true);
}

const APP_SIZES = [['compact', 'Compact', 450], ['default', 'Default', 412], ['large', 'Large', 372], ['xl', 'Extra large', 340]];
function getAppSize() { try { return localStorage.getItem('lifeos_app_size') || 'default'; } catch (_) { return 'default'; } }
function setAppSize(level) {
  const hit = APP_SIZES.find(x => x[0] === level); if (!hit) return;
  try { localStorage.setItem('lifeos_app_size', level); } catch (_) {}
  STATE.settings = STATE.settings || {}; STATE.settings.appSize = level; if (typeof saveState === 'function') saveState();
  const vp = document.querySelector('meta[name="viewport"]');
  if (vp) vp.setAttribute('content', 'width=' + hit[2] + ', viewport-fit=cover');
  if (typeof toast === 'function') toast('App size: ' + hit[1], 'success');
  setTimeout(() => navigate('settings', true), 60);
}

function renderSettingsApp() {
  const S = STATE.settings || {}, U = STATE.user || {};
  const name = S.name || U.name || 'You';
  const ini = name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const tx = (STATE.transactions || []).length;
  const ach = (STATE.unlockedAchievements || []).length, achT = (typeof ACHIEVEMENTS_DEF !== 'undefined' ? ACHIEVEMENTS_DEF.length : 0);
  const joined = U.joinDate ? new Date(U.joinDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—';
  const cur = S.currency || '₹';
  const theme = S.theme || 'auto', nf = S.numFont || 'default', bg = S.bgAnim || 'network';
  const lockOn = typeof appLockEnabled === 'function' && appLockEnabled();
  const lockKind = lockOn ? ((typeof lockType === 'function' && lockType() === 'bio') ? 'Fingerprint / face' : 'PIN') : '';
  const lang = typeof getLang === 'function' ? getLang() : 'en';
  const langs = typeof VOICE_LANGS !== 'undefined' ? VOICE_LANGS : { en: { flag: '🇬🇧', label: 'English' } };

  const themes = [
    { m: 'light', l: 'Day', bg: '#F5F6FC', c: '#fff', a: '#6D3BEA' },
    { m: 'dark', l: 'Night', bg: '#090D18', c: '#1C2940', a: '#8B5CF6' },
    { m: 'auto', l: 'System', bg: 'linear-gradient(120deg,#F5F6FC 0 50%,#090D18 50%)', c: 'rgba(128,128,128,.55)', a: '#8B5CF6' },
    { m: 'amoled', l: 'AMOLED', bg: '#000', c: '#141414', a: '#8B5CF6' },
    { m: 'ocean', l: 'Ocean', bg: '#07172a', c: '#0e2a44', a: '#22D3EE' },
  ];

  const profile = `
    <div class="st-hero">
      <div class="st-hero-top">
        <span class="st-av">${_stEsc(ini)}</span>
        <div class="st-who"><b>${_stEsc(name)}</b><small>${_stEsc(U.email || 'Not signed in')}</small></div>
        <button class="st-edit" onclick="stToggleEdit()">${_stEditOpen ? 'Close' : 'Edit'}</button>
      </div>
      ${_stEditOpen ? `<div class="st-form">
        <label>Display name<input id="s-name" type="text" value="${_stEsc(S.name || '')}" placeholder="Your name"/></label>
        <label>Currency<select id="s-currency">${[['₹', 'Indian Rupee'], ['$', 'US Dollar'], ['€', 'Euro'], ['£', 'British Pound']].map(([v, l]) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${v} ${l}</option>`).join('')}</select></label>
        <button class="st-save" onclick="stSaveProfile()">Save profile</button>
      </div>` : ''}
      <div class="st-stats">
        <div><b>${tx.toLocaleString('en-IN')}</b><small>Entries</small></div>
        <div><b>🔥 ${typeof logStreak === 'function' ? logStreak().n : 0}</b><small>Day streak</small></div>
        <div><b>${(STATE.goals || []).length}</b><small>Savings goals</small></div>
        <div><b>${joined}</b><small>Member since</small></div>
      </div>
    </div>`;

  const appearance = `<p class="st-gh">Appearance</p><div class="st-group st-pad">
    <p class="st-lbl">Theme</p>
    <div class="st-themes">${themes.map(t => `<button class="st-th ${theme === t.m ? 'on' : ''}" onclick="setTheme('${t.m}')">
      <span class="st-th-p" style="background:${t.bg}"><i style="background:${t.c}"><em style="background:${t.a}"></em></i></span><small>${t.l}</small></button>`).join('')}</div>
    <p class="st-note">System follows your phone's light / dark setting.</p>
    ${document.documentElement.classList.contains('is-desk') ? '' : `<p class="st-lbl">App size</p>
    <div class="st-seg four">${APP_SIZES.map(([k, l], i) => `<button class="${getAppSize() === k ? 'on' : ''}" onclick="setAppSize('${k}')"><b style="font-size:${14 + i * 3}px">Aa</b><small>${l}</small></button>`).join('')}</div>
    <p class="st-note">Text or buttons look too small or too big on this phone? Pick a size — it applies everywhere in the app.</p>`}
    <p class="st-lbl">Number style</p>
    <div class="st-seg">
      <button class="${nf === 'default' ? 'on' : ''}" onclick="setNumFont('default')"><b>${cur}84,250</b><small>Classic</small></button>
      <button class="${nf === 'grotesk' ? 'on' : ''}" onclick="setNumFont('grotesk')"><b style="font-family:'Space Grotesk','Inter',sans-serif">${cur}84,250</b><small>Futuristic</small></button>
    </div>
  </div>`;

  const general = _stGroup('General', [
    `<label class="st-row"><span class="st-ic t-acc"><i data-lucide="languages"></i></span><span class="st-tx"><b>Language</b><small>Also used for voice commands</small></span>
      <select class="st-sel" onchange="setLanguage(this.value)">${Object.keys(langs).map(c => `<option value="${c}" ${lang === c ? 'selected' : ''}>${langs[c].flag} ${langs[c].label}</option>`).join('')}</select></label>`,
    _stRow({ ic: 'bell-ring', tone: 'warn', t: 'Smart alerts', s: 'Budget, bills, unusual spends', on: "navigate('smart')" }),
    (() => { const n = typeof Money !== 'undefined' ? Money.mismatches().reduce((a, g) => a + g.ids.length, 0) : 0;
      return _stRow({ ic: 'shield-check', tone: n ? 'exp' : 'inc', t: 'Check my entries', s: n ? `${n} entries have the wrong type — tap to fix` : 'Finds income saved as expense and the reverse', right: n ? `<span class="st-pill">${n}</span>` : null, on: 'openDataCheck()' }); })(),
  ]);

  const security = _stGroup('Security', lockOn ? [
    _stRow({ ic: 'shield-check', tone: 'inc', t: 'App lock is on', s: lockKind, right: '<span class="st-pill on">ON</span>', on: '' }),
    _stRow({ ic: 'fingerprint', tone: 'pri', t: 'Use fingerprint / face', on: 'enableBiometricLock()' }),
    _stRow({ ic: 'key-round', tone: 'pri', t: 'Change PIN', on: 'setupAppLock()' }),
    _stRow({ ic: 'lock-open', tone: 'exp', t: 'Turn off app lock', on: 'disableAppLock()', danger: true }),
  ] : [
    _stRow({ ic: 'fingerprint', tone: 'pri', t: 'Lock with fingerprint / face', s: 'Ask every time atworth opens', right: '<span class="st-pill">OFF</span>', on: 'enableBiometricLock()' }),
    _stRow({ ic: 'key-round', tone: 'mute', t: 'Use a PIN instead', on: 'setupAppLock()' }),
  ]);

  const data = _stGroup('Backup &amp; data', [
    _stRow({ ic: 'cloud-upload', tone: 'acc', t: 'Back up to Google Drive', s: 'Save a copy of all your data', on: 'backupToDrive()' }),
    _stRow({ ic: 'download', tone: 'pri', t: 'Export backup (JSON)', s: 'Download everything to this phone', on: 'exportData()' }),
    _stRow({ ic: 'upload', tone: 'pri', t: 'Restore from backup', s: 'Import a JSON backup file', on: "document.getElementById('import-file').click()" }),
    _stRow({ ic: 'sheet', tone: 'inc', t: 'Export transactions (CSV)', s: 'Open in Excel / Google Sheets', on: 'exportCSV()' }),
  ]) + '<input type="file" id="import-file" accept=".json" style="display:none" onchange="importData(event)"/>';

  const demoOn = typeof isDemoMode === 'function' && isDemoMode();
  const help = _stGroup('Help', [
    _stRow({ ic: 'flask-conical', tone: 'warn', t: 'Demo mode', s: demoOn ? 'On — showing sample data. Tap to go back to your data' : 'Try the app with sample data. Your real data stays safe', right: `<span class="st-pill ${demoOn ? 'on' : ''}">${demoOn ? 'ON' : 'OFF'}</span>`, on: 'toggleDemoMode()' }),
    _stRow({ ic: 'book-open', tone: 'pri', t: 'How to use atworth', s: 'Guide, checklist and FAQ', on: "navigate('help')" }),
    _stRow({ ic: 'route', tone: 'acc', t: 'Replay the tour', s: '1-minute walk-through of the main buttons', on: 'startAppTour(true)' }),
    document.documentElement.classList.contains('is-desk')
      ? _stRow({ ic: 'layout-template', tone: 'mute', t: 'Classic web layout', s: 'Switch this computer back to the old desktop pages', on: "if(confirm('Switch to the classic desktop layout? You can come back from Settings any time.'))setWebLayout('classic')" })
      : _stRow({ ic: 'monitor', tone: 'mute', t: 'Open web version', s: 'Same account on a bigger screen', on: "window.open('https://lifeos-psi-roan.vercel.app','_blank')" }),
  ]);

  const legal = _stGroup('About', [
    _stRow({ ic: 'shield', tone: 'mute', t: 'Privacy policy', href: '/privacy.html' }),
    _stRow({ ic: 'file-text', tone: 'mute', t: 'Terms of service', href: '/terms.html' }),
    _stRow({ ic: 'refresh-cw', tone: 'mute', t: 'Check for updates', s: `Version ${APP_VERSION} · build ${APP_BUILD}`, on: 'updateAppForce()' }),
  ]);

  const danger = `<p class="st-gh danger">Danger zone</p><div class="st-group">
    ${_stRow({ ic: 'trash-2', tone: 'exp', t: 'Reset all data', s: 'Deletes everything permanently — cannot be undone', on: 'confirmReset()', danger: true })}</div>`;

  document.getElementById('page-container').innerHTML = `<div class="stx">
    <div class="st-head"><h1>Settings</h1><p>Make atworth yours</p></div>
    ${profile}${appearance}${general}${security}${data}${help}${legal}${danger}
    <p class="st-foot"><i data-lucide="zap"></i> atworth · v${APP_VERSION} (${APP_BUILD})</p>
  </div>`;
  if (window.lucide && lucide.createIcons) lucide.createIcons();
}
