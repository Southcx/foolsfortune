// ---------------------------------------------------------------------------------------
// THE ABERRANT'S LOOK (plain name): an aberrant Figment drawn as a Figment gone wrong, its data showing through, in place of the
// inversion (vfx/aberrantinvert.js, kept as the fallback the owner can compare: `ABERRANT_LOOK.mode`, '/aberrant own | invert' in
// DEBUG). Beside its data bug (vfx/databug.js: its one still error and the dark aura, kept), which finds the aberrants and calls this.
// Six parts, every one a rule a glance can read and none a strobe:
//
//   THE COMB      its body's surface laid in hex cells (the Comb's, OVERLAY.md 15.5: the stamp script's hex cells), wrapped round it
//                 without a seam; about a fifth of them flipped at any moment, each on a clock of its own (1.6 to 4 real s), out of
//                 phase with its neighbours: a flipped cell turns (its face narrowed to an edge and back, 0.05 real s) to show the
//                 body's colour's opposite, and turns back. The cells' net is drawn faint, and lit where the scan passes.
//   THE EDGE      the colour shifted to its opposite only along its silhouette (the fresnel rim): its hue turned half the wheel, its
//                 lightness kept (max + min - c), never a full inversion; a near-grey body takes the data's cyan there instead.
//   THE SCAN      a band of scanlines climbing its body every 2.6 real s, lit in the opposite colour.
//   THE SNAP      on a beat (0.68 real s, its phase its own), its vertices snapped to a coarse grid (an eleventh of its height) for
//                 0.09 real s, the PS1's wobble caught in a twitch; every third beat one slice of it slides a hand aside with it.
//   THE SHADOW    its own shadow taken off and one drawn wrong instead: cast TOWARD the sun (no light throws one that way), stretched,
//                 and a step behind it (its place sampled 8 times a real second and held: a frame late).
//   THE SHARDS    six small hex tiles of itself orbiting it, in its colour and its opposite, one in three skipping ahead on the beat.
//
// Never aliasing (CLAUDE.md, "No aliasing crawl"): the cells and the scanlines fade into their average as they shrink below a few
// pixels (each pattern's own screen derivative, the seam's taken from the far side of the atan), so a far aberrant reads as a quiet
// tint and its rim, never a crawl; the flips and the snap are held states (a tenth of a second at least), never a per-frame noise.
//
// Cost: ONE program a kind of aberrant body (the slip jelly and its blotlings, the Lantern Wisp, a clapperjar), shared by every
// aberrant of that kind, and one for the tsuitate's idol (`aberrantFigurine`): the body's main material is given a copy whose
// onBeforeCompile runs the original's first (the jelly's deformer, the rim's define) and then this one's, keyed `<its key>|aberrant1`.
// Warmed at boot (`prewarm()`: one body of each kind present wears its copy through the compile; the copies are kept, so the
// programs live). The shadow is the blob shadow's program (vfx/blobshadow.js, the same parameters), the shards the data drain's
// cubes' (vfx/datadrain.js: MeshBasicMaterial, unlit, instanced, its colours per instance): no program of their own.
// Rule 242: nothing shared is changed; the body's original material stays where its look writes it, synced to the copy each frame.
//
// Prior art: .hack//Infection's data bugs (the body a garish, slipped texture: wrongness as data showing), Digimon World's and
// Serial Experiments Lain's honeycomb of corrupted cells, the PS1's vertex snapping (here caught on a beat), the CRT's scanline band
// (Ghost in the Shell's thermoptic shimmer), the complementary colour of the colour wheel (Itten), the shadow that falls the wrong way
// (Nosferatu's, Peter Pan's that comes loose: a thing whose shadow disobeys is not of the world), and the debris of a broken model
// orbiting it (Kingdom Hearts' Heartless data, Watch Dogs 2's glitched props).
//
//   const L = new AberrantLook(game)   L.hold(c)   L.release(c)   L.has(c)   L.update(rawDt, kOf)   L.prewarm() -> park
//   aberrantFigurine(material, { height, y0, flat })   (the duel's idol: vfx/duelview/pieces.js)   ABERRANT_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** mode: 'own' (this look) | 'invert' (the placeholder, vfx/aberrantinvert.js); beat, snap: real s; scan: real s a pass; shards: a body;
 *  shadow: its stretch along the sun, how far toward it (radii), its darkness, its rate (samples a real s). */
export const ABERRANT_LOOK = { mode: 'own', beat: 0.68, snap: 0.09, scan: 2.6, shards: 6, maxShards: 96, shadow: { stretch: 2.2, toward: 1.25, alpha: 0.55, rate: 8 } };

const TIME = { value: 0 }; // (one clock for every aberrant, the idol's too)
const FIG_K = { value: 1 }; // (the idol's strength: 0 when the owner compares the inversion)
const KEY = 'aberrant1';

const VERT_HEAD = /* glsl */ `
uniform float uAbT, uAbK, uAbH, uAbY0, uAbSeed; varying vec3 vAbP;
float abHash( float n ) { return fract( sin( n ) * 43758.5453 ); }`;
const VERT_BODY = /* glsl */ `
vAbP = position;
{
	float beat = ( uAbT + uAbSeed * 0.37 ) / ${ABERRANT_LOOK.beat.toFixed(3)};
	float bi = floor( beat ), on = step( fract( beat ), ${(ABERRANT_LOOK.snap / ABERRANT_LOOK.beat).toFixed(3)} ) * step( 0.5, uAbK );
	float g = max( uAbH, 1e-3 ) / 11.0;
	transformed = mix( transformed, floor( transformed / g + 0.5 ) * g, on ); // (the PS1's wobble, caught on the beat)
	float hb = ( position.y - uAbY0 ) / max( uAbH, 1e-3 ), sl = abHash( bi * 7.13 + uAbSeed );
	float band = step( sl, hb ) * step( hb, sl + 0.14 ) * step( mod( bi, 3.0 ), 0.5 );
	transformed.x += band * on * uAbH * 0.07 * ( abHash( bi + 3.1 ) < 0.5 ? -1.0 : 1.0 ); // (a slice slid a hand aside)
}
`;
const FRAG_HEAD = /* glsl */ `
uniform float uAbT, uAbK, uAbH, uAbY0, uAbSeed, uAbFlat; varying vec3 vAbP;
vec4 abHex( vec2 p ) { // (the nearest hex cell: its offset from the centre, and its id)
	const vec2 s = vec2( 1.0, 1.7320508 );
	vec4 c = floor( vec4( p, p - vec2( 0.5, 1.0 ) ) / s.xyxy ) + 0.5;
	vec4 h = vec4( p - c.xy * s, p - ( c.zw + 0.5 ) * s );
	return dot( h.xy, h.xy ) < dot( h.zw, h.zw ) ? vec4( h.xy, c.xy ) : vec4( h.zw, c.zw + vec2( 0.5, 0.5 ) );
}
float abHexD( vec2 p ) { p = abs( p ); return max( dot( p, vec2( 0.5, 0.8660254 ) ), p.x ); } // (0 at the centre, 0.5 at the edge)`;
const FRAG_BODY = /* glsl */ `
if ( uAbK > 0.001 ) {
	vec3 base = diffuseColor.rgb;
	float mx = max( max( base.r, base.g ), base.b ), mn = min( min( base.r, base.g ), base.b );
	vec3 comp = mix( vec3( 0.18, 0.92, 0.88 ), vec3( mx + mn ) - base, smoothstep( 0.04, 0.14, mx - mn ) ); // (its hue half the wheel round; a grey takes the data's cyan)
	vec3 p = vAbP; float H = max( uAbH, 1e-3 ), hb = ( p.y - uAbY0 ) / H;
	// the Comb: round it (12 columns, an integer, so the wrap has no seam), or flat on a flat idol
	const float N = 12.0, TAU = 6.2831853;
	float a1 = atan( p.x, p.z ), a2 = atan( -p.x, -p.z );
	vec2 q = mix( vec2( a1 / TAU * N, hb * 6.0 ), vec2( p.x / H * 6.0, hb * 6.0 ), uAbFlat );
	vec2 fw = vec2( mix( min( fwidth( a1 ), fwidth( a2 ) ) / TAU * N, fwidth( p.x / H * 6.0 ), uAbFlat ), fwidth( q.y ) );
	float fwm = max( fw.x, fw.y );
	float aa = 1.0 - smoothstep( 0.09, 0.22, fwm ); // (a cell under about five pixels: its average, never a crawl)
	aa *= mix( smoothstep( 0.05, 0.14, length( p.xz ) / H ), 1.0, uAbFlat ); // (none where the columns pinch at a pole)
	vec4 hx = abHex( q ); vec2 id = vec2( mod( hx.z, N ), hx.w );
	float hr = fract( sin( dot( id, vec2( 12.9898, 78.233 ) ) + uAbSeed * 3.1 ) * 43758.5453 ), hr2 = fract( hr * 17.17 + 0.31 );
	float ph = fract( uAbT / ( 1.6 + 2.4 * hr2 ) + hr );
	float flipped = step( ph, 0.2 ), turn = clamp( min( ph, 0.2 - ph ) / 0.02, 0.0, 1.0 ); // (turned in 0.02 of its clock: 0.03 .. 0.08 real s)
	float d = abHexD( hx.xy ), w = fwm * 0.75 + 1e-4;
	float face = flipped * ( 1.0 - smoothstep( 0.44 * turn - w, 0.44 * turn + w, d ) );
	float net = smoothstep( 0.47 - w, 0.47 + w, d );
	// the scan: a band climbing it, fine lines inside it (faded as they shrink)
	float sp = fract( uAbT / ${ABERRANT_LOOK.scan.toFixed(2)} + uAbSeed * 0.13 ) * 1.4 - 0.2;
	float band = 1.0 - smoothstep( 0.0, 0.1, abs( hb - sp ) );
	float lf = hb * 60.0, lines = 0.5 + 0.5 * cos( lf * TAU );
	float scan = band * mix( 1.0, lines, 1.0 - smoothstep( 0.25, 0.5, fwidth( lf ) ) );
	// the edge: its opposite only along the silhouette
	float ndv = abs( dot( normalize( normal ), normalize( vViewPosition ) ) );
	float rim = smoothstep( 0.42, 0.82, 1.0 - ndv );
	vec3 col = mix( base, comp * 0.85, face * aa );
	col = mix( col, comp, rim * 0.8 );
	col = mix( col, mix( base, comp, 0.12 ), 1.0 - aa ); // (far off: the cells' average)
	diffuseColor.rgb = mix( base, col, uAbK );
	totalEmissiveRadiance += uAbK * comp * ( rim * 0.3 + scan * 0.45 + net * aa * ( 0.06 + 0.5 * band ) + face * aa * 0.12 );
}
`;

/** Hook a material (in place) to draw the look, its uniforms `U`; its own onBeforeCompile first, its key extended. */
function hook(k, U, orig = k.onBeforeCompile, origKey = k.customProgramCacheKey, from = k) {
  k.onBeforeCompile = function (sh, r) {
    orig?.call(this, sh, r);
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\n${VERT_HEAD}`).replace('#include <project_vertex>', `${VERT_BODY}\n#include <project_vertex>`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\n${FRAG_HEAD}`).replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${FRAG_BODY}`);
  };
  k.customProgramCacheKey = function () { return `${origKey ? origKey.call(from) : ''}|${KEY}`; };
  return k;
}
const lit = (m) => !!(m && (m.isMeshStandardMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial || m.isMeshToonMaterial));
const uniformsFor = (H, y0, seed, flat = 0, k = null) => ({ uAbT: TIME, uAbK: k || { value: 0 }, uAbH: { value: H }, uAbY0: { value: y0 }, uAbSeed: { value: seed }, uAbFlat: { value: flat } });

/** The look's copy of one material (the original untouched), or null where it is not lit. */
function lookCopy(m, U) {
  if (!lit(m)) return null;
  const k = m.clone();
  if (m.defines) k.defines = { ...m.defines }; // (Material.copy resets a Standard material's defines: the grey tint's and the rim's kept, vfx/greytint.js cloneTinted)
  hook(k, U, m.onBeforeCompile, m.customProgramCacheKey, m);
  k.name = (m.name || 'material') + '-aberrant'; k.userData = { ...m.userData, aberrant: true, shared: false };
  return k;
}

/** What decides a part's program, beside its key: so a part is dressed only where its main part's program would draw it. */
const sigOf = (o, m) => [m.type, !!m.map, !!m.vertexColors, !!m.flatShading, !!o.isSkinnedMesh, !!m.transparent, m.side, JSON.stringify(m.defines || {}), m.customProgramCacheKey?.call(m)].join('|');

/** The duel's idol (its own material, hooked in place): the look on the tsuitate's figurine, off when the inversion is compared. */
export function aberrantFigurine(mat, { height = 0.84, y0 = -0.42, flat = 1, seed = 1.7 } = {}) {
  if (!lit(mat)) return mat;
  return hook(mat, uniformsFor(height, y0, seed, flat, FIG_K));
}

/** The mesh a body is mostly drawn with (its most vertices; databug.js's choice). */
function mainMesh(c) {
  let best = null;
  (c.root || c.body)?.traverse?.((o) => { if (o.isMesh && o.geometry?.attributes?.position && (!best || o.geometry.attributes.position.count > best.geometry.attributes.position.count)) best = o; });
  return c.body?.isMesh ? c.body : best;
}

// (the blob shadow's program: its parameters, vfx/blobshadow.js)
function shadowGradient() {
  if (typeof document === 'undefined') return null;
  const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const x = cv.getContext('2d'), g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.8)'); g.addColorStop(0.8, 'rgba(255,255,255,0.25)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.name = 'aberrant-shadow';
  return t;
}

const KEEP = []; // (the boot's copies, never disposed: their programs live while one exists)
const Z = new THREE.Vector3(0, 0, 1), UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3(), _c = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _col = new THREE.Color();

export class AberrantLook {
  constructor(game) { this.game = game; this.held = new Map(); this.free = []; this.made = false; this.sun = null; }

  has(c) { return this.held.has(c); }

  make() {
    if (this.made) return; this.made = true;
    const g = this.game, N = ABERRANT_LOOK.maxShards;
    this.shadowMat = new THREE.MeshBasicMaterial({ name: 'aberrant-shadow', map: shadowGradient(), color: 0x000000, transparent: true, opacity: ABERRANT_LOOK.shadow.alpha, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    this.shadowGeo = new THREE.PlaneGeometry(2, 2);
    const hex = new THREE.CylinderGeometry(1, 1, 0.4, 6); hex.rotateX(Math.PI / 2);
    this.shards = new THREE.InstancedMesh(hex, new THREE.MeshBasicMaterial({ name: 'aberrant-shards', toneMapped: false }), N); // (the drain's cubes' program)
    this.shards.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    this.shards.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.shards.frustumCulled = false; this.shards.name = 'aberrant-shards';
    this.shards.userData.zoneFree = true;
    for (let i = 0; i < N; i++) { this.shards.setMatrixAt(i, _m.makeScale(0, 0, 0)); this.free.push(i); }
    g.scene?.add(this.shards);
  }

  /** The body's main material(s) given their copies; its true shadow taken off; its wrong shadow and its shards set out. */
  hold(c) {
    if (this.held.has(c)) return;
    this.make();
    const mesh = mainMesh(c), list = [], casts = [];
    const seed = ((c.id ?? 1) * 1.618) % 7;
    let H = 1, y0 = 0;
    if (mesh?.geometry) { mesh.geometry.computeBoundingBox(); const bb = mesh.geometry.boundingBox; H = Math.max(1e-3, bb.max.y - bb.min.y); y0 = bb.min.y; }
    const U = uniformsFor(H, y0, seed);
    const mains = new Set(mesh ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : []);
    const sigs = new Set([...mains].filter(lit).map((m) => sigOf(mesh, m))); // (a body of many parts, the Wisp's: every part its main part's program draws)
    const copies = new Map();
    (c.root || c.body)?.traverse?.((o) => {
      if (!o.isMesh) return;
      if (o.castShadow) { casts.push(o); o.castShadow = false; } // (its true shadow off: the wrong one is drawn instead)
      if (!o.material || o.name?.startsWith?.('databug')) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m, slot) => {
        if (!mains.has(m) && !(lit(m) && sigs.has(sigOf(o, m)))) return; // (only what the body's own program draws: one program a kind)
        let k = copies.get(m); if (k === undefined) { k = lookCopy(m, U); copies.set(m, k); }
        if (!k) return;
        list.push({ o, slot: Array.isArray(o.material) ? slot : -1, m, k });
        if (Array.isArray(o.material)) { o.material = o.material.slice(); o.material[slot] = k; } else o.material = k;
      });
    });
    const shadow = new THREE.Mesh(this.shadowGeo, this.shadowMat); shadow.name = 'aberrant-shadow'; shadow.castShadow = shadow.receiveShadow = false; shadow.renderOrder = 1; shadow.userData.zoneFree = true; shadow.visible = false;
    this.game.scene?.add(shadow);
    const n = Math.min(ABERRANT_LOOK.shards, this.free.length), shards = [];
    for (let i = 0; i < n; i++) shards.push({ i: this.free.pop(), a: (i / n) * Math.PI * 2, tilt: (i % 3 - 1) * 0.5, sp: 0.5 + 0.25 * (i % 2), y: (i / n) - 0.5, s: 0.05 + 0.03 * ((i * 7) % 3) / 2, comp: i % 2 === 1, skip: i % 3 === 0, spin: i * 1.3 });
    this.held.set(c, { list, casts, U, shadow, shards, sampleT: 0, at: new THREE.Vector3().copy(c.pos), lastBeat: -1 });
    this.sync(this.held.get(c));
  }

  release(c) {
    const H = this.held.get(c); if (!H) return;
    for (const e of H.list) {
      if (e.slot >= 0 && Array.isArray(e.o.material) && e.o.material[e.slot] === e.k) { e.o.material = e.o.material.slice(); e.o.material[e.slot] = e.m; }
      else if (e.o.material === e.k) e.o.material = e.m;
    }
    for (const k of new Set(H.list.map((e) => e.k))) k.dispose();
    for (const o of H.casts) o.castShadow = true;
    H.shadow.parent?.remove(H.shadow);
    for (const s of H.shards) { this.shards.setMatrixAt(s.i, _m.makeScale(0, 0, 0)); this.free.push(s.i); }
    this.shards.instanceMatrix.needsUpdate = true;
    this.held.delete(c);
  }

  /** Each copy synced from its original, as the body wrote it this frame. */
  sync(H) {
    for (const { m, k } of H.list) {
      k.color.copy(m.color);
      if (m.emissive && k.emissive) k.emissive.copy(m.emissive);
      if (m.emissiveIntensity !== undefined) k.emissiveIntensity = m.emissiveIntensity;
      k.opacity = m.opacity; k.wireframe = m.wireframe; k.visible = m.visible;
      if (m.roughness !== undefined) k.roughness = m.roughness;
    }
  }

  sunDir(out) {
    const g = this.game;
    if (!this.sun) g.scene?.traverse?.((o) => { if (!this.sun && o.isDirectionalLight && o.castShadow) this.sun = o; });
    const S = this.sun;
    if (!S) return out.set(0.6, 0, -0.8);
    out.copy(S.position).sub(S.target?.position || _c.set(0, 0, 0)); out.y = 0;
    return out.lengthSq() > 1e-6 ? out.normalize() : out.set(0.6, 0, -0.8);
  }

  /** kOf(c): the look's strength for a creature (the data bug's gathering, 0..1). */
  update(raw, kOf = () => 1) {
    TIME.value = (TIME.value + raw) % 3600;
    FIG_K.value = ABERRANT_LOOK.mode === 'own' ? 1 : 0;
    if (!this.held.size) return;
    const g = this.game, SH = ABERRANT_LOOK.shadow, sun = this.sunDir(new THREE.Vector3());
    const beat = Math.floor(TIME.value / ABERRANT_LOOK.beat);
    for (const [c, H] of this.held) {
      this.sync(H);
      const shown = c.alive !== false && c.root?.visible !== false;
      const k = shown ? Math.max(0, Math.min(1, kOf(c) ?? 1)) : 0;
      H.U.uAbK.value = k;
      // the wrong shadow: toward the sun, stretched, a step behind
      if ((H.sampleT -= raw) <= 0) { H.sampleT = 1 / SH.rate; H.at.copy(c.pos); }
      const R = (c.radius || 0.5), gy = g.dunes?.heightAt?.(H.at.x, H.at.z);
      const y = Number.isFinite(gy) && Math.abs(gy - c.pos.y) < 4 ? gy : H.at.y;
      H.shadow.visible = k > 0.02;
      H.shadow.position.set(H.at.x + sun.x * R * SH.toward, y + 0.03, H.at.z + sun.z * R * SH.toward);
      H.shadow.quaternion.setFromUnitVectors(Z, UP).multiply(_q.setFromAxisAngle(Z, Math.atan2(-sun.x, -sun.z)));
      H.shadow.scale.set(R * 0.9, R * 0.9 * SH.stretch, 1);
      // the shards: orbiting it, one in three skipping ahead on the beat
      if (c.center) c.center(_c); else _c.copy(c.pos).setY(c.pos.y + (c.height || 1) * 0.55);
      const skip = beat !== H.lastBeat; H.lastBeat = beat;
      for (const s of H.shards) {
        s.a += raw * s.sp; if (skip && s.skip) s.a += 0.9;
        const r = R * 1.5 + 0.2, ca = Math.cos(s.a), sa = Math.sin(s.a);
        _v.set(_c.x + ca * r, _c.y + s.y * (c.height || 1) * 0.8 + sa * s.tilt * r * 0.4, _c.z + sa * r);
        _q.setFromEuler(_e.set(TIME.value * 0.7 + s.spin, s.a * 2, TIME.value * 0.4));
        const sz = s.s * (0.6 + 0.8 * R) * k;
        this.shards.setMatrixAt(s.i, _m.compose(_v, _q, _s.set(sz, sz, sz)));
        const m0 = H.list[0]?.m?.color || c.mat?.color;
        if (m0) { _col.copy(m0); if (s.comp) { const mx = Math.max(_col.r, _col.g, _col.b), mn = Math.min(_col.r, _col.g, _col.b); if (mx - mn < 0.08) _col.setRGB(0.18, 0.92, 0.88); else _col.setRGB(mx + mn - _col.r, mx + mn - _col.g, mx + mn - _col.b); } }
        else _col.setRGB(0.18, 0.92, 0.88);
        this.shards.setColorAt(s.i, _col);
      }
    }
    this.shards.instanceMatrix.needsUpdate = true; if (this.shards.instanceColor) this.shards.instanceColor.needsUpdate = true;
  }

  /** For the boot's warm-up: one body of each kind present wears its copy through the compile (shown); the park gives the originals
   *  back and keeps the copies, so the programs live. The shards and the shadow are parked shown 50 m down. */
  prewarm() {
    this.make();
    const g = this.game, swaps = [], shown = [];
    for (const kind of [g.wisps?.list?.[0], g.jellies?.list?.[0], g.clappers?.list?.[0]]) {
      if (!kind) continue;
      const mesh = mainMesh(kind); if (!mesh) continue;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const U = uniformsFor(1, 0, 0, 0, { value: 1 });
      const ks = mats.map((m) => lookCopy(m, U));
      if (!ks.some(Boolean)) continue;
      swaps.push({ mesh, was: mesh.material }); KEEP.push(...ks.filter(Boolean));
      mesh.material = Array.isArray(mesh.material) ? mats.map((m, i) => ks[i] || m) : ks[0];
      for (let o = mesh; o; o = o.parent) if (!o.visible) { o.visible = true; shown.push(o); }
    }
    const parked = new THREE.Mesh(this.shadowGeo, this.shadowMat); parked.position.set(0, -50, 0); parked.castShadow = parked.receiveShadow = false; g.scene?.add(parked);
    this.shards.setMatrixAt(0, _m.compose(_v.set(0, -50, 0), _q.identity(), _s.set(0.1, 0.1, 0.1))); this.shards.instanceMatrix.needsUpdate = true;
    return () => {
      for (const s of swaps) s.mesh.material = s.was;
      for (const o of shown) o.visible = false;
      parked.parent?.remove(parked);
      this.shards.setMatrixAt(0, _m.makeScale(0, 0, 0)); this.shards.instanceMatrix.needsUpdate = true;
    };
  }
}
