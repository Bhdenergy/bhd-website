/*
 * Screenshot eines einzelnen Bereichs fuer Vorschauen.
 * Aufruf: node tools/shot-element.js <pfad> <css-selektor> <datei.png> [breite]
 * (Server auf 8099 noetig)
 */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const [pfad, sel, datei, breite = '1280'] = process.argv.slice(2);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  const w = +breite;
  await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1, isMobile: w < 600 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('bhd-consent', 'denied'); } catch (e) {} });
  await page.goto((pfad.startsWith('http') ? '' : 'http://localhost:8099') + pfad, { waitUntil: 'networkidle2' });
  await page.addStyleTag({ content: '.rise{opacity:1!important;transform:none!important}.quickcontact,#consent{display:none!important}' });
  const el = await page.$(sel);
  if (!el) throw new Error('nicht gefunden: ' + sel);
  await el.scrollIntoView();
  await new Promise(r => setTimeout(r, 500));
  await el.screenshot({ path: datei });
  await browser.close();
})();
