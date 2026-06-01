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
  function wasRecent(id, key) { return (recentKeys[id] || []).includes(String(key)); }
  function markRecent(id, key) {
    if (!recentKeys[id]) recentKeys[id] = [];
    recentKeys[id].push(String(key));
    if (recentKeys[id].length > RECENT_WINDOW) recentKeys[id].shift();
  }

  // ─── Daten: Wortgruppen für Odd-one-out und Memory ───────────────────────

  const WORD_GROUPS = {
    Tiere:       ['Hund','Katze','Pferd','Vogel','Fisch','Wolf','Bär','Fuchs','Hase','Igel','Ente','Huhn','Schaf','Ziege','Löwe','Adler','Frosch','Biene','Rabe','Esel'],
    Fahrzeuge:   ['Auto','Bus','Zug','Flugzeug','Schiff','Fahrrad','Motorrad','Lkw','Traktor','Taxi','Boot','Roller','Hubschrauber','Rakete','Bagger','Tram','Kutsche','U-Boot'],
    Möbel:       ['Tisch','Stuhl','Bett','Schrank','Sofa','Lampe','Regal','Sessel','Kommode','Hocker','Schreibtisch','Kleiderschrank','Spiegel'],
    Farben:      ['Rot','Blau','Grün','Gelb','Schwarz','Weiß','Braun','Orange','Lila','Pink','Grau','Rosa','Türkis'],
    Kleidung:    ['Hemd','Hose','Rock','Kleid','Mantel','Jacke','Schuhe','Socken','Mütze','Schal','Pullover','Stiefel','Gürtel'],
    Lebensmittel:['Brot','Milch','Apfel','Banane','Birne','Käse','Ei','Butter','Kuchen','Kirsche','Tomate','Gurke','Salat','Karotte'],
    Körperteile: ['Kopf','Auge','Ohr','Nase','Mund','Zahn','Arm','Hand','Finger','Bein','Fuß','Knie','Bauch','Rücken','Schulter'],
    Pflanzen:    ['Baum','Rose','Tulpe','Gras','Busch','Pilz','Tanne','Eiche','Birke','Blume','Kaktus','Moos','Farn','Bambus','Palme'],
    Sportarten:  ['Fußball','Schwimmen','Turnen','Radfahren','Laufen','Tennis','Basketball','Handball','Klettern','Tanzen','Skifahren','Reiten'],
    Instrumente: ['Geige','Klavier','Flöte','Gitarre','Trommel','Trompete','Harfe','Cello','Saxofon','Mundharmonika','Akkordeon'],
    Berufe:      ['Arzt','Lehrer','Bäcker','Feuerwehr','Polizist','Köch','Gärtner','Pilot','Sänger','Maler','Mechaniker'],
    Jahreszeiten:['Frühling','Sommer','Herbst','Winter'],
    Wetter:      ['Regen','Sonne','Schnee','Wind','Gewitter','Hagel','Nebel','Frost','Sturm'],
    Zahlen:      ['Eins','Zwei','Drei','Vier','Fünf','Sechs','Sieben','Acht','Neun','Zehn'],
    Formen:      ['Kreis','Quadrat','Dreieck','Rechteck','Stern','Oval','Raute','Herzform'],
  };

  const GROUP_NAMES = Object.keys(WORD_GROUPS);

  // ─── Daten: Formen für Muster-Erkennung ──────────────────────────────────

  const SHAPES = ['○', '□', '△', '♦', '⭐', '❤'];

  function buildShapePatterns() {
    const patterns = [];
    for (let i = 0; i < SHAPES.length; i++) {
      for (let j = 0; j < SHAPES.length; j++) {
        if (i === j) continue;
        const A = SHAPES[i], B = SHAPES[j];
        // AB AB A → B
        patterns.push({ seq:[A,B,A,B,A], answer:B, label:`${A} ${B} ${A} ${B} ?` });
        // AAB AAB A → A
        patterns.push({ seq:[A,A,B,A,A], answer:B, label:`${A} ${A} ${B} ${A} ?` });
        // ABB ABB A → B
        patterns.push({ seq:[A,B,B,A,B], answer:B, label:`${A} ${B} ${B} ${A} ?` });
      }
    }
    // ABC patterns with 3 shapes
    for (let i = 0; i < SHAPES.length; i++) {
      for (let j = 0; j < SHAPES.length; j++) {
        for (let k = 0; k < SHAPES.length; k++) {
          if (i===j || j===k || i===k) continue;
          const A=SHAPES[i], B=SHAPES[j], C=SHAPES[k];
          patterns.push({ seq:[A,B,C,A,B], answer:C, label:`${A} ${B} ${C} ${A} ?` });
        }
      }
    }
    return shuffle(patterns);
  }

  const SHAPE_PATTERNS = buildShapePatterns();

  // ─── Daten: 4×4 Sudoku ───────────────────────────────────────────────────

  const BASE_GRID = [
    [1,2,3,4],
    [3,4,1,2],
    [2,1,4,3],
    [4,3,2,1],
  ];

  function generateSudoku() {
    // Deep copy and apply permutations for variety
    let g = BASE_GRID.map(r => r.slice());

    // Swap rows within bands
    if (Math.random() < 0.5) { [g[0], g[1]] = [g[1].slice(), g[0].slice()]; }
    if (Math.random() < 0.5) { [g[2], g[3]] = [g[3].slice(), g[2].slice()]; }
    // Swap column bands
    if (Math.random() < 0.5) {
      g = g.map(r => [r[2], r[3], r[0], r[1]]);
    }
    // Relabel numbers via random permutation
    const perm = shuffle([1,2,3,4]);
    g = g.map(r => r.map(v => perm[v-1]));

    // Pick one cell to remove (not a corner, prefer middle)
    const positions = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) positions.push([r,c]);
    const [row, col] = randomFrom(positions);
    const answer = g[row][col];
    const puzzle = g.map(r => r.slice());
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
      description: 'Was kommt als Nächstes?',
      generate(difficulty) {
        const rules = difficulty === 1
          ? [
              () => { const s=randomInt(1,8), d=randomInt(1,3); return {seq:[s,s+d,s+2*d,s+3*d], ans:s+4*d, hint:`+${d}`}; },
              () => { const s=randomInt(5,20), d=randomInt(1,3); return {seq:[s,s-d,s-2*d,s-3*d], ans:s-4*d, hint:`-${d}`}; },
            ]
          : difficulty === 2
          ? [
              () => { const s=randomInt(1,5), d=randomInt(2,5); return {seq:[s,s+d,s+2*d,s+3*d], ans:s+4*d, hint:`+${d}`}; },
              () => { const s=randomInt(1,4); return {seq:[s,s*2,s*4,s*8], ans:s*16, hint:'×2'}; },
              () => { const s=randomInt(2,10), d=randomInt(2,4); return {seq:[s,s+d,s+2*d,s+3*d], ans:s+4*d, hint:`+${d}`}; },
            ]
          : [
              () => { const s=randomInt(1,5); return {seq:[s,s*2,s*4,s*8], ans:s*16, hint:'×2'}; },
              () => { const s=randomInt(2,5), d=randomInt(3,7); return {seq:[s,s+d,s+2*d,s+3*d], ans:s+4*d, hint:`+${d}`}; },
              () => { const s=randomInt(3,8), d=randomInt(1,3); return {seq:[s,s+d,s+2*d,s+3*d], ans:s+4*d, hint:`+${d} Muster`}; },
              () => { const s=randomInt(1,3); return {seq:[s,s*3,s*9], ans:s*27, hint:'×3'}; },
            ];

        let attempt = 0;
        let result;
        do {
          const rule = randomFrom(rules);
          result = rule();
          attempt++;
        } while (result.ans <= 0 || result.ans > 200 || wasRecent('numberPattern', result.ans) && attempt < 15);
        markRecent('numberPattern', result.ans);

        const seqHtml = result.seq.map(n =>
          `<div class="seq-num">${n}</div><div class="seq-sep">,</div>`
        ).join('') + `<div class="seq-num seq-num--blank">?</div>`;

        return {
          questionHtml: `
            <p class="q-label">Was kommt als Nächstes?</p>
            <div class="number-sequence">${seqHtml}</div>
          `,
          answer: String(result.ans),
          hint: `Das Muster lautet: ${result.hint}`,
          taskType: 'text',
          inputMaxLength: 4,
        };
      },
    },

    shapePattern: {
      id: 'shapePattern',
      title: 'Muster erkennen',
      icon: '🔷',
      description: 'Welche Form kommt als Nächstes?',
      generate(difficulty) {
        let pat;
        let attempts = 0;
        do {
          pat = randomFrom(SHAPE_PATTERNS);
          attempts++;
        } while (wasRecent('shapePattern', pat.answer + pat.seq[0]) && attempts < 20);
        markRecent('shapePattern', pat.answer + pat.seq[0]);

        const seqHtml = pat.seq.map((s,i) =>
          i < pat.seq.length - 1
            ? `<span class="shape-item">${s}</span>`
            : `<span class="shape-item--blank">?</span>`
        ).join('');

        // Wrong choices: other shapes not in this sequence answer
        const wrongChoices = SHAPES.filter(s => s !== pat.answer).slice(0, 2);
        const choices = shuffle([pat.answer, ...wrongChoices]);

        return {
          questionHtml: `
            <p class="q-label">Welche Form kommt als Nächstes?</p>
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
          const g2 = randomFrom(GROUP_NAMES.filter(g => g !== g1));
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
        // The missing option comes from another group (not shown)
        const otherGroup = randomFrom(GROUP_NAMES.filter(g => g !== group));
        const notShown = randomFrom(WORD_GROUPS[otherGroup]);

        let attempts = 0;
        while (wasRecent('memoryTask', notShown) && attempts < 15) {
          attempts++;
        }
        markRecent('memoryTask', notShown);

        const choices = shuffle([...shuffle(shown).slice(0,2), notShown]);

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
      title: 'Mini-Sudoku',
      icon: '🔲',
      description: 'Welche Zahl fehlt im Sudoku?',
      generate(difficulty) {
        let sudoku;
        let attempts = 0;
        do {
          sudoku = generateSudoku();
          attempts++;
        } while (wasRecent('miniSudoku', sudoku.answer) && attempts < 10);
        markRecent('miniSudoku', sudoku.answer);

        const gridHtml = renderSudokuGrid(sudoku.grid, sudoku.row, sudoku.col);
        const wrongNums = [1,2,3,4].filter(n => n !== sudoku.answer);
        const choices = shuffle([sudoku.answer, ...shuffle(wrongNums).slice(0,2)]);

        return {
          questionHtml: `
            <p class="q-label">Welche Zahl fehlt?</p>
            <p class="q-sub">Jede Zahl 1–4 darf in jeder Zeile, Spalte und Box nur einmal vorkommen.</p>
            <div class="sudoku-wrap">${gridHtml}</div>
          `,
          answer: String(sudoku.answer),
          hint: 'Schau dir die Zeile, Spalte und 2×2-Box des leeren Feldes an.',
          taskType: 'choice',
          choices: choices.map(String),
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
    if (r === 1)  return 'Perfekte Leistung! 🏆';
    if (r >= 0.9) return 'Sehr stark! 🌟';
    if (r >= 0.7) return 'Gut gemacht! 👍';
    if (r >= 0.5) return 'Weiter üben! 💪';
    return 'Nicht aufgeben! 🌈';
  }

  function launchConfetti() {
    const colors = ['#B07EC8','#F4A435','#7EB8D4','#6DB68A','#E85D75','#FFD166'];
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
        <button class="btn btn-back" id="back-to-village" title="Zurück">←</button>
        <div class="workshop-title-block">
          <span class="workshop-icon">🗝️</span>
          <h1>Rätselhöhle</h1>
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
          <p class="menu-intro">Welches Rätsel möchtest du lösen?</p>
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
      if (menu) Oskar.show(menu, { placement:'inline-right', pool:'puzzles', chance:0.7 });
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

    if (currentTask.taskType === 'memory') {
      renderMemoryTask();
      return;
    }

    const isChoice = currentTask.taskType === 'choice';

    const inputSection = isChoice
      ? `<div class="choice-grid" id="choice-grid">
          ${currentTask.choices.map(c => `<button class="choice-btn" data-value="${encodeURIComponent(c)}">${c}</button>`).join('')}
         </div>`
      : `<div class="task-input-row">
           <input type="number" id="task-answer" class="task-input"
             placeholder="" min="0" max="999"
             autocomplete="off" inputmode="numeric" pattern="[0-9]*" />
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
      if (main) Oskar.show(main, { placement:'task-companion', pool:'taskIntro', chance:0.2 });
    }, 50);
  }

  function renderMemoryTask() {
    const ex = exercises[currentExerciseId];
    const wordsHtml = currentTask.memoryWords
      .map(w => `<div class="memory-word">${w}</div>`).join('');
    const secs = currentTask.memorySeconds;

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
      sessionStats = { correct: 0, total: 0 };
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
    choiceGrid.innerHTML = currentTask.choices.map(c =>
      `<button class="choice-btn" data-value="${encodeURIComponent(c)}">${c}</button>`
    ).join('');

    const taskQuestion = document.querySelector('.task-question');
    if (taskQuestion) taskQuestion.after(choiceGrid);

    choiceGrid.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return;
        evaluateAnswer(decodeURIComponent(btn.dataset.value));
      });
    });
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
        input.addEventListener('keydown', e => { if (e.key === 'Enter') checkBtn && checkBtn.click(); });
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
          if (sessionStats.total >= SESSION_LENGTH) renderSessionComplete();
          else renderTask();
        });
      }
    }
    document.getElementById('hint-btn').addEventListener('click', () => {
      showFeedback(currentTask.hint, 'hint');
    });
    document.getElementById('back-to-village').addEventListener('click', () => {
      sessionStats = { correct: 0, total: 0 };
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
      if (fill) fill.style.width = `${(sessionStats.total/SESSION_LENGTH)*100}%`;

      if (currentTask.taskType === 'choice' || currentTask.taskType === 'memory') {
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

      if (currentTask.taskType === 'choice' || currentTask.taskType === 'memory') {
        highlightChoices(value, false);
        answered = true;
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
          nextBtn.style.display = '';
          nextBtn.addEventListener('click', () => {
            if (sessionStats.total >= SESSION_LENGTH) renderSessionComplete();
            else renderTask();
          });
        } else {
          // For memory tasks, inject next button
          const actions = document.querySelector('.task-actions');
          if (actions) {
            const nb = document.createElement('button');
            nb.className = 'btn btn-ghost';
            nb.id = 'next-btn';
            nb.textContent = 'Nächste →';
            actions.appendChild(nb);
            nb.addEventListener('click', () => {
              if (sessionStats.total >= SESSION_LENGTH) renderSessionComplete();
              else renderTask();
            });
          }
        }
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
