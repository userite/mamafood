@echo off
REM === MamaFood Auto Commit & Push Script ===

cd /d "C:\tmp\OMNIMED_manus\1\2\server"

REM --- синхронизация с GitHub ---
git fetch origin main
git pull origin main

REM --- добавяне и push ---
git add -A
git commit -m "Auto update: %date% %time%"
git push origin main

echo.
echo ✅ MamaFood pushed successfully to GitHub.
pause



rem ---------------------------- cursor 14.11.2025
Създадени/актуализирани файлове:
start-backend.bat — актуализиран
Работи с backend-only/ директорията
Използва server_pg.js (PostgreSQL версия)
По-добра обработка на грешки
start-frontend.bat — актуализиран
По-добра проверка на файлове
Добавен cache-busting флаг (-c-1)
deploy-frontend.bat — нов файл
Качва frontend файловете чрез curl/FTP
Поддържа алтернативни директории
Изисква конфигуриране на FTP credentials
app_v2.js — актуализиран
Променен getAPIBase() да използва Render.com URL когато е на pci.inex-project.net
Добавени коментари за промяна на URL
DEPLOY_BG.md — нов файл
Кратко ръководство на български
Стъпки за deployment
DEPLOY_INSTRUCTIONS.md — нов файл
Подробни инструкции на английски
Troubleshooting секция
README_BAT_FILES.md — нов файл
Описание на всеки BAT файл
Как да се използват
Какво трябва да направиш:
Конфигурирай deploy-frontend.bat:
Отвори файла
Промени FTP_USER и FTP_PASS с твоите credentials
Промени FTP_DIR според структурата на сървъра
Промени Render.com URL в app_v2.js:
Отвори app_v2.js
Намери getAPIBase() (около ред 540)
Замени mamafood-backend.onrender.com с твоя действителен Render.com URL
За backend на Render.com:
Следвай инструкциите в DEPLOY_BG.md
Push-ни кода в GitHub
Render.com автоматично ще deploy-не
Всичко е готово за използване. Пусни start-backend.bat и start-frontend.bat за локално тестване, и deploy-frontend.bat за качване на production.