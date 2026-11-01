// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S TRAINING TARGETS, THE GALLERY DUCK'S BODY: a shooting gallery's tin duck, cut from a sheet and painted yellow, a
// button sewn on for its eye and Strawman's red and cream rings on its flank, the tab it once rode the gallery's track on still under its
// belly, its neck torn off once and soldered and stitched back (one of Pip's first tries, LORE.md); Pip set it free with a cotton
// bobbin and two card blades for a rotor. It flies, its wing flapping on its pin; it tips its beak down a beat (its tell) and dives,
// nose first, then climbs back.
//
// Prior art: the fairground shooting gallery's tin ducks on their track, the toy theatre's cut-out on a wire, the bamboo-copter (a
// spindle and two blades), Duck Hunt's flight and Super Mario's Paratroopa (a flyer that patrols and swoops).
//
//   new GalleryDuckBody()   (the contract: targets/kit.js TargetBody)   DUCK_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { TargetBody, TARGET_LOOK as L, Sheet, box, rgb, V, bullseye, buttonEye, darn } from './kit.js';
import { card } from '../theatre/kit.js';

/** Its profile (m, facing +x, from its belly's foot), the rotor (the bobbin's middle, the blades' half-span, turns/s), the wing (its pin
 *  and flap), the dive's tip (rad) and the windup's and dive's times (s, the runtime's: world/strawmanwell/targets.js), its drawn scale. */
export const DUCK_LOOK = {
  profile: [[-0.44, 0.44], [-0.38, 0.3], [-0.1, 0.22], [0.2, 0.24], [0.36, 0.42], [0.38, 0.6], [0.46, 0.64], [0.64, 0.67], [0.47, 0.71],
    [0.45, 0.79], [0.37, 0.86], [0.25, 0.84], [0.18, 0.73], [0.13, 0.6], [0.05, 0.56], [-0.2, 0.55]],
  beakX: 0.45, eye: [0.33, 0.77], ring: [-0.02, 0.4, 0.13],
  rotor: { at: [-0.04, 0.6], spin: 7, span: 0.34 }, wing: { pin: [-0.02, 0.5], flap: 0.5, rate: 9 },
  tip: -0.55, wind: 0.6, dive: 0.55, scale: 1.35,
};
const D = DUCK_LOOK;

export class GalleryDuckBody extends TargetBody {
  constructor() {
    super();
    this.rock.scale.setScalar(D.scale); // (drawn a third over its make: at the Well's distance a smaller duck loses its rings)
    this.pitch = new THREE.Group(); this.pitch.position.y = 0.45; this.flip.add(this.pitch); // (it tips about its middle)
    const S0 = new Sheet(), oy = -0.45;
    const pts = D.profile.map(([x, y]) => [x, y + oy]);
    card(S0, pts, 0, {
      thick: 0.05, keyline: 0.035, ink: rgb(L.lacquer), edge: rgb(L.tinShade, 0.8),
      face: (x, y) => (x > D.beakX ? rgb(L.beak, 1.05) : rgb(L.tin, 0.85 + 0.25 * ((y - oy) / 0.86))),
    });
    // the painted breast line, the eye button, the flank's rings, the track's tab and its pin
    for (let i = 0; i < 6; i++) { const x = 0.24 + i * 0.022; box(S0, x - 0.006, x + 0.006, 0.28 + oy + i * 0.03, 0.31 + oy + i * 0.03, 0.026, 0.03, rgb(L.tinShade, 0.9), 'f'); }
    // the seam where its neck tore off the track once: a bead of solder along it, and Pip's stitches over that (LORE.md)
    for (let i = 0; i < 7; i++) { const x = 0.1 + i * 0.035, y = 0.62 + oy - i * 0.012; box(S0, x - 0.016, x + 0.016, y - 0.01, y + 0.01, 0.026, 0.034, rgb(L.steel, 1.25 - 0.1 * (i % 2)), 'ft'); }
    darn(S0, [0.09, 0.63 + oy], [0.33, 0.55 + oy], 0.034, 0.06);
    buttonEye(S0, D.eye[0], D.eye[1] + oy, 0.026, 0.036);
    bullseye(S0, D.ring[0], D.ring[1] + oy, 0.028, D.ring[2], 5);
    box(S0, -0.03, 0.09, 0.08 + oy, 0.24 + oy, -0.012, 0.012, rgb(L.tinShade, 0.95), 'ftlr');
    const pin = new THREE.CylinderGeometry(0.018, 0.018, 0.08, 8).rotateX(Math.PI / 2).translate(0.03, 0.12 + oy, 0); S0.add(pin, rgb(L.brass, 1.1)); pin.dispose();
    this.mesh(S0, this.pitch);
    // the wing on its pin
    this.wing = new THREE.Group(); this.wing.position.set(D.wing.pin[0], D.wing.pin[1] + oy, 0.04); this.pitch.add(this.wing);
    const S1 = new Sheet();
    card(S1, [[0.06, 0.02], [-0.3, 0.06], [-0.26, 0.0], [-0.2, -0.04], [-0.12, -0.06], [0.04, -0.03]], 0, { thick: 0.02, keyline: 0.02, ink: rgb(L.lacquer), edge: rgb(L.tinShade, 0.7), face: (x) => rgb(L.tin, 0.72 + 0.2 * (x + 0.3)) });
    for (let i = 0; i < 3; i++) box(S1, -0.24 + i * 0.07, -0.2 + i * 0.07, -0.025, 0.02, 0.012, 0.016, rgb(L.tinShade, 0.9), 'f'); // (its painted feathers)
    this.mesh(S1, this.wing);
    // the rotor: a cotton bobbin on its spindle, two card blades with red tips
    this.rotor = new THREE.Group(); this.rotor.position.set(D.rotor.at[0], D.rotor.at[1] + oy, 0); this.pitch.add(this.rotor);
    const S2 = new Sheet();
    const bob = new THREE.CylinderGeometry(0.045, 0.045, 0.08, 12).translate(0, 0.07, 0); S2.add(bob, (p, n) => rgb(L.thread[1], 0.7 + 0.3 * Math.max(0, n.z) + 0.15 * Math.sin(p.y * 160))); bob.dispose();
    for (const y of [0.03, 0.11]) { const fl = new THREE.CylinderGeometry(0.06, 0.06, 0.015, 12).translate(0, y, 0); S2.add(fl, rgb(0xc89a5c, 0.9)); fl.dispose(); }
    box(S2, -0.008, 0.008, 0, 0.16, -0.008, 0.008, rgb(L.post), 'flr');
    this.mesh(S2, this.rotor);
    this.blades = new THREE.Group(); this.blades.position.y = 0.16; this.rotor.add(this.blades);
    const S3 = new Sheet(), sp = D.rotor.span;
    for (const s of [-1, 1]) {
      box(S3, s > 0 ? 0.02 : -sp, s > 0 ? sp : -0.02, -0.006, 0.006, -0.035, 0.035, (f) => rgb(L.cream, f === 't' ? 1.1 : 0.8), 'tulr');
      box(S3, s > 0 ? sp - 0.08 : -sp, s > 0 ? sp : -sp + 0.08, -0.007, 0.007, -0.036, 0.036, rgb(L.red, 1), 't');
    }
    this.mesh(S3, this.blades);
    this.moveFor = D.wind + D.dive; this.parts.right = this.pitch; this.tilt = 0;
  }

  pose(dt) {
    const mv = this.mv;
    this.blades.rotation.y += dt * D.rotor.spin * Math.PI * 2 * (mv ? 1.6 : 1);
    this.wing.rotation.z = D.wing.flap * Math.sin(this.t * D.wing.rate) * (mv && mv.t > D.wind ? 0.2 : 1);
    const want = mv?.id === 'swing' ? D.tip * Math.min(1, mv.t / D.wind) * (mv.t > D.wind ? 1.2 : 1) : -0.08 * Math.sin(this.t * 1.4) + (this.vy || 0) * 0.04;
    this.tilt += (want - this.tilt) * Math.min(1, dt * 10);
    this.pitch.rotation.z = this.tilt;
    this.pitch.position.y = 0.45 + 0.05 * Math.sin(this.t * 2.2);
  }
}
