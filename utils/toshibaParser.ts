/**
 * Scrapes ink levels from a Toshiba printer web interface using Puppeteer.
 * Only for printers with model 'Toshiba e-Studio'.
 * Returns array of strings like 'yellow: 80%'.
 */
export async function scrapeToshibaInkLevels(page: import('puppeteer').Page, printer: Printer, send?: (msg: string) => void): Promise<string[]> {
  send?.(`🌐 Abriendo ${printer.name} (${printer.url})...`);
  await page.goto(printer.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Manejo de popups tipo alert/confirm
  page.on('dialog', async dialog => {
    send?.(`⚠️ Popup detectado: "${dialog.message()}"`);
    await dialog.accept();
    send?.(`✅ Popup aceptado`);
  });

  // Login si aparece enlace de Acceso
  const accesoLink = await page.$('a.clsLogin[onclick*="fnnLoginClick"]');
  if (accesoLink) {
    send?.('🔑 Enlace de Acceso encontrado, realizando login...');
    await accesoLink.click();
    await page.waitForSelector('input[type="text"]', { visible: true, timeout: 10000 });
    await page.type('input[type="text"]', 'Epson');
    await page.type('input[type="password"]', '123456');
    const submitBtn = await page.$('input[type="submit"], button[type="submit"]');
    if (submitBtn) {
      await Promise.all([
        submitBtn.click(),
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 })
      ]);
      send?.('✅ Login enviado');
    } else {
      send?.('❌ No se encontró el botón de envío de login');
      return [];
    }
  } else {
    send?.('ℹ️ No se requiere login');
  }

  // Buscar frame 'contents'
  const contentsFrame = page.frames().find(f => f.name() === 'contents');
  if (!contentsFrame) {
    send?.("❌ Frame 'contents' no encontrado");
    return [];
  }
  send?.("✅ Frame 'contents' localizado");

  // Esperar filas de tóner
  await contentsFrame.waitForSelector('tr.WeissTonerImage, tr.CaspianTonerImage, tr', { timeout: 20000 });
  send?.('✅ Filas de tóner detectadas');

  // Extraer niveles de tinta
  const inkLevels = await contentsFrame.evaluate(() => {
    const map = {
      amarillo: 'yellow',
      magenta: 'magenta',
      cian: 'cyan',
      negro: 'black'
    };
    const data: string[] = [];
    document.querySelectorAll('tr.WeissTonerImage, tr.CaspianTonerImage, tr').forEach(tr => {
      const tds = tr.querySelectorAll('td');
      if (tds.length < 3) return;
      let raw = (tds[0].textContent || '').replace(/document\.write\(.*?\)/gi, '').toLowerCase();
      const m = raw.match(/(amarillo|magenta|cian|negro)/i);
      if (!m) return;
      const colorKey = m[1].toLowerCase();
      const color = map[colorKey];
      const pct = tds[2].innerText.replace(/[^0-9]/g, '');
      if (!pct || isNaN(Number(pct))) return;
      data.push(`${color}: ${pct}%`);
    });
    return data;
  });
  send?.(`✅ Datos extraídos: ${inkLevels.join(', ')}`);
  return inkLevels;
}
import { Printer } from '../types';

/**
 * Parses the raw HTML string from a Toshiba e-STUDIO "Device.html" page
 * and extracts printer status, ink levels, and alerts.
 */
export const parseToshibaDevicePage = (html: string, baseIp: string): Partial<Printer> => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Helper to safely get text content
  const getText = (id: string) => doc.getElementById(id)?.textContent?.trim() || '';

  // Extract Basic Info
  const model = getText('DeviceCopierModel');
  const name = getText('DeviceName');
  const location = getText('DeviceLocation');
  
  // Extract Alerts
  // Toshiba alerts are often in a td with id 'devicealert_id'
  const alerts: string[] = [];
  const alertNode = doc.getElementById('devicealert_id');
  if (alertNode) {
    const alertText = alertNode.textContent?.trim() || '';
    // Remove the bullet point if present
    const cleanAlert = alertText.replace(/^•\s*/, '').trim();
    if (cleanAlert && cleanAlert !== 'None' && !cleanAlert.includes('No notification')) {
      alerts.push(cleanAlert);
    }
  }

  // Extract Ink Levels
  // Note: ID casing is inconsistent in Toshiba HTML (e.g., YellowToner vs Magentatoner)
  const getInkLevel = (id: string, colorLabel: string): string | null => {
    const valStr = getText(id); // e.g., "99"
    if (!valStr) return null;
    return `${colorLabel}: ${valStr}%`;
  };

  const inkLevels = [
    getInkLevel('YellowToner', 'Yellow'),
    getInkLevel('Magentatoner', 'Magenta'),
    getInkLevel('Cyantoner', 'Cyan'),
    getInkLevel('Blacktoner', 'Black') // Sometimes 'Blacktoner' or 'BlackToner'
  ].filter(Boolean) as string[];

  // Determine Status based on alerts
  let status: 'online' | 'warning' | 'offline' = 'online';
  if (alerts.length > 0) {
    status = 'warning';
  }

  return {
    name: name || `Toshiba ${baseIp}`,
    model: model || 'Toshiba Device',
    location,
    ip: baseIp,
    url: `http://${baseIp}`,
    status,
    inkLevels,
    alerts,
    lastUpdated: new Date().toISOString()
  };
};