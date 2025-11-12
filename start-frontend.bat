@echo off
echo ========================================
echo   МАМАФООД Frontend
echo ========================================
echo.

REM Проверка дали http-server е инсталиран
where http-server >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] http-server не е намерен. Инсталиране...
    call npm install -g http-server
    if %errorlevel% neq 0 (
        echo [ERROR] Неуспешно инсталиране на http-server
        echo [INFO] Опитвам се да отворя index.html директно...
        echo.
        start index.html
        pause
        exit /b
    )
    echo.
)

echo [INFO] Стартиране на frontend сървъра...
echo [INFO] Frontend ще бъде достъпен на http://localhost:8000
echo [INFO] Натисни Ctrl+C за спиране
echo.
echo ========================================
echo.

REM Стартиране на HTTP сървъра (без -o за да не отваря автоматично)
http-server -p 8000

REM Отваряне на браузър след 1 секунда (само веднъж)
timeout /t 1 /nobreak >nul
start "" "http://localhost:8000"

pause

