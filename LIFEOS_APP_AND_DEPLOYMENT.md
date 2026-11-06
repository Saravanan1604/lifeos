# Life OS (atworth) — App Overview & Deployment Guide

*Status as of build **691** (6 Nov 2026).*

Life OS (brand name **atworth**) is a personal finance and "life operating system" app. It tracks:

- income, expenses and budgets
- bank, cash and credit-card accounts
- assets, loans and net worth
- goals, habits and notes

It ships in **three ways from one codebase**:

| Channel | How it runs |
|---|---|
| **Website** | `https://lifeos-psi-roan.vercel.app`, hosted on Vercel |
| **Installed PWA** | "Add to Home screen" from Chrome; uses the service worker for offline use |
| **Android app** | A Capacitor wrapper (`com.saravanan.lifeos`) that **loads the live Vercel URL**. A web deploy updates the app, so no new APK is needed for web changes. |

---

## 1. Tech stack

| Layer | Technology |
|---|---|
| Frontend | **Vanilla JavaScript (ES6+)**, plain HTML, hand-written CSS. No framework, no bundler, no npm at runtime. |
| Rendering | Each page is a `renderXxx()` function that builds HTML with template literals and sets `innerHTML`. |
| Libraries (CDN only) | Chart.js, SheetJS (Excel), PDF.js, Lucide icons, Google Identity |
| Browser APIs | Web Speech API (voice), Service Worker, `localStorage`, Clipboard |
| Backend | Node.js + MongoDB on **Render** (`lifeos-backend-mangodb.onrender.com/api`) |
| Hosting | **Vercel**, auto-deploys from the GitHub `main` branch |
| Android | **Capacitor** wrapper. Its user agent includes `LifeOSApp`, which switches the site into app mode. |

### App mode vs website

All mobile/app styling and behaviour is scoped so that the website layout is never affected:

- **CSS:** every app rule starts with `html.is-app` (in `css/mobile.css`).
- **JavaScript:** app-only code runs behind `window.__IS_APP`.
- An inline script in the `<head>` of `index.html` sets `is-app` before first paint. It checks display-mode standalone, Capacitor, the `LifeOSApp` user agent, the `android-app://` referrer, or `localStorage._isApp`.

---

## 2. Project structure

```
index.html            App shell, is-app detection, theme pre-paint script, CDN scripts, ?v= cache-busters
manifest.json         PWA manifest (shortcuts + share target added in build 671)
sw.js                 Service worker (network-first, CACHE = 'lifeos-vNNN', API never cached)
vercel.json           SPA rewrites + no-cache headers for index.html and sw.js
deploy.bat/.ps1       One-click version bump + commit + push (Windows)
capacitor.config.json Android wrapper → server.url = the Vercel site

css/
  styles.css          Base/web styles
  premium.css         Web polish (+ colour-only web theme, build 668)
  calc.css            Calculator
  mobile.css          ALL app styling, scoped html.is-app, appended as "build NNN" blocks (later wins)

js/
  storage.js          APP_BUILD, STATE, localStorage DB, cloud SYNC ENGINE
  core.js             navigate(), page router, auth/login, drawer, bottom-nav state
  init.js             Bootstrap, theme, auto-restore session
  finance.js          Records (home list), add/edit pad, budgets, assets/loans, accounts, imports
  bank-tracker.js     Finance page: bank/cash/card balances, balance log, trend
  features.js         Alerts engine (buildNotifications), command palette, misc
  categories.js       Categories, recurring rules, processRecurring()
  pages.js            Settings (themes), Money Rules, misc pages
  ai.js               Web AI Coach (desktop dashboard)
  smart.js            Build 671: budget alerts, bills, loan payoff, quick edits, smart search, launch actions
  home.js             Build 672: Life OS 2.0 home (budget ring, insights, health score, analytics)
  assistant.js        Build 673: money assistant chat (answers from your data, voice, "I spent…")
  analytics2.js       Builds 674–675: Analytics page, net-worth trend, A/L ratio
  automation.js       Builds 676–678: forecast, subscriptions, unusual spends, alerts center
  …                   (life.js, notes.js, goals/habits, voice.js, yearly.js, etc.)
```

---

## 3. Features (current)

### Home (app)
- **Header:** menu, time-of-day greeting and date, AI button, Search, and a bell with an unread count.
- **Balance hero:**
  - "Surplus/Deficit this month" with a hide/show eye button.
  - Income and expense side by side.
  - Spending change vs the same day last month, and an "In accounts" link to Finance.
- **Budget ring:**
  - Shows spent, left, budget and a per-day allowance.
  - Status: On track, Spending fast, Near limit or Over budget.
  - A tick on the ring marks where you should be today.
- **"Your money, explained" card:**
  - Budget pace, category spikes, top category, month-end forecast (labelled estimate), unusual spends, untracked subscriptions and bills due.
  - **Financial health score** out of 100, from savings rate, budget discipline, debt load and emergency fund. Tap it for the breakdown.
- **Spending analytics:** last 7 days, 6 months of income vs expense, and a category donut. Tap a bar or category for details.
- **Recent transactions:**
  - Tap a row to edit it; swipe to edit or delete; long-press to multi-select.
  - Tap the category circle to recategorise. This moves every same-name entry and remembers the choice.

### Analytics
- Week, Month, Quarter or Year, with ‹ › to go back in time.
- KPIs (income, spent, net, saved) with like-for-like change: a running period is compared with the same elapsed days of the previous one.
- Cash-flow line vs the previous period, income vs expense bars, budget vs actual, categories with their change, and the biggest movers.
- Habits: daily average, biggest day, no-spend days.
- **Forecast & automation** page:
  - 30/90-day balance forecast.
  - Subscription detector, with Track or Not one.
  - Unusual-spend list.
  - On/off switches for each alert type.

### Assets & liabilities
- Net-worth hero with a trend line (1M/3M/6M) and an assets-vs-liabilities bar. A negative net worth explains itself.
- "Debt-free by …" card with monthly EMIs and interest left. Each loan shows a payoff line, with a warning if its EMI never closes it.
- Loan detail page with an amortization chart and a what-if for extra payments.

### Alerts center
- Critical, Warning, Information and Success, with filters and counts.
- Each alert shows the amount, the threshold and an Open link.
- You can mark alerts read, dismiss them and view dismissed history.
- Read/dismiss state syncs and is keyed per condition, so an unchanged condition doesn't alert you again.
- Bills due within 3 days have **Paid now** and **Skip once** buttons.
- A ₹0 balance never counts as low; any bank can be marked **inactive** so it stops alerting.

### Money assistant (✨ button)
- Answers questions like "How much did I spend on food last month?", "Where is my money going?", "Can I save ₹10,000?", "How much can I spend today?" or "Predict my month-end balance", plus questions about loans, bills, balances and your health score.
- Everything is computed on the device, and estimates are labelled.
- "I spent 250 on petrol" fills in the add screen for you to confirm.
- Voice input uses the Web Speech API (en-IN).

### Categories
- Changing a category moves **all transactions with the same name**, ignoring capitals and spaces (e.g. "surya").
- The app saves that as a rule for future entries and imports.

### Records search
- Smart queries such as `food > 500 last month`, `income this week`, `swiggy under 300` or `shopping above 2k march`.

### Themes (Life OS 3.0)
- **Night** is OLED: `#090D18` background, `#151F33` cards, violet `#8B5CF6`, cyan `#22D3EE`.
- **Day** is designed separately:
  - `#F5F6FC` lavender background, white cards, `#6D3BEA` purple.
  - Floating white bottom bar, white header with a purple AI button, pastel alerts.
- Settings has **Day / Night / System**, plus AMOLED and Ocean.
  - The theme is applied before first paint, so the wrong theme never flashes.
  - System follows the phone live.
- Colours come from shared tokens (`--cx-*`) in `css/mobile.css`, so every page switches at once.

### Navigation (app)
- Bottom bar: **Home · Analytics · + · Assets · More**.
  - Docked in Night, floating in Day; it never covers content.
- Finance (bank accounts) is reached from the "In accounts" link on the home balance card or from the menu.

---

## 4. Data & cloud sync

- All data lives in one `STATE` object, saved to `localStorage['lifeos_v1']`.
- When you're logged in, it syncs with the Render backend:
  - `GET /api/me` pulls your data.
  - `POST /api/sync` pushes it. The server replaces the whole saved copy.

### How sync stays safe (rewritten in build 668)
1. **Pull-merge before every push.** The app fetches the cloud copy and merges it before sending, so one device can't wipe another device's newer entries.
2. **Per-item edit stamps (`_u`).** When both devices changed the same item, the newest edit wins.
3. **Tombstones (`deletedIds`).** Deletes spread to other devices. An item edited after it was deleted survives, which is how Undo works.
4. **Unsent changes survive closing the app.** A `lifeos_dirty` flag remembers them; failed pushes retry with backoff, and they're pushed when the app goes to the background.
5. **Every synced key is merged on login.** This includes notes, categories, cards, rules, `alertState` and `dismissedSubs`.
6. **Expired login (401/403)** shows a clear message instead of failing silently.
7. **The service worker never caches `/api/` responses**, so it can't show stale data.

The full list of synced keys is in `LIVE_SYNC_KEYS` (`js/storage.js`).

---

## 5. How it is deployed

### The pipeline

```
 edit source  ──►  bump build number  ──►  git push main  ──►  Vercel auto-deploy (~1 min)
                                                                      │
                     ┌────────────────────────────────────────────────┤
                     ▼                         ▼                      ▼
                 Website                  Installed PWA         Android app (Capacitor)
             (no-cache index.html)     (service worker updates)   loads the live URL
```

There is **no build step**. Vercel serves the repo files as they are; `vercel.json` adds SPA rewrites and no-cache headers for `index.html` and `sw.js`.

### Step by step (each release)

1. **Edit** `css/mobile.css` (app styling) and/or `js/*.js`. App-only CSS goes in a new `/* build NNN */` block at the end of `mobile.css`.
2. **Bump the build number** in three places, so every cache refreshes:
   ```
   js/storage.js : const APP_BUILD = NNN;
   sw.js         : const CACHE = 'lifeos-vNNN';   // and "Service Worker - vNNN.0"
   index.html    : every ?v=OLD  →  ?v=NNN        // CSS + JS cache-busters
   ```
   - **Windows:** double-click `deploy.bat`. It runs `deploy.ps1`, which bumps all three, syncs the local `www/` Capacitor bundle, commits "Deploy build N" and pushes to `main`.
   - **Manually (bash):**
     ```bash
     sed -i 's/APP_BUILD = OLD/APP_BUILD = NEW/' js/storage.js
     sed -i 's/lifeos-vOLD/lifeos-vNEW/; s/Service Worker - v[0-9.]*/Service Worker - vNEW.0/' sw.js
     sed -i 's/?v=OLD/?v=NEW/g' index.html
     git add -A && git commit -m "Deploy build NEW: <what changed>" && git push origin main
     ```
3. **Vercel** builds a production deployment from `main` in about a minute. Every other branch gets a preview URL.
4. **On the phone:** fully close LifeOS (swipe it away) and reopen it. If needed, do it twice. Check that **Settings shows the new build number**. If it still shows the old one, clear the app's *cache* (not its data) in Android Settings.

### How builds 668–679 were shipped

- Each change was made in a cloud coding session on the work branch `ccr-5489a3f0-nx5nsn`.
- It was tested in headless Chromium (Playwright) at phone size (412×880), in Day and Night, with realistic data:
  - **Screens:** screenshots, plus automatic checks for text overflowing or overlapping.
  - **Logic:** the core behaviour was tested directly: sync merge, same-name categories, assistant answers, forecasts and alerts.
  - **Errors:** the console was checked for page errors.
- Each build was then pushed to both the work branch and `main`. The Vercel production deployment was confirmed READY through the Vercel API.

| Build | Change |
|---|---|
| 668 | Colourful theme; **sync engine rewrite**; same-name category rule |
| 669 | Classic (calmer) bottom-bar colours; month-bar arrow fix |
| 670 | Page-by-page polish; Bank Options sheet visible; budget "% spent" fix |
| 671 | Budget alerts, bill reminders (bell bug fixed), loan payoff, smart search, quick edits, shortcuts |
| 672 | **Life OS 2.0 home**: header, balance hero, budget ring, insights, health score, analytics, docked nav |
| 673 | Money assistant (chat + voice + "I spent…") |
| 674 | Analytics 2.0 page |
| 675 | Assets & Liabilities 2.0 (net-worth trend, ratio, debt-free) |
| 676 | Forecast & automation (cash-flow forecast, subscriptions, unusual spends) |
| 677 | 3.0 corrections: surplus/deficit, alert thresholds, inactive accounts, trend cliff, like-for-like comparisons |
| 678 | **Day / Night / System themes** with 3.0 tokens; Alerts center |
| 679 | Bank balance clipping fix; headings readable in both themes |
| 680 | Reference pass: purple Day hero, quick actions, glowing variable-radius donut, bar value bubbles |
| 681 | Liabilities dashboard: debt summary, countdown, extra-payment what-if, loan progress bars |
| 682 | Confirmed deletes for bank/card/wallet; bank cards show "last updated" and inactive tag |
| 683 | AI Financial Data Coach modules (income / expense / cash-flow + explained recommendations); forecasts use everyday pace (no one-off EMI extrapolation) |
| 684 | Popups/pickers/Upcoming/Analytics tabs on the 3.0 theme; 7-day bars anchored; EMI no longer double-counted on Upcoming; grouped account picker with balances |
| 685 | Category detail page redesigned: hero total with change vs last period, status-coloured budget card, compact chart, icon-chip transaction rows |
| 686 | Add/edit transaction screen redesigned: big centred amount, red/green type toggle, settings-style rows, notes with calculator/mic, import chips, sticky Save |
| 687 | Assets page overview rebuilt around "You own vs You owe": plain-language net worth, tappable own/owe tiles, ₹-per-₹100 ratio, EMI as % of income, debt-free date, trend with an explanation |
| 688 | In-app Guide ("How to use"): quick-start checklist, how-to topics with Show me, gestures, FAQ, search; 1-minute spotlight tour; variable-radius ring on Spending/Income |
| 689 | Budget tab gets the same ring (% used, amount left/over in the centre); over-budget rows show the real % and amount over (e.g. Gifts 200% · ₹1,000 over, was "100%") |
| 690 | Motion + daily use: cards glide in, rings sweep and bars grow (off with "reduce motion", not replayed on sync); **Today** card on Home (spent today vs daily allowance, ring, 🔥 logging streak); **Recent** chips on the add screen to repeat an entry in one tap; success check + haptic after saving (new `js/motion.js`) |
| 691 | Tap any ring segment (Home categories, Spending, Income, Budget) to see its name and amount in the centre (budget ring also shows spent and %); other segments dim and the tapped one glows. Tap again or anywhere else to go back to the total |

### Testing locally

```bash
cd lifeos && python3 -m http.server 3333      # then open http://localhost:3333
```

To see the **app** layout in a desktop browser, run `localStorage.setItem('_isApp','1')` in the console and reload. Remove that key to return to the website layout.

---

## How to use atworth (quick guide)

The app has the same guide built in: **Menu → How to use · Help**, or **Settings → How to use atworth**. A 1-minute tour that points out each button on Home runs once after this update, and you can replay it from either place.

1. **Start**
   - Add a bank account or cash wallet: Home → *In accounts*, or Menu → Finance.
   - Log your salary as **Income**.
2. **Add entries**
   - Tap the purple **+**, choose Expense or Income, then type the amount.
   - Pick a category and an account, and add a note.
   - Use **Repeat** for monthly bills.
3. **Edit an entry**
   - Tap it to edit, or swipe it to edit or delete. Long-press to select several at once.
   - Tap the coloured circle to change its category. All entries with the **same name** move too, and new ones are remembered.
4. **Search** with plain words, for example `food > 500 last month` or `swiggy under 300`.
5. **Budgets**
   - Set them in Analytics → Budget & categories.
   - You're warned once at 80% and once at 100%.
   - The budget ring on Home shows how much you can spend per day.
6. **Bills**
   - Bills appear in **Upcoming** and in the 🔔 bell 3 days before they're due. Use *Paid now* or *Skip*.
   - *Forecast & automation* finds subscriptions you haven't set up yet.
7. **Analytics**
   - Switch between Week, Month, Quarter and Year.
   - See cash flow, budget vs actual, and a 30/90-day balance forecast.
8. **Assets**
   - Net worth = what you **own** − what you **owe**.
   - On *You owe*, try "What if I pay extra?" to see your new debt-free date.
9. **Ask ✨**
   - Questions like "Where is my money going?" or "Can I save ₹10,000?".
   - You can also add a transaction by saying "I spent 250 on petrol".
10. **Theme and sync**
    - Settings → Theme: Day, Night or System.
    - Pull down on Home to sync.

---

## 6. Known limits & next steps

### Need a new Android (APK) build
These require native Android code and a rebuilt APK:
- The phone status-bar colour.
- Automatic SMS reading (Google Play allows it only for default SMS apps). Today: paste from clipboard, share to app.
- A real home-screen widget. Today: PWA long-press shortcuts.
- Phone notifications from inside the Capacitor app. They already work in the browser/PWA.

### Not yet done from the 3.0 brief
- Real bank logos (the cards show the bank name and a masked number).
- Moving every calculation into one central engine. The calculations that were wrong have been fixed individually.
- Dedicated desktop and tablet layouts.

### Backend
- Render's free tier sleeps when idle. The first sync after a pause can take about 30 seconds; the app retries automatically.
