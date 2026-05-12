@echo off
echo Copying LifeOS icons...

set SRC=C:\Users\sarav\.gemini\antigravity\brain\e712f744-f24b-4dcc-ade0-8faded8be32c\lifeos_icon_1778565110113.png
set DEST=C:\Users\sarav\Documents\antigravity\New folder\LifeOS\icons

if not exist "%DEST%" mkdir "%DEST%"
copy "%SRC%" "%DEST%\icon-192.png"
copy "%SRC%" "%DEST%\icon-512.png"

echo.
echo Done! Icons saved to:
echo   %DEST%\icon-192.png
echo   %DEST%\icon-512.png
echo.
pause
