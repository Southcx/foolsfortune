// ---------------------------------------------------------------------------------------
// THE RACEWAY'S CONDITIONS (docs/plans/SKIFF-RACING.md section 9): the hour and the weather change the race, read live from the island's
// clock and sky (progress/weather.js: the Raceway is Anagami's, open to the sky). THE SUN feeds the sun plates: full by day, weak at dawn
// and dusk, dead at night (the cavern's crystal veins are Lachryma's, and push in the dark: the night lap's line goes under). THE
// WEATHER, by its feeling and strength: rain wets the sand, and wet sand packs firm and slick (land yachts race on the wet beach for it:
// faster, less grip, a carve that loads sooner); the hail comes in squalls that shove the board across the wind; the miasma is thick air;
// the wanting wind blows harder down the course; the aurora feeds the sun rings; the pall is fog (its look Calissa's). Cloud dims the sun.
// A race is run under one condition, said at the start, and its time kept on that condition's own board (its light and its weather).
//
// Prior art: Gran Turismo's and Forza's time of day and wet track, Wave Race 64's and Diddy Kong Racing's changing courses, MK8's night
// tracks; Trackmania's "the same track, another board"; real land sailing (wet sand is the fast surface; Ivanpah's dry lake is the slow).
//
//   conditionAt(game, forced?) -> { light, sun, aspect, strength, key, grip, carve, coast, wind, gust, shove, ring, fog }   CONDITION (the numbers)
//   dayCondition(day) -> { band, aspect, strength, pick } (the game day's race)   dayTrack(day, ids)   conditionOf(band, aspect, k)   conditionWords(key)
// ---------------------------------------------------------------------------------------
import { lightAt, phaseAt } from '../../progress/weather.js';

/** What each weather does at full strength (a multiplier, or an amount): grip (the sand's hold on a slide), carve (how fast a carve
 *  loads), coast (the sand's and air's drag), wind (the course wind's strength), gust (the squalls' swing, 0..1 of the wind), shove (m/s^2
 *  across the board for a whole gust's excess, crosswind), ring (a sun ring's push), sun (the light the clouds let through), fog. */
export const CONDITION = {
  mirth: { grip: 0.7, carve: 1.25, coast: 0.85 }, //                       (the fox's wedding: rain under the sun, wet sand, the plates lit)
  wonder: { ring: 1.4 }, //                                                (the aurora: the rings drink it)
  desire: { wind: 1.35 }, //                                               (the wanting wind: down the course, harder)
  fury: { gust: 0.45, shove: 10, sun: 0.7 }, //                            (the hail: squalls)
  gall: { coast: 1.25, grip: 1.2, sun: 0.7 }, //                           (the miasma: thick air, sticky sand)
  grief: { grip: 0.6, carve: 1.35, coast: 0.85, sun: 0.55 }, //            (the long rain: wet sand, firm and slick; overcast)
  dread: { fog: 1, sun: 0.6 }, //                                          (the pall)
};
/** The sun plates' power from the light (lightAt: 0.08 at night .. 1 at noon): none under `dark`, full from `full`. */
export const SUN = { dark: 0.12, full: 0.62 };

const lerp1 = (v, k) => 1 + ((v ?? 1) - 1) * k;
/** THE GAME DAY'S RACE (SKIFF-RACING.md 9, "one seeded condition per game day", built 2026-10-29): each game day names one condition, the
 *  same for everyone (seeded by the day), raced in the `daily` mode whatever the sky is: its light band and its weather at its strength.
 *  Its board is that day's: a fresh field each game day (Trackmania's track of the day, Spelunky's daily). */
export const BAND_LIGHT = { day: 0.9, twilight: 0.35, night: 0.08 };
const DAY_ASPECTS = [null, 'mirth', 'wonder', 'desire', 'fury', 'gall', 'grief', 'dread'];
export function dayCondition(day) {
  const h = (n) => { let x = (Math.imul(day + 17, 0x9e3779b1) ^ Math.imul(n, 0x85ebca6b)) >>> 0; x = Math.imul(x ^ (x >>> 16), 0x7feb352d); x = Math.imul(x ^ (x >>> 15), 0x846ca68b); return ((x ^ (x >>> 16)) >>> 0) % 997; }; // (a full mix, so no field cycles with the day)
  const band = ['day', 'day', 'twilight', 'night'][h(1) % 4], aspect = DAY_ASPECTS[h(2) % DAY_ASPECTS.length], strength = aspect ? 0.5 + (h(3) % 6) / 10 : 0;
  return { band, aspect, strength: +strength.toFixed(1), pick: h(4) };
}
/** The game day's race's track: one of the park's, seeded by the same day. */
export const dayTrack = (day, ids) => ids[dayCondition(day).pick % ids.length];
const BAND_WORDS = { day: 'by day', twilight: 'at twilight', night: 'at night' };
const SKY_WORDS = { mirth: 'a sunshower', wonder: 'the bright air', desire: 'the strong wind', fury: 'the hail', gall: 'the miasma', grief: 'the long rain', dread: 'the fog' };
/** A condition's key (`band.aspect`) said plainly, for the log and the race board. */
export function conditionWords(key) { const [band, sky] = String(key || 'day.fair').split('.'); return `${BAND_WORDS[band] || band}, ${SKY_WORDS[sky] ? `in ${SKY_WORDS[sky]}` : 'fair'}`; }
export function conditionAt(game, forced = null) {
  if (forced) return conditionOf(forced.band, forced.aspect, forced.strength);
  const light = lightAt(), phase = phaseAt(), w = game.weather?.here?.(game.player?.pos) || {}, aspect = w.aspect || null, k = w.strength || 0, C = (aspect && CONDITION[aspect]) || {};
  const sun = Math.max(0, Math.min(1, (light - SUN.dark) / (SUN.full - SUN.dark))) * lerp1(C.sun, k);
  const band = phase === 'night' ? 'night' : phase === 'day' ? 'day' : 'twilight';
  return {
    light, sun, phase, aspect, strength: k, key: `${band}.${aspect || 'fair'}`,
    grip: lerp1(C.grip, k), carve: lerp1(C.carve, k), coast: lerp1(C.coast, k), wind: lerp1(C.wind, k), ring: lerp1(C.ring, k),
    gust: (C.gust || 0) * k, shove: (C.shove || 0) * k, fog: (C.fog || 0) * k,
  };
}

/** A condition from a band and a weather (the game day's race): the light the band stands for, the weather's numbers at its strength. */
export function conditionOf(band = 'day', aspect = null, k = 0) {
  const light = BAND_LIGHT[band] ?? 0.9, C = (aspect && CONDITION[aspect]) || {}, phase = band === 'twilight' ? 'dusk' : band;
  const sun = Math.max(0, Math.min(1, (light - SUN.dark) / (SUN.full - SUN.dark))) * lerp1(C.sun, k);
  return {
    light, sun, phase, aspect, strength: k, key: `${band}.${aspect || 'fair'}`, forced: true,
    grip: lerp1(C.grip, k), carve: lerp1(C.carve, k), coast: lerp1(C.coast, k), wind: lerp1(C.wind, k), ring: lerp1(C.ring, k),
    gust: (C.gust || 0) * k, shove: (C.shove || 0) * k, fog: (C.fog || 0) * k,
  };
}
