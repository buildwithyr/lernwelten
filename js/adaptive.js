/**
 * adaptive.js
 * Lokales adaptives Lernsystem — keine Cloud, keine externen Dienste.
 *
 * Konzept:
 *   Jede Übungsart hat einen Schwierigkeitsgrad (1–3) und ein Gewicht.
 *   Gewicht steuert, wie oft eine schwache Übung im Vergleich zu einer
 *   starken Übung ausgewählt wird (für zukünftigen Automatikmodus).
 *   Schwierigkeitsgrad steuert den Zahlenraum innerhalb einer Übung.
 *
 * Schwellenwerte (nach ≥5 Versuchen):
 *   Erfolgsrate > 85 % → Schwierigkeit erhöhen (max 3)
 *   Erfolgsrate < 50 % → Schwierigkeit senken  (min 1)
 *
 * Gewichte:
 *   Erfolgsrate < 50 % → Gewicht 2.5  (viel mehr üben)
 *   Erfolgsrate < 70 % → Gewicht 1.8
 *   Erfolgsrate > 90 % → Gewicht 0.5  (weniger wiederholen)
 *   sonst              → Gewicht 1.0
 */

const Adaptive = (() => {

  /**
   * Gibt den aktuellen Schwierigkeitsgrad (1–3) für eine Übungsart zurück.
   * Startet bei 1, bis genügend Daten vorliegen.
   */
  function getDifficulty(profileId, exerciseId) {
    const data = Storage.getAdaptiveData(profileId);
    return (data[exerciseId] && data[exerciseId].difficulty) || 1;
  }

  /**
   * Gibt die Rohstatistiken für eine Übungsart zurück.
   * Nützlich für den Fortschritts-Screen.
   */
  function getStats(profileId, exerciseId) {
    const data = Storage.getAdaptiveData(profileId);
    return data[exerciseId] || { correct: 0, total: 0, streak: 0, difficulty: 1 };
  }

  /**
   * Berechnet das Gewicht aller Übungsarten für gewichtete Zufallsauswahl.
   * @param {string}   profileId   - Profil-ID
   * @param {string[]} exerciseIds - Liste aller Übungs-IDs
   * @returns {number[]} Gewichte in derselben Reihenfolge wie exerciseIds
   */
  function getWeights(profileId, exerciseIds) {
    const data = Storage.getAdaptiveData(profileId);
    return exerciseIds.map(id => {
      const s = data[id];
      if (!s || s.total < 3) return 1.0;
      const rate = s.correct / s.total;
      if (rate < 0.50) return 2.5;
      if (rate < 0.70) return 1.8;
      if (rate > 0.90) return 0.5;
      return 1.0;
    });
  }

  /**
   * Wählt gewichtet eine Übungs-ID aus.
   * Schwache Übungen werden häufiger ausgewählt als starke.
   * (Grundlage für zukünftigen Automatikmodus.)
   */
  function selectWeightedExercise(profileId, exerciseIds) {
    const weights = getWeights(profileId, exerciseIds);
    const total = weights.reduce((sum, w) => sum + w, 0);
    let r = Math.random() * total;
    for (let i = 0; i < exerciseIds.length; i++) {
      r -= weights[i];
      if (r <= 0) return exerciseIds[i];
    }
    return exerciseIds[exerciseIds.length - 1];
  }

  /**
   * Gibt eine menschenlesbare Beschreibung des Lernstands zurück.
   * Für spätere Fortschritts-Ansichten gedacht.
   */
  function getSummary(profileId, exerciseIds) {
    const data = Storage.getAdaptiveData(profileId);
    return exerciseIds.map(id => {
      const s = data[id] || { correct: 0, total: 0, difficulty: 1 };
      const rate = s.total > 0 ? Math.round((s.correct / s.total) * 100) : null;
      return { exerciseId: id, rate, difficulty: s.difficulty, total: s.total };
    });
  }

  return {
    getDifficulty,
    getStats,
    getWeights,
    selectWeightedExercise,
    getSummary,
  };
})();
