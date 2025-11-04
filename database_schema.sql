-- ============================================
-- МАМАФООД Database Schema
-- SQL Server / MySQL / PostgreSQL
-- ============================================

-- Таблица за деца (children)
CREATE TABLE children (
    id INT PRIMARY KEY IDENTITY(1,1),  -- SQL Server
    -- id INT PRIMARY KEY AUTO_INCREMENT,  -- MySQL
    -- id SERIAL PRIMARY KEY,             -- PostgreSQL
    child_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP,
    is_active BIT DEFAULT 1,  -- SQL Server (BIT = boolean)
    INDEX idx_child_code (child_code)
);

-- Таблица за порции (records)
CREATE TABLE records (
    id BIGINT PRIMARY KEY IDENTITY(1,1),  -- SQL Server
    -- id BIGINT PRIMARY KEY AUTO_INCREMENT,  -- MySQL
    -- id BIGSERIAL PRIMARY KEY,             -- PostgreSQL
    child_code VARCHAR(50) NOT NULL,
    record_number INT NOT NULL,
    amount INT NOT NULL COMMENT 'Количество в ml',
    situation VARCHAR(50) NOT NULL COMMENT 'Тип ситуация (room, fridge, etc.)',
    datetime TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_code) REFERENCES children(child_code),
    INDEX idx_child_code (child_code),
    INDEX idx_datetime (datetime),
    INDEX idx_record_number (child_code, record_number)
);

-- Таблица за достъпи по устройства
CREATE TABLE device_access (
    id INT PRIMARY KEY IDENTITY(1,1),  -- SQL Server
    -- id INT PRIMARY KEY AUTO_INCREMENT,  -- MySQL
    -- id SERIAL PRIMARY KEY,             -- PostgreSQL
    child_code VARCHAR(50) NOT NULL,
    device_id VARCHAR(100) NOT NULL COMMENT 'Unique device identifier',
    device_name VARCHAR(200),
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_code) REFERENCES children(child_code),
    UNIQUE KEY unique_device (child_code, device_id),
    INDEX idx_child_device (child_code, device_id)
);

-- Таблица за настройки на приложението
CREATE TABLE app_settings (
    id INT PRIMARY KEY IDENTITY(1,1),  -- SQL Server
    -- id INT PRIMARY KEY AUTO_INCREMENT,  -- MySQL
    -- id SERIAL PRIMARY KEY,             -- PostgreSQL
    child_code VARCHAR(50) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_code) REFERENCES children(child_code),
    UNIQUE KEY unique_setting (child_code, setting_key),
    INDEX idx_child_setting (child_code, setting_key)
);

-- ============================================
-- Sample Data (for testing)
-- ============================================

-- Insert test child
INSERT INTO children (child_code, name, created_at) 
VALUES ('BEBE_TEST01', 'Test Baby', NOW());

-- ============================================
-- Useful Queries
-- ============================================

-- Get all records for a child
-- SELECT * FROM records WHERE child_code = 'BEBE_TEST01' ORDER BY datetime DESC;

-- Get child info
-- SELECT * FROM children WHERE child_code = 'BEBE_TEST01';

-- Get device access log
-- SELECT * FROM device_access WHERE child_code = 'BEBE_TEST01';

-- Get settings for a child
-- SELECT * FROM app_settings WHERE child_code = 'BEBE_TEST01';

-- ============================================
-- Views
-- ============================================

CREATE VIEW v_records_summary AS
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

CREATE VIEW v_active_children AS
SELECT 
    c.id,
    c.child_code,
    c.name,
    c.created_at,
    c.last_accessed,
    COUNT(r.id) AS record_count,
    MAX(r.datetime) AS last_record_date
FROM children c
LEFT JOIN records r ON c.child_code = r.child_code
WHERE c.is_active = TRUE
GROUP BY c.id, c.child_code, c.name, c.created_at, c.last_accessed
ORDER BY c.last_accessed DESC;

-- ============================================
-- Stored Procedures (SQL Server)
-- ============================================

CREATE PROCEDURE GetRecordsByChild
    @p_child_code VARCHAR(50)
AS
BEGIN
    SELECT * FROM records 
    WHERE child_code = @p_child_code 
    ORDER BY datetime DESC;
END

CREATE PROCEDURE AddRecord
    @p_child_code VARCHAR(50),
    @p_record_number INT,
    @p_amount INT,
    @p_situation VARCHAR(50),
    @p_datetime DATETIME,
    @p_notes NVARCHAR(MAX)
AS
BEGIN
    INSERT INTO records (child_code, record_number, amount, situation, datetime, notes)
    VALUES (@p_child_code, @p_record_number, @p_amount, @p_situation, @p_datetime, @p_notes);
    
    -- Update last accessed
    UPDATE children SET last_accessed = GETDATE() WHERE child_code = @p_child_code;
    
    SELECT SCOPE_IDENTITY() AS new_record_id;
END

-- ============================================
-- Notes:
-- ============================================
-- SQL Server Configuration:
-- - Use IDENTITY(1,1) for auto-increment
-- - Use BIT for boolean (0 = false, 1 = true)
-- - Use NVARCHAR for Unicode text
-- - Use GETDATE() for current timestamp
-- - Use SCOPE_IDENTITY() for last inserted ID
-- 
-- Child_code is the main identifier for each child's data
-- Records are linked to child_code via foreign key
-- Device tracking helps monitor which devices access the data
-- ============================================

