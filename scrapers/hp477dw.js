// scrapers/hp477dw.js – Scraper híbrido para HP PageWide Pro 477dw (SNMP + Puppeteer)

const snmp = require('net-snmp');
const fs = require('fs');
const path = require('path');

// Función auxiliar para obtener datos vía SNMP
async function getSNMPData(ip, send) {
  return new Promise((resolve) => {
    if (!ip) {
       if (send) send(`[SNMP] Error: IP no recibida`);
       return resolve(null);
    }
    if (send) send(`[SNMP] Consultando ${ip}...`);
    
    // OIDs específicos para HP 477dw (con sufijo .0 para instancias de firmware reciente)
    const oids = [
      "1.3.6.1.2.1.43.10.2.1.4.1.1",     // Total Pages (General MIB)
      "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.6.0", // Mono Pages (HP Private + .0)
      "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.7.0", // Color Pages (HP Private + .0)
      "1.3.6.1.2.1.43.11.1.1.9.1.1",        // Yellow
      "1.3.6.1.2.1.43.11.1.1.9.1.2",        // Magenta
      "1.3.6.1.2.1.43.11.1.1.9.1.3",        // Cyan
      "1.3.6.1.2.1.43.11.1.1.9.1.4",        // Black
    ];

    const session = snmp.createSession(ip, "public", { 
      version: snmp.Version2c, // Usar v2c para mejor manejo de errores de instancia
      timeout: 3000, 
      retries: 1 
    });
    
    session.get(oids, (error, varbinds) => {
      if (error) {
        if (send) send(`[SNMP] No disponible: ${error.message}`);
        session.close();
        resolve(null);
      } else {
        const results = [];
        
        // 1. Total Pages
        if (!snmp.isVarbindError(varbinds[0])) results.push(`Pages: ${varbinds[0].value}`);
        // 2. Mono Pages
        if (!snmp.isVarbindError(varbinds[1])) results.push(`BW Pages: ${varbinds[1].value}`);
        // 3. Color Pages
        if (!snmp.isVarbindError(varbinds[2])) results.push(`Color Pages: ${varbinds[2].value}`);

        // 4. Ink Levels (posiciones 3 a 6)
        const colors = ['yellow', 'magenta', 'cyan', 'black'];
        for (let i = 0; i < 4; i++) {
          const vb = varbinds[i + 3];
          if (!snmp.isVarbindError(vb)) {
            let val = vb.value;
            if (val < 0) val = 0;
            if (val > 100) val = 100;
            results.push(`${colors[i]}: ${val}%`);
          }
        }

        session.close();
        if (results.length > 0) {
          if (send) send(`[SNMP] Éxito: ${results.join(' | ')}`);
          resolve(results);
        } else {
          resolve(null);
        }
      }
    });

    // Timeout de seguridad para la promesa
    setTimeout(() => { try { session.close(); } catch(e) {} resolve(null); }, 5000);
  });
}

module.exports = {
  path: '', // Iniciamos en la raíz (para el fallback)

  scrape: async (page, printer, send, credentials, cached) => {
    let datos = [];
    const oneHour = 60 * 60 * 1000;
    const now = Date.now();
    
    // Verificar si los niveles de tinta en caché son recientes (< 1 hora)
    const hasRecentInk = cached && cached.inkLevels && 
                         cached.inkLevels.some(l => !l.includes('Pages:')) && 
                         (now - new Date(cached.timestamp).getTime()) < oneHour;

    // Credenciales por defecto
    const creds = credentials || { user: 'Admin', pass: 'SPdinn9742**' };

    // 1. Extraer niveles de tinta (Solo si no son recientes o si forzamos)
    if (!hasRecentInk) {
      // 🚀 INTENTO 1: SNMP
      const snmpData = await getSNMPData(printer.ip, send);
      if (snmpData) {
        // SNMP ya trae tanto tinta como todas las variantes de páginas (Total, BW, Color)
        return snmpData; 
      } else {
        // Fallback a Web Scraping para tinta si SNMP falla
        try {
          if (send) send(`[${printer.name}] Consultando tinta por web...`);
          const inkSelector = '.ink-inkLevel-tile';
          await page.waitForSelector(inkSelector, { visible: true, timeout: 10000 });
          const niveles = await page.$$eval(
            '.ink-inkLevel-tile .off-screen-text-cls',
            nodes => nodes.map(n => {
                const text = n.innerText.trim().toLowerCase();
                const pctMatch = text.match(/(\d+)\s*%/);
                const pct = pctMatch ? pctMatch[1] : '0';
                
                if (text.includes('cyan') || text.includes('cian')) return `cyan: ${pct}%`;
                if (text.includes('magenta')) return `magenta: ${pct}%`;
                if (text.includes('yellow') || text.includes('amarillo')) return `yellow: ${pct}%`;
                if (text.includes('black') || text.includes('negro')) return `black: ${pct}%`;
                return text;
            })
          );
          datos.push(...niveles.filter(n => n));
        } catch (e) {
          if (send) send(`[${printer.name}] No se pudo obtener tinta por web tampoco.`);
        }
      }
    } else {
      if (send) send(`[${printer.name}] Reutilizando niveles de tinta de la caché (<1h).`);
      // Si la tinta está fresca, intentamos obtener solo las páginas vía SNMP rápidamente
      const onlyPagesSNMP = await getSNMPData(printer.ip, null);
      if (onlyPagesSNMP) {
         return onlyPagesSNMP.filter(d => d.includes('Pages:'));
      }
    }

    // 2. Extraer conteo de páginas (Siempre intentamos si falta en lo recolectado ahora)
    if (!datos.some(d => d.includes('Pages:'))) {
       try {
          if (send) send(`[${printer.name}] Solicitando informe de uso (web)...`);
          
          const ssDir = path.join(__dirname, '..', 'screenshots');
          if (!fs.existsSync(ssDir)) fs.mkdirSync(ssDir, { recursive: true });

          // --- LIMPIEZA DE OBSTÁCULOS (Modales de alerta) ---
          await page.evaluate(() => {
            const clearModal = () => {
              // Buscar checkboxes de "No volver a mostrar"
              const checkbox = Array.from(document.querySelectorAll('input[type="checkbox"]')).find(c => {
                 const p = c.parentElement?.innerText?.toLowerCase() || '';
                 return p.includes('no volver a mostrar') || p.includes('don\'t show');
              });
              if (checkbox && !checkbox.checked) checkbox.click();

              // El usuario solicita elegir "Chrome" específicamente en el modal
              const links = Array.from(document.querySelectorAll('a, span, .gui-link'));
              const chromeLink = links.find(l => l.innerText.trim() === 'Chrome');
              if (chromeLink) {
                chromeLink.click();
              } else {
                // Fallback: Buscar botones de cierre o "Aceptar"
                const buttons = Array.from(document.querySelectorAll('button, input[type="button"], .gui-button'));
                const okButton = buttons.find(b => b.innerText.includes('Aceptar') || b.innerText.includes('OK') || b.innerText.includes('Continue'));
                if (okButton) okButton.click();
              }
            };
            clearModal();
          });
          await new Promise(r => setTimeout(r, 4000)); // Esperar a que el modal se limpie

          await page.evaluate(() => { window.location.hash = '#hId-pgUsageReport'; });
          await new Promise(r => setTimeout(r, 6000));

          // Detección de login
          let needsLogin = await page.evaluate(() => {
            const passFields = document.querySelectorAll('input[type="password"]');
            const hasVisiblePass = Array.from(passFields).some(f => f.offsetParent !== null);
            const hasLoginBtn = !!document.querySelector('#login_btn, #signInBtn, #login-button, #login_btn_ph');
            
            // Si no hay campos pero hay un enlace de "Inicio de sesión", lo pulsamos
            if (!hasVisiblePass && !hasLoginBtn) {
               const loginLink = Array.from(document.querySelectorAll('a, span, .gui-button-text')).find(el => el.innerText.includes('Inicio de sesión') || el.innerText.includes('Log In'));
               if (loginLink) {
                 loginLink.click();
                 return false; // Esperar a la siguiente vuelta del loop o delay
               }
            }
            return hasVisiblePass || hasLoginBtn;
          });

          if (!needsLogin) {
             // Esperar un poco por si el click anterior está cargando el login
             await new Promise(r => setTimeout(r, 4000));
             needsLogin = await page.evaluate(() => {
                const passFields = document.querySelectorAll('input[type="password"]');
                return Array.from(passFields).some(f => f.offsetParent !== null) || !!document.querySelector('#login_btn, #signInBtn, #login-button, #login_btn_ph');
             });
          }

          if (needsLogin) {
            if (send) send(`🔓 [${printer.name}] Login requerido, aplicando credenciales...`);
            await page.evaluate((u, p) => {
              const uF = document.querySelector('input[type="text"], input#username, input#i_user, #i_user') || document.querySelectorAll('input')[0];
              const pF = document.querySelector('input[type="password"], input#password, input#i_password, #i_password');
              if (uF) uF.value = u;
              if (pF) pF.value = p;
              const btn = document.querySelector('input[type="submit"], button[type="submit"], #signInBtn, #login-button, #login_btn, #login_btn_ph');
              if (btn) btn.click();
            }, creds.user, creds.pass);
            
            await new Promise(r => setTimeout(r, 8000));
            // Screenshot tras intento de login
            await page.screenshot({ path: path.join(ssDir, `${printer.name}_post_login.png`) });
            
            await page.evaluate(() => { window.location.hash = '#hId-pgUsageReport'; });
            await new Promise(r => setTimeout(r, 6000));
          }

          // Screenshot final de la página de reporte
          await page.screenshot({ path: path.join(ssDir, `${printer.name}_report_page.png`) });
          if (send) send(`📸 Captura de pantalla guardada en /screenshots/${printer.name}_report_page.png`);

          const extracted = await page.evaluate(() => {
            function getVal(labels) {
              const cells = Array.from(document.querySelectorAll('td'));
              for (const td of cells) {
                if (labels.some(l => td.innerText.toLowerCase().includes(l.toLowerCase()))) {
                  if (td.nextElementSibling) {
                     const v = td.nextElementSibling.innerText.trim();
                     if (/\d+/.test(v)) return v.match(/\d+/)[0];
                  }
                }
              }
              return null;
            }
            return { 
              total: getVal(['Total páginas impresas', 'Total pages printed', 'Usage: Total']),
              bw: getVal(['blanco y negro', 'black and white', 'monochrome', 'b/n']),
              color: getVal(['color', 'páginas color'])
            };
          });

          if (extracted.total) {
            datos.push(`Pages: ${extracted.total}`);
            if (extracted.bw) datos.push(`BW Pages: ${extracted.bw}`);
            if (extracted.color) datos.push(`Color Pages: ${extracted.color}`);
          }
       } catch (e) {
          if (send) send(`[${printer.name}] Error en páginas: ${e.message}`);
       }
    }

    return datos;
  }
};
