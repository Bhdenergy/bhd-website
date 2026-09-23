/*
 * Meldet alle Adressen aus sitemap.xml per IndexNow an Bing (und damit an
 * Copilot und ChatGPT Search, die den Bing-Index nutzen).
 *
 * Aufruf:  node tools/indexnow.js            (alle Adressen der Sitemap)
 *          node tools/indexnow.js /a/ /b/    (nur diese Pfade)
 *
 * Der Schluessel steht in build.js als INDEXNOW_KEY und liegt als Datei
 * <schluessel>.txt im Wurzelverzeichnis - ohne die erreichbare Datei lehnt
 * der Dienst die Meldung ab (HTTP 403).
 * Erfolg ist HTTP 200 oder 202. 202 heisst "angenommen, Schluessel wird
 * noch geprueft" und ist der Normalfall.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://bhd-energie.de';
const HOST = 'bhd-energie.de';
const KEY = 'bhd7f3a1c94e26d508b1a2f6c3e9740b';

let urls;
if (process.argv.length > 2) {
  urls = process.argv.slice(2).map(p => SITE + (p.startsWith('/') ? p : '/' + p));
} else {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(m => m[1])
    .filter(u => !/\.(jpg|jpeg|png|webp)$/i.test(u));
  urls = [...new Set(urls)];
}

const nutzlast = JSON.stringify({
  host: HOST,
  key: KEY,
  keyLocation: SITE + '/' + KEY + '.txt',
  urlList: urls
});

console.log('Melde ' + urls.length + ' Adressen an IndexNow ...');
urls.forEach(u => console.log('  ' + u.replace(SITE, '')));

const req = https.request({
  hostname: 'api.indexnow.org', path: '/indexnow', method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(nutzlast) }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const gut = res.statusCode === 200 || res.statusCode === 202;
    console.log('\nAntwort: HTTP ' + res.statusCode + (body ? ' – ' + body.trim() : ''));
    console.log(gut ? 'Angenommen.' : 'NICHT angenommen – Schluesseldatei und Host pruefen.');
    process.exit(gut ? 0 : 1);
  });
});
req.on('error', e => { console.error('Fehler: ' + e.message); process.exit(1); });
req.write(nutzlast);
req.end();
