/**
 * Prueft die Lesbarkeit im Anfrage-Kasten auf dem Video-Hero der Startseite.
 *
 * Warum ein eigenes Werkzeug: Der Kasten ist durchscheinend, sein Hintergrund
 * haengt also davon ab, welches Bild gerade hinter ihm laeuft. Lighthouse und
 * axe lesen nur die deklarierte CSS-Farbe und sehen weiterhin "weisser Grund"
 * -- sie wuerden den Fall gar nicht bemerken.
 *
 * Vorgehen: Video an mehreren Stellen anhalten (auch mitten in den Blenden,
 * wo der Grund fast schwarz ist), Seite abfotografieren, fuer jedes Textelement
 * den TATSAECHLICH gerenderten Hintergrund aus den Pixeln bestimmen
 * (haeufigster Farbwert im Elementbereich = Grund, die Schrift ist immer in
 * der Minderheit) und daraus den Kontrast rechnen. Geprueft wird der erste
 * Schritt des Funnels und der letzte, in dem getippt wird.
 *
 * Aufruf:  node tools/pruef-kontrast-hero.js [http://localhost:8099/]
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const sharp = require('sharp');

const CHROME = process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ZIEL = process.argv[2] || 'http://localhost:8099/';
const SCHNAPPSCHUSS = path.join(__dirname, '..', '.kontrast-tmp.png');

// Auch die dunkelsten Momente pruefen: 0,2 / 6,5 / 9,5 / 13,4 s liegen in den
// Blenden, dort ist der Grund fast schwarz und der Kasten am durchsichtigsten.
const ZEITEN = [0.2, 2.5, 4.0, 5.7, 6.5, 8.5, 9.5, 11.0, 13.4];

function linear(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function leuchtdichte(r, g, b) {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}
function kontrast(a, b) {
  const l1 = leuchtdichte(...a), l2 = leuchtdichte(...b);
  const [h, d] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (h + 0.05) / (d + 0.05);
}
function farbeAusCss(s) {
  const m = s.match(/(\d+(?:\.\d+)?)/g);
  return m ? [+m[0], +m[1], +m[2]] : null;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--autoplay-policy=no-user-gesture-required', '--disable-gpu',
           '--force-device-scale-factor=1']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });
  await page.goto(ZIEL, { waitUntil: 'networkidle2' });

  // Einwilligungsleiste weg, sie ueberdeckt sonst den unteren Kastenrand
  await page.evaluate(() => { const b = document.querySelector('#consent button'); if (b) b.click(); });
  await new Promise(r => setTimeout(r, 800));

  if (!await page.evaluate(() => !!document.querySelector('.hero-vid'))) {
    console.log('Kein Video-Hero gefunden.');
    await browser.close();
    return;
  }

  const elementeSammeln = () => page.evaluate(() => {
    const kasten = document.querySelector('.hero-video .funnel');
    if (!kasten) return [];
    const raus = [];
    kasten.querySelectorAll('*').forEach(el => {
      if (el.offsetParent === null) return;
      const eigenerText = Array.from(el.childNodes)
        .filter(n => n.nodeType === 3 && n.textContent.trim())
        .map(n => n.textContent.trim()).join(' ');
      // Platzhalter zaehlen wie Text: sie stehen im leeren Feld
      const platzhalter = el.getAttribute && el.getAttribute('placeholder');
      const text = eigenerText || (platzhalter ? '[Platzhalter] ' + platzhalter : '');
      if (!text) return;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      if (r.top < 0 || r.bottom > innerHeight) return;
      raus.push({
        text: text.slice(0, 46),
        farbe: platzhalter && !eigenerText
          ? getComputedStyle(el, '::placeholder').color || s.color
          : s.color,
        groesse: parseFloat(s.fontSize),
        fett: (parseInt(s.fontWeight, 10) || 400) >= 700,
        x: Math.round(r.x), y: Math.round(r.y),
        w: Math.round(r.width), h: Math.round(r.height)
      });
    });
    return raus;
  });

  async function messen(elemente, sammlung) {
    for (const t of ZEITEN) {
      await page.evaluate((zeit) => {
        const v = document.querySelector('.hero-vid');
        v.pause();
        v.currentTime = zeit;
      }, t);
      await new Promise(r => setTimeout(r, 450));
      await page.screenshot({ path: SCHNAPPSCHUSS });

      const { data, info } = await sharp(SCHNAPPSCHUSS).raw()
        .toBuffer({ resolveWithObject: true });

      for (const el of elemente) {
        const zaehler = new Map();
        for (let y = el.y; y < el.y + el.h; y++) {
          if (y < 0 || y >= info.height) continue;
          for (let x = el.x; x < el.x + el.w; x++) {
            if (x < 0 || x >= info.width) continue;
            const i = (y * info.width + x) * info.channels;
            const k = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
            zaehler.set(k, (zaehler.get(k) || 0) + 1);
          }
        }
        if (!zaehler.size) continue;
        let bestK = 0, bestN = -1;
        for (const [k, n] of zaehler) if (n > bestN) { bestN = n; bestK = k; }
        const grund = [((bestK >> 10) & 31) << 3, ((bestK >> 5) & 31) << 3, (bestK & 31) << 3];

        const vorne = farbeAusCss(el.farbe);
        if (!vorne) continue;
        const k = kontrast(vorne, grund);
        const gross = el.groesse >= 24 || (el.fett && el.groesse >= 18.66);
        const noetig = gross ? 3 : 4.5;

        const vorher = sammlung.get(el.text);
        if (!vorher || k < vorher.k) sammlung.set(el.text, { k, noetig, t, grund, vorne });
      }
    }
  }

  async function weiterKlicken() {
    // Schritt 1-3: jeweils die erste Auswahl, Schritt 4: PLZ eintragen
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        const s = document.querySelector('.step.active');
        const b = s && s.querySelector('.choice');
        if (b) b.click();
      });
      await new Promise(r => setTimeout(r, 450));
    }
    await page.type('#plz', '13359');
    await page.evaluate(() => {
      const b = document.querySelector('.step.active [data-next-valid]');
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 600));
    return page.evaluate(() => {
      const s = document.querySelector('.step.active');
      return s ? s.dataset.step : null;
    });
  }

  const gesamt = [];
  let befunde = 0;

  const ersteElemente = await elementeSammeln();
  const ersteWerte = new Map();
  await messen(ersteElemente, ersteWerte);
  gesamt.push(['Schritt 1 von 5', ersteWerte]);

  const gelandet = await weiterKlicken();
  if (gelandet === '4') {
    const letzteElemente = await elementeSammeln();
    const letzteWerte = new Map();
    await messen(letzteElemente, letzteWerte);
    gesamt.push(['Schritt 5 von 5 (Kontaktdaten)', letzteWerte]);
  } else {
    console.log('WARNUNG: letzter Funnel-Schritt nicht erreicht (bei Schritt ' + gelandet + ').');
    process.exitCode = 1;
  }

  console.log('Kontrast im Anfrage-Kasten auf dem Video');
  console.log('(schlechtester Wert je Text ueber ' + ZEITEN.length + ' Zeitpunkte)\n');

  for (const [titel, werte] of gesamt) {
    console.log(titel);
    for (const [text, w] of werte) {
      const ok = w.k >= w.noetig;
      if (!ok) befunde++;
      console.log('   [' + (ok ? 'ok' : '!!') + ']  ' + w.k.toFixed(2) + ':1 / ' + w.noetig +
        '   bei Sek. ' + w.t + '   "' + text + '"' +
        (ok ? '' : '\n          rgb(' + w.vorne.join(',') + ') auf rgb(' + w.grund.join(',') + ')'));
    }
    console.log('');
  }

  await browser.close();
  try { fs.unlinkSync(SCHNAPPSCHUSS); } catch (e) {}

  console.log(befunde ? befunde + ' Befund(e) - der Kasten ist zu durchsichtig.' : 'Alles lesbar.');
  if (befunde) process.exitCode = 1;
})();
