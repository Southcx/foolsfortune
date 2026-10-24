// ---------------------------------------------------------------------------------------
// THE SKIFF'S PAINT LOOK (docs/plans/SKIFF-TUNING.md 3, T8; Dovina's handoff of 2026-10-24): what the Solar Skiff wears, drawn. Dovina's
// rules (progress/skiffpaint.js: `game.skiffPaint.worn` { dye, pattern, seal, trail, ribbon, pennant, length }, `colourOf`, event
// `skiff.paint`) chosen at the race board's PAINT tab; this is how each choice looks. None of it touches the handling.
//   THE CLOTH   the owner's painted cloth (solarskiff_cloth.png: the cream sail with its terracotta spiral and grain, and the pennant's
//               red strip with its yellow band, one 256 px painting for both) baked once a change into one texture the cloth's own
//               material takes as its map (the same program: vfx/vessoulpaint.js); the bake is a single draw into a render target
//               and its mips, on one program of its own, and runs only when a choice changes and at load. In it, in order:
//     DYE       the cream taken to the dye's colour by the painting's own lightness, so its grain lines, border and seams stay: a
//               feeling's colour (weather.js COLOR, the one feeling palette), or a glaze made into a dye (glazes.js: its colour, and a
//               hint of its sheen on the material: its roughness a third of the way to the glaze's, a little of its metal).
//     PATTERN   solid; a stripe (a band across the sail, a racing sail's); a chevron (a point toward the luff, the way you go); the
//               dye feeling's paint motif (vfx/paintmotifs.js paintMotif, the ground's own GLSL, drawn in the sail's metres: Wonder's
//               frost, Mirth's dots ...; a dye with no feeling, the cloth or a glaze, has no motif, and the sail stays solid); the kiln
//               pattern of a rare glaze (vfx/finish.js FIN_PATTERN_GLSL, the vessel's own block, the sail's metres for the body's
//               space: the dye's glaze if it has one, else the first worn on the vessel's body, trim or mask). The Eye Cup's eye is
//               laid out on the Courier's body, so on the sail it is one oculus at the luff's head (eyecup.js eyeCupMask, the mask's
//               eye moved there and scaled: a boat's painted eye, the prow's kin); the jelly crown's dip is the sail dipped to its
//               lower quarter. Eight more (vfx/skiffsailpatterns.js, the owner's "more sails, new paintjobs", 2026-10-24): waves
//               (seigaiha), a sunburst, diamonds (harlequin), a checker down the leech, kintsugi's gold seams, constellations on a
//               night sky, flames from the foot, and a two-tone split; each in the dye with its second (the accent, gold, the deep, cream).
//     CUT       the sail's silhouette (vfx/skiffsailcut.js: stock, lateen, junk, crab-claw), the same cloth and bones: its geometry
//               swapped and its yard moved by the hoist (pose); a junk's battens drawn across the cloth here.
//     SPIRAL    the owner's spiral is always kept, on top of the dye and the pattern: in its own terracotta, or, where the dye is too
//               near it to read (luminance contrast, WCAG's ratio), reserved in the cloth's cream, as a resist under a dye.
//     SEAL      your seal (world/cradles.js `mine`; vfx/sealface.js drawSealFace) stamped in the sail's lower aft corner, clear of the
//               spiral, in a hanko's vermilion (the house's seal ink), or cream where the dye is vermilion's near kin; right-reading
//               from the boat's left, as a stamp through cloth reads backwards from the other side.
//     PENNANT   the pennant's strip recoloured (gold: the house's gold line; or a feeling's colour), its band paled in it; its length
//               the pennant chain's links set further apart (pose, after the clip and the code's ripple: boat.js own).
//   THE HULL    a hull painting (`hull`: vfx/skiffhulls.js), the hull's map swapped through the board's setHullPainting.
//   THE TRAIL   the wake on sand (world/ground/wake.js) in its own colour, Lachryma's (the house liquid's tint with the film walking
//               through it, as the boost's glow walks: boat.js SKIFF_BOOST_GLOW), or the hull glaze's colour; set on the wake's colour
//               each frame (its lines, band and bubbles).
//   THE RIBBON  while the board flares in the air: a ribbon of light streamed from the stern, faced to the eye, tapering and fading over
//               SKIFF_PAINT_LOOK.ribbon.life real seconds, in the boost's Lachryma (or the dye) with the film walking down it; one mesh,
//               one draw, blended over (added, it washed out to nothing on noon sand, as the combo's marks found: vfx/skiffcombomarks.js).
//
// Prior art: Mario Kart 8's kart and glider colours and Splatoon's gear dyes (what you race in says who you are, the model never new);
// F-Zero GX's machine paints and emblem (a decal laid on the body); Rocket League's trails and boost ribbons, opened by play and never a
// number; a racing dinghy's sail bands, chevrons and sail number, and a regatta's burgee; a hanko pressed on a scroll's lower corner; the
// oculus painted on Mediterranean bows; a resist dye (the spiral kept as batik keeps a line).
//
//   const look = new SkiffPaintLook(skiff, game)   (boat.js load, once the cloth is made)   look.apply()   look.frame(t)  (placePennant)
//   look.pose(bones)  (boat.js own: the pennant's length)   look.clear()  (the ribbon gone: stowed)   look.dispose()
//   skiffPaintPreview(game, kind, id)  (the race board's preview: a choice worn on the board for a look, not chosen)
//   SKIFF_PAINT_LOOK (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../progress/weather.js';
import { GLAZES } from '../courier/vessel/glazes.js';
import { PAINT_MOTIF, PAINT_LOOK_HEAD } from './paintmotifs.js';
import { FIN_PATTERN_GLSL } from './finish.js';
import { drawSealFace } from './sealface.js';
import { featTint } from './oxidation.js';
import { LACHRYMA_TINT } from './racewayeffects.js';
import { SAIL_PATTERNS, SAIL_PATTERN_GLSL } from './skiffsailpatterns.js';
import { SailCut, cutBattens } from './skiffsailcut.js';
import { wearHull } from './skiffhulls.js';
import { SkiffTrims } from './skifftrims/skifftrims.js';

/** The numbers. The cloth's painting in its UVs (glTF's, v down): the sail is u 0.015..0.735 (luff to leech), v 0.02..0.98 (yard to
 *  boom), the pennant's strip u past `penU`; `metres` the sail's metres a unit of u and of v (2.05 m of boom over 0.74 u, 1.91 m of hoist
 *  over 0.98 v); the painting's cream, terracotta and pennant red; the stripe's band in v; the chevron (its apex's u, its middle's v,
 *  how far aft its arms run a unit of v, its width in u, a second one this far aft); the seal (its middle and radius in UVs, clear of
 *  the spiral: measured off the painting); the oculus (its middle, its scale against the mask's eye); the kiln pattern's scale (the
 *  vessel's 1 / its span, for a sail seen from further) and the dip's line in v; the glaze dye's sheen; the pennant's gold and its long
 *  length (the links' spacing x); the trail's film; the ribbon (samples, real seconds, half width m, alpha, film, the stern's place). */
export const SKIFF_PAINT_LOOK = {
  size: 512, penU: 0.75, metres: [2.77, 1.95],
  cream: 0xf6e6c8, terracotta: 0xc2432b, red: 0xc2432b, vermilion: 0xe0442a, gold: 0xffd36a,
  stripe: [0.6, 0.71],
  chevron: { apex: 0.1, mid: 0.5, slope: 0.55, w: 0.07, gap: 0.14 },
  seal: { c: [0.656, 0.898], r: 0.066 },
  oculus: { c: [0.13, 0.25], s: 1.9 },
  kiln: 0.4, dip: 0.72,
  sheen: 0.35, metal: 0.3,
  pennant: { band: 0.6, long: 1.6 },
  batten: { half: 0.02, wood: 0x4a3222 }, night: 0x0d1530, deep: 0.16, near: 0.2,
  trail: { film: 0.3, rate: 0.3 },
  ribbon: { n: 40, life: 0.55, width: 0.34, alpha: 0.85, film: 0.35, rate: 0.6, along: 0.04, stern: [0, 0.35, -1.75], step: 0.12 },
};
const L = SKIFF_PAINT_LOOK;
const PATTERNS = { solid: 0, stripe: 1, chevron: 2, motif: 3, kiln: 4, oculus: 5, ...SAIL_PATTERNS }; // (6 .. 13: vfx/skiffsailpatterns.js)

// ---- the bake: one draw of the painting through the choices into the cloth's texture
const lin = (hex) => new THREE.Color(hex); // (THREE.Color takes hex as sRGB and keeps it linear: the shader's working space)
const glslLin = (hex) => { const c = lin(hex); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
const VERT = /* glsl */`
varying vec2 vUv; varying vec3 vFinObj; varying vec3 vFinN;
void main() {
  vUv = uv;
  vec2 m = uv * vec2(${L.metres[0].toFixed(3)}, ${L.metres[1].toFixed(3)});
  // (the sail in the kiln patterns' space: metres, its v down the sail as the body's y up, the dip's lip at L.dip; z off the luff so the
  // jelly crown's lip turns a few teeth across the sail)
  vFinObj = vec3(m.x - 1.0, 1.19 + (${L.dip.toFixed(3)} - uv.y) * ${L.metres[1].toFixed(3)}, 0.6); vFinN = vec3(0.0, 0.0, 1.0);
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;
const FRAG = /* glsl */`
uniform sampler2D uCloth; uniform sampler2D uSeal; uniform sampler2D uPmH; uniform vec4 uPmWin;
uniform vec3 uDye; uniform vec3 uAccent; uniform vec3 uInk; uniform vec3 uSealInk; uniform vec3 uPen; uniform vec3 uPenBand;
uniform float uDyeOn; uniform float uKeepSpiral; uniform float uPat; uniform float uMotif; uniform float uSealOn; uniform float uPenOn;
uniform vec3 uSecond; uniform vec3 uGold; uniform vec3 uDeep; uniform vec3 uCream; uniform vec3 uBatten;
varying vec2 vUv;
${FIN_PATTERN_GLSL.head}
${PAINT_LOOK_HEAD}
${SAIL_PATTERN_GLSL}
float spLuma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float spBand(float x, float a, float b, float w) { return smoothstep(a - w, a + w, x) * (1.0 - smoothstep(b - w, b + w, x)); }
void main() {
  vec4 src = texture2D(uCloth, vUv); vec3 c = src.rgb;
  float aa = 1.5 / ${L.size.toFixed(1)};
  if (vUv.x < ${L.penU.toFixed(3)}) {
    float gr = c.g / max(c.r, 1e-3), spiral = 1.0 - smoothstep(0.45, 0.6, gr); // (the terracotta and its dot: little green for their red)
    float lr = spLuma(c) / spLuma(${glslLin(L.cream)});                        // (the painting's lightness: its grain, its border, its seams)
    float lc = mix(lr, 1.0, spiral);                                           // (under the spiral: the cloth as if bare, so its edge has no fringe)
    vec3 cloth = uDyeOn > 0.5 ? uDye * min(lc, 1.08) : mix(c, ${glslLin(L.cream)}, spiral);
    int pat = int(uPat + 0.5);
    if (pat == 1) cloth = mix(cloth, uAccent * min(lc, 1.0), spBand(vUv.y, ${L.stripe[0].toFixed(3)}, ${L.stripe[1].toFixed(3)}, aa));
    else if (pat == 2) {
      float d = vUv.x - abs(vUv.y - ${L.chevron.mid.toFixed(3)}) * ${L.chevron.slope.toFixed(3)} - ${L.chevron.apex.toFixed(3)};
      float k = max(spBand(d, 0.0, ${L.chevron.w.toFixed(3)}, aa), spBand(d, ${L.chevron.gap.toFixed(3)}, ${(L.chevron.gap + L.chevron.w * 0.6).toFixed(3)}, aa));
      cloth = mix(cloth, uAccent * min(lc, 1.0), k);
    } else if (pat == 3) { vec3 e; float wet; cloth = paintMotif(cloth, vUv * vec2(${L.metres[0].toFixed(3)}, ${L.metres[1].toFixed(3)}), uMotif, e, wet); }
    else if (pat == 4) {
      vec4 diffuseColor = vec4(cloth, 1.0);
      ${FIN_PATTERN_GLSL.decl}
      finL = spLuma(cloth); finShade = clamp(lr, 0.6, 1.1);
      ${FIN_PATTERN_GLSL.pattern}
      cloth = diffuseColor.rgb;
    } else if (pat == 5) { // (the Eye Cup on a sail: one oculus at the luff's head, the mask's eye moved and scaled there)
      vec2 e = vUv - vec2(${L.oculus.c[0].toFixed(3)}, ${L.oculus.c[1].toFixed(3)});
      vec2 muv = vec2(0.166, 0.609) + e / ${L.oculus.s.toFixed(3)};
      float r = length(e), blk;
      vec3 eye = eyeCupMask(muv, 1.0, aa / ${L.oculus.s.toFixed(3)}, uFinB, blk);
      cloth = mix(cloth, eye * min(lc, 1.0), 1.0 - smoothstep(0.056 * ${L.oculus.s.toFixed(3)} - aa, 0.056 * ${L.oculus.s.toFixed(3)} + aa, r));
    } else if (pat >= 6) { // (the eight more: vfx/skiffsailpatterns.js, in the sail's metres from the luff's foot, y up)
      vec2 pm = vec2((vUv.x - 0.015) * ${L.metres[0].toFixed(3)}, (0.98 - vUv.y) * ${L.metres[1].toFixed(3)});
      cloth = sailPattern(pat, uDyeOn > 0.5 ? uDye : ${glslLin(L.cream)}, pm, lc, uSecond, uGold, uDeep, uCream);
    }
    vec3 ink = uKeepSpiral > 0.5 ? c : uInk * min(spLuma(c) / spLuma(${glslLin(L.terracotta)}), 1.0); // (a resist: the cream, shaded as the spiral was)
    c = mix(cloth, ink, spiral);
    if (uBatten.x > 0.5) { // (a junk sail's battens across the cloth, over the spiral: vfx/skiffsailcut.js)
      float bd = min(abs(vUv.y - uBatten.y), abs(vUv.y - uBatten.z)) * ${L.metres[1].toFixed(3)}, bm = ${L.batten.half.toFixed(3)};
      c = mix(c, ${glslLin(L.batten.wood)} * min(lr, 1.0), 1.0 - smoothstep(bm - 0.0065, bm + 0.0065, bd));
      c = mix(c, ${glslLin(L.batten.wood)} * 2.2 * min(lr, 1.0), 0.8 * (1.0 - smoothstep(0.003, 0.008, bd))); // (its round catching the light)
    }
    if (uSealOn > 0.5) {
      vec2 s = (vUv - vec2(${L.seal.c[0].toFixed(3)}, ${L.seal.c[1].toFixed(3)})) / ${(2 * L.seal.r).toFixed(4)} + 0.5;
      if (s.x > 0.0 && s.y > 0.0 && s.x < 1.0 && s.y < 1.0) c = mix(c, uSealInk * min(lr, 1.0), texture2D(uSeal, s).a * 0.9); // (a stamp: the grain through it)
    }
  } else if (uPenOn > 0.5) {
    float band = smoothstep(0.3, 0.5, c.g / max(c.r, 1e-3));                  // (the yellow band; the rest red, darker at its hems)
    float lr = min(spLuma(c) / spLuma(${glslLin(L.red)}), 1.0);
    c = mix(uPen * lr, uPenBand, band);
  }
  gl_FragColor = vec4(c, 1.0);
}`;

/** WCAG's contrast ratio between two colours (sRGB hex): how far apart they read in lightness alone. */
function contrast(a, b) {
  const Y = (h) => { const c = lin(h); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; };
  const y1 = Y(a), y2 = Y(b);
  return (Math.max(y1, y2) + 0.05) / (Math.min(y1, y2) + 0.05);
}

export class SkiffPaintLook {
  constructor(skiff, game) {
    this.skiff = skiff; this.game = game; this.preview = null;
    this.mat = skiff.clothMat; this.tex = this.mat?.map ?? null; // (the cloth as the maker painted it)
    this.base = this.mat ? { rough: this.mat.roughness, metal: this.mat.metalness } : null;
    this.pen = 1; this.wakeOwn = null; this.trailC = new THREE.Color(); this.dyeHex = null;
    this.ribbon = new Ribbon(game?.scene);
    this.cut = new SailCut(skiff); // (the sail's cut: vfx/skiffsailcut.js)
    this.trims = new SkiffTrims(skiff, game); // (the trail's look, the ribbon's and the pennant's shapes, the hull wrap: vfx/skifftrims/)
    const E = game?.events;
    this.offs = ['skiff.paint', 'vessel.fire', 'seal.carve'].map((ev) => E?.on?.(ev, () => this.apply()));
    this.apply();
  }

  /** What is worn (a preview over it, for the race board's look). */
  get worn() { const w = { ...(this.game?.skiffPaint?.worn || {}) }; if (this.preview) w[this.preview.kind] = this.preview.id; return w; }

  /** The choices made into the cloth, the pennant's length and the trail's kind: at load and on every `skiff.paint`. */
  apply() {
    const W = this.worn, g = this.game;
    wearHull(this.skiff, W.hull); // (a hull painting: vfx/skiffhulls.js; the owner's when none is worn or Dovina's catalogue lacks the kind)
    this.trims?.apply(W);
    this.pen = W.length === 'long' ? L.pennant.long : 1;
    this.trail = W.trail || 'own'; this.ribbonOn = W.ribbon === 'on';
    // the dye
    const dyeId = W.dye || 'cloth', glaze = dyeId.startsWith('glaze.') ? (g?.vessel?.glaze?.(dyeId.slice(6)) ?? GLAZES[dyeId.slice(6)]) : null;
    const dye = glaze ? glaze.color : COLOR[dyeId] ?? null;
    this.dyeHex = dye;
    // the pattern (a motif needs a feeling's dye; the kiln, a rare glaze: the dye's, else the vessel's)
    let pat = PATTERNS[W.pattern] ?? 0, motif = 0, kilnG = null;
    if (pat === 3) { motif = PAINT_MOTIF[dyeId] || 0; if (!motif) pat = 0; }
    if (pat === 4) {
      const look = g?.vessel?.look || {};
      kilnG = glaze?.pattern ? glaze : ['body', 'trim', 'mask'].map((r) => g?.vessel?.glaze?.(look[r]) ?? GLAZES[look[r]]).find((x) => x?.pattern) || null;
      if (!kilnG) pat = 0; else if (kilnG.pattern === 6) pat = 5;
    }
    // the pennant
    const penHex = W.pennant === 'gold' ? L.gold : W.pennant && W.pennant !== 'own' ? (COLOR[W.pennant] ?? null) : null;
    const sealOn = W.seal === 'on' && !!g?.cradles?.mine;
    // the cut (vfx/skiffsailcut.js: the cloth's silhouette and the yard; the stock cut for an id it does not know), and its battens
    this.cut?.set(W.cut); const battens = cutBattens(this.cut?.id);
    const stock = dye == null && pat === 0 && !sealOn && penHex == null && !battens;
    const M = this.mat; if (!M) return;
    // the glaze's sheen, a hint
    M.roughness = glaze ? THREE.MathUtils.lerp(this.base.rough, glaze.rough ?? this.base.rough, L.sheen) : this.base.rough;
    M.metalness = glaze ? Math.min(0.2, (glaze.metal ?? 0) * L.metal) : this.base.metal;
    if (stock || !this.tex) { this.setMap(this.tex); return; }
    const r = g?.renderer; if (!r) return;
    const cloth = dye ?? L.cream;
    const accent = dye == null ? lin(L.cream).multiplyScalar(0.45) : contrast(dye, 0x000000) > 6 ? lin(dye).multiplyScalar(0.45) : lin(dye).lerp(lin(L.cream), 0.6);
    // the eight more patterns' colours: the second (the accent), gold (or the dye's own shade where the dye is gold's near kin), the
    // deep (the dye darkened toward a night: the constellations' sky, the checker's dark), and the cream (or the deep, on a cream dye)
    const near = (a, b) => { const x = lin(a), y = lin(b); return Math.hypot(x.r - y.r, x.g - y.g, x.b - y.b) < L.near; };
    const deep = lin(cloth).multiplyScalar(L.deep).lerp(lin(L.night), 0.35);
    const field = pat === PATTERNS.constellations ? `#${deep.getHexString()}` : cloth; // (the spiral's ink chosen against the sky there)
    const keep = (dye == null && field === cloth) || contrast(field, L.terracotta) >= contrast(field, L.cream);
    const sealInk = contrast(cloth, L.vermilion) >= 1.5 ? L.vermilion : L.cream;
    if (sealOn) this.sealTex(g.cradles.mine);
    this.bake(r, {
      uDye: lin(cloth), uDyeOn: dye == null ? 0 : 1, uAccent: accent, uInk: lin(L.cream), uKeepSpiral: keep ? 1 : 0,
      uPat: pat, uMotif: motif, uSealOn: sealOn ? 1 : 0, uSealInk: lin(sealInk),
      uPen: lin(penHex ?? L.red), uPenBand: lin(penHex ?? L.red).lerp(lin(L.cream), L.pennant.band), uPenOn: penHex == null ? 0 : 1,
      uFinA: lin(cloth), uFinB: lin(kilnG?.color2 ?? 0x1c1410), uFinP: new THREE.Vector4(0, 0.5, pat === 4 ? kilnG.pattern : 0, L.kiln),
      uSecond: accent, uGold: near(cloth, L.gold) ? lin(cloth).multiplyScalar(0.45) : lin(L.gold), uDeep: deep, uCream: near(cloth, L.cream) ? deep : lin(L.cream),
      uBatten: new THREE.Vector3(battens ? 1 : 0, battens?.[0] ?? 0, battens?.[1] ?? 0),
    });
    this.setMap(this.rt.texture);
  }

  setMap(t) { const M = this.mat; if (M && M.map !== t) { M.map = M.emissiveMap = t; } }

  /** Your seal drawn once into a small canvas (redrawn only when it changes). */
  sealTex(seal) {
    const key = `${seal.name}|${seal.outline}|${seal.carving}`; if (this.sealKey === key) return;
    const S = 128, cv = this.sealCv ||= document.createElement('canvas'); cv.width = cv.height = S;
    const x = cv.getContext('2d'); x.clearRect(0, 0, S, S); drawSealFace(x, seal, { size: S, ink: '#ffffff' });
    // (thickened a pixel each way: drawn for a window, its hairlines vanished at a sail's size)
    const cp = document.createElement('canvas'); cp.width = cp.height = S; cp.getContext('2d').drawImage(cv, 0, 0);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) x.drawImage(cp, dx, dy);
    if (!this.sealT) { this.sealT = new THREE.CanvasTexture(cv); this.sealT.flipY = false; this.sealT.colorSpace = THREE.NoColorSpace; }
    this.sealT.needsUpdate = true; this.sealKey = key;
  }

  /** One draw: the painting through the choices into the render target, its mips made. */
  bake(r, u) {
    if (!this.rt) {
      this.rt = new THREE.WebGLRenderTarget(L.size, L.size, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, colorSpace: THREE.SRGBColorSpace, depthBuffer: false });
      this.rt.texture.anisotropy = 4; this.rt.texture.name = 'skiff-paint';
      const U = { uCloth: { value: this.tex }, uSeal: { value: null }, uPmH: { value: null }, uPmWin: { value: new THREE.Vector4() }, uFinOn: { value: 1 }, uFinS: { value: new THREE.Vector4() }, uFinPart: { value: 0 } };
      for (const k of Object.keys(u)) U[k] = { value: null };
      this.bakeMat = new THREE.ShaderMaterial({ name: 'skiff-paint-bake', uniforms: U, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false });
      this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.bakeMat); this.quad.frustumCulled = false;
      this.bakeScene = new THREE.Scene(); this.bakeScene.add(this.quad); this.bakeCam = new THREE.Camera();
    }
    const U = this.bakeMat.uniforms;
    for (const [k, v] of Object.entries(u)) U[k].value = v;
    U.uSeal.value = this.sealT ?? this.tex; U.uPmH.value = this.tex; // (uPmH: declared by the motifs' head for the ground's map, unread here)
    const prev = r.getRenderTarget();
    try { r.setRenderTarget(this.rt); r.render(this.bakeScene, this.bakeCam); } catch (e) { console.warn('the skiff\'s paint', e); }
    r.setRenderTarget(prev);
  }

  /** The pennant's length: each link's offset from the one before it, longer (after the pose: boat.js own). */
  pose(B) {
    if (this.pen !== 1 && B) for (let i = 1; i <= 5; i++) B[`pennant_${i}`]?.position.multiplyScalar(this.pen);
    this.cut?.pose(B, this.skiff.L); // (the yard where the cut wears it, by the hoist)
    this.trims?.pose(B);
  }

  /** Per frame, once the board is placed (boat.js placePennant): the trail's colour on the wake, and the ribbon. */
  frame(t) {
    const dt = Math.min(0.1, Math.max(0, t - (this.t ?? t))); this.t = t;
    const tech = this.game?.techs?.get?.('skiff');
    if (!tech || tech.skiff !== this.skiff) return; // (the Courier's own board: a stage's or a clone's never drives the wake)
    const wake = tech.wake;
    if (wake?.color) {
      this.wakeOwn ??= wake.color.getHex();
      const C = this.trailC;
      if (this.trail === 'lachryma') C.set(LACHRYMA_TINT).lerp(featTint(t * L.trail.rate, _fc, { bright: 1.1 }), L.trail.film);
      else if (this.trail === 'glaze') { const id = this.game.skiffParts?.glaze?.(); C.set((id && (this.game.vessel?.glaze?.(id) ?? GLAZES[id])?.color) ?? this.wakeOwn); }
      else C.set(this.wakeOwn);
      wake.color.copy(C);
    }
    const G = this.skiff.group;
    const flying = G.visible && !!tech.air && (tech.flaring || tech.boosting > 0.8);
    G.updateMatrixWorld();
    _v.set(...L.ribbon.stern).applyMatrix4(G.matrixWorld);
    this.ribbon.update(dt, t, this.ribbonOn && flying, _v, this.game.camera, this.dyeHex);
    this.trims?.frame(t, dt, { wake, flying, stern: _v, camera: this.game.camera, dye: this.dyeHex });
  }

  clear() { this.ribbon.clear(); this.trims?.clear(); }

  dispose() {
    for (const off of this.offs || []) off?.();
    this.setMap(this.tex); this.cut?.dispose(); this.rt?.dispose(); this.bakeMat?.dispose(); this.quad?.geometry.dispose(); this.sealT?.dispose(); this.ribbon.dispose(); this.trims?.dispose();
  }
}
const _v = new THREE.Vector3(), _fc = new THREE.Color();

// ---- the ribbon: a strip of light streamed from the stern while the board flares in the air
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), _s = new THREE.Vector3(), _rc = new THREE.Color(), _base = new THREE.Color();
class Ribbon {
  constructor(scene) {
    const N = L.ribbon.n;
    this.s = []; // { x, y, z, age }
    this.pos = new Float32Array(N * 2 * 3); this.col = new Float32Array(N * 2 * 4);
    const idx = []; for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = this.g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
    this.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.NormalBlending, fog: false, toneMapped: false }));
    this.mesh.name = 'skiff-ribbon'; this.mesh.frustumCulled = false; this.mesh.visible = false; this.mesh.renderOrder = 2;
    this.mesh.userData.zoneFree = true; // (drawn wherever the board flies: the Dunes and the Raceway)
    scene?.add(this.mesh);
  }
  clear() { this.s.length = 0; this.mesh.visible = false; }
  update(dt, t, emit, at, cam, dye) {
    const R = L.ribbon, S = this.s;
    for (const p of S) p.age += dt;
    while (S.length && S[0].age > R.life) S.shift();
    if (emit) {
      const last = S[S.length - 1];
      if (!last || Math.hypot(at.x - last.x, at.y - last.y, at.z - last.z) > R.step) { S.push({ x: at.x, y: at.y, z: at.z, age: 0 }); if (S.length > R.n) S.shift(); }
      else { last.x = at.x; last.y = at.y; last.z = at.z; last.age = 0; } // (the head rides the stern)
    }
    const n = S.length;
    if (n < 2 || !cam) { this.mesh.visible = false; return; }
    this.mesh.visible = true;
    _base.set(dye ?? LACHRYMA_TINT);
    for (let i = 0; i < R.n; i++) {
      const p = S[Math.min(i, n - 1)], live = i < n;
      const q = S[Math.min(i + 1, n - 1)], o = S[Math.min(Math.max(i - 1, 0), n - 1)];
      _d.set(q.x - o.x, q.y - o.y, q.z - o.z);
      _a.set(p.x, p.y, p.z); _b.copy(cam.position).sub(_a);
      _s.crossVectors(_d, _b); const l = _s.length(); if (l > 1e-6) _s.multiplyScalar(1 / l); else _s.set(0, 1, 0);
      const k = live ? 1 - p.age / R.life : 0, w = R.width * Math.sqrt(Math.max(0, k)) * (0.35 + 0.65 * (i / Math.max(1, n - 1)));
      _rc.copy(_base).lerp(featTint(t * R.rate - i * R.along, _fc, { bright: 1.2 }), R.film);
      const a = live ? R.alpha * k * k : 0;
      for (let e = 0; e < 2; e++) {
        const sg = e ? 1 : -1, o3 = (i * 2 + e) * 3, o4 = (i * 2 + e) * 4;
        this.pos[o3] = p.x + _s.x * w * sg; this.pos[o3 + 1] = p.y + _s.y * w * sg; this.pos[o3 + 2] = p.z + _s.z * w * sg;
        this.col[o4] = _rc.r; this.col[o4 + 1] = _rc.g; this.col[o4 + 2] = _rc.b; this.col[o4 + 3] = a;
      }
    }
    this.g.attributes.position.needsUpdate = true; this.g.attributes.color.needsUpdate = true;
  }
  dispose() { this.mesh.removeFromParent(); this.g.dispose(); this.mesh.material.dispose(); }
}

/** The race board's PAINT tab's preview: a choice worn on the Courier's board for a look, never chosen (null puts the worn back). */
export function skiffPaintPreview(game, kind = null, id = null) {
  const look = game?.techs?.get?.('skiff')?.skiff?.paintLook; if (!look) return false;
  look.preview = kind ? { kind, id } : null; look.apply(); return true;
}
