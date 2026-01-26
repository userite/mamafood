-- ============================================
-- Проверка на записи за KAI (без created_at)
-- ============================================

-- 1. Покажи всички записи за KAI
SELECT 
    id,
    child_code,
    record_number,
    amount,
    situation,
    datetime,
    notes
FROM records
WHERE UPPER(child_code) = 'KAI'
ORDER BY datetime DESC;

-- 2. Проверка за дублирани записи (същият record_number, amount, situation, datetime)
SELECT 
    child_code,
    record_number,
    amount,
    situation,
    datetime,
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY id) as record_ids
FROM records
WHERE UPPER(child_code) = 'KAI'
GROUP BY child_code, record_number, amount, situation, datetime
HAVING COUNT(*) > 1
ORDER BY datetime DESC;

-- 3. Брой записи за KAI
SELECT COUNT(*) as total_records
FROM records
WHERE UPPER(child_code) = 'KAI';

