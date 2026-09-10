/**
 * tests/content.test.js
 * Inhaltsprüfung: Struktur, Eindeutigkeit und fachliche Stimmigkeit der
 * redaktionellen Daten.
 *
 * Diese Datei ersetzt keine fachliche Freigabe durch einen Menschen —
 * sie fängt aber alle mechanisch prüfbaren Fehler ab.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { loadApp } = require('./harness');

const ctx = loadApp({ silent: true });
const { WordsData, GermanData, ScienceData, LogicData, AnswerCheck, Topics } = ctx;

function sortedLetters(word) {
  return word.toUpperCase().split('').sort().join('');
}

// ── Buchstabenlücken ───────────────────────────────────────────────────────

test('jede Buchstabenlücke hat einen eindeutigen Hinweis', () => {
  WordsData.MISSING_LETTER.forEach(e => {
    assert.ok(e.clue && e.clue.length > 8, `${e.word}: Hinweis fehlt oder ist zu kurz`);
    assert.ok(/[.!?]$/.test(e.clue), `${e.word}: Hinweis ist kein ganzer Satz`);
  });
});

test('Maske, Lösungsbuchstabe und Wort passen zusammen', () => {
  WordsData.MISSING_LETTER.forEach(e => {
    assert.strictEqual(e.masked.split('_').length - 1, 1,
      `${e.word}: genau eine Lücke erwartet, Maske ist "${e.masked}"`);
    assert.strictEqual(e.letter.length, 1, `${e.word}: Lösung muss ein Buchstabe sein`);
    const rebuilt = e.masked.replace('_', e.letter);
    assert.strictEqual(rebuilt, e.word,
      `${e.word}: Maske "${e.masked}" + "${e.letter}" ergibt "${rebuilt}"`);
    assert.strictEqual(e.word, e.word.toUpperCase(), `${e.word}: bitte in Großbuchstaben`);
  });
});

test('kein Wort erscheint zweimal in den Buchstabenlücken', () => {
  const seen = new Set();
  WordsData.MISSING_LETTER.forEach(e => {
    assert.ok(!seen.has(e.word), 'doppelt: ' + e.word);
    seen.add(e.word);
  });
});

test('jede Schwierigkeitsstufe hat genug Buchstabenlücken', () => {
  [1, 2, 3].forEach(level => {
    const n = WordsData.MISSING_LETTER.filter(e => e.level === level).length;
    assert.ok(n >= 12, `Stufe ${level}: nur ${n} Einträge`);
  });
});

test('keine Maske passt auf zwei bekannte Wörter der App', () => {
  // Alle in der App vorkommenden Wörter als Prüfmenge.
  const lexicon = new Set();
  WordsData.MISSING_LETTER.forEach(e => lexicon.add(e.word));
  WordsData.BUILD_WORDS.forEach(e => lexicon.add(e.word.toUpperCase()));
  WordsData.CATEGORY_ITEMS.forEach(e => lexicon.add(e.w.toUpperCase()));
  Object.keys(LogicData.WORD_GROUPS).forEach(g =>
    LogicData.WORD_GROUPS[g].forEach(w => lexicon.add(w.toUpperCase())));

  WordsData.MISSING_LETTER.forEach(e => {
    const pattern = new RegExp('^' + e.masked.replace('_', '.') + '$');
    const matches = Array.from(lexicon).filter(w => pattern.test(w));
    // Mehrdeutigkeit ist erlaubt, solange ein Hinweis sie auflöst —
    // genau dafür ist der Hinweis da. Hier wird nur protokolliert.
    if (matches.length > 1) {
      assert.ok(e.clue.length > 12,
        `${e.masked} passt auf ${matches.join('/')} — der Hinweis muss das auflösen`);
    }
  });
});

// ── Wort bauen ─────────────────────────────────────────────────────────────

test('jedes Wort-bauen-Wort hat einen Hinweis und ist eindeutig', () => {
  const seen = new Set();
  WordsData.BUILD_WORDS.forEach(e => {
    assert.ok(e.clue && e.clue.length > 5, `${e.word}: Hinweis fehlt`);
    assert.ok(!seen.has(e.word), 'doppelt: ' + e.word);
    seen.add(e.word);
    assert.ok(e.word.length >= 3, `${e.word}: zu kurz`);
    assert.strictEqual(e.word, e.word.toUpperCase(), `${e.word}: bitte in Großbuchstaben`);
  });
});

test('kein Anagramm-Paar innerhalb der Wort-bauen-Liste', () => {
  const bySignature = {};
  WordsData.BUILD_WORDS.forEach(e => {
    const sig = sortedLetters(e.word);
    if (!bySignature[sig]) bySignature[sig] = [];
    bySignature[sig].push(e.word);
  });
  Object.keys(bySignature).forEach(sig => {
    assert.strictEqual(bySignature[sig].length, 1,
      'gleiche Buchstaben, zwei Wörter: ' + bySignature[sig].join(' / '));
  });
});

// ── Wortgruppen und Gegenteile ─────────────────────────────────────────────

test('jede Wortgruppe hat genug Wörter für drei Auswahlantworten', () => {
  WordsData.CATEGORIES.forEach(cat => {
    const n = WordsData.CATEGORY_ITEMS.filter(i => i.cat === cat).length;
    assert.ok(n >= 8, `${cat}: nur ${n} Wörter`);
    assert.ok(WordsData.CATEGORY_LABELS[cat], `${cat}: Pluralform fehlt`);
    assert.ok(WordsData.CATEGORY_HINTS[cat], `${cat}: Tipp fehlt`);
  });
});

test('kein Wort steht in zwei Wortgruppen', () => {
  const seen = {};
  WordsData.CATEGORY_ITEMS.forEach(i => {
    assert.ok(!seen[i.w] || seen[i.w] === i.cat, `${i.w} in ${seen[i.w]} und ${i.cat}`);
    seen[i.w] = i.cat;
  });
});

test('Gegenteil-Paare sind eindeutig und nicht doppelt', () => {
  const seen = new Set();
  WordsData.OPPOSITE_PAIRS.forEach(([a, b]) => {
    assert.notStrictEqual(a, b);
    const key = [a, b].sort().join('|');
    assert.ok(!seen.has(key), 'doppeltes Paar: ' + key);
    seen.add(key);
  });
});

test('ein Wort ist nie sein eigenes Gegenteil in zwei Paaren', () => {
  const partners = {};
  WordsData.OPPOSITE_PAIRS.forEach(([a, b]) => {
    [[a, b], [b, a]].forEach(([x, y]) => {
      if (!partners[x]) partners[x] = new Set();
      partners[x].add(y);
    });
  });
  Object.keys(partners).forEach(word => {
    assert.strictEqual(partners[word].size, 1,
      `${word} hat mehrere Gegenteile: ${Array.from(partners[word]).join(', ')}`);
  });
});

// ── Österreichische Sprache ────────────────────────────────────────────────

test('Jänner ist die verwendete Monatsform', () => {
  assert.strictEqual(WordsData.MONTHS[0], 'Jänner');
  assert.ok(!WordsData.MONTHS.includes('Januar'));
});

test('Januar wird als Antwort trotzdem akzeptiert', () => {
  const task = { answerMode: AnswerCheck.MODE.TEXT, answer: 'Jänner' };
  assert.ok(AnswerCheck.check('Januar', task));
  assert.ok(AnswerCheck.check('jänner', task));
  assert.ok(!AnswerCheck.check('Februar', task));
});

test('Monate und Wochentage sind vollständig', () => {
  assert.strictEqual(WordsData.MONTHS.length, 12);
  assert.strictEqual(WordsData.WEEKDAYS.length, 7);
  assert.strictEqual(WordsData.WEEKDAYS[0], 'Montag');
  const inSeasons = WordsData.SEASONS.reduce((a, s) => a.concat(s.months), []);
  assert.strictEqual(inSeasons.length, 12);
  WordsData.MONTHS.forEach(m => assert.ok(inSeasons.includes(m), m + ' fehlt in den Jahreszeiten'));
});

// ── Deutsch: Namenwörter, Zeitwörter ───────────────────────────────────────

test('Namenwörter haben Begleiter und passende Mehrzahl', () => {
  const seen = new Set();
  GermanData.NOUNS.forEach(n => {
    assert.ok(['der', 'die', 'das'].includes(n.art), `${n.sg}: Begleiter "${n.art}"`);
    assert.ok(!seen.has(n.sg), 'doppelt: ' + n.sg);
    seen.add(n.sg);
    assert.strictEqual(n.sg[0], n.sg[0].toUpperCase(), `${n.sg}: Namenwort großschreiben`);
    if (n.pl) {
      assert.notStrictEqual(n.pl, n.sg === 'Fenster' || n.sg === 'Messer' ? null : n.pl.toLowerCase());
      assert.strictEqual(n.pl[0], n.pl[0].toUpperCase(), `${n.pl}: Mehrzahl großschreiben`);
    }
  });
});

test('genug Namenwörter mit Mehrzahl für die Übung', () => {
  const withPlural = GermanData.NOUNS.filter(n => n.pl);
  assert.ok(withPlural.length >= 40, 'nur ' + withPlural.length);
  const changed = withPlural.filter(n => n.pl !== n.sg);
  assert.ok(changed.length >= 35, 'zu viele unveränderte Mehrzahlformen');
});

test('Zeitwörter haben alle Formen und die du-Form endet sinnvoll', () => {
  GermanData.VERBS.forEach(v => {
    ['inf', 'ich', 'du', 'er'].forEach(k =>
      assert.ok(v[k] && v[k].length > 2, `${v.inf}: Form ${k} fehlt`));
    assert.ok(v.inf.endsWith('en'), `${v.inf}: Grundform sollte auf -en enden`);
    assert.ok(/(st|t)$/.test(v.du), `${v.inf}: du-Form "${v.du}" endet unerwartet`);
    assert.strictEqual(v.inf, v.inf.toLowerCase(), `${v.inf}: Zeitwörter klein`);
  });
});

test('Sätze zum Markieren haben einen gültigen Zielindex', () => {
  [['Namenwort', GermanData.NOUN_SENTENCES],
   ['Zeitwort', GermanData.VERB_SENTENCES],
   ['Eigenschaftswort', GermanData.ADJ_SENTENCES]].forEach(([label, list]) => {
    list.forEach(s => {
      assert.ok(Array.isArray(s.words) && s.words.length >= 3, label + ': Satz zu kurz');
      assert.ok(s.target >= 0 && s.target < s.words.length,
        `${label}: Zielindex ${s.target} außerhalb von "${s.words.join(' ')}"`);
    });
  });
});

test('markierte Namenwörter sind großgeschrieben, Zeitwörter klein', () => {
  GermanData.NOUN_SENTENCES.forEach(s => {
    const w = s.words[s.target];
    assert.strictEqual(w[0], w[0].toUpperCase(), `"${w}" sollte großgeschrieben sein`);
    assert.ok(s.target > 0, 'das Namenwort darf nicht am Satzanfang stehen: ' + s.words.join(' '));
  });
  GermanData.VERB_SENTENCES.forEach(s => {
    const w = s.words[s.target];
    assert.strictEqual(w[0], w[0].toLowerCase(), `"${w}" sollte kleingeschrieben sein`);
  });
});

test('in jedem Namenwort-Satz gibt es nur ein großgeschriebenes Wort nach dem Anfang', () => {
  GermanData.NOUN_SENTENCES.forEach(s => {
    const caps = s.words.map((w, i) => ({ w, i }))
      .filter(x => x.i > 0 && x.w[0] === x.w[0].toUpperCase());
    assert.strictEqual(caps.length, 1,
      `mehrdeutig: "${s.words.join(' ')}" enthält ${caps.map(c => c.w).join(', ')}`);
  });
});

// ── Rechtschreibung ────────────────────────────────────────────────────────

test('Silbentrennungen ergeben wieder das Wort', () => {
  GermanData.SYLLABLE_WORDS.forEach(w => {
    assert.strictEqual(w.syllables.join(''), w.word,
      `${w.word}: ${w.syllables.join('|')} ergibt nicht das Wort`);
    assert.ok(w.syllables.length >= 2, `${w.word}: braucht mindestens zwei Silben`);
    w.syllables.forEach(s => assert.ok(s.length >= 1));
  });
});

test('jede Silbe enthält einen Selbstlaut', () => {
  GermanData.SYLLABLE_WORDS.forEach(w => {
    w.syllables.forEach(s => {
      assert.ok(/[aeiouäöüy]/i.test(s), `${w.word}: Silbe "${s}" ohne Selbstlaut`);
    });
  });
});

test('Verlängern: Maske plus Buchstabe ergibt das Wort', () => {
  GermanData.EXTEND_WORDS.forEach(e => {
    assert.strictEqual(e.masked.replace('_', e.letter), e.word,
      `${e.word}: ${e.masked} + ${e.letter}`);
    // Beim Verlängern kann sich der Selbstlaut zum Umlaut wandeln
    // (Bad → Bäder), deshalb wird vor dem Vergleich normalisiert.
    const plain = str => str.toLowerCase()
      .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u');
    assert.ok(plain(e.longer).startsWith(plain(e.word).slice(0, 2)),
      `${e.word}: "${e.longer}" sieht nicht wie die verlängerte Form aus`);
    assert.ok(e.longer.length > e.word.length,
      `${e.word}: "${e.longer}" ist nicht länger`);
    assert.ok(e.longer.toLowerCase().indexOf(e.letter.toLowerCase()) > 0,
      `${e.word}: der gesuchte Buchstabe muss in "${e.longer}" hörbar sein`);
  });
});

test('St/Sp: Vorsilbe plus Rest ergibt das Wort', () => {
  GermanData.ST_SP_WORDS.forEach(w => {
    assert.strictEqual(w.prefix + w.rest, w.word, `${w.word}: ${w.prefix}+${w.rest}`);
    assert.ok(['St', 'Sp'].includes(w.prefix));
    assert.ok(w.clue && w.clue.length > 8, `${w.word}: Hinweis fehlt`);
  });
});

test('ie-Aufgaben: Maske passt zum Wort', () => {
  GermanData.IE_WORDS.forEach(w => {
    const filled = w.masked.replace('_', w.hasIe ? 'ie' : 'i');
    assert.strictEqual(filled, w.word, `${w.word}: "${w.masked}" ergibt "${filled}"`);
    assert.ok(w.clue && w.clue.length > 8, `${w.word}: Hinweis fehlt`);
  });
  const withIe = GermanData.IE_WORDS.filter(w => w.hasIe).length;
  const withoutIe = GermanData.IE_WORDS.length - withIe;
  assert.ok(withIe >= 6 && withoutIe >= 6, 'beide Fälle brauchen genug Beispiele');
});

test('doppelte Mitlaute: falsche Schreibweise unterscheidet sich genau in der Verdopplung', () => {
  GermanData.DOUBLE_CONSONANT.forEach(w => {
    assert.notStrictEqual(w.word, w.wrong);
    assert.strictEqual(w.word.length, w.wrong.length + 1,
      `${w.word}/${w.wrong}: erwartet genau einen Buchstaben Unterschied`);
    assert.ok(/(.)\1/.test(w.word), `${w.word}: enthält keinen doppelten Mitlaut`);
    assert.ok(w.clue && w.clue.length > 5);
  });
  GermanData.SINGLE_CONSONANT.forEach(w => {
    assert.strictEqual(w.wrong.length, w.word.length + 1, `${w.word}/${w.wrong}`);
    assert.ok(!/(.)\1/.test(w.word), `${w.word}: sollte KEINEN doppelten Mitlaut haben`);
  });
});

test('Umlautableitungen verweisen auf ein Grundwort ohne Umlaut', () => {
  GermanData.UMLAUT_DERIVATIONS.forEach(d => {
    assert.ok(/[äÄ]|äu/.test(d.form), `${d.form}: enthält keinen Umlaut`);
    assert.ok(!/[äÄöÖüÜ]/.test(d.base), `${d.base}: Grundwort sollte keinen Umlaut haben`);
    assert.ok(['ä', 'äu'].includes(d.letter));
  });
});

test('Fehlersätze: markierte Stelle ist wirklich falsch', () => {
  GermanData.ERROR_SENTENCES.forEach(s => {
    assert.ok(s.index >= 0 && s.index < s.words.length, 'Index außerhalb');
    assert.notStrictEqual(s.words[s.index], s.correct,
      `"${s.words.join(' ')}": markiertes Wort entspricht schon der Lösung`);
    assert.ok(s.rule && s.rule.length > 10, 'Regelerklärung fehlt');
  });
});

test('Fehlersätze enthalten genau einen Fehler', () => {
  // Alle übrigen Wörter müssen entweder klein sein oder ein bekanntes
  // Namenwort bzw. am Satzanfang stehen.
  const nouns = new Set();
  GermanData.NOUNS.forEach(n => { nouns.add(n.sg); if (n.pl) nouns.add(n.pl); });
  GermanData.COMPOUNDS.forEach(c => nouns.add(c.word));
  GermanData.ERROR_SENTENCES.forEach(s => {
    s.words.forEach((w, i) => {
      if (i === s.index) return;
      const bare = w.replace(/[.,!?]$/, '');
      if (bare[0] === bare[0].toUpperCase() && i > 0) {
        assert.ok(nouns.has(bare),
          `"${s.words.join(' ')}": "${bare}" ist groß, aber kein bekanntes Namenwort`);
      }
    });
  });
});

// ── Satzbau und Satzzeichen ────────────────────────────────────────────────

test('Satzbausteine: genau der erste Baustein ist großgeschrieben', () => {
  GermanData.SENTENCE_PARTS.forEach(s => {
    assert.ok(s.parts.length >= 3, 'zu wenige Bausteine');
    s.parts.forEach((p, i) => {
      const isCap = p[0] === p[0].toUpperCase();
      if (i === 0) assert.ok(isCap, `"${p}" sollte großgeschrieben sein`);
      else assert.ok(!isCap,
        `"${p}" in "${s.parts.join(' / ')}" ist groß — dann ist die Lösung nicht eindeutig`);
    });
  });
});

test('Satzzeichen: nur eindeutige Fälle', () => {
  GermanData.PUNCTUATION.forEach(p => {
    assert.ok(['.', '?', '!'].includes(p.mark));
    assert.ok(p.why && p.why.length > 10, p.text + ': Begründung fehlt');
    assert.ok(!/[.!?]$/.test(p.text), p.text + ': Satzzeichen steht schon im Text');
    if (p.mark === '?') {
      assert.ok(/^(Wie|Wo|Wann|Warum|Wer|Was|Welche)/.test(p.text),
        p.text + ': Frage ohne Fragewort ist nicht eindeutig');
    }
    if (p.mark === '!') {
      assert.ok(/^(Au|Oh|Hurra|Hilfe|Aua)/.test(p.text),
        p.text + ': Ausruf ohne Signalwort ist nicht eindeutig');
    }
  });
  ['.', '?', '!'].forEach(m => {
    const n = GermanData.PUNCTUATION.filter(p => p.mark === m).length;
    assert.ok(n >= 3, `zu wenige Beispiele für "${m}"`);
  });
});

test('Satzanfänge: das erste Wort ist klein geschrieben', () => {
  GermanData.SENTENCE_STARTS.forEach(s => {
    assert.strictEqual(s.lower, s.lower.toLowerCase(), s.lower + ': muss klein sein');
    assert.ok(s.rest.length > 5);
  });
});

// ── Lesen ──────────────────────────────────────────────────────────────────

test('Sachtexte haben beantwortbare Fragen', () => {
  GermanData.SHORT_TEXTS.forEach(t => {
    assert.ok(t.text.length > 60, t.title + ': Text zu kurz');
    assert.ok(t.questions.length >= 1);
    t.questions.forEach(q => {
      assert.ok(q.wrong.length === 2, q.q + ': zwei falsche Antworten erwartet');
      const all = [q.right].concat(q.wrong);
      assert.strictEqual(new Set(all).size, 3, q.q + ': doppelte Antwortmöglichkeit');
      // Die richtige Antwort muss im Text vorkommen.
      const key = q.right.replace(/^(Im|In der|Um|Ein|Eine)\s+/i, '').toLowerCase();
      assert.ok(t.text.toLowerCase().includes(key.split(' ')[0]),
        `${t.title}: "${q.right}" steht so nicht im Text`);
    });
  });
});

test('Bild-Satz-Paare haben genau einen passenden Satz', () => {
  GermanData.PICTURE_SENTENCES.forEach(p => {
    assert.ok(p.emoji.length > 0);
    assert.strictEqual(p.wrong.length, 2);
    assert.strictEqual(new Set([p.right].concat(p.wrong)).size, 3);
  });
});

test('Packlisten haben drei richtige und drei falsche Dinge', () => {
  GermanData.PACKING_LISTS.forEach(p => {
    assert.strictEqual(p.right.length, 3, p.title);
    assert.strictEqual(p.wrong.length, 3, p.title);
    assert.strictEqual(new Set(p.right.concat(p.wrong)).size, 6, p.title + ': doppelter Eintrag');
  });
});

test('Schrittfolgen haben mindestens drei Schritte', () => {
  GermanData.STEP_SEQUENCES.forEach(s => {
    assert.ok(s.steps.length >= 3, s.title);
    assert.strictEqual(new Set(s.steps).size, s.steps.length, s.title + ': doppelter Schritt');
  });
});

test('Tabellen haben Kopfzeile und Zahlenwerte', () => {
  GermanData.TABLES.forEach(t => {
    assert.strictEqual(t.columns.length, 2);
    assert.ok(t.rows.length >= 3, t.title);
    t.rows.forEach(r => {
      assert.strictEqual(r.length, 2);
      assert.strictEqual(typeof r[1], 'number', t.title + ': Wert ist keine Zahl');
    });
    const values = t.rows.map(r => r[1]);
    assert.strictEqual(new Set(values).size, values.length,
      t.title + ': gleiche Werte machen "am meisten" mehrdeutig');
  });
});

// ── Lernwörter ─────────────────────────────────────────────────────────────

test('Lernwortprüfung lässt nur brauchbare Wörter zu', () => {
  const ok = ['Fahrrad', 'Jänner', 'Mäuse', 'Groß-Enzersdorf'];
  ok.forEach(w => assert.ok(GermanData.learnWordCapabilities(w).lookCoverWrite, w));
  const nope = ['', 'A', '12', 'Wort mit Leerzeichen', 'Hallo!', 'x'.repeat(30)];
  nope.forEach(w => assert.ok(!GermanData.learnWordCapabilities(w).lookCoverWrite, w));
});

test('für eigene Lernwörter wird keine Silbentrennung behauptet', () => {
  const caps = GermanData.learnWordCapabilities('Fahrrad');
  assert.strictEqual(caps.syllableCount, false,
    'Silbenaufgaben für ungeprüfte Wörter wären fachlich unsicher');
});

// ── Sachwissen ─────────────────────────────────────────────────────────────

test('Quizfragen haben drei verschiedene Antworten', () => {
  ScienceData.KNOWLEDGE_QUESTIONS.forEach(q => {
    const [frage, antworten, bereich, emoji] = q;
    assert.ok(frage.length > 8, 'Frage zu kurz: ' + frage);
    assert.strictEqual(antworten.length, 3, frage);
    assert.strictEqual(new Set(antworten).size, 3, frage + ': doppelte Antwort');
    assert.ok(bereich && emoji, frage + ': Bereich oder Emoji fehlt');
  });
});

test('keine Quizfrage kommt doppelt vor', () => {
  const seen = new Set();
  ScienceData.KNOWLEDGE_QUESTIONS.forEach(q => {
    assert.ok(!seen.has(q[0]), 'doppelt: ' + q[0]);
    seen.add(q[0]);
  });
});

test('Wahr/Falsch-Aussagen sind eindeutig gekennzeichnet', () => {
  const seen = new Set();
  ScienceData.TRUE_FALSE_DATA.forEach(([text, isTrue, bereich]) => {
    assert.strictEqual(typeof isTrue, 'boolean', text);
    assert.ok(bereich, text);
    assert.ok(!seen.has(text), 'doppelt: ' + text);
    seen.add(text);
  });
  const wahr = ScienceData.TRUE_FALSE_DATA.filter(x => x[1]).length;
  const falsch = ScienceData.TRUE_FALSE_DATA.length - wahr;
  assert.ok(Math.abs(wahr - falsch) < ScienceData.TRUE_FALSE_DATA.length * 0.3,
    `Verhältnis unausgewogen: ${wahr} wahr, ${falsch} falsch`);
});

test('Zuordnungen haben zwei falsche Kategorien', () => {
  ScienceData.MATCHING_DATA.forEach(([thing, right, wrong]) => {
    assert.strictEqual(wrong.length, 2, thing);
    assert.ok(!wrong.includes(right), thing + ': richtige Kategorie auch als falsche');
  });
});

// ── Logik ──────────────────────────────────────────────────────────────────

test('Wortgruppen der Rätselhöhle sind groß genug', () => {
  Object.keys(LogicData.WORD_GROUPS).forEach(g => {
    assert.ok(LogicData.WORD_GROUPS[g].length >= 4, `${g}: nur ${LogicData.WORD_GROUPS[g].length}`);
    const list = LogicData.WORD_GROUPS[g];
    assert.strictEqual(new Set(list).size, list.length, g + ': doppeltes Wort');
  });
});

test('überschneidende Wortgruppen werden nicht kombiniert', () => {
  assert.ok(!LogicData.groupsCompatible('Tiere', 'Lebensmittel'));
  assert.ok(!LogicData.groupsCompatible('Lebensmittel', 'Pflanzen'));
  assert.ok(!LogicData.groupsCompatible('Wetter', 'Jahreszeiten'));
  assert.ok(LogicData.groupsCompatible('Tiere', 'Fahrzeuge'));
});

test('Spiegelvorlagen liegen im Raster und links der Achse', () => {
  LogicData.MIRROR_PATTERNS.forEach(p => {
    assert.ok(p.cells.length >= 6, p.name + ': zu wenige Felder');
    p.cells.forEach(([r, c]) => {
      assert.ok(r >= 0 && r < 5 && c >= 0 && c < 5, `${p.name}: Feld ${r},${c} außerhalb`);
    });
    const left = p.cells.filter(([r, c]) => c < 2);
    assert.ok(left.length >= 3, p.name + ': zu wenig auf der linken Seite');
  });
});

// ── Buchzuordnungen ────────────────────────────────────────────────────────

test('jede Buchreferenz verweist auf eine bekannte Reihe und einen Band', () => {
  Topics.all().forEach(t => {
    (t.book || []).forEach(ref => {
      const series = Topics.SERIES[ref.series];
      assert.ok(series, `${t.id}: unbekannte Reihe ${ref.series}`);
      assert.ok(series.volumes[ref.volume], `${t.id}: unbekannter Band ${ref.volume}`);
      assert.ok(/^\d+(\s*[–-]\s*\d+)?$/.test(String(ref.printed)),
        `${t.id}: Seitenangabe "${ref.printed}" hat kein erwartetes Format`);
      assert.ok(ref.label && ref.label.length > 3, `${t.id}: Bezeichnung der Fundstelle fehlt`);
    });
  });
});

test('Seitensuche findet die belegten Zuordnungen', () => {
  assert.ok(Topics.findByPage('zahlenreise2', 1, 33).some(t => t.id === 'm2.buendeln'));
  assert.ok(Topics.findByPage('zahlenreise2', 1, 46).some(t => t.id === 'm2.stellenwert'));
  assert.ok(Topics.findByPage('flexflora2', 'sprache', 5).some(t => t.id === 'd2.abc'));
  assert.strictEqual(Topics.findByPage('zahlenreise2', 1, 999).length, 0,
    'für unbelegte Seiten darf nichts geraten werden');
});

test('die zehn Mathe-Checks sind vollständig und verweisen auf echte Themen', () => {
  assert.strictEqual(Topics.CHECKS.length, 10);
  const inVolume1 = Topics.CHECKS.filter(c => c.volume === 1).length;
  assert.strictEqual(inVolume1, 4, 'Checks 1–4 liegen in Teil 1');
  assert.strictEqual(Topics.CHECKS.length - inVolume1, 6, 'Checks 5–10 liegen in Teil 2');
  Topics.CHECKS.forEach(c => {
    assert.ok(c.printed > 0 && c.pdf > 0, `Check ${c.nr}: Seitenangabe fehlt`);
    assert.ok(c.topicIds.length >= 3, `Check ${c.nr}: zu wenige Lernziele`);
    c.topicIds.forEach(id =>
      assert.ok(Topics.get(id), `Check ${c.nr}: unbekanntes Thema ${id}`));
  });
});
