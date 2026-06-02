@echo off
REM Double-click me to deploy LifeOS after editing css/mobile.css
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"
