// Test API with sample data
const mysql = require('mysql2/promise');

const config = {
    host: '78.142.63.8',
    user: 'inex_mamafood_user',
    password: 'Parola_123!@#',
    database: 'inex_deklarado'
};

async function testAPI() {
    const connection = await mysql.createConnection(config);
    
    try {
        console.log('🧪 Тестване на API с sample данни...\n');
        
        // Insert test child
        await connection.execute(
            'INSERT INTO children (child_code, name, last_accessed) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE last_accessed = NOW()',
            ['BEBE_TEST01', 'Габриела']
        );
        console.log('✅ Тестово дете създадено: BEBE_TEST01');
        
        // Insert test records
        const testRecords = [
            ['BEBE_TEST01', 1, 100, 'fridge', '2024-10-28 10:00:00', 'Test portция 1'],
            ['BEBE_TEST01', 2, 150, 'room', '2024-10-28 14:00:00', 'Test portция 2'],
            ['BEBE_TEST01', 3, 120, 'freezer', '2024-10-27 18:00:00', 'Test portция 3']
        ];
        
        for (const record of testRecords) {
            const [result] = await connection.execute(
                'INSERT INTO records (child_code, record_number, amount, situation, datetime, notes) VALUES (?, ?, ?, ?, ?, ?)',
                record
            );
            console.log(`✅ Запис #${record[1]} създаден (ID: ${result.insertId})`);
        }
        
        // Verify records
        const [records] = await connection.execute(
            'SELECT * FROM records WHERE child_code = ? ORDER BY datetime DESC',
            ['BEBE_TEST01']
        );
        
        console.log('\n📊 Всички записи за BEBE_TEST01:');
        records.forEach(r => {
            console.log(`  #${r.record_number}: ${r.amount}ml ${r.situation} (${r.datetime})`);
        });
        
        console.log('\n✅ API тест успешен!');
        
    } catch (error) {
        console.error('❌ Грешка:', error.message);
    } finally {
        await connection.end();
    }
}

testAPI();

