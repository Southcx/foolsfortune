// ---------------------------------------------------------------------------------------
// THE BROADSIDE'S LOOK: the free helm's heavy guns (Petra's runtime, world/opensea/seafight.js `broadside`; Dovina's numbers, OPEN-SEA.md
// 14.6) drawn, owned by the fight's look (vfx/opensea/seafightlook.js) which hands it what is heavy. Nothing here is counted or decides.
//   THE PORTS     the ship's gun ports (vfx/shipkit/gunports.js) driven from the fight: a side cleared for action (a sea serpent about, or
//                 a broadside in the last real seconds) opens its lids and runs its guns out while loaded; firing kicks them in, the lids
//                 stay up a beat, then shut while the side reloads, and open again with the guns run out when it is loaded.
//   THE ROUND SHOT  each heavy shot a dark iron ball (instanced: one draw), a faint trail of embers and a breath of smoke behind it.
//   THE GUN'S MOUTH  a cannon's: a short white-hot flash, sparks thrown along the aim, a ring of white smoke blown out round the muzzle and a
//                 bank of it left hanging, drifting downwind (the open sea's wind, `opensea.wind.to`) and rising as it thins; the hull
//                 shivers away from the side that fired.
//   A DRY PULL    the side not yet loaded: a small grey wisp at each port and nothing more (no words: the tile's rim says the reload).
//   WHERE IT FALLS  short of its mark a tall white water spout (the water's crown, `water.disturb` 'dive', and a column of foam falling
//                 back, its mist drifting); on the serpent chips of its hide and a burst of gold sparks.
// Prior art: Assassin's Creed IV: Black Flag's broadside (the ring of smoke, the bank that hangs between the ships, the spouts walking up to
// a target), Sea of Thieves' cannonball (a dark ball you can follow, its splash a column), Master and Commander's gun deck (the recoil
// inboard, the lids hauled up), The Wind Waker's cannon (a puff at the mouth, a ring of spray where it lands short).
//
//   const B = new BroadsideLook(game)   .draw(fight, heavy [shot], dt)   .muzzle(from, dir)   .hit(point, dir)   .splash(pos)
//   .fired(side)   .dry(side)   .parked() -> [mesh]   (it listens for sea.broadside and sea.broadside.dry itself)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** ball: the drawn ball's radius (m: its hit sphere is 0.6) and the cap; ember / smoke: the trail's colour; cleared: real s a side stays
 *  cleared for action after a broadside with no serpent about; lidUp: real s the lids stay up after firing; ring / bank: the muzzle smoke's
 *  ring (count, speed m/s) and the bank left hanging (count, life s); drift: the wind's push on the bank (m/s at k 1); spout: the column's
 *  foam (count, speed m/s); shiver: the hull's roll on firing (rad) and its decay (1/s). */
export const BROADSIDE_LOOK = {
  ball: { r: 0.5, cap: 32 }, ember: 0xff7a2a, smoke: 0xefece4, gold: 0xffd36a,
  cleared: 10, lidUp: 1.2, ring: { n: 10, speed: 7 }, bank: { n: 3, life: 3.6 }, drift: 3.5, spout: { n: 26, speed: 15 }, shiver: { k: 0.035, decay: 3.2 },
};
const B = BROADSIDE_LOOK, UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _w = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
const _hide = new THREE.Matrix4().makeScale(0, 0, 0);
const rnd = (k = 1) => (Math.random() - 0.5) * 2 * k;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export class BroadsideLook {
  constructor(game) {
    this.game = game; this.t = 0; this.last = { port: -1e9, starboard: -1e9 }; this.shiverT = null; this.shiverS = 1; this.trailN = 0;
    this.balls = new THREE.InstancedMesh(new THREE.SphereGeometry(B.ball.r, 14, 10), new THREE.MeshStandardMaterial({ color: 0x1d1b1a, roughness: 0.42, metalness: 0.7, emissive: 0x2a0c02, emissiveIntensity: 0.6 }), B.ball.cap);
    this.balls.frustumCulled = false; this.balls.count = 0; this.balls.userData.zone = 'opensea'; this.balls.name = 'broadside-balls';
    game.scene?.add(this.balls);
    game.events?.on?.('sea.broadside', (e) => this.fired(e.side));
    game.events?.on?.('sea.broadside.dry', (e) => this.dry(e.side));
  }
  parked() { return [this.balls]; }
  get look() { return this.game.opensea?.helm?.look || null; }
  get fx() { return this.game.fx || null; }
  /** The sea's push on smoke now (m/s, a world vector), or none. */
  wind(out) { const W = this.game.opensea?.wind; return W ? out.set(Math.sin(W.to), 0, Math.cos(W.to)).multiplyScalar(B.drift * (0.4 + 0.6 * (W.k ?? 1))) : out.set(0, 0, 0); }

  /** Each frame: the heavy shots as balls with their trail, the ports driven by the fight's reload, the hull's shiver. */
  draw(fight, heavy, dt) {
    this.t += dt;
    const M = this.balls, n = Math.min(heavy.length, B.ball.cap), fx = this.fx, trail = (this.trailN = (this.trailN + 1) % 3) === 0;
    for (let i = 0; i < n; i++) {
      const s = heavy[i]; _q.setFromUnitVectors(UP, _v.copy(s.vel).normalize()); M.setMatrixAt(i, _m.compose(s.pos, _q, _s.set(1, 1, 1)));
      if (!fx?.add) continue;
      fx.add.emit({ pos: s.pos.clone().add(V(rnd(0.15), rnd(0.15), rnd(0.15))), vel: _v.copy(s.vel).multiplyScalar(-0.04).add(V(rnd(0.5), rnd(0.5), rnd(0.5))).clone(), life: 0.32, size: 0.3, sizeEnd: 0.04, color: B.ember, alpha: 0.55, drag: 2, floor: -1e9 });
      if (trail) fx.alpha?.emit({ pos: s.pos.clone(), vel: V(rnd(0.3), 0.4, rnd(0.3)), life: 0.7, size: 0.3, sizeEnd: 0.9, color: 0x8d8a86, alpha: 0.16, drag: 1, floor: -1e9 });
    }
    if (!n) M.setMatrixAt(0, _hide);
    M.count = Math.max(n, 1); M.instanceMatrix.needsUpdate = true; M.visible = n > 0;
    // the ports: cleared for action while a serpent lives or just after a broadside; open while loaded or just fired, guns out while loaded
    const L = this.look, P = L?.gunPorts, R = this.game.opensea;
    if (P?.count && R?.sailing) {
      const rl = fight.reload || [0, 0], hunt = !!fight.serpent, want = {};
      for (const [k, side] of [[0, 'port'], [1, 'starboard']]) {
        const since = this.t - this.last[side], cleared = hunt || since < B.cleared, loaded = (rl[k] ?? 0) <= 0;
        want[side] = { open: cleared && (loaded || since < B.lidUp), out: loaded };
      }
      P.tick(dt, want);
    }
    // the hull's shiver: a roll away from the side that fired, dying out (on top of the helm's heel, set this frame by helm.js)
    if (this.shiverT != null && L?.body && R?.sailing) {
      const u = (this.shiverT += dt), k = B.shiver.k * Math.exp(-B.shiver.decay * u) * Math.cos(u * 9);
      L.body.rotation.z += this.shiverS * k; if (u > 2) this.shiverT = null;
    }
  }

  /** A side fired (sea.broadside): its guns kicked in, the hull's shiver begun. */
  fired(side) {
    this.last[side] = this.t; this.look?.gunPorts?.fire(side);
    this.shiverT = 0; this.shiverS = side === 'port' ? -1 : 1;
  }

  /** A side pulled before it is loaded (sea.broadside.dry): a small grey wisp at each port. */
  dry(side) {
    const fx = this.fx, pts = this.look?.ports?.(side); if (!fx?.alpha || !pts) return;
    for (const p of pts) for (let i = 0; i < 2; i++) fx.alpha.emit({ pos: p.clone(), vel: V(rnd(0.4), 0.5 + Math.random() * 0.5, rnd(0.4)), life: 0.6, size: 0.18, sizeEnd: 0.7, color: 0x9c9a96, alpha: 0.32, drag: 2, floor: -1e9 });
  }

  /** A heavy gun fires: the flash, its sparks, the ring of smoke and the bank left hanging downwind. */
  muzzle(from, dir) {
    const fx = this.fx; if (!fx?.add) return;
    _a.crossVectors(dir, UP); if (_a.lengthSq() < 1e-6) _a.set(1, 0, 0); _a.normalize(); _b.crossVectors(_a, dir).normalize();
    this.wind(_w); const K = Math.max(1, 0.55 * (this.game?.opensea?.helm?.look?.scale || 1)); // (the gun's smoke at the hull's size: a 5x sloop's guns are 12 pounders, not pistols)
    fx.add.emit({ pos: from.clone().addScaledVector(dir, 0.5 * K), vel: dir.clone().multiplyScalar(4 * K), life: 0.09, size: 1.8 * K, sizeEnd: 0.6 * K, color: 0xfff1c8, alpha: 1, drag: 4, floor: -1e9 });
    fx.add.emit({ pos: from.clone().addScaledVector(dir, 1.4 * K), vel: dir.clone().multiplyScalar(8 * K), life: 0.12, size: 1.2 * K, sizeEnd: 0.2 * K, color: B.ember, alpha: 0.9, drag: 4, floor: -1e9 });
    for (let i = 0; i < 7; i++) fx.add.emit({ pos: from.clone(), vel: _v.copy(dir).multiplyScalar(14 + Math.random() * 10).add(V(rnd(2.5), rnd(2.5), rnd(2.5))).clone(), life: 0.18 + Math.random() * 0.12, size: 0.14, sizeEnd: 0.02, color: i % 2 ? B.gold : B.ember, alpha: 1, drag: 3, gravity: 4, floor: -1e9 });
    if (!fx.alpha) return;
    for (let i = 0; i < B.ring.n; i++) { // (the ring blown out round the muzzle, square to the aim)
      const a = (i / B.ring.n) * Math.PI * 2, o = _v.copy(_a).multiplyScalar(Math.cos(a)).addScaledVector(_b, Math.sin(a));
      fx.alpha.emit({ pos: from.clone().addScaledVector(dir, 0.9 * K).addScaledVector(o, 0.3 * K), vel: o.clone().multiplyScalar(B.ring.speed * K * (0.85 + Math.random() * 0.3)).addScaledVector(dir, 5 * K).add(_w), life: 1.6 + Math.random() * 0.5, size: 0.6 * K, sizeEnd: 2.4 * K, color: B.smoke, alpha: 0.5, drag: 3.2, gravity: -0.3, floor: -1e9 });
    }
    for (let i = 0; i < B.bank.n + 2; i++) { // (the bank: slower, bigger, longer, carried off on the wind)
      fx.alpha.emit({ pos: from.clone().addScaledVector(dir, (1.5 + i * 1.6) * K).add(V(rnd(0.5 * K), rnd(0.3 * K), rnd(0.5 * K))), vel: dir.clone().multiplyScalar(2.2 * K).add(_w).add(V(0, 0.35 * K, 0)), life: B.bank.life * 1.5 + Math.random(), size: 1.4 * K, sizeEnd: 4.6 * K, color: B.smoke, alpha: 0.36, drag: 0.22, gravity: -0.2, floor: -1e9 });
    }
  }

  /** A ball on the serpent: chips of its hide and a burst of gold sparks. */
  hit(point, dir) {
    const fx = this.fx; if (!fx) return;
    fx.impact?.(point, _v.copy(dir).negate().normalize(), { color: 0x9aa7b0, sparks: 12, dust: 6 });
    fx.chipsOff?.(point, _v.copy(dir).negate().normalize(), 10, 2.2);
    if (!fx.add) return;
    for (let i = 0; i < 26; i++) fx.add.emit({ pos: point.clone(), vel: new THREE.Vector3().randomDirection().multiplyScalar(5 + Math.random() * 7).addScaledVector(dir, -4).add(V(0, 2, 0)), life: 0.35 + Math.random() * 0.25, size: 0.13, sizeEnd: 0.02, color: B.gold, alpha: 1, drag: 2, gravity: 7, floor: -1e9 });
    fx.add.emit({ pos: point.clone(), vel: V(0, 0, 0), life: 0.1, size: 2.2, sizeEnd: 0.8, color: 0xfff1c8, alpha: 0.9, drag: 1, floor: -1e9 });
  }

  /** A ball falling short: the water's crown, a tall column of foam falling back, its mist on the wind. */
  splash(pos) {
    const g = this.game, W = g.water, fx = this.fx, y = g.seaSerpents?.surf?.(pos.x, pos.z) ?? pos.y;
    W?.disturb?.(pos.x, pos.z, 2.2, 'dive', y);
    if (!fx?.foam) return;
    this.wind(_w);
    for (let i = 0; i < B.spout.n; i++) {
      const up = B.spout.speed * (0.55 + Math.random() * 0.5), r = Math.random() * 1.1, a = Math.random() * Math.PI * 2;
      fx.foam.emit({ pos: V(pos.x + Math.cos(a) * r * 0.5, y, pos.z + Math.sin(a) * r * 0.5), vel: V(Math.cos(a) * r * 1.4, up, Math.sin(a) * r * 1.4), life: 1.1 + Math.random() * 0.5, size: 0.42 + Math.random() * 0.25, sizeEnd: 0.8, color: 0xffffff, alpha: 0.95, drag: 0.4, gravity: 18, floor: y - 0.3 });
    }
    for (let i = 0; i < 5; i++) fx.alpha?.emit({ pos: V(pos.x + rnd(0.6), y + 1 + i * 1.6, pos.z + rnd(0.6)), vel: _v.copy(_w).multiplyScalar(0.6).add(V(rnd(0.6), 1.2, rnd(0.6))).clone(), life: 1.6 + Math.random() * 0.6, size: 1.0, sizeEnd: 3.2, color: 0xf4f7f8, alpha: 0.3, drag: 0.6, floor: -1e9 });
  }
}
