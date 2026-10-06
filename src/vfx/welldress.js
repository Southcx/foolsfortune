// ---------------------------------------------------------------------------------------
// THE WELL'S DRESSING: the look laid on the floor Petra builds (src/world/well/: the plan, the sand, the sandfalls' colliders and their
// cycle; her note, docs/handoffs/calissa/2026-10-06-from-petra-the-dunemaw-built.md). It watches the floor standing (`game.well.cur`)
// and, when a new one stands, dresses it; when it is taken down, undresses it:
//
//   SANDFALLS   each of the floor's sandfalls (`cur.sandfalls`: pos, yaw, state) gets a curtain of falling sand (vfx/dunemaw.js
//               Sandfall) in place of the plain stand-in sheet, driven by Petra's own state ('open' | 'warn' | 'falling')
//   (the sand itself is Petra's mesh in the kit's material, K.sand: vfx/dunemawkit.js, nothing to do here)
//
//   game.wellDress = new WellDress(game)   .update(rawDt)
// ---------------------------------------------------------------------------------------
import { Sandfall } from './dunemaw.js';

export class WellDress {
  constructor(game) { this.game = game; this.cur = null; this.falls = []; this.t = 0; }

  dress(cur) {
    for (const s of cur.sandfalls || []) {
      const f = new Sandfall({ width: 4.4, height: 4.6 }); // (a little wider and taller than the door it fills: it pours from above it)
      f.group.position.copy(s.pos); f.group.quaternion.copy(s.sheet?.quaternion || f.group.quaternion);
      (s.sheet?.parent || cur.group).add(f.group);
      if (s.sheet) s.sheet.material.visible = false; // (the stand-in: Petra's update still shows and hides it; its material stays unseen)
      this.falls.push({ s, f });
    }
  }

  undress() { for (const { f } of this.falls) { f.group.parent?.remove(f.group); f.dispose(); } this.falls = []; }

  update(raw = 1 / 60) {
    const cur = this.game.well?.active ? this.game.well.cur : null;
    if (cur !== this.cur) { this.undress(); this.cur = cur; if (cur) this.dress(cur); }
    if (!cur) return;
    this.t += raw;
    for (const { s, f } of this.falls) f.update(this.t, s.state, raw);
  }
}
