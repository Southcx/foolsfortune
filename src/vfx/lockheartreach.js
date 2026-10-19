// ---------------------------------------------------------------------------------------
// THE HOOVER'S REACH: the Lockheart's one world mark (docs/plans/MELEE-LOADOUT.md section 4). While LMB is held and it draws, its cone
// laid on the ground before the coffin, as far and as wide as it draws loose Lachryma (HOOVER: 7 m, 0.7 rad either side of the aim), the
// nearer arc where a mind laid low is drained (3.6 m), and three arcs running IN to the coffin (what it draws comes to it), in the
// Vacuum's violet: the same shape the pier draws for the Lockheart's mount (vfx/mountpreview.js drawCone), so the tool reads the same
// ashore and at sea. The rail-mark program's wire (vfx/railmark.js): screen-space lines held between one and three pixels, the Mind's
// schiller in their heart, depth-tested and lifted a hand off the ground (what stands in front hides it), following the ground's height
// under it (rays down, once a cell of a coarse world grid, kept). No words, no numbers (CLAUDE.md, Feedback); read from the tool, never
// driving it. No program of its own (casebook rule 124): a MarkBuffer on the rail mark's; one draw while it shows.
// The Lockheart's gauge that stood beside the coffin (a padlock and four sockets) was retired for the Lockheart's reliquary (the owner,
// 2026-10-19: vfx/lockheartreliquary.js, the Lockheart's own UI beside the Lachrimeter), not hidden.
//
// Prior art: Luigi's Mansion's Poltergust 3000 (the vacuum's draw seen as a cone of what it pulls).
//
//   const R = new LockheartReach(game)   R.update(rawDt)   (each frame, after the tools)   R.read() -> what is shown (tests)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MarkBuffer, wireStrip } from './railmark.js';
import { MOUNT_LOOK } from './mountpreview.js';
import { HOOVER } from '../tools/lockheart/lockheart.js';

const LIFT = 0.05;         // metres the reach lies over the ground
const MAIN = { m: 0.06, lo: 1.5, hi: 3.0, wire: true }, THIN = { m: 0.03, lo: 1.2, hi: 2.0, wire: false }; // (half-widths: metres held between pixels; the pier's, so it holds on noon sand)
const CELL = 0.75;         // metres: the world grid the ground's height under the reach is found on, once a cell
const TAU = Math.PI * 2;

const _a = new THREE.Vector3(), _f = new THREE.Vector3(), _r = new THREE.Vector3();
const _o = new THREE.Vector3(), _down = new THREE.Vector3(0, -1, 0), _px = new THREE.Vector2(), _c = new THREE.Color();
const ease = (v, to, rate, dt) => v + (to - v) * (1 - Math.exp(-rate * dt));
const frac = (x) => x - Math.floor(x);

export class LockheartReach {
  constructor(game) {
    this.game = game;
    this.buf = new MarkBuffer(160, { renderOrder: 39 });
    this.buf.mat.depthTest = true; // (a state, not a program: casebook rule 124)
    this.buf.mesh.name = 'lockheart-reach'; this.buf.mesh.visible = false;
    game.scene?.add(this.buf.mesh);
    _c.set(MOUNT_LOOK.lockheart.color); this.rgb = [_c.r, _c.g, _c.b];
    this.cells = new Map(); this.pts = []; this.apex = new THREE.Vector3(); // (the ground's heights found, by cell)
    this.reachA = 0; this.t = 0;
  }

  /** Is the Lockheart in the hands (the belt's say), its coffin out and not opening? */
  drawn() {
    const g = this.game, L = g.lockheart, t = g.belt?.inHand;
    return !!L && t?.id === 'lockheart' && L.drawT > 0.6 && !!L.cof && !L.cine && !L.wheel?.busy && !L.queue?.length && !g.god?.controlling && !document.body.classList.contains('cine');
  }

  update(dt) {
    const g = this.game, L = g.lockheart, cam = g.camera;
    if (!L || !cam) return;
    this.t = (this.t + dt) % 600;
    const on = this.drawn();
    this.reachA = ease(this.reachA, on ? L.hooverW : 0, 12, dt);
    if (this.reachA > 0.02 && L.cof) { cam.updateWorldMatrix(true, false); this.reach(); } else if (this.buf.mesh.visible) { this.buf.count = 0; this.buf.flush(); this.buf.mesh.visible = false; } // (where it looks this frame; its parents only)
  }

  /** The hoover's reach on the ground: the cone's edges, its far arc, the drain's nearer arc, three arcs running in. */
  reach() {
    const g = this.game, L = g.lockheart, P = g.player, cam = g.camera, B = this.buf;
    g.renderer?.getDrawingBufferSize(_px);
    const pxk = cam.projectionMatrix.elements[5] * 0.5 * (_px.y || 480);
    const yaw = P.yaw; _f.set(Math.sin(yaw), 0, Math.cos(yaw)); _r.set(-_f.z, 0, _f.x);
    const apex = this.apex.copy(P.fpWeight < 0.5 && L.mouthAt ? L.mouthAt : L.cof.group.getWorldPosition(_a)); // (the coffin's mouth, on the ground below it)
    const feet = P.pos.y; apex.y = this.groundAt(apex.x, apex.z, feet);
    const R = HOOVER.range, half = HOOVER.cone, alpha = this.reachA * (0.84 + 0.16 * Math.sin((this.t * TAU) / 2.4));
    const at = (r, a, out) => { const s = Math.sin(a), c = Math.cos(a); out.set(apex.x + (_f.x * c + _r.x * s) * r, 0, apex.z + (_f.z * c + _r.z * s) * r); out.y = this.groundAt(out.x, out.z, feet) + LIFT; return out; };
    const pts = this.pts, put = (i, r, a) => at(r, a, (pts[i] ||= new THREE.Vector3()));
    const line = (n, f, look, a) => { for (let i = 0; i < n; i++) f(i); wireStrip(B, pts, n, { look, a, rgb: this.rgb, camera: cam, pxk }); };
    B.count = 0;
    for (const s of [-1, 1]) line(9, (i) => put(i, 0.35 + (R - 0.35) * (i / 8), s * half), MAIN, alpha);
    line(25, (i) => put(i, R, -half + (2 * half * i) / 24), MAIN, alpha);
    line(15, (i) => put(i, HOOVER.drain, -half + (2 * half * i) / 14), THIN, alpha * 0.55);
    for (let k = 0; k < 3; k++) { // (arcs running in, toward the coffin: what it draws comes to it)
      const f = frac(this.t / 1.5 + k / 3), r = 0.5 + (R - 0.5) * (1 - f);
      line(15, (i) => put(i, r, -half + (2 * half * i) / 14), THIN, alpha * 0.75 * Math.sin(Math.PI * f) ** 1.2);
    }
    B.flush(); B.mesh.visible = B.count > 0;
  }

  /** The ground's height at (x, z) near the feet: the four corners of its cell of a world grid (CELL m), each found once by a ray down to
   *  what does not move and kept (keyed by the feet's height too, by halves of a metre), read between them. Ground is within a step up
   *  and a fall down of the feet and met from above: a ray begun inside a wall, or a lectern's top, is not ground, and the reach lies at
   *  the feet's height there, hidden by what stands in it. Steady, a sweep of the aim casts a few rays a frame, standing still none. */
  groundAt(x, z, feet) {
    const fx = x / CELL, fz = z / CELL, ix = Math.floor(fx), iz = Math.floor(fz), u = fx - ix, v = fz - iz, fq = Math.round(feet * 2);
    const h = (i, j) => {
      const k = `${i},${j},${fq}`; let y = this.cells.get(k);
      if (y === undefined) {
        if (this.cells.size > 4000) this.cells.clear();
        const hit = this.game.physics?.raycast(_o.set(i * CELL, feet + 0.6, j * CELL), _down, 3.2, undefined, undefined, (c) => !c.isSensor() && (!c.parent() || c.parent().isFixed()));
        y = hit && hit.distance > 0.02 && hit.normal.y > 0.6 ? hit.point.y : null; this.cells.set(k, y);
      }
      return y ?? feet;
    };
    return (h(ix, iz) * (1 - u) + h(ix + 1, iz) * u) * (1 - v) + (h(ix, iz + 1) * (1 - u) + h(ix + 1, iz + 1) * u) * v;
  }

  /** What the eye is shown (tests, the sheets). */
  read() { return { reach: this.buf.mesh.visible, marks: this.buf.count, alpha: +this.reachA.toFixed(2) }; }
}
