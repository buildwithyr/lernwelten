/**
 * tests/progress.test.js
 * Prüft die Bewertungslogik gegen die Befunde A–E des Analyseberichts.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { loadApp } = require('./harness');

function fresh() {
  const ctx = loadApp({ silent: true });
  const profile = ctx.Storage.newProfile('Testkind', 'fox', 2);
  ctx.Storage.saveProfile(profile);
  ctx.Storage.setActiveProfileId(profile.id);
  return { ctx, profile: ctx.Storage.getActiveProfile() };
}

function answer(ctx, profile, topicId, outcome, level) {
  ctx.Progress.recordAttempt(profile, {
    topicId,
    taskId: topicId + '#' + Math.random(),
    outcome,
    level: level || ctx.Progress.getLevel(profile, topicId),
    mode: 'practice',
  });
}

// ── Befund A: Schwierigkeit steigt zu schnell ──────────────────────────────

test('A: sechs richtige Antworten führen NICHT auf Stufe 3', () => {
  const { ctx, profile } = fresh();
  const id = 'm2.addOhneUebergang';
  for (let i = 0; i < 6; i++) answer(ctx, profile, id, 'solo');
  ctx.Progress.reviewLevelAfterRound(profile, id, 'practice');
  assert.strictEqual(ctx.Progress.getLevel(profile, id), 1,
    'Stufe darf nach sechs Antworten und einer Runde noch nicht steigen');
});

test('A: Stufe steigt erst nach zwei Runden und höchstens um eine Stufe', () => {
  const { ctx, profile } = fresh();
  const id = 'm2.addOhneUebergang';

  // Runde 1: fünf Aufgaben, alle allein
  for (let i = 0; i < 5; i++) answer(ctx, profile, id, 'solo');
  assert.strictEqual(ctx.Progress.reviewLevelAfterRound(profile, id, 'practice'), null,
    'nach einer Runde darf sich nichts ändern');
  assert.strictEqual(ctx.Progress.getLevel(profile, id), 1);

  // Runde 2: weitere fünf Aufgaben → jetzt sind 10 Erstversuche da
  for (let i = 0; i < 5; i++) answer(ctx, profile, id, 'solo');
  const change = ctx.Progress.reviewLevelAfterRound(profile, id, 'practice');
  assert.ok(change, 'nach zwei Runden mit hoher Quote soll die Stufe steigen');
  assert.strictEqual(change.from, 1);
  assert.strictEqual(change.to, 2, 'höchstens eine Stufe auf einmal');
  assert.strictEqual(ctx.Progress.getLevel(profile, id), 2);
});

test('A: nach einem Stufenwechsel beginnt die Beobachtung neu', () => {
  const { ctx, profile } = fresh();
  const id = 'm2.addOhneUebergang';
  for (let i = 0; i < 10; i++) answer(ctx, profile, id, 'solo');
  ctx.Progress.reviewLevelAfterRound(profile, id, 'practice');
  ctx.Progress.reviewLevelAfterRound(profile, id, 'practice');
  const skill = ctx.Progress.getSkill(profile, id);
  assert.strictEqual(skill.level, 2);
  assert.strictEqual(skill.firstTry.length, 0, 'Erstversuchsfenster wird geleert');
  assert.strictEqual(skill.roundsOnLevel, 0);
});

test('A: Stufe sinkt bei anhaltenden Schwierigkeiten', () => {
  const { ctx, profile } = fresh();
  const id = 'm2.addOhneUebergang';
  ctx.Progress.getSkill(profile, id).level = 3;
  for (let i = 0; i < 10; i++) answer(ctx, profile, id, 'failed', 3);
  ctx.Progress.reviewLevelAfterRound(profile, id, 'practice');
  const change = ctx.Progress.reviewLevelAfterRound(profile, id, 'practice');
  assert.ok(change);
  assert.strictEqual(change.to, 2);
});

test('A: im Kurz-Check ändert sich die Stufe nie', () => {
  const { ctx, profile } = fresh();
  const id = 'm2.addOhneUebergang';
  for (let i = 0; i < 20; i++) answer(ctx, profile, id, 'solo');
  for (let r = 0; r < 5; r++) {
    assert.strictEqual(ctx.Progress.reviewLevelAfterRound(profile, id, 'check'), null);
  }
  assert.strictEqual(ctx.Progress.getLevel(profile, id), 1);
});

// ── Befund B: Bestwerte aus unterschiedlich langen Runden ──────────────────

test('B: 5 von 5 wird nicht durch 6 von 10 entwertet', () => {
  const { ctx, profile } = fresh();
  const id = 'm2.doubleHalf';

  ctx.Progress.saveRound(profile, { topicId: id, solo: 5, helped: 0, failed: 0, total: 5, mode: 'free' });
  ctx.Progress.saveRound(profile, { topicId: id, solo: 6, helped: 0, failed: 4, total: 10, mode: 'free' });

  const best5 = profile.sessions[id].best['5'];
  const best10 = profile.sessions[id].best['10'];
  assert.strictEqual(best5.solo, 5, 'die perfekte Fünferrunde bleibt erhalten');
  assert.strictEqual(best10.solo, 6);

  const label5 = ctx.Progress.bestLabel(profile, id, 5);
  assert.strictEqual(label5.solo, 5);
  assert.strictEqual(label5.total, 5);
  assert.strictEqual(label5.sameLength, true);
});

test('B: Bestwert wird nach "allein geschafft" verglichen, nicht nach Treffern', () => {
  const { ctx, profile } = fresh();
  const id = 'm2.doubleHalf';
  ctx.Progress.saveRound(profile, { topicId: id, solo: 8, helped: 0, failed: 2, total: 10, mode: 'free' });
  ctx.Progress.saveRound(profile, { topicId: id, solo: 3, helped: 7, failed: 0, total: 10, mode: 'free' });
  assert.strictEqual(profile.sessions[id].best['10'].solo, 8,
    '10 Treffer mit viel Hilfe schlagen 8 selbstständige nicht');
});

test('B: Sterne einer Runde richten sich nach der Quote', () => {
  const { ctx } = fresh();
  assert.strictEqual(ctx.Progress.roundStars({ solo: 5, helped: 0, failed: 0, total: 5 }), 3);
  assert.strictEqual(ctx.Progress.roundStars({ solo: 9, helped: 0, failed: 1, total: 10 }), 3);
  assert.strictEqual(ctx.Progress.roundStars({ solo: 6, helped: 0, failed: 4, total: 10 }), 1);
  assert.strictEqual(ctx.Progress.roundStars({ solo: 0, helped: 0, failed: 10, total: 10 }), 0);
});

// ── Befund C: Hilfe zählt nicht wie selbstständiges Lösen ──────────────────

test('C: drei Zustände werden getrennt gezählt', () => {
  const { ctx, profile } = fresh();
  const id = 'm2.doubleHalf';
  answer(ctx, profile, id, 'solo');
  answer(ctx, profile, id, 'helped');
  answer(ctx, profile, id, 'failed');
  const s = ctx.Progress.getSkill(profile, id);
  assert.deepStrictEqual([s.solo, s.helped, s.failed, s.attempts], [1, 1, 1, 3]);
});

test('C: nur selbstständige Erstversuche zählen für die Stufe', () => {
  const { ctx, profile } = fresh();
  const id = 'm2.doubleHalf';
  for (let i = 0; i < 10; i++) answer(ctx, profile, id, 'helped');
  ctx.Progress.reviewLevelAfterRound(profile, id, 'practice');
  const change = ctx.Progress.reviewLevelAfterRound(profile, id, 'practice');
  assert.ok(change === null || change.to < change.from,
    'nur mit Hilfe gelöste Aufgaben dürfen die Stufe nicht anheben');
  assert.ok(ctx.Progress.getLevel(profile, id) <= 1);
});

test('C: kein Bonus, wenn Hilfe oder Korrektur im Spiel war', () => {
  const { ctx } = fresh();
  const perfect = ctx.Rewards.starsForRound({ solo: 5, helped: 0, failed: 0, total: 5 });
  assert.strictEqual(perfect.perfect, true);
  assert.strictEqual(perfect.bonus, ctx.Rewards.PERFECT_BONUS);

  const withHelp = ctx.Rewards.starsForRound({ solo: 4, helped: 1, failed: 0, total: 5 });
  assert.strictEqual(withHelp.perfect, false);
  assert.strictEqual(withHelp.bonus, 0, 'kein Bonus für eine "fehlerfreie" Runde mit Hilfe');
  assert.ok(withHelp.total > 0, 'Anstrengung wird trotzdem anerkannt');
});

// ── Befund E: Wiederholungen ───────────────────────────────────────────────

test('E: mehrere Fehlversuche derselben Aufgabe erzeugen einen Eintrag', () => {
  const { ctx, profile } = fresh();
  const item = { taskId: 'm2.addOhneUebergang#ao-34+5', topicId: 'm2.addOhneUebergang' };
  ctx.Progress.queueRetry(profile, item);
  ctx.Progress.queueRetry(profile, item);
  ctx.Progress.queueRetry(profile, item);
  assert.strictEqual(profile.retry.length, 1);
  assert.strictEqual(profile.retry[0].tries, 3, 'Versuche werden mitgezählt');
});

test('E: verschiedene Rechnungen mit gleichem Ergebnis sind verschiedene Aufgaben', () => {
  const { ctx, profile } = fresh();
  ctx.Progress.queueRetry(profile, { taskId: 'm2.addOhneUebergang#ao-15+5', topicId: 'm2.addOhneUebergang' });
  ctx.Progress.queueRetry(profile, { taskId: 'm2.addOhneUebergang#ao-10+10', topicId: 'm2.addOhneUebergang' });
  assert.strictEqual(profile.retry.length, 2);
});

test('E: offene Wiederholungen überleben das Rundenende', () => {
  const { ctx, profile } = fresh();
  ctx.Progress.queueRetry(profile, {
    taskId: 'm2.addOhneUebergang#ao-34+5', topicId: 'm2.addOhneUebergang', dueAt: Date.now() - 1000,
  });
  ctx.Storage.saveProfile(profile);
  const reloaded = ctx.Storage.getActiveProfile();
  assert.strictEqual(reloaded.retry.length, 1);
  assert.strictEqual(ctx.Progress.dueRetries(reloaded).length, 1);
});

test('E: eine allein gelöste Aufgabe schließt ihre Wiederholung ab', () => {
  const { ctx, profile } = fresh();
  const taskId = 'm2.addOhneUebergang#ao-34+5';
  ctx.Progress.queueRetry(profile, { taskId, topicId: 'm2.addOhneUebergang' });
  assert.strictEqual(ctx.Progress.resolveRetry(profile, taskId), true);
  assert.strictEqual(profile.retry.length, 0);
});

test('E: Wiederholungsabstände wachsen bei Erfolg und werden bei Fehlern kurz', () => {
  const { ctx, profile } = fresh();
  const id = 'm2.doubleHalf';
  answer(ctx, profile, id, 'solo');
  const afterOne = ctx.Progress.getSkill(profile, id).box;
  answer(ctx, profile, id, 'solo');
  const afterTwo = ctx.Progress.getSkill(profile, id).box;
  assert.ok(afterTwo > afterOne, 'Box wächst bei Erfolg');
  answer(ctx, profile, id, 'failed');
  assert.strictEqual(ctx.Progress.getSkill(profile, id).box, 1, 'Fehler setzt zurück auf Box 1');
});

// ── Rundenplanung ──────────────────────────────────────────────────────────

test('Rundenplanung liefert die gewünschte Länge aus freigegebenen Themen', () => {
  const { ctx, profile } = fresh();
  const pool = Object.keys(profile.unlocked).filter(id => profile.unlocked[id]);
  const rng = ctx.Util.makeRng(42);
  const plan = ctx.Progress.planRound(profile, { length: 10, pool, rng });
  assert.strictEqual(plan.length, 10);
  plan.forEach(id => assert.ok(pool.includes(id), 'nur freigegebene Themen: ' + id));
});

test('Rundenplanung zeigt nicht dreimal dasselbe Thema hintereinander', () => {
  const { ctx, profile } = fresh();
  const pool = Object.keys(profile.unlocked).filter(id => profile.unlocked[id]);
  for (let seed = 1; seed <= 40; seed++) {
    const plan = ctx.Progress.planRound(profile, { length: 10, pool, rng: ctx.Util.makeRng(seed) });
    for (let i = 2; i < plan.length; i++) {
      assert.ok(!(plan[i] === plan[i - 1] && plan[i] === plan[i - 2]),
        'dreimal hintereinander dasselbe Thema bei seed ' + seed);
    }
  }
});

test('Schwerpunktthemen kommen häufiger vor', () => {
  const { ctx, profile } = fresh();
  const pool = Object.keys(profile.unlocked).filter(id => profile.unlocked[id]);
  const focus = 'm2.stellenwert';
  profile.focusTopics = [focus];
  let hits = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const plan = ctx.Progress.planRound(profile, {
      length: 10, pool, focusTopics: [focus], rng: ctx.Util.makeRng(seed),
    });
    hits += plan.filter(id => id === focus).length;
  }
  assert.ok(hits > 30, 'Schwerpunkt sollte deutlich über dem Zufallsanteil liegen, war ' + hits);
});

// ── Elternansicht ──────────────────────────────────────────────────────────

test('Lernstandszusammenfassung nennt keine Note', () => {
  const { ctx, profile } = fresh();
  const id = 'm2.doubleHalf';
  for (let i = 0; i < 8; i++) answer(ctx, profile, id, 'solo');
  const s = ctx.Progress.skillSummary(profile, id);
  assert.strictEqual(s.status, 'sicher');
  assert.ok(!/[1-5]\s*$/.test(s.statusText));
  assert.ok(s.suggestion.length > 5);
});

test('Vorschläge priorisieren schwierige und ungeübte Themen', () => {
  const { ctx, profile } = fresh();
  const hard = 'm2.doubleHalf';
  const easy = 'm2.stellenwert';
  for (let i = 0; i < 8; i++) answer(ctx, profile, hard, 'failed');
  for (let i = 0; i < 8; i++) answer(ctx, profile, easy, 'solo');
  const list = ctx.Progress.suggestions(profile, 3).map(s => s.topicId);
  assert.strictEqual(list[0], hard, 'das schwierige Thema kommt zuerst: ' + list.join(','));
  assert.ok(!list.includes(easy) || list.indexOf(easy) > 0);
});
