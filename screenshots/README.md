# App Screenshots

Save your phone screenshots here with these EXACT filenames (PNG):

| Filename            | What it shows                          |
|---------------------|----------------------------------------|
| `dashboard.png`     | Dashboard (net worth, quick actions)   |
| `finance.png`       | Finance (banks, cards, cash)           |
| `budget.png`        | Budget Planner                         |
| `assets.png`        | All Assets (investments)               |
| `analytics.png`     | Financial overview / analytics         |

These filenames are referenced in `/manifest.json` → `screenshots`.

## Notes
- Recommended size: **1080 × 2400 px** (standard phone). If your screenshots are a
  different size, either resize them to 1080×2400, or tell the dev to update the
  `sizes` field in manifest.json to match — otherwise PWABuilder may show a minor
  size-mismatch warning (not a blocker).
- For the **Play Store listing itself**, upload these same images directly in
  Play Console → Store listing → Phone screenshots (that's what users see on the
  store page). The manifest screenshots are for the PWA install prompt + PWABuilder score.
