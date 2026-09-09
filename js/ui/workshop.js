/**
 * ui/workshop.js
 * Menü eines Lerngebäudes: Themenauswahl, Rundenlänge, Start einer Runde.
 *
 * Ersetzt die vier fast gleichen Modul-Menüs aus Version 1.
 * Gesperrte Themen erscheinen hier gar nicht — es gibt keine Attrappen.
 * Freigegeben wird im Elternbereich.
 */

const Workshop = (() => {

  const BUILDINGS = {
    math: {
      id: 'math', subject: 'math', label: 'Rechenwerkstatt', icon: '🔨',
      color: '#2E86AB', bg: '#E4F1F8',
      intro: 'Such dir eine Rechenübung aus.',
      pool: 'workshop',
      extras: [
        { id: 'shop', label: 'Oskars Laden', icon: '🛒', desc: 'Einkaufen, Geld legen, Rückgeld prüfen',
          run: () => Shop.open() },
        { id: 'worksheet', label: 'Arbeitsblatt', icon: '🖨️', desc: 'Aufgaben zum Ausdrucken',
          run: () => Worksheet.open('math') },
      ],
    },
    german: {
      id: 'german', subject: 'german', label: 'Wörterhaus', icon: '📖',
      color: '#C1447E', bg: '#FBEAF2',
      intro: 'Such dir eine Sprachübung aus.',
      pool: 'words',
      extras: [
        { id: 'worksheet', label: 'Arbeitsblatt', icon: '🖨️', desc: 'Aufgaben zum Ausdrucken',
          run: () => Worksheet.open('german') },
      ],
    },
    science: {
      id: 'science', subject: 'science', label: 'Forscherlabor', icon: '🔬',
      color: '#3AA655', bg: '#E8F6EB',
      intro: 'Was möchtest du erforschen?',
      pool: 'science',
      extras: [],
    },
    logic: {
      id: 'logic', subject: 'logic', label: 'Rätselhöhle', icon: '🗝️',
      color: '#E07A3E', bg: '#FCEEE3',
      intro: 'Welches Rätsel möchtest du lösen?',
      pool: 'puzzles',
      extras: [
        { id: 'mirror', label: 'Spiegelatelier', icon: '🪞', desc: 'Bilder spiegeln und selbst bauen',
          run: () => Mirror.open() },
      ],
    },
  };

  function get(id) { return BUILDINGS[id] || null; }

  /** Freigegebene Themen eines Fachs für die aktuelle Klassenstufe. */
  function availableTopics(subject) {
    const profile = Storage.getActiveProfile();
    const grade = profile ? profile.grade : 1;
    return Topics.forSubject(subject, grade).filter(t => {
      if (Topics.isAlwaysOn(t.id)) return true;
      return !!(profile && profile.unlocked[t.id]);
    });
  }

  function lockedCount(subject) {
    const profile = Storage.getActiveProfile();
    const grade = profile ? profile.grade : 1;
    return Topics.forSubject(subject, grade).filter(t =>
      !Topics.isAlwaysOn(t.id) && !(profile && profile.unlocked[t.id])).length;
  }

  // ─── Menü ─────────────────────────────────────────────────────────────────

  function open(buildingId) {
    const b = get(buildingId);
    if (!b) { App.showVillage(); return; }
    render(b);
  }

  function render(b) {
    const profile = Storage.getActiveProfile();
    const roundLength = (profile && profile.settings.roundLength) || 10;
    const topics = availableTopics(b.subject);
    const groups = Topics.groupBy(topics);
    const locked = lockedCount(b.subject);

    UI.render(`
      <div class="screen workshop-screen" style="--accent:${b.color}; --accent-bg:${b.bg}">
        ${UI.header({ title: b.label, icon: b.icon, backLabel: 'Zurück zum Dorfplatz' })}
        <main class="exercise-menu">
          <p class="menu-intro">${Util.escapeHtml(b.intro)}</p>

          <div class="session-mode" role="group" aria-label="Wie viele Aufgaben?">
            <span class="session-mode-label">Wie viele Aufgaben?</span>
            <button class="session-mode-btn${roundLength === 5 ? ' selected' : ''}"
                    data-len="5" type="button" aria-pressed="${roundLength === 5}">5</button>
            <button class="session-mode-btn${roundLength === 10 ? ' selected' : ''}"
                    data-len="10" type="button" aria-pressed="${roundLength === 10}">10</button>
          </div>

          ${groups.map(g => `
            <section class="topic-group">
              <h2 class="topic-group-title">${Util.escapeHtml(g.group)}</h2>
              <div class="exercise-grid">
                ${g.topics.map(t => topicCard(t, roundLength)).join('')}
              </div>
            </section>`).join('')}

          ${b.extras.length ? `
            <section class="topic-group">
              <h2 class="topic-group-title">Extras</h2>
              <div class="exercise-grid">
                ${b.extras.map(e => `
                  <button class="exercise-card exercise-card--extra" data-extra="${e.id}" type="button">
                    <span class="ex-icon" aria-hidden="true">${e.icon}</span>
                    <span class="ex-title">${Util.escapeHtml(e.label)}</span>
                    <span class="ex-desc">${Util.escapeHtml(e.desc)}</span>
                  </button>`).join('')}
              </div>
            </section>` : ''}

          ${locked > 0 ? `<p class="locked-note">Es gibt noch ${locked} weitere
            ${Util.plural(locked, 'Übung', 'Übungen')}. Ein Erwachsener kann sie
            im Elternbereich freigeben.</p>` : ''}
        </main>
      </div>`);

    UI.on('#back-btn', 'click', () => App.showVillage());

    UI.onAll('.session-mode-btn', 'click', e => {
      const len = Number(e.currentTarget.dataset.len) === 5 ? 5 : 10;
      Storage.updateActive(p => { p.settings.roundLength = len; });
      render(b);
    });

    UI.onAll('.exercise-card[data-topic]', 'click', e => {
      startTopic(e.currentTarget.dataset.topic, b);
    });

    UI.onAll('.exercise-card[data-extra]', 'click', e => {
      const extra = b.extras.find(x => x.id === e.currentTarget.dataset.extra);
      if (extra) extra.run();
    });

    Timers.after(60, () => {
      const menu = UI.$('.exercise-menu');
      if (menu && typeof Oskar !== 'undefined') {
        Oskar.show(menu, { placement: 'inline-right', pool: b.pool, chance: 0.6 });
      }
    });
  }

  function topicCard(topic, roundLength) {
    const profile = Storage.getActiveProfile();
    const best = profile ? Progress.bestLabel(profile, topic.id, roundLength) : null;
    const skill = profile && profile.skills[topic.id];
    const due = skill && skill.dueAt && skill.dueAt <= Date.now() && skill.attempts > 0;

    let progressHtml;
    if (!best) {
      progressHtml = '<span class="ex-progress ex-not-played">Noch nicht geübt</span>';
    } else {
      const label = best.sameLength
        ? `Beste Runde: ${best.solo} von ${best.total} allein`
        : `Zuletzt: ${best.solo} von ${best.total} allein`;
      progressHtml = `<span class="ex-progress">${label}</span>`;
    }

    return `
      <button class="exercise-card" data-topic="${Util.escapeAttr(topic.id)}" type="button">
        ${due ? '<span class="ex-due" title="Zeit zum Wiederholen">🔁</span>' : ''}
        <span class="ex-icon" aria-hidden="true">${topic.icon}</span>
        <span class="ex-title">${Util.escapeHtml(topic.title)}</span>
        <span class="ex-desc">${Util.escapeHtml(topic.short || topic.goal)}</span>
        ${progressHtml}
      </button>`;
  }

  function startTopic(topicId, building) {
    const profile = Storage.getActiveProfile();
    const b = building || get(Topics.get(topicId) ? subjectToBuilding(Topics.get(topicId).subject) : 'math');
    Session.start({
      mode: 'free',
      topicId,
      length: (profile && profile.settings.roundLength) || 10,
      title: b.label,
      icon: b.icon,
      color: b.color,
      onExit: () => render(b),
    });
  }

  function subjectToBuilding(subject) {
    return Object.keys(BUILDINGS).find(k => BUILDINGS[k].subject === subject) || 'math';
  }

  return { BUILDINGS, get, open, render, availableTopics, lockedCount, startTopic, subjectToBuilding };
})();
