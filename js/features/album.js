/**
 * features/album.js
 * Oskars Sammelalbum.
 *
 * Motive werden nur über Zähler freigeschaltet, die nie kleiner werden.
 * Eine Lernpause kostet also nichts (Bericht, Abschnitt 9).
 */

const Album = (() => {

  function open() {
    const profile = Storage.getActiveProfile();
    if (!profile) return;
    render(profile);
  }

  function render(profile) {
    const collections = Rewards.albumState(profile);
    const owned = Util.sum(collections.map(c => c.owned));
    const total = Util.sum(collections.map(c => c.total));

    UI.render(`
      <div class="screen album-screen">
        ${UI.header({ title: 'Sammelalbum', icon: '🖼️', backLabel: 'Zurück zum Dorfplatz' })}
        <main class="album-main">
          <p class="album-intro">Du hast <strong>${owned} von ${total}</strong> Motiven gesammelt.
            Neue Motive gibt es fürs Üben — verlieren kannst du sie nie.</p>

          ${collections.map(c => `
            <section class="album-collection">
              <h2 class="ac-title"><span aria-hidden="true">${c.icon}</span>
                ${Util.escapeHtml(c.title)}
                <span class="ac-count">${c.owned}/${c.total}</span></h2>
              <div class="ac-grid">
                ${c.stickers.map(s => s.owned ? `
                  <div class="sticker sticker--owned">
                    <span class="st-emoji" aria-hidden="true">${s.emoji}</span>
                    <span class="st-label">${Util.escapeHtml(s.label)}</span>
                  </div>` : `
                  <div class="sticker sticker--locked" title="${Util.escapeAttr(s.hint)}">
                    <span class="st-emoji" aria-hidden="true">❔</span>
                    <span class="st-label">${Util.escapeHtml(s.hint || 'Noch gesperrt')}</span>
                  </div>`).join('')}
              </div>
            </section>`).join('')}
        </main>
      </div>`);

    UI.on('#back-btn', 'click', () => App.showVillage());

    Timers.after(60, () => {
      const main = UI.$('.album-main');
      if (main && typeof Oskar !== 'undefined') {
        Oskar.show(main, { placement: 'inline-right', pool: 'village', chance: 0.5 });
      }
    });
  }

  return { open };
})();
