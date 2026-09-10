/**
 * content/words-data.js
 * Wortdaten für das Wörterhaus (Klasse 1 und Wortschatz Klasse 2).
 *
 * REDAKTIONSREGEL (Bericht, Abschnitt 2 D):
 *   Jede Buchstabenlücke und jedes Anagramm bekommt einen eindeutigen
 *   Hinweissatz. Dadurch bleibt genau eine sinnvolle Lösung übrig, auch
 *   wenn das Buchstabenmuster für sich genommen mehrdeutig wäre
 *   (H_RZ → HERZ/HARZ, R_NG → RING/RANG, RABE → ABER).
 *   Der Hinweis steht in der Aufgabe, nicht erst im Tipp.
 *
 *   `tests/content.test.js` prüft automatisch:
 *     • jeder Eintrag hat einen Hinweis,
 *     • Maske und Lösungsbuchstabe passen zum Wort,
 *     • kein Wort erscheint doppelt.
 */

const WordsData = (() => {

  // ─── Welcher Buchstabe fehlt? ─────────────────────────────────────────────
  // { masked, letter, word, clue, level }
  // level 1: vier Buchstaben · 2: fünf bis sechs · 3: sieben und mehr

  const MISSING_LETTER = [
    // ── Stufe 1 ──────────────────────────────────────────────────────────
    { masked: 'HU_D',  letter: 'N', word: 'HUND',  clue: 'Er bellt und wedelt mit dem Schwanz.', level: 1 },
    { masked: 'B_UM',  letter: 'A', word: 'BAUM',  clue: 'Er hat einen Stamm und viele Blätter.', level: 1 },
    { masked: 'H_US',  letter: 'A', word: 'HAUS',  clue: 'Darin wohnen Menschen.', level: 1 },
    { masked: 'B_LL',  letter: 'A', word: 'BALL',  clue: 'Damit spielst du Fußball.', level: 1 },
    { masked: 'W_LF',  letter: 'O', word: 'WOLF',  clue: 'Ein wildes Tier, das heult.', level: 1 },
    { masked: 'IG_L',  letter: 'E', word: 'IGEL',  clue: 'Das Tier mit den Stacheln.', level: 1 },
    { masked: 'K_RB',  letter: 'O', word: 'KORB',  clue: 'Darin trägst du Äpfel nach Hause.', level: 1 },
    { masked: '_FFE',  letter: 'A', word: 'AFFE',  clue: 'Er klettert gern auf Bäume.', level: 1 },
    { masked: 'H_LZ',  letter: 'O', word: 'HOLZ',  clue: 'Daraus wird ein Tisch gemacht.', level: 1 },
    { masked: '_OND',  letter: 'M', word: 'MOND',  clue: 'Er leuchtet nachts am Himmel.', level: 1 },
    { masked: 'B_IN',  letter: 'E', word: 'BEIN',  clue: 'Damit gehst du.', level: 1 },
    { masked: 'G_NS',  letter: 'A', word: 'GANS',  clue: 'Ein weißer Vogel, der schnattert.', level: 1 },
    { masked: 'GL_S',  letter: 'A', word: 'GLAS',  clue: 'Daraus trinkst du Wasser.', level: 1 },
    { masked: 'GR_S',  letter: 'A', word: 'GRAS',  clue: 'Es ist grün und wächst auf der Wiese.', level: 1 },
    { masked: 'H_LS',  letter: 'A', word: 'HALS',  clue: 'Er ist zwischen Kopf und Schultern.', level: 1 },
    { masked: '_EFT',  letter: 'H', word: 'HEFT',  clue: 'Darin schreibst du in der Schule.', level: 1 },
    { masked: 'H_RZ',  letter: 'E', word: 'HERZ',  clue: 'Es schlägt in deiner Brust.', level: 1 },
    { masked: 'HOS_',  letter: 'E', word: 'HOSE',  clue: 'Die ziehst du über die Beine.', level: 1 },
    { masked: 'K_SE',  letter: 'Ä', word: 'KÄSE',  clue: 'Er wird aus Milch gemacht und hat manchmal Löcher.', level: 1 },
    { masked: 'LO_H',  letter: 'C', word: 'LOCH',  clue: 'Ein Riss im Socken.', level: 1 },
    { masked: 'MU_D',  letter: 'N', word: 'MUND',  clue: 'Damit sprichst du und isst.', level: 1 },
    { masked: 'N_ST',  letter: 'E', word: 'NEST',  clue: 'Darin legt ein Vogel seine Eier.', level: 1 },
    { masked: '_BST',  letter: 'O', word: 'OBST',  clue: 'Äpfel, Birnen und Bananen zusammen.', level: 1 },
    { masked: 'S_ND',  letter: 'A', word: 'SAND',  clue: 'Damit baust du am Strand eine Burg.', level: 1 },
    { masked: 'S_IL',  letter: 'E', word: 'SEIL',  clue: 'Damit springst du im Turnsaal.', level: 1 },
    { masked: 'T_NZ',  letter: 'A', word: 'TANZ',  clue: 'Dabei bewegst du dich zur Musik.', level: 1 },
    { masked: 'TI_R',  letter: 'E', word: 'TIER',  clue: 'Hund, Katze und Maus sind das.', level: 1 },
    { masked: 'T_RM',  letter: 'U', word: 'TURM',  clue: 'Ein sehr hohes, schmales Gebäude.', level: 1 },
    { masked: 'Z_LT',  letter: 'E', word: 'ZELT',  clue: 'Darin schläfst du beim Campen.', level: 1 },
    { masked: 'R_NG',  letter: 'I', word: 'RING',  clue: 'Den steckst du an den Finger.', level: 1 },
    { masked: 'HAH_',  letter: 'N', word: 'HAHN',  clue: 'Er kräht am Morgen: Kikeriki!', level: 1 },
    { masked: 'HA_D',  letter: 'N', word: 'HAND',  clue: 'Daran hast du fünf Finger.', level: 1 },
    { masked: 'M_US',  letter: 'A', word: 'MAUS',  clue: 'Ein kleines graues Tier, das piepst.', level: 1 },
    { masked: 'B_TT',  letter: 'E', word: 'BETT',  clue: 'Darin schläfst du in der Nacht.', level: 1 },
    { masked: 'W_ND',  letter: 'A', word: 'WAND',  clue: 'Daran hängt im Zimmer ein Bild.', level: 1 },
    { masked: 'D_CH',  letter: 'A', word: 'DACH',  clue: 'Es ist ganz oben auf dem Haus.', level: 1 },

    // ── Stufe 2 ──────────────────────────────────────────────────────────
    { masked: 'KAT_E',  letter: 'Z', word: 'KATZE',  clue: 'Sie schnurrt und macht Miau.', level: 2 },
    { masked: 'SONN_',  letter: 'E', word: 'SONNE',  clue: 'Sie scheint am Tag und macht warm.', level: 2 },
    { masked: '_PFEL',  letter: 'A', word: 'APFEL',  clue: 'Eine rote oder grüne Frucht vom Baum.', level: 2 },
    { masked: 'VOG_L',  letter: 'E', word: 'VOGEL',  clue: 'Er hat Federn und kann fliegen.', level: 2 },
    { masked: 'PF_RD',  letter: 'E', word: 'PFERD',  clue: 'Darauf kann man reiten.', level: 2 },
    { masked: 'L_WE',   letter: 'Ö', word: 'LÖWE',   clue: 'Er wird König der Tiere genannt.', level: 2 },
    { masked: '_NTE',   letter: 'E', word: 'ENTE',   clue: 'Sie schwimmt im Teich und macht Quak.', level: 2 },
    { masked: 'AD_ER',  letter: 'L', word: 'ADLER',  clue: 'Ein großer Greifvogel mit scharfen Augen.', level: 2 },
    { masked: 'EUL_',   letter: 'E', word: 'EULE',   clue: 'Sie ist nachts wach und ruft Uhu.', level: 2 },
    { masked: 'FRO_CH', letter: 'S', word: 'FROSCH', clue: 'Er quakt und hüpft am Teich.', level: 2 },
    { masked: 'B_ENE',  letter: 'I', word: 'BIENE',  clue: 'Sie summt und macht Honig.', level: 2 },
    { masked: 'RAB_',   letter: 'E', word: 'RABE',   clue: 'Ein großer schwarzer Vogel.', level: 2 },
    { masked: 'STER_',  letter: 'N', word: 'STERN',  clue: 'Er funkelt nachts am Himmel.', level: 2 },
    { masked: 'WO_KE',  letter: 'L', word: 'WOLKE',  clue: 'Sie ist weiß und schwebt am Himmel.', level: 2 },
    { masked: 'BL_ME',  letter: 'U', word: 'BLUME',  clue: 'Sie blüht bunt im Garten.', level: 2 },
    { masked: 'BR_CKE', letter: 'Ü', word: 'BRÜCKE', clue: 'Darüber kommst du über den Fluss.', level: 2 },
    { masked: 'SCH_F',  letter: 'A', word: 'SCHAF',  clue: 'Es macht Mäh und gibt Wolle.', level: 2 },
    { masked: 'F_CHS',  letter: 'U', word: 'FUCHS',  clue: 'Ein rotes Tier mit buschigem Schwanz.', level: 2 },
    { masked: 'T_LPE',  letter: 'U', word: 'TULPE',  clue: 'Eine Frühlingsblume aus einer Zwiebel.', level: 2 },
    { masked: 'TANN_',  letter: 'E', word: 'TANNE',  clue: 'Ein Nadelbaum, der zu Weihnachten geschmückt wird.', level: 2 },
    { masked: 'G_RTEN', letter: 'A', word: 'GARTEN', clue: 'Dort wachsen Blumen und Gemüse beim Haus.', level: 2 },
    { masked: 'W_ESE',  letter: 'I', word: 'WIESE',  clue: 'Eine große Fläche mit Gras und Blumen.', level: 2 },
    { masked: 'MIL_H',  letter: 'C', word: 'MILCH',  clue: 'Ein weißes Getränk von der Kuh.', level: 2 },
    { masked: 'K_CHE',  letter: 'Ü', word: 'KÜCHE',  clue: 'In diesem Raum wird gekocht.', level: 2 },
    { masked: 'T_SCH',  letter: 'I', word: 'TISCH',  clue: 'Daran sitzt du beim Essen.', level: 2 },
    { masked: 'STU_L',  letter: 'H', word: 'STUHL',  clue: 'Darauf setzt du dich.', level: 2 },
    { masked: 'L_MPE',  letter: 'A', word: 'LAMPE',  clue: 'Sie macht das Zimmer hell.', level: 2 },
    { masked: 'J_CKE',  letter: 'A', word: 'JACKE',  clue: 'Die ziehst du an, wenn es kalt ist.', level: 2 },
    { masked: 'M_TZE',  letter: 'Ü', word: 'MÜTZE',  clue: 'Die setzt du im Winter auf den Kopf.', level: 2 },
    { masked: 'SCH_H',  letter: 'U', word: 'SCHUH',  clue: 'Den ziehst du über den Fuß.', level: 2 },
    { masked: 'KL_ID',  letter: 'E', word: 'KLEID',  clue: 'Ein Kleidungsstück, das über den Kopf geht.', level: 2 },
    { masked: 'ST_FT',  letter: 'I', word: 'STIFT',  clue: 'Damit malst du ein Bild.', level: 2 },
    { masked: 'L_NEAL', letter: 'I', word: 'LINEAL', clue: 'Damit ziehst du eine gerade Linie.', level: 2 },
    { masked: 'N_SE',   letter: 'A', word: 'NASE',   clue: 'Damit riechst du.', level: 2 },
    { masked: 'ZUNG_',  letter: 'E', word: 'ZUNGE',  clue: 'Damit schmeckst du im Mund.', level: 2 },
    { masked: 'BA_CH',  letter: 'U', word: 'BAUCH',  clue: 'Der knurrt, wenn du Hunger hast.', level: 2 },
    { masked: '_UGE',   letter: 'A', word: 'AUGE',   clue: 'Damit siehst du.', level: 2 },
    { masked: 'B_RNE',  letter: 'I', word: 'BIRNE',  clue: 'Eine Frucht, unten dick und oben schmal.', level: 2 },
    { masked: 'BAN_NE', letter: 'A', word: 'BANANE', clue: 'Eine gelbe, krumme Frucht.', level: 2 },
    { masked: 'T_MATE', letter: 'O', word: 'TOMATE', clue: 'Ein rotes Gemüse für den Salat.', level: 2 },
    { masked: 'G_RKE',  letter: 'U', word: 'GURKE',  clue: 'Ein langes, grünes Gemüse.', level: 2 },
    { masked: 'KU_HEN', letter: 'C', word: 'KUCHEN', clue: 'Den gibt es zum Geburtstag mit Kerzen.', level: 2 },
    { masked: 'W_SSER', letter: 'A', word: 'WASSER', clue: 'Das trinkst du, wenn du Durst hast.', level: 2 },
    { masked: 'G_BEL',  letter: 'A', word: 'GABEL',  clue: 'Damit isst du Nudeln.', level: 2 },
    { masked: 'MESS_R', letter: 'E', word: 'MESSER', clue: 'Damit schneidest du das Brot.', level: 2 },
    { masked: 'L_FFEL', letter: 'Ö', word: 'LÖFFEL', clue: 'Damit isst du Suppe.', level: 2 },
    { masked: 'TASS_',  letter: 'E', word: 'TASSE',  clue: 'Daraus trinkst du Kakao.', level: 2 },
    { masked: 'K_NIG',  letter: 'Ö', word: 'KÖNIG',  clue: 'Er trägt eine Krone und regiert ein Land.', level: 2 },
    { masked: 'DR_CHE', letter: 'A', word: 'DRACHE', clue: 'Im Märchen speit er Feuer.', level: 2 },
    { masked: 'SCHN_E', letter: 'E', word: 'SCHNEE', clue: 'Er fällt weiß im Winter vom Himmel.', level: 2 },
    { masked: '_NSEL',  letter: 'I', word: 'INSEL',  clue: 'Ein Stück Land mitten im Meer.', level: 2 },
    { masked: 'KERZ_',  letter: 'E', word: 'KERZE',  clue: 'Sie brennt mit einer kleinen Flamme.', level: 2 },
    { masked: 'H_NIG',  letter: 'O', word: 'HONIG',  clue: 'Er ist süß und kommt von der Biene.', level: 2 },
    { masked: 'ZUCK_R', letter: 'E', word: 'ZUCKER', clue: 'Er ist weiß und macht alles süß.', level: 2 },

    // ── Stufe 3 ──────────────────────────────────────────────────────────
    { masked: 'SCHUL_',     letter: 'E', word: 'SCHULE',     clue: 'Dorthin gehst du am Vormittag zum Lernen.', level: 3 },
    { masked: 'SCH_FF',     letter: 'I', word: 'SCHIFF',     clue: 'Es fährt über das Meer.', level: 3 },
    { masked: 'FL_GZEUG',   letter: 'U', word: 'FLUGZEUG',   clue: 'Es fliegt mit vielen Menschen durch die Luft.', level: 3 },
    { masked: 'F_HRRAD',    letter: 'A', word: 'FAHRRAD',    clue: 'Es hat zwei Räder und Pedale.', level: 3 },
    { masked: 'BLEI_TIFT',  letter: 'S', word: 'BLEISTIFT',  clue: 'Damit schreibst du grau und kannst radieren.', level: 3 },
    { masked: 'SCH_RE',     letter: 'E', word: 'SCHERE',     clue: 'Damit schneidest du Papier.', level: 3 },
    { masked: 'TASCH_',     letter: 'E', word: 'TASCHE',     clue: 'Darin trägst du deine Sachen.', level: 3 },
    { masked: 'FENS_ER',    letter: 'T', word: 'FENSTER',    clue: 'Dadurch schaust du aus dem Zimmer hinaus.', level: 3 },
    { masked: 'SP_NNE',     letter: 'I', word: 'SPINNE',     clue: 'Sie hat acht Beine und webt ein Netz.', level: 3 },
    { masked: 'SCHNEC_E',   letter: 'K', word: 'SCHNECKE',   clue: 'Sie ist sehr langsam und trägt ihr Haus mit.', level: 3 },
    { masked: 'EL_FANT',    letter: 'E', word: 'ELEFANT',    clue: 'Das größte Landtier, mit Rüssel.', level: 3 },
    { masked: 'GIR_FFE',    letter: 'A', word: 'GIRAFFE',    clue: 'Sie hat den längsten Hals aller Tiere.', level: 3 },
    { masked: 'PING_IN',    letter: 'U', word: 'PINGUIN',    clue: 'Ein Vogel, der schwimmt, aber nicht fliegt.', level: 3 },
    { masked: 'SCHLANG_',   letter: 'E', word: 'SCHLANGE',   clue: 'Ein Tier ohne Beine, das kriecht.', level: 3 },
    { masked: 'L_HRERIN',   letter: 'E', word: 'LEHRERIN',   clue: 'Sie unterrichtet dich in der Schule.', level: 3 },
    { masked: 'KL_SSE',     letter: 'A', word: 'KLASSE',     clue: 'So heißt deine Gruppe in der Schule.', level: 3 },
    { masked: 'FR_HSTÜCK',  letter: 'Ü', word: 'FRÜHSTÜCK',  clue: 'Das isst du am Morgen.', level: 3 },
    { masked: 'TH_ATER',    letter: 'E', word: 'THEATER',    clue: 'Dort spielen Schauspieler auf einer Bühne.', level: 3 },
    { masked: 'ZI_KUS',     letter: 'R', word: 'ZIRKUS',     clue: 'Dort treten Clowns in einem Zelt auf.', level: 3 },
    { masked: 'B_LLON',     letter: 'A', word: 'BALLON',     clue: 'Er ist bunt, mit Luft gefüllt und schwebt.', level: 3 },
    { masked: 'REGENB_GEN', letter: 'O', word: 'REGENBOGEN', clue: 'Er erscheint bunt nach dem Regen.', level: 3 },
    { masked: 'GEW_TTER',   letter: 'I', word: 'GEWITTER',   clue: 'Dabei blitzt und donnert es.', level: 3 },
    { masked: 'FR_HLING',   letter: 'Ü', word: 'FRÜHLING',   clue: 'Die Jahreszeit, in der alles neu blüht.', level: 3 },
    { masked: 'H_RBST',     letter: 'E', word: 'HERBST',     clue: 'Die Jahreszeit mit bunten Blättern.', level: 3 },
    { masked: 'W_NTER',     letter: 'I', word: 'WINTER',     clue: 'Die kälteste Jahreszeit mit Schnee.', level: 3 },
    { masked: 'M_RCHEN',    letter: 'Ä', word: 'MÄRCHEN',    clue: 'Eine Geschichte, die mit „Es war einmal" beginnt.', level: 3 },
    { masked: 'KR_NKENHAUS',letter: 'A', word: 'KRANKENHAUS',clue: 'Dorthin bringt man jemanden, der schwer krank ist.', level: 3 },
    { masked: 'F_UERWEHR',  letter: 'E', word: 'FEUERWEHR',  clue: 'Sie kommt mit dem roten Auto und löscht Brände.', level: 3 },
    { masked: 'FL_GHAFEN',  letter: 'U', word: 'FLUGHAFEN',  clue: 'Dort starten und landen Flugzeuge.', level: 3 },
    { masked: 'B_HNHOF',    letter: 'A', word: 'BAHNHOF',    clue: 'Dort halten die Züge.', level: 3 },
    { masked: 'BIBL_OTHEK', letter: 'I', word: 'BIBLIOTHEK', clue: 'Dort kannst du Bücher ausleihen.', level: 3 },
    { masked: 'SP_EGEL',    letter: 'I', word: 'SPIEGEL',    clue: 'Darin siehst du dich selbst.', level: 3 },
    { masked: 'SCHL_SSEL',  letter: 'Ü', word: 'SCHLÜSSEL',  clue: 'Damit sperrst du die Tür auf.', level: 3 },
    { masked: 'GESCH_NK',   letter: 'E', word: 'GESCHENK',   clue: 'Das bekommst du eingepackt zum Geburtstag.', level: 3 },
    { masked: 'SCHM_TTERLING', letter: 'E', word: 'SCHMETTERLING', clue: 'Aus einer Raupe wird dieses bunte Tier.', level: 3 },
    { masked: 'SCHNEEM_NN', letter: 'A', word: 'SCHNEEMANN', clue: 'Den baust du im Winter mit einer Karotte als Nase.', level: 3 },
    { masked: 'GEB_RTSTAG', letter: 'U', word: 'GEBURTSTAG', clue: 'Der Tag, an dem du ein Jahr älter wirst.', level: 3 },
  ];

  // ─── Wort bauen (Buchstaben ordnen) ───────────────────────────────────────
  // Jeder Eintrag hat einen Hinweis, damit Anagramme wie RABE/ABER,
  // SAFT/FAST oder LAMPE/PALME eindeutig werden.

  const BUILD_WORDS = [
    // Stufe 1: drei bis vier Buchstaben
    { word: 'HUND',  clue: 'Er bellt.', level: 1 },
    { word: 'BAUM',  clue: 'Er wächst im Wald.', level: 1 },
    { word: 'HAUS',  clue: 'Darin wohnt man.', level: 1 },
    { word: 'BALL',  clue: 'Damit spielst du.', level: 1 },
    { word: 'MOND',  clue: 'Er leuchtet nachts.', level: 1 },
    { word: 'NEST',  clue: 'Darin sitzen Vogeljunge.', level: 1 },
    { word: 'BERG',  clue: 'Er ist sehr hoch.', level: 1 },
    { word: 'MAUS',  clue: 'Ein kleines Tier, das piepst.', level: 1 },
    { word: 'HAND',  clue: 'Sie hat fünf Finger.', level: 1 },
    { word: 'BEIN',  clue: 'Damit gehst du.', level: 1 },
    { word: 'GLAS',  clue: 'Daraus trinkst du.', level: 1 },
    { word: 'HERZ',  clue: 'Es schlägt in der Brust.', level: 1 },
    { word: 'ZELT',  clue: 'Darin schläfst du beim Campen.', level: 1 },
    { word: 'TURM',  clue: 'Ein hohes, schmales Gebäude.', level: 1 },
    { word: 'RING',  clue: 'Er passt an den Finger.', level: 1 },
    { word: 'WALD',  clue: 'Dort stehen viele Bäume.', level: 1 },
    { word: 'MILCH', clue: 'Ein weißes Getränk.', level: 1 },
    { word: 'BUCH',  clue: 'Darin liest du eine Geschichte.', level: 1 },
    { word: 'FISCH', clue: 'Er lebt im Wasser.', level: 1 },
    { word: 'RABE',  clue: 'Ein schwarzer Vogel.', level: 1 },
    { word: 'ESEL',  clue: 'Ein graues Tier, das „I-A" ruft.', level: 1 },
    { word: 'AFFE',  clue: 'Er klettert gern.', level: 1 },
    { word: 'SAFT',  clue: 'Ein Getränk aus Früchten.', level: 1 },
    { word: 'DACH',  clue: 'Es ist oben auf dem Haus.', level: 1 },

    // Stufe 2: fünf bis sechs Buchstaben
    { word: 'KATZE',  clue: 'Sie schnurrt.', level: 2 },
    { word: 'SONNE',  clue: 'Sie scheint am Tag.', level: 2 },
    { word: 'APFEL',  clue: 'Eine Frucht vom Baum.', level: 2 },
    { word: 'VOGEL',  clue: 'Er hat Federn.', level: 2 },
    { word: 'PFERD',  clue: 'Darauf kann man reiten.', level: 2 },
    { word: 'LÖWE',   clue: 'König der Tiere.', level: 2 },
    { word: 'ADLER',  clue: 'Ein großer Greifvogel.', level: 2 },
    { word: 'TAUBE',  clue: 'Ein grauer Vogel in der Stadt.', level: 2 },
    { word: 'WOLKE',  clue: 'Sie schwebt am Himmel.', level: 2 },
    { word: 'BLUME',  clue: 'Sie blüht im Garten.', level: 2 },
    { word: 'SCHAF',  clue: 'Es gibt Wolle.', level: 2 },
    { word: 'FUCHS',  clue: 'Ein rotes Tier mit buschigem Schwanz.', level: 2 },
    { word: 'DACHS',  clue: 'Ein Tier mit schwarz-weißem Kopf, das gräbt.', level: 2 },
    { word: 'TULPE',  clue: 'Eine Frühlingsblume.', level: 2 },
    { word: 'TANNE',  clue: 'Ein Nadelbaum.', level: 2 },
    { word: 'EICHE',  clue: 'Ein Laubbaum mit Eicheln.', level: 2 },
    { word: 'BIRKE',  clue: 'Ein Baum mit weißer Rinde.', level: 2 },
    { word: 'KÜCHE',  clue: 'Dort wird gekocht.', level: 2 },
    { word: 'STUHL',  clue: 'Darauf sitzt du.', level: 2 },
    { word: 'LAMPE',  clue: 'Sie macht Licht im Zimmer.', level: 2 },
    { word: 'JACKE',  clue: 'Die ziehst du bei Kälte an.', level: 2 },
    { word: 'MÜTZE',  clue: 'Die setzt du auf den Kopf.', level: 2 },
    { word: 'KLEID',  clue: 'Ein Kleidungsstück über den Kopf.', level: 2 },
    { word: 'STIFT',  clue: 'Damit malst du.', level: 2 },
    { word: 'PUPPE',  clue: 'Ein Spielzeug, das aussieht wie ein Kind.', level: 2 },
    { word: 'ZUNGE',  clue: 'Damit schmeckst du.', level: 2 },
    { word: 'BIRNE',  clue: 'Eine Frucht, unten dick.', level: 2 },
    { word: 'TOMATE', clue: 'Rotes Gemüse für den Salat.', level: 2 },
    { word: 'GURKE',  clue: 'Langes grünes Gemüse.', level: 2 },
    { word: 'WASSER', clue: 'Das trinkst du bei Durst.', level: 2 },
    { word: 'SCHUH',  clue: 'Der kommt an den Fuß.', level: 2 },
    { word: 'MANTEL', clue: 'Eine lange, warme Jacke.', level: 2 },
    { word: 'SCHERE', clue: 'Damit schneidest du Papier.', level: 2 },
    { word: 'TASCHE', clue: 'Darin trägst du Sachen.', level: 2 },
    { word: 'LINEAL', clue: 'Damit ziehst du gerade Linien.', level: 2 },
    { word: 'GABEL',  clue: 'Damit isst du Nudeln.', level: 2 },
    { word: 'KERZE',  clue: 'Sie brennt mit einer Flamme.', level: 2 },
    { word: 'HONIG',  clue: 'Süß, von der Biene.', level: 2 },
    { word: 'INSEL',  clue: 'Land mitten im Meer.', level: 2 },
    { word: 'KÖNIG',  clue: 'Er trägt eine Krone.', level: 2 },
    { word: 'PIRAT',  clue: 'Ein Seeräuber mit Augenklappe.', level: 2 },
    { word: 'DRACHE', clue: 'Im Märchen speit er Feuer.', level: 2 },
    { word: 'SCHNEE', clue: 'Weiß und kalt im Winter.', level: 2 },

    // Stufe 3: sieben und mehr
    { word: 'SCHULE',   clue: 'Dorthin gehst du zum Lernen.', level: 3 },
    { word: 'SCHIFF',   clue: 'Es fährt über das Meer.', level: 3 },
    { word: 'FAHRRAD',  clue: 'Es hat zwei Räder und Pedale.', level: 3 },
    { word: 'SPINNE',   clue: 'Sie hat acht Beine.', level: 3 },
    { word: 'ELEFANT',  clue: 'Er hat einen Rüssel.', level: 3 },
    { word: 'GIRAFFE',  clue: 'Sie hat einen sehr langen Hals.', level: 3 },
    { word: 'PINGUIN',  clue: 'Ein Vogel, der nicht fliegen kann.', level: 3 },
    { word: 'SCHLANGE', clue: 'Ein Tier ohne Beine.', level: 3 },
    { word: 'KLASSE',   clue: 'Deine Gruppe in der Schule.', level: 3 },
    { word: 'FENSTER',  clue: 'Dadurch schaust du hinaus.', level: 3 },
    { word: 'FRÜHLING', clue: 'Die Jahreszeit nach dem Winter.', level: 3 },
    { word: 'SOMMER',   clue: 'Die wärmste Jahreszeit.', level: 3 },
    { word: 'HERBST',   clue: 'Die Jahreszeit mit bunten Blättern.', level: 3 },
    { word: 'WINTER',   clue: 'Die kälteste Jahreszeit.', level: 3 },
    { word: 'MÄRCHEN',  clue: 'Beginnt mit „Es war einmal".', level: 3 },
    { word: 'BAHNHOF',  clue: 'Dort halten die Züge.', level: 3 },
    { word: 'THEATER',  clue: 'Dort spielen Schauspieler.', level: 3 },
    { word: 'ZIRKUS',   clue: 'Dort treten Clowns auf.', level: 3 },
    { word: 'BALLON',   clue: 'Bunt, mit Luft gefüllt.', level: 3 },
    { word: 'GEWITTER', clue: 'Dabei blitzt und donnert es.', level: 3 },
    { word: 'FLUGHAFEN',clue: 'Dort starten Flugzeuge.', level: 3 },
    { word: 'SCHULTER', clue: 'Zwischen Hals und Arm.', level: 3 },
  ];

  // ─── Wortgruppen ("Was passt dazu?") ──────────────────────────────────────

  const CATEGORY_ITEMS = [
    // Tier
    { w: 'Hund', cat: 'Tier' }, { w: 'Katze', cat: 'Tier' }, { w: 'Maus', cat: 'Tier' },
    { w: 'Vogel', cat: 'Tier' }, { w: 'Fisch', cat: 'Tier' }, { w: 'Pferd', cat: 'Tier' },
    { w: 'Kuh', cat: 'Tier' }, { w: 'Wolf', cat: 'Tier' }, { w: 'Bär', cat: 'Tier' },
    { w: 'Fuchs', cat: 'Tier' }, { w: 'Hase', cat: 'Tier' }, { w: 'Igel', cat: 'Tier' },
    { w: 'Ente', cat: 'Tier' }, { w: 'Huhn', cat: 'Tier' }, { w: 'Schaf', cat: 'Tier' },
    { w: 'Ziege', cat: 'Tier' }, { w: 'Löwe', cat: 'Tier' }, { w: 'Adler', cat: 'Tier' },
    { w: 'Eule', cat: 'Tier' }, { w: 'Frosch', cat: 'Tier' }, { w: 'Biber', cat: 'Tier' },
    { w: 'Biene', cat: 'Tier' }, { w: 'Rabe', cat: 'Tier' },
    // Pflanze
    { w: 'Baum', cat: 'Pflanze' }, { w: 'Rose', cat: 'Pflanze' }, { w: 'Tulpe', cat: 'Pflanze' },
    { w: 'Gras', cat: 'Pflanze' }, { w: 'Busch', cat: 'Pflanze' }, { w: 'Klee', cat: 'Pflanze' },
    { w: 'Tanne', cat: 'Pflanze' }, { w: 'Eiche', cat: 'Pflanze' }, { w: 'Birke', cat: 'Pflanze' },
    { w: 'Blume', cat: 'Pflanze' }, { w: 'Kaktus', cat: 'Pflanze' }, { w: 'Moos', cat: 'Pflanze' },
    { w: 'Farn', cat: 'Pflanze' }, { w: 'Efeu', cat: 'Pflanze' }, { w: 'Sonnenblume', cat: 'Pflanze' },
    { w: 'Nelke', cat: 'Pflanze' }, { w: 'Lilie', cat: 'Pflanze' }, { w: 'Bambus', cat: 'Pflanze' },
    { w: 'Palme', cat: 'Pflanze' }, { w: 'Ahorn', cat: 'Pflanze' }, { w: 'Löwenzahn', cat: 'Pflanze' },
    // Farbe — „Orange" fehlt bewusst: auch eine Frucht.
    { w: 'Rot', cat: 'Farbe' }, { w: 'Blau', cat: 'Farbe' }, { w: 'Grün', cat: 'Farbe' },
    { w: 'Gelb', cat: 'Farbe' }, { w: 'Schwarz', cat: 'Farbe' }, { w: 'Weiß', cat: 'Farbe' },
    { w: 'Braun', cat: 'Farbe' }, { w: 'Lila', cat: 'Farbe' }, { w: 'Pink', cat: 'Farbe' },
    { w: 'Grau', cat: 'Farbe' }, { w: 'Rosa', cat: 'Farbe' }, { w: 'Türkis', cat: 'Farbe' },
    { w: 'Violett', cat: 'Farbe' }, { w: 'Dunkelblau', cat: 'Farbe' }, { w: 'Hellgrün', cat: 'Farbe' },
    // Kleidung
    { w: 'Hemd', cat: 'Kleidung' }, { w: 'Hose', cat: 'Kleidung' }, { w: 'Rock', cat: 'Kleidung' },
    { w: 'Kleid', cat: 'Kleidung' }, { w: 'Mantel', cat: 'Kleidung' }, { w: 'Jacke', cat: 'Kleidung' },
    { w: 'Schuhe', cat: 'Kleidung' }, { w: 'Socken', cat: 'Kleidung' }, { w: 'Mütze', cat: 'Kleidung' },
    { w: 'Schal', cat: 'Kleidung' }, { w: 'Pullover', cat: 'Kleidung' }, { w: 'Bluse', cat: 'Kleidung' },
    { w: 'Handschuh', cat: 'Kleidung' }, { w: 'Gürtel', cat: 'Kleidung' }, { w: 'Stiefel', cat: 'Kleidung' },
    { w: 'Schlafanzug', cat: 'Kleidung' }, { w: 'Weste', cat: 'Kleidung' },
    // Fahrzeug
    { w: 'Auto', cat: 'Fahrzeug' }, { w: 'Bus', cat: 'Fahrzeug' }, { w: 'Zug', cat: 'Fahrzeug' },
    { w: 'Flugzeug', cat: 'Fahrzeug' }, { w: 'Schiff', cat: 'Fahrzeug' }, { w: 'Fahrrad', cat: 'Fahrzeug' },
    { w: 'Motorrad', cat: 'Fahrzeug' }, { w: 'Straßenbahn', cat: 'Fahrzeug' },
    { w: 'Hubschrauber', cat: 'Fahrzeug' }, { w: 'Rakete', cat: 'Fahrzeug' }, { w: 'Boot', cat: 'Fahrzeug' },
    { w: 'Roller', cat: 'Fahrzeug' }, { w: 'Traktor', cat: 'Fahrzeug' }, { w: 'Bagger', cat: 'Fahrzeug' },
    { w: 'Taxi', cat: 'Fahrzeug' }, { w: 'Segelboot', cat: 'Fahrzeug' },
    // Lebensmittel
    { w: 'Brot', cat: 'Lebensmittel' }, { w: 'Milch', cat: 'Lebensmittel' }, { w: 'Apfel', cat: 'Lebensmittel' },
    { w: 'Banane', cat: 'Lebensmittel' }, { w: 'Birne', cat: 'Lebensmittel' }, { w: 'Kirsche', cat: 'Lebensmittel' },
    { w: 'Erdbeere', cat: 'Lebensmittel' }, { w: 'Tomate', cat: 'Lebensmittel' }, { w: 'Gurke', cat: 'Lebensmittel' },
    { w: 'Karotte', cat: 'Lebensmittel' }, { w: 'Salat', cat: 'Lebensmittel' }, { w: 'Käse', cat: 'Lebensmittel' },
    { w: 'Butter', cat: 'Lebensmittel' }, { w: 'Kuchen', cat: 'Lebensmittel' }, { w: 'Keks', cat: 'Lebensmittel' },
    { w: 'Schokolade', cat: 'Lebensmittel' }, { w: 'Joghurt', cat: 'Lebensmittel' }, { w: 'Saft', cat: 'Lebensmittel' },
    { w: 'Suppe', cat: 'Lebensmittel' }, { w: 'Nudeln', cat: 'Lebensmittel' }, { w: 'Reis', cat: 'Lebensmittel' },
    // Körperteil
    { w: 'Kopf', cat: 'Körperteil' }, { w: 'Auge', cat: 'Körperteil' }, { w: 'Ohr', cat: 'Körperteil' },
    { w: 'Nase', cat: 'Körperteil' }, { w: 'Mund', cat: 'Körperteil' }, { w: 'Zahn', cat: 'Körperteil' },
    { w: 'Zunge', cat: 'Körperteil' }, { w: 'Hals', cat: 'Körperteil' }, { w: 'Arm', cat: 'Körperteil' },
    { w: 'Hand', cat: 'Körperteil' }, { w: 'Finger', cat: 'Körperteil' }, { w: 'Bauch', cat: 'Körperteil' },
    { w: 'Rücken', cat: 'Körperteil' }, { w: 'Bein', cat: 'Körperteil' }, { w: 'Knie', cat: 'Körperteil' },
    { w: 'Fuß', cat: 'Körperteil' }, { w: 'Zehe', cat: 'Körperteil' }, { w: 'Schulter', cat: 'Körperteil' },
    { w: 'Ellbogen', cat: 'Körperteil' }, { w: 'Stirn', cat: 'Körperteil' }, { w: 'Wange', cat: 'Körperteil' },
  ];

  const CATEGORIES = ['Tier', 'Pflanze', 'Farbe', 'Kleidung', 'Fahrzeug', 'Lebensmittel', 'Körperteil'];

  const CATEGORY_LABELS = {
    Tier: 'Tieren', Pflanze: 'Pflanzen', Farbe: 'Farben',
    Kleidung: 'Kleidungsstücken', Fahrzeug: 'Fahrzeugen',
    Lebensmittel: 'Lebensmitteln', Körperteil: 'Körperteilen',
  };

  // Überschneidende Gruppen liefern keine falschen Antworten füreinander.
  const CATEGORY_CONFLICTS = {
    Pflanze: ['Lebensmittel'],
    Lebensmittel: ['Pflanze', 'Tier'],
    Tier: ['Lebensmittel'],
  };

  const CATEGORY_HINTS = {
    Tier: 'Ein Tier lebt: Es kann laufen, fliegen oder schwimmen.',
    Pflanze: 'Eine Pflanze wächst in der Erde.',
    Farbe: 'Eine Farbe siehst du mit den Augen, zum Beispiel beim Malen.',
    Kleidung: 'Kleidung ziehst du an.',
    Fahrzeug: 'Mit einem Fahrzeug kannst du fahren oder fliegen.',
    Lebensmittel: 'Ein Lebensmittel kannst du essen oder trinken.',
    Körperteil: 'Ein Körperteil gehört zu deinem Körper.',
  };

  // ─── Gegenteile ───────────────────────────────────────────────────────────

  const OPPOSITE_PAIRS = [
    ['groß', 'klein'], ['lang', 'kurz'], ['hoch', 'tief'],
    ['breit', 'schmal'], ['dick', 'dünn'], ['schwer', 'leicht'],
    ['hart', 'weich'], ['warm', 'kalt'], ['nass', 'trocken'],
    ['hell', 'dunkel'], ['laut', 'leise'], ['schnell', 'langsam'],
    ['voll', 'leer'], ['sauber', 'schmutzig'], ['rund', 'eckig'],
    ['glatt', 'rau'], ['gerade', 'krumm'], ['süß', 'sauer'],
    ['alt', 'jung'], ['arm', 'reich'], ['stark', 'schwach'],
    ['gesund', 'krank'], ['fleißig', 'faul'], ['froh', 'traurig'],
    ['mutig', 'ängstlich'], ['wild', 'zahm'],
    ['oben', 'unten'], ['vorne', 'hinten'], ['links', 'rechts'],
    ['innen', 'außen'], ['nah', 'fern'],
    ['viel', 'wenig'], ['richtig', 'falsch'], ['Anfang', 'Ende'],
    ['früh', 'spät'], ['immer', 'nie'], ['ja', 'nein'],
    ['Tag', 'Nacht'], ['Sommer', 'Winter'],
    ['satt', 'hungrig'], ['müde', 'munter'],
    ['Mann', 'Frau'], ['Bub', 'Mädchen'], ['Riese', 'Zwerg'],
    ['Freund', 'Feind'],
    ['kommen', 'gehen'], ['geben', 'nehmen'], ['suchen', 'finden'],
    ['fragen', 'antworten'], ['lachen', 'weinen'], ['kaufen', 'verkaufen'],
    ['werfen', 'fangen'], ['ziehen', 'schieben'], ['steigen', 'sinken'],
    ['höflich', 'unhöflich'], ['ehrlich', 'unehrlich'],
    ['ordentlich', 'unordentlich'], ['geduldig', 'ungeduldig'],
    ['pünktlich', 'unpünktlich'], ['freundlich', 'unfreundlich'],
    ['vorsichtig', 'unvorsichtig'], ['interessant', 'langweilig'],
  ];

  const OPPOSITE_SIMILAR_GROUPS = [
    ['klein', 'kurz', 'schmal', 'dünn', 'wenig', 'tief', 'unten', 'schwach', 'leise'],
    ['groß', 'lang', 'breit', 'dick', 'viel', 'hoch', 'oben', 'stark', 'laut'],
    ['kalt', 'kühl', 'Winter'],
    ['warm', 'heiß', 'Sommer'],
    ['hell', 'Tag'],
    ['dunkel', 'Nacht'],
    ['froh', 'lachen'],
    ['traurig', 'weinen'],
    ['müde'],
    ['munter'],
    ['Frau', 'Mädchen'],
    ['Mann', 'Bub'],
    ['gehen', 'kommen'],
  ];

  function isTooSimilar(a, b) {
    if (a === b) return true;
    return OPPOSITE_SIMILAR_GROUPS.some(g => g.includes(a) && g.includes(b));
  }

  // ─── Wochentage und Monate (österreichische Form) ─────────────────────────

  const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

  // "Jänner" ist die bevorzugte österreichische Form. "Januar" wird als
  // gültige Variante akzeptiert (siehe AnswerCheck.VARIANTS).
  const MONTHS = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni',
                  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  const SEASONS = [
    { name: 'Frühling', months: ['März', 'April', 'Mai'] },
    { name: 'Sommer',   months: ['Juni', 'Juli', 'August'] },
    { name: 'Herbst',   months: ['September', 'Oktober', 'November'] },
    { name: 'Winter',   months: ['Dezember', 'Jänner', 'Februar'] },
  ];

  return {
    MISSING_LETTER, BUILD_WORDS,
    CATEGORY_ITEMS, CATEGORIES, CATEGORY_LABELS, CATEGORY_CONFLICTS, CATEGORY_HINTS,
    OPPOSITE_PAIRS, OPPOSITE_SIMILAR_GROUPS, isTooSimilar,
    WEEKDAYS, MONTHS, SEASONS,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = WordsData;
