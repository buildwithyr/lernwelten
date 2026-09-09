/**
 * features/daily.js
 * "Heute üben" und Kurz-Checks.
 *
 * "Heute üben" mischt das aktuelle Lernziel mit sinnvollen Wiederholungen
 * (Bericht, Abschnitt 6). Die Verteilung — leichter Einstieg, Schwerpunkt,
 * Wiederholung — ist eine Startidee, keine pädagogisch validierte Vorgabe.
 */

const Daily = (() => {

  /** Themen, aus denen "Heute üben" schöpfen darf. */
  function pool(profile) {
    const grade = profile.grade;
    return Topics.all()
      .filter(t => t.grade === 0 || t.grade === grade)
      .filter(t => Topics.isAlwaysOn(t.id) || profile.unlocked[t.id])
      .filter(t => Generators.has(t.id))
      .filter(t => !(t.needsLearnWords && !(profile.learnWords || []).length))
      .map(t => t.id);
  }

  function canStart(profile) {
    return pool(profile).length > 0;
  }

  /** Vorschau: welche Themen kämen heute dran? */
  function preview(profile) {
    const plan = buildPlan(profile);
    return Util.uniq(plan).map(id => Topics.get(id)).filter(Boolean);
  }

  function buildPlan(profile) {
    const length = (profile.settings && profile.settings.roundLength) || 10;
    return Progress.planRound(profile, {
      length,
      pool: pool(profile),
      focusTopics: profile.focusTopics,
    });
  }

  function start() {
    const profile = Storage.getActiveProfile();
    if (!profile) return;
    const plan = buildPlan(profile);
    if (!plan.length) {
      UI.info('Es sind noch keine Themen freigegeben. Ein Erwachsener kann sie im Elternbereich auswählen.',
        { title: 'Noch nichts freigegeben', icon: '🔒' });
      return;
    }
    Session.start({
      mode: 'daily',
      plan,
      length: plan.length,
      title: 'Heute üben',
      icon: '🌞',
      color: '#F4A435',
      onExit: () => App.showVillage(),
    });
  }

  // ─── Kurz-Checks ──────────────────────────────────────────────────────────

  /** Themen eines Checks, gefiltert auf freigegebene und umsetzbare. */
  function checkTopics(profile, nr) {
    const check = Topics.getCheck(nr);
    if (!check) return [];
    return check.topicIds
      .filter(id => Topics.get(id))
      .filter(id => Topics.isAlwaysOn(id) || profile.unlocked[id])
      .filter(id => Generators.has(id));
  }

  function availableChecks(profile) {
    return Topics.CHECKS
      .map(c => ({ check: c, topics: checkTopics(profile, c.nr) }))
      .filter(x => x.topics.length >= 2);
  }

  function openCheckPicker() {
    const profile = Storage.getActiveProfile();
    if (!profile) return;
    const list = availableChecks(profile);

    if (!list.length) {
      UI.info('Für einen Kurz-Check müssen mindestens zwei passende Themen freigegeben sein. '
        + 'Das stellt ein Erwachsener im Elternbereich ein.',
        { title: 'Noch kein Check möglich', icon: '📋' });
      return;
    }

    const ov = UI.overlay(`
      <div class="modal-icon" aria-hidden="true">📋</div>
      <h2>Kurz-Check</h2>
      <p class="modal-note">Ein Check zeigt, was gerade schon allein gelingt.
        Es gibt keine Note — nur Beobachtungen.</p>
      <div class="check-list">
        ${list.map(x => `
          <button class="check-item" data-nr="${x.check.nr}" type="button">
            <span class="ci-nr">Check ${x.check.nr}</span>
            <span class="ci-label">${Util.escapeHtml(shortLabel(x.check.label))}</span>
            <span class="ci-meta">${x.topics.length} ${Util.plural(x.topics.length, 'Thema', 'Themen')}
              · Zahlenreise 2, Teil ${x.check.volume}, S. ${x.check.printed}</span>
          </button>`).join('')}
      </div>
      <button class="btn btn-ghost" data-act="close" type="button">Abbrechen</button>
    `, { label: 'Kurz-Check auswählen', wide: true });

    ov.modal.querySelectorAll('.check-item').forEach(btn => {
      btn.addEventListener('click', () => {
        ov.close();
        startCheck(Number(btn.dataset.nr));
      });
    });
    ov.modal.querySelector('[data-act="close"]').addEventListener('click', () => ov.close());
  }

  function shortLabel(label) {
    return label.length > 70 ? label.slice(0, 68) + '…' : label;
  }

  function startCheck(nr) {
    const profile = Storage.getActiveProfile();
    const topics = checkTopics(profile, nr);
    if (topics.length < 2) return;
    const check = Topics.getCheck(nr);

    // Feste Mischung: jedes Thema kommt gleich oft dran, Reihenfolge gemischt.
    const length = topics.length <= 3 ? 6 : 8;
    const plan = [];
    let i = 0;
    while (plan.length < length) { plan.push(topics[i % topics.length]); i++; }

    Session.start({
      mode: 'check',
      plan: Util.shuffle(plan),
      length: plan.length,
      title: `Kurz-Check ${nr}`,
      icon: '📋',
      color: '#7A5AA8',
      onExit: () => App.showVillage(),
    });
    if (check) {
      UI.announce(`Kurz-Check ${nr}. ${check.topicIds.length} Lernziele. Es gibt keine Note.`);
    }
  }

  return { pool, canStart, preview, buildPlan, start, openCheckPicker, startCheck, availableChecks, checkTopics };
})();
