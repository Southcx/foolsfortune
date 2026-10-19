// ---------------------------------------------------------------------------------------
// WHERE A PUZZLE DUEL IS MET (docs/plans/PUZZLE-DUELS.md section 8; the owner, board v11: "the test enemy is an aberrant Lantern Wisp"):
// F at an aberrant Figment (one drawn wrong: c.aberrant, a data bug, vfx/databug.js) begins its duel (world/duel/duelsession.js), from the
// thing itself and never a global key (CLAUDE.md, Scope). Any aberrant offers it, the blotlings too (world/ground/stains.js); its feeling
// picks its rules (progress/duel/rulesets.js), its own else its grade, else Fury. The test enemy: one of the Dunes' Lantern Wisps is
// kept aberrant (the first alive), and again after it is mended and comes back, so the duel can be tried more than once. Nothing is
// offered until the view exists (game.duelView), so a build without it shows no half of a duel.
//
// Prior art: the symbol encounter of the RPGs (the foe met on the field, touched to fight: Chrono Trigger, Persona), Raku's tables here
// (world/bazaar/bazaar.js: F at the thing, the chevron on it).
//
//   game.duelFoes = new DuelFoes(game)   .update()   DUEL_FOES (the test wisp's feeling, F's reach)
// ---------------------------------------------------------------------------------------
export const DUEL_FOES = { reach: 3.5, wispFeeling: 'fury' }; // (a Lantern Wisp is fire: Fury's rules until Dovina rules otherwise)

export class DuelFoes {
  constructor(game) { this.game = game; this.wired = false; }

  /** An aberrant Figment's feeling, for its rules. */
  static feelingOf(c) { return c.feeling ?? c.grade ?? (c.kind === 'wisp' ? DUEL_FOES.wispFeeling : 'fury'); }

  update() {
    const g = this.game; if (!g.interact || !g.duel) return;
    if (!this.wired) {
      this.wired = true;
      g.interact.add('duel', () => {
        if (!g.duelView || g.duel.active || g.god?.controlling || g.dialogue?.open) return null; // (no board to stand yet, no duel: Calissa's view)
        const P = g.player.pos; let best = null;
        for (const c of g.creatures?.list || []) {
          if (!c.alive || !c.aberrant || c.dataBugMended || c.ally || c.spirit) continue;
          const d = Math.hypot(c.pos.x - P.x, c.pos.z - P.z);
          if (d < DUEL_FOES.reach && Math.abs(c.pos.y - P.y) < 4 && (!best || d < best.d)) best = { pos: c.pos.clone().setY(c.pos.y + (c.height ?? 1.5) + 0.6), d, ref: c };
        }
        return best;
      });
    }
    // the test enemy: the first Lantern Wisp alive is kept aberrant (and its feeling set) while no other is
    const W = g.wisps?.list || [];
    if (!W.some((c) => c.aberrant && c.alive)) { const c = W.find((x) => x.alive); if (c) { c.aberrant = true; c.dataBugMended = false; c.feeling = DuelFoes.feelingOf(c); c.name = 'Aberrant Lantern Wisp'; } } // (Espada names it)
    const it = g.interact.cur, P = g.player;
    if (it?.id === 'duel' && P.peekLatch?.('KeyF')) { P.latch('KeyF'); if (it.ref.feeling == null) it.ref.feeling = DuelFoes.feelingOf(it.ref); g.duel.begin(it.ref); }
  }
}
