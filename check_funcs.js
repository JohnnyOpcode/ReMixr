const fs = require('fs');
const path = require('path');

const filesToScan = ['popup.js', 'content.js', 'background.js', 'utils.js', 'export.js', 'build.js'];

filesToScan.forEach(file => {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, 'utf8');
    const funcRegex = /function\s+([a-zA-Z0-9_]+)\s*\(/g;
    let match;
    const functions = new Map();
    let duplicates = [];
    
    while ((match = funcRegex.exec(content)) !== null) {
        const name = match[1];
        if (functions.has(name)) {
            duplicates.push(name);
        }
        functions.set(name, true);
    }
    
    if (duplicates.length > 0) {
        console.log(`[${file}] Duplicate functions found: ${duplicates.join(', ')}`);
    } else {
        console.log(`[${file}] No duplicate functions.`);
    }
});
