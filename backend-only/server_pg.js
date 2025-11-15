// ============================================
// МАМАФООД Backend Server
// Express API server for PostgreSQL database
// Backend-only version (for deployment on Render.com)
// ============================================

// Load environment variables from .env file (for local development)
try {
    require('dotenv').config();
} catch (e) {
    // dotenv не е инсталиран, но това е OK за production (Render.com използва environment variables)
    console.log('[INFO] dotenv не е намерен - използвам environment variables директно');
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

// Build database config - supports DATABASE_URL or individual variables
// Render.com provides DATABASE_URL automatically
// 
// Connection String Priority:
// 1. DATABASE_URL (for production on Render.com or external access)
// 2. DATABASE_URL_INTERNAL (for internal access when both services are on Render.com)
// 3. Individual variables (POSTGRES_HOST, POSTGRES_USER, etc.)

// Determine which connection string to use
let connectionString = process.env.DATABASE_URL;
let useSSL = false;

// If we're on Render.com and have internal URL, prefer it (faster, no SSL needed)
if (process.env.DATABASE_URL_INTERNAL && process.env.RENDER) {
    connectionString = process.env.DATABASE_URL_INTERNAL;
    useSSL = false;
    console.log('[INFO] Използвам Internal URL (Render.com internal network)');
} else if (process.env.DATABASE_URL_INTERNAL && !process.env.DATABASE_URL) {
    // Use internal URL if no external URL is provided
    connectionString = process.env.DATABASE_URL_INTERNAL;
    useSSL = false;
    console.log('[INFO] Използвам Internal URL (няма External URL)');
} else if (process.env.DATABASE_URL) {
    // External URL - usually requires SSL
    connectionString = process.env.DATABASE_URL;
    // Check if URL contains SSL requirement (most external URLs do)
    useSSL = connectionString.includes('render.com') || 
             connectionString.includes('amazonaws.com') ||
             connectionString.includes('azure.com') ||
             process.env.DATABASE_URL_SSL === 'true';
    console.log('[INFO] Използвам External URL');
}

const dbConfig = {
    connectionString: connectionString,
    // Or individual variables if DATABASE_URL is not set
    host: process.env.POSTGRES_HOST || process.env.DB_HOST,
    user: process.env.POSTGRES_USER || process.env.DB_USER,
    password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.POSTGRES_DATABASE || process.env.DB_NAME,
    port: process.env.POSTGRES_PORT || process.env.DB_PORT || 5432,
    ssl: connectionString ? (useSSL ? { rejectUnauthorized: false } : false) : false
};

// Diagnostic: Check what config we have
console.log('\n📊 Database Configuration:');
if (connectionString) {
    const urlPreview = connectionString.substring(0, 50) + '...';
    console.log(`   ✅ Използвам: ${urlPreview}`);
    if (process.env.DATABASE_URL_INTERNAL && process.env.DATABASE_URL) {
        console.log(`   📌 Internal URL: ${process.env.DATABASE_URL_INTERNAL.substring(0, 30)}...`);
        console.log(`   📌 External URL: ${process.env.DATABASE_URL.substring(0, 30)}...`);
    } else if (process.env.DATABASE_URL_INTERNAL) {
        console.log(`   📌 Internal URL: ${process.env.DATABASE_URL_INTERNAL.substring(0, 30)}...`);
    } else if (process.env.DATABASE_URL) {
        console.log(`   📌 External URL: ${process.env.DATABASE_URL.substring(0, 30)}...`);
    }
    console.log(`   🔒 SSL: ${useSSL ? 'Да' : 'Не'}`);
} else {
    console.log('   ⚠️  DATABASE_URL не е зададен');
    if (dbConfig.host) console.log(`   ✅ Host: ${dbConfig.host}`);
    if (dbConfig.user) console.log(`   ✅ User: ${dbConfig.user}`);
    if (dbConfig.database) console.log(`   ✅ Database: ${dbConfig.database}`);
    if (!dbConfig.host && !dbConfig.user && !dbConfig.database) {
        console.log('   ❌ Няма конфигурирани параметри за база данни!');
        console.log('\n   💡 За локално тестване създай backend-only/.env файл с:');
        console.log('      DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mamafood');
        console.log('      PORT=3000\n');
    }
}

// Remove undefined properties if using individual vars
if (!dbConfig.connectionString) {
    delete dbConfig.connectionString;
    if (!dbConfig.host) delete dbConfig.host;
    if (!dbConfig.user) delete dbConfig.user;
    if (!dbConfig.password) delete dbConfig.password;
    if (!dbConfig.database) delete dbConfig.database;
}

// Create connection pool
const pool = new Pool(dbConfig);

// Test connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
});

// Test connection on startup
(async () => {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Database connection test successful:', result.rows[0].now);
    } catch (err) {
        console.error('\n❌ Database connection test failed!');
        console.error('   Грешка:', err.message);
        console.error('\n💡 Решения:');
        console.error('   1. Провери дали PostgreSQL е инсталиран и работи');
        console.error('   2. Провери .env файл в backend-only/ директорията');
        console.error('   3. За локална база: DATABASE_URL=postgresql://postgres:парола@localhost:5432/mamafood');
        console.error('   4. За Render.com: Вземи DATABASE_URL от Render Dashboard\n');
    }
})();

// ============================================
// Middleware
// ============================================

app.use(cors({
    origin: [
        'https://pci.inex-project.net',
        'http://pci.inex-project.net',
        'http://localhost:3000',
        'http://localhost:8000',
        'https://mamafood.onrender.com'
    ],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from parent directory (for local testing)
// In production, frontend will be served separately
if (process.env.NODE_ENV !== 'production' || process.env.SERVE_STATIC === 'true') {
    app.use(express.static(path.join(__dirname, '..')));
    console.log('📁 Static files enabled (dev mode)');
}

// Error handler for JSON parsing
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
        console.error('JSON Parse Error:', err.message);
        return res.status(400).json({ error: 'Invalid JSON' });
    }
    next(err);
});

// ============================================
// Health Check
// ============================================

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

// Ensure push_subscriptions table exists
(async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS push_subscriptions (
            id SERIAL PRIMARY KEY,
            child_code VARCHAR(50) NOT NULL,
            endpoint TEXT NOT NULL,
            p256dh VARCHAR(255) NOT NULL,
            auth VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_sub UNIQUE (child_code, endpoint)
        );`);
        console.log('✅ Table "push_subscriptions" is ready.');
    } catch (e) {
        console.error('❌ Failed ensuring "push_subscriptions" table:', e.message);
    }
})();

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
        // Конвертиране в главни букви за case-insensitive търсене
        const upperChildCode = (child_code || '').toUpperCase();
        const result = await pool.query('SELECT * FROM push_subscriptions WHERE UPPER(child_code) = UPPER($1)', [upperChildCode]);
        const payload = JSON.stringify({ title: title || 'МАМАФООД', body: body || 'Тестово известие' });
        const results = [];
        for (const row of result.rows) {
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

// ============================================
// Records API
// ============================================

// Helper function to normalize datetime to ISO format for PostgreSQL
function normalizeDateTime(datetime) {
    if (!datetime) {
        return null;
    }
    
    // If already in ISO format with timezone (contains Z or +), return as is
    if (typeof datetime === 'string' && (datetime.includes('Z') || datetime.includes('+'))) {
        return datetime;
    }
    
    // Try to parse and convert to ISO format
    try {
        const date = new Date(datetime);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date format');
        }
        return date.toISOString();
    } catch (error) {
        throw new Error(`Invalid datetime format: ${datetime}`);
    }
}

app.get('/api/records/:child_code', async (req, res) => {
    try {
        const { child_code } = req.params;
        // Конвертиране в главни букви за case-insensitive търсене
        const upperChildCode = child_code.toUpperCase();
        console.log(`[API] GET /api/records/${child_code} -> търсене за код: "${upperChildCode}"`);
        
        // Проверка дали таблицата съществува
        try {
            const tableCheck = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'records'
                );
            `);
            const tableExists = tableCheck.rows[0].exists;
            console.log(`[API] Таблицата 'records' съществува: ${tableExists}`);
            
            if (!tableExists) {
                console.warn('[API] ⚠️ Таблицата "records" не съществува! Връщаме празен масив.');
                return res.json([]);
            }
        } catch (tableCheckError) {
            console.error('[API] Грешка при проверка на таблицата:', tableCheckError);
            // Продължаваме напред, може да работи и без проверката
        }
        
        // Първо проверим какви кодове има в базата (за debug)
        try {
            const allCodesCheck = await pool.query('SELECT DISTINCT UPPER(child_code) as code FROM records');
            console.log(`[API] Налични кодове в базата:`, allCodesCheck.rows.map(r => r.code));
        } catch (codesError) {
            console.warn('[API] Грешка при проверка на кодовете (продължавам):', codesError.message);
        }
        
        let result;
        try {
            result = await pool.query(
                'SELECT * FROM records WHERE UPPER(child_code) = UPPER($1) ORDER BY datetime DESC',
                [upperChildCode]
            );
            console.log(`[API] ✅ Заявка за записи за код: "${upperChildCode}", Намерени: ${result.rows.length} записа`);
        } catch (queryError) {
            console.error('[API] ❌ Грешка при изпълнение на SQL заявката:', queryError);
            console.error('[API] Error name:', queryError.name);
            console.error('[API] Error message:', queryError.message);
            console.error('[API] Error code:', queryError.code);
            console.error('[API] Error detail:', queryError.detail);
            throw queryError; // Прехвърляме грешката към catch блока
        }
        
        // Проверка за дублиране на ID-та
        const ids = result.rows.map(r => r.id);
        const uniqueIds = [...new Set(ids)];
        if (ids.length !== uniqueIds.length) {
            const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
            console.warn(`[API] ⚠️ ДУБЛИРАНИ ID-та в резултата:`, duplicates);
            console.warn(`[API] Общо записи: ${ids.length}, Уникални ID-та: ${uniqueIds.length}`);
        }
        
        if (result.rows.length > 0) {
            console.log(`[API] Всички записи (детайли):`, result.rows.map(r => ({
                id: r.id,
                child_code: r.child_code,
                record_number: r.record_number,
                amount: r.amount,
                situation: r.situation,
                datetime: r.datetime,
                notes: r.notes || null
            })));
        }
        
        res.json(result.rows);
    } catch (error) {
        console.error('[API] ❌ Грешка при зареждане на записи:', error);
        console.error('[API] Error name:', error.name);
        console.error('[API] Error message:', error.message);
        console.error('[API] Error code:', error.code);
        console.error('[API] Error detail:', error.detail);
        console.error('[API] Stack trace:', error.stack);
        
        // Връщаме празен масив вместо 500, за да не спира приложението
        console.log(`[API] Връщаме празен масив заради грешка`);
        res.json([]);
    }
});

// GET /api/records/:child_code/next-number - Get next record number for child
app.get('/api/records/:child_code/next-number', async (req, res) => {
    try {
        const { child_code } = req.params;
        // Конвертиране в главни букви за case-insensitive търсене
        const upperChildCode = child_code.toUpperCase();
        const result = await pool.query(
            'SELECT COALESCE(MAX(record_number), 0) + 1 AS next_number FROM records WHERE UPPER(child_code) = UPPER($1)',
            [upperChildCode]
        );
        const nextNumber = result.rows[0]?.next_number || 1;
        res.json({ record_number: nextNumber });
    } catch (error) {
        console.error('Error getting next record number:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/records', async (req, res) => {
    console.log('[API] POST /api/records - Получена заявка');
    console.log('[API] Request body:', JSON.stringify(req.body, null, 2));
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { child_code, record_number, amount, situation, datetime, notes } = req.body;
        
        console.log('[API] Парсирани полета:', {
            child_code: child_code,
            record_number: record_number,
            amount: amount,
            situation: situation,
            datetime: datetime,
            notes: notes || null
        });
        
        if (!child_code || !record_number || !amount || !situation || !datetime) {
            console.error('[API] ❌ Липсват задължителни полета:', {
                has_child_code: !!child_code,
                has_record_number: record_number !== undefined && record_number !== null,
                has_amount: amount !== undefined && amount !== null,
                has_situation: !!situation,
                has_datetime: !!datetime
            });
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Normalize datetime to ISO format
        let normalizedDateTime;
        try {
            normalizedDateTime = normalizeDateTime(datetime);
        } catch (error) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: error.message });
        }
        
        // Ensure child exists (case-insensitive)
        const upperChildCode = (child_code || '').toUpperCase();
        const childCheck = await client.query(
            'SELECT child_code FROM children WHERE UPPER(child_code) = UPPER($1)',
            [upperChildCode]
        );
        
        if (childCheck.rows.length === 0) {
            await client.query(
                'INSERT INTO children (child_code, last_accessed) VALUES ($1, NOW())',
                [upperChildCode]
            );
            console.log(`✅ Created child: ${upperChildCode}`);
        } else {
            await client.query(
                'UPDATE children SET last_accessed = NOW() WHERE UPPER(child_code) = UPPER($1)',
                [upperChildCode]
            );
        }
        
        const result = await client.query(
            'INSERT INTO records (child_code, record_number, amount, situation, datetime, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [upperChildCode, record_number, amount, situation, normalizedDateTime, notes || null]
        );
        
        await client.query('COMMIT');
        const newRecordId = result.rows[0].id;
        console.log(`[API] ✅ Успешно добавен запис #${record_number} за дете ${upperChildCode}`);
        console.log(`[API] Нов ID: ${newRecordId}, datetime: ${normalizedDateTime}`);
        
        const responseData = { id: newRecordId, ...req.body, datetime: normalizedDateTime };
        console.log('[API] Response data:', JSON.stringify(responseData, null, 2));
        res.json(responseData);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[API] ❌ Грешка при добавяне на запис:', error);
        console.error('[API] Error stack:', error.stack);
        console.error('[API] Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail
        });
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

app.put('/api/records/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, situation, datetime, notes } = req.body;
        
        // Normalize datetime to ISO format if provided
        let normalizedDateTime = datetime;
        if (datetime) {
            try {
                normalizedDateTime = normalizeDateTime(datetime);
            } catch (error) {
                return res.status(400).json({ error: error.message });
            }
        }
        
        await pool.query(
            'UPDATE records SET amount = $1, situation = $2, datetime = $3, notes = $4 WHERE id = $5',
            [amount, situation, normalizedDateTime, notes || null, id]
        );
        
        console.log(`✅ Updated record #${id} with datetime: ${normalizedDateTime}`);
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

// ============================================
// Children API
// ============================================

app.post('/api/children', async (req, res) => {
    try {
        const { child_code, name } = req.body;
        if (!child_code) {
            return res.status(400).json({ error: 'child_code is required' });
        }
        
        await pool.query(
            'INSERT INTO children (child_code, name, last_accessed) VALUES ($1, $2, NOW()) ON CONFLICT (child_code) DO UPDATE SET name = EXCLUDED.name, last_accessed = NOW()',
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
        console.log(`[API] GET /api/children/${child_code} -> търсене за код: "${upperChildCode}"`);
        
        // Проверка дали таблицата съществува
        try {
            const tableCheck = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'children'
                );
            `);
            const tableExists = tableCheck.rows[0].exists;
            console.log(`[API] Таблицата 'children' съществува: ${tableExists}`);
            
            if (!tableExists) {
                console.warn('[API] ⚠️ Таблицата "children" не съществува! Връщаме празен обект.');
                return res.json({ child_code: upperChildCode, name: null, last_accessed: null });
            }
        } catch (tableCheckError) {
            console.error('[API] Грешка при проверка на таблицата:', tableCheckError);
            // Продължаваме напред, може да работи и без проверката
        }
        
        const result = await pool.query(
            'SELECT * FROM children WHERE UPPER(child_code) = UPPER($1)',
            [upperChildCode]
        );
        
        if (result.rows.length === 0) {
            // Връщаме празен обект вместо 404, за да не причинява грешки във frontend-а
            console.log(`[API] Дете с код "${upperChildCode}" не е намерено, връщаме празен обект`);
            return res.json({ child_code: upperChildCode, name: null, last_accessed: null });
        }
        
        console.log(`[API] Намерено дете:`, result.rows[0]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('[API] ❌ Грешка при зареждане на дете:', error);
        console.error('[API] Error name:', error.name);
        console.error('[API] Error message:', error.message);
        console.error('[API] Error code:', error.code);
        console.error('[API] Error detail:', error.detail);
        console.error('[API] Stack trace:', error.stack);
        
        // Връщаме празен обект вместо 500, за да не спира приложението
        const upperChildCode = (req.params.child_code || '').toUpperCase();
        console.log(`[API] Връщаме празен обект за код: "${upperChildCode}"`);
        res.json({ child_code: upperChildCode, name: null, last_accessed: null });
    }
});

// ============================================
// Devices API
// ============================================

app.post('/api/devices', async (req, res) => {
    try {
        const { child_code, device_id, device_name } = req.body;
        
        await pool.query(
            'INSERT INTO device_access (child_code, device_id, device_name, last_sync) VALUES ($1, $2, $3, NOW()) ON CONFLICT (child_code, device_id) DO UPDATE SET last_sync = NOW()',
            [child_code, device_id, device_name]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error registering device:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Serve Frontend (for local testing)
// ============================================

app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, '..', 'index.html');
    res.sendFile(indexPath);
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 МАМАФООД Backend API (PostgreSQL) running on port ${PORT}`);
    if (dbConfig.connectionString) {
        console.log(`📊 Database: Connected via DATABASE_URL`);
    } else {
        console.log(`📊 Database: ${dbConfig.database} on ${dbConfig.host || 'localhost'}`);
    }
    console.log(`🌐 Frontend: http://localhost:${PORT}/`);
    console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
});

