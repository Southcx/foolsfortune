// ---------------------------------------------------------------------------------------
// TRACKING, TREASURE: chests in five tiers, the cubes they hold and the cubes earned, spent and spilled, the curios, the Tithe, the
// System's grant. Moved out of tracking.js whole, the words unchanged (they are Espada's). Prior art: as tracking.js's (Old School
// RuneScape's counters, Final Fantasy XI's one sentence an event).
//
//   treasureRules({ on, L, log, where })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { plural, an, said } from './lineformat.js';
import { TIERS, CURIO_BY_ID, TITHE, hex } from '../../world/treasure/treasure.js';

export function treasureRules({ on, L, log, where, g }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  // ---- treasure (src/world/treasure/chests.js, ceremony.js, cubes.js): chests in five tiers, the cubes they hold, the curios, the Tithe
  // (the tier's colour is the line's colour: what kind of thing it was is read before the words are)
  const tone = (t) => hex(t === 4 ? 0xfff2c8 : TIERS[t].rgb);
  on('chest.open', (e) => {
    const t = TIERS[e.tier];
    L.inc('chest.open'); L.inc(`chest.open.${t.id}`); if (e.sealed) L.inc('chest.open.sealed'); if (e.kind === 'near') L.inc('chest.near');
    L.hi('chest.cubes.max', e.cubes, { at: where() });
    if (e.id && !L.has(`chest.${e.id}`)) L.first(`chest.${e.id}`);
    log.say('loot', e.sealed ? `The sealed chest was ${an(t.name)} chest!` : `You open the ${t.name} chest.`, { tone: tone(e.tier) });
    log.say('loot', `It holds ${plural(e.cubes, 'Lachryma cube')}.`, { tone: '#ffd98a' });
    if (e.sealed && e.kind === 'near') log.say('loot', 'So close to something better.', { tone: '#c9b48a' });
    if (e.tier === 4) log.say('ach', 'The lights go out. The chest has a great deal to say.', {});
  });
  on('cube.earn', (e) => { if (e.why === 'debug') return; L.inc(`cube.src.${e.why}`, e.n); if (e.why === 'busk') log.say('gain', `Busking tip: ${plural(e.n, 'cube')}.`); }); // (busking: Dovina's buskPay)
  on('cube.spend', (e) => { L.inc(`cube.use.${e.why}`, e.n); });
  on('cube.spill', (e) => { L.inc(`cube.spill.${e.from}`, e.n); if (e.from === 'zandatsu') log.say('loot', `The core condenses into ${plural(e.n, 'Lachryma cube')}.`, { key: 'zcube', win: 1.2, fmt: () => 'The cores condense into cubes.' }); });
  on('curio.get', (e) => {
    const c = CURIO_BY_ID[e.id], t = TIERS[c.tier];
    if (e.dupe) { L.inc('curio.dupe'); log.say('loot', `The Book can hold no more of the ${c.name}. It condenses into cubes.`, { tone: tone(c.tier) }); return; }
    L.inc('curio.total'); L.inc(`curio.tier.${t.id}`);
    log.say('loot', `You find the ${c.name}!`, { tone: tone(c.tier) });
    if (L.first(`curio.first.${e.id}`)) log.say('record', `Logged: the ${c.name}. ${c.blurb}`);
  });
  on('econ.grant', (e) => log.say('system', `The System grants you ${plural(e.n, 'Lachryma cube')}.`));
  on('tithe.pull', () => { log.say('loot', said(g, `You feed the Tithe ${plural(TITHE.cost, 'cube')}. A sealed chest falls onto the dais: {use} at it breaks the seal.`), { tone: '#d6c8ff' }); }); // (how to open it, said where it lands: QA-A; the words a placeholder for Espada's)
  on('chest.drop', (e) => { L.inc('chest.drop'); if (e.from === 'catch') log.say('loot', 'A chest falls out of the air.', { tone: tone(e.tier) }); });
}
