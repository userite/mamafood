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
app.use(cors({
    origin: function (origin, callback) {
        // Разрешаваме заявки без origin (например от Postman, curl, или file://)
        if (!origin) {
            return callback(null, true);
        }
        
        // Разрешаваме локални origins
        const allowedOrigins = [
            'https://pci.inex-project.net',
            'http://pci.inex-project.net',
            'http://localhost:3000',
            'http://localhost:8000',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:8000'
        ];
        
        // Разрешаваме локални мрежи (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        const isLocalNetwork = origin.match(/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/);
        
        if (allowedOrigins.includes(origin) || isLocalNetwork) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
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
// Start Server
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 МАМАФООД Backend API running on port ${PORT}`);
});
