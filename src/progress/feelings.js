// ---------------------------------------------------------------------------------------
// THE AWAKENINGS: how each of the seven feelings is learned (docs/plans/FEELINGS-AWAKENING.md; the owner, 2026-10-11: "make the unlock
// requirements for the emotions be tied to what the emotion itself actually is"). All seven start locked. A feeling wakes the first
// time the Courier lives it (the FEAT way: an act that is that feeling, a predicate over the ledger), or after drinking it in its own
// weather on enough occasions (the COUNT way, so no one is stuck). The wake is said once as an event (`feeling.wake`), and its rule
// counts `feeling.known.<id>`, which the radial, Full Spectrum and the Figment-telegraph steps read. Data and one small poller.
//
// Prior art: Inside Out's core memories (a feeling born of an event that is that feeling), Okami's brush techniques learned in staged
// scenes, Journey's wordless set pieces, Breath of the Wild's vistas, and OSRS's count way beside the feat way.
//
//   FEELING_WAKE[id] = { feat(L) -> bool, does, line }   wakeOf(id, L) -> 'feat' | 'count' | null   new Feelings(game).update(dt)
// ---------------------------------------------------------------------------------------
import { ASPECTS } from './weather.js';

const G = (L, k) => L?.get?.(k) || 0;
/** Drinking a feeling in its own weather on this many occasions wakes it too (a change of the feeling drunk is an occasion: mind.js). */
export const WAKE_COUNT = 5;
/** Each feeling's feat (the owner's table, 2026-10-11), and its line in the log, in the feeling's own voice (Espada's to finish; Wonder's
 *  is the owner's). `does` is the Codex's one line of how. */
export const FEELING_WAKE = {
  wonder: { does: 'Stand at a vantage and look out.', feat: (L) => (L?.firstCount?.('vantage.') || 0) >= 1,
    line: 'It feels like the sky goes on further than you ever knew.' },
  mirth:  { does: 'Play for a crowd, or make the folk laugh.', feat: (L) => G(L, 'rhythm.combo') >= 10 || G(L, 'npc.mood.joy') >= 6,
    line: 'Something in you laughs before you know why.' },
  desire: { does: 'Want something, and have it.', feat: (L) => G(L, 'shop.buy.best') >= 480 || G(L, 'chest.open.epic') + G(L, 'chest.open.prismatic') >= 1,
    line: 'You wanted it, and now it is yours, and you want more.' },
  grief:  { does: 'Lose what you staked.', feat: (L) => G(L, 'lockheart.out.dud') >= 3 || G(L, 'well.haul.lost') >= 1,
    line: 'It is gone, and the place where it was stays.' },
  dread:  { does: 'Face what waits below.', feat: (L) => G(L, 'foe.faced') >= 1,
    line: 'The dark leans closer, and you hold still.' },
  fury:   { does: 'Answer a blow with a blow.', feat: (L) => G(L, 'parry.run.best') >= 10 || G(L, 'foe.break') >= 1,
    line: 'Your hands are shaking, and not from fear.' },
  gall:   { does: 'Clean up what rots.', feat: (L) => G(L, 'stain.wash.grown') >= 1 || G(L, 'clutch.break') >= 1,
    line: 'Your throat closes on it. You do it anyway.' },
};
/** How a feeling would wake now: by its feat, by the count, or not yet (null). */
export function wakeOf(id, L) {
  const W = FEELING_WAKE[id];
  if (!W) return null;
  if (W.feat(L)) return 'feat';
  return G(L, `feeling.drunk.${id}`) >= WAKE_COUNT ? 'count' : null;
}

/** The poller: once a real second, each feeling not yet known is asked; the first that wakes is said (one a second, so two never
 *  overlap their moment). */
export class Feelings {
  constructor(game) { this.game = game; this.t = 0; }
  update(dt) {
    if ((this.t += dt) < 1) return;
    this.t = 0;
    const g = this.game, L = g.ledger;
    if (!L) return;
    for (const id of ASPECTS) {
      if (G(L, `feeling.known.${id}`) > 0) continue;
      const how = wakeOf(id, L);
      if (how) { g.events?.emit('feeling.wake', { feeling: id, how, by: 'courier' }); return; }
    }
  }
}
