// scrapers/smartTank510.js – Scraper para HP Smart Tank 510 (CMYK)
// Devuelve los niveles siempre ordenados Cyan, Magenta, Yellow, Black.

module.exports = {
  path: '', // los niveles están en la página principal

  scrape: async page => {
    await page.waitForSelector('#ink-level-gauge', { timeout: 30000 });

    // 1️⃣ Extrae niveles dentro del navegador
    const datos = await page.evaluate(() => {
      function extraer(id, color) {
        const el = document.querySelector(id);
        if (!el) return null;
        const span = el.querySelector('span.off-screen-text-cls');
        if (!span) return null;
        const m = span.textContent.match(/(\d+)%/);
        if (!m) return null;
        return `${color}: ${parseInt(m[1], 10)}%`;
      }

      const colores = [
        { id: '#cyanInkLevel',    color: 'cyan'    },
        { id: '#magentaInkLevel', color: 'magenta' },
        { id: '#yellowInkLevel',  color: 'yellow'  },
        { id: '#blackInkLevel',   color: 'black'   }
      ];

      const res = [];
      for (const c of colores) {
        const v = extraer(c.id, c.color);
        if (v) res.push(v);
      }
      return res; // devuelve el array sin ordenar
    });

    // 2️⃣ Ordena CMYK fuera del navegador
    const orden = ['yellow', 'magenta', 'cyan', 'black'];
    datos.sort((a, b) => orden.indexOf(a.split(':')[0].trim()) - orden.indexOf(b.split(':')[0].trim()));

    return datos;
  }
};
