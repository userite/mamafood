# МАМАФООД Backend API

Backend сървър за МАМАФООД приложението.

## 🚀 Стартиране

```bash
npm install
npm start
```

Сървърът стартира на: **http://localhost:3000**

## 📋 API Endpoints

### Health Check
- `GET /api/health` - Проверка на състоянието на сървъра

### Records
- `GET /api/records/:child_code` - Вземи всички записи за дете
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

## 🗄️ Database

База данни: **MySQL**
- Host: `78.142.63.8` (или от environment variable `DB_HOST`)
- Database: `inex_deklarado` (или от environment variable `DB_NAME`)
- User: `inex_mamafood_user` (или от environment variable `DB_USER`)

## 🔧 Environment Variables

```bash
PORT=3000                    # Порт на сървъра (по подразбиране: 3000)
DB_HOST=78.142.63.8          # MySQL host
DB_USER=inex_mamafood_user   # MySQL user
DB_PASSWORD=...              # MySQL password
DB_NAME=inex_deklarado      # MySQL database name
DB_SSL=true                  # SSL за cloud MySQL (PlanetScale, Railway) - опционално
VAPID_PUBLIC=...             # VAPID публичен ключ
VAPID_PRIVATE=...            # VAPID private ключ
```

### Пример за PlanetScale:
```bash
DB_HOST=aws.connect.psdb.cloud
DB_USER=xxxxx
DB_PASSWORD=xxxxx
DB_NAME=mamafood
DB_SSL=true
```

### Пример за Railway:
```bash
DB_HOST=containers-us-west-xxx.railway.app
DB_USER=root
DB_PASSWORD=xxxxx
DB_NAME=railway
DB_SSL=true
```

## 📦 Deployment

Файловете са готови за деплой на:
- Railway.app
- Render.com
- Heroku (платен)
- Други Node.js hosting платформи

**Важно:** Настрой environment variables преди деплой!

