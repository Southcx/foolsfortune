// ---------------------------------------------------------------------------------------
// A MOUNT'S PREVIEW: choosing a mount at the pier draws what it does on the moored ship (docs/plans/CLARITY.md section 6, "show it,
// then say it"; the mounts are Dovina's MOUNTS, progress/rail/mounts.js, and what each does at sea is courier/ship/mounts.js). A world
// mark: it lies on the crude round the hull (vfx/mooring.js), carries no word or number, and is drawn one at a time, gone when nothing
// is chosen. Each is the mount's own shape at the size it has round the ship at sea (every hull flies at a quarter of its size at the
// rail, so a 10 m range there is 42 m round the moored hull here: the shape looks to the hull as it will look to the ship):
//
//   Blaster       (the psygun)      fireLine: the gun's line of fire from the nose, its two reticles at 12 and 36 m (Star Fox 64), shots
//                                   running out on it
//   Absorb Spray  (the Soul Brush)  sprayFan: a fan ahead (its angle and range) in your feeling's colour, arcs spraying out across it
//   Bomb          (the Crucibelle)  blastRing: a blast ring round the ship at its range, the beat's larger one faint and broken, a
//                                   shockwave going out to it
//   Vacuum        (the Lockheart)   drawCone: a narrower cone ahead, arcs drawn IN toward the nose (what it swallows comes to it)
//   Snapshot      (the Veritome)    viewfinder: the camera's frame standing on the sea ahead, its corners focusing, its frustum faint
//   Grapple       (the Sondelass)   grapnel: the grapnel line to its 16 m, two flukes at its end, the aim's arc faint; the hook thrown
//                                   out and reeled in
//   Radar         (the Dreamvane)   radarScan: range circles round the ship and a scan line turning once in four real seconds (passive)
//
// Every line is the rail-mark program's WIRE (vfx/railmark.js): screen-space, at least a pixel and a half and antialiased (it cannot
// crawl), in the mount's colour with the Mind's schiller along its heart (labradorite: the Mind's line), lifted a hand over the drawn
// surface of the crude and depth-tested, so the jetty, the hull and the Courier in front of it hide it and the sand above the waterline
// covers it. The pulse is slow and at one rate (a breath, never a flicker). No program of its own (casebook rule 124): one MarkBuffer, one
// instanced draw, its material the rail's (compiled in the warm-up with the crossing's marks), built at boot by the mooring.
//
// Prior art: Into the Breach (every action's area drawn on the board before you commit), XCOM's grenade arc and blast ring, the turning
// trace of every naval game's radar screen (the PPI), a camera's viewfinder brackets, and Star Fox 64's two-square reticle.
//
//   const P = new MountPreview()   scene.add(P.mesh)   P.show(toolId | null)   P.tool   P.park()
//   P.draw({ at, yaw, length, camera, lines, water(x, z) -> y | null, color }, dt)   (at: the hull's middle at the waterline; yaw: its
//   heading, the bow's way; lines: the pixels of the picture's height; color: the ship's feeling, for the mounts that wear yours)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MarkBuffer, STYLE } from './railmark.js';
import { MOUNTS } from '../progress/rail/mounts.js';
import { T } from '../core/config.js';

/** At the rail every hull is drawn at this share of its size (courier/ship/ship.js SCALE: the 7 m sloop is a 1.7 m ship there). */
export const AT_SEA = 0.24;
/** The nose, where a cone and a reach start: this far ahead of the ship's middle at the rail (courier/ship/ship.js aimAt), in its metres. */
export const NOSE = 0.9;
const K = 1 / AT_SEA, TAU = Math.PI * 2, D2R = Math.PI / 180;
const LIFT = 0.18, BREATH = 2.4, FADE = 0.35; // (metres over the drawn crude; a breath's real seconds; the fade in when one is chosen)
const MAIN = { m: 0.24, lo: 1.5, hi: 3.0, wire: true }, THIN = { m: 0.12, lo: 1.1, hi: 1.8, wire: false }; // (a line's half-width: metres, held between lo and hi pixels)

/** Each mount's preview: its shape, and its colour (null: the ship's own feeling, as the brush and the gun wear it at sea). */
export const MOUNT_LOOK = {
  psygun: { shape: 'fireLine', color: null },
  soulbrush: { shape: 'sprayFan', color: null },
  crucibelle: { shape: 'blastRing', color: 0xff9a6a, beat: 1.4 }, // (a blast's coral, apart from the gold a calm sea gives your feeling; 14 m on the beat, ship/mounts.js toll)
  lockheart: { shape: 'drawCone', color: 0xb98cff },
  veritome: { shape: 'viewfinder', color: 0xfff0d8, at: 5, w: 5.6, h: 3.15 }, // (the Flash's warm white; the frame 5 m ahead, 16 by 9)
  sondelass: { shape: 'grapnel', color: 0x7fe6d2, angle: 60 }, // (the hook takes the nearest within 30 degrees of the aim: ship/mounts.js hook)
  dreamvane: { shape: 'radarScan', color: 0x9be36a, range: 8, turn: 4 }, // (the vane's green, its mark at sea; passive: its circles are a look, 8 m)
};

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const frac = (x) => x - Math.floor(x);
const easeOut = (x) => 1 - (1 - x) * (1 - x);
/** Points along a straight run, every `step` metres (so a line on the water follows its swells). */
function run(x0, z0, x1, z1, step = 3, h = null) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / step)), out = [];
  for (let i = 0; i <= n; i++) out.push([x0 + (x1 - x0) * (i / n), z0 + (z1 - z0) * (i / n), h]);
  return out;
}
/** An arc about (cx, cz), its angles from ahead (+z) toward the right (+x). */
function arc(cx, cz, r, a0, a1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); out.push([cx + r * Math.sin(a), cz + r * Math.cos(a), null]); }
  return out;
}

const _c = new THREE.Color(), _e = new THREE.Vector3();

export class MountPreview {
  constructor({ cap = 900, renderOrder = 39 } = {}) {
    this.buf = new MarkBuffer(cap, { renderOrder });
    this.buf.mat.depthTest = true; // (a state, not a program: the rail-mark program it shares, the wire style writing its depth)
    this.mesh = this.buf.mesh; this.mesh.name = 'mount-preview'; this.mesh.visible = false;
    this.tool = null; this.since = 0; this.t = 0; this.ctx = null; this.alpha = 1;
    this.f = new THREE.Vector3(); this.r = new THREE.Vector3();
    this.pw = []; this.pa = []; this.rgb = [1, 1, 1]; // (a strip's points, in the world, and their half-widths; the colour: reused)
  }

  /** Draw this mount's preview (a tool id of MOUNTS), or none. Drawn at once where the last draw stood, at the start of its fade (faint:
   *  the mooring's updates, which the loop keeps running under the pier's page, bring it up in a third of a real second). */
  show(tool) {
    const id = tool && MOUNTS[tool] && MOUNT_LOOK[tool] ? tool : null;
    if (id === this.tool) return this;
    this.tool = id; this.since = 0;
    if (this.ctx) this.draw(this.ctx, 0); else this.mesh.visible = false;
    return this;
  }

  /** Nothing chosen and nowhere to stand (the Courier left the pier, or cast off): the next one waits for a draw to place it. */
  park() { this.tool = null; this.ctx = null; this.buf.count = 0; this.buf.flush(); this.mesh.visible = false; return this; }

  /** Once a frame where it is shown (the mooring's update). */
  draw(ctx, dt = 0) {
    this.ctx = ctx; this.since += dt; this.t += dt;
    const B = this.buf; B.count = 0;
    if (!this.tool || !ctx?.camera) { B.flush(); this.mesh.visible = false; return; }
    const cam = ctx.camera; cam.updateMatrixWorld();
    this.pxk = cam.projectionMatrix.elements[5] * 0.5 * (ctx.lines || 480); // (pixels per metre at a metre's depth)
    this.f.set(Math.sin(ctx.yaw), 0, Math.cos(ctx.yaw)); this.r.set(-Math.cos(ctx.yaw), 0, Math.sin(ctx.yaw)); // (ahead, and the right hand facing it: ahead crossed with up)
    this.alpha = Math.max(0.0001, smooth(0, FADE, this.since)) * (0.84 + 0.16 * Math.sin((this.t * TAU) / BREATH));
    const L = MOUNT_LOOK[this.tool];
    _c.set(L.color ?? ctx.color ?? 0xffc65c); this.rgb[0] = _c.r; this.rgb[1] = _c.g; this.rgb[2] = _c.b;
    SHAPES[L.shape](this, MOUNTS[this.tool], L, this.t, ctx);
    B.flush(); this.mesh.visible = B.count > 0;
  }

  /** A point of the ship's frame (x to the right, z ahead, h a height over the sea, or null: on the drawn crude) into the world. */
  world(p, out) {
    const c = this.ctx, x = c.at.x + this.r.x * p[0] + this.f.x * p[1], z = c.at.z + this.r.z * p[0] + this.f.z * p[1];
    const y = p[2] == null ? (c.water?.(x, z) ?? c.at.y) + LIFT : c.at.y + p[2];
    return out.set(x, y, z);
  }

  /** A strip of points (the ship's frame), its look MAIN or THIN, its alpha a number or one per point (a function of the index). */
  strip(pts, look = MAIN, a = 1, closed = false) {
    const B = this.buf, n = pts.length; if (n < 2) return;
    const cam = this.ctx.camera, V = cam.matrixWorldInverse, W = this.pw, A = this.pa;
    for (let i = 0; i < n; i++) {
      const w = (W[i] ||= new THREE.Vector3()); this.world(pts[i], w);
      const depth = Math.max(0.3, -_e.copy(w).applyMatrix4(V).z), pxm = this.pxk / depth;
      const px = Math.min(look.hi, Math.max(look.lo, look.m * pxm));
      A[i] = (px / pxm) * (look.wire ? 1 : -1); // (a negative half-width: the colour alone, no schiller in its heart)
    }
    const al = (i) => this.alpha * (typeof a === 'function' ? a(i) : a), [cr, cg, cb] = this.rgb, segs = closed ? n : n - 1;
    for (let i = 0; i < segs && B.count < B.cap; i++) {
      const j = (i + 1) % n, P = W[i > 0 ? i - 1 : closed ? n - 1 : i], N = W[j + 1 < n ? j + 1 : closed ? (j + 1) % n : j], Pa = W[i], Pb = W[j];
      B.put(B.count++, Pa.x, Pa.y, Pa.z, A[i], Pb.x, Pb.y, Pb.z, A[j], P.x, P.y, P.z, al(i), N.x, N.y, N.z, al(j), STYLE.wire, cr, cg, cb);
    }
  }
}

/** The shapes, in the ship's frame and the moored hull's metres (the rail's times K). */
const SHAPES = {
  /** The Blaster: the line of fire from the nose, level over the bow, its near and far reticles, shots running out on the sixteenths. */
  fireLine(P, M, L, t) {
    const [d1, d2] = T.ship?.reticles || [12, 36], h = 2.5, z0 = NOSE * K, near = d1 * K, far = d2 * K;
    P.strip(run(0, z0, 0, far, 6, h), MAIN, (i) => 0.7);
    for (const [d, s] of [[near, 3.0], [far, 4.6]]) {
      const x = s / 2, lo = h - s / 2, hi = h + s / 2;
      P.strip([[-x, d, lo], [x, d, lo], [x, d, hi], [-x, d, hi]], MAIN, 1, true);
    }
    const speed = 70, every = 0.25, dash = 3.5; // (m/s at the mooring's size; a shot each sixteenth; a tracer's length)
    for (let k = 0; k < Math.ceil((far - z0) / (speed * every)) + 1; k++) {
      const d = z0 + frac(t / every) * speed * every + k * speed * every; if (d > far) break;
      P.strip([[0, Math.max(z0, d - dash), h], [0, d, h]], MAIN, 1 - (d - z0) / (far - z0) * 0.6);
    }
  },

  /** Absorb Spray: the fan ahead, arcs spraying out across it. */
  sprayFan(P, M, L, t) { cone(P, M.range * K, ((M.angle || 50) / 2) * D2R, t, 1); },
  /** Vacuum: the cone ahead, arcs drawn in to the nose. */
  drawCone(P, M, L, t) { cone(P, M.range * K, ((M.angle || 35) / 2) * D2R, t, -1); },

  /** Bomb: the blast ring at its range round the ship's middle, the beat's larger one faint and broken, a shockwave going out to it. */
  blastRing(P, M, L, t, ctx) {
    const R = (M.range || 10) * K, Rb = R * (L.beat || 1.4), hull = (ctx.length || 7) / 2;
    P.strip(arc(0, 0, R, 0, TAU, 120).slice(0, 120), MAIN, 1, true);
    const beat = 0.5 + 0.5 * Math.cos(frac(t / 1.2) * TAU), n = 48; // (the beat's blast ring brightens and dims at one slow rate)
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; P.strip(arc(0, 0, Rb, a, a + (TAU / n) * 0.55, 3), THIN, 0.3 + 0.25 * beat); }
    const f = frac(t / 2.4), g = Math.min(1, f / 0.55); // (the shockwave: out in 1.3 real seconds, then a breath of rest)
    if (f < 0.55) P.strip(arc(0, 0, hull + (R - hull) * easeOut(g), 0, TAU, 96).slice(0, 96), THIN, 0.85 * (1 - g * g), true);
  },

  /** Snapshot: the camera's frame standing on the sea ahead, its corners focusing in, a shutter's brightening, the frustum faint. */
  viewfinder(P, M, L, t) {
    const D = L.at * K, Wd = L.w * K, Ht = L.h * K, z0 = NOSE * K, base = 0.4, cy = base + Ht / 2, apex = [0, z0, 1.2];
    const f = frac(t / 2.6), s = 1 + 0.1 * (1 - easeOut(Math.min(1, f / 0.55))), shut = f > 0.55 && f < 0.63 ? 1 : 0.72;
    const hw = (Wd / 2) * s, hh = (Ht / 2) * s, arm = Wd * 0.16;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const x = sx * hw, y = cy + sy * hh;
      P.strip([[x - sx * arm, D, y], [x, D, y], [x, D, y - sy * arm]], MAIN, shut);
      P.strip(run(apex[0], apex[1], sx * (Wd / 2), D, 6, null).map((p, i, a) => [p[0], p[1], apex[2] + ((cy + sy * (Ht / 2)) - apex[2]) * (i / (a.length - 1))]), THIN, 0.28);
    }
    const c = Wd * 0.035;
    P.strip([[-c, D, cy], [c, D, cy]], THIN, 0.6); P.strip([[0, D, cy - c], [0, D, cy + c]], THIN, 0.6);
  },

  /** Grapple: the grapnel line to its range, two flukes at its end, the aim's arc faint; the hook thrown out and reeled back in. */
  grapnel(P, M, L, t) {
    const R = (M.range || 16) * K, half = ((L.angle || 60) / 2) * D2R, z0 = NOSE * K, tip = z0 + R, c = 1.3 * K; // (the claw's size)
    P.strip(run(0, z0, 0, tip, 3), MAIN, 0.75);
    for (const s of [-1, 1]) P.strip([[0, tip, null], [s * c * 0.35, tip - c * 0.1, null], [s * c * 0.62, tip - c * 0.38, null], [s * c * 0.6, tip - c * 0.7, null], [s * c * 0.42, tip - c * 0.9, null]], MAIN, 1); // (a grapnel's two flukes, curving back to the ship)
    P.strip(arc(0, z0, R, -half, half, 24), THIN, 0.3);
    for (const s of [-1, 1]) P.strip(run(0, z0, Math.sin(s * half) * R, z0 + Math.cos(half) * R, 4), THIN, 0.18);
    const f = frac(t / 2.2), out = f < 0.3 ? easeOut(f / 0.3) : f < 0.42 ? 1 : f < 0.66 ? 1 - smooth(0.42, 0.66, f) : 0; // (out, a beat held, reeled in, at rest)
    if (out > 0.02) { const d = z0 + R * out; P.strip(run(0, z0, 0, d, 3), MAIN, 1); P.strip([[0, Math.max(z0, d - 2.2), null], [0, d, null]], MAIN, 1); }
  },

  /** Radar: range circles round the ship and their ticks, a scan line turning once in L.turn real seconds with its afterglow. */
  radarScan(P, M, L, t, ctx) {
    const R = L.range * K, r0 = (ctx.length || 7) / 2 + 1.5;
    P.strip(arc(0, 0, R, 0, TAU, 112).slice(0, 112), MAIN, 0.9, true);
    for (const k of [1 / 3, 2 / 3]) P.strip(arc(0, 0, R * k, 0, TAU, 72).slice(0, 72), THIN, 0.28, true);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, l = i % 3 === 0 ? 0.09 : 0.05; P.strip([[R * Math.sin(a), R * Math.cos(a), null], [R * (1 + l) * Math.sin(a), R * (1 + l) * Math.cos(a), null]], THIN, 0.6); }
    const th = (t / (L.turn || 4)) * TAU; // (from ahead toward the right: clockwise seen from above; checked on the PNG, casebook rule 129)
    P.strip(run(r0 * Math.sin(th), r0 * Math.cos(th), R * Math.sin(th), R * Math.cos(th), 4), MAIN, 1);
    for (let i = 1; i <= 10; i++) { const a = th - i * 3.2 * D2R; P.strip(run(r0 * Math.sin(a), r0 * Math.cos(a), R * Math.sin(a), R * Math.cos(a), 6), THIN, 0.5 * (1 - i / 11) ** 2); }
  },
};

/** A cone ahead from the nose: its two edges, its far arc, and three arcs moving across it (out for a spray, in for a draw). */
function cone(P, R, half, t, sense) {
  const z0 = NOSE * K;
  for (const s of [-1, 1]) P.strip(run(0, z0, Math.sin(s * half) * R, z0 + Math.cos(half) * R, 3), MAIN, 1);
  P.strip(arc(0, z0, R, -half, half, 28), MAIN, 1);
  for (let i = 0; i < 3; i++) {
    const f = frac(t / 1.5 + i / 3), u = sense > 0 ? f : 1 - f, r = R * (0.06 + 0.94 * u);
    P.strip(arc(0, z0, r, -half, half, 18), THIN, 0.75 * Math.sin(Math.PI * f) ** 1.2);
  }
}
