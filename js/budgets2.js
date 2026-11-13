// ============================================================
//  budgets2.js — build 737: Budget tab leads with a "battery" grid
//  Each category is a tile that fills up as you spend (green → amber
//  → red), with ₹ left / over in words. Tap to edit. The old ring and
//  bar list are hidden; everything below (unbudgeted, compare) stays.
// ============================================================
(function () {
  if (!window.__IS_APP || typeof renderCombinedSpendBudget !== 'function') return;
  const orig = renderCombinedSpendBudget;
  const S = v => (typeof _asShort === 'function' ? _asShort(v) : fmt(v));
  const E = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function grid() {
    const budgets = STATE.budgets || [];
    const tx = (typeof filterTxByAnchor === 'function' ? filterTxByAnchor([...(STATE.transactions || [])], _budgetPeriod, _ymdLocal(_budgetAnchor)) : []).filter(t => Money.isSpend(t));
    const rows = budgets.map((b, bi) => { const lim = getBudgetLimit(b, _budgetPeriod), k = (b.category || '').trim().toLowerCase();
      const sp = tx.filter(t => (t.category || '').trim().toLowerCase() === k).reduce((s, t) => s + Money.amt(t), 0);
      return { b, bi, lim, sp, pct: lim > 0 ? sp / lim * 100 : 0 }; }).sort((a, b) => b.pct - a.pct);
    const tl = rows.reduce((s, r) => s + r.lim, 0), ts = rows.reduce((s, r) => s + r.sp, 0), over = rows.filter(r => r.pct >= 100).length;
    const tp = tl > 0 ? ts / tl * 100 : 0;
    const lbl = typeof _budgetPeriodLabel === 'function' ? _budgetPeriodLabel() : '';
    const tile = (r, k) => { const t = r.pct >= 100 ? 'exp' : r.pct >= 80 ? 'warn' : 'inc', col = typeof catColor === 'function' ? catColor(r.b.category) : '#8B5CF6';
      return `<button class="bg-t t-${t}" style="--d:${k * 50}ms;--f:${Math.min(100, r.pct).toFixed(1)}%" onclick="openAddBudgetModal(${r.bi})">
        <span class="bg-bat"><i></i><em>${Math.round(r.pct)}%</em></span>
        <span class="bg-m"><span class="bg-ic" style="--c:${col}">${typeof catIconHtml === 'function' ? catIconHtml(r.b.category) : ''}</span><b>${E(r.b.category)}</b>
          <strong>${r.pct >= 100 ? S(r.sp - r.lim) + ' over' : S(r.lim - r.sp) + ' left'}</strong><small>${S(r.sp)} of ${S(r.lim)}</small></span></button>`; };
    return `<div class="bgx">
      <div class="bg-sum"><div><small>Your budget</small><b>${tl ? (ts > tl ? S(ts - tl) + ' over' : S(tl - ts) + ' left') : 'No budgets yet'}</b><span>${tl ? `${S(ts)} spent of ${S(tl)}${over ? ` · <em>${over} over limit</em>` : ''}` : 'Set a monthly limit for the categories you want to watch.'}</span></div>
        <button class="bg-per" onclick="openBudgetPeriodSheet()">${E(lbl)} ▾</button></div>
      ${tl ? `<div class="bg-tot"><i class="${tp >= 100 ? 'exp' : tp >= 80 ? 'warn' : 'inc'}" style="width:${Math.min(100, tp)}%"></i></div>` : ''}
      <div class="bg-grid">${rows.map(tile).join('')}<button class="bg-add" onclick="openAddBudgetModal()"><i data-lucide="plus"></i>Add budget</button></div>
    </div>`;
  }
  window.renderCombinedSpendBudget = function () {
    const r = orig.apply(this, arguments);
    try {
      const page = document.getElementById('budget-page'); if (!page) return r;
      const pc = document.getElementById('page-container'), z = parseFloat(getComputedStyle(pc).zoom) || 1;
      page.querySelectorAll(':scope > .ring-container, :scope > .section-heading-row').forEach(e => e.classList.add('bg-hide'));
      const list = page.querySelector('.category-row'); if (list && list.parentElement) list.parentElement.classList.add('bg-hide');
      [...page.children].forEach(e => { if (/total/i.test(e.className || '') || e.querySelector && e.querySelector('.tb-bar, .total-budget')) e.classList.add('bg-hide'); });
      page.querySelectorAll('.bgx').forEach(x => x.remove());
      page.insertAdjacentHTML('afterbegin', grid());
      const g = page.querySelector('.bgx'); if (g) g.style.zoom = (1 / z).toFixed(4);
      if (typeof _lucideRefresh === 'function') _lucideRefresh();
    } catch (e) { console.log('budget grid', e); }
    return r;
  };
})();
