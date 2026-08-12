/*
 * ECHTVERSAND aller Lead-Wege
 * ---------------------------
 *   node tools/echttest-formulare.js [basis-url]
 *
 * ACHTUNG: Dieses Skript sendet WIRKLICH ab. Es erzeugt sieben echte
 * E-Mails an info@bhd-energie.de. Fuer den normalen Rauchtest ohne Mails
 * ist tools/test-formulare.js zustaendig.
 *
 * Jede Anfrage traegt im Namensfeld eine eindeutige Kennung wie
 * "TEST 3 Partnerformular", damit sich die Mails im Postfach zuordnen
 * lassen. Zwei Formulare bekommen zusaetzlich einen kleinen Bildanhang,
 * damit auch der Dateiversand geprueft ist.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASIS = (process.argv[2] || 'https://bhd-energie.de').replace(/\/$/, '');
const MAIL = 'test@example.org';
const TEL = '0170 0000000';
const PLZ = '13359';

const schlaf = ms => new Promise(r => setTimeout(r, ms));
const ergebnisse = [];

/* Optional nur einzelne Wege senden:  node tools/echttest-formulare.js <url> 5,6,7 */
const NUR = (process.argv[3] || '').split(',').map(s => s.trim()).filter(Boolean).map(Number);
const soll = nr => !NUR.length || NUR.includes(nr);

function melde(nr, name, ok, detail) {
  ergebnisse.push({ nr, name, ok, detail });
  console.log('   ' + (ok ? '[GESENDET]' : '[FEHLER]  ') + ' ' + detail);
}

/* Kleine Testdatei fuer die beiden Upload-Formulare erzeugen. */
function testDatei() {
  const ziel = path.join(__dirname, '..', '.testanhang.png');
  /* 1x1-Pixel-PNG, reicht als Nachweis, dass Anhaenge durchgehen. */
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64');
  fs.writeFileSync(ziel, png);
  return ziel;
}

/* Beobachtet die Antworten von FormSubmit auf einer Seite. */
function beobachte(page, treffer) {
  page.on('response', async res => {
    if (!res.url().includes('formsubmit.co')) return;
    let rumpf = '';
    try { rumpf = (await res.text()).slice(0, 200); } catch (e) { rumpf = '(nicht lesbar)'; }
    treffer.push({ url: res.url(), status: res.status(), rumpf });
  });
}

/* --- Wege ueber sendLead (AJAX) ------------------------------------- */
async function ajaxWeg(browser, nr, name, pfad, fuellen) {
  if (!soll(nr)) return;
  console.log('\n' + nr + ') ' + name);
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });
  const treffer = [];
  beobachte(page, treffer);
  await page.goto(BASIS + pfad, { waitUntil: 'networkidle2' });
  await fuellen(page);
  await schlaf(3000);

  const antwort = treffer.find(t => t.url.includes('/ajax/'));
  if (!antwort) return melde(nr, name, false, 'keine Antwort von FormSubmit erhalten');
  const erfolg = antwort.status === 200 && /"success"\s*:\s*"?true/i.test(antwort.rumpf);
  melde(nr, name, erfolg, erfolg
    ? 'FormSubmit bestaetigt: HTTP 200, success=true'
    : 'FormSubmit antwortete HTTP ' + antwort.status + ': ' + antwort.rumpf);
  await page.close();
}

/* --- Wege ueber echten POST (Seitenwechsel) -------------------------- */
async function postWeg(browser, nr, name, pfad, marke, fuellen) {
  if (!soll(nr)) return;
  console.log('\n' + nr + ') ' + name);
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });
  const treffer = [];
  beobachte(page, treffer);
  await page.goto(BASIS + pfad, { waitUntil: 'networkidle2' });
  await fuellen(page);
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
  } catch (e) { /* manche Wege landen ohne zweite Navigation */ }
  await schlaf(1500);

  const url = page.url();
  /* Die Marke aus _next steht nur kurz in der Adresse: der Danke-Block
   * raeumt sie per history.replaceState sofort wieder weg. Deshalb NICHT
   * an der Adresse festmachen, sondern an der Antwort von FormSubmit und
   * an der sichtbaren Danke-Meldung. */
  const dank = await page.evaluate(() => {
    const d = [...document.querySelectorAll('.fdone')].find(e => e.classList.contains('show'));
    const f = document.querySelector('form');
    return d ? { titel: d.querySelector('h3').textContent.trim(), formularWeg: f ? f.style.display === 'none' : null } : null;
  }).catch(() => null);
  const antwort = treffer.find(t => t.status < 400);
  const abgelehnt = treffer.find(t => t.status >= 400);
  const erfolg = !!dank || !!antwort;

  let text;
  if (dank) text = 'angenommen · Danke-Meldung sichtbar: "' + dank.titel + '"';
  else if (antwort) text = 'angenommen · FormSubmit antwortete HTTP ' + antwort.status;
  else if (abgelehnt) text = 'ABGELEHNT · FormSubmit antwortete HTTP ' + abgelehnt.status + ': ' + abgelehnt.rumpf;
  else text = 'nichts an FormSubmit gesendet · Seite blieb auf ' + url +
    ' (vermutlich hat die Browser-Pruefung ein Pflichtfeld bemaengelt)';
  melde(nr, name, erfolg, text + (url.includes(marke) ? ' · Marke ' + marke + ' war in der Adresse' : ''));
  await page.close();
}

(async () => {
  console.log('ECHTVERSAND gegen ' + BASIS);
  console.log('Es entstehen sieben echte E-Mails an info@bhd-energie.de.\n');
  const anhang = testDatei();

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu']
  });

  /* 1) Startseiten-Funnel */
  await ajaxWeg(browser, 1, 'Startseiten-Funnel', '/', async page => {
    for (let i = 0; i < 3; i++) {
      const weiter = await page.evaluate(() => {
        const s = [...document.querySelectorAll('#funnel .step')].find(x => !x.hasAttribute('hidden') && x.offsetParent !== null);
        const k = s && s.querySelector('.choice');
        if (!k) return false; k.click(); return true;
      });
      if (!weiter) break;
      await schlaf(400);
    }
    await page.evaluate(p => {
      const plz = document.getElementById('plz');
      if (plz) { plz.value = p; plz.dispatchEvent(new Event('input', { bubbles: true })); }
      const w = document.querySelector('[data-next-valid="plz"]'); if (w) w.click();
    }, PLZ);
    await schlaf(400);
    await page.evaluate((m, t) => {
      const setz = (id, v) => { const e = document.getElementById(id); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); } };
      setz('name', 'TEST 1 Startseiten-Funnel');
      setz('tel', t); setz('mail', m);
      const ok = document.getElementById('dsgvo'); if (ok && !ok.checked) ok.click();
      document.getElementById('finalSubmit').click();
    }, MAIL, TEL);
  });

  /* 2) Anfrageformular B2C */
  await ajaxWeg(browser, 2, 'Anfrageformular B2C (/anfragen/)', '/anfragen/', async page => {
    await page.evaluate((m, t, p) => {
      const setz = (id, v) => { const e = document.getElementById(id); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); } };
      setz('b2c-name', 'TEST 2 Anfrageformular B2C');
      setz('b2c-plz', p); setz('b2c-tel', t); setz('b2c-mail', m);
      const art = document.getElementById('b2c-art');
      if (art && art.options.length > 1) { art.selectedIndex = 1; art.dispatchEvent(new Event('change', { bubbles: true })); }
      const ok = document.getElementById('b2c-dsgvo'); if (ok && !ok.checked) ok.click();
      document.getElementById('b2c-submit').click();
    }, MAIL, TEL, PLZ);
  });

  /* 3) Partnerformular B2B */
  await ajaxWeg(browser, 3, 'Partnerformular B2B (/partner-werden/)', '/partner-werden/', async page => {
    await page.evaluate((m, t, p) => {
      const setz = (id, v) => { const e = document.getElementById(id); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); } };
      setz('b2b-firma', 'TEST 3 Partnerformular');
      setz('b2b-name', 'TEST 3 Partnerformular');
      setz('b2b-plz', p); setz('b2b-tel', t); setz('b2b-mail', m);
      const art = document.getElementById('b2b-art');
      if (art && art.options.length > 1) { art.selectedIndex = 1; art.dispatchEvent(new Event('change', { bubbles: true })); }
      const ok = document.getElementById('b2b-dsgvo'); if (ok && !ok.checked) ok.click();
      document.getElementById('b2b-submit').click();
    }, MAIL, TEL, PLZ);
  });

  /* 4) Waermepumpen-Rechner */
  await ajaxWeg(browser, 4, 'Waermepumpen-Rechner (Auslegung senden)', '/waermepumpen-rechner/', async page => {
    await page.evaluate(() => document.getElementById('wp-send').click());
    await schlaf(600);
    await page.evaluate((m, t, p) => {
      const setz = (id, v) => { const e = document.getElementById(id); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); } };
      setz('wp-k-name', 'TEST 4 Waermepumpen-Rechner');
      setz('wp-k-plz', p); setz('wp-k-mail', m); setz('wp-k-tel', t);
      const ok = document.getElementById('wp-k-dsgvo'); if (ok && !ok.checked) ok.click();
      document.getElementById('wp-k-submit').click();
    }, MAIL, TEL, PLZ);
  });

  /* 5) Angebots-Check inklusive Anhang */
  await postWeg(browser, 5, 'Angebots-Check (mit Anhang)', '/angebots-check/', 'checkok=1', async page => {
    await page.evaluate((m, t, p) => {
      const setz = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
      setz('c-name', 'TEST 5 Angebots-Check'); setz('c-plz', p);
      setz('c-mail', m); setz('c-tel', t);
      setz('c-msg', 'Automatischer Testlauf der Website. Bitte ignorieren.');
      const ok = document.getElementById('c-dsgvo'); if (ok && !ok.checked) ok.click();
    }, MAIL, TEL, PLZ);
    const feld = await page.$('#c-file');
    if (feld) await feld.uploadFile(anhang);
    await page.evaluate(() => document.querySelector('#check-form-el button[type=submit]').click());
  });

  /* 6) Bestandsanlagen-Check inklusive Anhang */
  await postWeg(browser, 6, 'Bestandsanlagen-Check (mit Anhang)', '/bestandsanlagen-check/', 'bestandok=1', async page => {
    await page.evaluate((m, t, p) => {
      const setz = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
      const wahl = (id) => { const e = document.getElementById(id); if (e && e.options.length > 1) e.selectedIndex = 1; };
      wahl('b-anliegen'); wahl('b-anlage');
      setz('b-problem', 'Automatischer Testlauf der Website. Bitte ignorieren.');
      setz('b-name', 'TEST 6 Bestandsanlagen-Check'); setz('b-plz', p);
      setz('b-mail', m); setz('b-tel', t);
      const mehr = document.querySelector('.checkgrid input[type=checkbox]'); if (mehr && !mehr.checked) mehr.click();
      const ok = document.getElementById('b-dsgvo'); if (ok && !ok.checked) ok.click();
    }, MAIL, TEL, PLZ);
    const feld = await page.$('#b-files');
    if (feld) await feld.uploadFile(anhang);
    await page.evaluate(() => document.querySelector('#bestand-form-el button[type=submit]').click());
  });

  /* 7) Terminanfrage */
  await postWeg(browser, 7, 'Terminanfrage (Kalender)', '/termin/', 'terminok=1', async page => {
    await page.evaluate((m, t, p) => {
      const zeit = document.querySelector('#slots .slot:not(:disabled)');
      if (zeit) zeit.click();
      const setz = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
      const wahl = (id) => { const e = document.getElementById(id); if (e && e.options.length > 1) e.selectedIndex = 1; };
      wahl('t-thema');
      setz('t-grund', 'Automatischer Testlauf der Website. Bitte ignorieren.');
      setz('t-name', 'TEST 7 Terminanfrage'); setz('t-tel', t);
      setz('t-mail', m); setz('t-plz', p);
      const ok = document.getElementById('t-dsgvo'); if (ok && !ok.checked) ok.click();
    }, MAIL, TEL, PLZ);
    await page.evaluate(() => document.querySelector('#termin-form-el button[type=submit]').click());
  });

  await browser.close();
  try { fs.unlinkSync(anhang); } catch (e) { /* egal */ }

  console.log('\n' + '='.repeat(64));
  const fehler = ergebnisse.filter(e => !e.ok);
  ergebnisse.forEach(e => console.log((e.ok ? '  gesendet ' : '  FEHLER   ') + e.nr + ') ' + e.name));
  console.log('\n' + (ergebnisse.length - fehler.length) + ' von ' + ergebnisse.length + ' Anfragen wurden von FormSubmit angenommen.');
  console.log('Suche im Postfach nach "TEST 1" bis "TEST 7".');
  process.exit(fehler.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
