// ============================================
// Create Database Tables
// Изпълнява SQL скрипта за създаване на таблиците
// ============================================

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
    host: '78.142.63.8',
    user: 'inex_mamafood_user',
    password: 'Parola_123!@#',
    database: 'inex_deklarado',
    multipleStatements: true
};

async function createTables() {
    let connection;
    
    try {
        console.log('🔌 Свързване към MySQL...');
        connection = await mysql.createConnection(config);
        console.log('✅ Успешно свързване!');
        
        console.log('\n🔨 Създаване на таблици...');
        
        // Create children table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS children (
                id INT PRIMARY KEY AUTO_INCREMENT,
                child_code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_accessed TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                INDEX idx_child_code (child_code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('  ✅ Таблица: children');
        
        // Create records table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS records (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                child_code VARCHAR(50) NOT NULL,
                record_number INT NOT NULL,
                amount INT NOT NULL COMMENT 'Количество в ml',
                situation VARCHAR(50) NOT NULL COMMENT 'Тип ситуация (room, fridge, etc.)',
                datetime DATETIME NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (child_code) REFERENCES children(child_code) ON DELETE CASCADE,
                INDEX idx_child_code (child_code),
                INDEX idx_datetime (datetime),
                INDEX idx_record_number (child_code, record_number)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('  ✅ Таблица: records');
        
        // Create device_access table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS device_access (
                id INT PRIMARY KEY AUTO_INCREMENT,
                child_code VARCHAR(50) NOT NULL,
                device_id VARCHAR(100) NOT NULL COMMENT 'Unique device identifier',
                device_name VARCHAR(200),
                last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (child_code) REFERENCES children(child_code) ON DELETE CASCADE,
                UNIQUE KEY unique_device (child_code, device_id),
                INDEX idx_child_device (child_code, device_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('  ✅ Таблица: device_access');
        
        // Create app_settings table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS app_settings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                child_code VARCHAR(50) NOT NULL,
                setting_key VARCHAR(100) NOT NULL,
                setting_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (child_code) REFERENCES children(child_code) ON DELETE CASCADE,
                UNIQUE KEY unique_setting (child_code, setting_key),
                INDEX idx_child_setting (child_code, setting_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('  ✅ Таблица: app_settings');
        
        console.log('✅ Таблиците са създадени успешно!');
        
        // Verify tables
        console.log('\n📋 Проверка на създадените таблици:');
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE()
        `);
        
        tables.forEach(table => {
            console.log('  ✅', table.TABLE_NAME);
        });
        
        console.log('\n🎉 Готово! Базата данни е готова за използване.');
        
    } catch (error) {
        console.error('❌ Грешка:', error.message);
        if (error.code) {
            console.error('Код на грешка:', error.code);
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Връзката е затворена.');
        }
    }
}

// Run
createTables();

