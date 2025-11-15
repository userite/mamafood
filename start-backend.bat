@echo off
chcp 65001 >nul
echo ========================================
echo   МАМАФООД Backend Server (PostgreSQL)
echo ========================================
echo.

REM Промяна на директорията към backend-only
cd /d "%~dp0backend-only"
if not exist "server_pg.js" (
    echo [ERROR] Не е намерен server_pg.js в backend-only директорията!
    pause
    exit /b 1
)

REM Проверка дали node_modules съществува
if not exist "node_modules\" (
    echo [INFO] Инсталиране на зависимости...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Неуспешно инсталиране на зависимости!
        pause
        exit /b 1
    )
    echo.
)

REM Проверка дали .env файл съществува (опционално за локално тестване)
if not exist ".env" (
    echo [WARNING] .env файлът не е намерен в backend-only/ директорията!
    echo.
    echo За локално тестване трябва да създадеш .env файл с:
    echo.
    echo Вариант 1: Локална PostgreSQL база
    echo DATABASE_URL=postgresql://postgres:твоята_парола@localhost:5432/mamafood
    echo PORT=3000
    echo.
    echo Вариант 2: Render.com PostgreSQL
    echo DATABASE_URL=postgresql://username:password@host:port/database
    echo PORT=3000
    echo.
    echo За да създадеш .env файл автоматично, пусни: create-env.bat
    echo.
    echo [INFO] Опитвам се да стартирам без .env файл...
    echo [INFO] Ако имаш environment variables зададени, те ще се използват.
    echo.
    timeout /t 3 /nobreak >nul
)

echo [INFO] Стартиране на backend сървъра...
echo [INFO] Сървърът ще стартира на http://localhost:3000
echo [INFO] API Health Check: http://localhost:3000/api/health
echo [INFO] Натисни Ctrl+C за спиране
echo.
echo ========================================
echo.

call npm start

pause

