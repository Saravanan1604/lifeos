// ============================================================
//  secure.js — build 714: password-protected backups
//  Format: {"format":"atworth-enc-v1","kdf":"PBKDF2-SHA256","iter":250000,
//           "salt":b64,"iv":b64,"data":b64}  (AES-256-GCM)
//  Without the password the file can't be read. There is no recovery.
// ============================================================
const _sb64 = b => { let s = ''; const a = new Uint8Array(b); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); };
const _sub64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function _bkKey(pass, salt, iter) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function encryptBackup(obj, pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), iter = 250000;
  const key = await _bkKey(pass, salt, iter);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
  return { format: 'atworth-enc-v1', kdf: 'PBKDF2-SHA256', iter, salt: _sb64(salt), iv: _sb64(iv), data: _sb64(ct), created: new Date().toISOString() };
}
async function decryptBackup(env, pass) {
  const key = await _bkKey(pass, _sub64(env.salt), env.iter || 250000);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: _sub64(env.iv) }, key, _sub64(env.data));
  return JSON.parse(new TextDecoder().decode(pt));
}
function _bkFile(env) { return new File([JSON.stringify(env)], `atworth_Backup_${today()}_protected.json`, { type: 'application/json' }); }

// Choose plain or protected — used by Export and Back up to Drive
function openBackupChoice(dest) {
  openModal('Back up your data', `<div class="bk">
    <p class="bk-lead">${dest === 'gdrive' ? 'Upload a copy into the “atworth backups” folder in your Google Drive. Google will ask you to allow it the first time.' : dest === 'drive' ? 'Save a copy to Google Drive (or any app) using your phone’s share sheet.' : 'Download a copy of all your data to this device.'}</p>
    <div class="form-group"><label class="form-label">Password (recommended)</label>
      <input type="password" id="bk-p1" class="form-input" placeholder="At least 6 characters" autocomplete="new-password"/></div>
    <div class="form-group"><label class="form-label">Repeat password</label>
      <input type="password" id="bk-p2" class="form-input" placeholder="Type it again" autocomplete="new-password"/></div>
    <p class="bk-warn">Keep this password safe — without it the backup can't be opened, and nobody (not even us) can recover it.</p>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="doBackup('${dest}', false)">No password</button>
      <button class="btn-primary" onclick="doBackup('${dest}', true)">Protect & save</button>
    </div></div>`);
}
async function doBackup(dest, protect) {
  let payload = STATE, file;
  if (protect) {
    const p1 = (document.getElementById('bk-p1') || {}).value || '', p2 = (document.getElementById('bk-p2') || {}).value || '';
    if (p1.length < 6) { toast('Use at least 6 characters', 'error'); return; }
    if (p1 !== p2) { toast('The two passwords don\'t match', 'error'); return; }
    try { payload = await encryptBackup(STATE, p1); } catch (e) { toast('Could not encrypt on this device', 'error'); return; }
    file = _bkFile(payload);
  } else {
    file = new File([JSON.stringify(STATE, null, 2)], `atworth_Backup_${today()}.json`, { type: 'application/json' });
  }
  closeModal();
  if (dest === 'gdrive') {
    try { toast('Saving to Google Drive…', 'info'); await _driveUpload(file); _bkMark(); toast('Saved to Google Drive › atworth backups', 'success'); navigate(currentPage, true); return; }
    catch (e) { toast('Drive upload didn’t work — saving with the share sheet instead', 'warning'); dest = 'drive'; }
  }
  if (dest === 'drive') {
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'atworth backup' }); _bkMark(); return; } }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(file); const a = document.createElement('a'); a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url);
  _bkMark();
  toast(protect ? 'Protected backup saved' : 'Backup saved', 'success');
  if (typeof navigate === 'function' && typeof currentPage !== 'undefined') navigate(currentPage, true);
}
function _bkMark() { try { localStorage.setItem('lifeos_last_backup', String(Date.now())); } catch (_) {} }

// Restore: plain JSON as before; protected files ask for the password first
function _restoreState(imported) {
  if (!imported || typeof imported !== 'object' || Array.isArray(imported)) throw new Error('bad');
  STATE = Object.assign(DB.defaults(), imported);
  saveState(); if (typeof updateSidebar === 'function') updateSidebar(); navigate('transactions');
  toast('Backup restored', 'success');
}
function importData(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    let parsed; try { parsed = JSON.parse(e.target.result); } catch (_) { toast('This is not an atworth backup file', 'error'); return; }
    if (parsed && parsed.format === 'atworth-enc-v1') {
      window._pendingEnc = parsed;
      openModal('Protected backup', `<div class="bk"><p class="bk-lead">This backup is protected. Enter its password to restore it. Your current data will be replaced.</p>
        <div class="form-group"><label class="form-label">Password</label><input type="password" id="bk-in" class="form-input" autocomplete="current-password"/></div>
        <div class="modal-actions"><button class="btn-secondary" onclick="closeModal()">Cancel</button><button class="btn-primary" onclick="restoreProtected()">Restore</button></div></div>`);
      setTimeout(() => { const i = document.getElementById('bk-in'); if (i) i.focus(); }, 200);
      return;
    }
    try { _restoreState(parsed); } catch (_) { toast('This is not an atworth backup file', 'error'); }
  };
  reader.readAsText(file);
  event.target.value = '';
}
async function restoreProtected() {
  const pass = (document.getElementById('bk-in') || {}).value || '';
  try { const data = await decryptBackup(window._pendingEnc, pass); window._pendingEnc = null; closeModal(); _restoreState(data); }
  catch (_) { toast('Wrong password', 'error'); }
}
function exportData() { openBackupChoice('download'); }
function backupToDrive() { openBackupChoice(_canDriveApi() ? 'gdrive' : 'drive'); }

// ── Weekly backup (build 719) ───────────────────────────────
// Google requires a tap to approve Drive access (and blocks that screen
// inside app wrappers), so a silent background upload isn't possible.
// Instead: a weekly reminder card on Home; one tap backs up — straight into
// Drive on the website (Google Identity Services + Drive API, drive.file
// scope = only files atworth creates), share sheet on the phone app.
const _BK_CLIENT = '33547416778-vg3i2e2shoaiptoouhpo2ns0iojecok9.apps.googleusercontent.com';
function backupEvery() { try { return +(localStorage.getItem('lifeos_backup_every') || 7); } catch (_) { return 7; } }
function setBackupEvery(d) { try { localStorage.setItem('lifeos_backup_every', String(d)); } catch (_) {} toast(d ? `Backup reminder every ${d} days` : 'Backup reminder off', 'success'); navigate('settings', true); }
function backupDueDays() {
  const every = backupEvery(); if (!every) return -1;
  const last = +(localStorage.getItem('lifeos_last_backup') || 0);
  if (!last) return (STATE.transactions || []).length >= 20 ? 0 : -1;
  return Math.floor((Date.now() - last) / 864e5) - every;
}
function homeBackupHtml() {
  if (typeof isDemoMode === 'function' && isDemoMode()) return '';
  if (backupDueDays() < 0) return '';
  const last = +(localStorage.getItem('lifeos_last_backup') || 0);
  return `<div class="hx-card bk-due"><span><i data-lucide="cloud-upload"></i></span><div><b>Time for a backup</b><small>${last ? `Last one ${Math.floor((Date.now() - last) / 864e5)} days ago` : 'You have never saved a backup'} · keeps a copy if your phone is lost</small></div>
    <button onclick="openBackupChoice(_canDriveApi() ? 'gdrive' : 'drive')">Back up</button></div>`;
}
function _canDriveApi() { return !/LifeOSApp/.test(navigator.userAgent) && !window.Capacitor && !!(window.google && google.accounts && google.accounts.oauth2); }
function _driveToken() {
  return new Promise((res, rej) => {
    const tc = google.accounts.oauth2.initTokenClient({ client_id: _BK_CLIENT, scope: 'https://www.googleapis.com/auth/drive.file',
      callback: r => r && r.access_token ? res(r.access_token) : rej(new Error(r && r.error || 'not allowed')) });
    tc.requestAccessToken({ prompt: '' });
  });
}
async function _driveUpload(file) {
  const tok = await _driveToken(), H = { Authorization: 'Bearer ' + tok };
  const q = encodeURIComponent("name='atworth backups' and mimeType='application/vnd.google-apps.folder' and trashed=false");
  let folder = ((await (await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, { headers: H })).json()).files || [])[0];
  if (!folder) folder = await (await fetch('https://www.googleapis.com/drive/v3/files', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'atworth backups', mimeType: 'application/vnd.google-apps.folder' }) })).json();
  const fd = new FormData();
  fd.append('metadata', new Blob([JSON.stringify({ name: file.name, parents: [folder.id] })], { type: 'application/json' }));
  fd.append('file', file);
  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', headers: H, body: fd });
  if (!r.ok) throw new Error('upload ' + r.status);
}
