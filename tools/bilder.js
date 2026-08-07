/*
 * Bildvarianten erzeugen
 * ----------------------
 * Aufruf:  node tools/bilder.js
 *
 * 1) Logo: eine kleine Fassung (150 px) fuer Navigation und Footer. Bisher
 *    wurde dort die 560-px-Datei geladen und auf 75 px dargestellt.
 * 2) Referenzfotos: drei Breiten (400/800/1200) als WebP und als JPG-Rueckfall.
 *    Das Markup waehlt ueber srcset/sizes die passende Groesse – bisher kam
 *    auf dem Handy immer die 1050-px-Fassung an.
 *
 * Das Skript ist wiederholbar: vorhandene, aktuelle Dateien werden uebersprungen.
 * sharp steckt in den devDependencies und wird NICHT mit deployt (node_modules
 * steht in .gitignore) – die erzeugten Bilder dagegen schon.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REF = path.join(ROOT, 'assets', 'referenzen');
/* Die Referenzkarten sind selbst auf grossen Bildschirmen nur rund 340–380
 * CSS-Pixel breit. 400 deckt normale Displays ab, 800 die doppelte Aufloesung.
 * Eine 1200er-Stufe wuerde nie abgerufen und nur das Repository aufblaehen. */
const BREITEN = [400, 800];

let erzeugt = 0, uebersprungen = 0;

/* Nur neu erzeugen, wenn die Zieldatei fehlt oder aelter als die Quelle ist. */
function veraltet(quelle, ziel) {
  if (!fs.existsSync(ziel)) return true;
  return fs.statSync(ziel).mtimeMs < fs.statSync(quelle).mtimeMs;
}

async function logo() {
  const quelle = path.join(ROOT, 'assets', 'bhd-logo.png');
  /* Nur PNG: die WebP-Fassung dieses kleinen Logos war mit 8 KB groesser als
   * das palettierte PNG mit 5 KB – WebP lohnt sich hier also nicht. */
  const ziele = [
    { datei: path.join(ROOT, 'assets', 'bhd-logo-150.png'), fn: (p) => p.png({ compressionLevel: 9, palette: true }) }
  ];
  for (const z of ziele) {
    if (!veraltet(quelle, z.datei)) { uebersprungen++; continue; }
    await z.fn(sharp(quelle).resize({ width: 150 })).toFile(z.datei);
    erzeugt++;
    console.log('  ' + path.basename(z.datei).padEnd(34) + Math.round(fs.statSync(z.datei).size / 1024) + ' KB');
  }
}

async function referenzen() {
  if (!fs.existsSync(REF)) return;
  const quellen = fs.readdirSync(REF).filter(f => /\.jpg$/i.test(f)).sort();
  for (const f of quellen) {
    const quelle = path.join(REF, f);
    const basis = f.replace(/\.jpg$/i, '');
    const meta = await sharp(quelle).metadata();
    for (const b of BREITEN) {
      /* Kein Hochskalieren: Breiten oberhalb des Originals ueberspringen. */
      if (b > meta.width) { uebersprungen++; continue; }
      /* Nur WebP-Stufen. Als Rueckfall fuer die wenigen Browser ohne WebP
       * dient das unveraenderte Original-JPG, das ohnehin im Repository liegt.
       * Zusaetzliche JPG-Stufen wuerden rund 3 MB kosten und praktisch nie
       * abgerufen werden. */
      const zielWebp = path.join(REF, basis + '-' + b + '.webp');
      if (veraltet(quelle, zielWebp)) {
        await sharp(quelle).resize({ width: b }).webp({ quality: 72 }).toFile(zielWebp);
        erzeugt++;
      } else uebersprungen++;
    }
  }
  console.log('  ' + quellen.length + ' Referenzfotos in ' + BREITEN.join('/') + ' px');
}

(async () => {
  console.log('Logo:');
  await logo();
  console.log('Referenzfotos:');
  await referenzen();
  console.log('\nFertig. Erzeugt: ' + erzeugt + ', unveraendert: ' + uebersprungen);
})().catch(e => { console.error(e); process.exit(1); });
