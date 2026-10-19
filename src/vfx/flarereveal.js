// ---------------------------------------------------------------------------------------
// A FLARE'S REVEAL MARK: what the Bombardier's flare found (tools/psygun/variantplay.js sets `c.revealed` on every creature within its
// 6 m, for its 8 s) worn as a world mark: a ring of the flare's light on the ground under it and the MARK shell's sign over it, both seen
// through walls, held while `c.revealed` holds and gone with it (the library's `psygun.reveal`, vfx/psygunvarianteffects.js). No words
// and no tag: the creature tags stay the lock-on's and the lens's (creaturetags.js); this says only "there is one there".
//
// Prior art: Far Cry's tagged enemies (a mark seen through cover while it lasts), Metal Gear Solid V's marking, and the game's own
// MARK shell (its sign is the same six rays).
//
//   const R = new FlareReveal(game)   R.update()   (each frame, beside the other world marks: main.js)   R.shown -> how many are marked
// ---------------------------------------------------------------------------------------

export class FlareReveal {
  constructor(game) { this.game = game; this.on = new Map(); }
  get shown() { return this.on.size; }

  update() {
    const g = this.game, vfx = g.vfx;
    for (const [c, h] of this.on) if (!h.alive || !c.revealed) this.on.delete(c);
    if (!vfx || !g.creatures?.list) return;
    for (const c of g.creatures.list) {
      if (!c.revealed || !c.alive || this.on.has(c)) continue;
      const scale = Math.min(2, Math.max(0.6, (c.height || 1.2) / 1.2)); // (the sign stands over its head: sized by its height)
      const h = vfx.play('psygun.reveal', { pos: c.pos.clone(), scale, throughWalls: true, follow: (hh) => (c.alive && c.revealed ? (hh.pos.copy(c.pos), true) : false) });
      if (h) this.on.set(c, h);
    }
  }
}
