/**
 * app.js
 * Haupt-Controller: Start, Dorfplatz, Navigation.
 *
 * Neues Lernziel hinzufügen:
 *   1. Eintrag in js/core/topics.js ergänzen (id, subject, grade, gen, goal).
 *   2. Generator in js/generators/<fach>-gen.js schreiben und exportieren.
 *   3. Fertig — Menü, Lernstand, Elternbereich und Tests greifen automatisch.
 *      `npm test` bzw. `node --test tests/` prüft den neuen Generator mit.
 */

const App = (() => {

  const BUILDING_ORDER = ['math', 'german', 'science', 'logic'];

  // ─── Start ────────────────────────────────────────────────────────────────

  function init() {
    Storage.onError(err => UI.showStorageProblem(err));

    if (!Storage.isAvailable()) {
      UI.render(`
        <div class="screen setup-screen">
          <div class="setup-card">
            <div class="setup-logo" aria-hidden="true">⚠️</div>
            <h1 class="setup-title">Speicher nicht verfügbar</h1>
            <p class="setup-subtitle">Dieser Browser darf gerade keine Daten speichern.
              Im privaten Modus geht das oft nicht. Bitte öffne die Seite in einem
              normalen Fenster — sonst geht der Lernstand nach dem Schließen verloren.</p>
            <button class="btn btn-primary btn-large" id="anyway-btn" type="button">
              Trotzdem weiter (ohne Speichern)
            </button>
          </div>
        </div>`);
      UI.on('#anyway-btn', 'click', () => bootstrap());
      return;
    }

    const report = Storage.runMigrations();
    if (report.failed && report.failed.length) {
      UI.info('Beim Aktualisieren der gespeicherten Daten gab es ein Problem. '
        + 'Die Originaldaten wurden nicht verändert. Ein Erwachsener findet im '
        + 'Elternbereich unter „Daten" weitere Angaben.',
        { title: 'Hinweis zu den Daten', icon: '⚠️' });
    }
    bootstrap();
  }

  function bootstrap() {
    const profile = Storage.getActiveProfile();
    if (!profile) {
      ProfileUI.renderSetup({ grade: Storage.getGrade() || 1 });
      return;
    }
    showVillage();
  }

  // ─── Dorfplatz ────────────────────────────────────────────────────────────

  function showVillage() {
    const profile = Storage.getActiveProfile();
    if (!profile) { bootstrap(); return; }

    const buildings = BUILDING_ORDER.map(id => Workshop.get(id));
    const canDaily = Daily.canStart(profile);
    const dueCount = Progress.dueRetries(profile).length;
    const previewTopics = canDaily ? Daily.preview(profile).slice(0, 3) : [];

    UI.render(`
      <div class="screen village-screen village-screen--grade${profile.grade}">
        <header class="village-header">
          <div class="village-title"><span aria-hidden="true">🏘️</span><span>Lernwelt</span></div>
          <div class="village-header-right">
            <div class="star-badge" aria-label="${profile.stars} Sterne">
              <span aria-hidden="true">⭐</span> <span id="header-stars">${profile.stars}</span>
            </div>
            <button class="btn-avatar" id="profile-btn" type="button"
                    aria-label="Profil von ${Util.escapeAttr(profile.name)} öffnen">
              ${ProfileUI.avatarEmoji(profile.avatarId)}
            </button>
          </div>
        </header>

        <main class="village-main">
          <div class="village-welcome">
            <span class="welcome-avatar" aria-hidden="true">${ProfileUI.avatarEmoji(profile.avatarId)}</span>
            <p>Hallo, <strong>${Util.escapeHtml(profile.name)}</strong>!<br>Wohin möchtest du heute?</p>
          </div>

          ${canDaily ? `
            <button class="daily-card" id="daily-btn" type="button">
              <span class="daily-icon" aria-hidden="true">🌞</span>
              <span class="daily-body">
                <span class="daily-title">Heute üben</span>
                <span class="daily-sub">${previewTopics.length
                  ? Util.escapeHtml(previewTopics.map(t => t.title).join(' · '))
                  : 'Eine kurze, passende Runde'}</span>
                ${dueCount ? `<span class="daily-badge">${dueCount} ${Util.plural(dueCount, 'Wiederholung', 'Wiederholungen')} fällig</span>` : ''}
              </span>
              <span class="daily-go" aria-hidden="true">▶</span>
            </button>` : `
            <p class="village-hint">Es sind noch keine Themen freigegeben.
              Ein Erwachsener kann sie im Elternbereich auswählen.</p>`}

          <div class="village-grid">
            ${buildings.map(renderBuilding).join('')}
          </div>

          <div class="village-extras">
            <button class="village-extra" id="check-btn" type="button">
              <span aria-hidden="true">📋</span> Kurz-Check
            </button>
            <button class="village-extra" id="album-btn" type="button">
              <span aria-hidden="true">🖼️</span> Sammelalbum
            </button>
            <button class="village-extra" id="toolbox-btn" type="button">
              <span aria-hidden="true">🧰</span> Werkzeugkiste
            </button>
            <button class="village-extra" id="parents-btn" type="button">
              <span aria-hidden="true">👋</span> Für Eltern
            </button>
          </div>
        </main>
      </div>`);

    buildings.forEach(b => {
      UI.on(`#building-${b.id}`, 'click', () => Workshop.open(b.id));
    });
    UI.on('#daily-btn', 'click', () => Daily.start());
    UI.on('#check-btn', 'click', () => Daily.openCheckPicker());
    UI.on('#album-btn', 'click', () => Album.open());
    UI.on('#toolbox-btn', 'click', () => Toolbox.openPicker());
    UI.on('#parents-btn', 'click', () => Parents.open());
    UI.on('#profile-btn', 'click', () => ProfileUI.openCard());

    Timers.after(60, () => {
      const main = UI.$('.village-main');
      if (main && typeof Oskar !== 'undefined') {
        Oskar.show(main, { placement: 'inline-right', pool: 'village', chance: 0.6 });
      }
    });

    // Auf dem Dorfplatz darf ein Update angeboten werden — hier läuft keine Übung.
    if (typeof PWA !== 'undefined' && PWA.onVillage) PWA.onVillage();
  }

  function renderBuilding(b) {
    const profile = Storage.getActiveProfile();
    const topics = Workshop.availableTopics(b.subject);
    const practiced = topics.filter(t => profile.skills[t.id] && profile.skills[t.id].attempts > 0);
    const solid = practiced.filter(t => {
      const s = profile.skills[t.id];
      return s.attempts >= 6 && s.solo / s.attempts >= 0.8;
    });

    let badge;
    if (!topics.length) badge = '<span class="building-progress building-progress--new">Noch nichts freigegeben</span>';
    else if (!practiced.length) badge = '<span class="building-progress building-progress--new">Noch nicht geübt</span>';
    else badge = `<span class="building-progress">${solid.length} von ${topics.length} sicher</span>`;

    return `
      <button class="building-card" id="building-${b.id}" type="button"
              style="--building-color:${b.color}; --building-bg:${b.bg};">
        <div class="building-icon-wrap"><span class="building-icon" aria-hidden="true">${b.icon}</span></div>
        <span class="building-label">${Util.escapeHtml(b.label)}</span>
        ${badge}
      </button>`;
  }

  return { init, bootstrap, showVillage };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
