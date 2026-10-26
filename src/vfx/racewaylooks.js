// ---------------------------------------------------------------------------------------
// THE RACEWAY'S LOOKS (docs/plans/SKIFF-RACING.md; the owner, 2026-10-13): what the skiff-racing track in the Dunes shows, each in place
// of one of Dovina's placeholders (world/raceway/raceway.js, race.js). World marks only: no words, no numbers.
//   - THE SUN PLATES: each the sun's glyph set into the sand: a low glazed disc, gold rim and white face, sixteen rays; chevrons in front
//     and behind running the track's way; a slow shimmer; ridden over, a flash and a ring of light (`raceway.plate`). ALL the plates are
//     two merged meshes: the glazed glyph (lit) and its glow (added light; the chevrons scrolled by its map's offset), two draw calls.
//   - THE START ARCH'S COUNTDOWN: three sun glyphs hung under the arch's lintel, facing the grid, lit one a count (3, 2, 1: race.count)
//     and all three flaring on GO (race.go); they glow again while the line is next (the eight gates passed).
//   - THE GATES: a small sun glyph on the face of each gate pillar; the next gate's pair glows (race.next), the rest stay dim; a gate
//     passed flashes as it goes (race.gate). The arch's lamps and the gates' marks are one instanced mesh, lit by its instance colour,
//     their glow the shared particle pools (`raceway.lamp`, `raceway.gate`). Every material is stock and matches a program the boot
//     already builds (measured: no program added, Petra's cap).
//   - THE CARVE'S SPARKS BY TIER: while a carve loads (skiff.carve.charge { tier }), sand and sparks off the board's outside edge, growing
//     by tier (sand; gold sparks; white-gold sparks with the sail's glow); let go (skiff.carve { tier }), a burst and a short sand wake.
//     The library's effects (vfx/racewayeffects.js) on the shared particle pools: no meshes of its own.
//   - THE GHOST of your best lap (game.race.ghost): the Solar Skiff's own model cloned (SkeletonUtils, skinned as the model is) and worn
//     as the caster hologram (vfx/caster/hologram.js, one shared material) in a pale sand-gold. No new program: the hologram's skinned one
//     is warmed with the caster shaders.
//   - THE EDGE STRINGS (round 2, the owner's ask after the first race): beads of light on a thread along both edges of the running
//     surface, a bright run flowing the race's way just ahead of the board (vfx/racewayedgestrings.js; data raceway.edgeLines).
//   - THE GRIND RAILS: Dovina's ruin lintels re-cut as glazed stone (an amber ame glaze over an iron-dark drip line, the top worn
//     through to pale bisque where the keel runs, the columns the Dunes' clay with a gold capital), the same mesh, material and draw.
//     While the keel grinds (skiff.grind .. skiff.grind.end): sparks and sand off the contact, a bright streak left on the rail's top,
//     a soft hum of gold under the board; a burst as it locks on and lets go. The library's effects on the shared particle pools.
//   - THE SUN RINGS (Dovina's SolarRing, hung in the air): flown through (skiff.ring), a flash at the heart, the air's motes drawn in
//     round the rim and out through it, and the ring pulsing once (SolarRing.pulse).
//   - ROUND 3 (Dovina's handoff, 2026-10-14; the owner after his first race): the carve's sparks much bigger, clearly up a tier, tier 3
//     a real spray (racewayeffects.js). Every boost glows in Lachryma's colour (skiff.boosting): the boat's energy and cloth (boat.js
//     SKIFF_BOOST_GLOW) and Lachryma thrown back off the stern (`skiff.boost`, held while pushed), the carve's release and a plate's
//     push in it too. The perfect pop (skiff.pop { perfect }) the sun's glyph struck in Lachryma on the board, the boat flashing with
//     it; a plain late pop a small ring; one too late (skiff.pop.miss) a dud puff. The trick combo's gauge and banked flares worn on
//     the board (vfx/skiffcombomarks.js), its link, step, bank and drop each a moment. The sun plates by the sun (raceway.sun): their
//     glow, glaze and chevrons dim toward night; ridden dark (skiff.plate { power: 0 }) a cold dull answer. The cavern's crystal veins
//     are left out of the plates' dress (their look is the cavern's own).
//   - ROUND 4, THE PARK (Dovina's handoff, 2026-10-14; SKIFF-RACING.md 10): every track's arch, gates and start pillar dressed with the
//     same lamps and marks (in the same one instanced draw; only the raced track's light), a sun glyph on each start pillar breathing
//     while the Courier is near and no race runs; every track's edge strings in the one set of draws (the board's track runs), broken
//     where edgeLines says a point lies on the other line's road, hung over a bridge's deck; the combo's marks moved aft (the owner);
//     and the grind's balance mark (vfx/grindbalancemark.js) worn behind the stern while the keel grinds (the owner). The sandfalls
//     are dressed where they are hung (world/raceway/kit.js, cavern.js: RacewaySandfall, one program for all five).
//   - ROUND 6 (Dovina's handoff, 2026-10-14; SKIFF-RACING.md 12): the board's stakes worn on it (vfx/skiffboardlooks.js: the scorch, the
//     hull's damage and wear, a wreck, the manual's tail-up tilt), the grind's balance mark shown for the manual's lean too, the buoys
//     dressed as the Raceway's kit (vfx/racewaybuoys.js) and their power as a row of chevrons on the board (vfx/skiffcombomarks.js).
//
// Prior art: F-Zero's dash plates (the flash and the arrows running the way to go), Mario Kart's boost pads (the chevrons) and its drift
// sparks and mini-turbo tiers (blue, orange, purple: ours sand, gold, white), Mario Kart's start lights on Lakitu's rod (a lamp a count,
// then all at once), Wave Race's buoys and Pilotwings' rings (the next one lit), Jet Moto's and Wave Race's rooster tails (the sand off
// the edge), Mario Kart's time-trial ghost (the best lap, see-through); the sun's glyph after the Gnomon's own disc and the Solar Skiff's
// summoning sigil (world/dunes/solar.js and courier/skiff/boat.js: the Raceway's power is the skiff's own).
//
//   game.racewayLooks = new RacewayLooks(game, opts?)   .update(dt)   (main.js; opts for the Workbench: parent, vfx, events, race, board,
//     skiffModel, player)
//   racewayLooks.dress(raceway)       (or yield* racewayLooks.dressSteps(raceway): one part a step) the sun plates, the arch's lamps and the gates' marks, built over Dovina's placeholders (hidden)
//   racewayLooks.dressGhost(group)    the ghost's group worn as the skiff's hologram (as soon as the skiff's model is parsed)
//   racewayLooks.plateHit(i)          sun plate i flashes and rings (heard on skiff.plate, the plate under the Courier found)
//   racewayLooks.pop(e) / comboLink(e) / comboBank() / comboDrop()   round 3's moments (heard on their events)
//   racewayLooks.dressRound2(raceway) the edge strings, the rails' glaze and the rings' passes (dress() calls it; call it again if the
//                                     rails, rings or edges are built after dress)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { Hologram } from './caster/hologram.js';
import { RacewayEdgeStrings, EDGE_STRINGS } from './racewayedgestrings.js';
import { ensureSmoothNormals } from '../render/outline.js';
import { lightAt } from '../progress/weather.js';
import { SkiffComboMarks, COMBO_MARKS, sunAt } from './skiffcombomarks.js';
import { GrindBalanceMark } from './grindbalancemark.js';
import { SkiffBoardLooks } from './skiffboardlooks.js';
import { RacewayBuoys } from './racewaybuoys.js';

/** The numbers: the plate's glyph (its radius in m, how far over the sand, the glow's size, the chevrons' scroll in tiles a real second);
 *  the shimmer (its rate, rad a real second, and the glow's low and high); the arch's lamps (radius, spacing, drop under the lintel, glow);
 *  the gates' marks (radius, height on the pillar, glow); the colours; the ghost's hologram. */
export const RACEWAY_LOOK = {
  plate: { r: 1.5, flat: 0.5, lift: 0.03, scroll: 1.3, flash: 0.6 }, // (its halo 2.2 glyph radii: 3.3 m; its height half its radius's)
  shimmer: { rate: 0.9, lo: 0.22, hi: 0.4 },
  lamp: { r: 0.95, spacing: 2.9, drop: 1.6, glow: 4.2 },
  gateMark: { r: 0.6, up: 4.6, glow: 3.4 },
  startMark: { r: 0.75, up: 5, out: 2.45, near: 16 }, // (a start pillar's: on its face toward the line, 5 m up, 2.45 m out from its axis; lit within 16 m)
  colour: { rim: 0xf2b33a, face: 0xfff3d6, boss: 0xf6c04e, rayLong: 0xffd77a, rayShort: 0xfff0c8, glow: 0xffd27a, flare: 0xfff4dc, emissive: 0xffb84a },
  ghost: { tint: 0xf0d49a, alpha: 0.62, slip: 0.25, flicker: 0.15, sweep: 0.7 },
  // the grind rails' glaze (the lintel's body, its drip line, the glaze thinning to the edge, the top worn through; the columns' clay and
  // gold capital; the glaze's sheen; metres between columns), and the grind's contact (m under the board's origin: the keel on the rail)
  rail: { body: 0xb8692e, drip: 0x4a2414, edge: 0xd9944e, worn: 0xfff0c8, clay: 0xd9906a, capital: 0xffd696, roughness: 0.5, post: 8 },
  grind: { contact: 0.4 },
  // round 3: the plates by the sun (the glow's and the glaze's share left at night, the chevrons' scroll's; the hit's colour cold to
  // warm by power; how fast the look follows the sun, per real second); the boost's look (shown from this much push; the stern, m);
  // the carve's wake by tier (real seconds)
  sun: { glowNight: 0.06, glazeNight: 0.05, scrollNight: 0.12, cold: 0x9fb0c8, warm: 0xffe2a0, follow: 1.5 },
  boost: { from: 0.12, stern: 1.6, up: -0.05 },
  wake: [0.5, 0.8, 1.1],
};
const UP = new THREE.Vector3(0, 1, 0);
const _rm = new THREE.Matrix4();
/** The rails' six painted pieces, made once: the lintel's four strips a unit long down z (the body, its top at +0.12; the drip line
 *  under; the glaze thinning to the edge; worn through where the keel runs), the column a unit tall, the capital. */
let _railTpl = null;
function railPieces() {
  if (_railTpl) return _railTpl;
  const C = RACEWAY_LOOK.rail, arr = (g, colour) => { const p = painted(g, colour); const t = { pos: p.attributes.position.array, nor: p.attributes.normal.array, col: new THREE.Color(colour).toArray() }; p.dispose(); return t; };
  const strips = [arr(new THREE.BoxGeometry(0.54, 0.24, 1), C.body), arr(new THREE.BoxGeometry(0.6, 0.07, 1).translate(0, -0.12, 0), C.drip),
    arr(new THREE.BoxGeometry(0.46, 0.03, 1).translate(0, 0.13, 0), C.edge), arr(new THREE.BoxGeometry(0.24, 0.03, 1).translate(0, 0.155, 0), C.worn)];
  const column = arr(new THREE.CylinderGeometry(0.2, 0.28, 1, 6), C.clay), capital = arr(new THREE.BoxGeometry(0.62, 0.16, 0.62), C.capital);
  return (_railTpl = { strips, column, capital, lintel: strips.reduce((n, t) => n + t.pos.length / 3, 0), post: (column.pos.length + capital.pos.length) / 3 });
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _s = new THREE.Vector3(), _v = new THREE.Vector3(), _c = new THREE.Color(), _c2 = new THREE.Color();
const GLOW = new THREE.Color(RACEWAY_LOOK.colour.glow);
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

/** The glow's atlas: the left half a gradient across u only (bright at u 0, gone by u 0.5: the halo's fan carries its radius in u, so
 *  its v never matters), the right half one chevron pointing up its column (repeating down v). The map's offset scrolls v, which runs
 *  the chevrons the track's way and leaves the halo as it is: one stock material, one mesh. */
function glowAtlas() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 124, 0);
  for (const [t, a] of [[0, 0.95], [0.3, 0.5], [0.65, 0.15], [1, 0]]) gr.addColorStop(t, `rgba(255,255,255,${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 64);
  const cx = 192, gx = g.createLinearGradient(128, 0, 256, 0); // (the chevron, soft at its sides so the column never shows its edge)
  for (const [t, a] of [[0, 0], [0.18, 1], [0.82, 1], [1, 0]]) gx.addColorStop(t, `rgba(255,255,255,${a})`);
  g.save(); g.beginPath(); g.moveTo(cx - 46, 46); g.lineTo(cx, 20); g.lineTo(cx + 46, 46); g.lineTo(cx + 46, 58); g.lineTo(cx, 32); g.lineTo(cx - 46, 58); g.closePath();
  g.clip(); g.fillStyle = gx; g.fillRect(128, 0, 128, 64); g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

/** A plate's glow in glyph radii (y up, +Z the way): a halo as a fan (its radius in u: 0 at the middle, 0.49 at its rim), sixteen soft
 *  rays the same way, and the chevron strips fore and aft (the atlas's right half, v along the way). Position and uv only. */
function plateGlowGeometry() {
  const pos = [], uv = [], H = 2.2, N = 24, U = 0.49;
  const tri = (a, b, c) => { for (const [x, z, u, v] of [a, b, c]) { pos.push(x, 0, z); uv.push(u, v); } };
  for (let k = 0; k < N; k++) { const a0 = (k / N) * Math.PI * 2, a1 = ((k + 1) / N) * Math.PI * 2;
    tri([0, 0, 0, 0.5], [Math.cos(a1) * H, Math.sin(a1) * H, U, 0.5], [Math.cos(a0) * H, Math.sin(a0) * H, U, 0.5]); }
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, r1 = k % 2 ? 2.0 : 2.6, w = 0.07, r0 = 0.9;
    tri([Math.cos(a - w) * r0, Math.sin(a - w) * r0, U * 0.35, 0.5], [Math.cos(a) * r1, Math.sin(a) * r1, U, 0.5], [Math.cos(a + w) * r0, Math.sin(a + w) * r0, U * 0.35, 0.5]); }
  const strip = (z0, z1) => { const w = 0.66, v1 = (z1 - z0) / 0.36; tri([-w, z0, 0.5, 0], [w, z0, 1, 0], [w, z1, 1, v1]); tri([-w, z0, 0.5, 0], [w, z1, 1, v1], [-w, z1, 0.5, v1]); };
  strip(1.55, 2.35); strip(-2.35, -1.55);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

// ------------------------------------------------------------------ the materials: stock ones, each matching a program the boot warms
// (Petra's cap on programs: measured on a primed boot, each of these added none. The plates' glyph is the vertex-coloured standard of
// the props and the garden's ware, merged and not instanced; the marks' glyph the instanced standard of the barnacles (vfx/leviathan.js
// as drawn there, not flat); the glow the additive mapped basic of the halos (vfx/charybdis.js), merged. The marks glow with the
// shared particle pools.)
let MATS = null;
function materials() {
  if (MATS) return MATS;
  const C = RACEWAY_LOOK.colour;
  const glaze = new THREE.MeshStandardMaterial({ name: 'raceway-glyph', vertexColors: true, roughness: 0.3, metalness: 0.1, emissive: C.emissive, emissiveIntensity: 0.2 });
  const marks = new THREE.MeshStandardMaterial({ name: 'raceway-marks', roughness: 0.3, metalness: 0.1, emissive: C.emissive, emissiveIntensity: 0.12 });
  const map = glowAtlas();
  const glow = new THREE.MeshBasicMaterial({ name: 'raceway-glow', map, color: C.glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  glow.userData.shared = glaze.userData.shared = marks.userData.shared = true; // (one for the game: a room taken down never disposes it)
  MATS = { glaze, marks, glow, map };
  return MATS;
}
/** Copies of a geometry, each put where a matrix says, merged into one. */
function mergedAt(geo, matrices) { return mergeGeometries(matrices.map((m) => geo.clone().applyMatrix4(m))); }

// ------------------------------------------------------------------ the looks
export class RacewayLooks {
  constructor(game, o = {}) {
    this.game = game;
    this.parent = o.parent || null; // (where the meshes go: the scene, or a Workbench stage)
    this.vfxOf = () => o.vfx || game.vfx;
    this.raceOf = o.race || (() => game.race);
    this.boardOf = o.board || (() => { const S = game.player?.techs?.get?.('skiff'); return S?.active && S.skiff?.group ? { group: S.skiff.group, heading: S.heading, carve: S.carve, vel: S.v, boosting: S.boosting, combo: S.combo, grind: S.grind, boat: S.skiff, manual: S.phase === 'ride' && !!S.rules?.manualOn, manualLean: S.manualLean || 0 } : null; });
    this.skiffModelOf = o.skiffModel || (() => game.player?.techs?.get?.('skiff')?.skiff?.model || null);
    this.playerOf = o.player || (() => game.player?.pos);
    this.t = 0; this.plates = null; this.marks = null; this.ghost = null;
    this.lit = 0; this.flareT = 0; this.goneT = 9; this.lamps = [0, 0, 0]; this.gateK = {}; this.gateFlash = {}; this.startK = [];
    this.carveH = null; this.sailH = null; this.tier = 0;
    const E = o.events || game.events;
    if (E) {
      E.on('skiff.plate', (e) => this.plateUnder(e));
      E.on('skiff.carve.charge', (e) => this.charge(e.tier));
      E.on('skiff.carve', (e) => this.release(e.tier));
      for (const n of ['skiff.bail', 'skiff.end', 'skiff.recall']) E.on(n, () => this.stopCarve());
      E.on('race.start', () => { this.lit = 0; this.flareT = 0; this.goneT = 9; });
      E.on('race.count', (e) => { this.lit = Math.max(this.lit, Math.min(3, 4 - (e.n | 0))); }); // (3, 2, 1: one lamp, two, three)
      E.on('race.go', () => { this.lit = 3; this.flareT = 1; this.goneT = 0; this.flareLamps(); });
      for (const n of ['race.end', 'race.finish']) E.on(n, () => { this.lit = 0; this.flareT = 0; this.goneT = 9; });
      E.on('race.gate', (e) => { const i = (e.gate | 0) - 1, id = this.raceTrack(); if (i >= 0 && this.gateFlash[id]) { this.gateFlash[id][i] = 1; this.passGate(i, id); } });
      E.on('skiff.grind', () => this.grind());
      E.on('skiff.grind.end', (e) => this.grindEnd(e));
      for (const n of ['skiff.bail', 'skiff.end', 'skiff.recall']) E.on(n, () => this.stopGrind());
      E.on('skiff.ring', (e) => this.ringPass(e.ring));
      E.on('skiff.pop', (e) => this.pop(e));
      E.on('skiff.pop.miss', () => this.pop({ miss: true }));
      E.on('skiff.combo', (e) => this.comboLink(e));
      E.on('skiff.combo.bank', () => this.comboBank());
      E.on('skiff.combo.drop', () => this.comboDrop());
      E.on('skiff.flare.banked', (e) => this.flareSpent(e)); // (C: a banked flare spent whole, its sun popped: the owner, v204)
      for (const n of ['skiff.bail', 'skiff.end', 'skiff.recall']) E.on(n, () => this.stopBoost());
    }
    this.boostH = null; this.combo = null; this.sunK = 1;
    this.nightOf = o.night || (() => Math.min(1, Math.max(0, (0.45 - lightAt()) / 0.37))); // (0 by day, 1 at night: the strings cool)
    this.strings = null; this.grindH = []; this.nightK = 0; this.nightT = 9;
    // round 6: the board's stakes and the buoys (their own modules; the Workbench, which passes its own board, gets no stakes)
    this.stakes = o.board ? null : new SkiffBoardLooks(game, { events: E, vfx: this.vfxOf });
    this.buoys = new RacewayBuoys(game, { parent: this.parent, vfx: this.vfxOf });
    E?.on('skiff.buoy', (e) => { if (e.by === 'courier') this.buoys.pass(e); });
  }

  // ---------------------------------------------------------------- the sun plates, the arch's lamps, the gates' marks
  /** Built over a Raceway's placeholders (raceway.js build, after buildMarks): her plate slabs hidden, the glyphs and lamps placed. */
  dress(R) { for (const _ of this.dressSteps(R)); return this; }
  /** dress() as steps (the seam's staged arrival, Petra's and Dovina's 2026-10-26: one step a frame under the cover), yielding the part
   *  just laid: 'plates', 'marks', 'strings', 'rails', 'buoys'. `yield*` it from the Raceway's own build. While it runs (`dressing`)
   *  update() stands back past the board's own looks: the frames tick under the seam's cover between steps, and a half-laid dressing
   *  (the plates without their marks) is never read; nor is it dressed again whole by the release's path. */
  *dressSteps(R) {
    this.dressing = true; this.released = false;
    try { yield* this.laySteps(R); } finally { this.dressing = false; }
  }
  *laySteps(R) {
    this.undress();
    const parent = this.parent || this.game.scene, L = RACEWAY_LOOK, T = R.T;
    // the plates: where her slabs lie, tilted to the sand under them, the glyph's +Z along the track
    this.plateAt = R.plates.map((p) => {
      if (p.vein) return null; // (the cavern's crystal veins: Lachryma's, not the sun's; their look is the cavern's own)
      const m = p.mesh, pos = m.position.clone(); pos.y = R.heightAt(pos.x, pos.z) + L.plate.lift;
      const n = R.normalAt(pos.x, pos.z, new THREE.Vector3()), q = new THREE.Quaternion().setFromUnitVectors(UP, n).multiply(_q.setFromAxisAngle(UP, m.rotation.y));
      m.visible = false; m.userData.dressed = true;
      return { pos, q, n, fwd: new THREE.Vector3(0, 0, 1).applyQuaternion(q) };
    });
    const P = this.plateAt.filter(Boolean);
    const M0 = materials(), glyphGeo = sunGlyph(true), glowGeo = plateGlowGeometry();
    const at = (p, flat, lift) => new THREE.Matrix4().compose(_v.set(0, lift, 0).applyQuaternion(p.q).add(p.pos), p.q, _s.set(L.plate.r, L.plate.r * flat, L.plate.r));
    const B = (this.plates = {
      glyph: new THREE.Mesh(P.length ? mergedAt(glyphGeo, P.map((p) => at(p, L.plate.flat, 0))) : new THREE.BufferGeometry(), M0.glaze),
      glow: new THREE.Mesh(P.length ? mergedAt(glowGeo, P.map((p) => at(p, 1, 0.13))) : new THREE.BufferGeometry(), M0.glow),
    });
    glyphGeo.dispose(); glowGeo.dispose();
    B.glyph.name = 'raceway-plates'; B.glow.name = 'raceway-plates-glow'; B.glyph.receiveShadow = true; B.glow.renderOrder = 3;
    for (const m of [B.glyph, B.glow]) { m.userData.zone = 'raceway'; m.frustumCulled = false; parent.add(m); }
    yield 'plates';
    // the start arch's lamps and the gates' marks, as raceway.js builds the arch and the pillars (her numbers: the arch 3 m outside the
    // track's edge and 11 m over the higher foot, the lintel 1.4 m deep and 2 m thick over it; a gate's pillar 2.5 m outside, 8 m tall
    // from 1.5 m under its foot, 1.5 m square)
    // Round 4 (the park): every track's arch and gates dressed alike (kit.js lays them all by the same numbers), each mark keeping its
    // track; and a sun glyph on each track's start pillar (R.pillars), facing its line, breathing while the Courier is near and no race runs
    const marks = [];
    for (const Tk of R.tracks || [T]) {
      const tid = Tk.id ?? 'sun', side = (s, lat) => { const F = Tk.frame(s); return R.local(F.x - F.fz * lat, F.z + F.fx * lat); };
      const facing = (s) => { const F = Tk.frame(s); return new THREE.Vector3(-F.fx, 0, -F.fz).normalize(); }; // (toward the oncoming board)
      { const s = Tk.line, F = Tk.frame(s), a = side(s, -(F.w + 3)), b = side(s, F.w + 3), top = Math.max(a.y, b.y) + 11, n = facing(s);
        const right = new THREE.Vector3(-F.fz, 0, F.fx).normalize(), mid = a.clone().add(b).multiplyScalar(0.5).setY(top - 0.1 - L.lamp.drop);
        for (let k = -1; k <= 1; k++) marks.push({ kind: 'lamp', track: tid, k: k + 1, pos: mid.clone().addScaledVector(right, k * L.lamp.spacing).addScaledVector(n, 1.0), n, r: L.lamp.r, glow: L.lamp.glow }); }
      Tk.gates.forEach((s, gi) => { const F = Tk.frame(s), n = facing(s);
        for (const sg of [-1, 1]) { const p = side(s, sg * (F.w + 2.5)); marks.push({ kind: 'gate', track: tid, gate: gi, pos: p.clone().setY(p.y + L.gateMark.up).addScaledVector(n, 0.75 + 0.02), n, r: L.gateMark.r, glow: L.gateMark.glow }); } });
      const Pl = (R.pillars || []).find((p) => p.track === Tk.id);
      if (Pl) { const F = Tk.frame(Tk.line), n = new THREE.Vector3(-F.fz, 0, F.fx).normalize(); // (from the pillar toward its line: kit.js sets it left of the line)
        marks.push({ kind: 'start', track: tid, pos: Pl.pos.clone().setY(Pl.pos.y + L.startMark.up).addScaledVector(n, L.startMark.out), n, r: L.startMark.r, glow: L.gateMark.glow, at: Pl.pos }); }
    }
    const K = (this.marks = new THREE.InstancedMesh(sunGlyph(false), M0.marks, Math.max(1, marks.length)));
    marks.forEach((k, i) => { k.q = new THREE.Quaternion().setFromUnitVectors(UP, k.n); K.setMatrixAt(i, _m.compose(k.pos, k.q, _s.set(k.r, k.r, k.r))); K.setColorAt(i, _c.set(L.colour.rim).multiplyScalar(0.3)); k.glowAt = k.pos.clone().addScaledVector(k.n, 0.25); });
    K.count = marks.length; K.name = 'raceway-marks'; K.userData.zone = 'raceway'; K.frustumCulled = false; parent.add(K);
    this.markList = marks; this.markH = marks.map(() => null); this.startK = marks.map(() => 0);
    this.gateK = {}; this.gateFlash = {};
    for (const Tk of R.tracks || [T]) { this.gateK[Tk.id ?? 'sun'] = Tk.gates.map(() => 0); this.gateFlash[Tk.id ?? 'sun'] = Tk.gates.map(() => 0); }
    this.R = R;
    yield 'marks';
    yield* this.round2Steps(R);
  }

  // ---------------------------------------------------------------- round 2: the edge strings, the rails' glaze, the rings
  /** What the Raceway has of them: the edge strings strung on edgeLines, the rail mesh re-cut as glazed stone, the rings kept for passes. */
  dressRound2(R) { for (const _ of this.round2Steps(R)); return this; }
  *round2Steps(R) {
    this.R = R;
    if (R.edgeLines) { // (every track's two edges in the one set of draws, each its track's group; on a bridge's deck, hung over the deck)
      this.strings?.dispose();
      const step = EDGE_STRINGS.step, lines = [];
      for (const Tk of R.tracks || [R.T]) {
        const got = R.tracks ? R.edgeLines(step, 'main', Tk.id) : R.edgeLines(step);
        for (const L of got) {
          if (Tk.decks?.length && R.center) L.pts.forEach((p, i) => { const s = i * step; if (Tk.decks.some((D) => s >= D.s0 && s <= D.s1)) p.y = R.center.y + Tk.frame(s).y + 1; });
          lines.push({ ...L, group: Tk.id ?? 'sun' });
        }
      }
      this.strings = new RacewayEdgeStrings({ parent: this.parent || this.game.scene, zone: 'raceway' }).build(lines, step);
      yield 'strings';
    }
    if (R.railMesh && R.rails?.length && !R.railMesh.userData.glazed) { this.glazeRails(R); yield 'rails'; }
    if (R.buoys?.group && !R.buoys.group.userData.dressed) { this.buoys.dress(R); yield 'buoys'; } // (round 6: the buoys as the Raceway's kit)
  }
  /** The rails' lintels and columns as glazed stone: a new geometry for her mesh (and its outline), the same material made glossier.
   *  Written straight into one set of arrays from six painted templates (a phone's memory, Petra's measure 2026-10-26: a box, a matrix
   *  and a clone a segment held 102 MB of heap through the park's arrival on an iPhone XR); the hull's smooth normals only where a hull
   *  is drawn (NEW:memory-bound-by-view). */
  glazeRails(R) {
    const mesh = R.railMesh, C = railPieces(), K = RACEWAY_LOOK.rail;
    let nv = 0; const posts = [];
    for (const rail of R.rails) {
      const { pts, cum } = rail, n = pts.length - 1;
      nv += n * C.lintel;
      for (let d = 0; d <= cum[n]; d += K.post) {
        let i = 0; while (i < n - 1 && cum[i + 1] < d) i++;
        const p = pts[i].clone().lerp(pts[i + 1], (d - cum[i]) / Math.max(1e-6, cum[i + 1] - cum[i])), foot = R.heightAt(p.x, p.z) - 0.4, h = p.y - 0.15 - foot;
        if (h > 0.2) { posts.push(p.x, p.y, p.z, foot, h); nv += C.post; }
      }
    }
    if (!nv) return;
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), e = _rm.elements;
    let o = 0;
    const put = (T, sx, sy, sz, tx, ty, tz, rot) => { // (a template scaled, turned by _rm's basis where `rot`, and moved)
      const P = T.pos, N = T.nor, c = T.col;
      for (let i = 0; i < P.length; i += 3, o += 3) {
        const x = P[i] * sx, y = P[i + 1] * sy, z = P[i + 2] * sz, nx = N[i], ny = N[i + 1], nz = N[i + 2];
        if (rot) {
          pos[o] = e[0] * x + e[4] * y + e[8] * z + tx; pos[o + 1] = e[1] * x + e[5] * y + e[9] * z + ty; pos[o + 2] = e[2] * x + e[6] * y + e[10] * z + tz;
          nor[o] = e[0] * nx + e[4] * ny + e[8] * nz; nor[o + 1] = e[1] * nx + e[5] * ny + e[9] * nz; nor[o + 2] = e[2] * nx + e[6] * ny + e[10] * nz;
        } else { pos[o] = x + tx; pos[o + 1] = y + ty; pos[o + 2] = z + tz; nor[o] = nx; nor[o + 1] = ny; nor[o + 2] = nz; }
        col[o] = c[0]; col[o + 1] = c[1]; col[o + 2] = c[2];
      }
    };
    for (const rail of R.rails) {
      const { pts } = rail, n = pts.length - 1;
      for (let i = 0; i < n; i++) {
        const p = pts[i], q = pts[i + 1], len = p.distanceTo(q) + 0.05;
        _rm.lookAt(p, q, UP); const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2, mz = (p.z + q.z) / 2;
        for (const T of C.strips) put(T, 1, 1, len, mx, my, mz, true); // (the body, the drip line under, the glaze thinning to the edge, worn where the keel runs)
      }
    }
    for (let k = 0; k < posts.length; k += 5) {
      const x = posts[k], y = posts[k + 1], z = posts[k + 2], foot = posts[k + 3], h = posts[k + 4];
      put(C.column, 1, h, 1, x, foot + h / 2, z, false); put(C.capital, 1, 1, 1, x, y - 0.23, z, false);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeBoundingSphere();
    const old = mesh.geometry;
    mesh.geometry = geo; if (mesh.userData.outline) { ensureSmoothNormals(geo); mesh.userData.outline.geometry = geo; }
    old.dispose();
    mesh.material.roughness = K.roughness; mesh.userData.glazed = true;
  }

  // ---------------------------------------------------------------- the grind
  /** The board's contact with the rail (`h.pos`) and the way back along it (`h.dir`), for a held effect; under the board for the hum. */
  contact(h, B, kind) {
    const a = B.heading, f = _v.set(Math.sin(a), 0, Math.cos(a));
    h.pos.copy(B.group.position); h.pos.y -= kind === 'hum' ? 0.15 : RACEWAY_LOOK.grind.contact;
    if (kind === 'sparks') h.pos.addScaledVector(f, -0.5);
    h.dir.copy(f).negate().addScaledVector(UP, kind === 'sparks' ? 0.35 : 0).normalize();
    if (B.vel) h.ctx.vel = B.vel;
  }
  grind() {
    const V = this.vfxOf(), B = this.boardOf(); if (!V || !B) return;
    this.stopGrind(); this.grinding = true;
    const h0 = { pos: new THREE.Vector3(), dir: new THREE.Vector3(), ctx: {} }; this.contact(h0, B, 'on');
    V.play('raceway.grind.on', { pos: h0.pos, dir: _s.copy(h0.dir).addScaledVector(UP, 0.6).normalize() });
    for (const kind of ['sparks', 'streak', 'hum']) {
      const follow = (h) => { const b = this.boardOf(); if (!this.grinding || !b) return false; this.contact(h, b, kind); return true; };
      const h = V.play(`raceway.grind.${kind}`, { follow }); follow(h); this.grindH.push(h);
    }
  }
  grindEnd(e) {
    const V = this.vfxOf(), B = this.boardOf(), was = this.grinding;
    this.stopGrind(); if (!V || !B || !was) return;
    const h = { pos: new THREE.Vector3(), dir: new THREE.Vector3(), ctx: {} }; this.contact(h, B, 'off');
    V.play('raceway.grind.off', { pos: h.pos, dir: h.dir, power: e?.why === 'hop' ? 1.6 : 1 });
  }
  stopGrind() { for (const h of this.grindH || []) h?.stop(); this.grindH = []; this.grinding = false; }

  // ---------------------------------------------------------------- the sun rings
  /** Ring i flown through: a flash at its heart, motes drawn in round the rim and out through it, the ring pulsing once. */
  ringPass(i) {
    const Rg = this.R?.rings?.[i], V = this.vfxOf(); if (!Rg) return;
    Rg.look?.pulse?.();
    if (!V) return;
    const c = (Rg.pos || Rg.look.group.position).clone(), dir = new THREE.Vector3().copy(Rg.dir || _s.set(0, 0, 1).applyQuaternion(Rg.look.group.quaternion)).normalize();
    const r = Rg.look?.mesh?.geometry?.parameters?.radius || 3.2, right = new THREE.Vector3().crossVectors(dir, UP), up = new THREE.Vector3();
    if (right.lengthSq() < 1e-4) right.set(1, 0, 0);
    right.normalize(); up.crossVectors(right, dir).normalize();
    V.play('raceway.ring.pass', { pos: c, dir });
    const out = c.clone().addScaledVector(dir, 2.5);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2, rim = c.clone().addScaledVector(dir, -2.4).addScaledVector(right, Math.cos(a) * r * 1.4).addScaledVector(up, Math.sin(a) * r * 1.4);
      V.play('raceway.ring.draw', { pos: rim, dir: out.clone().sub(rim).normalize() });
    }
  }
  /** Told when the park's ground is given back (raceway.onRelease): the dressing goes with it, dressed again on its next active frame. */
  hookRelease(R) { if (R?.onRelease && this.hooked !== R) { this.hooked = R; R.onRelease(() => this.releaseDress()); } }
  releaseDress() {
    this.undress(); this.buoys.dispose(); if (this.R?.buoys?.group) this.R.buoys.group.userData.dressed = false;
    this.markList = []; this.plateAt = []; this.released = true;
  }
  undress() {
    this.strings?.dispose(); this.strings = null; this.stopGrind(); this.stopBoost();
    for (const m of [this.plates?.glyph, this.plates?.glow, this.marks]) if (m) { m.parent?.remove(m); m.geometry.dispose(); m.dispose?.(); }
    for (const h of this.markH || []) h?.stop();
    this.plates = this.marks = null; this.markH = [];
  }

  /** Sun plate i ridden over: a flash on it, and a ring of light runs out over the sand. */
  plateHit(i, power = 1) {
    const p = this.plateAt?.[i]; if (!p) return;
    const S = RACEWAY_LOOK.sun, pw = Math.max(0, Math.min(1, power ?? 1));
    if (pw <= 0.05) { this.vfxOf()?.play('raceway.plate.dark', { pos: p.pos, normal: p.n }); return; } // (a dark plate: cold, dull, no push)
    this.vfxOf()?.play('raceway.plate', { pos: p.pos, normal: p.n, dir: p.fwd, power: 0.35 + 0.65 * pw, phase: this.t * 0.3, tint: _c.set(S.cold).lerp(_c2.set(S.warm), pw).getHex() });
  }
  /** skiff.plate: the plate the Courier is on (the payload's `plate` if it says, else the nearest within its length). */
  plateUnder(e) {
    if (!this.plateAt) return;
    if (Number.isInteger(e?.plate)) { this.plateHit(e.plate, e.power); return; }
    const at = this.playerOf(); if (!at) return;
    let best = -1, bd = 36; // (within 6 m of a plate's middle: a plate is 7 m long)
    this.plateAt.forEach((p, i) => { if (!p) return; const d = (p.pos.x - at.x) ** 2 + (p.pos.z - at.z) ** 2; if (d < bd) { bd = d; best = i; } });
    if (best >= 0) this.plateHit(best, e?.power);
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
    const pop = V.play('skiff.carve.tier', { tint, pos: this.carveH.pos, dir: this.carveH.dir, power: Math.min(3, Math.max(1, tier)) }); pop.ctx.vel = B.vel;
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
    V.play('skiff.carve.release', { pos: h.pos, dir: h.dir, tint, power: t, phase: this.t * 0.3 });
    let left = RACEWAY_LOOK.wake[t - 1]; // (the wake: held at the stern a moment, as the board runs out of the carve; longer by tier)
    const wake = (w, raw) => { const b = this.boardOf(); if (!b || (left -= raw) < 0) return false; this.edge(w, b, true); return true; };
    const w = V.play('skiff.carve.wake', { pos: h.pos, dir: h.dir, follow: wake, power: 0.7 + 0.3 * t, phase: this.t * 0.3 }); w.ctx.vel = B.vel;
  }
  stopCarve() { this.carveH?.stop(); this.sailH?.stop(); this.carveH = this.sailH = null; this.tier = 0; }

  // ---------------------------------------------------------------- round 3: the boost, the pop, the combo
  /** Every boost (skiff.boosting): Lachryma thrown back off the stern while it pushes, its strength the push (the boat's glow: boat.js). */
  boost(B) {
    const V = this.vfxOf(), k = B?.boosting || 0, C = RACEWAY_LOOK.boost;
    if (!V || k < C.from) { if (this.boostH && k < C.from * 0.5) this.stopBoost(); return; }
    if (this.boostH?.alive) return;
    const follow = (h) => { const b = this.boardOf(); if (!b || (b.boosting || 0) < C.from * 0.5) return false;
      h.pos.set(0, C.up, -C.stern); b.group.localToWorld(h.pos); h.dir.set(0, 0.08, -1).applyQuaternion(b.group.getWorldQuaternion(_q2)).normalize();
      h.k = Math.min(1, b.boosting); h.ctx.phase = this.t * 0.3; if (b.vel) h.ctx.vel = b.vel; return true; };
    this.boostH = V.play('skiff.boost', { follow, phase: 0 }); follow(this.boostH);
  }
  stopBoost() { this.boostH?.stop(); this.boostH = null; }
  /** A late pop (skiff.pop): nailed, the sun's glyph struck in Lachryma on the board and the boat flashing; plain, a small ring; let go
   *  too late (skiff.pop.miss), a dud puff. */
  pop(e) {
    const V = this.vfxOf(), B = this.boardOf(); if (!V || !B) return;
    const at = B.group.getWorldPosition(new THREE.Vector3());
    if (e?.miss) { V.play('skiff.pop.miss', { pos: at.setY(at.y - 0.3) }); return; }
    if (e?.perfect) { V.play('skiff.pop.perfect', { pos: at, phase: this.t * 0.3 }); B.boat?.pulse?.(1); }
    else V.play('skiff.pop.late', { pos: at });
  }
  /** The combo's gauge on the board, made the first time a board is seen (vfx/skiffcombomarks.js). */
  comboMarks(B) { if (!this.combo) this.combo = new SkiffComboMarks({ map: materials().map }); if (B) this.combo.attach(B.group); return this.combo; }
  comboLink(e) {
    const B = this.boardOf(), V = this.vfxOf(); if (!B) return;
    const M = this.comboMarks(B), before = M.steps; M.link(e?.mult);
    const at = B.group.getWorldPosition(new THREE.Vector3());
    V?.play('skiff.combo.link', { pos: at.clone().setY(at.y - 0.3), phase: this.t * 0.3 });
    if (M.steps > before) { const P = COMBO_MARKS.pips; V?.play('skiff.combo.step', { pos: new THREE.Vector3(0, COMBO_MARKS.y, -(P.r + P.gap * (M.steps - 1))).applyMatrix4(B.group.matrixWorld), phase: this.t * 0.3 }); } // (at the chevron just lit)
  }
  comboBank() {
    const B = this.boardOf(), V = this.vfxOf(); if (!B) return;
    this.comboMarks(B).bank(); B.boat?.pulse?.(0.7);
    V?.play('skiff.combo.bank', { pos: B.group.getWorldPosition(new THREE.Vector3()), phase: this.t * 0.3 });
  }
  /** A banked flare spent whole (skiff.flare.banked { left }): its sun pops and goes out, the rest stay. */
  flareSpent(e) {
    const B = this.boardOf(), V = this.vfxOf(); if (!B) return;
    const M = this.comboMarks(B), i = M.spend(B.combo?.stocks ?? e?.left ?? 0), at = sunAt(i);
    B.group.updateWorldMatrix(true, false);
    V?.play('skiff.flare.spend', { pos: new THREE.Vector3(at[0], at[1], at[2]).applyMatrix4(B.group.matrixWorld), phase: this.t * 0.3 });
  }
  comboDrop() {
    const B = this.boardOf(), V = this.vfxOf(); if (!B) return;
    this.comboMarks(B).drop();
    const at = B.group.getWorldPosition(new THREE.Vector3()); V?.play('skiff.combo.drop', { pos: at.setY(at.y - 0.3) });
  }

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
    body.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = o.receiveShadow = false; if (o.geometry?.userData?.stockCloth) o.geometry = o.geometry.userData.stockCloth; } }); // (the stock cut: the ghost's yard is not moved, vfx/skiffsailcut.js)
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
    { const Rw = this.game.raceway; this.hookRelease(Rw); if (this.released && !this.dressing && Rw?.built && Rw.active) { this.released = false; this.dress(Rw); } }
    { const B = this.boardOf(); // (round 3: the boost's look and the combo's gauge, wherever the skiff is ridden)
      this.boost(B);
      const power = B && this.game.raceway?.active ? this.game.raceway.buoys?.power || 0 : 0; // (the buoys' power: round 6)
      if (B?.combo && (this.combo || B.combo.n || B.combo.stocks > 0.01 || power > 0)) this.comboMarks(B);
      this.combo?.update(dt, B?.combo || null, this.t, power);
      const bal = B?.grind?.on ? B.grind : B?.manual ? { on: true, lean: B.manualLean } : null; // (the manual's lean on the grind's mark: round 6)
      if (bal && !this.balance) this.balance = new GrindBalanceMark({ map: materials().map }); // (the grind's balance mark: made the first time a board grinds)
      if (this.balance) { if (B) this.balance.attach(B.group); this.balance.update(dt, bal, { t: this.t, camera: this.game.camera }); } }
    this.stakes?.update(dt);
    if (this.ghost) { this.tryGhost(); if (this.ghost.holo && this.ghost.group.visible) this.ghost.holo.update(dt); }
    if (this.dressing) return; // (half laid: dressSteps is still running under the cover)
    if (this.strings) { // (the board's place on the line, and the hour's cool, asked once a real second)
      if ((this.nightT += dt) > 1) { this.nightT = 0; this.nightK = this.nightOf(); }
      const R = this.R, near = this.boardOf() && R && R.s != null;
      this.strings.update(dt, { s: near ? R.s : null, d: R?.d ?? 0, night: this.nightK, group: R?.track?.id ?? 'sun' });
    }
    if (!this.plates) return;
    const L = RACEWAY_LOOK, M = materials(), t = this.t, gl = _c;
    // the plates: a slow shimmer through the glaze and the glow (all together), the chevrons running the track's way
    // and all of it by the sun (raceway.sun: 0 at night), followed gently so a cloud never blinks them
    const S = L.sun, sun = Math.max(0, Math.min(1, this.R?.sun ?? 1)); this.sunK = damp(this.sunK, sun, S.follow, dt);
    const sk = this.sunK, sh = 0.5 + 0.5 * Math.sin(t * L.shimmer.rate);
    M.glaze.emissiveIntensity = (0.16 + 0.1 * sh) * (S.glazeNight + (1 - S.glazeNight) * sk);
    M.glow.color.copy(GLOW).multiplyScalar((L.shimmer.lo + (L.shimmer.hi - L.shimmer.lo) * sh) * (S.glowNight + (1 - S.glowNight) * sk));
    this.scrollV = ((this.scrollV || 0) + dt * L.plate.scroll * (S.scrollNight + (1 - S.scrollNight) * sk)) % 1;
    M.map.offset.y = -this.scrollV;
    // the arch's lamps: one a count, all flaring on GO and fading after; glowing again while the line is next
    const race = this.raceOf(), running = !!race?.running, rt = this.raceTrack(), gk = this.gateK[rt] || [];
    const lineNext = running && race.state === 'run' && race.next >= (gk.length || 8);
    this.flareT = Math.max(0, this.flareT - dt / 0.9); if (this.goneT < 9) this.goneT += dt;
    for (let k = 0; k < 3; k++) {
      let want = (running && k < this.lit) ? 1 : 0;
      if (this.goneT < 9) want = this.goneT < 1.4 ? 1 + 1.2 * this.flareT : 0; // (after GO: the flare, held a beat, then out)
      if (lineNext) want = Math.max(want, 0.55 + 0.15 * Math.sin(t * 2.2));
      this.lamps[k] = damp(this.lamps[k], want, want > this.lamps[k] ? 22 : 4, dt);
    }
    // the gates: the next pair glows (a slow breath, never a blink); a gate passed flashes as it goes
    for (const id of Object.keys(this.gateK)) {
      const K0 = this.gateK[id], Fl = this.gateFlash[id];
      for (let g = 0; g < K0.length; g++) {
        const want = running && id === rt && race.state === 'run' && race.next === g ? 1 : 0;
        K0[g] = damp(K0[g], want, want ? 10 : 3, dt); Fl[g] = Math.max(0, (Fl[g] || 0) - dt / 0.5);
      }
    }
    // the start pillars: a slow breath while the Courier is near one and no race runs (F there races its track)
    const at = this.playerOf(), SM = L.startMark;
    // the marks: the glyph's own brightness (instanced), and a glow of the shared particles held on each lit one
    const K = this.marks, V = this.vfxOf();
    this.markList.forEach((k, i) => {
      let v;
      if (k.kind === 'lamp') v = k.track === rt ? Math.min(1.6, this.lamps[k.k]) : 0;
      else if (k.kind === 'gate') v = this.gateK[k.track][k.gate] * (0.85 + 0.15 * Math.sin(t * 1.9)) + (this.gateFlash[k.track][k.gate] || 0);
      else { const near = !running && at && (at.x - k.at.x) ** 2 + (at.z - k.at.z) ** 2 < SM.near * SM.near ? 0.7 + 0.2 * Math.sin(t * 1.6) : 0;
        v = this.startK[i] = damp(this.startK[i] || 0, near, near ? 6 : 3, dt); }
      K.setColorAt(i, gl.set(L.colour.rim).multiplyScalar(0.3 + 1.3 * v));
      const on = v > 0.25, H = this.markH[i];
      if (on && !H?.alive && V) this.markH[i] = V.play(k.kind === 'lamp' ? 'raceway.lamp' : 'raceway.gate', { pos: k.glowAt });
      else if (!on && H) { H.stop(); this.markH[i] = null; }
      if (this.markH[i]) this.markH[i].k = Math.min(1.5, v);
    });
    K.instanceColor.needsUpdate = true;
  }
  /** GO: every lamp flares at once (a burst of the shared particles at each). */
  flareLamps() { const V = this.vfxOf(), id = this.raceTrack(); for (const k of this.markList || []) if (k.kind === 'lamp' && k.track === id) V?.play('raceway.lamp.go', { pos: k.glowAt }); }
  /** A gate passed: its two marks flash as it goes. */
  passGate(g, id = this.raceTrack()) { const V = this.vfxOf(); for (const k of this.markList || []) if (k.kind === 'gate' && k.track === id && k.gate === g) V?.play('raceway.gate.pass', { pos: k.glowAt }); }
  /** The track the race runs on (its lamps and gates are the lit ones), else the Sun Circuit. */
  raceTrack() { return this.raceOf()?.T?.id || 'sun'; }
}
