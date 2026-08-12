/*
 * Formular-Rauchtest
 * ------------------
 * Aufruf:  node tools/test-formulare.js [basis-url]
 *          (Standard: http://localhost:8099)
 *
 * Klickt die drei Lead-Wege automatisiert durch und prueft, ob wirklich eine
 * Anfrage an FormSubmit rausgeht – inklusive der uebermittelten Felder.
 *
 * Die Anfrage wird ABGEFANGEN und mit einer erfundenen Erfolgsantwort
 * beantwortet. Es landet also keine Testmail im echten Postfach, und der
 * Erfolgspfad im Skript wird trotzdem vollstaendig durchlaufen.
 *
 * Hintergrund: Der Startseiten-Funnel hat schon einmal monatelang „Vielen
 * Dank" angezeigt, ohne irgendetwas zu versenden. Dieser Test faengt genau
 * das ab.
 */
const puppeteer = require('puppeteer-core');

const BASIS = process.argv[2] || 'http://localhost:8099';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const schlaf = (ms) => new Promise(r => setTimeout(r, ms));
let fehler = 0;

function pruefe(bedingung, text) {
  console.log('   ' + (bedingung ? '[ok]  ' : '[FEHLER] ') + text);
  if (!bedingung) fehler++;
}

/* Faengt POSTs an FormSubmit ab und liefert eine Erfolgsantwort zurueck. */
async function abfangen(page, sammler) {
  await page.setRequestInterception(true);
  page.on('request', req => {
    const u = req.url();
    if (u.includes('formsubmit.co')) {
      /* Nur echte Absendungen zaehlen. Nach dem multipart-POST holt der
       * Browser noch formsubmit.co/favicon.ico – das ist kein Lead und
       * wurde frueher faelschlich als zweiter Versand gewertet. */
      if (req.method() === 'POST') {
        sammler.push({ url: u, body: req.postData() || '', methode: req.method() });
      }
      return req.respond({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: 'true', message: 'Testlauf' })
      });
    }
    req.continue();
  });
}

async function funnel(browser) {
  console.log('\n1) Startseiten-Funnel');
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });
  const gesendet = [];
  await abfangen(page, gesendet);
  await page.goto(BASIS + '/', { waitUntil: 'networkidle2' });

  /* Schritte 1–3: jeweils die erste Auswahlkachel anklicken. */
  for (let schritt = 0; schritt < 3; schritt++) {
    const geklickt = await page.evaluate(() => {
      const sicht = [...document.querySelectorAll('#funnel .step')]
        .find(s => !s.hasAttribute('hidden') && s.offsetParent !== null);
      if (!sicht) return false;
      const knopf = sicht.querySelector('.choice');
      if (!knopf) return false;
      knopf.click();
      return true;
    });
    if (!geklickt) break;
    await schlaf(350);
  }

  /* Schritt 4: Postleitzahl. */
  await page.evaluate(() => {
    const plz = document.getElementById('plz');
    if (plz) { plz.value = '13359'; plz.dispatchEvent(new Event('input', { bubbles: true })); }
    const weiter = document.querySelector('[data-next-valid="plz"]');
    if (weiter) weiter.click();
  });
  await schlaf(350);

  /* Schritt 5: Kontaktdaten und Absenden. */
  await page.evaluate(() => {
    const setz = (id, v) => { const e = document.getElementById(id); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); } };
    setz('name', 'Test Testmann');
    setz('tel', '0170 1234567');
    setz('mail', 'test@example.org');
    const ok = document.getElementById('dsgvo');
    if (ok && !ok.checked) ok.click();
    document.getElementById('finalSubmit').click();
  });
  await schlaf(1400);

  pruefe(gesendet.length === 1, 'genau eine Anfrage an FormSubmit (war: ' + gesendet.length + ')');
  if (gesendet.length) {
    const b = decodeURIComponent(gesendet[0].body.replace(/\+/g, ' '));
    pruefe(/typ=/.test(b), 'Feld "typ" enthalten');
    pruefe(b.includes('Test Testmann'), 'Name uebertragen');
    pruefe(b.includes('13359'), 'Postleitzahl uebertragen');
    pruefe(b.includes('test@example.org'), 'E-Mail uebertragen');
    pruefe(gesendet[0].url.includes('info@bhd-energie.de'), 'Empfaenger info@bhd-energie.de');
  }
  const dank = await page.evaluate(() => {
    const s = document.getElementById('funnel-success') || document.querySelector('#funnel .fdone,#funnel .success');
    return s ? (s.offsetParent !== null || s.classList.contains('show')) : null;
  });
  if (dank !== null) pruefe(dank === true, 'Danke-Meldung sichtbar');
  await page.close();
}

async function einfachesFormular(browser, pfad, praefix, name) {
  console.log('\n' + name);
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });
  const gesendet = [];
  await abfangen(page, gesendet);
  await page.goto(BASIS + pfad, { waitUntil: 'networkidle2' });

  await page.evaluate((p) => {
    const setz = (id, v) => { const e = document.getElementById(id); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); } };
    setz(p + '-firma', 'Testbau GmbH');
    setz(p + '-name', 'Test Testmann');
    setz(p + '-plz', '13359');
    setz(p + '-tel', '0170 1234567');
    setz(p + '-mail', 'test@example.org');
    const art = document.getElementById(p + '-art');
    if (art && art.options.length > 1) { art.selectedIndex = 1; art.dispatchEvent(new Event('change', { bubbles: true })); }
    const ok = document.getElementById(p + '-dsgvo');
    if (ok && !ok.checked) ok.click();
    const knopf = document.getElementById(p + '-submit');
    if (knopf) knopf.click();
  }, praefix);
  await schlaf(1400);

  pruefe(gesendet.length === 1, 'genau eine Anfrage an FormSubmit (war: ' + gesendet.length + ')');
  if (gesendet.length) {
    const b = decodeURIComponent(gesendet[0].body.replace(/\+/g, ' '));
    pruefe(b.includes('Test Testmann'), 'Name uebertragen');
    pruefe(b.includes('test@example.org'), 'E-Mail uebertragen');
    pruefe(gesendet[0].url.includes('info@bhd-energie.de'), 'Empfaenger info@bhd-energie.de');
  }
  await page.close();
}

/* Angebots-Check und Bestandsanlagen-Check laufen NICHT ueber sendLead(),
 * sondern als gewoehnlicher multipart-POST – nur so nimmt FormSubmit
 * Dateianhaenge an. Sie brauchen deshalb einen eigenen Testweg. Genau
 * dieser Pfad war bis 2026-08-12 ungetestet. */
async function multipartFormular(browser, pfad, formId, name, vorher) {
  console.log('\n' + name);
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });
  const gesendet = [];
  await abfangen(page, gesendet);
  await page.goto(BASIS + pfad, { waitUntil: 'networkidle2' });

  /* Manche Formulare brauchen vorab eine Auswahl, die kein <input required>
   * ist – beim Terminformular etwa Tag und Uhrzeit aus dem Kalender. */
  if (vorher) {
    const vorbereitet = await page.evaluate(vorher);
    pruefe(vorbereitet === true, 'Vorauswahl getroffen (' + vorbereitet + ')');
  }

  const gefuellt = await page.evaluate((id) => {
    const f = document.getElementById(id);
    if (!f) return 'Formular ' + id + ' nicht gefunden';
    f.querySelectorAll('[required]').forEach(el => {
      if (el.type === 'checkbox') { if (!el.checked) el.click(); return; }
      if (el.tagName === 'SELECT') {
        if (el.options.length > 1) { el.selectedIndex = 1; el.dispatchEvent(new Event('change', { bubbles: true })); }
        return;
      }
      if (el.type === 'email') el.value = 'test@example.org';
      else if (el.type === 'tel') el.value = '0170 1234567';
      else if (el.name === 'PLZ') el.value = '13359';
      else el.value = 'Test Testmann';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    /* Falls es eine Mehrfachauswahl gibt, eine Option mitschicken. */
    const mehrfach = f.querySelector('.checkgrid input[type=checkbox]');
    if (mehrfach && !mehrfach.checked) mehrfach.click();
    const knopf = f.querySelector('button[type=submit]');
    if (!knopf) return 'Absendeknopf nicht gefunden';
    knopf.click();
    return 'ok';
  }, formId);

  pruefe(gefuellt === 'ok', 'Formular ausfuellbar (' + gefuellt + ')');
  await schlaf(1600);

  pruefe(gesendet.length === 1, 'genau ein POST an FormSubmit (war: ' + gesendet.length + ')');
  if (gesendet.length) {
    pruefe(gesendet[0].methode === 'POST', 'Methode POST (war: ' + gesendet[0].methode + ')');
    pruefe(gesendet[0].url.includes('info@bhd-energie.de'), 'Empfaenger info@bhd-energie.de');
    /* Bei multipart liefert Puppeteer den Body nicht immer aus – nur pruefen,
     * wenn er da ist, sonst faelschlich Alarm schlagen. Formulare ohne
     * enctype senden urlencoded, da muss vor dem Vergleich dekodiert werden. */
    let b = gesendet[0].body || '';
    if (b) { try { b = decodeURIComponent(b.replace(/\+/g, ' ')); } catch (e) { /* multipart: bleibt roh */ } }
    if (b) pruefe(b.includes('Test Testmann'), 'Name im Rumpf uebertragen');
    else console.log('   [--]  Rumpf von Puppeteer nicht ausgelesen (bei multipart normal)');
  }
  await page.close();
}

/* Der Waermepumpen-Rechner ist ebenfalls ein Lead-Weg: nach der Berechnung
 * erscheint ein Kontaktformular, dessen Knopf sendLead() aufruft. Er hat
 * kein action-Attribut und faellt deshalb bei einer Sichtpruefung nicht auf. */
async function rechnerFormular(browser) {
  console.log('\n7) Waermepumpen-Rechner (Auslegung senden)');
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });
  const gesendet = [];
  await abfangen(page, gesendet);
  await page.goto(BASIS + '/waermepumpen-rechner/', { waitUntil: 'networkidle2' });

  /* Erst rechnen lassen - ohne Ergebnis blendet die Seite das Formular nicht ein. */
  const sichtbar = await page.evaluate(() => {
    document.getElementById('wp-send').click();
    const box = document.getElementById('wp-kontakt');
    return !!box && getComputedStyle(box).display !== 'none';
  });
  pruefe(sichtbar, 'Kontaktformular erscheint nach der Berechnung');
  await schlaf(500);

  await page.evaluate(() => {
    const setz = (id, v) => { const e = document.getElementById(id); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); } };
    setz('wp-k-name', 'Test Testmann');
    setz('wp-k-plz', '13359');
    setz('wp-k-mail', 'test@example.org');
    setz('wp-k-tel', '0170 1234567');
    const ok = document.getElementById('wp-k-dsgvo');
    if (ok && !ok.checked) ok.click();
    document.getElementById('wp-k-submit').click();
  });
  await schlaf(1400);

  pruefe(gesendet.length === 1, 'genau eine Anfrage an FormSubmit (war: ' + gesendet.length + ')');
  if (gesendet.length) {
    const b = decodeURIComponent(gesendet[0].body.replace(/\+/g, ' '));
    pruefe(b.includes('Test Testmann'), 'Name uebertragen');
    pruefe(b.includes('test@example.org'), 'E-Mail uebertragen');
    pruefe(gesendet[0].url.includes('info@bhd-energie.de'), 'Empfaenger info@bhd-energie.de');
  }
  await page.close();
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });
  console.log('Formular-Rauchtest gegen ' + BASIS);
  await funnel(browser);
  await einfachesFormular(browser, '/anfragen/', 'b2c', '2) Anfrageformular B2C (/anfragen/)');
  await einfachesFormular(browser, '/partner-werden/', 'b2b', '3) Partnerformular B2B (/partner-werden/)');
  await multipartFormular(browser, '/angebots-check/', 'check-form-el', '4) Angebots-Check (Upload-Formular)');
  await multipartFormular(browser, '/bestandsanlagen-check/', 'bestand-form-el', '5) Bestandsanlagen-Check (Upload-Formular)');
  await multipartFormular(browser, '/termin/', 'termin-form-el', '6) Terminanfrage (Kalender)', () => {
    /* Der erste freie Tag ist vorausgewaehlt – nur noch eine Uhrzeit klicken. */
    const zeit = document.querySelector('#slots .slot:not(:disabled)');
    if (!zeit) return 'keine freie Uhrzeit gefunden';
    zeit.click();
    return document.getElementById('t-termin').value ? true : 'Wunschtermin wurde nicht gesetzt';
  });
  await rechnerFormular(browser);
  await browser.close();
  console.log(fehler ? ('\n' + fehler + ' FEHLER – nicht deployen.') : '\nAlle Lead-Wege senden korrekt.');
  process.exit(fehler ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
