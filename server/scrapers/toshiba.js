const fs = require('fs');
const path = require('path');

module.exports = {
    scrape: async function (page, printer) {
        console.log(`🌐 Opening ${printer.name} (${printer.ip})...`);
        try {
            await page.goto(`http://${printer.ip}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (e) {
            console.error(`Failed to load ${printer.ip}: ${e.message}`);
            return [];
        }

        // Handle initial popups if any
        page.on('dialog', async dialog => {
            console.log(`⚠️ Popup detected: "${dialog.message()}"`);
            await dialog.accept();
        });

        // 1. Try Standard Frame-based scrape
        let data = [];
        const contentsFrame = page.frames().find(f => f.name() === 'contents');
        if (contentsFrame) {
            data = await scrapeTonerFromFrame(contentsFrame);
            if (data.length > 0) return data;
        } else {
            data = await scrapeTonerFromFrame(page);
            if (data.length > 0) return data;
        }

        // 2. If valid data not found, try TopAccess URL
        console.log(`⚠️ Standard scrape empty, trying TopAccess URL for ${printer.ip}...`);
        try {
            await page.goto(`http://${printer.ip}/?MAIN=TOPACCESS`, { waitUntil: 'domcontentloaded', timeout: 20000 });
            // Wait for the table structure mentioned by user
            await page.waitForSelector('form > table', { timeout: 5000 });

            data = await page.evaluate(() => {
                const rows = Array.from(document.querySelectorAll('td'));
                const found = [];

                // Heuristic: adjacent cells where one is text (Color) and next is value (%)
                for (let i = 0; i < rows.length - 1; i++) {
                    const text = (rows[i].textContent || '').toLowerCase().trim();
                    const nextText = (rows[i + 1].textContent || '').trim();

                    if (['cyan', 'magenta', 'yellow', 'black', 'negro', 'amarillo', 'cian'].some(c => text.includes(c))) {
                        // Check if next one has %
                        if (nextText.includes('%')) {
                            const pct = nextText.replace(/[^0-9]/g, '');
                            if (pct) {
                                // Map Spanish to English if needed
                                let color = text.replace(':', '');
                                if (color.includes('negro')) color = 'black';
                                if (color.includes('amarillo')) color = 'yellow';
                                if (color.includes('cian')) color = 'cyan';

                                found.push(`${color}: ${pct}%`);
                            }
                        }
                    }
                }
                return found;
            });

            if (data.length > 0) return data;

        } catch (e) {
            console.log(`TopAccess scrape failed: ${e.message}`);
        }

        return [];
    }

};

async function scrapeTonerFromFrame(frame) {
    try {
        // Wait for any table row
        await frame.waitForSelector('tr', { timeout: 10000 });
    } catch (e) {
        // Ignore timeout, might be already loaded or different structure
    }

    return await frame.evaluate(() => {
        const data = [];
        // Select all rows
        const rows = Array.from(document.querySelectorAll('tr'));

        rows.forEach(tr => {
            const tds = tr.querySelectorAll('td');
            if (tds.length < 2) return;

            // Use innerText to get rendered content (skips <script> tags usually)
            // The snippet shows: Amarillo(Y) in the first cell
            const colorText = (tds[0].innerText || '').toLowerCase().trim();

            let color = null;
            if (colorText.includes('amarillo') || colorText.includes('yellow')) color = 'yellow';
            else if (colorText.includes('magenta')) color = 'magenta';
            else if (colorText.includes('cian') || colorText.includes('cyan')) color = 'cyan';
            else if (colorText.includes('negro') || colorText.includes('black')) color = 'black';

            if (!color) return;

            // The value is in the cell with class 'threshold' or just the 3rd cell (index 2)
            // Snippet: <td class="threshold">...86%...</td>
            // We search for the cell containing '%'
            let pctText = '';

            // Try to find specific class first
            const thresholdTd = tr.querySelector('.threshold');
            if (thresholdTd) {
                pctText = thresholdTd.innerText;
            } else {
                // Fallback: Check 3rd cell or any cell with %
                if (tds[2]) pctText = tds[2].innerText;
                else {
                    // Find any cell with digit + %
                    for (let i = 1; i < tds.length; i++) {
                        if (tds[i].innerText.includes('%')) {
                            pctText = tds[i].innerText;
                            break;
                        }
                    }
                }
            }

            // Extract number
            const match = pctText.match(/(\d+)/);
            if (match) {
                // Ensure it's not the color cell itself
                data.push(`${color}: ${match[1]}%`);
            }
        });
        return data;
    });
}
