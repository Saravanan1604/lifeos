// ============================================================
//  demo.js — build 701: Demo mode (Settings → Demo mode)
//  ON : sample data in a separate local copy, cloud sync off.
//  OFF: demo copy deleted, real data reloaded. Real data is never
//       read, changed or merged while demo mode is on.
// ============================================================
function _demoExtras() {
  const d = n => { const x = new Date(); x.setDate(x.getDate() - n); return _ymdLocal(x); };
  const ahead = n => { const x = new Date(); x.setDate(x.getDate() + n); return _ymdLocal(x); };
  const daily = [['Food', 'Swiggy', 180, 420], ['Food', 'Tea & snacks', 40, 120], ['Transport', 'Uber', 120, 380], ['Groceries', 'BigBasket', 600, 1800], ['Fuel', 'Indian Oil', 500, 1200], ['Shopping', 'Amazon', 400, 2600], ['Entertainment', 'Movie', 250, 700], ['Health', 'Pharmacy', 150, 600]];
  const tx = [];
  for (let i = 0; i < 92; i++) {
    const n = (i * 7) % 3 === 0 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const p = daily[(i * 3 + k * 5) % daily.length];
      const amt = Math.round(p[2] + ((i * 37 + k * 53) % 100) / 100 * (p[3] - p[2]));
      tx.push({ id: genId(), type: 'expense', amount: amt, date: d(i), category: p[0], description: p[1], tag: i > 20 && i < 26 ? 'Goa trip' : '' });
    }
  }
  [0, 30, 60].forEach(m => {
    tx.push({ id: genId(), type: 'income', amount: 85000, date: d(m + 1), category: 'Salary', description: 'Salary - Tech Corp' });
    tx.push({ id: genId(), type: 'expense', amount: 22000, date: d(m + 2), category: 'Rent', description: 'House rent' });
    tx.push({ id: genId(), type: 'expense', amount: 18500, date: d(m + 3), category: 'EMI', description: 'Car loan EMI' });
    tx.push({ id: genId(), type: 'expense', amount: 649, date: d(m + 4), category: 'OTT', description: 'Netflix' });
    tx.push({ id: genId(), type: 'expense', amount: 5000, date: d(m + 5), category: 'SIP', description: 'Index fund SIP' });
  });
  return {
    tx,
    recurring: [
      { id: genId(), type: 'income', amount: 85000, category: 'Salary', description: 'Salary - Tech Corp', frequency: 'monthly', nextDate: ahead(29), enabled: true },
      { id: genId(), type: 'expense', amount: 22000, category: 'Rent', description: 'House rent', frequency: 'monthly', nextDate: ahead(28), enabled: true },
      { id: genId(), type: 'expense', amount: 18500, category: 'EMI', description: 'Car loan EMI', frequency: 'monthly', nextDate: ahead(27), enabled: true },
      { id: genId(), type: 'expense', amount: 649, category: 'OTT', description: 'Netflix', frequency: 'monthly', nextDate: ahead(5), enabled: true },
      { id: genId(), type: 'expense', amount: 5000, category: 'SIP', description: 'Index fund SIP', frequency: 'monthly', nextDate: ahead(3), enabled: true },
      { id: genId(), type: 'expense', amount: 12500, category: 'Insurance', description: 'Health insurance', frequency: 'yearly', nextDate: ahead(40), enabled: true },
    ],
    purchases: [
      { id: genId(), name: 'Phone', model: 'Pixel 8', amount: 52000, category: 'Shopping', seller: 'Croma', date: d(140), warrantyEnd: ahead(225), payMode: 'Credit Card' },
      { id: genId(), name: 'Washing machine', model: 'LG 7kg', amount: 28000, category: 'Shopping', seller: 'Reliance Digital', date: d(400), warrantyEnd: ahead(20), payMode: 'UPI' },
    ],
    splits: [
      { id: genId(), description: 'Goa trip villa', amount: 18000, payer: 'Me', date: d(22), people: [{ name: 'Me', share: 6000, paid: true }, { name: 'Ravi', share: 6000, paid: true }, { name: 'Kumar', share: 6000, paid: false }] },
      { id: genId(), description: 'Team dinner', amount: 3600, payer: 'Ravi', date: d(6), people: [{ name: 'Me', share: 1200, paid: false }, { name: 'Ravi', share: 1200, paid: true }, { name: 'Anu', share: 1200, paid: true }] },
    ],
  };
}

function enableDemoMode() {
  if (isDemoMode()) return;
  if (!confirm('Turn on Demo mode?\n\nThe app will show sample data so you can try every feature.\n\nYour real data stays safe — it is not changed, mixed or synced. Turn Demo mode off any time from the banner or Settings.')) return;
  const user = STATE.user ? { ...STATE.user } : { id: 'demo', name: 'Demo', email: '' };
  const settings = { ...(STATE.settings || {}) };
  try { localStorage.setItem('lifeos_demo_on', '1'); localStorage.removeItem('lifeos_demo_v1'); } catch (_) {}
  STATE = Object.assign(DB.defaults(), { user, settings });
  DB.save(STATE);
  const c0 = window.confirm, n0 = window.navigate, cel = window.showCelebration;
  window.confirm = () => true; window.navigate = () => {}; window.showCelebration = () => {};
  try { seedDemoData(); } catch (e) { console.log(e); }
  finally { window.confirm = c0; window.navigate = n0; window.showCelebration = cel; }
  try {
    const x = _demoExtras();
    STATE.transactions = (STATE.transactions || []).concat(x.tx);
    STATE.recurring = x.recurring; STATE.purchases = x.purchases; STATE.splits = x.splits;
    STATE.xp = 0; STATE.level = 1;
    saveState();
  } catch (e) { console.log(e); }
  _demoBanner();
  if (typeof toast === 'function') toast('Demo mode on — exploring sample data', 'success');
  navigate('transactions');
}

function disableDemoMode(skipConfirm) {
  if (!isDemoMode()) return;
  if (!skipConfirm && !confirm('Turn off Demo mode?\n\nThe sample data will be removed and your real data comes back.')) return;
  try { localStorage.removeItem('lifeos_demo_on'); localStorage.removeItem('lifeos_demo_v1'); } catch (_) {}
  location.reload();
}
function toggleDemoMode() { if (isDemoMode()) disableDemoMode(); else enableDemoMode(); }

function _demoBanner() {
  let b = document.getElementById('demo-banner');
  if (!isDemoMode()) { if (b) b.remove(); document.documentElement.classList.remove('demo-on'); return; }
  document.documentElement.classList.add('demo-on');
  if (b) return;
  b = document.createElement('div'); b.id = 'demo-banner';
  b.innerHTML = `<span>🧪 <b>Demo mode</b> · sample data, nothing is saved to your account</span><button onclick="disableDemoMode()">Turn off</button>`;
  document.body.appendChild(b);
}

(function () {
  // Reset All Data in demo mode just leaves demo mode (never wipes the real account)
  if (typeof confirmReset === 'function') {
    const cr = confirmReset;
    window.confirmReset = function () { if (isDemoMode()) return disableDemoMode(); return cr.apply(this, arguments); };
  }
  // Old "Load demo data" buttons now open safe Demo mode instead of overwriting real data
  if (typeof seedDemoData === 'function') {
    const sd = seedDemoData;
    window.seedDemoData = function () { if (isDemoMode()) return sd.apply(this, arguments); return enableDemoMode(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _demoBanner); else _demoBanner();
})();
