// ---------------------------------------------------------------------------------------
// THE GATE'S RINGS: the Index as a proper Gate. Over the Index's pedestal in the basement's hub, three glazed hoops turn round a pale
// sphere, each the other way from the next and slowly (a potter's wheel-head's pace, never a spin); choosing a room at the Index
// sweeps bands of warm light up the Courier's body while the seam's cover closes (the gate-out), and on the far side the same bands
// come down over them as the cover lifts (the arrival). No words, no numbers: a world mark on the thing.
//
// The hoops are fired with the room glazes (celadon, shino, oribe: vfx/roomglazes.js) through the level's own material (Level.mat ->
// vfx/surfaces.js `dress`), so they are drawn by the program every built surface already uses, triplanar in their own object space (they
// turn with their glaze, it never slides). The bands of light share the particles' tracer program (an additive MeshBasicMaterial with
// no map: vfx/particles.js). An arrival flourish worn (vfx/flourishes.js) takes the arrival's place; the gate-out stays. Nothing here compiles a program of its own; the hoops are built before the warm-up and compiled with it.
//
// Prior art: .hack's Chaos Gate (CyberConnect2, 2002: the Root Town's ring gate, three hoops round a sphere, and the gate-out, rings of
// light sweeping the body as the world is left; DATA-LOOK.md proposal 6), kept cute: glazed hoops, celadon and cream, the light warm.
// The armillary sphere (counter-turning rings round a centre) is its older ancestor. The cover itself is the seam's (render/seam.js).
//
//   game.gateRing = new GateRing(game)   (after game.course: the Index's pedestal is where the hoops hang)
//   game.gateRing.depart(fn) -> false when it cannot (no seam, a seam already under way): the caller then runs fn itself
//   game.gateRing.update(rawDt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ROOM_GLAZES } from './roomglazes.js';

const HOOPS = [ // radius (m), tube, glaze, turn (radians a real second), tilt about x and z (radians)
  { r: 1.3, tube: 0.07, glaze: 'celadon', turn: 0.30, tilt: [1.15, 0.25] },
  { r: 1.04, tube: 0.06, glaze: 'shino', turn: -0.42, tilt: [0.35, 1.05] },
  { r: 0.8, tube: 0.05, glaze: 'oribe', turn: 0.55, tilt: [-0.6, -0.4] },
];
const LINE = { tube: 0.012, glow: 0.9 }; // the glowing line on each hoop's inner edge: its tube (m), and how much of the glaze's ware colour it gives off
const SPHERE = { r: 0.34, glaze: 'majolica', glow: 0x3a2814, lift: 2.75, forward: 0.5 }; // (the pale sphere's centre over the hub's floor, m, at about head height
// over the pedestal; pulled forward, to +z, off the pedestal's back so it stands clear of the metrics board on the south wall)
const BANDS = [0xfff1dc, 0xbfe3cf, 0xf4c2b8]; // (cream, celadon, rose: the light warm, DATA-LOOK.md "what stays cute")
const LAYERS = [ // one ring of light: radius (x the ring's), height (m), opacity, colour gain (over 1: the glow's bloom takes it)
  { r: 1.0, h: 0.016, op: 1.0, gain: 2.2 }, // the rim
  { r: 1.02, h: 0.07, op: 0.32, gain: 1.2 }, // its halo
  { r: 1.05, h: 0.18, op: 0.1, gain: 1.0 }, // the soft fall-off
  { r: 0.86, h: 0.05, op: 0.1, gain: 1.0 }, // a faint skin inside
];
const SWEEP = 0.42; // one band's travel, feet to crown (real s)
const STAGGER = 0.07; // between bands (real s)
const OUT = SWEEP + 2 * STAGGER; // the cover's dip under the gate-out (the seam's `out`, real s): the last band reaches the crown as it closes
const HEIGHT = 1.95; // the Courier's crown over the feet (m)

export class GateRing {
  constructor(game) {
    this.game = game;
    this.t = 0;
    this.job = null; // { kind: 'out' | 'in', t }
    const C = game.course, at = C?.console, disc = C?.consoleDisc;
    if (at && disc && game.level?.mat) {
      const floor = disc.position.y - 0.03;
      this.idle = new THREE.Group();
      this.idle.position.set(at.x, floor + SPHERE.lift, at.z + SPHERE.forward);
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(SPHERE.r, 20, 14), game.level.mat(ROOM_GLAZES[SPHERE.glaze].body, SPHERE.glow));
      this.idle.add(sphere);
      this.sphere = sphere;
      this.hoops = HOOPS.map((h) => {
        const tilt = new THREE.Group(); tilt.rotation.set(h.tilt[0], 0, h.tilt[1]);
        const m = new THREE.Mesh(new THREE.TorusGeometry(h.r, h.tube, 8, 56), game.level.mat(ROOM_GLAZES[h.glaze].body));
        m.rotation.x = Math.PI / 2; // (the torus lies in its tilt group's floor plane, and turns about the group's up)
        // its inner edge lit: a thin hoop just inside it, the level's one program again, given off in the glaze's own ware colour
        const G = ROOM_GLAZES[h.glaze], glow = new THREE.Color(G.ware).multiplyScalar(LINE.glow).getHex();
        const line = new THREE.Mesh(new THREE.TorusGeometry(h.r - h.tube * 0.95, LINE.tube, 4, 72), game.level.mat(G.ware, glow));
        line.rotation.x = Math.PI / 2;
        const spin = new THREE.Group(); spin.add(m, line); tilt.add(spin); this.idle.add(tilt);
        return { ...h, spin, tiltG: tilt };
      });
      game.scene.add(this.idle);
    }
    // the rings of light: each a stack of open cylinders round the body, additive (the tracer's program: vfx/particles.js): a thin bright
    // rim, a wider soft halo over it, and a faint skin a little inside, so it reads as light with an edge and no body
    this.bands = new THREE.Group(); this.bands.visible = false; this.bands.userData.zoneFree = true; // (it goes where the Courier goes)
    const geo = new THREE.CylinderGeometry(1, 1, 1, 40, 1, true);
    this.bandRings = BANDS.map((color) => {
      const ring = new THREE.Group();
      ring.layers3 = LAYERS.map((L) => {
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(L.gain), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        m.scale.set(L.r, L.h, L.r); m.frustumCulled = false; m.userData.op = L.op; ring.add(m); return m;
      });
      this.bands.add(ring); return ring;
    });
    game.scene.add(this.bands);
  }

  /** The gate-out: the bands climb the Courier while the seam's cover closes; `fn` (the room's teleport) runs under it, then the arrival. */
  depart(fn) {
    const S = this.game.seam;
    if (!S || S.busy) return false;
    // (on the far side the bands come down, unless an arrival flourish is worn: it is drawn there instead, vfx/flourishes.js)
    const took = S.cross(() => { try { fn(); } finally { if (this.game.flourishes?.arrive('gate')) { this.job = null; this.bands.visible = false; } else this.job = { kind: 'in', t: 0 }; } }, { kind: 'gate', out: OUT });
    if (!took) return false;
    this.job = { kind: 'out', t: 0 };
    return true;
  }

  update(dt) {
    this.t += dt;
    if (this.idle) {
      // the hoops turn, each against the next, and their tilts precess slower still; the sphere breathes on a slow bob
      for (const [i, h] of this.hoops.entries()) {
        h.spin.rotation.y += h.turn * dt;
        h.tiltG.rotation.y = 0.12 * this.t * (i % 2 ? -1 : 1);
      }
      this.sphere.position.y = 0.035 * Math.sin(this.t * 1.1);
    }
    const J = this.job;
    if (!J) return;
    J.t += dt;
    const P = this.game.player?.pos;
    if (P) this.bands.position.copy(P);
    this.bands.visible = true;
    let live = false;
    for (const [i, ring] of this.bandRings.entries()) {
      const k = (J.t - i * STAGGER) / SWEEP; // (0..1 along the body)
      if (k < 0 || k > 1) { for (const m of ring.layers3) m.material.opacity = 0; if (k < 0) live = true; continue; }
      live = true;
      const e = k * k * (3 - 2 * k), h = J.kind === 'out' ? e : 1 - e; // (out: feet to crown; in: crown to feet)
      ring.position.y = 0.05 + h * HEIGHT;
      const r = 0.55 - 0.2 * h, f = Math.sin(Math.PI * k); // (narrower at the crown, as a body is; in and out softly)
      ring.scale.set(r, 1, r);
      for (const m of ring.layers3) m.material.opacity = m.userData.op * f;
    }
    if (!live) { this.job = null; this.bands.visible = false; }
  }
}
