import { V3, lerp, smooth } from './authoring.js';

// ---------------------------------------------------------------------------------------
// THE SURFER'S OWN ANIMATIONS. Nothing in the free libraries stands a body sideways on a sailing
// board (UAL and CMU have no sailing, surfing or skiff clips; the nearest, a crouch and a slide, read as
// a duck-walk on a deck), so these are authored, once at startup, with the same key-pose author the
// ladder and the rest use (authoring.js): the IK is solved here, offline of play, against the
// exact deck and rope the Skiff has, and stored as ordinary clips. At runtime nothing is solved: the
// rider is a rigid part of the skiff (character.js places the root in the skiff's frame) and these are
// blended by what the board is doing (surfer.js).
//
// Body space, as in authoring.js: root at the feet, +Z is the way the rider faces (out over the
// starboard side), +X is the rider's left, which is the way the bow points. The front foot is the left.
// The sheet (the rope from the boom) is held in front of the chest, left hand high, right hand low.
//
//   surfIdle    at rest: knees soft, weight even, a slow breath, looking along the bow
//   surfRide    under way: lower, leaning back against the sail, arms out
//   surfHoist   hauling the sail up hand over hand (played by how far it is up)
//   surfBrake   sail let out, weight back on the rear foot, hauling the sheet in to stop
//   surfCrouch  the springs charging for a hop, and the landing
//   surfAir     knees tucked for the air
// ---------------------------------------------------------------------------------------
export function authorSurf(A, ch) {
  const ah = ch.ankleRest;
  /** One key pose. o: crouch (m, hips down), lean (deg, back), twist, look (deg toward the bow), wide, lift (m, both feet), hl / hr (palm positions). */
  const pose = function (o) {
    this.hips(o.hx || 0, -o.crouch, o.hz || 0);
    this.chain([['spine001', 0.34], ['spine002', 0.33], ['spine003', 0.33]], 'x', -o.lean);
    this.chain([['spine001', 0.2], ['spine002', 0.3], ['spine003', 0.5]], 'y', o.twist);
    this.chain([['spine004', 0.5], ['head', 0.5]], 'y', o.look);
    this.chain([['spine004', 0.5], ['head', 0.5]], 'x', o.nod || 0);
    const l = o.liftL ?? o.lift ?? 0, r = o.liftR ?? o.lift ?? 0;
    const fl = V3(o.wide, ah + l, 0.02), fr = V3(-o.wide * 0.92, ah + r, -0.02);
    this.foot('L', fl, fl.clone().add(V3(0.12, 0.42 + l, 0.85)), V3(0.08, 0, 1), l > 0 ? -10 : 0);
    this.foot('R', fr, fr.clone().add(V3(-0.12, 0.42 + r, 0.85)), V3(-0.08, 0, 1), r > 0 ? -10 : 0);
    const grip = (side, p, out) => {
      this.hand(side, p, p.clone().add(V3(out * 0.32, -0.12, -0.38)), V3(0, -0.2, 1), V3(0, -1, 0.15));
      this.curl(side, 0.85);
    };
    grip('L', o.hl, 1); grip('R', o.hr, -1);
  };

  const idle = function (u) {
    const b = Math.sin(u * Math.PI * 2);
    pose.call(this, { crouch: 0.12 + b * 0.008, lean: 8 + b * 0.8, twist: 22, look: 60, wide: 0.38, hl: V3(0.1, 1.12 + b * 0.006, 0.36), hr: V3(-0.12, 0.88, 0.32) });
  };
  A.clip('surfIdle', { dur: 2.6, loop: true, base: 'idle', build: idle });

  A.clip('surfRide', {
    dur: 1.4, loop: true, base: 'idle',
    build(u) {
      const b = Math.sin(u * Math.PI * 2);
      pose.call(this, { crouch: 0.22 + b * 0.01, lean: 15 + b * 0.8, twist: 26, look: 66, wide: 0.42, hl: V3(0.08, 1.16, 0.5), hr: V3(-0.14, 0.92 + b * 0.005, 0.44) });
    },
  });

  // hauling the sail up: hand over hand on the halyard, a pull for each half cycle, the body sinking into each pull
  A.clip('surfHoist', {
    dur: 1.0, loop: true, base: 'idle',
    build(u) {
      const h = (u * 2) % 1, e = smooth(0, 1, h), first = u < 0.5;
      const pull = Math.sin(Math.PI * h);
      const yPull = lerp(1.5, 0.9, e), yReach = lerp(0.9, 1.5, e);
      const yl = first ? yPull : yReach, yr = first ? yReach : yPull;
      pose.call(this, { crouch: 0.14 + 0.07 * pull, lean: 12 + 8 * pull, twist: 18, look: 40, nod: -14, wide: 0.4, hl: V3(0.1, yl, 0.34), hr: V3(-0.1, yr, 0.34) });
    },
  });

  A.clip('surfBrake', {
    dur: 1.0, loop: true, base: 'idle',
    build(u) {
      const b = Math.sin(u * Math.PI * 2);
      pose.call(this, { crouch: 0.2, lean: 28 + b * 0.6, twist: 20, look: 55, wide: 0.44, hx: -0.06, hl: V3(0.1, 0.92, 0.28), hr: V3(-0.12, 0.78, 0.22) });
    },
  });

  A.clip('surfCrouch', {
    dur: 0.6, loop: true, base: 'idle',
    build() {
      pose.call(this, { crouch: 0.4, lean: -10, twist: 16, look: 50, wide: 0.46, hl: V3(0.16, 0.78, 0.44), hr: V3(-0.16, 0.64, 0.38) });
    },
  });

  A.clip('surfAir', {
    dur: 1.2, loop: true, base: 'idle',
    build(u) {
      const b = Math.sin(u * Math.PI * 2);
      pose.call(this, { crouch: 0.02, lean: 8, twist: 20, look: 55, wide: 0.34, liftL: 0.3 + b * 0.015, liftR: 0.24 - b * 0.015, hl: V3(0.1, 1.16, 0.5), hr: V3(-0.14, 0.94, 0.44) });
    },
  });
}
