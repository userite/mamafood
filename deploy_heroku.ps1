# PowerShell скрипт за деплой на Heroku
# Изпълни тези команди една по една в PowerShell

Write-Host "🚀 Деплой на Heroku - Стъпка по стъпка" -ForegroundColor Green
Write-Host ""

# Проверка за Heroku CLI
Write-Host "1. Проверявам дали Heroku CLI е инсталиран..."
try {
    $herokuVersion = heroku --version
    Write-Host "✅ Heroku CLI е инсталиран: $herokuVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Heroku CLI НЕ е инсталиран!" -ForegroundColor Red
    Write-Host "   Инсталирай от: https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "2. Проверявам дали си логнат..."
heroku login

Write-Host ""
Write-Host "3. Преминавам в backend-only директория..."
Set-Location backend-only

Write-Host ""
Write-Host "4. Инициализирам Git (ако не е направено)..."
if (-Not (Test-Path .git)) {
    git init
    Write-Host "✅ Git инициализиран" -ForegroundColor Green
} else {
    Write-Host "✅ Git вече инициализиран" -ForegroundColor Green
}

Write-Host ""
Write-Host "5. Добавям файловете..."
git add .
git commit -m "Initial Heroku deploy"

Write-Host ""
Write-Host "6. Създавам Heroku app..."
Write-Host "   ВНИМАНИЕ: Избери уникално име (напр. mamafood-api-твоето-име)" -ForegroundColor Yellow
$appName = Read-Host "Въведи име за Heroku app (или натисни Enter за автоматично)"
if ([string]::IsNullOrWhiteSpace($appName)) {
    heroku create
    $appName = (heroku apps:info | Select-String "Name:" | ForEach-Object { $_.Line -replace '.*Name:\s+', '' }).Trim()
} else {
    heroku create $appName
}

Write-Host ""
Write-Host "7. Конфигурирам environment variables..."
heroku config:set DB_HOST=78.142.63.8
heroku config:set DB_USER=inex_mamafood_user
heroku config:set DB_PASSWORD=Parola_123!@#
heroku config:set DB_NAME=inex_deklarado
heroku config:set NODE_ENV=production

Write-Host ""
Write-Host "8. Деплоявам на Heroku..."
git push heroku main

Write-Host ""
Write-Host "9. Проверявам статуса..."
heroku ps:scale web=1

Write-Host ""
Write-Host "10. Получавам URL..."
$appUrl = heroku info | Select-String "Web URL" | ForEach-Object { $_.Line -replace '.*Web URL:\s+', '' }
Write-Host ""
Write-Host "✅ Деплоят е готов!" -ForegroundColor Green
Write-Host "🌐 Backend URL: $appUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "ВАЖНО: Запиши този URL и го промени в app.js!" -ForegroundColor Yellow
Write-Host "Намери реда с API_BASE и смени на: $appUrl" -ForegroundColor Yellow

Set-Location ..




