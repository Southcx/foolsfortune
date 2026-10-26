// ---------------------------------------------------------------------------------------
// THE RACEWAY (Espada's name; docs/plans/SKIFF-RACING.md sections 5 and 10): the Solar Skiff's test park, built of the Dunes' kit (their
// sand and its shader, their sky and light, their ruin pillars, columns and slip geysers) in a place of its own at the Dunes' layer, far
// east of them (render/zonemap.js 'raceway'). Since round 4 (the owner, 2026-10-14: "quadruple the size ... nest multiple tracks into one
// map ... THE zone where we test ALL of our racing module mechanics") it is a park 2.2 km across: a hub where the Index sets you down,
// and round it three tracks in layers of complexity (the Sun Circuit, the Gorge Run, the Coaster: world/raceway/park.js and tracks/),
// with bridges, lakes, a crater, the antlion pits and a half-pipe between them. The ground is the park's one height function, sampled
// into the same chunked terrain and physics height field the Dunes use; the board reads it through the same few calls it asks of the
// Dunes (active, heightAt, rideHeight, normalAt, wind), so courier/skiff/skiff.js rides it unchanged; rideHeight adds the water it skims
// and the bridge deck it is on. The wind is the course's own: it follows the track the Courier is on (Wind Waker HD's Swift Sail), swung
// off it where the track says. Built the first time it is entered. Raced from each track's start pillar (world/raceway/race.js).
// THE GROUND IS LENT (Petra's measure, v209: the park kept 160 MB after one visit, the gate's heap over budget): its terrain and the
// physics height field (108 MB and 5 of it, measured) are released once the Courier has been gone RELEASE.after real seconds, and built
// again from the kept field (4.5 MB) on the next arrival, under the travel's cover (about 0.8 s in the dev build). The kit, the rails and
// the dressing stay.
// The looks are Calissa's: the sandfalls (vfx/racewaysandfall.js), the plates' glyphs, lamps and gates' marks (vfx/racewaylooks.js),
// the cavern (vfx/racewaycavern.js), the fog.
//
// WHERE THE COURIER IS: `track` the track whose line they are on (the race's while racing; else the nearest, kept until another is nearer
// by a margin), `s` their place on its line, `d` and `lat` from it; `T` is always the Sun Circuit (the looks dressed on it read it).
// THE CAVERN (world/raceway/cavern.js; SKIFF-RACING.md 9): the Sun Circuit's branch into a roofed gorge and back. While the Courier is on it
// `line` is 'cavern', `sb` its place along it, `d` and `lat` from its line, and `s` the place on the line it stands for (the race's gates
// and ghost read `s` as ever); through it whole, raceway.branch { branch, by }.
//
// Prior art: the test tracks of racing games (Gran Turismo's licence courses, MK8's Time Trial), Burnout Paradise's and Kirby Air Ride's
// City Trial's one map of many tests; Motorstorm's and SSX's courses cut into open ground; the Dunes themselves (world/dunes/dunes.js).
//
//   game.raceway = new Raceway(game)   .active   .heightAt(x, z)   .rideHeight(x, z)   .normalAt   .wind   .tracks   .track   .s   .d   .lat
//   .gaps (gaps.js)   .buoys (buoys.js)   .line ('main' | 'cavern')   .sb   .sun (0..1)   .condition (conditions.js)   .edgeLines(step, line?, trackId?) -> [{ side, pts, hide }]
//   .plateAt(pos) -> plate | null (a vein lane's has `lane`)   .nearThings(pos) -> [{ key, x, y, z, r, what }]   .glideAt(pos) -> bool   .rails   .rings   .pillars   .arrive()   .respawn(s?)   .update(dt)   .T (the Sun Circuit)
//   .build()   .teardown() (render/areas.js stage 2: boot/services.js registers the pair)   .prepare(ms) -> bool   .fieldProgress (the field behind a cover)   .buildGround()   .releaseGround()   .onRelease(fn) (told when the ground is given back)   .pick(ray) -> { x, z, y } park-local | null
//   .made (a made track on the build lot: madetrack.js)   .traps (the traps of the track that has them now: traps.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { ChunkTerrain } from '../../render/terrain.js';
import { Barrier } from '../dunes/barrier.js';
import { RW, BRANCH } from './track.js';
import { park } from './park.js';
import { buildRails, buildRings, flyRings } from './railsrings.js';
import { buildCavern } from './cavern.js';
import { buildKit, buildMarks, GEYSER, nearThings } from './kit.js';
import { buildDecks, deckAt, buildWater, buildPits, stepPits } from './features.js';
import { conditionAt } from './conditions.js';
import { fieldOf, fieldJob } from './parkfield.js';
import { Gaps } from './gaps.js';
import { Buoys } from './buoys.js';
import { Siphons } from './siphons.js';
import { MadeTrack } from './madetrack.js';
import { Traps } from './traps.js';
import { markWorld, ownedSince, takeAway } from '../areaown.js';

const WIND = { speed: 8 }; // (the course wind's strength; its way is the track's, turned by the track's own angle)
const OFF = { far: 40, secs: 3 }; // (metres past a track's edge, and real seconds there, before the board is set back on the track)
const PREFETCH_AFTER = 12; // (real seconds after the Raceway is made (at boot) before its field is worked out in a worker)
const RELEASE = { after: 10 }; // (real seconds away before the ground is given back: a respawn or a short trip out never rebuilds it)
const KEEP = 12; // (metres nearer another track's line must be before the Courier is counted on it: no flicker where two run close)

export class Raceway {
  constructor(game) {
    this.game = game;
    this.P = park();
    this.tracks = this.P.tracks; this.T = this.P.track('sun'); this.track = this.T;
    this.s = this.T.line; this.d = 0; this.lat = 0; this.offT = 0; this.line = 'main'; this.sb = 0; this.branchIn = false;
    this.sun = 1; this.condition = null; this.condT = 0; this.pitT = 0;
    this.wind = { dir: new THREE.Vector2(1, 0), speed: WIND.speed, gust: 1 };
    this.built = false; this.releasers = [];
    this.made = new MadeTrack(this); this.traps = new Traps(this); // (a made track on the build lot, and its traps: TRACK-EDITOR.md; madetrack.js, traps.js)
    this.gaps = new Gaps(this); this.buoys = new Buoys(this); this.siphons = new Siphons(this); // (the named jumps, the buoy runs, the siphons: gaps.js, buoys.js, siphons.js)
    this.geysers = []; this.plates = []; this.rails = []; this.rings = []; this.decks = []; this.pits = []; this.sandfalls = []; this.pillars = [];
    const F = this.T.frame(this.T.line);
    this.startPillar = this.local(F.x + F.fz * (F.w + 7), F.z - F.fx * (F.w + 7)); // (the Sun Circuit's: left of its line, beyond the berm)
    if (typeof setTimeout !== 'undefined') setTimeout(() => this.prefetch(), PREFETCH_AFTER * 1000); // (the field worked out in idle time once the boot has settled)
  }
  get center() { return new THREE.Vector3(RW.x, RW.y, RW.z); }
  /** A local point (metres from the Raceway's middle) on the ground, in the world. */
  local(lx, lz) { const x = RW.x + lx, z = RW.z + lz; return new THREE.Vector3(x, this.heightAt(x, z), z); }
  /** Is the Courier here? */
  get active() { const p = this.game.player?.pos; if (!p) return false; return Math.abs(p.x - RW.x) < RW.half + 60 && Math.abs(p.z - RW.z) < RW.half + 60 && p.y < -150 && p.y > -600; }
  /** The track the race runs on, or the one the Courier is on. */
  trackOf(id) { return id === 'made' ? this.made.T : this.P.track(id); }

  /** World height of the ground at world x, z: the field's own samples where it is built (what is drawn and collided), else the function. */
  heightAt(x, z) {
    const lx = x - RW.x, lz = z - RW.z, G = this.grid;
    if (!G || Math.abs(lx) >= RW.half || Math.abs(lz) >= RW.half) return RW.y + (this.made.heightAt(lx, lz) ?? this.P.heightAt(lx, lz)); // (a made track's ground over the lot: madetrack.js)
    const fx = (lx + RW.half) / RW.step, fz = (lz + RW.half) / RW.step, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, n = G.n, H = G.heights;
    const h00 = H[i * n + j], h10 = H[(i + 1) * n + j], h01 = H[i * n + j + 1], h11 = H[(i + 1) * n + j + 1];
    return RW.y + (h00 * (1 - u) + h10 * u) * (1 - v) + (h01 * (1 - u) + h11 * u) * v; // (a made track's ground is written into these over the lot: madetrack.js reshape)
  }
  /** The height a board rides at: the ground, the water over it (the lakes, the fords: skimmed), or the bridge deck the Courier is on. */
  rideHeight(x, z) {
    let h = this.heightAt(x, z);
    const w = this.P.waterAt(x - RW.x, z - RW.z); if (w != null) h = Math.max(h, RW.y + w);
    if (this.decks.length) { const top = deckAt(this, x, z, this.game.player?.pos.y ?? -1e9); if (top != null) h = Math.max(h, top); }
    return h;
  }
  normalAt(x, z, out = new THREE.Vector3()) {
    const e = 0.7, hx = this.heightAt(x + e, z) - this.heightAt(x - e, z), hz = this.heightAt(x, z + e) - this.heightAt(x, z - e);
    return out.set(-hx / (2 * e), 1, -hz / (2 * e)).normalize();
  }
  /** Where a ray from the camera meets the ground (a cursor's pick, the editor's and the haunt's): marched in steps and bisected, as
   *  { x, z, y } park-local, or null if it never comes down within `far` metres. */
  pick(ray, far = 900) {
    const o = ray.origin, d = ray.direction, above = (k) => o.y + d.y * k - this.heightAt(o.x + d.x * k, o.z + d.z * k);
    let a = 0, b = 0; for (let k = 2; k <= far; k += 2) { if (above(k) <= 0) { a = k - 2; b = k; break; } } if (!b) return null;
    for (let i = 0; i < 14; i++) { const m = (a + b) / 2; if (above(m) > 0) a = m; else b = m; }
    const k = (a + b) / 2; return { x: o.x + d.x * k - RW.x, z: o.z + d.z * k - RW.z, y: o.y + d.y * k - RW.y };
  }
  /** Where on a track's line s is, in the world, and which way it runs (yaw, as the Courier's: atan2(fx, fz)). */
  at(s, T = this.track) { const F = T.frame(s); return { pos: this.local(F.x, F.z), yaw: Math.atan2(F.fx, F.fz), w: F.w }; }

  // ------------------------------------------------------------------ built the first time it is entered
  build() {
    if (this.built) return; this.built = true;
    const g = this.game, P = this.P, ms = (this.buildMs = {}), lap = (k, t0) => { ms[k] = Math.round(performance.now() - t0); return performance.now(); };
    const mark = markWorld(g); // (what stood before: the build's own is what is new after, AREAS.md A1: world/areaown.js)
    let t = performance.now();
    this.buildGround(); t = lap('terrain', t);
    this.barrier = new Barrier(g, { center: this.center, radius: RW.edge, y0: RW.y - 120, y1: RW.y + 300 });
    t = lap('barrier', t);
    this.rails = buildRails(this); this.rings = buildRings(this); t = lap('rails', t); // (the grind's rails, the coaster rails and the sun rings: railsrings.js; before the kit, which keeps its columns off them)
    buildKit(this); buildMarks(this); t = lap('kit', t); // (every track's furniture: kit.js)
    this.decks = buildDecks(this); buildWater(this); this.pits = buildPits(this); t = lap('features', t); // (the bridges, the water, the antlion pits: features.js)
    this.cavern = buildCavern(this); t = lap('cavern', t); // (its roof, stalactites and crystals: world/raceway/cavern.js)
    this.buoys.build(); this.siphons.build(); t = lap('buoys', t); // (the buoy runs' poles and floats, the siphons' arches: buoys.js, siphons.js)
    // what the build put in the world (before Calissa's looks dress it: those come and go by her own release), kept so the teardown takes exactly that away (the ground's own terrain and body are releaseGround's)
    this.owned = ownedSince(g, mark, { skip: [this.terrain], skipBodies: [this.groundBody] });
    g.racewayLooks?.dress(this); t = lap('looks', t); // (Calissa's: the sun plates' glyphs, the arch's lamps, the gates' marks; the slabs hidden)
  }
  /** The park torn down (render/areas.js, stage 2: AREAS.md A1), a few real seconds after the camera and its neighbours leave: the ground
   *  given back (its releasers told, so every look that dresses the park undresses; Calissa's race-day dressing is taken down beside
   *  this in boot/services.js), and every object, body and collider the build put in the world taken out, their geometry and the
   *  materials nothing left in the scene still uses disposed (world/areaown.js). The tracks, the field, the bests and a made track stay (they are data); built again on the next arrival. */
  teardown() {
    if (!this.built) return;
    const g = this.game;
    if (g.race?.running) g.race.end?.('left');
    this.releaseGround(); this.awayT = 0;
    takeAway(g, this.owned);
    this.owned = null; this.barrier = null; this.cavern = null; this.siphons.on = null; this.buoys.group = null;
    this.geysers = []; this.plates = []; this.rails = []; this.rings = []; this.decks = []; this.pits = []; this.sandfalls = []; this.pillars = [];
    this.built = false;
  }
  /** The ground: the terrain on the field's heights (the field worked out in idle time after boot, prefetch: parkfield.js, or here) and
   *  its physics height field. Built at the first visit and again after each release. */
  buildGround() {
    if (this.chunks) return;
    const g = this.game, P = this.P, t0 = performance.now();
    const field = this.field || (this.fieldJob && this.fieldJob.step(() => true) ? this.fieldJob.field : fieldOf(P)); this.field = field; // (the prefetch's rows kept: only what is left is worked)
    const N = field.n, onGrid = (x, z) => { const fi = (x + RW.half) / RW.step, fj = (z + RW.half) / RW.step, i = Math.round(fi), j = Math.round(fj); return Math.abs(fi - i) < 1e-4 && Math.abs(fj - j) < 1e-4 && i >= 0 && j >= 0 && i < N && j < N ? field.h[j * N + i] : P.heightAt(x, z); };
    // the Dunes' own sand material on a field of this place's heights, and its height field to stand on
    const mat = g.dunes?.terrain?.material || new THREE.MeshStandardMaterial({ color: 0xe8b070, roughness: 0.92 });
    const TR = (this.chunks = new ChunkTerrain({ height: onGrid, half: RW.half, step: RW.step, chunk: 32, outer: RW.outer, outerStep: 20, material: mat }));
    this.grid = { n: TR.n, heights: TR.heights };
    const mesh = (this.terrain = TR.mesh); mesh.position.set(RW.x, RW.y, RW.z); mesh.receiveShadow = true; mesh.userData.zone = 'raceway'; g.scene.add(mesh);
    this.groundBody = g.physics.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(RW.x, RW.y, RW.z));
    g.physics.world.createCollider(RAPIER.ColliderDesc.heightfield(TR.n - 1, TR.n - 1, TR.heights, { x: RW.half * 2, y: 1, z: RW.half * 2 }).setFriction(0.9).setCollisionGroups(GROUPS.static), this.groundBody);
    this.groundMs = Math.round(performance.now() - t0); this.awayT = 0;
    if (this.made.T) this.made.reshape(); // (the lot's ground to the made track again: the field kept is the park's own)
  }
  /** The ground given back: the terrain's arrays and GPU buffers and the height field's body; the field is kept, for the next arrival. */
  releaseGround() {
    if (!this.chunks) return;
    const g = this.game;
    g.scene.remove(this.terrain); this.chunks.geometry.dispose();
    if (this.groundBody) g.physics.world.removeRigidBody(this.groundBody);
    this.chunks = null; this.terrain = null; this.grid = null; this.groundBody = null;
    for (const f of this.releasers) f(this); // (what dressed the park gives back its own: built again on its next active frame)
  }
  /** Ask to be told when the park's ground is given back (a look that dresses the park releases its own then). */
  onRelease(f) { this.releasers.push(f); }
  /** Work the field out in the idle time between frames, once the game has booted (it is the same function: parkfield.js), so the first
   *  trip here finds it ready (Petra's v198 measure: 4.5 s inside the travel). A few rows a slice, never past the frame's idle time. */
  prefetch() {
    if (this.field || this.fieldJob) return;
    const job = (this.fieldJob = fieldJob(this.P));
    const idle = typeof requestIdleCallback === 'function' ? (f) => requestIdleCallback(f, { timeout: 1000 }) : (f) => setTimeout(() => f({ timeRemaining: () => 4 }), 50);
    const slice = (dl) => { if (this.field) return; if (job.step(() => dl.timeRemaining() > 1)) { this.field = job.field; this.fieldFrom = 'idle'; } else idle(slice); };
    idle(slice);
  }
  /** The field finished behind a cover (the area wipe's hold: Petra's seam), `ms` real milliseconds a call, so an arrival before the
   *  idle prefetch is done never works the rest at once (the iPhone XR's lost graphics, v283: CASEBOOK NEW:memory-bound-by-view).
   *  True once the field is whole; `.fieldProgress` (0..1) fills the wipe's thread. arrive() needs nothing of it: it works what is
   *  left at once, as before. */
  prepare(ms = 12) {
    if (this.field) return true;
    if (!this.fieldJob) this.prefetch();
    const end = performance.now() + ms, job = this.fieldJob;
    if (job.step(() => performance.now() < end)) { this.field = job.field; this.fieldFrom = this.fieldFrom || 'cover'; }
    return !!this.field;
  }
  get fieldProgress() { return this.field ? 1 : this.fieldJob?.progress ?? 0; }

  /** A track's two edges as world points every `step` metres, a metre over the ground at the running surface's edge: where the edge
   *  strings hang (Calissa's look). [{ side: -1 | 1, pts: [Vector3], hide: Uint8Array }], left then right; `hide` marks the points
   *  that lie where another line's running surface is (the cavern's fork and merge: a string there would cut across the other road). */
  edgeLines(step = 4, line = 'main', trackId = 'sun') {
    const T = this.trackOf(trackId), Bn = line === 'cavern' ? T.branch : null, len = Bn ? Bn.length : T.length, out = [{ side: -1, pts: [], hide: [] }, { side: 1, pts: [], hide: [] }];
    const other = (lx, lz) => { // (on the running surface of the line not drawn: the branch's for the main, the main's for the branch)
      if (Bn) { const n = T.nearest(lx, lz, null, 2); return n && n.d < T.frame(n.s).w + 1.5; }
      const b = T.branch?.nearest(lx, lz); return !!b && b.sb > 1 && b.sb < T.branch.length - 1 && b.d < T.branch.frame(b.sb).w + 1.5;
    };
    for (let s = 0; s < len; s += step) {
      const F = Bn ? Bn.frame(s) : T.frame(s);
      const walled = Bn || F.cut > 0.5 || F.berm > 3; for (const E of out) { const lat = E.side * (walled ? F.w - 1 : F.w + 0.5), lx = F.x - F.fz * lat, lz = F.z + F.fx * lat, p = this.local(lx, lz); p.y += walled ? 1.2 : 1; E.pts.push(p); E.hide.push(other(lx, lz) ? 1 : 0); } // (between walls, the cavern's and a canyon's cut: 1 m inside the floor's edge, where the wall has not begun to rise: Calissa, 2026-10-14; the owner's v198 "jagged in the canyon")
    }
    for (const E of out) E.hide = Uint8Array.from(E.hide);
    return out;
  }

  // ------------------------------------------------------------------ what the board asks
  /** A sun plate under the Courier (riding its stretch of its line, within its width), or null. Its `power` (0..1): a sun plate's the
   *  sun's (conditions.js), a crystal vein's always whole. */
  plateAt(pos) {
    if (!this.plates.length || this.d > 30) return null;
    const T = this.track, L = T.length;
    for (const P of this.plates) {
      if (P.track !== T.id || P.line !== this.line) continue;
      const u = P.line === 'cavern' ? this.sb - P.s0 : ((this.s - P.s0) % L + L) % L;
      if (u >= 0 && u <= P.s1 - P.s0 && Math.abs(this.lat - P.lat) < P.w && pos.y - this.heightAt(pos.x, pos.z) < 2) { P.power = P.vein ? 1 : this.sun * (P.track === 'made' && this.made.def?.rules?.includes('plates2') ? 2 : 1); return P; }
    }
    return null;
  }
  /** What a near miss is counted past, round a point (kit.js). */
  nearThings(pos) { return nearThings(this, pos); }
  /** Over a glide lip's stretch of the track they are on (the wings open by themselves there: MK8's glider ramp)? */
  glideAt() {
    if (this.line !== 'main' || this.d > 40) return false;
    const T = this.track, L = T.length;
    return T.features.glideLips.some((G) => { const s0 = T.sOf(G.cp, G.from); return ((this.s - s0) % L + L) % L <= G.to - G.from; });
  }

  /** Into the Raceway from the Index: set down on foot at the hub, among the tracks' starts. */
  arrive() {
    const g = this.game; this.build(); this.buildGround();
    g.player.killY = RW.y - 120;
    const H = this.P.hub, to = this.local(H.x - 8, H.z - 8);
    to.y += 0.05;
    g.course.teleport(to, Math.atan2(1, 0));
    this.track = this.T; this.s = this.T.line; this.line = 'main'; this.branchIn = false;
    g.events?.emit('raceway.enter', { tracks: this.tracks.map((T) => T.id), by: 'courier' });
  }
  /** Set back on the track at s (or where they are along it: in the cavern, on its branch), mounted, facing along it (MK8's Lakitu). */
  respawn(s, T = this.track) {
    const g = this.game, inCave = s == null && this.line === 'cavern' && T.branch;
    if (s == null) s = this.s;
    let at = this.at(s, T);
    if (inCave) { const F = T.branch.frame(this.sb); at = { pos: this.local(F.x, F.z), yaw: Math.atan2(F.fx, F.fz) }; }
    { const top = this.decks.length ? deckAt(this, at.pos.x, at.pos.z, at.pos.y + 50) : null; if (top != null && T.decks.some((D) => s >= D.s0 && s <= D.s1)) at.pos.y = top; } // (set back on a bridge: on its deck)
    at.pos.y += 0.6;
    g.player.techs?.get?.('skiff')?.combo?.drop('respawn'); // (set back: the chain is lost, as in a bail)
    g.course.teleport(at.pos, at.yaw);
    this.track = T; this.s = s; this.offT = 0; if (!inCave) { this.line = 'main'; this.branchIn = false; }
    g.player.techs?.get?.('skiff')?.mount();
    g.events?.emit('race.respawn', { track: T.id, by: 'courier' });
  }

  // ------------------------------------------------------------------ per frame
  update(dt) {
    if (!this.built) return;
    const g = this.game, cam = g.camera, here = this.active;
    if (here) { this.awayT = 0; this.buildGround(); } // (back by any way but the Index's: built here, a hitch, but never a fall through)
    else if (this.chunks && (this.awayT = (this.awayT || 0) + (g.rawDt ?? dt)) > RELEASE.after) this.releaseGround();
    this.chunks?.update(cam.position.x - RW.x, cam.position.z - RW.z);
    if (!here) return;
    for (const F of this.sandfalls) F.look?.update(dt);
    flyRings(this, dt, this.prevP); (this.prevP ||= new THREE.Vector3()).copy(g.player.pos);
    this.barrier.update(dt);
    stepPits(this, dt);
    this.gaps.update(dt); this.buoys.update(dt); this.siphons.update(dt); this.traps.update(dt);
    const P = g.player, lx = P.pos.x - RW.x, lz = P.pos.z - RW.z;
    // the hour and the weather (conditions.js), read a few times a real second
    if ((this.condT -= dt) <= 0) { this.condT = 0.5; this.condition = conditionAt(g); this.sun = this.condition.sun; }
    const C = this.condition;
    // which track: the race's while racing; else the nearest line, kept until another's is nearer by KEEP metres
    const race = g.race?.running ? g.race.T : null;
    let T = race || this.track, n = (this.d < 60 && this.line === 'main' ? T.nearest(lx, lz, this.s) : null) || T.nearest(lx, lz);
    if (!race) for (const T2 of this.made.T ? [...this.tracks, this.made.T] : this.tracks) { if (T2 === T) continue; const n2 = T2.nearest(lx, lz); if (n2 && (!n || n2.d < n.d - KEEP)) { T = T2; n = n2; } }
    if (T !== this.track) { this.track = T; this.line = 'main'; this.branchIn = false; }
    // on the cavern's branch when they are nearer its line than the circuit's (by 3 m: no flicker where the two run as one at the fork and merge)
    const Bn = T.branch, nb = Bn?.nearest(lx, lz), bw = nb ? Bn.frame(nb.sb).w : 0;
    const wasLine = this.line;
    if (nb && nb.d < bw + 6 && (!n || nb.d < n.d - (this.line === 'cavern' ? -3 : 3))) this.line = 'cavern'; else this.line = 'main';
    if (this.line === 'cavern') { this.sb = nb.sb; this.d = nb.d; this.lat = nb.lat; this.s = Bn.mainOf(nb.sb); }
    else if (n) { this.s = n.s; this.d = n.d; this.lat = n.lat; }
    if (this.line !== wasLine) {
      if (this.line === 'cavern') this.branchIn = this.sb < BRANCH.hold * 2; // (in at its fork, not dropped into its middle)
      else { if (this.branchIn && this.sb > Bn.length - BRANCH.hold * 2) g.events?.emit('raceway.branch', { branch: Bn.id, by: 'courier' }); this.branchIn = false; }
    }
    // the course's wind: along the track, turned off it by the track's own angle; in the cavern along its branch, weaker (a cave breathes);
    // the weather's strength and squalls on it
    const F = this.line === 'cavern' ? Bn.frame(this.sb) : T.frame(this.s), a = Math.atan2(F.fz, F.fx) + F.wind, t = performance.now() * 0.001;
    const swing = C?.gust ? C.gust * (Math.sin(t * 0.9) * 0.6 + Math.sin(t * 2.3 + 1) * 0.4) : 0;
    this.wind.dir.set(Math.cos(a), Math.sin(a)); this.wind.gust = 1 + 0.05 * Math.sin(t * 0.3) + swing;
    this.wind.speed = WIND.speed * this.wind.gust * (C?.wind ?? 1) * (this.line === 'cavern' ? BRANCH.wind : 1);
    // the slip geysers: on their cycle, throwing whatever is in the column up (as the Dunes')
    for (const G of this.geysers) {
      G.look.update(dt);
      if (!G.look.launching) { G.thrown = false; continue; }
      if (G.thrown || Math.hypot(P.pos.x - G.pos.x, P.pos.z - G.pos.z) > GEYSER.r || P.pos.y - G.pos.y > GEYSER.over) continue;
      G.thrown = true; P.impulse(new THREE.Vector3(0, Math.max(0, GEYSER.up - P.vel.y), 0), 'geyser');
      const S = g.techs?.active; if (S?.id === 'skiff') { S.air = true; S.spin = 0; S.airT = 0; }
      g.events?.emit('geyser.launch', { by: 'environment' });
    }
    // far off the track on the board for a while: set back on it (only while racing: the park is free to ride)
    const riding = g.techs?.active?.id === 'skiff' && g.techs.active.phase === 'ride' && !g.techs.active.grind?.on;
    this.offT = riding && race && this.d > F.w + OFF.far ? this.offT + dt : 0;
    if (this.offT > OFF.secs) this.respawn();
  }
}
