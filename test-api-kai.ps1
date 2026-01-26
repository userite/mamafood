# Тест на API за код KAI
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Тест на API за код KAI" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Промени този URL според твоя Render.com backend URL
$API_URL = "https://mamafood.onrender.com"

Write-Host "Тестване на Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/health" -Method Get
    Write-Host "✅ Health Check OK:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Health Check Failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
Write-Host ""

Write-Host "Тестване на API за код KAI..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/records/KAI" -Method Get
    Write-Host "✅ Records за KAI:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Грешка при заявка за records:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody"
    }
}
Write-Host ""

Write-Host "Тестване на Children API за код KAI..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/children/KAI" -Method Get
    Write-Host "✅ Child info за KAI:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Грешка при заявка за children:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Ако виждаш грешки, провери:" -ForegroundColor Yellow
Write-Host "1. URL-ът е правилен: $API_URL" -ForegroundColor Yellow
Write-Host "2. Render.com service е активен" -ForegroundColor Yellow
Write-Host "3. Провери Logs в Render.com Dashboard" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan

