# 📘 UIK System - Пълна Документация

## 📋 Съдържание

1. [Въведение](#въведение)
2. [Какво е UIK?](#какво-е-uik)
3. [Архитектура и процеси](#архитектура-и-процеси)
4. [База данни](#база-данни)
5. [API Endpoints](#api-endpoints)
6. [Интеграция от чужди системи](#интеграция-от-чужди-системи)
7. [Безопасност](#безопасност)
8. [Примери](#примери)

---

## 🎯 Въведение

**UIK (Универсален Идентификационен Ключ)** е система за универсална идентификация на потребители и устройства. Тя позволява:

- ✅ Уникална идентификация на всеки потребител чрез UUID
- ✅ Регистрация на множество устройства към един акаунт
- ✅ Сигурна верификация чрез PIN код
- ✅ Управление на персонализирани URL адреси

---

## 🔑 Какво е UIK?

**UIK (Универсален Идентификационен Ключ)** е уникален UUID идентификатор, който:

- Генерира се автоматично при регистрация
- Служи за идентификация на потребителя в системата
- Позволява прикачване на множество устройства към един акаунт
- Свързва потребителя с неговите устройства и данни

**Формат:** UUID v4 (например: `550e8400-e29b-41d4-a716-446655440000`)

---

## 🏗️ Архитектура и процеси

### 1. Регистрация (REGISTER)

**Процес:**

1. Потребителят попълва форма с:
   - Име (задължително)
   - Личен ID - ЕГН/БУЛСТАТ (задължително)
   - PIN код (задължително)
   - Адрес (опционално)
   - Телефон (опционално)
   - Email (опционално)

2. Системата автоматично:
   - Генерира уникален UIK (UUID)
   - Хешира PIN кода (PBKDF2 с SHA-512)
   - Извлича сериен номер на устройството (device fingerprint)
   - Записва данните в базата данни

3. Резултат:
   - UIK се запазва локално в `localStorage`
   - PIN hash се запазва локално за бърза проверка
   - Устройството се регистрира автоматично

**Диаграма:**
```
[Потребител] → [Форма] → [Frontend] → [API] → [База данни]
                                      ↓
                              [Генерира UIK]
                                      ↓
                              [Хешира PIN]
                                      ↓
                              [Регистрира устройство]
                                      ↓
                              [Връща UIK]
```

### 2. Верификация (VERIFY)

**Процес:**

1. При стартиране на приложението:
   - Проверява се дали има запазен UIK в `localStorage`
   - Ако има, показва се форма за въвеждане на PIN

2. Потребителят въвежда PIN

3. Системата проверява:
   - Дали UIK съществува в базата данни
   - Дали PIN е правилен (сравнява с хеширания PIN)
   - Дали устройството е регистрирано за този UIK

4. При успешна верификация:
   - Показва се името на потребителя
   - Показва се бутон "СТАРТ" за достъп до приложението

**Диаграма:**
```
[Стартиране] → [Проверка за UIK] → [Въвеждане на PIN]
                                          ↓
                              [API Verify] → [Проверка в БД]
                                          ↓
                              [Успех] → [Достъп до приложение]
```

### 3. Прикачване на устройство (ATTACH)

**Процес:**

1. Потребителят попълва форма с:
   - Личен ID (от регистрацията)
   - PIN код
   - Устройството автоматично извлича своя device_serial

2. Системата:
   - Намира регистрацията по личен ID
   - Проверява PIN кода
   - Регистрира новото устройство към съществуващия UIK

3. Резултат:
   - Новото устройство получава достъп до същия акаунт
   - UIK се запазва локално в новото устройство

**Диаграма:**
```
[Ново устройство] → [ATTACH форма] → [API] → [Намиране по Personal ID]
                                              ↓
                                      [Проверка PIN]
                                              ↓
                                      [Регистрация устройство]
                                              ↓
                                      [Връща UIK]
```

### 4. Изчистване (RESET)

**Процес:**

1. Потребителят натиска бутон "RESET"
2. Системата:
   - Изтрива UIK от `localStorage`
   - Изтрива PIN hash от `localStorage`
   - Изтрива device_serial от `localStorage`
   - Изтрива регистрацията от базата данни (включително всички устройства и URLs)

3. Резултат:
   - Устройството е готово за нова регистрация

---

## 🗄️ База данни

### Таблица: `uik_registrations`

Съхранява основната информация за регистрацията.

| Колона | Тип | Описание |
|--------|-----|----------|
| `uik` | UUID (PRIMARY KEY) | Уникален идентификационен ключ |
| `name` | VARCHAR(255) | Име на потребителя |
| `personal_id` | VARCHAR(50) UNIQUE | Личен ID (ЕГН/БУЛСТАТ) |
| `address` | TEXT | Адрес (опционално) |
| `phone` | VARCHAR(50) | Телефон (опционално) |
| `email` | VARCHAR(255) | Email (опционално) |
| `pin_hash` | TEXT | Хеширан PIN код |
| `attach_keyword` | VARCHAR(255) | Ключова дума за прикачване (опционално) |
| `created_at` | TIMESTAMPTZ | Дата и час на създаване |

**SQL за създаване:**
```sql
CREATE TABLE IF NOT EXISTS uik_registrations (
    uik UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    personal_id VARCHAR(50) UNIQUE,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    pin_hash TEXT NOT NULL,
    attach_keyword VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Таблица: `uik_devices`

Съхранява информация за регистрираните устройства.

| Колона | Тип | Описание |
|--------|-----|----------|
| `id` | SERIAL (PRIMARY KEY) | Уникален идентификатор |
| `uik` | UUID (FOREIGN KEY) | Референция към uik_registrations |
| `device_serial` | VARCHAR(255) | Уникален сериен номер на устройството |
| `created_at` | TIMESTAMPTZ | Дата и час на регистрация |

**SQL за създаване:**
```sql
CREATE TABLE IF NOT EXISTS uik_devices (
    id SERIAL PRIMARY KEY,
    uik UUID NOT NULL REFERENCES uik_registrations(uik) ON DELETE CASCADE,
    device_serial VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (uik, device_serial)
);
```

### Таблица: `uik_urls`

Съхранява персонализирани URL адреси за всеки UIK.

| Колона | Тип | Описание |
|--------|-----|----------|
| `id` | SERIAL (PRIMARY KEY) | Уникален идентификатор |
| `uik` | UUID (FOREIGN KEY) | Референция към uik_registrations |
| `name` | VARCHAR(255) | Име на URL адреса |
| `url` | TEXT | URL адрес |
| `created_at` | TIMESTAMPTZ | Дата и час на добавяне |

**SQL за създаване:**
```sql
CREATE TABLE IF NOT EXISTS uik_urls (
    id SERIAL PRIMARY KEY,
    uik UUID NOT NULL REFERENCES uik_registrations(uik) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (uik, url)
);
```

---

## 🔌 API Endpoints

### Base URL

**Production:** `https://mamafood.onrender.com`  
**Local:** `http://localhost:3000`

Всички endpoints са под пътя `/api/uik/`

---

### 1. Регистрация на нов UIK

**Endpoint:** `POST /api/uik/register`

**Описание:** Създава нов UIK акаунт и регистрира първото устройство.

**Request Body:**
```json
{
  "name": "Иван Иванов",
  "personal_id": "1234567890",
  "address": "ул. Примерна 123",
  "phone": "0888123456",
  "email": "ivan@example.com",
  "pin": "1234",
  "attach_keyword": "ключова_дума",
  "device_serial": "nbonr0_33r..."
}
```

**Задължителни полета:**
- `name` (string) - Име на потребителя
- `personal_id` (string) - Личен ID (ЕГН/БУЛСТАТ)
- `pin` (string) - PIN код
- `device_serial` (string) - Сериен номер на устройството

**Опционални полета:**
- `address` (string) - Адрес
- `phone` (string) - Телефон
- `email` (string) - Email (валидира се форматът)
- `attach_keyword` (string) - Ключова дума за прикачване

**Response (200 OK):**
```json
{
  "success": true,
  "uik": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Регистрацията е успешна"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Име, личен ID и PIN са задължителни"
}
```

**Response (400 - Дублиран Personal ID):**
```json
{
  "error": "Вече съществува регистрация с този личен ID"
}
```

**Response (400 - Невалиден Email):**
```json
{
  "error": "Невалиден email формат"
}
```

**cURL пример:**
```bash
curl -X POST https://mamafood.onrender.com/api/uik/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Иван Иванов",
    "personal_id": "1234567890",
    "pin": "1234",
    "device_serial": "device_fingerprint_123"
  }'
```

**JavaScript пример:**
```javascript
const response = await fetch('https://mamafood.onrender.com/api/uik/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Иван Иванов',
    personal_id: '1234567890',
    pin: '1234',
    device_serial: 'device_fingerprint_123',
    address: 'ул. Примерна 123',
    phone: '0888123456',
    email: 'ivan@example.com'
  })
});

const data = await response.json();
console.log('UIK:', data.uik);
```

---

### 2. Прикачване на устройство към съществуващ UIK

**Endpoint:** `POST /api/uik/attach`

**Описание:** Прикачва ново устройство към съществуващ UIK акаунт.

**Request Body:**
```json
{
  "personal_id": "1234567890",
  "device_serial": "new_device_fingerprint",
  "pin": "1234"
}
```

**Задължителни полета:**
- `personal_id` (string) - Личен ID от регистрацията
- `device_serial` (string) - Сериен номер на новото устройство
- `pin` (string) - PIN код

**Response (200 OK):**
```json
{
  "success": true,
  "uik": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Устройството е прикачено успешно"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Личен ID, сериен номер на устройството и PIN са задължителни"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Не е намерена регистрация с този личен ID"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Невалиден PIN"
}
```

**cURL пример:**
```bash
curl -X POST https://mamafood.onrender.com/api/uik/attach \
  -H "Content-Type: application/json" \
  -d '{
    "personal_id": "1234567890",
    "device_serial": "new_device_fingerprint",
    "pin": "1234"
  }'
```

---

### 3. Верификация на UIK + устройство + PIN

**Endpoint:** `POST /api/uik/verify`

**Описание:** Проверява дали UIK, устройство и PIN са валидни.

**Request Body:**
```json
{
  "uik": "550e8400-e29b-41d4-a716-446655440000",
  "device_serial": "device_fingerprint_123",
  "pin": "1234"
}
```

**Задължителни полета:**
- `uik` (string/UUID) - UIK идентификатор
- `device_serial` (string) - Сериен номер на устройството
- `pin` (string) - PIN код

**Response (200 OK):**
```json
{
  "success": true,
  "uik": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Иван Иванов",
  "message": "Проверката е успешна"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "UIK, сериен номер на устройството и PIN са задължителни"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Не е намерена регистрация с този UIK"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Невалиден PIN"
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Устройството не е регистрирано за този UIK"
}
```

**cURL пример:**
```bash
curl -X POST https://mamafood.onrender.com/api/uik/verify \
  -H "Content-Type: application/json" \
  -d '{
    "uik": "550e8400-e29b-41d4-a716-446655440000",
    "device_serial": "device_fingerprint_123",
    "pin": "1234"
  }'
```

---

### 4. Получаване на информация за UIK

**Endpoint:** `GET /api/uik/info/:uik`

**Описание:** Връща публична информация за UIK (без чувствителни данни).

**URL Parameters:**
- `uik` (UUID) - UIK идентификатор

**Response (200 OK):**
```json
{
  "uik": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Иван Иванов",
  "created_at": "2026-01-24T10:30:00.000Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Не е намерена регистрация с този UIK"
}
```

**cURL пример:**
```bash
curl https://mamafood.onrender.com/api/uik/info/550e8400-e29b-41d4-a716-446655440000
```

---

### 5. Изтриване на UIK регистрация

**Endpoint:** `DELETE /api/uik/:uik`

**Описание:** Изтрива UIK регистрация и всички свързани данни (устройства, URLs).

**URL Parameters:**
- `uik` (UUID) - UIK идентификатор

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Регистрацията е изтрита успешно"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Не е намерена регистрация с този UIK"
}
```

**cURL пример:**
```bash
curl -X DELETE https://mamafood.onrender.com/api/uik/550e8400-e29b-41d4-a716-446655440000
```

---

### 6. Получаване на всички URLs за UIK

**Endpoint:** `GET /api/uik/:uik/urls`

**Описание:** Връща списък с всички персонализирани URL адреси за даден UIK.

**URL Parameters:**
- `uik` (UUID) - UIK идентификатор

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Billa",
    "url": "https://www.billa.bg",
    "created_at": "2026-01-24T10:30:00.000Z"
  },
  {
    "id": 2,
    "name": "Shell",
    "url": "https://www.shell.bg",
    "created_at": "2026-01-24T11:00:00.000Z"
  }
]
```

**Response (404 Not Found):**
```json
{
  "error": "Не е намерена регистрация с този UIK"
}
```

**cURL пример:**
```bash
curl https://mamafood.onrender.com/api/uik/550e8400-e29b-41d4-a716-446655440000/urls
```

---

### 7. Добавяне на URL за UIK

**Endpoint:** `POST /api/uik/:uik/urls`

**Описание:** Добавя нов персонализиран URL адрес за UIK.

**URL Parameters:**
- `uik` (UUID) - UIK идентификатор

**Request Body:**
```json
{
  "name": "Billa",
  "url": "https://www.billa.bg"
}
```

**Задължителни полета:**
- `name` (string) - Име на URL адреса
- `url` (string) - URL адрес (валидира се форматът)

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Billa",
  "url": "https://www.billa.bg",
  "created_at": "2026-01-24T10:30:00.000Z"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Име и URL са задължителни"
}
```

**Response (400 - Невалиден URL):**
```json
{
  "error": "Невалиден URL формат"
}
```

**Response (400 - Дублиран URL):**
```json
{
  "error": "Този URL вече е добавен"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Не е намерена регистрация с този UIK"
}
```

**cURL пример:**
```bash
curl -X POST https://mamafood.onrender.com/api/uik/550e8400-e29b-41d4-a716-446655440000/urls \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Billa",
    "url": "https://www.billa.bg"
  }'
```

---

### 8. Изтриване на URL за UIK

**Endpoint:** `DELETE /api/uik/:uik/urls/:id`

**Описание:** Изтрива конкретен URL адрес за UIK.

**URL Parameters:**
- `uik` (UUID) - UIK идентификатор
- `id` (integer) - ID на URL адреса

**Response (200 OK):**
```json
{
  "success": true,
  "message": "URL е изтрит успешно"
}
```

**Response (404 Not Found):**
```json
{
  "error": "URL не е намерен"
}
```

**cURL пример:**
```bash
curl -X DELETE https://mamafood.onrender.com/api/uik/550e8400-e29b-41d4-a716-446655440000/urls/1
```

---

## 🔗 Интеграция от чужди системи

### CORS Конфигурация

Backend-ът поддържа CORS за следните домейни:

- `https://pci.inex-project.net`
- `http://pci.inex-project.net`
- `https://inex-project.net`
- `http://inex-project.net`
- `http://localhost:3000`
- `http://localhost:8000`
- `https://mamafood.onrender.com`

**За да добавиш нов домейн:** Свържи се с администратора на системата.

### Аутентификация

UIK системата **не изисква** традиционна аутентификация (токени, API ключове). Вместо това:

- Всяка заявка трябва да съдържа валидни `uik`, `device_serial` и `pin`
- Верификацията се извършва при всяка заявка чрез `/api/uik/verify`

### Типичен workflow за интеграция

#### 1. Регистрация на нов потребител

```javascript
// Стъпка 1: Генерирай device_serial (device fingerprint)
const deviceSerial = generateDeviceFingerprint();

// Стъпка 2: Регистрирай потребителя
const registerResponse = await fetch('https://mamafood.onrender.com/api/uik/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Иван Иванов',
    personal_id: '1234567890',
    pin: '1234',
    device_serial: deviceSerial,
    email: 'ivan@example.com'
  })
});

const { uik } = await registerResponse.json();

// Стъпка 3: Запази UIK локално
localStorage.setItem('uik', uik);
localStorage.setItem('device_serial', deviceSerial);
```

#### 2. Верификация при стартиране

```javascript
// Стъпка 1: Провери дали има запазен UIK
const uik = localStorage.getItem('uik');
const deviceSerial = localStorage.getItem('device_serial');

if (!uik || !deviceSerial) {
  // Покажи форма за регистрация
  showRegistrationForm();
  return;
}

// Стъпка 2: Покажи форма за въвеждане на PIN
const pin = await promptForPIN();

// Стъпка 3: Верифицирай
const verifyResponse = await fetch('https://mamafood.onrender.com/api/uik/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ uik, device_serial: deviceSerial, pin })
});

if (verifyResponse.ok) {
  const { name } = await verifyResponse.json();
  // Потребителят е верифициран успешно
  showMainApplication(name);
} else {
  // Грешен PIN или невалидно устройство
  showError('Невалиден PIN или устройство');
}
```

#### 3. Използване на UIK в други API заявки

```javascript
// При всяка заявка към други endpoints, използвай UIK като идентификатор
const uik = localStorage.getItem('uik');

// Пример: Получаване на данни за потребителя
const userDataResponse = await fetch(`https://mamafood.onrender.com/api/users/${uik}`, {
  headers: {
    'X-UIK': uik  // Ако другите endpoints изискват UIK header
  }
});
```

### Генериране на Device Serial

**Важно:** Всеки клиент трябва да генерира уникален `device_serial` за всяко устройство.

**JavaScript пример:**
```javascript
function generateDeviceFingerprint() {
  // Опит за използване на съществуващ fingerprint
  let fingerprint = localStorage.getItem('device_fingerprint');
  if (fingerprint) return fingerprint;
  
  // Генериране на нов fingerprint
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Device fingerprint', 2, 2);
  
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ];
  
  // Хеширане на компонентите
  fingerprint = hashString(components.join('|'));
  
  // Запазване за следващи използвания
  localStorage.setItem('device_fingerprint', fingerprint);
  
  return fingerprint;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'device_' + Math.abs(hash).toString(36);
}
```

**Python пример:**
```python
import hashlib
import platform
import getpass

def generate_device_fingerprint():
    # Компоненти за fingerprint
    components = [
        platform.system(),
        platform.release(),
        platform.machine(),
        getpass.getuser(),
        str(platform.processor())
    ]
    
    # Хеширане
    fingerprint_string = '|'.join(components)
    hash_object = hashlib.sha256(fingerprint_string.encode())
    fingerprint = 'device_' + hash_object.hexdigest()[:16]
    
    return fingerprint
```

---

## 🔒 Безопасност

### PIN Хеширане

PIN кодовете **никога не се съхраняват** в plain text. Използва се:

- **Алгоритъм:** PBKDF2
- **Hash функция:** SHA-512
- **Итерации:** 10,000
- **Salt:** Случаен 16-байтов salt за всеки PIN

**Пример:**
```
PIN: "1234"
Salt: "a1b2c3d4e5f6g7h8"
Hash: "a1b2c3d4e5f6g7h8:abc123def456..."
```

### HTTPS

**Важно:** В production винаги използвай HTTPS за всички API заявки.

### CORS

Backend-ът поддържа CORS само за предварително одобрени домейни. За да добавиш нов домейн, свържи се с администратора.

### Валидация

- **Email:** Валидира се форматът (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- **URL:** Валидира се чрез JavaScript `URL` конструктор
- **Personal ID:** Уникалност се проверява при регистрация

### Rate Limiting

**Забележка:** В момента няма rate limiting. Препоръчително е да се добави за production.

---

## 📝 Примери

### Пълна интеграция - JavaScript

```javascript
class UIKClient {
  constructor(apiBase = 'https://mamafood.onrender.com') {
    this.apiBase = apiBase;
  }
  
  // Генериране на device serial
  getDeviceSerial() {
    let serial = localStorage.getItem('device_serial');
    if (serial) return serial;
    
    // Генериране на нов
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    serial = this.hashString(fingerprint);
    localStorage.setItem('device_serial', serial);
    return serial;
  }
  
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'device_' + Math.abs(hash).toString(36);
  }
  
  // Регистрация
  async register(userData) {
    const response = await fetch(`${this.apiBase}/api/uik/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...userData,
        device_serial: this.getDeviceSerial()
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    const data = await response.json();
    localStorage.setItem('uik', data.uik);
    return data;
  }
  
  // Верификация
  async verify(pin) {
    const uik = localStorage.getItem('uik');
    const deviceSerial = this.getDeviceSerial();
    
    if (!uik || !deviceSerial) {
      throw new Error('UIK или device serial не са намерени');
    }
    
    const response = await fetch(`${this.apiBase}/api/uik/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uik, device_serial: deviceSerial, pin })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return await response.json();
  }
  
  // Прикачване
  async attach(personalId, pin) {
    const response = await fetch(`${this.apiBase}/api/uik/attach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personal_id: personalId,
        device_serial: this.getDeviceSerial(),
        pin
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    const data = await response.json();
    localStorage.setItem('uik', data.uik);
    return data;
  }
  
  // Получаване на информация
  async getInfo() {
    const uik = localStorage.getItem('uik');
    if (!uik) throw new Error('UIK не е намерен');
    
    const response = await fetch(`${this.apiBase}/api/uik/info/${uik}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return await response.json();
  }
  
  // Добавяне на URL
  async addURL(name, url) {
    const uik = localStorage.getItem('uik');
    if (!uik) throw new Error('UIK не е намерен');
    
    const response = await fetch(`${this.apiBase}/api/uik/${uik}/urls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return await response.json();
  }
  
  // Получаване на URLs
  async getURLs() {
    const uik = localStorage.getItem('uik');
    if (!uik) throw new Error('UIK не е намерен');
    
    const response = await fetch(`${this.apiBase}/api/uik/${uik}/urls`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return await response.json();
  }
  
  // Изтриване на URL
  async deleteURL(urlId) {
    const uik = localStorage.getItem('uik');
    if (!uik) throw new Error('UIK не е намерен');
    
    const response = await fetch(`${this.apiBase}/api/uik/${uik}/urls/${urlId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return await response.json();
  }
  
  // Reset
  async reset() {
    const uik = localStorage.getItem('uik');
    if (!uik) return;
    
    await fetch(`${this.apiBase}/api/uik/${uik}`, {
      method: 'DELETE'
    });
    
    localStorage.removeItem('uik');
    localStorage.removeItem('device_serial');
    localStorage.removeItem('pin_hash');
  }
}

// Използване
const uik = new UIKClient();

// Регистрация
try {
  const result = await uik.register({
    name: 'Иван Иванов',
    personal_id: '1234567890',
    pin: '1234',
    email: 'ivan@example.com'
  });
  console.log('Регистриран UIK:', result.uik);
} catch (error) {
  console.error('Грешка при регистрация:', error.message);
}

// Верификация
try {
  const result = await uik.verify('1234');
  console.log('Верифициран като:', result.name);
} catch (error) {
  console.error('Грешка при верификация:', error.message);
}
```

### Python пример

```python
import requests
import hashlib
import platform
import getpass
import json

class UIKClient:
    def __init__(self, api_base='https://mamafood.onrender.com'):
        self.api_base = api_base
        self.uik = None
        self.device_serial = self.get_device_serial()
    
    def get_device_serial(self):
        """Генерира или връща device serial"""
        # В реална ситуация би трябвало да се запазва в конфигурационен файл
        components = [
            platform.system(),
            platform.release(),
            platform.machine(),
            getpass.getuser()
        ]
        fingerprint = '|'.join(components)
        hash_object = hashlib.sha256(fingerprint.encode())
        return 'device_' + hash_object.hexdigest()[:16]
    
    def register(self, name, personal_id, pin, **kwargs):
        """Регистрира нов UIK"""
        url = f'{self.api_base}/api/uik/register'
        data = {
            'name': name,
            'personal_id': personal_id,
            'pin': pin,
            'device_serial': self.device_serial,
            **kwargs
        }
        
        response = requests.post(url, json=data)
        response.raise_for_status()
        
        result = response.json()
        self.uik = result['uik']
        return result
    
    def verify(self, pin):
        """Верифицира UIK + device + PIN"""
        if not self.uik:
            raise ValueError('UIK не е зададен')
        
        url = f'{self.api_base}/api/uik/verify'
        data = {
            'uik': self.uik,
            'device_serial': self.device_serial,
            'pin': pin
        }
        
        response = requests.post(url, json=data)
        response.raise_for_status()
        
        return response.json()
    
    def attach(self, personal_id, pin):
        """Прикачва устройство към съществуващ UIK"""
        url = f'{self.api_base}/api/uik/attach'
        data = {
            'personal_id': personal_id,
            'device_serial': self.device_serial,
            'pin': pin
        }
        
        response = requests.post(url, json=data)
        response.raise_for_status()
        
        result = response.json()
        self.uik = result['uik']
        return result

# Използване
client = UIKClient()

# Регистрация
try:
    result = client.register(
        name='Иван Иванов',
        personal_id='1234567890',
        pin='1234',
        email='ivan@example.com'
    )
    print(f'Регистриран UIK: {result["uik"]}')
except requests.exceptions.HTTPError as e:
    print(f'Грешка: {e.response.json()["error"]}')

# Верификация
try:
    result = client.verify('1234')
    print(f'Верифициран като: {result["name"]}')
except requests.exceptions.HTTPError as e:
    print(f'Грешка: {e.response.json()["error"]}')
```

---

## 📞 Поддръжка

За въпроси и поддръжка, свържи се с администратора на системата.

---

## 📄 Версия

**Версия на документацията:** 1.0  
**Дата:** 24 януари 2026  
**Последна актуализация:** 24 януари 2026

---

## 📚 Допълнителни ресурси

- [GitHub Repository](https://github.com/userite/mamafood)
- [API Base URL](https://mamafood.onrender.com)
- [Health Check](https://mamafood.onrender.com/api/health)

---

**© 2026 МАМАФООД - UIK System**
