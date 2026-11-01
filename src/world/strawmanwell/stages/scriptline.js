// ---------------------------------------------------------------------------------------
// THE SCRIPT'S DRAWN LINES: a line drawn on the stage's plane that stands to be stood on for a few real seconds (docs/plans/STRAWMANS-WELL.md
// 3.11; Crayon Physics, Kirby: Canvas Curse). Hold RMB with no tool in your hands and move the mouse: the pen follows the cursor where
// the pointer is free, or the mouse's own motion from your hand where it is locked; a line has LINE.ink m of ink. Let go and it sets,
// each of its strokes a plank on the plane (a stroke through your own body is left out, so a line never sets inside you); it lasts
// LINE.life real s, blinking its last, and two stand at most (a third takes the oldest). The plan's version is the Soul Brush's Celestial
// paper drawing the stroke: this is the stage's own pen until the brush's paper is lent to it (the brush is Petra's and Calissa's).
// Placeholder looks: a gold thread while drawn, chalk planks when set.
//
// Prior art: Crayon Physics Deluxe (a drawn stroke becomes a body), Kirby: Canvas Curse's rainbow line (ink, and it fades), Drawn to Life.
//
//   const D = new DrawnLines(well, S)   D.update(dt)   D.draw(points) (world points: a line set at once, for a test)   D.clear()   LINE
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** A line: its ink (m), its life once set and how long it blinks before going (real s), a plank's thickness and depth (m), the pen's
 *  stride (m between points), how many stand at once, and the locked pen's gain (m a mouse pixel). */
export const LINE = { ink: 6.5, life: 5, blink: 1.2, thick: 0.2, depth: 2.4, stride: 0.3, max: 2, gain: 0.012 };
const CHALK = 0xf2e6c8, PEN = 0xd9a441, MAXPTS = 64;

export class DrawnLines {
  constructor(well, S) {
    this.well = well; this.game = well.game; this.S = S; this.lines = []; this.pen = null;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXPTS * 3), 3)); geo.setDrawRange(0, 0);
    this.trail = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: PEN })); this.trail.frustumCulled = false; S.add(this.trail);
    this.tip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: PEN })); this.tip.visible = false; S.add(this.tip);
  }

  /** Where the pen is this frame on the plane, or null. */
  penAt() {
    const g = this.game, inp = this.well.frame.realInput ?? g.input, z = this.well.frame.spec?.z ?? this.S.lane.z, P = g.player;
    if (!inp.locked && inp.mx >= 0) {
      const v = new THREE.Vector3((inp.mx / innerWidth) * 2 - 1, -(inp.my / innerHeight) * 2 + 1, 0.5).unproject(g.camera), o = g.camera.position, d = v.sub(o).normalize();
      if (Math.abs(d.z) < 1e-3) return null;
      const t = (z - o.z) / d.z; return new THREE.Vector3(o.x + d.x * t, o.y + d.y * t, z);
    }
    const last = this.pen?.pts.at(-1) ?? new THREE.Vector3(P.pos.x + this.well.frame.face * 1.2, P.pos.y + 1.2, z);
    return last.clone().add(new THREE.Vector3(inp.dx * LINE.gain, -inp.dy * LINE.gain, 0));
  }

  update(dt) {
    const g = this.game, inp = this.well.frame.realInput ?? g.input, held = inp.isDown('Mouse2') && !g.belt?.inHand && this.well.stage?.id === 'script';
    if (held) {
      const at = this.penAt();
      if (at) {
        if (!this.pen) this.pen = { pts: [at], ink: 0 };
        const P = this.pen, last = P.pts.at(-1), d = at.distanceTo(last);
        if (d >= LINE.stride && P.ink < LINE.ink && P.pts.length < MAXPTS) { const k = Math.min(1, (LINE.ink - P.ink) / d); P.pts.push(last.clone().lerp(at, k)); P.ink += d * k; }
        this.tip.visible = true; this.tip.position.copy(P.pts.at(-1));
        this.drawTrail();
      }
    } else if (this.pen) { const pts = this.pen.pts; this.pen = null; this.tip.visible = false; this.trail.geometry.setDrawRange(0, 0); if (pts.length > 1) this.draw(pts); }
    for (let i = this.lines.length - 1; i >= 0; i--) {
      const L = this.lines[i]; L.t -= dt;
      const show = L.t > LINE.blink || Math.floor(L.t * 8) % 2 === 0;
      for (const s of L.segs) s.mesh.visible = show;
      if (L.t <= 0) { this.drop(L); this.lines.splice(i, 1); }
    }
  }
  drawTrail() {
    const pts = this.pen.pts, a = this.trail.geometry.attributes.position;
    pts.forEach((p, i) => a.setXYZ(i, p.x, p.y, p.z + 0.05)); a.needsUpdate = true; this.trail.geometry.setDrawRange(0, pts.length);
  }

  /** A line set: a plank a stroke, each left out where it would pass through the Courier. */
  draw(pts) {
    const K = this.well.kit, P = this.game.player, segs = [];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], mid = a.clone().add(b).multiplyScalar(0.5), len = a.distanceTo(b);
      if (len < 0.05) continue;
      // (through the body: the capsule is a vertical segment from the feet + its radius to its head, 0.3 m round)
      const cy = THREE.MathUtils.clamp(mid.y, P.pos.y + 0.3, P.pos.y + 1.4);
      if (Math.hypot(mid.x - P.pos.x, mid.y - cy) < 0.3 + LINE.thick + len / 2) continue;
      const r = K.box([mid.x, mid.y, this.S.lane.z], [len + 0.06, LINE.thick, LINE.depth], CHALK, { rotZ: Math.atan2(b.y - a.y, b.x - a.x), own: true, outline: false, lane: this.S.lane.id });
      segs.push(r);
    }
    if (!segs.length) return null;
    const L = { segs, t: LINE.life }; this.lines.push(L);
    while (this.lines.length > LINE.max) this.drop(this.lines.shift());
    this.well.verb('drawLine');
    return L;
  }
  drop(L) {
    const K = this.well.kit, w = this.game.physics?.world;
    for (const s of L.segs) {
      if (s.collider) { try { w?.removeCollider(s.collider, false); } catch { /* (gone already) */ } const i = K?.colliders.indexOf(s.collider) ?? -1; if (i >= 0) K.colliders.splice(i, 1); }
      if (s.mesh) { s.mesh.removeFromParent(); s.mesh.geometry.dispose(); s.mesh.material.dispose(); const j = K?.owned.indexOf(s.mesh) ?? -1; if (j >= 0) K.owned.splice(j, 1); }
    }
    L.segs = [];
  }
  clear() {
    for (const L of this.lines) this.drop(L);
    this.lines = []; this.pen = null;
    this.trail.geometry.dispose(); this.trail.material.dispose(); this.tip.geometry.dispose(); this.tip.material.dispose();
  }
}
