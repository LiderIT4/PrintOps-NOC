// scrapers/hp4720.js – Scraper para DeskJet Ink Advantage Ultra 4720 (2 cartuchos: Color + Negro)
// Usa nextElementSibling para leer el porcentaje.

module.exports = {
  path: '', // la página principal ya muestra niveles

  scrape: async page => {
    // espera a que exista al menos uno de los contenedores
    await page.waitForSelector('#cyanmagentayellowInkLevel, #blackInkLevel', { timeout: 30000 });

    const datos = await page.evaluate(() => {
      /**
       * Dado un id (#cyanmagentayellowInkLevel o #blackInkLevel),
       * lee el porcentaje del nextElementSibling.
       */
      function pctDesdeSiguiente(id) {
        const el = document.querySelector(id);
        if (!el || !el.nextElementSibling) return null;
        const match = el.nextElementSibling.textContent.match(/(\d+)\s?%/);
        return match ? parseInt(match[1], 10) : null;
      }

      const resultados = [];
      const pctColor = pctDesdeSiguiente('#cyanmagentayellowInkLevel');
      if (pctColor !== null) resultados.push(`color: ${pctColor}%`);

      const pctNegro = pctDesdeSiguiente('#blackInkLevel');
      if (pctNegro !== null) resultados.push(`black: ${pctNegro}%`);

      return resultados;
    });

    return datos;
  }
};