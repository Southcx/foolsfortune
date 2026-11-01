// ---------------------------------------------------------------------------------------
// ACHIEVEMENTS OVER COUNTS ALREADY KEPT (docs/plans/GAPS.md G176, G180, G205, G270): the parry with each tool (PARRY.md's "a sub
// for the parry"), the Shrines found and used (SHRINES.md), the Soul Brush's load (SUNSHINE-SYSTEMS.md, "The Load"), and the passage's
// worst day (PASSAGE.md). No new count: each reads a key its tracking already writes (tracking/movementarts.js `parry.<tool>`;
// tracking/shrines.js `shrine.found`, `shrine.travel`, `shrine.rest`; tracking/brush.js `paint.area`, `mop.lachryma`,
// `stain.wash.grown`; `brush.slide.dist`; `passage.adrift`). Words placeholders for Espada's.
//
// Prior art: Old School RuneScape's combat achievements by style (each weapon its own line), Hollow Knight's every bench, Splatoon's
// turf inked, Subnautica's "you survived" (a bad day remembered).
//
//   countAchievements({ C, F })   (moduleachievements.js calls it)
// ---------------------------------------------------------------------------------------

/** What the parry is counted under: the kick, the cutlass's guard, and each tool's own parry (courier/parries.js PARRIES' keys). */
const PARRY_TOOLS = ['kick', 'cutlass', 'psygun', 'soulbrush', 'veritome', 'dreamvane', 'crucibelle', 'lockheart'];
const SHRINE_COUNT = 4; // (world/shrines.js SHRINES: the Bisque, the Lamp, the Float and the Pearl at Margarite's dock; read by count, not by id)

export function countAchievements({ C, F }) {
  // the parry, one line a tool
  C('pt1', 'move', 'The Arts', 1, 'count', 'Bare Answer', 'Parry 25 times with a kick.', 'parry.kick', 25);
  C('pt2', 'move', 'The Arts', 1, 'count', 'Edge On', 'Parry 25 times with the cutlass.', 'parry.cutlass', 25);
  C('pt3', 'move', 'The Arts', 2, 'count', 'Point Blank', 'Parry 25 times with the psygun.', 'parry.psygun', 25);
  C('pt4', 'move', 'The Arts', 2, 'count', 'Wet Answer', 'Parry 25 times with the Soul Brush.', 'parry.soulbrush', 25);
  C('pt5', 'move', 'The Arts', 2, 'count', 'Shutter Speed', 'Parry 25 times with the Veritome.', 'parry.veritome', 25);
  C('pt6', 'move', 'The Arts', 2, 'count', 'Turned Aside', 'Parry 25 times with the Dreamvane.', 'parry.dreamvane', 25);
  C('pt7', 'move', 'The Arts', 2, 'count', 'Struck Note', 'Parry 25 times with the Crucibelle.', 'parry.crucibelle', 25);
  C('pt8', 'move', 'The Arts', 2, 'count', 'Swallowed Whole', 'Parry 25 times with the Lockheart.', 'parry.lockheart', 25);
  F('pt9', 'move', 'The Arts', 4, 'collect', 'Every Answer', 'Parry with every tool and with a kick.', (L) => PARRY_TOOLS.filter((t) => L.get(`parry.${t}`) >= 1).length, PARRY_TOOLS.length);
  C('pt10', 'move', 'The Arts', 5, 'endure', 'Untouchable', 'Parry 1000 times.', 'move.parry', 1000);
  // the Shrines
  C('shr1', 'explore', 'Shrines', 2, 'collect', 'Pilgrim', `Find all ${SHRINE_COUNT} Shrines.`, 'shrine.found', SHRINE_COUNT);
  C('shr2', 'explore', 'Shrines', 2, 'endure', 'Well Travelled', 'Travel between Shrines 100 times.', 'shrine.travel', 100);
  C('shr3', 'explore', 'Shrines', 1, 'count', 'Regular', 'Rest at a Shrine 25 times.', 'shrine.rest', 25);
  // the Soul Brush's load
  C('ld1', 'brush', 'The Canvas', 2, 'count', 'Wall to Wall', 'Paint 100 square metres.', 'paint.area', 100);
  C('ld2', 'brush', 'The Canvas', 2, 'count', 'Mop Bucket', 'Mop up 500 Lachryma.', 'mop.lachryma', 500);
  C('ld3', 'brush', 'The Canvas', 3, 'mechanic', 'Weeds Pulled', 'Mop up 10 full-grown blots.', 'stain.wash.grown', 10);
  C('ld4', 'brush', 'The Slide', 3, 'endure', 'Slick Run', 'Slide 500 m on the brush.', 'brush.slide.dist', 500);
  // the passage's worst day
  C('ps1', 'emocean', 'Sailing', 2, 'mechanic', 'Adrift', 'Run out of fuel at sea and live to tell it.', 'passage.adrift', 1);
}
