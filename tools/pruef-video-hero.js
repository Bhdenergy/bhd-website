/**
 * Prueft das Verhalten des Video-Heros auf der Startseite.
 *
 * Deckt ab, was die uebrigen Werkzeuge nicht sehen:
 *  - laedt der Desktop die grosse und das Handy die kleine Fassung?
 *  - spielt das Video ueberhaupt und wird es eingeblendet?
 *  - bleibt es bei "Bewegung reduzieren" komplett aus (nur Standbild)?
 *  - stimmt die Laenge, also ist wirklich der aktuelle Schnitt ausgeliefert?
 *
 * Aufruf:  node tools/pruef-video-hero.js [http://localhost:8099/]
 */

const puppeteer = require('puppeteer-core');

const CHROME = process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ZIEL = process.argv[2] || 'http://localhost:8099/';

/* Bei neuem Schnitt oder neuen Dateinamen hier mitziehen.
 * Drei Fassungen seit 27.08.2026: auf dem PC liegt das Video full-bleed hinter
 * dem Hero und wurde vorher aus 1280 px auf 1920 px hochgezogen. */
const ERWARTET = {
  gross: 'dachfilm3-1920.mp4',   // ab 1400 px Anzeigebreite (mal Pixeldichte)
  mittel: 'dachfilm3-1280.mp4',  // 1025 bis 1399 px
  klein: 'dachfilm3-854.mp4',    // Handy-Band unter 1025 px
  dauer: 10.4,      // zwei Ausschnitte, per Kreuzblende verbunden
  toleranz: 0.3
};

function pruef(name, ok, ist) {
  console.log('   [' + (ok ? 'ok' : '!!') + ']  ' + name + (ist === undefined ? '' : '  (ist: ' + ist + ')'));
  if (!ok) process.exitCode = 1;
}

async function zustand(browser, breite, hoehe, reduce) {
  const page = await browser.newPage();
  await page.setViewport({ width: breite, height: hoehe });
  if (reduce) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(ZIEL, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));
  const z = await page.evaluate(() => {
    const v = document.querySelector('.hero-vid');
    const s = document.querySelector('.hero-still');
    if (!v) return null;
    return {
      quelle: (v.currentSrc || v.getAttribute('src') || '').replace(/.*\//, ''),
      laeuft: v.classList.contains('laeuft'),
      zeit: Math.round(v.currentTime * 10) / 10,
      pausiert: v.paused,
      schleife: v.loop,
      stumm: v.muted,
      dauer: isNaN(v.duration) ? 0 : Math.round(v.duration * 10) / 10,
      stillDa: !!s && s.naturalWidth > 0,
      stillQuelle: s ? (s.currentSrc || '').replace(/.*\//, '') : '',
      hoehe: Math.round(v.getBoundingClientRect().height)
    };
  });
  await page.close();
  return z;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--autoplay-policy=no-user-gesture-required', '--disable-gpu']
  });

  console.log('Video-Hero gegen ' + ZIEL + '\n');

  console.log('1) Desktop (1440 breit)');
  const d = await zustand(browser, 1440, 900, false);
  pruef('Video-Element vorhanden', !!d);
  if (d) {
    pruef('grosse Fassung geladen', d.quelle === ERWARTET.gross, d.quelle);
    pruef('Standbild geladen', d.stillDa, d.stillQuelle);
    pruef('Video spielt', !d.pausiert && d.zeit > 0, 'Sekunde ' + d.zeit);
    pruef('eingeblendet (Klasse laeuft)', d.laeuft);
    pruef('Endlosschleife', d.schleife);
    pruef('ohne Ton', d.stumm);
    pruef('Laenge ' + ERWARTET.dauer + ' s', Math.abs(d.dauer - ERWARTET.dauer) < ERWARTET.toleranz, d.dauer + ' s');
    pruef('deckt den Hero (> 400 px hoch)', d.hoehe > 400, d.hoehe + ' px');
  }

  console.log('\n2) Handy (390 breit)');
  const m = await zustand(browser, 390, 780, false);
  if (m) {
    pruef('kleine Fassung geladen', m.quelle === ERWARTET.klein, m.quelle);
    pruef('kleines Standbild geladen', /-854\.webp$/.test(m.stillQuelle), m.stillQuelle);
    pruef('Video spielt', !m.pausiert && m.zeit > 0, 'Sekunde ' + m.zeit);
  }

  console.log('\n3) Schmaler PC (1280 breit)');
  const s = await zustand(browser, 1280, 860, false);
  if (s) {
    pruef('mittlere Fassung geladen', s.quelle === ERWARTET.mittel, s.quelle);
    pruef('Video spielt', !s.pausiert && s.zeit > 0, 'Sekunde ' + s.zeit);
  }

  console.log('\n4) Bewegung reduzieren');
  const r = await zustand(browser, 1440, 900, true);
  if (r) {
    pruef('kein Video geladen', r.quelle === '', r.quelle || 'keine Quelle');
    pruef('Standbild steht trotzdem', r.stillDa, r.stillQuelle);
  }

  await browser.close();
  console.log('\n' + (process.exitCode ? 'Befunde vorhanden.' : 'Video-Hero verhaelt sich wie geplant.'));
})();
