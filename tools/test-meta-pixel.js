/*
 * Prueft das Meta-Pixel hinter dem Einwilligungsbanner.
 * Aufruf:  node tools/test-meta-pixel.js [basis-url]   (Server auf 8099 noetig)
 *
 * - "Ablehnen" und "Nur Statistik" laden KEIN Pixel (keine Anfrage an facebook)
 * - "Alles akzeptieren" laedt das Pixel und meldet PageView
 * - nach Neuladen mit 'alle' wird das Pixel wieder geladen
 * - eine Kurzanfrage meldet genau ein 'Lead' (FormSubmit wird abgefangen)
 */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASIS = process.argv[2] || 'http://localhost:8099';

let fehler = 0;
function pruefe(ok, text) { console.log('   ' + (ok ? '[ok]' : '[!!]') + '  ' + text); if (!ok) fehler++; }

async function seite(browser) {
  const p = await browser.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  const fb = [];
  await p.setRequestInterception(true);
  p.on('request', r => {
    const u = r.url();
    if (u.includes('facebook.')) fb.push(u);
    // Meta selbst nicht wirklich anfragen: fbevents.js liefern wir als leeres Skript,
    // die Ereignisse stehen dann in fbq.queue und lassen sich dort pruefen.
    if (u.includes('connect.facebook.net')) return r.respond({ status: 200, contentType: 'application/javascript', body: '' });
    if (u.includes('formsubmit.co')) return r.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"success":"true"}' });
    if (u.includes('/api/bestaetigung')) return r.respond({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    if (u.includes('googletagmanager') || u.includes('google-analytics')) return r.respond({ status: 200, contentType: 'application/javascript', body: '' });
    r.continue();
  });
  return { p, fb };
}

const ereignisse = p => p.evaluate(() => (window.fbq && window.fbq.queue || []).map(a => Array.from(a)));

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });

  for (const [knopf, name] of [['#consent-nein', 'Ablehnen'], ['#consent-ja', 'Nur Statistik']]) {
    console.log('\n' + name);
    const { p, fb } = await seite(browser);
    await p.goto(BASIS + '/', { waitUntil: 'networkidle0' });
    await p.evaluate(() => localStorage.clear());
    await p.reload({ waitUntil: 'networkidle0' });
    await p.click(knopf);
    await new Promise(r => setTimeout(r, 800));
    pruefe(fb.length === 0, 'keine Anfrage an Facebook (' + fb.length + ')');
    pruefe(await p.evaluate(() => !window.fbq), 'fbq nicht definiert');
    await p.close();
  }

  console.log('\nAlles akzeptieren');
  const { p, fb } = await seite(browser);
  await p.goto(BASIS + '/', { waitUntil: 'networkidle0' });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: 'networkidle0' });
  pruefe(fb.length === 0, 'vor der Entscheidung keine Anfrage an Facebook');
  await p.click('#consent-alle');
  await new Promise(r => setTimeout(r, 800));
  pruefe(await p.evaluate(() => localStorage.getItem('bhd-consent')) === 'alle', "Entscheidung 'alle' gespeichert");
  pruefe(fb.some(u => u.includes('fbevents.js')), 'fbevents.js angefragt');
  let ev = await ereignisse(p);
  pruefe(ev.some(a => a[0] === 'init' && a[1] === '1132077185894133'), 'init mit Pixel-ID');
  pruefe(ev.some(a => a[0] === 'track' && a[1] === 'PageView'), 'PageView gemeldet');
  pruefe(await p.evaluate(() => !!document.getElementById('consent').hidden), 'Leiste geschlossen');

  console.log('\nNeuladen + Kurzanfrage');
  await p.goto(BASIS + '/ratgeber/waermepumpe-stromverbrauch/', { waitUntil: 'networkidle0' });
  ev = await ereignisse(p);
  pruefe(ev.some(a => a[0] === 'init'), 'Pixel nach Neuladen wieder geladen');
  pruefe(await p.evaluate(() => !!document.getElementById('consent').hidden), 'Leiste bleibt weg');
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  const f = 'form.kf-form';
  await p.$eval(f, form => {
    form.querySelector('[name=name]').value = 'Test Pixel';
    form.querySelector('[name=telefon],[type=tel]').value = '030 1234567';
    form.querySelector('[name=plz]').value = '13359';
    form.querySelector('input[type=checkbox][required]').checked = true;
    form.requestSubmit();
  });
  await new Promise(r => setTimeout(r, 1500));
  ev = await ereignisse(p);
  const leads = ev.filter(a => a[0] === 'track' && a[1] === 'Lead');
  pruefe(leads.length === 1, "genau ein 'Lead' (ist: " + leads.length + ')');
  const inhalt = JSON.stringify(leads);
  pruefe(!/Test Pixel|1234567|13359/.test(inhalt), 'keine Formularinhalte im Ereignis');
  await p.close();

  await browser.close();
  console.log(fehler ? '\n' + fehler + ' Fehler.' : '\nMeta-Pixel verhaelt sich korrekt.');
  process.exit(fehler ? 1 : 0);
})();
