// ---------------------------------------------------------------------------------------
// TRACKING, REPROGRAMMING: a stunned mind opened, the macro said into it and what it took, a Function learned. Moved out of tracking.js
// whole, the words unchanged (they are Espada's). Prior art: as tracking.js's (Old School RuneScape's counters, Final Fantasy XI's one
// sentence an event).
//
//   reprogramRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { KIND } from './lineformat.js';
import { FUNCTIONS } from '../../tools/veritome/mind/functions.js';

export function reprogramRules({ on, L, log }) {
  // reprogramming (tools/veritome/reprogram.js): a stunned mind opened, and the line typed into it
  on('reprogram.open', (e) => { L.inc('reprogram.open'); log.say('battle', `You open the ${KIND(e.kind)}'s mind.`, { key: 'rpo', throttle: 1 }); });
  on('reprogram.run', (e) => {
    L.inc('reprogram.run'); L.inc(`reprogram.macro.${e.macro}`); L.inc('reprogram.chars', e.chars); if (!e.misses) L.inc('reprogram.clean');
    if ((e.effects || []).length >= 5 && !e.misses && !(e.refused || []).length) L.inc('reprogram.held5'); // (five Functions held at the first try: the Crib Sheet's skilled way, progress/knacks.js)
    for (const f of e.effects || []) L.inc(`reprogram.fn.${f}`);
    L.hi('reprogram.q', Math.round((e.q || 0) * 100));
    const did = (e.effects || []).filter((f) => !(e.refused || []).includes(f)).map((f) => FUNCTIONS[f]?.label.toLowerCase()).filter(Boolean);
    log.say('battle', `You say ${e.macro.replace(/-/g, ' ')} into the ${KIND(e.kind)}'s mind. It ${did.length ? `takes it: ${did.join(', ')}` : 'hears it, and has no way to do it'}.`, {});
    if ((e.refused || []).length) log.say('warn', `Its mind has nothing that answers to ${e.refused.map((f) => FUNCTIONS[f]?.word).join(', ')}.`, { key: 'rpref', throttle: 1 });
  });
  on('reprogram.reject', (e) => { L.inc('reprogram.reject'); log.say('warn', `The ${KIND(e.kind)}'s mind throws ${e.macro.replace(/-/g, ' ')} off, and wakes. (A better-made macro takes better hold.)`, {}); });
  // the Functions (tools/veritome/mind/functions.js): learned by seeing them done
  on('mind.learn', (e) => { L.inc('mind.learn'); log.say('ach', `You have learned the neuralese ${FUNCTIONS[e.fn]?.word}: ${FUNCTIONS[e.fn]?.does.toLowerCase().replace(/\.$/, '')} (the Codex: VERITOME, THE MIND).`, {}); });
  on('mind.place', () => L.inc('mind.place'));
  on('reprogram.miss', () => L.inc('reprogram.miss'));
  on('reprogram.close', (e) => { if (e.why === 'time') { L.inc('reprogram.lost'); log.say('warn', `The ${KIND(e.kind)}'s mind snaps shut on you.`, {}); } });
  on('reprogram.wear', (e) => log.say('other', `What you wrote into the ${KIND(e.kind)} wears off.`, { key: 'rpw', throttle: 2 }));
}
