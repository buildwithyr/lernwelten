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

  function makeDotGrid(n) {
    const COLS = 5;
    const dots = [];
    for (let i = 0; i < n; i++) {
      if (i > 0 && i % COLS === 0) dots.push('<br>');
      dots.push('<span class="dot">●</span>');
    }
    return `<div class="dot-grid">${dots.join('')}</div>`;
  }

  const DIFFICULTY_RANGE = {
    1: { min: 1, max: 10 },
    2: { min: 1, max: 15 },
    3: { min: 1, max: 20 },
  };

  const exercises = {

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

  // ─── Aufgabe erzeugen (mit Anti-Wiederholung) ─────────────────────────────

  function generateTask(exerciseId) {
    const profile = Storage.getActiveProfile();
    const difficulty = profile
      ? Adaptive.getDifficulty(profile.id, exerciseId)
      : 1;

    const ex = exercises[exerciseId];
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

  const SESSION_LENGTH = 10;

  let currentExerciseId = null;
  let currentTask = null;
  let hintShown = false;
  let sessionStats = { correct: 0, total: 0 };

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

  function renderExerciseCard(ex) {
    const profile = Storage.getActiveProfile();
    const stats = profile ? Storage.getSessionStats(profile.id, ex.id) : null;

    let progressHtml;
    if (stats) {
      const stars = getSessionStars(stats.bestScore, SESSION_LENGTH);
      const starStr = stars > 0 ? '⭐'.repeat(stars) : '–';
      progressHtml = `<span class="ex-progress">${starStr} Beste: ${stats.bestScore}/${SESSION_LENGTH}</span>`;
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
      <div class="screen workshop-screen">
        ${renderHeader()}
        <main class="exercise-menu">
          <p class="menu-intro">Was möchtest du heute üben?</p>
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
    const ex = exercises[currentExerciseId];
    if (!ex) return;

    sessionStats.total++;
    currentTask = generateTask(currentExerciseId);
    hintShown = false;

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen task-screen">
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
                <div class="task-progress-fill" style="width:${((sessionStats.total - 1) / SESSION_LENGTH) * 100}%"></div>
              </div>
              <span class="task-progress-label">Aufgabe <strong>${sessionStats.total}</strong> von ${SESSION_LENGTH}</span>
            </div>

            <div class="task-question">
              ${currentTask.questionHtml}
            </div>

            <div class="task-input-row">
              <input
                type="number"
                id="task-answer"
                class="task-input"
                placeholder=""
                min="0"
                max="99"
                autocomplete="off"
                inputmode="numeric"
                pattern="[0-9]*"
              />
              <button class="btn btn-primary" id="check-btn">
                Prüfen ✓
              </button>
            </div>

            <div class="task-feedback hidden" id="task-feedback"></div>

            <div class="task-actions">
              <button class="btn btn-ghost" id="hint-btn">💡 Tipp</button>
              <button class="btn btn-ghost" id="next-btn">Nächste →</button>
            </div>
          </div>
        </main>
      </div>
    `;

    bindTaskEvents();

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
    const total   = SESSION_LENGTH;

    if (profile) {
      Storage.saveSessionResult(profile.id, currentExerciseId, correct, total);
    }

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
            <div class="complete-trophy">${stars >= 3 ? '🏆' : stars >= 2 ? '🌟' : '👍'}</div>
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

  function bindTaskEvents() {
    const answerInput = document.getElementById('task-answer');
    const checkBtn   = document.getElementById('check-btn');

    answerInput.focus();

    answerInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') checkBtn.click();
    });

    checkBtn.addEventListener('click', () => {
      const value = answerInput.value.trim();
      if (value === '') return;
      evaluateAnswer(value);
    });

    document.getElementById('hint-btn').addEventListener('click', () => {
      if (!hintShown) {
        showFeedback(currentTask.hint, 'hint');
        hintShown = true;
      }
    });

    document.getElementById('next-btn').addEventListener('click', () => {
      if (sessionStats.total >= SESSION_LENGTH) {
        renderSessionComplete();
      } else {
        renderTask();
      }
    });

    document.getElementById('back-to-village').addEventListener('click', () => {
      sessionStats = { correct: 0, total: 0 };
      App.showVillage();
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

      document.getElementById('check-btn').disabled = true;
      document.getElementById('task-answer').disabled = true;

      // Update progress bar to full for this task
      const fill = document.querySelector('.task-progress-fill');
      if (fill) fill.style.width = `${(sessionStats.total / SESSION_LENGTH) * 100}%`;

      if (sessionStats.total >= SESSION_LENGTH) {
        setTimeout(() => renderSessionComplete(), 1900);
      } else {
        setTimeout(() => renderTask(), 1900);
      }
    } else {
      Oskar.silence();
      showFeedback(randomFrom(FEEDBACK_WRONG), 'wrong');
      const input = document.getElementById('task-answer');
      input.value = '';
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 400);
      input.focus();
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

  function mount() {
    sessionStats = { correct: 0, total: 0 };
    renderMenu();
  }

  return { mount };
})();
