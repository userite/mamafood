# 🚀 Инструкция за разположение на pci.inex-project.net

## Стъпки за качване и стартиране

### 1. Подготовка на файловете локално

Убеди се че имаш всички файлове:
- ✅ `server.js`
- ✅ `package.json`
- ✅ `index.html`
- ✅ `app.js`
- ✅ `styles.css`
- ✅ `i18n.js`
- ✅ `manifest.json`
- ✅ `service-worker.js`
- ✅ `Procfile` (опционално)
- ✅ `DEPLOY.md`

### 2. SSH свързване със сървъра

**Windows:**
```powershell
# Инсталирай PuTTY или използвай Windows Terminal/SSH
ssh root@pci.inex-project.net
# или
ssh твоят_потребител@pci.inex-project.net
```

**Mac/Linux:**
```bash
ssh root@pci.inex-project.net
```

### 3. Създаване на директория на сървъра

```bash
# Направи директория за приложението
mkdir -p /var/www/mamafood
cd /var/www/mamafood

# Или използвай друга директория според нуждите ти
```

### 4. Качване на файловете

**Вариант A: SCP (от Windows PowerShell или Linux/Mac)**

```powershell
# От локалната машина (Windows PowerShell)
scp -r * root@pci.inex-project.net:/var/www/mamafood/

# Или отделни файлове:
scp server.js package.json index.html app.js styles.css i18n.js manifest.json service-worker.js root@pci.inex-project.net:/var/www/mamafood/
```

**Вариант B: FTP/SFTP клиент (FileZilla, WinSCP)**

1. Инсталирай FileZilla или WinSCP
2. Свържи се към: `pci.inex-project.net`
3. Качи всички файлове в `/var/www/mamafood/`

**Вариант C: Git (ако имаш git repository)**

```bash
# На сървъра
cd /var/www/mamafood
git clone https://твоят-git-repo.git .
# или
git pull
```

### 5. Инсталация на Node.js (ако не е инсталиран)

```bash
# Провери дали Node.js е инсталиран
node --version

# Ако не е, инсталирай:
# За Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Или за CentOS/RHEL:
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Провери версията
node --version  # трябва да покаже v18.x или по-висока
npm --version
```

### 6. Инсталация на зависимости

```bash
cd /var/www/mamafood
npm install
```

Това ще инсталира:
- `express`
- `mysql2`
- `cors`
- `web-push`

### 7. Конфигуриране на приложението

**Промени `server.js` за production:**

Провери дали database конфигурацията е правилна в `server.js`:
```javascript
const dbConfig = {
    host: process.env.DB_HOST || '78.142.63.8',  // Твоят MySQL хост
    user: process.env.DB_USER || 'inex_mamafood_user',
    password: process.env.DB_PASSWORD || 'Parola_123!@#',
    database: process.env.DB_NAME || 'inex_deklarado',
    // ...
};
```

**Промени `app.js` за production URL:**

Намери реда с `API_BASE` в `app.js` и промени го:
```javascript
// Преди:
const API_BASE = window.location.origin;

// След (ако искаш да упоменаш конкретен URL):
const API_BASE = 'https://pci.inex-project.net' || window.location.origin;
```

### 8. Стартиране на приложението

#### Вариант A: Директно стартиране (за тест)

```bash
cd /var/www/mamafood
node server.js
```

Приложението ще работи на порт 3000, но само докато SSH сесията е отворена.

#### Вариант B: PM2 (Препоръчително - за production)

```bash
# Инсталирай PM2 глобално
npm install -g pm2

# Стартирай приложението
cd /var/www/mamafood
pm2 start server.js --name mamafood

# Запази конфигурацията
pm2 save

# Направи PM2 да стартира автоматично при рестарт на сървъра
pm2 startup
# Изпълни командата която ще изпише (ще изглежда така):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u твоят_потребител --hp /home/твоят_потребител
```

**PM2 команди:**
```bash
pm2 list              # Виж всички процеси
pm2 logs mamafood      # Виж логове
pm2 restart mamafood  # Рестартирай
pm2 stop mamafood      # Спри
pm2 delete mamafood    # Изтрий
```

### 9. Конфигуриране на Nginx (за домейн и HTTPS)

**Ако искаш да имаш домейн и HTTPS:**

```bash
# Инсталирай Nginx
sudo apt-get update
sudo apt-get install nginx

# Създай конфигурация
sudo nano /etc/nginx/sites-available/mamafood
```

**Добави в конфигурацията:**
```nginx
server {
    listen 80;
    server_name pci.inex-project.net;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Активирай конфигурацията:**
```bash
sudo ln -s /etc/nginx/sites-available/mamafood /etc/nginx/sites-enabled/
sudo nginx -t  # Тест на конфигурацията
sudo systemctl restart nginx
```

### 10. SSL сертификат (HTTPS - задължително за push notifications!)

**Използвай Certbot (Let's Encrypt):**

```bash
# Инсталирай Certbot
sudo apt-get install certbot python3-certbot-nginx

# Получи SSL сертификат
sudo certbot --nginx -d pci.inex-project.net

# Автоматично обновяване
sudo certbot renew --dry-run
```

### 11. Файрвол (ако е необходимо)

```bash
# Отвори порт 3000 само за localhost (не е нужно да се отваря публично, ако използваш Nginx)
sudo ufw allow 3000/tcp
# Или ако не използваш Nginx:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 12. Тестване

1. **Отвори браузър:**
   - Без Nginx: `http://pci.inex-project.net:3000`
   - С Nginx: `http://pci.inex-project.net` или `https://pci.inex-project.net`

2. **Провери дали работи:**
   - Виж дали се зарежда страницата
   - Провери конзолата за грешки (F12)
   - Опитай да добавиш запис

3. **Провери PM2:**
   ```bash
   pm2 logs mamafood
   ```

### 13. Осигуряване на MySQL достъп

**Важно:** Убеди се, че MySQL сървърът позволява връзки от `pci.inex-project.net`:

```sql
-- В MySQL сървъра (78.142.63.8)
CREATE USER IF NOT EXISTS 'inex_mamafood_user'@'pci.inex-project.net' IDENTIFIED BY 'Parola_123!@#';
GRANT ALL PRIVILEGES ON inex_deklarado.* TO 'inex_mamafood_user'@'pci.inex-project.net';

-- Или за всякакви хостове:
GRANT ALL PRIVILEGES ON inex_deklarado.* TO 'inex_mamafood_user'@'%';
FLUSH PRIVILEGES;
```

### 14. Environment Variables (опционално)

**За production, използвай environment variables:**

```bash
# Създай файл за environment variables
cd /var/www/mamafood
nano .env
```

**Добави:**
```
DB_HOST=78.142.63.8
DB_USER=inex_mamafood_user
DB_PASSWORD=Parola_123!@#
DB_NAME=inex_deklarado
PORT=3000
NODE_ENV=production
```

**За да използваш .env файл, инсталирай dotenv:**
```bash
npm install dotenv
```

**И добави в началото на `server.js`:**
```javascript
require('dotenv').config();
```

### 15. Проверка и отстраняване на проблеми

**Ако има проблеми:**

1. **Провери логовете:**
   ```bash
   pm2 logs mamafood
   # или
   tail -f /var/log/nginx/error.log
   ```

2. **Провери дали процесът работи:**
   ```bash
   pm2 list
   ps aux | grep node
   ```

3. **Провери портове:**
   ```bash
   netstat -tlnp | grep 3000
   # или
   ss -tlnp | grep 3000
   ```

4. **Провери дали Node.js работи:**
   ```bash
   node -v
   npm -v
   ```

### 16. Обновяване на приложението

**При следваща промяна:**

```bash
# 1. Качи новите файлове (SCP, FTP, или Git pull)
cd /var/www/mamafood
# git pull  # ако използваш Git

# 2. Инсталирай нови зависимости (ако има)
npm install

# 3. Рестартирай с PM2
pm2 restart mamafood

# 4. Провери логовете
pm2 logs mamafood --lines 50
```

---

## Бърза референция (cheat sheet)

```bash
# SSH свързване
ssh root@pci.inex-project.net

# Навигиране
cd /var/www/mamafood

# PM2 управление
pm2 start server.js --name mamafood
pm2 restart mamafood
pm2 stop mamafood
pm2 logs mamafood
pm2 list

# Nginx управление
sudo systemctl restart nginx
sudo nginx -t

# Проверка на портове
netstat -tlnp | grep 3000

# Качване на файлове (от локална машина)
scp -r * root@pci.inex-project.net:/var/www/mamafood/
```

---

## Подсказки за сигурност

1. **Не качвай `node_modules/`** - инсталирай ги на сървъра с `npm install`
2. **Използвай `.gitignore`** за да не качваш чувствителни файлове
3. **Промени паролите** от дефолтните
4. **Използвай HTTPS** за push notifications
5. **Ограничи достъпа** до MySQL само от нужните хостове

---

## Подкрепа

Ако имаш проблеми:
1. Провери логовете: `pm2 logs mamafood`
2. Провери дали MySQL сървърът е достъпен
3. Провери firewall настройките
4. Провери дали порт 3000 е свободен (или използвай друг порт)

**Готово! 🎉**




