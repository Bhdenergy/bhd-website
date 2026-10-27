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
/* Häufige Fragen für die Seiten, die keinen eigenen Block in src/site.html
 * haben. Das Schema entsteht davon unabhängig aus dem sichtbaren HTML. */
const { faqHtml } = require('./faq');
/* Kurzantworten und Quellen fuer KI-Suchen (GEO), siehe geo.js. */
const { KURZ, QUELLEN, BELEG_HOSTS, GEO_CSS } = require('./geo');

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

/* Google-Unternehmensprofil (angelegt Okt. 2026). CID und Knowledge-Graph-ID
 * aus Google Maps ausgelesen. Steht in sameAs/hasMap und auf der Kontaktseite. */
const GOOGLE_CID = '17443850458843580917';
const GOOGLE_KG = '/g/11nw0q10b9';
const GOOGLE_MAPS = 'https://www.google.com/maps?cid=' + GOOGLE_CID;
const PROFILE = [GOOGLE_MAPS, 'https://www.google.com/search?kgmid=' + GOOGLE_KG, ...SOCIAL];

/* IndexNow: meldet neue und geaenderte Seiten sofort an Bing (und damit an
 * ChatGPT Search und Copilot). Der Schluessel ist frei waehlbar, muss aber als
 * Datei <schluessel>.txt im Wurzelverzeichnis liegen – das erledigt der Build. */
const INDEXNOW_KEY = 'bhd7f3a1c94e26d508b1a2f6c3e9740b';

/* ---------------------------------------------------------------------
 * TERMINBUCHUNG UEBER CAL.COM
 *
 * Hier den eigenen Cal.com-Link eintragen, OHNE "https://cal.com/" davor.
 * Beispiel:  const CAL_LINK = 'bhd-energie/telefonberatung';
 *
 * Solange der Wert leer ist, bleibt das bisherige eigene Terminformular
 * stehen. Sobald er gesetzt ist, ersetzt der Cal.com-Buchungskalender das
 * Formular - dann werden gebuchte Zeiten wirklich gesperrt und der Kunde
 * bekommt automatisch eine Bestaetigung.
 * ------------------------------------------------------------------- */
const CAL_LINK = '';

/* Erreichbarkeit – steht im JSON-LD, auf der Kontaktseite und muss mit dem
 * Google-Unternehmensprofil uebereinstimmen. */
const OPENING = {
  text: 'Mo–Fr 9:00 – 18:00 Uhr, Sa 10:00 – 15:00 Uhr',
  spec: [
    { tage: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], von: '09:00', bis: '18:00' },
    { tage: ['Saturday'], von: '10:00', bis: '15:00' }
  ]
};

/* Datum des letzten inhaltlichen Durchgangs – fuer dateModified im JSON-LD. */
const REVIEWED = new Date().toISOString().slice(0, 10);

/* Echtes Aenderungsdatum je Seite. Vorher bekam jede Seite bei jedem Build
 * das heutige Datum, auch ohne inhaltliche Aenderung. KI-Suchen und Google
 * gewichten Aktualitaet, ein Datum, das sich ohne Grund bewegt, ist aber
 * wertlos. stand.json merkt sich je Seite einen Hash des Inhalts; das Datum
 * springt nur, wenn sich der Inhalt wirklich aendert. Datei mit committen. */
const STAND_FILE = path.join(ROOT, 'stand.json');
const STAND = fs.existsSync(STAND_FILE) ? JSON.parse(fs.readFileSync(STAND_FILE, 'utf8')) : {};
function standFuer(key, inhalt) {
  const hash = require('crypto').createHash('md5').update(inhalt).digest('hex');
  if (!STAND[key] || STAND[key].hash !== hash) STAND[key] = { hash, datum: REVIEWED };
  return STAND[key].datum;
}
function datumDe(iso) {
  const [j, m, t] = iso.split('-');
  return t + '.' + m + '.' + j;
}

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
    title: 'Angebots-Check: PV- & Wärmepumpen-Angebot prüfen | BHD',
    desc: 'Angebot für Photovoltaik oder Wärmepumpe kostenlos prüfen lassen, bundesweit: Seriosität, Auslegung und Preis. Rückmeldung in der Regel in 24 Stunden.',
    ld: ['service'],
    service: {
      name: "Kostenloser Angebots-Check",
      typ: "Unabhängige Angebotsprüfung",
      desc: "Prüfung eines vorliegenden Angebots für Photovoltaik, Stromspeicher oder Wärmepumpe auf Seriosität des Anbieters, technische Auslegung und Preis-Leistungs-Verhältnis, mit Rückmeldung innerhalb von 24 Stunden."
    }
  },
  {
    key: 'bestand', dir: 'bestandsanlagen-check', view: 'view-bestand', prio: '0.9',
    crumb: 'Bestandsanlagen-Check',
    title: 'Bestandsanlagen-Check: Hilfe bei Mängeln & Baustopp | BHD',
    ogTitle: 'Anlage schon gebaut und es hakt? Bestandsanlagen-Check | BHD',
    desc: 'PV-Anlage oder Wärmepumpe schon installiert und es hakt: Mängel, Baustopp, insolvente Firma, fehlende Anmeldung oder kein Wartungsvertrag. Wir schauen drauf.',
    ld: ['bestandservice']
  },
  {
    key: 'termin', dir: 'termin', view: 'view-termin', prio: '0.9', crumb: 'Termin',
    title: 'Termin vereinbaren – Telefonberatung kostenlos | BHD',
    ogTitle: 'Beratungstermin online anfragen – kostenlos | BHD',
    desc: 'Beratungstermin zu Photovoltaik oder Wärmepumpe online anfragen. Telefontermin kostenlos, auf Wunsch auch vor Ort. Antwort am selben Werktag.'
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
    title: 'Photovoltaik Einfamilienhaus: Kosten, Größe, Förderung | BHD',
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
    title: 'Was kostet eine Photovoltaikanlage oder Wärmepumpe? | BHD',
    ogTitle: 'Preise offen genannt – Photovoltaik & Wärmepumpe | BHD',
    desc: 'Marktübliche Preise für Photovoltaik, Stromspeicher und Wärmepumpe, Stand 2026. Mit Beispielrechnung zum Eigenanteil nach der KfW-Förderung.',
    service: {
      name: "Kosteneinschätzung für Photovoltaik und Wärmepumpe",
      typ: "Kostenberatung",
      desc: "Einordnung marktüblicher Preise für Photovoltaikanlagen, Stromspeicher, Luft-Wasser-Wärmepumpen, Wallboxen und Zählerschränke sowie Berechnung des Eigenanteils nach Abzug der KfW-Förderung."
    }
  },
  {
    /* Standortseite. Alle Zahlen am 14.09.2026 gegen amtliche Quellen geprueft
     * (Quellenliste steht sichtbar auf der Seite). SolarPLUS-Richtlinie laeuft
     * am 31.12.2026 aus, Klimabonus sinkt am 01.02.2027 -> dann ueberarbeiten. */
    key: 'berlin', dir: 'photovoltaik-waermepumpe-berlin', view: 'view-berlin', prio: '0.9',
    crumb: 'Photovoltaik & Wärmepumpe in Berlin',
    title: 'PV & Wärmepumpe Berlin: Förderung, SolarPLUS, Pflicht | BHD',
    ogTitle: 'Photovoltaik und Wärmepumpe in Berlin – was hier gilt | BHD',
    desc: 'Solaranlage oder Wärmepumpe in Berlin: wann die Solarpflicht greift, welche SolarPLUS-Zuschüsse es gibt und was beim Denkmalschutz gilt.',
    service: {
      name: 'Beratung zu Photovoltaik und Wärmepumpe in Berlin',
      typ: 'Photovoltaik- und Wärmepumpen-Beratung',
      desc: 'Beratung für Berliner Hausbesitzer zu Solaranlage, Stromspeicher und Wärmepumpe: Pflichten nach dem Solargesetz Berlin, Zuschüsse aus dem Landesprogramm SolarPLUS, Genehmigung bei Baudenkmalen, Anmeldung bei Stromnetz Berlin und KfW-Zuschuss 458 für Wärmepumpen.'
    }
  },
  {
    /* Standortseite Brandenburg. Rechtsstand am 23.09.2026 woertlich gegen die
     * Brandenburgische Bauordnung geprueft (BRAVORS, Fassung vom 29.06.2026):
     * keine Solarpflicht, § 61 stellt Solaranlagen verfahrensfrei.
     * Wieder anfassen: KfW-Absenkung 01.02.2027, Potsdamer Programm-Status. */
    key: 'brandenburg', dir: 'photovoltaik-waermepumpe-brandenburg', view: 'view-brandenburg',
    prio: '0.9', crumb: 'Photovoltaik & Wärmepumpe in Brandenburg',
    title: 'Photovoltaik & Wärmepumpe Brandenburg: Förderung | BHD',
    ogTitle: 'Photovoltaik und Wärmepumpe in Brandenburg – was hier gilt | BHD',
    desc: 'Solaranlage in Brandenburg: keine Solarpflicht, keine Baugenehmigung nach § 61 BbgBO, kein Landeszuschuss. Was stattdessen gilt und was die KfW zahlt.',
    service: {
      name: 'Beratung zu Photovoltaik und Wärmepumpe in Brandenburg',
      typ: 'Photovoltaik- und Wärmepumpen-Beratung',
      desc: 'Beratung für Hausbesitzer in Brandenburg zu Solaranlage, Stromspeicher und Wärmepumpe: Verfahrensfreiheit nach § 61 der Brandenburgischen Bauordnung, Abstandsflächen und Brandwandabstände nach § 6 BbgBO, kommunale Förderprogramme, Anmeldung beim zuständigen Netzbetreiber und KfW-Zuschuss 458 für Wärmepumpen.'
    }
  },
  {
    /* Zeitkritische Seite: Klimageschwindigkeitsbonus und Foerderhoechstbetrag
     * sinken am 01.02.2027. Alle Werte am 23.09.2026 woertlich aus dem Merkblatt
     * KfW 458 (Stand 07/2026) uebernommen, Rechenbeispiele nachgerechnet.
     * ZWINGEND zum 01.02.2027 ueberarbeiten - dann 12 % und 27.250 EUR. */
    key: 'foerderung2027', dir: 'waermepumpe-foerderung-2027', view: 'view-foerderung2027',
    prio: '0.9', crumb: 'Förderung sinkt 2027',
    title: 'Wärmepumpen-Förderung sinkt 2027: was das kostet | BHD',
    ogTitle: 'Am 1. Februar 2027 sinkt die Wärmepumpen-Förderung | BHD',
    desc: 'Am 1. Februar 2027 sinken Klimabonus und Förderhöchstbetrag der KfW 458. Für einen typischen Haushalt rund 1.400 € weniger. Mit Rechenbeispielen.',
    service: {
      name: 'Unterstützung bei der KfW-Förderbeantragung für Wärmepumpen',
      typ: 'Förderberatung Wärmepumpe',
      desc: 'Begleitung des Zuschussantrags nach KfW 458: Ermittlung des erreichbaren Fördersatzes aus Grundförderung, Klimageschwindigkeitsbonus und Einkommensbonus, Bestätigung zum Antrag (BzA), Vertragsgestaltung mit aufschiebender Bedingung und Bestätigung nach Durchführung (BnD).'
    }
  },
  {
    /* Fristen und Sanktionen am 23.09.2026 gegen Bundesnetzagentur und
     * MaStR-Webhilfe geprueft. Sanktion nur beim Doppelverstoss nach
     * § 52 Abs. 1 Nr. 11 EEG 2023. Keine ungeprueften Bussgeld-Zahlen ergaenzen. */
    key: 'mastr', dir: 'photovoltaik-anmelden-marktstammdatenregister', view: 'view-mastr',
    prio: '0.8', crumb: 'Anlage anmelden',
    title: 'Solaranlage anmelden: Marktstammdatenregister & Frist | BHD',
    ogTitle: 'Solaranlage anmelden – Frist, Folgen und wie Sie es nachholen | BHD',
    desc: 'Photovoltaik im Marktstammdatenregister anmelden: ein Monat Frist ab Inbetriebnahme. Was eine versäumte Frist kostet und wie Sie sie nachholen.',
    ld: ['service'],
    service: {
      name: 'Prüfung der Anmeldung von Photovoltaikanlagen',
      typ: 'Anlagenprüfung',
      desc: 'Prüfung, ob eine bestehende Photovoltaikanlage ordnungsgemäß im Marktstammdatenregister der Bundesnetzagentur und beim Netzbetreiber angemeldet ist, und Unterstützung beim Nachholen einer versäumten Registrierung.'
    }
  },
  {
    /* Fakten am 13.10.2026 gegen NAV, BNetzA, BMF und Stromnetz-Berlin-Preisblatt
     * 2026 geprueft. Netzentgeltbetraege jaehrlich zum 01.01. nachziehen. */
    key: 'wallbox', dir: 'wallbox', view: 'view-wallbox', prio: '0.8', crumb: 'Wallbox',
    title: 'Wallbox für das Eigenheim: Anmeldung, § 14a, Kosten | BHD',
    ogTitle: 'Wallbox zu Hause – was Sie vor dem Kauf wissen sollten | BHD',
    desc: 'Wallbox im Eigenheim: Anmeldung beim Netzbetreiber, 11 oder 22 kW, weniger Netzentgelt nach § 14a EnWG. Kein Zuschuss, keine 0 % Mehrwertsteuer.',
    service: {
      name: 'Beratung zur Wallbox im Eigenheim',
      typ: 'Wallbox-Beratung',
      desc: 'Beratung zur Wallbox im Einfamilienhaus: Ladeleistung, Anmeldung und Zustimmung beim Netzbetreiber nach § 19 NAV, Netzentgeltmodule nach § 14a EnWG, Laden mit Solarstrom und Prüfung von Wallbox-Angeboten.'
    }
  },
  {
    /* Ortsseite, Fakten am 13.10.2026 gegen amtliche Quellen geprueft (Liste
     * steht auf der Seite). Wieder anfassen: KfW-Absenkung 01.02.2027, Antragsstatus Klimaschutzfoerderprogramm (Frist jeweils 31.10.). */
    key: 'potsdam', dir: 'photovoltaik-waermepumpe-potsdam', view: 'view-potsdam', prio: '0.8',
    crumb: 'Potsdam',
    title: 'Photovoltaik & Wärmepumpe Potsdam: Förderung & Regeln | BHD',
    ogTitle: 'Photovoltaik und Wärmepumpe in Potsdam | BHD',
    desc: 'Solaranlage und Wärmepumpe in Potsdam: städtisches Förderprogramm, Denkmalbereiche und Welterbe, Fernwärmesatzung und Netzgesellschaft Potsdam.',
    service: {
      name: 'Beratung zu Photovoltaik und Wärmepumpe in Potsdam',
      typ: 'Photovoltaik- und Wärmepumpen-Beratung',
      desc: 'Beratung für Hausbesitzer in Potsdam zu Solaranlage, Stromspeicher und Wärmepumpe: Klimaschutzförderprogramm der Landeshauptstadt, Denkmal- und Gestaltungssatzungen, kommunaler Wärmeplan und Fernwärmesatzung, Anmeldung bei der Netzgesellschaft Potsdam und KfW-Zuschuss 458.'
    }
  },
  {
    /* Ortsseite, Fakten am 13.10.2026 gegen amtliche Quellen geprueft (Liste
     * steht auf der Seite). Wieder anfassen: KfW-Absenkung 01.02.2027. */
    key: 'falkensee', dir: 'photovoltaik-waermepumpe-falkensee', view: 'view-falkensee', prio: '0.8',
    crumb: 'Falkensee',
    title: 'Photovoltaik & Wärmepumpe Falkensee: was hier gilt | BHD',
    ogTitle: 'Photovoltaik und Wärmepumpe in Falkensee | BHD',
    desc: 'Solaranlage und Wärmepumpe in Falkensee: was der Wärmeplan fürs Eigenheim bedeutet, Anmeldung bei E.DIS, Gestaltungssatzung Falkenhagen, KfW-Zuschuss.',
    service: {
      name: 'Beratung zu Photovoltaik und Wärmepumpe in Falkensee',
      typ: 'Photovoltaik- und Wärmepumpen-Beratung',
      desc: 'Beratung für Hausbesitzer in Falkensee zu Solaranlage, Stromspeicher und Wärmepumpe: kommunaler Wärmeplan, Fernwärmesatzung Falkenhorst, Gestaltungssatzung Angerdorf Falkenhagen, Anmeldung bei E.DIS Netz und KfW-Zuschuss 458.'
    }
  },
  {
    /* Ortsseite, Fakten am 13.10.2026 gegen amtliche Quellen geprueft (Liste
     * steht auf der Seite). Wieder anfassen: KfW-Absenkung 01.02.2027. */
    key: 'bernau', dir: 'photovoltaik-waermepumpe-bernau', view: 'view-bernau', prio: '0.8',
    crumb: 'Bernau',
    title: 'Photovoltaik & Wärmepumpe Bernau: was hier gilt | BHD',
    ogTitle: 'Photovoltaik und Wärmepumpe in Bernau | BHD',
    desc: 'Solaranlage und Wärmepumpe in Bernau: warum das Eigenheim vom Fernwärme-Anschlusszwang befreit ist, Altstadtsatzungen, Stadtwerke Bernau, KfW-Zuschuss.',
    service: {
      name: 'Beratung zu Photovoltaik und Wärmepumpe in Bernau',
      typ: 'Photovoltaik- und Wärmepumpen-Beratung',
      desc: 'Beratung für Hausbesitzer in Bernau bei Berlin zu Solaranlage, Stromspeicher und Wärmepumpe: Fernwärmesatzung und Befreiung für selbst genutzte Häuser, Denkmal- und Gestaltungssatzungen, Anmeldung bei den Stadtwerken Bernau und KfW-Zuschuss 458.'
    }
  },
  {
    /* Ortsseite, Fakten am 13.10.2026 gegen amtliche Quellen geprueft (Liste
     * steht auf der Seite). Wieder anfassen: KfW-Absenkung 01.02.2027, Stand Waermeplan (Beschluss offen). */
    key: 'oranienburg', dir: 'photovoltaik-waermepumpe-oranienburg', view: 'view-oranienburg', prio: '0.8',
    crumb: 'Oranienburg',
    title: 'Photovoltaik & Wärmepumpe Oranienburg: was hier gilt | BHD',
    ogTitle: 'Photovoltaik und Wärmepumpe in Oranienburg | BHD',
    desc: 'Solaranlage und Wärmepumpe in Oranienburg: Kampfmittel bei Erdarbeiten, zwei Netzbetreiber je nach Ortsteil, Wärmeplanung und Erhaltungssatzung.',
    service: {
      name: 'Beratung zu Photovoltaik und Wärmepumpe in Oranienburg',
      typ: 'Photovoltaik- und Wärmepumpen-Beratung',
      desc: 'Beratung für Hausbesitzer in Oranienburg zu Solaranlage, Stromspeicher und Wärmepumpe: Kampfmittelauskunft vor Erdarbeiten, Stadtwerke Oranienburg oder E.DIS Netz je nach Ortsteil, Wärmeplanung, Erhaltungssatzung Innenstadt und KfW-Zuschuss 458.'
    }
  },
  {
    key: 'ratgeber', dir: 'ratgeber', view: 'view-ratgeber', prio: '0.7', crumb: 'Ratgeber',
    title: 'Ratgeber Photovoltaik & Wärmepumpe: Kosten, Förderung | BHD',
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
    title: 'Wärmepumpe im Altbau: ist das möglich? | BHD Ratgeber',
    desc: 'Der Selbsttest an einem kalten Tag, warum die Vorlauftemperatur über 500 Euro im Jahr entscheidet und weshalb Dämmung selten der günstigste Hebel ist.',
    article: { headline: 'Wärmepumpe im Altbau: ist das möglich?', pub: '2026-08-01', section: 'Wärmepumpe' }
  },
  {
    key: 'rat-check', dir: 'ratgeber/angebot-pruefen', view: 'view-rat-check', prio: '0.8', crumb: 'Angebot prüfen',
    title: 'PV-Angebot prüfen: 12-Punkte-Checkliste | BHD Ratgeber',
    desc: 'Checkliste für PV- und Wärmepumpen-Angebote: zwölf Angaben, die enthalten sein müssen, und drei Warnzeichen, bei denen Sie besser nicht unterschreiben.',
    article: { headline: 'Angebot prüfen: 12 Punkte, die drinstehen müssen', pub: '2026-08-01', section: 'Angebotsprüfung' }
  },
  {
    key: 'rat-eeg', dir: 'ratgeber/einspeiseverguetung', view: 'view-rat-eeg', prio: '0.8', crumb: 'Einspeisevergütung',
    title: 'Einspeisevergütung 2026 und was ab 2027 kommt | BHD Ratgeber',
    desc: 'Einspeisevergütung bis Ende 2026: 7,70 ct bei Teileinspeisung bis 10 kW. Ab 2027 soll die feste Vergütung für neue Anlagen entfallen. Was geplant ist.',
    article: { headline: 'Einspeisevergütung 2026 und was ab 2027 kommt', pub: '2026-10-13', section: 'Photovoltaik' }
  },
  {
    key: 'rat-pvwp', dir: 'ratgeber/photovoltaik-waermepumpe-kombinieren', view: 'view-rat-pvwp', prio: '0.8', crumb: 'PV und Wärmepumpe',
    title: 'PV und Wärmepumpe kombinieren: was es bringt | BHD Ratgeber',
    desc: 'Wie viel Wärmepumpenstrom vom eigenen Dach kommt, was im Winter passiert und ob sich ein eigener Zähler lohnt. Mit Messwerten des Fraunhofer ISE.',
    article: { headline: 'Photovoltaik und Wärmepumpe: wie gut passen sie zusammen?', pub: '2026-10-13', section: 'Wärmepumpe' }
  },
  {
    key: 'rat-speicher', dir: 'ratgeber/stromspeicher-nachruesten', view: 'view-rat-speicher', prio: '0.8', crumb: 'Speicher nachrüsten',
    title: 'Stromspeicher nachrüsten: Kosten & Ablauf | BHD Ratgeber',
    desc: 'Speicher zur bestehenden Solaranlage nachrüsten: AC oder DC, 0 % Mehrwertsteuer auch beim Nachrüsten, Anmeldung im MaStR und wann es sich lohnt.',
    article: { headline: 'Stromspeicher nachrüsten: was Sie wissen müssen', pub: '2026-10-13', section: 'Stromspeicher' }
  },
  {
    key: 'rechner', dir: 'waermepumpen-rechner', view: 'view-rechner', prio: '0.9', crumb: 'Wärmepumpen-Rechner',
    title: 'Wärmepumpe berechnen: Größe in kW & Förderung | BHD',
    ogTitle: 'Kostenloser Wärmepumpen-Rechner – Größe & Förderung | BHD',
    desc: 'Wärmepumpe berechnen: Heizlast, Größe in kW, Speicher und KfW-Förderung aus Ihren Gebäudedaten. Mit kW-Tabelle für 100 bis 250 m². Kostenlos.',
    ld: ['rechner']
  },
  {
    key: 'rendite', dir: 'rentabilitaetsrechner', view: 'view-rendite', prio: '0.9',
    crumb: 'Rentabilitätsrechner',
    title: 'Rentabilitätsrechner: Lohnt sich PV oder Wärmepumpe? | BHD',
    ogTitle: 'Rechnet sich Photovoltaik oder eine Wärmepumpe? Jetzt rechnen | BHD',
    desc: 'Kostenloser Rentabilitätsrechner für Photovoltaik und Wärmepumpe: Ersparnis pro Jahr, Einspeisevergütung, KfW-Zuschuss und Amortisationszeit.',
    ld: ['rendite']
  },
  {
    key: 'ask', dir: 'anfragen', view: 'view-ask', prio: '0.9', crumb: 'Anfragen',
    title: 'Kostenloses Angebot für Photovoltaik & Wärmepumpe | BHD',
    desc: 'Kostenloses Angebot für Photovoltaik, Stromspeicher oder Wärmepumpe anfordern. Unabhängige Beratung und geprüfte Fachbetriebe aus Ihrer Region.'
  },
  {
    key: 'kontakt', dir: 'kontakt', view: 'view-kontakt', prio: '0.8', crumb: 'Kontakt',
    title: 'Kontakt: Beratung Photovoltaik & Wärmepumpe Berlin | BHD',
    ogTitle: 'Kontakt – direkt mit einem Berater sprechen | BHD',
    desc: 'BHD erreichen Sie Mo–Fr 9–18 Uhr und Sa 10–15 Uhr: per Kontaktformular, Telefon 0163 4440392, WhatsApp oder E-Mail. Sitz in Berlin, Beratung bundesweit.',
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
/* Auch im Skript stecken die Adresse und der Cal.com-Link. Das Skript wird
 * nur EINMAL gebaut, calUmschalten() greift dort also nicht - die Ersetzung
 * muss hier passieren. */
const SCRIPT = buildScript()
  .split(MAIL_IN_SOURCE).join(MAIL)
  .split('__CAL_LINK__').join(CAL_LINK);

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
      // Ziffern muessen mit rein: Seitenschluessel wie "foerderung2027" sind
      // sonst still ohne href geblieben - der Link sah aus wie ein Link, war
      // aber keiner. Gefunden von tools/pruef-live.js am 23.09.2026.
      const m = tag.match(/\sdata-nav="([a-z0-9-]+)"/);
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

    /* data-sizes am <img> ueberschreibt die Kartenwerte – etwa fuer ein Foto
     * im Kopfbereich, das deutlich breiter als eine Referenzkarte ist. */
    const eigen = tag.match(/\sdata-sizes="([^"]+)"/);
    const kette = stufen.map(s => s.datei + ' ' + s.b + 'w');
    /* Die volle WebP-Fassung als groesste Stufe dazunehmen, wenn sie breiter
     * ist als die 800er. Sonst wurden grosse Fotos (halbe Bildschirmbreite)
     * aus der 800er-Datei hochskaliert und wirkten unscharf. */
    const breite = Number((tag.match(/\swidth="(\d+)"/) || [])[1] || 0);
    if (breite > stufen[stufen.length - 1].b) kette.push(webp + ' ' + breite + 'w');
    const srcset = kette.join(', ');
    return '<picture><source type="image/webp" srcset="' + srcset +
           '" sizes="' + (eigen ? eigen[1] : BILD_SIZES) + '">' + tag.replace(/\sdata-sizes="[^"]+"/, '') + '</picture>';
  });
}

/* Das schliessende </div> der Marke muss zu </a> werden – zeilenweise sicher. */
function fixBrandClose(html) {
  return html.replace(
    /<a class="brand" href="\/" data-nav="home" aria-label="Zur Startseite">(<img[^>]*>(?:<span class="brand-txt"[^>]*>[^<]*<br>[^<]*<\/span>)?)<\/div>/g,
    '<a class="brand" href="/" data-nav="home" aria-label="Zur Startseite">$1</a>'
  );
}

const NAV_OUT = webpPicture(fixBrandClose(fixLinks(NAV)));
const FOOTER_OUT = webpPicture(fixBrandClose(fixLinks(FOOTER)));
const QUICK_OUT = fixLinks(QUICK);

/* -------------------------------------------------------- JSON-LD je Seite */

function jsonLd(page, viewHtml) {
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
      alternateName: ['Beratung Heimenergie Deutschland', 'BHD Energie', 'BHD'],
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Prinzenallee 44b',
        postalCode: '13359',
        addressLocality: 'Berlin',
        addressCountry: 'DE'
      },
      // Koordinaten der Geschäftsadresse, per OpenStreetMap ermittelt
      geo: { '@type': 'GeoCoordinates', latitude: 52.55896, longitude: 13.38854 },
      hasMap: GOOGLE_MAPS,
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
      openingHoursSpecification: OPENING.spec.map(o => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: o.tage,
        opens: o.von,
        closes: o.bis
      })),
      /* Nur echte Profile: Google-Unternehmensprofil + SOCIAL. Die Google-
       * Bewertungen bewusst NICHT als aggregateRating (Eigenauszeichnung). */
      sameAs: PROFILE
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
      dateModified: page._stand || REVIEWED,
      /* GEO: dieselben Kernsaetze wie im sichtbaren Kasten und die
       * amtlichen Belege, die auf der Seite verlinkt sind. */
      ...(KURZ[page.key] ? { abstract: KURZ[page.key].join(' ') } : {}),
      ...(belege(viewHtml).length ? { citation: belege(viewHtml) } : {})
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
      dateModified: page._stand || REVIEWED,
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

  /* FAQPage entsteht aus dem sichtbaren Text der Seite – siehe faqAusHtml().
   * Dadurch stimmen Schema und Inhalt zwingend überein, und jede Seite mit
   * einem data-faq-Block bekommt ihr Schema automatisch.
   *
   * Hinweis: Google hat die FAQ-Rich-Results am 07.05.2026 abgeschaltet, das
   * Schema erzeugt also keine Aufklapp-Kästen mehr im Suchergebnis. Es bleibt
   * gültig, wird weiter ausgelesen und hilft beim Verstehen der Seite. */
  const fragen = faqAusHtml(viewHtml || '');
  if (fragen.length) {
    nodes.push({
      '@type': 'FAQPage',
      '@id': SITE + URL_OF[page.key] + '#faq',
      inLanguage: 'de-DE',
      mainEntity: fragen.map(f => ({
        '@type': 'Question',
        name: f.frage,
        acceptedAnswer: { '@type': 'Answer', text: f.antwort }
      }))
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
  }

  if ((page.ld || []).includes('rendite')) {
    nodes.push({
      '@type': 'WebApplication',
      '@id': SITE + URL_OF.rendite + '#app',
      name: 'Rentabilitätsrechner für Photovoltaik und Wärmepumpe',
      url: SITE + URL_OF.rendite,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      inLanguage: 'de-DE',
      description: 'Kostenloser Wirtschaftlichkeitsrechner ohne Anmeldung: berechnet für Photovoltaik den Jahresertrag, den Eigenverbrauch, die gesparten Stromkosten, die Einspeisevergütung und die Amortisationszeit – und für die Wärmepumpe den Heizkostenvergleich, den KfW-Zuschuss 458, den Eigenanteil und die Amortisation. Alle Annahmen sind auf der Seite offengelegt.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      provider: { '@id': SITE + '/#org' }
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

  if ((page.ld || []).includes('bestandservice')) {
    nodes.push({
      '@type': 'Service',
      '@id': SITE + URL_OF.bestand + '#bestandscheck',
      name: 'Bestandsanlagen-Check für Photovoltaik & Wärmepumpe',
      serviceType: 'Prüfung bestehender Anlagen',
      provider: { '@id': SITE + '/#org' },
      areaServed: { '@type': 'Country', name: 'Deutschland' },
      description: 'Ersteinschätzung für bereits gebaute Photovoltaik- und Wärmepumpenanlagen: bei Mängeln und Schäden, unterbrochener Baustelle, insolventem Errichter, fehlender Anmeldung im Marktstammdatenregister, zu geringem Ertrag oder wenn ein Wartungsvertrag fehlt. Telefonische Ersteinschätzung kostenlos, auf Wunsch Vermittlung eines Fachbetriebs zur Übernahme.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR', description: 'Ersteinschätzung kostenlos und unverbindlich' }
    });
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }, null, 2);
}

/* ------------------------------------------------------------ Seite bauen */

/* Schaltet zwischen eigenem Terminformular und Cal.com um. Die beiden
 * Varianten stehen in src/site.html zwischen den Marken <!--CAL:AN--> und
 * <!--CAL:AUS-->; hier faellt die jeweils nicht gewaehlte weg. */
/* Setzt die erzeugten FAQ-Abschnitte an die Stelle der Marke <!--FAQ-->.
 * Seiten ohne Marke oder ohne Daten bleiben unveraendert. */
function faqEinsetzen(html, key) {
  if (html.indexOf('<!--FAQ-->') < 0) return html;
  return html.split('<!--FAQ-->').join(faqHtml(key));
}

/* GEO: Kasten "Das Wichtigste in Kuerze" direkt unter dem Seitenkopf.
 * __STAND__ wird erst nach dem Inhalts-Hash ersetzt (siehe buildPage). */
function kurzHtml(key) {
  return '\n  <section class="kurz" aria-labelledby="kurz-' + key + '"><div class="wrap"><div class="kurz-box">\n' +
    '    <h2 id="kurz-' + key + '">Das Wichtigste in Kürze</h2>\n' +
    '    <ul>\n' + KURZ[key].map(s => '      <li>' + esc(s).replace(/ (€|%|kW|kWh|kWp|Watt|°C)(?=[ .,)]|$)/g, ' $1') + '</li>\n').join('') + '    </ul>\n' +
    '    <p class="kurz-stand">Zuletzt aktualisiert am <time datetime="__STAND_ISO__">__STAND__</time>. Alle Angaben ohne Gewähr.</p>\n' +
    '  </div></div></section>\n';
}
function kurzEinsetzen(html, key) {
  if (!KURZ[key]) return html;
  const i = html.indexOf('</header>');
  if (i < 0) throw new Error('KURZ fuer "' + key + '", aber kein </header> in der Ansicht');
  return html.slice(0, i + 9) + kurzHtml(key) + html.slice(i + 9);
}

/* GEO: Quellenliste fuer Seiten, die im Text noch keine Belege verlinken.
 * Steht vor dem FAQ-Block, sonst vor dem Rueckruf-Formular. */
function quellenEinsetzen(html, key) {
  if (!QUELLEN[key]) return html;
  const block = '\n  <section class="quellen"><div class="wrap"><div>\n' +
    '    <h2>Quellen</h2>\n    <ul>\n' +
    QUELLEN[key].map(q => '      <li><a href="' + q[1] + '" target="_blank" rel="noopener">' + esc(q[0]) + '</a></li>\n').join('') +
    '    </ul>\n  </div></div></section>\n';
  for (const marke of ['<!--FAQ-->', '<!--KURZANFRAGE-->']) {
    const i = html.indexOf(marke);
    if (i >= 0) return html.slice(0, i) + block + html.slice(i);
  }
  return html + block;
}

/* Alle Links auf amtliche und wissenschaftliche Quellen einer Seite,
 * fuer citation im JSON-LD. */
function belege(html) {
  const out = [];
  for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    let host;
    try { host = new URL(m[1].replace(/&amp;/g, '&')).hostname; } catch (e) { continue; }
    if (BELEG_HOSTS.test(host) && !out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

/* ------------------------------------------------ Kurzanfrage / Kontakt
 * Vorher schickte jede Themenseite ihre Besucher zum Anfragen auf die
 * Startseite (/#funnel) – ein kompletter Seitenwechsel genau in dem Moment,
 * in dem jemand anfragen will. Jetzt steht das Formular direkt auf der Seite.
 *
 * Eingesetzt an der Marke <!--KURZANFRAGE--> in src/site.html, VOR fixLinks
 * (der Baustein enthaelt data-nav- und #datenschutz-Verweise). Versand ueber
 * sendLead() in site.js, Block "Kurzanfrage & Kontaktformular".
 * Pro Seite hoechstens EIN Baustein – die ids leiten sich vom Seitenschluessel ab.
 */
const KURZANFRAGE = {
  pv:          { h: 'Passt Solar auf Ihr Dach?', p: 'Hinterlassen Sie Ihre Nummer. Wir rufen zurück und schätzen gemeinsam mit Ihnen ein, welche Anlagengröße sinnvoll ist.', thema: 'Photovoltaik' },
  speicher:    { h: 'Welcher Speicher passt zu Ihrem Verbrauch?', p: 'Nennen Sie uns im Rückruf Ihren Jahresverbrauch, dann sagen wir Ihnen, welche Größe sich rechnet.', thema: 'Stromspeicher' },
  wp:          { h: 'Passt eine Wärmepumpe in Ihr Haus?', p: 'Wir sagen es Ihnen ehrlich, auch wenn die Antwort „noch nicht" lautet. Dazu gehört ein erster Blick auf die KfW-Förderung.', thema: 'Wärmepumpe' },
  kosten:      { h: 'Was kostet es bei Ihnen?', p: 'Sagen Sie uns kurz, worum es geht. Sie bekommen eine Einschätzung für Ihr Haus, kostenlos und unverbindlich.', thema: 'Photovoltaik' },
  ref:         { h: 'Wird Ihr Haus das nächste Projekt?', p: 'Hinterlassen Sie Ihre Nummer, wir melden uns für ein erstes Gespräch.', thema: 'Photovoltaik' },
  about:       { h: 'Lernen Sie uns kennen.', p: 'Hinterlassen Sie Ihre Nummer, wir melden uns persönlich bei Ihnen.', thema: 'Photovoltaik' },
  ratgeber:    { h: 'Frage nicht dabei?', p: 'Stellen Sie sie uns direkt. Wir rufen zurück, ohne Verkaufsdruck.', thema: 'Sonstiges' },
  'rat-pv':    { h: 'Rechnet es sich bei Ihnen?', p: 'Wir gehen die Zahlen für Ihr Haus mit Ihnen durch, am Telefon und kostenlos.', thema: 'Photovoltaik' },
  'rat-wp':    { h: 'Geht es in Ihrem Altbau?', p: 'Wir schauen uns Heizung und Heizkörper mit Ihnen an und sagen Ihnen offen, was dafür nötig ist.', thema: 'Wärmepumpe' },
  'rat-check': { h: 'Lieber jemanden draufschauen lassen?', p: 'Rückruf anfordern oder das Angebot direkt im Angebots-Check hochladen.', thema: 'Angebot prüfen lassen' },
  berlin:      { h: 'Projekt in Berlin?', p: 'Hinterlassen Sie Ihre Nummer. Wir melden uns und klären mit Ihnen, was für Ihr Haus in Frage kommt.', thema: 'Photovoltaik' },
  brandenburg: { h: 'Projekt in Brandenburg?', p: 'Hinterlassen Sie Ihre Nummer. Wir melden uns und klären mit Ihnen, was auf Ihrem Grundstück geht und was die Gemeinde dazu sagt.', thema: 'Photovoltaik' },
  foerderung2027: { h: 'Reicht die Zeit bei Ihnen noch?', p: 'Hinterlassen Sie Ihre Nummer. Wir sagen Ihnen ehrlich, ob der Antrag bis Ende Januar realistisch ist — und was dafür bis wann vorliegen muss.', thema: 'Wärmepumpe' },
  mastr:       { h: 'Unsicher, ob Ihre Anlage angemeldet ist?', p: 'Hinterlassen Sie Ihre Nummer. Wir sehen nach und sagen Ihnen, was zu tun ist.', thema: 'Bestehende Anlage' },
  wallbox:     { h: 'Wallbox geplant?', p: 'Hinterlassen Sie Ihre Nummer. Wir klären mit Ihnen Leistung, Anmeldung und ob sich das Laden mit Solarstrom bei Ihnen lohnt.', thema: 'Wallbox' },
  potsdam:     { h: 'Projekt in Potsdam?', p: 'Hinterlassen Sie Ihre Nummer. Wir klären mit Ihnen Förderung, Satzungen und was für Ihr Haus in Frage kommt.', thema: 'Photovoltaik' },
  falkensee:   { h: 'Projekt in Falkensee?', p: 'Hinterlassen Sie Ihre Nummer. Wir sagen Ihnen, ob eine Wärmepumpe in Ihrem Haus passt und was die Förderung bringt.', thema: 'Wärmepumpe' },
  bernau:      { h: 'Projekt in Bernau?', p: 'Hinterlassen Sie Ihre Nummer. Wir klären mit Ihnen, was in Ihrer Straße gilt und was sich für Ihr Haus rechnet.', thema: 'Photovoltaik' },
  oranienburg: { h: 'Projekt in Oranienburg?', p: 'Hinterlassen Sie Ihre Nummer. Wir klären mit Ihnen auch die Frage der Kampfmittel, bevor gegraben wird.', thema: 'Wärmepumpe' },
  'rat-eeg':   { h: 'Lohnt es sich bei Ihnen noch?', p: 'Wir rechnen mit Ihnen durch, was Eigenverbrauch und Einspeisung bei Ihrem Haus bringen.', thema: 'Photovoltaik' },
  'rat-pvwp':  { h: 'PV und Wärmepumpe zusammen planen?', p: 'Hinterlassen Sie Ihre Nummer. Wir sagen Ihnen, wie groß die Anlage sein sollte und ob ein eigener Zähler sinnvoll ist.', thema: 'Photovoltaik und Wärmepumpe' },
  'rat-speicher': { h: 'Speicher nachrüsten?', p: 'Nennen Sie uns im Rückruf Ihre Anlage und Ihren Verbrauch, dann sagen wir Ihnen, welche Lösung passt.', thema: 'Stromspeicher' },
  kontakt:     { h: 'Nachricht schreiben', p: 'Schreiben Sie uns kurz, worum es geht. Fotos oder ein Angebot als PDF schicken Sie am einfachsten per WhatsApp oder über den Angebots-Check.', thema: 'Sonstiges', nachricht: true, kontakt: true }
};

const KF_THEMEN = ['Photovoltaik', 'Stromspeicher', 'Wärmepumpe', 'Wallbox', 'Photovoltaik und Wärmepumpe', 'Angebot prüfen lassen', 'Bestehende Anlage', 'Sonstiges'];

function kurzanfrageHtml(key) {
  const c = KURZANFRAGE[key];
  if (!c) return '';
  const id = 'kf-' + key;
  const optionen = KF_THEMEN.map(t =>
    '<option' + (t === c.thema ? ' selected' : '') + '>' + t + '</option>').join('');
  const nachricht = c.nachricht
    ? `<div class="fld"><label for="${id}-msg">Ihre Nachricht <span class="req">*</span></label><textarea id="${id}-msg" name="nachricht" required rows="4" placeholder="z. B. Dachform, Heizung, ungefährer Verbrauch oder Ihre Frage"></textarea></div>`
    : `<div class="fld"><label for="${id}-msg">Worum geht es? <span class="hint2">(optional)</span></label><textarea id="${id}-msg" name="nachricht" rows="2" placeholder="z. B. Einfamilienhaus, 4.000 kWh Verbrauch"></textarea></div>`;
  return `
  <section class="pad kf-band" id="rueckruf">
    <div class="wrap kf-grid">
      <div class="kf-copy">
        <div class="eyebrow">${c.kontakt ? 'Kontaktformular' : 'Kostenloser Rückruf'}</div>
        <h2>${c.h}</h2>
        <p>${c.p}</p>
        <ul class="usp">
          <li><svg class="ic"><use href="#i-check"/></svg> Kostenlos und unverbindlich</li>
          <li><svg class="ic"><use href="#i-check"/></svg> Antwort in der Regel innerhalb eines Werktags</li>
          <li><svg class="ic"><use href="#i-check"/></svg> Lieber direkt? <a href="tel:+491634440392">0163 4440392</a></li>
        </ul>
      </div>
      <div class="fcard kf-card" id="${id}-card">
        <form class="kf-form" id="${id}-form" data-quelle="${key}" data-typ="${c.kontakt ? 'Kontaktformular' : 'Rückrufwunsch'}">
          <div class="fld"><label for="${id}-thema">Thema</label><select id="${id}-thema" name="thema">${optionen}</select></div>
          <div class="grid2">
            <div class="fld"><label for="${id}-name">Name <span class="req">*</span></label><input type="text" id="${id}-name" name="name" required autocomplete="name" placeholder="Vor- und Nachname"></div>
            <div class="fld"><label for="${id}-tel">Telefon ${c.kontakt ? '<span class="hint2">(optional)</span>' : '<span class="req">*</span>'}</label><input type="tel" id="${id}-tel" name="tel"${c.kontakt ? '' : ' required'} autocomplete="tel" placeholder="0170 1234567" minlength="6"></div>
          </div>
          <div class="grid2">
            <div class="fld"><label for="${id}-plz">Postleitzahl <span class="req">*</span></label><input type="text" id="${id}-plz" name="plz" required inputmode="numeric" pattern="[0-9]{5}" maxlength="5" autocomplete="postal-code" placeholder="z. B. 13359"></div>
            <div class="fld"><label for="${id}-mail">E-Mail ${c.kontakt ? '<span class="req">*</span>' : '<span class="hint2">(optional)</span>'}</label><input type="email" id="${id}-mail" name="email" autocomplete="email" placeholder="name@beispiel.de"${c.kontakt ? ' required' : ''}></div>
          </div>
          ${nachricht}
          <input type="text" name="_honey" class="kf-honey" tabindex="-1" autocomplete="off" aria-hidden="true">
          <div class="consent">
            <input type="checkbox" id="${id}-dsgvo" required>
            <label for="${id}-dsgvo">Ich bin einverstanden, dass BHD mich zu meiner Anfrage kontaktiert (<a href="#datenschutz">Datenschutz</a>). Widerruf jederzeit möglich. <span class="req">*</span></label>
          </div>
          <button type="submit" class="btn" style="width:100%">${c.kontakt ? 'Nachricht senden' : 'Rückruf anfordern'}</button>
          <div class="fnote"><svg class="ic"><use href="#i-lock"/></svg> SSL-verschlüsselt · kein Newsletter · kostenlos</div>
        </form>
        <div class="fdone" id="${id}-done" role="status">
          <div class="check"><svg class="ic"><use href="#i-check"/></svg></div>
          <h3>Danke, ist angekommen.</h3>
          <p>Wir melden uns in der Regel innerhalb eines Werktags bei Ihnen.</p>
        </div>
      </div>
    </div>
  </section>
`;
}

function kurzanfrageEinsetzen(html, key) {
  if (html.indexOf('<!--KURZANFRAGE-->') < 0) return html;
  if (!KURZANFRAGE[key]) throw new Error('Marke <!--KURZANFRAGE--> auf Seite "' + key + '", aber kein Eintrag in KURZANFRAGE');
  return html.split('<!--KURZANFRAGE-->').join(kurzanfrageHtml(key));
}

/* Liest die Fragen aus dem FERTIGEN sichtbaren HTML. Nur Container mit
 * data-faq zaehlen - der Waermepumpen-Rechner nutzt dieselbe Aufklapp-Optik
 * fuer Rechenwege ("Heizlast aus dem Verbrauch"), das sind keine Fragen und
 * darf nicht ins Schema.
 *
 * Der Umweg ueber das HTML ist Absicht: strukturierte Daten muessen den
 * sichtbaren Inhalt abbilden. Frueher standen die Fragen doppelt im Projekt
 * und waren bereits auseinandergelaufen (13 sichtbar, 8 im Schema). */
function faqAusHtml(html) {
  const nurText = s => s
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ').trim();

  const eintraege = [];
  let von = 0;
  for (;;) {
    const start = html.indexOf('data-faq', von);
    if (start < 0) break;
    let ende = html.indexOf('</section>', start);
    if (ende < 0) ende = html.length;
    const abschnitt = html.slice(start, ende);
    const RE = /<details class="faq-item"><summary>([\s\S]*?)<svg[\s\S]*?<div class="ans">([\s\S]*?)<\/div><\/details>/g;
    let m;
    while ((m = RE.exec(abschnitt))) {
      const frage = nurText(m[1]);
      const antwort = nurText(m[2]);
      if (frage && antwort) eintraege.push({ frage, antwort });
    }
    von = ende;
  }
  return eintraege;
}

function calUmschalten(html) {
  const block = marke => new RegExp('<!--' + marke + '-->[\\s\\S]*?<!--\\/' + marke + '-->', 'g');
  if (CAL_LINK) {
    return html
      .replace(block('CAL:AUS'), '')
      .replace(/<!--CAL:AN-->|<!--\/CAL:AN-->/g, '')
      .split('__CAL_LINK__').join(CAL_LINK);
  }
  return html
    .replace(block('CAL:AN'), '')
    .replace(/<!--CAL:AUS-->|<!--\/CAL:AUS-->/g, '');
}

function buildPage(page) {
  const url = SITE + URL_OF[page.key];
  /* REIHENFOLGE BEACHTEN: Erst die Bausteine einsetzen (Cal.com-Variante,
   * FAQ-Abschnitt), DANACH fixLinks. Die eingesetzten Bausteine enthalten
   * selbst data-nav-Verweise - laeuft fixLinks vorher, bleiben deren Links
   * ohne Ziel. Genau das war beim FAQ-Knopf "Termin vereinbaren" passiert. */
  const rohOhneStand = kurzanfrageEinsetzen(faqEinsetzen(quellenEinsetzen(kurzEinsetzen(
    calUmschalten(VIEWS[page.key]), page.key), page.key), page.key), page.key);
  page._stand = standFuer(page.key, rohOhneStand);
  const roh = rohOhneStand.replace('__STAND_ISO__', page._stand).replace('__STAND__', datumDe(page._stand));

  const view = webpPicture(fixLinks(roh)
    // Der Angebots-Check springt nach dem Upload auf seine eigene Seite zurueck.
    // Unabhaengig davon, welche Adresse in der Quelldatei steht.
    .replace(/value="https?:\/\/[^"]*[?&]checkok=1[^"]*"/g,
             'value="' + SITE + URL_OF.check + '?checkok=1"')
    // Dasselbe fuer den Bestandsanlagen-Check. Eigene Marke, damit sich die
    // beiden Rueckspruenge nicht gegenseitig ueberschreiben.
    .replace(/value="https?:\/\/[^"]*[?&]bestandok=1[^"]*"/g,
             'value="' + SITE + URL_OF.bestand + '?bestandok=1"')
    .replace(/value="https?:\/\/[^"]*[?&]terminok=1[^"]*"/g,
             'value="' + SITE + URL_OF.termin + '?terminok=1"'));

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
<meta name="theme-color" content="#ffffff">
<script type="application/ld+json">
${jsonLd(page, view)}
</script>
${STYLE_INLINE}
<link rel="preload" href="/assets/site.css?v=${ASSET_V}" as="style">
<link rel="preload" href="/assets/fonts/inter-latin-var.woff2" as="font" type="font/woff2" crossorigin>
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
  'picture{display:contents}\n' + GEO_CSS;
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
    /* lastmod aus stand.json: aendert sich nur bei echter Inhaltsaenderung. */
    const lastmod = p._stand;
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
/* Die KI-Crawler werden ausdruecklich zugelassen. "User-agent: *" reicht
 * technisch, aber einige Betreiber werten nur eigene Gruppen aus, und so
 * ist die Absicht eindeutig. Suche/Antwort (OAI-SearchBot, ChatGPT-User,
 * Claude-SearchBot, Perplexity) und Training (GPTBot, ClaudeBot,
 * Google-Extended, Applebot-Extended) sind beide erlaubt: Wer zitiert
 * werden will, muss auch gelernt werden duerfen. */
const KI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot',
  'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended',
  'Bingbot', 'meta-externalagent', 'MistralAI-User', 'CCBot'];
fs.writeFileSync(path.join(ROOT, 'robots.txt'),
  'User-agent: *\nAllow: /\n\n' +
  KI_BOTS.map(b => 'User-agent: ' + b).join('\n') + '\nAllow: /\n\n' +
  'Sitemap: ' + SITE + '/sitemap.xml\n', 'utf8');

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
> Sitz in Berlin, bundesweit tätig.
> Erreichbar ${OPENING.text}. Google-Unternehmensprofil: ${GOOGLE_MAPS}

## Leistungen
- [Photovoltaik](${SITE}${URL_OF.pv}): Anlagengröße, Eigenverbrauch, 0 % Umsatzsteuer nach § 12 Abs. 3 UStG
- [Stromspeicher](${SITE}${URL_OF.speicher}): sinnvolle Kapazität, nutzbare Kapazität, Zyklengarantie
- [Wärmepumpe](${SITE}${URL_OF.wp}): Eignung im Altbau, Vorlauftemperatur, KfW-Zuschuss 458 bis 80 %
- [Kosten](${SITE}${URL_OF.kosten}): marktübliche Preise und Eigenanteil nach Förderung
- [Photovoltaik und Wärmepumpe in Berlin](${SITE}${URL_OF.berlin}): Solargesetz Berlin, Zuschüsse aus SolarPLUS, Denkmalschutz, Stromnetz Berlin
- [Photovoltaik und Wärmepumpe in Brandenburg](${SITE}${URL_OF.brandenburg}): keine Solarpflicht, Baurecht nach BbgBO, Förderung
- [Wärmepumpen-Förderung 2027](${SITE}${URL_OF.foerderung2027}): was sich am 01.02.2027 beim KfW-Zuschuss ändert
- [PV im Marktstammdatenregister anmelden](${SITE}${URL_OF.mastr}): Frist, Folgen, Nachholen
- [Wallbox](${SITE}${URL_OF.wallbox}): Anmeldung nach § 19 NAV, Netzentgelt nach § 14a EnWG, keine 0 % Umsatzsteuer
- [Potsdam](${SITE}${URL_OF.potsdam}): Klimaschutzförderprogramm, Denkmal und Welterbe, Fernwärmesatzung, Netzgesellschaft Potsdam
- [Falkensee](${SITE}${URL_OF.falkensee}): Wärmeplan, E.DIS Netz, Gestaltungssatzung Falkenhagen
- [Bernau bei Berlin](${SITE}${URL_OF.bernau}): Befreiung vom Fernwärme-Anschlusszwang, Altstadtsatzungen, Stadtwerke Bernau
- [Oranienburg](${SITE}${URL_OF.oranienburg}): Kampfmittel bei Erdarbeiten, zwei Netzbetreiber, Wärmeplanungskarte
- [Angebots-Check](${SITE}${URL_OF.check}): kostenlose Prüfung eines vorliegenden Angebots, Rückmeldung in 24 Stunden
- [Wärmepumpen-Rechner](${SITE}${URL_OF.rechner}): Heizlast, Gerätegröße, Jahresarbeitszahl und Förderung – ohne Anmeldung

## Ratgeber
${beitraegeTxt}

## Weitere Seiten
- [Referenzen](${SITE}${URL_OF.ref}): umgesetzte Projekte mit eigenen Fotos
- [Über uns](${SITE}${URL_OF.about})
- [Kontakt](${SITE}${URL_OF.kontakt})
- [Für Fachbetriebe](${SITE}${URL_OF.partner})

## Kernaussagen je Seite
Stand jeweils in Klammern. Alle Angaben ohne Gewähr.

${PAGES.filter(p => KURZ[p.key]).map(p =>
  '### [' + p.title.replace(/ \| BHD$/, '') + '](' + SITE + URL_OF[p.key] + ') (' + datumDe(p._stand) + ')\n' +
  KURZ[p.key].map(s => '- ' + s).join('\n')).join('\n\n')}

## Volltext
Alle Inhaltsseiten als reiner Text: ${SITE}/llms-full.txt

## Kontakt
Telefon +49 163 4440392 · ${MAIL}
Google Maps: ${GOOGLE_MAPS}
`, 'utf8');

/* llms-full.txt – der Inhalt aller Themen- und Ratgeberseiten als Klartext.
 * KI-Systeme muessen so kein Layout, Menue und Formular herausrechnen. */
const OHNE_VOLLTEXT = ['impressum', 'datenschutz', 'anfragen', 'termin', 'kontakt', 'ask'];
function alsText(html) {
  let m = (html.match(/<main[\s\S]*?<\/main>/) || [''])[0]
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<form[\s\S]*?<\/form>|<svg[\s\S]*?<\/svg>|<nav[\s\S]*?<\/nav>/g, '')
    .replace(/<div class="breadcrumb"[\s\S]*?<\/div>/g, '')
    .replace(/<a[^>]*class="btn[^"]*"[^>]*>[\s\S]*?<\/a>/g, '');
  m = m.replace(/<h1[^>]*>/g, '\n# ').replace(/<h2[^>]*>/g, '\n\n## ').replace(/<h3[^>]*>/g, '\n\n### ')
    .replace(/<li[^>]*>/g, '\n- ').replace(/<\/(p|h[1-6]|li|tr)>/g, '\n').replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n')
    .replace(/ ([.,;:!?])/g, '$1').replace(/(\n- [^\n]*)\n\n(?=- )/g, '$1\n').replace(/(\n- [^\n]*)\n\n(?=- )/g, '$1\n');
  return m.trim();
}
fs.writeFileSync(path.join(ROOT, 'llms-full.txt'),
  '# BHD – Beratung Heimenergie Deutschland: Inhalte als Klartext\n\n' +
  '> Betreiber: Brotherhooddeen UG (haftungsbeschränkt), Prinzenallee 44b, 13359 Berlin. ' +
  'Unabhängige Beratung zu Photovoltaik, Stromspeicher und Wärmepumpe, Schwerpunkt Berlin und Brandenburg, Beratung auch bundesweit. ' +
  'Kurzfassung: ' + SITE + '/llms.txt\n\n' +
  PAGES.filter(p => !OHNE_VOLLTEXT.includes(p.key)).map(p => {
    const html = fs.readFileSync(path.join(ROOT, p.dir || '', 'index.html'), 'utf8');
    return '---\n\nQuelle: ' + SITE + URL_OF[p.key] + '\nZuletzt aktualisiert: ' + datumDe(p._stand) + '\n\n' + alsText(html);
  }).join('\n\n') + '\n', 'utf8');

fs.writeFileSync(STAND_FILE, JSON.stringify(STAND, null, 2) + '\n', 'utf8');

console.log('Erzeugt:');
written.forEach(w => console.log('  ' + w[0].padEnd(18) + w[1]));
console.log('  /sitemap.xml       ' + PAGES.length + ' Adressen');
console.log('  /robots.txt');
console.log('  /llms.txt');
console.log('  /.well-known/security.txt');
console.log('  /' + INDEXNOW_KEY + '.txt  (IndexNow)');
if (!GSC_TOKEN) console.log('\nHinweis: GSC_TOKEN ist leer – Search Console noch nicht per Meta-Tag bestätigt.');
if (!GA4_ID) console.log('Hinweis: GA4_ID ist leer – Analytics und Einwilligungsbanner bleiben inaktiv.');
if (!SOCIAL.length) console.log('Hinweis: SOCIAL ist leer – sameAs enthaelt nur das Google-Profil.');
