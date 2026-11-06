// ============================================================
//  desk.js — desktop web layout (build 706)
//  Full-height sidebar (with Home / Analytics / Assets and a
//  "New transaction" button), wide content area, Home as a
//  two-column dashboard, dialogs centred. Classic layout is still
//  available from Settings (localStorage lifeos_web_layout).
// ============================================================
function setWebLayout(mode) {
  try { localStorage.setItem('lifeos_web_layout', mode); } catch (_) {}
  location.reload();
}
(function () {
  const root = document.documentElement;
  if (!root.classList.contains('is-desk')) return;
  const SIDE = 264, PAD = 40, MAXW = 1240;

  function fit() {
    const pc = document.getElementById('page-container'); if (!pc) return;
    const vw = root.clientWidth;
    const W = Math.max(560, Math.min(MAXW, vw - SIDE - PAD * 2));
    const left = SIDE + PAD + Math.max(0, Math.round((vw - SIDE - PAD * 2 - W) / 2));
    root.style.setProperty('--dl', left + 'px');
    root.style.setProperty('--dw', W + 'px');
    pc.style.removeProperty('width'); pc.style.removeProperty('max-width'); pc.style.removeProperty('margin-left');
    const z = parseFloat(getComputedStyle(pc).zoom) || 1;
    pc.style.setProperty('max-width', (W / z) + 'px', 'important');
    pc.style.setProperty('width', (W / z) + 'px', 'important');
    pc.style.setProperty('margin-left', (left / z) + 'px', 'important');
    pc.style.setProperty('margin-right', '0', 'important');
    split();
  }
  // Home → two columns: money + transactions on the left, today / budget / chart on the right
  function split() {
    const rec = document.querySelector('#page-container .mymoney-records');
    if (!rec || rec.querySelector(':scope > .dk-main')) return;
    const main = document.createElement('div'); main.className = 'dk-main';
    const side = document.createElement('div'); side.className = 'dk-side';
    const pick = sel => rec.querySelector(':scope > ' + sel);
    ['.mm-hero', '.hx-qa', '.mm-subhead', '.mm-list'].forEach(s => { const e = pick(s); if (e) main.appendChild(e); });
    ['.hx-card.td', '.hx-budget', '#hx-analytics', '.hx-card'].forEach(s => { const e = pick(s); if (e) side.appendChild(e); });
    const bar = pick('.mm-monthbar');
    const grid = document.createElement('div'); grid.className = 'dk-grid'; grid.append(main, side);
    if (bar) bar.after(grid); else rec.prepend(grid);
  }
  window._deskFit = fit;

  // Sidebar: extra items that live in the bottom bar on phones
  function sideExtras() {
    const nav = document.querySelector('#sidebar .sidebar-nav'); if (!nav || nav.querySelector('.dk-primary')) return;
    const it = (page, ic, label) => `<button class="nav-item" data-page="${page}" onclick="navigate('${page}')"><span class="nav-icon"><i data-lucide="${ic}"></i></span><span class="nav-text">${label}</span></button>`;
    nav.insertAdjacentHTML('afterbegin', `<button class="dk-new" onclick="openTxPad('expense')"><i data-lucide="plus"></i>New transaction</button>
      <div class="nav-group dk-primary">${it('transactions', 'home', 'Home')}${it('insights', 'pie-chart', 'Analytics')}${it('investments', 'bar-chart-3', 'Assets')}</div>`);
    if (typeof _lucideRefresh === 'function') _lucideRefresh();
    markActive();
  }
  function markActive() {
    const cur = typeof currentPage !== 'undefined' ? currentPage : '';
    document.querySelectorAll('#sidebar .nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === cur));
  }

  const nav0 = window.navigate;
  if (typeof nav0 === 'function') window.navigate = function () {
    const r = nav0.apply(this, arguments);
    requestAnimationFrame(() => { fit(); sideExtras(); markActive(); }); setTimeout(fit, 150);
    return r;
  };
  window.addEventListener('resize', fit);
  const start = () => {
    fit(); sideExtras();
    const pc = document.getElementById('page-container');
    if (pc) new MutationObserver(() => split()).observe(pc, { childList: true, subtree: false });
    new MutationObserver(() => sideExtras()).observe(document.getElementById('sidebar') || document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
