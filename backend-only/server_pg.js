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
const crypto = require('crypto');
const QRCode = require('qrcode');
const idService = require(path.join(__dirname, '..', 'lib', 'identifier-service.js'));

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Configuration
// ============================================

// Build database config - supports DATABASE_URL or individual variables
// Render.com provides DATABASE_URL automatically

// Determine which connection string to use
let connectionString = process.env.DATABASE_URL;
let useSSL = false;

// Check if we're running on Render.com
const isRenderEnvironment = process.env.RENDER === 'true' || 
                             process.env.RENDER_SERVICE_NAME ||
                             process.env.RENDER_SERVICE_ID ||
                             (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com')) ||
                             (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('onrender.com'));

// Debug: Log what we have
console.log('[INFO] Database URL Detection:', {
    hasDATABASE_URL: !!process.env.DATABASE_URL,
    isRenderEnvironment: isRenderEnvironment,
    RENDER: process.env.RENDER,
    RENDER_SERVICE_NAME: process.env.RENDER_SERVICE_NAME,
    RENDER_SERVICE_ID: process.env.RENDER_SERVICE_ID,
    DATABASE_URL_preview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'N/A'
});

// Use DATABASE_URL if available
if (process.env.DATABASE_URL) {
    connectionString = process.env.DATABASE_URL;
    
    // Extract hostname from URL for better detection
    let hostname = '';
    try {
        const urlMatch = connectionString.match(/@([^:]+):/);
        if (urlMatch) {
            hostname = urlMatch[1];
        }
    } catch (e) {
        // Ignore parsing errors
    }
    
    // Check if URL contains SSL requirement (most external URLs do)
    const isRenderPostgres = connectionString.includes('render.com') || 
                             connectionString.includes('onrender.com') ||
                             hostname.includes('render.com') ||
                             hostname.includes('onrender.com') ||
                             hostname.includes('dpg-'); // Render.com PostgreSQL hostname pattern
    const isCloudProvider = connectionString.includes('amazonaws.com') ||
                            connectionString.includes('azure.com') ||
                            connectionString.includes('cloud.google.com') ||
                            hostname.includes('amazonaws.com') ||
                            hostname.includes('azure.com') ||
                            hostname.includes('cloud.google.com');
    
    // For Render.com external connections, SSL is usually required
    // Internal URLs (with .internal) don't need SSL
    const isInternalURL = hostname.includes('.internal') || hostname.includes('internal:');
    useSSL = !isInternalURL && (isRenderPostgres || isCloudProvider || process.env.DATABASE_URL_SSL === 'true');
    
    console.log('[INFO] Database URL Analysis:', {
        hostname: hostname || 'N/A',
        isRenderPostgres,
        isCloudProvider,
        isInternalURL,
        useSSL,
        isRenderEnvironment
    });
    
    if (isRenderPostgres && !isInternalURL && !useSSL) {
        console.warn('[INFO] ⚠️ Render.com external URL без SSL - може да има проблеми с връзката!');
    }
    
    console.log('[INFO] Използвам DATABASE_URL', { useSSL, isRenderPostgres, isCloudProvider, isInternalURL, isRenderEnvironment });
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
        'https://inex-project.net',
        'http://inex-project.net',
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

// Ensure UIK tables exist
(async () => {
    try {
        // UIK registrations table
        await pool.query(`CREATE TABLE IF NOT EXISTS uik_registrations (
            uik UUID PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            personal_id VARCHAR(50) UNIQUE,
            address TEXT,
            phone VARCHAR(50),
            email VARCHAR(255),
            pin_hash TEXT NOT NULL,
            attach_keyword VARCHAR(255),
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );`);
        console.log('✅ Table "uik_registrations" is ready.');
        
        // UIK devices table
        await pool.query(`CREATE TABLE IF NOT EXISTS uik_devices (
            id SERIAL PRIMARY KEY,
            uik UUID NOT NULL REFERENCES uik_registrations(uik) ON DELETE CASCADE,
            device_serial VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (uik, device_serial)
        );`);
        console.log('✅ Table "uik_devices" is ready.');
        
        // UIK URLs table
        await pool.query(`CREATE TABLE IF NOT EXISTS uik_urls (
            id SERIAL PRIMARY KEY,
            uik UUID NOT NULL REFERENCES uik_registrations(uik) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            url TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (uik, url)
        );`);
        console.log('✅ Table "uik_urls" is ready.');

        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS identifier_codes (
                    id SERIAL PRIMARY KEY,
                    code_type VARCHAR(64) NOT NULL,
                    code_value TEXT NOT NULL UNIQUE,
                    human_description TEXT,
                    code_group VARCHAR(255),
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );
            `);
            await pool.query(`
                CREATE INDEX IF NOT EXISTS idx_identifier_codes_group ON identifier_codes (code_group);
            `);
            console.log('✅ Table "identifier_codes" is ready.');
        } catch (e) {
            console.error('❌ Failed ensuring "identifier_codes" table:', e.message);
        }

        // Таблица 8: accounting_chart (Счетоводен сметкоплан)
        try {
            // Проверка дали таблицата съществува
            const tableExists = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'accounting_chart'
                );
            `);
            
            if (!tableExists.rows[0].exists) {
                // Създаване на нова таблица с UUID
                await pool.query(`
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
                const columnInfo = await pool.query(`
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
                        await pool.query(`ALTER TABLE accounting_chart RENAME COLUMN uik_id TO uik_id_old;`);
                        await pool.query(`ALTER TABLE accounting_chart RENAME COLUMN uik_idfat TO uik_idfat_old;`);
                        
                        // Създаване на нови UUID колони
                        await pool.query(`ALTER TABLE accounting_chart ADD COLUMN uik_id UUID DEFAULT gen_random_uuid();`);
                        await pool.query(`ALTER TABLE accounting_chart ADD COLUMN uik_idfat UUID;`);
                        
                        // Генериране на UUID за съществуващите записи
                        await pool.query(`
                            UPDATE accounting_chart 
                            SET uik_id = gen_random_uuid();
                        `);
                        
                        // Обновяване на parent референциите
                        await pool.query(`
                            UPDATE accounting_chart ac1
                            SET uik_idfat = ac2.uik_id
                            FROM accounting_chart ac2
                            WHERE ac1.uik_idfat_old = ac2.uik_id_old
                            AND ac1.uik_idfat_old IS NOT NULL;
                        `);
                        
                        // Изтриване на старите колони и constraints
                        await pool.query(`ALTER TABLE accounting_chart DROP CONSTRAINT IF EXISTS accounting_chart_pkey;`);
                        await pool.query(`ALTER TABLE accounting_chart DROP CONSTRAINT IF EXISTS accounting_chart_uik_idfat_fkey;`);
                        await pool.query(`ALTER TABLE accounting_chart DROP COLUMN uik_id_old;`);
                        await pool.query(`ALTER TABLE accounting_chart DROP COLUMN uik_idfat_old;`);
                        
                        // Добавяне на нови constraints
                        await pool.query(`ALTER TABLE accounting_chart ADD PRIMARY KEY (uik_id);`);
                        await pool.query(`
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
            await pool.query(`
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
            await pool.query(`
                CREATE OR REPLACE FUNCTION update_accounting_chart_updated_at()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ language 'plpgsql';
            `);
            
            await pool.query(`
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
    } catch (e) {
        console.error('❌ Failed ensuring UIK tables:', e.message);
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
        // Проверка за database connection
        if (!pool) {
            console.error('[API] ❌ Database pool не е инициализиран!');
            return res.status(500).json({ error: 'Database connection not initialized' });
        }
        
        const { child_code } = req.params;
        if (!child_code) {
            console.error('[API] ❌ child_code не е предоставен!');
            return res.status(400).json({ error: 'child_code is required' });
        }
        
        // Конвертиране в главни букви за case-insensitive търсене
        const upperChildCode = child_code.toUpperCase();
        console.log(`[API] GET /api/records/${child_code} -> търсене за код: "${upperChildCode}"`);
        console.log(`[API] Database connection info:`, {
            hasConnectionString: !!connectionString,
            connectionStringPreview: connectionString ? connectionString.substring(0, 50) + '...' : 'N/A',
            useSSL: useSSL,
            poolExists: !!pool
        });
        
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
        
        // Проверка колко общо записа има за този код (без филтър по datetime)
        try {
            const countResult = await pool.query(
                'SELECT COUNT(*) as total FROM records WHERE UPPER(child_code) = UPPER($1)',
                [upperChildCode]
            );
            const totalCount = parseInt(countResult.rows[0].total);
            console.log(`[API] Общо записи за код "${upperChildCode}": ${totalCount}`);
        } catch (countError) {
            console.warn('[API] Грешка при броене на записи (продължавам):', countError.message);
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
            console.log(`[API] ========== ВСИЧКИ ЗАПИСИ ЗА КОД "${upperChildCode}" ==========`);
            result.rows.forEach((r, idx) => {
                console.log(`[API] Запис ${idx + 1}/${result.rows.length}:`, {
                    id: r.id,
                    child_code: r.child_code,
                    record_number: r.record_number,
                    amount: r.amount,
                    situation: r.situation,
                    datetime: r.datetime,
                    notes: r.notes || null
                });
            });
            console.log(`[API] ==========================================`);
        } else {
            console.warn(`[API] ⚠️ Няма намерени записи за код "${upperChildCode}"`);
        }
        
        res.json(result.rows);
    } catch (error) {
        console.error('[API] ❌ Грешка при зареждане на записи:', error);
        console.error('[API] Error name:', error.name);
        console.error('[API] Error message:', error.message);
        console.error('[API] Error code:', error.code);
        console.error('[API] Error detail:', error.detail);
        console.error('[API] Stack trace:', error.stack);
        
        // Проверяваме дали response вече е изпратен
        if (res.headersSent) {
            console.error('[API] ⚠️ Response вече е изпратен, не можем да променим статуса');
            return;
        }
        
        // Връщаме празен масив с 200 статус вместо 500, за да не спира приложението
        // Но първо логваме грешката за debugging
        console.log(`[API] Връщаме празен масив заради грешка (статус 200 за да не спира приложението)`);
        return res.status(200).json([]);
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
        console.log(`[API] DELETE /api/records/${id} - Изтриване на запис`);
        
        if (!id) {
            console.error('[API] ❌ ID не е предоставен!');
            return res.status(400).json({ error: 'Record ID is required' });
        }
        
        // Проверка дали записът съществува
        const checkResult = await pool.query('SELECT id, child_code FROM records WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            console.warn(`[API] ⚠️ Запис с ID ${id} не е намерен`);
            return res.status(404).json({ error: 'Record not found' });
        }
        
        console.log(`[API] Намерен запис за изтриване:`, checkResult.rows[0]);
        
        // Изтриване на записа
        const deleteResult = await pool.query('DELETE FROM records WHERE id = $1 RETURNING id', [id]);
        
        if (deleteResult.rowCount === 0) {
            console.warn(`[API] ⚠️ Запис с ID ${id} не е изтрит (може би вече е изтрит)`);
            return res.status(404).json({ error: 'Record not found or already deleted' });
        }
        
        console.log(`[API] ✅ Успешно изтрит запис с ID ${id}`);
        res.json({ success: true, deletedId: id });
    } catch (error) {
        console.error('[API] ❌ Грешка при изтриване на запис:', error);
        console.error('[API] Error name:', error.name);
        console.error('[API] Error message:', error.message);
        console.error('[API] Error code:', error.code);
        console.error('[API] Stack trace:', error.stack);
        
        // Проверяваме дали response вече е изпратен
        if (res.headersSent) {
            console.error('[API] ⚠️ Response вече е изпратен, не можем да променим статуса');
            return;
        }
        
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
    let upperChildCode = '';
    try {
        const { child_code } = req.params;
        // Конвертиране в главни букви за case-insensitive търсене
        upperChildCode = (child_code || '').toUpperCase();
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
                return res.status(200).json({ child_code: upperChildCode, name: null, last_accessed: null });
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
            return res.status(200).json({ child_code: upperChildCode, name: null, last_accessed: null });
        }
        
        console.log(`[API] Намерено дете:`, result.rows[0]);
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('[API] ❌ Грешка при зареждане на дете:', error);
        console.error('[API] Error name:', error.name);
        console.error('[API] Error message:', error.message);
        console.error('[API] Error code:', error.code);
        console.error('[API] Error detail:', error.detail);
        console.error('[API] Stack trace:', error.stack);
        
        // Връщаме празен обект с 200 статус вместо 500, за да не спира приложението
        if (!upperChildCode) {
            upperChildCode = (req.params?.child_code || '').toUpperCase();
        }
        console.log(`[API] Връщаме празен обект за код: "${upperChildCode}"`);
        return res.status(200).json({ child_code: upperChildCode, name: null, last_accessed: null });
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
        
        if (!uik || !device_serial || !pin) {
            return res.status(400).json({ error: 'UIK, сериен номер на устройството и PIN са задължителни' });
        }
        
        // Проверка на регистрацията
        const { rows: regRows } = await pool.query(
            'SELECT uik, name, pin_hash FROM uik_registrations WHERE uik = $1',
            [uik]
        );
        
        if (regRows.length === 0) {
            return res.status(404).json({ error: 'Не е намерена регистрация с този UIK' });
        }
        
        const { name, pin_hash } = regRows[0];
        
        // Проверка на PIN
        if (!verifyPIN(pin, pin_hash)) {
            return res.status(401).json({ error: 'Невалиден PIN' });
        }
        
        // Проверка дали устройството е регистрирано за този UIK
        const { rows: deviceRows } = await pool.query(
            'SELECT id FROM uik_devices WHERE uik = $1 AND device_serial = $2',
            [uik, device_serial]
        );
        
        if (deviceRows.length === 0) {
            return res.status(403).json({ error: 'Устройството не е регистрирано за този UIK' });
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
// Identifiers API (UUID, ULID, CUID2, Snowflake, QR)
// ============================================

app.get('/api/identifiers/catalog', (req, res) => {
    try {
        res.json({
            ...idService.IDENTIFIER_CATALOG,
            generatableTypes: idService.GENERATABLE_TYPES
        });
    } catch (error) {
        console.error('GET /api/identifiers/catalog:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/identifiers/generate', async (req, res) => {
    try {
        const {
            codeType,
            humanDescription,
            codeGroup,
            saveToDatabase,
            namespace,
            name
        } = req.body || {};

        if (!codeType || typeof codeType !== 'string') {
            return res.status(400).json({ error: 'Задължително поле codeType (напр. uuid-v4, ulid, snowflake)' });
        }

        const code = idService.generateCode(codeType.trim(), { namespace, name });

        const { payloadJson, qrRawString } = idService.buildQrPayload({
            code,
            codeType: codeType.trim(),
            humanDescription: humanDescription != null ? String(humanDescription) : '',
            codeGroup: codeGroup != null ? String(codeGroup) : ''
        });

        const wantsDb =
            saveToDatabase === true ||
            saveToDatabase === 'true' ||
            saveToDatabase === 1 ||
            saveToDatabase === '1';

        let savedRow = null;
        if (wantsDb) {
            const client = await pool.connect();
            try {
                const ins = await client.query(
                    `INSERT INTO identifier_codes (code_type, code_value, human_description, code_group)
                     VALUES ($1, $2, $3, $4)
                     RETURNING id, code_type, code_value, human_description, code_group, created_at`,
                    [
                        codeType.trim(),
                        code,
                        humanDescription != null ? String(humanDescription) : null,
                        codeGroup != null ? String(codeGroup) : null
                    ]
                );
                savedRow = ins.rows[0];
            } finally {
                client.release();
            }
        }

        res.status(201).json({
            code,
            codeType: codeType.trim(),
            humanDescription: humanDescription != null ? String(humanDescription) : '',
            codeGroup: codeGroup != null ? String(codeGroup) : '',
            qrPayload: payloadJson,
            qrRawString,
            saved: savedRow
        });
    } catch (error) {
        if (error.code === 'UNSUPPORTED_TYPE' || error.code === 'UUID_V2_UNSUPPORTED') {
            return res.status(400).json({ error: error.message });
        }
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Кодът вече съществува (рядка колизия при запис)' });
        }
        console.error('POST /api/identifiers/generate:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/identifiers/store', async (req, res) => {
    const { code, codeType, humanDescription, codeGroup } = req.body || {};

    if (code == null || String(code).trim() === '') {
        return res.status(400).json({ error: 'Задължително поле code (идентификатор)' });
    }
    if (!codeType || typeof codeType !== 'string' || !codeType.trim()) {
        return res.status(400).json({ error: 'Задължително поле codeType' });
    }

    const client = await pool.connect();
    try {
        const ins = await client.query(
            `INSERT INTO identifier_codes (code_type, code_value, human_description, code_group)
             VALUES ($1, $2, $3, $4)
             RETURNING id, code_type, code_value, human_description, code_group, created_at`,
            [
                codeType.trim(),
                String(code).trim(),
                humanDescription != null && String(humanDescription).trim() !== ''
                    ? String(humanDescription)
                    : null,
                codeGroup != null && String(codeGroup).trim() !== '' ? String(codeGroup) : null
            ]
        );

        res.status(201).json({
            message: 'Нов запис е създаден в БД',
            saved: ins.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Този code_value вече съществува в БД (уникален ключ). Генерирай нов код или използвай друг запис.'
            });
        }
        console.error('POST /api/identifiers/store:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

app.post('/api/identifiers/validate', (req, res) => {
    try {
        const { code, codeType } = req.body || {};
        if (code == null || String(code).trim() === '') {
            return res.status(400).json({ error: 'Задължително поле code' });
        }
        const result = idService.validateCode(String(code), codeType ? String(codeType).trim() : undefined);
        res.json(result);
    } catch (error) {
        console.error('POST /api/identifiers/validate:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/identifiers/parse-qr', (req, res) => {
    try {
        const { raw } = req.body || {};
        if (raw == null) {
            return res.status(400).json({ error: 'Задължително поле raw (съдържание от QR скенер)' });
        }
        const parsed = idService.parseQrPayload(String(raw));
        res.json(parsed);
    } catch (error) {
        console.error('POST /api/identifiers/parse-qr:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/identifiers/qr', async (req, res) => {
    try {
        const { payload, width, margin } = req.body || {};
        let text;
        if (payload != null && typeof payload === 'object') {
            text = JSON.stringify(payload);
        } else if (typeof payload === 'string') {
            text = payload;
        } else {
            return res.status(400).json({
                error: 'Задължително поле payload (обект qrPayload от /generate или JSON низ)'
            });
        }
        const w = Math.min(1024, Math.max(120, Number(width) || 320));
        const m = Math.min(8, Math.max(0, Number(margin) || 2));
        const buf = await QRCode.toBuffer(text, {
            type: 'png',
            width: w,
            margin: m,
            errorCorrectionLevel: 'M',
            color: { dark: '#000000ff', light: '#ffffffff' }
        });
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-store');
        res.send(buf);
    } catch (error) {
        console.error('POST /api/identifiers/qr:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/identifiers/stored', async (req, res) => {
    const client = await pool.connect();
    try {
        const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 100));
        const { rows } = await client.query(
            `SELECT id, code_type, code_value, human_description, code_group, created_at
             FROM identifier_codes
             ORDER BY created_at DESC
             LIMIT $1`,
            [limit]
        );
        res.json(rows);
    } catch (error) {
        console.error('GET /api/identifiers/stored:', error);
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

