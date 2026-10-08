// ---------------------------------------------------------------------------------------
// THE PRESS'S MARKS (docs/plans/SOUL-ALCHEMY.md 4.22): everything self-lit that lies on or round the bath, drawn as ONE instanced mesh
// with one shader, so the seven tiles, the seven attributes' seals, the line blend's droplets, the ghost path and the queued paths, their rings,
// the ghost bead and the soul bead cost one draw call and one program between them (the lumps, which are solid, use the same program
// on their own four shapes). Each instance is a quad lying on the bath (or a lump) with three attributes: `aCol` (the colour it must be
// seen as, linear: wheelColour's), `aCol2` (a second colour: a tile's clay body, a seal lit from within, a path's far end) and `aData`
// (x what it is, then three numbers of its own). Instances are drawn in order, so the ranges below are the layers: tiles under droplets
// under paths under the beads. Nothing here writes depth, and every face stands at least 1.5 cm off the bath (casebook rule 1).
// The colours go through `selfLit` (vfx/selflit.js): the frame's tone curve and grade are undone, so a tile shows wheelColour exactly
// and a bead dead on its tile vanishes into it. Every mark keeps 2 px at 480 lines: a disc's quad is twice its size, and the fragment
// grows it (or its ring, or its glint) to its floor in pixels, read from the derivatives.
//
// What each is, and its numbers (aData.yzw):
//   0 TILE    rank 0..10, yohen stars 0..10, its index (the inward rings and the stars' seed)        aCol2: the clay body
//             (the one firing, `uFire`: its kiln heat running out from the bead and its crazing: vfx/alchemy/firing.js)
//   1 SEAL    atlas cell, lit 0..1, gold 0..1 (a true firing's warmth)                              aCol2: the glaze lit
//   2 BEAD    gloss 0..1, shown 0..1, its meniscus 0..1 (a true firing fades it: the edge lost)       (the soul bead)
//   3 GHOST   gloss 0..1, shown 0..1                                                                (the ghost bead: a hollow ring)
//   4 DROP    -, shown 0..1                                                                         (the line blend)
//   5 RIBBON  shown 0..1                                                                            aCol2: the colour at its far end
//   6 RING    shown 0..1, its ring's width (share of its radius)
//   7 LUMP    glint 0..1 (a rarer lump)
//   8 GLOW    -, strength 0..1                                                                      (the burning glass's pinpoint)
//
// Prior art: instanced decals and "uber" sprite shaders (one material, a kind per instance: the particle sheets of every engine since
// Unreal's Cascade), signed-distance discs drawn in the fragment with derivative antialiasing (Inigo Quilez), and the press's own
// labels in 4.26 (glaze test tiles, Yaozhou's carved celadon, yohen tenmoku's stars).
//
//   const M = new Marks(group)   M.put(i, matrix, what, col, col2?, data?)   M.hide(i)   M.flush()   M.lumpMesh(geometry, max)
//   RANGE.<layer> = [first, count]   MARK.<what>   M.uniforms (uRing: the active tile's inward rings; uFire, uFireAt: the firing; uTime)
//   M.update()   M.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SELF_LIT_GLSL, selfLitUniforms, syncSelfLit } from '../selflit.js';
import { sealAtlas } from './seals.js';

export const MARK = { tile: 0, seal: 1, bead: 2, ghost: 3, drop: 4, ribbon: 5, ring: 6, lump: 7, glow: 8 };
const layout = [['tiles', 7], ['seals', 7], ['drops', 96], ['queue', 240], ['qrings', 5], ['ghost', 120], ['cursor', 1], ['ghostBead', 1], ['stopRing', 1], ['crawl', 1], ['bead', 1], ['glow', 1]]; // (cursor: the hand's shadow dot; crawl: the bared ring of a refusal; glow: the burning glass)
export const RANGE = {}; let N = 0; for (const [k, n] of layout) { RANGE[k] = [N, n]; N += n; }
export const MARKS = N;
export const RING_K = 40; // (the inward rings' wavenumber, radians a metre: crests about 16 cm apart, 8 px at the widest view)

const VERT = /* glsl */`
attribute vec3 aCol, aCol2; attribute vec4 aData;
varying vec3 vCol, vCol2, vN; varying vec4 vData; varying vec2 vP; varying float vScale;
void main() {
  vCol = aCol; vCol2 = aCol2; vData = aData; vP = position.xz;
  vScale = length( instanceMatrix[ 0 ].xyz );
  vN = normalize( mat3( instanceMatrix ) * normal );
  gl_Position = projectionMatrix * modelViewMatrix * ( instanceMatrix * vec4( position, 1.0 ) );
}`;
const FRAG = /* glsl */`
uniform sampler2D uAtlas; uniform vec4 uRing, uFire, uGlintT; uniform vec2 uFireAt; uniform float uTime;
varying vec3 vCol, vCol2, vN; varying vec4 vData; varying vec2 vP; varying float vScale;
${SELF_LIT_GLSL}
float band( float d, float hw, float px ) { return 1.0 - smoothstep( hw, hw + px, abs( d ) ); }
vec2 h2( vec2 p ) { return fract( sin( vec2( dot( p, vec2( 127.1, 311.7 ) ), dot( p, vec2( 269.5, 183.3 ) ) ) ) * 43758.5453 ); }
/** Crazing's net: the distance to the nearest edge between Voronoi cells (the second nearest point less the nearest), in cell units. */
float crazeEdge( vec2 p ) {
  vec2 i = floor( p ), f = fract( p ); float d1 = 8.0, d2 = 8.0;
  for ( int y = -1; y <= 1; y++ ) for ( int x = -1; x <= 1; x++ ) { vec2 o = vec2( float( x ), float( y ) ), q = o + 0.15 + 0.7 * h2( i + o ) - f; float d = dot( q, q ); if ( d < d1 ) { d2 = d1; d1 = d; } else if ( d < d2 ) d2 = d; }
  return sqrt( d2 ) - sqrt( d1 );
}
void main() {
  int what = int( vData.x + 0.5 );
  float px = max( fwidth( vP.x ), fwidth( vP.y ) ), rho = length( vP );
  vec3 c = vCol; float a = 1.0;
  if ( what == 0 ) {
    // a tile: flat exact glaze in the middle; at the rim the glaze breaks thin over its clay body; a tile's heart scribed at a quarter
    a = 1.0 - smoothstep( 1.0 - px, 1.0, rho ); if ( a <= 0.0 ) discard;
    float rank = vData.y, bw = min( 0.45, rank > 9.5 ? max( 0.22, 4.0 * px ) : max( 0.16, 3.5 * px ) ); // (seen small, the glaze still holds the middle)
    vec3 thin = mix( vCol, vec3( 1.0 ), 0.22 );
    c = mix( vCol, thin, smoothstep( 1.0 - bw, 1.0 - 0.6 * bw, rho ) );
    float t = smoothstep( 1.0 - 0.62 * bw, 1.0 - 0.38 * bw, rho );
    vec3 body = vCol2;
    if ( rank > 6.5 && rank < 9.5 ) body = mix( body, vec3( 1.0 ), 0.3 * smoothstep( 1.0 - 0.3 * bw, 1.0, rho ) ); // (porcelain: translucent at the very edge)
    if ( rank > 9.5 ) {
      body *= 0.78 + 0.45 * pow( 0.5 + 0.5 * sin( atan( vP.y, vP.x ) * 2.0 + 0.9 ), 4.0 ); // (gilt: the Prince's own, catching the light round its rim)
      vec2 gq = ( vP - vec2( -0.42, -0.46 ) ) * vec2( 1.0, 2.2 ); c = mix( c, vec3( 1.0 ), 0.28 * exp( -dot( gq, gq ) * 14.0 ) * ( 1.0 - t ) ); // (and glassy: a soft gleam; a finished tile is never matched again)
    }
    c = mix( c, body, t );
    c *= mix( 1.0, 0.4, smoothstep( 1.0 - 1.5 * px, 1.0, rho ) );
    // the inward rings, while the soul bead is in this tile's spread: crests running toward a tile's heart, stilled inside it
    if ( abs( vData.w - uRing.x ) < 0.5 && uRing.z > 0.001 ) {
      float rm = rho * vScale, crest = pow( 0.5 + 0.5 * sin( rm * ${RING_K.toFixed(1)} + uRing.y ), 3.0 );
      float m = smoothstep( uRing.w, uRing.w * 1.6 + 0.02, rm ) * ( 1.0 - smoothstep( 1.0 - bw, 1.0 - 0.5 * bw, rho ) );
      c = mix( c, mix( c, vec3( 1.0 ), 0.16 ), crest * m * uRing.z );
    }
    float hw = min( 0.06, max( 0.016, 0.75 * px ) );
    c = mix( c, mix( vCol, vec3( 1.0 ), 0.5 ), band( rho - 0.25, hw, px ) );
    // a refusal's glint on a tile with no spread (its rim is its break): the side facing the bead catches the light once
    if ( abs( vData.w - uGlintT.x ) < 0.5 && uGlintT.y > 0.001 ) c = mix( c, vec3( 0.85 ), uGlintT.y * pow( max( dot( vP / max( rho, 1e-4 ), uGlintT.zw ), 0.0 ), 10.0 ) * smoothstep( 1.0 - bw, 1.0 - 0.3 * bw, rho ) );
    // the firing (one tile at a time): a white kiln heat running out from the bead across the tile and cooling back to its glaze, and
    // the crazing it leaves, a net of fine dark lines spreading as fresh glaze cools (2 px and never finer: casebook rule 1's marks)
    if ( abs( vData.w - uFire.x ) < 0.5 && uFire.y + uFire.z > 0.001 ) {
      float df = length( vP - uFireAt ), front = uFire.w;
      c = mix( c, vec3( 0.85, 0.83, 0.77 ), uFire.y * ( 1.0 - smoothstep( front - 0.45, front, df ) ) * a );
      float pc = 3.4 * px, e = crazeEdge( vP * 3.4 + vData.w * 7.31 );
      c = mix( c, c * 0.5, uFire.z * ( 1.0 - smoothstep( front - 0.2, front, df ) ) * band( e, max( 0.035, 0.8 * pc ), pc ) * ( 1.0 - t ) );
    }
    // the yohen stars: one a true firing, 2 px and never smaller, silver-blue with a dark halo, kept on the face
    for ( int i = 0; i < 10; i++ ) {
      if ( float( i ) >= vData.z || px > 0.12 ) break; // (the stars show while the tile is 8 px across or more)
      float ang = float( i ) * 2.39996 + vData.w * 1.7, r = 0.42 + 0.36 * fract( float( i ) * 0.618034 + vData.w * 0.31 );
      float d = length( vP - vec2( cos( ang ), sin( ang ) ) * r ), sr = max( 0.045, 1.0 * px );
      c = mix( c, c * 0.55, ( 1.0 - smoothstep( sr + px, sr + 2.0 * px, d ) ) * 0.6 );
      c = mix( c, vec3( 0.80, 0.88, 1.0 ), 1.0 - smoothstep( sr, sr + px, d ) );
    }
  } else if ( what == 1 ) {
    // a seal: the carving's cut filled with its tile's glaze, pooled darker, its walls shaded for a light at the press; lit from within
    vec4 tx = texture2D( uAtlas, vec2( ( vData.y + clamp( vP.x * 0.5 + 0.5, 0.01, 0.99 ) ) / 8.0, clamp( vP.y * 0.5 + 0.5, 0.01, 0.99 ) ) );
    a = tx.r; if ( a < 0.03 ) discard;
    float wall = tx.g * 2.0 - 1.0, depth = tx.b, lit = vData.z;
    c = mix( vCol * ( 0.8 - 0.3 * depth ), vCol2 * ( 0.92 + 0.12 * depth ), lit );
    c *= 1.0 + 0.4 * wall * ( 1.0 - 0.7 * lit );
    c = mix( c, vec3( 0.85, 0.6, 0.2 ), vData.w * 0.85 ); // (a true firing's gold: a warmth for a beat)
  } else if ( what == 2 ) {
    // the soul bead: its colour exactly, a dark meniscus a sixth of its width (2 px at least), one white glint at its point
    float r = min( 0.9, max( 0.5, 5.0 * px ) ), q = rho / r;
    a = ( 1.0 - smoothstep( 1.0, 1.0 + px / r, q ) ) * vData.z; if ( a <= 0.0 ) discard; // (its soft edge falls outside it: seated true, it hides a tile's heart all round)
    float men = max( 0.333, 2.0 * px / r ) * ( 1.0 + 0.06 * sin( uTime * 2.3 ) );
    c = mix( vCol, vCol * 0.32, smoothstep( 1.0 - men - px / r, 1.0 - men, q ) * vData.w ); // (a true firing fades the meniscus: the bead's edge lost in the heart)
    float g = max( 0.16, 1.0 * px / r );
    c = mix( c, vec3( 0.86 ), ( 1.0 - smoothstep( g, g + px / r, q ) ) * vData.y );
  } else if ( what == 3 ) {
    // the ghost bead: a hollow ring in the colour the bead would be, hairlines either side; matte when the path greys
    float r = min( 1.0, max( 0.55, 6.0 * px ) ), w = max( 0.13, 2.2 * px ), d = rho - ( r - w * 0.5 - px );
    float inner = band( d, w * 0.5, px ), outer = band( d, w * 0.5 + px, px );
    a = outer * vData.z; if ( a <= 0.0 ) discard;
    c = mix( vCol * 0.3, vCol, inner );
    c = mix( c, vec3( 0.95 ), vData.y * inner * ( 1.0 - smoothstep( 0.0, 2.5 * px, length( vP - normalize( vec2( -0.7, -0.7 ) ) * ( r - w * 0.5 - px ) ) ) ) );
  } else if ( what == 4 ) {
    // a droplet of the line blend: the colour the bead had there, a darker rim to part it from the glaze it lies on
    float r = min( 1.0, max( 0.5, 2.2 * px ) ), q = rho / r;
    a = ( 1.0 - smoothstep( 1.0 - px / r, 1.0, q ) ) * vData.z; if ( a <= 0.0 ) discard;
    c = mix( vCol, vCol * 0.55, smoothstep( 1.0 - 2.0 * px / r, 1.0 - px / r, q ) );
  } else if ( what == 5 ) {
    // a ribbon segment of a path: the colours it passes, soft across its width
    float py = fwidth( vP.y );
    a = ( 1.0 - smoothstep( max( 0.3, 1.0 - 1.2 * py ), 1.0, abs( vP.y ) ) ) * vData.y; if ( a <= 0.0 ) discard;
    c = mix( vCol, vCol2, vP.x * 0.5 + 0.5 );
  } else if ( what == 6 ) {
    float w = max( vData.z, 2.0 * px );
    a = band( rho - ( 1.0 - w * 0.5 - px ), w * 0.5, px ) * vData.y; if ( a <= 0.0 ) discard;
  } else if ( what == 8 ) {
    // the burning glass's pinpoint: a hot point (2 px at least) in a soft halo, laid on the bead by the press's eye
    float cr = max( 0.1, 1.2 * px ), core = 1.0 - smoothstep( cr, cr + px, rho ), halo = exp( -rho * rho * 6.0 );
    a = clamp( core + 0.55 * halo, 0.0, 1.0 ) * vData.z; if ( a <= 0.003 ) discard;
    c = mix( vCol, vec3( 0.85 ), 0.4 + 0.6 * core );
  } else {
    // a lump: solid, its colour under a fixed key light from the south-west (where the press view looks from), so the hue holds
    vec3 L = normalize( vec3( -0.35, 1.0, 0.55 ) ), n = normalize( vN );
    c = vCol * ( 0.74 + 0.34 * max( dot( n, L ), 0.0 ) );
    c = mix( c, vec3( 1.0 ), vData.y * pow( max( dot( n, normalize( L + vec3( 0.0, 0.4, 1.0 ) ) ), 0.0 ), 28.0 ) );
  }
  gl_FragColor = vec4( selfLit( c ), a );
  #include <colorspace_fragment>
}`;

const _z = new THREE.Matrix4().makeScale(0, 0, 0);
export class Marks {
  constructor(group) {
    this.group = group;
    this.uniforms = { uAtlas: { value: sealAtlas() }, uRing: { value: new THREE.Vector4(-1, 0, 0, 0) }, uFire: { value: new THREE.Vector4(-1, 0, 0, 0) }, uFireAt: { value: new THREE.Vector2() }, uGlintT: { value: new THREE.Vector4(-1, 0, 1, 0) }, uTime: { value: 0 }, ...selfLitUniforms() }; // (uFire: the firing tile, its heat, its crazing, the front's reach; uFireAt: the bead on it, in its own units)
    const mk = (o) => new THREE.ShaderMaterial({ name: 'press-marks', uniforms: this.uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, toneMapped: false, fog: false, ...o });
    this.mat = mk({ depthWrite: false }); this.lumpMat = mk({ depthWrite: true }); // (one program: the same shader and state, only the depth write differs)
    const geo = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
    const attrs = (n) => ({ col: new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3), col2: new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3), data: new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4) });
    const m = (this.mesh = new THREE.InstancedMesh(geo, this.mat, MARKS)); m.name = 'press-marks'; m.frustumCulled = false; m.renderOrder = 2;
    this.a = attrs(MARKS); m.geometry.setAttribute('aCol', this.a.col); m.geometry.setAttribute('aCol2', this.a.col2); m.geometry.setAttribute('aData', this.a.data);
    for (const at of [m.instanceMatrix, this.a.col, this.a.col2, this.a.data]) at.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < MARKS; i++) m.setMatrixAt(i, _z);
    group.add(m);
    this.dirty = [Infinity, -1]; this.lumps = [];
  }
  /** Instance `i`: where it lies (a matrix in the bath's frame), what it is, its colours and its numbers. */
  put(i, matrix, what, col, col2 = col, data = [0, 0, 0]) {
    this.mesh.setMatrixAt(i, matrix);
    this.a.col.setXYZ(i, col.r, col.g, col.b); this.a.col2.setXYZ(i, col2.r, col2.g, col2.b); this.a.data.setXYZW(i, what, data[0], data[1], data[2]);
    this.dirty[0] = Math.min(this.dirty[0], i); this.dirty[1] = Math.max(this.dirty[1], i);
  }
  hide(i) { this.mesh.setMatrixAt(i, _z); this.dirty[0] = Math.min(this.dirty[0], i); this.dirty[1] = Math.max(this.dirty[1], i); }
  /** Uploads only the instances changed since the last flush. */
  flush() {
    const [a, b] = this.dirty; if (b < a) return;
    const n = b - a + 1, m = this.mesh;
    for (const [at, k] of [[m.instanceMatrix, 16], [this.a.col, 3], [this.a.col2, 3], [this.a.data, 4]]) { at.addUpdateRange(a * k, n * k); at.needsUpdate = true; } // (the renderer uploads each range and clears them)
    this.dirty = [Infinity, -1];
  }
  /** An instance pool of solid lumps of one shape, on the same program (an instanced mesh with its own attributes). */
  lumpMesh(geometry, max) {
    const at = { col: new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3), col2: new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3), data: new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4) };
    geometry.setAttribute('aCol', at.col); geometry.setAttribute('aCol2', at.col2); geometry.setAttribute('aData', at.data);
    const m = new THREE.InstancedMesh(geometry, this.lumpMat, max); m.name = 'press-lumps'; m.count = 0; m.frustumCulled = false; m.userData.at = at;
    this.group.add(m); this.lumps.push(m); return m;
  }
  update() { this.uniforms.uTime.value = performance.now() / 1000; syncSelfLit(this.uniforms); }
  dispose() { this.mesh.geometry.dispose(); this.mat.dispose(); this.lumpMat.dispose(); for (const m of this.lumps) m.geometry.dispose(); }
}
