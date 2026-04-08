const puppeteer = require('puppeteer');
const scraper = require('./scrapers/hp4720.js');

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            ignoreHTTPSErrors: true,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            // Use their exact args
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
        
        console.log('Navigating to http://172.16.117.127...');
        await page.goto('http://172.16.117.127', { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Handle certificate warning
        if (await page.$('#details-button')) {
            console.log('Skipping certificate warning...');
            await page.click('#details-button');
            await page.waitForSelector('#proceed-link', { visible: true, timeout: 3000 });
            await page.click('#proceed-link');
            await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 });
        }
        
        console.log('Running scraper...');
        const dummyPrinter = { name: 'Test Printer', ip: '172.16.117.127' };
        const result = await scraper.scrape(page, dummyPrinter, console.log);
        console.log('Scraper result:', result);
    } catch(err) {
        console.error('Error:', err);
    } finally {
        if (browser) await browser.close();
    }
})();
