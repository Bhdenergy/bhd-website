/* Prueft die Einwilligungsleiste und die Formular-Checkboxen.
 *
 * Hintergrund: Die Leiste hiess urspruenglich .consent – genau wie die
 * Checkbox-Zeile in den Formularen. Gleiche Spezifitaet, spaetere Regel
 * gewinnt: dadurch bekamen alle Formular-Checkboxen position:fixed und
 * klebten unlesbar uebereinander am unteren Fensterrand. Dieser Test
 * haelt fest, dass beides getrennt bleibt.
 *
 *   node tools/test-einwilligung.js        (Server muss auf 8099 laufen)
 */
const puppeteer = require('puppeteer-core');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASIS = process.env.BASIS || 'http://localhost:8099';
let fehler = 0;

function pruefe(bedingung, text) {
  console.log('   [' + (bedingung ? 'ok' : 'FEHLER') + ']  ' + text);
  if (!bedingung) fehler++;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu']
  });
  console.log('Einwilligungs-Test gegen ' + BASIS + '\n');

  /* --- 1) Leiste erscheint und laesst sich wegklicken --------------- */
  console.log('1) Einwilligungsleiste');
  const p1 = await browser.newPage();
  await p1.goto(BASIS + '/', { waitUntil: 'networkidle0' });

  const sichtbar = await p1.$eval('#consent', el => !el.hidden);
  pruefe(sichtbar, 'Leiste wird beim ersten Besuch angezeigt');

  const pos = await p1.$eval('#consent', el => getComputedStyle(el).position);
  pruefe(pos === 'fixed', 'Leiste ist am Fenster fixiert (ist: ' + pos + ')');

  await p1.click('#consent-ja');
  const wegNachKlick = await p1.$eval('#consent', el => el.hidden);
  pruefe(wegNachKlick, 'Leiste verschwindet nach "Statistik erlauben"');

  const gemerkt = await p1.evaluate(() => localStorage.getItem('bhd-consent'));
  pruefe(gemerkt === 'ja', 'Entscheidung gespeichert (ist: ' + gemerkt + ')');

  await p1.reload({ waitUntil: 'networkidle0' });
  const bleibtWeg = await p1.$eval('#consent', el => el.hidden);
  pruefe(bleibtWeg, 'Leiste bleibt nach dem Neuladen weg');
  await p1.close();

  /* --- 2) Ablehnen ------------------------------------------------- */
  console.log('\n2) Ablehnen');
  const p2 = await browser.newPage();
  /* Alle Seiten teilen sich dasselbe localStorage – ohne Zuruecksetzen
   * waere die Entscheidung aus Schritt 1 noch gespeichert und die Leiste
   * gar nicht sichtbar. */
  await p2.goto(BASIS + '/', { waitUntil: 'domcontentloaded' });
  await p2.evaluate(() => localStorage.clear());
  await p2.reload({ waitUntil: 'networkidle0' });
  await p2.click('#consent-nein');
  pruefe(await p2.$eval('#consent', el => el.hidden), 'Leiste verschwindet nach "Nur Notwendiges"');
  const gtagWeg = await p2.evaluate(() => !window.__gaAktiv);
  pruefe(gtagWeg, 'Kein Analytics geladen nach Ablehnung');
  await p2.close();

  /* --- 3) Formular-Checkboxen stehen im Textfluss ------------------- */
  console.log('\n3) Formular-Checkboxen (die eigentliche Regression)');
  for (const [pfad, name] of [['/anfragen/', 'B2C-Formular'], ['/partner-werden/', 'B2B-Formular']]) {
    const p = await browser.newPage();
    await p.goto(BASIS + pfad, { waitUntil: 'networkidle0' });
    const befund = await p.$$eval('.consent', els => els.map(el => ({
      position: getComputedStyle(el).position,
      display: getComputedStyle(el).display
    })));
    pruefe(befund.length > 0, name + ': Checkbox-Zeile vorhanden (' + befund.length + ')');
    pruefe(befund.every(b => b.position === 'static'),
      name + ': steht im Textfluss statt fixiert');
    pruefe(befund.every(b => b.display === 'flex'),
      name + ': behaelt das Flex-Layout');
    await p.close();
  }

  await browser.close();
  console.log(fehler ? ('\n' + fehler + ' FEHLER – nicht deployen.') : '\nEinwilligung und Formular-Checkboxen sind sauber getrennt.');
  process.exit(fehler ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
