// Test POST request
const http = require('http');

const data = JSON.stringify({
    child_code: 'BEBE_TEST01',
    record_number: 4,
    amount: 200,
    situation: 'formula-prepared',
    datetime: '2024-10-28 20:00:00',
    notes: 'API тест запис'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/records',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    
    res.on('data', (chunk) => {
        body += chunk;
    });
    
    res.on('end', () => {
        console.log('✅ POST Response:', JSON.parse(body));
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error);
});

req.write(data);
req.end();

