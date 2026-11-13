# atworth (LifeOS) — Start Here

**Read this first in every new session.** It explains what the app is, where it
runs, how to change it safely, how to check a change, and what is still open.

*Last updated: build **748** · 13 Nov 2026.*

Other docs:
- `LIFEOS_APP_AND_DEPLOYMENT.md` — deploy details and the **build-by-build history table** (one row per build).
- `.claude/skills/lifeos-dev/` — the dev skill and the architecture reference.
- `PLAY_STORE_GUIDE.md` — the original Play Store setup. It is an older TWA guide; the app now uses Capacitor (section 1).

---

## 1. Where everything lives

| What | Where |
|---|---|
| **Code** | GitHub `Saravanan1604/lifeos`. `main` is live. Session branches are named like `ccr-…`. |
| **Website / app code host** | **Vercel**, `https://lifeos-psi-roan.vercel.app`. It auto-deploys every push to `main` in about 1 minute. There is no build step: Vercel serves the files as they are. |
| **Backend (sync + login)** | Node.js + MongoDB on **Render**, `https://lifeos-backend-mangodb.onrender.com/api` (`GET /me`, `POST /sync`). Free plan, so it sleeps when idle; see "Keep server awake" in section 8. |
| **Android app** | Capacitor wrapper `com.saravanan.lifeos`, named "atworth". It **loads the live Vercel URL** (`capacitor.config.json` → `server.url`). A web deploy updates the phone app; **no new APK** is needed unless the Android shell itself changes. |
| **Android project** | The `android/` and `www/` folders are **git-ignored**. They exist only on the owner's Windows PC. Build or upload the APK/AAB there, in Android Studio and Play Console. |
| **Google sign-in** | Google Cloud project, Google Auth Platform. The consent screen must be **Published**, or have the user added as a **test user**, otherwise sign-in fails with "Access blocked … Error 403". |
| **Automatic checks** | GitHub Actions in `.github/workflows/`: `smoke-test.yml` runs on every push; `keep-server-awake.yml` runs every 10 minutes. |
| **Owner's PC deploy** | Double-click `deploy.bat`. It runs `deploy.ps1`, which bumps the version, syncs `www/`, commits and pushes. |

### Three ways the same code runs

| Mode | How it is switched on | Looks like |
|---|---|---|
| **Phone app** | `html.is-app` is set by the inline `<head>` script in `index.html`. It checks Capacitor, the `LifeOSApp` user agent, display-mode standalone, the `android-app://` referrer, or `localStorage._isApp`. | The modern design |
| **Desktop modern** (default on desktop since build 704) | `html.is-app` + `html.is-desk` | The modern design in a centred column, with the menu on the left (`js/desk.js`) |
| **Classic web** | Settings → "Classic web layout" (`localStorage lifeos_web_layout = classic`) | The old desktop pages. **These must keep working.** Many "old" functions exist only for this mode. |

---

## 2. Golden rules

1. **Plain JS / HTML / CSS only.** No frameworks, no bundlers, no npm in the app. Libraries come from CDNs only: Chart.js, SheetJS, PDF.js, Lucide icons.
2. **App-only changes must not leak into classic web:**
   - **CSS:** every rule in `css/mobile.css` starts with `html.is-app`. Use `html.is-app body:not(#_cx):not(#_cy) …` to beat older rules.
   - **JS:** gate app-only code with `window.__IS_APP`. For whole pages, write a new renderer (see section 4).
3. **Bump the build number on every release** (section 6), or phones keep the old cached files.
4. **Check before pushing** (section 7): run the page test, and look at the page in Day and Night.
5. **The owner usually checks on an Android phone.** Write explanations in plain language, with screenshots, and don't make them look for things.

---

## 3. File map

### Core

| File | Job |
|---|---|
| `index.html` | App shell; the is-app / theme pre-paint script; CDN scripts; the `?v=NNN` cache-busters. **Script order matters**: later files override earlier ones. |
| `sw.js` | Service worker. `CACHE = 'lifeos-vNNN'` plus the precache list. Every new JS file must be added here **and** to `index.html`. |
| `vercel.json` | SPA rewrite + no-cache headers for `index.html` and `sw.js` |
| `js/storage.js` | `APP_VERSION`, `APP_BUILD`, `STATE`, the `DB` (localStorage `lifeos_v1`), the sync engine (`_syncFetch`, `pullFromCloud`, `_pushToCloud`, `LIVE_SYNC_KEYS`, `SYNC_LOG`), the server wake-up ping |
| `js/money.js` | **One place for money maths:** `Money.amt / isIncome / isSpend / isFixed / split / totals / monthTotals / byCategory / mismatches`. Use it, don't re-sum by hand. |
| `js/core.js` | `navigate(page)` → `_renderPage` switch (the route list), drawer, page swipe (Home ↔ Analytics ↔ Assets) |
| `js/init.js` | Bootstrap, theme |
| `js/finance.js` | **Large (≈500 KB) and old:** Records/Home list, add pad, budgets, assets/loans, accounts, imports, loan/asset detail (classic) |
| `css/mobile.css` | **All app styling** (≈880 KB). Appended in `/* build NNN */` blocks; later blocks win. |
| `css/styles.css`, `premium.css`, `calc.css` | Base, classic web and calculator styles |

### The modern app screens (newest code, which overrides older code)

| Page (route) | Built by | Notes |
|---|---|---|
| Home (`transactions`) | `finance.js` `renderRecordsMyMoney` + `home.js` (dashboard cards) + `motion.js` (Today card) + `budgets2.js` (`_homeBudgetHtml`, the budget card) + `quickadd.js` | Owner chose the **original** money card ("Deficit/Surplus this month"). **Don't redesign it again** unless asked. |
| Analytics (`insights`) | `analytics3.js` `renderAnalyticsApp` (helpers in `analytics2.js`) | 6-period chart, "What stands out", Everyday vs Fixed |
| Assets (`investments`) | `assets2.js` `renderInvestmentsApp` | Stock-style net-worth chart you can drag along |
| Loan / Asset detail (`loan-detail`, `asset-detail`) | `detail2.js` (wraps `finance.js` versions for classic) | Ring + milestones, what-if |
| Banks & Cards (`bank-tracker`) | `banks2.js` (app only) + `logs2.js` (history card) | Owner chose the **build 729** version (wave card + list). |
| Bills & Due (`upcoming` / `recurring` / `renewals`) | `bills2.js` (Upcoming), `pages2.js` (Recurring, Renewals), tabs from `cleanup.js` | Owner chose the **build 730** version (hero + 30-day strip). |
| Budget / Spending / Income (`budget`, `spending`) | `finance.js` `renderCombinedSpendBudget` + `budgets2.js` (battery grid on top) | |
| Settings (`settings`) | `settings2.js` | Rows use the `_stRow` helper |
| Sync status | `syncstatus.js` | Settings → Sync |
| Add from screenshot (Home → Scan) | `shotimport.js` | Gemini copy/paste flow like AI Fix categories → review → add |
| Check my data (`data-check`) | `datacheck.js` | Settings row + a Home card when something important is found |
| Tags, Purchases, Split, Report, Recurring, Renewals | `pages2.js` (`_pk` kit) | |
| Deep dive (`dashboard`) | `dashboard.js`, opened from Analytics via `openDeepDive(n)` | |
| Demo mode | `demo.js` | Settings → Demo mode. Separate storage (`lifeos_demo_v1`); sync is off while it's on. |
| Desktop layout | `desk.js` | |
| Backups, PIN | `secure.js`, `applock.js` | Password backups, Drive upload |
| Misc | `smart.js` (bills, payoff), `automation.js` (alerts, forecast), `assistant.js` (✨ chat), `recap.js`, `budgetsuggest.js`, `guide.js` (help), `voice.js`, `cleanup.js` (small app fixes + "stay on page after save") | |

---

## 4. How to change things (patterns)

- **A new app version of a page:**
  1. Create `js/xxx2.js` that declares the same function name (e.g. `function renderInvestmentsApp(){…}`), or wraps it with `const old = window.fn; window.fn = function(){ if (!window.__IS_APP) return old.apply(this, arguments); … }`.
  2. Load the file **after** the original in `index.html`, and add it to `sw.js`.
- **The shared kit (`pages2.js`):**
  - `_pk.head({title, sub, back, action})`, `_pk.hero`, `_pk.sec`, `_pk.row`, `_pk.empty`, `_pk.pill`, `_pk.done(container)`.
  - `_pk.done` sets `data-pk="1"`, which forces page zoom = 1, and refreshes the icons.
- **Colour tokens:** `--cx-bg / card / chip / line / ink / ink2 / mute / pri / pri2 / pri-tx / acc / inc / exp / warn` and their `-bg` versions. Never hard-code colours that must work in both Day and Night.
- **Shared animations:** `mvUp`, `mvPop`, `pkBar`, `ldvUp`, `ldvDraw`, `asFloat`.
- **Page zoom:** some pages have CSS zoom (Investments 0.6, Budget 0.6, Banks 0.7, Home 0.85). Use `_pk.done`, or compensate with `zoom: 1/z`, or new blocks render tiny.
- **CSS that "doesn't apply":** an older rule with `!important` or an `#id` is winning. Use the `body:not(#_cx):not(#_cy)` booster, and add `#page-container` if needed.
- **After a save, stay on the same page:** `cleanup.js` wraps `renderFinance` / `renderRecordsMyMoney`, and `detail2.js` wraps `renderInvestments`.
- **The owner's style preferences:** clean, modern, colourful, animated; plain-language labels ("₹X left", "updated 3 days ago"); fewer numbers per card. They dislike duplicated information and cluttered cards.

---

## 5. Data & sync (short)

- Everything lives in `STATE`, saved to localStorage `lifeos_v1`. When signed in, the app **pull-merges, then pushes** to Render.
- Merging uses per-item `_u` timestamps and `deletedIds` tombstones.
- Synced keys are listed in `LIVE_SYNC_KEYS`. **Add new data keys there**, or they won't sync.
- `_syncFetch` has a 75-second timeout. The log is in `SYNC_LOG` and shown on the Sync status screen.
- Fixed costs are decided by one rule, `Money.isFixed`: Rent / EMI / Loan / Insurance / Investment / SIP / Mutual fund, or anything repeating.

---

## 6. Deploy (every release)

1. Make the change.
2. **Bump the build** (example: 747 → 748):
   - `js/storage.js`: `const APP_BUILD = 748;`
   - `sw.js`: `lifeos-v747` → `lifeos-v748`
   - `index.html`: every `?v=747` → `?v=748`
   - `LIFEOS_APP_AND_DEPLOYMENT.md`: line 3 status, plus a new row in the build table
   - On the owner's PC, `deploy.bat` does the bump for you.
3. Commit with a message like `Build 748: what changed`, then push the session branch **and** `main`:
   ```bash
   git push -u origin <session-branch> && git push origin HEAD:main
   ```
4. Vercel goes live in about 1 minute. On the phone: **fully close the app and reopen it**, then check **Settings → build number**.

---

## 7. How to check a change

### Automatic (runs on GitHub after every push)
- `tools/smoke-test.js` opens **all 29 pages** in phone Day, phone Night, desktop and classic web, with demo data. It fails on any script error, blank page or sideways scroll.
- See the results on GitHub → **Actions** → "Check every page". A red ✗ means something broke.
- To run it yourself (needs Node + Playwright):
  ```bash
  python3 -m http.server 3333      # in the project folder
  node tools/smoke-test.js          # in a second terminal
  # if the CDN is blocked (cloud sessions): LOCAL_LIBS=<folder with chart.umd.js + lucide.min.js> node tools/smoke-test.js
  ```

### Manual checklist before telling the owner it's done
- [ ] The page works in **Day and Night** (Settings → Theme), on phone width (about 412 px).
- [ ] Nothing scrolls sideways; no text is cut off; buttons aren't stretched full width.
- [ ] **Classic web layout** still works if you touched shared code.
- [ ] Tapping and saving stays on the same page.
- [ ] Numbers match Analytics / Home (use `Money.*`).
- [ ] The build number is bumped in all 3 places, and the new JS file is in **both** `index.html` and `sw.js`.

### Tips for cloud sessions
- Chromium + Playwright are preinstalled. Block service workers (`serviceWorkers: 'block'`), and accept dialogs (Demo mode asks for confirmation).
- Turn on demo data with `enableDemoMode()` after setting `localStorage._isApp = '1'`.
- The CDN (jsdelivr/cdnjs) and Render are blocked by the proxy. Serve Lucide and Chart.js from local copies (`npm pack lucide@1.70.0 chart.js@4.4.0`) through `page.route`.
- For big clean-ups, compare **before/after full-page screenshots** of every page. That is how builds 746–747 were verified (0 unintended changes).

---

## 8. Background services

- **Keep server awake:** `.github/workflows/keep-server-awake.yml` pings Render about every 10 minutes. The app also pings it when it opens (`storage.js` `_wakeServer`). To stop it: GitHub → Actions → Disable.
- **Smoke test:** `.github/workflows/smoke-test.yml`

---

## 9. Open items / waiting on the owner

1. **Sync is not set up on the owner's phone:** it shows "Not signed in — data is only on this device".
   - Fix: Google Cloud → Google Auth Platform → Audience → **Publish app**, or add the owner's Gmail as a **Test user**.
   - Then in the app: Settings → Sync → Sign in → **Test sync now**, and check the Sync status screen.
2. **Android target API 36 (Android 16):** Play required it by 31 Aug 2026, and the date has passed. Update `android/variables.gradle` (`compileSdkVersion` / `targetSdkVersion = 36`) on the owner's PC, rebuild the AAB and upload it. Steps are in `LIFEOS_APP_AND_DEPLOYMENT.md` → "Updating the Android wrapper".
3. **Data problems in the owner's real data,** shown in **Settings → Check my data**:
   - Axis loan: amount ₹1.83Cr vs ₹17.8L left
   - a negative "In accounts" figure
   - a ₹4L spike in the bank balance history
   - "−86% vs Oct" caused by one big October entry
4. **Optional:** drop the Classic web layout to remove several hundred KB of old code. Ask the owner first.

---

## 10. Things the owner tried and rejected (don't repeat)

| Tried | Result |
|---|---|
| A slim Home summary line with "Just added" moved up (732) | **Reverted** to the original money card |
| A calm indigo Home card (740) and the "Left this month" gradient card (731) | **Reverted** to the original |
| A month calendar on Bills & Due (732) | **Reverted** to the 30-day strip version |
| Swipeable bank cards on Banks & Cards (735) | **Reverted** to the build 729 list |
| **Kept** | Analytics chart-first page, Assets stock-style chart, loan ring + milestones, budget batteries, simpler Home budget card, Check my data, Everyday vs Fixed |

When in doubt about a big visual change: show a screenshot first, keep the old version easy to restore, and change one page at a time.
