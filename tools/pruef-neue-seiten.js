/*
 * Schnellpruefung der neu hinzugekommenen Seiten.
 * Aufruf:  node tools/pruef-neue-seiten.js            (Server auf 8099 noetig)
 *
 * Prueft je Seite: horizontaler Ueberlauf bei 390 px und 1440 px,
 * Gueltigkeit aller JSON-LD-Bloecke, genau eine H1, vorhandenes <main>,
 * Titel-/Description-Laenge und dass kein Platzhalter stehen geblieben ist.
 */
const puppeteer = require('puppeteer-core');

const BASIS = process.argv[2] || 'http://localhost:8099';
const SEITEN = [
  '/photovoltaik-waermepumpe-brandenburg/',
  '/waermepumpe-foerderung-2027/',
  '/photovoltaik-anmelden-marktstammdatenregister/',
  '/'
];
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

let fehler = 0;
const ok = (t) => console.log('   [ok]  ' + t);
const bad = (t) => { fehler++; console.log('   [FEHLER] ' + t); };

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  for (const pfad of SEITEN) {
    console.log('\n' + pfad);
    const page = await browser.newPage();
    await page.goto(BASIS + pfad, { waitUntil: 'networkidle2' });

    for (const [breite, hoehe] of [[390, 844], [1440, 900]]) {
      await page.setViewport({ width: breite, height: hoehe, deviceScaleFactor: 1, isMobile: breite < 500 });
      await new Promise(r => setTimeout(r, 350));
      const ueber = await page.evaluate(() => {
        const d = document.documentElement;
        const breit = [];
        document.querySelectorAll('body *').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > d.clientWidth + 1.5) {
            const stil = getComputedStyle(el);
            // Behaelter, die waagerecht scrollen ODER abschneiden, duerfen
            // breiteren Inhalt haben - z. B. die Marken-Laufschrift (.marquee
            // hat overflow:hidden). Sonst meldet der Pruefer Fehlalarme.
            let p = el.parentElement, gekapselt = false;
            while (p) { if (/auto|scroll|hidden|clip/.test(getComputedStyle(p).overflowX)) { gekapselt = true; break; } p = p.parentElement; }
            if (!gekapselt && !/auto|scroll|hidden|clip/.test(stil.overflowX)) {
              breit.push(el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0] + ' (' + Math.round(r.right) + 'px)');
            }
          }
        });
        return { scrollbar: d.scrollWidth > d.clientWidth + 1, breit: breit.slice(0, 4) };
      });
      if (ueber.scrollbar || ueber.breit.length) bad(breite + ' px: waagerechter Ueberlauf – ' + (ueber.breit.join(', ') || 'Seite scrollt seitlich'));
      else ok(breite + ' px: kein waagerechter Ueberlauf');
    }

    const befund = await page.evaluate(() => {
      const bloecke = [...document.querySelectorAll('script[type="application/ld+json"]')];
      const kaputt = [];
      bloecke.forEach((b, i) => { try { JSON.parse(b.textContent); } catch (e) { kaputt.push(i + ': ' + e.message); } });
      return {
        ld: bloecke.length, kaputt,
        h1: document.querySelectorAll('h1').length,
        main: !!document.querySelector('main'),
        titel: document.title,
        desc: (document.querySelector('meta[name="description"]') || {}).content || '',
        platzhalter: /\{\{|\[bitte ergänzen\]|TODO|LOREM/i.test(document.body.innerText),
        faq: document.querySelectorAll('[data-faq] .faq-item').length,
        links: document.querySelectorAll('a[href]:not([href="#"]):not([href^="javascript"])').length
      };
    });
    befund.kaputt.length ? bad('JSON-LD ungueltig: ' + befund.kaputt.join(' | ')) : ok(befund.ld + ' JSON-LD-Bloecke, alle gueltig');
    befund.h1 === 1 ? ok('genau eine H1') : bad(befund.h1 + ' H1-Elemente');
    befund.main ? ok('<main> vorhanden') : bad('<main> fehlt');
    befund.titel.length <= 65 ? ok('Titel ' + befund.titel.length + ' Zeichen') : bad('Titel zu lang (' + befund.titel.length + '): ' + befund.titel);
    befund.desc.length >= 80 && befund.desc.length <= 175
      ? ok('Description ' + befund.desc.length + ' Zeichen')
      : bad('Description ' + befund.desc.length + ' Zeichen (Ziel 80–175)');
    befund.platzhalter ? bad('Platzhaltertext im sichtbaren Inhalt') : ok('keine Platzhalter');
    if (befund.faq) ok(befund.faq + ' FAQ-Eintraege');
    ok(befund.links + ' Links mit Ziel');

    await page.close();
  }
  await browser.close();
  console.log(fehler ? '\n' + fehler + ' Befund(e).' : '\nKeine Befunde.');
  process.exit(fehler ? 1 : 0);
})();
