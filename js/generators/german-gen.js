/**
 * generators/german-gen.js
 * Fachliche Aufgabengeneratoren für Deutsch.
 *
 * Zur Groß-/Kleinschreibung (Bericht, Abschnitt 5):
 *   `strictCase: true` steht nur dort, wo die Großschreibung selbst das
 *   Lernziel ist (Satzanfang, Fehler verbessern bei Großschreibregeln).
 *   Bei Wortschatzaufgaben wird tolerant verglichen; die Rückmeldung weist
 *   trotzdem freundlich auf die Großschreibung hin.
 */

const GermanGen = (() => {

  const R = Util.randomInt;
  const F = Util.randomFrom;
  const S = Util.shuffle;
  const G = GermanData;
  const W = WordsData;

  // ══ ABC ═════════════════════════════════════════════════════════════════

  const abcOrdnen = {
    generate(ctx) {
      const { rng, level } = ctx;
      let words;
      if (level === 1) {
        words = S(G.ABC_WORDS_L1, rng).slice(0, 3);
      } else if (level === 2) {
        const group = F(G.ABC_WORDS_L2, rng);
        words = S(group, rng).slice(0, 3);
      } else {
        const group = F(G.ABC_WORDS_L2, rng);
        words = S(group, rng).slice(0, 4);
      }
      const sorted = words.slice().sort((a, b) => a.localeCompare(b, 'de'));
      return {
        signature: `abc-${sorted.join('_')}`,
        prompt: `Ordne nach dem ABC: ${words.join(', ')}`,
        questionHtml: `
          <p class="q-label">Ordne die Wörter nach dem ABC.</p>
          <p class="q-sub">Tippe sie in der richtigen Reihenfolge an.</p>`,
        input: { kind: 'order', items: words },
        answerMode: AnswerCheck.MODE.ORDER,
        answer: sorted,
        hints: [
          'Schau zuerst auf den ersten Buchstaben.',
          level >= 2
            ? 'Alle beginnen gleich — dann entscheidet der zweite Buchstabe.'
            : 'Sag das ABC leise mit: A, B, C, D …',
          `Richtig ist: ${sorted.join(' – ')}`,
        ],
        tool: 'abc',
      };
    },
  };

  const abcNachbarn = {
    generate(ctx) {
      const { rng, level } = ctx;
      const A = G.ALPHABET;
      const i = R(0, A.length - 2, rng);
      const before = level === 3 && rng() < 0.5;
      const idx = before ? Math.max(1, i) : i;
      const answer = before ? A[idx - 1] : A[idx + 1];
      const others = S(A.filter(l => l !== answer && l !== A[idx]), rng).slice(0, 2);
      return {
        signature: `abcn-${A[idx]}-${before ? 'v' : 'n'}`,
        prompt: `Welcher Buchstabe kommt ${before ? 'vor' : 'nach'} dem ${A[idx]}?`,
        questionHtml: `
          <p class="q-label">Welcher Buchstabe kommt <strong>${before ? 'vor' : 'nach'}</strong> dem Buchstaben</p>
          <p class="word-main">${A[idx]}</p>`,
        input: { kind: 'choice', choices: S([answer].concat(others), rng) },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer,
        hints: ['Sag das ABC leise auf.', 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z'],
        tool: 'abc',
      };
    },
  };

  // ══ Wortarten ═══════════════════════════════════════════════════════════

  const namenwortErkennen = {
    generate(ctx) {
      const { rng } = ctx;
      const s = F(G.NOUN_SENTENCES, rng);
      return {
        signature: `nwe-${s.words.join('_')}`,
        prompt: `Tippe das Namenwort an: ${s.words.join(' ')}`,
        questionHtml: `
          <p class="q-label">Tippe das <strong>Namenwort</strong> an.</p>
          <p class="q-sub">Namenwörter schreibt man groß. Vor ihnen steht oft der, die oder das.</p>`,
        input: { kind: 'tapWord', words: s.words },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: String(s.target),
        hints: [
          'Suche das Wort, das groß geschrieben ist und nicht am Satzanfang steht.',
          'Namenwörter sind Dinge, Tiere, Menschen oder Pflanzen.',
          `Das Namenwort ist „${s.words[s.target]}".`,
        ],
      };
    },
  };

  const begleiter = {
    generate(ctx) {
      const { rng, level } = ctx;
      const pool = level === 1 ? G.NOUNS.slice(0, 30) : G.NOUNS;
      const n = F(pool, rng);
      return {
        signature: `begl-${n.sg}`,
        prompt: `Welcher Begleiter passt zu ${n.sg}?`,
        questionHtml: `
          <p class="q-label">Welcher Begleiter passt?</p>
          <p class="word-main">___ ${n.sg}</p>`,
        input: { kind: 'choice', choices: ['der', 'die', 'das'] },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: n.art,
        hints: [
          'Sprich das Wort laut mit der, die und das — was klingt richtig?',
          `Die Mehrzahl heißt „die ${n.pl || n.sg}". Das hilft nicht immer weiter — hier hilft nur Merken.`,
          `Richtig ist „${n.art} ${n.sg}".`,
        ],
      };
    },
  };

  const mehrzahl = {
    generate(ctx) {
      const { rng, level } = ctx;
      const pool = G.NOUNS.filter(n => n.pl);
      const easy = pool.filter(n => n.pl.indexOf(n.sg) === 0);   // nur Endung angehängt
      const n = level === 1 ? F(easy, rng) : F(pool, rng);
      // "ein Suppe" wäre falsch — der unbestimmte Artikel richtet sich
      // nach dem Begleiter des Namenworts.
      const one = n.art === 'die' ? 'eine' : 'ein';
      return {
        signature: `mz-${n.sg}`,
        prompt: `${one} ${n.sg} – viele was?`,
        questionHtml: `
          <p class="q-label">Wie heißt die Mehrzahl?</p>
          <p class="word-main">${one} ${n.sg} &nbsp;–&nbsp; viele <span class="math-blank">?</span></p>`,
        input: { kind: 'text', maxLength: 16, autocap: 'words' },
        answerMode: AnswerCheck.MODE.TEXT,
        answer: n.pl,
        hints: [
          'Sag es laut: „ein Hund – viele Hunde".',
          n.pl.indexOf(n.sg) === 0
            ? 'Hier wird nur eine Endung angehängt.'
            : 'Achtung: Der Selbstlaut ändert sich zu einem Umlaut.',
          `Richtig ist „${n.pl}".`,
        ],
      };
    },
  };

  const zusammengesetzt = {
    generate(ctx) {
      const { rng, level } = ctx;
      const c = F(G.COMPOUNDS, rng);
      const mode = level === 1 ? 'join' : (rng() < 0.5 ? 'join' : 'split');
      if (mode === 'split') {
        const others = S(G.COMPOUNDS.filter(x => x.word !== c.word), rng).slice(0, 2);
        return {
          signature: `zw-split-${c.word}`,
          prompt: `Aus welchen zwei Wörtern besteht ${c.word}?`,
          questionHtml: `
            <p class="q-label">Aus welchen zwei Wörtern besteht dieses Wort?</p>
            <p class="word-main">${c.word}</p>`,
          input: { kind: 'choice', choices: S([`${c.a} + ${c.b}`].concat(others.map(o => `${o.a} + ${o.b}`)), rng) },
          answerMode: AnswerCheck.MODE.CHOICE,
          answer: `${c.a} + ${c.b}`,
          hints: ['Sprich das Wort langsam — wo kannst du es teilen?', `${c.word} = ${c.a} + ${c.b}`],
        };
      }
      return {
        signature: `zw-join-${c.word}`,
        prompt: `${c.a} + ${c.b} ergibt welches Wort?`,
        questionHtml: `
          <p class="q-label">Bilde ein Wort:</p>
          <p class="word-main">${c.a} + ${c.b} = <span class="math-blank">?</span></p>`,
        input: { kind: 'text', maxLength: 20, autocap: 'words' },
        answerMode: AnswerCheck.MODE.TEXT,
        answer: c.word,
        hints: [
          'Schreibe die beiden Wörter einfach hintereinander.',
          'Das neue Wort ist ein Namenwort und wird großgeschrieben.',
          `Richtig ist „${c.word}".`,
        ],
      };
    },
  };

  const zeitwortErkennen = {
    generate(ctx) {
      const { rng } = ctx;
      const s = F(G.VERB_SENTENCES, rng);
      return {
        signature: `zwe-${s.words.join('_')}`,
        prompt: `Tippe das Zeitwort an: ${s.words.join(' ')}`,
        questionHtml: `
          <p class="q-label">Tippe das <strong>Zeitwort</strong> an.</p>
          <p class="q-sub">Ein Zeitwort sagt, was jemand tut.</p>`,
        input: { kind: 'tapWord', words: s.words },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: String(s.target),
        hints: [
          'Frage dich: Was tut jemand in diesem Satz?',
          'Zeitwörter schreibt man klein.',
          `Das Zeitwort ist „${s.words[s.target]}".`,
        ],
      };
    },
  };

  const zeitwortBeugen = {
    generate(ctx) {
      const { rng, level } = ctx;
      const pool = level === 1 ? G.VERBS.filter(v => !v.irregular) : G.VERBS;
      const v = F(pool, rng);
      const askDu = level < 3 ? true : rng() < 0.6;
      const answer = askDu ? v.du : v.er;
      return {
        signature: `zwb-${v.inf}-${askDu ? 'du' : 'er'}`,
        prompt: `ich ${v.ich} – ${askDu ? 'du' : 'er'} was?`,
        questionHtml: `
          <p class="q-label">Wie geht es weiter?</p>
          <p class="word-main">ich ${v.ich} &nbsp;–&nbsp; ${askDu ? 'du' : 'er'} <span class="math-blank">?</span></p>`,
        input: { kind: 'text', maxLength: 16, autocap: 'none' },
        answerMode: AnswerCheck.MODE.TEXT,
        answer,
        hints: [
          'Sag den Satz laut — was klingt richtig?',
          v.irregular
            ? 'Achtung: Bei diesem Zeitwort ändert sich der Selbstlaut.'
            : askDu ? 'Bei „du" hängt man meist -st an.' : 'Bei „er" oder „sie" hängt man meist -t an.',
          `Richtig ist „${answer}".`,
        ],
      };
    },
  };

  const eigenschaftswort = {
    generate(ctx) {
      const { rng, level } = ctx;
      const mode = level === 1 ? 'match' : (rng() < 0.5 ? 'match' : 'mark');
      if (mode === 'mark') {
        const s = F(G.ADJ_SENTENCES, rng);
        return {
          signature: `ew-mark-${s.words.join('_')}`,
          prompt: `Tippe das Eigenschaftswort an: ${s.words.join(' ')}`,
          questionHtml: `
            <p class="q-label">Tippe das <strong>Eigenschaftswort</strong> an.</p>
            <p class="q-sub">Ein Eigenschaftswort sagt, wie etwas ist.</p>`,
          input: { kind: 'tapWord', words: s.words },
          answerMode: AnswerCheck.MODE.CHOICE,
          answer: String(s.target),
          hints: [
            'Frage dich: Wie ist es?',
            'Eigenschaftswörter schreibt man klein.',
            `Das Eigenschaftswort ist „${s.words[s.target]}".`,
          ],
        };
      }
      const m = F(G.ADJ_MATCH, rng);
      return {
        signature: `ew-match-${m.thing}`,
        prompt: `${m.thing} ist wie?`,
        questionHtml: `
          <p class="q-label">Wie ist das?</p>
          <p class="big-emoji">${m.emoji}</p>
          <p class="word-main">${m.thing} ist …</p>`,
        input: { kind: 'choice', choices: S([m.right].concat(m.wrong), rng) },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: m.right,
        hints: ['Überlege, wie sich das anfühlt oder aussieht.', 'Zwei Antworten passen überhaupt nicht.'],
      };
    },
  };

  // ══ Sätze ═══════════════════════════════════════════════════════════════

  const satzzeichen = {
    generate(ctx) {
      const { rng, level } = ctx;
      const pool = level === 1
        ? G.PUNCTUATION.filter(p => p.mark !== '!')
        : G.PUNCTUATION;
      const p = F(pool, rng);
      return {
        signature: `sz-${p.text}`,
        prompt: `Welches Satzzeichen passt? ${p.text}`,
        questionHtml: `
          <p class="q-label">Welches Satzzeichen gehört ans Ende?</p>
          <p class="sentence-line">${Util.escapeHtml(p.text)} <span class="math-blank">?</span></p>`,
        input: { kind: 'choice', choices: ['.', '?', '!'] },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: p.mark,
        hints: [
          'Fragen beginnen oft mit Wie, Wo, Wann, Warum oder Wer.',
          'Ausrufe beginnen oft mit Au, Oh, Hurra oder Hilfe.',
          p.why,
        ],
      };
    },
  };

  const satzanfang = {
    generate(ctx) {
      const { rng } = ctx;
      const s = F(G.SENTENCE_STARTS, rng);
      const correct = s.lower.charAt(0).toUpperCase() + s.lower.slice(1);
      return {
        signature: `sa-${s.lower}`,
        prompt: `Wie schreibt man das erste Wort richtig? ${s.lower} ${s.rest}`,
        questionHtml: `
          <p class="q-label">Schreibe das erste Wort richtig.</p>
          <p class="sentence-line"><span class="sentence-error">${Util.escapeHtml(s.lower)}</span> ${Util.escapeHtml(s.rest)}</p>`,
        input: { kind: 'text', maxLength: 16, autocap: 'words' },
        answerMode: AnswerCheck.MODE.TEXT,
        strictCase: true,
        answer: correct,
        hints: [
          'Jeder Satz beginnt mit einem großen Buchstaben.',
          s.name ? 'Namen schreibt man außerdem immer groß.' : 'Nur der erste Buchstabe wird groß.',
          `Richtig ist „${correct}".`,
        ],
      };
    },
  };

  const satzbau = {
    generate(ctx) {
      const { rng, level } = ctx;
      const s = F(G.SENTENCE_PARTS, rng);
      const parts = s.parts.slice();
      // Regel: Genau der erste Baustein ist großgeschrieben — er gehört
      // an den Satzanfang. Dadurch ist die Lösung eindeutig.
      const shuffled = S(parts, rng);
      const sentence = parts.join(' ') + '.';
      return {
        signature: `sb-${parts.join('_')}`,
        prompt: `Baue einen Satz: ${shuffled.join(' / ')}`,
        questionHtml: `
          <p class="q-label">Baue einen richtigen Satz.</p>
          <p class="q-sub">Der großgeschriebene Baustein kommt an den Anfang. Den Punkt setzt die App.</p>`,
        input: { kind: 'order', items: shuffled, suffix: '.' },
        answerMode: AnswerCheck.MODE.ORDER,
        answer: parts,
        hints: [
          'Welcher Baustein ist großgeschrieben? Der beginnt den Satz.',
          'Danach kommt, was jemand tut.',
          `Richtig ist: „${sentence}"`,
        ],
      };
    },
  };

  // ══ Richtig schreiben ═══════════════════════════════════════════════════

  const silben = {
    generate(ctx) {
      const { rng, level } = ctx;
      const pool = G.SYLLABLE_WORDS.filter(w => w.level <= level);
      const w = F(pool.length ? pool : G.SYLLABLE_WORDS, rng);
      // Position der ersten Silbengrenze (Anzahl Buchstaben der ersten Silbe)
      const positions = [];
      let acc = 0;
      w.syllables.slice(0, -1).forEach(syl => { acc += syl.length; positions.push(acc); });
      return {
        signature: `syl-${w.word}`,
        prompt: `Setze die Silbengrenzen: ${w.word}`,
        questionHtml: `
          <p class="q-label">Wo sind die Silbengrenzen?</p>
          <p class="q-sub">Sprich das Wort langsam und klatsche mit. Tippe zwischen die Buchstaben.</p>`,
        input: { kind: 'tapGap', word: w.word, count: positions.length },
        answerMode: AnswerCheck.MODE.SET,
        answer: positions.map(String),
        hints: [
          'Klatsche das Wort: Wie viele Teile hörst du?',
          `${w.word} hat ${w.syllables.length} Silben.`,
          `Richtig ist ${w.syllables.join('|')}.`,
        ],
        tool: 'silben',
      };
    },
  };

  const stsp = {
    generate(ctx) {
      const { rng } = ctx;
      const w = F(G.ST_SP_WORDS, rng);
      return {
        signature: `stsp-${w.word}`,
        prompt: `St oder Sp? ___${w.rest} — ${w.clue}`,
        questionHtml: `
          <p class="q-label">St oder Sp?</p>
          <p class="word-masked">__${Util.escapeHtml(w.rest)}</p>
          <p class="q-sub">${Util.escapeHtml(w.clue)}</p>`,
        input: { kind: 'choice', choices: ['St', 'Sp'] },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: w.prefix,
        hints: [
          'Sprich das Wort langsam: Hörst du „scht" oder „schp"?',
          w.prefix === 'St' ? 'Man hört „scht" — geschrieben wird St.' : 'Man hört „schp" — geschrieben wird Sp.',
          `Das Wort heißt „${w.word}".`,
        ],
      };
    },
  };

  const umlaute = {
    generate(ctx) {
      const { rng, level } = ctx;
      const d = F(G.UMLAUT_DERIVATIONS, rng);
      if (level === 1) {
        const others = S(G.UMLAUT_DERIVATIONS.filter(x => x.base !== d.base), rng).slice(0, 2).map(x => x.base);
        return {
          signature: `uml-c-${d.form}`,
          prompt: `Von welchem Wort kommt ${d.form}?`,
          questionHtml: `
            <p class="q-label">Von welchem Wort kommt <strong>${d.form}</strong>?</p>
            <p class="q-sub">Das Grundwort erklärt, warum man ${d.letter} schreibt.</p>`,
          input: { kind: 'choice', choices: S([d.base].concat(others), rng) },
          answerMode: AnswerCheck.MODE.CHOICE,
          answer: d.base,
          hints: ['Suche das verwandte Wort ohne Umlaut.', `${d.form} kommt von ${d.base}.`],
        };
      }
      return {
        signature: `uml-t-${d.form}`,
        prompt: `Von welchem Wort kommt ${d.form}?`,
        questionHtml: `
          <p class="q-label">Schreibe das Grundwort:</p>
          <p class="word-main">${d.form} kommt von <span class="math-blank">?</span></p>
          <p class="q-sub">Darum schreibt man ${d.letter}.</p>`,
        input: { kind: 'text', maxLength: 16 },
        answerMode: AnswerCheck.MODE.TEXT,
        answer: d.base,
        hints: [
          'Suche ein verwandtes Wort ohne Umlaut.',
          `Denk an die Einzahl oder an das Tunwort.`,
          `${d.form} kommt von ${d.base}.`,
        ],
      };
    },
  };

  const langesIe = {
    generate(ctx) {
      const { rng } = ctx;
      const w = F(G.IE_WORDS, rng);
      return {
        signature: `ie-${w.word}`,
        prompt: `i oder ie? ${w.masked} — ${w.clue}`,
        questionHtml: `
          <p class="q-label">i oder ie?</p>
          <p class="word-masked">${Util.escapeHtml(w.masked)}</p>
          <p class="q-sub">${Util.escapeHtml(w.clue)}</p>`,
        input: { kind: 'choice', choices: ['i', 'ie'] },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: w.hasIe ? 'ie' : 'i',
        hints: [
          'Sprich das Wort langsam: Klingt das i lang oder kurz?',
          w.hasIe ? 'Ein langes i schreibt man hier mit ie.' : 'Ein kurzes i schreibt man nur mit i.',
          `Das Wort heißt „${w.word}".`,
        ],
      };
    },
  };

  const doppelmitlaut = {
    generate(ctx) {
      const { rng, level } = ctx;
      const useSingle = level >= 2 && rng() < 0.4;
      const w = useSingle ? F(G.SINGLE_CONSONANT, rng) : F(G.DOUBLE_CONSONANT, rng);
      return {
        signature: `dm-${w.word}`,
        prompt: `Welche Schreibweise ist richtig? ${w.clue}`,
        questionHtml: `
          <p class="q-label">Welches Wort ist richtig geschrieben?</p>
          <p class="q-sub">${Util.escapeHtml(w.clue)}</p>`,
        input: { kind: 'choice', choices: S([w.word, w.wrong], rng) },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: w.word,
        hints: [
          'Sprich das Wort langsam: Ist der Selbstlaut davor kurz oder lang?',
          useSingle
            ? 'Nach einem langen Selbstlaut steht nur ein Mitlaut.'
            : 'Nach einem kurzen Selbstlaut steht der doppelte Mitlaut.',
          `Richtig ist „${w.word}".`,
        ],
      };
    },
  };

  const verlaengern = {
    generate(ctx) {
      const { rng } = ctx;
      const w = F(G.EXTEND_WORDS, rng);
      return {
        signature: `vl-${w.word}`,
        prompt: `${w.masked} – ${w.longer}. Welcher Buchstabe fehlt?`,
        questionHtml: `
          <p class="q-label">Welcher Buchstabe fehlt?</p>
          <p class="word-masked">${Util.escapeHtml(w.masked)}</p>
          <p class="q-sub">Verlängere das Wort: <strong>${Util.escapeHtml(w.longer)}</strong></p>`,
        input: { kind: 'text', maxLength: 1, autocap: 'none' },
        answerMode: AnswerCheck.MODE.TEXT,
        answer: w.letter,
        hints: [
          'Sprich die verlängerte Form laut aus.',
          `In „${w.longer}" hörst du den Buchstaben deutlich.`,
          `Richtig ist „${w.letter}" — das Wort heißt ${w.word}.`,
        ],
      };
    },
  };

  const fehlerFinden = {
    generate(ctx) {
      const { rng } = ctx;
      const s = F(G.ERROR_SENTENCES, rng);
      const shown = s.words.map((w, i) =>
        i === s.index ? `<span class="sentence-error">${Util.escapeHtml(w)}</span>` : Util.escapeHtml(w)).join(' ');
      return {
        signature: `ff-${s.words.join('_')}`,
        prompt: `Verbessere das markierte Wort: ${s.words[s.index]}`,
        questionHtml: `
          <p class="q-label">In diesem Satz ist <strong>ein</strong> Fehler. Er ist schon markiert.</p>
          <p class="sentence-line">${shown}</p>
          <p class="q-sub">Schreibe das markierte Wort richtig.</p>`,
        input: { kind: 'text', maxLength: 20, autocap: 'words' },
        answerMode: AnswerCheck.MODE.TEXT,
        strictCase: true,
        answer: s.correct,
        accept: [s.correct.replace(/[.,!?]$/, '')],
        hints: [
          'Lies das Wort langsam. Was stimmt nicht?',
          s.rule,
          `Richtig ist „${s.correct}".`,
        ],
      };
    },
  };

  const merkwoerter = {
    generate(ctx) {
      const { rng } = ctx;
      const w = F(G.MEMORY_WORDS, rng);
      return {
        signature: `mw-${w.word}`,
        prompt: `Merke dir das Wort ${w.word} und schreibe es dann auf.`,
        questionHtml: '',
        input: { kind: 'lookCoverWrite', word: w.word, seconds: 6 },
        answerMode: AnswerCheck.MODE.TEXT,
        strictCase: true,
        answer: w.word,
        hints: [
          'Sprich das Wort in Silben mit.',
          w.tip,
          `Das Wort heißt „${w.word}".`,
        ],
      };
    },
  };

  /** Persönliche Lernwörter — nur mit geprüften Übungsformen. */
  const lernwoerter = {
    generate(ctx) {
      const { rng, profile } = ctx;
      const list = ((profile && profile.learnWords) || [])
        .map(x => x.word)
        .filter(word => G.learnWordCapabilities(word).lookCoverWrite);
      if (!list.length) {
        return {
          signature: 'lw-empty',
          prompt: 'Es sind noch keine Lernwörter eingetragen.',
          questionHtml: `
            <p class="q-label">Hier gibt es noch keine Lernwörter.</p>
            <p class="q-sub">Ein Erwachsener kann sie im Elternbereich eintragen.</p>`,
          input: { kind: 'info' },
          answerMode: AnswerCheck.MODE.CHOICE,
          answer: 'ok',
          hints: ['Elternbereich → Lernwörter der Woche.'],
          empty: true,
        };
      }
      const word = F(list, rng);
      return {
        signature: `lw-${word}`,
        prompt: `Merke dir dein Lernwort ${word} und schreibe es dann auf.`,
        questionHtml: '',
        input: { kind: 'lookCoverWrite', word, seconds: 7 },
        answerMode: AnswerCheck.MODE.TEXT,
        strictCase: true,
        answer: word,
        hints: [
          'Sprich das Wort in Silben mit.',
          'Schau es dir noch einmal an, wenn du unsicher bist.',
          `Das Wort heißt „${word}".`,
        ],
      };
    },
  };

  // ══ Lesen ═══════════════════════════════════════════════════════════════

  const leseAnweisung = {
    generate(ctx) {
      const { rng, level } = ctx;
      const count = level === 1 ? 3 : level === 2 ? 4 : 5;
      const shapes = S(G.SHAPES_FOR_READING, rng).slice(0, count);
      const taps = level === 1 ? 2 : level === 2 ? 2 : 3;
      const order = S(shapes, rng).slice(0, taps);
      const words = ['zuerst', 'dann', 'zuletzt'];
      const text = order.map((s, i) => `Tippe ${words[i]} auf ${articleFor(s.label)} ${s.label}.`).join(' ');
      return {
        signature: `la-${order.map(s => s.id).join('_')}`,
        prompt: text,
        questionHtml: `
          <p class="q-label">Lies genau und tippe in der richtigen Reihenfolge.</p>
          <p class="reading-instruction">${Util.escapeHtml(text)}</p>`,
        input: { kind: 'tapShapes', shapes, count: taps },
        answerMode: AnswerCheck.MODE.ORDER,
        answer: order.map(s => s.id),
        hints: [
          'Lies den Satz noch einmal langsam.',
          'Achte auf die Wörter zuerst, dann und zuletzt.',
          `Reihenfolge: ${order.map(s => s.label).join(' → ')}`,
        ],
      };
    },
  };

  function articleFor(label) {
    const map = { Stern: 'den', Kreis: 'den', Dreieck: 'das', Quadrat: 'das', Herz: 'das', Blume: 'die' };
    return map[label] || 'die';
  }

  const bildSatz = {
    generate(ctx) {
      const { rng, level } = ctx;
      const p = F(G.PICTURE_SENTENCES, rng);
      if (level === 1) {
        return {
          signature: `bs-pick-${p.emoji}`,
          prompt: 'Welcher Satz passt zum Bild?',
          questionHtml: `
            <p class="q-label">Welcher Satz passt zum Bild?</p>
            <p class="big-emoji">${p.emoji}</p>`,
          input: { kind: 'choice', choices: S([p.right].concat(p.wrong), rng) },
          answerMode: AnswerCheck.MODE.CHOICE,
          answer: p.right,
          hints: ['Schau dir das Bild genau an.', 'Lies jeden Satz und vergleiche.'],
        };
      }
      const useRight = rng() < 0.5;
      const sentence = useRight ? p.right : F(p.wrong, rng);
      return {
        signature: `bs-yn-${p.emoji}-${sentence}`,
        prompt: `Passt der Satz „${sentence}" zum Bild?`,
        questionHtml: `
          <p class="q-label">Passt der Satz zum Bild?</p>
          <p class="big-emoji">${p.emoji}</p>
          <p class="sentence-line">${Util.escapeHtml(sentence)}</p>`,
        input: { kind: 'choice', choices: ['Ja, das passt', 'Nein, das passt nicht'] },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: useRight ? 'Ja, das passt' : 'Nein, das passt nicht',
        hints: ['Lies den Satz Wort für Wort.', `Auf dem Bild siehst du: ${p.right}`],
      };
    },
  };

  const tabelleLesen = {
    generate(ctx) {
      const { rng, level } = ctx;
      const t = F(G.TABLES, rng);
      const idx = R(0, t.rows.length - 1, rng);
      const kinds = level === 1 ? ['read'] : ['read', 'max', 'diff'];
      const kind = F(kinds, rng);
      const values = t.rows.map(r => r[1]);
      const maxIdx = values.indexOf(Math.max.apply(null, values));
      const minIdx = values.indexOf(Math.min.apply(null, values));

      if (kind === 'max') {
        return {
          signature: `tab-max-${t.title}`,
          prompt: `Wovon gibt es am meisten? ${t.title}`,
          questionHtml: `
            ${Widgets.table(t.columns, t.rows, { caption: t.title })}
            <p class="q-sub">Wovon gibt es am meisten?</p>`,
          input: { kind: 'choice', choices: S(t.rows.map(r => r[0]), rng) },
          answerMode: AnswerCheck.MODE.CHOICE,
          answer: t.rows[maxIdx][0],
          hints: ['Vergleiche die Zahlen in der zweiten Spalte.', `Die größte Zahl ist ${values[maxIdx]}.`],
        };
      }
      if (kind === 'diff') {
        return {
          signature: `tab-diff-${t.title}`,
          prompt: `Wie groß ist der Unterschied zwischen dem größten und dem kleinsten Wert?`,
          questionHtml: `
            ${Widgets.table(t.columns, t.rows, { caption: t.title })}
            <p class="q-sub">Wie viel mehr gibt es von „${t.rows[maxIdx][0]}" als von „${t.rows[minIdx][0]}"?</p>`,
          input: { kind: 'number', max: 100 },
          answerMode: AnswerCheck.MODE.NUMBER,
          answer: values[maxIdx] - values[minIdx],
          hints: ['Lies beide Zahlen ab.', `${values[maxIdx]} − ${values[minIdx]} = ?`],
        };
      }
      return {
        signature: `tab-read-${t.title}-${idx}`,
        prompt: `Wie viele ${t.rows[idx][0]}?`,
        questionHtml: `
          ${Widgets.table(t.columns, t.rows, { caption: t.title })}
          <p class="q-sub">Wie viele ${Util.escapeHtml(String(t.rows[idx][0]))} sind es?</p>`,
        input: { kind: 'number', max: 100 },
        answerMode: AnswerCheck.MODE.NUMBER,
        answer: t.rows[idx][1],
        hints: [
          'Suche die Zeile mit dem Wort.',
          'Fahre mit dem Finger nach rechts in die zweite Spalte.',
        ],
      };
    },
  };

  const sachtext = {
    generate(ctx) {
      const { rng } = ctx;
      const t = F(G.SHORT_TEXTS, rng);
      const q = F(t.questions, rng);
      return {
        signature: `st-${t.title}-${q.q}`,
        prompt: `${t.text} Frage: ${q.q}`,
        questionHtml: `
          <div class="short-text">
            <h3 class="short-text-title">${Util.escapeHtml(t.title)}</h3>
            <p class="short-text-body">${Util.escapeHtml(t.text)}</p>
          </div>
          <p class="q-label">${Util.escapeHtml(q.q)}</p>`,
        input: { kind: 'choice', choices: S([q.right].concat(q.wrong), rng) },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: q.right,
        hints: [
          'Lies den Text noch einmal.',
          'Die Antwort steht wörtlich im Text.',
          `Im Text steht: ${q.right}.`,
        ],
      };
    },
  };

  const reihenfolge = {
    generate(ctx) {
      const { rng } = ctx;
      const s = F(G.STEP_SEQUENCES, rng);
      const shuffled = S(s.steps, rng);
      return {
        signature: `rf-${s.title}`,
        prompt: `${s.title}: Bringe die Schritte in die richtige Reihenfolge.`,
        questionHtml: `
          <p class="q-label">${Util.escapeHtml(s.title)}</p>
          <p class="q-sub">Was kommt zuerst? Tippe die Schritte der Reihe nach an.</p>`,
        input: { kind: 'order', items: shuffled },
        answerMode: AnswerCheck.MODE.ORDER,
        answer: s.steps,
        hints: [
          'Überlege, womit man anfängt.',
          'Was geht erst, wenn der erste Schritt fertig ist?',
          `Richtig ist: ${s.steps.join(' → ')}`,
        ],
      };
    },
  };

  const packliste = {
    generate(ctx) {
      const { rng } = ctx;
      const p = F(G.PACKING_LISTS, rng);
      const items = S(p.right.concat(p.wrong), rng);
      return {
        signature: `pl-${p.title}`,
        prompt: `${p.title} Wähle die drei passenden Dinge.`,
        questionHtml: `
          <p class="q-label">${Util.escapeHtml(p.title)}</p>
          <p class="q-sub">Wähle die <strong>drei</strong> Dinge aus, die dazugehören.</p>`,
        input: { kind: 'set', items, count: 3 },
        answerMode: AnswerCheck.MODE.SET,
        answer: p.right,
        hints: [
          'Überlege bei jedem Ding: Brauche ich das dafür wirklich?',
          'Drei Dinge passen überhaupt nicht.',
          `Richtig sind: ${p.right.join(', ')}`,
        ],
      };
    },
  };

  // ══ Wörterhaus, Klasse 1 ════════════════════════════════════════════════

  const missingLetter = {
    generate(ctx) {
      const { rng, level } = ctx;
      const pool = W.MISSING_LETTER.filter(e => e.level === level);
      const e = F(pool.length >= 5 ? pool : W.MISSING_LETTER, rng);
      return {
        signature: `ml-${e.word}`,
        prompt: `Welcher Buchstabe fehlt? ${e.masked} — ${e.clue}`,
        questionHtml: `
          <p class="q-label">Welcher Buchstabe fehlt?</p>
          ${Widgets.maskedWord(e.masked)}
          <p class="q-sub">${Util.escapeHtml(e.clue)}</p>`,
        input: { kind: 'text', maxLength: 1, autocap: 'characters' },
        answerMode: AnswerCheck.MODE.TEXT,
        answer: e.letter,
        hints: [
          'Lies den Hinweis noch einmal — welches Wort ist gemeint?',
          `Das Wort hat ${e.word.length} Buchstaben.`,
          `Das Wort lautet ${e.word}.`,
        ],
      };
    },
  };

  const sortLetters = {
    generate(ctx) {
      const { rng, level } = ctx;
      const pool = W.BUILD_WORDS.filter(e => e.level === level);
      const e = F(pool.length >= 5 ? pool : W.BUILD_WORDS, rng);
      let letters = S(e.word.split(''), rng);
      let guard = 0;
      while (letters.join('') === e.word && guard++ < 10) letters = S(e.word.split(''), rng);
      return {
        signature: `sl-${e.word}`,
        prompt: `Mach ein Wort aus: ${letters.join(' ')} — ${e.clue}`,
        questionHtml: `
          <p class="q-label">Mach ein Wort daraus:</p>
          <p class="letter-scramble">${letters.join(' ')}</p>
          <p class="q-sub">${Util.escapeHtml(e.clue)} (${e.word.length} Buchstaben)</p>`,
        input: { kind: 'text', maxLength: e.word.length + 2, autocap: 'characters' },
        answerMode: AnswerCheck.MODE.TEXT,
        answer: e.word,
        hints: [
          'Lies den Hinweis noch einmal.',
          `Der erste Buchstabe ist ${e.word[0]}.`,
          `Das Wort lautet ${e.word}.`,
        ],
      };
    },
  };

  const wordCategory = {
    generate(ctx) {
      const { rng } = ctx;
      const category = F(W.CATEGORIES, rng);
      const conflicts = W.CATEGORY_CONFLICTS[category] || [];
      const inCat = W.CATEGORY_ITEMS.filter(d => d.cat === category);
      const outCat = W.CATEGORY_ITEMS.filter(d => d.cat !== category && !conflicts.includes(d.cat));
      const correct = F(inCat, rng).w;
      const wrong = S(outCat, rng).slice(0, 2).map(d => d.w);
      return {
        signature: `wc-${category}-${correct}`,
        prompt: `Was passt zu ${W.CATEGORY_LABELS[category] || category}?`,
        questionHtml: `<p class="q-label">Was passt zu <strong>${W.CATEGORY_LABELS[category] || category}</strong>?</p>`,
        input: { kind: 'choice', choices: S([correct].concat(wrong), rng) },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: correct,
        hints: [W.CATEGORY_HINTS[category] || 'Überlege, was zu dieser Gruppe gehört.'],
      };
    },
  };

  const opposites = {
    generate(ctx) {
      const { rng } = ctx;
      const pair = F(W.OPPOSITE_PAIRS, rng);
      const flip = rng() < 0.5;
      const word = flip ? pair[1] : pair[0];
      const opposite = flip ? pair[0] : pair[1];
      const others = W.OPPOSITE_PAIRS
        .filter(p => p !== pair)
        .map(p => (rng() < 0.5 ? p[1] : p[0]))
        .filter(w => !W.isTooSimilar(w, opposite) && !W.isTooSimilar(w, word));
      const wrong = S(others, rng).slice(0, 2);
      return {
        signature: `op-${word}`,
        prompt: `Was ist das Gegenteil von ${word}?`,
        questionHtml: `
          <p class="q-label">Was ist das Gegenteil von:</p>
          <p class="word-main">${Util.escapeHtml(word)}</p>`,
        input: { kind: 'choice', choices: S([opposite].concat(wrong), rng) },
        answerMode: AnswerCheck.MODE.CHOICE,
        answer: opposite,
        hints: [`Das gesuchte Wort beginnt mit „${opposite[0].toUpperCase()}".`],
      };
    },
  };

  return {
    abcOrdnen, abcNachbarn,
    namenwortErkennen, begleiter, mehrzahl, zusammengesetzt,
    zeitwortErkennen, zeitwortBeugen, eigenschaftswort,
    satzzeichen, satzanfang, satzbau,
    silben, stsp, umlaute, langesIe, doppelmitlaut, verlaengern,
    fehlerFinden, merkwoerter, lernwoerter,
    leseAnweisung, bildSatz, tabelleLesen, sachtext, reihenfolge, packliste,
    missingLetter, sortLetters, wordCategory, opposites,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = GermanGen;
