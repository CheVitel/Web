const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

function readAll() {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
}

function saveAll(items) {
    fs.writeFileSync(DB_PATH, JSON.stringify(items, null, 4), 'utf-8');
}

function findById(id) {
    const items = readAll();
    return items.find(function(item) {
        return item.id === parseInt(id);
    });
}

function generateId() {
    const items = readAll();
    if (items.length === 0) return 1;
    const maxId = Math.max.apply(null, items.map(function(item) {
        return item.id;
    }));
    return maxId + 1;
}

module.exports = { readAll, saveAll, findById, generateId };
