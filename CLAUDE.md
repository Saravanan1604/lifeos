# 🛑 AI Assistant System Instructions — LifeOS

> **New session? Read `HANDOFF.md` first.** It has where everything is deployed, the
> page → file map, how to deploy and check a change, open items, and what the owner
> has already rejected. Build history: `LIFEOS_APP_AND_DEPLOYMENT.md`.

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
- **Platform:** PWA + Android app = Capacitor wrapper (`com.saravanan.lifeos`) that
  loads the live Vercel URL, so a web deploy updates the phone app (no new APK).
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
- Since build 704 (owner's request) **desktop browsers also get the modern app
  design** by default: the head script adds `is-app` + `is-desk`, and
  `js/desk.js` fits the pages into a centred column with the menu on the left.
  Settings → "Classic web layout" (localStorage `lifeos_web_layout=classic`)
  restores the old desktop pages, which must keep working.

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

## Checks (since build 745)
- `tools/smoke-test.js` opens every page in phone Day/Night, desktop and classic web;
  GitHub runs it on every push (`.github/workflows/smoke-test.yml`). Keep it green.
- New JS files must be added to BOTH `index.html` and the `sw.js` precache list.
- Money maths goes through `js/money.js` (`Money.*`), not hand-written sums.



## Coding behaviour (Karpathy guidelines)

From https://github.com/multica-ai/andrej-karpathy-skills. The project rules above take priority where they differ.


**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
