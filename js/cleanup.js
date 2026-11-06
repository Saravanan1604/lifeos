// ============================================================
//  cleanup.js — build 698: simplify the app (items 1–14 of the
//  feature clean-up). App only — desktop web keeps its full menu.
//  Nothing is deleted: hidden features keep their data.
// ============================================================
(function () {
  if (!window.__IS_APP) return;

  // ── Side menu (More): 22 → 12 items ───────────────────────
  const I = (ic) => `<span class="nav-icon"><i data-lucide="${ic}"></i></span>`;
  const item = (page, ic, label, on) => `<button class="nav-item" data-page="${page}" onclick="${on || `navigate('${page}')`}">${I(ic)}<span class="nav-text">${label}</span></button>`;
  const MENU = `
    <div class="nav-group">
      ${item('search', 'search', 'Search', "if(typeof closeMobileDrawer==='function')closeMobileDrawer();openGlobalSearch()")}
    </div>
    <div class="nav-group">
      <p class="nav-group-label">Money</p>
      ${item('finance', 'landmark', 'Banks &amp; Cards')}
      ${item('upcoming', 'calendar-clock', 'Bills &amp; Due')}
      ${item('yearly', 'file-bar-chart-2', 'Reports')}
      ${item('tags', 'hash', 'Tags')}
      ${item('purchases', 'shopping-bag', 'Purchases')}
      ${item('split', 'users', 'Split')}
      ${item('goals', 'piggy-bank', 'Savings Goals')}
      ${item('categories', 'shapes', 'Categories')}
    </div>
    <div class="nav-group">
      <p class="nav-group-label">More</p>
      ${item('notes', 'sticky-note', 'Notes')}
      ${item('settings', 'settings', 'Settings')}
      ${item('help', 'life-buoy', 'How to use · Help')}
    </div>`;
  function buildMenu() {
    const nav = document.querySelector('#sidebar .sidebar-nav');
    if (nav && !nav.dataset.clean) { nav.innerHTML = MENU; nav.dataset.clean = '1'; }
    if (typeof _lucideRefresh === 'function') _lucideRefresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildMenu); else buildMenu();
  if (typeof openMobileDrawer === 'function') {
    const o = openMobileDrawer;
    window.openMobileDrawer = function () { buildMenu(); return o.apply(this, arguments); };
  }

  // ── Dashboard is no longer a page of its own: only opened as
  //    "Deep dive" from Analytics. Anything else lands on Home. ─
  let _dxAllow = false;
  window.openDeepDive = function (tab) {
    _dxAllow = true;
    if (typeof _dashActiveTab !== 'undefined') { try { _dashActiveTab = tab || 2; } catch (_) {} }
    navigate('dashboard');
  };
  const nav0 = navigate;
  window.navigate = function (page, skip) {
    if (page === 'dashboard' && !_dxAllow && (typeof currentPage === 'undefined' || currentPage !== 'dashboard')) page = 'transactions';
    if (page !== 'dashboard') _dxAllow = false;
    return nav0.call(this, page, skip);
  };
  if (typeof renderDashboard === 'function') {
    const rd = renderDashboard;
    window.renderDashboard = function () {
      const r = rd.apply(this, arguments);
      const c = document.getElementById('page-container');
      if (c && !c.querySelector('.dx-head')) {
        c.insertAdjacentHTML('afterbegin', `<div class="pk-head dx-head"><button class="pk-back" onclick="navigate('insights')" aria-label="Back"><i data-lucide="arrow-left"></i></button><div class="pk-ht"><h1>Deep dive</h1><p>Heatmap, money flow, wealth and health</p></div></div>`);
        if (typeof _lucideRefresh === 'function') _lucideRefresh();
      }
      return r;
    };
  }
  if (typeof renderAnalyticsApp === 'function') {
    const ra = renderAnalyticsApp;
    window.renderAnalyticsApp = function () {
      const r = ra.apply(this, arguments);
      const sm = document.querySelector('#page-container .an-smart');
      const tiles = [[1, 'calendar-days', 'Heatmap'], [2, 'arrow-left-right', 'Money flow'], [3, 'landmark', 'Wealth flow'], [4, 'activity', 'Health'], [5, 'layers', '7 income']];
      const html = `<div class="an-deep"><p>Deep dive</p><div>${tiles.map(([t, ic, l]) => `<button onclick="openDeepDive(${t})"><span><i data-lucide="${ic}"></i></span>${l}</button>`).join('')}</div></div>`;
      if (sm) sm.insertAdjacentHTML('afterend', html);
      const b = sm && sm.querySelector('b'); if (b) b.textContent = 'Forecast & subscriptions';
      if (typeof _lucideRefresh === 'function') _lucideRefresh();
      return r;
    };
  }

  // ── Bills & Due: Upcoming · Recurring · Renewals as one page ─
  const DUE = [['upcoming', 'Upcoming'], ['recurring', 'Recurring'], ['renewals', 'Renewals']];
  function dueTabs(active) {
    const c = document.getElementById('page-container'); if (!c || c.querySelector('.due-tabs')) return;
    const html = `<div class="due-wrap"><h1 class="due-h">Bills &amp; Due</h1><div class="due-tabs">${DUE.map(([k, l]) => `<button class="${k === active ? 'on' : ''}" onclick="navigate('${k}', true)">${l}</button>`).join('')}</div></div>`;
    const host = c.querySelector('.pk') || c.firstElementChild || c;
    host.insertAdjacentHTML('afterbegin', html);
    // the page's own big title is replaced by the shared one
    const own = c.querySelector('.pk-head .pk-ht h1, .page-header .page-title, .up-title');
    if (own) own.closest('.pk-head, .page-header') ? own.closest('.pk-head, .page-header').classList.add('due-sub') : null;
  }
  [['renderUpcoming', 'upcoming'], ['renderRecurring', 'recurring'], ['renderRenewals', 'renewals']].forEach(([fn, key]) => {
    const f = window[fn]; if (typeof f !== 'function') return;
    window[fn] = function () { const r = f.apply(this, arguments); try { dueTabs(key); } catch (_) {} return r; };
  });

  // ── Savings Goals (rename) ──────────────────────────────────
  if (typeof renderGoals === 'function') {
    const rg = renderGoals;
    window.renderGoals = function () {
      const r = rg.apply(this, arguments);
      const t = document.querySelector('#page-container .page-title'); if (t) t.innerHTML = '<i data-lucide="piggy-bank"></i> Savings Goals';
      const s = document.querySelector('#page-container .page-subtitle'); if (s) s.textContent = 'Save towards the things you want — a bike, a trip, an emergency fund';
      if (typeof _lucideRefresh === 'function') _lucideRefresh();
      return r;
    };
  }

  // ── No XP / level-up pop-ups (the logging streak replaces them) ─
  if (typeof toast === 'function') {
    const t0 = toast;
    window.toast = function (msg, type) {
      if (typeof msg === 'string') {
        if (/Level Up|^\+\d+ XP|Achievement Unlocked/.test(msg)) return;
        msg = msg.replace(/\s*[·!]?\s*\+\d+\s*XP\b\s*/g, ' ').replace(/\s+([!.])/g, '$1').trim();
        if (!msg) return;
      }
      return _newToast(msg, type);
    };
  }

  // ── New toast (build 706): slim card, coloured icon, timer line, max 2 on screen ─
  const TI = {
    success: '<path d="M20 6 9 17l-5-5"/>',
    error: '<path d="M18 6 6 18M6 6l12 12"/>',
    warning: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  };
  function _newToast(msg, type) {
    type = TI[type] ? type : 'info';
    let c = document.getElementById('nt-wrap');
    if (!c) { c = document.createElement('div'); c.id = 'nt-wrap'; document.body.appendChild(c); }
    const clean = String(msg).replace(/^[\s\u2600-\u27BF\uFE0F\u200D]+|^(?:\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDC00-\uDFFF])+\s*/g, '').replace(/\s*(?:[\u2600-\u27BF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDC00-\uDFFF])\uFE0F?$/, '').trim() || String(msg);
    const t = document.createElement('div');
    t.className = 'nt nt-' + type;
    t.innerHTML = `<span class="nt-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${TI[type]}</svg></span><span class="nt-tx"></span><i class="nt-bar"></i>`;
    t.querySelector('.nt-tx').innerHTML = clean;
    const kill = () => { if (!t.isConnected) return; t.classList.add('out'); setTimeout(() => t.remove(), 260); };
    t.onclick = kill;
    c.appendChild(t);
    while (c.children.length > 2) c.firstElementChild.remove();
    setTimeout(kill, type === 'error' ? 4200 : 2800);
  }
  window._newToast = _newToast;

  // ── Floating selection bar lives on <body> (page container is transformed) ─
  function liftSelBar() {
    const sb = document.querySelector('#page-container .sb2');
    const selOn = typeof _recSelectMode !== 'undefined' && _recSelectMode && document.querySelector('#page-container .mymoney-records');
    if (sb || !selOn) document.querySelectorAll('body > .sb2').forEach(e => e.remove());
    if (sb) { document.body.appendChild(sb); if (typeof _lucideRefresh === 'function') _lucideRefresh(); }
  }
  const _pcWatch = () => { const pc = document.getElementById('page-container'); if (pc) new MutationObserver(liftSelBar).observe(pc, { childList: true, subtree: true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _pcWatch); else _pcWatch();

  // ── Moving background off (battery) ─────────────────────────
  try {
    if (typeof _bgMode !== 'undefined') _bgMode = 'none';
    if (typeof _bgRAF !== 'undefined' && _bgRAF) { cancelAnimationFrame(_bgRAF); _bgRAF = null; }
    const cv = document.getElementById('bg-canvas'); if (cv) cv.style.display = 'none';
  } catch (_) {}
})();
