/**
 * oskar.js
 * Oskar begleitet die Lernwelt als ruhiges, motivierendes Maskottchen.
 */

const Oskar = (() => {
  const CHARACTERS = {
    oskar: {
      poses: {
        default: 'assets/oskar-cartoon.png',
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
        encourage: [
          'Fast! Schau noch einmal genau hin. 🐶',
          'Kein Problem – probier es noch einmal.',
          'Du bist nah dran. Ganz in Ruhe noch einmal!',
          'Fehler helfen beim Lernen. Weiter geht’s!',
        ],
        pause: [
          'Halbzeit! Wenn du magst, streck dich kurz. 🐶',
          'Schon die Hälfte geschafft! Einmal kurz durchatmen?',
          'Halbzeit! Augen kurz weg vom Bildschirm und dann weiter.',
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

  function _active() {
    return CHARACTERS.oskar;
  }

  let _el = null;
  let _lastFeedback = '';

  function _pick(arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function _pickWithChance(pool, chance) {
    if (Math.random() > chance) return null;
    return _pick(_active().messages[pool] || []);
  }

  function _build(placement, pose) {
    const el = document.createElement('div');
    el.className = `oskar-companion oskar--${placement}`;
    el.setAttribute('aria-hidden', 'true');

    const poses = _active().poses;
    const imgSrc = poses[pose] || poses.default;

    el.innerHTML = `
      <div class="oskar-bubble" id="oskar-bubble"></div>
      <img class="oskar-img" src="${imgSrc}" alt="" draggable="false" />
    `;

    el.querySelector('.oskar-img').addEventListener('error', () => {
      el.style.display = 'none';
    });

    return el;
  }

  function _isCheck() {
    return typeof document !== 'undefined' && !!document.querySelector('.check-badge');
  }

  function _isHalfTime() {
    if (typeof document === 'undefined') return false;
    const label = document.querySelector('.task-progress-label');
    if (!label) return false;
    const m = label.textContent.match(/Aufgabe\s+(\d+)\s+von\s+(\d+)/i);
    if (!m) return false;
    const current = Number(m[1]);
    const total = Number(m[2]);
    return total >= 6 && current === Math.floor(total / 2) + 1;
  }

  function show(container, opts = {}) {
    const {
      placement = 'inline-right',
      pose = 'default',
      pool = null,
      chance = 1,
      message = undefined,
    } = opts;

    remove();

    const el = _build(placement, pose);
    _el = el;
    container.appendChild(el);

    let text;
    if (message !== undefined) {
      text = message;
    } else if (placement === 'task-companion' && _isCheck()) {
      text = null;
      el.classList.add('oskar--calm');
    } else if (placement === 'task-companion' && _isHalfTime()) {
      text = _pick(_active().messages.pause);
      el.classList.add('oskar--calm');
    } else if (pool) {
      text = _pickWithChance(pool, chance);
    } else {
      text = null;
    }

    if (placement === 'task-companion') el.classList.add('oskar--calm');

    if (text) _showBubble(el, text);
    else _hideBubble(el);
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

  function say(text) {
    if (!_el || !text) return;
    _showBubble(_el, text);

    if (_active().messages.correct.indexOf(text) !== -1) {
      _el.classList.remove('oskar--celebrate');
      void _el.offsetWidth;
      _el.classList.add('oskar--celebrate');
      setTimeout(() => {
        if (_el) _el.classList.remove('oskar--celebrate');
      }, 800);
    }
  }

  function silence() {
    if (!_el) return;
    _hideBubble(_el);
  }

  function remove() {
    if (_el) {
      if (_el.parentNode) _el.parentNode.removeChild(_el);
      _el = null;
    }
  }

  function _enhanceTaskUi() {
    if (typeof document === 'undefined') return;

    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn && hintBtn.textContent.indexOf('Frag Oskar') === -1) {
      if (hintBtn.textContent.indexOf('Kein Tipp mehr') !== -1) {
        hintBtn.textContent = '🐶 Oskar hat keinen Tipp mehr';
      } else {
        hintBtn.textContent = '🐶 Frag Oskar';
      }
    }

    const feedback = document.getElementById('task-feedback');
    if (!feedback || feedback.classList.contains('hidden')) return;

    const key = `${feedback.className}|${feedback.textContent}`;
    if (!feedback.textContent || key === _lastFeedback) return;
    _lastFeedback = key;

    if (feedback.classList.contains('feedback-hint')) {
      say(feedback.textContent.replace(/^Tipp\s+\d+\s+von\s+\d+\s*/i, '').trim());
      if (hintBtn && hintBtn.textContent.indexOf('Kein Tipp') === -1) {
        hintBtn.textContent = '🐶 Frag Oskar nochmal';
      }
    } else if (feedback.classList.contains('feedback-wrong')) {
      say(_pick(_active().messages.encourage));
    } else if (feedback.classList.contains('feedback-solution')) {
      say('Macht nichts. Die Aufgabe kommt später noch einmal. 🐶');
    }
  }

  function _installCoach() {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;
    _enhanceTaskUi();
    const observer = new MutationObserver(_enhanceTaskUi);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _installCoach);
    else _installCoach();
  }

  return {
    show, say, silence, remove,
    get MESSAGES() { return _active().messages; },
    get POSES() { return _active().poses; },
  };
})();
