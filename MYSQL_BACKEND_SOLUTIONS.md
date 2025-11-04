# 🗄️ Решения за MySQL + Backend Hosting

## 📊 Сравнение на опциите

| Услуга | MySQL | Безплатно | Скорост | Препоръка |
|--------|-------|-----------|---------|-----------|
| **PlanetScale** | ✅ Serverless MySQL | ✅ Да | ⭐⭐⭐⭐⭐ | 🏆 НАЙ-ДОБРО |
| **Railway** | ✅ MySQL като услуга | ✅ Да (с кредити) | ⭐⭐⭐⭐ | 🥈 ВТОРО |
| **Render.com** | ✅ MySQL (платено) | ❌ Няма | ⭐⭐⭐⭐ | 🥉 ТРЕТО |
| **Aiven** | ✅ MySQL | ✅ Trial | ⭐⭐⭐⭐ | ✅ ЧЕТВЪРТО |

---

## 🏆 РЕШЕНИЕ 1: PlanetScale (MySQL) + Render.com (Backend)

### Защо PlanetScale?
- ✅ **Безплатен план:** 5GB storage, 1 billion row reads/month
- ✅ **Serverless MySQL** - автоматично мащабиране
- ✅ **Бърз** - по-бърз от PostgreSQL на Render
- ✅ **Безплатно SSL** - безопасни връзки
- ✅ **Branching** - можеш да правиш тестови бази
- ✅ **Достъпен отвсякъде** - публичен endpoint

### Стъпки:

#### 1. Създай PlanetScale акаунт

1. Отиди на: **https://planetscale.com**
2. Натисни **"Sign up"** (безплатно)
3. Логни се с GitHub акаунта

#### 2. Създай нова база данни

1. В PlanetScale dashboard → **"Create database"**
2. **Name:** `mamafood` (или друго)
3. **Region:** Избери най-близкия (например `eu-west`)
4. **Plan:** Free (Hobby)
5. **Натисни:** "Create database"

#### 3. Вземи connection string

1. В dashboard-а на базата → **"Connect"**
2. **Connection strings** → **"Node.js"**
3. Ще видиш нещо като:
   ```
   mysql://xxxxxxxxx:xxxxxxxxx@aws.connect.psdb.cloud/mamafood?sslaccept=strict
   ```
4. **КОПИРАЙ го!**

#### 4. Създай таблиците

1. В PlanetScale → **"Console"** tab
2. Или използвай `database_setup.sql` от проекта
3. Изпълни SQL заявките за създаване на таблици

#### 5. Качи backend на Render.com

1. Отиди на: **https://render.com**
2. **New → Web Service**
3. **Connect GitHub** → избери repository-то
4. **Settings:**
   - **Name:** `mamafood-backend`
   - **Environment:** Node
   - **Build Command:** `cd backend-only && npm install`
   - **Start Command:** `cd backend-only && node server.js`
5. **Environment Variables:**
   ```
   PORT=3000
   DB_HOST=aws.connect.psdb.cloud
   DB_USER=xxxxxxxxx
   DB_PASSWORD=xxxxxxxxx
   DB_NAME=mamafood
   NODE_ENV=production
   ```
6. **Натисни:** "Create Web Service"

---

## 🥈 РЕШЕНИЕ 2: Railway (Backend + MySQL всичко на едно място)

### Защо Railway?
- ✅ **Всичко на едно място** - backend + MySQL
- ✅ **Безплатни кредити:** $5/месец (достатъчно за малък проект)
- ✅ **Автоматично деплой** от GitHub
- ✅ **Бърз** - добра производителност
- ✅ **Лесно управление**

### Стъпки:

#### 1. Създай Railway акаунт

1. Отиди на: **https://railway.app**
2. Натисни **"Start a New Project"**
3. Логни се с GitHub акаунта

#### 2. Създай MySQL база

1. **New → Database → MySQL**
2. Railway автоматично ще създаде MySQL инстанция
3. **Вземи connection details:**
   - Settings → **"Connect"**
   - Копирай `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`

#### 3. Създай Web Service (Backend)

1. **New → GitHub Repo**
2. Избери repository-то
3. **Settings:**
   - **Root Directory:** `backend-only`
   - **Start Command:** `node server.js`
4. **Variables:**
   - Railway автоматично ще добави MySQL променливите
   - Добави още:
     ```
     PORT=3000
     NODE_ENV=production
     ```

#### 4. Създай таблиците

1. Railway → MySQL database → **"Connect"**
2. Използвай MySQL клиент или Railway Console
3. Изпълни `database_setup.sql`

---

## 🥉 РЕШЕНИЕ 3: Render.com (Backend) + Render.com MySQL (платено)

### Защо Render.com MySQL?
- ✅ Ако вече ползваш Render.com
- ✅ Всичко на едно място
- ✅ Добро управление

### Недостатъци:
- ❌ MySQL плана е **платен** ($7/месец минимум)
- ❌ По-скъпо от другите опции

### Стъпки:

1. Render.com → **New → PostgreSQL/MySQL**
2. Избери **MySQL**
3. **Plan:** Starter ($7/месец)
4. След създаването → **"Connect"** → вземи connection string
5. Добави в backend environment variables

---

## ✅ РЕШЕНИЕ 4: Aiven (MySQL) + Render.com (Backend)

### Защо Aiven?
- ✅ **Безплатен trial** - $300 кредити
- ✅ Добър MySQL hosting
- ✅ Безплатно SSL

### Стъпки:

1. Отиди на: **https://aiven.io**
2. **Sign up** (безплатно)
3. **Create service → MySQL**
4. **Plan:** Hobbyist (безплатен trial)
5. Вземи connection details
6. Качи backend на Render.com

---

## 🎯 МОЯТА ПРЕПОРЪКА

### За твоя проект:

**Използвай: РЕШЕНИЕ 1 (PlanetScale + Render.com)**

**Защо:**
- ✅ PlanetScale е **най-бързият** безплатен MySQL
- ✅ Render.com вече имаш акаунт
- ✅ Безплатно за малък проект
- ✅ Лесно мащабиране в бъдеще

---

## 📝 Промени в `backend-only/server.js`

Ако използваш PlanetScale или друг cloud MySQL, промени environment variables:

```javascript
const dbConfig = {
    host: process.env.DB_HOST,        // От PlanetScale
    user: process.env.DB_USER,         // От PlanetScale
    password: process.env.DB_PASSWORD, // От PlanetScale
    database: process.env.DB_NAME,     // От PlanetScale
    ssl: {
        rejectUnauthorized: false     // За PlanetScale SSL
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000
};
```

---

## 🔄 Миграция на данните

Ако искаш да мигрираш данните от текущата MySQL (`78.142.63.8`):

### Стъпка 1: Експорт

```bash
mysqldump -h 78.142.63.8 -u inex_mamafood_user -p inex_deklarado > backup.sql
```

### Стъпка 2: Импорт в новата база

```bash
mysql -h новия-хост -u новия-потребител -p нова-база < backup.sql
```

---

## ✅ Готово!

След като избереш решение и настроиш базата, трябва само да:
1. Обнови environment variables в Render.com/Railway
2. Рестартирай backend service-а
3. Тествай!

---

## 🆘 Подкрепа

Ако има проблеми, провери:
- ✅ Connection string-а е правилен
- ✅ SSL настройките (за PlanetScale)
- ✅ Firewall правилата (дали позволяват достъп)
- ✅ Environment variables са зададени правилно

