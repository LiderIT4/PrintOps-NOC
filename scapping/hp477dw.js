// scrapers/default.js – Scraper genérico para impresoras HP con .ink-inkLevel-tile

module.exports = {
  path: '',

  scrape: async page => {
    const selector = '.ink-inkLevel-tile';
    await page.waitForSelector(selector, { visible: true, timeout: 60000 });

    const datos = await page.$$eval(
      '.ink-inkLevel-tile .off-screen-text-cls',
      nodes => nodes.map(n => n.innerText.trim())
    );

    // Ordenar por CMYK
    const orden = ['cyan', 'magenta', 'yellow', 'black'];
    datos.sort((a, b) => orden.indexOf(a.split(':')[0].toLowerCase()) - orden.indexOf(b.split(':')[0].toLowerCase()));

    console.log('[DEFAULT] Datos extraídos (orden CMYK):', datos);
    return datos;
  }
};
