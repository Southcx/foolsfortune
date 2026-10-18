// ---------------------------------------------------------------------------------------
// CAPS ON THE POOL (the owner, 2026-10-15: "base change bad, modifiers good"; "each broken part is like -5% max Lachryma until mended"):
// the pool's base never changes; what lowers its max is a CAP, a modifier with a source you can see in the world. The first is the
// vessel's own: each region of the vessel cracked (the mask, the torso, an arm, a leg: courier/vessel/damage.js) takes 5% off the max until
// it mends, so a battered Courier carries less Lachryma, the ARPG's cost of being hit. A cap is a modifier on the pool
// (`game.lachryma.addModifier`) that carries `source` (what in the world caps it) and `caps: true`; the Lachrimeter's tube asks `capOf(pool)`
// for how much of the tube is held off, and by what, and shows it (Calissa's: vfx/lachrimetertube.js, its held stretch).
// Events: pool.cap { source, share } when a cap changes (with `by`).
//
// Prior art: Monster Hunter's red health (the bar's lost part shown, and won back), Diablo's curses that cap a resource, Zelda's and Hades' gauges that show a capped part as a different colour; the house's own modifier stack
// (courier/lachryma.js).
//
//   const C = new PoolCaps(game)   capOf(pool) -> { full, max, held, by: [{ source, held }] }   CAP (the numbers)
// ---------------------------------------------------------------------------------------

/** The share of the max one cracked region caps (the owner's 5%), and what counts as cracked (a crack over this, 0..1). */
export const CAP = { crack: 0.05, cracked: 0.001 };

/** How much of the pool's max is held off by caps, and by what: `full` the max without them, `max` with them. */
export function capOf(pool) {
  const mods = [...(pool?.modifiers?.entries?.() || [])], caps = mods.filter(([, m]) => m.caps);
  if (!pool || !caps.length) return { full: pool?.max ?? 0, max: pool?.max ?? 0, held: 0, by: [] };
  let b = pool.baseMax, k = 1; for (const [, m] of mods) if (!m.caps) { b += m.maxBonus || 0; k *= m.maxMult || 1; }
  const full = b * k, max = pool.max;
  const by = caps.map(([id, m]) => ({ id, source: m.source, held: full - (b + (m.maxBonus || 0)) * k * (m.maxMult || 1) }));
  return { full, max, held: Math.max(0, full - max), by };
}

export class PoolCaps {
  constructor(game) {
    this.game = game; this.cracked = 0;
    const again = () => this.cracks();
    for (const k of ['vessel.crack', 'vessel.mend', 'courier.reform']) game.events?.on(k, again);
  }
  /** The vessel's cracked regions as a cap: 5% each until mended. */
  cracks() {
    const g = this.game, L = g.lachryma, C = g.vesselDamage?.crack; if (!L || !C) return;
    let n = 0; for (const c of C) if (c > CAP.cracked) n++;
    if (n === this.cracked) return; this.cracked = n;
    if (n) L.addModifier('cap.cracks', { maxMult: 1 - CAP.crack * n, caps: true, source: 'cracks' }); else L.removeModifier('cap.cracks');
    g.events?.emit('pool.cap', { source: 'cracks', share: +(CAP.crack * n).toFixed(2), regions: n, by: 'environment' });
  }
}
