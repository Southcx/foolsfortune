// ---------------------------------------------------------------------------------------
// THE RACEWAY'S LOOKS (docs/plans/SKIFF-RACING.md; the owner, 2026-10-13): what the skiff-racing track in the Dunes shows, each in place
// of one of Dovina's placeholders (world/raceway/raceway.js, race.js). World marks only: no words, no numbers.
//   - THE SUN PLATES: each the sun's glyph set into the sand: a low glazed disc, gold rim and white face, sixteen rays; chevrons in front
//     and behind running the track's way; a slow shimmer; ridden over, a flash and a ring of light (`raceway.plate`). ALL the plates are
//     two instanced meshes: the glazed glyph (lit) and its glow (added light), so two draw calls however many plates.
//   - THE START ARCH'S COUNTDOWN: three sun glyphs hung under the arch's lintel, facing the grid, lit one a count (3, 2, 1: race.count)
//     and all three flaring on GO (race.go); they glow again while the line is next (the eight gates passed).
//   - THE GATES: a small sun glyph on the face of each gate pillar; the next gate's pair glows (race.next), the rest stay dim; a gate
//     passed flashes as it goes (race.gate). The arch's lamps and the gates' marks are two more instanced meshes, of the same two
//     materials (so two programs in all, warmed at boot: prewarmRacewayLooks).
//   - THE CARVE'S SPARKS BY TIER: while a carve loads (skiff.carve.charge { tier }), sand and sparks off the board's outside edge, growing
//     by tier (sand; gold sparks; white-gold sparks with the sail's glow); let go (skiff.carve { tier }), a burst and a short sand wake.
//     The library's effects (vfx/racewayeffects.js) on the shared particle pools: no meshes of its own.
//   - THE GHOST of your best lap (game.race.ghost): the Solar Skiff's own model cloned (SkeletonUtils, skinned as the model is) and worn
//     as the caster hologram (vfx/caster/hologram.js, one shared material) in a pale sand-gold. No new program: the hologram's skinned one
//     is warmed with the caster shaders.
//
// Prior art: F-Zero's dash plates (the flash and the arrows running the way to go), Mario Kart's boost pads (the chevrons) and its drift
// sparks and mini-turbo tiers (blue, orange, purple: ours sand, gold, white), Mario Kart's start lights on Lakitu's rod (a lamp a count,
// then all at once), Wave Race's buoys and Pilotwings' rings (the next one lit), Jet Moto's and Wave Race's rooster tails (the sand off
// the edge), Mario Kart's time-trial ghost (the best lap, see-through); the sun's glyph after the Gnomon's own disc and the Solar Skiff's
// summoning sigil (vfx/solar.js and courier/skiff/boat.js: the Raceway's power is the skiff's own).
//
//   game.racewayLooks = new RacewayLooks(game, opts?)   .update(dt)   (main.js; opts for the Workbench: parent, vfx, events, race, board,
//     skiffModel, player)
//   racewayLooks.dress(raceway)       the sun plates, the arch's lamps and the gates' marks, built over Dovina's placeholders (hidden)
//   racewayLooks.dressGhost(group)    the ghost's group worn as the skiff's hologram (as soon as the skiff's model is parsed)
//   racewayLooks.plateHit(i)          sun plate i flashes and rings (heard on skiff.plate, the plate under the Courier found)
//   prewarmRacewayLooks(scene) -> park    (main.js, before the compile: the two programs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { Hologram } from './caster/hologram.js';

/** The numbers: the plate's glyph (its radius in m, how far over the sand, the glow's size, the chevrons' scroll in tiles a real second);
 *  the shimmer (its rate, rad a real second, and the glow's low and high); the arch's lamps (radius, spacing, drop under the lintel, glow);
 *  the gates' marks (radius, height on the pillar, glow); the colours; the ghost's hologram. */
export const RACEWAY_LOOK = {
  plate: { r: 1.5, flat: 0.5, lift: 0.03, scroll: 1.3, flash: 0.6 }, // (its halo 2.2 glyph radii: 3.3 m; its height half its radius's)
  shimmer: { rate: 0.9, lo: 0.22, hi: 0.4 },
  lamp: { r: 0.95, spacing: 2.9, drop: 1.6, glow: 4.2 },
  gateMark: { r: 0.6, up: 4.6, glow: 3.4 },
  colour: { rim: 0xf2b33a, face: 0xfff3d6, boss: 0xf6c04e, rayLong: 0xffd77a, rayShort: 0xfff0c8, glow: 0xffd27a, flare: 0xfff4dc, emissive: 0xffb84a },
  ghost: { tint: 0xf0d49a, alpha: 0.62, slip: 0.25, flicker: 0.15, sweep: 0.7 },
};
const UP = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _s = new THREE.Vector3(), _v = new THREE.Vector3(), _c = new THREE.Color();
const GLOW = new THREE.Color(RACEWAY_LOOK.colour.glow), FLARE = new THREE.Color(RACEWAY_LOOK.colour.flare);
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

// ------------------------------------------------------------------ the shapes
/** A geometry painted one colour (non-indexed, position, normal and colour only: so any of them merge). */
function painted(geo, colour) {
  const g = geo.index ? geo.toNonIndexed() : geo, c = new THREE.Color(colour), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) c.toArray(a, i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k);
  return g;
}
/** Flat triangles (y up), each [a, b, c] of [x, z] at height y, wound to face up, painted. */
function flatTris(tris, y, colours) {
  const pos = [], nor = [], col = [], c = new THREE.Color();
  tris.forEach((t, i) => {
    let [a, b, d] = t; const cross = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
    if (cross > 0) [b, d] = [d, b]; // (counter-clockwise seen from above: x right, z toward the viewer)
    c.set(colours[i % colours.length]);
    for (const p of [a, b, d]) { pos.push(p[0], y, p[1]); nor.push(0, 1, 0); col.push(c.r, c.g, c.b); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}
/** The sun's glyph, radius 1, lying in its own XZ plane (+Y its face): a low glazed disc (gold rim, white face, a gold boss, a white
 *  ring inset) and sixteen rays round it, long and short. About 900 triangles. `chevrons`: three inlaid gold chevrons fore and aft. */
function sunGlyph(chevrons) {
  const C = RACEWAY_LOOK.colour, parts = [
    painted(new THREE.CylinderGeometry(1, 1.04, 0.07, 40, 1).translate(0, 0.035, 0), C.rim),
    painted(new THREE.TorusGeometry(0.84, 0.035, 4, 40).rotateX(-Math.PI / 2).translate(0, 0.075, 0), C.face),
    painted(new THREE.CylinderGeometry(0.64, 0.7, 0.1, 40, 1).translate(0, 0.05, 0), C.face),
    painted(new THREE.CylinderGeometry(0.28, 0.33, 0.13, 24, 1).translate(0, 0.065, 0), C.boss),
  ];
  const rays = [];
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2, long = k % 2 === 0, r0 = 1.06, r1 = long ? 1.55 : 1.3, w = long ? 0.11 : 0.08;
    rays.push([[Math.cos(a - w) * r0, Math.sin(a - w) * r0], [Math.cos(a + w) * r0, Math.sin(a + w) * r0], [Math.cos(a) * r1, Math.sin(a) * r1]]);
  }
  parts.push(flatTris(rays, 0.03, [C.rayLong, C.rayShort]));
  if (chevrons) { // (inlaid in the plate's own frame: +Z the track's way; scaled with the glyph, so in glyph radii)
    const ch = [];
    for (const z0 of [1.62, -2.24]) for (let j = 0; j < 2; j++) { const z = z0 + j * 0.34, h = 0.28, w = 0.55, t = 0.11;
      ch.push([[-w, z], [0, z + h], [0, z + h - t]], [[-w, z], [0, z + h - t], [-w, z - t]], [[w, z], [0, z + h - t], [0, z + h]], [[w, z], [w, z - t], [0, z + h - t]]); }
    parts.push(flatTris(ch, 0.025, [C.rim]));
  }
  return mergeGeometries(parts);
}

/** The glow's atlas: the left half a sun's soft halo with rays, the right half one chevron pointing up its column (it repeats down v). */
function glowAtlas() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d'), R = 64;
  const gr = g.createRadialGradient(R, R, 0, R, R, R);
  for (const [t, a] of [[0, 0.95], [0.3, 0.55], [0.62, 0.18], [1, 0]]) gr.addColorStop(t, `rgba(255,255,255,${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  g.save(); g.translate(R, R); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, len = R * (k % 2 ? 0.75 : 0.98), w = 0.05; const rg = g.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len); rg.addColorStop(0, 'rgba(255,255,255,0.35)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a - w) * len, Math.sin(a - w) * len); g.lineTo(Math.cos(a + w) * len, Math.sin(a + w) * len); g.fill(); }
  g.restore();
  // the chevron (its column's middle, pointing to the canvas's top: v up), soft at its sides so the column never shows its edge
  const cx = 192, gx = g.createLinearGradient(128, 0, 256, 0);
  for (const [t, a] of [[0, 0], [0.18, 1], [0.82, 1], [1, 0]]) gx.addColorStop(t, `rgba(255,255,255,${a})`);
  g.save(); g.beginPath(); g.moveTo(cx - 46, 92); g.lineTo(cx, 40); g.lineTo(cx + 46, 92); g.lineTo(cx + 46, 116); g.lineTo(cx, 64); g.lineTo(cx - 46, 116); g.closePath();
  g.clip(); g.fillStyle = gx; g.fillRect(128, 0, 128, 128); g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

/** The glow's quads (y up, +Z the way): a halo of radius 1 (the atlas's left half), and for a plate the chevron strips fore and aft
 *  (its right half), which scroll the track's way (`aScroll` 1) and fade at their ends (vertex colour). */
function glowGeometry(chevrons) {
  const pos = [], uv = [], col = [], scr = [], idx = [];
  const quad = (x0, x1, z0, z1, u0, u1, v0, v1, fade, scroll, rows = 1) => {
    const b = pos.length / 3;
    for (let r = 0; r <= rows; r++) { const k = r / rows, z = z0 + (z1 - z0) * k, v = v0 + (v1 - v0) * k, f = fade ? Math.sin(Math.PI * k) : 1;
      pos.push(x0, 0, z, x1, 0, z); uv.push(u0, v, u1, v); col.push(f, f, f, f, f, f); scr.push(scroll, scroll); }
    for (let r = 0; r < rows; r++) { const a = b + r * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  };
  const H = chevrons ? 2.2 : 1; quad(-H, H, H, -H, 0, 0.5, 0, 1, false, 0); // (the halo: a plate's runs out over the sand round it)
  if (chevrons) { // (in glyph radii, as the inlaid chevrons: two strips, each a little over three chevrons long)
    const w = 0.66, L = 0.8;
    quad(-w, w, 1.55, 1.55 + L, 0.5, 1, 0, L / 0.36, true, 1, 6);
    quad(-w, w, -1.55 - L, -1.55, 0.5, 1, 0, L / 0.36, true, 1, 6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aScroll', new THREE.Float32BufferAttribute(scr, 1));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(pos.length).fill(0).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setIndex(idx);
  return g;
}

// ------------------------------------------------------------------ the two materials (shared by every Raceway: two programs)
let MATS = null;
function materials() {
  if (MATS) return MATS;
  const C = RACEWAY_LOOK.colour;
  const glaze = new THREE.MeshStandardMaterial({ name: 'raceway-glyph', vertexColors: true, roughness: 0.3, metalness: 0.1, emissive: C.emissive, emissiveIntensity: 0.2 });
  const scroll = { value: 0 };
  const glow = new THREE.MeshBasicMaterial({ name: 'raceway-glow', map: glowAtlas(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  glow.onBeforeCompile = (sh) => { // (the chevrons' strips run the track's way: their v scrolled, the halo's held)
    sh.uniforms.uScroll = scroll;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aScroll;\nuniform float uScroll;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv.y -= aScroll * uScroll;\n#endif');
  };
  glow.customProgramCacheKey = () => 'raceway-glow';
  glow.userData.shared = glaze.userData.shared = true; // (one for the game: a room taken down never disposes it)
  MATS = { glaze, glow, scroll };
  return MATS;
}

/** One batch: an instanced glyph and its instanced glow, n each, in `parent`. */
function batch(parent, n, chevrons, zone) {
  const M = materials();
  const glyph = new THREE.InstancedMesh(sunGlyph(chevrons), M.glaze, n), glow = new THREE.InstancedMesh(glowGeometry(chevrons), M.glow, n);
  for (const m of [glyph, glow]) { m.instanceMatrix.setUsage(THREE.StaticDrawUsage); m.frustumCulled = false; if (zone) m.userData.zone = zone; for (let i = 0; i < n; i++) m.setColorAt(i, _c.set(1, 1, 1)); parent.add(m); }
  glyph.receiveShadow = true; glyph.castShadow = false; glow.renderOrder = 3;
  glyph.name = chevrons ? 'raceway-plates' : 'raceway-marks'; glow.name = `${glyph.name}-glow`;
  return { glyph, glow, n };
}
function place(B, i, pos, q, r, glowR, glowLift, flat = 1) {
  B.glyph.setMatrixAt(i, _m.compose(pos, q, _s.set(r, r * flat, r)));
  _v.set(0, glowLift, 0).applyQuaternion(q).add(pos);
  B.glow.setMatrixAt(i, _m.compose(_v, q, _s.set(glowR, 1, glowR)));
}

// ------------------------------------------------------------------ the looks
export class RacewayLooks {
  constructor(game, o = {}) {
    this.game = game;
    this.parent = o.parent || null; // (where the meshes go: the scene, or a Workbench stage)
    this.vfxOf = () => o.vfx || game.vfx;
    this.raceOf = o.race || (() => game.race);
    this.boardOf = o.board || (() => { const S = game.player?.techs?.get?.('skiff'); return S?.active && S.skiff?.group ? { group: S.skiff.group, heading: S.heading, carve: S.carve, vel: S.v } : null; });
    this.skiffModelOf = o.skiffModel || (() => game.player?.techs?.get?.('skiff')?.skiff?.model || null);
    this.playerOf = o.player || (() => game.player?.pos);
    this.t = 0; this.plates = null; this.marks = null; this.ghost = null;
    this.lit = 0; this.flareT = 0; this.goneT = 9; this.lamps = [0, 0, 0]; this.gateK = []; this.gateFlash = [];
    this.carveH = null; this.sailH = null; this.tier = 0;
    const E = o.events || game.events;
    if (E) {
      E.on('skiff.plate', (e) => this.plateUnder(e));
      E.on('skiff.carve.charge', (e) => this.charge(e.tier));
      E.on('skiff.carve', (e) => this.release(e.tier));
      for (const n of ['skiff.bail', 'skiff.end', 'skiff.recall']) E.on(n, () => this.stopCarve());
      E.on('race.start', () => { this.lit = 0; this.flareT = 0; this.goneT = 9; });
      E.on('race.count', (e) => { this.lit = Math.max(this.lit, Math.min(3, 4 - (e.n | 0))); }); // (3, 2, 1: one lamp, two, three)
      E.on('race.go', () => { this.lit = 3; this.flareT = 1; this.goneT = 0; });
      for (const n of ['race.end', 'race.finish']) E.on(n, () => { this.lit = 0; this.flareT = 0; this.goneT = 9; });
      E.on('race.gate', (e) => { const i = (e.gate | 0) - 1; if (i >= 0) this.gateFlash[i] = 1; });
    }
  }

  // ---------------------------------------------------------------- the sun plates, the arch's lamps, the gates' marks
  /** Built over a Raceway's placeholders (raceway.js build, after buildMarks): her plate slabs hidden, the glyphs and lamps placed. */
  dress(R) {
    this.undress();
    const parent = this.parent || this.game.scene, L = RACEWAY_LOOK, T = R.T;
    // the plates: where her slabs lie, tilted to the sand under them, the glyph's +Z along the track
    const P = (this.plateAt = R.plates.map((p) => {
      const m = p.mesh, pos = m.position.clone(); pos.y = R.heightAt(pos.x, pos.z) + L.plate.lift;
      const n = R.normalAt(pos.x, pos.z, new THREE.Vector3()), q = new THREE.Quaternion().setFromUnitVectors(UP, n).multiply(_q.setFromAxisAngle(UP, m.rotation.y));
      m.visible = false; m.userData.dressed = true;
      return { pos, q, n };
    }));
    const B = (this.plates = batch(parent, Math.max(1, P.length), true, 'raceway'));
    P.forEach((p, i) => place(B, i, p.pos, p.q, L.plate.r, L.plate.r, 0.13, L.plate.flat)); // (the glow in glyph radii too: its strips lie on the inlaid chevrons)
    B.glyph.count = B.glow.count = P.length;
    this.flash = P.map(() => 0);
    // the start arch's lamps and the gates' marks, as raceway.js builds the arch and the pillars (her numbers: the arch 3 m outside the
    // track's edge and 11 m over the higher foot, the lintel 1.4 m deep and 2 m thick over it; a gate's pillar 2.5 m outside, 8 m tall
    // from 1.5 m under its foot, 1.5 m square)
    const side = (s, lat) => { const F = T.frame(s); return R.local(F.x - F.fz * lat, F.z + F.fx * lat); };
    const facing = (s) => { const F = T.frame(s); return new THREE.Vector3(-F.fx, 0, -F.fz).normalize(); }; // (toward the oncoming board)
    const marks = [];
    { const s = T.line, F = T.frame(s), a = side(s, -(F.w + 3)), b = side(s, F.w + 3), top = Math.max(a.y, b.y) + 11, n = facing(s);
      const right = new THREE.Vector3(-F.fz, 0, F.fx).normalize(), mid = a.clone().add(b).multiplyScalar(0.5).setY(top - 0.1 - L.lamp.drop);
      for (let k = -1; k <= 1; k++) marks.push({ kind: 'lamp', k: k + 1, pos: mid.clone().addScaledVector(right, k * L.lamp.spacing).addScaledVector(n, 1.0), n, r: L.lamp.r, glow: L.lamp.glow }); }
    T.gates.forEach((s, gi) => { const F = T.frame(s), n = facing(s);
      for (const sg of [-1, 1]) { const p = side(s, sg * (F.w + 2.5)); marks.push({ kind: 'gate', gate: gi, pos: p.clone().setY(p.y + L.gateMark.up).addScaledVector(n, 0.75 + 0.02), n, r: L.gateMark.r, glow: L.gateMark.glow }); } });
    const M = (this.marks = batch(parent, marks.length, false, 'raceway'));
    marks.forEach((k, i) => { k.q = new THREE.Quaternion().setFromUnitVectors(UP, k.n); place(M, i, k.pos, k.q, k.r, k.glow / 2, 0.15); });
    this.markList = marks;
    this.gateK = T.gates.map(() => 0); this.gateFlash = T.gates.map(() => 0);
    for (const X of [B, M]) { X.glyph.instanceMatrix.needsUpdate = X.glow.instanceMatrix.needsUpdate = true; X.glyph.computeBoundingSphere?.(); }
    this.R = R;
    return this;
  }
  undress() {
    for (const X of [this.plates, this.marks]) if (X) for (const m of [X.glyph, X.glow]) { m.parent?.remove(m); m.geometry.dispose(); m.dispose?.(); }
    this.plates = this.marks = null;
  }

  /** Sun plate i ridden over: its glyph and glow flash, and a ring of light runs out over the sand. */
  plateHit(i) {
    const p = this.plateAt?.[i]; if (!p) return;
    this.flash[i] = 1;
    this.vfxOf()?.play('raceway.plate', { pos: p.pos, normal: p.n });
  }
  /** skiff.plate: the plate the Courier is on (the payload's `plate` if it says, else the nearest within its length). */
  plateUnder(e) {
    if (!this.plateAt) return;
    if (Number.isInteger(e?.plate)) { this.plateHit(e.plate); return; }
    const at = this.playerOf(); if (!at) return;
    let best = -1, bd = 36; // (within 6 m of a plate's middle: a plate is 7 m long)
    this.plateAt.forEach((p, i) => { const d = (p.pos.x - at.x) ** 2 + (p.pos.z - at.z) ** 2; if (d < bd) { bd = d; best = i; } });
    if (best >= 0) this.plateHit(best);
  }

  // ---------------------------------------------------------------- the carve's sparks
  /** The board's outside edge (away from the turn) and the way the sand goes off it, for a held effect's frame. */
  edge(h, B, stern) {
    const a = B.heading, f = _v.set(Math.sin(a), 0, Math.cos(a)), r = _s.set(-Math.cos(a), 0, Math.sin(a)), out = -(B.carve?.dir || this.lastDir || 1);
    h.pos.copy(B.group.position).addScaledVector(r, out * (stern ? 0 : 0.5)).addScaledVector(f, stern ? -1.3 : -0.35); h.pos.y -= 0.45;
    h.dir.copy(r).multiplyScalar(stern ? 0 : out).addScaledVector(UP, stern ? 0.6 : 0.7).addScaledVector(f, stern ? -1 : -0.5).normalize();
    if (B.vel) h.ctx.vel = B.vel;
  }
  charge(tier) {
    const V = this.vfxOf(), B = this.boardOf(); if (!V || !B) return;
    this.carveH?.stop(); this.tier = tier; this.lastDir = B.carve?.dir || this.lastDir || 1;
    const tint = [0xf0c890, 0xffc24a, 0xfff6e0][Math.min(3, Math.max(1, tier)) - 1];
    const follow = (h) => { const b = this.boardOf(); if (!b?.carve || this.tier !== tier) return false; this.edge(h, b, false); return true; };
    this.carveH = V.play(`skiff.carve.charge.${Math.min(3, Math.max(1, tier))}`, { follow }); follow(this.carveH);
    const pop = V.play('skiff.carve.tier', { tint, pos: this.carveH.pos, dir: this.carveH.dir }); pop.ctx.vel = B.vel;
    if (tier >= 3 && !this.sailH?.alive) {
      const sail = (h) => { const b = this.boardOf(); if (!b?.carve || this.tier < 3) return false; h.pos.set(0, 2.4, 0.2); b.group.localToWorld(h.pos); return true; };
      this.sailH = V.play('skiff.carve.sail', {}); sail(this.sailH); this.sailH.ctx.follow = sail;
    }
  }
  release(tier) {
    const V = this.vfxOf(), B = this.boardOf();
    this.stopCarve(); if (!V || !B) return;
    const t = Math.min(3, Math.max(1, tier | 0)), tint = [0xf0c890, 0xffc24a, 0xfff6e0][t - 1];
    const h = { pos: new THREE.Vector3(), dir: new THREE.Vector3(), ctx: {} }; this.edge(h, B, true);
    V.play('skiff.carve.release', { pos: h.pos, dir: h.dir, tint, power: 0.6 + 0.4 * t });
    let left = 0.6; // (the wake: held at the stern a moment, as the board runs out of the carve)
    const wake = (w, raw) => { const b = this.boardOf(); if (!b || (left -= raw) < 0) return false; this.edge(w, b, true); return true; };
    const w = V.play('skiff.carve.wake', { pos: h.pos, dir: h.dir, follow: wake }); w.ctx.vel = B.vel;
  }
  stopCarve() { this.carveH?.stop(); this.sailH?.stop(); this.carveH = this.sailH = null; this.tier = 0; }

  // ---------------------------------------------------------------- the ghost
  /** The ghost's group (race.js updateGhost, once made): worn as the skiff's hologram as soon as the model is there; her placeholder hull
   *  and sail shown until then. */
  dressGhost(group) { if (this.ghost?.group === group) return; this.undressGhost(); this.ghost = { group, holo: null }; this.tryGhost(); }
  tryGhost() {
    const G = this.ghost; if (!G || G.holo) return;
    const model = this.skiffModelOf(); if (!model) return;
    const body = cloneSkinned(model), drop = [];
    body.traverse((o) => { if (o.userData?.isOutline) drop.push(o); }); // (the inverted hulls: a hologram has no ink line)
    for (const o of drop) o.parent?.remove(o);
    body.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = o.receiveShadow = false; } });
    G.placeholder = [...G.group.children]; for (const c of G.placeholder) c.visible = false;
    body.name = 'raceway-ghost'; G.group.add(body); G.body = body;
    const C = RACEWAY_LOOK.ghost;
    G.holo = new Hologram(this.game, { target: body, tint: C.tint, alpha: C.alpha, slip: C.slip, flicker: C.flicker, sweep: C.sweep });
  }
  undressGhost() {
    const G = this.ghost; if (!G) return;
    G.holo?.dispose(); G.body?.parent?.remove(G.body); for (const c of G.placeholder || []) c.visible = true;
    this.ghost = null;
  }

  // ---------------------------------------------------------------- per frame
  update(dt) {
    this.t += dt;
    if (this.ghost) { this.tryGhost(); if (this.ghost.holo && this.ghost.group.visible) this.ghost.holo.update(dt); }
    if (!this.plates) return;
    const L = RACEWAY_LOOK, M = materials(), t = this.t, gl = _c;
    // the plates: a slow shimmer through the glaze (all together) and the glow (each a beat behind the last), the chevrons running
    M.glaze.emissiveIntensity = 0.16 + 0.1 * (0.5 + 0.5 * Math.sin(t * L.shimmer.rate));
    M.scroll.value = (t * L.plate.scroll) % 1;
    const B = this.plates;
    for (let i = 0; i < this.flash.length; i++) {
      const f = (this.flash[i] = Math.max(0, this.flash[i] - dt / L.plate.flash)), e = f * f;
      const sh = L.shimmer.lo + (L.shimmer.hi - L.shimmer.lo) * (0.5 + 0.5 * Math.sin(t * L.shimmer.rate * 1.7 - i * 1.3));
      B.glyph.setColorAt(i, gl.setScalar(1 + 1.3 * e));
      B.glow.setColorAt(i, gl.copy(GLOW).multiplyScalar(sh + 1.8 * e));
    }
    B.glyph.instanceColor.needsUpdate = B.glow.instanceColor.needsUpdate = true;
    // the arch's lamps: one a count, all flaring on GO and fading after; glowing again while the line is next
    const race = this.raceOf(), running = !!race?.running, lineNext = running && race.state === 'run' && race.next >= (this.gateK.length || 8);
    this.flareT = Math.max(0, this.flareT - dt / 0.9); if (this.goneT < 9) this.goneT += dt;
    for (let k = 0; k < 3; k++) {
      let want = (running && k < this.lit) ? 1 : 0;
      if (this.goneT < 9) want = this.goneT < 1.4 ? 1 + 1.2 * this.flareT : 0; // (after GO: the flare, held a beat, then out)
      if (lineNext) want = Math.max(want, 0.55 + 0.15 * Math.sin(t * 2.2));
      this.lamps[k] = damp(this.lamps[k], want, want > this.lamps[k] ? 22 : 4, dt);
    }
    // the gates: the next pair glows (a slow breath, never a blink); a gate passed flashes as it goes
    for (let g = 0; g < this.gateK.length; g++) {
      const want = running && race.state === 'run' && race.next === g ? 1 : 0;
      this.gateK[g] = damp(this.gateK[g], want, want ? 10 : 3, dt); this.gateFlash[g] = Math.max(0, (this.gateFlash[g] || 0) - dt / 0.5);
    }
    const K = this.marks, flare = this.goneT < 1.4 ? this.flareT : 0;
    this.markList.forEach((k, i) => {
      if (k.kind === 'lamp') { const v = this.lamps[k.k];
        K.glyph.setColorAt(i, gl.setScalar(0.22 + 1.4 * Math.min(1.6, v))); // (unlit: dull bronze; lit: bright glaze)
        K.glow.setColorAt(i, gl.copy(GLOW).lerp(FLARE, Math.min(1, flare)).multiplyScalar(1.4 * v)); }
      else { const v = this.gateK[k.gate] * (0.85 + 0.15 * Math.sin(t * 1.9)), f = this.gateFlash[k.gate];
        K.glyph.setColorAt(i, gl.setScalar(0.3 + 1.5 * v + 1.2 * f));
        K.glow.setColorAt(i, gl.copy(GLOW).multiplyScalar(1.6 * v + 1.6 * f)); }
    });
    K.glyph.instanceColor.needsUpdate = K.glow.instanceColor.needsUpdate = true;
  }
}

/** The boot's warm-up (main.js): one batch of each kind 50 m down for the compile, hidden after the prime draw (the materials live on). */
export function prewarmRacewayLooks(scene) {
  const g = new THREE.Group(); g.position.set(0, -50, 0); g.userData.zoneFree = true; scene.add(g);
  const a = batch(g, 1, true), b = batch(g, 1, false);
  for (const X of [a, b]) for (const m of [X.glyph, X.glow]) { m.setMatrixAt(0, _m.identity()); m.userData.zoneFree = true; }
  return () => { g.visible = false; };
}
