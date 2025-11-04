# 🚀 Render.com Deploy - Стъпка по стъпка

## 📋 Преди да започнем

**Убедености:**
- ✅ GitHub repository: `github.com/userite/mamafood`
- ✅ PostgreSQL база данни на Render.com (вече създадена)
- ✅ Backend код: `backend-only/server_pg.js` (готов)

---

## 🗄️ СТЪПКА 1: Провери PostgreSQL базата

1. **Отиди на:** https://render.com
2. **Dashboard → Databases**
3. **Кликни на PostgreSQL базата**
4. **Вземи connection details:**
   - **Internal Database URL** (или connection string)
   - Или от **"Info" tab:**
     - Host
     - Port (обикновено 5432)
     - Database
     - User
     - Password

**⚠️ ВАЖНО:** Ако базата и backend-ът са в **един проект**, Render автоматично ще добави `DATABASE_URL` като environment variable!

---

## 💻 СТЪПКА 2: Създай/Актуализирай Web Service

### Ако НЕ съществува backend service:

1. **Render.com Dashboard → "New"** (горен десен ъгъл)
2. **Избери:** "Web Service"
3. **Connect Repository:**
   - **Provider:** GitHub
   - **Repository:** `userite/mamafood`
   - Ако не виждаш repository-то: "Configure account" → свържи GitHub акаунта
4. **Настройки:**
   - **Name:** `mamafood-backend` (или както предпочиташ)
   - **Region:** Избери най-близкия (например `Frankfurt (EU)`)
   - **Branch:** `main`
   - **Root Directory:** `backend-only` ⚠️ **ВАЖНО!**
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server_pg.js` ⚠️ **ВАЖНО!**
5. **Plan:** Free (или Starter ако искаш по-бързо)
6. **Натисни:** "Create Web Service"

### Ако УЖЕ съществува backend service:

1. **Кликни на service-а**
2. **Settings:**
   - Провери **Root Directory:** трябва да е `backend-only`
   - Провери **Start Command:** трябва да е `node server_pg.js`
   - Ако не са правилни, промени ги и **Save Changes**

---

## ⚙️ СТЪПКА 3: Настрой Environment Variables

1. **Backend Service → "Environment" tab**
2. **Провери дали има `DATABASE_URL`:**
   - Ако PostgreSQL и Backend са в **един проект**, Render автоматично добавя `DATABASE_URL`
   - Ако НЕ е автоматично, добави ръчно:
     ```
     DATABASE_URL=postgresql://user:password@host:5432/database
     ```
     (Копирай от PostgreSQL → "Internal Database URL")

3. **Добави други variables:**
   ```
   NODE_ENV=production
   PORT=3000
   ```
   (PORT обикновено се задава автоматично от Render)

4. **За Push Notifications (опционално):**
   ```
   VAPID_PUBLIC=твоя-публичен-ключ
   VAPID_PRIVATE=твоя-приватен-ключ
   ```

5. **Save Changes**

---

## 📊 СТЪПКА 4: Създай таблиците в PostgreSQL

### Вариант A: От Render.com Console

1. **PostgreSQL → "Connect" tab**
2. **"Connect"** бутон → ще отвори psql console в браузъра
3. **Копирай и изпълни** SQL заявките от `database_setup_pg.sql`
   - Отвори файла: `database_setup_pg.sql`
   - Копирай цялото съдържание
   - Постави в psql console
   - Натисни Enter

### Вариант B: От локален компютър

1. **Инсталирай PostgreSQL клиент:**
   - pgAdmin: https://www.pgadmin.org/
   - Или psql command line tool

2. **Свържи се с Render.com PostgreSQL:**
   - Host: (от PostgreSQL Info)
   - Port: 5432
   - Database: (от PostgreSQL Info)
   - User: (от PostgreSQL Info)
   - Password: (от PostgreSQL Info)

3. **Изпълни** `database_setup_pg.sql`

---

## 🚀 СТЪПКА 5: Deploy

1. **Render.com автоматично ще deploy-не** след:
   - Push в GitHub `main` branch
   - Или **Manual Deploy** → "Deploy latest commit"

2. **Изчакай** build да завърши (1-2 минути)
   - Виждаш progress в "Logs" tab

3. **Ще получиш URL:** `https://mamafood-backend.onrender.com`
   - Или друг URL според името на service-а

---

## ✅ СТЪПКА 6: Тествай

1. **Отиди на:** `https://mamafood-backend.onrender.com/api/health`
2. **Трябва да видиш:** 
   ```json
   {"status":"ok","timestamp":"..."}
   ```

3. **Ако работи:** Готово! 🎉

4. **Ако има грешка:**
   - Провери **Logs** tab в Render.com
   - Провери дали `DATABASE_URL` е правилно зададен
   - Провери дали таблиците са създадени

---

## 🔧 СТЪПКА 7: Актуализирай Frontend

1. **Отвори:** `app_v2.js`
2. **Намери:** `API_BASE` или `const API_BASE = ...`
3. **Промени на:**
   ```javascript
   const API_BASE = 'https://mamafood-backend.onrender.com';
   ```
   Или автоматично детектиране:
   ```javascript
   const API_BASE = window.location.hostname === 'localhost' 
     ? 'http://localhost:3000' 
     : 'https://mamafood-backend.onrender.com';
   ```

---

## 🐛 Често срещани проблеми

### "Cannot connect to database"

**Решение:**
- Провери дали `DATABASE_URL` е правилно зададен
- Провери дали PostgreSQL service е "Active"
- Провери дали базата и backend-ът са в един проект (за автоматично `DATABASE_URL`)

### "Table does not exist"

**Решение:**
- Провери дали таблиците са създадени
- Изпълни `database_setup_pg.sql` отново

### "Build failed"

**Решение:**
- Провери **Logs** tab за детайли
- Провери дали `package.json` е правилен
- Провери дали `Root Directory` е `backend-only`
- Провери дали `Start Command` е `node server_pg.js`

### "Module not found: pg"

**Решение:**
- Провери дали `package.json` в `backend-only/` има `pg` dependency
- Може да трябва да копираш `package_pg.json` в `package.json`:
  ```bash
  cd backend-only
  cp package_pg.json package.json
  git add package.json
  git commit -m "Update package.json for PostgreSQL"
  git push
  ```

---

## 📝 Важно: package.json

**Провери дали `backend-only/package.json` използва `pg` вместо `mysql2`:**

```json
{
  "dependencies": {
    "pg": "^8.11.3",
    "express": "^4.21.2",
    "cors": "^2.8.5",
    "web-push": "^3.6.7"
  }
}
```

**Ако не е така, копирай `package_pg.json` в `package.json`!**

---

## ✅ Готово!

След като всичко е настроено:
- ✅ Backend работи на Render.com
- ✅ PostgreSQL база е свързана
- ✅ API е достъпен
- ✅ Frontend може да се свърже с backend-а

**URL на backend-а:** `https://mamafood-backend.onrender.com`

---

## 🔄 За следващите промени

След всяка промяна в кода:
1. **Push в GitHub:**
   ```bash
   git add .
   git commit -m "Описание на промяната"
   git push
   ```

2. **Render.com автоматично ще deploy-не** новия код

3. **Или Manual Deploy:** Render.com → Service → "Manual Deploy"

---

## 🎉 Готово за production!

Сега можеш да използваш приложението с backend на Render.com! 🚀

