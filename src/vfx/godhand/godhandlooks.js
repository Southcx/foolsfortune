// ---------------------------------------------------------------------------------------
// THE GOD HAND'S LOOKS (`game.godhandLooks`; docs/plans/GODHAND.md sections 4, 5 and 8; Dovina's handoff of 2026-10-13): one service the
// hand's runners ask for what a god power or a miracle looks like, so the rules (godhand/, Petra's and Dovina's) only say where and
// when. It holds the parts and runs them each frame:
//   marks      a power's circle on the ground, the ward's wall, the totem's band, the held slab, Strata's frame, Course's run, Read's
//              arrows (vfx/godhand/marks.js)
//   the Portal power's eyes (vfx/godhand/portalpair.js)   the muster's crew (vfx/godhand/crew.js)
//   a miracle's fall: each live miracle's weather over its circle, Storm's bolts, an epic's sky (vfx/godhand/miraclefall.js)
//   the drawn sign: the hand's sign in the Soul Brush's ink (vfx/godhand/godsign.js)
// A mark it made keeps its children's opacity with its own (a caller fades the circle; its wall fades with it), and when a caller takes
// a mark out of the scene its children are disposed on the next frame.
//
// Prior art: the house's own split of rules from looks (game.duelView over the duel, game.seaFightLook over the fight at the helm).
//
//   game.godhandLooks = new GodhandLooks(game)   .update(rawDt, camera) (each frame)
//   .mark(at, r, colour, { style, life, drape }) -> Mesh   .ward(at, r, colour) -> Mesh   .totem(at, feeling, colour) -> Group
//   .slab(got, side, h, colour) -> Group   .strata(section, cols)   .course(pts, colour, dt) / .hideCourse()   .readArrow(pos, col, from, to, rgb)
//   .portal(ends, r, colour) -> { update(dt, t, life), dispose() }   .crew(n, from, to, colour) -> { at(i, pos, heading, carry), dispose() }
//   .miracleRing(m, domainColour) -> Mesh   .bolt(at, colour)   .sign (a GodSign)
// ---------------------------------------------------------------------------------------
import { circleMark, wardWall, totemLook, slabLook, strataFrame, courseLook, readArrow, disposeTree } from './marks.js';
import { portalPair } from './portalpair.js';
import { musterCrew } from './crew.js';
import { MiracleFall } from './miraclefall.js';
import { GodSign } from './godsign.js';

export class GodhandLooks {
  constructor(game) {
    this.game = game;
    this.marks = new Set(); this.crews = new Set(); this.totems = new Set();
    this.fall = new MiracleFall(game);
    this.sign = new GodSign();
    this.courseL = null; this.t = 0;
  }

  mark(at, r, colour, { style = 'mark', drape, opacity = 0.55 } = {}) {
    const m = circleMark(this.game, at, r, colour, { style, drape, opacity });
    this.game.scene.add(m); this.marks.add(m);
    return m;
  }
  ward(at, r, colour) { const m = this.mark(at, r, colour, { style: 'ward', opacity: 0.6 }); m.add(wardWall(this.game, at, r, colour)); return m; }
  totem(at, feeling, colour) { const T = totemLook(this.game, at, feeling, colour); this.totems.add(T); const d = T.userData.dispose; T.userData.dispose = () => { this.totems.delete(T); d(); }; return T; }
  slab(got, side, h, colour) { return slabLook(this.game, got, side, h, colour); }
  strata(section, cols) { if (cols.length) strataFrame(section, cols); }
  course(pts, colour, dt = 0) { (this.courseL ||= courseLook(this.game, colour)).set(pts, dt); }
  hideCourse() { this.courseL?.hide(); }
  readArrow(pos, col, from, to, rgb) { readArrow(pos, col, from, to, rgb); }
  portal(ends, r, colour) { return portalPair(this.game, ends, r, colour, this.game.god?.camera || this.game.camera); }
  crew(n, from, to, colour) { const C = musterCrew(this.game, n, from, to, colour); this.crews.add(C); const d = C.dispose; C.dispose = () => { this.crews.delete(C); d(); }; return C; }
  miracleRing(m, domainColour) { return this.fall.circle(m, domainColour); }
  bolt(at, colour) { this.fall.bolt(at, colour); }

  update(dt, camera) {
    this.t += dt;
    for (const m of this.marks) {
      if (!m.parent) { this.marks.delete(m); for (const c of [...m.children]) disposeTree(c); continue; } // (taken down by its caller: its children with it)
      for (const c of m.children) if (c.material) c.material.opacity = m.material.opacity;
    }
    for (const C of this.crews) C.update(dt);
    for (const T of this.totems) T.userData.tick?.(this.t);
    this.fall.update(dt, camera, this.game.god?.miracles?.live);
    this.sign.update(dt);
  }

  dispose() { this.fall.dispose(); this.sign.dispose(); this.courseL?.dispose(); }
}
