// ---------------------------------------------------------------------------------------
// A HULL WRAP (plain name, a new kind beside the hull glaze; the owner, 2026-10-24: "new paintjobs for the skiff"): livery laid over the
// Solar Skiff's hull glaze (vfx/hullglaze.js), never in its place: the glaze stays the hull's colour and sheen, the wrap is an overglaze
// painted on top of it, as enamels are fired over a glazed pot. Keyed by Dovina's catalogue's id (progress/skiffpaint.js PAINT.wrap when
// she adds it); an id this file does not know is the bare hull.
//   PINSTRIPES  two coach lines down each flank under the gunwale, a gold and a cream, sweeping down and meeting at the bow, a spear
//               point at their aft end (a coachbuilder's).
//   ROUNDEL     a racing roundel on each flank amidships: a cream disc, a dark ring, your number in it (0: the Fool's, the Courier's
//               card), or your seal stamped in it in a hanko's vermilion when you wear your seal on the sail.
//   FLAMES      hot-rod flames licking aft from the bow along both flanks, gold at the stem through orange to red at their tips, a
//               pale keyline round them.
//   KINTSUGI    a seam of gold wandering the length of each flank and across the deck, with a branch or two: the board's mends worn
//               proudly (the house's gold line, 0xffd36a).
// How: the hull's painting is baked into a texture of its own through the wrap, once a change (a wrap put on, a glaze fired, the worn
// hull's cracks: boat.js setHullMap asks `skiff.hullWrap`), never a frame. The bake draws the hull's own geometry in its UV space, so each
// texel knows where on the hull it lies (the bind pose: +Z the bow, y up, the deck at 0, the flanks at |x| ~0.4), and draws the wrap
// there by shape: lines and fills by distance, antialiased by their own derivative. The hull's painting is copied under it first, edge
// to edge, so nothing bleeds at the islands' seams. The hull's material multiplies its map by the glaze's tint (hullglaze.js), so the
// wrap is divided by that tint in the bake (an overglaze reads in its own colour over any glaze; on the darkest it reads darker). One
// program (the bake's), made the first time a wrap is worn; none while the hull is bare.
//
// Prior art: a coachbuilder's pinstripes; a racing car's roundel and its number (Le Mans, the Mille Miglia); hot-rod flames (Von
// Dutch's and the Kustom Kulture's); kintsugi, gold in the seam; the UV-space bake (a texture painter's projection: Substance's, Blender's
// texture bake), and the sail's own bake (vfx/skiffpaintlook.js).
//
//   const W = new SkiffHullWraps(skiff, game)   W.set(id, { seal }) -> bool   W.over(baseTexture) -> texture  (skiff.hullWrap)
//   W.dispose()   WRAP_LOOK (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { drawSealFace } from '../sealface.js';

/** The numbers, in the hull's bind pose (m): the bake's size; the flank (how square to the side a face must be); the pinstripes (their
 *  heights, how far they drop to the bow, from where, their widths, the aft spear's z, the bow's); the roundel (its middle z and y, its
 *  radius, ring); the flames (the bow's z, how far aft at most, tongues, their band in y); the kintsugi seam (its height, wander, width);
 *  the colours; the number. */
export const WRAP_LOOK = {
  size: 1024,
  flank: [0.3, 0.55],
  pin: { y: [0.04, -0.03], drop: [0.13, 0.08], from: 0.75, to: 1.7, w: [0.022, 0.015], aft: -0.95 },
  roundel: { z: -0.3, y: -0.05, r: 0.15, ring: 0.022 },
  flames: { bow: 1.85, len: 1.4, tongues: 4, y: [-0.25, 0.32], key: 0.02 },
  kintsugi: { y: -0.06, wander: 0.07, w: 0.016, deck: 0.35 },
  gold: 0xffd36a, cream: 0xf6e6c8, ink: 0x1c1410, vermilion: 0xe0442a, flame: [0xffe27a, 0xff8a1c, 0xd8281c], keyline: 0xfff1d6,
  number: '0',
};
const WL = WRAP_LOOK;
const KINDS = { pinstripes: 1, roundel: 2, flames: 3, kintsugi: 4 };
const glsl = (hex) => { const c = new THREE.Color(hex); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };

const VERT = /* glsl */`
uniform float uCopy;
varying vec2 vUv; varying vec3 vP; varying vec3 vN;
void main() {
  vUv = uv; vP = position; vN = normal;
  gl_Position = uCopy > 0.5 ? vec4(position.xy, 0.0, 1.0) : vec4(uv * 2.0 - 1.0, 0.0, 1.0);
}`;
const FRAG = /* glsl */`
uniform sampler2D uBase; uniform sampler2D uMark; uniform vec3 uTint; uniform float uKind; uniform float uCopy; uniform float uSeal;
varying vec2 vUv; varying vec3 vP; varying vec3 vN;
float aaLine(float d, float w) { float f = max(fwidth(d), 1e-4); return 1.0 - smoothstep(w - f, w + f, abs(d)); }
float aaIn(float d) { float f = max(fwidth(d), 1e-4); return 1.0 - smoothstep(-f, f, d); }
float h1(float x) { return fract(sin(x * 127.1) * 43758.5453); }
float n1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i), h1(i + 1.0), f) * 2.0 - 1.0; }
void main() {
  vec4 base = texture2D(uBase, vUv);
  if (uCopy > 0.5) { gl_FragColor = base; return; }
  vec3 col = vec3(0.0); float a = 0.0;
  float flank = smoothstep(${WL.flank[0].toFixed(3)}, ${WL.flank[1].toFixed(3)}, abs(vN.x));
  float side = vP.x >= 0.0 ? 1.0 : -1.0;
  int kind = int(uKind + 0.5);
  if (kind == 1) { // the pinstripes
    float k = smoothstep(${WL.pin.from.toFixed(3)}, ${WL.pin.to.toFixed(3)}, vP.z), on = smoothstep(${WL.pin.aft.toFixed(3)}, ${(WL.pin.aft + 0.12).toFixed(3)}, vP.z);
    float y0 = ${WL.pin.y[0].toFixed(3)} - ${WL.pin.drop[0].toFixed(3)} * k * k, y1 = ${WL.pin.y[1].toFixed(3)} - ${WL.pin.drop[1].toFixed(3)} * k * k;
    float spear = smoothstep(${WL.pin.aft.toFixed(3)}, ${(WL.pin.aft + 0.25).toFixed(3)}, vP.z); // (thin to a point at their aft end)
    float g = aaLine(vP.y - y0, ${WL.pin.w[0].toFixed(4)} * (0.3 + 0.7 * spear)) * on, c = aaLine(vP.y - y1, ${WL.pin.w[1].toFixed(4)} * (0.3 + 0.7 * spear)) * on;
    col = mix(${glsl(WL.cream)}, ${glsl(WL.gold)}, step(c, g)); a = max(g, c) * flank;
  } else if (kind == 2) { // the roundel: read right from outside on either flank
    vec2 q = vec2(-(vP.z - ${WL.roundel.z.toFixed(3)}) * side, vP.y - ${WL.roundel.y.toFixed(3)});
    float d = length(q) - ${WL.roundel.r.toFixed(3)};
    float disc = aaIn(d), ring = aaLine(d + ${(WL.roundel.ring * 0.5).toFixed(4)}, ${(WL.roundel.ring * 0.5).toFixed(4)});
    vec2 s = q / (${(WL.roundel.r * 2 * 0.8).toFixed(4)}) + 0.5; // (the mark inside the ring)
    float m = (s.x > 0.0 && s.y > 0.0 && s.x < 1.0 && s.y < 1.0) ? texture2D(uMark, s).a : 0.0;
    vec3 ink = uSeal > 0.5 ? ${glsl(WL.vermilion)} : ${glsl(WL.ink)};
    col = mix(mix(${glsl(WL.cream)}, ink, m * 0.95), ${glsl(WL.ink)}, ring); a = disc * flank;
  } else if (kind == 3) { // the flames, licking aft from the bow
    float v = clamp((vP.y - ${WL.flames.y[0].toFixed(3)}) / ${(WL.flames.y[1] - WL.flames.y[0]).toFixed(3)}, 0.0, 1.0);
    float back = ${WL.flames.bow.toFixed(3)} - vP.z;
    float w = v * ${WL.flames.tongues.toFixed(2)} + 0.25 * sin(back * 4.0 + side); // (each tongue curling as it runs aft)
    float tri = 1.0 - abs(fract(w) * 2.0 - 1.0);
    float reach = ${WL.flames.len.toFixed(3)} * (0.35 + 0.65 * pow(tri, 1.6)) * (0.775 + 0.225 * sin(floor(w) * 2.7 + 1.3)) * smoothstep(0.0, 0.25, v) * (1.0 - smoothstep(0.85, 1.0, v));
    float d = back - reach;
    float fill = aaIn(d), key = aaLine(d - ${WL.flames.key.toFixed(4)}, ${WL.flames.key.toFixed(4)});
    float heat = clamp(back / max(reach, 0.05), 0.0, 1.0);
    vec3 fc = heat < 0.5 ? mix(${glsl(WL.flame[0])}, ${glsl(WL.flame[1])}, heat * 2.0) : mix(${glsl(WL.flame[1])}, ${glsl(WL.flame[2])}, heat * 2.0 - 1.0);
    col = mix(${glsl(WL.keyline)}, fc, fill); a = max(fill, key) * flank * step(0.0, back);
  } else if (kind == 4) { // the kintsugi seam, down each flank and once across the deck
    float y = ${WL.kintsugi.y.toFixed(3)} + ${WL.kintsugi.wander.toFixed(3)} * (0.7 * n1(vP.z * 2.3 + side * 5.0) + 0.3 * n1(vP.z * 9.0 + side));
    float w = ${WL.kintsugi.w.toFixed(4)} * (0.6 + 0.6 * abs(n1(vP.z * 5.0 + 3.0)));
    float s1 = aaLine(vP.y - y, w) * flank;
    float yb = y - 0.05 - 0.09 * smoothstep(0.0, 0.3, vP.z - 0.2); // (a branch off it, down toward the keel)
    float s2 = aaLine(vP.y - yb, w * 0.7) * flank * step(0.2, vP.z) * (1.0 - step(0.55, vP.z));
    float top = smoothstep(0.5, 0.8, vN.y);
    float zc = ${WL.kintsugi.deck.toFixed(3)} + 0.08 * n1(vP.x * 8.0 + 2.0) + 0.03 * n1(vP.x * 23.0);
    float s3 = aaLine(vP.z - zc, w) * top;
    a = max(max(s1, s2), s3); col = ${glsl(WL.gold)} * (0.9 + 0.2 * n1(vP.z * 31.0 + vP.y * 17.0));
  }
  vec3 over = clamp(col / max(uTint, vec3(0.08)), 0.0, 1.0); // (the material's glaze tint multiplies the map: divided out, so the wrap reads as itself)
  gl_FragColor = vec4(mix(base.rgb, over, clamp(a, 0.0, 1.0)), base.a);
}`;

export class SkiffHullWraps {
  constructor(skiff, game) {
    this.skiff = skiff; this.game = game; this.id = null; this.sealKey = null; this.base = null; this.tint = new THREE.Color(1, 1, 1);
    skiff.hullWrap = (base) => this.over(base);
    this.off = game?.events?.on?.('skiff.glaze', () => this.refresh()); // (after boat.js's own: the glaze's tint is read again)
  }

  /** Wear a wrap by its id (and, for the roundel, your seal or null for the number): true if this file draws it. */
  set(id, { seal = null } = {}) {
    const next = KINDS[id] ? id : null, key = next === 'roundel' ? (seal ? `${seal.name}|${seal.outline}|${seal.carving}` : 'number') : '';
    if (next === this.id && key === this.sealKey) return !!next;
    this.id = next; this.sealKey = key; this.seal = seal;
    this.refresh();
    return !!next;
  }

  /** The hull's map put on again through the wrap (boat.js setHullMap: the base it was showing). */
  refresh() { const s = this.skiff; if (!s.hullMat) return; s.setHullMap(this.base && this.base !== s.hullTex ? this.base : null); }

  /** The texture the hull should wear over `base` (its painting, or the worn hull's cracks): `base` itself while bare. */
  over(base) {
    this.base = base;
    if (!this.id || !base) return base;
    const r = this.game?.renderer; if (!r) return base;
    try { this.bake(r, base); } catch (e) { console.warn('the hull\'s wrap', e); return base; }
    return this.rt.texture;
  }

  /** The roundel's mark: the number, or your seal (a canvas, drawn once a change). */
  mark() {
    const S = 128, cv = this.markCv ||= document.createElement('canvas'); cv.width = cv.height = S;
    const x = cv.getContext('2d'); x.clearRect(0, 0, S, S);
    if (this.seal) drawSealFace(x, this.seal, { size: S, ink: '#ffffff' });
    else { x.fillStyle = '#fff'; x.font = 'bold 104px Georgia, "Times New Roman", serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(WL.number, S / 2, S / 2 + 6); }
    if (!this.markT) { this.markT = new THREE.CanvasTexture(cv); this.markT.colorSpace = THREE.NoColorSpace; }
    this.markT.needsUpdate = true;
    return this.markT;
  }

  bake(r, base) {
    const s = this.skiff;
    if (!this.rt) {
      let hull = null; s.model?.traverse((o) => { if (!hull && o.isMesh && !o.userData.isOutline && o.material === s.hullMat) hull = o; });
      if (!hull) throw new Error('no hull');
      this.rt = new THREE.WebGLRenderTarget(WL.size, WL.size, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.NearestFilter, colorSpace: THREE.SRGBColorSpace, depthBuffer: false });
      this.rt.texture.anisotropy = 4; this.rt.texture.name = 'skiff-hull-wrap'; this.rt.texture.flipY = false;
      this.mat = new THREE.ShaderMaterial({ name: 'skiff-hull-wrap-bake', uniforms: { uBase: { value: null }, uMark: { value: null }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uKind: { value: 0 }, uCopy: { value: 0 }, uSeal: { value: 0 } },
        vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
      this.copyMat = this.mat.clone(); this.copyMat.uniforms.uCopy.value = 1; // (the same program: the painting copied edge to edge first)
      this.hullBake = new THREE.Mesh(hull.geometry, this.mat); this.hullBake.frustumCulled = false;
      this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.copyMat); this.quad.frustumCulled = false; this.quad.renderOrder = -1;
      this.scene = new THREE.Scene(); this.scene.add(this.quad, this.hullBake); this.cam = new THREE.Camera();
    }
    const tint = s.hullRest?.color ?? s.hullMat.color, U = this.mat.uniforms;
    U.uBase.value = base; this.copyMat.uniforms.uBase.value = base;
    U.uTint.value.set(tint.r, tint.g, tint.b); U.uKind.value = KINDS[this.id]; U.uSeal.value = this.seal ? 1 : 0;
    U.uMark.value = this.id === 'roundel' ? this.mark() : base;
    const prev = r.getRenderTarget(), ac = r.autoClear;
    r.autoClear = true; r.setRenderTarget(this.rt); r.render(this.scene, this.cam);
    r.setRenderTarget(prev); r.autoClear = ac;
  }

  dispose() { this.off?.(); if (this.skiff.hullWrap) this.skiff.hullWrap = null; this.rt?.dispose(); this.mat?.dispose(); this.copyMat?.dispose(); this.quad?.geometry.dispose(); this.markT?.dispose(); }
}
