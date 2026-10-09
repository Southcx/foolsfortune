// ---------------------------------------------------------------------------------------
// TRACKING, THE SOUL BRUSH'S LOAD: the rules that hear the paint and mop modes, the Lachrymato Bottles and the stains (the data:
// progress/brushload.js; the plan: docs/plans/SUNSHINE-SYSTEMS.md), keep their counts for the achievements, and say the few things worth
// a sentence (a blot mopped up, a blotling spawned, a bottle cracked). The player's word is Espada's "blot"; the code ids stay `stain`. Only the Courier's acts are counted; a stain that spawns is the
// place's (`by: 'environment'`). The words are Espada's (2026-10-06). tracking.js calls it from listen().
//
//   brushRules({ on, L, log })
// ---------------------------------------------------------------------------------------
import { BOTTLES, STAINS } from '../../progress/brushload.js';

const STAGE = ['a fresh', 'a spreading', 'a deep', 'a full-grown'];
const bottleName = (id) => (BOTTLES[id] ? `${id.split('.')[1]} Lachrymato Bottle` : 'Lachrymato Bottle');

export function brushRules({ on, L, log }) {
  // brush.mode { mode: 'paint' | 'mop', by }
  on('brush.mode', (e) => { if (e.by === 'courier') log.say('info', `Soul Brush: ${e.mode}.`, { key: 'brushmode', throttle: 0.5 }); });
  // brush.paint { aspect, area, from: 'bottle' | 'pool', by }: square metres laid this stroke
  on('brush.paint', (e) => {
    if (e.by !== 'courier') return;
    L.inc('paint.area', e.area || 0);
    if (e.aspect) L.inc(`paint.${e.aspect}`, e.area || 0);
  });
  // brush.pick { feeling, by }: the radial's pick (tools/soulbrush/radial.js): a feeling the paint is refined into, or Clean
  on('brush.pick', (e) => {
    L.inc(`brush.pick.${e.feeling}`);
    log.say('info', e.feeling === 'clean' ? 'Your brush sprays clean.' : `Your brush paints ${e.feeling[0].toUpperCase()}${e.feeling.slice(1)}.`, { key: 'brushpick', throttle: 0.5 });
  });
  // brush.mop { lachryma, by }: Lachryma drunk into the bottle (or the pool, bottle-less)
  on('brush.mop', (e) => { if (e.by === 'courier') L.inc('mop.lachryma', e.lachryma || 0); });
  // stain.wash { grade, stage, by }: a stain mopped up whole
  on('stain.wash', (e) => {
    if (e.by !== 'courier') return;
    L.inc('stain.wash'); if (e.grade) L.inc(`stain.${e.grade}`);
    if (e.stage >= STAINS.stages) L.inc('stain.wash.grown');
    log.say('gain', `You mop up ${STAGE[e.stage] || 'a'} blot of ${e.grade || ''} crude.`.replace('  ', ' '), { key: 'stain', throttle: 1 });
  });
  // stain.spawn { grade, kind, by: 'environment' }: a full-grown stain gives up an aberrant Figment
  on('stain.spawn', (e) => {
    L.inc('stain.spawn');
    log.say('combat', `A blotling crawls out of a blot of ${e.grade || ''} crude.`.replace('  ', ' '), { key: 'stainspawn', throttle: 3 });
  });
  // bottle.crack { bottle, spilled, by: 'creature' | 'environment' }: a broken shield cracked the glass
  on('bottle.crack', (e) => {
    L.inc('bottle.crack');
    log.say('combat', `Your ${bottleName(e.bottle)} cracks: ${Math.round(e.spilled || 0)} Lachryma spilled.`, { key: 'bottle', throttle: 1 });
  });
}
