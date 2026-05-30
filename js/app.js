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
  // Gebäude-Konfiguration.
  // active: true  → Gebäude ist betretbar
  // active: false → Platzhalter (kommt bald)
  const BUILDINGS = [
    {
      id: 'math',
      label: 'Rechen-werkstatt',
      icon: '🔨',
      color: '#F4A435',
      bgColor: '#FFF3DC',
      active: true,
      mount: () => MathModule.mount(),
    },
    {
      id: 'reading',
      label: 'Bücherhaus',
      icon: '📚',
      color: '#6DB68A',
      bgColor: '#E8F5EE',
      active: false,
      mount: null,
    },
    {
      id: 'science',
      label: 'Forscher-labor',
      icon: '🔬',
      color: '#7EB8D4',
      bgColor: '#E3F2F9',
      active: false,
      mount: null,
    },
    {
      id: 'puzzles',
      label: 'Rätsel-höhle',
      icon: '🗝️',
      color: '#B07EC8',
      bgColor: '#F3EAF8',
      active: false,
      mount: null,
    },
  ];

  // ---------- Bootstrap ----------

  function init() {
    const profile = Storage.getActiveProfile();
    if (!profile) {
      Profile.renderSetupScreen();
    } else {
      showVillage();
    }
  }

  // ---------- Village / Dorfplatz ----------

  function showVillage() {
    const profile = Storage.getActiveProfile();
    const app = document.getElementById('app');

    app.innerHTML = `
      <div class="screen village-screen">
        ${renderVillageHeader(profile)}
        <main class="village-main">
          <div class="village-welcome">
            <span class="welcome-avatar">${Profile.getAvatarEmoji(profile.avatarId)}</span>
            <p>Hallo, <strong>${profile.name}</strong>! Wohin möchtest du heute?</p>
          </div>

          <div class="village-grid">
            ${BUILDINGS.map(b => renderBuilding(b)).join('')}
          </div>

          <div class="village-path-art" aria-hidden="true">
            ${renderPathArt()}
          </div>
        </main>
      </div>
    `;

    // Building click handlers
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

    // Profile button
    document.getElementById('profile-btn').addEventListener('click', showProfileModal);
  }

  function renderVillageHeader(profile) {
    return `
      <header class="village-header">
        <div class="village-title">
          <span class="village-title-icon">🏘️</span>
          <span>Lernwelt</span>
        </div>
        <div class="village-header-right">
          <div class="star-counter">
            <span>⭐</span>
            <span>${profile.stars}</span>
          </div>
          <button class="btn btn-ghost avatar-btn-header" id="profile-btn" title="Profil">
            ${Profile.getAvatarEmoji(profile.avatarId)}
          </button>
        </div>
      </header>
    `;
  }

  function renderBuilding(b) {
    const locked = !b.active;
    return `
      <button
        class="building-card ${locked ? 'building-locked' : ''}"
        id="building-${b.id}"
        style="--building-color:${b.color}; --building-bg:${b.bgColor};"
        ${locked ? 'aria-label="' + b.label + ' – kommt bald"' : ''}
      >
        <div class="building-icon-wrap">
          <span class="building-icon">${b.icon}</span>
        </div>
        <span class="building-label">${b.label}</span>
        ${locked ? '<span class="building-soon">Kommt bald</span>' : ''}
      </button>
    `;
  }

  function renderPathArt() {
    // Simple decorative SVG path connecting the buildings, purely visual
    return `
      <svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg" class="path-svg" aria-hidden="true">
        <path d="M50,60 Q100,20 200,60 Q300,100 350,60" stroke="#D4B896" stroke-width="6"
              fill="none" stroke-linecap="round" stroke-dasharray="12 8" opacity="0.5"/>
        <circle cx="50"  cy="60" r="8" fill="#D4B896" opacity="0.4"/>
        <circle cx="200" cy="60" r="8" fill="#D4B896" opacity="0.4"/>
        <circle cx="350" cy="60" r="8" fill="#D4B896" opacity="0.4"/>
      </svg>
    `;
  }

  // ---------- Coming Soon Overlay ----------

  function showComingSoon(label) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-icon">🚧</div>
        <h2>${label}</h2>
        <p>Dieses Gebäude wird gerade gebaut.<br>Es kommt bald!</p>
        <button class="btn btn-primary" id="close-modal">Okay!</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => {
      if (e.target === overlay || e.target.id === 'close-modal') {
        overlay.remove();
      }
    });
    document.getElementById('close-modal').focus();
  }

  // ---------- Profile Modal ----------

  function showProfileModal() {
    const profile = Storage.getActiveProfile();
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="modal">
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
          <div class="star-progress-label">Nächstes Level</div>
          <div class="star-progress-bar">
            <div class="star-progress-fill" style="width:${Math.min((profile.stars % 10) * 10, 100)}%"></div>
          </div>
          <div class="star-progress-hint">${profile.stars % 10}/10 Sterne</div>
        </div>
        <button class="btn btn-primary" id="close-profile">Weiter spielen 🎮</button>
        <button class="btn btn-ghost btn-sm" id="new-profile-btn">Neues Profil erstellen</button>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.remove();
    });
    document.getElementById('close-profile').addEventListener('click', () => overlay.remove());
    document.getElementById('new-profile-btn').addEventListener('click', () => {
      overlay.remove();
      Profile.renderSetupScreen();
    });
  }

  return { init, showVillage };
})();

// Start the app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
