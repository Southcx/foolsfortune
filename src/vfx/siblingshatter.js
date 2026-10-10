// ---------------------------------------------------------------------------------------
// A SIBLING'S SHATTER: a sibling emptied by your blows (friendly fire, coop/sibling.js hurt) breaks as the Courier's vessel does, and is
// drawn back together beside you. The beats, in the game's own seconds: its own cracks run over it, Lachryma burning in them, as it
// recoils (CRACK); it bursts, the Courier's own burst at a sibling's size (dust, chips, Lachryma's ring, the glitter: courier/vessel/
// death.js), its clay breaking into shards of its own glazes that scatter and lie; a beat; then the shards shiver, rise and fly home to
// its place beside the Courier, and the body is built up from the feet as they arrive (the rig's own dissolve run backwards: render/
// outline.js), every join gold (kintsugi, as the Courier is made whole: courier/vessel/kintsugi.js) until the gold fades. A shard is a
// piece of a pot's wall: the glaze outside, the bare clay inside and along the break. Wanda's shards are in the sound already
// (audio/vessel.js siblingHit, on `sibling.hit` when it is down): the burst lands on them. `sibling.reform` is said as the shards rise
// (as `courier.reform` is when the Courier is set down), with the seconds until it is whole.
// No program of its own: the shards wear the Courier's shatter chips' material (vfx/particles.js Chips), cloned for each glaze colour;
// the cracks and the gold are the vessel's, on the sibling's own crack uniforms (courier/vessel/vessel.js dress); the build-up is the
// rig's own dissolve.
//
// Prior art: the Courier's shatter (courier/vessel/death.js), Okami's Rejuvenation (a broken thing drawn whole again, its pieces flying
// home), the rewinds of Prince of Persia: The Sands of Time and Braid, kintsugi (the join shown in gold), and a potsherd's anatomy (a
// glazed face over a bare clay body, which shows at the break).
//
//   game.siblingShatter = new SiblingShatter(game)   .begin(sibling, dir?) -> bool (false: no look; the caller sets it down itself)
//   .holds(sibling) -> bool (in pieces or being drawn back: its mind and its body wait)   .update(dt)   .list (the shatters running)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T, PALETTE } from '../core/config.js';
import { GROUPS } from '../core/physics.js';

/** The beats (the game's seconds): the cracks run; the shards lie until `home`; they shiver; the body is built from the feet to the crown;
 *  the gold fades. */
const BEAT = { crack: 0.16, home: 1.75, stir: 0.18, build: 0.5, gold: 1.7 };
const FAR = 45; // (m: set down farther than this from its shards, it is built from Lachryma where it stands and the shards sink where they lie)
const HEIGHT = 1.9; // (the body's height, as the dissolve measures it: courier/character.js setDissolve)
const LACH = 0xb49be6;
const GLOW = 0.4; // (the Lachryma in a shard's breaks at its brightest: a tint over the glaze, never instead of it)
/** The shards each region of the body breaks into: how many, and how big across (m). The colour is the region's glaze. */
const PIECES = [['body', 14, 0.2], ['trim', 2, 0.12], ['mask', 2, 0.13], ['hair', 4, 0.15], ['skin', 4, 0.16]];
/** A shard's shape, in its own unit space: an irregular heptagon on a shallow dome (the pot's curve), `thick` deep. */
const SHARD = { rim: [0.92, 0.7, 1, 0.78, 0.95, 0.66, 0.86], curve: 0.28, thick: 0.16 };
const UP = new THREE.Vector3(0, 1, 0), DOWN = { x: 0, y: -1, z: 0 };
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _n = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
const _m = new THREE.Matrix4(), _s = new THREE.Vector3(), _sw = new THREE.Vector4(), _si = new THREE.Vector4(), _o = { x: 0, y: 0, z: 0 };
const rnd = (a, b) => a + Math.random() * (b - a);
const smooth = (k) => k * k * (3 - 2 * k);

/** The two halves of a shard: the glazed face, and the clay under it with the broken edge round it. Made once. */
let GEO = null;
function shardGeometry() {
  if (GEO) return GEO;
  const { rim, curve, thick } = SHARD, n = rim.length;
  const ring = (k, y0, shrink) => rim.map((r, i) => { const a = (i / n) * Math.PI * 2 + (i % 2 ? 0.16 : -0.08), rr = 0.5 * r * k * shrink; return new THREE.Vector3(Math.cos(a) * rr, y0 - curve * (rr / 0.5) ** 2, Math.sin(a) * rr); });
  const face = (y0, shrink) => ({ c: new THREE.Vector3(0, y0, 0), mid: ring(0.5, y0, shrink), out: ring(1, y0, shrink) });
  const top = face(0, 1), bot = face(-thick, 0.93); // (the break bevels in a little: a conchoidal edge, not a saw cut)
  const tri = (list, a, b, c, out) => { // (each triangle wound to face `out`: front faces only, as the chips are)
    const nrm = _v.subVectors(b, a).cross(_w.subVectors(c, a));
    list.push(...(nrm.dot(out) >= 0 ? [a, b, c] : [a, c, b]));
  };
  const glaze = [], clay = [];
  for (const [F, list, out] of [[top, glaze, UP], [bot, clay, new THREE.Vector3(0, -1, 0)]]) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      tri(list, F.c, F.mid[i], F.mid[j], out);
      tri(list, F.mid[i], F.out[i], F.out[j], out); tri(list, F.mid[i], F.out[j], F.mid[j], out);
    }
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, out = new THREE.Vector3().addVectors(top.out[i], top.out[j]).setY(0).normalize();
    tri(clay, top.out[i], bot.out[i], bot.out[j], out); tri(clay, top.out[i], bot.out[j], top.out[j], out);
  }
  const geo = (pts) => { const g = new THREE.BufferGeometry().setFromPoints(pts); g.computeVertexNormals(); return g; };
  GEO = { glaze: geo(glaze), clay: geo(clay), lift: curve + thick }; // (lift: how far the dome's crown stands over the ground when it lies glaze up)
  return GEO;
}

/** Vertices spread evenly over a mesh (farthest-point sampling in its bind pose): the same model for every sibling, so each is found once. */
const SAMPLES = new Map();
function samples(o, n) {
  const P = o.geometry.attributes.position, N = P.count, key = `${o.name}:${N}:${n}`;
  let s = SAMPLES.get(key);
  if (s) return s;
  const d = new Float32Array(N).fill(Infinity), xyz = new Float32Array(N * 3); // (the positions copied out once: the attribute's getters in the loop cost ten times as much)
  let cur = 0;
  for (let i = 0; i < N; i++) { xyz[i * 3] = P.getX(i); xyz[i * 3 + 1] = P.getY(i); xyz[i * 3 + 2] = P.getZ(i); if (xyz[i * 3 + 1] > xyz[cur * 3 + 1]) cur = i; } // (from the highest: the same start every time)
  s = [];
  while (s.length < Math.min(n, N)) {
    s.push(cur);
    const x = xyz[cur * 3], y = xyz[cur * 3 + 1], z = xyz[cur * 3 + 2];
    let best = 0, bd = -1;
    for (let i = 0, j = 0; i < N; i++, j += 3) { const dx = xyz[j] - x, dy = xyz[j + 1] - y, dz = xyz[j + 2] - z, dd = Math.min(d[i], dx * dx + dy * dy + dz * dz); d[i] = dd; if (dd > bd) { bd = dd; best = i; } }
    cur = best;
  }
  SAMPLES.set(key, s);
  return s;
}

/** The parts of a rig that break, each its mesh, its material and the vertices its shards come from. */
function partsOf(R) {
  const meshes = [], out = [];
  R.model?.traverse((o) => { if (o.isSkinnedMesh && !o.userData.isOutline) meshes.push(o); });
  for (const [region, n, size] of PIECES) {
    const m = R.regionMats?.[region], o = m && meshes.find((x) => x.material === m);
    if (o?.geometry.attributes.normal && o.skeleton) out.push({ o, m, size, idx: samples(o, n) });
  }
  return out;
}

/** A vertex's normal as the body is posed now (its strongest bone's turn), in the world. */
function posedNormal(o, i, out) {
  const g = o.geometry, sk = o.skeleton;
  out.fromBufferAttribute(g.attributes.normal, i);
  _si.fromBufferAttribute(g.attributes.skinIndex, i); _sw.fromBufferAttribute(g.attributes.skinWeight, i);
  let k = 0;
  for (let c = 1; c < 4; c++) if (_sw.getComponent(c) > _sw.getComponent(k)) k = c;
  const b = _si.getComponent(k);
  _m.multiplyMatrices(sk.bones[b].matrixWorld, sk.boneInverses[b]).multiply(o.bindMatrix).premultiply(o.bindMatrixInverse).premultiply(o.matrixWorld);
  return out.transformDirection(_m);
}

/** What a region's shards wear: its glaze's colour and finish, or (a part left as it was painted) its own. */
function glazeOf(m) {
  const g = m.userData.glaze, on = m.userData.finish?.uFinOn?.value;
  return on && g ? { color: g.color, rough: g.rough ?? 0.5, metal: g.metal ?? 0 } : { color: m.map ? PALETTE.pale : m.color.getHex(), rough: m.roughness, metal: m.metalness };
}

export class SiblingShatter {
  constructor(game) { this.game = game; this.list = []; }

  /** A sibling emptied: the look takes it. False when there is nothing to break (no rig, or no fx), and the caller sets it down itself. */
  begin(S, dir = null) {
    const g = this.game;
    if (!S?.rig?.root || !g.fx?.chips || S.rig.hidden) return false;
    const was = this.list.find((r) => r.S === S);
    if (was && !was.whole) return true; // (already in pieces)
    if (was) this.end(was);
    const r = { S, t: 0, dir: dir ? new THREE.Vector3().copy(dir).setY(0).normalize() : new THREE.Vector3(), burst: false, home: false, whole: false, gold: 0, shards: [], meshes: [], parts: partsOf(S.rig) }; // (the parts found and their points chosen now, while the cracks run: the burst frame only reads them)
    this.list.push(r);
    S.rig.flinch?.(1, dir); // (the blow taken: the upper body recoils as the cracks run, anim/hurt.js)
    return true;
  }

  /** In pieces, or being drawn back: the sibling's mind and body wait (coop/sibling.js fixed). */
  holds(S) { return this.list.some((r) => r.S === S && !r.whole); }

  update(dt) {
    for (const r of [...this.list]) {
      if (!this.game.party?.list?.includes(r.S)) { this.end(r); continue; } // (dismissed in pieces: the shards go with it)
      r.t += dt;
      const kin = r.S.rig.kinU;
      if (!r.burst) {
        const k = Math.min(1, r.t / BEAT.crack);
        if (kin) for (let i = 0; i < 6; i++) { kin.uDmg.value[i] = Math.min(1, k * (1 + (5 - i) * 0.12)); kin.uMend.value[i] = 0; } // (the cracks run over all of it, from the mask down to the legs: courier/vessel/damage.js REGIONS)
        if (r.t >= BEAT.crack) { this.burst(r); this.pose(r); } // (posed in the frame it bursts: an instance not yet set stands at the world's origin)
        continue;
      }
      if (!r.home && r.t >= BEAT.home) this.homeward(r);
      if (r.home) this.drawBack(r, dt); else this.scatter(r, dt);
      this.pose(r);
      if (r.whole) {
        r.gold = Math.max(0, r.gold - dt / BEAT.gold);
        if (kin) for (let i = 0; i < 6; i++) { kin.uTrail.value[i] = r.gold; kin.uPeak.value[i] = r.gold > 0 ? 1 : 0; }
        if (r.gold <= 0) this.end(r);
      }
    }
  }

  // ---- the burst: the body becomes its shards
  burst(r) {
    const g = this.game, S = r.S, R = S.rig, fx = g.fx, geo = shardGeometry();
    r.burst = true;
    R.root.updateMatrixWorld(true);
    r.pos0 = R.root.position.clone(); r.yaw0 = R.root.rotation.y;
    const mid = r.pos0.clone().setY(r.pos0.y + 0.95), qYawInv = new THREE.Quaternion().setFromAxisAngle(UP, -r.yaw0);
    const base = fx.chips.mesh.material, emiss = new THREE.Color(LACH);
    const mat = (color, rough, metal) => { const m = base.clone(); m.color.setHex(color); m.roughness = rough; m.metalness = metal; m.emissive.copy(emiss); m.emissiveIntensity = 0; return m; };
    for (const { o, m, size, idx } of r.parts) {
      const look = glazeOf(m), part = { mesh: new THREE.InstancedMesh(geo.glaze, mat(look.color, look.rough, look.metal), idx.length), from: r.shards.length };
      for (const i of idx) {
        const p = o.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(o.matrixWorld), nrm = posedNormal(o, i, new THREE.Vector3());
        const q = new THREE.Quaternion().setFromUnitVectors(UP, nrm).multiply(_q.setFromAxisAngle(UP, rnd(0, Math.PI * 2)));
        const out = _v.subVectors(p, mid).setY(0);
        const vel = nrm.clone().multiplyScalar(rnd(0.9, 1.7)).addScaledVector(out, 0.7).addScaledVector(r.dir, 1).add(_w.set(0, rnd(1.4, 2.6), 0)); // (out and up, a little with the blow: they lie round where it stood)
        const s = size * rnd(0.85, 1.15);
        r.shards.push({
          p, vel, q, w: new THREE.Vector3().randomDirection().multiplyScalar(rnd(6, 14)), scale: new THREE.Vector3(s * rnd(0.8, 1.25), s, s * rnd(0.8, 1.25)),
          floor: null, rest: false, up: Math.random() < 0.75, part: r.meshes.length, // (up: it comes to lie glaze up, three times in four, so its colours read on the floor)
          homeL: _w.subVectors(p, r.pos0).applyQuaternion(qYawInv).clone(), homeQL: qYawInv.clone().multiply(q), hn: THREE.MathUtils.clamp((p.y - r.pos0.y) / HEIGHT, 0, 1),
        });
      }
      r.meshes.push(part);
    }
    const all = r.shards.length;
    r.clay = new THREE.InstancedMesh(geo.clay, mat(PALETTE.fracture, 0.9, 0), all);
    for (const M of [...r.meshes.map((x) => x.mesh), r.clay]) { M.instanceMatrix.setUsage(THREE.DynamicDrawUsage); M.frustumCulled = false; M.castShadow = false; g.scene.add(M); }
    R.setHidden(true);
    if (R.kinU) for (let i = 0; i < 6; i++) R.kinU.uDmg.value[i] = 0;
    // the Courier's burst, at a sibling's size (courier/vessel/death.js): dust and chips, Lachryma's ring and its own colour's, the glitter
    fx.shatterBurst?.(mid.clone(), 1, UP, { dust: 0.8, chips: 2 });
    fx.chipsOff?.(mid.clone(), UP, 22, 1.5);
    fx.toneBurst?.(mid.clone(), LACH, 0.8, 1.3);
    fx.toneBurst?.(mid.clone().setY(mid.y + 0.4), S.color ?? PALETTE.hot, 0.55, 0.9);
    fx.glitter?.([mid.clone(), mid.clone().setY(mid.y + 0.6), mid.clone().setY(mid.y - 0.5)], mid.clone(), UP, emiss);
    r.glow = 1;
  }

  /** The shards fly out, fall, bounce once or twice and lie, glaze up or the clay up. */
  scatter(r, dt) {
    const grav = T.physics.gravity;
    r.glow = Math.max(0, r.glow - dt * 2); // (the Lachryma burns out of the breaks)
    for (const s of r.shards) {
      if (s.rest) { s.q.slerp(s.restQ, Math.min(1, dt * 14)); continue; }
      s.vel.y -= grav * dt;
      s.p.addScaledVector(s.vel, dt);
      _q.setFromAxisAngle(_v.copy(s.w).normalize(), s.w.length() * dt); s.q.premultiply(_q);
      if (s.floor === null && s.vel.y < 0) s.floor = this.ground(s.p, r);
      const lie = (s.floor ?? r.pos0.y) + (s.up ? GEO.lift * s.scale.y : 0.004);
      if (s.p.y < lie) {
        s.p.y = lie; s.vel.y *= -0.3; s.vel.x *= 0.5; s.vel.z *= 0.5; s.w.multiplyScalar(0.45);
        s.floor = this.ground(s.p, r);
        if (Math.abs(s.vel.y) < 0.7) { // (it lies: turned flat, its yaw kept)
          s.rest = true;
          const yaw = Math.atan2(_v.set(1, 0, 0).applyQuaternion(s.q).z, _v.x);
          s.restQ = new THREE.Quaternion().setFromAxisAngle(UP, -yaw).multiply(_q2.setFromAxisAngle(_w.set(1, 0, 0), s.up ? 0 : Math.PI));
        }
      }
    }
  }

  /** Where the ground is under a point (the world only, the sibling's own body left out); null where there is none. */
  ground(p, r) {
    const ph = this.game.physics;
    if (!ph?.raycast) return null;
    _o.x = p.x; _o.y = p.y + 0.6; _o.z = p.z;
    const hit = ph.raycast(_o, DOWN, 8, r.S.body?.collider, GROUPS.controllerQuery, (c) => !c.isSensor());
    return hit ? hit.point.y : null;
  }

  // ---- the way back: set down beside its leader, the shards fly home and the body is built up from the feet as they arrive
  homeward(r) {
    const g = this.game, S = r.S, R = S.rig;
    r.home = true;
    S.warp(S.leader || g.player);
    r.pos1 = S.body.pos.clone(); r.yaw1 = S.body.bodyYaw ?? r.yaw0;
    const qYaw = new THREE.Quaternion().setFromAxisAngle(UP, r.yaw1);
    const c = new THREE.Vector3();
    for (const s of r.shards) c.add(s.p);
    c.multiplyScalar(1 / Math.max(1, r.shards.length));
    const d = c.distanceTo(r.pos1);
    r.far = d > FAR;
    r.fly = THREE.MathUtils.clamp(0.55 + d / 30, 0.55, 1.2);
    r.build0 = BEAT.home + BEAT.stir + (r.far ? 0 : r.fly) - 0.05; // (the dissolve starts as the first shards reach the feet)
    for (const s of r.shards) {
      s.from = s.p.clone(); s.fromQ = s.q.clone();
      s.to = s.homeL.clone().applyQuaternion(qYaw).add(r.pos1); s.toQ = qYaw.clone().multiply(s.homeQL);
      s.arrive = r.build0 + BEAT.build * (0.72 * s.hn + 0.19) / 1.06; // (when the dissolve's edge reaches the shard's height: render/outline.js)
      s.leave = s.arrive - r.fly;
      const side = _v.subVectors(s.to, s.from).cross(UP); if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
      s.bend = side.normalize().multiplyScalar(rnd(-0.35, 0.35) * Math.sqrt(Math.max(1, d))).add(_w.set(0, 0.4 + Math.min(4, d * 0.12), 0)).clone(); // (an arc, swung a little to one side: they gather, they do not queue)
    }
    g.events?.emit('sibling.reform', { sibling: S.id, whole: +(r.build0 + BEAT.build - r.t).toFixed(2), far: r.far, by: 'sibling' }); // (its shards rise: the moment a sound of their flight home would start, and the seconds until it is whole)
    R.setDissolve(1, r.pos1.y, HEIGHT); R.setHidden(false);
    if (R.kinU) for (let i = 0; i < 6; i++) { R.kinU.uDmg.value[i] = 0.75; R.kinU.uMend.value[i] = 1; } // (the joins, gold while it is drawn together)
    g.fx?.toneBurst?.(r.pos1.clone().setY(r.pos1.y + 0.05), LACH, 0.35, 0.8); // (where it will stand)
  }

  drawBack(r, dt) {
    const g = this.game, R = r.S.rig, t = r.t, add = g.fx?.add;
    const u = THREE.MathUtils.clamp((t - r.build0) / BEAT.build, 0, 1), cut = -0.05 + 1.06 * u;
    R.setDissolve(THREE.MathUtils.clamp((1 - cut) / 1.05, 0, 1), r.pos1.y, HEIGHT);
    const stir = t < BEAT.home + BEAT.stir;
    r.glow = stir ? Math.min(0.6, r.glow + dt * 4) : 0.6;
    for (const s of r.shards) {
      if (s.done) continue;
      if (r.far) { // (too far to fly: they sink where they lie, and the body rises from Lachryma at the feet)
        const k = Math.min(1, (t - BEAT.home) / 0.6);
        s.shrink = 1 - k; if (k >= 1) s.done = true;
        if (Math.random() < dt * 10) add?.emit({ pos: _v.copy(r.pos1).add(_w.set(rnd(-0.3, 0.3), 0.05, rnd(-0.3, 0.3))), vel: _n.set(0, rnd(0.8, 1.6), 0), life: 0.6, size: 0.05, sizeEnd: 0.01, color: LACH, alpha: 0.8, drag: 1 });
        continue;
      }
      if (t < s.leave) { // (stirring where it lies: a shiver, a little lift)
        const k = Math.max(0, (t - BEAT.home) / BEAT.stir);
        s.p.copy(s.from).setY(s.from.y + 0.03 * Math.min(1, k) * Math.abs(Math.sin(t * 40 + s.hn * 9)));
        s.q.copy(s.fromQ).multiply(_q.setFromAxisAngle(_v.set(Math.sin(s.hn * 13), 0, Math.cos(s.hn * 13)), 0.12 * Math.min(1, k) * Math.sin(t * 34 + s.hn * 5)));
        continue;
      }
      const k = Math.min(1, (t - s.leave) / r.fly), e = smooth(k);
      // a quadratic arc from where it lay to its place on the body (the bend is the arc's middle, raised)
      _v.lerpVectors(s.from, s.to, e); const b = 4 * e * (1 - e);
      s.p.copy(_v).addScaledVector(s.bend, b);
      s.q.slerpQuaternions(s.fromQ, s.toQ, smooth(Math.min(1, k * 1.25)));
      if (k < 0.97 && Math.random() < dt * 14) add?.emit({ pos: s.p, vel: _n.set(rnd(-0.2, 0.2), rnd(-0.1, 0.3), rnd(-0.2, 0.2)), life: 0.35, size: 0.035, sizeEnd: 0.006, color: LACH, alpha: 0.8, drag: 2 }); // (the Lachryma drawing it, a thread of motes behind it)
      if (k >= 1) { s.done = true; add?.emit({ pos: s.to, vel: _n.set(0, 0.3, 0), life: 0.25, size: 0.06, sizeEnd: 0.01, color: PALETTE.hot, alpha: 0.9, drag: 3 }); }
    }
    if (u >= 1 && !r.whole) {
      r.whole = true; r.gold = 1;
      R.setDissolve(0, r.pos1.y, HEIGHT);
      if (R.kinU) for (let i = 0; i < 6; i++) { R.kinU.uDmg.value[i] = 0; R.kinU.uMend.value[i] = 0; } // (made whole: the gold flashes through every join and fades, as the Courier's does)
      for (const M of [...r.meshes.map((x) => x.mesh), r.clay]) M.visible = false;
    }
  }

  /** The shards' instances, from where each is now; the glow of the Lachryma in their breaks. */
  pose(r) {
    if (r.whole) return;
    const tiny = 1e-4; // (an instance gone home is shrunk to nothing, never to zero: casebook rule 92)
    for (let i = 0; i < r.shards.length; i++) {
      const s = r.shards[i], k = s.done ? tiny : s.shrink ?? 1;
      _m.compose(s.p, s.q, _s.copy(s.scale).multiplyScalar(Math.max(tiny, k)));
      r.meshes[s.part].mesh.setMatrixAt(i - r.meshes[s.part].from, _m);
      r.clay.setMatrixAt(i, _m);
    }
    for (const M of [...r.meshes.map((x) => x.mesh), r.clay]) { M.instanceMatrix.needsUpdate = true; M.material.emissiveIntensity = GLOW * r.glow; }
  }

  /** Over (or the sibling gone): the shards taken out, the body whole and shown, its cracks clear. */
  end(r) {
    const i = this.list.indexOf(r);
    if (i >= 0) this.list.splice(i, 1);
    for (const M of [...r.meshes.map((x) => x.mesh), ...(r.clay ? [r.clay] : [])]) { M.parent?.remove(M); M.material.dispose(); M.dispose(); }
    const R = r.S.rig, kin = R?.kinU;
    if (kin) for (let k = 0; k < 6; k++) { kin.uDmg.value[k] = 0; kin.uMend.value[k] = 0; kin.uTrail.value[k] = 0; kin.uPeak.value[k] = 0; }
    if (R?.root && this.game.party?.list?.includes(r.S)) { R.setDissolve(0); R.setHidden(false); }
  }
}
