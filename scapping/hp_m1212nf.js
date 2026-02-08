// scrapers/hp_m1212nf.js – Scraper para HP LaserJet M1212nf MFP
// Extrae el porcentaje de nivel desde el ancho de barra .hpGasGaugeBorder

module.exports = {
  path: '',

  scrape: async page => {
    await page.waitForSelector('.hpGasGaugeBorder', { timeout: 30000 });

    const data = await page.evaluate(() => {
      const barra = document.querySelector('.hpGasGaugeBorder td');
      if (!barra) return [];

      // Extrae el ancho del primer <td> que representa la barra llena
      const estilo = barra.getAttribute('style');
      const match = estilo && estilo.match(/width\s*:\s*(\d+)%/i);
      const pct = match ? parseInt(match[1], 10) : null;

      return pct !== null ? [`black: ${pct}%`] : [];
    });

    return data;
  }
};
