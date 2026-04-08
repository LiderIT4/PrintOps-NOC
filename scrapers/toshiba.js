// scrapers/toshiba.js – Scraper híbrido para Toshiba TopAccess (SNMP + Web)

const fs = require('fs');
const path = require('path');
const snmp = require('net-snmp');

/**
 * Obtiene contadores de páginas vía SNMP utilizando los OIDs de la rama privada de Toshiba 
 * proporcionados por el usuario.
 */
async function getSNMPData(ip, send) {
  return new Promise((resolve) => {
    if (!ip) return resolve(null);
    
    const oids = [
      "1.3.6.1.2.1.43.10.2.1.4.1.1",          // Total General (Standard)
      "1.3.6.1.4.1.1129.2.3.50.1.3.1.1.13.1", // Total Color (Toshiba)
      "1.3.6.1.4.1.1129.2.3.50.1.3.1.1.13.2", // Total B&W (Toshiba)
      "1.3.6.1.4.1.1129.2.3.50.1.3.1.1.13.3", // Total Bicolor (Toshiba)
      // Niveles de Tóner (RFC 3805 Printer MIB)
      "1.3.6.1.2.1.43.11.1.1.9.1.1",          // Tóner 1 ( suelen ser C, M, Y, K )
      "1.3.6.1.2.1.43.11.1.1.9.1.2",          // Tóner 2
      "1.3.6.1.2.1.43.11.1.1.9.1.3",          // Tóner 3
      "1.3.6.1.2.1.43.11.1.1.9.1.4",          // Tóner 4
    ];

    if (send) send(`[SNMP] Consultando contadores y tóner Toshiba en ${ip}...`);

    const session = snmp.createSession(ip, "public", { 
      version: snmp.Version2c, 
      timeout: 3000, 
      retries: 1 
    });

    session.get(oids, (error, varbinds) => {
      if (error) {
        if (send) send(`[SNMP] No disponible en ${ip}: ${error.message}`);
        session.close();
        resolve(null);
      } else {
        const results = [];
        let total = null;
        let color = 0;
        let hasColor = false;
        let bw = null;

        // Páginas
        if (!snmp.isVarbindError(varbinds[0])) total = varbinds[0].value;
        if (!snmp.isVarbindError(varbinds[1])) { color += varbinds[1].value; hasColor = true; }
        if (!snmp.isVarbindError(varbinds[3])) { color += varbinds[3].value; hasColor = true; }
        if (!snmp.isVarbindError(varbinds[2])) bw = varbinds[2].value;

        if (total !== null) results.push(`Pages: ${total}`);
        if (bw !== null) results.push(`BW Pages: ${bw}`);
        if (hasColor) results.push(`Color Pages: ${color}`);

        // Tóner (Asumiendo orden estándar C, M, Y, K aunque puede variar, el web scraper lo precisará si falla)
        const colors = ['cyan', 'magenta', 'yellow', 'black'];
        for (let i = 0; i < 4; i++) {
          const vb = varbinds[i + 4];
          if (vb && !snmp.isVarbindError(vb)) {
            let val = vb.value;
            if (val >= 0 && val <= 100) results.push(`${colors[i]}: ${val}%`);
          }
        }

        session.close();
        if (results.length > 0) {
          if (send) send(`[SNMP] Éxito en ${ip}: ${results.filter(r => !r.includes('%')).length} contadores y ${results.filter(r => r.includes('%')).length} niveles.`);
          resolve(results);
        } else {
          resolve(null);
        }
      }
    });

    setTimeout(() => { try { session.close(); } catch(e) {} resolve(null); }, 5000);
  });
}

module.exports = {
  path: '',
  scrape: async function (page, printer, send, credentials, cached) {
    let resultados = [];

    // 1️⃣ Intentar obtener todo vía SNMP primero (más fiable y rápido)
    const snmpData = await getSNMPData(printer.ip, send);
    if (snmpData) {
      resultados.push(...snmpData);
    }

    // 2️⃣ Si falta TINTA, intentar vía Web Scraping
    const hasInk = resultados.some(r => /^(yellow|magenta|cyan|black):/.test(r));
    
    const screenshotsDir = path.resolve(__dirname, '..', 'screenshots');
    if (!fs.existsSync(screenshotsDir) && !hasInk) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    try {
      if (!hasInk) {
        send(`🌐 Abriendo web de ${printer.name} para completar niveles de tóner...`);
        await page.goto(printer.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(res => setTimeout(res, 2000));

      // Manejo de popups
      page.on('dialog', async dialog => {
        await dialog.accept();
      });

      // Login si es necesario
      const accesoLink = await page.$('a.clsLogin[onclick*="fnnLoginClick"]');
      if (accesoLink) {
        send(`🔑 Realizando login...`);
        await accesoLink.click();
        await page.waitForSelector('input[type="text"]', { visible: true, timeout: 10000 });
        await page.type('input[type="text"]', 'Epson');
        await page.type('input[type="password"]', '123456');
        const submitBtn = await page.$('input[type="submit"], button[type="submit"]');
        if (submitBtn) {
          await Promise.all([
            submitBtn.click(),
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
          ]);
        }
      }

      // Extraer niveles de Tóner del frame 'contents'
      const contentsFrame = page.frames().find(f => f.name() === 'contents');
      if (contentsFrame) {
        await contentsFrame.waitForSelector('tr.WeissTonerImage, tr.CaspianTonerImage', { timeout: 15000 }).catch(() => {});
        const tonerData = await contentsFrame.evaluate(() => {
          const map = { amarillo: 'yellow', magenta: 'magenta', cian: 'cyan', negro: 'black' };
          const data = [];
          // Solo usar las clases específicas de Tóner para evitar falsos positivos con tablas de contadores
          document.querySelectorAll('tr.WeissTonerImage, tr.CaspianTonerImage').forEach(tr => {
            const tds = tr.querySelectorAll('td');
            if (tds.length < 3) return;
            let raw = (tds[0].textContent || '').replace(/document\.write\(.*?\)/gi, '').toLowerCase();
            const m = raw.match(/(amarillo|magenta|cian|negro)/i);
            if (!m) return;
            const color = map[m[1].toLowerCase()];
            const pct = parseInt(tds[2].innerText.replace(/[^0-9]/g, ''), 10);
            if (!isNaN(pct) && pct >= 0 && pct <= 100) data.push(`${color}: ${pct}%`);
          });
          return data;
        });
        if (tonerData.length > 0) {
          resultados.push(...tonerData);
          send(`✅ Tóner extraído: ${tonerData.join(', ')}`);
        }
      }
    }
 
    // 3️⃣ Fallback de contadores si falta algúno de los datos (Total, BW o Color)
      const hasTotal = resultados.some(r => r.includes('Pages:'));
      const hasBW = resultados.some(r => r.includes('BW Pages:'));
      const hasColor = resultados.some(r => r.includes('Color Pages:'));

      if (!hasTotal || !hasBW || !hasColor) {
        send(`📊 Accediendo a pestaña de Contadores vía Web (Faltan: ${!hasTotal ? 'Total ' : ''}${!hasBW ? 'BW ' : ''}${!hasColor ? 'Color' : ''})...`);
        await page.goto(printer.url + '/?MAIN=COUNTER', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        const counterFrame = page.frames().find(f => f.name() === 'mainFrame' || f.name() === 'contents');
        if (counterFrame) {
          const webCounts = await counterFrame.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('tr'));
            // Buscar la fila de etiquetas para ubicar las columnas
            const headRow = rows.find(r => r.innerText.includes('A todo color') && r.innerText.includes('Negro'));
            
            // Buscar la fila de totales
            const totalRow = rows.find(r => r.innerText.trim().startsWith('Total') && /\d+/.test(r.innerText));
            
            if (totalRow) {
              const cells = Array.from(totalRow.querySelectorAll('td'));
              // Estructura esperada en TopAccess: [Etiqueta, A todo color, Bicolor, Negro, Total]
              if (cells.length >= 5) {
                const c1 = parseInt(cells[1].innerText.replace(/[^0-9]/g, ''), 10) || 0;
                const c2 = parseInt(cells[2].innerText.replace(/[^0-9]/g, ''), 10) || 0;
                const bk = parseInt(cells[3].innerText.replace(/[^0-9]/g, ''), 10) || 0;
                const gt = parseInt(cells[4].innerText.replace(/[^0-9]/g, ''), 10) || 0;
                
                return { total: gt, bw: bk, color: c1 + c2 };
              }
            }
            return null;
          });

          if (webCounts) {
            // Reemplazar o añadir los datos si no estaban
            if (webCounts.total && !hasTotal) resultados.push(`Pages: ${webCounts.total}`);
            if (webCounts.bw && !hasBW) resultados.push(`BW Pages: ${webCounts.bw}`);
            if (webCounts.color && !hasColor) resultados.push(`Color Pages: ${webCounts.color}`);
            send(`✅ Web counter success: Total=${webCounts.total}, BW=${webCounts.bw}, Color=${webCounts.color}`);
          }
        }
      }

    } catch (e) {
      send(`⚠️ Error en proceso web Toshiba: ${e.message}`);
    }

    return resultados;
  }
};
