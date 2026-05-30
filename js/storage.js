/**
 * storage.js
 * Centralized local storage interface.
 * All persistence goes through here — swap the backend anytime without touching app code.
 */

const Storage = (() => {
  const KEYS = {
    PROFILES: 'lw_profiles',
    ACTIVE_PROFILE: 'lw_active_profile',
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
    const profiles = getAllProfiles();
    return profiles[id] || null;
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
    if (!id) return null;
    return getProfile(id);
  }

  // ---------- Progress helpers ----------

  function updateProgress(profileId, subject, data) {
    const profile = getProfile(profileId);
    if (!profile) return false;
    if (!profile.progress[subject]) {
      profile.progress[subject] = {};
    }
    Object.assign(profile.progress[subject], data);
    return saveProfile(profile);
  }

  function addStars(profileId, count) {
    const profile = getProfile(profileId);
    if (!profile) return false;
    profile.stars = (profile.stars || 0) + count;
    return saveProfile(profile);
  }

  return {
    getAllProfiles,
    getProfile,
    saveProfile,
    getActiveProfileId,
    setActiveProfileId,
    getActiveProfile,
    updateProgress,
    addStars,
  };
})();
