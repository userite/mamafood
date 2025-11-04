# 🚀 Стъпка по стъпка: Деплой на Heroku

## Предварителни изисквания

1. ✅ Heroku акаунт (вече имаш)
2. ✅ Heroku CLI (трябва да инсталираш)
3. ✅ Git (вече имаш на Windows)

---

## Стъпка 1: Инсталирай Heroku CLI

### Windows:

1. Отиди на: https://devcenter.heroku.com/articles/heroku-cli
2. Изтегли "Windows Installer"
3. Инсталирай
4. Рестартирай PowerShell/Command Prompt

### Проверка:

```powershell
heroku --version
```

Трябва да изпише версия на Heroku CLI.

---

## Стъпка 2: Логни се в Heroku

```powershell
heroku login
```

Ще се отвори браузър → логин в Heroku → натисни "Log in"

---

## Стъпка 3: Подготовка на backend

```powershell
cd backend-only
```

Провери че имаш файловете:
- ✅ `server.js`
- ✅ `package.json`
- ✅ `Procfile`

---

## Стъпка 4: Инициализирай Git (ако не е направено)

```powershell
git init
git add .
git commit -m "Initial Heroku deploy"
```

---

## Стъпка 5: Създай Heroku приложение

```powershell
heroku create mamafood-api
```

**Или за автоматично име:**
```powershell
heroku create
```

Heroku ще даде URL като: `https://mamafood-api.herokuapp.com`

---

## Стъпка 6: Конфигурирай Environment Variables

```powershell
heroku config:set DB_HOST=78.142.63.8
heroku config:set DB_USER=inex_mamafood_user
heroku config:set DB_PASSWORD=Parola_123!@#
heroku config:set DB_NAME=inex_deklarado
heroku config:set NODE_ENV=production
```

**Или всички наведнъж:**
```powershell
heroku config:set DB_HOST=78.142.63.8 DB_USER=inex_mamafood_user DB_PASSWORD=Parola_123!@# DB_NAME=inex_deklarado NODE_ENV=production
```

---

## Стъпка 7: Деплой

```powershell
git push heroku main
```

Изчакай да приключи (1-2 минути).

---

## Стъпка 8: Проверка

```powershell
heroku ps:scale web=1
heroku logs --tail
```

Провери логовете - трябва да видиш:
```
🚀 МАМАФООД Backend API running on port...
📊 Database: inex_deklarado on 78.142.63.8
```

---

## Стъпка 9: Запиши URL

```powershell
heroku info
```

Запиши "Web URL" - това е твоят backend адрес!

Или просто отиди на `https://mamafood-api.herokuapp.com/api/health` - трябва да върне `{"status":"ok"}`

---

## Стъпка 10: Обнови frontend

В `app.js`, ред 170, промени:
```javascript
: 'https://ТВОЯТ-BACKEND-URL.herokuapp.com';
```

На твоя Heroku URL (напр. `https://mamafood-api.herokuapp.com`)

---

## Алтернатива: Автоматичен скрипт

Изпълни `deploy_heroku.ps1`:
```powershell
.\deploy_heroku.ps1
```

Скриптът ще направи всичко автоматично!

---

## След деплоя: Управление

```powershell
# Виж логове
heroku logs --tail

# Рестартирай
heroku restart

# Виж статус
heroku ps

# Виж конфигурация
heroku config

# Виж информация
heroku info
```

---

## Често срещани проблеми

### "Command not found: heroku"
**Решение:** Инсталирай Heroku CLI или рестартирай терминала

### "Git not initialized"
**Решение:** `git init` в `backend-only/` директорията

### "Permission denied"
**Решение:** Провери че си логнат: `heroku login`

### "Build failed"
**Решение:** Провери `package.json` - трябва да има `"start": "node server.js"`

---

## Готово! 🎉

След като backend е на Heroku:
1. Запиши URL (напр. `https://mamafood-api.herokuapp.com`)
2. Промени `API_BASE` в `app.js`
3. Качи frontend файловете на pci.inex-project.net
4. Тествай!

---

## Полезни команди

```powershell
# Виж всички приложения
heroku apps

# Виж логове в реално време
heroku logs --tail --app mamafood-api

# Рестартирай приложението
heroku restart --app mamafood-api

# Виж environment variables
heroku config --app mamafood-api
```

---

**Следвай тези стъпки и ще е готово!** 🚀




