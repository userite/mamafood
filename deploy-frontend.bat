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
set "FTP_DIR_ALT=/public_html"

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
echo   - uik.js
echo   - uik-ui.js
echo   - url-manager.js
echo.

REM Потвърждение
rem set /p CONFIRM="Продължи с качването? (Y/N): "
rem if /i not "%CONFIRM%"=="Y" (
rem     echo [INFO] Качването е отменено.
rem     pause
rem     exit /b 0
rem )

echo.
echo [INFO] Качване на файловете чрез curl...
echo.

REM Качване на файловете чрез curl FTP
echo [INFO] Качване на index.html...
curl.exe -T "index.html" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR%/index.html" --ftp-create-dirs
if %errorlevel% neq 0 (
    echo [WARNING] Неуспешно качване на index.html, опитвам алтернативна директория...
    curl.exe -T "index.html" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR_ALT%/index.html" --ftp-create-dirs
)

echo [INFO] Качване на app_v2.js...
curl.exe -T "app_v2.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR%/app_v2.js" --ftp-create-dirs
if %errorlevel% neq 0 (
    curl.exe -T "app_v2.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR_ALT%/app_v2.js" --ftp-create-dirs
)

echo [INFO] Качване на i18n.js...
curl.exe -T "i18n.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR%/i18n.js" --ftp-create-dirs
if %errorlevel% neq 0 (
    curl.exe -T "i18n.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR_ALT%/i18n.js" --ftp-create-dirs
)

echo [INFO] Качване на styles.css...
curl.exe -T "styles.css" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR%/styles.css" --ftp-create-dirs
if %errorlevel% neq 0 (
    curl.exe -T "styles.css" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR_ALT%/styles.css" --ftp-create-dirs
)

if exist "manifest.json" (
    echo [INFO] Качване на manifest.json...
    curl.exe -T "manifest.json" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR%/manifest.json" --ftp-create-dirs
    if %errorlevel% neq 0 (
        curl.exe -T "manifest.json" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR_ALT%/manifest.json" --ftp-create-dirs
    )
)

if exist "service-worker.js" (
    echo [INFO] Качване на service-worker.js...
    curl.exe -T "service-worker.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR%/service-worker.js" --ftp-create-dirs
    if %errorlevel% neq 0 (
        curl.exe -T "service-worker.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR_ALT%/service-worker.js" --ftp-create-dirs
    )
)

if exist "uik.js" (
    echo [INFO] Качване на uik.js...
    curl.exe -T "uik.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR%/uik.js" --ftp-create-dirs
    if %errorlevel% neq 0 (
        curl.exe -T "uik.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR_ALT%/uik.js" --ftp-create-dirs
    )
)

if exist "uik-ui.js" (
    echo [INFO] Качване на uik-ui.js...
    curl.exe -T "uik-ui.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR%/uik-ui.js" --ftp-create-dirs
    if %errorlevel% neq 0 (
        curl.exe -T "uik-ui.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR_ALT%/uik-ui.js" --ftp-create-dirs
    )
)

if exist "url-manager.js" (
    echo [INFO] Качване на url-manager.js...
    curl.exe -T "url-manager.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR%/url-manager.js" --ftp-create-dirs
    if %errorlevel% neq 0 (
        curl.exe -T "url-manager.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR_ALT%/url-manager.js" --ftp-create-dirs
    )
)

echo.
echo ========================================
echo [INFO] Качването е завършено!
echo.
echo [INFO] Провери приложението на:
echo   https://inex-project.net/demo/PCI/
echo.
echo [INFO] Уверете се, че app_v2.js е конфигуриран с правилния API_BASE!
echo ========================================
echo.

rem pause

