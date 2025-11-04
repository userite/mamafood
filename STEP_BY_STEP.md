# 🎯 Стъпка по стъпка деплой - Railway.app

## Стъпка 1: Приготви файловете за GitHub

### 1.1. Провери че имаш `backend-only/` папка

Трябва да имаш:
```
backend-only/
├── server.js
├── package.json
├── Procfile
└── README.md (опционално)
```

### 1.2. Отвори PowerShell в `backend-only/` папката

```powershell
cd C:\~ip\app-dblib\cursor_projects\Gabi_and_Kai\backend-only
```

### 1.3. Провери че файловете са там

```powershell
dir
```

Трябва да видиш: `server.js`, `package.json`, `Procfile`

---

## Стъпка 2: Създай GitHub Repository

### 2.1. Отвори браузър

Отиди на: **https://github.com**

### 2.2. Логни се (или създай акаунт)

- Ако нямаш акаунт: "Sign up"
- Ако имаш: "Sign in"

### 2.3. Създай нов repository

1. Натисни **"+"** (горе в дясно)
2. Избери **"New repository"**
3. Попълни:
   - **Repository name:** `mamafood-backend`
   - **Description:** (опционално) `Backend for МАМАФООД`
   - **Public** или **Private** (както ти е удобно)
   - ❌ **НЕ** тиквай: "Add a README file"
   - ❌ **НЕ** тиквай: "Add .gitignore"
   - ❌ **НЕ** тиквай: "Choose a license"
4. Натисни **"Create repository"**

### 2.4. Качи файловете на GitHub

GitHub ще покаже инструкции. Използвай **"...or push an existing repository from the command line"**

В PowerShell (все още в `backend-only/`):

```powershell
# Ако вече има git, провери:
git status

# Ако НЕ е инициализиран git:
git init

# Добави файловете:
git add .

# Commit:
git commit -m "Initial commit"

# Добави remote (ЗАМЕНИ 'твоето-име' с твоя GitHub username):
git remote add origin https://github.com/твоето-име/mamafood-backend.git

# Push:
git branch -M main
git push -u origin main
```

**Ако те пита за парола:**
- GitHub вече не приема пароли
- Трябва Personal Access Token
- Или използвай GitHub Desktop (по-лесно)

**Алтернатива: Качи файловете през браузъра:**
1. В GitHub repository страницата
2. Натисни **"uploading an existing file"**
3. Drag & drop файловете:
   - `server.js`
   - `package.json`
   - `Procfile`
4. Натисни **"Commit changes"**

---

## Стъпка 3: Създай Railway акаунт

### 3.1. Отвори Railway

Отиди на: **https://railway.app**

### 3.2. Sign up

1. Натисни **"Start a New Project"**
2. Избери **"Continue with GitHub"**
3. Разреши достъп до GitHub (Railway ще иска да вижда твоите repositories)

---

## Стъпка 4: Деплой на Railway

### 4.1. Създай нов проект

1. В Railway Dashboard, натисни **"New Project"**
2. Избери **"Deploy from GitHub repo"**
3. Избери repository: `mamafood-backend`
4. Railway ще започне автоматично да деплоира

### 4.2. Изчакай деплоя

- Ще видиш логове: "Installing dependencies..."
- После: "Starting..."
- Изчакай 1-2 минути

### 4.3. Провери грешки (ако има)

Ако има червени съобщения в логовете:
- Провери че имаш `package.json`
- Провери че имаш `Procfile` с: `web: node server.js`

---

## Стъпка 5: Конфигурирай Database

### 5.1. Отвори Variables

1. В Railway Dashboard, кликни на твоето приложение
2. Отиди на **"Variables"** tab (горе)

### 5.2. Добави променливи

Натисни **"+ New Variable"** за всяка една:

1. **Name:** `DB_HOST`
   **Value:** `78.142.63.8`
   Натисни **"Add"**

2. **Name:** `DB_USER`
   **Value:** `inex_mamafood_user`
   Натисни **"Add"**

3. **Name:** `DB_PASSWORD`
   **Value:** `Parola_123!@#`
   Натисни **"Add"**

4. **Name:** `DB_NAME`
   **Value:** `inex_deklarado`
   Натисни **"Add"**

5. **Name:** `NODE_ENV`
   **Value:** `production`
   Onтисни **"Add"**

### 5.3. Рестартирай

Railway автоматично рестартира след всяка промяна, но ако има проблем:
- Settings → **"Redeploy"**

---

## Стъпка 6: Запиши URL

### 6.1. Намери URL-а

1. В Railway Dashboard
2. Отиди на **"Settings"** tab
3. Скрол до **"Domains"** секция
4. Намери **"Generated Domain"**
5. Копирай URL-а (напр. `https://mamafood-production.up.railway.app`)

### 6.2. Тествай

Отвори в браузър: `https://твоят-url.up.railway.app/api/health`

Трябва да видиш: `{"status":"ok","timestamp":"..."}`

✅ **Ако работи - backend е готов!**

---

## Стъпка 7: Промени frontend

### 7.1. Отвори `app.js`

Отвори: `C:\~ip\app-dblib\cursor_projects\Gabi_and_Kai\app.js`

### 7.2. Намери реда с API_BASE

Намери (около ред 170):
```javascript
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://ТВОЯТ-BACKEND-URL';
```

### 7.3. Промени

Замени `'https://ТВОЯТ-BACKEND-URL'` с твоя Railway URL:

```javascript
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://твоят-url.up.railway.app';  // <-- ТУК!
```

### 7.4. Запиши файла

Ctrl+S

---

## Стъпка 8: Качи frontend на сървъра

### 8.1. Отвори FTP клиент

Използвай FileZilla или твоя FTP клиент

### 8.2. Свържи се с `pci.inex-project.net`

### 8.3. Качи файловете

Качи в `/public_html/` или `/public_html/mamafood/`:
- ✅ `index.html`
- ✅ `app.js` (вече с Railway URL)
- ✅ `styles.css`
- ✅ `i18n.js`
- ✅ `manifest.json`
- ✅ `service-worker.js`

---

## Стъпка 9: Тествай цялото приложение

### 9.1. Отвори frontend

Отвори: `https://pci.inex-project.net/mamafood/`

### 9.2. Провери конзолата (F12)

Не трябва да има CORS грешки

### 9.3. Тествай

- Добави запис
- Редактирай запис
- Изтрий запис

---

## ✅ Готово!

Ако има проблем - кажи на коя стъпка и ще помогна! 🚀

---

## 🆘 Често срещани проблеми:

### GitHub не приема парола при push?

**Решение:** Създай Personal Access Token
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token"
3. Дай име, избери "repo" permissions
4. Копирай токена
5. Използвай го като парола при push

**Или използвай GitHub Desktop:**
- Сваляш от https://desktop.github.com
- Много по-лесно за качване на файлове!

### Railway не вижда Node.js?

**Провери:**
- Имаш ли `package.json`?
- В `package.json` има ли `"main": "server.js"`?

### Database connection failed?

**Провери:**
- Environment variables в Railway (Stеp 5)
- Дали MySQL сървърът (78.142.63.8) позволява връзки от Railway IP адреси

### Frontend не работи?

**Провери:**
- Дали `API_BASE` в `app.js` е променен на Railway URL
- Дали файловете са качени правилно на сървъра
- Конзолата (F12) за грешки




