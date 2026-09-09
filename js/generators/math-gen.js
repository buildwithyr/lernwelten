/**
 * generators/math-gen.js
 * Fachliche Aufgabengeneratoren für Mathematik.
 *
 * Ein Generator bekommt `ctx = { level, rng, seed }` und liefert eine Aufgabe:
 *   {
 *     signature   stabiler Teil der Aufgabenkennung (z.B. "34+5")
 *     prompt      kurze Anweisung als reiner Text (Vorlesen, Screenreader)
 *     questionHtml
 *     input       { kind, ... }  siehe ui/taskview.js
 *     answerMode  siehe AnswerCheck.MODE
 *     answer, accept
 *     hints       gestufte Hinweise; der letzte darf den Rechenweg zeigen
 *     tool        Schlüssel für Oskars Werkzeugkiste (optional)
 *   }
 *
 * Grundsätze:
 *  • Schwierigkeit heißt NICHT einfach "größere Zahlen". Sie unterscheidet
 *    Anforderungen: mit/ohne Zehnerübergang, Stützpunkte, Anzahl Schritte.
 *  • "Bis 100" (Zahlenraum) und "mit Zehnerübergang" (Anforderung) sind
 *    getrennte Einstellungen, siehe eigene Themen.
 *  • Jede Aufgabe hat genau eine richtige Lösung.
 */

const MathGen = (() => {

  const R = Util.randomInt;
  const F = Util.randomFrom;
  const S = Util.shuffle;

  function ones(n) { return n % 10; }
  function tens(n) { return Math.floor(n / 10); }

  /** Erzeugt drei Auswahlantworten aus einer richtigen Zahl. */
  function numberChoices(correct, rng, spread) {
    const sp = spread || 1;
    const set = new Set([correct]);
    let guard = 0;
    while (set.size < 3 && guard++ < 40) {
      const delta = F([-2, -1, 1, 2, 10, -10], rng) * sp;
      const cand = correct + delta;
      if (cand >= 0) set.add(cand);
    }
    return S(Array.from(set), rng).map(String);
  }

  // ══ Zahlenraum ══════════════════════════════════════════════════════════

  const stellenwert = {
    generate(ctx) {
      const { rng, level } = ctx;
      // Stufe 1: Zahl → Zehner/Einer · 2: Zehner/Einer → Zahl · 3: gemischt mit Sprechweise
      const n = level === 1 ? R(11, 99, rng) : R(21, 99, rng);
      const t = tens(n), o = ones(n);
      const mode = level === 1 ? 'split' : (level === 2 ? (rng() < 0.5 ? 'split' : 'join') : F(['split', 'join', 'value'], rng));

      if (mode === 'join') {
        return {
          signature: `join-${t}-${o}`,
          prompt: `${t} Zehner und ${o} Einer — welche Zahl ist das?`,
          questionHtml: `
            <p class="q-label">Welche Zahl ist das?</p>
            ${Widgets.tenBlocks(t, o)}
            <p class="q-sub">${t} ${Util.plural(t, 'Zehner', 'Zehner')} und ${o} ${Util.plural(o, 'Einer', 'Einer')}</p>`,
          input: { kind: 'number', max: 100 },
          answerMode: AnswerCheck.MODE.NUMBER,
          answer: n,
          hints: [
            'Zähle zuerst die Zehnerstangen, dann die einzelnen Punkte.',
            `${t} Zehner sind ${t * 10}.`,
            `${t * 10} und ${o} macht zusammen ${n}.`,
          ],
          tool: 'zehnerstangen',
        };
      }

      if (mode === 'value') {
        const askTens = rng() < 0.5;
        const correct = askTens ? t * 10 : o;
        // Ablenker müssen sich von der Lösung und voneinander unterscheiden.
        const distractors = [];
        [t, o, t * 10, o * 10, correct + 1].forEach(v => {
          if (v !== correct && v >= 0 && distractors.indexOf(v) === -1) distractors.push(v);
        });
        const choices = S([correct].concat(distractors.slice(0, 2)), rng).map(String);
        return {
          signature: `value-${n}-${askTens ? 'z' : 'e'}`,
          prompt: `Welchen Wert hat die ${askTens ? 'erste' : 'zweite'} Ziffer von ${n}?`,
          questionHtml: `
            <p class="q-label">Die Zahl <strong>${n}</strong>: Welchen Wert hat die ${askTens ? 'vordere' : 'hintere'} Ziffer?</p>`,
          input: { kind: 'choice', choices },
          answerMode: AnswerCheck.MODE.CHOICE,
          answer: String(correct),
          hints: [
            'Die vordere Ziffer zählt die Zehner, die hintere die Einer.',
            askTens ? `Die ${t} steht für ${t} Zehner.` : `Die ${o} steht für ${o} Einer.`,
          ],
          tool: 'zehnerstangen',
        };
      }

      return {
        signature: `split-${n}`,
        prompt: `${n} hat wie viele Zehner und wie viele Einer?`,
        questionHtml: `
          <p class="q-label">Zerlege die Zahl:</p>
          <p class="math-eq"><strong>${n}</strong></p>
          <p class="q-sub">Wie viele Zehner? Wie viele Einer?</p>`,
        input: { kind: 'fields', labels: ['Zehner', 'Einer'], max: 9 },
        answerMode: AnswerCheck.MODE.FIELDS,
        fieldMode: AnswerCheck.MODE.NUMBER,
        answer: [t, o],
        hints: [
          'Die vordere Ziffer sagt dir die Zehner, die hintere die Einer.',
          `Lege ${n} mit Zehnerstangen: Wie viele Stangen brauchst du?`,
          `${n} = ${t} Zehner und ${o} Einer.`,
        ],
        tool: 'zehnerstangen',
      };
    },
  };

  const buendeln = {
    generate(ctx) {
      const { rng, level } = ctx;
      const max = level === 1 ? 40 : level === 2 ? 70 : 99;
      const n = R(12, max, rng);
      const t = tens(n), o = ones(n);
      return {
        signature: `buendel-${n}`,
        prompt: `Wie viele Zehnerbündel kannst du aus ${n} machen?`,
        questionHtml: `
          <p class="q-label">Hier sind <strong>${n}</strong> Plättchen.</p>
          <p class="q-sub">Immer 10 Plättchen werden zu einem Zehner gebündelt.</p>
          ${Widgets.dotGrid(Math.min(n, 60), { label: n + ' Plättchen' })}
          <p class="q-sub">Wie viele Zehner und wie viele einzelne Plättchen bleiben?</p>`,
        input: { kind: 'fields', labels: ['Zehner', 'einzelne'], max: 9 },
        answerMode: AnswerCheck.MODE.FIELDS,
        fieldMode: AnswerCheck.MODE.NUMBER,
        answer: [t, o],
        hints: [
          'Zähle immer bis 10 — das ist ein Bündel.',
          `Aus ${n} kannst du ${t} volle Zehner machen.`,
          `${n} = ${t} Zehner und ${o} einzelne.`,
        ],
        tool: 'zehnerstangen',
      };
    },
  };

  const hunderterfeld = {
    generate(ctx) {
      const { rng, level } = ctx;
      const n = level === 1 ? R(1, 100, rng) : R(11, 100, rng);
      const ask = level >= 2 && rng() < 0.5 ? 'neighbour' : 'read';

      if (ask === 'neighbour') {
        const dir = F(['darunter', 'darüber'], rng);
        const base = dir === 'darunter' ? Math.min(n, 90) : Math.max(n, 11);
        const answer = dir === 'darunter' ? base + 10 : base - 10;
        return {
          signature: `hf-nb-${base}-${dir}`,
          prompt: `Welche Zahl steht im Hunderterfeld ${dir} von ${base}?`,
          questionHtml: `
            <p class="q-label">Welche Zahl steht im Hunderterfeld <strong>${dir}</strong> von ${base}?</p>
            ${Widgets.hundredField(base)}`,
          input: { kind: 'number', max: 100 },
          answerMode: AnswerCheck.MODE.NUMBER,
          answer,
          hints: [
            'Eine Zeile weiter unten ist ein Zehner mehr, eine Zeile weiter oben ein Zehner weniger.',
            `${base} ${dir === 'darunter' ? '+ 10' : '− 10'} rechnen.`,
            `Die Zahl ist ${answer}.`,
          ],
          tool: 'hunderterfeld',
        };
      }

      return {
        signature: `hf-read-${n}`,
        prompt: 'Welche Zahl ist im Hunderterfeld markiert?',
        questionHtml: `
          <p class="q-label">Welche Zahl ist markiert?</p>
          ${Widgets.hundredField(n, { hideMarkNumber: true })}`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: n,
        hints: [
          'Zähle zuerst die vollen Zeilen — jede Zeile sind 10.',
          `Die Zahl liegt in der ${tens(n === 100 ? 99 : n) + 1}. Zeile.`,
          `Es ist die ${n}.`,
        ],
        tool: 'hunderterfeld',
      };
    },
  };

  const zahlenstrahl = {
    generate(ctx) {
      const { rng, level } = ctx;
      // Stufe 1: Vielfache von 10 · 2: Vielfache von 5 · 3: beliebige Zahlen
      const from = 0, to = 100;
      const value = level === 1 ? R(1, 9, rng) * 10
                  : level === 2 ? R(1, 19, rng) * 5
                  : R(1, 99, rng);
      return {
        signature: `zs-${value}`,
        prompt: 'Welche Zahl zeigt der Pfeil am Zahlenstrahl?',
        questionHtml: `
          <p class="q-label">Welche Zahl zeigt der Pfeil?</p>
          ${Widgets.numberLine(from, to, { step: 10, mark: value })}`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: value,
        hints: [
          'Schau, zwischen welchen beiden Zehnern der Pfeil steht.',
          `Der Pfeil liegt zwischen ${Math.floor(value / 10) * 10} und ${Math.floor(value / 10) * 10 + 10}.`,
          `Es ist die ${value}.`,
        ],
        tool: 'zahlenstrahl',
      };
    },
  };

  const vergleichen = {
    generate(ctx) {
      const { rng, level } = ctx;
      let a, b;
      if (level === 1) { a = R(1, 9, rng) * 10; b = R(1, 9, rng) * 10; }
      else if (level === 2) { a = R(10, 99, rng); b = R(10, 99, rng); }
      else {
        // Gleiche Zehner, damit die Einer entscheiden.
        const t = R(2, 9, rng);
        a = t * 10 + R(0, 9, rng);
        b = t * 10 + R(0, 9, rng);
      }
      if (a === b) b = a + 1 <= 100 ? a + 1 : a - 1;
      const answer = a > b ? '>' : '<';
      return {
        signature: `cmp-${a}-${b}`,
        prompt: `Was gehört zwischen ${a} und ${b}: größer oder kleiner?`,
        questionHtml: `
          <p class="q-label">Welches Zeichen passt?</p>
          <p class="math-eq">${a} <span class="math-blank">?</span> ${b}</p>
          <p class="q-sub">Das Zeichen zeigt immer auf die kleinere Zahl.</p>`,
        input: { kind: 'choice', choices: S(['<', '>'], rng) },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer,
        hints: [
          'Vergleiche zuerst die Zehner. Sind sie gleich, entscheiden die Einer.',
          `${a} hat ${tens(a)} Zehner, ${b} hat ${tens(b)} Zehner.`,
          `${a} ist ${a > b ? 'größer' : 'kleiner'} als ${b}.`,
        ],
        tool: 'zahlenstrahl',
      };
    },
  };

  const nachbarzahlen = {
    generate(ctx) {
      const { rng, level } = ctx;
      const n = R(11, 98, rng);
      const kind = level === 1 ? F(['vor', 'nach'], rng)
                 : level === 2 ? F(['vor', 'nach', 'beide'], rng)
                 : F(['beide', 'zehner'], rng);

      if (kind === 'zehner') {
        const lower = Math.floor(n / 10) * 10;
        const upper = lower + 10;
        return {
          signature: `nbz-${n}`,
          prompt: `Zwischen welchen Zehnern liegt ${n}?`,
          questionHtml: `
            <p class="q-label">Zwischen welchen Zehnern liegt <strong>${n}</strong>?</p>
            ${Widgets.numberLine(lower - 10 < 0 ? 0 : lower - 10, Math.min(100, upper + 10), { step: 10, mark: n, markLabel: String(n) })}`,
          input: { kind: 'fields', labels: ['Zehner davor', 'Zehner danach'], max: 100 },
          answerMode: AnswerCheck.MODE.FIELDS,
          fieldMode: AnswerCheck.MODE.NUMBER,
          answer: [lower, upper],
          hints: [
            'Die Zehner sind 10, 20, 30 …',
            `${n} liegt zwischen zwei davon.`,
            `${lower} und ${upper}.`,
          ],
          tool: 'zahlenstrahl',
        };
      }

      if (kind === 'beide') {
        return {
          signature: `nb-both-${n}`,
          prompt: `Nenne Vorgänger und Nachfolger von ${n}.`,
          questionHtml: `
            <p class="q-label">Wie heißen die Nachbarzahlen von <strong>${n}</strong>?</p>`,
          input: { kind: 'fields', labels: ['Vorgänger', 'Nachfolger'], max: 100 },
          answerMode: AnswerCheck.MODE.FIELDS,
          fieldMode: AnswerCheck.MODE.NUMBER,
          answer: [n - 1, n + 1],
          hints: [
            'Der Vorgänger kommt davor, der Nachfolger danach.',
            'Rechne einmal −1 und einmal +1.',
            `${n - 1} und ${n + 1}.`,
          ],
        };
      }

      const answer = kind === 'vor' ? n - 1 : n + 1;
      return {
        signature: `nb-${kind}-${n}`,
        prompt: `Wie heißt der ${kind === 'vor' ? 'Vorgänger' : 'Nachfolger'} von ${n}?`,
        questionHtml: `
          <p class="q-label">Wie heißt der <strong>${kind === 'vor' ? 'Vorgänger' : 'Nachfolger'}</strong> von ${n}?</p>`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer,
        hints: [
          kind === 'vor' ? 'Der Vorgänger ist eine Zahl weniger.' : 'Der Nachfolger ist eine Zahl mehr.',
          `Rechne ${n} ${kind === 'vor' ? '− 1' : '+ 1'}.`,
        ],
      };
    },
  };

  const geradeUngerade = {
    generate(ctx) {
      const { rng, level } = ctx;
      const n = level === 1 ? R(1, 20, rng) : R(10, 99, rng);
      const isEven = n % 2 === 0;
      return {
        signature: `gu-${n}`,
        prompt: `Ist ${n} gerade oder ungerade?`,
        questionHtml: `
          <p class="q-label">Ist die Zahl <strong>${n}</strong> gerade oder ungerade?</p>
          <p class="q-sub">Gerade Zahlen kann man in zwei gleiche Hälften teilen.</p>`,
        input: { kind: 'choice', choices: ['gerade', 'ungerade'] },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: isEven ? 'gerade' : 'ungerade',
        hints: [
          'Schau nur auf die letzte Ziffer.',
          'Endet die Zahl auf 0, 2, 4, 6 oder 8, ist sie gerade.',
          `${n} endet auf ${ones(n)} — also ${isEven ? 'gerade' : 'ungerade'}.`,
        ],
      };
    },
  };

  // ══ Plus und Minus ══════════════════════════════════════════════════════

  const addZehner = {
    generate(ctx) {
      const { rng, level } = ctx;
      const a = level === 1 ? R(1, 8, rng) * 10 : R(11, 79, rng);
      const maxT = Math.floor((100 - a) / 10);
      const b = R(1, Math.max(1, maxT), rng) * 10;
      return {
        signature: `az-${a}+${b}`,
        prompt: `${a} plus ${b}`,
        questionHtml: `<p class="q-label">Rechne:</p>${Widgets.equation([a, '+', b, '=', '?'])}`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: a + b,
        hints: [
          'Die Einer bleiben gleich — es kommen nur Zehner dazu.',
          `${tens(a)} Zehner + ${tens(b)} Zehner = ${tens(a) + tens(b)} Zehner.`,
          `${a} + ${b} = ${a + b}.`,
        ],
        tool: 'hunderterfeld',
      };
    },
  };

  const addOhneUebergang = {
    generate(ctx) {
      const { rng, level } = ctx;
      let a, b;
      if (level === 1) {
        // ZE + E ohne Übergang
        a = R(2, 9, rng) * 10 + R(0, 5, rng);
        b = R(1, 9 - ones(a), rng);
      } else if (level === 2) {
        // ZE + ZE, Einer ohne Übergang
        a = R(1, 7, rng) * 10 + R(0, 5, rng);
        const maxT = Math.floor((99 - a) / 10);
        b = R(1, Math.max(1, maxT), rng) * 10 + R(0, 9 - ones(a), rng);
      } else {
        a = R(2, 6, rng) * 10 + R(0, 4, rng);
        const maxT = Math.floor((99 - a) / 10);
        b = R(2, Math.max(2, maxT), rng) * 10 + R(1, Math.max(1, 9 - ones(a)), rng);
      }
      if (ones(a) + ones(b) > 9 || a + b > 100) { b = b - ones(b); }
      return {
        signature: `ao-${a}+${b}`,
        prompt: `${a} plus ${b}`,
        questionHtml: `<p class="q-label">Rechne:</p>${Widgets.equation([a, '+', b, '=', '?'])}`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: a + b,
        hints: [
          'Rechne zuerst die Zehner, dann die Einer.',
          `${tens(a) * 10} + ${tens(b) * 10} = ${(tens(a) + tens(b)) * 10}, dann ${ones(a)} + ${ones(b)} = ${ones(a) + ones(b)}.`,
          `${a} + ${b} = ${a + b}.`,
        ],
        tool: 'hunderterfeld',
      };
    },
  };

  const addMitUebergang = {
    generate(ctx) {
      const { rng, level } = ctx;
      // Immer mit Zehnerübergang — das ist die Anforderung dieses Themas.
      let a, b;
      if (level === 1) {
        a = R(1, 8, rng) * 10 + R(5, 9, rng);   // ZE
        b = R(10 - ones(a) + 1, 9, rng);        // E, erzwingt Übergang
      } else if (level === 2) {
        a = R(1, 7, rng) * 10 + R(4, 9, rng);
        b = R(10 - ones(a) + 1, 9, rng) + R(0, 2, rng) * 10;
      } else {
        a = R(1, 6, rng) * 10 + R(3, 9, rng);
        b = R(10 - ones(a) + 1, 9, rng) + R(1, 3, rng) * 10;
      }
      if (a + b > 100) b = b - 10;
      const nextTen = (tens(a) + 1) * 10;
      const step1 = nextTen - a;
      const step2 = b - step1;
      return {
        signature: `am-${a}+${b}`,
        prompt: `${a} plus ${b}`,
        questionHtml: `<p class="q-label">Rechne über den Zehner:</p>${Widgets.equation([a, '+', b, '=', '?'])}`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: a + b,
        hints: [
          'Gehe zuerst bis zum nächsten Zehner.',
          `${a} + ${step1} = ${nextTen}. Wie viel bleibt dann noch von ${b} übrig?`,
          `${nextTen} + ${step2} = ${a + b}.`,
        ],
        tool: 'hunderterfeld',
      };
    },
  };

  const subZehner = {
    generate(ctx) {
      const { rng, level } = ctx;
      const a = level === 1 ? R(2, 9, rng) * 10 : R(21, 99, rng);
      const b = R(1, tens(a), rng) * 10;
      return {
        signature: `sz-${a}-${b}`,
        prompt: `${a} minus ${b}`,
        questionHtml: `<p class="q-label">Rechne:</p>${Widgets.equation([a, '−', b, '=', '?'])}`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: a - b,
        hints: [
          'Die Einer bleiben gleich — es gehen nur Zehner weg.',
          `${tens(a)} Zehner − ${tens(b)} Zehner = ${tens(a) - tens(b)} Zehner.`,
          `${a} − ${b} = ${a - b}.`,
        ],
        tool: 'hunderterfeld',
      };
    },
  };

  const subOhneUebergang = {
    generate(ctx) {
      const { rng, level } = ctx;
      let a, b;
      if (level === 1) {
        a = R(2, 9, rng) * 10 + R(4, 9, rng);
        b = R(1, ones(a), rng);
      } else if (level === 2) {
        a = R(3, 9, rng) * 10 + R(3, 9, rng);
        b = R(1, tens(a) - 1, rng) * 10 + R(0, ones(a), rng);
      } else {
        a = R(4, 9, rng) * 10 + R(2, 9, rng);
        b = R(2, tens(a) - 1, rng) * 10 + R(1, ones(a), rng);
      }
      return {
        signature: `so-${a}-${b}`,
        prompt: `${a} minus ${b}`,
        questionHtml: `<p class="q-label">Rechne:</p>${Widgets.equation([a, '−', b, '=', '?'])}`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: a - b,
        hints: [
          'Nimm zuerst die Zehner weg, dann die Einer.',
          `${a} − ${tens(b) * 10} = ${a - tens(b) * 10}, dann noch − ${ones(b)}.`,
          `${a} − ${b} = ${a - b}.`,
        ],
        tool: 'hunderterfeld',
      };
    },
  };

  const subMitUebergang = {
    generate(ctx) {
      const { rng, level } = ctx;
      let a, b;
      if (level === 1) {
        a = R(2, 9, rng) * 10 + R(1, 5, rng);
        b = R(ones(a) + 1, 9, rng);
      } else if (level === 2) {
        a = R(3, 9, rng) * 10 + R(1, 6, rng);
        b = R(ones(a) + 1, 9, rng) + R(0, 2, rng) * 10;
      } else {
        a = R(4, 9, rng) * 10 + R(1, 6, rng);
        b = R(ones(a) + 1, 9, rng) + R(1, 3, rng) * 10;
      }
      if (b >= a) b = ones(a) + 1;
      const prevTen = tens(a) * 10;
      const step1 = a - prevTen;
      const step2 = b - step1;
      return {
        signature: `sm-${a}-${b}`,
        prompt: `${a} minus ${b}`,
        questionHtml: `<p class="q-label">Rechne über den Zehner zurück:</p>${Widgets.equation([a, '−', b, '=', '?'])}`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: a - b,
        hints: [
          'Gehe zuerst bis zum Zehner zurück.',
          `${a} − ${step1} = ${prevTen}. Wie viel musst du dann noch wegnehmen?`,
          `${prevTen} − ${step2} = ${a - b}.`,
        ],
        tool: 'hunderterfeld',
      };
    },
  };

  const ergaenzenZehner = {
    generate(ctx) {
      const { rng, level } = ctx;
      const a = level === 1 ? R(1, 4, rng) * 10 + R(1, 9, rng) : R(1, 9, rng) * 10 + R(1, 9, rng);
      const target = (tens(a) + 1) * 10;
      return {
        signature: `ez-${a}`,
        prompt: `${a} plus wie viel ergibt ${target}?`,
        questionHtml: `<p class="q-label">Ergänze zum nächsten Zehner:</p>${Widgets.equation([a, '+', '?', '=', target])}`,
        input: { kind: 'number', max: 10 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: target - a,
        hints: [
          'Wie weit ist es von der Einerstelle bis zur 10?',
          `${ones(a)} + ? = 10`,
          `${a} + ${target - a} = ${target}.`,
        ],
        tool: 'zahlenstrahl',
      };
    },
  };

  const ergaenzenHundert = {
    generate(ctx) {
      const { rng, level } = ctx;
      const a = level === 1 ? R(1, 9, rng) * 10
              : level === 2 ? R(1, 19, rng) * 5
              : R(11, 98, rng);
      const nextTen = ones(a) === 0 ? a : (tens(a) + 1) * 10;
      return {
        signature: `eh-${a}`,
        prompt: `${a} plus wie viel ergibt 100?`,
        questionHtml: `<p class="q-label">Ergänze auf 100:</p>${Widgets.equation([a, '+', '?', '=', 100])}`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: 100 - a,
        hints: [
          'Gehe in zwei Schritten: zuerst zum nächsten Zehner, dann bis 100.',
          ones(a) === 0
            ? `Von ${a} bis 100 sind es ganze Zehner.`
            : `${a} + ${nextTen - a} = ${nextTen}. Und von ${nextTen} bis 100?`,
          `${a} + ${100 - a} = 100.`,
        ],
        tool: 'hunderterfeld',
      };
    },
  };

  const umkehrPlusMinus = {
    generate(ctx) {
      const { rng, level } = ctx;
      const isPlus = rng() < 0.5;
      const max = level === 1 ? 20 : level === 2 ? 50 : 100;
      if (isPlus) {
        const result = R(10, max, rng);
        const b = R(1, Math.min(9, result - 1), rng);
        const a = result - b;
        const hideFirst = rng() < 0.5;
        return {
          signature: `up-${a}+${b}-${hideFirst ? 'a' : 'b'}`,
          prompt: 'Welche Zahl fehlt?',
          questionHtml: `<p class="q-label">Welche Zahl fehlt?</p>${
            Widgets.equation([hideFirst ? '?' : a, '+', hideFirst ? b : '?', '=', result])}`,
          input: { kind: 'number', max: 100 },
          answerMode: AnswerCheck.MODE.NUMBER,
          answer: hideFirst ? a : b,
          hints: [
            'Die Umkehrung von Plus ist Minus.',
            `Rechne ${result} − ${hideFirst ? b : a}.`,
            `Die fehlende Zahl ist ${hideFirst ? a : b}.`,
          ],
        };
      }
      const a = R(20, max, rng);
      const b = R(1, Math.min(9, a - 1), rng);
      const result = a - b;
      const hideFirst = rng() < 0.5;
      return {
        signature: `um-${a}-${b}-${hideFirst ? 'a' : 'b'}`,
        prompt: 'Welche Zahl fehlt?',
        questionHtml: `<p class="q-label">Welche Zahl fehlt?</p>${
          Widgets.equation([hideFirst ? '?' : a, '−', hideFirst ? b : '?', '=', result])}`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: hideFirst ? a : b,
        hints: [
          'Denke rückwärts: Was stand am Anfang?',
          hideFirst ? `Rechne ${result} + ${b}.` : `Rechne ${a} − ${result}.`,
          `Die fehlende Zahl ist ${hideFirst ? a : b}.`,
        ],
      };
    },
  };

  const rechenmauer = {
    generate(ctx) {
      const { rng, level } = ctx;
      if (level === 1) {
        const a = R(1, 9, rng), b = R(1, 9, rng);
        const top = a + b;
        return {
          signature: `rm2-${a}-${b}`,
          prompt: 'Welche Zahl gehört auf den obersten Stein?',
          questionHtml: `
            <p class="q-label">Welche Zahl gehört oben hin?</p>
            <p class="q-sub">Zwei Steine nebeneinander werden zusammengezählt.</p>
            ${Widgets.pyramid([[a, b], ['?']], [[1, 0]])}`,
          input: { kind: 'number', max: 100 },
          answerMode: AnswerCheck.MODE.NUMBER,
          answer: top,
          hints: ['Zähle die beiden unteren Steine zusammen.', `${a} + ${b} = ${top}.`],
        };
      }
      const a = R(1, 9, rng), b = R(1, 9, rng), c = R(1, 9, rng);
      const m1 = a + b, m2 = b + c, top = m1 + m2;
      if (level === 2) {
        return {
          signature: `rm3-${a}-${b}-${c}-top`,
          prompt: 'Welche Zahl gehört auf den obersten Stein?',
          questionHtml: `
            <p class="q-label">Welche Zahl gehört ganz oben hin?</p>
            <p class="q-sub">Zwei Steine nebeneinander werden zusammengezählt.</p>
            ${Widgets.pyramid([[a, b, c], [m1, m2], ['?']], [[2, 0]])}`,
          input: { kind: 'number', max: 100 },
          answerMode: AnswerCheck.MODE.NUMBER,
          answer: top,
          hints: ['Die mittlere Reihe ist schon da.', `${m1} + ${m2} = ${top}.`],
        };
      }
      // Stufe 3: ein Stein in der untersten Reihe fehlt
      return {
        signature: `rm3-${a}-${b}-${c}-mid`,
        prompt: 'Welche Zahl fehlt in der unteren Reihe?',
        questionHtml: `
          <p class="q-label">Welche Zahl fehlt unten?</p>
          <p class="q-sub">Zwei Steine nebeneinander werden zusammengezählt.</p>
          ${Widgets.pyramid([[a, '?', c], [m1, m2], [top]], [[0, 1]])}`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: b,
        hints: [
          'Schau dir den Stein darüber an.',
          `${m1} − ${a} = ?`,
          `Die fehlende Zahl ist ${b}.`,
        ],
      };
    },
  };

  const rechenweg = {
    generate(ctx) {
      const { rng, level } = ctx;
      const a = R(2, 8, rng) * 10 + R(4, 9, rng);
      const b = R(10 - ones(a) + 1, 9, rng);
      const nextTen = (tens(a) + 1) * 10;
      const step1 = nextTen - a;
      const step2 = b - step1;
      const correct = a + b;
      // Ein Rechenweg wird gezeigt; in der Hälfte der Fälle mit Fehler.
      const hasError = rng() < 0.5;
      const shownResult = hasError ? correct + F([1, -1, 10], rng) : correct;
      const wayHtml = `
        <div class="calc-way">
          <div class="cw-step">${a} + ${step1} = ${nextTen}</div>
          <div class="cw-step">${nextTen} + ${step2} = ${shownResult}</div>
        </div>`;
      return {
        signature: `rw-${a}+${b}-${hasError ? 'err' : 'ok'}-${shownResult}`,
        prompt: 'Stimmt dieser Rechenweg?',
        questionHtml: `
          <p class="q-label">Jemand rechnet <strong>${a} + ${b}</strong> so:</p>
          ${wayHtml}
          <p class="q-sub">Stimmt der Rechenweg?</p>`,
        input: { kind: 'choice', choices: ['Ja, das stimmt', 'Nein, da ist ein Fehler'] },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: hasError ? 'Nein, da ist ein Fehler' : 'Ja, das stimmt',
        hints: [
          'Rechne selbst nach: zuerst bis zum Zehner, dann weiter.',
          `${a} + ${step1} = ${nextTen}, dann ${nextTen} + ${step2}.`,
          `Richtig wäre ${correct}.`,
        ],
        tool: 'hunderterfeld',
      };
    },
  };

  const doubleHalf = {
    generate(ctx) {
      const { rng, level } = ctx;
      const isDouble = rng() < 0.5;
      if (isDouble) {
        const n = level === 1 ? R(1, 10, rng) : level === 2 ? R(5, 25, rng) : R(11, 50, rng);
        return {
          signature: `dbl-${n}`,
          prompt: `Was ist das Doppelte von ${n}?`,
          questionHtml: `<p class="q-label">Verdopple die Zahl:</p>${Widgets.equation(['Das Doppelte von', n, 'ist', '?'])}`,
          input: { kind: 'number', max: 100 },
          answerMode: AnswerCheck.MODE.NUMBER,
          answer: n * 2,
          hints: [
            'Verdoppeln heißt: die Zahl zu sich selbst dazuzählen.',
            `Rechne ${n} + ${n}.`,
            `Das Doppelte von ${n} ist ${n * 2}.`,
          ],
        };
      }
      const half = level === 1 ? R(1, 10, rng) : level === 2 ? R(5, 25, rng) : R(11, 50, rng);
      const n = half * 2;
      return {
        signature: `hlf-${n}`,
        prompt: `Was ist die Hälfte von ${n}?`,
        questionHtml: `<p class="q-label">Halbiere die Zahl:</p>${Widgets.equation(['Die Hälfte von', n, 'ist', '?'])}`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: half,
        hints: [
          'Halbieren heißt: in zwei gleich große Teile teilen.',
          `Welche Zahl plus sich selbst ergibt ${n}?`,
          `Die Hälfte von ${n} ist ${half}.`,
        ],
      };
    },
  };

  const numberSeries = {
    generate(ctx) {
      const { rng, level } = ctx;
      const step = level === 1 ? F([10, 5], rng) : level === 2 ? F([2, 5, 10], rng) : F([3, 4, 6, 25], rng);
      const up = rng() < 0.7;
      let start;
      if (up) start = R(0, Math.max(1, Math.floor((100 - step * 4) / step)), rng) * step;
      else start = R(4, Math.floor(100 / step), rng) * step;
      const seq = [0, 1, 2, 3].map(i => up ? start + i * step : start - i * step);
      const answer = up ? start + 4 * step : start - 4 * step;
      if (answer < 0 || answer > 100) return numberSeries.generate({ rng, level: 1 });
      return {
        signature: `ns-${start}-${up ? '+' : '-'}${step}`,
        prompt: 'Wie geht die Zahlenreihe weiter?',
        questionHtml: `<p class="q-label">Wie geht es weiter?</p>${Widgets.numberSequence(seq)}`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer,
        hints: [
          'Schau, wie groß der Abstand zwischen zwei Zahlen ist.',
          `Es geht immer ${up ? '+' : '−'}${step} weiter.`,
          `${seq[3]} ${up ? '+' : '−'} ${step} = ${answer}.`,
        ],
        tool: 'zahlenstrahl',
      };
    },
  };

  // ══ Malnehmen und Teilen ════════════════════════════════════════════════

  const GROUP_THEMES = [
    { emoji: '🍎', container: '🍽️', name: 'Äpfel', place: 'Teller' },
    { emoji: '🌸', container: '🏺', name: 'Blumen', place: 'Vasen' },
    { emoji: '🍬', container: '🧺', name: 'Bonbons', place: 'Körbe' },
    { emoji: '⚽', container: '📦', name: 'Bälle', place: 'Kisten' },
    { emoji: '🐟', container: '🪣', name: 'Fische', place: 'Kübel' },
  ];

  const malGruppen = {
    generate(ctx) {
      const { rng, level } = ctx;
      const theme = F(GROUP_THEMES, rng);
      const count = level === 1 ? R(2, 4, rng) : level === 2 ? R(2, 6, rng) : R(3, 8, rng);
      const each = level === 1 ? R(2, 3, rng) : level === 2 ? R(2, 5, rng) : R(3, 9, rng);
      const total = count * each;
      const asEquation = level >= 2 && rng() < 0.4;

      if (asEquation) {
        return {
          signature: `mg-eq-${count}x${each}`,
          prompt: `Welche Malaufgabe passt zu ${count} ${theme.place} mit je ${each} ${theme.name}?`,
          questionHtml: `
            <p class="q-label">Welche Malaufgabe passt zum Bild?</p>
            ${Widgets.groups(count, each, theme.emoji, theme.container)}`,
          input: { kind: 'choice', choices: S([
            `${count} · ${each}`,
            `${count} + ${each}`,
            `${count} · ${each + 1}`,
          ], rng) },
          answerMode: AnswerCheck.MODE.CHOICE,
          answer: `${count} · ${each}`,
          hints: [
            'Zähle zuerst die Gruppen, dann die Dinge in einer Gruppe.',
            `Es sind ${count} Gruppen mit je ${each}.`,
            `Das schreibt man ${count} · ${each}.`,
          ],
        };
      }

      return {
        signature: `mg-${count}x${each}`,
        prompt: `${count} ${theme.place}. Auf jedem liegen ${each} ${theme.name}. Wie viele sind es zusammen?`,
        questionHtml: `
          <p class="q-label">${count} ${theme.place}. In jedem sind ${each} ${theme.name}.<br>Wie viele ${theme.name} sind es zusammen?</p>
          ${Widgets.groups(count, each, theme.emoji, theme.container)}`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: total,
        hints: [
          `Zähle in ${each}er-Schritten weiter.`,
          `Das ist die Malaufgabe ${count} · ${each}.`,
          `${count} · ${each} = ${total}.`,
        ],
        tool: 'punktefeld',
      };
    },
  };

  const punktefeld = {
    generate(ctx) {
      const { rng, level } = ctx;
      const rows = level === 1 ? R(2, 4, rng) : level === 2 ? R(2, 6, rng) : R(3, 9, rng);
      const cols = level === 1 ? R(2, 5, rng) : level === 2 ? R(2, 8, rng) : R(3, 10, rng);
      const askProduct = rng() < 0.6;
      if (askProduct) {
        return {
          signature: `pf-${rows}x${cols}`,
          prompt: `Wie viele Punkte hat ein Feld mit ${rows} Reihen zu je ${cols}?`,
          questionHtml: `
            <p class="q-label">Wie viele Punkte sind das?</p>
            ${Widgets.pointField(rows, cols)}`,
          input: { kind: 'number', max: 100 },
          answerMode: AnswerCheck.MODE.NUMBER,
          answer: rows * cols,
          hints: [
            'Zähle nicht einzeln — zähle die Reihen und die Punkte pro Reihe.',
            `${rows} Reihen mit je ${cols} Punkten: ${rows} · ${cols}.`,
            `${rows} · ${cols} = ${rows * cols}.`,
          ],
        };
      }
      return {
        signature: `pfeq-${rows}x${cols}`,
        prompt: 'Welche Malaufgabe passt zum Punktefeld?',
        questionHtml: `
          <p class="q-label">Welche Malaufgabe passt zum Punktefeld?</p>
          ${Widgets.pointField(rows, cols)}`,
        input: { kind: 'choice', choices: S([`${rows} · ${cols}`, `${rows} + ${cols}`, `${rows + 1} · ${cols}`], rng) },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: `${rows} · ${cols}`,
        hints: ['Erst die Reihen zählen, dann die Punkte in einer Reihe.', `${rows} Reihen zu je ${cols}.`],
      };
    },
  };

  /** Malreihe — `row` kommt aus topic.genArgs. */
  const malReihe = {
    generate(ctx) {
      const { rng, level } = ctx;
      const row = (ctx.args && ctx.args.row) || 2;
      // Stufe 1: kleine Faktoren · 2: ganze Reihe · 3: Umkehrung / fehlender Faktor
      const factor = level === 1 ? R(1, 5, rng) : R(1, 10, rng);
      const product = row * factor;

      if (level === 3 && rng() < 0.5) {
        return {
          signature: `mr${row}-miss-${factor}`,
          prompt: `${row} mal wie viel ergibt ${product}?`,
          questionHtml: `<p class="q-label">Welche Zahl fehlt?</p>${Widgets.equation([row, '·', '?', '=', product])}`,
          input: { kind: 'number', max: 10 },
          answerMode: AnswerCheck.MODE.NUMBER,
          answer: factor,
          hints: [
            'Sag die passende Malreihe der Reihe nach auf.',
            `Wie oft passt ${row} in ${product}?`,
            `${row} · ${factor} = ${product}.`,
          ],
          tool: 'einmaleins',
        };
      }

      return {
        signature: `mr${row}-${factor}`,
        prompt: `${row} mal ${factor}`,
        questionHtml: `<p class="q-label">Rechne:</p>${Widgets.equation([row, '·', factor, '=', '?'])}`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: product,
        hints: [
          'Das sind gleich große Gruppen — zähle in Schritten weiter.',
          factor > 1
            ? `${row} · ${factor - 1} = ${row * (factor - 1)}. Nimm noch einmal ${row} dazu.`
            : `Ein Mal ${row} ist ${row}.`,
          `${row} · ${factor} = ${product}.`,
        ],
        tool: 'einmaleins',
      };
    },
  };

  const malTausch = {
    generate(ctx) {
      const { rng, level } = ctx;
      const a = R(2, level === 1 ? 5 : 10, rng);
      const b = R(2, level === 1 ? 5 : 10, rng);
      const ask = level >= 2 && rng() < 0.5 ? 'result' : 'pick';
      if (ask === 'result') {
        return {
          signature: `mt-res-${a}x${b}`,
          prompt: `${a} · ${b} = ${a * b}. Wie viel ist ${b} · ${a}?`,
          questionHtml: `
            <p class="q-label">Du weißt: <strong>${a} · ${b} = ${a * b}</strong></p>
            <p class="q-sub">Nutze die Tauschaufgabe.</p>
            ${Widgets.equation([b, '·', a, '=', '?'])}`,
          input: { kind: 'number', max: 100 },
          answerMode: AnswerCheck.MODE.NUMBER,
          answer: a * b,
          hints: [
            'Bei einer Malaufgabe darf man die Zahlen tauschen.',
            'Das Ergebnis bleibt gleich.',
            `${b} · ${a} = ${a * b}.`,
          ],
          tool: 'einmaleins',
        };
      }
      const wrong1 = `${a} · ${b + 1}`;
      const wrong2 = `${a} + ${b}`;
      return {
        signature: `mt-pick-${a}x${b}`,
        prompt: `Welche Aufgabe ist die Tauschaufgabe zu ${a} · ${b}?`,
        questionHtml: `<p class="q-label">Welche Aufgabe ist die Tauschaufgabe zu <strong>${a} · ${b}</strong>?</p>`,
        input: { kind: 'choice', choices: S([`${b} · ${a}`, wrong1, wrong2], rng) },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: `${b} · ${a}`,
        hints: [
          'Bei der Tauschaufgabe stehen dieselben Zahlen — nur vertauscht.',
          `Aus ${a} · ${b} wird ${b} · ${a}.`,
        ],
      };
    },
  };

  const malNachbar = {
    generate(ctx) {
      const { rng, level } = ctx;
      const row = F(level === 1 ? [2, 5, 10] : [3, 4, 6, 7, 8, 9], rng);
      const known = F([5, 10], rng);
      const dir = rng() < 0.5 ? 1 : -1;
      const target = known + dir;
      if (target < 1 || target > 10) return malNachbar.generate(ctx);
      return {
        signature: `mn-${row}-${known}-${dir > 0 ? 'up' : 'down'}`,
        prompt: `${row} · ${known} = ${row * known}. Wie viel ist ${row} · ${target}?`,
        questionHtml: `
          <p class="q-label">Du kennst die Schlüsselaufgabe:</p>
          <p class="math-eq">${row} · ${known} = ${row * known}</p>
          <p class="q-sub">Nutze sie für die Nachbaraufgabe.</p>
          ${Widgets.equation([row, '·', target, '=', '?'])}`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: row * target,
        hints: [
          dir > 0 ? 'Ein Mal mehr — also einmal die Zahl dazuzählen.' : 'Ein Mal weniger — also einmal die Zahl wegnehmen.',
          `${row * known} ${dir > 0 ? '+' : '−'} ${row} = ?`,
          `${row} · ${target} = ${row * target}.`,
        ],
        tool: 'einmaleins',
      };
    },
  };

  const teilenVerteilen = {
    generate(ctx) {
      const { rng, level } = ctx;
      const theme = F(GROUP_THEMES, rng);
      const groupsCount = level === 1 ? R(2, 3, rng) : level === 2 ? R(2, 5, rng) : R(3, 8, rng);
      const each = level === 1 ? R(2, 4, rng) : level === 2 ? R(2, 6, rng) : R(2, 9, rng);
      const total = groupsCount * each;
      return {
        signature: `tv-${total}-${groupsCount}`,
        prompt: `${total} ${theme.name} werden gerecht auf ${groupsCount} ${theme.place} verteilt. Wie viele sind in einem?`,
        questionHtml: `
          <p class="q-label">${total} ${theme.name} werden gerecht auf ${groupsCount} ${theme.place} verteilt.</p>
          ${Widgets.groups(groupsCount, 0, theme.emoji, theme.container)}
          <p class="q-sub">Wie viele ${theme.name} kommen in jeden ${theme.place.replace(/e$/, '')}?</p>`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: each,
        hints: [
          'Gib reihum in jede Gruppe eines — so lange, bis nichts mehr übrig ist.',
          `Das ist die Aufgabe ${total} : ${groupsCount}.`,
          `${total} : ${groupsCount} = ${each}.`,
        ],
        tool: 'punktefeld',
      };
    },
  };

  const teilenGruppen = {
    generate(ctx) {
      const { rng, level } = ctx;
      const theme = F(GROUP_THEMES, rng);
      const each = level === 1 ? R(2, 3, rng) : level === 2 ? R(2, 5, rng) : R(2, 9, rng);
      const groupsCount = level === 1 ? R(2, 4, rng) : level === 2 ? R(2, 6, rng) : R(3, 9, rng);
      const total = groupsCount * each;
      return {
        signature: `tg-${total}-${each}`,
        prompt: `Wie viele Gruppen zu je ${each} kannst du aus ${total} bilden?`,
        questionHtml: `
          <p class="q-label">Du hast ${total} ${theme.name}.</p>
          <p class="q-sub">Immer ${each} kommen zusammen in eine Gruppe.<br>Wie viele Gruppen werden das?</p>
          ${Widgets.dotGrid(total, { label: total + ' ' + theme.name })}`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: groupsCount,
        hints: [
          `Nimm immer ${each} weg und zähle mit, wie oft das geht.`,
          `Das ist die Aufgabe ${total} : ${each}.`,
          `${total} : ${each} = ${groupsCount}.`,
        ],
      };
    },
  };

  const malUmkehr = {
    generate(ctx) {
      const { rng, level } = ctx;
      const a = R(2, level === 1 ? 5 : 10, rng);
      const b = R(2, level === 1 ? 5 : 10, rng);
      const p = a * b;
      const asDivision = rng() < 0.5;
      if (asDivision) {
        return {
          signature: `mu-div-${p}-${a}`,
          prompt: `${p} geteilt durch ${a}`,
          questionHtml: `
            <p class="q-label">Du weißt: <strong>${a} · ${b} = ${p}</strong></p>
            ${Widgets.equation([p, ':', a, '=', '?'])}`,
          input: { kind: 'number', max: 100 },
          answerMode: AnswerCheck.MODE.NUMBER,
          answer: b,
          hints: [
            'Teilen ist die Umkehrung vom Malnehmen.',
            `Was mal ${a} ergibt ${p}?`,
            `${p} : ${a} = ${b}.`,
          ],
          tool: 'einmaleins',
        };
      }
      return {
        signature: `mu-mul-${a}-${p}`,
        prompt: `${a} mal wie viel ergibt ${p}?`,
        questionHtml: `<p class="q-label">Welche Zahl fehlt?</p>${Widgets.equation([a, '·', '?', '=', p])}`,
        input: { kind: 'number', max: 10 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: b,
        hints: [
          'Sag die passende Malreihe der Reihe nach auf.',
          `Wie oft passt ${a} in ${p}?`,
          `${a} · ${b} = ${p}.`,
        ],
        tool: 'einmaleins',
      };
    },
  };

  // ══ Geld ════════════════════════════════════════════════════════════════

  const SHOP_ITEMS = [
    { name: 'Heft', emoji: '📓', price: 120 },
    { name: 'Bleistift', emoji: '✏️', price: 80 },
    { name: 'Radiergummi', emoji: '🧽', price: 50 },
    { name: 'Apfel', emoji: '🍎', price: 60 },
    { name: 'Semmel', emoji: '🥐', price: 45 },
    { name: 'Milch', emoji: '🥛', price: 110 },
    { name: 'Ball', emoji: '⚽', price: 350 },
    { name: 'Buch', emoji: '📗', price: 500 },
    { name: 'Sticker', emoji: '⭐', price: 30 },
    { name: 'Saft', emoji: '🧃', price: 90 },
    { name: 'Kuscheltier', emoji: '🧸', price: 750 },
    { name: 'Schere', emoji: '✂️', price: 200 },
  ];

  const geldMuenzen = {
    generate(ctx) {
      const { rng, level } = ctx;
      let values;
      if (level === 1) {
        values = [];
        const n = R(2, 4, rng);
        for (let i = 0; i < n; i++) values.push(F([100, 200], rng));
      } else if (level === 2) {
        values = [];
        const n = R(2, 4, rng);
        for (let i = 0; i < n; i++) values.push(F([10, 20, 50, 100, 200], rng));
      } else {
        values = [];
        const n = R(3, 5, rng);
        for (let i = 0; i < n; i++) values.push(F([5, 10, 20, 50, 100, 200, 500], rng));
      }
      const total = Util.sum(values);
      const asCents = total < 100;
      return {
        signature: `gm-${values.slice().sort((x, y) => x - y).join('_')}`,
        prompt: 'Wie viel Geld liegt da?',
        questionHtml: `
          <p class="q-label">Wie viel Geld ist das zusammen?</p>
          ${Widgets.moneyRow(values)}
          <p class="q-sub">Antwort in ${asCents ? 'Cent' : 'Euro und Cent (z.B. 2,50)'}</p>`,
        input: { kind: 'money', unit: asCents ? 'cent' : 'euro' },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: asCents ? total : Number((total / 100).toFixed(2)),
        hints: [
          'Fang mit dem größten Geldstück an.',
          'Lege die gleichen Werte zusammen.',
          `Zusammen sind das ${Util.formatEuro(total)}.`,
        ],
        tool: 'muenzen',
      };
    },
  };

  const geldUmwandeln = {
    generate(ctx) {
      const { rng, level } = ctx;
      const toCent = rng() < 0.5;
      const euros = level === 1 ? R(1, 5, rng) : R(1, 9, rng);
      const cents = level === 1 ? 0 : F([10, 20, 50, 5, 80], rng);
      const totalCents = euros * 100 + cents;
      if (toCent) {
        return {
          signature: `gu-toc-${totalCents}`,
          prompt: `Wie viele Cent sind ${Util.formatEuro(totalCents)}?`,
          questionHtml: `
            <p class="q-label">Wie viele Cent sind das?</p>
            <p class="math-eq">${Util.formatEuro(totalCents)} = <span class="math-blank">?</span> Cent</p>`,
          input: { kind: 'number', max: 1000 },
          answerMode: AnswerCheck.MODE.NUMBER,
          answer: totalCents,
          hints: [
            '1 Euro sind 100 Cent.',
            `${euros} Euro sind ${euros * 100} Cent.`,
            `${Util.formatEuro(totalCents)} = ${totalCents} Cent.`,
          ],
          tool: 'muenzen',
        };
      }
      const centOnly = level === 1 ? R(1, 9, rng) * 100 : R(1, 9, rng) * 100 + F([0, 10, 20, 50], rng);
      return {
        signature: `gu-toe-${centOnly}`,
        prompt: `Wie viel Euro sind ${centOnly} Cent?`,
        questionHtml: `
          <p class="q-label">Wie viel Euro und Cent sind das?</p>
          <p class="math-eq">${centOnly} Cent = <span class="math-blank">?</span></p>
          <p class="q-sub">Schreibe zum Beispiel 3,50</p>`,
        input: { kind: 'money', unit: 'euro' },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: Number((centOnly / 100).toFixed(2)),
        hints: [
          '100 Cent sind 1 Euro.',
          `Wie oft passt 100 in ${centOnly}?`,
          `${centOnly} Cent = ${Util.formatEuro(centOnly)}.`,
        ],
        tool: 'muenzen',
      };
    },
  };

  const geldRueckgeld = {
    generate(ctx) {
      const { rng, level } = ctx;
      const item = F(SHOP_ITEMS, rng);
      let price, paid;
      if (level === 1) {
        price = R(1, 4, rng) * 100;
        paid = (price / 100 + R(1, 3, rng)) * 100;
      } else if (level === 2) {
        price = R(1, 4, rng) * 100 + F([0, 50], rng);
        paid = F([500, 1000], rng);
      } else {
        price = R(120, 890, rng);
        price = price - (price % 10);
        paid = F([1000, 2000], rng);
      }
      const back = paid - price;
      return {
        signature: `gr-${price}-${paid}`,
        prompt: `Du zahlst ${Util.formatEuro(paid)} für ${Util.formatEuro(price)}. Wie viel bekommst du zurück?`,
        questionHtml: `
          <p class="q-label">Du kaufst etwas und zahlst mit ${Util.formatEuro(paid)}.</p>
          ${Widgets.priceTag(price, item.emoji, item.name)}
          <p class="q-sub">Wie viel Geld bekommst du zurück?</p>`,
        input: { kind: 'money', unit: 'euro' },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: Number((back / 100).toFixed(2)),
        hints: [
          'Ergänze vom Preis bis zu dem Geld, das du gegeben hast.',
          `Von ${Util.formatEuro(price)} bis ${Util.formatEuro(paid)} — wie weit ist das?`,
          `Du bekommst ${Util.formatEuro(back)} zurück.`,
        ],
        tool: 'muenzen',
      };
    },
  };

  // ══ Uhr und Kalender ════════════════════════════════════════════════════

  const DAYPARTS = [
    { label: 'am Vormittag', offset: 0, hours: [8, 9, 10, 11] },
    { label: 'am Nachmittag', offset: 12, hours: [1, 2, 3, 4, 5] },
    { label: 'am Abend', offset: 12, hours: [6, 7, 8, 9] },
  ];

  function clockAnswerText(hour24, minute) {
    return `${hour24}:${String(minute).padStart(2, '0')} Uhr`;
  }

  const uhrVolleHalbe = {
    generate(ctx) {
      const { rng, level } = ctx;
      const isHalf = level === 1 ? false : rng() < 0.5;
      const minute = isHalf ? 30 : 0;

      // Stufe 3: mit eindeutigem Tageszeitkontext, Antwort in 24-Stunden-Form.
      if (level === 3) {
        const part = F(DAYPARTS, rng);
        const h12 = F(part.hours, rng);
        const h24 = part.offset === 12 ? (h12 === 12 ? 12 : h12 + 12) : h12;
        const answer = clockAnswerText(h24, minute);
        const wrongHour = h12 === 12 ? 11 : (h24 + 1 > 23 ? h24 - 1 : h24 + 1);
        const choices = S([
          answer,
          clockAnswerText(wrongHour, minute),
          clockAnswerText(h24, minute === 0 ? 30 : 0),
        ], rng);
        return {
          signature: `uhr24-${h24}-${minute}`,
          prompt: `Es ist ${part.label}. Wie spät ist es?`,
          questionHtml: `
            <p class="q-label">Es ist <strong>${part.label}</strong>. Wie spät ist es?</p>
            ${Clock.render(h12, minute, { size: 150 })}
            <p class="q-sub">Antworte in der 24-Stunden-Zeit.</p>`,
          input: { kind: 'choice', choices },
          answerMode: AnswerCheck.MODE.CHOICE,
          answer,
          hints: [
            'Der kleine Zeiger zeigt die Stunde, der große die Minuten.',
            part.offset === 12
              ? `Auf der Uhr steht die ${h12}. ${part.label.charAt(0).toUpperCase() + part.label.slice(1)} zählt man 12 dazu.`
              : 'Am Vormittag zeigt die Uhr die Stunde direkt an.',
            `Es ist ${answer}.`,
          ],
          tool: 'uhr',
        };
      }

      // Stufe 1 und 2: ohne Tageszeit — dann wird auch nur die Uhrzeit
      // gefragt, wie sie am Zifferblatt steht (keine 24-Stunden-Antwort).
      const h12 = R(1, 12, rng);
      const answer = isHalf ? `halb ${h12 === 12 ? 1 : h12 + 1}` : `${h12} Uhr`;
      const wrongHour = h12 === 12 ? 1 : h12 + 1;
      const choices = S([
        answer,
        isHalf ? `halb ${wrongHour === 12 ? 1 : wrongHour + 1}` : `${wrongHour} Uhr`,
        isHalf ? `${h12} Uhr` : `halb ${h12 === 12 ? 1 : h12 + 1}`,
      ], rng);
      return {
        signature: `uhr12-${h12}-${minute}`,
        prompt: 'Wie spät ist es?',
        questionHtml: `
          <p class="q-label">Wie spät ist es?</p>
          ${Clock.render(h12, minute, { size: 150 })}`,
        input: { kind: 'choice', choices },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer,
        hints: [
          isHalf
            ? 'Der große Zeiger steht auf der 6 — es ist eine halbe Stunde.'
            : 'Der große Zeiger steht auf der 12 — es ist eine volle Stunde.',
          isHalf
            ? `Bei „halb" nennt man schon die nächste Stunde: halb ${h12 === 12 ? 1 : h12 + 1}.`
            : `Der kleine Zeiger steht auf der ${h12}.`,
          `Es ist ${answer}.`,
        ],
        tool: 'uhr',
      };
    },
  };

  const uhrViertel = {
    generate(ctx) {
      const { rng, level } = ctx;
      const isAfter = rng() < 0.5;
      const minute = isAfter ? 15 : 45;
      const h12 = R(1, 12, rng);
      const nextH = h12 === 12 ? 1 : h12 + 1;
      const answer = isAfter ? `Viertel nach ${h12}` : `Viertel vor ${nextH}`;
      const choices = S([
        answer,
        isAfter ? `Viertel vor ${nextH}` : `Viertel nach ${h12}`,
        `halb ${nextH}`,
      ], rng);
      return {
        signature: `uhrv-${h12}-${minute}`,
        prompt: 'Wie spät ist es?',
        questionHtml: `
          <p class="q-label">Wie spät ist es?</p>
          ${Clock.render(h12, minute, { size: 150 })}`,
        input: { kind: 'choice', choices },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer,
        hints: [
          'Eine Viertelstunde sind 15 Minuten.',
          isAfter
            ? 'Der große Zeiger steht auf der 3 — eine Viertelstunde ist vergangen.'
            : 'Der große Zeiger steht auf der 9 — bis zur vollen Stunde fehlt eine Viertelstunde.',
          `Es ist ${answer}.`,
        ],
        tool: 'uhr',
      };
    },
  };

  const kalender = {
    generate(ctx) {
      const { rng, level } = ctx;
      const M = WordsData.MONTHS;
      const D = WordsData.WEEKDAYS;
      const kinds = level === 1 ? ['dayAfter', 'weekLength']
                  : level === 2 ? ['dayAfter', 'monthAfter', 'weekLength', 'monthCount']
                  : ['monthAfter', 'season', 'monthNumber', 'dateAfter'];
      const kind = F(kinds, rng);

      if (kind === 'dayAfter') {
        const i = R(0, 6, rng);
        const answer = D[(i + 1) % 7];
        return {
          signature: `kal-day-${i}`,
          prompt: `Welcher Tag kommt nach ${D[i]}?`,
          questionHtml: `<p class="q-label">Welcher Tag kommt nach <strong>${D[i]}</strong>?</p>`,
          input: { kind: 'choice', choices: S([answer].concat(S(D.filter(d => d !== answer && d !== D[i]), rng).slice(0, 2)), rng) },
          answerMode: AnswerCheck.MODE.CHOICE,
          answer,
          hints: ['Sag die Wochentage der Reihe nach auf.', 'Montag, Dienstag, Mittwoch …'],
        };
      }
      if (kind === 'monthAfter') {
        const i = R(0, 11, rng);
        const answer = M[(i + 1) % 12];
        return {
          signature: `kal-month-${i}`,
          prompt: `Welcher Monat kommt nach ${M[i]}?`,
          questionHtml: `<p class="q-label">Welcher Monat kommt nach <strong>${M[i]}</strong>?</p>`,
          input: { kind: 'choice', choices: S([answer].concat(S(M.filter(m => m !== answer && m !== M[i]), rng).slice(0, 2)), rng) },
          answerMode: AnswerCheck.MODE.CHOICE,
          answer,
          hints: ['Sag die Monate der Reihe nach auf.', 'Jänner, Februar, März …'],
        };
      }
      if (kind === 'weekLength') {
        return {
          signature: 'kal-weeklen',
          prompt: 'Wie viele Tage hat eine Woche?',
          questionHtml: '<p class="q-label">Wie viele Tage hat eine Woche?</p>',
          input: { kind: 'number', max: 31 },
          answerMode: AnswerCheck.MODE.NUMBER,
          answer: 7,
          hints: ['Zähle von Montag bis Sonntag.', 'Montag, Dienstag, Mittwoch, Donnerstag, Freitag, Samstag, Sonntag.'],
        };
      }
      if (kind === 'monthCount') {
        return {
          signature: 'kal-monthcount',
          prompt: 'Wie viele Monate hat ein Jahr?',
          questionHtml: '<p class="q-label">Wie viele Monate hat ein Jahr?</p>',
          input: { kind: 'number', max: 31 },
          answerMode: AnswerCheck.MODE.NUMBER,
          answer: 12,
          hints: ['Zähle vom Jänner bis zum Dezember.'],
        };
      }
      if (kind === 'season') {
        const season = F(WordsData.SEASONS, rng);
        const m = F(season.months, rng);
        const others = S(WordsData.SEASONS.filter(x => x.name !== season.name), rng)
          .slice(0, 2).map(x => x.name);
        return {
          signature: `kal-season-${m}`,
          prompt: `In welche Jahreszeit gehört der ${m}?`,
          questionHtml: `<p class="q-label">In welche Jahreszeit gehört der <strong>${m}</strong>?</p>`,
          input: { kind: 'choice', choices: S([season.name].concat(others), rng) },
          answerMode: AnswerCheck.MODE.CHOICE,
          answer: season.name,
          hints: ['Denk daran, wie das Wetter in diesem Monat ist.', `${season.months.join(', ')} gehören zusammen.`],
        };
      }
      // monthNumber
      const i = R(0, 11, rng);
      return {
        signature: `kal-mnum-${i}`,
        prompt: `Der wievielte Monat ist der ${M[i]}?`,
        questionHtml: `<p class="q-label">Der wievielte Monat im Jahr ist der <strong>${M[i]}</strong>?</p>`,
        input: { kind: 'number', max: 12 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: i + 1,
        hints: ['Zähle vom Jänner an mit.', `Jänner ist der erste Monat.`],
      };
    },
  };

  // ══ Größen ══════════════════════════════════════════════════════════════

  const LENGTH_ESTIMATES = [
    { thing: 'ein Bleistift', emoji: '✏️', right: '15 cm', wrong: ['15 m', '15 dm'] },
    { thing: 'ein Lineal', emoji: '📏', right: '3 dm', wrong: ['3 m', '3 cm'] },
    { thing: 'eine Tür', emoji: '🚪', right: '2 m', wrong: ['2 cm', '2 dm'] },
    { thing: 'ein Radiergummi', emoji: '🧽', right: '4 cm', wrong: ['4 m', '4 dm'] },
    { thing: 'ein Fußballfeld', emoji: '⚽', right: '100 m', wrong: ['100 cm', '100 dm'] },
    { thing: 'ein Schulheft', emoji: '📓', right: '3 dm', wrong: ['3 m', '30 m'] },
  ];

  const laengen = {
    generate(ctx) {
      const { rng, level } = ctx;
      if (level === 1 || (level === 2 && rng() < 0.5)) {
        const kinds = [
          { q: '1 m = ? cm', a: 100, hint: 'Ein Meter besteht aus 100 Zentimetern.' },
          { q: '1 dm = ? cm', a: 10, hint: 'Ein Dezimeter besteht aus 10 Zentimetern.' },
          { q: '1 m = ? dm', a: 10, hint: 'Ein Meter besteht aus 10 Dezimetern.' },
          { q: '2 m = ? cm', a: 200, hint: '1 m sind 100 cm.' },
          { q: '3 dm = ? cm', a: 30, hint: '1 dm sind 10 cm.' },
          { q: '50 cm = ? dm', a: 5, hint: '10 cm sind 1 dm.' },
        ];
        const k = F(kinds, rng);
        return {
          signature: `len-${k.q}`,
          prompt: k.q,
          questionHtml: `<p class="q-label">Rechne um:</p><p class="math-eq">${k.q.replace('?', '<span class="math-blank">?</span>')}</p>`,
          input: { kind: 'number', max: 1000 },
          answerMode: AnswerCheck.MODE.NUMBER,
          answer: k.a,
          hints: [
            'Überlege zuerst: Welche Einheit ist größer?',
            k.hint,
            `Die Lösung ist ${k.a}.`,
          ],
          tool: 'laengen',
        };
      }
      const e = F(LENGTH_ESTIMATES, rng);
      return {
        signature: `lenest-${e.thing}`,
        prompt: `Wie lang ist ${e.thing} ungefähr?`,
        questionHtml: `
          <p class="q-label">Wie lang ist ${e.thing} ungefähr?</p>
          <p class="big-emoji">${e.emoji}</p>
          <p class="q-sub">Das Bild am Bildschirm zeigt die Größe nicht echt — überlege selbst.</p>`,
        input: { kind: 'choice', choices: S([e.right].concat(e.wrong), rng) },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: e.right,
        hints: [
          'Vergleiche mit deinem Lineal: Es ist 30 cm oder 3 dm lang.',
          'Ein Meter ist ungefähr so lang wie ein großer Schritt.',
        ],
        tool: 'laengen',
      };
    },
  };

  const WEIGHT_ESTIMATES = [
    { thing: 'ein Apfel', emoji: '🍎', right: '15 dag', wrong: ['15 kg', '5 kg'] },
    { thing: 'ein Sackerl Mehl', emoji: '🌾', right: '1 kg', wrong: ['1 dag', '100 kg'] },
    { thing: 'ein Schulranzen mit Büchern', emoji: '🎒', right: '4 kg', wrong: ['4 dag', '40 kg'] },
    { thing: 'ein Brief', emoji: '✉️', right: '2 dag', wrong: ['2 kg', '20 kg'] },
    { thing: 'ein Fahrrad', emoji: '🚲', right: '12 kg', wrong: ['12 dag', '120 kg'] },
  ];

  const gewichte = {
    generate(ctx) {
      const { rng, level } = ctx;
      if (level === 1 || (level === 2 && rng() < 0.5)) {
        const kinds = [
          { q: '1 kg = ? dag', a: 100, hint: 'Ein Kilogramm sind 100 Dekagramm.' },
          { q: '2 kg = ? dag', a: 200, hint: '1 kg sind 100 dag.' },
          { q: '50 dag = ? kg', a: null, skip: true },
          { q: '300 dag = ? kg', a: 3, hint: '100 dag sind 1 kg.' },
          { q: '5 kg = ? dag', a: 500, hint: '1 kg sind 100 dag.' },
        ].filter(k => !k.skip);
        const k = F(kinds, rng);
        return {
          signature: `gew-${k.q}`,
          prompt: k.q,
          questionHtml: `<p class="q-label">Rechne um:</p><p class="math-eq">${k.q.replace('?', '<span class="math-blank">?</span>')}</p>`,
          input: { kind: 'number', max: 1000 },
          answerMode: AnswerCheck.MODE.NUMBER,
          answer: k.a,
          hints: [
            'Überlege zuerst: Welche Einheit ist größer?',
            k.hint,
            `Die Lösung ist ${k.a}.`,
          ],
          tool: 'gewichte',
        };
      }
      const e = F(WEIGHT_ESTIMATES, rng);
      return {
        signature: `gewest-${e.thing}`,
        prompt: `Wie schwer ist ${e.thing} ungefähr?`,
        questionHtml: `
          <p class="q-label">Wie schwer ist ${e.thing} ungefähr?</p>
          <p class="big-emoji">${e.emoji}</p>`,
        input: { kind: 'choice', choices: S([e.right].concat(e.wrong), rng) },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: e.right,
        hints: [
          'Ein Sackerl Mehl wiegt 1 kg — vergleiche damit.',
          '100 dag sind genau 1 kg.',
        ],
        tool: 'gewichte',
      };
    },
  };

  // ══ Sachaufgaben ════════════════════════════════════════════════════════

  const sachaufgaben = {
    generate(ctx) {
      const { rng, level } = ctx;
      const templates = [
        (r, lv) => {
          const a = R(lv === 1 ? 5 : 20, lv === 1 ? 30 : 70, r);
          const b = R(3, lv === 1 ? 10 : 25, r);
          return { t: `Luisa hat ${a} Sticker. Sie bekommt ${b} dazu.<br>Wie viele Sticker hat sie jetzt?`, a: a + b,
            h: ['Es kommen welche dazu — also plus.', `Rechne ${a} + ${b}.`] };
        },
        (r, lv) => {
          const a = R(lv === 1 ? 10 : 40, lv === 1 ? 30 : 95, r);
          const b = R(3, Math.min(a - 1, lv === 1 ? 9 : 30), r);
          return { t: `Im Stall stehen ${a} Pferde. ${b} Pferde gehen auf die Weide.<br>Wie viele bleiben im Stall?`, a: a - b,
            h: ['Es gehen welche weg — also minus.', `Rechne ${a} − ${b}.`] };
        },
        (r, lv) => {
          const g = R(2, lv === 1 ? 4 : 8, r);
          const e = R(2, lv === 1 ? 4 : 9, r);
          return { t: `In ${g} Schachteln sind je ${e} Kekse.<br>Wie viele Kekse sind das zusammen?`, a: g * e,
            h: ['Gleich große Gruppen — das ist eine Malaufgabe.', `Rechne ${g} · ${e}.`] };
        },
        (r, lv) => {
          const each = R(2, lv === 1 ? 4 : 8, r);
          const g = R(2, lv === 1 ? 4 : 6, r);
          return { t: `${g * each} Äpfel werden gerecht auf ${g} Kisten verteilt.<br>Wie viele Äpfel kommen in eine Kiste?`, a: each,
            h: ['Gerecht verteilen — das ist eine Teilaufgabe.', `Rechne ${g * each} : ${g}.`] };
        },
        (r, lv) => {
          const price = R(2, 6, r) * 100;
          const paid = price + R(1, 4, r) * 100;
          return { t: `Ein Buch kostet ${Util.formatEuro(price)}. Du zahlst mit ${Util.formatEuro(paid)}.<br>Wie viel Euro bekommst du zurück?`, a: (paid - price) / 100,
            h: ['Wie weit ist es vom Preis bis zu deinem Geld?', `Rechne ${paid / 100} − ${price / 100}.`] };
        },
        (r, lv) => {
          const start = R(1, 5, r);
          const dur = R(1, 4, r);
          return { t: `Der Film beginnt um ${start} Uhr am Nachmittag und dauert ${dur} ${Util.plural(dur, 'Stunde', 'Stunden')}.<br>Um wie viel Uhr ist er zu Ende? (Antwort: Stunde am Nachmittag)`, a: start + dur,
            h: ['Zähle die Stunden dazu.', `Rechne ${start} + ${dur}.`] };
        },
      ];
      const idx = R(0, templates.length - 1, rng);
      const t = templates[idx](rng, level);
      return {
        signature: `sa-${idx}-${t.a}-${(String(t.t).match(/\d+/g) || []).join('_')}`,
        prompt: String(t.t).replace(/<br>/g, ' '),
        questionHtml: `<p class="q-label word-problem-text">${t.t}</p>`,
        input: { kind: 'number', max: 1000 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: t.a,
        hints: [
          'Lies die Aufgabe noch einmal. Was wird gesucht?',
          t.h[0],
          t.h[1],
        ],
      };
    },
  };

  // ══ Formen und Daten ════════════════════════════════════════════════════

  const SHAPES_2D = [
    { name: 'Quadrat', emoji: '🟦', note: 'vier gleich lange Seiten' },
    { name: 'Rechteck', emoji: '▭', note: 'vier Ecken, gegenüber gleich lang' },
    { name: 'Dreieck', emoji: '🔺', note: 'drei Ecken' },
    { name: 'Kreis', emoji: '⚪', note: 'ganz rund, keine Ecke' },
  ];
  const SHAPES_3D = [
    { name: 'Würfel', emoji: '🎲', note: 'sechs gleiche quadratische Flächen' },
    { name: 'Kugel', emoji: '⚽', note: 'rollt in jede Richtung' },
    { name: 'Zylinder', emoji: '🥫', note: 'wie eine Dose' },
    { name: 'Quader', emoji: '📦', note: 'wie eine Schachtel' },
  ];

  const flaechenKoerper = {
    generate(ctx) {
      const { rng, level } = ctx;
      const kind = level === 1 ? 'classify' : (rng() < 0.5 ? 'classify' : 'name');
      if (kind === 'classify') {
        const is3d = rng() < 0.5;
        const s = F(is3d ? SHAPES_3D : SHAPES_2D, rng);
        return {
          signature: `fk-cls-${s.name}`,
          prompt: `Ist ein ${s.name} eine Fläche oder ein Körper?`,
          questionHtml: `
            <p class="q-label">Ist das eine Fläche oder ein Körper?</p>
            <p class="big-emoji">${s.emoji}</p>
            <p class="shape-name">${s.name}</p>`,
          input: { kind: 'choice', choices: ['Fläche', 'Körper'] },
          answerMode: AnswerCheck.MODE.CHOICE,
          answer: is3d ? 'Körper' : 'Fläche',
          hints: [
            'Eine Fläche ist flach wie ein Blatt Papier.',
            'Einen Körper kannst du in die Hand nehmen — er hat ein Innen.',
            `Ein ${s.name} ist ${is3d ? 'ein Körper' : 'eine Fläche'}.`,
          ],
        };
      }
      const is3d = rng() < 0.5;
      const pool = is3d ? SHAPES_3D : SHAPES_2D;
      const s = F(pool, rng);
      return {
        signature: `fk-name-${s.name}`,
        prompt: `Wie heißt diese Form? Hinweis: ${s.note}`,
        questionHtml: `
          <p class="q-label">Wie heißt diese Form?</p>
          <p class="big-emoji">${s.emoji}</p>
          <p class="q-sub">${s.note}</p>`,
        input: { kind: 'choice', choices: S([s.name].concat(S(pool.filter(x => x.name !== s.name), rng).slice(0, 2).map(x => x.name)), rng) },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: s.name,
        hints: ['Zähle die Ecken und Seiten.', s.note],
      };
    },
  };

  const symmetrie = {
    generate(ctx) {
      const { rng } = ctx;
      const p = F(LogicData.MIRROR_PATTERNS, rng);
      const size = 5;
      const axis = 2;
      // Linke Seite (Spalten 0–1) plus Achse sind vorgegeben.
      const left = p.cells.filter(([r, c]) => c <= axis);
      const expected = left.filter(([r, c]) => c < axis).map(([r, c]) => [r, 2 * axis - c]);
      return {
        signature: `sym-${p.name}`,
        prompt: `Ergänze das Spiegelbild von ${p.name} auf der rechten Seite.`,
        questionHtml: `
          <p class="q-label">Ergänze das Spiegelbild.</p>
          <p class="q-sub">Die Mittellinie ist die Spiegelachse. Tippe rechts die Felder an.</p>`,
        input: { kind: 'mirror', size, axis, given: left, expected },
        answerMode: AnswerCheck.MODE.SET,
        answer: expected.map(c => c.join(',')),
        hints: [
          'Zähle, wie weit ein Feld von der Mittellinie entfernt ist.',
          'Genauso weit muss es auf der anderen Seite sein — in derselben Zeile.',
          'Arbeite Zeile für Zeile von oben nach unten.',
        ],
        tool: 'spiegel',
      };
    },
  };

  const DIAGRAM_TOPICS = [
    { title: 'Lieblingstiere in der Klasse', unit: 'Kinder', labels: ['Hund', 'Katze', 'Pferd', 'Hase'] },
    { title: 'Obst in der Jause', unit: 'Stück', labels: ['Apfel', 'Birne', 'Banane', 'Traube'] },
    { title: 'Wie kommen wir zur Schule?', unit: 'Kinder', labels: ['zu Fuß', 'Bus', 'Rad', 'Auto'] },
    { title: 'Gelesene Bücher', unit: 'Bücher', labels: ['Mo', 'Di', 'Mi', 'Do'] },
  ];

  const diagramm = {
    generate(ctx) {
      const { rng, level } = ctx;
      const topic = F(DIAGRAM_TOPICS, rng);
      const values = topic.labels.map(() => R(1, level === 1 ? 8 : 12, rng));
      const data = topic.labels.map((l, i) => ({ label: l, value: values[i] }));
      const kinds = level === 1 ? ['read', 'max'] : ['read', 'max', 'diff', 'sum'];
      const kind = F(kinds, rng);
      const maxIdx = values.indexOf(Math.max.apply(null, values));
      const minIdx = values.indexOf(Math.min.apply(null, values));

      if (kind === 'max') {
        return {
          signature: `dia-max-${topic.title}-${values.join('_')}`,
          prompt: `Was kommt im Diagramm „${topic.title}" am häufigsten vor?`,
          questionHtml: `
            <p class="q-label">${topic.title}</p>
            ${Widgets.barChart(data)}
            <p class="q-sub">Welche Säule ist am höchsten?</p>`,
          input: { kind: 'choice', choices: S(topic.labels, rng) },
          answerMode: AnswerCheck.MODE.CHOICE,
          answer: topic.labels[maxIdx],
          hints: ['Suche die höchste Säule.', `Die höchste Säule hat ${values[maxIdx]} ${topic.unit}.`],
        };
      }
      if (kind === 'diff') {
        return {
          signature: `dia-diff-${topic.title}-${values.join('_')}`,
          prompt: `Wie groß ist der Unterschied zwischen der höchsten und der niedrigsten Säule?`,
          questionHtml: `
            <p class="q-label">${topic.title}</p>
            ${Widgets.barChart(data)}
            <p class="q-sub">Wie viel mehr hat „${topic.labels[maxIdx]}" als „${topic.labels[minIdx]}"?</p>`,
          input: { kind: 'number', max: 100 },
          answerMode: AnswerCheck.MODE.NUMBER,
          answer: values[maxIdx] - values[minIdx],
          hints: [
            'Lies beide Zahlen ab.',
            `${values[maxIdx]} und ${values[minIdx]} — rechne minus.`,
            `${values[maxIdx]} − ${values[minIdx]} = ${values[maxIdx] - values[minIdx]}.`,
          ],
        };
      }
      if (kind === 'sum') {
        return {
          signature: `dia-sum-${topic.title}-${values.join('_')}`,
          prompt: 'Wie viele sind es zusammen?',
          questionHtml: `
            <p class="q-label">${topic.title}</p>
            ${Widgets.barChart(data)}
            <p class="q-sub">Wie viele ${topic.unit} sind es zusammen?</p>`,
          input: { kind: 'number', max: 100 },
          answerMode: AnswerCheck.MODE.NUMBER,
          answer: Util.sum(values),
          hints: ['Lies jede Säule ab und schreibe die Zahlen auf.', `${values.join(' + ')} = ?`],
        };
      }
      const idx = R(0, topic.labels.length - 1, rng);
      return {
        signature: `dia-read-${topic.title}-${values.join('_')}-${idx}`,
        prompt: `Wie viele ${topic.unit} hat „${topic.labels[idx]}"?`,
        questionHtml: `
          <p class="q-label">${topic.title}</p>
          ${Widgets.barChart(data, { hideValues: true })}
          <p class="q-sub">Wie viele ${topic.unit} hat „${topic.labels[idx]}"?</p>`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: values[idx],
        hints: ['Fahre mit dem Finger von der Säule nach oben.', 'Zähle die Kästchen von unten.'],
      };
    },
  };

  const zr1000 = {
    generate(ctx) {
      const { rng, level } = ctx;
      const n = level === 1 ? R(1, 9, rng) * 100 : R(101, 999, rng);
      const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), o = n % 10;
      if (level === 1) {
        return {
          signature: `zt-h-${n}`,
          prompt: `Wie viele Hunderter hat ${n}?`,
          questionHtml: `<p class="q-label">Wie viele Hunderter hat die Zahl <strong>${n}</strong>?</p>`,
          input: { kind: 'number', max: 9 },
          answerMode: AnswerCheck.MODE.NUMBER,
          answer: h,
          hints: ['Die vorderste Ziffer zählt die Hunderter.'],
        };
      }
      return {
        signature: `zt-split-${n}`,
        prompt: `Zerlege ${n} in Hunderter, Zehner und Einer.`,
        questionHtml: `
          <p class="q-label">Zerlege die Zahl:</p>
          <p class="math-eq"><strong>${n}</strong></p>`,
        input: { kind: 'fields', labels: ['Hunderter', 'Zehner', 'Einer'], max: 9 },
        answerMode: AnswerCheck.MODE.FIELDS,
        fieldMode: AnswerCheck.MODE.NUMBER,
        answer: [h, t, o],
        hints: [
          'Von links nach rechts: Hunderter, Zehner, Einer.',
          `${n} = ${h} · 100 + ${t} · 10 + ${o}.`,
        ],
      };
    },
  };

  // ══ Klasse 1 ════════════════════════════════════════════════════════════

  const g1NumberRecognition = {
    generate(ctx) {
      const { rng, level } = ctx;
      const max = level === 1 ? 10 : level === 2 ? 15 : 20;
      const n = R(1, max, rng);
      return {
        signature: `g1nr-${n}`,
        prompt: `Welche Zahl ist ${Util.numberWord(n)}?`,
        questionHtml: `
          <p class="q-label">Welche Zahl ist das?</p>
          <p class="q-word">${Util.numberWord(n)}</p>`,
        input: { kind: 'number', max: 20 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: n,
        hints: [
          'Sprich das Zahlwort langsam mit.',
          `Zähle von eins an mit, bis du bei „${Util.numberWord(n)}" bist.`,
        ],
      };
    },
  };

  const g1Counting = {
    generate(ctx) {
      const { rng, level } = ctx;
      const max = level === 1 ? 10 : level === 2 ? 15 : 20;
      const n = R(1, max, rng);
      return {
        signature: `g1c-${n}`,
        prompt: 'Wie viele Punkte siehst du?',
        questionHtml: `<p class="q-label">Wie viele Punkte siehst du?</p>${Widgets.dotGrid(n)}`,
        input: { kind: 'number', max: 20 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: n,
        hints: ['Zähle Reihe für Reihe.', 'Eine volle Reihe sind 5 Punkte.'],
      };
    },
  };

  const g1Addition = {
    generate(ctx) {
      const { rng, level } = ctx;
      const max = level === 1 ? 10 : level === 2 ? 15 : 20;
      const a = R(1, Math.max(1, max - 2), rng);
      const b = R(1, max - a, rng);
      return {
        signature: `g1a-${a}+${b}`,
        prompt: `${a} plus ${b}`,
        questionHtml: `<p class="q-label">Rechne:</p>${Widgets.equation([a, '+', b, '=', '?'])}`,
        input: { kind: 'number', max: 20 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: a + b,
        hints: [`Zähle von ${a} aus ${b} Schritte weiter.`, `${a} + ${b} = ${a + b}.`],
      };
    },
  };

  const g1Subtraction = {
    generate(ctx) {
      const { rng, level } = ctx;
      const max = level === 1 ? 10 : level === 2 ? 15 : 20;
      const a = R(2, max, rng);
      const b = R(1, a - 1, rng);
      return {
        signature: `g1s-${a}-${b}`,
        prompt: `${a} minus ${b}`,
        questionHtml: `<p class="q-label">Rechne:</p>${Widgets.equation([a, '−', b, '=', '?'])}`,
        input: { kind: 'number', max: 20 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: a - b,
        hints: [`Zähle von ${a} aus ${b} Schritte zurück.`, `${a} − ${b} = ${a - b}.`],
      };
    },
  };

  return {
    stellenwert, buendeln, hunderterfeld, zahlenstrahl, vergleichen,
    nachbarzahlen, geradeUngerade,
    addZehner, addOhneUebergang, addMitUebergang,
    subZehner, subOhneUebergang, subMitUebergang,
    ergaenzenZehner, ergaenzenHundert, umkehrPlusMinus,
    rechenmauer, rechenweg, doubleHalf, numberSeries,
    malGruppen, punktefeld, malReihe, malTausch, malNachbar,
    teilenVerteilen, teilenGruppen, malUmkehr,
    geldMuenzen, geldUmwandeln, geldRueckgeld,
    uhrVolleHalbe, uhrViertel, kalender,
    laengen, gewichte, sachaufgaben,
    flaechenKoerper, symmetrie, diagramm, zr1000,
    g1NumberRecognition, g1Counting, g1Addition, g1Subtraction,
    SHOP_ITEMS,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MathGen;
