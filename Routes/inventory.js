const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'inventory.json');

function readDB() {
    if (!fs.existsSync(dbPath)) return {};
    try {
        const data = JSON.parse(fs.readFileSync(dbPath));
        // Migración: si el valor es un array, convertirlo a objeto { supplies: array, offices: "" }
        let changed = false;
        for (const key in data) {
            if (Array.isArray(data[key])) {
                data[key] = { supplies: data[key], offices: "" };
                changed = true;
            }
        }
        if (changed) writeDB(data);
        return data;
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
    const { model, supplies, offices } = req.body;
    if (!model) return res.status(400).json({ error: 'Falta el modelo' });
    
    const db = readDB();
    db[model] = { 
        supplies: supplies || [], 
        offices: offices !== undefined ? offices : (db[model]?.offices || "") 
    };
    writeDB(db);
    res.json({ success: true, model, count: db[model].supplies.length });
});

module.exports = { router };
