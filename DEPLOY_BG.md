# 🚀 Инструкции за Deployment - МАМАФООД

## 📋 Как работи системата

- **Backend**: PostgreSQL на Render.com (автоматично чрез GitHub)
- **Frontend**: Статични файлове на pci.inex-project.net (качване чрез curl)

---

## 🔧 Локално тестване

### 1. Стартиране на Backend

Двойно кликване на: **`start-backend.bat`**

Това ще:
- Стартира backend сървъра на `http://localhost:3000`
- Използва PostgreSQL база данни

**За локално тестване** създай файл `backend-only/.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mamafood
PORT=3000
```

### 2. Стартиране на Frontend

Двойно кликване на: **`start-frontend.bat`**

Това ще:
- Стартира frontend на `http://localhost:8000`
- Автоматично отваря браузъра

**Важно**: Backend трябва да работи на порт 3000!

---

## 🌐 Качване на Production

### Стъпка 1: Backend на Render.com

#### 1.1. GitHub Repository

1. Създай GitHub repository (ако нямаш)
2. Push-ни кода:
   ```bash
   git add .
   git commit -m "Deploy to Render.com"
   git push origin main
   ```

#### 1.2. Render.com Setup

1. Отиди на: https://render.com
2. Влез в акаунта си
3. **New → Web Service**
4. Свържи GitHub repository-то
5. Настройки:
   - **Name**: `mamafood-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend-only && npm install`
   - **Start Command**: `cd backend-only && npm start`

#### 1.3. PostgreSQL Database

1. Render.com → **New → PostgreSQL**
2. Създай база данни
3. Render.com автоматично добавя `DATABASE_URL`
4. Изпълни `database_setup_pg.sql` в PostgreSQL Console

#### 1.4. Запиши Backend URL

След deployment ще получиш URL като:
`https://mamafood-backend.onrender.com`

**Запиши този URL!** Ще го използваш в следващата стъпка.

---

### Стъпка 2: Конфигуриране на Frontend

#### 2.1. Промени API URL в app_v2.js

Отвори `app_v2.js` и намери функцията `getAPIBase()` (около ред 540).

Промени URL-а на твоя Render.com backend:

```javascript
// Промени тези редове:
return 'https://mamafood-backend.onrender.com'; // ← ТВОЯТ URL!
```

**Заменете `mamafood-backend.onrender.com` с вашия действителен Render.com URL!**

#### 2.2. Конфигуриране на deploy-frontend.bat

Отвори `deploy-frontend.bat` и промени:

```batch
set "FTP_USER=твоят_потребител"        ← ПРОМЕНИ!
set "FTP_PASS=твоята_парола"            ← ПРОМЕНИ!
set "FTP_DIR=/public_html/mamafood"     ← ПРОМЕНИ според твоята структура
```

---

### Стъпка 3: Качване на Frontend

Двойно кликване на: **`deploy-frontend.bat`**

Това ще качи всички frontend файлове на pci.inex-project.net.

---

### Стъпка 4: Проверка

1. Отвори: `https://pci.inex-project.net/mamafood/`
2. Провери конзолата (F12) за грешки
3. Опитай да добавиш запис

---

## 🔄 Обновяване

### Backend (Render.com)

1. Направи промени в кода
2. Push в GitHub:
   ```bash
   git add .
   git commit -m "Update"
   git push origin main
   ```
3. Render.com автоматично deploy-ва

### Frontend (pci.inex-project.net)

1. Направи промени
2. Пусни `deploy-frontend.bat`
3. Провери приложението

---

## ✅ Checklist

- [ ] GitHub repository създаден
- [ ] Render.com Web Service създаден
- [ ] PostgreSQL база данни създадена
- [ ] `database_setup_pg.sql` изпълнен
- [ ] Backend URL получен от Render.com
- [ ] `app_v2.js` променен с правилния `API_BASE`
- [ ] `deploy-frontend.bat` конфигуриран
- [ ] Frontend файловете качени
- [ ] Приложението тествано

---

## 🛠️ Проблеми?

### Backend не работи
- Провери Render.com Logs
- Провери environment variables
- Провери дали PostgreSQL е "Active"

### Frontend не се свързва с Backend
- Провери `app_v2.js` - дали `API_BASE` е правилен
- Провери конзолата (F12) за CORS грешки

### Файловете не се качват
- Провери FTP credentials в `deploy-frontend.bat`
- Провери дали curl е инсталиран

---

## 🎉 Готово!

След като всичко е настроено:
- Backend: `https://mamafood-backend.onrender.com`
- Frontend: `https://pci.inex-project.net/mamafood/`

Приложението е готово! 🚀

