/*
 * Häufige Fragen für die Seiten, die bisher keinen FAQ-Abschnitt hatten
 * ---------------------------------------------------------------------
 * Startseite, Photovoltaik, Stromspeicher, Wärmepumpe und Partner haben
 * bereits eigene Blöcke direkt in src/site.html. Die bleiben dort stehen.
 *
 * Das FAQPage-Schema wird NICHT hier erzeugt, sondern in build.js aus dem
 * fertigen sichtbaren HTML gelesen (aus Containern mit data-faq). Damit
 * können Schema und Text nicht mehr auseinanderlaufen - vorher standen auf
 * der Startseite 13 Fragen sichtbar, aber nur 8 im Schema.
 *
 * Zur Wirkung: Google hat die FAQ-Rich-Results am 07.05.2026 abgeschaltet.
 * Aufklapp-Kästen im Suchergebnis entstehen dadurch nicht mehr. Der Nutzen
 * liegt im Inhalt: Longtail-Suchanfragen, "Ähnliche Fragen" und Zitate in
 * KI-Antworten. Das Schema bleibt gültig und wird weiter ausgelesen.
 *
 * WICHTIG: Diese Datei ist UTF-8 ohne BOM. Nicht mit PowerShell
 * Get-Content/Set-Content umschreiben - das erzeugt doppelt kodierte
 * Umlaute. Immer direkt im Editor bearbeiten.
 */

const F = (frage, antwort) => ({ frage, antwort });

const FAQ = {

  /* -------------------------------------------------------------- Kosten */
  kosten: {
    kicker: 'Kosten einordnen',
    titel: 'Häufige Fragen zu Preisen und Wirtschaftlichkeit',
    intro: 'Was die Anschaffung kostet, wann sie sich rechnet und welche Posten in Angeboten gern fehlen.',
    items: [
      F('Was ist eine Kilowattstunde (kWh)?',
        'Eine Kilowattstunde ist die Strommenge, die ein Gerät mit 1.000 Watt Leistung in einer Stunde verbraucht. Ein Backofen mit 2.000 Watt braucht in 30 Minuten also 1 kWh. Ein Vier-Personen-Haushalt kommt im Jahr typischerweise auf 3.500 bis 4.500 kWh. Nach dieser Einheit wird Ihr Strom abgerechnet.'),
      F('Was kostet mich eine Kilowattstunde Strom?',
        'Für Haushaltskunden liegt der Arbeitspreis derzeit meist zwischen 30 und 40 Cent je Kilowattstunde, dazu kommt ein monatlicher Grundpreis. Genau das ist der Hebel einer Solaranlage: Selbst erzeugter Strom kostet über die Lebensdauer gerechnet ungefähr 8 bis 12 Cent je Kilowattstunde.'),
      F('Wann amortisiert sich eine Photovoltaikanlage?',
        'Bei guter Auslegung und hohem Eigenverbrauch sind 10 bis 14 Jahre ein realistischer Korridor, wenn man Betriebskosten und Leistungsverlust der Module ehrlich mitrechnet. Entscheidend ist, wie viel des erzeugten Stroms Sie selbst nutzen: Jede selbst verbrauchte Kilowattstunde spart 30 bis 40 Cent, jede eingespeiste bringt derzeit 7,7 Cent. Wer Ihnen fünf Jahre verspricht, rechnet mit Annahmen, die selten eintreten. Mit Ihren eigenen Zahlen rechnet das unser Rentabilitätsrechner.'),
      F('Warum kostet Photovoltaik keine Mehrwertsteuer?',
        'Seit 2023 gilt für Lieferung und Montage von Photovoltaikanlagen, Speichern und Wechselrichtern an Wohngebäuden ein Umsatzsteuersatz von 0 Prozent (§ 12 Abs. 3 UStG). Diese Regelung ist unbefristet, es gibt also keine Frist, unter der man hindurchmuss. Bei 20.000 Euro Anlagenpreis sind das rund 3.800 Euro Ersparnis.'),
      F('Welche Kosten werden in Angeboten oft vergessen?',
        'Typisch sind: Erneuerung des Zählerschranks, Gerüst bei Dacharbeiten, Wallbox samt Installation, einzelne größere Heizkörper und der hydraulische Abgleich, der bei jeder Wärmepumpe im Bestand Pflicht ist. Die Spannen dazu stehen weiter oben auf dieser Seite. Seriöse Angebote führen diese Posten wenigstens als Option auf.'),
      F('Ist das günstigste Angebot das beste?',
        'Selten. Auffällig niedrige Preise gehen fast immer zulasten von Komponentenqualität, Montagesorgfalt oder Erreichbarkeit im Schadensfall. Aussagekräftiger als der Endbetrag ist der Preis je kWp beziehungsweise je kWh Speicher, und die Frage, was alles enthalten ist.')
    ]
  },

  /* ------------------------------------------------------ Angebots-Check */
  check: {
    kicker: 'Zum Angebots-Check',
    titel: 'Häufige Fragen zur Angebotsprüfung',
    intro: 'Was wir prüfen, wie lange es dauert und warum die Prüfung nichts kostet.',
    items: [
      F('Was kostet der Angebots-Check?',
        'Nichts. Die Prüfung ist kostenlos und unverbindlich. Wir verdienen erst dann etwas, wenn Sie sich später für eine Umsetzung über einen unserer Partnerbetriebe entscheiden, und auch das steht Ihnen völlig frei.'),
      F('Wie lange dauert die Prüfung?',
        'In der Regel melden wir uns innerhalb von 24 Stunden mit einer Einschätzung. Bei umfangreichen Angeboten mit mehreren Varianten kann es einen Werktag länger dauern.'),
      F('Welche Unterlagen braucht ihr?',
        'Am besten das vollständige Angebot als PDF oder Foto. Hilfreich sind außerdem Ihr Jahresstromverbrauch, Angaben zu Dachform und Ausrichtung sowie bei Wärmepumpen der bisherige Heizenergieverbrauch. Je mehr wir sehen, desto konkreter fällt die Rückmeldung aus.'),
      F('Woran erkenne ich ein unseriöses Angebot?',
        'Typische Warnzeichen: Pauschalpreise ohne Aufschlüsselung nach Modulen, Wechselrichter und Speicher, fehlende Hersteller- und Typenbezeichnungen, unrealistische Ertragsversprechen, Unterschrift nur heute mit Sonderrabatt, sowie fehlende Positionen für Zählerschrank, Gerüst oder Netzanmeldung.'),
      F('Seid ihr wirklich unabhängig?',
        'Wir sind kein Hersteller und keine Montagefirma. Wir bewerten das Angebot fachlich und sagen Ihnen auch, wenn es gut ist. Dann können Sie es beim vorliegenden Anbieter unterschreiben. Vermitteln tun wir nur, wenn Sie das ausdrücklich möchten.'),
      F('Muss ich danach etwas bei euch beauftragen?',
        'Nein. Es entsteht keine Verpflichtung, weder aus der Prüfung noch aus einem anschließenden Gespräch. Viele nutzen den Check nur, um beim vorliegenden Anbieter sicherer verhandeln zu können.')
    ]
  },

  /* ----------------------------------------------- Bestandsanlagen-Check */
  bestand: {
    kicker: 'Bestehende Anlagen',
    titel: 'Häufige Fragen zu bestehenden Anlagen',
    intro: 'Fehlende Anmeldung, Baustopp, Mängel, insolventer Errichter: was in diesen Fällen zu tun ist.',
    items: [
      F('Was ist das Marktstammdatenregister?',
        'Ein öffentliches Register der Bundesnetzagentur, in dem jede Stromerzeugungsanlage eingetragen werden muss, auch kleine Balkonkraftwerke. Die Eintragung ist kostenlos und muss innerhalb eines Monats nach Inbetriebnahme erfolgen. Sie ist unabhängig von der Anmeldung beim Netzbetreiber, beides ist nötig.'),
      F('Meine Anlage wurde nie angemeldet, was passiert jetzt?',
        'Nachholen ist der richtige Schritt, und je früher desto besser. Eine fehlende Eintragung im Marktstammdatenregister kann zur Kürzung oder zum Wegfall der Einspeisevergütung führen und stellt eine Ordnungswidrigkeit dar. Wir helfen dabei, den Stand zu klären und die Anmeldung nachzuholen.'),
      F('Die Firma ist insolvent, wer haftet für Mängel?',
        'Gewährleistungsansprüche richten sich gegen das Unternehmen, das gebaut hat. Ist es insolvent, laufen sie praktisch ins Leere und können nur noch zur Insolvenztabelle angemeldet werden. Herstellergarantien auf Module, Wechselrichter oder Speicher bestehen davon unabhängig weiter und lassen sich oft direkt beim Hersteller geltend machen. Für die rechtliche Bewertung brauchen Sie einen Anwalt, wir liefern die technische Dokumentation dafür.'),
      F('Wie oft muss eine Photovoltaikanlage gewartet werden?',
        'Eine feste Wartungspflicht gibt es nicht. Sinnvoll ist eine Sichtprüfung alle zwei bis vier Jahre und eine wiederkehrende Prüfung der elektrischen Anlage nach DIN VDE 0105-100. Wichtiger als Reinigung ist die Kontrolle von Unterkonstruktion, Kabelführung und Wechselrichter-Meldungen. Bei Wärmepumpen empfehlen Hersteller meist eine jährliche Wartung.'),
      F('Meine Anlage bringt weniger Ertrag als versprochen, woran liegt das?',
        'Häufige Ursachen sind Verschattung, die bei der Planung unterschätzt wurde, falsch eingestellte oder unterdimensionierte Wechselrichter, ein defekter String, Verschmutzung oder schlicht zu optimistisch gerechnete Prognosen. Der erste Schritt ist immer ein Blick in die Ertragsdaten des Wechselrichters.'),
      F('Übernehmt ihr auch Anlagen, die ihr nicht gebaut habt?',
        'Ja, genau dafür gibt es diese Seite. Der erste Schritt ist eine Bestandsaufnahme: Was ist verbaut, was fehlt, was ist mangelhaft. Erst danach lässt sich seriös sagen, was nötig ist und was es kostet.'),
      F('Was kostet ein Wartungsvertrag?',
        'Das hängt stark von Anlagengröße und Leistungsumfang ab, deshalb nennen wir hier bewusst keine Pauschale. Entscheidend ist, was enthalten ist: reine Sichtprüfung, Messung, Reaktionszeit bei Störungen und ob Ersatzteile eingeschlossen sind. Wir holen Ihnen dazu ein konkretes Angebot eines Fachbetriebs ein.')
    ]
  },

  /* -------------------------------------------------------------- Termin */
  termin: {
    kicker: 'Zum Beratungstermin',
    titel: 'Häufige Fragen zum Termin',
    intro: 'Was Sie erwartet, was es kostet und wie Sie sich am besten vorbereiten.',
    items: [
      F('Was kostet das Beratungsgespräch?',
        'Das Telefongespräch ist kostenlos und unverbindlich. Es entsteht keine Verpflichtung, und wir verkaufen Ihnen im Gespräch nichts.'),
      F('Wie lange dauert der Termin?',
        'Wir planen 30 Minuten ein. Das reicht in aller Regel, um Ihr Vorhaben durchzugehen, offene Fragen zu klären und die nächsten Schritte festzulegen.'),
      F('Wie sollte ich mich vorbereiten?',
        'Am hilfreichsten sind Ihr Jahresstromverbrauch in Kilowattstunden und, falls es um eine Wärmepumpe geht, der bisherige Heizenergieverbrauch, also Gas- oder Ölmenge im Jahr. Beides steht auf Ihrer letzten Jahresabrechnung. Wenn Sie schon ein Angebot vorliegen haben, halten Sie es bereit.'),
      F('Kommt ihr auch vor Ort?',
        'Auf Wunsch ja, aber nur nach vorheriger Absprache. Ob ein Vor-Ort-Termin sinnvoll ist und was er gegebenenfalls kostet, klären wir vorher im Telefongespräch.'),
      F('Ist der gewählte Termin sofort verbindlich?',
        'Nein. Ihre Auswahl ist zunächst eine Anfrage. Wir prüfen den Zeitpunkt und bestätigen ihn, erst dann steht der Termin fest. Passt er bei uns nicht, schlagen wir Ihnen einen anderen vor.')
    ]
  },

  /* ------------------------------------------------ Wärmepumpen-Rechner */
  /* --------------------------------------------- Rentabilitätsrechner */
  rendite: {
    kicker: 'Häufig gefragt',
    titel: 'Häufige Fragen zur Wirtschaftlichkeit',
    intro: 'Was sich rechnet, was nicht und woran seriöse Rechnungen zu erkennen sind.',
    items: [
      F('Wann amortisiert sich eine Photovoltaikanlage?',
        'Bei guter Auslegung und hohem Eigenverbrauch sind 10 bis 14 Jahre ein realistischer Korridor, wenn man Betriebskosten und Leistungsverlust der Module ehrlich mitrechnet. Entscheidend ist nicht die Einspeisevergütung, sondern der Eigenverbrauch: Jede selbst genutzte Kilowattstunde spart 30 bis 40 Cent, jede eingespeiste bringt derzeit 7,7 Cent. Wer Ihnen fünf oder sechs Jahre verspricht, rechnet mit Annahmen, die selten eintreten.'),
      F('Lohnt sich ein Stromspeicher wirtschaftlich?',
        'Er hebt den Anteil, den Sie selbst verbrauchen, von rund 30 auf 55 bis 70 Prozent – kostet aber auch 3.000 bis 9.500 Euro. Über die Lebensdauer geht die Rechnung bei einem passend dimensionierten Speicher meist knapp auf. Als Richtwert gilt etwa 1 Kilowattstunde Speicher je 1.000 Kilowattstunden Jahresverbrauch. Ein Speicher, der im Sommer nie leer wird, verdient sein Geld nicht zurück. Wer Notstrom oder Unabhängigkeit will, entscheidet ohnehin nicht rein nach Rendite.'),
      F('Rechnet sich eine Wärmepumpe gegenüber Gas?',
        'Das hängt an drei Zahlen: der nötigen Vorlauftemperatur, dem Strompreis und dem Gaspreis. Bei Fußbodenheizung oder großzügigen Heizkörpern arbeitet eine Luft-Wasser-Wärmepumpe mit einer Jahresarbeitszahl von 3,5 bis 4 und ist im Betrieb klar günstiger. Bei kleinen, alten Heizkörpern und 55 bis 60 Grad Vorlauf kann der Kostenvorteil auf null schrumpfen. Ehrlich wird der Vergleich erst, wenn man gegenrechnet, dass ein alter Kessel ohnehin ersetzt werden muss.'),
      F('Warum rechnet dieser Rechner ohne steigende Energiepreise?',
        'Weil niemand weiß, wie sie sich entwickeln. Rechner, die pauschal drei oder vier Prozent Preissteigerung pro Jahr unterstellen, verkürzen die Amortisation deutlich – auf dem Papier. Wir rechnen bewusst mit heutigen Preisen. Steigen sie, wird Ihr Ergebnis besser als hier angezeigt. Ab 2027 wird der CO₂-Preis für Gebäude im europäischen Emissionshandel am Markt gebildet, was fossile Energie tendenziell verteuert.'),
      F('Was ist der Unterschied zum Wärmepumpen-Rechner?',
        'Der Wärmepumpen-Rechner beantwortet die technische Frage: Welche Heizlast hat Ihr Haus, welche Gerätegröße passt, welche Speicher braucht es? Der Rentabilitätsrechner beantwortet die kaufmännische Frage: Was kostet es, was sparen Sie im Jahr und wann ist es bezahlt? Beide greifen auf dieselben Kennwerte zurück, damit sich die Ergebnisse nicht widersprechen.'),
      F('Ersetzt das Ergebnis ein Angebot?',
        'Nein. Es ist eine Überschlagsrechnung mit offengelegten Annahmen – gut geeignet, um eine Größenordnung zu bekommen und ein vorliegendes Angebot einzuordnen. Was wirklich zählt, entscheidet sich vor Ort: Dachfläche, Verschattung, Zählerschrank, Heizlast und Zustand der Heizflächen. Schicken Sie uns Ihr Angebot, dann sagen wir Ihnen innerhalb von 24 Stunden, ob die Zahlen darin tragen.')
    ]
  },

  rechner: {
    kicker: 'Häufig gefragt',
    titel: 'Häufige Fragen zur Auslegung',
    intro: 'Die Fragen, die beim Rechnen am häufigsten aufkommen.',
    items: [
      F('Wie groß muss meine Wärmepumpe sein?',
        'Die Größe richtet sich nach der Heizlast des Gebäudes. Aus dem Jahresverbrauch lässt sie sich am zuverlässigsten ableiten: nutzbare Wärme abzüglich Warmwasser, geteilt durch rund 2.100 Vollbenutzungsstunden. Ohne Verbrauchsangabe rechnet man über Wohnfläche und Baualtersklasse. Verbindlich ist eine raumweise Heizlastberechnung nach DIN EN 12831.'),
      F('Wie viel Förderung gibt es 2026 für eine Wärmepumpe?',
        'Über den KfW-Zuschuss 458 gibt es 30 Prozent Grundförderung, dazu für selbstnutzende Eigentümer 16 Prozent Klimageschwindigkeitsbonus beim Tausch einer alten Heizung und einen Einkommensbonus von 40, 30 oder 10 Prozent je nach zu versteuerndem Haushaltseinkommen. Gedeckelt ist die Gesamtförderung bei 70 Prozent; die 80 Prozent erreichen nur selbstnutzende Eigentümer mit einem anzusetzenden zu versteuernden Haushaltseinkommen bis 30.000 Euro. Die förderfähigen Kosten der ersten Wohneinheit liegen bei 28.000 Euro. Daraus ergibt sich ein Höchstzuschuss von 22.400 Euro. Der Antrag muss vor der Auftragserteilung gestellt werden.'),
      F('Welche Jahresarbeitszahl erreicht eine Luft-Wasser-Wärmepumpe?',
        'Entscheidend ist die Vorlauftemperatur. Bei 35 Grad über eine Fußbodenheizung sind rund 4,3 realistisch, bei 45 Grad etwa 3,6 und bei 55 Grad über Bestandsheizkörper nur noch rund 3,0. Warmwasserbereitung über dieselbe Wärmepumpe senkt den Jahreswert um etwa 0,2. Größere Heizflächen und ein hydraulischer Abgleich sind deshalb meist die wirtschaftlichste Maßnahme.'),
      F('Braucht eine Wärmepumpe einen Pufferspeicher?',
        'In der Regel ja. Ein Puffer- oder Reihenspeicher mit etwa 20 Litern je Kilowatt Heizleistung, mindestens aber 50 Litern, stellt sicher, dass beim Abtauen genügend Wärme im System ist und die Wärmepumpe nicht ständig taktet. Der Warmwasserspeicher kommt separat dazu und richtet sich nach der Personenzahl.'),
      F('Wie genau ist das Ergebnis dieses Rechners?',
        'Es ist eine überschlägige Auslegung auf Basis Ihrer Angaben und ersetzt keine Planung. Für die Größenordnung und die Frage, ob sich der Umstieg lohnt, reicht sie gut aus. Verbindlich wird es erst mit einer raumweisen Heizlastberechnung nach DIN EN 12831 durch einen Fachbetrieb vor Ort. Auch die Förderangaben sind keine Zusage der KfW.')
    ]
  },

  /* ------------------------------------------------------------ Über uns */
  about: {
    kicker: 'Über die Zusammenarbeit',
    titel: 'Häufige Fragen zu uns',
    intro: 'Wer hinter BHD steht, wie wir arbeiten und woran wir verdienen.',
    items: [
      F('Baut ihr die Anlagen selbst?',
        'Nein. Wir beraten, planen die Auslegung und begleiten das Projekt. Gebaut wird von geprüften Installateur-Partnern mit langjähriger Montage-Erfahrung. Die Trennung ist Absicht: Wer nicht selbst montiert, kann ein Angebot unbefangener bewerten.'),
      F('Was kostet mich die Beratung?',
        'Beratung, Angebots-Check und Telefontermin sind kostenlos. Wir werden erst vergütet, wenn über uns tatsächlich ein Projekt zustande kommt. Für Sie ändert das nichts am Preis.'),
      F('In welchen Regionen seid ihr tätig?',
        'Unser Sitz ist Berlin, tätig sind wir bundesweit. Ob wir in Ihrer Region einen passenden Fachbetrieb haben, klären wir gleich bei der ersten Anfrage. Wenn nicht, sagen wir Ihnen das offen.'),
      F('Wer ist mein Ansprechpartner?',
        'Sie haben einen festen Ansprechpartner von der Anfrage bis zur Übergabe. Die Geschäftsführung ist in die Projekte eingebunden und sieht sich die Ausführung bei den entscheidenden Schritten an.'),
      F('Wie wählt ihr eure Partnerbetriebe aus?',
        'Nach Qualität der Ausführung, Termintreue und Umgang mit den Kunden. Betriebe, bei denen es wiederholt hakt, bekommen keine weiteren Projekte. Wir nehmen bewusst nicht jeden Auftrag an, weil wir für jede Anlage geradestehen wollen.')
    ]
  },

  /* ---------------------------------------------------------- Referenzen */
  ref: {
    kicker: 'Zu den Projekten',
    titel: 'Häufige Fragen zu den Referenzen',
    intro: 'Woher die Bilder stammen und was sie zeigen.',
    items: [
      F('Sind das eigene Projekte?',
        'Die gezeigten Fotos stammen aus Projekten, die unsere Fachpartner umgesetzt und die wir begleitet haben. Einzelne Aufnahmen von Geräten sind Herstellerbilder, erkennbar an der Studio-Optik.'),
      F('Wie lange dauert eine Installation?',
        'Die reine Montage einer Photovoltaikanlage dauert meist ein bis drei Tage, bei einer Wärmepumpe kommen Erdarbeiten, Hydraulik und Inbetriebnahme dazu. Der längere Teil sind Planung, Förderantrag und Netzanmeldung, nicht die Arbeit auf der Baustelle.'),
      F('Kann ich mit früheren Kunden sprechen?',
        'Auf Anfrage stellen wir gern einen Kontakt her, sofern der jeweilige Kunde einverstanden ist. Ungefragt geben wir keine Kundendaten weiter.')
    ]
  },

  /* ------------------------------------------------------------ Anfragen */
  ask: {
    kicker: 'Zur Anfrage',
    titel: 'Häufige Fragen zur Anfrage',
    intro: 'Was nach dem Absenden passiert und was mit Ihren Angaben geschieht.',
    items: [
      F('Was passiert nach meiner Anfrage?',
        'Wir sehen uns Ihre Angaben an und melden uns telefonisch oder per E-Mail. Wenn es passt, holen wir ein Angebot eines geprüften Fachbetriebs ein. Bis dahin entsteht Ihnen keinerlei Verpflichtung.'),
      F('Ist die Anfrage wirklich kostenlos?',
        'Ja. Anfrage, Beratung und Angebot sind kostenlos und unverbindlich.'),
      F('Werden meine Daten weitergegeben?',
        'Nur an den Fachbetrieb, der Ihr Angebot erstellt, und nur wenn es dazu kommt. Kein Verkauf an Dritte, keine Weitergabe an Adresshändler. Sie können Ihre Einwilligung jederzeit widerrufen.'),
      F('Wie schnell bekomme ich eine Antwort?',
        'In der Regel am selben Werktag, spätestens am nächsten. Wenn es eilt, rufen Sie einfach direkt an.')
    ]
  },

  /* ------------------------------------------------------------- Kontakt */
  kontakt: {
    kicker: 'Zur Erreichbarkeit',
    titel: 'Häufige Fragen zum Kontakt',
    intro: 'Wann und wie Sie uns am besten erreichen.',
    items: [
      F('Wann seid ihr erreichbar?',
        'Täglich von 8:00 bis 20:00 Uhr telefonisch. E-Mails beantworten wir in der Regel am selben Werktag.'),
      F('Kann ich auch per WhatsApp schreiben?',
        'Ja, unter derselben Nummer. Für Fotos von Ihrem Dach, dem Zählerschrank oder einem vorliegenden Angebot ist das oft der schnellste Weg.'),
      F('Beraten Sie auch außerhalb von Berlin?',
        'Ja, bundesweit. Der Sitz ist Berlin, die Beratung läuft telefonisch oder per Video, die Umsetzung über Fachbetriebe in Ihrer Region.')
    ]
  },

  /* ------------------------------------------------------------ Ratgeber */
  ratgeber: {
    kicker: 'Kurz beantwortet',
    titel: 'Häufige Fragen',
    intro: 'Die Kurzfassung zu den Themen, die wir im Ratgeber ausführlich behandeln.',
    items: [
      F('Lohnt sich Photovoltaik 2026 noch?',
        'In den meisten Fällen ja. Entscheidend ist nicht die Einspeisevergütung, sondern der Eigenverbrauch: Jede selbst genutzte Kilowattstunde spart 30 bis 40 Cent. Dazu kommt die dauerhafte Umsatzsteuerbefreiung.'),
      F('Geht eine Wärmepumpe im Altbau?',
        'Meistens ja. Entscheidend ist die Vorlauftemperatur, nicht das Baujahr. Größere Heizkörper in einzelnen Räumen und ein hydraulischer Abgleich sind fast immer günstiger als eine komplette Dämmung.'),
      F('Wie prüfe ich ein Angebot selbst?',
        'Achten Sie auf Hersteller und Typenbezeichnungen aller Komponenten, den Preis je kWp beziehungsweise je kWh, vollständige Nebenpositionen wie Gerüst und Zählerschrank sowie realistische Ertragsangaben. Die ausführliche Checkliste steht im Ratgeberbeitrag.')
    ]
  },

  'rat-pv': {
    kicker: 'Kurz beantwortet',
    titel: 'Häufige Fragen dazu',
    intro: '',
    items: [
      F('Wie viel spare ich mit einer Photovoltaikanlage im Jahr?',
        'Das hängt am Eigenverbrauch. Bei einer 10-kWp-Anlage und 4.000 kWh Jahresverbrauch nutzen Sie ohne Speicher rund 1.200 kWh selbst, das sind bei 35 Cent etwa 420 Euro Ersparnis, dazu die Einspeisevergütung für den Rest. Mit Speicher steigt der selbst genutzte Anteil deutlich.'),
      F('Was passiert nach 20 Jahren mit der Einspeisevergütung?',
        'Die gesetzliche Vergütung läuft 20 Jahre plus Inbetriebnahmejahr. Danach können Sie den Strom weiter selbst nutzen, ihn über einen Direktvermarkter verkaufen oder die Anlage schlicht weiterbetreiben. Technisch laufen die Module in aller Regel weiter.'),
      F('Rechnet sich eine Anlage auch auf einem Ost-West-Dach?',
        'Ja. Ein Ost-West-Dach bringt etwa 10 bis 20 Prozent weniger Jahresertrag als Süd, verteilt ihn aber gleichmäßiger über den Tag, also morgens und abends, wenn im Haushalt Strom gebraucht wird. Für den Eigenverbrauch ist das häufig sogar günstiger.')
    ]
  },

  'rat-wp': {
    kicker: 'Kurz beantwortet',
    titel: 'Häufige Fragen dazu',
    intro: '',
    items: [
      F('Woran erkenne ich, ob mein Altbau geeignet ist?',
        'Ein einfacher Test: Drehen Sie an einem kalten Tag die Vorlauftemperatur Ihrer Heizung schrittweise herunter. Wird es bei 50 bis 55 Grad noch überall warm, ist eine Wärmepumpe realistisch. Sicherheit gibt eine Heizlastberechnung nach DIN EN 12831.'),
      F('Muss ich vorher dämmen?',
        'Nicht zwingend. Oft reichen größere Heizkörper in wenigen Räumen und ein hydraulischer Abgleich, um die Vorlauftemperatur ausreichend zu senken. Das kostet einen Bruchteil einer Fassadendämmung und wirkt sofort.'),
      F('Was kostet der Betrieb im Vergleich zu Gas?',
        'Bei einer Jahresarbeitszahl von 3,6 und 30 Cent je Kilowattstunde Strom kostet die Kilowattstunde Wärme rund 8 Cent. Bei Gas mit 90 Prozent Nutzungsgrad und 12 Cent je Kilowattstunde sind es etwa 13 Cent. Der Abstand hängt stark vom Verhältnis Strom- zu Gaspreis ab.')
    ]
  },

  /* Standortseite Berlin – Stand 14.09.2026, amtlich geprueft (Quellen auf der Seite). */
  berlin: {
    kicker: 'Kurz beantwortet',
    titel: 'Häufige Fragen aus Berlin',
    intro: 'Stand September 2026. Förderprogramme ändern sich, vor einem Auftrag deshalb immer den aktuellen Stand prüfen.',
    items: [
      F('Gilt die Solarpflicht in Berlin auch für mein bestehendes Haus?',
        'Nur, wenn das Dach nach dem 31. Dezember 2022 wesentlich umgebaut wird, also bei Dachausbau, Aufstockung oder einer grundständigen Sanierung, bei der die wasserführende Schicht erheblich erneuert wird. Solange Sie am Dach nichts Grundlegendes machen, besteht für ein bestehendes Haus keine Pflicht.'),
      F('Wie groß muss die Solaranlage nach dem Berliner Solargesetz sein?',
        'Grundsätzlich müssen 30 Prozent der Dachfläche belegt werden. Bei bestehenden Wohnhäusern mit höchstens zwei Wohnungen ist die Pflicht schon mit 2 kW installierter Leistung erfüllt. Eine Solarthermieanlage auf dem Dach zählt ebenfalls.'),
      F('Welchen Zuschuss gibt es in Berlin für einen Stromspeicher?',
        'Über das Landesprogramm SolarPLUS gibt es für Ein- und Zweifamilienhäuser eine Pauschale von 500 € bis 4.750 €, gestaffelt nach der Leistung der Solaranlage. Voraussetzung ist unter anderem, dass der Speicher zusammen mit einer neuen Anlage installiert wird oder der Antrag bis drei Monate nach deren Inbetriebnahme gestellt wird.'),
      F('Muss ich den SolarPLUS-Antrag vor dem Auftrag stellen?',
        'Das ist dringend zu empfehlen. Als Beginn des Vorhabens zählt schon der unterschriebene Auftrag oder eine Anzahlung. Wer vor dem Antrag beauftragt, kann daraus keinen Anspruch auf den Zuschuss ableiten und trägt das Risiko selbst.'),
      F('Gibt es in Berlin eine eigene Förderung für Wärmepumpen?',
        'Derzeit nicht. Das frühere Landesprogramm Effiziente GebäudePLUS nimmt seit Dezember 2023 keine Anträge mehr an. Es gilt der Zuschuss der KfW aus dem Programm 458: 30 Prozent Grundförderung plus mögliche Boni, zusammen höchstens 70 Prozent, bei niedrigem Einkommen bis 80 Prozent.'),
      F('Darf ich auf einem denkmalgeschützten Haus in Berlin eine Solaranlage bauen?',
        'Auf den meisten Berliner Baudenkmalen ist das nach Einschätzung des Landesdenkmalamts grundsätzlich möglich. Sie brauchen aber immer eine Genehmigung, meist vom Bezirksamt. Den Fachbetrieb sollten Sie erst beauftragen, wenn sie vorliegt. Für denkmalgerechte Anlagen gibt es aus SolarPLUS bis zu 5.700 €.')
    ]
  },

  /* Standortseite Brandenburg – Rechtsstand 23.09.2026, woertlich gegen die
   * Brandenburgische Bauordnung geprueft (Quellen stehen auf der Seite). */
  brandenburg: {
    kicker: 'Kurz beantwortet',
    titel: 'Häufige Fragen aus Brandenburg',
    intro: 'Stand September 2026. Bauordnung und Förderprogramme ändern sich, vor einem Auftrag deshalb immer den aktuellen Stand prüfen.',
    items: [
      F('Gibt es in Brandenburg eine Solarpflicht?',
        'Nein. Die Brandenburgische Bauordnung in der Fassung vom 29. Juni 2026 enthält keine Pflicht, eine Solaranlage zu errichten — auch nicht bei einer Dachsanierung. Das unterscheidet Brandenburg von Berlin, wo das Solargesetz bei Neubau und grundlegender Dachsanierung eine Anlage vorschreibt.'),
      F('Brauche ich in Brandenburg eine Baugenehmigung für die Solaranlage?',
        'Für die normale Anlage nicht. Nach § 61 der Brandenburgischen Bauordnung sind Solaranlagen in, an und auf Dach- und Außenwandflächen verfahrensfrei, ebenso gebäudeunabhängige Anlagen bis 3 Meter Höhe und 9 Meter Länge. Ausgenommen sind Hochhäuser. Liegt Ihr Haus im Geltungsbereich einer städtebaulichen Satzung oder einer Gestaltungssatzung mit Vorgaben zur Anlage, gilt die Verfahrensfreiheit nur, wenn die Anlage diesen Festsetzungen nicht widerspricht.'),
      F('Gilt das auch bei Denkmalschutz?',
        'Nein. Verfahrensfrei heißt nicht erlaubnisfrei. Steht das Gebäude unter Denkmalschutz oder liegt es in einem Denkmalbereich, brauchen Sie zusätzlich die Erlaubnis der unteren Denkmalschutzbehörde beim Landkreis oder bei der kreisfreien Stadt. Beauftragen Sie den Betrieb erst, wenn diese vorliegt.'),
      F('Zahlt das Land Brandenburg einen Zuschuss für meine Photovoltaikanlage?',
        'Für die private Aufdachanlage auf dem eigenen Haus gibt es keinen Investitionszuschuss des Landes. Es gibt kommunale Programme, die aber nicht durchgehend laufen: Die Landeshauptstadt Potsdam hat ein Klimaschutzförderprogramm, das zum Stand 23. September 2026 keine Anträge annimmt. Unabhängig davon fällt auf Lieferung und Montage einer Anlage am Wohngebäude keine Mehrwertsteuer an.'),
      F('Wie nah darf die Anlage an die Grundstücksgrenze?',
        'Nach § 6 der Brandenburgischen Bauordnung bleiben Solaranlagen bei rechtmäßig bestehenden Gebäuden bei der Berechnung der Abstandsflächen außer Betracht, solange sie nicht stärker als 0,50 Meter auftragen. Zu Brandwänden ist für Anlagen, die höchstens 30 Zentimeter über die Dachhaut ragen, ein Abstand von mindestens 0,50 Meter einzuhalten. Bei Reihen- und Doppelhäusern fällt dadurch der letzte Modulstreifen oft weg.'),
      F('Wer ist in Brandenburg mein Netzbetreiber?',
        'Anders als in Berlin gibt es nicht den einen. Je nach Ort sind E.DIS Netz, MITNETZ STROM oder ein örtliches Stadtwerk zuständig. Wer es ist, steht auf Ihrer Stromrechnung. Die Anmeldung übernimmt normalerweise der ausführende Elektrofachbetrieb; die Eintragung im Marktstammdatenregister bleibt Ihre Pflicht als Betreiber.')
    ]
  },

  /* Zeitkritisch: Werte am 23.09.2026 woertlich aus Merkblatt KfW 458 (07/2026).
   * ZWINGEND zum 01.02.2027 ueberarbeiten. */
  foerderung2027: {
    kicker: 'Kurz beantwortet',
    titel: 'Häufige Fragen zur Absenkung',
    intro: 'Stand 23. September 2026 nach dem Merkblatt KfW 458. Was bewilligt wird, entscheidet allein die KfW.',
    items: [
      F('Was genau ändert sich am 1. Februar 2027?',
        'Zwei Werte sinken gleichzeitig. Der Klimageschwindigkeitsbonus geht von 16 auf 12 Prozent zurück, und der Höchstbetrag der förderfähigen Kosten für die erste Wohneinheit sinkt von 28.000 auf 27.250 Euro. Beides sinkt danach halbjährlich weiter, jeweils zum 1. Februar und zum 1. August. Die Grundförderung von 30 Prozent und der Einkommensbonus bleiben unverändert.'),
      F('Zählt das Datum des Einbaus oder das Datum des Antrags?',
        'Der Zeitpunkt der Antragstellung. Wann die Wärmepumpe eingebaut wird und wann die Rechnung kommt, spielt für den Fördersatz keine Rolle. Deshalb ist es entscheidend, den Antrag rechtzeitig gestellt zu haben — nicht die Baustelle rechtzeitig fertig zu bekommen.'),
      F('Wie viel Geld verliere ich, wenn ich warte?',
        'Das hängt davon ab, ob Sie an der Obergrenze liegen. Wer 30 Prozent Grundförderung und 16 Prozent Klimabonus bekommt, erhält heute 12.880 Euro und ab dem 1. Februar 2027 noch 11.445 Euro — ein Unterschied von 1.435 Euro. Wer wegen eines niedrigen Einkommens ohnehin die Obergrenze von 70 oder 80 Prozent erreicht, verliert nur die gesunkene Bemessungsgrundlage, also rund 525 bis 600 Euro.'),
      F('Bis wann muss ich mich entschieden haben?',
        'Deutlich vor Ende Januar. Bevor Sie den Antrag überhaupt stellen können, brauchen Sie eine Bestätigung zum Antrag von einem Fachunternehmen oder einer Energieeffizienz-Expertin und einen bereits unterschriebenen Liefer- oder Leistungsvertrag mit einer aufschiebenden oder auflösenden Bedingung zur KfW-Zusage. Dafür muss die Auslegung stehen. Realistisch sollte das bis Ende November erledigt sein.'),
      F('Bekomme ich den Klimageschwindigkeitsbonus für meine Gasheizung?',
        'Nur, wenn deren Inbetriebnahme zum Zeitpunkt der Antragstellung mindestens 20 Jahre zurückliegt. Bei Öl-, Kohle-, Gasetagen- und Nachtstromspeicherheizungen gibt es den Bonus unabhängig vom Alter, die Heizung muss aber funktionstüchtig sein. Wer wartet, bis sie ausfällt, kann den Bonus verlieren.'),
      F('Lohnt es sich, deswegen zu überstürzen?',
        'Nein. Eine schlecht ausgelegte Wärmepumpe kostet über die Laufzeit deutlich mehr, als die Absenkung ausmacht. Wenn Sie ohnehin an der Obergrenze liegen und rund 525 Euro Unterschied im Raum stehen, ist das kein Grund, die Heizlastberechnung zu überspringen. Wer dagegen bei 46 Prozent landet und die Unterlagen beisammen hat, sollte den Antrag nicht liegen lassen.')
    ]
  },

  /* MaStR – Fristen und Sanktionen am 23.09.2026 gegen Bundesnetzagentur geprueft.
   * Keine ungeprueften Bussgeld-Zahlen ergaenzen. */
  mastr: {
    kicker: 'Kurz beantwortet',
    titel: 'Häufige Fragen zur Anmeldung',
    intro: 'Stand September 2026. Keine Rechtsberatung — im Streitfall gehört der Vorgang zu einer Anwältin oder einem Anwalt.',
    items: [
      F('Wie lange habe ich Zeit, die Anlage anzumelden?',
        'Einen Monat. Die Frist beginnt mit der Inbetriebnahme der Einheit, nicht mit der Schlussrechnung und nicht mit dem Zählerwechsel. Dieselbe Monatsfrist gilt später auch für Änderungen, etwa eine Erweiterung der Anlage oder einen Betreiberwechsel nach einem Hausverkauf.'),
      F('Macht das nicht mein Installateur?',
        'Die Anmeldung beim Netzbetreiber übernimmt in aller Regel der Elektrofachbetrieb, weil dafür eine Eintragung im Installateurverzeichnis nötig ist. Die Eintragung im Marktstammdatenregister ist dagegen Pflicht des Betreibers, also meistens Ihre. Manche Betriebe bieten das mit an — verlassen Sie sich aber nicht darauf, ohne die Registrierungsbestätigung gesehen zu haben.'),
      F('Was passiert, wenn ich die Frist verpasst habe?',
        'Zwei Dinge sind zu trennen. Die Einspeisevergütung kann nur ungekürzt ausgezahlt werden, wenn die Melde- und Registrierungspflichten erfüllt sind — der Netzbetreiber hält also Zahlungen zurück. Eine Sanktionszahlung entsteht nach § 52 Absatz 1 Nummer 11 EEG 2023 erst beim Doppelverstoß, wenn also zusätzlich die EEG-Jahresmeldung bis zum 28. Februar versäumt wurde. Sie beträgt dann 10 Euro je Kilowatt installierter Leistung und Kalendermonat.'),
      F('Wird die Sanktion kleiner, wenn ich es nachhole?',
        'Ja. Nach § 52 Absatz 3 EEG verringert sich die Sanktionszahlung rückwirkend um 80 Prozent, wenn beide Pflichten nachträglich erfüllt werden — aus 10 Euro je Kilowatt und Monat werden 2 Euro. Bei einer 10-kWp-Anlage und einem Jahr Verzug sind das statt 1.200 Euro noch 240 Euro. Deshalb lohnt es sich, das sofort zu erledigen und nicht abzuwarten.'),
      F('Muss ich ein Balkonkraftwerk auch anmelden?',
        'Ja. Steckersolargeräte müssen ebenfalls im Marktstammdatenregister eingetragen werden, allerdings in einem verkürzten Verfahren mit deutlich weniger Angaben.'),
      F('Muss der Stromspeicher separat eingetragen werden?',
        'Ja. Die Solaranlage wird als Stromerzeugungseinheit eingetragen, der Speicher als eigene Einheit. Ein Speicher ohne eigenen Eintrag ist einer der häufigsten Fehler und fällt oft erst auf, wenn der Netzbetreiber nachfragt.'),
      F('Kann ich nachsehen, ob die Anlage auf meinem Haus registriert ist?',
        'Ja, die eingetragenen Anlagendaten sind öffentlich einsehbar. Das ist besonders vor einem Hauskauf nützlich: Steht die vorhandene Anlage nicht im Register, ist das ein Punkt für die Kaufverhandlung und nicht Ihr Problem nach dem Einzug.')
    ]
  },

  'rat-check': {
    kicker: 'Kurz beantwortet',
    titel: 'Häufige Fragen dazu',
    intro: '',
    items: [
      F('Wie viele Angebote sollte ich einholen?',
        'Zwei bis drei reichen. Mehr führt selten zu besseren Ergebnissen, kostet aber viel Zeit. Wichtiger als die Anzahl ist, dass die Angebote vergleichbar sind, also gleiche Anlagengröße, gleicher Speicher, gleicher Leistungsumfang.'),
      F('Darf ich ein Angebot verhandeln?',
        'Ja, das ist üblich. Am wirksamsten ist es, nicht über den Endpreis zu verhandeln, sondern über den Leistungsumfang: bessere Komponenten zum selben Preis, Gerüst inklusive, längere Gewährleistung. Ein sachlich begründeter Einwand wirkt besser als ein reines Preisgespräch.'),
      F('Was gehört in ein vollständiges Angebot?',
        'Hersteller und Typ aller Komponenten mit Stückzahl, Leistung in kWp und Speicherkapazität in kWh, Montageart und Unterkonstruktion, Nebenleistungen wie Gerüst, Zählerschrank und Netzanmeldung, Gewährleistungsfristen sowie ein realistischer Ertragswert mit Angabe der Annahmen.')
    ]
  }
};

/* Erzeugt den sichtbaren Abschnitt. Markup entspricht den bestehenden
 * FAQ-Bloecken, damit sich optisch nichts unterscheidet. Das Attribut
 * data-faq markiert den Container als echten Frage-Antwort-Block - nur
 * solche wandern ins Schema. */
function faqHtml(key) {
  const d = FAQ[key];
  if (!d || !d.items.length) return '';
  const chevron = '<svg class="ic"><use href="#i-chevron"/></svg>';
  const items = d.items.map(i =>
    '        <details class="faq-item"><summary>' + i.frage + ' ' + chevron +
    '</summary><div class="ans">' + i.antwort + '</div></details>').join('\n');
  return [
    '  <section class="pad" style="padding-top:0">',
    '    <div class="wrap">',
    '      <div class="head">',
    '        <div class="kicker">' + d.kicker + '</div>',
    '        <h2>' + d.titel + '</h2>',
    d.intro ? '        <p>' + d.intro + '</p>' : '',
    '      </div>',
    '      <div class="faq" data-faq>',
    items,
    '      </div>',
    '      <div class="faq-more">',
    '        <p>Ihre Frage war nicht dabei?</p>',
    '        <div class="faq-more-btns">',
    '          <a href="tel:+491634440392" class="btn"><svg class="ic"><use href="#i-phone"/></svg> 0163 4440392</a>',
    '          <a data-nav="termin" class="btn btn-ghost">Termin vereinbaren</a>',
    '        </div>',
    '      </div>',
    '    </div>',
    '  </section>'
  ].filter(Boolean).join('\n');
}

module.exports = { FAQ, faqHtml };
