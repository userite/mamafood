# ⚡ Бърз деплой (БЕЗПЛАТНО!)

⚠️ **Heroku вече изисква payment method!** Използвай Railway вместо това - **100% безплатно** и по-лесно!

📖 **Пълна инструкция:** Виж `DEPLOY_FREE.md`

---

## ✅ Това вече е направено:
- ✅ Git repository инициализиран в `backend-only/`
- ✅ Всички файлове са commit-нати
- ✅ Готови за деплой!

---

## 📝 Това трябва да направиш:

### 🎯 Вариант 1: Railway.app (ПРЕПОРЪЧВАМ!)

1. Отиди на: https://railway.app
2. Sign up с GitHub (най-лесно)
3. "New Project" → "Deploy from GitHub repo"
4. Избери repository с `backend-only/` файловете
5. Settings → Variables → добави:
   - `DB_HOST=78.142.63.8`
   - `DB_USER=inex_mamafood_user`
   - `DB_PASSWORD=Parola_123!@#`
   - `DB_NAME=inex_deklarado`
   - `NODE_ENV=production`
6. Запиши URL (като `https://xxx.up.railway.app`)
7. Готово! 🎉

### 🎯 Вариант 2: Render.com

1. Отиди на: https://render.com
2. Sign up
3. "New +" → "Web Service"
4. Connect to GitHub
5. Настройки: Build=`npm install`, Start=`node server.js`
6. Environment Variables (същите като по-горе)
7. Готово!

---

## 📝 Старият Heroku метод (ако искаш):

### 1. Инсталирай Heroku CLI

**Windows:**
1. Отиди на: https://devcenter.heroku.com/articles/heroku-cli
2. Изтегли "Windows Installer" (64-bit)
3. Инсталирай
4. **Рестартирай PowerShell!**

### 2. Изпълни командите

**Отвори PowerShell в `backend-only/` директорията и изпълни:**

```powershell
# 1. Логни се (ще отвори браузър)
heroku login

# 2. Създай приложение
heroku create mamafood-api

# 3. Конфигурирай database (5 команди)
heroku config:set DB_HOST=78.142.63.8
heroku config:set DB_USER=inex_mamafood_user
heroku config:set DB_PASSWORD=Parola_123!@#
heroku config:set DB_NAME=inex_deklarado
heroku config:set NODE_ENV=production

# 4. Деплой!
git push heroku master

# 5. Проверка
heroku info
```

### 3. Запиши URL

След `heroku info`, запиши "Web URL" - това е твоят backend адрес!

Или провери в браузъра:
`https://mamafood-api.herokuapp.com/api/health`

Трябва да видиш: `{"status":"ok","timestamp":"..."}`

---

## После деплоя:

### 1. Промени frontend

В `app.js`, ред 170, смени:
```javascript
: 'https://ТВОЯТ-BACKEND-URL.herokuapp.com';
```

На твоя Heroku URL!

### 2. Качи frontend на pci.inex-project.net

Чрез FTP качи:
- `index.html`
- `app.js` (вече с правилния API_BASE)
- `styles.css`
- `i18n.js`
- `manifest.json`
- `service-worker.js`

---

## Често срещани грешки:

### "heroku: command not found"
**Решение:** Инсталирай Heroku CLI и рестартирай PowerShell

### "No git repository found"
**Решение:** Отиди в `backend-only/` директорията

### "remote heroku already exists"
**Решение:** Продължи напред, приложението вече съществува

---

## Полезни команди след деплоя:

```powershell
# Виж логове
heroku logs --tail

# Рестартирай
heroku restart

# Виж status
heroku ps

# Виж конфигурация
heroku config
```

---

**Готово! След като инсталираш Heroku CLI, изпълни командите по-горе и ще е готово!** 🚀

