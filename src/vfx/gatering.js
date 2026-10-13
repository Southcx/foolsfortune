// ---------------------------------------------------------------------------------------
// THE GATE'S RINGS: the Index as a proper Gate. Over the Index's pedestal in the basement's hub, three glazed hoops turn round a pale
// sphere, each the other way from the next and slowly (a potter's wheel-head's pace, never a spin); choosing a room at the Index
// sweeps bands of warm light up the Courier's body while the seam's cover closes (the gate-out), and on the far side the same bands
// come down over them as the cover lifts (the arrival). No words, no numbers: a world mark on the thing.
//
// The hoops are fired with the room glazes (celadon, shino, oribe: vfx/roomglazes.js) through the level's own material (Level.mat ->
// vfx/surfaces.js `dress`), so they are drawn by the program every built surface already uses, triplanar in their own object space (they
// turn with their glaze, it never slides). The bands of light share the particles' tracer program (an additive MeshBasicMaterial with
// no map: vfx/particles.js). Nothing here compiles a program of its own; the hoops are built before the warm-up and compiled with it.
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
  { r: 0.8, tube: 0.045, glaze: 'celadon', turn: 0.30, tilt: [1.15, 0.25] },
  { r: 0.64, tube: 0.04, glaze: 'shino', turn: -0.42, tilt: [0.35, 1.05] },
  { r: 0.49, tube: 0.035, glaze: 'oribe', turn: 0.55, tilt: [-0.6, -0.4] },
];
const SPHERE = { r: 0.2, glaze: 'majolica', glow: 0x2a1c10, lift: 2.35 }; // (the pale sphere's centre over the hub's floor, m)
const BANDS = [0xfff1dc, 0xbfe3cf, 0xf4c2b8]; // (cream, celadon, rose: the light warm, DATA-LOOK.md "what stays cute")
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
      this.idle.position.set(at.x, floor + SPHERE.lift, at.z);
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(SPHERE.r, 20, 14), game.level.mat(ROOM_GLAZES[SPHERE.glaze].body, SPHERE.glow));
      this.idle.add(sphere);
      this.sphere = sphere;
      this.hoops = HOOPS.map((h) => {
        const tilt = new THREE.Group(); tilt.rotation.set(h.tilt[0], 0, h.tilt[1]);
        const m = new THREE.Mesh(new THREE.TorusGeometry(h.r, h.tube, 8, 56), game.level.mat(ROOM_GLAZES[h.glaze].body));
        m.rotation.x = Math.PI / 2; // (the torus lies in its tilt group's floor plane, and turns about the group's up)
        const spin = new THREE.Group(); spin.add(m); tilt.add(spin); this.idle.add(tilt);
        return { ...h, spin, tiltG: tilt };
      });
      game.scene.add(this.idle);
    }
    // the bands of light: open cylinders round the body, one material each (the tracer's program: vfx/particles.js)
    const g = new THREE.CylinderGeometry(1, 1, 0.035, 32, 1, true);
    this.bands = new THREE.Group(); this.bands.visible = false; this.bands.userData.zoneFree = true; // (it goes where the Courier goes)
    this.bandMeshes = BANDS.map((color) => {
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.frustumCulled = false; this.bands.add(m); return m;
    });
    game.scene.add(this.bands);
  }

  /** The gate-out: the bands climb the Courier while the seam's cover closes; `fn` (the room's teleport) runs under it, then the arrival. */
  depart(fn) {
    const S = this.game.seam;
    if (!S || S.busy) return false;
    const took = S.cross(() => { try { fn(); } finally { this.job = { kind: 'in', t: 0 }; } }, { kind: 'gate', out: OUT });
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
    for (const [i, m] of this.bandMeshes.entries()) {
      const k = (J.t - i * STAGGER) / SWEEP; // (0..1 along the body)
      if (k < 0 || k > 1) { m.material.opacity = 0; if (k < 0) live = true; continue; }
      live = true;
      const e = k * k * (3 - 2 * k), h = J.kind === 'out' ? e : 1 - e; // (out: feet to crown; in: crown to feet)
      m.position.y = 0.05 + h * HEIGHT;
      const r = 0.5 - 0.18 * h; // (narrower at the crown, as a body is)
      m.scale.set(r, 1 + 0.8 * Math.sin(Math.PI * k), r);
      m.material.opacity = 0.85 * Math.sin(Math.PI * k);
    }
    if (!live) { this.job = null; this.bands.visible = false; }
  }
}
