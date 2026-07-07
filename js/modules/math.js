/**
 * modules/math.js
 * Rechenwerkstatt — Mathematik für Klasse 1 & 2.
 */

const MathModule = (() => {

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

  // ─── Anti-Wiederholungs-Warteschlange ─────────────────────────────────────

  const RECENT_WINDOW = 5;
  const recentAnswers = {};

  function wasRecentlyAsked(exerciseId, answer) {
    return (recentAnswers[exerciseId] || []).includes(answer);
  }

  function markAsked(exerciseId, answer) {
    if (!recentAnswers[exerciseId]) recentAnswers[exerciseId] = [];
    const recent = recentAnswers[exerciseId];
    recent.push(answer);
    if (recent.length > RECENT_WINDOW) recent.shift();
  }

  // ─── Aufgaben-Generatoren ─────────────────────────────────────────────────

  const NUMBER_WORDS = [
    '', 'eins', 'zwei', 'drei', 'vier', 'fünf',
    'sechs', 'sieben', 'acht', 'neun', 'zehn',
    'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn',
    'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig',
  ];

  let numberDeck = [];
  function nextFromDeck(max) {
    const pool = Array.from({ length: max }, (_, i) => i + 1);
    if (numberDeck.length === 0 || numberDeck.some(n => n > max)) {
      numberDeck = shuffle(pool);
    }
    return numberDeck.pop();
  }

  // Punkte in festen 5er-Reihen (Kraft der Fünf) — das CSS-Grid sorgt
  // dafür, dass Kinder die Menge reihenweise abzählen können.
  function makeDotGrid(n) {
    const dots = [];
    for (let i = 0; i < n; i++) {
      dots.push('<span class="dot">●</span>');
    }
    return `<div class="dot-grid">${dots.join('')}</div>`;
  }

  const DIFFICULTY_RANGE = {
    1: { min: 1, max: 10 },
    2: { min: 1, max: 15 },
    3: { min: 1, max: 20 },
  };

  // ─── Klasse 2: Zahlenraum bis 100 ─────────────────────────────────────────
  // Ab 20 nur "runde" Aufgaben: glatte Zehner (30+40) oder Fünferschritte
  // (25+15, 45+5) — deshalb sind alle Operanden Vielfache von 5.

  const DIFFICULTY_RANGE_G2 = {
    1: { max: 50 },
    2: { max: 75 },
    3: { max: 100 },
  };

  function randomMultipleOf5(min, max) {
    const lo = Math.ceil(min / 5);
    const hi = Math.floor(max / 5);
    return randomInt(lo, hi) * 5;
  }

  const exercisesGrade2 = {

    additionRound100: {
      id: 'additionRound100',
      title: 'Plus bis 100',
      icon: '➕',
      description: 'Runde Zehner und Fünferschritte',
      generate(difficulty) {
        const { max } = DIFFICULTY_RANGE_G2[difficulty] || DIFFICULTY_RANGE_G2[1];
        const a = randomMultipleOf5(5, max - 5);
        const b = randomMultipleOf5(5, max - a);
        return {
          questionHtml: `
            <p class="q-label">Was ist das Ergebnis?</p>
            <p class="math-eq">${a} + ${b} = <span class="math-blank">?</span></p>
          `,
          answer: String(a + b),
          hint: `Zähle in Fünferschritten von ${a} aus weiter.`,
        };
      },
    },

    subtractionRound100: {
      id: 'subtractionRound100',
      title: 'Minus bis 100',
      icon: '➖',
      description: 'Runde Zehner und Fünferschritte',
      generate(difficulty) {
        const { max } = DIFFICULTY_RANGE_G2[difficulty] || DIFFICULTY_RANGE_G2[1];
        const a = randomMultipleOf5(20, max);
        const b = randomMultipleOf5(5, a - 5);
        return {
          questionHtml: `
            <p class="q-label">Was ist das Ergebnis?</p>
            <p class="math-eq">${a} − ${b} = <span class="math-blank">?</span></p>
          `,
          answer: String(a - b),
          hint: `Zähle in Fünferschritten von ${a} zurück.`,
        };
      },
    },

    doubleHalf: {
      id: 'doubleHalf',
      title: 'Verdoppeln & Halbieren',
      icon: '✖️',
      description: 'Verdopple oder halbiere die Zahl',
      generate(difficulty) {
        const max = difficulty === 1 ? 20 : difficulty === 2 ? 35 : 50;
        const isDouble = Math.random() < 0.5;
        if (isDouble) {
          const n = randomInt(1, max);
          return {
            questionHtml: `
              <p class="q-label">Verdopple die Zahl:</p>
              <p class="math-eq">${n} + ${n} = <span class="math-blank">?</span></p>
            `,
            answer: String(n * 2),
            hint: `Verdoppeln heißt: ${n} + ${n} rechnen.`,
          };
        }
        const n = randomInt(1, max) * 2;
        return {
          questionHtml: `
            <p class="q-label">Halbiere die Zahl:</p>
            <p class="math-eq">Die Hälfte von ${n} = <span class="math-blank">?</span></p>
          `,
          answer: String(n / 2),
          hint: `Halbieren heißt: ${n} durch 2 teilen.`,
        };
      },
    },

    numberSeries: {
      id: 'numberSeries',
      title: 'Zahlenreihen',
      icon: '🔢',
      description: '2er-, 5er- und 10er-Reihen',
      generate(difficulty) {
        const step = difficulty === 1 ? 10 : difficulty === 2 ? 5 : 2;
        const maxStart = 100 - step * 4;
        const start = randomMultipleOf5(0, Math.max(0, maxStart)) || 0;
        const seq = [start, start + step, start + step * 2, start + step * 3];
        const answer = start + step * 4;
        const seqHtml = seq.map(n =>
          `<div class="seq-num">${n}</div><div class="seq-sep">,</div>`
        ).join('') + `<div class="seq-num seq-num--blank">?</div>`;
        return {
          questionHtml: `
            <p class="q-label">Was kommt danach?</p>
            <div class="number-sequence">${seqHtml}</div>
          `,
          answer: String(answer),
          hint: `Das ist die ${step}er-Reihe: Es geht immer +${step} weiter.`,
        };
      },
    },

    euroCent: {
      id: 'euroCent',
      title: 'Euro & Cent',
      icon: '💶',
      description: 'Wie viel kostet das zusammen?',
      generate(difficulty) {
        const useCent = Math.random() < 0.5;
        if (useCent) {
          const values = difficulty === 1 ? [10, 20] : [10, 20, 50];
          const a = randomFrom(values);
          const b = randomFrom(values);
          return {
            questionHtml: `
              <p class="q-label">Wie viel kostet das zusammen?</p>
              <p class="math-eq">🏷️ ${a} Cent + 🏷️ ${b} Cent = <span class="math-blank">?</span> Cent</p>
            `,
            answer: String(a + b),
            hint: `Rechne ${a} + ${b} in Cent.`,
          };
        }
        const values = difficulty === 1 ? [1, 2] : difficulty === 2 ? [1, 2, 5] : [1, 2, 5, 10];
        const a = randomFrom(values);
        const b = randomFrom(values);
        return {
          questionHtml: `
            <p class="q-label">Wie viel kostet das zusammen?</p>
            <p class="math-eq">🏷️ ${a} € + 🏷️ ${b} € = <span class="math-blank">?</span> €</p>
          `,
          answer: String(a + b),
          hint: `Rechne ${a} + ${b} in Euro.`,
        };
      },
    },

    clockReading: {
      id: 'clockReading',
      title: 'Uhr lesen',
      icon: '🕐',
      description: 'Volle und halbe Stunden',
      generate(difficulty) {
        const HOURS = [12,1,2,3,4,5,6,7,8,9,10,11];
        const isHalf = difficulty === 1 ? false : Math.random() < 0.5;
        const idx = randomInt(0, 11);
        const hour = HOURS[idx];
        const minute = isHalf ? 30 : 0;
        const answer = `${hour}:${isHalf ? '30' : '00'} Uhr`;
        const clockHtml = Clock.render(hour, minute, { size: 150 });

        const otherIdx = (idx + randomInt(1, 5)) % 12;
        const wrong1 = `${HOURS[otherIdx]}:${isHalf ? '30' : '00'} Uhr`;
        const wrong2 = `${hour}:${isHalf ? '00' : '30'} Uhr`;
        const choices = shuffle([answer, wrong1, wrong2]);

        return {
          questionHtml: `
            <p class="q-label">Wie spät ist es?</p>
            ${clockHtml}
          `,
          answer,
          hint: isHalf
            ? 'Der kleine Zeiger steht zwischen zwei Zahlen — das ist eine halbe Stunde.'
            : 'Der große Zeiger steht auf der 12 — das ist eine volle Stunde.',
          taskType: 'choice',
          choices,
        };
      },
    },

    wordProblems: {
      id: 'wordProblems',
      title: 'Textaufgaben',
      icon: '📝',
      description: 'Kurze Aufgaben mit runden Zahlen',
      generate(difficulty) {
        const max = difficulty === 1 ? 30 : difficulty === 2 ? 60 : 100;
        const templates = [
          () => {
            const a = randomMultipleOf5(5, max - 5);
            const b = randomMultipleOf5(5, max - a);
            return { text: `Luisa hat ${a} Sticker. Sie bekommt ${b} weitere dazu. Wie viele Sticker hat sie jetzt?`, ans: a + b };
          },
          () => {
            const a = randomMultipleOf5(10, max);
            const b = randomMultipleOf5(5, a - 5);
            return { text: `Im Stall stehen ${a} Pferde. ${b} Pferde gehen auf die Weide. Wie viele Pferde bleiben im Stall?`, ans: a - b };
          },
          () => {
            const a = randomMultipleOf5(5, max - 5);
            const b = randomMultipleOf5(5, max - a);
            return { text: `Am Nachthimmel sind ${a} Sterne zu sehen. ${b} weitere Sterne erscheinen. Wie viele Sterne sind es jetzt?`, ans: a + b };
          },
          () => {
            const a = randomMultipleOf5(10, max);
            const b = randomMultipleOf5(5, a - 5);
            return { text: `Eine Rakete transportiert ${a} Astronauten. ${b} Astronauten steigen auf einer Raumstation aus. Wie viele bleiben an Bord?`, ans: a - b };
          },
        ];
        const { text, ans } = randomFrom(templates)();
        return {
          questionHtml: `<p class="q-label word-problem-text">${text}</p>`,
          answer: String(ans),
          hint: 'Lies die Aufgabe noch einmal genau: Wird zusammengezählt oder weggenommen?',
        };
      },
    },

  };

  const exercisesGrade1 = {

    numberRecognition: {
      id: 'numberRecognition',
      title: 'Zahlen erkennen',
      icon: '🔢',
      description: 'Zahlen von 1 bis 20',
      generate(difficulty) {
        const { max } = DIFFICULTY_RANGE[difficulty] || DIFFICULTY_RANGE[1];
        const n = nextFromDeck(max);
        return {
          questionHtml: `
            <p class="q-label">Welche Zahl ist das?</p>
            <p class="q-word">${NUMBER_WORDS[n]}</p>
          `,
          answer: String(n),
          hint: `Die Zahl liegt zwischen 1 und ${max}.`,
        };
      },
    },

    counting: {
      id: 'counting',
      title: 'Zählen',
      icon: '🔵',
      description: 'Mengen richtig zählen',
      generate(difficulty) {
        const { max } = DIFFICULTY_RANGE[difficulty] || DIFFICULTY_RANGE[1];
        const n = randomInt(1, max);
        return {
          questionHtml: `
            <p class="q-label">Wie viele Punkte siehst du?</p>
            ${makeDotGrid(n)}
          `,
          answer: String(n),
          hint: 'Zähle jeden Punkt einzeln – Reihe für Reihe.',
        };
      },
    },

    addition: {
      id: 'addition',
      title: 'Plusrechnen',
      icon: '➕',
      description: 'Plus bis 20',
      generate(difficulty) {
        const { max } = DIFFICULTY_RANGE[difficulty] || DIFFICULTY_RANGE[1];
        const a = randomInt(1, Math.floor(max * 0.7));
        const b = randomInt(1, Math.min(max - a, Math.floor(max * 0.5)));
        return {
          questionHtml: `
            <p class="q-label">Was ist das Ergebnis?</p>
            <p class="math-eq">${a} + ${b} = <span class="math-blank">?</span></p>
          `,
          answer: String(a + b),
          hint: `Zähle ${b} Schritte weiter von ${a} an.`,
        };
      },
    },

    subtraction: {
      id: 'subtraction',
      title: 'Minusrechnen',
      icon: '➖',
      description: 'Minus bis 20',
      generate(difficulty) {
        const { max } = DIFFICULTY_RANGE[difficulty] || DIFFICULTY_RANGE[1];
        const a = randomInt(2, max);
        const b = randomInt(1, a - 1);
        return {
          questionHtml: `
            <p class="q-label">Was ist das Ergebnis?</p>
            <p class="math-eq">${a} − ${b} = <span class="math-blank">?</span></p>
          `,
          answer: String(a - b),
          hint: `Zähle ${b} Schritte zurück von ${a} an.`,
        };
      },
    },

  };

  let activeGrade = 1;
  function getExercises() {
    return activeGrade === 2 ? exercisesGrade2 : exercisesGrade1;
  }

  // ─── Aufgabe erzeugen (mit Anti-Wiederholung) ─────────────────────────────

  function generateTask(exerciseId) {
    const profile = Storage.getActiveProfile();
    const difficulty = profile
      ? Adaptive.getDifficulty(profile.id, exerciseId)
      : 1;

    const ex = getExercises()[exerciseId];
    let task;
    let attempts = 0;

    do {
      task = ex.generate(difficulty);
      attempts++;
    } while (wasRecentlyAsked(exerciseId, task.answer) && attempts < 12);

    markAsked(exerciseId, task.answer);
    return { ...task, difficulty };
  }

  // ─── Session-Konstanten & State ───────────────────────────────────────────

  const DEFAULT_SESSION_LENGTH = 10;
  const MAX_WRONG_ATTEMPTS = 3; // danach wird die Lösung gezeigt
  let sessionLength = DEFAULT_SESSION_LENGTH;

  let currentExerciseId = null;
  let currentTask = null;
  let hintShown = false;
  let sessionStats = { correct: 0, total: 0 };
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
    if (retryQueue.length &&
        (retryQueue[0]._notBefore <= sessionStats.total ||
         sessionStats.total >= sessionLength)) {
      return retryQueue.shift();
    }
    return generateTask(currentExerciseId);
  }

  const FEEDBACK_WRONG = [
    'Fast richtig – versuch es noch einmal! 💪',
    'Nicht ganz – du schaffst das! 🌟',
    'Noch ein Versuch! Du kannst das! ✨',
    'Probier es nochmal! 🎯',
  ];

  const PRAISE_MESSAGES = [
    'Super gemacht! 🎉',
    'Klasse! 🌟',
    'Oskar ist stolz auf dich! 🐶',
    'Toll gerechnet! 💫',
    'Du bist ein Mathe-Star! ⭐',
    'Fantastische Leistung! 🏆',
    'Wunderbar! 🎈',
    'Großartig gerechnet! ✨',
  ];

  // ─── Hilfsfunktionen für Session-Abschluss ────────────────────────────────

  function getSessionStars(correct, total) {
    const rate = correct / total;
    if (rate >= 0.9) return 3;
    if (rate >= 0.7) return 2;
    if (rate >= 0.5) return 1;
    return 0;
  }

  function getPerformanceText(correct, total) {
    const rate = correct / total;
    if (rate === 1)   return 'Perfekte Leistung! 🏆';
    if (rate >= 0.9)  return 'Sehr starke Leistung! 🌟';
    if (rate >= 0.7)  return 'Gut gemacht! 👍';
    if (rate >= 0.5)  return 'Weiter üben! 💪';
    return 'Nicht aufgeben! Du wirst besser! 🌈';
  }

  function launchConfetti() {
    const colors = ['#F4A435', '#6DB68A', '#7EB8D4', '#B07EC8', '#E85D75', '#FFD166', '#FF9A3C'];
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    for (let i = 0; i < 70; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.cssText = [
        `left:${Math.random() * 100}%`,
        `background:${colors[Math.floor(Math.random() * colors.length)]}`,
        `animation-delay:${(Math.random() * 0.9).toFixed(2)}s`,
        `animation-duration:${(1.2 + Math.random() * 1.4).toFixed(2)}s`,
        `width:${6 + Math.round(Math.random() * 8)}px`,
        `height:${6 + Math.round(Math.random() * 8)}px`,
        `border-radius:${Math.random() > 0.5 ? '50%' : '3px'}`,
        `transform:rotate(${Math.round(Math.random() * 360)}deg)`,
      ].join(';');
      container.appendChild(piece);
    }

    setTimeout(() => container.remove(), 3500);
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  function renderHeader() {
    const profile = Storage.getActiveProfile();
    return `
      <header class="workshop-header">
        <button class="btn btn-back" id="back-to-village" title="Zurück zum Dorfplatz">
          ←
        </button>
        <div class="workshop-title-block">
          <span class="workshop-icon">🔨</span>
          <h1>Rechenwerkstatt</h1>
        </div>
        <div class="star-badge">
          ⭐ <span id="header-stars">${profile ? profile.stars : 0}</span>
        </div>
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
    document.querySelectorAll('.session-mode-btn').forEach(btn => {
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

    // "Uhr lesen" bekommt eine kleine Vorschau-Uhr statt des Emoji-Icons
    const iconHtml = ex.id === 'clockReading'
      ? Clock.render(10, 10, { size: 40, showNumbers: false, borderWidth: 3 })
      : `<span class="ex-icon">${ex.icon}</span>`;

    return `
      <button class="exercise-card" data-exercise="${ex.id}">
        ${iconHtml}
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
          <p class="menu-intro">Such dir ein Spiel aus.</p>
          ${renderSessionModeSelector()}
          <div class="exercise-grid">
            ${Object.values(getExercises()).map(renderExerciseCard).join('')}
          </div>
        </main>
      </div>
    `;

    bindSessionModeEvents();

    document.querySelectorAll('.exercise-card').forEach(card => {
      card.addEventListener('click', () => {
        resetSession();
        currentExerciseId = card.dataset.exercise;
        renderTask();
      });
    });
    document.getElementById('back-to-village').addEventListener('click', () => {
      App.showVillage();
    });

    setTimeout(() => {
      const menu = document.querySelector('.exercise-menu');
      if (menu) {
        Oskar.show(menu, {
          placement: 'inline-right',
          pool:      'workshop',
          chance:    0.7,
        });
      }
    }, 50);
  }

  function renderTask() {
    const ex = getExercises()[currentExerciseId];
    if (!ex) return;

    sessionStats.total++;
    currentTask = nextTask();
    hintShown = false;
    wrongAttempts = 0;

    const isChoice = currentTask.taskType === 'choice';
    const inputSection = isChoice
      ? `<div class="choice-grid" id="choice-grid">
          ${currentTask.choices.map(c => `<button class="choice-btn" data-value="${encodeURIComponent(c)}">${c}</button>`).join('')}
         </div>`
      : `<div class="task-input-row">
          <input
            type="number"
            id="task-answer"
            class="task-input"
            placeholder=""
            min="0"
            max="100"
            autocomplete="off"
            inputmode="numeric"
            pattern="[0-9]*"
          />
          <button class="btn btn-primary" id="check-btn">
            Fertig ✓
          </button>
        </div>`;

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen task-screen grade${Storage.getGrade() === 2 ? 2 : 1}">
        ${renderHeader()}
        <main class="task-main">
          <div class="task-card">
            <div class="task-category">
              <span>${ex.icon}</span>
              <span>${ex.title}</span>
              <span class="difficulty-indicator">${renderDifficulty(currentTask.difficulty)}</span>
            </div>

            <div class="task-progress">
              <div class="task-progress-bar">
                <div class="task-progress-fill" style="width:${((sessionStats.total - 1) / sessionLength) * 100}%"></div>
              </div>
              <span class="task-progress-label">Aufgabe <strong>${sessionStats.total}</strong> von ${sessionLength}</span>
            </div>

            <div class="task-question">
              ${currentTask.questionHtml}
            </div>

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
      if (main) {
        Oskar.show(main, {
          placement: 'task-companion',
          pool:      'taskIntro',
          chance:    0.3,
        });
      }
    }, 50);
  }

  function renderSessionComplete() {
    launchConfetti();

    const profile = Storage.getActiveProfile();
    const correct = sessionStats.correct;
    const total   = sessionLength;
    const isPerfect = correct === total;

    if (profile) {
      Storage.saveSessionResult(profile.id, currentExerciseId, correct, total);
      if (isPerfect) Storage.addStars(profile.id, 2); // Bonus für eine fehlerfreie Runde
    }

    const praise      = randomFrom(PRAISE_MESSAGES);
    const performance = getPerformanceText(correct, total);
    const stars       = getSessionStars(correct, total);
    const starStr     = stars > 0 ? '⭐'.repeat(stars) : '☆☆☆';
    const bonusHtml   = isPerfect
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
    document.getElementById('back-to-menu-btn').addEventListener('click', () => {
      App.showVillage();
    });
    document.getElementById('back-to-village').addEventListener('click', () => {
      App.showVillage();
    });

    setTimeout(() => {
      const main = document.querySelector('.complete-main');
      if (main) {
        Oskar.show(main, {
          placement: 'task-companion',
          pool:      'correct',
          chance:    1,
        });
      }
    }, 100);
  }

  function renderDifficulty(level) {
    return ['⭐', '⭐⭐', '⭐⭐⭐'][level - 1] || '⭐';
  }

  function bindTaskEvents(isChoice) {
    if (isChoice) {
      document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          evaluateAnswer(decodeURIComponent(btn.dataset.value));
        });
      });
    } else {
      const answerInput = document.getElementById('task-answer');
      const checkBtn   = document.getElementById('check-btn');

      answerInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') checkBtn.click();
      });

      checkBtn.addEventListener('click', () => {
        const value = answerInput.value.trim();
        if (value === '') return;
        evaluateAnswer(value);
      });
    }

    document.getElementById('hint-btn').addEventListener('click', () => {
      if (!hintShown) {
        showFeedback(currentTask.hint, 'hint');
        hintShown = true;
      }
    });

    document.getElementById('next-btn').addEventListener('click', () => {
      if (sessionStats.total >= sessionLength) {
        renderSessionComplete();
      } else {
        renderTask();
      }
    });

    document.getElementById('back-to-village').addEventListener('click', () => {
      resetSession();
      App.showVillage();
    });
  }

  function highlightChoices(selected, wasCorrect) {
    document.querySelectorAll('.choice-btn').forEach(btn => {
      btn.disabled = true;
      const val = decodeURIComponent(btn.dataset.value);
      if (val === currentTask.answer) btn.classList.add('choice-btn--correct');
      else if (val === selected && !wasCorrect) btn.classList.add('choice-btn--wrong');
    });
  }

  function evaluateAnswer(value) {
    const correct = value === currentTask.answer;
    const profile = Storage.getActiveProfile();

    if (profile) {
      Storage.recordAttempt(profile.id, currentExerciseId, correct);
    }

    if (correct) {
      sessionStats.correct++;
      if (profile) {
        Storage.addStars(profile.id, 1);
        const updated = Storage.getActiveProfile();
        const el = document.getElementById('header-stars');
        if (el) el.textContent = updated.stars;
      }

      Oskar.say(randomFrom(Oskar.MESSAGES.correct));
      hideFeedback();

      if (currentTask.taskType === 'choice') {
        highlightChoices(value, true);
      } else {
        document.getElementById('check-btn').disabled = true;
        document.getElementById('task-answer').disabled = true;
      }

      // Update progress bar to full for this task
      const fill = document.querySelector('.task-progress-fill');
      if (fill) fill.style.width = `${(sessionStats.total / sessionLength) * 100}%`;

      if (sessionStats.total >= sessionLength) {
        setTimeout(() => renderSessionComplete(), 1900);
      } else {
        setTimeout(() => renderTask(), 1900);
      }
    } else if (currentTask.taskType === 'choice') {
      Oskar.silence();
      queueRetry();
      showFeedback('Schau dir die grüne Antwort gut an – so merkst du sie dir! 🌟', 'wrong');
      highlightChoices(value, false);
      const nextBtn = document.getElementById('next-btn');
      if (nextBtn) nextBtn.style.display = '';
    } else {
      Oskar.silence();
      queueRetry();
      wrongAttempts++;
      const input = document.getElementById('task-answer');

      if (wrongAttempts >= MAX_WRONG_ATTEMPTS) {
        // Nach drei Versuchen die Lösung zeigen, damit niemand stecken bleibt
        showFeedback(
          `Die richtige Antwort ist: <strong>${currentTask.answer}</strong><br>Gleich klappt es bestimmt! 💪`,
          'hint'
        );
        input.disabled = true;
        document.getElementById('check-btn').disabled = true;
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) nextBtn.style.display = '';
      } else {
        showFeedback(randomFrom(FEEDBACK_WRONG), 'wrong');
        input.value = '';
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 400);
      }
    }
  }

  function showFeedback(message, type) {
    const fb = document.getElementById('task-feedback');
    if (!fb) return;
    fb.innerHTML = message;
    fb.className = `task-feedback feedback-${type}`;
  }

  function hideFeedback() {
    const fb = document.getElementById('task-feedback');
    if (fb) fb.className = 'task-feedback hidden';
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  function mount(grade) {
    activeGrade = grade === 2 ? 2 : 1;
    resetSession();
    renderMenu();
  }

  return { mount };
})();
