# LifeOS architecture & patterns reference

## Tech stack (hard constraints)

- **Vanilla JS (ES6+)**, pure HTML, hand-written CSS. No React/Vue/Svelte, no SASS/Tailwind, no Webpack/Vite, no npm at runtime.
- Libraries are **CDN only**, loaded in `index.html`: Chart.js (+ chartjs-chart-sankey), SheetJS (XLSX), PDF.js, Lucide icons, Google Identity.
- **Platform**: PWA + Capacitor Android wrapper. Backend: Node + MongoDB on Render. Frontend: Vercel (`lifeos-psi-roan.vercel.app`).
- The Capacitor app (`capacitor.config.json`) sets `server.url` to the Vercel site, so the installed app **loads the live website** — a web deploy updates the app; no APK rebuild needed for web changes.

## File map

| File | What's in it |
|------|--------------|
| `index.html` | App shell, `__IS_APP` head-detection script, CDN `<script>`s, `?v=` cache-busters, bottom-nav, FAB, sidebar/drawer markup, service-worker registration. |
| `css/mobile.css` | **ALL app/mobile styling, scoped `html.is-app`.** ~10k lines, organized as appended `build NNN` comment blocks. Later rules win. |
| `css/styles.css`, `premium.css`, `calc.css` | Base/web/desktop styles. Don't put app-only rules here. |
| `js/storage.js` | `APP_VERSION`, **`APP_BUILD`** (the build number), `STATE`, DB load/save, cloud sync, helpers like `_ymdLocal`, `filterTxByAnchor`, `filterTxByPeriod`, `genId`. |
| `js/core.js` | `navigate()`, `_renderPage()` (sets `#page-container[data-page]`), drawer open/close (`openMobileDrawer`/`_closeMobileDrawer`), bottom-nav indicator, quick-actions (`_appendQuickActions`), hardware back-button handling. |
| `js/init.js` | Bootstrap (`DOMContentLoaded`), theme, haptics, `Chart.defaults.animation=false` in app. |
| `js/finance.js` | Records (`renderRecordsMyMoney`), Finance helpers, account cards (`acctSection`), Budget (`renderBudget`), Investments/Assets (`renderInvestments` + `renderInvestmentsApp`), all the modals (add tx/bank/card/cash/budget/asset/loan), category helpers. |
| `js/bank-tracker.js` | The Finance page (`renderBankTracker`) — Banks/Cards/Cash tabs, total balance, 30-day trend chart, balance-log cards (`_logEntryCardApp`). |
| `js/notes.js` | Notes page (Keep-style masonry). |
| `js/pages.js` | Money Rules (`renderMoneyRules`), Compare, misc pages. |
| `js/categories.js` | `getAllCategories()`, custom categories, `renderCategories`, `openManageTypesModal`. |
| `js/dashboard.js`, `growth.js`, `life.js`, `yearly.js`, `widgets.js`, `voice.js`, `ai.js`, `applock.js`, `calculator.js`, `compare.js`, `help.js`, `onboarding.js`, `premium.js`, `features.js`, `layout.js` | Other per-area render + logic. |
| `sw.js` | Service worker; `CACHE` name must bump each build. |
| `deploy.bat` / `deploy.ps1` | One-click bump + `www/` sync + commit + push. |
| `www/` | Capacitor bundle, **gitignored**, mirrored from root by the deploy script. |

## `__IS_APP` detection (index.html head script)

Set to true (before first paint) if any of: display-mode standalone/fullscreen/minimal-ui · `navigator.standalone` · referrer `android-app://` · `window.Capacitor` · userAgent contains `LifeOSApp` (set via `capacitor.config.json` `appendUserAgent`) · `localStorage._isApp === '1'` (persisted once detected). When true it adds `class="is-app"` to `<html>`, exposes `window.__IS_APP`, and skips loading AdSense (ads are not allowed inside the app).

To simulate the app in the browser preview: `localStorage.setItem('_isApp','1')` then reload.

## Page keys (data-page)

`navigate(key)` → `_renderPage(key)` sets `#page-container[data-page="<key>"]`. Common keys: `dashboard`, `transactions` (Records), `finance`/`bank-tracker` (Finance), `budget`, `investments` (All Assets), `notes`, `rules` (Money Rules), `compare`, `categories`, `recurring`, `yearly`, `health`, `habits`, `goals`, `journal`, `achievements`, `analytics`, `settings`, `help`. Bottom nav = Records / Finance / + (FAB) / Assets / More(drawer).

## 2x type-scale recipe {#2x-type-scale}

When asked to enlarge a page's text, append a page-scoped remap (overrides the global inline-size table because it's later + more specific):

```css
html.is-app #page-container[data-page="PAGE"] [style*="font-size:10px"] { font-size: 19px !important; }
html.is-app #page-container[data-page="PAGE"] [style*="font-size:11px"] { font-size: 20px !important; }
html.is-app #page-container[data-page="PAGE"] [style*="font-size:12px"] { font-size: 22px !important; }
html.is-app #page-container[data-page="PAGE"] [style*="font-size:13px"] { font-size: 24px !important; }
html.is-app #page-container[data-page="PAGE"] [style*="font-size:14px"] { font-size: 26px !important; }
html.is-app #page-container[data-page="PAGE"] [style*="font-size:16px"] { font-size: 28px !important; }
html.is-app #page-container[data-page="PAGE"] .section-title { font-size: 28px !important; }
```
For elements styled with `rem` (e.g. account-card balance `2.6rem`), target the inline value directly: `html.is-app .fin-dark-card div[style*="2.6rem"] { font-size: 46px !important; }`. Custom-class pages (e.g. the `.ia-*` Assets layout, `.blog-*` log cards, `.note-*` notes) get explicit per-class sizes instead.

## Navigating mobile.css

The top of `mobile.css` has an auto-generated **BUILD BLOCK INDEX** — a comment listing every `build NNN` block with its line number. Jump there first to find the right place. After appending a new block, regenerate the index (it's comment-only, so stale numbers are harmless but the index is the fast path). Rules are append-only and later-wins; don't hunt for the "right" spot — append at the end.

## Global is-app font bump (top of mobile.css)

There's a global table that scales inline `font-size:Npx` values up (~1.5x) because the device renders the page scaled down. Page-scoped remaps and explicit class rules override it. Money/number values use `word-break: keep-all` to avoid mid-digit wraps.

## Established app-only redesigns (precedent to follow)

- **Drawer**: pill rows with icon chips, white active pill, floating green-gradient capsule (`html.is-app .sidebar ...`).
- **Records**: month-bar `[ring] ‹ Month ▾ › Today`; the label opens a period+calendar sheet (`openRecPeriodSheet`); ring icon → Budget page.
- **Budget**: ring overview with stacked chips; legend rows tap to edit (with Delete); "No Budget Set" list + "+ Budget"; month-comparison bar chart; budget modal uses `getAllCategories()` + "Create new category".
- **All Assets**: `renderInvestmentsApp()` — centered net-worth hero, quick-stats strip, Assets/Liabilities toggle, allocation donut+legend, recent list with line-icon thumbnails; net-worth snapshots in `STATE.netWorthHistory` (one per day) power a trend graph.
- **Finance**: per-card `+` quick menu, `+` add-account card at carousel end, Download/Upload via per-card menu, full-width `.blog-card` balance-log design.
- **Notes**: Keep-style masonry (`column-count`), Pinned/Others sections, pin/delete in the editor.

## Manual deploy = deploy.ps1

`deploy.ps1` (run via `deploy.bat`) does exactly: read `APP_BUILD`, bump it everywhere (storage.js, sw.js, index.html `?v=`), sync `www/`, `git add -A`, commit `Deploy build N`, push `origin main`. Doing the steps by hand (as in SKILL.md) is equivalent and lets you write a descriptive commit message.

## .gitignore note

`node_modules/`, `android/`, `www/`, and `*.keystore`/`*.jks` are ignored — the repo is publicly served by Vercel, so native build dirs and signing keys must never be committed.
