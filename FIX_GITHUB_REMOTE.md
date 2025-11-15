# 🔧 Поправка на GitHub Remote URL

## Проблем

Remote URL-ът в `backend-only/` е грешен:
- ❌ Грешно: `https://gitub.com/userite.mamafood` (липсва "h" и ".git")
- ✅ Правилно: `https://github.com/userite/mamafood.git`

## Решение

### Стъпка 1: Поправи remote URL-а

Отвори Command Prompt или PowerShell в `backend-only/` директорията:

```batch
cd backend-only
git remote set-url origin https://github.com/userite/mamafood.git
```

### Стъпка 2: Провери

```batch
git remote -v
```

Трябва да видиш:
```
origin  https://github.com/userite/mamafood.git (fetch)
origin  https://github.com/userite/mamafood.git (push)
```

### Стъпка 3: Опитай отново

```batch
commit-backend.bat
```

---

## Ако все още има SSL проблем

Ако виждаш "SSL certificate problem", опитай:

### Вариант 1: Изключи SSL проверка (само за тестване)

```batch
cd backend-only
git config http.sslVerify false
git push -u origin main
```

**⚠️ Внимание**: Това не е безопасно за production! Използвай само за тестване.

### Вариант 2: Използвай SSH вместо HTTPS

```batch
cd backend-only
git remote set-url origin git@github.com:userite/mamafood.git
git push -u origin main
```

**Изисква**: SSH ключ настроен в GitHub.

### Вариант 3: Използвай Personal Access Token

1. Създай Personal Access Token: https://github.com/settings/tokens
2. При push, когато поиска парола, използвай token-а вместо парола

---

## Проверка след поправка

След като поправиш URL-а, опитай отново:

```batch
commit-backend.bat
```

Ако все още има проблем, провери:
1. Дали repository-то съществува: https://github.com/userite/mamafood
2. Дали имаш права за write
3. Дали си логнат в GitHub (използвай Personal Access Token)

