// ---------------------------------------------------------------------------------------
// TRACKING, THE SLIP JELLIES: what they do and what is done to them: noticing, striking, bursting, eating, fishing, fetching, brawling,
// and a foe the sibling finished credited to the Courier. Moved out of tracking.js whole, the words unchanged (they are Espada's). Prior
// art: as tracking.js's (Old School RuneScape's counters, Final Fantasy XI's one sentence an event).
//
//   jellyRules({ on, L, log, g })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { plural } from './lineformat.js';

export function jellyRules({ on, L, log, g }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  // the slip jellies (creatures/jelly/slipjelly.js): what they do to them and what they do to them; a blow by anything else is said as what it was
  on('jelly.notice', () => { L.inc('jelly.noticed'); log.say('battle', 'A slip jelly turns toward you.', { key: 'jnot', throttle: 4 }); });
  on('jelly.hit', (e) => { if (e.by === 'courier') { L.inc('jelly.hit'); L.inc(`jelly.hit.${e.cause}`); } });
  on('jelly.strike', (e) => { L.inc('jelly.struck'); L.inc(`jelly.struck.${e.move}`); log.say('warn', e.move === 'lunge' ? 'The slip jelly throws itself at you.' : 'The slip jelly spits slip at you.', { key: `jstr.${e.move}`, throttle: 1.5 }); });
  on('jelly.cancel', (e) => { L.inc('jelly.cancelled'); L.inc(`jelly.cancelled.${e.why}`); if (e.why === 'staggered') log.say('battle', 'Your blow breaks the slip jelly\'s wind-up.', { key: 'jcan', throttle: 1 }); });
  on('jelly.burst', (e) => {
    if (e.by === 'courier' && e.cause === 'zandatsu') { L.inc('jelly.burst'); L.inc('jelly.burst.zandatsu'); return; } // (said by creature.zandatsu)
    if (e.by === 'courier') { L.inc('jelly.burst'); L.inc(`jelly.burst.${e.cause}`); log.say('battle', 'You burst the slip jelly.', { key: 'jbur', win: 1, fmt: (n) => `You burst ${plural(n, 'slip jelly').replace('jellys', 'jellies')}.` }); first('jelly', 'Logged: your first slip jelly. It forms again from its puddle in a while.'); }
    else log.say('other', 'The slip jelly bursts.', { key: 'jbur2', throttle: 1 });
  });
  // a foe the owner struck and a sibling finished is the owner's (docs/plans/COOP.md: FFXIV's credit by taking part); the death itself
  // stays the sibling's (`by: 'sibling'`), so it counts here, once, as a burst by the owner (cause 'party')
  on('creature.credit', (e) => { if (e.by !== 'courier') return; L.inc('creature.credit'); if (e.kind === 'slipjelly' || e.kind === 'jelly') { L.inc('jelly.burst'); L.inc('jelly.burst.party'); } });
  // their lives, said when they are near enough to see (creatures/jelly/mind.js): what they eat, what they catch, what they bring, whom they fight
  const seen = () => { const P = g.player.pos; return g.jellies?.list.some((c) => c.alive && c.pos.distanceTo(P) < 30); };
  on('jelly.eat', (e) => { L.inc('jelly.ate'); if (seen()) log.say('other', e.what === 'cube' ? 'A slip jelly swallows a cube of Lachryma.' : 'A slip jelly swallows a bauble of Lachryma.', { key: 'jeat', throttle: 8 }); });
  on('jelly.fish', () => { L.inc('jelly.fished'); if (seen()) log.say('other', 'A slip jelly snatches a fish from the shallows.', { key: 'jfish', throttle: 10 }); });
  on('jelly.fetch', () => { L.inc('jelly.fetched'); log.say('battle', 'The slip jelly brings you Lachryma.', { key: 'jfetch', throttle: 2 }); });
  on('jelly.brawl', () => { L.inc('jelly.brawl'); if (seen()) log.say('other', 'Slip jellies fight among themselves.', { key: 'jbrawl', throttle: 6 }); });
}
