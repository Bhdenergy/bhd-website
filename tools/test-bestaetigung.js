/*
 * Prueft die Serverfunktion api/bestaetigung.js ohne echten Mailversand
 * (nodemailer wird durch eine Attrappe ersetzt).  Aufruf: node tools/test-bestaetigung.js
 */
const path = require('path');
const nm = require.resolve('nodemailer');
const gesendet = [];
require.cache[nm] = { id: nm, filename: nm, loaded: true, exports: {
  createTransport: (opt) => ({ sendMail: async (m) => { gesendet.push({ opt, m }); return { messageId: 'x' }; } })
} };
const handler = require(path.join(__dirname, '..', 'api', 'bestaetigung.js'));

let fehler = 0;
const pruefe = (ok, txt) => { console.log((ok ? '   [ok]  ' : '   [FEHLER] ') + txt); if (!ok) fehler++; };
function aufruf(body, { method = 'POST', origin = 'https://bhd-energie.de', ip = '1.1.1.1' } = {}) {
  return new Promise(resolve => {
    const res = { code: 0, headers: {}, setHeader(k, v) { this.headers[k] = v; },
      status(c) { this.code = c; return this; }, json(j) { resolve({ code: this.code, j }); return this; } };
    handler({ method, headers: { origin, 'x-forwarded-for': ip }, body }, res);
  });
}

(async () => {
  delete process.env.SMTP_PASS;
  let r = await aufruf({ email: 'a@b.de' });
  pruefe(r.code === 503 && gesendet.length === 0, 'ohne SMTP_PASS: 503, nichts verschickt');

  process.env.SMTP_PASS = 'test';
  r = await aufruf({ email: 'a@b.de' }, { method: 'GET' });
  pruefe(r.code === 405, 'GET wird abgelehnt');
  r = await aufruf({ email: 'a@b.de' }, { origin: 'https://boese.example' });
  pruefe(r.code === 403, 'fremde Herkunft wird abgelehnt');
  r = await aufruf({ email: 'kein-mail' });
  pruefe(r.code === 400, 'ungueltige Adresse wird abgelehnt');
  r = await aufruf({ email: 'x@y.de, z@w.de' });
  pruefe(r.code === 400, 'mehrere Empfaenger werden abgelehnt');

  r = await aufruf({ art: 'Startseite', email: 'Kunde@Example.de', name: 'Max <a href=x>Müller</a> http://spam.de' }, { ip: '2.2.2.2' });
  const m = gesendet[gesendet.length - 1];
  pruefe(r.code === 200 && m && m.m.to === 'kunde@example.de', 'Startseite: Bestaetigung an den Kunden');
  pruefe(m && !/spam\.de|<a|http:/.test(m.m.text) && /Guten Tag Max/.test(m.m.text), 'Name ohne Links, Domains und HTML im Text');
  pruefe(m && m.opt.host === 'smtp.ionos.de' && m.opt.port === 465 && m.opt.auth.user === 'info@bhd-energie.de', 'Versand ueber IONOS info@bhd-energie.de');
  pruefe(m && m.m.from.address === 'info@bhd-energie.de' && m.m.replyTo === 'info@bhd-energie.de', 'Absender und Antwortadresse info@');

  r = await aufruf({ art: 'Termin', email: 't@example.de', name: 'Anna', termin: 'Samstag, 18.10.2026 um 10:30 Uhr' }, { ip: '3.3.3.3' });
  const t = gesendet[gesendet.length - 1];
  pruefe(r.code === 200 && /Samstag, 18\.10\.2026 um 10:30 Uhr/.test(t.m.text) && /noch nicht fest/.test(t.m.text), 'Termin: Wunschtermin genannt, ausdruecklich noch nicht bestaetigt');
  r = await aufruf({ art: 'Termin', email: 't2@example.de', termin: 'http://boese.de/<x>' }, { ip: '3.3.3.4' });
  pruefe(!/boese/.test(gesendet[gesendet.length - 1].m.text), 'manipulierter Terminwunsch wird verworfen');

  r = await aufruf({ art: 'Angebots-Check', email: 'c@example.de' }, { ip: '4.4.4.4' });
  pruefe(/24 Stunden/.test(gesendet[gesendet.length - 1].m.text), 'Angebots-Check: Rueckmeldung in 24 Stunden');

  let codes = [];
  for (let i = 0; i < 5; i++) codes.push((await aufruf({ email: 'gleich@example.de' }, { ip: '5.5.5.' + i })).code);
  pruefe(codes.slice(0, 3).every(c => c === 200) && codes.slice(3).every(c => c === 429), 'hoechstens 3 Mails je Empfaenger und Stunde');
  codes = [];
  for (let i = 0; i < 8; i++) codes.push((await aufruf({ email: 'n' + i + '@example.de' }, { ip: '6.6.6.6' })).code);
  pruefe(codes.filter(c => c === 200).length === 6, 'hoechstens 6 Mails je IP und Stunde');

  console.log(fehler ? '\n' + fehler + ' Fehler.' : '\nBestaetigungsfunktion arbeitet korrekt.');
  process.exit(fehler ? 1 : 0);
})();
