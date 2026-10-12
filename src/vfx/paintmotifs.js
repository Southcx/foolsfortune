// ---------------------------------------------------------------------------------------
// THE PAINT'S MOTIFS: what the paint map looks like on the ground (world/ground/paintmap.js keeps the cells and patches the ground's
// shaders; this is the picture it draws). Each feeling's paint carries a PATTERN as well as its colour, so no paint is told by colour
// alone (CLARITY.md; GALL-AND-FURY.md: "the motifs make Fury and Desire distinct"), and crude, which carries no feeling, has no colour of
// one. One chunk, one branch on the cell's motif byte, in the ground's own program (no program of its own: casebook rule 124).
//
//   WONDER  hexagonal ice: a frost lattice of fine pale lines, a glint in some cells (the diamond dust; Ego's hexagons)
//   MIRTH   sun-dapples: a staggered field of bright round drops (the fox's wedding, the sunshower)
//   DESIRE  the wanting wind's ripples: crests drawn across the paint, each with its shadow on the lee (Influence's sand)
//   FURY    heat: the paint split into plates by cracks of light that glow, the plates charred toward their middles (sparks, cracks)
//   GALL    rot: a curdled film, dark curds of every size, each with a pale skin, and wetter than the rest
//   GRIEF   the long rain: fine straight streaks, broken, darker than its pale blue (wet)
//   DREAD   ink and smoke: the paint marbled in pale contour lines (suminagashi: ink floated on water and lifted off)
//   CRUDE   a blot's crude and a slick: no feeling, so no feeling's colour: the oxidation ramp (vfx/oxidation.js slickColour, the
//           look the slick meshes wore before the map drew them, v159): a blot at its start, black, its oil film's lines faint but at a
//           grazing eye and brightest round its thin rim; a slick down the ramp by its age (in the motif byte's fraction): the film's
//           bands up through it, then a pale sheen, the floor stained dark through it, soaking away at the end, never a pop
// Lines are drawn in world metres and never thinner than a pixel (a thinner one is widened and dimmed to keep its weight), and a
// pattern fades to its mean before a pixel spans half its period, so nothing crawls at range or at a grazing angle (CLAUDE.md, Feel).
// Every motif has a light part and a dark part against its colour (casebook rule 105): checked in greyscale and with a protanopia
// simulation (Machado 2009) on the Throwing Room's paint range.
// THE LOOK (docs/plans/PAINT.md section 2, phase 3), one path over every cell:
//   EDGES      from a smooth field, never the grid: the amount sampled Catmull-Rom (five taps), so a print is a round dot and a streak a
//              stroke; thresholded with a soft edge (wider where a pixel spans more) and moved a little by smooth noise
//   THICKNESS  the amount as a height (a bulge from the edge to a flat top: PAINT_LOOK.bulge, drawn, never collided) whose slope tilts
//              the lit normal (PAINT_LOOK_NORMAL), flattened where a cell is a few pixels so it never crawls
//   GLOSS      the wet top reflects the room (Schlick's Fresnel over a sky: pmoGloss), glossiest where thick; a feeling's paint dries
//              matte over PAINT_DRY real seconds since it was last wetted (its dryness in the motif byte's fraction), a little lighter
//
// Prior art: Splatoon's ink (a flat bright body, a crisp edge, a gloss highlight), Super Mario Sunshine's goop (a glossy, env-mapped
// film with a raised rim), metaballs' thresholded smooth field (Blinn 1982) for the edge, Catmull-Rom filtering in five taps (Jimenez,
// "Filmic SMAA", SIGGRAPH 2016; TheRealMJP's SampleTextureCatmullRom, MIT), suminagashi marbling, the craquelure and crawl of a
// glaze (the cracks of light), the frost on a window (the hexagonal lattice), and the dot, hatch and stipple of a printer's screen,
// which tell inks apart where colour cannot (every map legend for the colour-blind). The hash is Dave Hoskins' "Hash without Sine"
// (Shadertoy 4djSRW, MIT), which holds its precision at the Dunes' coordinates where sin() does not.
//
//   PAINT_LOOK_HEAD       the declarations and functions (after the map's uniforms and varyings)
//   PAINT_LOOK_BODY       the block that lays the paint on diffuseColor (at <alphamap_fragment>; sets pmGlow, pmGrad, pmWet, pmK)
//   (the motif byte is a float: its whole part the motif, its fraction a slick's age or a paint's dryness)
//   PAINT_LOOK_ROUGH      the line after <roughnessmap_fragment>: the paint's gloss (standard materials; a no-op on others)
//   PAINT_LOOK_NORMAL     the line after <normal_fragment_maps>: the bulge's slope on the lit normal (lit materials; a no-op on others)
//   paintMotifCode(aspectIndex, crudeKind, k, dry) -> the motif byte a cell is uploaded with (k: a slick's share left, its age 1 - k)
//   PAINT_MOTIF   CRUDE_MOTIF   SLICK_MOTIF   PAINT_DRY   PAINT_LOOK (the knobs)
// ---------------------------------------------------------------------------------------
import { ASPECTS } from '../progress/weather.js';
import { OXIDATION_GLSL } from './oxidation.js';

/** The motif each feeling's paint carries (the byte in the map's second channel; 0 is bare ground). */
export const PAINT_MOTIF = { wonder: 1, mirth: 2, desire: 3, fury: 4, gall: 5, grief: 6, dread: 7 };
export const CRUDE_MOTIF = 8, SLICK_MOTIF = 9;
const BY_INDEX = ASPECTS.map((a) => PAINT_MOTIF[a] || 0);
/** A cell's motif byte: its feeling's (index into ASPECTS), or crude's (`crudeKind` 1 a blot's, 2 a slick's: paintmap.js `crude`); a
 *  slick carries its age in the fraction (`k` its share left: 1 fresh, 0 gone), so it oxidises on as it fades; a feeling's paint how
 *  dry it is (`dry` 0 wet .. 1 matte). A blot's crude keeps wet. */
export const paintMotifCode = (aspectIndex, crudeKind = 0, k = 1, dry = 0) => (crudeKind === 2 ? SLICK_MOTIF + 0.95 * Math.min(1, Math.max(0, 1 - k))
  : crudeKind ? CRUDE_MOTIF : (BY_INDEX[aspectIndex] || 0) + 0.95 * Math.min(1, Math.max(0, dry)));
/** Real seconds a feeling's paint takes to dry from its wet gloss to matte (paintmap.js keeps when each cell was last wetted). */
export const PAINT_DRY = 45;
/** The look's knobs: EDGE the amount the edge lies at (a cell's own amount: 0.22 keeps a fading print a dot a little longer); SOFT the
 *  edge's half-width in amount (wider where a pixel spans more); WOBBLE how far the edge's noise moves it; BULGE the gloss bulge's
 *  height in metres, drawn, never collided (a slope for the light to catch, exaggerated as a sixth-generation bump is). */
export const PAINT_LOOK = { edge: 0.22, soft: 0.05, wobble: 0.1, bulge: 0.08 };

export const PAINT_LOOK_HEAD = /* glsl */`
vec3 pmGlow = vec3(0.0); vec2 pmGrad = vec2(0.0); float pmWet = 0.0, pmK = 0.0;
float pmoH1(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 pmoH2(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float pmoNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(pmoH1(i), pmoH1(i + vec2(1.0, 0.0)), f.x), mix(pmoH1(i + vec2(0.0, 1.0)), pmoH1(i + vec2(1.0, 1.0)), f.x), f.y); }
float pmoFbm(vec2 p) { return 0.55 * pmoNoise(p) + 0.3 * pmoNoise(p * 2.03 + 7.1) + 0.15 * pmoNoise(p * 4.1 + 3.3); }
// (a line of half-width hw metres at distance d, px metres a pixel: never thinner than a pixel; widened, it is dimmed to keep its weight)
float pmoLine(float d, float hw, float px) { float w = max(hw, px * 0.6); return (1.0 - smoothstep(w - 0.5 * px, w + 0.5 * px, d)) * min(1.0, hw / w * 1.4); }
// (a pattern of period p metres fades to its mean before a pixel spans half of it)
float pmoFade(float p, float px) { return 1.0 - smoothstep(0.15, 0.4, px / p); }
float pmoBand(float ph) { return 0.5 - abs(fract(ph) - 0.5); }
${OXIDATION_GLSL}
// the map's amount as a smooth field: Catmull-Rom over the cells in five bilinear taps (Jimenez's TAA filter, after TheRealMJP's nine-tap
// SampleTextureCatmullRom, MIT): it passes through every cell's own amount (the edge lies where the game's cells say), but its isolines
// are rounded, so a print is a dot and a streak a stroke, never a run of 0.25 m squares
// the wet top's reflection, sixth-generation style (Sunshine's goop and water: an environment, not the room's lamps): Schlick's Fresnel
// for a water-like film (F0 0.02) over a sky that is bright above and dim at the horizon, so the bulge's rim, tilted toward the eye or
// away, catches it as a band of light
vec3 pmoGloss(vec3 N, vec3 V) {
  float ndv = clamp(dot(N, V), 0.0, 1.0), F = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
  vec3 R = reflect(-V, N);
  return vec3(1.0, 0.96, 0.9) * min(0.45, 1.8 * F * mix(0.2, 1.0, smoothstep(0.05, 0.5, R.y))); // (never white: a film, not a mirror)
}
vec4 pmoCatRom(sampler2D tex, vec2 uv, float texel) {
  vec2 sp = uv / texel, tc = floor(sp - 0.5) + 0.5, f = sp - tc;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f)), w1 = 1.0 + f * f * (-2.5 + 1.5 * f), w2 = f * (0.5 + f * (2.0 - 1.5 * f)), w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2, t0 = (tc - 1.0) * texel, t3 = (tc + 2.0) * texel, t12 = (tc + w2 / w12) * texel;
  float a = w12.x * w0.y, b = w0.x * w12.y, c = w12.x * w12.y, d = w3.x * w12.y, e = w12.x * w3.y;
  return (texture2D(tex, vec2(t12.x, t0.y)) * a + texture2D(tex, vec2(t0.x, t12.y)) * b + texture2D(tex, t12) * c
        + texture2D(tex, vec2(t3.x, t12.y)) * d + texture2D(tex, vec2(t12.x, t3.y)) * e) / (a + b + c + d + e);
}
vec3 pmoVoronoi(vec2 p) { // (the nearest point's distance, the gap to the second (an edge where it is 0), the nearest cell's hash)
  vec2 n = floor(p), f = fract(p); float f1 = 8.0, f2 = 8.0, id = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)), r = g + pmoH2(n + g) * 0.8 + 0.1 - f; float d = dot(r, r);
    if (d < f1) { f2 = f1; f1 = d; id = pmoH1(n + g + 17.0); } else if (d < f2) { f2 = d; }
  }
  return vec3(sqrt(f1), sqrt(f2) - sqrt(f1), id);
}
vec4 pmoHex(vec2 p) { // (the offset from the nearest hexagon's middle, and that hexagon's id)
  const vec2 s = vec2(1.0, 1.7320508);
  vec4 c = floor(vec4(p, p - vec2(0.5, 1.0)) / s.xyxy) + 0.5;
  vec4 h = vec4(p - c.xy * s, p - (c.zw + 0.5) * s);
  return dot(h.xy, h.xy) < dot(h.zw, h.zw) ? vec4(h.xy, c.xy) : vec4(h.zw, c.zw + 0.5);
}
// the cell under a point: its height and motif; an empty cell beside paint takes its painted neighbour's, so the filtered edge is round
vec2 paintMapCell(vec2 uv) {
  vec2 c = texture2D(uPmH, uv).rg;
  if (c.r > -9000.0) return c;
  float t = uPmWin.w; vec2 o;
  o = texture2D(uPmH, uv + vec2(t, 0.0)).rg; if (o.r > c.r) c = o;
  o = texture2D(uPmH, uv - vec2(t, 0.0)).rg; if (o.r > c.r) c = o;
  o = texture2D(uPmH, uv + vec2(0.0, t)).rg; if (o.r > c.r) c = o;
  o = texture2D(uPmH, uv - vec2(0.0, t)).rg; if (o.r > c.r) c = o;
  o = texture2D(uPmH, uv + vec2(t, t)).rg; if (o.r > c.r) c = o;
  o = texture2D(uPmH, uv - vec2(t, t)).rg; if (o.r > c.r) c = o;
  o = texture2D(uPmH, uv + vec2(t, -t)).rg; if (o.r > c.r) c = o;
  o = texture2D(uPmH, uv + vec2(-t, t)).rg; if (o.r > c.r) c = o;
  return c;
}
// a feeling's paint with its motif (col linear, un-premultiplied; xz world metres); emit: light it gives off; wet: its gloss (0 matte ..
// 1 a mirror), before it dries
vec3 paintMotif(vec3 col, vec2 xz, float code, out vec3 emit, out float wet) {
  float px = max(length(fwidth(xz)), 1e-4), m = 0.0, glow = 0.0; emit = vec3(0.0); wet = 0.55;
  if (code < 0.5) return col;
  if (code < 1.5) {                                                       // WONDER: a frost lattice of hexagons, a glint in some
    float S = 0.3; vec4 h = pmoHex(xz / S); vec2 a = abs(h.xy);
    float e = (0.5 - max(dot(a, vec2(0.5, 0.8660254)), a.x)) * S;
    float glint = step(0.7, pmoH1(h.zw)) * pmoLine(length(h.xy) * S, 0.022, px);
    m = (0.9 * pmoLine(e, 0.008, px) + glint) * pmoFade(S * 0.5, px);
  } else if (code < 2.5) {                                                // MIRTH: sun-dapples, bright round drops, staggered
    float S = 0.24; vec2 q = xz / S; q.x += 0.5 * mod(floor(q.y), 2.0);
    vec2 c = floor(q), f = fract(q) - 0.5; float r = (0.16 + 0.12 * pmoH1(c)) * S, d = length(f) * S;
    m = (1.0 - smoothstep(r - 0.5 * px, r + 0.5 * px, d)) * pmoFade(S, px);
  } else if (code < 3.5) {                                                // DESIRE: the wind's ripples, a crest and its lee
    vec2 dir = vec2(0.8, 0.6); float S = 0.21;
    float ph = dot(xz, dir) / S + 0.55 * sin(dot(xz, vec2(-dir.y, dir.x)) * 2.3);
    m = (0.9 * pmoLine(pmoBand(ph) * S, 0.02, px) - 0.6 * pmoLine(pmoBand(ph - 0.24) * S, 0.017, px)) * pmoFade(S, px);
  } else if (code < 4.5) {                                                // FURY: plates parted by cracks of light, charred within
    float S = 0.3; vec3 v = pmoVoronoi(xz / S);
    float crack = pmoLine(v.y * 0.5 * S, 0.011, px) * pmoFade(S * 0.5, px);
    m = 1.1 * crack - 0.45 * smoothstep(0.05, 0.45, v.x) * pmoFade(S, px);
    glow = crack * 0.8;
  } else if (code < 5.5) {                                                // GALL: a curdled film, dark curds with pale skins
    float S = 0.2; vec3 v = pmoVoronoi(xz / S + 3.7); float r = (0.12 + 0.2 * v.z) * S, d = v.x * S;
    float curd = 1.0 - smoothstep(r - 0.5 * px, r + 0.5 * px, d), skin = pmoLine(abs(d - r - 0.011), 0.006, px);
    m = (-0.95 * curd + 0.6 * skin) * pmoFade(S, px);
    wet = 0.85;
  } else if (code < 6.5) {                                                // GRIEF: the long rain's streaks, straight and broken
    vec2 dir = vec2(0.34, 0.94); float S = 0.11;
    float across = dot(xz, vec2(-dir.y, dir.x)) / S, lane = floor(across + 0.5), len = 0.5 + 0.4 * pmoH1(vec2(lane, 3.0));
    float along = dot(xz, dir) / len + pmoH1(vec2(lane, 9.0)), dash = fract(along), dw = max(0.04, fwidth(along));
    float on = smoothstep(0.0, dw, dash) * (1.0 - smoothstep(0.64 - dw, 0.64, dash));
    m = -0.8 * pmoLine(abs(across - lane) * S, 0.01, px) * on * pmoFade(S, px); // (dark: wet streaks on Grief's pale)
  } else if (code < 7.5) {                                                // DREAD: marbled ink, pale contour lines
    vec2 w = vec2(pmoFbm(xz * 0.9), pmoFbm(xz * 0.9 + 5.2));
    float n = pmoFbm(xz * 1.4 + w * 1.6) * 6.0, f = pmoBand(n), fn = max(fwidth(n), 1e-4);
    float hw = max(0.6 * fn, 0.01 * fn / px);
    m = 0.95 * (1.0 - smoothstep(hw - 0.5 * fn, hw + 0.5 * fn, f)) * min(1.0, hw / (0.6 * fn) * 0.9) * (1.0 - smoothstep(0.12, 0.35, fn));
  } else return col;                                                       // (crude: PAINT_LOOK_BODY's, the oxidation ramp)
  emit = col * glow;
  return m > 0.0 ? mix(col, vec3(1.0, 0.97, 0.92), 0.5 * m) : col * (1.0 + 0.7 * m);
}
`;

export const PAINT_LOOK_BODY = /* glsl */`{
    vec2 pmUv = (vPmPos.xz - uPmWin.xy) / uPmWin.z;
    if (pmUv.x > 0.0 && pmUv.y > 0.0 && pmUv.x < 1.0 && pmUv.y < 1.0 && texture2D(uPmCol, pmUv).a > 0.004) {
      float tx = uPmWin.w, cellM = uPmWin.z * tx;
      vec4 pc = pmoCatRom(uPmCol, pmUv, tx);                              // (the smoothed field: colour and amount, premultiplied)
      vec2 cell = paintMapCell(pmUv);
      float code = floor(cell.g + 0.02), age = clamp(cell.g - code, 0.0, 1.0); // (the motif; a slick's age, or a paint's dryness)
      bool crude = code > 7.5, slick = code > 8.5;
      float live = slick ? max(1.0 - age, 0.2) : 1.0;                       // (a slick's amount is its life left: its extent is the amount over it)
      float A = clamp(pc.a / live, 0.0, 1.0);
      float px = max(length(fwidth(vPmPos.xz)), 1e-4);
      float wob = (mix(0.5, pmoNoise(vPmPos.xz * 6.0 + 1.3), pmoFade(0.17, px)) - 0.5) * ${PAINT_LOOK.wobble.toFixed(3)}; // (the edge a little ragged, smooth noise, flat past a pixel)
      float E = ${PAINT_LOOK.edge.toFixed(3)}, ew = max(${PAINT_LOOK.soft.toFixed(3)}, fwidth(A) * 0.75), e = A + wob;
      float near = 1.0 - smoothstep(0.5, 0.9, abs(vPmPos.y - cell.r));
      float up = smoothstep(0.55, 0.8, normalize(vPmN).y);
      float k = smoothstep(E - ew, E + ew, e) * near * up * (slick ? 1.0 - smoothstep(0.82, 1.0, age) : 1.0); // (a soft round edge; a slick soaks away at the ramp's end)
      if (k > 0.001) {
        // the thickness: a bulge rising from the edge to a flat top, its slope from the bilinear field's differences (world metres)
        float a0 = E - ew, a1 = 0.85, s = clamp((A - a0) / (a1 - a0), 0.0, 1.0), thick = s * s * (3.0 - 2.0 * s);
        vec2 dA = vec2(texture2D(uPmCol, pmUv + vec2(tx, 0.0)).a - texture2D(uPmCol, pmUv - vec2(tx, 0.0)).a,
                       texture2D(uPmCol, pmUv + vec2(0.0, tx)).a - texture2D(uPmCol, pmUv - vec2(0.0, tx)).a) / (2.0 * cellM * live);
        pmGrad = dA * ${PAINT_LOOK.bulge.toFixed(3)} * 6.0 * s * (1.0 - s) / (a1 - a0) * (slick ? 1.0 - age : 1.0) * k * pmoFade(cellM * 2.0, px); // (flat where a cell is a few pixels: no crawl)
        vec3 V = normalize(cameraPosition - vPmPos), Nw = normalize(vec3(-pmGrad.x, 1.0, -pmGrad.y));
        float fres = pow(1.0 - clamp(dot(Nw, V), 0.0, 1.0), 2.0);
        vec3 col, emit; float wet;
        if (crude) {
          // crude: the oxidation ramp (vfx/oxidation.js slickColour, the slick meshes' own): a blot at its start, fresh and black; a
          // slick down it by its age (the film's bands up through it, then the sheen), the film brightest at the rim where it is thinnest
          float u = slick ? age : 0.0, h = pmoFbm(vPmPos.xz * 0.8) + 0.35 * pmoFbm(vPmPos.xz * 2.3 + 7.0);
          float rim = 1.0 - smoothstep(E, E + 0.3, e);
          emit = slickColour(u, fres, h, fwidth(h), rim) * 0.6;
          col = mix(vec3(0.0016, 0.0013, 0.0032), diffuseColor.rgb * vec3(0.42, 0.36, 0.34), smoothstep(0.3, 0.9, u)); // (black; thinned, the floor stained dark through it)
          wet = 0.95 * (1.0 - smoothstep(0.3, 0.8, u));
          diffuseColor.rgb = mix(diffuseColor.rgb, col, k * 0.97);
          pmGlow = emit * k;
        } else {
          col = pc.rgb / max(pc.a, 0.05); // (the colour un-premultiplied: the texture filters colour and coverage together)
          col *= min(0.72, 0.5 / max(max(col.r, max(col.g, col.b)), 0.01)); // (a pigment, no brighter than the floors it lies on: a full colour under a room's light, not a pastel blown white)
          col = paintMotif(col, vPmPos.xz, code, emit, wet);
          col *= mix(0.86, 1.0, age);                                       // (wet paint darker; dry, its own colour)
          wet *= 1.0 - 0.85 * age;                                          // (wet gloss drying matte)
          diffuseColor.rgb = mix(diffuseColor.rgb, col, k * 0.9);
          pmGlow = (col * 0.08 + emit) * k + pmoGloss(Nw, V) * wet * thick * k; // (Lachryma glows a little; Fury's cracks more; the wet top catches the room)
        }
        pmWet = wet; pmK = k * (0.4 + 0.6 * thick);                         // (glossiest where it is thick)
      }
    }
  }`;

export const PAINT_LOOK_ROUGH = /* glsl */`
  roughnessFactor = mix(roughnessFactor, mix(0.85, 0.24, pmWet), pmK); // (the paint's sheen, Splatoon's wet ink: never a mirror, which turns every colour white at a grazing angle)`;

/** After <normal_fragment_maps>: the bulge's slope tilts the lit normal (view space; a floor's, up-facing: the map is drawn on no other). */
export const PAINT_LOOK_NORMAL = /* glsl */`
  normal = normalize(normal + mat3(viewMatrix) * vec3(-pmGrad.x, 0.0, -pmGrad.y));`;
