// ---------------------------------------------------------------------------------------
// THE GARDEN'S FEATURES: what the hand places on the planetoids (the owner, 2026-10-07: the full build, Round 3; docs/plans/SPIRIT-GARDEN.md
// section 4; the catalogue and its jobs are Dovina's: progress/realm.js FEATURES). Each is placed WITH A FEELING (its phase in Wu Xing), and
// wears that feeling's colour on its one accent (a roof's ridge, a lantern's light, a stone's carved ring), so a formation's elements can
// be read off the garden at a glance. Placeholders built from primitives, in the xianxia cave abode's vocabulary, soft as toys.
//
//   terrace      a stepped bed of dark soil in a clay rim, sprouts in rows
//   pavilion     an open hall on four red posts under an upswept roof (the ridge the feeling's colour), where an echo works
//   spiritHouse  a small round house with a conical thatch and a round door, lit within when a spirit is home
//   pond         a rimmed basin of Lachryma, the feeling's colour, still with a slow ring now and then
//   lantern      a stone lantern (the toro's lamp box on a post), its light the feeling's colour, lit at night
//   incense      a bronze burner on three legs, a thread of smoke rising and leaning
//   stone        a formation stone: a standing stone with a ring carved in it, glowing while its formation holds
//   drillYard    a ring of posts round a beaten floor, a training dummy at its heart
//
// Prior art: the Chinese garden and the cultivation sect's cave abode (pavilions, terraces, the pill furnace, the formation array),
// Animal Crossing's and Chao Garden's toy furniture (few shapes, round edges, readable from above), the Japanese toro, and Wu Xing's
// colours read as a formation's map.
//
//   const F = buildFeature(id, { feeling })   F.group (stands on its origin, +Y up)   F.set({ lit, active })   F.update(rawDt)   F.dispose()
//   FEATURE_IDS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ribbonLightMaterial } from '../ribbonlight.js';
import { COLOR } from '../weather.js';
import { mergeStatic } from '../../render/merge.js';

export const FEATURE_IDS = ['terrace', 'pavilion', 'spiritHouse', 'pond', 'lantern', 'incense', 'stone', 'drillYard'];

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });

export function buildFeature(id, { feeling = 'wonder' } = {}) {
  const group = new THREE.Group(); group.name = `feature-${id}`;
  const accent = new THREE.Color(COLOR[feeling] ?? COLOR.wonder);
  const glow = new THREE.MeshBasicMaterial({ color: accent.clone().multiplyScalar(0.2) }); glow.userData.noMerge = true; // (what lights up: kept apart from the merge)
  const add = (geo, mat, x = 0, y = 0, z = 0, name = null) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; if (name) m.name = name; group.add(m); return m; };
  const S = { lit: false, active: false, t: 0, smoke: null };
  const clay = std(0xc98a5a), stone = std(0xd8d0c8, { flatShading: true }), wood = std(0x9a3a2a), dark = std(0x4a3428, { roughness: 1 });
  const accentMat = std(accent, { roughness: 0.4 });

  if (id === 'terrace') {
    for (let i = 0; i < 3; i++) { add(new THREE.BoxGeometry(3.2 - i * 0.9, 0.35, 2.4 - i * 0.6), clay, 0, 0.17 + i * 0.35, 0); add(new THREE.BoxGeometry(3.0 - i * 0.9, 0.06, 2.2 - i * 0.6), dark, 0, 0.36 + i * 0.35, 0); }
    const sprout = std(0x7ccf6a);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4 - i; j++) add(new THREE.ConeGeometry(0.1, 0.3, 4), sprout, -1.1 + i * 0.45 + j * 0.65 * (1 - i * 0.2), 0.5 + i * 0.35, -0.7 + i * 0.3);
    add(new THREE.BoxGeometry(0.4, 0.1, 0.4), accentMat, 1.25, 0.4, 0.95); // (its feeling's marker at the corner)
  } else if (id === 'pavilion') {
    add(new THREE.CylinderGeometry(2.2, 2.4, 0.3, 8), stone, 0, 0.15, 0);
    for (const [x, z] of [[1.4, 1.4], [-1.4, 1.4], [1.4, -1.4], [-1.4, -1.4]]) add(new THREE.CylinderGeometry(0.12, 0.14, 2.2, 6), wood, x, 1.4, z);
    const roof = new THREE.ConeGeometry(2.8, 1.2, 4, 1, true); roof.rotateY(Math.PI / 4); const P = roof.attributes.position; // (its eaves swept up at the corners)
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), y = P.getY(i); if (y < 0) P.setY(i, y + 0.35 * (Math.max(Math.abs(x), Math.abs(z)) / 2.8) ** 2 * 2); }
    roof.computeVertexNormals(); add(roof, std(0x3e5a6a, { side: THREE.DoubleSide, flatShading: true }), 0, 2.95, 0);
    add(new THREE.SphereGeometry(0.22, 8, 6), accentMat, 0, 3.6, 0, 'pavilion-ridge');
  } else if (id === 'spiritHouse') {
    add(new THREE.CylinderGeometry(0.9, 1, 1.3, 12), clay, 0, 0.65, 0);
    add(new THREE.ConeGeometry(1.25, 1.1, 12), std(0xd8b46a, { roughness: 1 }), 0, 1.85, 0);
    S.door = add(new THREE.CircleGeometry(0.35, 14), glow, 0, 0.55, 1.0, 'spirithouse-door');
    add(new THREE.TorusGeometry(0.38, 0.05, 5, 14), accentMat, 0, 0.55, 1.0);
  } else if (id === 'pond') {
    add(new THREE.TorusGeometry(1.6, 0.25, 6, 20).rotateX(Math.PI / 2), stone, 0, 0.12, 0);
    S.water = add(new THREE.CircleGeometry(1.6, 24).rotateX(-Math.PI / 2), std(accent.clone().multiplyScalar(0.6), { roughness: 0.05, metalness: 0.2, emissive: accent, emissiveIntensity: 0.15 }), 0, 0.14, 0, 'pond-water');
    S.water.material.userData.noMerge = true;
    S.ring = add(new THREE.RingGeometry(0.2, 0.26, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }), 0, 0.15, 0, 'pond-ring');
  } else if (id === 'lantern') {
    add(new THREE.CylinderGeometry(0.4, 0.5, 0.25, 6), stone, 0, 0.12, 0); add(new THREE.CylinderGeometry(0.12, 0.15, 1.1, 6), stone, 0, 0.8, 0);
    add(new THREE.CylinderGeometry(0.45, 0.4, 0.15, 6), stone, 0, 1.4, 0);
    S.lamp = add(new THREE.BoxGeometry(0.42, 0.4, 0.42), glow, 0, 1.68, 0, 'lantern-light');
    add(new THREE.ConeGeometry(0.62, 0.42, 6), stone, 0, 2.1, 0); add(new THREE.SphereGeometry(0.1, 6, 4), stone, 0, 2.38, 0);
  } else if (id === 'incense') {
    const bronze = std(0x8a6a3a, { metalness: 0.7, roughness: 0.35 });
    add(new THREE.SphereGeometry(0.42, 12, 8, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), bronze, 0, 0.75, 0);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; add(new THREE.CylinderGeometry(0.04, 0.06, 0.55, 5), bronze, Math.cos(a) * 0.28, 0.28, Math.sin(a) * 0.28); }
    add(new THREE.TorusGeometry(0.3, 0.04, 5, 14).rotateX(Math.PI / 2), accentMat, 0, 0.92, 0);
    S.smoke = smokeThread(); S.smoke.position.y = 0.95; group.add(S.smoke);
  } else if (id === 'stone') {
    const g = new THREE.CylinderGeometry(0.45, 0.6, 2.2, 7, 4); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const y = P.getY(i); P.setX(i, P.getX(i) * (1 - 0.15 * (y / 1.1) ** 2)); } g.computeVertexNormals();
    add(g, std(0x8a8494, { flatShading: true }), 0, 1.1, 0);
    S.carve = add(new THREE.TorusGeometry(0.28, 0.045, 5, 18), glow, 0, 1.35, 0.5, 'stone-ring'); // (the ring carved in its face)
  } else if (id === 'drillYard') {
    add(new THREE.CylinderGeometry(3.4, 3.4, 0.08, 20), std(0xc9a77a, { roughness: 1 }), 0, 0.04, 0);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; add(new THREE.CylinderGeometry(0.1, 0.12, 0.9, 5), wood, Math.cos(a) * 3.3, 0.45, Math.sin(a) * 3.3); }
    add(new THREE.CylinderGeometry(0.1, 0.1, 1.6, 5), wood, 0, 0.8, 0); add(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 5).rotateZ(Math.PI / 2), wood, 0, 1.3, 0);
    add(new THREE.SphereGeometry(0.3, 8, 6), std(0xe8d4a8), 0, 1.75, 0); add(new THREE.BoxGeometry(0.5, 0.08, 0.5), accentMat, 0, 0.1, 2.8);
  }
  mergeStatic(group);

  const F = {
    id, feeling, group,
    /** lit: its light on (a lantern at night, a house with a spirit home); active: its job running (a formation holding, a pavilion working). */
    set({ lit = S.lit, active = S.active } = {}) { S.lit = lit; S.active = active; },
    update(raw = 1 / 60) {
      S.t += raw; const t = S.t, on = (S.lit || S.active) ? 1 : 0; S.k = (S.k ?? 0) + (on - (S.k ?? 0)) * Math.min(1, raw * 3);
      glow.color.copy(accent).multiplyScalar(0.15 + 0.85 * S.k * (0.9 + 0.1 * Math.sin(t * 2.3)));
      if (S.ring) { const p = (t * 0.25) % 1; S.ring.scale.setScalar(1 + p * 5); S.ring.material.opacity = 0.25 * (1 - p) * (p < 0.7 ? 1 : 0); }
      if (S.smoke) S.smoke.userData.tick(t);
    },
    dispose() { group.parent?.remove(group); group.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); }); },
  };
  return F;
}

/** A thread of incense smoke: a thin ribbon rising and leaning, its curls drifting up it. */
function smokeThread() {
  const N = 24, g = new THREE.BufferGeometry(), pos = new Float32Array((N + 1) * 2 * 3), uv = [], idx = [];
  for (let i = 0; i <= N; i++) { uv.push(i / N, 0, i / N, 1); if (i < N) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.Mesh(g, ribbonLightMaterial('smoke', { uC: { value: new THREE.Color(0.85, 0.82, 0.88) } }, { name: 'incense-smoke' })); // (the ribbons' one program: vfx/ribbonlight.js)
  m.frustumCulled = false; m.name = 'incense-smoke';
  m.userData.tick = (t) => { for (let i = 0; i <= N; i++) { const f = i / N, h = f * 2.2, x = Math.sin(t * 0.8 + f * 5) * 0.12 * f + f * f * 0.3, z = Math.cos(t * 0.6 + f * 4) * 0.08 * f, w = 0.02 + 0.08 * f; pos.set([x - w, h, z, x + w, h, z], i * 6); } g.attributes.position.needsUpdate = true; };
  return m;
}
