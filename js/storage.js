/**
 * storage.js
 * Centralized local storage interface.
 * All persistence goes through here — swap the backend anytime without touching app code.
 */

const Storage = (() => {
  const KEYS = {
    PROFILES:       'lw_profiles',
    ACTIVE_PROFILE: 'lw_active_profile',
    GRADE:          'lw_grade',
  };

  function _read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('[Storage] Read error:', key, e);
      return null;
    }
  }

  function _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('[Storage] Write error:', key, e);
      return false;
    }
  }

  // ---------- Profiles ----------

  function getAllProfiles() {
    return _read(KEYS.PROFILES) || {};
  }

  function getProfile(id) {
    return getAllProfiles()[id] || null;
  }

  function saveProfile(profile) {
    const profiles = getAllProfiles();
    profiles[profile.id] = profile;
    return _write(KEYS.PROFILES, profiles);
  }

  function getActiveProfileId() {
    return _read(KEYS.ACTIVE_PROFILE);
  }

  function setActiveProfileId(id) {
    return _write(KEYS.ACTIVE_PROFILE, id);
  }

  function getActiveProfile() {
    const id = getActiveProfileId();
    return id ? getProfile(id) : null;
  }

  // ---------- Klassenstufe ----------

  // Gibt 1 oder 2 zurück, oder null, wenn noch nie ausgewählt wurde.
  function getGrade() {
    return _read(KEYS.GRADE);
  }

  function setGrade(grade) {
    return _write(KEYS.GRADE, grade === 2 ? 2 : 1);
  }

  // ---------- Stars & Level ----------

  function addStars(profileId, count) {
    const profile = getProfile(profileId);
    if (!profile) return false;
    profile.stars = (profile.stars || 0) + count;
    // Level up every 10 stars
    profile.level = Math.floor(profile.stars / 10) + 1;
    return saveProfile(profile);
  }

  // ---------- Adaptive Learning ----------

  /**
   * Record one answer attempt.
   * Stores per-exercise stats and updates the adaptive difficulty level.
   *
   * difficulty thresholds:
   *   rate > 0.85 after ≥5 attempts → increase difficulty (max 3)
   *   rate < 0.50 after ≥5 attempts → decrease difficulty (min 1)
   */
  function recordAttempt(profileId, exerciseId, correct) {
    const profile = getProfile(profileId);
    if (!profile) return false;

    if (!profile.adaptive) profile.adaptive = {};
    if (!profile.adaptive[exerciseId]) {
      profile.adaptive[exerciseId] = { correct: 0, total: 0, streak: 0, difficulty: 1 };
    }

    const s = profile.adaptive[exerciseId];
    s.total++;
    if (correct) {
      s.correct++;
      s.streak++;
    } else {
      s.streak = 0;
    }

    if (s.total >= 5) {
      const rate = s.correct / s.total;
      if (rate > 0.85 && s.difficulty < 3) s.difficulty++;
      else if (rate < 0.50 && s.difficulty > 1) s.difficulty--;
    }

    return saveProfile(profile);
  }

  function getAdaptiveData(profileId) {
    const profile = getProfile(profileId);
    return (profile && profile.adaptive) || {};
  }

  // ---------- Session Results ----------

  function saveSessionResult(profileId, exerciseId, correct, total) {
    const profile = getProfile(profileId);
    if (!profile) return false;
    if (!profile.sessions) profile.sessions = {};
    if (!profile.sessions[exerciseId]) {
      profile.sessions[exerciseId] = { bestScore: 0, bestTotal: 0, sessionsPlayed: 0, lastScore: 0, lastTotal: 0 };
    }
    const s = profile.sessions[exerciseId];
    s.sessionsPlayed++;
    s.lastScore = correct;
    s.lastTotal = total;
    if (correct > s.bestScore) {
      s.bestScore = correct;
      s.bestTotal = total;
    }
    return saveProfile(profile);
  }

  function getSessionStats(profileId, exerciseId) {
    const profile = getProfile(profileId);
    if (!profile || !profile.sessions) return null;
    return profile.sessions[exerciseId] || null;
  }

  return {
    getAllProfiles,
    getProfile,
    saveProfile,
    getActiveProfileId,
    setActiveProfileId,
    getActiveProfile,
    getGrade,
    setGrade,
    addStars,
    recordAttempt,
    getAdaptiveData,
    saveSessionResult,
    getSessionStats,
  };
})();
