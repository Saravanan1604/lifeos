// ============================================================
//  Daily "Good morning" digest + Month-in-Review.
//  The digest is an in-app summary shown once per day on first open
//  (a true scheduled push needs backend FCM — this is the no-backend
//  version). Month-in-Review is a richer monthly recap.
// ============================================================

function _digestStats() {
  const txns = STATE.transactions || [];
  const y = new Date(); y.setDate(y.getDate() - 1);
  const yS = _ymdLocal(y);
  const yTx = txns.filter(t => t.type !== 'income' && (t.date || '').slice(0, 10) === yS);
  const ydaySpent = yTx.reduce((s, t) => s + (+t.amount || 0), 0);

  // Today's bills due (from the Upcoming projector)
  let todayBills = 0, todayItems = [];
  const todayS = _ymdLocal(new Date());
  if (typeof _upcomingItems === 'function') {
    todayItems = _upcomingItems(1).filter(i => i.date === todayS);
    todayBills = todayItems.reduce((s, i) => s + i.amount, 0);
  }

  // This-month budget left
  const mSpent = filterTxByAnchor([...txns], 'month', todayS).filter(t => t.type !== 'income').reduce((s, t) => s + (+t.amount || 0), 0);
  const fac = { week: 4.33, month: 1, year: 1 / 12, day: 30.4 };
  const budTot = (STATE.budgets || []).reduce((s, b) => s + Math.round((+b.amount || 0) * (fac[b.period || 'month'] || 1)), 0);
  const budLeft = budTot - mSpent;

  // Warranties / renewals due in the next 7 days
  const in7 = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return _ymdLocal(d); })();
  let renewals = 0;
  (STATE.purchases || []).forEach(p => { if (p.warrantyEnd && p.warrantyEnd >= todayS && p.warrantyEnd <= in7) renewals++; });
  (STATE.investments || []).forEach(i => { if (i.expectedDate && i.expectedDate >= todayS && i.expectedDate <= in7) renewals++; });

  return { ydaySpent, ydayItems: yTx.length, todayBills, todayItems, budTot, budLeft, renewals };
}

function showMorningDigest() {
  const st = _digestStats();
  const name = (STATE.settings && STATE.settings.name) || (STATE.user && STATE.user.name) || 'there';
  const hr = new Date().getHours();
  const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const lines = [];
  lines.push(`Yesterday you spent <b style="color:#ef4444">${fmt(st.ydaySpent)}</b>${st.ydayItems ? ` across ${st.ydayItems} ${st.ydayItems === 1 ? 'item' : 'items'}` : ''}.`);
  if (st.todayBills > 0) lines.push(`<b style="color:#f59e0b">${fmt(st.todayBills)}</b> due today — ${st.todayItems.map(i => esc(i.name)).join(', ')}.`);
  if (st.budTot > 0) lines.push(st.budLeft >= 0
    ? `<b style="color:#10b981">${fmt(st.budLeft)}</b> left in this month's budget.`
    : `<b style="color:#ef4444">${fmt(-st.budLeft)}</b> over your budget this month.`);
  if (st.renewals > 0) lines.push(`<b>${st.renewals}</b> warranty/renewal${st.renewals === 1 ? '' : 's'} coming up in 7 days.`);
  if (lines.length === 1 && !st.ydaySpent) lines[0] = 'No spending logged yesterday — fresh start today! ☀️';

  openModal(`☀️ ${greet}, ${esc(name)}!`, `
    <div style="display:flex;flex-direction:column;gap:12px">
      ${lines.map(l => `<p style="margin:0;font-size:15px;color:var(--text2);line-height:1.55">• ${l}</p>`).join('')}
    </div>
    <div class="modal-actions" style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px">
      ${st.todayBills > 0 ? `<button class="btn-secondary" onclick="closeModal();navigate('upcoming')">See upcoming</button>` : ''}
      <button class="btn-primary" onclick="closeModal()">Got it 👍</button>
    </div>`);
}

// Show once per calendar day, shortly after the app opens.
function maybeShowMorningDigest() {
  try {
    if (!STATE.user) return;
    if (!(STATE.transactions || []).length && !(STATE.budgets || []).length) return;
    const flag = 'lifeos_digest_' + _ymdLocal(new Date());
    if (localStorage.getItem(flag)) return;
    localStorage.setItem(flag, '1');
    setTimeout(() => { try { showMorningDigest(); } catch (_) {} }, 1100);
  } catch (_) {}
}

// Richer month recap (opened from the Records month-end card, or anytime).
function showMonthReview(ymArg) {
  const now = new Date();
  const ym = ymArg || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [yy, mm] = ym.split('-').map(Number);
  const prevD = new Date(yy, mm - 2, 1);
  const prevYm = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}`;
  const txns = STATE.transactions || [];
  const inMonth = v => txns.filter(t => (t.date || '').slice(0, 7) === v);
  const exp = arr => arr.filter(t => t.type !== 'income').reduce((s, t) => s + (+t.amount || 0), 0);
  const inc = arr => arr.filter(t => t.type === 'income').reduce((s, t) => s + (+t.amount || 0), 0);
  const cur = inMonth(ym), prev = inMonth(prevYm);
  const curExp = exp(cur), prevExp = exp(prev), curInc = inc(cur);
  const saved = curInc - curExp, savePct = curInc > 0 ? Math.round(saved / curInc * 100) : 0;
  const diff = curExp - prevExp;
  const byCat = {};
  cur.filter(t => t.type !== 'income').forEach(t => { const c = t.category || 'Other'; byCat[c] = (byCat[c] || 0) + (+t.amount || 0); });
  const top = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const biggest = cur.filter(t => t.type !== 'income').slice().sort((a, b) => (+b.amount) - (+a.amount))[0];
  const monthName = new Date(yy, mm - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  const stat = (lbl, val, col) => `<div style="flex:1;min-width:120px;background:var(--glass);border:1px solid var(--glass-border);border-radius:12px;padding:12px 14px">
    <p style="margin:0;font-size:11px;color:var(--text3)">${lbl}</p><p style="margin:3px 0 0;font-size:20px;font-weight:800;color:${col || 'var(--text1)'}">${val}</p></div>`;
  const diffTxt = prevExp > 0 ? (diff <= 0 ? `↓ ${fmt(-diff)} less than last month 🎉` : `↑ ${fmt(diff)} more than last month`) : '';

  openModal(`📊 ${monthName} in review`, `
    <div class="mr-pop">
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
        ${stat('Spent', fmt(curExp), '#ef4444')}
        ${stat('Earned', fmt(curInc), '#10b981')}
        ${stat(saved >= 0 ? 'Saved' : 'Overspent', fmt(Math.abs(saved)) + (curInc > 0 ? ` (${savePct}%)` : ''), saved >= 0 ? '#00c9a7' : '#ef4444')}
      </div>
      ${diffTxt ? `<p style="margin:0 0 12px;font-size:13px;color:var(--text2)">${diffTxt}</p>` : ''}
      ${top.length ? `<p style="margin:0 0 8px;font-weight:700;font-size:13px;color:var(--text3)">TOP CATEGORIES</p>
        ${top.map(([c, v]) => `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--glass-border)"><span>${esc(c)}</span><b>${fmt(v)}</b></div>`).join('')}` : ''}
      ${biggest ? `<p style="margin:14px 0 0;font-size:13px;color:var(--text2)">Biggest spend: <b>${esc(biggest.description || biggest.category)}</b> — ${fmt(biggest.amount)}</p>` : ''}
      <div class="modal-actions" style="display:flex;justify-content:flex-end;margin-top:18px"><button class="btn-primary" onclick="closeModal()">Done</button></div>
    </div>`);
}
