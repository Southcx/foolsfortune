// ---------------------------------------------------------------------------------------
// TRACKING, THE CROSSING: the rules that hear the rail shooter (progress/rail/: the crossing's score, its set pieces, its scoring;
// docs/plans/RAIL.md), keep the counts for THE EMOCEAN's achievements (The Rail), and say the few things worth a sentence: an
// set piece's first beat, how it ended, and the tally (Star Fox 64's: the score, the rank, the downs, the medal). The words are
// placeholders for Espada's. Registered before the voyage's rules, so the tally is said before "You make port". tracking.js calls it.
//
//   railRules({ on, L, log })
// ---------------------------------------------------------------------------------------
import { SCORE } from '../../progress/rail/score.js';

// the first beat of each set piece, said once as it begins (rail.beat { beat, by: 'environment' }, Petra's rail at each beat's bar)
const OPENS = {
  boil: 'The crude boils under the hull.',
  sails: 'Sails astern. Pirates.',
  heave: 'The sea heaves. Something vast is under it.',
};
const ENDS = {
  scattered: 'The shoal scatters.', sunk: 'The brig goes down. Her hold floats astern.', struck: 'The brig strikes her colours.',
  limped: 'The brig limps off.', driven: 'The Leviathan sounds, and is gone.', felled: 'The Leviathan is felled.',
};
const n = (x) => Math.round(x).toLocaleString('en-US');

export function railRules({ on, L, log }) {
  on('rail.beat', (e) => { if (OPENS[e.beat]) log.say('combat', OPENS[e.beat], { key: 'railbeat', throttle: 2 }); });
  on('rail.end', (e) => { if (ENDS[e.end]) log.say(e.end === 'limped' ? 'info' : 'gain', ENDS[e.end], { key: 'railend', throttle: 2 }); });
  on('emocean.stage', (e) => {
    if (e.by !== 'courier' || e.score == null) return;
    const enc = e.setPiece || 'shoal';
    L.inc(`rail.setpiece.${enc}`); if (e.end) L.inc(`rail.end.${e.end}`);
    L.hi('rail.score.best', e.score); L.hi(`rail.score.best.${enc}`, e.score);
    if (e.rank) L.inc(`rail.rank.${e.rank}`);
    if (e.medal) L.inc('rail.medal');
    L.hi('rail.chain.best', e.chainBest || 0); L.hi('rail.volley.best', e.volleyBest || 0);
    for (const k of ['parried', 'absorbed', 'rolls', 'pointBlank', 'won', 'stolen', 'shards']) if (e[k]) L.inc(`rail.${k}`, e[k]);
    if (e.chainBest >= SCORE.chain.cap) L.inc('rail.chain.capped');
    log.say(e.passed ? 'gain' : 'warn', `The crossing: ${n(e.score)} (rank ${e.rank}), ${e.downed} of ${e.spawned} downed${e.medal ? ', a medal' : ''}${e.passed ? '' : '. The ship came through broken'}.`);
  });
}
