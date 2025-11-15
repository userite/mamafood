# 🚀 Инструкции за Deployment на МАМАФООД

## 📋 Общ преглед

- **Backend**: PostgreSQL на Render.com (автоматично deployment чрез GitHub)
- **Frontend**: Статични файлове на pci.inex-project.net (качване чрез curl/FTP)

---

## 🔧 Локално тестване

### Стартиране на Backend

```batch
start-backend.bat
```

Това ще:
- Провери и инсталира зависимости в `backend-only/`
- Стартира сървъра на `http://localhost:3000`
- Използва `server_pg.js` (PostgreSQL версия)

**Важно**: За локално тестване създай `.env` файл в `backend-only/`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mamafood
PORT=3000
```

### Стартиране на Frontend

```batch
start-frontend.bat
```

Това ще:
- Инсталира `http-server` ако не е наличен
- Стартира frontend на `http://localhost:8000`
- Автоматично отваря браузъра

**Важно**: Backend трябва да работи на `http://localhost:3000` за да работи frontend-ът!

---

## 🌐 Production Deployment

### 1️⃣ Backend на Render.com

#### Стъпка 1: GitHub Repository

1. Създай GitHub repository (ако нямаш)
2. Push-ни кода в GitHub:
   ```bash
   git add .
   git commit -m "Deploy to Render.com"
   git push origin main
   ```

#### Стъпка 2: Render.com Setup

1. Отиди на: https://render.com
2. Влез в акаунта си
3. **New → Web Service**
4. Свържи GitHub repository-то
5. Конфигурация:
   - **Name**: `mamafood-backend` (или както предпочиташ)
   - **Environment**: `Node`
   - **Build Command**: `cd backend-only && npm install`
   - **Start Command**: `cd backend-only && npm start`
   - **Root Directory**: `backend-only` (или остави празно и промени командите)

#### Стъпка 3: Environment Variables в Render.com

В Render.com Dashboard → Environment:
- `DATABASE_URL` - автоматично се добавя ако PostgreSQL е в същия проект
- `PORT` - автоматично се задава от Render.com
- `NODE_ENV=production`
- `VAPID_PUBLIC` - за push notifications (опционално)
- `VAPID_PRIVATE` - за push notifications (опционално)

#### Стъпка 4: PostgreSQL Database

1. В Render.com Dashboard → **New → PostgreSQL**
2. Създай база данни
3. Render.com автоматично ще добави `DATABASE_URL` като environment variable
4. Изпълни `database_setup_pg.sql` в PostgreSQL Console

#### Стъпка 5: Проверка

1. Render.com автоматично ще deploy-не след push в GitHub
2. Ще получиш URL: `https://mamafood-backend.onrender.com`
3. Провери: `https://mamafood-backend.onrender.com/api/health`

**Важно**: Запиши този URL - ще го използваш за frontend конфигурация!

---

### 2️⃣ Frontend на pci.inex-project.net

#### Стъпка 1: Конфигуриране на API_BASE

Преди качване, промени `app_v2.js`:

Намери функцията `getAPIBase()` (около ред 526) и промени:

```javascript
const getAPIBase = () => {
    // ... локални проверки ...
    
    // Ако е на pci.inex-project.net, използвай Render.com backend
    if (hostname === 'inex-project.net' || hostname === 'pci.inex-project.net' || hostname.endsWith('.inex-project.net')) {
        return 'https://mamafood-backend.onrender.com'; // ПРОМЕНИ ТОЗИ URL!
    }
    
    // Иначе използвай production URL
    return 'https://mamafood-backend.onrender.com'; // ПРОМЕНИ ТОЗИ URL!
};
```

**Заменете `mamafood-backend.onrender.com` с вашия действителен Render.com URL!**

#### Стъпка 2: Конфигуриране на deploy-frontend.bat

Отвори `deploy-frontend.bat` и промени:

```batch
set "FTP_HOST=pci.inex-project.net"
set "FTP_USER=твоят_потребител"        ← ПРОМЕНИ!
set "FTP_PASS=твоята_парола"            ← ПРОМЕНИ!
set "FTP_DIR=/public_html/mamafood"     ← ПРОМЕНИ според твоята структура
```

#### Стъпка 3: Качване на файловете

```batch
deploy-frontend.bat
```

Това ще качи:
- `index.html`
- `app_v2.js`
- `i18n.js`
- `styles.css`
- `manifest.json`
- `service-worker.js`

#### Стъпка 4: Проверка

1. Отвори: `https://pci.inex-project.net/mamafood/`
2. Провери конзолата (F12) за грешки
3. Опитай да добавиш запис

---

## 🔄 Обновяване на приложението

### Backend (Render.com)

1. Направи промени в кода
2. Commit и push в GitHub:
   ```bash
   git add .
   git commit -m "Update backend"
   git push origin main
   ```
3. Render.com автоматично ще deploy-не новия код
4. Или Manual Deploy: Render.com → Service → "Manual Deploy"

### Frontend (pci.inex-project.net)

1. Направи промени в frontend файловете
2. Пусни `deploy-frontend.bat`
3. Провери приложението

---

## 🛠️ Отстраняване на проблеми

### Backend не работи

1. Провери Render.com Logs:
   - Dashboard → Service → Logs
2. Провери environment variables
3. Провери дали PostgreSQL базата е "Active"
4. Провери дали `DATABASE_URL` е правилен

### Frontend не може да се свърже с Backend

1. Провери `app_v2.js` - дали `API_BASE` е правилен
2. Провери CORS настройките в `server_pg.js`:
   ```javascript
   origin: [
       'https://pci.inex-project.net',
       'http://pci.inex-project.net',
       // ...
   ]
   ```
3. Провери конзолата в браузъра (F12) за CORS грешки

### Файловете не се качват

1. Провери FTP credentials в `deploy-frontend.bat`
2. Провери дали curl е инсталиран: `curl --version`
3. Опитай ръчно с FTP клиент (FileZilla, WinSCP)

---

## 📝 Важни бележки

1. **Backend URL**: Запиши Render.com URL-а и го използвай в `app_v2.js`
2. **CORS**: Уверете се, че `pci.inex-project.net` е в CORS списъка в `server_pg.js`
3. **HTTPS**: Push notifications изискват HTTPS
4. **Cache**: Използвай cache busting (`?v=X`) в HTML файловете

---

## ✅ Checklist за първо deployment

- [ ] GitHub repository създаден и кодът е push-нат
- [ ] Render.com Web Service създаден и свързан с GitHub
- [ ] PostgreSQL база данни създадена на Render.com
- [ ] `database_setup_pg.sql` изпълнен
- [ ] Environment variables зададени в Render.com
- [ ] Backend URL получен от Render.com
- [ ] `app_v2.js` променен с правилния `API_BASE`
- [ ] `deploy-frontend.bat` конфигуриран с FTP credentials
- [ ] Frontend файловете качени на pci.inex-project.net
- [ ] Приложението тествано и работи

---

## 🎉 Готово!

След като всичко е настроено:
- Backend: `https://mamafood-backend.onrender.com`
- Frontend: `https://pci.inex-project.net/mamafood/`

Приложението е готово за използване! 🚀

