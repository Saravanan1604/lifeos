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
        if (/Level Up|^\+\d+ XP/.test(msg)) return;
        msg = msg.replace(/\s*[·!]?\s*\+\d+\s*XP\b\s*/g, ' ').replace(/\s+([!.])/g, '$1').trim();
        if (!msg) return;
      }
      return t0.call(this, msg, type);
    };
  }

  // ── Moving background off (battery) ─────────────────────────
  try {
    if (typeof _bgMode !== 'undefined') _bgMode = 'none';
    if (typeof _bgRAF !== 'undefined' && _bgRAF) { cancelAnimationFrame(_bgRAF); _bgRAF = null; }
    const cv = document.getElementById('bg-canvas'); if (cv) cv.style.display = 'none';
  } catch (_) {}
})();
