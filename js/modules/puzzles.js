/**
 * modules/puzzles.js
 * Rätselhöhle — Logisches Denken und Konzentration für Klasse 2.
 */

const PuzzlesModule = (() => {
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
  function wasRecent(id, key) {
    return (recentKeys[id] || []).includes(String(key));
  }
  function markRecent(id, key) {
    if (!recentKeys[id]) recentKeys[id] = [];
    recentKeys[id].push(String(key));
    if (recentKeys[id].length > RECENT_WINDOW) recentKeys[id].shift();
  }

  // ─── Daten: Wortgruppen für Odd-one-out und Memory ───────────────────────

  const WORD_GROUPS = {
    Tiere: [
      'Hund',
      'Katze',
      'Pferd',
      'Vogel',
      'Fisch',
      'Wolf',
      'Bär',
      'Fuchs',
      'Hase',
      'Igel',
      'Ente',
      'Huhn',
      'Schaf',
      'Ziege',
      'Löwe',
      'Adler',
      'Frosch',
      'Biene',
      'Rabe',
      'Esel',
    ],
    Fahrzeuge: [
      'Auto',
      'Bus',
      'Zug',
      'Flugzeug',
      'Schiff',
      'Fahrrad',
      'Motorrad',
      'Lkw',
      'Traktor',
      'Taxi',
      'Boot',
      'Roller',
      'Hubschrauber',
      'Rakete',
      'Bagger',
      'Tram',
      'Kutsche',
      'U-Boot',
    ],
    Möbel: [
      'Tisch',
      'Stuhl',
      'Bett',
      'Schrank',
      'Sofa',
      'Lampe',
      'Regal',
      'Sessel',
      'Kommode',
      'Hocker',
      'Schreibtisch',
      'Kleiderschrank',
      'Spiegel',
    ],
    Farben: [
      'Rot',
      'Blau',
      'Grün',
      'Gelb',
      'Schwarz',
      'Weiß',
      'Braun',
      'Orange',
      'Lila',
      'Pink',
      'Grau',
      'Rosa',
      'Türkis',
    ],
    Kleidung: [
      'Hemd',
      'Hose',
      'Rock',
      'Kleid',
      'Mantel',
      'Jacke',
      'Schuhe',
      'Socken',
      'Mütze',
      'Schal',
      'Pullover',
      'Stiefel',
      'Gürtel',
    ],
    Lebensmittel: [
      'Brot',
      'Milch',
      'Apfel',
      'Banane',
      'Birne',
      'Käse',
      'Ei',
      'Butter',
      'Kuchen',
      'Kirsche',
      'Tomate',
      'Gurke',
      'Salat',
      'Karotte',
    ],
    Körperteile: [
      'Kopf',
      'Auge',
      'Ohr',
      'Nase',
      'Mund',
      'Zahn',
      'Arm',
      'Hand',
      'Finger',
      'Bein',
      'Fuß',
      'Knie',
      'Bauch',
      'Rücken',
      'Schulter',
    ],
    Pflanzen: [
      'Baum',
      'Rose',
      'Tulpe',
      'Gras',
      'Busch',
      'Efeu',
      'Tanne',
      'Eiche',
      'Birke',
      'Blume',
      'Kaktus',
      'Moos',
      'Farn',
      'Bambus',
      'Palme',
    ],
    Sportarten: [
      'Fußball',
      'Schwimmen',
      'Turnen',
      'Radfahren',
      'Laufen',
      'Tennis',
      'Basketball',
      'Handball',
      'Klettern',
      'Tanzen',
      'Skifahren',
      'Reiten',
    ],
    Instrumente: [
      'Geige',
      'Klavier',
      'Flöte',
      'Gitarre',
      'Trommel',
      'Trompete',
      'Harfe',
      'Cello',
      'Saxofon',
      'Mundharmonika',
      'Akkordeon',
    ],
    Berufe: [
      'Arzt',
      'Lehrer',
      'Bäcker',
      'Feuerwehrmann',
      'Polizist',
      'Koch',
      'Gärtner',
      'Pilot',
      'Sänger',
      'Maler',
      'Mechaniker',
    ],
    Jahreszeiten: ['Frühling', 'Sommer', 'Herbst', 'Winter'],
    Wetter: ['Regen', 'Sonne', 'Schnee', 'Wind', 'Gewitter', 'Hagel', 'Nebel', 'Frost', 'Sturm'],
    Zahlen: ['Eins', 'Zwei', 'Drei', 'Vier', 'Fünf', 'Sechs', 'Sieben', 'Acht', 'Neun', 'Zehn'],
    Formen: ['Kreis', 'Quadrat', 'Dreieck', 'Rechteck', 'Stern', 'Oval', 'Raute', 'Herzform'],
  };

  const GROUP_NAMES = Object.keys(WORD_GROUPS);

  // Diese Gruppen überschneiden sich inhaltlich (eine Tomate ist auch eine
  // Pflanze, ein Huhn auch ein Lebensmittel, Schnee gehört zum Winter).
  // Sie dürfen bei „Welches passt nicht?" nie kombiniert werden.
  const INCOMPATIBLE_GROUPS = [
    ['Pflanzen', 'Lebensmittel'],
    ['Tiere', 'Lebensmittel'],
    ['Wetter', 'Jahreszeiten'],
  ];

  function groupsCompatible(g1, g2) {
    return !INCOMPATIBLE_GROUPS.some(([a, b]) => (a === g1 && b === g2) || (a === g2 && b === g1));
  }

  // ─── Daten: Formen für Muster-Erkennung ──────────────────────────────────

  const SHAPES = ['○', '□', '△', '♦', '⭐', '❤'];

  // Jede Sequenz zeigt zwei volle Wiederholungen des Musters.
  // Das letzte Element ist die gesuchte Antwort — so ist die Fortsetzung
  // immer eindeutig aus dem sichtbaren Teil ablesbar.
  function buildShapePatterns() {
    const patterns = [];
    for (let i = 0; i < SHAPES.length; i++) {
      for (let j = 0; j < SHAPES.length; j++) {
        if (i === j) continue;
        const A = SHAPES[i],
          B = SHAPES[j];
        // AB AB A? → B
        patterns.push({ seq: [A, B, A, B, A, B] });
        // AAB AA? → B
        patterns.push({ seq: [A, A, B, A, A, B] });
        // ABB AB? → B
        patterns.push({ seq: [A, B, B, A, B, B] });
      }
    }
    // ABC AB? → C (Muster aus 3 Formen)
    for (let i = 0; i < SHAPES.length; i++) {
      for (let j = 0; j < SHAPES.length; j++) {
        for (let k = 0; k < SHAPES.length; k++) {
          if (i === j || j === k || i === k) continue;
          const A = SHAPES[i],
            B = SHAPES[j],
            C = SHAPES[k];
          patterns.push({ seq: [A, B, C, A, B, C] });
        }
      }
    }
    // Die richtige Antwort ist immer das letzte Element der Sequenz
    patterns.forEach((p) => {
      p.answer = p.seq[p.seq.length - 1];
    });
    return shuffle(patterns);
  }

  const SHAPE_PATTERNS = buildShapePatterns();

  // ─── Daten: 4×4 Sudoku ───────────────────────────────────────────────────

  const BASE_GRID = [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1],
  ];

  function generateSudoku() {
    // Deep copy and apply permutations for variety
    let g = BASE_GRID.map((r) => r.slice());

    // Swap rows within bands
    if (Math.random() < 0.5) {
      [g[0], g[1]] = [g[1].slice(), g[0].slice()];
    }
    if (Math.random() < 0.5) {
      [g[2], g[3]] = [g[3].slice(), g[2].slice()];
    }
    // Swap column bands
    if (Math.random() < 0.5) {
      g = g.map((r) => [r[2], r[3], r[0], r[1]]);
    }
    // Relabel numbers via random permutation
    const perm = shuffle([1, 2, 3, 4]);
    g = g.map((r) => r.map((v) => perm[v - 1]));

    // Pick one cell to remove (not a corner, prefer middle)
    const positions = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) positions.push([r, c]);
    const [row, col] = randomFrom(positions);
    const answer = g[row][col];
    const puzzle = g.map((r) => r.slice());
    puzzle[row][col] = 0;

    return { grid: puzzle, answer, row, col };
  }

  function renderSudokuGrid(grid, row, col) {
    let html = '<div class="sudoku-grid">';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = grid[r][c];
        if (r === row && c === col) {
          html += `<div class="sudoku-cell sudoku-cell--empty">?</div>`;
        } else {
          html += `<div class="sudoku-cell">${val}</div>`;
        }
      }
    }
    html += '</div>';
    return html;
  }

  // ─── Aufgaben-Generatoren ─────────────────────────────────────────────────

  const exercises = {
    numberPattern: {
      id: 'numberPattern',
      title: 'Zahlenmuster',
      icon: '🔢',
      description: 'Was kommt danach?',
      generate(difficulty) {
        // Zahlenraum passend für Klasse 1–2: kleine Schritte, Ergebnisse unter 50
        const rules =
          difficulty === 1
            ? [
                () => {
                  const s = randomInt(1, 8),
                    d = randomInt(1, 2);
                  return {
                    seq: [s, s + d, s + 2 * d, s + 3 * d],
                    ans: s + 4 * d,
                    hint: `Es geht immer +${d} weiter.`,
                  };
                },
                () => {
                  const s = randomInt(9, 20),
                    d = randomInt(1, 2);
                  return {
                    seq: [s, s - d, s - 2 * d, s - 3 * d],
                    ans: s - 4 * d,
                    hint: `Es geht immer −${d} zurück.`,
                  };
                },
              ]
            : difficulty === 2
              ? [
                  () => {
                    const s = randomInt(1, 5),
                      d = randomInt(2, 3);
                    return {
                      seq: [s, s + d, s + 2 * d, s + 3 * d],
                      ans: s + 4 * d,
                      hint: `Es geht immer +${d} weiter.`,
                    };
                  },
                  () => {
                    const s = randomInt(10, 20),
                      d = randomInt(2, 3);
                    return {
                      seq: [s, s - d, s - 2 * d, s - 3 * d],
                      ans: s - 4 * d,
                      hint: `Es geht immer −${d} zurück.`,
                    };
                  },
                ]
              : [
                  () => {
                    const s = randomInt(1, 2);
                    return {
                      seq: [s, s * 2, s * 4, s * 8],
                      ans: s * 16,
                      hint: 'Jede Zahl wird verdoppelt.',
                    };
                  },
                  () => {
                    const s = randomInt(2, 6),
                      d = randomInt(3, 5);
                    return {
                      seq: [s, s + d, s + 2 * d, s + 3 * d],
                      ans: s + 4 * d,
                      hint: `Es geht immer +${d} weiter.`,
                    };
                  },
                  () => {
                    const s = randomInt(20, 40),
                      d = randomInt(3, 5);
                    return {
                      seq: [s, s - d, s - 2 * d, s - 3 * d],
                      ans: s - 4 * d,
                      hint: `Es geht immer −${d} zurück.`,
                    };
                  },
                ];

        let attempt = 0;
        let result;
        do {
          const rule = randomFrom(rules);
          result = rule();
          attempt++;
        } while (
          (result.ans <= 0 || result.ans > 50 || wasRecent('numberPattern', result.ans)) &&
          attempt < 15
        );
        markRecent('numberPattern', result.ans);

        const seqHtml =
          result.seq
            .map((n) => `<div class="seq-num">${n}</div><div class="seq-sep">,</div>`)
            .join('') + `<div class="seq-num seq-num--blank">?</div>`;

        return {
          questionHtml: `
            <p class="q-label">Was kommt danach?</p>
            <div class="number-sequence">${seqHtml}</div>
          `,
          answer: String(result.ans),
          hint: result.hint,
          taskType: 'text',
          inputMaxLength: 4,
        };
      },
    },

    shapePattern: {
      id: 'shapePattern',
      title: 'Muster erkennen',
      icon: '🔷',
      description: 'Welche Form kommt danach?',
      generate(difficulty) {
        let pat;
        let attempts = 0;
        do {
          pat = randomFrom(SHAPE_PATTERNS);
          attempts++;
        } while (wasRecent('shapePattern', pat.answer + pat.seq[0]) && attempts < 20);
        markRecent('shapePattern', pat.answer + pat.seq[0]);

        const seqHtml = pat.seq
          .map((s, i) =>
            i < pat.seq.length - 1
              ? `<span class="shape-item">${s}</span>`
              : `<span class="shape-item--blank">?</span>`
          )
          .join('');

        // Falsche Antworten: bevorzugt die andere Form aus dem Muster
        // (plausibel, aber eindeutig falsch) plus eine zufällige Form
        const inSeq = [...new Set(pat.seq)].filter((s) => s !== pat.answer);
        const outside = shuffle(SHAPES.filter((s) => s !== pat.answer && !inSeq.includes(s)));
        const wrongChoices = [...inSeq, ...outside].slice(0, 2);
        const choices = shuffle([pat.answer, ...wrongChoices]);

        return {
          questionHtml: `
            <p class="q-label">Welche Form kommt danach?</p>
            <div class="shape-sequence">${seqHtml}</div>
          `,
          answer: pat.answer,
          hint: 'Schau dir das Muster genau an – welche Form ist dran?',
          taskType: 'choice',
          choices,
        };
      },
    },

    oddOneOut: {
      id: 'oddOneOut',
      title: 'Welches passt nicht?',
      icon: '🚫',
      description: 'Finde das Wort, das nicht dazu passt',
      generate(difficulty) {
        let odd, options;
        let attempts = 0;
        do {
          const g1 = randomFrom(GROUP_NAMES);
          const g2 = randomFrom(GROUP_NAMES.filter((g) => g !== g1 && groupsCompatible(g1, g)));
          const three = shuffle(WORD_GROUPS[g1]).slice(0, 3);
          const one = randomFrom(WORD_GROUPS[g2]);
          odd = one;
          options = shuffle([...three, one]);
          attempts++;
        } while (wasRecent('oddOneOut', odd) && attempts < 20);
        markRecent('oddOneOut', odd);

        return {
          questionHtml: `<p class="q-label">Welches Wort passt <strong>nicht</strong> zu den anderen?</p>`,
          answer: odd,
          hint: 'Drei Wörter gehören zur selben Gruppe. Welches nicht?',
          taskType: 'choice',
          choices: options,
        };
      },
    },

    memoryTask: {
      id: 'memoryTask',
      title: 'Gedächtnis',
      icon: '🧠',
      description: 'Merke dir die Wörter!',
      generate(difficulty) {
        const showCount = difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5;
        const group = randomFrom(GROUP_NAMES);
        const groupWords = WORD_GROUPS[group];
        const shown = shuffle(groupWords).slice(0, showCount);

        // Das gesuchte Wort kommt aus einer anderen Gruppe und darf
        // keinesfalls unter den gezeigten Wörtern sein.
        let notShown;
        let attempts = 0;
        do {
          const otherGroup = randomFrom(GROUP_NAMES.filter((g) => g !== group));
          notShown = randomFrom(WORD_GROUPS[otherGroup]);
          attempts++;
        } while ((shown.includes(notShown) || wasRecent('memoryTask', notShown)) && attempts < 15);
        markRecent('memoryTask', notShown);

        const choices = shuffle([...shuffle(shown).slice(0, 2), notShown]);

        return {
          questionHtml: '',
          answer: notShown,
          hint: 'Das fehlende Wort war NICHT in der Liste.',
          taskType: 'memory',
          memoryWords: shown,
          choices,
          memorySeconds: difficulty === 1 ? 5 : difficulty === 2 ? 4 : 3,
        };
      },
    },

    miniSudoku: {
      id: 'miniSudoku',
      title: 'Zahlen-Quadrat',
      icon: '🔲',
      description: 'Welche Zahl fehlt?',
      generate(difficulty) {
        let sudoku;
        let attempts = 0;
        do {
          sudoku = generateSudoku();
          attempts++;
        } while (wasRecent('miniSudoku', sudoku.answer) && attempts < 10);
        markRecent('miniSudoku', sudoku.answer);

        const gridHtml = renderSudokuGrid(sudoku.grid, sudoku.row, sudoku.col);
        const wrongNums = [1, 2, 3, 4].filter((n) => n !== sudoku.answer);
        const choices = shuffle([sudoku.answer, ...shuffle(wrongNums).slice(0, 2)]);

        return {
          questionHtml: `
            <p class="q-label">Welche Zahl fehlt?</p>
            <p class="q-sub">In jeder Zeile kommt jede Zahl von 1 bis 4 nur einmal vor.</p>
            <div class="sudoku-wrap">${gridHtml}</div>
          `,
          answer: String(sudoku.answer),
          hint: 'Schau dir die Zeile mit dem ? an: Welche Zahl von 1 bis 4 fehlt dort noch?',
          taskType: 'choice',
          choices: choices.map(String),
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
    if (currentTask._retry || sessionStats.total >= sessionLength) return;
    retryQueue.push({ ...currentTask, _retry: true, _notBefore: sessionStats.total + 2 });
  }

  function nextTask() {
    if (
      retryQueue.length &&
      (retryQueue[0]._notBefore <= sessionStats.total || sessionStats.total >= sessionLength)
    ) {
      return retryQueue.shift();
    }
    return generateTask(currentExerciseId);
  }

  const FEEDBACK_WRONG = [
    'Fast! Schau noch genauer hin! 💪',
    'Nicht ganz – du schaffst das! 🌟',
    'Noch ein Versuch! ✨',
    'Probier es nochmal! 🎯',
    'Denk noch mal nach! 🤔',
  ];

  const PRAISE_MESSAGES = [
    'Super gelöst! 🎉',
    'Was für ein Detektiv! 🔍',
    'Oskar ist beeindruckt! 🐶',
    'Klasse gerätselt! 💫',
    'Du bist ein Rätsel-Profi! ⭐',
    'Fantastisch! 🏆',
    'Scharfsinnig! 🧠',
    'Brilliant! ✨',
  ];

  function getSessionStars(correct, total) {
    const r = correct / total;
    return r >= 0.9 ? 3 : r >= 0.7 ? 2 : r >= 0.5 ? 1 : 0;
  }

  function getPerformanceText(correct, total) {
    const r = correct / total;
    if (r === 1) return 'Perfekte Leistung! 🏆';
    if (r >= 0.9) return 'Sehr stark! 🌟';
    if (r >= 0.7) return 'Gut gemacht! 👍';
    if (r >= 0.5) return 'Weiter üben! 💪';
    return 'Nicht aufgeben! 🌈';
  }

  function launchConfetti() {
    const colors = ['#B07EC8', '#F4A435', '#7EB8D4', '#6DB68A', '#E85D75', '#FFD166'];
    const c = document.createElement('div');
    c.className = 'confetti-container';
    document.body.appendChild(c);
    for (let i = 0; i < 60; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.cssText = [
        `left:${Math.random() * 100}%`,
        `background:${colors[Math.floor(Math.random() * colors.length)]}`,
        `animation-delay:${(Math.random() * 0.9).toFixed(2)}s`,
        `animation-duration:${(1.2 + Math.random() * 1.4).toFixed(2)}s`,
        `width:${6 + Math.round(Math.random() * 8)}px`,
        `height:${6 + Math.round(Math.random() * 8)}px`,
        `border-radius:${Math.random() > 0.5 ? '50%' : '3px'}`,
        `transform:rotate(${Math.round(Math.random() * 360)}deg)`,
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
        <button class="btn btn-back" id="back-to-village" title="Zurück">←</button>
        <div class="workshop-title-block">
          <span class="workshop-icon">🗝️</span>
          <h1>Rätselhöhle</h1>
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
    document.querySelectorAll('.session-mode-btn').forEach((btn) => {
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
      <div class="screen workshop-screen grade${Storage.getGrade() === 2 ? 2 : 1}">
        ${renderHeader()}
        <main class="exercise-menu">
          <p class="menu-intro">Welches Rätsel möchtest du lösen?</p>
          ${renderSessionModeSelector()}
          <div class="exercise-grid">
            ${Object.values(exercises).map(renderExerciseCard).join('')}
          </div>
        </main>
      </div>
    `;
    bindSessionModeEvents();

    document.querySelectorAll('.exercise-card').forEach((card) => {
      card.addEventListener('click', () => {
        resetSession();
        currentExerciseId = card.dataset.exercise;
        renderTask();
      });
    });
    document.getElementById('back-to-village').addEventListener('click', () => App.showVillage());
    setTimeout(() => {
      const menu = document.querySelector('.exercise-menu');
      if (menu) Oskar.show(menu, { placement: 'inline-right', pool: 'puzzles', chance: 0.7 });
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

    if (currentTask.taskType === 'memory') {
      renderMemoryTask();
      return;
    }

    const isChoice = currentTask.taskType === 'choice';

    const inputSection = isChoice
      ? `<div class="choice-grid" id="choice-grid">
          ${currentTask.choices.map((c) => `<button class="choice-btn" data-value="${encodeURIComponent(c)}">${c}</button>`).join('')}
         </div>`
      : `<div class="task-input-row">
           <input type="number" id="task-answer" class="task-input"
             placeholder="" min="0" max="999"
             autocomplete="off" inputmode="numeric" pattern="[0-9]*" />
           <button class="btn btn-primary" id="check-btn">Fertig ✓</button>
         </div>`;

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen task-screen grade${Storage.getGrade() === 2 ? 2 : 1}">
        ${renderHeader()}
        <main class="task-main">
          <div class="task-card">
            <div class="task-category">
              <span>${ex.icon}</span><span>${ex.title}</span>
              <span class="difficulty-indicator">${['⭐', '⭐⭐', '⭐⭐⭐'][currentTask.difficulty - 1] || '⭐'}</span>
            </div>
            <div class="task-progress">
              <div class="task-progress-bar">
                <div class="task-progress-fill" style="width:${((sessionStats.total - 1) / sessionLength) * 100}%"></div>
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
      if (main) Oskar.show(main, { placement: 'task-companion', pool: 'taskIntro', chance: 0.2 });
    }, 50);
  }

  function renderMemoryTask() {
    const ex = exercises[currentExerciseId];
    const wordsHtml = currentTask.memoryWords
      .map((w) => `<div class="memory-word">${w}</div>`)
      .join('');
    const secs = currentTask.memorySeconds;

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen task-screen grade${Storage.getGrade() === 2 ? 2 : 1}">
        ${renderHeader()}
        <main class="task-main">
          <div class="task-card">
            <div class="task-category">
              <span>${ex.icon}</span><span>${ex.title}</span>
              <span class="difficulty-indicator">${['⭐', '⭐⭐', '⭐⭐⭐'][currentTask.difficulty - 1] || '⭐'}</span>
            </div>
            <div class="task-progress">
              <div class="task-progress-bar">
                <div class="task-progress-fill" style="width:${((sessionStats.total - 1) / sessionLength) * 100}%"></div>
              </div>
              <span class="task-progress-label">Aufgabe <strong>${sessionStats.total}</strong> von ${sessionLength}</span>
            </div>
            <div class="task-question">
              <div class="memory-stage">
                <p class="q-label">🧠 Merke dir diese Wörter!</p>
                <div class="memory-words" id="memory-words-display">${wordsHtml}</div>
                <p class="memory-countdown">Noch <span class="memory-countdown-num" id="mem-count">${secs}</span> Sekunden...</p>
              </div>
            </div>
            <div class="task-feedback hidden" id="task-feedback"></div>
            <div class="task-actions">
              <button class="btn btn-ghost" id="hint-btn">💡 Tipp</button>
            </div>
          </div>
        </main>
      </div>
    `;

    document.getElementById('hint-btn').addEventListener('click', () => {
      showFeedback(currentTask.hint, 'hint');
    });
    document.getElementById('back-to-village').addEventListener('click', () => {
      resetSession();
      App.showVillage();
    });

    let remaining = secs;
    const interval = setInterval(() => {
      remaining--;
      const el = document.getElementById('mem-count');
      if (el) el.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(interval);
        showMemoryQuestion();
      }
    }, 1000);
  }

  function showMemoryQuestion() {
    const wordsDisplay = document.getElementById('memory-words-display');
    if (wordsDisplay) wordsDisplay.style.display = 'none';
    const countdown = document.querySelector('.memory-countdown');
    if (countdown) countdown.style.display = 'none';

    const label = document.querySelector('.q-label');
    if (label) label.textContent = '❓ Welches Wort war NICHT dabei?';

    const choiceGrid = document.createElement('div');
    choiceGrid.className = 'choice-grid';
    choiceGrid.id = 'choice-grid';
    choiceGrid.innerHTML = currentTask.choices
      .map((c) => `<button class="choice-btn" data-value="${encodeURIComponent(c)}">${c}</button>`)
      .join('');

    const taskQuestion = document.querySelector('.task-question');
    if (taskQuestion) taskQuestion.after(choiceGrid);

    choiceGrid.querySelectorAll('.choice-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (answered) return;
        evaluateAnswer(decodeURIComponent(btn.dataset.value));
      });
    });
  }

  function bindTaskEvents(isChoice) {
    if (isChoice) {
      document.querySelectorAll('.choice-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (answered) return;
          evaluateAnswer(decodeURIComponent(btn.dataset.value));
        });
      });
    } else {
      const input = document.getElementById('task-answer');
      const checkBtn = document.getElementById('check-btn');
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') checkBtn && checkBtn.click();
        });
      }
      if (checkBtn) {
        checkBtn.addEventListener('click', () => {
          const val = (input ? input.value : '').trim();
          if (!val) return;
          evaluateAnswer(val);
        });
      }
      const nextBtn = document.getElementById('next-btn');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (sessionStats.total >= sessionLength) renderSessionComplete();
          else renderTask();
        });
      }
    }
    document.getElementById('hint-btn').addEventListener('click', () => {
      showFeedback(currentTask.hint, 'hint');
    });
    document.getElementById('back-to-village').addEventListener('click', () => {
      resetSession();
      App.showVillage();
    });
  }

  function evaluateAnswer(value) {
    if (answered) return;
    answered = true;

    const given = String(value).trim();
    const expected = String(currentTask.answer).trim();
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
      if (fill) fill.style.width = `${(sessionStats.total / sessionLength) * 100}%`;

      if (currentTask.taskType === 'choice' || currentTask.taskType === 'memory') {
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

      if (currentTask.taskType === 'choice' || currentTask.taskType === 'memory') {
        showFeedback('Schau dir die grüne Antwort gut an – so merkst du sie dir! 🌟', 'wrong');
        highlightChoices(value, false);
        answered = true;
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
          nextBtn.style.display = '';
          nextBtn.addEventListener('click', () => {
            if (sessionStats.total >= sessionLength) renderSessionComplete();
            else renderTask();
          });
        } else {
          // For memory tasks, inject next button
          const actions = document.querySelector('.task-actions');
          if (actions) {
            const nb = document.createElement('button');
            nb.className = 'btn btn-ghost';
            nb.id = 'next-btn';
            nb.textContent = 'Weiter →';
            actions.appendChild(nb);
            nb.addEventListener('click', () => {
              if (sessionStats.total >= sessionLength) renderSessionComplete();
              else renderTask();
            });
          }
        }
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
    document.querySelectorAll('.choice-btn').forEach((btn) => {
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
    const total = sessionLength;
    const isPerfect = correct === total;

    if (profile) {
      Storage.saveSessionResult(profile.id, currentExerciseId, correct, total);
      if (isPerfect) Storage.addStars(profile.id, 2); // Bonus für eine fehlerfreie Runde
    }

    const praise = randomFrom(PRAISE_MESSAGES);
    const performance = getPerformanceText(correct, total);
    const stars = getSessionStars(correct, total);
    const starStr = stars > 0 ? '⭐'.repeat(stars) : '☆☆☆';
    const bonusHtml = isPerfect
      ? '<p class="complete-performance">🎁 +2 Bonus-Sterne für eine fehlerfreie Runde!</p>'
      : '';

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen complete-screen grade${Storage.getGrade() === 2 ? 2 : 1}">
        ${renderHeader()}
        <main class="complete-main">
          <div class="complete-card">
            <div class="complete-trophy">${stars >= 3 ? '🏆' : stars >= 2 ? '🌟' : '👍'}</div>
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
      if (main) Oskar.show(main, { placement: 'task-companion', pool: 'correct', chance: 1 });
    }, 100);
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  function mount() {
    resetSession();
    renderMenu();
  }

  return { mount };
})();
