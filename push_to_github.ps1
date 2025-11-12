# 🚀 Автоматично качване на проект в GitHub
# Използване: .\push_to_github.ps1

Write-Host "🚀 GitHub Upload Script" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# Проверка за Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git не е инсталиран!" -ForegroundColor Red
    Write-Host "Инсталирай от: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Проверка дали вече има Git repository
if (Test-Path ".git") {
    Write-Host "⚠️  Вече има Git repository!" -ForegroundColor Yellow
    $continue = Read-Host "Искаш ли да продължиш? (y/n)"
    if ($continue -ne "y") {
        exit 0
    }
} else {
    # Инициализирай Git
    Write-Host "📦 Инициализиране на Git..." -ForegroundColor Green
    git init
}

# Проверка за remote
$hasRemote = git remote -v 2>$null
if (-not $hasRemote) {
    Write-Host ""
    Write-Host "🔗 Трябва да свържеш с GitHub repository!" -ForegroundColor Yellow
    Write-Host ""
    $repoUrl = Read-Host "Въведи GitHub URL (например: https://github.com/ИМЕ/REPO.git)"
    
    if ($repoUrl) {
        Write-Host "Добавям remote..." -ForegroundColor Green
        git remote add origin $repoUrl
    } else {
        Write-Host "❌ Трябва да въведеш URL!" -ForegroundColor Red
        exit 1
    }
}

# Добави файлове
Write-Host ""
Write-Host "📁 Добавям файлове..." -ForegroundColor Green
git add .

# Проверка за промени
$status = git status --porcelain
if (-not $status) {
    Write-Host "✅ Няма промени за commit!" -ForegroundColor Yellow
    exit 0
}

# Commit
Write-Host ""
$commitMessage = Read-Host "Въведи commit message (или Enter за 'Update project')"
if (-not $commitMessage) {
    $commitMessage = "Update project"
}

Write-Host "💾 Правим commit..." -ForegroundColor Green
git commit -m $commitMessage

# Push
Write-Host ""
Write-Host "🚀 Качвам в GitHub..." -ForegroundColor Green
Write-Host ""

# Опитай да създадеш main branch ако не съществува
$currentBranch = git branch --show-current 2>$null
if (-not $currentBranch) {
    git branch -M main 2>$null
}

# Push
git push -u origin main 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Готово! Проектът е качен в GitHub!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Има проблем с push-а!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Възможни причини:" -ForegroundColor Yellow
    Write-Host "1. Трябва да си логнат в GitHub (използвай Personal Access Token)" -ForegroundColor Yellow
    Write-Host "2. Repository URL-а е неправилен" -ForegroundColor Yellow
    Write-Host "3. Нямаш права за write в repository-то" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Опитай ръчно:" -ForegroundColor Cyan
    Write-Host "  git push -u origin main" -ForegroundColor White
}

Write-Host ""













