@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo.
echo ========================================
echo   GitHub Commit и Push
echo   MAMAFOOD Project
echo ========================================
echo.

REM Проверка дали Git е инсталиран
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git не е инсталиран!
    echo Инсталирай от: https://git-scm.com/download/win
    pause
    exit /b 1
)

REM Проверка дали сме в git repository
if not exist ".git" (
    echo [INFO] Инициализиране на Git repository...
    git init
    echo.
)

REM Проверка за remote
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Няма настроен remote repository!
    echo.
    set /p REPO_URL="Въведи GitHub URL (например: https://github.com/ИМЕ/REPO.git): "
    if "!REPO_URL!"=="" (
        echo [ERROR] Трябва да въведеш URL!
        pause
        exit /b 1
    )
    git remote add origin !REPO_URL!
    echo [OK] Remote добавено: !REPO_URL!
    echo.
) else (
    echo [INFO] Remote repository: 
    git remote get-url origin
    echo.
)

REM Показване на статуса
echo [INFO] Текущ статус:
git status --short
echo.

REM Проверка дали има промени
git diff --quiet && git diff --cached --quiet
if errorlevel 1 (
    REM Има промени, продължаваме
) else (
    echo [INFO] Няма промени за commit!
    echo.
    set /p CONTINUE="Искаш ли да направиш commit все пак? (Y/N): "
    if /i not "!CONTINUE!"=="Y" (
        echo [INFO] Отменено.
        pause
        exit /b 0
    )
)

REM Добавяне на всички файлове
echo [INFO] Добавям файлове...
git add .
echo.

REM Въвеждане на commit message
set /p COMMIT_MSG="Въведи commit message (или Enter за 'Update'): "
if "!COMMIT_MSG!"=="" set COMMIT_MSG=Update

echo [INFO] Правим commit...
git commit -m "!COMMIT_MSG!"
echo.

REM Проверка за текущ branch
git branch --show-current >nul 2>&1
if errorlevel 1 (
    git branch -M main
)

REM Проверка дали origin съществува преди push
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Remote 'origin' не е настроен!
    echo.
    set /p REPO_URL="Въведи GitHub URL за remote (например: https://github.com/ИМЕ/REPO.git): "
    if "!REPO_URL!"=="" (
        echo [ERROR] Трябва да въведеш URL!
        pause
        exit /b 1
    )
    git remote add origin !REPO_URL!
    echo [OK] Remote добавено: !REPO_URL!
    echo.
)

REM Push към GitHub
echo [INFO] Качвам в GitHub...
set CURRENT_BRANCH=main
git branch --show-current >nul 2>&1
if not errorlevel 1 (
    for /f "delims=" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
)

git push -u origin !CURRENT_BRANCH!

if errorlevel 1 (
    echo.
    echo [ERROR] Има проблем с push-а!
    echo.
    echo Възможни причини:
    echo 1. Трябва да си логнат в GitHub (използвай Personal Access Token)
    echo 2. Repository URL-а е неправилен
    echo 3. Нямаш права за write в repository-то
    echo 4. Remote 'origin' не е настроен правилно
    echo 5. Трябва да направиш pull първо (git pull origin !CURRENT_BRANCH!)
    echo.
    echo Текущ remote:
    git remote -v
    echo.
    echo Текущ branch: !CURRENT_BRANCH!
    echo.
    echo Опитай ръчно:
    echo   git pull origin !CURRENT_BRANCH!
    echo   git push -u origin !CURRENT_BRANCH!
) else (
    echo.
    echo [SUCCESS] Готово! Промените са качени в GitHub!
    echo.
    echo [INFO] Провери на: 
    git remote get-url origin
)

echo.
pause
