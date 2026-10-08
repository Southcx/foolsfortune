// ---------------------------------------------------------------------------------------
// THE BATH (docs/plans/SOUL-ALCHEMY.md 4.4 to 4.11; the glossary: moved from the drum's pool to the basin): the colour wheel, a dish of
// still black Lachryma at the spirit press's feet. ONE mesh and ONE shader draw the liquid and everything in it (4.22):
//   the DISH's depth     pale over the grey centre (a disc of bare clay, wheelColour's own grey, so a new soul's bead melts into it),
//                        deepening to black at the lip: how grey the soul is reads as how pale and shallow the water under the bead is
//   the THROWING LINES   three faint grooves seen through the liquid (a third out, on the tiles' circle, at the lip): distance without colour
//   the MENISCUS         the liquid climbing the kerb, the only place the oil film's colours may show (on the face they would lie)
//   the SPREADS          a seasoned tile's glaze run onto the bath round it, translucent, out to its radius now; its BREAK a thin
//                        pale line where the glaze thins (by lightness, for every eye); brightened and held while the ghost bead is over it
//   the INWARD RINGS     in the spread the soul bead is in: crests running toward a tile's heart, quick near the break, slower as the
//                        bead nears, stilled inside a tile's heart (motion, never a blink); one spread at a time
//   the FOLD             a dull grey ring folding in toward the grey centre as a complement greys the bead
//   the DRAUGHT'S CURRENT streaks of the film's own pale sheen drifting toward the draught's bearing, in its feeling's motif (wonder's
//                        motes, mirth's thrown facets, desire's wind-ripples, grief's long streaks, dread's smoke), never a tint; the
//                        meniscus brims and trembles with it
//   the STIR             three slow arms of sheen while the press runs
// The bath is self-lit and neutral (Albers: a colour is judged on a grey ground), unfogged, and its colour is undone from the frame's
// grade (vfx/selflit.js), so the black stays black and not the grade's indigo. Over it lie the marks (vfx/alchemy/marks.js), which this
// module fills for the seven TILES (their glaze, their clay body by rank, gilt at 10, a tile's heart, the yohen stars), the SOUL BEAD
// and the GHOST BEAD.
//
// Prior art: the glaze test tile and its run onto the kiln shelf (Ian Currie, Revealing Glazes), the tsukubai's still water, Josef
// Albers' Interaction of Color (the neutral ground, a match seen as a lost edge), Potion Craft's map (the bead you steer), Wanda's
// beating made visible (the rings stilling at a tile's heart), and the oil film of the game's Lachryma (vfx/liquid.js) kept to the edge.
//
//   const B = new Bath(group, marks, { R })   B.tiles([{ h, s, r, bare, rank?, stars? }])   B.bead({ h, s }, { viewing, draught, walking })
//   B.ghostBead({ h, s } | null, greys)   B.active (the tile the soul bead is in, or -1)   B.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SELF_LIT_GLSL, selfLitUniforms, syncSelfLit } from '../selflit.js';
import { wheelColour } from '../wheelcolour.js';
import { RANGE, MARK, RING_K } from './marks.js';
import { DISH, wheelPoint } from './basin.js';
import { FEELING_HUE } from '../../progress/alchemy.js';

const BODY = [0xa3927a, 0x94482c, 0x94482c, 0x94482c, 0x77746f, 0x77746f, 0x77746f, 0xeceae4, 0xeceae4, 0xeceae4, 0xd8a640]; // (the folk's ladder by rank: raw clay, earthenware, stoneware, porcelain, the Prince's gilt)
const MOTIF = { wonder: 0, mirth: 1, desire: 2, grief: 3, dread: 4 };
const H = { tile: 0.018, ghost: 0.032, bead: 0.036, ring: 0.03 }; // (metres over the liquid: every face 1.5 cm or more off it, casebook rule 1)
const BEAD = { r: 0.06, ghost: 0.07 }; // (metres: the soul bead is 12 cm across, 4.7)

const VERT = /* glsl */`varying vec2 vP; void main() { vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }`;
const FRAG = /* glsl */`
uniform float uR, uTime, uStir, uBrim; uniform vec4 uTile[ 7 ]; uniform vec3 uGlaze[ 7 ]; uniform float uBreak[ 7 ];
uniform vec4 uRing; uniform vec2 uFold; uniform vec4 uCurrent; uniform vec3 uClay; uniform vec4 uDish;
varying vec2 vP;
${SELF_LIT_GLSL}
float hash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
float noise( vec2 p ) { vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f ); return mix( mix( hash( i ), hash( i + vec2( 1, 0 ) ), f.x ), mix( hash( i + vec2( 0, 1 ) ), hash( i + 1.0 ), f.x ), f.y ); }
float line( float d, float hw, float px ) { return 1.0 - smoothstep( hw, hw + px, abs( d ) ); }
// the draught's current: a pale sheen in its feeling's motif, carried along the flow (q.x along it, q.y across)
float motif( vec2 q, float m ) {
  if ( m < 0.5 ) { vec2 c = floor( q * 2.5 ), o = ( vec2( hash( c + 3.1 ), hash( c + 7.7 ) ) - 0.5 ) * 0.5; float d = length( fract( q * 2.5 ) - 0.5 - o ) / 2.5; return step( 0.86, hash( c ) ) * ( 1.0 - smoothstep( 0.03, 0.06, d ) ); }
  if ( m < 1.5 ) { vec2 c = floor( q * 2.2 ), f = ( fract( q * 2.2 ) - 0.5 ) / 2.2; float h = hash( c ), a = h * 6.2832; f = mat2( cos( a ), -sin( a ), sin( a ), cos( a ) ) * f; return step( 0.78, h ) * ( 1.0 - smoothstep( 0.05, 0.08, abs( f.x ) + abs( f.y ) * 2.0 ) ); }
  if ( m < 2.5 ) return smoothstep( 0.55, 0.9, noise( vec2( q.x * 1.6, q.y * 6.0 ) ) ) * smoothstep( 0.3, 0.7, noise( q * 0.8 + 4.0 ) );
  if ( m < 3.5 ) return smoothstep( 0.66, 0.92, noise( vec2( q.x * 0.6, q.y * 9.0 ) ) );
  return smoothstep( 0.5, 0.85, noise( q * 1.3 ) * 0.6 + noise( q * 2.9 + 1.7 ) * 0.4 );
}
void main() {
  float rho = length( vP ), s = rho / uR, px = max( fwidth( rho ), 1e-4 );
  // the dish: the grey centre's bare clay, then the floor darkening with the liquid's depth toward the lip
  float k = pow( clamp( 1.0 - s, 0.0, 1.0 ), uDish.y );
  vec3 c = rho < uDish.x ? uClay : uClay * ( 0.82 * k + 0.004 );
  c *= 1.0 - 0.18 * line( rho - uDish.x, max( 0.006, 0.5 * px ), px ); // (the clay disc's edge)
  // the throwing lines: a groove and its ridge just outside, faint, through the liquid
  for ( int i = 0; i < 3; i++ ) {
    float r = ( i == 0 ? uDish.z : i == 1 ? uDish.w : 0.985 ) * uR, hw = max( 0.008, 0.6 * px );
    c *= 1.0 - 0.3 * line( rho - r, hw, px );
    c += uClay * 0.035 * line( rho - r - 2.2 * hw - px, hw, px );
  }
  // the stir while pressing, and the draught's current: sheen, never a colour
  float ang = atan( vP.y, vP.x ), inside = 1.0 - smoothstep( uR * 0.9, uR * 0.97, rho );
  float sheen = uStir * 0.05 * smoothstep( 0.75, 1.0, 0.5 + 0.5 * cos( 3.0 * ( ang + rho * 1.1 ) - uTime * 0.5 ) ) * smoothstep( 0.1, 0.6, s );
  if ( uCurrent.z > 0.001 ) {
    vec2 dir = uCurrent.xy, q = vec2( dot( vP, dir ), dot( vP, vec2( -dir.y, dir.x ) ) );
    q.x -= uTime * ( uCurrent.w > 3.5 ? 0.08 : 0.13 ); // (slow: about 6 px a second at the widest view)
    sheen += uCurrent.z * 0.035 * motif( q, uCurrent.w );
  }
  c += vec3( sheen * inside );
  // the seven spreads: the glaze run onto the bath to the swatch's radius now; its break a thin pale line
  for ( int i = 0; i < 7; i++ ) {
    vec4 T = uTile[ i ]; float d = length( vP - T.xy );
    if ( T.w > T.z + 0.005 && d > T.z - 0.02 && d < T.w + 4.0 * px ) {
      float u = clamp( ( d - T.z ) / ( T.w - T.z ), 0.0, 1.0 ), cov = 1.0 - smoothstep( T.w - px, T.w, d );
      vec3 g = mix( c, uGlaze[ i ] * 0.62, mix( 0.85, 0.5, u ) );
      g += uGlaze[ i ] * 0.07 * smoothstep( 0.6, 1.0, sin( ( d - T.z ) * 9.0 + 1.2 ) ) * ( 1.0 - u ); // (the spread's gloss)
      if ( abs( float( i ) - uRing.x ) < 0.5 && uRing.z > 0.001 ) {
        float crest = pow( 0.5 + 0.5 * sin( d * ${RING_K.toFixed(1)} + uRing.y ), 3.0 );
        g = mix( g, mix( g, vec3( 1.0 ), 0.16 ), crest * uRing.z * ( 1.0 - smoothstep( 0.8, 1.0, u ) ) );
      }
      c = mix( c, g, cov );
      float bw = max( 0.008, 0.9 * px );
      c = mix( c, mix( uGlaze[ i ], vec3( 1.0 ), 0.42 + 0.4 * uBreak[ i ] ), line( d - T.w + bw, bw, px ) * ( 0.75 + 0.25 * uBreak[ i ] ) );
    }
  }
  // the fold: a dull grey ring closing on the grey centre while a complement greys the bead
  c = mix( c, uClay * 0.42, uFold.y * line( rho - uFold.x, max( 0.012, 1.0 * px ), px ) );
  // the meniscus: the liquid climbing the kerb; the oil film's colours live here and nowhere else
  float wm = max( 0.035, 2.5 * px ) * ( 1.0 + uBrim * ( 0.6 + 0.25 * sin( ang * 7.0 + uTime * 2.2 ) ) );
  float men = smoothstep( uR - wm, uR - 0.002, rho );
  float f = rho * 3.0 + ang * 0.5 + uTime * 0.05;
  vec3 film = 0.5 + 0.5 * cos( 6.2832 * ( f + vec3( 0.0, 0.33, 0.67 ) ) );
  c = mix( c, vec3( 0.16 ) + film * 0.1, men * 0.85 );
  gl_FragColor = vec4( selfLit( c ), 1.0 );
  #include <colorspace_fragment>
}`;

const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _c = new THREE.Color(), _c2 = new THREE.Color();
const ease = (v, to, k) => (Math.abs(to - v) < 1e-3 ? to : v + (to - v) * Math.min(1, k));
export class Bath {
  constructor(group, marks, { R = 2.5 } = {}) {
    this.R = R; this.marks = marks;
    this.u = {
      uR: { value: R }, uTime: { value: 0 }, uStir: { value: 0 }, uBrim: { value: 0 },
      uTile: { value: Array.from({ length: 7 }, () => new THREE.Vector4()) }, uGlaze: { value: Array.from({ length: 7 }, () => new THREE.Color()) }, uBreak: { value: new Array(7).fill(0) },
      uRing: marks.uniforms.uRing, uFold: { value: new THREE.Vector2() }, uCurrent: { value: new THREE.Vector4() },
      uClay: { value: wheelColour(0, 0) }, uDish: { value: new THREE.Vector4(DISH.centre, DISH.depth, DISH.lines[0], DISH.lines[1]) }, ...selfLitUniforms(),
    };
    const geo = new THREE.CircleGeometry(R + 0.04, 160).rotateX(-Math.PI / 2); // (its rim runs under the kerb's arris: the two cross on a line, never share a plane)
    this.mat = new THREE.ShaderMaterial({ name: 'press-bath', uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG, toneMapped: false, fog: false });
    const m = (this.mesh = new THREE.Mesh(geo, this.mat)); m.name = 'press-bath-liquid'; m.renderOrder = 1; group.add(m);
    this.T = []; this.active = -1; this.shown = 1; this.gloss = 1; this.last = null; this.still = 0; this.moving = false;
    this.phase = 0; this.amp = 0; this.fold = null; this.stop = null; this.brk = new Array(7).fill(0); this.brkTo = -1; this.cur = 0; this.t0 = performance.now();
  }

  /** The seven tiles: each at its target's place, its width its rank's radius, its spread out to its radius now. */
  tiles(list) {
    const m2 = 2 * this.R, [i0] = RANGE.tiles;
    list.slice(0, 7).forEach((t, i) => {
      const rank = t.rank ?? rankOf(t.bare), bare = t.bare * m2, now = rank >= 10 ? bare : Math.max(bare, t.r * m2); // (a finished tile has no spread)
      wheelPoint(t.h, t.s, this.R, _p); const T = (this.T[i] ||= {}); Object.assign(T, { x: _p.x, z: _p.z, bare, now, rank, h: t.h, s: t.s });
      wheelColour(t.h, t.s, _c); _c2.setHex(BODY[Math.max(0, Math.min(10, Math.round(rank)))]);
      this.u.uTile.value[i].set(_p.x, _p.z, bare, now); this.u.uGlaze.value[i].copy(_c);
      _p.y = H.tile; _m.compose(_p, _q.identity(), _s.set(bare, 1, bare));
      this.marks.put(i0 + i, _m, MARK.tile, _c, _c2, [rank, Math.min(10, t.stars || 0), i]);
    });
  }

  /** The soul bead where the colour is; `viewing` brings it up (it sinks when the press view closes), `draught` sets the current. */
  bead(c, { viewing = true, draught = null, walking = false } = {}) {
    const now = performance.now(), dt = Math.min(0.1, (now - this.t0) / 1000); this.t0 = now;
    this.u.uTime.value = now / 1000; syncSelfLit(this.u);
    const R = this.R; wheelPoint(c.h, c.s, R, _p); const len = Math.hypot(_p.x, _p.z), lip = R - BEAD.r * 0.85;
    if (len > lip) { _p.x *= lip / len; _p.z *= lip / len; } // (at the lip it rides up against the kerb: it can get no more vivid)
    const bx = _p.x, bz = _p.z;
    // moving, greying, stopping
    const L = this.last, step = L ? Math.hypot(_p.x - L.x, _p.z - L.z) : 0, greying = !!L && walking && c.s < L.s - 1e-4;
    if (step > 1e-4) { this.moving = true; this.still = 0; } else if (this.moving && ++this.still > 2) { this.moving = false; this.stop = { x: bx, z: bz, t: 0 }; }
    if (greying && !this.fold) this.fold = { r: len, t: 0 };
    this.last = { x: bx, z: bz, s: c.s };
    this.gloss = ease(this.gloss, greying ? 0.15 : this.moving && this.gloss < 0.9 ? this.gloss : 1, dt * (greying ? 8 : 3));
    this.shown = ease(this.shown, viewing ? 1 : 0, dt / 0.3);
    const [ib] = RANGE.bead; wheelColour(c.h, c.s, _c);
    if (this.shown > 0.002) { _m.compose(_p.set(bx, H.bead, bz), _q.identity(), _s.set(BEAD.r * 2, 1, BEAD.r * 2)); this.marks.put(ib, _m, MARK.bead, _c, _c, [this.gloss, this.shown, 0]); } else this.marks.hide(ib);
    // the fold (0.4 s) and the stop's ring (0.6 s)
    if (this.fold) { this.fold.t += dt / 0.4; this.u.uFold.value.set(this.fold.r * (1 - this.fold.t), 0.7 * Math.sin(Math.PI * Math.min(1, this.fold.t))); if (this.fold.t >= 1) { this.fold = null; this.u.uFold.value.set(0, 0); } }
    const [is] = RANGE.stopRing;
    if (this.stop && this.shown > 0.5) {
      const S = this.stop; S.t += dt / 0.6; const r = 0.07 + 0.16 * S.t;
      _m.compose(_p.set(S.x, H.ring, S.z), _q.identity(), _s.set(r, 1, r)); this.marks.put(is, _m, MARK.ring, _c2.setRGB(0.55, 0.55, 0.56), _c2, [0.55 * (1 - S.t), 0.12, 0]);
      if (S.t >= 1) { this.stop = null; this.marks.hide(is); }
    } else if (this.stop) { this.stop = null; this.marks.hide(is); }
    // the spread the bead is in: its inward rings, quick near the break, slower nearer, stilled in the tile's heart
    let best = -1, bd = 0;
    this.T.forEach((T, i) => { const d = Math.hypot(bx - T.x, bz - T.z); if (d <= T.now && (best < 0 || d / T.now < bd / this.T[best].now)) { best = i; bd = d; } });
    this.active = best;
    const A = best >= 0 ? this.T[best] : null, tileHeart = A ? A.bare / 4 : 0, inHeart = A && bd <= tileHeart;
    this.amp = ease(this.amp, A && !inHeart && this.shown > 0.5 ? 1 : 0, dt * (inHeart ? 1 / 0.3 : 2));
    if (A) this.phase += dt * (1.5 + 4.5 * Math.min(1, Math.max(0, (bd - tileHeart) / Math.max(1e-3, A.now - tileHeart))));
    if (A || this.amp === 0) this.ringTile = best;
    this.u.uRing.value.set(this.ringTile ?? -1, this.phase % 6283.2, this.amp, tileHeart || this.u.uRing.value.w);
    // the stir, and the draught's current (toward its feeling's bearing on the rim)
    this.u.uStir.value = ease(this.u.uStir.value, walking ? 1 : 0, dt * 2);
    let lead = null, str = 0; for (const [k, v] of Object.entries(draught || {})) if (v > str && MOTIF[k] != null) { lead = k; str = Math.min(1, v); }
    this.cur = ease(this.cur, str, dt * 1.5);
    if (lead) { wheelPoint(FEELING_HUE[lead] ?? 0, 1, 1, _p); this.u.uCurrent.value.set(_p.x, _p.z, this.cur, MOTIF[lead]); } else this.u.uCurrent.value.z = this.cur;
    this.u.uBrim.value = this.cur;
    for (let i = 0; i < 7; i++) this.u.uBreak.value[i] = this.brk[i] = ease(this.brk[i], i === this.brkTo ? 1 : 0, dt * 6);
  }

  /** The ghost bead: a hollow ring where the bead would end, in the colour it would be; matte if the path greys. */
  ghostBead(e, greys = false) {
    const [ig] = RANGE.ghostBead;
    if (!e) { this.marks.hide(ig); this.brkTo = -1; return; }
    wheelPoint(e.h, e.s, this.R, _p); _p.y = H.ghost; wheelColour(e.h, e.s, _c);
    _m.compose(_p, _q.identity(), _s.set(BEAD.ghost * 2, 1, BEAD.ghost * 2)); this.marks.put(ig, _m, MARK.ghost, _c, _c, [greys ? 0 : 1, 1, 0]);
    this.brkTo = -1; let bd = Infinity; // (the spread it lands in brightens its break, and holds it)
    this.T.forEach((T, i) => { const d = Math.hypot(_p.x - T.x, _p.z - T.z); if (d <= T.now && d / T.now < bd) { bd = d / T.now; this.brkTo = i; } });
  }
  dispose() { this.mesh.removeFromParent(); this.mesh.geometry.dispose(); this.mat.dispose(); }
}
/** A rank from its bare radius, when the caller did not say (ranks 9 and 10 share one: a caller that knows says `rank`). */
function rankOf(bare) { return Math.max(0, Math.min(9, Math.round((0.12 - bare) / (0.08 / 9)))); }
