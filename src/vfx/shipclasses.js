// ---------------------------------------------------------------------------------------
// THE SHIP CLASSES: the frigate, the destroyer, the galleon and the tanker as the Vessoul's ships (docs/GLOSSARY.md: the Vessoul, ship;
// progress/rail/ships.js: each hull's size, role and verbs), with the sloop (vfx/sloop.js) the five. One look named for all five, SEA-GOING
// STARSHIPS OF THE AGE OF SAIL (Calissa's; the owner, 2026-10-20: "match the forms and silhouettes of their IRL counterparts more
// closely ... lean into the sci-fi ship designs of Outlaw Star, Tenchi Muyo's jurai ships, Skies of Arcadia, and Rogue Galaxy"). The
// pots are gone; the hulls are ships. RAIL-SHIPS-SCIFI.md 1 (the real silhouettes) and 3 (the fusion brief), followed, a class each:
//   frigate    ESCORT. A sail-age frigate: three masts, the middle tallest, yards crossing each, a jib on a bowsprit raised 20 degrees, a
//              spanker on a boom over the stern; a long low hull (4:1) with tumblehome, a deep-teal gun-deck band with its row of lit
//              ports, cream strakes above, gold trim; a raised quarterdeck and forecastle over a level waist; a stern gallery with its
//              balcony and quarter galleries; Skies of Arcadia's Delphinus fins aft, two pods under the quarters. Green-gold glow
//              (Jurai's wood). Its figurehead a feeling's spirit with Lachrymite wings. Its masts strike in a ripple, aft to fore.
//   destroyer  HUNTS EGREGORES. An Arleigh Burke's blade: a long thin dart, a raised forecastle to a raked stem, a gun turret forward, a
//              block of VLS cells, one slab-sided superstructure with a ladder to its roof and a pair of stacks, a flat-blade mast that
//              hinges flat back onto it (a tabernacle), two big square engine pods aft, a carved band on its transom over its rudder. Grey-blue, a
//              weathered deck, a red-orange accent, blue-white glow. Its figurehead a glazed clapperjar clapping over the water.
//   galleon    TREASURE (refined cubes). The Dorgenark (Rogue Galaxy's space galleon) on a real galleon's lines: a stepped stern castle
//              (a quarterdeck and a poop over the waist), a forecastle, a long beak, tumblehome (3.7:1), square vanes fore and main, a
//              lateen on the mizzen, a keel blade, a two-tier stern gallery with balconies and domed quarter galleries, two engine rings
//              with gold stars low on the transom; its topgallants strike for a roll. Deep brown-red strakes, gold, white vanes,
//              violet-gold glow. Its figurehead a gilded figure of the clay folk's Court holding a Lachryma cube aloft. Two helms side
//              by side under one canopy (co-op).
//   tanker     CRUDE, double-hulled. A tanker's slab: a long flat deck (6:1), all the height in the house aft (three stepped decks, the
//              bridge's wings, a raked funnel, stairs and ladders up it), a row of glowing tank domes, a pipe manifold midships, a raised
//              catwalk, a glowing bulb under a blunt bow; the double hull a second rail inboard. Oxide red, tarred planks, yellow warning
//              stripes, amber glow. Its figurehead a teardrop of Lachryma held in two gold hands. Its short mast drops on a roll.
// THE LIFE SIZE (the owner, 2026-10-27: "about five times larger ... host a crew of six courier-sized entities or more ... figureheads
// and ornate rudders and railing; flatter decks too"): each class authored at five times the first hulls' size (the sloop's 35 m times
// ships.js's hurtbox), its decks nearly level and planked (shipkit/hullmaterial.js), raised decks stepped in the loft with stairs
// between (shipkit/fittings.js), turned balusters under a gold cap rail along every gunwale, an ornate rudder, a figurehead
// (shipkit/figureheads.js); the frame +Z the bow, Y up, the origin at the waterline amidships; `scale` 5 on the look.
// Built on the ship kit (shipkit/: one hull mesh and one rig mesh in one material a ship, the vanes in the sail's program, the core and
// cradle), so a class is a table and its static parts.
// Prior art: the real classes (USS Constitution's and the Endymion class's proportions, the Arleigh Burke class, the late galleon, a
// VLCC with its house aft and bulbous bow), the four references as each line above says, and the age of sail's stern galleries,
// figureheads and rudders as shipkit/fittings.js and figureheads.js credit.
//
//   shipLook(id, { env }) -> a Sloop or a ShipClassLook (the same API: group, body, set, fold, feeling, hurt, hoist, scars, keelMat,
//   mouth, gunAt, length, beam, scale, deckY, helmCradles, helmCradle, helmCradleSpots, helmWake, deckHeight, crewSpots, dispose; shipkit/shiplook.js)
//   SHIP_FORMS[id] (each class's numbers: length, beam, draft, helm, dives, hull, rig)   new ShipClassLook(id, { env })
// ---------------------------------------------------------------------------------------
import { Sloop, SLOOP } from './sloop.js';
import { ShipLook } from './shipkit/shiplook.js';
import { deckAt, deckHalf, sideAt, PLANK } from './shipkit/hullkit.js';
import { rail, pod, fin, ports, slot, wing, stripe } from './shipkit/parts.js';
import { balustrade, railRuns, deckBreak, capstan, stairs, ladder, rudder, gallery } from './shipkit/fittings.js';
import { figurehead } from './shipkit/figureheads.js';
import { writeCore } from './shipkit/core.js';
import { cradleFoot } from './cradlelook.js';
import { SHIPS } from '../progress/rail/ships.js';

const SCALE = SLOOP.length / SLOOP.was; // (five: every class at five times the first hulls' size)
const len = (id) => SLOOP.length * SHIPS[id].hurtbox; // (the sloop's 35 m times the hull's hurtbox: the classes keep their sizes to each other)

/** A mast of `n` telescoping segments of `seg` metres (each nests in the one below; the lowest sinks to its stub). */
const scope = (n, seg, r0, r1, col) => Array.from({ length: n }, (_, i) => { const k = i / Math.max(1, n - 1), kn = (i + 1) / n; return { len: seg * (1 - 0.02 * i), r0: r0 + (r1 - r0) * k, r1: r0 + (r1 - r0) * kn * 0.98, col }; });
/** Height on a mast at segment i, share `at` along it (the rig's rest bases: shipkit/rig.js restOf, overlap 0.12). */
const at = (segs, i, a) => { let b = 0; for (let k = 0; k < i; k++) b += segs[k].len * 0.88; return b + a * segs[i].len; };
/** The deck's edge height at z (the deck's centreline less its camber): where a rail stands. */
const edgeY = (H, z) => deckAt(H, z) - (H.camber ?? 0.04);
/** A crew's places [x, z] set on the deck under them. */
const crewOn = (H, spots) => spots.map(([x, z]) => [x, z, deckAt(H, z)]);
/** The taffrail: a balustrade across the stern at z. */
const taffrail = (M, H, z, opts) => { const h = deckHalf(H, z) - 0.25, y = edgeY(H, z); balustrade(M, [[-h, y, z], [h, y, z]], opts); };

// ------------------------------------------------------------------ the frigate
const F = { cream: 0xeee3c8, teal: 0x1d5a5a, dark: 0x153a3b, gold: 0xd9b04a, deck: 0xcdb995, glow: 0xc8e87a, joint: 0x2a3434, seam: 0xd8f0a0, red: 0xb8452e };
const FRIGATE_HULL = {
  shape: [[0, -1], [0.45, -0.95], [0.9, -0.45], [1, 0.1], [0.97, 0.62], [0.86, 1]], camber: 0.08,
  stations: [[-19.25, 3.7, 1.75, 4.0], [-16.5, 4.4, 2.4, 3.95], [-10, 4.75, 2.75, 3.9], [-8.6, 4.78, 2.75, 3.9], [-8.4, 4.78, 2.75, 2.7], [0, 4.8, 2.75, 2.7],
    [9, 4.5, 2.6, 2.72], [12.4, 3.9, 2.35, 2.78], [12.6, 3.85, 2.33, 3.85], [14.5, 3.1, 2.0, 3.9], [17.75, 1.25, 1.25, 4.05, 0.75], [19.25, 0.1, 0.5, 4.2, 1.6]],
  strip: (i) => [[F.dark, 0.1], [F.dark, 0.1], [F.cream, PLANK], [F.teal, 0], [F.cream, PLANK]][i], deck: [F.deck, PLANK], transom: [F.cream, 0.1],
};
const FQ = -8.5, FF = 12.5; // (the quarterdeck's break and the forecastle's)
const FM = { fore: { z: 11, n: 5 }, main: { z: 0.75, n: 6 }, mizzen: { z: -10.25, n: 4 } };
const FBOW = { z: 17, a: 0.35, len: 9 }; // (the bowsprit: its heel, its rise, its length)
const fBow = (k) => { const y = deckAt(FRIGATE_HULL, 17.5) - 0.3; return [0, y + Math.sin(FBOW.a) * FBOW.len * k, FBOW.z + Math.cos(FBOW.a) * FBOW.len * k]; };
const frigateMasts = () => Object.values(FM).map(({ z, n }, i) => {
  const segs = scope(n, 7.25, 0.42, 0.13, F.cream), yardSegs = n === 6 ? [1, 3, 5] : n === 5 ? [1, 3, 4] : [1, 3];
  const widths = n === 6 ? [11, 9, 6.5] : n === 5 ? [10, 8, 5.5] : [8, 5.5];
  return { x: 0, z, y0: deckAt(FRIGATE_HULL, z), stub: 1.5, delay: [0.2, 0.1, 0][i], collar: F.joint, cap: F.glow, segs,
    yards: yardSegs.map((s, j) => ({ seg: s, at: 0.55, w: widths[j], r: 0.16, col: F.gold, pivot: true })) };
});
const FRIGATE = {
  id: 'frigate', length: len('frigate'), beam: 9.6, draft: 2.75, scale: SCALE, panel: 3.4, dives: true, hull: FRIGATE_HULL, pennantScale: 5,
  engineGlow: F.glow, vane: { fill: 0xf4f0dc, edge: 0xe8ffb0, fillA: 0.32 },
  core: { crystal: 0xffffff, collar: F.joint, frame: F.gold, plate: 0.45, apex: 2.3, k: 1.8 },
  helm: [[0, deckAt(FRIGATE_HULL, -14) - 0.14, -14]], gun: [0, deckAt(FRIGATE_HULL, 15.2) + 1.5, 15.2], pennant: { mast: 1 },
  crew: crewOn(FRIGATE_HULL, [[-2.5, -5], [2.5, -5], [-2.5, 4], [2.5, 4], [0, -2.5], [0, 7.5], [-2, -16.5], [1.8, 15.5]]),
  write(M) {
    const H = FRIGATE_HULL; M.loft(H);
    // the railings: the waist, the quarterdeck, the forecastle; their breaks with stairs down; the taffrail
    const R = { post: F.cream, cap: F.gold };
    railRuns(M, H, [[FQ + 0.25, FF - 0.25], [-19.0, FQ - 0.3], [FF + 0.3, 18.4]], R);
    deckBreak(M, H, { z: FQ, stairs: [-2.6, 2.6], ...R, tread: F.deck, gold: F.gold });
    deckBreak(M, H, { z: FF, fore: true, stairs: [-1.9, 1.9], w: 1.1, ...R, tread: F.deck, gold: F.gold });
    taffrail(M, H, -19.0, R);
    ports(M, H, { zs: [-13, -4, 0.5, 5, 9.5], y: 1.05, w: 1.0, h: 0.42, col: F.glow, frame: F.joint }); // (the gun-deck's lit ports, clear of the breaks)
    fin(M, { t: 0.4, pts: [[11, -2.5], [-13, -2.5], [-14.5, -3.9], [9, -3.6]], col: F.dark, edge: 0xffffff, edgeCode: 0.85 });
    wing(M, { y: 1.6, t: 0.25, pts: [[4.5, -9.5], [4.5, -15.5], [8, -17.25], [7.75, -14.5]], col: F.cream, edge: F.gold, edgeCode: 0, dihedral: 0.12 }); // (the Delphinus fins)
    const engines = [1, -1].map((s) => pod(M, { x: s * 2.4, y: -0.9, z0: -21.2, z1: -15, r0: 1.1, r1: 0.8, sides: 10, body: F.cream, band: F.teal, nozzle: F.glow, pylon: [s * 1.8, -0.2] }));
    // the stern: a gallery with its balcony and quarter galleries, over the rudder
    gallery(M, { z: -19.25, y0: 1.9, w: 6.0, tiers: 1, h: 1.7, rows: 5, col: F.teal, frame: F.gold, glass: F.glow, gold: F.gold, balcony: true, quarter: sideAt(H, -18, 2.7), post: F.cream });
    rudder(M, { z: -19.2, yTop: 1.7, yBot: -1.6, chord: 2.5, t: 0.4, col: F.dark, gold: F.gold, inlay: F.teal });
    // the bowsprit raised 20 degrees with its gold bands, the figurehead under it: a feeling's spirit with Lachrymite wings
    M.cyl(fBow(-0.12), fBow(1), 0.32, 0.12, 8, F.cream, 0); for (const k of [0.3, 0.55]) M.cyl(fBow(k - 0.015), fBow(k + 0.015), 0.36, 0.36, 8, F.gold, 0, { caps: false });
    figurehead(M, 'spirit', { at: [0, 1.25, 20.1], lean: 0.85, k: 0.95, cols: { gold: F.gold, glaze: F.cream, glow: 0xffffff, white: 0xf6f2ea } });
    // the mount ring forward, the masts' slots, the capstan, the gratings, the skylight over the great cabin
    const gy = deckAt(H, 15.2); M.cyl([0, gy - 0.25, 15.2], [0, gy + 0.7, 15.2], 1.0, 0.85, 10, F.joint, 0); M.cyl([0, gy + 0.7, 15.2], [0, gy + 0.9, 15.2], 0.85, 0.5, 10, F.gold, 0);
    for (const { z } of Object.values(FM)) slot(M, { y: deckAt(H, z), z, w: 2.25, d: 2.25 });
    capstan(M, { at: [0, deckAt(H, -4), -4], r: 0.55, col: F.cream, band: F.gold, bars: F.joint });
    for (const z of [4, 7.6]) { const y = deckAt(H, z); M.box([0, y + 0.15, z], [2.6, 0.3, 2.2], F.deck, PLANK); M.box([0, y + 0.32, z], [2.7, 0.06, 2.3], F.gold, 0); }
    const sy = deckAt(H, -17); M.box([0, sy + 0.3, -17], [1.8, 0.6, 1.4], F.cream, 0.1, { top: [0.7, 0.8] }); M.quad([-0.62, sy + 0.62, -17.5], [0.62, sy + 0.62, -17.5], [0.62, sy + 0.62, -16.5], [-0.62, sy + 0.62, -16.5], F.glow, 0.32, [0, sy, -17]);
    for (const s of [1, -1]) M.gem([s * (deckHalf(H, -19) - 0.25), edgeY(H, -19) + 1.35, -19.0], 0.24, 0.42, 0.2, 6, F.glow, 0.5); // (the stern lanterns)
    return { engines };
  },
};
FRIGATE.rig = { masts: frigateMasts(), booms: [{ mast: 2, h: 2.6, len: 9.5, r: 0.18, col: F.gold }], hatches: [0, 1, 2].map((m) => ({ mast: m, w: 2.25, d: 2.25, col: F.cream, seam: F.seam })) };
{
  const R = FRIGATE.rig, V = [];
  R.masts.forEach((M, mi) => M.yards.forEach((Y, j) => {
    const h = at(M.segs, Y.seg, Y.at), below = j ? at(M.segs, M.yards[j - 1].seg, M.yards[j - 1].at) + 0.3 : 2.25;
    V.push({ kind: 'square', mast: mi, yard: j, drop: h - below, foot: j ? 1.15 : 1.05 });
  }));
  V.push({ kind: 'jib', mast: 0, head: 0.8, tack: fBow(0.9), clew: [0, deckAt(FRIGATE_HULL, 14) + 1.5, 13.75], clewX: 1.25 });
  V.push({ kind: 'main', mast: 2, boom: 0, head: 0.92 }); // (the spanker)
  R.vanes = V;
}

// ------------------------------------------------------------------ the destroyer
const D = { hull: 0x7d8fa3, light: 0x8d9fb4, dark: 0x2a3242, deck: 0x7a7468, accent: 0xe8572a, glow: 0xbfe0ff, joint: 0x1b2230, glass: 0x9fd0ff, gold: 0xe8c060 };
const DESTROYER_HULL = {
  shape: [[0, -1], [0.5, -0.85], [0.95, -0.3], [1, 0.2], [1.04, 0.7], [1.0, 1]], camber: 0.06,
  stations: [[-15.75, 2.5, 1.1, 1.65], [-12, 2.8, 1.5, 1.62], [-3, 3.0, 1.7, 1.6], [4, 2.8, 1.7, 1.62], [7.9, 2.45, 1.6, 1.68], [8.1, 2.42, 1.6, 2.55], [9.5, 2.2, 1.5, 2.6],
    [13, 1.4, 1.2, 2.85, 0.4], [15.75, 0.1, 0.4, 3.2, 2.1]],
  strip: (i) => [[D.dark, 0.1], [D.dark, 0.1], [D.hull, 0.1], [D.hull, 0.1], [D.light, 0.1]][i], deck: [D.deck, PLANK], transom: [D.hull, 0.1],
};
const DF = 8; // (the forecastle's break)
const DB = { z0: -2.5, z1: 4.5, w: 4.0, h: 2.75 }; // (the superstructure block: a Courier's walk each side of it)
const dTop = () => deckAt(DESTROYER_HULL, 1) + DB.h - 0.1;
const DESTROYER = {
  id: 'destroyer', length: len('destroyer'), beam: 6.0, draft: 1.7, scale: SCALE, panel: 2.8, dives: true, hull: DESTROYER_HULL, pennantScale: 3.2,
  engineGlow: D.glow, core: { crystal: 0xffffff, collar: D.joint, frame: D.joint, plate: 0.3, apex: 2.2, k: 1.6 },
  helm: [[0, deckAt(DESTROYER_HULL, -7.75) + 0.3 - 0.14, -7.75]], gun: [0, deckAt(DESTROYER_HULL, 10.5) + 1.5, 10.5], pennant: { mast: 0 },
  crew: crewOn(DESTROYER_HULL, [[-2.2, -11], [2.2, -11], [-2.5, 0], [2.5, 2], [0, 6], [0, -4.5], [1.2, 12.5]]),
  write(M) {
    const H = DESTROYER_HULL; M.loft(H);
    const R = { post: D.joint, cap: D.gold, every: 0.85 };
    railRuns(M, H, [[DF + 0.3, 14.2], [-15.5, DF - 0.25]], R);
    deckBreak(M, H, { z: DF, fore: true, stairs: [0], w: 1.2, ...R, tread: D.deck, gold: D.gold });
    taffrail(M, H, -15.5, R);
    stripe(M, H, { z0: 7.5, z1: 13.5, y: 1.95, h: 0.25, col: D.accent, n: 8 }); // (the hunter's red-orange flash on the bow)
    fin(M, { t: 0.3, pts: [[8, -1.5], [-10, -1.5], [-11, -2.3], [6, -2.2]], col: D.dark, edge: 0xffffff, edgeCode: 0.85 });
    // the superstructure: one slab block, angled planes, the bridge on it, its windows a lit band, two stacks aft on its roof, a ladder up its after face
    const y0 = deckAt(H, 1), zc = (DB.z0 + DB.z1) / 2;
    M.box([0, y0 + DB.h / 2 - 0.1, zc], [DB.w, DB.h, DB.z1 - DB.z0], D.light, 0.1, { top: [0.82, 0.9], shift: [0, -0.3] });
    const top = dTop();
    M.box([0, top + 0.5, 3.1], [2.8, 1.0, 2.1], D.light, 0.1, { top: [0.8, 0.7], shift: [0, -0.25] });
    M.quad([-1.3, top + 0.5, 4.2], [1.3, top + 0.5, 4.2], [1.1, top + 0.8, 4.0], [-1.1, top + 0.8, 4.0], D.glass, 0.4, [0, top, 2.5]);
    for (let z = -1.8; z < 4; z += 1.2) for (const s of [1, -1]) M.quad([s * (DB.w / 2 + 0.01), y0 + 1.4, z - 0.35], [s * (DB.w / 2 + 0.01), y0 + 1.4, z + 0.35], [s * (DB.w / 2 + 0.01), y0 + 1.8, z + 0.35], [s * (DB.w / 2 + 0.01), y0 + 1.8, z - 0.35], D.glass, 0.35, [0, y0 + 1.6, z]);
    for (const s of [1, -1]) { M.box([s * 1.0, top + 0.85, -0.6], [0.8, 1.7, 1.3], D.hull, 0.1, { top: [0.8, 0.8], shift: [0, -0.5] }); M.box([s * 1.0, top + 1.75, -0.85], [0.7, 0.1, 1.0], D.joint, 0); }
    ladder(M, { x: 1.3, z: DB.z0, y0, y1: top, w: 0.6, face: [0, -1], col: D.joint });
    balustrade(M, [[-DB.w * 0.4, top, DB.z0 + 0.2], [DB.w * 0.4, top, DB.z0 + 0.2]], { ...R, h: 1.0 }); // (the roof's after rail)
    // the gun forward: a low wedge turret and its barrel
    const gy = deckAt(H, 10.5); M.box([0, gy + 0.4, 10.5], [1.8, 0.9, 2.1], D.light, 0.1, { top: [0.7, 0.6], shift: [0, -0.3] }); M.cyl([0, gy + 0.5, 11.2], [0, gy + 0.65, 14.0], 0.17, 0.12, 6, D.joint, 0);
    // the VLS cells: a block forward of the bridge and one on the core's housing, their seams lit in the ship's feeling
    const cells = (z0, cols, rows) => { const y = deckAt(H, z0) + 0.05; for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const x = (i - (cols - 1) / 2) * 0.7, z = z0 + j * 0.7; M.box([x, y, z], [0.6, 0.15, 0.6], D.dark, 0); M.quad([x - 0.25, y + 0.08, z - 0.25], [x + 0.25, y + 0.08, z - 0.25], [x + 0.25, y + 0.08, z + 0.25], [x - 0.25, y + 0.08, z + 0.25], 0xffffff, 0.66, [x, y - 1, z]); } };
    cells(4.95, 5, 3); cells(-4.4, 5, 1);
    // the core's housing: a sponsoned deck a little wider than the hull (the hangar's place), the helipad's ring astern of it
    const hy = deckAt(H, -7.75); M.box([0, hy + 0.1, -7.75], [6.7, 0.4, 5.5], D.light, 0.1, { top: [0.98, 0.98] });
    for (let i = 0; i < 20; i++) { const a0 = (i / 20) * Math.PI * 2, a1 = ((i + 1) / 20) * Math.PI * 2, y = deckAt(H, -13.0) + 0.02; M.quad([Math.cos(a0) * 1.6, y, -13 + Math.sin(a0) * 1.6], [Math.cos(a1) * 1.6, y, -13 + Math.sin(a1) * 1.6], [Math.cos(a1) * 1.9, y, -13 + Math.sin(a1) * 1.9], [Math.cos(a0) * 1.9, y, -13 + Math.sin(a0) * 1.9], D.glow, 0.3, [0, y - 1, -13]); }
    // the stern: a carved transom over the rudder; the engines: two big square pods on the quarters
    M.box([0, 1.4, -15.8], [4.2, 0.22, 0.14], D.gold, 0); M.box([0, 1.15, -15.8], [3.0, 0.1, 0.1], D.accent, 0); // (the transom's carved band, gold over the accent)
    rudder(M, { z: -15.7, yTop: 1.2, yBot: -1.6, chord: 1.8, t: 0.3, col: D.dark, gold: D.gold, inlay: D.accent });
    const engines = [1, -1].map((s) => pod(M, { x: s * 2.5, y: 0.7, z0: -17, z1: -11.5, r0: 1.0, r1: 1.0, body: D.hull, band: D.accent, nozzle: D.glow, square: true, pylon: [s * 1.8, 0.7], pylonCol: D.joint }));
    figurehead(M, 'clapper', { at: [0, 1.15, 17.1], lean: 0.9, k: 0.85, cols: { gold: D.gold, body: D.accent, dark: D.joint, white: 0xf3efe6, glow: D.glow } });
    return { engines };
  },
};
DESTROYER.rig = { masts: [{ x: 0, z: 2.1, y0: dTop() + 0.9, mode: 'hinge', hinge: 1.48, rake: 0.12, collar: D.joint, cap: D.accent, blade: { w: 1.7, t: 0.3 },
  segs: [{ len: 6.25, r0: 0.25, r1: 0.15, col: D.light, code: 0.1 }], yards: [{ seg: 0, at: 0.72, w: 3.1, r: 0.12, col: D.joint }] }] };

// ------------------------------------------------------------------ the galleon
const G = { hull: 0x6a2a20, wale: 0x3a1d16, dark: 0x2a1a14, gold: 0xe0b040, deck: 0x8a5a3a, glow: 0xe0b0ff, lamp: 0xffd27a, white: 0xf6f2ea };
const GALLEON_HULL = {
  shape: [[0, -1], [0.5, -0.9], [0.92, -0.4], [1, 0.15], [0.95, 0.6], [0.85, 1]], camber: 0.1,
  stations: [[-26.25, 5.0, 2.75, 8.3], [-22, 6.25, 3.4, 8.25], [-20.1, 6.6, 3.55, 8.2], [-19.9, 6.62, 3.55, 6.0], [-13.85, 7.0, 3.75, 5.9], [-13.65, 7.0, 3.75, 3.55],
    [-2.5, 7.1, 3.75, 3.5], [8, 6.8, 3.6, 3.5], [14.9, 5.6, 3.2, 3.65], [15.1, 5.55, 3.2, 5.6], [22.5, 3.1, 2.3, 5.75, 0.5], [26.25, 0.2, 1.2, 6.1, 2.25]],
  strip: (i) => [[G.dark, 0.1], [G.dark, 0.1], [G.hull, PLANK], [G.wale, 0], [G.hull, PLANK]][i], deck: [G.deck, PLANK], transom: [G.hull, 0.1],
};
const GQ = -13.75, GP = -20, GF = 15; // (the breaks: the quarterdeck's, the poop's, the forecastle's)
const GM = [{ z: 13.5, segs: [16, 12, 8.5], yards: [[0, 0.88, 13], [1, 0.85, 10], [2, 0.85, 6.5]] }, { z: 2, segs: [19.5, 14, 10], yards: [[0, 0.88, 15], [1, 0.85, 11.5], [2, 0.85, 7.5]] }, { z: -16.25, segs: [13, 8], lateen: true }];
const GBOW = { z: 21, a: 0.3, len: 15 };
const gBow = (k) => { const y = deckAt(GALLEON_HULL, 21) - 0.3; return [0, y + Math.sin(GBOW.a) * GBOW.len * k, GBOW.z + Math.cos(GBOW.a) * GBOW.len * k]; };
const GHELM = { z: -7.25, x: 1.6 };
const GALLEON = {
  id: 'galleon', length: len('galleon'), beam: 14.2, draft: 3.75, scale: SCALE, panel: 4.2, plank: 0.34, dives: false, hull: GALLEON_HULL, pennantScale: 6.5,
  engineGlow: G.glow, vane: { lotus: true, fill: 0xfffaf0, edge: 0xffe0a0, fillA: 0.42 },
  core: { crystal: 0xffffff, collar: G.wale, frame: G.gold, canopy: false, plate: 0.0, ring: false, k: 1.6 },
  helm: [-GHELM.x, GHELM.x].map((x) => [x, deckAt(GALLEON_HULL, GHELM.z) - 0.18, GHELM.z]), gun: [0, deckAt(GALLEON_HULL, 18.5) + 1.6, 18.5], pennant: { mast: 1 },
  crew: crewOn(GALLEON_HULL, [[-4, -4], [4, -4], [-4, 6], [4, 6], [0, -11], [0, 9.5], [-3, -17], [3, -23], [2, 18]]),
  write(M) {
    const H = GALLEON_HULL; M.loft(H);
    const R = { post: G.white, cap: G.gold, every: 0.85 };
    railRuns(M, H, [[GQ + 0.3, GF - 0.3], [GP + 0.3, GQ - 0.35], [-26.0, GP - 0.35], [GF + 0.35, 23.8]], R);
    deckBreak(M, H, { z: GQ, stairs: [-3.6, 3.6], ...R, tread: G.deck, gold: G.gold });
    deckBreak(M, H, { z: GP, stairs: [-2.6, 2.6], w: 1.2, ...R, tread: G.deck, gold: G.gold });
    deckBreak(M, H, { z: GF, fore: true, stairs: [-3.0, 3.0], ...R, tread: G.deck, gold: G.gold });
    taffrail(M, H, -26.0, R);
    stripe(M, H, { z0: -24, z1: 23, y: 2.75, h: 0.25, col: G.gold, n: 26 });
    ports(M, H, { zs: [-11.5, -6.5, -1.5, 3.5, 8.5, 12.5], y: 1.9, w: 0.9, h: 0.6, col: G.lamp, code: 0.4, frame: G.gold });
    ports(M, H, { zs: [-18.5, -17, -15.5], y: 4.6, w: 0.7, h: 0.6, col: G.lamp, code: 0.45, frame: G.gold }); // (the quarterdeck's cabin lights)
    ports(M, H, { zs: [-24.5, -23, -21.5], y: 7.0, w: 0.7, h: 0.6, col: G.lamp, code: 0.45, frame: G.gold }); // (the poop's)
    fin(M, { t: 0.5, pts: [[14, -3.5], [-13, -3.5], [-11, -6], [11, -5.8]], col: G.dark, edge: 0xffffff, edgeCode: 0.85 }); // (the keel blade)
    // the stern: two tiers of gallery, balconies and domed quarter galleries; under them the rudder between the two engine rings, a gold star in each
    gallery(M, { z: -26.25, y0: 3.3, w: 8.0, tiers: 2, h: 2.25, rows: 6, col: G.wale, frame: G.gold, glass: G.lamp, gold: G.gold, balcony: true, quarter: sideAt(H, -25, 4.6), post: G.white });
    rudder(M, { z: -26.2, yTop: 3.05, yBot: -3.3, chord: 3.4, t: 0.5, col: G.dark, gold: G.gold, inlay: G.hull });
    const engines = [];
    for (const s of [1, -1]) {
      const cx = s * 2.75, ry = 1.25, rz = -26.3, Rr = 1.3;
      for (let i = 0; i < 16; i++) { const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 1) / 16) * Math.PI * 2; M.cyl([cx + Math.cos(a0) * Rr, ry + Math.sin(a0) * Rr, rz - 0.15], [cx + Math.cos(a1) * Rr, ry + Math.sin(a1) * Rr, rz - 0.15], 0.2, 0.2, 5, G.gold, 0, { caps: false, smooth: false }); }
      const star = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? 0.26 : 0.62; star.push([cx + Math.cos(a) * r, ry + Math.sin(a) * r, rz - 0.4]); }
      for (let i = 0; i < 10; i++) M.tri([cx, ry, rz - 0.42], star[i], star[(i + 1) % 10], G.gold, 0.3, [cx, ry, rz]);
      engines.push({ at: [cx, ry, rz - 0.2], r: Rr * 0.92 });
    }
    for (const s of [1, -1]) M.gem([s * (deckHalf(H, -25.8) - 0.3), edgeY(H, -25.8) + 1.4, -25.8], 0.45, 0.8, 0.35, 6, G.lamp, 0.55); // (the stern lanterns)
    // the beak: a gold-edged plate under the bowsprit; the figurehead stands on it, a gilded figure of the Court holding a cube aloft
    fin(M, { t: 0.7, pts: [[24.6, 4.5], [25, 1.75], [31.5, 3.1], [33, 3.6]], col: G.hull, edge: G.gold, edgeCode: 0 });
    M.cyl(gBow(-0.1), gBow(1), 0.5, 0.16, 8, G.dark, 0); for (const k of [0.25, 0.5, 0.75]) M.cyl(gBow(k - 0.012), gBow(k + 0.012), 0.52, 0.52, 8, G.gold, 0, { caps: false });
    figurehead(M, 'court', { at: [0, 3.75, 29.2], lean: 0.55, k: 1.0, cols: { gold: G.gold, body: G.hull, white: G.white, glow: G.lamp } });
    // the twin helms' one canopy over both cores (the crystals each, shipkit/core.js); the capstan, a grating, the mount ring forward
    const hy = deckAt(H, GHELM.z) - 0.18; writeCore(M, { at: [0, hy, GHELM.z], r: GHELM.x + 0.9, frame: G.gold, crystals: false, ring: false, plate: 0.2, ribs: 8, apex: 2.6, k: 1.6 });
    capstan(M, { at: [0, deckAt(H, -11), -11], r: 0.6, col: G.wale, band: G.gold, bars: G.dark });
    { const y = deckAt(H, 7.5); M.box([0, y + 0.15, 7.5], [3.2, 0.3, 2.6], G.deck, PLANK); M.box([0, y + 0.32, 7.5], [3.3, 0.06, 2.7], G.gold, 0); }
    const gy = deckAt(H, 18.5); M.cyl([0, gy - 0.25, 18.5], [0, gy + 0.8, 18.5], 1.1, 0.95, 10, G.wale, 0); M.cyl([0, gy + 0.8, 18.5], [0, gy + 1.0, 18.5], 0.95, 0.55, 10, G.gold, 0);
    return { engines };
  },
};
{
  const masts = GM.map((g, i) => {
    const segs = g.segs.map((L, k) => ({ len: L, r0: [0.64, 0.4, 0.26][k], r1: [0.48, 0.3, 0.16][k], col: G.dark }));
    const y0 = deckAt(GALLEON_HULL, g.z);
    const yards = g.lateen ? [{ seg: 0, at: 0.78, w: 0, r: 0.2, col: G.gold, lateen: [7, 10, 0.55] }] : g.yards.map(([seg, a, w]) => ({ seg, at: a, w, r: 0.2, col: G.gold }));
    return { x: 0, z: g.z, y0, strike: 'top', collar: G.gold, cap: G.lamp, segs, yards };
  });
  const V = [];
  masts.forEach((M, mi) => M.yards.forEach((Y, j) => {
    if (Y.lateen) { V.push({ kind: 'lateen', mast: mi, yard: j, clewH: 4, clewZ: 8.5 }); return; }
    const h = at(M.segs, Y.seg, Y.at), below = j ? at(M.segs, M.yards[j - 1].seg, M.yards[j - 1].at) + 0.4 : 2.75;
    V.push({ kind: 'square', mast: mi, yard: j, drop: h - below, foot: j ? 1.18 : 1.08, lotus: mi === 1 && j === 0 });
  }));
  V.push({ kind: 'jib', mast: 0, head: 0.62, tack: gBow(0.9), clew: [0, deckAt(GALLEON_HULL, 21.5) + 3, 21], clewX: 1.5 }); // (the spritsail's place: from the bowsprit's end)
  GALLEON.rig = { masts, vanes: V };
}

// ------------------------------------------------------------------ the tanker
const K = { red: 0x8e3a24, below: 0x6e2a1a, deck: 0x5a4e44, house: 0xe6e0d0, grey: 0x5a5e66, yellow: 0xe8b923, glow: 0xffb347, dome: 0xb8b2a6, joint: 0x2a2c31, gold: 0xe8c060 };
const TANKER_HULL = {
  shape: [[0, -1], [0.82, -1], [1, -0.78], [1, 0.3], [1, 1]], camber: 0.08,
  stations: [[-28, 4.25, 2.75, 2.8], [-25, 4.65, 3.4, 2.6], [-17.5, 4.75, 3.5, 2.5], [17, 4.75, 3.5, 2.5], [23, 4.3, 3.3, 2.6], [26.25, 3.0, 2.75, 2.85, 0.25], [28, 1.4, 2.0, 3.1, 0.6]],
  strip: (i) => [[K.below, 0.1], [K.below, 0.1], [K.red, 0.1], [K.red, 0.1]][i], deck: [K.deck, PLANK], transom: [K.red, 0.1],
};
const HOUSE = { z0: -27.5, z1: -18.5, w: 7.0, h1: 3.0, z2: -21, w2: 6.4, h2: 2.8, z3: -24, w3: 9.5, h3: 2.4 }; // (three decks: the first's roof a ledge forward of the second; the bridge on the second, its wings out to the gunwales)
const houseY = () => deckAt(TANKER_HULL, -23) - 0.2;
const houseRoof = () => houseY() + HOUSE.h1 + HOUSE.h2 + HOUSE.h3;
const TANKER = {
  id: 'tanker', length: len('tanker'), beam: 9.5, draft: 3.5, scale: SCALE, panel: 4.6, plank: 0.32, dives: false, hull: TANKER_HULL, pennantScale: 3.2,
  engineGlow: K.glow, vane: { fill: 0xfff0d8, edge: K.glow, fillA: 0.3 },
  core: { crystal: 0xffffff, collar: K.joint, frame: K.grey, plate: 0.3, apex: 2.2, k: 1.6 },
  helm: [[0, houseRoof() - 0.14, -22.4]], gun: [0, deckAt(TANKER_HULL, 23.6) + 1.75, 23.6], pennant: { mast: 0 },
  crew: crewOn(TANKER_HULL, [[-3.9, -12], [3.9, -8], [-3.9, 1], [3.9, 9], [0, 0.75], [-3.9, 16], [2.5, -16]]).concat([[0, -19.7, houseY() + HOUSE.h1]]),
  write(M) {
    const H = TANKER_HULL; M.loft(H);
    railRuns(M, H, [[-27.7, 26.3]], { post: K.grey, cap: K.gold, every: 0.9 });
    taffrail(M, H, -27.7, { post: K.grey, cap: K.gold, every: 0.9 });
    rail(M, H, { z0: -17.8, z1: 24, col: K.grey, r: 0.09, n: 20, inset: 0.8, dy: 0.25 }); // (the double hull: its inner skin's rail)
    stripe(M, H, { z0: -27, z1: 26.5, y: 0.3, h: 0.25, col: K.yellow, n: 26 });
    // the house: three stepped decks, bridge wings, windows lit amber, a raked funnel on the second's after roof; stairs and ladders up it
    const y = houseY(), H0 = HOUSE, y2 = y + H0.h1, y3 = y2 + H0.h2;
    M.box([0, y + H0.h1 / 2, (H0.z0 + H0.z1) / 2], [H0.w, H0.h1, H0.z1 - H0.z0], K.house, 0.1, { cols: { top: K.deck } });
    M.box([0, y2 + H0.h2 / 2, (H0.z0 + H0.z2) / 2], [H0.w2, H0.h2, H0.z2 - H0.z0], K.house, 0.1, { cols: { top: K.deck } });
    M.box([0, y3 + H0.h3 / 2, (H0.z3 + H0.z2) / 2], [H0.w3, H0.h3, H0.z2 - H0.z3], K.house, 0.1, { cols: { top: K.grey } });
    const win = (x, yy, z, s, fx) => (fx ? M.quad([x, yy - 0.3, z - 0.45], [x, yy - 0.3, z + 0.45], [x, yy + 0.3, z + 0.45], [x, yy + 0.3, z - 0.45], K.glow, 0.4, [x - s, yy, z]) : M.quad([x - 0.45, yy - 0.3, z], [x + 0.45, yy - 0.3, z], [x + 0.45, yy + 0.3, z], [x - 0.45, yy + 0.3, z], K.glow, 0.4, [x, yy, z - s]));
    for (const s of [1, -1]) { for (let z = H0.z0 + 1; z < H0.z1 - 0.5; z += 1.6) win(s * (H0.w / 2 + 0.01), y + 1.7, z, s, true); for (let z = H0.z0 + 1; z < H0.z2 - 0.5; z += 1.6) win(s * (H0.w2 / 2 + 0.01), y2 + 1.5, z, s, true); }
    for (let x = -2.4; x <= 2.4; x += 1.6) win(x, y + 1.7, H0.z1 + 0.01, 1, false);
    const by = y3 + H0.h3 * 0.55; M.quad([-H0.w3 / 2, by - 0.35, H0.z2 + 0.02], [H0.w3 / 2, by - 0.35, H0.z2 + 0.02], [H0.w3 / 2, by + 0.35, H0.z2 + 0.02], [-H0.w3 / 2, by + 0.35, H0.z2 + 0.02], 0x9fd0ff, 0.3, [0, by, -24]); // (the bridge's windows)
    balustrade(M, [[-H0.w / 2 + 0.2, y2, H0.z1 + 0.2], [H0.w / 2 - 0.2, y2, H0.z1 + 0.2]], { post: K.grey, cap: K.gold, every: 0.9 }); // (the ledge's rail)
    for (const s of [1, -1]) {
      const yl = deckAt(H, -15) - 0.08 * 0.55, run = (y2 - yl) * 1.05;
      stairs(M, { x: s * 2.4, w: 1.2, z0: H0.z1 + run, z1: H0.z1 + 0.02, y0: yl, y1: y2, col: K.grey, gold: K.gold });
      ladder(M, { x: s * 3.0, z: H0.z2, y0: y2, y1: y3 + H0.h3, w: 0.6, face: [0, 1], col: K.joint });
    }
    const fz = -26.0, fy = y3; M.box([0, fy + 3.1, fz - 0.25], [2.1, 6.2, 1.7], K.grey, 0.1, { top: [0.9, 0.9], shift: [0, -0.9] }); M.box([0, fy + 5.0, fz - 0.75], [2.2, 0.6, 1.8], K.yellow, 0, { shift: [0, -0.1] });
    M.box([0, fy + 6.3, fz - 1.15], [1.8, 0.1, 1.4], K.glow, 0.5);
    // the hold: tank domes down the deck, each banded in the crude's glow
    for (const z of [19.5, 12, 4.5, -3, -10.5]) {
      const dy = deckAt(H, z) - 0.05, r = 3.1;
      for (let a = 0; a < 3; a++) { const y0 = Math.sin((a / 3) * Math.PI / 2) * r, y1 = Math.sin(((a + 1) / 3) * Math.PI / 2) * r, r0 = Math.cos((a / 3) * Math.PI / 2) * r, r1 = Math.cos(((a + 1) / 3) * Math.PI / 2) * r; M.cyl([0, dy + y0 * 0.75, z], [0, dy + y1 * 0.75, z], r0, Math.max(0.05, r1), 16, K.dome, 0.1, { caps: a === 2, phase: 0.13 }); }
      M.cyl([0, dy, z], [0, dy + 0.3, z], r + 0.15, r + 0.1, 16, K.glow, 0.45, { caps: false });
    }
    // the manifold midships: pipes across the deck, gantry posts, pipe runs along it, a raised catwalk with a ladder up to it
    const my = deckAt(H, 0.75);
    for (const dz of [-0.35, 0, 0.35]) M.cyl([-4.0, my + 1.0, 0.75 + dz], [4.0, my + 1.0, 0.75 + dz], 0.15, 0.15, 6, K.yellow, 0, { caps: true });
    for (const s of [1, -1]) M.box([s * 3.4, my + 0.75, 0.75], [0.25, 1.5, 1.3], K.grey, 0);
    for (const x of [-3.6, -3.1]) M.cyl([x, my + 0.35, -18], [x, my + 0.35, 24], 0.15, 0.15, 6, K.grey, 0, { caps: false });
    M.box([3.6, my + 1.8, 2.5], [0.8, 0.1, 41], K.grey, 0); for (let z = -17.5; z < 23.5; z += 5) { M.box([3.6, my + 0.9, z], [0.15, 1.8, 0.15], K.grey, 0); }
    for (const x of [3.22, 3.98]) M.cyl([x, my + 2.8, -18], [x, my + 2.8, 23], 0.04, 0.04, 4, K.gold, 0, { caps: false, smooth: false }); // (the catwalk's handrails)
    for (let z = -17.5; z < 23.5; z += 2.5) for (const x of [3.22, 3.98]) M.cyl([x, my + 1.85, z], [x, my + 2.8, z], 0.035, 0.035, 4, K.grey, 0, { caps: false, smooth: false });
    ladder(M, { x: 3.6, z: -18.2, y0: my, y1: my + 1.8, w: 0.6, face: [0, -1], col: K.joint });
    // the bulb under the bow, the bow's small mast and its lamp, the radar mast's slot
    M.gem([0, -2.1, 27.5], 1.3, 3.0, 2.25, 8, K.glow, 0.5, { axis: [0, 0, 1] });
    const bmy = deckAt(H, 25); M.cyl([0, bmy, 25], [0, bmy + 3.75, 25], 0.17, 0.12, 6, K.yellow, 0); M.gem([0, bmy + 4.0, 25], 0.25, 0.4, 0.2, 6, K.glow, 0.55);
    const gy = deckAt(H, 23.6); M.cyl([0, gy - 0.25, 23.6], [0, gy + 0.8, 23.6], 1.1, 0.95, 10, K.joint, 0); M.cyl([0, gy + 0.8, 23.6], [0, gy + 1.0, 23.6], 0.95, 0.55, 10, K.yellow, 0);
    slot(M, { y: deckAt(H, -17.0), z: -17.0, w: 1.5, d: 1.5 });
    // the stern: a carved transom over the rudder between the two nozzles; the figurehead: a teardrop of Lachryma in two gold hands
    gallery(M, { z: -28, y0: 1.15, w: 7.0, tiers: 1, h: 1.5, rows: 5, col: K.below, frame: K.gold, glass: K.glow, gold: K.gold });
    rudder(M, { z: -27.95, yTop: 1.0, yBot: -2.7, chord: 2.6, t: 0.45, col: K.below, gold: K.gold, inlay: K.yellow });
    const engines = [1, -1].map((s) => pod(M, { x: s * 2.2, y: -0.6, z0: -29.25, z1: -26.75, r0: 1.3, r1: 1.2, sides: 10, body: K.grey, band: K.yellow, nozzle: K.glow }));
    figurehead(M, 'drop', { at: [0, 1.3, 28.3], lean: 0.8, k: 1.1, cols: { gold: K.gold, glow: K.glow } });
    return { engines };
  },
};
TANKER.rig = {
  masts: [{ x: 0, z: -17.0, y0: deckAt(TANKER_HULL, -17.0), stub: 0.25, collar: K.joint, cap: K.glow, segs: [{ len: 4.75, r0: 0.3, r1: 0.26, col: K.yellow }, { len: 4.5, r0: 0.22, r1: 0.13, col: K.yellow }],
    yards: [{ seg: 1, at: 0.6, w: 3.0, r: 0.12, col: K.grey }] }],
  vanes: [{ kind: 'square', mast: 0, yard: 0, drop: 1.6, foot: 0.9 }], // (the radar's vane)
  hatches: [{ mast: 0, w: 1.5, d: 1.5, col: K.grey, seam: K.glow }],
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
