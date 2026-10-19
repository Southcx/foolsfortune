// ---------------------------------------------------------------------------------------
// THE PSYGUN VARIANTS' EFFECTS: the library's entries (vfx/library.js spreads them in) for how the five psyguns fight
// (tools/psygun/variantplay.js plays the first two by name; vfx/flarereveal.js the third), on the shared pools, the decal and the lamps
// the light budget lends. Data only: the numbers are the look (Calissa's board v10, figures 02 and 04; OVERLAY.md 19).
//   psygun.flare      the Bombardier's plain shot landing (`pos`): a red-gold star that burns (a soft flicker, never a strobe), a lamp
//                     that pools warm light on the sand for its 8 s and goes out over the last 0.6, smoke and sparks rising off it, and
//                     the reveal's reach laid on the sand as a faint ring at 6 m (12 m across) that fades with the light
//   psygun.pentacle   the Pentagun's fifth point (`pos`, where it was aimed): the pentacle drawn on the ground 4 m round (8 m across) in
//                     the System's light, each of its five points rising as its damage type's own hit (Impact a star, Ego a hexagon,
//                     Influence a petal, Illusion a curl, Delirium a drip: the library's `damage.<type>`, in types.js's order from the top
//                     clockwise) with a ray up in that type's colour, then the burst at its heart at 0.5 real s; it holds 1.5 s and fades
//   psygun.reveal     held at the feet of a creature a flare revealed (`follow`: while `c.revealed`): a ring of the flare's light on the
//                     ground under it and the MARK's sign over it, seen through walls (`throughWalls`). A world mark: no words
//
// Prior art: the flare pistol's star (a magnesium flare's burn and smoke), Ratchet & Clank's Pyrocitor and its warm ground light; the
// pentacle drawn in one stroke through its five points (the pentagram's construction), Persona's elemental colours; the MARK shell's
// own sign (psyguncylindermodel.js) for what is marked, as Far Cry's tagged enemies.
// ---------------------------------------------------------------------------------------

const FLARE = 0xff5a36, EMBER = 0xffb04a, SMOKE = 0x8a7a72; // (the flare's star, its gold, its smoke)
const PENT = 5, PR = 4; // (the pentacle's points, and its radius in m: kinds.js `play.pentacle.radius`)
const TYPES = [['impact', 0xe9c46a], ['ego', 0x7f9cff], ['influence', 0xf2a0b8], ['illusion', 0x9ad8f0], ['delirium', 0xc458d0]]; // (types.js's order; the board's colours)
const point = (k) => { const a = -Math.PI / 2 + (k * Math.PI * 2) / PENT; return [Math.cos(a) * PR, Math.sin(a) * PR]; }; // (x, z on the ground: the star's points)
const STROKE = [0, 2, 4, 1, 3]; // (the order the one stroke reaches them)

export const PSYGUN_VARIANT_EFFECTS = {
  'psygun.flare': { layers: [
    { type: 'sprites', count: 1, shape: 'core', size: 1.6, sizeEnd: 0.5, life: 0.25, color: 'white', colorEnd: FLARE, powerCount: false },
    { type: 'sprites', count: 1, shape: 'star4', size: 1.4, sizeEnd: 0.3, life: 0.3, color: EMBER, colorEnd: FLARE, grow: 40 },
    { type: 'sprites', count: [14, 18], shape: 'streak', dir: 'cone', axis: 'up', cone: 70, speed: [3, 7], size: [0.08, 0.14], sizeEnd: 0.02, life: [0.3, 0.6], gravity: 9, stretch: 1.6, color: EMBER, colorEnd: FLARE },
    // the burn: a star held on the ground for its life, its glow breathing slowly (a rate of motes, not a beat: no flicker)
    { type: 'sprites', rate: 10, dur: 7.4, shape: 'core', spawn: 'sphere', r: 0.08, offset: [0, 0.15, 0], size: [0.55, 0.75], sizeEnd: 0.3, life: [0.25, 0.4], color: FLARE, colorEnd: EMBER },
    { type: 'sprites', rate: 6, dur: 7.4, shape: 'star4', offset: [0, 0.2, 0], size: [0.4, 0.6], sizeEnd: 0.1, life: [0.3, 0.45], color: 'white', colorEnd: EMBER },
    { type: 'sprites', rate: 9, dur: 7.6, shape: 'glint', spawn: 'sphere', r: 0.15, dir: 'cone', axis: 'up', cone: 40, speed: [0.8, 2], size: [0.08, 0.14], sizeEnd: 0, life: [0.4, 0.8], gravity: 2, color: [EMBER, 'white'], twinkle: 12 },
    { type: 'sprites', pool: 'alpha', rate: 4, dur: 7.8, shape: 'puff', spawn: 'disc', r: 0.15, dir: 'up', speed: [0.5, 0.9], size: [0.35, 0.5], sizeEnd: 1.4, life: [1.6, 2.2], drag: 0.6, gravity: -0.25, color: SMOKE, alpha: 0.4, alphaEnd: 0, spin: [-0.6, 0.6] },
    // the light it pools on the sand, out over its last 0.6 s (the light budget lends the lamp)
    { type: 'light', color: FLARE, range: 9, k: 26, dur: 8, hold: 0.925, up: 0.6 },
    // the reveal's reach: a faint ring at 6 m, whole when it lands, gone with the light
    { type: 'decal', tex: 'shockring', dur: 8, scale: [[0, 2], [0.04, 12], [1, 12]], k: [[0, 0], [0.03, 0.9], [0.92, 0.6], [1, 0]], tint: FLARE, glow: 0.9, offset: [0, 0.05, 0] },
    { type: 'decal', tex: 'scorch', blend: 'darken', dur: 8, scale: [[0, 0.6], [0.02, 1.4], [1, 1.4]], k: [[0, 0], [0.02, 1], [0.8, 1], [1, 0]], tint: 0xc8b8a8, glow: 0.9, offset: [0, 0.04, 0] },
  ] },

  'psygun.pentacle': { layers: [
    // the star drawn in one stroke, then its circle; and a dark band under it so the light reads on the Dunes' white sand
    { type: 'decal', tex: 'pentacle', blend: 'darken', dur: 2.0, scale: 8.4, k: [[0, 0], [0.12, 0.8], [0.75, 0.8], [1, 0]], tint: 0x9a968e, glow: 0.85, offset: [0, 0.05, 0] },
    { type: 'decal', tex: 'pentacle', dur: 2.0, scale: 8.4, k: [[0, 0], [0.1, 1.6], [0.25, 1.2], [0.75, 1], [1, 0]], tint: 'white', labradorite: 0.85, glow: 1.5, offset: [0, 0.07, 0], spin: 0.08 },
    { type: 'decal', tex: 'shockring', dur: 1.0, at: 0.5, scale: [[0, 1], [1, 9]], k: [[0, 1.4], [0.5, 0.8], [1, 0]], tint: 'white', labradorite: 0.9, glow: 1.5, offset: [0, 0.08, 0] },
    // each point as the stroke reaches it: its type's hit and a ray up in its colour; at 0.5 s the burst at the heart
    ...STROKE.flatMap((k, j) => { const [x, z] = point(k), [type, col] = TYPES[k]; return [
      { type: 'fx', fx: `damage.${type}`, at: 0.07 * j, offset: [x, 0.4, z] },
      { type: 'sprites', count: [6, 8], shape: 'streak', at: 0.45, offset: [x, 0.1, z], dir: 'cone', axis: 'up', cone: 4, speed: [10, 16], size: [0.16, 0.24], sizeEnd: 0.05, life: [0.35, 0.5], stretch: 2.4, color: col, colorEnd: 'white' },
      { type: 'sprites', count: 1, shape: 'star4', at: 0.07 * j, offset: [x, 0.3, z], size: 0.9, sizeEnd: 0.2, life: 0.4, color: col, colorEnd: 'white' },
    ]; }),
    { type: 'sprites', count: 1, shape: 'core', at: 0.5, offset: [0, 0.8, 0], size: 3.2, sizeEnd: 0.6, life: 0.35, color: 'white', colorEnd: 'labradorite', powerCount: false },
    { type: 'sprites', count: [20, 26], shape: 'sparkle', at: 0.5, spawn: 'sphere', r: 1.6, offset: [0, 0.8, 0], dir: 'out', speed: [2, 5], size: [0.2, 0.34], sizeEnd: 0, life: [0.5, 0.8], drag: 2, color: TYPES.map((t) => t[1]), twinkle: 16 },
    { type: 'light', color: 0xd8c8ff, range: 10, k: 34, dur: 0.9, up: 1, at: 0.5 },
    { type: 'shake', k: 0.25, at: 0.5 },
  ] },

  'psygun.reveal': { layers: [
    { type: 'decal', tex: 'shockring', dur: Infinity, scale: 1.6, tint: FLARE, glow: 1.3, offset: [0, 0.06, 0], in: 8, out: 1.6 },
    { type: 'decal', tex: 'markstar', dur: Infinity, face: 'camera', scale: 0.5, tint: EMBER, glow: 1.5, offset: [0, 2.1, 0], spin: 0.6, in: 8, out: 1.6 },
    { type: 'sprites', rate: 3, dur: Infinity, shape: 'glint', spawn: 'ring', r: 0.7, offset: [0, 0.1, 0], dir: 'up', speed: [0.4, 0.8], size: [0.1, 0.16], sizeEnd: 0, life: [0.5, 0.8], color: [FLARE, EMBER], twinkle: 10 },
  ] },
};
