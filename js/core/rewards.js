/**
 * core/rewards.js
 * Sterne, Belohnungen und Sammelalbum.
 *
 * Grundsätze (Bericht, Abschnitt 2 C und 9):
 *   • Belohnungen dürfen Anstrengung anerkennen, aber den Lernstand nicht
 *     verfälschen. Ein Bonus für eine "fehlerfreie Runde" wird nur vergeben,
 *     wenn tatsächlich jede Aufgabe im ersten Versuch ohne Hilfe stimmte.
 *   • Sammelmotive werden ausschließlich über Zähler freigeschaltet, die nie
 *     kleiner werden. Eine Lernpause kostet nichts.
 *   • Es gibt keine Ranglisten und keinen Zeitdruck.
 */

const Rewards = (() => {

  // ─── Sterne ───────────────────────────────────────────────────────────────

  const STAR_PER_SOLO = 1;
  const STAR_PER_HELPED = 1;   // Anstrengung zählt — Lernstand bleibt getrennt
  const PERFECT_BONUS = 2;

  /**
   * Sterne für eine abgeschlossene Runde.
   * @param {object} round { solo, helped, failed, total }
   */
  function starsForRound(round) {
    const solo = round.solo || 0;
    const helped = round.helped || 0;
    const perfect = solo === round.total && helped === 0 && (round.failed || 0) === 0;
    const base = solo * STAR_PER_SOLO + helped * STAR_PER_HELPED;
    return {
      base,
      bonus: perfect ? PERFECT_BONUS : 0,
      total: base + (perfect ? PERFECT_BONUS : 0),
      perfect,
    };
  }

  /** Ehrlicher Bonus-Text — nennt beim Namen, wofür es Sterne gab. */
  function bonusText(round) {
    const s = starsForRound(round);
    if (s.perfect) return `🎁 +${PERFECT_BONUS} Bonus-Sterne: alles allein geschafft!`;
    if (round.helped > 0 && round.solo + round.helped === round.total) {
      return 'Alle Aufgaben geschafft — ein paar davon mit Hilfe. Das zählt auch!';
    }
    return '';
  }

  // ─── Sammelalbum ──────────────────────────────────────────────────────────
  // need: { rounds } abgeschlossene Runden insgesamt
  //       { stars }  gesammelte Sterne
  //       { topics } Themen mit Status "gelingt meist allein"

  const COLLECTIONS = [
    {
      id: 'oskar',
      title: 'Oskars Sachen',
      icon: '🐶',
      stickers: [
        { id: 'oskar-ball',    label: 'Ball',        emoji: '🎾', need: { rounds: 1 } },
        { id: 'oskar-napf',    label: 'Fressnapf',   emoji: '🥣', need: { rounds: 3 } },
        { id: 'oskar-knochen', label: 'Knochen',     emoji: '🦴', need: { rounds: 6 } },
        { id: 'oskar-leine',   label: 'Leine',       emoji: '🪢', need: { rounds: 10 } },
        { id: 'oskar-huette',  label: 'Hundehütte',  emoji: '🏠', need: { rounds: 15 } },
        { id: 'oskar-buerste', label: 'Bürste',      emoji: '🪥', need: { rounds: 22 } },
        { id: 'oskar-decke',   label: 'Kuscheldecke',emoji: '🧣', need: { rounds: 30 } },
        { id: 'oskar-medaille',label: 'Medaille',    emoji: '🏅', need: { rounds: 40 } },
      ],
    },
    {
      id: 'pferde',
      title: 'Auf dem Reiterhof',
      icon: '🐴',
      stickers: [
        { id: 'pferd-apfel',  label: 'Apfel',        emoji: '🍎', need: { stars: 20 } },
        { id: 'pferd-heu',    label: 'Heuballen',    emoji: '🌾', need: { stars: 45 } },
        { id: 'pferd-buerste',label: 'Striegel',     emoji: '🧽', need: { stars: 75 } },
        { id: 'pferd-sattel', label: 'Sattel',       emoji: '🪑', need: { stars: 110 } },
        { id: 'pferd-hufeisen',label: 'Hufeisen',    emoji: '🧲', need: { stars: 150 } },
        { id: 'pferd-pony',   label: 'Pony',         emoji: '🐴', need: { stars: 200 } },
        { id: 'pferd-stall',  label: 'Stall',        emoji: '🏚️', need: { stars: 260 } },
        { id: 'pferd-schleife',label: 'Siegerschleife', emoji: '🎀', need: { stars: 330 } },
      ],
    },
    {
      id: 'weltraum',
      title: 'Reise ins All',
      icon: '🚀',
      stickers: [
        { id: 'all-stern',    label: 'Stern',        emoji: '⭐', need: { topics: 1 } },
        { id: 'all-mond',     label: 'Mond',         emoji: '🌙', need: { topics: 2 } },
        { id: 'all-rakete',   label: 'Rakete',       emoji: '🚀', need: { topics: 4 } },
        { id: 'all-planet',   label: 'Ringplanet',   emoji: '🪐', need: { topics: 6 } },
        { id: 'all-komet',    label: 'Komet',        emoji: '☄️', need: { topics: 8 } },
        { id: 'all-astronaut',label: 'Astronautin',  emoji: '👩‍🚀', need: { topics: 11 } },
        { id: 'all-station',  label: 'Raumstation',  emoji: '🛰️', need: { topics: 14 } },
        { id: 'all-galaxie',  label: 'Galaxie',      emoji: '🌌', need: { topics: 18 } },
      ],
    },
  ];

  const ALL_STICKERS = COLLECTIONS.reduce((acc, c) =>
    acc.concat(c.stickers.map(s => Object.assign({ collection: c.id }, s))), []);

  function getSticker(id) {
    return ALL_STICKERS.find(s => s.id === id) || null;
  }

  /** Zähler, aus denen sich Freischaltungen ergeben. */
  function counters(profile) {
    let rounds = 0;
    let topics = 0;
    Object.keys(profile.sessions || {}).forEach(id => {
      rounds += (profile.sessions[id].plays || 0);
    });
    Object.keys(profile.skills || {}).forEach(id => {
      const s = profile.skills[id];
      if (s.attempts >= 6 && s.solo / s.attempts >= 0.8) topics++;
    });
    return { rounds, stars: profile.stars || 0, topics };
  }

  function meets(need, c) {
    return Object.keys(need).every(k => (c[k] || 0) >= need[k]);
  }

  /**
   * Gleicht das Album mit den Zählern ab.
   * @returns {Array} neu freigeschaltete Sticker
   */
  function syncAlbum(profile) {
    const c = counters(profile);
    if (!profile.album) profile.album = { unlocked: [] };
    const have = new Set(profile.album.unlocked);
    const fresh = [];
    ALL_STICKERS.forEach(s => {
      if (!have.has(s.id) && meets(s.need, c)) {
        profile.album.unlocked.push(s.id);
        fresh.push(s);
      }
    });
    return fresh;
  }

  /** Fortschritt je Sammlung für die Albumansicht. */
  function albumState(profile) {
    const have = new Set((profile.album && profile.album.unlocked) || []);
    const c = counters(profile);
    return COLLECTIONS.map(col => ({
      id: col.id,
      title: col.title,
      icon: col.icon,
      owned: col.stickers.filter(s => have.has(s.id)).length,
      total: col.stickers.length,
      stickers: col.stickers.map(s => ({
        id: s.id,
        label: s.label,
        emoji: s.emoji,
        owned: have.has(s.id),
        hint: nextHint(s.need, c),
      })),
    }));
  }

  function nextHint(need, c) {
    if (meets(need, c)) return '';
    if (need.rounds) return `Noch ${need.rounds - c.rounds} ${Util.plural(need.rounds - c.rounds, 'Runde', 'Runden')}`;
    if (need.stars) return `Noch ${need.stars - c.stars} ${Util.plural(need.stars - c.stars, 'Stern', 'Sterne')}`;
    if (need.topics) return `Noch ${need.topics - c.topics} ${Util.plural(need.topics - c.topics, 'sicheres Thema', 'sichere Themen')}`;
    return '';
  }

  return {
    STAR_PER_SOLO, STAR_PER_HELPED, PERFECT_BONUS,
    COLLECTIONS, ALL_STICKERS,
    starsForRound, bonusText, counters, syncAlbum, albumState, getSticker,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Rewards;
