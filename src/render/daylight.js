// ---------------------------------------------------------------------------------------
// THE DAYLIGHT: the light on the open ground, by the hour of the game day and the weather over it. The sky's paintings are graded by
// the hour (vfx/weather.js `hourGrade`, vfx/sky.js); this lays the same hour on what the sky shines on, so a night sky never hangs over
// sand lit as by day. It grades the dunes' open-air light (`game.dunes.away`: the sun, the hemisphere, the ambient, the fog, the
// background) from the values they were built with, which are the maker's dusk; the dunes go on blending that with the workshop's own
// light as you come and go (`dunes.mix`), so a roofed room keeps its own light. The weather over the place dims and tints it (the
// weather look's `fogOf` and its sky exposure), and a far bolt in the pall lifts it a little (`look.lift`), never a flash.
//
// Prior art: Wind Waker's and Majora's Mask's time of day (the sun's colour and the fog keyed by the hour, blended between a few
// authored keys, never computed from physics), Okami's painted skies graded by the hour, and the sixth generation's habit of tinting
// one fog to the sky's horizon so the far world melts into the painting.
//
//   game.daylight = new Daylight(game) (after the dunes and the weather look)   .update(dt) (each tick, before dunes.update)
//   .k { day, night } (the hour's shares: the rest is dusk)   with no `game.weather`, the dusk as the maker painted it
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { hourGrade, fogOf, LOOK } from '../vfx/weather.js';

// the keys: the maker's dusk is the base (dunes.js `away`); the day and the night are blended over it by the hour. Their horizons are
// the owner's paintings' own (sky_day.webp about #b8d4e8, sky_night.webp about #280a17), so the fog melts into the sky at every hour
const DAY = { bg: 0xb8d4e8, fog: 0xc6d6e0, fogK: 0.8, hemiSky: 0xdfeaf4, hemiGnd: 0xc89a70, hemiI: 2.0, ambI: 0.3, sunC: 0xfff1dc, sunI: 3.6 };
const NIGHT = { bg: 0x280a17, fog: 0x2e1626, fogK: 0.9, hemiSky: 0x4c3a7a, hemiGnd: 0x1e1430, hemiI: 0.45, ambI: 0.16, sunC: 0x9aa6ff, sunI: 0.35 };
const COLOURS = ['bg', 'fog', 'hemiSky', 'hemiGnd', 'sunC'], NUMBERS = ['fogD', 'hemiI', 'ambI', 'sunI'];
const RATE = 1.5; // (how fast the light eases to its target, per second: the hour moves slowly, a weather comes in over seconds)
const _c = new THREE.Color();

export class Daylight {
  constructor(game) {
    this.game = game;
    const A = game.dunes?.away;
    this.base = A ? Object.fromEntries([...COLOURS.map((k) => [k, A[k].clone()]), ...NUMBERS.map((k) => [k, A[k]])]) : null;
    this.goal = this.base ? Object.fromEntries([...COLOURS.map((k) => [k, A[k].clone()]), ...NUMBERS.map((k) => [k, A[k]])]) : null;
    this.k = { day: 0, night: 0 };
    this.wx = { aspect: null, strength: 0 }; // (the weather's share, eased: it comes in over seconds)
    this.poll = 0;
    this.day = Object.fromEntries(Object.entries(DAY).map(([k, v]) => [k, typeof v === 'number' && COLOURS.includes(k) ? new THREE.Color(v) : v]));
    this.night = Object.fromEntries(Object.entries(NIGHT).map(([k, v]) => [k, typeof v === 'number' && COLOURS.includes(k) ? new THREE.Color(v) : v]));
  }

  /** Twice a second the target from the hour and the weather; every tick the light eased toward it. */
  update(dt) {
    const g = this.game, W = g.weather, A = g.dunes?.away, B = this.base;
    if (!W?.sky || !A || !B) return;
    if ((this.poll -= dt) <= 0) { this.poll = 0.5; this.target(W.sky()); }
    const T = this.goal, e = 1 - Math.exp(-dt * RATE);
    for (const k of COLOURS) A[k].lerp(T[k], e);
    for (const k of NUMBERS) A[k] += (T[k] - A[k]) * e;
    A.hemiI = Math.max(0, A.hemiI) + (g.weatherLook?.lift || 0) * 4 * e; // (a far bolt's slow glow in the cloud: a lift, never a flash)
  }

  /** The light the hour and the weather ask for. */
  target(sky) {
    const B = this.base, T = this.goal, D = this.day, N = this.night;
    const h = hourGrade(sky.phase ?? 0), d = h.day, n = h.night;
    this.k.day = d; this.k.night = n;
    for (const k of COLOURS) T[k].copy(B[k]).lerp(D[k], d).lerp(N[k], n);
    T.fogD = B.fogD * THREE.MathUtils.lerp(1, DAY.fogK, d) * THREE.MathUtils.lerp(1, NIGHT.fogK, n);
    for (const k of ['hemiI', 'ambI', 'sunI']) T[k] = THREE.MathUtils.lerp(THREE.MathUtils.lerp(B[k], D[k], d), N[k], n);
    // the weather over the place: its fog's colour and thickness, and the light dimmed as its sky is (a pall darkens, a sunshower warms)
    const a = sky.aspect, s = sky.strength || 0, F = a ? fogOf(a, s) : null, expo = a ? THREE.MathUtils.lerp(1, LOOK[a]?.sky?.expo ?? 1, s) : 1;
    if (F) { T.fog.lerp(_c.copy(F.colour), 0.8 * s); T.bg.lerp(_c, 0.5 * s); T.fogD *= F.density; }
    T.sunI *= expo; T.hemiI *= expo; T.ambI *= Math.sqrt(expo);
  }
}
