// ============================================
// МАМАФООД Backend Server
// Express API server for PostgreSQL database
// Backend-only version (for deployment on Render.com)
// ============================================

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
const dbConfig = {
    connectionString: process.env.DATABASE_URL,
    // Or individual variables if DATABASE_URL is not set
    host: process.env.POSTGRES_HOST || process.env.DB_HOST,
    user: process.env.POSTGRES_USER || process.env.DB_USER,
    password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.POSTGRES_DATABASE || process.env.DB_NAME,
    port: process.env.POSTGRES_PORT || process.env.DB_PORT || 5432,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
};

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
        console.error('❌ Database connection test failed:', err.message);
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
        const result = await pool.query('SELECT * FROM push_subscriptions WHERE child_code = $1', [child_code]);
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

app.get('/api/records/:child_code', async (req, res) => {
    try {
        const { child_code } = req.params;
        const result = await pool.query(
            'SELECT * FROM records WHERE child_code = $1 ORDER BY datetime DESC',
            [child_code]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/records/:child_code/next-number - Get next record number for child
app.get('/api/records/:child_code/next-number', async (req, res) => {
    try {
        const { child_code } = req.params;
        const result = await pool.query(
            'SELECT COALESCE(MAX(record_number), 0) + 1 AS next_number FROM records WHERE child_code = $1',
            [child_code]
        );
        const nextNumber = result.rows[0]?.next_number || 1;
        res.json({ record_number: nextNumber });
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
        
        // Ensure child exists
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
        
        const result = await client.query(
            'INSERT INTO records (child_code, record_number, amount, situation, datetime, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [child_code, record_number, amount, situation, datetime, notes || null]
        );
        
        await client.query('COMMIT');
        console.log(`✅ Added record #${record_number} for child ${child_code}`);
        
        res.json({ id: result.rows[0].id, ...req.body });
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
        const result = await pool.query(
            'SELECT * FROM children WHERE child_code = $1',
            [child_code]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Child not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching child:', error);
        res.status(500).json({ error: error.message });
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

