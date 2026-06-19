// ===== HELP & SUPPORT PAGE =====

let _helpOpenAccordion = null;

function toggleHelpAccordion(id) {
  const body = document.getElementById('ha-' + id);
  const icon = document.getElementById('hi-' + id);
  if (!body) return;
  const isOpen = body.style.maxHeight && body.style.maxHeight !== '0px';
  // Close all
  document.querySelectorAll('[id^="ha-"]').forEach(el => { el.style.maxHeight = '0px'; el.style.opacity = '0'; });
  document.querySelectorAll('[id^="hi-"]').forEach(el => { el.textContent = '+'; });
  if (!isOpen) {
    body.style.maxHeight = body.scrollHeight + 'px';
    body.style.opacity = '1';
    if (icon) icon.textContent = '−';
  }
}

function filterHelp(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('.help-item').forEach(el => {
    el.style.display = (el.textContent.toLowerCase().includes(q) || !q) ? '' : 'none';
  });
}

function sendFeedback() {
  const msg = (document.getElementById('help-feedback-msg')?.value || '').trim();
  const type = document.getElementById('help-feedback-type')?.value || 'General';
  if (!msg) { toast('Please enter your feedback', 'error'); return; }
  // Store locally
  STATE.feedbackLog = STATE.feedbackLog || [];
  STATE.feedbackLog.push({ type, msg, date: new Date().toISOString() });
  saveState();
  document.getElementById('help-feedback-msg').value = '';
  toast('✅ Feedback submitted — thank you!', 'success');
  addXP(5, 'Feedback shared');
}

function renderHelp() {
  const STEPS = [
    { n:1, icon:'💰', title:'Add Your Income',    desc:'Go to Finance → tap + Add Transaction → select Income. Log your salary, business income, or any earnings.',      page:'finance'      },
    { n:2, icon:'💸', title:'Track Expenses',      desc:'Log every expense to Finance. Use categories like Food, Rent, EMI. The app auto-tracks your spending patterns.',   page:'finance'      },
    { n:3, icon:'🏦', title:'Link Bank Accounts',  desc:'Go to Bank Tracker → add your bank accounts and credit cards. Manually update balances or link transactions.',    page:'bank-tracker' },
    { n:4, icon:'🎯', title:'Set a Budget',        desc:'Open Budget Planner → tap + Add Budget → pick a category and set a monthly limit. Track spending in real-time.', page:'budget'       },
    { n:5, icon:'📈', title:'Add Assets & Loans',  desc:'Go to All Assets → add investments (FD, Gold, Stocks) and track loans. See your full net worth picture.',        page:'investments'  },
    { n:6, icon:'✅', title:'Build Habits',         desc:'Open Habits → create daily habits and check them off each day to build your streak and earn XP.',               page:'habits'       },
  ];

  const FEATURES = [
    { icon:'📊', title:'Dashboard',      page:'dashboard',    desc:'Your command center. See net worth, income, expenses, life score, and quick links to everything. Charts update in real-time as you log data.' },
    { icon:'💳', title:'Finance',        page:'finance',      desc:'Log income and expenses. Add transactions with categories, dates, descriptions, and link them to a source account so balances update automatically. Supports Bank, Cash, and Credit Card sources.' },
    { icon:'🏦', title:'Bank Tracker',   page:'bank-tracker', desc:'Manage Bank accounts, Credit Cards, and Cash wallets. Log balance snapshots, view 30-day trends, and track outstanding credit card amounts. Each account shows a full chat-style history.' },
    { icon:'💰', title:'Budget Planner', page:'budget',       desc:'Set spending limits per category (daily/monthly/yearly). The budget overview shows total budget, total spent, remaining, and a doughnut breakdown. Get instant over-budget alerts.' },
    { icon:'📈', title:'All Assets',     page:'investments',  desc:'Track investments (Fixed Deposit, Gold, Stocks, Real Estate) and loans. See Asset Allocation and Liability charts side by side, with live P&L and ROI calculations.' },
    { icon:'❤️', title:'Health Hub',     page:'health',       desc:'Log mood, sleep, steps, weight, and water daily. View 7-day trends and health score. Your health data feeds into the Life Score radar on the dashboard.' },
    { icon:'🔥', title:'Habits',         page:'habits',       desc:'Create daily habits and check them off to build streaks. Earn XP for completions. Your habit streak and completion rate feed into your Productivity score.' },
    { icon:'🎯', title:'Goals',          page:'goals',        desc:'Set financial and life goals with target amounts and deadlines. Track progress with visual bars. Auto-sync pulls savings data from your transactions.' },
    { icon:'📓', title:'Journal',        page:'journal',      desc:'Write daily entries with mood tags. Your journal mood data feeds into the Emotional score. Use it for reflection, gratitude, or planning.' },
    { icon:'🤖', title:'AI Coach',       page:'ai-coach',     desc:'Chat with your AI financial assistant. Ask about your spending, get savings advice, budget suggestions, and personalized insights based on your atworth data.' },
    { icon:'📉', title:'Analytics',      page:'analytics',    desc:'Deep-dive charts: income trends, expense breakdown, savings rate, habit streaks, net worth over time. See your full financial picture in one place.' },
    { icon:'⚙️', title:'Settings',       page:'settings',     desc:'Update your name, currency, theme (dark/light), notifications, and data management options. Export or reset your data from here.' },
  ];

  const FAQS = [
    { q:'How does the balance auto-update work?',        a:'When you add a transaction and select a source account (Bank, Cash, or Credit Card), the account balance updates automatically. Bank/Cash income increases balance; expense decreases it. Credit Card expenses increase outstanding; income reduces it.' },
    { q:'What is Net Worth and how is it calculated?',   a:'Net Worth = Bank Balances + Cash Balances − Credit Card Outstanding. If you have no accounts added, it falls back to Total Income − Total Expense from transactions.' },
    { q:'What is the Life Score?',                       a:'Life Score (0-100) is the average of 5 area scores: Wealth (savings rate + investments), Health (mood + sleep), Productivity (habit completion), Career (skills + job apps), and Emotional (journal mood). It updates as you log data.' },
    { q:'Can I add custom categories?',                  a:'Yes! Go to Settings → Categories (or the Categories page) to add your own custom income and expense categories with custom icons.' },
    { q:'How do I handle double-entry detection?',       a:'When you log a transaction, the app checks for matching amount + date + description combinations. If a potential duplicate is found, you get a warning before saving — you can confirm or cancel.' },
    { q:'How does the 50/30/20 rule work?',              a:'The 50/30/20 rule suggests: 50% of income on Needs (Rent, EMI, Bills), 30% on Wants (Shopping, Entertainment), 20% on Savings. The Budget Planner helps you track this split.' },
    { q:'Can I use the app offline?',                    a:'Yes! atworth works fully offline. All data is stored locally in your browser. If you are connected, data syncs automatically.' },
    { q:'How do I export my data?',                      a:'Go to Settings → scroll to Data Management → tap Export Data. Your full financial history downloads as a JSON file you can keep as a backup.' },
    { q:'What is XP and Level?',                         a:'XP (Experience Points) are earned for actions like logging transactions (+10), completing habits (+5), and sharing feedback (+5). Accumulate XP to level up from Beginner to atworth Pro.' },
    { q:'How do I reset the app?',                       a:'Settings → Data Management → Reset All Data. This permanently clears everything. Export your data first as a backup!' },
  ];

  const TIPS = [
    { icon:'⚡', tip:'Link every transaction to a source account so your bank/cash/card balances stay accurate automatically — no manual balance editing needed.' },
    { icon:'📅', tip:'Log expenses the same day they happen. The habit takes 2 minutes and saves hours of guessing at month-end.' },
    { icon:'🎯', tip:'Set a budget for your top 3 expense categories first (usually Food, Transport, Shopping). You can add more later.' },
    { icon:'🔁', tip:'Use the period tabs (Day / Week / Month / Year) on the Dashboard to slice your data and spot trends at different timeframes.' },
    { icon:'📈', tip:'Add all your investments — even small ones. Seeing your total net worth grow is the best motivation to save more.' },
    { icon:'🏆', tip:'Check off habits every day to build your streak. A 7-day streak unlocks the "Consistent" achievement and boosts your Productivity score.' },
    { icon:'💬', tip:'Use the AI Coach to ask "Why is my spending high this month?" — it will analyze your logged transactions and give specific advice.' },
    { icon:'🌙', tip:'Log your mood and sleep in Health Hub daily. Your average sleep quality directly impacts your Health score.' },
    { icon:'📤', tip:'Export your data monthly as a backup from Settings. Your data lives locally — a backup protects against browser data clearing.' },
    { icon:'🎨', tip:'Switch to Light Mode from the sun button (top-right) if you prefer a brighter interface.' },
  ];

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header" style="margin-bottom:24px">
        <h1 class="page-title">❓ Help & Support</h1>
        <p class="page-subtitle">Guides, tips and answers to get the most out of atworth</p>
      </div>

      <!-- Search -->
      <div class="glass-card" style="padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:10px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Search help topics…" oninput="filterHelp(this.value)"
          style="flex:1;background:transparent;border:none;outline:none;font-size:14px;color:var(--text1)"/>
      </div>

      <!-- ── Getting Started ───────────────────────────────────────── -->
      <div class="glass-card help-item" style="padding:22px;margin-bottom:16px">
        <p class="section-title" style="margin-bottom:18px">🚀 Getting Started — 6 Steps</p>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px" class="help-steps-grid">
          ${STEPS.map(s=>`
            <div onclick="navigate('${s.page}')" class="help-item" style="padding:14px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);cursor:pointer;transition:.2s"
              onmouseover="this.style.background='rgba(0,201,167,0.08)';this.style.borderColor='rgba(0,201,167,0.25)'"
              onmouseout="this.style.background='rgba(255,255,255,0.04)';this.style.borderColor='rgba(255,255,255,0.08)'">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <span style="width:22px;height:22px;border-radius:50%;background:rgba(0,201,167,0.15);border:1px solid rgba(0,201,167,0.3);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#00c9a7;flex-shrink:0">${s.n}</span>
                <span style="font-size:16px">${s.icon}</span>
                <span style="font-size:12px;font-weight:700;color:var(--text1)">${s.title}</span>
              </div>
              <p style="font-size:11px;color:var(--text3);line-height:1.5">${s.desc}</p>
              <p style="font-size:10px;color:#00c9a7;margin-top:8px;font-weight:600">Open →</p>
            </div>`).join('')}
        </div>
      </div>

      <!-- ── Feature Guide ─────────────────────────────────────────── -->
      <div class="glass-card help-item" style="padding:22px;margin-bottom:16px">
        <p class="section-title" style="margin-bottom:16px">📖 Feature Guide</p>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${FEATURES.map((f,i)=>`
            <div class="help-item" style="border-radius:10px;border:1px solid rgba(255,255,255,0.07);overflow:hidden">
              <button onclick="toggleHelpAccordion(${i})" style="width:100%;display:flex;align-items:center;gap:10px;padding:13px 16px;background:rgba(255,255,255,0.03);border:none;cursor:pointer;text-align:left"
                onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                <span style="font-size:18px">${f.icon}</span>
                <span style="font-size:13px;font-weight:600;color:var(--text1);flex:1">${f.title}</span>
                <span id="hi-${i}" style="font-size:16px;color:#00c9a7;font-weight:300;width:18px;text-align:center">+</span>
              </button>
              <div id="ha-${i}" style="max-height:0;opacity:0;overflow:hidden;transition:max-height .3s ease,opacity .25s ease">
                <div style="padding:0 16px 14px 46px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
                  <p style="font-size:12px;color:var(--text3);line-height:1.6">${f.desc}</p>
                  <button onclick="navigate('${f.page}')" style="flex-shrink:0;padding:5px 12px;border-radius:20px;background:rgba(0,201,167,0.12);border:1px solid rgba(0,201,167,0.3);color:#00c9a7;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap">Open →</button>
                </div>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- ── FAQ ──────────────────────────────────────────────────── -->
      <div class="glass-card help-item" style="padding:22px;margin-bottom:16px">
        <p class="section-title" style="margin-bottom:16px">❓ Frequently Asked Questions</p>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${FAQS.map((f,i)=>`
            <div class="help-item" style="border-radius:10px;border:1px solid rgba(255,255,255,0.07);overflow:hidden">
              <button onclick="toggleHelpAccordion('faq${i}')" style="width:100%;display:flex;align-items:center;gap:10px;padding:13px 16px;background:rgba(255,255,255,0.03);border:none;cursor:pointer;text-align:left"
                onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                <span style="font-size:13px;font-weight:600;color:var(--text1);flex:1">${f.q}</span>
                <span id="hi-faq${i}" style="font-size:16px;color:#6366f1;font-weight:300;width:18px;text-align:center">+</span>
              </button>
              <div id="ha-faq${i}" style="max-height:0;opacity:0;overflow:hidden;transition:max-height .3s ease,opacity .25s ease">
                <p style="padding:0 16px 14px;font-size:12px;color:var(--text3);line-height:1.7">${f.a}</p>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- ── Tips & Tricks ─────────────────────────────────────────── -->
      <div class="glass-card help-item" style="padding:22px;margin-bottom:16px">
        <p class="section-title" style="margin-bottom:16px">💡 Tips & Tricks</p>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px" class="help-tips-grid">
          ${TIPS.map(t=>`
            <div class="help-item" style="display:flex;gap:10px;padding:12px;border-radius:10px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15)">
              <span style="font-size:18px;flex-shrink:0">${t.icon}</span>
              <p style="font-size:11px;color:var(--text2);line-height:1.55">${t.tip}</p>
            </div>`).join('')}
        </div>
      </div>

      <!-- ── Send Feedback ─────────────────────────────────────────── -->
      <div class="glass-card help-item" style="padding:22px;margin-bottom:16px">
        <p class="section-title" style="margin-bottom:4px">📬 Send Feedback</p>
        <p style="font-size:12px;color:var(--text3);margin-bottom:16px">Report a bug, suggest a feature, or just say hi — we read everything.</p>
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label">Type</label>
          <select id="help-feedback-type" class="form-input">
            <option>🐛 Bug Report</option>
            <option>💡 Feature Request</option>
            <option>🙋 General Question</option>
            <option>⭐ Compliment</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:16px">
          <label class="form-label">Your Message</label>
          <textarea id="help-feedback-msg" class="form-input" rows="4" placeholder="Describe your issue, idea, or feedback in detail…" style="resize:vertical"></textarea>
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          <button class="btn-primary" onclick="sendFeedback()">📤 Send Feedback</button>
          <span style="font-size:11px;color:var(--text3)">Stored locally · earns +5 XP</span>
        </div>
        ${(STATE.feedbackLog||[]).length > 0 ? `
        <div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.07)">
          <p style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:8px">PREVIOUS FEEDBACK</p>
          ${[...(STATE.feedbackLog||[])].reverse().slice(0,3).map(fb=>`
            <div style="padding:8px 12px;border-radius:8px;background:rgba(255,255,255,0.03);margin-bottom:6px">
              <p style="font-size:11px;font-weight:600;color:var(--text2)">${fb.type}</p>
              <p style="font-size:11px;color:var(--text3)">${fb.msg}</p>
              <p style="font-size:10px;color:rgba(255,255,255,0.2);margin-top:3px">${new Date(fb.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
            </div>`).join('')}
        </div>` : ''}
      </div>

      <!-- ── Contact Support ───────────────────────────────────────── -->
      <div class="glass-card help-item" style="padding:22px;margin-bottom:16px">
        <p class="section-title" style="margin-bottom:4px">📧 Contact Support</p>
        <p style="font-size:12px;color:var(--text3);margin-bottom:14px">Questions, bugs or feedback? Email the team directly — we usually reply within a day.</p>
        <a href="mailto:navaasaravanan@gmail.com?subject=atworth%20Support" style="display:flex;align-items:center;gap:10px;padding:13px 16px;border-radius:12px;background:rgba(0,201,167,0.1);border:1px solid rgba(0,201,167,0.3);color:#00c9a7;font-size:14px;font-weight:700;text-decoration:none;word-break:break-all">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>
          navaasaravanan@gmail.com
        </a>
      </div>

      <!-- ── About ─────────────────────────────────────────────────── -->
      <div class="glass-card" style="padding:20px;margin-bottom:16px;text-align:center">
        <p style="font-size:22px;margin-bottom:8px">⚡</p>
        <p style="font-size:15px;font-weight:800;color:var(--text1);margin-bottom:4px">atworth</p>
        <p style="font-size:11px;color:var(--text3);margin-bottom:12px">Your all-in-one personal finance & life management OS</p>
        <div style="display:flex;justify-content:center;gap:20px;flex-wrap:wrap">
          <span style="font-size:11px;color:var(--text3)">Level ${STATE.level||1} · ${STATE.xp||0} XP earned</span>
          <span style="font-size:11px;color:var(--text3)">${(STATE.transactions||[]).length} transactions logged</span>
          <span style="font-size:11px;color:var(--text3)">${STATE.streak||0} day streak 🔥</span>
        </div>
      </div>

    </div>`;

  // Responsive grids
  setTimeout(() => {
    if (window.innerWidth < 640) {
      const sg = document.querySelector('.help-steps-grid');
      if (sg) sg.style.gridTemplateColumns = '1fr';
      const tg = document.querySelector('.help-tips-grid');
      if (tg) tg.style.gridTemplateColumns = '1fr';
    }
  }, 20);
}
