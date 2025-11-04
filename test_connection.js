// ============================================
// Test MySQL Connection
// За тестване на връзката с базата данни
// ============================================

// За да пуснеш този скрипт:
// npm install mysql2
// node test_connection.js

const mysql = require('mysql2/promise');

// CONFIG - Замени със своите данни
const config = {
    host: '78.142.63.8',
    user: 'inex_mamafood_user',
    password: 'Parola_123!@#',
    database: 'inex_deklarado',
    waitForConnections: true,
    connectionLimit: 10
};

async function testConnection() {
    let connection;
    
    try {
        console.log('🔌 Свързване към MySQL...');
        connection = await mysql.createConnection(config);
        
        console.log('✅ Успешно свързване!');
        
        // Test query
        const [rows] = await connection.execute('SELECT VERSION() as version');
        console.log('📊 MySQL Version:', rows[0].version);
        
        // Check tables
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'mamafood'
        `);
        
        console.log('\n📋 Създадени таблици:');
        tables.forEach(table => console.log('  -', table.TABLE_NAME));
        
        // Test insert and select
        console.log('\n🧪 Тестване на INSERT/SELECT...');
        
        const [result] = await connection.execute(`
            INSERT INTO children (child_code, name) 
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE name = VALUES(name)
        `, ['TEST_' + Date.now(), 'Test Child']);
        
        console.log('✅ INSERT успешен, ID:', result.insertId);
        
        const [children] = await connection.execute('SELECT * FROM children LIMIT 5');
        console.log('\n👶 Деца в базата:');
        children.forEach(child => {
            console.log(`  - ${child.child_code}: ${child.name || 'N/A'}`);
        });
        
        console.log('\n✅ Всичко работи отлично!');
        
    } catch (error) {
        console.error('❌ Грешка:', error.message);
        console.error('\nПроверете:');
        console.error('  1. Данните за връзка в config');
        console.error('  2. Базата е създадена (mysql test_connection.js)');
        console.error('  3. Таблиците са създадени (database_setup.sql)');
        console.error('  4. Потребителят има права за достъп');
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Връзката е затворена.');
        }
    }
}

// Run test
testConnection();

