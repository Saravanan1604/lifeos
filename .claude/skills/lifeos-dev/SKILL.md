---
name: lifeos-dev
description: >-
  The complete development workflow and conventions for the LifeOS / atworth
  app (a vanilla-JS PWA wrapped as a Capacitor/TWA Android app). Use this skill
  for ANY change to this project — UI tweaks, new features, redesigns, bug
  fixes, styling, or deploys — especially when the user asks to change something
  "in the app", "in the mobile app", on a specific page (Finance, Records,
  Budget, Assets, Notes, Money Rules, the drawer, etc.), to "make it bigger /
  2x", "redesign like this", "match this reference", or to "deploy / push / bump
  the build". Always follow this skill's app-only scoping rules and deploy steps
  so web/desktop is never broken and the installed app actually picks up the
  change.
---

# LifeOS / atworth development

LifeOS (brand name **atworth**) is a **strict vanilla-JavaScript** personal-finance + life-OS app. No framework, no bundler, no npm at runtime. UI is built with template literals injected via `innerHTML`; styling is hand-written CSS. It ships three ways from one codebase: a **website** (Vercel), an installed **PWA**, and an **Android app** (Capacitor wrapper that loads the live Vercel URL).

The single most important rule: **mobile/app changes must never affect the web/desktop layout.** Everything app-specific is gated two ways — JavaScript behind `window.__IS_APP`, CSS under `html.is-app`.

## Before you start: read the project map

Read [references/architecture.md](references/architecture.md) for the file-by-file map, the `__IS_APP` detection chain, and the established UI patterns (per-page render functions, `data-page` scoping, the 2x type-scale recipe, modals/sheets, charts). Read it whenever you're touching an unfamiliar page — it will save you from re-deriving how the app is wired.

## The golden rule: app-only scoping

When the user asks for a change "in the app" (which is almost always — they use the Android app), scope it so the website is untouched:

- **JavaScript**: branch with `if (window.__IS_APP) { ...app version... } else { ...web version... }`. For a whole-page rewrite, write a separate `renderXxxApp()` function and delegate at the top of the page's render function: `if (window.__IS_APP) { try { return renderXxxApp(); } catch(e){ console.log(e); } }`.
- **CSS**: every rule starts with `html.is-app`. Page-scoped rules use `html.is-app #page-container[data-page="finance"] ...`. Never add an unscoped rule to `css/mobile.css` — it will leak into the website.

If you're unsure whether a change is app-only, assume it is. The user has consistently wanted the web layout frozen.

## The deploy workflow (do this for every change)

LifeOS has **no build step**. You edit source files in the repo root, bump version numbers so caches refresh, sync the Capacitor bundle, then commit + push — Vercel auto-deploys in ~1 minute, and the installed app (which loads the live URL) picks it up on next launch.

Run these steps in order. The script in [scripts/deploy.md](references/architecture.md) documents the manual equivalent of `deploy.ps1`.

1. **Edit the source** in the repo root (`css/mobile.css`, `js/*.js`, `index.html`). Append new CSS as a dated `build NNN` comment block at the end of `mobile.css` rather than hunting for the right spot — later rules win, and it keeps history readable.

2. **Bump the build number** in three places (use the next integer):
   ```
   js/storage.js : const APP_BUILD = NNN;
   sw.js         : const CACHE = 'lifeos-vNNN';  and  Service Worker - vNNN.0
   index.html    : every ?v=NN  →  ?v=NNN  (CSS + JS cache-busters)
   ```
   One-liners (bash):
   ```bash
   sed -i 's/APP_BUILD = OLD/APP_BUILD = NEW/' js/storage.js
   sed -i 's/lifeos-vOLD/lifeos-vNEW/; s/Service Worker - v[0-9.]*/Service Worker - vNEW.0/' sw.js
   sed -i 's/?v=OLD/?v=NEW/g' index.html
   ```

3. **Sync the `www/` Capacitor bundle** from the root source (PowerShell, because robocopy mirrors cleanly on Windows):
   ```powershell
   $root='C:\Users\sarav\Documents\antigravity\New folder\LifeOS'
   robocopy "$root\css" "$root\www\css" /MIR /NJH /NJS /NDL /NC /NS | Out-Null
   robocopy "$root\js"  "$root\www\js"  /MIR /NJH /NJS /NDL /NC /NS | Out-Null
   foreach ($f in 'index.html','manifest.json','sw.js') { Copy-Item "$root\$f" "$root\www" -Force }
   ```
   `www/` is gitignored (it only matters for a native rebuild), so this is a local convenience, not a committed artifact. robocopy exit code 1 means "files copied" — that is success, not an error.

4. **Commit + push** with a `Deploy build NNN: <what changed>` subject and a short body explaining the why. End the message with the Co-Authored-By trailer. Push to `main`.

5. **Tell the user**: confirm the build number, and that they should fully close and reopen the app, then check Settings shows build NNN.

## Verify in the browser preview BEFORE you deploy

Do not ship a change you haven't seen work. The preview catches broken renders and console errors before they reach the user's phone. Use the `preview_*` tools (the dev server is `lifeos` on port 3333 in `.claude/launch.json`).

The recipe that works for this app (it normally boots to the auth screen and is web-mode):

1. `preview_start` the `lifeos` server.
2. Seed app mode + a fake session + any data you need, then reload:
   ```js
   localStorage.setItem('_isApp','1');
   var st = JSON.parse(localStorage.getItem('lifeos_v1')||'{}');
   st.user = {name:'Preview', email:'p@t.local', id:'p'};
   // ...seed st.bankAccounts / st.transactions / st.budgets / st.notes etc. as needed...
   localStorage.setItem('lifeos_v1', JSON.stringify(st));
   location.reload();
   ```
3. `navigate('<page>')`, then `preview_eval` to read computed styles / DOM (`getComputedStyle`, `querySelector`) and confirm your change applied. Verifying via the CSSOM/computed values is more reliable than screenshots here.
4. `preview_console_logs` filtered to `error` — must be clean.
5. If CSS seems stale, the service worker cached it: `location.reload(true)` and/or bump the `?v=` first.

**Note:** `preview_screenshot` frequently times out on this app because the animated `#particles-canvas` keeps the renderer busy. Don't block on it — verify structurally with `preview_eval`/`preview_inspect` instead.

To test the **web** path, `localStorage.removeItem('_isApp')` and reload — confirm app-only DOM/classes are absent and the original web layout renders.

## Conventions learned on this project

- **2x / "make it bigger" requests** are common. The clean way is a page-scoped size remap appended to `mobile.css` — see the recipe in [references/architecture.md](references/architecture.md#2x-type-scale). Literal "5×" often can't fit a multi-column grid; when it can't, say so plainly and go as large as the layout allows (e.g. switch that page to a single column), rather than silently under-delivering.
- **"Redesign like this" + a screenshot**: if the screenshot is the app's own current page, the user usually wants one specific differing detail changed — ask/confirm what differs rather than rebuilding. If it's an external reference (Google Keep, a Dribbble shot), build a dedicated `renderXxxApp()` matching it, app-only.
- **Account/asset/category data** lives in `STATE` (persisted to `localStorage['lifeos_v1']` + synced). Categories: use `getAllCategories()` (defaults + custom), never the stale hardcoded `CATEGORIES` array in `finance.js`. Asset/loan types: `getAssetTypes()` / `getLoanTypes()`.
- **Icons**: prefer Lucide line icons (`<i data-lucide="name"></i>`) over emoji when the user asks for "line icons" or a cleaner look; call `lucide.createIcons()` after injecting them in a modal/late render.
- **Charts**: Chart.js. In the app, `Chart.defaults.animation = false` (set in `init.js`) so navigation feels instant. Destroy a chart instance before recreating on the same canvas.
- **One build = one focused change.** Bump the number every deploy; never reuse a build number.

## When NOT to over-engineer

This is a solo personal project shipped many times a day. Favor small, verifiable, app-scoped diffs over big rewrites. Don't add a framework, a build step, or npm runtime deps — the project is deliberately dependency-free (CDN libraries only: Chart.js, SheetJS, PDF.js, Lucide).
