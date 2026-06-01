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

  // ─── Daten: Fehlender Buchstabe ───────────────────────────────────────────
  // Format: [masked, answer, full, difficulty(1=leicht/2=mittel/3=schwer)]

  const MISSING_LETTER_DATA = [
    // ── 4-Buchstaben-Wörter (Schwierigkeit 1) ──
    ['H_ND',  'U','HUND', 1], ['B_UM',  'A','BAUM', 1], ['H_US',  'A','HAUS', 1],
    ['B_LL',  'A','BALL', 1], ['W_LF',  'O','WOLF', 1], ['L_MM',  'A','LAMM', 1],
    ['_GEL',  'I','IGEL', 1], ['K_RB',  'O','KORB', 1], ['B_RG',  'E','BERG', 1],
    ['H_LZ',  'O','HOLZ', 1], ['G_LD',  'O','GOLD', 1], ['M_ND',  'O','MOND', 1],
    ['B_ND',  'A','BAND', 1], ['B_IN',  'E','BEIN', 1], ['D_CH',  'A','DACH', 1],
    ['G_NS',  'A','GANS', 1], ['GL_S',  'A','GLAS', 1], ['GR_S',  'A','GRAS', 1],
    ['H_LS',  'A','HALS', 1], ['H_FT',  'E','HEFT', 1], ['H_RZ',  'E','HERZ', 1],
    ['H_SE',  'O','HOSE', 1], ['K_SE',  'Ä','KÄSE', 1], ['L_CH',  'O','LOCH', 1],
    ['M_HL',  'E','MEHL', 1], ['M_ND',  'U','MUND', 1], ['N_ST',  'E','NEST', 1],
    ['_BST',  'O','OBST', 1], ['P_LZ',  'I','PILZ', 1], ['S_ND',  'A','SAND', 1],
    ['S_IL',  'E','SEIL', 1], ['S_HN',  'O','SOHN', 1], ['T_NZ',  'A','TANZ', 1],
    ['T_ER',  'I','TIER', 1], ['T_CH',  'U','TUCH', 1], ['T_RM',  'U','TURM', 1],
    ['W_LD',  'A','WALD', 1], ['W_ND',  'A','WAND', 1], ['Z_HN',  'A','ZAHN', 1],
    ['Z_LT',  'E','ZELT', 1], ['R_NG',  'I','RING', 1], ['R_CK',  'O','ROCK', 1],
    ['R_HE',  'U','RUHE', 1], ['_RM',   'A','ARM',  1],
    ['S_FT',  'A','SAFT', 1], ['PF_D',  'A','PFAD', 1],
    ['H_HN',  'A','HAHN', 1], ['B_CH',  'U','BUCH', 1], ['H_ND',  'A','HAND', 1],
    ['M_US',  'A','MAUS', 1], ['F_SCH', 'I','FISCH',2],
    // ── 5-Buchstaben-Wörter (Schwierigkeit 2) ──
    ['K_TZE', 'A','KATZE', 2], ['S_NNE', 'O','SONNE', 2], ['_PFEL', 'A','APFEL', 2],
    ['V_GEL', 'O','VOGEL', 2], ['PF_RD', 'E','PFERD', 2], ['H_SE',  'A','HASE',  2],
    ['L_WE',  'Ö','LÖWE',  2], ['_NTE',  'E','ENTE',  2], ['H_HN',  'U','HUHN',  2],
    ['_SEL',  'E','ESEL',  2], ['AD_ER', 'L','ADLER', 2], ['E_LE',  'U','EULE',  2],
    ['T_UBE', 'A','TAUBE', 2], ['FR_SCH','O','FROSCH',2], ['B_ENE', 'I','BIENE', 2],
    ['W_SPE', 'E','WESPE', 2], ['R_BE',  'A','RABE',  2], ['AM_ISE','E','AMEISE',2],
    ['ST_RN', 'E','STERN', 2], ['WO_KE', 'L','WOLKE', 2], ['BL_ME', 'U','BLUME', 2],
    ['BR_CK', 'Ü','BRÜCKE',2], ['K_STE', 'Ü','KÜSTE', 2], ['SCH_F', 'A','SCHAF', 2],
    ['Z_EGE', 'I','ZIEGE', 2], ['R_ND',  'I','RIND',  2], ['_LCH',  'E','ELCH',  2],
    ['F_CHS', 'U','FUCHS', 2], ['_TTER', 'O','OTTER', 2],
    ['B_BER', 'I','BIBER', 2], ['D_CHS', 'A','DACHS', 2], ['N_SSE', 'Ü','NÜSSE', 2],
    ['R_SE',  'O','ROSE',  2], ['T_LPE', 'U','TULPE', 2],
    ['T_NNE', 'A','TANNE', 2], ['E_CHE', 'I','EICHE', 2], ['B_RKE', 'I','BIRKE', 2],
    ['K_KTUS','A','KAKTUS',2], ['M_OS',  'O','MOOS',  2], ['G_RTEN','A','GARTEN',2],
    ['F_LD',  'E','FELD',  2], ['W_ESE', 'I','WIESE', 2], ['BR_T',  'O','BROT',  2],
    ['M_LCH', 'I','MILCH', 2], ['B_TTER','U','BUTTER',2], ['K_CHE', 'Ü','KÜCHE', 2],
    ['T_SCH', 'I','TISCH', 2], ['ST_HL', 'U','STUHL', 2], ['SCH_ANK','R','SCHRANK',2],
    ['L_MPE', 'A','LAMPE', 2], ['B_TT',  'E','BETT',  2], ['T_PPICH','E','TEPPICH',2],
    ['H_MD',  'E','HEMD',  2], ['J_CKE', 'A','JACKE', 2], ['M_TZE', 'Ü','MÜTZE', 2],
    ['SCH_L', 'A','SCHAL', 2], ['SCH_H', 'U','SCHUH', 2], ['KL_ID', 'E','KLEID', 2],
    ['R_CK',  'O','ROCK',  2], ['M_NTEL','A','MANTEL',2], ['ST_FT', 'I','STIFT', 2],
    ['L_NEAL','I','LINEAL',2], ['P_PPE', 'U','PUPPE', 2],
    ['K_PF',  'O','KOPF',  2], ['N_SE',  'A','NASE',  2],
    ['Z_NGE', 'U','ZUNGE', 2], ['F_SS',  'U','FUSS',  2], ['KN_E',  'I','KNIE',  2],
    ['B_UCH', 'A','BAUCH', 2], ['ELL_OGEN','B','ELLBOGEN',2],
    ['_UGE',  'A','AUGE',  2], ['Z_HE',  'E','ZEHE',  2], ['_HREN', 'O','OHREN', 2],
    ['AP_EL', 'F','APFEL', 2], ['B_RNE', 'I','BIRNE', 2], ['BAN_NE','A','BANANE',2],
    ['KI_SCHE','R','KIRSCHE',2], ['TR_UBE','A','TRAUBE',2], ['Z_TRONE','I','ZITRONE',2],
    ['T_MATE','O','TOMATE',2], ['K_ROTTE','A','KAROTTE',2], ['G_RKE', 'U','GURKE', 2],
    ['ZW_EBEL','I','ZWIEBEL',2], ['SAL_T', 'A','SALAT', 2], ['KU_HEN','C','KUCHEN',2],
    ['J_GHURT','O','JOGHURT',2], ['W_SSER','A','WASSER',2], ['S_FT',  'A','SAFT',  2],
    // ── 6+-Buchstaben-Wörter (Schwierigkeit 3) ──
    ['SCH_LE',    'U','SCHULE',    3], ['SCH_FF',    'I','SCHIFF',    3],
    ['FL_GZEUG',  'U','FLUGZEUG',  3], ['F_HRRAD',   'A','FAHRRAD',   3],
    ['BLEI_TIFT', 'S','BLEISTIFT', 3], ['SCH_RE',    'E','SCHERE',    3],
    ['LIN_AL',    'E','LINEAL',    3], ['T_SCHE',    'A','TASCHE',    3],
    ['FENS_ER',   'T','FENSTER',   3], ['G_RTEN',    'A','GARTEN',    3],
    ['SP_NNE',    'I','SPINNE',    3], ['SCHNEC_E',  'K','SCHNECKE',  3],
    ['EL_FANT',   'E','ELEFANT',   3], ['GIR_FFE',   'A','GIRAFFE',   3],
    ['PING_IN',   'U','PINGUIN',   3], ['DEL_HIN',   'P','DELPHIN',   3],
    ['SCHL_NGE',  'A','SCHLANGE',  3], ['L_HRERIN',  'E','LEHRERIN',  3],
    ['KL_SSE',    'A','KLASSE',    3], ['H_USAUFGABE','A','HAUSAUFGABE',3],
    ['FR_HSTÜCK', 'Ü','FRÜHSTÜCK', 3], ['MITTAG_SSEN','E','MITTAGESSEN',3],
    ['AB_NDBROT', 'E','ABENDBROT', 3], ['K_NSTLER',  'Ü','KÜNSTLER',  3],
    ['TH_ATER',   'E','THEATER',   3], ['ZI_KUS',    'R','ZIRKUS',    3],
    ['B_LLON',    'A','BALLON',    3], ['REGENB_GEN','O','REGENBOGEN', 3],
    ['GEW_TTER',  'I','GEWITTER',  3], ['SCH_LTER',  'U','SCHULTER',  3],
    ['ELL_OGEN',  'B','ELLBOGEN',  3], ['FR_HLING',  'Ü','FRÜHLING',  3],
    ['S_MMER',    'O','SOMMER',    3], ['H_RBST',    'E','HERBST',    3],
    ['W_NTER',    'I','WINTER',    3], ['OKT_BER',   'O','OKTOBER',   3],
    ['DEZ_MBER',  'E','DEZEMBER',  3], ['JAN_AR',    'U','JANUAR',    3],
    ['F_BRUAR',   'E','FEBRUAR',   3], ['M_RCHEN',   'Ä','MÄRCHEN',   3],
    ['Z_UBER',    'A','ZAUBER',    3], ['KR_NKENHAUS','A','KRANKENHAUS',3],
    ['F_UERWEHR', 'E','FEUERWEHR', 3], ['FL_GHAFEN', 'U','FLUGHAFEN', 3],
    ['B_HNHOF',   'A','BAHNHOF',   3], ['BIBL_OTHEK','I','BIBLIOTHEK', 3],
  ];

  // Wörter-Pool für Buchstaben-Sortieraufgaben
  const SORT_WORDS = [
    // 3–4 Buchstaben (leicht)
    'HUND','BAUM','HAUS','BALL','WOLF','LAMM','KORB','BERG','HOLZ','MOND',
    'BAND','BEIN','DACH','GANS','GLAS','GRAS','HALS','HEFT','HERZ','HOSE',
    'KÄSE','LOCH','MEHL','MUND','NEST','OBST','PILZ','SAND','SEIL','SOHN',
    'TANZ','TIER','TUCH','TURM','WALD','WAND','ZAHN','ZELT','RING','ROCK',
    'RUHE','SAFT','HAHN','BUCH','HAND','MAUS','FISCH','IGEL','RABE','ESEL',
    // 5 Buchstaben (mittel)
    'KATZE','SONNE','APFEL','VOGEL','PFERD','HASE','LÖWE','ENTE','ADLER',
    'EULE','TAUBE','BIENE','WESPE','STERN','WOLKE','BLUME','SCHAF','FUCHS',
    'BIBER','DACHS','ROSE','TULPE','TANNE','EICHE','BIRKE','MOOS','WIESE',
    'MILCH','KÜCHE','TISCH','STUHL','LAMPE','BETT','HEMD','JACKE','MÜTZE',
    'SCHAL','KLEID','STIFT','PUPPE','KOPF','NASE','ZUNGE','FUSS','AUGE',
    'APFEL','BIRNE','KIRSCHE','TRAUBE','TOMATE','GURKE','SALAT','WASSER',
    'IGEL','SCHUH','MANTEL','PULLOVER','SCHERE','TASCHE','LINEAL',
    // 6+ Buchstaben (schwer)
    'SCHULE','SCHIFF','FAHRRAD','GARTEN','SPINNE','ELEFANT','GIRAFFE',
    'PINGUIN','DELPHIN','SCHLANGE','LEHRERIN','KLASSE','FENSTER','BLUME',
    'FRÜHLING','SOMMER','HERBST','WINTER','OKTOBER','JANUAR','FEBRUAR',
    'MÄRCHEN','ZAUBER','BAHNHOF','THEATER','ZIRKUS','BALLON','REGENBOGEN',
    'GEWITTER','SCHULTER','ELLBOGEN','KRANKENHAUS','FEUERWEHR','FLUGHAFEN',
    'BIBLIOTHEK','KÜNSTLER','SCHULBUCH','HAUSAUFGABE','MITTAGESSEN',
  ];

  // ─── Daten: Wortkategorien ────────────────────────────────────────────────

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
    {w:'Gras',    cat:'Pflanze'},{w:'Busch',   cat:'Pflanze'},{w:'Pilz',    cat:'Pflanze'},
    {w:'Tanne',   cat:'Pflanze'},{w:'Eiche',   cat:'Pflanze'},{w:'Birke',   cat:'Pflanze'},
    {w:'Blume',   cat:'Pflanze'},{w:'Kaktus',  cat:'Pflanze'},{w:'Moos',    cat:'Pflanze'},
    {w:'Farn',    cat:'Pflanze'},{w:'Efeu',    cat:'Pflanze'},{w:'Wiese',   cat:'Pflanze'},
    {w:'Nelke',   cat:'Pflanze'},{w:'Lilie',   cat:'Pflanze'},{w:'Bambus',  cat:'Pflanze'},
    {w:'Palme',   cat:'Pflanze'},{w:'Eibe',    cat:'Pflanze'},{w:'Ahorn',   cat:'Pflanze'},
    {w:'Löwenzahn',cat:'Pflanze'},{w:'Vergissmeinnicht',cat:'Pflanze'},
    // Farbe
    {w:'Rot',     cat:'Farbe'},  {w:'Blau',    cat:'Farbe'},  {w:'Grün',    cat:'Farbe'},
    {w:'Gelb',    cat:'Farbe'},  {w:'Schwarz', cat:'Farbe'},  {w:'Weiß',    cat:'Farbe'},
    {w:'Braun',   cat:'Farbe'},  {w:'Orange',  cat:'Farbe'},  {w:'Lila',    cat:'Farbe'},
    {w:'Pink',    cat:'Farbe'},  {w:'Grau',    cat:'Farbe'},  {w:'Rosa',    cat:'Farbe'},
    {w:'Türkis',  cat:'Farbe'},  {w:'Gold',    cat:'Farbe'},  {w:'Silber',  cat:'Farbe'},
    {w:'Beige',   cat:'Farbe'},  {w:'Mint',    cat:'Farbe'},  {w:'Violett', cat:'Farbe'},
    {w:'Dunkelblau',cat:'Farbe'},{w:'Hellgrün',cat:'Farbe'},  {w:'Dunkelrot',cat:'Farbe'},
    {w:'Cremefarben',cat:'Farbe'},{w:'Hellblau',cat:'Farbe'},
    // Kleidung
    {w:'Hemd',    cat:'Kleidung'},{w:'Hose',   cat:'Kleidung'},{w:'Rock',   cat:'Kleidung'},
    {w:'Kleid',   cat:'Kleidung'},{w:'Mantel', cat:'Kleidung'},{w:'Jacke',  cat:'Kleidung'},
    {w:'Schuhe',  cat:'Kleidung'},{w:'Socken', cat:'Kleidung'},{w:'Mütze',  cat:'Kleidung'},
    {w:'Schal',   cat:'Kleidung'},{w:'Pullover',cat:'Kleidung'},{w:'Hemd',  cat:'Kleidung'},
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
    {w:'Segelboot',cat:'Fahrzeug'},{w:'Gondel',cat:'Fahrzeug'},
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

  // ─── Daten: Gegenteile ────────────────────────────────────────────────────

  const OPPOSITE_PAIRS = [
    ['groß','klein'],     ['warm','kalt'],       ['schnell','langsam'],
    ['hell','dunkel'],    ['laut','leise'],       ['nass','trocken'],
    ['schwer','leicht'],  ['lang','kurz'],        ['hoch','tief'],
    ['alt','jung'],       ['neu','alt'],          ['oben','unten'],
    ['vorne','hinten'],   ['links','rechts'],     ['viel','wenig'],
    ['hart','weich'],     ['dick','dünn'],        ['rund','eckig'],
    ['breit','schmal'],   ['voll','leer'],        ['sauber','schmutzig'],
    ['froh','traurig'],   ['mutig','ängstlich'],  ['fleißig','faul'],
    ['gesund','krank'],   ['schlau','dumm'],      ['schön','hässlich'],
    ['stark','schwach'],  ['glücklich','unglücklich'], ['gut','böse'],
    ['an','aus'],         ['auf','zu'],           ['rein','raus'],
    ['rauf','runter'],    ['ja','nein'],          ['immer','nie'],
    ['heute','morgen'],   ['früh','spät'],        ['Tag','Nacht'],
    ['Sommer','Winter'],  ['Frühling','Herbst'],  ['Sonne','Regen'],
    ['Feuer','Wasser'],   ['Himmel','Erde'],      ['Pflanze','Tier'],
    ['Mann','Frau'],      ['Junge','Mädchen'],    ['Hund','Katze'],
    ['Riese','Zwerg'],    ['König','Bettler'],    ['Held','Bösewicht'],
    ['anfangen','aufhören'], ['schlafen','wachen'], ['lachen','weinen'],
    ['kaufen','verkaufen'],  ['fragen','antworten'], ['öffnen','schließen'],
    ['geben','nehmen'],  ['suchen','finden'],    ['bauen','abreißen'],
    ['wachsen','schrumpfen'],['kommen','gehen'],  ['stehen','liegen'],
    ['sitzen','stehen'],  ['hören','sprechen'],  ['lesen','schreiben'],
    ['essen','fasten'],   ['trinken','verdursten'],['schlafen','wachen'],
    ['regen','scheinen'], ['stürmisch','ruhig'],  ['eisig','heiß'],
    ['süß','sauer'],      ['bitter','süß'],       ['salzig','süß'],
    ['scharf','mild'],    ['frisch','alt'],       ['roh','gekocht'],
    ['gerade','krumm'],  ['flach','steil'],      ['glatt','rau'],
    ['leer','voll'],      ['nah','fern'],         ['innen','außen'],
    ['zusammen','allein'],['vorne','hinten'],     ['oben','unten'],
    ['lustig','ernst'],   ['freundlich','unfreundlich'], ['höflich','unhöflich'],
    ['mutig','feige'],    ['ehrlich','unehrlich'], ['pünktlich','unpünktlich'],
    ['ordentlich','unordentlich'], ['aufmerksam','unaufmerksam'],
    ['vorsichtig','unvorsichtig'], ['geduldig','ungeduldig'],
    ['angenehm','unangenehm'],    ['interessant','langweilig'],
  ];

  // ─── Aufgaben-Generatoren ─────────────────────────────────────────────────

  const exercises = {

    missingLetter: {
      id: 'missingLetter',
      title: 'Fehlender Buchstabe',
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
      title: 'Buchstaben ordnen',
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
            <p class="q-label">Ordne die Buchstaben zum richtigen Wort:</p>
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
      title: 'Wortkategorie',
      icon: '🏷️',
      description: 'Welches Wort gehört zur Gruppe?',
      generate(difficulty) {
        let correct, category, choices;
        let attempts = 0;
        do {
          category = randomFrom(CATEGORIES);
          const inCat = CATEGORY_ITEMS.filter(d => d.cat === category);
          const outCat = CATEGORY_ITEMS.filter(d => d.cat !== category);
          const correctItem = randomFrom(inCat);
          correct = correctItem.w;
          const wrong = shuffle(outCat).slice(0, 2).map(d => d.w);
          choices = shuffle([correct, ...wrong]);
          attempts++;
        } while (wasRecent('wordCategory', correct) && attempts < 15);
        markRecent('wordCategory', correct);
        return {
          questionHtml: `<p class="q-label">Welches Wort ist ein <strong>${category}</strong>?</p>`,
          answer: correct,
          hint: `Ein ${category} ist ein Lebewesen oder Gegenstand aus dieser Gruppe.`,
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
          const others = OPPOSITE_PAIRS
            .filter(p => p !== pair)
            .map(p => (Math.random() < 0.5 ? p[1] : p[0]));
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
          hint: `Das Gegenteil von „${word}" beschreibt das genaue Gegenteil.`,
          taskType: 'choice',
          choices,
        };
      },
    },

  };

  // ─── Session-State & Konstanten ───────────────────────────────────────────

  const SESSION_LENGTH = 10;
  let currentExerciseId = null;
  let currentTask = null;
  let sessionStats = { correct: 0, total: 0 };
  let answered = false;

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

  function renderExerciseCard(ex) {
    const profile = Storage.getActiveProfile();
    const stats = profile ? Storage.getSessionStats(profile.id, ex.id) : null;
    let progressHtml = stats
      ? `<span class="ex-progress">${getSessionStars(stats.bestScore,SESSION_LENGTH)>0?'⭐'.repeat(getSessionStars(stats.bestScore,SESSION_LENGTH)):'–'} Beste: ${stats.bestScore}/${SESSION_LENGTH}</span>`
      : `<span class="ex-progress ex-not-played">Noch nicht gespielt</span>`;
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
          <p class="menu-intro">Was möchtest du heute üben?</p>
          <div class="exercise-grid">
            ${Object.values(exercises).map(renderExerciseCard).join('')}
          </div>
        </main>
      </div>
    `;
    document.querySelectorAll('.exercise-card').forEach(card => {
      card.addEventListener('click', () => {
        sessionStats = { correct: 0, total: 0 };
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
    currentTask = generateTask(currentExerciseId);
    answered = false;

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
           <button class="btn btn-primary" id="check-btn">Prüfen ✓</button>
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
                <div class="task-progress-fill" style="width:${((sessionStats.total-1)/SESSION_LENGTH)*100}%"></div>
              </div>
              <span class="task-progress-label">Aufgabe <strong>${sessionStats.total}</strong> von ${SESSION_LENGTH}</span>
            </div>
            <div class="task-question">${currentTask.questionHtml}</div>
            ${inputSection}
            <div class="task-feedback hidden" id="task-feedback"></div>
            <div class="task-actions">
              <button class="btn btn-ghost" id="hint-btn">💡 Tipp</button>
              <button class="btn btn-ghost" id="next-btn" ${isChoice ? 'style="display:none"' : ''}>Nächste →</button>
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
        input.focus();
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
        if (sessionStats.total >= SESSION_LENGTH) renderSessionComplete();
        else renderTask();
      });
    }

    document.getElementById('hint-btn').addEventListener('click', () => {
      showFeedback(currentTask.hint, 'hint');
    });
    document.getElementById('back-to-village').addEventListener('click', () => {
      sessionStats = { correct: 0, total: 0 };
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
      if (fill) fill.style.width = `${(sessionStats.total/SESSION_LENGTH)*100}%`;

      if (currentTask.taskType === 'choice') {
        highlightChoices(value, true);
        setTimeout(() => {
          if (sessionStats.total >= SESSION_LENGTH) renderSessionComplete();
          else renderTask();
        }, 1600);
      } else {
        const checkBtn = document.getElementById('check-btn');
        const input = document.getElementById('task-answer');
        if (checkBtn) checkBtn.disabled = true;
        if (input) input.disabled = true;
        hideFeedback();
        setTimeout(() => {
          if (sessionStats.total >= SESSION_LENGTH) renderSessionComplete();
          else renderTask();
        }, 1600);
      }
    } else {
      answered = false;
      Oskar.silence();
      showFeedback(randomFrom(FEEDBACK_WRONG), 'wrong');

      if (currentTask.taskType === 'choice') {
        highlightChoices(value, false);
        answered = true;
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) { nextBtn.style.display = ''; nextBtn.addEventListener('click', () => {
          if (sessionStats.total >= SESSION_LENGTH) renderSessionComplete();
          else renderTask();
        }); }
      } else {
        const input = document.getElementById('task-answer');
        if (input) {
          input.value = '';
          input.classList.add('shake');
          setTimeout(() => input.classList.remove('shake'), 400);
          input.focus();
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
    const total   = SESSION_LENGTH;

    if (profile) Storage.saveSessionResult(profile.id, currentExerciseId, correct, total);

    const praise      = randomFrom(PRAISE_MESSAGES);
    const performance = getPerformanceText(correct, total);
    const stars       = getSessionStars(correct, total);
    const starStr     = stars > 0 ? '⭐'.repeat(stars) : '☆☆☆';

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen complete-screen">
        ${renderHeader()}
        <main class="complete-main">
          <div class="complete-card">
            <div class="complete-trophy">${stars>=3?'🏆':stars>=2?'🌟':'👍'}</div>
            <h2 class="complete-praise">${praise}</h2>
            <p class="complete-subtitle">Du hast alle <strong>${total} Aufgaben</strong> abgeschlossen.</p>
            <div class="complete-score-row">
              <span class="complete-stars">${starStr}</span>
              <span class="complete-score-text">Richtige Antworten: <strong>${correct} von ${total}</strong></span>
            </div>
            <p class="complete-performance">${performance}</p>
            <div class="complete-actions">
              <button class="btn btn-primary" id="play-again-btn">🔄 Noch einmal spielen</button>
              <button class="btn btn-ghost" id="back-to-menu-btn">🏠 Zurück zum Hauptmenü</button>
            </div>
          </div>
        </main>
      </div>
    `;

    document.getElementById('play-again-btn').addEventListener('click', () => {
      sessionStats = { correct: 0, total: 0 };
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
    sessionStats = { correct: 0, total: 0 };
    renderMenu();
  }

  return { mount };
})();
