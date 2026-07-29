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

| Adresse | Inhalt |
|---|---|
| `/` | Startseite mit Anfrage-Funnel |
| `/angebots-check/` | Angebots-Check inkl. Upload-Formular |
| `/referenzen/` | Projektgalerie |
| `/ueber-uns/` | Über uns |
| `/ratgeber/` | Ratgeber & Downloads |
| `/anfragen/` | Anfrage- und Partnerformular |
| `/impressum/` | Impressum |
| `/datenschutz/` | Datenschutzerklärung |

Damit Navigation, Footer und Skripte trotzdem nur an **einer** Stelle gepflegt
werden müssen, erzeugt `build.js` die acht Seiten aus der Quelldatei.

## Dateien

| Datei | Rolle |
|---|---|
| `src/site.html` | **Quelldatei – hier wird bearbeitet** |
| `build.js` | Erzeugt die Seiten, `sitemap.xml` und `robots.txt` |
| `index.html`, `referenzen/index.html`, … | **Erzeugt – nicht direkt bearbeiten**, wird überschrieben |
| `sitemap.xml`, `robots.txt` | Erzeugt |
| `assets/` | Logo und Projektfotos |

## Umzug auf die eigene Domain

In `build.js` steht die Adresse an genau einer Stelle:

```js
const SITE = 'https://bhd-website.vercel.app';
```

Auf `https://bhd-energie.de` ändern, `node build.js` ausführen, committen und
pushen. Damit stimmen Canonical-Adressen, Open Graph, strukturierte Daten und
die Sitemap wieder.

## Kontakt-E-Mail wechseln

Ebenfalls eine einzige Zeile in `build.js`:

```js
const MAIL = 'service-bhd@outlook.de';
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
- Strukturierte Daten: Organisation und Website auf allen Seiten, FAQ auf der
  Startseite, Dienstleistung beim Angebots-Check, Breadcrumb auf Unterseiten
- Navigations- und Footer-Links als echte Verweise (`/referenzen/` statt `#referenzen`)
- Bild- und Logopfade absolut (`/assets/…`), damit sie aus jeder Unterseite laden
- Alte `#`-Adressen werden automatisch auf die neue Seite weitergeleitet, damit
  bereits geteilte Links weiter funktionieren
- Skripte, die es nur auf einer Seite gibt (Funnel, Anfrageformulare), werden
  gekapselt, damit sie auf den anderen Seiten nichts blockieren
