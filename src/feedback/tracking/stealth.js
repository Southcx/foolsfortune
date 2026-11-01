// ---------------------------------------------------------------------------------------
// TRACKING, STEALTH: the ledger's counts and the log's line for a candid photograph, a Figment photographed that never knew you were
// there (progress/stealth.js CANDID; docs/plans/STEALTH.md 6). `photo.take` carries `candid` (the best subject's: 'candid', 'curious' or
// 'aware') and `d` (its distance, m) once the Veritome reads the subject's awareness (STEALTH.md 7, Petra's); until then nothing counts.
//
//   stealthRules({ on, L, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { phaseAt } from '../../progress/weather.js';

export function stealthRules({ on, L, log }) {
  on('photo.take', (e) => {
    if (e.candid !== 'candid' || !e.kind || e.kind === 'nothing') return;
    L.inc('photo.candid'); L.inc(`photo.candid.${e.kind}`);
    if (e.d != null && e.d <= 3) L.hi('photo.candid.near', 1);
    if (phaseAt() === 'night') L.hi('photo.candid.night', 1);
    log.say('gain', 'Candid shot! The Figment never noticed you.', { key: 'photo.candid', throttle: 4 });
    if (L.get('photo.candid') === 1) log.say('system', 'A candid photograph is one taken before the Figment notices you. It is worth more.', { key: 'photo.candid.gloss', throttle: 1 }); // (the first time only: Espada's gloss)
  });
}
