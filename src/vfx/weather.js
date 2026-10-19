// ---------------------------------------------------------------------------------------
// THE WEATHER'S LOOK: what the emotional weather and the hour look like (docs/plans/WEATHER.md; the rules are progress/weather.js,
// `game.weather`, Dovina's). Weather is a place's mood falling as Lachryma, and each of the five wears the colour and the motif of
// the damage type it feeds (docs/ART.md, section 2), so a weather and a status read as kin:
//
//   MIRTH   the fox's wedding: a sunshower, gold drops, fewer and slower, through warm light; a RAINBOW opposite the sun (Impact's bone
//           and gold)
//   WONDER  by day DIAMOND DUST, hexagonal ice glinting as it sinks, and the 22-degree HALO with its SUN DOGS (real halos are made by
//           hexagonal ice: the lawful lattice twice over); by night the AURORA, slow curtains from lapis to the labradorite's green
//           (Ego's lapis and hexagons)
//   DESIRE  the wanting wind: amber-rose dust streaming along the wind and a haze closing the horizon; no heat shimmer, ever (it wobbles
//           at a varying rate: the flicker rule) (Influence's rose and warm gold)
//   GRIEF   the long rain: steady, long, silver, the sky grey and drained (Illusion's labradorite, in the drops' sheen)
//   DREAD   the pall: a bruise-coloured haze, ink and violet-green, and thunder far off as FAR BOLTS, each held a beat and fading
//           over a second and a half, with a slow glow in the cloud behind; never a flash on the screen (Delirium's ink and green)
//   GALL    the miasma (docs/plans/GALL-AND-FURY.md): a low sour fog lying in the hollows and thin on the crests (lenses of it on the
//           ground, flat-topped as valley fog is), Gall's violet greyed toward bile; FLIES in a few loose clouds low over the sand;
//           a CURDLED FILM on still water and Lachryma, the oil film's colours gone sour (vfx/water.js `SOUR_U`); a low flat sky with a
//           bruise at the horizon (Ego's, as Wonder: but rot, never the hexagon)
//   FURY    the hail: hard white pellets falling fast and nearly straight, each BOUNCING once and lying as a thin white SCATTER that
//           melts, POCKING still water with small hard rings (the ripple tank, `game.water.disturb`); a hard, bright overcast in the
//           cumulonimbus's grey-green, a red edge at the horizon (Fury's). No thunder until it runs heavy (below)
// What falls is in the world, never on the screen: long thin streaks and motes in a column round the eye, each along its own path
// (the sixth generation's rain: lines wrapped round the camera), so nothing swims or flickers. Since R46 (the owner: "toned down in
// number and presence ... higher in the sky ... noise modulation befitting their travel path"): fewer; most of it high, only a sparse
// few near the ground; none within a few metres of the eye, under a roof or below the ground (vfx/overhead.js); and each path
// wanders on a curl noise, the streak bending along it.
// Only an OPEN place gets it (`game.weather.here(pos).exposure`): a roofed room keeps its own light, a Well its own sky.
//
// THE HEAVY LOOK (`LOOK[aspect].heavy`, `heavyOf`; the owner, 2026-10-11: "much more impressive visually"; docs/plans/
// FEELINGS-AWAKENING.md section 3): what a weather's look leans to as its spell runs heavy (strength 0.65 to 1), each with its own
// big gesture in its feeling's colour and paint motif. WONDER's aurora fills the sky (by night all round and up to 58 degrees; by
// day too, faint, the sky deepened to lapis to hold it), the halo and sun dogs bright, the diamond dust thick (frost). MIRTH's
// confetti of light: gold motes in a storm, each its own shade and catching the sun, under a DOUBLE bow (the secondary bow at 51
// degrees, its colours reversed, as a real one is) (dots). DESIRE's wanting wind turned dust storm: the streaks long and rippling,
// the dust thick, the haze closing the horizon in amber-rose (ripples). GRIEF's rain heavy, in SHEETS: curtains of it, denser and
// thinner in turn, sweeping on with the wind, slanting, the near rain too, pocking the still water (streaks). DREAD's sky darkens
// and presses down: near black-green, the cloud closed, ash sinking, an ink fog lying low, and the cloud lit from inside more often
// and lower (marbling). FURY's bolts close and many: the hailstorm's own lightning, white-hot ribbons forked, 55 to 170 metres off,
// one every second or so, a red glow in the cloud behind each (cracks). GALL's miasma rises: the fog lenses more and to the chest,
// the flies in swarms, the bruise deeper (curds). None of it is a flash on the screen: a bolt is a thing in the world, held a beat.
// The awakening (vfx/awakeninglook.js) borrows these looks round the Courier, and raises this one (`surge`) where the place is open.
//
// THE HOUR: three paintings (vfx/sky.js `grade`): the maker's is DUSK, untouched at its hour; the owner's DAY (clouds and floating
// soap bubbles) and NIGHT (violet and green swirls over a dark crown) are blended in by the hour; dawn is the dusk painting turned rose. The light ON the scene (the
// sun, the fog) is Petra's (render/daylight.js): `fogOf(aspect, strength)` and `look.lift` are what this module offers it.
//
// Prior art: the sixth generation's camera-wrapped rain (Wind Waker, Metal Gear Solid 2's tanker deck), real atmospheric optics (the
// 22-degree halo and parhelia from hexagonal plate crystals, the primary bow at 42 degrees round the antisolar point, the secondary
// at 51 with its colours reversed, diamond dust), Breath of the Wild's lightning (a bolt seen far off before its thunder), Okami's
// painted skies graded by the hour, and Journey's weather as feeling. The miasma: Silent Hill's and Dark Souls' Blighttown's sulphurous low fogs, Pathologic's plague miasma, and
// valley fog's flat top (the cold air pooling in the hollows); its lenses are soft point sprites faded by their area and at the
// screen's edge (the sixth generation's fog cards, with the soft-particle problem met by sitting each one on the ground). The hail:
// real hailstorms (the cumulonimbus's grey-green light; a stone's one bounce and its white scatter melting on warm ground) and Breath
// of the Wild's weather readability (each weather known at a glance by what it does, not only by its colour). The heavy looks:
// Okami's brush gods each flooding the screen with their own weather, Journey's sandstorm and snow (the set piece as the reward),
// real squall lines (rain arriving in curtains), a supercell's hail and lightning together, and a haboob's wall of dust.
//
//   game.weatherLook = new WeatherLook(game)   .update(dt, camera)   .force({ aspect, strength, phase, light } | null) (tests, the workbench)
//   An AGATE sky (two feelings: `second`, `secondStrength` from the rules): the first falls; the second colours the sky, the clouds and
//   what falls, and may raise its own mark (an aurora under a pall: awe). Opposites cancel in the rules, so there is nothing to draw.
//   .shoreline({ center, angle, half, r })   the mood ends at the waterline (vfx/shore.js tells it)
//   .surge(aspect, k) (the awakening: that weather raised to k at once while it asks; surge(null) hands it back)
//   .prewarm() (made and shown for the boot's warm-up; returns what hides it)   .lift (0 .. 0.1: a far bolt's light, for daylight.js to add)   LOOK[aspect]   hourGrade(phase)   fogOf(aspect, strength)
//   heavyOf(k)   lightOf(aspect, strength)   fallsOf(aspect, k, dayK, wind) -> { rain, motes, mist, hail, pock }   makeRain(n, occ)  makeMotes(n, occ)  rainTo / motesTo / mistTo(piece, spec, colour)
//   (the falling pieces and what each weather asks of them: the awakening's flood makes its own set of the same pieces)
//   Every look shares two falling programs: the streaks (one LineSegments) and the motes (Points, a mode each: drift, flies, hail,
//   fog lens), the miasma's lenses a second instance of the motes' very source (three caches a program by its source: no new one).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Overhead, OVERHEAD_GLSL } from './overhead.js';
import { COLOR } from '../progress/weather.js';
import { SOUR_U } from './water.js';

const C = (hex) => new THREE.Color(hex);
/** The feelings' colours: the game's one table (progress/weather.js COLOR, Dovina's; ruled the one table 2026-10-08, SOUL-ALCHEMY.md), re-exported
 *  here so the looks that import it from vfx/weather.js keep their import. */
export { COLOR };
/** Each weather's look: its colour, what falls (and how), its mark, what it does to the sky's grade and the fog, and its HEAVY look
 *  (what each of those leans to as the spell runs heavy: a key there overrides the look's own, eased in by `heavyOf`; `motes` and `mist`
 *  a field of its own over the fall: Mirth's confetti, Dread's ash and ink fog; `marks` the sky marks' gains; `bolts` the thunder). */
export const LOOK = {
  mirth:  { colour: C(COLOR.mirth), clouds: { cover: 0.62 },  fall: { kind: 'rain', rate: 0.3, speed: 6, len: 0.7, alpha: 0.55, vel: [0.12, -1, 0.05] }, mark: 'rainbow',
            sky: { expo: 1.08, mul: [1.06, 1.0, 0.9] }, fog: C(0xe8cf9e), fogD: 0.9,
            heavy: { fall: { rate: 0.8, speed: 5, len: 0.9, alpha: 0.7, lowK: 0.4 }, sky: { expo: 1.16, mul: [1.1, 1.02, 0.84] }, clouds: { cover: 0.68 }, fogD: 0.7,
              motes: { n: 2600, size: 0.2, alpha: 1, vel: [0.3, -1.4, 0.15], noise: 2.6, lowK: 0.7, hex: 2, hue: 1, colour: C(0xe6a51e) }, marks: { bow: 0.45, bow2: 0.22 } } },
  wonder: { colour: C(COLOR.wonder), clouds: { cover: 0.6, opacity: 0.6 },  fall: { kind: 'diamond', rate: 0.6, speed: 0.35 }, mark: 'halo', night: 'aurora',
            sky: { expo: 1.02, mul: [0.93, 0.99, 1.1] }, fog: C(0xb8c8e8), fogD: 0.8,
            heavy: { fall: { rate: 2.2, speed: 0.5, size: 0.08 }, sky: { expo: 0.78, mul: [0.68, 0.86, 1.3] }, clouds: { cover: 0.74, opacity: 0.45 }, fogD: 0.55,
              marks: { halo: 0.55, dogs: 1, aurora: 0.95, auroraDay: 0.85, tall: 3.2 } } },
  desire: { colour: C(COLOR.desire), tone: 0.7, clouds: { cover: 0.56, opacity: 0.6 },  fall: { kind: 'sirocco', rate: 1, speed: 9, len: 3, alpha: 0.55, vel: [1, 0.04, 0.35] },
            sky: { expo: 0.95, mul: [1.08, 0.94, 0.86], haze: C(0xc98a62), hazeK: 0.85 }, fog: C(0xc48a66), fogD: 2.2,
            heavy: { fall: { rate: 2, speed: 14, len: 4, alpha: 0.7, noise: 2.6, lowK: 0.6, size: 0.16 }, sky: { expo: 0.8, mul: [1.14, 0.88, 0.74], haze: C(0xb8684a), hazeK: 1 },
              clouds: { cover: 0.42, opacity: 0.8 }, fog: C(0xb8704e), fogD: 3.8 } },
  grief:  { colour: C(COLOR.grief), clouds: { cover: 0.32, opacity: 0.95 },  fall: { kind: 'rain', rate: 1, speed: 13, len: 1.5, alpha: 0.45, vel: [0.12, -1, 0.05] },
            sky: { expo: 0.78, mul: [0.92, 0.96, 1.04], desat: 0.65 }, fog: C(0x7c858e), fogD: 1.6,
            heavy: { fall: { rate: 2, speed: 19, len: 2.6, alpha: 0.8, vel: [0.34, -1, 0.15], sheet: 1, lowK: 0.7, pock: 24 }, sky: { expo: 0.38, mul: [0.86, 0.9, 1.0], desat: 0.85 },
              clouds: { cover: 0.16, opacity: 1 }, fog: C(0x5a626b), fogD: 3.6 } },
  dread:  { colour: C(COLOR.dread), clouds: { cover: 0.28, opacity: 0.95 },  fall: null, mark: 'bolts',
            sky: { expo: 0.55, mul: [0.8, 0.86, 0.8], desat: 0.35, haze: C(0x26302a), hazeK: 0.75 }, fog: C(0x24302a), fogD: 2.6,
            bolts: { every: [6, 16], dist: [260, 330], scale: [1, 1], colour: C(0xd8e8c8), glow: C(0x736699), glowR: 1, glowY: 110, glowA: 0.35, boltA: 0.85 },
            heavy: { sky: { expo: 0.12, mul: [0.72, 0.8, 0.74], desat: 0.5, haze: C(0x111a16), hazeK: 1 }, clouds: { cover: 0.08, opacity: 1 }, fog: C(0x141c18), fogD: 4.2,
              motes: { n: 900, size: 0.11, alpha: 0.75, vel: [0.05, -0.55, 0.02], noise: 1.2, lowK: 0.6, colour: C(0x2a1f36) },
              mist: { n: 360, size: 16, rise: 1.2, alpha: 0.7, colour: C(0x24302a) },
              bolts: { every: [2.5, 6], dist: [190, 280], glowR: 1.3, glowY: 60, glowA: 0.45, boltA: 0.6 } } },
  // (the miasma's fall is its fog lenses and its flies; `mist` the lenses' colour, Gall's violet greyed toward bile; `fly` the flies')
  gall:   { colour: C(COLOR.gall), clouds: { cover: 0.24, opacity: 0.97 },  fall: { kind: 'miasma', rate: 1, flies: 96, lenses: 440 }, mist: C(0x7e6e88), fly: C(0x140f16),
            sky: { expo: 0.62, mul: [1.0, 0.97, 0.84], desat: 0.5, haze: C(0x4c3452), hazeK: 0.8 }, fog: C(0x7a6c7c), fogD: 2.4,
            heavy: { fall: { flies: 700, lenses: 700, rise: 1.4, lensSize: 16, lensA: 0.95, flySize: 0.065 }, sky: { expo: 0.4, haze: C(0x3e2446), hazeK: 1 },
              clouds: { cover: 0.12, opacity: 1 }, fogD: 3.4 } },
  // (the hail falls white whatever its feeling: `fall.colour`; the red is the sky's edge, never the stones)
  fury:   { colour: C(COLOR.fury), clouds: { cover: 0.26, opacity: 0.97 },  fall: { kind: 'hail', rate: 1, speed: 26, len: 0.2, alpha: 1, vel: [0.05, -1, 0.02], noise: 0.1, lowK: 0.7, colour: C(0xeef6ff), scatter: 2000, pock: 36 },
            sky: { expo: 0.86, mul: [0.88, 0.98, 0.9], desat: 0.5, haze: C(0x8a1a24), hazeK: 0.7 }, fog: C(0x8c968c), fogD: 1.4,
            heavy: { fall: { rate: 1.6, speed: 32, pock: 70 }, sky: { expo: 0.5, desat: 0.55, haze: C(0xa0141e), hazeK: 1 }, clouds: { cover: 0.12, opacity: 1 }, fogD: 2,
              bolts: { every: [0.45, 1.6], dist: [55, 170], scale: [0.45, 0.8], colour: C(0xfff2ea), glow: C(0x9a1e18), glowR: 0.45, glowY: 50, glowA: 0.5, boltA: 0.95, ahead: 0.7 } } },
};
const ASPECTS = Object.keys(LOOK);
/** How heavy a spell's look runs at amount k (0..1): nothing to 0.65, all of it at 1. */
export const heavyOf = (k) => THREE.MathUtils.smoothstep(k, 0.65, 1);
const mixv = (a, b, t) => (b === undefined ? a : a + (b - a) * t); // (a look's own number, leaning to its heavy one if it has one)

/** The hour's grade: the owner's day and night paintings blended in over the maker's dusk, and a little light on each. Keys by the hour
 *  of the day, blended round the clock; dawn is the dusk painting turned rose (it is the same light, the other way round). */
const HOURS = [
  [0, { night: 1, expo: 0.55, desat: 0.15, mul: [1.04, 0.94, 1.08] }], // (the night leans plum: the owner's playlist, sad but bright)
  [4.5, { night: 1, expo: 0.55, desat: 0.15, mul: [1.04, 0.94, 1.08] }],
  [6, { expo: 0.9, mul: [1.0, 0.86, 0.94], stars: 0.6 }],
  [8, { day: 1, expo: 1.0 }],
  [16.5, { day: 1, expo: 1.0 }],
  [17.75, { day: 0.6, expo: 1.0, mul: [1.07, 0.92, 0.84] }], // (the golden hour on the way to dusk: peach, the playlist's pastel over the shadow)
  [19, { expo: 1, stars: 1 }], // (dusk: the maker's own)
  [21, { night: 1, expo: 0.55, desat: 0.15, mul: [1.04, 0.94, 1.08] }],
  [24, { night: 1, expo: 0.55, desat: 0.15, mul: [1.04, 0.94, 1.08] }],
];
const lerp = THREE.MathUtils.lerp, smooth = THREE.MathUtils.smoothstep;
/** The hour's grade (phase 0..1 through the day), as numbers for sky.grade. */
export function hourGrade(phase, out = { mul: [1, 1, 1], haze: [0, 0, 0] }) { // (out: a grade to write into, so a caller each frame makes nothing)
  const h = ((phase % 1) + 1) % 1 * 24;
  let i = 0; while (i < HOURS.length - 2 && HOURS[i + 1][0] <= h) i++;
  const [h0, a] = HOURS[i], [h1, b] = HOURS[i + 1], k = smooth(h, h0, h1);
  const v = (x, y, d) => lerp(x ?? d, y ?? d, k);
  out.day = v(a.day, b.day, 0); out.night = v(a.night, b.night, 0); out.expo = v(a.expo, b.expo, 1); out.stars = v(a.stars, b.stars, 1); out.desat = v(a.desat, b.desat, 0); out.hazeK = 0;
  for (let j = 0; j < 3; j++) { out.mul[j] = lerp(a.mul ? a.mul[j] : 1, b.mul ? b.mul[j] : 1, k); out.haze[j] = 0; }
  return out; // (the night held a little below the painting's full cry: it is night, not a rave)
}
/** The fog a weather asks for (render/daylight.js lays it on the scene's): its colour and a multiplier on the density; a heavy spell's
 *  closes in further (and darker, for the pall). */
export function fogOf(aspect, strength = 1) {
  const L = LOOK[aspect]; if (!L) return null;
  const hv = heavyOf(strength), H = L.heavy || {}, colour = H.fog && hv > 0 ? _fog.copy(L.fog).lerp(H.fog, hv) : L.fog;
  return { colour, density: lerp(1, mixv(L.fogD, H.fogD, hv), strength), k: strength };
}
/** How a weather dims the light on the scene at a strength (its sky's exposure, a heavy spell's darker): what render/daylight.js may
 *  read in place of `LOOK[aspect].sky.expo` (a handoff to Petra, docs/handoffs/petra/). */
export const lightOf = (aspect, strength = 1) => { const L = LOOK[aspect]; return L ? lerp(1, mixv(L.sky.expo ?? 1, L.heavy?.sky?.expo, heavyOf(strength)), strength) : 1; };
/** The sky a weather asks for at heaviness hv (written into one object: read it before the next call). */
function skyOf(a, hv) {
  const S = LOOK[a].sky, H = LOOK[a].heavy?.sky || {}, o = _sky;
  o.expo = mixv(S.expo ?? 1, H.expo, hv); o.desat = mixv(S.desat || 0, H.desat, hv); o.hazeK = mixv(S.haze ? S.hazeK : 0, H.hazeK, hv);
  for (let i = 0; i < 3; i++) o.mul[i] = mixv(S.mul ? S.mul[i] : 1, H.mul?.[i], hv);
  const h0 = S.haze || H.haze; o.hasHaze = !!h0;
  if (h0) { o.haze.copy(h0); if (S.haze && H.haze) o.haze.lerp(H.haze, hv); }
  return o;
}

/** What falls for a weather at amount k (0..1), its heavy look eased in: the streaks (`rain`), the mote field (`motes`), the fog lenses
 *  (`mist`), each a spec its piece takes (rainTo, motesTo, mistTo) or null, with `a` its amount (the strongest weather's way of
 *  falling wins a piece); `hail` how much stone lands, `pock` rings a second on still water. `dayK` 0 at night .. 1 by day; `wind`
 *  the dunes' wind (a Vector2) or null. Written into objects of this module's own: use the result before the next call. */
export function fallsOf(a, k, dayK = 1, wind = null) {
  const L = LOOK[a], F = L.fall, H = L.heavy || {}, HF = H.fall || {}, hv = heavyOf(k), out = _falls;
  out.rain = out.motes = out.mist = null; out.hail = 0; out.pock = 0; out.hv = hv;
  const v = (key, d) => mixv(F?.[key] ?? d, HF[key], hv);
  if (F?.vel) { // (streaks: rain falling, hail, or sand blown along the ground)
    const R = _rs, sp = v('speed', 10);
    R.a = k; R.colour = F.colour || null; R.lit = F.kind === 'hail';
    R.n = 2000 * v('rate', 1) * k; R.len = v('len', 1); R.alpha = v('alpha', 0.5) * k; R.sheet = v('sheet', 0);
    R.noise = v('noise', F.kind === 'sirocco' ? 1.2 : 0.6); R.lowK = v('lowK', F.kind === 'sirocco' ? 0.3 : 0.18); // (the sirocco streams along the ground: more of it low; the hail falls nearly straight, most of it to the ground)
    for (let i = 0; i < 3; i++) R.vel[i] = mixv(F.vel[i], HF.vel?.[i], hv);
    if (wind && F.kind === 'sirocco') { R.vel[0] = wind.x; R.vel[2] = wind.y; } // (the wanting wind blows the way the dunes' wind does)
    for (let i = 0; i < 3; i++) R.vel[i] *= sp;
    out.rain = R;
  }
  if (F && F.kind !== 'rain') { // (the motes of the fall itself)
    const M = _ms; M.lit = false; M.colour = null; M.raw = false; M.hue = 0; M.hex = 0;
    if (F.kind === 'miasma') { // (the flies: dark whatever the agate, a few dozen in nine loose clouds; in swarms when heavy)
      M.mode = 1; M.colour = L.fly; M.raw = true; M.size = v('flySize', 0.05); M.alpha = 0.9 * k; M.n = v('flies', 96) * k; M.a = k;
    } else if (F.kind === 'hail') { // (the stones landing, bouncing once and lying white till they melt)
      M.mode = 2; M.colour = F.colour; M.lit = true; M.size = 0.075; M.alpha = 0.85 * k; M.n = F.scatter * k; M.a = k;
    } else { // (dust and diamond dust on the wind's eddies; diamond dust by day, and when heavy by night too, lit by the aurora)
      const diamond = F.kind === 'diamond', dk = diamond ? k * Math.max(dayK, 0.75 * hv) : k, sp = v('speed', 1);
      M.mode = 0; M.hex = diamond ? 1 : 0; M.size = v('size', diamond ? 0.05 : 0.12);
      M.vel[0] = diamond ? 0.05 : sp; M.vel[1] = diamond ? -sp : 0.3; M.vel[2] = diamond ? 0 : sp * 0.3;
      M.alpha = (diamond ? 0.8 : 0.6) * dk; M.noise = diamond ? 1.0 : mixv(2.0, HF.noise, hv); M.lowK = diamond ? mixv(0.2, 0.45, hv) : v('lowK', 0.3);
      M.n = 800 * v('rate', 1) * dk; M.a = dk; // (the drift as it was: 800 at most, till it runs heavy)
    }
    out.motes = M;
  }
  if (H.motes && hv > 0 && (!out.motes || k * hv > out.motes.a)) { // (a heavy look's own field: Mirth's confetti of light, Dread's sinking ash)
    const X = H.motes, M = _xs;
    M.mode = 0; M.lit = false; M.raw = !!X.colour; M.colour = X.colour || null; M.hex = X.hex ?? 0; M.hue = X.hue ?? 0; M.size = X.size;
    M.vel[0] = X.vel[0]; M.vel[1] = X.vel[1]; M.vel[2] = X.vel[2]; M.alpha = X.alpha * k * hv; M.noise = X.noise; M.lowK = X.lowK;
    M.n = X.n * k * hv; M.a = k * hv;
    out.motes = M;
  }
  if (F?.lenses || (H.mist && hv > 0)) { // (the low fog: the miasma's lenses, or the pall's ink lying low when it runs heavy)
    const S = _is, X = H.mist;
    if (F?.lenses) { S.a = k; S.colour = L.mist; S.n = v('lenses', 440) * Math.min(1, 0.4 + 0.6 * k); S.size = v('lensSize', 12); S.rise = v('rise', 0); S.alpha = v('lensA', 0.8) * k; }
    else { S.a = k * hv; S.colour = X.colour; S.n = X.n * Math.min(1, 0.4 + 0.6 * k); S.size = X.size; S.rise = X.rise; S.alpha = X.alpha * k * hv; }
    out.mist = S;
  }
  if (F?.kind === 'hail') out.hail = k;
  out.pock = v('pock', 0) * k;
  return out;
}
/** The thunder a weather asks for at heaviness hv: its bolts' pace, distance, size and colours (the pall's far bolts, leaning to its
 *  heavy ones; the hail's only when it runs heavy), or null. */
function stormOf(a, hv) {
  const B = LOOK[a].bolts, H = LOOK[a].heavy?.bolts; if (!B && !H) return null;
  if (!B) return H;
  const o = _st;
  for (const key of ['glowR', 'glowY', 'glowA', 'boltA']) o[key] = mixv(B[key], H?.[key], hv);
  for (const key of ['every', 'dist', 'scale']) for (let i = 0; i < 2; i++) o[key][i] = mixv(B[key][i], H?.[key]?.[i], hv);
  o.colour.copy(B.colour); if (H?.colour) o.colour.lerp(H.colour, hv);
  o.glow.copy(B.glow); if (H?.glow) o.glow.lerp(H.glow, hv);
  return o;
}

// ---------------------------------------------------------------- what falls
const R = 26, H = 30, LOW = 4; // (the column round the eye: its radius, and its height, from LOW metres under the eye up; most of what falls is high)
const WET_U = { uWet: { value: [new THREE.Vector4(1, 1, 0, 0), new THREE.Vector4(1, 1, 0, 0)] }, uWetY: { value: new THREE.Vector2() } }; // (the still waters nearest the eye, shared by the motes: WeatherLook.wet sets them)
const SHORE_U = { uShore: { value: new THREE.Vector4(0, 0, 0, 0) }, uShoreA: { value: new THREE.Vector2(0, 0) } }; // (shared by what falls: vfx/shore.js sets it)
const WRAP = /* glsl */`
uniform float uT; uniform vec3 uCam; uniform vec3 uVel; uniform float uNoise, uLowK;
uniform vec3 uBox; uniform vec2 uClear; // (the column: its radius, height and depth under the centre; the screen's middle kept clear: its radius, how much)
vec3 wrapAt(vec3 seed, float sp) { // (a world-anchored path, wrapped into the column round the centre: nothing moves with the camera)
  vec3 w = vec3(seed.x * 2.0 * uBox.x, seed.y * uBox.y, seed.z * 2.0 * uBox.x) + uVel * sp * uT;
  return vec3(mod(w.x - uCam.x + uBox.x, 2.0 * uBox.x) - uBox.x, mod(w.y - uCam.y + uBox.z, uBox.y) - uBox.z, mod(w.z - uCam.z + uBox.x, 2.0 * uBox.x) - uBox.x);
}
// a cheap curl noise: the curl of a vector potential of sines (two octaves), so the field has no sources or sinks and neighbouring
// drops sway together, like a gust, instead of each jittering on its own (Bridson et al. 2007, "Curl-noise for procedural fluid flow")
vec3 curlOf(vec3 p, float t) {
  vec3 a = vec3(0.21 * p.y + 0.13 * p.z + 0.7 * t, 0.17 * p.z + 0.19 * p.x + 0.9 * t + 2.0, 0.23 * p.x + 0.11 * p.y + 0.6 * t + 4.0);
  vec3 c = cos(a);
  return vec3(0.11 * c.z - 0.17 * c.y, 0.13 * c.x - 0.23 * c.z, 0.19 * c.y - 0.21 * c.x) * 3.0;
}
vec3 curlish(vec3 p, float t) { return curlOf(p, t) + 0.5 * curlOf(p * 2.7 + 11.0, t * 1.7); }
${OVERHEAD_GLSL}
uniform vec4 uShore; uniform vec2 uShoreA; // (a shore: its centre xz, the waterline's radius, on; its bearing and half-width)
float shoreFade(vec3 w) { // (the island's mood ends at the waterline: nothing falls over the crude)
  if (uShore.w <= 0.0) return 1.0;
  vec2 d = w.xz - uShore.xy; float a = atan(d.y, d.x) - uShoreA.x; a = abs(atan(sin(a), cos(a)));
  return a > uShoreA.y ? 1.0 : 1.0 - smoothstep(uShore.z - 2.0, uShore.z + 6.0, length(d));
}
// the column's edges, and nothing within a few metres of its centre (the eye: no streak drawn across the lens; the Courier, for the flood)
float edgeFade(vec3 r) {
  float top = uBox.y - uBox.z;
  return (1.0 - smoothstep(uBox.x * 0.7, uBox.x, length(r.xz))) * (1.0 - smoothstep(top * 0.77, top, r.y)) * smoothstep(-uBox.z, -uBox.z + 1.5, r.y)
    * smoothstep(1.2, 3.5, length(r)) * shoreFade(uCam + r);
}
// the middle of the screen kept clear (the awakening's flood: never over the Courier's face nor a fight's danger), and nothing at the lens
float clearFade(vec4 clip, float depth) {
  float k = smoothstep(1.0, 3.0, depth);
  if (uClear.y <= 0.0) return k;
  vec2 ndc = clip.xy / max(0.001, clip.w); ndc.x *= projectionMatrix[1][1] / projectionMatrix[0][0];
  return k * (1.0 - uClear.y * (1.0 - smoothstep(uClear.x * 0.55, uClear.x, length(ndc))));
}
// under a roof, inside a wall's top or below the ground: nothing (vfx/overhead.js); near the ground only the sparse few (uLowK of them)
float fallFade(vec3 w, float seed) {
  float oy = overheadY(w.xz);
  if (w.y < oy + 0.05) return 0.0;
  float ground = oy > -9000.0 ? oy : uCam.y - 2.0;
  return max(step(fract(seed * 91.7), uLowK), smoothstep(2.5, 8.0, w.y - ground));
}`;
const boxU = () => ({ uBox: { value: new THREE.Vector3(R, H, LOW) }, uClear: { value: new THREE.Vector2(0, 0) } });

/** The streaks: one LineSegments of n, its own column round a centre (`uCam`, `uBox`). */
export function makeRain(n, occ) {
  const seed = new Float32Array(n * 6), end = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const s = [Math.random(), Math.random(), Math.random()];
    seed.set(s, i * 6); seed.set(s, i * 6 + 3); end[i * 2] = 0; end[i * 2 + 1] = 1;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 6), 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3)); g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
  const u = { uT: { value: 0 }, uCam: { value: new THREE.Vector3() }, uShore: SHORE_U.uShore, uShoreA: SHORE_U.uShoreA, uVel: { value: new THREE.Vector3(0, -10, 0) }, uLen: { value: 1 }, uCol: { value: new THREE.Color() }, uA: { value: 0 },
    uNoise: { value: 0.6 }, uLowK: { value: 0.12 }, uSheet: { value: 0 }, ...boxU(), ...occ };
  const m = new THREE.ShaderMaterial({ name: 'weather-rain',
    uniforms: u, transparent: true, depthWrite: false, fog: false,
    vertexShader: `${WRAP}
attribute vec3 aSeed; attribute float aEnd; uniform float uLen, uSheet; varying float vA;
float sheetOf(vec3 p) { // (rain in sheets: curtains of it, denser and thinner in turn, sweeping on with the wind; smooth, so nothing flickers)
  if (uSheet <= 0.0) return 1.0;
  vec2 d = normalize(uVel.xz + vec2(1e-4, 0.0)), q = vec2(-d.y, d.x);
  float x = dot(p.xz, d) * 0.3 - uT * 1.7 + 1.4 * sin(dot(p.xz, q) * 0.05 + uT * 0.1);
  return mix(1.0, 0.2 + 1.7 * smoothstep(0.15, 0.95, 0.5 + 0.5 * sin(x)), uSheet);
}
void main() {
  float sp = 0.85 + 0.3 * fract(aSeed.x * 17.3);
  vec3 r = wrapAt(aSeed, sp);
  vec3 p = uCam + r - normalize(uVel) * uLen * aEnd; // (the streak: its head, and its tail back along the way it falls)
  float tt = uT - aEnd * uLen / max(0.001, length(uVel) * sp); // (the tail is where the head was a moment ago, on the same wandering path)
  p += curlish(p * 0.08, tt) * uNoise;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vA = edgeFade(r) * fallFade(p, aSeed.y) * (1.0 - 0.8 * aEnd) * sheetOf(uCam + r) * clearFade(gl_Position, -mv.z);
}`,
    fragmentShader: 'uniform vec3 uCol; uniform float uA; varying float vA; void main() { gl_FragColor = vec4(uCol, min(1.0, uA * vA)); }',
  });
  const L = new THREE.LineSegments(g, m); L.frustumCulled = false; L.renderOrder = 5; L.visible = false;
  return { obj: L, u, n };
}

/** The motes: one Points program in four modes (a uniform, never a define: one program for all of them, CASEBOOK rule 5).
 *   0 DRIFT  dust and diamond dust on the wind's eddies (wonder, desire), Mirth's confetti and Dread's ash when heavy; `uHex` 0 a
 *            soft dot, 1 a hexagon that glints, 2 a dot that glints; `uHue` each mote its own shade of the colour
 *   1 FLIES  a few loose clouds, each a drifting centre low over the ground with its flies buzzing round it (gall)
 *   2 HAIL   a stone landing: the last of its fall, one bounce, then lying where it skipped to and melting; each lands somewhere new
 *            each time round (fury; the streaks are the fall itself)
 *   3 LENS   a lens of low fog, wider than tall, sat on the ground (so the ground never cuts it), more and taller in a hollow than
 *            on a crest, mottled; laid out to `uBox.x` (48 m) round the centre on a coarser map of the ground (gall); `uRise` lifts it
 *  Below its least size a dot fades with its area instead of shrinking (a far fly or stone thins, it never crawls a pixel at a time). */
export function makeMotes(n, occ) {
  const seed = new Float32Array(n * 3); for (let i = 0; i < seed.length; i++) seed[i] = Math.random();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
  const u = { uT: { value: 0 }, uCam: { value: new THREE.Vector3() }, uShore: SHORE_U.uShore, uShoreA: SHORE_U.uShoreA, uVel: { value: new THREE.Vector3(0, -0.35, 0) }, uCol: { value: new THREE.Color() }, uA: { value: 0 }, uSize: { value: 0.06 }, uHex: { value: 1 }, uPx: { value: 480 },
    uNoise: { value: 1.5 }, uLowK: { value: 0.2 }, uMode: { value: 0 }, uHue: { value: 0 }, uRise: { value: 0 }, uWet: WET_U.uWet, uWetY: WET_U.uWetY, ...boxU(), ...occ };
  const m = new THREE.ShaderMaterial({ name: 'weather-motes',
    uniforms: u, transparent: true, depthWrite: false, fog: false,
    vertexShader: `${WRAP}
attribute vec3 aSeed; uniform float uSize, uHex, uPx, uMode, uRise; varying float vA; varying float vG; varying float vM; varying float vAsp;
float h11(float n) { return fract(sin(n * 127.1) * 43758.5453); }
vec2 wrapXZ(vec2 w, float r) { return mod(w - uCam.xz + r, 2.0 * r) - r; } // (world-anchored, wrapped round the eye at radius r)
float groundAt(vec2 xz, float or) { float oy = overheadY(xz); return oy > -9000.0 ? oy : or; } // (the top of what is there, or a stand-in)
uniform vec4 uWet[2]; uniform vec2 uWetY; // (the two still waters nearest the eye: their boxes x0 z0 x1 z1, their surfaces; a box with x1 < x0 is none)
float wetAt(vec2 xz) { // (the surface of still water here, or the stand-in for none)
  if (xz.x > uWet[0].x && xz.y > uWet[0].y && xz.x < uWet[0].z && xz.y < uWet[0].w) return uWetY.x;
  if (xz.x > uWet[1].x && xz.y > uWet[1].y && xz.x < uWet[1].z && xz.y < uWet[1].w) return uWetY.y;
  return -1e4;
}
void main() {
  vec3 w; float a = 1.0, size = uSize, lo = 2.5, hi = 8.0; vG = 0.0; vM = aSeed.z; vAsp = 1.0;
  if (uMode < 0.5) {
    vec3 r = wrapAt(aSeed, 0.8 + 0.4 * fract(aSeed.y * 13.1));
    w = uCam + r;
    w += curlish(w * 0.08, uT) * uNoise; // (each mote wanders on the wind's own eddies, the ice sinking slower through them)
    // a crystal's glint: a slow turn that catches the light for a moment, each on its own long period (never a twinkle field)
    vG = step(0.5, uHex) * pow(max(0.0, sin(uT * (0.5 + 0.4 * aSeed.x) + aSeed.z * 40.0)), 24.0);
    vec4 mv0 = viewMatrix * vec4(w, 1.0);
    gl_PointSize = clamp(uSize * uPx / -mv0.z, 1.0, uHex > 1.5 ? 14.0 : 6.0) * (1.0 + 1.5 * vG); // (confetti may come nearer, bigger)
    gl_Position = projectionMatrix * mv0;
    vA = edgeFade(r) * fallFade(w, aSeed.x) * clearFade(gl_Position, -mv0.z);
    return;
  }
  if (uMode < 1.5) { // FLIES: nine loose clouds, three of them in a close ring round the eye (they find you), each drifting slowly,
    // its flies on fast unequal loops round it; world-anchored, a cloud wrapping round the eye fades out behind and in ahead
    float c = floor(aSeed.x * 9.0), wr = c < 3.0 ? 6.0 : 16.0;
    vec2 cr = wrapXZ(vec2(h11(c + 1.0), h11(c + 7.0)) * 2.0 * wr + vec2(sin(uT * 0.11 + c), cos(uT * 0.09 + c * 1.7)) * 2.0, wr);
    vec3 cc = vec3(uCam.x + cr.x, 0.0, uCam.z + cr.y);
    cc.y = groundAt(cc.xz, uCam.y - 1.6) + 0.5 + 1.0 * h11(c + 13.0);
    float ph = aSeed.z * 40.0, rr = 0.25 + 0.55 * fract(aSeed.y * 17.0);
    w = cc + rr * vec3(sin(uT * (2.0 + 4.0 * aSeed.y) + ph), 0.5 * sin(uT * (3.0 + 3.0 * aSeed.z) + ph * 1.3), cos(uT * (2.5 + 3.5 * fract(aSeed.x * 31.0)) + ph * 0.7))
      + 0.07 * vec3(sin(uT * 23.0 + ph), sin(uT * 19.0 + ph * 2.0), cos(uT * 29.0 + ph)); // (the dart and jitter of a fly, never a smooth orbit)
    a = 1.0 - smoothstep(wr * 0.65, wr, length(cr));
    if (w.y < overheadY(w.xz) - 0.05) a = 0.0; // (under a roof's edge: none)
  } else if (uMode < 2.5) { // HAIL: a stone's landing, bounce and scatter, a new spot each time round
    float P = 2.6 + 1.4 * aSeed.y, cyc = uT / P + aSeed.x * 7.0, k = floor(cyc), tau = fract(cyc) * P;
    vec3 hs = vec3(h11(k * 1.7 + aSeed.z * 91.0), h11(k * 2.3 + aSeed.x * 53.0), h11(k * 3.1 + aSeed.y * 71.0));
    vec2 rc = wrapXZ(hs.xz * 22.0, 11.0), xz = uCam.xz + rc;
    float gy = groundAt(xz, -1e4), wy = wetAt(xz), tf = 0.1, vb = 1.2 + 1.6 * hs.y, tb = 2.0 * vb / 9.8, y;
    vec2 skip = vec2(cos(hs.y * 40.0), sin(hs.y * 40.0)) * (0.15 + 0.3 * hs.x); // (it skips a little way off the way it bounced)
    if (wy > -9000.0 && gy < wy - 0.05) { gy = wy; a = step(tau, tf); } // (on water a stone is gone at the surface: its ring is the pock, vfx/ripples.js; a pond's box has dry corners, so only where the ground lies under the surface)
    if (tau < tf) y = gy + 22.0 * (tf - tau);
    else if (tau < tf + tb) { float s = tau - tf; y = gy + vb * s - 4.9 * s * s; xz += skip * (s / tb); }
    else { y = gy; xz += skip; }
    w = vec3(xz.x, y + 0.03, xz.y);
    float rest = tf + tb, melt = 1.0 - smoothstep(rest + (P - rest) * 0.4, P * 0.97, tau); // (lying white, then melting into the sand)
    a *= melt * (1.0 - smoothstep(7.0, 11.0, length(rc))) * step(-9000.0, gy); // (none where the ground is not known yet)
    size *= 0.55 + 0.45 * melt;
  } else { // LENS: a pancake of low fog lying on the ground, thicker and deeper in the hollows, drawn as the ellipse it projects to
    vec2 rc = wrapXZ(aSeed.xz * 2.0 * uBox.x + uVel.xz * uT, uBox.x), xz = uCam.xz + rc;
    xz += curlish(vec3(xz.x, 0.0, xz.y) * 0.03, uT * 0.25).xz * uNoise;
    float g0 = groundAt(xz, -1e4);
    float gn = 0.125 * (groundAt(xz + vec2(6.0, 0.0), g0) + groundAt(xz - vec2(6.0, 0.0), g0) + groundAt(xz + vec2(0.0, 6.0), g0) + groundAt(xz - vec2(0.0, 6.0), g0)
      + groundAt(xz + vec2(15.0, 9.0), g0) + groundAt(xz - vec2(15.0, 9.0), g0) + groundAt(xz + vec2(-9.0, 15.0), g0) + groundAt(xz - vec2(-9.0, 15.0), g0)); // (the ground round it, near and further: a dip and a basin both count)
    float hollow = clamp((gn - g0) / 1.5, 0.0, 1.0), crest = clamp((g0 - gn) / 1.2, 0.0, 1.0);
    w = vec3(xz.x, g0 + (0.3 + 0.5 * aSeed.y) * (1.0 + 1.5 * hollow) * (1.0 + uRise * (0.4 + aSeed.y)), xz.y); // (risen, the miasma stands to the chest)
    vec3 dv = uCam - w; float dist = length(dv), sEl = clamp(dv.y / max(0.1, dist), -1.0, 1.0), cEl = sqrt(1.0 - sEl * sEl);
    size *= clamp(dist / 22.0, 0.35, 1.0); // (smaller near the eye: finer there, and never past the sprite's cap)
    vAsp = max(sEl, 0.22 * cEl); // (a flat disc seen at an elevation is an ellipse that tall: edge-on a thin band, from above nearly round)
    w.y = max(w.y, g0 + 0.5 * size * vAsp * cEl + 0.1); // (lifted till its near rim clears the ground: a sprite's one depth never cuts it)
    a = (0.6 + 0.4 * hollow) * (1.0 - 0.7 * crest) * (1.0 - smoothstep(uBox.x * 0.7, uBox.x, length(rc))) * step(-9000.0, g0); // (none where the ground is not known yet)
    lo = 1.0; hi = 240.0;
  }
  vec4 mv = viewMatrix * vec4(w, 1.0);
  float px = size * uPx / max(0.1, -mv.z);
  gl_PointSize = clamp(px, lo, hi);
  a *= min(1.0, px * px / (lo * lo)) * shoreFade(w);
  gl_Position = projectionMatrix * mv;
  if (uMode > 2.5) { // (a lens fades near the eye and as its centre nears the screen's edge, so a big sprite never pops at the edge)
    vec2 ndc = gl_Position.xy / max(0.001, gl_Position.w);
    a *= smoothstep(1.5, 4.5, -mv.z) * (1.0 - smoothstep(0.82, 1.08, max(abs(ndc.x), abs(ndc.y))));
  } else a *= smoothstep(1.2, 3.5, -mv.z);
  vA = a * clearFade(gl_Position, 9.0);
}`,
    fragmentShader: `uniform vec3 uCol; uniform float uA, uHex, uMode, uHue; varying float vA; varying float vG; varying float vM; varying float vAsp;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  if (uMode > 2.5) { // a lens of fog: the ellipse its disc projects to, soft to nothing at its rim, mottled by two slow lumps (curdled, never even)
    vec2 q = p * vec2(2.0, 2.0 / vAsp);
    float r = length(q), s = 1.0 - smoothstep(0.15, 1.0, r);
    float lump = 0.7 + 0.3 * sin(p.x * 11.0 + vM * 40.0) * sin(p.y * 9.0 / vAsp - vM * 23.0);
    float k = s * lump; if (k < 0.004) discard;
    gl_FragColor = vec4(mix(uCol, uCol * vec3(1.06, 1.1, 0.7), smoothstep(0.25, 0.9, r)), uA * vA * k); // (the violet sours to bile toward its rim)
    return;
  }
  if (uMode > 1.5) { // a hailstone: a little ice ball lit from above, white on top and blue-grey beneath, so it reads on pale sand as on dark clay
    float d = length(p), body = 1.0 - smoothstep(0.36, 0.5, d);
    if (body < 0.01) discard;
    float lit = clamp(0.5 - 1.6 * p.y - 0.4 * p.x, 0.0, 1.0); // (gl_PointCoord's y runs down the screen: the top is lit)
    gl_FragColor = vec4(uCol * mix(vec3(0.38, 0.46, 0.56), vec3(1.0), lit), uA * vA * body);
    return;
  }
  float hex = max(abs(p.x) * 0.866 + abs(p.y) * 0.5, abs(p.y)); // (a hexagon: the plate crystal)
  float shape = uHex > 0.5 && uHex < 1.5 ? 1.0 - smoothstep(0.38, 0.46, hex) : 1.0 - smoothstep(0.15, 0.5, length(p));
  if (shape < 0.01) discard;
  vec3 c = uCol * mix(vec3(1.0), 0.7 + 0.6 * fract(vec3(vM * 7.31, vM * 3.17 + 0.31, vM * 5.13 + 0.67)), uHue); // (confetti: each mote its own shade of the gold)
  gl_FragColor = vec4(c * (0.7 + 1.6 * vG), uA * vA * shape * (uHex > 1.5 ? 0.9 + 0.1 * vG : 0.45 + 0.55 * vG)); // (confetti is solid, its glint a flash of light; ice mostly clear till it catches the sun)
}`,
  });
  const P = new THREE.Points(g, m); P.frustumCulled = false; P.renderOrder = 5; P.visible = false;
  return { obj: P, u, n };
}

/** A spec from fallsOf on the streaks (in a colour: the caller's tint). */
export function rainTo(P, s, col) {
  const u = P.u; u.uCol.value.copy(col); u.uLen.value = s.len; u.uA.value = s.alpha; u.uNoise.value = s.noise; u.uLowK.value = s.lowK; u.uSheet.value = s.sheet;
  u.uVel.value.fromArray(s.vel); P.obj.geometry.setDrawRange(0, Math.min(P.n, Math.round(s.n)) * 2);
}
/** A spec from fallsOf on the motes. */
export function motesTo(P, s, col) {
  const u = P.u; u.uMode.value = s.mode; u.uCol.value.copy(col); u.uSize.value = s.size; u.uA.value = s.alpha; u.uHex.value = s.hex; u.uHue.value = s.hue;
  if (s.mode === 0) { u.uVel.value.fromArray(s.vel); u.uNoise.value = s.noise; u.uLowK.value = s.lowK; }
  P.obj.geometry.setDrawRange(0, Math.min(P.n, Math.round(s.n)));
}
/** A spec from fallsOf on the fog lenses (`wind` the dunes' wind or null: it creeps with it, slowly). */
export function mistTo(P, s, col, wind = null) {
  const u = P.u; u.uCol.value.copy(col); u.uA.value = s.alpha; u.uSize.value = s.size; u.uRise.value = s.rise;
  u.uVel.value.set(wind ? wind.x * 0.35 : 0.3, 0, wind ? wind.y * 0.35 : 0.15);
  P.obj.geometry.setDrawRange(0, Math.min(P.n, Math.round(s.n)));
}

// ---------------------------------------------------------------- the marks in the sky
const SKYD = 520; // (how far off the sky's marks hang: drawn at the back of the depth, as the dome is, whatever the far plane)
const RING_FRAG = /* glsl */`uniform float uA, uR0, uR1, uMode; uniform vec3 uC; varying vec2 vP;
vec3 spectrum(float t) { return clamp(abs(fract(t + vec3(0.0, 0.333, 0.667)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
void main() {
  float t = clamp((length(vP) - uR0) / (uR1 - uR0), 0.0, 1.0), edge = smoothstep(0.0, 0.2, t) * (1.0 - smoothstep(0.75, 1.0, t)), fall = (1.0 - t) * (1.0 - t);
  if (uMode < 0.5) gl_FragColor = vec4(mix(vec3(1.0, 0.55, 0.4), vec3(0.85, 0.9, 1.0), t), uA * edge);         // the halo: red inside, as ice bends it
  else if (uMode < 1.5) gl_FragColor = vec4(spectrum(0.78 - t * 0.78), uA * edge);                              // the bow: violet inside, red out (the secondary's radii swapped: red inside)
  else if (uMode < 2.5) gl_FragColor = vec4(mix(vec3(1.0, 0.95, 0.85), vec3(1.0, 0.5, 0.35), t), uA * fall);  // a sun dog
  else gl_FragColor = vec4(uC * fall, uA);                                                                      // the glow in the cloud behind a bolt (its colour: the pall's violet, the hail's red)
}`;
/** A sky mark: a ring (or a disc) facing the eye, one shader for all of them (one program; `mode` picks the look). */
function ringMesh(mode, r0, r1, u0 = r0, u1 = r1) {
  const u = { uA: { value: 0 }, uR0: { value: u0 }, uR1: { value: u1 }, uMode: { value: mode }, uC: { value: new THREE.Color(0.45, 0.4, 0.6) } };
  const m = new THREE.ShaderMaterial({ name: `weather-${['halo', 'bow', 'dogs', 'glow'][mode]}`,
    uniforms: u, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w * 0.9998; }', // (at the back of the depth, as the dome: past the far plane, behind everything near)
    fragmentShader: RING_FRAG,
  });
  const o = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 96, 1), m); o.frustumCulled = false; o.renderOrder = 4; o.visible = false;
  return { obj: o, u };
}
const tanD = (d) => Math.tan(THREE.MathUtils.degToRad(d)) * SKYD;

function makeAurora() {
  const u = { uT: { value: 0 }, uA: { value: 0 }, uFill: { value: 0 } };
  const m = new THREE.ShaderMaterial({ name: 'weather-aurora',
    uniforms: u, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w * 0.9998; }',
    fragmentShader: `uniform float uT, uA, uFill; varying vec2 vUv;
float h1(float x) { return fract(sin(x * 127.1) * 43758.5453); }
float n1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i), h1(i + 1.0), f); }
void main() {
  float a = vUv.x * 6.2832, y = vUv.y;
  float band = smoothstep(0.15 - 0.45 * uFill, 0.55 - 0.3 * uFill, n1(vUv.x * 5.0 + uT * 0.006));     // (where the curtains hang: most of the sky, drifting; heavy, all of it)
  float fold = n1(vUv.x * 40.0 + n1(vUv.x * 9.0 + uT * (0.02 + 0.03 * uFill)) * 4.0);              // (their folds, slow; quicker when heavy)
  float rays = 0.55 + 0.45 * n1(vUv.x * 260.0 + fold * 6.0);                              // (the fine vertical rays)
  float body = smoothstep(0.0, 0.25, y) * (1.0 - smoothstep(0.45 + 0.35 * fold + 0.15 * uFill, 1.0 + 0.05 * uFill, y)); // (a hem at the bottom, frayed upward)
  vec3 c = mix(vec3(0.12, 0.85, 0.6), vec3(0.2, 0.32, 0.95), smoothstep(0.15, 0.6, y));     // (labradorite's green at the hem, lapis above)
  c = mix(c, vec3(0.55, 0.25, 0.85), smoothstep(0.6, 1.0, y));                             // (and violet at the top)
  gl_FragColor = vec4(c * (1.6 + 0.5 * uFill), uA * band * body * rays * (0.6 + 0.4 * fold));
}`,
  });
  const o = new THREE.Mesh(new THREE.CylinderGeometry(SKYD, SKYD, 240, 96, 1, true), m); o.frustumCulled = false; o.renderOrder = 4; o.visible = false;
  return { obj: o, u };
}

/** A bolt: a jagged ribbon from the cloud to the ground with a fork off it, its own shape each strike (written into `g` when given:
 *  the same buffer, rewritten). */
function boltGeo(rand, g = null) {
  const main = [], fork = []; let x = 0;
  for (let i = 0; i <= 14; i++) { main.push(x, 150 - i * 11); x += (rand() - 0.5) * 18; }
  const side = rand() < 0.5 ? -1 : 1; x = main[10]; let y = main[11];
  for (let i = 0; i <= 6; i++) { fork.push(x, y); x += side * (4 + rand() * 7); y -= 6 + rand() * 7; }
  const pos = g ? g.attributes.position.array : new Float32Array((14 + 6) * 18); let o = 0;
  const strip = (pts, w) => { for (let i = 0; i + 3 < pts.length; i += 2) { const ax = pts[i], ay = pts[i + 1], bx = pts[i + 2], by = pts[i + 3]; for (const v of [ax - w, ay, 0, ax + w, ay, 0, bx + w, by, 0, ax - w, ay, 0, bx + w, by, 0, bx - w, by, 0]) pos[o++] = v; } };
  strip(main, 1.6); strip(fork, 0.9);
  if (g) { g.attributes.position.needsUpdate = true; return g; }
  const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.BufferAttribute(pos, 3)); return ng;
}
const rng = (s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
const BOLTS = 4; // (bolts at once: the hail's heavy thunder strikes about once a second, each held 1.9 real seconds)

export class WeatherLook {
  constructor(game) {
    this.game = game;
    this.made = false; // (its meshes are made the first time a weather shows: nothing is compiled for a calm that never ends)
    this.amt = Object.fromEntries(ASPECTS.map((a) => [a, 0])); // (each weather's present amount, eased: a spell comes in and goes out)
    this.sec = Object.fromEntries(ASPECTS.map((a) => [a, 0])); // (and as the AGATE's second: it colours, it never falls)
    this.eff = Object.fromEntries(ASPECTS.map((a) => [a, 0])); // (the amount drawn: the spell's, or the awakening's surge over it)
    this.surgeA = null; this.surgeK = 0;
    this.forced = null; this.wx = null; this.poll = 0; this.t = 0; this.lift = 0;
    this.strike = { next: 4, t: -9, n: 0 };
  }

  /** The meshes, made once, the first time a weather shows. */
  make() {
    this.made = true;
    this.group = new THREE.Group(); this.group.name = 'weather'; this.group.userData.zoneFree = true;
    this.game.scene?.add(this.group);
    this.over = new Overhead(this.game); // (what stands over each spot round the eye: nothing falls under it, vfx/overhead.js)
    this.rain = makeRain(4000, this.over.u); this.motes = makeMotes(3000, this.over.u); // (fewer than they were, R46, till a spell runs heavy; the hail's scatter is the most of the motes)
    this.wide = new Overhead(this.game, { n: 40, cell: 3 }); // (the ground to 60 m round the eye, coarser: the miasma's lenses lie out to 48 m)
    this.mist = makeMotes(LOOK.gall.heavy.fall.lenses, this.wide.u); this.mist.u.uMode.value = 3; this.mist.u.uSize.value = 12; this.mist.u.uNoise.value = 2.5; this.mist.u.uBox.value.x = 48;
    this.falls = [this.rain, this.motes, this.mist];
    this.halo = ringMesh(0, tanD(21), tanD(23.5));
    this.bow = ringMesh(1, tanD(40.5), tanD(42.5));
    this.bow2 = ringMesh(1, tanD(50), tanD(53.5), tanD(53.5), tanD(50)); // (the secondary bow: its radii swapped, so its colours run the other way)
    this.dogs = [0, 1].map(() => ringMesh(2, 0, tanD(1.6)));
    this.aurora = makeAurora();
    const boltMat = new THREE.MeshBasicMaterial({ name: 'weather-bolt', color: 0xd8e8c8, transparent: true, opacity: 0, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    this.bolts = Array.from({ length: BOLTS }, (_, i) => { // (each its own material and glow, the same programs)
      const mesh = new THREE.Mesh(boltGeo(rng(7 + i)), i ? boltMat.clone() : boltMat); mesh.frustumCulled = false; mesh.visible = false;
      return { mesh, glow: ringMesh(3, 0, 90), t: -9, glowA: 0.35, boltA: 0.85 };
    });
    for (const o of [this.rain.obj, this.motes.obj, this.mist.obj, this.halo.obj, this.bow.obj, this.bow2.obj, ...this.dogs.map((d) => d.obj), this.aurora.obj, ...this.bolts.flatMap((b) => [b.mesh, b.glow.obj])]) this.group.add(o);
  }

  /** For the boot's shader warm-up (main.js): everything made and shown, so its programs compile with the rest and the first weather
   *  never compiles in the middle of play; returns what hides it again (the next update decides what shows). */
  prewarm() {
    if (!this.made) this.make();
    this.group.visible = true; this.group.traverse((o) => { o.visible = true; });
    return () => { this.group.traverse((o) => { if (o !== this.group) o.visible = false; }); };
  }

  /** Where an island's weather stops: a shore's sector (its centre, bearing, half-width, the waterline's radius). Nothing falls past it. */
  shoreline({ center, angle, half, r }) { SHORE_U.uShore.value.set(center.x, center.z, r, 1); SHORE_U.uShoreA.value.set(angle, half); }

  /** Show a weather and an hour whatever the rules say (tests, the workbench); null hands it back to `game.weather`. */
  force(w) { this.forced = w ? { aspect: null, strength: 1, phase: 19 / 24, light: 0.5, exposure: 'open', ...w } : null; }

  /** The awakening's flood (vfx/awakening.js): this weather drawn at k at once, over the spell, while it asks (each frame); null ends it. */
  surge(aspect, k = 0) { this.surgeA = aspect && LOOK[aspect] ? aspect : null; this.surgeK = this.surgeA ? k : 0; }

  /** What the look follows: the forced weather, or the rules where the eye is. Null (no rules yet): nothing, the painting untouched. */
  read(pos) {
    if (this.forced) return this.forced;
    const W = this.game.weather;
    if (!W?.here) return null;
    const h = W.here(pos), s = W.sky?.(undefined, h.place);
    return { aspect: h.aspect, strength: h.strength, second: h.second || null, secondStrength: h.secondStrength || 0, exposure: h.exposure, phase: s?.phase ?? h.phase, light: s?.light ?? 0.5 };
  }

  update(dt, camera) {
    if (!camera) return;
    this.t += dt;
    if ((this.poll -= dt) <= 0 || this.forced) { this.poll = 0.5; this.wx = this.read(camera.position); }
    const w = this.wx, cam = camera.position, sky = this.game.sky;
    // the amounts: the weather here, eased in and out over a few seconds; nothing falls under a roof or down a Well
    const open = w && w.exposure === 'open';
    for (const a of ASPECTS) {
      const tgt = w && w.aspect === a ? w.strength : 0;
      this.amt[a] += (tgt - this.amt[a]) * (1 - Math.exp(-dt * 0.6));
      if (this.amt[a] < 1e-3 && tgt === 0) this.amt[a] = 0;
      const t2 = w && w.second === a ? (w.secondStrength || 0) * (w.strength || 0) : 0; // (the second, as strong as it is in a sky as strong as the first)
      this.sec[a] += (t2 - this.sec[a]) * (1 - Math.exp(-dt * 0.6));
      if (this.sec[a] < 1e-3 && t2 === 0) this.sec[a] = 0;
      this.eff[a] = Math.max(this.amt[a], a === this.surgeA ? this.surgeK : 0); // (the awakening's surge over the spell, never eased: it is its own envelope)
    }
    // the sky's grade: the hour, then the weather over it (with no rules, the painting as it is)
    if (sky?.grade) {
      if (!w) sky.grade({});
      else {
        const g = hourGrade(w.phase, _g);
        for (const a of ASPECTS) {
          const k = Math.min(1, this.eff[a] + 0.7 * this.sec[a]); if (!k) continue; // (the second colours the sky too)
          const S = skyOf(a, heavyOf(this.eff[a]));
          g.expo *= lerp(1, S.expo, k);
          for (let i = 0; i < 3; i++) g.mul[i] *= lerp(1, S.mul[i], k);
          g.desat = Math.max(g.desat, S.desat * k);
          if (S.hasHaze && S.hazeK * k > g.hazeK) { g.hazeK = S.hazeK * k; S.haze.toArray(g.haze); for (let i = 0; i < 3; i++) g.haze[i] *= 1 - 0.65 * g.night; } // (a horizon's haze holds what light there is: at night an ember, never a lit band)
        }
        sky.grade(Object.assign(_sg, { day: g.day, night: g.night, expo: g.expo, mul: _c.fromArray(g.mul), stars: g.stars, desat: g.desat, haze: _c3.fromArray(g.haze), hazeK: g.hazeK }));
        // the clouds take the hour's light (less of the night's dark: they hold what light there is) and the weather's cover
        const CL = this.game.dunes?.clouds, B = CL?.base;
        if (B) {
          let cover = B.cover, opacity = B.opacity;
          for (const a of ASPECTS) {
            const k = Math.min(1, this.eff[a] + 0.5 * this.sec[a]), Q = LOOK[a].clouds, HQ = LOOK[a].heavy?.clouds || {}, hv = heavyOf(this.eff[a]);
            if (k && Q) { cover = lerp(cover, mixv(Q.cover ?? cover, HQ.cover, hv), k); opacity = lerp(opacity, mixv(Q.opacity ?? opacity, HQ.opacity, hv), k); }
          }
          CL.grade({ expo: Math.pow(g.expo, 0.8) * (1 - 0.5 * g.desat) * (1 - 0.65 * g.night), mul: _c.lerp(_white, 0.5), cover, opacity: opacity * (1 - 0.5 * g.night) * (1 - 0.4 * g.day) }); // (thin under the day's and the night's own painted clouds)
        }
      }
    }
    if (!w) this.game.dunes?.clouds?.grade?.({});
    let any = false; for (const a of ASPECTS) if (this.eff[a] > 1e-3 || this.sec[a] > 1e-3) any = true;
    if (!this.made) { if (!any) { this.lift = 0; return; } this.make(); } // (calm since the boot and never warmed: nothing to draw, nothing made)
    this.group.visible = any || this.t - this.strike.t < 3; // (calm: nothing drawn, nothing updated)
    if (!this.group.visible) { this.lift = 0; SOUR_U.uSour.value = 0; return; }
    const light = w?.light ?? 0.5, dayK = smooth(light, 0.3, 0.6), nightK = 1 - smooth(light, 0.15, 0.4);
    const sun = _v.copy(this.game.dunes?.sunDir || _up).normalize(), wind = this.game.dunes?.wind?.dir || null;
    // what falls: the strongest falling weather's way of falling, the others' colours eased in (one rain, one mote field, one fog)
    let rainA = 0, moteA = 0, mistA = 0, hailK = 0, pockK = 0;
    const lit = 0.18 + 0.82 * smooth(light, 0.1, 0.6); // (the fog and the stones take the hour's light; Lachryma's own rain still glows at night)
    for (const a of ASPECTS) {
      const k = open ? this.eff[a] : 0; if (!k) continue;
      const f = fallsOf(a, k, dayK, wind);
      if (f.rain && f.rain.a > rainA) { rainA = f.rain.a; rainTo(this.rain, f.rain, this.tint(_c4, a, f.rain.colour).multiplyScalar(f.rain.lit ? lit : 1)); }
      if (f.motes && f.motes.a > moteA) { moteA = f.motes.a; const M = f.motes; motesTo(this.motes, M, (M.raw ? _c4.copy(M.colour) : this.tint(_c4, a, M.colour)).multiplyScalar(M.lit ? lit : 1)); }
      if (f.mist && f.mist.a > mistA) { // (the low fog: tinted by an agate's second, lit by the hour; at night the night's own fog, a little lighter than the sand, never a dark stain)
        mistA = f.mist.a; this.tintBy(_c4.copy(f.mist.colour), a).multiplyScalar(lit);
        const fc = this.game.scene?.fog?.color; if (fc) _c4.lerp(fc, 0.6 * nightK);
        mistTo(this.mist, f.mist, _c4, wind);
      }
      hailK = Math.max(hailK, f.hail); pockK = Math.max(pockK, f.pock);
    }
    this.rain.obj.visible = rainA > 0.01; this.motes.obj.visible = moteA > 0.01; this.mist.obj.visible = mistA > 0.01;
    if (this.rain.obj.visible || this.motes.obj.visible) this.over.update(cam, 48); // (a few dozen rays a frame: the map round the eye kept fresh)
    if (this.mist.obj.visible) this.wide.update(cam, 32);
    for (const L of this.falls) { L.u.uT.value = this.t; L.u.uCam.value.copy(cam); }
    this.motes.u.uPx.value = this.mist.u.uPx.value = 480 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))); // (the scene is drawn at 480 lines)
    this.pock(dt, pockK, cam); if (hailK > 0.01) this.wet(cam);
    SOUR_U.uSour.value = open ? Math.min(1, this.eff.gall || 0) : 0; // (the curdled film on still water and Lachryma, as strong as the miasma here)
    // the marks in the sky (open places only: none of them is seen from a room)
    const mk = (a) => (open ? Math.min(1, this.eff[a] + this.sec[a]) : 0); // (the marks are the sky's colouring: a second raises its own, an aurora under a pall)
    const hk = (a) => heavyOf(open ? this.eff[a] : 0), MK = (a, key, d) => lerp(d, LOOK[a].heavy?.marks?.[key] ?? d, hk(a));
    const won = mk('wonder'), mir = mk('mirth'), dre = mk('dread');
    this.sky(this.halo, won * dayK * MK('wonder', 'halo', 0.22), cam, sun, 1);
    this.sky(this.bow, mir * dayK * MK('mirth', 'bow', 0.16), cam, sun, -1);
    this.sky(this.bow2, mir * dayK * MK('mirth', 'bow2', 0), cam, sun, -1); // (the double bow: a heavy sunshower's)
    const elev = Math.asin(THREE.MathUtils.clamp(sun.y, -1, 1)), az = Math.atan2(sun.z, sun.x), off = THREE.MathUtils.degToRad(22) / Math.max(0.3, Math.cos(elev));
    for (let i = 0; i < 2; i++) { _w.set(Math.cos(az + (i ? off : -off)) * Math.cos(elev), Math.sin(elev), Math.sin(az + (i ? off : -off)) * Math.cos(elev)); this.sky(this.dogs[i], won * dayK * MK('wonder', 'dogs', 0.6), cam, _w, 1); }
    // the aurora: by night; heavy, it fills the sky (taller, all round, quicker) and shows faintly by day too
    const hw = hk('wonder'), au = this.aurora, tall = lerp(1, LOOK.wonder.heavy.marks.tall, hw);
    au.u.uA.value = won * (nightK * MK('wonder', 'aurora', 0.55) + (1 - nightK) * LOOK.wonder.heavy.marks.auroraDay * hw); au.obj.visible = au.u.uA.value > 0.01;
    au.u.uT.value = this.t; au.u.uFill.value = hw; au.obj.scale.y = tall; au.obj.position.set(cam.x, cam.y + 110 + 120 * tall, cam.z); // (the hem held 110 m up, 520 off: the curtains reach up from it)
    // the thunder: the pall's far bolts, or the hail's close ones once it runs heavy (whichever is the more)
    const fu = open ? this.eff.fury * hk('fury') : 0;
    const look = Math.atan2(camera.getWorldDirection(_w).z, _w.x); // (the hail's bolts mostly where you look: a storm all round, but a bolt is for seeing)
    if (fu > dre) this.thunder(dt, stormOf('fury', 1), fu, cam, look); else this.thunder(dt, stormOf('dread', hk('dread')), dre, cam, look);
  }

  /** What falls takes its weather's colour (or its own, `base`: the hail is white), with the agate's second worked into it (the second
   *  colours; it never falls). */
  tint(out, a, base = null) { out.copy(base ?? LOOK[a].colour).multiplyScalar(LOOK[a].tone ?? 1); return this.tintBy(out, a); }
  /** An agate's second worked into a colour. */
  tintBy(out, a) {
    for (const b of ASPECTS) if (b !== a && this.sec[b] > 0.01) out.lerp(_c3.copy(LOOK[b].colour).multiplyScalar(LOOK[b].tone ?? 1), 0.5 * this.sec[b]);
    return out;
  }

  /** The two still waters nearest the eye, for the hail (a stone that lands on water is gone, not lying), twice a second. */
  wet(cam) {
    if ((this.wetT = (this.wetT || 0) - 1) > 0) return; this.wetT = 30;
    const vols = (this.game.water?.volumes || []).filter((v) => Math.abs(v.surface - cam.y) < 40).map((v) => [Math.hypot(Math.max(v.x0 - cam.x, 0, cam.x - v.x1), Math.max(v.z0 - cam.z, 0, cam.z - v.z1)), v]).sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < 2; i++) { const v = vols[i]?.[0] < 30 ? vols[i][1] : null; WET_U.uWet.value[i].set(v ? v.x0 : 1, v ? v.z0 : 1, v ? v.x1 : 0, v ? v.z1 : 0); WET_U.uWetY.value.setComponent(i, v ? v.surface : 0); }
  }

  /** The hail (and a heavy rain) on still water: small hard rings near the eye, `perS` a second, a light touch in the ripple tank
   *  (`game.water.disturb`; a touch off the water is no touch). Kind 'drop', weak, so a ring is small and quick. */
  pock(dt, perS, cam) {
    const W = this.game.water; if (!W?.disturb || perS < 1.8) return;
    this.pockAcc = (this.pockAcc || 0) + dt * perS;
    while (this.pockAcc >= 1) { this.pockAcc -= 1; W.disturb(cam.x + (Math.random() - 0.5) * 22, cam.z + (Math.random() - 0.5) * 22, 0.35 + 0.25 * Math.random(), 'drop'); }
  }

  /** Hang a sky mark: a ring centred on a direction from the eye (the sun's, or its opposite), facing the eye. */
  sky(m, a, cam, dir, sign) {
    m.obj.visible = a > 0.005; if (!m.obj.visible) return;
    m.u.uA.value = a;
    m.obj.position.copy(cam).addScaledVector(dir, SKYD * sign);
    m.obj.lookAt(cam);
  }

  /** The thunder (`st` from stormOf, at amount k; `look` the camera's bearing, where `st.ahead` of the bolts strike): bolts on their own clock, each held a beat and fading over a second and a half, a
   *  slow glow in the cloud behind each; a small lift for the light. Up to BOLTS at once; never a flash on the screen. */
  thunder(dt, st, k, cam, look = 0) {
    const S = this.strike;
    if (st && k > 0.05 && this.t >= S.next) {
      const r = rng(hash32(1 + S.n++)), b = this.bolts[S.n % BOLTS], ahead = r() < (st.ahead || 0), bear = ahead ? look + (r() - 0.5) * 2.6 : r() * Math.PI * 2, dist = lerp(st.dist[0], st.dist[1], r()), sc = lerp(st.scale[0], st.scale[1], r()); // (inside the dunes' far plane, never on top of you; the seed hashed, since a Lehmer generator's first draw is linear in it and the bearings walked round in 22-degree steps)
      boltGeo(r, b.mesh.geometry);
      b.mesh.scale.setScalar(sc); b.mesh.material.color.copy(st.colour);
      b.mesh.position.set(cam.x + Math.cos(bear) * dist, cam.y - 40 * sc, cam.z + Math.sin(bear) * dist); b.mesh.lookAt(cam.x, b.mesh.position.y, cam.z);
      b.glow.obj.position.set(b.mesh.position.x, cam.y + st.glowY, b.mesh.position.z); b.glow.obj.lookAt(cam); b.glow.obj.scale.setScalar(st.glowR); b.glow.u.uC.value.copy(st.glow);
      b.t = S.t = this.t; b.glowA = st.glowA; b.boltA = st.boltA;
      S.next = this.t + lerp(st.every[0], st.every[1], r()) / Math.max(0.3, k);
    }
    let lift = 0;
    for (const b of this.bolts) {
      const e = this.t - b.t;
      const bolt = e < 0.12 ? e / 0.12 : e < 0.4 ? 1 : Math.max(0, 1 - (e - 0.4) / 1.5); // (up, held a beat, a second and a half to go)
      const glow = e < 0.5 ? smooth(e, 0, 0.5) : Math.max(0, 1 - (e - 0.5) / 2.2);
      b.mesh.visible = bolt > 0.01 && k > 0.01; b.mesh.material.opacity = b.boltA * bolt * Math.min(1, k * 2);
      b.glow.obj.visible = glow > 0.01 && k > 0.01; b.glow.u.uA.value = b.glowA * glow * k;
      lift = Math.max(lift, 0.1 * glow * k);
    }
    this.lift = lift;
  }

  dispose() {
    this.game.sky?.grade?.({}); SOUR_U.uSour.value = 0;
    if (!this.made) return;
    this.over.dispose(); this.wide.dispose();
    this.group.parent?.remove(this.group);
    this.group.traverse((o) => { if (o.isMesh || o.isPoints || o.isLineSegments) { o.geometry.dispose(); o.material.dispose(); } });
  }
}
const _g = { mul: [1, 1, 1], haze: [0, 0, 0] }, _sg = {}, _sky = { mul: [1, 1, 1], haze: new THREE.Color() }, _fog = new THREE.Color();
const _falls = {}, _rs = { vel: [0, 0, 0] }, _ms = { vel: [0, 0, 0] }, _xs = { vel: [0, 0, 0] }, _is = {};
const _st = { every: [0, 0], dist: [0, 0], scale: [1, 1], colour: new THREE.Color(), glow: new THREE.Color() };
const hash32 = (n) => { n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); return ((n ^ (n >>> 16)) >>> 0) % 2147483646 + 1; }; // (a seed scattered: neighbours land far apart)
const _white = new THREE.Color(1, 1, 1), _c = new THREE.Color(), _c3 = new THREE.Color(), _c4 = new THREE.Color(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
