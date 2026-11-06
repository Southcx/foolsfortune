// ---------------------------------------------------------------------------------------
// THE WAVE POOL'S LOOK (plain name; docs/ref/WAVE-RIDING.md 4's screen and 5; South, 2026-11-06: "use performant and fancy techniques
// for wave rendering", the centrepiece the feeling of going through a wave barrel). The Raceway park's wave pool drawn from the one
// water function the board rides (world/raceway/surf/wavepool.js): built when the park is dressed, taken down with it, drawn only near
// the pool. Its parts, a module each:
//   water.js         the surface: a near grid in the wave's frame round the break point (snapped, so it never swims) over a far grid
//                    of the basin, displaced and lit on the GPU (Beer-Lambert on the analytic column, Fresnel to the sky, the face's
//                    translucency, the tube's shade, cartoon foam on the ported mask, the swell's glints)
//   lip.js           the curl over the barrel: the pool's `lipCurve` swept along the crest on the GPU, lit through from inside
//   spray.js         the lip's sheet, the foam ball, the rail's spray, the spit, the slope's sand (library effects: effects.js)
//   barrelscreen.js  the vignette, the streaks and the spit's burst on the frame while the lip covers you
//   basin.js         the coping, the walls, the beach, the rail and the foil's car
// The clock and the pool are the surf ride's when it is there (`game.raceway.surf`: `.t`, `.S`), else its own (the same function,
// the same cycle): the look never waits on the ride. The board's barrel is `skiff.surf` (`cover`, `k`) while it rides, else the camera's own test.
//
// Cost (the desk, measured: see the round's report): 4 draws and their outline (the near water, the far water, the lip, the basin, the
// car); the near grid about 97k triangles (0.35 m), the far 11k, the lip 3k; a lean machine (a phone, a tier below High) the same
// shaders on coarser grids (0.7 m and 5 m) and fewer particles (CLAUDE.md: the desk's look is never cut for the phone).
//
// Prior art: Horizon Forbidden West's water (Guerrilla, SIGGRAPH 2022), Sea of Thieves (Rare, SIGGRAPH 2018), Wind Waker, GPU Gems
// ch. 1, DICE's translucency (GDC 2011), Kelly Slater's Surf Ranch; each module's header names what it took.
//
//   game.wavePoolLook = new WavePoolLook(game)   (boot/tools.js; a 'marks' system on the raw clock)   .update(raw)   .dress(R)
//   .undress()   .near (shown now)   .t   .S   .nearBreak(worldPos) -> m
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { wavePool, uniformsOf } from '../../world/raceway/surf/wavepool.js';
import { RW } from '../../world/raceway/track.js';
import { WavePoolWater } from './water.js';
import { WavePoolLip } from './lip.js';
import { WavePoolBasin } from './basin.js';
import { WaveSpray, lipTip } from './spray.js';
import { BarrelScreen } from './barrelscreen.js';

/** Drawn while the camera is within this of the basin's edge (m); the board's barrel test's height over the board (m). */
export const WAVE_POOL_LOOK = { reach: 900, eye: 1.1 };

const _c = new THREE.Vector3(), _m = new THREE.Vector3();
export class WavePoolLook {
  constructor(game) {
    this.game = game; this.R = null; this.group = null; this.parts = null; this.near = false; this.t = 0; this.own = wavePool(); this.S = this.own;
    this.U = { uWP: { value: Array.from({ length: 7 }, () => new THREE.Vector4()) }, uSun: { value: new THREE.Vector3(0.35, 0.9, -0.25) }, uSunC: { value: new THREE.Vector3(1, 0.95, 0.85) },
      uRW: { value: new THREE.Vector3(RW.x, RW.y, RW.z) }, uTime: { value: 0 }, uDay: { value: 1 } };
    this.wp = uniformsOf(this.S, 0);
    this.screen = new BarrelScreen(game);
    game.events?.on('raceway.enter', () => { const R = game.raceway; if (R?.built && this.R !== R) this.dress(R); });
  }
  lean() { const g = this.game.graphics; return !!g?.machine?.mobile || (g?.tier && g.tier !== 'high'); }

  dress(R) {
    this.undress(); this.R = R;
    const g = this.game, S = this.S, lean = this.lean();
    this.group = new THREE.Group(); this.group.name = 'wavepool-look'; this.group.userData.zone = 'raceway';
    const water = new WavePoolWater(g, { U: this.U, pool: S, lean }), lip = new WavePoolLip(g, { U: this.U, lean }), basin = new WavePoolBasin(g, S, R);
    this.group.add(water.near, water.far, lip.mesh, basin.static, basin.car);
    (g.scene).add(this.group);
    this.parts = { water, lip, basin, spray: new WaveSpray(g, this), lean };
    if (R?.onRelease && this.hooked !== R) { this.hooked = R; R.onRelease(() => this.undress()); }
    return this;
  }
  undress() {
    if (!this.parts) { this.R = null; return; }
    const P = this.parts; P.spray.dispose(); P.water.dispose(); P.lip.dispose(); P.basin.dispose();
    this.group?.parent?.remove(this.group); this.group = null; this.parts = null; this.R = null; this.near = false;
    this.screen.update(1, { cover: 0 });
  }

  /** How far a world point is from the pool's break point (m), the spray's reach. */
  nearBreak(p) {
    const st = this.S.state(this.t), P = this.S.POOL, ax = this.S.axes, du = st.ub - P.L / 2, dv = P.vb - P.W / 2;
    return Math.hypot(p.x - (RW.x + P.x + du * ax.ux + dv * ax.vx), p.z - (RW.z + P.z + du * ax.uz + dv * ax.vz));
  }
  /** How far the camera is from the basin (0 inside it). */
  reachOf(cam) {
    const P = this.S.POOL, lx = cam.x - RW.x, lz = cam.z - RW.z, u = this.S.toU(lx, lz), v = this.S.toV(lx, lz);
    return Math.hypot(Math.max(0, -u, u - P.L), Math.max(0, -P.beach - 20 - v, v - P.W));
  }

  update(raw) {
    const g = this.game, R = g.raceway;
    if (R?.built && R.active !== false && this.R !== R) this.dress(R);
    const surf = R?.surf;
    this.S = surf?.S || surf?.pool || this.own; // (surf/surfpool.js keeps the pool as `.S`)
    this.t = Number.isFinite(surf?.t) ? surf.t : this.t + raw;
    const cam = g.camera, P = this.parts;
    this.near = !!(P && cam && R?.built && R.active !== false && this.reachOf(cam.position) < WAVE_POOL_LOOK.reach);
    if (this.group) this.group.visible = this.near;
    const board = this.board();
    this.screen.update(raw, board);
    if (!this.near) return;
    // the uniforms: the pool's state at its clock, the sun and the day's light
    uniformsOf(this.S, this.t, this.wp);
    const W = this.U.uWP.value; for (const [i, k] of ['a', 'b', 'c', 'd', 'e', 'f', 'g'].entries()) W[i].fromArray(this.wp[k]);
    this.U.uTime.value = this.t;
    const sun = g.present?.sun;
    if (sun) { this.U.uSun.value.subVectors(sun.position, sun.target?.position || _c.set(0, 0, 0)).normalize(); this.U.uSunC.value.set(sun.color.r, sun.color.g, sun.color.b).multiplyScalar(Math.min(1.6, sun.intensity * 0.45)); }
    this.U.uDay.value = g.daylight?.k?.day ?? 1;
    P.water.place(this.S, this.t); P.basin.place(this.S, this.t);
    P.spray.update(raw, this.S, this.t, P.lean);
  }

  /** The barrel as the screen wants it: the surf ride's cover and depth when it says, else the camera's own test; the mouth's point. */
  board() {
    const g = this.game, sk = g.player?.techs?.get?.('skiff'), sf = sk?.surf, cam = g.camera;
    if (!this.near || !cam) return { cover: 0, k: 0, mouth: null };
    let cover = 0, k = 0;
    if (sk?.active && sf && Number.isFinite(sf.cover)) { cover = sf.cover; k = sf.k ?? 0; } // (the board's, while it rides)
    else {
      const lx = cam.position.x - RW.x, lz = cam.position.z - RW.z, b = this.S.barrelAt(lx, cam.position.y - RW.y - WAVE_POOL_LOOK.eye, lz, this.t);
      cover = b.cover; k = b.k;
    }
    const m = cover > 0 ? lipTip(this.S, this.t, 1, 0, _m) : null;
    if (m) m.add(_c.set(m.travel[0] * m.F * 0.5, -m.H * 0.45, m.travel[1] * m.F * 0.5));
    return { cover, k, mouth: m };
  }

  dispose() { this.undress(); this.screen.dispose(); }
}
