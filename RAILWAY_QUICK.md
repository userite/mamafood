# 🚂 Railway.app - Бърз деплой (5 минути)

## ✅ Защо Railway?

- ✅ 100% безплатно (500 часа/месец)
- ✅ НЕ изисква payment method/кредитна карта
- ✅ Автоматично HTTPS
- ✅ Автоматично разпознава Node.js
- ✅ Лесно и интуитивно

---

## 📋 Стъпки:

### 1. Създай GitHub Repository (ако нямаш)

Ако вече имаш GitHub repository с `backend-only/` файловете, пропусни тази стъпка.

Ако нямаш:
1. Отиди на: https://github.com
2. Sign up (ако нямаш акаунт)
3. "New repository"
4. Име: `mamafood-backend`
5. Public или Private
6. НЕ създавай README/GitIgnore/License
7. Натисни "Create repository"

### 2. Качи файловете на GitHub

В `backend-only/` директорията:

```powershell
# Ако няма git init
git init
git add .
git commit -m "Initial commit"

# Добави remote (ЗАМЕНИ 'username' с твоя GitHub username)
git remote add origin https://github.com/username/mamafood-backend.git

# Push
git branch -M main
git push -u origin main
```

**Или качи файловете през браузъра:**
1. В GitHub repository
2. "uploading an existing file"
3. Качи: `server.js`, `package.json`, `Procfile`

### 3. Създай Railway акаунт

1. Отиди на: https://railway.app
2. Натисни **"Start a New Project"**
3. Влез с **"Continue with GitHub"**
4. Разреши достъп до GitHub repositories

### 4. Деплой на Railway

1. В Railway Dashboard:
   - Натисни **"New Project"**
   - Избери **"Deploy from GitHub repo"**
   - Избери твоето repository: `mamafood-backend`

2. Railway автоматично:
   - Разпознава Node.js
   - Инсталира зависимости (`npm install`)
   - Стартира (`node server.js`)
   - Създава HTTPS URL

3. Изчакай 1-2 минути за деплой

### 5. Конфигурирай Environment Variables

1. В Railway Dashboard, отвори твоето приложение
2. Отиди на **"Variables"** tab
3. Натисни **"New Variable"**
4. Добави един по един:

   ```
   DB_HOST = 78.142.63.8
   DB_USER = inex_mamafood_user
   DB_PASSWORD = Parola_123!@#
   DB_NAME = inex_deklarado
   NODE_ENV = production
   ```

5. Railway автоматично рестартира приложението

### 6. Запиши URL

1. В Railway Dashboard, отиди на **"Settings"** tab
2. Скрол до **"Domains"**
3. Намери **"Generated Domain"**
4. Копирай URL (напр. `https://mamafood-production.up.railway.app`)
5. Натисни **"Generate Domain"** ако няма такъв

---

## ✅ Тествай backend

Отвори в браузър твоя Railway URL:
```
https://твоят-url.up.railway.app/api/health
```

Трябва да видиш:
```json
{"status":"ok","timestamp":"..."}
```

Ако работи - **готово!** 🎉

---

## 🔄 Следващи стъпки

### 1. Промени frontend

В `app.js` (не в backend-only, а в главната директория):

Намери (около ред 170):
```javascript
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://ТВОЯТ-BACKEND-URL';
```

Промени на:
```javascript
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://твоят-railway-url.up.railway.app';  // <-- ЗАМЕНИ ТУК!
```

### 2. Качи frontend на pci.inex-project.net

Чрез FTP качи:
- `index.html`
- `app.js` (вече с Railway URL)
- `styles.css`
- `i18n.js`
- `manifest.json`
- `service-worker.js`

---

## 🆘 Проблеми?

### Railway не вижда Node.js?
- Провери че имаш `package.json` в repository
- Провери че в `package.json` има `"main": "server.js"` или `"start"` script

### Database connection failed?
- Провери environment variables
- Провери дали MySQL сървърът (78.142.63.8) позволява връзки от Railway

### Не мога да push-на на GitHub?
- Използвай GitHub Desktop или качи файловете през браузъра

---

**Готово! Railway е най-лесният начин за деплой!** 🚂




