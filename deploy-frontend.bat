@echo off
chcp 65001 >nul
echo ========================================
echo   МАМАФООД - Качване на Frontend
echo   pci.inex-project.net
echo ========================================
echo.

REM Конфигурация - ПРОМЕНИ ТЕЗИ СТОЙНОСТИ!
set "FTP_HOST=pci.inex-project.net"
set "FTP_USER=demo@inex-project.net"
set "FTP_PASS=demo123123"
set "FTP_DIR=/public_html/demo/PCI"
set "FTP_DIR_ALT=/var/www/mamafood"

REM Проверка дали curl е инсталиран
where curl >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] curl не е намерен!
    echo [INFO] Инсталирай curl от: https://curl.se/windows/
    pause
    exit /b 1
)

REM Проверка дали frontend файловете съществуват
if not exist "index.html" (
    echo [ERROR] index.html не е намерен!
    pause
    exit /b 1
)

if not exist "app_v2.js" (
    echo [ERROR] app_v2.js не е намерен!
    pause
    exit /b 1
)

echo [INFO] Файлове за качване:
echo   - index.html
echo   - app_v2.js
echo   - i18n.js
echo   - styles.css
echo   - manifest.json
echo   - service-worker.js
echo.

REM Потвърждение
set /p CONFIRM="Продължи с качването? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo [INFO] Качването е отменено.
    pause
    exit /b 0
)

echo.
echo [INFO] Качване на файловете чрез curl...
echo.

REM Качване на файловете чрез curl FTP
echo [INFO] Качване на index.html...
curl -T "index.html" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR%/index.html" --ftp-create-dirs
if %errorlevel% neq 0 (
    echo [WARNING] Неуспешно качване на index.html, опитвам алтернативна директория...
    curl -T "index.html" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR_ALT%/index.html" --ftp-create-dirs
)

echo [INFO] Качване на app_v2.js...
curl -T "app_v2.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR%/app_v2.js" --ftp-create-dirs
if %errorlevel% neq 0 (
    curl -T "app_v2.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR_ALT%/app_v2.js" --ftp-create-dirs
)

echo [INFO] Качване на i18n.js...
curl -T "i18n.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR%/i18n.js" --ftp-create-dirs
if %errorlevel% neq 0 (
    curl -T "i18n.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR_ALT%/i18n.js" --ftp-create-dirs
)

echo [INFO] Качване на styles.css...
curl -T "styles.css" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR%/styles.css" --ftp-create-dirs
if %errorlevel% neq 0 (
    curl -T "styles.css" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR_ALT%/styles.css" --ftp-create-dirs
)

if exist "manifest.json" (
    echo [INFO] Качване на manifest.json...
    curl -T "manifest.json" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR%/manifest.json" --ftp-create-dirs
    if %errorlevel% neq 0 (
        curl -T "manifest.json" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR_ALT%/manifest.json" --ftp-create-dirs
    )
)

if exist "service-worker.js" (
    echo [INFO] Качване на service-worker.js...
    curl -T "service-worker.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR%/service-worker.js" --ftp-create-dirs
    if %errorlevel% neq 0 (
        curl -T "service-worker.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR_ALT%/service-worker.js" --ftp-create-dirs
    )
)

echo.
echo ========================================
echo [INFO] Качването е завършено!
echo.
echo [INFO] Провери приложението на:
echo   https://%FTP_HOST%/mamafood/
echo   или
echo   https://%FTP_HOST%/
echo.
echo [INFO] Уверете се, че app_v2.js е конфигуриран с правилния API_BASE!
echo ========================================
echo.

pause

