/**
 * oskar.js
 * Maskottchen der Lernwelt — Oskar (Klasse 1) und Samson (Klasse 2).
 *
 * Architektur-Überblick:
 *   CHARACTERS  — Registry aller Maskottchen (Posen + Nachrichten-Pools je Figur).
 *   _active()   — wählt die aktuelle Figur anhand Storage.getGrade().
 *   Oskar.show  — Zeigt das aktive Maskottchen in einem Container mit Placement
 *                 und optionaler Sprechblase.
 *   Oskar.say   — Aktualisiert die Sprechblase ohne Neupositionierung.
 *   Oskar.silence — Versteckt die Sprechblase, das Maskottchen bleibt sichtbar.
 *   Oskar.remove  — Entfernt das Maskottchen komplett aus dem DOM.
 *
 * Der Modulname "Oskar" bleibt aus Kompatibilitätsgründen bestehen (alle
 * Aufrufstellen in app.js/profile.js/modules/*.js nutzen `Oskar.show(...)`
 * unverändert) — welche Figur tatsächlich erscheint, entscheidet sich
 * intern über die aktuelle Klassenstufe.
 *
 * Neue Pose für eine Figur hinzufügen:
 *   1. PNG in assets/ ablegen, z.B. assets/oskar-happy.png
 *   2. Eintrag in CHARACTERS.<figur>.poses ergänzen: happy: 'assets/oskar-happy.png'
 *   3. Im Aufruf: Oskar.show(container, { pose: 'happy', ... })
 */

const Oskar = (() => {

  // ─── Figuren-Registry ─────────────────────────────────────────────────────
  // Jede Figur hat eigene Posen und eigene Nachrichten-Pools.
  // null-Einträge in den Pools = die Figur erscheint still (ruhige Begleitung).
  const CHARACTERS = {

    oskar: {
      poses: {
        default:  'assets/oskar-cartoon.png',
        // happy:    'assets/oskar-happy.png',    // zukünftig: für Erfolgserlebnisse
        // thinking: 'assets/oskar-think.png',    // zukünftig: für Aufgabenintro
        // wave:     'assets/oskar-wave.png',     // zukünftig: für Begrüßung
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
          'Du bist großartig! 🌈',
          'Prima! 🎈',
          'Ausgezeichnet! 💫',
          'Das war richtig stark!',
          'Du wirst immer besser!',
          'Oskar ist stolz auf dich! 🐶',
          'Heute warst du richtig schlau! 🧠',
          '10 von 10 – perfekt! 🏆',
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

    samson: {
      poses: {
        default: 'assets/samson-cartoon.png',
      },
      messages: {
        greeting: [
          'Hallo! Ich bin Samson! 🐱',
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
          'Samson ist stolz auf dich! 🐱',
          'Heute warst du richtig schlau! 🧠',
          '10 von 10 – perfekt! 🏆',
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

  // Wählt die aktuell aktive Figur anhand der Klassenstufe.
  // Storage ist zur Ladezeit von oskar.js bereits verfügbar (siehe
  // Ladereihenfolge in index.html), die Prüfung schützt trotzdem defensiv.
  function _active() {
    const grade = (typeof Storage !== 'undefined' && Storage.getGrade) ? Storage.getGrade() : 1;
    return grade === 2 ? CHARACTERS.samson : CHARACTERS.oskar;
  }

  // ─── Interner State ───────────────────────────────────────────────────────
  let _el = null; // aktuell montiertes DOM-Element

  // ─── Hilfsfunktionen ──────────────────────────────────────────────────────

  function _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Wählt eine Nachricht mit Wahrscheinlichkeit `chance`.
  // null-Einträge im Pool zählen als "die Figur bleibt still".
  function _pickWithChance(pool, chance) {
    if (Math.random() > chance) return null;
    return _pick(_active().messages[pool] || []);
  }

  // ─── DOM ──────────────────────────────────────────────────────────────────

  function _build(placement, pose) {
    const el = document.createElement('div');
    el.className = `oskar-companion oskar--${placement}`;
    el.setAttribute('aria-hidden', 'true');

    const poses = _active().poses;
    const imgSrc = poses[pose] || poses.default;

    el.innerHTML = `
      <div class="oskar-bubble" id="oskar-bubble"></div>
      <img
        class="oskar-img"
        src="${imgSrc}"
        alt=""
        draggable="false"
      />
    `;

    // Wenn das PNG noch nicht vorhanden ist, die Figur graceful ausblenden
    el.querySelector('.oskar-img').addEventListener('error', () => {
      el.style.display = 'none';
    });

    return el;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Zeigt das aktuelle Maskottchen (Oskar bei Klasse 1, Samson bei Klasse 2)
   * in einem Container.
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

  /** Figur vollständig aus dem DOM entfernen. */
  function remove() {
    if (_el) {
      if (_el.parentNode) _el.parentNode.removeChild(_el);
      _el = null;
    }
  }

  return {
    show, say, silence, remove,
    // Getter statt statischer Werte: einige Aufrufstellen greifen direkt auf
    // Oskar.MESSAGES/Oskar.POSES zu (z.B. `randomFrom(Oskar.MESSAGES.correct)`)
    // — das muss live die aktuell aktive Figur widerspiegeln.
    get MESSAGES() { return _active().messages; },
    get POSES() { return _active().poses; },
  };
})();
