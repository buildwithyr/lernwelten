/**
 * generators/misc-gen.js
 * Generatoren für Forscherlabor (Sachwissen) und Rätselhöhle (Logik).
 */

const MiscGen = (() => {

  const R = Util.randomInt;
  const F = Util.randomFrom;
  const S = Util.shuffle;

  // ══ Forscherlabor ═══════════════════════════════════════════════════════

  const knowledgeQuiz = {
    generate(ctx) {
      const { rng, level } = ctx;
      const all = ScienceData.KNOWLEDGE_QUESTIONS;
      const pool = level === 1
        ? all.filter(q => ['Tiere', 'Wetter'].includes(q[2]))
        : level === 2
          ? all.filter(q => ['Tiere', 'Natur', 'Wetter', 'Mensch'].includes(q[2]))
          : all;
      const q = F(pool.length >= 5 ? pool : all, rng);
      const [frage, antworten, bereich, emoji] = q;
      const correct = antworten[antworten.length - 1];
      const wrongExample = F(antworten.slice(0, -1), rng);
      return {
        signature: `kq-${frage}`,
        prompt: frage,
        questionHtml: `
          <div class="sci-topic-badge">${Util.escapeHtml(bereich)}</div>
          <div class="sci-emoji-img">${emoji}</div>
          <p class="q-label">${Util.escapeHtml(frage)}</p>`,
        input: { kind: 'choice', choices: S(antworten.slice(), rng) },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: correct,
        hints: [
          'Lies die Frage noch einmal genau.',
          `„${wrongExample}" ist es sicher nicht.`,
          `Richtig ist: ${correct}`,
        ],
      };
    },
  };

  const trueFalse = {
    generate(ctx) {
      const { rng, level } = ctx;
      const all = ScienceData.TRUE_FALSE_DATA;
      const pool = level === 1
        ? all.filter(x => ['Tiere', 'Wetter'].includes(x[2]))
        : level === 2
          ? all.filter(x => ['Tiere', 'Natur', 'Wetter', 'Mensch'].includes(x[2]))
          : all;
      const item = F(pool.length >= 5 ? pool : all, rng);
      const [text, isTrue, bereich] = item;
      return {
        signature: `tf-${text}`,
        prompt: text,
        questionHtml: `
          <div class="sci-topic-badge">${Util.escapeHtml(bereich)}</div>
          <p class="q-label">Stimmt das?</p>
          <p class="sentence-line">${Util.escapeHtml(text)}</p>`,
        input: { kind: 'choice', choices: ['Wahr', 'Falsch'] },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: isTrue ? 'Wahr' : 'Falsch',
        hints: [
          'Überlege in Ruhe: Hast du das schon einmal beobachtet?',
          isTrue ? 'Die Aussage stimmt so.' : 'An der Aussage stimmt etwas nicht.',
        ],
      };
    },
  };

  const matching = {
    generate(ctx) {
      const { rng } = ctx;
      const item = F(ScienceData.MATCHING_DATA, rng);
      const [thing, right, wrong] = item;
      return {
        signature: `mt-${thing}`,
        prompt: `Was gehört zu ${thing}?`,
        questionHtml: `
          <p class="q-label">Was gehört zu <strong>${Util.escapeHtml(thing)}</strong>?</p>`,
        input: { kind: 'choice', choices: S([right].concat(wrong), rng) },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: right,
        hints: ['Überlege, wozu das gehört.', `Denk an das Wichtigste an ${thing}.`],
      };
    },
  };

  // ══ Rätselhöhle ═════════════════════════════════════════════════════════

  const numberPattern = {
    generate(ctx) {
      const { rng, level } = ctx;
      const rules = level === 1
        ? [
            () => { const s = R(1, 8, rng), d = R(1, 2, rng); return { seq: [s, s + d, s + 2 * d, s + 3 * d], ans: s + 4 * d, hint: `Es geht immer +${d} weiter.` }; },
            () => { const s = R(9, 20, rng), d = R(1, 2, rng); return { seq: [s, s - d, s - 2 * d, s - 3 * d], ans: s - 4 * d, hint: `Es geht immer −${d} zurück.` }; },
          ]
        : level === 2
        ? [
            () => { const s = R(1, 5, rng), d = R(2, 3, rng); return { seq: [s, s + d, s + 2 * d, s + 3 * d], ans: s + 4 * d, hint: `Es geht immer +${d} weiter.` }; },
            () => { const s = R(10, 20, rng), d = R(2, 3, rng); return { seq: [s, s - d, s - 2 * d, s - 3 * d], ans: s - 4 * d, hint: `Es geht immer −${d} zurück.` }; },
          ]
        : [
            () => { const s = R(1, 2, rng); return { seq: [s, s * 2, s * 4, s * 8], ans: s * 16, hint: 'Jede Zahl wird verdoppelt.' }; },
            () => { const s = R(2, 6, rng), d = R(3, 5, rng); return { seq: [s, s + d, s + 2 * d, s + 3 * d], ans: s + 4 * d, hint: `Es geht immer +${d} weiter.` }; },
            () => { const s = R(20, 40, rng), d = R(3, 5, rng); return { seq: [s, s - d, s - 2 * d, s - 3 * d], ans: s - 4 * d, hint: `Es geht immer −${d} zurück.` }; },
          ];

      let result;
      let guard = 0;
      do { result = F(rules, rng)(); guard++; }
      while ((result.ans <= 0 || result.ans > 50) && guard < 20);
      if (result.ans <= 0 || result.ans > 50) result = { seq: [2, 4, 6, 8], ans: 10, hint: 'Es geht immer +2 weiter.' };

      return {
        signature: `np-${result.seq.join('_')}`,
        prompt: `Wie geht es weiter? ${result.seq.join(', ')}`,
        questionHtml: `<p class="q-label">Wie geht es weiter?</p>${Widgets.numberSequence(result.seq)}`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: result.ans,
        hints: [
          'Vergleiche zwei Zahlen nebeneinander: Wie groß ist der Sprung?',
          result.hint,
          `Die nächste Zahl ist ${result.ans}.`,
        ],
      };
    },
  };

  function buildShapePatterns(rng) {
    const SH = LogicData.SHAPES;
    const patterns = [];
    for (let i = 0; i < SH.length; i++) {
      for (let j = 0; j < SH.length; j++) {
        if (i === j) continue;
        const A = SH[i], B = SH[j];
        patterns.push([A, B, A, B, A, B]);
        patterns.push([A, A, B, A, A, B]);
        patterns.push([A, B, B, A, B, B]);
      }
    }
    for (let i = 0; i < SH.length; i++) {
      for (let j = 0; j < SH.length; j++) {
        for (let k = 0; k < SH.length; k++) {
          if (i === j || j === k || i === k) continue;
          patterns.push([SH[i], SH[j], SH[k], SH[i], SH[j], SH[k]]);
        }
      }
    }
    return patterns;
  }

  const shapePattern = {
    generate(ctx) {
      const { rng } = ctx;
      const patterns = buildShapePatterns(rng);
      const seq = F(patterns, rng);
      const answer = seq[seq.length - 1];
      const inSeq = Util.uniq(seq).filter(s => s !== answer);
      const outside = S(LogicData.SHAPES.filter(s => s !== answer && !inSeq.includes(s)), rng);
      const wrong = inSeq.concat(outside).slice(0, 2);
      return {
        signature: `sp-${seq.join('')}`,
        prompt: 'Welche Form kommt danach?',
        questionHtml: `
          <p class="q-label">Welche Form kommt danach?</p>
          ${Widgets.shapeSequence(seq, seq.length - 1)}`,
        input: { kind: 'choice', choices: S([answer].concat(wrong), rng) },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer,
        hints: [
          'Schau, wo sich das Muster wiederholt.',
          `Das Muster ist ${seq.slice(0, seq.length / 2).join(' ')} — und dann von vorne.`,
        ],
      };
    },
  };

  const oddOneOut = {
    generate(ctx) {
      const { rng } = ctx;
      const names = LogicData.GROUP_NAMES;
      let g1, g2, guard = 0;
      do {
        g1 = F(names, rng);
        g2 = F(names.filter(g => g !== g1 && LogicData.groupsCompatible(g1, g)), rng);
        guard++;
      } while (!g2 && guard < 20);
      if (!g2) g2 = names.find(g => g !== g1);
      const three = S(LogicData.WORD_GROUPS[g1], rng).slice(0, 3);
      const odd = F(LogicData.WORD_GROUPS[g2], rng);
      return {
        signature: `oo-${g1}-${odd}-${three.join('_')}`,
        prompt: 'Welches Wort passt nicht zu den anderen?',
        questionHtml: '<p class="q-label">Welches Wort passt <strong>nicht</strong> zu den anderen?</p>',
        input: { kind: 'choice', choices: S(three.concat([odd]), rng) },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: odd,
        hints: [
          'Drei Wörter gehören zur selben Gruppe.',
          `Drei davon sind ${g1}.`,
        ],
      };
    },
  };

  const memoryTask = {
    generate(ctx) {
      const { rng, level } = ctx;
      const showCount = level === 1 ? 3 : level === 2 ? 4 : 5;
      const group = F(LogicData.GROUP_NAMES, rng);
      const shown = S(LogicData.WORD_GROUPS[group], rng).slice(0, showCount);
      let notShown, guard = 0;
      do {
        const other = F(LogicData.GROUP_NAMES.filter(g => g !== group), rng);
        notShown = F(LogicData.WORD_GROUPS[other], rng);
        guard++;
      } while (shown.includes(notShown) && guard < 20);
      const choices = S(S(shown, rng).slice(0, 2).concat([notShown]), rng);
      return {
        signature: `mem-${shown.join('_')}-${notShown}`,
        prompt: `Merke dir: ${shown.join(', ')}`,
        questionHtml: '',
        input: {
          kind: 'memory',
          words: shown,
          seconds: level === 1 ? 6 : level === 2 ? 5 : 4,
          choices,
          question: 'Welches Wort war NICHT dabei?',
        },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: notShown,
        hints: ['Das gesuchte Wort stand nicht in der Liste.', `Alle gezeigten Wörter waren ${group}.`],
      };
    },
  };

  const BASE_GRID = [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1],
  ];

  const miniSudoku = {
    generate(ctx) {
      const { rng } = ctx;
      let g = BASE_GRID.map(r => r.slice());
      if (rng() < 0.5) { const t = g[0]; g[0] = g[1]; g[1] = t; }
      if (rng() < 0.5) { const t = g[2]; g[2] = g[3]; g[3] = t; }
      if (rng() < 0.5) g = g.map(r => [r[2], r[3], r[0], r[1]]);
      const perm = S([1, 2, 3, 4], rng);
      g = g.map(r => r.map(v => perm[v - 1]));

      const row = R(0, 3, rng), col = R(0, 3, rng);
      const answer = g[row][col];
      const puzzle = g.map(r => r.slice());
      puzzle[row][col] = 0;

      return {
        signature: `su-${g.map(r => r.join('')).join('')}-${row}${col}`,
        prompt: 'Welche Zahl fehlt im Zahlen-Quadrat?',
        questionHtml: `
          <p class="q-label">Welche Zahl fehlt?</p>
          <p class="q-sub">In jeder Zeile und in jeder Spalte kommt jede Zahl von 1 bis 4 genau einmal vor.</p>
          <div class="sudoku-wrap">${Widgets.sudokuGrid(puzzle, row, col)}</div>`,
        input: { kind: 'choice', choices: S([1, 2, 3, 4].map(String), rng) },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: String(answer),
        hints: [
          'Schau dir die Zeile mit dem Fragezeichen an.',
          'Welche Zahl von 1 bis 4 fehlt dort noch?',
          `Es ist die ${answer}.`,
        ],
      };
    },
  };

  const spiegelraster = {
    generate(ctx) {
      const { rng } = ctx;
      const p = F(LogicData.MIRROR_PATTERNS, rng);
      const axis = 2;
      const left = p.cells.filter(([r, c]) => c <= axis);
      const expected = left.filter(([r, c]) => c < axis).map(([r, c]) => [r, 2 * axis - c]);
      return {
        signature: `mir-${p.name}`,
        prompt: `Spiegle das Bild ${p.name} an der Mittellinie.`,
        questionHtml: `
          <p class="q-label">Spiegle das Bild an der Mittellinie.</p>
          <p class="q-sub">Tippe rechts die Felder an, die fehlen.</p>`,
        input: { kind: 'mirror', size: 5, axis, given: left, expected },
        answerMode: AnswerCheck.MODE.SET,
        answer: expected.map(c => c.join(',')),
        hints: [
          'Arbeite Zeile für Zeile.',
          'Ein Feld direkt neben der Mittellinie wird auf der anderen Seite auch direkt daneben gespiegelt.',
          'Zähle die Abstände zur Mittellinie.',
        ],
        tool: 'spiegel',
      };
    },
  };

  return {
    knowledgeQuiz, trueFalse, matching,
    numberPattern, shapePattern, oddOneOut, memoryTask, miniSudoku, spiegelraster,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MiscGen;
