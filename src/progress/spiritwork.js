// ---------------------------------------------------------------------------------------
// A SPIRIT AT WORK ON THE ATHANOR (docs/plans/SOUL-ALCHEMY.md section 7, GAPS.md G219): a spirit of a feeling standing at the spirit
// press gives that feeling's materials one extra step of their own pull, as the beds and slots have their workers (progress/garden.js
// `workBonus`). The press was already asking for the extra (`SoulAlchemy.walk`'s `extra`, `GardenPress.extra()` returning 0); this is
// what it asks. A spirit is at work on the press when the raising keeps its entry's `work` as `press` (the same `work` the beds and the
// pavilions use, world/garden/raising.js; the hook is in docs/handoffs/petra/2026-11-03-from-dovina-garden-life.md).
//
// It is a modifier with a source you can see: the spirit stands at the press, its materials' trail in the bath is longer (the preview
// is the press: one function walks both), and the log says who worked. A spirit of another feeling adds nothing to this material; a
// spirit that has not come to trust you (bond under `bond`) is not yet at work for you; two at work do not stack (the best one).
//
// Prior art: Rune Factory's and Palworld's helpers at a station, Spiritfarer's passengers at the foundry, Stardew Valley's friends who
// help at the machines, and this garden's own workers (SPIRIT-GARDEN.md 5).
//
//   WORK = { job, extra, bond }   materialFeeling(material) -> feeling | null   pressExtra(entries, material) -> steps   workersAt(entries) -> [entry]
// ---------------------------------------------------------------------------------------
import { FEED } from './spirits.js';

/** The job's name on an entry's `work`, the extra steps a worker's feeling's materials get, the bond that makes a spirit a worker. */
export const WORK = { job: 'press', extra: 1, bond: 30 };

/** The feeling a material is of: its kind's stat (spirits.js FEED.stat: arcane wonder, mechanism mirth, edge desire, provision grief, eldritch dread ...). */
export const materialFeeling = (m) => FEED.stat[m?.kind] || null;
/** The spirits at work on the press now. */
export const workersAt = (entries = []) => entries.filter((e) => e?.work === WORK.job && e.sp && (e.sp.bond || 0) >= WORK.bond);
/** The extra steps a material's pull gets from the spirits at work: WORK.extra if any worker is of its feeling, else 0. */
export function pressExtra(entries, material) {
  const f = materialFeeling(material); if (!f) return 0;
  return workersAt(entries).some((e) => e.sp.feeling === f) ? WORK.extra : 0;
}
