/**
 * core/progress.js
 * Lernstand, Bewertung und Wiederholungsplanung.
 *
 * Behebt die im Bericht (Abschnitt 2) beschriebenen Bewertungsfehler:
 *
 *  A  Die Schwierigkeit wird NICHT mehr nach jeder Antwort angepasst, sondern
 *     frühestens nach zwei abgeschlossenen Runden auf derselben Stufe und
 *     dann höchstens um eine Stufe. Bewertet werden nur die jüngsten
 *     selbstständigen Erstversuche auf der aktuellen Stufe.
 *  B  Bestwerte werden getrennt nach Rundenlänge geführt. 5/5 und 6/10 werden
 *     nie mehr direkt verglichen.
 *  C  Jede Aufgabe endet in genau einem von drei Zuständen:
 *     'solo'   – allein geschafft (erster Versuch richtig, ohne Hilfe)
 *     'helped' – mit Hilfe oder nach Korrektur geschafft
 *     'failed' – nicht geschafft (Lösung wurde gezeigt)
 *  E  Wiederholungen laufen über stabile Aufgabenkennungen; pro Aufgabe gibt
 *     es höchstens einen offenen Eintrag, und offene Einträge überleben das
 *     Rundenende.
 */

const Progress = (() => {

  const OUTCOME = { SOLO: 'solo', HELPED: 'helped', FAILED: 'failed' };

  // Erstversuchsfenster pro Stufe. Größer als eine Runde, damit einzelne
  // Ausrutscher nicht sofort durchschlagen.
  const FIRST_TRY_WINDOW = 12;

  // Vor einer Stufenänderung müssen mindestens so viele Runden und
  // Erstversuche auf der aktuellen Stufe vorliegen.
  const MIN_ROUNDS_ON_LEVEL = 2;
  const MIN_FIRST_TRIES = 8;

  const RAISE_AT = 0.85;
  const LOWER_BELOW = 0.50;

  // Leitner-Abstände in Tagen, Index = Box 1–5.
  const BOX_DAYS = [0, 1, 2, 4, 7, 14];
  const MAX_BOX = 5;

  // ─── Lernstand lesen ──────────────────────────────────────────────────────

  function getSkill(profile, topicId) {
    if (!profile) return Storage.emptySkill();
    if (!profile.skills[topicId]) profile.skills[topicId] = Storage.emptySkill();
    return profile.skills[topicId];
  }

  function getLevel(profile, topicId) {
    return Util.clamp(getSkill(profile, topicId).level || 1, 1, 3);
  }

  /** Anteil der zuletzt allein geschafften Erstversuche auf der aktuellen Stufe. */
  function soloRate(skill) {
    if (!skill.firstTry.length) return null;
    return Util.sum(skill.firstTry) / skill.firstTry.length;
  }

  // ─── Einzelne Aufgabe verbuchen ───────────────────────────────────────────

  /**
   * @param {object} profile
   * @param {object} result
   *   topicId   {string}
   *   taskId    {string}   stabile Kennung der konkreten Aufgabe
   *   outcome   {string}   'solo' | 'helped' | 'failed'
   *   level     {number}   Stufe, auf der die Aufgabe gestellt wurde
   *   hintsUsed {number}
   *   mode      {string}   'practice' | 'check' | 'free' | 'daily'
   */
  function recordAttempt(profile, result) {
    if (!profile || !result || !result.topicId) return null;
    const skill = getSkill(profile, result.topicId);
    const now = result.at || Date.now();

    skill.attempts++;
    skill.last = now;

    if (result.outcome === OUTCOME.SOLO) skill.solo++;
    else if (result.outcome === OUTCOME.HELPED) skill.helped++;
    else skill.failed++;

    // Erstversuchsfenster nur führen, wenn die Aufgabe auf der aktuellen
    // Stufe gestellt wurde — sonst verfälschen Check-Runden das Bild.
    if (!result.level || result.level === skill.level) {
      skill.firstTry.push(result.outcome === OUTCOME.SOLO ? 1 : 0);
      while (skill.firstTry.length > FIRST_TRY_WINDOW) skill.firstTry.shift();
    }

    // Wiederholungsbox aktualisieren
    if (result.outcome === OUTCOME.SOLO) {
      skill.box = Math.min(MAX_BOX, (skill.box || 1) + 1);
    } else if (result.outcome === OUTCOME.FAILED) {
      skill.box = 1;
    }
    skill.dueAt = now + BOX_DAYS[skill.box] * Util.DAY_MS;

    return skill;
  }

  // ─── Stufenanpassung — nur am Rundenende ──────────────────────────────────

  /**
   * Prüft nach einer abgeschlossenen Runde, ob die Stufe geändert wird.
   * In Kurz-Checks (mode 'check') passiert das bewusst NICHT.
   *
   * @returns {object|null} { from, to, reason } bei einer Änderung
   */
  function reviewLevelAfterRound(profile, topicId, mode) {
    if (mode === 'check') return null;
    const skill = getSkill(profile, topicId);
    skill.roundsOnLevel = (skill.roundsOnLevel || 0) + 1;

    if (skill.roundsOnLevel < MIN_ROUNDS_ON_LEVEL) return null;
    if (skill.firstTry.length < MIN_FIRST_TRIES) return null;

    const rate = soloRate(skill);
    if (rate === null) return null;

    const from = skill.level;
    let to = from;
    let reason = '';

    if (rate >= RAISE_AT && from < 3) { to = from + 1; reason = 'sicher'; }
    else if (rate < LOWER_BELOW && from > 1) { to = from - 1; reason = 'noch schwer'; }

    if (to === from) {
      // Auf derselben Stufe bleiben, aber die Beobachtung neu starten,
      // damit ein alter Durchhänger nicht dauerhaft nachwirkt.
      if (skill.roundsOnLevel >= MIN_ROUNDS_ON_LEVEL * 2) skill.roundsOnLevel = MIN_ROUNDS_ON_LEVEL;
      return null;
    }

    skill.level = to;
    skill.levelSince = Date.now();
    skill.roundsOnLevel = 0;
    skill.firstTry = [];      // neue Stufe → neue Beobachtung
    return { from, to, reason };
  }

  // ─── Rundenergebnis ───────────────────────────────────────────────────────

  /**
   * Speichert das Ergebnis einer Runde.
   * Bestwerte werden getrennt nach Rundenlänge geführt und primär nach
   * "allein geschafft" verglichen — ein alter Rekord aus einer längeren
   * Runde kann eine kurze perfekte Runde nicht mehr entwerten.
   */
  function saveRound(profile, round) {
    if (!profile || !round || !round.topicId) return null;
    const id = round.topicId;
    const lengthKey = String(round.total);
    if (!profile.sessions[id]) profile.sessions[id] = { plays: 0, best: {}, last: null, history: [] };
    const s = profile.sessions[id];

    const entry = {
      solo: round.solo,
      helped: round.helped,
      failed: round.failed,
      done: round.solo + round.helped,
      total: round.total,
      mode: round.mode || 'practice',
      level: round.level || 1,
      at: round.at || Date.now(),
    };

    s.plays = (s.plays || 0) + 1;
    s.last = entry;
    if (!Array.isArray(s.history)) s.history = [];
    s.history.push(entry);
    while (s.history.length > 12) s.history.shift();

    const prev = s.best[lengthKey];
    if (!prev || entry.solo > prev.solo ||
        (entry.solo === prev.solo && entry.done > prev.done)) {
      s.best[lengthKey] = { solo: entry.solo, done: entry.done, total: entry.total, at: entry.at };
    }

    return entry;
  }

  /**
   * Speichert eine gemischte Runde ("Heute üben", Kurz-Check).
   * Es entsteht KEIN Bestwert pro Lernziel — die Aufgabenanzahl je Thema
   * ist dafür zu klein. Gezählt werden nur die Durchgänge und der Verlauf.
   */
  function saveMixedRound(profile, round) {
    if (!profile || !round) return null;
    if (!Array.isArray(profile.rounds)) profile.rounds = [];
    const entry = {
      mode: round.mode || 'daily',
      total: round.total,
      solo: round.solo,
      helped: round.helped,
      failed: round.failed,
      topics: round.topics || [],
      at: round.at || Date.now(),
    };
    profile.rounds.push(entry);
    while (profile.rounds.length > 40) profile.rounds.shift();

    (round.topics || []).forEach(id => {
      if (!profile.sessions[id]) profile.sessions[id] = { plays: 0, best: {}, last: null, history: [] };
      profile.sessions[id].plays = (profile.sessions[id].plays || 0) + 1;
    });
    return entry;
  }

  /**
   * Sterne-Bewertung einer Runde — immer als Quote, nie als absolute Zahl.
   * "Allein geschafft" zählt voll, "mit Hilfe geschafft" zur Hälfte.
   */
  function roundStars(round) {
    if (!round || !round.total) return 0;
    const score = (round.solo + round.helped * 0.5) / round.total;
    if (score >= 0.9) return 3;
    if (score >= 0.7) return 2;
    if (score >= 0.45) return 1;
    return 0;
  }

  /** Text zur Runde — unterscheidet ausdrücklich allein / mit Hilfe. */
  function roundSummaryText(round) {
    const { solo, helped, total } = round;
    if (solo === total) return 'Alles allein geschafft!';
    if (solo + helped === total && helped > 0) return 'Alles geschafft — ein paar Aufgaben mit Hilfe.';
    if (solo + helped === 0) return 'Das war schwer. Beim nächsten Mal wird es leichter.';
    return `${solo} allein, ${helped} mit Hilfe.`;
  }

  /**
   * Bestwert-Anzeige für eine Übungskarte.
   * Gibt null zurück, wenn noch nie gespielt wurde.
   */
  function bestLabel(profile, topicId, roundLength) {
    const s = profile && profile.sessions && profile.sessions[topicId];
    if (!s) return null;
    const key = String(roundLength);
    const best = s.best[key];
    if (best) return { solo: best.solo, total: best.total, sameLength: true };
    // Kein Bestwert für diese Länge: den mit der meisten Erfahrung zeigen,
    // aber ausdrücklich mit seiner eigenen Länge.
    const keys = Object.keys(s.best);
    if (!keys.length) return null;
    const alt = s.best[keys[0]];
    return { solo: alt.solo, total: alt.total, sameLength: false };
  }

  // ─── Wiederholungen ───────────────────────────────────────────────────────

  /**
   * Legt eine offene Wiederholung an — höchstens eine pro Aufgabenkennung.
   * Mehrere Fehlversuche derselben Aufgabe erzeugen KEINE Mehrfacheinträge.
   */
  function queueRetry(profile, item) {
    if (!profile || !item || !item.taskId) return false;
    const existing = profile.retry.find(r => r.taskId === item.taskId);
    if (existing) {
      existing.tries = (existing.tries || 1) + 1;
      existing.dueAt = Math.min(existing.dueAt, item.dueAt || Date.now());
      return false;
    }
    profile.retry.push({
      taskId: item.taskId,
      topicId: item.topicId,
      label: item.label || '',
      level: item.level || 1,
      seed: item.seed || null,
      addedAt: Date.now(),
      dueAt: item.dueAt || Date.now(),
      tries: 1,
    });
    while (profile.retry.length > 120) profile.retry.shift();
    return true;
  }

  function resolveRetry(profile, taskId) {
    if (!profile) return false;
    const i = profile.retry.findIndex(r => r.taskId === taskId);
    if (i === -1) return false;
    profile.retry.splice(i, 1);
    return true;
  }

  /** Alle fälligen offenen Wiederholungen, älteste zuerst. */
  function dueRetries(profile, now) {
    const t = now || Date.now();
    return (profile.retry || [])
      .filter(r => (r.dueAt || 0) <= t)
      .sort((a, b) => (a.dueAt || 0) - (b.dueAt || 0));
  }

  function retriesForTopic(profile, topicId, now) {
    return dueRetries(profile, now).filter(r => r.topicId === topicId);
  }

  // ─── Auswahl für "Heute üben" ─────────────────────────────────────────────

  /**
   * Gewichtet freigegebene Themen für eine gemischte Runde.
   * Höheres Gewicht = häufiger auswählen.
   */
  function topicWeight(profile, topicId, now) {
    const skill = profile.skills[topicId];
    const t = now || Date.now();
    if (!skill || skill.attempts === 0) return 2.0;      // neu: gern zeigen
    const rate = (skill.solo) / Math.max(1, skill.attempts);
    let w = 1.0;
    if (rate < 0.4) w = 2.5;
    else if (rate < 0.65) w = 1.8;
    else if (rate > 0.9) w = 0.6;
    // Fälligkeit erhöht das Gewicht zusätzlich.
    if (skill.dueAt && skill.dueAt <= t) w *= 1.6;
    // Was heute schon dran war, kommt seltener.
    if (skill.last && Util.dayKey(skill.last) === Util.dayKey(t)) w *= 0.5;
    return w;
  }

  /**
   * Stellt die Themenmischung für eine Runde zusammen.
   * Startidee laut Bericht: leichter Einstieg, Schwerpunkt aktuelles Thema,
   * dazu fällige Wiederholungen. Keine pädagogisch validierte Vorgabe.
   */
  function planRound(profile, options) {
    const opts = options || {};
    const length = opts.length === 5 ? 5 : 10;
    const now = opts.now || Date.now();
    const rng = opts.rng || Math.random;

    const focus = (opts.focusTopics || profile.focusTopics || [])
      .filter(id => Topics.get(id) && profile.unlocked[id]);
    const available = (opts.pool || Object.keys(profile.unlocked))
      .filter(id => profile.unlocked[id] && Topics.get(id));

    if (!available.length) return [];

    const review = Util.uniq(dueRetries(profile, now).map(r => r.topicId))
      .filter(id => available.includes(id));

    const warmup = available
      .filter(id => {
        const s = profile.skills[id];
        return s && s.attempts >= 3 && (s.solo / Math.max(1, s.attempts)) > 0.75;
      });

    // Verteilung: 20 % Einstieg, 50 % Schwerpunkt, 30 % Wiederholung.
    const nWarm = Math.max(1, Math.round(length * 0.2));
    const nReview = Math.round(length * 0.3);
    const plan = [];

    function pushFrom(list, count) {
      if (!list.length) return;
      for (let i = 0; i < count; i++) {
        plan.push(list[Math.floor(rng() * list.length)]);
      }
    }

    pushFrom(warmup.length ? warmup : available, nWarm);
    pushFrom(review.length ? review : [], nReview);

    // Rest mit dem Schwerpunkt bzw. gewichtet auffüllen.
    const rest = length - plan.length;
    const weighted = available.map(id => ({ id, w: topicWeight(profile, id, now) }));
    for (let i = 0; i < rest; i++) {
      if (focus.length && (i % 3 !== 2)) {
        plan.push(focus[Math.floor(rng() * focus.length)]);
        continue;
      }
      const total = Util.sum(weighted.map(x => x.w));
      let r = rng() * total;
      let chosen = weighted[weighted.length - 1].id;
      for (const x of weighted) { r -= x.w; if (r <= 0) { chosen = x.id; break; } }
      plan.push(chosen);
    }

    // Nicht dreimal dasselbe Thema hintereinander.
    for (let i = 2; i < plan.length; i++) {
      if (plan[i] === plan[i - 1] && plan[i] === plan[i - 2]) {
        const alt = available.find(id => id !== plan[i]);
        if (alt) plan[i] = alt;
      }
    }

    return plan.slice(0, length);
  }

  // ─── Auswertung für den Elternbereich ─────────────────────────────────────

  function skillSummary(profile, topicId) {
    const topic = Topics.get(topicId);
    const skill = profile.skills[topicId];
    if (!topic) return null;
    if (!skill || !skill.attempts) {
      return {
        topicId, title: topic.title, goal: topic.goal,
        attempts: 0, solo: 0, helped: 0, failed: 0,
        level: 1, last: 0, status: 'neu',
        statusText: 'Noch nicht geübt',
        suggestion: 'Einmal gemeinsam ausprobieren.',
      };
    }
    const rate = skill.solo / skill.attempts;
    let status = 'uebt';
    let statusText = 'Wird noch geübt';
    let suggestion = 'Weiter üben, Hilfen ruhig nutzen.';
    if (skill.attempts >= 6 && rate >= 0.8) {
      status = 'sicher';
      statusText = 'Gelingt meist allein';
      suggestion = 'Ab und zu wiederholen; ein neues Thema freigeben.';
    } else if (skill.attempts >= 6 && rate < 0.4) {
      status = 'schwer';
      statusText = 'Noch schwer';
      suggestion = 'Gemeinsam mit Material üben und die Stufe niedrig lassen.';
    }
    return {
      topicId, title: topic.title, goal: topic.goal,
      attempts: skill.attempts, solo: skill.solo, helped: skill.helped, failed: skill.failed,
      level: skill.level, last: skill.last, box: skill.box, dueAt: skill.dueAt,
      rate, status, statusText, suggestion,
      recentFirstTry: skill.firstTry.slice(),
    };
  }

  /** Themen, die als nächstes sinnvoll wären. */
  function suggestions(profile, limit) {
    const now = Date.now();
    const ids = Object.keys(profile.unlocked).filter(id => profile.unlocked[id] && Topics.get(id));
    const scored = ids.map(id => {
      const s = profile.skills[id];
      const attempts = s ? s.attempts : 0;
      const rate = s && attempts ? s.solo / attempts : 0;
      let score = 0;
      if (!attempts) score = 60;                       // noch nie geübt
      else if (rate < 0.5) score = 100 - rate * 100;   // schwer → hohe Priorität
      else if (s.dueAt && s.dueAt <= now) score = 45;  // fällige Wiederholung
      else score = 10;
      return { topicId: id, score, summary: skillSummary(profile, id) };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, limit || 3);
  }

  return {
    OUTCOME, FIRST_TRY_WINDOW, MIN_ROUNDS_ON_LEVEL, MIN_FIRST_TRIES, BOX_DAYS,
    getSkill, getLevel, soloRate,
    recordAttempt, reviewLevelAfterRound,
    saveRound, saveMixedRound, roundStars, roundSummaryText, bestLabel,
    queueRetry, resolveRetry, dueRetries, retriesForTopic,
    topicWeight, planRound,
    skillSummary, suggestions,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Progress;
