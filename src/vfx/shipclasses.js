// ---------------------------------------------------------------------------------------
// THE SHIP CLASSES: the frigate, the destroyer, the galleon and the tanker as the Vessoul's ships (docs/GLOSSARY.md: the Vessoul, ship;
// progress/rail/ships.js: each hull's size, role and verbs), with the sloop (vfx/sloop.js) the five. One look named for all five, SEA-GOING
// STARSHIPS OF THE AGE OF SAIL (Calissa's; the owner, 2026-10-20: "match the forms and silhouettes of their IRL counterparts more
// closely ... lean into the sci-fi ship designs of Outlaw Star, Tenchi Muyo's jurai ships, Skies of Arcadia, and Rogue Galaxy"). The
// pots are gone; the hulls are ships. RAIL-SHIPS-SCIFI.md 1 (the real silhouettes) and 3 (the fusion brief), followed, a class each:
//   frigate    ESCORT. A sail-age frigate: three masts, the middle tallest, yards crossing each, a jib on a bowsprit raised 20 degrees, a
//              spanker on a boom over the stern; a long low hull (4:1) with a modest sheer and tumblehome, a deep-teal gun-deck band
//              with its row of lit ports, cream above, gold trim; Skies of Arcadia's Delphinus fins aft, one pod under the stern
//              gallery. Green-gold glow (Jurai's wood). Its masts strike in a ripple, aft to fore, the yards turning fore and aft first.
//   destroyer  HUNTS EGREGORES. An Arleigh Burke's blade: a long thin dart widest 60% aft (about 5:1 with its sponsons), a high flared
//              forecastle sweeping to a raked stem, a gun turret low forward, a block of VLS cells, one slab-sided superstructure with
//              angled planes and a pair of stacks, a flat-blade mast that hinges flat back onto its roof (a tabernacle), two big square
//              engine pods aft. Grey-blue, a navy deck, a red-orange accent, blue-white glow.
//   galleon    TREASURE (refined cubes). The Dorgenark (Rogue Galaxy's space galleon) on a real galleon's lines: a tall stepped stern
//              castle, a lower forecastle, a long beak, a strong sheer and tumblehome (3.7:1), square vanes fore and main, a lateen on the
//              mizzen, a keel blade, the engine ring on the castle's back with a gold star; its topgallants strike for a roll, the
//              lower masts stay. Deep brown-red, gold, white vanes, violet-gold glow. Two helms side by side under one canopy (co-op).
//   tanker     CRUDE, double-hulled. A tanker's slab: a long flat deck (6:1), all the height in the house aft (stepped decks, bridge
//              wings, a raked funnel), a row of glowing tank domes, a pipe manifold midships, a catwalk, a glowing bulb under a blunt
//              bow; the double hull a second rail inboard. Oxide red, a dark grey deck, yellow warning stripes, amber glow. Its short mast
//              drops into the deck on a roll.
// Built on the ship kit (shipkit/: one hull mesh and one rig mesh in one material a ship, the vanes in the sail's program, the core and
// cradle), so a class is a table and its static parts; sizes from ships.js's hurtbox (the sloop's 7 m times it), the frame +Z the bow,
// Y up, the origin at the waterline amidships.
// Prior art: the real classes (USS Constitution's and the Endymion class's proportions, the Arleigh Burke class, the late galleon, a
// VLCC with its house aft and bulbous bow), and the four references as each line above says.
//
//   shipLook(id, { env }) -> a Sloop or a ShipClassLook (the same API: group, body, set, fold, feeling, hurt, hoist, scars, keelMat,
//   mouth, gunAt, length, beam, helmCradles, helmCradle, helmCradleSpots, helmWake, dispose; shipkit/shiplook.js)
//   SHIP_FORMS[id] (each class's numbers: length, beam, draft, helm, dives, hull, rig)   new ShipClassLook(id, { env })
// ---------------------------------------------------------------------------------------
import { Sloop, SLOOP } from './sloop.js';
import { ShipLook } from './shipkit/shiplook.js';
import { deckAt, deckHalf } from './shipkit/hullkit.js';
import { rail, pod, fin, ports, slot, wing, stripe } from './shipkit/parts.js';
import { writeCore } from './shipkit/core.js';
import { cradleFoot } from './cradlelook.js';
import { SHIPS } from '../progress/rail/ships.js';

const len = (id) => 7 * SHIPS[id].hurtbox; // (the sloop's 7 m times the hull's hurtbox: the rail's sizes never change)

/** A mast of `n` telescoping segments of `seg` metres (each nests in the one below; the lowest sinks to its stub). */
const scope = (n, seg, r0, r1, col) => Array.from({ length: n }, (_, i) => { const k = i / Math.max(1, n - 1), kn = (i + 1) / n; return { len: seg * (1 - 0.02 * i), r0: r0 + (r1 - r0) * k, r1: r0 + (r1 - r0) * kn * 0.98, col }; });
/** Height on a mast at segment i, share `at` along it (the rig's rest bases: shipkit/rig.js restOf, overlap 0.12). */
const at = (segs, i, a) => { let b = 0; for (let k = 0; k < i; k++) b += segs[k].len * 0.88; return b + a * segs[i].len; };

// ------------------------------------------------------------------ the frigate
const F = { cream: 0xeee3c8, teal: 0x1d5a5a, dark: 0x153a3b, gold: 0xd9b04a, deck: 0xcdb995, glow: 0xc8e87a, joint: 0x2a3434, seam: 0xd8f0a0 };
const FRIGATE_HULL = {
  shape: [[0, -1], [0.45, -0.95], [0.9, -0.45], [1, 0.1], [0.97, 0.62], [0.86, 1]],
  stations: [[-3.85, 0.74, 0.35, 0.66], [-3.3, 0.88, 0.48, 0.6], [-2.0, 0.95, 0.55, 0.56], [0, 0.96, 0.55, 0.54], [1.8, 0.9, 0.52, 0.56], [2.9, 0.62, 0.4, 0.62], [3.55, 0.25, 0.25, 0.68, 0.15], [3.85, 0.02, 0.1, 0.72, 0.32]],
  strip: (i) => [[F.dark, 0.1], [F.dark, 0.1], [F.cream, 0.1], [F.teal, 0], [F.cream, 0.1]][i], deck: [F.deck, 0.1], transom: [F.cream, 0.1],
};
const FM = { fore: { z: 2.2, n: 5 }, main: { z: 0.15, n: 6 }, mizzen: { z: -2.05, n: 4 } };
const frigateMasts = () => Object.values(FM).map(({ z, n }, i) => {
  const segs = scope(n, 1.45, 0.11, 0.035, F.cream), yardSegs = n === 6 ? [1, 3, 5] : n === 5 ? [1, 3, 4] : [1, 3];
  const widths = n === 6 ? [2.2, 1.8, 1.3] : n === 5 ? [2.0, 1.6, 1.1] : [1.6, 1.1];
  return { x: 0, z, y0: deckAt(FRIGATE_HULL, z) - 0.04, stub: 0.3, delay: [0.2, 0.1, 0][i], collar: F.joint, cap: F.glow, segs,
    yards: yardSegs.map((s, j) => ({ seg: s, at: 0.55, w: widths[j], r: 0.035, col: F.gold, pivot: true })) };
});
const FRIGATE = {
  id: 'frigate', length: len('frigate'), beam: 1.92, draft: 0.55, panel: 0.8, dives: true, hull: FRIGATE_HULL,
  engineGlow: F.glow, vane: { fill: 0xf4f0dc, edge: 0xe8ffb0, fillA: 0.32 },
  core: { crystal: 0xffffff, collar: F.joint, frame: F.gold, plate: 0.12, apex: 0.95 },
  helm: [[0, deckAt(FRIGATE_HULL, -1.0) - 0.14, -1.0]], gun: [0, deckAt(FRIGATE_HULL, 3.0) + 0.3, 3.0], pennant: { mast: 1 },
  write(M) {
    const H = FRIGATE_HULL; M.loft(H);
    rail(M, H, { z0: -3.7, z1: 3.6, col: F.gold });
    ports(M, H, { zs: [-2.6, -1.7, -0.8, 0.1, 1.0, 1.9, 2.7], y: 0.2, w: 0.2, h: 0.08, col: F.glow, frame: F.joint });
    fin(M, { t: 0.08, pts: [[2.2, -0.5], [-2.6, -0.5], [-2.9, -0.78], [1.8, -0.72]], col: F.dark, edge: 0xffffff, edgeCode: 0.85 });
    wing(M, { y: 0.32, t: 0.05, pts: [[0.9, -1.9], [0.9, -3.1], [1.6, -3.45], [1.55, -2.9]], col: F.cream, edge: F.gold, edgeCode: 0 }); // (the Delphinus fins)
    const engines = [pod(M, { x: 0, y: -0.2, z0: -4.1, z1: -2.9, r0: 0.3, r1: 0.22, body: F.cream, band: F.teal, nozzle: F.glow, pylon: [0, -0.4] })];
    for (const x of [-0.45, -0.15, 0.15, 0.45]) M.quad([x - 0.1, 0.32, -3.86], [x + 0.1, 0.32, -3.86], [x + 0.1, 0.48, -3.86], [x - 0.1, 0.48, -3.86], F.glow, 0.42, [x, 0.4, -3]); // (the stern gallery's windows)
    M.box([0, 0.63, -3.86], [1.3, 0.04, 0.04], F.gold, 0);
    const by = deckAt(H, 3.5) - 0.06; M.cyl([0, by, 3.3], [0, by + Math.sin(0.35) * 1.8, 3.5 + Math.cos(0.35) * 1.8], 0.06, 0.025, 6, F.cream, 0); // (the bowsprit, raised 20 degrees)
    const gy = deckAt(H, 3.0); M.cyl([0, gy - 0.05, 3.0], [0, gy + 0.14, 3.0], 0.2, 0.17, 8, F.joint, 0); M.cyl([0, gy + 0.14, 3.0], [0, gy + 0.18, 3.0], 0.17, 0.1, 8, F.gold, 0);
    for (const { z } of Object.values(FM)) slot(M, { y: deckAt(H, z) - 0.04, z, w: 0.45, d: 0.45 });
    M.box([0, deckAt(H, -3.25) + 0.08, -3.25], [1.1, 0.16, 0.7], F.cream, 0.1, { top: [0.9, 0.85] }); // (the quarterdeck's step)
    return { engines };
  },
};
FRIGATE.rig = { masts: frigateMasts(), booms: [{ mast: 2, h: 0.85, len: 1.9, r: 0.04, col: F.gold }], hatches: [0, 1, 2].map((m) => ({ mast: m, w: 0.45, d: 0.45, col: F.cream, seam: F.seam })) };
{
  const R = FRIGATE.rig, V = [];
  R.masts.forEach((M, mi) => M.yards.forEach((Y, j) => {
    const h = at(M.segs, Y.seg, Y.at), below = j ? at(M.segs, M.yards[j - 1].seg, M.yards[j - 1].at) + 0.06 : 0.45;
    V.push({ kind: 'square', mast: mi, yard: j, drop: h - below, foot: j ? 1.15 : 1.05 });
  }));
  const by = deckAt(FRIGATE_HULL, 3.5) - 0.06, k = 0.9 * 1.8;
  V.push({ kind: 'jib', mast: 0, head: 0.8, tack: [0, by + Math.sin(0.35) * k, 3.5 + Math.cos(0.35) * k], clew: [0, deckAt(FRIGATE_HULL, 2.8) + 0.3, 2.75], clewX: 0.25 });
  V.push({ kind: 'main', mast: 2, boom: 0, head: 0.92 }); // (the spanker)
  R.vanes = V;
}

// ------------------------------------------------------------------ the destroyer
const D = { hull: 0x7d8fa3, light: 0x8d9fb4, dark: 0x2a3242, deck: 0x22304a, accent: 0xe8572a, glow: 0xbfe0ff, joint: 0x1b2230, glass: 0x9fd0ff };
const DESTROYER_HULL = {
  shape: [[0, -1], [0.5, -0.85], [0.95, -0.3], [1, 0.2], [1.04, 0.7], [1.0, 1]],
  stations: [[-3.15, 0.5, 0.22, 0.3], [-2.4, 0.56, 0.3, 0.3], [-0.6, 0.6, 0.34, 0.32], [0.8, 0.56, 0.34, 0.36], [1.9, 0.44, 0.3, 0.46], [2.6, 0.28, 0.24, 0.56, 0.08], [3.15, 0.02, 0.08, 0.64, 0.42]],
  strip: (i) => [[D.dark, 0.1], [D.dark, 0.1], [D.hull, 0.1], [D.hull, 0.1], [D.light, 0.1]][i], deck: [D.deck, 0.1], transom: [D.hull, 0.1],
};
const DB = { z0: -0.5, z1: 0.9, w: 0.92, h: 0.55 }; // (the superstructure block)
const DESTROYER = {
  id: 'destroyer', length: len('destroyer'), beam: 1.2, draft: 0.34, panel: 0.6, dives: true, hull: DESTROYER_HULL,
  engineGlow: D.glow, core: { crystal: 0xffffff, collar: D.joint, frame: D.joint, plate: 0.06, apex: 0.85 },
  helm: [[0, deckAt(DESTROYER_HULL, -1.55) + 0.02, -1.55]], gun: [0, deckAt(DESTROYER_HULL, 1.75) + 0.3, 1.75], pennant: { mast: 0 },
  write(M) {
    const H = DESTROYER_HULL; M.loft(H);
    rail(M, H, { z0: -3.0, z1: 3.0, r: 0.018, col: D.accent, n: 20 });
    stripe(M, H, { z0: 1.5, z1: 2.7, y: 0.36, h: 0.05, col: D.accent, n: 8 }); // (the hunter's red-orange flash on the bow)
    fin(M, { t: 0.06, pts: [[1.6, -0.3], [-2.0, -0.3], [-2.2, -0.46], [1.2, -0.44]], col: D.dark, edge: 0xffffff, edgeCode: 0.85 });
    // the superstructure: one slab block, angled planes, the bridge on it, its windows a lit band, two stacks aft on its roof
    const y0 = deckAt(H, 0.2), zc = (DB.z0 + DB.z1) / 2;
    M.box([0, y0 + DB.h / 2 - 0.02, zc], [DB.w, DB.h, DB.z1 - DB.z0], D.light, 0.1, { top: [0.72, 0.88], shift: [0, -0.06] });
    const top = y0 + DB.h - 0.02;
    M.box([0, top + 0.1, 0.62], [0.56, 0.2, 0.42], D.light, 0.1, { top: [0.8, 0.7], shift: [0, -0.05] });
    M.quad([-0.26, top + 0.1, 0.84], [0.26, top + 0.1, 0.84], [0.22, top + 0.16, 0.8], [-0.22, top + 0.16, 0.8], D.glass, 0.4, [0, top, 0.5]);
    for (const s of [1, -1]) { M.box([s * 0.2, top + 0.17, -0.12], [0.16, 0.34, 0.26], D.hull, 0.1, { top: [0.8, 0.8], shift: [0, -0.1] }); M.box([s * 0.2, top + 0.35, -0.17], [0.14, 0.02, 0.2], D.joint, 0); }
    // the gun forward: a low wedge turret and its barrel
    const gy = deckAt(H, 1.75); M.box([0, gy + 0.08, 1.75], [0.36, 0.18, 0.42], D.light, 0.1, { top: [0.7, 0.6], shift: [0, -0.06] }); M.cyl([0, gy + 0.1, 1.9], [0, gy + 0.13, 2.45], 0.035, 0.025, 6, D.joint, 0);
    // the VLS cells: a block forward of the bridge and one on the core's housing, their seams lit in the ship's feeling
    const cells = (z0, cols, rows) => { const y = deckAt(H, z0) + 0.02; for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const x = (i - (cols - 1) / 2) * 0.14, z = z0 + j * 0.14; M.box([x, y, z], [0.12, 0.03, 0.12], D.deck, 0); M.quad([x - 0.05, y + 0.017, z - 0.05], [x + 0.05, y + 0.017, z - 0.05], [x + 0.05, y + 0.017, z + 0.05], [x - 0.05, y + 0.017, z + 0.05], 0xffffff, 0.66, [x, y - 1, z]); } };
    cells(1.08, 4, 2); cells(-0.82, 4, 1);
    // the core's housing: a sponsoned deck a little wider than the hull (the hangar's place), the helipad's ring astern of it
    const hy = deckAt(H, -1.55); M.box([0, hy - 0.02, -1.55], [1.34, 0.08, 1.5], D.light, 0.1, { top: [0.98, 0.98] });
    for (let i = 0; i < 16; i++) { const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 1) / 16) * Math.PI * 2, y = deckAt(H, -2.75) + 0.012; M.quad([Math.cos(a0) * 0.32, y, -2.75 + Math.sin(a0) * 0.32], [Math.cos(a1) * 0.32, y, -2.75 + Math.sin(a1) * 0.32], [Math.cos(a1) * 0.38, y, -2.75 + Math.sin(a1) * 0.38], [Math.cos(a0) * 0.38, y, -2.75 + Math.sin(a0) * 0.38], D.glow, 0.3, [0, y - 1, -2.75]); }
    // the engines: two big square pods on the stern quarters
    const engines = [1, -1].map((s) => pod(M, { x: s * 0.5, y: 0.14, z0: -3.4, z1: -2.3, r0: 0.2, r1: 0.2, body: D.hull, band: D.accent, nozzle: D.glow, square: true, pylon: [s * 0.36, 0.14], pylonCol: D.joint }));
    return { engines };
  },
};
{ const top = deckAt(DESTROYER_HULL, 0.2) + DB.h - 0.02; DESTROYER.rig = { masts: [{ x: 0, z: 0.42, y0: top + 0.18, mode: 'hinge', hinge: 1.48, rake: 0.12, collar: D.joint, cap: D.accent, blade: { w: 0.34, t: 0.06 },
  segs: [{ len: 1.25, r0: 0.05, r1: 0.03, col: D.light, code: 0.1 }], yards: [{ seg: 0, at: 0.72, w: 0.62, r: 0.025, col: D.joint }] }] }; }

// ------------------------------------------------------------------ the galleon
const G = { hull: 0x6a2a20, wale: 0x3a1d16, dark: 0x2a1a14, gold: 0xe0b040, deck: 0x8a5a3a, glow: 0xe0b0ff, lamp: 0xffd27a, white: 0xf6f2ea };
const GALLEON_HULL = {
  shape: [[0, -1], [0.5, -0.9], [0.92, -0.4], [1, 0.15], [0.95, 0.6], [0.85, 1]],
  stations: [[-5.25, 1.0, 0.55, 1.15], [-4.4, 1.25, 0.68, 0.98], [-2.6, 1.4, 0.75, 0.8], [-0.5, 1.42, 0.75, 0.7], [1.6, 1.36, 0.72, 0.72], [3.3, 1.08, 0.62, 0.85], [4.5, 0.62, 0.46, 1.0, 0.1], [5.25, 0.04, 0.24, 1.12, 0.45]],
  strip: (i) => [[G.dark, 0.1], [G.dark, 0.1], [G.hull, 0.1], [G.wale, 0], [G.hull, 0.1]][i], deck: [G.deck, 0.1], transom: [G.hull, 0.1],
};
const GM = [{ z: 2.7, segs: [3.2, 2.4, 1.7], yards: [[0, 0.88, 2.6], [1, 0.85, 2.0], [2, 0.85, 1.3]] }, { z: 0.4, segs: [3.9, 2.8, 2.0], yards: [[0, 0.88, 3.0], [1, 0.85, 2.3], [2, 0.85, 1.5]] }, { z: -3.25, segs: [2.6, 1.6], lateen: true }];
const CASTLE = { z0: -5.25, z1: -2.75, h1: 0.7, z2: -4.0, h2: 0.55 };
const castleTop = () => deckAt(GALLEON_HULL, -4.0) + CASTLE.h1;
const GALLEON = {
  id: 'galleon', length: len('galleon'), beam: 2.84, draft: 0.75, panel: 1.0, dives: false, hull: GALLEON_HULL, pennantScale: 1.3,
  engineGlow: G.glow, vane: { lotus: true, fill: 0xfffaf0, edge: 0xffe0a0, fillA: 0.42 },
  core: { crystal: 0xffffff, collar: G.wale, frame: G.gold, canopy: false, plate: 0.0, ring: false },
  helm: [-0.64, 0.64].map((x) => [x, deckAt(GALLEON_HULL, -1.45) - 0.18, -1.45]), gun: [0, deckAt(GALLEON_HULL, 4.0) + 0.5, 4.0], pennant: { mast: 1 },
  write(M) {
    const H = GALLEON_HULL; M.loft(H);
    rail(M, H, { z0: -5.1, z1: 5.0, col: G.gold, r: 0.035, n: 24 });
    stripe(M, H, { z0: -4.8, z1: 4.6, y: 0.55, h: 0.05, col: G.gold, n: 24 });
    ports(M, H, { zs: [-3.6, -2.6, -1.6, -0.6, 0.4, 1.4, 2.4, 3.3], y: 0.38, w: 0.18, h: 0.12, col: G.lamp, code: 0.4, frame: G.gold });
    fin(M, { t: 0.1, pts: [[2.8, -0.7], [-2.6, -0.7], [-2.2, -1.2], [2.2, -1.16]], col: G.dark, edge: 0xffffff, edgeCode: 0.85 }); // (the keel blade)
    // the stern castle, stepped in two, its windows lit gold, the engine ring and the star on its back
    const c = CASTLE, y1 = deckAt(H, -4.0) - 0.04, hw = deckHalf(H, -3.6);
    M.box([0, y1 + c.h1 / 2, (c.z0 + 0.05 + c.z1) / 2], [hw * 2, c.h1, c.z1 - c.z0 - 0.05], G.hull, 0.1, { top: [0.94, 1], cols: { top: G.deck } });
    const y2 = y1 + c.h1; M.box([0, y2 + c.h2 / 2, (c.z0 + 0.1 + c.z2) / 2], [hw * 1.6, c.h2, c.z2 - c.z0 - 0.1], G.hull, 0.1, { top: [0.92, 0.95], cols: { top: G.deck } });
    for (const s of [1, -1]) for (const z of [-4.9, -4.5, -4.1, -3.7, -3.3]) M.quad([s * (hw + 0.005), y1 + 0.3, z - 0.1], [s * (hw + 0.005), y1 + 0.3, z + 0.1], [s * (hw + 0.005), y1 + 0.48, z + 0.1], [s * (hw + 0.005), y1 + 0.48, z - 0.1], G.lamp, 0.45, [0, y1, z]);
    rail(M, { ...H, stations: H.stations.map(([z, hb, d, sh, r]) => [z, hb, d, sh + c.h1 + c.h2 - 0.02, r]) }, { z0: -5.15, z1: -4.05, col: G.gold, r: 0.03, n: 4, inset: 0.2 }); // (the taffrail)
    const ry = y1 + 0.75, rz = c.z0 + 0.02, R = 0.5;
    for (let i = 0; i < 16; i++) { const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 1) / 16) * Math.PI * 2; M.cyl([Math.cos(a0) * R, ry + Math.sin(a0) * R, rz - 0.04], [Math.cos(a1) * R, ry + Math.sin(a1) * R, rz - 0.04], 0.06, 0.06, 5, G.gold, 0, { caps: false, smooth: false }); }
    const star = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? 0.1 : 0.24; star.push([Math.cos(a) * r, ry + Math.sin(a) * r, rz - 0.1]); }
    for (let i = 0; i < 10; i++) M.tri([0, ry, rz - 0.11], star[i], star[(i + 1) % 10], G.gold, 0.3, [0, ry, rz]);
    M.cyl([0, ry, rz - 0.05], [0, ry, rz - 0.1], 0.04, 0.04, 6, G.gold, 0);
    for (const s of [1, -1]) M.gem([s * hw * 0.85, y2 + c.h2 + 0.2, c.z0 + 0.25], 0.08, 0.16, 0.08, 6, G.lamp, 0.55); // (the stern lanterns)
    // the forecastle, lower than the stern, and the beak: a gold prow-lance over a beak plate
    const fy = deckAt(H, 3.6) - 0.04; M.box([0, fy + 0.25, 3.65], [deckHalf(H, 3.6) * 2, 0.5, 1.3], G.hull, 0.1, { top: [0.92, 0.9], cols: { top: G.deck } });
    fin(M, { t: 0.14, pts: [[5.0, 0.9], [5.0, 0.35], [6.3, 0.62], [6.6, 0.7]], col: G.hull, edge: G.gold, edgeCode: 0 });
    M.cyl([0, 0.95, 4.9], [0, 0.8, 6.9], 0.11, 0.02, 6, G.gold, 0);
    // the engines: the ring's disc, and two small nozzles low on the transom
    const engines = [{ at: [0, ry, rz - 0.06], r: R * 0.92 }, ...[1, -1].map((s) => pod(M, { x: s * 0.62, y: 0.1, z0: -5.45, z1: -4.75, r0: 0.18, r1: 0.16, body: G.wale, band: G.gold, nozzle: G.glow, pylon: [s * 0.5, 0.1] }))];
    // the twin helms' one canopy over both cores (the crystals each, shipkit/core.js)
    const hy = deckAt(H, -1.45) - 0.18; writeCore(M, { at: [0, hy, -1.45], r: 1.22, frame: G.gold, crystals: false, ring: false, plate: 0.05, ribs: 8, apex: 1.15 });
    return { engines };
  },
};
{
  const masts = GM.map((g, i) => {
    const segs = g.segs.map((L, k) => ({ len: L, r0: [0.16, 0.1, 0.065][k], r1: [0.12, 0.075, 0.04][k], col: G.dark }));
    const y0 = i === 2 ? castleTop() - 0.04 : deckAt(GALLEON_HULL, g.z) - 0.04;
    const yards = g.lateen ? [{ seg: 0, at: 0.78, w: 0, r: 0.04, col: G.gold, lateen: [1.4, 2.0, 0.55] }] : g.yards.map(([seg, a, w]) => ({ seg, at: a, w, r: 0.045, col: G.gold }));
    return { x: 0, z: g.z, y0, strike: 'top', collar: G.gold, cap: G.lamp, segs, yards };
  });
  const V = [];
  masts.forEach((M, mi) => M.yards.forEach((Y, j) => {
    if (Y.lateen) { V.push({ kind: 'lateen', mast: mi, yard: j, clewH: 0.8, clewZ: 1.7 }); return; }
    const h = at(M.segs, Y.seg, Y.at), below = j ? at(M.segs, M.yards[j - 1].seg, M.yards[j - 1].at) + 0.08 : 0.55;
    V.push({ kind: 'square', mast: mi, yard: j, drop: h - below, foot: j ? 1.18 : 1.08, lotus: mi === 1 && j === 0 });
  }));
  V.push({ kind: 'jib', mast: 0, head: 0.62, tack: [0, 0.82, 6.6], clew: [0, deckAt(GALLEON_HULL, 4.3) + 0.6, 4.2], clewX: 0.3 }); // (the spritsail's place: from the beak's end)
  GALLEON.rig = { masts, vanes: V };
}

// ------------------------------------------------------------------ the tanker
const K = { red: 0x8e3a24, below: 0x6e2a1a, deck: 0x3c3f44, house: 0xe6e0d0, grey: 0x5a5e66, yellow: 0xe8b923, glow: 0xffb347, dome: 0xb8b2a6, joint: 0x2a2c31 };
const TANKER_HULL = {
  shape: [[0, -1], [0.82, -1], [1, -0.78], [1, 0.3], [1, 1]],
  stations: [[-5.6, 0.85, 0.55, 0.62], [-5.0, 0.93, 0.68, 0.55], [-3.5, 0.95, 0.7, 0.5], [3.4, 0.95, 0.7, 0.5], [4.6, 0.86, 0.66, 0.53], [5.25, 0.6, 0.55, 0.58, 0.05], [5.6, 0.28, 0.4, 0.62, 0.12]],
  strip: (i) => [[K.below, 0.1], [K.below, 0.1], [K.red, 0.1], [K.red, 0.1]][i], deck: [K.deck, 0.1], transom: [K.red, 0.1],
};
const HOUSE = { z0: -5.5, z1: -3.7, w: 1.7, h1: 0.9, z2: -5.0, h2: 0.6, w3: 2.1, h3: 0.45 };
const houseRoof = () => deckAt(TANKER_HULL, -4.6) - 0.04 + HOUSE.h1 + HOUSE.h2 + HOUSE.h3;
const TANKER = {
  id: 'tanker', length: len('tanker'), beam: 1.9, draft: 0.7, panel: 1.1, dives: false, hull: TANKER_HULL,
  engineGlow: K.glow, vane: { fill: 0xfff0d8, edge: K.glow, fillA: 0.3 },
  core: { crystal: 0xffffff, collar: K.joint, frame: K.grey, plate: 0.06, apex: 0.9 },
  helm: [[0, houseRoof() - 0.1, -4.3]], gun: [0, deckAt(TANKER_HULL, 4.7) + 0.35, 4.7], pennant: { mast: 0 },
  write(M) {
    const H = TANKER_HULL; M.loft(H);
    rail(M, H, { z0: -5.5, z1: 5.4, col: K.yellow, r: 0.03, n: 26 });
    rail(M, H, { z0: -3.6, z1: 4.8, col: K.grey, r: 0.018, n: 20, inset: 0.16, dy: 0.05 }); // (the double hull: its inner skin's rail)
    stripe(M, H, { z0: -5.4, z1: 5.3, y: 0.06, h: 0.05, col: K.yellow, n: 26 });
    // the house: stepped decks, bridge wings, windows lit amber, a raked funnel on its after step
    const y = deckAt(H, -4.6) - 0.04, H0 = HOUSE;
    M.box([0, y + H0.h1 / 2, (H0.z0 + H0.z1) / 2], [H0.w, H0.h1, H0.z1 - H0.z0], K.house, 0.1);
    M.box([0, y + H0.h1 + H0.h2 / 2, (H0.z2 + H0.z1) / 2], [H0.w * 0.88, H0.h2, H0.z1 - H0.z2], K.house, 0.1);
    M.box([0, y + H0.h1 + H0.h2 + H0.h3 / 2, (H0.z2 + H0.z1 + 0.1) / 2], [H0.w3, H0.h3, H0.z1 - H0.z2 + 0.1], K.house, 0.1, { top: [1, 1], cols: { top: K.grey } });
    for (const [yy, w, z0, z1] of [[y + 0.55, H0.w, H0.z0, H0.z1], [y + H0.h1 + 0.35, H0.w * 0.88, H0.z2, H0.z1]]) for (let z = z0 + 0.2; z < z1 - 0.1; z += 0.3) for (const s of [1, -1]) M.quad([s * (w / 2 + 0.005), yy - 0.05, z - 0.08], [s * (w / 2 + 0.005), yy - 0.05, z + 0.08], [s * (w / 2 + 0.005), yy + 0.05, z + 0.08], [s * (w / 2 + 0.005), yy + 0.05, z - 0.08], K.glow, 0.4, [0, yy, z]);
    const by = y + H0.h1 + H0.h2 + H0.h3 * 0.55; M.quad([-H0.w3 / 2, by - 0.07, H0.z1 + 0.056], [H0.w3 / 2, by - 0.07, H0.z1 + 0.056], [H0.w3 / 2, by + 0.07, H0.z1 + 0.056], [-H0.w3 / 2, by + 0.07, H0.z1 + 0.056], 0x9fd0ff, 0.3, [0, by, -4]); // (the bridge's windows)
    const fz = (H0.z0 + H0.z2) / 2, fy = y + H0.h1; M.box([0, fy + 0.62, fz - 0.05], [0.42, 1.24, 0.34], K.grey, 0.1, { top: [0.9, 0.9], shift: [0, -0.18] }); M.box([0, fy + 1.0, fz - 0.15], [0.44, 0.12, 0.36], K.yellow, 0, { shift: [0, -0.02] });
    M.box([0, fy + 1.26, fz - 0.23], [0.36, 0.02, 0.28], K.glow, 0.5);
    // the hold: tank domes down the deck, each banded in the crude's glow
    for (const z of [3.9, 2.4, 0.9, -0.6, -2.1]) {
      const dy = deckAt(H, z) - 0.02, r = 0.62;
      for (let a = 0; a < 3; a++) { const y0 = Math.sin((a / 3) * Math.PI / 2) * r, y1 = Math.sin(((a + 1) / 3) * Math.PI / 2) * r, r0 = Math.cos((a / 3) * Math.PI / 2) * r, r1 = Math.cos(((a + 1) / 3) * Math.PI / 2) * r; M.cyl([0, dy + y0 * 0.75, z], [0, dy + y1 * 0.75, z], r0, Math.max(0.01, r1), 12, K.dome, 0.1, { caps: a === 2, phase: 0.13 }); }
      M.cyl([0, dy, z], [0, dy + 0.06, z], r + 0.03, r + 0.02, 12, K.glow, 0.45, { caps: false });
    }
    // the manifold midships: a gantry across the deck, pipes along it, a catwalk to the house
    const my = deckAt(H, 0.15);
    for (const dz of [-0.12, 0, 0.12]) M.cyl([-0.85, my + 0.2, 0.15 + dz], [0.85, my + 0.2, 0.15 + dz], 0.03, 0.03, 5, K.yellow, 0, { caps: true });
    for (const s of [1, -1]) M.box([s * 0.7, my + 0.15, 0.15], [0.05, 0.3, 0.4], K.grey, 0);
    for (const x of [-0.72, -0.62]) M.cyl([x, my + 0.07, -3.6], [x, my + 0.07, 4.8], 0.03, 0.03, 5, K.grey, 0, { caps: false });
    M.box([0.72, my + 0.36, 0.6], [0.12, 0.02, 8.4], K.grey, 0); for (let z = -3.4; z < 4.8; z += 1.0) M.box([0.72, my + 0.18, z], [0.03, 0.36, 0.03], K.grey, 0);
    // the bulb under the bow: a glowing teardrop; the bow's small mast and its lamp
    M.gem([0, -0.42, 5.5], 0.26, 0.6, 0.45, 8, K.glow, 0.5, { axis: [0, 0, 1] });
    const bmy = deckAt(H, 5.0); M.cyl([0, bmy, 5.0], [0, bmy + 0.75, 5.0], 0.035, 0.025, 5, K.yellow, 0); M.gem([0, bmy + 0.8, 5.0], 0.05, 0.08, 0.04, 5, K.glow, 0.55);
    slot(M, { y: deckAt(H, -3.45) - 0.04, z: -3.45, w: 0.3, d: 0.3 });
    // the engines: two nozzles on the transom
    const engines = [1, -1].map((s) => pod(M, { x: s * 0.42, y: -0.12, z0: -5.85, z1: -5.35, r0: 0.26, r1: 0.24, body: K.grey, band: K.yellow, nozzle: K.glow }));
    return { engines };
  },
};
TANKER.rig = {
  masts: [{ x: 0, z: -3.45, y0: deckAt(TANKER_HULL, -3.45) - 0.04, stub: 0.05, collar: K.joint, cap: K.glow, segs: [{ len: 0.95, r0: 0.07, r1: 0.06, col: K.yellow }, { len: 0.9, r0: 0.05, r1: 0.03, col: K.yellow }],
    yards: [{ seg: 1, at: 0.6, w: 0.6, r: 0.025, col: K.grey }] }],
  vanes: [{ kind: 'square', mast: 0, yard: 0, drop: 0.32, foot: 0.9 }], // (the radar's vane)
};

/** Each class's numbers (with the sloop's, vfx/sloop.js SLOOP). */
export const SHIP_FORMS = { frigate: FRIGATE, destroyer: DESTROYER, galleon: GALLEON, tanker: TANKER };
for (const S of Object.values(SHIP_FORMS)) if (!(S.helm || []).every(([x, , z]) => Math.abs(x) + cradleFoot() * 0.6 <= deckHalf(S.hull, z) + 0.2)) console.warn(`ship ${S.id}: a helm stands off its deck`);

export class ShipClassLook extends ShipLook {
  constructor(id, { env = null } = {}) { const S = SHIP_FORMS[id]; if (!S) throw new Error(`no ship form ${id}`); super(S, { env }); this.form = S; }
}

/** The look of a hull by its class: the sloop's own, or one of the four here. */
export function shipLook(id, opts = {}) {
  if (SHIP_FORMS[id]) return new ShipClassLook(id, opts);
  const s = new Sloop(opts); s.length = SLOOP.length; s.beam = SLOOP.beam; return s;
}
