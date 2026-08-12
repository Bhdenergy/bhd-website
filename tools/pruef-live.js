/*
 * Live-Audit
 * ----------
 *   node tools/pruef-live.js [basis-url]      (Standard: https://bhd-energie.de)
 *
 * Geht jede Seite aus der Sitemap durch und sucht nach Fehlern, die man
 * beim Draufschauen nicht sieht. Sendet nichts ab - es werden keine
 * Formulare ausgeloest und keine Mails erzeugt.
 */
const puppeteer = require('puppeteer-core');
const https = require('https');
const http = require('http');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASIS = (process.argv[2] || 'https://bhd-energie.de').replace(/\/$/, '');
const befunde = [];
function melde(schwere, text) { befunde.push({ schwere, text }); }

function hole(url, folgen) {
  return new Promise(ok => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'BHD-Audit' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => ok({ code: res.statusCode, kopf: res.headers, html: d }));
    }).on('error', e => ok({ code: 0, kopf: {}, html: '', fehler: e.message }));
  });
}

(async () => {
  console.log('Live-Audit gegen ' + BASIS + '\n');

  /* ---------- Sitemap einlesen ---------- */
  const sm = await hole(BASIS + '/sitemap.xml');
  const urls = [...sm.html.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  console.log('Sitemap: HTTP ' + sm.code + ', ' + urls.length + ' Adressen\n');
  if (!urls.length) { melde('schwer', 'Sitemap leer oder nicht lesbar'); }

  /* ---------- Weiterleitungen ---------- */
  console.log('Weiterleitungen');
  const wl = [
    ['http://bhd-energie.de/', 'http -> https'],
    ['https://www.bhd-energie.de/', 'www -> ohne www']
  ];
  for (const [u, name] of wl) {
    const r = await hole(u);
    const ziel = r.kopf.location || '';
    const gut = (r.code === 301 || r.code === 308) && ziel.startsWith('https://bhd-energie.de');
    console.log('  ' + (name + '                ').slice(0, 20) + r.code + ' -> ' + (ziel || '(keine)'));
    if (!gut) melde('mittel', name + ' leitet nicht in einem Schritt auf die Hauptadresse (' + r.code + ')');
  }

  /* ---------- Kopfzeilen ---------- */
  const start = await hole(BASIS + '/');
  console.log('\nSicherheits-Kopfzeilen');
  for (const h of ['strict-transport-security', 'x-content-type-options', 'referrer-policy',
                   'x-frame-options', 'content-security-policy']) {
    const da = !!start.kopf[h];
    console.log('  ' + (h + '                          ').slice(0, 28) + (da ? 'gesetzt' : 'FEHLT'));
    if (!da) melde('gering', 'Kopfzeile ' + h + ' fehlt');
  }
  const asset = await hole(BASIS + '/assets/site.css');
  const cache = asset.kopf['cache-control'] || '';
  console.log('  assets Cache-Control        ' + (cache || '(keine)'));
  if (!/max-age=\d{5,}/.test(cache)) melde('mittel', 'Assets werden nicht langfristig zwischengespeichert: ' + cache);

  /* ---------- Seiten im Browser ---------- */
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu']
  });

  const titel = new Map(), beschreibung = new Map();
  const formulare = [];

  console.log('\nSeiten (' + urls.length + ')');
  for (const url of urls) {
    const page = await browser.newPage();
    const probleme = [];
    page.on('pageerror', e => probleme.push('JS-Fehler: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') probleme.push('Konsole: ' + m.text()); });
    page.on('requestfailed', r => probleme.push('Anfrage fehlgeschlagen: ' + r.url()));
    page.on('response', r => { if (r.status() >= 400) probleme.push('HTTP ' + r.status() + ': ' + r.url()); });

    let antwort;
    try { antwort = await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 }); }
    catch (e) { melde('schwer', url + ' laedt nicht: ' + e.message); await page.close(); continue; }

    const d = await page.evaluate(() => {
      const meta = n => (document.querySelector('meta[name="' + n + '"]') || {}).content || '';
      /* Nur ein FEHLENDES alt-Attribut ist ein Fehler. alt="" ist die
       * korrekte Auszeichnung fuer schmueckende Bilder - etwa die
       * verdoppelten Marken-Logos der Laufschrift, deren Container
       * aria-hidden traegt. */
      const bilderOhneAlt = [...document.images]
        .filter(i => !i.hasAttribute('alt'))
        .map(i => i.currentSrc || i.src);
      const ldFehler = [];
      document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
        try { JSON.parse(s.textContent); } catch (e) { ldFehler.push(e.message); }
      });
      const leereLinks = [...document.querySelectorAll('a')]
        .filter(a => !a.getAttribute('href') && !a.hasAttribute('data-scrollto') && !a.hasAttribute('data-go-funnel'))
        .map(a => (a.textContent || '').trim().slice(0, 30));
      /* Wichtig: f.action liefert die Seiten-URL, wenn gar kein
       * action-Attribut gesetzt ist. Solche Formulare senden per
       * JavaScript (sendLead) - das Ziel steht dann in site.js, nicht
       * im Markup. Beides getrennt ausweisen, sonst gibt es Fehlalarm. */
      const forms = [...document.forms].map(f => ({
        id: f.id,
        action: f.hasAttribute('action') ? f.action : '',
        perSkript: !f.hasAttribute('action'),
        methode: f.method,
        enctype: f.enctype,
        next: (f.querySelector('[name="_next"]') || {}).value || '',
        pflicht: f.querySelectorAll('[required]').length
      }));
      return {
        titel: document.title,
        beschreibung: meta('description'),
        robots: meta('robots'),
        canonical: (document.querySelector('link[rel=canonical]') || {}).href || '',
        h1: [...document.querySelectorAll('h1')].map(h => h.textContent.trim()),
        main: !!document.querySelector('main'),
        lang: document.documentElement.lang,
        bilderOhneAlt, ldFehler, leereLinks, forms,
        breite: document.documentElement.scrollWidth,
        fenster: window.innerWidth
      };
    });

    const pfad = url.replace(BASIS, '') || '/';
    const status = antwort ? antwort.status() : 0;
    if (status !== 200) melde('schwer', pfad + ' antwortet mit HTTP ' + status);
    if (!d.titel) melde('schwer', pfad + ' hat keinen Titel');
    if (!d.beschreibung) melde('mittel', pfad + ' hat keine Meta-Description');
    if (d.canonical !== url) melde('mittel', pfad + ' Canonical zeigt auf ' + d.canonical);
    if (d.h1.length !== 1) melde('mittel', pfad + ' hat ' + d.h1.length + ' H1-Überschriften');
    if (!d.main) melde('gering', pfad + ' hat kein <main>');
    if (d.lang !== 'de') melde('gering', pfad + ' lang="' + d.lang + '"');
    if (d.ldFehler.length) melde('schwer', pfad + ' ungueltiges JSON-LD: ' + d.ldFehler[0]);
    if (d.bilderOhneAlt.length) melde('mittel', pfad + ': ' + d.bilderOhneAlt.length + ' Bild(er) ohne Alt-Text');
    if (d.leereLinks.length) melde('mittel', pfad + ': ' + d.leereLinks.length + ' Link(s) ohne Ziel ("' + d.leereLinks[0] + '")');
    if (d.breite > d.fenster + 1) melde('mittel', pfad + ' laeuft horizontal ueber (' + d.breite + ' > ' + d.fenster + ')');
    probleme.forEach(p => melde('schwer', pfad + ': ' + p));

    if (titel.has(d.titel)) melde('mittel', 'Titel doppelt: "' + d.titel + '" auf ' + pfad + ' und ' + titel.get(d.titel));
    else titel.set(d.titel, pfad);
    if (d.beschreibung) {
      if (beschreibung.has(d.beschreibung)) melde('mittel', 'Description doppelt auf ' + pfad + ' und ' + beschreibung.get(d.beschreibung));
      else beschreibung.set(d.beschreibung, pfad);
    }
    d.forms.forEach(f => formulare.push({ pfad, ...f }));

    console.log('  ' + (pfad + '                            ').slice(0, 30) +
      'HTTP ' + status + (probleme.length ? '  ' + probleme.length + ' Laufzeitfehler' : ''));
    await page.close();
  }

  /* ---------- 404 ---------- */
  const vierNullVier = await hole(BASIS + '/gibt-es-nicht-xyz/');
  console.log('\nNicht vorhandene Adresse: HTTP ' + vierNullVier.code);
  if (vierNullVier.code !== 404) melde('mittel', 'Unbekannte Adressen antworten mit ' + vierNullVier.code + ' statt 404');

  await browser.close();

  /* ---------- Formularuebersicht ---------- */
  /* Ziel der per JavaScript sendenden Formulare steht in site.js. */
  const skript = await hole(BASIS + '/assets/site.js');
  const zieleImSkript = [...new Set([...skript.html.matchAll(/formsubmit\.co\/([^'"\\\s]+)/g)].map(m => m[1]))];
  console.log('\nEmpfaenger im Skript (sendLead): ' + (zieleImSkript.join(', ') || '(keiner gefunden)'));
  if (zieleImSkript.length !== 1 || zieleImSkript[0] !== 'ajax/info@bhd-energie.de') {
    if (!zieleImSkript.some(z => z.includes('info@bhd-energie.de'))) {
      melde('schwer', 'sendLead() sendet nicht an info@bhd-energie.de, sondern an: ' + zieleImSkript.join(', '));
    }
  }

  console.log('\nFormulare und Empfaenger');
  for (const f of formulare) {
    const empf = f.perSkript
      ? 'per JavaScript (sendLead)'
      : ((f.action.match(/formsubmit\.co\/(.+)$/) || [])[1] || f.action);
    console.log('  ' + (f.pfad + '                    ').slice(0, 26) +
      (f.id + '                  ').slice(0, 18) + '-> ' + empf +
      '  [' + f.pflicht + ' Pflichtfelder]');
    if (!f.perSkript && !/formsubmit\.co\/info@bhd-energie\.de/.test(f.action)) {
      melde('schwer', f.pfad + ' Formular ' + f.id + ' sendet an ' + empf);
    }
    if (f.next && !f.next.startsWith(BASIS)) {
      melde('mittel', f.pfad + ' _next zeigt auf fremde Adresse: ' + f.next);
    }
  }

  /* ---------- Ergebnis ---------- */
  console.log('\n' + '='.repeat(60));
  if (!befunde.length) { console.log('Keine Befunde.'); process.exit(0); }
  for (const stufe of ['schwer', 'mittel', 'gering']) {
    const liste = befunde.filter(b => b.schwere === stufe);
    if (!liste.length) continue;
    console.log('\n' + stufe.toUpperCase() + ' (' + liste.length + ')');
    liste.forEach(b => console.log('  - ' + b.text));
  }
  process.exit(befunde.some(b => b.schwere === 'schwer') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
