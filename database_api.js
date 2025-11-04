// ============================================
// МАМАФООД Database API
// Backend API for SQL database integration
// ============================================

// This file should be adapted for your backend framework
// (Node.js/Express, Python/Flask, PHP, etc.)

const BASE_URL = 'https://your-server.com/api'; // Replace with actual server URL

// API Client for interacting with SQL database
class MamafoodAPI {
    constructor(childCode) {
        this.childCode = childCode;
        this.baseURL = BASE_URL;
    }

    // Get all records for this child
    async getRecords() {
        try {
            const response = await fetch(`${this.baseURL}/records/${this.childCode}`);
            if (!response.ok) throw new Error('Failed to fetch records');
            return await response.json();
        } catch (error) {
            console.error('Error fetching records:', error);
            return [];
        }
    }

    // Add a new record
    async addRecord(record) {
        try {
            const response = await fetch(`${this.baseURL}/records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    child_code: this.childCode,
                    record_number: record.recordNumber,
                    amount: record.amount,
                    situation: record.situation,
                    datetime: record.datetime,
                    notes: record.notes
                })
            });
            
            if (!response.ok) throw new Error('Failed to add record');
            return await response.json();
        } catch (error) {
            console.error('Error adding record:', error);
            throw error;
        }
    }

    // Update existing record
    async updateRecord(recordId, updates) {
        try {
            const response = await fetch(`${this.baseURL}/records/${recordId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            
            if (!response.ok) throw new Error('Failed to update record');
            return await response.json();
        } catch (error) {
            console.error('Error updating record:', error);
            throw error;
        }
    }

    // Delete record
    async deleteRecord(recordId) {
        try {
            const response = await fetch(`${this.baseURL}/records/${recordId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete record');
            return true;
        } catch (error) {
            console.error('Error deleting record:', error);
            throw error;
        }
    }

    // Register device access
    async registerDevice(deviceInfo) {
        try {
            const deviceId = this.getDeviceId();
            
            const response = await fetch(`${this.baseURL}/devices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    child_code: this.childCode,
                    device_id: deviceId,
                    device_name: deviceInfo.name || 'Unknown Device',
                    last_sync: new Date().toISOString()
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error registering device:', error);
        }
    }

    // Get device ID (unique per device)
    getDeviceId() {
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('device_id', deviceId);
        }
        return deviceId;
    }
}

// ============================================
// Integration with existing app
// ============================================

// To integrate, modify loadRecords() and saveRecords() in app.js:

/*
function loadRecords() {
    const api = new MamafoodAPI(childCode);
    return api.getRecords();
}

function saveRecords() {
    // Save to both local storage (for offline) and API (for sync)
    localStorage.setItem('mamafood_records_local', JSON.stringify(records));
    
    // Sync with server
    const api = new MamafoodAPI(childCode);
    records.forEach(record => {
        if (record.needsSync) {
            api.addRecord(record);
            record.needsSync = false;
        }
    });
}
*/

// ============================================
// Backend API Endpoints (example - Node.js/Express)
// ============================================

/*
// GET /api/records/:child_code
app.get('/api/records/:child_code', async (req, res) => {
    const { child_code } = req.params;
    try {
        const records = await db.query(
            'SELECT * FROM records WHERE child_code = ? ORDER BY datetime DESC',
            [child_code]
        );
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/records
app.post('/api/records', async (req, res) => {
    const { child_code, record_number, amount, situation, datetime, notes } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO records (child_code, record_number, amount, situation, datetime, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [child_code, record_number, amount, situation, datetime, notes]
        );
        res.json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/records/:id
app.put('/api/records/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
        await db.query(
            'UPDATE records SET ? WHERE id = ?',
            [updates, id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/records/:id
app.delete('/api/records/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM records WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
*/

