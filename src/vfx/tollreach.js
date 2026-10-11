// ---------------------------------------------------------------------------------------
// THE TOLL'S REACH: what a toll of the Crucibelle would stagger, drawn on the ground round the Courier while the bell is in the hands
// (the owner, 2026-10-11: "each tool should have its own UI according to what it does, much like the Dreamvane"; MELEE-LOADOUT.md
// section 4). A world mark: lines on the ground, no word and no number (CLAUDE.md, Feedback). Every size is the tool's own (TOLL and the
// toll string's `toll` rows, tools/crucibelle/crucibelle.js), read each frame, so the mark never says more or less than a toll does.
//
//   THE REACH    the next toll's: the arc of a ring at its reach (4.2 m) across its cone (63 degrees either side of where the toll
//                would face: the aim, turned to the best thing in front as the toll itself turns, tools/melee.js `magnet`), and the
//                cone's two edges in toward the feet. The string's last toll is brought down overhead and rings all round (5.2 m): the
//                whole ring is drawn. In the air a toll is the plain one. The lines lie on the ground and follow it.
//   THE BEAT     on the bell's own clock (`grid()`: the music's, or its own 96 bpm, drawn fainter, as the pendulum is): the reach
//                brightens through the window in which a toll counts as on the beat (the bell's WINDOW either side of each eighth; on
//                a quarter more than on the off-eighth) and dims between. At each bar's downbeat its line is heavier: shape, never a
//                flash. Between the beats a faint ripple runs out from the feet and reaches the ring on the next beat (the beat
//                travelling to the mark you act on).
//   THE STRUCK   a small ring under each creature and clapperjar a toll would stagger now (the toll's own test: inside its reach and
//                its cone, never an ally), brightening on the beat with the reach: state is a frame on the target (docs/ART.md
//                precept 5).
//
// In the Bomb's coral (vfx/mountpreview.js MOUNT_LOOK: the toll at sea is the Bomb, whose preview is a blast ring), so the toll has one
// look ashore and at sea, drawn as the mount's preview is drawn: the rail-mark program's WIRE (vfx/railmark.js), screen-space lines of a
// pixel and a half or more (they cannot crawl), shaded dark at their edges so they hold on any floor, the Mind's schiller along the
// heart of the main lines, depth-tested so the Courier and the walls in front hide them. No program of its own: one MarkBuffer, one
// instanced draw, on the sea's program (compiled at boot with the crossing's parked marks: casebook rule 124).
//
// Shown only while the belt has the bell in the hands (`game.belt.inHand`), faded in as it comes out and out at once on a stow or a
// swap, nothing left drawn; never in the rhythm mode or at a busker's mat, nor under the god hand, a cinematic or in the Spirit Garden.
//
// Prior art: Crypt of the NecroDancer's beat bar (the beat travels to the mark you act on), Hi-Fi Rush (the world pulses on the beat, and
// a blow on the beat lands harder, as a toll does here), Into the Breach and XCOM's blast ring (an action's area drawn on the ground
// before you commit to it), and the mount's preview it shares its line with (vfx/mountpreview.js).
//
//   const R = new TollReach(game)   (its mesh is added to the scene)   R.update(rawDt) (each frame, after the tools)   R.read() (tests)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MarkBuffer, wireStrip } from './railmark.js';
import { MOUNT_LOOK } from './mountpreview.js';
import { TOLL, WINDOW } from '../tools/crucibelle/crucibelle.js';
import { magnet } from '../tools/melee.js';

const TAU = Math.PI * 2;
const COLOR = MOUNT_LOOK.crucibelle.color; // (the Bomb's coral: the toll's look at sea)
const R0 = 0.95;       // metres from the feet where the cone's edges begin (outside the Lachryma ring's 0.85: vfx/hudring.js RADIUS)
const LIFT = 0.06;     // metres over the ground
const STEP = 0.32;     // metres between the points of a line (it follows the ground)
const CELL = 0.3;      // metres: the ground's heights are sampled on this grid and kept (a ray down each, once)
// a line's half-width: metres, held between lo and hi pixels of the 480-line present; `wire` the Mind's schiller along its heart
// (wide enough that the wire's dark edges show: the lines hold on the Dunes' noon sand as on the workshop's red floor)
const MAIN = { m: 0.04, lo: 2.0, hi: 3.0, wire: true };   // the reach, its edges, the struck
const DOWN = { m: 0.055, lo: 2.8, hi: 3.8, wire: true };  // the reach on the bar's downbeat: the same line, heavier
const THIN = { m: 0.022, lo: 1.3, hi: 1.8, wire: false }; // the ripple
const DIM = 0.5;       // the reach between the beats (1 on a beat)
const OWN = 0.8;       // how bright on the bell's own clock (no music), against the music's
const MAX_STRUCK = 8;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const _f = new THREE.Vector3(), _d = new THREE.Vector3(), _o = new THREE.Vector3(), _c = new THREE.Color();
const DOWNWARD = new THREE.Vector3(0, -1, 0);
/** What the lines lie on: the fixed world, never a body that moves (a creature's, a pot's) nor a sensor. */
const GROUND = (c) => !c.isSensor() && !c.parent()?.isDynamic() && !c.parent()?.isKinematic();

export class TollReach {
  constructor(game) {
    this.game = game;
    this.buf = new MarkBuffer(900, { renderOrder: 31 });
    this.buf.mat.depthTest = true; // (a state, not a program: the rail-mark program the mount's preview shares, its wire keeping its depth)
    this.mesh = this.buf.mesh; this.mesh.name = 'toll-reach'; this.mesh.visible = false;
    game.scene?.add(this.mesh);
    _c.set(COLOR); this.rgb = [_c.r, _c.g, _c.b];
    this.alpha = 0; this.yaw = null; this.magT = 0; this.mag = null;
    this.ground = new Map(); this.groundY = null; this.groundT = 0; // (the ground's heights on a grid, kept while they stand on one floor)
    this.pw = []; this.pts = []; // (a line's points in the world; reused)
    this.view = { shown: false, range: 0, cone: 0, struck: 0, beat: 0, down: false, own: true, lines: 0 };
  }

  /** The toll a press would ring now: its move (the string's next, as the moveset's opener reads it), and its reach and cone. */
  next() {
    const b = this.game.crucibelle, M = b?.moves, S = M?.string || [];
    if (!M || !this.game.player.grounded || !S.length) return { id: null, range: TOLL.range, cone: TOLL.cone }; // (in the air: one toll, the plain one)
    const c = M.cur;
    const id = c ? (c.kind === 'ground' && M.nextOf(c)?.id) || S[0] : S[M.str === 'ground' && M.n >= 0 ? (M.n + 1) % S.length : 0];
    const t = M.def(id)?.toll || {};
    return { id, range: t.range ?? TOLL.range, cone: t.cone ?? TOLL.cone };
  }

  update(raw = 1 / 60) {
    const g = this.game, P = g.player, b = g.crucibelle, held = g.belt?.inHand;
    const want = !!b && !!P && held?.id === 'crucibelle' && held.wants && held.drawT > 0.5
      && !g.god?.active && !g.rhythm?.active && !(b.busking > 0.01) && !g.realm?.active && !document.body.classList.contains('cine');
    this.alpha += ((want ? 1 : 0) - this.alpha) * (1 - Math.exp(-(want ? 9 : 16) * raw));
    const B = this.buf; B.count = 0;
    if (!want && this.alpha < 0.02) { this.alpha = 0; this.yaw = null; B.flush(); this.mesh.visible = false; Object.assign(this.view, { shown: false, struck: 0, lines: 0, alpha: 0 }); return; }
    const cam = g.camera; cam.updateMatrixWorld();
    this.pxk = cam.projectionMatrix.elements[5] * 0.5 * (g.post?.target?.height || 480); // (pixels a metre at a metre's depth, in the present's lines)
    this.cam = cam;

    // where the toll would face: the aim, turned onto the best thing in front (on the ground; asked eight times a second)
    const M = b.moves, f = M.aimDir(_f), feet = P.renderPos;
    if ((this.magT -= raw) <= 0) { this.magT = 0.125; this.mag = P.grounded && !g.lock?.active ? magnet(g, P, f, { range: 4.2, cone: 1.0 }) : null; }
    if (this.mag) f.set(this.mag.pos.x - P.pos.x, 0, this.mag.pos.z - P.pos.z).normalize();
    const to = Math.atan2(f.x, f.z);
    this.yaw = this.yaw == null ? to : this.yaw + wrap(to - this.yaw) * (1 - Math.exp(-12 * raw));
    const N = this.next(), R = N.range, cone = N.cone, all = cone >= Math.PI - 1e-3;

    // the beat, on the bell's own clock: through the window round each eighth the reach is lit, a quarter more than an off-eighth
    const G = b.grid(), t = b.now(), e = G.spb / 2, ph = (t - G.t0) / e, k = Math.round(ph), off = Math.abs(ph - k) * e;
    const lit = (1 - smooth(WINDOW, WINDOW + 0.06, off)) * (k % 2 === 0 ? 1 : 0.6), down = ((k % 8) + 8) % 8 === 0 && off < WINDOW + 0.03;
    const Mg = g.music?.grid?.(), own = !Mg || Mg.t0 !== G.t0 || Mg.spb !== G.spb; // (the pendulum's test: vfx/crucibellehud.js)
    const A = this.alpha * (own ? OWN : 1), reach = A * (DIM + (1 - DIM) * lit);

    // the ground they stand on, kept while they stand on one floor
    if (P.grounded && (this.groundY == null || Math.abs(feet.y - this.groundY) > 0.3 || (this.groundT -= raw) <= 0)) { this.ground.clear(); this.groundY = feet.y; this.groundT = 2; }
    const y0 = this.groundY ?? feet.y;

    // THE REACH: the arc at its reach, and the cone's edges in toward the feet
    const a0 = all ? 0 : this.yaw - cone, a1 = all ? TAU : this.yaw + cone;
    const look = down ? DOWN : MAIN;
    this.strip(this.arc(feet, R, a0, a1, y0), look, reach, all);
    if (!all) for (const a of [a0, a1]) this.strip(this.ray(feet, a, R0, R, y0), MAIN, (i, m) => reach * (0.2 + 0.7 * (i / (m - 1)) ** 1.5)); // (faint at the feet, whole at the reach)
    // the ripple: out from the feet, reaching the ring on the next beat (a quarter), faint until it nears it
    const q = ph / 2 - Math.floor(ph / 2), rr = R0 + (R - R0) * q * q;
    if (q > 0.08 && q < 0.97) this.strip(this.arc(feet, rr, a0, a1, y0), THIN, A * (0.12 + 0.45 * q * q), all);

    // THE STRUCK: what a toll would stagger now, as the toll tests it (crucibelle.js toll)
    let n = 0;
    const struck = (pos, r) => { if (n++ < MAX_STRUCK) this.strip(this.arc(pos, r, 0, TAU, null, pos.y), MAIN, A * (0.55 + 0.45 * lit), true); };
    const inCone = (p) => { _d.set(p.x - P.pos.x, 0, p.z - P.pos.z); return all || _d.length() <= 0.3 || Math.abs(wrap(Math.atan2(_d.x, _d.z) - this.yaw)) <= cone; };
    for (const cr of g.creatures?.near(P.pos, R) || []) if (!cr.ally && inCone(cr.pos)) struck(cr.pos, (cr.radius || 0.5) + 0.18);
    for (const cl of g.clappers?.list || []) if (cl.alive && !cl.ally && cl.pos.distanceTo(P.pos) <= R && inCone(cl.pos)) struck(cl.pos, 0.42);

    B.flush(); this.mesh.visible = B.count > 0;
    Object.assign(this.view, { shown: B.count > 0, range: R, cone, move: N.id, struck: n, beat: +lit.toFixed(2), down, own, lines: B.count, alpha: +this.alpha.toFixed(2) });
  }

  /** What is drawn (tests and sheets): shown, the reach and cone drawn, the next move, how many it would stagger, the beat's light. */
  read() { return { ...this.view }; }

  /** The ground's height at (x, z): sampled on a grid of CELL and kept, the corners blended (so a slope is a slope, never steps). */
  floor(x, z, y0) {
    const P = this.game.player, gx = x / CELL, gz = z / CELL, ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz;
    const at = (i, j) => {
      const key = i * 73856093 + j * 19349663; let h = this.ground.get(key);
      if (h === undefined) { const hit = this.game.physics?.raycast(_o.set(i * CELL, y0 + 0.6, j * CELL), DOWNWARD, 1.8, P.collider, undefined, GROUND); h = hit ? hit.point.y : y0; this.ground.set(key, h); }
      return h;
    };
    return (at(ix, iz) * (1 - fx) + at(ix + 1, iz) * fx) * (1 - fz) + (at(ix, iz + 1) * (1 - fx) + at(ix + 1, iz + 1) * fx) * fz;
  }
  /** Points along an arc about `c` (its angles from +z toward +x, as a yaw), on the ground (or at height `y` when given). */
  arc(c, r, a0, a1, y0, y = null) {
    const n = Math.max(8, Math.ceil((r * Math.abs(a1 - a0)) / STEP)), out = this.pts; out.length = 0;
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n, x = c.x + r * Math.sin(a), z = c.z + r * Math.cos(a);
      out.push(x, (y ?? this.floor(x, z, y0)) + LIFT, z);
    }
    return out;
  }
  /** Points along a ray from `c` at angle `a`, from r0 to r1 metres, on the ground. */
  ray(c, a, r0, r1, y0) {
    const n = Math.max(2, Math.ceil((r1 - r0) / STEP)), out = this.pts, s = Math.sin(a), co = Math.cos(a);
    out.length = 0;
    for (let i = 0; i <= n; i++) { const r = r0 + ((r1 - r0) * i) / n, x = c.x + r * s, z = c.z + r * co; out.push(x, this.floor(x, z, y0) + LIFT, z); }
    return out;
  }
  /** A line through flat points [x, y, z, ...] (closed: the last joins the first), its look, its alpha (a number, or one a point:
   *  (i, count) -> alpha). The mount's preview's wire, built once (vfx/railmark.js wireStrip). */
  strip(flat, look, a, closed = false) {
    const W = this.pw;
    let m = flat.length / 3;
    if (closed && m > 2 && Math.abs(flat[0] - flat[m * 3 - 3]) + Math.abs(flat[2] - flat[m * 3 - 1]) < 1e-3) m--; // (a whole circle's last point is its first)
    if (m < 2 || (typeof a === 'number' && a < 0.01)) return;
    for (let i = 0; i < m; i++) (W[i] ||= new THREE.Vector3()).set(flat[i * 3], flat[i * 3 + 1], flat[i * 3 + 2]);
    wireStrip(this.buf, W, m, { look, a: typeof a === 'function' ? (i) => a(i, m) : a, rgb: this.rgb, camera: this.cam, pxk: this.pxk, closed });
  }

  dispose() { this.buf.dispose(); }
}
