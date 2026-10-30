// ---------------------------------------------------------------------------------------
// WHAT A CLASS ART LEAVES, DRAWN: the class arts whose work outlasts their press (Petra's runtime, courier/classarts/body.js and lasting.js,
// read from `game.classArtsRun` each frame and never written) dressed as things in the world, over the library's effects that
// ClassArtLooks plays on the events (vfx/classartlooks.js, which owns this). Each look is a part here, made when its state appears,
// faded when it goes, taken down when its fade is out:
//   Earth Wall   `walls[]`        the slab as the island's own ground stood on end, strata, a crumbling lip, dust (classartlasting/earthwall.js)
//   Lamp         `lasting` lantern  the lantern the lamp's light hangs from, moths, its throw on the ground (lantern.js)
//   Vanish       `lasting` mirageStep and the mirage's decoy   the smoke Courier (smoke.js)
//   Sanctum      `lasting` sanctum { at, r }   the ward on the ground, its wall, its rim's flares (sanctum.js)
//   Overgrowth   `lasting` bloom { at, r }     the ring of briars and wild rose, the snares at slowed feet (thicket.js)
//   Ride         `lasting` ride and the art.use's target   the bridle, the reins, the calmed eyes, the dust (reins.js)
//   Starlight    `sky` { x, z, r }   the patch of sky above it turned to Wonder: a disc of stars brightened, a faint aurora at its edge,
//                Wonder's starlight falling inside it round the Courier (the library's `art.wish.sky`, `art.wish.motes`)
//   Encore       `lastMove`, art.fire echo { at }   the strike's afterimage and its arc again (encore.js)
//   Hang Time is the library's alone (art.suspend.use / .hold, held while `hangUntil` holds: classartlooks.js HELD_STATE).
// Looks only, no words, no lamps (the Lamp's light is Petra's, lent by the light budget). Hidden where ClassArtLooks hides its own (the god
// hand, the Spirit Garden, a puzzle duel). Its two materials' programs (the shape program's and the stone's) are already the house's; a
// copy of each and of the ward's is shown under the world for the boot's warm-up and kept hidden after, so none compiles in play.
//
// Prior art: Unreal's actor components spawned for a buff and torn down at its end (a look as a lifetime), Niagara's owner-attached
// systems, the house's split of rules from looks (game.godhandLooks over the god powers).
//
//   this.lasting = new ClassArtLasting(game, looks)   (ClassArtLooks's constructor)   .update(dt, shown)   (its update)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { phaseAt } from '../progress/weather.js';
import { mindTick } from './labradorite.js';
import { circleMark, wardWall } from './godhand/marks.js';
import { stoneMat, shapeMat, whiten, envelope } from './classartlasting/kit.js';
import { dressWall } from './classartlasting/earthwall.js';
import { LampLantern } from './classartlasting/lantern.js';
import { SmokeCourier } from './classartlasting/smoke.js';
import { SanctumWard } from './classartlasting/sanctum.js';
import { Thicket } from './classartlasting/thicket.js';
import { RideReins } from './classartlasting/reins.js';
import { EncoreEcho } from './classartlasting/encore.js';

const UP = new THREE.Vector3(0, 1, 0);
/** How bright Starlight's patch is by the hour (its stars are a night's: by day a ghost of them). */
const NIGHT_K = { night: 1, dusk: 0.5, dawn: 0.5, day: 0.12 };

export class ClassArtLasting {
  constructor(game, looks) {
    this.game = game; this.looks = looks; this.t = 0;
    this.walls = new Map(); this.circles = new Map(); this.lantern = null; this.rides = new Map(); this.smokes = []; this.encore = new EncoreEcho(game);
    this.sky = null; this.motes = null; this.skyK = 0; this.wallAt = null; this.rideOf = null; this.skyY = null;
    const E = game.events, mine = (e) => (e?.by ?? 'courier') === 'courier';
    E?.on?.('art.use', (e) => { if (mine(e)) this.use(e); });
    E?.on?.('art.fire', (e) => { if (mine(e) && e.art === 'echo') this.encore.fire(e, looks.shown()); });
    this.park();
  }

  /** The art's context, as ClassArtLooks plays its effects with (its suit and domain). */
  ctx(id) { const R = this.looks.numbers(id), pl = { pos: new THREE.Vector3(), dir: new THREE.Vector3(0, 0, 1), from: new THREE.Vector3(), to: new THREE.Vector3() }; return this.looks.ctx(id, R, pl, !!R?.accented); }

  use(e) {
    const g = this.game;
    if (e.art === 'stronghold') this.wallAt = e.at?.clone?.() ?? null;
    else if (e.art === 'ride' && e.target) this.rideOf = e.target;
    else if (e.art === 'wish') this.skyY = e.at?.y ?? g.player?.pos.y ?? 0;
    else if (e.art === 'echo') this.encore.use(g.classArtsRun);
    else if (e.art === 'mirageStep') {
      const d = g.mirage?.list?.[g.mirage.list.length - 1]; // (the decoy the veil raised this very press: lasting.js veil, tools/crucibelle/mirage.js)
      if (d?.alive && (!e.at || d.pos.distanceTo(e.at) < 0.75) && !this.smokes.some((s) => s.decoy === d)) this.smokes.push(new SmokeCourier(g, d, this.ctx('mirageStep')));
    }
  }

  update(dt, shown) {
    const g = this.game, run = g.classArtsRun; this.t += dt; mindTick();
    if (this.parked && this.t > 0) { this.parked.visible = false; this.parked = null; } // (the warm-up has compiled it: kept, hidden, so its programs live)
    if (!run) return;
    // Earth Wall: each slab dressed once, its lip and dust kept while it stands
    const walls = run.walls || [];
    for (const w of walls) if (!this.walls.has(w) && w.mesh) { this.walls.set(w, dressWall(g, w, this.wallAt)); this.wallAt = null; }
    for (const [w, d] of this.walls) { if (walls.includes(w)) d.update(dt, shown); else { d.dispose(); this.walls.delete(w); } }
    // what is left running: the circles by their entry, the lantern, the ride
    const list = run.lasting || [], here = (x) => list.includes(x); // (a handful at most: no set a frame)
    for (const x of list) {
      if ((x.art === 'sanctum' || x.art === 'bloom') && x.at && !this.circles.has(x)) this.circles.set(x, x.art === 'sanctum' ? new SanctumWard(g, x.at, x.r, this.ctx('sanctum')) : new Thicket(g, x.at, x.r, this.ctx('bloom')));
      if (x.art === 'ride' && this.rideOf && !this.rides.has(x)) { this.rides.set(x, new RideReins(g, this.rideOf, this.ctx('ride'))); this.rideOf = null; }
    }
    for (const [x, look] of this.circles) if (!look.update(dt, here(x), shown)) this.circles.delete(x);
    for (const [x, look] of this.rides) if (!look.update(dt, here(x) && !!look.c.driven, shown)) this.rides.delete(x);
    const lit = list.some((x) => x.art === 'lantern') && (run.lampLit?.() ?? true);
    if (lit && !this.lantern) this.lantern = new LampLantern(g, this.ctx('lantern'));
    if (this.lantern && !this.lantern.update(dt, lit, shown)) this.lantern = null;
    this.smokes = this.smokes.filter((s) => s.update(dt, shown));
    this.encore.update(dt, run, shown);
    this.starlight(dt, run, shown);
  }

  /** Starlight's patch: the sky over it (held at its middle, its radius the effect's scale) and the starlight falling round the Courier
   *  while they stand inside it. */
  starlight(dt, run, shown) {
    const g = this.game, S = run.sky, P = g.player;
    this.skyK = envelope(this.skyK, !!S && shown, dt, 2.5, 1.5);
    if (S && shown && !this.sky?.alive) {
      const ctx = { ...this.ctx('wish'), feeling: 'wonder', scale: (S.r || 40) / 40, pos: new THREE.Vector3(S.x, this.skyY ?? P?.pos.y ?? 0, S.z), dir: new THREE.Vector3(0, 0, 1), normal: UP };
      this.sky = g.vfx?.play?.('art.wish.sky', { ...ctx, follow: (h) => { const T = g.classArtsRun?.sky; if (!T || !this.looks.shown()) return false; h.pos.set(T.x, h.pos.y, T.z); h.k = this.skyK * (NIGHT_K[phaseAt()] ?? 1); return true; } });
      this.motes = g.vfx?.play?.('art.wish.motes', { ...ctx, scale: 1, follow: (h) => {
        const T = g.classArtsRun?.sky, me = P?.renderPos ?? P?.pos; if (!T || !me || !this.looks.shown()) return false;
        h.pos.copy(me); h.k = Math.hypot(me.x - T.x, me.z - T.z) <= T.r ? this.skyK * (NIGHT_K[phaseAt()] ?? 1) : 0; return true;
      } });
    }
  }

  /** A copy of each material this draws in (the stone's, the shape program's, the ward's), shown 50 m under the world for the boot's
   *  warm-up to compile (boot/warmup.js compiles what the scene shows), then hidden for good on the first frame. */
  park() {
    const g = this.game; if (!g.scene) return;
    const P = new THREE.Group(); P.name = 'classart-lasting-parked'; P.position.set(0, -50, 0); P.userData.zoneFree = true;
    const box = new THREE.BoxGeometry(0.1, 0.1, 0.1).toNonIndexed(); box.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(box.attributes.position.count * 3).fill(1), 3));
    P.add(new THREE.Mesh(box, stoneMat()), new THREE.Mesh(whiten(new THREE.BoxGeometry(0.1, 0.1, 0.1)), shapeMat({}).mat));
    const ring = circleMark(g, new THREE.Vector3(), 0.2, 0xffffff, { style: 'ward', drape: false, opacity: 0.01 }); ring.add(wardWall(g, new THREE.Vector3(), 0.2, 0xffffff, 0.1)); P.add(ring);
    P.traverse((o) => { o.frustumCulled = false; o.userData.zoneFree = true; });
    g.scene.add(P); this.parked = P;
  }
}
