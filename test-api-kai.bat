@echo off
chcp 65001 >nul
echo ========================================
echo   Тест на API за код KAI
echo ========================================
echo.

echo [INFO] Тестване на API endpoint за код KAI...
echo.

REM Тест 1: Health check
echo [TEST 1] Health check...
curl -s http://localhost:3000/api/health
echo.
echo.

REM Тест 2: Записи за KAI
echo [TEST 2] Записи за код KAI...
curl -s http://localhost:3000/api/records/KAI
echo.
echo.

REM Тест 3: Записи за kai (малки букви)
echo [TEST 3] Записи за код kai (малки букви)...
curl -s http://localhost:3000/api/records/kai
echo.
echo.

REM Тест 4: Всички налични кодове (ако има такъв endpoint)
echo [TEST 4] Проверка на всички кодове в базата...
echo (Това изисква допълнителен endpoint)
echo.

echo [INFO] Провери конзолата на backend сървъра за подробна информация!
echo.

pause

