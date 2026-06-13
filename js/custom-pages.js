
// ============================================================
//  Custom Pages — create, rename, delete, reorder, pick cards
// ============================================================

// ── CARD REGISTRY — all cards/sections a custom page can display ──
const CUSTOM_PAGE_CARDS = [
  { key: 'cp-life-score',    label: 'Overall Life Score',        group: 'Dashboard',  build: '_cpBuildLifeScore' },
  { key: 'cp-kpi',           label: 'KPI Cards (Income/Expense/Savings)', group: 'Dashboard', build: '_cpBuildKpi' },
  { key: 'cp-insight-bar',   label: 'AI Insight Bar',            group: 'Dashboard',  build: '_cpBuildInsightBar' },
  { key: 'cp-balances',      label: 'Balances & Portfolios',     group: 'Dashboard',  build: '_cpBuildBalances' },
  { key: 'cp-budgets-goals', label: 'Budgets & Goals Summary',   group: 'Dashboard',  build: '_cpBuildBudgetsGoals' },
  { key: 'cp-habits',        label: 'Habits Today',              group: 'Life',       build: '_cpBuildHabits' },
  { key: 'cp-recent-tx',     label: 'Recent Transactions',       group: 'Finance',    build: '_cpBuildRecentTx' },
  { key: 'cp-health',        label: 'Health Snapshot (7 day)',    group: 'Life',       build: '_cpBuildHealth' },
  { key: 'cp-mr-banners',    label: 'Money Rules Summary',       group: 'Money Rules', build: '_cpBuildMoneyRulesBanners' },
  { key: 'cp-mr-nw',         label: 'Net Worth Breakdown',       group: 'Money Rules', build: '_cpBuildMoneyRulesNetWorth' },
  { key: 'cp-mr-rules',      label: 'Personal Finance Rules',    group: 'Money Rules', build: '_cpBuildMoneyRulesList' },
  { key: 'cp-yr-table',      label: 'Yearly Report Summary',     group: 'Yearly Report', build: '_cpBuildYearlyReportTable' },
  { key: 'cp-assets-list',   label: 'Assets & Portfolio List',   group: 'All Assets', build: '_cpBuildAssetsList' },
  { key: 'cp-budget-list',   label: 'Active Budget Progress',    group: 'Budget',     build: '_cpBuildBudgetProgressList' },
  { key: 'cp-notes-list',    label: 'Google Keep Quick Notes',   group: 'Notes',      build: '_cpBuildNotesGrid' },
  { key: 'cp-recurring-list', label: 'Recurring Subscriptions List', group: 'Recurring', build: '_cpBuildRecurringList' },
  { key: 'cp-goals-list',    label: 'Savings Goals List',        group: 'Goals',      build: '_cpBuildGoalsList' },
  { key: 'cp-journal-list',  label: 'Recent Journal Log',        group: 'Journal',    build: '_cpBuildJournalList' },
  { key: 'cp-categories-list', label: 'Custom Categories List',  group: 'Categories', build: '_cpBuildCategoriesList' }
];
// Also include all WIDGET_REGISTRY charts
if (typeof WIDGET_REGISTRY !== 'undefined') {
  Object.entries(WIDGET_REGISTRY).forEach(function(entry) {
    var k = entry[0], w = entry[1];
    CUSTOM_PAGE_CARDS.push({ key: 'cp-w-' + k, label: w.label, group: 'Charts - ' + w.group, widgetKey: k });
  });
}

// ── Sidebar list builder ──
function renderCustomPagesMenu() {
  var host = document.getElementById('sidebar-custom-pages-list');
  if (!host) return;
  var pages = STATE.customPages || [];

  var addPageHtml = '<button class="nav-item create-page-btn" onclick="createCustomPagePrompt()" style="border:1px dashed rgba(0,201,167,0.4) !important;background:rgba(0,201,167,0.08) !important;color:#00c9a7 !important;display:flex !important;align-items:center !important;width:auto !important;justify-content:center !important;margin:8px 14px !important">' +
    '<span class="nav-icon" style="color:#00c9a7 !important;font-size:14px;margin:0;width:auto;flex:none;display:inline">➕</span>' +
    '<span class="nav-text" style="color:#00c9a7 !important;font-weight:700">Create Custom Page</span>' +
  '</button>';

  if (pages.length === 0) {
    host.innerHTML = '<p style="font-size:11px;color:var(--text3);padding:4px 22px;opacity:.6;margin-bottom:8px">No custom pages yet.</p>' + addPageHtml;
    return;
  }

  var listHtml = pages.map(function(pg) {
    var ctrls = '';
    if (typeof _loEdit !== 'undefined' && _loEdit) {
      ctrls = '<span class="nav-page-ctrls" style="margin-left:auto;display:flex;gap:4px">' +
        '<button onclick="event.stopPropagation();moveCustomPage(\'' + pg.id + '\',-1)" style="background:rgba(255,255,255,0.08);border:1px solid var(--glass-border);color:var(--text2);cursor:pointer;padding:2px 6px;border-radius:4px;font-size:9px" title="Move Up">▲</button>' +
        '<button onclick="event.stopPropagation();moveCustomPage(\'' + pg.id + '\',1)" style="background:rgba(255,255,255,0.08);border:1px solid var(--glass-border);color:var(--text2);cursor:pointer;padding:2px 6px;border-radius:4px;font-size:9px" title="Move Down">▼</button>' +
      '</span>';
    }

    return '<button class="nav-item' + (typeof currentPage !== 'undefined' && currentPage === pg.id ? ' active' : '') + '" onclick="navigate(\'' + pg.id + '\')" data-page="' + pg.id + '" style="display:flex;align-items:center;width:100%">' +
      '<span class="nav-icon" style="font-size:15px">' + (pg.icon || '\u{1F4C4}') + '</span>' +
      '<span class="nav-text">' + pg.name + '</span>' +
      ctrls +
    '</button>';
  }).join('');

  host.innerHTML = listHtml + addPageHtml;
}

// ── Create custom page ──
function createCustomPagePrompt() {
  openModal('\u{1F4C4} Create Custom Page',
    '<div class="form-group"><label class="form-label">Page Name</label>' +
    '<input type="text" id="cp-name" class="form-input" placeholder="e.g. Work Dashboard, Fitness Tracker" maxlength="30"/></div>' +
    '<div class="form-group"><label class="form-label">Icon (emoji)</label>' +
    '<input type="text" id="cp-icon" class="form-input" placeholder="\u{1F4CA}" maxlength="4" value="\u{1F4CA}"/></div>' +
    '<div class="modal-actions">' +
    '<button class="btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn-primary" onclick="handleAddCustomPage()">Create Page</button></div>');
}

function handleAddCustomPage() {
  var nameEl = document.getElementById('cp-name');
  var iconEl = document.getElementById('cp-icon');
  var name = (nameEl ? nameEl.value : '').trim();
  var icon = (iconEl ? iconEl.value : '').trim() || '\u{1F4C4}';
  if (!name) { toast('Enter a page name', 'error'); return; }
  STATE.customPages = STATE.customPages || [];
  var id = 'custom_page_' + genId();
  STATE.customPages.push({ id: id, name: name, icon: icon, order: STATE.customPages.length });
  STATE.customPageLayouts = STATE.customPageLayouts || {};
  STATE.customPageLayouts[id] = {};
  saveState();
  closeModal();
  toast('\u{1F4C4} Custom page created!', 'success');
  if (typeof updateSidebar === 'function') updateSidebar();
  navigate(id);
}

// ── Rename custom page ──
function renameCustomPage(pageId) {
  var pg = (STATE.customPages || []).find(function(p) { return p.id === pageId; });
  if (!pg) return;
  openModal('\u270F\uFE0F Rename Page',
    '<div class="form-group"><label class="form-label">Page Name</label>' +
    '<input type="text" id="cp-rename" class="form-input" value="' + pg.name + '" maxlength="30"/></div>' +
    '<div class="form-group"><label class="form-label">Icon (emoji)</label>' +
    '<input type="text" id="cp-reicon" class="form-input" value="' + (pg.icon || '\u{1F4C4}') + '" maxlength="4"/></div>' +
    '<div class="modal-actions">' +
    '<button class="btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn-primary" onclick="handleRenameCustomPage(\'' + pageId + '\')">Save</button></div>');
}

function handleRenameCustomPage(pageId) {
  var pg = (STATE.customPages || []).find(function(p) { return p.id === pageId; });
  if (!pg) return;
  var name = (document.getElementById('cp-rename') ? document.getElementById('cp-rename').value : '').trim();
  var icon = (document.getElementById('cp-reicon') ? document.getElementById('cp-reicon').value : '').trim() || '\u{1F4C4}';
  if (!name) { toast('Enter a name', 'error'); return; }
  pg.name = name;
  pg.icon = icon;
  saveState();
  closeModal();
  toast('Page renamed!', 'success');
  if (typeof updateSidebar === 'function') updateSidebar();
  navigate(pageId, true);
}

// ── Delete custom page ──
function deleteCustomPage(pageId) {
  var pg = (STATE.customPages || []).find(function(p) { return p.id === pageId; });
  if (!pg) return;
  openModal('\u{1F5D1}\uFE0F Delete Page',
    '<div style="text-align:center;padding:8px">' +
    '<p style="font-size:16px;font-weight:600;margin-bottom:18px">Delete "' + pg.name + '"?</p>' +
    '<p style="font-size:13px;color:var(--text3);margin-bottom:22px">This will permanently remove this custom page and its layout.</p>' +
    '<div class="modal-actions">' +
    '<button class="btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn-primary" style="background:linear-gradient(135deg,#ef4444,#dc2626)" onclick="handleDeleteCustomPage(\'' + pageId + '\')">Delete</button></div></div>');
}

function handleDeleteCustomPage(pageId) {
  STATE.customPages = (STATE.customPages || []).filter(function(p) { return p.id !== pageId; });
  if (STATE.customPageLayouts) delete STATE.customPageLayouts[pageId];
  saveState();
  closeModal();
  toast('Page deleted', 'info');
  if (typeof updateSidebar === 'function') updateSidebar();
  navigate('dashboard');
}

// ── Reorder custom pages ──
function moveCustomPage(pageId, dir) {
  var pages = STATE.customPages || [];
  var idx = pages.findIndex(function(p) { return p.id === pageId; });
  if (idx < 0) return;
  var j = idx + dir;
  if (j < 0 || j >= pages.length) return;
  var temp = pages[idx]; pages[idx] = pages[j]; pages[j] = temp;
  pages.forEach(function(p, i) { p.order = i; });
  saveState();
  if (typeof updateSidebar === 'function') updateSidebar();
  if (navigator.vibrate) navigator.vibrate(8);
}

// ── Card picker for custom pages ──
function openCustomPagePicker(pageId) {
  var lo = (typeof _loGet === 'function') ? _loGet(pageId) : {};
  var groups = {};
  CUSTOM_PAGE_CARDS.forEach(function(c) {
    (groups[c.group] = groups[c.group] || []).push(c);
  });

  var isVisible = function(key) {
    var w = lo[key];
    if (!w) return false;
    return !w.hidden;
  };

  var html = Object.entries(groups).map(function(entry) {
    var g = entry[0], items = entry[1];
    return '<p style="font-weight:800;margin:16px 0 8px;color:var(--text2)">' + g + '</p>' +
      items.map(function(c) {
        return '<label style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--glass-border);border-radius:12px;margin-bottom:8px;cursor:pointer">' +
          '<input type="checkbox" ' + (isVisible(c.key) ? 'checked' : '') + ' onchange="toggleCustomPageCard(\'' + pageId + '\',\'' + c.key + '\',this.checked)" style="width:20px;height:20px;accent-color:#00c9a7"/>' +
          '<span style="font-size:15px;font-weight:600">' + c.label + '</span></label>';
      }).join('');
  }).join('');

  openModal('\u2795 Add Cards to Page', html +
    '<div class="modal-actions"><button class="btn-primary" onclick="closeModal();navigate(\'' + pageId + '\',true)">Done</button></div>');
}

function toggleCustomPageCard(pageId, key, show) {
  var lo = (typeof _loGet === 'function') ? _loGet(pageId) : {};
  lo[key] = lo[key] || {};
  lo[key].hidden = !show;
  if (typeof _loSet === 'function') _loSet(pageId, lo);
}

// ── Render custom page ──
function renderCustomPage(pageId) {
  var pg = (STATE.customPages || []).find(function(p) { return p.id === pageId; });
  var pageName = pg ? pg.name : 'Custom Page';
  var pageIcon = pg ? (pg.icon || '\u{1F4C4}') : '\u{1F4C4}';

  var cardHtmls = CUSTOM_PAGE_CARDS.map(function(c) {
    var inner = '';
    try {
      if (c.widgetKey) {
        var w = WIDGET_REGISTRY[c.widgetKey];
        if (w) {
          var cid = 'cp-hwc-' + c.widgetKey;
          inner = '<div class="section-header" style="margin-bottom:12px"><p class="section-title">' + w.label + '</p></div>' +
            '<div class="hw-canvas-wrap" style="position:relative;height:' + (w.type === 'stat' ? '160px' : '250px') + '"><canvas id="' + cid + '"></canvas></div>';
        }
      } else if (typeof window[c.build] === 'function') {
        inner = window[c.build]();
      } else {
        inner = '<p style="color:var(--text3);padding:20px;text-align:center">' + c.label + '</p>';
      }
    } catch (e) {
      inner = '<p style="color:var(--text3);padding:20px;text-align:center">' + c.label + '</p>';
    }
    return '<div class="glass-card" id="' + c.key + '" style="padding:20px;margin-bottom:18px">' + inner + '</div>';
  }).join('');

  document.getElementById('page-container').innerHTML =
    '<div class="fade-in">' +
      '<div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:20px">' +
        '<div><h1 class="page-title">' + pageIcon + ' ' + pageName + '</h1><p class="page-subtitle">Your custom workspace</p></div>' +
      '</div>' +
      cardHtmls +
    '</div>';

  setTimeout(function() {
    CUSTOM_PAGE_CARDS.forEach(function(c) {
      if (c.widgetKey) {
        var w = WIDGET_REGISTRY[c.widgetKey];
        var cid = 'cp-hwc-' + c.widgetKey;
        var card = document.getElementById(c.key);
        if (w && card) { try { w.build(cid, card); } catch (e) {} }
      }
    });
  }, 50);
}

// ── Card builder helpers for custom pages ──
function _cpBuildLifeScore() {
  var scores = calcLifeScore();
  var sc = function(s) { return s >= 70 ? '#10b981' : s >= 40 ? '#f59e0b' : '#ef4444'; };
  var dims = [{l:'Wealth',v:scores.wealthScore},{l:'Health',v:scores.healthScore},{l:'Productivity',v:scores.prodScore},{l:'Career',v:scores.careerScore},{l:'Emotional',v:scores.emotionalScore}];
  return '<div class="section-header" style="margin-bottom:14px"><p class="section-title">\u{1F9EC} Life Score</p></div>' +
    '<div style="text-align:center;margin-bottom:14px"><span style="font-size:48px;font-weight:900;color:' + sc(scores.overall) + '">' + scores.overall + '</span><span style="font-size:16px;color:var(--text3);margin-left:4px">/ 100</span></div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;text-align:center">' +
    dims.map(function(s) {
      return '<div style="padding:10px;border-radius:12px;background:' + sc(s.v) + '15;border:1px solid ' + sc(s.v) + '30"><p style="font-size:20px;font-weight:900;color:' + sc(s.v) + '">' + s.v + '</p><p style="font-size:10px;color:var(--text3);margin-top:2px">' + s.l + '</p></div>';
    }).join('') + '</div>';
}

function _cpBuildKpi() {
  var txns = STATE.transactions || [];
  var totalIncome = txns.filter(function(t) { return t.type === 'income'; }).reduce(function(s, t) { return s + t.amount; }, 0);
  var totalExpense = txns.filter(function(t) { return t.type === 'expense'; }).reduce(function(s, t) { return s + t.amount; }, 0);
  var net = totalIncome - totalExpense;
  return '<div class="section-header" style="margin-bottom:12px"><p class="section-title">\u{1F4CA} Financial Summary</p></div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">' +
      '<div style="text-align:center;padding:14px;border-radius:14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2)"><p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--text3);font-weight:700">Income</p><p style="font-size:20px;font-weight:900;color:#10b981;margin-top:4px">' + fmt(totalIncome) + '</p></div>' +
      '<div style="text-align:center;padding:14px;border-radius:14px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2)"><p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--text3);font-weight:700">Expenses</p><p style="font-size:20px;font-weight:900;color:#ef4444;margin-top:4px">' + fmt(totalExpense) + '</p></div>' +
      '<div style="text-align:center;padding:14px;border-radius:14px;background:rgba(0,201,167,0.08);border:1px solid rgba(0,201,167,0.2)"><p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--text3);font-weight:700">Net</p><p style="font-size:20px;font-weight:900;color:' + (net >= 0 ? '#00c9a7' : '#ef4444') + ';margin-top:4px">' + fmt(Math.abs(net)) + '</p></div>' +
    '</div>';
}

function _cpBuildInsightBar() {
  var insights = generateInsights();
  if (!insights.length) return '<p style="color:var(--text3);text-align:center;padding:12px">No insights yet</p>';
  return '<div class="section-header" style="margin-bottom:12px"><p class="section-title">\u{1F4A1} AI Insights</p></div>' +
    insights.map(function(i) {
      return '<div style="display:flex;align-items:flex-start;gap:12px;padding:12px;border-radius:12px;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.12);margin-bottom:8px"><span style="font-size:22px;flex-shrink:0">' + i.emoji + '</span><div><p style="font-weight:700;font-size:13px;margin-bottom:2px">' + i.title + '</p><p style="font-size:12px;color:var(--text3)">' + i.msg + '</p></div></div>';
    }).join('');
}

function _cpBuildBalances() {
  var banks = STATE.bankAccounts || [];
  var cash = STATE.cashAccounts || [];
  var cards = STATE.creditCards || [];
  var totalBank = banks.reduce(function(s, b) { return s + (b.balance || 0); }, 0);
  var totalCash = cash.reduce(function(s, c) { return s + (c.balance || 0); }, 0);
  var totalDebt = cards.reduce(function(s, c) { return s + (c.outstanding || 0); }, 0);
  var net = totalBank + totalCash - totalDebt;
  return '<div class="section-header" style="margin-bottom:12px"><p class="section-title">\u{1F4BC} Net Worth</p></div>' +
    '<p style="font-size:30px;font-weight:900;color:' + (net >= 0 ? '#00c9a7' : '#ef4444') + ';text-align:center;margin-bottom:14px">' + (net >= 0 ? '+' : '') + fmt(net) + '</p>' +
    '<div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">' +
      '<div style="display:flex;align-items:center;gap:6px"><span style="width:9px;height:9px;border-radius:50%;background:#00c9a7"></span><span style="font-size:12px;color:var(--text3)">Banks</span><span style="font-size:12px;font-weight:700;color:#00c9a7">' + fmt(totalBank) + '</span></div>' +
      '<div style="display:flex;align-items:center;gap:6px"><span style="width:9px;height:9px;border-radius:50%;background:#f59e0b"></span><span style="font-size:12px;color:var(--text3)">Cash</span><span style="font-size:12px;font-weight:700;color:#f59e0b">' + fmt(totalCash) + '</span></div>' +
      '<div style="display:flex;align-items:center;gap:6px"><span style="width:9px;height:9px;border-radius:50%;background:#ef4444"></span><span style="font-size:12px;color:var(--text3)">Debt</span><span style="font-size:12px;font-weight:700;color:#ef4444">' + fmt(totalDebt) + '</span></div>' +
    '</div>';
}

function _cpBuildBudgetsGoals() {
  var budgets = STATE.budgets || [];
  var goals = STATE.goals || [];
  var goalsDone = goals.filter(function(g) { return g.current >= g.target; }).length;
  return '<div class="section-header" style="margin-bottom:12px"><p class="section-title">\u{1F3AF} Budgets & Goals</p></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">' +
      '<div onclick="navigate(\'budget\')" style="cursor:pointer;padding:16px;border-radius:14px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);text-align:center"><p style="font-size:28px;font-weight:900;color:#f59e0b">' + budgets.length + '</p><p style="font-size:11px;color:var(--text3);margin-top:4px">Active Budgets</p></div>' +
      '<div onclick="navigate(\'goals\')" style="cursor:pointer;padding:16px;border-radius:14px;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);text-align:center"><p style="font-size:28px;font-weight:900;color:#8b5cf6">' + goalsDone + '/' + goals.length + '</p><p style="font-size:11px;color:var(--text3);margin-top:4px">Goals Complete</p></div>' +
    '</div>';
}

function _cpBuildHabits() {
  var habits = STATE.habits || [];
  var comps = STATE.habitCompletions || [];
  var todayStr = today();
  var doneCount = habits.filter(function(h) { return comps.some(function(c) { return c.habitId === h.id && c.date === todayStr; }); }).length;
  var pct = habits.length > 0 ? Math.round(doneCount / habits.length * 100) : 0;
  var habitList = habits.slice(0, 5).map(function(h) {
    var done = comps.some(function(c) { return c.habitId === h.id && c.date === todayStr; });
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;background:' + (done ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)') + '"><span style="font-size:14px">' + (done ? '\u2705' : '\u2B1C') + '</span><span style="font-size:13px;font-weight:600;flex:1">' + (h.emoji || '\u2B55') + ' ' + h.name + '</span></div>';
  }).join('');
  return '<div class="section-header" style="margin-bottom:12px"><p class="section-title">\u2705 Habits Today</p></div>' +
    '<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">' +
      '<div style="position:relative;width:60px;height:60px;flex-shrink:0"><svg width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="5"/><circle cx="30" cy="30" r="26" fill="none" stroke="' + (pct === 100 ? '#10b981' : '#f59e0b') + '" stroke-width="5" stroke-dasharray="' + Math.round(pct * 1.63) + ' 163" stroke-linecap="round" transform="rotate(-90 30 30)"/></svg><span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:' + (pct === 100 ? '#10b981' : '#f59e0b') + '">' + pct + '%</span></div>' +
      '<div><p style="font-size:14px;font-weight:700">' + doneCount + ' of ' + habits.length + ' done</p><p style="font-size:12px;color:var(--text3)">' + (habits.length === 0 ? 'Add habits to track' : pct === 100 ? 'All done!' : 'Keep going!') + '</p></div>' +
    '</div>' +
    (habits.length > 0 ? '<div style="display:flex;flex-direction:column;gap:6px">' + habitList + '</div>' : '');
}

function _cpBuildRecentTx() {
  var txns = (STATE.transactions || []).slice().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); }).slice(0, 5);
  if (!txns.length) return '<div class="section-header"><p class="section-title">\u{1F4C3} Recent Transactions</p></div><p style="color:var(--text3);text-align:center;padding:12px">No transactions yet</p>';
  return '<div class="section-header" style="margin-bottom:12px"><p class="section-title">\u{1F4C3} Recent Transactions</p></div>' +
    txns.map(function(t) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:18px">' + (t.icon || (t.type === 'income' ? '\u{1F4B0}' : '\u{1F4B8}')) + '</span><div><p style="font-size:13px;font-weight:600">' + (t.category || 'Uncategorized') + '</p><p style="font-size:11px;color:var(--text3)">' + fmtDate(t.date) + '</p></div></div><span style="font-size:14px;font-weight:700;color:' + (t.type === 'income' ? '#10b981' : '#ef4444') + '">' + (t.type === 'income' ? '+' : '-') + fmt(t.amount) + '</span></div>';
    }).join('');
}

function _cpBuildHealth() {
  var entries = (STATE.healthEntries || []).slice().sort(function(a, b) { return b.date.localeCompare(a.date); }).slice(0, 7);
  var moodEmojis = ['','\u{1F61E}','\u{1F61F}','\u{1F610}','\u{1F642}','\u{1F60A}','\u{1F604}','\u{1F601}','\u{1F929}','\u{1F60D}','\u{1F970}'];
  if (!entries.length) return '<div class="section-header"><p class="section-title">\u2764\uFE0F Health</p></div><p style="color:var(--text3);text-align:center;padding:12px">No health data yet</p>';
  var avgSleep = (entries.reduce(function(s, e) { return s + (e.sleep || 0); }, 0) / entries.length).toFixed(1);
  var avgMood = (entries.reduce(function(s, e) { return s + (e.mood || 5); }, 0) / entries.length).toFixed(1);
  var avgWater = (entries.reduce(function(s, e) { return s + (e.water || 0); }, 0) / entries.length).toFixed(1);
  return '<div class="section-header" style="margin-bottom:12px"><p class="section-title">\u2764\uFE0F Health (7-Day Avg)</p></div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;text-align:center">' +
      '<div style="padding:14px;border-radius:14px;background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.2)"><p style="font-size:22px">\u{1F634}</p><p style="font-size:18px;font-weight:900;color:#f97316">' + avgSleep + 'h</p><p style="font-size:10px;color:var(--text3)">Sleep</p></div>' +
      '<div style="padding:14px;border-radius:14px;background:rgba(236,72,153,0.08);border:1px solid rgba(236,72,153,0.2)"><p style="font-size:22px">' + (moodEmojis[Math.round(avgMood)] || '\u{1F60A}') + '</p><p style="font-size:18px;font-weight:900;color:#ec4899">' + avgMood + '/10</p><p style="font-size:10px;color:var(--text3)">Mood</p></div>' +
      '<div style="padding:14px;border-radius:14px;background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.2)"><p style="font-size:22px">\u{1F4A7}</p><p style="font-size:18px;font-weight:900;color:#06b6d4">' + avgWater + 'g</p><p style="font-size:10px;color:var(--text3)">Water</p></div>' +
    '</div>';
}

function _cpBuildMoneyRulesBanners() {
  var ptx = (typeof _mrFilteredTx === 'function') ? _mrFilteredTx() : (STATE.transactions || []);
  var pInc = 0, pExp = 0;
  ptx.forEach(function(t) {
    var a = +t.amount || 0;
    if (t.type === 'income') pInc += a;
    else pExp += a;
  });
  var pNet = pInc - pExp;
  var fStr = function(n) { return fmt(Math.round(n || 0)); };
  return '<div class="section-header" style="margin-bottom:12px"><p class="section-title">\u2696\uFE0F Money Rules Summary</p></div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">' +
      '<div style="padding:10px;border-radius:12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2)"><p style="font-size:10px;color:var(--text3);margin-bottom:3px">Income</p><p style="font-size:14px;font-weight:800;color:#10b981">' + fStr(pInc) + '</p></div>' +
      '<div style="padding:10px;border-radius:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2)"><p style="font-size:10px;color:var(--text3);margin-bottom:3px">Expense</p><p style="font-size:14px;font-weight:800;color:#ef4444">' + fStr(pExp) + '</p></div>' +
      '<div style="padding:10px;border-radius:12px;background:rgba(0,201,167,0.08);border:1px solid rgba(0,201,167,0.2)"><p style="font-size:10px;color:var(--text3);margin-bottom:3px">Net Saved</p><p style="font-size:14px;font-weight:800;color:' + (pNet >= 0 ? '#10b981' : '#ef4444') + '">' + fStr(pNet) + '</p></div>' +
    '</div>';
}

function _cpBuildMoneyRulesNetWorth() {
  var nw = (typeof _mrNetWorth === 'function') ? _mrNetWorth() : { net: 0, liquid: 0, invest: 0, debt: 0, bank: 0, cash: 0 };
  var fStr = function(n) { return fmt(Math.round(n || 0)); };
  var assets = nw.liquid + nw.invest;
  var mx = Math.max(assets, nw.debt, 1);
  var seg = function(val, col) {
    return val > 0 ? '<div style="width:' + (val / mx * 100).toFixed(1) + '%;background:' + col + ';height:100%" title="' + fStr(val) + '"></div>' : '';
  };
  return '<div class="section-header" style="margin-bottom:12px"><p class="section-title">\u{1F3DB} Net Worth Breakdown</p></div>' +
    '<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:5px"><span style="color:#10b981">Assets (' + fStr(assets) + ')</span></div>' +
    '<div style="display:flex;height:12px;border-radius:6px;overflow:hidden;background:var(--glass);margin-bottom:12px">' + seg(nw.bank, '#3b82f6') + seg(nw.cash, '#06b6d4') + seg(nw.invest, '#8b5cf6') + '</div>' +
    '<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:5px"><span style="color:#ef4444">Debt (' + fStr(nw.debt) + ')</span></div>' +
    '<div style="display:flex;height:12px;border-radius:6px;overflow:hidden;background:var(--glass)">' + seg(nw.debt, '#ef4444') + '</div>';
}

function _cpBuildMoneyRulesList() {
  var rules = [
    { accent: '#3b82f6', title: '50/30/20 Rule', desc: '50% Needs, 30% Wants, 20% Savings' },
    { accent: '#10b981', title: 'Rule of 72', desc: '72 / Interest Rate = Years to double money' },
    { accent: '#f59e0b', title: 'Emergency Fund', desc: 'Keep 3-6 months of expenses in bank' },
    { accent: '#ec4899', title: 'Rule of 100', desc: '100 - Age = % of portfolio in equities' }
  ];
  return '<div class="section-header" style="margin-bottom:12px"><p class="section-title">\u{1F4A1} Personal Finance Rules</p></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
      rules.map(function(r) {
        return '<div style="padding:10px;border-radius:12px;background:var(--glass);border:1px solid var(--glass-border);border-left:4px solid ' + r.accent + '"><p style="font-size:12px;font-weight:700">' + r.title + '</p><p style="font-size:10px;color:var(--text3);margin-top:2px">' + r.desc + '</p></div>';
      }).join('') +
    '</div>';
}

function _cpBuildYearlyReportTable() {
  var period = 'year';
  var anchor = new Date();
  var data = (typeof _reportData === 'function') ? _reportData(period, anchor) : { rows: [], title: 'Report', useBal: true };
  var tInc = data.rows.reduce(function(s, r) { return s + r.inc; }, 0);
  var tExp = data.rows.reduce(function(s, r) { return s + r.exp; }, 0);
  return '<div class="section-header" style="margin-bottom:12px"><p class="section-title">\u{1F4CA} Yearly Report Summary (' + data.title + ')</p></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-radius:10px;background:rgba(16,185,129,0.08);margin-bottom:6px"><span style="font-size:12px;font-weight:600">Total Income</span><span style="font-weight:800;color:#10b981">' + fmt(tInc) + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-radius:10px;background:rgba(239,68,68,0.08);margin-bottom:6px"><span style="font-size:12px;font-weight:600">Total Expense</span><span style="font-weight:800;color:#ef4444">' + fmt(tExp) + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-radius:10px;background:rgba(0,201,167,0.08)"><span style="font-size:12px;font-weight:600">Net Balance</span><span style="font-weight:800;color:' + (tInc - tExp >= 0 ? '#00c9a7' : '#ef4444') + '">' + fmt(tInc - tExp) + '</span></div>';
}

function _cpBuildAssetsList() {
  var investments = STATE.investments || [];
  var totalCurrent = investments.reduce(function(s, i) { return s + (i.currentValue ?? i.amount ?? 0); }, 0);
  var loans = STATE.loans || [];
  var totalLoan = loans.reduce(function(s, l) { return s + (l.outstanding || 0); }, 0);
  var netWorth = totalCurrent - totalLoan;
  var listHtml = investments.slice(0, 4).map(function(i) {
    var curr = i.currentValue ?? i.amount;
    var pnl = curr - i.amount;
    var pos = pnl >= 0;
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:10px;background:var(--glass)"><span style="font-size:12px;font-weight:600">' + i.name + '</span><b style="font-size:12px;color:' + (pos ? '#10b981' : '#ef4444') + '">' + fmt(curr) + '</b></div>';
  }).join('');
  return '<div class="section-header" style="margin-bottom:12px"><p class="section-title">\u{1F3E6} Assets & Portfolio List</p></div>' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:10px"><span style="font-size:12px;color:var(--text3)">Net Worth Portfolio:</span><b style="font-size:15px;color:#00c9a7">' + fmt(netWorth) + '</b></div>' +
    '<div style="display:flex;flex-direction:column;gap:6px">' +
      (listHtml || '<p style="color:var(--text3);font-size:11px;text-align:center">No investments yet</p>') +
    '</div>';
}

function _cpBuildBudgetProgressList() {
  var budgets = STATE.budgets || [];
  var txns = STATE.transactions || [];
  var filteredTxns = txns.filter(function(t) {
    return t.type === 'expense' && (t.date || '').startsWith(new Date().toISOString().slice(0, 7));
  });
  var rows = budgets.slice(0, 4).map(function(b) {
    var limit = b.amount || b.limit || 0;
    var spent = filteredTxns.filter(function(t) {
      return t.category?.trim().toLowerCase() === b.category?.trim().toLowerCase();
    }).reduce(function(s, t) { return s + t.amount; }, 0);
    var pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
    return { b: b, limit: limit, spent: spent, pct: pct };
  });
  var rowsHtml = rows.map(function(r) {
    return '<div style="margin-bottom:8px">' +
      '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px"><span style="font-weight:600">' + r.b.category + '</span><span style="color:var(--text3)">' + fmt(r.spent) + ' / ' + fmt(r.limit) + '</span></div>' +
      '<div style="height:6px;border-radius:3px;background:rgba(255,255,255,0.06);overflow:hidden">' +
        '<div style="width:' + r.pct + '%;background:' + (r.pct >= 100 ? '#ef4444' : r.pct >= 80 ? '#f59e0b' : '#10b981') + ';height:100%;border-radius:3px"></div>' +
      '</div>' +
    '</div>';
  }).join('');
  return '<div class="section-header" style="margin-bottom:12px"><p class="section-title">\u{1F3AF} Active Budget Progress</p></div>' +
    '<div style="display:flex;flex-direction:column;gap:4px">' +
      (rowsHtml || '<p style="color:var(--text3);font-size:11px;text-align:center">No active budgets this month</p>') +
    '</div>';
}

function _cpBuildNotesGrid() {
  var all = (STATE.notes || []).slice().sort(function(a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
  var displayNotes = all.slice(0, 4);
  var notesHtml = displayNotes.map(function(n) {
    return '<div class="note-card note-' + (n.color || 'default') + '" onclick="openNoteEditor(\'' + n.id + '\')" style="padding:10px;border-radius:10px;cursor:pointer">' +
      (n.title ? '<p style="font-size:12px;font-weight:700;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _noteEsc(n.title) + '</p>' : '') +
      (n.body ? '<p style="font-size:10px;color:var(--text2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.4">' + _noteEsc(n.body) + '</p>' : '') +
    '</div>';
  }).join('');
  return '<div class="section-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
      '<p class="section-title">\u{1F5D2}\uFE0F Quick Notes</p>' +
      '<button class="btn-secondary btn-sm" onclick="openNoteEditor()" style="padding:2px 8px;font-size:10px">➕ New</button>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
      (notesHtml || '<p style="color:var(--text3);font-size:11px;text-align:center;grid-column:span 2">No notes yet</p>') +
    '</div>';
}

function _cpBuildRecurringList() {
  var rec = STATE.recurring || [];
  var recHtml = rec.slice(0, 4).map(function(r) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:10px;background:var(--glass)">' +
      '<div><p style="font-size:12px;font-weight:700">' + (r.description || r.category) + '</p><p style="font-size:10px;color:var(--text3)">' + r.frequency + '</p></div>' +
      '<b style="font-size:12px;color:' + (r.type === 'income' ? '#10b981' : '#ef4444') + '">' + (r.type === 'income' ? '+' : '-') + fmt(r.amount) + '</b>' +
    '</div>';
  }).join('');
  return '<div class="section-header" style="margin-bottom:12px"><p class="section-title">\u{1F501} Recurring Subscriptions</p></div>' +
    '<div style="display:flex;flex-direction:column;gap:6px">' +
      (recHtml || '<p style="color:var(--text3);font-size:11px;text-align:center">No recurring rules yet</p>') +
    '</div>';
}

function _cpBuildGoalsList() {
  var goals = STATE.goals || [];
  var goalsHtml = goals.slice(0, 4).map(function(g) {
    var pct = g.target > 0 ? Math.min(100, (g.current / g.target) * 100) : 0;
    return '<div style="margin-bottom:8px">' +
      '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px"><span style="font-weight:600">' + (g.emoji || '\u{1F3AF}') + ' ' + g.name + '</span><span style="color:var(--text3)">' + fmt(g.current) + ' / ' + fmt(g.target) + '</span></div>' +
      '<div style="height:6px;border-radius:3px;background:rgba(255,255,255,0.06);overflow:hidden">' +
        '<div style="width:' + pct + '%;background:#8b5cf6;height:100%;border-radius:3px"></div>' +
      '</div>' +
    '</div>';
  }).join('');
  return '<div class="section-header" style="margin-bottom:12px"><p class="section-title">\u{1F3AF} Savings Goals List</p></div>' +
    '<div style="display:flex;flex-direction:column;gap:4px">' +
      (goalsHtml || '<p style="color:var(--text3);font-size:11px;text-align:center">No active goals yet</p>') +
    '</div>';
}

function _cpBuildJournalList() {
  var entries = (STATE.emotionEntries || []).slice().sort(function(a, b) { return b.date.localeCompare(a.date); });
  var moodEmojis = ['','\u{1F61E}','\u{1F61F}','\u{1F610}','\u{1F642}','\u{1F60A}','\u{1F604}','\u{1F601}','\u{1F929}','\u{1F60D}','\u{1F970}'];
  var journalHtml = entries.slice(0, 3).map(function(e) {
    return '<div style="padding:8px 10px;border-radius:10px;background:var(--glass);display:flex;align-items:center;gap:10px">' +
      '<span style="font-size:20px">' + (moodEmojis[e.moodScore || 5] || '\u{1F610}') + '</span>' +
      '<div style="flex:1;min-width:0">' +
        '<p style="font-size:12px;font-weight:700">' + fmtDate(e.date) + '</p>' +
        '<p style="font-size:10px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (e.note || 'No notes written') + '</p>' +
      '</div>' +
    '</div>';
  }).join('');
  return '<div class="section-header" style="margin-bottom:12px"><p class="section-title">\u{1F4D3} Recent Journal Log</p></div>' +
    '<div style="display:flex;flex-direction:column;gap:6px">' +
      (journalHtml || '<p style="color:var(--text3);font-size:11px;text-align:center">No journal entries yet</p>') +
    '</div>';
}

function _cpBuildCategoriesList() {
  var custom = STATE.customCategories || [];
  var catsHtml = custom.slice(0, 10).map(function(c) {
    return '<div style="display:inline-flex;align-items:center;gap:5px;padding:6px 10px;background:var(--glass);border:1px solid var(--glass-border);border-radius:12px;font-size:11px;font-weight:600">' +
      '<span>' + c.icon + '</span><span>' + c.name + '</span>' +
    '</div>';
  }).join('');
  return '<div class="section-header" style="margin-bottom:12px"><p class="section-title">\u{1F3F7}\uFE0F Custom Categories</p></div>' +
    '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
      (catsHtml || '<p style="color:var(--text3);font-size:11px;text-align:center">No custom categories yet</p>') +
    '</div>';
}
