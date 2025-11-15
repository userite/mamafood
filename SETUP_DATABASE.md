# 🔧 Конфигуриране на PostgreSQL база данни

## Проблем: Database connection test failed

Ако виждаш тази грешка, значи няма конфигурирана връзка с PostgreSQL базата данни.

---

## ✅ Решение 1: Локална PostgreSQL база

### Стъпка 1: Инсталирай PostgreSQL

1. Download: https://www.postgresql.org/download/windows/
2. Инсталирай с дефолтни настройки
3. Запомни паролата за `postgres` потребителя

### Стъпка 2: Създай база данни

Отвори **pgAdmin** или **psql** и изпълни:

```sql
CREATE DATABASE mamafood;
```

### Стъпка 3: Създай таблиците

Изпълни `database_setup_pg.sql` в новата база:

```sql
-- Копирай съдържанието от database_setup_pg.sql и го изпълни
```

### Стъпка 4: Създай .env файл

В `backend-only/` директорията създай `.env` файл:

```
DATABASE_URL=postgresql://postgres:твоята_парола@localhost:5432/mamafood
PORT=3000
```

**Или използвай помощния скрипт:**
```batch
cd backend-only
create-env.bat
```

### Стъпка 5: Инсталирай зависимости

```batch
cd backend-only
npm install
```

Това ще инсталира `dotenv` пакета който чете .env файла.

---

## ✅ Решение 2: Render.com PostgreSQL (за production)

### Стъпка 1: Създай PostgreSQL на Render.com

1. Отиди на: https://render.com
2. **New → PostgreSQL**
3. Избери план (Free tier е достатъчен за тестване)
4. Запиши connection string-а

### Стъпка 2: Използвай connection string

**За локално тестване:**
Създай `.env` файл в `backend-only/`:
```
DATABASE_URL=postgresql://username:password@host:port/database
PORT=3000
```

**За production на Render.com:**
Render.com автоматично добавя `DATABASE_URL` като environment variable - няма нужда от .env файл!

### Стъпка 3: Създай таблиците

Изпълни `database_setup_pg.sql` в Render.com PostgreSQL Console.

---

## 🧪 Тестване на връзката

### Вариант 1: Стартирай backend

```batch
start-backend.bat
```

Трябва да видиш:
```
✅ Database connection test successful: ...
```

### Вариант 2: Тест скрипт

```batch
cd backend-only
node -e "require('dotenv').config(); const {Pool} = require('pg'); const pool = new Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT NOW()').then(r => {console.log('✅ OK:', r.rows[0].now); process.exit(0);}).catch(e => {console.error('❌ Error:', e.message); process.exit(1);});"
```

---

## ❌ Често срещани проблеми

### Проблем 1: "dotenv не е намерен"

**Решение:**
```batch
cd backend-only
npm install
```

### Проблем 2: "password authentication failed"

**Решение:**
- Провери паролата в DATABASE_URL
- За локална база: Провери паролата на `postgres` потребителя

### Проблем 3: "database does not exist"

**Решение:**
- Създай базата: `CREATE DATABASE mamafood;`
- Провери името в DATABASE_URL

### Проблем 4: "connection refused"

**Решение:**
- Провери дали PostgreSQL сървърът работи
- За локална база: Стартирай PostgreSQL service
- Провери порта (по подразбиране е 5432)

---

## 📝 Формат на DATABASE_URL

```
postgresql://username:password@host:port/database
```

**Примери:**

Локална база:
```
postgresql://postgres:myPassword@localhost:5432/mamafood
```

Render.com:
```
postgresql://user:password@dpg-xxxxx-a.oregon-postgres.render.com:5432/mamafood_xxxx
```

---

## ✅ Checklist

- [ ] PostgreSQL е инсталиран/достъпен
- [ ] Базата `mamafood` е създадена
- [ ] Таблиците са създадени (изпълнен `database_setup_pg.sql`)
- [ ] `.env` файл е създаден в `backend-only/`
- [ ] `DATABASE_URL` е правилен в `.env`
- [ ] `npm install` е изпълнен в `backend-only/`
- [ ] Backend стартира без грешки
- [ ] Виждаш `✅ Database connection test successful`

---

## 🎉 Готово!

След като всичко е конфигурирано, backend-ът трябва да се свърже успешно с базата данни и записите за KAI трябва да се показват!

