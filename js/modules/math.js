/**
 * modules/math.js
 * Rechenwerkstatt — Mathematik-Modul für Klasse 1 & 2.
 *
 * Erweiterung: Weitere Module (deutsch.js, sachkunde.js …) nach gleichem Muster anlegen
 * und in app.js registrieren.
 */

const MathModule = (() => {
  // ---------- Aufgaben-Generatoren ----------

  const exercises = {
    /**
     * Zahlen erkennen: Zeige eine Zahl als Wort, Nutzer tippt die Ziffer.
     */
    numberRecognition: {
      id: 'numberRecognition',
      title: 'Zahlen erkennen',
      icon: '🔢',
      description: 'Erkenne die Zahlen von 1 bis 20',
      generate() {
        const NUMBER_WORDS = [
          '', 'eins', 'zwei', 'drei', 'vier', 'fünf',
          'sechs', 'sieben', 'acht', 'neun', 'zehn',
          'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn',
          'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig',
        ];
        const n = Math.floor(Math.random() * 20) + 1;
        return {
          question: `Wie schreibt man <strong>${NUMBER_WORDS[n]}</strong> als Zahl?`,
          answer: String(n),
          hint: `Die Zahl liegt zwischen 1 und 20.`,
          type: 'input',
        };
      },
    },

    /**
     * Zählen: Zeige Punkte, Nutzer gibt die Anzahl ein.
     */
    counting: {
      id: 'counting',
      title: 'Zählen',
      icon: '🔵',
      description: 'Zähle die Punkte richtig',
      generate() {
        const n = Math.floor(Math.random() * 15) + 1;
        const dots = Array(n).fill('●').join(' ');
        return {
          question: `Wie viele Punkte siehst du?<br><span class="dot-display">${dots}</span>`,
          answer: String(n),
          hint: `Zähle jeden Punkt einzeln.`,
          type: 'input',
        };
      },
    },

    /**
     * Addition bis 20.
     */
    addition: {
      id: 'addition',
      title: 'Plusrechnen',
      icon: '➕',
      description: 'Rechne Plus bis 20',
      generate() {
        const a = Math.floor(Math.random() * 10) + 1;
        const maxB = Math.min(20 - a, 10);
        const b = Math.floor(Math.random() * maxB) + 1;
        return {
          question: `<span class="math-eq">${a} + ${b} = <span class="math-blank">?</span></span>`,
          answer: String(a + b),
          hint: `${a} plus ${b}. Zähle ${b} Schritte weiter von ${a}.`,
          type: 'input',
        };
      },
    },

    /**
     * Subtraktion bis 20.
     */
    subtraction: {
      id: 'subtraction',
      title: 'Minusrechnen',
      icon: '➖',
      description: 'Rechne Minus bis 20',
      generate() {
        const a = Math.floor(Math.random() * 19) + 2;
        const b = Math.floor(Math.random() * (a - 1)) + 1;
        return {
          question: `<span class="math-eq">${a} − ${b} = <span class="math-blank">?</span></span>`,
          answer: String(a - b),
          hint: `${a} minus ${b}. Zähle ${b} Schritte zurück von ${a}.`,
          type: 'input',
        };
      },
    },
  };

  // ---------- Session-State ----------

  let currentExerciseId = null;
  let currentTask = null;
  let sessionStats = { correct: 0, total: 0 };
  let hintShown = false;

  // Feedback-Nachrichten
  const FEEDBACK_CORRECT = [
    'Super gemacht! ⭐', 'Toll gelöst! 🌟', 'Sehr gut! ✨',
    'Weiter so! 🎉', 'Fantastisch! 🦊', 'Klasse! 👏',
    'Du bist großartig! 🌈', 'Prima! 🎈',
  ];
  const FEEDBACK_WRONG = [
    'Fast richtig – versuch es noch einmal! 💪',
    'Nicht ganz – du schaffst das! 🌟',
    'Noch ein Versuch! Du kannst das! ✨',
  ];

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ---------- Rendering ----------

  function render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen workshop-screen">
        ${renderHeader()}
        ${renderExerciseMenu()}
      </div>
    `;
  }

  function renderHeader() {
    const profile = Storage.getActiveProfile();
    return `
      <header class="workshop-header">
        <button class="btn btn-ghost btn-icon back-btn" id="back-to-village" title="Zurück zum Dorfplatz">
          ←
        </button>
        <div class="workshop-title-block">
          <span class="workshop-icon">🔨</span>
          <h1>Rechenwerkstatt</h1>
        </div>
        <div class="star-badge">
          <span>⭐</span>
          <span id="header-stars">${profile ? profile.stars : 0}</span>
        </div>
      </header>
    `;
  }

  function renderExerciseMenu() {
    return `
      <main class="exercise-menu">
        <p class="menu-intro">Was möchtest du üben?</p>
        <div class="exercise-grid">
          ${Object.values(exercises).map(ex => `
            <button class="exercise-card" data-exercise="${ex.id}">
              <span class="ex-icon">${ex.icon}</span>
              <span class="ex-title">${ex.title}</span>
              <span class="ex-desc">${ex.description}</span>
            </button>
          `).join('')}
        </div>
      </main>
    `;
  }

  function renderTask(exerciseId) {
    currentExerciseId = exerciseId;
    const ex = exercises[exerciseId];
    if (!ex) return;

    currentTask = ex.generate();
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
            </div>

            <div class="task-question" id="task-question">
              ${currentTask.question}
            </div>

            <div class="task-input-row">
              <input
                type="number"
                id="task-answer"
                class="task-input"
                placeholder="?"
                min="0"
                max="99"
                autocomplete="off"
                inputmode="numeric"
              />
              <button class="btn btn-primary" id="check-btn">
                Prüfen ✓
              </button>
            </div>

            <div class="task-feedback hidden" id="task-feedback"></div>

            <div class="task-actions">
              <button class="btn btn-ghost" id="hint-btn">💡 Tipp</button>
              <button class="btn btn-ghost" id="next-btn">Nächste Aufgabe →</button>
            </div>
          </div>

          <div class="session-stats">
            <span>Richtig: <strong id="stat-correct">${sessionStats.correct}</strong></span>
            <span>Aufgaben: <strong id="stat-total">${sessionStats.total}</strong></span>
          </div>
        </main>
      </div>
    `;

    bindTaskEvents();
  }

  function bindTaskEvents() {
    const answerInput = document.getElementById('task-answer');
    const checkBtn = document.getElementById('check-btn');
    const hintBtn = document.getElementById('hint-btn');
    const nextBtn = document.getElementById('next-btn');

    answerInput.focus();

    answerInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') checkBtn.click();
    });

    checkBtn.addEventListener('click', () => {
      const value = answerInput.value.trim();
      if (value === '') return;
      evaluateAnswer(value);
    });

    hintBtn.addEventListener('click', () => {
      if (!hintShown) {
        showFeedback(currentTask.hint, 'hint');
        hintShown = true;
      }
    });

    nextBtn.addEventListener('click', () => {
      sessionStats.total++;
      renderTask(currentExerciseId);
    });

    document.getElementById('back-to-village').addEventListener('click', () => {
      sessionStats = { correct: 0, total: 0 };
      App.showVillage();
    });
  }

  function evaluateAnswer(value) {
    const correct = value === currentTask.answer;
    const profile = Storage.getActiveProfile();

    if (correct) {
      sessionStats.correct++;
      sessionStats.total++;
      if (profile) {
        Storage.addStars(profile.id, 1);
        const updated = Storage.getActiveProfile();
        const headerStars = document.getElementById('header-stars');
        if (headerStars) headerStars.textContent = updated.stars;
      }
      showFeedback(randomFrom(FEEDBACK_CORRECT), 'correct');

      const checkBtn = document.getElementById('check-btn');
      const answerInput = document.getElementById('task-answer');
      if (checkBtn) checkBtn.disabled = true;
      if (answerInput) answerInput.disabled = true;

      // Auto-advance nach 1.8 s
      setTimeout(() => {
        sessionStats.total++;
        renderTask(currentExerciseId);
      }, 1800);
    } else {
      showFeedback(randomFrom(FEEDBACK_WRONG), 'wrong');
      const answerInput = document.getElementById('task-answer');
      if (answerInput) {
        answerInput.value = '';
        answerInput.classList.add('shake');
        setTimeout(() => answerInput.classList.remove('shake'), 400);
        answerInput.focus();
      }
    }

    // Update session stats display
    const statCorrect = document.getElementById('stat-correct');
    const statTotal = document.getElementById('stat-total');
    if (statCorrect) statCorrect.textContent = sessionStats.correct;
    if (statTotal) statTotal.textContent = sessionStats.total;
  }

  function showFeedback(message, type) {
    const fb = document.getElementById('task-feedback');
    if (!fb) return;
    fb.textContent = '';
    fb.innerHTML = message;
    fb.className = `task-feedback feedback-${type}`;
    fb.classList.remove('hidden');
  }

  // ---------- Public API ----------

  function mount() {
    render();
    // Bind menu clicks after render
    document.querySelectorAll('.exercise-card').forEach(card => {
      card.addEventListener('click', () => {
        sessionStats = { correct: 0, total: 0 };
        renderTask(card.dataset.exercise);
      });
    });
    document.getElementById('back-to-village').addEventListener('click', () => {
      App.showVillage();
    });
  }

  return { mount };
})();
