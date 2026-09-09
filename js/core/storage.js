/**
 * core/storage.js
 * Zentrale Persistenz. Alle anderen Module greifen ausschließlich hierüber
 * auf localStorage zu.
 *
 * Schema-Versionierung
 * ────────────────────
 * v1  Ursprüngliches Format: profile.adaptive[exerciseId] und
 *     profile.sessions[exerciseId] mit alten Übungs-IDs.
 * v2  Aktuelles Format: profile.skills[topicId] (Lernstand pro Lernziel),
 *     profile.sessions[topicId] (Bestwerte getrennt nach Rundenlänge),
 *     Klassenstufe im Profil, Freigaben, Lernwörter, Wiederholungen.
 *
 * Migrationsregeln (bewusst konservativ):
 *   • Vor der ersten Migration wird der unveränderte v1-Rohstand unter
 *     `lw_backup_v1` gesichert. Er wird NIE automatisch gelöscht.
 *   • Die v1-Felder `adaptive` und `sessions_v1` bleiben im Profil erhalten.
 *   • Schlägt eine Migration fehl, bleibt das Originalprofil unangetastet
 *     und wird weiterhin ausgeliefert; es gibt keinen stillen Reset.
 */

const Storage = (() => {

  const SCHEMA_VERSION = 2;

  const KEYS = {
    PROFILES:       'lw_profiles',
    ACTIVE_PROFILE: 'lw_active_profile',
    GRADE:          'lw_grade',          // v1-Rest: globale Klassenstufe
    BACKUP_V1:      'lw_backup_v1',
    SCHEMA:         'lw_schema_version',
    MIGRATION_LOG:  'lw_migration_log',
  };

  // Speicher-Backend. In Tests kann ein einfaches Objekt injiziert werden.
  let backend = (typeof localStorage !== 'undefined') ? localStorage : null;

  function _setBackend(b) { backend = b; }

  // ─── Fehlerbehandlung ─────────────────────────────────────────────────────
  // Speicherfehler dürfen nicht nur in der Konsole landen (Bericht, Abschnitt 3).

  const errorListeners = [];
  let lastError = null;

  function onError(fn) { errorListeners.push(fn); }

  function _reportError(kind, err, detail) {
    lastError = {
      kind,                       // 'read' | 'write' | 'quota' | 'unavailable'
      message: (err && err.message) || String(err || ''),
      detail: detail || '',
      at: Date.now(),
    };
    try { console.error('[Storage]', kind, err, detail); } catch (e) { /* egal */ }
    errorListeners.forEach(fn => {
      try { fn(lastError); } catch (e) { /* Listener darf nichts kaputtmachen */ }
    });
  }

  function getLastError() { return lastError; }
  function clearLastError() { lastError = null; }

  function isQuotaError(err) {
    if (!err) return false;
    return err.name === 'QuotaExceededError' ||
           err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
           err.code === 22 || err.code === 1014;
  }

  /** Ist Schreiben überhaupt möglich? (Privater Modus, gesperrter Speicher …) */
  function isAvailable() {
    if (!backend) return false;
    try {
      backend.setItem('lw_probe', '1');
      backend.removeItem('lw_probe');
      return true;
    } catch (e) {
      return false;
    }
  }

  function _read(key) {
    if (!backend) return null;
    try {
      const raw = backend.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      _reportError('read', e, key);
      return null;
    }
  }

  function _readRaw(key) {
    if (!backend) return null;
    try { return backend.getItem(key); } catch (e) { _reportError('read', e, key); return null; }
  }

  function _write(key, value) {
    if (!backend) { _reportError('unavailable', new Error('kein Speicher'), key); return false; }
    try {
      backend.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      _reportError(isQuotaError(e) ? 'quota' : 'write', e, key);
      return false;
    }
  }

  // ─── Profil-Vorlage ───────────────────────────────────────────────────────

  function emptySkill() {
    return {
      level: 1,           // Schwierigkeitsstufe 1–3
      levelSince: 0,      // Zeitpunkt des letzten Stufenwechsels
      roundsOnLevel: 0,   // abgeschlossene Runden auf dieser Stufe
      firstTry: [],       // jüngste Erstversuche: 1 = allein richtig, 0 = nicht
      solo: 0,            // allein geschafft (gesamt)
      helped: 0,          // mit Hilfe/nach Korrektur geschafft
      failed: 0,          // nicht geschafft
      attempts: 0,
      last: 0,            // Zeitpunkt der letzten Aufgabe
      box: 1,             // Wiederholungsbox 1–5
      dueAt: 0,           // frühester sinnvoller Wiederholungszeitpunkt
    };
  }

  function newProfile(name, avatarId, grade) {
    const g = grade === 2 ? 2 : 1;
    return {
      id: 'profile_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      schemaVersion: SCHEMA_VERSION,
      name: String(name || '').trim().slice(0, 24),
      avatarId: avatarId || 'fox',
      grade: g,
      createdAt: Date.now(),
      stars: 0,
      level: 1,
      settings: {
        roundLength: 10,
        reduceMotion: false,
        showInstallHint: true,
      },
      unlocked: Topics.defaultUnlocked(g).reduce((acc, id) => { acc[id] = true; return acc; }, {}),
      skills: {},
      sessions: {},
      retry: [],
      learnWords: [],
      book: { series: g === 2 ? 'zahlenreise2' : null, volume: g === 2 ? 1 : null, page: null },
      focusTopics: [],    // aktuelle Lernziele für "Heute üben"
      daily: { lastDay: null, rounds: 0 },
      album: { unlocked: [] },
    };
  }

  // ─── Migration ────────────────────────────────────────────────────────────

  /** Baut aus den v1-Adaptivdaten einen groben Startlernstand. */
  function _migrateSkillFromV1(v1stats) {
    const s = emptySkill();
    if (!v1stats) return s;
    const total = Number(v1stats.total) || 0;
    const correct = Math.min(Number(v1stats.correct) || 0, total);
    s.attempts = total;
    // In v1 wurde nicht zwischen "allein" und "mit Hilfe" unterschieden.
    // Wir übernehmen die richtigen Antworten als "mit Hilfe geschafft",
    // damit der neue Lernstand nichts behauptet, was nicht belegt ist.
    s.helped = correct;
    s.failed = Math.max(0, total - correct);
    // Stufe übernehmen, aber nie über 2 starten: v1 konnte nach sechs
    // leichten Erfolgen auf Stufe 3 springen (Bericht, Abschnitt 2 A).
    const lvl = Number(v1stats.difficulty) || 1;
    s.level = Math.min(2, Math.max(1, lvl));
    return s;
  }

  function _migrateProfileV1toV2(old, globalGrade) {
    const p = Util.clone(old);
    const grade = p.grade === 2 || globalGrade === 2 ? 2 : 1;

    p.schemaVersion = 2;
    p.grade = grade;
    p.stars = Number(p.stars) || 0;
    p.level = Number(p.level) || 1;
    p.createdAt = Number(p.createdAt) || Date.now();
    p.name = String(p.name || 'Kind').slice(0, 24);
    p.avatarId = p.avatarId || 'fox';

    p.settings = Object.assign({ roundLength: 10, reduceMotion: false, showInstallHint: true },
      p.settings || {});
    p.unlocked = p.unlocked || Topics.defaultUnlocked(grade)
      .reduce((acc, id) => { acc[id] = true; return acc; }, {});
    p.skills = p.skills || {};
    p.retry = Array.isArray(p.retry) ? p.retry : [];
    p.learnWords = Array.isArray(p.learnWords) ? p.learnWords : [];
    p.book = p.book || { series: grade === 2 ? 'zahlenreise2' : null, volume: grade === 2 ? 1 : null, page: null };
    p.focusTopics = Array.isArray(p.focusTopics) ? p.focusTopics : [];
    p.daily = p.daily || { lastDay: null, rounds: 0 };
    p.album = p.album || { unlocked: [] };

    // v1-Adaptivdaten → skills
    const v1adaptive = old.adaptive || {};
    Object.keys(v1adaptive).forEach(oldId => {
      const topicId = Topics.fromLegacyId(oldId);
      if (!topicId) return;                 // unbekannte ID: Rohdaten bleiben erhalten
      if (p.skills[topicId]) return;        // schon migriert
      p.skills[topicId] = _migrateSkillFromV1(v1adaptive[oldId]);
    });

    // v1-Sessiondaten → sessions (Bestwert nach Rundenlänge getrennt)
    const v1sessions = old.sessions || {};
    const newSessions = {};
    Object.keys(v1sessions).forEach(oldId => {
      const topicId = Topics.fromLegacyId(oldId);
      const src = v1sessions[oldId] || {};
      if (!topicId) return;
      const length = Number(src.bestTotal) || 10;
      const solo = Math.min(Number(src.bestScore) || 0, length);
      newSessions[topicId] = {
        plays: Number(src.sessionsPlayed) || 0,
        best: { [String(length)]: { solo: 0, done: solo, total: length, at: 0 } },
        last: {
          solo: 0,
          helped: Math.min(Number(src.lastScore) || 0, Number(src.lastTotal) || length),
          done: Math.min(Number(src.lastScore) || 0, Number(src.lastTotal) || length),
          total: Number(src.lastTotal) || length,
          at: 0,
        },
      };
    });
    // v1-Rohdaten aufheben, nicht überschreiben
    p.legacy_v1 = {
      adaptive: Util.clone(old.adaptive || {}),
      sessions: Util.clone(old.sessions || {}),
      progress: Util.clone(old.progress || {}),
      migratedAt: Date.now(),
    };
    delete p.adaptive;
    p.sessions = newSessions;

    return p;
  }

  /**
   * Führt eine Migration aller Profile durch.
   * Gibt einen Bericht zurück; wirft nie.
   */
  function runMigrations() {
    const report = { ran: false, migrated: [], failed: [], from: null, to: SCHEMA_VERSION };
    const stored = _read(KEYS.SCHEMA);
    const currentVersion = Number(stored) || 1;
    report.from = currentVersion;
    if (currentVersion >= SCHEMA_VERSION) return report;

    const rawProfiles = _readRaw(KEYS.PROFILES);
    if (!rawProfiles) {
      // Nichts zu migrieren — Version trotzdem setzen.
      _write(KEYS.SCHEMA, SCHEMA_VERSION);
      report.ran = true;
      return report;
    }

    // Rohstand sichern, bevor irgendetwas geändert wird.
    if (!_readRaw(KEYS.BACKUP_V1)) {
      try {
        backend.setItem(KEYS.BACKUP_V1, JSON.stringify({
          savedAt: Date.now(),
          schemaVersion: currentVersion,
          profiles: rawProfiles,
          activeProfileId: _readRaw(KEYS.ACTIVE_PROFILE),
          grade: _readRaw(KEYS.GRADE),
        }));
      } catch (e) {
        // Ohne Sicherung wird NICHT migriert — lieber alte App-Logik als Datenverlust.
        _reportError(isQuotaError(e) ? 'quota' : 'write', e, 'Migrationssicherung');
        report.failed.push({ id: '*', reason: 'Sicherung fehlgeschlagen' });
        return report;
      }
    }

    let profiles;
    try {
      profiles = JSON.parse(rawProfiles) || {};
    } catch (e) {
      _reportError('read', e, KEYS.PROFILES);
      report.failed.push({ id: '*', reason: 'Profile nicht lesbar' });
      return report;
    }

    const globalGrade = Number(_read(KEYS.GRADE)) || null;
    const out = {};
    Object.keys(profiles).forEach(id => {
      const old = profiles[id];
      try {
        out[id] = (Number(old && old.schemaVersion) >= 2)
          ? old
          : _migrateProfileV1toV2(old, globalGrade);
        report.migrated.push(id);
      } catch (e) {
        out[id] = old;                       // Original unverändert behalten
        report.failed.push({ id, reason: (e && e.message) || 'unbekannt' });
        _reportError('write', e, 'Migration Profil ' + id);
      }
    });

    if (_write(KEYS.PROFILES, out)) {
      _write(KEYS.SCHEMA, SCHEMA_VERSION);
      _write(KEYS.MIGRATION_LOG, report);
      report.ran = true;
    }
    return report;
  }

  function getBackupInfo() {
    const b = _read(KEYS.BACKUP_V1);
    if (!b) return null;
    return { savedAt: b.savedAt, schemaVersion: b.schemaVersion };
  }

  function getMigrationLog() { return _read(KEYS.MIGRATION_LOG); }

  // ─── Profile ──────────────────────────────────────────────────────────────

  function getAllProfiles() {
    return _read(KEYS.PROFILES) || {};
  }

  function listProfiles() {
    const all = getAllProfiles();
    return Object.keys(all)
      .map(id => all[id])
      .filter(Boolean)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  function getProfile(id) {
    const p = getAllProfiles()[id];
    return p ? _ensureShape(p) : null;
  }

  /** Ergänzt fehlende Felder, ohne bestehende Werte zu verändern. */
  function _ensureShape(p) {
    if (!p.skills) p.skills = {};
    if (!p.sessions) p.sessions = {};
    if (!Array.isArray(p.retry)) p.retry = [];
    if (!Array.isArray(p.learnWords)) p.learnWords = [];
    if (!Array.isArray(p.focusTopics)) p.focusTopics = [];
    if (!p.settings) p.settings = { roundLength: 10, reduceMotion: false, showInstallHint: true };
    if (p.settings.roundLength !== 5 && p.settings.roundLength !== 10) p.settings.roundLength = 10;
    if (!p.unlocked) {
      p.unlocked = Topics.defaultUnlocked(p.grade === 2 ? 2 : 1)
        .reduce((acc, id) => { acc[id] = true; return acc; }, {});
    }
    if (!p.album) p.album = { unlocked: [] };
    if (!Array.isArray(p.album.unlocked)) p.album.unlocked = [];
    if (!p.daily) p.daily = { lastDay: null, rounds: 0 };
    if (!p.book) p.book = { series: null, volume: null, page: null };
    if (p.grade !== 1 && p.grade !== 2) p.grade = 1;
    p.stars = Number(p.stars) || 0;
    p.level = Math.floor(p.stars / 10) + 1;
    return p;
  }

  function saveProfile(profile) {
    if (!profile || !profile.id) return false;
    const profiles = getAllProfiles();
    profiles[profile.id] = profile;
    return _write(KEYS.PROFILES, profiles);
  }

  function deleteProfile(id) {
    const profiles = getAllProfiles();
    if (!profiles[id]) return false;
    delete profiles[id];
    const ok = _write(KEYS.PROFILES, profiles);
    if (ok && getActiveProfileId() === id) {
      const remaining = Object.keys(profiles);
      setActiveProfileId(remaining.length ? remaining[0] : null);
    }
    return ok;
  }

  function getActiveProfileId() { return _read(KEYS.ACTIVE_PROFILE); }
  function setActiveProfileId(id) { return _write(KEYS.ACTIVE_PROFILE, id); }

  function getActiveProfile() {
    const id = getActiveProfileId();
    const p = id ? getProfile(id) : null;
    if (p) return p;
    // Fällt der aktive Zeiger ins Leere, das zuletzt angelegte Profil nehmen.
    const list = listProfiles();
    if (list.length) { setActiveProfileId(list[0].id); return _ensureShape(list[0]); }
    return null;
  }

  /**
   * Änderung am aktiven Profil vornehmen und speichern.
   * @param {function} fn - bekommt das Profil, verändert es in place
   * @returns {object|null} das gespeicherte Profil
   */
  function updateActive(fn) {
    const p = getActiveProfile();
    if (!p) return null;
    fn(p);
    p.level = Math.floor((Number(p.stars) || 0) / 10) + 1;
    saveProfile(p);
    return p;
  }

  // ─── Klassenstufe ─────────────────────────────────────────────────────────
  // Die Klassenstufe gehört ab v2 zum Profil. Der globale Schlüssel bleibt
  // als Rückfallebene für den allerersten Start ohne Profil erhalten.

  function getGrade() {
    const p = getActiveProfile();
    if (p) return p.grade;
    const g = _read(KEYS.GRADE);
    return g === 2 ? 2 : (g === 1 ? 1 : null);
  }

  function setGrade(grade) {
    const g = grade === 2 ? 2 : 1;
    _write(KEYS.GRADE, g);
    const p = getActiveProfile();
    if (p) {
      p.grade = g;
      // Freigaben für die neue Stufe ergänzen, bestehende nie entfernen.
      Topics.defaultUnlocked(g).forEach(id => { if (!(id in p.unlocked)) p.unlocked[id] = true; });
      saveProfile(p);
    }
    return true;
  }

  // ─── Export / Import ──────────────────────────────────────────────────────

  function exportData() {
    return {
      app: 'lernwelten',
      kind: 'backup',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: Date.now(),
      activeProfileId: getActiveProfileId(),
      profiles: getAllProfiles(),
    };
  }

  function exportFilename() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `lernwelten-sicherung-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
  }

  /**
   * Prüft eine importierte Datei streng, bevor irgendetwas geschrieben wird.
   * Gibt { ok, errors[], warnings[], profiles, count } zurück.
   */
  function validateImport(data) {
    const errors = [];
    const warnings = [];

    if (!data || typeof data !== 'object') {
      return { ok: false, errors: ['Die Datei enthält keine gültigen Daten.'], warnings, profiles: {}, count: 0 };
    }
    if (data.app !== 'lernwelten') {
      errors.push('Das ist keine Lernwelten-Sicherung.');
    }
    const version = Number(data.schemaVersion);
    if (!version || version < 1) {
      errors.push('Die Sicherung hat keine erkennbare Version.');
    } else if (version > SCHEMA_VERSION) {
      errors.push('Die Sicherung stammt aus einer neueren App-Version. Bitte zuerst die App aktualisieren.');
    }
    if (!data.profiles || typeof data.profiles !== 'object' || Array.isArray(data.profiles)) {
      errors.push('In der Sicherung sind keine Profile enthalten.');
      return { ok: false, errors, warnings, profiles: {}, count: 0 };
    }

    const cleaned = {};
    let count = 0;
    Object.keys(data.profiles).forEach(id => {
      const raw = data.profiles[id];
      if (!raw || typeof raw !== 'object') { warnings.push(`Profil "${id}" wurde übersprungen.`); return; }
      if (typeof raw.name !== 'string' || !raw.name.trim()) {
        warnings.push(`Profil "${id}" hat keinen Namen und wurde übersprungen.`);
        return;
      }
      let p;
      try {
        p = (Number(raw.schemaVersion) >= 2) ? Util.clone(raw) : _migrateProfileV1toV2(raw, null);
      } catch (e) {
        warnings.push(`Profil "${raw.name}" konnte nicht gelesen werden.`);
        return;
      }
      p.id = String(raw.id || id);
      p.name = String(p.name).trim().slice(0, 24);
      p.stars = Math.max(0, Math.floor(Number(p.stars) || 0));
      p.grade = p.grade === 2 ? 2 : 1;
      p.learnWords = (Array.isArray(p.learnWords) ? p.learnWords : [])
        .filter(w => w && typeof w.word === 'string')
        .slice(0, 200)
        .map(w => ({ word: String(w.word).slice(0, 30), addedAt: Number(w.addedAt) || Date.now() }));
      p.retry = (Array.isArray(p.retry) ? p.retry : [])
        .filter(r => r && typeof r.topicId === 'string')
        .slice(0, 300);
      cleaned[p.id] = _ensureShape(p);
      count++;
    });

    if (count === 0) errors.push('Die Sicherung enthält kein lesbares Profil.');

    return { ok: errors.length === 0, errors, warnings, profiles: cleaned, count };
  }

  /**
   * Übernimmt geprüfte Profile.
   * mode 'merge'   – bestehende Profile bleiben, gleiche IDs werden ersetzt
   * mode 'replace' – alle bisherigen Profile werden ersetzt
   * Vor dem Schreiben wird der aktuelle Stand als Sicherung abgelegt.
   */
  function applyImport(validated, mode) {
    if (!validated || !validated.ok) return { ok: false, error: 'Import wurde nicht geprüft.' };

    const before = getAllProfiles();
    const rollbackKey = 'lw_backup_before_import';
    _write(rollbackKey, { savedAt: Date.now(), profiles: before, activeProfileId: getActiveProfileId() });

    const next = mode === 'replace' ? {} : Object.assign({}, before);
    Object.keys(validated.profiles).forEach(id => { next[id] = validated.profiles[id]; });

    if (!_write(KEYS.PROFILES, next)) {
      return { ok: false, error: 'Die Daten konnten nicht gespeichert werden. Es wurde nichts verändert.' };
    }
    _write(KEYS.SCHEMA, SCHEMA_VERSION);

    const ids = Object.keys(next);
    if (!getActiveProfileId() || !next[getActiveProfileId()]) {
      setActiveProfileId(ids.length ? ids[0] : null);
    }
    return { ok: true, count: validated.count, imported: Object.keys(validated.profiles) };
  }

  // ─── Sterne ───────────────────────────────────────────────────────────────

  function addStars(profileId, count) {
    const profile = getProfile(profileId);
    if (!profile) return false;
    profile.stars = Math.max(0, (Number(profile.stars) || 0) + count);
    profile.level = Math.floor(profile.stars / 10) + 1;
    return saveProfile(profile);
  }

  return {
    SCHEMA_VERSION, KEYS,
    _setBackend, _ensureShape, emptySkill, newProfile,
    isAvailable, onError, getLastError, clearLastError,
    runMigrations, getBackupInfo, getMigrationLog,
    getAllProfiles, listProfiles, getProfile, saveProfile, deleteProfile,
    getActiveProfileId, setActiveProfileId, getActiveProfile, updateActive,
    getGrade, setGrade,
    exportData, exportFilename, validateImport, applyImport,
    addStars,
    // Nur für Tests / Diagnose
    _read, _write,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Storage;
