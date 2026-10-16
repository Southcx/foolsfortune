// ---------------------------------------------------------------------------------------
// TRACKING, FAMILIARITY: the counts familiarity reads (progress/familiarity.js; docs/plans/OVERLAY.md section 13). Every blow the
// Courier lands on a creature (`creature.struck`, from creatures.strike) counts toward that kind; a blow that takes it down counts its
// down, and a level reached is said once in the log ("You know the clapperjar better: OBSERVED"). Only the Courier's blows count (`by`).
// The event is asked of Petra (creatures.js): until it lands nothing here fires, and familiarity rests on the Veritome's photographs.
//
//   familiarityRules({ on, L, log })
// ---------------------------------------------------------------------------------------
import { familiarityOf } from '../../progress/familiarity.js';

export function familiarityRules({ on, L, log }) {
  on('creature.struck', (e) => {
    if (e.by !== 'courier' || !e.kind) return;
    const before = familiarityOf(L, e.kind).level;
    L.inc(`creature.${e.kind}.struck`);
    if (e.kill) L.inc(`creature.${e.kind}.down`);
    const now = familiarityOf(L, e.kind);
    if (now.level > before) log.say('record', `You know this kind better: ${now.name}.`, { key: `fam.${e.kind}` });
  });
}
