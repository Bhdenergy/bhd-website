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

/* Domain an EINER Stelle. Beim Umzug auf bhd-energy.de nur diese Zeile ändern. */
const SITE = 'https://bhd-website.vercel.app';

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
    title: 'Photovoltaik & Wärmepumpe in Berlin & bundesweit | BHD – Beratung Heimenergie Deutschland',
    ogTitle: 'Photovoltaik & Wärmepumpe – unabhängige Beratung | BHD',
    desc: 'BHD – Beratung Heimenergie Deutschland (Brotherhooddeen UG) berät Hausbesitzer unabhängig zu Photovoltaik, Stromspeicher & Wärmepumpe. Kostenlose Erstberatung, geprüfte Fachbetriebe, Sitz in Berlin, bundesweit tätig.',
    ld: ['faq']
  },
  {
    key: 'check', dir: 'angebots-check', view: 'view-check', prio: '0.9', crumb: 'Angebots-Check',
    title: 'Angebots-Check: PV- & Wärmepumpen-Angebot prüfen lassen (24 h) | BHD',
    desc: 'Sie haben ein Angebot für Photovoltaik, Speicher oder Wärmepumpe vorliegen? Wir prüfen es kostenlos und unabhängig auf Seriosität, Effizienz und Fairness – Rückmeldung innerhalb von 24 Stunden.',
    ld: ['service']
  },
  {
    key: 'ref', dir: 'referenzen', view: 'view-ref', prio: '0.8', crumb: 'Referenzen',
    title: 'Referenzen: PV- & Wärmepumpen-Projekte | BHD',
    desc: 'Umgesetzte Projekte im Überblick: Photovoltaik auf Sattel- und Flachdach, Luft-Wasser-Wärmepumpen von der Erdarbeit bis zur Hydraulik, Speicher, Wechselrichter und Wallbox.'
  },
  {
    key: 'about', dir: 'ueber-uns', view: 'view-about', prio: '0.6', crumb: 'Über uns',
    title: 'Über uns – BHD – Beratung Heimenergie Deutschland',
    desc: 'Wer hinter BHD steht: Brotherhooddeen UG aus Berlin, gegründet 2024, bundesweit tätig. Unabhängige Beratung und Vermittlung geprüfter Fachbetriebe für Photovoltaik und Wärmepumpe.'
  },
  {
    key: 'shop', dir: 'ratgeber', view: 'view-shop', prio: '0.5', crumb: 'Ratgeber & Downloads',
    title: 'Ratgeber & Downloads zu Photovoltaik & Wärmepumpe | BHD',
    desc: 'Kompakte Ratgeber rund um Photovoltaik, Stromspeicher, Wärmepumpe und Förderung – verständlich aufbereitet für Hausbesitzer.'
  },
  {
    key: 'ask', dir: 'anfragen', view: 'view-ask', prio: '0.9', crumb: 'Anfragen',
    title: 'Anfrage stellen – kostenloses Angebot | BHD',
    desc: 'Kostenloses und unverbindliches Angebot für Photovoltaik, Stromspeicher oder Wärmepumpe anfordern – oder als Fachbetrieb Partner von BHD werden.'
  },
  {
    key: 'impressum', dir: 'impressum', view: 'view-impressum', prio: '0.2', crumb: 'Impressum',
    title: 'Impressum | BHD – Beratung Heimenergie Deutschland',
    desc: 'Impressum und Anbieterkennzeichnung der Brotherhooddeen UG (haftungsbeschränkt), Berlin.'
  },
  {
    key: 'datenschutz', dir: 'datenschutz', view: 'view-datenschutz', prio: '0.2', crumb: 'Datenschutz',
    title: 'Datenschutzerklärung | BHD – Beratung Heimenergie Deutschland',
    desc: 'Datenschutzerklärung: Welche Daten BHD – Beratung Heimenergie Deutschland verarbeitet, zu welchem Zweck und welche Rechte Sie haben.'
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
      '#ratgeber': URL_OF.shop, '#angebots-check': URL_OF.check,
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

  const formsGuarded =
    '  // ---------- Formulare der Anfragen-Seite (nur dort) ----------\n  (function(){\n' +
    "    if(!document.getElementById('b2c-form'))return;\n" +
    forms.replace(MARK_FORMS + '\n', '') + '  })();\n\n';

  // Danke-Meldung des Angebots-Checks: kein setView mehr noetig
  tail = tail
    .replace("    setView('check',false);\n", '')
    .replace("location.pathname+'#angebots-check'", 'location.pathname');

  return head + funnelGuarded + filter + nav + formsGuarded + tail;
}

const SCRIPT = buildScript();

/* --------------------------------------------------- Links absolut machen */

function fixLinks(html) {
  return html
    // Assets funktionieren dann aus jeder Unterseite heraus
    .replace(/(src|href)="assets\//g, '$1="/assets/')
    // Menue-/Footer-Links: echte Ziele ergaenzen (data-nav bleibt fuer die Markierung)
    .replace(/<a data-nav="([a-z-]+)"/g, (m, k) => '<a href="' + (URL_OF[k] || '/') + '" data-nav="' + k + '"')
    .replace(/<div class="brand" data-nav="home">/g, '<a class="brand" href="/" data-nav="home" aria-label="Zur Startseite">')
    // Verweise auf die Datenschutzseite (aus den Einwilligungstexten)
    .replace(/href="#datenschutz"/g, 'href="' + URL_OF.datenschutz + '"')
    // Anfrage-Funnel liegt auf der Startseite
    .replace(/href="#funnel"/g, 'href="/#funnel"');
}

/* Das schliessende </div> der Marke muss zu </a> werden – zeilenweise sicher. */
function fixBrandClose(html) {
  return html.replace(
    /<a class="brand" href="\/" data-nav="home" aria-label="Zur Startseite">(<img[^>]*>)<\/div>/g,
    '<a class="brand" href="/" data-nav="home" aria-label="Zur Startseite">$1</a>'
  );
}

const NAV_OUT = fixBrandClose(fixLinks(NAV));
const FOOTER_OUT = fixBrandClose(fixLinks(FOOTER));
const QUICK_OUT = fixLinks(QUICK);

/* -------------------------------------------------------- JSON-LD je Seite */

function jsonLd(page) {
  const nodes = [
    {
      '@type': ['Organization', 'LocalBusiness'],
      '@id': SITE + '/#org',
      name: 'BHD – Beratung Heimenergie Deutschland',
      legalName: 'Brotherhooddeen UG (haftungsbeschränkt)',
      vatID: 'DE370268782',
      identifier: 'HRB 266273 B',
      url: SITE + '/',
      email: 'service-bhd@outlook.de',
      telephone: '+49 163 4440392',
      foundingDate: '2024',
      founder: { '@type': 'Person', name: 'Kürşat Yıldırım' },
      description: 'Unabhängige Beratung für Hausbesitzer zu Photovoltaik, Stromspeicher und Wärmepumpe. Vermittlung geprüfter, regionaler Fachbetriebe. Sitz in Berlin, bundesweit tätig.',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Prinzenallee 44b',
        postalCode: '13357',
        addressLocality: 'Berlin',
        addressCountry: 'DE'
      },
      areaServed: { '@type': 'Country', name: 'Deutschland' },
      knowsAbout: ['Photovoltaik', 'Solaranlage', 'Stromspeicher', 'Wärmepumpe', 'Wallbox', 'Energieberatung', 'Förderung'],
      slogan: 'Sonne rein. Stromrechnung raus.'
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
      about: { '@id': SITE + '/#org' }
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

  if ((page.ld || []).includes('faq')) {
    nodes.push({
      '@type': 'FAQPage',
      '@id': SITE + '/#faq',
      mainEntity: [
        { '@type': 'Question', name: 'Was kostet mich die Anfrage?', acceptedAnswer: { '@type': 'Answer', text: 'Die Anfrage und das anschließende Angebot sind für Sie völlig kostenlos und unverbindlich – Sie gehen keinerlei Verpflichtung ein.' } },
        { '@type': 'Question', name: 'Lohnt sich Photovoltaik 2026 noch?', acceptedAnswer: { '@type': 'Answer', text: 'Ja. Dank staatlicher Förderung, 0 % Mehrwertsteuer auf viele private PV-Anlagen und steigender Strompreise amortisiert sich eine Anlage in der Regel nach wenigen Jahren und spart danach über die gesamte Laufzeit Geld.' } },
        { '@type': 'Question', name: 'Wie schnell erhalte ich ein Angebot?', acceptedAnswer: { '@type': 'Answer', text: 'Nach Ihrer Anfrage meldet sich in kurzer Zeit ein geprüfter Fachbetrieb aus Ihrer Region mit einem auf Ihr Haus zugeschnittenen Angebot.' } },
        { '@type': 'Question', name: 'Brauche ich Eigenkapital?', acceptedAnswer: { '@type': 'Answer', text: 'Nicht zwingend – es gibt Finanzierungsmodelle ab 0 € Anzahlung. Der Fachbetrieb berät Sie zu den passenden Optionen.' } }
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
  const view = fixLinks(VIEWS[page.key])
    // Der Angebots-Check springt nach dem Upload auf seine eigene Seite zurueck
    .replace(SITE + '/?checkok=1#angebots-check', SITE + URL_OF.check + '?checkok=1');

  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.desc)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="author" content="Brotherhooddeen UG (haftungsbeschränkt)">
<meta name="geo.region" content="DE-BE">
<meta name="geo.placename" content="Berlin">
<link rel="canonical" href="${url}">
<!-- Domain-Umzug: nur die Konstante SITE in build.js aendern, dann "node build.js" -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="BHD – Beratung Heimenergie Deutschland">
<meta property="og:title" content="${esc(page.ogTitle || page.title)}">
<meta property="og:description" content="${esc(page.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="de_DE">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#f6f5f1">
<script type="application/ld+json">
${jsonLd(page)}
</script>
${STYLE_INLINE}
${STYLE_MAIN}
</head><body data-page="${page.key}">

${SPRITE}

${NAV_OUT}

${view}

${FOOTER_OUT}

<script>
${SCRIPT}
</script>

${QUICK_OUT}
</body></html>
`;
}

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
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  PAGES.map(p =>
    '  <url>\n' +
    '    <loc>' + SITE + URL_OF[p.key] + '</loc>\n' +
    '    <changefreq>' + (p.key === 'home' ? 'weekly' : 'monthly') + '</changefreq>\n' +
    '    <priority>' + p.prio + '</priority>\n' +
    '  </url>\n'
  ).join('') +
  '</urlset>\n';
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

/* robots.txt */
fs.writeFileSync(path.join(ROOT, 'robots.txt'),
  'User-agent: *\nAllow: /\n\nSitemap: ' + SITE + '/sitemap.xml\n', 'utf8');

console.log('Erzeugt:');
written.forEach(w => console.log('  ' + w[0].padEnd(18) + w[1]));
console.log('  /sitemap.xml       ' + PAGES.length + ' Adressen');
console.log('  /robots.txt');
