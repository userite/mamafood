# 🚀 Бърза инструкция за деплой

## Без Node.js на сървъра? Няма проблем!

### Решение: Разделено разположение

**Frontend** (статични файлове) → `pci.inex-project.net`  
**Backend** (Node.js) → `Heroku` / `Railway` / `Render` (безплатно)

---

## Стъпки:

### 1️⃣ Backend на Railway.app (5 минути) ⭐ ПРЕПОРЪЧВАМ!

⚠️ **Heroku вече изисква payment method!** Railway е **100% безплатно** и по-лесно!

1. Отиди на https://railway.app → Sign up с GitHub
2. "New Project" → "Deploy from GitHub repo"
3. Избери repository с `backend-only/` файловете
4. Railway автоматично разпознава Node.js
5. Settings → Variables → добави:
   - `DB_HOST=78.142.63.8`
   - `DB_USER=inex_mamafood_user`
   - `DB_PASSWORD=Parola_123!@#`
   - `DB_NAME=inex_deklarado`
   - `NODE_ENV=production`
6. Запиши URL (като `https://xxx.up.railway.app`)

📖 **Пълна инструкция:** Виж `DEPLOY_FREE.md`

### 2️⃣ Промени frontend

В `app.js`, намери и промени (около ред 170):
```javascript
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://xxx.up.railway.app';  // <-- ТВОЯТ Railway URL!
```
(Смени на твоя Railway URL)

### 3️⃣ Качи frontend на pci.inex-project.net

Чрез FTP качи:
- `index.html`
- `app.js` (с променени API_BASE)
- `styles.css`
- `i18n.js`
- `manifest.json`
- `service-worker.js`

В директория `/public_html/` или `/public_html/mamafood/`

### 4️⃣ Готово!

Отвори: `https://pci.inex-project.net/mamafood/`

---

## Детайлни инструкции:

📖 **DEPLOY_SPLIT.md** - Пълна инструкция за разделено разположение  
📖 **DEPLOY_CPANEL.md** - Инструкция за cPanel (ако има Node.js)  
📖 **DEPLOY_PCI.md** - Инструкция за SSH достъп

---

## Алтернативи (всички безплатни, без payment method):

- 🏆 **Railway** (https://railway.app) - НАЙ-ЛЕСНО, автоматично HTTPS, 500ч/месец безплатно
- ✅ **Render** (https://render.com) - Лесно, автоматично HTTPS
- ✅ **Fly.io** (https://fly.io) - Бързо, глобално разпределение

⚠️ **Heroku вече изисква payment method** - затова препоръчвам Railway!

📖 **Подробности:** Виж `DEPLOY_FREE.md` или `RAILWAY_QUICK.md`

---

## Структура:

```
Проект/
├── backend-only/          → Качи на Railway/Render/Fly.io (безплатно!)
│   ├── server.js
│   ├── package.json
│   └── Procfile
│
└── Frontend файлове/      → Качи на pci.inex-project.net
    ├── index.html
    ├── app.js           (с променен API_BASE)
    ├── styles.css
    ├── i18n.js
    ├── manifest.json
    └── service-worker.js
```

---

Готово! 🎉

