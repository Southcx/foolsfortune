// ---------------------------------------------------------------------------------------
// THE HOW-TO'S RING (Petra's ask, 2026-10-30; the garden's how-to played by world/garden/howto.js, Dovina's steps in
// progress/gardenhowto.js GARDEN_HOWTO): each step's spot ringed while that step stands, a world mark with no words. A gold band laid on
// the spot's ground at its rim (a band, never a hairline: casebook 373), the running hand round inside it, the film's thinner hoop breathing outside it and a faint pillar standing up so it
// reads from across the sky (the library's garden.howto.ring); the open sky of the ring (`show: 'ring'`) a hoop hung over the Dantian with
// no pillar (garden.howto.sky). It follows the Pneuka Jar while a step shows the Jar or the hand, eases out at a step's turn and in at the
// next spot, and goes when the how-to is put away or the garden is left. Its size is what it rings (HOWTO_RING.size, the hoop's radius in
// metres).
//
// Prior art: a coach-mark tour's spotlight, Animal Crossing's sparkle on the spot to dig, Super Mario Galaxy's launch star rings.
//
//   game.howtoRing = new HowtoRing(game)   .update()   HOWTO_RING
// ---------------------------------------------------------------------------------------
import { GARDEN_HOWTO } from '../../progress/gardenhowto.js';

/** lift: metres over the spot's ground (clear of its grass); size: the hoop's radius by what the step shows. */
export const HOWTO_RING = { lift: 0.06, size: { jar: 1.1, hand: 1.1, shed: 3.6, ring: 6, lotus: 1.8, shrine: 1.9, bench: 1.7 } };

export class HowtoRing {
  constructor(game) { this.game = game; this.h = null; this.step = -1; this.show = null; }

  /** Once a frame: the step's ring put down when the step turns, kept under the Pneuka Jar while it is what the step shows. */
  update() {
    const R = this.game.realm, H = R?.active ? R.howto : null, i = H?.showing ? H.i : -1;
    if (i !== this.step) { this.step = i; this.put(H, i); }
    if (this.h && (this.show === 'jar' || this.show === 'hand')) this.place(H.spot(this.show));
  }

  put(H, i) {
    this.h?.stop(); this.h = null; this.show = null;
    const st = i >= 0 ? GARDEN_HOWTO.steps[i] : null, s = st ? H.spot(st.show) : null;
    if (!s || !this.game.vfx?.play) return;
    this.show = st.show;
    this.h = this.game.vfx.play(st.show === 'ring' ? 'garden.howto.sky' : 'garden.howto.ring', { pos: s.O, dir: s.U, scale: HOWTO_RING.size[st.show] ?? 1.5 });
    this.place(s);
  }

  place(s) {
    if (!s || !this.h) return;
    this.h.pos.copy(s.O).addScaledVector(s.U, HOWTO_RING.lift); this.h.dir.copy(s.U);
  }
}
