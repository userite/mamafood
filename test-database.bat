@echo off
chcp 65001 >nul
echo ========================================
echo   Test na PostgreSQL vruzka
echo ========================================
echo.

REM Proverka dali .env fail sushtestvuva
if not exist ".env" (
    echo [ERROR] .env failat ne e nameren!
    echo.
    echo Suzdai .env fail s:
    echo DATABASE_URL=postgresql://username:password@host:port/database
    echo.
    pause
    exit /b 1
)

echo [INFO] Startirane na test na bazata danni...
echo.

node test-database.js

echo.
pause

