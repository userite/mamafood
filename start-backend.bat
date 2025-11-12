@echo off
echo ========================================
echo   МАМАФООД Backend Server
echo ========================================
echo.

REM Проверка дали node_modules съществува
if not exist "node_modules\" (
    echo [INFO] Инсталиране на зависимости...
    call npm install
    echo.
)

REM Проверка дали .env файл съществува
if not exist ".env" (
    echo [WARNING] .env файлът не е намерен!
    echo [WARNING] Създай .env файл с DATABASE_URL
    echo.
    echo Пример:
    echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mamafood
    echo PORT=3000
    echo.
    pause
)

echo [INFO] Стартиране на backend сървъра...
echo [INFO] Сървърът ще стартира на http://localhost:3000
echo [INFO] Натисни Ctrl+C за спиране
echo.
echo ========================================
echo.

call npm start

pause

