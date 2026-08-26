import fs from 'fs';
import path from 'path';

const srcDir = './src';
const localesDir = './src/locales';

function getAllFiles(dir, exts = ['.ts', '.tsx', '.js']) {
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== 'locales' && entry.name !== 'node_modules') {
                files = files.concat(getAllFiles(fullPath, exts));
            }
        } else if (exts.includes(path.extname(entry.name))) {
            files.push(fullPath);
        }
    }
    return files;
}

function extractKeysFromCode(code) {
    const keys = new Set();
    const regex = /\bt\(\s*(["'`])((?:\\.|(?!\1)[\s\S])*?)\1\s*(?:,|\))/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
        let key = match[2];
        key = key.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\`/g, '`');
        keys.add(key);
    }
    return keys;
}

const files = getAllFiles(srcDir);
const allKeys = new Set();

for (const file of files) {
    if (file.endsWith('i18n.ts')) continue;
    const content = fs.readFileSync(file, 'utf-8');
    const keys = extractKeysFromCode(content);
    keys.forEach(k => allKeys.add(k));
}

const sortedKeys = Array.from(allKeys).sort((a, b) => a.localeCompare(b));
console.log(`Found ${sortedKeys.length} unique translation keys.`);

const enDict = {};
for (const key of sortedKeys) {
    enDict[key] = key;
}

if (!fs.existsSync(localesDir)) {
    fs.mkdirSync(localesDir, { recursive: true });
}

fs.writeFileSync(path.join(localesDir, 'en.json'), JSON.stringify(enDict, null, 2) + '\n', 'utf-8');
console.log(`Saved ${sortedKeys.length} keys to ${path.join(localesDir, 'en.json')}`);
