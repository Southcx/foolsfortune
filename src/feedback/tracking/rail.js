// ---------------------------------------------------------------------------------------
// TRACKING, THE CROSSING: the rules that hear the rail shooter (progress/rail/: the crossing's score, its set pieces, its scoring;
// docs/plans/RAIL.md), keep the counts for THE EMOCEAN's achievements (The Rail), and say the few things worth a sentence: an
// set piece's first beat, how it ended, and the tally (Star Fox 64's: the score, the rank, the downs, the medal). The words are
// Espada's (2026-10-07: the glints and their Conductor, the Wreckers and the False Light, Old Nobody). Registered before the voyage's rules, so the tally is said before "You make port". tracking.js calls it.
//
//   railRules({ on, L, log })   showcase.start { legs, hulls }   showcase.hull { hull, k, mounts, note }   showcase.mend   showcase.end { legs, score }
// ---------------------------------------------------------------------------------------
import { SCORE } from '../../progress/rail/score.js';
import { MOUNTS } from '../../progress/rail/mounts.js';

// the first beat of each set piece, said once as it begins (rail.beat { beat, by: 'environment' }, Petra's rail at each beat's bar)
const OPENS = {
  boil: 'The crude boils under the hull.',
  sails: 'Sails astern: the Wreckers\' brig, the False Light.',
  heave: 'The sea heaves. Something vast is under it.',
};
const ENDS = {
  scattered: 'The Conductor falls, and the shoal scatters.', sunk: 'The False Light goes down. Her hold floats astern.',
  struck: 'The False Light strikes her colours.', limped: 'The False Light limps off.', driven: 'Old Nobody sounds, and is gone.',
  felled: 'Old Nobody is felled.',
};
const n = (x) => Math.round(x).toLocaleString('en-US');

export function railRules({ on, L, log }) {
  // the showcase crossing (DEBUG only: progress/rail/showcase.js): said, never counted (placeholder words for Espada's)
  on('showcase.start', (e) => log.say('system', `The showcase crossing: ${e.legs.length} legs, a hull each. Nothing is counted.`));
  on('showcase.hull', (e) => { const m = (e.mounts || []).map((id, i) => `${i + 1} ${MOUNTS[id]?.name || id}`).join(', ');
    log.say('info', `Your ship is a ${e.hull} for the next leg${m ? ` (mounts: ${m})` : ''}${e.note ? `: ${e.note}` : ''}.`); });
  on('showcase.mend', () => log.say('info', 'The showcase crossing mends your ship.', { key: 'showcase.mend', throttle: 4 }));
  on('showcase.end', (e) => log.say('system', `The showcase crossing is over: ${n(e.score)} points, nothing counted.`));
  on('rail.beat', (e) => { if (OPENS[e.beat]) log.say('combat', OPENS[e.beat], { key: 'railbeat', throttle: 2 }); });
  on('rail.end', (e) => { if (ENDS[e.end]) log.say(e.end === 'limped' ? 'info' : 'gain', ENDS[e.end], { key: 'railend', throttle: 2 }); });
  on('emocean.continue', (e) => { if (e.by !== 'courier') return; L.inc('rail.continue'); L.inc('rail.continue.cubes', e.cost || 0); log.say('info', `Continue: ${e.cost} cubes. The ship is mended.`); });
  on('emocean.stage', (e) => {
    if (e.by !== 'courier' || e.score == null) return;
    const enc = e.setPiece || 'shoal';
    for (const sp of e.setPieces || [enc]) L.inc(`rail.setpiece.${sp}`);
    if ((e.setPieces || []).length > 1) L.inc(`rail.legs.${e.setPieces.length}`); if (e.end) L.inc(`rail.end.${e.end}`);
    L.hi('rail.score.best', e.score); L.hi(`rail.score.best.${enc}`, e.score);
    if (e.rank) L.inc(`rail.rank.${e.rank}`);
    if (e.medal) L.inc('rail.medal');
    L.hi('rail.chain.best', e.chainBest || 0); L.hi('rail.volley.best', e.volleyBest || 0);
    for (const k of ['parried', 'absorbed', 'rolls', 'pointBlank', 'won', 'stolen', 'shards']) if (e[k]) L.inc(`rail.${k}`, e[k]);
    if (e.chainBest >= SCORE.chain.cap) L.inc('rail.chain.capped');
    log.say(e.passed ? 'gain' : 'warn', `The crossing: ${n(e.score)} (rank ${e.rank}), ${e.downed} of ${e.spawned} downed${e.medal ? ', a medal' : ''}${e.passed ? '' : '. The ship could bear no more'}.`);
  });
}
