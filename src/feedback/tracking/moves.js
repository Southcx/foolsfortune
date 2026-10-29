// ---------------------------------------------------------------------------------------
// TRACKING, THE MOVESETS: the rules that hear the moves of Calissa's suite (tools/moveset.js; the numbers: progress/combat/moves.js) and
// keep the counts their unlocks and achievements read: launchers, the air string's best, specials, paid cuts, the skiff's bails and ollies, and the
// tools' blows the unlocks count that no other rule keeps (the Dreamvane's, the Crucibelle's fever). Only the Courier's count (`by`). And the
// melee loadout's choosing (`loadout.set`, the loadout editor): a quiet line, nothing counted.
// tracking.js calls it from listen(). The words are placeholders for Espada's.
//
//   moveRules({ on, L, log, g })   events: move.learn { tool, move, parent, by } (a melee move opened, once)
// ---------------------------------------------------------------------------------------
import { MOVES, unlocked } from '../../progress/combat/moves.js';
import { SONDELASS_MOVES } from '../../tools/sondelass/sondelassloadout.js';
import { IDLES } from '../../courier/anim/idlebreak.js';
import { ordinal, SPECIAL_SLOTS } from '../../tools/sondelass/loadoutwords.js';

const BAIL_SAYS = { wall: 'You hit it head-on and bail.', sideways: 'You land sideways and bail.', land: 'The drop is too sheer. You bail.' };

/** The melee loadout's rows that are learned (a `parent` in MOVES.sondelass: MELEE-LOADOUT-EARNING.md 2), checked after the acts that open them. */
const LEARNABLE = Object.entries(MOVES.sondelass).filter(([, m]) => m.parent).map(([id]) => id);
const OPENERS = ['move.blow', 'kick.hit', 'move.launch', 'cut.stinger', 'cut.hit', 'move.parry'];

export function moveRules({ on, L, log, g }) {
  // a melee move opened (MELEE-LOADOUT-EARNING.md 2: "Each opening is said in the log once"): move.learn { tool, move, parent, by }, once a
  // move a build (the ledger's `sond.learn.<id>` keeps that it was said; the move's own rule is its predicate, never this)
  const learn = () => { for (const id of LEARNABLE) { if (L.get(`sond.learn.${id}`) || !unlocked('sondelass', id, L)) continue;
    L.inc(`sond.learn.${id}`); const row = SONDELASS_MOVES[id], kind = row?.kind === 'special' ? 'special' : 'move';
    g?.events?.emit('move.learn', { tool: 'sondelass', move: id, parent: MOVES.sondelass[id].parent, by: 'courier' });
    log.say('gain', `You learn a new Sondelass ${kind}: ${row?.label || id}. Slot it at the sparring circle's lectern.`); } };
  for (const ev of OPENERS) on(ev, (e) => { if ((e.by ?? 'courier') === 'courier') queueMicrotask(learn); }); // (after the counts below are kept)
  // move.launch { tool, by }: a launcher lifted something; move.air { tool, hits, by }: an air string ended with `hits` blows landed
  on('move.launch', (e) => { if (e.by === 'courier') L.inc('move.launch'); });
  on('move.air', (e) => { if (e.by !== 'courier') return; L.hi('move.air.best', e.hits || 0); if ((e.hits || 0) >= 6) log.say('battle', `An air string of ${e.hits}.`, { key: 'air', throttle: 2 }); });
  // move.special { tool, special, by }: a special used (its cost already paid)
  on('move.special', (e) => { if (e.by !== 'courier') return; L.inc('move.special'); L.inc(`move.special.${e.special}`); const s = MOVES[e.tool]?.special; if (s && s.id === e.special && !L.get(`move.special.${e.special}.said`)) { L.inc(`move.special.${e.special}.said`); log.say('gain', `A special: ${e.special}.`); } });
  // move.cut { tool, move, paid, cost, by }: a blow's recovery cut short for Lachryma (the paid cut, a working name); said once, to teach it
  on('move.cut', (e) => { if (e.by !== 'courier' || !e.paid) return; L.inc('move.cut.paid'); if (L.first('move.cut.paid')) log.say('gain', `You pay ${e.cost} Lachryma to cut the recovery short.`); });
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
  // (`struck`, how many one blow struck, and `effect`, what it did to a body: guardBreak, trip, knock; sent by tools/stringrun.js)
  on('move.blow', (e) => { if (e.by !== 'courier' || e.tool !== 'sondelass' || !e.move) return; if (e.hit) L.inc(`sond.move.${e.move}.hit`); if (e.finish) L.inc(`sond.move.${e.move}.finish`); if (e.struck) L.hi('sond.struck.best', e.struck); if (e.hit && e.effect) L.inc(`sond.effect.${e.effect}`); });
  on('move.string.end', (e) => { if (e.by === 'courier' && e.tool === 'sondelass') L.hi('sond.string.best', e.run || 0); });
  on('skiff.glide', () => { L.inc('skiff.glide'); if (L.first('skiff.glide')) log.say('record', 'Logged: your first glide on the Solar Skiff.'); });
  on('skiff.bail', (e) => { if (e.by === 'courier') { L.inc('skiff.bail'); log.say('move', BAIL_SAYS[e.why] || 'You bail.', { key: 'bail', throttle: 3 }); } }); // (why, said: docs/plans/SKIFF-RACING.md section 3)
  on('skiff.ollie', (e) => { if (e.by !== 'courier') return; L.inc('skiff.ollie'); if (e.geyser) L.inc('skiff.ollie.geyser'); });
  // the blows the unlocks count that no other rule keeps
  on('dreamvane.hit', (e) => { if ((e.by ?? 'courier') === 'courier') L.inc('dreamvane.hit'); });
  on('crucibelle.fever', (e) => { if ((e.by ?? 'courier') === 'courier') L.inc('crucibelle.fever'); });
}
