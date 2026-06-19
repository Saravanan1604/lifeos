# Build Prompt: "atworth" (LifeOS) — Money & Life Operating System

> Copy everything below into an AI coding tool (Claude, Cursor, etc.) as a single build brief. It is written so an AI with no other context can reconstruct the app's architecture, features, data model, and deployment pipeline from scratch.

---

## 1. What to build

A personal finance + life-tracking Progressive Web App called **"atworth"** (internal/dev codename: **LifeOS**), installable on Android via the Play Store, that works as one continuous "operating system" for someone's money, habits, health, goals, and notes — entirely client-first (works offline, syncs to the cloud when online).

One-line pitch: *"track expenses, budgets, bank balances, cash, credit cards, investments, and net worth — plus habits, health, goals, journal, and notes — all in one dashboard, with an AI coach that explains what's happening with your money."*

## 2. Non-negotiable technical constraints

Build this in **strict vanilla JavaScript**. Do **not** introduce React, Vue, Svelte, Angular, or any other UI framework, and do **not** introduce a build step (no Webpack/Vite/bundler — the app ships as raw files a browser can load directly).

- **Frontend:** Plain HTML + hand-written CSS + vanilla JS (ES6+).
- **Rendering pattern:** Each "page" is a JS function (`renderDashboard()`, `renderFinance()`, `renderHealth()`, etc.) that returns/injects an HTML string via `innerHTML` into a single `#page-container` element. Navigation is a single `navigate(pageName)` function that swaps which render function runs — there is no router library.
- **Styling:** One global stylesheet for desktop/web (`css/styles.css`) plus a **mobile-only** stylesheet (`css/mobile.css`) that is scoped entirely under a `html.is-app` class, so installed-app styling can never leak into the desktop/web experience. Detect "installed app" mode via `display-mode: standalone/fullscreen/minimal-ui` media queries, `navigator.standalone`, a Capacitor check, or a stored flag — set in an inline `<script>` in `<head>` before first paint to avoid flash-of-wrong-layout.
- **No npm packages in the frontend.** All third-party libraries are loaded via `<script>` CDN tags only: a charting library (Chart.js), a spreadsheet/CSV export library (SheetJS/XLSX), a PDF library (PDF.js or similar, for exporting yearly reports), and an icon set (Lucide icons).
- **State management:** A single global `STATE` object (loaded from `localStorage`) is the source of truth; every page render function reads directly from `STATE`. A `saveState()` function persists it back to `localStorage` and pushes it to the cloud sync endpoint.
- **Offline-first:** A service worker precaches the app shell so the app fully works with no network connection; cloud sync is a background enhancement, not a requirement.

## 3. Data model

Model everything around one root object, persisted to `localStorage` under a single versioned key (e.g. `lifeos_v1`):

```text
STATE = {
  user: null | { id, email, name },
  xp: number, level: number, streak: number, lastActive: dateString,
  unlockedAchievements: [achievementId, ...],
  settings: { theme, currency, name, bgAnim },

  transactions: [{ id, type: 'income'|'expense', amount, category, subcategory,
                   icon, description, accountId, date, time }],
  accounts: [{ id, name, type: 'cash'|'bank'|..., balance }],
  budgets: [{ id, category, limit, period }],
  investments: [{ id, name, type, amount, currentValue, date }],
  goals: [{ id, name, target, current, deadline, sourceLink }],

  healthEntries: [{ id, date, mood, weight, notes, ... }],
  habits: [{ id, name, icon, frequency, ... }],
  habitCompletions: [{ habitId, date }],

  skills: [{ id, name, level, notes }],
  jobApplications: [{ id, company, role, status, date }],
  emotionEntries: [{ id, date, mood, tags, note }],   // journal

  tasks: [...], chatHistory: [...],
  notes: [{ id, title, body, pinned, color, createdAt }],
  recurring: [{ id, type, amount, category, icon, description, source,
                subcategory, frequency, nextDate }],
  customCategories: [{ id, name, icon, type }],

  bankBalanceHistory: [{ accountId, balance, date, note }],
  bankTransfers: [{ id, fromId, toId, amount, date, note }],
  creditCards: [{ id, name, limit, ... }],
  creditCardHistory: [{ id, cardId, outstanding, prevOutstanding, date, note, createdAt }],

  deletedIds: [{ id, at }],          // tombstones so deletes survive multi-device sync
  customPages: [{ id, name, icon, order }],          // user-defined extra pages
  customPageLayouts: { [pageId]: { [cardKey]: { order, hidden, size } } }
}
```

Design decisions worth keeping:
- **Tombstones for deletes** (`deletedIds`) so that deleting something on Device A doesn't get resurrected by a stale sync from Device B.
- **Merge-by-id sync**: when cloud data and local data both exist, merge arrays by `id`, preferring whichever record has the newer timestamp, rather than blindly overwriting one with the other.
- **Per-page, per-card layout customization**: every page's "cards" can be reordered, resized, and hidden by the user, persisted separately from the page's data (`customPageLayouts` / a `lifeos_layout_<page>` key per page).

## 4. Feature inventory (build all of these)

### Core finance
- **Transactions** — add/edit/delete income & expense entries with category, subcategory, account, date/time, emoji icon.
- **Accounts** — multiple wallets (cash, bank, etc.) with running balances.
- **Bank Tracker** — manual balance check-ins over time per account, a trend chart (week/month/year toggle), inter-account transfers, and a separate **credit card tracker** (outstanding balance history per card, "previous vs current" deltas).
- **Budgets** — per-category spending limits with progress indicators.
- **Recurring transactions** — define a recurring income/expense with a frequency (daily/weekly/monthly/etc.), auto-post into `transactions` when due, editable from a dedicated Recurring page.
- **Investments** — track holdings and current value.
- **Goals** — savings targets with a deadline and optional auto-sync from an account/category's running total.
- **Custom categories** — user-defined categories with icon + type (income/expense), in addition to built-in ones.
- **CSV import/export** — import a bank/card statement CSV (map columns to date/description/amount), preview before committing, and export transactions/reports back out to CSV.
- **Templates** — save a transaction as a reusable template for fast re-entry.
- **Analytics page** — cross-metric charts (income vs expense over time, category breakdown, allocation pie/ring chart), selectable period.
- **Yearly report** — a year-in-review table + bar chart, exportable to PDF.

### Life tracking
- **Habits** — daily habit grid (calendar heatmap style), streak tracking, log/reset progress.
- **Health hub** — mood + free-form health entries with a trend chart.
- **Heatmap** — a GitHub-style contribution heatmap of activity (configurable metric/mode), navigable by month.
- **Journal** — mood-tagged emotion journal entries with tags.
- **Career hub** — skills tracker and a job-application tracker (company, role, status).
- **Notes** — Google-Keep-style notes: pin, color, quick create/edit/delete.
- **Goals/Achievements/Gamification** — XP, levels, streaks, and unlockable achievements that fire toast/confetti celebrations; level-up triggers a full-screen banner animation.

### Dashboard & "AI" layer
- **Dashboard ("Home")** — a single glanceable page: a computed **Life Score**, KPI cards (income/expense/net worth this period), an AI-generated insights bar (plain-language observations like "spending is up 12% vs last month"), balances card, budgets/goals progress card, sparkline mini-charts, and **user-configurable widgets** (a widget picker lets the user add/remove dashboard cards).
- **AI Coach page** — a chat-style assistant that answers questions about the user's own data (e.g., "How's my spending this month?") by computing real numbers from `STATE` (month-over-month % change, 50/30/20 budget-rule comparison, emergency-fund-months-covered, category breakdown, simple spend projection) and formatting a conversational answer — **no external LLM API call required**; it's a deterministic insights engine over local data, formatted as chat.
- **Custom pages** — users can create their own named pages and choose which pre-built "cards" (life score, KPIs, balances, budgets/goals, habits, recent transactions, etc.) appear on them, in what order.

### App-level features
- **Onboarding flow** — a short first-run wizard (skip-able) that gets the user to add their first account/transaction/habit.
- **App lock** — PIN-code lock screen (4-digit, hashed) with optional biometric unlock, session-based unlock (don't re-prompt every navigation within a session).
- **Command palette** — a keyboard-driven (or tap-driven) fuzzy command launcher to jump to any page or action.
- **Floating calculator** — a draggable, always-available calculator overlay with standard + scientific + basic financial modes (e.g., loan/EMI math).
- **Voice assistant** — multi-language voice input (Web Speech API `SpeechRecognition`) and spoken responses (`speechSynthesis`), with a language picker (flag + label per supported language) so the whole assistant can run in the user's preferred language.
- **Theming** — multiple themes (e.g., an AMOLED-black default), a light/dark toggle, selectable animated backgrounds (e.g., an "aurora" particle effect), a "big mode" accessibility text-scale toggle, and a time-of-day-based automatic theme.
- **Layout customizer** — per-page edit mode to reorder/resize/hide each card, independent per page (including custom pages).
- **Undo/redo** — a generic undo/redo stack for destructive actions.
- **Settings page** — theme, currency, name, data export/import (full JSON backup), CSV export, danger-zone actions.
- **Help & feedback page** — searchable FAQ/accordion + a feedback form.
- **Command-driven celebrations** — confetti bursts and milestone banners on goal completion, level-up, and streak milestones.

## 5. Navigation model

Maintain a flat list of canonical page names and treat anything else as a user-defined custom page:

```js
const LO_PAGES = [
  'dashboard', 'finance', 'investments', 'transactions', 'notes',
  'yearly', 'budget', 'bank-tracker', 'health', 'habits', 'goals',
  'journal', 'achievements', 'ai-coach',
  'categories', 'recurring', 'settings', 'help'
];
```

`navigate(pageName)` should: update browser history (so back/forward works), call the matching `render<Page>()` function, re-inject Lucide icons (`lucide.createIcons()`), and re-apply that page's saved card layout.

## 6. File/folder structure to produce

```
index.html              # app shell + <head> is-app detection script + CDN <script> tags
manifest.json           # PWA manifest (id, name, icons, theme_color, display: standalone)
sw.js                   # service worker: precache list + cache-name versioning
offline.html            # offline fallback page
privacy.html / terms.html / delete-account.html   # required for Play Store + AdSense
css/
  styles.css            # base/desktop styles
  mobile.css            # ALL installed-app styling, scoped to html.is-app
  premium.css           # extra visual polish (gradients, glass cards, etc.)
  calc.css              # floating calculator styles
js/
  storage.js            # APP_VERSION/APP_BUILD constants, STATE/DB load+save, sync engine, formatters
  core.js                # navigate(), _renderPage(), modal/toast system, background animation, theme toggle
  init.js                # bootstrap on load, native bridge hooks (see §8), theme dock
  dashboard.js           # renderDashboard, Life Score calc, AI insights bar, KPI/balances/budgets cards
  finance.js             # renderFinance (transactions list/add/edit), category icon/color helpers
  bank-tracker.js        # renderBankTracker, balance history, transfers, credit card tracker
  life.js                # renderHealth, renderHabits, renderGoals
  growth.js              # renderJournal, renderCareer (skills + job applications)
  ai.js                  # renderAchievements, AI Coach data engine + chat renderer
  calculator.js          # floating calculator (standard/scientific/financial modes)
  features.js            # command palette, confetti/celebrations, CSV import/export, templates
  premium.js             # demo data seeder, celebration/XP-pop animations, time-based theme
  categories.js          # category CRUD, recurring transaction CRUD + processing
  pages.js               # renderAnalytics, renderSettings, data export/import, CSV export
  custom-pages.js        # custom page CRUD + card builder functions
  widgets.js             # dashboard widget picker + renderer
  heatmap.js             # activity heatmap page
  notes.js               # notes CRUD
  onboarding.js          # first-run wizard
  applock.js             # PIN/biometric lock screen
  voice.js               # multi-language voice assistant (STT + TTS)
  yearly.js              # yearly report + PDF export
  layout.js              # LO_PAGES list, per-page layout customizer
icons/                   # app icons (192/512 px, "any" + "maskable" purposes)
android/                 # generated native Android project (see §8)
capacitor.config.json
package.json
deploy.bat / deploy.ps1  # one-click version bump + deploy (see §9)
```

## 7. Backend

A minimal Node.js + Express API, deployed separately from the frontend, providing only what's needed for account auth and cross-device sync:

- `POST /api/register`, `POST /api/login` — email/password auth, return a JWT.
- `GET /api/me` — return the current user's profile from the JWT.
- `POST /api/sync` — accept the client's full `STATE` JSON blob, merge it with whatever is stored for that user, and return the merged result. Store the merged blob as a single JSON document per user (one row/document, not normalized tables) — simplest possible persistence model, since the real "schema" lives entirely in the frontend's `STATE` shape.
- Use MongoDB (or any document store) for persistence — a single `users` collection with one JSON blob field per user is sufficient; no relational schema needed.
- Protect `/sync` and `/me` with JWT bearer auth.
- The frontend should treat the backend as optional: if the network call fails, keep working entirely from `localStorage` and retry sync later. Show a small sync-status indicator (dot) rather than blocking the UI.

## 8. Mobile packaging (Play Store)

Wrap the same live website as an installable Android app rather than writing a separate native app:

1. Use **Capacitor**: `appId` like `com.yourcompany.yourapp`, `webDir` pointing at a static asset mirror, and a `server.url` pointing at the **live production URL** so the installed app always shows the latest deployed site without needing a new store submission for content changes.
2. Generate the native Android project (`android/` Gradle project) via the Capacitor CLI; only rebuild/resubmit the `.aab` if you change native plugins or app config — not for ordinary content/feature updates.
3. Add guarded "native bridge" hooks in JS (e.g., haptics on tap) that check `window.Capacitor` exists before calling any native API, so the same JS runs fine in a plain browser too.
4. Set up **Digital Asset Links** (`.well-known/assetlinks.json`) with your **Play App Signing** SHA-256 certificate fingerprint (not your local upload-key fingerprint) so the installed app opens full-screen with no browser URL bar.
5. Serve `assetlinks.json` with `Content-Type: application/json` from your hosting config.
6. Publish through Google Play Console: package name, signing key backup, store listing, content rating questionnaire, and the Data Safety form (declare what data you collect — at minimum account email and the financial/health data the app stores).
7. Detect "installed app" mode (see §2) to suppress web-only features that aren't allowed inside a wrapped app — e.g., disable any web ad network inside the installed app, since most ad networks' policies forbid ads inside a TWA/app wrapper.

## 9. Hosting & deployment

- **Frontend hosting:** a static/Git-integrated host (e.g., Vercel) connected to your GitHub repo's main branch, so every push auto-deploys (~1 minute) with no separate CI pipeline required for a project this size.
- **Backend hosting:** any small Node host (e.g., Render) running the Express API continuously, with environment variables for the JWT secret and database connection string.
- **Cache-busting on every deploy** is critical since there's no build hash: bump an `APP_BUILD` integer constant in `storage.js`, rename the service worker's `CACHE` constant, and refresh every `?v=NN` query string on `<script>`/`<link>` tags in `index.html` — otherwise installed clients (especially the wrapped Android app and any service-worker-controlled browser tab) will keep serving stale cached files.
- **One-click deploy script:** write a script (PowerShell/bash) that: (1) bumps the build/version numbers everywhere they appear, (2) mirrors `css/`, `js/`, `icons/` plus the root HTML/manifest/service-worker files into the Capacitor `www/` folder so the Android build stays in sync with the web build, (3) runs `git add -A && git commit && git push`. Wrap it in a double-clickable `.bat`/`.sh` for a zero-friction release flow.
- **Security headers:** set `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY` globally; serve `index.html` and `/` with `no-cache, no-store, must-revalidate` (so the shell always re-checks for a new build) while static assets can be cached aggressively once they're behind versioned query strings.

## 10. Suggested build order

1. Scaffold `index.html` + `storage.js` (STATE shape, load/save) + `core.js` (`navigate`, modal/toast) — get a blank shell that can switch between two dummy pages.
2. Build Finance first (transactions, accounts, categories) since almost every other feature reads from it.
3. Build Dashboard once Finance has real data to summarize (Life Score, KPIs, insights).
4. Add Bank Tracker, Budgets, Recurring, Goals, Investments.
5. Add the life-tracking pages (Habits, Health, Journal, Career, Notes) — these are independent of Finance and can be built in any order.
6. Add Analytics, Yearly Report, Settings (export/import), Categories management.
7. Layer on app-feel features: onboarding, app lock, command palette, calculator, themes, layout customizer, gamification/celebrations, voice assistant, custom pages, widgets.
8. Wire up the backend (`register`/`login`/`sync`/`me`) and the client-side sync engine; make everything degrade gracefully offline.
9. Add the PWA manifest + service worker for installability/offline support.
10. Wrap with Capacitor, generate the Android project, configure Digital Asset Links, and publish to Play Console.
11. Set up hosting (frontend + backend) and write the one-click deploy script with cache-busting.

## 11. Acceptance bar

The rebuilt app should let a user, with zero network connection after first load: add a transaction, see the dashboard update instantly, log a habit, write a note, and have all of it persist after closing and reopening the browser/app — with sync to the cloud happening transparently whenever a connection is available, and no data loss if the same account is used on a second device.
