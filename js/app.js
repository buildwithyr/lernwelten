/**
 * app.js
 * Haupt-Controller — verwaltet Screens und verbindet alle Module.
 *
 * Neues Fach hinzufügen:
 *  1. js/modules/<fach>.js erstellen (Muster: math.js)
 *  2. Im BUILDINGS-Array unten eintragen
 *  3. <script>-Tag in index.html ergänzen
 */

const App = (() => {
  // active: true  → Gebäude ist betretbar
  // active: false → Platzhalter (kommt bald)
  const BUILDINGS = [
    {
      id: 'math',
      label: 'Rechenwerkstatt',
      icon: '🔨',
      color: '#F4A435',
      bgColor: '#FFF3DC',
      active: true,
      mount: () => MathModule.mount(),
      exerciseIds: ['numberRecognition', 'counting', 'addition', 'subtraction'],
    },
    {
      id: 'reading',
      label: 'Wörterhaus',
      icon: '📖',
      color: '#6DB68A',
      bgColor: '#E8F5EE',
      active: true,
      mount: () => WordsModule.mount(),
      exerciseIds: ['missingLetter', 'sortLetters', 'wordCategory', 'opposites'],
    },
    {
      id: 'science',
      label: 'Forscherlabor',
      icon: '🔬',
      color: '#7EB8D4',
      bgColor: '#E3F2F9',
      active: true,
      mount: () => ScienceModule.mount(),
      exerciseIds: ['knowledgeQuiz', 'trueFalse', 'matching'],
    },
    {
      id: 'puzzles',
      label: 'Rätselhöhle',
      icon: '🗝️',
      color: '#B07EC8',
      bgColor: '#F3EAF8',
      active: true,
      mount: () => PuzzlesModule.mount(),
      exerciseIds: ['numberPattern', 'shapePattern', 'oddOneOut', 'memoryTask', 'miniSudoku'],
    },
  ];

  // ─── Bootstrap ────────────────────────────────────────────────────────────

  function init() {
    const profile = Storage.getActiveProfile();
    if (!profile) {
      Profile.renderSetupScreen();
    } else {
      showVillage();
    }
  }

  // ─── Village / Dorfplatz ──────────────────────────────────────────────────

  function showVillage() {
    const profile = Storage.getActiveProfile();
    const app = document.getElementById('app');

    app.innerHTML = `
      <div class="screen village-screen">
        <header class="village-header">
          <div class="village-title">
            <span>🏘️</span>
            <span>Lernwelt</span>
          </div>
          <div class="village-header-right">
            <div class="star-badge">
              ⭐ <span id="village-stars">${profile.stars}</span>
            </div>
            <button class="btn-avatar" id="profile-btn" title="Profil anzeigen">
              ${Profile.getAvatarEmoji(profile.avatarId)}
            </button>
          </div>
        </header>

        <main class="village-main">
          <div class="village-welcome">
            <span class="welcome-avatar">${Profile.getAvatarEmoji(profile.avatarId)}</span>
            <p>Hallo, <strong>${profile.name}</strong>!<br>Wohin möchtest du heute?</p>
          </div>

          <div class="village-grid">
            ${BUILDINGS.map(renderBuilding).join('')}
          </div>
        </main>
      </div>
    `;

    BUILDINGS.forEach(building => {
      const btn = document.getElementById(`building-${building.id}`);
      if (!btn) return;
      btn.addEventListener('click', () => {
        if (building.active && building.mount) {
          building.mount();
        } else {
          showComingSoon(building.label);
        }
      });
    });

    document.getElementById('profile-btn').addEventListener('click', showProfileModal);

    // Oskar erscheint am unteren Rand des Dorfplatzes
    setTimeout(() => {
      const main = document.querySelector('.village-main');
      if (main) {
        Oskar.show(main, {
          placement: 'inline-right',
          pool:      'village',
          chance:    0.65,
        });
      }
    }, 50);
  }

  function renderBuilding(b) {
    const progressHtml = b.active ? getBuildingProgressBadge(b) : '';
    return `
      <button
        class="building-card${b.active ? '' : ' building-locked'}"
        id="building-${b.id}"
        style="--building-color:${b.color}; --building-bg:${b.bgColor};"
      >
        <div class="building-icon-wrap">
          <span class="building-icon">${b.icon}</span>
        </div>
        <span class="building-label">${b.label}</span>
        ${progressHtml}
        ${b.active ? '' : '<span class="building-soon">Kommt bald</span>'}
      </button>
    `;
  }

  function getBuildingProgressBadge(b) {
    const profile = Storage.getActiveProfile();
    if (!profile) return '';
    const ids = b.exerciseIds || [];
    let totalBest = 0;
    let played = 0;
    ids.forEach(id => {
      const s = Storage.getSessionStats(profile.id, id);
      if (s) { played++; totalBest += s.bestScore; }
    });
    if (played === 0) return '<span class="building-progress building-progress--new">Noch nicht gespielt</span>';
    const avg = totalBest / played;
    const stars = avg >= 9 ? 3 : avg >= 7 ? 2 : 1;
    return `<span class="building-progress">${'⭐'.repeat(stars)}</span>`;
  }

  // ─── Overlays ─────────────────────────────────────────────────────────────

  function showComingSoon(label) {
    const overlay = createOverlay(`
      <div class="modal-icon">🚧</div>
      <h2>${label}</h2>
      <p>Dieses Gebäude wird gerade<br>für dich gebaut. Es kommt bald!</p>
      <button class="btn btn-primary" id="close-modal">Okay!</button>
    `);
    document.getElementById('close-modal').addEventListener('click', () => overlay.remove());
    document.getElementById('close-modal').focus();
  }

  function showProfileModal() {
    const profile = Storage.getActiveProfile();
    const starsToNextLevel = 10 - (profile.stars % 10);
    const progressPct = Math.min(((profile.stars % 10) / 10) * 100, 100);

    const overlay = createOverlay(`
      <div class="modal-avatar">${Profile.getAvatarEmoji(profile.avatarId)}</div>
      <h2>${profile.name}</h2>
      <div class="profile-stats">
        <div class="stat-item">
          <span class="stat-value">⭐ ${profile.stars}</span>
          <span class="stat-label">Sterne</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">🏅 ${profile.level}</span>
          <span class="stat-label">Level</span>
        </div>
      </div>
      <div class="star-progress-wrap">
        <div class="star-progress-label">Nächstes Level in ${starsToNextLevel} Stern${starsToNextLevel === 1 ? '' : 'en'}</div>
        <div class="star-progress-bar">
          <div class="star-progress-fill" style="width:${progressPct}%"></div>
        </div>
      </div>
      <button class="btn btn-primary" id="close-profile">Weiter spielen 🎮</button>
      <button class="btn btn-ghost btn-sm" id="new-profile-btn">Neues Profil erstellen</button>
    `);

    document.getElementById('close-profile').addEventListener('click', () => overlay.remove());
    document.getElementById('new-profile-btn').addEventListener('click', () => {
      overlay.remove();
      Profile.renderSetupScreen();
    });
    document.getElementById('close-profile').focus();
  }

  // Erzeugt ein Overlay-Element und hängt es an den Body
  function createOverlay(innerHtml) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `<div class="modal">${innerHtml}</div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.remove();
    });
    return overlay;
  }

  return { init, showVillage };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
