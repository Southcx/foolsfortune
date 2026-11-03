// ---------------------------------------------------------------------------------------
// THE SMALL TELLS ON THE WATER (docs/plans/OPEN-SEA.md 15.6; GAPS.md G157): what the open sea shows of what lies there before the ship is
// on it, world marks with no words, read over the room's own data (never changing it), seen from the helm's chase camera at a distance:
//   GULLS          a few circling over each wreck (the room's props, `marks` of kind 'wreck') and over each of the game day's herds (the
//                  room's `herds.list`, round where its bodies are now, eased as they scatter and regroup): soaring in slow rings at
//                  different heights, now and then a burst of wingbeats. One instanced mesh for every gull (`TELLS.gulls.max`), its wing
//                  beat in the vertex shader, only the flocks within `reach` of the camera moved; fewer a flock on a phone
//   BUBBLES        over a fishing spot (an islet whose secret is `fishing`, islets.js: the rod's spot at sea), on the water off the islet's
//                  shore on the secret's side, until the secret is taken: a few bubbles welling up and a ring spreading on the crude
//                  (`sea.tell.bubbles`, vfx/opensea/seatelleffects.js, on the shared pools), every `every` real s while near
//   A LIGHT BELOW  over a beast's lair that waits (the fight's `lairs`, world/opensea/seafight.js: not downed today, up at this hour and
//                  weather, nothing risen there yet): a cold violet light lying flat under the crude, breathing slowly and wandering a
//                  little, as something large turns down there; a fat bubble now and then (`sea.tell.deep`). Gone once it rises
// Cost: one draw for the gulls, one a lair's light (two at most up at once in practice), a few particles a second; nothing far is moved.
//
// Prior art: The Wind Waker's seagulls circling what is worth sailing to, DREDGE's bubbling fishing spots, Sea of Thieves' birds over a
// shipwreck and its glowing loot under the water, Subnautica's lights in the deep.
//
//   game.seaTells = new SeaTells(game)   .update(dt)   .prewarm() -> hide (one gull under the world for the compile)   TELLS (the numbers)
//   .flocks (each { kind: 'wreck' | 'herd', at: Vector3, n })   .spots (the fishing spots)   .deeps (the lairs' lights)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { seeded } from '../../core/rng.js';
import { today } from '../../core/calendar.js';
import { haloTexture } from '../lighthouselamp.js';
import { SEA } from '../../world/opensea/seaprops.js';

export const TELLS = {
  /** max: gulls drawn at once; wreck / herd: a flock's size (phone: `phone`); r: its rings' radius (m); y: their height over the crude;
   *  w: their angular speed (rad/s); span: a gull's wingspan (m, a touch over life so it reads at the chase's distance); reach: metres
   *  from the camera a flock is moved and drawn; ease: how fast a herd's flock follows its bodies (1/s). */
  gulls: { max: 96, wreck: 6, herd: 5, phone: 3, r: [14, 30], y: [12, 26], w: [0.18, 0.32], span: 3.4, reach: 1400, ease: 0.4 },
  /** A fishing spot: metres off the shore, the real s between its bubbles, the reach it plays within. */
  bubbles: { off: 7, every: [0.45, 0.9], reach: 520 },
  /** A lair's light: its size (m), colour, breath (Hz), the wander (m, rad/s), the reach it shows within and fades over, a deep bubble's every. */
  deep: { size: 46, core: 12, colour: 0x7c5cf0, coreColour: 0xc8b8ff, breath: 0.22, wander: [7, 0.07], reach: [700, 1100], every: [2.5, 4.5] },
};

const hashId = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _m = new THREE.Matrix4(), _e = new THREE.Euler(), UP = new THREE.Vector3(0, 1, 0);

/** A gull: a white body, grey wings with black tips, a slight gull-wing bend; +Z its head, x across the wings, a 1 m half-span. Its
 *  wing's vertices are lifted by the flap in the shader by their |x|. */
function gullGeometry() {
  const P = [], C = [], col = (h) => new THREE.Color(h);
  const W = col(0xf2f0ea), G = col(0xa4abb2), K = col(0x23252b), Wb = col(0xd8d6d0);
  const tri = (a, b, c, ca, cb = ca, cc = ca) => { P.push(...a, ...b, ...c); for (const k of [ca, cb, cc]) C.push(k.r, k.g, k.b); };
  // the body: a slim double cone, head to tail
  const nose = [0, 0, 0.42], tail = [0, 0.02, -0.38], top = [0, 0.07, 0.02], bot = [0, -0.06, 0.02], l = [-0.07, 0, 0.04], r = [0.07, 0, 0.04];
  for (const [a, b] of [[top, r], [r, bot], [bot, l], [l, top]]) { tri(nose, a, b, W); tri(tail, b, a, W, Wb, Wb); }
  // the tail fan
  tri([0, 0.02, -0.3], [-0.12, 0.02, -0.52], [0.12, 0.02, -0.52], W);
  // each wing: a root, an elbow raised a little (the gull's W), a swept tip; leading and trailing edges
  for (const s of [-1, 1]) {
    const r0 = [0.06 * s, 0.02, 0.12], r1 = [0.06 * s, 0.02, -0.1], e0 = [0.5 * s, 0.09, 0.14], e1 = [0.5 * s, 0.09, -0.16], t0 = [1 * s, 0.02, -0.12], t1 = [0.82 * s, 0.03, -0.26];
    tri(r0, e0, r1, G); tri(r1, e0, e1, G); tri(e0, t0, e1, G, K, G); tri(e1, t0, t1, G, K, K);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.computeVertexNormals();
  return g;
}

/** The gulls' program: Lambert, vertex colours, both sides; the wings beat by an instanced phase, in bursts between long glides. */
function gullMaterial(u) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uT = u.uT;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;\nattribute float aPhase;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      float gate = smoothstep(0.25, 0.75, sin(uT * 0.45 + aPhase * 1.7));
      float f = sin(uT * 10.5 + aPhase * 6.283) * gate, ax = abs(position.x);
      transformed.y += f * (ax * 0.5 + max(ax - 0.5, 0.0) * 0.45) + ax * 0.1 * (1.0 - gate);`);
  };
  m.customProgramCacheKey = () => 'seagull';
  return m;
}

export class SeaTells {
  constructor(game) {
    this.game = game; this.t = 0; this.props = null; this.flocks = []; this.spots = []; this.deeps = new Map(); this.checkT = 0; this.gullsMesh = null;
    this.u = { uT: { value: 0 } };
  }

  /** The gulls' mesh, made once (kept: a room built again reuses it). */
  gulls() {
    if (this.gullsMesh) return this.gullsMesh;
    const T = TELLS.gulls, geo = gullGeometry(), mesh = new THREE.InstancedMesh(geo, gullMaterial(this.u), T.max);
    const ph = new Float32Array(T.max); for (let i = 0; i < T.max; i++) ph[i] = (i * 0.618) % 1;
    geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(ph, 1));
    mesh.count = 0; mesh.visible = false; mesh.frustumCulled = false; mesh.castShadow = false; mesh.name = 'sea-gulls'; mesh.userData.zoneFree = true; // (shown only while the open sea is: its count)
    this.game.scene?.add(mesh);
    return (this.gullsMesh = mesh);
  }
  /** One gull under the world for main.js's compile; returns what hides it again. */
  prewarm() {
    const m = this.gulls(); m.count = 1; m.visible = true; m.setMatrixAt(0, _m.makeTranslation(0, -50, 0)); m.instanceMatrix.needsUpdate = true;
    return () => { m.count = 0; m.visible = false; };
  }

  update(dt) {
    this.t += dt; this.u.uT.value = this.t;
    const R = this.game.opensea, P = R?.built ? R.props : null;
    if (!P || !R.active) { if (this.gullsMesh) { this.gullsMesh.count = 0; this.gullsMesh.visible = false; } for (const D of this.deeps.values()) D.group.visible = false; if (!P) this.reset(); return; }
    if (P !== this.props) this.lay(R, P);
    if ((this.checkT -= dt) <= 0) { this.checkT = 1; this.herdFlocks(R); this.lairs(R); }
    const cam = this.game.camera?.position; if (!cam) return;
    this.moveGulls(dt, cam);
    this.bubble(dt, cam);
    this.deep(dt, cam);
  }

  reset() { this.props = null; this.flocks = []; this.spots = []; for (const D of this.deeps.values()) this.dropDeep(D); this.deeps.clear(); }

  /** The wrecks' flocks and the fishing spots, laid once for a set of the room's things (seeded by the feature: the same each visit). */
  lay(R, P) {
    this.reset(); this.props = P;
    const mobile = !!this.game.graphics?.machine?.mobile;
    for (const m of P.marks) if (m.feature.kind === 'wreck') this.flocks.push(this.flock('wreck', String(m.feature.id), m.mesh.position, mobile));
    for (const isl of P.islets) {
      if (isl.secret.kind !== 'fishing') continue;
      const rng = seeded(hashId('fish:' + isl.feature.id)), dx = isl.secret.pos.x - isl.pos.x, dz = isl.secret.pos.z - isl.pos.z;
      const a = Math.hypot(dx, dz) > 0.5 ? Math.atan2(dz, dx) : rng() * Math.PI * 2, d = isl.islet.across / 2 + TELLS.bubbles.off;
      this.spots.push({ isl, at: new THREE.Vector3(isl.pos.x + Math.cos(a) * d, SEA.y + 0.2, isl.pos.z + Math.sin(a) * d), next: rng() * 0.8 });
    }
    this.herdFlocks(R);
  }
  flock(kind, id, at, mobile) {
    const T = TELLS.gulls, rng = seeded(hashId(kind + ':' + id)), n = mobile ? T.phone : T[kind];
    const birds = Array.from({ length: n }, () => ({ r: rng.range(...T.r), y: rng.range(...T.y), w: rng.range(...T.w) * (rng() < 0.5 ? -1 : 1), a: rng() * Math.PI * 2, bob: rng() * 6 }));
    return { kind, id, at: at.clone().setY(SEA.y), aim: at.clone().setY(SEA.y), birds };
  }

  /** The game day's herds' flocks: one a herd, over where its bodies are now (eased toward it as they move). */
  herdFlocks(R) {
    const list = R.herds?.list || [], mobile = !!this.game.graphics?.machine?.mobile, keep = new Set();
    for (const H of list) {
      const id = `${H.square}:${H.id}`; keep.add(id);
      let n = 0; _s.set(0, 0, 0);
      for (const b of H.bodies || []) { if (b.group?.visible === false) continue; b.group.getWorldPosition(_v); _s.add(_v); n++; }
      if (!n) continue;
      _s.divideScalar(n);
      let F = this.flocks.find((f) => f.kind === 'herd' && f.id === id);
      if (!F) this.flocks.push((F = this.flock('herd', id, _s, mobile)));
      F.aim.set(_s.x, SEA.y, _s.z);
    }
    this.flocks = this.flocks.filter((f) => f.kind !== 'herd' || keep.has(f.id));
  }

  moveGulls(dt, cam) {
    const T = TELLS.gulls, M = this.gulls(); let k = 0;
    for (const F of this.flocks) {
      if (F.kind === 'herd') F.at.lerp(F.aim, 1 - Math.exp(-T.ease * dt));
      if (Math.hypot(F.at.x - cam.x, F.at.z - cam.z) > T.reach) continue;
      for (const b of F.birds) {
        if (k >= T.max) break;
        b.a += b.w * dt;
        const x = F.at.x + Math.cos(b.a) * b.r, z = F.at.z + Math.sin(b.a) * b.r, y = F.at.y + b.y + Math.sin(this.t * 0.4 + b.bob) * 1.2;
        const head = Math.atan2(-Math.sin(b.a) * Math.sign(b.w), Math.cos(b.a) * Math.sign(b.w)); // (along the ring, the way it turns)
        _e.set(0, head, -0.35 * Math.sign(b.w), 'YXZ'); _q.setFromEuler(_e); // (banked into its ring)
        M.setMatrixAt(k++, _m.compose(_v.set(x, y, z), _q, _s.setScalar(T.span / 2)));
      }
    }
    M.count = k; M.visible = k > 0; if (k) M.instanceMatrix.needsUpdate = true;
  }

  bubble(dt, cam) {
    const B = TELLS.bubbles, vfx = this.game.vfx;
    for (const S of this.spots) {
      if ((S.next -= dt) > 0) continue;
      S.next = B.every[0] + Math.random() * (B.every[1] - B.every[0]);
      if (S.isl.secret.mesh && S.isl.secret.mesh.visible === false) continue; // (the spot fished out: the room hid its secret)
      if (S.at.distanceTo(cam) > B.reach) continue;
      _v.copy(S.at).add(_s.set((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3));
      vfx?.play?.('sea.tell.bubbles', { pos: _v });
    }
  }

  /** The lairs that wait now (the fight's own list and rule: world/opensea/seafight.js): a light laid for each, taken off the rest. */
  lairs(R) {
    const F = this.game.seaFight, day = today(), keep = new Set();
    for (const l of F?.lairs || []) {
      const risen = F.serpents?.list?.some((c) => c.lair === l.id || c.opts?.lair === l.id || c.home?.lair === l.id) ?? false;
      if (F.down?.get?.(l.id) === day || (F.upNow && !F.upNow(l)) || risen) continue;
      keep.add(l.id);
      if (!this.deeps.has(l.id)) this.deeps.set(l.id, this.makeDeep(l));
    }
    for (const [id, D] of this.deeps) if (!keep.has(id)) { D.k = D.k ?? 1; D.going = true; }
  }
  makeDeep(l) {
    const T = TELLS.deep, tex = haloTexture(), g = new THREE.Group(), flat = (size, colour, op) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, color: colour, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: op }));
      m.renderOrder = 2; g.add(m); return m;
    };
    const halo = flat(T.size, T.colour, 0.5), core = flat(T.core, T.coreColour, 0.6);
    g.position.set(l.pos.x, SEA.y + 0.3, l.pos.z); g.userData.zone = 'opensea'; this.game.scene.add(g);
    const rng = seeded(hashId('deep:' + l.id));
    return { l, group: g, halo, core, base: g.position.clone(), phase: rng() * 6, next: rng() * 2, k: 0, going: false };
  }
  dropDeep(D) { this.game.scene.remove(D.group); for (const m of [D.halo, D.core]) { m.geometry.dispose(); m.material.dispose(); } }
  deep(dt, cam) {
    const T = TELLS.deep, vfx = this.game.vfx;
    for (const [id, D] of this.deeps) {
      D.k = Math.max(0, Math.min(1, D.k + (D.going ? -dt / 1.5 : dt / 2.5))); // (it comes up slowly, and goes in a breath when the beast rises)
      if (D.going && D.k <= 0) { this.dropDeep(D); this.deeps.delete(id); continue; }
      const d = Math.hypot(D.base.x - cam.x, D.base.z - cam.z), far = 1 - THREE.MathUtils.smoothstep(d, T.reach[0], T.reach[1]);
      D.group.visible = far > 0.01;
      if (!D.group.visible) continue;
      const a = this.t * T.wander[1] + D.phase, breath = 0.6 + 0.4 * Math.sin(this.t * T.breath * Math.PI * 2 + D.phase);
      D.group.position.set(D.base.x + Math.cos(a) * T.wander[0], D.base.y, D.base.z + Math.sin(a * 1.3) * T.wander[0]);
      D.halo.material.opacity = 0.42 * breath * D.k * far; D.core.material.opacity = 0.55 * (0.5 + 0.5 * breath) * D.k * far;
      D.halo.scale.setScalar(0.9 + 0.15 * breath);
      if ((D.next -= dt) <= 0) { D.next = T.every[0] + Math.random() * (T.every[1] - T.every[0]); if (d < T.reach[0] && D.k > 0.5) vfx?.play?.('sea.tell.deep', { pos: D.group.position }); }
    }
  }

  dispose() { this.reset(); if (this.gullsMesh) { this.game.scene?.remove(this.gullsMesh); this.gullsMesh.geometry.dispose(); this.gullsMesh.material.dispose(); this.gullsMesh = null; } }
}
