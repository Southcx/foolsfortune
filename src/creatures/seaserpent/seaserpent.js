// ---------------------------------------------------------------------------------------
// THE SEA SERPENT'S BODY (docs/plans/OPEN-SEA.md section 7; the owner, 2026-10-20: "a Marlin-Class test enemy (like a simple to animate sea
// serpent) as part of a vertical slice"): the open sea's first hostile Egregore, fought from the free helm. A chain of segments (14 over
// 30 m: progress/opensea/seaserpent.js, Dovina's numbers), no rig: the head is steered, each segment follows the one before it at its
// spacing (follow-the-leader), and the humps are a wave run down the spine. It rides the drawn sea (the crude sea's heightAt, as the helm
// does), goes under head first and the tail after, and leaves the rail's wake (vfx/rail.js ShipWake) from its head while it swims near
// the top: reading the water is the skill. Its mind is data (seaserpent/mind.js) on the AI parts (creatures/ai/); this module carries it
// out: the swim, the moves, a blow taken (the head x3, the coils x0.5, nothing under the water), sinking.
//
// THE MOVES, each a windup the Figment attack telegraph draws on the water (creatures.js `windup`):
//   ram    under, then up through a ring laid on the bow's path; the ship in the ring as it breaks the surface takes a hit and is knocked
//   spit   the head reared, a glob of crude thrown at the ship: an outlined shot, answered only by the parry (world/opensea/seafight.js)
//   coil   it rings the ship; still inside as it closes, the ship is wrapped (a hit, the helm held: seafight.js), until the head is shot
//   dive   under for a while; its wake shows where it comes up
//
// THE LOOK is Calissa's (vfx/opensea/seaserpentbody.js, `game.makeSeaSerpent`): driven each frame with the head's place, its heading, how
// far up it is and the move under way; its joints and its skull are then where a shot strikes (what is drawn is what is struck). Without
// it (a headless tool), a placeholder of one instanced draw of the spine's segments.
//
// Prior art: the snake of Snake and every chain of follow-the-leader segments (Centipede, the Wind Waker's Gohdan's arms, Shadow of the
//   Colossus's Dirge and Phalanx), Monster Hunter's Lagiacrus and Plesioth (a sea monster that dives and comes up where the water shows),
//   Sea of Thieves' Megalodon (a hunter that circles the hull); the slip jelly's and the Lantern Wisp's bodies (a mind sets `want`, a body
//   moves and poses).
//
//   game.seaSerpents = new SeaSerpents(game)   .spawn(home, { yaw, lair })   .update(dt)   .list   .remove(c)   .partsHit(a, b, r) -> { c, i, point }
//   a sea serpent is a creature (creatures.js's contract): hurt, knock, center, head, vanish, cancel; tagged hurtable
//   c.windUp(move, target)   c.spine [{ p, r, under }]   c.under   c.rear   c.coiled   c.habit ('coil' | 'spit' | null, for a plate)
//   .at(c, i) / .rOf(c, i): a part's place and radius as drawn (0 the skull)   c.body (the look, when there is one)
//   events: seaserpent.rise { by }, seaserpent.wind { move, by }, seaserpent.move { move, hit, by }, seaserpent.hit { part, dmg, hp, cause, by },
//   seaserpent.down { cause, by, give }, seaserpent.coil { by }, seaserpent.free { how, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { tag } from '../../core/tags.js';
import { st } from '../creatures.js';
import { Brain, Senses, Memory, Drives, rollTraits } from '../ai/index.js';
import { SEA_SERPENT } from '../../progress/opensea/seaserpent.js';
import { SEA_BEASTS } from '../../progress/opensea/seabeasts.js';
import { SIGNATURES } from './signatures.js';
import { SHAPES } from './shapes.js';
import { ShipWake } from '../../vfx/rail.js';
import { seaSerpentMind } from './mind.js';
import { stream } from '../../core/rng.js';
const simRand = stream('creatures/seaserpent'); // (the simulation's chance: core/rng.js, the same twice)

/** Its body's numbers (the game's are SEA_SERPENT's): radii (m), the humps (m high, segments a wave, rad a real s), how high the head
 *  rears (m) and how deep it dives (m), how fast it goes under (a share a real s), its turn (rad a real s) and pace's change (m/s a real s),
 *  its poise and stun, how long it sinks (real s), how near the top its wake shows (m), the ring of the ram and the coil (m; the ram's
 *  is its head's breadth and the hull's: a hard turn at the ring's first sight clears it), the coil's chase (x its speed: a ship at
 *  full sail outruns it, one at cruise does not; it whips round at `coilTurn` x its turn while it coils). */
export const SERPENT_BODY = {
  headR: 5.2, tailR: 1.6, hump: 4.5, humpLen: 17, humpSpeed: 1.7, headUp: 12, deep: 20, dive: 0.9, rearRate: 1.4, turn: 0.8, accel: 7,
  poise: 6, stunFor: 0.7, sink: 5, wakeAt: 8, ram: 14, coil: 30, coilChase: 1.45, coilTurn: 3, // (3.5x, against the sloop's 35 m hull: Calissa's body, 2026-10-27; the coil scaled by the hull's length over 35)
};
/** The other chain-bodied beasts on the same chassis (OPEN-SEA.md 14.3; placeholders until Calissa's bodies give theirs): the akhlut short
 *  and quick, Jormungandr a ring's worth of serpent; `segments` and `length` (m) beside the body's numbers (the serpent's from SEA_SERPENT). */
export const BEAST_BODY = {
  seaSerpent: SERPENT_BODY,
  wolfWhale: { ...SERPENT_BODY, segments: 8, length: 24, headR: 3.2, tailR: 1.1, hump: 1.6, humpLen: 7, headUp: 6, deep: 14, wakeAt: 5, ram: 10, coil: 0, turn: 1.5, accel: 10 },
  worldSerpent: { ...SERPENT_BODY, segments: 32, length: 240, headR: 8, tailR: 2.6, hump: 5, humpLen: 22, headUp: 18, deep: 30, wakeAt: 10, ram: 20, coil: 40, turn: 0.55, accel: 6, sink: 8 },
};
/** The beasts this chassis carries as chains; the umibozu and the kraken ride it as shapes (shapes.js: parts in place of a spine). */
export const CHAIN_BEASTS = Object.keys(BEAST_BODY);
export const SEA_BEAST_IDS = [...CHAIN_BEASTS, ...Object.keys(SHAPES)];
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
const _look = new THREE.Matrix4(), _p = new THREE.Vector3(), _coil = { centre: null, r: 5 }; // (the coil's ring round the hull, for the look)
const angleTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
let NEXT = 1;

export class SeaSerpents {
  constructor(game) {
    this.game = game; this.list = [];
    this.mind = seaSerpentMind(this);
    // [look] placeholder, Calissa's: the spine's segments and the head in one instanced draw, the eyes in a second
    this.geo = new THREE.SphereGeometry(1, 14, 10);
    this.mat = new THREE.MeshStandardMaterial({ color: 0x1f3d44, roughness: 0.38, metalness: 0.15, emissive: 0x0a1416 });
    this.eyeMat = new THREE.MeshBasicMaterial({ color: 0xffc860 });
  }
  /** The sea's height under (x, z), as the helm rides it. */
  surf(x, z) { const g = this.game, sea = g.emocean?.sea; return sea ? sea.heightAt(x, z, g.emocean.seaT ?? 0) : (g.opensea?.helm?.pos.y ?? 0); }

  // ---------------------------------------------------------------- a body
  spawn(home, { yaw = simRand() * 6.28, lair = null, beast = 'seaSerpent' } = {}) {
    const g = this.game, Mi = this.mind, row = SEA_BEASTS[beast] || SEA_SERPENT, shape = SHAPES[beast] || null;
    const B = shape ? { ...SERPENT_BODY, ...shape.body } : BEAST_BODY[beast] || SERPENT_BODY;
    const N = shape ? shape.parts.length : B.segments ?? SEA_SERPENT.segments, length = B.length ?? SEA_SERPENT.length, GAP = length / (N - 1);
    const body = (shape ? shape.make(g) : beast === 'seaSerpent' ? g.makeSeaSerpent?.({ segments: N, length }) : g.makeSeaBeast?.(beast, { segments: N, length })) || null; // [look] Calissa's
    const look = body ? null : new THREE.InstancedMesh(this.geo, this.mat, N), eyes = body ? null : new THREE.InstancedMesh(this.geo, this.eyeMat, 2);
    const root = new THREE.Group(); root.userData.zone = 'opensea'; g.scene.add(root);
    if (look) { look.castShadow = true; look.frustumCulled = false; eyes.frustumCulled = false; root.add(look, eyes); }
    const traits = rollTraits(Mi.traits);
    const spine = [];
    for (let i = 0; i < N; i++) spine.push({ p: new THREE.Vector3(home.x - Math.sin(yaw) * GAP * i, home.y, home.z - Math.cos(yaw) * GAP * i), r: B.headR + (B.tailR - B.headR) * Math.pow(i / (N - 1), 0.8), under: 1, y: home.y, id: shape?.parts[i] });
    const c = {
      type: 'creature', kind: beast, name: beast === 'seaSerpent' ? 'sea serpent' : beast, id: NEXT++, row, B, N, GAP, root, look, eyes, body, lair, shape,
      home: home.clone(), pos: shape ? home.clone() : spine[0].p, /* (a shape's place is its own: its parts are where its body draws them) */ vel: new THREE.Vector3(), want: new THREE.Vector3(), yaw, speed: 0, radius: B.headR, height: 2,
      alive: true, hp: row.hp, maxHp: row.hp, poise: B.poise * (traits.bold ?? 1), stunFor: B.stunFor, traits, rel: new Map(), loud: 1.4, affinity: null,
      spine, under: 1, goUnder: 1, rear: 0, wantRear: 0, phase: simRand() * 6.28, attack: null, coiled: null, habit: null, flash: 0, dying: null,
      cd: Object.fromEntries(Object.keys(row.moves).map((k, i) => [k, 1 + i])),
      wake: new ShipWake(g), wakeBody: new THREE.Object3D(),
      center: (out) => out.copy(this.at(c, 0)),
      head: () => this.at(c, 0),
      hurt: (p, dir, power, cause, by, from) => this.hurt(c, p, dir, power, cause, by, from),
      cancel: (why) => this.cancel(c, why),
      vanish: (by, cause) => this.down(c, by, cause),
      knock: () => {}, // (thirty metres of Egregore: no blow of the Courier's moves it)
      windUp: (move, target) => this.windUp(c, move, target),
    };
    const mem = new Memory({ hold: 6, ebb: 1 / 20, threatEbb: 1 / 60 });
    const senses = new Senses(g, { sight: row.sense ?? (row.zone ? row.zone * (row.leash ?? 1.5) : SEA_SERPENT.sense), /* (a territorial beast watches all it would defend) */ fov: 360, feel: 30, hear: 1.6, eye: 1, rate: 2.2, every: 0.5, onHear: (s, reach) => Mi.heard(c, s, reach) });
    c.drives = new Drives(Mi.drives, traits);
    c.brain = new Brain(g, c, { senses, memory: mem, drives: c.drives, actions: Mi.actions, think: 0.25, near: 160, far: 420, sees: (out) => Mi.sees(c, out), mods: (ctx) => Mi.mods(ctx) });
    c.mem = mem;
    shape?.init(this, c);
    Object.defineProperty(c, 'state', { get: () => (c.attack ? 'wind' : c.coiled ? 'coil' : c.brain?.action?.hunt ? 'chase' : c.brain?.action?.id || 'roam') });
    tag(c, 'hurtable', 'creature');
    g.creatures.add(c); g.ai?.add(c.brain);
    this.list.push(c);
    this.pose(c, 0);
    return c;
  }
  remove(c) {
    const g = this.game, i = this.list.indexOf(c); if (i < 0) return;
    this.cancel(c, 'gone'); this.list.splice(i, 1);
    g.creatures.remove(c); g.ai?.remove(c.brain);
    g.scene.remove(c.root); c.look?.dispose(); c.eyes?.dispose(); c.body?.dispose();
    for (const ln of c.wake.lines) { g.scene.remove(ln.m); ln.m.geometry.dispose(); ln.m.material.dispose(); } // (its wake's two ribbons)
  }

  // ---------------------------------------------------------------- each frame
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const c = this.list[i];
      if (c.dying != null) { c.dying -= dt; c.goUnder = 1; c.wantRear = 0; c.want.set(0, 0, 0); if (c.dying <= 0) { this.remove(c); continue; } }
      else {
        const held = st(c, 'halt') > 0 || st(c, 'stun') > 0;
        if (!held) c.brain.update(dt * (st(c, 'slow') ? 0.5 : 1));
        if (c.brain.lod === 'far') c.want.set(0, 0, 0); // (out of mind's reach it lies where it is: the brain does not think out there)
        if (c.attack) this.attackTick(c, dt);
        if (c.coiled) this.coilTick(c, dt);
        if (c.held) (c.shape ?? SIGNATURES[c.held.move])?.hold(this, c, dt); // (a move that holds the ship a while: circle, coilWorld; the grip, the grasp)
        for (const k in c.cd) c.cd[k] -= dt;
      }
      this.swim(c, dt);
      this.pose(c, dt);
    }
  }

  /** The head steered toward `want` (a turn it can make, a pace it can reach), the spine following, the humps running down it. */
  swim(c, dt) {
    const B = c.B, N = c.N, GAP = c.GAP;
    const held = st(c, 'halt') > 0 || st(c, 'stun') > 0 || c.dying != null, slow = st(c, 'slow') ? 0.5 : 1;
    const ws = held ? 0 : Math.hypot(c.want.x, c.want.z) * slow;
    const tr = B.turn * (c.coiled || c.attack?.move === 'coil' ? B.coilTurn : 1) * dt;
    if (ws > 0.05) c.yaw += clamp(angleTo(c.yaw, Math.atan2(c.want.x, c.want.z)), -tr, tr);
    c.speed += clamp(ws - c.speed, -B.accel * dt, B.accel * dt);
    c.vel.set(Math.sin(c.yaw) * c.speed, 0, Math.cos(c.yaw) * c.speed);
    const H = c.shape ? c.pos : c.spine[0].p; H.x += c.vel.x * dt; H.z += c.vel.z * dt;
    for (const isl of this.game.opensea?.props?.islets || []) { // (no swimming through an islet: pushed out round its shore)
      _a.set(H.x - isl.pos.x, 0, H.z - isl.pos.z); const d = _a.length(), r = isl.r + 6;
      if (d < r) { _a.multiplyScalar((r - d) / Math.max(d, 1e-3)); H.add(_a); }
    }
    c.under += clamp(c.goUnder - c.under, -B.dive * dt, B.dive * dt);
    c.rear += clamp((c.under > 0.5 ? 0 : c.wantRear) - c.rear, -B.rearRate * dt, B.rearRate * dt);
    c.phase += B.humpSpeed * dt * (0.5 + Math.min(1, c.speed / c.row.speed));
    const S = c.spine;
    S[0].under = c.under;
    if (c.shape) { c.shape.swim(this, c, dt); c.flash = Math.max(0, c.flash - dt * 4); return; }
    if (c.body) { c.flash = Math.max(0, c.flash - dt * 4); return; } // (the look lays the spine: pose() reads it back)
    for (let i = 1; i < N; i++) { // (follow the leader: each at its spacing behind the one before; the dive rolls down it)
      const a = S[i - 1], b = S[i];
      _a.set(b.p.x - a.p.x, 0, b.p.z - a.p.z); let d = _a.length();
      if (d < 1e-3) { _a.set(-Math.sin(c.yaw), 0, -Math.cos(c.yaw)); d = 1; }
      b.p.x = a.p.x + (_a.x / d) * GAP; b.p.z = a.p.z + (_a.z / d) * GAP;
      b.under += (a.under - b.under) * Math.min(1, dt * 5);
    }
    for (let i = 0; i < N; i++) {
      const s = S[i], top = this.surf(s.p.x, s.p.z), env = 1 - 0.55 * (i / (N - 1));
      const hump = i < 2 ? 0 : B.hump * env * Math.sin(c.phase - (i * 2 * Math.PI) / B.humpLen);
      const neck = i < 3 ? c.rear * B.headUp * (1 - i / 3) : 0;
      s.y = top + (hump + neck - 0.15) * (1 - s.under) - s.under * B.deep;
      s.p.y = s.y;
    }
    if (c.dying != null) for (const s of S) s.p.y -= (B.sink - c.dying) * 0.6;
    c.flash = Math.max(0, c.flash - dt * 4);
  }

  /** The look: each segment an instance, faced along the spine; the head longer; the eyes either side of it. */
  pose(c, dt) {
    const S = c.spine, B = c.B, N = c.N, GAP = c.GAP;
    if (c.shape) return c.shape.pose(this, c, dt);
    if (c.body) return this.drive(c, dt);
    for (let i = 0; i < N; i++) {
      const s = S[i], t = S[i === 0 ? 1 : i - 1];
      _a.copy(i === 0 ? s.p : t.p); _b.copy(i === 0 ? t.p : s.p); // (from the one behind to the one ahead: the segment's forward)
      _look.lookAt(_a, _b, _up); _q.setFromRotationMatrix(_look);
      if (i === 0) _s.set(s.r * 0.85, s.r * 0.75, s.r * 1.45); else _s.set(s.r, s.r * 0.9, GAP * 0.62);
      _m.compose(s.p, _q, _s); c.look.setMatrixAt(i, _m);
    }
    c.look.instanceMatrix.needsUpdate = true;
    const H = S[0];
    _look.lookAt(S[1].p, H.p, _up); _q.setFromRotationMatrix(_look);
    for (let k = 0; k < 2; k++) { _p.set((k ? 1 : -1) * H.r * 0.6, H.r * 0.35, -H.r * 0.9).applyQuaternion(_q).add(H.p); _m.compose(_p, _q, _s.setScalar(0.22)); c.eyes.setMatrixAt(k, _m); }
    c.eyes.instanceMatrix.needsUpdate = true;
    this.mat.emissive.setRGB(0.04 + c.flash * 0.6, 0.08 + c.flash * 0.45, 0.09 + c.flash * 0.2);
    // its wake from the head while it swims near the top (none at rest, none deep): the water says where it is going
    const W = c.wakeBody, near = H.y > this.surf(H.p.x, H.p.z) - B.wakeAt;
    W.position.set(H.p.x, this.surf(H.p.x, H.p.z), H.p.z); W.rotation.set(0, c.yaw, 0);
    if (dt > 0) c.wake.update(dt, { group: W, speed: near && c.dying == null ? c.speed : 0, length: B.headR * 2.6, beam: B.headR * 1.6 }, this.game.emocean?.sea);
  }

  /** Calissa's body driven: the head's place and heading, how far up (`rise`), the move under way and how far through it; then its
   *  joints read back into the spine, so the shots, the aim and the wake go by what is drawn. */
  drive(c, dt) {
    const B0 = c.body, S = c.spine, A = c.attack, ship = this.game.opensea?.helm, B = c.B, N = c.N;
    const Hd = c.held, move = Hd?.move ?? (c.coiled ? 'coil' : A?.move ?? null);
    const k = Hd ? 1 - Hd.t / (Hd.hold || 1) : A ? 1 - A.t / (A.T || c.row.moves[A.move].windup) : c.coiled ? Math.min(1, c.coiled.k / 0.6) : 0;
    _coil.centre = ship?.pos ?? S[0].p; _coil.r = B.coil * ((ship?.look?.length ?? 35) / 35); // (the helix round the hull, as long as it is)
    const breach = A?.move === 'breach'; // (the akhlut's leap: its landing ring where the windup's ring is)
    B0.drive({ head: S[0].p, heading: c.yaw, rise: 1 - c.under, move, k, coil: move === 'coil' ? _coil : null, held: Hd, ring: Hd?.centre ? { centre: Hd.centre, r: Hd.r } : null, land: breach ? A.at : undefined, landR: breach ? B.ram : undefined });
    if (dt > 0) B0.update(dt);
    const J = B0.segmentsAt();
    for (let i = 1; i < N && i < J.length; i++) { S[i].p.copy(J[i]); S[i].y = J[i].y; S[i].r = B0.radii[i]; }
    S[0].y = S[0].p.y = B0.headPos.y; S[0].r = B0.headRadius;
    const W = c.wakeBody, H = B0.headPos, top = this.surf(H.x, H.z), near = H.y > top - B.wakeAt;
    W.position.set(H.x, top, H.z); W.rotation.set(0, c.yaw, 0);
    if (dt > 0) c.wake.update(dt, { group: W, speed: near && c.dying == null ? c.speed : 0, length: B.headR * 2.6, beam: B.headR * 1.6 }, this.game.emocean?.sea); // (a wake as broad as the head)
  }

  // ---------------------------------------------------------------- what it is struck by
  /** A part's place and radius as drawn: the skull's for the head when the look is there, the spine's joints otherwise. */
  at(c, i) { return i === 0 && c.body ? c.body.headPos : c.spine[i].p; }
  rOf(c, i) { return i === 0 && c.body ? c.body.headRadius : c.spine[i].r; }
  /** Which part a point is on (0 the head), and whether it is above the water to be struck at all. */
  partAt(c, p) { let best = 0, bd = Infinity; for (let i = 0; i < c.N; i++) { const d = this.at(c, i).distanceToSquared(p); if (d < bd) { bd = d; best = i; } } return best; }
  exposed(c, i) { if (c.shape?.exposed) return c.shape.exposed(this, c, i); const q = this.at(c, i); return q.y + this.rOf(c, i) * 0.6 > this.surf(q.x, q.z); }
  /** What a shot flying from a to b (radius r) strikes first: the nearest exposed part along it. */
  partsHit(a, b, r = 0.2) {
    let best = null, bt = Infinity;
    _b.subVectors(b, a); const L2 = _b.lengthSq() || 1;
    for (const c of this.list) {
      if (!c.alive) continue;
      for (let i = 0; i < c.N; i++) {
        if (!this.exposed(c, i)) continue;
        const q = this.at(c, i), t = clamp(_a.subVectors(q, a).dot(_b) / L2, 0, 1);
        _p.copy(a).addScaledVector(_b, t);
        const rr = this.rOf(c, i) * (i === 0 ? 1.2 : 1) + r;
        if (_p.distanceToSquared(q) <= rr * rr && t < bt) { bt = t; best = { c, i, point: _p.clone() }; }
      }
    }
    return best;
  }
  hurt(c, point, dir, power, cause, by) {
    if (!c.alive) return 'blocked';
    const i = point ? this.partAt(c, point) : 0;
    if (!this.exposed(c, i)) return 'blocked'; // (under the water nothing reaches it)
    const raw = c.shape ? c.shape.damage(this, c, i, power) : power * (i === 0 ? 3 : 0.5); // (the head the weak point, x3; the coils x0.5: seaserpent.js; a shape's parts its own: shapes.js)
    if (raw === 'blocked') return 'blocked';
    const dmg = raw * (c.open > 0 ? 1.5 : 1); // (held open by a flash x1.5: seamounts.js)
    c.hp -= dmg; c.flash = 1; c.brain.signal();
    if (c.shape) c.shape.look(this, c, i); else c.body?.hit(i === 0 ? 'head' : 'coil', Math.min(1, 1 - c.hp / c.maxHp));
    if (by === 'courier') { const f = c.mem.ensure(this.game.player, 'courier'); f.grudge = Math.min(1, f.grudge + 0.05 * dmg); f.aware = 1; }
    c.drives.add('fear', dmg * 0.012);
    if (c.coiled && i === 0) { c.coiled.hits += dmg; if (c.coiled.hits >= 6) this.free(c, 'shot'); }
    if (c.held && c.shape) c.shape.struck(this, c, i, dmg); // (the umibozu's eyes shot loose of the hull)
    else if (c.held && i === 0) SIGNATURES[c.held.move]?.struck?.(this, c, dmg); // (its head at the peak: the coil of the world broken)
    this.game.events?.emit('seaserpent.hit', { id: c.kind, part: c.shape ? c.spine[i].id : i === 0 ? 'head' : 'coil', dmg: +dmg.toFixed(1), hp: Math.max(0, +c.hp.toFixed(1)), cause, by });
    if (c.hp <= 0) this.down(c, by, cause);
    return dmg;
  }
  down(c, by = 'courier', cause = 'shot') {
    if (!c.alive) return;
    const g = this.game;
    c.alive = false; c.dying = c.B.sink; this.cancel(c, 'down'); c.brain.end('down'); c.status.clear(); c.body?.down();
    g.ai?.stimuli.emit('death', c.pos, { radius: 200, strength: 1.4, by, source: c, ttl: 3 });
    if (c.kind === 'seaSerpent') g.events?.emit('seaserpent.down', { cause, by, lair: c.lair, give: SEA_SERPENT.give });
    else g.events?.emit('seabeast.down', { id: c.kind, cause, by, lair: c.lair }); // (the room pays it: seabeasts.js beastPay)
  }

  // ---------------------------------------------------------------- the moves
  /** A move begun: its windup (the Figment attack telegraph's area on the water) and what it does when the windup runs out. */
  windUp(c, move, target) {
    const g = this.game, m = c.row.moves[move], B = c.B; if (!m || c.attack || c.coiled || c.held || !c.alive) return false;
    const T = target?.pos ?? target, ship = g.opensea?.helm;
    const lead = g.seaFight?.crewLead?.() ?? 0; // (Dovina aboard: every windup shown that much sooner: SEA_CREW)
    const A = (c.attack = { move, t: m.windup + lead, T: m.windup + lead, target: T, at: new THREE.Vector3() });
    c.cd[move] = m.cooldown;
    if (c.shape) c.shape.wind(this, c, move, m, T);
    else if (move === 'ram' || move === 'rise' || move === 'breach') { // (the ring where it will break the surface: where the bow will be when the windup runs out; the breach leads it `lead` s more)
      const v = ship ? _a.set(Math.sin(ship.yaw), 0, Math.cos(ship.yaw)).multiplyScalar(ship.speed * (m.windup + (m.lead ?? 0.2))) : _a.set(0, 0, 0);
      A.at.copy(T).add(v); A.at.y = this.surf(A.at.x, A.at.z);
      c.goUnder = 1; c.wantRear = 0;
      g.creatures.windup(c, { at: A.at, radius: B.ram, eta: c.attack.t, kind: move, parry: false, area: { shape: 'circle', radius: B.ram, at: 'courier' }, type: 'impact', answer: move === 'breach' ? 'speed' : 'out' });
    } else if (move === 'spit') {
      c.goUnder = 0; c.wantRear = 1; c.habit = 'spit';
      g.creatures.windup(c, { at: c.pos, radius: B.headR, eta: c.attack.t, kind: 'spit', parry: false, area: { shape: 'line', width: B.headR * 1.6, length: Math.max(8, c.pos.distanceTo(T)) }, type: 'impact', answer: 'parry' });
    } else if (move === 'coil') { // (it rings the ship: the ring closes on the hull where it is now; out of it before it closes, no wrap)
      A.at = T; c.goUnder = 0; c.wantRear = 0.4; c.habit = 'coil';
      const cr = B.coil * ((ship?.look?.length ?? 35) / 35); // (the coil's ring scaled by the hull it wraps)
      g.creatures.windup(c, { at: T, radius: cr, eta: c.attack.t, kind: 'coil', parry: false, area: { shape: 'circle', radius: cr, at: 'courier' }, type: 'impact', answer: 'out' });
    } else if (SIGNATURES[move]) SIGNATURES[move].wind(this, c, m, T);
    else if (move === 'dive') {
      c.wantRear = 0;
      g.creatures.windup(c, { at: c.pos, radius: 2, eta: c.attack.t, kind: 'dive', parry: false, read: false });
    }
    g.events?.emit('seaserpent.wind', { id: c.kind, move, by: 'creature' });
    return true;
  }
  attackTick(c, dt) {
    const A = c.attack, g = this.game, ship = g.opensea?.helm, B = c.B; A.t -= dt;
    if (c.shape) return c.shape.tick(this, c, dt);
    if (A.move === 'ram' || A.move === 'rise' || A.move === 'breach') { // (it runs in under the ring and comes up through it)
      _a.subVectors(A.at, c.pos).setY(0); const d = _a.length();
      c.want.copy(_a).multiplyScalar(d > 1 ? (c.row.speed * 1.6) / d : 0);
      if (A.t <= 0.35) c.goUnder = 0;
      if (A.t > 0) return;
      const hit = !(c.tether > 0) && !!ship && (ship.hullDist?.(A.at) ?? ship.pos.distanceTo(_b.copy(A.at).setY(ship.pos.y))) <= B.ram + 0.5; // (the ring on any of the hull, not its middle; a harpooned beast's ram is blunted: world/opensea/seamounts.js)
      c.spine[0].p.x = A.at.x; c.spine[0].p.z = A.at.z; c.under = A.move === 'breach' ? 0 : 0.3; c.goUnder = 0; c.wantRear = 1; // (it breaks the surface there; the breach clear out of it)
      this.finish(c, A.move, hit);
      c.attack = null; g.creatures.unwind(c);
      c.brain.signal();
    } else if (A.move === 'spit') {
      if (A.target) { c.want.set(0, 0, 0); c.yaw += clamp(angleTo(c.yaw, Math.atan2(A.target.x - c.pos.x, A.target.z - c.pos.z)), -2 * dt, 2 * dt); }
      if (A.t > 0) return;
      this.finish(c, 'spit', false);
      c.attack = null; g.creatures.unwind(c); c.wantRear = 0.6;
    } else if (A.move === 'coil') { // (it keeps pace with the ship and closes on its side: at full sail the ship outruns it)
      _a.subVectors(A.at, c.pos).setY(0); const d = _a.length();
      if (ship) c.want.set(Math.sin(ship.yaw) * ship.speed, 0, Math.cos(ship.yaw) * ship.speed); else c.want.set(0, 0, 0);
      c.want.addScaledVector(_a, 1.5); const w = c.want.length(), cap = c.row.speed * B.coilChase;
      if (w > cap) c.want.multiplyScalar(cap / w);
      if (A.t > 0) return;
      const hit = !!ship && (ship.hullDist?.(c.pos) ?? c.pos.distanceTo(_b.copy(ship.pos).setY(c.pos.y))) <= B.coil * ((ship.look?.length ?? 35) / 35) + 3;
      c.attack = null; g.creatures.unwind(c);
      if (hit) { c.coiled = { t: c.row.moves.coil.hold, hits: 0, k: 0 }; this.finish(c, 'coil', true); g.events?.emit('seaserpent.coil', { by: 'creature' }); }
      else { this.finish(c, 'coil', false); c.habit = null; }
    } else if (SIGNATURES[A.move]) SIGNATURES[A.move].tick(this, c, dt);
    else if (A.move === 'dive') {
      if (A.t > 0) return;
      c.goUnder = 1; c.wantRear = 0; c.habit = null;
      c.attack = null; g.creatures.unwind(c);
      this.finish(c, 'dive', false);
    }
  }
  /** A move's blow lands or misses: the room's fight hears it (the hull, the knock, the glob: seafight.js). */
  finish(c, move, hit) {
    this.game.events?.emit('seaserpent.move', { id: c.kind, move, hit, by: 'creature' });
    this.game.seaFight?.serpentMove?.(c, move, hit);
  }
  /** Wrapped round the ship: it holds the hull, its head over the deck, until its time is up or the head is shot (`hurt`). */
  coilTick(c, dt) {
    const C = c.coiled, ship = this.game.opensea?.helm; C.t -= dt; C.k += dt;
    if (!ship || C.t <= 0) return this.free(c, 'time');
    c.goUnder = 0; c.wantRear = 1;
    const a = c.yaw + dt * 1.2, r = Math.max(5, (ship.look?.beam ?? 2.4) / 2); // (the head circles over the deck, its beam's half out)
    _a.set(ship.pos.x + Math.sin(a) * r, 0, ship.pos.z + Math.cos(a) * r);
    c.want.subVectors(_a, c.pos).setY(0).multiplyScalar(3);
  }
  free(c, how) {
    if (!c.coiled) return;
    c.coiled = null; c.habit = null; c.goUnder = how === 'shot' ? 1 : 0.4; c.wantRear = 0;
    this.game.events?.emit('seaserpent.free', { how, by: how === 'shot' ? 'courier' : 'creature' });
    this.game.seaFight?.serpentFree?.(c, how);
  }
  cancel(c, why) {
    if (c.attack) { c.attack = null; this.game.creatures.unwind(c, why); }
    if (c.coiled) this.free(c, why);
    if (c.held) (c.shape ?? SIGNATURES[c.held.move])?.end(this, c, why);
  }
  /** A shape's hold let go by an answer from outside it (the Lockheart's gulp on the umibozu's pour: seamounts.js). */
  release(c, how) { if (c.held && c.shape) c.shape.end(this, c, how); }
}
