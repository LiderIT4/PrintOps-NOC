const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'inventory.json');

function readDB() {
    if (!fs.existsSync(dbPath)) return {};
    try {
        return JSON.parse(fs.readFileSync(dbPath));
    } catch (e) {
        return {};
    }
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Get all inventory
router.get('/', (req, res) => {
    res.json(readDB());
});

// Save inventory for a model
router.post('/save', (req, res) => {
    const { model, supplies } = req.body;
    if (!model) return res.status(400).json({ error: 'Falta el modelo' });
    
    const db = readDB();
    db[model] = supplies;
    writeDB(db);
    res.json({ success: true, model, count: supplies.length });
});

module.exports = { router };
