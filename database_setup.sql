-- ============================================
-- МАМАФООД Database Setup for MySQL
-- Използвай този скрипт в MySQL
-- ============================================

-- Създай базата ако няма
CREATE DATABASE IF NOT EXISTS mamafood CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE mamafood;

-- Таблица за деца (children)
CREATE TABLE IF NOT EXISTS children (
    id INT PRIMARY KEY AUTO_INCREMENT,
    child_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_child_code (child_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Таблица за порции (records)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Таблица за достъпи по устройства
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Таблица за настройки на приложението
CREATE TABLE IF NOT EXISTS app_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    child_code VARCHAR(50) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_code) REFERENCES children(child_code) ON DELETE CASCADE,
    UNIQUE KEY unique_setting (child_code, setting_key),
    INDEX idx_child_setting (child_code, setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Views
-- ============================================

CREATE OR REPLACE VIEW v_records_summary AS
SELECT 
    r.child_code,
    c.name AS child_name,
    COUNT(r.id) AS total_records,
    SUM(r.amount) AS total_amount,
    MAX(r.datetime) AS last_record,
    COUNT(DISTINCT r.situation) AS unique_situations
FROM records r
JOIN children c ON r.child_code = c.child_code
GROUP BY r.child_code, c.name;

-- ============================================
-- Test Data
-- ============================================

-- Insert test child
INSERT INTO children (child_code, name, created_at) 
VALUES ('BEBE_TEST01', 'Test Baby', NOW())
ON DUPLICATE KEY UPDATE name = name;

-- ============================================
-- Useful Queries
-- ============================================

-- Get all records for a child
-- SELECT * FROM records WHERE child_code = 'BEBE_TEST01' ORDER BY datetime DESC;

-- Get child info
-- SELECT * FROM children WHERE child_code = 'BEBE_TEST01';

-- Count records per child
-- SELECT child_code, COUNT(*) as total FROM records GROUP BY child_code;

