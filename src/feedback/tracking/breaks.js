// ---------------------------------------------------------------------------------------
// TRACKING, BREAKS: what the ledger keeps of pots and props broken and clapperjars downed, the break chain (`track.chain`), the room
// cleared, and the log's lines for them. Moved out of tracking.js whole, the words unchanged (they are Espada's). Prior art: as
// tracking.js's (Old School RuneScape's counters, Final Fantasy XI's one sentence an event).
//
//   breakRules({ on, L, log, where, track })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { plural, clock } from './lineformat.js';

const CLAP_LINE = {
  shot: 'The clapperjar is defeated.', sliced: 'The clapperjar is cleaved in two.', cooked: 'The clapperjar is baked to a crisp.',
  splat: 'The clapperjar splats.', well: 'The clapperjar is crushed.', explosion: 'The clapperjar is blown apart.',
  charged: 'The clapperjar is vaporised.', ricochet: 'The clapperjar is defeated by a banked shot.', homing: 'The clapperjar is hunted down.',
  bashed: 'The clapperjar is bashed to pieces.', slam: 'The clapperjar is flattened.', brushed: 'The clapperjar is erased.', rend: 'The clapperjar is rent in two.',
  bolt: 'The clapperjar is struck by lightning.', plunged: 'The clapperjar is driven into the ground.',
  judged: 'The raider is judged, and erased.',
};

export function breakRules({ on, L, log, where, track }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  // ---- breaking
  on('prop.break', (e) => {
    if (e.target) { L.inc('target.break'); return; }
    // (whose doing it was: only the Courier's are the Courier's records; the rest are said as what they were)
    if (e.by && e.by !== 'courier') {
      L.inc(`break.by.${e.by}`);
      const who = e.by === 'clapperjar' ? 'A clapperjar shatters' : null;
      if (who) log.say('other', `${who} the ${e.kind}.`, { key: `brc.${e.kind}`, win: 0.9, fmt: (n) => `${who} ${plural(n, e.kind)}.` });
      else log.say('other', `The ${e.kind} breaks.`, { key: `bre.${e.kind}`, win: 0.9, fmt: (n) => n > 1 ? `${plural(n, e.kind)[0].toUpperCase()}${plural(n, e.kind).slice(1)} break.` : `The ${e.kind} breaks.` });
      return;
    }
    L.inc('break.total'); L.inc(`break.kind.${e.kind}`); L.inc(`break.cause.${e.cause || 'shot'}`);
    const c = track.chain;
    c.n = e.t - c.t < 0.45 ? c.n + 1 : 1; c.t = e.t;
    if (c.n >= 2) { const r = L.hi('chain.max', c.n, { at: where() }); if (r === 'beat' && c.n >= 6) track.pending.set('chain.max', { text: `Your longest chain is now ${c.n}.`, t: 1.2 }); }
    if (c.n >= 3) log.say('battle', `You chain ${c.n} breaks.`, { key: 'chain', win: 0.6, fmt: () => `You chain ${track.chain.n} breaks.` });
    else log.say('battle', `You shatter the ${e.kind}.`, { key: `br.${e.kind}`, win: 0.9, fmt: (n) => `You shatter ${plural(n, e.kind)}.` });
    first(`kind.${e.kind}`, `Logged: your first ${e.kind} broken.`);
  });
  on('room.cleared', () => {
    L.inc('room.cleared');
    const r = L.lo('room.clear.time', track.roomT, { at: where() });
    log.say('explore', `Every pot in the workshop is broken (${clock(track.roomT)}${r === 'beat' || r === 'new' ? ', a best' : ''}). The Tab panel sets the room again.`);
  });
  on('room.reset', () => { track.roomT = 0; L.inc('room.reset'); });
  on('clapper.down', (e) => {
    if (e.by && e.by !== 'courier') return; // (a raider dismissed when a raid is left is no one's down: SWEEPS.md, basement 1)
    L.inc('clapper.down'); L.inc(`clapper.cause.${e.cause}`);
    if (e.raider) L.inc('clapper.raider');
    const c = track.chain;
    c.n = e.t - c.t < 0.45 ? c.n + 1 : 1; c.t = e.t;
    if (c.n >= 2) L.hi('chain.max', c.n, { at: where() });
    log.say('battle', CLAP_LINE[e.cause] || CLAP_LINE.shot, { key: 'clap', win: 1.2, fmt: (n) => `${n} clapperjars are defeated.` });
    first(`clapper.${e.cause}`, `Logged: a clapperjar ${e.cause === 'shot' ? 'shot down' : `taken by ${e.cause}`} for the first time.`);
  });
}
