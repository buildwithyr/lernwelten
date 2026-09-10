/**
 * core/answer.js
 * Antwortprüfung und -normalisierung.
 *
 * Wichtige fachliche Regel (Bericht, Abschnitt 5 und 10):
 *   Es gibt KEINE globale Umwandlung aller Antworten in Großbuchstaben.
 *   Jede Übung legt selbst fest, wie streng geprüft wird:
 *     • Wortschatzübungen: Groß-/Kleinschreibung ist egal.
 *     • Übungen zur Großschreibung: sie wird gezielt geprüft.
 *   Mehrere gültige Lösungen sind ausdrücklich erlaubt (`accept`).
 */

const AnswerCheck = (() => {

  const MODE = {
    NUMBER: 'number',
    TEXT:   'text',
    CHOICE: 'choice',
    ORDER:  'order',   // Reihenfolge von Karten
    SET:    'set',      // Auswahl mehrerer Elemente, Reihenfolge egal
    FIELDS: 'fields',   // mehrere Eingabefelder, z.B. Zehner/Einer
  };

  // Österreichische Varianten, die in beide Richtungen akzeptiert werden.
  const VARIANTS = [
    ['jänner', 'januar'],
    ['feber', 'februar'],
    ['heuer', 'dieses jahr'],
  ];

  function _stripInvisible(s) {
    // Umlaute bleiben bedeutungstragend — nur unsichtbare Zeichen entfernen
    // (Zero-Width-Space bis Zero-Width-Joiner sowie BOM).
    return s.replace(/[\u200B-\u200D\uFEFF]/g, '');
  }

  /** Vereinheitlicht Leerzeichen, Bindestriche und typografische Zeichen. */
  function normalizeText(value, opts) {
    const o = opts || {};
    let s = String(value == null ? '' : value);
    s = _stripInvisible(s);
    s = s.replace(/[‘’ʼ]/g, "'")
         .replace(/[“”]/g, '"')
         .replace(/[‐-―−]/g, '-');
    s = s.replace(/\s+/g, ' ').trim();
    if (o.stripPunctuation) s = s.replace(/[.,!?;:]+$/g, '').trim();
    if (o.removeSpaces) s = s.replace(/\s+/g, '');
    if (!o.strictCase) s = s.toLowerCase();
    return s;
  }

  function _variantForms(normalized) {
    const forms = [normalized];
    VARIANTS.forEach(group => {
      if (group.includes(normalized)) group.forEach(g => { if (!forms.includes(g)) forms.push(g); });
    });
    return forms;
  }

  /** Zahl aus einer Eingabe holen. Akzeptiert "12", " 12 ", "12,0" nicht als 12,5. */
  function parseNumber(value) {
    const s = String(value == null ? '' : value).trim().replace(/\s/g, '').replace(',', '.');
    if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  /**
   * Prüft eine Antwort gegen eine Aufgabe.
   *
   * @param {*} given  Eingabe der Nutzerin
   * @param {object} task
   *   answerMode {string}    siehe MODE, Standard 'text'
   *   answer     {*}         erwartete Lösung
   *   accept     {Array}     weitere gültige Lösungen
   *   strictCase {boolean}   Groß-/Kleinschreibung prüfen (Standard: nein)
   *   stripPunctuation {boolean}
   * @returns {boolean}
   */
  function check(given, task) {
    if (!task) return false;
    const mode = task.answerMode || MODE.TEXT;

    if (mode === MODE.NUMBER) {
      const g = parseNumber(given);
      if (g === null) return false;
      const candidates = [task.answer].concat(task.accept || []);
      return candidates.some(c => parseNumber(c) === g);
    }

    if (mode === MODE.ORDER) {
      const g = Array.isArray(given) ? given : [];
      const candidates = [task.answer].concat(task.accept || []);
      return candidates.some(c => Array.isArray(c) &&
        c.length === g.length &&
        c.every((v, i) => normalizeText(v, task) === normalizeText(g[i], task)));
    }

    if (mode === MODE.SET) {
      const g = (Array.isArray(given) ? given : []).map(v => normalizeText(v, task)).sort();
      const candidates = [task.answer].concat(task.accept || []);
      return candidates.some(c => {
        if (!Array.isArray(c)) return false;
        const e = c.map(v => normalizeText(v, task)).sort();
        return e.length === g.length && e.every((v, i) => v === g[i]);
      });
    }

    if (mode === MODE.FIELDS) {
      const g = Array.isArray(given) ? given : [];
      const expected = Array.isArray(task.answer) ? task.answer : [];
      if (g.length !== expected.length) return false;
      return expected.every((exp, i) => {
        if (task.fieldMode === MODE.NUMBER || typeof exp === 'number') {
          return parseNumber(g[i]) === parseNumber(exp);
        }
        return normalizeText(g[i], task) === normalizeText(exp, task);
      });
    }

    if (mode === MODE.CHOICE) {
      // Auswahlantworten werden exakt verglichen — die Werte stammen aus der App.
      const candidates = [task.answer].concat(task.accept || []);
      return candidates.some(c => String(c) === String(given));
    }

    // MODE.TEXT
    const g = normalizeText(given, task);
    if (!g) return false;
    const forms = _variantForms(g);
    const candidates = [task.answer].concat(task.accept || []);
    return candidates.some(c => {
      const e = normalizeText(c, task);
      return forms.includes(e) || _variantForms(e).includes(g);
    });
  }

  /**
   * Wie nah ist die Antwort dran? Für hilfreiche Rückmeldungen.
   * @returns 'exact' | 'caseOnly' | 'closeNumber' | 'typo' | 'far'
   */
  function classify(given, task) {
    if (check(given, task)) return 'exact';
    const mode = task.answerMode || MODE.TEXT;

    if (mode === MODE.NUMBER) {
      const g = parseNumber(given);
      const e = parseNumber(task.answer);
      if (g !== null && e !== null && Math.abs(g - e) <= 2) return 'closeNumber';
      return 'far';
    }

    if (mode === MODE.TEXT) {
      const gLoose = normalizeText(given, Object.assign({}, task, { strictCase: false }));
      const eLoose = normalizeText(task.answer, Object.assign({}, task, { strictCase: false }));
      if (gLoose === eLoose) return 'caseOnly';
      if (levenshtein(gLoose, eLoose) === 1) return 'typo';
    }
    return 'far';
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const prev = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      let last = prev[0];
      prev[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const tmp = prev[j];
        prev[j] = Math.min(
          prev[j] + 1,
          prev[j - 1] + 1,
          last + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
        last = tmp;
      }
    }
    return prev[b.length];
  }

  /** Menschlich lesbare Lösung für die Rückmeldung. */
  function formatSolution(task) {
    if (!task) return '';
    const a = task.answer;
    if (Array.isArray(a)) return a.join(' ');
    return String(a);
  }

  return { MODE, VARIANTS, normalizeText, parseNumber, check, classify, levenshtein, formatSolution };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = AnswerCheck;
