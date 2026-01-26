@echo off
chcp 65001 >nul
echo ========================================
echo   Качване само на app_v2.js
echo ========================================
echo.

REM Конфигурация
set "FTP_HOST=pci.inex-project.net"
set "FTP_USER=demo@inex-project.net"
set "FTP_PASS=demo123123"
set "FTP_DIR=/public_html/demo/PCI"
set "FTP_DIR_ALT=/var/www/mamafood"

echo [INFO] Качване на app_v2.js...
curl.exe -T "app_v2.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR%/app_v2.js" --ftp-create-dirs
if %errorlevel% neq 0 (
    echo [WARNING] Опитвам алтернативна директория...
    curl.exe -T "app_v2.js" --user "%FTP_USER%:%FTP_PASS%" "ftp://%FTP_HOST%%FTP_DIR_ALT%/app_v2.js" --ftp-create-dirs
)

echo.
echo [INFO] Качването е завършено!
echo.
echo [INFO] Направи hard refresh (Ctrl+F5) в браузъра!
echo ========================================
echo.

pause

