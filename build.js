/*
 * BHD-Website – Seitengenerator
 * -----------------------------
 * Liest die Quelldatei src/site.html (alle Ansichten in einer Datei) und
 * erzeugt daraus echte Unterseiten mit eigenen URLs, dazu sitemap.xml und
 * robots.txt.
 *
 * Aufruf:  node build.js
 *
 * WICHTIG: Immer nur src/site.html bearbeiten – die erzeugten Dateien
 * (index.html, referenzen/index.html, …) werden bei jedem Lauf überschrieben.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src', 'site.html');

/* Domain an EINER Stelle. Hauptadresse der Website (ohne www – www leitet in
 * Vercel darauf um). Bei einem Domainwechsel nur diese Zeile ändern. */
const SITE = 'https://bhd-energie.de';

/* Kontakt-E-Mail an EINER Stelle. Wird überall eingesetzt: Footer, Schnellkontakt,
 * Impressum, Datenschutz UND als Empfänger der drei Formulare (FormSubmit).
 * ACHTUNG beim Wechsel: FormSubmit muss für die neue Adresse einmalig neu
 * freigeschaltet werden – nach dem ersten Absenden kommt eine Bestätigungsmail. */
const MAIL = 'info@bhd-energie.de';
const MAIL_IN_SOURCE = 'service-bhd@outlook.de'; // so steht sie in src/site.html

/* ------------------------------------------------- Nachtragen nach Anmeldung
 * Diese drei Werte sind die einzigen Stellen, die nach dem Einrichten der
 * Konten von Hand gefuellt werden muessen. Danach einmal `node build.js`.
 * Solange ein Wert leer ist, laesst der Generator die zugehoerige Zeile
 * einfach weg – die Seite bleibt in jedem Fall gueltig.
 */

/* Google Search Console: nur noetig, wenn NICHT ueber DNS bestaetigt wird.
 * Der Wert ist der Teil hinter "content=" aus dem Meta-Tag, das Google zeigt. */
const GSC_TOKEN = 'YmJdAGRuu0_isrbFEfEq8GP-UYUhLj1bDpGdXmTraFE';

/* Google Analytics 4: Mess-ID aus der Datenstream-Einstellung, Form "G-XXXXXXXXXX".
 * WICHTIG: GA4 wird erst nach ausdruecklicher Einwilligung geladen (§ 25 TDDDG). */
const GA4_ID = 'G-NM7G327C1L';

/* Social-Media-Profile fuer sameAs im JSON-LD. NUR echte, existierende Profile
 * eintragen – Verweise auf nicht vorhandene Seiten schaden mehr, als sie nutzen.
 * Beispiel: ['https://www.facebook.com/…', 'https://www.linkedin.com/company/…'] */
const SOCIAL = [];

/* IndexNow: meldet neue und geaenderte Seiten sofort an Bing (und damit an
 * ChatGPT Search und Copilot). Der Schluessel ist frei waehlbar, muss aber als
 * Datei <schluessel>.txt im Wurzelverzeichnis liegen – das erledigt der Build. */
const INDEXNOW_KEY = 'bhd7f3a1c94e26d508b1a2f6c3e9740b';

/* Erreichbarkeit – steht im JSON-LD, auf der Kontaktseite und muss mit dem
 * Google-Unternehmensprofil uebereinstimmen. */
const OPENING = { von: '08:00', bis: '20:00', text: 'Täglich 8:00 – 20:00 Uhr' };

/* Datum des letzten inhaltlichen Durchgangs – fuer dateModified im JSON-LD. */
const REVIEWED = new Date().toISOString().slice(0, 10);

/* Zeilenenden vereinheitlichen – die Quelldatei kommt aus Windows (CRLF). */
const src = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');

/* ---------------------------------------------------------------- Helfer */

function between(text, start, end, keep) {
  const a = text.indexOf(start);
  if (a < 0) throw new Error('Startmarke nicht gefunden: ' + start);
  const b = text.indexOf(end, a + start.length);
  if (b < 0) throw new Error('Endmarke nicht gefunden: ' + end);
  return keep ? text.slice(a, b + end.length) : text.slice(a + start.length, b);
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ------------------------------------------------------------ Seitenplan */

const PAGES = [
  {
    key: 'home', dir: '', view: 'view-home', prio: '1.0', nav: false,
    title: 'Photovoltaik & Wärmepumpe Berlin & bundesweit | BHD',
    ogTitle: 'Photovoltaik & Wärmepumpe – unabhängige Beratung | BHD',
    desc: 'Unabhängige Beratung zu Photovoltaik, Stromspeicher und Wärmepumpe. Geprüfte Fachbetriebe, KfW-Zuschuss bis 80 %. Sitz in Berlin, bundesweit tätig.',
    ld: ['faq']
  },
  {
    key: 'check', dir: 'angebots-check', view: 'view-check', prio: '0.9', crumb: 'Angebots-Check',
    title: 'Angebots-Check: PV-Angebot prüfen lassen | BHD',
    desc: 'Angebot für Photovoltaik oder Wärmepumpe kostenlos prüfen lassen: Seriosität, Auslegung und Preis. Ehrliche Rückmeldung innerhalb von 24 Stunden.',
    ld: ['service'],
    service: {
      name: "Kostenloser Angebots-Check",
      typ: "Unabhängige Angebotsprüfung",
      desc: "Prüfung eines vorliegenden Angebots für Photovoltaik, Stromspeicher oder Wärmepumpe auf Seriosität des Anbieters, technische Auslegung und Preis-Leistungs-Verhältnis, mit Rückmeldung innerhalb von 24 Stunden."
    }
  },
  {
    key: 'ref', dir: 'referenzen', view: 'view-ref', prio: '0.8', crumb: 'Referenzen',
    title: 'Referenzen: PV- & Wärmepumpen-Projekte | BHD',
    desc: 'Umgesetzte Projekte: Photovoltaik auf Sattel- und Flachdach, Luft-Wasser-Wärmepumpen von der Erdarbeit bis zur Hydraulik, Speicher und Wallbox.'
  },
  {
    key: 'about', dir: 'ueber-uns', view: 'view-about', prio: '0.6', crumb: 'Über uns',
    title: 'Über uns – BHD Beratung Heimenergie Deutschland',
    desc: 'Wer hinter BHD steht: Brotherhooddeen UG aus Berlin, gegründet 2024, bundesweit tätig. Unabhängige Beratung und geprüfte Installateur-Partner.'
  },
  {
    key: 'pv', dir: 'photovoltaik', view: 'view-pv', prio: '0.9', crumb: 'Photovoltaik',
    title: 'Photovoltaik fürs Eigenheim: Kosten & Förderung | BHD',
    ogTitle: 'Photovoltaik – unabhängig beraten statt verkauft | BHD',
    desc: 'Photovoltaik fürs Einfamilienhaus: welche Anlagengröße passt, warum der Eigenverbrauch zählt und wie 0 % Mehrwertsteuer wirkt. Unabhängig beraten.',
    service: {
      name: "Beratung und Vermittlung für Photovoltaikanlagen",
      typ: "Photovoltaik-Beratung",
      desc: "Unabhängige Beratung zur Auslegung einer Photovoltaikanlage für Einfamilienhäuser: passende Anlagengröße nach Verbrauch, Eigenverbrauchsoptimierung, Speicherbedarf, steuerliche Behandlung nach § 12 Abs. 3 UStG und Vermittlung eines geprüften Fachbetriebs."
    }
  },
  {
    key: 'speicher', dir: 'stromspeicher', view: 'view-speicher', prio: '0.8', crumb: 'Stromspeicher',
    title: 'Stromspeicher: Größe, Technik und Preise | BHD',
    desc: 'Stromspeicher für die Solaranlage: welche Kapazität sich rechnet, was nutzbare Kapazität und Zyklengarantie bedeuten, aktuelle Preise je kWh.',
    service: {
      name: "Beratung und Vermittlung für Stromspeicher",
      typ: "Stromspeicher-Beratung",
      desc: "Beratung zur Auslegung von Batteriespeichern für Photovoltaikanlagen: sinnvolle Kapazität nach Jahresstromverbrauch, nutzbare gegenüber nominaler Kapazität, Zellchemie, Zyklengarantie, Notstromfähigkeit und Aufstellort."
    }
  },
  {
    key: 'wp', dir: 'waermepumpe', view: 'view-wp', prio: '0.9', crumb: 'Wärmepumpe',
    title: 'Wärmepumpe: Eignung, Ablauf & KfW-Förderung | BHD',
    ogTitle: 'Wärmepumpe – lohnt sich das in Ihrem Haus? | BHD',
    desc: 'Wärmepumpe im Altbau: warum die Vorlauftemperatur über die Kosten entscheidet, wie eine Umstellung abläuft und wie bis zu 80 % KfW-Zuschuss gehen.',
    service: {
      name: "Beratung und Vermittlung für Wärmepumpen",
      typ: "Wärmepumpen-Beratung",
      desc: "Beratung zur Umstellung auf eine Luft-Wasser-Wärmepumpe im Bestandsgebäude: Heizlast, erforderliche Vorlauftemperatur, Anpassung der Heizflächen, hydraulischer Abgleich, Zählerschrank nach § 14a EnWG und Abwicklung des KfW-Zuschusses 458."
    }
  },
  {
    key: 'kosten', dir: 'kosten', view: 'view-kosten', prio: '0.9', crumb: 'Kosten',
    title: 'Was kostet PV, Speicher & Wärmepumpe? Preise | BHD',
    ogTitle: 'Preise offen genannt – Photovoltaik & Wärmepumpe | BHD',
    desc: 'Marktübliche Preise für Photovoltaik, Stromspeicher und Wärmepumpe, Stand 2026. Mit Beispielrechnung zum Eigenanteil nach der KfW-Förderung.',
    service: {
      name: "Kosteneinschätzung für Photovoltaik und Wärmepumpe",
      typ: "Kostenberatung",
      desc: "Einordnung marktüblicher Preise für Photovoltaikanlagen, Stromspeicher, Luft-Wasser-Wärmepumpen, Wallboxen und Zählerschränke sowie Berechnung des Eigenanteils nach Abzug der KfW-Förderung."
    }
  },
  {
    key: 'ratgeber', dir: 'ratgeber', view: 'view-ratgeber', prio: '0.7', crumb: 'Ratgeber',
    title: 'Ratgeber: Photovoltaik & Wärmepumpe verstehen | BHD',
    desc: 'Verständliche Beiträge zu Photovoltaik, Wärmepumpe und Angebotsprüfung – von Beratern, die keine Anlagen verkaufen und auch sagen, was sich nicht lohnt.',
    ld: ['ratgeberliste']
  },
  {
    key: 'rat-pv', dir: 'ratgeber/photovoltaik-lohnt-sich', view: 'view-rat-pv', prio: '0.8', crumb: 'Lohnt sich Photovoltaik?',
    title: 'Lohnt sich Photovoltaik 2026 noch? | BHD Ratgeber',
    desc: 'Einspeisevergütung bei 7,7 Cent, Netzstrom bei 35: Warum sich die Rechnung umgedreht hat, wann sich eine Anlage amortisiert und für wen sie sich nicht lohnt.',
    article: { headline: 'Lohnt sich Photovoltaik 2026 noch?', pub: '2026-08-01', section: 'Photovoltaik' }
  },
  {
    key: 'rat-wp', dir: 'ratgeber/waermepumpe-altbau', view: 'view-rat-wp', prio: '0.8', crumb: 'Wärmepumpe im Altbau',
    title: 'Wärmepumpe im Altbau: geht das? | BHD Ratgeber',
    desc: 'Der Selbsttest an einem kalten Tag, warum die Vorlauftemperatur über 500 Euro im Jahr entscheidet und weshalb Dämmung selten der günstigste Hebel ist.',
    article: { headline: 'Wärmepumpe im Altbau: geht das?', pub: '2026-08-01', section: 'Wärmepumpe' }
  },
  {
    key: 'rat-check', dir: 'ratgeber/angebot-pruefen', view: 'view-rat-check', prio: '0.8', crumb: 'Angebot prüfen',
    title: 'PV-Angebot prüfen: 12-Punkte-Checkliste | BHD Ratgeber',
    desc: 'Checkliste für PV- und Wärmepumpen-Angebote: zwölf Angaben, die enthalten sein müssen, und drei Warnzeichen, bei denen Sie besser nicht unterschreiben.',
    article: { headline: 'Angebot prüfen: 12 Punkte, die drinstehen müssen', pub: '2026-08-01', section: 'Angebotsprüfung' }
  },
  {
    key: 'rechner', dir: 'waermepumpen-rechner', view: 'view-rechner', prio: '0.9', crumb: 'Wärmepumpen-Rechner',
    title: 'Wärmepumpen-Rechner: Größe & Förderung | BHD',
    ogTitle: 'Kostenloser Wärmepumpen-Rechner – Größe & Förderung | BHD',
    desc: 'Kostenloser Wärmepumpen-Rechner: Heizlast, Gerätegröße, Jahresarbeitszahl, Speicher und KfW-Zuschuss aus Ihren Gebäudedaten. Ohne Anmeldung.',
    ld: ['rechner']
  },
  {
    key: 'ask', dir: 'anfragen', view: 'view-ask', prio: '0.9', crumb: 'Anfragen',
    title: 'Anfrage stellen – kostenloses Angebot | BHD',
    desc: 'Kostenloses Angebot für Photovoltaik, Stromspeicher oder Wärmepumpe anfordern. Unabhängige Beratung und geprüfte Fachbetriebe aus Ihrer Region.'
  },
  {
    key: 'kontakt', dir: 'kontakt', view: 'view-kontakt', prio: '0.8', crumb: 'Kontakt',
    title: 'Kontakt: Telefon, WhatsApp & E-Mail | BHD Berlin',
    ogTitle: 'Kontakt – direkt mit einem Berater sprechen | BHD',
    desc: 'BHD erreichen Sie täglich von 8 bis 20 Uhr: telefonisch unter 0163 4440392, per WhatsApp oder E-Mail. Sitz in Berlin, Beratung bundesweit.',
    ld: ['kontakt']
  },
  {
    key: 'partner', dir: 'partner-werden', view: 'view-partner', prio: '0.7', crumb: 'Partner werden',
    title: 'Partner werden – für Fachbetriebe | BHD',
    ogTitle: 'Partner werden – Aufträge statt Akquise | BHD',
    desc: 'Als Fachbetrieb Partner von BHD werden: vorqualifizierte Anfragen in Ihrer Region, keine Vorkosten, keine Mindestabnahme. Ablauf und Formular.'
  },
  {
    key: 'impressum', dir: 'impressum', view: 'view-impressum', prio: '0.2', crumb: 'Impressum',
    title: 'Impressum | BHD Beratung Heimenergie Deutschland',
    desc: 'Impressum und Anbieterkennzeichnung der Brotherhooddeen UG (haftungsbeschränkt) aus Berlin, Marke BHD – Beratung Heimenergie Deutschland.'
  },
  {
    key: 'datenschutz', dir: 'datenschutz', view: 'view-datenschutz', prio: '0.2', crumb: 'Datenschutz',
    title: 'Datenschutz | BHD Beratung Heimenergie Deutschland',
    desc: 'Datenschutzerklärung von BHD: welche Daten wir verarbeiten, zu welchem Zweck, wer sie erhält und welche Rechte Sie nach der DSGVO haben.'
  }
];

const URL_OF = {};
PAGES.forEach(p => { URL_OF[p.key] = p.dir ? '/' + p.dir + '/' : '/'; });

/* -------------------------------------------------------- Bausteine holen */

const STYLE_INLINE = between(src, '<style>:root{color-scheme:light}', '</style>', true);
const STYLE_MAIN = between(src, '<style>\n', '</style>', true);
const SPRITE = between(src, '<svg style="display:none" aria-hidden="true">', '</svg>', true);
const NAV = between(src, '<nav>', '</nav>', true);
const FOOTER = between(src, '<footer>', '</footer>', true);
const QUICK = between(src, '<!-- ========================= SCHNELLKONTAKT', '</body>', false)
  .replace(/^[^\n]*\n/, ''); // Kommentarzeile weg
const SCRIPT_RAW = between(src, '<script>\n  const reduce=', '</script>', false);

const VIEWS = {};
PAGES.forEach(p => {
  VIEWS[p.key] = between(src, '<div id="' + p.view + '"', '</div><!-- /' + p.view + ' -->', true)
    .replace('<div id="' + p.view + '" hidden>', '<div id="' + p.view + '">');
});

/* ------------------------------------------------- Script umbauen (1×) */

function buildScript() {
  let s = '  const reduce=' + SCRIPT_RAW;

  const MARK_FUNNEL = '  // ---------- Funnel ----------';
  const MARK_FILTER = '  // ---------- Referenzen: Filter nach Anlagentyp ----------';
  const MARK_ROUTE = '  // ---------- Seiten-Routing (Start / Referenzen / Anfragen) ----------';
  const MARK_FORMS = '  // ---------- Formulare der Anfragen-Seite ----------';
  const MARK_SCROLL = '  // ---------- Angebots-Check: sanftes Scrollen zum Formular ----------';

  const head = s.slice(0, s.indexOf(MARK_FUNNEL));
  const funnel = s.slice(s.indexOf(MARK_FUNNEL), s.indexOf(MARK_FILTER));
  const filter = s.slice(s.indexOf(MARK_FILTER), s.indexOf(MARK_ROUTE));
  const forms = s.slice(s.indexOf(MARK_FORMS), s.indexOf(MARK_SCROLL));
  let tail = s.slice(s.indexOf(MARK_SCROLL));

  // Der Routing-Block entfällt – ersetzt durch echte Links + Hash-Weiterleitung
  const nav = [
    '  // ---------- Navigation (echte Unterseiten) ----------',
    '  (function(){',
    '    // aktiven Menuepunkt markieren',
    '    var page=document.body.dataset.page;',
    "    document.querySelectorAll('.nav-links [data-nav]').forEach(function(a){",
    "      a.classList.toggle('active', a.dataset.nav===page);",
    '    });',
    '    // Alte Adressen mit # auf die neuen Seiten umleiten (fuer geteilte Links)',
    '    var map=' + JSON.stringify({
      '#referenzen': URL_OF.ref, '#anfragen': URL_OF.ask, '#ueber-uns': URL_OF.about,
      '#angebots-check': URL_OF.check, '#waermepumpen-rechner': URL_OF.rechner,
      '#partner-werden': URL_OF.partner, '#photovoltaik': URL_OF.pv,
      '#ratgeber-photovoltaik': URL_OF['rat-pv'], '#ratgeber-waermepumpe': URL_OF['rat-wp'],
      '#ratgeber-angebot': URL_OF['rat-check'],
      '#stromspeicher': URL_OF.speicher, '#waermepumpe': URL_OF.wp, '#kosten': URL_OF.kosten,
      '#ratgeber': URL_OF.ratgeber,
      '#impressum': URL_OF.impressum, '#datenschutz': URL_OF.datenschutz
    }) + ';',
    '    if(map[location.hash]){location.replace(map[location.hash]);return;}',
    '    // „Jetzt anfragen": auf der Startseite sanft scrollen, sonst normal verlinken',
    "    document.querySelectorAll('[data-go-funnel]').forEach(function(el){",
    "      el.addEventListener('click',function(e){",
    "        var f=document.getElementById('funnel');",
    '        if(!f)return;',
    '        e.preventDefault();',
    "        f.scrollIntoView({behavior:'smooth',block:'start'});",
    '      });',
    '    });',
    '  })();',
    ''
  ].join('\n');

  // Funnel und Anfrage-Formulare sind nur auf je einer Seite vorhanden ->
  // kapseln, damit sie auf allen anderen Seiten sauber aussteigen.
  const funnelGuarded =
    '  // ---------- Funnel (nur Startseite) ----------\n  (function(){\n' +
    "    if(!document.getElementById('funnel'))return;\n" +
    funnel.replace(MARK_FUNNEL + '\n', '') + '  })();\n\n';

  // Die Formular-Bloecke (B2C, B2B, Waermepumpen-Rechner) pruefen in der
  // Quelldatei jeweils selbst, ob ihre Elemente vorhanden sind – hier ist
  // deshalb keine zusaetzliche Kapselung noetig.
  const formsGuarded = forms + '\n';

  // Danke-Meldung des Angebots-Checks: kein setView mehr noetig
  tail = tail
    .replace("    setView('check',false);\n", '')
    .replace("location.pathname+'#angebots-check'", 'location.pathname');

  return head + funnelGuarded + filter + nav + formsGuarded + tail;
}

/* Auch im Skript steckt die Adresse (FormSubmit-Endpunkt der beiden Formulare). */
const SCRIPT = buildScript().split(MAIL_IN_SOURCE).join(MAIL);

/* --------------------------------------------------- Links absolut machen */

function fixLinks(html) {
  return html
    // Kontaktadresse zentral setzen (mailto, Impressum, Datenschutz, FormSubmit)
    .split(MAIL_IN_SOURCE).join(MAIL)
    // Assets funktionieren dann aus jeder Unterseite heraus
    .replace(/(src|href)="assets\//g, '$1="/assets/')
    // Menue-/Footer-Links: echte Ziele ergaenzen (data-nav bleibt fuer die Markierung)
    // data-nav kann an beliebiger Stelle im <a> stehen (z. B. nach class) –
    // deshalb den ganzen Tag betrachten und href nur ergaenzen, wenn keins da ist.
    .replace(/<a\b[^>]*>/g, (tag) => {
      if (/\shref=/.test(tag)) return tag;
      const m = tag.match(/\sdata-nav="([a-z-]+)"/);
      if (!m) return tag;
      return tag.replace('<a', '<a href="' + (URL_OF[m[1]] || '/') + '"');
    })
    .replace(/<div class="brand" data-nav="home">/g, '<a class="brand" href="/" data-nav="home" aria-label="Zur Startseite">')
    // Verweise auf die Datenschutzseite (aus den Einwilligungstexten)
    .replace(/href="#datenschutz"/g, 'href="' + URL_OF.datenschutz + '"')
    // Anfrage-Funnel liegt auf der Startseite
    .replace(/href="#funnel"/g, 'href="/#funnel"');
}

/* ------------------------------------------------- WebP ausliefern
 * Zu jedem JPG/PNG unter /assets liegt eine WebP-Fassung. Statt das Markup
 * von Hand umzubauen, wird jedes <img> hier automatisch in ein <picture>
 * gehuellt: moderne Browser laden WebP, aeltere weiterhin das Original.
 * `picture{display:contents}` sorgt dafuer, dass sich am Layout nichts
 * aendert – die bestehenden CSS-Regeln greifen unveraendert auf das <img>.
 */
/* Breiten, die tools/bilder.js fuer die Referenzfotos erzeugt. */
const BILD_BREITEN = [400, 800];

/* Die Referenzkarten sind auf dem Handy fast bildschirmbreit, auf mittleren
 * Bildschirmen halb so breit und auf grossen rund 340 px. Ohne diese Angabe
 * nimmt der Browser die Fensterbreite an und laedt immer die groesste Datei. */
const BILD_SIZES = '(max-width:700px) 92vw, (max-width:1100px) 46vw, 340px';

function webpPicture(html) {
  return html.replace(/<img\b[^>]*\bsrc="(\/assets\/[^"]+\.(?:jpg|jpeg|png))"[^>]*>/gi, (tag, src) => {
    const webp = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    if (!fs.existsSync(path.join(ROOT, webp))) return tag;

    /* Liegen zusaetzlich verkleinerte Fassungen vor, als srcset anbieten –
     * sonst laedt das Handy die volle Aufloesung fuer eine kleine Kachel. */
    const basis = src.replace(/\.(jpg|jpeg|png)$/i, '');
    const stufen = BILD_BREITEN
      .map(b => ({ b: b, datei: basis + '-' + b + '.webp' }))
      .filter(s => fs.existsSync(path.join(ROOT, s.datei)));

    if (!stufen.length) {
      return '<picture><source srcset="' + webp + '" type="image/webp">' + tag + '</picture>';
    }

    const srcset = stufen.map(s => s.datei + ' ' + s.b + 'w').join(', ');
    return '<picture><source type="image/webp" srcset="' + srcset +
           '" sizes="' + BILD_SIZES + '">' + tag + '</picture>';
  });
}

/* Das schliessende </div> der Marke muss zu </a> werden – zeilenweise sicher. */
function fixBrandClose(html) {
  return html.replace(
    /<a class="brand" href="\/" data-nav="home" aria-label="Zur Startseite">(<img[^>]*>)<\/div>/g,
    '<a class="brand" href="/" data-nav="home" aria-label="Zur Startseite">$1</a>'
  );
}

const NAV_OUT = webpPicture(fixBrandClose(fixLinks(NAV)));
const FOOTER_OUT = webpPicture(fixBrandClose(fixLinks(FOOTER)));
const QUICK_OUT = fixLinks(QUICK);

/* -------------------------------------------------------- JSON-LD je Seite */

function jsonLd(page) {
  const nodes = [
    {
      // ProfessionalService ist ein Untertyp von LocalBusiness und trifft es
      // genauer als der Oberbegriff: BHD berät und vermittelt, montiert nicht selbst.
      '@type': ['Organization', 'ProfessionalService'],
      '@id': SITE + '/#org',
      name: 'BHD – Beratung Heimenergie Deutschland',
      legalName: 'Brotherhooddeen UG (haftungsbeschränkt)',
      vatID: 'DE370268782',
      identifier: 'HRB 266273 B',
      url: SITE + '/',
      email: MAIL,
      telephone: '+49 163 4440392',
      foundingDate: '2024',
      founder: { '@type': 'Person', name: 'Kürşat Yıldırım' },
      description: 'Unabhängige Beratung für Hausbesitzer zu Photovoltaik, Stromspeicher und Wärmepumpe. Vermittlung geprüfter, regionaler Fachbetriebe. Sitz in Berlin, bundesweit tätig.',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Prinzenallee 44b',
        postalCode: '13359',
        addressLocality: 'Berlin',
        addressCountry: 'DE'
      },
      // Koordinaten der Geschäftsadresse, per OpenStreetMap ermittelt
      geo: { '@type': 'GeoCoordinates', latitude: 52.55896, longitude: 13.38854 },
      hasMap: 'https://www.openstreetmap.org/?mlat=52.55896&mlon=13.38854#map=18/52.55896/13.38854',
      areaServed: [
        { '@type': 'City', name: 'Berlin' },
        { '@type': 'Country', name: 'Deutschland' }
      ],
      knowsAbout: [
        'Photovoltaik', 'Solaranlage', 'Stromspeicher', 'Batteriespeicher', 'Wärmepumpe',
        'Luft-Wasser-Wärmepumpe', 'Wallbox', 'Energieberatung', 'KfW-Förderung',
        'Heizlastberechnung', 'Eigenverbrauch', 'Angebotsprüfung'
      ],
      makesOffer: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Unabhängige Beratung zu Photovoltaik und Stromspeicher' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Beratung und Vermittlung für Wärmepumpen inklusive KfW-Förderung' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Kostenloser Angebots-Check für Photovoltaik- und Wärmepumpen-Angebote' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Vermittlung geprüfter regionaler Fachbetriebe' } }
      ],
      slogan: 'Sonne rein. Stromrechnung raus.',
      /* logo und image braucht Google fuer das Knowledge Panel und fuer
       * lokale Ergebnisse. Ohne logo kann kein Panel gebildet werden. */
      logo: { '@type': 'ImageObject', '@id': SITE + '/#logo', url: SITE + '/icon-512.png', width: 512, height: 512, caption: 'BHD – Beratung Heimenergie Deutschland' },
      image: SITE + '/assets/og-bhd.png',
      /* Preisniveau als grobe Einordnung – Pflichtfeld-Kandidat fuer LocalBusiness. */
      priceRange: '€€',
      contactPoint: [{
        '@type': 'ContactPoint',
        telephone: '+49-163-4440392',
        email: MAIL,
        contactType: 'customer service',
        areaServed: 'DE',
        availableLanguage: ['de']
      }],
      openingHoursSpecification: [{
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: OPENING.von,
        closes: OPENING.bis
      }],
      /* sameAs nur ausgeben, wenn oben echte Profile eingetragen sind. */
      ...(SOCIAL.length ? { sameAs: SOCIAL } : {})
    },
    {
      '@type': 'WebSite',
      '@id': SITE + '/#website',
      url: SITE + '/',
      name: 'BHD – Beratung Heimenergie Deutschland',
      inLanguage: 'de-DE',
      publisher: { '@id': SITE + '/#org' }
    },
    {
      '@type': 'WebPage',
      '@id': SITE + URL_OF[page.key] + '#webpage',
      url: SITE + URL_OF[page.key],
      name: page.title,
      description: page.desc,
      inLanguage: 'de-DE',
      isPartOf: { '@id': SITE + '/#website' },
      about: { '@id': SITE + '/#org' },
      /* Damit Google und KI-Systeme erkennen, wie aktuell der Stand ist –
       * bei Foerdersaetzen, die sich 2027 aendern, ist das entscheidend. */
      dateModified: REVIEWED
    }
  ];

  if (page.crumb) {
    nodes.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Start', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: page.crumb, item: SITE + URL_OF[page.key] }
      ]
    });
  }

  /* Ueber uns ist die Heimatseite der Person: Person.url zeigt ohnehin
   * hierher, also gehoert der vollstaendige Eintrag mit echtem Foto auf
   * diese Seite. Ein Personen-Entity mit Bild, Jobtitel und Arbeitgeber
   * ist eines der wenigen E-E-A-T-Signale, die man selbst setzen kann.
   * Gleiche @id wie auf den Ratgeber-Seiten, damit Google beides als
   * dieselbe Person zusammenfuehrt. */
  if (page.key === 'about') {
    nodes.push({
      '@type': 'Person',
      '@id': SITE + '/#kuersat',
      name: 'Kürşat Yıldırım',
      jobTitle: 'Geschäftsführer',
      worksFor: { '@id': SITE + '/#org' },
      url: SITE + URL_OF.about,
      image: SITE + '/assets/team/gf-qualitaetskontrolle.jpg',
      knowsAbout: ['Photovoltaik', 'Wärmepumpe', 'Stromspeicher', 'KfW-Förderung', 'Angebotsprüfung'],
      mainEntityOfPage: { '@id': SITE + URL_OF.about + '#webpage' }
    });
  }

  /* Ratgeber-Beitraege: Article mit benanntem Autor und Datum.
   * Google bewertet Ratgeber-Inhalte ohne erkennbare Verantwortliche
   * systematisch schwaecher (E-E-A-T), und KI-Systeme zitieren bevorzugt
   * datierte, namentlich verantwortete Texte. */
  if (page.article) {
    nodes.push({
      '@type': 'Person',
      '@id': SITE + '/#kuersat',
      name: 'Kürşat Yıldırım',
      jobTitle: 'Geschäftsführer',
      worksFor: { '@id': SITE + '/#org' },
      url: SITE + URL_OF.about,
      knowsAbout: ['Photovoltaik', 'Wärmepumpe', 'Stromspeicher', 'KfW-Förderung', 'Angebotsprüfung']
    });
    nodes.push({
      '@type': 'Article',
      '@id': SITE + URL_OF[page.key] + '#article',
      headline: page.article.headline,
      description: page.desc,
      inLanguage: 'de-DE',
      datePublished: page.article.pub,
      dateModified: REVIEWED,
      articleSection: page.article.section,
      author: { '@id': SITE + '/#kuersat' },
      publisher: { '@id': SITE + '/#org' },
      mainEntityOfPage: { '@id': SITE + URL_OF[page.key] + '#webpage' },
      image: SITE + '/assets/og-bhd.png',
      isAccessibleForFree: true
    });
  }

  /* Ratgeber-Uebersicht: sagt Google und KI-Systemen, welche Beitraege
   * zusammengehoeren und in welcher Reihenfolge sie stehen. */
  if ((page.ld || []).includes('ratgeberliste')) {
    const beitraege = PAGES.filter(p => p.article);
    nodes.push({
      '@type': 'ItemList',
      '@id': SITE + URL_OF.ratgeber + '#list',
      name: 'Ratgeber von BHD',
      itemListElement: beitraege.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.article.headline,
        url: SITE + URL_OF[p.key]
      }))
    });
  }

  /* Kontaktseite als ContactPage auszeichnen – Google wertet den Typ fuer
   * lokale Ergebnisse und fuer das Knowledge Panel aus. */
  if ((page.ld || []).includes('kontakt')) {
    nodes.push({
      '@type': 'ContactPage',
      '@id': SITE + URL_OF.kontakt + '#contactpage',
      url: SITE + URL_OF.kontakt,
      name: page.title,
      inLanguage: 'de-DE',
      isPartOf: { '@id': SITE + '/#website' },
      about: { '@id': SITE + '/#org' },
      mainEntity: { '@id': SITE + '/#org' }
    });
  }

  if ((page.ld || []).includes('faq')) {
    nodes.push({
      '@type': 'FAQPage',
      '@id': SITE + '/#faq',
      mainEntity: [
        { '@type': 'Question', name: 'Was kostet mich die Anfrage?', acceptedAnswer: { '@type': 'Answer', text: 'Die Anfrage und das anschließende Angebot sind für Sie völlig kostenlos und unverbindlich. Sie gehen keinerlei Verpflichtung ein.' } },
        { '@type': 'Question', name: 'Wie viel Förderung bekomme ich für eine Wärmepumpe?', acceptedAnswer: { '@type': 'Answer', text: 'Über den KfW-Zuschuss 458 gibt es 30 % Grundförderung. Selbstnutzende Eigentümer, die eine alte Heizung ersetzen, bekommen 16 % Klimageschwindigkeitsbonus dazu, und je nach zu versteuerndem Haushaltseinkommen kommen 40, 30 oder 10 % Einkommensbonus obendrauf. Die Summe ist bei 80 % gedeckelt, die förderfähigen Kosten bei 28.000 Euro für die erste Wohneinheit. Daraus ergibt sich ein Höchstzuschuss von 22.400 Euro.' } },
        { '@type': 'Question', name: 'Warum sollte ich mit der Förderung nicht warten?', acceptedAnswer: { '@type': 'Answer', text: 'Weil die Sätze planmäßig sinken. Die Grundförderung geht im ersten Quartal 2027 von 30 auf 15 Prozent zurück, der Klimageschwindigkeitsbonus sinkt ab Februar 2027 alle sechs Monate um 4 Prozentpunkte und der Höchstbetrag der förderfähigen Kosten sinkt ab dem 1. Februar 2027 alle sechs Monate um 750 Euro. Wer 2026 beantragt, rechnet noch mit den heutigen Sätzen.' } },
        { '@type': 'Question', name: 'Wann muss ich den Förderantrag stellen?', acceptedAnswer: { '@type': 'Answer', text: 'Vor der Auftragserteilung. Wer den Handwerker zuerst beauftragt und danach den Antrag stellt, verliert den Zuschuss. Üblich ist ein Vertrag mit aufschiebender Bedingung, der erst wirksam wird, wenn die Förderung bewilligt ist.' } },
        { '@type': 'Question', name: 'Gibt es für Photovoltaik auch einen Zuschuss?', acceptedAnswer: { '@type': 'Answer', text: 'Nicht in der Form wie bei der Wärmepumpe. Der Vorteil steckt bei Solar in der Steuer: Auf Lieferung und Montage von Anlage, Speicher und Wechselrichter am Wohngebäude fallen 0 % Umsatzsteuer an (§ 12 Abs. 3 UStG, unbefristet). Zusätzlich sind die Einnahmen aus vielen kleinen Anlagen einkommensteuerfrei nach § 3 Nr. 72 EStG.' } },
        { '@type': 'Question', name: 'Lohnt sich Photovoltaik 2026 noch?', acceptedAnswer: { '@type': 'Answer', text: 'In den meisten Fällen ja. Anlagen sind deutlich günstiger geworden, die Mehrwertsteuer entfällt und der selbst genutzte Strom ist heute mehr wert als der eingespeiste. Entscheidend ist nicht die Einspeisevergütung, sondern der Eigenverbrauch. Bei einem Haushalt mit Wärmepumpe oder E-Auto rechnet sich eine Anlage deshalb schneller.' } },
        { '@type': 'Question', name: 'Funktioniert eine Wärmepumpe auch im Altbau?', acceptedAnswer: { '@type': 'Answer', text: 'Meistens ja, entscheidend ist die Vorlauftemperatur. Je niedriger die Temperatur, mit der die Heizung auskommt, desto wirtschaftlicher läuft die Wärmepumpe. Größere Heizkörper in einzelnen Räumen und ein hydraulischer Abgleich senken die Vorlauftemperatur oft um 10 bis 15 Grad und sind fast immer günstiger als eine komplette Dämmung.' } },
        { '@type': 'Question', name: 'Wie schnell erhalte ich ein Angebot?', acceptedAnswer: { '@type': 'Answer', text: 'Nach Ihrer Anfrage meldet sich in kurzer Zeit ein geprüfter Fachbetrieb aus Ihrer Region mit einem auf Ihr Haus zugeschnittenen Angebot. Liegt bereits ein Angebot vor, prüfen wir es innerhalb von 24 Stunden kostenlos.' } },
        { '@type': 'Question', name: 'Brauche ich Eigenkapital?', acceptedAnswer: { '@type': 'Answer', text: 'Nicht zwingend. Neben dem KfW-Zuschuss gibt es zinsverbilligte Kredite und Finanzierungen über die Hausbank. Welche Variante sinnvoll ist, hängt von der Summe und der persönlichen Situation ab.' } },
        { '@type': 'Question', name: 'Welche Garantie habe ich auf die Anlage?', acceptedAnswer: { '@type': 'Answer', text: 'Zu unterscheiden sind Herstellergarantie und gesetzliche Gewährleistung. Die Herstellergarantie kommt vom Produzenten und liegt bei Modulen je nach Hersteller bei bis zu 25 Jahren, bei Speichern und Wechselrichtern deutlich darunter. Davon getrennt gilt die gesetzliche Gewährleistung des ausführenden Betriebs auf die Montage.' } },
        { '@type': 'Question', name: 'Muss mein Zählerschrank für eine Wärmepumpe erneuert werden?', acceptedAnswer: { '@type': 'Answer', text: 'Nicht immer. Eine Wärmepumpe braucht eine eigene Absicherung mit Fehlerstromschutzschalter Typ B und eine Steuereinrichtung nach § 14a EnWG. In älteren Zählerschränken fehlt dafür oft der Platz. Ob Erneuerung, Erweiterung oder nur das Nachrüsten der Steuerung nötig ist, zeigt die Prüfung vor Ort.' } }
      ]
    });
  }

  /* Leistungsseiten bekommen einen eigenen Service-Knoten mit Einzugsgebiet. */
  if (page.service) {
    nodes.push({
      '@type': 'Service',
      '@id': SITE + URL_OF[page.key] + '#service',
      name: page.service.name,
      serviceType: page.service.typ,
      description: page.service.desc,
      provider: { '@id': SITE + '/#org' },
      areaServed: [
        { '@type': 'City', name: 'Berlin' },
        { '@type': 'Country', name: 'Deutschland' }
      ],
      audience: { '@type': 'Audience', audienceType: 'Hausbesitzer und Eigentümer' },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR', description: 'Beratung und Angebotserstellung kostenlos und unverbindlich' }
    });
  }

  if ((page.ld || []).includes('rechner')) {
    nodes.push({
      '@type': 'WebApplication',
      '@id': SITE + URL_OF.rechner + '#app',
      name: 'Wärmepumpen-Rechner von BHD',
      url: SITE + URL_OF.rechner,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      inLanguage: 'de-DE',
      description: 'Kostenloser Wärmepumpen-Rechner ohne Anmeldung: ermittelt aus Wohnfläche, Baualtersklasse, Gebäudeart und dem bisherigen Energieverbrauch die Heizlast, die erforderliche Heizleistung, die geschätzte Jahresarbeitszahl, den Jahresstrombedarf, Speichergrößen und den voraussichtlichen KfW-Zuschuss 458.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      provider: { '@id': SITE + '/#org' }
    });
    nodes.push({
      '@type': 'FAQPage',
      '@id': SITE + URL_OF.rechner + '#faq',
      mainEntity: [
        { '@type': 'Question', name: 'Wie groß muss meine Wärmepumpe sein?', acceptedAnswer: { '@type': 'Answer', text: 'Die Größe richtet sich nach der Heizlast des Gebäudes. Aus dem Jahresverbrauch lässt sie sich am zuverlässigsten ableiten: nutzbare Wärme abzüglich Warmwasser, geteilt durch rund 2.100 Vollbenutzungsstunden. Ohne Verbrauchsangabe rechnet man über Wohnfläche und Baualtersklasse. Übernimmt die Wärmepumpe auch das Warmwasser, kommen etwa 10 Prozent Zuschlag für Speicherladung und Sperrzeiten dazu. Verbindlich ist eine raumweise Heizlastberechnung nach DIN EN 12831.' } },
        { '@type': 'Question', name: 'Wie viel Förderung gibt es 2026 für eine Wärmepumpe?', acceptedAnswer: { '@type': 'Answer', text: 'Über den KfW-Zuschuss 458 gibt es seit dem 21. Juli 2026 eine Grundförderung von 30 Prozent, dazu für selbstnutzende Eigentümer 16 Prozent Klimageschwindigkeitsbonus beim Tausch einer alten Heizung und einen Einkommensbonus von 40, 30 oder 10 Prozent je nach zu versteuerndem Haushaltseinkommen. Die Gesamtförderung ist auf 80 Prozent gedeckelt, die förderfähigen Kosten der ersten Wohneinheit auf 28.000 Euro. Daraus ergibt sich ein Höchstzuschuss von 22.400 Euro. Der Antrag muss vor der Auftragserteilung gestellt werden.' } },
        { '@type': 'Question', name: 'Welche Jahresarbeitszahl erreicht eine Luft-Wasser-Wärmepumpe?', acceptedAnswer: { '@type': 'Answer', text: 'Entscheidend ist die Vorlauftemperatur. Bei 35 Grad über eine Fußbodenheizung sind rund 4,3 realistisch, bei 45 Grad etwa 3,6 und bei 55 Grad über Bestandsheizkörper nur noch rund 3,0. Warmwasserbereitung über dieselbe Wärmepumpe senkt den Jahreswert um etwa 0,2. Größere Heizflächen und ein hydraulischer Abgleich sind deshalb meist die wirtschaftlichste Maßnahme.' } },
        { '@type': 'Question', name: 'Braucht eine Wärmepumpe einen Pufferspeicher?', acceptedAnswer: { '@type': 'Answer', text: 'In der Regel ja. Ein Puffer- oder Reihenspeicher mit etwa 20 Litern je Kilowatt Heizleistung, mindestens aber 50 Litern, stellt sicher, dass beim Abtauen genügend Wärme im System ist und die Wärmepumpe nicht ständig taktet. Der Warmwasserspeicher kommt separat dazu und richtet sich nach der Personenzahl.' } }
      ]
    });
  }

  if ((page.ld || []).includes('service')) {
    nodes.push({
      '@type': 'Service',
      '@id': SITE + URL_OF.check + '#angebotscheck',
      name: 'Angebots-Check für Photovoltaik & Wärmepumpe',
      serviceType: 'Unabhängige Angebotsprüfung',
      provider: { '@id': SITE + '/#org' },
      areaServed: { '@type': 'Country', name: 'Deutschland' },
      description: 'Kostenlose, unabhängige Prüfung eines bereits vorliegenden Angebots für Photovoltaik, Stromspeicher oder Wärmepumpe auf Seriosität, Effizienz und Fairness – Rückmeldung innerhalb von 24 Stunden, inklusive Vermittlung eines geprüften, vertrauenswürdigen Installationspartners.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }
    });
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }, null, 2);
}

/* ------------------------------------------------------------ Seite bauen */

function buildPage(page) {
  const url = SITE + URL_OF[page.key];
  const view = webpPicture(fixLinks(VIEWS[page.key])
    // Der Angebots-Check springt nach dem Upload auf seine eigene Seite zurueck.
    // Unabhaengig davon, welche Adresse in der Quelldatei steht.
    .replace(/value="https?:\/\/[^"]*checkok=1[^"]*"/g,
             'value="' + SITE + URL_OF.check + '?checkok=1"'));

  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.desc)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="author" content="Brotherhooddeen UG (haftungsbeschränkt)">
<meta name="geo.region" content="DE-BE">
<meta name="geo.placename" content="Berlin">
<link rel="canonical" href="${url}">${GSC_TOKEN ? '\n<meta name="google-site-verification" content="' + esc(GSC_TOKEN) + '">' : ''}
<!-- Domain-Umzug: nur die Konstante SITE in build.js aendern, dann "node build.js" -->
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/icon-512.png" sizes="512x512" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="BHD – Beratung Heimenergie Deutschland">
<meta property="og:title" content="${esc(page.ogTitle || page.title)}">
<meta property="og:description" content="${esc(page.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="de_DE">
<meta property="og:image" content="${SITE}/assets/og-bhd.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="BHD – Beratung Heimenergie Deutschland: Photovoltaik und Wärmepumpe, unabhängige Beratung für Hausbesitzer">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/assets/og-bhd.png">
<meta name="theme-color" content="#f6f5f1">
<script type="application/ld+json">
${jsonLd(page)}
</script>
${STYLE_INLINE}
<link rel="preload" href="/assets/site.css?v=${ASSET_V}" as="style">
<link rel="stylesheet" href="/assets/site.css?v=${ASSET_V}">
</head><body data-page="${page.key}"${GA4_ID ? ' data-ga="' + esc(GA4_ID) + '"' : ''}>
<a class="skip" href="#inhalt">Zum Inhalt springen</a>

${SPRITE}

${NAV_OUT}

<main id="inhalt">
${view}
</main>

${FOOTER_OUT}

<script src="/assets/site.js?v=${ASSET_V}" defer></script>

${QUICK_OUT}
</body></html>
`;
}

/* ------------------------------------- CSS und JS als eigene Dateien
 * Vorher steckten rund 56 KB CSS und 27 KB JavaScript in JEDER Seite und
 * mussten bei jedem Seitenwechsel neu uebertragen werden. Als eigene Dateien
 * laedt der Browser sie genau einmal und nimmt sie danach aus dem Zwischen-
 * speicher. Der `?v=`-Anhang aendert sich mit dem Inhalt, damit nach einer
 * Aenderung sicher die neue Fassung geladen wird und nicht die alte.
 */
const CSS_OUT = STYLE_MAIN.replace(/^<style>\n?/, '').replace(/<\/style>$/, '') +
  '\n/* <picture> soll das Layout nicht beeinflussen – die bestehenden\n' +
  '   Regeln greifen dadurch weiterhin direkt auf das <img>. */\n' +
  'picture{display:contents}\n';
const JS_OUT = SCRIPT;
const ASSET_V = require('crypto').createHash('md5')
  .update(CSS_OUT + JS_OUT).digest('hex').slice(0, 8);

fs.mkdirSync(path.join(ROOT, 'assets'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'assets', 'site.css'), CSS_OUT, 'utf8');
fs.writeFileSync(path.join(ROOT, 'assets', 'site.js'), JS_OUT, 'utf8');

/* ------------------------------------------------------------- Schreiben */

let written = [];
PAGES.forEach(p => {
  const dir = p.dir ? path.join(ROOT, p.dir) : ROOT;
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'index.html');
  fs.writeFileSync(file, buildPage(p), 'utf8');
  written.push([URL_OF[p.key], Math.round(fs.statSync(file).size / 1024) + ' KB']);
});

/* sitemap.xml */
/* lastmod je Seite aus dem Änderungsdatum der erzeugten Datei – so stimmt es
 * automatisch und muss nicht von Hand gepflegt werden. */
/* Die Referenzfotos zusaetzlich als <image:image> melden. Bei Handwerks-
 * leistungen kommt ein spuerbarer Teil des Verkehrs ueber die Bildersuche,
 * und die Fotos sind der glaubwuerdigste Inhalt der Website. */
function bildEintraege(key) {
  if (key !== 'ref') return '';
  const dir = path.join(ROOT, 'assets', 'referenzen');
  if (!fs.existsSync(dir)) return '';
  return fs.readdirSync(dir)
    .filter(f => /\.jpg$/i.test(f))
    .sort()
    .map(f => '    <image:image>\n' +
               '      <image:loc>' + SITE + '/assets/referenzen/' + f + '</image:loc>\n' +
               '    </image:image>\n')
    .join('');
}

const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
  '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
  PAGES.map(p => {
    const datei = path.join(ROOT, p.dir || '', 'index.html');
    const lastmod = fs.statSync(datei).mtime.toISOString().slice(0, 10);
    return '  <url>\n' +
      '    <loc>' + SITE + URL_OF[p.key] + '</loc>\n' +
      '    <lastmod>' + lastmod + '</lastmod>\n' +
      '    <changefreq>' + (p.key === 'home' ? 'weekly' : 'monthly') + '</changefreq>\n' +
      '    <priority>' + p.prio + '</priority>\n' +
      bildEintraege(p.key) +
      '  </url>\n';
  }).join('') +
  '</urlset>\n';
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

/* robots.txt */
fs.writeFileSync(path.join(ROOT, 'robots.txt'),
  'User-agent: *\nAllow: /\n\nSitemap: ' + SITE + '/sitemap.xml\n', 'utf8');

/* ---------------------------------------------- Dateien fuer Suche und KI */

/* IndexNow-Schluessel: Bing prueft diese Datei, bevor es eine Meldung annimmt. */
fs.writeFileSync(path.join(ROOT, INDEXNOW_KEY + '.txt'), INDEXNOW_KEY + '\n', 'utf8');

/* security.txt nach RFC 9116 – reines Vertrauenssignal, kostet nichts. */
const ablauf = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 19) + 'Z';
fs.mkdirSync(path.join(ROOT, '.well-known'), { recursive: true });
fs.writeFileSync(path.join(ROOT, '.well-known', 'security.txt'),
  'Contact: mailto:' + MAIL + '\n' +
  'Expires: ' + ablauf + '\n' +
  'Preferred-Languages: de, en\n' +
  'Canonical: ' + SITE + '/.well-known/security.txt\n', 'utf8');

/* llms.txt – beschreibt das Unternehmen in Klartext fuer KI-Systeme.
 * Noch kein offizieller Standard, aber von mehreren Anbietern ausgewertet
 * und ohne Risiko fuer die klassische Suche. */
const beitraegeTxt = PAGES.filter(p => p.article)
  .map(p => '- [' + p.article.headline + '](' + SITE + URL_OF[p.key] + ')').join('\n');
fs.writeFileSync(path.join(ROOT, 'llms.txt'),
`# BHD – Beratung Heimenergie Deutschland

> Unabhängige Beratung für Hausbesitzer zu Photovoltaik, Stromspeicher und
> Wärmepumpe. Vermittlung geprüfter, regionaler Fachbetriebe. Wir verkaufen
> keine Anlagen, sondern beraten und vermitteln.
>
> Betreiber: Brotherhooddeen UG (haftungsbeschränkt), Prinzenallee 44b,
> 13359 Berlin. Handelsregister: Amtsgericht Charlottenburg, HRB 266273 B.
> USt-IdNr. DE370268782. Gegründet 2024. Geschäftsführer: Kürşat Yıldırım.
> Sitz in Berlin, bundesweit tätig. Erreichbar ${OPENING.text}.

## Leistungen
- [Photovoltaik](${SITE}${URL_OF.pv}): Anlagengröße, Eigenverbrauch, 0 % Umsatzsteuer nach § 12 Abs. 3 UStG
- [Stromspeicher](${SITE}${URL_OF.speicher}): sinnvolle Kapazität, nutzbare Kapazität, Zyklengarantie
- [Wärmepumpe](${SITE}${URL_OF.wp}): Eignung im Altbau, Vorlauftemperatur, KfW-Zuschuss 458 bis 80 %
- [Kosten](${SITE}${URL_OF.kosten}): marktübliche Preise und Eigenanteil nach Förderung
- [Angebots-Check](${SITE}${URL_OF.check}): kostenlose Prüfung eines vorliegenden Angebots, Rückmeldung in 24 Stunden
- [Wärmepumpen-Rechner](${SITE}${URL_OF.rechner}): Heizlast, Gerätegröße, Jahresarbeitszahl und Förderung – ohne Anmeldung

## Ratgeber
${beitraegeTxt}

## Weitere Seiten
- [Referenzen](${SITE}${URL_OF.ref}): umgesetzte Projekte mit eigenen Fotos
- [Über uns](${SITE}${URL_OF.about})
- [Kontakt](${SITE}${URL_OF.kontakt})
- [Für Fachbetriebe](${SITE}${URL_OF.partner})

## Kontakt
Telefon +49 163 4440392 · ${MAIL}
`, 'utf8');

console.log('Erzeugt:');
written.forEach(w => console.log('  ' + w[0].padEnd(18) + w[1]));
console.log('  /sitemap.xml       ' + PAGES.length + ' Adressen');
console.log('  /robots.txt');
console.log('  /llms.txt');
console.log('  /.well-known/security.txt');
console.log('  /' + INDEXNOW_KEY + '.txt  (IndexNow)');
if (!GSC_TOKEN) console.log('\nHinweis: GSC_TOKEN ist leer – Search Console noch nicht per Meta-Tag bestätigt.');
if (!GA4_ID) console.log('Hinweis: GA4_ID ist leer – Analytics und Einwilligungsbanner bleiben inaktiv.');
if (!SOCIAL.length) console.log('Hinweis: SOCIAL ist leer – sameAs fehlt im JSON-LD.');
