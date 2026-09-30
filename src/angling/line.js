// ---------------------------------------------------------------------------------------
// THE FISHING LINE: a real rope (vfx/rope.js: a Verlet chain from the rod's tip to whatever is on the other end), and the fight's
// gauge. It hangs in a curve when there is slack (the curve is the slack) and pulls straight when it is loaded; it is the colour of
// the load. Dull cream when it is limp, then, through the sweet band where a fish tires, the lure's own aspect colour with a soft
// glow along it, then amber as it nears its limit and red-hot over it, with a hum you can see. In the air it leaves the rod coiled
// and uncoils along the cast, the way a rope pays out of a harpoon gun.
//
//   line.set(tip, end, { tension, aspect (hex), helix, cam (the camera's position: the line is one width on the screen) })      line.hide()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Rope } from '../vfx/rope.js';
import { BAND } from './fight.js';

const AMBER = new THREE.Color(0xff9a3c), HOT = new THREE.Color(0xff3a2a);
const _c = new THREE.Color(), _g = new THREE.Color();
const sm = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export class FishingLine {
  /** opts: { radius (the rope's, at close range), color (its slack colour), n (its links) }: the grapnel's line is the same rope, thicker. */
  constructor(scene, { radius = 0.011, color = 0xd8c7b4, n = 36 } = {}) {
    this.rope = new Rope(scene, { n, sides: 4, radius, color });
    this.baseR = radius;
    this.slackCol = new THREE.Color(color);
    this.sag = 0.3;
    this.load = 0; // the eased tension
  }
  get visible() { return this.rope.visible; }
  hide() { this.rope.hide(); }

  /** o: { tension 0..1.3, aspect (hex), helix 0..1, camDist, dt, time } */
  set(tip, end, o = {}) {
    const dt = o.dt ?? 1 / 60, tension = o.tension ?? 0.2;
    const dist = tip.distanceTo(end);
    this.load = THREE.MathUtils.damp(this.load, tension, 10, dt);
    const T = this.load;
    // how much line there is beyond the straight: (8/3) s^2 / d for a sag of s
    const sag = THREE.MathUtils.clamp((1 - Math.min(1, T)) * (0.05 + dist * 0.045), 0.0, 3.2);
    this.sag = THREE.MathUtils.damp(this.sag, sag, 8, dt);
    const length = dist + (o.slack ?? (8 / 3) * this.sag * this.sag / Math.max(1, dist)); // (the slack the caller knows, or the sag it is asked to show)
    // the colour of the load
    const asp = _c.set(o.aspect ?? 0xffb27a);
    const inBand = sm(BAND[0] - 0.1, BAND[0] + 0.08, T) * (1 - sm(BAND[1] - 0.04, BAND[1] + 0.12, T));
    const warm = sm(BAND[1] - 0.02, 0.98, T), hot = sm(0.98, 1.12, T);
    _g.copy(this.slackCol).lerp(asp.clone().lerp(new THREE.Color(0xffffff), 0.25), inBand).lerp(AMBER, warm).lerp(HOT, hot);
    this.rope.setColor(_g);
    const glowK = Math.max(inBand * 0.55, warm * 0.75, hot);
    const hum = T > 0.9 ? (T - 0.9) * 0.05 : 0; // (over the limit it shivers)
    const helix = o.helix ?? 0;
    const cd = o.camDist ?? 6;
    this.rope.update(dt, tip, end, {
      length, gravity: 9.5, damp: 0.98, iter: 7,
      helix, helixR: 0.3, coils: Math.max(2, Math.min(length / 0.85, this.rope.n / 6.5)), // (a coil needs enough links to look like a coil)
      glow: _g, taut: glowK, cam: o.cam, px: 0.0034 * (this.baseR / 0.011), rMin: this.baseR * 0.85, rMax: this.baseR * 5.5,
      radius: THREE.MathUtils.clamp(cd * 0.0034 * (this.baseR / 0.011), this.baseR * 0.85, this.baseR * 5.5),
    });
    if (hum > 0) this.rope.mesh.position.set(Math.sin((o.time ?? 0) * 70) * hum, Math.cos((o.time ?? 0) * 61) * hum, 0);
    else this.rope.mesh.position.set(0, 0, 0);
    this.rope.glow.position.copy(this.rope.mesh.position);
  }
}
