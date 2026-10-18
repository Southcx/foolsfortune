// ---------------------------------------------------------------------------------------
// TRACKING, THE STUN: a creature knocked out of itself, and taken deeper while it is down (creatures/stun.js; docs/plans/STUN-DEPTH.md).
// A first stun is dazed and counts as a stun (Impact's status, with the five forces'); taking it deeper counts only its depth
// (`stun.depth.2`, `stun.depth.3`) and each kind taken out cold (`creature.<kind>.outcold`). The log says the depth, out cold once
// a fight. Only the Courier's stuns count (`by`).
//
//   stunRules({ on, L, log })
// ---------------------------------------------------------------------------------------
const KIND = (k) => (k === 'slipjelly' ? 'slip jelly' : k === 'clapper' || k === 'clapperjar' ? 'clapperjar' : k === 'wisp' ? 'Lantern Wisp' : 'creature');

export function stunRules({ on, L, log }) {
  on('creature.stun', (e) => {
    if (e.by !== 'courier') return;
    const d = e.depth || 1;
    if (d > 1) {
      L.inc(`stun.depth.${d}`); if (d >= 3) L.inc(`creature.${e.kind}.outcold`);
      log.say('battle', `The ${KIND(e.kind)} is ${d >= 3 ? 'out cold' : 'stunned'}.`, { key: `stun${d}`, throttle: d >= 3 ? 6 : 1 });
      return;
    }
    L.inc('stun'); L.inc(`stun.${e.kind}`); L.inc(`stun.cause.${e.cause}`); L.inc('status.applied'); L.inc('status.stun'); // (the stun is Impact's status: the five forces' achievements read it with the others)
    log.say('battle', `The ${KIND(e.kind)} is dazed.`, { key: 'stun', throttle: 1 });
    if (L.first('stun')) log.say('record', 'Logged: your first stun. A stunned mind is open: stand close and press the middle button to reprogram it, or cut it along its line with the Sondelass. Strike it again while it is down to take it deeper.');
  });
}
