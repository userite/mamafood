@echo off
REM === OMNIMED auto Git push ===
cd /d "c:\~ip\app-dblib\cursor_projects\MAMAFOOD\"

git add -A
git commit -m "Auto update: %date% %time%"
git push origin main

echo.
echo ✅ Code pushed to GitHub successfully.
pause
