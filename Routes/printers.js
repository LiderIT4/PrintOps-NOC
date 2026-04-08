// routes/printers.js – controlador general de impresoras

const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const randomUserAgent = require('random-useragent');
const fs = require('fs');
const path = require('path');
const ping = require('ping');

const printers = [
  { name: 'Producción Piso 3',      url: 'http://172.16.17.5',              model: 'cp2025'  },
  { name: 'Radio',                  url: 'http://172.16.117.127',           model: 'hp4720'  },
  { name: 'Eventos Gerizim',        url: 'http://172.16.111.127',           model: 'hp4720'  },
  { name: 'Factura Electrónica',    url: 'http://172.16.111.25',            model: 'hp4720'  },
  { name: 'Estudio Grabación',      url: 'http://172.16.17.40',             model: 'hp_m1212nf' },
  { name: 'Mantenimiento',          url: 'https://172.16.111.110',          model: 'hp477dw' },
  { name: 'SPP',                    url: 'https://172.16.111.2',            model: 'hp477dw' },
  { name: 'Financiera',             url: 'http://172.16.11.41',             model: 'hp477dw' },
  { name: 'Pastor',                 url: 'https://172.16.11.231',           model: 'hp477dw' },
  { name: 'Cooperativa',            url: 'https://172.16.11.172',           model: 'hp477dw' },
  { name: 'Bodega Coffee',          url: 'http://172.16.113.14',            model: 'hpSmartTank510' },
  { name: 'Cocina piso 7',          url: 'http://172.16.111.59',            model: 'hpSmartTank510'  },
  { name: 'Fuente Encuentros Piso 7', url: 'http://172.16.111.59',          model: 'hpSmartTank510' },
  { name: 'Konica',                 url: 'http://172.16.17.45/wcd/top.xml', model: 'konica' },
  { name: 'Toshiba Administrativa', url: 'http://172.16.11.48',             model: 'toshiba' },
  { name: 'Toshiba Piso 5',         url: 'http://172.16.11.215',            model: 'toshiba' },
  { name: 'Toshiba Piso 6',         url: 'http://172.16.11.169',            model: 'toshiba' },
];

const dbPath = path.join(__dirname, '..', 'data', 'printers.json');
const db = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath)) : {};

function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function mergeData(oldLevels = [], newLevels = []) {
  const map = {};
  // Los nuevos datos sobrescriben a los viejos si hay colisión de claves
  [...oldLevels, ...newLevels].forEach(item => {
    if (typeof item !== 'string') return;
    const splitIdx = item.indexOf(':');
    if (splitIdx === -1) return;
    const key = item.substring(0, splitIdx).trim();
    map[key] = item;
  });
  return Object.values(map);
}

function saveHistory(result) {
  if (!result.inkLevels?.length) return;
  db[result.name] = {
    timestamp: new Date().toISOString(),
    ...result
  };
  writeDB(db);
}

function scraperPath(model) {
  return path.join(__dirname, '..', 'scrapers', `${model}.js`);
}

async function runScraper(page, printer, send, credentials, cached) {
  const mod = require(scraperPath(printer.model));
  if (mod.path) {
    await page.goto(printer.url + mod.path, { waitUntil: 'load', timeout: 60000 });
  }
  return await mod.scrape(page, printer, send, credentials, cached);
}

async function processPrinter(printer, send = console.log, force = false, credentials = null) {
  const { name, url, model } = printer;
  const ip = url.split('://')[1].split('/')[0];
  const cached = db[name];
  const now = Date.now();
  const oneHour = 1 * 60 * 60 * 1000;
  
  // Función para determinar si los datos cacheados están completos
  const isComplete = (p, data) => {
    if (!data || !data.inkLevels || data.inkLevels.length === 0) return false;
    // Si es una 477dw, necesitamos Pages
    if (p.model === 'hp477dw' && !data.inkLevels.some(l => l.includes('Pages:'))) return false;
    return true;
  };

  // Solo saltamos COMPLETAMENTE si los datos están completos Y son recientes
  if (!force && cached && isComplete(printer, cached) && (now - new Date(cached.timestamp).getTime()) < oneHour) {
    send(`ℹ️ ${name} ya tiene datos completos y recientes.`);
    return cached;
  }

  const result = { name, ip, status: 'offline', inkLevels: [] };
  send(`🔍 Procesando ${name} (${ip})...`);

  const pingRes = await ping.promise.probe(ip);
  if (!pingRes.alive) {
    send(`🔴 ${name} está OFFLINE`);
    send(JSON.stringify({ printer: result }));
    return result;
  }

  result.status = 'online';
  send(`🟢 ${name} está en línea`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    send(`(${name}) intento ${attempt}/3`);
    let browser;
    try {
      browser = await puppeteer.launch({
      headless: 'new',
      ignoreHTTPSErrors: true,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--ignore-certificate-errors'
      ]
    });

      const page = await browser.newPage();
      await page.setUserAgent(randomUserAgent.getRandom());
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Verificar si hay advertencia de seguridad
      const isWarning = await page.evaluate(() => {
        return !!document.querySelector('#details-button') || 
               document.body.innerText.includes('NET::ERR_CERT_AUTHORITY_INVALID') ||
               document.title.includes('Privacidad') ||
               document.title.includes('Privacy');
      });

      if (isWarning) {
        send(`ℹ️ ${name}: Saltando advertencia de seguridad...`);
        if (await page.$('#details-button')) {
          await page.click('#details-button');
          await page.waitForSelector('#proceed-link', { visible: true, timeout: 5000 });
          await page.click('#proceed-link');
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
        }
      }

      // --- DETECCIÓN DE LOGIN ---
      const needsLogin = await page.evaluate(() => {
        const passFields = document.querySelectorAll('input[type="password"]');
        return passFields.length > 0 && Array.from(passFields).some(f => f.offsetParent !== null);
      });

      if (needsLogin) {
        if (!credentials || !credentials.user || !credentials.pass) {
          send(JSON.stringify({ type: 'AUTH_REQUIRED', printerName: name, ip: ip }));
          throw new Error('Autenticación requerida');
        }
        
        send(`🔓 ${name}: Intentando iniciar sesión...`);
        await page.evaluate((u, p) => {
          const userField = document.querySelector('input[type="text"], input#username, input#i_user, #i_user') || document.querySelectorAll('input')[0];
          const passField = document.querySelector('input[type="password"], input#password, input#i_password, #i_password');
          if (userField) userField.value = u;
          if (passField) passField.value = p;
          
          const submitBtn = document.querySelector('input[type="submit"], button[type="submit"], #signInBtn, #login-button, #login_btn');
          if (submitBtn) submitBtn.click();
          else if (passField && passField.form) passField.form.submit();
        }, credentials.user, credentials.pass);
        
        await new Promise(r => setTimeout(r, 5000));
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
      }

      if (model === 'konica') {
        const loginSelector = '#LP0LOG input[type=submit]';
        const loginBtn = await page.$(loginSelector);
        if (loginBtn) {
          send(`🔓 ${name}: clic en «Iniciar sesión»`);
          await Promise.all([
            page.evaluate(sel => document.querySelector(sel).click(), loginSelector),
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 })
          ]);
          await page.waitForNetworkIdle({ idleTime: 1000, timeout: 30000 });
        } else {
          send(`⚠️ ${name}: botón de login no encontrado`);
        }
      }

      const newlyScraped = await runScraper(page, { ...printer, ip }, send, credentials, cached);
      result.inkLevels = mergeData(cached ? cached.inkLevels : [], newlyScraped);
      
      if (result.inkLevels.length > 0) {
        break;
      } else {
        throw new Error('No se obtuvieron niveles de tinta');
      }
    } catch (err) {
      send(`⚠️ ${name} error: ${err.message}`);
    } finally {
      if (browser) await browser.close();
      send(`🛑 Navegador cerrado (${name})`);
    }
  }

  if (!result.inkLevels.length) send(`❌ No se pudo obtener tinta (${name})`);
  else saveHistory(result);

  send(JSON.stringify({ printer: result }));
  return result;
}

router.get('/status-stream', async (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const send = msg => {
    if (typeof msg === 'string' && !msg.startsWith('{')) {     
      console.log(msg);
    } else if (typeof msg === 'string' && msg.startsWith('{')) {
        try {
            const obj = JSON.parse(msg);
            if (obj.printer && obj.printer.inkLevels && obj.printer.inkLevels.length) {
                console.log(`✅ EXITO: Scrape completado para ${obj.printer.name} -> ${obj.printer.inkLevels.join(' | ')}`);
            }
        } catch(e) {}
    }
    res.write(`data: ${msg}\n\n`);
  };

  // Escanear impresoras
  for (const printer of printers) {
    await processPrinter(printer, send, /* force */ false);
  }

  // Este es el FIN:
  res.write(`event: finished\n`);
  res.write(`data: Escaneo completado\n\n`);
  res.end();
});


router.get('/', (req, res) => {
  const enriched = printers.map(p => ({ ...p, cached: db[p.name] }));
  res.json({ printers: enriched });
});

router.get('/retry', async (req, res) => {
  const { ip, user, pass } = req.query;
  const printer = printers.find(p => p.url.includes(ip));
  if (!printer) return res.status(404).json({ error: 'No encontrada' });
  const result = await processPrinter(printer, undefined, true, { user, pass });
  res.json(result);
});

// Tarea programada: Escaneo automático cada hora
setInterval(async () => {
  console.log('⏰ [Scheduler] Iniciando escaneo automático programado...');
  for (const printer of printers) {
    try {
      await processPrinter(printer, console.log, false);
    } catch (e) {
      console.log(`❌ Error programado en ${printer.name}: ${e.message}`);
    }
  }
}, 60 * 60 * 1000);

module.exports = {router};
