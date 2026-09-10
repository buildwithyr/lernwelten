/**
 * features/mirror.js
 * Spiegelatelier — Symmetrie zum Anfassen.
 *
 * Zwei Betriebsarten:
 *   Rätsel  Vorgegebenes Bild an der Mittellinie spiegeln (wird bewertet,
 *           Lernziel "Spiegeln").
 *   Malen   Freies Bauen: links tippen, rechts entsteht das Spiegelbild.
 *           Wird nicht bewertet — es gibt hier kein Richtig oder Falsch.
 */

const Mirror = (() => {

  const SIZE = 5;
  const AXIS = 2;

  function open() {
    UI.render(`
      <div class="screen mirror-screen" style="--accent:#E07A3E">
        ${UI.header({ title: 'Spiegelatelier', icon: '🪞', backLabel: 'Zurück' })}
        <main class="mirror-main">
          <p class="menu-intro">Was möchtest du machen?</p>
          <div class="exercise-grid">
            <button class="exercise-card" id="mode-puzzle" type="button">
              <span class="ex-icon" aria-hidden="true">🧩</span>
              <span class="ex-title">Spiegel-Rätsel</span>
              <span class="ex-desc">Ergänze das Spiegelbild — 5 Aufgaben</span>
            </button>
            <button class="exercise-card" id="mode-draw" type="button">
              <span class="ex-icon" aria-hidden="true">🎨</span>
              <span class="ex-title">Selbst spiegeln</span>
              <span class="ex-desc">Male links, rechts entsteht das Spiegelbild</span>
            </button>
          </div>
        </main>
      </div>`);

    UI.on('#back-btn', 'click', () => Workshop.open('logic'));
    UI.on('#mode-puzzle', 'click', startPuzzle);
    UI.on('#mode-draw', 'click', openStudio);
  }

  function startPuzzle() {
    Session.start({
      mode: 'free',
      topicId: 'p.spiegelraster',
      length: 5,
      title: 'Spiegel-Rätsel',
      icon: '🪞',
      color: '#E07A3E',
      onExit: open,
    });
  }

  // ─── Freies Spiegeln ──────────────────────────────────────────────────────

  function openStudio() {
    const left = new Set();

    function gridHtml() {
      const cells = [];
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          const isAxis = c === AXIS;
          const mirroredFrom = c > AXIS ? `${r},${2 * AXIS - c}` : null;
          const on = c < AXIS ? left.has(`${r},${c}`)
                   : (mirroredFrom ? left.has(mirroredFrom) : false);
          const cls = ['mg-cell'];
          if (isAxis) cls.push('mg-cell--axis');
          if (on) cls.push('mg-cell--on');
          if (c < AXIS) {
            cls.push('mg-cell--clickable');
            cells.push(`<button type="button" class="${cls.join(' ')}" data-r="${r}" data-c="${c}"
              aria-pressed="${on}" aria-label="Feld Zeile ${r + 1}, Spalte ${c + 1}"></button>`);
          } else {
            cells.push(`<span class="${cls.join(' ')}"></span>`);
          }
        }
      }
      return `<div class="mirror-grid" style="--mg-size:${SIZE}">${cells.join('')}</div>`;
    }

    function draw() {
      UI.render(`
        <div class="screen mirror-screen" style="--accent:#E07A3E">
          ${UI.header({ title: 'Selbst spiegeln', icon: '🎨', backLabel: 'Zurück' })}
          <main class="mirror-main">
            <p class="menu-intro">Tippe links auf die Felder. Rechts entsteht das Spiegelbild von selbst.</p>
            <div id="studio">${gridHtml()}</div>
            <div class="mirror-actions">
              <button class="btn btn-ghost" id="clear-btn" type="button">🧽 Alles löschen</button>
              <button class="btn btn-primary" id="back-studio" type="button">Fertig</button>
            </div>
            <p class="mirror-note">Hier gibt es kein Richtig oder Falsch — probier ruhig aus.</p>
          </main>
        </div>`);

      UI.on('#back-btn', 'click', open);
      UI.on('#back-studio', 'click', open);
      UI.on('#clear-btn', 'click', () => { left.clear(); draw(); });
      UI.onAll('.mg-cell--clickable', 'click', e => {
        const key = `${e.currentTarget.dataset.r},${e.currentTarget.dataset.c}`;
        if (left.has(key)) left.delete(key); else left.add(key);
        draw();   // vollständig neu zeichnen — keine doppelten Ereignisse
      });
    }

    draw();
  }

  return { open, openStudio };
})();
