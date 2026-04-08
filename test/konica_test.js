const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const printer = {
    name: 'Konica',
    url: 'http://172.16.17.45'
  };

  const screenshotsDir = path.resolve(__dirname, 'screenshots');

  // Crear carpeta si no existe
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    console.log(`📂 Carpeta creada: ${screenshotsDir}`);
  }

  const browser = await puppeteer.launch({
    headless: false, // 👀 Visible
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      "--proxy-server='direct://'",
      '--proxy-bypass-list=*',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--single-process',
      '--ignore-certificate-errors',
    ]
  });

  const page = await browser.newPage();

  try {
    // 1️⃣ Página principal
    console.log(`🔍 Abriendo ${printer.url}...`);
    await page.goto(printer.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const shot1 = path.join(screenshotsDir, 'konica-step1-inicio.png');
    await page.screenshot({ path: shot1 });
    console.log(`📸 Captura 1: ${shot1}`);

    // 2️⃣ Botón login
    const loginInput = await page.$('input[type="submit"]');
    if (!loginInput) {
      console.log(`⚠️ Botón de login NO encontrado.`);
      await browser.close();
      return;
    }

    console.log(`🔑 Haciendo clic en login...`);
    await Promise.all([
      loginInput.click(),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 })
    ]);
    await page.waitForTimeout(2000);

    const shot2 = path.join(screenshotsDir, 'konica-step2-logueado.png');
    await page.screenshot({ path: shot2 });
    console.log(`📸 Captura 2: ${shot2}`);

    // 3️⃣ Esperar datos finales
    await page.waitForSelector('.tonerinfo-layout', { timeout: 30000 });

    const shot3 = path.join(screenshotsDir, 'konica-step3-datos.png');
    await page.screenshot({ path: shot3 });
    console.log(`📸 Captura 3: ${shot3}`);

    console.log('✅ Terminado con éxito.');

  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
  } finally {
    await browser.close();
    console.log('🛑 Navegador cerrado.');
  }
})();
