# МАМАФООД Backend API (PostgreSQL версия)

Backend сървър за МАМАФООД приложението, конфигуриран за PostgreSQL база данни (Render.com).

## 🚀 Стартиране

```bash
# Инсталирай зависимостите
npm install

# Копирай package_pg.json в package.json (или използвай директно)
cp package_pg.json package.json
npm install

# Стартирай сървъра
npm start
```

Сървърът стартира на: **http://localhost:3000**

---

## 📋 API Endpoints

### Health Check
- `GET /api/health` - Проверка на състоянието на сървъра

### Records
- `GET /api/records/:child_code` - Вземи всички записи за дете
- `GET /api/records/:child_code/next-number` - Вземи следващия номер на запис
- `POST /api/records` - Добави нов запис
- `PUT /api/records/:id` - Обнови запис
- `DELETE /api/records/:id` - Изтрий запис

### Children
- `POST /api/children` - Създай/обнови дете
- `GET /api/children/:child_code` - Вземи информация за дете

### Push Notifications
- `GET /api/push/publicKey` - Вземи VAPID публичен ключ
- `POST /api/push/subscribe` - Абонирай се за push известия
- `POST /api/push/test` - Тест на push известие

### Devices
- `POST /api/devices` - Регистрирай устройство

---

## 🗄️ Database

База данни: **PostgreSQL**

### Поддържани connection formats:

#### 1. DATABASE_URL (Render.com автоматично го предоставя):
```
DATABASE_URL=postgresql://user:password@host:5432/database
```

#### 2. Отделни променливи:
```
POSTGRES_HOST=xxx.render.com
POSTGRES_USER=xxx
POSTGRES_PASSWORD=xxx
POSTGRES_DATABASE=xxx
POSTGRES_PORT=5432
```

---

## 🔧 Environment Variables

```bash
PORT=3000                    # Порт на сървъра (по подразбиране: 3000)
DATABASE_URL=...             # PostgreSQL connection string (от Render.com)
# ИЛИ отделни променливи:
POSTGRES_HOST=xxx
POSTGRES_USER=xxx
POSTGRES_PASSWORD=xxx
POSTGRES_DATABASE=xxx
POSTGRES_PORT=5432
VAPID_PUBLIC=...             # VAPID публичен ключ
VAPID_PRIVATE=...            # VAPID private ключ
NODE_ENV=production           # Production mode
```

---

## 📦 Deployment на Render.com

### Стъпки:

1. **GitHub Repository:** `github.com/userite/mamafood`

2. **Render.com → New → Web Service**

3. **Settings:**
   - **Root Directory:** `backend-only`
   - **Build Command:** `npm install`
   - **Start Command:** `node server_pg.js`

4. **Environment Variables:**
   - Render.com автоматично добавя `DATABASE_URL` ако PostgreSQL е в същия проект
   - Добави `VAPID_PUBLIC` и `VAPID_PRIVATE` ако искаш push notifications

5. **Database Setup:**
   - Изпълни `database_setup_pg.sql` в PostgreSQL базата
   - Или използвай Render.com PostgreSQL Console

---

## 🔄 Разлики от MySQL версията

| MySQL (server.js) | PostgreSQL (server_pg.js) |
|-------------------|---------------------------|
| `mysql2` package | `pg` package |
| `?` placeholders | `$1, $2, $3` placeholders |
| `AUTO_INCREMENT` | `SERIAL` |
| `ON DUPLICATE KEY UPDATE` | `ON CONFLICT DO UPDATE` |
| `execute()` method | `query()` method |
| `result.insertId` | `result.rows[0].id` |

---

## ✅ Готово!

След като всичко е настроено:
- ✅ Backend работи на Render.com
- ✅ PostgreSQL база е свързана
- ✅ API е достъпен на: `https://mamafood-backend.onrender.com`

**Добави URL-а в `app_v2.js` като `API_BASE`!**

