-- ============================================
-- МАМАФООД Database Setup for PostgreSQL
-- Използвай този скрипт в PostgreSQL (Render.com)
-- ============================================

-- Таблица за деца (children)
CREATE TABLE IF NOT EXISTS children (
    id SERIAL PRIMARY KEY,
    child_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_child_code ON children(child_code);

-- Таблица за порции (records)
CREATE TABLE IF NOT EXISTS records (
    id BIGSERIAL PRIMARY KEY,
    child_code VARCHAR(50) NOT NULL,
    record_number INT NOT NULL,
    amount INT NOT NULL,
    situation VARCHAR(50) NOT NULL,
    datetime TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_code) REFERENCES children(child_code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_records_child_code ON records(child_code);
CREATE INDEX IF NOT EXISTS idx_records_datetime ON records(datetime);
CREATE INDEX IF NOT EXISTS idx_records_record_number ON records(child_code, record_number);

-- Trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_records_updated_at BEFORE UPDATE ON records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Таблица за достъпи по устройства
CREATE TABLE IF NOT EXISTS device_access (
    id SERIAL PRIMARY KEY,
    child_code VARCHAR(50) NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    device_name VARCHAR(200),
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_code) REFERENCES children(child_code) ON DELETE CASCADE,
    CONSTRAINT unique_device UNIQUE (child_code, device_id)
);

CREATE INDEX IF NOT EXISTS idx_device_child_device ON device_access(child_code, device_id);

-- Таблица за настройки на приложението
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    child_code VARCHAR(50) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_code) REFERENCES children(child_code) ON DELETE CASCADE,
    CONSTRAINT unique_setting UNIQUE (child_code, setting_key)
);

CREATE INDEX IF NOT EXISTS idx_app_settings_child_setting ON app_settings(child_code, setting_key);

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
ON CONFLICT (child_code) DO UPDATE SET name = EXCLUDED.name;

-- ============================================
-- Useful Queries
-- ============================================

-- Get all records for a child
-- SELECT * FROM records WHERE child_code = 'BEBE_TEST01' ORDER BY datetime DESC;

-- Get child info
-- SELECT * FROM children WHERE child_code = 'BEBE_TEST01';

-- Count records per child
-- SELECT child_code, COUNT(*) as total FROM records GROUP BY child_code;

