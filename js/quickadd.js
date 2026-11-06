// ============================================================
//  quickadd.js — build 717: type one line, e.g.
//    "swiggy 250"   "petrol 500 hdfc yesterday"   "salary 52000"
//    "+ 5000 refund"   "250 tea"
//  The app guesses category, account and type from your history,
//  shows a preview, and saves through the normal add screen (padSave),
//  so balances, budgets, alerts and learning all work the same.
// ============================================================
function _qaParse(text) {
  let s = ' ' + String(text || '').trim() + ' ', type = null, date = Money.ymd(new Date());
  const amt = s.match(/(?:₹|rs\.?\s*)?(\d[\d,]*(?:\.\d{1,2})?)\s*(k|thousand|l|lakh)?\b/i);
  if (!amt) return null;
  let amount = parseFloat(amt[1].replace(/,/g, ''));
  if (/^k|thousand/i.test(amt[2] || '')) amount *= 1000; if (/^l|lakh/i.test(amt[2] || '')) amount *= 100000;
  s = s.replace(amt[0], ' ');
  if (/(^|\s)\+/.test(s) || /\b(got|received|income|salary|refund|credited|credit)\b/i.test(s)) type = 'income';
  if (/\byesterday\b/i.test(s)) { const d = new Date(); d.setDate(d.getDate() - 1); date = Money.ymd(d); s = s.replace(/\byesterday\b/i, ' '); }
  else s = s.replace(/\btoday\b/i, ' ');
  // account by name
  const accts = [...(STATE.bankAccounts || []).map(a => ({ id: 'bank:' + a.id, n: a.bankName || a.name })), ...(STATE.cashAccounts || []).map(a => ({ id: 'cash:' + a.id, n: a.name || 'Cash' })), ...(STATE.creditCards || []).map(a => ({ id: 'card:' + a.id, n: a.name || a.bankName }))].filter(a => a.n);
  let source = '';
  for (const a of accts) { const re = new RegExp('\\b' + a.n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i'); if (re.test(s)) { source = a.id; s = s.replace(re, ' '); break; } }
  if (!source && /\bcash\b/i.test(s) && (STATE.cashAccounts || [])[0]) { source = 'cash:' + STATE.cashAccounts[0].id; s = s.replace(/\bcash\b/i, ' '); }
  const note = s.replace(/(^|\s)[+\-]/g, ' ').replace(/\b(spent|paid|for|on|at|to|got|received|rs|inr)\b/gi, ' ').replace(/\s+/g, ' ').trim();
  // category: same note before → its category; else a category name inside the text; else most-used
  const cats = getAllCategories();
  const hist = (STATE.transactions || []).filter(t => note && (t.description || '').toLowerCase() === note.toLowerCase());
  let category = '', last = hist[0];
  if (last) { category = last.category; if (!type) type = last.type === 'income' ? 'income' : 'expense'; if (!source) source = last.source || ''; }
  if (!category && typeof getCategoryRule === 'function') category = getCategoryRule(note) || '';
  if (!category) { const hit = cats.find(c => note && new RegExp('\\b' + c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(note)); if (hit) category = hit.name; }
  if (!type) type = category && Money.catType(category) === 'income' ? 'income' : 'expense';
  if (!category && type === 'income' && !/salary|wage/i.test(note)) category = cats.find(c => c.name === 'Other Income') ? 'Other Income' : '';
  if (!category) { const ok = cats.filter(c => c.type === type || c.type === 'both'); const freq = {}; (STATE.transactions || []).forEach(t => { if ((t.type === 'income') === (type === 'income')) freq[t.category] = (freq[t.category] || 0) + 1; });
    category = (ok.map(c => c.name).sort((a, b) => (freq[b] || 0) - (freq[a] || 0))[0]) || 'Other'; }
  if (!source) source = (STATE.settings && STATE.settings.defaultAccount) || '';
  return { amount: Math.round(amount * 100) / 100, type, category, note: note ? note[0].toUpperCase() + note.slice(1) : '', date, source, learned: !!last };
}
function _qaPreview() {
  const box = document.getElementById('qa-prev'), inp = document.getElementById('qa-in'); if (!box || !inp) return;
  const r = _qaParse(inp.value);
  if (!r) { box.innerHTML = '<span class="qa-hint">Type what you spent and the amount</span>'; box.dataset.ok = ''; return; }
  const acct = r.source && typeof _sourceLabel === 'function' ? _sourceLabel(r.source).replace(/^\S+\s/, '') : 'No account';
  box.dataset.ok = '1';
  box.innerHTML = `<span class="qa-amt ${r.type}">${r.type === 'income' ? '+' : '−'}${fmt(r.amount)}</span>
    <span class="qa-chip"><i style="background:${catColor(r.category)}"></i>${r.category}</span>
    ${r.note ? `<span class="qa-chip">${r.note.replace(/</g, '&lt;')}</span>` : ''}
    <span class="qa-chip">${acct}</span>${r.date !== Money.ymd(new Date()) ? '<span class="qa-chip">Yesterday</span>' : ''}
    ${r.learned ? '<span class="qa-learn">from your history</span>' : ''}`;
}
function quickAddSave(edit) {
  const r = _qaParse((document.getElementById('qa-in') || {}).value);
  if (!r) { toast('Add an amount, e.g. "swiggy 250"', 'error'); return; }
  openTxPad(r.type);
  Object.assign(_pad, { expr: String(r.amount), category: r.category, notes: r.note, date: r.date, source: r.source || _pad.source });
  if (edit) { renderTxPad(); return; }
  padSave();
  const inp = document.getElementById('qa-in'); if (inp) { inp.value = ''; _qaPreview(); }
}
function quickAddHtml() {
  return `<div class="qa">
    <div class="qa-row"><i data-lucide="zap"></i><input id="qa-in" type="text" placeholder="Quick add — e.g. swiggy 250" autocomplete="off" enterkeyhint="done"
      oninput="_qaPreview()" onkeydown="if(event.key==='Enter'){event.preventDefault();quickAddSave()}"/>
      <button class="qa-edit" onclick="quickAddSave(true)" aria-label="Edit before saving"><i data-lucide="sliders-horizontal"></i></button>
      <button class="qa-go" onclick="quickAddSave()" aria-label="Save"><i data-lucide="arrow-up"></i></button></div>
    <div class="qa-prev" id="qa-prev"><span class="qa-hint">Try “petrol 500 hdfc”, “salary 52000” or “tea 20 yesterday”</span></div>
  </div>`;
}
