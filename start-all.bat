@echo off
chcp 65001 >nul
cls
echo ========================================
echo   MAMAFOOD - Start All
echo ========================================
echo.

cd /d "%~dp0"

if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
)

if not exist ".env" (
    echo [WARNING] .env file not found!
    echo.
    echo For local testing create .env file with:
    echo.
    echo DATABASE_URL=postgresql://username:password@host:port/database
    echo PORT=3000
    echo.
    echo [INFO] Trying to start without .env file...
    echo [INFO] If you have environment variables set, they will be used.
    echo.
    timeout /t 3 /nobreak >nul
)

echo [INFO] Starting backend server on port 3000...
echo [INFO] Starting frontend server on port 8000...
echo.

start "MAMAFOOD Backend" cmd /k "node server.js"

timeout /t 3 /nobreak >nul

where http-server >nul 2>&1
if errorlevel 1 (
    echo [INFO] http-server not found. Installing...
    call npm install -g http-server
    if errorlevel 1 (
        echo [WARNING] Failed to install http-server
        echo [INFO] Trying Python/PHP...
        goto start_frontend_alt
    )
)

start "MAMAFOOD Frontend" cmd /k "http-server -p 8000 -c-1"
goto open_browser

:start_frontend_alt
python --version >nul 2>&1
if errorlevel 1 goto check_php
start "MAMAFOOD Frontend" cmd /k "python -m http.server 8000"
goto open_browser

:check_php
php --version >nul 2>&1
if errorlevel 1 goto frontend_error
start "MAMAFOOD Frontend" cmd /k "php -S localhost:8000"
goto open_browser

:frontend_error
echo [ERROR] Cannot start frontend server!
echo [INFO] Please install http-server: npm install -g http-server
echo [INFO] Or Python/PHP
goto end

:open_browser
timeout /t 2 /nobreak >nul
start "" "http://localhost:8000"

:end
echo.
echo ========================================
echo [INFO] Backend server: http://localhost:3000
echo [INFO] Frontend server: http://localhost:8000
echo [INFO] Browser opened at http://localhost:8000
echo.
echo [INFO] To stop servers, close the windows:
echo        - "MAMAFOOD Backend"
echo        - "MAMAFOOD Frontend"
echo.
pause
