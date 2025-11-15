-- ============================================
-- Проверка и премахване на дублирани записи
-- ============================================

-- 1. Проверка за дублирани записи (същият child_code, record_number, amount, situation, datetime)
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

-- 2. Проверка за дублирани ID-та (не би трябвало да има, но да проверим)
SELECT id, COUNT(*) as count
FROM records
WHERE UPPER(child_code) = 'KAI'
GROUP BY id
HAVING COUNT(*) > 1;

-- 3. Покажи всички записи за KAI с детайли
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

-- 4. Премахване на дублирани записи (запазва най-стария запис, изтрива останалите)
-- ⚠️ ВНИМАНИЕ: Това ще изтрие дублирани записи! Направи backup преди това!
/*
DELETE FROM records
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY child_code, record_number, amount, situation, datetime 
                   ORDER BY id ASC
               ) as row_num
        FROM records
        WHERE UPPER(child_code) = 'KAI'
    ) t
    WHERE row_num > 1
);
*/

-- 5. Премахване на дублирани записи (запазва най-новия запис, изтрива останалите)
-- ⚠️ ВНИМАНИЕ: Това ще изтрие дублирани записи! Направи backup преди това!
/*
DELETE FROM records
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY child_code, record_number, amount, situation, datetime 
                   ORDER BY id DESC
               ) as row_num
        FROM records
        WHERE UPPER(child_code) = 'KAI'
    ) t
    WHERE row_num > 1
);
*/

