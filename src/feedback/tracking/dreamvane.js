// ---------------------------------------------------------------------------------------
// TRACKING, THE DREAMVANE: dowsing, the pick, crystals revealed, struck and harvested, the fork, and the slab it opens. Moved out of
// tracking.js whole, the words unchanged (they are Espada's). Prior art: as tracking.js's (Old School RuneScape's counters, Final Fantasy
// XI's one sentence an event).
//
//   dreamvaneRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { plural, an, ITEM } from './lineformat.js';

export function dreamvaneRules({ on, L, log }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  on('sealed.open', () => { L.inc('sealed.open'); log.say('info', 'The fork rings. The slab sinks into the sand.'); });
  on('plaster.break', () => L.inc('plaster.break'));
  // the last three tools (tools/dreamvane/dreamvane.js, crucibelle.js, lockheart.js): what they find, sing and let out
  const KINDNAME = { crystal: 'crystal', chest: 'a chest', creature: 'something alive', clapper: 'a clapperjar', spirit: 'a spirit', bauble: 'loose Lachryma', liquid: 'liquid Lachryma', cube: 'a cube' };
  on('dowse.find', (e) => { L.inc('dowse.find'); L.inc(`dowse.find.${e.kind}`); log.say('find', `The Dreamvane leans hard toward ${e.kind === 'crystal' ? (e.veiled ? 'crystal under the sand' : 'crystal') : KINDNAME[e.kind] || 'something'}, ${e.dist} paces off.`, { key: 'dfind', throttle: 2 }); });
  on('dowse.attune', () => L.inc('dowse.attune'));
  on('dreamvane.swing', () => L.inc('dreamvane.swing'));
  on('dreamvane.unearth', (e) => { L.inc('crystal.unearth', e.n); });
  on('crystal.reveal', (e) => { if (e.by === 'courier') L.inc('crystal.reveal'); log.say('find', e.how === 'pick' ? 'Crystal rises out of the sand where the pick went in.' : 'Crystal rises out of the sand at the song.', { key: 'xrev', throttle: 1 }); first('crystal', 'Logged: your first crystal. Lachryma set hard: the Dreamvane\'s pick takes it a blow at a time, and its fork, rung into it first, doubles what it gives and sounds the note it is set in. Struck where it answers in that note, it opens all at once.'); });
  let sweetRun = 0; // (sweet spots struck in a row: Perfect Pitch's feat)
  on('crystal.strike', (e) => { if (e.by === 'courier') { L.inc('crystal.strike'); sweetRun = e.sweet ? sweetRun + 1 : 0; L.hi('crystal.sweet.run', sweetRun); } if (e.ringing) L.inc('crystal.strike.ringing'); });
  on('crystal.ref', (e) => { if (!e.again) L.inc('crystal.ref'); }); // (Perfect Pitch's second reference is not a ring)
  on('crystal.harvest', (e) => {
    if (e.by !== 'courier') return;
    L.inc('crystal.harvest'); if (e.ringing) L.inc('crystal.harvest.ringing'); if (e.shard) L.inc('crystal.shard'); if (e.key) L.inc('crystal.key');
    if (e.nature) L.inc(`crystal.harvest.${e.nature}`); if (e.sweet) { L.inc('crystal.sweet'); if (e.nature) L.inc(`crystal.sweet.${e.nature}`); }
    log.say('find', `The crystal ${e.sweet ? 'sings true and falls' : 'breaks'} open${e.ringing ? ', ringing,' : ''} and gives up ${plural(e.worth, 'cube')}${e.shard ? ' and a shard of itself' : ''}${e.key ? `, and inside it, ${an(ITEM(e.key))}` : ''}.`, {});
  });
  on('fork.throw', () => L.inc('fork.throw'));
  on('fork.stick', (e) => { L.inc('fork.stick'); L.inc(`fork.stick.${e.what}`); if (e.what === 'creature') log.say('battle', 'Your tuning fork sinks into it, ringing.', { key: 'fstick', throttle: 2 }); });
  on('fork.drain', () => L.inc('fork.drain'));
  on('fork.catch', () => L.inc('fork.catch'));
}
