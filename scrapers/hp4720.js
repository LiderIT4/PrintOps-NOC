// scrapers/hp4720.js – Scraper para DeskJet Ink Advantage Ultra 4720 (2 cartuchos: Color + Negro)
// Implementación híbrida (SNMP + Puppeteer)

const snmp = require('net-snmp');

/**
 * Obtiene datos vía SNMP para el modelo HP 4720.
 * Utiliza los OIDs de cartuchos proporcionados por el usuario.
 */
async function getSNMPData(ip, send) {
  return new Promise((resolve) => {
    if (!ip) return resolve(null);
    
    // OIDs específicos y generales
    const oids = [
      "1.3.6.1.2.1.43.10.2.1.4.1.1",               // Total Pages (General)
      "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.10.1.1.25.1", // Contador Cartuchos Negros
      "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.10.1.1.25.2", // Contador Cartuchos Color
    ];

    if (send) send(`[SNMP] Consultando ${ip} para HP 4720...`);

    const session = snmp.createSession(ip, "public", { 
      version: snmp.Version2c, 
      timeout: 4000, 
      retries: 1 
    });

    const timer = setTimeout(() => { 
      try { session.close(); } catch(e) {} 
      resolve(null); 
    }, 6000);

    session.get(oids, (error, varbinds) => {
      // Limpiar el timer si la respuesta llegó a tiempo
      clearTimeout(timer);

      if (error) {
        if (send) send(`[SNMP] No disponible en ${ip}: ${error.message}`);
        try { session.close(); } catch(e) {}
        resolve(null);
      } else {
        const results = [];
        let totalPages = null;
        let blackUsed = null;
        let colorUsed = null;

        if (varbinds && varbinds.length >= 3) {
            if (!snmp.isVarbindError(varbinds[0])) totalPages = parseInt(varbinds[0].value, 10);
            if (!snmp.isVarbindError(varbinds[1])) blackUsed = parseInt(varbinds[1].value, 10);
            if (!snmp.isVarbindError(varbinds[2])) colorUsed = parseInt(varbinds[2].value, 10);
        }

        if (totalPages !== null) results.push(`Pages: ${totalPages}`);

        if (totalPages !== null && blackUsed !== null && colorUsed !== null) {
          const totalCartridges = blackUsed + colorUsed;
          if (totalCartridges > 0) {
            const colorPages = Math.round(totalPages * (colorUsed / totalCartridges));
            const bwPages = Math.round(totalPages * (blackUsed / totalCartridges));
            results.push(`BW Pages: ${bwPages}`);
            results.push(`Color Pages: ${colorPages}`);
          }
        }

        try { session.close(); } catch(e) {}
        if (results.length > 0) {
          if (send) send(`[SNMP] Éxito en ${ip}: ${results.join(' | ')}`);
          resolve(results);
        } else {
          resolve(null);
        }
      }
    });
  });
}

module.exports = {
  path: '', // nivel raíz para niveles de tinta

  scrape: async (page, printer, send, credentials, cached) => {
    let datos = [];

    // 1. Intentar obtener datos extendidos vía SNMP (Páginas y Cálculos)
    // Usar optional chaining para evitar crashes si printer es undefined
    const snmpData = await getSNMPData(printer?.ip, send);
    if (snmpData) {
      datos.push(...snmpData);
    }

    // 2. Obtener niveles de tinta vía Web Scraping (Puppeteer)
    try {
      // espera a que exista al menos uno de los contenedores de tinta
      await page.waitForSelector('#cyanmagentayellowInkLevel, #blackInkLevel', { timeout: 15000 });

      const inkLevels = await page.evaluate(() => {
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
      datos.push(...inkLevels);
    } catch (e) {
      if (send) send(`[${printer?.name || 'HP4720'}] Error al obtener niveles de tinta web: ${e.message}`);
    }

    // 3. Fallback para Páginas vía Web Scraping si SNMP falló
    if (!datos.some(d => d.includes('Pages:'))) {
      try {
        // Forzar navegación al reporte de uso
        await page.evaluate(() => {
          const link = document.querySelector('a[href="#hId-pgUsageReport"]');
          if (link) link.click();
          else window.location.hash = '#hId-pgUsageReport';
        });

        await new Promise(r => setTimeout(r, 3000));
        
        let isVisible = await page.evaluate(() => !!document.querySelector('#appUsageReport-ti'));
        if (!isVisible) {
           await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
        }

        await page.waitForSelector('#appUsageReport-ti', { timeout: 10000 });
        
        const usageWeb = await page.evaluate(() => {
          const pagesEl = document.querySelector('#appUsageReport-ti');
          const pagesStr = pagesEl ? pagesEl.textContent.trim().replace(/,/g, '') : null;
          const pagesNum = pagesStr ? parseInt(pagesStr, 10) : null;

          const getCartridgeValue = (labels) => {
            for (const label of labels) {
              // Buscar de forma insensible a mayúsculas/minúsculas
              const xpath = `//td[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚ', 'abcdefghijklmnopqrstuvwxyzaeiou'), "${label.toLowerCase()}")]/following-sibling::td`;
              const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
              const node = result.singleNodeValue;
              if (node) {
                const val = parseInt(node.textContent.trim(), 10);
                if (!isNaN(val)) return val;
              }
            }
            return null;
          };

          const blackUsed = getCartridgeValue(["Negro", "Black"]);
          const colorUsed = getCartridgeValue(["Tricolor", "Tri-color", "Color"]);

          return { pagesNum, blackUsed, colorUsed, rawPages: pagesEl ? pagesEl.textContent.trim() : null };
        });

        if (usageWeb.rawPages) datos.push(`Pages: ${usageWeb.rawPages}`);
        if (send) send(`[${printer?.name || 'HP4720'}] Web Extraction - Pages: ${usageWeb.pagesNum}, BlackUsed: ${usageWeb.blackUsed}, ColorUsed: ${usageWeb.colorUsed}`);

        if (usageWeb.pagesNum !== null && usageWeb.blackUsed !== null && usageWeb.colorUsed !== null) {
          const totalUsed = usageWeb.blackUsed + usageWeb.colorUsed;
          if (totalUsed > 0) {
            const colorPages = Math.round(usageWeb.pagesNum * (usageWeb.colorUsed / totalUsed));
            const bwPages = Math.round(usageWeb.pagesNum * (usageWeb.blackUsed / totalUsed));
            datos.push(`BW Pages: ${bwPages}`);
            datos.push(`Color Pages: ${colorPages}`);
            if (send) send(`[${printer?.name || 'HP4720'}] Cálculos web completados.`);
          }
        }
      } catch (e) {
        if (send) send(`[${printer?.name || 'HP4720'}] Error al obtener reporte de uso web: ${e.message}`);
      }
    }

    return datos;
  }
};