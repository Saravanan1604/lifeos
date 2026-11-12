// ============================================================
//  syncstatus.js — build 723: Settings → Sync status
//  Says in plain words whether this device is syncing, and if not,
//  exactly which step fails: not signed in, demo mode, server
//  unreachable, login expired, server/database error, data too large.
// ============================================================
function _syAgo(t) { if (!t) return 'never'; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' days ago'; }
function syncMode() {
  if (typeof isDemoMode === 'function' && isDemoMode()) return 'demo';
  if (!STATE.user) return 'out';
  if (STATE.user.offline || !localStorage.getItem('lifeos_token')) return 'local';
  return 'on';
}
// Turn a failed step into a reason + what to do
function _syWhy(r) {
  if (!r) return null;
  const m = (r.msg || '').toLowerCase();
  if (r.ok) return null;
  if (r.code === 401 || r.code === 403) return ['Your login has expired', 'Sign out and sign in again. Your data stays on this device and is merged when you sign back in.', 'signin'];
  if (r.code === 413) return ['Your data is too large for the server', 'The server refuses uploads above its size limit. Open Storage and tidy logs or remove old receipt photos — or raise the limit on the server (express.json({ limit: "10mb" })).', 'storage'];
  if (r.code === 404) return ['The server address was not found', 'The backend on Render may have been deleted or renamed. Check that the service “lifeos-backend-mangodb” still exists on render.com.', ''];
  if (r.code >= 500) return [/mongo|econn|topology|server selection|timed out|buffering/.test(m) ? 'The server is running but cannot reach its database (MongoDB)' : 'The server reported an error (' + r.code + ')',
    'On MongoDB Atlas check: (1) the cluster is not paused, (2) Network Access allows 0.0.0.0/0, (3) the database user’s password matches MONGO_URI in Render → Environment. Then restart the Render service.' + (r.msg ? ' Server said: “' + r.msg.replace(/</g, '&lt;').slice(0, 140) + '”' : ''), ''];
  if (r.msg === 'timeout') return ['The server did not answer in 75 seconds', 'Render’s free plan puts the server to sleep; the first request can take a minute. Try again. If it keeps failing, open render.com and check the service is “Live”, not suspended or failed.', ''];
  return ['Could not reach the server', 'Check your internet. If the internet works, the backend on Render is down: open render.com → your service → check it is “Live” and look at its Logs.', ''];
}
function openSyncStatus(testing) {
  const mode = syncMode(), L = typeof SYNC_LOG !== 'undefined' ? SYNC_LOG : {}, bad = _syWhy(L.push) || _syWhy(L.pull);
  const lastOk = +(localStorage.getItem('lifeos_lastSyncOk') || 0), dirty = localStorage.getItem('lifeos_dirty') === '1';
  const size = (JSON.stringify({ state: STATE }).length / 1048576).toFixed(2);
  let tone = 'inc', head = 'Syncing', sub = `Last synced ${_syAgo(lastOk)}`;
  if (mode === 'demo') { tone = 'warn'; head = 'Demo mode is on'; sub = 'Sync is switched off while you look at sample data.'; }
  else if (mode !== 'on') { tone = 'exp'; head = 'Not signed in on this device'; sub = 'Data here is saved only on this device. It is not sent to the cloud and other devices can’t see it.'; }
  else if (bad) { tone = 'exp'; head = 'Sync is failing'; sub = bad[0]; }
  else if (dirty) { tone = 'warn'; head = 'Changes waiting to upload'; sub = `Last synced ${_syAgo(lastOk)}`; }
  const row = (l, v) => `<div><span>${l}</span><b>${v}</b></div>`;
  const step = (name, r) => row(name, !r ? 'not tried yet' : r.ok ? `OK · ${_syAgo(r.at)}` : `Failed${r.code ? ' (' + r.code + ')' : ''} · ${_syAgo(r.at)}`);
  openModal('Sync status', `<div class="sy">
    <div class="sy-top t-${tone}"><span><i data-lucide="${tone === 'inc' ? 'cloud-check' : tone === 'warn' ? 'cloud' : 'cloud-off'}"></i></span><div><b>${head}</b><small>${sub}</small></div></div>
    ${mode === 'on' && bad ? `<p class="sy-fix"><b>What to do:</b> ${bad[1]}</p>` : ''}
    <div class="sg-list">
      ${row('Account', mode === 'on' ? String(STATE.user.email || STATE.user.name || '').replace(/</g, '&lt;') : mode === 'demo' ? 'Demo' : 'Local only')}
      ${mode === 'on' ? step('Download from cloud', L.pull) + step('Upload to cloud', L.push) + row('Waiting to upload', dirty ? 'Yes' : 'No') : ''}
      ${row('Data size', size + ' MB')}
    </div>
    <div id="sy-test">${testing || ''}</div>
    ${mode === 'on' ? `<button class="sy-btn p" onclick="syncTestNow()"><i data-lucide="refresh-cw"></i>Test sync now</button>` : ''}
    ${mode === 'demo' ? `<button class="sy-btn p" onclick="closeModal();disableDemoMode()">Turn off Demo mode</button>` : ''}
    ${mode === 'local' || mode === 'out' || (bad && bad[2] === 'signin') ? `<button class="sy-btn p" onclick="closeModal();handleLogout()"><i data-lucide="log-in"></i>Sign in to sync</button><p class="sg-note">Signing in keeps the data on this device and merges it with your cloud account.</p>` : ''}
    ${bad && bad[2] === 'storage' ? `<button class="sy-btn" onclick="openStorage()">Open Storage</button>` : ''}
  </div>`);
  if (typeof _lucideRefresh === 'function') _lucideRefresh();
}
async function syncTestNow() {
  const box = document.getElementById('sy-test'), out = [];
  const say = (ok, t) => { out.push(`<p class="${ok === true ? 'ok' : ok === false ? 'no' : ''}">${ok === true ? '✓' : ok === false ? '✕' : '…'} ${t}</p>`); if (box) box.innerHTML = out.join(''); };
  const token = localStorage.getItem('lifeos_token');
  say(null, 'Contacting the server (can take up to a minute if it was asleep)…');
  let r, t0 = Date.now(), cloud = null;
  try { r = await _fetchCloud(token); } catch (e) { r = { status: 'net' }; }
  out.pop();
  if (r.status === 'ok') { cloud = r.state; say(true, `Server answered in ${((Date.now() - t0) / 1000).toFixed(1)} s and your login is valid`);
    say(true, `Cloud has ${(cloud.transactions || []).length.toLocaleString('en-IN')} transactions · this device has ${(STATE.transactions || []).length.toLocaleString('en-IN')}`); }
  else { const w = _syWhy(SYNC_LOG.pull) || ['Could not download', '']; say(false, w[0]); openSyncStatus(out.join('')); return; }
  say(null, 'Uploading this device’s data…');
  if (typeof _syncBusy !== 'undefined') _syncBusy = false;
  _lastPullOk = 0; _markDirty();
  await _pushToCloud();
  out.pop();
  const p = SYNC_LOG.push;
  if (p && p.ok && Date.now() - p.at < 90000) say(true, 'Upload worked — this device and the cloud now match');
  else say(false, (_syWhy(p) || ['Upload failed'])[0]);
  openSyncStatus(out.join(''));
  if (typeof navigate === 'function' && typeof currentPage !== 'undefined' && currentPage === 'settings') { /* keep popup */ }
}
