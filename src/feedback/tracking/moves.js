// ---------------------------------------------------------------------------------------
// TRACKING, THE MOVESETS: the rules that hear the moves of Calissa's suite (tools/moveset.js; the numbers: progress/combat/moves.js) and
// keep the counts their unlocks and achievements read: launchers, the air string's best, specials, paid cuts, the skiff's bails and ollies, and the
// tools' blows the unlocks count that no other rule keeps (the Dreamvane's, the Crucibelle's fever). Only the Courier's count (`by`). And the
// melee loadout's choosing (`loadout.set`, the loadout editor): a quiet line, nothing counted.
// tracking.js calls it from listen(). The words are placeholders for Espada's.
//
//   moveRules({ on, L, log })
// ---------------------------------------------------------------------------------------
import { MOVES } from '../../progress/combat/moves.js';
import { IDLES } from '../../courier/anim/idlebreak.js';
import { ordinal, SPECIAL_SLOTS } from '../../tools/sondelass/loadoutwords.js';

export function moveRules({ on, L, log }) {
  // move.launch { tool, by }: a launcher lifted something; move.air { tool, hits, by }: an air string ended with `hits` blows landed
  on('move.launch', (e) => { if (e.by === 'courier') L.inc('move.launch'); });
  on('move.air', (e) => { if (e.by !== 'courier') return; L.hi('move.air.best', e.hits || 0); if ((e.hits || 0) >= 6) log.say('battle', `An air string of ${e.hits}.`, { key: 'air', throttle: 2 }); });
  // move.special { tool, special, by }: a special used (its cost already paid)
  on('move.special', (e) => { if (e.by !== 'courier') return; L.inc('move.special'); L.inc(`move.special.${e.special}`); const s = MOVES[e.tool]?.special; if (s && s.id === e.special && !L.get(`move.special.${e.special}.said`)) { L.inc(`move.special.${e.special}.said`); log.say('gain', `A special: ${e.special}.`); } });
  // move.cut { tool, move, paid, cost, by }: a blow's recovery cut short for Lachryma (the paid cut, a working name); said once, to teach it
  on('move.cut', (e) => { if (e.by !== 'courier' || !e.paid) return; L.inc('move.cut.paid'); if (L.first('move.cut.paid')) log.say('gain', `You cut the recovery short for ${e.cost} Lachryma: a press once the blade has struck.`); });
  // loadout.set { tool, slot, move, label, by }: a slot of the melee loadout filled or emptied (tools/sondelass/loadoutchosen.js, from the
  // loadout editor); a quiet line, its words placeholders for Espada's ("Your string's third blow is now Heavy Chop.")
  on('loadout.set', (e) => {
    if (e.by !== 'courier') return;
    const S = SPECIAL_SLOTS.find((s) => s.dir === e.slot), what = e.move ? e.label || e.move : null;
    const text = S ? (what ? `${S.said} now plays ${what}.` : `${S.said} now plays your tap's special.`)
      : what ? `Your string's ${ordinal(e.slot)} blow is now ${what}.` : `Your string now ends after its ${ordinal(e.slot - 1)} blow.`;
    log.say('info', text, { key: `loadout.${e.slot}` }); // (no throttle: every change is its own line, so the last one names what the slot holds)
  });
  // the skiff (Calissa's suite): skiff.bail { speed, by }, skiff.ollie { geyser, by }
  on('courier.idle', (e) => log.say('info', `You will stand ${(IDLES.labels[e.stand]?.name ?? e.stand).toLowerCase()}.`, { key: 'courier.idle', throttle: 1 })); // (the kiln's STANCE kept: courier/vessel/kilnui.js; words a stand-in, Espada's)
  on('vantage.reach', (e) => { if (e.by === 'courier' && e.vantage) L.first(`vantage.${e.vantage}`); }); // (a vantage reached: its first kept, what Wonder's awakening reads: world/vantages.js)
  // the melee loadout's earning (MELEE-LOADOUT-EARNING.md, Dovina's; the events tools/moveset.js's): a blow that landed, a string's finisher on a
  // creature, and the longest run of LMB string blows landed in a row (string slots 5 to 8 open by it)
  on('move.blow', (e) => { if (e.by !== 'courier' || e.tool !== 'sondelass' || !e.move) return; if (e.hit) L.inc(`sond.move.${e.move}.hit`); if (e.finish) L.inc(`sond.move.${e.move}.finish`); });
  on('move.string.end', (e) => { if (e.by === 'courier' && e.tool === 'sondelass') L.hi('sond.string.best', e.run || 0); });
  on('skiff.glide', () => { L.inc('skiff.glide'); if (L.first('skiff.glide')) log.say('record', 'Logged: your first glide on the Solar Skiff.'); });
  on('skiff.bail', (e) => { if (e.by === 'courier') { L.inc('skiff.bail'); log.say('move', 'You bail.', { key: 'bail', throttle: 3 }); } });
  on('skiff.ollie', (e) => { if (e.by !== 'courier') return; L.inc('skiff.ollie'); if (e.geyser) L.inc('skiff.ollie.geyser'); });
  // the blows the unlocks count that no other rule keeps
  on('dreamvane.hit', (e) => { if ((e.by ?? 'courier') === 'courier') L.inc('dreamvane.hit'); });
  on('crucibelle.fever', (e) => { if ((e.by ?? 'courier') === 'courier') L.inc('crucibelle.fever'); });
}
