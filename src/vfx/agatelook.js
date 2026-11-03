// ---------------------------------------------------------------------------------------
// THE AGATE ON A BODY (GAPS G326; docs/plans/WHEEL.md 3): a creature feeling two things at once shows them as one, wedged and never
// blended. The clip shows the strongest feeling (the body's runtime: Petra's), the flame's height its strength, the flame's colour the
// second. One job: the look; the feelings are the mind's (WHEEL.md 3: a creature's mood module, `shown() -> { a, b?, k }`, Petra's,
// not built), read here and only read.
//
//   THE LANTERN WISP  its own flame is the carrier (vfx/lanternwisplook.js asks `state(c)`): the flame bones stretched by the strength,
//                     its core (the bright of its own emissive map) in the strongest feeling's colour, its skin (the dim edge of the
//                     same cards) in the second's; the lent lamp warmed toward the strongest. One feeling alone: core and skin the same.
//   ANY OTHER BODY    (the slip jelly first) lit from inside in the strongest's colour (vfx/temper.js look().glow, which the body adds
//                     to its emissive), by the strength, breathing; and 'agate.flame' held on its crown in the second's colour, its
//                     height the strength (vfx/library/agate.js).
//   TWO-TONE          the knack's look (G314; its rule Dovina's: shown only while `game.knacks.on('twoTone')`): both colours marbled
//                     over the body as two veins ('agate.vein' played once a feeling), so the agate is read at a glance.
//
// Where the feelings come from, first found wins: `c.mood.shown()` or `c.shown()` (WHEEL.md 3, Petra's), else `c.agateTest`
// ({ a, b, k }: the placeholder `/agatelook` sets in DEBUG, for the look's own test until the mind has one). Nothing there: no look,
// and every body is exactly as it was.
//
// Prior art: agateware (Espada's word: two clays wedged, never blended), Plutchik's dyads (6 Seconds' wheel, WHEEL.md), the candle's
// flame as a body's mood (the Wisp's own lantern; Spirited Away's soot sprites and Calcifer, whose flame is his temper), Okami's and
// Ico's restraint: the state in the surface, never a label (vfx/temper.js).
//
//   game.agateLook = new AgateLook(game)   update(dt) (the fx phase)
//   agateLook.state(c) -> { w 0..1 how present, k 0..1 strength, core THREE.Color, skin THREE.Color, h height share } | null
//   agateLook.glow(c)  -> THREE.Color (add to emissive) | null        agateLook.bare(c) -> a temper look for a creature temper never saw
//   agateShown(c) -> { a, b, k } | null                               agateFlameShader(mat) -> its uniforms (the Wisp's flame cards)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR, ASPECTS, OPPOSITE } from '../progress/weather.js';

/** Its numbers. ease: how fast the look follows the mind (/s); lift: the least lightness a feeling's colour is shown at (Dread's
 *  ink-green is too dark to glow); flame: the Wisp's flame bones' stretch, [none, full] strength, its core's edge in the emissive
 *  map's brightness; glow: a body's inner light, [none, full] strength and its breath (Hz); crown: the crown flame's height in the
 *  body's height, [none, full], and where it stands; reach: how far from the camera a body's look is kept (m). */
export const AGATE_LOOK = {
  ease: 2.5, lift: 0.5,
  flame: { h: [0.7, 1.75], w: [0.9, 1.15], edge: [0.3, 0.78], light: 0.85 },
  glow: { k: [0.1, 0.45], breath: 0.7 },
  crown: { h: [0.25, 0.9], at: 0.92 },
  reach: 60,
};

const _c = new THREE.Color(), _v = new THREE.Vector3(), _hsl = { h: 0, s: 0, l: 0 };
/** A feeling's colour as a light: its hue, lifted to AGATE_LOOK.lift where it is darker. */
export function litColour(aspect, out = new THREE.Color()) {
  out.set(COLOR[aspect] ?? 0xffffff); out.getHSL(_hsl);
  if (_hsl.l < AGATE_LOOK.lift) out.setHSL(_hsl.h, Math.min(1, _hsl.s * 1.1), AGATE_LOOK.lift);
  return out;
}

/** What a creature feels, as the look reads it: { a the strongest, b the second (a when alone), k 0..1 }, or null. Opposites never
 *  wedge (they cancel: WHEEL.md 2), so an opposed second is dropped and the strength halved. */
export function agateShown(c) {
  const s = c?.mood?.shown?.() ?? c?.shown?.() ?? c?.agateTest ?? null;
  if (!s || !COLOR[s.a]) return null;
  let b = COLOR[s.b] ? s.b : s.a, k = THREE.MathUtils.clamp(s.k ?? 0.5, 0, 1);
  if (b !== s.a && OPPOSITE[s.a] === b) { b = s.a; k *= 0.5; }
  return { a: s.a, b, k };
}

/** The Wisp's flame cards (LW_Flame, alpha-masked, an emissive map): their core and skin coloured by the agate, inside one program
 *  (the cache key is shared, so every wisp's flame is one). w 0: exactly the flame as made. */
export function agateFlameShader(mat) {
  const u = { uAgW: { value: 0 }, uAgCore: { value: new THREE.Color(1, 1, 1) }, uAgSkin: { value: new THREE.Color(1, 1, 1) }, uAgEdge: { value: new THREE.Vector2(...AGATE_LOOK.flame.edge) } };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uAgW; uniform vec3 uAgCore; uniform vec3 uAgSkin; uniform vec2 uAgEdge;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
	if ( uAgW > 0.001 ) {
	#ifdef USE_EMISSIVEMAP
		float agL = max( emissiveColor.r, max( emissiveColor.g, emissiveColor.b ) );
	#else
		float agL = 1.0;
	#endif
		vec3 agC = mix( uAgSkin, uAgCore, smoothstep( uAgEdge.x, uAgEdge.y, agL ) );
		totalEmissiveRadiance = mix( totalEmissiveRadiance, emissive * agC * ( 0.3 + 1.3 * agL ), uAgW );
	}`);
  };
  mat.customProgramCacheKey = () => 'agate-flame';
  mat.needsUpdate = true;
  return u;
}

export class AgateLook {
  constructor(game) {
    this.game = game; this.t = 0;
    this.rec = new WeakMap(); // creature -> { w, k, core, skin, a, b, glow, bare, held: { flame, veinA, veinB } }
    this.live = new Set(); // (the creatures with a look held: walked every frame, dropped when they have none)
    this.twoToneTest = false; // (`/agatelook twotone on`: the knack's look previewed in DEBUG, never its rule)
  }

  /** Is the Two-Tone knack's look on? (Dovina's knack: `game.knacks.on('twoTone')`; the DEBUG preview beside it.) */
  twoTone() { return !!(this.game.knacks?.on?.('twoTone') || (this.twoToneTest && this.game.mode === 'debug')); }

  /** The eased look on a creature, or null while it has none. */
  state(c) { const R = this.rec.get(c); return R && R.w > 0.002 ? R : null; }
  /** A body's inner light this frame (its strongest feeling's), or null. */
  glow(c) { const R = this.state(c); return R && !R.flamed ? R.glow : null; }
  /** A temper look for a creature the temper never registered (it has no agitation to show): the inner light alone. */
  bare(c) { const R = this.state(c); if (!R || R.flamed) return null; return (R.bare ||= { gloss: 0.5, glow: R.glow, tremble: 0 }); }

  update(dt) {
    this.t += dt;
    if (!this.cmd && this.game.chat?.add) this.command();
    const list = this.game.creatures?.list; if (!list) return;
    for (const c of list) { const s = agateShown(c); if (s || this.live.has(c)) this.step(c, s, dt); }
    for (const c of this.live) if (!list.includes(c)) this.drop(c); // (a creature taken out of the registry: its looks with it)
  }

  step(c, s, dt) {
    const A = AGATE_LOOK, e = 1 - Math.exp(-dt * A.ease);
    let R = this.rec.get(c);
    if (!R) { R = { w: 0, k: 0, h: 0, core: new THREE.Color(1, 1, 1), skin: new THREE.Color(1, 1, 1), glow: new THREE.Color(), a: null, b: null, flamed: !!c.look?.mats?.flame?.length, held: {} }; this.rec.set(c, R); }
    this.live.add(c);
    const on = !!s && c.alive !== false && c.root?.visible !== false;
    R.w += ((on ? 1 : 0) - R.w) * e;
    if (s) { R.k += (s.k - R.k) * e; R.core.lerp(litColour(s.a, _c), e); R.skin.lerp(litColour(s.b, _c), e); R.a = s.a; R.b = s.b; }
    R.h = A.flame.h[0] + (A.flame.h[1] - A.flame.h[0]) * R.k;
    const breath = 1 + 0.18 * Math.sin(this.t * Math.PI * 2 * A.glow.breath + (c.id || 0));
    R.glow.copy(R.core).multiplyScalar((A.glow.k[0] + (A.glow.k[1] - A.glow.k[0]) * R.k) * R.w * breath);
    this.hold(c, R, on);
    if (!on && R.w < 0.002) { this.release(R); this.live.delete(c); }
  }

  /** The held effects: the crown flame (a body with no flame), the Two-Tone veins (any body). */
  hold(c, R, on) {
    const V = this.game.vfx; if (!V || !c.pos) return;
    const cam = this.game.camera?.position, near = !cam || cam.distanceToSquared(c.pos) < AGATE_LOOK.reach ** 2;
    const H = c.height || 1, C = AGATE_LOOK.crown;
    this.keep(R, 'flame', !R.flamed && on && near, 'agate.flame', R.b, c, H * C.at, H * (C.h[0] + (C.h[1] - C.h[0]) * R.k), R.w);
    const two = on && near && this.twoTone() && R.a && R.b && R.a !== R.b;
    const bodyY = c.center ? c.center(_v).y - c.pos.y : H * 0.5; // (its own middle: the Wisp's clay hangs over its hover)
    this.keep(R, 'veinA', two, 'agate.vein', R.a, c, bodyY, H * (R.flamed ? 0.55 : 1), R.w);
    this.keep(R, 'veinB', two, 'agate.vein', R.b, c, bodyY, H * (R.flamed ? 0.55 : 1), R.w * 0.85);
  }

  keep(R, key, want, name, feeling, c, y, scale, k) {
    let h = R.held[key];
    if (h && (h.feeling !== feeling || !h.alive)) { h.stop?.(); h = R.held[key] = null; } // (its feeling changed: skinned again)
    if (!want || !feeling) { if (h) { h.stop?.(); R.held[key] = null; } return; }
    if (!h) { h = R.held[key] = this.game.vfx.play(name, { pos: new THREE.Vector3(c.pos.x, c.pos.y + y, c.pos.z), feeling, scale }); if (!h) return; h.feeling = feeling; }
    h.pos.set(c.pos.x, c.pos.y + y, c.pos.z); h.ctx.scale = scale; h.k = k;
  }

  release(R) { for (const key of Object.keys(R.held)) { R.held[key]?.stop?.(); R.held[key] = null; } }
  drop(c) { const R = this.rec.get(c); if (R) this.release(R); this.rec.delete(c); this.live.delete(c); }

  /** `/agatelook`: DEBUG's lever for the look's own test until the mind has a mood (WHEEL.md 3). */
  command() {
    this.cmd = true;
    this.game.chat.add('agatelook', { debug: true, help: `the agate on a body (DEBUG): /agatelook <${ASPECTS.join(' | ')}> [second] [strength 0..1] on creatures within 25 m; /agatelook off; /agatelook twotone on|off`, run: (args) => { const m = this.run(args); if (m) this.game.log?.say?.('system', m, { key: 'agatelook', throttle: 0.2 }); } });
  }

  run(args = []) {
    const g = this.game;
    const [w0, w1, w2] = args.map((x) => String(x).toLowerCase());
    if (w0 === 'twotone') { this.twoToneTest = w1 !== 'off'; return `Two-Tone's look ${this.twoToneTest ? 'on' : 'off'} (a preview: the knack is Dovina's)`; }
    const P = g.player?.pos; const near = P ? g.creatures?.near?.(P, 25) ?? [] : [];
    if (w0 === 'off' || !w0) { for (const c of g.creatures?.list ?? []) delete c.agateTest; return 'agate looks off'; }
    if (!COLOR[w0]) return `No feeling "${w0}": ${ASPECTS.join(', ')}.`;
    const b = COLOR[w1] ? w1 : w0, k = Number.isFinite(+(COLOR[w1] ? w2 : w1)) ? +(COLOR[w1] ? w2 : w1) : 0.6;
    for (const c of near) c.agateTest = { a: w0, b, k };
    return `${near.length} creature(s) feel ${w0}${b !== w0 ? ` and ${b}` : ''} at ${k}`;
  }
}
