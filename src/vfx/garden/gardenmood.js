// ---------------------------------------------------------------------------------------
// THE GARDEN'S MOOD: the one table every look in the Inner Realm reads (GARDEN-COZY.md H1, H5, H6), so the hour, the season and the
// briar move the whole garden at once and no look keeps its own idea of the light:
//
//   THE HOUR     keyframes over the game hour: a golden key light against a cool fill (warm against cool is the whole trick of cozy),
//                a real golden hour after dawn and before dusk, a violet dusk with the lamps coming on, a blue night of fireflies. The
//                sky's dome, its haze (the fog) and the cloud sea are keyed with it, and the fog is thinner than the dream's was, so the
//                planetoids get depth.
//   THE SEASON   seasonOf() (Dovina's progress/seasons.js, 7 game days each): leaf, grass, flower and blossom colours, a tint on the
//                light (spring fresh, summer deep, autumn amber, winter blue-white with warm lamps), the snow on the poles.
//   THE BRIAR    game.harmony.briarK(): 0 bloom, about 0.33 at rest, 0.53 at the briar's edge, 1 the bottom. Below rest the garden is a
//                moss garden (cooler, mossier, still warm: never ugly); past the edge the warm key fails to an overcast, the colour drains
//                to olive and rust, the wind turns nervous, the bees leave and the moths come, the lamps gutter.
//
// What a look reads, `mood.now`: key, keyI, sky, gnd, hemiI, ambI (the lights); zen, haze, cloud, fogD (the dome); lamps (0..1, lit at
// dusk), fireflies, bees, butterflies, dragonflies, moths (0..1 how many); wind { strength, gust, nervous }; grass, grassTip, leaf, leaf2,
// blossom (Colors), flowers (a list of Colors), snow (0..1); season (its id), briar (0 .. 1 the grade's share), bloom (0 .. 1), day (0..1).
//
// Prior art: Harvest Moon: A Wonderful Life's sun-warmed afternoons and season repaints, Animal Crossing's hour-by-hour palette, Stardew
// Valley's four palettes, Ghibli's golden hours, the colour script (Pixar's: a scene's light keyed to its feeling), and the Project
// Horseshoe report on coziness (2017: safety, abundance, softness) for what the briar takes away.
//
//   const M = new GardenMood(game)   M.update(rawDt) -> M.now   M.apply(realm) (the lights, the fog and the dome: realm.light())
//   moodAt({ hour, season, briarK }) -> a fresh mood (pure, for a stage or a sheet)   gardenMoodNow() -> M.now   SEASON_LOOK   MOOD_HOURS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { seasonOf } from '../../progress/seasons.js';
import { now as calNow, DAY_MS } from '../../core/calendar.js';

const C = (h) => new THREE.Color(h);
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** The hour's keyframes (game hours 0 .. 24): the key (the sun) and its share, the fill (hemi sky, its warm bounce off the ground), the
 *  ambient's share, the dome, the fog's density, and the small lives' hours. Shares multiply what the world's lights hold. */
export const MOOD_HOURS = [
  { h: 0, key: 0x7884e0, keyI: 0.2, sky: 0x3a3672, gnd: 0x1c1530, hemiI: 0.42, ambI: 0.5, zen: 0x0b0c26, haze: 0x2c224c, cloud: 0x3a3262, fogD: 0.0014, lamps: 1, fireflies: 0.55, day: 0 },
  { h: 4.6, key: 0x7884e0, keyI: 0.2, sky: 0x3a3672, gnd: 0x1c1530, hemiI: 0.42, ambI: 0.5, zen: 0x0b0c26, haze: 0x2c224c, cloud: 0x3a3262, fogD: 0.0014, lamps: 1, fireflies: 0.15, day: 0 },
  { h: 5.6, key: 0xff9468, keyI: 0.55, sky: 0x9a8ac8, gnd: 0x6a4a40, hemiI: 0.6, ambI: 0.5, zen: 0x3a4890, haze: 0xf0a088, cloud: 0xf6c8b8, fogD: 0.0022, lamps: 0.6, fireflies: 0, day: 0.35 },
  { h: 7.2, key: 0xffc488, keyI: 0.95, sky: 0xb4c6f0, gnd: 0xb08860, hemiI: 0.85, ambI: 0.6, zen: 0x5a80d0, haze: 0xf8d8b0, cloud: 0xfbe8d8, fogD: 0.0017, lamps: 0, fireflies: 0, day: 0.85 },
  { h: 10, key: 0xfff1dc, keyI: 1.1, sky: 0xc4d8ff, gnd: 0xc8a070, hemiI: 0.95, ambI: 0.62, zen: 0x4a7ad8, haze: 0xf0e2cc, cloud: 0xfaf2ea, fogD: 0.0014, lamps: 0, fireflies: 0, day: 1 },
  { h: 15, key: 0xfff0d8, keyI: 1.1, sky: 0xc4d8ff, gnd: 0xc8a070, hemiI: 0.95, ambI: 0.62, zen: 0x4a7ad8, haze: 0xf0e0c8, cloud: 0xfaf0e6, fogD: 0.0014, lamps: 0, fireflies: 0, day: 1 },
  { h: 17.2, key: 0xffb46c, keyI: 1.0, sky: 0xb0b6e8, gnd: 0xb88050, hemiI: 0.85, ambI: 0.55, zen: 0x5a6cc0, haze: 0xf8c48c, cloud: 0xfcdcc0, fogD: 0.0018, lamps: 0.15, fireflies: 0, day: 0.85 },
  { h: 19, key: 0xff7a50, keyI: 0.5, sky: 0x7a70b8, gnd: 0x6a3a38, hemiI: 0.62, ambI: 0.5, zen: 0x2a2a70, haze: 0xe08070, cloud: 0xe8a8a0, fogD: 0.0022, lamps: 1, fireflies: 0.8, day: 0.3 },
  { h: 21, key: 0x7884e0, keyI: 0.22, sky: 0x3c3874, gnd: 0x1e1632, hemiI: 0.45, ambI: 0.5, zen: 0x0c0d28, haze: 0x30244e, cloud: 0x3c3464, fogD: 0.0015, lamps: 1, fireflies: 1, day: 0 },
  { h: 24, key: 0x7884e0, keyI: 0.2, sky: 0x3a3672, gnd: 0x1c1530, hemiI: 0.42, ambI: 0.5, zen: 0x0b0c26, haze: 0x2c224c, cloud: 0x3a3262, fogD: 0.0014, lamps: 1, fireflies: 0.55, day: 0 },
].map((k) => ({ ...k, key: C(k.key), sky: C(k.sky), gnd: C(k.gnd), zen: C(k.zen), haze: C(k.haze), cloud: C(k.cloud) }));

/** A season's look (A Wonderful Life's and Stardew's four palettes): the plants' colours, a tint on the light and the haze, the snow. */
export const SEASON_LOOK = {
  spring: { grass: 0x6fb85a, grassTip: 0xc6e88a, leaf: 0x7cc65e, leaf2: 0xb8e07a, blossom: 0xf6b8c8, flowers: [0xf6b8c8, 0xfff2a8, 0xc8b8f0, 0xffffff], light: 0xfff4f0, haze: 0xfff0f4, snow: 0, life: 1 },
  summer: { grass: 0x4f9a3e, grassTip: 0xa8d060, leaf: 0x4e9a3c, leaf2: 0x8cc04a, blossom: 0xfff2c0, flowers: [0xffd04a, 0xff8a5a, 0x7ab8ff, 0xffffff], light: 0xfff6e4, haze: 0xfff4e0, snow: 0, life: 1 },
  autumn: { grass: 0x9a9a48, grassTip: 0xe0b860, leaf: 0xd0863a, leaf2: 0xb4502a, blossom: 0xf0c070, flowers: [0xe8a040, 0xc85a3a, 0xf0d070, 0x9a5ab0], light: 0xffe4c4, haze: 0xffe0c0, snow: 0, life: 0.55 },
  winter: { grass: 0x8aa294, grassTip: 0xdce8e4, leaf: 0x7c9a8c, leaf2: 0xc8dcd8, blossom: 0xffffff, flowers: [0xffffff, 0xd0e4ff, 0xf6c8d0, 0xffe8a8], light: 0xe8f0ff, haze: 0xe8eef8, snow: 1, life: 0.15 },
};
for (const s of Object.values(SEASON_LOOK)) for (const k of ['grass', 'grassTip', 'leaf', 'leaf2', 'blossom', 'light', 'haze']) s[k] = C(s[k]);
for (const s of Object.values(SEASON_LOOK)) s.flowers = s.flowers.map(C);

/** The briar's colours (H6): the overcast the warm key fails to, the green-black of its shade, olive and rust, the grey of its air. */
const BRIAR = { key: C(0xb4b8a4), sky: C(0x6a7262), gnd: C(0x22241a), zen: C(0x4c5462), haze: C(0x9a9a82), cloud: C(0xa4a698), grass: C(0x6b6a38), tip: C(0x8a4a2a), leaf: C(0x5c5a30), leaf2: C(0x7a3e24) };
/** The moss garden at rest (briarK about 0.33): a cooler, mossier green, a softer key; still warm. */
const MOSS = { grass: C(0x4a7a52), leaf: C(0x4c7c50) };
const REST = 0.33;

const _a = new THREE.Color(), _b = new THREE.Color();
const desat = (c, k) => { if (k <= 0) return c; const l = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; return c.lerp(_b.setRGB(l, l, l), k); };
const hourOf = (ms) => (((ms % DAY_MS) + DAY_MS) % DAY_MS) / DAY_MS * 24;

/** A fresh mood for an hour (0..24), a season id and a briarK (0..1). Pure. */
export function moodAt({ hour = 12, season = 'summer', briarK = REST } = {}, out = null) {
  const m = out || blank();
  // the hour: the two keyframes round it
  let i = 0; while (i < MOOD_HOURS.length - 2 && MOOD_HOURS[i + 1].h <= hour) i++;
  const A = MOOD_HOURS[i], B = MOOD_HOURS[i + 1], t = sm(0, 1, (hour - A.h) / Math.max(1e-6, B.h - A.h));
  for (const k of ['key', 'sky', 'gnd', 'zen', 'haze', 'cloud']) m[k].copy(A[k]).lerp(B[k], t);
  for (const k of ['keyI', 'hemiI', 'ambI', 'fogD', 'lamps', 'fireflies', 'day']) m[k] = A[k] + (B[k] - A[k]) * t;
  // the season: the plants' colours, a tint on the light and the air
  const S = SEASON_LOOK[season] || SEASON_LOOK.summer;
  m.season = season in SEASON_LOOK ? season : 'summer';
  m.key.multiply(S.light); m.haze.multiply(S.haze); m.cloud.multiply(S.haze);
  m.grass.copy(S.grass); m.grassTip.copy(S.grassTip); m.leaf.copy(S.leaf); m.leaf2.copy(S.leaf2); m.blossom.copy(S.blossom);
  m.flowers.length = S.flowers.length; S.flowers.forEach((c, j) => { (m.flowers[j] ||= new THREE.Color()).copy(c); });
  m.snow = S.snow;
  // the briar: bloom below rest, the moss garden at rest, the grade past the edge
  const k = Math.min(1, Math.max(0, briarK));
  m.bloom = 1 - sm(0, REST, k); m.moss = sm(0, REST, k) * (1 - sm(0.45, 0.7, k)); m.briar = sm(0.4, 0.95, k);
  const b = m.briar;
  m.keyI *= (1 + 0.08 * m.bloom) * (1 - 0.45 * b);
  m.key.lerp(BRIAR.key, 0.8 * b); m.sky.lerp(BRIAR.sky, 0.6 * b); m.gnd.lerp(BRIAR.gnd, 0.55 * b);
  m.zen.lerp(BRIAR.zen, 0.5 * b); m.haze.lerp(BRIAR.haze, 0.7 * b); m.cloud.lerp(BRIAR.cloud, 0.6 * b);
  m.fogD *= 1 + 0.8 * b;
  m.grass.lerp(MOSS.grass, 0.35 * m.moss).lerp(BRIAR.grass, 0.75 * b); m.grassTip.lerp(BRIAR.tip, 0.6 * b);
  m.leaf.lerp(MOSS.leaf, 0.3 * m.moss).lerp(BRIAR.leaf, 0.7 * b); m.leaf2.lerp(BRIAR.leaf2, 0.7 * b);
  for (const c of [m.key, m.sky, m.zen, m.haze, m.cloud, m.grass, m.leaf, m.blossom, ...m.flowers]) desat(c, 0.45 * b);
  // the small lives and the wind: by the hour, the season and the briar
  const life = S.life * (1 - b);
  m.bees = sm(0.6, 1, m.day) * life * (0.6 + 0.4 * m.bloom);
  m.butterflies = sm(0.5, 1, m.day) * life;
  m.dragonflies = sm(0.6, 1, m.day) * Math.min(1, S.life + 0.2) * (1 - b);
  m.fireflies *= (season === 'winter' ? 0.1 : 1) * (1 - b);
  m.moths = (1 - m.day) * 0.4 + b * 0.8;
  m.lamps *= 1 - 0.5 * b; // (the lamps gutter in the briar: looks flicker them by `briar`)
  m.wind.strength = 0.35 + 0.25 * b + (season === 'autumn' ? 0.15 : 0);
  m.wind.gust = 0.5 + 0.4 * b;
  m.wind.nervous = b;
  return m;
}

function blank() {
  const c = () => new THREE.Color();
  return { key: c(), sky: c(), gnd: c(), zen: c(), haze: c(), cloud: c(), grass: c(), grassTip: c(), leaf: c(), leaf2: c(), blossom: c(), flowers: [],
    keyI: 1, hemiI: 1, ambI: 1, fogD: 0.0015, lamps: 0, fireflies: 0, bees: 0, butterflies: 0, dragonflies: 0, moths: 0, day: 1, snow: 0,
    wind: { strength: 0.35, gust: 0.5, nervous: 0 }, season: 'summer', briar: 0, bloom: 0, moss: 0 };
}

const EASE = 0.6; // (per real second: a phase or a change of the dial turns over seconds, never in a frame)
const LERPED = ['key', 'sky', 'gnd', 'zen', 'haze', 'cloud', 'grass', 'grassTip', 'leaf', 'leaf2', 'blossom'];
const NUMS = ['keyI', 'hemiI', 'ambI', 'fogD', 'lamps', 'fireflies', 'bees', 'butterflies', 'dragonflies', 'moths', 'day', 'snow', 'briar', 'bloom', 'moss'];

let current = null;
/** The garden's mood now, for a look that has no game to ask (a planetoid's grounds): null before the first frame. */
export const gardenMoodNow = () => current?.now ?? null;

export class GardenMood {
  constructor(game) {
    this.game = game; this.now = null; this.target = blank(); current = this;
    this.override = null; // ({ hour?, season?, briarK? }: a stage or a tester pins any of them)
  }

  /** The garden's mood now, eased toward the hour's, the season's and the briar's. */
  update(raw = 1 / 60) {
    const g = this.game, o = this.override || {};
    const hour = o.hour ?? hourOf(calNow());
    let season = o.season; if (!season) { try { season = seasonOf().id; } catch { season = 'summer'; } }
    const briarK = o.briarK ?? (g?.harmony?.briarK ? g.harmony.briarK() : REST);
    moodAt({ hour, season, briarK }, this.target);
    if (!this.now) { this.now = blank(); this.copy(this.target, this.now); return this.now; }
    const k = 1 - Math.exp(-raw * EASE), N = this.now, T = this.target;
    for (const key of LERPED) N[key].lerp(T[key], k);
    for (const key of NUMS) N[key] += (T[key] - N[key]) * k;
    N.flowers.length = T.flowers.length; T.flowers.forEach((c, j) => { (N.flowers[j] ||= c.clone()).lerp(c, k); });
    N.wind.strength += (T.wind.strength - N.wind.strength) * k; N.wind.gust += (T.wind.gust - N.wind.gust) * k; N.wind.nervous += (T.wind.nervous - N.wind.nervous) * k;
    N.season = T.season;
    return N;
  }
  copy(a, b) { for (const key of LERPED) b[key].copy(a[key]); for (const key of NUMS) b[key] = a[key]; b.flowers = a.flowers.map((c) => c.clone()); Object.assign(b.wind, a.wind); b.season = a.season; }

  /** The garden's lights, fog and dome from the mood (realm.light(), after the world's hour has set its own): the key on the sun, the cool
   *  fill on the hemisphere with the ground's warm bounce, the ambient lowered so the key's side reads, the haze for the fog. */
  apply(realm) {
    const g = this.game, M = this.update(g.rawDt ?? 1 / 60), sc = g.scene, S = realm.site?.sky;
    S?.set({ draught: g.draughtHex ?? null, night: 1 - M.day, mood: M });
    if (sc.fog) { sc.fog.color.copy(S ? S.fog : M.haze); sc.fog.density = M.fogD; }
    if (sc.background?.isColor) sc.background.copy(S ? S.fog : M.haze);
    const K = realm.kept, Lt = g.dunes?.lights; if (!K?.hemiSky || !Lt) return M;
    Lt.hemi.color.copy(M.sky); Lt.hemi.groundColor.copy(M.gnd);
    Lt.hemi.intensity = K.hemiI * M.hemiI; Lt.amb.intensity = K.ambI * M.ambI;
    Lt.sun.color.copy(M.key); Lt.sun.intensity *= M.keyI; // (main.js sets the sun's intensity afresh each frame; the garden's share on it)
    return M;
  }
}
