/**
 * ui/profile.js
 * Profil anlegen und Profilkarte auf dem Dorfplatz.
 *
 * Der Name wird ausschließlich als Text ausgegeben (Util.escapeHtml) —
 * nie roh in ein Template eingesetzt (Bericht, Abschnitt 3).
 */

const ProfileUI = (() => {

  const AVATARS = [
    { id: 'fox',     emoji: '🦊', label: 'Fuchs' },
    { id: 'owl',     emoji: '🦉', label: 'Eule' },
    { id: 'bear',    emoji: '🐻', label: 'Bär' },
    { id: 'rabbit',  emoji: '🐰', label: 'Hase' },
    { id: 'cat',     emoji: '🐱', label: 'Katze' },
    { id: 'dog',     emoji: '🐶', label: 'Hund' },
    { id: 'dragon',  emoji: '🐲', label: 'Drache' },
    { id: 'penguin', emoji: '🐧', label: 'Pinguin' },
    { id: 'horse',   emoji: '🐴', label: 'Pferd' },
    { id: 'unicorn', emoji: '🦄', label: 'Einhorn' },
  ];

  let selectedAvatarId = AVATARS[0].id;

  function avatarEmoji(id) {
    const a = AVATARS.find(x => x.id === id);
    return a ? a.emoji : '🦊';
  }

  /**
   * Anlegen eines Profils.
   * @param {object} opts { allowCancel, onCancel, grade }
   */
  function renderSetup(opts) {
    const o = opts || {};
    const grade = o.grade || Storage.getGrade() || 1;

    UI.render(`
      <div class="screen setup-screen">
        <div class="setup-card">
          <div class="setup-logo" aria-hidden="true">🌟</div>
          <h1 class="setup-title">Willkommen in der<br><span>Lernwelt!</span></h1>
          <p class="setup-subtitle">Wie heißt du? Such dir ein Tier aus.</p>

          <div class="form-group">
            <label for="player-name">Dein Name</label>
            <input type="text" id="player-name" class="name-input"
                   placeholder="z.B. Luisa" maxlength="24" autocomplete="off"
                   autocapitalize="words" />
          </div>

          <div class="form-group">
            <span class="form-legend" id="avatar-legend">Such dir ein Tier aus</span>
            <div class="avatar-grid" role="radiogroup" aria-labelledby="avatar-legend">
              ${AVATARS.map(a => `
                <button class="avatar-btn ${a.id === selectedAvatarId ? 'selected' : ''}"
                        data-avatar="${a.id}" type="button" role="radio"
                        aria-checked="${a.id === selectedAvatarId}">
                  <span class="avatar-emoji" aria-hidden="true">${a.emoji}</span>
                  <span class="avatar-label">${a.label}</span>
                </button>`).join('')}
            </div>
          </div>

          <div class="form-group">
            <span class="form-legend" id="grade-legend">Für welche Klasse?</span>
            <div class="session-mode" role="radiogroup" aria-labelledby="grade-legend">
              <button class="session-mode-btn${grade === 1 ? ' selected' : ''}" data-grade="1"
                      type="button" role="radio" aria-checked="${grade === 1}">1. Klasse</button>
              <button class="session-mode-btn${grade === 2 ? ' selected' : ''}" data-grade="2"
                      type="button" role="radio" aria-checked="${grade === 2}">2. Klasse</button>
            </div>
          </div>

          <button class="btn btn-primary btn-large" id="start-btn" disabled>Los geht's! 🚀</button>
          ${o.allowCancel ? '<button class="btn btn-ghost btn-sm" id="cancel-btn" type="button">Abbrechen</button>' : ''}
        </div>
      </div>`);

    let chosenGrade = grade;
    const nameInput = UI.$('#player-name');
    const startBtn = UI.$('#start-btn');

    nameInput.addEventListener('input', () => {
      startBtn.disabled = nameInput.value.trim().length < 2;
    });
    nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !startBtn.disabled) startBtn.click();
    });

    UI.onAll('.avatar-btn', 'click', e => {
      selectedAvatarId = e.currentTarget.dataset.avatar;
      UI.$$('.avatar-btn').forEach(b => {
        const on = b === e.currentTarget;
        b.classList.toggle('selected', on);
        b.setAttribute('aria-checked', String(on));
      });
    });

    UI.onAll('[data-grade]', 'click', e => {
      chosenGrade = Number(e.currentTarget.dataset.grade) === 2 ? 2 : 1;
      UI.$$('[data-grade]').forEach(b => {
        const on = b === e.currentTarget;
        b.classList.toggle('selected', on);
        b.setAttribute('aria-checked', String(on));
      });
    });

    startBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (name.length < 2) return;
      const profile = Storage.newProfile(name, selectedAvatarId, chosenGrade);
      if (!Storage.saveProfile(profile)) {
        UI.showStorageProblem(Storage.getLastError());
        return;
      }
      Storage.setActiveProfileId(profile.id);
      Storage.setGrade(chosenGrade);
      App.showVillage();
    });

    if (o.allowCancel) UI.on('#cancel-btn', 'click', () => o.onCancel && o.onCancel());

    Timers.after(60, () => {
      const screen = UI.$('.setup-screen');
      if (screen && typeof Oskar !== 'undefined') {
        Oskar.show(screen, { placement: 'setup-peek', pool: 'greeting', chance: 1 });
      }
    });
  }

  /** Profilkarte vom Dorfplatz aus. */
  function openCard() {
    const p = Storage.getActiveProfile();
    if (!p) return;
    const toNext = 10 - (p.stars % 10);
    const pct = Math.min(((p.stars % 10) / 10) * 100, 100);
    const album = Rewards.albumState(p);
    const owned = Util.sum(album.map(c => c.owned));
    const total = Util.sum(album.map(c => c.total));

    const ov = UI.overlay(`
      <div class="modal-avatar" aria-hidden="true">${avatarEmoji(p.avatarId)}</div>
      <h2>${Util.escapeHtml(p.name)}</h2>
      <div class="profile-stats">
        <div class="stat-item"><span class="stat-value">⭐ ${p.stars}</span><span class="stat-label">Sterne</span></div>
        <div class="stat-item"><span class="stat-value">🏅 ${p.level}</span><span class="stat-label">Level</span></div>
        <div class="stat-item"><span class="stat-value">🖼️ ${owned}/${total}</span><span class="stat-label">Album</span></div>
      </div>
      <div class="star-progress-wrap">
        <div class="star-progress-label">Noch ${toNext} ${Util.plural(toNext, 'Stern', 'Sterne')} bis Level ${p.level + 1}</div>
        <div class="star-progress-bar"><div class="star-progress-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="modal-actions modal-actions--stack">
        <button class="btn btn-primary" data-act="close" type="button">Weiterspielen 🎮</button>
        <button class="btn btn-ghost" data-act="album" type="button">🖼️ Sammelalbum</button>
        <button class="btn btn-ghost" data-act="parents" type="button">👋 Elternbereich</button>
      </div>`, { label: 'Profil ' + p.name });

    ov.modal.querySelector('[data-act="close"]').addEventListener('click', () => ov.close());
    ov.modal.querySelector('[data-act="album"]').addEventListener('click', () => { ov.close(); Album.open(); });
    ov.modal.querySelector('[data-act="parents"]').addEventListener('click', () => { ov.close(); Parents.open(); });
  }

  return { AVATARS, avatarEmoji, renderSetup, openCard };
})();
