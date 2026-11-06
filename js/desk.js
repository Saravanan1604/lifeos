// ============================================================
//  desk.js — build 704: desktop web shows the modern app design
//  in a centred column. Pages that use CSS zoom (e.g. 0.6) need
//  their width/offset divided by that zoom so every page lines up.
//  Settings → "Classic web layout" switches back (localStorage).
// ============================================================
function setWebLayout(mode) {
  try { localStorage.setItem('lifeos_web_layout', mode); } catch (_) {}
  location.reload();
}
(function () {
  if (!document.documentElement.classList.contains('is-desk')) return;
  const W = 640, SIDE = 250, GAP = 28;
  function fit() {
    const pc = document.getElementById('page-container'); if (!pc) return;
    const vw = document.documentElement.clientWidth;
    const total = SIDE + GAP + W;
    const left = Math.max(SIDE + GAP, Math.round((vw - total) / 2) + SIDE + GAP);
    document.documentElement.style.setProperty('--dl', left + 'px');
    document.documentElement.style.setProperty('--dw', W + 'px');
    pc.style.removeProperty('max-width'); pc.style.removeProperty('margin-left');
    const z = parseFloat(getComputedStyle(pc).zoom) || 1;
    pc.style.setProperty('max-width', (W / z) + 'px', 'important');
    pc.style.setProperty('width', (W / z) + 'px', 'important');
    pc.style.setProperty('margin-left', (left / z) + 'px', 'important');
    pc.style.setProperty('margin-right', '0', 'important');
  }
  window._deskFit = fit;
  const nav0 = window.navigate;
  if (typeof nav0 === 'function') window.navigate = function () { const r = nav0.apply(this, arguments); requestAnimationFrame(fit); setTimeout(fit, 120); return r; };
  window.addEventListener('resize', fit);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fit); else fit();
  new MutationObserver(() => fit()).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
})();
