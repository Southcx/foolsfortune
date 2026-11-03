// ---------------------------------------------------------------------------------------
// THE ARENA'S REHEARSAL SET (South, 2026-11-01: "go wild on theatre rehearsal themes"): what stands on the platform fighter's stage
// (world/strawmanwell/stages/arena.js), and on the flat stage (stages/flatstage.js) the same, because it is a rehearsal and not the show,
// behind the plane the fight is on (read from the stage's layout: its mid, half, starts and underside):
//   the ghost light    a bare bulb in a wire cage on a pole and tripod at the back of the main stage's middle, the theatre's one
//                      light left burning on an empty stage; it breathes a little, as a filament does on a long cable
//   the work lights    a clamp lamp on a stand at each end of the main stage, turned in, and their pools on the boards
//   the drape          the main stage's underside skirted in black masking serge, pleated, as a rostrum is at rehearsal (it stood
//                      as a cotton reel: the props leave it to this)
//   the spike tape     glow tape on the boards where each body is meant to start: the Courier's mark in its side's lapis, each
//                      straw fighter's in cinnabar, a T a mark (the stage manager's), a few crossed stage-weight sandbags by the ends
// One mesh in the targets' atlas material (shared, vfx/strawmanwell/targets/kit.js), the bulbs' and pools' glow as sprites; no lamp
// of the light budget's (the stage's own lamps are the kit's).
//
// Prior art: the ghost light (the theatre's superstition and its safety), the rehearsal's clamp lamps and glow tape spike marks,
// stage weights; the Well's theatre (vfx/strawmanwell/theatre.js) for the boards it stands on.
//
//   const S = new RehearsalSet(ctx, lane, layout = ARENA)   S.group   S.update(dt)   S.dispose()   REHEARSAL_SET
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Sheet, box, rgb } from '../theatre/kit.js';
import { glowTexture } from '../theatre/kit.js';
import { targetMaterial, releaseMaterial } from '../targets/kit.js';
import { ARENA } from '../../../world/strawmanwell/stages/arena.js';

/** The pieces' places (m about the stage's middle, behind the plane) and colours. */
export const REHEARSAL_SET = {
  ghost: { x: 0, z: -2.1, h: 1.95, cage: 0.17, glow: 2.6, rib: 0.014 }, work: { in: 0.8, z: -1.7, h: 2.6 }, // (work.in: m in from the stage's end)
  tape: { w: 0.05, len: 0.42, sides: [0x7a8cff, 0xff6a4a] }, steel: 0x1c1c22, serge: 0x1e171c, pleat: 0.35, pole: 0x3a3a40, bulb: 0xfff2c8, sandbag: 0x8a7a5a,
};
const R = REHEARSAL_SET;

export class RehearsalSet {
  constructor(ctx, lane, A = ARENA) {
    this.ctx = ctx; this.group = new THREE.Group(); this.group.name = `${lane.id || 'arena'}.set`; this.t = 0;
    const X = (x) => ctx.at.x + A.mid + x, WX = A.half - R.work.in, Y = ctx.at.y, Z = lane.z;
    const S = new Sheet(), steel = (f) => rgb(R.steel, f === 't' ? 1.3 : 0.9), pole = (f) => rgb(R.pole, f === 'f' ? 1.2 : 0.8);
    // the ghost light: a tripod, its pole, the cage's ribs round the bulb
    const G = R.ghost, gx = X(G.x), gz = Z + G.z;
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.4, dx = Math.cos(a) * 0.32, dz = Math.sin(a) * 0.32; box(S, gx + dx - 0.02, gx + dx + 0.02, Y, Y + 0.06, gz + dz - 0.02, gz + dz + 0.02, steel, 'ftlrb'); this.leg(S, gx, gz, dx, dz, Y); }
    box(S, gx - 0.025, gx + 0.025, Y, Y + G.h, gz - 0.025, gz + 0.025, pole, 'ftlrb');
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, cx = gx + Math.cos(a) * G.cage, cz = gz + Math.sin(a) * G.cage; box(S, cx - G.rib, cx + G.rib, Y + G.h, Y + G.h + 0.34, cz - G.rib, cz + G.rib, steel, 'ftlr'); }
    for (const y of [Y + G.h, Y + G.h + 0.34]) box(S, gx - G.cage, gx + G.cage, y - 0.01, y + 0.01, gz - G.cage, gz + G.cage, steel, 'tb');
    // the work lights: a stand, its clamp lamp turned in toward the middle
    for (const s of [-1, 1]) {
      const wx = X(s * WX), wz = Z + R.work.z, h = R.work.h;
      box(S, wx - 0.03, wx + 0.03, Y, Y + h, wz - 0.03, wz + 0.03, pole, 'ftlrb');
      for (const [dx, dz] of [[0.35, 0], [-0.2, 0.3], [-0.2, -0.3]]) box(S, wx + Math.min(0, dx) * 1, wx + Math.max(0, dx) * 1 + 0.03, Y, Y + 0.04, wz + Math.min(0, dz) - 0.02, wz + Math.max(0, dz) + 0.02, steel, 'ft');
      box(S, wx - s * 0.32 - 0.14, wx - s * 0.32 + 0.14, Y + h - 0.2, Y + h + 0.06, wz - 0.13, wz + 0.13, steel, 'ftlrb');
    }
    // the spike tape: a T a starting mark in its side's colour, in the boards' plane just in front of the back half
    const T = R.tape, mark = (x, col) => { const c = rgb(col, 1.3), y = Y + 0.004, z0 = Z - 0.2; S.quad(new THREE.Vector3(x - T.len / 2, y, z0 - T.w), new THREE.Vector3(x - T.len / 2, y, z0 + T.w), new THREE.Vector3(x + T.len / 2, y, z0 + T.w), new THREE.Vector3(x + T.len / 2, y, z0 - T.w), c); S.quad(new THREE.Vector3(x - T.w, y, z0), new THREE.Vector3(x - T.w, y, z0 + T.len), new THREE.Vector3(x + T.w, y, z0 + T.len), new THREE.Vector3(x + T.w, y, z0), c); };
    mark(X(A.courier), T.sides[0]); for (const f of A.foes) mark(X(f), T.sides[1]);
    // stage weights by the ends, sandbags crossed on them
    for (const s of [-1, 1]) { const sx = X(s * (A.half - 0.9)), sz = Z - 2.4; box(S, sx - 0.3, sx + 0.3, Y, Y + 0.18, sz - 0.18, sz + 0.18, (f) => rgb(R.sandbag, f === 't' ? 1.15 : 0.8), 'ftlr'); box(S, sx - 0.18, sx + 0.18, Y + 0.18, Y + 0.34, sz - 0.3, sz + 0.3, (f) => rgb(R.sandbag, f === 't' ? 1.05 : 0.7), 'ftlr'); }
    // the drape: each step of the underside's front skirted in pleated serge (its boxes read back: the kit's spool-coloured ones wider
    // than 6 m; the flat stage's two steps each their own skirt, the wider one's in front)
    const spools = ctx.boxes.mergedOf(lane.id, ctx.color.spool), unders = (spools ? ctx.boxes.boxesOf(spools) : []).filter((b) => b.w > 6);
    for (const under of unders) {
      const x0 = under.c.x - under.w / 2 - 0.05, x1 = under.c.x + under.w / 2 + 0.05, y0 = under.c.y - under.h / 2, y1 = under.c.y + under.h / 2 + 0.02, zf = under.c.z + under.d / 2 + 0.03, n = Math.ceil((x1 - x0) / R.pleat);
      for (let i = 0; i < n; i++) {
        const a = x0 + (i * (x1 - x0)) / n, b = x0 + ((i + 1) * (x1 - x0)) / n, m = (a + b) / 2, k = i % 2 ? 1.25 : 0.7;
        S.quad(new THREE.Vector3(a, y0, zf), new THREE.Vector3(m, y0, zf + 0.06), new THREE.Vector3(m, y1, zf + 0.06), new THREE.Vector3(a, y1, zf), rgb(R.serge, k));
        S.quad(new THREE.Vector3(m, y0, zf + 0.06), new THREE.Vector3(b, y0, zf), new THREE.Vector3(b, y1, zf), new THREE.Vector3(m, y1, zf + 0.06), rgb(R.serge, k * 0.75));
      }
      for (const [xe, s] of [[x0, -1], [x1, 1]]) S.quad(new THREE.Vector3(xe, y0, zf), new THREE.Vector3(xe, y0, under.c.z - under.d / 2), new THREE.Vector3(xe, y1, under.c.z - under.d / 2), new THREE.Vector3(xe, y1, zf), rgb(R.serge, s > 0 ? 0.8 : 0.6));
    }
    this.mat = targetMaterial(); this.geo = S.geometry();
    const mesh = new THREE.Mesh(this.geo, this.mat); mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.zone = 'strawmanwell'; this.group.add(mesh);
    // the bulbs' glow and the ghost light's bulb itself
    this.glowTex = glowTexture();
    const glow = (x, y, z, s, a) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: R.bulb, transparent: true, opacity: a, depthWrite: false, blending: THREE.AdditiveBlending })); sp.position.set(x, y, z); sp.scale.setScalar(s); this.group.add(sp); return sp; };
    this.bulbMat = new THREE.MeshBasicMaterial({ color: R.bulb }); this.bulbGeo = new THREE.SphereGeometry(0.07, 12, 8);
    const bulb = new THREE.Mesh(this.bulbGeo, this.bulbMat); bulb.scale.setScalar(1.4); bulb.position.set(gx, Y + G.h + 0.16, gz); this.group.add(bulb);
    this.ghostGlow = glow(gx, Y + G.h + 0.16, gz, G.glow, 1);
    this.pools = [-1, 1].map((s) => glow(X(s * WX) - s * 0.32, Y + R.work.h - 0.1, Z + R.work.z + 0.15, 1.1, 0.6));
  }

  /** A tripod's leg from the foot (dx, dz off the pole) up to the pole at 0.5 m: a thin slab leaned in. */
  leg(S, gx, gz, dx, dz, Y) { const n = 6; for (let i = 0; i < n; i++) { const t0 = i / n, x = gx + dx * (1 - t0), z = gz + dz * (1 - t0), y = Y + 0.5 * t0; box(S, x - 0.015, x + 0.015, y, y + 0.5 / n + 0.01, z - 0.015, z + 0.015, (f) => rgb(R.steel, f === 't' ? 1.2 : 0.85), 'ftlr'); } }

  update(dt) {
    this.t += dt;
    const f = 0.92 + 0.05 * Math.sin(this.t * 1.7) + 0.03 * Math.sin(this.t * 7.3);
    this.ghostGlow.material.opacity = f; this.ghostGlow.scale.setScalar(R.ghost.glow * (0.97 + 0.03 * f));
  }

  dispose() {
    this.group.removeFromParent(); this.geo.dispose(); releaseMaterial(); this.mat = null;
    this.bulbGeo.dispose(); this.bulbMat.dispose(); this.glowTex.dispose();
    this.group.traverse((o) => { if (o.isSprite) o.material.dispose(); });
  }
}
