import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('dialog', async dialog => {
    console.log('ALERT:', dialog.message());
    await dialog.accept();
  });

  try {
    console.log("Navigating to app...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
    
    console.log("Waiting for Report Export tab...");
    // Find the Report Export nav item and click it
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('nav button'));
      const exportBtn = items.find(btn => btn.textContent.includes('Report Export'));
      if (exportBtn) exportBtn.click();
    });

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log("Setting Format to ZIP...");
    // Click the ZIP button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const zipBtn = buttons.find(btn => btn.textContent.includes('ZIP'));
      if (zipBtn) zipBtn.click();
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log("Clicking Download...");
    // Click Download
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const dloadBtn = buttons.find(btn => btn.textContent.includes('Download Export'));
      if (dloadBtn) dloadBtn.click();
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("Test finished.");
  } catch(e) {
    console.error("Test script failed:", e);
  } finally {
    await browser.close();
  }
})();
