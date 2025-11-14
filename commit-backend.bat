@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo.
echo ========================================
echo   Commit Backend към GitHub
echo ========================================
echo.

REM Отиване в backend-only директорията
cd backend-only

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

REM Добавяне на всички файлове
echo [INFO] Добавям файлове...
git add .
echo.

REM Винаги правим commit (с --allow-empty и --no-verify)
set /p COMMIT_MSG="Въведи commit message (или Enter за 'Update backend'): "
if "!COMMIT_MSG!"=="" set COMMIT_MSG=Update backend

echo [INFO] Правим commit...
git commit --no-verify --allow-empty -m "!COMMIT_MSG!"
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
git push -u origin main

if errorlevel 1 (
    echo.
    echo [ERROR] Има проблем с push-а!
    echo.
    echo Възможни причини:
    echo 1. Трябва да си логнат в GitHub (използвай Personal Access Token)
    echo 2. Repository URL-а е неправилен
    echo 3. Нямаш права за write в repository-то
    echo 4. Remote 'origin' не е настроен правилно
    echo.
    echo Текущ remote:
    git remote -v
    echo.
    echo Опитай ръчно:
    echo   git remote remove origin
    echo   git remote add origin https://github.com/ИМЕ/REPO.git
    echo   git push -u origin main
) else (
    echo.
    echo [SUCCESS] Готово! Backend-ът е качен в GitHub!
)

echo.
cd ..
pause

