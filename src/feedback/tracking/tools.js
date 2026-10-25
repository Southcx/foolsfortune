// ---------------------------------------------------------------------------------------
// TRACKING, THE TOOLS ON THE BELT: a tool made the main or the sub, and the sub lending its verb. Moved out of tracking.js whole, the
// words unchanged (they are Espada's). Prior art: as tracking.js's (Old School RuneScape's counters, Final Fantasy XI's one sentence an
// event).
//
//   toolRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { PAIRS } from '../../progress/toolpairs.js';

export function toolRules({ on, L, log }) {
  // the tools: the main and the sub (tools/belt.js equip; the pair's card, progress/toolpairs.js)
  const TOOLNAME = (t) => ({ psygun: 'Psygun', sondelass: 'Sondelass', soulbrush: 'Soul Brush', veritome: 'Veritome', dreamvane: 'Dreamvane', crucibelle: 'Crucibelle', lockheart: 'Lockheart' }[t] || t);
  on('tool.equip', (e) => {
    L.inc('tool.equip'); L.inc(`tool.equip.${e.tool}`); L.inc(`tool.equip.${e.as}.${e.tool}`);
    const P = PAIRS.find((p) => p.n === e.pair);
    log.say('info', `You make the ${TOOLNAME(e.tool)} your ${e.as}${e.off ? `, and set the ${TOOLNAME(e.off)} aside` : ''}.${P ? ` Your pair: ${P.label}.` : ''}`, { key: 'tequip', throttle: 0.2 });
  });
  on('tool.lend', (e) => { L.inc('tool.lend'); L.inc(`tool.lend.${e.tool}`); }); // (the sub's verb on R: what it did is its own event's line)
}
