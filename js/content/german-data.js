/**
 * content/german-data.js
 * Redaktionell geprüfte Deutschinhalte für Klasse 2.
 *
 * Ausrichtung an den im Bericht (Abschnitt 5) belegten Lernzielen von
 * "Flex und Flora 2". Alle Sätze, Wörter und Texte sind eigene
 * Formulierungen — es werden keine Buchseiten reproduziert.
 *
 * REDAKTIONSREGELN
 *  • Österreichische Formen: "Jänner", "Bub", "Turnsaal", "Sackerl" wo passend.
 *  • Fachbegriffe wie im Buch: Namenwort, Zeitwort, Eigenschaftswort,
 *    Begleiter, Einzahl/Mehrzahl, Mitlaut, Selbstlaut.
 *  • Jede Aufgabe hat genau eine richtige Lösung oder eine ausdrücklich
 *    gepflegte Liste gültiger Varianten.
 *  • Satzzeichen-Aufgaben verwenden nur eindeutige Fälle:
 *    Fragen mit Fragewort, Aussagen, Ausrufe mit Ausrufe-Signalwort.
 */

const GermanData = (() => {

  // ─── Namenwörter mit Begleiter und Mehrzahl ───────────────────────────────
  // art: der | die | das · pl: Mehrzahlform (null = für Mehrzahl nicht nutzen)

  const NOUNS = [
    { sg: 'Hund',     art: 'der', pl: 'Hunde' },
    { sg: 'Katze',    art: 'die', pl: 'Katzen' },
    { sg: 'Haus',     art: 'das', pl: 'Häuser' },
    { sg: 'Baum',     art: 'der', pl: 'Bäume' },
    { sg: 'Blume',    art: 'die', pl: 'Blumen' },
    { sg: 'Kind',     art: 'das', pl: 'Kinder' },
    { sg: 'Ball',     art: 'der', pl: 'Bälle' },
    { sg: 'Maus',     art: 'die', pl: 'Mäuse' },
    { sg: 'Buch',     art: 'das', pl: 'Bücher' },
    { sg: 'Tisch',    art: 'der', pl: 'Tische' },
    { sg: 'Tür',      art: 'die', pl: 'Türen' },
    { sg: 'Fenster',  art: 'das', pl: 'Fenster' },
    { sg: 'Stuhl',    art: 'der', pl: 'Stühle' },
    { sg: 'Lampe',    art: 'die', pl: 'Lampen' },
    { sg: 'Bett',     art: 'das', pl: 'Betten' },
    { sg: 'Apfel',    art: 'der', pl: 'Äpfel' },
    { sg: 'Birne',    art: 'die', pl: 'Birnen' },
    { sg: 'Ei',       art: 'das', pl: 'Eier' },
    { sg: 'Vogel',    art: 'der', pl: 'Vögel' },
    { sg: 'Auto',     art: 'das', pl: 'Autos' },
    { sg: 'Schule',   art: 'die', pl: 'Schulen' },
    { sg: 'Heft',     art: 'das', pl: 'Hefte' },
    { sg: 'Stift',    art: 'der', pl: 'Stifte' },
    { sg: 'Schere',   art: 'die', pl: 'Scheren' },
    { sg: 'Bild',     art: 'das', pl: 'Bilder' },
    { sg: 'Berg',     art: 'der', pl: 'Berge' },
    { sg: 'Wiese',    art: 'die', pl: 'Wiesen' },
    { sg: 'Pferd',    art: 'das', pl: 'Pferde' },
    { sg: 'Hut',      art: 'der', pl: 'Hüte' },
    { sg: 'Hose',     art: 'die', pl: 'Hosen' },
    { sg: 'Kleid',    art: 'das', pl: 'Kleider' },
    { sg: 'Schuh',    art: 'der', pl: 'Schuhe' },
    { sg: 'Jacke',    art: 'die', pl: 'Jacken' },
    { sg: 'Hemd',     art: 'das', pl: 'Hemden' },
    { sg: 'Löffel',   art: 'der', pl: 'Löffel' },
    { sg: 'Gabel',    art: 'die', pl: 'Gabeln' },
    { sg: 'Messer',   art: 'das', pl: 'Messer' },
    { sg: 'Teller',   art: 'der', pl: 'Teller' },
    { sg: 'Tasse',    art: 'die', pl: 'Tassen' },
    { sg: 'Glas',     art: 'das', pl: 'Gläser' },
    { sg: 'Fisch',    art: 'der', pl: 'Fische' },
    { sg: 'Kuh',      art: 'die', pl: 'Kühe' },
    { sg: 'Schaf',    art: 'das', pl: 'Schafe' },
    { sg: 'Bruder',   art: 'der', pl: 'Brüder' },
    { sg: 'Schwester',art: 'die', pl: 'Schwestern' },
    { sg: 'Vater',    art: 'der', pl: 'Väter' },
    { sg: 'Mutter',   art: 'die', pl: 'Mütter' },
    { sg: 'Freund',   art: 'der', pl: 'Freunde' },
    { sg: 'Wolke',    art: 'die', pl: 'Wolken' },
    { sg: 'Fahrrad',  art: 'das', pl: 'Fahrräder' },
    { sg: 'Zug',      art: 'der', pl: 'Züge' },
    { sg: 'Straße',   art: 'die', pl: 'Straßen' },
    { sg: 'Dorf',     art: 'das', pl: 'Dörfer' },
    { sg: 'Wald',     art: 'der', pl: 'Wälder' },
    { sg: 'Stadt',    art: 'die', pl: 'Städte' },
    { sg: 'Zimmer',   art: 'das', pl: 'Zimmer' },
    { sg: 'Stern',    art: 'der', pl: 'Sterne' },
    { sg: 'Garten',   art: 'der', pl: 'Gärten' },
    { sg: 'Tier',     art: 'das', pl: 'Tiere' },
    { sg: 'Brot',     art: 'das', pl: 'Brote' },
    { sg: 'Hase',     art: 'der', pl: 'Hasen' },
    { sg: 'Ente',     art: 'die', pl: 'Enten' },
    { sg: 'Huhn',     art: 'das', pl: 'Hühner' },
    { sg: 'Sonne',    art: 'die', pl: null },
    { sg: 'Mond',     art: 'der', pl: null },
    { sg: 'Schnee',   art: 'der', pl: null },
    { sg: 'Suppe',    art: 'die', pl: 'Suppen' },
    { sg: 'Honig',    art: 'der', pl: null },
    { sg: 'Korb',     art: 'der', pl: 'Körbe' },
    { sg: 'Biene',    art: 'die', pl: 'Bienen' },
    { sg: 'Bahnhof',  art: 'der', pl: 'Bahnhöfe' },
    { sg: 'Wolle',    art: 'die', pl: null },
  ];

  // ─── ABC ──────────────────────────────────────────────────────────────────

  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Wörter zum alphabetischen Ordnen. Stufe 1: verschiedene Anfangsbuchstaben.
  // Stufe 2/3: gleicher Anfangsbuchstabe, Vergleich des zweiten Buchstabens.
  const ABC_WORDS_L1 = [
    'Affe', 'Ball', 'Cent', 'Dach', 'Ente', 'Fisch', 'Garten', 'Haus',
    'Igel', 'Jacke', 'Kuh', 'Lampe', 'Maus', 'Nase', 'Obst', 'Pferd',
    'Quelle', 'Rose', 'Sonne', 'Tisch', 'Uhr', 'Vogel', 'Wolke', 'Zebra',
  ];

  const ABC_WORDS_L2 = [
    ['Ball', 'Berg', 'Blume', 'Brot'],
    ['Hand', 'Haus', 'Heft', 'Hund'],
    ['Kanne', 'Kerze', 'Kind', 'Korb'],
    ['Mantel', 'Maus', 'Messer', 'Mond'],
    ['Salat', 'Schere', 'Sonne', 'Stuhl'],
    ['Tanne', 'Teller', 'Tisch', 'Turm'],
    ['Wagen', 'Wiese', 'Wolke', 'Wurm'],
    ['Gabel', 'Garten', 'Glas', 'Gurke'],
  ];

  // ─── Zusammengesetzte Namenwörter ─────────────────────────────────────────
  // Nur Verbindungen ohne Fugenzeichen oder mit dem Fugenteil im ersten Wort.

  const COMPOUNDS = [
    { a: 'Haus', b: 'Tür', word: 'Haustür', art: 'die' },
    { a: 'Hand', b: 'Schuh', word: 'Handschuh', art: 'der' },
    { a: 'Feuer', b: 'Wehr', word: 'Feuerwehr', art: 'die' },
    { a: 'Regen', b: 'Bogen', word: 'Regenbogen', art: 'der' },
    { a: 'Schnee', b: 'Mann', word: 'Schneemann', art: 'der' },
    { a: 'Fuß', b: 'Ball', word: 'Fußball', art: 'der' },
    { a: 'Tisch', b: 'Decke', word: 'Tischdecke', art: 'die' },
    { a: 'Zahn', b: 'Bürste', word: 'Zahnbürste', art: 'die' },
    { a: 'Kinder', b: 'Garten', word: 'Kindergarten', art: 'der' },
    { a: 'Apfel', b: 'Baum', word: 'Apfelbaum', art: 'der' },
    { a: 'Haus', b: 'Aufgabe', word: 'Hausaufgabe', art: 'die' },
    { a: 'Turn', b: 'Saal', word: 'Turnsaal', art: 'der' },
    { a: 'Schul', b: 'Weg', word: 'Schulweg', art: 'der' },
    { a: 'Wasser', b: 'Hahn', word: 'Wasserhahn', art: 'der' },
    { a: 'Blumen', b: 'Topf', word: 'Blumentopf', art: 'der' },
    { a: 'Nacht', b: 'Hemd', word: 'Nachthemd', art: 'das' },
    { a: 'Bade', b: 'Hose', word: 'Badehose', art: 'die' },
    { a: 'Papier', b: 'Korb', word: 'Papierkorb', art: 'der' },
    { a: 'Sand', b: 'Burg', word: 'Sandburg', art: 'die' },
    { a: 'Winter', b: 'Jacke', word: 'Winterjacke', art: 'die' },
    { a: 'Tier', b: 'Arzt', word: 'Tierarzt', art: 'der' },
    { a: 'Zahn', b: 'Arzt', word: 'Zahnarzt', art: 'der' },
    { a: 'Fahr', b: 'Rad', word: 'Fahrrad', art: 'das' },
    { a: 'Spiel', b: 'Platz', word: 'Spielplatz', art: 'der' },
    { a: 'Schwimm', b: 'Bad', word: 'Schwimmbad', art: 'das' },
    { a: 'Sonnen', b: 'Blume', word: 'Sonnenblume', art: 'die' },
    { a: 'Schul', b: 'Tasche', word: 'Schultasche', art: 'die' },
    { a: 'Ohren', b: 'Schmerzen', word: 'Ohrenschmerzen', art: 'die' },
  ];

  // ─── Zeitwörter ───────────────────────────────────────────────────────────
  // du-Form ausdrücklich gepflegt, weil viele unregelmäßig sind.

  const VERBS = [
    { inf: 'spielen',  ich: 'spiele',  du: 'spielst',  er: 'spielt' },
    { inf: 'lachen',   ich: 'lache',   du: 'lachst',   er: 'lacht' },
    { inf: 'malen',    ich: 'male',    du: 'malst',    er: 'malt' },
    { inf: 'singen',   ich: 'singe',   du: 'singst',   er: 'singt' },
    { inf: 'springen', ich: 'springe', du: 'springst', er: 'springt' },
    { inf: 'turnen',   ich: 'turne',   du: 'turnst',   er: 'turnt' },
    { inf: 'lernen',   ich: 'lerne',   du: 'lernst',   er: 'lernt' },
    { inf: 'kochen',   ich: 'koche',   du: 'kochst',   er: 'kocht' },
    { inf: 'tanzen',   ich: 'tanze',   du: 'tanzt',    er: 'tanzt' },
    { inf: 'winken',   ich: 'winke',   du: 'winkst',   er: 'winkt' },
    { inf: 'hüpfen',   ich: 'hüpfe',   du: 'hüpfst',   er: 'hüpft' },
    { inf: 'schreiben',ich: 'schreibe',du: 'schreibst',er: 'schreibt' },
    { inf: 'rechnen',  ich: 'rechne',  du: 'rechnest', er: 'rechnet' },
    { inf: 'warten',   ich: 'warte',   du: 'wartest',  er: 'wartet' },
    { inf: 'arbeiten', ich: 'arbeite', du: 'arbeitest',er: 'arbeitet' },
    { inf: 'lesen',    ich: 'lese',    du: 'liest',    er: 'liest',  irregular: true },
    { inf: 'laufen',   ich: 'laufe',   du: 'läufst',   er: 'läuft',  irregular: true },
    { inf: 'schlafen', ich: 'schlafe', du: 'schläfst', er: 'schläft',irregular: true },
    { inf: 'essen',    ich: 'esse',    du: 'isst',     er: 'isst',   irregular: true },
    { inf: 'fahren',   ich: 'fahre',   du: 'fährst',   er: 'fährt',  irregular: true },
    { inf: 'geben',    ich: 'gebe',    du: 'gibst',    er: 'gibt',   irregular: true },
    { inf: 'sehen',    ich: 'sehe',    du: 'siehst',   er: 'sieht',  irregular: true },
  ];

  // Sätze zum Markieren des Zeitworts. `verbIndex` = Position im Wort-Array.
  const VERB_SENTENCES = [
    { words: ['Der', 'Hund', 'bellt', 'laut'], target: 2 },
    { words: ['Luisa', 'malt', 'ein', 'Bild'], target: 1 },
    { words: ['Die', 'Katze', 'schläft', 'im', 'Korb'], target: 2 },
    { words: ['Wir', 'singen', 'ein', 'Lied'], target: 1 },
    { words: ['Der', 'Bub', 'wirft', 'den', 'Ball'], target: 2 },
    { words: ['Oskar', 'holt', 'den', 'Stock'], target: 1 },
    { words: ['Die', 'Kinder', 'turnen', 'im', 'Turnsaal'], target: 2 },
    { words: ['Mein', 'Vater', 'kocht', 'die', 'Suppe'], target: 2 },
    { words: ['Die', 'Vögel', 'fliegen', 'nach', 'Süden'], target: 2 },
    { words: ['Ich', 'lese', 'ein', 'Buch'], target: 1 },
    { words: ['Die', 'Sonne', 'scheint', 'heute'], target: 2 },
    { words: ['Der', 'Zug', 'fährt', 'zum', 'Bahnhof'], target: 2 },
  ];

  // Sätze zum Markieren des Namenworts (genau eines im Satz).
  const NOUN_SENTENCES = [
    { words: ['Der', 'Hund', 'bellt'], target: 1 },
    { words: ['Ich', 'male', 'gern'], target: null, skip: true },
    { words: ['Die', 'Blume', 'blüht'], target: 1 },
    { words: ['Wir', 'gehen', 'zur', 'Schule'], target: 3 },
    { words: ['Das', 'Pferd', 'läuft', 'schnell'], target: 1 },
    { words: ['Er', 'liest', 'ein', 'Buch'], target: 3 },
    { words: ['Die', 'Sonne', 'scheint', 'warm'], target: 1 },
    { words: ['Sie', 'öffnet', 'das', 'Fenster'], target: 3 },
    { words: ['Mein', 'Bruder', 'lacht', 'laut'], target: 1 },
    { words: ['Der', 'Ball', 'rollt', 'weg'], target: 1 },
    { words: ['Wir', 'füttern', 'die', 'Enten'], target: 3 },
    { words: ['Das', 'Kind', 'winkt', 'fröhlich'], target: 1 },
  ].filter(s => !s.skip);

  // ─── Eigenschaftswörter ───────────────────────────────────────────────────

  const ADJ_SENTENCES = [
    { words: ['Der', 'Schnee', 'ist', 'kalt'], target: 3 },
    { words: ['Die', 'Suppe', 'ist', 'heiß'], target: 3 },
    { words: ['Ein', 'schneller', 'Hase', 'hüpft'], target: 1 },
    { words: ['Die', 'kleine', 'Maus', 'piepst'], target: 1 },
    { words: ['Das', 'Wasser', 'ist', 'nass'], target: 3 },
    { words: ['Der', 'hohe', 'Turm', 'wackelt', 'nicht'], target: 1 },
    { words: ['Die', 'alte', 'Uhr', 'tickt'], target: 1 },
    { words: ['Der', 'Weg', 'ist', 'lang'], target: 3 },
    { words: ['Ein', 'lauter', 'Donner', 'kracht'], target: 1 },
    { words: ['Die', 'Blume', 'ist', 'gelb'], target: 3 },
  ];

  // Eindeutige Zuordnung Eigenschaftswort → Sache.
  // Die falschen Antworten passen erkennbar nicht.
  const ADJ_MATCH = [
    { thing: 'Die Sonne',        emoji: '☀️', right: 'heiß',    wrong: ['nass', 'leise'] },
    { thing: 'Der Schnee',       emoji: '❄️', right: 'kalt',    wrong: ['heiß', 'laut'] },
    { thing: 'Ein Elefant',      emoji: '🐘', right: 'schwer',  wrong: ['durchsichtig', 'süß'] },
    { thing: 'Eine Feder',       emoji: '🪶', right: 'leicht',  wrong: ['scharf', 'nass'] },
    { thing: 'Zucker',           emoji: '🍬', right: 'süß',     wrong: ['kalt', 'laut'] },
    { thing: 'Eine Zitrone',     emoji: '🍋', right: 'sauer',   wrong: ['weich', 'dunkel'] },
    { thing: 'Ein Stein',        emoji: '🪨', right: 'hart',    wrong: ['süß', 'nass'] },
    { thing: 'Ein Bett',         emoji: '🛏️', right: 'weich',   wrong: ['sauer', 'laut'] },
    { thing: 'Die Nacht',        emoji: '🌙', right: 'dunkel',  wrong: ['süß', 'nass'] },
    { thing: 'Ein Donner',       emoji: '⛈️', right: 'laut',    wrong: ['süß', 'trocken'] },
  ];

  // ─── Satzzeichen ──────────────────────────────────────────────────────────
  // Nur eindeutige Fälle: Fragewort → ?, Ausrufe-Signal → !, sonst Aussage → .

  const PUNCTUATION = [
    { text: 'Wie heißt du',                 mark: '?', why: 'Das ist eine Frage. Sie beginnt mit „Wie".' },
    { text: 'Wo ist mein Ball',             mark: '?', why: 'Das ist eine Frage. Sie beginnt mit „Wo".' },
    { text: 'Wann kommst du nach Hause',    mark: '?', why: 'Das ist eine Frage. Sie beginnt mit „Wann".' },
    { text: 'Warum lacht Oskar',            mark: '?', why: 'Das ist eine Frage. Sie beginnt mit „Warum".' },
    { text: 'Wer hat den Stift genommen',   mark: '?', why: 'Das ist eine Frage. Sie beginnt mit „Wer".' },
    { text: 'Ich gehe heute in die Schule', mark: '.', why: 'Das ist eine Aussage. Am Ende steht ein Punkt.' },
    { text: 'Der Hund schläft im Korb',     mark: '.', why: 'Das ist eine Aussage. Am Ende steht ein Punkt.' },
    { text: 'Wir malen ein Bild',           mark: '.', why: 'Das ist eine Aussage. Am Ende steht ein Punkt.' },
    { text: 'Die Blume blüht im Garten',    mark: '.', why: 'Das ist eine Aussage. Am Ende steht ein Punkt.' },
    { text: 'Au, das tut weh',              mark: '!', why: '„Au" ist ein Ausruf. Am Ende steht ein Rufzeichen.' },
    { text: 'Hurra, wir haben gewonnen',    mark: '!', why: '„Hurra" ist ein Ausruf. Am Ende steht ein Rufzeichen.' },
    { text: 'Oh, wie schön',                mark: '!', why: '„Oh" ist ein Ausruf. Am Ende steht ein Rufzeichen.' },
    { text: 'Hilfe, der Ball rollt weg',    mark: '!', why: '„Hilfe" ist ein Ausruf. Am Ende steht ein Rufzeichen.' },
  ];

  // ─── Satzanfang großschreiben ─────────────────────────────────────────────
  // Gezeigt wird der Satz mit kleinem Anfangswort; gefragt ist genau dieses Wort.

  const SENTENCE_STARTS = [
    { lower: 'der', rest: 'Hund bellt laut.' },
    { lower: 'die', rest: 'Katze schläft im Korb.' },
    { lower: 'wir', rest: 'gehen in den Garten.' },
    { lower: 'mein', rest: 'Bruder spielt Fußball.' },
    { lower: 'heute', rest: 'scheint die Sonne.' },
    { lower: 'ein', rest: 'Vogel sitzt am Fenster.' },
    { lower: 'oskar', rest: 'holt den Ball.', name: true },
    { lower: 'luisa', rest: 'liest ein Buch.', name: true },
    { lower: 'am', rest: 'Montag beginnt die Schule.' },
    { lower: 'plötzlich', rest: 'klingelt das Telefon.' },
  ];

  // ─── Satzbau ──────────────────────────────────────────────────────────────
  // Regel für Eindeutigkeit: Genau EIN Baustein ist großgeschrieben —
  // er gehört an den Satzanfang. Der Punkt ist vorgegeben.

  const SENTENCE_PARTS = [
    { parts: ['Oskar', 'holt', 'den Ball'] },
    { parts: ['Luisa', 'liest', 'ein Buch'] },
    { parts: ['Die Katze', 'schläft', 'im Korb'] },
    { parts: ['Der Bub', 'wirft', 'den Stein'] },
    { parts: ['Mein Vater', 'kocht', 'eine Suppe'] },
    { parts: ['Die Kinder', 'turnen', 'im Turnsaal'] },
    { parts: ['Der Zug', 'fährt', 'zum Bahnhof'] },
    { parts: ['Die Sonne', 'wärmt', 'die Wiese'] },
    { parts: ['Ein Vogel', 'baut', 'ein Nest'] },
    { parts: ['Meine Schwester', 'malt', 'ein Bild'] },
    { parts: ['Der Bauer', 'füttert', 'die Hühner'] },
    { parts: ['Das Pferd', 'frisst', 'das Heu'] },
  ];

  // ─── Silben ───────────────────────────────────────────────────────────────
  // syllables: geprüfte Trennung nach den geltenden Regeln
  //  · einzelner Mitlaut zwischen Selbstlauten → zur nächsten Silbe (Na-se)
  //  · doppelter Mitlaut wird getrennt (Son-ne)
  //  · ch, sch, ph bleiben zusammen (Ta-sche)
  //  · st wird getrennt (Fens-ter)

  const SYLLABLE_WORDS = [
    { word: 'Nase',     syllables: ['Na', 'se'], level: 1 },
    { word: 'Hase',     syllables: ['Ha', 'se'], level: 1 },
    { word: 'Blume',    syllables: ['Blu', 'me'], level: 1 },
    { word: 'Vogel',    syllables: ['Vo', 'gel'], level: 1 },
    { word: 'Wagen',    syllables: ['Wa', 'gen'], level: 1 },
    { word: 'Boden',    syllables: ['Bo', 'den'], level: 1 },
    { word: 'Sonne',    syllables: ['Son', 'ne'], level: 1 },
    { word: 'Mutter',   syllables: ['Mut', 'ter'], level: 1 },
    { word: 'Zimmer',   syllables: ['Zim', 'mer'], level: 1 },
    { word: 'Sommer',   syllables: ['Som', 'mer'], level: 1 },
    { word: 'Teller',   syllables: ['Tel', 'ler'], level: 1 },
    { word: 'Löffel',   syllables: ['Löf', 'fel'], level: 1 },
    { word: 'Garten',   syllables: ['Gar', 'ten'], level: 2 },
    { word: 'Winter',   syllables: ['Win', 'ter'], level: 2 },
    { word: 'Finger',   syllables: ['Fin', 'ger'], level: 2 },
    { word: 'Apfel',    syllables: ['Ap', 'fel'], level: 2 },
    { word: 'Kinder',   syllables: ['Kin', 'der'], level: 2 },
    { word: 'Fenster',  syllables: ['Fens', 'ter'], level: 2 },
    { word: 'Schwester',syllables: ['Schwes', 'ter'], level: 2 },
    { word: 'Tasche',   syllables: ['Ta', 'sche'], level: 2 },
    { word: 'Kirsche',  syllables: ['Kir', 'sche'], level: 2 },
    { word: 'lachen',   syllables: ['la', 'chen'], level: 2 },
    { word: 'Bücher',   syllables: ['Bü', 'cher'], level: 2 },
    { word: 'Banane',   syllables: ['Ba', 'na', 'ne'], level: 3 },
    { word: 'Tomate',   syllables: ['To', 'ma', 'te'], level: 3 },
    { word: 'Kartoffel',syllables: ['Kar', 'tof', 'fel'], level: 3 },
    { word: 'Elefant',  syllables: ['E', 'le', 'fant'], level: 3 },
    { word: 'Giraffe',  syllables: ['Gi', 'raf', 'fe'], level: 3 },
    { word: 'Schokolade',syllables: ['Scho', 'ko', 'la', 'de'], level: 3 },
    { word: 'Regenbogen',syllables: ['Re', 'gen', 'bo', 'gen'], level: 3 },
  ];

  // ─── St und Sp ────────────────────────────────────────────────────────────

  const ST_SP_WORDS = [
    { rest: 'ern',    prefix: 'St', word: 'Stern',    clue: 'Er funkelt am Nachthimmel.' },
    { rest: 'uhl',    prefix: 'St', word: 'Stuhl',    clue: 'Darauf sitzt du.' },
    { rest: 'raße',   prefix: 'St', word: 'Straße',   clue: 'Darauf fahren Autos.' },
    { rest: 'ein',    prefix: 'St', word: 'Stein',    clue: 'Er ist hart und liegt am Boden.' },
    { rest: 'ift',    prefix: 'St', word: 'Stift',    clue: 'Damit malst du.' },
    { rest: 'adt',    prefix: 'St', word: 'Stadt',    clue: 'Dort gibt es viele Häuser und Geschäfte.' },
    { rest: 'iefel',  prefix: 'St', word: 'Stiefel',  clue: 'Hohe Schuhe für Regen und Schnee.' },
    { rest: 'iel',    prefix: 'Sp', word: 'Spiel',    clue: 'Damit hast du Spaß, zum Beispiel Memory.' },
    { rest: 'ort',    prefix: 'Sp', word: 'Sport',    clue: 'Turnen, Laufen und Schwimmen zusammen.' },
    { rest: 'inne',   prefix: 'Sp', word: 'Spinne',   clue: 'Sie hat acht Beine und webt ein Netz.' },
    { rest: 'iegel',  prefix: 'Sp', word: 'Spiegel',  clue: 'Darin siehst du dich selbst.' },
    { rest: 'rache',  prefix: 'Sp', word: 'Sprache',  clue: 'Deutsch und Englisch sind das.' },
    { rest: 'atz',    prefix: 'Sp', word: 'Spatz',    clue: 'Ein kleiner brauner Vogel.' },
    { rest: 'echt',   prefix: 'Sp', word: 'Specht',   clue: 'Der Vogel, der an den Baum klopft.' },
  ];

  // ─── Umlaute ableiten ─────────────────────────────────────────────────────
  // "Bäume" kommt von "Baum" — deshalb ä, nicht e.

  const UMLAUT_DERIVATIONS = [
    { form: 'Bäume',   base: 'Baum',   letter: 'äu' },
    { form: 'Häuser',  base: 'Haus',   letter: 'äu' },
    { form: 'Mäuse',   base: 'Maus',   letter: 'äu' },
    { form: 'Bäche',   base: 'Bach',   letter: 'ä' },
    { form: 'Hände',   base: 'Hand',   letter: 'ä' },
    { form: 'Wälder',  base: 'Wald',   letter: 'ä' },
    { form: 'Äste',    base: 'Ast',    letter: 'ä' },
    { form: 'Gäste',   base: 'Gast',   letter: 'ä' },
    { form: 'Räder',   base: 'Rad',    letter: 'ä' },
    { form: 'Blätter', base: 'Blatt',  letter: 'ä' },
    { form: 'Kälte',   base: 'kalt',   letter: 'ä' },
    { form: 'Wärme',   base: 'warm',   letter: 'ä' },
    { form: 'Bäcker',  base: 'backen', letter: 'ä' },
    { form: 'Läufer',  base: 'laufen', letter: 'äu' },
    { form: 'träumen', base: 'Traum',  letter: 'äu' },
    { form: 'Käufer',  base: 'kaufen', letter: 'äu' },
    { form: 'Zähne',   base: 'Zahn',   letter: 'ä' },
    { form: 'Väter',   base: 'Vater',  letter: 'ä' },
  ];

  // ─── Langes i: ie ─────────────────────────────────────────────────────────
  // hasIe = true → das Wort wird mit ie geschrieben.

  const IE_WORDS = [
    { masked: 'W_se',    word: 'Wiese',   hasIe: true,  clue: 'Dort wächst Gras und dort blühen Blumen.' },
    { masked: 'B_ne',    word: 'Biene',   hasIe: true,  clue: 'Sie summt und macht Honig.' },
    { masked: 'Sp_gel',  word: 'Spiegel', hasIe: true,  clue: 'Darin siehst du dich selbst.' },
    { masked: 'R_se',    word: 'Riese',   hasIe: true,  clue: 'Ein sehr großer Mensch im Märchen.' },
    { masked: 'Br_f',    word: 'Brief',   hasIe: true,  clue: 'Den steckst du in einen Umschlag.' },
    { masked: 'Z_ge',    word: 'Ziege',   hasIe: true,  clue: 'Ein Tier mit Hörnern, das meckert.' },
    { masked: 'Sp_l',    word: 'Spiel',   hasIe: true,  clue: 'Memory oder Mensch ärgere dich nicht.' },
    { masked: 'v_r',     word: 'vier',    hasIe: true,  clue: 'Die Zahl nach der drei.' },
    { masked: 's_ben',   word: 'sieben',  hasIe: true,  clue: 'Die Zahl nach der sechs.' },
    { masked: 'T_r',     word: 'Tier',    hasIe: true,  clue: 'Hund, Katze und Maus sind das.' },
    { masked: 'B_ld',    word: 'Bild',    hasIe: false, clue: 'Das malst du und hängst es auf.' },
    { masked: 'K_nd',    word: 'Kind',    hasIe: false, clue: 'Ein Mensch, der noch klein ist.' },
    { masked: 'W_nter',  word: 'Winter',  hasIe: false, clue: 'Die kälteste Jahreszeit.' },
    { masked: 'F_sch',   word: 'Fisch',   hasIe: false, clue: 'Er lebt im Wasser.' },
    { masked: 'M_lch',   word: 'Milch',   hasIe: false, clue: 'Ein weißes Getränk von der Kuh.' },
    { masked: 'T_sch',   word: 'Tisch',   hasIe: false, clue: 'Daran sitzt du beim Essen.' },
    { masked: 'K_ste',   word: 'Kiste',   hasIe: false, clue: 'Eine Schachtel aus Holz.' },
    { masked: 'W_nd',    word: 'Wind',    hasIe: false, clue: 'Er bewegt die Blätter am Baum.' },
  ];

  // ─── Doppelte Mitlaute ────────────────────────────────────────────────────

  const DOUBLE_CONSONANT = [
    { word: 'Sonne',  wrong: 'Sone',  clue: 'Sie scheint am Tag.' },
    { word: 'Wanne',  wrong: 'Wane',  clue: 'Darin badest du.' },
    { word: 'Mutter', wrong: 'Muter', clue: 'Die Mama.' },
    { word: 'Butter', wrong: 'Buter', clue: 'Die streichst du aufs Brot.' },
    { word: 'Bett',   wrong: 'Bet',   clue: 'Darin schläfst du.' },
    { word: 'Ball',   wrong: 'Bal',   clue: 'Damit spielst du Fußball.' },
    { word: 'Kanne',  wrong: 'Kane',  clue: 'Daraus gießt du Tee ein.' },
    { word: 'Puppe',  wrong: 'Pupe',  clue: 'Ein Spielzeug, das aussieht wie ein Kind.' },
    { word: 'Suppe',  wrong: 'Supe',  clue: 'Die isst du mit dem Löffel.' },
    { word: 'Roller', wrong: 'Roler', clue: 'Damit fährst du im Stehen.' },
    { word: 'Koffer', wrong: 'Kofer', clue: 'Darin packst du für den Urlaub.' },
    { word: 'Löffel', wrong: 'Löfel', clue: 'Damit isst du Suppe.' },
    { word: 'Sommer', wrong: 'Somer', clue: 'Die wärmste Jahreszeit.' },
    { word: 'Hammer', wrong: 'Hamer', clue: 'Damit schlägst du einen Nagel ein.' },
    { word: 'Zimmer', wrong: 'Zimer', clue: 'Ein Raum in der Wohnung.' },
    { word: 'Teller', wrong: 'Teler', clue: 'Darauf liegt das Essen.' },
    { word: 'Wetter', wrong: 'Weter', clue: 'Sonne, Regen und Schnee zusammen.' },
    { word: 'Kette',  wrong: 'Kete',  clue: 'Die trägst du um den Hals.' },
  ];

  // Gegenstücke mit nur einem Mitlaut — als Kontrast.
  const SINGLE_CONSONANT = [
    { word: 'Hase',  wrong: 'Hasse',  clue: 'Ein Tier mit langen Ohren.' },
    { word: 'Nase',  wrong: 'Nasse',  clue: 'Damit riechst du.' },
    { word: 'Blume', wrong: 'Blumme', clue: 'Sie blüht im Garten.' },
    { word: 'Wagen', wrong: 'Waggen', clue: 'Ein anderes Wort für Auto.' },
    { word: 'Ofen',  wrong: 'Offen',  clue: 'Darin wird das Brot gebacken.' },
    { word: 'Kamel', wrong: 'Kammel', clue: 'Ein Tier mit zwei Höckern.' },
    { word: 'Nudel', wrong: 'Nuddel', clue: 'Die isst du mit Sauce.' },
    { word: 'Vogel', wrong: 'Voggel', clue: 'Er hat Federn und fliegt.' },
  ];

  // ─── Verlängern ───────────────────────────────────────────────────────────
  // Die verlängerte Form steht in der Aufgabe — damit ist die Lösung eindeutig.

  const EXTEND_WORDS = [
    { masked: 'Hun_',   letter: 'd', word: 'Hund',   longer: 'Hunde' },
    { masked: 'Kin_',   letter: 'd', word: 'Kind',   longer: 'Kinder' },
    { masked: 'Hem_',   letter: 'd', word: 'Hemd',   longer: 'Hemden' },
    { masked: 'Ba_',    letter: 'd', word: 'Bad',    longer: 'Bäder' },
    { masked: 'Ra_',    letter: 'd', word: 'Rad',    longer: 'Räder' },
    { masked: 'Han_',   letter: 'd', word: 'Hand',   longer: 'Hände' },
    { masked: 'Wal_',   letter: 'd', word: 'Wald',   longer: 'Wälder' },
    { masked: 'Fel_',   letter: 'd', word: 'Feld',   longer: 'Felder' },
    { masked: 'Klei_',  letter: 'd', word: 'Kleid',  longer: 'Kleider' },
    { masked: 'Schil_', letter: 'd', word: 'Schild', longer: 'Schilder' },
    { masked: 'Hu_',    letter: 't', word: 'Hut',    longer: 'Hüte' },
    { masked: 'Bro_',   letter: 't', word: 'Brot',   longer: 'Brote' },
    { masked: 'Blat_',  letter: 't', word: 'Blatt',  longer: 'Blätter' },
    { masked: 'kal_',   letter: 't', word: 'kalt',   longer: 'kälter' },
    { masked: 'bun_',   letter: 't', word: 'bunt',   longer: 'bunter' },
    { masked: 'lau_',   letter: 't', word: 'laut',   longer: 'lauter' },
    { masked: 'Ber_',   letter: 'g', word: 'Berg',   longer: 'Berge' },
    { masked: 'Zwer_',  letter: 'g', word: 'Zwerg',  longer: 'Zwerge' },
    { masked: 'Zu_',    letter: 'g', word: 'Zug',    longer: 'Züge' },
    { masked: 'Kor_',   letter: 'b', word: 'Korb',   longer: 'Körbe' },
    { masked: 'Die_',   letter: 'b', word: 'Dieb',   longer: 'Diebe' },
    { masked: 'gel_',   letter: 'b', word: 'gelb',   longer: 'gelber' },
    { masked: 'hal_',   letter: 'b', word: 'halb',   longer: 'halbe' },
  ];

  // ─── Fehler verbessern ────────────────────────────────────────────────────
  // Genau EIN Wort ist falsch und wird markiert. `rule` erklärt die Regel.

  const ERROR_SENTENCES = [
    { words: ['Der', 'hund', 'bellt', 'laut.'], index: 1, correct: 'Hund',
      rule: 'Namenwörter schreibt man groß.' },
    { words: ['Die', 'Katze', 'schläft', 'im', 'korb.'], index: 4, correct: 'Korb.',
      rule: 'Namenwörter schreibt man groß.' },
    { words: ['Ich', 'gehe', 'in', 'die', 'schule.'], index: 4, correct: 'Schule.',
      rule: 'Namenwörter schreibt man groß.' },
    { words: ['die', 'Sonne', 'scheint', 'heute.'], index: 0, correct: 'Die',
      rule: 'Am Satzanfang schreibt man groß.' },
    { words: ['Die', 'Sone', 'ist', 'warm.'], index: 1, correct: 'Sonne',
      rule: 'Nach kurzem Selbstlaut steht der doppelte Mitlaut.' },
    { words: ['Meine', 'Muter', 'kocht', 'Suppe.'], index: 1, correct: 'Mutter',
      rule: 'Nach kurzem Selbstlaut steht der doppelte Mitlaut.' },
    { words: ['Der', 'Bal', 'rollt', 'weg.'], index: 1, correct: 'Ball',
      rule: 'Nach kurzem Selbstlaut steht der doppelte Mitlaut.' },
    { words: ['Auf', 'der', 'Wise', 'blühen', 'Blumen.'], index: 2, correct: 'Wiese',
      rule: 'Langes i schreibt man hier mit ie.' },
    { words: ['Die', 'Bine', 'macht', 'Honig.'], index: 1, correct: 'Biene',
      rule: 'Langes i schreibt man hier mit ie.' },
    { words: ['Wir', 'gehen', 'zum', 'bahnhof.'], index: 3, correct: 'Bahnhof.',
      rule: 'Namenwörter schreibt man groß.' },
    { words: ['Der', 'Hunt', 'frisst', 'gern.'], index: 1, correct: 'Hund',
      rule: 'Verlängere das Wort: „Hunde" — also d.' },
    { words: ['Das', 'Kint', 'lacht.'], index: 1, correct: 'Kind',
      rule: 'Verlängere das Wort: „Kinder" — also d.' },
  ];

  // ─── Merkwörter ───────────────────────────────────────────────────────────

  const MEMORY_WORDS = [
    { word: 'Vater',   tip: 'Merke: Vater schreibt man mit V.' },
    { word: 'Vogel',   tip: 'Merke: Vogel schreibt man mit V.' },
    { word: 'viel',    tip: 'Merke: viel schreibt man mit V.' },
    { word: 'vier',    tip: 'Merke: vier schreibt man mit V und ie.' },
    { word: 'Fahrrad', tip: 'Merke: Fahrrad hat ein h und zwei r.' },
    { word: 'Jahr',    tip: 'Merke: Jahr hat ein stummes h.' },
    { word: 'Uhr',     tip: 'Merke: Uhr hat ein stummes h.' },
    { word: 'ihr',     tip: 'Merke: ihr hat ein stummes h.' },
    { word: 'Ostern',  tip: 'Merke: Ostern schreibt man mit einem s.' },
    { word: 'Familie', tip: 'Merke: Familie endet auf -ie.' },
    { word: 'Theater', tip: 'Merke: Theater beginnt mit Th.' },
    { word: 'Lehrer',  tip: 'Merke: Lehrer hat ein stummes h.' },
    { word: 'Jänner',  tip: 'In Österreich heißt der erste Monat Jänner.' },
    { word: 'Sackerl', tip: 'In Österreich sagt man Sackerl statt Tüte.' },
  ];

  // ─── Genau lesen: Anweisungen ─────────────────────────────────────────────
  // Formen werden als Symbole gezeigt; die Reihenfolge der Tipps wird geprüft.

  const SHAPES_FOR_READING = [
    { id: 'stern',    label: 'Stern',    emoji: '⭐' },
    { id: 'kreis',    label: 'Kreis',    emoji: '🔵' },
    { id: 'dreieck',  label: 'Dreieck',  emoji: '🔺' },
    { id: 'quadrat',  label: 'Quadrat',  emoji: '🟩' },
    { id: 'herz',     label: 'Herz',     emoji: '❤️' },
    { id: 'blume',    label: 'Blume',    emoji: '🌸' },
  ];

  // ─── Bild und Satz vergleichen ────────────────────────────────────────────

  const PICTURE_SENTENCES = [
    { emoji: '🐕', right: 'Der Hund läuft.',        wrong: ['Die Katze schläft.', 'Der Vogel fliegt.'] },
    { emoji: '🌧️', right: 'Es regnet.',             wrong: ['Die Sonne scheint.', 'Es schneit.'] },
    { emoji: '🍎', right: 'Ein Apfel liegt da.',    wrong: ['Eine Banane liegt da.', 'Ein Ei liegt da.'] },
    { emoji: '🚲', right: 'Ein Fahrrad steht da.',  wrong: ['Ein Auto steht da.', 'Ein Zug steht da.'] },
    { emoji: '🐟', right: 'Ein Fisch schwimmt.',    wrong: ['Ein Hund bellt.', 'Ein Vogel singt.'] },
    { emoji: '☀️', right: 'Die Sonne scheint.',     wrong: ['Es regnet.', 'Es ist Nacht.'] },
    { emoji: '🎂', right: 'Eine Torte steht da.',   wrong: ['Ein Brot liegt da.', 'Eine Suppe steht da.'] },
    { emoji: '🐄', right: 'Eine Kuh steht auf der Wiese.', wrong: ['Ein Pferd springt.', 'Ein Schaf schläft.'] },
    { emoji: '❄️', right: 'Es schneit.',            wrong: ['Es ist heiß.', 'Der Wind weht warm.'] },
    { emoji: '📚', right: 'Da liegen Bücher.',      wrong: ['Da liegen Äpfel.', 'Da liegen Schuhe.'] },
  ];

  // ─── Tabellen lesen ───────────────────────────────────────────────────────

  // `askRow(label)` formuliert die Leseaufgabe für eine Zeile. Bei "Ziegen",
  // "Äpfel" passt "Wie viele Ziegen?", weil das Zeilenwort selbst die
  // gezählte Sache ist. Bei "1a" oder "März" ist das Zeilenwort dagegen ein
  // Name — dort muss die gesuchte Größe (Bücher, Tage) explizit genannt
  // werden, sonst entsteht Unsinn wie "Wie viele März?".
  const TABLES = [
    {
      title: 'Tiere im Streichelzoo',
      columns: ['Tier', 'Anzahl'],
      rows: [['Ziegen', 6], ['Schafe', 4], ['Hasen', 9], ['Enten', 7]],
      askRow: label => `Wie viele ${label}?`,
      maxQuestion: 'Wovon gibt es am meisten?',
      diffQuestion: (a, b) => `Wie viel mehr gibt es von „${a}" als von „${b}"?`,
    },
    {
      title: 'Obst im Korb',
      columns: ['Obst', 'Stück'],
      rows: [['Äpfel', 8], ['Birnen', 5], ['Bananen', 3], ['Zitronen', 2]],
      askRow: label => `Wie viele ${label}?`,
      maxQuestion: 'Wovon gibt es am meisten?',
      diffQuestion: (a, b) => `Wie viel mehr gibt es von „${a}" als von „${b}"?`,
    },
    {
      title: 'Ausgeliehene Bücher',
      columns: ['Klasse', 'Bücher'],
      rows: [['1a', 12], ['1b', 9], ['2a', 15], ['2b', 11]],
      askRow: label => `Wie viele Bücher hat die Klasse ${label} ausgeliehen?`,
      maxQuestion: 'Welche Klasse hat die meisten Bücher ausgeliehen?',
      diffQuestion: (a, b) => `Wie viel mehr Bücher hat die Klasse „${a}" ausgeliehen als die Klasse „${b}"?`,
    },
    {
      title: 'Regentage im Monat',
      columns: ['Monat', 'Tage'],
      rows: [['März', 9], ['April', 14], ['Mai', 7], ['Juni', 5]],
      askRow: label => `Wie viele Regentage hatte der ${label}?`,
      maxQuestion: 'In welchem Monat hat es am meisten geregnet?',
      diffQuestion: (a, b) => `Wie viel mehr hat es im ${a} geregnet als im ${b}?`,
    },
  ];

  // ─── Kurze Sachtexte ──────────────────────────────────────────────────────
  // Jede Frage ist direkt aus dem Text zu beantworten.

  const SHORT_TEXTS = [
    {
      title: 'Der Igel',
      text: 'Der Igel hat viele Stacheln. Am Tag schläft er. In der Nacht sucht er Käfer und Würmer. Im Winter hält der Igel Winterschlaf.',
      questions: [
        { q: 'Wann sucht der Igel sein Futter?', right: 'In der Nacht', wrong: ['Am Vormittag', 'Am Mittag'] },
        { q: 'Was macht der Igel im Winter?', right: 'Er hält Winterschlaf', wrong: ['Er fliegt weg', 'Er baut ein Nest'] },
      ],
    },
    {
      title: 'Die Biene',
      text: 'Bienen leben in einem Stock. Sie sammeln Nektar aus Blüten. Aus dem Nektar machen sie Honig. Eine Biene hat sechs Beine.',
      questions: [
        { q: 'Was machen Bienen aus Nektar?', right: 'Honig', wrong: ['Milch', 'Brot'] },
        { q: 'Wie viele Beine hat eine Biene?', right: 'Sechs', wrong: ['Vier', 'Acht'] },
      ],
    },
    {
      title: 'Der Apfelbaum',
      text: 'Im Frühling blüht der Apfelbaum weiß. Im Sommer werden die Äpfel größer. Im Herbst pflücken wir die Äpfel. Im Winter hat der Baum keine Blätter.',
      questions: [
        { q: 'Wann pflücken wir die Äpfel?', right: 'Im Herbst', wrong: ['Im Frühling', 'Im Winter'] },
        { q: 'Welche Farbe haben die Blüten?', right: 'Weiß', wrong: ['Rot', 'Blau'] },
      ],
    },
    {
      title: 'Oskar in der Schule',
      text: 'Oskar wartet vor der Schule. Er hat ein rotes Halsband. Um zwölf Uhr kommt Luisa heraus. Dann gehen die beiden gemeinsam nach Hause.',
      questions: [
        { q: 'Welche Farbe hat Oskars Halsband?', right: 'Rot', wrong: ['Blau', 'Grün'] },
        { q: 'Wann kommt Luisa heraus?', right: 'Um zwölf Uhr', wrong: ['Um acht Uhr', 'Um drei Uhr'] },
      ],
    },
    {
      title: 'Das Eichhörnchen',
      text: 'Das Eichhörnchen klettert schnell auf Bäume. Es sammelt Nüsse und versteckt sie in der Erde. Im Winter findet es nicht alle wieder. Aus manchen Nüssen wächst ein neuer Baum.',
      questions: [
        { q: 'Wo versteckt das Eichhörnchen die Nüsse?', right: 'In der Erde', wrong: ['Im Wasser', 'Auf dem Dach'] },
        { q: 'Was wächst aus manchen Nüssen?', right: 'Ein neuer Baum', wrong: ['Eine Blume', 'Ein Pilz'] },
      ],
    },
  ];

  // ─── Schritte ordnen ──────────────────────────────────────────────────────

  const STEP_SEQUENCES = [
    { title: 'Zähne putzen', steps: ['Zahnpasta auf die Bürste geben', 'Die Zähne putzen', 'Den Mund ausspülen'] },
    { title: 'Ein Bild malen', steps: ['Ein Blatt Papier holen', 'Das Bild malen', 'Die Stifte wegräumen'] },
    { title: 'Brot streichen', steps: ['Das Brot aufschneiden', 'Butter darauf streichen', 'Das Brot essen'] },
    { title: 'In die Schule gehen', steps: ['Die Schultasche packen', 'Den Schulweg gehen', 'Im Klassenzimmer Platz nehmen'] },
    { title: 'Eine Blume pflanzen', steps: ['Ein Loch in die Erde graben', 'Die Blume hineinsetzen', 'Die Blume gießen'] },
    { title: 'Einen Brief schicken', steps: ['Den Brief schreiben', 'Den Brief in das Kuvert stecken', 'Den Brief einwerfen'] },
  ];

  // ─── Packlisten ───────────────────────────────────────────────────────────
  // 3 richtige aus 6 Vorschlägen auswählen.

  const PACKING_LISTS = [
    { title: 'Was brauchst du zum Schwimmen?', right: ['Badehose', 'Handtuch', 'Schwimmbrille'], wrong: ['Schneeschaufel', 'Winterjacke', 'Schulheft'] },
    { title: 'Was brauchst du für die Schule?', right: ['Schulheft', 'Bleistift', 'Lineal'], wrong: ['Badehose', 'Zelt', 'Kochtopf'] },
    { title: 'Was brauchst du zum Skifahren?', right: ['Handschuhe', 'Mütze', 'Skibrille'], wrong: ['Sonnencreme für den Strand', 'Badehose', 'Sandschaufel'] },
    { title: 'Was brauchst du für ein Picknick?', right: ['Decke', 'Brote', 'Wasserflasche'], wrong: ['Regenschirmständer', 'Fernseher', 'Schultasche'] },
    { title: 'Was brauchst du zum Malen?', right: ['Buntstifte', 'Papier', 'Radiergummi'], wrong: ['Fußball', 'Kochlöffel', 'Regenschirm'] },
  ];

  // ─── Lernwörter: erlaubte Übungsformen ────────────────────────────────────
  // Nicht jedes eingegebene Wort eignet sich für jede Aufgabenform.
  // Diese Prüfung entscheidet, welche Formen ein Wort zulässt.

  function learnWordCapabilities(word) {
    const w = String(word || '').trim();
    const caps = { lookCoverWrite: false, firstLetter: false, syllableCount: false, reason: '' };
    if (w.length < 2) { caps.reason = 'zu kurz'; return caps; }
    if (w.length > 20) { caps.reason = 'zu lang'; return caps; }
    if (!/^[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß-]*$/.test(w)) {
      caps.reason = 'enthält Zeichen, die nicht geübt werden können';
      return caps;
    }
    // Ansehen–verdecken–schreiben funktioniert für jedes gültige Wort.
    caps.lookCoverWrite = true;
    caps.firstLetter = true;
    // Silbenzahl nur behaupten, wenn wir sie sicher bestimmen können —
    // deshalb keine automatische Silbentrennung für eigene Wörter.
    caps.syllableCount = false;
    return caps;
  }

  return {
    NOUNS, ALPHABET, ABC_WORDS_L1, ABC_WORDS_L2, COMPOUNDS,
    VERBS, VERB_SENTENCES, NOUN_SENTENCES, ADJ_SENTENCES, ADJ_MATCH,
    PUNCTUATION, SENTENCE_STARTS, SENTENCE_PARTS,
    SYLLABLE_WORDS, ST_SP_WORDS, UMLAUT_DERIVATIONS, IE_WORDS,
    DOUBLE_CONSONANT, SINGLE_CONSONANT, EXTEND_WORDS, ERROR_SENTENCES, MEMORY_WORDS,
    SHAPES_FOR_READING, PICTURE_SENTENCES, TABLES, SHORT_TEXTS,
    STEP_SEQUENCES, PACKING_LISTS,
    learnWordCapabilities,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = GermanData;
