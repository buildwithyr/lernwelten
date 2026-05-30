/**
 * profile.js
 * Profile creation, selection, and display logic.
 */

const Profile = (() => {
  const AVATARS = [
    { id: 'fox',    emoji: '🦊', label: 'Fuchs' },
    { id: 'owl',    emoji: '🦉', label: 'Eule' },
    { id: 'bear',   emoji: '🐻', label: 'Bär' },
    { id: 'rabbit', emoji: '🐰', label: 'Hase' },
    { id: 'cat',    emoji: '🐱', label: 'Katze' },
    { id: 'dog',    emoji: '🐶', label: 'Hund' },
    { id: 'dragon', emoji: '🐲', label: 'Drache' },
    { id: 'penguin',emoji: '🐧', label: 'Pinguin' },
  ];

  let selectedAvatarId = AVATARS[0].id;

  function createProfile(name, avatarId) {
    const id = 'profile_' + Date.now();
    const profile = {
      id,
      name: name.trim(),
      avatarId: avatarId || AVATARS[0].id,
      stars: 0,
      level: 1,
      createdAt: Date.now(),
      progress: {},
    };
    Storage.saveProfile(profile);
    Storage.setActiveProfileId(id);
    return profile;
  }

  function getAvatarEmoji(avatarId) {
    const a = AVATARS.find(a => a.id === avatarId);
    return a ? a.emoji : '🦊';
  }

  function renderSetupScreen() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen setup-screen">
        <div class="setup-card">
          <div class="setup-logo">🌟</div>
          <h1 class="setup-title">Willkommen in der<br><span>Lernwelt!</span></h1>
          <p class="setup-subtitle">Erstelle dein Profil, um loszulegen.</p>

          <div class="form-group">
            <label for="player-name">Dein Name</label>
            <input
              type="text"
              id="player-name"
              class="name-input"
              placeholder="z.B. Lena oder Max"
              maxlength="20"
              autocomplete="off"
            />
          </div>

          <div class="form-group">
            <label>Wähle deinen Begleiter</label>
            <div class="avatar-grid">
              ${AVATARS.map(a => `
                <button
                  class="avatar-btn ${a.id === selectedAvatarId ? 'selected' : ''}"
                  data-avatar="${a.id}"
                  type="button"
                  title="${a.label}"
                >
                  <span class="avatar-emoji">${a.emoji}</span>
                  <span class="avatar-label">${a.label}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <button class="btn btn-primary btn-large" id="start-btn" disabled>
            Abenteuer starten! 🚀
          </button>
        </div>
      </div>
    `;

    const nameInput = document.getElementById('player-name');
    const startBtn = document.getElementById('start-btn');

    nameInput.addEventListener('input', () => {
      startBtn.disabled = nameInput.value.trim().length < 2;
    });

    nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !startBtn.disabled) startBtn.click();
    });

    app.querySelectorAll('.avatar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedAvatarId = btn.dataset.avatar;
        app.querySelectorAll('.avatar-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    startBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (name.length < 2) return;
      createProfile(name, selectedAvatarId);
      App.showVillage();
    });

    nameInput.focus();
  }

  return {
    AVATARS,
    createProfile,
    getAvatarEmoji,
    renderSetupScreen,
  };
})();
