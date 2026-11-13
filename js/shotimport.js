// ============================================================
//  shotimport.js — build 748: add entries from payment-app screenshots
//  Works like "AI Fix categories": copy a ready request → open Gemini →
//  attach the Google Pay / PhonePe / bank-app screenshot(s) → paste the
//  answer back → review (type, category, account, duplicates) → add.
//  Free, no API key; nothing is saved until you tap Add.
// ============================================================
let _si = { rows: [] };
const _siE = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function openScanChooser() {
  openModal('Scan', `<div class="si-pick">
    <button onclick="closeModal();openShotImport()"><span class="p"><i data-lucide="image"></i></span><div><b>Payment screenshot</b><small>Google Pay, PhonePe, Paytm or bank app history — read by Gemini</small></div><i data-lucide="chevron-right"></i></button>
    <button onclick="closeModal();typeof openSmsParser==='function'&&openSmsParser()"><span class="c"><i data-lucide="message-square-text"></i></span><div><b>SMS text</b><small>Paste a bank SMS</small></div><i data-lucide="chevron-right"></i></button>
  </div>`);
  const b = document.getElementById('modal-body'); if (b) b.dataset.kind = 'aifix';
  if (typeof _lucideRefresh === 'function') _lucideRefresh();
}

function _siAccounts() {
  return [...(STATE.bankAccounts || []).filter(a => !a.inactive).map(a => ({ v: 'bank:' + a.id, l: a.bankName || 'Bank' })),
    ...(STATE.creditCards || []).map(c => ({ v: 'card:' + c.id, l: (c.bankName || 'Card') + ' card' })),
    ...(STATE.cashAccounts || []).map(c => ({ v: 'cash:' + c.id, l: c.name || 'Cash' }))];
}
function _siPrompt() {
  const cats = (typeof getAllCategories === 'function' ? getAllCategories() : []);
  const exp = cats.filter(c => c.type !== 'income').map(c => c.name), inc = cats.filter(c => c.type !== 'expense').map(c => c.name);
  const accs = _siAccounts().map(a => a.l);
  const t = new Date(), td = _ymdLocal(t);
  return `Read the payment history screenshot(s) I attached (Google Pay, PhonePe, Paytm or a bank app) and list every transaction.

Today is ${td} (${t.toLocaleDateString('en-IN', { weekday: 'long' })}), time now ${t.toTimeString().slice(0, 5)}. Turn "23 mins ago", "3 hours ago", "Yesterday", "2 November" etc. into a real date. Use the year shown in the screenshot's month header; if none, assume the most recent past date.

Rules:
- "Paid to", "Sent to", "Debited", a minus sign or an up-arrow = "expense".
- "Received from", "Credited", "Refund", "Cashback", a plus sign or a down-arrow = "income".
- Skip anything marked Failed, Pending, Declined or Cancelled. Skip month totals and section headers.
- "name" = the person or shop exactly as shown (no "Paid to").
- "category" = pick the best one from my list. Expense: ${exp.join(', ')}. Income: ${inc.join(', ')}. Use "Other" if unsure. Payments to a person's name with no shop → "Transfer" if that is in my list, otherwise "Other".
- "account" = the bank or card it was paid from if visible (logo or "Debited from"), matched to one of mine: ${accs.length ? accs.join(', ') : '(none)'}. Otherwise "".

Reply with ONLY a JSON array, no other text, like:
[{"date":"${td}","type":"expense","amount":560,"name":"AL BASHEER BIRIYANI","category":"Food","account":"ICICI"}]`;
}

function openShotImport() {
  const n = (STATE.transactions || []).length;
  openModal('Add from screenshot', `<div class="af si">
    <div class="af-hero"><b><i data-lucide="image-plus"></i></b><span>Add entries from a screenshot</span><small>Gemini reads your Google Pay / PhonePe history — free, about 1 minute. Nothing is added until you check and tap Add.</small></div>
    <div class="af-step"><span class="af-n">1</span><div><b>Copy the request</b><small>It has today's date, your categories and your accounts.</small>
      <div class="af-btns"><button class="p" onclick="navigator.clipboard.writeText(document.getElementById('si-prompt').value).then(()=>toast('Copied — now open Gemini','success')).catch(()=>toast('Open “See what will be sent” and copy it','info'))"><i data-lucide="copy"></i>Copy</button>
      <button onclick="window.open('https://gemini.google.com/app','_blank')"><i data-lucide="external-link"></i>Open Gemini</button></div>
      <details><summary>See what will be sent</summary><textarea id="si-prompt" readonly>${_siE(_siPrompt())}</textarea></details></div></div>
    <div class="af-step"><span class="af-n">2</span><div><b>In Gemini: attach the screenshot(s), paste, send</b><small>In Gemini tap the + (or image) button, choose one or more screenshots, then paste the request and send.</small></div></div>
    <div class="af-step"><span class="af-n">3</span><div><b>Paste Gemini's answer here</b><small>Copy its whole reply and paste it below.</small>
      <textarea id="si-answer" placeholder='[{"date":"2026-11-13","type":"expense","amount":30,"name":"GREEN BANANA", …}]'></textarea>
      <div class="af-btns"><button onclick="navigator.clipboard.readText().then(t=>{document.getElementById('si-answer').value=t;toast('Pasted','success')}).catch(()=>toast('Long-press the box and choose Paste','info'))"><i data-lucide="clipboard-paste"></i>Paste</button></div></div></div>
    <button class="af-go" onclick="shotImportRead()"><i data-lucide="scan-line"></i>Read entries</button>
  </div>`);
  const b = document.getElementById('modal-body'); if (b) b.dataset.kind = 'aifix';
  if (typeof _lucideRefresh === 'function') _lucideRefresh();
}

// Parse the AI answer: JSON array (code fences / extra text allowed), or simple lines
function _siParse(txt) {
  txt = String(txt || '').replace(/```(json)?/gi, '').trim();
  let arr = null;
  const a = txt.indexOf('['), z = txt.lastIndexOf(']');
  if (a >= 0 && z > a) { try { arr = JSON.parse(txt.slice(a, z + 1)); } catch (_) { try { arr = JSON.parse(txt.slice(a, z + 1).replace(/,\s*([\]}])/g, '$1').replace(/[“”]/g, '"')); } catch (_) {} } }
  if (!Array.isArray(arr)) { // fallback: "2026-11-13 | expense | 560 | Name | Food | ICICI"
    arr = txt.split('\n').map(l => l.split('|').map(s => s.trim())).filter(p => p.length >= 4 && /\d/.test(p[2]))
      .map(p => ({ date: p[0], type: p[1], amount: p[2], name: p[3], category: p[4], account: p[5] }));
  }
  const td = _ymdLocal(new Date());
  return arr.map(r => {
    const amt = Math.abs(parseFloat(String(r.amount ?? r.amt ?? '').replace(/[₹,\s]/g, '')) || 0);
    let d = String(r.date || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) d = td;
    const type = /inc|credit|receiv|refund|cash ?back/i.test(r.type || '') ? 'income' : 'expense';
    return { date: d, type, amount: amt, name: String(r.name || r.description || r.to || '').trim(), category: String(r.category || '').trim(), account: String(r.account || '').trim() };
  }).filter(r => r.amount > 0 && r.name);
}

function shotImportRead() {
  const txt = (document.getElementById('si-answer') || {}).value || '';
  const rows = _siParse(txt);
  if (!rows.length) { toast("Couldn't find any entries — paste Gemini's whole reply", 'error'); return; }
  const cats = typeof getAllCategories === 'function' ? getAllCategories() : [], accs = _siAccounts();
  const catOk = (n, type) => cats.find(c => c.name.toLowerCase() === (n || '').toLowerCase() && (c.type === 'both' || c.type === type || !c.type));
  const tx = STATE.transactions || [];
  _si.rows = rows.map(r => {
    const rule = typeof getCategoryRule === 'function' ? getCategoryRule(r.name) : null;   // your own "name → category" choice wins
    const c = catOk(rule, r.type) || catOk(r.category, r.type);
    const acc = accs.find(a => r.account && (a.l.toLowerCase().includes(r.account.toLowerCase()) || r.account.toLowerCase().includes(a.l.toLowerCase().replace(' card', ''))));
    const dup = tx.some(t => Money.day(t) === r.date && Math.abs(Money.amt(t) - r.amount) < 0.01 && (t.type === 'income') === (r.type === 'income'));
    return { ...r, category: c ? c.name : (r.type === 'income' ? 'Other Income' : 'Other'), source: acc ? acc.v : '', dup, on: !dup };
  });
  _siReview();
}

function _siReview() {
  const cats = typeof getAllCategories === 'function' ? getAllCategories() : [], accs = _siAccounts();
  const sel = _si.rows.filter(r => r.on), out = sel.filter(r => r.type !== 'income').reduce((s, r) => s + r.amount, 0), inn = sel.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const dups = _si.rows.filter(r => r.dup).length;
  const row = (r, i) => `<div class="si-r ${r.on ? '' : 'off'} ${r.dup ? 'dup' : ''}">
    <label class="si-ck"><input type="checkbox" ${r.on ? 'checked' : ''} onchange="_si.rows[${i}].on=this.checked;_siReview()"><span></span></label>
    <div class="si-m">
      <div class="si-t"><b>${_siE(r.name)}</b><button class="si-amt ${r.type}" onclick="_si.rows[${i}].type=_si.rows[${i}].type==='income'?'expense':'income';_siReview()" title="Tap to switch expense / income">${r.type === 'income' ? '+' : '−'}${fmt(r.amount)}</button></div>
      <small>${new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}${r.dup ? ' · <em>already in your records?</em>' : ''}</small>
      <div class="si-sel"><select onchange="_si.rows[${i}].category=this.value">${cats.filter(c => c.type === 'both' || c.type === r.type || !c.type).map(c => `<option ${c.name === r.category ? 'selected' : ''}>${_siE(c.name)}</option>`).join('')}</select>
        <select onchange="_si.rows[${i}].source=this.value"><option value="">No account</option>${accs.map(a => `<option value="${a.v}" ${a.v === r.source ? 'selected' : ''}>${_siE(a.l)}</option>`).join('')}</select></div>
    </div></div>`;
  openModal('Check before adding', `<div class="af si">
    <div class="si-sum"><div><small>Selected</small><b>${sel.length} of ${_si.rows.length}</b></div><div><small>Out</small><b class="exp">−${fmt(Math.round(out))}</b></div><div><small>In</small><b class="inc">+${fmt(Math.round(inn))}</b></div></div>
    ${dups ? `<p class="si-note"><i data-lucide="copy"></i>${dups} look${dups === 1 ? 's' : ''} already added (same date and amount) — left unticked.</p>` : ''}
    <p class="si-note"><i data-lucide="info"></i>Tap an amount to switch expense / income.</p>
    <div class="si-list">${_si.rows.map(row).join('')}</div>
    <div class="af-btns si-foot"><button onclick="openShotImport()"><i data-lucide="arrow-left"></i>Back</button><button class="p" onclick="shotImportSave()" ${sel.length ? '' : 'disabled'}><i data-lucide="check"></i>Add ${sel.length} entr${sel.length === 1 ? 'y' : 'ies'}</button></div>
  </div>`);
  const b = document.getElementById('modal-body'); if (b) b.dataset.kind = 'aifix';
  if (typeof _lucideRefresh === 'function') _lucideRefresh();
}

function shotImportSave() {
  const sel = _si.rows.filter(r => r.on); if (!sel.length) return;
  STATE.transactions = STATE.transactions || [];
  const now = new Date().toISOString();
  sel.forEach(r => {
    const tx = { id: genId(), type: r.type, amount: Math.round(r.amount * 100) / 100, date: r.date, time: '', category: r.category,
      icon: typeof catIcon === 'function' ? catIcon(r.category) : '', description: r.name, subcategory: '', source: r.source || '', via: 'screenshot', createdAt: now };
    STATE.transactions.unshift(tx);
    if (tx.source && typeof _applyTxToAccount === 'function') { try { _applyTxToAccount(tx); } catch (_) {} }
    if (typeof setCategoryRule === 'function' && r.category && !/^other/i.test(r.category)) { try { setCategoryRule(r.name, r.category); } catch (_) {} }
  });
  saveState(); closeModal();
  toast(`${sel.length} entr${sel.length === 1 ? 'y' : 'ies'} added from screenshot ✓`, 'success');
  _si.rows = [];
  try { navigate(typeof currentPage !== 'undefined' && currentPage ? currentPage : 'transactions', true); } catch (_) {}
}
