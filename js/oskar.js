/** Local animated Oskar. Uses screen-scoped Timers; no tracking or remote requests. */
const Oskar = (() => {

  // ─── Figuren-Registry ─────────────────────────────────────────────────────
  // Jede Figur hat eigene Posen und eigene Nachrichten-Pools.
  // null-Einträge in den Pools = die Figur erscheint still (ruhige Begleitung).
  const CHARACTERS = {

    oskar: {
      poses: {
        default:  'assets/oskar-pet.png',
      },
      messages: {
        greeting: [
          'Hallo! Ich bin Oskar! 🐶',
          'Schön, dich zu sehen!',
          'Bereit für ein Abenteuer?',
          'Willkommen in der Lernwelt!',
        ],
        village: [
          'Wohin geht es heute?',
          'Welches Gebäude besuchst du?',
          'Toll, dass du da bist!',
          null,
          null,
        ],
        workshop: [
          'Lass uns üben!',
          'Das schaffst du bestimmt!',
          'Ich bin gespannt!',
          null,
          null,
        ],
        taskIntro: [
          null,
          null,
          null,
          'Konzentriere dich!',
          'Du schaffst das!',
        ],
        correct: [
          'Super gemacht! ⭐',
          'Toll gelöst! 🌟',
          'Sehr gut! ✨',
          'Weiter so! 🎉',
          'Fantastisch! 🏆',
          'Klasse! 👏',
          'Prima! 🎈',
          'Ausgezeichnet! 💫',
          'Das war richtig stark!',
          'Du wirst immer besser!',
          'Oskar ist stolz auf dich! 🐶',
        ],
        words: [
          'Wörter machen Spaß! 📖',
          'Du lernst so viel!',
          'Buchstaben sind toll! 🔤',
          null,
          null,
        ],
        puzzles: [
          'Zeit zum Rätseln! 🗝️',
          'Denk genau nach!',
          'Das schaffst du! 🧠',
          null,
          null,
        ],
        science: [
          'Lass uns forschen! 🔬',
          'Was wirst du heute lernen?',
          'Wissen macht schlau! 🌍',
          null,
          null,
        ],
      },
    },

  };

  // Es gibt aktuell nur eine Figur (Oskar) für beide Klassenstufen.
  function _active() {
    return CHARACTERS.oskar;
  }

  // Rows of the local v2 pet atlas. Reactions run briefly, never endlessly.
  const ATLAS = 'assets/oskar-sprites.webp';
  const MOTIONS = {
    default: { row: 0, frames: 6, ms: 180 },
    wave: { row: 3, frames: 4, ms: 170 },
    happy: { row: 4, frames: 5, ms: 160 },
    encourage: { row: 6, frames: 6, ms: 160 },
    thinking: { row: 8, frames: 6, ms: 180 },
    review: { row: 8, frames: 6, ms: 180 },
    runRight: { row: 1, frames: 8, ms: 110 },
    runLeft: { row: 2, frames: 8, ms: 110 },
    look: { row: 9, frames: 16, ms: 160 },
  };
  let _el = null;
  let _cancelMotion = null;
  let _cancelAmbient = null;
  let _ambient = false;
  let _idleIndex = 0;
  let _onVisibility = null;
  let _onMotionPreference = null;
  let _media = null;
  let _atlas = null;
  let _motion = 'default';
  let _animate = true;

  function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)] || null; }
  function _pickWithChance(pool, chance) {
    return Math.random() > chance ? null : _pick(_active().messages[pool] || []);
  }
  function _reduced() { return typeof UI !== 'undefined' && UI.prefersReducedMotion(); }
  function _stopMotion() {
    if (_cancelMotion) _cancelMotion();
    if (_cancelAmbient) _cancelAmbient();
    _cancelMotion = null;
    _cancelAmbient = null;
  }
  function _frame(row, frame) {
    if (!_el) return;
    const sprite = _el.querySelector('.oskar-sprite');
    sprite.style.backgroundPosition = `${frame * 100 / 7}% ${row * 10}%`;
    sprite.dataset.row = String(row);
    sprite.dataset.frame = String(frame);
  }
  function _play(pose, animate) {
    _stopMotion();
    _motion = MOTIONS[pose] ? pose : 'default';
    _animate = animate;
    if (!_el) return;
    _el.dataset.pose = _motion;
    // Reduced motion keeps the exact resting pose; feedback text still works.
    if (_reduced() || !animate || document.hidden || !_atlas || !_atlas.complete || !_atlas.naturalWidth) {
      _frame(0, 0); return;
    }
    const motion = MOTIONS[_motion];
    let frame = 0;
    _frame(motion.row, frame);
    _cancelMotion = Timers.every(motion.ms, () => {
      if (!_el || !_el.isConnected) { _stopMotion(); return; }
      frame++;
      if (frame >= motion.frames) {
        _stopMotion();
        _frame(0, 0); // A calm, planted dog after each short reaction.
        _motion = 'default';
        _animate = _ambient;
        _el.dataset.pose = 'default';
        if (_ambient) {
          const idle = ['default', 'look', 'runRight', 'runLeft'];
          _cancelAmbient = Timers.after(6500, () => _play(idle[_idleIndex++ % idle.length], true));
        }
        return;
      }
      _frame(motion.row + Math.floor(frame / 8), frame % 8);
    });
  }
  function _ready() {
    if (_el && _atlas && _atlas.complete && _atlas.naturalWidth) {
      _el.querySelector('.oskar-sprite').classList.add('oskar-sprite--ready');
      _play(_motion, _animate);
    }
  }
  function _build(placement, onHelp) {
    const el = document.createElement('div');
    el.className = `oskar-companion oskar--${placement}`;
    // Only the help button is interactive. Decorative artwork stays hidden.
    if (!onHelp) el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
      <div class="oskar-bubble" aria-hidden="true"></div>
      ${onHelp ? '<button class="oskar-help" type="button" aria-label="Oskars nächsten Tipp anzeigen">' : ''}
      <span class="oskar-sprite" aria-hidden="true">
        <img class="oskar-img" src="assets/oskar-pet.png" alt="" draggable="false" />
      </span>
      ${onHelp ? '<span class="oskar-help-label">Frag Oskar</span></button>' : ''}`;
    if (onHelp) el.querySelector('.oskar-help').addEventListener('click', onHelp);
    return el;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Zeigt Oskar in einem Container.
   *
   * @param {HTMLElement} container - Ziel-Element, an das die Figur angehängt wird
   * @param {object}      opts
   *   placement  {string}  CSS-Modifizierer, z.B. 'inline-right', 'setup-peek'
   *   pose       {string}  Schlüssel aus den Posen der aktiven Figur
   *   pool       {string}  Schlüssel aus den Nachrichten der aktiven Figur (null = immer still)
   *   chance     {number}  Wahrscheinlichkeit für Sprechblase (0–1, default 1)
   *   message    {string|null}  Explizite Nachricht (überschreibt pool + chance)
   */
  function show(container, opts = {}) {
    const {
      placement = 'inline-right',
      pose      = 'default',
      pool      = null,
      chance    = 1,
      message   = undefined,  // undefined = pool-Auswahl, null = erzwingt Stille
      onHelp    = null,
      animate   = true,
      ambient   = placement !== 'task-companion',
    } = opts;

    remove(); // altes Element sauber entfernen
    _ambient = ambient && animate;
    _idleIndex = 0;

    const el = _build(placement, onHelp);
    _el = el;
    if (!container) { _el = null; return; }
    container.appendChild(el);
    if (!_atlas) {
      _atlas = new Image();
      _atlas.addEventListener('load', _ready);
      _atlas.src = ATLAS;
    }
    _ready();
    _onVisibility = () => {
      if (document.hidden) _stopMotion();
      else _play(_motion, _animate);
    };
    document.addEventListener('visibilitychange', _onVisibility);
    _media = window.matchMedia('(prefers-reduced-motion: reduce)');
    _onMotionPreference = () => _play(_motion, _animate);
    _media.addEventListener('change', _onMotionPreference);
    _play(pose, animate);

    // Nachricht bestimmen
    let text;
    if (message !== undefined) {
      text = message;
    } else if (pool) {
      text = _pickWithChance(pool, chance);
    } else {
      text = null;
    }

    if (text) {
      _showBubble(el, text);
    } else {
      _hideBubble(el);
    }
  }

  function _showBubble(el, text) {
    const bubble = el.querySelector('.oskar-bubble');
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.add('oskar-bubble--visible');
  }

  function _hideBubble(el) {
    const bubble = el.querySelector('.oskar-bubble');
    if (bubble) bubble.classList.remove('oskar-bubble--visible');
  }

  /** Sprechblase aktualisieren (die Figur bleibt, wo sie ist). */
  function say(text) {
    if (!_el) return;
    _showBubble(_el, text);
  }

  /** Sprechblase ausblenden — die Figur bleibt sichtbar, schweigt. */
  function silence() {
    if (!_el) return;
    _hideBubble(_el);
  }

  /** Change the pose without replacing focused controls or restarting a task. */
  function react(pose, text) {
    _play(pose, true);
    if (text) say(text);
    else silence();
  }
  function setHelpEnabled(enabled) {
    const button = _el && _el.querySelector('.oskar-help');
    if (button) button.disabled = !enabled;
  }

  /** Figur vollständig aus dem DOM entfernen. */
  function remove() {
    _stopMotion();
    _ambient = false;
    if (_onVisibility) document.removeEventListener('visibilitychange', _onVisibility);
    if (_media && _onMotionPreference) _media.removeEventListener('change', _onMotionPreference);
    _onVisibility = _onMotionPreference = _media = null;
    if (_el) {
      if (_el.parentNode) _el.parentNode.removeChild(_el);
      _el = null;
    }
  }

  return {
    show, say, silence, remove, react, setHelpEnabled,
    // Getter statt statischer Werte: einige Aufrufstellen greifen direkt auf
    // Oskar.MESSAGES/Oskar.POSES zu (z.B. `randomFrom(Oskar.MESSAGES.correct)`)
    // — das muss live die aktuell aktive Figur widerspiegeln.
    get MESSAGES() { return _active().messages; },
    get POSES() { return _active().poses; },
  };
})();
