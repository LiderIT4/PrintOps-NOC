const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
      headless: 'new', 
      ignoreHTTPSErrors: true,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--ignore-certificate-errors'
      ]
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:8000/printers');
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
