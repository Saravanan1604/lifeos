// ============================================================
//  money.js — build 711: ONE place for money maths.
//  Every page (Home, Analytics, Reports, Budget, Assistant) uses
//  these rules so the same period always shows the same numbers:
//   • amount  = Number(t.amount) (strings never concatenate)
//   • income  = type 'income'; spend = everything else
//   • dates   = local calendar day (YYYY-MM-DD), never UTC
//  Plus the data check that finds entries whose type and category
//  disagree (e.g. "Interest" saved as an expense).
// ============================================================
const Money = {
  amt(t) { const v = +(t && t.amount); return isFinite(v) ? v : 0; },
  isIncome(t) { return !!t && t.type === 'income'; },
  isSpend(t) { return !!t && t.type !== 'income'; },
  day(t) { return String((t && t.date) || '').slice(0, 10); },
  ymd(d) { return typeof _ymdLocal === 'function' ? _ymdLocal(d) : new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); },
  ym(d) { return this.ymd(d).slice(0, 7); },
  all() { return STATE.transactions || []; },
  inRange(from, to, list) { return (list || this.all()).filter(t => { const d = this.day(t); return (!from || d >= from) && (!to || d <= to); }); },
  inMonth(ym, list) { return (list || this.all()).filter(t => this.day(t).startsWith(ym)); },
  totals(list) {
    let income = 0, spend = 0;
    (list || []).forEach(t => { const a = this.amt(t); if (this.isIncome(t)) income += a; else spend += a; });
    return { income, spend, net: income - spend, count: (list || []).length };
  },
  monthTotals(ym) { return this.totals(this.inMonth(ym)); },
  byCategory(list, kind) {
    const m = {};
    (list || []).forEach(t => { if (kind === 'income' ? !this.isIncome(t) : kind === 'spend' ? !this.isSpend(t) : false) return; const c = t.category || 'Other'; m[c] = (m[c] || 0) + this.amt(t); });
    return m;
  },
  // ── data check ──
  catType(name) {
    const c = (typeof getAllCategories === 'function' ? getAllCategories() : []).find(x => x.name === name);
    return c ? c.type : null;            // 'income' | 'expense' | 'both' | null (unknown / legacy)
  },
  mismatches() {
    const ign = new Set(((STATE.settings || {}).typeCheckIgnore) || []);
    const groups = {};
    this.all().forEach(t => {
      const ct = this.catType(t.category);
      if (!ct || ct === 'both') return;
      const want = ct === 'income' ? 'income' : 'expense';
      const have = t.type === 'income' ? 'income' : 'expense';
      if (want === have) return;
      const key = t.category + '|' + have;
      if (ign.has(key)) return;
      const g = groups[key] || (groups[key] = { key, category: t.category, have, want, ids: [], total: 0 });
      g.ids.push(t.id); g.total += this.amt(t);
    });
    return Object.values(groups).sort((a, b) => b.total - a.total);
  },
};

function openDataCheck() {
  const gs = Money.mismatches();
  if (!gs.length) { if (typeof toast === 'function') toast('All entries look right — nothing to fix', 'success'); return; }
  const row = g => `<div class="dc-row" data-key="${g.key.replace(/"/g, '&quot;')}">
      <span class="dc-ic" style="--c:${typeof catColor === 'function' ? catColor(g.category) : '#8B5CF6'}">${typeof catIconHtml === 'function' ? catIconHtml(g.category) : ''}</span>
      <div class="dc-m"><b>${g.category}</b><small>${g.ids.length} ${g.ids.length === 1 ? 'entry' : 'entries'} saved as <em>${g.have}</em> · ${fmt(Math.round(g.total))}</small></div>
      <div class="dc-btns"><button class="p" onclick="dataCheckFix('${g.key.replace(/'/g, "\\'")}')">Make ${g.want}</button><button onclick="dataCheckKeep('${g.key.replace(/'/g, "\\'")}')">Keep</button></div>
    </div>`;
  openModal('Check your entries', `<div class="dc">
    <p class="dc-lead">These categories are normally <b>${'income'}</b> or <b>${'expense'}</b>, but some entries were saved the other way. That makes spending and income totals wrong. Fix them, or keep them if they're really correct.</p>
    ${gs.map(row).join('')}
    ${gs.length > 1 ? `<button class="dc-all" onclick="dataCheckFix('*')">Fix all ${gs.reduce((s, g) => s + g.ids.length, 0)} entries</button>` : ''}
  </div>`);
  if (typeof _lucideRefresh === 'function') _lucideRefresh();
}
function dataCheckFix(key) {
  const gs = Money.mismatches().filter(g => key === '*' || g.key === key);
  let n = 0;
  gs.forEach(g => { const ids = new Set(g.ids); (STATE.transactions || []).forEach(t => { if (ids.has(t.id)) { t.type = g.want; n++; } }); });
  saveState();
  if (typeof toast === 'function') toast(`Fixed ${n} ${n === 1 ? 'entry' : 'entries'}`, 'success');
  if (Money.mismatches().length) openDataCheck(); else closeModal();
  if (typeof navigate === 'function' && typeof currentPage !== 'undefined') navigate(currentPage, true);
}
function dataCheckKeep(key) {
  STATE.settings = STATE.settings || {};
  STATE.settings.typeCheckIgnore = [...new Set([...(STATE.settings.typeCheckIgnore || []), key])];
  saveState();
  if (Money.mismatches().length) openDataCheck(); else { closeModal(); if (typeof navigate === 'function') navigate(currentPage, true); }
}
