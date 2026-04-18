import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Get URL and optional label from command line arguments
const url = process.argv[2] || 'http://localhost:5173';
const label = process.argv[3] ? `-${process.argv[3]}` : '';
const dir = './temporary_screenshots';

// Ensure the screenshot directory exists
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// Find the next available number for auto-incrementing
let counter = 1;
while (fs.existsSync(path.join(dir, `screenshot-${counter}${label}.png`))) {
    counter++;
}

const filename = `screenshot-${counter}${label}.png`;
const filepath = path.join(dir, filename);

(async () => {
    console.log(`Navigating to ${url}...`);
    
    // Launch browser (headless by default)
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Set a standard desktop viewport for consistent design reviews
    await page.setViewport({ width: 1280, height: 800 });
    
    try {
        // networkidle0 waits until there are no more than 0 network connections for at least 500 ms
        await page.goto(url, { waitUntil: 'networkidle0' });
        
        // Take a full page screenshot
        await page.screenshot({ path: filepath, fullPage: true });
        console.log(`Success! Screenshot saved to: ${filepath}`);
    } catch (error) {
        console.error(`Error taking screenshot: ${error.message}`);
    } finally {
        await browser.close();
    }
})();