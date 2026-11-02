// ---------------------------------------------------------------------------------------
// THE MECH'S PROPS (docs/plans/MECHS.md 9.2; South, 2026-11-02: "think incredible hulk's ultimate destruction"): whatever is loose in the
// proving ground at the mech's scale is a weapon (Dovina's PROPS, progress/mechs/techniques.js): a dozen lamp posts along the street,
// two water towers, a girder left by each steel-framed building felled (city.js onGirder), a slab of building that came down softly
// (city.js onChunk), and a limb torn off at a joint (spawnLimb: the mech's, the straw giant's, the ring's rival's).
//   F near one (TECHNIQUES.grab.reach past the frame's footprint) puts it in the mech's right hand (MechBody.arms.R.held), the right arm's
//     weapon put away; its mass is the frame's load while held (the pilot's walk and boost slower)
//   RMB tapped swings it as a club (propBlow, its reach, a hit a swing that struck; at none it breaks); RMB held and let go throws it
//     (ballistic at its thrown speed along the aim, onto the giant in the lock when it is in view; thrownK); a post or girder thrown
//     point first is the Javelin (TECHNIQUES.javelin: it goes through PIERCE things); a prop with no club's grip (a slab, a water tower)
//     is thrown on RMB's release
//   the Wrecking Spin (mechtech.js) swings the club all round (swing({ spin }))
//   a slab of 8 t or more held with V is the Slab Shield: it takes the blows from the front, PROPS.chunk.shield of them, then breaks
// Props rest where they fall (no physics engine: a thing at the mech's scale flies by its own ballistics, MECHS.md 9.6, Petra's later).
//
// Prior art: The Incredible Hulk: Ultimate Destruction (the lamp-post bat, the girder, the car fists, the slab as a shield and a
// surfboard), God of War's grab-and-use, Godzilla: Save the Earth (a building's piece thrown), Toribash (a torn limb left in play),
// the house's thrown hit (progress/sandbox.js IMPACT: k from the energy), the ballistic aim of a lobbed shell (the Bombardier's arc).
//
//   const P = new MechProps(hangar)   P.build(into)   P.teardown()   P.update(dt)   P.held (the prop in hand, or null)   P.heldMass
//   P.spawn(prop, { at, mass?, label?, from?, part?, vel?, mesh? }) -> rec   P.spawnLimb({ from: 'mech' | 'giant' | 'rival', part, at, label, vel? })
//   P.addChunk({ mesh, mass, at })   P.addGirder(at)   P.nearest(pos, reach) -> rec   P.grab() -> bool (a prop taken, else the challenges' lectern)   P.drop()
//   P.discard(rec) (out of play, no burst)
//   P.swing({ spin, k? }) -> things struck   P.throw({ javelin }) -> bool   P.shieldTake(fromPos) -> bool (the slab took the blow)
//   PROP_PLACES   PROP_LOOK   HANDLING
//   events: mech.grab { prop, by }, mech.prop.hit { prop, n, own?, by }, mech.prop.throw { prop, hit, javelin?, own?, from, at, by } (from and at:
//   world [x, y, z] to 0.1 m, where it left the hand and where it came down),
//   mech.prop.break { prop, shield?, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { stream } from '../../core/rng.js';
import { PROPS, TECHNIQUES, propBlow, thrownK } from '../../progress/mechs/techniques.js';
import { armOK } from '../../progress/mechs/joints.js';
import { outputK } from '../../progress/mechs/rules.js';
import { PROVING } from './layout.js';
import { MECH_BODY, seatOf } from './mech.js';
import { GIANT_LOOK } from './giant.js';

/** Where the street's props stand (m from PROVING.at): the lamp posts down both kerbs of the street between the lots (z ±22, clear of the
 *  knee-high blocks), the water towers on two corners. */
export const PROP_PLACES = {
  posts: [-110, -85, -60, -38, -8, 22].flatMap((x) => [{ x, z: -22 }, { x: x + 10, z: 22 }]),
  towers: [{ x: -110, z: 42 }, { x: 50, z: -26 }],
};
/** The placeholders (Calissa's to dress): sizes in m, colours. A club's long axis is +z from its grip, as the great blade's. */
export const PROP_LOOK = {
  post: { r: 0.3, len: 10, colour: 0x6b4a36, lamp: 0xffe1a0 }, girder: { w: 0.8, len: 12, colour: 0x4c5866 },
  tower: { r: 2.4, h: 4, legs: 6, colour: 0x7a6a5a, tank: 0x5f86a0 }, limb: { colour: 0xb0704a, joint: 0x4a2a1e },
};
/** The handling: RMB let go before `tap` real s swings, after it throws; a swing lands `land` real s after the press (the arm's own:
 *  mechweapons.js TIMING.land); a throw leaves `up` rad above the aim when nothing is locked; a javelin goes through `pierce` things
 *  (TECHNIQUES.javelin.pierce); a club at a run hits harder, up to `runK` more at the boost's top; a resting prop is offered within
 *  the grab's reach past the frame's footprint. */
export const HANDLING = { tap: 0.3, land: 0.3, up: 0.18, runK: 0.5, g: 9.81, pierce: TECHNIQUES.javelin.pierce, front: 0.3 };
/** A torn-off part's box (m): what its limb prop looks like. */
const LIMB_SIZE = { arm: [1.6, 1.6, 5.5], forearm: [2.2, 2.2, 3], leg: [1.8, 2, 6], head: [2.4, 2.4, 2.4], back: [4, 1.6, 3.2] };
const R = stream('world/hangar/props');
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _f = new THREE.Vector3(), _q = new THREE.Quaternion();
let NEXT = 1;
const tenth = (v) => [Math.round(v.x * 10) / 10, Math.round(v.y * 10) / 10, Math.round(v.z * 10) / 10]; // (a world point as [x, y, z] to 0.1 m: the throw's events)

export class MechProps {
  constructor(hangar) { this.hangar = hangar; this.game = hangar.game; this.list = []; this.held = null; this.built = false; this.mats = null; this.geos = []; }
  get pilot() { return this.hangar.pilot; }
  get heldMass() { return this.held?.mass || 0; }

  build(into) {
    if (this.built) return;
    this.into = into; this.mats = {};
    const M = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: true });
    for (const [k, c] of [['post', PROP_LOOK.post.colour], ['girder', PROP_LOOK.girder.colour], ['tower', PROP_LOOK.tower.colour], ['tank', PROP_LOOK.tower.tank], ['limb', PROP_LOOK.limb.colour], ['joint', PROP_LOOK.limb.joint]]) this.mats[k] = M(c);
    this.mats.lamp = M(PROP_LOOK.post.lamp); this.mats.lamp.emissive = new THREE.Color(PROP_LOOK.post.lamp); this.mats.lamp.emissiveIntensity = 0.8;
    const A = PROVING.at;
    for (const p of PROP_PLACES.posts) this.spawn('post', { at: new THREE.Vector3(A.x + p.x, A.y, A.z + p.z), upright: true });
    for (const p of PROP_PLACES.towers) this.spawn('tower', { at: new THREE.Vector3(A.x + p.x, A.y, A.z + p.z), upright: true });
    this.built = true;
  }
  teardown() {
    if (!this.built) return;
    this.held = null;
    for (const r of this.list) { r.mesh.parent?.remove(r.mesh); if (r.ownGeo) r.mesh.traverse((o) => o.geometry?.dispose()); }
    for (const g of this.geos) g.dispose(); for (const m of Object.values(this.mats || {})) m.dispose();
    this.list = []; this.geos = []; this.mats = null; this.built = false;
  }

  // ------------------------------------------------------------------ the things
  geo(g) { this.geos.push(g); return g; }
  /** A prop's placeholder mesh, its long axis +z from its grip (a tower and a slab are carried, not swung). */
  meshOf(prop, part) {
    const G = new THREE.Group(), add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, this.mats[mat]); m.position.set(x, y, z); m.castShadow = true; G.add(m); return m; };
    if (prop === 'post') { const L = PROP_LOOK.post, c = add(this.geo(new THREE.CylinderGeometry(L.r, L.r * 1.3, L.len, 8)), 'post', 0, 0, L.len / 2); c.rotation.x = Math.PI / 2; add(this.geo(new THREE.BoxGeometry(1.2, 1, 1.2)), 'lamp', 0, 0, L.len); }
    else if (prop === 'girder') { const L = PROP_LOOK.girder; add(this.geo(new THREE.BoxGeometry(L.w, L.w * 1.4, L.len)), 'girder', 0, 0, L.len / 2); }
    else if (prop === 'tower') {
      const L = PROP_LOOK.tower, tank = add(this.geo(new THREE.CylinderGeometry(L.r, L.r, L.h, 12)), 'tank', 0, L.legs + L.h / 2, 0); tank.userData.tank = true;
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(this.geo(new THREE.BoxGeometry(0.4, L.legs, 0.4)), 'tower', x * L.r * 0.7, L.legs / 2, z * L.r * 0.7);
    } else { // (a limb: a box of the part's size, its joint's stub at the grip)
      const kind = (part || 'arm').replace(/[LR]$/, ''), [w, h, d] = LIMB_SIZE[kind] || LIMB_SIZE.arm;
      add(this.geo(new THREE.BoxGeometry(w, h, d)), 'limb', 0, 0, d / 2); add(this.geo(new THREE.BoxGeometry(w * 0.7, h * 0.7, 0.8)), 'joint', 0, 0, 0.2);
    }
    return G;
  }
  /** A prop put in the world: resting at `at` (a post and a tower stood upright, the rest lying), or flying with `vel`. */
  spawn(prop, { at, mass, label, from = PROPS[prop]?.from, part = null, vel = null, mesh = null, upright = false } = {}) {
    const P = PROPS[prop]; if (!P || !this.mats) return null;
    const m = mesh || this.meshOf(prop, part), pos = at.isVector3 ? at.clone() : new THREE.Vector3(...at);
    if (!mesh) { m.position.copy(pos); if (upright && prop === 'post') m.rotation.x = -Math.PI / 2; else if (!upright) { m.position.y = Math.max(m.position.y, PROVING.at.y + 0.6); m.rotation.y = R() * Math.PI * 2; } }
    if (m.parent !== this.into) this.into.attach(m);
    const r = { uid: NEXT++, prop, P, mass: mass ?? P.mass, hits: P.hand?.hits ?? 1, shield: P.shield && (mass ?? P.mass) >= 8 ? P.shield : 0, label: label || P.label, from, part,
      mesh: m, state: vel ? 'flying' : 'rest', vel: vel ? vel.clone() : new THREE.Vector3(), spin: new THREE.Vector3((R() - 0.5) * 3, (R() - 0.5) * 3, (R() - 0.5) * 3), ownGeo: !!mesh };
    this.list.push(r); return r;
  }
  /** A limb torn off at a joint (joints.js snapped): thrown off where it was, a little up and away. Called by the mech, the giant and the ring. */
  spawnLimb({ from, part, at, label, vel = null }) {
    const v = vel || new THREE.Vector3((R() - 0.5) * 6, 5 + R() * 3, (R() - 0.5) * 6);
    return this.spawn('limb', { at, label: `${label || from}'s ${part}`, from, part, vel: v });
  }
  /** A slab of building that came down softly (city.js onChunk): its own mesh and mass. */
  addChunk({ mesh, mass, at }) { mesh.position.copy(at); return this.spawn('chunk', { at, mass, mesh }); }
  /** A steel beam out of a felled building (city.js onGirder). */
  addGirder(at) { return this.spawn('girder', { at, vel: new THREE.Vector3(0, 3, 0) }); }

  /** The nearest resting prop within `reach` m of the frame's footprint. */
  nearest(pos, reach = TECHNIQUES.grab.reach) {
    let best = null, bd = reach + MECH_BODY.radius;
    for (const r of this.list) { if (r.state !== 'rest') continue; const d = Math.hypot(r.mesh.position.x - pos.x, r.mesh.position.z - pos.z); if (d < bd) { bd = d; best = r; } }
    return best;
  }

  // ------------------------------------------------------------------ in hand
  /** F: the nearest prop into the right hand, else the smash challenges' lectern when the frame stands at it (true: F was spent). */
  grab() { return this.pickUp() || !!this.hangar.challenges?.use(); }
  /** The nearest prop into the right hand (the arm and its hand must be there). */
  pickUp() {
    const M = this.pilot, B = M.mech; if (this.held || !B?.arms?.R) return false;
    if (!armOK(M.state.joints, 'R') || M.broken('armR')) return false;
    const r = this.nearest(M.pos); if (!r) return false;
    this.held = r; r.state = 'held'; B.arms.R.held.add(r.mesh);
    r.mesh.position.set(0, 0, 0); r.mesh.rotation.set(0, 0, 0);
    if (!r.P.hand) r.mesh.position.set(0, r.prop === 'tower' ? -4 : -2, 2.5); // (carried before the hand, not swung)
    this.game.events?.emit('mech.grab', { prop: r.prop, by: 'courier' });
    return true;
  }
  /** Put down (F again, or the arm gone): set on the ground before the frame. */
  drop() {
    const r = this.held; if (!r) return; this.held = null;
    this.into.attach(r.mesh); r.state = 'flying'; r.vel.set(0, 0, 0);
  }

  /** A club swung (RMB tapped), or the Wrecking Spin all round: what it struck in the swing (the giant, the buildings), one of its hits
   *  spent when it struck anything; at none it breaks. */
  swing({ spin = false, k = null } = {}) {
    const r = this.held, M = this.pilot; if (!r?.P.hand) return 0;
    const lock = M.armLock('R'); if (!lock) return 0;
    const run = 1 + HANDLING.runK * Math.min(1, M.speed / Math.max(1, M.stats.boostTop || M.stats.walkTop)), out = M.berserk > 0 ? outputK(1) : outputK(M.sync);
    const kk = (k ?? propBlow(r.P, run)) * out * lock, reach = MECH_BODY.radius + r.P.hand.reach, Gi = M.giant;
    M.weapons.arms.R.swing = 1;
    const fire = () => {
      let n = 0; const own = r.from === 'giant';
      if (Gi && M.weapons.gap() <= r.P.hand.reach && (spin || M.weapons.inFront())) {
        const res = Gi.blow({ weapon: r.prop, k: kk, stagger: 14 * kk, heavy: kk >= 1, region: 'body', from: M.pos, by: 'courier' });
        if (!res.blocked) n++;
        this.game.events?.emit('mech.hit', { weapon: r.prop, region: 'body', staggered: !!res.staggered, pierced: !!res.pierced, arm: 'R', crit: !!res.crit, ...(res.blocked ? { blocked: true } : {}), ...(res.felled ? { felled: true } : {}), by: 'courier' });
      }
      const C = this.hangar.city, struck = new Set();
      if (C?.built) {
        const y = M.pos.y + seatOf(M.stats);
        const dirs = spin ? Array.from({ length: 8 }, (_, i) => i * Math.PI / 4) : [M.yaw];
        for (const a of dirs) { _a.set(M.pos.x + Math.sin(a) * reach * 0.75, y, M.pos.z + Math.cos(a) * reach * 0.75); const s = C.strike({ kind: 'ball', at: _a, r: 3 }, kk, 'courier'); if (s.cells) struck.add(a); }
        n += Math.min(struck.size, spin ? 8 : 1);
      }
      if (!n) return;
      this.game.events?.emit('mech.prop.hit', { prop: r.prop, n, ...(own ? { own: true } : {}), by: 'courier' });
      if (--r.hits <= 0 && this.held === r) this.breakHeld();
    };
    if (spin) fire(); else M.weapons.later(HANDLING.land / lock, fire, 'R');
    return 1;
  }
  /** RMB let go: thrown from the hand, onto the giant in the lock when it is in view (the low arc that reaches its middle), else along
   *  the aim a little up. A post or girder with the Javelin open flies point first. */
  throw({ javelin = false } = {}) {
    const r = this.held, M = this.pilot; if (!r || !M.mech) return false;
    const sp = r.P.thrown.speed, from = M.mech.hand('R', _a).clone(), Gi = M.giant, lock = M.lockRange();
    let dir = null;
    if (Gi?.c?.alive && M.weapons.gap() <= lock && M.inView(Gi.pos)) dir = arc(from, Gi.c.center(_b), sp);
    if (!dir) { dir = M.aimDir(_f).clone(); dir.y = Math.max(dir.y + HANDLING.up + 0.25, HANDLING.up); dir.normalize(); }
    this.held = null; this.into.attach(r.mesh); r.mesh.position.copy(from);
    r.state = 'flying'; r.vel.copy(dir).multiplyScalar(sp).add(_b.copy(M.vel).setY(0));
    r.flight = { k: thrownK(r.P, sp, r.mass), javelin, left: javelin ? HANDLING.pierce : 1, hit: null, giant: false, struck: new Set(), from: tenth(from) }; // (from: where it left the hand, the challenges' throw line)
    M.spend(javelin ? TECHNIQUES.javelin.kJ : TECHNIQUES.throw.kJ); M.weapons.arms.R.swing = 1;
    return true;
  }
  /** A prop taken out of play without a burst (a challenge's, cleared when it ends): out of the hand, off the list, its mesh let go. */
  discard(r) {
    if (this.held === r) this.held = null;
    const i = this.list.indexOf(r); if (i >= 0) this.list.splice(i, 1);
    r.mesh.parent?.remove(r.mesh); if (r.ownGeo) r.mesh.traverse((o) => o.geometry?.dispose());
  }
  /** A blow from `from` on the frame: the slab held up (V) takes it from the front. */
  shieldTake(from) {
    const r = this.held, M = this.pilot; if (!r?.shield || !M.pressing) return false;
    _a.subVectors(from, M.pos).setY(0).normalize(); if (_a.dot(M.forward(_f)) <= HANDLING.front) return false;
    if (--r.shield <= 0) this.breakHeld(true);
    return true;
  }
  breakHeld(shield = false) {
    const r = this.held; if (!r) return; this.held = null;
    this.into.attach(r.mesh); this.shatter(r);
    this.game.events?.emit('mech.prop.break', { prop: r.prop, ...(shield ? { shield: true } : {}), by: 'courier' });
  }
  /** A prop gone to pieces: its mesh into the voxel batch's debris (the house's burst, baked from its own mesh), then away. */
  shatter(r) {
    const V = this.game.voxels?.mesh ? this.game.voxels : null;
    if (V) { r.mesh.updateMatrixWorld(true); V.burst({ object: r.mesh, key: r.ownGeo ? null : `mech.prop.${r.prop}.${r.part || ''}`, power: 1.2 }); }
    r.mesh.parent?.remove(r.mesh); if (r.ownGeo) r.mesh.traverse((o) => o.geometry?.dispose());
    this.list.splice(this.list.indexOf(r), 1);
  }

  // ------------------------------------------------------------------ the frame
  update(dt) {
    if (!this.built) return;
    if (this.held && (!armOK(this.pilot.state.joints, 'R') || this.pilot.broken('armR'))) this.drop(); // (its arm gone: it falls)
    for (let i = this.list.length - 1; i >= 0; i--) { const r = this.list[i]; if (r.state === 'flying') this.flyOne(r, dt); }
  }
  /** One prop in the air: under gravity, point first or tumbling; striking the giant, a building, then the ground. */
  flyOne(r, dt) {
    const m = r.mesh, F = r.flight, prev = _a.copy(m.position);
    r.vel.y -= HANDLING.g * dt; m.position.addScaledVector(r.vel, dt);
    if (F?.javelin) m.lookAt(_b.copy(m.position).add(r.vel)); else { m.rotation.x += r.spin.x * dt; m.rotation.z += r.spin.z * dt; }
    const Gi = this.hangar.giant, C = this.hangar.city, by = 'courier';
    if (F && !F.giant && Gi?.c?.alive && Math.hypot(m.position.x - Gi.pos.x, m.position.z - Gi.pos.z) < GIANT_LOOK.radius + 1 && m.position.y > Gi.pos.y && m.position.y < Gi.pos.y + Gi.G.height) {
      F.giant = true; F.hit = 'giant'; // (the giant struck at all: the throw's hit, whatever came first)
      const res = Gi.blow({ weapon: r.prop, k: F.k, stagger: 20 * F.k, heavy: F.k >= 1, region: 'body', from: prev, by });
      this.game.events?.emit('mech.hit', { weapon: r.prop, region: 'body', staggered: !!res.staggered, pierced: !!res.pierced, crit: !!res.crit, ...(res.blocked ? { blocked: true } : {}), ...(res.felled ? { felled: true } : {}), by });
      if (--F.left <= 0) return this.endFlight(r);
    }
    if (F && C?.built) {
      const len = prev.distanceTo(m.position), hit = len > 0 ? C.raycast(prev, _f.subVectors(m.position, prev).normalize(), len) : null;
      if (hit && !F.struck.has(hit.rec.i)) {
        F.struck.add(hit.rec.i); F.hit ||= 'building';
        C.strike(F.javelin ? { kind: 'capsule', at: hit.point, to: _b.copy(hit.point).addScaledVector(_f, 6), r: 1.5 } : { kind: 'ball', at: hit.point, r: 1.5 + Math.cbrt(r.mass) * 0.6 }, Math.max(0.3, F.k), by);
        if (--F.left <= 0) { m.position.copy(hit.point); r.vel.multiplyScalar(0); return this.endFlight(r); }
      }
    }
    const top = C?.built ? C.topAt(m.position.x, m.position.z, m.position.y + 0.5) : null, floor = Math.max(PROVING.at.y, top ?? -Infinity) + 0.4;
    if (m.position.y <= floor) { m.position.y = floor; if (F) { F.hit ||= top !== null && top > PROVING.at.y + 1 ? 'building' : 'ground'; this.endFlight(r); } else this.rest(r); }
  }
  endFlight(r) {
    const F = r.flight; r.flight = null;
    this.game.events?.emit('mech.prop.throw', { prop: r.prop, hit: F.hit || 'ground', ...(F.javelin ? { javelin: true } : {}), ...(r.from === 'giant' ? { own: true } : {}), from: F.from, at: tenth(r.mesh.position), by: 'courier' });
    if (this.hangar.challenges?.catchBall(r)) return; // (a bowling challenge's tower rolls on to the pins instead of bursting: challenges.js)
    if (!r.P.hand || --r.hits <= 0) { this.shatter(r); this.game.events?.emit('mech.prop.break', { prop: r.prop, by: 'courier' }); return; } // (a slab and a tank burst where they land; a club spends a hit)
    r.vel.y = Math.min(0, r.vel.y); r.state = 'flying'; // (it drops the rest of the way and lies there)
  }
  rest(r) {
    r.state = 'rest'; r.vel.set(0, 0, 0);
    if (r.prop !== 'chunk' && r.prop !== 'tower') { r.mesh.rotation.set(0, r.mesh.rotation.y, 0); } // (a club lies flat on the ground)
    else { r.mesh.quaternion.slerp(_q.setFromEuler(new THREE.Euler(0, r.mesh.rotation.y, 0)), 0.5); }
  }
}

/** The low arc that reaches `to` from `from` at speed v (a lobbed shell's: tan θ = (v² - √(v⁴ - g(gx² + 2yv²))) / gx), or null past reach. */
function arc(from, to, v) {
  const g = HANDLING.g, dx = to.x - from.x, dz = to.z - from.z, x = Math.hypot(dx, dz), y = to.y - from.y;
  const disc = v ** 4 - g * (g * x * x + 2 * y * v * v); if (x < 1 || disc < 0) return null;
  const th = Math.atan((v * v - Math.sqrt(disc)) / (g * x));
  return new THREE.Vector3((dx / x) * Math.cos(th), Math.sin(th), (dz / x) * Math.cos(th));
}
