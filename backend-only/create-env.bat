@echo off
chcp 65001 >nul
echo ========================================
echo   Създаване на .env файл за Backend
echo ========================================
echo.

REM Промяна на директорията към backend-only
cd /d "%~dp0"

if exist ".env" (
    echo [WARNING] .env файлът вече съществува!
    echo.
    set /p overwrite="Искаш ли да го препишеш? (y/n): "
    if /i not "%overwrite%"=="y" (
        echo Отменено.
        pause
        exit /b 0
    )
)

echo.
echo Възможни варианти за DATABASE_URL:
echo.
echo 1. Локална PostgreSQL база
echo    Формат: postgresql://username:password@localhost:5432/mamafood
echo    Пример: postgresql://postgres:postgres@localhost:5432/mamafood
echo.
echo 2. Render.com PostgreSQL - External URL
echo    Използвай за локално тестване или когато backend НЕ е на Render.com
echo    Вземи "External Connection String" от Render Dashboard
echo    Формат: postgresql://username:password@host:port/database
echo.
echo 3. Render.com PostgreSQL - Internal URL
echo    Използвай когато backend Е на Render.com (по-бърз, без SSL)
echo    Вземи "Internal Connection String" от Render Dashboard
echo.
echo ========================================
echo.

set /p db_url="Въведи DATABASE_URL (External - за локално тестване): "
set /p db_url_internal="Въведи DATABASE_URL_INTERNAL (Internal - опционално, Enter за пропускане): "

if "%db_url%"=="" (
    echo.
    echo Създавам .env файл с пример...
    (
        echo # Database Configuration
        echo # External URL - използва се за локално тестване или когато backend НЕ е на Render.com
        echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mamafood
        echo.
        echo # Internal URL - използва се когато backend Е на Render.com ^(по-бърз, без SSL^)
        echo # DATABASE_URL_INTERNAL=postgresql://username:password@internal-host:port/database
        echo.
        echo # Port ^(опционално, по подразбиране е 3000^)
        echo PORT=3000
    ) > .env
    echo.
    echo ✅ Създаден .env файл с пример!
    echo.
    echo ⚠️  ВАЖНО: Отвори .env файла и попълни правилния DATABASE_URL!
    echo.
) else (
    echo.
    echo Създавам .env файл...
    (
        echo # Database Configuration
        echo # External URL - използва се за локално тестване или когато backend НЕ е на Render.com
        echo DATABASE_URL=%db_url%
        if not "%db_url_internal%"=="" (
            echo.
            echo # Internal URL - използва се когато backend Е на Render.com ^(по-бърз, без SSL^)
            echo DATABASE_URL_INTERNAL=%db_url_internal%
        )
        echo.
        echo # Port ^(опционално, по подразбиране е 3000^)
        echo PORT=3000
    ) > .env
    echo.
    echo ✅ .env файлът е създаден!
)

echo.
echo Следваща стъпка: Редактирай .env файла и увери се че DATABASE_URL е правилен!
echo.
pause

