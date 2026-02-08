module.exports = {
    scrape: async (page, printer) => {
        console.log(`🌐 Opening ${printer.name} (${printer.ip})...`);
        try {
            await page.goto(`http://${printer.ip}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (e) {
            console.error(`Failed to load ${printer.ip}: ${e.message}`);
            // Return dummy data if it fails, so we don't break the UI
            return [`black: ??%`, `color: ??%`];
        }

        try {
            // Try common HP selectors
            // 1. Modern HP (ink-inkLevel-tile)
            const modernSelector = '.ink-inkLevel-tile';
            if (await page.$(modernSelector)) {
                const datos = await page.$$eval(
                    '.ink-inkLevel-tile .off-screen-text-cls',
                    nodes => nodes.map(n => n.innerText.trim())
                );
                return datos; // Usually returns "Cyan Cartridge Estimated Ink Level is 80%"
            }

            // 2. Older HP / Simple tables
            // Just look for text containing %
            const textContent = await page.evaluate(() => document.body.innerText);
            const lines = textContent.split('\n');
            const levels = [];

            lines.forEach(line => {
                if (line.includes('%') && (line.toLowerCase().includes('cartridge') || line.toLowerCase().includes('black') || line.toLowerCase().includes('cyan'))) {
                    levels.push(line.trim());
                }
            });

            if (levels.length > 0) return levels;

        } catch (e) {
            console.error("Error parsing HP page:", e);
        }

        return [];
    }
};
