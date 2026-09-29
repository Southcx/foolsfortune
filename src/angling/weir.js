import * as THREE from 'three';
import { PALETTE } from '../config.js';
import { label } from '../basement.js';
import { Fish } from './fish.js';
import { setHaloTexture } from './fishmesh.js';
import { SPECIES, BY_SPECIES, TIDES, TIDE_LEN, weightOf } from './species.js';
import { Ripples } from './lure.js';
import { sfx } from '../audio.js';

// ---------------------------------------------------------------------------------------
// THE WEIR: the Sondelass's own room, built for testing everything it does. A vaulted hall of still water, far out in the
// basement's layer (x 3000, z 400), teleport-only from the hub's index.
//
//   THE SHALLOWS  36 x 28 m, four terraces down: a wading shelf (0.55 m), a mid terrace (2 m), a deep bowl (4.2 m) and a trench
//                 (6 m) with an islet standing in it. The species keep to their depth bands, so where you cast decides what comes.
//   THE PIER      a plank pier out over the shelf to the mid terrace; the place to stand and cast from.
//   THE WELL      a 9.5 m shaft to the east, where the deep things live, and, at the top of the tide, the one that has no name.
//   THE YARD      a row of pots on plinths on the west side for the cutlass, and a tall pillar with a ledge for the hook.
//   THE TALLY     the north wall's board of every kind you have landed (a silhouette until you have), how many, the biggest.
//   THE LAMP      hangs over the water and shows the tide (low, rising, high, falling: 80 s each); which of the entities are
//                 about depends on it (species.js).
//   HOOK RINGS    on the ceiling beams over the water: what the grapnel is for.
// ---------------------------------------------------------------------------------------
// (basement.js's BASE_Y, restated: basement.js imports this file for the room's spawn, so importing it back would be a cycle)
const B = -14;
export const WOX = 3000, WOZ = 400;
export const WEIR_BOX = { x0: WOX, x1: WOX + 64, z0: WOZ, z1: WOZ + 48, H: 16 };
export const WEIR_SPAWN = { pos: [WOX + 32, 0.02, WOZ + 4], yaw: 0 };
const S0 = { x0: WOX + 14, x1: WOX + 50, z0: WOZ + 10, z1: WOZ + 38 };
const R1 = { x0: WOX + 17, x1: WOX + 47, z0: WOZ + 13, z1: WOZ + 35 };
const R2 = { x0: WOX + 21, x1: WOX + 43, z0: WOZ + 16, z1: WOZ + 32 };
const R3 = { x0: WOX + 27, x1: WOX + 37, z0: WOZ + 19, z1: WOZ + 29 };
const inR = (r, x, z) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1;
const SURF = -0.45, WSURF = -0.5;

/** Is a world point inside the hall? */
export function inWeir(p, pad = 0) {
  return p.x > WEIR_BOX.x0 - pad && p.x < WEIR_BOX.x1 + pad && p.z > WEIR_BOX.z0 - pad && p.z < WEIR_BOX.z1 + pad && p.y > B - 12 && p.y < B + WEIR_BOX.H + 2;
}

export const POOLS = [
  { id: 'shallows', name: 'THE SHALLOWS', ...S0, surface: B + SURF, bottom: B - 6, maxDepth: 6,
    depthAt: (x, z) => (inR(R3, x, z) ? 6 : inR(R2, x, z) ? 4.2 : inR(R1, x, z) ? 2 : 0.55), species: SPECIES.filter((s) => !s.legend).map((s) => s.id), cap: 13 },
  { id: 'well', name: 'THE WELL', x0: WOX + 53, x1: WOX + 62, z0: WOZ + 19, z1: WOZ + 29, surface: B + WSURF, bottom: B - 9.5, maxDepth: 9.5,
    depthAt: () => 9.5, species: ['dread', 'hush', 'hunger', 'lachryma'], cap: 3 },
];

export function buildWeir(L, env) {
  const C = PALETTE, S = L.scene;
  const blk = (x0, x1, y0, y1, z0, z1, color = C.mid, opts = {}) =>
    L.box([WOX + (x0 + x1) / 2, B + (y0 + y1) / 2, WOZ + (z0 + z1) / 2], [x1 - x0, y1 - y0, z1 - z0], color, opts);
  const solid = { outline: false, shadow: false };
  const TEAL = 0x2d5a5c, TEAL2 = 0x3f7f86;
  // the deck, around the pool and the well (thick, so the basins can be cut into them)
  const deck = (x0, x1, z0, z1) => blk(x0, x1, -10, 0, z0, z1, C.floor);
  deck(-1, 65, -1, 10); deck(-1, 65, 38, 49); deck(-1, 14, 10, 38); deck(50, 53, 10, 38); deck(62, 65, 10, 38); deck(53, 62, 10, 19); deck(53, 62, 29, 38);
  // the shallows: a bowl of terraces (each a solid, its top the bottom there)
  const local = (r) => [r.x0 - WOX, r.x1 - WOX, r.z0 - WOZ, r.z1 - WOZ];
  const [s0, s1, s2, s3] = local(S0), [a0, a1, a2, a3] = local(R1), [b0, b1, b2, b3] = local(R2), [c0, c1, c2, c3] = local(R3);
  blk(s0, s1, -10, -6, s2, s3, TEAL, solid);
  const ring = (o, i, top, color) => { // (the ring between two rects, up to `top`)
    blk(o[0], o[1], -10, top, o[2], i[2], color, solid); blk(o[0], o[1], -10, top, i[3], o[3], color, solid);
    blk(o[0], i[0], -10, top, i[2], i[3], color, solid); blk(i[1], o[1], -10, top, i[2], i[3], color, solid);
  };
  ring([s0, s1, s2, s3], [a0, a1, a2, a3], -1.0, C.wall);
  ring([a0, a1, a2, a3], [b0, b1, b2, b3], -2.45, TEAL2);
  ring([b0, b1, b2, b3], [c0, c1, c2, c3], -4.65, TEAL);
  blk(53 - 0.0, 62, -10, -9.5, 19, 29, TEAL, solid); // the well's floor
  env.water.add({ x0: S0.x0, x1: S0.x1, z0: S0.z0, z1: S0.z1, surface: B + SURF, bottom: B - 6 });
  env.water.add({ x0: WOX + 53, x1: WOX + 62, z0: WOZ + 19, z1: WOZ + 29, surface: B + WSURF, bottom: B - 9.5 });
  // walls and ceiling
  const H = WEIR_BOX.H;
  blk(-1, 0, -10, H, -1, 49, C.wall, solid); blk(64, 65, -10, H, -1, 49, C.wall, solid);
  blk(-1, 65, -10, H, -1, 0, C.wall, solid); blk(-1, 65, -10, H, 48, 49, C.wall, solid);
  blk(-1, 65, H, H + 0.6, -1, 49, C.deep, solid);
  // beams across the ceiling, and the rings that hang from them
  for (let x = 6; x < 64; x += 8) blk(x - 0.35, x + 0.35, H - 1.6, H, 0, 48, C.dark, solid);
  const ringMat = new THREE.MeshBasicMaterial({ color: C.glow });
  for (const [x, z] of [[14, 14], [14, 32], [26, 12], [38, 12], [26, 34], [38, 34], [50, 14], [50, 32], [32, 24]]) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 6, 20), ringMat);
    r.position.set(WOX + x, B + H - 2.4, WOZ + z); r.rotation.x = Math.PI / 2; S.add(r);
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 4), new THREE.MeshBasicMaterial({ color: C.dark }));
    chain.position.set(WOX + x, B + H - 1.9, WOZ + z); S.add(chain);
  }
  // the pier, its posts and lanterns
  blk(30, 34, -0.16, 0, 10, 26, C.wood);
  for (let z = 12; z <= 26; z += 4) { blk(30.1, 30.5, -2.4, 0, z - 0.2, z + 0.2, C.dark, solid); blk(33.5, 33.9, -2.4, 0, z - 0.2, z + 0.2, C.dark, solid); }
  for (const z of [12, 18, 24]) for (const x of [30.3, 33.7]) { blk(x - 0.05, x + 0.05, 0, 1.2, z - 0.05, z + 0.05, C.dark, solid); const l = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshBasicMaterial({ color: C.hot })); l.position.set(WOX + x, B + 1.3, WOZ + z); S.add(l); }
  // the islet in the trench, with a pillar to hook to
  blk(30.5, 33.5, -6, 0.15, 22.5, 25.5, C.wall);
  blk(31.5, 32.5, 0.15, 7, 23.5, 24.5, C.mid);
  blk(30.8, 33.2, 7, 7.3, 22.8, 25.2, C.dark);
  // the yard: plinths for the pots, and a tall pillar with a ledge
  for (let i = 0; i < 6; i++) blk(3.5, 5.5, 0, 0.8, 13 + i * 4, 15 + i * 4, C.mid);
  blk(8, 10.5, 0, 6, 30, 32.5, C.wall);
  blk(8, 12.5, 5.6, 6, 30, 34.5, C.dark);
  // the well's rim, and a stair of stones down to the water
  blk(52.6, 53, 0, 0.35, 18.6, 29.4, C.wall, solid); blk(62, 62.4, 0, 0.35, 18.6, 29.4, C.wall, solid);
  blk(52.6, 62.4, 0, 0.35, 18.6, 19, C.wall, solid); blk(52.6, 62.4, 0, 0.35, 29, 29.4, C.wall, solid);
  // lights
  const light = (x, y, z, i = 22, col = 0xffa066, far = 44) => { const l = new THREE.PointLight(col, i, far, 1.05); l.position.set(WOX + x, B + y, WOZ + z); S.add(l); return l; };
  for (const [x, z] of [[6, 6], [58, 6], [6, 42], [58, 42], [32, 6], [32, 42]]) light(x, 10, z, 20);
  light(24, -0.2, 24, 8, 0x66c4c8, 20); light(40, -0.2, 24, 8, 0x66c4c8, 20); light(57, 0.5, 24, 6, 0x8a6ad0, 14);
  // words
  const T = (t, x, z, o = {}) => label(S, t, [WOX + x, B + 0.02, WOZ + z], { rotY: Math.PI, ...o });
  T('THE WEIR', 32, 7.5, { width: 3.2, sub: 'Q draw · 2 the rod · wheel: aspect · hold LMB cast' });
  T('PIER', 32, 11.2, { width: 1.1, sub: 'hold LMB · release to cast' });
  T('THE YARD', 8, 11, { width: 2.2, sub: '1 cutlass · LMB combo · RMB lunge' });
  T('THE WELL', 57.5, 15.5, { width: 2, sub: 'deep things · the top of the tide' });
  T('HOOK', 23, 9, { width: 1.1, sub: '3 the hook · look up · LMB' });
}

export function spawnWeir(Bk, level) {
  const C = PALETTE;
  const kinds = ['jar', 'amphora', 'pitcher', 'melon', 'jar', 'amphora'];
  for (let i = 0; i < 6; i++) Bk.spawn({ kind: kinds[i], pos: [WOX + 4.5, B + 0.8 + 0.002, WOZ + 14 + i * 4], color: i % 2 ? C.potLight : C.pot, respawn: 6 });
  for (const [x, z, s] of [[9, 16, 1.0], [11, 20, 1.0], [9, 24, 0.9]]) level.crate([WOX + x, B + s / 2, WOZ + z], s);
}

// ---------------------------------------------------------------------------------------
// The room alive: the tide, the shoals that come with it, the tally board, the reeds and the mist.
// ---------------------------------------------------------------------------------------
export class Weir {
  constructor(game) {
    this.game = game;
    setHaloTexture(game.fx.haloTexture);
    this.pools = POOLS.map((p) => ({ ...p, fish: [] }));
    this.tide = 1; this.tideT = 0; this.t = 0; this.spawnT = 2;
    this.ripples = new Ripples(game.scene, 16);
    this.fish = []; // all of them
    this.hooks = null; // set by the Angler: { lure(), callbacks }
    this.sound = { r: 0, src: new THREE.Vector3() };
    this.legendSeen = -1;
    // the lamp over the water: shows the tide
    const g = (this.lamp = new THREE.Group());
    g.position.set(WOX + 32, B + 11.5, WOZ + 24);
    this.lampMat = new THREE.MeshBasicMaterial({ color: 0xffb27a });
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), this.lampMat));
    for (const r of [0.9, 1.3]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 4, 30), new THREE.MeshBasicMaterial({ color: 0xffe0c0 })); t.rotation.x = Math.PI / 2 + (r > 1 ? 0.4 : 0); g.add(t); this.lampRings = this.lampRings || []; this.lampRings.push(t); }
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 4, 4), new THREE.MeshBasicMaterial({ color: PALETTE.dark }));
    rod.position.y = 2.6; g.add(rod);
    this.lampLight = new THREE.PointLight(0xffb27a, 26, 60, 1.1);
    g.add(this.lampLight);
    game.scene.add(g);
    // the reeds: the only thing in the room that moves for no reason but the wind
    this.reeds = [];
    const reedMat = new THREE.MeshStandardMaterial({ color: 0x5a7a4a, roughness: 0.9, flatShading: true });
    const cone = new THREE.ConeGeometry(0.05, 1, 4); cone.translate(0, 0.5, 0);
    for (let i = 0; i < 34; i++) {
      const west = i % 2 === 0;
      const x = west ? WOX + 14.5 + Math.random() * 1.6 : WOX + 20 + Math.random() * 20, z = west ? WOZ + 11 + Math.random() * 26 : WOZ + 10.4 + Math.random() * 0.8;
      const m = new THREE.Mesh(cone, reedMat);
      const h = 1.2 + Math.random() * 1.1;
      m.scale.set(1, h, 1); m.position.set(x, B - 0.9, z); m.userData.p = Math.random() * 6;
      game.scene.add(m); this.reeds.push(m);
    }
    // a board of what has been landed
    this.board = this.buildBoard();
  }

  get near() { const p = this.game.player.pos; return inWeir(p, 8) || !!this.hooks?.lure()?.active; }
  poolAt(x, z) { for (const p of this.pools) if (x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1) return p; return null; }
  get tideDef() { return TIDES[this.tide]; }

  // ---- the tally board (on the north wall)
  buildBoard() {
    const c = document.createElement('canvas'); c.width = 1400; c.height = 620;
    const tex = new THREE.CanvasTexture(c);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(12, 12 * 620 / 1400), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    m.position.set(WOX + 32, B + 6.2, WOZ + 47.45); m.rotation.y = Math.PI;
    this.game.scene.add(m);
    return { c, tex, v: -1, m };
  }

  drawBoard() {
    const L = this.game.ledger, b = this.board, g = b.c.getContext('2d');
    g.clearRect(0, 0, b.c.width, b.c.height);
    g.fillStyle = 'rgba(28,13,8,.86)'; g.fillRect(0, 0, b.c.width, b.c.height);
    g.strokeStyle = '#ffb27a'; g.lineWidth = 5; g.strokeRect(8, 8, b.c.width - 16, b.c.height - 16);
    g.fillStyle = '#ffb27a'; g.font = '46px ui-monospace, monospace'; g.textAlign = 'left';
    g.fillText('THE TALLY', 40, 68);
    g.fillStyle = '#fbe3cf'; g.font = '26px ui-monospace, monospace'; g.textAlign = 'right';
    g.fillText(`${L.get('fish.total')} landed · ${L.under('fish.sp.').filter(([, v]) => v > 0).length}/${SPECIES.length} kinds`, b.c.width - 40, 66);
    SPECIES.forEach((sp, i) => {
      const col = i % 5, row = Math.floor(i / 5), x = 40 + col * 270, y = 110 + row * 250;
      const n = L.get(`fish.sp.${sp.id}`), cm = L.best(`fish.cm.${sp.id}`);
      g.fillStyle = 'rgba(255,178,122,.10)'; g.fillRect(x, y, 250, 230);
      g.fillStyle = n ? `#${sp.color.toString(16).padStart(6, '0')}` : '#3b1c13';
      g.beginPath(); g.ellipse(x + 125, y + 78, 62 + (sp.size[1] > 200 ? 10 : 0), 26, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(x + 185, y + 78); g.lineTo(x + 225, y + 48); g.lineTo(x + 225, y + 108); g.closePath(); g.fill();
      g.fillStyle = '#fbe3cf'; g.font = '25px ui-monospace, monospace'; g.textAlign = 'center';
      g.fillText(n ? sp.name.toUpperCase() : '? ? ?', x + 125, y + 150);
      g.font = '22px ui-monospace, monospace'; g.fillStyle = '#ffb27a';
      g.fillText(n ? `${n} · best ${Math.round(cm)} cm` : 'not yet landed', x + 125, y + 190);
    });
    b.tex.needsUpdate = true;
  }

  // ---- population
  weights(pool) {
    const out = [];
    for (const id of pool.species) {
      const sp = BY_SPECIES[id];
      if (sp.legend || !sp.tides.includes(this.tide)) continue;
      out.push([sp, sp.rarity]);
    }
    return out;
  }

  spawn(pool, sp, cm = null) {
    if (!sp) {
      const ws = this.weights(pool);
      if (!ws.length) return null;
      let r = Math.random() * ws.reduce((a, [, w]) => a + w, 0);
      for (const [s, w] of ws) { r -= w; if (r <= 0) { sp = s; break; } }
      sp = sp || ws[0][0];
    }
    const k = Math.pow(Math.random(), 1.7);
    const size = cm ?? sp.size[0] + (sp.size[1] - sp.size[0]) * k;
    const f = new Fish(pool, sp, size, new THREE.Vector3(0, 0, 0));
    for (let i = 0; i < 10; i++) {
      f.pickWaypoint();
      if (f.wp.distanceTo(this.game.player.pos) > 6) break;
    }
    f.pos.copy(f.wp); f.wp = null;
    this.game.scene.add(f.mesh.group);
    pool.fish.push(f); this.fish.push(f);
    return f;
  }

  remove(f) {
    f.dispose(this.game.scene);
    for (const p of this.pools) p.fish = p.fish.filter((x) => x !== f);
    this.fish = this.fish.filter((x) => x !== f);
  }

  /** The bell of the tide, and the shoals with it. */
  update(dt) {
    const g = this.game, near = this.near;
    this.t += dt;
    this.ripples.update(dt);
    this.tideT += dt;
    if (this.tideT >= TIDE_LEN) {
      this.tideT = 0; this.tide = (this.tide + 1) % TIDES.length;
      g.events?.emit('angle.tide', { phase: TIDES[this.tide].id, near });
      if (this.tide === 2 && g.ledger.get('fish.total') >= 5) this.wakeLegend();
    }
    // the lamp
    const td = TIDES[this.tide];
    this.lampMat.color.lerp(new THREE.Color(td.lamp), Math.min(1, dt * 1.5));
    this.lampLight.color.copy(this.lampMat.color);
    this.lampLight.intensity = 16 + 12 * [0.2, 0.7, 1, 0.55][this.tide];
    this.lamp.position.y = B + 11.5 + [0, 0.5, 1.0, 0.5][this.tide] * 0.9;
    this.lampRings.forEach((r, i) => { r.rotation.z += dt * (0.3 + i * 0.2); });
    if (!near) return;
    for (const r of this.reeds) r.rotation.z = Math.sin(this.t * 0.8 + r.userData.p) * 0.09;
    // shoals
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = 1.4;
      for (const p of this.pools) {
        const live = p.fish.filter((f) => !f.dying && f.sp.tides.includes(this.tide)).length;
        if (live < p.cap * (p.id === 'well' ? 0.7 : 1) && this.weights(p).length && !(p.id === 'well' && this.tide !== 2 && Math.random() < 0.6)) this.spawn(p);
      }
    }
    const hooks = this.hooks;
    const ctx = {
      lure: hooks?.lure() || null, tide: this.tide, near: true,
      sound: this.sound.r, sourcePos: this.sound.src, camera: g.camera,
      onProbe: hooks?.onProbe, onBite: hooks?.onBite, onMiss: hooks?.onMiss, onSpook: hooks?.onSpook,
    };
    for (const f of [...this.fish]) {
      if (f.pool && ctx.lure && ctx.lure.pool && ctx.lure.pool !== f.pool) { ctx.lure = null; }
      f.update(dt, { ...ctx, lure: ctx.lure && ctx.lure.pool === f.pool ? ctx.lure : null });
      if (f.dead) this.remove(f);
    }
    // a board redrawn when the ledger has moved (throttled)
    if (this.board.v !== g.ledger.version && this.t - (this.board.last || 0) > 1.5) { this.board.v = g.ledger.version; this.board.last = this.t; this.drawBoard(); }
  }

  wakeLegend() {
    const well = this.pools.find((p) => p.id === 'well');
    if (well.fish.some((f) => f.sp.legend)) return;
    const sp = BY_SPECIES.lachryma;
    const f = this.spawn(well, sp, sp.size[0] + Math.random() * (sp.size[1] - sp.size[0]));
    if (f && this.near) { sfx.leviathan(); this.game.events?.emit('angle.legend', {}); }
  }

  /** Called when the player leaves: the fish are put away, the lure retrieved. */
  reset() { for (const f of [...this.fish]) this.remove(f); }
}
