/**
 * oskar.js
 * Oskar — das Maskottchen der Lernwelt.
 *
 * Architektur-Überblick:
 *   POSES       — Registry aller Oskar-Bilder. Neue Posen hier eintragen.
 *   MESSAGES    — Nachrichten-Pools nach Kontext. Null = Oskar erscheint still.
 *   Oskar.show  — Zeigt Oskar in einem Container mit Placement und optionaler Sprechblase.
 *   Oskar.say   — Aktualisiert die Sprechblase ohne Neupositionierung.
 *   Oskar.silence — Versteckt die Sprechblase, Oskar bleibt sichtbar.
 *   Oskar.remove  — Entfernt Oskar komplett aus dem DOM.
 *
 * Neue Pose hinzufügen:
 *   1. PNG in assets/ ablegen, z.B. assets/oskar-happy.png
 *   2. Eintrag in POSES ergänzen: happy: 'assets/oskar-happy.png'
 *   3. Im Aufruf: Oskar.show(container, { pose: 'happy', ... })
 */

const Oskar = (() => {

  // ─── Pose-Registry ────────────────────────────────────────────────────────
  // Weitere Posen: Datei in assets/ ablegen und hier eintragen.
  const POSES = {
    default:  'assets/oskar-cartoon.png',
    // happy:    'assets/oskar-happy.png',    // zukünftig: für Erfolgserlebnisse
    // thinking: 'assets/oskar-think.png',    // zukünftig: für Aufgabenintro
    // wave:     'assets/oskar-wave.png',     // zukünftig: für Begrüßung
  };

  // ─── Nachrichten-Pools ────────────────────────────────────────────────────
  // null-Einträge = Oskar erscheint still (ruhige Begleitung).
  // Mehr null = seltener sprechend (weniger aufdringlich).
  const MESSAGES = {
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
      'Du bist großartig! 🌈',
      'Prima! 🎈',
      'Ausgezeichnet! 💫',
      'Das war richtig stark!',
      'Du wirst immer besser!',
    ],
  };

  // ─── Interner State ───────────────────────────────────────────────────────
  let _el = null; // aktuell montiertes DOM-Element

  // ─── Hilfsfunktionen ──────────────────────────────────────────────────────

  function _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Wählt eine Nachricht mit Wahrscheinlichkeit `chance`.
  // null-Einträge im Pool zählen als "Oskar bleibt still".
  function _pickWithChance(pool, chance) {
    if (Math.random() > chance) return null;
    return _pick(MESSAGES[pool] || []);
  }

  // ─── DOM ──────────────────────────────────────────────────────────────────

  function _build(placement, pose) {
    const el = document.createElement('div');
    el.className = `oskar-companion oskar--${placement}`;
    el.setAttribute('aria-hidden', 'true');

    const imgSrc = POSES[pose] || POSES.default;

    el.innerHTML = `
      <div class="oskar-bubble" id="oskar-bubble"></div>
      <img
        class="oskar-img"
        src="${imgSrc}"
        alt=""
        draggable="false"
      />
    `;

    // Wenn das PNG noch nicht vorhanden ist, Oskar graceful ausblenden
    el.querySelector('.oskar-img').addEventListener('error', () => {
      el.style.display = 'none';
    });

    return el;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Zeigt Oskar in einem Container.
   *
   * @param {HTMLElement} container - Ziel-Element, an das Oskar angehängt wird
   * @param {object}      opts
   *   placement  {string}  CSS-Modifizierer, z.B. 'inline-right', 'setup-peek'
   *   pose       {string}  Schlüssel aus POSES
   *   pool       {string}  Schlüssel aus MESSAGES (null = immer still)
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
    } = opts;

    remove(); // altes Element sauber entfernen

    const el = _build(placement, pose);
    _el = el;
    container.appendChild(el);

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
    const bubble = el.querySelector('#oskar-bubble');
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.add('oskar-bubble--visible');
  }

  function _hideBubble(el) {
    const bubble = el.querySelector('#oskar-bubble');
    if (bubble) bubble.classList.remove('oskar-bubble--visible');
  }

  /** Sprechblase aktualisieren (Oskar bleibt wo er ist). */
  function say(text) {
    if (!_el) return;
    _showBubble(_el, text);
  }

  /** Sprechblase ausblenden — Oskar bleibt sichtbar, schweigt. */
  function silence() {
    if (!_el) return;
    _hideBubble(_el);
  }

  /** Oskar vollständig aus dem DOM entfernen. */
  function remove() {
    if (_el) {
      if (_el.parentNode) _el.parentNode.removeChild(_el);
      _el = null;
    }
  }

  return { show, say, silence, remove, MESSAGES, POSES };
})();
