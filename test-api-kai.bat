@echo off
echo ============================================
echo Тест на API за код KAI
echo ============================================
echo.

REM Промени този URL според твоя Render.com backend URL
set "API_URL=https://mamafood.onrender.com"

echo Тестване на Health Check...
curl -s "%API_URL%/api/health"
echo.
echo.

echo Тестване на API за код KAI...
curl -s "%API_URL%/api/records/KAI"
echo.
echo.

echo Тестване на API за код KAI (case-insensitive)...
curl -s "%API_URL%/api/records/kai"
echo.
echo.

echo Тестване на Children API за код KAI...
curl -s "%API_URL%/api/children/KAI"
echo.
echo.

echo ============================================
echo Ако виждаш грешки, провери:
echo 1. URL-ът е правилен: %API_URL%
echo 2. Render.com service е активен
echo 3. Провери Logs в Render.com Dashboard
echo ============================================
pause
