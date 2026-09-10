/**
 * generators/index.js
 * Registry aller Aufgabengeneratoren.
 *
 * Zentral geregelt:
 *  • Zuordnung Topic → Generator (über `topic.gen`).
 *  • Stabile Aufgabenkennung `taskId = topicId#signature`.
 *    Damit werden 15 + 5 und 10 + 10 als verschiedene Aufgaben erkannt —
 *    in Version 1 galten beide als "20" (Bericht, Abschnitt 2 E).
 *  • Anti-Wiederholung über die Kennung, nicht über die Antwort.
 *  • Reproduzierbarkeit: Jede Aufgabe merkt sich ihren Startwert (seed).
 */

const Generators = (() => {

  const REGISTRY = {};

  function register(source) {
    Object.keys(source).forEach(key => {
      const g = source[key];
      if (g && typeof g.generate === 'function') REGISTRY[key] = g;
    });
  }

  register(MathGen);
  register(GermanGen);
  register(MiscGen);

  function has(topicId) {
    const topic = Topics.get(topicId);
    return !!(topic && REGISTRY[topic.gen]);
  }

  function missingGenerators() {
    return Topics.all().filter(t => !REGISTRY[t.gen]).map(t => t.id);
  }

  // ─── Anti-Wiederholung ────────────────────────────────────────────────────
  // Nur im Arbeitsspeicher: Nach einem Neuladen darf ruhig wieder dieselbe
  // Aufgabe kommen. Wichtig ist, dass sie nicht innerhalb einer Runde
  // mehrfach erscheint.

  const RECENT_LIMIT = 8;
  const recent = {};

  function markRecent(topicId, signature) {
    if (!recent[topicId]) recent[topicId] = [];
    recent[topicId].push(signature);
    while (recent[topicId].length > RECENT_LIMIT) recent[topicId].shift();
  }

  function wasRecent(topicId, signature) {
    return (recent[topicId] || []).includes(signature);
  }

  function clearRecent(topicId) {
    if (topicId) delete recent[topicId];
    else Object.keys(recent).forEach(k => delete recent[k]);
  }

  /**
   * Erzeugt eine Aufgabe.
   *
   * @param {string} topicId
   * @param {object} opts
   *   level   {number}  1–3, sonst aus dem Lernstand
   *   profile {object}
   *   seed    {number}  für reproduzierbare Aufgaben
   *   avoid   {string[]} Kennungen, die in dieser Runde nicht wiederkommen sollen
   * @returns {object|null} Aufgabe oder null, wenn kein Generator existiert
   */
  function create(topicId, opts) {
    const o = opts || {};
    const topic = Topics.get(topicId);
    if (!topic) return null;
    const gen = REGISTRY[topic.gen];
    if (!gen) return null;

    const profile = o.profile || null;
    const level = Util.clamp(
      o.level || (profile ? Progress.getLevel(profile, topicId) : 1), 1, 3);
    const avoid = o.avoid || [];

    let task = null;
    let seed = 0;
    for (let attempt = 0; attempt < 14; attempt++) {
      seed = o.seed || Util.newSeed();
      const rng = Util.makeRng(seed + attempt * 7919);
      const built = gen.generate({ level, rng, seed, profile, args: topic.genArgs || {} });
      if (!built) break;
      const sig = String(built.signature || 'x');
      const taskId = `${topicId}#${sig}`;
      const clash = wasRecent(topicId, sig) || avoid.includes(taskId);
      task = Object.assign({}, built, { topicId, level, seed, taskId, signature: sig });
      if (!clash || o.seed) break;              // fester Startwert: keine Neuauswahl
    }
    if (!task) return null;

    markRecent(topicId, task.signature);

    // Einheitliche Felder ergänzen
    task.title = topic.title;
    task.icon = topic.icon;
    task.subject = topic.subject;
    task.hints = Array.isArray(task.hints) ? task.hints.filter(Boolean) : [];
    task.input = task.input || { kind: 'text' };
    task.answerMode = task.answerMode || AnswerCheck.MODE.TEXT;
    return task;
  }

  /**
   * Erzeugt eine Aufgabe erneut aus ihrer Kennung und ihrem Startwert —
   * für gemeldete Fehler und für Arbeitsblätter mit Lösungen.
   */
  function recreate(topicId, seed, level) {
    return create(topicId, { seed, level });
  }

  return { REGISTRY, has, create, recreate, missingGenerators, clearRecent, markRecent, wasRecent };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Generators;
