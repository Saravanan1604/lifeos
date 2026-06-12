// ============================================================
//  Notes — Google Keep–style quick notes
// ============================================================
const NOTE_COLOR_KEYS = ['default', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink'];
let _noteColor = 'default';

function _noteEsc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderNotes() {
  const all = (STATE.notes || []).slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const pinned = all.filter(n => n.pinned);
  const others = all.filter(n => !n.pinned);

  const section = (label, list) => list.length
    ? `<p class="notes-section-lbl">${label}</p><div class="notes-grid">${list.map(_noteCard).join('')}</div>`
    : '';

  document.getElementById('page-container').innerHTML = `
    <div class="fade-in">
      <div class="page-header notes-header">
        <div><h1 class="page-title"><i data-lucide="notebook-pen"></i> Notes</h1><p class="page-subtitle">Quick notes & reminders</p></div>
        <button class="btn-primary btn-sm notes-add-btn" onclick="openNoteEditor()"><i data-lucide="plus"></i> New Note</button>
      </div>
      ${all.length
        ? `${section('Pinned', pinned)}${section(pinned.length ? 'Others' : '', others)}`
        : `<div class="empty-state" style="padding:48px 20px;text-align:center">
             <span class="empty-state-icon" style="font-size:64px">🗒️</span>
             <p>No notes yet. Tap <b>+ New Note</b> to jot something down.</p>
             <button class="btn-primary" style="margin-top:14px" onclick="openNoteEditor()">+ New Note</button>
           </div>`}
    </div>`;
}

function _noteCard(n) {
  return `<div class="note-card note-${n.color || 'default'}" onclick="openNoteEditor('${n.id}')">
    ${n.pinned ? '<span class="note-pin"><i data-lucide="pin"></i></span>' : ''}
    ${n.title ? `<div class="note-title">${_noteEsc(n.title)}</div>` : ''}
    ${n.body ? `<div class="note-body">${_noteEsc(n.body)}</div>` : ''}
  </div>`;
}

function openNoteEditor(id) {
  const n = id ? (STATE.notes || []).find(x => x.id === id) : null;
  _noteColor = n ? (n.color || 'default') : 'default';
  const swatches = NOTE_COLOR_KEYS.map(k =>
    `<button type="button" class="note-swatch note-${k}${_noteColor === k ? ' on' : ''}"
       onclick="_noteColor='${k}';document.querySelectorAll('.note-swatch').forEach(s=>s.classList.remove('on'));this.classList.add('on')"></button>`).join('');

  openModal(n ? 'Edit Note' : 'New Note', `
    <input id="note-title" class="form-input" placeholder="Title" value="${n ? _noteEsc(n.title) : ''}" style="margin-bottom:10px"/>
    <textarea id="note-body" class="form-input" rows="6" placeholder="Take a note…">${n ? _noteEsc(n.body) : ''}</textarea>
    <div class="note-swatches">${swatches}</div>
    <div class="modal-actions">
      ${n ? `<button class="btn-secondary" onclick="togglePinNote('${n.id}');closeModal()">${n.pinned ? '📌 Unpin' : '📍 Pin'}</button>` : ''}
      ${n ? `<button class="btn-secondary" onclick="deleteNote('${n.id}');closeModal()" style="color:#ef4444;border-color:rgba(239,68,68,0.3)">Delete</button>` : ''}
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveNote('${id || ''}')">${n ? 'Update' : 'Save'}</button>
    </div>`);
}

function saveNote(id) {
  const title = (document.getElementById('note-title')?.value || '').trim();
  const body  = (document.getElementById('note-body')?.value || '').trim();
  if (!title && !body) { toast('Note is empty', 'warning'); return; }
  STATE.notes = STATE.notes || [];
  const now = Date.now();
  if (id) {
    const n = STATE.notes.find(x => x.id === id);
    if (n) { n.title = title; n.body = body; n.color = _noteColor; n.updatedAt = now; }
  } else {
    STATE.notes.push({ id: genId(), title, body, color: _noteColor, pinned: false, createdAt: now, updatedAt: now });
  }
  saveState(); closeModal();
  if (typeof currentPage !== 'undefined' && currentPage === 'notes') renderNotes();
  toast('Note saved', 'success');
}

function deleteNote(id) {
  STATE.notes = (STATE.notes || []).filter(x => x.id !== id);
  saveState();
  if (typeof currentPage !== 'undefined' && currentPage === 'notes') renderNotes();
  toast('Note deleted', 'info');
}

function togglePinNote(id) {
  const n = (STATE.notes || []).find(x => x.id === id);
  if (n) { n.pinned = !n.pinned; saveState(); renderNotes(); }
}
