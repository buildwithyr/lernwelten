/**
 * features/worksheet.js
 * Druckbare Arbeitsblätter mit getrennter Lösungsseite.
 *
 * Die Aufgaben stammen aus denselben Generatoren wie in der App. Wegen der
 * gespeicherten Startwerte lässt sich jedes Blatt exakt wiederherstellen.
 * Papierergebnisse werden NICHT automatisch in den Lernstand übernommen —
 * sie können im Elternbereich von Hand berücksichtigt werden.
 */

const Worksheet = (() => {

  let state = null;

  function open(subject) {
    const profile = Storage.getActiveProfile();
    if (!profile) return;
    const grade = profile.grade;
    const topics = Topics.forSubject(subject, grade)
      .filter(t => Topics.isAlwaysOn(t.id) || profile.unlocked[t.id])
      .filter(t => printable(t.id));

    if (!topics.length) {
      UI.info('Für ein Arbeitsblatt muss zuerst ein passendes Thema freigegeben sein.',
        { title: 'Noch kein Thema', icon: '🖨️' });
      return;
    }

    state = { subject, topics, selected: [topics[0].id], count: 10 };
    render();
  }

  /** Nicht jede Aufgabenform funktioniert auf Papier. */
  function printable(topicId) {
    const t = Topics.get(topicId);
    if (!t) return false;
    const notPrintable = ['p.memoryTask', 'd2.merkwoerter', 'd2.lernwoerter', 'd2.leseAnweisung'];
    if (notPrintable.includes(topicId)) return false;
    const probe = Generators.create(topicId, { level: 1 });
    if (!probe) return false;
    return !['memory', 'lookCoverWrite', 'tapShapes', 'info'].includes(probe.input.kind);
  }

  function render() {
    const b = Workshop.get(Workshop.subjectToBuilding(state.subject));
    UI.render(`
      <div class="screen worksheet-screen" style="--accent:${b.color}">
        ${UI.header({ title: 'Arbeitsblatt', icon: '🖨️', backLabel: 'Zurück' })}
        <main class="worksheet-main">
          <p class="menu-intro">Wähle die Themen aus. Das Blatt bekommt eine
            eigene Lösungsseite, die du abtrennen kannst.</p>

          <div class="ws-topics">
            ${state.topics.map(t => `
              <label class="focus-chip">
                <input type="checkbox" class="ws-topic" data-topic="${Util.escapeAttr(t.id)}"
                       ${state.selected.includes(t.id) ? 'checked' : ''} />
                <span>${Util.escapeHtml(t.title)}</span>
              </label>`).join('')}
          </div>

          <div class="session-mode" role="group" aria-label="Anzahl der Aufgaben">
            <span class="session-mode-label">Aufgaben</span>
            ${[6, 10, 16].map(n => `<button class="session-mode-btn${state.count === n ? ' selected' : ''}"
              data-count="${n}" type="button">${n}</button>`).join('')}
          </div>

          <div class="ws-actions">
            <button class="btn btn-primary" id="ws-build" type="button">Blatt erstellen</button>
          </div>

          <div id="ws-preview"></div>
        </main>
      </div>`);

    UI.on('#back-btn', 'click', () => Workshop.open(b.id));
    UI.onAll('.ws-topic', 'change', e => {
      const id = e.currentTarget.dataset.topic;
      if (e.currentTarget.checked) state.selected = Util.uniq(state.selected.concat([id]));
      else state.selected = state.selected.filter(x => x !== id);
    });
    UI.onAll('[data-count]', 'click', e => {
      state.count = Number(e.currentTarget.dataset.count);
      render();
    });
    UI.on('#ws-build', 'click', build);
  }

  function build() {
    if (!state.selected.length) {
      UI.info('Bitte mindestens ein Thema auswählen.', { title: 'Kein Thema gewählt' });
      return;
    }
    const profile = Storage.getActiveProfile();
    const tasks = [];
    const used = [];
    for (let i = 0; i < state.count; i++) {
      const topicId = state.selected[i % state.selected.length];
      const task = Generators.create(topicId, { profile, avoid: used });
      if (!task) continue;
      used.push(task.taskId);
      tasks.push(task);
    }
    state.tasks = tasks;
    renderSheet();
  }

  /** Aufgabenstellung als Papierform — ohne Eingabefelder der App. */
  function paperQuestion(task) {
    const clean = String(task.questionHtml || '')
      .replace(/<button[\s\S]*?<\/button>/g, '')
      .replace(/ class="math-blank"/g, ' class="ws-blank"');
    let answerSpace = '<span class="ws-line"></span>';
    if (task.input.kind === 'choice') {
      answerSpace = `<span class="ws-choices">${(task.input.choices || [])
        .map(c => `<span class="ws-choice">☐ ${Util.escapeHtml(c)}</span>`).join('')}</span>`;
    } else if (task.input.kind === 'fields') {
      answerSpace = `<span class="ws-fields">${(task.input.labels || [])
        .map(l => `<span class="ws-field">${Util.escapeHtml(l)}: <span class="ws-line ws-line--short"></span></span>`).join('')}</span>`;
    } else if (task.input.kind === 'order' || task.input.kind === 'set') {
      answerSpace = `<span class="ws-items">${(task.input.items || [])
        .map(x => `<span class="ws-item">${Util.escapeHtml(x)}</span>`).join('')}</span>
        <span class="ws-line"></span>`;
    }
    return `${clean}<div class="ws-answer">${answerSpace}</div>`;
  }

  function solutionText(task) {
    if (Array.isArray(task.answer)) return task.answer.join(', ');
    if (task.input.kind === 'tapWord') {
      return task.input.words[Number(task.answer)];
    }
    return String(task.answer);
  }

  function renderSheet() {
    const profile = Storage.getActiveProfile();
    const date = Util.formatDate(Date.now());
    const b = Workshop.get(Workshop.subjectToBuilding(state.subject));

    UI.render(`
      <div class="screen worksheet-screen" style="--accent:${b.color}">
        <div class="no-print">
          ${UI.header({ title: 'Arbeitsblatt', icon: '🖨️', backLabel: 'Zurück' })}
          <div class="ws-toolbar">
            <button class="btn btn-primary" id="ws-print" type="button">🖨️ Drucken</button>
            <button class="btn btn-ghost" id="ws-new" type="button">🔄 Neue Aufgaben</button>
            <button class="btn btn-ghost" id="ws-back" type="button">Zurück</button>
          </div>
          <p class="ws-note">Ergebnisse von Papieraufgaben fließen nicht automatisch
            in den Lernstand ein.</p>
        </div>

        <div class="print-sheet" id="print-sheet">
          <header class="ps-head">
            <h1>Lernwelten — Übungsblatt</h1>
            <p class="ps-meta">Für ${Util.escapeHtml(profile.name)} · ${Util.escapeHtml(date)}
              · ${Util.escapeHtml(b.label)}</p>
          </header>
          <ol class="ps-tasks">
            ${state.tasks.map(t => `<li class="ps-task">${paperQuestion(t)}</li>`).join('')}
          </ol>

          <div class="ps-solutions">
            <h2>Lösungen — zum Abtrennen</h2>
            <ol class="ps-solution-list">
              ${state.tasks.map(t => `<li>${Util.escapeHtml(solutionText(t))}</li>`).join('')}
            </ol>
            <p class="ps-source">Aufgabenkennungen: ${state.tasks.map(t =>
              Util.escapeHtml(t.taskId + '/' + t.seed)).join(' · ')}</p>
          </div>
        </div>
      </div>`);

    UI.on('#back-btn', 'click', render);
    UI.on('#ws-back', 'click', render);
    UI.on('#ws-new', 'click', build);
    UI.on('#ws-print', 'click', () => window.print());
  }

  return { open, printable };
})();
