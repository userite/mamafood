# МАМАФООД - Backend API

## Локално стартиране

### 1. Инсталиране на зависимости
```bash
npm install
```

### 2. Конфигурация на база данни

Създай `.env` файл в root директорията с:
```
DATABASE_URL=postgresql://username:password@localhost:5432/mamafood
PORT=3000
VAPID_PUBLIC=твоят_публичен_ключ
VAPID_PRIVATE=твоят_частен_ключ
```

**Варианти за база данни:**
- **Локална PostgreSQL**: Инсталирай PostgreSQL и създай база `mamafood`
- **Render.com**: Вземи connection string от Render dashboard
- **Друг cloud provider**: Използвай техния connection string

### 3. Стартиране на backend сървъра
```bash
npm start
# или
npm run dev
```

Сървърът ще стартира на `http://localhost:3000`

### 4. Стартиране на frontend

Frontend-ът е статичен HTML/JS/CSS. Можеш да го отвориш по няколко начина:

**Вариант 1: Директно отвори файла**
- Отвори `index.html` в браузър
- Frontend-ът ще се опита да се свърже с `http://localhost:3000`

**Вариант 2: Използвай прост HTTP сървър**
```bash
# С Python (ако е инсталиран)
python -m http.server 8000

# Или с Node.js http-server (инсталирай глобално: npm install -g http-server)
http-server -p 8000
```

След това отвори `http://localhost:8000` в браузър.

### 5. Проверка

- Backend health check: `http://localhost:3000/api/health`
- Frontend: `http://localhost:8000` (ако използваш HTTP сървър)

## Deploy на Render.com

Виж `render.yaml` за автоматизиран deploy.

