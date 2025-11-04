# 🌐 Алтернатива: Създаване през Heroku Dashboard (БЕЗ терминал)

Ако командата `heroku create` не работи, можеш да създадеш приложението през браузъра:

## Стъпка 1: Отиди на Heroku Dashboard

1. Отвори: https://dashboard.heroku.com
2. Логни се с твоя акаунт

## Стъпка 2: Създай ново приложение

1. Натисни **"New"** (горе в дясно)
2. Избери **"Create new app"**
3. Попълни:
   - **App name:** `mamafood-api` (или друго свободно име)
   - **Region:** United States (или Europe)
4. Натисни **"Create app"**

## Стъпка 3: Свържи Git (в терминала)

В PowerShell, в `backend-only/` директорията:

```powershell
heroku git:remote -a mamafood-api
```

(Замени `mamafood-api` с името което избра)

## Стъпка 4: Конфигурирай Environment Variables (в Dashboard)

В Heroku Dashboard, в твоето приложение:

1. Отиди на **"Settings"**
2. Скрол до **"Config Vars"**
3. Натисни **"Reveal Config Vars"**
4. Добави един по един:
   - **KEY:** `DB_HOST` → **VALUE:** `78.142.63.8`
   - **KEY:** `DB_USER` → **VALUE:** `inex_mamafood_user`
   - **KEY:** `DB_PASSWORD` → **VALUE:** `Parola_123!@#`
   - **KEY:** `DB_NAME` → **VALUE:** `inex_deklarado`
   - **KEY:** `NODE_ENV` → **VALUE:** `production`

## Стъпка 5: Деплой (в терминала)

```powershell
git push heroku master
```

Или ако използваш `main` branch:
```powershell
git push heroku main
```

---

## Алтернатива 2: Деплой чрез GitHub

Ако не искаш да използваш терминала:

1. Качи `backend-only/` на GitHub
2. В Heroku Dashboard → Deploy
3. Connect to GitHub
4. Избери repository
5. Натисни "Deploy Branch"

---

**Това е по-лесно за някои хора!** 🎯




