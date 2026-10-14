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
//   conditionAt(game) -> { light, sun, aspect, strength, key, grip, carve, coast, wind, gust, shove, ring, fog }   CONDITION (the numbers)
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
export function conditionAt(game) {
  const light = lightAt(), phase = phaseAt(), w = game.weather?.here?.(game.player?.pos) || {}, aspect = w.aspect || null, k = w.strength || 0, C = (aspect && CONDITION[aspect]) || {};
  const sun = Math.max(0, Math.min(1, (light - SUN.dark) / (SUN.full - SUN.dark))) * lerp1(C.sun, k);
  const band = phase === 'night' ? 'night' : phase === 'day' ? 'day' : 'twilight';
  return {
    light, sun, phase, aspect, strength: k, key: `${band}.${aspect || 'fair'}`,
    grip: lerp1(C.grip, k), carve: lerp1(C.carve, k), coast: lerp1(C.coast, k), wind: lerp1(C.wind, k), ring: lerp1(C.ring, k),
    gust: (C.gust || 0) * k, shove: (C.shove || 0) * k, fog: (C.fog || 0) * k,
  };
}
