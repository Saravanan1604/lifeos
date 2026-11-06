// ============================================================
const _mEsc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
//  motion.js — build 690: daily-use + motion pack (app)
//   • Today card: spent today vs daily allowance, ring, streak
//   • Repeat recent entries in two taps (add screen)
//   • Success burst after saving (check + haptic)
// ============================================================

// ── logging streak: consecutive days (ending today or yesterday) with an entry
function logStreak() {
  const days = new Set((STATE.transactions || []).map(t => (t.date || '').slice(0, 10)));
  const d = new Date(); let n = 0;
  if (!days.has(_ymdLocal(d))) d.setDate(d.getDate() - 1);           // today not logged yet → count up to yesterday
  while (days.has(_ymdLocal(d)) && n < 999) { n++; d.setDate(d.getDate() - 1); }
  return { n, today: days.has(_ymdLocal(new Date())) };
}

function homeTodayHtml(F) {
  const tdy = _ymdLocal(new Date());
  const list = (STATE.transactions || []).filter(t => t.type !== 'income' && (t.date || '').slice(0, 10) === tdy);
  const spent = list.reduce((s, t) => s + (+t.amount || 0), 0);
  let allow = null;
  if (F && F.budget) { const leftBefore = F.budget - (F.spent - spent); allow = leftBefore > 0 ? leftBefore / F.daysLeft : 0; }
  const pct = allow ? Math.min(100, spent / allow * 100) : (spent ? 100 : 0);
  const over = allow != null && spent > allow;
  const st = logStreak();
  const R = 26, C = 2 * Math.PI * R;
  const col = allow == null ? 'var(--cx-pri)' : over ? 'var(--cx-exp)' : pct >= 80 ? 'var(--cx-warn)' : 'var(--cx-inc)';
  return `<div class="hx-card td">
    <div class="td-ring"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="${R}" class="hx-ring-bg"/><circle cx="32" cy="32" r="${R}" class="hx-ring-fg" stroke="${col}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}" data-off="${(C * (1 - pct / 100)).toFixed(1)}"/></svg><i data-lucide="${over ? 'alert-triangle' : 'sun'}"></i></div>
    <div class="td-m">
      <p class="td-l">Today</p>
      <b>${fmt(Math.round(spent))}${allow != null ? ` <em>/ ${fmt(Math.floor(allow))}</em>` : ''}</b>
      <span>${allow == null ? `${list.length} entr${list.length === 1 ? 'y' : 'ies'} today` : over ? `${fmt(Math.round(spent - allow))} over today's allowance` : `${fmt(Math.floor(allow - spent))} left to spend today`}</span>
    </div>
    <div class="td-st ${st.today ? 'on' : ''}" title="Days in a row with at least one entry"><b>🔥 ${st.n}</b><span>${st.n === 1 ? 'day' : 'days'}</span></div>
    ${st.today ? '' : `<button class="td-add" onclick="openTxPad('expense')">${st.n ? 'Keep streak' : 'Log today'}</button>`}
  </div>`;
}

// ── recent distinct entries → one-tap repeat in the add screen
function padRecentHtml() {
  const seen = new Set(), out = [];
  for (const t of (STATE.transactions || []).slice().sort((a, b) => ((b.date || '') + (b.time || '')).localeCompare((a.date || '') + (a.time || '')))) {
    if (t.type !== _pad.type || !t.description) continue;
    const k = (t.description + '|' + t.category).toLowerCase(); if (seen.has(k)) continue;
    seen.add(k); out.push(t); if (out.length >= 6) break;
  }
  if (!out.length) return '';
  const cur = (STATE.settings && STATE.settings.currency) || '₹';
  return `<div class="px-rec"><span>Recent</span>${out.map(t => `<button type="button" onclick="padUseRecent('${t.id}')"><i style="background:${catColor(t.category)}"></i>${_mEsc(t.description.length > 16 ? t.description.slice(0, 15) + '…' : t.description)} · ${cur}${(+t.amount).toLocaleString('en-IN')}</button>`).join('')}</div>`;
}
function padUseRecent(id) {
  const t = (STATE.transactions || []).find(x => x.id === id); if (!t || !_pad) return;
  Object.assign(_pad, { expr: String(t.amount), category: t.category, notes: t.description, subcategory: t.subcategory || '', tag: t.tag || '', source: t.source || _pad.source });
  if (navigator.vibrate) { try { navigator.vibrate(10); } catch (_) {} }
  renderTxPad();
}

// ── success burst after saving
function successBurst(label) {
  if (navigator.vibrate) { try { navigator.vibrate([12, 40, 18]); } catch (_) {} }
  const el = document.createElement('div');
  el.className = 'sb-burst';
  el.innerHTML = `<div class="sb-burst-c"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg></div><p>${label || 'Saved'}</p>${'<i></i>'.repeat(10)}`;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('out'), 900);
  setTimeout(() => el.remove(), 1300);
}

// ── tap a ring segment → its name and amount appear in the centre (build 691)
//    tap it again, or tap anywhere else, to go back to the total
function _roseReset(rose) {
  const c = rose && rose.querySelector('.hx-donut-c');
  if (c && c.dataset.orig != null) { c.innerHTML = c.dataset.orig; delete c.dataset.orig; }
  if (rose) { rose.classList.remove('has-sel'); rose.querySelectorAll('.hx-rose-seg.sel').forEach(p => p.classList.remove('sel')); }
}
document.addEventListener('click', e => {
  const seg = e.target.closest && e.target.closest('.hx-rose-seg');
  document.querySelectorAll('.hx-rose.has-sel').forEach(r => { if (!seg || !r.contains(seg)) _roseReset(r); });
  if (!seg) return;
  const rose = seg.closest('.hx-rose'), c = rose && rose.querySelector('.hx-donut-c');
  if (!c) return;
  e.stopPropagation();
  if (seg.classList.contains('sel')) { _roseReset(rose); return; }
  if (c.dataset.orig == null) c.dataset.orig = c.innerHTML;
  rose.querySelectorAll('.hx-rose-seg.sel').forEach(p => p.classList.remove('sel'));
  seg.classList.add('sel'); rose.classList.add('has-sel');
  c.innerHTML = `<span style="color:${seg.getAttribute('fill')}">${_mEsc(seg.dataset.cat)}</span><b>${fmt(+seg.dataset.v)}</b><em>${_mEsc(seg.dataset.sub)}</em>`;
  c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
  if (navigator.vibrate) { try { navigator.vibrate(8); } catch (_) {} }
}, true);
