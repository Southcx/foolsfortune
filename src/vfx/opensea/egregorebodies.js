// ---------------------------------------------------------------------------------------
// THE SAFARI'S EGREGORES' BODIES (docs/plans/OPEN-SEA.md sections 5 and 13; the species: progress/opensea/safari.js EGREGORES, the
// herds: migrations.js, Dovina's). Each species a creature of real myth drawn in the Brine dress (a wet grey-blue hide over a pale
// belly, the rail's Egregores' look: vfx/railfoes/egregores.js), its feeling's colour as the film's schiller along its fins and
// markings, alive: swum on the GPU and carried by its idle, which suits its disposition (the passive drift and graze, the wary look
// about, the territorial patrol, the hostile hunting swim), with its habits played on asking (a breach, a call, a spout: what a plate
// catches for its bonus). The shapes and their lives: egregoreshapes.js (the smaller five), egregoreshapes2.js (the great six); the kit
// and the one program: egregorekit.js. A herd's scattering and regrouping: egregoreherd.js. Laying a herd in its square and a sighting
// on the water is the world's (Petra's, OPEN-SEA.md 13); this is the body maker it calls (`game.makeEgregore`).
//   sealFolk the selkie   seaLights corposants   horseHerd the hippocamp   fishPeople the ningyo   wolfWhale the akhlut
//   seaSerpent the sea serpent (its fight's body is SeaSerpentBody)   seaMonk the umibozu   islandWhale the aspidochelone
//   ghostShip the Flying Dutchman   bigSquid the kraken   worldSerpent Jormungandr
// Bodies are built along +Z (the head), +Y up, the waterline at y 0, scaled to the species' `size` (its length in metres). The caller
// sets `group`'s place and heading (forward +Z turned by rotation.y) and calls update each frame; the body moves itself only within
// its carriage (heave, pitch and roll, a dive, a habit), never across the water.
//
// Cost: ONE new program for every species ('egregore-body', egregorekit.js; warmed at boot by prewarmEgregores), a material a body (its
// uniforms), the geometry built once a species and shared by every body of it; one draw a body. Triangles: 2,000 (a selkie) to 21,000
// (Jormungandr); `tris` says.
//
// Prior art: the myths (see the shapes' headers); the Weir fish's bodies (tools/sondelass/angling/fishmesh.js: one mesh and one draw a
// creature, its swim in the vertex shader, the carriage on the CPU); Pokemon Snap's creatures, which each do a few habits worth a
// photograph; Wind Waker's sea (one strong silhouette under a big sky).
//
//   const b = egregoreBody(species, { mat } = {}) -> { group, mesh, size, feel, tris, disposition, habits }   (`mat`: a material to draw
//     it with instead, unanimated: the old islet program's way)
//   b.update(dt, { speed = 0, bend = 0 })   speed in body lengths a second (the swim quickens), bend the curvature of its path (1/m)
//   b.habit(name) -> its real seconds (0: none such, or one playing)   b.habitNow   b.dive(on)   b.under (0..1)   b.rouse(0..1)   b.dispose()
//   EGREGORE_FEEL[species]   EGREGORE_SHAPES (the species built)   prewarmEgregores(scene) -> hide()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { EgregoreKit, egregoreMaterial } from './egregorekit.js';
import { SHAPES_SMALL } from './egregoreshapes.js';
import { SHAPES_GREAT } from './egregoreshapes2.js';
import { EGREGORES } from '../../progress/opensea/safari.js';
import { COLOR } from '../../progress/weather.js';
import { seeded } from '../../core/rng.js';

/** Each species' feeling: Dovina's ruled `feel` (safari.js) first; this the fallback (Calissa's reading of each myth, 2026-10-23). */
export const EGREGORE_FEEL = {
  sealFolk: 'grief', seaLights: 'wonder', horseHerd: 'mirth', fishPeople: 'desire', wolfWhale: 'fury', seaSerpent: 'dread',
  seaMonk: 'dread', islandWhale: 'wonder', ghostShip: 'grief', bigSquid: 'dread', worldSerpent: 'gall',
};
const SHAPES = { ...SHAPES_SMALL, ...SHAPES_GREAT };
export const EGREGORE_SHAPES = Object.keys(SHAPES);

const GEO = {}; // (a species' geometry, built once and shared by every body of it: never disposed)
function geometryOf(species, col) {
  const S = SHAPES[species];
  if (!GEO[species]) {
    const k = new EgregoreKit(S.L, { wave: S.waveW || 0 });
    S.build(k, col, seeded(species.length * 7919 + 13));
    const b = k.build(), r = b.geo.boundingSphere;
    r.radius += (S.wave[0] || 0) + S.L * 0.15; // (the swim and the flutter move it past its rest: never culled while some of it shows)
    GEO[species] = b;
  }
  return GEO[species];
}

const ease = (a, b, k) => a + (b - a) * k;
const env = (k) => Math.sin(Math.PI * Math.min(1, Math.max(0, k))) ** 0.8;

/** One species' body, scaled to its size, alive (see the header). */
export function egregoreBody(species, { mat = null } = {}) {
  if (!SHAPES[species]) species = 'sealFolk';
  const S = SHAPES[species], E = EGREGORES[species] || {}, feel = E.feel || EGREGORE_FEEL[species] || 'wonder';
  const col = COLOR[feel] ?? 0xffffff, b = geometryOf(species, col);
  const m = mat || egregoreMaterial({ L: S.L, feel: new THREE.Color(col), wave: S.wave, fin: S.fin, roughness: species === 'ghostShip' ? 0.7 : 0.36 });
  m.side = THREE.DoubleSide; // (a sail, a fin, a flame are sheets: one side setting for every body, so one program)
  const U = m.userData.u || null, mesh = new THREE.Mesh(b.geo, m), pose = new THREE.Group(), group = new THREE.Group();
  const size = E.size ?? S.L; mesh.scale.setScalar(size / S.L); mesh.castShadow = mesh.receiveShadow = true;
  pose.add(mesh); group.add(pose); group.name = `egregore:${species}`; group.userData.species = species; group.userData.egregore = true;
  const rng = seeded((species.length * 104729 + (egregoreBody.n = (egregoreBody.n || 0) + 1) * 7919) >>> 0);
  let t = rng() * 100, wavePh = rng() * 6.28, habitNow = null, ht = 0, under = 0, diveTo = 0, rouse = 0;
  const o = { y: 0, rx: 0, ry: 0, rz: 0, sxz: 1, glow: 0, show: 0, vanish: 0, wave: 1, fin: 1 };
  const api = {
    group, mesh, pose, size, feel, tris: b.tris, species, disposition: E.disposition || 'passive', habits: Object.keys(S.habits || {}),
    get habitNow() { return habitNow; }, get under() { return under; },
    habit(name) {
      const H = S.habits?.[name]; if (!H || habitNow) return 0;
      habitNow = name; ht = 0; return H[0];
    },
    dive(on) { diveTo = on ? 1 : 0; },
    rouse(k) { rouse = Math.max(0, Math.min(1, k)); },
    update(dt, { speed = 0, bend = 0 } = {}) {
      t += dt;
      Object.assign(o, { y: 0, rx: 0, ry: 0, rz: 0, sxz: 1, glow: rouse * 0.8, show: 0, vanish: 0, wave: 1, fin: 1 });
      S.idle?.(t, o);
      if (habitNow) {
        const H = S.habits[habitNow]; ht += dt; const k = ht / H[0];
        if (k >= 1) habitNow = null; else H[1](k, o, env(k));
      }
      under = ease(under, diveTo, 1 - Math.exp(-dt * (diveTo ? 1.4 : 0.8)));
      if (S.vanishes) o.vanish = Math.max(o.vanish, under);
      else { o.y -= under * (S.depth || 0); o.rx += 0.5 * Math.sin(Math.PI * under) * (diveTo ? 1 : -1); }
      pose.position.y = o.y * (size / S.L); pose.rotation.set(o.rx, o.ry, o.rz); pose.scale.set(o.sxz, 1, o.sxz);
      if (!U) return;
      const go = Math.min(1.5, speed * 2);
      wavePh += dt * (1.6 + 2.6 * go) * (S.L > 40 ? 0.35 : S.L > 10 ? 0.7 : 1); // (the great ones beat slower)
      U.uT.value = t; U.uWave.value.y = wavePh;
      U.uWave.value.x = S.wave[0] * o.wave * (0.7 + 0.4 * go);
      U.uFin.value.set(S.fin[0], S.fin[1] * o.fin * (0.8 + 0.3 * go), S.fin[2], S.fin[3]);
      U.uBend.value = bend * (size / S.L); U.uShow.value = o.show; U.uVanish.value = Math.min(0.98, o.vanish); U.uGlow.value = o.glow;
      mesh.visible = o.vanish < 0.97;
    },
    dispose() { if (!mat) m.dispose(); },
  };
  api.update(0);
  return api;
}

/** One body of the shared program parked 50 m under the world for main.js's compile; returns what hides it again (kept, never disposed). */
export function prewarmEgregores(scene) {
  const b = egregoreBody('sealFolk');
  b.group.position.set(0, -50, 0); b.group.userData.zoneFree = true; b.group.visible = true; scene.add(b.group);
  return () => { b.group.visible = false; };
}
