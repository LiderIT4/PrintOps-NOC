// Backend Node.js endpoint for Toshiba ink scrapping
const express = require('express');
const puppeteer = require('puppeteer');
const { scrapeToshibaInkLevels } = require('../utils/toshibaParser');
const { MOCK_PRINTERS } = require('../services/printerService');

const app = express();
const PORT = 4000;

let lastUpdate = null;
let cachedPrinters = [];

async function updatePrinters() {
  const browser = await puppeteer.launch({ headless: true });
  const printers = [...MOCK_PRINTERS];
  const updates = printers.map(async (printer, idx) => {
    if (printer.model === 'Toshiba e-Studio') {
      const page = await browser.newPage();
      try {
        const inkLevels = await scrapeToshibaInkLevels(page, printer);
        printers[idx].inkLevels = inkLevels;
        printers[idx].lastUpdated = new Date().toISOString();
      } catch (err) {
        // fallback: keep mock inkLevels
      }
      await page.close();
    }
  });
  await Promise.all(updates);
  await browser.close();
  lastUpdate = new Date().toISOString();
  cachedPrinters = printers;
}

// Update every 12 hours
setInterval(updatePrinters, 12 * 60 * 60 * 1000);
updatePrinters(); // Initial run

app.get('/api/printers', async (req, res) => {
  res.json({ printers: cachedPrinters, lastUpdate });
});

app.listen(PORT, () => {
  console.log(`Toshiba scrapping server running on port ${PORT}`);
});
