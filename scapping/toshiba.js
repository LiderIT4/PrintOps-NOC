const fs = require('fs');
const path = require('path');

module.exports = {
  path: '',
  scrape: async function (page, printer, send) {
    // 1️⃣ Prepara carpeta de capturas
    const screenshotsDir = path.resolve(__dirname, '..', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    send(`🌐 Abriendo ${printer.name} (${printer.url})...`);
    await page.goto(printer.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // 2️⃣ Captura inicial
    await new Promise(res => setTimeout(res, 2000));
    await page.screenshot({ path: path.join(screenshotsDir, 'toshiba-step1.png') });
    send(`📸 Captura 1: página de inicio`);

    // 3️⃣ Manejo de popups tipo alert/confirm
    page.on('dialog', async dialog => {
      send(`⚠️ Popup detectado: "${dialog.message()}"`);
      await dialog.accept();
      send(`✅ Popup aceptado`);
    });

    // 4️⃣ Si aparece el enlace de login (“Acceso”), realizar login
    const accesoLink = await page.$('a.clsLogin[onclick*="fnnLoginClick"]');
    if (accesoLink) {
      send(`🔑 Enlace de Acceso encontrado, realizando login...`);
      await accesoLink.click();

      // Espera el formulario
      await page.waitForSelector('input[type="text"]', { visible: true, timeout: 10000 });
      await new Promise(res => setTimeout(res, 1000));

      // Rellenar usuario y contraseña
      await page.type('input[type="text"]', 'Epson');
      await page.type('input[type="password"]', '123456');

      // Enviar el formulario
      const submitBtn = await page.$('input[type="submit"], button[type="submit"]');
      if (submitBtn) {
        await Promise.all([
          submitBtn.click(),
          page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
        ]);
        send(`✅ Login enviado`);
      } else {
        send(`❌ No se encontró el botón de envío de login`);
        return [];
      }
    } else {
      send(`ℹ️ No se requiere login`);
    }

    // 5️⃣ Captura tras login
    await new Promise(res => setTimeout(res, 2000));
    await page.screenshot({ path: path.join(screenshotsDir, 'toshiba-step2.png') });
    send(`📸 Captura 2: después de login`);

    // 6️⃣ Encontrar el frame “contents”
    const contentsFrame = page.frames().find(f => f.name() === 'contents');
    if (!contentsFrame) {
      send(`❌ Frame 'contents' no encontrado`);
      return [];
    }
    send(`✅ Frame 'contents' localizado`);

    // 7️⃣ Esperar a que carguen las filas de tóner
    await contentsFrame.waitForSelector(
      'tr.WeissTonerImage, tr.CaspianTonerImage, tr',
      { timeout: 20000 }
    );
    send(`✅ Filas de tóner detectadas`);

    // 8️⃣ Extraer niveles de tinta (amarillo, magenta, cian, negro)
    const resultados = await contentsFrame.evaluate(() => {
      const map = {
        amarillo: 'yellow',
        magenta: 'magenta',
        cian:    'cyan',
        negro:   'black'
      };
      const data = [];

      document
        .querySelectorAll('tr.WeissTonerImage, tr.CaspianTonerImage, tr')
        .forEach(tr => {
          const tds = tr.querySelectorAll('td');
          if (tds.length < 3) return;

          // Limpiar document.write(...) y normalizar
          let raw = (tds[0].textContent || '')
            .replace(/document\.write\(.*?\)/gi, '')
            .toLowerCase();

          // Buscar uno de los colores
          const m = raw.match(/(amarillo|magenta|cian|negro)/i);
          if (!m) return;
          const colorKey = m[1].toLowerCase();
          const color = map[colorKey];

          // Extraer porcentaje
          const pct = tds[2].innerText.replace(/[^0-9]/g, '');
          if (!pct || isNaN(pct)) return;

          data.push(`${color}: ${pct}%`);
        });

      return data;
    });

    send(`✅ Datos extraídos: ${resultados.join(', ')}`);

    // 9️⃣ Captura del frame “contents” (opcional)
    const frameHandle = await page.$('frame[name="contents"]');
    if (frameHandle) {
      await frameHandle.screenshot({ path: path.join(screenshotsDir, 'toshiba-step3.png') });
      send(`📸 Captura 3: frame contents`);
    } else {
      send(`⚠️ No se pudo capturar el <frame> contents`);
    }

    return resultados;
  }
};
