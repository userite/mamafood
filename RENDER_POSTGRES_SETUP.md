# 🚀 Render.com - Backend + PostgreSQL Setup

## 📋 Информация

- **GitHub Repository:** `github.com/userite/mamafood`
- **Database:** PostgreSQL (вече създадена на Render.com)
- **Backend:** Node.js Express API

---

## 🗄️ СТЪПКА 1: Провери PostgreSQL базата

1. **Отиди на:** https://render.com
2. **Dashboard → Database** (или "PostgreSQL")
3. **Кликни на базата данни**
4. **Вземи connection details:**
   - **Internal Database URL** (или connection string)
   - Или отделни:
     - `POSTGRES_HOST`
     - `POSTGRES_USER`
     - `POSTGRES_PASSWORD`
     - `POSTGRES_DATABASE`
     - `POSTGRES_PORT` (обикновено 5432)

**Копирай ги!** Ще ги трябват за backend-а.

---

## 💻 СТЪПКА 2: Създай/Актуализирай Backend Service

### Ако НЕ съществува backend service:

1. **Render.com Dashboard → "New"**
2. **Избери:** "Web Service"
3. **Connect GitHub:**
   - Ако не е свързан: "Configure GitHub App"
   - Избери repository: `userite/mamafood`
4. **Настройки:**
   - **Name:** `mamafood-backend` (или както предпочиташ)
   - **Environment:** `Node`
   - **Root Directory:** `backend-only` (ако backend-а е в тази папка)
   - **Build Command:** `cd backend-only && npm install`
   - **Start Command:** `cd backend-only && node server.js`
5. **Натисни:** "Create Web Service"

### Ако УЖЕ съществува backend service:

1. **Кликни на backend service-а**
2. **Settings:**
   - Провери **Root Directory** и **Start Command**
   - Ако не са правилни, промени ги

---

## ⚙️ СТЪПКА 3: Настрой Environment Variables

1. **Backend Service → "Environment" tab**
2. **Добави/Промени variables:**

### Вариант A: Ако имаш DATABASE_URL (connection string):
```
DATABASE_URL=postgresql://user:password@host:5432/database
DB_TYPE=postgres
PORT=3000
NODE_ENV=production
```

### Вариант B: Ако имаш отделни променливи:
```
POSTGRES_HOST=xxx.render.com
POSTGRES_USER=xxx
POSTGRES_PASSWORD=xxx
POSTGRES_DATABASE=xxx
POSTGRES_PORT=5432
DB_TYPE=postgres
PORT=3000
NODE_ENV=production
```

### За VAPID keys (push notifications):
```
VAPID_PUBLIC=xxx
VAPID_PRIVATE=xxx
```

---

## 🔄 СТЪПКА 4: Свържи Backend с PostgreSQL

### Ако PostgreSQL и Backend са в един проект:

Render.com автоматично ще добави `DATABASE_URL` като environment variable.

### Ако са в различни проекти:

1. **PostgreSQL → "Connect"** tab
2. **Копирай connection string** или отделни променливи
3. **Backend → Environment** tab
4. **Добави ги** като environment variables

---

## 📊 СТЪПКА 5: Създай таблиците (ако не съществуват)

### Вариант A: От Render.com PostgreSQL Console

1. **PostgreSQL → "Connect" tab**
2. **"Connect"** бутон → ще отвори psql console
3. **Копирай и изпълни** SQL заявките от `database_setup.sql`
   - **ВАЖНО:** Трябва да са PostgreSQL синтаксис, не MySQL!

### Вариант B: От локален компютър

1. **Инсталирай PostgreSQL клиент** (psql или pgAdmin)
2. **Свържи се** с Render.com PostgreSQL:
   - Host: (от POSTGRES_HOST)
   - User: (от POSTGRES_USER)
   - Password: (от POSTGRES_PASSWORD)
   - Database: (от POSTGRES_DATABASE)
   - Port: 5432
3. **Изпълни** SQL заявките

---

## 🚀 СТЪПКА 6: Deploy

1. **Render.com автоматично ще deploy-не** след push в GitHub
2. Или **Manual Deploy** → "Deploy latest commit"
3. **Изчакай** докато се build-не (1-2 минути)
4. **Ще получиш URL:** `https://mamafood-backend.onrender.com`

---

## ✅ СТЪПКА 7: Тествай

1. **Отиди на:** `https://mamafood-backend.onrender.com/api/health`
2. **Трябва да видиш:** `{"status":"ok"}`
3. **Ако работи:** Готово! 🎉

---

## 🔧 Промени в server.js

Backend-ът трябва да:
- ✅ Използва `pg` (PostgreSQL driver) вместо `mysql2`
- ✅ Има PostgreSQL синтаксис в queries (не MySQL синтаксис)
- ✅ Чете environment variables правилно

**Ако server.js е за MySQL, трябва да се конвертира!**

---

## 🐛 Често срещани проблеми

### "Cannot connect to database"

**Решение:**
- Провери дали `DATABASE_URL` или PostgreSQL променливите са правилни
- Провери дали базата е "Active" в Render.com
- Провери logs: Backend → "Logs" tab

### "Table does not exist"

**Решение:**
- Провери дали таблиците са създадени
- Изпълни `database_setup.sql` отново (PostgreSQL версия)

### "Build failed"

**Решение:**
- Провери дали `package.json` има правилните dependencies
- Провери Root Directory и Start Command
- Виж build logs за детайли

---

## 📝 Важно: PostgreSQL vs MySQL синтаксис

### Разлики:

| MySQL | PostgreSQL |
|-------|-----------|
| `?` (placeholders) | `$1, $2, $3` (placeholders) |
| `AUTO_INCREMENT` | `SERIAL` или `GENERATED ALWAYS AS IDENTITY` |
| `ON DUPLICATE KEY UPDATE` | `ON CONFLICT DO UPDATE` |
| `LIMIT ?, ?` | `LIMIT ? OFFSET ?` |

**Трябва да се конвертират всички queries!**

---

## ✅ Готово!

След като всичко е настроено:
- ✅ Backend работи на Render.com
- ✅ PostgreSQL база е свързана
- ✅ API е достъпен на: `https://mamafood-backend.onrender.com`

**Добави URL-а в `app_v2.js` като `API_BASE`!**

