/**
 * modules/words.js
 * Wörterhaus — Lesen, Schreiben und Wortverständnis für Klasse 2.
 */

const WordsModule = (() => {

  // ─── Hilfsfunktionen ──────────────────────────────────────────────────────

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ─── Anti-Wiederholung ────────────────────────────────────────────────────

  const RECENT_WINDOW = 5;
  const recentKeys = {};
  function wasRecent(id, key) { return (recentKeys[id] || []).includes(key); }
  function markRecent(id, key) {
    if (!recentKeys[id]) recentKeys[id] = [];
    recentKeys[id].push(key);
    if (recentKeys[id].length > RECENT_WINDOW) recentKeys[id].shift();
  }

  // ─── Daten: Welcher Buchstabe? ───────────────────────────────────────────
  // Format: [masked, answer, full, difficulty(1=leicht/2=mittel/3=schwer)]

  // Wichtig: Jede Maske darf nur EIN gültiges Wort ergeben.
  // Masken wie B_CH (BUCH/BACH) oder Z_HN (ZAHN/ZEHN) sind tabu.
  const MISSING_LETTER_DATA = [
    // ── 4-Buchstaben-Wörter (Schwierigkeit 1) ──
    ['HU_D',  'N','HUND', 1], ['B_UM',  'A','BAUM', 1], ['H_US',  'A','HAUS', 1],
    ['B_LL',  'A','BALL', 1], ['W_LF',  'O','WOLF', 1], ['L_MM',  'A','LAMM', 1],
    ['IG_L',  'E','IGEL', 1], ['K_RB',  'O','KORB', 1], ['_FFE',  'A','AFFE', 1],
    ['H_LZ',  'O','HOLZ', 1], ['_OND',  'M','MOND', 1],
    ['B_IN',  'E','BEIN', 1],
    ['G_NS',  'A','GANS', 1], ['GL_S',  'A','GLAS', 1], ['GR_S',  'A','GRAS', 1],
    ['H_LS',  'A','HALS', 1], ['_EFT',  'H','HEFT', 1], ['H_RZ',  'E','HERZ', 1],
    ['HOS_',  'E','HOSE', 1], ['K_SE',  'Ä','KÄSE', 1], ['LO_H',  'C','LOCH', 1],
    ['MU_D',  'N','MUND', 1], ['N_ST',  'E','NEST', 1],
    ['_BST',  'O','OBST', 1], ['S_ND',  'A','SAND', 1],
    ['S_IL',  'E','SEIL', 1], ['S_HN',  'O','SOHN', 1], ['T_NZ',  'A','TANZ', 1],
    ['TI_R',  'E','TIER', 1], ['T_CH',  'U','TUCH', 1], ['T_RM',  'U','TURM', 1],
    ['Z_LT',  'E','ZELT', 1], ['R_NG',  'I','RING', 1],
    ['_RM',   'A','ARM',  1],
    ['S_FT',  'A','SAFT', 1], ['PF_D',  'A','PFAD', 1],
    ['HAH_',  'N','HAHN', 1], ['HA_D',  'N','HAND', 1],
    ['M_US',  'A','MAUS', 1], ['F_SCH', 'I','FISCH',2],
    // ── 5-Buchstaben-Wörter (Schwierigkeit 2) ──
    ['KAT_E', 'Z','KATZE', 2], ['SONN_', 'E','SONNE', 2], ['_PFEL', 'A','APFEL', 2],
    ['VOG_L', 'E','VOGEL', 2], ['PF_RD', 'E','PFERD', 2],
    ['L_WE',  'Ö','LÖWE',  2], ['_NTE',  'E','ENTE',  2], ['HUH_',  'N','HUHN',  2],
    ['_SEL',  'E','ESEL',  2], ['AD_ER', 'L','ADLER', 2], ['EUL_',  'E','EULE',  2],
    ['T_UBE', 'A','TAUBE', 2], ['FRO_CH','S','FROSCH',2], ['B_ENE', 'I','BIENE', 2],
    ['W_SPE', 'E','WESPE', 2], ['RAB_',  'E','RABE',  2], ['AM_ISE','E','AMEISE',2],
    ['STER_', 'N','STERN', 2], ['WO_KE', 'L','WOLKE', 2], ['BL_ME', 'U','BLUME', 2],
    ['BR_CKE','Ü','BRÜCKE',2], ['SCH_F', 'A','SCHAF', 2],
    ['Z_EGE', 'I','ZIEGE', 2], ['_LCH',  'E','ELCH',  2],
    ['F_CHS', 'U','FUCHS', 2], ['_TTER', 'O','OTTER', 2],
    ['B_BER', 'I','BIBER', 2], ['D_CHS', 'A','DACHS', 2],
    ['R_SE',  'O','ROSE',  2], ['T_LPE', 'U','TULPE', 2],
    ['TANN_', 'E','TANNE', 2], ['EICH_', 'E','EICHE', 2], ['BIRK_', 'E','BIRKE', 2],
    ['K_KTUS','A','KAKTUS',2], ['M_OS',  'O','MOOS',  2], ['G_RTEN','A','GARTEN',2],
    ['F_LD',  'E','FELD',  2], ['W_ESE', 'I','WIESE', 2], ['_ROT',  'B','BROT',  2],
    ['MIL_H', 'C','MILCH', 2], ['BUTT_R','E','BUTTER',2], ['K_CHE', 'Ü','KÜCHE', 2],
    ['T_SCH', 'I','TISCH', 2], ['STU_L', 'H','STUHL', 2], ['SCH_ANK','R','SCHRANK',2],
    ['L_MPE', 'A','LAMPE', 2], ['B_TT',  'E','BETT',  2], ['T_PPICH','E','TEPPICH',2],
    ['H_MD',  'E','HEMD',  2], ['J_CKE', 'A','JACKE', 2], ['M_TZE', 'Ü','MÜTZE', 2],
    ['SCH_L', 'A','SCHAL', 2], ['SCH_H', 'U','SCHUH', 2], ['KL_ID', 'E','KLEID', 2],
    ['M_NTEL','A','MANTEL',2], ['ST_FT', 'I','STIFT', 2],
    ['L_NEAL','I','LINEAL',2], ['PUPP_', 'E','PUPPE', 2],
    ['K_PF',  'O','KOPF',  2], ['N_SE',  'A','NASE',  2],
    ['ZUNG_', 'E','ZUNGE', 2], ['KN_E',  'I','KNIE',  2],
    ['BA_CH', 'U','BAUCH', 2], ['ELL_OGEN','B','ELLBOGEN',2],
    ['_UGE',  'A','AUGE',  2], ['Z_HE',  'E','ZEHE',  2], ['OHR_N', 'E','OHREN', 2],
    ['B_RNE', 'I','BIRNE', 2], ['BAN_NE','A','BANANE',2],
    ['KI_SCHE','R','KIRSCHE',2], ['TR_UBE','A','TRAUBE',2], ['Z_TRONE','I','ZITRONE',2],
    ['T_MATE','O','TOMATE',2], ['K_ROTTE','A','KAROTTE',2], ['G_RKE', 'U','GURKE', 2],
    ['ZW_EBEL','I','ZWIEBEL',2], ['SAL_T', 'A','SALAT', 2], ['KU_HEN','C','KUCHEN',2],
    ['J_GHURT','O','JOGHURT',2], ['W_SSER','A','WASSER',2],
    ['G_BEL', 'A','GABEL', 2], ['NUD_L', 'E','NUDEL', 2], ['MESS_R','E','MESSER',2],
    ['L_FFEL','Ö','LÖFFEL',2], ['TASS_', 'E','TASSE', 2], ['K_NIG', 'Ö','KÖNIG', 2],
    ['PIR_T', 'A','PIRAT', 2], ['DR_CHE','A','DRACHE',2], ['SCHN_E','E','SCHNEE',2],
    ['_NSEL', 'I','INSEL', 2], ['AMS_L', 'E','AMSEL', 2], ['KERZ_', 'E','KERZE', 2],
    ['H_NIG', 'O','HONIG', 2], ['ZUCK_R','E','ZUCKER',2],
    // ── 6+-Buchstaben-Wörter (Schwierigkeit 3) ──
    ['SCHUL_',    'E','SCHULE',    3], ['SCH_FF',    'I','SCHIFF',    3],
    ['FL_GZEUG',  'U','FLUGZEUG',  3], ['F_HRRAD',   'A','FAHRRAD',   3],
    ['BLEI_TIFT', 'S','BLEISTIFT', 3], ['SCH_RE',    'E','SCHERE',    3],
    ['TASCH_',    'E','TASCHE',    3],
    ['FENS_ER',   'T','FENSTER',   3],
    ['SP_NNE',    'I','SPINNE',    3], ['SCHNEC_E',  'K','SCHNECKE',  3],
    ['EL_FANT',   'E','ELEFANT',   3], ['GIR_FFE',   'A','GIRAFFE',   3],
    ['PING_IN',   'U','PINGUIN',   3], ['DEL_IN',    'F','DELFIN',    3],
    ['SCHLANG_',  'E','SCHLANGE',  3], ['L_HRERIN',  'E','LEHRERIN',  3],
    ['KL_SSE',    'A','KLASSE',    3], ['H_USAUFGABE','A','HAUSAUFGABE',3],
    ['FR_HSTÜCK', 'Ü','FRÜHSTÜCK', 3], ['MITTAG_SSEN','E','MITTAGESSEN',3],
    ['AB_NDBROT', 'E','ABENDBROT', 3], ['K_NSTLER',  'Ü','KÜNSTLER',  3],
    ['TH_ATER',   'E','THEATER',   3], ['ZI_KUS',    'R','ZIRKUS',    3],
    ['B_LLON',    'A','BALLON',    3], ['REGENB_GEN','O','REGENBOGEN', 3],
    ['GEW_TTER',  'I','GEWITTER',  3], ['SCHULT_R',  'E','SCHULTER',  3],
    ['FR_HLING',  'Ü','FRÜHLING',  3],
    ['S_MMER',    'O','SOMMER',    3], ['H_RBST',    'E','HERBST',    3],
    ['W_NTER',    'I','WINTER',    3], ['OKT_BER',   'O','OKTOBER',   3],
    ['DEZ_MBER',  'E','DEZEMBER',  3], ['JAN_AR',    'U','JANUAR',    3],
    ['F_BRUAR',   'E','FEBRUAR',   3], ['M_RCHEN',   'Ä','MÄRCHEN',   3],
    ['Z_UBER',    'A','ZAUBER',    3], ['KR_NKENHAUS','A','KRANKENHAUS',3],
    ['F_UERWEHR', 'E','FEUERWEHR', 3], ['FL_GHAFEN', 'U','FLUGHAFEN', 3],
    ['B_HNHOF',   'A','BAHNHOF',   3], ['BIBL_OTHEK','I','BIBLIOTHEK', 3],
    ['SP_EGEL',   'I','SPIEGEL',   3], ['SCHL_SSEL', 'Ü','SCHLÜSSEL', 3],
    ['GESCH_NK',  'E','GESCHENK',  3], ['SCHM_TTERLING','E','SCHMETTERLING',3],
    ['MAR_ENKÄFER','I','MARIENKÄFER',3], ['SCHNEEM_NN','A','SCHNEEMANN',3],
    ['OST_RN',    'E','OSTERN',    3], ['WEIHN_CHTEN','A','WEIHNACHTEN',3],
    ['GEB_RTSTAG','U','GEBURTSTAG',3],
  ];

  // Wörter-Pool für Buchstaben-Sortieraufgaben.
  // Keine Wörter mit geläufigen Anagrammen (z.B. MEHL→HELM, LAMPE→PALME),
  // sonst wäre eine zweite Lösung möglich.
  const SORT_WORDS = [
    // 3–4 Buchstaben (leicht)
    'HUND','BAUM','HAUS','BALL','WOLF','LAMM','KORB','BERG','HOLZ','MOND',
    'BEIN','DACH','GLAS','HALS','HEFT','HERZ','HOSE',
    'KÄSE','LOCH','MUND','NEST','OBST','PILZ','SAND','SOHN',
    'TANZ','TIER','TUCH','TURM','WALD','WAND','ZAHN','ZELT','RING','ROCK',
    'SAFT','HAHN','BUCH','HAND','FISCH','RABE','ESEL','AFFE',
    // 5 Buchstaben (mittel)
    'KATZE','SONNE','APFEL','VOGEL','PFERD','HASE','LÖWE','ENTE','ADLER',
    'EULE','TAUBE','WESPE','WOLKE','BLUME','SCHAF','FUCHS',
    'BIBER','DACHS','ROSE','TULPE','TANNE','EICHE','BIRKE','MOOS',
    'MILCH','KÜCHE','STUHL','BETT','HEMD','JACKE','MÜTZE',
    'SCHAL','KLEID','STIFT','PUPPE','KOPF','NASE','ZUNGE','FUSS','AUGE',
    'BIRNE','KIRSCHE','TRAUBE','TOMATE','GURKE','WASSER',
    'SCHUH','MANTEL','PULLOVER','SCHERE','TASCHE','LINEAL','GABEL','NUDEL',
    'KERZE','HONIG','INSEL','KÖNIG','PIRAT','DRACHE','SCHNEE',
    // 6+ Buchstaben (schwer)
    'SCHULE','SCHIFF','FAHRRAD','SPINNE','ELEFANT','GIRAFFE',
    'PINGUIN','DELFIN','SCHLANGE','LEHRERIN','KLASSE','FENSTER',
    'FRÜHLING','SOMMER','HERBST','WINTER','OKTOBER','JANUAR','FEBRUAR',
    'MÄRCHEN','ZAUBER','BAHNHOF','THEATER','ZIRKUS','BALLON','REGENBOGEN',
    'GEWITTER','SCHULTER','ELLBOGEN','KRANKENHAUS','FEUERWEHR','FLUGHAFEN',
    'BIBLIOTHEK','KÜNSTLER','SCHULBUCH','HAUSAUFGABE','MITTAGESSEN',
  ];

  // ─── Daten: Was passt dazu? ────────────────────────────────────────────────

  const CATEGORY_ITEMS = [
    // Tier
    {w:'Hund',    cat:'Tier'},   {w:'Katze',   cat:'Tier'},   {w:'Maus',    cat:'Tier'},
    {w:'Vogel',   cat:'Tier'},   {w:'Fisch',   cat:'Tier'},   {w:'Pferd',   cat:'Tier'},
    {w:'Kuh',     cat:'Tier'},   {w:'Wolf',    cat:'Tier'},   {w:'Bär',     cat:'Tier'},
    {w:'Fuchs',   cat:'Tier'},   {w:'Hase',    cat:'Tier'},   {w:'Igel',    cat:'Tier'},
    {w:'Ente',    cat:'Tier'},   {w:'Huhn',    cat:'Tier'},   {w:'Schaf',   cat:'Tier'},
    {w:'Ziege',   cat:'Tier'},   {w:'Löwe',    cat:'Tier'},   {w:'Adler',   cat:'Tier'},
    {w:'Eule',    cat:'Tier'},   {w:'Frosch',  cat:'Tier'},   {w:'Biber',   cat:'Tier'},
    {w:'Biene',   cat:'Tier'},   {w:'Rabe',    cat:'Tier'},
    // Pflanze
    {w:'Baum',    cat:'Pflanze'},{w:'Rose',    cat:'Pflanze'},{w:'Tulpe',   cat:'Pflanze'},
    {w:'Gras',    cat:'Pflanze'},{w:'Busch',   cat:'Pflanze'},{w:'Klee',    cat:'Pflanze'},
    {w:'Tanne',   cat:'Pflanze'},{w:'Eiche',   cat:'Pflanze'},{w:'Birke',   cat:'Pflanze'},
    {w:'Blume',   cat:'Pflanze'},{w:'Kaktus',  cat:'Pflanze'},{w:'Moos',    cat:'Pflanze'},
    {w:'Farn',    cat:'Pflanze'},{w:'Efeu',    cat:'Pflanze'},{w:'Sonnenblume',cat:'Pflanze'},
    {w:'Nelke',   cat:'Pflanze'},{w:'Lilie',   cat:'Pflanze'},{w:'Bambus',  cat:'Pflanze'},
    {w:'Palme',   cat:'Pflanze'},{w:'Eibe',    cat:'Pflanze'},{w:'Ahorn',   cat:'Pflanze'},
    {w:'Löwenzahn',cat:'Pflanze'},{w:'Vergissmeinnicht',cat:'Pflanze'},
    // Farbe — „Orange" fehlt absichtlich: ist auch eine Frucht und wäre zweideutig.
    {w:'Rot',     cat:'Farbe'},  {w:'Blau',    cat:'Farbe'},  {w:'Grün',    cat:'Farbe'},
    {w:'Gelb',    cat:'Farbe'},  {w:'Schwarz', cat:'Farbe'},  {w:'Weiß',    cat:'Farbe'},
    {w:'Braun',   cat:'Farbe'},  {w:'Lila',    cat:'Farbe'},
    {w:'Pink',    cat:'Farbe'},  {w:'Grau',    cat:'Farbe'},  {w:'Rosa',    cat:'Farbe'},
    {w:'Türkis',  cat:'Farbe'},  {w:'Gold',    cat:'Farbe'},  {w:'Silber',  cat:'Farbe'},
    {w:'Violett', cat:'Farbe'},
    {w:'Dunkelblau',cat:'Farbe'},{w:'Hellgrün',cat:'Farbe'},  {w:'Dunkelrot',cat:'Farbe'},
    {w:'Hellblau',cat:'Farbe'},
    // Kleidung
    {w:'Hemd',    cat:'Kleidung'},{w:'Hose',   cat:'Kleidung'},{w:'Rock',   cat:'Kleidung'},
    {w:'Kleid',   cat:'Kleidung'},{w:'Mantel', cat:'Kleidung'},{w:'Jacke',  cat:'Kleidung'},
    {w:'Schuhe',  cat:'Kleidung'},{w:'Socken', cat:'Kleidung'},{w:'Mütze',  cat:'Kleidung'},
    {w:'Schal',   cat:'Kleidung'},{w:'Pullover',cat:'Kleidung'},{w:'Bluse',  cat:'Kleidung'},
    {w:'Strumpf', cat:'Kleidung'},{w:'Handschuh',cat:'Kleidung'},{w:'Schürze',cat:'Kleidung'},
    {w:'Gürtel',  cat:'Kleidung'},{w:'Kappe',  cat:'Kleidung'},{w:'Stiefel',cat:'Kleidung'},
    {w:'Badehose',cat:'Kleidung'},{w:'Badeanzug',cat:'Kleidung'},{w:'Schlafanzug',cat:'Kleidung'},
    {w:'Regenmantel',cat:'Kleidung'},{w:'Weste',cat:'Kleidung'},
    // Fahrzeug
    {w:'Auto',    cat:'Fahrzeug'},{w:'Bus',    cat:'Fahrzeug'},{w:'Zug',    cat:'Fahrzeug'},
    {w:'Flugzeug',cat:'Fahrzeug'},{w:'Schiff', cat:'Fahrzeug'},{w:'Fahrrad',cat:'Fahrzeug'},
    {w:'Motorrad',cat:'Fahrzeug'},{w:'Lkw',   cat:'Fahrzeug'},{w:'Straßenbahn',cat:'Fahrzeug'},
    {w:'Hubschrauber',cat:'Fahrzeug'},{w:'Rakete',cat:'Fahrzeug'},{w:'Boot',cat:'Fahrzeug'},
    {w:'U-Boot',  cat:'Fahrzeug'},{w:'Roller', cat:'Fahrzeug'},{w:'Skateboard',cat:'Fahrzeug'},
    {w:'Traktor', cat:'Fahrzeug'},{w:'Krankenwagen',cat:'Fahrzeug'},{w:'Feuerwehrauto',cat:'Fahrzeug'},
    {w:'Taxi',    cat:'Fahrzeug'},{w:'Bagger', cat:'Fahrzeug'},{w:'Kutsche',cat:'Fahrzeug'},
    {w:'Segelboot',cat:'Fahrzeug'},
    // Lebensmittel
    {w:'Brot',    cat:'Lebensmittel'},{w:'Milch',  cat:'Lebensmittel'},{w:'Apfel', cat:'Lebensmittel'},
    {w:'Banane',  cat:'Lebensmittel'},{w:'Birne',  cat:'Lebensmittel'},{w:'Kirsche',cat:'Lebensmittel'},
    {w:'Erdbeere',cat:'Lebensmittel'},{w:'Tomate', cat:'Lebensmittel'},{w:'Gurke', cat:'Lebensmittel'},
    {w:'Karotte', cat:'Lebensmittel'},{w:'Salat',  cat:'Lebensmittel'},{w:'Käse',  cat:'Lebensmittel'},
    {w:'Ei',      cat:'Lebensmittel'},{w:'Butter', cat:'Lebensmittel'},{w:'Kuchen',cat:'Lebensmittel'},
    {w:'Keks',    cat:'Lebensmittel'},{w:'Schokolade',cat:'Lebensmittel'},{w:'Bonbon',cat:'Lebensmittel'},
    {w:'Joghurt', cat:'Lebensmittel'},{w:'Saft',   cat:'Lebensmittel'},{w:'Suppe', cat:'Lebensmittel'},
    {w:'Nudeln',  cat:'Lebensmittel'},{w:'Reis',   cat:'Lebensmittel'},
    // Körperteil
    {w:'Kopf',    cat:'Körperteil'},{w:'Auge',  cat:'Körperteil'},{w:'Ohr',   cat:'Körperteil'},
    {w:'Nase',    cat:'Körperteil'},{w:'Mund',  cat:'Körperteil'},{w:'Zahn',  cat:'Körperteil'},
    {w:'Zunge',   cat:'Körperteil'},{w:'Hals',  cat:'Körperteil'},{w:'Arm',   cat:'Körperteil'},
    {w:'Hand',    cat:'Körperteil'},{w:'Finger',cat:'Körperteil'},{w:'Bauch', cat:'Körperteil'},
    {w:'Rücken',  cat:'Körperteil'},{w:'Bein',  cat:'Körperteil'},{w:'Knie',  cat:'Körperteil'},
    {w:'Fuß',     cat:'Körperteil'},{w:'Zehe',  cat:'Körperteil'},{w:'Schulter',cat:'Körperteil'},
    {w:'Ellbogen',cat:'Körperteil'},{w:'Stirn', cat:'Körperteil'},{w:'Wange', cat:'Körperteil'},
    {w:'Lippe',   cat:'Körperteil'},{w:'Herz',  cat:'Körperteil'},
  ];

  const CATEGORIES = ['Tier','Pflanze','Farbe','Kleidung','Fahrzeug','Lebensmittel','Körperteil'];

  // Aus diesen Kategorien dürfen KEINE falschen Antworten gezogen werden,
  // weil sich die Gruppen überschneiden (eine Tomate ist auch eine Pflanze,
  // ein Huhn ist auch ein Lebensmittel).
  const CATEGORY_CONFLICTS = {
    Pflanze:      ['Lebensmittel'],
    Lebensmittel: ['Pflanze', 'Tier'],
    Tier:         ['Lebensmittel'],
  };

  // Kindgerechte Tipps pro Kategorie
  const CATEGORY_HINTS = {
    Tier:         'Ein Tier lebt: Es kann laufen, fliegen oder schwimmen.',
    Pflanze:      'Eine Pflanze wächst in der Erde.',
    Farbe:        'Eine Farbe kannst du mit den Augen sehen, z.B. beim Malen.',
    Kleidung:     'Kleidung ziehst du an.',
    Fahrzeug:     'Mit einem Fahrzeug kannst du fahren oder fliegen.',
    Lebensmittel: 'Ein Lebensmittel kannst du essen oder trinken.',
    Körperteil:   'Ein Körperteil ist ein Teil von deinem Körper.',
  };

  // ─── Daten: Gegenteile ────────────────────────────────────────────────────

  // Nur Paare mit einem klaren, einzigen Gegenteil.
  // Entfernt wurden z.B. „scharf/mild" (scharf/stumpf wäre auch richtig)
  // und „Frühling/Herbst" (kein echtes Gegenteilspaar).
  const OPPOSITE_PAIRS = [
    ['groß','klein'],     ['lang','kurz'],        ['hoch','tief'],
    ['breit','schmal'],   ['dick','dünn'],        ['schwer','leicht'],
    ['hart','weich'],     ['warm','kalt'],        ['nass','trocken'],
    ['hell','dunkel'],    ['laut','leise'],       ['schnell','langsam'],
    ['voll','leer'],      ['sauber','schmutzig'], ['rund','eckig'],
    ['glatt','rau'],      ['gerade','krumm'],
    ['süß','sauer'],      ['roh','gekocht'],
    ['alt','jung'],       ['arm','reich'],        ['stark','schwach'],
    ['gesund','krank'],   ['schön','hässlich'],
    ['fleißig','faul'],   ['froh','traurig'],     ['mutig','ängstlich'],
    ['gut','böse'],       ['wild','zahm'],
    ['oben','unten'],     ['vorne','hinten'],     ['links','rechts'],
    ['innen','außen'],    ['nah','fern'],
    ['viel','wenig'],     ['richtig','falsch'],   ['Anfang','Ende'],
    ['früh','spät'],      ['immer','nie'],        ['ja','nein'],
    ['Tag','Nacht'],      ['Sommer','Winter'],
    ['satt','hungrig'],   ['müde','munter'],
    ['an','aus'],         ['auf','zu'],           ['rein','raus'],
    ['Mann','Frau'],      ['Junge','Mädchen'],    ['Riese','Zwerg'],
    ['Freund','Feind'],
    ['kommen','gehen'],   ['geben','nehmen'],     ['suchen','finden'],
    ['fragen','antworten'], ['lachen','weinen'],  ['kaufen','verkaufen'],
    ['bauen','abreißen'], ['wachsen','schrumpfen'], ['werfen','fangen'],
    ['ziehen','schieben'], ['steigen','sinken'],  ['schlafen','wachen'],
    ['höflich','unhöflich'],   ['ehrlich','unehrlich'],
    ['ordentlich','unordentlich'], ['geduldig','ungeduldig'],
    ['pünktlich','unpünktlich'],   ['freundlich','unfreundlich'],
    ['aufmerksam','unaufmerksam'], ['vorsichtig','unvorsichtig'],
    ['angenehm','unangenehm'],     ['interessant','langweilig'],
  ];

  // Wörter mit ähnlicher Bedeutung: Steht das gesuchte Gegenteil in einer
  // dieser Gruppen, darf kein anderes Wort derselben Gruppe als falsche
  // Antwort erscheinen — sonst gäbe es zwei „richtige" Lösungen.
  const OPPOSITE_SIMILAR_GROUPS = [
    ['klein','kurz','schmal','dünn','wenig','tief','unten','schwach','leise'],
    ['groß','lang','breit','dick','viel','hoch','oben','stark','laut'],
    ['kalt','kühl','Winter'],
    ['warm','heiß','Sommer'],
    ['hell','Tag'],
    ['dunkel','Nacht'],
    ['froh','lachen'],
    ['traurig','weinen'],
    ['schlafen','müde'],
    ['wachen','munter'],
    ['zu','aus'],
    ['auf','an','rein'],
    ['gehen','raus'],
    ['Frau','Mädchen'],
    ['Mann','Junge'],
  ];

  function isTooSimilar(a, b) {
    if (a === b) return true;
    return OPPOSITE_SIMILAR_GROUPS.some(g => g.includes(a) && g.includes(b));
  }

  // ─── Aufgaben-Generatoren ─────────────────────────────────────────────────

  const exercises = {

    missingLetter: {
      id: 'missingLetter',
      title: 'Welcher Buchstabe?',
      icon: '🔤',
      description: 'Welcher Buchstabe fehlt?',
      generate(difficulty) {
        const pool = MISSING_LETTER_DATA.filter(e => e[3] === difficulty);
        const fallback = MISSING_LETTER_DATA;
        const src = pool.length >= 5 ? pool : fallback;
        let entry;
        let attempts = 0;
        do {
          entry = randomFrom(src);
          attempts++;
        } while (wasRecent('missingLetter', entry[2]) && attempts < 15);
        markRecent('missingLetter', entry[2]);
        const [masked, answer, full] = entry;
        return {
          questionHtml: `
            <p class="q-label">Welcher Buchstabe fehlt?</p>
            <p class="word-masked">${masked}</p>
          `,
          answer: answer.toUpperCase(),
          hint: `Das Wort lautet: <strong>${full}</strong>`,
          taskType: 'text',
          inputMaxLength: answer.length,
          placeholder: '_',
        };
      },
    },

    sortLetters: {
      id: 'sortLetters',
      title: 'Wort bauen',
      icon: '🔀',
      description: 'Bringe die Buchstaben in die richtige Reihenfolge',
      generate(difficulty) {
        const pool = difficulty === 1
          ? SORT_WORDS.filter(w => w.length <= 4)
          : difficulty === 2
            ? SORT_WORDS.filter(w => w.length >= 4 && w.length <= 6)
            : SORT_WORDS.filter(w => w.length >= 5);
        const src = pool.length >= 5 ? pool : SORT_WORDS;
        let word;
        let attempts = 0;
        let shuffled;
        do {
          word = randomFrom(src);
          shuffled = shuffle(word.split(''));
          attempts++;
        } while (
          (wasRecent('sortLetters', word) || shuffled.join('') === word) &&
          attempts < 20
        );
        markRecent('sortLetters', word);
        const display = shuffled.join(' ');
        return {
          questionHtml: `
            <p class="q-label">Mach ein Wort daraus:</p>
            <p class="letter-scramble">${display}</p>
            <p class="q-sub">(${word.length} Buchstaben)</p>
          `,
          answer: word,
          hint: `Das Wort hat ${word.length} Buchstaben. Erster Buchstabe: <strong>${word[0]}</strong>`,
          taskType: 'text',
          inputMaxLength: word.length + 2,
          placeholder: '',
          compareIgnoreCase: true,
        };
      },
    },

    wordCategory: {
      id: 'wordCategory',
      title: 'Was passt dazu?',
      icon: '🏷️',
      description: 'Welches Wort gehört zur Gruppe?',
      generate(difficulty) {
        let correct, category, choices;
        let attempts = 0;
        do {
          category = randomFrom(CATEGORIES);
          const conflicts = CATEGORY_CONFLICTS[category] || [];
          const inCat = CATEGORY_ITEMS.filter(d => d.cat === category);
          // Falsche Antworten nie aus überlappenden Kategorien ziehen,
          // damit immer nur genau eine Antwort richtig ist.
          const outCat = CATEGORY_ITEMS.filter(
            d => d.cat !== category && !conflicts.includes(d.cat)
          );
          const correctItem = randomFrom(inCat);
          correct = correctItem.w;
          const wrong = shuffle(outCat).slice(0, 2).map(d => d.w);
          choices = shuffle([correct, ...wrong]);
          attempts++;
        } while (wasRecent('wordCategory', correct) && attempts < 15);
        markRecent('wordCategory', correct);
        return {
          questionHtml: `<p class="q-label">Was passt zu <strong>${category}</strong>?</p>`,
          answer: correct,
          hint: CATEGORY_HINTS[category] || 'Überlege, was zu dieser Gruppe gehört.',
          taskType: 'choice',
          choices,
        };
      },
    },

    opposites: {
      id: 'opposites',
      title: 'Gegenteile',
      icon: '↔️',
      description: 'Finde das Gegenteil des Wortes',
      generate(difficulty) {
        let pair, word, opposite, choices;
        let attempts = 0;
        do {
          pair = randomFrom(OPPOSITE_PAIRS);
          [word, opposite] = Math.random() < 0.5 ? pair : [pair[1], pair[0]];
          // Falsche Antworten dürfen weder dem gesuchten Gegenteil noch dem
          // Fragewort zu ähnlich sein — sonst wäre die Aufgabe zweideutig.
          const others = OPPOSITE_PAIRS
            .filter(p => p !== pair)
            .map(p => (Math.random() < 0.5 ? p[1] : p[0]))
            .filter(w => !isTooSimilar(w, opposite) && !isTooSimilar(w, word));
          const wrong = shuffle(others).slice(0, 2);
          choices = shuffle([opposite, ...wrong]);
          attempts++;
        } while (wasRecent('opposites', word) && attempts < 15);
        markRecent('opposites', word);
        return {
          questionHtml: `
            <p class="q-label">Was ist das Gegenteil von:</p>
            <p class="word-main">${word}</p>
          `,
          answer: opposite,
          hint: `Das gesuchte Wort beginnt mit „${opposite[0].toUpperCase()}".`,
          taskType: 'choice',
          choices,
        };
      },
    },

  };

  // ─── Session-State & Konstanten ───────────────────────────────────────────

  const DEFAULT_SESSION_LENGTH = 10;
  const MAX_WRONG_ATTEMPTS = 3; // danach wird die Lösung gezeigt
  let sessionLength = DEFAULT_SESSION_LENGTH;
  let currentExerciseId = null;
  let currentTask = null;
  let sessionStats = { correct: 0, total: 0 };
  let answered = false;
  let wrongAttempts = 0;
  let retryQueue = []; // falsch gelöste Aufgaben kommen später noch einmal

  function resetSession() {
    sessionStats = { correct: 0, total: 0 };
    retryQueue = [];
  }

  function queueRetry() {
    // Jede Aufgabe nur einmal wiederholen, mit mindestens einer Aufgabe Abstand
    if (currentTask._retry || sessionStats.total >= sessionLength) return;
    retryQueue.push({ ...currentTask, _retry: true, _notBefore: sessionStats.total + 2 });
  }

  function nextTask() {
    if (retryQueue.length &&
        (retryQueue[0]._notBefore <= sessionStats.total ||
         sessionStats.total >= sessionLength)) {
      return retryQueue.shift();
    }
    return generateTask(currentExerciseId);
  }

  const FEEDBACK_WRONG = [
    'Fast! Versuch es noch einmal! 💪',
    'Nicht ganz – du schaffst das! 🌟',
    'Noch ein Versuch! ✨',
    'Probier es nochmal! 🎯',
    'Schau nochmal genau hin! 🔍',
  ];

  const PRAISE_MESSAGES = [
    'Super gemacht! 🎉',
    'Klasse! 🌟',
    'Oskar ist stolz auf dich! 🐶',
    'Toll gelöst! 💫',
    'Du bist ein Wörter-Star! ⭐',
    'Fantastisch! 🏆',
    'Wunderbar! 🎈',
    'Großartig! ✨',
    'Prima! 🎀',
  ];

  function getSessionStars(correct, total) {
    const r = correct / total;
    return r >= 0.9 ? 3 : r >= 0.7 ? 2 : r >= 0.5 ? 1 : 0;
  }

  function getPerformanceText(correct, total) {
    const r = correct / total;
    if (r === 1)  return 'Perfekte Leistung! 🏆';
    if (r >= 0.9) return 'Sehr stark! 🌟';
    if (r >= 0.7) return 'Gut gemacht! 👍';
    if (r >= 0.5) return 'Weiter üben! 💪';
    return 'Nicht aufgeben! 🌈';
  }

  function launchConfetti() {
    const colors = ['#6DB68A','#F4A435','#7EB8D4','#B07EC8','#E85D75','#FFD166'];
    const c = document.createElement('div');
    c.className = 'confetti-container';
    document.body.appendChild(c);
    for (let i = 0; i < 60; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.cssText = [
        `left:${Math.random()*100}%`,
        `background:${colors[Math.floor(Math.random()*colors.length)]}`,
        `animation-delay:${(Math.random()*0.9).toFixed(2)}s`,
        `animation-duration:${(1.2+Math.random()*1.4).toFixed(2)}s`,
        `width:${6+Math.round(Math.random()*8)}px`,
        `height:${6+Math.round(Math.random()*8)}px`,
        `border-radius:${Math.random()>0.5?'50%':'3px'}`,
        `transform:rotate(${Math.round(Math.random()*360)}deg)`,
      ].join(';');
      c.appendChild(p);
    }
    setTimeout(() => c.remove(), 3500);
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  function renderHeader() {
    const profile = Storage.getActiveProfile();
    return `
      <header class="workshop-header">
        <button class="btn btn-back" id="back-to-village" title="Zurück zum Dorfplatz">←</button>
        <div class="workshop-title-block">
          <span class="workshop-icon">📖</span>
          <h1>Wörterhaus</h1>
        </div>
        <div class="star-badge">⭐ <span id="header-stars">${profile ? profile.stars : 0}</span></div>
      </header>
    `;
  }


  function renderSessionModeSelector() {
    return `
      <div class="session-mode" role="group" aria-label="Spiellänge wählen">
        <span class="session-mode-label">Wie lange?</span>
        <button class="session-mode-btn${sessionLength === 5 ? ' selected' : ''}" data-session-length="5" type="button">Kurz: 5</button>
        <button class="session-mode-btn${sessionLength === 10 ? ' selected' : ''}" data-session-length="10" type="button">Normal: 10</button>
      </div>
    `;
  }

  function bindSessionModeEvents() {
    document.querySelectorAll('.session-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const len = Number(btn.dataset.sessionLength);
        sessionLength = len === 5 ? 5 : DEFAULT_SESSION_LENGTH;
        renderMenu();
      });
    });
  }

  function renderExerciseCard(ex) {
    const profile = Storage.getActiveProfile();
    const stats = profile ? Storage.getSessionStats(profile.id, ex.id) : null;
    let progressHtml;
    if (stats) {
      const bestTotal = stats.bestTotal || DEFAULT_SESSION_LENGTH;
      const stars = getSessionStars(stats.bestScore, bestTotal);
      const starStr = stars > 0 ? '⭐'.repeat(stars) : '–';
      progressHtml = `<span class="ex-progress">${starStr} Beste: ${stats.bestScore}/${bestTotal}</span>`;
    } else {
      progressHtml = `<span class="ex-progress ex-not-played">Noch nicht gespielt</span>`;
    }
    return `
      <button class="exercise-card" data-exercise="${ex.id}">
        <span class="ex-icon">${ex.icon}</span>
        <span class="ex-title">${ex.title}</span>
        <span class="ex-desc">${ex.description}</span>
        ${progressHtml}
      </button>
    `;
  }

  function renderMenu() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen workshop-screen">
        ${renderHeader()}
        <main class="exercise-menu">
          <p class="menu-intro">Such dir ein Spiel aus.</p>
          ${renderSessionModeSelector()}
          <div class="exercise-grid">
            ${Object.values(exercises).map(renderExerciseCard).join('')}
          </div>
        </main>
      </div>
    `;
    bindSessionModeEvents();

    document.querySelectorAll('.exercise-card').forEach(card => {
      card.addEventListener('click', () => {
        resetSession();
        currentExerciseId = card.dataset.exercise;
        renderTask();
      });
    });
    document.getElementById('back-to-village').addEventListener('click', () => App.showVillage());
    setTimeout(() => {
      const menu = document.querySelector('.exercise-menu');
      if (menu) Oskar.show(menu, { placement:'inline-right', pool:'words', chance:0.7 });
    }, 50);
  }

  function generateTask(exerciseId) {
    const profile = Storage.getActiveProfile();
    const difficulty = profile ? Adaptive.getDifficulty(profile.id, exerciseId) : 1;
    const ex = exercises[exerciseId];
    return { ...ex.generate(difficulty), difficulty };
  }

  function renderTask() {
    const ex = exercises[currentExerciseId];
    if (!ex) return;

    sessionStats.total++;
    currentTask = nextTask();
    answered = false;
    wrongAttempts = 0;

    const isChoice = currentTask.taskType === 'choice';

    const inputSection = isChoice
      ? `<div class="choice-grid" id="choice-grid">
          ${currentTask.choices.map(c => `<button class="choice-btn" data-value="${encodeURIComponent(c)}">${c}</button>`).join('')}
         </div>`
      : `<div class="task-input-row">
           <input type="text" id="task-answer" class="task-input task-input-text"
             placeholder="${currentTask.placeholder || ''}"
             maxlength="${currentTask.inputMaxLength || 20}"
             autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" />
           <button class="btn btn-primary" id="check-btn">Fertig ✓</button>
         </div>`;

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen task-screen">
        ${renderHeader()}
        <main class="task-main">
          <div class="task-card">
            <div class="task-category">
              <span>${ex.icon}</span><span>${ex.title}</span>
              <span class="difficulty-indicator">${['⭐','⭐⭐','⭐⭐⭐'][currentTask.difficulty-1]||'⭐'}</span>
            </div>
            <div class="task-progress">
              <div class="task-progress-bar">
                <div class="task-progress-fill" style="width:${((sessionStats.total-1)/sessionLength)*100}%"></div>
              </div>
              <span class="task-progress-label">Aufgabe <strong>${sessionStats.total}</strong> von ${sessionLength}</span>
            </div>
            <div class="task-question">${currentTask.questionHtml}</div>
            ${inputSection}
            <div class="task-feedback hidden" id="task-feedback"></div>
            <div class="task-actions">
              <button class="btn btn-ghost" id="hint-btn">💡 Tipp</button>
              <button class="btn btn-ghost" id="next-btn" style="display:none">Weiter →</button>
            </div>
          </div>
        </main>
      </div>
    `;

    bindTaskEvents(isChoice);

    setTimeout(() => {
      const main = document.querySelector('.task-main');
      if (main) Oskar.show(main, { placement:'task-companion', pool:'taskIntro', chance:0.25 });
    }, 50);
  }

  function bindTaskEvents(isChoice) {
    if (isChoice) {
      document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (answered) return;
          evaluateAnswer(decodeURIComponent(btn.dataset.value));
        });
      });
    } else {
      const input = document.getElementById('task-answer');
      const checkBtn = document.getElementById('check-btn');
      if (input) {
        input.addEventListener('keydown', e => { if (e.key === 'Enter') checkBtn.click(); });
      }
      if (checkBtn) {
        checkBtn.addEventListener('click', () => {
          const val = (input ? input.value : '').trim();
          if (!val) return;
          evaluateAnswer(val);
        });
      }
      document.getElementById('next-btn').addEventListener('click', () => {
        if (sessionStats.total >= sessionLength) renderSessionComplete();
        else renderTask();
      });
    }

    document.getElementById('hint-btn').addEventListener('click', () => {
      showFeedback(currentTask.hint, 'hint');
    });
    document.getElementById('back-to-village').addEventListener('click', () => {
      resetSession();
      App.showVillage();
    });
  }

  function normalizeAnswer(val) {
    return val.trim().toUpperCase().replace(/\s+/g, '');
  }

  function evaluateAnswer(value) {
    if (answered) return;
    answered = true;

    const given = normalizeAnswer(value);
    const expected = normalizeAnswer(currentTask.answer);
    const correct = given === expected;

    const profile = Storage.getActiveProfile();
    if (profile) Storage.recordAttempt(profile.id, currentExerciseId, correct);

    if (correct) {
      sessionStats.correct++;
      if (profile) {
        Storage.addStars(profile.id, 1);
        const el = document.getElementById('header-stars');
        if (el) el.textContent = Storage.getActiveProfile().stars;
      }
      Oskar.say(randomFrom(Oskar.MESSAGES.correct));

      const fill = document.querySelector('.task-progress-fill');
      if (fill) fill.style.width = `${(sessionStats.total/sessionLength)*100}%`;

      if (currentTask.taskType === 'choice') {
        highlightChoices(value, true);
        setTimeout(() => {
          if (sessionStats.total >= sessionLength) renderSessionComplete();
          else renderTask();
        }, 1600);
      } else {
        const checkBtn = document.getElementById('check-btn');
        const input = document.getElementById('task-answer');
        if (checkBtn) checkBtn.disabled = true;
        if (input) input.disabled = true;
        hideFeedback();
        setTimeout(() => {
          if (sessionStats.total >= sessionLength) renderSessionComplete();
          else renderTask();
        }, 1600);
      }
    } else {
      answered = false;
      Oskar.silence();
      queueRetry();

      if (currentTask.taskType === 'choice') {
        showFeedback('Schau dir die grüne Antwort gut an – so merkst du sie dir! 🌟', 'wrong');
        highlightChoices(value, false);
        answered = true;
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) { nextBtn.style.display = ''; nextBtn.addEventListener('click', () => {
          if (sessionStats.total >= sessionLength) renderSessionComplete();
          else renderTask();
        }); }
      } else {
        wrongAttempts++;
        const input = document.getElementById('task-answer');
        if (wrongAttempts >= MAX_WRONG_ATTEMPTS) {
          // Nach drei Versuchen die Lösung zeigen, damit niemand stecken bleibt
          answered = true;
          showFeedback(
            `Die richtige Antwort ist: <strong>${currentTask.answer}</strong><br>Gleich klappt es bestimmt! 💪`,
            'hint'
          );
          if (input) input.disabled = true;
          const checkBtn = document.getElementById('check-btn');
          if (checkBtn) checkBtn.disabled = true;
          const nextBtn = document.getElementById('next-btn');
          if (nextBtn) nextBtn.style.display = '';
        } else {
          showFeedback(randomFrom(FEEDBACK_WRONG), 'wrong');
          if (input) {
            input.value = '';
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 400);
          }
        }
      }
    }
  }

  function highlightChoices(selected, wasCorrect) {
    document.querySelectorAll('.choice-btn').forEach(btn => {
      btn.disabled = true;
      const val = decodeURIComponent(btn.dataset.value);
      if (val === currentTask.answer) btn.classList.add('choice-btn--correct');
      else if (val === selected && !wasCorrect) btn.classList.add('choice-btn--wrong');
    });
  }

  function showFeedback(msg, type) {
    const fb = document.getElementById('task-feedback');
    if (!fb) return;
    fb.innerHTML = msg;
    fb.className = `task-feedback feedback-${type}`;
  }

  function hideFeedback() {
    const fb = document.getElementById('task-feedback');
    if (fb) fb.className = 'task-feedback hidden';
  }

  function renderSessionComplete() {
    launchConfetti();
    const profile = Storage.getActiveProfile();
    const correct = sessionStats.correct;
    const total   = sessionLength;
    const isPerfect = correct === total;

    if (profile) {
      Storage.saveSessionResult(profile.id, currentExerciseId, correct, total);
      if (isPerfect) Storage.addStars(profile.id, 2); // Bonus für eine fehlerfreie Runde
    }

    const praise      = randomFrom(PRAISE_MESSAGES);
    const performance = getPerformanceText(correct, total);
    const stars       = getSessionStars(correct, total);
    const starStr     = stars > 0 ? '⭐'.repeat(stars) : '☆☆☆';
    const bonusHtml   = isPerfect
      ? '<p class="complete-performance">🎁 +2 Bonus-Sterne für eine fehlerfreie Runde!</p>'
      : '';

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen complete-screen">
        ${renderHeader()}
        <main class="complete-main">
          <div class="complete-card">
            <div class="complete-trophy">${stars>=3?'🏆':stars>=2?'🌟':'👍'}</div>
            <h2 class="complete-praise">${praise}</h2>
            <p class="complete-subtitle">Du hast <strong>${total} Aufgaben</strong> gespielt.</p>
            <div class="complete-score-row">
              <span class="complete-stars">${starStr}</span>
              <span class="complete-score-text">Geschafft: <strong>${correct} von ${total}</strong></span>
            </div>
            <p class="complete-performance">${performance}</p>
            ${bonusHtml}
            <div class="complete-actions">
              <button class="btn btn-primary" id="play-again-btn">🔄 Nochmal spielen</button>
              <button class="btn btn-ghost" id="back-to-menu-btn">🏠 Zur Lernwelt</button>
            </div>
          </div>
        </main>
      </div>
    `;

    document.getElementById('play-again-btn').addEventListener('click', () => {
      resetSession();
      renderTask();
    });
    document.getElementById('back-to-menu-btn').addEventListener('click', () => App.showVillage());
    document.getElementById('back-to-village').addEventListener('click', () => App.showVillage());

    setTimeout(() => {
      const main = document.querySelector('.complete-main');
      if (main) Oskar.show(main, { placement:'task-companion', pool:'correct', chance:1 });
    }, 100);
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  function mount() {
    resetSession();
    renderMenu();
  }

  return { mount };
})();
