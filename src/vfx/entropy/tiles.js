// ---------------------------------------------------------------------------------------
// THE TILES (plain name; South, 2026-11-06: "individual tile meshes floating in space, so we can do cool cascading ripple effects for board
// setup and tile-flipping mechanics"; ENTROPY-TACTICS.md 7). Dovina's 49 meshes (world/entropy/entropyroom.js room.tiles, one a cell,
// never merged) keep being the truth; this gives each a model and a material and moves them, looks only:
//   the plate     a thin bevelled plate (1.6 x 0.18 x 1.6, her footprint) in one shared program (`entropy-tile`): its face polished bone with
//                 a fine engraved lattice that slowly slides, its edge lit in its side's colour (yours a pale cyan, theirs a pale vermilion,
//                 the neutral rank bone); its underside obsidian, the lattice lit in the other side's colour, so a tile turned over shows the
//                 other ground. Per-tile values go up in the mesh's onBeforeRender (one material, one program).
//   the tether    from each belly a short thread of motes fraying down into the void (one Points for all 49, `entropy-tether`)
//   the drift     each tile bobbing and tipping a little, out of phase with its neighbours
//   the cascade   setup(): every tile thrown far out as a shard and drawn home in a ripple from the board's heart (about 1.5 real s), its
//                 edges frayed into noise until it lands, snapping into place past home and back, a flash on its edge
//   a flip        flip(x, z): the tile turns over about its own horizontal axis, overshooting, lifted at mid-turn, a flash as it lands;
//                 its `face` (0 as laid, 1 turned) kept
//   a light       light(x, z, k, color): raised and edge-lit for the board view (k 0..1, eased; the colour a THREE.Color or hex, the
//                 eldritch hue when none), light(x, z, 0) to clear
//   its owner     own(x, z, o) (version 2's tiles have an owner: ENTROPY-TACTICS.md 8.3): the edge in its owner's colour (yours cyan,
//                 theirs vermilion, nobody's bone), washed with a flash when it changes (a pentacle's claim); flip(x, z, o) turns the
//                 tile a whole turn over and lands it in o's colour (exactly 21)
//   its sum       sum(x, z, s): the sum toward 21 written on the face in the board's stroke numerals (an atlas, pieces.js strokeText,
//                 blank at 0) inside a ring of 21 notches filling clockwise from the top, warming toward the eldritch hue near 21;
//                 bust(x, z): a shudder (the sum's own spray is the board view's)
//
// Prior art: Monument Valley's and Manifold Garden's tiles hung in an empty sky, Hearthstone's and MTG Arena's boards (a cell lit for a
// legal choice), Annihilation's shimmer and Control's Astral Plane (things fraying into noise as they come and go), Lucas Pope's Obra
// Dinn (the ordered dither of decay on the bone), Robert Penner's easing (the back ease's overshoot).
//
//   new EntropyTiles(game, look)   .attach(room)   .detach()   .tick(dt, t)   .setup()   .flip(x, z)   .tile(x, z) -> Mesh
//   .top(x, z, out) -> Vector3 (a tile's top centre as drawn now)   .light(x, z, k, color)   .face(x, z) -> 0 | 1
//   .own(x, z, o)   .flip(x, z, o?)   .sum(x, z, s)   .bust(x, z)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { BOARD } from '../../world/entropy/entropyroom.js';
import { strokeText } from './pieces.js';

const TILE = { w: 1.6, h: 0.18, bevel: 0.045 };
const CASCADE = { per: 0.085, dur: 0.66, out: [14, 30], up: [-9, 10], flash: 0.45 }; // (real s a metre from the heart; the flight; how far out)
const FLIP = { dur: 0.9, rise: 0.85 };
const SIDE = [0, 1, -1]; // (an owner as the shader's side: 0 yours, 1 theirs, -1 nobody)
const OUT = '\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n';

const TILE_VERT = `
varying vec3 vW, vN, vL, vNl;
void main() { vL = position; vNl = normal; vN = normalize( mat3( modelMatrix ) * normal ); vec4 w = modelMatrix * vec4( position, 1.0 ); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const TILE_FRAG = `
uniform float uT, uSide, uLk, uFlash, uFray, uSeed, uSum; uniform vec3 uLc, uEld; uniform sampler2D uNum; varying vec3 vW, vN, vL, vNl;
float h3( vec3 p ) { p = fract( p * 0.3183099 + 0.1 ); p *= 17.0; return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) ); }
float vn( vec3 x ) {
	vec3 i = floor( x ), f = fract( x ); f = f * f * ( 3.0 - 2.0 * f );
	return mix( mix( mix( h3( i ), h3( i + vec3( 1, 0, 0 ) ), f.x ), mix( h3( i + vec3( 0, 1, 0 ) ), h3( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
		mix( mix( h3( i + vec3( 0, 0, 1 ) ), h3( i + vec3( 1, 0, 1 ) ), f.x ), mix( h3( i + vec3( 0, 1, 1 ) ), h3( i + vec3( 1, 1, 1 ) ), f.x ), f.y ), f.z );
}
float bayer( vec2 p ) { p = mod( floor( p ), 4.0 ); return ( mod( p.x * 2.0 + p.y * 3.0, 4.0 ) * 4.0 + mod( p.x + p.y * 2.0, 4.0 ) ) / 16.0; }
vec3 sideCol( float s ) { return s < -0.5 ? vec3( 0.85, 0.78, 0.62 ) : s < 0.5 ? vec3( 0.45, 0.9, 1.0 ) : vec3( 1.0, 0.36, 0.22 ); }
void main() {
	// the cascade's fray: the plate eaten into noise until it lands, its torn edge lit
	float fn = vn( vL * 6.0 + uSeed * 13.0 + vec3( 0.0, uT * 0.5, 0.0 ) ), cut = uFray * 1.2 - 0.1;
	if ( uFray < 0.999 && fn > cut ) discard;
	float torn = uFray < 0.999 ? smoothstep( 0.12, 0.0, cut - fn ) : 0.0;
	vec3 N = normalize( vN ), V = normalize( cameraPosition - vW ), L = normalize( vec3( 0.3, 1.0, 0.45 ) );
	vec3 mine = sideCol( uSide ), other = sideCol( uSide < -0.5 ? -1.0 : 1.0 - uSide );
	vec2 p = vL.xz; float edge = max( abs( p.x ), abs( p.y ) ) / ( 0.5 * ${TILE.w.toFixed(2)} );
	// the lattice: two crossed families of fine grooves, sliding against each other
	float a = abs( fract( ( p.x + p.y ) * 3.2 + uT * 0.025 + uSeed ) - 0.5 ), b = abs( fract( ( p.x - p.y ) * 3.2 - uT * 0.018 ) - 0.5 );
	float c2 = abs( fract( length( p ) * 5.0 - uT * 0.04 ) - 0.5 );
	float lat = smoothstep( 0.05, 0.0, min( a, b ) ) * 0.8 + smoothstep( 0.03, 0.0, c2 ) * 0.35 * smoothstep( 0.9, 0.3, edge );
	float band = smoothstep( 0.84, 0.96, edge ), inner = smoothstep( 0.02, 0.0, abs( edge - 0.72 ) );
	float spec = pow( max( dot( reflect( -V, N ), L ), 0.0 ), 48.0 );
	vec3 c;
	if ( vNl.y > 0.6 ) { // the face: polished bone
		float l = 0.22 + 0.78 * max( dot( N, L ), 0.0 );
		l = l * 0.8 + 0.2 * step( bayer( gl_FragCoord.xy ), l );
		float decay = smoothstep( 0.62, 0.8, vn( vec3( p * 4.0, uSeed * 7.0 + uT * 0.01 ) ) );
		c = vec3( 0.64, 0.58, 0.46 ) * l * ( 1.0 - 0.45 * lat ) * ( 1.0 - 0.35 * decay ) + uEld * lat * 0.06 + vec3( 0.5 ) * spec * 0.5;
		float owned = step( -0.5, uSide ); // (an owned tile wears its owner over the whole face: version 2's ground is tile by tile, so it must read at a glance)
		c = mix( c, c * ( 0.45 + mine * 0.9 ), owned * 0.6 );
		c += mine * ( band * ( 1.1 + owned * 0.6 ) + inner * ( 0.25 + owned * 0.35 ) );
		if ( uSum > 0.5 ) { // the sum: its numeral (an atlas of 0..21) and its ring of 21 notches, filled clockwise from the top
			vec2 q = p / ( 0.5 * ${TILE.w.toFixed(2)} ); float r = length( q ), ang = fract( atan( q.x, -q.y ) / 6.2831853 + 1.0 );
			float ring = smoothstep( 0.035, 0.0, abs( r - 0.6 ) ), notch = step( 0.18, fract( ang * 21.0 ) ), fill = step( ang, uSum / 21.0 );
			float near = smoothstep( 12.0, 20.0, uSum ); vec3 ink = mix( vec3( 0.03, 0.02, 0.05 ), uEld * 0.6, near * 0.6 );
			c = mix( c, mix( vec3( 0.25, 0.22, 0.18 ), mix( mine * 0.9 + 0.05, uEld * 1.3, near ), fill ), ring * notch * ( 0.35 + 0.65 * fill ) );
			vec2 uv = vec2( q.x / 0.86 + 0.5, -q.y / 0.86 + 0.5 );
			if ( uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0 ) { float a = texture2D( uNum, vec2( ( uv.x + floor( uSum + 0.5 ) ) / 22.0, uv.y ) ).a; c = mix( c, ink, a ); }
		}
	} else if ( vNl.y < -0.6 ) { // the underside: obsidian, the other ground's lattice in it
		c = vec3( 0.006, 0.005, 0.011 ) + vec3( 0.7 ) * spec * 0.6 + other * ( lat * 0.3 + band * 0.9 + inner * 0.2 );
	} else { // the edge: lit in the side whose face is above it
		float up = smoothstep( -0.02, 0.0, vL.y ), seam = smoothstep( 0.012, 0.0, abs( vL.y + 0.035 ) );
		c = mix( vec3( 0.006, 0.005, 0.011 ) + other * seam * 0.5, mine * ( 0.7 + 0.3 * sin( uT * 1.7 + uSeed * 20.0 + vL.x * 2.0 ) ), up );
		band = up;
	}
	c += uLc * uLk * ( band * 1.8 + inner * ( 0.6 + 0.4 * sin( uT * 5.0 ) ) + 0.12 );
	c += vec3( 1.0, 0.97, 0.9 ) * uFlash * ( band * 2.5 + 0.2 );
	c += mix( uEld, vec3( 1.0 ), 0.3 ) * torn * 2.0;
	c += ( fract( sin( dot( gl_FragCoord.xy + uT * 37.0, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ) - 0.5 ) * 0.01;
	gl_FragColor = vec4( max( c, 0.0 ), 1.0 );
	${OUT}
}`;
// the tethers: a thread of motes off each belly, falling and fraying
const TETHER_VERT = `
uniform float uT, uScale; attribute vec4 aB; attribute vec4 aP; varying float vA;
void main() {
	float life = fract( uT * ( 0.22 + 0.2 * aP.z ) + aP.w );
	vec3 p = aB.xyz + vec3( aP.x * ( 1.0 - life * 0.6 ), 0.0, aP.y * ( 1.0 - life * 0.6 ) )
		+ vec3( sin( uT * 1.3 + aP.w * 30.0 ), 0.0, cos( uT * 1.1 + aP.w * 20.0 ) ) * 0.25 * life - vec3( 0.0, life * life * 2.6, 0.0 );
	vec4 mv = viewMatrix * vec4( p, 1.0 );
	vA = aB.w * ( 1.0 - life ) * smoothstep( 0.0, 0.08, life );
	gl_PointSize = uScale * 0.035 * ( 1.0 - 0.5 * life ) / max( -mv.z, 0.5 );
	gl_Position = projectionMatrix * mv;
}`;
const TETHER_FRAG = `
uniform vec3 uEld; varying float vA;
void main() { vec2 q = gl_PointCoord - 0.5; if ( dot( q, q ) > 0.25 ) discard; gl_FragColor = vec4( mix( uEld, vec3( 0.85, 0.8, 0.7 ), 0.35 ) * vA * 1.4, 1.0 ); ${OUT} }`;

/** The sums' numerals, 0 .. 21 in a row of 22 cells (alpha only: the shader inks them). */
function numeralAtlas() {
  const cv = document.createElement('canvas'); cv.width = 22 * 96; cv.height = 96; const c = cv.getContext('2d'); c.strokeStyle = c.fillStyle = '#fff';
  for (let n = 1; n <= 21; n++) strokeText(c, n, n * 96 + 48, 48, 58, { lw: 7 });
  const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t;
}
const rand = (s) => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
const backOut = (k) => { const c = 1.9; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };
const clamp01 = (k) => Math.min(1, Math.max(0, k));
const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _x = new THREE.Vector3(1, 0, 0), _v = new THREE.Vector3(), _v2 = new THREE.Vector2();

export class EntropyTiles {
  constructor(game, look) { this.game = game; this.look = look; this.room = null; this.S = []; this.setupAt = -1; }

  attach(room) {
    this.room = room;
    const mobile = !!this.game.graphics?.machine?.mobile, hue = this.look.void?.hue || new THREE.Color(0x8833ff);
    const U = this.U = { uT: { value: 0 }, uEld: { value: hue }, uScale: { value: 400 } };
    this.geo = new RoundedBoxGeometry(TILE.w, TILE.h, TILE.w, 2, TILE.bevel);
    const per = { uSide: { value: 0 }, uLk: { value: 0 }, uFlash: { value: 0 }, uFray: { value: 1 }, uSeed: { value: 0 }, uSum: { value: 0 }, uLc: { value: new THREE.Color() } };
    this.numTex = numeralAtlas(); U.uNum = { value: this.numTex };
    this.mat = new THREE.ShaderMaterial({ name: 'entropy-tile', vertexShader: TILE_VERT, fragmentShader: TILE_FRAG, uniforms: { ...U, ...per } });
    const R = rand(7717), h = (BOARD.size - 1) / 2;
    this.S = room.tiles.map((m, i) => {
      const c = m.userData.cell, out = new THREE.Vector3(c.x - h, 0, c.z - h);
      if (out.lengthSq() < 0.01) out.set(R() - 0.5, 0, R() - 0.5);
      out.normalize().multiplyScalar(THREE.MathUtils.lerp(...CASCADE.out, R())).setY(THREE.MathUtils.lerp(...CASCADE.up, R()));
      const s = { m, c, i, was: { geo: m.geometry, mat: m.material, onBR: m.onBeforeRender }, face: 0, flipT: -1, from: 0, side: c.side, toSide: c.side, sum: 0, shake: 0, lk: 0, lt: 0, lc: new THREE.Color().copy(hue), flash: 0, fray: 1,
        seed: R(), out, spin: new THREE.Vector3((R() - 0.5) * 9, (R() - 0.5) * 9, (R() - 0.5) * 9), d: Math.hypot(c.x - h, c.z - h) * (BOARD.tile + BOARD.gap), landed: true, up: 0 };
      m.geometry = this.geo; m.material = this.mat;
      m.onBeforeRender = () => { const u = this.mat.uniforms; u.uSide.value = s.side; u.uSum.value = s.sum; u.uLk.value = s.lk; u.uFlash.value = s.flash; u.uFray.value = s.fray; u.uSeed.value = s.seed; u.uLc.value.copy(s.lc); this.mat.uniformsNeedUpdate = true; };
      return s;
    });
    // the tethers
    const per2 = mobile ? 6 : 10, n = this.S.length * per2, g = new THREE.BufferGeometry();
    this.tB = new Float32Array(n * 4); const P = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { P[i * 4] = (R() - 0.5) * 1.1; P[i * 4 + 1] = (R() - 0.5) * 1.1; P[i * 4 + 2] = R(); P[i * 4 + 3] = R(); }
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aB', new THREE.BufferAttribute(this.tB, 4).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('aP', new THREE.BufferAttribute(P, 4));
    this.tMat = new THREE.ShaderMaterial({ name: 'entropy-tether', vertexShader: TETHER_VERT, fragmentShader: TETHER_FRAG, uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    this.tethers = new THREE.Points(g, this.tMat); this.tethers.frustumCulled = false; this.tethers.userData.entropyLook = true; this.per = per2;
    this.tethers.onBeforeRender = (r) => { const tg = r.getRenderTarget(); U.uScale.value = (tg ? tg.height : r.getDrawingBufferSize(_v2).y) * 0.9; };
    room.room.add(this.tethers);
    this.pose(this.look.t || 0);
  }

  detach() {
    const gone = !this.room?.built;
    for (const s of this.S) {
      const m = s.m; m.geometry = s.was.geo; m.material = s.was.mat; m.onBeforeRender = s.was.onBR; m.position.copy(s.c.home); m.quaternion.identity(); m.scale.set(1, 1, 1);
      if (gone) s.was.mat.dispose?.(); // (torn down already: hers would never draw again)
    }
    this.tethers?.parent?.remove(this.tethers);
    this.geo?.dispose(); this.mat?.dispose(); this.numTex?.dispose(); this.numTex = null; this.tMat?.dispose(); this.tethers?.geometry.dispose();
    this.S = []; this.room = null; this.tethers = null; this.geo = this.mat = this.tMat = null; this.setupAt = -1;
  }

  /** The cascade: every tile thrown out as a shard, drawn home in a ripple from the board's heart. */
  setup() { if (!this.room) return; this.setupAt = this.look.t; for (const s of this.S) { s.landed = false; s.flipT = -1; } this.pose(this.look.t); }
  /** The tile at (x, z) turned a whole turn over, landing in owner `o`'s colour (its colour changes as its edge passes upright). */
  flip(x, z, o) { const s = this.S[z * 7 + x]; if (!s) return; s.from = 0; s.flipT = 0; s.toSide = o == null ? s.side : SIDE.at(o); }
  /** Its owner (0, 1, -1 nobody): the edge's colour, washed with a flash when it changes (never mid-flip: the flip lands its own). */
  own(x, z, o) { const s = this.S[z * 7 + x], v = SIDE.at(o); if (!s || s.flipT >= 0 || s.side === v) return; s.side = s.toSide = v; s.flash = Math.max(s.flash, 0.8); }
  /** Its sum toward 21 (0 blank). */
  sum(x, z, n) { const s = this.S[z * 7 + x]; if (s) s.sum = n; }
  /** Over 21: a shudder. */
  bust(x, z) { const s = this.S[z * 7 + x]; if (s) { s.shake = 1; s.flash = Math.max(s.flash, 0.5); } }
  face(x, z) { return this.S[z * 7 + x]?.face ?? 0; }
  tile(x, z) { return this.room?.tiles[z * 7 + x] || null; }
  top(x, z, out = new THREE.Vector3()) { const m = this.tile(x, z); return m ? out.copy(m.position).setY(m.position.y + TILE.h / 2) : out; }
  light(x, z, k = 1, color = null) { const s = this.S[z * 7 + x]; if (!s) return; s.lt = clamp01(k); if (color != null) s.lc.set(color); else if (k > 0) s.lc.copy(this.U.uEld.value); }

  tick(dt, t) {
    if (!this.room) return;
    this.U.uT.value = t;
    for (const s of this.S) {
      s.lk = THREE.MathUtils.damp(s.lk, s.lt, 10, dt); if (s.lt === 0 && s.lk < 0.002) s.lk = 0;
      s.flash = Math.max(0, s.flash - dt / CASCADE.flash);
      s.shake = Math.max(0, s.shake - dt * 2.2);
      if (s.flipT >= 0) { s.flipT += dt; if (s.flipT >= FLIP.dur * 0.5) s.side = s.toSide; if (s.flipT >= FLIP.dur) { s.flipT = -1; s.flash = 1; } }
    }
    this.pose(t);
  }

  /** Every tile's place and turn as drawn now, and the tethers under them. */
  pose(t) {
    const B = this.tB, per = this.per;
    for (const s of this.S) {
      const m = s.m, c = s.c, i = s.i;
      let k = 1; if (this.setupAt >= 0) k = clamp01((t - this.setupAt - s.d * CASCADE.per) / CASCADE.dur);
      if (!s.landed && k >= 1) { s.landed = true; s.flash = 1; }
      const e = k >= 1 ? 1 : backOut(k), away = 1 - e;
      s.fray = k >= 1 ? 1 : Math.min(0.999, 0.15 + 0.85 * k * k);
      let flipA = s.face * Math.PI, rise = 0;
      if (s.flipT >= 0) { const f = clamp01(s.flipT / FLIP.dur); flipA = backOut(f) * Math.PI * 2; rise = Math.sin(Math.min(1, f * 1.15) * Math.PI) * FLIP.rise; }
      const bob = Math.sin(t * 0.8 + c.x * 0.7 + c.z * 0.5) * 0.05, raise = s.lk * 0.16, sk = s.shake * s.shake * 0.12;
      m.position.set(c.home.x + s.out.x * away + Math.sin(t * 61 + i) * sk, c.home.y + s.out.y * away + bob + rise + raise, c.home.z + s.out.z * away + Math.cos(t * 53 + i) * sk);
      _e.set(Math.sin(t * 0.6 + i * 1.7) * 0.022 + s.spin.x * away, s.spin.y * away, Math.cos(t * 0.5 + i * 1.3) * 0.022 + s.spin.z * away); _q.setFromEuler(_e);
      _q2.setFromAxisAngle(_x, flipA); m.quaternion.copy(_q).multiply(_q2);
      const sh = k >= 1 ? 1 : 0.35 + 0.65 * k; m.scale.set(sh * (1 + 0.3 * away), sh, sh * (1 - 0.3 * away));
      // the tether: from the belly, faint while it flies
      _v.copy(m.position).y -= TILE.h / 2 + 0.02; const a = k >= 1 ? 1 : 0.15 * k;
      for (let j = 0; j < per; j++) { const o = (i * per + j) * 4; B[o] = _v.x; B[o + 1] = _v.y; B[o + 2] = _v.z; B[o + 3] = a; }
    }
    if (this.tethers) this.tethers.geometry.attributes.aB.needsUpdate = true;
  }
}
