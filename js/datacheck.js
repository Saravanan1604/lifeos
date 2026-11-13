// ============================================================
//  datacheck.js — build 743: "Check my data"
//  Finds entries that make totals look wrong and offers one-tap
//  fixes: loan amount vs what's left, card over its limit, old or
//  negative balances, one-off spikes in balance history, unusually
//  large entries, possible duplicates, future dates, and entries
//  saved as the wrong type. "Looks right" hides an item for good.
// ============================================================
function _dcIgnored() { return new Set(((STATE.settings || {}).dcIgnore) || []); }
function dcIgnore(key) { STATE.settings = STATE.settings || {}; STATE.settings.dcIgnore = [...new Set([...(STATE.settings.dcIgnore || []), key])]; saveState(); renderDataCheck(); }
function dcRemoveLog(kind, id) {
  const key = kind === 'cash' ? 'cashBalanceHistory' : kind === 'card' ? 'creditCardHistory' : 'bankBalanceHistory';
  if (!confirm('Remove this balance entry? Your current balance is recalculated from the latest entry.')) return;
  STATE[key] = (STATE[key] || []).filter(h => h.id !== id);
  try { if (typeof reconcileCurrentBalances === 'function') reconcileCurrentBalances(); } catch (_) {}
  saveState(); toast('Entry removed', 'success'); renderDataCheck();
}
function dataCheckItems() {
  const out = [], ign = _dcIgnored(), S = v => (typeof _asShort === 'function' ? _asShort(v) : fmt(v));
  const add = o => { if (!ign.has(o.key)) out.push(o); };
  const today = _ymdLocal(new Date()), daysAgo = d => Math.floor((Date.now() - new Date(d + 'T12:00:00')) / 864e5);
  // 1. loans: amount vs what's left
  (STATE.loans || []).forEach(l => {
    const P = +l.principal || 0, outv = typeof _loanOutstanding === 'function' ? _loanOutstanding(l) : +l.outstanding || 0;
    if (!l.autoCalc && P > 0 && outv > 0 && (outv > P * 1.05 || outv < P * 0.15))
      add({ key: 'loan:' + l.id + ':' + P + ':' + outv, sev: 'high', ic: 'landmark', t: `${l.name || 'Loan'}: amounts don't match`, s: `Loan amount ${S(P)} but ${S(outv)} left. One may have an extra or missing digit.`, fix: [['Fix in Edit', `openEditLoanModal('${l.id}')`]] });
    if (+l.emi > 0 && outv > 0 && +l.emi > outv * 1.5)
      add({ key: 'emi:' + l.id + ':' + l.emi, sev: 'mid', ic: 'landmark', t: `${l.name || 'Loan'}: EMI bigger than what's left`, s: `EMI ${S(+l.emi)} vs ${S(outv)} left.`, fix: [['Fix in Edit', `openEditLoanModal('${l.id}')`]] });
  });
  // 2. cards over limit
  (STATE.creditCards || []).forEach(c => { if (+c.limit > 0 && +c.outstanding > +c.limit * 1.02)
    add({ key: 'card:' + c.id + ':' + c.outstanding, sev: 'mid', ic: 'credit-card', t: `${c.bankName || 'Card'}: over its limit`, s: `${S(+c.outstanding)} due on a ${S(+c.limit)} limit. Check the amount or the limit.`, fix: [['Update', `openUpdateCCModal('${c.id}')`]] }); });
  // 3. old / negative balances
  const lastLog = (key, idF, id) => (STATE[key] || []).filter(h => h[idF] === id).map(h => h.date || '').sort().pop();
  [['bankBalanceHistory', STATE.bankAccounts, a => a.bankName, a => `openQuickBalanceModal('${a.id}')`], ['cashBalanceHistory', STATE.cashAccounts, a => a.name || 'Cash', a => `openQuickCashModal('${a.id}')`]].forEach(([key, list, nm, upd]) => (list || []).forEach(a => {
    if (a.inactive) return;
    if ((+a.balance || 0) < 0) add({ key: 'neg:' + a.id + ':' + a.balance, sev: 'high', ic: 'alert-triangle', t: `${nm(a)} is below zero`, s: `Balance shows −${fmt(Math.abs(Math.round(+a.balance)))}. Update it to what your bank app shows.`, fix: [['Update', upd(a)]] });
    const d = lastLog(key, 'accountId', a.id), n = d ? daysAgo(d) : null;
    if (n == null || n > 14) add({ key: 'old:' + a.id + ':' + (d || ''), sev: 'low', ic: 'clock', t: `${nm(a)} not updated ${n == null ? 'yet' : 'for ' + n + ' days'}`, s: 'Old balances make "In accounts" and net worth wrong.', fix: [['Update', upd(a)]] });
  }));
  // 4. one-off spikes in balance history (jumps and comes back)
  [['bank', 'bankBalanceHistory', 'accountId', 'balance', STATE.bankAccounts, a => a.bankName], ['cash', 'cashBalanceHistory', 'accountId', 'balance', STATE.cashAccounts, a => a.name || 'Cash'], ['card', 'creditCardHistory', 'cardId', 'outstanding', STATE.creditCards, a => a.bankName]].forEach(([kind, key, idF, vf, list, nm]) => (list || []).forEach(a => {
    const h = (STATE[key] || []).filter(x => x[idF] === a.id).sort((x, y) => ((x.date || '') + (x.createdAt || '')).localeCompare((y.date || '') + (y.createdAt || '')));
    for (let i = 1; i < h.length - 1; i++) { const p = +h[i - 1][vf] || 0, v = +h[i][vf] || 0, n = +h[i + 1][vf] || 0, base = Math.max(Math.abs(p), Math.abs(n), 1000);
      if (Math.abs(v - p) > base * 1.5 && Math.abs(v - n) > base * 1.5 && Math.abs(p - n) < base * 0.5 && Math.abs(v - p) > 20000 && h[i].id)
        add({ key: 'spike:' + h[i].id, sev: 'mid', ic: 'activity', t: `${nm(a)}: odd balance on ${fmtDate(h[i].date)}`, s: `${fmt(Math.round(p))} → ${fmt(Math.round(v))} → ${fmt(Math.round(n))}. A one-off jump like this is usually a typing mistake.`, fix: [['Remove this entry', `dcRemoveLog('${kind}','${h[i].id}')`]] }); }
  }));
  // 5. transactions: future dates, very large, duplicates
  const tx = STATE.transactions || [], spend = tx.filter(t => Money.isSpend(t)).map(Money.amt).sort((x, y) => x - y);
  const p90 = spend.length >= 20 ? spend[Math.floor(spend.length * 0.9)] : null;
  const fut = new Date(); fut.setDate(fut.getDate() + 2); const futS = _ymdLocal(fut);
  const recur = new Set((STATE.recurring || []).map(r => ((r.description || r.category || '') + '').toLowerCase()));
  tx.forEach(t => {
    const d = Money.day(t), a = Money.amt(t), nm = t.description || t.category || 'Entry';
    if (d > futS) add({ key: 'fut:' + t.id, sev: 'mid', ic: 'calendar-x', t: `${nm} is dated in the future`, s: `${fmt(a)} on ${fmtDate(d)} — maybe the wrong year?`, fix: [['Open', `openTxDetail('${t.id}')`]] });
    if (p90 && Money.isSpend(t) && a > Math.max(p90 * 8, 50000) && !/emi|rent|loan|insurance|investment|sip/i.test(t.category || '') && !recur.has(nm.toLowerCase()))
      add({ key: 'big:' + t.id, sev: 'low', ic: 'zap', t: `Very large: ${nm}`, s: `${fmt(a)} on ${fmtDate(d)} (${t.category || 'Other'}). If this is a typo it changes every total.`, fix: [['Open', `openTxDetail('${t.id}')`]] });
  });
  const seen = {}; tx.forEach(t => { const k = [Money.day(t), t.type, Money.amt(t), (t.description || '').trim().toLowerCase(), t.category].join('|'); (seen[k] = seen[k] || []).push(t); });
  Object.values(seen).filter(g => g.length > 1 && Money.amt(g[0]) > 0).forEach(g => {
    const t = g[0]; add({ key: 'dup:' + g.map(x => x.id).sort().join(','), sev: 'mid', ic: 'copy', t: `${g.length}× the same entry: ${t.description || t.category}`, s: `${fmt(Money.amt(t))} on ${fmtDate(Money.day(t))}, saved ${g.length} times.`, fix: [['Delete the copy', `deleteTx('${g[g.length - 1].id}');setTimeout(renderDataCheck,300)`], ['Open', `openTxDetail('${t.id}')`]] });
  });
  // 6. income / expense type mix-ups (existing check)
  try { const gs = Money.mismatches(); if (gs.length) { const n = gs.reduce((s, g) => s + g.ids.length, 0);
    add({ key: 'type:' + n, sev: 'mid', ic: 'shuffle', t: `${n} ${n === 1 ? 'entry' : 'entries'} saved as the wrong type`, s: `e.g. ${gs[0].category} saved as ${gs[0].have}.`, fix: [['Review', 'openDataCheck()']] }); } } catch (_) {}
  const rank = { high: 0, mid: 1, low: 2 };
  return out.sort((a, b) => rank[a.sev] - rank[b.sev]);
}
function renderDataCheck() {
  const c = document.getElementById('page-container'); if (!c) return;
  if (typeof currentPage !== 'undefined' && currentPage !== 'data-check') return navigate('data-check');
  const items = dataCheckItems(), E = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const n = items.length, hi = items.filter(i => i.sev === 'high').length;
  c.innerHTML = `<div class="pk dcx">
    ${_pk.head({ title: 'Check my data', sub: 'Mistakes that make your totals look wrong', back: "navigate('settings')" })}
    <div class="dc-hero ${n ? (hi ? 'bad' : 'warn') : 'ok'}"><span><i data-lucide="${n ? 'search-check' : 'shield-check'}"></i></span><div><b>${n ? `${n} thing${n === 1 ? '' : 's'} to check` : 'Everything looks right'}</b><small>${n ? (hi ? `${hi} important — fix these first` : 'None of these are urgent') : 'No odd amounts, old balances or duplicates found.'}</small></div></div>
    ${items.map((i, k) => `<div class="dc-item s-${i.sev}" style="--d:${k * 40}ms"><span class="dc-ic"><i data-lucide="${i.ic}"></i></span><div class="dc-b"><b>${E(i.t)}</b><p>${E(i.s)}</p>
      <div class="dc-btns">${i.fix.map(([l, on], z) => `<button class="${z ? '' : 'p'}" onclick="${on}">${l}</button>`).join('')}<button class="ok" onclick="dcIgnore('${i.key.replace(/'/g, '')}')">Looks right</button></div></div></div>`).join('')}
    ${((STATE.settings || {}).dcIgnore || []).length ? `<button class="lg-more" onclick="STATE.settings.dcIgnore=[];saveState();renderDataCheck()">Show items marked "Looks right" again</button>` : ''}
  </div>`;
  _pk.done(c);
}
function dataCheckCount() { try { return dataCheckItems().filter(i => i.sev !== 'low').length; } catch (_) { return 0; } }
