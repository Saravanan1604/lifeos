// ===== CUSTOM CATEGORIES =====
// Returns merged default + user-created categories
function getAllCategories() {
  const defaults = [
    { name: 'Salary', icon: '💰', type: 'income', isDefault: true },
    { name: 'Business', icon: '🏢', type: 'income', isDefault: true },
    { name: 'Freelance', icon: '💻', type: 'income', isDefault: true },
    { name: 'Interest', icon: '🏦', type: 'income', isDefault: true },
    { name: 'Gift Received', icon: '🎁', type: 'income', isDefault: true },
    { name: 'Other Income', icon: '💵', type: 'income', isDefault: true },
    { name: 'Food', icon: '🍔', type: 'expense', isDefault: true },
    { name: 'Groceries', icon: '🛒', type: 'expense', isDefault: true },
    { name: 'Transport', icon: '🚗', type: 'expense', isDefault: true },
    { name: 'Fuel', icon: '⛽', type: 'expense', isDefault: true },
    { name: 'Shopping', icon: '🛍️', type: 'expense', isDefault: true },
    { name: 'Health', icon: '🏥', type: 'expense', isDefault: true },
    { name: 'Bills', icon: '🧾', type: 'expense', isDefault: true },
    { name: 'Rent', icon: '🏠', type: 'expense', isDefault: true },
    { name: 'EMI', icon: '🏦', type: 'expense', isDefault: true },
    { name: 'Insurance', icon: '🛡️', type: 'expense', isDefault: true },
    { name: 'Investment', icon: '📈', type: 'expense', isDefault: true },
    { name: 'Entertainment', icon: '🎬', type: 'expense', isDefault: true },
    { name: 'Education', icon: '📚', type: 'expense', isDefault: true },
    { name: 'Travel', icon: '✈️', type: 'expense', isDefault: true },
    { name: 'Gifts', icon: '🎁', type: 'expense', isDefault: true },
    { name: 'Utilities', icon: '💡', type: 'expense', isDefault: true },
    { name: 'Subscriptions', icon: '📱', type: 'expense', isDefault: true },
    { name: 'OTT', icon: '📺', type: 'expense', isDefault: true },
    { name: 'SIP', icon: '🔄', type: 'expense', isDefault: true },
    { name: 'Personal Care', icon: '💆', type: 'expense', isDefault: true },
    { name: 'Other', icon: '📦', type: 'both', isDefault: true },
  ];
  const custom = STATE.customCategories || [];
  return [...defaults, ...custom];
}

function getCategoryOptions(filterType = 'both') {
  return getAllCategories()
    .filter(c => filterType === 'both' || c.type === filterType || c.type === 'both')
    .map(c => `<option value="${c.name}" data-icon="${c.icon}">${c.icon} ${c.name}</option>`)
    .join('');
}

// ===== CATEGORIES PAGE =====
function renderCategories() {
  const custom = STATE.customCategories || [];
  const all = getAllCategories();
  const incomeDefaults = all.filter(c => c.isDefault && (c.type === 'income' || c.type === 'both'));
  const expenseDefaults = all.filter(c => c.isDefault && (c.type === 'expense' || c.type === 'both'));

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div><h1 class="page-title"><i data-lucide="tag"></i> Categories</h1><p class="page-subtitle">Manage your transaction categories</p></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;width:100%">
          <button class="btn-secondary cat-hdr-btn" onclick="openGeminiCategorize()" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none"><i data-lucide="sparkles"></i> AI Fix</button>
          <button class="btn-secondary cat-hdr-btn" onclick="openMergeCategoriesModal()"><i data-lucide="git-merge"></i> Merge</button>
          <button class="btn-primary cat-hdr-btn" onclick="openAddCategoryModal()"><i data-lucide="plus"></i> Custom Category</button>
          <button class="btn-secondary cat-hdr-btn" onclick="openManageTypesModal('asset')"><i data-lucide="trending-up"></i> Asset Types</button>
          <button class="btn-secondary cat-hdr-btn" onclick="openManageTypesModal('loan')"><i data-lucide="landmark"></i> Loan Types</button>
        </div>
      </div>

      <!-- Custom Categories -->
      <div class="glass-card" style="padding:20px;margin-bottom:20px">
        <div class="section-header">
          <p class="section-title">✨ My Custom Categories</p>
          <span style="font-size:12px;color:rgba(241,245,249,0.5)">${custom.length} custom</span>
        </div>
        ${custom.length === 0
          ? `<div class="empty-state" style="padding:24px">
              <span class="empty-state-icon">🏷️</span>
              <p>No custom categories yet. Create one to personalize your tracking!</p>
              <button class="btn-primary btn-sm" style="margin-top:12px" onclick="openAddCategoryModal()">+ Create First Category</button>
            </div>`
          : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">
              ${custom.map(c => `
                <div onclick="openEditCategoryModal('${c.id}')" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--glass);border:1px solid var(--glass-border);border-radius:12px;transition:.2s;cursor:pointer">
                  <div style="display:flex;align-items:center;gap:10px">
                    <span class="cat-lic" style="font-size:24px">${c.icon}</span>
                    <div>
                      <p style="font-size:13px;font-weight:600">${c.name}</p>
                      <span class="tag ${c.type==='income'?'tag-green':c.type==='expense'?'tag-red':'tag-blue'}" style="font-size:10px;padding:2px 7px">${c.type}</span>
                    </div>
                  </div>
                  <button class="btn-icon btn-sm" onclick="event.stopPropagation();deleteCategory('${c.id}')" style="color:#ef4444;border-color:rgba(239,68,68,0.3);font-size:15px">✕</button>
                </div>`).join('')}
            </div>`}
      </div>

      <!-- Default Income Categories -->
      <div class="glass-card" style="padding:20px;margin-bottom:20px">
        <p class="section-title" style="margin-bottom:14px">💚 Default Income Categories</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${incomeDefaults.map(c => `
            <div style="display:flex;align-items:center;gap:6px;padding:8px 12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:20px">
              <span class="cat-lic" style="color:${typeof catColor==='function'?catColor(c.name):'#10b981'};font-size:16px">${typeof catIconHtml==='function'?catIconHtml(c.name):c.icon}</span>
              <span style="font-size:13px;font-weight:500">${c.name}</span>
            </div>`).join('')}
        </div>
      </div>

      <!-- Default Expense Categories -->
      <div class="glass-card" style="padding:20px">
        <p class="section-title" style="margin-bottom:14px">❤️ Default Expense Categories</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${expenseDefaults.map(c => `
            <div style="display:flex;align-items:center;gap:6px;padding:8px 12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:20px">
              <span class="cat-lic" style="color:${typeof catColor==='function'?catColor(c.name):'#ef4444'};font-size:16px">${typeof catIconHtml==='function'?catIconHtml(c.name):c.icon}</span>
              <span style="font-size:13px;font-weight:500">${c.name}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

// Recurring transactions list (shown on the Categories page)
function _renderRecurringSection() {
  const rec = STATE.recurring || [];
  if (!rec.length) return '';
  return `
    <div class="glass-card" style="padding:20px;margin-bottom:20px">
      <div class="section-header">
        <p class="section-title">🔁 Recurring Transactions</p>
        <span style="font-size:12px;color:rgba(241,245,249,0.5)">${rec.length} active</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">
        ${rec.map(r => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--glass);border:1px solid var(--glass-border);border-radius:12px">
            <div style="display:flex;align-items:center;gap:10px;min-width:0">
              <span style="font-size:22px">${r.icon || '🔁'}</span>
              <div style="min-width:0">
                <p style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.description || r.category}</p>
                <span style="font-size:11px;color:var(--text3)">${r.frequency} · ${r.type === 'income' ? '+' : '-'}${fmt(r.amount)} · next ${fmtDate(r.nextDate)}</span>
              </div>
            </div>
            <button class="btn-icon btn-sm" onclick="deleteRecurring('${r.id}')" style="color:#ef4444;border-color:rgba(239,68,68,0.3);font-size:13px;flex-shrink:0" title="Stop recurring">✕</button>
          </div>`).join('')}
      </div>
    </div>`;
}

// ===== Dedicated Recurring Transactions page =====
function renderRecurring() {
  const rec = STATE.recurring || [];
  const freqLabel = f => ({ daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }[f] || f || '—');
  const today = new Date().toISOString().slice(0, 10);
  const dueCount = rec.filter(r => (r.nextDate || '') <= today).length;
  const cI = typeof catIconHtml === 'function' ? catIconHtml : (n => '');
  const cC = typeof catColor === 'function' ? catColor : (() => '#6366f1');
  document.getElementById('page-container').innerHTML = `
    <div class="fade-in" style="max-width:900px;margin:0 auto">
      <div class="page-header">
        <h1 class="page-title"><i data-lucide="repeat"></i> Recurring</h1>
        <p class="page-subtitle">Auto-repeating income &amp; expenses${dueCount ? ` · <span style="color:#f59e0b">${dueCount} due</span>` : ''}</p>
      </div>
      ${rec.length === 0
        ? `<div class="glass-card" style="padding:40px"><div class="empty-state"><span class="empty-state-icon"><i data-lucide="repeat"></i></span><p>No recurring transactions yet.<br/>Add one from the <b>+</b> button and pick a <b>Repeat</b> (Daily / Weekly / Monthly / Yearly).</p></div></div>`
        : `<div style="display:flex;flex-direction:column;gap:12px">
          ${rec.map(r => {
            const inc = r.type === 'income';
            const due = (r.nextDate || '') <= today;
            return `<div class="glass-card" style="padding:16px;display:flex;align-items:center;gap:14px;cursor:pointer" onclick="editRecurring('${r.id}')">
              <div class="mm-ic" style="background:${cC(r.category)}">${cI(r.category)}</div>
              <div style="flex:1;min-width:0">
                <p style="font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.description || r.category)}</p>
                <p style="font-size:12px;color:var(--text3)">${freqLabel(r.frequency)} · ${esc(r.category)}${r.source && typeof _sourceLabel === 'function' ? ' · ' + esc(_sourceLabel(r.source)) : ''}</p>
                <p style="font-size:12px;color:${due ? '#f59e0b' : '#00c9a7'};margin-top:2px;display:inline-flex;align-items:center;gap:4px"><i data-lucide="${due ? 'alarm-clock' : 'calendar-clock'}"></i> ${due ? 'Due now' : 'Next'}: ${fmtDate(r.nextDate)}</p>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <p style="font-weight:900;font-size:17px;color:${inc ? '#10b981' : '#ef4444'}">${inc ? '+' : '-'}${fmt(r.amount)}</p>
                <button class="btn-icon btn-sm" onclick="event.stopPropagation();deleteRecurring('${r.id}')" style="color:#ef4444;border-color:rgba(239,68,68,0.3);margin-top:8px" title="Stop recurring"><i data-lucide="x"></i></button>
              </div>
            </div>`;
          }).join('')}
        </div>
        ${dueCount ? `<button class="btn-primary" style="margin-top:16px;width:100%" onclick="if(typeof processRecurring==='function'){processRecurring();} navigate('recurring',true);">Post ${dueCount} due now</button>` : ''}`}
      <button class="btn-secondary" style="margin-top:12px;width:100%" onclick="openAddTxModal('expense')">+ Add recurring (set Repeat in the entry)</button>
    </div>`;
  if (typeof _lucideRefresh === 'function') _lucideRefresh();
}

// Edit a recurring rule (amount, type, frequency, next date, description)
function editRecurring(id) {
  const r = (STATE.recurring || []).find(x => x.id === id);
  if (!r) return;
  const allCats = typeof getAllCategories === 'function' ? getAllCategories() : (typeof CATEGORIES !== 'undefined' ? CATEGORIES : []);
  const catOpts = allCats.map(c => `<option value="${esc(c.name)}" ${c.name === r.category ? 'selected' : ''}>${c.icon || ''} ${esc(c.name)}</option>`).join('');
  const sel = (v, cur) => v === cur ? 'selected' : '';
  openModal('🔁 Edit Recurring', `
    <div class="rf-modal">
      <div class="form-group"><label class="form-label">Description</label>
        <input type="text" id="er-desc" class="form-input" value="${esc(r.description || '')}" placeholder="e.g. Rent, Salary"/></div>
      <div class="form-group"><label class="form-label">Type</label>
        <select id="er-type" class="form-input">
          <option value="expense" ${sel('expense', r.type)}>❤️ Expense</option>
          <option value="income" ${sel('income', r.type)}>💚 Income</option>
        </select></div>
      <div class="form-group"><label class="form-label">Amount</label>
        <input type="number" id="er-amount" class="form-input" value="${r.amount}" step="0.01" min="0"/></div>
      <div class="form-group"><label class="form-label">Category</label>
        <select id="er-cat" class="form-input">${catOpts}</select></div>
      <div class="form-group"><label class="form-label">Frequency</label>
        <select id="er-freq" class="form-input">
          <option value="daily" ${sel('daily', r.frequency)}>Daily</option>
          <option value="weekly" ${sel('weekly', r.frequency)}>Weekly</option>
          <option value="monthly" ${sel('monthly', r.frequency)}>Monthly</option>
          <option value="yearly" ${sel('yearly', r.frequency)}>Yearly</option>
        </select></div>
      <div class="form-group"><label class="form-label">Next date</label>
        <input type="date" id="er-next" class="form-input" value="${r.nextDate || ''}"/></div>
      <div class="modal-actions">
        <button class="btn-danger" onclick="closeModal();deleteRecurring('${r.id}')">Delete</button>
        <button class="btn-primary" onclick="saveRecurringEdit('${r.id}')">Save</button>
      </div>
    </div>`);
}
function saveRecurringEdit(id) {
  const r = (STATE.recurring || []).find(x => x.id === id);
  if (!r) return;
  const amt = parseFloat(document.getElementById('er-amount')?.value);
  if (!amt || amt <= 0) { if (typeof toast === 'function') toast('Enter a valid amount', 'error'); return; }
  r.description = (document.getElementById('er-desc')?.value || '').trim();
  r.type = document.getElementById('er-type')?.value || r.type;
  r.amount = amt;
  r.category = document.getElementById('er-cat')?.value || r.category;
  r.icon = (typeof catIcon === 'function' ? catIcon(r.category) : r.icon);
  r.frequency = document.getElementById('er-freq')?.value || r.frequency;
  r.nextDate = document.getElementById('er-next')?.value || r.nextDate;
  if (typeof saveState === 'function') saveState();
  if (typeof closeModal === 'function') closeModal();
  if (typeof toast === 'function') toast('Recurring updated', 'success');
  if (typeof navigate === 'function') navigate('recurring', true);
}

// Process STATE.recurring: post any entries whose nextDate has arrived, advancing nextDate.
function processRecurring() {
  const rec = STATE.recurring || [];
  if (!rec.length) return;
  const todayStr = new Date().toISOString().slice(0, 10);
  let posted = 0;
  rec.forEach(r => {
    let guard = 0;
    while (r.nextDate && r.nextDate <= todayStr && guard < 400) {
      guard++;
      const tx = { id: genId(), type: r.type, amount: r.amount, date: r.nextDate, category: r.category, icon: r.icon || (typeof catIcon === 'function' ? catIcon(r.category) : '💳'), description: r.description || r.category, subcategory: r.subcategory || '', source: r.source || '', createdAt: new Date().toISOString() };
      STATE.transactions = STATE.transactions || [];
      STATE.transactions.unshift(tx);
      if (typeof _applyTxToAccount === 'function') _applyTxToAccount(tx);
      r.nextDate = (typeof _advanceDate === 'function') ? _advanceDate(r.nextDate, r.frequency) : r.nextDate;
      posted++;
      if (!r.frequency) break;
    }
  });
  if (posted) { if (typeof saveState === 'function') saveState(); if (typeof toast === 'function') toast(`Posted ${posted} recurring transaction${posted > 1 ? 's' : ''}`, 'success'); }
}

// Popular emojis for quick selection
const EMOJI_PICKER = [
  // money & finance
  '💰','💵','💴','💶','💷','💳','🪙','🏦','📈','📉','📊','🧾','💸','🤝','🏧','💱',
  // food & drink
  '🍔','🍕','🍱','🍜','🍣','🍟','🌮','🥗','🍩','🍪','🎂','☕','🍺','🍷','🥤','🍦','🍎','🥖','🍳','🧁',
  // shopping & home
  '🛍️','🛒','🏠','🏡','🛏️','🛋️','🚿','🧹','🧴','🧺','🪑','🔌','💡','🕯️',
  // transport & travel
  '🚗','🚕','🛵','🏍️','🚌','🚆','✈️','⛽','🚲','🛴','🚢','🛺','🅿️','🧳','🏖️','🗺️',
  // health & care
  '💊','🏥','🩺','💉','🦷','🧠','🩹','💆','💈','🧘','🏋️','🏃','🚴','⚕️',
  // bills & utilities
  '📱','📞','🌐','📺','🔧','🛡️','📡','🗞️',
  // entertainment & hobbies
  '🎬','🎮','🎵','🎸','🎨','📷','🎭','🎪','🎤','🎧','🎫','🕹️','📚','🎓','✏️','🎲',
  // people & gifts
  '🎁','🎉','🐶','🐱','👶','👨‍👩‍👧','💍','❤️','🌟','🏆','🎯',
  // misc / nature
  '🔄','📦','🌿','🌺','🌳','☂️','⛱️','🔋','🧰','🪛','💎','🚀','⚡','🔥','🧧','🛕','💼','🧮','📅','⭐'
];

function openAddCategoryModal() {
  openModal('Add Custom Category', `
    <div class="form-group">
      <label class="form-label">Category Name</label>
      <input type="text" id="cat-name" class="form-input" placeholder="e.g. Pet Care, Coffee Shop" maxlength="30"/>
    </div>
    <div class="form-group">
      <label class="form-label">Emoji Icon</label>
      <input type="text" id="cat-icon" class="form-input" placeholder="Paste emoji or pick below" maxlength="4" style="font-size:20px"/>
      <div class="emoji-grid">
        ${EMOJI_PICKER.map(e => `<button type="button" onclick="document.getElementById('cat-icon').value='${e}';document.querySelectorAll('.emoji-pick-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')" class="emoji-pick-btn">${e}</button>`).join('')}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Category Type</label>
      <select id="cat-type" class="form-input">
        <option value="expense">❤️ Expense</option>
        <option value="income">💚 Income</option>
        <option value="both">🔄 Both</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveCategory()">Save Category</button>
    </div>`);
}

function openEditCategoryModal(id) {
  const cat = (STATE.customCategories || []).find(c => c.id === id);
  if (!cat) return;
  openModal('Edit Category', `
    <div class="form-group">
      <label class="form-label">Category Name</label>
      <input type="text" id="cat-name" class="form-input" value="${cat.name}" maxlength="30"/>
    </div>
    <div class="form-group">
      <label class="form-label">Emoji Icon</label>
      <input type="text" id="cat-icon" class="form-input" value="${cat.icon}" placeholder="Paste emoji" maxlength="4" style="font-size:20px"/>
      <div class="emoji-grid">
        ${EMOJI_PICKER.map(e => `<button type="button" onclick="document.getElementById('cat-icon').value='${e}';document.querySelectorAll('.emoji-pick-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')" class="emoji-pick-btn">${e}</button>`).join('')}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Type</label>
      <select id="cat-type" class="form-input">
        <option value="expense" ${cat.type==='expense'?'selected':''}>❤️ Expense</option>
        <option value="income" ${cat.type==='income'?'selected':''}>💚 Income</option>
        <option value="both" ${cat.type==='both'?'selected':''}>🔄 Both</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="updateCategory('${id}')">Update</button>
    </div>`);
}

function saveCategory() {
  const name = document.getElementById('cat-name').value.trim();
  const icon = document.getElementById('cat-icon').value.trim() || '📦';
  const type = document.getElementById('cat-type').value;
  if (!name) { toast('Enter a category name', 'error'); return; }
  const all = getAllCategories();
  if (all.some(c => c.name.toLowerCase() === name.toLowerCase())) { toast('Category already exists', 'error'); return; }
  STATE.customCategories = STATE.customCategories || [];
  STATE.customCategories.push({ id: genId(), name, icon, type, createdAt: new Date().toISOString() });
  saveState(); addXP(10, 'Category created'); closeModal();
  toast(`✅ Category "${name}" created!`, 'success');
  renderCategories();
}

function updateCategory(id) {
  const name = document.getElementById('cat-name').value.trim();
  const icon = document.getElementById('cat-icon').value.trim() || '📦';
  const type = document.getElementById('cat-type').value;
  if (!name) { toast('Enter a name', 'error'); return; }
  const cat = (STATE.customCategories || []).find(c => c.id === id);
  if (cat) {
    const oldName = cat.name;
    cat.name = name; cat.icon = icon; cat.type = type;
    // Rename existing transactions + recurring rules that used the old name
    if (oldName !== name) {
      (STATE.transactions || []).forEach(t => { if (t.category === oldName) { t.category = name; t.icon = icon; } });
      (STATE.recurring || []).forEach(r => { if (r.category === oldName) { r.category = name; r.icon = icon; } });
      (STATE.budgets || []).forEach(b => { if (b.category === oldName) b.category = name; });
    }
  }
  saveState(); closeModal(); toast('Category updated!', 'success'); renderCategories();
}

// ===== MERGE CATEGORIES =====
function openMergeCategoriesModal() {
  const opts = getAllCategories().map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('');
  openModal('🔀 Merge Categories', `
    <p style="font-size:13px;color:var(--text2);margin-bottom:14px">Move every transaction from one category into another. The source category's transactions are re-tagged; if it's a custom category it's removed.</p>
    <div class="form-group"><label class="form-label">Merge FROM (source)</label>
      <select id="mrg-from" class="form-input">${opts}</select></div>
    <div class="form-group"><label class="form-label">INTO (target)</label>
      <select id="mrg-into" class="form-input">${opts}</select></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="mergeCategories()">Merge</button>
    </div>`);
}

function mergeCategories() {
  const from = document.getElementById('mrg-from')?.value;
  const into = document.getElementById('mrg-into')?.value;
  if (!from || !into) return;
  if (from === into) { toast('Pick two different categories', 'error'); return; }
  const intoCat = getAllCategories().find(c => c.name === into);
  const intoIcon = intoCat?.icon || '📦';
  let count = 0;
  (STATE.transactions || []).forEach(t => { if (t.category === from) { t.category = into; t.icon = intoIcon; count++; } });
  (STATE.recurring || []).forEach(r => { if (r.category === from) { r.category = into; r.icon = intoIcon; } });
  (STATE.budgets || []).forEach(b => { if (b.category === from) b.category = into; });
  // Remove the source custom category (defaults can't be removed)
  STATE.customCategories = (STATE.customCategories || []).filter(c => c.name !== from);
  saveState(); closeModal();
  toast(`✅ Merged "${from}" → "${into}" (${count} moved)`, 'success');
  renderCategories();
}

// ===== RECURRING MANAGEMENT =====
function deleteRecurring(id) {
  STATE.recurring = (STATE.recurring || []).filter(r => r.id !== id);
  saveState(); toast('Recurring rule removed', 'info'); renderCategories();
}

function deleteCategory(id) {
  STATE.customCategories = (STATE.customCategories || []).filter(c => c.id !== id);
  saveState(); toast('Category deleted', 'info'); renderCategories();
}

// ===================================================================
//  AI Fix — generate a Gemini/ChatGPT prompt to re-categorise the
//  transactions that landed in "Other" (or have no category), then
//  paste the AI's JSON answer back to apply it. Improves categorisation
//  without any API key.
// ===================================================================
function openGeminiCategorize() {
  const cats = (typeof getAllCategories === 'function' ? getAllCategories() : []).map(c => c.name);
  const txs = (STATE.transactions || []).filter(t => t.type === 'expense' || t.type === 'income');
  // descriptions currently uncategorised / dumped in "Other"
  const weak = txs.filter(t => !t.category || /^other$/i.test(t.category));
  const items = [...new Set(weak.map(t => (t.description || '').trim()).filter(Boolean))].slice(0, 120);

  const prompt =
`You are a personal-finance categoriser. Map each transaction description to EXACTLY ONE category from this list:
${cats.join(', ')}

Rules:
- Pick the single best-fit category. Use "Other" only if truly nothing fits.
- Reply with ONLY a JSON object: {"description": "Category", ...}. No explanation, no markdown.

Descriptions:
${items.length ? items.map(d => '- ' + d).join('\n') : '(no uncategorised descriptions found — paste your own list)'}`;

  openModal('✨ AI Fix Categories', `
    <p style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:12px">
      ${weak.length ? `Found <b>${weak.length}</b> transaction(s) in “Other” / uncategorised.` : 'No “Other” transactions found — you can still paste your own list.'}
      Copy the prompt → paste into <b>Gemini / ChatGPT</b> → copy its answer → paste it back below.
    </p>

    <div class="form-group">
      <label class="form-label">1. Copy this prompt</label>
      <textarea id="gem-prompt" class="form-input" rows="5" readonly style="font-size:12px;line-height:1.5">${esc(prompt)}</textarea>
      <button class="btn-secondary btn-sm" style="margin-top:8px" onclick="navigator.clipboard.writeText(document.getElementById('gem-prompt').value).then(()=>toast('Prompt copied 📋','success'))"><i data-lucide="copy"></i> Copy prompt</button>
    </div>

    <div class="form-group" style="margin-top:14px">
      <label class="form-label">2. Paste the AI's JSON answer</label>
      <textarea id="gem-answer" class="form-input" rows="5" placeholder='{"Swiggy order":"Food","Indian Oil":"Fuel", ...}' style="font-size:12px;line-height:1.5"></textarea>
    </div>

    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="applyGeminiCategories()" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">✨ Apply Categories</button>
    </div>`);
  setTimeout(() => { if (window.lucide && lucide.createIcons) { try { lucide.createIcons(); } catch (_) {} } }, 20);
}

function applyGeminiCategories() {
  const raw = (document.getElementById('gem-answer')?.value || '').trim();
  if (!raw) { toast('Paste the AI answer first', 'error'); return; }
  // tolerate ```json fences / surrounding text — grab the first {...} block
  let jsonStr = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const m = jsonStr.match(/\{[\s\S]*\}/);
  if (m) jsonStr = m[0];
  let map;
  try { map = JSON.parse(jsonStr); } catch (e) { toast('Could not read the JSON — paste exactly what the AI returned', 'error'); return; }
  if (!map || typeof map !== 'object') { toast('Invalid answer format', 'error'); return; }

  const cats = (typeof getAllCategories === 'function' ? getAllCategories() : []);
  const catByLower = {}; cats.forEach(c => catByLower[c.name.toLowerCase()] = c);
  // normalise the map keys for matching
  const lookup = {};
  Object.keys(map).forEach(k => { lookup[k.trim().toLowerCase()] = String(map[k]).trim(); });

  let updated = 0;
  (STATE.transactions || []).forEach(t => {
    const desc = (t.description || '').trim().toLowerCase();
    if (!desc) return;
    // only re-categorise the weak ones
    if (t.category && !/^other$/i.test(t.category)) return;
    let newCat = lookup[desc];
    // fuzzy: a mapping key contained in the description (or vice-versa)
    if (!newCat) {
      const hit = Object.keys(lookup).find(k => k && (desc.includes(k) || k.includes(desc)));
      if (hit) newCat = lookup[hit];
    }
    if (!newCat) return;
    const cat = catByLower[newCat.toLowerCase()];
    if (!cat || /^other$/i.test(cat.name)) return;     // skip if AI said Other / unknown cat
    t.category = cat.name; t.icon = cat.icon || t.icon;
    updated++;
  });

  if (!updated) { toast('No transactions matched the AI answer', 'warning'); return; }
  saveState();
  closeModal();
  toast(`✨ Re-categorised ${updated} transaction${updated > 1 ? 's' : ''}!`, 'success');
  renderCategories();
}
