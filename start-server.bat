@echo off
echo ========================================
echo    МАМАФООД - Стартиране на сървър
echo ========================================
echo.

REM Проверка дали Python е инсталиран
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo [✓] Python намерен!
    echo.
    echo Стартиране на сървър на порт 8000...
    echo.
    echo Отидете на: http://localhost:8000
    echo.
    echo За спиране на сървъра натиснете Ctrl+C
    echo.
    python -m http.server 8000
    pause
    exit
)

REM Проверка за PHP
php --version >nul 2>&1
if %errorlevel% == 0 (
    echo [✓] PHP намерен!
    echo.
    echo Стартиране на сървър на порт 8000...
    echo.
    echo Отидете на: http://localhost:8000
    echo.
    echo За спиране на сървъра натиснете Ctrl+C
    echo.
    php -S localhost:8000
    pause
    exit
)

echo [✗] Грешка: Python или PHP не са намерени!
echo.
echo Моля, инсталирайте:
echo - Python 3: https://www.python.org/downloads/
echo - или PHP: https://www.php.net/downloads
echo.
echo Или използвайте Node.js:
echo   npx http-server -p 8000
echo.
pause

