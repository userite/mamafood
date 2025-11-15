# 🌐 Инструкции за Online Deployment

## ✅ Checklist преди качване

- [ ] Backend е качен на Render.com и работи
- [ ] Backend URL е получен (например: `https://mamafood-backend.onrender.com`)
- [ ] Backend health check работи: `https://твоят-backend-url.onrender.com/api/health`
- [ ] `app_v2.js` е променен с правилния Render.com URL
- [ ] CORS настройките в backend-а включват `pci.inex-project.net`
- [ ] FTP credentials за `pci.inex-project.net` са готови

---

## 🔧 Стъпка 1: Промени Render.com URL в app_v2.js

### Намери функцията `getAPIBase()`

Отвори `app_v2.js` и намери функцията около ред 540:

```javascript
const getAPIBase = () => {
    // ...
    if (hostname === 'inex-project.net' || hostname === 'pci.inex-project.net' || hostname.endsWith('.inex-project.net')) {
        // ПРОМЕНИ ТОЗИ URL С ТВОЯТ RENDER.COM BACKEND URL!
        return 'https://mamafood-backend.onrender.com';  // ← ПРОМЕНИ ТОЗИ!
    }
    // ...
    return 'https://mamafood-backend.onrender.com';  // ← И ТОЗИ!
};
```

### Промени URL-а

**Замени `mamafood-backend.onrender.com` с твоя действителен Render.com backend URL!**

Например, ако твоят backend URL е `https://mamafood-api-123.onrender.com`, промени на:

```javascript
return 'https://mamafood-api-123.onrender.com';
```

**Важно**: Промени и двата реда (за pci.inex-project.net и за default)!

---

## 🔧 Стъпка 2: Провери CORS настройките в Backend

Провери дали `pci.inex-project.net` е в CORS списъка в `backend-only/server_pg.js`:

```javascript
app.use(cors({
    origin: [
        'https://pci.inex-project.net',      // ← Трябва да е тук!
        'http://pci.inex-project.net',       // ← И тук!
        'http://localhost:3000',
        'http://localhost:8000',
        'https://mamafood.onrender.com'
    ],
    credentials: true
}));
```

Ако липсва, добави го!

---

## 🔧 Стъпка 3: Конфигурирай deploy-frontend.bat

Отвори `deploy-frontend.bat` и промени FTP credentials:

```batch
set "FTP_HOST=pci.inex-project.net"
set "FTP_USER=твоят_потребител"        ← ПРОМЕНИ!
set "FTP_PASS=твоята_парола"            ← ПРОМЕНИ!
set "FTP_DIR=/public_html/mamafood"     ← ПРОМЕНИ според твоята структура
```

**Важно**: 
- `FTP_DIR` може да е `/public_html/mamafood`, `/var/www/mamafood`, или друга директория
- Провери с твоя hosting provider каква е правилната директория

---

## 🚀 Стъпка 4: Качи Frontend файловете

### Вариант A: Използвай deploy-frontend.bat (препоръчително)

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

### Вариант B: Ръчно с FTP клиент

Използвай FileZilla, WinSCP или друг FTP клиент и качи файловете в правилната директория.

---

## ✅ Стъпка 5: Тестване

### 1. Провери Backend Health

Отвори в браузър:
```
https://твоят-backend-url.onrender.com/api/health
```

Трябва да видиш:
```json
{"status":"ok","timestamp":"..."}
```

### 2. Провери Frontend

Отвори:
```
https://pci.inex-project.net/mamafood/
```

Или според твоята структура:
```
https://pci.inex-project.net/
```

### 3. Провери конзолата в браузъра (F12)

1. Отвори Developer Tools (F12)
2. Отиди на Console tab
3. Провери за:
   - `[loadRecords] API_BASE: https://твоят-backend-url.onrender.com`
   - `[loadRecords] Full API URL: https://твоят-backend-url.onrender.com/api/records/KAI`
   - Няма CORS грешки

### 4. Тествай функционалността

- Опитай да добавиш запис
- Провери дали записите се показват
- Провери дали данните се запазват

---

## 🛠️ Отстраняване на проблеми

### Проблем 1: CORS грешка в конзолата

**Симптоми:**
```
Access to fetch at 'https://backend-url.onrender.com/api/...' from origin 'https://pci.inex-project.net' has been blocked by CORS policy
```

**Решение:**
1. Провери дали `pci.inex-project.net` е в CORS списъка в `server_pg.js`
2. Рестартирай backend на Render.com (Manual Deploy)

### Проблем 2: "Failed to fetch" или "Network error"

**Симптоми:**
- Конзолата показва грешка при заявки към API-то

**Решение:**
1. Провери дали backend URL в `app_v2.js` е правилен
2. Провери дали backend работи: `https://твоят-backend-url.onrender.com/api/health`
3. Провери дали backend е "Live" в Render.com Dashboard

### Проблем 3: Записите не се показват

**Симптоми:**
- Приложението се зарежда, но няма записи

**Решение:**
1. Провери конзолата (F12) за грешки
2. Провери дали API заявката връща данни:
   ```
   https://твоят-backend-url.onrender.com/api/records/KAI
   ```
3. Провери дали кодът на детето е правилен (KAI в главни букви)

### Проблем 4: Файловете не се качват

**Симптоми:**
- `deploy-frontend.bat` показва грешки

**Решение:**
1. Провери FTP credentials в `deploy-frontend.bat`
2. Провери дали `curl` е инсталиран: `curl --version`
3. Опитай с FTP клиент (FileZilla, WinSCP)

---

## 🔄 Обновяване на приложението

### Когато направиш промени:

1. **Промени в frontend:**
   - Направи промените в локалните файлове
   - Пусни `deploy-frontend.bat`
   - Провери приложението

2. **Промени в backend:**
   - Направи промените в кода
   - Push в GitHub (Render.com автоматично deploy-ва)
   - Или Manual Deploy в Render.com Dashboard

---

## 📝 Важни бележки

1. **Cache**: Браузърът може да кешира стари файлове. Използвай Ctrl+F5 за hard refresh
2. **HTTPS**: Уверете се че и frontend и backend използват HTTPS
3. **Environment Variables**: На Render.com не е нужно .env файл - използва Environment Variables в Dashboard

---

## ✅ Готово!

След като всичко е конфигурирано и качено:

- **Backend**: `https://твоят-backend-url.onrender.com`
- **Frontend**: `https://pci.inex-project.net/mamafood/`

Приложението е готово за използване онлайн! 🎉

