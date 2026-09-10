/**
 * tests/generators.test.js
 * Prüft jeden Aufgabengenerator auf Wertebereiche, Lösbarkeit und Hilfen.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { loadApp } = require('./harness');

const ctx = loadApp({ silent: true });
const { Topics, Generators, AnswerCheck, Util } = ctx;

const RUNS_PER_LEVEL = 60;

/** Erzeugt die richtige Antwort so, wie sie eine Nutzerin eingeben würde. */
function simulateCorrectInput(task) {
  switch (task.answerMode) {
    case AnswerCheck.MODE.NUMBER: return String(task.answer);
    case AnswerCheck.MODE.CHOICE: return String(task.answer);
    case AnswerCheck.MODE.ORDER:  return task.answer.slice();
    case AnswerCheck.MODE.SET:    return task.answer.slice();
    case AnswerCheck.MODE.FIELDS: return task.answer.map(String);
    default:                      return String(task.answer);
  }
}

test('jedes Thema hat einen Generator', () => {
  assert.strictEqual(Generators.missingGenerators().join(','), '');
});

test('jedes Thema hat Titel, Lernziel und Icon', () => {
  Topics.all().forEach(t => {
    assert.ok(t.title && t.title.length > 2, `${t.id}: Titel fehlt`);
    assert.ok(t.goal && t.goal.length > 5, `${t.id}: Lernziel fehlt`);
    assert.ok(t.icon, `${t.id}: Icon fehlt`);
    assert.ok(['always', 'default', 'off'].includes(t.unlock), `${t.id}: unlock ungültig`);
  });
});

test('Topic-IDs sind eindeutig, ebenso die Alt-IDs', () => {
  const ids = Topics.all().map(t => t.id);
  assert.strictEqual(new Set(ids).size, ids.length, 'doppelte Topic-ID');
  const legacy = [];
  Topics.all().forEach(t => (t.legacyIds || []).forEach(l => legacy.push(l)));
  assert.strictEqual(new Set(legacy).size, legacy.length, 'doppelte Alt-ID');
});

Topics.all().forEach(topic => {
  test(`Generator ${topic.id} liefert lösbare Aufgaben`, () => {
    for (let level = 1; level <= 3; level++) {
      const seen = new Set();
      for (let i = 0; i < RUNS_PER_LEVEL; i++) {
        const task = Generators.create(topic.id, { level });
        assert.ok(task, `${topic.id} Stufe ${level}: keine Aufgabe`);
        if (task.empty) continue;   // z.B. Lernwörter ohne Eintrag

        // Kennung
        assert.ok(task.taskId && task.taskId.startsWith(topic.id + '#'),
          `${topic.id}: taskId fehlt oder ist falsch aufgebaut`);
        assert.ok(task.signature && task.signature.length > 0,
          `${topic.id}: signature fehlt`);
        seen.add(task.signature);

        // Aufgabenstellung
        assert.ok(typeof task.prompt === 'string' && task.prompt.length > 3,
          `${topic.id}: prompt fehlt`);
        assert.ok(typeof task.questionHtml === 'string',
          `${topic.id}: questionHtml fehlt`);
        assert.ok(task.input && task.input.kind, `${topic.id}: input.kind fehlt`);

        // Lösung
        assert.ok(task.answer !== undefined && task.answer !== null,
          `${topic.id}: keine Lösung`);
        if (task.answerMode === AnswerCheck.MODE.NUMBER) {
          assert.ok(Number.isFinite(Number(task.answer)),
            `${topic.id}: Lösung ist keine Zahl (${task.answer})`);
          assert.ok(Number(task.answer) >= 0,
            `${topic.id}: negative Lösung ${task.answer}`);
        }
        if (task.answerMode === AnswerCheck.MODE.CHOICE) {
          assert.ok(Array.isArray(task.input.choices) || task.input.kind !== 'choice'
            || task.input.choices, `${topic.id}: choices fehlen`);
          if (task.input.kind === 'choice') {
            assert.ok(task.input.choices.map(String).includes(String(task.answer)),
              `${topic.id}: Lösung "${task.answer}" ist keine der Auswahlmöglichkeiten`);
            assert.strictEqual(new Set(task.input.choices.map(String)).size,
              task.input.choices.length,
              `${topic.id}: doppelte Auswahlmöglichkeit`);
          }
        }

        // Prüfung akzeptiert die richtige Antwort …
        assert.ok(AnswerCheck.check(simulateCorrectInput(task), task),
          `${topic.id}: richtige Antwort wird nicht akzeptiert (${JSON.stringify(task.answer)})`);
        // … und lehnt eine offensichtlich falsche ab
        if (task.answerMode === AnswerCheck.MODE.NUMBER) {
          assert.ok(!AnswerCheck.check(String(Number(task.answer) + 1), task),
            `${topic.id}: falsche Antwort wird akzeptiert`);
        }

        // Gestufte Hilfen
        assert.ok(Array.isArray(task.hints) && task.hints.length >= 1,
          `${topic.id}: keine Hilfe hinterlegt`);
        assert.ok(task.hints.every(h => typeof h === 'string' && h.length > 3),
          `${topic.id}: leere Hilfe`);
      }
      // Der Generator muss innerhalb einer Stufe variieren.
      // Lernwörter ohne gepflegte Liste liefern bewusst immer denselben Hinweis.
      const constantOk = ['m2.kalender', 'd2.lernwoerter'];
      if (!constantOk.includes(topic.id)) {
        assert.ok(seen.size > 1,
          `${topic.id} Stufe ${level}: erzeugt immer dieselbe Aufgabe`);
      }
    }
  });
});

test('erste Hilfe verrät die Lösung nicht sofort', () => {
  // Die erste Hilfe darf die Lösung nicht wörtlich enthalten.
  const exempt = new Set(['p.memoryTask']);
  Topics.all().forEach(topic => {
    if (exempt.has(topic.id)) return;
    for (let i = 0; i < 25; i++) {
      const task = Generators.create(topic.id, { level: 2 });
      if (!task || task.empty || !task.hints.length) continue;
      if (task.answerMode !== AnswerCheck.MODE.NUMBER) continue;
      const first = task.hints[0];
      const answer = String(task.answer);
      if (answer.length < 2) continue;   // einstellige Zahlen kommen zufällig vor
      assert.ok(!new RegExp(`(^|\\D)${answer}(\\D|$)`).test(first),
        `${topic.id}: erste Hilfe nennt schon die Lösung (${first})`);
    }
  });
});

test('Zahlenraum bis 100 wird eingehalten', () => {
  const upTo100 = Topics.all().filter(t =>
    t.subject === 'math' && t.grade === 2 && t.id !== 'm2.zr1000');
  upTo100.forEach(topic => {
    for (let level = 1; level <= 3; level++) {
      for (let i = 0; i < 40; i++) {
        const task = Generators.create(topic.id, { level });
        if (!task || task.answerMode !== AnswerCheck.MODE.NUMBER) continue;
        // Geldbeträge stehen in Euro (z.B. 12,50), Sachaufgaben in Stück.
        // Geld in Euro, Sachaufgaben in Stück, Größen in cm/dag: eigene Grenzen.
        const bigger = ['m2.sachaufgaben', 'm2.laengen', 'm2.gewichte'];
        const limit = topic.id.indexOf('geld') >= 0 || bigger.includes(topic.id) ? 1000 : 100;
        assert.ok(Number(task.answer) <= limit,
          `${topic.id}: Lösung ${task.answer} liegt über ${limit}`);
      }
    }
  });
});

test('Additionen mit Zehnerübergang haben wirklich einen Übergang', () => {
  for (let level = 1; level <= 3; level++) {
    for (let i = 0; i < 60; i++) {
      const t = Generators.create('m2.addMitUebergang', { level });
      const m = t.signature.match(/^am-(\d+)\+(\d+)$/);
      assert.ok(m, 'Signatur unerwartet: ' + t.signature);
      const a = Number(m[1]), b = Number(m[2]);
      assert.ok((a % 10) + (b % 10) > 9,
        `kein Zehnerübergang bei ${a} + ${b}`);
      assert.ok(a + b <= 100, `${a} + ${b} über 100`);
    }
  }
});

test('Additionen ohne Zehnerübergang haben keinen Übergang', () => {
  for (let level = 1; level <= 3; level++) {
    for (let i = 0; i < 60; i++) {
      const t = Generators.create('m2.addOhneUebergang', { level });
      const m = t.signature.match(/^ao-(\d+)\+(\d+)$/);
      const a = Number(m[1]), b = Number(m[2]);
      assert.ok((a % 10) + (b % 10) <= 9,
        `unerwarteter Zehnerübergang bei ${a} + ${b}`);
      assert.ok(a + b <= 100, `${a} + ${b} über 100`);
    }
  }
});

test('Subtraktion mit Zehnerunterschreitung unterschreitet wirklich', () => {
  for (let level = 1; level <= 3; level++) {
    for (let i = 0; i < 60; i++) {
      const t = Generators.create('m2.subMitUebergang', { level });
      const m = t.signature.match(/^sm-(\d+)-(\d+)$/);
      const a = Number(m[1]), b = Number(m[2]);
      assert.ok((a % 10) < (b % 10) || b > a % 10,
        `keine Zehnerunterschreitung bei ${a} − ${b}`);
      assert.ok(a - b >= 0, `${a} − ${b} wird negativ`);
    }
  }
});

test('Subtraktion ohne Unterschreitung bleibt ohne Unterschreitung', () => {
  for (let level = 1; level <= 3; level++) {
    for (let i = 0; i < 60; i++) {
      const t = Generators.create('m2.subOhneUebergang', { level });
      const m = t.signature.match(/^so-(\d+)-(\d+)$/);
      const a = Number(m[1]), b = Number(m[2]);
      assert.ok((a % 10) >= (b % 10),
        `unerwartete Zehnerunterschreitung bei ${a} − ${b}`);
      assert.ok(a - b >= 0);
    }
  }
});

test('Malreihen liefern nur Aufgaben ihrer Reihe', () => {
  [2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(row => {
    const id = 'm2.reihe' + row;
    if (!Topics.get(id)) return;
    for (let level = 1; level <= 3; level++) {
      for (let i = 0; i < 30; i++) {
        const t = Generators.create(id, { level });
        assert.ok(t.signature.startsWith('mr' + row + '-'),
          `${id}: falsche Reihe in ${t.signature}`);
        const product = Number(t.answer);
        if (t.signature.includes('-miss-')) {
          assert.ok(product >= 1 && product <= 10, `${id}: Faktor ${product} außerhalb 1–10`);
        } else {
          assert.strictEqual(product % row, 0, `${id}: ${product} ist kein Vielfaches von ${row}`);
          assert.ok(product <= row * 10, `${id}: ${product} über der Reihe`);
        }
      }
    }
  });
});

test('gleicher Startwert erzeugt dieselbe Aufgabe', () => {
  Topics.all().forEach(topic => {
    const a = Generators.create(topic.id, { level: 2, seed: 12345 });
    const b = Generators.create(topic.id, { level: 2, seed: 12345 });
    assert.strictEqual(a.taskId, b.taskId, `${topic.id} ist nicht reproduzierbar`);
    assert.strictEqual(JSON.stringify(a.answer), JSON.stringify(b.answer),
      `${topic.id}: Lösung nicht reproduzierbar`);
  });
});

test('Aufgabenkennung unterscheidet verschiedene Rechnungen mit gleichem Ergebnis', () => {
  // 15 + 5 und 10 + 10 müssen unterschiedliche Kennungen haben.
  const seen = new Map();
  for (let i = 0; i < 400; i++) {
    const t = Generators.create('m2.addOhneUebergang', { level: 3 });
    const key = String(t.answer);
    if (!seen.has(key)) seen.set(key, new Set());
    seen.get(key).add(t.taskId);
  }
  const multi = Array.from(seen.values()).filter(s => s.size > 1);
  assert.ok(multi.length > 0,
    'Kennungen unterscheiden nicht zwischen Rechnungen mit gleichem Ergebnis');
});

test('Spiegelaufgaben haben eine nicht-leere, korrekte Lösung', () => {
  ['m2.symmetrie', 'p.spiegelraster'].forEach(id => {
    for (let i = 0; i < 20; i++) {
      const t = Generators.create(id, { level: 2 });
      assert.ok(Array.isArray(t.answer) && t.answer.length > 0, `${id}: leere Lösung`);
      const axis = t.input.axis;
      t.input.expected.forEach(([r, c]) => {
        assert.ok(c > axis, `${id}: erwartetes Feld liegt nicht rechts der Achse`);
      });
      // Jedes erwartete Feld hat ein Gegenstück links.
      const given = new Set(t.input.given.map(x => x.join(',')));
      t.input.expected.forEach(([r, c]) => {
        assert.ok(given.has(`${r},${2 * axis - c}`),
          `${id}: Spiegelpunkt ohne Vorlage`);
      });
    }
  });
});

test('Uhraufgaben mit 24-Stunden-Antwort nennen die Tageszeit', () => {
  for (let i = 0; i < 60; i++) {
    const t = Generators.create('m2.uhrVolleHalbe', { level: 3 });
    assert.ok(/Vormittag|Nachmittag|Abend/.test(t.prompt),
      'Tageszeitkontext fehlt: ' + t.prompt);
    assert.ok(/^\d{1,2}:\d{2} Uhr$/.test(t.answer), 'unerwartetes Antwortformat: ' + t.answer);
  }
});

test('Uhraufgaben ohne Tageszeit fragen nicht nach 24-Stunden-Zeit', () => {
  for (let level = 1; level <= 2; level++) {
    for (let i = 0; i < 40; i++) {
      const t = Generators.create('m2.uhrVolleHalbe', { level });
      assert.ok(!/Vormittag|Nachmittag|Abend/.test(t.prompt));
      assert.ok(/^(halb )?\d{1,2}( Uhr)?$/.test(t.answer), 'unerwartet: ' + t.answer);
      const hour = Number(String(t.answer).replace(/\D/g, ''));
      assert.ok(hour >= 1 && hour <= 12, 'Stunde außerhalb des Zifferblatts: ' + t.answer);
    }
  }
});

test('Auswahlantworten enthalten keine doppelten Optionen', () => {
  Topics.all().forEach(topic => {
    for (let level = 1; level <= 3; level++) {
      for (let i = 0; i < 20; i++) {
        const t = Generators.create(topic.id, { level });
        if (!t || t.input.kind !== 'choice') continue;
        const c = t.input.choices.map(String);
        assert.strictEqual(new Set(c).size, c.length,
          `${topic.id}: doppelte Auswahl ${JSON.stringify(c)}`);
        assert.ok(c.length >= 2, `${topic.id}: zu wenige Auswahlmöglichkeiten`);
      }
    }
  });
});
