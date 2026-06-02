# ============================================================
#  LifeOS one-click deploy
#  - auto-bumps the version (build + cache + ?v=) everywhere
#  - commits and pushes to GitHub  ->  Vercel auto-deploys (~1 min)
#  Just double-click deploy.bat after editing css/mobile.css.
# ============================================================

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$enc = New-Object System.Text.UTF8Encoding($false)   # UTF-8, no BOM (safe for JS)

function ReadAll($p)  { [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot $p)) }
function WriteAll($p,$c) { [System.IO.File]::WriteAllText((Join-Path $PSScriptRoot $p), $c, $enc) }

# --- current build number lives in js/storage.js ---
$storage = ReadAll 'js/storage.js'
$m = [regex]::Match($storage, 'APP_BUILD = (\d+)')
$old = [int]$m.Groups[1].Value
$new = $old + 1
Write-Host "Bumping build $old -> $new ..." -ForegroundColor Cyan

# storage.js : APP_BUILD
WriteAll 'js/storage.js' ($storage -replace "APP_BUILD = $old", "APP_BUILD = $new")

# sw.js : cache name + comment
$sw = ReadAll 'sw.js'
$sw = $sw -replace 'lifeos-v\d+', "lifeos-v$new"
$sw = $sw -replace 'Service Worker . v[\d.]+', "Service Worker - v$new.0"
WriteAll 'sw.js' $sw

# index.html : every ?v=NN cache-buster (css + js)
$idx = ReadAll 'index.html'
$idx = $idx -replace '\?v=\d+', "?v=$new"
WriteAll 'index.html' $idx

# --- commit & push ---
git add -A
git commit -m "Deploy build $new"
git push origin main

Write-Host ""
Write-Host "DONE - build $new pushed. Live on Vercel in ~1 minute." -ForegroundColor Green
Write-Host "On your phone: fully close LifeOS, reopen, check Settings shows build $new." -ForegroundColor Green
Read-Host "`nPress Enter to close"
