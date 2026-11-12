# Life OS (atworth) — App Overview & Deployment Guide

*Status as of build **728** (13 Nov 2026).*

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
| 692 | Voice screen redesigned (app): glowing purple/cyan orb with pulsing halos and a live wave while listening, big live transcript, bottom sheet "Try saying" with tabs (Expenses / Income / Banks & Accounts / Navigate / Quick actions); navigation chips run in one tap, money examples are examples only |
| 693 | Settings redesigned (app, new `js/settings2.js`): purple profile card with inline edit + stats strip; Appearance (compact theme swatches, number style, background); grouped icon rows for General, Security, Backup & data, Help, About; Danger zone. Demo-data row only shows when there are fewer than 20 entries so real data is never mixed with samples |
| 694 | Tags, Recurring, Purchases, Renewals and Split redesigned (app, new `js/pages2.js`): shared header with action pill, gradient summary card with 3 stats, grouped icon-row lists, guided empty states. Tags uses the tappable ring; Recurring shows true per-month totals (weekly/yearly converted), next due, one-tap “post due”, and iOS-style toggles; Split separates Open vs Settled |
| 695 | Report redesigned (app): Day/Week/Month/Year segmented tabs, saved/overspent summary card, tappable animated income-vs-expense bars, readable breakdown list with signed net and running balance (replaces the wide table; PDF export kept). Dashboard tabs: chip tab bar + token cards; Financial Health becomes a score ring + 7 sorted score bars with tips; 7 Income Streams becomes “earning now” vs “next streams to build” with hints |
| 696 | **App size** (Settings → Appearance): Compact / Default / Large / Extra large. Changes the app's fixed layout width (450 / 412 / 372 / 340 px) so everything — text, icons, buttons, nav — scales together. Saved per phone (localStorage `lifeos_app_size`), applied before first paint in the `index.html` head script |
| 697 | Fix: phones in Chrome **“Desktop site”** mode (desktop user-agent, on by default on some large phones) got the tiny desktop layout. Detection now also uses hardware — touch-only pointer, no hover, screen short side ≤ 600px — and if Chrome ignores the viewport tag (lays out ~980px), the root is zoomed so the app renders at phone width. Real desktops and touch laptops are unaffected |
| 698 | **Feature clean-up** (app; new `js/cleanup.js`, nothing deleted — hidden features keep their data): side menu 22 → 12 items (Money: Banks & Cards, Bills & Due, Reports, Tags, Purchases, Split, Savings Goals, Categories · More: Notes, Settings, Help). Dashboard is now **Deep dive**, opened from Analytics tiles (Heatmap, Money flow, Wealth flow, Health, 7 income); other links to it go Home. Upcoming / Recurring / Renewals merged as **Bills & Due** tabs. Finance → Banks & Cards, Yearly Report → Reports, Goals → Savings Goals. Health Hub, Habits, Journal, Achievements hidden. No XP / level-up pop-ups or level badge; Settings shows day streak. Moving-background setting removed. Voice examples trimmed. Web + menu: Check-in Habit / New Goal / Write Journal replaced by Transfer |
| 699 | Banks & Cards fixes: bank-card balance was squashed into a small grey text on a white pill by a build-688 rule (`div[onclick*="openQuickBalanceModal"]`) — now excluded, balance is big and white again; smaller "Updated …" line. Bank / Cash / Card **options sheet** redesigned (account header card, one main “Update balance” button, grouped icon rows, delete separated). Trend cards restyled with pill 30 Days / 1 Year toggle |
| 700 | **Categories redesigned** (app): Expense/Income tabs, rows sorted by this month's spend with entry counts, “Your categories” vs “Built-in”, edit pencil on custom ones (Delete moved into the Edit popup), AI banner when entries sit in “Other”, Merge / Asset types / Loan types tiles. Popups restyled: **AI Fix** is now a 2-step guide (Copy → Open Gemini → Paste → Apply, prompt tucked under “See what will be sent”), **Asset/Loan types** a tidy 2-column grid, **Add category** compact 8-column emoji grid |
| 701 | **Demo mode** (Settings → Help → Demo mode, web Settings card, or old “Load demo data” buttons): sample data (3 months of daily entries + salary/rent/EMI/SIP, recurring, tags, purchases, splits, banks, cards, assets, loans) in a separate local copy `lifeos_demo_v1`; while on, `DB.KEY` points to it and all sync is off (`_canSync`, `pullFromCloud`, `_mergeCloudIntoState`, `tryAutoRestore` guarded) so real data in `lifeos_v1` and the cloud is never read, changed or merged. Orange banner with **Turn off**; turning off deletes the demo copy and reloads real data. Reset All Data in demo mode only exits demo |
| 702 | **Night readability pass** — WCAG contrast audit on 20 pages (demo data): Night caption grey `#64748B→#8B99B0`, secondary text `→#A9B5C7`, purple fill `#8B5CF6→#7C4DFF` (white text readable), new text-only purple token `--cx-pri-tx #B197FC` (65 rules switched to it), red `→#FF6B78`, legacy `--text2/--text3` and faded-white inline text remapped, blue tags brightened. Result: 0 low-contrast texts on all 20 pages in Night (was 47). Day caption grey `#94A3B8→#717E93`. “Achievement Unlocked” pop-ups hidden in the app |
| 703 | **Update balance popup** redesigned (app): bank chips with colour strip and current balance, big centred amount, live “₹old → ₹new · +₹diff more/less”, Today / Yesterday / 2 days ago / Pick date as one row (local dates — the old version used UTC and could pick the wrong day early morning), compact note, full-width Save. Same save logic and fields |
| 704 | **Desktop web uses the new design** (owner request): head script marks desktop browsers `is-app is-desk` (no viewport lock, AdSense still loads); new `js/desk.js` fits every page into a centred 640px column (dividing by each page's CSS zoom) with the new menu permanently on the left; bottom bar, + button, demo banner, sheets, add screen, voice and calculator fit the column. Settings → **Classic web layout** switches a computer back to the old pages (and the classic Settings has “Switch to the new design”). App size hidden on desktop. Demo-mode celebration popup removed |
| 705 | **Calmer Home**: removed the AI “Your money, explained” card (insights, health score, Ask button) from Home — AI stays in the ✨ top button and Analytics. Hero shows whole rupees (no .64). “Spending vs last month” and “In accounts” chips sit on one quiet line. Today card no longer shows “/ ₹0” when the month budget is used up — it says so instead; budget card “Per day” shows “Used up”. 7-day bars clearly visible in both themes |
| 706 | **Real desktop layout** (is-desk): full-height sidebar with **New transaction**, Home / Analytics / Assets and the money menu; no bottom bar; content up to 1240px wide; Home becomes a two-column dashboard (balance, quick actions, transactions | today, budget, spending chart — sticky); pop-ups are centred dialogs and the add screen / voice / calculator a centred panel. **New toasts** everywhere: slim card with coloured icon, timer line, max 2 on screen, tap to dismiss, emojis stripped; bottom-right on desktop |
| 707 | **New transaction list** (app + desktop): one rounded card, day headers “Today / Yesterday / Wed, 4 Nov” with the day's net, rows show the note as title and “category · account · time” below (no clock emoji, no quotes, no account pill), tinted rounded-square category icons, +₹ green income / −₹ expense. Desktop: selected sidebar item readable in Day mode |
| 708 | **Select mode**: floating bar above the bottom nav (✕ · “N selected” · Select all · Category · Delete as soft tinted buttons, lifted to `<body>` because the page container is transformed), rounded-square checkboxes, soft purple selected rows. **Filter popup** redesigned: search box first + quick chips, Type and Sort as segmented controls, categories as colour-dot chips, compact From/To, “Jump to a day” link, Clear all / Show results. Records hero rounds to whole rupees in every view |
| 709 | **One modern style for all 71 popups** (app + desktop): shared rules in `#modal-body` for labels, 48px inputs/selects (custom chevron), textareas, focus ring, 2-column rows, info boxes, dashed file pickers and a full-width action row (secondary + wider gradient primary, soft red delete). Transaction detail card rebuilt (icon buttons, 36px amount, clean rows); Carry Forward card readable; delete confirmations use a clear question style |
| 710 | Full-app sweep (no screenshot needed): **Savings Goals** rebuilt (saved-so-far summary, goal cards with progress ring, days-left / auto-sync pills, tidy “Add money saved” row; 2 columns on desktop). **Notes** rebuilt (header, guided empty state, 2-column card grid). Budget/Spending “Total budget progress” box restyled. Audit covered 20 pages + 18 popups in Night and Day |
| 711 | **One money engine** (`js/money.js`): `Money.amt / isIncome / isSpend / totals / monthTotals / byCategory`; 30 hand-rolled sums across 9 files now go through it (text amounts can no longer concatenate, entries without a type count as spending everywhere, budget spend ignores income). Verified Home = Report = Analytics for the same month. **Data check**: `Money.mismatches()` finds entries whose type disagrees with their category (e.g. Interest saved as expense) → Home card + Settings → “Check my entries” to fix or keep per category. Same-name category rules and the notes rule can no longer put an income category on a spend (or the reverse) |
| 712 | **Day readability pass** — WCAG audit on 20 pages in Day: secondary `#4F5D72`, captions `#5E6A7E`, green `#047857`, red `#C12F3C`, amber `#A1490A`, cyan `#0E7490` (all ≥4.5:1 on white and chips); old dark-theme inline colours remapped in Day; selected Budget/Spending/Income tab was white-on-white (now purple); “+ Budget” readable; purple balance cards use light tints. Result: 0 low-contrast texts on all 20 pages in Day and in Night |
| 713 | **Faster start**: PDF.js (~300 KB) and SheetJS (~900 KB) no longer load on every launch — `window.loadLib('pdf'|'xlsx')` in the `index.html` head loads them on demand (prefetched when an import screen opens; imports wait for them). Lucide icons pinned to 1.70.0 (was `@latest`, which could change without warning). Measured: no import libraries at start; Excel/PDF import still work |
| 714 | **Protect your data** (new `js/secure.js` + `applock.js`): backups (Export and Back up to Drive) can be **password-protected** — AES-256-GCM with a PBKDF2-SHA256 (250k) key; restore detects protected files and asks for the password; plain JSON still works. App-lock PIN now stored as salted SHA-256 (old weak hash upgraded on first unlock) with a 30 s wait after 5 wrong PINs (doubling). Amounts are blurred while the app is in the background so the recent-apps preview doesn't show them. Not done: encrypting the live data inside the app (would risk data loss and the cloud copy is the main store) |
| 715 | **Savings goals fill themselves**: new sources “money put into a category” (e.g. SIP, Savings, RD) and tags, counted from the goal's start; “Net savings” now counts only since the goal started (was all-time, so goals looked done too early); bank names in the source list fixed (showed “undefined”); goal sync only saves when a value actually changes; goal cards show “Fills from SIP” or a “Link to SIP / account” button. Night: popup body text no longer forced to dark slate |
| 716 | **Monthly recap** (new `js/recap.js`): on days 1–7 Home shows last month — saved/overspent, spent with change vs the month before, income and saving rate, top category, no-spend days, biggest spend — with **Share** (1080×1350 image via share sheet or download) and Full report; ✕ hides it until next month. Reports → Month view has “Share <month> recap image” |
| 717 | **Smart quick add** (new `js/quickadd.js`): one line on Home under the quick actions — “swiggy 250”, “petrol 500 icici yesterday”, “salary 52,000”, “+2k refund”, “1.2k groceries”. Reads amount (k/lakh/commas), income words or “+”, yesterday, account name; category/type/account learned from the last entry with the same name, then category rules, then category names, then your most-used. Live preview chips; Enter saves through the normal add screen (`padSave`) so balances, budgets and alerts update; the sliders button opens the full add screen pre-filled |
| 718 | **Suggested budgets** (new `js/budgetsuggest.js`): from the last 3 complete months, for spend categories used in ≥2 months, avg ≥ ₹300, without a budget and not fixed bills (EMI, rent, insurance, SIP…) — limit = average +5% rounded to a tidy number. Banner on Budget and Analytics → popup with tick boxes and editable amounts → adds monthly budgets |
| 719 | **Backup reminder + Drive upload**: Home card when a backup is due (default every 7 days; Settings → Backup reminder: 7/14/30 days/Off). On the website “Back up” uploads straight to Google Drive › “atworth backups” (Google Identity Services token, `drive.file` scope — only files atworth creates; works with password protection); inside the phone app Google blocks its sign-in screen, so it uses the share sheet. Silent background backup isn't possible because Google requires a tap to approve. Service worker no longer caches googleapis.com. Note: the **Drive API must be enabled** for the Google Cloud project of the sign-in client and `drive.file` added to the OAuth consent screen |
| 720 | Fixes from screenshots: popup inputs that have a left icon (`.form-field-icon-wrap`, e.g. Edit Asset name/type, date fields) — text started under the icon after the 709 padding change; icon now positioned at 14px and text padded to 44px. Carry-forward switch showed its raw checkbox as a big box; hidden, with a visible track. Small checkboxes in popups. Bank/cash/card log entry icons were the account colour on dark (invisible) → lightened. “Log … for any …” boxes at the bottom of each log were huge on Cash/Cards → same compact size on all three |
| 721 | **Data safety + new history screens** (new `js/logs2.js`). Saves: `DB.save` no longer swallows errors — a red banner appears if a save fails (storage full) and Settings → **Storage on this phone** shows % used, a breakdown, “Tidy old log entries” and “Remove receipt photos older than 1 year”. Sync: log entries created without an id were dropped by the merge (a typed balance could vanish) — `_ensureLogIds` gives old entries a content-based id that is the same on every device; `cashAccounts` and `cashBalanceHistory` now sync. Logs: after 60 days entries are tidied to one per account per day (closing value kept, so balances and trends don't change; runs once a day). Bank / Cash / Card history redesigned in the app: newest first, one row per account per day, tap to see each change with its reason and time, signed ▲/▼ changes, 30 days at a time. Card usage shows the real % (e.g. 259% · over by ₹63,448) on logs and card faces |
| 722 | **Unused code removed**: 86 top-level functions that nothing references (found by name search to a fixpoint across all JS/HTML; ~1,850 lines, 115 KB) deleted from 16 files — biggest: finance.js 37, features.js 16, dashboard.js 7. `growth.js` (Journal/Skills) and `custom-pages.js` now load only in the classic web layout (`document.write` guarded by `!__IS_APP` in `index.html`); the `journal` route falls back to Home when its code isn't loaded. App JS: 1,745 KB → 1,575 KB. Classic layout verified on 12 pages |
| 723 | **Sync diagnosis** (new `js/syncstatus.js`): Settings → **Sync status** shows whether this device is syncing, signed out (local only), in Demo mode, or failing — with the failing step, HTTP code, the server's message, a plain reason and what to do (login expired, server asleep/down, MongoDB unreachable, data too large). “Test sync now” contacts the server, compares cloud vs device counts and uploads. Sync requests now time out after 75 s (`_syncFetch`): a hung request used to leave the busy flag set and block every later sync until restart. Results recorded in `SYNC_LOG` / `lifeos_sync_log`. Verified with a simulated server: two devices merge, new entries and deletes travel both ways, no upload loop when idle |
| 724 | Fix: after saving from some screens the app jumped to the **old Finance page** or to **Home while the bottom bar still showed Assets**. About 20 save handlers called `renderFinance()` or `renderRecordsMyMoney()` directly; in the app both now re-render the page you are on (`cleanup.js`), and a smart search from another page opens Home first. Classic web layout unchanged |
| 725 | New **Assets** page in the app (`js/assets2.js`): colourful net-worth card with count-up and an animated Own vs Owe bar, quick buttons (Add Asset, Add Loan, Projection, Banks), 4 tiles (assets growth, cash & bank, monthly EMIs with % of income, debt-free date), a What you own / What you owe switch, tappable ring with animated legend bars, coloured rows with gain pills, loan rows with a paid-progress bar and payoff date. Same data, detail and add screens; classic web layout unchanged |
| 726 | New **loan and asset detail screens** in the app (`js/detail2.js`). Loan: hero with what is left + animated % paid ring, warning when the loan amount and outstanding do not match, plan counted from today's balance (not the original amount), tiles (EMI, debt-free in, interest still to pay, paid so far), tappable yearly bar chart, "Finish sooner" with extra-per-month chips and one-time payment, schedule from this month (12 rows + show all), Mark as paid / Delete. Asset: hero with value + gain, tiles (put in, gain, per month, per year / received, expected back for money lent), value chart, Update value / Delete. Saving an edit now stays on the detail screen. Classic web keeps the old screens |
| 727 | New **Analytics** page in the app (`js/analytics3.js`): green/rose hero with the period's net and a plain sentence plus an In vs Out bar, 4 tiles whose changes say what they compare with ("▼ 3% vs ₹1L same day last month"), saving rate can now go negative (was stuck at 0%), running-balance line with ₹0 line and last-period value, animated in/out bars, budgets with "₹X over / ₹X left" (top 5 + show all), spending ring + category rows with change, habits, and Forecast + Deep dive moved to "More insights" (fixes the cut-off text and the "7 income" label → "Income streams"). Sums use the shared money engine |
| 728 | New **Banks & Cards** page in the app (`js/banks2.js`) replacing the Banks / Cash / Cards trackers: hero "Money you really have" (bank + cash − card dues) with tappable Banks/Cash/Cards totals and a count of accounts that need an update, quick actions (Update / Pay card, Move money, Import, Add), one tab per kind, rows with a one-tap Update button, "updated X ago" (amber after 7 days), card limit bar + due-in days, tap a row to filter, trend line (30 days / 1 year) with high/low/change, then the history card |

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

## Updating the Android wrapper (target SDK)

Google Play requires a recent target API level (from 31 Aug 2026: **Android 16 / API 36**). The `android/` folder is only on the owner's PC (it is gitignored so Vercel never serves it), so these steps are done there:

1. `android/variables.gradle` → `compileSdkVersion = 36` and `targetSdkVersion = 36` (Capacitor 8 already defaults to 36; older projects may still say 35).
2. Android Studio → **SDK Manager** → install **Android 16 (API 36) SDK Platform**; accept any Android Gradle Plugin upgrade it suggests.
3. `android/app/build.gradle` → raise `versionCode` by 1 and update `versionName`.
4. In the project folder: `npx cap sync android`.
5. Android Studio → **Build → Generate Signed App Bundle** → use the **same keystore** as before → `app-release.aab`.
6. Play Console → Internal testing (optional) → **Production → Create release** → upload the `.aab` → roll out.

Android 16 always draws apps edge-to-edge. The web layer already pads with `env(safe-area-inset-*)`, but check that the header is not under the status bar after the update.
If the app was built with PWABuilder (TWA) instead, regenerate the package there with the same package ID and signing key and a higher version code.
