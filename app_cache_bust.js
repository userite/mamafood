// Simple cache buster - add timestamp to app.js
const fs = require('fs');
const path = require('path');

// Just add a comment at the top
const appJsPath = path.join(__dirname, 'app.js');
const content = fs.readFileSync(appJsPath, 'utf8');

if (!content.includes('// Cache bust:')) {
    const timestamp = new Date().getTime();
    const newContent = `// Cache bust: ${timestamp}\n${content}`;
    fs.writeFileSync(appJsPath, newContent);
    console.log('✅ Cache buster added');
} else {
    console.log('ℹ️ Cache buster already present');
}

