/* GEO-Bausteine: Kurzantworten und Quellen je Seite.
 *
 * KI-Suchen (ChatGPT, Perplexity, Google AI Overviews, Copilot) zitieren
 * bevorzugt kurze, in sich verstaendliche Aussagen mit Zahl, Bedingung und
 * Quelle. Deshalb steht oben auf jeder Themenseite ein Kasten "Das Wichtigste
 * in Kuerze" mit drei solchen Saetzen. Dieselben Saetze landen im JSON-LD
 * (WebPage.abstract) und in llms.txt / llms-full.txt.
 *
 * REGEL: Hier steht nur, was auch im Seitentext steht. Aendert sich eine Zahl
 * auf der Seite, muss sie hier mitgeaendert werden. Keine Gedankenstriche,
 * kurze Hauptsaetze (siehe Memory website-texte-nuechtern).
 *
 * Quellen: nur fuer Seiten, die im Text noch keine amtlichen Belege verlinken.
 * Alle anderen Belege sammelt build.js automatisch aus den Seiten selbst.
 */

const KFW_458 = 'https://www.kfw.de/inlandsfoerderung/Privatpersonen/Bestehende-Immobilie/F%C3%B6rderprodukte/Heizungsf%C3%B6rderung-f%C3%BCr-Privatpersonen-Wohngeb%C3%A4ude-(458)/';
const KFW_458_PDF = 'https://www.kfw.de/PDF/Download-Center/F%C3%B6rderprogramme-(Inlandsf%C3%B6rderung)/PDF-Dokumente/6000005131_M_458.pdf';
const USTG_12 = 'https://www.gesetze-im-internet.de/ustg_1980/__12.html';
const ESTG_3 = 'https://www.gesetze-im-internet.de/estg/__3.html';
const ENWG_14A = 'https://www.gesetze-im-internet.de/enwg_2005/__14a.html';
const BNETZA_EEG = 'https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Foerderung/start.html';
const BMF_2023_02 = 'https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Steuerarten/Umsatzsteuer/Umsatzsteuer-Anwendungserlass/2023-02-27-nullsteuersatz-fuer-umsaetze-im-zusammenhang-mit-bestimmten-photovoltaikanlagen.pdf';
const BMF_2023_11 = 'https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Steuerarten/Umsatzsteuer/Umsatzsteuer-Anwendungserlass/2023-11-30-einzelfragen-bei-der-anwendung-des-nullsteuersatzes-fuer-bestimmte-photovoltaikanlagen.pdf';
const HTW_SPEICHER = 'https://solar.htw-berlin.de/wp-content/uploads/HTW-aquu-Stromspeicher-Inspektion-2026.pdf';
const ISE_FAKTEN = 'https://www.ise.fraunhofer.de/de/veroeffentlichungen/studien/aktuelle-fakten-zur-photovoltaik-in-deutschland.html';
const ISE_WPQS = 'https://www.ise.fraunhofer.de/content/dam/ise/de/documents/projekte/WP-QS_Schlussbericht.pdf';
const TA_LAERM = 'https://www.verwaltungsvorschriften-im-internet.de/bsvwvbund_26081998_IG19980826.htm';
const MASTR_FRIST = 'https://www.marktstammdatenregister.de/MaStRHilfe/subpages/registrierungVerpflichtendFristen.html';

const KURZ = {
  pv: [
    'Seit dem 1. Januar 2023 fällt auf Kauf und Montage einer Solaranlage am Wohnhaus keine Umsatzsteuer an (§ 12 Abs. 3 UStG). Die Regel ist unbefristet.',
    'Als Faustregel gilt rund 1 kWp Leistung je 1.000 kWh Jahresverbrauch. Mit Wärmepumpe oder E-Auto darf die Anlage größer sein.',
    'In unserem Rechenbeispiel (10 kWp, 8 kWh Speicher, 19.500 €) bringt die Anlage rund 1.347 € im Jahr und hat sich nach etwa 14,5 Jahren bezahlt gemacht.'
  ],
  speicher: [
    'Ohne Speicher nutzt ein Haushalt etwa ein Drittel seines Solarstroms selbst, mit Speicher 60 bis 80 Prozent.',
    'Richtwert für die Größe ist etwa 1 kWh Speicher je 1.000 kWh Jahresverbrauch. Im Einfamilienhaus mit vier Personen sind 10 bis 12 kWh üblich.',
    'Ohne Wärmepumpe oder E-Auto trägt sich ein Speicher oft nicht sicher, im Beispiel erst nach rund 18 Jahren. Bei 8.000 kWh Verbrauch sind es etwa zehn Jahre.'
  ],
  wp: [
    'Eine Wärmepumpe macht aus 1 kWh Strom 3 bis 4 kWh Wärme. Wie viel genau, hängt an der Vorlauftemperatur: bei 35 °C rund 4,3, bei 55 °C etwa 3,0.',
    'Die KfW bezuschusst den Einbau mit 30 % Grundförderung plus Boni, zusammen höchstens 70 oder 80 % von 28.000 €. Das sind bis zu 22.400 €.',
    'Der Förderantrag muss vor der Auftragserteilung gestellt werden. Üblich ist ein Vertrag mit aufschiebender Bedingung.'
  ],
  kosten: [
    'Eine Solaranlage mit 10 kWp kostet schlüsselfertig etwa 12.500 bis 16.000 €, mit Speicher 17.000 bis 21.000 €. Umsatzsteuer fällt dabei nicht an.',
    'Eine Luft-Wasser-Wärmepumpe im Einfamilienhaus kostet als komplette Umstellung typischerweise 22.000 bis 35.000 €.',
    'Beispiel: Bei 28.000 € Investition und Tausch einer Ölheizung zahlt die KfW 46 %, also 12.880 €. Der Eigenanteil liegt dann bei 15.120 €.'
  ],
  foerderung2027: [
    'Am 1. Februar 2027 sinkt der Klimageschwindigkeitsbonus der KfW von 16 auf 12 %. Danach sinkt er halbjährlich weiter, ab dem 1. August 2028 entfällt er.',
    'Am selben Tag sinken die förderfähigen Höchstkosten von 28.000 auf 27.250 €, danach alle sechs Monate um weitere 750 €.',
    'Maßgeblich ist das Datum der Antragstellung. Wer eine Ölheizung ersetzt, bekommt bei einem Antrag ab Februar 2027 rund 1.435 € weniger.'
  ],
  berlin: [
    'Das Berliner Solargesetz verlangt bei Neubau und wesentlicher Dachsanierung eine Solaranlage. Bei Häusern mit höchstens zwei Wohnungen genügen 2 kW.',
    'Das Landesprogramm SolarPLUS zahlt Zuschüsse für Stromspeicher (bis 4.750 €), Zählerschrank (750 €) und denkmalgerechte Anlagen (bis 5.700 €).',
    'Ein eigenes Berliner Programm für Wärmepumpen gibt es derzeit nicht. Es gilt der KfW-Zuschuss des Bundes.'
  ],
  brandenburg: [
    'In Brandenburg gibt es keine Solarpflicht, auch nicht bei einer Dachsanierung.',
    'Solaranlagen auf Dach und Fassade sind nach § 61 BbgBO verfahrensfrei. Ausnahmen gelten bei Hochhäusern und örtlichen Satzungen.',
    'Das Land zahlt keinen Zuschuss für private Aufdachanlagen. Für die Wärmepumpe gilt der KfW-Zuschuss des Bundes.'
  ],
  mastr: [
    'Jede Solaranlage, auch ein Balkonkraftwerk, muss innerhalb eines Monats nach Inbetriebnahme im Marktstammdatenregister eingetragen werden. Zuständig ist der Betreiber, die Eintragung ist kostenlos.',
    'Fehlt der Eintrag, hält der Netzbetreiber die Einspeisevergütung zurück.',
    'Eine Sanktionszahlung von 10 € je kW und Monat entsteht erst, wenn zusätzlich die EEG-Jahresmeldung bis 28. Februar fehlt. Wer beides nachholt, zahlt 80 % weniger.'
  ],
  wallbox: [
    'Jede Wallbox muss vor der Inbetriebnahme beim Netzbetreiber angemeldet werden. Über 12 kVA braucht sie zusätzlich seine Zustimmung (§ 19 NAV).',
    'Für ein Einfamilienhaus reichen meist 11 kW. Damit ist ein Auto über Nacht voll.',
    'Neue Wallboxen über 4,2 kW sind nach § 14a EnWG steuerbar. Dafür sinkt das Netzentgelt, bei der Stromnetz Berlin 2026 pauschal um 146,58 € im Jahr. Einen Zuschuss für die private Wallbox gibt es 2026 nicht.'
  ],
  potsdam: [
    'Das Potsdamer Klimaschutzförderprogramm sieht unter anderem 2.000 € für eine Wärmepumpe und 200 € je kWp Photovoltaik vor, höchstens 1.200 €. Derzeit nimmt die Stadt aber keine Anträge an.',
    'In den historischen Stadtkernen, den Vorstädten und am Welterbe braucht eine Solaranlage oft eine Erlaubnis.',
    'Netzbetreiber ist die Netzgesellschaft Potsdam. Seit Juni 2026 gibt es einen beschlossenen Wärmeplan mit Fernwärme-Vorranggebieten.'
  ],
  falkensee: [
    'Für rund 12.000 der etwa 15.700 beheizten Gebäude in Falkensee sieht der Wärmeplan eine eigene Heizung im Haus vor, kein Wärmenetz.',
    'Netzbetreiber ist E.DIS Netz. Eine Wärmepumpe muss dort unabhängig von ihrer Leistung angemeldet werden.',
    'Die Stadt hat kein eigenes Förderprogramm. Im Angerdorf Falkenhagen schließt eine Gestaltungssatzung Kollektoren auf Dächern grundsätzlich aus.'
  ],
  bernau: [
    'Selbst genutzte Wohnhäuser mit bis zu zwei Wohnungen sind in Bernau vom Fernwärme-Anschlusszwang befreit (§ 6 Fernwärmesatzung). Eine Wärmepumpe ist dort also möglich.',
    'Im Stadtgebiet betreiben die Stadtwerke Bernau das Stromnetz.',
    'In der Altstadt gelten Denkmal- und Gestaltungssatzung. In Birkholz darf eine sichtbare Anlage höchstens ein Viertel des Dachs belegen. Eine Stadtförderung gibt es nicht.'
  ],
  oranienburg: [
    'Weite Teile von Oranienburg gelten als Kampfmittelverdachtsfläche. Vor den Erdarbeiten für eine Wärmepumpe sollte das geklärt sein.',
    'Kernstadt und Sachsenhausen gehören zum Netz der Stadtwerke Oranienburg, die übrigen Ortsteile zu E.DIS Netz.',
    'Im Gebiet der Erhaltungssatzung Innenstadt braucht auch eine sichtbare Solaranlage eine Genehmigung.'
  ],
  rechner: [
    'Die Größe einer Wärmepumpe richtet sich nach der Heizlast. Als Richtwert gelten 30 Watt je m² im Neubau bis 120 Watt je m² im unsanierten Altbau.',
    'Ein Haus mit 120 m² aus den Jahren 1984 bis 1994 hat damit rund 9 kW Heizlast. Mit Warmwasser passt eine Wärmepumpe mit etwa 10 kW.',
    'Die KfW fördert mit 30 % Grundförderung plus Boni, höchstens 70 oder 80 % von 28.000 €. Der Rechner ermittelt Größe und Zuschuss aus Ihren Angaben, ohne Anmeldung.'
  ],
  'rat-pv': [
    'In den meisten Fällen ja. Das Geld bringt heute der vermiedene Netzbezug, nicht mehr die Einspeisung.',
    'Selbst verbrauchter Strom spart rund 35 Cent je kWh. Eingespeister Strom bringt bei Anlagen bis 10 kWp rund 7,7 Cent.',
    'Im Beispiel (10 kWp, 8 kWh Speicher, 19.500 €) liegt der Vorteil bei rund 1.347 € im Jahr. Die Anlage hat sich nach etwa 14,5 Jahren bezahlt gemacht.'
  ],
  'rat-wp': [
    'Meistens ja. Entscheidend ist die Vorlauftemperatur, nicht das Baujahr und nicht die Dämmung.',
    'Selbsttest: An einem kalten Tag den Vorlauf am Kessel auf 50 und dann auf 45 °C senken. Bleibt es in allen Räumen warm, ist das Haus in der Regel geeignet.',
    'Größere Heizkörper in wenigen Räumen (400 bis 900 € je Stück) und ein hydraulischer Abgleich (700 bis 1.500 €) bringen meist mehr als eine Dämmung.'
  ],
  'rat-check': [
    'In jedes Angebot gehören alle Komponenten mit Hersteller und Typ, getrennt ausgewiesene Garantien und der Zählerschrank als eigene Position.',
    'Übliche Anzahlungen liegen bei 20 bis 30 %. Wer 80 % vor Baubeginn verlangt, verlagert sein Risiko auf Sie.',
    'Bei Photovoltaik sind 900 bis 1.050 kWh je kWp realistisch. Bei einer Wärmepumpe muss die Heizlast genannt sein und wie sie ermittelt wurde.'
  ],
  'rat-eeg': [
    'Für Anlagen bis 10 kW mit Inbetriebnahme vom 1. August bis 31. Dezember 2026 zahlt der Netzbetreiber 7,70 ct je kWh bei Teileinspeisung und 12,22 ct bei Volleinspeisung, 20 Jahre lang.',
    'Der Satz bei Inbetriebnahme bleibt für die ganze Laufzeit fest.',
    'Für neue Anlagen ab 2027 sieht ein Gesetzentwurf (Drucksache 21/7867) statt fester Vergütung eine Übergangszahlung von rund 5,2 ct für etwa drei Jahre vor. Beschlossen ist er noch nicht (Stand Oktober 2026).'
  ],
  'rat-pvwp': [
    'In Messungen des Fraunhofer ISE kamen ohne Batterie 13 bis 36 % des Wärmepumpenstroms vom eigenen Dach, mit Batterie 17 bis 49 %.',
    'Im Winter sinkt der Solaranteil stark. Die Solaranlage macht die Wärmepumpe nicht stromautark, senkt aber die Stromkosten über das Jahr deutlich.',
    'Am meisten bringt es, Solarüberschuss als Wärme zu speichern, etwa über eine höhere Warmwassertemperatur.'
  ],
  'rat-speicher': [
    'Ein Speicher lässt sich fast immer nachrüsten, entweder am Hybridwechselrichter (DC) oder mit eigenem Batteriewechselrichter (AC).',
    'Auch für nachgerüstete Speicher gilt 0 % Umsatzsteuer, wenn die Anlage höchstens 30 kWp hat (§ 12 Abs. 3 UStG).',
    'Der Speicher ist im Marktstammdatenregister eine eigene Einheit und muss innerhalb eines Monats nach Inbetriebnahme eingetragen werden.'
  ]
};

const QUELLEN = {
  pv: [
    ['§ 12 Abs. 3 UStG, Nullsteuersatz', USTG_12],
    ['§ 3 Nr. 72 EStG, Steuerbefreiung kleiner Anlagen', ESTG_3],
    ['BMF-Schreiben zum Nullsteuersatz vom 27.02.2023', BMF_2023_02],
    ['Bundesnetzagentur, EEG-Förderung und Einspeisevergütung', BNETZA_EEG]
  ],
  speicher: [
    ['§ 12 Abs. 3 UStG, Nullsteuersatz', USTG_12],
    ['BMF-Schreiben zum Nullsteuersatz vom 30.11.2023', BMF_2023_11],
    ['HTW Berlin, Stromspeicher-Inspektion 2026', HTW_SPEICHER],
    ['Bundesnetzagentur, EEG-Förderung und Einspeisevergütung', BNETZA_EEG]
  ],
  wp: [
    ['KfW, Heizungsförderung für Privatpersonen (458)', KFW_458],
    ['KfW, Merkblatt 458', KFW_458_PDF],
    ['§ 14a EnWG, steuerbare Verbrauchseinrichtungen', ENWG_14A],
    ['TA Lärm, Immissionsrichtwerte', TA_LAERM]
  ],
  kosten: [
    ['Fraunhofer ISE, Aktuelle Fakten zur Photovoltaik in Deutschland', ISE_FAKTEN],
    ['§ 12 Abs. 3 UStG, Nullsteuersatz', USTG_12],
    ['KfW, Heizungsförderung für Privatpersonen (458)', KFW_458]
  ],
  'rat-pv': [
    ['Bundesnetzagentur, EEG-Förderung und Einspeisevergütung', BNETZA_EEG],
    ['§ 12 Abs. 3 UStG, Nullsteuersatz', USTG_12],
    ['§ 3 Nr. 72 EStG, Steuerbefreiung kleiner Anlagen', ESTG_3]
  ],
  'rat-wp': [
    ['Fraunhofer ISE, Schlussbericht WP-QS', ISE_WPQS],
    ['KfW, Heizungsförderung für Privatpersonen (458)', KFW_458],
    ['§ 14a EnWG, steuerbare Verbrauchseinrichtungen', ENWG_14A]
  ],
  'rat-check': [
    ['Marktstammdatenregister, Fristen der Registrierung', MASTR_FRIST],
    ['KfW, Heizungsförderung für Privatpersonen (458)', KFW_458],
    ['§ 14a EnWG, steuerbare Verbrauchseinrichtungen', ENWG_14A]
  ]
};

/* Hosts, deren Links auf einer Seite als Beleg (JSON-LD citation) zaehlen.
 * Behoerden, Gesetze, Foerderbanken, Netzbetreiber, Forschungsinstitute. */
const BELEG_HOSTS = /(^|\.)(gesetze-im-internet\.de|verwaltungsvorschriften-im-internet\.de|bundesnetzagentur\.de|marktstammdatenregister\.de|bundesfinanzministerium\.de|bundestag\.de|bundesregierung\.de|kfw\.de|energiewechsel\.de|foerderdatenbank\.de|berlin\.de|ibb-business-team\.de|brandenburg\.de|potsdam\.de|falkensee\.de|bernau\.de|oranienburg\.de|barnim\.de|oberhavel\.de|havelland\.de|verwaltungsportal\.de|fraunhofer\.de|htw-berlin\.de|stromnetz\.berlin|e-dis-netz\.de|ngp-potsdam\.de|stadtwerke-bernau\.de|stadtwerke-oranienburg\.de|waerme-fuer-bernau\.de)$/;

const GEO_CSS = `
/* ===== GEO: Kurzantwort und Quellen ===== */
.kurz{padding:clamp(28px,4vw,40px) 0 0}
.kurz-box{max-width:820px;border:1px solid var(--line);border-left:3px solid var(--akzent,#b07a22);background:var(--tint,#f8f3ea);padding:20px 24px;border-radius:var(--r,4px)}
.kurz-box h2{font-size:1.05rem;margin:0 0 10px;letter-spacing:0}
.kurz-box ul{margin:0;padding-left:1.15em}
.kurz-box li{margin:0 0 6px;line-height:1.55}
.kurz-box li:last-child{margin-bottom:0}
.kurz-stand{margin:12px 0 0;font-size:.84rem;color:#5f5a50}
.quellen{padding:0 0 clamp(28px,4vw,40px)}
.quellen .wrap>div{max-width:820px;border-top:1px solid var(--line);padding-top:18px}
.quellen h2{font-size:1rem;margin:0 0 8px;letter-spacing:0}
.quellen ul{margin:0;padding-left:1.15em;font-size:.92rem}
.quellen li{margin:0 0 4px}
.quellen a{color:inherit;text-decoration:underline;text-underline-offset:2px}
.ztab-kw{min-width:620px}
.ztab-kw th,.ztab-kw td{text-align:right;padding-right:0;padding-left:14px}
.ztab-kw th:first-child,.ztab-kw td:first-child,.ztab-kw tbody th{text-align:left;padding-left:0}
.ztab-kw tbody th{padding:15px 0;border-bottom:1px solid var(--line-2);font-weight:700}
.ztab-kw td:last-child{font-weight:400}
@media (max-width:600px){.kurz-box{padding:16px 16px}}
`;

module.exports = { KURZ, QUELLEN, BELEG_HOSTS, GEO_CSS };
