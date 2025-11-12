@echo off
echo ========================================
echo   Suzdavane na .env fail
echo ========================================
echo.

if exist ".env" (
    echo [WARNING] .env failat veche sushtestvuva!
    echo.
    set /p overwrite="Iskash li da go prepishe? (y/n): "
    if /i not "%overwrite%"=="y" (
        echo Otmeneno.
        pause
        exit /b 0
    )
)

echo.
echo Vazmozhni variant za DATABASE_URL:
echo.
echo 1. Lokalna PostgreSQL baza
echo    Format: postgresql://username:password@localhost:5432/mamafood
echo    Primer: postgresql://postgres:postgres@localhost:5432/mamafood
echo.
echo 2. Render.com PostgreSQL
echo    Vzemi connection string ot Render Dashboard
echo    Format: postgresql://username:password@host:port/database
echo.
echo 3. Drug cloud provider
echo    Ispolzvaite techniya connection string
echo.
echo ========================================
echo.

set /p db_url="Vuvedi DATABASE_URL (ili Enter za primer): "

if "%db_url%"=="" (
    echo.
    echo Suzdavam .env fail s primer...
    (
        echo # Database Configuration
        echo # Zameni s tvoya connection string
        echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mamafood
        echo.
        echo # Port ^(optsionalno, po podrazbirane e 3000^)
        echo PORT=3000
    ) > .env
    echo.
    echo OK Suzdan .env fail s primer!
    echo.
    echo VAZHNO: Otvori .env faila i populni pravilniya DATABASE_URL!
) else (
    echo.
    echo Suzdavam .env fail...
    (
        echo # Database Configuration
        echo DATABASE_URL=%db_url%
        echo.
        echo # Port ^(optsionalno, po podrazbirane e 3000^)
        echo PORT=3000
    ) > .env
    echo.
    echo OK .env failat e suzdan!
)

echo.
echo Sledvashta stupka: Redaktirai .env faila i uveri se che DATABASE_URL e pravilen!
echo.
pause

