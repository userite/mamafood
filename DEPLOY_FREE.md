# 🆓 Безплатен деплой (без кредитна карта!)

Heroku изисква payment method. Ето **наистина безплатни** алтернативи:

---

## 🎯 Препоръка #1: Railway.app (НАЙ-ЛЕСНО)

### ✅ Преимущества:
- 100% безплатно (500 часа/месец)
- НЕ изисква payment method
- Автоматичен HTTPS
- Много лесно да се използва

### 📋 Стъпки:

#### 1. Създай акаунт
- Отиди на: https://railway.app
- Натисни **"Start a New Project"**
- Влез с **GitHub** (най-лесно) или email

#### 2. Деплой

**Вариант A: От GitHub**
1. В Railway Dashboard, натисни **"New Project"**
2. Избери **"Deploy from GitHub repo"**
3. Ако нямаш GitHub repo:
   - Създай на https://github.com
   - Качи САМО `backend-only/` файловете:
     - `server.js`
     - `package.json`
     - `Procfile`
     - `README.md` (опционално)
4. Railway автоматично разпознава Node.js
5. Готово! 🎉

**Вариант B: От файлове (ако нямаш GitHub)**
1. В Railway Dashboard, натисни **"New Project"**
2. Избери **"Empty Project"**
3. Натисни **"Add Service"** → **"GitHub Repo"** или **"Empty Service"**
4. Качи файловете чрез drag-and-drop или Railway CLI

#### 3. Конфигурирай Environment Variables

В Railway Dashboard:
1. Отвори твоето приложение
2. Отиди на **"Variables"** tab
3. Добави:
   ```
   DB_HOST=78.142.63.8
   DB_USER=inex_mamafood_user
   DB_PASSWORD=Parola_123!@#
   DB_NAME=inex_deklarado
   NODE_ENV=production
   ```

#### 4. Запиши URL

Railway автоматично дава URL като:
- `https://mamafood-production.up.railway.app`

Копирай го!

---

## 🎯 Препоръка #2: Render.com

### ✅ Преимущества:
- Безплатно за малки приложения
- Лесно използване
- Автоматичен HTTPS

### 📋 Стъпки:

#### 1. Създай акаунт
- Отиди на: https://render.com
- Влез с GitHub или email

#### 2. Деплой
1. **"New +"** → **"Web Service"**
2. Connect to GitHub → избери repository
3. Settings:
   - **Name:** `mamafood-api`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free (Spark)
4. Натисни **"Create Web Service"**

#### 3. Environment Variables
- Settings → **"Environment"**
- Добави:
  ```
  DB_HOST=78.142.63.8
  DB_USER=inex_mamafood_user
  DB_PASSWORD=Parola_123!@#
  DB_NAME=inex_deklarado
  NODE_ENV=production
  ```

#### 4. Запиши URL
- Render дава: `https://mamafood-api.onrender.com`

---

## 🎯 Препоръка #3: Fly.io

### ✅ Преимущества:
- Безплатно за малки приложения
- Много бързо
- Global distribution

### 📋 Стъпки:

#### 1. Инсталирай Fly.io CLI
```powershell
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

#### 2. Логни се
```powershell
fly auth login
```

#### 3. Създай приложение
В `backend-only/` директорията:
```powershell
fly launch
```

Отговори на въпросите:
- App name: `mamafood-api` (или автоматично)
- Region: `fra` (Frankfurt, близо до България) или `iad` (Virginia)

#### 4. Конфигурирай
```powershell
fly secrets set DB_HOST=78.142.63.8
fly secrets set DB_USER=inex_mamafood_user
fly secrets set DB_PASSWORD=Parola_123!@#
fly secrets set DB_NAME=inex_deklarado
fly secrets set NODE_ENV=production
```

#### 5. Деплой
```powershell
fly deploy
```

#### 6. Запиши URL
Fly дава: `https://mamafood-api.fly.dev`

---

## 📝 След като деплоиш backend:

### 1. Промени frontend

В `app.js`, намери (около ред 170):
```javascript
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://ТВОЯТ-BACKEND-URL';
```

Промени на:
```javascript
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://mamafood-production.up.railway.app';  // <-- ТУК твоят URL!
```

### 2. Качи frontend на pci.inex-project.net

Чрез FTP качи:
- ✅ `index.html`
- ✅ `app.js` (вече с правилния API_BASE)
- ✅ `styles.css`
- ✅ `i18n.js`
- ✅ `manifest.json`
- ✅ `service-worker.js`

### 3. Тествай!

Отвори: `https://pci.inex-project.net/mamafood/`

---

## 🎯 Сравнение:

| Хостинг | Безплатно | Платежен метод | Лесно | Рекомендация |
|---------|-----------|----------------|-------|--------------|
| **Railway** | ✅ 500ч/месец | ❌ НЕ | ⭐⭐⭐⭐⭐ | 🏆 **НАЙ-ДОБРО** |
| **Render** | ✅ Да | ❌ НЕ | ⭐⭐⭐⭐ | ✅ Много добро |
| **Fly.io** | ✅ Да | ❌ НЕ | ⭐⭐⭐ | ✅ Добро |
| ~~Heroku~~ | ❌ Не | ✅ ДА | - | ❌ НЕ РАБОТИ |

---

## 💡 МОЯТА ПРЕПОРЪКА:

**Използвай Railway.app!**

1. Най-лесно е
2. 100% безплатно
3. Няма нужда от payment method
4. Автоматично HTTPS
5. Автоматично разпознава Node.js

---

## 🆘 Ако имаш проблеми:

### Railway не работи?
→ Опитай Render.com - също е много лесно!

### Render не работи?
→ Опитай Fly.io - повече настройки, но безплатно!

### Никой не работи?
→ Кажи ми и ще помагам! 😊

---

**Готово! С Railway ще ти отнеме точно 5 минути!** 🚀




