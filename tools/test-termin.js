/*
 * Test des Terminkalenders
 * ------------------------
 *   node tools/test-termin.js        (Server muss auf 8099 laufen)
 *
 * Prueft die Regeln, die man von aussen nicht sieht:
 *  - Oeffnungszeiten Mo-Mi 10-20 Uhr, Do-Fr 10-16 Uhr, Wochenende zu
 *  - Freitag 12:30-14:30 Uhr immer gesperrt
 *  - rund 20 Prozent der Zeiten je Tag als vergeben markiert
 *  - dieselben Zeiten bleiben ueber Neuladen hinweg gesperrt
 *    (mit echtem Zufall waeren es jedes Mal andere - das faellt auf)
 *  - hoechstens einen Monat im Voraus buchbar
 *  - ohne gewaehlten Termin laesst sich das Formular nicht absenden
 */
const puppeteer = require('puppeteer-core');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASIS = process.argv[2] || 'http://localhost:8099';
let fehler = 0;

function pruefe(bedingung, text) {
  console.log('   ' + (bedingung ? '[ok]  ' : '[FEHLER] ') + text);
  if (!bedingung) fehler++;
}

/* Liest alle Tage des sichtbaren Monats samt ihrer Zeiten aus, indem jeder
 * freie Tag angeklickt und die Slot-Leiste ausgewertet wird. */
async function monatLesen(page) {
  return page.evaluate(async () => {
    const warte = () => new Promise(r => setTimeout(r, 30));
    const ergebnis = [];
    const tage = [...document.querySelectorAll('#cal-grid .cal-tag')];
    for (const t of tage) {
      if (t.disabled) { ergebnis.push({ tag: +t.textContent, frei: false }); continue; }
      t.click(); await warte();
      const slots = [...document.querySelectorAll('#slots .slot')].map(s => ({
        zeit: s.textContent.trim(), belegt: s.disabled
      }));
      ergebnis.push({ tag: +t.textContent, frei: true, slots });
    }
    return { monat: document.getElementById('cal-monat').textContent, tage: ergebnis };
  });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu']
  });
  console.log('Terminkalender-Test gegen ' + BASIS + '\n');

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });
  await page.goto(BASIS + '/termin/', { waitUntil: 'networkidle0' });

  const daten = await monatLesen(page);
  const jahr = +daten.monat.split(' ')[1];
  const MONATE = ['Januar','Februar','März','April','Mai','Juni','Juli','August',
                  'September','Oktober','November','Dezember'];
  const monatNr = MONATE.indexOf(daten.monat.split(' ')[0]);

  console.log('1) Öffnungszeiten (' + daten.monat + ')');
  let mowmi = 0, dofr = 0, wochenende = 0, freitagMittag = 0, tageGeprueft = 0;
  for (const t of daten.tage) {
    if (!t.frei) continue;
    tageGeprueft++;
    const wt = new Date(jahr, monatNr, t.tag).getDay();
    const zeiten = t.slots.map(s => s.zeit);
    const erste = zeiten[0], letzte = zeiten[zeiten.length - 1];
    if (wt === 0 || wt === 6) wochenende++;
    if (wt >= 1 && wt <= 3 && letzte > '19:30') mowmi++;
    if (wt >= 4 && wt <= 5 && letzte > '15:30') dofr++;
    if (wt === 5 && zeiten.some(z => z >= '12:30' && z < '14:30')) freitagMittag++;
    if (erste && erste < '10:00') mowmi++;
  }
  pruefe(tageGeprueft > 0, tageGeprueft + ' buchbare Tage im ersten Monat gefunden');
  pruefe(wochenende === 0, 'kein Termin an Samstag oder Sonntag');
  pruefe(mowmi === 0, 'Mo–Mi endet spätestens 19:30, beginnt frühestens 10:00');
  pruefe(dofr === 0, 'Do–Fr endet spätestens 15:30');
  pruefe(freitagMittag === 0, 'Freitag 12:30–14:30 nirgends angeboten');

  console.log('\n2) Künstliche Auslastung');
  let gesamt = 0, belegt = 0, ohneFrei = 0;
  for (const t of daten.tage) {
    if (!t.frei) continue;
    gesamt += t.slots.length;
    belegt += t.slots.filter(s => s.belegt).length;
    if (!t.slots.some(s => !s.belegt)) ohneFrei++;
  }
  const quote = gesamt ? Math.round(belegt / gesamt * 100) : 0;
  pruefe(quote >= 15 && quote <= 25, 'Sperrquote liegt bei ' + quote + ' Prozent (Ziel: rund 20)');
  pruefe(ohneFrei === 0, 'kein buchbarer Tag ist komplett ausgebucht');

  console.log('\n3) Stabilität über Neuladen');
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1280, height: 1000 });
  await page2.goto(BASIS + '/termin/', { waitUntil: 'networkidle0' });
  const daten2 = await monatLesen(page2);
  const alsText = d => JSON.stringify(d.tage.map(t => t.frei ? t.slots.map(s => s.zeit + (s.belegt ? 'x' : '')) : 0));
  pruefe(alsText(daten) === alsText(daten2),
    'zweiter Aufruf zeigt exakt dieselben belegten Zeiten');
  await page2.close();

  console.log('\n4) Buchungsfenster');
  const fenster = await page.evaluate(() => {
    const naechst = document.querySelector('[data-cal-next]');
    const schritte = [];
    let schutz = 0;
    while (!naechst.disabled && schutz++ < 6) { naechst.click(); schritte.push(document.getElementById('cal-monat').textContent); }
    return { monate: schritte, endeErreicht: naechst.disabled };
  });
  pruefe(fenster.monate.length <= 1, 'höchstens ein Monat vorblätterbar (war: ' + fenster.monate.length + ')');
  pruefe(fenster.endeErreicht, 'Weiter-Knopf sperrt am Ende des Fensters');

  console.log('\n5) Absenden ohne Terminwahl');
  const page3 = await browser.newPage();
  await page3.setViewport({ width: 1280, height: 1000 });
  const gesendet = [];
  await page3.setRequestInterception(true);
  page3.on('request', req => {
    if (req.url().includes('formsubmit.co')) {
      if (req.method() === 'POST') gesendet.push(req.url());
      return req.respond({ status: 200, contentType: 'text/html', body: 'ok' });
    }
    req.continue();
  });
  await page3.goto(BASIS + '/termin/', { waitUntil: 'networkidle0' });
  const zustand = await page3.evaluate(() => {
    const f = document.getElementById('termin-form-el');
    document.getElementById('t-termin').value = '';
    f.querySelectorAll('[required]').forEach(el => {
      if (el.type === 'checkbox' || el.type === 'radio') { if (!el.checked) el.click(); return; }
      if (el.tagName === 'SELECT') { if (el.options.length > 1) el.selectedIndex = 1; return; }
      el.value = el.type === 'email' ? 'a@b.de' : (el.name === 'PLZ' ? '13359' : 'Test');
    });
    f.querySelector('button[type=submit]').click();
    return { warnungSichtbar: !document.getElementById('t-warnung').hidden };
  });
  await new Promise(r => setTimeout(r, 1200));
  pruefe(gesendet.length === 0, 'kein Versand ohne gewählten Termin (war: ' + gesendet.length + ')');
  pruefe(zustand.warnungSichtbar, 'Hinweis "bitte Termin wählen" wird eingeblendet');
  await page3.close();

  await page.close();
  await browser.close();
  console.log(fehler ? ('\n' + fehler + ' FEHLER – nicht deployen.') : '\nTerminkalender arbeitet nach den Vorgaben.');
  process.exit(fehler ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
