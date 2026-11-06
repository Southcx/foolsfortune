// ---------------------------------------------------------------------------------------
// AN ARCANA'S PORTRAIT (plain name; South, 2026-11-06: "for the busts of the Arcana classes, why don't we make animated portrait cards?
// Like use the actual tarot card and animate the characters present on it"; ENTROPY-TACTICS.md 8). Each seat's Arcana class (the Fool,
// the Chariot, the Empress, the Hermit, the Tower) stood as its real Rider-Waite-Smith card, its figures alive, looks only:
//   the card      the card's scan (src/assets/tarot/<cls>.webp, fetched by scripts/fetch_tarot.mjs) on a plane in one program a card
//                 (`entropy-portrait`), lightly graded toward the room's void; its edge a void rim lit in the eldritch hue (pieces.js
//                 `eldritch`) and inside it a line in its owner's colour (pieces.js LOOK: yours the cool cyan, theirs the warm vermilion)
//   its regions   a small authored table a card (REGIONS, below: soft ellipses in the card's own picture, x right and y down, 0..1), each
//                 with a motion: sway (turned about a pivot: a bindle, a lantern, a cloak, the wheat), breathe (scaled about its middle: a
//                 chest, a head, a sphinx), shift (moved along a line: the dog's leap, a head turning, clouds drifting), glow (lit by its
//                 brightness, pulsing: the sun, an orb), flicker (the lantern's star), twinkle (its bright specks glinting: the crowns'
//                 stars), flow (scrolled inside its mask, two phases crossfaded: the Empress's waterfall, the river); on a phone the first
//                 `PHONE` of each (ordered by worth), never a lower look on the desk
//   its life      a slow breath of the art inside its frame and a lean of the card (an inner group: the board view's own turn is kept),
//                 film grain
//   its health    a bar of pips under the card (Into the Breach's countable pips; lost ones trailing as a ghost that drains, the fighting
//                 games' red bar) and its number in the board's stroke numerals (pieces.js numberSprite); under a third, the card darkens
//                 and frays at its edge, its torn edge smouldering in the eldritch hue
//   hit()         a white flash, a shake and a brief chromatic tear across the card (bands of it slid sideways, red and blue apart)
//
// Prior art: the Rider-Waite-Smith tarot (Pamela Colman Smith, for A. E. Waite, Rider & Son, 1909; public domain), Inscryption's living
// cards, Hearthstone's animated portraits, Harry Potter's moving portraits, the flowmap's two-phase crossfade (Valve's water, 2010),
// Into the Breach's health pips.
//
//   PORTRAIT { w, h }   new ArcanaPortrait(kit, cls, seat)   .group (card-sized, faces +z)   .set({ hp, max })   .hit()   .tick(dt, t)
//   .dispose()          (cls: 'fool' | 'chariot' | 'empress' | 'hermit' | 'tower'; seat 0 yours, 1 theirs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LOOK, eldritch, Kit, numberSprite } from './pieces.js';

export const PORTRAIT = { w: 1.2, h: 2.05 };
const N = 10, PHONE = 5; // (regions a card at most; on a phone the first five)
const BAR = { w: 1.12, h: 0.075, y: -PORTRAIT.h / 2 - 0.11, num: -PORTRAIT.h / 2 - 0.36, numScale: 0.34 };
const HIT = { dur: 0.55, shake: 0.06 };
const ART = {
  fool: () => import('../../assets/tarot/fool.webp?b64'), empress: () => import('../../assets/tarot/empress.webp?b64'),
  chariot: () => import('../../assets/tarot/chariot.webp?b64'), hermit: () => import('../../assets/tarot/hermit.webp?b64'),
  tower: () => import('../../assets/tarot/tower.webp?b64'),
};
const KIND = { sway: 0, breathe: 1, shift: 2, glow: 3, flicker: 4, twinkle: 5, flow: 6 };
// a region: [kind, centre x, centre y, radius x, radius y, amount, rate (rad a real s, or the flow's turns), phase, v x, v y, colour]
//   v: sway's pivot, shift's and flow's direction; colour: glow's, flicker's, twinkle's light. Ordered by worth (a phone keeps the first five).
const R = (k, cx, cy, rx, ry, a, f, p = 0, vx = 0, vy = 0, col = 0xffffff) => ({ k: KIND[k], c: [cx, cy], r: [rx, ry], a, f, p, v: [vx, vy], col });
export const REGIONS = {
  fool: [
    R('glow', 0.86, 0.07, 0.15, 0.12, 0.55, 1.1, 0, 0, 0, 0xffe7a0), // the sun, breathing light
    R('sway', 0.69, 0.17, 0.09, 0.08, 0.1, 1.6, 0.3, 0.64, 0.12), // the bindle swinging off the staff's end
    R('shift', 0.78, 0.69, 0.11, 0.09, 0.012, 3.4, 0, 0, -1), // the dog leaping at his heel
    R('breathe', 0.49, 0.36, 0.2, 0.17, 0.016, 1.3), // his chest
    R('shift', 0.47, 0.17, 0.08, 0.07, 0.006, 0.45, 1.2, 1, -0.3), // his head turned up and back to the sky
    R('sway', 0.48, 0.48, 0.17, 0.08, 0.035, 1.9, 0.8, 0.48, 0.4), // the tunic's hem in the wind
    R('shift', 0.84, 0.27, 0.06, 0.06, 0.006, 1.2, 2.1, 0.2, -1), // the white rose lifted
    R('sway', 0.46, 0.1, 0.06, 0.05, 0.12, 2.3, 0.4, 0.46, 0.14), // the feather in his cap
    R('shift', 0.2, 0.09, 0.22, 0.09, 0.008, 0.25, 0, 1, 0), // the sky drifting
    R('twinkle', 0.86, 0.07, 0.17, 0.13, 0.5, 2.5, 0, 0, 0, 0xfff3c4), // glints on the sun's rays
  ],
  empress: [
    R('twinkle', 0.47, 0.15, 0.14, 0.05, 1.0, 3.1, 0, 0, 0, 0xffffff), // the twelve stars of her crown
    R('flow', 0.89, 0.47, 0.07, 0.2, 0.08, 0.35, 0, 0, 1), // the waterfall
    R('breathe', 0.53, 0.47, 0.26, 0.2, 0.012, 1.1), // her body under the gown
    R('sway', 0.5, 0.82, 0.46, 0.07, 0.035, 1.4, 0, 0.5, 0.88), // the wheat in the field
    R('glow', 0.27, 0.13, 0.06, 0.05, 0.5, 1.7, 0.5, 0, 0, 0xffe0a0), // the sceptre's orb
    R('breathe', 0.47, 0.22, 0.07, 0.07, 0.02, 0.9, 1), // her head
    R('sway', 0.82, 0.29, 0.16, 0.12, 0.025, 0.8, 0.6, 0.82, 0.42), // the cypresses, right
    R('sway', 0.16, 0.3, 0.12, 0.1, 0.025, 0.85, 2.2, 0.16, 0.42), // the cypresses, left
    R('glow', 0.24, 0.66, 0.08, 0.07, 0.4, 1.0, 1.4, 0, 0, 0xd8ffd0), // the heart's Venus sign
    R('shift', 0.6, 0.06, 0.3, 0.05, 0.007, 0.3, 0, 1, 0), // the sky's haze
  ],
  chariot: [
    R('glow', 0.5, 0.12, 0.05, 0.04, 0.8, 2.0, 0, 0, 0, 0xfff0b0), // the star on his crown
    R('breathe', 0.26, 0.73, 0.14, 0.11, 0.02, 1.0, 0), // the black sphinx
    R('breathe', 0.76, 0.73, 0.14, 0.11, 0.02, 1.0, Math.PI), // the white sphinx, out of step
    R('twinkle', 0.5, 0.07, 0.32, 0.04, 0.9, 2.6, 0, 0, 0, 0xffffff), // the canopy's stars
    R('breathe', 0.5, 0.33, 0.15, 0.12, 0.014, 1.25, 0.4), // his chest in its armour
    R('breathe', 0.5, 0.535, 0.16, 0.04, 0.05, 2.2, 0, 0, 0), // the winged sun on the car, beating
    R('shift', 0.5, 0.18, 0.07, 0.06, 0.005, 0.5, 1.7, 1, 0), // his gaze turning
    R('flow', 0.5, 0.605, 0.42, 0.025, 0.05, 0.12, 0, 1, 0), // the river behind
    R('shift', 0.5, 0.065, 0.36, 0.05, 0.006, 0.7, 0, 0, 1), // the canopy's cloth rippling
    R('sway', 0.19, 0.3, 0.05, 0.16, 0.02, 0.9, 0.5, 0.21, 0.46), // the wand in his hand
  ],
  hermit: [
    R('flicker', 0.13, 0.21, 0.07, 0.08, 1.0, 7.0, 0, 0, 0, 0xffd27a), // the star in the lantern
    R('sway', 0.13, 0.2, 0.08, 0.1, 0.07, 1.1, 0, 0.15, 0.12), // the lantern swaying off his hand
    R('breathe', 0.47, 0.16, 0.1, 0.08, 0.02, 0.8), // his hooded head, bowed
    R('sway', 0.56, 0.62, 0.24, 0.3, 0.012, 0.6, 0.4, 0.55, 0.3), // the cloak's fall
    R('sway', 0.47, 0.25, 0.05, 0.05, 0.05, 1.0, 1.2, 0.47, 0.21), // his beard
    R('shift', 0.5, 0.86, 0.46, 0.035, 0.01, 0.35, 0, 1, 0), // the snow's drift
    R('glow', 0.13, 0.21, 0.16, 0.16, 0.25, 7.0, 0.7, 0, 0, 0xffb860), // the lantern's halo on the dusk
    R('shift', 0.5, 0.45, 0.48, 0.22, 0.006, 0.2, 0, 1, 0), // the dusk's mist drifting
  ],
  tower: [
    R('flicker', 0.8, 0.12, 0.17, 0.1, 1.0, 11.0, 0, 0, 0, 0xf4ecff), // the lightning bolt flashing
    R('shift', 0.28, 0.12, 0.13, 0.08, 0.014, 0.7, 0, -0.35, 1), // the crown blown off, falling
    R('flicker', 0.52, 0.19, 0.14, 0.07, 0.8, 6.0, 0.6, 0, 0, 0xff8a3a), // the flames off the top
    R('shift', 0.2, 0.46, 0.16, 0.16, 0.012, 0.55, 0, 0.1, 1), // the left figure falling
    R('shift', 0.74, 0.54, 0.15, 0.16, 0.012, 0.6, 1.9, -0.1, 1), // the right figure falling
    R('twinkle', 0.13, 0.36, 0.1, 0.18, 0.8, 2.4, 0, 0, 0, 0xffe27a), // the yods falling, left
    R('flicker', 0.49, 0.32, 0.07, 0.05, 0.7, 8.0, 1.3, 0, 0, 0xff6a2a), // the flames in the windows
    R('twinkle', 0.84, 0.3, 0.1, 0.16, 0.8, 2.1, 1.1, 0, 0, 0xffe27a), // the yods falling, right
    R('shift', 0.2, 0.28, 0.18, 0.08, 0.008, 0.35, 0, 1, 0.2), // the smoke churning, left
    R('shift', 0.84, 0.42, 0.14, 0.08, 0.008, 0.3, 2.4, -1, 0.2), // the clouds churning, right
  ],
};

const VERT = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }`;
const FRAG = `
#define N ${N}
uniform sampler2D uMap; uniform float uT, uLoaded, uHit, uLow, uLit, uSeed, uAsp; uniform int uN;
uniform vec4 uR[ ${N} ];
uniform vec4 uM[ ${N} ];
uniform vec4 uV[ ${N} ];
uniform vec3 uC[ ${N} ];
uniform vec3 uSide, uEld; varying vec2 vUv; // (one array a declaration, its size a literal: the phone's constant-index rewrite reads them so, render/constantindex.js)
float h21( vec2 p ) { return fract( sin( dot( p, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ); }
float vn( vec2 x ) { vec2 i = floor( x ), f = fract( x ); f = f * f * ( 3.0 - 2.0 * f ); return mix( mix( h21( i ), h21( i + vec2( 1, 0 ) ), f.x ), mix( h21( i + vec2( 0, 1 ) ), h21( i + vec2( 1, 1 ) ), f.x ), f.y ); }
vec3 art( vec2 q ) { return texture2D( uMap, vec2( q.x, 1.0 - q.y ) ).rgb; } // (q: the picture's x right, y down)
float mask( vec4 r, vec2 q ) { return 1.0 - smoothstep( 0.3, 1.0, length( ( q - r.xy ) / r.zw ) ); }
void main() {
	vec2 q = vec2( vUv.x, 1.0 - vUv.y );
	// the frame's edge distance (in the card's width) and the fray of low health
	vec2 e2 = min( q, 1.0 - q ) * vec2( 1.0, 1.0 / uAsp ); float ed = min( e2.x, e2.y );
	float fr = uLow * ( 0.02 + 0.07 * vn( q * vec2( 22.0, 22.0 / uAsp ) + uSeed * 9.0 ) + 0.02 * vn( q * 70.0 ) );
	if ( ed < fr ) discard;
	float scorch = uLow * smoothstep( 0.03, 0.0, ed - fr );
	// the art breathing in its frame, and its regions' motion
	vec2 a = 0.5 + ( q - 0.5 ) * ( 1.0 - 0.005 * sin( uT * 0.5 + uSeed * 6.0 ) );
	vec2 d = vec2( 0.0 );
	for ( int i = 0; i < N; i++ ) {
		if ( i >= uN ) break;
		vec4 r = uR[ i ], m = uM[ i ], v = uV[ i ]; float k = m.x; if ( k > 2.5 ) continue;
		float w = mask( r, a ), s = sin( uT * m.z + m.w );
		if ( k < 0.5 ) { vec2 rel = ( a - v.xy ) * vec2( uAsp, 1.0 ); float an = m.y * s, cs = cos( an ), sn = sin( an ); vec2 ro = vec2( cs * rel.x - sn * rel.y, sn * rel.x + cs * rel.y ); d += w * ( ro - rel ) / vec2( uAsp, 1.0 ); }
		else if ( k < 1.5 ) d += w * ( a - r.xy ) * m.y * s;
		else d += w * normalize( v.xy + 1e-5 ) * m.y * s;
	}
	vec2 p = a - d;
	// the hit's chromatic tear: a few bands slid sideways, red and blue apart
	float band = floor( q.y * 26.0 ), ft = floor( uT * 24.0 ), tear = uHit * step( 0.55, h21( vec2( band, ft ) ) ) * ( h21( vec2( ft, band * 1.7 ) ) - 0.5 ) * 0.09;
	float ca = uHit * 0.012 + abs( tear ) * 0.3;
	vec3 c = uLoaded > 0.5 ? vec3( art( p + vec2( tear + ca, 0.0 ) ).r, art( p + vec2( tear, 0.0 ) ).g, art( p + vec2( tear - ca, 0.0 ) ).b ) : vec3( 0.04, 0.03, 0.06 );
	float lum = dot( c, vec3( 0.299, 0.587, 0.114 ) );
	for ( int i = 0; i < N; i++ ) {
		if ( i >= uN ) break;
		vec4 r = uR[ i ], m = uM[ i ], v = uV[ i ]; float k = m.x; if ( k < 2.5 ) continue;
		float w = mask( r, a ); if ( w <= 0.0 ) continue;
		if ( k < 3.5 ) c += uC[ i ] * w * m.y * ( 0.35 + 0.65 * lum ) * ( 0.6 + 0.4 * sin( uT * m.z + m.w ) );
		else if ( k < 4.5 ) { float fl = 0.55 + 0.45 * vn( vec2( uT * m.z + m.w, m.w ) ) * ( 0.7 + 0.3 * sin( uT * 23.0 ) ); c += uC[ i ] * w * m.y * fl * ( 0.25 + lum ); }
		else if ( k < 5.5 ) { vec2 cell = floor( a * vec2( 90.0, 90.0 / uAsp ) ); float tw = pow( max( 0.0, sin( uT * m.z * ( 0.6 + h21( cell ) ) + h21( cell + 3.1 ) * 6.283 ) ), 6.0 ); c += uC[ i ] * w * m.y * tw * smoothstep( 0.55, 0.95, lum ) * 1.6; }
		else if ( uLoaded > 0.5 ) { // flow: two phases scrolled along v, crossfaded so it never seams
			vec2 dir = normalize( v.xy + 1e-5 ); float t1 = fract( uT * m.z + m.w ), t2 = fract( t1 + 0.5 );
			vec3 f1 = art( p - dir * ( t1 - 0.5 ) * m.y ), f2 = art( p - dir * ( t2 - 0.5 ) * m.y );
			c = mix( c, mix( f1, f2, abs( 1.0 - 2.0 * t1 ) ) * 1.08, w );
		}
	}
	// the grade toward the void: a little darker, the shadows violet, the paper's yellow held back
	lum = dot( c, vec3( 0.299, 0.587, 0.114 ) );
	c = mix( vec3( lum ), c, 0.82 ) * 0.86; c = mix( vec3( 0.03, 0.015, 0.06 ), c, smoothstep( -0.05, 0.45, lum ) * 0.85 + 0.15 );
	c *= 1.0 - uLow * 0.5 * ( 0.6 + 0.4 * vn( q * 6.0 + uT * 0.05 ) );
	// the frame: a void rim lit in the eldritch hue at the edge, the owner's line inside it
	// (the owner's colour is the frame itself: a solid band over the scan's paper border, the paper inside it tinted, so whose card it is
	// reads before the picture does)
	float rim = smoothstep( 0.012, 0.0, ed ), fband = smoothstep( 0.011, 0.014, ed ) * smoothstep( 0.046, 0.042, ed ), paper = smoothstep( 0.085, 0.06, ed ) * smoothstep( 0.5, 0.85, lum );
	c = mix( c, c * 0.35 + uSide * 0.55, paper * 0.7 );
	c = mix( c, uSide * ( 1.05 + uLit * 0.5 ) * ( 0.85 + 0.15 * sin( uT * 1.6 + q.y * 6.0 ) ), fband );
	c = mix( c, vec3( 0.012, 0.008, 0.02 ), smoothstep( 0.013, 0.009, ed ) );
	c += uEld * rim * ( 0.6 + 0.3 * sin( uT * 1.3 + q.y * 9.0 ) );
	c += mix( uEld, vec3( 1.0, 0.6, 0.3 ), 0.4 ) * scorch * 1.6;
	c += vec3( 1.0, 0.97, 0.92 ) * uHit * uHit * uHit * 0.5;
	c += ( h21( gl_FragCoord.xy + fract( uT * 7.0 ) * 91.0 ) - 0.5 ) * 0.045;
	gl_FragColor = vec4( max( c, 0.0 ), 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`;
// the health bar: pips in the owner's colour, the lost ones a ghost draining after the hit
const BAR_FRAG = `
uniform float uK, uGhost, uMax, uT, uHit; uniform vec3 uSide; varying vec2 vUv;
void main() {
	float i = floor( vUv.x * uMax ), f = fract( vUv.x * uMax ), pip = step( 0.12, f ) * step( f, 0.88 ) * step( 0.18, vUv.y ) * step( vUv.y, 0.82 );
	float on = step( i + 0.5, uK ), ghost = step( i + 0.5, uGhost ) * ( 1.0 - on );
	vec3 c = vec3( 0.02, 0.015, 0.03 ) + pip * ( uSide * on * ( 1.1 + 0.15 * sin( uT * 2.0 - i * 0.4 ) ) + vec3( 1.0, 0.95, 0.85 ) * ghost * 0.85 + vec3( 0.09, 0.08, 0.1 ) * ( 1.0 - on - ghost ) );
	c += vec3( 1.0 ) * uHit * pip * 0.4;
	float edge = step( 0.06, vUv.y ) * step( vUv.y, 0.94 ) * step( 0.004, vUv.x ) * step( vUv.x, 0.996 );
	gl_FragColor = vec4( mix( uSide * 0.6, c, edge ), 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`;

const cache = new Map(); // cls -> Promise<Texture | null> (shared by both seats; three re-uploads one disposed and drawn again)
function artOf(cls) {
  if (!cache.has(cls)) {
    const load = ART[cls] || ART.fool;
    cache.set(cls, load().then(({ default: b64 }) => new THREE.TextureLoader().loadAsync(`data:image/webp;base64,${b64}`)).then((t) => {
      t.name = `entropy-tarot-${cls}`; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true; return t;
    }).catch((e) => { console.warn('the tarot art', cls, e); cache.delete(cls); return null; }));
  }
  return cache.get(cls);
}

export class ArcanaPortrait {
  constructor(kit, cls, seat) {
    this.cls = cls; this.seat = seat; this.ownKit = !kit; this.kit = kit || new Kit(); this.dead = false;
    this.hp = 20; this.max = 20; this.ghost = 20; this.hitK = 0; this.t = 0; this.lean = Math.random() * 6;
    const mobile = !!(this.kit.mobile ?? globalThis.__game?.game?.graphics?.machine?.mobile);
    const rows = (REGIONS[cls] || REGIONS.fool).slice(0, mobile ? PHONE : N);
    const v4 = () => Array.from({ length: N }, () => new THREE.Vector4()), Rr = v4(), Rm = v4(), Rv = v4(), Rc = Array.from({ length: N }, () => new THREE.Color(0));
    rows.forEach((r, i) => { Rr[i].set(r.c[0], r.c[1], r.r[0], r.r[1]); Rm[i].set(r.k, r.a, r.f, r.p); Rv[i].set(r.v[0], r.v[1], 0, 0); Rc[i].set(r.col); });
    const side = new THREE.Color(LOOK.side(seat));
    this.U = { uMap: { value: null }, uLoaded: { value: 0 }, uT: { value: 0 }, uHit: { value: 0 }, uLow: { value: 0 }, uLit: { value: 0 }, uSeed: { value: seat * 0.37 + 0.11 },
      uAsp: { value: PORTRAIT.w / PORTRAIT.h }, uN: { value: rows.length }, uR: { value: Rr }, uM: { value: Rm }, uV: { value: Rv }, uC: { value: Rc }, uSide: { value: side }, uEld: { value: new THREE.Color(0x8833ff) } };
    this.group = new THREE.Group(); this.group.name = `arcana-portrait-${cls}`;
    this.inner = new THREE.Group(); this.group.add(this.inner);
    this.geo = new THREE.PlaneGeometry(PORTRAIT.w, PORTRAIT.h);
    this.mat = new THREE.ShaderMaterial({ name: 'entropy-portrait', vertexShader: VERT, fragmentShader: FRAG, uniforms: this.U });
    this.mesh = new THREE.Mesh(this.geo, this.mat); this.inner.add(this.mesh);
    // the back: void, so the card reads as a card when turned
    this.backMat = new THREE.MeshBasicMaterial({ color: 0x050307, side: THREE.BackSide }); this.back = new THREE.Mesh(this.geo, this.backMat); this.inner.add(this.back);
    // the health: its bar of pips and its number
    this.BU = { uK: { value: 20 }, uGhost: { value: 20 }, uMax: { value: 20 }, uT: this.U.uT, uHit: this.U.uHit, uSide: { value: side } };
    this.barGeo = new THREE.PlaneGeometry(BAR.w, BAR.h); this.barMat = new THREE.ShaderMaterial({ name: 'entropy-portrait-bar', vertexShader: VERT, fragmentShader: BAR_FRAG, uniforms: this.BU });
    this.bar = new THREE.Mesh(this.barGeo, this.barMat); this.bar.position.y = BAR.y; this.group.add(this.bar);
    this.num = numberSprite(this.kit, BAR.numScale); this.num.sprite.position.y = BAR.num; this.group.add(this.num.sprite);
    this.sideCss = LOOK.sideCss(seat);
    artOf(cls).then((t) => { if (this.dead || !t) return; this.U.uMap.value = t; this.U.uLoaded.value = 1; });
    this.set({ hp: this.hp, max: this.max });
  }
  set({ hp, max = this.max } = {}) {
    if (hp == null) return;
    if (hp < this.hp) this.ghost = Math.max(this.ghost, this.hp); else this.ghost = Math.max(hp, Math.min(this.ghost, hp));
    this.hp = hp; this.max = max || 20;
    this.BU.uMax.value = this.max; this.BU.uK.value = Math.max(0, hp);
    this.num.set(Math.max(0, hp), hp / this.max < 1 / 3 ? '#ff7a5c' : this.sideCss);
  }
  /** A blow taken: a flash, a shake and a tear. */
  hit() { this.hitK = 1; }
  /** The board view's light on it (0..1), optional. */
  light(k = 0) { this.U.uLit.value = k; }
  tick(dt, t) {
    this.t = t; const U = this.U; U.uT.value = t; eldritch(t, U.uEld.value, 1.3 + this.seat * 2.1);
    this.hitK = Math.max(0, this.hitK - dt / HIT.dur); U.uHit.value = this.hitK;
    this.ghost = Math.max(this.hp, this.ghost - dt * (this.hitK > 0.3 ? 0 : 6)); this.BU.uGhost.value = this.ghost;
    const low = THREE.MathUtils.clamp(1 - (this.hp / this.max) * 3, 0, 1); U.uLow.value += (low - U.uLow.value) * Math.min(1, dt * 3);
    // the card's lean and the hit's shake (the inner group: the board view turns the outer)
    const s = this.hitK * this.hitK * HIT.shake;
    this.inner.rotation.set(Math.sin(t * 0.37 + this.lean) * 0.035, Math.sin(t * 0.29 + this.lean * 2) * 0.05, Math.sin(t * 0.21 + this.lean) * 0.012 + Math.sin(t * 47) * s * 0.6);
    this.inner.position.set(Math.sin(t * 61) * s, Math.cos(t * 53) * s * 0.6, 0);
  }
  dispose() {
    this.dead = true; this.group.parent?.remove(this.group);
    this.geo.dispose(); this.mat.dispose(); this.backMat.dispose(); this.barGeo.dispose(); this.barMat.dispose();
    if (this.ownKit) this.kit.dispose(); // (the board view's kit is its own: it disposes the number's canvas with the rest)
  }
}
