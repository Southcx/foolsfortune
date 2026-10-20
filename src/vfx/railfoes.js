// ---------------------------------------------------------------------------------------
// A RAIL FOE'S BODY: what each foe of the crossing looks like (the roster: docs/plans/RAIL-MODULES.md section 6 and
// progress/rail/showcase.js ROSTER, Dovina's; who they are: Espada's canon). One shape a behaviour, nameable as a black silhouette at
// 48 px from behind, above and the side; a mid-dark body so the bright shots read on it; one bright point a gun (its named muzzle);
// a tell that grows over k 0..1 before it fires (a glow gathering, a lens heating, a lure brightening, a clam opening); a death read in
// 0.55 real s (the Wreckers break apart, the Egregores sink, the strays and the carrier burst). The feeling (`aspect`) lights the
// accents: lanterns, spots, muzzles. The bodies: railfoes/wreckers.js, egregores.js, strays.js; the kit and the two programs:
// railfoes/kit.js, materials.js.
//
// Cost: every body is one program (railfoes/materials.js bodyMaterial) and its glows one more (haloMaterial), shared by every foe
// through `customProgramCacheKey`; each role's geometry is built once and shared; a foe owns only its two small materials (its state).
// Two draw calls a body (body and halo), more only where a part must move or be downed alone (the gunship's guns and core, the turret's
// gun, the grappler's hook and line, the spawner's lid).
//
// Prior art: the Gummi ship's foes (KH2; the owner's north star), RAIL-FOES-ARCHETYPES.md 4 (the silhouette rules, the tell, the death
// read: Molinari, Dieterich), the shmup's named emitters (BulletML's `fire` from a named bone), and the vfx modules' prewarm
// (vfx/racewaysandfall.js: one copy under the world for main.js's compile).
//
//   RAIL_FOE_ROLES (the 17 role ids, Dovina's spelling, and the mine)   RAIL_FOE_SIZE[role] (its length, m, before the waves' SIZE)
//   const b = railFoeBody(role, aspect, opts?)   (+Z forward, Y up)
//   b.object  b.muzzles { name: Object3D }  b.parts { gun | gunL, gunR, core | hook, line | lid }  b.weak (blocker: weak.reveal(on))
//   b.tell(k, part?)  b.hit(part?)  b.down(part?)  b.update(dt) -> false once its death is done  b.setAspect(aspect)  b.dispose()
//   b.openCore(on) (gunship: opens by itself once both guns are down)   b.link { object, target, radius } (escort: its tether and bubble)
//   b.pose('swing' | 'attached' | 'thrown') and b.latch(worldPoint | null) (grappler)   b.tris
//   railFoeGeometry(role) -> the shared build   prewarmRailFoes(scene) -> hide()   (both programs compiled at boot: main.js, Petra's)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../progress/weather.js';
import { bodyMaterial, haloMaterial } from './railfoes/materials.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { HALO_CH, haloGeometry } from './railfoes/kit.js';
import { WRECKERS } from './railfoes/wreckers.js';
import { EGREGORES } from './railfoes/egregores.js';
import { STRAYS } from './railfoes/strays.js';

export const RAIL_FOE_ROLES = ['school', 'swooper', 'darter', 'rammer', 'sniper', 'ambusher', 'turret', 'mine-layer', 'mine', 'escort', 'carrier', 'sweeper', 'heavy', 'gunship', 'blocker', 'spawner', 'grappler'];
const BUILDERS = { ...WRECKERS, ...EGREGORES, ...STRAYS };
const DEATH_S = 0.55, HIT_S = 0.15;
const BUILT = new Map();

/** Where a piece sits in the body's frame (through its parents). */
const absAt = (p, byName) => { const a = [0, 0, 0]; for (let q = p; q; q = q.parent ? byName[q.parent] : null) if (q.at) for (let i = 0; i < 3; i++) a[i] += q.at[i]; return a; };
/** A piece's geometry moved by `at`, its group centres with it, written as `unit` (and a shutter's slide). */
function place(geo, at, unit, slide) {
  geo.translate(...at);
  const P = geo.attributes.part.array, U = geo.attributes.unit.array;
  for (let i = 0; i < P.length / 4; i++) { P[i * 4] += at[0]; P[i * 4 + 1] += at[1]; P[i * 4 + 2] += at[2]; U[i * 2] = unit; U[i * 2 + 1] = slide; }
  return geo;
}

/** A role's geometry, built once and shared by every body of it: { meshes: [{ name, geo, halo, at, tellOpen }], muzzles { name: { mesh,
 *  at } }, weak, marks { part: at }, units (names, 0 the body), death, flex, size, tris }. What does not move is merged into the body. */
export function railFoeGeometry(role) {
  if (BUILT.has(role)) return BUILT.get(role);
  const make = BUILDERS[role]; if (!make) throw new Error(`railfoes: no body for the role '${role}'`);
  const spec = make(), byName = Object.fromEntries(spec.pieces.map((p) => [p.name, p])), units = ['body'];
  const unitOf = (p) => (p.own ? (units.includes(p.name) ? units.indexOf(p.name) : units.push(p.name) - 1) : p.parent ? unitOf(byName[p.parent]) : 0);
  const merged = { geos: [], halos: [] }, meshes = [], muzzles = {}, marks = {};
  let weak = null, tris = 0;
  for (const p of spec.pieces) {
    const b = p.kit.build(), u = unitOf(p), own = !!p.moves, at = own ? [0, 0, 0] : absAt(p, byName), name = own ? p.name : 'body';
    place(b.geo, at, u, p.slide || 0);
    const halos = b.halos.map((h) => ({ ...h, at: [h.at[0] + at[0], h.at[1] + at[1], h.at[2] + at[2]], unit: u }));
    for (const [n, m] of Object.entries(b.muzzles)) muzzles[n] = { mesh: name, at: [m[0] + at[0], m[1] + at[1], m[2] + at[2]] };
    if (b.weakAt) weak = { mesh: name, at: b.weakAt.map((v, i) => v + at[i]) };
    if (p.name !== 'body' && !own) marks[p.name] = at;
    if (own) meshes.push({ name, geo: b.geo, halo: halos.length ? haloGeometry(halos) : null, at: p.at || [0, 0, 0], tellOpen: p.tellOpen || null, tris: b.tris });
    else { merged.geos.push(b.geo); merged.halos.push(...halos); }
  }
  const geo = merged.geos.length > 1 ? mergeGeometries(merged.geos) : merged.geos[0];
  if (merged.geos.length > 1) merged.geos.forEach((g) => g.dispose());
  geo.computeBoundingSphere();
  meshes.unshift({ name: 'body', geo, halo: merged.halos.length ? haloGeometry(merged.halos) : null, at: [0, 0, 0], tellOpen: null });
  for (const m of meshes) tris += m.geo.attributes.position.count / 3 + (m.halo ? m.halo.attributes.position.count / 3 : 0);
  const out = { meshes, muzzles, weak, marks, units, death: spec.death, flex: spec.flex || null, size: spec.size, tris };
  BUILT.set(role, out);
  return out;
}
export const RAIL_FOE_SIZE = new Proxy({}, { get: (_, role) => (BUILDERS[role] ? railFoeGeometry(role).size : undefined) });

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _z = new THREE.Vector3(0, 0, 1), _q = new THREE.Quaternion();
let LINK_GEO = null;
/** The escort's tether (a unit along +Z, its dashes running) and the bubble (a fresnel shell), drawn by the halo program. */
function linkGeometry() {
  if (LINK_GEO) return LINK_GEO;
  const mk = (g, mode) => { const n = g.attributes.position.count, hk = new Float32Array(n * 3); for (let i = 0; i < n; i++) { hk[i * 3] = mode; hk[i * 3 + 1] = HALO_CH.link; } g.setAttribute('hk', new THREE.BufferAttribute(hk, 3)); g.setAttribute('hc', new THREE.BufferAttribute(new Float32Array(n * 4), 4)); return g; };
  LINK_GEO = { tether: mk(new THREE.BoxGeometry(0.05, 0.05, 1, 1, 1, 12).translate(0, 0, 0.5), 1), bubble: mk(new THREE.IcosahedronGeometry(1, 2), 2) };
  return LINK_GEO;
}

export function railFoeBody(role, aspect = 'mirth', opts = {}) {
  const G = railFoeGeometry(role);
  const object = new THREE.Group(), pivot = new THREE.Group(); object.add(pivot);
  object.name = `railfoe.${role}`;
  const mat = bodyMaterial({ flex: G.flex, death: G.death }), halo = haloMaterial();
  const U = G.units.map((name) => ({ name, tell: 0, hit: 0, death: -1, reveal: 0, revealTo: 0 }));
  const meshes = {}, muzzles = {}, parts = {};
  for (const m of G.meshes) {
    const M = new THREE.Mesh(m.geo, mat); M.name = m.name; M.position.set(...m.at); pivot.add(M); meshes[m.name] = M;
    if (m.halo) { const h = new THREE.Mesh(m.halo, halo); h.renderOrder = 2; h.frustumCulled = false; M.add(h); }
    if (m.name !== 'body') parts[m.name] = M;
  }
  for (const [n, { mesh, at }] of Object.entries(G.muzzles)) { const o = new THREE.Object3D(); o.name = `muzzle.${n}`; o.position.set(...at); meshes[mesh].add(o); muzzles[n] = o; }
  for (const [n, at] of Object.entries(G.marks)) { const o = new THREE.Object3D(); o.name = n; o.position.set(...at); meshes.body.add(o); parts[n] = o; }
  if (G.weak) { const w = new THREE.Object3D(); w.name = 'weak'; w.position.set(...G.weak.at); meshes[G.weak.mesh].add(w); w.reveal = (on) => { U[0].revealTo = on ? 1 : 0; }; parts.weak = w; }
  const body = U[0];
  let time = (opts.phase ?? Math.random()) * 10, coreK = 0, coreTo = 0, pose = 'swing', poseT = 0, latchAt = null;
  const latched = new THREE.Vector3();

  // the escort's tether and bubble: in the world's frame (add link.object to the scene; set link.target to its charge's object)
  let link = null;
  if (role === 'escort') {
    const L = linkGeometry(), lm = haloMaterial(), o = new THREE.Group();
    const tether = new THREE.Mesh(L.tether, lm), bubble = new THREE.Mesh(L.bubble, lm);
    tether.frustumCulled = bubble.frustumCulled = false; tether.renderOrder = bubble.renderOrder = 2; o.add(tether, bubble); o.visible = false;
    link = { object: o, target: null, radius: 2.5, mat: lm, tether, bubble };
  }

  const each = (part, fn) => { if (!part) { U.forEach(fn); return; } const i = G.units.indexOf(part); fn(U[i < 0 ? 0 : i]); };
  const api = {
    role, object, muzzles, parts, weak: parts.weak || null, link, tris: G.tris, size: G.size,
    /** The tell before a shot, k 0..1 (a unit's alone, or every unit's). */
    tell(k, part) { const v = Math.max(0, Math.min(1, k)); each(part, (u) => { u.tell = v; }); },
    /** A blow landed: a flicker and a shake, never a white flash (Molinari). */
    hit(part) { each(part || 'body', (u) => { if (u.death < 0) u.hit = HIT_S; }); },
    /** Its death begins (or a unit's: a gunship's gun, its core). */
    down(part) {
      each(part, (u) => { if (u.death < 0) u.death = 0; });
      if (role === 'gunship' && part && U[1].death >= 0 && U[2].death >= 0) api.openCore(true);
    },
    openCore(on) { coreTo = on ? 1 : 0; if (U[3]) U[3].revealTo = coreTo; },
    pose(name) { if (name !== pose) { pose = name; poseT = 0; } },
    latch(p) { latchAt = p ? latched.copy(p) : null; },
    setAspect(a) {
      const c = COLOR[a] ?? 0xd0c0a0;
      mat.userData.u.uAspect.value.setHex(c); halo.userData.u.uAspect.value.setHex(c);
      if (link) link.mat.userData.u.uAspect.value.setHex(c);
    },
    update(dt) {
      time += dt; poseT += dt;
      const S = mat.userData.u.uStates.value;
      U.forEach((u, i) => {
        u.hit = Math.max(0, u.hit - dt);
        u.reveal += (u.revealTo - u.reveal) * Math.min(1, dt * 8);
        if (u.death >= 0 && u.death < 1) u.death = Math.min(1, u.death + dt / DEATH_S);
        S[i].set(u.tell, u.hit / HIT_S, Math.max(0, u.death), u.reveal);
      });
      coreK += (coreTo - coreK) * Math.min(1, dt * 4);
      mat.userData.u.uTime.value = halo.userData.u.uTime.value = time; mat.userData.u.uOpen.value = coreK;
      halo.userData.u.uStates.value = S;
      for (const m of G.meshes) if (m.tellOpen) meshes[m.name].rotation[m.tellOpen[0]] = m.tellOpen[1] * body.tell;
      if (role === 'grappler') grapple();
      if (link) tetherTo();
      if (body.death >= 1) { object.visible = false; if (link) link.object.visible = false; return false; }
      return true;
    },
    dispose() {
      object.removeFromParent(); mat.dispose(); halo.dispose();
      if (link) { link.object.removeFromParent(); link.mat.dispose(); }
    },
  };

  /** The grappler's poses: swinging in on its line, latched (the boat hauling back), thrown off (spun, the line slack). */
  function grapple() {
    const hook = meshes.hook, line = meshes.line;
    if (pose === 'attached') {
      if (latchAt) { object.updateWorldMatrix(true, true); pivot.worldToLocal(_a.copy(latchAt)); hook.position.copy(_a); }
      else hook.position.set(0, 0.25, 2.6);
      pivot.rotation.set(-0.22 + Math.sin(time * 9) * 0.03, 0, Math.sin(time * 13) * 0.04);
      hook.rotation.set(0, 0, 0);
    } else if (pose === 'thrown') {
      pivot.rotation.set(Math.min(1, poseT * 2) * 0.8, 0, poseT * 9);
      hook.position.set(Math.sin(poseT * 6) * 0.6, -0.3 - poseT * 0.5, 0.9);
      hook.rotation.set(poseT * 7, poseT * 5, 0);
    } else {
      const s = Math.sin(time * 2.2);
      pivot.rotation.set(0.05 * s, 0, 0.12 * s);
      hook.position.set(s * 0.35, -0.35 - Math.abs(s) * 0.1, 1.1 + Math.cos(time * 2.2) * 0.1);
      hook.rotation.set(0.6, 0, s * 0.4);
    }
    _a.copy(hook.position).sub(line.position); const len = _a.length();
    line.quaternion.setFromUnitVectors(_z, _a.multiplyScalar(1 / Math.max(1e-4, len)));
    line.scale.set(1, 1, pose === 'thrown' ? len * 0.6 : len);
  }
  /** The escort's tether from its lantern to its charge, the bubble round the charge. */
  function tetherTo() {
    const on = !!link.target && body.death < 0;
    link.object.visible = on; if (!on) return;
    const u = link.mat.userData.u; u.uTime.value = time; u.uStates.value[0].set(body.tell, 0, 0, 0);
    muzzles.lantern.getWorldPosition(_a); link.target.getWorldPosition(_b);
    const t = link.tether; t.position.copy(_a); _b.sub(_a); const len = _b.length();
    t.quaternion.setFromUnitVectors(_z, _b.multiplyScalar(1 / Math.max(1e-4, len))); t.scale.set(1, 1, Math.max(0, len - link.radius * 0.9));
    link.target.getWorldPosition(link.bubble.position); link.bubble.scale.setScalar(link.radius);
    _q.setFromAxisAngle(_z, time * 0.3); link.bubble.quaternion.copy(_q);
  }

  api.setAspect(aspect);
  api.update(0);
  return api;
}

/** Both programs compiled at boot: an escort and its link 50 m under the world, kept and hidden after the warm-up (main.js, Petra's). */
export function prewarmRailFoes(scene) {
  const b = railFoeBody('escort', 'mirth');
  b.object.position.set(0, -50, 0); b.object.userData.zoneFree = true; b.object.traverse((o) => { o.frustumCulled = false; });
  b.link.object.userData.zoneFree = true; b.link.target = b.object; scene.add(b.object, b.link.object); b.update(0);
  return () => { b.object.visible = false; b.link.object.visible = false; };
}
