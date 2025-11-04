// ============================================
// МАМАФООД Backend Server
// Express API server for MySQL database
// ============================================

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const webpush = require('web-push');

const app = express();
const PORT = process.env.PORT || 9000;

// Production: use environment variables, development: use defaults

// ============================================
// Configuration
// ============================================

const dbConfig = {
    host: process.env.DB_HOST || '78.142.63.8',
    user: process.env.DB_USER || 'inex_mamafood_user',
    password: process.env.DB_PASSWORD || 'Parola_123!@#',
    database: process.env.DB_NAME || 'inex_deklarado',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000
};

// Create connection pool
const pool = mysql.createPool({
    ...dbConfig,
    typeCast: function (field, next) {
        if (field.type === 'VAR_STRING' || field.type === 'STRING') {
            return field.string();
        }
        return next();
    }
});

// Test connection and set charset for all connections
(async () => {
    try {
        const connection = await pool.getConnection();
        await connection.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
        await connection.query("SET CHARACTER SET utf8mb4");
        await connection.query("SET character_set_connection=utf8mb4");
        console.log('✅ Database charset: utf8mb4');
        connection.release();
    } catch (err) {
        console.warn('⚠️ Warning setting charset:', err.message);
    }
})();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

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

// ============================================
// Push Notifications setup
// ============================================
// Use env or generated keys
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
        await pool.execute(`CREATE TABLE IF NOT EXISTS push_subscriptions (
            id INT PRIMARY KEY AUTO_INCREMENT,
            child_code VARCHAR(50) NOT NULL,
            endpoint TEXT NOT NULL,
            p256dh VARCHAR(255) NOT NULL,
            auth VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_sub (child_code, endpoint(255))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
    } catch (e) {
        console.error('Failed ensuring push_subscriptions table:', e.message);
    }
})();

// Get VAPID public key for client
app.get('/api/push/publicKey', (req, res) => {
    if (VAPID_PUBLIC && VAPID_PUBLIC.length > 50) {
        res.json({ publicKey: VAPID_PUBLIC });
    } else {
        res.status(503).json({ error: 'Push notifications not configured' });
    }
});

// Save subscription
app.post('/api/push/subscribe', async (req, res) => {
    try {
        const { child_code, subscription } = req.body;
        if (!child_code || !subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Invalid subscription' });
        }
        const { endpoint, keys } = subscription;
        await pool.execute(
            `INSERT INTO push_subscriptions (child_code, endpoint, p256dh, auth)
             VALUES (?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE p256dh = VALUES(p256dh), auth = VALUES(auth)`,
            [child_code, endpoint, keys.p256dh, keys.auth]
        );
        res.json({ success: true });
    } catch (e) {
        console.error('Push subscribe error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Test send push to all subscriptions for a child
app.post('/api/push/test', async (req, res) => {
    try {
        const { child_code, title, body } = req.body;
        const [rows] = await pool.execute('SELECT * FROM push_subscriptions WHERE child_code = ?', [child_code]);
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

// GET /api/records/:child_code - Get all records for a child
app.get('/api/records/:child_code', async (req, res) => {
    try {
        const { child_code } = req.params;
        
        const [rows] = await pool.execute(
            'SELECT * FROM records WHERE child_code = ? ORDER BY datetime DESC',
            [child_code]
        );
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/records - Add a new record
app.post('/api/records', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        // Ensure UTF-8 for this connection
        await connection.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
        await connection.beginTransaction();
        
        const { child_code, record_number, amount, situation, datetime, notes } = req.body;
        
        if (!child_code || !record_number || !amount || !situation || !datetime) {
            await connection.rollback();
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Ensure child exists to satisfy FK constraint - with transaction safety
        try {
            // First, check if child exists
            const [childCheck] = await connection.execute(
                'SELECT child_code FROM children WHERE child_code = ?',
                [child_code]
            );
            
            if (childCheck.length === 0) {
                // Child doesn't exist, create it
                await connection.execute(
                    'INSERT INTO children (child_code, last_accessed) VALUES (?, NOW())',
                    [child_code]
                );
                console.log(`✅ Created child: ${child_code}`);
            } else {
                // Update last accessed
                await connection.execute(
                    'UPDATE children SET last_accessed = NOW() WHERE child_code = ?',
                    [child_code]
                );
            }
        } catch (childError) {
            await connection.rollback();
            console.error('Error ensuring child exists:', childError);
            return res.status(500).json({ error: `Failed to ensure child exists: ${childError.message}` });
        }
        
        // Now insert the record
        const [result] = await connection.execute(
            'INSERT INTO records (child_code, record_number, amount, situation, datetime, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [child_code, record_number, amount, situation, datetime, notes || null]
        );
        
        await connection.commit();
        console.log(`✅ Added record #${record_number} for child ${child_code}`);
        
        res.json({ id: result.insertId, ...req.body });
    } catch (error) {
        await connection.rollback();
        console.error('Error adding record:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// PUT /api/records/:id - Update existing record
app.put('/api/records/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, situation, datetime, notes } = req.body;
        
        await pool.execute(
            'UPDATE records SET amount = ?, situation = ?, datetime = ?, notes = ? WHERE id = ?',
            [amount, situation, datetime, notes || null, id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating record:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/records/:id - Delete a record
app.delete('/api/records/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.execute('DELETE FROM records WHERE id = ?', [id]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting record:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/children - Create or get child
app.post('/api/children', async (req, res) => {
    try {
        const { child_code, name } = req.body;
        
        if (!child_code) {
            return res.status(400).json({ error: 'child_code is required' });
        }
        
        // Try to insert, if exists get it
        await pool.execute(
            'INSERT INTO children (child_code, name, last_accessed) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE name = VALUES(name), last_accessed = NOW()',
            [child_code, name || null]
        );
        
        res.json({ child_code, name });
    } catch (error) {
        console.error('Error with child:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/children/:child_code - Get child info
app.get('/api/children/:child_code', async (req, res) => {
    try {
        const { child_code } = req.params;
        
        const [rows] = await pool.execute(
            'SELECT * FROM children WHERE child_code = ?',
            [child_code]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Child not found' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching child:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/devices - Register device
app.post('/api/devices', async (req, res) => {
    try {
        const { child_code, device_id, device_name } = req.body;
        
        await pool.execute(
            'INSERT INTO device_access (child_code, device_id, device_name, last_sync) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE last_sync = NOW()',
            [child_code, device_id, device_name]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error registering device:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Serve Frontend
// ============================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 МАМАФООД Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${dbConfig.database} on ${dbConfig.host}`);
});

