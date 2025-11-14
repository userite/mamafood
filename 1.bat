@echo off
REM === MamaFood Auto Commit & Push Script ===

REM 1️⃣ Влизаме в проекта
cd /d "c:\~ip\app-dblib\cursor_projects\MAMAFOOD\"

REM 2️⃣ Свързваме към GitHub, ако не е конфигуриран (еднократно)
git remote remove origin >nul 2>&1
git remote add origin https://github.com/userite/mamafood.git

REM 3️⃣ Добавяме и комитваме всичко
git add -A
git commit -m "Auto update: %date% %time%"

REM 4️⃣ Push към GitHub
git push -u origin main

echo.
echo ✅ MamaFood pushed successfully to GitHub.
pause
