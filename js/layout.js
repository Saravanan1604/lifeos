// ============================================================
//  Layout Customizer — reorder / hide / resize cards per page
//  Works on Home (dashboard), Finance, Assets. Saved per page.
// ============================================================
const LO_PAGES = ['dashboard', 'finance', 'investments'];
let _loEdit = false;

function _loKey(p)  { return 'lifeos_layout_' + p; }
function _loGet(p)  { try { return JSON.parse(localStorage.getItem(_loKey(p))) || {}; } catch { return {}; } }
function _loSet(p, o){ try { localStorage.setItem(_loKey(p), JSON.stringify(o)); } catch {} }

function _loFade() { return document.querySelector('#page-container .fade-in'); }
function _loCards() {
  const f = _loFade(); if (!f) return [];
  return [...f.children].filter(c => c.nodeType === 1
    && !c.classList.contains('page-header')
    && c.id !== 'page-quick-actions' && c.id !== 'lo-edit-bar' && c.tagName !== 'SCRIPT');
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
  if (!LO_PAGES.includes(page)) return;
  const f = _loFade(); if (!f) return;
  const lo = _loGet(page);
  let cards = _loCards();
  _loAssignKeys(cards);                       // keys first (template order = stable)
  cards.forEach(el => {
    const w = lo[el.dataset.lokey] || {};
    el.style.display = (w.hidden && !_loEdit) ? 'none' : '';
    el.classList.toggle('lo-compact', w.size === 'small');
    el.classList.toggle('lo-hidden-edit', !!w.hidden);
  });
  // reorder per saved order
  cards.slice()
    .sort((a, b) => ((lo[a.dataset.lokey]?.order ?? 500) - (lo[b.dataset.lokey]?.order ?? 500)))
    .forEach(el => f.appendChild(el));
  if (_loEdit) _loDecorate(page);
}

function toggleEditLayout() {
  const page = (typeof currentPage !== 'undefined') ? currentPage : 'dashboard';
  if (!LO_PAGES.includes(page)) {
    if (typeof toast === 'function') toast('Open Home, Finance or Assets to customize', 'info');
    return;
  }
  _loEdit = !_loEdit;
  if (typeof navigate === 'function') navigate(page, true);   // re-render → applyPageLayout decorates
  if (typeof toast === 'function') toast(_loEdit ? '✏️ Customize: reorder, hide or resize cards' : '✅ Layout saved', 'success');
}

function _loDecorate(page) {
  const f = _loFade(); if (!f) return;
  if (!document.getElementById('lo-edit-bar')) {
    const bar = document.createElement('div');
    bar.id = 'lo-edit-bar';
    bar.innerHTML = `<span>✏️ Customizing — move or hide cards</span>
      <div>${page === 'dashboard' ? `<button onclick="if(typeof openWidgetPicker==='function')openWidgetPicker()">➕ Add Chart</button>` : ''}
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
  localStorage.removeItem(_loKey(page));
  navigate(page, true);
  if (typeof toast === 'function') toast('Layout reset to default', 'info');
}

// In edit mode, block a card's own tap (navigation) — but let the ▲▼/👁
// control buttons work. Capture phase so it runs before the card's onclick.
document.addEventListener('click', (e) => {
  if (!_loEdit) return;
  if (e.target.closest('.lo-ctrls') || e.target.closest('#lo-edit-bar')) return; // allow controls
  if (e.target.closest('.lo-editing')) { e.preventDefault(); e.stopPropagation(); }
}, true);
