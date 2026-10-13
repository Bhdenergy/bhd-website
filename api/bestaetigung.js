/*
 * Eingangsbestaetigung an den Kunden – Vercel-Serverfunktion.
 *
 * Wird von der Website NUR nach erfolgreichem Lead-Versand (FormSubmit)
 * aufgerufen. Die Anfrage selbst laeuft weiterhin ueber FormSubmit; faellt
 * diese Funktion aus, geht also keine Anfrage verloren.
 *
 * Versand ueber das IONOS-Postfach info@bhd-energie.de. Zugangsdaten
 * ausschliesslich als Umgebungsvariablen in Vercel (Settings → Environment
 * Variables), NIE ins Repository:
 *   SMTP_PASS  Passwort des Postfachs info@bhd-energie.de   (Pflicht)
 *   SMTP_USER  optional, Standard info@bhd-energie.de
 *   SMTP_HOST  optional, Standard smtp.ionos.de (Port 465, SSL)
 * Solange SMTP_PASS fehlt, antwortet die Funktion mit 503 und verschickt
 * nichts – die Website funktioniert dann genau wie vorher.
 *
 * Missbrauchsschutz: nur Aufrufe von bhd-energie.de, fester Mailtext (der
 * Name ist auf Buchstaben gekuerzt, keine Links moeglich), Drosselung je
 * IP und je Empfaenger. Es wird nichts gespeichert.
 */
const nodemailer = require('nodemailer');

const ERLAUBT = ['https://bhd-energie.de', 'https://www.bhd-energie.de'];
const ABSENDER = 'info@bhd-energie.de';
const FENSTER_MS = 60 * 60 * 1000;
const MAX_JE_IP = 6;
const MAX_JE_MAIL = 3;
const zaehler = new Map(); // lebt nur so lange wie die Funktionsinstanz

function gedrosselt(schluessel, max) {
  const jetzt = Date.now();
  const liste = (zaehler.get(schluessel) || []).filter(t => jetzt - t < FENSTER_MS);
  if (liste.length >= max) { zaehler.set(schluessel, liste); return true; }
  liste.push(jetzt);
  zaehler.set(schluessel, liste);
  return false;
}

function inhalt(art, name, termin) {
  const a = String(art || '').toLowerCase();
  const anrede = name ? `Guten Tag ${name},` : 'Guten Tag,';
  let betreff = 'Ihre Anfrage bei BHD ist eingegangen';
  let kern;
  if (a.includes('termin')) {
    betreff = 'Ihr Terminwunsch bei BHD ist eingegangen';
    kern = (termin ? `vielen Dank für Ihre Terminanfrage. Ihr Wunschtermin: ${termin}.\n\n` : 'vielen Dank für Ihre Terminanfrage.\n\n') +
      'Der Termin steht damit noch nicht fest. Wir prüfen ihn und bestätigen ihn Ihnen gesondert. ' +
      'Passt er bei uns nicht, schlagen wir Ihnen einen anderen Zeitpunkt vor.';
  } else if (a.includes('angebots')) {
    kern = 'vielen Dank, Ihr Angebot ist bei uns eingegangen. Wir sehen es uns an und melden uns innerhalb von 24 Stunden bei Ihnen.';
  } else if (a.includes('bestand')) {
    kern = 'vielen Dank für Ihre Anfrage zu Ihrer bestehenden Anlage. Sie ist bei uns eingegangen. Wir sehen uns die Angaben an und melden uns in der Regel innerhalb eines Werktags bei Ihnen.';
  } else if (a === 'b2b') {
    kern = 'vielen Dank für Ihre Anfrage zur Zusammenarbeit. Sie ist bei uns eingegangen. Wir melden uns in der Regel innerhalb eines Werktags bei Ihnen.';
  } else {
    kern = 'vielen Dank für Ihre Anfrage. Sie ist bei uns eingegangen. Wir melden uns in der Regel innerhalb eines Werktags bei Ihnen.';
  }
  const text = `${anrede}

${kern}

Sie erreichen uns Montag bis Freitag von 9 bis 18 Uhr und samstags von 10 bis 15 Uhr unter 0163 4440392 oder per E-Mail an ${ABSENDER}. Sie können auch einfach auf diese E-Mail antworten.

Mit freundlichen Grüßen
BHD – Beratung Heimenergie Deutschland

Brotherhooddeen UG (haftungsbeschränkt)
Prinzenallee 44b, 13359 Berlin
https://bhd-energie.de

Diese E-Mail wurde automatisch versendet, weil auf bhd-energie.de ein Formular mit Ihrer E-Mail-Adresse abgeschickt wurde. Falls Sie das nicht waren, können Sie die Nachricht ignorieren.`;
  return { betreff, text };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  if (!ERLAUBT.includes(req.headers.origin)) return res.status(403).json({ ok: false });
  if (!process.env.SMTP_PASS) return res.status(503).json({ ok: false, grund: 'nicht eingerichtet' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false });

  const email = String(body.email || '').trim().toLowerCase();
  if (email.length > 120 || !/^[^\s@<>,;]+@[^\s@<>,;]+\.[a-z]{2,}$/i.test(email)) {
    return res.status(400).json({ ok: false });
  }
  // Nur Buchstaben, Leerzeichen, Bindestrich, Apostroph – keine Links, keine Domains
  const name = String(body.name || '').replace(/[^\p{L}\p{M} '-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const termin = /^[\p{L}\p{N} ,.:]{0,60}$/u.test(String(body.termin || '')) ? String(body.termin || '').trim() : '';
  const art = String(body.art || '').slice(0, 40);

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unbekannt';
  if (gedrosselt('ip:' + ip, MAX_JE_IP) || gedrosselt('mail:' + email, MAX_JE_MAIL)) {
    return res.status(429).json({ ok: false });
  }

  const { betreff, text } = inhalt(art, name, termin);
  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ionos.de',
      port: 465,
      secure: true,
      auth: { user: process.env.SMTP_USER || ABSENDER, pass: process.env.SMTP_PASS }
    });
    await transport.sendMail({
      from: { name: 'BHD – Beratung Heimenergie Deutschland', address: ABSENDER },
      to: email,
      replyTo: ABSENDER,
      subject: betreff,
      text
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Bestaetigung fehlgeschlagen:', e && e.message);
    return res.status(502).json({ ok: false });
  }
};

module.exports.inhalt = inhalt;
