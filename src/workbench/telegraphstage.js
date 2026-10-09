// ---------------------------------------------------------------------------------------
// THE WORKBENCH'S TELEGRAPH STAGES (the combat group): the telegraphs' look (vfx/telegraphs/telegraphlook.js) drawn from the telegraphs'
// own data (progress/combat/telegraphs.js `markOf`, progress/combat/greatjelly.js `castMark`), on grounds of their own (pale sand and
// dark stone, sloped and bumped, so the mark is seen lying on what it lies on: the casebook's rule 118), each windup on a loop:
//   combat:telegraphs           THE LADDER: six ground shapes (circle, out-in, cone, line, lunge, baited) in columns, Divination 1, 2,
//                               8, 20 and 35 in rows (the body alone, where, when, what kind, how to answer)
//   combat:telegraphs.more      the rest at the same five levels: floor (two safe pockets), tracked (dashed, then locked), left
//                               (puddles), gaze (the eye on its maker), adds (three, a pip a second left), raidwide (the arena's rim)
//   combat:telegraphs.variants  every shape at step 4 over the area's numbers drawn in magenta (the drawn area is the true area),
//                               the friendly outline (a sibling's, in the draught colour), the caution edge, one cast's overlapping
//                               drops merged into one edge, the mark over a ridge
//   combat:telegraphs.glyphs    the glyph sheet: every answer, mark and status glyph over pale and dark ground
//   combat:telegraphs.bowl      the Great Slip Jelly's casts at their own size (castMark at Divination 35) on a dish 140 m across
//
// Prior art: the workbench's other stages (a look shown on a loop before the game drives it: workbench/crossingshots.js), and the
// style sheet of a UI kit (every state of every piece on one page).
//
//   telegraphStage(id) -> Object3D (its loop on userData.tick(t); userData.bare; userData.view)    TELEGRAPH_STAGE_IDS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { TelegraphLook } from '../vfx/telegraphs/telegraphlook.js';
import { ATLAS_IDS } from '../vfx/telegraphs/telegraphatlas.js';
import { markOf } from '../progress/combat/telegraphs.js';
import { CASTS, castMark } from '../progress/combat/greatjelly.js';
import { COLOR } from '../progress/weather.js';

export const TELEGRAPH_STAGE_IDS = ['combat:telegraphs', 'combat:telegraphs.more', 'combat:telegraphs.variants', 'combat:telegraphs.glyphs', 'combat:telegraphs.bowl'];
const LEVELS = [1, 2, 8, 20, 35];
const SAND = new THREE.Color(0xd9b98c), STONE = new THREE.Color(0x2a2220);

// the demo's windups: every shape, every type, every status, every answer at least once
const W = {
  circle: { area: { shape: 'circle', at: 'courier', radius: 3 }, type: 'impact', status: 'stun', answer: 'out' },
  outin: { area: { shape: 'out-in', inner: 2.2, outer: [2.2, 5.5] }, type: 'ego', status: 'doubt', answer: 'out' },
  cone: { area: { shape: 'cone', degrees: 100, length: 6.5 }, type: 'influence', status: 'charm', answer: 'behind' },
  line: { area: { shape: 'line', width: 2.6, length: 9 }, type: 'illusion', status: 'blind', answer: 'sidestep' },
  lunge: { area: { shape: 'lunge', at: 'courier', reach: 7, width: 2 }, type: 'delirium', status: 'confusion', answer: 'sidestep' },
  baited: { area: { shape: 'baited', drops: 3, radius: 1.6 }, type: 'impact', status: 'slow', answer: 'out' },
  floor: { area: { shape: 'floor', radius: 6.5 }, type: 'ego', status: 'halt', answer: 'highGround' },
  tracked: { area: { shape: 'tracked', radius: 2.6 }, type: 'illusion', status: 'sleep', answer: 'out' },
  left: { area: { shape: 'left', radius: 1.3 }, type: 'delirium', status: 'soaked', answer: 'out' },
  gaze: { area: { shape: 'gaze' }, type: 'ego', status: 'stun', answer: 'lookAway' },
  adds: { area: { shape: 'adds' }, type: null, status: null, answer: 'killFirst' },
  raidwide: { area: { shape: 'raidwide' }, type: 'impact', status: null, answer: 'guard' },
};

/** A ground of its own: a heightfield (h(x, z)), coloured by `tone(x, z)` (0 sand .. 1 stone), lit by the workbench's lamps. */
function groundMesh(size, h, tone, seg = 120) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg).rotateX(-Math.PI / 2), p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, h(x, z)); c.copy(SAND).lerp(STONE, tone(x, z)); col.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
}
/** A maker: a grey body with a nose toward +z (its facing), so the cone and the line are read against it. */
function maker(scale = 1) {
  const m = new THREE.Group(), mat = new THREE.MeshLambertMaterial({ color: 0x9a8f86 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 1.4, 12), mat); body.position.y = 0.7; m.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 8).rotateX(Math.PI / 2), mat); nose.position.set(0, 1, 0.65); m.add(nose);
  m.scale.setScalar(scale);
  return m;
}
/** The area's numbers drawn in magenta, from the area itself (not from the look's code): the proof that the drawn area is the true one. */
function numbersLine(area, h, at, facing = 0, opts = {}) {
  const pts = [], add = (lx, lz) => { const x = at.x + lx * Math.cos(facing) + lz * Math.sin(facing), z = at.z - lx * Math.sin(facing) + lz * Math.cos(facing); pts.push(new THREE.Vector3(x, h(x, z) + 0.08, z)); };
  const loop = (r, cx = 0, cz = 0) => { for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2; add(cx + Math.sin(a) * r, cz + Math.cos(a) * r); } pts.push(null); };
  const s = area.shape, c = opts.centre || [0, 0];
  if (s === 'circle' || s === 'tracked') loop(area.radius, c[0], c[1]);
  else if (s === 'out-in') { loop(area.inner); loop(area.outer[1]); }
  else if (s === 'cone') { const hf = (area.degrees / 2) * (Math.PI / 180); add(0, 0); for (let i = 0; i <= 32; i++) { const a = -hf + (2 * hf * i) / 32; add(Math.sin(a) * area.length, Math.cos(a) * area.length); } add(0, 0); pts.push(null); }
  else if (s === 'line' || s === 'lunge') { const w = (area.width) / 2, L = area.length ?? area.reach; for (const [x, z] of [[-w, 0], [w, 0], [w, L], [-w, L], [-w, 0]]) add(x, z); pts.push(null); }
  else if (s === 'floor') loop(area.radius);
  const segs = []; let run = [];
  for (const q of pts) { if (!q) { if (run.length > 1) segs.push(run); run = []; } else run.push(q); }
  const grp = new THREE.Group(), mat = new THREE.LineBasicMaterial({ color: 0xff00ff, depthTest: false, transparent: true });
  for (const r of segs) { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(r), mat); l.renderOrder = 60; grp.add(l); }
  return grp;
}

/** A row of telegraphs on a loop: `cells` [{ key, at, facing, opts, level, friendly, half }] drawn by looks of six, each windup 3 s. */
function loopCells(obj, cells, ground, { windup = 3, gap = 0.9 } = {}) {
  const shim = { rawDt: 1 / 60, camera: null };
  const looks = [];
  for (let i = 0; i < cells.length; i += 6) { const L = new TelegraphLook(shim, { scene: null }); L.ground = (x, z) => ground(x, z); obj.add(L.group); looks.push(L); }
  let pt = 0;
  obj.userData.tick = (t) => {
    const dt = Math.max(0, Math.min(0.1, t - pt)); pt = t; shim.rawDt = dt;
    cells.forEach((c, i) => {
      const L = looks[Math.floor(i / 6)], id = `cell${i}`, w = W[c.key] || c.w, cyc = (windup + gap) * (c.halves || 1), k = t % cyc;
      const half = c.halves === 2 && k >= windup + gap ? 1 : 0, kk = half ? k - (windup + gap) : k, eta = windup - kk;
      if (eta < 0) { L.hide(id); c.shown = -1; return; }
      const mark = markOf({ ...w, eta: windup, answer: half ? 'in' : w.answer }, c.level ?? 35, false);
      if (!mark) return;
      const h = c.shown !== half ? L.show(id, mark, { origin: c.at, facing: c.facing || 0, eta, ...c.opts, friendly: c.friendly }) : L.get(id);
      if (c.shown !== half && half) h?.next(eta);
      c.shown = half; h?.eta(eta);
    });
    for (const L of looks) L.update(dt);
  };
  return looks;
}

export function telegraphStage(id) {
  const obj = new THREE.Group(); obj.userData.bare = true; obj.userData.placed = true;
  const bumps = (x, z) => 0.35 * Math.sin(x * 0.31) * Math.cos(z * 0.27) + 0.2 * Math.sin(x * 0.9 + z * 0.4);
  if (id === 'combat:telegraphs' || id === 'combat:telegraphs.more') {
    const keys = id === 'combat:telegraphs' ? ['circle', 'outin', 'cone', 'line', 'lunge', 'baited'] : ['floor', 'tracked', 'left', 'gaze', 'adds', 'raidwide'];
    const DX = 16, DZ = 15, h = (x, z) => bumps(x, z) - z * 0.04, tone = (x) => (Math.floor((x + DX * 3) / DX) % 2 ? 0.92 : 0.05);
    obj.add(groundMesh(130, h, (x) => tone(x)));
    const cells = [];
    LEVELS.forEach((lv, r) => keys.forEach((k, c) => {
      const at = new THREE.Vector3((c - 2.5) * DX, 0, (r - 2) * DZ - 3); at.y = h(at.x, at.z);
      const m = maker(k === 'gaze' ? 1.6 : 1); m.position.copy(at); obj.add(m);
      const opts = {};
      if (k === 'circle' || k === 'lunge' || k === 'tracked') opts.points = [{ x: at.x + 1.2, y: at.y, z: at.z + 4.2 }];
      if (k === 'baited') opts.points = [0, 1, 2].map((i) => ({ x: at.x - 2.6 + i * 2.6, y: at.y, z: at.z + 3.5 + (i % 2) }));
      if (k === 'left') opts.points = [0, 1, 2].map((i) => ({ x: at.x - 2 + i * 2, y: at.y, z: at.z + 2.5 + i * 1.2 }));
      if (k === 'floor') opts.pockets = [{ x: at.x - 2.8, z: at.z + 2.6, r: 1.2 }, { x: at.x + 3, z: at.z - 1.5, r: 1.4 }];
      if (k === 'tracked') opts.locked = false;
      if (k === 'gaze') opts.height = 2.6;
      if (k === 'adds') opts.adds = [-2.5, 0, 2.5].map((dx) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), new THREE.MeshLambertMaterial({ color: 0x7a9a86 })); s.position.set(at.x + dx, h(at.x + dx, at.z + 4) + 0.45, at.z + 4); obj.add(s); return s; });
      if (k === 'raidwide') opts.rim = { centre: { x: at.x, z: at.z }, radius: 6.5, band: 0.9 };
      cells.push({ key: k, at, level: lv, opts, halves: k === 'outin' ? 2 : 1 });
    }));
    const looks = loopCells(obj, cells, h);
    const tick = obj.userData.tick; let lockT = 0;
    obj.userData.tick = (t) => { tick(t); if (id === 'combat:telegraphs.more') { const locked = t % 3.9 > 1.6; if (locked !== lockT) { lockT = locked; looks.forEach((L) => { for (let i = 0; i < 30; i++) L.get(`cell${i}`)?.set({ locked }); }); } } };
    obj.userData.view = { pos: new THREE.Vector3(0, 62, -58), look: new THREE.Vector3(0, 0, 2) };
  } else if (id === 'combat:telegraphs.variants') {
    const h = (x, z) => bumps(x, z) + 1.6 * Math.exp(-((x - 18) ** 2) / 18) - z * 0.03;
    obj.add(groundMesh(110, h, (x, z) => (z > 4 ? 0.05 : 0.92)));
    const cells = [], keys = ['circle', 'outin', 'cone', 'line', 'lunge', 'floor'];
    keys.forEach((k, c) => {
      for (const [row, z0, friendly] of [[0, -10, false], [1, 12, false], [2, 30, true]]) {
        const at = new THREE.Vector3((c - 2.5) * 15, 0, z0); at.y = h(at.x, at.z);
        const w = W[k], opts = {};
        if (k === 'circle' || k === 'lunge') opts.points = [{ x: at.x, y: at.y, z: at.z + 4 }];
        if (k === 'floor') opts.pockets = [{ x: at.x - 2.5, z: at.z + 2, r: 1.3 }];
        cells.push({ key: k, at, level: 35, opts, friendly: friendly ? (c % 2 ? COLOR.fury : COLOR.desire) : false }); // (Desire's orange and Fury's red side by side: told apart in greys and in protanopia)
        if (row < 2) obj.add(numbersLine(k === 'outin' ? w.area : k === 'lunge' ? { ...w.area, length: w.area.reach } : w.area, h, at, 0, { centre: opts.points ? [0, 4] : null }));
        const m = maker(); m.position.copy(at); obj.add(m);
      }
    });
    // the caution edge (tracked, not locked; then locked), one cast's drops overlapping merged into one edge, a circle over the ridge
    const extra = [
      { key: 'tracked', at: new THREE.Vector3(-30, 0, 48), opts: { points: [{ x: -30, z: 50 }], locked: false } },
      { key: 'tracked', at: new THREE.Vector3(-14, 0, 48), opts: { points: [{ x: -14, z: 50 }], locked: true } },
      { key: 'baited', at: new THREE.Vector3(2, 0, 48), opts: { points: [{ x: 0.5, z: 50 }, { x: 2.5, z: 51 }, { x: 4, z: 49.6 }] } },
      { key: 'circle', at: new THREE.Vector3(18, 0, 44), opts: { points: [{ x: 18, z: 48 }] } },
    ];
    for (const e of extra) { e.at.y = h(e.at.x, e.at.z); e.level = 35; cells.push(e); const m = maker(); m.position.copy(e.at); obj.add(m); }
    loopCells(obj, cells, h);
    obj.userData.view = { pos: new THREE.Vector3(0, 70, -50), look: new THREE.Vector3(0, 0, 18) };
  } else if (id === 'combat:telegraphs.glyphs') {
    const h = () => 0;
    obj.add(groundMesh(60, h, (x, z) => (z > 0 ? 0.95 : 0.04), 8));
    const shim = { rawDt: 1 / 60 }, L = new TelegraphLook(shim, { scene: null }); obj.add(L.group);
    obj.userData.tick = () => {
      L.boards.n = 0;
      ATLAS_IDS.forEach((art, i) => {
        const col = i % 11, row = Math.floor(i / 11), tint = art.startsWith('status.') ? ({ stun: 0xf2cc5a, doubt: 0x6a96f0, charm: 0xf4a6bc, blind: 0x9ad8f0, confusion: 0xb48ae0, slow: 0x7fb2ff, halt: 0xbfe6ff, sleep: 0xd9c8ff, soaked: 0x8fd0c8 })[art.slice(7)] : 0xe6dcff;
        for (const z of [-4 - row * 3.4, 4 + row * 3.4]) L.board(art, new THREE.Vector3((col - 5) * 2.4, 0.1, z), 2, 1, tint, 1);
      });
      const g = L.boards.g; g.setDrawRange(0, L.boards.n * 6); for (const k of ['position', 'glyph', 'shift', 'tint']) g.attributes[k].needsUpdate = true; L.boards.mesh.visible = true;
    };
    obj.userData.view = { pos: new THREE.Vector3(0, 14, -26), look: new THREE.Vector3(0, 0, -6) };
  } else if (id === 'combat:telegraphs.bowl') {
    const DISH = Math.tan((4 * Math.PI) / 180), h = (x, z) => -(63 - Math.min(63, Math.hypot(x, z))) * DISH;
    obj.add(groundMesh(150, h, () => 0.75, 150));
    const jelly = maker(6); jelly.position.set(0, h(0, 0), 0); obj.add(jelly);
    const shim = { rawDt: 1 / 60 }, L = new TelegraphLook(shim, { scene: null }); L.ground = (x, z) => h(x, z); obj.add(L.group);
    const ids = Object.keys(CASTS).filter((k) => CASTS[k].mark), courier = new THREE.Vector3(6, 0, 24); courier.y = h(courier.x, courier.z);
    const pillars = [30, 90, 150, 210, 270, 330].map((b) => { const a = (b * Math.PI) / 180, p = new THREE.Vector3(Math.sin(a) * 45, 0, Math.cos(a) * 45); p.y = h(p.x, p.z); const m = new THREE.Mesh(new THREE.CylinderGeometry(3.75, 3.75, 30, 16), new THREE.MeshLambertMaterial({ color: 0x5a4a40 })); m.position.copy(p).add(new THREE.Vector3(0, 15, 0)); obj.add(m); return p; });
    const adds = [0, 1, 2, 3].map((i) => { const s = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 8), new THREE.MeshLambertMaterial({ color: 0x7a9a86 })); const a = i * 1.5 + 0.4; s.position.set(Math.sin(a) * 30, h(Math.sin(a) * 30, Math.cos(a) * 30) + 1.2, Math.cos(a) * 30); obj.add(s); return s; });
    let cur = -1, pt = 0;
    obj.userData.tick = (t) => {
      const dt = Math.max(0, Math.min(0.1, t - pt)); pt = t; shim.rawDt = dt;
      const per = 5.5, n = Math.floor(t / per) % ids.length, cast = ids[n], C = CASTS[cast], k = t % per, eta = C.windup - k;
      if (n !== cur) { L.clear(); cur = n; const mark = castMark(cast, 35); L.show(cast, mark, { origin: jelly.position, facing: { x: courier.x, z: courier.z }, eta, points: [courier], target: courier, pockets: [{ x: -20, z: 30, r: 5 }, { x: 25, z: -10, r: 6 }], rim: { centre: { x: 0, z: 0 }, radius: 63, band: 3 }, adds, bait: [{ ...pillars[0], y: pillars[0].y + 6 }], on: jelly, height: 14 }); }
      L.get(cast)?.eta(eta);
      L.update(dt);
    };
    obj.userData.view = { pos: new THREE.Vector3(30, 40, 80), look: new THREE.Vector3(0, 0, 0) };
  }
  return obj;
}
