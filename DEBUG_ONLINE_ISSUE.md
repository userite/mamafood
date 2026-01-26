# 🔍 Debugging: Приложението не чете от базата онлайн

## ✅ Проверено: API работи!

Тестът показва, че API-то работи и връща данни:
```bash
# Тест за код KAI
https://mamafood.onrender.com/api/records/KAI
# Връща: 4 записа ✅
```

## 🔧 Стъпки за debugging

### 1. Провери Render.com Logs

1. Отиди в **Render.com Dashboard**
2. Избери твоя **Web Service**
3. Отвори **Logs** tab
4. Провери за:
   - `[INFO] Database URL Detection:` - дали DATABASE_URL е зареден
   - `✅ Database connection test successful` - дали връзката е успешна
   - Грешки свързани с базата данни

### 2. Провери DATABASE_URL в Render.com

1. Render.com Dashboard → Web Service → **Environment**
2. Провери дали има `DATABASE_URL` променлива
3. Провери дали connection string-ът е правилен
4. Ако е Internal URL (с `.internal`), трябва да работи без SSL

### 3. Провери Frontend настройки

Провери в `app_v2.js` дали `API_BASE` е правилен:

```javascript
// Трябва да е:
return 'https://mamafood.onrender.com';
```

### 4. Тествай директно в браузър

Отвори в браузър:
```
https://mamafood.onrender.com/api/records/KAI
```

Трябва да видиш JSON с данни.

### 5. Провери CORS настройки

В `backend-only/server_pg.js` провери дали твоят домейн е в CORS списъка:

```javascript
app.use(cors({
    origin: [
        'https://pci.inex-project.net',
        'http://pci.inex-project.net',
        'http://localhost:3000',
        'http://localhost:8000',
        'https://mamafood.onrender.com'
    ],
    credentials: true
}));
```

### 6. Провери Browser Console

1. Отвори приложението онлайн
2. Натисни **F12** за Developer Tools
3. Отвори **Console** tab
4. Провери за:
   - CORS грешки
   - Network грешки
   - API заявки които fail-ват

### 7. Тествай с curl/PowerShell

Използвай скрипта `test-kai-simple.ps1`:
```powershell
powershell -ExecutionPolicy Bypass -File test-kai-simple.ps1
```

## 🎯 Често срещани проблеми

### Проблем 1: Frontend използва локален URL
**Решение:** Провери `app_v2.js` - `getAPIBase()` функцията

### Проблем 2: CORS грешка
**Решение:** Добави домейна в CORS списъка в `server_pg.js`

### Проблем 3: DATABASE_URL не е зададен
**Решение:** Провери Environment variables в Render.com

### Проблем 4: SSL проблем
**Решение:** Кодът автоматично разпознава Internal URL и изключва SSL

## 📝 Команди за тестване

### Health Check
```powershell
Invoke-WebRequest -Uri "https://mamafood.onrender.com/api/health" -UseBasicParsing
```

### Records за KAI
```powershell
Invoke-WebRequest -Uri "https://mamafood.onrender.com/api/records/KAI" -UseBasicParsing
```

### Children за KAI
```powershell
Invoke-WebRequest -Uri "https://mamafood.onrender.com/api/children/KAI" -UseBasicParsing
```

