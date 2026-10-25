// ---------------------------------------------------------------------------------------
// TRACKING, THE SOUL BRUSH'S LOAD: the rules that hear the paint and mop modes, the Lachrymato Bottles and the stains (the data:
// progress/brushload.js; the plan: docs/plans/SUNSHINE-SYSTEMS.md), keep their counts for the achievements, and say the few things worth
// a sentence (a blot mopped up, a blotling spawned, a bottle cracked). The player's word is Espada's "blot"; the code ids stay `stain`. Only the Courier's acts are counted; a stain that spawns is the
// place's (`by: 'environment'`). The words are Espada's (2026-10-06). tracking.js calls it from listen().
//
//   brushRules({ on, L, log })
//   brushToolRules({ on, L, log, where })
// ---------------------------------------------------------------------------------------
import { plural } from './lineformat.js';

const BRUSH_LINE = {
  still: (n) => `Your brush holds ${n === 1 ? 'it' : plural(n, 'thing')} still.`,
  bounce: (n) => `Your brush makes ${n === 1 ? 'it' : plural(n, 'thing')} spring.`,
  mend: (n) => `Your brush makes ${plural(n, 'thing')} whole.`,
  ember: (n) => `Your brush sets ${n === 1 ? 'an ember' : `${n} embers`} smouldering.`,
  gale: (n) => (n ? `A gale answers your brush and scatters ${plural(n, 'thing')}.` : 'A gale answers your brush.'),
  bolt: (n) => (n ? `Lightning answers your brush and stuns ${plural(n, 'clapperjar')}.` : 'Lightning answers your brush.'),
  light: (n) => (n ? `Your brush makes ${n === 1 ? 'it' : plural(n, 'thing')} light.` : 'Your brush lifts you.'),
  heavy: (n) => (n ? `Your brush makes ${n === 1 ? 'it' : plural(n, 'thing')} heavy.` : 'Your brush drives you down.'),
  solace: (n) => (n > 1 ? `${n} clapperjars forget themselves and dance.` : n ? 'A clapperjar forgets itself and dances.' : 'Your Pneuka Jar is soothed.'),
  wash: () => 'You lay paint across the world.',
};
const BRUSH_NAME = { still: 'Still', bounce: 'Bounce', mend: 'Mend', ember: 'Ember', gale: 'Gale', bolt: 'Bolt', light: 'Light', heavy: 'Heavy', solace: 'Solace', wash: 'wash' };
import { BOTTLES, STAINS } from '../../progress/brushload.js';
import { crudeName } from '../../pneuka/items.js';

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
    L.hi('paint.stroke.best', e.area || 0); // (the most laid in one hold of the spray: the paintStride knack's feat way)
  });
  // brush.pick { feeling, by }: the radial's pick (tools/soulbrush/radial.js): a feeling the paint is refined into, or Clean
  on('brush.pick', (e) => {
    L.inc(`brush.pick.${e.feeling}`);
    log.say('info', e.feeling === 'clean' ? 'Your brush sprays clean.' : `Your brush paints ${e.feeling[0].toUpperCase()}${e.feeling.slice(1)}.`, { key: 'brushpick', throttle: 0.5 });
  });
  // brush.mop { lachryma, by }: Lachryma drunk into the bottle (or the pool, bottle-less)
  on('brush.mop', (e) => { if (e.by === 'courier') L.inc('mop.lachryma', e.lachryma || 0); });
  // stain.wash { field, stage, at, size, by }: a blot mopped up whole (at, size: where it lay and how wide, for its shine)
  on('stain.wash', (e) => {
    if (e.by !== 'courier') return;
    L.inc('stain.wash'); if (e.field) L.inc(`stain.${e.field}`); // (by its crude's field: crude carries no feeling, the owner, 2026-10-11)
    if (e.stage >= STAINS.stages) L.inc('stain.wash.grown');
    log.say('gain', `You mop up ${STAGE[e.stage] || 'a'} blot of ${crudeName(e.field)}.`.replace('  ', ' '), { key: 'stain', throttle: 1 });
  });
  // stain.spawn { field, aspect, kind, by: 'environment' }: a full-grown blot gives up an aberrant Figment (the weather's feeling where it rises, or none)
  on('stain.spawn', (e) => {
    L.inc('stain.spawn');
    log.say('combat', `A blotling crawls out of a blot of ${crudeName(e.field)}.`.replace('  ', ' '), { key: 'stainspawn', throttle: 3 });
  });
  // bottle.crack { bottle, spilled, by: 'creature' | 'environment' }: a broken shield cracked the glass
  on('bottle.crack', (e) => {
    L.inc('bottle.crack');
    log.say('combat', `Your ${bottleName(e.bottle)} cracks: ${Math.round(e.spilled || 0)} Lachryma spilled.`, { key: 'bottle', throttle: 1 });
  });
}

export function brushToolRules({ on, L, log, where }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  // ---- the Soul Brush: the club, the brush slide, Celestial mode, the sigils (src/tools/soulbrush/soulbrush.js, src/tools/soulbrush/)
  on('brush.draw', () => { L.inc('brush.draw'); log.say('info', 'You draw the Soul Brush.', { key: 'bdraw', throttle: 2 }); });
  on('brush.stow', () => L.inc('brush.stow'));
  on('brush.swing', (e) => { L.inc('brush.swing'); if (e.slam) L.inc(e.air ? 'brush.slam.dive' : 'brush.slam.swing'); });
  on('brush.flick', () => L.inc('brush.flick'));
  on('brush.hit', (e) => {
    L.inc('brush.hit'); L.inc(`brush.hit.${e.what}`);
    if (e.stun) L.inc('brush.stun');
    if (e.bat) { L.inc('brush.bat'); log.say('battle', 'You bat the clapperjar away.', { key: 'bbat', win: 1, fmt: (n) => `You bat ${plural(n, 'clapperjar')} away.` }); }
    else if (e.what === 'pot') log.say('battle', 'You club the pot.', { key: 'bpot', win: 0.9, fmt: (n) => `You club ${plural(n, 'pot')}.` });
  });
  on('brush.slam', (e) => {
    L.inc('brush.slam'); L.hi('brush.slam.power', e.power); if (e.air) L.inc('brush.slam.air');
    if (e.big) { first('brush.slam', 'Logged: your first brush slam.'); log.say('battle', e.air ? 'You come down with the brush, and the ground answers.' : 'You bring the brush down.', { key: 'bslam', throttle: 1.5 }); }
  });
  on('brush.slide', (e) => {
    if (e.phase !== 'end') return;
    L.inc('brush.slide'); L.inc('brush.slide.dist', e.dist); L.hi('brush.slide.best', e.dist, { at: where() });
    first('brush.slide', 'Logged: your first brush slide.');
    if (e.dist >= 8) log.say('move', `You paint ${Math.round(e.dist)} m of paint behind you.`, { key: 'bslide', throttle: 2 });
  });
  on('brush.canvas', (e) => {
    if (!e.open) { L.hi('brush.drawings.best', e.drawings); return; }
    L.inc('brush.canvas');
    first('brush.canvas', 'Logged: your first time in Celestial mode.');
    log.say('info', 'The world stills, and becomes paper.', { key: 'bcanvas', throttle: 6 });
  });
  on('brush.read', (e) => { L.inc('brush.read'); L.inc(`brush.read.${e.technique}`); if (e.strokes > 1) L.inc('brush.read.multi'); });
  on('brush.miss', () => L.inc('brush.miss')); on('brush.mark', () => L.inc('brush.mark')); // (mark: a dot on a thing, R18; the star over it says so)
  on('brush.inscribe', (e) => { L.inc('inscribe'); L.inc(`inscribe.${e.prop}`); });
  on('brush.glyph', (e) => {
    L.inc(`brush.tech.${e.technique}`); L.inc('brush.tech');
    if (e.technique !== 'wash') first(`brush.tech.${e.technique}`, `Logged: your first ${BRUSH_NAME[e.technique]}.`);
    const line = BRUSH_LINE[e.technique];
    if (line) log.say('battle', line(e.n), { key: `bt.${e.technique}`, throttle: 0.8 });
  });
  on('sigil.pop', (e) => {
    L.inc('sigil.pop', e.popped); L.inc(`sigil.pop.${e.sigil}`, e.popped);
    if (e.cleared) { L.inc('sigil.cleared', e.cleared); L.hi('sigil.cleared.best', e.cleared); first('sigil.cleared', 'Logged: your first clapperjar erased.'); }
    log.say('battle', e.cleared ? `You erase ${plural(e.cleared, 'clapperjar')}.` : `Your mark lifts ${plural(e.popped, 'sigil')}.`, { key: 'sigil', win: 0.6 });
  });
}
