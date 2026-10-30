// ---------------------------------------------------------------------------------------
// TRACKING, THE SLIP JELLY MOUNT (progress/jellymount.js; gj3's drop): its ledger and its log lines. Time ridden is booked when a ride
// ends, a bounce chain's best, blot cells drunk, a burst; the log says a call, a burst and its re-forming. Placeholder words, Espada's.
//
//   jellyMountRules({ on, L, log })   (tracking/rules.js calls it)
//   events read: mount.call { mount }, mount.ride (it holds: the first ride's line, once), mount.hop { chain }, mount.hurt { hp }, mount.burst, mount.end { why, secs }, stain.wash { by: 'mount' }
// ---------------------------------------------------------------------------------------
import { JELLY_MOUNT } from '../../progress/jellymount.js';

export function jellyMountRules({ on, L, log }) {
  const say = (kind, text, key, throttle = 2) => log.say(kind, text, { key, throttle });
  on('mount.call', (e) => { if (e.by !== 'courier' || e.mount !== 'slipjelly') return; L.inc('mount.slipjelly.call'); say('info', 'Your slip jelly wells up beside you.', 'jelly.call', 30); }); // (Espada's words, 2026-10-30)
  on('mount.ride', (e) => { if (e.by === 'courier' && e.mount === 'slipjelly' && L.first('mount.slipjelly.ride')) log.say('info', 'You climb onto the slip jelly. It quivers, and holds.'); }); // (the first ride, once: Espada's)
  on('mount.hop', (e) => { if (e.by === 'courier' && e.mount === 'slipjelly') L.hi('mount.slipjelly.hops.best', e.chain || 0); });
  on('mount.burst', (e) => { if (e.mount !== 'slipjelly') return; L.inc('mount.slipjelly.burst'); say('warn', `Your slip jelly bursts. It re-forms in ${JELLY_MOUNT.hp.reform} real seconds.`, 'jelly.burst'); });
  on('mount.end', (e) => { if (e.by !== 'courier' || e.mount !== 'slipjelly') return; if (e.secs > 0) L.inc('mount.slipjelly.secs', Math.round(e.secs)); });
  on('mount.drink', (e) => { if (e.by === 'courier' && e.mount === 'slipjelly') L.inc('mount.slipjelly.drink', e.cells || 1); });
}
