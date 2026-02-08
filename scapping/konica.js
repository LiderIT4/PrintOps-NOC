const fs = require('fs');
const path = require('path');

module.exports = {
  path: '',
  scrape: async function (page, printer, send) {
    const datos = [];

    const screenshotsDir = path.resolve(__dirname, '..', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

    send(`🌐 Abriendo ${printer.url}...`);
    await page.goto(printer.url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    await new Promise(res => setTimeout(res, 2000));

    await page.screenshot({ path: path.join(screenshotsDir, 'konica-step1.png') });
    send(`📸 Captura 1 lista`);

    const loginBtn = await page.$('input[type="submit"]');
    if (loginBtn) {
      send(`🔑 Clic en login...`);
      await Promise.all([
        loginBtn.click(),
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 })
      ]);
    } else {
      send(`⚠️ Botón de login no encontrado`);
      return [];
    }

    await new Promise(res => setTimeout(res, 2000));
    await page.screenshot({ path: path.join(screenshotsDir, 'konica-step2.png') });
    send(`📸 Captura 2 lista`);

    await page.waitForSelector('.tonerinfo-layout', { timeout: 30000 });
    await page.screenshot({ path: path.join(screenshotsDir, 'konica-step3.png') });
    send(`📸 Captura 3 lista`);

    await new Promise(res => setTimeout(res, 2000));
    await page.screenshot({ path: path.join(screenshotsDir, 'konica-step2.png') });
    send(`📸 Captura 2 lista`);

    await page.waitForSelector('.tonerinfo-layout .data-table', { timeout: 30000 });
    await page.screenshot({ path: path.join(screenshotsDir, 'konica-step3.png') });
    send(`📸 Captura 3 lista`);

    // ✅ Extraer tabla unificada
    const extraidos = await page.evaluate(() => {
      const resultados = [];
      const mapaColores = {
        'amarillo': 'yellow',
        'magenta': 'magenta',
        'cian': 'cyan',
        'negro': 'black'
      };

      const filas = document.querySelectorAll('.tonerinfo-layout .data-table tr');
      filas.forEach((tr, idx) => {
        if (idx === 0) return; // Saltar cabecera
        const tds = tr.querySelectorAll('td');
        if (tds.length >= 3) {
          const colorEsp = tds[0].innerText.trim().toLowerCase();
          const colorEng = mapaColores[colorEsp] || colorEsp; // Traducir
          const porcentaje = tds[2].innerText.trim();
          if (porcentaje.includes('%')) {
            resultados.push(`${colorEng}: ${porcentaje}`);
          }
        }
      });
      return resultados;
    });

    datos.push(...extraidos);
    send(`✅ Datos: ${datos.join(', ')}`);
    return datos;
  }
};
