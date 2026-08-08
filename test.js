const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });
  
  await page.goto('https://safedeal-coral.vercel.app/analyze', { waitUntil: 'networkidle0' });
  
  // Wait for city input
  await page.waitForSelector('#city');
  
  // Type into it
  await page.type('#city', 'תל אב', { delay: 100 });
  
  // Wait a bit
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: 'screenshot.png' });
  
  // Also get the options if they exist
  const listItems = await page.$$eval('li', els => els.map(e => e.textContent));
  console.log("LIST ITEMS FOUND:", listItems);
  
  await browser.close();
})();
