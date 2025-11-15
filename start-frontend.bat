@echo off
chcp 65001 >nul
echo ========================================
echo   МАМАФООД Frontend
echo ========================================
echo.

REM Проверка дали index.html съществува
if not exist "index.html" (
    echo [ERROR] index.html не е намерен!
    echo [ERROR] Уверете се, че сте в правилната директория.
    pause
    exit /b 1
)

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
        exit /b 1
    )
    echo.
)

echo [INFO] Стартиране на frontend сървъра...
echo [INFO] Frontend ще бъде достъпен на http://localhost:8000
echo [INFO] Backend API трябва да работи на http://localhost:3000
echo [INFO] Натисни Ctrl+C за спиране
echo.
echo ========================================
echo.

REM Стартиране на HTTP сървъра в отделен прозорец
start "МАМАФООД Frontend Server" cmd /k "http-server -p 8000 -c-1"

REM Изчакване малко за да се стартира сървърът
timeout /t 2 /nobreak >nul

REM Отваряне на браузър
start "" "http://localhost:8000"

echo.
echo [INFO] Frontend сървърът работи в отделен прозорец
echo [INFO] Браузърът е отворен на http://localhost:8000
echo [INFO] За да спреш сървъра, затвори прозореца "МАМАФООД Frontend Server"
echo.
pause

