// ============================================================
//  Home Widgets — add charts from AI Coach / Comparison / Analytics
// ============================================================
const HOME_WIDGETS_KEY = 'lifeos_home_widgets';
const _hwCharts = {};

function getHomeWidgets() { try { return JSON.parse(localStorage.getItem(HOME_WIDGETS_KEY)) || []; } catch { return []; } }
function setHomeWidgets(a) { try { localStorage.setItem(HOME_WIDGETS_KEY, JSON.stringify(a)); } catch {} }

/* ---------- data helpers ---------- */
function _hwMonths(n) {
  const arr = []; const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    let inc = 0, exp = 0;
    (STATE.transactions || []).forEach(t => {
      if ((t.date || '').startsWith(ym)) { if (t.type === 'income') inc += t.amount; else exp += t.amount; }
    });
    arr.push({ ym, inc, exp, sav: inc - exp, label: d.toLocaleString('default', { month: 'short' }) });
  }
  return arr;
}
function _hwCatSpend(ym) {
  const m = {};
  (STATE.transactions || []).forEach(t => {
    if (t.type === 'expense' && (t.date || '').startsWith(ym)) m[t.category] = (m[t.category] || 0) + t.amount;
  });
  return Object.entries(m).sort(([, a], [, b]) => b - a);
}
function _hwOpts(extra) {
  const isLight = document.body.classList.contains('light');
  const grid = isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.07)';
  const tick = isLight ? '#475569' : '#94a3b8';
  return Object.assign({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: tick, font: { size: 13 } }, position: 'bottom' } },
    scales: { x: { grid: { color: grid }, ticks: { color: tick } }, y: { grid: { color: grid }, ticks: { color: tick } } }
  }, extra || {});
}
function _hwMake(cid, cfg) {
  const cv = document.getElementById(cid);
  if (!cv || typeof Chart === 'undefined') return;
  if (_hwCharts[cid]) { _hwCharts[cid].destroy(); }
  _hwCharts[cid] = new Chart(cv, cfg);
}

/* ---------- widget registry ---------- */
const WIDGET_REGISTRY = {
  rule: { label: 'Rule of the Day', group: 'AI Coach', type: 'stat', build(cid, card) {
    const rules = ['Pay yourself first — save before you spend.', 'Track every rupee for 30 days; awareness changes behaviour.',
      'Keep 3–6 months of expenses as an emergency fund.', 'If you can\'t buy it twice, you can\'t afford it.',
      'Automate savings so willpower isn\'t required.', 'Beware small recurring costs — they add up fast.'];
    const r = rules[new Date().getDate() % rules.length];
    card.querySelector('.hw-canvas-wrap').innerHTML =
      `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;gap:10px"><span style="font-size:40px">💡</span><p style="font-size:20px;font-weight:700;max-width:90%">${r}</p></div>`;
  } },
  actualbudget: { label: 'Category — Actual vs Budget', group: 'Analytics', type: 'chart', build(cid) {
    const ym = new Date().toISOString().slice(0, 7);
    const buds = (STATE.budgets || []).slice(0, 8);
    const spentMap = Object.fromEntries(_hwCatSpend(ym));
    _hwMake(cid, { type: 'bar', data: { labels: buds.map(b => b.category), datasets: [
      { label: 'Spent', data: buds.map(b => spentMap[b.category] || 0), backgroundColor: '#00c9a7' },
      { label: 'Budget', data: buds.map(b => b.amount || b.limit || 0), backgroundColor: 'rgba(148,163,184,.5)' },
    ] }, options: _hwOpts() });
  } },
};

/* ---------- render on Home ---------- */
function renderHomeWidgets() {
  const host = document.getElementById('home-widgets');
  if (!host) return;
  const list = getHomeWidgets().filter(k => WIDGET_REGISTRY[k]);
  host.innerHTML = '';
  if (!list.length) return;
  list.forEach(key => {
    const w = WIDGET_REGISTRY[key];
    const card = document.createElement('div');
    card.className = 'glass-card hw-card';
    card.style.cssText = 'padding:18px;margin-bottom:18px';
    card.innerHTML =
      `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
         <p class="section-title" style="margin:0">${w.label}</p>
         ${(typeof _loEdit !== 'undefined' && _loEdit) ? `<button onclick="removeHomeWidget('${key}')" style="background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#ef4444;border-radius:8px;padding:6px 12px;cursor:pointer">✕ Remove</button>` : ''}
       </div>
       <div class="hw-canvas-wrap" style="position:relative;height:${w.type === 'stat' ? '160px' : '250px'}"><canvas id="hwc-${key}"></canvas></div>`;
    host.appendChild(card);
    try { w.build('hwc-' + key, card); } catch (e) {}
  });
}

function openWidgetPicker() {
  const added = getHomeWidgets();
  const groups = {};
  Object.entries(WIDGET_REGISTRY).forEach(([k, w]) => { (groups[w.group] = groups[w.group] || []).push([k, w]); });
  const html = Object.entries(groups).map(([g, items]) =>
    `<p style="font-weight:800;margin:16px 0 8px;color:var(--text2)">${g}</p>` +
    items.map(([k, w]) =>
      `<label style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--glass-border);border-radius:12px;margin-bottom:8px;cursor:pointer">
         <input type="checkbox" ${added.includes(k) ? 'checked' : ''} onchange="toggleHomeWidget('${k}',this.checked)" style="width:20px;height:20px;accent-color:#00c9a7"/>
         <span style="font-size:16px;font-weight:600">${w.label}</span>
       </label>`).join('')
  ).join('');
  openModal('➕ Add Charts to Home', html +
    `<div class="modal-actions"><button class="btn-primary" onclick="closeModal();navigate('dashboard',true)">Done</button></div>`);
}
function toggleHomeWidget(k, on) {
  let a = getHomeWidgets();
  if (on) { if (!a.includes(k)) a.push(k); } else a = a.filter(x => x !== k);
  setHomeWidgets(a);
}
function removeHomeWidget(k) {
  setHomeWidgets(getHomeWidgets().filter(x => x !== k));
  navigate('dashboard', true);
}
