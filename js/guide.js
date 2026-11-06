// ============================================================
//  guide.js — "How to use atworth" (build 688, app)
//   • Guide page: live quick-start checklist, how-to topics with
//     "Show me" buttons, gestures, FAQ, search, feedback.
//   • 1-minute spotlight tour of the main controls (auto once,
//     replayable from the Guide / Settings).
// ============================================================

const GUIDE_TOPICS = [
  { ic: 'home', t: 'Your Home screen', k: 'home balance budget insights',
    b: ['<b>Balance card</b> shows this month\'s surplus or deficit. Tap 👁 to hide amounts, tap <b>In accounts</b> to see bank balances.',
        '<b>Quick actions</b> under it: add an expense or income, transfer between accounts, scan a bank SMS, see bills.',
        '<b>Budget ring</b>: how much of your monthly budget is used and how much you can spend <b>per day</b>.',
        '<b>Your money, explained</b>: plain-language insights + your <b>health score</b> (tap it for the breakdown).',
        'Scroll down for charts and your recent transactions.'],
    go: "navigate('transactions')" },
  { ic: 'plus-circle', t: 'Add an expense or income', k: 'add expense income save amount',
    b: ['Tap the purple <b>+</b> in the bottom bar.', 'Pick <b>Expense</b> or <b>Income</b>, type the amount (or tap a usual amount chip).',
        'Set <b>Category</b>, <b>Account</b> and add a note like "Swiggy" — then <b>Save</b>.',
        'Use <b>Repeat</b> for monthly bills (rent, EMI, Netflix) — they post automatically.',
        'Or say it: tap ✨ and type/speak <i>"I spent 250 on petrol"</i>.'],
    go: "openTxPad('expense')" },
  { ic: 'pencil', t: 'Edit, delete & recategorise', k: 'edit delete swipe category same name',
    b: ['<b>Tap</b> a transaction to edit it.', '<b>Swipe</b> it sideways to reveal Edit / Delete.',
        '<b>Long-press</b> to select several, then change category or delete together.',
        'Tap the <b>coloured circle</b> to change category in one tap — every entry with the <b>same name</b> moves too, and new ones are remembered.'],
    go: "navigate('transactions')" },
  { ic: 'search', t: 'Search like you talk', k: 'search filter find',
    b: ['Tap the <b>filter</b> button above your transactions (or 🔍 at the top).',
        'Type things like <i>food &gt; 500 last month</i>, <i>swiggy under 300</i>, <i>income this week</i>, <i>shopping above 2k march</i>.'],
    go: "typeof openRecordsFilter==='function'&&openRecordsFilter()" },
  { ic: 'target', t: 'Budgets & alerts', k: 'budget limit alert warning',
    b: ['Open <b>Analytics → Budget & categories</b>, or tap the budget ring on Home.',
        'Set a monthly limit per category. You\'re warned at <b>80%</b> and <b>100%</b> (once each, not repeatedly).',
        'Turn alert types on/off in <b>Analytics → Forecast & automation</b>.'],
    go: "navigate('budget')" },
  { ic: 'calendar-clock', t: 'Bills, EMIs & subscriptions', k: 'bills recurring emi subscription upcoming',
    b: ['Recurring payments appear in <b>Upcoming</b> and in the 🔔 bell 3 days before they\'re due.',
        'Tap <b>Paid now</b> to log it early, or <b>Skip</b> for this month.',
        '<b>Forecast & automation</b> finds repeating payments you haven\'t set up — tap <b>Track</b>.'],
    go: "navigate('upcoming')" },
  { ic: 'pie-chart', t: 'Analytics & forecast', k: 'analytics chart trend forecast cash flow',
    b: ['Bottom bar → <b>Analytics</b>. Switch Week / Month / Quarter / Year; ‹ › goes back in time.',
        'See cash flow, income vs expense, budget vs actual, and where your money went.',
        '<b>Forecast & automation</b> projects your bank balance 30 / 90 days ahead and warns before you run short.'],
    go: "navigate('insights')" },
  { ic: 'landmark', t: 'Assets, loans & debt-free date', k: 'assets loans net worth debt emi',
    b: ['Bottom bar → <b>Assets</b>. Your net worth = what you <b>own</b> − what you <b>owe</b>.',
        'Tap <b>You own</b> / <b>You owe</b> to switch lists. Add assets (gold, FD, plot, money lent) and loans with EMI.',
        'On <b>You owe</b>, slide <b>"What if I pay extra?"</b> to see a new debt-free date and interest saved.'],
    go: "navigate('investments')" },
  { ic: 'wallet', t: 'Bank accounts, cash & cards', k: 'bank account balance card cash finance',
    b: ['Home → <b>In accounts</b> (or Menu → Finance).', 'Tap a bank\'s balance to update it; the ⋯ menu has edit, import, export, mark inactive and delete.',
        'Unused account? <b>Mark as inactive</b> so it stops low-balance alerts.'],
    go: "navigate('finance')" },
  { ic: 'sparkles', t: 'Ask the AI assistant', k: 'ai assistant coach ask question voice',
    b: ['Tap ✨ at the top. The <b>Data Coach</b> summarises income, expenses and cash flow with recommendations.',
        'Ask: <i>"Where is my money going?"</i>, <i>"Can I save ₹10,000?"</i>, <i>"How much can I spend today?"</i>.',
        'Everything is worked out on your phone from your own data. Estimates are labelled.'],
    go: "navigate('ai-coach')" },
  { ic: 'bell', t: 'Alerts center', k: 'alerts notifications bell',
    b: ['Tap 🔔. Filter by <b>Critical / Warning / Info / Success</b>.', 'Mark read, dismiss, or open the related page. Dismissed alerts stay in history.'],
    go: "openNotifPanel()" },
  { ic: 'refresh-cw', t: 'Sync, backup & devices', k: 'sync backup cloud login device',
    b: ['Sign in and your data syncs automatically between phone and web (<b>lifeos-psi-roan.vercel.app</b>).',
        'Pull down on Home to sync now. Changes made offline are sent when you\'re back online.',
        'Settings → <b>Backup & Data</b> to export JSON / CSV or back up to Google Drive.'],
    go: "navigate('settings')" },
  { ic: 'palette', t: 'Day / Night theme', k: 'theme dark light day night',
    b: ['Settings → <b>Theme</b>: <b>Day</b>, <b>Night</b> (OLED) or <b>System</b> (follows your phone).'],
    go: "navigate('settings')" },
];

const GUIDE_FAQ = [
  ['Why does Home say "Deficit this month"?', 'You\'ve spent more than the income logged this month. If your salary isn\'t logged yet, add it as Income.'],
  ['Why did my net-worth trend suddenly drop?', 'Usually because a loan or asset was added or edited — the trend records a daily snapshot of the totals.'],
  ['An EMI shows twice in Upcoming?', 'Fixed in build 684: a loan EMI that matches a recurring payment is counted once. Update the app if you still see it.'],
  ['I changed something on the web but not on my phone?', 'Pull down on Home to sync, or fully close and reopen the app.'],
  ['How do I see the latest version?', 'Fully close the app and reopen it. Settings shows the build number.'],
];

function _guideChecklist() {
  const s = STATE;
  const has = k => Array.isArray(s[k]) && s[k].length > 0;
  return [
    { done: has('bankAccounts') || has('cashAccounts'), t: 'Add a bank account or cash wallet', js: "navigate('finance')" },
    { done: (s.transactions || []).some(t => t.type === 'income'), t: 'Log your income (e.g. salary)', js: "openTxPad('income')" },
    { done: (s.transactions || []).some(t => t.type !== 'income'), t: 'Add your first expense', js: "openTxPad('expense')" },
    { done: has('budgets'), t: 'Set a monthly budget', js: "navigate('budget')" },
    { done: has('recurring'), t: 'Set up a repeating bill (rent, EMI, OTT)', js: "navigate('recurring')" },
    { done: has('loans') || has('investments'), t: 'Add an asset or loan to see net worth', js: "navigate('investments')" },
  ];
}

function renderGuideApp() {
  const list = _guideChecklist(), done = list.filter(x => x.done).length;
  const pct = Math.round(done / list.length * 100);
  document.getElementById('page-container').innerHTML = `
    <div class="fade-in an-page gd">
      <div class="an-top"><h1 class="an-title">How to use atworth</h1></div>
      <p class="up-sub">Your money, budgets, bills and net worth in one place. Start here.</p>

      <button class="gd-tour" onclick="startAppTour(true)"><span><i data-lucide="play"></i></span><div><b>Take the 1-minute tour</b><em>We'll point out each button on the Home screen</em></div><i data-lucide="chevron-right"></i></button>

      <div class="hx-card gd-check">
        <div class="hx-an-head"><p class="hx-t">Quick start</p><span class="an-sub">${done} of ${list.length} done</span></div>
        <div class="gd-prog"><i style="width:${pct}%"></i></div>
        ${list.map(x => `<button class="gd-step ${x.done ? 'done' : ''}" onclick="${x.js}"><span class="gd-tick">${x.done ? '<i data-lucide="check"></i>' : ''}</span><span>${x.t}</span>${x.done ? '' : '<i data-lucide="chevron-right" class="gd-chev"></i>'}</button>`).join('')}
      </div>

      <div class="gd-search"><i data-lucide="search"></i><input placeholder="Search the guide… (e.g. budget, EMI, search)" oninput="guideFilter(this.value)"/></div>

      <div id="gd-topics">${GUIDE_TOPICS.map((g, i) => `
        <details class="gd-topic" data-k="${(g.t + ' ' + g.k).toLowerCase()}" ${i === 0 ? 'open' : ''}>
          <summary><span class="gd-ic"><i data-lucide="${g.ic}"></i></span><b>${g.t}</b><i data-lucide="chevron-down" class="gd-dn"></i></summary>
          <ol>${g.b.map(x => `<li>${x}</li>`).join('')}</ol>
          <button class="gd-show" onclick="${g.go}">Show me <i data-lucide="arrow-right"></i></button>
        </details>`).join('')}</div>

      <div class="hx-card gd-gest">
        <p class="hx-t">Gestures</p>
        <div class="gd-g"><span>Tap</span><p>open / edit a transaction</p></div>
        <div class="gd-g"><span>Swipe</span><p>reveal Edit / Delete on a row</p></div>
        <div class="gd-g"><span>Long-press</span><p>select many rows</p></div>
        <div class="gd-g"><span>Pull down</span><p>sync now (on Home)</p></div>
        <div class="gd-g"><span>Tap a bar</span><p>see its exact amount</p></div>
      </div>

      <p class="up-g">Questions</p>
      ${GUIDE_FAQ.map(([q, a]) => `<details class="gd-faq" data-k="${(q + ' ' + a).toLowerCase()}"><summary>${q}</summary><p>${a}</p></details>`).join('')}

      <div class="hx-card gd-fb">
        <p class="hx-t">Something unclear?</p>
        <p class="hx-s">Tell us what to improve.</p>
        <select id="help-feedback-type" class="form-input"><option>Suggestion</option><option>Bug</option><option>Question</option></select>
        <textarea id="help-feedback-msg" class="form-input" rows="3" placeholder="Type your feedback…"></textarea>
        <button class="btn-primary" onclick="sendFeedback()">Send feedback</button>
      </div>
    </div>`;
  if (window.lucide && lucide.createIcons) { try { lucide.createIcons(); } catch (_) {} }
}
function guideFilter(q) {
  q = (q || '').toLowerCase().trim();
  document.querySelectorAll('.gd-topic, .gd-faq').forEach(el => {
    const hit = !q || el.dataset.k.includes(q);
    el.style.display = hit ? '' : 'none';
    if (q && hit && el.classList.contains('gd-topic')) el.open = true;
  });
}

// ══════════════════════════════════════════════════════════
// SPOTLIGHT TOUR
// ══════════════════════════════════════════════════════════
const _TOUR = [
  { sel: '.mymoney-records .mm-hero', t: 'Your month at a glance', d: 'Surplus or deficit this month, income and expenses. Tap 👁 to hide amounts.' },
  { sel: '.hx-qa', t: 'Quick actions', d: 'Add an expense or income, transfer, scan a bank SMS or see bills — one tap each.' },
  { sel: '#fab-add', t: 'Add anything', d: 'The purple + adds a transaction from any screen.' },
  { sel: '.hx-budget, .hx-budget-empty', t: 'Budget ring', d: 'How much of your monthly budget is used and what you can spend per day.' },
  { sel: '#top-tools [data-hdr="ai"]', t: 'Ask your money', d: 'Questions like "Where is my money going?" answered from your own data.' },
  { sel: '#tt-bell', t: 'Alerts', d: 'Budget warnings, bills due and unusual spends — filter, mark read or dismiss.' },
  { sel: '#bottom-nav .bn-item[data-page="insights"]', t: 'Analytics', d: 'Trends, cash-flow forecast, subscriptions and budget vs actual.' },
  { sel: '#bottom-nav .bn-item[data-page="investments"]', t: 'Assets & loans', d: 'Net worth = what you own − what you owe, plus your debt-free date.' },
  { sel: '#mobile-menu-btn', t: 'Everything else', d: 'Menu has Finance, Goals, Notes, Settings and this Guide (How to use).' },
];
let _tourI = 0;
function startAppTour(force) {
  if (!window.__IS_APP) return;
  if (currentPage !== 'transactions' || (_recPeriod && _recPeriod !== 'month')) { navigate('transactions'); setTimeout(() => startAppTour(force), 450); return; }
  _tourI = 0;
  let ov = document.getElementById('tour-ov');
  if (!ov) { ov = document.createElement('div'); ov.id = 'tour-ov'; document.body.appendChild(ov); }
  _tourShow();
}
function _tourShow() {
  const ov = document.getElementById('tour-ov'); if (!ov) return;
  // skip steps whose target isn't on screen
  while (_tourI < _TOUR.length && !document.querySelector(_TOUR[_tourI].sel)) _tourI++;
  if (_tourI >= _TOUR.length) return tourEnd();
  const st = _TOUR[_tourI], el = document.querySelector(st.sel);
  el.scrollIntoView({ block: 'center', behavior: 'instant' });
  setTimeout(() => {
    const r = el.getBoundingClientRect(), pad = 6;
    const below = r.top + r.height / 2 < innerHeight / 2;
    ov.innerHTML = `<div class="tour-hole" style="left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px"></div>
      <div class="tour-tip" style="${below ? `top:${Math.min(innerHeight - 190, r.bottom + 14)}px` : `bottom:${Math.min(innerHeight - 190, innerHeight - r.top + 14)}px`}">
        <p class="tour-n">${_tourI + 1} / ${_TOUR.length}</p><b>${st.t}</b><p>${st.d}</p>
        <div class="tour-a"><button onclick="tourEnd()">Skip</button><span></span>${_tourI ? '<button onclick="_tourI--;_tourShow()">Back</button>' : ''}<button class="nx" onclick="_tourI++;_tourShow()">${_tourI === _TOUR.length - 1 ? 'Done' : 'Next'}</button></div>
      </div>`;
  }, 60);
}
function tourEnd() {
  const ov = document.getElementById('tour-ov'); if (ov) ov.remove();
  try { localStorage.setItem('lifeos_tour3_done', '1'); } catch (_) {}
}
// Show once after this update (and after onboarding for new users)
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    try {
      if (!window.__IS_APP || !STATE.user || localStorage.getItem('lifeos_tour3_done')) return;
      if (document.getElementById('ob-overlay') || document.querySelector('.ob-overlay')) return;
      if (document.getElementById('modal-overlay')?.style.display === 'flex') return;
      startAppTour(false);
    } catch (_) {}
  }, 3500);
});
