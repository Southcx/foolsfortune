// ---------------------------------------------------------------------------------------
// THE GARDEN'S SEASONS: spring, summer, autumn and winter on the game clock, for the Spirit Garden (docs/plans/GARDEN-COZY.md section
// E, a plan the owner prunes; whether the seasons are the garden's own or the whole island's is the owner's question Q2). A season is
// SEASON.days game days, so a player at an hour or two a real day sees a season a real week: the week's scale of goals. A season
// changes the look, the cue's arrangement, which plants spread, which visitors come, which pieces the shed sells and which material a
// bed of it gives; it never kills a plant or a bed (Stardew Valley's season-end death is struck: an out-of-season bed rests).
//
// Prior art: Harvest Moon: A Wonderful Life's short seasons (10 days, a guide's claim) and its seasonal themes, Stardew Valley's 28-day
// seasons and their crops, Animal Crossing's seasonal pieces and visitors.
//
//   SEASONS, SEASON   seasonOf(day = today()) -> { id, name, i, day (0 .. SEASON.days - 1), left, year }   SEASON_MATERIAL[id]
// ---------------------------------------------------------------------------------------
import { today } from '../core/calendar.js';

/** A season's length in game days (7: a real week of an hour or two a real day). */
export const SEASON = { days: 7 };
export const SEASONS = [
  { id: 'spring', name: 'Spring' }, { id: 'summer', name: 'Summer' }, { id: 'autumn', name: 'Autumn' }, { id: 'winter', name: 'Winter' },
];
/** What a season gives (GARDEN-COZY.md E3): a material of a feeling's kind for the press, the spore beds and a set's recipe, never a
 *  new currency. (The materials' ids are progress/econ/materials.js's kinds.) */
export const SEASON_MATERIAL = {
  spring: { name: 'Spring Blossom', kind: 'arcane' }, summer: { name: 'Summer Reed', kind: 'provision' },
  autumn: { name: 'Autumn Leaf', kind: 'art' }, winter: { name: 'Winter Frost', kind: 'eldritch' },
};

/** The season of a game day. */
export function seasonOf(day = today()) {
  const n = Math.floor(day / SEASON.days), i = ((n % 4) + 4) % 4, d = ((day % SEASON.days) + SEASON.days) % SEASON.days;
  return { ...SEASONS[i], i, day: d, left: SEASON.days - d, year: Math.floor(n / 4) };
}
