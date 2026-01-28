// ============================================
// МАМАФООД Backend Server
// Express API server for PostgreSQL database
// ВЕРСИЯ 2: Коригирани CREATE TABLE заявки
// ============================================

// Зареждане на .env файл (ако съществува)
try {
    require('dotenv').config();
} catch (e) {
    // dotenv не е инсталиран, но това е OK в production
}

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const webpush = require('web-push');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Configuration
// ============================================

// Проверка на DATABASE_URL
if (!process.env.DATABASE_URL) {
    console.error('❌ ГРЕШКА: DATABASE_URL не е зададен!');
    console.error('   Създай .env файл с: DATABASE_URL=postgresql://username:password@host:port/database');
    console.error('   Или задай environment variable DATABASE_URL');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : {
        rejectUnauthorized: false
    }
});

// ============================================
// Database Initialization
// ============================================

const initializeDatabase = async () => {
    let client;
    try {
        console.log('Опит за свързване с базата данни...');
        client = await pool.connect();
        console.log('✅ Database connection successful. Initializing tables...');

        // Таблица 1: push_subscriptions
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS push_subscriptions (
                    id SERIAL PRIMARY KEY,
                    child_code VARCHAR(50) NOT NULL,
                    endpoint TEXT NOT NULL,
                    p256dh VARCHAR(255) NOT NULL,
                    auth VARCHAR(255) NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE (child_code, endpoint)
                );
            `);
            console.log('✅ Table "push_subscriptions" is ready.');
        } catch (e) {
            console.error('❌ Failed ensuring "push_subscriptions" table:', e.message);
        }

        // Таблица 2: children
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS children (
                    child_code VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(255),
                    last_accessed TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ Table "children" is ready.');
        } catch (e) {
            console.error('❌ Failed ensuring "children" table:', e.message);
        }

        // Таблица 3: records
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS records (
                    id SERIAL PRIMARY KEY,
                    child_code VARCHAR(50) REFERENCES children(child_code) ON DELETE CASCADE,
                    record_number INT NOT NULL,
                    amount NUMERIC(10, 2) NOT NULL,
                    situation TEXT,
                    datetime TIMESTAMPTZ NOT NULL,
                    notes TEXT
                );
            `);
            console.log('✅ Table "records" is ready.');
        } catch (e) {
            console.error('❌ Failed ensuring "records" table:', e.message);
        }
        
        // Таблица 4: device_access
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS device_access (
                    id SERIAL PRIMARY KEY,
                    child_code VARCHAR(50) REFERENCES children(child_code) ON DELETE CASCADE,
                    device_id VARCHAR(255) NOT NULL,
                    device_name VARCHAR(255),
                    last_sync TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE (child_code, device_id)
                );
            `);
            console.log('✅ Table "device_access" is ready.');
        } catch (e) {
            console.error('❌ Failed ensuring "device_access" table:', e.message);
        }

        // Таблица 5: uik_registrations
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS uik_registrations (
                    uik UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    personal_id VARCHAR(50) NOT NULL,
                    address TEXT,
                    phone VARCHAR(50),
                    email VARCHAR(255),
                    pin_hash VARCHAR(255) NOT NULL,
                    attach_keyword VARCHAR(100),
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE (personal_id)
                );
            `);
            console.log('✅ Table "uik_registrations" is ready.');
            
            // Добавяне на email колона ако не съществува (за съвместимост с вече създадени таблици)
            try {
                await client.query(`
                    ALTER TABLE uik_registrations 
                    ADD COLUMN IF NOT EXISTS email VARCHAR(255);
                `);
            } catch (alterError) {
                // Колоната вече съществува или има друг проблем - игнорираме
                console.log('Note: email column check:', alterError.message);
            }
        } catch (e) {
            console.error('❌ Failed ensuring "uik_registrations" table:', e.message);
        }

        // Таблица 6: uik_devices
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS uik_devices (
                    id SERIAL PRIMARY KEY,
                    uik UUID NOT NULL REFERENCES uik_registrations(uik) ON DELETE CASCADE,
                    device_serial VARCHAR(255) NOT NULL,
                    registered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE (uik, device_serial)
                );
            `);
            console.log('✅ Table "uik_devices" is ready.');
        } catch (e) {
            console.error('❌ Failed ensuring "uik_devices" table:', e.message);
        }

        // Таблица 7: uik_urls (за URL Manager)
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS uik_urls (
                    id SERIAL PRIMARY KEY,
                    uik UUID NOT NULL REFERENCES uik_registrations(uik) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    url TEXT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE (uik, url)
                );
            `);
            console.log('✅ Table "uik_urls" is ready.');
        } catch (e) {
            console.error('❌ Failed ensuring "uik_urls" table:', e.message);
        }

        // Таблица 8: accounting_chart (Счетоводен сметкоплан)
        try {
            // Проверка дали таблицата съществува
            const tableExists = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'accounting_chart'
                );
            `);
            
            if (!tableExists.rows[0].exists) {
                // Създаване на нова таблица с UUID
                await client.query(`
                    CREATE TABLE accounting_chart (
                        uik_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        uik_idfat UUID REFERENCES accounting_chart(uik_id) ON DELETE CASCADE,
                        code VARCHAR(50) NOT NULL,
                        name VARCHAR(255) NOT NULL,
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE (code)
                    );
                `);
                console.log('✅ Table "accounting_chart" created with UUID.');
            } else {
                // Проверка дали uik_id е INTEGER/SERIAL и миграция към UUID
                const columnInfo = await client.query(`
                    SELECT data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'accounting_chart' 
                    AND column_name = 'uik_id';
                `);
                
                if (columnInfo.rows.length > 0) {
                    const dataType = columnInfo.rows[0].data_type;
                    
                    if (dataType === 'integer' || dataType === 'smallint' || dataType === 'bigint') {
                        console.log('🔄 Migrating accounting_chart from INTEGER to UUID...');
                        
                        // Временно преименуване на старите колони
                        await client.query(`ALTER TABLE accounting_chart RENAME COLUMN uik_id TO uik_id_old;`);
                        await client.query(`ALTER TABLE accounting_chart RENAME COLUMN uik_idfat TO uik_idfat_old;`);
                        
                        // Създаване на нови UUID колони
                        await client.query(`ALTER TABLE accounting_chart ADD COLUMN uik_id UUID DEFAULT gen_random_uuid();`);
                        await client.query(`ALTER TABLE accounting_chart ADD COLUMN uik_idfat UUID;`);
                        
                        // Генериране на UUID за съществуващите записи
                        await client.query(`
                            UPDATE accounting_chart 
                            SET uik_id = gen_random_uuid();
                        `);
                        
                        // Обновяване на parent референциите
                        await client.query(`
                            UPDATE accounting_chart ac1
                            SET uik_idfat = ac2.uik_id
                            FROM accounting_chart ac2
                            WHERE ac1.uik_idfat_old = ac2.uik_id_old
                            AND ac1.uik_idfat_old IS NOT NULL;
                        `);
                        
                        // Изтриване на старите колони и constraints
                        await client.query(`ALTER TABLE accounting_chart DROP CONSTRAINT IF EXISTS accounting_chart_pkey;`);
                        await client.query(`ALTER TABLE accounting_chart DROP CONSTRAINT IF EXISTS accounting_chart_uik_idfat_fkey;`);
                        await client.query(`ALTER TABLE accounting_chart DROP COLUMN uik_id_old;`);
                        await client.query(`ALTER TABLE accounting_chart DROP COLUMN uik_idfat_old;`);
                        
                        // Добавяне на нови constraints
                        await client.query(`ALTER TABLE accounting_chart ADD PRIMARY KEY (uik_id);`);
                        await client.query(`
                            ALTER TABLE accounting_chart 
                            ADD CONSTRAINT accounting_chart_uik_idfat_fkey 
                            FOREIGN KEY (uik_idfat) 
                            REFERENCES accounting_chart(uik_id) 
                            ON DELETE CASCADE;
                        `);
                        
                        console.log('✅ Migration to UUID completed.');
                    } else if (dataType !== 'uuid') {
                        console.log(`⚠️  Warning: uik_id column type is ${dataType}, expected UUID.`);
                    }
                }
            }
            
            // Осигуряване че всички колони съществуват
            await client.query(`
                DO $$ 
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name = 'accounting_chart' AND column_name = 'uik_id') THEN
                        ALTER TABLE accounting_chart ADD COLUMN uik_id UUID PRIMARY KEY DEFAULT gen_random_uuid();
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name = 'accounting_chart' AND column_name = 'uik_idfat') THEN
                        ALTER TABLE accounting_chart ADD COLUMN uik_idfat UUID REFERENCES accounting_chart(uik_id) ON DELETE CASCADE;
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name = 'accounting_chart' AND column_name = 'code') THEN
                        ALTER TABLE accounting_chart ADD COLUMN code VARCHAR(50) NOT NULL DEFAULT '';
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name = 'accounting_chart' AND column_name = 'name') THEN
                        ALTER TABLE accounting_chart ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT '';
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name = 'accounting_chart' AND column_name = 'created_at') THEN
                        ALTER TABLE accounting_chart ADD COLUMN created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name = 'accounting_chart' AND column_name = 'updated_at') THEN
                        ALTER TABLE accounting_chart ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
                    END IF;
                END $$;
            `);
            
            // Trigger за автоматично обновяване на updated_at
            await client.query(`
                CREATE OR REPLACE FUNCTION update_accounting_chart_updated_at()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ language 'plpgsql';
            `);
            
            await client.query(`
                DROP TRIGGER IF EXISTS update_accounting_chart_updated_at_trigger ON accounting_chart;
                CREATE TRIGGER update_accounting_chart_updated_at_trigger 
                    BEFORE UPDATE ON accounting_chart
                    FOR EACH ROW EXECUTE FUNCTION update_accounting_chart_updated_at();
            `);
            
            console.log('✅ Table "accounting_chart" is ready with UUID.');
        } catch (e) {
            console.error('❌ Failed ensuring "accounting_chart" table:', e.message);
            console.error('Stack:', e.stack);
        }

    } catch (err) {
        console.error('\n❌ ГРЕШКА при свързване с базата данни:');
        console.error('   ', err.message);
        
        if (err.code === 'ENOTFOUND') {
            console.error('\n⚠️  Hostname не може да бъде намерен!');
            console.error('   Възможни причини:');
            console.error('   1. Базата данни в Render.com е спряна (free tier се спира след неактивност)');
            console.error('   2. Базата данни е изтрита');
            console.error('   3. Connection string-ът е неправилен');
            console.error('\n   Решение:');
            console.error('   - Провери Render.com dashboard дали базата съществува');
            console.error('   - Ако е спряна, стартирай я от Render dashboard');
            console.error('   - Вземи нов connection string от Render dashboard');
            console.error('   - Или използвай локална PostgreSQL база');
        } else if (err.code === 'ECONNREFUSED') {
            console.error('\n⚠️  Връзката е отказана!');
            console.error('   Провери дали PostgreSQL сървърът работи');
        } else if (err.code === '28P01') {
            console.error('\n⚠️  Грешка при автентикация!');
            console.error('   Провери username и password в DATABASE_URL');
        }
        
        console.error('\n   Текущ DATABASE_URL:', process.env.DATABASE_URL ? 
            process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') : 'не е зададен');
    } finally {
        if (client) {
            client.release();
        }
    }
};

initializeDatabase();


// Middleware
// CORS настройки - разрешаваме заявки от file:// протокол и локални origins
app.use(cors({
    origin: function (origin, callback) {
        // Разрешаваме заявки без origin (например от Postman, curl, или file://)
        // Това включва и 'null' origin който браузърът изпраща при file:// протокол
        if (!origin || origin === 'null' || origin === 'file://') {
            console.log('[CORS] Разрешаване на заявка без origin (file:// или null)');
            return callback(null, true);
        }
        
        // Разрешаваме локални origins
        const allowedOrigins = [
            'https://pci.inex-project.net',
            'http://pci.inex-project.net',
            'https://inex-project.net',
            'http://inex-project.net',
            'http://localhost:3000',
            'http://localhost:8000',
            'http://localhost:8080',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:8000',
            'http://127.0.0.1:8080'
        ];
        
        // Разрешаваме локални мрежи (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        const isLocalNetwork = origin.match(/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/);
        
        // Разрешаваме локални localhost портове (за тестване)
        const isLocalhost = origin.match(/^https?:\/\/localhost:\d+$/) || 
                           origin.match(/^https?:\/\/127\.0\.0\.1:\d+$/);
        
        if (allowedOrigins.includes(origin) || isLocalNetwork || isLocalhost) {
            console.log(`[CORS] Разрешаване на заявка от origin: ${origin}`);
            callback(null, true);
        } else {
            console.log(`[CORS] Отказване на заявка от origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma', 'If-Modified-Since']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error handler for JSON parsing
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
        console.error('JSON Parse Error:', err.message);
        return res.status(400).json({ error: 'Invalid JSON' });
    }
    next(err);
});

// ============================================
// API Routes
// ============================================

// Root endpoint - предотвратява 404 грешки
app.get('/', (req, res) => {
    res.json({ 
        service: 'МАМАФООД Backend API',
        version: '2.0',
        status: 'running',
        endpoints: {
            health: '/api/health',
            records: '/api/records/:child_code',
            children: '/api/children/:child_code',
            push: '/api/push/publicKey'
        }
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// Push Notifications setup
// ============================================
const VAPID_PUBLIC = process.env.VAPID_PUBLIC || 'BKWoV3gCewtxWBGechizICOItfUNKK51GnlgwCiOfQHJAOKju8Kg3KdufLG0mXbksAOaAAhkq5CJVR6JgOg1Uss';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE || '8XXlG4Q6y8DiDrDrIGmPiAq4IsQCApFSNZWIeuBou4k';

if (VAPID_PUBLIC && VAPID_PRIVATE && VAPID_PUBLIC.length > 50) {
    try {
        webpush.setVapidDetails('mailto:mamafood@example.com', VAPID_PUBLIC, VAPID_PRIVATE);
        console.log('✅ Push Notifications enabled');
    } catch (err) {
        console.warn('⚠️ Push Notifications disabled:', err.message);
    }
} else {
    console.warn('⚠️ Push Notifications disabled - invalid VAPID keys');
}

app.get('/api/push/publicKey', (req, res) => {
    if (VAPID_PUBLIC && VAPID_PUBLIC.length > 50) {
        res.json({ publicKey: VAPID_PUBLIC });
    } else {
        res.status(503).json({ error: 'Push notifications not configured' });
    }
});

app.post('/api/push/subscribe', async (req, res) => {
    try {
        const { child_code, subscription } = req.body;
        if (!child_code || !subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Invalid subscription' });
        }
        const { endpoint, keys } = subscription;
        await pool.query(
            `INSERT INTO push_subscriptions (child_code, endpoint, p256dh, auth)
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (child_code, endpoint) 
             DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
            [child_code, endpoint, keys.p256dh, keys.auth]
        );
        res.json({ success: true });
    } catch (e) {
        console.error('Push subscribe error:', e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/push/test', async (req, res) => {
    try {
        const { child_code, title, body } = req.body;
        const { rows } = await pool.query('SELECT * FROM push_subscriptions WHERE child_code = $1', [child_code]);
        const payload = JSON.stringify({ title: title || 'МАМАФООД', body: body || 'Тестово известие' });
        const results = [];
        for (const row of rows) {
            try {
                await webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, payload);
                results.push({ endpoint: row.endpoint, status: 'sent' });
            } catch (err) {
                results.push({ endpoint: row.endpoint, status: 'failed', error: err.message });
            }
        }
        res.json({ success: true, results });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/records/:child_code', async (req, res) => {
    try {
        const { child_code } = req.params;
        // Конвертиране в главни букви за case-insensitive търсене
        const upperChildCode = child_code.toUpperCase();
        const { rows } = await pool.query(
            'SELECT * FROM records WHERE UPPER(child_code) = $1 ORDER BY datetime DESC',
            [upperChildCode]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint за получаване на следващия номер на запис
app.get('/api/records/:child_code/next-number', async (req, res) => {
    try {
        const { child_code } = req.params;
        // Конвертиране в главни букви за case-insensitive търсене
        const upperChildCode = child_code.toUpperCase();
        const { rows } = await pool.query(
            'SELECT MAX(record_number) as max_number FROM records WHERE UPPER(child_code) = $1',
            [upperChildCode]
        );
        const maxNumber = rows[0]?.max_number || 0;
        res.json({ record_number: maxNumber + 1 });
    } catch (error) {
        console.error('Error getting next record number:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/records', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { child_code, record_number, amount, situation, datetime, notes } = req.body;
        
        if (!child_code || !record_number || !amount || !situation || !datetime) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const childCheck = await client.query(
            'SELECT child_code FROM children WHERE child_code = $1',
            [child_code]
        );
        
        if (childCheck.rows.length === 0) {
            await client.query(
                'INSERT INTO children (child_code, last_accessed) VALUES ($1, NOW())',
                [child_code]
            );
            console.log(`✅ Created child: ${child_code}`);
        } else {
            await client.query(
                'UPDATE children SET last_accessed = NOW() WHERE child_code = $1',
                [child_code]
            );
        }
        
        const { rows } = await client.query(
            'INSERT INTO records (child_code, record_number, amount, situation, datetime, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [child_code, record_number, amount, situation, datetime, notes || null]
        );
        
        await client.query('COMMIT');
        console.log(`✅ Added record #${record_number} for child ${child_code}`);
        
        res.json({ id: rows[0].id, ...req.body });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding record:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

app.put('/api/records/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, situation, datetime, notes } = req.body;
        
        await pool.query(
            'UPDATE records SET amount = $1, situation = $2, datetime = $3, notes = $4 WHERE id = $5',
            [amount, situation, datetime, notes || null, id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating record:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/records/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM records WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting record:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/children', async (req, res) => {
    try {
        const { child_code, name } = req.body;
        if (!child_code) {
            return res.status(400).json({ error: 'child_code is required' });
        }
        
        await pool.query(
            `INSERT INTO children (child_code, name, last_accessed) VALUES ($1, $2, NOW()) 
             ON CONFLICT (child_code) 
             DO UPDATE SET name = EXCLUDED.name, last_accessed = NOW()`,
            [child_code, name || null]
        );
        
        res.json({ child_code, name });
    } catch (error) {
        console.error('Error with child:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/children/:child_code', async (req, res) => {
    try {
        const { child_code } = req.params;
        // Конвертиране в главни букви за case-insensitive търсене
        const upperChildCode = child_code.toUpperCase();
        const { rows } = await pool.query(
            'SELECT * FROM children WHERE UPPER(child_code) = $1',
            [upperChildCode]
        );
        
        if (rows.length === 0) {
            // Връщаме празен обект вместо 404, за да не причинява грешки във frontend-а
            return res.json({ child_code: upperChildCode, name: null, last_accessed: null });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching child:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/devices', async (req, res) => {
    try {
        const { child_code, device_id, device_name } = req.body;
        
        await pool.query(
            `INSERT INTO device_access (child_code, device_id, device_name, last_sync) VALUES ($1, $2, $3, NOW()) 
             ON CONFLICT (child_code, device_id) 
             DO UPDATE SET last_sync = NOW()`,
            [child_code, device_id, device_name]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error registering device:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// UIK System API Endpoints
// ============================================

// Helper function to hash PIN
function hashPIN(pin) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(pin, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

// Helper function to verify PIN
function verifyPIN(pin, hash) {
    const [salt, hashValue] = hash.split(':');
    const verifyHash = crypto.pbkdf2Sync(pin, salt, 10000, 64, 'sha512').toString('hex');
    return hashValue === verifyHash;
}

// Register new UIK account
app.post('/api/uik/register', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { name, personal_id, address, phone, email, pin, attach_keyword, device_serial } = req.body;
        
        console.log('[POST /api/uik/register] Получени данни:', {
            name: name ? '***' : null,
            personal_id: personal_id ? '***' : null,
            hasAddress: !!address,
            hasPhone: !!phone,
            hasEmail: !!email,
            hasPin: !!pin,
            device_serial: device_serial ? device_serial.substring(0, 20) + '...' : null
        });
        
        if (!name || !personal_id || !pin) {
            await client.query('ROLLBACK');
            console.error('[POST /api/uik/register] Липсват задължителни полета:', {
                hasName: !!name,
                hasPersonalId: !!personal_id,
                hasPin: !!pin
            });
            return res.status(400).json({ error: 'Име, личен ID и PIN са задължителни' });
        }
        
        // Хеширане на PIN
        const pinHash = hashPIN(pin);
        
        // Генериране на UIK (UUID)
        const { rows: uikRows } = await client.query('SELECT gen_random_uuid() as uik');
        const uik = uikRows[0].uik;
        
        // Проверка дали вече има регистрация с този personal_id
        const existingCheck = await client.query(
            'SELECT uik FROM uik_registrations WHERE personal_id = $1',
            [personal_id]
        );
        
        if (existingCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Вече съществува регистрация с този личен ID' });
        }
        
        // Валидация на email формат (ако е подаден)
        if (email && email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Невалиден email формат' });
            }
        }
        
        // Вмъкване на регистрацията
        await client.query(
            `INSERT INTO uik_registrations (uik, name, personal_id, address, phone, email, pin_hash, attach_keyword)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [uik, name, personal_id || null, address || null, phone || null, email || null, pinHash, attach_keyword || null]
        );
        
        // Регистриране на устройството (ако е подаден device_serial)
        if (device_serial) {
            await client.query(
                'INSERT INTO uik_devices (uik, device_serial) VALUES ($1, $2)',
                [uik, device_serial]
            );
            console.log(`✅ Устройство регистрирано: ${device_serial} за UIK: ${uik}`);
        }
        
        await client.query('COMMIT');
        console.log(`✅ UIK регистрация създадена: ${uik}`);
        
        res.json({ 
            success: true, 
            uik: uik,
            message: 'Регистрацията е успешна' 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error registering UIK:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Attach device to existing UIK account
app.post('/api/uik/attach', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { personal_id, device_serial, pin } = req.body;
        
        if (!personal_id || !device_serial || !pin) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Личен ID, сериен номер на устройството и PIN са задължителни' });
        }
        
        // Намиране на регистрацията по personal_id
        const { rows } = await client.query(
            'SELECT uik, pin_hash FROM uik_registrations WHERE personal_id = $1',
            [personal_id]
        );
        
        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Не е намерена регистрация с този личен ID' });
        }
        
        const { uik, pin_hash } = rows[0];
        
        // Проверка на PIN
        if (!verifyPIN(pin, pin_hash)) {
            await client.query('ROLLBACK');
            return res.status(401).json({ error: 'Невалиден PIN' });
        }
        
        // Проверка дали устройството вече е регистрирано
        const deviceCheck = await client.query(
            'SELECT id FROM uik_devices WHERE uik = $1 AND device_serial = $2',
            [uik, device_serial]
        );
        
        if (deviceCheck.rows.length === 0) {
            // Регистриране на ново устройство
            await client.query(
                'INSERT INTO uik_devices (uik, device_serial) VALUES ($1, $2)',
                [uik, device_serial]
            );
        }
        
        await client.query('COMMIT');
        console.log(`✅ Устройство прикачено към UIK: ${uik}`);
        
        res.json({ 
            success: true, 
            uik: uik,
            message: 'Устройството е прикачено успешно' 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error attaching device:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Verify UIK + device_serial + PIN
app.post('/api/uik/verify', async (req, res) => {
    try {
        const { uik, device_serial, pin } = req.body;
        
        console.log('[POST /api/uik/verify] Получена заявка:', {
            uik: uik ? uik.substring(0, 20) + '...' : null,
            uikLength: uik ? uik.length : 0,
            deviceSerial: device_serial ? device_serial.substring(0, 20) + '...' : null,
            hasPin: !!pin
        });
        
        if (!uik || !device_serial || !pin) {
            console.error('[POST /api/uik/verify] Липсват задължителни полета:', {
                hasUIK: !!uik,
                hasDeviceSerial: !!device_serial,
                hasPin: !!pin
            });
            return res.status(400).json({ error: 'UIK, сериен номер на устройството и PIN са задължителни' });
        }
        
        // Trim на UIK за да премахнем whitespace
        const trimmedUIK = uik.trim();
        
        // Проверка на регистрацията
        console.log('[POST /api/uik/verify] Търсене на регистрация с UIK:', trimmedUIK.substring(0, 20) + '...');
        const { rows: regRows } = await pool.query(
            'SELECT uik, name, pin_hash FROM uik_registrations WHERE uik = $1',
            [trimmedUIK]
        );
        
        console.log('[POST /api/uik/verify] Намерени регистрации:', regRows.length);
        
        if (regRows.length === 0) {
            // Проверяваме дали има регистрации изобщо (за дебъг)
            const allRegs = await pool.query('SELECT COUNT(*) as count FROM uik_registrations');
            console.log('[POST /api/uik/verify] Общо регистрации в базата:', allRegs.rows[0].count);
            
            // Проверяваме дали има регистрация с подобен UIK (за дебъг)
            // ВАЖНО: Не използваме LIKE с UUID, защото PostgreSQL не поддържа това
            // Вместо това конвертираме UUID към текст за сравнение
            try {
                const similarRegs = await pool.query(
                    'SELECT uik::text FROM uik_registrations WHERE uik::text LIKE $1 LIMIT 5',
                    ['%' + trimmedUIK.substring(0, 8) + '%']
                );
                console.log('[POST /api/uik/verify] Подобни UIK-и:', similarRegs.rows.map(r => r.uik.substring(0, 20) + '...'));
            } catch (similarError) {
                // Ако и това не работи, просто пропускаме тази проверка
                console.warn('[POST /api/uik/verify] Неуспешна проверка за подобни UIK-и:', similarError.message);
            }
            
            // Логваме пълния UIK за дебъг (само в конзолата, не в отговора)
            console.error('[POST /api/uik/verify] ❌ UIK не е намерен в базата данни!');
            console.error('[POST /api/uik/verify] Търсен UIK (пълен):', trimmedUIK);
            console.error('[POST /api/uik/verify] Дължина на UIK:', trimmedUIK.length);
            console.error('[POST /api/uik/verify] UIK формат валиден:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedUIK));
            
            return res.status(404).json({ 
                error: 'Не е намерена регистрация с този UIK',
                debug: {
                    searchedUIK: trimmedUIK.substring(0, 20) + '...',
                    totalRegistrations: allRegs.rows[0].count,
                    message: 'UIK-ът в localStorage не съвпада с този в базата данни. Може да е изтрит или променен.'
                }
            });
        }
        
        const { name, pin_hash } = regRows[0];
        
        console.log('[POST /api/uik/verify] Намерена регистрация:', {
            name: name,
            uik: regRows[0].uik.substring(0, 20) + '...'
        });
        
        // Проверка на PIN
        const pinValid = verifyPIN(pin, pin_hash);
        console.log('[POST /api/uik/verify] PIN валидация:', pinValid ? 'Успешна' : 'Неуспешна');
        
        if (!pinValid) {
            return res.status(401).json({ error: 'Невалиден PIN' });
        }
        
        // Проверка дали устройството е регистрирано за този UIK
        const trimmedDeviceSerial = device_serial.trim();
        console.log('[POST /api/uik/verify] Проверка на устройство:', {
            uik: trimmedUIK.substring(0, 20) + '...',
            deviceSerial: trimmedDeviceSerial.substring(0, 20) + '...'
        });
        
        const { rows: deviceRows } = await pool.query(
            'SELECT id FROM uik_devices WHERE uik = $1 AND device_serial = $2',
            [trimmedUIK, trimmedDeviceSerial]
        );
        
        console.log('[POST /api/uik/verify] Намерени устройства:', deviceRows.length);
        
        if (deviceRows.length === 0) {
            // Проверяваме дали има устройства за този UIK (за дебъг)
            const allDevices = await pool.query(
                'SELECT device_serial FROM uik_devices WHERE uik = $1',
                [trimmedUIK]
            );
            console.log('[POST /api/uik/verify] Всички устройства за този UIK:', allDevices.rows.length);
            
            return res.status(403).json({ 
                error: 'Устройството не е регистрирано за този UIK',
                debug: {
                    searchedDeviceSerial: trimmedDeviceSerial.substring(0, 20) + '...',
                    registeredDevicesCount: allDevices.rows.length
                }
            });
        }
        
        res.json({ 
            success: true, 
            uik: uik,
            name: name,
            message: 'Проверката е успешна' 
        });
    } catch (error) {
        console.error('Error verifying UIK:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get UIK registration info (без чувствителни данни)
app.get('/api/uik/info/:uik', async (req, res) => {
    try {
        const { uik } = req.params;
        
        const { rows } = await pool.query(
            'SELECT uik, name, created_at FROM uik_registrations WHERE uik = $1',
            [uik]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Не е намерена регистрация с този UIK' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching UIK info:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete UIK registration (за RESET функционалност)
app.delete('/api/uik/:uik', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { uik } = req.params;
        
        // Проверка дали записът съществува
        const { rows } = await client.query(
            'SELECT uik FROM uik_registrations WHERE uik = $1',
            [uik]
        );
        
        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Не е намерена регистрация с този UIK' });
        }
        
        // Изтриване на всички свързани записи (устройствата ще се изтрият автоматично заради CASCADE)
        await client.query('DELETE FROM uik_registrations WHERE uik = $1', [uik]);
        
        await client.query('COMMIT');
        console.log(`✅ UIK регистрация изтрита: ${uik}`);
        
        res.json({ 
            success: true, 
            message: 'Регистрацията е изтрита успешно' 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting UIK:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// ============================================
// UIK URLs API Endpoints (URL Manager)
// ============================================

// Get all URLs for a UIK
app.get('/api/uik/:uik/urls', async (req, res) => {
    try {
        const { uik } = req.params;
        
        // Проверка дали UIK съществува
        const uikCheck = await pool.query(
            'SELECT uik FROM uik_registrations WHERE uik = $1',
            [uik]
        );
        
        if (uikCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Не е намерена регистрация с този UIK' });
        }
        
        const { rows } = await pool.query(
            'SELECT id, name, url, created_at FROM uik_urls WHERE uik = $1 ORDER BY created_at DESC',
            [uik]
        );
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching URLs:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add new URL for a UIK
app.post('/api/uik/:uik/urls', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { uik } = req.params;
        const { name, url } = req.body;
        
        // Проверка на задължителните полета
        if (!name || !url) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Име и URL са задължителни' });
        }
        
        // Проверка дали UIK съществува
        const uikCheck = await client.query(
            'SELECT uik FROM uik_registrations WHERE uik = $1',
            [uik]
        );
        
        if (uikCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Не е намерена регистрация с този UIK' });
        }
        
        // Валидация на URL формат
        try {
            new URL(url);
        } catch (e) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Невалиден URL формат' });
        }
        
        // Проверка дали URL вече съществува за този UIK
        const existingCheck = await client.query(
            'SELECT id FROM uik_urls WHERE uik = $1 AND url = $2',
            [uik, url]
        );
        
        if (existingCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Този URL вече е добавен' });
        }
        
        // Вмъкване на нов URL
        const { rows } = await client.query(
            'INSERT INTO uik_urls (uik, name, url) VALUES ($1, $2, $3) RETURNING id, name, url, created_at',
            [uik, name.trim(), url.trim()]
        );
        
        await client.query('COMMIT');
        console.log(`✅ URL добавен за UIK ${uik}: ${name}`);
        
        res.json(rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding URL:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Delete URL for a UIK
app.delete('/api/uik/:uik/urls/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { uik, id } = req.params;
        
        // Проверка дали URL съществува и принадлежи на този UIK
        const { rows } = await client.query(
            'SELECT id FROM uik_urls WHERE id = $1 AND uik = $2',
            [id, uik]
        );
        
        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'URL не е намерен' });
        }
        
        // Изтриване на URL
        await client.query('DELETE FROM uik_urls WHERE id = $1 AND uik = $2', [id, uik]);
        
        await client.query('COMMIT');
        console.log(`✅ URL изтрит: ${id} за UIK ${uik}`);
        
        res.json({ success: true, message: 'URL е изтрит успешно' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting URL:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// ============================================
// Accounting Chart API (Счетоводен сметкоплан)
// ============================================

// DELETE - Изтрий всички записи (за импорт) - ТРЯБВА ДА Е ПРЕДИ /:id routes
app.delete('/api/accounting-chart/clear', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Изтриване на всички записи (CASCADE ще изтрие и децата)
        await client.query('DELETE FROM accounting_chart');
        
        await client.query('COMMIT');
        console.log('✅ Всички записи от accounting_chart са изтрити');
        
        res.json({ success: true, message: 'Всички записи са изтрити' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error clearing accounting chart:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// GET - Вземи всички записи от счетоводния план (с йерархична структура)
app.get('/api/accounting-chart', async (req, res) => {
    const client = await pool.connect();
    try {
        const { rows } = await client.query(`
            SELECT uik_id, uik_idfat, code, name, created_at, updated_at
            FROM accounting_chart
            ORDER BY code
        `);
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching accounting chart:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// GET - Вземи един запис по ID
app.get('/api/accounting-chart/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        
        // Защита: не позволяваме "clear" като ID
        if (id === 'clear') {
            return res.status(404).json({ error: 'Записът не е намерен' });
        }
        
        // Валидация на UUID формат
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return res.status(400).json({ error: 'Невалиден UUID формат' });
        }
        
        const { rows } = await client.query(
            'SELECT uik_id, uik_idfat, code, name, created_at, updated_at FROM accounting_chart WHERE uik_id = $1',
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Записът не е намерен' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching accounting chart item:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// POST - Създай нов запис
app.post('/api/accounting-chart', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { uik_idfat, code, name } = req.body;
        
        // Валидация
        if (!code || !name) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Code и name са задължителни полета' });
        }
        
        // Проверка за уникалност на code
        const existingCheck = await client.query(
            'SELECT uik_id FROM accounting_chart WHERE code = $1',
            [code.trim()]
        );
        
        if (existingCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Запис с този code вече съществува' });
        }
        
        // Проверка дали parent съществува (ако е зададен)
        if (uik_idfat !== null && uik_idfat !== undefined) {
            const parentCheck = await client.query(
                'SELECT uik_id FROM accounting_chart WHERE uik_id = $1',
                [uik_idfat]
            );
            
            if (parentCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Parent записът не съществува' });
            }
        }
        
        // Вмъкване на нов запис
        const { rows } = await client.query(
            'INSERT INTO accounting_chart (uik_idfat, code, name) VALUES ($1, $2, $3) RETURNING uik_id, uik_idfat, code, name, created_at, updated_at',
            [uik_idfat || null, code.trim(), name.trim()]
        );
        
        await client.query('COMMIT');
        console.log(`✅ Счетоводен запис създаден: ${code} - ${name}`);
        
        res.status(201).json(rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating accounting chart item:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// PUT - Редактирай запис
app.put('/api/accounting-chart/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        
        // Защита: не позволяваме "clear" като ID
        if (id === 'clear') {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Записът не е намерен' });
        }
        
        // Валидация на UUID формат
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Невалиден UUID формат' });
        }
        const { code, name, uik_idfat } = req.body;
        
        // Проверка дали записът съществува
        const existingCheck = await client.query(
            'SELECT uik_id FROM accounting_chart WHERE uik_id = $1',
            [id]
        );
        
        if (existingCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Записът не е намерен' });
        }
        
        // Валидация
        if (!code || !name) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Code и name са задължителни полета' });
        }
        
        // Проверка за уникалност на code (ако е променен)
        const codeCheck = await client.query(
            'SELECT uik_id FROM accounting_chart WHERE code = $1 AND uik_id != $2',
            [code.trim(), id]
        );
        
        if (codeCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Запис с този code вече съществува' });
        }
        
        // Проверка дали parent съществува (ако е зададен и е различен от текущия)
        if (uik_idfat !== null && uik_idfat !== undefined && uik_idfat !== id) {
            const parentCheck = await client.query(
                'SELECT uik_id FROM accounting_chart WHERE uik_id = $1',
                [uik_idfat]
            );
            
            if (parentCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Parent записът не съществува' });
            }
            
            // Проверка за цикличност (не може да се направи parent на себе си или на свой потомък)
            const cycleCheck = await client.query(
                `WITH RECURSIVE descendants AS (
                    SELECT uik_id FROM accounting_chart WHERE uik_id = $1
                    UNION ALL
                    SELECT ac.uik_id FROM accounting_chart ac
                    INNER JOIN descendants d ON ac.uik_idfat = d.uik_id
                )
                SELECT uik_id FROM descendants WHERE uik_id = $2`,
                [uik_idfat, id]
            );
            
            if (cycleCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Не може да се направи циклично рефериране (parent не може да бъде потомък)' });
            }
        }
        
        // Обновяване на записа
        const { rows } = await client.query(
            'UPDATE accounting_chart SET code = $1, name = $2, uik_idfat = $3 WHERE uik_id = $4 RETURNING uik_id, uik_idfat, code, name, created_at, updated_at',
            [code.trim(), name.trim(), uik_idfat || null, id]
        );
        
        await client.query('COMMIT');
        console.log(`✅ Счетоводен запис обновен: ${id} - ${code} - ${name}`);
        
        res.json(rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating accounting chart item:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// DELETE - Изтрий запис
app.delete('/api/accounting-chart/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        
        // Защита: не позволяваме "clear" като ID
        if (id === 'clear') {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Записът не е намерен' });
        }
        
        // Валидация на UUID формат
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Невалиден UUID формат' });
        }
        
        // Проверка дали записът съществува
        const existingCheck = await client.query(
            'SELECT uik_id FROM accounting_chart WHERE uik_id = $1',
            [id]
        );
        
        if (existingCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Записът не е намерен' });
        }
        
        // Проверка дали има потомци (детски записи)
        const childrenCheck = await client.query(
            'SELECT COUNT(*) as count FROM accounting_chart WHERE uik_idfat = $1',
            [id]
        );
        
        if (parseInt(childrenCheck.rows[0].count) > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Не може да се изтрие запис с потомци. Първо изтрийте или преместете потомците.' });
        }
        
        // Изтриване на записа
        await client.query('DELETE FROM accounting_chart WHERE uik_id = $1', [id]);
        
        await client.query('COMMIT');
        console.log(`✅ Счетоводен запис изтрит: ${id}`);
        
        res.json({ success: true, message: 'Записът е изтрит успешно' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting accounting chart item:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 МАМАФООД Backend API running on port ${PORT}`);
});
