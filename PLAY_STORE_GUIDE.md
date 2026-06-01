# Publishing LifeOS to the Google Play Store

LifeOS is a PWA. To put it on Play, you wrap it as a **TWA (Trusted Web Activity)** —
a thin Android shell that opens your live website full-screen (no browser bar).

Your live URL: **https://lifeos.vercel.app** (or your custom domain — use the real one everywhere below).

---

## ✅ Already done (in this repo)
- `manifest.json` — valid, installable, has 192/512 icons (incl. maskable), `standalone`, theme colors, app `id`.
- Service worker (`sw.js`) registered → offline support.
- `/.well-known/assetlinks.json` — created (needs your fingerprint, see Step 4).
- `vercel.json` — serves `assetlinks.json` correctly.

---

## Step 1 — One-time accounts (~30 min)
1. **Google Play Developer account** — https://play.google.com/console → pay the **one-time $25** fee.
2. Have a **Privacy Policy URL** ready (Play requires it for finance apps). A simple page on your site is fine.

## Step 2 — Generate the Android app package (no coding)
Use **PWABuilder** (easiest, free, made by Microsoft):
1. Go to **https://www.pwabuilder.com**
2. Enter your live URL → **Start**.
3. It scores your PWA (manifest/SW/icons). Fix any red items it flags.
4. Click **Package For Stores → Android → Generate Package**.
5. In options, set:
   - **Package ID**: `com.lifeos.app`  ← must match `assetlinks.json` and `manifest.json` `id`
   - **App name**: `LifeOS`
   - **Signing key**: choose **"Create new"** (PWABuilder makes & stores it) — **download and BACK UP the `.keystore` + passwords**. If you lose them you can never update the app.
6. Download the ZIP. It contains:
   - `app-release-signed.aab` ← upload this to Play
   - `assetlinks.json` ← **the real one with your fingerprint**
   - `signing-key-info.txt` ← your SHA-256 fingerprint + key passwords

> Alternative (CLI): `npx @bubblewrap/cli init --manifest https://YOUR_URL/manifest.json` then `bubblewrap build`. Needs Java + Android SDK installed.

## Step 3 — Create the app in Play Console
1. Play Console → **Create app** → name `LifeOS`, type **App**, **Free**.
2. Fill **Store listing**: short + full description, app icon (512×512), feature graphic (1024×500),
   and **at least 2 phone screenshots** (take them from the running app).
3. Complete **Content rating**, **Data safety** (declare you store financial data locally + on your server),
   **Target audience**, and add your **Privacy Policy URL**.

## Step 4 — Wire up Digital Asset Links (removes the URL bar) ⚠️ important
Play re-signs your app ("Play App Signing"), so the fingerprint that matters is the one **Google** uses:
1. Upload the `.aab` to an **Internal testing** release first.
2. Play Console → **Setup → App signing** → copy the **"App signing key certificate" SHA-256 fingerprint**.
3. Paste that fingerprint into **`.well-known/assetlinks.json`** in this repo (replace the placeholder), commit & push so Vercel serves it.
4. Verify it's live: open `https://YOUR_URL/.well-known/assetlinks.json` — you should see your JSON.

> If you skip/mis-set this, the app still works but shows a browser address bar at the top.

## Step 5 — Test, then release
1. Use the **Internal testing** track → add your email as a tester → install on your phone → confirm:
   - opens full-screen (no URL bar = assetlinks correct)
   - voice, language switch, offline all work
2. When happy: **Production → Create release → upload the same `.aab` → Roll out**.
3. First review takes a few days (finance apps sometimes longer).

---

## Gotchas
- **Use the Play App Signing SHA-256**, not your upload key's — most common reason the URL bar won't disappear.
- **Package ID must match everywhere**: `com.lifeos.app` in PWABuilder, `manifest.json` `id`, and `assetlinks.json`.
- **Back up your keystore** — losing it means you can't push updates.
- App content updates ship instantly via your website (it's a TWA) — you only re-upload the `.aab` if you change the wrapper (icon, package, splash).
