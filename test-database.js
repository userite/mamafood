// Скрипт за тест на връзката с PostgreSQL базата данни
// Настройка на encoding за правилно показване на кирилица
if (process.platform === 'win32') {
    try {
        require('child_process').exec('chcp 65001', { stdio: 'ignore' });
    } catch (e) {}
}

try {
    require('dotenv').config();
} catch (e) {
    // dotenv не е инсталиран, но това е OK - може да се използва process.env директно
    console.log('Zabelezhka: dotenv ne e nameren. Ispolzva se process.env direktno.\n');
}
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    console.log('========================================');
    console.log('Test na vruzka s PostgreSQL baza');
    console.log('========================================\n');

    // Proverka na DATABASE_URL
    if (!process.env.DATABASE_URL) {
        console.error('ERROR: DATABASE_URL ne e zadan v .env faila!');
        console.log('\nSuzdai .env fail s:');
        console.log('DATABASE_URL=postgresql://username:password@host:port/database');
        process.exit(1);
    }

    console.log('OK DATABASE_URL e zadan');
    console.log('   (purvite 30 simvola):', process.env.DATABASE_URL.substring(0, 30) + '...\n');

    let client;
    try {
        // Opit za svurzvane
        console.log('Opit za svurzvane s bazata danni...');
        client = await pool.connect();
        console.log('OK Uspehna vruzka s bazata danni!\n');

        // Proverka na tablicite
        console.log('Proverka na tablicite...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        
        console.log(`OK Namereni ${tablesResult.rows.length} tablici:`);
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        console.log('');

        // Proverka za zapisi za "KAI"
        console.log('Proverka za zapisi za kod "KAI"...');
        const recordsResult = await client.query(`
            SELECT COUNT(*) as count 
            FROM records 
            WHERE UPPER(child_code) = 'KAI';
        `);
        const recordCount = parseInt(recordsResult.rows[0].count);
        console.log(`OK Namereni ${recordCount} zapisa za kod "KAI"\n`);

        if (recordCount > 0) {
            // Показване на първите 5 записа
            const sampleRecords = await client.query(`
                SELECT id, child_code, record_number, amount, situation, datetime, notes
                FROM records 
                WHERE UPPER(child_code) = 'KAI'
                ORDER BY datetime DESC
                LIMIT 5;
            `);
            
            console.log('Purvite 5 zapisa:');
            sampleRecords.rows.forEach((record, index) => {
                console.log(`\n   Zapis ${index + 1}:`);
                console.log(`   - ID: ${record.id}`);
                console.log(`   - Kod: ${record.child_code}`);
                console.log(`   - Nomer: ${record.record_number}`);
                console.log(`   - Kolichestvo: ${record.amount}`);
                console.log(`   - Situatsiya: ${record.situation}`);
                console.log(`   - Data/Chas: ${record.datetime}`);
                if (record.notes) {
                    console.log(`   - Belezhki: ${record.notes}`);
                }
            });
        } else {
            console.log('WARNING: Nyama zapisi za kod "KAI" v bazata danni.');
            console.log('   Proveri dali kodat v bazata e tochno "KAI" (moje da e "kai" ili drug variant).\n');
            
            // Proverka na vsichki razlichni kodove
            const allCodes = await client.query(`
                SELECT DISTINCT child_code, COUNT(*) as count
                FROM records
                GROUP BY child_code
                ORDER BY child_code;
            `);
            
            if (allCodes.rows.length > 0) {
                console.log('Namereni kodove v bazata danni:');
                allCodes.rows.forEach(row => {
                    console.log(`   - "${row.child_code}": ${row.count} zapisa`);
                });
            }
        }

        // Proverka na children tablicata
        console.log('\nProverka na children tablicata...');
        const childrenResult = await client.query(`
            SELECT child_code, name, last_accessed
            FROM children
            WHERE UPPER(child_code) = 'KAI';
        `);
        
        if (childrenResult.rows.length > 0) {
            console.log('OK Namereno dete s kod "KAI":');
            childrenResult.rows.forEach(child => {
                console.log(`   - Kod: ${child.child_code}`);
                console.log(`   - Ime: ${child.name || '(nyama ime)'}`);
                console.log(`   - Posleden dostap: ${child.last_accessed}`);
            });
        } else {
            console.log('WARNING: Nyama zapis v children tablicata za kod "KAI"');
        }

    } catch (error) {
        console.error('\nERROR pri svurzvane s bazata danni:');
        console.error('   ', error.message);
        console.error('\nVazmozhni prichini:');
        console.error('   1. DATABASE_URL e nepravilen');
        console.error('   2. Bazata danni ne e dostapna');
        console.error('   3. Potrebitelyat/parolata sa nepravilni');
        console.error('   4. Bazata danni ne sushtestvuva');
        process.exit(1);
    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
        console.log('\n========================================');
        console.log('Testat priklyuchi');
        console.log('========================================');
    }
}

testConnection();

