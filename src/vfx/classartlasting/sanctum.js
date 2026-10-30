// ---------------------------------------------------------------------------------------
// SANCTUM'S WARD: the Hierophant's circle (Petra's runtime, courier/classarts/lasting.js `sanctum`: its `at` and `r`, nothing outside it
// let in) drawn as the house's ward, the god hand's own (vfx/godhand/marks.js: the written circle with its heptagram, and its wall, the low
// curtain of strokes standing on it), in the Pentacles' gold, laid over the ground it stands on (each point of it set on the ground by
// a ray: the god hand drapes over its matter, this over whatever floor there is). Its dome and the motes rising inside it are the
// library's `art.sanctum.hold`; where a creature is set back at its rim, the wall flares there (`art.sanctum.turn`).
//
// Prior art: the house's ward (the grimoires' magic circle, the Lesser Key's double ring with its band of names, the heptagram of the
// seven), Diablo's sanctuary circles, the protective circle of folk magic that a spirit may not cross.
//
//   const W = new SanctumWard(game, at, r, ctx)   W.update(dt, on, shown) -> false once it has faded   W.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { circleMark, wardWall, disposeTree } from '../godhand/marks.js';
import { SUIT_LOOK } from '../readingview.js';
import { groundY, envelope, zoneFree } from './kit.js';

/** The ward's numbers: its circle's and its wall's strength, the wall's height (m), how near its rim a creature counts as set back
 *  (m), and how often one creature's flare may come again (real s). */
export const WARD = { circle: 0.7, wall: 0.42, h: 1.1, rim: 0.12, again: 0.5, spin: 0.06 };
const _d = new THREE.Vector3();

/** A mesh's vertices laid on the ground (`lift` m over it), its local space round `at`; a wall's top ring (its uv's v over a half) kept
 *  `h` over its foot. */
function drape(game, mesh, at, lift, h = 0) {
  const P = mesh.geometry.attributes.position, U = mesh.geometry.attributes.uv, cache = new Map();
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), z = P.getZ(i), key = `${x.toFixed(2)},${z.toFixed(2)}`;
    let y = cache.get(key); if (y === undefined) { y = groundY(game, at.x + x, at.z + z, at.y) - at.y; cache.set(key, y); }
    P.setY(i, y + lift + (h && U && U.getY(i) > 0.5 ? h : 0));
  }
  P.needsUpdate = true; mesh.geometry.computeBoundingSphere();
}

export class SanctumWard {
  constructor(game, at, r, ctx = {}) {
    this.game = game; this.at = at.clone(); this.r = r; this.ctx = ctx; this.k = 0; this.t = 0; this.flared = new WeakMap();
    const colour = SUIT_LOOK[ctx.suit] ?? SUIT_LOOK.pentacles;
    this.circle = circleMark(game, this.at, r, colour, { style: 'ward', drape: true, opacity: 0, lift: 0.06 });
    drape(game, this.circle, this.at, 0.06); this.circle.position.y = this.at.y;
    this.circle.material.map = this.circle.material.map.clone(); this.circle.material.map.center.set(0.5, 0.5); // (its own turn of the ward's one texture)
    this.wall = wardWall(game, this.at, r, colour, WARD.h); this.wall.material.opacity = 0;
    drape(game, this.wall, this.at, 0.02, WARD.h); this.circle.add(this.wall);
    this.circle.userData.moodExempt = true; this.wall.userData.moodExempt = true;
    game.scene.add(zoneFree(this.circle));
  }
  update(dt, on, shown) {
    this.t += dt; this.k = envelope(this.k, on, dt, 0.45, 0.6);
    this.circle.material.opacity = WARD.circle * this.k; this.wall.material.opacity = WARD.wall * this.k * (0.85 + 0.15 * Math.sin(this.t * 1.6));
    this.circle.material.map.rotation = this.t * WARD.spin;
    this.circle.visible = shown && this.k > 0.01;
    if (on && shown) this.rim();
    if (!on && this.k <= 0) { this.dispose(); return false; }
    return true;
  }
  /** A creature set back on the rim (the runtime holds it at r + its radius): the wall flares there, once a beat for each. */
  rim() {
    const g = this.game, A = this.at;
    for (const c of g.creatures?.near?.(A, this.r + 2) || []) {
      if (!c.alive || c.ally) continue;
      const n = Math.hypot(c.pos.x - A.x, c.pos.z - A.z), rim = this.r + (c.radius ?? 0.5);
      if (Math.abs(n - rim) > WARD.rim || (this.flared.get(c) ?? -9) > this.t - WARD.again) continue;
      this.flared.set(c, this.t);
      _d.set(c.pos.x - A.x, 0, c.pos.z - A.z).normalize();
      const at = new THREE.Vector3(A.x + _d.x * this.r, 0, A.z + _d.z * this.r); at.y = groundY(g, at.x, at.z, c.pos.y);
      g.vfx?.play?.('art.sanctum.turn', { ...this.ctx, pos: at, dir: _d.clone(), normal: new THREE.Vector3(0, 1, 0), floor: at.y });
    }
  }
  dispose() { if (this.dead) return; this.dead = true; this.circle.material.map.dispose(); disposeTree(this.circle); }
}
