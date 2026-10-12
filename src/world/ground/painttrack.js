// ---------------------------------------------------------------------------------------
// THE COURIER THROUGH PAINT: what moving through the paint map does to it (docs/plans/PAINT.md, the owner, 2026-10-12: the paint should
// "smear based on running around/sliding in it"). Walking or running, the feet take up some of what they stand in (a feeling's paint, a
// blot's crude, a slick) and print it on the ground a few strides on, each print fainter (crude prints as a slick, which fades). A slide
// (the core slide, the Brush Slide) or the Paint Dive on a floor drags what is under the body along with it (paintmap.smear): lifted
// behind, laid ahead, so a slide through paint leaves a streak and a slide through a blot drags a tongue of crude out of it.
//
// Prior art: Super Mario Sunshine's goop (Mario tracks it about, and a belly slide pushes it), Splatoon's roller and the ink trail a
// squid leaves, and every game's wet footprints (blood in Hitman, mud in Uncharted: a print a stride, fading).
//
//   game.paintTrack = new PaintTrack(game)   .update(dt) (once a frame, before the paint map's)   PAINT_TRACK (the knobs, Dovina's to tune)
// ---------------------------------------------------------------------------------------

/** pick: how much of a cell's depth the foot takes up; print: how much of what it carries a print lays; fade: what is left after a
 *  print; stride: metres between prints; side: a foot's offset from the middle (m); foot: a print's radius (m: at least half a cell's diagonal, 0.177, or a print can land in no cell); smearR: the body's
 *  reach on a slide (m); share: how much of a cell a slide drags along per metre of the reach crossed. */
export const PAINT_TRACK = { pick: 0.5, print: 0.6, fade: 0.7, stride: 0.62, side: 0.12, foot: 0.18, smearR: 0.5, share: 0.35 };

export class PaintTrack {
  constructor(game) {
    this.game = game;
    this.carry = 0; this.aspect = null; this.crude = false; // (what the feet carry, and how much)
    this.dist = 0; this.side = 1;
  }

  update(dt) {
    const g = this.game, P = g.player, pm = g.paintmap, S = PAINT_TRACK;
    if (!P || !pm || g.god?.active) return;
    const vx = P.vel.x, vz = P.vel.z, sp = Math.hypot(vx, vz), p = P.pos;
    const dive = g.techs?.active?.id === 'slip' ? g.techs.active : null;
    if ((P.sliding && P.grounded) || (dive && dive.mode === 'floor')) { pm.smear(p.x, p.y, p.z, S.smearR, vx, vz, dt, S.share); this.dist = 0; return; }
    if (!P.grounded || sp < 0.5) return;
    if ((this.dist += sp * dt) < S.stride) return;
    this.dist = 0; this.side = -this.side;
    const ux = vx / sp, uz = vz / sp, fx = p.x + uz * this.side * S.side, fz = p.z - ux * this.side * S.side;
    const c = pm.at(fx, p.y, fz);
    if (c && c.k > 0.15) { this.aspect = c.aspect; this.crude = c.crude; this.carry = Math.min(1, Math.max(this.carry, c.k * S.pick)); return; } // (standing in it: the foot takes some up)
    if (this.carry < 0.06) return;
    if (this.crude) pm.slick(fx, p.y, fz, S.foot, this.carry * S.print);
    else if (this.aspect) pm.stamp(fx, p.y, fz, S.foot, this.aspect, this.carry * S.print);
    this.carry *= S.fade;
  }
}
