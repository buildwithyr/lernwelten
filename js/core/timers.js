/**
 * core/timers.js
 * Zentrale Verwaltung aller zeitgesteuerten Abläufe.
 *
 * Hintergrund (Bericht, Abschnitt 3):
 *   Zeitgesteuerte Wechsel zur nächsten Aufgabe wurden beim Verlassen einer
 *   Übung nicht abgebrochen. Eine alte Rückmeldung konnte deshalb nachträglich
 *   wieder einen Aufgabenscreen öffnen.
 *
 * Lösung: Jeder Bildschirmwechsel erhöht die Sitzungskennung. Timer merken
 * sich die Kennung, unter der sie gestartet wurden, und tun nichts mehr,
 * wenn sie inzwischen veraltet ist. Zusätzlich werden sie aktiv abgeräumt.
 */

const Timers = (() => {

  let token = 0;
  const handles = new Set();
  const intervals = new Set();

  /** Erhöht die Sitzungskennung und räumt alle laufenden Timer ab. */
  function invalidate() {
    token++;
    handles.forEach(h => clearTimeout(h));
    handles.clear();
    intervals.forEach(h => clearInterval(h));
    intervals.clear();
    return token;
  }

  function current() { return token; }

  /**
   * Verzögerte Aktion, die nur ausgeführt wird, wenn die Kennung noch gilt.
   * @returns {function} Abbruchfunktion
   */
  function after(ms, fn, forToken) {
    const my = forToken === undefined ? token : forToken;
    const h = setTimeout(() => {
      handles.delete(h);
      if (my !== token) return;
      fn();
    }, ms);
    handles.add(h);
    return () => { clearTimeout(h); handles.delete(h); };
  }

  /** Wiederkehrende Aktion mit derselben Absicherung. */
  function every(ms, fn, forToken) {
    const my = forToken === undefined ? token : forToken;
    const h = setInterval(() => {
      if (my !== token) { clearInterval(h); intervals.delete(h); return; }
      fn(() => { clearInterval(h); intervals.delete(h); });
    }, ms);
    intervals.add(h);
    return () => { clearInterval(h); intervals.delete(h); };
  }

  function pending() { return handles.size + intervals.size; }

  return { invalidate, current, after, every, pending };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Timers;
