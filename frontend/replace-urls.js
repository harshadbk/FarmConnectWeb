const fs = require('fs');
const path = require('path');

function replaceInFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'build') continue;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            replaceInFiles(filePath);
        } else if (stat.isFile() && (filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.jsx'))) {
            let content = fs.readFileSync(filePath, 'utf8');
            // Check if it has http://13.233.124.185 that is NOT already followed by :5000
            if (content.includes('http://13.233.124.185') && !content.includes('http://13.233.124.185:5000')) {
                // Regex to match http://13.233.124.185 (but not if it already has :5000)
                const regex = /http:\/\/13\.233\.124\.185(?!:5000)/g;
                const newContent = content.replace(regex, 'http://13.233.124.185:5000');
                fs.writeFileSync(filePath, newContent, 'utf8');
                console.log(`Updated: ${filePath}`);
            }
        }
    }
}

replaceInFiles(path.join(__dirname, 'src'));
console.log('Replacement complete.');
