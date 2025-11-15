-- ============================================
-- Скрипт за премахване на дублирани записи за KAI
-- ⚠️ ВНИМАНИЕ: Направи backup преди изпълнение!
-- ============================================

-- Първо виж какво ще се изтрие
SELECT 
    id,
    child_code,
    record_number,
    amount,
    situation,
    datetime,
    notes
FROM records
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
)
ORDER BY datetime DESC;

-- Ако резултатът изглежда правилен, разкоментирай следния ред за да изтриеш дублираните записи:
-- DELETE FROM records WHERE id IN (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY child_code, record_number, amount, situation, datetime ORDER BY id DESC) as row_num FROM records WHERE UPPER(child_code) = 'KAI') t WHERE row_num > 1);

