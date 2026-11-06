// ============================================================
//  budgetsuggest.js — build 718: budgets suggested from history
//  Looks at the last 3 complete months per spend category, ignores
//  fixed bills (EMI, rent, insurance, SIP…), and suggests a monthly
//  limit = average rounded up to a tidy number. You pick which to add.
// ============================================================
const _BS_FIXED = /emi|loan|rent|insurance|sip|investment|tax|fee|school|transfer/i;
function budgetSuggestions() {
  const now = new Date(), months = [1, 2, 3].map(k => Money.ym(new Date(now.getFullYear(), now.getMonth() - k, 1)));
  const have = new Set((STATE.budgets || []).map(b => (b.category || '').toLowerCase()));
  const per = {};
  months.forEach((ym, i) => Object.entries(Money.byCategory(Money.inMonth(ym), 'spend')).forEach(([c, v]) => { (per[c] = per[c] || [0, 0, 0])[i] = v; }));
  const tidy = v => v < 1000 ? Math.ceil(v / 100) * 100 : v < 10000 ? Math.ceil(v / 500) * 500 : Math.ceil(v / 1000) * 1000;
  return Object.entries(per).map(([c, arr]) => {
    const used = arr.filter(v => v > 0).length, avg = arr.reduce((a, b) => a + b, 0) / 3;
    return { c, avg, used, max: Math.max(...arr), limit: tidy(avg * 1.05) };
  }).filter(x => x.used >= 2 && x.avg >= 300 && !_BS_FIXED.test(x.c) && !have.has(x.c.toLowerCase()))
    .sort((a, b) => b.avg - a.avg).slice(0, 8);
}
function openBudgetSuggest() {
  const s = budgetSuggestions();
  if (!s.length) { toast((STATE.budgets || []).length ? 'Your main categories already have budgets' : 'Need about 2 months of entries to suggest budgets', 'info'); return; }
  const tot = s.reduce((a, x) => a + x.limit, 0);
  openModal('Suggested budgets', `<div class="bs">
    <p class="bs-lead">Based on your last 3 months. Each limit is your average plus a little room. Untick any you don't want, or change the amount.</p>
    ${s.map((x, i) => `<label class="bs-row"><input type="checkbox" class="bs-cb" data-c="${x.c.replace(/"/g, '&quot;')}" checked/>
      <span class="bs-ic" style="--c:${catColor(x.c)}">${typeof catIconHtml === 'function' ? catIconHtml(x.c) : ''}</span>
      <span class="bs-m"><b>${x.c}</b><small>avg ${fmt(Math.round(x.avg))}/month · highest ${fmt(Math.round(x.max))}</small></span>
      <span class="bs-amt">₹<input type="number" inputmode="numeric" id="bs-v-${i}" value="${x.limit}"/></span></label>`).join('')}
    <p class="bs-tot">Total for these: <b>${fmt(tot)}</b> a month</p>
    <div class="modal-actions"><button class="btn-secondary" onclick="closeModal()">Not now</button><button class="btn-primary" onclick="applyBudgetSuggest()">Add budgets</button></div>
  </div>`);
  if (typeof _lucideRefresh === 'function') _lucideRefresh();
}
function applyBudgetSuggest() {
  STATE.budgets = STATE.budgets || []; let n = 0;
  document.querySelectorAll('.bs-cb').forEach((cb, i) => {
    if (!cb.checked) return;
    const v = parseFloat((document.getElementById('bs-v-' + i) || {}).value);
    if (!(v > 0)) return;
    STATE.budgets.push({ id: genId(), category: cb.dataset.c, amount: v, period: 'month', notes: 'Suggested from history' }); n++;
  });
  if (!n) { toast('Nothing selected', 'info'); return; }
  saveState(); closeModal(); toast(`Added ${n} budget${n === 1 ? '' : 's'}`, 'success');
  navigate(typeof currentPage !== 'undefined' ? currentPage : 'budget', true);
}
function budgetSuggestBanner() {
  try { const s = budgetSuggestions(); if (!s.length) return '';
    return `<button class="bs-banner" onclick="openBudgetSuggest()"><span><i data-lucide="wand-sparkles"></i></span><div><b>Suggested budgets for ${s.length} categor${s.length === 1 ? 'y' : 'ies'}</b><small>Based on what you usually spend — ${s.slice(0, 3).map(x => x.c).join(', ')}</small></div><i data-lucide="chevron-right"></i></button>`;
  } catch (_) { return ''; }
}
