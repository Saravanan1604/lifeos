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
        <div><h1 class="page-title">🏷️ Categories</h1><p class="page-subtitle">Manage your transaction categories</p></div>
        <button class="btn-primary btn-sm" onclick="openAddCategoryModal()">+ Custom Category</button>
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
                <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--glass);border:1px solid var(--glass-border);border-radius:12px;transition:.2s" onmouseover="this.style.background='var(--glass-hover)'" onmouseout="this.style.background='var(--glass)'">
                  <div style="display:flex;align-items:center;gap:10px">
                    <span style="font-size:24px">${c.icon}</span>
                    <div>
                      <p style="font-size:13px;font-weight:600">${c.name}</p>
                      <span class="tag ${c.type==='income'?'tag-green':c.type==='expense'?'tag-red':'tag-blue'}" style="font-size:10px;padding:2px 7px">${c.type}</span>
                    </div>
                  </div>
                  <div style="display:flex;gap:4px">
                    <button class="btn-icon btn-sm" onclick="openEditCategoryModal('${c.id}')" style="font-size:13px">✏️</button>
                    <button class="btn-icon btn-sm" onclick="deleteCategory('${c.id}')" style="color:#ef4444;border-color:rgba(239,68,68,0.3);font-size:13px">✕</button>
                  </div>
                </div>`).join('')}
            </div>`}
      </div>

      <!-- Default Income Categories -->
      <div class="glass-card" style="padding:20px;margin-bottom:20px">
        <p class="section-title" style="margin-bottom:14px">💚 Default Income Categories</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${incomeDefaults.map(c => `
            <div style="display:flex;align-items:center;gap:6px;padding:8px 12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:20px">
              <span style="font-size:16px">${c.icon}</span>
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
              <span style="font-size:16px">${c.icon}</span>
              <span style="font-size:13px;font-weight:500">${c.name}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

// Popular emojis for quick selection
const EMOJI_PICKER = ['💰','🍔','🚗','🏠','🛍️','💊','📚','✈️','🎬','💡','🎁','🐶','☕','🍕','🎵','💻','📱','🏋️','⛽','🧾','🏥','🛒','🎮','🌿','🍺','💈','🎓','🏦','🛡️','🎯','🔄','🤝','💆','📦','🌐','🎪','🏖️','🍱','🏃','🔧','🎨','🧴','💎','🚀','🌟','🏆','🎸','📷','🌺','🎭'];

function openAddCategoryModal() {
  openModal('Add Custom Category', `
    <div class="form-group">
      <label class="form-label">Category Name</label>
      <input type="text" id="cat-name" class="form-input" placeholder="e.g. Pet Care, Coffee Shop" maxlength="30"/>
    </div>
    <div class="form-group">
      <label class="form-label">Emoji Icon</label>
      <input type="text" id="cat-icon" class="form-input" placeholder="Paste emoji or pick below" maxlength="4" style="font-size:20px"/>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;max-height:120px;overflow-y:auto">
        ${EMOJI_PICKER.map(e => `<button onclick="document.getElementById('cat-icon').value='${e}';document.querySelectorAll('.emoji-pick-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')" class="emoji-pick-btn" style="background:none;border:1px solid var(--glass-border);border-radius:8px;padding:6px;font-size:20px;cursor:pointer;transition:.15s;min-width:38px">${e}</button>`).join('')}
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
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;max-height:120px;overflow-y:auto">
        ${EMOJI_PICKER.map(e => `<button onclick="document.getElementById('cat-icon').value='${e}'" style="background:none;border:1px solid var(--glass-border);border-radius:8px;padding:6px;font-size:20px;cursor:pointer;transition:.15s;min-width:38px">${e}</button>`).join('')}
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
  if (cat) { cat.name = name; cat.icon = icon; cat.type = type; }
  saveState(); closeModal(); toast('Category updated!', 'success'); renderCategories();
}

function deleteCategory(id) {
  STATE.customCategories = (STATE.customCategories || []).filter(c => c.id !== id);
  saveState(); toast('Category deleted', 'info'); renderCategories();
}
