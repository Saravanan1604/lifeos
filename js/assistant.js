// ============================================================
//  assistant.js — Life OS 2.0 money assistant (build 673, app)
//  Answers money questions straight from the user's own data on
//  this device (nothing is sent anywhere). Uses the smart-search
//  parser for categories / dates / amounts, the home.js facts for
//  forecasts, and clearly labels estimates.
//  Also: voice input, and "I spent 250 on petrol" → a prepared
//  transaction the user confirms in the add screen.
// ============================================================

const _AS_SUGGEST = [
  'How much did I spend this month?', 'Where is my money going?', 'How much did I spend on food?',
  'How much can I spend today?', 'Predict my month-end balance', 'Can I save ₹10,000 this month?',
  'What are my largest expenses?', 'Bills due this month', 'My health score',
];

function renderAssistantApp() {
  const hist = (STATE.chatHistory || []).filter(m => m && m.v2);
  const name = ((STATE.user && STATE.user.name) || '').split(' ')[0];
  document.getElementById('page-container').innerHTML = `
    <div class="fade-in as-page">
      <div class="as-hero ${hist.length ? 'mini' : ''}">
        <div class="as-orb"><i data-lucide="sparkles"></i></div>
        <h1>${hist.length ? 'Money assistant' : `Hi${name ? ' ' + esc(name) : ''}, ask me<br/>about <span>your money</span>`}</h1>
        <p>Answers come from your own data on this phone${hist.length ? '' : ' — nothing is sent anywhere'}.</p>
      </div>
      <div class="as-chat" id="as-chat">${hist.map(_asBubble).join('')}</div>
      <div class="as-chips" id="as-chips">${_AS_SUGGEST.map(s => `<button onclick="assistantAsk(this.textContent)">${s}</button>`).join('')}</div>
      ${hist.length ? `<button class="as-clear" onclick="assistantClear()">Clear conversation</button>` : ''}
    </div>`;
  // The input dock lives on <body>: #page-container is transformed (page
  // animations), which would trap position:fixed inside it.
  let dock = document.getElementById('as-dock');
  if (!dock) { dock = document.createElement('div'); dock.id = 'as-dock'; document.body.appendChild(dock); }
  dock.innerHTML = `<div class="as-bar">
        <button class="as-mic" id="as-mic" onclick="assistantVoice()" title="Speak"><i data-lucide="mic"></i></button>
        <input id="as-input" placeholder="Ask, or say “I spent 250 on petrol”" onkeydown="if(event.key==='Enter')assistantAsk(this.value)" autocomplete="off"/>
        <button class="as-send" onclick="assistantAsk(document.getElementById('as-input').value)" title="Send"><i data-lucide="arrow-up"></i></button>
      </div>`;
  if (window.lucide && lucide.createIcons) { try { lucide.createIcons(); } catch (_) {} }
  _asScroll();
}
// remove the dock when leaving the assistant
(function () {
  const orig = window.navigate;
  if (typeof orig !== 'function' || orig._asWrapped) return;
  const wrapped = function (page) { if (page !== 'ai-coach') { const d = document.getElementById('as-dock'); if (d) d.remove(); } return orig.apply(this, arguments); };
  wrapped._asWrapped = true;
  window.navigate = wrapped;
  try { navigate = wrapped; } catch (_) {}
})();

function _asMd(t) {
  return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/_(.+?)_/g, '<em>$1</em>').replace(/\n/g, '<br/>');
}
function _asBubble(m) {
  if (m.role === 'user') return `<div class="as-msg me"><p>${esc(m.content)}</p></div>`;
  return `<div class="as-msg ai"><span class="as-av"><i data-lucide="sparkles"></i></span><div><p>${_asMd(m.content)}</p>${m.action ? `<button class="as-act" onclick="${m.action.js}">${esc(m.action.label)}</button>` : ''}</div></div>`;
}
function _asScroll() { setTimeout(() => { const c = document.getElementById('as-chat'); if (c && c.lastElementChild) c.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 60); }

function assistantAsk(q) {
  q = (q || '').trim(); if (!q) return;
  const inp = document.getElementById('as-input'); if (inp) inp.value = '';
  STATE.chatHistory = STATE.chatHistory || [];
  const u = { role: 'user', content: q, time: _asNow(), v2: true };
  let r;
  try { r = moneyAnswer(q); } catch (e) { console.log(e); r = { text: "Sorry — I couldn't work that out. Try rephrasing, e.g. “food spending last month”." }; }
  const a = { role: 'ai', content: r.text, action: r.action || null, time: _asNow(), v2: true };
  STATE.chatHistory.push(u, a);
  if (STATE.chatHistory.length > 60) STATE.chatHistory = STATE.chatHistory.slice(-60);
  saveState();
  if (currentPage === 'ai-coach' && document.getElementById('as-chat')) {
    const chat = document.getElementById('as-chat');
    document.querySelector('.as-hero')?.classList.add('mini');
    chat.insertAdjacentHTML('beforeend', _asBubble(u) + _asBubble(a));
    if (window.lucide && lucide.createIcons) { try { lucide.createIcons(); } catch (_) {} }
    _asScroll();
  }
}
function assistantClear() { STATE.chatHistory = (STATE.chatHistory || []).filter(m => !m.v2); saveState(); renderAssistantApp(); }
function _asNow() { return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }

// ── voice (Web Speech API, en-IN) ──
function assistantVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast('Voice isn’t supported here — type instead, or use the mic on your keyboard', 'info'); document.getElementById('as-input')?.focus(); return; }
  const rec = new SR(); rec.lang = 'en-IN'; rec.interimResults = false; rec.maxAlternatives = 1;
  const mic = document.getElementById('as-mic'); mic && mic.classList.add('on');
  rec.onresult = e => { const t = e.results[0][0].transcript; assistantAsk(t); };
  rec.onerror = () => toast('Didn’t catch that — try again', 'warning');
  rec.onend = () => { mic && mic.classList.remove('on'); };
  try { rec.start(); } catch (_) { mic && mic.classList.remove('on'); }
}

// ══════════════════════════════════════════════════════════
// THE ANSWER ENGINE
// ══════════════════════════════════════════════════════════
function _asSum(list) { return list.reduce((s, t) => s + (+t.amount || 0), 0); }
function _asRangeLabel(sq) {
  if (!sq.from) return 'this month';
  const a = new Date(sq.from + 'T00:00:00'), b = new Date(sq.to + 'T00:00:00'), n = new Date();
  const fullMonth = a.getDate() === 1 && b.getMonth() === a.getMonth() && b.getFullYear() === a.getFullYear() && new Date(b.getFullYear(), b.getMonth(), b.getDate() + 1).getDate() === 1;
  if (fullMonth) {
    if (a.getFullYear() === n.getFullYear() && a.getMonth() === n.getMonth()) return 'this month';
    return 'in ' + a.toLocaleDateString('en-IN', { month: 'long', year: a.getFullYear() === n.getFullYear() ? undefined : 'numeric' });
  }
  if (sq.from === sq.to) return sq.from === _ymdLocal(n) ? 'today' : 'on ' + fmtDate(sq.from);
  return `from ${fmtDate(sq.from)} to ${fmtDate(sq.to)}`;
}
function _asThisMonth(sq) {
  if (sq.from) return sq;
  const n = new Date();
  return Object.assign({}, sq, { from: _ymdLocal(new Date(n.getFullYear(), n.getMonth(), 1)), to: _ymdLocal(new Date(n.getFullYear(), n.getMonth() + 1, 0)) });
}

function moneyAnswer(q) {
  const s = q.toLowerCase().replace(/[?!]/g, ' ').replace(/\s+/g, ' ').trim();
  const F = typeof _homeFacts === 'function' ? _homeFacts() : null;

  // 1. "I spent 250 on petrol" / "paid 1200 for rent" / "add 500 food" → prepared transaction
  const addM = s.match(/\b(?:i\s+)?(?:spent|spend|paid|pay|bought|add(?:ed)?|log)\b[^0-9]*?(\d[\d,]*(?:\.\d+)?)\s*(k)?\b(?:\s*(?:rs|rupees|₹))?\s*(?:on|for|at|to)?\s*(.*)$/);
  const isQuestion = /\?|how much|what|where|did i|can i/.test(s);
  if (addM && !isQuestion) {
    const amount = (+addM[1].replace(/,/g, '')) * (addM[2] ? 1000 : 1);
    const what = (addM[3] || '').replace(/\b(today|yesterday|rupees|rs)\b/g, '').trim();
    const cat = _asGuessCategory(what);
    const yest = /\byesterday\b/.test(s);
    const label = `Add ${fmt(amount)} · ${cat}${what ? ' · ' + what : ''}`;
    return {
      text: `Ready to add an **expense of ${fmt(amount)}** in **${cat}**${what ? ` for “${what}”` : ''}${yest ? ' dated yesterday' : ''}. Tap below to check and save it.`,
      action: { label, js: `assistantPrepareTx(${amount},'${cat.replace(/'/g, "\\'")}','${what.replace(/'/g, "\\'")}',${yest})` },
    };
  }

  const sq = typeof _parseSmartQuery === 'function' ? _parseSmartQuery(s.replace(/\b(how much|did i|do i|have i|my|me|what|is|are|was|were|money|total|on|spend|spent|spending|expenses?|this month)\b/g, m => m === 'this month' ? 'this month' : ' ')) : { cats: [], text: '' };

  // 2. health score
  if (/health|score/.test(s) && typeof _homeHealth === 'function') {
    const h = _homeHealth(F);
    return { text: `Your financial health score is **${h.score}/100 — ${h.label}**.\n` + h.parts.map(p => `• ${p.n}: ${p.v}/${p.of} — ${p.d}`).join('\n'), action: { label: 'See breakdown', js: 'openHealthScore()' } };
  }

  // 3. can I save X
  const saveM = s.match(/\bsave\s*(?:rs\.?|₹)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k)?/);
  if (/\bcan i save\b|\bsave\b.*\b(this|by|month)\b/.test(s) && saveM && F) {
    const goal = (+saveM[1].replace(/,/g, '')) * (saveM[2] ? 1000 : 1);
    const p = _asProjection(F);
    if (!p) return { text: 'I need a few days of spending this month before I can project that.' };
    const gap = goal - p.net;
    if (gap <= 0) return { text: `**Yes, likely.** At your current pace you'd finish the month about **${fmt(Math.round(p.net))}** ahead _(estimate)_, which covers ${fmt(goal)} with ${fmt(Math.round(-gap))} to spare.` };
    const perDay = gap / Math.max(1, F.daysLeft);
    return { text: `**Not at your current pace.** You're on track to finish about **${fmt(Math.round(p.net))}** ${p.net >= 0 ? 'ahead' : 'short'} _(estimate)_ — ${fmt(Math.round(gap))} less than ${fmt(goal)}.\nTo get there, cut about **${fmt(Math.ceil(perDay))}/day** for the remaining ${F.daysLeft} day${F.daysLeft > 1 ? 's' : ''}${p.topCat ? `, e.g. from **${p.topCat}**, your biggest category` : ''}.` };
  }

  // 4. spend today / daily allowance
  if (/\b(today|per day|daily|each day)\b/.test(s) && /\b(can|allow|limit|left|safe)\b/.test(s) && F) {
    const spentToday = _asSum((STATE.transactions || []).filter(t => t.type !== 'income' && (t.date || '').slice(0, 10) === _ymdLocal(new Date())));
    if (F.budget) {
      const left = F.budget - F.spent;
      if (left <= 0) return { text: `You're already **${fmt(Math.round(-left))} over** this month's budget, so the safe amount today is **₹0**. You've spent ${fmt(Math.round(spentToday))} today.` };
      return { text: `You can spend about **${fmt(Math.floor(left / F.daysLeft))} today** and stay on budget (${fmt(Math.round(left))} left over ${F.daysLeft} days). You've spent **${fmt(Math.round(spentToday))}** today so far.` };
    }
    const free = F.income + F.incomeLeft - F.spent - F.billsLeft;
    if (free <= 0) return { text: `With this month's income and bills, there's **no spare money left** for the month _(estimate)_. You've spent ${fmt(Math.round(spentToday))} today. Setting a budget will give you a proper daily limit.`, action: { label: 'Set a budget', js: "navigate('budget')" } };
    return { text: `After this month's bills, about **${fmt(Math.floor(free / F.daysLeft))}/day** is free _(estimate, no budget set)_. Spent today: **${fmt(Math.round(spentToday))}**.`, action: { label: 'Set a budget', js: "navigate('budget')" } };
  }

  // 5. forecast / month end
  if (/\b(predict|forecast|month[- ]end|end of (the )?month|will i)\b/.test(s) && F) {
    const p = _asProjection(F);
    if (!p) return { text: 'I need a few days of spending this month before I can forecast.' };
    return { text: `**Month-end forecast** _(estimate)_\n• Spending: **${fmt(Math.round(p.spend))}** (so far ${fmt(Math.round(F.spent))}, plus ~${fmt(Math.round(p.daily))}/day and ${fmt(Math.round(F.billsLeft))} bills still due)\n• Income: **${fmt(Math.round(F.income + F.incomeLeft))}**\n• Net: **${p.net >= 0 ? '+' : '-'}${fmt(Math.round(Math.abs(p.net)))}**${(STATE.bankAccounts || []).length ? `\n• Accounts now ${fmt(Math.round(F.liquid))} → about **${fmt(Math.round(F.liquid + (F.incomeLeft - p.remainingSpend)))}** at month end` : ''}` };
  }

  // 6. largest expenses
  if (/\b(largest|biggest|top|highest|major)\b.*\b(expense|spend|transaction|purchase)s?\b|\bbiggest\b/.test(s)) {
    const r = _asThisMonth(sq);
    const list = (STATE.transactions || []).filter(t => t.type !== 'income' && (t.date || '') >= r.from && (t.date || '').slice(0, 10) <= r.to).sort((a, b) => b.amount - a.amount).slice(0, 5);
    if (!list.length) return { text: `No expenses found for ${_asRangeLabel(r)}.` };
    return { text: `**Largest expenses ${_asRangeLabel(r)}**\n` + list.map((t, i) => `${i + 1}. ${fmt(t.amount)} · ${t.category}${t.description ? ' — ' + t.description : ''} (${fmtDate(t.date)})`).join('\n') };
  }

  // 7. where is money going
  if (/\b(where|breakdown|categor(y|ies)|split|going)\b/.test(s) && !sq.cats.length) {
    const r = _asThisMonth(sq);
    const by = {};
    (STATE.transactions || []).filter(t => t.type !== 'income' && (t.date || '') >= r.from && (t.date || '').slice(0, 10) <= r.to)
      .forEach(t => { by[t.category || 'Other'] = (by[t.category || 'Other'] || 0) + (+t.amount || 0); });
    const tot = Object.values(by).reduce((a, b) => a + b, 0);
    if (!tot) return { text: `No spending found for ${_asRangeLabel(r)}.` };
    const ent = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { text: `You spent **${fmt(Math.round(tot))}** ${_asRangeLabel(r)}. It went to:\n` + ent.map(([c, v]) => `• **${c}** ${fmt(Math.round(v))} (${Math.round(v / tot * 100)}%)`).join('\n'), action: { label: 'Open Analytics', js: "navigate('spending')" } };
  }

  // 8. bills
  if (/\b(bills?|due|upcoming|subscriptions?|emi)\b/.test(s) && typeof _billsDue === 'function') {
    const due = _billsDue(31);
    if (!due.length) return { text: 'No recurring bills due in the next 31 days.' };
    const tot = due.reduce((a, x) => a + (+x.r.amount || 0), 0);
    return { text: `**${due.length} bill${due.length > 1 ? 's' : ''} due in the next 31 days — ${fmt(Math.round(tot))}**\n` + due.slice(0, 8).map(x => `• ${x.r.description || x.r.category}: ${fmt(x.r.amount)} on ${fmtDate(x.r.nextDate)}`).join('\n'), action: { label: 'See upcoming', js: "navigate('upcoming')" } };
  }

  // 9. loans / debt
  if (/\b(loans?|debts?|emis?|owe|debt[- ]free)\b/.test(s) && (STATE.loans || []).length && typeof _loanPayoff === 'function') {
    const lines = (STATE.loans || []).map(l => { const p = _loanPayoff(l); return `• ${l.name}: ${fmt(Math.round(p.out || 0))} left${p.months ? `, free by **${p.end.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}**` : p.never ? ' — **EMI below interest, never closes**' : ''}`; });
    return { text: `**Your loans**\n${lines.join('\n')}`, action: { label: 'Open liabilities', js: "navigate('investments')" } };
  }

  // 10. balance / accounts
  if (/\b(balance|bank|account|cash in hand|how much (do i )?have)\b/.test(s)) {
    const banks = STATE.bankAccounts || [];
    if (!banks.length) return { text: 'No bank accounts added yet.', action: { label: 'Add an account', js: "navigate('finance')" } };
    const tot = banks.reduce((a, b) => a + (+b.balance || 0), 0);
    return { text: `**${fmt(Math.round(tot))}** across ${banks.length} account${banks.length > 1 ? 's' : ''}:\n` + banks.map(b => `• ${b.bankName}: ${fmt(b.balance || 0)}`).join('\n') + (F && F.cardDue ? `\nCard dues: ${fmt(Math.round(F.cardDue))}` : '') };
  }

  // 11. income / spend totals (default) — "how much did I spend on food last month"
  const wantsIncome = /\b(earn|earned|income|received|salary|got)\b/.test(s);
  const r = _asThisMonth(sq);
  const base = (STATE.transactions || []).filter(t => (t.date || '').slice(0, 10) >= r.from && (t.date || '').slice(0, 10) <= r.to);
  let list = base.filter(t => wantsIncome ? t.type === 'income' : t.type !== 'income');
  if (sq.cats && sq.cats.length) list = list.filter(t => sq.cats.includes(t.category));
  if (sq.text) { const w = sq.text.split(/\s+/).filter(x => x.length > 2); if (w.length) { const hit = list.filter(t => w.some(x => ((t.description || '') + ' ' + (t.category || '')).toLowerCase().includes(x))); if (hit.length) list = hit; } }
  if (sq.min != null) list = list.filter(t => t.amount >= sq.min);
  if (sq.max != null) list = list.filter(t => t.amount <= sq.max);
  const tot = _asSum(list);
  const what = sq.cats && sq.cats.length ? ` on **${sq.cats.join(', ')}**` : '';
  // same-length previous period for context
  const d0 = new Date(r.from + 'T00:00:00'), d1 = new Date(r.to + 'T00:00:00');
  const span = Math.round((d1 - d0) / 86400000) + 1;
  const p1 = new Date(d0); p1.setDate(p1.getDate() - 1); const p0 = new Date(p1); p0.setDate(p0.getDate() - span + 1);
  let prevList = (STATE.transactions || []).filter(t => (t.date || '').slice(0, 10) >= _ymdLocal(p0) && (t.date || '').slice(0, 10) <= _ymdLocal(p1) && (wantsIncome ? t.type === 'income' : t.type !== 'income'));
  if (sq.cats && sq.cats.length) prevList = prevList.filter(t => sq.cats.includes(t.category));
  const prev = _asSum(prevList);
  const cmp = prev > 0 ? ` That's **${tot >= prev ? '▲' : '▼'} ${Math.abs(Math.round((tot / prev - 1) * 100))}%** vs the previous ${span} days (${fmt(Math.round(prev))}).` : '';
  if (!list.length) return { text: `No ${wantsIncome ? 'income' : 'spending'}${what} found for ${_asRangeLabel(r)}.` };
  return {
    text: `You ${wantsIncome ? 'received' : 'spent'} **${fmt(Math.round(tot))}**${what} ${_asRangeLabel(r)} across ${list.length} transaction${list.length > 1 ? 's' : ''}.${cmp}`,
    action: { label: 'Show these in Records', js: `setRecSmartSearch(${JSON.stringify(q).replace(/"/g, '&quot;')});navigate('transactions')` },
  };
}

function _asProjection(F) {
  if (!F || F.day < 2) return null;
  const daily = F.spent / F.day;
  const remainingSpend = daily * (F.daysLeft - 1) + F.billsLeft;
  const spend = F.spent + remainingSpend;
  const net = F.income + F.incomeLeft - spend;
  const top = Object.entries(F.byCat).sort((a, b) => b[1] - a[1])[0];
  return { daily, spend, net, remainingSpend, topCat: top ? top[0] : null };
}

function _asGuessCategory(what) {
  const w = (what || '').toLowerCase().trim();
  const cats = typeof getAllCategories === 'function' ? getAllCategories().filter(c => c.type !== 'income') : [];
  if (w) {
    const rule = typeof getCategoryRule === 'function' ? getCategoryRule(w) : null;
    if (rule) return rule;
    const direct = cats.find(c => w.includes(c.name.toLowerCase()));
    if (direct) return direct.name;
    const map = [[/petrol|diesel|fuel|bunk/, 'Fuel'], [/swiggy|zomato|food|lunch|dinner|breakfast|tea|coffee|biryani|hotel|restaurant|snack/, 'Food'],
      [/grocer|vegetable|milk|rice|kirana|supermarket/, 'Groceries'], [/uber|ola|auto|bus|train|metro|cab|taxi|rapido/, 'Transport'],
      [/amazon|flipkart|myntra|shopping|dress|shirt|shoe/, 'Shopping'], [/rent/, 'Rent'], [/emi|loan/, 'EMI'],
      [/electric|eb bill|water|gas|recharge|wifi|internet|mobile|bill/, 'Bills'], [/doctor|medicine|hospital|pharmacy|medical/, 'Health'],
      [/movie|netflix|prime|hotstar|game/, 'Entertainment'], [/gift/, 'Gifts'], [/school|college|fees|course|book/, 'Education'], [/trip|travel|flight|ticket/, 'Travel']];
    for (const [re, name] of map) if (re.test(w) && cats.some(c => c.name === name)) return name;
  }
  return cats.some(c => c.name === 'Other') ? 'Other' : (cats[0] ? cats[0].name : 'Other');
}

function assistantPrepareTx(amount, cat, note, yesterday) {
  if (typeof openTxPad !== 'function') return;
  openTxPad('expense');
  _pad.expr = String(amount);
  _pad.category = cat;
  _pad.notes = note || '';
  if (yesterday) { const d = new Date(); d.setDate(d.getDate() - 1); _pad.date = _ymdLocal(d); }
  renderTxPad();
  toast('Check the details, then tap Save', 'info');
}
