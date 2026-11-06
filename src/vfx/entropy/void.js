// ---------------------------------------------------------------------------------------
// THE VOID AND THE OASIS (plain names; South, 2026-11-06: "cosmic-themed, abstract, eldritch and avant-garde. Like playing on an oasis in
// high-entropy space", "I don't want you guys to anchor to the current artstyle"; ENTROPY-TACTICS.md 7). Dovina's room (world/entropy/
// entropyroom.js) is a grey disc, a seat stone and a door in a violet fog; this dresses it, looks only, none of the house's dress (no
// clay, no glaze, no gold, no labradorite):
//   the void      a sky of its own drawn at the far plane in one program (`entropy-void`): domain-warped noise boiling slowly in indigo and
//                 black, an interference film of our own (a cosine ramp, not the house's schiller) caught in its folds, grainy stars that
//                 flicker and dissolve, and far things that cannot be: a ring halo, an orb that opens and closes like an eye, and a
//                 tesseract turning in four dimensions (its own LineSegments, `entropy-tesseract`, drawn at the far plane too)
//   the oasis     Dovina's disc in a black mirror liquid (the void reflected by its rippled normal: a cheap fake), a rim of bone stones
//                 and a few crystal stems (two instanced meshes), the seat stone in bone, the door a bone frame round a pane of the void,
//                 and a drift of fraying motes round it (one Points)
//   the hue       one eldritch colour drifting over minutes between ultraviolet and acid chartreuse (`eldritch(t)`), shared with the tiles
// Draws: the void 1, the tesseract 1, the rim 1, the stems 1, the frame 1, the motes 1 (the disc, seat and door are Dovina's meshes in our
// materials). Programs: void, tesseract, mirror, bone, glass, pane, motes. On a phone the noise runs three octaves, never a lesser look
// on the desk (CLAUDE.md).
//
// Prior art: Control's Oldest House and its Astral Plane (a black void with impossible geometry hung in it), Annihilation's shimmer (the
// interference film over everything), Kentucky Route Zero's void (black, a few pale made things, light that means more than it shows),
// Manifold Garden's and Monument Valley's things in an empty sky, Inigo Quilez's domain warping and cosine palettes (the boil and the
// film), Lucas Pope's Return of the Obra Dinn (an ordered dither as the texture of decay, on the bone), Hinton's tesseract (a 4D cube's
// shadow turning).
//
//   new EntropyVoid(game, look)   .attach(room)   .detach()   .tick(dt, t)   .hue (THREE.Color, the eldritch hue now)   eldritch(t, out)
//   SKY_GLSL (the void's colour by direction, for anything that shows it)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ENTROPY_ROOM, AIR } from '../../world/entropy/entropyroom.js';

/** The eldritch hue at real second `t`: ultraviolet to acid chartreuse and back over four real minutes (through the cold cyans). */
export function eldritch(t, out = new THREE.Color()) {
  const k = 0.5 + 0.5 * Math.sin((t / 240) * Math.PI * 2 + 1.3);
  return out.setHSL(THREE.MathUtils.lerp(0.77, 0.22, k), 1, THREE.MathUtils.lerp(0.55, 0.5, k));
}
/** Its air: a near-black indigo, thin (Dovina's AIR overridden while the look stands: her light() writes it after the grade). */
const OUR_AIR = { fog: 0x05030c, density: 0.0032 };

// the void's colour by direction (world space, normalised): needs uT (real s), uEld (vec3), and OCT defined
export const SKY_GLSL = `
uniform float uT; uniform vec3 uEld;
float vh( vec3 p ) { p = fract( p * 0.3183099 + 0.1 ); p *= 17.0; return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) ); }
float vn( vec3 x ) {
	vec3 i = floor( x ), f = fract( x ); f = f * f * ( 3.0 - 2.0 * f );
	return mix( mix( mix( vh( i ), vh( i + vec3( 1, 0, 0 ) ), f.x ), mix( vh( i + vec3( 0, 1, 0 ) ), vh( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
		mix( mix( vh( i + vec3( 0, 0, 1 ) ), vh( i + vec3( 1, 0, 1 ) ), f.x ), mix( vh( i + vec3( 0, 1, 1 ) ), vh( i + vec3( 1, 1, 1 ) ), f.x ), f.y ), f.z );
}
float fbm( vec3 p ) { float a = 0.5, s = 0.0; for ( int i = 0; i < OCT; i++ ) { s += a * vn( p ); p = p * 2.03 + vec3( 1.7, 9.2, 3.1 ); a *= 0.5; } return s; }
vec3 film( float x ) { return 0.5 + 0.5 * cos( 6.2831 * ( x + vec3( 0.0, 0.31, 0.62 ) ) ); }
// a far thing at axis A: its angle off the direction, and 2D coords in its own plane (radians)
vec2 farUV( vec3 d, vec3 A ) { vec3 u = normalize( cross( A, vec3( 0.0, 1.0, 0.0 ) ) ), v = cross( u, A ); return vec2( dot( d, u ), dot( d, v ) ) / max( dot( d, A ), 1e-3 ); }
vec3 voidSky( vec3 d ) {
	float t = uT;
	vec3 p = d * 2.2;
	vec3 q = vec3( fbm( p + vec3( 0.0, t * 0.012, 0.0 ) ), fbm( p + vec3( 5.2, 1.3, t * 0.01 ) ), fbm( p + vec3( 2.1, t * 0.008, 7.7 ) ) );
	float f = fbm( p + 3.2 * q + vec3( t * 0.006 ) );
	float ridge = 1.0 - abs( 2.0 * f - 1.0 );
	vec3 c = mix( vec3( 0.002, 0.001, 0.006 ), vec3( 0.022, 0.012, 0.07 ), smoothstep( 0.3, 0.75, f ) );
	c += vec3( 0.03, 0.01, 0.06 ) * q.x * q.y;
	// the film in the folds: our own ramp, crossed with the eldritch hue
	vec3 fl = mix( film( f * 2.6 + q.z + t * 0.015 ), uEld, 0.35 );
	c += fl * pow( ridge, 7.0 ) * 0.16 * smoothstep( 0.35, 0.7, q.y + 0.2 );
	// the stars: sparse, grainy, flickering, eaten by the noise as it boils
	vec3 g = d * 210.0, gi = floor( g ); float h = vh( gi );
	if ( h > 0.985 ) {
		float r = length( fract( g ) - 0.5 ), tw = 0.5 + 0.5 * sin( t * ( 1.5 + 6.0 * fract( h * 91.0 ) ) + h * 50.0 );
		float eat = smoothstep( 0.62, 0.45, vn( d * 9.0 + vec3( t * 0.05 ) ) );
		c += mix( vec3( 0.9, 0.86, 0.78 ), uEld, fract( h * 37.0 ) * 0.6 ) * smoothstep( 0.32, 0.0, r ) * tw * eat * 1.4;
	}
	// the ring halo: a vast thin ring, its band shot with the film
	vec3 A = normalize( vec3( -0.55, 0.3, -0.78 ) ); float ra = acos( clamp( dot( d, A ), -1.0, 1.0 ) );
	float ring = exp( -pow( ( ra - 0.34 ) / 0.004, 2.0 ) ) + 0.25 * exp( -pow( ( ra - 0.34 ) / 0.03, 2.0 ) ) + 0.5 * exp( -pow( ( ra - 0.31 ) / 0.002, 2.0 ) );
	float az = atan( dot( d, normalize( cross( A, vec3( 0, 1, 0 ) ) ) ), dot( d, cross( normalize( cross( A, vec3( 0, 1, 0 ) ) ), A ) ) );
	float gaps = smoothstep( 0.2, 0.6, vn( vec3( az * 6.0, t * 0.05, 1.0 ) ) );
	c += ( uEld * 1.4 + film( az * 0.4 + t * 0.02 ) * 0.6 ) * ring * ( 0.3 + 0.9 * gaps );
	// the eye: an orb that opens and closes over a minute
	vec3 E = normalize( vec3( 0.72, 0.28, -0.62 ) ); vec2 e = farUV( d, E ) / 0.09; float er = length( e );
	if ( dot( d, E ) > 0.0 && er < 1.6 ) {
		float open = pow( 0.5 + 0.5 * sin( t * 0.11 ), 3.0 );
		float lid = abs( e.y ) - open * sqrt( max( 0.0, 1.0 - e.x * e.x ) ) * 0.85;
		float orb = smoothstep( 1.0, 0.97, er );
		vec3 skin = vec3( 0.012, 0.008, 0.02 ) + vec3( 0.06, 0.05, 0.04 ) * pow( 1.0 - er, 0.5 ) * orb;
		vec3 iris = mix( uEld * 0.9, film( er * 1.5 + t * 0.03 ), 0.3 ) * ( 0.4 + 0.6 * vn( vec3( atan( e.y, e.x ) * 8.0, er * 6.0, t * 0.1 ) ) );
		float pupil = smoothstep( 0.18, 0.12, length( vec2( e.x * 2.6, e.y ) ) );
		vec3 inEye = mix( iris * smoothstep( 0.62, 0.3, er ) + vec3( 0.7, 0.66, 0.6 ) * 0.25 * smoothstep( 0.3, 0.9, er ), vec3( 0.0 ), pupil );
		vec3 o = mix( inEye * 1.3, skin, smoothstep( -0.02, 0.02, lid ) );
		o += uEld * 0.5 * exp( -abs( lid ) * 40.0 ) * orb * step( 0.02, open ); // (the lids' wet line)
		c = mix( c, o, orb ) + uEld * 0.08 * exp( -max( 0.0, er - 1.0 ) * 6.0 ) * ( 1.0 - orb );
	}
	return c;
}`;

const NOISE_DEFS = (mobile) => ({ OCT: mobile ? 3 : 5 });
const OUT = '\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n';

// the void: a unit sphere drawn at the far plane round the camera (a skybox's trick: z = w)
const SKY_VERT = `
varying vec3 vD;
void main() { vD = position; vec4 p = projectionMatrix * vec4( mat3( viewMatrix ) * position, 1.0 ); gl_Position = p.xyww; }`;
const SKY_FRAG = `${SKY_GLSL}
varying vec3 vD;
void main() {
	vec3 c = voidSky( normalize( vD ) );
	c += ( fract( sin( dot( gl_FragCoord.xy + uT * 61.0, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ) - 0.5 ) * 0.008; // (grain)
	gl_FragColor = vec4( max( c, 0.0 ), 1.0 );
	${OUT}
}`;
// the tesseract: its 16 corners in 4D, turned in the xw and yz planes, projected to 3D, hung in a far direction
const TESS_VERT = `
uniform float uT; attribute vec4 a4; varying float vW;
void main() {
	float a = uT * 0.07, b = uT * 0.043, c = uT * 0.029;
	vec4 p = a4;
	p.xw = mat2( cos( a ), -sin( a ), sin( a ), cos( a ) ) * p.xw;
	p.yz = mat2( cos( b ), -sin( b ), sin( b ), cos( b ) ) * p.yz;
	p.zw = mat2( cos( c ), -sin( c ), sin( c ), cos( c ) ) * p.zw;
	vec3 q = p.xyz / ( 2.6 - p.w ); vW = p.w;
	vec3 A = normalize( vec3( -0.25, 0.42, -0.87 ) ), u = normalize( cross( A, vec3( 0, 1, 0 ) ) ), v = cross( u, A );
	vec3 d = A + ( u * q.x + v * q.y + A * q.z * 0.3 ) * 0.11;
	vec4 o = projectionMatrix * vec4( mat3( viewMatrix ) * d, 1.0 ); gl_Position = o.xyww;
}`;
const TESS_FRAG = `
uniform vec3 uEld; varying float vW;
void main() { gl_FragColor = vec4( mix( vec3( 0.75, 0.7, 0.62 ), uEld * 1.4, 0.5 + 0.5 * vW ) * 0.9, 1.0 ); ${OUT} }`;

// the mirror: the disc's top a black liquid showing the void by its rippled normal; its sides obsidian with veins of the hue
const MIRROR_VERT = `
varying vec3 vW, vN; varying vec3 vL;
void main() { vec4 w = modelMatrix * vec4( position, 1.0 ); vW = w.xyz; vL = position; vN = normal; gl_Position = projectionMatrix * viewMatrix * w; }`;
const MIRROR_FRAG = `${SKY_GLSL}
uniform vec3 uC; varying vec3 vW, vN, vL;
void main() {
	vec3 V = normalize( vW - cameraPosition );
	if ( vN.y > 0.5 ) {
		vec2 p = vW.xz - uC.xz; float r = length( p );
		float w = sin( r * 2.2 - uT * 0.9 ) * 0.5 + sin( p.x * 1.3 + uT * 0.4 + vn( vec3( p * 0.4, uT * 0.1 ) ) * 4.0 ) * 0.5;
		vec3 n = normalize( vec3( ( p.x / max( r, 0.1 ) ) * w * 0.03 + ( vn( vec3( p * 1.5, uT * 0.2 ) ) - 0.5 ) * 0.05, 1.0, ( p.y / max( r, 0.1 ) ) * w * 0.03 ) );
		vec3 R = reflect( V, n );
		float fr = 0.25 + 0.75 * pow( 1.0 - abs( V.y ), 4.0 );
		vec3 c = voidSky( normalize( R ) ) * fr * 0.85 + vec3( 0.003, 0.002, 0.008 );
		c += uEld * 0.04 * smoothstep( 8.5, 9.0, r ); // (the liquid's lip, lit by the hue)
		gl_FragColor = vec4( c, 1.0 );
	} else {
		float v = fbm( vW * 0.7 + vec3( 0.0, uT * 0.05, 0.0 ) ), vein = smoothstep( 0.03, 0.0, abs( v - 0.5 ) );
		float k = clamp( ( vL.y + 0.6 ) / 1.2, 0.0, 1.0 );
		vec3 c = vec3( 0.006, 0.004, 0.01 ) + uEld * vein * 0.6 * k + vec3( 0.03, 0.025, 0.05 ) * pow( 1.0 - abs( dot( V, normalize( vN ) ) ), 3.0 );
		gl_FragColor = vec4( c, 1.0 );
	}
	${OUT}
}`;
// bone: the made things (seat, frame, stones), lit by a fixed key, the hue on their rims, an ordered dither eating them (the decay)
const BONE_VERT = `
varying vec3 vW, vN;
void main() {
	vec4 w = vec4( position, 1.0 );
	#ifdef USE_INSTANCING
	w = instanceMatrix * w;
	vN = normalize( mat3( modelMatrix ) * mat3( instanceMatrix ) * normal );
	#else
	vN = normalize( mat3( modelMatrix ) * normal );
	#endif
	w = modelMatrix * w; vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w;
}`;
const BONE_FRAG = `
uniform float uT, uGlass; uniform vec3 uEld; varying vec3 vW, vN;
float bayer( vec2 p ) { p = mod( floor( p ), 4.0 ); float a = mod( p.x + p.y * 2.0, 4.0 ); return ( mod( p.x * 2.0 + p.y * 3.0, 4.0 ) * 4.0 + a ) / 16.0; }
float h3( vec3 p ) { return fract( sin( dot( p, vec3( 127.1, 311.7, 74.7 ) ) ) * 43758.5453 ); }
void main() {
	vec3 N = normalize( vN ), V = normalize( cameraPosition - vW );
	float key = max( dot( N, normalize( vec3( 0.3, 1.0, 0.45 ) ) ), 0.0 ), rim = pow( 1.0 - max( dot( N, V ), 0.0 ), 3.0 );
	vec3 c;
	if ( uGlass > 0.5 ) { // (a crystal stem: dark glass, the hue running up it)
		float run = 0.5 + 0.5 * sin( vW.y * 3.0 - uT * 1.4 + h3( floor( vW * 0.5 ) ) * 6.0 );
		c = vec3( 0.01, 0.008, 0.02 ) + uEld * ( rim * 1.1 + run * 0.25 ) + vec3( 0.6 ) * pow( max( dot( reflect( -V, N ), vec3( 0.0, 1.0, 0.0 ) ), 0.0 ), 30.0 );
	} else {
		vec3 bone = vec3( 0.62, 0.56, 0.44 );
		float l = 0.18 + 0.82 * key;
		float decay = smoothstep( 0.55, 0.75, h3( floor( vW * 9.0 ) ) * 0.5 + 0.5 * fract( sin( dot( floor( vW.xz * 3.0 ), vec2( 3.1, 7.7 ) ) ) * 99.0 ) );
		l = step( bayer( gl_FragCoord.xy ), l * 1.08 ) * 0.25 + l * 0.75; // (the dither: the light quantised a little, Obra Dinn's)
		c = bone * l * ( 1.0 - decay * 0.22 ) + uEld * rim * 0.35;
	}
	gl_FragColor = vec4( c, 1.0 );
	${OUT}
}`;
// the door's pane: the void seen through it, a little deeper than the sky (its own slow turn)
const PANE_FRAG = `${SKY_GLSL}
varying vec3 vW, vN;
void main() {
	vec3 V = normalize( vW - cameraPosition );
	float a = uT * 0.03; vec3 d = vec3( V.x * cos( a ) - V.z * sin( a ), V.y, V.x * sin( a ) + V.z * cos( a ) );
	vec3 c = voidSky( normalize( d * vec3( 1.0, 1.0, 0.6 ) ) ) * 1.6 + uEld * 0.04;
	gl_FragColor = vec4( c, 1.0 );
	${OUT}
}`;
// the motes: a slow drift of fraying particles round the oasis, each a pale speck or a fleck of the hue, flickering out and back
const MOTE_VERT = `
uniform float uT, uScale; attribute vec4 aS; varying float vA, vK;
void main() {
	float r = aS.x, a = aS.y + uT * ( 0.02 + 0.03 * aS.w ), y = mod( aS.z + uT * 0.12 * ( 0.4 + aS.w ), 14.0 ) - 6.0;
	vec3 p = vec3( cos( a ) * r, y, sin( a ) * r ) + vec3( sin( uT * 0.3 + aS.y * 7.0 ), 0.0, cos( uT * 0.27 + aS.y * 5.0 ) ) * 0.4;
	vec4 mv = modelViewMatrix * vec4( p, 1.0 );
	float life = fract( uT * 0.07 * ( 0.5 + aS.w ) + aS.y * 3.1 );
	vA = smoothstep( 0.0, 0.2, life ) * smoothstep( 1.0, 0.6, life ) * smoothstep( -6.0, -3.0, y ) * smoothstep( 8.0, 5.0, y ); vK = aS.w;
	gl_PointSize = uScale * ( 0.05 + 0.06 * aS.w ) * ( 0.6 + 0.4 * sin( uT * 9.0 + aS.y * 40.0 ) ) / max( -mv.z, 0.5 );
	gl_Position = projectionMatrix * mv;
}`;
const MOTE_FRAG = `
uniform vec3 uEld; varying float vA, vK;
void main() {
	vec2 q = gl_PointCoord - 0.5; float r = length( q ); if ( r > 0.5 ) discard;
	float grain = step( 0.35, fract( sin( dot( floor( gl_PointCoord * 4.0 ), vec2( 12.9, 78.2 ) ) + vK * 10.0 ) * 4375.5 ) );
	vec3 c = mix( vec3( 0.85, 0.8, 0.7 ), uEld * 1.5, step( 0.55, vK ) );
	gl_FragColor = vec4( c * vA * smoothstep( 0.5, 0.1, r ) * ( 0.4 + 0.6 * grain ), 1.0 );
	${OUT}
}`;

const rand = (s) => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

export class EntropyVoid {
  constructor(game, look) { this.game = game; this.look = look; this.hue = new THREE.Color(0x8833ff); this.room = null; this.made = []; this.swaps = []; }

  attach(room) {
    this.room = room;
    const g = this.game, R = ENTROPY_ROOM, mobile = !!g.graphics?.machine?.mobile, defs = NOISE_DEFS(mobile);
    const U = this.U = { uT: { value: 0 }, uEld: { value: this.hue }, uC: { value: new THREE.Vector3(R.x, R.y, R.z + 2) }, uGlass: { value: 0 }, uScale: { value: 400 } };
    const mat = (name, vert, frag, extra = {}) => { const m = new THREE.ShaderMaterial({ name, vertexShader: vert, fragmentShader: frag, uniforms: { ...U, ...(extra.uniforms || {}) }, defines: { ...defs }, ...extra.o }); this.made.push(m); return m; };
    const add = (o) => { o.userData.entropyLook = true; room.room.add(o); this.made.push(o.geometry); return o; };
    // the void
    const sky = add(new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), mat('entropy-void', SKY_VERT, SKY_FRAG, { o: { side: THREE.BackSide, depthWrite: false, fog: false } })));
    sky.frustumCulled = false; sky.renderOrder = -1000;
    // the tesseract: 16 corners, 32 edges (corners differing in one coordinate)
    const pos = [], a4 = [];
    for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) { const j = i ^ (1 << b); if (j < i) continue; for (const k of [i, j]) { a4.push(k & 1 ? 1 : -1, k & 2 ? 1 : -1, k & 4 ? 1 : -1, k & 8 ? 1 : -1); pos.push(0, 0, 0); } }
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); tg.setAttribute('a4', new THREE.Float32BufferAttribute(a4, 4));
    const tess = add(new THREE.LineSegments(tg, mat('entropy-tesseract', TESS_VERT, TESS_FRAG, { o: { depthWrite: false, fog: false } })));
    tess.frustumCulled = false; tess.renderOrder = -999;
    // the oasis: Dovina's disc (its collider untouched) in the mirror; the seat in bone; the door a pane in a bone frame
    const bone = this.bone = mat('entropy-bone', BONE_VERT, BONE_FRAG);
    const glass = mat('entropy-glass', BONE_VERT, BONE_FRAG, { uniforms: { uGlass: { value: 1 } } });
    const mirror = mat('entropy-mirror', MIRROR_VERT, MIRROR_FRAG), pane = mat('entropy-pane', BONE_VERT, PANE_FRAG);
    const tiles = new Set(room.tiles); let door = null;
    for (const o of room.room.children) {
      if (!o.isMesh || tiles.has(o) || o.userData.entropyLook) continue;
      const p = o.geometry?.parameters || {}, type = o.geometry?.type;
      if (type === 'CylinderGeometry') this.swap(o, mirror);
      else if (type === 'BoxGeometry' && p.height >= 2.5) { door = o; this.swap(o, pane, [0.86, 0.9, 0.3]); }
      else if (type === 'BoxGeometry') this.swap(o, bone);
    }
    if (door) { // the frame: two posts, a lintel and a sill, the lintel cut twice (a broken thing)
      const W = 2.2, H = 3, T2 = 0.18, parts = [[W, T2, 0.5, 0, H / 2 - T2 / 2], [W * 1.1, T2 * 0.8, 0.6, 0, -H / 2 + T2 * 0.4], [T2, H, 0.5, -W / 2 + T2 / 2, 0], [T2, H * 1.08, 0.5, W / 2 - T2 / 2, 0.06], [0.08, 0.6, 0.55, 0.3, H / 2 + 0.25]];
      const fg = mergeGeometries(parts.map(([w, h, d, x, y]) => new THREE.BoxGeometry(w, h, d).translate(x, y, 0)));
      const frame = add(new THREE.Mesh(fg, bone)); frame.position.copy(door.position); frame.quaternion.copy(door.quaternion);
    }
    const R2 = rand(4099), C = U.uC.value, dummy = new THREE.Object3D();
    // the rim: bone stones round the liquid's edge
    const nStone = 44, stones = add(new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.34, 0), bone, nStone));
    for (let i = 0; i < nStone; i++) {
      const a = (i / nStone) * Math.PI * 2 + (R2() - 0.5) * 0.08, r = R.oasis - 0.25 + (R2() - 0.5) * 0.3, s = 0.55 + R2() * 0.8;
      dummy.position.set(C.x + Math.cos(a) * r, R.y + 0.02 + (R2() - 0.5) * 0.08, C.z + Math.sin(a) * r);
      dummy.rotation.set(R2() * 6, R2() * 6, R2() * 6); dummy.scale.set(s * (0.8 + R2() * 0.6), s * (0.5 + R2() * 0.4), s * (0.8 + R2() * 0.6)); dummy.updateMatrix(); stones.setMatrixAt(i, dummy.matrix);
    }
    stones.frustumCulled = false;
    // the stems: thin crystals standing out of the liquid, off the walk from the door to the seat
    const nStem = 16, stems = add(new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.5, 0).scale(0.12, 1, 0.12), glass, nStem));
    for (let i = 0; i < nStem; i++) {
      let x, z; do { const a = R2() * Math.PI * 2, r = 4.5 + R2() * 3.8; x = Math.cos(a) * r; z = Math.sin(a) * r; } while (Math.abs(x) < 2.6 || C.z + z < R.z - 4);
      const h = 0.6 + R2() * 2.2; dummy.position.set(C.x + x, R.y + h * 0.4, C.z + z); dummy.rotation.set((R2() - 0.5) * 0.5, R2() * 6, (R2() - 0.5) * 0.5); dummy.scale.set(1, h, 1); dummy.updateMatrix(); stems.setMatrixAt(i, dummy.matrix);
    }
    stems.frustumCulled = false;
    // the motes
    const nMote = mobile ? 220 : 480, mg = new THREE.BufferGeometry(), ms = new Float32Array(nMote * 4);
    for (let i = 0; i < nMote; i++) { ms[i * 4] = 3 + R2() * 16; ms[i * 4 + 1] = R2() * Math.PI * 2; ms[i * 4 + 2] = R2() * 14; ms[i * 4 + 3] = R2(); }
    mg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nMote * 3), 3)); mg.setAttribute('aS', new THREE.BufferAttribute(ms, 4));
    const motes = add(new THREE.Points(mg, mat('entropy-motes', MOTE_VERT, MOTE_FRAG, { o: { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false } })));
    motes.position.set(C.x, R.y, C.z - 4); motes.frustumCulled = false;
    motes.onBeforeRender = (r) => { const tgt = r.getRenderTarget(); U.uScale.value = (tgt ? tgt.height : r.getDrawingBufferSize(_v2).y) * 0.9; };
    // its air
    this.air = { fog: AIR.fog, density: AIR.density }; AIR.fog = OUR_AIR.fog; AIR.density = OUR_AIR.density;
  }

  /** One of Dovina's meshes in our material (scaled, when asked), put back on detach. */
  swap(o, m, scale = null) { this.swaps.push({ o, mat: o.material, scale: o.scale.clone() }); o.material = m; if (scale) o.scale.set(...scale); }

  detach() {
    const gone = !this.room?.built; // (torn down already: her materials put back would never draw again, so they are let go)
    for (const s of this.swaps) { s.o.material = s.mat; s.o.scale.copy(s.scale); if (gone) s.mat.dispose?.(); }
    for (const x of this.made) x.dispose?.();
    if (this.room?.room) for (const o of [...this.room.room.children]) if (o.userData.entropyLook) this.room.room.remove(o);
    if (this.air) { AIR.fog = this.air.fog; AIR.density = this.air.density; this.air = null; }
    this.swaps = []; this.made = []; this.room = null; this.U = null;
  }

  tick(dt, t) {
    eldritch(t, this.hue);
    if (this.U) this.U.uT.value = t;
  }
}
const _v2 = new THREE.Vector2();
