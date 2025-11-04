# 🔧 Каква грешка получи при `heroku create`?

## Често срещани грешки и решения:

### 1. "Name is already taken"

**Решение:** Избери друго име:
```powershell
heroku create mamafood-api-kai
# или
heroku create mamafood-gabi-kai
# или
heroku create mamafood-2024
# или за автоматично име:
heroku create
```

### 2. "Invalid name"

**Причини:** Името трябва да:
- Съдържа само малки букви, цифри и тирета
- Да започва с буква
- Да е между 3-30 символа

**Правилни имена:**
- ✅ `mamafood-api`
- ✅ `mamafood-app-2024`
- ✅ `mamafood-gabi-kai`
- ❌ `mamafood_app` (не подчертавка)
- ❌ `Mamafood` (не главни букви)
- ❌ `mamafood.app` (не точка)

### 3. "Authentication required"

**Решение:**
```powershell
heroku login
# И опитай отново
heroku create mamafood-api
```

### 4. Други грешки

**Алтернатива: Създай през Heroku Dashboard**

1. Отиди на: https://dashboard.heroku.com
2. "New" → "Create new app"
3. Име: `mamafood-api` (или друго свободно)
4. Region: United States (или Europe)
5. Натисни "Create app"

**След това в терминала:**
```powershell
heroku git:remote -a mamafood-api
```

---

## След като създадеш приложението:

### 1. Конфигурирай environment variables:

```powershell
heroku config:set DB_HOST=78.142.63.8
heroku config:set DB_USER=inex_mamafood_user
heroku config:set DB_PASSWORD=Parola_123!@#
heroku config:set DB_NAME=inex_deklarado
heroku config:set NODE_ENV=production
```

### 2. Деплой:

```powershell
git push heroku master
```

Ако получиш грешка "master branch not found", опитай:
```powershell
git branch  # Виж каква е главната branch
git push heroku main  # Ако е main
```

Или:
```powershell
git checkout -b master
git push heroku master
```

---

## Проверка:

```powershell
heroku info
heroku logs --tail
```

---

**Кажи каква точно грешка получи и ще помогна конкретно!** 🚀




