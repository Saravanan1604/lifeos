# 🛑 AI Assistant System Instructions — LifeOS

## Tech Stack Overview
**LifeOS** is a strict **Vanilla JavaScript** application.
**DO NOT** generate or suggest code using React, Vue, Svelte, Angular, Flutter,
Jetpack Compose, or any other UI framework/library.

### Core Architecture
- **Frontend:** Vanilla JS (ES6+), pure HTML, and hand-written CSS.
- **Rendering:** UI is constructed via JS template literals and injected using
  `innerHTML` (e.g., `renderDashboard()`, `renderFinance()`).
- **Styling:** Mobile/app CSS lives in `css/mobile.css` and is scoped to
  `html.is-app`. No preprocessors (SASS/LESS) and no Tailwind.
- **Build System:** None. No Webpack, Vite, or bundlers.
- **Libraries (CDN ONLY):** Chart.js, SheetJS (XLSX), PDF.js, Lucide icons.
  Do not suggest `npm install`.
- **APIs:** Browser-native Web Speech API.
- **Platform:** PWA wrapped as a TWA via PWABuilder (Google Play).
- **Backend:** Node.js + MongoDB on Render. Frontend on Vercel
  (`lifeos-psi-roan.vercel.app`).

### Output Rules for AI
1. Provide solutions **only** in plain JS, HTML, and CSS.
2. Structure UI fixes as JS string templates (for structure) and scoped CSS
   rules (for styling).
3. Assume a mobile-first UI approach.

## Critical Constraints
- **Web/desktop layout must remain 100% unaffected.** ALL mobile styling must be
  scoped under `html.is-app` so it only applies inside the installed app and
  never leaks into the web/desktop layout.
- The installed app sets the `is-app` class (display-mode / referrer /
  localStorage detection in `index.html`'s inline head script).

## Deploy Workflow
- Edit `css/mobile.css` (mobile styling) and/or `js/*.js` (structure).
- Bump versions so caches refresh: `APP_BUILD` in `js/storage.js`, `CACHE` in
  `sw.js`, and the `?v=NN` cache-busters in `index.html`.
- Easiest: double-click **`deploy.bat`** (runs `deploy.ps1`) — it auto-bumps all
  version numbers, commits, and pushes. Vercel auto-deploys (~1 min).
- On the phone: fully close LifeOS and reopen to pick up the new build
  (service worker auto-updates; verify the build number in Settings).

## Key Files
- `index.html` — app shell, is-app detection, CDN scripts, cache-busters.
- `css/mobile.css` — ALL app/mobile styling (scoped `html.is-app`).
- `css/styles.css`, `css/premium.css`, `css/calc.css` — base/web styles.
- `js/storage.js` — `APP_VERSION`, `APP_BUILD`, `STATE`, DB, sync engine.
- `js/core.js` — `navigate()`, `_renderPage()`, mobile drawer, theme dock.
- `js/init.js` — bootstrap, theme toggle (`_makeThemeBtn`, `_dockThemeToggle`).
- `js/dashboard.js`, `js/finance.js`, etc. — per-page render functions.
- `sw.js` — service worker (`CACHE` name, precache list).
- `deploy.bat` / `deploy.ps1` — one-click version bump + push.
