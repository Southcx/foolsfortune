// ---------------------------------------------------------------------------------------
// THE WORKBENCH'S STAGES: the looks staged on the MODELS tab (a pillar cracking, the windups in turn, the garden from day to night...),
// each built by its id and ticked on a loop. Loaded the first time one is picked (workbench.js loadModel), so none of it costs the game's
// boot: the looks it stages are the game's own modules, imported here and nowhere else in the workbench.
//
//   buildStage(id, game) -> Object3D (its loop on userData.tick(t)) | null   (the crossing's stages: workbench/crossingstages.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DreamvaneModel } from '../tools/dreamvane/model.js';
import { CrucibelleModel } from '../tools/crucibelle/model.js';
import { Sloop } from '../vfx/sloop.js';
import { CrudeSea } from '../vfx/crudesea.js';
import { DunemawMouth } from '../vfx/dunemaw.js';
import { dunemawKit } from '../vfx/dunemawkit.js';
import { buildLetty, buildPoll, buildPurser, buildBountyBoard } from '../vfx/margarite.js';
import { SpiritPress } from '../vfx/spiritpress.js';
import { StrawmanModel } from '../vfx/strawman.js';
import { UrnCrown } from '../vfx/urncrown.js';
import { LachrymatoBottle } from '../vfx/bottle.js';
import { Stain } from '../vfx/stains.js';
import { coat } from '../vfx/coat.js';
import { ShrineModel } from '../vfx/shrine.js';
import { Hokora } from '../vfx/garden/hokora.js';
import { SlipGeyser } from '../vfx/slipgeyser.js';
import { Pillar, Stalactite, slipMaterial, Clutch, dressBrood } from '../vfx/cavekit.js';
import { bowlSand, bowlSandTick, PoolRing } from '../vfx/bowl.js';
import { CatchLook } from '../vfx/catch.js';
import { BuskerMat } from '../vfx/buskermat.js';
import { FoeLook } from '../vfx/foelook.js';
import { GardenSky } from '../vfx/garden/gardensky.js';
import { Planetoid } from '../vfx/garden/planetoid.js';
import { SpiritVein } from '../vfx/garden/veins.js';
import { JarHop } from '../vfx/garden/jarhop.js';
import { buildFeature, FEATURE_IDS } from '../vfx/garden/features.js';
import { dressForm, SIDES } from '../vfx/garden/forms.js';
import { SculptBrush } from '../vfx/garden/sculptbrush.js';
import { CocoonTree } from '../vfx/garden/cocoontree.js';
import { GardenTree } from '../vfx/garden/gardentree.js';
import { canopyTick } from '../vfx/garden/leafcanopy.js';
import { BRANCH_PATHS } from '../vfx/garden/myggdrasil.js';
import { Fossil } from '../vfx/garden/fossil.js';
import { HeavenlyKiln } from '../vfx/garden/tribulation.js';
import { artifact, WarpPocket } from '../vfx/finds.js';
import { SolarRing } from '../vfx/solarring.js';
import { Ostracon, Stele } from '../vfx/ostracon.js';
import { debugChestModel } from '../vfx/debugchest.js';
import { PICTURES } from '../vfx/blackfigure.js';
import { crossingStage } from './crossingstages.js';
import { crossingShotsStage } from './crossingshots.js';
import { charybdisStage } from './charybdisstage.js';
import { buildSwarmStage } from './swarmstage.js';
import { buildBossStage, BOSS_STAGE_IDS } from './bossstage.js';
import { seaChartStage } from './seachartstage.js';
import { shipStage } from './shipstage.js';
import { mountStage } from './mountstage.js';
import { encounterStage, ENCOUNTER_STAGE_IDS } from './encounterstage.js';
import { strainBed } from '../vfx/garden/strains.js';
import { lekythos } from '../vfx/garden/lekythos.js';
import { sporeling } from '../vfx/garden/sporeling.js';
import { COLOR, DISPLAY_ORDER } from '../progress/weather.js';

export function buildStage(id, game) {
  let obj = null;
  if (BOSS_STAGE_IDS.includes(id)) return buildBossStage(id); // (the crossing's big objects: workbench/bossstage.js)
  if (id === 'crossing:surface' || id === 'crossing:storm') obj = crossingStage(id, game);
  else if (id === 'ships:classes') obj = shipStage(game); // (the five hulls in echelon: workbench/shipstage.js)
  else if (id === 'ships:mounts') obj = mountStage(game); // (a mount's preview on a moored sloop and frigate: workbench/mountstage.js)
  else if (ENCOUNTER_STAGE_IDS.includes(id)) obj = encounterStage(id, game); // (the encounters at sea as filmed: workbench/encounterstage.js)
  else if (id === 'tool:dreamvane') obj = new DreamvaneModel().group;
  else if (id === 'tool:crucibelle') obj = new CrucibelleModel().group;
  else if (id === 'ship:sloop') obj = new Sloop().group;
  else if (id === 'crossing:charybdis') obj = charybdisStage(game); // (the maelstrom's whirlpool and Charybdis: workbench/charybdisstage.js)
  else if (id === 'crossing:shots') obj = crossingShotsStage(); // (the shots' look, the Itano ribbons, the telegraph, the hurtbox: workbench/crossingshots.js)
  else if (id === 'crossing:shoal' || id === 'crossing:geometry') obj = buildSwarmStage(id); // (the crossing's swarm and ambient geometry: workbench/swarmstage.js)
  else if (id === 'crossing:chart') obj = seaChartStage(); // (the sea chart at three confidences and the rutter: workbench/seachartstage.js)
  else if (id === 'folk:letty') { const L = buildLetty(), P = buildPoll(); L.parts.shoulder.add(P.group); obj = L.group; }
  else if (id === 'slice:cave') {
    obj = new THREE.Group();
    const pil = new Pillar({ height: 7, radius: 0.9 }); pil.group.position.set(-3, 0, -1); obj.add(pil.group);
    const st = ['stone', 'brittle', 'warped'].map((k, i) => { const s = new Stalactite({ kind: k, length: 2.6, radius: 0.55 }); s.group.position.set(-0.5 + i * 1.8, 6, 0); obj.add(s.group); return s; });
    const slab = new THREE.Mesh(new THREE.BoxGeometry(7, 0.6, 2.4), new THREE.MeshStandardMaterial({ color: 0x9b7a5c, roughness: 0.9 })); slab.position.set(1.3, 6.3, 0); obj.add(slab);
    const sm = slipMaterial({ flow: new THREE.Vector2(1, 0.2), speed: 4 }); const slip = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), sm); slip.rotation.x = -Math.PI / 2; slip.position.set(0.5, 0.02, 2.4); obj.add(slip);
    const cl = new Clutch({ eggs: 5 }); cl.group.position.set(2.6, 0.02, 2.2); obj.add(cl.group);
    obj.userData.tick = (t) => { pil.crack(Math.floor(t / 2) % 4); if (Math.floor(t / 2) % 4 === 0) { pil.u.uStage.value = 0; pil.u.uSpent.value = 0; } st.forEach((s) => s.update(t)); st[2].setSolid((t % 3) < 2 ? 1 : 0.15); if ((t % 3) > 2.2 && !st[1].shakeT) st[1].shake(); pil.update(t); sm.userData.u.uT.value = t; cl.update(t); };
  }
  else if (id === 'slice:bowl') {
    obj = new THREE.Group();
    const dg = new THREE.CircleGeometry(7, 48).rotateX(-Math.PI / 2), dp = dg.attributes.position; for (let i = 0; i < dp.count; i++) dp.setY(i, Math.hypot(dp.getX(i), dp.getZ(i)) * 0.07); dg.computeVertexNormals();
    const sand = bowlSand({ scale: 0.4 }); sand.userData.u.uPool.value.set(2.5, 0); obj.add(new THREE.Mesh(dg, sand));
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2), slipMaterial({ speed: 0.5 })); pool.position.set(2.5, 0.19, 0); obj.add(pool);
    const ring = new PoolRing({ radius: 1 }); ring.group.position.set(2.5, 0.2, 0); obj.add(ring.group);
    let pil = null, cl = null, loop = -1; const brood = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 0.4 })); brood.scale.y = 0.8; brood.position.set(-1, 0.3, 2.4); obj.add(brood); dressBrood(brood, { size: 1 });
    obj.userData.tick = (t) => {
      const L = Math.floor(t / 10), k = t % 10;
      if (L !== loop) { loop = L; if (pil) { obj.remove(pil.group); pil.dispose(); } if (cl) { obj.remove(cl.group); cl.dispose(); } pil = new Pillar({ height: 4, radius: 0.5 }); pil.group.position.set(-3, 0.2, -2); obj.add(pil.group); cl = new Clutch({ eggs: 5 }); cl.group.position.set(-2, 0.15, 2.4); obj.add(cl.group); }
      if (k > 1.5) pil.crack(1); if (k > 4) pil.fall(new THREE.Vector3(1, 0, 0.3)); if (k > 7) pil.rubble();
      for (let i = 0; i < 5; i++) if (k > 2 + i * 1.4) cl.hatch(i);
      sand.userData.u.uSlide.value = k > 5 ? 1.5 : 0; bowlSandTick(sand, 1 / 60); ring.ring(Math.max(0, ((k % 3) - 1.8) / 1.2)); ring.update(1 / 60);
      pil.update(t, 1 / 60); cl.update(t, 1 / 60);
    };
  }
  else if (id === 'slice:foe') {
    obj = new THREE.Group(); const root = new THREE.Group(); obj.add(root); root.scale.setScalar(0.6);
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshStandardMaterial({ color: 0x9a7348, roughness: 0.35 })); body.scale.set(1, 0.85, 1); body.position.y = 0.8; root.add(body);
    const crown = new UrnCrown({ radius: 0.62 }); crown.group.position.y = 1.5; root.add(crown.group);
    const L = new FoeLook({ root, crown, floor: { center: new THREE.Vector3(0, 0, 0), radius: 3, depth: 0.3 } });
    const casts = ['crownBash', 'brineLine', 'gelidRings', 'oozeRain', 'crownGlare', 'slipNova', 'sinkingSands', 'brineCascade', 'broodCall', 'calving', 'overflow'];
    let last = -1; obj.userData.tick = (t) => { const n = Math.floor(t / 2.5) % casts.length, k = (t % 2.5) / 2; if (n !== last) { if (last >= 0) L.blow(casts[last]); last = n; } if (k <= 1) L.windup(casts[n], k, { order: n % 2 ? 'in' : 'out' }); L.overflow(casts[n] === 'overflow' ? Math.min(1, k) : 0); L.update(1 / 60); crown.update(1 / 60); };
  }
  else if (id === 'garden:galaxy') {
    obj = new THREE.Group(); const S = new GardenSky({ radius: 300, motes: 60 }); obj.add(S.group);
    const L = { dantian: [0, 0, 0], terraces: [40, 8, -12], athanor: [-34, 12, 16], pavilions: [12, -6, 44], mulberryGrove: [-24, -2, -40], chimney: [44, 18, 30] };
    const world = new THREE.Group(); world.scale.setScalar(0.05); obj.add(world); const P = {}; let n = 1;
    for (const [k, p] of Object.entries(L)) { const pl = new Planetoid({ kind: k, seed: n++ }); pl.group.position.set(...p); world.add(pl.group); P[k] = pl; }
    const V = Object.keys(L).filter((k) => k !== 'dantian').map((k) => { const v = new SpiritVein(new THREE.Vector3(...L.dantian), new THREE.Vector3(...L[k])); world.add(v.mesh); return v; });
    const jar = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.3, 0.05], [0.5, 0.4], [0.55, 0.7], [0.4, 1.0], [0.25, 1.15], [0.3, 1.25]].map(([r, y]) => new THREE.Vector2(r, y)), 16), new THREE.MeshStandardMaterial({ color: 0xb5532d, roughness: 0.6 }));
    jar.scale.setScalar(3); const J = new JarHop(jar); P.dantian.group.add(jar); let last = 0;
    obj.userData.tick = (t) => {
      S.set({ night: 0.5 - 0.5 * Math.cos(t * 0.2) }); S.update(1 / 60); V.forEach((v) => v.update(1 / 60)); Object.values(P).forEach((p) => p.update(1 / 60));
      const a = t * 0.4, ph = (t * 1.6) % 1; P.dantian.place(jar, new THREE.Vector3(Math.cos(a) * 0.5, 0.85, Math.sin(a) * 0.5), Math.sin(ph * Math.PI) * 2.2);
      if (ph < last) J.land(5); else if (ph > 0.02 && last <= 0.02) J.hop(); last = ph; J.update(1 / 60);
    };
  }
  else if (id === 'garden:features') {
    obj = new THREE.Group(); const P = new Planetoid({ kind: 'pavilions', seed: 3 }); P.group.scale.setScalar(0.15); obj.add(P.group);
    const fe = ['mirth', 'wonder', 'desire', 'grief', 'dread'], F = FEATURE_IDS.map((fid, i) => { const f = buildFeature(fid, { feeling: fe[i % 5] }); const a = (i / FEATURE_IDS.length) * Math.PI * 2; P.place(f.group, new THREE.Vector3(Math.cos(a) * 0.55, 0.8, Math.sin(a) * 0.55), 0); P.group.add(f.group); return f; });
    const B = new SculptBrush(); obj.add(B.group); let last = -1;
    obj.userData.tick = (t) => { F.forEach((f) => { f.set({ lit: Math.sin(t * 0.5) > 0, active: true }); f.update(1 / 60); }); const step = Math.floor(t / 0.5); if (step !== last) { last = step; const raise = Math.floor(t / 4) % 2 === 0, d = new THREE.Vector3(Math.cos(t * 0.3) * 0.3, 0.95, Math.sin(t * 0.3) * 0.3); P.sculpt(d, raise ? 0.4 : -0.4, 3); B.at(P, d, 3, raise ? 'raise' : 'dig'); B.work(true); } B.update(1 / 60); };
  }
  else if (id === 'garden:forms') {
    obj = new THREE.Group(); const fe = ['mirth', 'wonder', 'desire', 'grief', 'dread'], R = [];
    fe.forEach((f, i) => SIDES.forEach((sd, j) => { const r = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), new THREE.MeshStandardMaterial({ color: 0x9a7348, roughness: 0.4 })); b.scale.y = 0.85; b.position.y = 0.22; r.add(b); r.position.set((i - 2) * 0.75, 0, (j - 1) * 0.75); obj.add(r); dressForm(r, { feeling: f, side: sd }); R.push(r); }));
    obj.userData.tick = () => R.forEach((r) => r.userData.form?.update(1 / 60));
  }
  else if (id === 'garden:cocoon') {
    let T = null, loop = -1; obj = new THREE.Group();
    obj.userData.tick = (t) => { const L = Math.floor(t / 8), k = t % 8; if (L !== loop) { loop = L; if (T) { obj.remove(T.group); T.dispose(); } T = new CocoonTree({ slots: 3 }); T.group.scale.setScalar(0.35); obj.add(T.group); }
      T.cocoon(0, { feeling: 'wonder', k: Math.min(1, k / 1.5) }); T.cocoon(1, { feeling: 'mirth', k: Math.min(1, k / 1.5) }); if (T.slots[2].k > 0 || k < 2) T.cocoon(2, { feeling: 'dread', k: Math.min(1, k / 1.5) });
      if (k > 2 && k < 5.2) T.merge(1, 2, (k - 2) / 3); if (k > 6 && T.slots[0].open < 0 && T.slots[0].k > 0.5) T.open(0); T.update(1 / 60); };
  }
  else if (id === 'garden:trees') {
    // a grove of five garden trees (the leaf canopy in labradorite and gold: a gingko, a willow, a round crown, a mulberry, and gill
    // slivers with a tincture's tint), game noon then night on a loop (10 real seconds each); the bench's lights dimmed for the night
    // and put back when the stage is left (casebook rule 15)
    obj = new THREE.Group();
    const kinds = [['gingko', 3.4, 1.5], ['willow', 2.8, 1.7], ['round', 3, 1.6], ['mulberry', 3.2, 1.7], ['gill', 3, 1.5]];
    const T = kinds.map(([leaf, height, crown], i) => { const t = new GardenTree({ leaf, height, crown, seed: i + 3, tint: leaf === 'gill' ? { color: 0xd8607a, amount: 0.55 } : null }); const a = (i / kinds.length) * Math.PI * 2 + 0.3; t.group.position.set(Math.cos(a) * 4.2, 0, Math.sin(a) * 4.2); obj.add(t.group); return t; });
    const ground = new THREE.Mesh(new THREE.CircleGeometry(7.5, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5f8a6a, roughness: 0.95 })); ground.position.y = 0.01; obj.add(ground);
    let lights = null, k = 0;
    obj.userData.tick = (t) => {
      if (!lights) { let S = obj; while (S.parent) S = S.parent; lights = []; S.traverse((o) => { if (o.isLight) lights.push([o, o.intensity]); }); }
      const want = obj.userData.night ?? (Math.floor(t / 10) % 2); k = obj.userData.night !== undefined ? want : k + (want - k) * 0.05; // (eased over about a real second; a test's pin is taken at once)
      for (const [L, i0] of lights) L.intensity = i0 * (1 - 0.86 * k);
      canopyTick({ t, night: k });
    };
    obj.userData.dispose = () => { for (const [L, i0] of lights || []) L.intensity = i0; canopyTick({ night: 0 }); T.forEach((x) => x.dispose()); };
  }
  else if (id === 'garden:myggdrasil') {
    // Myggdrasil, the World Mushroom, on its 26 m planetoid (vfx/garden/myggdrasil.js), its state a step every 8 real seconds (caps 1, 3,
    // 5, 10; branches none, three, seven, all twenty-two; no tincture, then a rose and a teal one; fruit as the crown fills), game noon
    // then night every other loop. A test pins a step: userData.pin = { caps, branches, tincture, crown }, userData.night = 0 | 1
    obj = new THREE.Group();
    const ALL = Object.keys(BRANCH_PATHS), STEPS = [
      { caps: 1, branches: [], tincture: null, crown: [] },
      { caps: 3, branches: ['world', 'moon', 'sun'], tincture: null, crown: [1, 2] },
      { caps: 5, branches: ['world', 'moon', 'sun', 'judgement', 'star', 'tower', 'temperance'], tincture: { h: 350, s: 0.55 }, crown: [1, 2, 3, 4, 5] },
      { caps: 10, branches: ALL, tincture: { h: 175, s: 0.7 }, crown: Array.from({ length: 18 }, (_, i) => i) },
    ];
    const state = { ...STEPS[0] }, P = new Planetoid({ kind: 'myggdrasil', seed: 9, game: { myggdrasil: state } }); obj.add(P.group);
    let lights = null, k = 0, last = 0;
    obj.userData.planetoid = P;
    obj.userData.tick = (t) => {
      if (!lights) { let S = obj; while (S.parent) S = S.parent; lights = []; S.traverse((o) => { if (o.isLight) lights.push([o, o.intensity]); }); }
      Object.assign(state, obj.userData.pin || STEPS[Math.floor(t / 8) % STEPS.length]);
      const raw = Math.min(0.1, Math.max(0, t - last)); last = t; P.update(raw || 1 / 60);
      const want = obj.userData.night ?? (Math.floor(t / 32) % 2); k = obj.userData.night !== undefined ? want : k + (want - k) * 0.05;
      for (const [L, i0] of lights) L.intensity = i0 * (1 - 0.86 * k);
      canopyTick({ t, night: k }); P.mushroom?.update(0, state); // (the glow again under the stage's own night: the planetoid's clock set the game's)
    };
    obj.userData.dispose = () => { for (const [L, i0] of lights || []) L.intensity = i0; canopyTick({ night: 0 }); P.dispose(); };
  }
  else if (id === 'garden:fossils') {
    let F = null, loop = -1, lastBeat = 0; obj = new THREE.Group();
    obj.userData.tick = (t) => { const L = Math.floor(t / 8), k = t % 8; if (L !== loop) { loop = L; if (F) { obj.remove(F.group); F.dispose(); } F = new Fossil({ shape: ['spiral', 'fish', 'claw'][L % 3], feeling: ['wonder', 'desire', 'grief'][L % 3] }); obj.add(F.group); }
      F.set({ buried: Math.max(0, 1 - k / 2) }); F.awaken(Math.max(0, (k - 3) / 3)); if (k > 3 && Math.floor(k * 2) !== lastBeat) { lastBeat = Math.floor(k * 2); F.beat(); } if (k > 6.2) F.burst(); F.update(1 / 60); };
  }
  else if (id === 'garden:kiln') {
    obj = new THREE.Group(); const P = new Planetoid({ kind: 'chimney', seed: 7 }); P.group.scale.setScalar(0.12); obj.add(P.group); const top = P.surface(new THREE.Vector3(0, 1, 0));
    const K = new HeavenlyKiln({ height: 26 }); K.group.position.y = top; P.group.add(K.group); let next = 1;
    obj.userData.tick = (t) => { K.open(0.5 + 0.5 * Math.sin(t * 0.3)); if (t > next) { next = t + 1.6; K.bolt(P.group.localToWorld(new THREE.Vector3((Math.random() - 0.5) * 4, top + 1, (Math.random() - 0.5) * 4)), 1.2); } K.update(1 / 60); };
  }
  else if (id === 'garden:catch') {
    obj = new THREE.Group();
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.9, 16), new THREE.MeshStandardMaterial({ color: 0xb5532d, roughness: 0.6 })); jar.position.y = 0.45; obj.add(jar);
    const fig = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), new THREE.MeshStandardMaterial({ color: 0x6b5ca8, roughness: 0.4 })); obj.add(fig);
    const C = new CatchLook(); obj.add(C.group); let loop = -1;
    obj.userData.tick = (t) => {
      const L = Math.floor(t / 5), k = t % 5;
      if (L !== loop) { loop = L; fig.visible = true; fig.position.set(0.2, 2.1, 0.1); C.begin(fig, () => jar.getWorldPosition(new THREE.Vector3()).setY(jar.getWorldPosition(new THREE.Vector3()).y + 0.48)); }
      C.set({ k: Math.min(1, k / 3), tug: 0.5 + 0.5 * Math.sin(t * 3) });
      if (k > 3.2 && C.state === 'hold') { if (L % 2 === 0) C.take(); else C.free(); }
      C.update(1 / 60);
    };
  }
  else if (id === 'garden:strains') { // (the five strains' beds growing in, day to night and back on a 24 real second loop; a row of keepsake pots; sporelings swaying and hopping. userData.hold = { night, growth } pins them)
    obj = new THREE.Group(); const beds = DISPLAY_ORDER.map((f, i) => { const B = strainBed(f, { seed: i + 1 }); B.group.position.set((i - 2) * 4.2, 0, -1.6); obj.add(B.group); return B; });
    const pots = [[COLOR.wonder, 'slipjelly'], [COLOR.mirth, 'sporeling'], [COLOR.desire, 'slipjelly'], [COLOR.grief, 'sporeling'], [COLOR.dread, 'slipjelly'], [{ h: 300, s: 0.7 }, 'sporeling']].map(([colour, spirit], i) => { const P = lekythos({ colour, spirit, seed: i + 1 }); P.group.position.set((i - 2.5) * 0.85, 0, 2.0); P.group.rotation.y = (i - 2.5) * -0.12; obj.add(P.group); return P; });
    const sp = [0xd8402a, COLOR.mirth, { h: 200, s: 0.6 }, 0x9a6ad8].map((colour, i) => { const S = sporeling({ colour, seed: i + 3 }); S.group.position.set((i - 1.5) * 1.1 + 0.3, 0, 3.2); S.group.rotation.y = (i - 1.5) * 0.25; obj.add(S.group); return S; });
    const lights = []; let found = false, pt = 0; obj.userData.parts = { beds, pots, sporelings: sp };
    const dim = (k) => { if (!found) { found = true; let r = obj; while (r.parent) r = r.parent; r.traverse((o) => { if (o.isLight) lights.push([o, o.intensity]); }); } for (const [L, i0] of lights) L.intensity = i0 * k; };
    obj.userData.dispose = () => { for (const [L, i0] of lights) L.intensity = i0; [...beds, ...pots, ...sp].forEach((x) => x.dispose()); };
    obj.userData.tick = (t) => {
      const dt = Math.max(0, Math.min(0.1, t - pt)), k = t % 24, hold = obj.userData.hold; pt = t;
      const night = hold?.night ?? (k < 10 ? 0 : k < 12 ? (k - 10) / 2 : k < 20 ? 1 : k < 22 ? 1 - (k - 20) / 2 : 0), growth = hold?.growth ?? Math.min(1, k / 4);
      if (obj.parent) dim(1 - 0.86 * night);
      beds.forEach((B) => { B.set({ growth, night }); B.update(dt); });
      sp.forEach((S, i) => { S.set({ night }); if (!hold && Math.floor(t * 0.5 + i * 0.37) !== Math.floor((t - dt) * 0.5 + i * 0.37) && (i + Math.floor(t * 0.5)) % 2 === 0) S.hop(0.22); S.update(dt); });
    };
  }
  else if (id === 'pier:mat') { const B = new BuskerMat(); obj = B.group; obj.userData.tick = (t) => { B.tip(Math.floor(t % 14)); B.set({ playing: (t % 14) > 3 }); B.update(1 / 60); }; }
  else if (id === 'slice:finds') {
    obj = new THREE.Group(); const A = ['lamp', 'ewer', 'mask', 'coins'].map((k, i) => { const a = artifact(k); a.group.position.set(-0.9 + i * 0.6, 0, 0); a.group.scale.setScalar(2); obj.add(a.group); return a; });
    const W = new WarpPocket(A[0].group, { radius: 0.5 }); obj.userData.tick = (t) => { A.forEach((a) => a.update(t)); W.update(t); };
  }
  else if (id === 'dunes:rings') {
    obj = new THREE.Group(); const R = [0, 1, 2, 3].map((i) => { const r = new SolarRing({ radius: 1 }); r.group.position.set(-3.3 + i * 2.2, 1.2, 0); obj.add(r.group); return r; });
    R[0].set({ lit: true, next: true }); R[1].set({ lit: true }); R[2].set({ lit: false }); let pt = 0; obj.userData.tick = (t) => { if (t % 3 < pt % 3) R[3].pass(); R.forEach((r) => r.update(Math.max(0, t - pt))); pt = t; };
  }
  else if (id === 'dunes:ostraca') { // (the sixteen words with pictures in two rows, one word with none (the meander), a stele behind with twelve of them as stand-in words; dug, buried and dug again)
    obj = new THREE.Group(); const words = Object.keys(PICTURES), n = words.length, row = Math.ceil(n / 2);
    const O = [...words, 'VOYD'].map((w, i) => { const o = new Ostracon({ word: w }); o.group.position.set(i < n ? -0.16 * (row - 1) + (i % row) * 0.32 : 0.16 * (row + 1.5), 0, i < n ? 0.3 + Math.floor(i / row) * 0.3 : 0.45); obj.add(o.group); return o; });
    const S = new Stele({ words: words.slice(0, 12) }); S.group.position.set(0, 0, -1.0); obj.add(S.group);
    let pt = 0; obj.userData.ostraca = O; obj.userData.stele = S;
    obj.userData.tick = (t) => { const k = t % 12, b = k < 4 ? 0 : k < 6 ? (k - 4) / 2 : k < 10 ? 1 : 1 - (k - 10) / 2, dt = Math.max(0, t - pt); pt = t; for (const o of O) { o.set({ buried: b }); o.update(dt); } S.set({ buried: b }); S.update(dt); };
  }
  else if (id === 'debug:chest') { const C = debugChestModel(); obj = C.group; let pt = 0; obj.userData.tick = (t) => { if (t % 2 < pt % 2) C.bump(); C.update(Math.max(0, t - pt)); pt = t; }; } // (the debug chest's look: its lid hopping every 2 s, as each F tops it up)
  else if (id === 'dunes:geyser') { const Gy = new SlipGeyser({ height: 20, dormant: [3, 4] }); obj = Gy.group; let pt = 0; obj.userData.tick = (t) => { Gy.update(Math.max(0, t - pt)); pt = t; }; }
  else if (id === 'slice:urn') { let U = new UrnCrown({ radius: 0.6 }); obj = new THREE.Group(); obj.add(U.group); let pt = 0; obj.userData.tick = (t) => { const k = t % 8; if (k < pt % 8) { obj.remove(U.group); U.dispose(); U = new UrnCrown({ radius: 0.6 }); obj.add(U.group); } U.tell(k < 1.5 ? k / 1.5 : 0); if (k > 1.5) U.crack(1); if (k > 3) U.crack(2); if (k > 4.5) U.crack(3); if (k > 5.5) U.burst(); U.update(Math.max(0, t - pt)); pt = t; }; }
  else if (id === 'brush:bottles') { obj = new THREE.Group(); const B = ['small', 'medium', 'large'].map((sz, i) => { const b = new LachrymatoBottle({ size: sz }); b.group.position.x = -0.3 + i * 0.3; b.set({ fill: [0.9, 0.55, 0.3][i], crack: i === 2 }); obj.add(b.group); return b; }); const acc = new THREE.Vector3(); let pt = 0; obj.userData.tick = (t) => { acc.set(Math.sin(t * 1.3) > 0.9 ? 9 : 0, 0, Math.cos(t * 0.9) > 0.95 ? 7 : 0); for (const b of B) b.update(Math.max(0, t - pt), acc); pt = t; }; }
  else if (id === 'brush:coat') { const m = new THREE.MeshStandardMaterial({ color: 0x9ab07a, roughness: 0.42, flatShading: true }); obj = new THREE.Mesh(new THREE.LatheGeometry([[0.001, 0], [0.3, 0.02], [0.42, 0.3], [0.38, 0.62], [0.24, 0.8], [0.26, 0.86], [0.001, 0.88]].map(([r, y]) => new THREE.Vector2(r, y)), 20), m); const C = coat(m, { height: 0.88, feeling: 'desire' }); obj.userData.tick = (t) => { const k = t % 8; C.set(k < 4 ? k / 4 : 1 - (k - 4) / 4); }; }
  else if (id === 'brush:stains') { obj = new THREE.Group(); const S = new Stain({ feeling: 'desire', seed: 0.31 }); obj.add(S.group); let pt = 0; obj.userData.tick = (t) => { const k = t % 16; S.set({ stage: Math.min(3, Math.floor(k / 3) + 1), amount: k > 12 ? 1 - (k - 12) / 4 : 1 }); if (k < pt % 16) S.stage = 0; S.update(Math.max(0, t - pt) * 4); pt = t; }; }
  else if (id === 'workshop:strawman') { const S = new StrawmanModel(); obj = S.group; let last = 0, pt = 0; obj.userData.tick = (t) => { if (t - last > 2) { last = t; S.group.updateMatrixWorld(true); const p = S.body.localToWorld(new THREE.Vector3(0, -0.53, -0.4)); S.hit(p, new THREE.Vector3(Math.sin(t), 0, -1).normalize(), 1); } S.update(Math.max(0, t - pt)); pt = t; }; }
  else if (id === 'garden:regia') { const P = new SpiritPress(); P.set({ soul: { h: 40, s: 0.6 }, fire: 0.5, near: 2 }); obj = P.group; obj.userData.tick = (t) => { if (t % 6 < 0.05) P.set({ regia: 1 }); P.update(t); }; }
  else if (id === 'garden:shrine') { const S = new ShrineModel({ ground: 'stone_flags' }); obj = S.group; let pt = 0; obj.userData.tick = (t) => { const k = t % 12; S.set({ found: k > 2, resting: k > 4 && k < 7, open: k > 7.5 }); S.update(Math.max(0, t - pt)); pt = t; }; }
  else if (id === 'garden:hokora') { obj = new Hokora().group; }
  else if (id === 'garden:press') { const P = new SpiritPress(); P.set({ soul: { h: 226, s: 0.5 }, fire: 0.6, press: 0.5, near: 4, queue: [20, 123, 277] }); obj = P.group; obj.userData.tick = (t) => P.update(t); }
  else if (id === 'folk:purser') obj = buildPurser().group;
  else if (id === 'folk:board') obj = buildBountyBoard().group;
  else if (id === 'slice:sea') { const sea = new CrudeSea({ size: 40, cells: 40 }); sea.update(4); obj = sea.mesh; }
  else if (id === 'slice:mouth') { const m = new DunemawMouth({ radius: 2 }); m.update(3, 1); obj = m.group; }
  else if (id === 'slice:kit') { // (a corner of a floor: a pane of the floor, a wall, a plinth)
    const K = dunemawKit(), g = new THREE.Group(), box = (w, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); };
    box(4, 0.2, 4, 0, -0.1, 0, K.floor); box(4, 2.4, 0.3, 0, 1.2, -2, K.wall); box(0.3, 2.4, 4, -2, 1.2, 0, K.wall); box(0.8, 0.3, 0.8, 0.8, 0.15, 0.6, K.trim); obj = g;
  }
  return obj;
}
