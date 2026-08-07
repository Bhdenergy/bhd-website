# Wie diese Website aufgebaut ist

## Kurzfassung

**Bearbeitet wird nur `src/site.html`.** Danach einmal im Ordner `bhd-website`:

```
node build.js
git add -A
git commit -m "Beschreibung der Änderung"
git push
```

Vercel veröffentlicht den neuen Stand dann automatisch.

## Warum das so ist

Früher war die ganze Website eine einzige Datei (`index.html`). Alle Bereiche
steckten darin und wurden per JavaScript ein- und ausgeblendet – die Adresse
änderte sich nur hinter dem `#`. Für Google war das **eine** Seite.

Jetzt hat jeder Bereich eine echte Adresse und kann eigenständig in der Suche
gefunden werden:

Aktuell sind es **18 Seiten**: `/`, `/photovoltaik/`, `/stromspeicher/`,
`/waermepumpe/`, `/kosten/`, `/waermepumpen-rechner/`, `/angebots-check/`,
`/ratgeber/` mit drei Beiträgen, `/referenzen/`, `/ueber-uns/`, `/kontakt/`,
`/anfragen/`, `/partner-werden/`, `/impressum/`, `/datenschutz/`.

Damit Navigation, Footer und Skripte trotzdem nur an **einer** Stelle gepflegt
werden müssen, erzeugt `build.js` alle Seiten aus der Quelldatei.

## Dateien

| Datei | Rolle |
|---|---|
| `src/site.html` | **Quelldatei – hier wird bearbeitet** |
| `build.js` | Erzeugt die Seiten, `sitemap.xml`, `robots.txt`, `llms.txt`, `security.txt`, IndexNow-Schlüssel |
| `vercel.json` | Caching- und Sicherheits-Header. **Kein JSON-Kommentar möglich** – Vercel weist unbekannte Felder ab |
| `tools/bilder.js` | Erzeugt Logo-Kleinfassung und die 400/800-px-WebP-Stufen der Referenzfotos |
| `tools/test-formulare.js` | Klickt die drei Lead-Wege durch und prüft, ob wirklich etwas rausgeht |
| `index.html`, `referenzen/index.html`, … | **Erzeugt – nicht direkt bearbeiten**, wird überschrieben |
| `sitemap.xml`, `robots.txt`, `llms.txt` | Erzeugt |
| `assets/` | Logo und Projektfotos |
| `node_modules/` | Nur für die Werkzeuge (sharp, puppeteer-core), steht in `.gitignore` und wird nicht deployt |

## Nach dem Anlegen der Konten eintragen

Ganz oben in `build.js` stehen vier Zeilen, die nach der Anmeldung bei Google
und Co. gefüllt werden müssen. Solange sie leer sind, lässt der Generator die
zugehörigen Teile einfach weg – die Seite bleibt in jedem Fall gültig.

```js
const GSC_TOKEN = '';   // Google Search Console (nur nötig ohne DNS-Bestätigung)
const GA4_ID    = '';   // z. B. 'G-XXXXXXXXXX' – erst dann erscheint das Einwilligungsbanner
const SOCIAL    = [];   // NUR echte Profile, z. B. Facebook- und LinkedIn-Seite
```

Danach `node build.js`, committen, pushen.

> **Wichtig zu GA4:** Analytics wird erst nach einem Klick auf „Statistik
> erlauben" geladen (§ 25 TDDDG). Ohne Zustimmung wird kein Google-Skript
> eingebunden und kein Cookie gesetzt. Solange `GA4_ID` leer ist, erscheint gar
> kein Banner und die Seite bleibt vollständig trackingfrei.

## Vor jedem Deploy

```
node build.js
node tools/test-formulare.js     # braucht einen lokalen Server auf Port 8099
```

Der Formulartest fängt die Anfrage ab, es geht also keine Testmail raus.
Hintergrund: Der Startseiten-Funnel hat schon einmal monatelang „Vielen Dank"
angezeigt, ohne etwas zu versenden.

## Neue Bilder hinzufügen

Foto als JPG nach `assets/referenzen/` legen, dann:

```
node tools/bilder.js
node build.js
```

`bilder.js` erzeugt die verkleinerten WebP-Fassungen, `build.js` baut daraus
automatisch `<picture>` mit `srcset` – ohne dass im Markup etwas geändert wird.

## Umzug auf eine andere Domain

In `build.js` steht die Adresse an genau einer Stelle:

```js
const SITE = 'https://bhd-energie.de';
```

Ändern, `node build.js` ausführen, committen und pushen. Damit stimmen
Canonical-Adressen, Open Graph, strukturierte Daten und die Sitemap wieder.

## Kontakt-E-Mail wechseln

Ebenfalls eine einzige Zeile in `build.js`:

```js
const MAIL = 'info@bhd-energie.de';
```

Sie wird beim Bauen überall eingesetzt: Footer, Schnellkontakt-Button,
Impressum, Datenschutzerklärung – **und als Empfänger der drei Formulare**.

> **Reihenfolge beachten:** Erst das neue Postfach anlegen und testen, dass dort
> Mails ankommen. Dann `MAIL` ändern und neu bauen. Beim ersten Absenden eines
> Formulars verschickt FormSubmit eine einmalige Bestätigungsmail an die neue
> Adresse – erst nach dem Klick darauf kommen Anfragen wieder an. Solange das
> nicht passiert ist, gehen Anfragen verloren.

## Was der Generator übernimmt

- Titel, Beschreibung, Canonical und Open-Graph-Daten je Seite
- Strukturierte Daten: Organisation (inkl. Logo, Öffnungszeiten, Kontaktpunkt)
  und Website auf allen Seiten, FAQ auf Startseite und Rechner, Dienstleistung
  auf den Leistungsseiten, Breadcrumb auf Unterseiten, Article mit Autor und
  Datum auf den Ratgeber-Beiträgen, ItemList auf der Ratgeber-Übersicht,
  ContactPage auf der Kontaktseite
- Sprunglink „Zum Inhalt springen" und `<main id="inhalt">` auf jeder Seite
- `<picture>` mit `srcset`, sobald verkleinerte Bildfassungen vorliegen
- Navigations- und Footer-Links als echte Verweise (`/referenzen/` statt `#referenzen`)
- Bild- und Logopfade absolut (`/assets/…`), damit sie aus jeder Unterseite laden
- Alte `#`-Adressen werden automatisch auf die neue Seite weitergeleitet, damit
  bereits geteilte Links weiter funktionieren
- Skripte, die es nur auf einer Seite gibt (Funnel, Anfrageformulare), werden
  gekapselt, damit sie auf den anderen Seiten nichts blockieren
