/**
 * tests/storage.test.js
 * Speicherschema, Migration alter Profile, Export und Import.
 *
 * Die Migration ist der heikelste Teil der Überarbeitung: Sie darf unter
 * keinen Umständen vorhandene Lernstände verlieren.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { loadApp, makeMemoryStorage } = require('./harness');

/** Ein realistisches Profil im alten Format (Version 1). */
function v1Profile(overrides) {
  return Object.assign({
    id: 'profile_1735000000000',
    name: 'Luisa',
    avatarId: 'unicorn',
    stars: 47,
    level: 5,
    createdAt: 1735000000000,
    progress: {},
    adaptive: {
      additionRound100: { correct: 18, total: 20, streak: 4, difficulty: 3 },
      subtractionRound100: { correct: 6, total: 15, streak: 0, difficulty: 1 },
      clockReading: { correct: 9, total: 12, streak: 2, difficulty: 2 },
      missingLetter: { correct: 22, total: 30, streak: 1, difficulty: 2 },
      unbekannteUebung: { correct: 3, total: 5, streak: 1, difficulty: 2 },
    },
    sessions: {
      additionRound100: { bestScore: 9, bestTotal: 10, sessionsPlayed: 4, lastScore: 8, lastTotal: 10 },
      subtractionRound100: { bestScore: 5, bestTotal: 5, sessionsPlayed: 2, lastScore: 3, lastTotal: 5 },
      missingLetter: { bestScore: 7, bestTotal: 10, sessionsPlayed: 6, lastScore: 7, lastTotal: 10 },
    },
  }, overrides || {});
}

function withV1Data(profiles, grade) {
  const storage = makeMemoryStorage();
  const map = {};
  profiles.forEach(p => { map[p.id] = p; });
  storage.setItem('lw_profiles', JSON.stringify(map));
  storage.setItem('lw_active_profile', JSON.stringify(profiles[0].id));
  storage.setItem('lw_grade', JSON.stringify(grade || 2));
  return loadApp({ storage, silent: true });
}

// ── Migration ──────────────────────────────────────────────────────────────

test('Migration läuft und meldet keinen Fehlschlag', () => {
  const ctx = withV1Data([v1Profile()]);
  const report = ctx.Storage.runMigrations();
  assert.strictEqual(report.ran, true);
  assert.strictEqual(report.from, 1);
  assert.strictEqual(report.to, 2);
  assert.strictEqual(report.failed.map(f => f.id).join(','), '');
  assert.ok(report.migrated.includes('profile_1735000000000'));
});

test('Migration erhält Name, Sterne, Avatar und Anlagedatum', () => {
  const ctx = withV1Data([v1Profile()]);
  ctx.Storage.runMigrations();
  const p = ctx.Storage.getActiveProfile();
  assert.strictEqual(p.name, 'Luisa');
  assert.strictEqual(p.stars, 47);
  assert.strictEqual(p.avatarId, 'unicorn');
  assert.strictEqual(p.createdAt, 1735000000000);
  assert.strictEqual(p.schemaVersion, 2);
});

test('Migration übernimmt die globale Klassenstufe ins Profil', () => {
  const ctx = withV1Data([v1Profile()], 2);
  ctx.Storage.runMigrations();
  assert.strictEqual(ctx.Storage.getActiveProfile().grade, 2);
});

test('Migration überträgt alte Übungs-IDs auf die neuen Lernziele', () => {
  const ctx = withV1Data([v1Profile()]);
  ctx.Storage.runMigrations();
  const p = ctx.Storage.getActiveProfile();
  assert.ok(p.skills['m2.addOhneUebergang'], 'additionRound100 → m2.addOhneUebergang');
  assert.ok(p.skills['m2.subOhneUebergang'], 'subtractionRound100 → m2.subOhneUebergang');
  assert.ok(p.skills['m2.uhrVolleHalbe'], 'clockReading → m2.uhrVolleHalbe');
  assert.ok(p.skills['g1.missingLetter'], 'missingLetter → g1.missingLetter');
  assert.strictEqual(p.skills['m2.addOhneUebergang'].attempts, 20);
});

test('Migration startet nie über Stufe 2 — der alte Sprung auf 3 wird korrigiert', () => {
  const ctx = withV1Data([v1Profile()]);
  ctx.Storage.runMigrations();
  const p = ctx.Storage.getActiveProfile();
  assert.strictEqual(p.skills['m2.addOhneUebergang'].level, 2,
    'alte Stufe 3 wird auf 2 gedeckelt');
});

test('Migration behauptet nicht, alte Erfolge seien selbstständig gewesen', () => {
  const ctx = withV1Data([v1Profile()]);
  ctx.Storage.runMigrations();
  const s = ctx.Storage.getActiveProfile().skills['m2.addOhneUebergang'];
  assert.strictEqual(s.solo, 0, 'Version 1 unterschied das nicht — also nichts behaupten');
  assert.strictEqual(s.helped, 18);
  assert.strictEqual(s.failed, 2);
});

test('Migration führt Bestwerte mit ihrer Rundenlänge weiter', () => {
  const ctx = withV1Data([v1Profile()]);
  ctx.Storage.runMigrations();
  const s = ctx.Storage.getActiveProfile().sessions['m2.subOhneUebergang'];
  assert.ok(s.best['5'], 'die 5er-Runde bleibt eine 5er-Runde');
  assert.strictEqual(s.best['5'].total, 5);
  assert.strictEqual(s.plays, 2);
});

test('Migration löscht keine Rohdaten', () => {
  const ctx = withV1Data([v1Profile()]);
  ctx.Storage.runMigrations();
  const p = ctx.Storage.getActiveProfile();
  assert.ok(p.legacy_v1, 'v1-Rohdaten bleiben im Profil');
  assert.strictEqual(p.legacy_v1.adaptive.unbekannteUebung.total, 5,
    'auch unbekannte Übungs-IDs bleiben erhalten');
  const backup = ctx.Storage.getBackupInfo();
  assert.ok(backup, 'zusätzlich liegt eine Sicherung des Rohstands vor');
});

test('Migration läuft nur einmal', () => {
  const ctx = withV1Data([v1Profile()]);
  ctx.Storage.runMigrations();
  const second = ctx.Storage.runMigrations();
  assert.strictEqual(second.ran, false);
  assert.strictEqual(second.migrated.length, 0);
});

test('Migration verkraftet mehrere Profile und beschädigte Einträge', () => {
  const good = v1Profile();
  const broken = v1Profile({ id: 'profile_broken', adaptive: null, sessions: null });
  const ctx = withV1Data([good, broken]);
  const report = ctx.Storage.runMigrations();
  assert.strictEqual(report.failed.length, 0);
  assert.strictEqual(ctx.Storage.listProfiles().length, 2);
  const b = ctx.Storage.getProfile('profile_broken');
  assert.ok(b, 'auch das beschädigte Profil bleibt vorhanden');
  assert.strictEqual(b.name, 'Luisa');
});

test('Ohne Sicherungsmöglichkeit wird nicht migriert', () => {
  const storage = makeMemoryStorage();
  const p = v1Profile();
  storage.setItem('lw_profiles', JSON.stringify({ [p.id]: p }));
  storage.setItem('lw_active_profile', JSON.stringify(p.id));
  // Ab jetzt schlägt jedes Schreiben fehl.
  const original = storage.setItem.bind(storage);
  storage.setItem = () => { const e = new Error('voll'); e.name = 'QuotaExceededError'; throw e; };

  const ctx = loadApp({ storage, silent: true });
  const report = ctx.Storage.runMigrations();
  assert.strictEqual(report.ran, false);
  assert.ok(report.failed.length > 0);
  storage.setItem = original;
  const raw = JSON.parse(storage.getItem('lw_profiles'));
  assert.strictEqual(raw[p.id].adaptive.additionRound100.total, 20,
    'die Originaldaten sind unverändert');
});

test('Neuinstallation ohne Daten migriert sauber', () => {
  const ctx = loadApp({ silent: true });
  const report = ctx.Storage.runMigrations();
  assert.strictEqual(report.ran, true);
  assert.strictEqual(report.migrated.length, 0);
  assert.strictEqual(ctx.Storage.listProfiles().length, 0);
});

// ── Speicherfehler ─────────────────────────────────────────────────────────

test('Speicherfehler werden gemeldet, nicht verschluckt', () => {
  const storage = makeMemoryStorage({ readOnly: true });
  const ctx = loadApp({ storage, silent: true });
  const seen = [];
  ctx.Storage.onError(err => seen.push(err));
  const p = ctx.Storage.newProfile('Test', 'fox', 2);
  const ok = ctx.Storage.saveProfile(p);
  assert.strictEqual(ok, false);
  assert.ok(seen.length > 0, 'ein Fehlerereignis wird ausgelöst');
  assert.strictEqual(seen[0].kind, 'quota');
  assert.ok(ctx.Storage.getLastError());
});

test('isAvailable erkennt einen gesperrten Speicher', () => {
  const ro = loadApp({ storage: makeMemoryStorage({ readOnly: true }), silent: true });
  assert.strictEqual(ro.Storage.isAvailable(), false);
  const ok = loadApp({ silent: true });
  assert.strictEqual(ok.Storage.isAvailable(), true);
});

// ── Export und Import ──────────────────────────────────────────────────────

function seeded() {
  const ctx = loadApp({ silent: true });
  const p = ctx.Storage.newProfile('Luisa', 'unicorn', 2);
  p.stars = 33;
  p.learnWords = [{ word: 'Fahrrad', addedAt: 1 }];
  ctx.Storage.saveProfile(p);
  ctx.Storage.setActiveProfileId(p.id);
  return ctx;
}

test('Export enthält Kennung, Version und alle Profile', () => {
  const ctx = seeded();
  const data = ctx.Storage.exportData();
  assert.strictEqual(data.app, 'lernwelten');
  assert.strictEqual(data.schemaVersion, ctx.Storage.SCHEMA_VERSION);
  assert.strictEqual(Object.keys(data.profiles).length, 1);
  assert.ok(/lernwelten-sicherung-\d{4}-\d{2}-\d{2}\.json/.test(ctx.Storage.exportFilename()));
});

test('Import weist fremde und kaputte Dateien ab', () => {
  const ctx = seeded();
  const cases = [
    null,
    'kein Objekt',
    {},
    { app: 'etwas anderes', schemaVersion: 2, profiles: {} },
    { app: 'lernwelten', schemaVersion: 2, profiles: [] },
    { app: 'lernwelten', schemaVersion: 99, profiles: { x: { name: 'A' } } },
    { app: 'lernwelten', schemaVersion: 2, profiles: { x: { name: '' } } },
  ];
  cases.forEach((c, i) => {
    const res = ctx.Storage.validateImport(c);
    assert.strictEqual(res.ok, false, 'Fall ' + i + ' hätte abgelehnt werden müssen');
    assert.ok(res.errors.length > 0);
  });
});

test('Export und Import stellen den Lernstand wieder her', () => {
  const source = seeded();
  const backup = source.Storage.exportData();

  const target = loadApp({ silent: true });
  const check = target.Storage.validateImport(JSON.parse(JSON.stringify(backup)));
  assert.strictEqual(check.ok, true, check.errors.join(', '));
  const result = target.Storage.applyImport(check, 'replace');
  assert.strictEqual(result.ok, true);

  const p = target.Storage.getActiveProfile();
  assert.strictEqual(p.name, 'Luisa');
  assert.strictEqual(p.stars, 33);
  assert.strictEqual(p.learnWords[0].word, 'Fahrrad');
});

test('Import einer alten Sicherung migriert mit', () => {
  const old = {
    app: 'lernwelten',
    schemaVersion: 1,
    profiles: { [v1Profile().id]: v1Profile() },
  };
  const ctx = loadApp({ silent: true });
  const check = ctx.Storage.validateImport(old);
  assert.strictEqual(check.ok, true, check.errors.join(', '));
  const p = check.profiles[v1Profile().id];
  assert.strictEqual(p.schemaVersion, 2);
  assert.ok(p.skills['m2.addOhneUebergang']);
});

test('Import "ergänzen" behält bestehende Profile', () => {
  const ctx = seeded();
  const other = ctx.Storage.newProfile('Max', 'bear', 1);
  const foreign = {
    app: 'lernwelten', schemaVersion: 2, profiles: { [other.id]: other },
  };
  const check = ctx.Storage.validateImport(foreign);
  ctx.Storage.applyImport(check, 'merge');
  const names = ctx.Storage.listProfiles().map(p => p.name).sort();
  assert.strictEqual(names.join(','), 'Luisa,Max');
});

test('Import "ersetzen" legt vorher eine Rücksicherung an', () => {
  const ctx = seeded();
  const other = ctx.Storage.newProfile('Max', 'bear', 1);
  const check = ctx.Storage.validateImport({
    app: 'lernwelten', schemaVersion: 2, profiles: { [other.id]: other },
  });
  ctx.Storage.applyImport(check, 'replace');
  assert.strictEqual(ctx.Storage.listProfiles().map(p => p.name).join(','), 'Max');
  const rollback = ctx.Storage._read('lw_backup_before_import');
  assert.ok(rollback && Object.keys(rollback.profiles).length === 1,
    'der vorherige Stand ist gesichert');
});

test('Import säubert überlange und unpassende Felder', () => {
  const ctx = loadApp({ silent: true });
  const evil = {
    app: 'lernwelten', schemaVersion: 2,
    profiles: {
      x: {
        id: 'x', schemaVersion: 2, name: 'A'.repeat(200), grade: 9, stars: -50,
        learnWords: new Array(500).fill({ word: 'W'.repeat(90) }),
        retry: new Array(900).fill({ topicId: 'm2.doubleHalf', taskId: 'a' }),
      },
    },
  };
  const check = ctx.Storage.validateImport(evil);
  assert.strictEqual(check.ok, true);
  const p = check.profiles.x;
  assert.ok(p.name.length <= 24);
  assert.ok(p.grade === 1 || p.grade === 2);
  assert.ok(p.stars >= 0);
  assert.ok(p.learnWords.length <= 200);
  assert.ok(p.learnWords[0].word.length <= 30);
  assert.ok(p.retry.length <= 300);
});

// ── Profilverwaltung ───────────────────────────────────────────────────────

test('Profile lassen sich anlegen, wechseln und löschen', () => {
  const ctx = loadApp({ silent: true });
  const a = ctx.Storage.newProfile('Luisa', 'fox', 2);
  const b = ctx.Storage.newProfile('Max', 'bear', 1);
  ctx.Storage.saveProfile(a);
  ctx.Storage.saveProfile(b);
  ctx.Storage.setActiveProfileId(a.id);
  assert.strictEqual(ctx.Storage.getActiveProfile().name, 'Luisa');

  ctx.Storage.setActiveProfileId(b.id);
  assert.strictEqual(ctx.Storage.getActiveProfile().name, 'Max');
  assert.strictEqual(ctx.Storage.getActiveProfile().grade, 1);

  ctx.Storage.deleteProfile(b.id);
  assert.strictEqual(ctx.Storage.listProfiles().length, 1);
  assert.strictEqual(ctx.Storage.getActiveProfile().name, 'Luisa',
    'nach dem Löschen wird auf ein vorhandenes Profil gewechselt');
});

test('Klassenwechsel behält den Lernstand und ergänzt Freigaben', () => {
  const ctx = loadApp({ silent: true });
  const p = ctx.Storage.newProfile('Luisa', 'fox', 1);
  ctx.Storage.saveProfile(p);
  ctx.Storage.setActiveProfileId(p.id);
  const before = ctx.Storage.getActiveProfile();
  ctx.Progress.recordAttempt(before, {
    topicId: 'g1.addition', taskId: 'g1.addition#x', outcome: 'solo', level: 1,
  });
  before.skills['g1.addition'].attempts = 5;
  ctx.Storage.saveProfile(before);

  ctx.Storage.setGrade(2);
  const after = ctx.Storage.getActiveProfile();
  assert.strictEqual(after.grade, 2);
  assert.strictEqual(after.skills['g1.addition'].attempts, 5, 'Lernstand bleibt');
  assert.ok(after.unlocked['m2.stellenwert'], 'Themen der 2. Klasse sind ergänzt');
  assert.ok(after.unlocked['g1.addition'] !== false, 'alte Freigaben bleiben');
});

test('Ein aktiver Zeiger ins Leere fällt auf ein vorhandenes Profil zurück', () => {
  const ctx = loadApp({ silent: true });
  const p = ctx.Storage.newProfile('Luisa', 'fox', 2);
  ctx.Storage.saveProfile(p);
  ctx.Storage.setActiveProfileId('gibt-es-nicht');
  const active = ctx.Storage.getActiveProfile();
  assert.ok(active);
  assert.strictEqual(active.name, 'Luisa');
});
