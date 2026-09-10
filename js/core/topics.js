/**
 * core/topics.js
 * Themenkatalog (Lernziele) und Buchzuordnungen.
 *
 * WICHTIG — Regel für Buchzuordnungen:
 *   Hier stehen ausschließlich Seitenangaben, die im Analysebericht
 *   ("Lernwelten – Analyse und Ausbauplan", 09.09.2026) belegt sind.
 *   Es werden KEINE Buchinhalte, Aufgabentexte oder Seitenzahlen erfunden.
 *   Fehlt eine PDF-Seite, steht dort `pdf: null` — nicht geraten.
 *   Alle Aufgaben der App sind eigene Formulierungen zu den Lernzielen,
 *   keine Reproduktion von Buchseiten.
 *
 * Ein Topic ist gleichzeitig Lernziel, Menüeintrag und Fortschritts-Schlüssel.
 * Die `id` ist Teil der gespeicherten Nutzerdaten — niemals umbenennen.
 * Alte Übungs-IDs aus Version 1 werden über `legacyIds` weitergeführt.
 */

const Topics = (() => {

  // ─── Buchreihen ───────────────────────────────────────────────────────────

  const SERIES = {
    zahlenreise2: {
      id: 'zahlenreise2',
      title: 'Zahlenreise 2',
      publisher: 'Veritas',
      subject: 'math',
      volumes: {
        1: 'Erarbeitungsteil 1',
        2: 'Erarbeitungsteil 2',
      },
    },
    flexflora2: {
      id: 'flexflora2',
      title: 'Flex und Flora 2',
      publisher: 'Westermann',
      subject: 'german',
      volumes: {
        sprache:  'Sprache untersuchen',
        schreiben:'Richtig schreiben',
        lesen:    'Lesen',
        texte:    'Texte verfassen',
        training: 'Mein Trainingsheft',
      },
    },
  };

  /** Kurzform für eine Buchreferenz, z.B. "Zahlenreise 2, Teil 1, S. 33". */
  function formatRef(ref) {
    const s = SERIES[ref.series];
    if (!s) return '';
    const volume = s.volumes[ref.volume] || ref.volume;
    const pages = ref.printed ? `S. ${ref.printed}` : '';
    return [s.title, volume, pages].filter(Boolean).join(', ');
  }

  // Hilfsfunktion zum kompakten Notieren der belegten Referenzen.
  function zr(volume, printed, label) {
    return { series: 'zahlenreise2', volume, printed, pdf: null, label };
  }
  function ff(volume, printed, label) {
    return { series: 'flexflora2', volume, printed, pdf: null, label };
  }

  // ─── Lernziele ────────────────────────────────────────────────────────────
  // group  : Überschrift im Menü
  // gen    : Schlüssel des Generators (siehe generators/*)
  // unlock : 'always'  – immer verfügbar
  //          'default' – im Elternbereich standardmäßig freigegeben
  //          'off'     – standardmäßig gesperrt, muss freigegeben werden
  // needs  : Voraussetzungen, nur als Hinweis im Elternbereich

  const TOPICS = [

    // ══ Mathematik, Klasse 1 ═════════════════════════════════════════════
    {
      id: 'g1.numberRecognition', legacyIds: ['numberRecognition'],
      subject: 'math', grade: 1, group: 'Zahlen bis 20',
      title: 'Zahlen erkennen', short: 'Zahlwort → Ziffer', icon: '🔢',
      gen: 'g1NumberRecognition', unlock: 'always',
      goal: 'Zahlwörter bis 20 als Ziffer schreiben.',
    },
    {
      id: 'g1.counting', legacyIds: ['counting'],
      subject: 'math', grade: 1, group: 'Zahlen bis 20',
      title: 'Zählen', short: 'Mengen zählen', icon: '🔵',
      gen: 'g1Counting', unlock: 'always',
      goal: 'Mengen bis 20 sicher abzählen.',
    },
    {
      id: 'g1.addition', legacyIds: ['addition'],
      subject: 'math', grade: 1, group: 'Rechnen bis 20',
      title: 'Plusrechnen', short: 'Plus bis 20', icon: '➕',
      gen: 'g1Addition', unlock: 'always',
      goal: 'Additionen im Zahlenraum bis 20 lösen.',
    },
    {
      id: 'g1.subtraction', legacyIds: ['subtraction'],
      subject: 'math', grade: 1, group: 'Rechnen bis 20',
      title: 'Minusrechnen', short: 'Minus bis 20', icon: '➖',
      gen: 'g1Subtraction', unlock: 'always',
      goal: 'Subtraktionen im Zahlenraum bis 20 lösen.',
    },

    // ══ Mathematik, Klasse 2 — Zahlenraum ════════════════════════════════
    {
      id: 'm2.stellenwert',
      subject: 'math', grade: 2, group: 'Zahlenraum bis 100',
      title: 'Zehner und Einer', short: 'Zahlen zerlegen', icon: '🔟',
      gen: 'stellenwert', unlock: 'default',
      goal: 'Zweistellige Zahlen in Zehner und Einer zerlegen.',
      book: [zr(1, '33', 'Bündeln'), zr(1, '45–48', 'Stellenwert und Orientierung')],
    },
    {
      id: 'm2.buendeln',
      subject: 'math', grade: 2, group: 'Zahlenraum bis 100',
      title: 'Bündeln', short: 'Zehnerstangen legen', icon: '🧱',
      gen: 'buendeln', unlock: 'default',
      goal: 'Mengen in Zehner bündeln und die Zahl bestimmen.',
      book: [zr(1, '33', 'Bündeln')],
    },
    {
      id: 'm2.hunderterfeld',
      subject: 'math', grade: 2, group: 'Zahlenraum bis 100',
      title: 'Hunderterfeld', short: 'Zahl im Feld finden', icon: '🔳',
      gen: 'hunderterfeld', unlock: 'default',
      goal: 'Sich im Hunderterfeld orientieren.',
      book: [zr(1, '45–48', 'Orientierung im Zahlenraum bis 100')],
    },
    {
      id: 'm2.zahlenstrahl',
      subject: 'math', grade: 2, group: 'Zahlenraum bis 100',
      title: 'Zahlenstrahl', short: 'Zahl ablesen', icon: '📏',
      gen: 'zahlenstrahl', unlock: 'default',
      goal: 'Zahlen am Zahlenstrahl ablesen und einordnen.',
      book: [zr(1, '45–48', 'Orientierung im Zahlenraum bis 100')],
    },
    {
      id: 'm2.vergleichen',
      subject: 'math', grade: 2, group: 'Zahlenraum bis 100',
      title: 'Größer oder kleiner?', short: 'Zahlen vergleichen', icon: '⚖️',
      gen: 'vergleichen', unlock: 'default',
      goal: 'Zahlen bis 100 vergleichen und ordnen.',
      book: [zr(1, '45–48', 'Orientierung im Zahlenraum bis 100')],
    },
    {
      id: 'm2.nachbarzahlen',
      subject: 'math', grade: 2, group: 'Zahlenraum bis 100',
      title: 'Nachbarzahlen', short: 'Vorgänger und Nachfolger', icon: '↔️',
      gen: 'nachbarzahlen', unlock: 'default',
      goal: 'Vorgänger, Nachfolger und Nachbarzehner nennen.',
      book: [zr(1, '45–48', 'Orientierung im Zahlenraum bis 100')],
    },
    {
      id: 'm2.geradeUngerade',
      subject: 'math', grade: 2, group: 'Zahlenraum bis 100',
      title: 'Gerade oder ungerade?', short: 'Zahlen unterscheiden', icon: '🔀',
      gen: 'geradeUngerade', unlock: 'default',
      goal: 'Gerade und ungerade Zahlen unterscheiden.',
    },

    // ══ Mathematik, Klasse 2 — Plus und Minus ════════════════════════════
    {
      id: 'm2.addZehner',
      subject: 'math', grade: 2, group: 'Plus und Minus bis 100',
      title: 'Plus mit Zehnern', short: '34 + 20', icon: '➕',
      gen: 'addZehner', unlock: 'default',
      goal: 'Volle Zehner addieren, ohne Zehnerübergang.',
      book: [zr(1, '72–76', 'Plus/Minus ohne Zehnerübergang')],
    },
    {
      id: 'm2.addOhneUebergang', legacyIds: ['additionRound100'],
      subject: 'math', grade: 2, group: 'Plus und Minus bis 100',
      title: 'Plus ohne Übergang', short: '34 + 5, 34 + 23', icon: '➕',
      gen: 'addOhneUebergang', unlock: 'default',
      goal: 'Addieren bis 100 ohne Zehnerübergang.',
      book: [zr(1, '72–76', 'Plus/Minus ohne Zehnerübergang'), zr(2, '135–143', 'Rechnen bis 100')],
    },
    {
      id: 'm2.addMitUebergang',
      subject: 'math', grade: 2, group: 'Plus und Minus bis 100',
      title: 'Plus mit Übergang', short: '38 + 7', icon: '🪜',
      gen: 'addMitUebergang', unlock: 'off',
      goal: 'Addieren mit Zehnerübergang, schrittweise über den Zehner.',
      needs: ['m2.ergaenzenZehner'],
      book: [zr(2, '135–143', 'Rechnen bis 100'), zr(2, '166–171', 'Rechnen bis 100')],
    },
    {
      id: 'm2.subZehner',
      subject: 'math', grade: 2, group: 'Plus und Minus bis 100',
      title: 'Minus mit Zehnern', short: '67 − 30', icon: '➖',
      gen: 'subZehner', unlock: 'default',
      goal: 'Volle Zehner subtrahieren, ohne Zehnerunterschreitung.',
      book: [zr(1, '72–76', 'Plus/Minus ohne Zehnerübergang')],
    },
    {
      id: 'm2.subOhneUebergang', legacyIds: ['subtractionRound100'],
      subject: 'math', grade: 2, group: 'Plus und Minus bis 100',
      title: 'Minus ohne Übergang', short: '67 − 4, 67 − 23', icon: '➖',
      gen: 'subOhneUebergang', unlock: 'default',
      goal: 'Subtrahieren bis 100 ohne Zehnerunterschreitung.',
      book: [zr(1, '72–76', 'Plus/Minus ohne Zehnerübergang'), zr(2, '135–143', 'Rechnen bis 100')],
    },
    {
      id: 'm2.subMitUebergang',
      subject: 'math', grade: 2, group: 'Plus und Minus bis 100',
      title: 'Minus mit Übergang', short: '52 − 6', icon: '🪜',
      gen: 'subMitUebergang', unlock: 'off',
      goal: 'Subtrahieren mit Zehnerunterschreitung, schrittweise.',
      book: [zr(2, '166–171', 'Rechnen bis 100')],
    },
    {
      id: 'm2.ergaenzenZehner',
      subject: 'math', grade: 2, group: 'Plus und Minus bis 100',
      title: 'Ergänzen zum Zehner', short: '37 + □ = 40', icon: '🎯',
      gen: 'ergaenzenZehner', unlock: 'default',
      goal: 'Zum nächsten Zehner ergänzen.',
      book: [zr(2, '112–114', 'Ergänzen auf 100')],
    },
    {
      id: 'm2.ergaenzenHundert',
      subject: 'math', grade: 2, group: 'Plus und Minus bis 100',
      title: 'Ergänzen auf 100', short: '37 + □ = 100', icon: '💯',
      gen: 'ergaenzenHundert', unlock: 'off',
      goal: 'Auf 100 ergänzen, schrittweise über den Zehner.',
      needs: ['m2.ergaenzenZehner'],
      book: [zr(2, '112–114', 'Ergänzen auf 100')],
    },
    {
      id: 'm2.umkehrPlusMinus',
      subject: 'math', grade: 2, group: 'Plus und Minus bis 100',
      title: 'Umkehraufgaben', short: '□ + 8 = 25', icon: '🔁',
      gen: 'umkehrPlusMinus', unlock: 'default',
      goal: 'Fehlende Zahl in einer Plus- oder Minusaufgabe finden.',
      book: [zr(2, '186–190', 'Rechenwege')],
    },
    {
      id: 'm2.rechenmauer',
      subject: 'math', grade: 2, group: 'Plus und Minus bis 100',
      title: 'Rechenmauer', short: 'Steine ausrechnen', icon: '🧱',
      gen: 'rechenmauer', unlock: 'default',
      goal: 'Rechenmauern mit zwei und drei Reihen lösen.',
      book: [zr(1, '21', 'Mathe-Check 1: Rechenmauern')],
    },
    {
      id: 'm2.rechenweg',
      subject: 'math', grade: 2, group: 'Plus und Minus bis 100',
      title: 'Rechenweg prüfen', short: 'Fehler finden', icon: '🔍',
      gen: 'rechenweg', unlock: 'off',
      goal: 'Einen vorgegebenen Rechenweg nachvollziehen und Fehler finden.',
      book: [zr(2, '186–190', 'Rechenwege')],
    },
    {
      id: 'm2.doubleHalf', legacyIds: ['doubleHalf'],
      subject: 'math', grade: 2, group: 'Plus und Minus bis 100',
      title: 'Verdoppeln & Halbieren', short: 'Das Doppelte, die Hälfte', icon: '✌️',
      gen: 'doubleHalf', unlock: 'default',
      goal: 'Verdoppeln und Halbieren im Zahlenraum bis 100.',
      book: [zr(2, '165', 'Mathe-Check 8: Verdoppeln/Halbieren')],
    },
    {
      id: 'm2.numberSeries', legacyIds: ['numberSeries'],
      subject: 'math', grade: 2, group: 'Plus und Minus bis 100',
      title: 'Zahlenreihen', short: 'Wie geht es weiter?', icon: '📈',
      gen: 'numberSeries', unlock: 'default',
      goal: 'Zahlenreihen in Schritten fortsetzen.',
    },

    // ══ Mathematik, Klasse 2 — Malnehmen und Teilen ══════════════════════
    {
      id: 'm2.malGruppen',
      subject: 'math', grade: 2, group: 'Malnehmen und Teilen',
      title: 'Gleich große Gruppen', short: '4 Teller mit je 3', icon: '🍎',
      gen: 'malGruppen', unlock: 'default',
      goal: 'Gleich große Gruppen zählen und als Malaufgabe schreiben.',
      book: [zr(1, '27–29', 'Malnehmen')],
    },
    {
      id: 'm2.punktefeld',
      subject: 'math', grade: 2, group: 'Malnehmen und Teilen',
      title: 'Punktefeld', short: 'Reihen und Spalten', icon: '⬛',
      gen: 'punktefeld', unlock: 'default',
      goal: 'Ein Punktefeld als Malaufgabe beschreiben.',
      book: [zr(1, '27–29', 'Malnehmen')],
    },
    {
      id: 'm2.reihe2', subject: 'math', grade: 2, group: 'Malreihen',
      title: '2er-Reihe', short: '2 · 7 = ?', icon: '2️⃣',
      gen: 'malReihe', genArgs: { row: 2 }, unlock: 'default',
      goal: 'Die 2er-Reihe sicher können.',
      book: [zr(1, '27–29', 'Reihen 2, 10, 5, 1, 0, 4')],
    },
    {
      id: 'm2.reihe10', subject: 'math', grade: 2, group: 'Malreihen',
      title: '10er-Reihe', short: '10 · 6 = ?', icon: '🔟',
      gen: 'malReihe', genArgs: { row: 10 }, unlock: 'default',
      goal: 'Die 10er-Reihe sicher können.',
      book: [zr(1, '27–29', 'Reihen 2, 10, 5, 1, 0, 4')],
    },
    {
      id: 'm2.reihe5', subject: 'math', grade: 2, group: 'Malreihen',
      title: '5er-Reihe', short: '5 · 8 = ?', icon: '5️⃣',
      gen: 'malReihe', genArgs: { row: 5 }, unlock: 'default',
      goal: 'Die 5er-Reihe sicher können.',
      book: [zr(1, '27–29', 'Reihen 2, 10, 5, 1, 0, 4')],
    },
    {
      id: 'm2.reihe4', subject: 'math', grade: 2, group: 'Malreihen',
      title: '4er-Reihe', short: '4 · 7 = ?', icon: '4️⃣',
      gen: 'malReihe', genArgs: { row: 4 }, unlock: 'off',
      goal: 'Die 4er-Reihe sicher können.',
      book: [zr(1, '27–29', 'Reihen 2, 10, 5, 1, 0, 4')],
    },
    {
      id: 'm2.reihe3', subject: 'math', grade: 2, group: 'Malreihen',
      title: '3er-Reihe', short: '3 · 6 = ?', icon: '3️⃣',
      gen: 'malReihe', genArgs: { row: 3 }, unlock: 'off',
      goal: 'Die 3er-Reihe sicher können.',
      book: [zr(2, '116', 'Mathe-Check 5 / Reihen 3, 6, 8, 9, 7')],
    },
    {
      id: 'm2.reihe6', subject: 'math', grade: 2, group: 'Malreihen',
      title: '6er-Reihe', short: '6 · 4 = ?', icon: '6️⃣',
      gen: 'malReihe', genArgs: { row: 6 }, unlock: 'off',
      goal: 'Die 6er-Reihe sicher können.',
      book: [zr(2, '165', 'Mathe-Check 8: 6er-/8er-Reihe')],
    },
    {
      id: 'm2.reihe7', subject: 'math', grade: 2, group: 'Malreihen',
      title: '7er-Reihe', short: '7 · 4 = ?', icon: '7️⃣',
      gen: 'malReihe', genArgs: { row: 7 }, unlock: 'off',
      goal: 'Die 7er-Reihe sicher können.',
      book: [zr(2, '116', 'Reihen 3, 6, 8, 9, 7')],
    },
    {
      id: 'm2.reihe8', subject: 'math', grade: 2, group: 'Malreihen',
      title: '8er-Reihe', short: '8 · 3 = ?', icon: '8️⃣',
      gen: 'malReihe', genArgs: { row: 8 }, unlock: 'off',
      goal: 'Die 8er-Reihe sicher können.',
      book: [zr(2, '165', 'Mathe-Check 8: 6er-/8er-Reihe')],
    },
    {
      id: 'm2.reihe9', subject: 'math', grade: 2, group: 'Malreihen',
      title: '9er-Reihe', short: '9 · 3 = ?', icon: '9️⃣',
      gen: 'malReihe', genArgs: { row: 9 }, unlock: 'off',
      goal: 'Die 9er-Reihe sicher können.',
      book: [zr(2, '116', 'Reihen 3, 6, 8, 9, 7')],
    },
    {
      id: 'm2.malTausch',
      subject: 'math', grade: 2, group: 'Malnehmen und Teilen',
      title: 'Tauschaufgaben', short: '3 · 4 = 4 · 3', icon: '🔄',
      gen: 'malTausch', unlock: 'default',
      goal: 'Tauschaufgaben erkennen und nutzen.',
      book: [zr(1, '84', 'Mathe-Check 4: Tauschaufgaben')],
    },
    {
      id: 'm2.malNachbar',
      subject: 'math', grade: 2, group: 'Malnehmen und Teilen',
      title: 'Nachbaraufgaben', short: 'Von 5 · 6 zu 6 · 6', icon: '👣',
      gen: 'malNachbar', unlock: 'off',
      goal: 'Aus einer bekannten Malaufgabe die Nachbaraufgabe ableiten.',
      book: [zr(2, '116', 'Mathe-Check 5: Schlüssel-/Nachbaraufgaben')],
    },
    {
      id: 'm2.teilenVerteilen',
      subject: 'math', grade: 2, group: 'Malnehmen und Teilen',
      title: 'Verteilen', short: '12 auf 3 Teller', icon: '🍽️',
      gen: 'teilenVerteilen', unlock: 'default',
      goal: 'Eine Menge gerecht auf Gruppen verteilen.',
      book: [zr(1, '79–90', 'Verteilen und Teilen'), zr(2, '123–125', 'Teilen')],
    },
    {
      id: 'm2.teilenGruppen',
      subject: 'math', grade: 2, group: 'Malnehmen und Teilen',
      title: 'Gruppen bilden', short: 'Wie viele Gruppen zu 3?', icon: '👥',
      gen: 'teilenGruppen', unlock: 'default',
      goal: 'Aus einer Menge gleich große Gruppen bilden.',
      book: [zr(1, '79–90', 'Verteilen und Teilen'), zr(2, '123–125', 'Teilen')],
    },
    {
      id: 'm2.malUmkehr',
      subject: 'math', grade: 2, group: 'Malnehmen und Teilen',
      title: 'Umkehrung Mal/Geteilt', short: '4 · □ = 20', icon: '↩️',
      gen: 'malUmkehr', unlock: 'off',
      goal: 'Malnehmen und Teilen als Umkehrung nutzen.',
      book: [zr(2, '123–125', 'Teilen')],
    },

    // ══ Mathematik, Klasse 2 — Größen ════════════════════════════════════
    {
      id: 'm2.geldMuenzen', legacyIds: ['euroCent'],
      subject: 'math', grade: 2, group: 'Geld, Uhr und Größen',
      title: 'Münzen legen', short: 'Wie viel ist das?', icon: '🪙',
      gen: 'geldMuenzen', unlock: 'default',
      goal: 'Münzen und Scheine zusammenzählen.',
      book: [zr(2, '117–119', 'Geld')],
    },
    {
      id: 'm2.geldUmwandeln',
      subject: 'math', grade: 2, group: 'Geld, Uhr und Größen',
      title: 'Euro und Cent', short: '1 € = 100 Cent', icon: '💶',
      gen: 'geldUmwandeln', unlock: 'default',
      goal: 'Zwischen Euro und Cent umrechnen.',
      book: [zr(2, '117–119', 'Geld')],
    },
    {
      id: 'm2.geldRueckgeld',
      subject: 'math', grade: 2, group: 'Geld, Uhr und Größen',
      title: 'Rückgeld', short: 'Wie viel bekommst du zurück?', icon: '🧾',
      gen: 'geldRueckgeld', unlock: 'default',
      goal: 'Rückgeld berechnen.',
      book: [zr(2, '117–119', 'Geld'), zr(1, '21', 'Mathe-Check 1: Rückgeld')],
    },
    {
      id: 'm2.uhrVolleHalbe', legacyIds: ['clockReading'],
      subject: 'math', grade: 2, group: 'Geld, Uhr und Größen',
      title: 'Uhr: volle und halbe Stunden', short: '3 Uhr, halb 4', icon: '🕐',
      gen: 'uhrVolleHalbe', unlock: 'default',
      goal: 'Volle und halbe Stunden ablesen.',
      book: [zr(2, '126–132', 'Kalender und Uhr')],
    },
    {
      id: 'm2.uhrViertel',
      subject: 'math', grade: 2, group: 'Geld, Uhr und Größen',
      title: 'Uhr: Viertelstunden', short: 'Viertel nach, Viertel vor', icon: '🕒',
      gen: 'uhrViertel', unlock: 'off',
      goal: 'Viertelstunden ablesen und benennen.',
      book: [zr(2, '126–132', 'Kalender und Uhr')],
    },
    {
      id: 'm2.kalender',
      subject: 'math', grade: 2, group: 'Geld, Uhr und Größen',
      title: 'Kalender', short: 'Monate, Wochen, Tage', icon: '📅',
      gen: 'kalender', unlock: 'default',
      goal: 'Sich im Kalender zurechtfinden.',
      book: [zr(2, '126–132', 'Kalender und Uhr')],
    },
    {
      id: 'm2.laengen',
      subject: 'math', grade: 2, group: 'Geld, Uhr und Größen',
      title: 'Längen: cm, dm, m', short: '1 m = 100 cm', icon: '📐',
      gen: 'laengen', unlock: 'off',
      goal: 'Längen vergleichen, umwandeln und schätzen.',
      book: [zr(1, '61–66', 'Längen')],
    },
    {
      id: 'm2.gewichte',
      subject: 'math', grade: 2, group: 'Geld, Uhr und Größen',
      title: 'Gewichte: dag und kg', short: '1 kg = 100 dag', icon: '⚖️',
      gen: 'gewichte', unlock: 'off',
      goal: 'Gewichte vergleichen, umwandeln und schätzen.',
      book: [zr(2, '144–147', 'Gewicht')],
    },
    {
      id: 'm2.sachaufgaben', legacyIds: ['wordProblems'],
      subject: 'math', grade: 2, group: 'Geld, Uhr und Größen',
      title: 'Sachaufgaben', short: 'Kurze Rechengeschichten', icon: '📝',
      gen: 'sachaufgaben', unlock: 'default',
      goal: 'Kurze Sachaufgaben lesen und lösen.',
      book: [zr(2, '150', 'Mathe-Check 7: Sachrechnen')],
    },

    // ══ Mathematik, Klasse 2 — Geometrie ═════════════════════════════════
    {
      id: 'm2.flaechenKoerper',
      subject: 'math', grade: 2, group: 'Formen und Daten',
      title: 'Flächen und Körper', short: 'Würfel, Kugel, Quadrat', icon: '🧊',
      gen: 'flaechenKoerper', unlock: 'default',
      goal: 'Flächen und Körper unterscheiden und benennen.',
      book: [zr(1, '51–59', 'Geometrie')],
    },
    {
      id: 'm2.symmetrie',
      subject: 'math', grade: 2, group: 'Formen und Daten',
      title: 'Spiegeln', short: 'Spiegelbild ergänzen', icon: '🪞',
      gen: 'symmetrie', unlock: 'default',
      goal: 'Ein Spiegelbild an einer Achse ergänzen.',
      book: [zr(2, '181', 'Symmetrie')],
    },
    {
      id: 'm2.diagramm',
      subject: 'math', grade: 2, group: 'Formen und Daten',
      title: 'Diagramm lesen', short: 'Säulen und Tabellen', icon: '📊',
      gen: 'diagramm', unlock: 'default',
      goal: 'Einfache Säulendiagramme und Tabellen lesen.',
      book: [zr(1, '77–78', 'Diagramme'), zr(1, '84', 'Mathe-Check 4: Diagramm lesen')],
    },

    // ══ Mathematik — Zusatz, standardmäßig aus ═══════════════════════════
    {
      id: 'm2.zr1000',
      subject: 'math', grade: 2, group: 'Später: Zahlen bis 1.000',
      title: 'Zahlen bis 1.000', short: 'Stellenwert H–Z–E', icon: '🔢',
      gen: 'zr1000', unlock: 'off', advanced: true,
      goal: 'Erste Orientierung im Zahlenraum bis 1.000.',
      book: [zr(2, '191–195', 'Orientierung bis 1.000')],
    },

    // ══ Deutsch, Klasse 1 ════════════════════════════════════════════════
    {
      id: 'g1.missingLetter', legacyIds: ['missingLetter'],
      subject: 'german', grade: 1, group: 'Wörter',
      title: 'Welcher Buchstabe?', short: 'Lücke füllen', icon: '🔤',
      gen: 'missingLetter', unlock: 'always',
      goal: 'Fehlende Buchstaben in bekannten Wörtern ergänzen.',
    },
    {
      id: 'g1.sortLetters', legacyIds: ['sortLetters'],
      subject: 'german', grade: 1, group: 'Wörter',
      title: 'Wort bauen', short: 'Buchstaben ordnen', icon: '🔀',
      gen: 'sortLetters', unlock: 'always',
      goal: 'Aus vorgegebenen Buchstaben ein Wort bilden.',
    },
    {
      id: 'g1.wordCategory', legacyIds: ['wordCategory'],
      subject: 'german', grade: 1, group: 'Wörter',
      title: 'Was passt dazu?', short: 'Wortgruppen', icon: '🏷️',
      gen: 'wordCategory', unlock: 'always',
      goal: 'Wörter einer Gruppe zuordnen.',
    },
    {
      id: 'g1.opposites', legacyIds: ['opposites'],
      subject: 'german', grade: 1, group: 'Wörter',
      title: 'Gegenteile', short: 'groß – klein', icon: '↔️',
      gen: 'opposites', unlock: 'always',
      goal: 'Das Gegenteil eines Wortes finden.',
    },

    // ══ Deutsch, Klasse 2 — Sprache untersuchen ══════════════════════════
    {
      id: 'd2.abc',
      subject: 'german', grade: 2, group: 'ABC und Wörter',
      title: 'ABC ordnen', short: 'Wörter alphabetisch', icon: '🔡',
      gen: 'abcOrdnen', unlock: 'default',
      goal: 'Wörter nach dem ABC ordnen.',
      book: [ff('sprache', '4–9', 'ABC und alphabetisches Ordnen'),
              ff('training', '5–8', 'Wiederholung ABC')],
    },
    {
      id: 'd2.abcNachbarn',
      subject: 'german', grade: 2, group: 'ABC und Wörter',
      title: 'Buchstaben-Nachbarn', short: 'Was kommt nach M?', icon: '🔠',
      gen: 'abcNachbarn', unlock: 'default',
      goal: 'Die Reihenfolge im ABC sicher kennen.',
      book: [ff('sprache', '4–9', 'ABC und alphabetisches Ordnen')],
    },
    {
      id: 'd2.namenwortErkennen',
      subject: 'german', grade: 2, group: 'Wortarten',
      title: 'Namenwörter finden', short: 'Welches Wort ist ein Namenwort?', icon: '🏷️',
      gen: 'namenwortErkennen', unlock: 'default',
      goal: 'Namenwörter im Satz erkennen.',
      book: [ff('sprache', '16–25', 'Namenwörter'), ff('training', '5–8', 'Namenwörter')],
    },
    {
      id: 'd2.begleiter',
      subject: 'german', grade: 2, group: 'Wortarten',
      title: 'der, die oder das?', short: 'Begleiter wählen', icon: '📎',
      gen: 'begleiter', unlock: 'default',
      goal: 'Den passenden Begleiter zu einem Namenwort wählen.',
      book: [ff('sprache', '16–25', 'Begleiter')],
    },
    {
      id: 'd2.mehrzahl',
      subject: 'german', grade: 2, group: 'Wortarten',
      title: 'Einzahl und Mehrzahl', short: 'ein Hund – viele …', icon: '👥',
      gen: 'mehrzahl', unlock: 'default',
      goal: 'Die Mehrzahl bekannter Namenwörter bilden.',
      book: [ff('sprache', '16–25', 'Einzahl/Mehrzahl'), ff('training', '5–8', 'Einzahl und Mehrzahl')],
    },
    {
      id: 'd2.zusammengesetzt',
      subject: 'german', grade: 2, group: 'Wortarten',
      title: 'Zusammengesetzte Wörter', short: 'Haus + Tür', icon: '🧩',
      gen: 'zusammengesetzt', unlock: 'default',
      goal: 'Zusammengesetzte Namenwörter bilden und zerlegen.',
      book: [ff('sprache', '16–25', 'Zusammengesetzte Wörter')],
    },
    {
      id: 'd2.zeitwort',
      subject: 'german', grade: 2, group: 'Wortarten',
      title: 'Zeitwörter finden', short: 'Was tut jemand?', icon: '🏃',
      gen: 'zeitwortErkennen', unlock: 'default',
      goal: 'Zeitwörter im Satz erkennen.',
      book: [ff('sprache', '38–55', 'Zeitwörter')],
    },
    {
      id: 'd2.zeitwortBeugen',
      subject: 'german', grade: 2, group: 'Wortarten',
      title: 'Ich spiele – du …', short: 'Zeitwörter beugen', icon: '🗣️',
      gen: 'zeitwortBeugen', unlock: 'default',
      goal: 'Zeitwörter an die Person anpassen.',
      book: [ff('sprache', '38–55', 'Zeitwörter')],
    },
    {
      id: 'd2.eigenschaftswort',
      subject: 'german', grade: 2, group: 'Wortarten',
      title: 'Eigenschaftswörter', short: 'Wie ist etwas?', icon: '🎨',
      gen: 'eigenschaftswort', unlock: 'default',
      goal: 'Eigenschaftswörter erkennen und passend wählen.',
      book: [ff('sprache', '38–55', 'Eigenschaftswörter')],
    },

    // ══ Deutsch, Klasse 2 — Sätze ════════════════════════════════════════
    {
      id: 'd2.satzzeichen',
      subject: 'german', grade: 2, group: 'Sätze',
      title: 'Satzzeichen', short: 'Punkt, Frage- oder Rufzeichen', icon: '❓',
      gen: 'satzzeichen', unlock: 'default',
      goal: 'Das passende Satzzeichen setzen.',
      book: [ff('sprache', '28–35', 'Satzzeichen')],
    },
    {
      id: 'd2.satzanfang',
      subject: 'german', grade: 2, group: 'Sätze',
      title: 'Satzanfang groß', short: 'Großschreibung am Satzanfang', icon: '🔺',
      gen: 'satzanfang', unlock: 'default',
      goal: 'Satzanfänge großschreiben.',
      book: [ff('sprache', '28–35', 'Satzanfänge')],
    },
    {
      id: 'd2.satzbau',
      subject: 'german', grade: 2, group: 'Sätze',
      title: 'Satz bauen', short: 'Wortkarten ordnen', icon: '🧱',
      gen: 'satzbau', unlock: 'default',
      goal: 'Aus vorgegebenen Satzteilen einen sinnvollen Satz bauen.',
      book: [ff('sprache', '58–63', 'Satzbau und Satzglieder')],
    },

    // ══ Deutsch, Klasse 2 — Richtig schreiben ════════════════════════════
    {
      id: 'd2.silben',
      subject: 'german', grade: 2, group: 'Richtig schreiben',
      title: 'Silben', short: 'Na|se', icon: '🎵',
      gen: 'silben', unlock: 'default',
      goal: 'Wörter in Silben gliedern.',
      book: [ff('schreiben', '16–42', 'Silben')],
    },
    {
      id: 'd2.stsp',
      subject: 'german', grade: 2, group: 'Richtig schreiben',
      title: 'St und Sp', short: 'Stern, Spiel', icon: '⭐',
      gen: 'stsp', unlock: 'default',
      goal: 'Wörter mit St und Sp richtig schreiben.',
      book: [ff('schreiben', '16–42', 'St/Sp')],
    },
    {
      id: 'd2.umlaute',
      subject: 'german', grade: 2, group: 'Richtig schreiben',
      title: 'Umlaute ableiten', short: 'Baum → Bäume', icon: '🌳',
      gen: 'umlaute', unlock: 'default',
      goal: 'ä und äu aus dem Grundwort ableiten.',
      book: [ff('schreiben', '16–42', 'Umlaute')],
    },
    {
      id: 'd2.ie',
      subject: 'german', grade: 2, group: 'Richtig schreiben',
      title: 'Langes i: ie', short: 'Wiese, Biene', icon: '🐝',
      gen: 'langesIe', unlock: 'default',
      goal: 'Wörter mit langem i richtig schreiben.',
      book: [ff('schreiben', '16–42', 'Langes i mit ie')],
    },
    {
      id: 'd2.doppelmitlaut',
      subject: 'german', grade: 2, group: 'Richtig schreiben',
      title: 'Doppelte Mitlaute', short: 'Sonne, Katze', icon: '👯',
      gen: 'doppelmitlaut', unlock: 'default',
      goal: 'Doppelte Mitlaute nach kurzem Selbstlaut schreiben.',
      book: [ff('schreiben', '43–49', 'Doppelte Mitlaute')],
    },
    {
      id: 'd2.verlaengern',
      subject: 'german', grade: 2, group: 'Richtig schreiben',
      title: 'Verlängern', short: 'Hun_ – Hunde', icon: '🔎',
      gen: 'verlaengern', unlock: 'default',
      goal: 'Den letzten Laut durch Verlängern bestimmen.',
      book: [ff('schreiben', '16–42', 'Verlängern')],
    },
    {
      id: 'd2.fehlerFinden',
      subject: 'german', grade: 2, group: 'Richtig schreiben',
      title: 'Fehler verbessern', short: 'Markierte Stelle korrigieren', icon: '✏️',
      gen: 'fehlerFinden', unlock: 'default',
      goal: 'Einen markierten Rechtschreibfehler verbessern.',
      book: [ff('schreiben', '43–49', 'Fehler finden')],
    },
    {
      id: 'd2.merkwoerter',
      subject: 'german', grade: 2, group: 'Richtig schreiben',
      title: 'Merkwörter', short: 'Ansehen – verdecken – schreiben', icon: '🧠',
      gen: 'merkwoerter', unlock: 'default',
      goal: 'Merkwörter einprägen und richtig schreiben.',
      book: [ff('schreiben', '8–15', 'Abschreiben und Wörter merken')],
    },
    {
      id: 'd2.lernwoerter',
      subject: 'german', grade: 2, group: 'Richtig schreiben',
      title: 'Meine Lernwörter', short: 'Wörter dieser Woche', icon: '📒',
      gen: 'lernwoerter', unlock: 'default', needsLearnWords: true,
      goal: 'Die persönlichen Lernwörter der Woche üben.',
      book: [ff('schreiben', '8–15', 'Abschreiben und Wörter merken')],
    },

    // ══ Deutsch, Klasse 2 — Lesen ════════════════════════════════════════
    {
      id: 'd2.leseAnweisung',
      subject: 'german', grade: 2, group: 'Lesen',
      title: 'Genau lesen', short: 'Anweisung ausführen', icon: '👆',
      gen: 'leseAnweisung', unlock: 'default',
      goal: 'Eine kurze Leseanweisung genau ausführen.',
      book: [ff('lesen', '4–17', 'Genau lesen und nach Anweisung handeln')],
    },
    {
      id: 'd2.bildSatz',
      subject: 'german', grade: 2, group: 'Lesen',
      title: 'Bild und Satz', short: 'Passt der Satz?', icon: '🖼️',
      gen: 'bildSatz', unlock: 'default',
      goal: 'Satz und Bild vergleichen.',
      book: [ff('lesen', '4–17', 'Bild und Satz abgleichen')],
    },
    {
      id: 'd2.tabelle',
      subject: 'german', grade: 2, group: 'Lesen',
      title: 'Tabelle lesen', short: 'Zahl aus der Tabelle', icon: '📋',
      gen: 'tabelleLesen', unlock: 'default',
      goal: 'Informationen aus einer einfachen Tabelle entnehmen.',
      book: [ff('lesen', '36–47', 'Tabellen, Diagramme und Sachtexte')],
    },
    {
      id: 'd2.sachtext',
      subject: 'german', grade: 2, group: 'Lesen',
      title: 'Kurzer Sachtext', short: 'Frage zum Text', icon: '📄',
      gen: 'sachtext', unlock: 'default',
      goal: 'Einen kurzen Sachtext verstehen.',
      book: [ff('lesen', '36–47', 'Sachtexte verstehen')],
    },
    {
      id: 'd2.reihenfolge',
      subject: 'german', grade: 2, group: 'Lesen',
      title: 'Schritte ordnen', short: 'Was kommt zuerst?', icon: '📶',
      gen: 'reihenfolge', unlock: 'default',
      goal: 'Handlungsschritte in die richtige Reihenfolge bringen.',
      book: [ff('texte', '11–29', 'Anleitungen'), ff('texte', '58–61', 'Listen und Beschreibungen')],
    },
    {
      id: 'd2.packliste',
      subject: 'german', grade: 2, group: 'Lesen',
      title: 'Packliste', short: 'Was gehört dazu?', icon: '🎒',
      gen: 'packliste', unlock: 'default',
      goal: 'Passende Dinge für einen Zweck auswählen.',
      book: [ff('texte', '11–29', 'Listen')],
    },

    // ══ Forscherlabor (Sachwissen) ═══════════════════════════════════════
    {
      id: 's.knowledgeQuiz', legacyIds: ['knowledgeQuiz'],
      subject: 'science', grade: 0, group: 'Wissen',
      title: 'Wissensquiz', short: 'Fragen aus vielen Bereichen', icon: '❓',
      gen: 'knowledgeQuiz', unlock: 'always',
      goal: 'Sachwissen aus Alltag und Natur festigen.',
    },
    {
      id: 's.trueFalse', legacyIds: ['trueFalse'],
      subject: 'science', grade: 0, group: 'Wissen',
      title: 'Wahr oder falsch?', short: 'Stimmt die Aussage?', icon: '✅',
      gen: 'trueFalse', unlock: 'always',
      goal: 'Aussagen auf ihre Richtigkeit prüfen.',
    },
    {
      id: 's.matching', legacyIds: ['matching'],
      subject: 'science', grade: 0, group: 'Wissen',
      title: 'Zuordnen', short: 'Was gehört zusammen?', icon: '🔗',
      gen: 'matching', unlock: 'always',
      goal: 'Begriffe richtig zuordnen.',
    },

    // ══ Rätselhöhle (Logik) ══════════════════════════════════════════════
    {
      id: 'p.numberPattern', legacyIds: ['numberPattern'],
      subject: 'logic', grade: 0, group: 'Muster',
      title: 'Zahlenmuster', short: 'Wie geht es weiter?', icon: '🔢',
      gen: 'numberPattern', unlock: 'always',
      goal: 'Zahlenmuster erkennen und fortsetzen.',
    },
    {
      id: 'p.shapePattern', legacyIds: ['shapePattern'],
      subject: 'logic', grade: 0, group: 'Muster',
      title: 'Formenmuster', short: 'Welche Form kommt?', icon: '🔷',
      gen: 'shapePattern', unlock: 'always',
      goal: 'Formenmuster erkennen und fortsetzen.',
    },
    {
      id: 'p.oddOneOut', legacyIds: ['oddOneOut'],
      subject: 'logic', grade: 0, group: 'Denken',
      title: 'Was passt nicht?', short: 'Außenseiter finden', icon: '🚫',
      gen: 'oddOneOut', unlock: 'always',
      goal: 'Das Wort finden, das nicht zur Gruppe gehört.',
    },
    {
      id: 'p.memoryTask', legacyIds: ['memoryTask'],
      subject: 'logic', grade: 0, group: 'Denken',
      title: 'Gedächtnis', short: 'Wörter merken', icon: '🧠',
      gen: 'memoryTask', unlock: 'always',
      goal: 'Sich mehrere Wörter kurz merken.',
    },
    {
      id: 'p.miniSudoku', legacyIds: ['miniSudoku'],
      subject: 'logic', grade: 0, group: 'Denken',
      title: 'Zahlen-Quadrat', short: 'Welche Zahl fehlt?', icon: '🔲',
      gen: 'miniSudoku', unlock: 'always',
      goal: 'Ein 4×4-Zahlenquadrat vervollständigen.',
    },
    {
      id: 'p.spiegelraster',
      subject: 'logic', grade: 0, group: 'Muster',
      title: 'Spiegelatelier', short: 'Bild spiegeln', icon: '🪞',
      gen: 'spiegelraster', unlock: 'always',
      goal: 'Ein Rasterbild an einer Achse spiegeln.',
      book: [zr(2, '181', 'Symmetrie')],
    },
  ];

  // ─── Indizes ──────────────────────────────────────────────────────────────

  const BY_ID = {};
  const LEGACY_MAP = {};
  TOPICS.forEach(t => {
    BY_ID[t.id] = t;
    (t.legacyIds || []).forEach(l => { LEGACY_MAP[l] = t.id; });
  });

  function get(id) { return BY_ID[id] || null; }

  /** Übersetzt eine alte Übungs-ID (v1) in die neue Topic-ID. */
  function fromLegacyId(legacyId) { return LEGACY_MAP[legacyId] || null; }

  function all() { return TOPICS.slice(); }

  /**
   * Alle Themen eines Fachs für eine Klassenstufe.
   * Themen mit grade 0 (Sachwissen, Logik) gelten für alle Stufen.
   */
  function forSubject(subject, grade) {
    return TOPICS.filter(t =>
      t.subject === subject && (t.grade === 0 || t.grade === grade));
  }

  /** Themen, die standardmäßig freigegeben sind. */
  function defaultUnlocked(grade) {
    return TOPICS
      .filter(t => (t.grade === 0 || t.grade === grade))
      .filter(t => t.unlock === 'always' || t.unlock === 'default')
      .map(t => t.id);
  }

  function isAlwaysOn(id) {
    const t = get(id);
    return !!t && t.unlock === 'always';
  }

  /** Gruppiert eine Themenliste nach `group`, Reihenfolge bleibt erhalten. */
  function groupBy(topics) {
    const out = [];
    const index = {};
    topics.forEach(t => {
      if (index[t.group] === undefined) {
        index[t.group] = out.length;
        out.push({ group: t.group, topics: [] });
      }
      out[index[t.group]].topics.push(t);
    });
    return out;
  }

  // ─── Buchseiten → Thema ───────────────────────────────────────────────────

  /** Prüft, ob eine gedruckte Seite in einem Bereich wie "45–48" liegt. */
  function pageInRange(page, rangeStr) {
    const parts = String(rangeStr).split(/[,;]/).map(s => s.trim());
    return parts.some(part => {
      const m = part.match(/^(\d+)\s*[–-]\s*(\d+)$/);
      if (m) return page >= Number(m[1]) && page <= Number(m[2]);
      return Number(part) === page;
    });
  }

  /**
   * Findet Themen zu einer gedruckten Buchseite.
   * Gibt [] zurück, wenn keine belegte Zuordnung existiert — dann sagt
   * der Elternbereich ausdrücklich "keine gesicherte Zuordnung".
   */
  function findByPage(series, volume, page) {
    return TOPICS.filter(t => (t.book || []).some(ref =>
      ref.series === series &&
      String(ref.volume) === String(volume) &&
      pageInRange(page, ref.printed)));
  }

  /** Alle belegten Seitenbereiche einer Reihe/eines Bandes. */
  function coverage(series, volume) {
    const out = [];
    TOPICS.forEach(t => (t.book || []).forEach(ref => {
      if (ref.series === series && String(ref.volume) === String(volume)) {
        out.push({ topicId: t.id, title: t.title, pages: ref.printed, label: ref.label });
      }
    }));
    return out.sort((a, b) => parseInt(a.pages, 10) - parseInt(b.pages, 10));
  }

  // ─── Die zehn Mathe-Checks als Themenraster ───────────────────────────────
  // Quelle: Bericht, Abschnitt 7. Buchseite und PDF-Seite sind dort belegt.
  // Die App stellt zu diesen Lernzielen EIGENE Aufgaben — keine Buchaufgaben.

  const CHECKS = [
    { nr: 1,  printed: 21,  pdf: 21, volume: 1,
      label: 'Rechnen bis 20, Rechenmauern, Rückgeld, Größen und Körper',
      topicIds: ['m2.rechenmauer', 'm2.geldRueckgeld', 'm2.flaechenKoerper', 'm2.addOhneUebergang'] },
    { nr: 2,  printed: 41,  pdf: 41, volume: 1,
      label: 'Zahlenstrahl bis 100, Mal-/Plusbeziehung, Vergleich und Zehnerrechnen',
      topicIds: ['m2.zahlenstrahl', 'm2.vergleichen', 'm2.addZehner', 'm2.malGruppen'] },
    { nr: 3,  printed: 68,  pdf: 68, volume: 1,
      label: 'Längen vergleichen, Zahlen darstellen, Rechnen, Hunderterfeld, Körper und Flächen',
      topicIds: ['m2.laengen', 'm2.stellenwert', 'm2.hunderterfeld', 'm2.flaechenKoerper'] },
    { nr: 4,  printed: 84,  pdf: 84, volume: 1,
      label: 'Diagramm lesen, Malaufgaben, Tauschaufgaben und gerechtes Verteilen',
      topicIds: ['m2.diagramm', 'm2.reihe2', 'm2.malTausch', 'm2.teilenVerteilen'] },
    { nr: 5,  printed: 116, pdf: 12, volume: 2,
      label: 'Malnehmen und Teilen, Schlüssel-/Nachbaraufgaben, Muster, Zehner und Ergänzen auf 100',
      topicIds: ['m2.reihe5', 'm2.teilenGruppen', 'm2.malNachbar', 'm2.ergaenzenHundert'] },
    { nr: 6,  printed: 134, pdf: 30, volume: 2,
      label: 'Geldbeträge, 3er-Reihe/Teilen, Rechenbaum, Zeiteinheiten und Uhrzeit',
      topicIds: ['m2.geldMuenzen', 'm2.reihe3', 'm2.rechenmauer', 'm2.uhrVolleHalbe', 'm2.kalender'] },
    { nr: 7,  printed: 150, pdf: 46, volume: 2,
      label: 'Plus/Minus, dag/kg, Gewichte schätzen, Sachrechnen und Zehnerübergang',
      topicIds: ['m2.addMitUebergang', 'm2.gewichte', 'm2.sachaufgaben'] },
    { nr: 8,  printed: 165, pdf: 61, volume: 2,
      label: 'Verdoppeln/Halbieren, gerade und ungerade Zahlen, 6er-/8er-Reihe und Muster',
      topicIds: ['m2.doubleHalf', 'm2.geradeUngerade', 'm2.reihe6', 'm2.reihe8', 'm2.numberSeries'] },
    { nr: 9,  printed: 180, pdf: 76, volume: 2,
      label: 'Zehnerunterschreitung, Zahlenstrahl, Unterschied, Geometrie, Malaufgaben und Runden',
      topicIds: ['m2.subMitUebergang', 'm2.zahlenstrahl', 'm2.flaechenKoerper', 'm2.reihe4'] },
    { nr: 10, printed: 197, pdf: 93, volume: 2,
      label: 'Symmetrie, Rechenstrategien, Fehler verstehen und Stellenwert bis 1.000',
      topicIds: ['m2.symmetrie', 'm2.rechenweg', 'm2.umkehrPlusMinus', 'm2.stellenwert'] },
  ];

  function getCheck(nr) {
    return CHECKS.find(c => c.nr === nr) || null;
  }

  return {
    SERIES, TOPICS, CHECKS,
    get, all, forSubject, defaultUnlocked, isAlwaysOn, groupBy,
    fromLegacyId, formatRef, findByPage, pageInRange, coverage, getCheck,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Topics;
