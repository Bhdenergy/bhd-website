/*
 * Kleiner statischer Testserver fuer die Pruefwerkzeuge.
 * Aufruf:  node tools/server.js [port]      (Standard 8099)
 * Die Werkzeuge test-formulare / test-einwilligung / pruef-kollisionen
 * erwarten die Seite unter http://localhost:8099/.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.argv[2]) || 8099;

const TYPEN = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.woff2': 'font/woff2'
};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const datei = path.join(ROOT, p);
  if (!datei.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  fs.readFile(datei, (err, buf) => {
    if (err) {
      const vierNullVier = path.join(ROOT, '404.html');
      fs.readFile(vierNullVier, (e2, b2) => {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(e2 ? 'Nicht gefunden' : b2);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPEN[path.extname(datei).toLowerCase()] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(PORT, () => console.log('Testserver laeuft auf http://localhost:' + PORT + '/'));
