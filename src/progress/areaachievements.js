// ---------------------------------------------------------------------------------------
// THE AREAS' ACHIEVEMENTS (docs/plans/AREAS.md 6): for each Dunes area half its checklist (Easy) and all of it (Hard), and every area
// whole (Elite, a title: the one toast). Predicates over the record `area.<id>.share` (progress/areachecklist.js). They pay no cubes:
// walking is not a faucet. Names placeholders, Espada's to word.
//
// Prior art: Spyro's and Banjo-Kazooie's N-of-M, Xenoblade's Collectopedia, the house's achievements.js (its helpers passed in).
//
//   areaAchievements({ F })   (achievements.js calls it inside buildAchievements)
// ---------------------------------------------------------------------------------------
import { DUNES_AREAS } from './areas.js';
import { AREA_IDS } from './areachecklist.js';

const cap = (s) => s.replace(/^the /, 'The ').replace(/^./, (c) => c.toUpperCase());
const share = (L, id) => L.best?.(`area.${id}.share`) || 0;

export function areaAchievements({ F }) {
  AREA_IDS.forEach((id, i) => {
    const name = cap(DUNES_AREAS[id].name);
    F(`da${i * 2 + 1}`, 'explore', 'Places', 1, 'collect', `${name}, Half Known`, `Do half of ${DUNES_AREAS[id].name}'s checklist on the map.`, (L) => Math.round(share(L, id) * 100), 50, { unit: '%' });
    F(`da${i * 2 + 2}`, 'explore', 'Places', 3, 'collect', `${name}, Known`, `Do all of ${DUNES_AREAS[id].name}'s checklist on the map.`, (L) => Math.round(share(L, id) * 100), 100, { unit: '%' });
  });
  F('da99', 'explore', 'Places', 5, 'collect', 'Dune Reader', 'Do every Dunes area\'s whole checklist.', (L) => AREA_IDS.filter((id) => share(L, id) >= 1).length, AREA_IDS.length, { title: 'Dune Reader' });
}
