/* Sucht Fehler, die man im Browser nicht sofort sieht:
 *
 *  1. CSS-Selektoren, bei denen eine zweite Regel position:fixed/absolute
 *     nachtraegt. Genau so entstand der .consent-Bug: die Einwilligungs-
 *     leiste hiess wie die Checkbox-Zeile der Formulare und riss sie aus
 *     dem Textfluss. Bewusst eng gefasst - das blosse Aufteilen einer
 *     Komponente auf mehrere Regeln ist normal und wird nicht gemeldet.
 *  2. Doppelt vergebene id-Attribute (getElementById trifft dann das
 *     falsche Element).
 *  3. Interne Links und referenzierte Dateien, die ins Leere zeigen.
 *  4. JavaScript-Fehler und fehlgeschlagene Anfragen auf jeder Seite.
 *
 *   node tools/pruef-kollisionen.js          (4 braucht Server auf 8099)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASIS = process.env.BASIS || 'http://localhost:8099';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
let befunde = 0;

function htmlDateien(dir, treffer) {
  treffer = treffer || [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'src', 'tools'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) htmlDateien(p, treffer);
    else if (e.name.endsWith('.html')) treffer.push(p);
  }
  return treffer;
}

/* Entfernt @media- und @keyframes-Bloecke samt Inhalt. In beiden sind
 * Wiederholungen desselben Selektors voellig normal. */
function ohneAtRegeln(css) {
  let out = '';
  for (let i = 0; i < css.length; i++) {
    if (css.startsWith('@media', i) || css.startsWith('@keyframes', i) || css.startsWith('@supports', i)) {
      let tiefe = 0, j = i;
      while (j < css.length) {
        if (css[j] === '{') tiefe++;
        else if (css[j] === '}') { tiefe--; if (tiefe === 0) { j++; break; } }
        j++;
      }
      i = j - 1;
      continue;
    }
    out += css[i];
  }
  return out;
}

/* ---------- 1) CSS ---------------------------------------------------- */
console.log('1) CSS: zweite Regel reisst ein Element aus dem Textfluss\n');

const css = ohneAtRegeln(fs.readFileSync(path.join(ROOT, 'assets/site.css'), 'utf8'));
const regeln = new Map();
let m;
const RE = /([^{}]+)\{([^{}]*)\}/g;
while ((m = RE.exec(css))) {
  const eig = {};
  for (const d of m[2].split(';')) {
    const k = d.indexOf(':');
    if (k > 0) eig[d.slice(0, k).trim()] = d.slice(k + 1).trim();
  }
  for (let sel of m[1].split(',')) {
    sel = sel.trim().replace(/\s+/g, ' ');
    if (!sel || sel.startsWith('@')) continue;
    if (!regeln.has(sel)) regeln.set(sel, []);
    regeln.get(sel).push(eig);
  }
}

let cssBefunde = 0;
for (const [sel, vorkommen] of regeln) {
  if (vorkommen.length < 2) continue;
  const mitPos = vorkommen.filter(v => ['fixed', 'absolute', 'sticky'].includes(v.position));
  const ohnePos = vorkommen.filter(v => !v.position);
  if (mitPos.length && ohnePos.length) {
    cssBefunde++; befunde++;
    console.log('   [!] ' + sel + ' ist ' + vorkommen.length + 'x definiert; eine Regel setzt position:' +
      mitPos[0].position + ', eine andere gar keine Position.');
  }
}
if (!cssBefunde) console.log('   keine solche Kollision');

/* ---------- 2) Doppelte IDs ------------------------------------------- */
console.log('\n2) Doppelt vergebene id-Attribute\n');

const seiten = htmlDateien(ROOT);
let idBefunde = 0;
for (const datei of seiten) {
  const html = fs.readFileSync(datei, 'utf8');
  const zaehler = new Map();
  for (const t of html.matchAll(/\sid="([^"]+)"/g)) {
    zaehler.set(t[1], (zaehler.get(t[1]) || 0) + 1);
  }
  const doppelt = [...zaehler].filter(([, n]) => n > 1);
  if (doppelt.length) {
    idBefunde++; befunde++;
    console.log('   [!] ' + path.relative(ROOT, datei).replace(/\\/g, '/') + ': ' +
      doppelt.map(([id, n]) => id + ' (' + n + 'x)').join(', '));
  }
}
if (!idBefunde) console.log('   keine doppelten IDs auf ' + seiten.length + ' Seiten');

/* ---------- 3) Links und Dateien -------------------------------------- */
console.log('\n3) Interne Links und referenzierte Dateien\n');

function existiert(ziel) {
  const p = path.join(ROOT, ziel.replace(/^\//, '').split('#')[0].split('?')[0]);
  if (!fs.existsSync(p)) return false;
  return fs.statSync(p).isDirectory() ? fs.existsSync(path.join(p, 'index.html')) : true;
}

const fehlend = new Map();
for (const datei of seiten) {
  const html = fs.readFileSync(datei, 'utf8');
  const rel = path.relative(ROOT, datei).replace(/\\/g, '/');
  for (const t of html.matchAll(/(?:href|src|srcset)="(\/[^"]+)"/g)) {
    for (let ziel of t[1].split(',')) {
      ziel = ziel.trim().split(' ')[0];
      if (!ziel.startsWith('/') || ziel.startsWith('//')) continue;
      if (!existiert(ziel)) {
        if (!fehlend.has(ziel)) fehlend.set(ziel, []);
        fehlend.get(ziel).push(rel);
      }
    }
  }
}
if (!fehlend.size) console.log('   alle Ziele vorhanden');
for (const [ziel, wo] of fehlend) {
  befunde++;
  console.log('   [!] fehlt: ' + ziel + '  (z. B. in ' + wo[0] + ')');
}

/* ---------- 4) Laufzeitfehler ----------------------------------------- */
(async () => {
  console.log('\n4) JavaScript-Fehler und fehlgeschlagene Anfragen\n');
  let puppeteer;
  try { puppeteer = require('puppeteer-core'); }
  catch (e) { console.log('   uebersprungen (puppeteer-core fehlt)'); return abschluss(); }

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu']
  });

  let laufzeit = 0;
  for (const datei of seiten) {
    const rel = path.relative(ROOT, datei).replace(/\\/g, '/');
    if (rel === '404.html') continue;
    const url = BASIS + '/' + rel.replace(/index\.html$/, '');
    const page = await browser.newPage();
    const probleme = [];
    page.on('pageerror', e => probleme.push('JS-Fehler: ' + e.message));
    page.on('console', msg => { if (msg.type() === 'error') probleme.push('Konsole: ' + msg.text()); });
    page.on('requestfailed', r => probleme.push('Anfrage fehlgeschlagen: ' + r.url()));
    page.on('response', r => { if (r.status() >= 400) probleme.push('HTTP ' + r.status() + ': ' + r.url()); });
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    } catch (e) { probleme.push('Seite nicht ladbar: ' + e.message); }
    await page.close();
    if (probleme.length) {
      laufzeit++; befunde++;
      console.log('   [!] ' + url);
      [...new Set(probleme)].forEach(p => console.log('       - ' + p));
    }
  }
  await browser.close();
  if (!laufzeit) console.log('   keine Fehler auf ' + (seiten.length - 1) + ' Seiten');
  abschluss();
})();

function abschluss() {
  console.log('\n' + (befunde ? befunde + ' Befund(e).' : 'Keine Befunde.'));
  process.exit(befunde ? 1 : 0);
}
