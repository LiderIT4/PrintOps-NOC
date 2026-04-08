// scrapers/cp2505.js – Scraper para CP2505 usando tableDataCellStand y hpGasGaugeBorder

module.exports = {
  path: '',

  scrape: async (page, printer, send = console.log) => {
    await page.waitForSelector('table.mainContentArea', { timeout: 30000 });

    const resultados = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table.mainContentArea tr'));
      const output = [];

      for (const row of rows) {
        const cells = row.querySelectorAll('.tableDataCellStand');
        if (cells.length < 2) continue;

        const colorText = cells[0].textContent.trim().toLowerCase();
        const match = cells[1].innerText.match(/(\d+)\s*%/);
        if (!colorText || !match) continue;

        let color;
        if (colorText.includes('negro')) color = 'black';
        else if (colorText.includes('amarillo')) color = 'yellow';
        else if (colorText.includes('cian')) color = 'cyan';
        else if (colorText.includes('magenta')) color = 'magenta';        
        else continue;

        output.push(`${color}: ${parseInt(match[1], 10)}%`);
      }

      return output;
    });

    // Ordenar CMYK
    const orden = ['yellow', 'magenta', 'cyan', 'black'];
    resultados.sort((a, b) => orden.indexOf(a.split(':')[0]) - orden.indexOf(b.split(':')[0]));

    send(`[CP2505] Datos extraídos: ${resultados.join(', ')}`);
    return resultados;
  }
};
