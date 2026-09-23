/*
 * Screenshots der neuen Seiten fuer die Vorschau vor dem Live-Stellen.
 * Aufruf:  node tools/screenshots-neu.js <zielordner>   (Server auf 8099 noetig)
 * Erzeugt je Seite ein Handy- (390 px) und ein Desktop-Bild (1280 px),
 * beide auf die oberen ~1400 px begrenzt, damit die Datei klein bleibt.
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ZIEL = process.argv[2] || '.';
const BASIS = 'http://localhost:8099';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const SEITEN = [
  ['brandenburg', '/photovoltaik-waermepumpe-brandenburg/'],
  ['foerderung2027', '/waermepumpe-foerderung-2027/'],
  ['mastr', '/photovoltaik-anmelden-marktstammdatenregister/'],
  ['start', '/']
];

(async () => {
  fs.mkdirSync(ZIEL, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  for (const [name, pfad] of SEITEN) {
    for (const [art, breite, hoehe, mobil] of [['handy', 390, 1500, true], ['desktop', 1280, 1400, false]]) {
      const page = await browser.newPage();
      await page.setViewport({ width: breite, height: hoehe, deviceScaleFactor: 1, isMobile: mobil });
      await page.goto(BASIS + pfad, { waitUntil: 'networkidle2' });
      // Einwilligungsleiste wegklicken, sie verdeckt sonst den Inhalt.
      await page.evaluate(() => {
        try { localStorage.setItem('bhd-consent', 'alle'); } catch (e) {}
        const c = document.getElementById('consent');
        if (c) c.remove();
      });
      await new Promise(r => setTimeout(r, 600));
      const datei = path.join(ZIEL, name + '-' + art + '.png');
      await page.screenshot({ path: datei });
      console.log(datei);
      await page.close();
    }
  }
  await browser.close();
})();
