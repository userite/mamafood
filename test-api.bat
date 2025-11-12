@echo off
chcp 65001 >nul
echo ========================================
echo   Test na API endpoints
echo ========================================
echo.

echo [INFO] Proverka dali backend survarat raboti...
echo.

REM Proverka na health endpoint
echo 1. Test na /api/health...
curl -s http://localhost:3000/api/health
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Backend survarat ne raboti na http://localhost:3000
    echo [INFO] Startirai backend survarat s: start-backend.bat
    echo.
    pause
    exit /b 1
)

echo.
echo.
echo 2. Test na /api/records/KAI...
curl -s http://localhost:3000/api/records/KAI
echo.
echo.

echo 3. Test na /api/children/KAI...
curl -s http://localhost:3000/api/children/KAI
echo.
echo.

echo ========================================
echo Testat priklyuchi
echo ========================================
echo.
pause

