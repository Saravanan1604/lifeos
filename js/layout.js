// ============================================================
//  Layout Customizer — reorder / hide / resize cards per page
//  Works on ALL pages + user-created custom pages.
// ============================================================
const LO_PAGES = [
  'dashboard', 'finance', 'investments', 'transactions', 'notes',
  'yearly', 'budget', 'bank-tracker', 'health', 'habits', 'goals',
  'journal', 'achievements', 'ai-coach',
  'categories', 'recurring', 'rules', 'settings', 'help'
];
let _loEdit = false;

function isCustomPage(p)       { return typeof p === 'string' && p.startsWith('custom_page_'); }
function isCustomizablePage(p) { return LO_PAGES.includes(p) || isCustomPage(p); }

function _loKey(p)  { return 'lifeos_layout_' + p; }

// Custom pages store layout in STATE (cloud-synced); standard pages use localStorage
function _loGet(p) {
  if (isCustomPage(p)) {
    try { return (STATE.customPageLayouts && STATE.customPageLayouts[p]) || {}; } catch { return {}; }
  }
  try { return JSON.parse(localStorage.getItem(_loKey(p))) || {}; } catch { return {}; }
}
function _loSet(p, o) {
  if (isCustomPage(p)) {
    STATE.customPageLayouts = STATE.customPageLayouts || {};
    STATE.customPageLayouts[p] = o;
    if (typeof saveState === 'function') saveState();
    return;
  }
  try { localStorage.setItem(_loKey(p), JSON.stringify(o)); } catch {}
}

function _loFade() { return document.querySelector('#page-container .fade-in'); }
function _loCards() {
  const f = _loFade(); if (!f) return [];
  return [...f.children].filter(c => c.nodeType === 1
    && !c.classList.contains('page-header')
    && !c.classList.contains('app-search')
    && c.id !== 'page-quick-actions' && c.id !== 'lo-edit-bar' && c.id !== 'insight-bar' && c.tagName !== 'SCRIPT');
}

// Stable key: computed in TEMPLATE order (deterministic) using id or heading
// slug + occurrence — independent of the user's saved order.
function _loAssignKeys(cards) {
  const seen = {};
  cards.forEach(el => {
    let base = el.id;
    if (!base) {
      const h = el.querySelector('.section-title, h2, h1');
      base = (h ? h.textContent.trim() : 'card').slice(0, 22).replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'card';
    }
    seen[base] = (seen[base] || 0) + 1;
    el.dataset.lokey = base + (seen[base] > 1 ? '~' + seen[base] : '');
  });
}

function applyPageLayout(page) {
  if (!isCustomizablePage(page)) return;
  const f = _loFade(); if (!f) return;

  // Auto-reset layout on structural updates (Version Bump) to default template order
  // Skip for custom pages — their layout is user-defined, not template-dependent
  if (!isCustomPage(page)) {
    const currentLayoutVer = 'v2';
    const verKey = 'lifeos_layout_ver_' + page;
    if (localStorage.getItem(verKey) !== currentLayoutVer) {
      localStorage.removeItem(_loKey(page));
      localStorage.setItem(verKey, currentLayoutVer);
    }
  }

  const lo = _loGet(page);
  let cards = _loCards();
  _loAssignKeys(cards);                       // keys first (template order = stable)

  // For custom pages with no layout saved yet, default everything to hidden
  const isNew = isCustomPage(page) && Object.keys(lo).length === 0;

  cards.forEach(el => {
    const w = lo[el.dataset.lokey] || {};
    const hidden = isNew ? !w.visible : w.hidden;
    el.style.display = (hidden && !_loEdit) ? 'none' : '';
    el.classList.toggle('lo-compact', w.size === 'small');
    el.classList.toggle('lo-hidden-edit', !!hidden);
  });
  // reorder per saved order
  cards.slice()
    .sort((a, b) => ((lo[a.dataset.lokey]?.order ?? 500) - (lo[b.dataset.lokey]?.order ?? 500)))
    .forEach(el => f.appendChild(el));
  if (_loEdit) _loDecorate(page);

  // Inject the Customize Layout button into the page header
  injectCustomizeButton(page);
}

function toggleEditLayout() {
  const page = (typeof currentPage !== 'undefined') ? currentPage : 'dashboard';
  if (!isCustomizablePage(page)) {
    if (typeof toast === 'function') toast('This page doesn\'t support customization', 'info');
    return;
  }
  _loEdit = !_loEdit;
  if (typeof updateSidebar === 'function') updateSidebar();
  if (typeof navigate === 'function') navigate(page, true);   // re-render → applyPageLayout decorates
  if (typeof toast === 'function') toast(_loEdit ? '✏️ Customize: reorder, hide or resize cards' : '✅ Layout saved', 'success');
}

function _loDecorate(page) {
  const f = _loFade(); if (!f) return;
  if (!document.getElementById('lo-edit-bar')) {
    const bar = document.createElement('div');
    bar.id = 'lo-edit-bar';
    const addChartBtn = (page === 'dashboard')
      ? `<button onclick="if(typeof openWidgetPicker==='function')openWidgetPicker()">➕ Add Chart</button>`
      : isCustomPage(page)
        ? `<button onclick="if(typeof openCustomPagePicker==='function')openCustomPagePicker('${page}')">➕ Add Card</button>`
        : '';
    const mgmtBtns = isCustomPage(page)
      ? `<button onclick="if(typeof renameCustomPage==='function')renameCustomPage('${page}')">✏️ Rename</button>
         <button onclick="if(typeof deleteCustomPage==='function')deleteCustomPage('${page}')" style="color:#ef4444">🗑️ Delete</button>`
      : '';
    bar.innerHTML = `<span>✏️ Customizing — move or hide cards</span>
      <div>${addChartBtn}${mgmtBtns}
      <button onclick="resetPageLayout()">Reset</button>
      <button class="done" onclick="toggleEditLayout()">✓ Done</button></div>`;
    f.insertBefore(bar, f.firstChild);
  }
  const lo = _loGet(page);
  _loCards().forEach(el => {
    if (el.querySelector(':scope > .lo-ctrls')) return;
    el.classList.add('lo-editing');
    const w = lo[el.dataset.lokey] || {};
    const k = el.dataset.lokey;
    const ctr = document.createElement('div');
    ctr.className = 'lo-ctrls';
    ctr.innerHTML =
      `<button title="Move up"   onclick="event.stopPropagation();loMove('${k}',-1)">▲</button>` +
      `<button title="Move down" onclick="event.stopPropagation();loMove('${k}',1)">▼</button>` +
      `<button title="${w.hidden ? 'Show' : 'Hide'}" onclick="event.stopPropagation();loHide('${k}')">${w.hidden ? '🚫' : '👁'}</button>`;
    el.appendChild(ctr);
  });
}

function _loReindex(page) {
  const lo = _loGet(page);
  _loCards().forEach((el, i) => { const k = el.dataset.lokey; lo[k] = lo[k] || {}; lo[k].order = i; });
  _loSet(page, lo);
}

function loMove(k, dir) {
  const page = currentPage; const f = _loFade(); if (!f) return;
  const cards = _loCards();
  const idx = cards.findIndex(c => c.dataset.lokey === k);
  const j = idx + dir;
  if (idx < 0 || j < 0 || j >= cards.length) return;
  if (dir < 0) f.insertBefore(cards[idx], cards[j]);
  else        f.insertBefore(cards[j], cards[idx]);
  _loReindex(page);
  if (navigator.vibrate) navigator.vibrate(8);
}
function loSize(k) {
  const page = currentPage; const lo = _loGet(page); lo[k] = lo[k] || {};
  lo[k].size = lo[k].size === 'small' ? 'normal' : 'small';
  _loSet(page, lo); navigate(page, true);
}
function loHide(k) {
  const page = currentPage; const lo = _loGet(page); lo[k] = lo[k] || {};
  lo[k].hidden = !lo[k].hidden;
  _loSet(page, lo); navigate(page, true);
}
function resetPageLayout() {
  const page = currentPage;
  if (isCustomPage(page)) {
    STATE.customPageLayouts = STATE.customPageLayouts || {};
    delete STATE.customPageLayouts[page];
    if (typeof saveState === 'function') saveState();
  } else {
    localStorage.removeItem(_loKey(page));
  }
  navigate(page, true);
  if (typeof toast === 'function') toast('Layout reset to default', 'info');
}

// ── Dynamic Customize Layout button injection ──
function injectCustomizeButton(page) {
  if (!isCustomizablePage(page)) return;
  const f = _loFade(); if (!f) return;
  const header = f.querySelector('.page-header');
  if (!header) return;
  // Don't inject if the button already exists in the header
  if (header.querySelector('.page-customize-btn')) return;
  // Ensure header is flex for proper alignment
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'flex-start';
  header.style.flexWrap = 'wrap';
  header.style.gap = '12px';

  const btn = document.createElement('button');
  btn.className = 'page-customize-btn';
  btn.title = 'Customize layout';
  btn.onclick = function() { if (typeof toggleEditLayout === 'function') toggleEditLayout(); };
  btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:2px"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg> Customize`;
  header.appendChild(btn);
}

// In edit mode, block a card's own tap (navigation) — but let the ▲▼/👁
// control buttons work. Capture phase so it runs before the card's onclick.
document.addEventListener('click', (e) => {
  if (!_loEdit) return;
  if (e.target.closest('.lo-ctrls') || e.target.closest('#lo-edit-bar')) return; // allow controls
  if (e.target.closest('.lo-editing')) { e.preventDefault(); e.stopPropagation(); }
}, true);
