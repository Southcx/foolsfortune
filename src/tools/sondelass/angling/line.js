// ---------------------------------------------------------------------------------------
// THE FISHING LINE: a real rope (vfx/rope.js: a Verlet chain from the rod's tip to whatever is on the other end), and the fight's
// gauge. SLACK IS THE ONLY CURVE (docs/plans/ANGLING.md 2): loaded, it is the straight segment it is; it hangs only with real slack,
// told by the caller (the hook's spare line, the fight's bow) or, untold, a limp line's own (none from LINE.loaded up). It is the
// colour of the load: dull cream when it is limp, then, through the sweet band where a fish tires, the lure's own aspect colour with
// a soft glow along it, then amber as it nears its limit and red-hot over it, with a hum you can see. In the air it leaves the rod
// coiled and uncoils along the cast, the way a rope pays out of a harpoon gun.
//
// THE CORE (the owner, 2026-10-11: "a line drawn within the fishing line's filament"): while a fish is on, the line is a sheath (the
// tension's colour) with a bright thread inside it, the fish's stamina: full, it runs rod to hook; as the fish tires it draws back
// toward the hook, spent a bead there; it pulses with each tail beat. A 1-pixel line cannot hold a thread at 480 lines, so the width
// is a pixel count, not metres: a hair (LINE.hairPx) at rest, the sheath LINE.sheathPx and the thread LINE.corePx while a fish is on,
// eased back after. Two quantities, one filament: the sheath the danger now, the core how far there is to go.
//
// Prior art: Sega Bass Fishing (the rod and line as the whole readout), real monofilament's sag and twang, and Tron's light lines for a
// core that glows inside a sheath.
//
//   line.set(tip, end, { tension, slack (m, told), bow (0..1), aspect (hex), helix, cam (the camera's position), fov, lines,
//                        fish: { stamina, beat 0..1 } | null })      line.hide()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Rope } from '../../../vfx/rope.js';
import { BAND } from './fight.js';

/** loaded: the eased tension from which an untold line has no slack. Widths in pixels at the render's lines (a hair is the fishing
 *  line's; a thicker rope's hair is wider by its radius). */
export const LINE = { loaded: 0.3, hairPx: 2, sheathPx: 3, corePx: 1 };
const AMBER = new THREE.Color(0xff9a3c), HOT = new THREE.Color(0xff3a2a), WHITE = new THREE.Color(0xffffff);
const _c = new THREE.Color(), _g = new THREE.Color(), _k = new THREE.Color();
const sm = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export class FishingLine {
  /** opts: { radius (the rope's, at close range), color (its slack colour), n (its links) }: the grapnel's line is the same rope, thicker. */
  constructor(scene, { radius = 0.011, color = 0xd8c7b4, n = 36 } = {}) {
    this.rope = new Rope(scene, { n, sides: 4, radius, color });
    this.core = new Rope(scene, { n: 24, sides: 4, radius, color: 0xffffff, bands: false }); // (a tube laid along the line: Rope.trace; no twist, plain white, so it keeps the rope's own vertex-coloured program)
    this.core.mat.toneMapped = false; this.core.mat.needsUpdate = true;
    this.core.mesh.renderOrder = 7;
    this.baseR = radius;
    this.slackCol = new THREE.Color(color);
    this.slack = 0.2; // (an untold line's eased spare length, m)
    this.load = 0; // the eased tension
    this.fat = 0; // 0 a hair .. 1 the sheath (a fish on)
  }
  get visible() { return this.rope.visible; }
  hide() { this.rope.hide(); this.core.hide(); this.fat = 0; }

  /** o: { tension 0..1.3, slack, bow, aspect (hex), helix 0..1, cam, fov, lines, fish, dt, time } */
  set(tip, end, o = {}) {
    const dt = o.dt ?? 1 / 60, tension = o.tension ?? 0.2;
    const dist = tip.distanceTo(end);
    this.load = THREE.MathUtils.damp(this.load, tension, 10, dt);
    const T = this.load;
    // the slack: told is told (straight at 0, at once); untold, a limp line's own, none once loaded, and a bow's (W) on top of it
    let slack;
    if (o.slack != null) slack = Math.max(0, o.slack);
    else {
      const own = (1 - sm(0.12, LINE.loaded, T)) * (0.08 + dist * 0.02);
      const bow = (o.bow ?? 0) * (0.25 + dist * 0.03);
      const want = Math.max(own, bow);
      this.slack = THREE.MathUtils.damp(this.slack, want, want < this.slack ? 14 : 6, dt); // (drawn taut it snaps; it sags slower)
      slack = this.slack < 0.002 ? 0 : this.slack;
    }
    // the colour of the load
    const asp = _c.set(o.aspect ?? 0xffb27a);
    const inBand = sm(BAND[0] - 0.1, BAND[0] + 0.08, T) * (1 - sm(BAND[1] - 0.04, BAND[1] + 0.12, T));
    const warm = sm(BAND[1] - 0.02, 0.98, T), hot = sm(0.98, 1.12, T);
    _g.copy(this.slackCol).lerp(_k.copy(asp).lerp(WHITE, 0.25), inBand).lerp(AMBER, warm).lerp(HOT, hot);
    this.rope.setColor(_g);
    const glowK = Math.max(inBand * 0.55, warm * 0.75, hot);
    const hum = T > 0.9 ? (T - 0.9) * 0.05 : 0; // (over the limit it shivers)
    const helix = o.helix ?? 0;
    // the width, in pixels: a metre of distance holds 2 tan(fov / 2) / lines of them
    const fish = o.fish || null;
    this.fat = THREE.MathUtils.damp(this.fat, fish ? 1 : 0, fish ? 8 : 3, dt);
    const perM = 2 * Math.tan(THREE.MathUtils.degToRad(o.fov ?? 70) / 2) / Math.max(120, o.lines ?? 480);
    const hair = LINE.hairPx * (this.baseR / 0.011);
    const wPx = THREE.MathUtils.lerp(hair, Math.max(hair, LINE.sheathPx), this.fat);
    this.rope.update(dt, tip, end, {
      slack, gravity: 9.5, damp: 0.98, iter: 7,
      helix, helixR: 0.3, coils: Math.max(2, Math.min((dist + slack) / 0.85, this.rope.n / 6.5)), // (a coil needs enough links to look like a coil)
      glow: _g, taut: glowK, cam: o.cam, px: wPx / 2 * perM, rMin: 0.002, rMax: 1, radius: this.baseR,
    });
    if (hum > 0) this.rope.mesh.position.set(Math.sin((o.time ?? 0) * 70) * hum, Math.cos((o.time ?? 0) * 61) * hum, 0);
    else this.rope.mesh.position.set(0, 0, 0);
    this.rope.glow.position.copy(this.rope.mesh.position);
    // the core: the fish's stamina, from the hook back toward the rod, pulsing with its tail
    if (fish && this.fat > 0.05 && o.cam) {
      const st = THREE.MathUtils.clamp(fish.stamina ?? 1, 0, 1), beat = THREE.MathUtils.clamp(fish.beat ?? 0, 0, 1);
      const run = Math.max(0.025, st) * this.fat; // (spent: a bead at the hook)
      const px = LINE.corePx * (1 + 0.6 * beat) * this.fat / 2 * perM;
      this.core.trace(this.rope, 1 - run, 1, { cam: o.cam, px, lift: wPx / 2 * perM * 1.15 });
      this.core.setColor(_k.copy(asp).lerp(WHITE, 0.7).multiplyScalar(0.8 + 0.5 * beat));
      this.core.mesh.position.copy(this.rope.mesh.position);
    } else this.core.hide();
  }
}
