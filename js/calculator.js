// ===== FLOATING CALCULATOR =====
let calcOpen = false;
let calcMode = 'basic'; // basic | scientific | financial
let calcDisplay = '0';
let calcExpression = '';
let calcMemory = 0;
let calcJustCalc = false;
let calcDragPos = null; // {left, top} after first drag

// ============================================================
//  Clean full-screen calculator page (iOS / Google style grid)
//  Opened from the Add-Transaction amount field; "Use" returns value.
// ============================================================
let _cp = '';
let _calcPadSnap = null;   // remembers the Add-sheet (_pad) we were called from
const _CP_KEYS = [
  { k: 'C',  cls: 'fn' }, { k: '⌫', cls: 'fn' }, { k: '%', cls: 'fn' }, { k: '÷', cls: 'op' },
  { k: '7' }, { k: '8' }, { k: '9' }, { k: '×', cls: 'op' },
  { k: '4' }, { k: '5' }, { k: '6' }, { k: '−', cls: 'op' },
  { k: '1' }, { k: '2' }, { k: '3' }, { k: '+', cls: 'op' },
  { k: '( )', cls: 'fn' }, { k: '0' }, { k: '.' }, { k: '=', cls: 'op eq' },
];
function openCalcPage() {
  _cp = '';
  _calcPadSnap = (typeof _pad !== 'undefined' && _pad) ? _pad : null;
  let el = document.getElementById('calc-page');
  if (!el) { el = document.createElement('div'); el.id = 'calc-page'; document.body.appendChild(el); }
  el.innerHTML = `
    <div class="cp-top">
      <button class="cp-x" onclick="calcPageBack()" title="Back"><i data-lucide="arrow-left"></i></button>
      <span class="cp-title">Calculator</span>
      <button class="cp-use" onclick="calcPageUse()"><i data-lucide="check"></i> Use</button>
    </div>
    <div class="cp-display">
      <div class="cp-expr" id="cp-expr">0</div>
      <div class="cp-res" id="cp-res"></div>
    </div>
    <div class="cp-keys">
      ${_CP_KEYS.map(o => `<button class="cp-key ${o.cls || ''}" onclick="cpKey('${o.k}')">${o.k}</button>`).join('')}
    </div>`;
  el.style.display = 'flex';
  if (window.lucide && lucide.createIcons) lucide.createIcons();
  cpRender();
}
function closeCalcPage() { const el = document.getElementById('calc-page'); if (el) el.style.display = 'none'; }
// Back from calculator → close it and bring the Add sheet back (if we came from it)
function calcPageBack() {
  closeCalcPage();
  if (_calcPadSnap && typeof renderTxPad === 'function') { _pad = _calcPadSnap; renderTxPad(); }
}

// (Hardware Back for calc/voice overlays is handled in core.js's popstate
//  handler, with the Add-sheet exception — no separate listener needed here.)
function _cpEval(expr) {
  if (!expr) return NaN;
  let e = String(expr).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/%/g, '*0.01');
  e = e.replace(/[+\-*/.]+$/, '');
  if (!/^[-+*/.()0-9\s]*$/.test(e)) return NaN;
  try { const v = Function('"use strict";return (' + (e || '0') + ')')(); return (typeof v === 'number' && isFinite(v)) ? v : NaN; }
  catch (_) { return NaN; }
}
function cpRender() {
  const ex = document.getElementById('cp-expr'); const rs = document.getElementById('cp-res');
  if (ex) ex.textContent = _cp || '0';
  if (rs) { const v = _cpEval(_cp); rs.textContent = (_cp && !isNaN(v)) ? '= ' + (+v).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : ''; }
}
function cpKey(k) {
  const ops = '+−×÷';
  if (k === 'C' || k === 'AC') _cp = '';
  else if (k === '⌫') _cp = _cp.slice(0, -1);
  else if (k === '( )') {
    const open = (_cp.match(/\(/g) || []).length, close = (_cp.match(/\)/g) || []).length;
    const last = _cp.slice(-1);
    if (!_cp || '+−×÷('.includes(last)) _cp += '(';
    else if (open > close) _cp += ')';
    else _cp += '×(';
  }
  else if (k === '=') { const v = _cpEval(_cp); if (!isNaN(v)) _cp = String(+(+v).toFixed(4)); }
  else {
    const last = _cp.slice(-1);
    if (ops.includes(k)) { if (!_cp && k !== '−') return; if (ops.includes(last)) _cp = _cp.slice(0, -1); }
    _cp += k;
  }
  cpRender();
  if (navigator.vibrate) { try { navigator.vibrate(6); } catch (_) {} }
}
function calcPageUse() {
  const v = _cpEval(_cp);
  const p = (typeof _pad !== 'undefined' && _pad) ? _pad : _calcPadSnap;
  const ok = !isNaN(v) && !!p;
  if (ok) p.expr = String(+(+v).toFixed(2));
  closeCalcPage();
  // Re-render the Add sheet LAST so the amount field shows the result on top.
  if (ok && typeof renderTxPad === 'function') {
    _pad = p;
    renderTxPad();
    const inp = document.getElementById('pad-amount-input');
    if (inp) inp.value = p.expr;
  }
}

// (legacy floating calculator hook — kept for other entry points)
let _calcReturnToPad = false;
function openCalcForPad() {
  _calcReturnToPad = true;
  if (!calcOpen) toggleCalculator();
  const b = document.getElementById('calc-use-btn');
  if (b) b.style.display = '';
}
function calcUseValue() {
  const v = parseFloat(String(calcDisplay).replace(/,/g, ''));
  if (!isNaN(v) && typeof _pad !== 'undefined' && _pad) {
    _pad.expr = String(+(+v).toFixed(2));
    if (typeof renderTxPad === 'function') renderTxPad();
  }
  _calcReturnToPad = false;
  const b = document.getElementById('calc-use-btn'); if (b) b.style.display = 'none';
  if (calcOpen) toggleCalculator();
}

function toggleCalculator() {
  // Old floating calculator removed — always open the new full-screen page.
  if (typeof openCalcPage === 'function') { openCalcPage(); return; }
  calcOpen = !calcOpen;
  const win = document.getElementById('calc-window');
  if (!win) { console.error('calc-window not found'); return; }
  if (!calcOpen) { _calcReturnToPad = false; const _b = document.getElementById('calc-use-btn'); if (_b) _b.style.display = 'none'; }

  if (calcOpen) {
    // 1. Set critical styles first — position MUST be fixed
    win.style.position = 'fixed';
    win.style.display  = 'flex';
    win.style.opacity  = '0';
    win.style.transform = 'translateY(12px) scale(0.97)';
    win.style.pointerEvents = 'auto';
    win.style.zIndex = '2147483647';

    // 2. Render buttons if first time
    if (!win._calcRendered) {
      renderCalcBody();
      win._calcRendered = true;
    }

    // 3. Position in center after render so real dimensions are available
    requestAnimationFrame(() => {
      if (!calcDragPos) {
        const cw = win.offsetWidth  || 320;
        const ch = win.offsetHeight || 420;
        win.style.left   = Math.max(16, Math.round((window.innerWidth  - cw) / 2)) + 'px';
        win.style.top    = Math.max(16, Math.round((window.innerHeight - ch) / 2)) + 'px';
      } else {
        win.style.left = calcDragPos.left + 'px';
        win.style.top  = calcDragPos.top  + 'px';
      }
      win.style.right  = 'auto';
      win.style.bottom = 'auto';

      makeDraggable(win);

      // 4. Animate in on next frame
      requestAnimationFrame(() => {
        win.style.opacity   = '1';
        win.style.transform = 'translateY(0) scale(1)';
      });
    });

    document.body.classList.add('calc-open');   // lock background scroll
  } else {
    win.style.opacity   = '0';
    win.style.transform = 'translateY(20px) scale(0.95)';
    win.style.pointerEvents = 'none';
    document.body.classList.remove('calc-open');
    setTimeout(() => { if (!calcOpen) win.style.display = 'none'; }, 280);
  }
}

function makeDraggable(win) {
  if (win._draggable) return; // already set up
  win._draggable = true;
  const header = win.querySelector('.calc-header');
  if (!header) return;
  header.style.cursor = 'grab';

  let startX, startY, startLeft, startTop;

  function getRect() {
    const r = win.getBoundingClientRect();
    return { left: r.left, top: r.top };
  }

  function onStart(cx, cy) {
    const r = getRect();
    // Convert to left/top absolute so dragging works
    win.style.left   = r.left + 'px';
    win.style.top    = r.top  + 'px';
    win.style.right  = 'auto';
    win.style.bottom = 'auto';
    startX = cx; startY = cy;
    startLeft = r.left; startTop = r.top;
    header.style.cursor = 'grabbing';
  }

  function onMove(cx, cy) {
    let newLeft = startLeft + (cx - startX);
    let newTop  = startTop  + (cy - startY);
    // Clamp to viewport
    const maxLeft = window.innerWidth  - win.offsetWidth;
    const maxTop  = window.innerHeight - win.offsetHeight;
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop  = Math.max(0, Math.min(newTop,  maxTop));
    win.style.left = newLeft + 'px';
    win.style.top  = newTop  + 'px';
    calcDragPos = { left: newLeft, top: newTop };
  }

  function onEnd() { header.style.cursor = 'grab'; }

  // Mouse
  header.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    onStart(e.clientX, e.clientY);
    function mm(e) { onMove(e.clientX, e.clientY); }
    function mu() { onEnd(); document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); }
    document.addEventListener('mousemove', mm);
    document.addEventListener('mouseup', mu);
    e.preventDefault();
  });

  // Touch
  header.addEventListener('touchstart', e => {
    const t = e.touches[0];
    onStart(t.clientX, t.clientY);
    function tm(e) { const t=e.touches[0]; onMove(t.clientX, t.clientY); }
    function te() { onEnd(); document.removeEventListener('touchmove', tm); document.removeEventListener('touchend', te); }
    document.addEventListener('touchmove', tm, { passive: false });
    document.addEventListener('touchend', te);
  }, { passive: true });
}


function switchCalcMode(mode) {
  calcMode = mode;
  document.querySelectorAll('.calc-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  renderCalcBody();
}

function calcInput(val) {
  if (calcJustCalc && !isNaN(val) && val !== '.') { calcDisplay = '0'; calcExpression = ''; calcJustCalc = false; }
  if (calcJustCalc && (val === '+' || val === '-' || val === '*' || val === '/' || val === '%')) { calcJustCalc = false; }

  if (val === 'C') { calcDisplay = '0'; calcExpression = ''; calcJustCalc = false; }
  else if (val === '⌫') {
    if (calcDisplay.length > 1) calcDisplay = calcDisplay.slice(0, -1);
    else calcDisplay = '0';
  }
  else if (val === '=') { calcCalc(); }
  else if (val === '.') {
    const parts = calcDisplay.split(/[\+\-\*\/]/);
    const last = parts[parts.length - 1];
    if (!last.includes('.')) calcDisplay += '.';
  }
  else if (['+', '-', '*', '/', '%'].includes(val)) {
    calcJustCalc = false;
    calcDisplay += ` ${val} `;
  }
  else if (val === '±') {
    if (calcDisplay.startsWith('-')) calcDisplay = calcDisplay.slice(1);
    else calcDisplay = '-' + calcDisplay;
  }
  else if (val === 'MC') { calcMemory = 0; toast('Memory cleared', 'info'); }
  else if (val === 'MR') { calcDisplay += String(calcMemory); }
  else if (val === 'M+') { calcMemory += parseFloat(calcDisplay) || 0; toast(`Memory: ${calcMemory}`, 'info'); }
  else if (val === 'M-') { calcMemory -= parseFloat(calcDisplay) || 0; toast(`Memory: ${calcMemory}`, 'info'); }
  else { if (calcDisplay === '0') calcDisplay = val; else calcDisplay += val; }

  updateCalcDisplay();
}

function calcScientific(op) {
  let n = parseFloat(calcDisplay.split(' ').pop()) || 0;
  let result;
  switch(op) {
    case 'sin': result = Math.sin(n * Math.PI / 180); break;
    case 'cos': result = Math.cos(n * Math.PI / 180); break;
    case 'tan': result = Math.tan(n * Math.PI / 180); break;
    case 'log': result = Math.log10(n); break;
    case 'ln': result = Math.log(n); break;
    case 'sqrt': result = Math.sqrt(n); break;
    case 'x²': result = n * n; break;
    case 'x³': result = n * n * n; break;
    case '1/x': result = 1 / n; break;
    case 'π': calcDisplay += String(Math.PI.toFixed(8)); updateCalcDisplay(); return;
    case 'e': calcDisplay += String(Math.E.toFixed(8)); updateCalcDisplay(); return;
    case '10ˣ': result = Math.pow(10, n); break;
    case 'eˣ': result = Math.exp(n); break;
    case '|x|': result = Math.abs(n); break;
    case 'n!': result = factorial(Math.floor(n)); break;
    default: return;
  }
  if (isNaN(result) || !isFinite(result)) { calcDisplay = 'Error'; }
  else { calcDisplay = String(parseFloat(result.toFixed(10))); }
  calcJustCalc = true;
  updateCalcDisplay();
}

function factorial(n) {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity;
  return n * factorial(n - 1);
}

function calcFinancial(op) {
  const inputs = {};
  document.querySelectorAll('.fin-input').forEach(el => { inputs[el.id] = parseFloat(el.value) || 0; });

  let result = '';
  if (op === 'emi') {
    const P = inputs['fin-principal'];
    const r = (inputs['fin-rate'] / 100) / 12;
    const n = inputs['fin-tenure'] * 12;
    if (P && r && n) {
      const emi = P * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1);
      const total = emi * n;
      result = `EMI: ₹${emi.toFixed(2)}\nTotal: ₹${total.toFixed(2)}\nInterest: ₹${(total-P).toFixed(2)}`;
    }
  } else if (op === 'sip') {
    const P = inputs['fin-sip-amount'];
    const r = (inputs['fin-sip-rate'] / 100) / 12;
    const n = inputs['fin-sip-years'] * 12;
    if (P && r && n) {
      const fv = P * (Math.pow(1+r,n)-1) / r * (1+r);
      const invested = P * n;
      result = `Maturity: ₹${fv.toFixed(2)}\nInvested: ₹${invested.toFixed(2)}\nGain: ₹${(fv-invested).toFixed(2)}`;
    }
  } else if (op === 'fd') {
    const P = inputs['fin-fd-amount'];
    const r = inputs['fin-fd-rate'] / 100;
    const n = inputs['fin-fd-years'];
    const freq = 4; // quarterly
    if (P && r && n) {
      const fv = P * Math.pow(1 + r/freq, freq*n);
      result = `Maturity: ₹${fv.toFixed(2)}\nGain: ₹${(fv-P).toFixed(2)}\nReturn: ${(((fv-P)/P)*100).toFixed(2)}%`;
    }
  } else if (op === 'gst') {
    const amount = inputs['fin-gst-amount'];
    const rate = inputs['fin-gst-rate'];
    const gst = amount * rate / 100;
    result = `GST: ₹${gst.toFixed(2)}\nTotal: ₹${(amount+gst).toFixed(2)}`;
  } else if (op === 'tax') {
    const inc = inputs['fin-tax-income'] || 0;
    // India new-regime slabs (FY 2024-25)
    const slabs = [[300000,0],[400000,0.05],[300000,0.10],[200000,0.15],[300000,0.20],[Infinity,0.30]];
    let rem = inc, tax = 0;
    for (const [w, rate] of slabs) { if (rem <= 0) break; const t = Math.min(rem, w); tax += t * rate; rem -= t; }
    if (inc <= 700000) tax = 0;            // §87A rebate
    const cess = tax * 0.04, total = tax + cess;
    result = `Taxable: ₹${inc.toLocaleString('en-IN')}\nTax: ₹${tax.toFixed(0)}\nCess (4%): ₹${cess.toFixed(0)}\nTotal Tax: ₹${total.toFixed(0)}`;
  } else if (op === 'percent') {
    const total = inputs['fin-pct-total'];
    const pct = inputs['fin-pct-val'];
    const val = total * pct / 100;
    result = `${pct}% of ₹${total} = ₹${val.toFixed(2)}`;
  }

  const out = document.getElementById('fin-result');
  if (out) { out.textContent = result || 'Enter values above'; out.style.display = result ? 'block' : 'none'; }
}

function calcCalc() {
  try {
    let expr = calcDisplay.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
    // Handle % as modulo in expression
    let result = Function('"use strict"; return (' + expr + ')')();
    if (!isFinite(result)) { calcDisplay = 'Error'; }
    else { calcDisplay = String(parseFloat(result.toFixed(10))); }
    calcJustCalc = true;
  } catch { calcDisplay = 'Error'; }
  updateCalcDisplay();
}

function updateCalcDisplay() {
  const el = document.getElementById('calc-display');
  if (el) el.textContent = calcDisplay;
}

function renderCalcBody() {
  const body = document.getElementById('calc-body');
  if (!body) return;

  if (calcMode === 'basic') {
    body.innerHTML = `
      <div class="calc-grid-basic">
        ${[['MC','MR','M+','M-'],['C','±','%','⌫'],['7','8','9','/'],['4','5','6','*'],['1','2','3','-'],['0','.','=','+']].map(row=>
          row.map(k=>`<button class="calc-btn ${isNaN(k)&&k!='.'&&k!='⌫'?'calc-op':''} ${k==='='?'calc-eq':''} ${['MC','MR','M+','M-'].includes(k)?'calc-mem':''}" onclick="calcInput('${k}')">${k}</button>`).join('')
        ).join('')}
      </div>`;
  } else if (calcMode === 'scientific') {
    body.innerHTML = `
      <div class="calc-grid-sci">
        ${[['sin','cos','tan','log'],['ln','sqrt','x²','x³'],['1/x','π','e','n!'],['10ˣ','eˣ','|x|','(']].map(row=>
          row.map(k=>`<button class="calc-btn calc-sci" onclick="calcScientific('${k}')">${k}</button>`).join('')
        ).join('')}
      </div>
      <div class="calc-grid-basic">
        ${[['C','±','%','⌫'],['7','8','9','/'],['4','5','6','*'],['1','2','3','-'],['0','.','=','+']].map(row=>
          row.map(k=>`<button class="calc-btn ${isNaN(k)&&k!='.'&&k!='⌫'?'calc-op':''} ${k==='='?'calc-eq':''}" onclick="calcInput('${k}')">${k}</button>`).join('')
        ).join('')}
      </div>`;
  } else {
    body.innerHTML = `
      <div class="fin-tabs">
        <button class="calc-fin-tab active" onclick="switchFinTab(this,'emi-calc')">EMI</button>
        <button class="calc-fin-tab" onclick="switchFinTab(this,'sip-calc')">SIP</button>
        <button class="calc-fin-tab" onclick="switchFinTab(this,'fd-calc')">FD</button>
        <button class="calc-fin-tab" onclick="switchFinTab(this,'gst-calc')">GST</button>
        <button class="calc-fin-tab" onclick="switchFinTab(this,'tax-calc')">Tax</button>
        <button class="calc-fin-tab" onclick="switchFinTab(this,'pct-calc')">%</button>
      </div>
      <div id="fin-panes">
        <div id="emi-calc" class="fin-pane">
          <div class="fin-row"><label>Loan Amount (₹)</label><input id="fin-principal" type="number" class="form-input fin-input" placeholder="500000"/></div>
          <div class="fin-row"><label>Interest Rate (%/yr)</label><input id="fin-rate" type="number" class="form-input fin-input" placeholder="8.5" step="0.1"/></div>
          <div class="fin-row"><label>Tenure (years)</label><input id="fin-tenure" type="number" class="form-input fin-input" placeholder="20"/></div>
          <button class="btn-primary btn-full" onclick="calcFinancial('emi')">Calculate EMI</button>
        </div>
        <div id="sip-calc" class="fin-pane" style="display:none">
          <div class="fin-row"><label>Monthly SIP (₹)</label><input id="fin-sip-amount" type="number" class="form-input fin-input" placeholder="5000"/></div>
          <div class="fin-row"><label>Expected Return (%/yr)</label><input id="fin-sip-rate" type="number" class="form-input fin-input" placeholder="12"/></div>
          <div class="fin-row"><label>Duration (years)</label><input id="fin-sip-years" type="number" class="form-input fin-input" placeholder="10"/></div>
          <button class="btn-primary btn-full" onclick="calcFinancial('sip')">Calculate SIP</button>
        </div>
        <div id="fd-calc" class="fin-pane" style="display:none">
          <div class="fin-row"><label>FD Amount (₹)</label><input id="fin-fd-amount" type="number" class="form-input fin-input" placeholder="100000"/></div>
          <div class="fin-row"><label>Interest Rate (%/yr)</label><input id="fin-fd-rate" type="number" class="form-input fin-input" placeholder="7.0" step="0.1"/></div>
          <div class="fin-row"><label>Duration (years)</label><input id="fin-fd-years" type="number" class="form-input fin-input" placeholder="5"/></div>
          <button class="btn-primary btn-full" onclick="calcFinancial('fd')">Calculate FD</button>
        </div>
        <div id="gst-calc" class="fin-pane" style="display:none">
          <div class="fin-row"><label>Amount (₹)</label><input id="fin-gst-amount" type="number" class="form-input fin-input" placeholder="1000"/></div>
          <div class="fin-row"><label>GST Rate (%)</label><input id="fin-gst-rate" type="number" class="form-input fin-input" placeholder="18"/></div>
          <button class="btn-primary btn-full" onclick="calcFinancial('gst')">Calculate GST</button>
        </div>
        <div id="tax-calc" class="fin-pane" style="display:none">
          <div class="fin-row"><label>Annual Income (₹)</label><input id="fin-tax-income" type="number" class="form-input fin-input" placeholder="1200000"/></div>
          <button class="btn-primary btn-full" onclick="calcFinancial('tax')">Calculate Tax (New Regime)</button>
        </div>
        <div id="pct-calc" class="fin-pane" style="display:none">
          <div class="fin-row"><label>Total Amount (₹)</label><input id="fin-pct-total" type="number" class="form-input fin-input" placeholder="10000"/></div>
          <div class="fin-row"><label>Percentage (%)</label><input id="fin-pct-val" type="number" class="form-input fin-input" placeholder="15"/></div>
          <button class="btn-primary btn-full" onclick="calcFinancial('percent')">Calculate %</button>
        </div>
      </div>
      <pre id="fin-result" style="display:none;margin-top:10px;padding:12px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:10px;font-size:13px;color:#10b981;font-family:'JetBrains Mono',monospace;white-space:pre-wrap"></pre>`;
  }
}

function switchFinTab(btn, paneId) {
  document.querySelectorAll('.calc-fin-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.fin-pane').forEach(p=>p.style.display='none');
  document.getElementById(paneId).style.display='block';
  const res=document.getElementById('fin-result');
  if(res)res.style.display='none';
}
