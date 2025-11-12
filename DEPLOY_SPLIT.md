# 🚀 Инструкция за разделено разположение

## Frontend на pci.inex-project.net + Backend на Heroku/Railway

### Вариант A: Backend на Heroku (Безплатно)

#### Стъп 1: Подготовка на backend

1. **Създай GitHub repository:**
   - Създай акаунт на https://github.com
   - Създай нов repository (напр. `mamafood-backend`)
   - Качи САМО backend файловете:
     - ✅ `server.js`
     - ✅ `package.json`
     - ✅ `Procfile`
     - ❌ НЕ качвай `index.html`, `app.js`, `styles.css` (те са frontend)

2. **Създай Heroku акаунт:**
   - Отиди на https://www.heroku.com
   - Създай безплатен акаунт

3. **Деплой на Heroku:**
   - Инсталирай Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
   - Или използвай GitHub интеграция в Heroku dashboard

**Чрез Heroku CLI:**
```bash
# Локално на твоята машина
cd mamafood-backend  # Директория само с backend файловете
heroku login
heroku create mamafood-api  # Създава приложение
git init
git add .
git commit -m "Initial commit"
git push heroku main

# Конфигурирай environment variables
heroku config:set DB_HOST=78.142.63.8
heroku config:set DB_USER=inex_mamafood_user
heroku config:set DB_PASSWORD=Parola_123!@#
heroku config:set DB_NAME=inex_deklarado
```

**Чрез Heroku Dashboard:**
1. Отиди на https://dashboard.heroku.com
2. "New" → "Create new app"
3. Име: `mamafood-api`
4. Connect to GitHub → избери repository
5. "Deploy Branch"
6. Settings → Config Vars → добави:
   - `DB_HOST=78.142.63.8`
   - `DB_USER=inex_mamafood_user`
   - `DB_PASSWORD=Parola_123!@#`
   - `DB_NAME=inex_deklarado`

**Твоят backend URL ще бъде:** `https://mamafood-api.herokuapp.com`

#### Стъп 2: Конфигуриране на frontend

**Промени `app.js`:**

Намери:
```javascript
const API_BASE = window.location.origin;
```

Промени на:
```javascript
// Production: използвай Heroku backend
const API_BASE = 'https://mamafood-api.herokuapp.com';
// Development fallback:
// const API_BASE = window.location.origin;
```

#### Стъп 3: Качи frontend на pci.inex-project.net

**Чрез FTP:**

1. Качи САМО frontend файловете:
   - ✅ `index.html`
   - ✅ `app.js` (вече с Heroku URL)
   - ✅ `styles.css`
   - ✅ `i18n.js`
   - ✅ `manifest.json`
   - ✅ `service-worker.js`
   - ❌ НЕ качи `server.js`, `package.json`

2. Качи в `/public_html/` или `/public_html/mamafood/`

3. Отвори: `https://pci.inex-project.net/mamafood/` (или както е настроено)

---

### Вариант B: Backend на Railway (Безплатно, по-лесно)

Railway е по-просто от Heroku.

#### Стъп 1: Подготовка

1. **Създай Railway акаунт:**
   - https://railway.app
   - Влез с GitHub

2. **Деплой:**
   - "New Project" → "Deploy from GitHub repo"
   - Избери repository с backend файловете
   - Railway автоматично ще разпознае Node.js

3. **Конфигурирай Environment Variables:**
   - Settings → Variables
   - Добави:
     - `DB_HOST=78.142.63.8`
     - `DB_USER=inex_mamafood_user`
     - `DB_PASSWORD=Parola_123!@#`
     - `DB_NAME=inex_deklarado`

**Railway автоматично дава HTTPS URL!**

4. **Обнови frontend:**
   - В `app.js`, промени `API_BASE` на Railway URL
   - Качи на pci.inex-project.net

---

### Вариант C: Backend на Render (Безплатно)

#### Стъп 1: Подготовка

1. **Създай Render акаунт:**
   - https://render.com
   - Влез с GitHub

2. **Създай Web Service:**
   - "New" → "Web Service"
   - Connect GitHub repository
   - Настройки:
     - **Build Command:** `npm install`
     - **Start Command:** `node server.js`
     - **Environment:** `Node`

3. **Environment Variables:**
   - Environment → Add Environment Variable
   - Добави същите променливи като по-горе

**Render дава безплатен HTTPS URL!**

---

## Структура на файлове

### Frontend (качи на pci.inex-project.net):
```
public_html/mamafood/
├── index.html
├── app.js          (с API_BASE = 'https://твоят-backend-url.com')
├── styles.css
├── i18n.js
├── manifest.json
├── service-worker.js
└── .htaccess
```

### Backend (качи на Heroku/Railway/Render):
```
mamafood-backend/
├── server.js
├── package.json
└── Procfile         (за Heroku)
```

---

## Модификация на server.js за CORS

Важно: Backend трябва да позволява достъп от pci.inex-project.net

**Провери в `server.js`:**
```javascript
app.use(cors({
    origin: [
        'https://pci.inex-project.net',
        'http://pci.inex-project.net',
        'http://localhost:3000'  // за локално тестване
    ],
    credentials: true
}));
```

Или за всички домейни (по-леко за тестване):
```javascript
app.use(cors());  // Позволява всички домейни
```

---

## Стъпки за деплой (кратко)

### Backend:
1. Качи на GitHub
2. Деплой на Heroku/Railway/Render
3. Конфигурирай environment variables
4. Запиши backend URL

### Frontend:
1. Промени `API_BASE` в `app.js` на backend URL
2. Качи frontend файловете на pci.inex-project.net чрез FTP
3. Тествай!

---

## Тестване

1. **Отвори:** `https://pci.inex-project.net/mamafood/`
2. **Провери конзолата (F12):**
   - Не трябва да има CORS грешки
   - API заявките трябва да отиват към backend URL
3. **Тествай:** Добави запис, редактирай, изтрий

---

## Често срещани проблеми

### CORS грешка
**Решение:** Провери CORS настройките в `server.js`

### Backend не отговаря
**Решение:** 
- Провери дали backend е "live" в Heroku/Railway/Render
- Провери логовете: `heroku logs --tail` или в dashboard

### Database connection failed
**Решение:**
- Провери environment variables
- Провери дали MySQL позволява връзки от backend хостинга

---

## Препоръчана структура на GitHub repositories

**Repository 1: `mamafood-backend`**
```
├── server.js
├── package.json
├── Procfile
└── README.md
```

**Repository 2: `mamafood-frontend`** (опционално)
```
├── index.html
├── app.js
├── styles.css
├── i18n.js
├── manifest.json
└── service-worker.js
```

---

## Безплатни опции (за сравнение)

| Хостинг | Безплатно | Лесно | URL |
|---------|-----------|-------|-----|
| **Heroku** | ✅ Да | Средно | `*.herokuapp.com` |
| **Railway** | ✅ Да | Лесно | `*.railway.app` |
| **Render** | ✅ Да | Лесно | `*.onrender.com` |
| **Fly.io** | ✅ Да | Средно | `*.fly.dev` |

**Препоръка:** Railway или Render (най-лесно)

---

**Готово! 🎉**

С този подход:
- Frontend работи на твоя сървър (статични файлове)
- Backend работи на безплатен хостинг (Node.js)
- Всичко работи заедно!




