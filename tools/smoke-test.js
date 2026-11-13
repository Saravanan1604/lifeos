// ============================================================
//  tools/smoke-test.js — opens every page and fails if any shows an error.
//  Runs on GitHub after every push (.github/workflows/smoke-test.yml).
//  Run it yourself:  python -m http.server 3333   (in the project folder)
//                    node tools/smoke-test.js      (needs Node + Playwright)
//  Checks each page in: phone Day, phone Night, desktop, classic web —
//  with demo data — for script errors, blank pages and sideways scrolling.
// ============================================================
const { chromium, devices } = require('playwright');
const BASE = process.env.BASE_URL || 'http://localhost:3333/index.html';
const PAGES = ['transactions', 'insights', 'investments', 'bank-tracker', 'upcoming', 'recurring', 'renewals', 'budget', 'spending',
  'settings', 'smart', 'dashboard', 'loan-detail', 'asset-detail', 'goals', 'notes', 'tags', 'purchases', 'split', 'categories',
  'yearly', 'habits', 'health', 'journal', 'achievements', 'ai-coach', 'help', 'data-check', 'finance'];
const MODES = [
  ['phone · Day', { ...devices['Pixel 7'] }, 'light', 'app'],
  ['phone · Night', { ...devices['Pixel 7'] }, 'dark', 'app'],
  ['desktop', { viewport: { width: 1400, height: 900 } }, 'light', 'desk'],
  ['classic web', { viewport: { width: 1400, height: 900 } }, 'dark', 'classic'],
];
// Noise from services that are unreachable in a test run (sign-in, ads, sync server)
const IGNORE = /onrender|googlesyndication|accounts\.google|gsi|Failed to fetch|NetworkError|net::ERR|Load failed|AbortError/i;

(async () => {
  const browser = await chromium.launch();
  const problems = [];
  for (const [mode, dev, theme, kind] of MODES) {
    const ctx = await browser.newContext({ ...dev, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    let current = 'start';
    page.on('pageerror', e => { if (!IGNORE.test(e.message)) problems.push(`${mode} · ${current}: ${e.message}`); });
    page.on('dialog', d => d.accept());
    await page.route(/onrender|googlesyndication|accounts\.google/, r => r.abort());
    // Optional: LOCAL_LIBS=folder with chart.umd.js / lucide.min.js when the CDN can't be reached
    if (process.env.LOCAL_LIBS) {
      const fs = require('fs'), path = require('path'), L = process.env.LOCAL_LIBS;
      await page.route(/chart\.umd/, r => r.fulfill({ body: fs.readFileSync(path.join(L, 'chart.umd.js')), contentType: 'application/javascript' }));
      await page.route(/lucide@/, r => r.fulfill({ body: fs.readFileSync(path.join(L, 'lucide.min.js')), contentType: 'application/javascript' }));
    }
    await page.goto(BASE);
    await page.evaluate(([theme, kind]) => {
      localStorage.clear();
      if (kind === 'app') localStorage.setItem('_isApp', '1');
      if (kind === 'classic') localStorage.setItem('lifeos_web_layout', 'classic');
      ['lifeos_tour3_done', 'lifeos_onboarded'].forEach(k => localStorage.setItem(k, '1'));
      localStorage.setItem('lifeos_v1', JSON.stringify({ user: { name: 'Test', email: 't', id: 't' }, settings: { theme }, transactions: [] }));
    }, [theme, kind]);
    await page.reload(); await page.waitForTimeout(1500);
    await page.evaluate(() => enableDemoMode()); await page.waitForTimeout(2500);
    for (const pg of PAGES) {
      current = pg;
      try {
        await page.evaluate(pg => {
          try { closeModal(); } catch (_) {}
          if (pg === 'loan-detail') return openLoanDetail((STATE.loans[0] || {}).id);
          if (pg === 'asset-detail') return openAssetDetail((STATE.investments[0] || {}).id);
          if (pg === 'dashboard' && window.openDeepDive) return openDeepDive(2);
          navigate(pg);
        }, pg);
      } catch (e) { problems.push(`${mode} · ${pg}: could not open — ${e.message.split('\n')[0]}`); continue; }
      await page.waitForTimeout(700);
      const r = await page.evaluate(() => {
        const c = document.getElementById('page-container');
        return { text: c ? c.innerText.trim().length : 0, wide: document.documentElement.scrollWidth - window.innerWidth };
      });
      if (r.text < 20) problems.push(`${mode} · ${pg}: page is blank`);
      if (kind === 'app' && r.wide > 4) problems.push(`${mode} · ${pg}: scrolls sideways by ${r.wide}px`);
    }
    console.log(`✓ checked ${PAGES.length} pages in ${mode}`);
    await ctx.close();
  }
  await browser.close();
  if (problems.length) { console.log(`\n✗ ${problems.length} problem(s):\n  ` + [...new Set(problems)].join('\n  ')); process.exit(1); }
  console.log('\nAll pages opened without errors.');
})();
