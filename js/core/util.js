/**
 * core/util.js
 * Kleine, abhängigkeitsfreie Helfer. Wird als erstes Skript geladen.
 *
 * Enthält bewusst KEINE DOM-Logik und KEINEN Zugriff auf Storage —
 * damit die Datei in Tests ohne Browser geladen werden kann.
 */

const Util = (() => {

  // ─── Zufall ───────────────────────────────────────────────────────────────

  /**
   * Deterministischer Zufallsgenerator (mulberry32).
   * Wird verwendet, damit eine gemeldete Aufgabe über ihren Startwert
   * exakt reproduzierbar ist (siehe Bericht, Abschnitt 10).
   */
  function makeRng(seed) {
    let a = (seed >>> 0) || 1;
    return function rng() {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function newSeed() {
    return Math.floor(Math.random() * 2147483647) + 1;
  }

  function randomInt(min, max, rng) {
    const r = rng || Math.random;
    return Math.floor(r() * (max - min + 1)) + min;
  }

  function randomFrom(arr, rng) {
    if (!arr || arr.length === 0) return undefined;
    const r = rng || Math.random;
    return arr[Math.floor(r() * arr.length)];
  }

  function shuffle(arr, rng) {
    const r = rng || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Zufällige Auswahl von n Elementen ohne Wiederholung. */
  function sample(arr, n, rng) {
    return shuffle(arr, rng).slice(0, n);
  }

  // ─── Text ─────────────────────────────────────────────────────────────────

  /**
   * Escaped alles, was in HTML gefährlich ist.
   * ALLE Nutzereingaben (Profilname, Lernwörter, importierte Daten) müssen
   * hier durch, bevor sie in ein Template eingesetzt werden.
   */
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Escaped für ein HTML-Attribut in einfachen oder doppelten Anführungszeichen. */
  function escapeAttr(value) {
    return escapeHtml(value);
  }

  /** Deutsche Zahl mit Komma statt Punkt (z.B. 3,50). */
  function formatEuro(cents) {
    const sign = cents < 0 ? '−' : '';
    const abs = Math.abs(cents);
    const e = Math.floor(abs / 100);
    const c = abs % 100;
    return `${sign}${e},${String(c).padStart(2, '0')} €`;
  }

  /** "3" → "3 €", "0,80" → "80 Cent" – kindgerechte Kurzform. */
  function formatMoneyShort(cents) {
    if (cents % 100 === 0) return `${cents / 100} €`;
    if (cents < 100) return `${cents} Cent`;
    return formatEuro(cents);
  }

  const NUMBER_WORDS = [
    'null', 'eins', 'zwei', 'drei', 'vier', 'fünf',
    'sechs', 'sieben', 'acht', 'neun', 'zehn',
    'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn',
    'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig',
  ];

  function numberWord(n) {
    return NUMBER_WORDS[n] || String(n);
  }

  /** Pluralhilfe: plural(1,'Stern','Sterne') → 'Stern' */
  function plural(n, one, many) {
    return n === 1 ? one : many;
  }

  // ─── Zeit ─────────────────────────────────────────────────────────────────

  const DAY_MS = 24 * 60 * 60 * 1000;

  /** Lokaler Tagesstempel "2026-09-09" — für "heute geübt"-Vergleiche. */
  function dayKey(ts) {
    const d = ts ? new Date(ts) : new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  function daysBetween(a, b) {
    return Math.floor((b - a) / DAY_MS);
  }

  function formatDate(ts) {
    if (!ts) return '–';
    const d = new Date(ts);
    const p = n => String(n).padStart(2, '0');
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
  }

  /** "heute", "gestern", "vor 3 Tagen" – für die Elternansicht. */
  function relativeDay(ts, now) {
    if (!ts) return 'noch nie';
    const diff = daysBetween(ts, now || Date.now());
    if (diff <= 0) return 'heute';
    if (diff === 1) return 'gestern';
    if (diff < 7) return `vor ${diff} Tagen`;
    return formatDate(ts);
  }

  // ─── Sonstiges ────────────────────────────────────────────────────────────

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function uniq(arr) {
    return Array.from(new Set(arr));
  }

  function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
  }

  /** Tiefe Kopie über JSON – ausreichend für unsere reinen Datenobjekte. */
  function clone(obj) {
    return obj === undefined ? undefined : JSON.parse(JSON.stringify(obj));
  }

  return {
    makeRng, newSeed, randomInt, randomFrom, shuffle, sample,
    escapeHtml, escapeAttr, formatEuro, formatMoneyShort, numberWord, plural,
    dayKey, daysBetween, formatDate, relativeDay, DAY_MS,
    clamp, uniq, sum, clone,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Util;
