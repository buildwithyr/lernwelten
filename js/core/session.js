/**
 * core/session.js
 * Gemeinsame Sitzungssteuerung für alle Lernbereiche.
 *
 * Ersetzt die vier fast gleichen Rundenschleifen der Module.
 * Hier — und nur hier — steht:
 *   • wie lang eine Runde ist,
 *   • wie viele Fehlversuche erlaubt sind (MAX_WRONG_ATTEMPTS),
 *   • wann eine Aufgabe als "allein geschafft", "mit Hilfe geschafft" oder
 *     "noch üben" gewertet wird,
 *   • wie Hinweise schrittweise erscheinen,
 *   • wann Wiederholungen entstehen,
 *   • wie eine Runde abgeschlossen und genau einmal gewertet wird.
 *
 * Betriebsarten (Bericht, Abschnitt 6):
 *   'practice' Üben — Tipps, Korrekturen, Wiederholungen erlaubt
 *   'free'     Frei spielen — wie Üben, Themenwahl durch das Kind
 *   'daily'    "Heute üben" — gemischte Themen
 *   'check'    Kurz-Check — ein Versuch, keine Hilfen während der Runde,
 *              keine Stufenänderung, Auswertung erst am Ende
 */

const Session = (() => {

  const MAX_WRONG_ATTEMPTS = 3;
  const ADVANCE_DELAY_OK = 1400;
  const OUT = Progress.OUTCOME;

  let state = null;

  const PRAISE = [
    'Super gemacht!', 'Klasse!', 'Sehr gut!', 'Toll gelöst!',
    'Weiter so!', 'Das war stark!', 'Prima!', 'Ausgezeichnet!',
  ];
  const ENCOURAGE = [
    'Fast! Schau noch einmal genau hin.',
    'Nicht ganz — probier es noch einmal.',
    'Noch ein Versuch, du schaffst das.',
    'Das war knapp. Versuch es noch einmal.',
  ];

  // ─── Start ────────────────────────────────────────────────────────────────

  /**
   * @param {object} config
   *   mode      {string}
   *   plan      {string[]} Themen-IDs, eine je Aufgabe (überschreibt topicId/length)
   *   topicId   {string}   Einzelthema
   *   length    {number}   5 oder 10
   *   title, icon, color   Kopfbereich
   *   onExit    {function} Rückkehr (Standard: Dorfplatz)
   *   onFinish  {function} nach der Auswertung statt Standardbildschirm
   */
  function start(config) {
    const profile = Storage.getActiveProfile();
    const roundLength = config.length ||
      (profile && profile.settings && profile.settings.roundLength) || 10;

    const plan = config.plan && config.plan.length
      ? config.plan.slice(0, roundLength)
      : new Array(roundLength).fill(config.topicId);

    state = {
      mode: config.mode || 'practice',
      plan,
      length: plan.length,
      index: 0,
      title: config.title || 'Üben',
      icon: config.icon || '📘',
      color: config.color || null,
      onExit: config.onExit || (() => App.showVillage()),
      onFinish: config.onFinish || null,
      results: [],
      retryQueue: [],
      askedTaskIds: [],
      current: null,
      finished: false,
      levelChanges: [],
    };
    renderTask();
  }

  function abort() {
    Timers.invalidate();
    state = null;
  }

  function isActive() { return !!state && !state.finished; }

  // ─── Aufgabenauswahl ──────────────────────────────────────────────────────

  function nextTask() {
    const profile = Storage.getActiveProfile();

    // Fällige Wiederholung aus dieser Runde?
    if (state.retryQueue.length && state.retryQueue[0].notBefore <= state.index) {
      const item = state.retryQueue.shift();
      return Object.assign({}, item.task, { isRetry: true });
    }

    const topicId = state.plan[state.index] || state.plan[state.plan.length - 1];
    const task = Generators.create(topicId, {
      profile,
      avoid: state.askedTaskIds,
    });
    return task;
  }

  // ─── Rendern ──────────────────────────────────────────────────────────────

  function renderTask() {
    const profile = Storage.getActiveProfile();
    const task = nextTask();
    if (!task) { finish(); return; }

    state.current = {
      task,
      wrongAttempts: 0,
      hintIndex: 0,
      helpUsed: false,
      recorded: false,
      locked: false,
    };
    if (!task.isRetry) state.askedTaskIds.push(task.taskId);

    const view = TaskView.forTask(task);
    const topic = Topics.get(task.topicId);
    const isCheck = state.mode === 'check';
    const progressPct = (state.index / state.length) * 100;

    UI.render(`
      <div class="screen task-screen" ${state.color ? `style="--accent:${state.color}"` : ''}>
        ${UI.header({ title: state.title, icon: state.icon, backLabel: 'Übung verlassen' })}
        <main class="task-main">
          <div class="task-card">
            <div class="task-category">
              <span aria-hidden="true">${task.icon || (topic && topic.icon) || ''}</span>
              <span>${Util.escapeHtml(task.title || (topic && topic.title) || '')}</span>
              ${isCheck ? '<span class="check-badge">Kurz-Check</span>'
                : `<span class="difficulty-indicator" aria-label="Stufe ${task.level} von 3">${'⭐'.repeat(task.level)}</span>`}
            </div>

            <div class="task-progress">
              <div class="task-progress-bar" role="progressbar"
                   aria-valuenow="${state.index}" aria-valuemin="0" aria-valuemax="${state.length}">
                <div class="task-progress-fill" style="width:${progressPct}%"></div>
              </div>
              <span class="task-progress-label">Aufgabe <strong>${state.index + 1}</strong> von ${state.length}</span>
            </div>

            ${task.isRetry ? '<p class="retry-note">Die Aufgabe kommt noch einmal — jetzt klappt sie bestimmt.</p>' : ''}

            <div class="task-question" id="task-question">${task.questionHtml}</div>

            <div class="task-input-area" id="task-input-area">${view.html(task)}</div>

            <div class="task-feedback hidden" id="task-feedback" role="status"></div>

            <div class="task-actions">
              ${isCheck ? '' : `<button class="btn btn-ghost" id="hint-btn" type="button">💡 Tipp</button>`}
              ${task.tool && !isCheck ? `<button class="btn btn-ghost" id="tool-btn" type="button">🧰 Hilfsmittel</button>` : ''}
              <button class="btn btn-primary" id="next-btn" type="button" style="display:none">Weiter →</button>
            </div>
          </div>
        </main>
      </div>`);

    const api = {
      submit: (value) => evaluate(value),
      markHelpUsed: () => { state.current.helpUsed = true; },
      announce: (t) => UI.announce(t),
    };
    view.bind(task, api);

    UI.on('#back-btn', 'click', exitWithConfirm);
    UI.on('#hint-btn', 'click', showNextHint);
    UI.on('#tool-btn', 'click', () => Toolbox.open(task.tool, task));
    UI.on('#next-btn', 'click', advance);

    if (task.prompt) UI.announce(task.prompt);

    Timers.after(60, () => {
      const main = UI.$('.task-main');
      if (main && typeof Oskar !== 'undefined') {
        Oskar.show(main, { placement: 'task-companion', pool: 'taskIntro', chance: 0.25 });
      }
    });
  }

  // ─── Hinweise ─────────────────────────────────────────────────────────────

  function showNextHint() {
    const c = state.current;
    if (!c || c.locked) return;
    const hints = c.task.hints || [];
    if (!hints.length) return;
    if (c.hintIndex >= hints.length) {
      showFeedback('Mehr Hilfe habe ich nicht — probier es einfach!', 'hint');
      return;
    }
    const hint = hints[c.hintIndex];
    c.hintIndex++;
    c.helpUsed = true;
    const step = `Tipp ${c.hintIndex} von ${hints.length}`;
    showFeedback(`<span class="hint-step">${step}</span> ${hint}`, 'hint');
    UI.announce(hint);
    const btn = UI.$('#hint-btn');
    if (btn && c.hintIndex >= hints.length) btn.textContent = '💡 Kein Tipp mehr';
  }

  // ─── Auswertung ───────────────────────────────────────────────────────────

  function evaluate(value) {
    const c = state.current;
    if (!c || c.locked) return;
    const task = c.task;
    const view = TaskView.forTask(task);
    const correct = AnswerCheck.check(value, task);
    const isCheck = state.mode === 'check';

    if (isCheck) {
      // Ein Versuch, neutrale Rückmeldung, Auswertung erst am Ende.
      c.locked = true;
      view.lock(task);
      record(correct ? OUT.SOLO : OUT.FAILED);
      showFeedback('Antwort gespeichert. Weiter geht es!', 'neutral');
      Timers.after(700, advance);
      return;
    }

    if (correct) {
      c.locked = true;
      view.lock(task);
      if (view.mark) view.mark(task, value, true);
      const outcome = (c.wrongAttempts === 0 && !c.helpUsed) ? OUT.SOLO : OUT.HELPED;
      record(outcome);

      const praise = outcome === OUT.SOLO
        ? Util.randomFrom(PRAISE) + ' 🌟'
        : 'Richtig — und mit Hilfe geschafft. Das zählt auch! 👍';
      showFeedback(praise, 'correct');
      UI.announce(outcome === OUT.SOLO ? 'Richtig.' : 'Richtig, mit Hilfe geschafft.');
      if (typeof Oskar !== 'undefined') Oskar.say(Util.randomFrom(Oskar.MESSAGES.correct));

      const fill = UI.$('.task-progress-fill');
      if (fill) fill.style.width = `${((state.index + 1) / state.length) * 100}%`;

      Timers.after(ADVANCE_DELAY_OK, advance);
      return;
    }

    // Falsche Antwort
    c.wrongAttempts++;
    if (typeof Oskar !== 'undefined') Oskar.silence();

    if (c.wrongAttempts >= MAX_WRONG_ATTEMPTS) {
      c.locked = true;
      view.lock(task);
      if (view.mark) view.mark(task, value, false);
      view.reveal(task);
      record(OUT.FAILED);
      showFeedback(
        `Die richtige Lösung ist: <strong>${Util.escapeHtml(AnswerCheck.formatSolution(task))}</strong><br>`
        + 'Diese Aufgabe üben wir später noch einmal.',
        'solution');
      UI.announce('Die richtige Lösung ist ' + AnswerCheck.formatSolution(task));
      showNextButton();
      return;
    }

    // Noch Versuche übrig
    const kind = AnswerCheck.classify(value, task);
    let msg = Util.randomFrom(ENCOURAGE);
    if (kind === 'caseOnly') msg = 'Fast! Achte auf die Groß- und Kleinschreibung.';
    else if (kind === 'typo') msg = 'Ganz nah dran — schau dir die Buchstaben noch einmal an.';
    else if (kind === 'closeNumber') msg = 'Knapp daneben. Rechne noch einmal in Ruhe.';
    showFeedback(msg, 'wrong');
    UI.announce(msg);

    if (view.mark && task.input.kind === 'choice') {
      // Bei Auswahlaufgaben ist ein zweiter Versuch sinnlos: Lösung zeigen.
      c.locked = true;
      view.lock(task);
      view.mark(task, value, false);
      record(OUT.FAILED);
      showFeedback(
        `Die richtige Antwort ist: <strong>${Util.escapeHtml(AnswerCheck.formatSolution(task))}</strong><br>`
        + 'Schau sie dir gut an — die Aufgabe kommt noch einmal.',
        'solution');
      showNextButton();
      return;
    }

    if (view.clear) view.clear();
    const input = UI.$('#task-answer');
    if (input && !UI.prefersReducedMotion()) {
      input.classList.add('shake');
      Timers.after(400, () => input.classList.remove('shake'));
    }
    // Nach dem ersten Fehlversuch aktiv einen Tipp anbieten.
    if (c.wrongAttempts === 1 && (task.hints || []).length) {
      const btn = UI.$('#hint-btn');
      if (btn) btn.classList.add('btn-ghost--pulse');
    }
  }

  function showNextButton() {
    const btn = UI.$('#next-btn');
    if (btn) { btn.style.display = ''; btn.focus(); }
  }

  // ─── Verbuchen ────────────────────────────────────────────────────────────

  /** Verbucht die aktuelle Aufgabe genau einmal. */
  function record(outcome) {
    const c = state.current;
    if (!c || c.recorded) return;
    c.recorded = true;
    c.outcome = outcome;

    const profile = Storage.getActiveProfile();
    const task = c.task;

    if (profile) {
      Progress.recordAttempt(profile, {
        topicId: task.topicId,
        taskId: task.taskId,
        outcome,
        level: task.level,
        hintsUsed: c.hintIndex,
        mode: state.mode,
      });

      if (outcome === OUT.FAILED) {
        // Höchstens ein offener Eintrag je Aufgabe — auch bei mehreren
        // Fehlversuchen derselben Aufgabe.
        Progress.queueRetry(profile, {
          taskId: task.taskId,
          topicId: task.topicId,
          label: task.prompt,
          level: task.level,
          seed: task.seed,
          dueAt: Date.now() + Util.DAY_MS,
        });
      } else if (outcome === OUT.SOLO) {
        Progress.resolveRetry(profile, task.taskId);
      }
      Storage.saveProfile(profile);
    }

    state.results.push({
      topicId: task.topicId,
      taskId: task.taskId,
      outcome,
      level: task.level,
      hints: c.hintIndex,
    });

    // Wiederholung innerhalb der Runde: nur einmal je Aufgabe und nur,
    // wenn danach noch Platz ist.
    if (outcome === OUT.FAILED && !task.isRetry && state.mode !== 'check') {
      const already = state.retryQueue.some(r => r.task.taskId === task.taskId);
      if (!already && state.index + 2 < state.length) {
        state.retryQueue.push({ task, notBefore: state.index + 2 });
      }
    }
  }

  // ─── Weiter ───────────────────────────────────────────────────────────────

  function advance() {
    if (!state) return;
    const c = state.current;
    if (c && !c.recorded) record(OUT.FAILED);   // Sicherheitsnetz
    state.index++;
    // Die Rundenlänge bleibt fest. Offene Wiederholungen sind bereits im
    // Profil gespeichert und kommen an einem der nächsten Tage wieder.
    if (state.index >= state.length) finish();
    else renderTask();
  }

  // ─── Abschluss ────────────────────────────────────────────────────────────

  function finish() {
    if (!state || state.finished) return;      // genau einmal werten
    state.finished = true;
    Timers.invalidate();

    const profile = Storage.getActiveProfile();
    const results = state.results;
    const counts = {
      solo: results.filter(r => r.outcome === OUT.SOLO).length,
      helped: results.filter(r => r.outcome === OUT.HELPED).length,
      failed: results.filter(r => r.outcome === OUT.FAILED).length,
      total: results.length,
    };

    const topics = Util.uniq(results.map(r => r.topicId));
    const singleTopic = topics.length === 1 ? topics[0] : null;
    let stars = { base: 0, bonus: 0, total: 0, perfect: false };
    let newStickers = [];

    if (profile && counts.total > 0) {
      if (singleTopic) {
        Progress.saveRound(profile, Object.assign({ topicId: singleTopic, mode: state.mode,
          level: results[0].level, at: Date.now() }, counts));
      } else {
        Progress.saveMixedRound(profile, Object.assign({ mode: state.mode, topics, at: Date.now() }, counts));
      }

      // Stufenanpassung: nur für Themen mit genug Aufgaben in dieser Runde
      // und nie im Kurz-Check.
      topics.forEach(id => {
        const n = results.filter(r => r.topicId === id).length;
        if (n < 4) return;
        const change = Progress.reviewLevelAfterRound(profile, id, state.mode);
        if (change) state.levelChanges.push({ topicId: id, change });
      });

      stars = Rewards.starsForRound(counts);
      profile.stars = (profile.stars || 0) + stars.total;
      profile.level = Math.floor(profile.stars / 10) + 1;

      const today = Util.dayKey();
      if (!profile.daily || profile.daily.lastDay !== today) profile.daily = { lastDay: today, rounds: 0 };
      profile.daily.rounds++;

      newStickers = Rewards.syncAlbum(profile);
      Storage.saveProfile(profile);
    }

    if (state.onFinish) {
      state.onFinish({ counts, stars, results, topics, newStickers, levelChanges: state.levelChanges });
      return;
    }
    renderComplete({ counts, stars, newStickers });
  }

  function renderComplete(data) {
    const { counts, stars, newStickers } = data;
    const roundStars = Progress.roundStars(counts);
    const summary = Progress.roundSummaryText(counts);
    const isCheck = state.mode === 'check';

    if (roundStars >= 2) UI.confetti();

    const goalRows = isCheck ? renderGoalBreakdown() : '';
    const stickerHtml = newStickers.length
      ? `<div class="new-stickers">
           <p class="ns-title">Neu im Sammelalbum!</p>
           <div class="ns-row">${newStickers.map(s =>
             `<span class="ns-item"><span class="ns-emoji">${s.emoji}</span><span class="ns-label">${Util.escapeHtml(s.label)}</span></span>`).join('')}</div>
         </div>`
      : '';

    const levelHtml = state.levelChanges.length
      ? `<p class="level-change">${state.levelChanges.map(l => {
          const t = Topics.get(l.topicId);
          return l.change.to > l.change.from
            ? `„${Util.escapeHtml(t ? t.title : l.topicId)}" wird jetzt etwas schwerer.`
            : `„${Util.escapeHtml(t ? t.title : l.topicId)}" wird wieder etwas leichter.`;
        }).join('<br>')}</p>`
      : '';

    UI.render(`
      <div class="screen complete-screen" ${state.color ? `style="--accent:${state.color}"` : ''}>
        ${UI.header({ title: state.title, icon: state.icon, backLabel: 'Zurück' })}
        <main class="complete-main">
          <div class="complete-card">
            <div class="complete-trophy" aria-hidden="true">${roundStars >= 3 ? '🏆' : roundStars >= 2 ? '🌟' : '👍'}</div>
            <h2 class="complete-praise">${isCheck ? 'Kurz-Check fertig!' : 'Runde geschafft!'}</h2>

            <div class="result-bars">
              <div class="rb-row"><span class="rb-key rb-key--solo">Allein geschafft</span>
                <span class="rb-val">${counts.solo}</span></div>
              <div class="rb-row"><span class="rb-key rb-key--helped">Mit Hilfe geschafft</span>
                <span class="rb-val">${counts.helped}</span></div>
              <div class="rb-row"><span class="rb-key rb-key--open">Noch üben</span>
                <span class="rb-val">${counts.failed}</span></div>
            </div>

            <p class="complete-performance">${Util.escapeHtml(summary)}</p>
            ${goalRows}
            ${isCheck ? '' : `
              <div class="complete-score-row">
                <span class="complete-stars" aria-hidden="true">${roundStars > 0 ? '⭐'.repeat(roundStars) : '☆☆☆'}</span>
                <span class="complete-score-text">+${stars.total} ${Util.plural(stars.total, 'Stern', 'Sterne')}</span>
              </div>
              ${stars.bonus ? `<p class="bonus-note">${Util.escapeHtml(Rewards.bonusText(counts))}</p>` : ''}
            `}
            ${levelHtml}
            ${stickerHtml}

            <div class="complete-actions">
              <button class="btn btn-primary" id="again-btn" type="button">🔄 Noch eine Runde</button>
              <button class="btn btn-ghost" id="home-btn" type="button">🏘️ Zum Dorfplatz</button>
            </div>
          </div>
        </main>
      </div>`);

    const cfg = {
      mode: state.mode, plan: state.plan, length: state.length,
      title: state.title, icon: state.icon, color: state.color, onExit: state.onExit,
    };
    // Der Pfeil oben links geht eine Ebene zurück (zur Übungsauswahl),
    // der Knopf unten ausdrücklich zum Dorfplatz.
    UI.on('#again-btn', 'click', () => start(cfg));
    UI.on('#back-btn', 'click', () => { const back = state.onExit; state = null; back(); });
    UI.on('#home-btn', 'click', () => { state = null; App.showVillage(); });

    Timers.after(120, () => {
      const main = UI.$('.complete-main');
      if (main && typeof Oskar !== 'undefined') {
        Oskar.show(main, { placement: 'task-companion', pool: 'correct', chance: 1 });
      }
    });

    if (typeof PWA !== 'undefined' && PWA.onRoundFinished) PWA.onRoundFinished();
  }

  /** Ergebnis je Lernziel — nur Beobachtungen, keine Note. */
  function renderGoalBreakdown() {
    const byTopic = {};
    state.results.forEach(r => {
      if (!byTopic[r.topicId]) byTopic[r.topicId] = { solo: 0, total: 0 };
      byTopic[r.topicId].total++;
      if (r.outcome === OUT.SOLO) byTopic[r.topicId].solo++;
    });
    const rows = Object.keys(byTopic).map(id => {
      const t = Topics.get(id);
      const d = byTopic[id];
      return `<li class="goal-row">
        <span class="goal-title">${Util.escapeHtml(t ? t.title : id)}</span>
        <span class="goal-score">${d.solo} von ${d.total} allein geschafft</span>
      </li>`;
    }).join('');
    return `<div class="goal-breakdown">
      <h3>Das habe ich beobachtet</h3>
      <ul class="goal-list">${rows}</ul>
      <p class="goal-note">Das ist ein Hinweis, keine Note. Mehrere Beobachtungen an
        verschiedenen Tagen sagen mehr aus als ein einzelner Check.</p>
    </div>`;
  }

  // ─── Verlassen ────────────────────────────────────────────────────────────

  function exitWithConfirm() {
    if (!state || state.index === 0) { leave(); return; }
    UI.confirm('Deine Runde ist noch nicht fertig. Möchtest du wirklich aufhören?', {
      icon: '🚪', title: 'Übung verlassen?', yes: 'Ja, aufhören', no: 'Weiterüben',
    }).then(ok => { if (ok) leave(); });
  }

  function leave() {
    const back = state ? state.onExit : (() => App.showVillage());
    Timers.invalidate();
    state = null;
    back();
  }

  function showFeedback(html, type) {
    const fb = document.getElementById('task-feedback');
    if (!fb) return;
    fb.innerHTML = html;
    fb.className = `task-feedback feedback-${type}`;
  }

  return {
    MAX_WRONG_ATTEMPTS,
    start, abort, isActive, leave,
    // Für Tests
    _state: () => state,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Session;
