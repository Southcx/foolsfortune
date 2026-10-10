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
//   CRUDE   a blot's crude and a slick: no feeling, so no feeling's colour: liquid Lachryma as the bauble ends its oxidising
//           (courier/lachryma.js oxMaterial at k 1): near-black, its oil film in the bauble's own four tones (violet, peacock, gold,
//           magenta) lit at a grazing eye and in slow patches, glossier than paint. A blot's keeps. A slick goes on down the bauble's
//           ramp as it fades (its age, 0..1, rides in the motif byte's fraction): the film thins and dulls, the gloss goes, the dark
//           sinks into the floor and is gone, never a pop (the bauble's melt into the ground)
// Lines are drawn in world metres and never thinner than a pixel (a thinner one is widened and dimmed to keep its weight), and a
// pattern fades to its mean before a pixel spans half its period, so nothing crawls at range or at a grazing angle (CLAUDE.md, Feel).
// Every motif has a light part and a dark part against its colour (casebook rule 105): checked in greyscale and with a protanopia
// simulation (Machado 2009) on the Throwing Room's paint range.
// The paint's body is a flat colour with a crisp edge and a wet gloss (its roughness drops: Splatoon's ink), the edge drawn round across
// the cells (an empty cell beside paint takes its neighbour's height and motif, so the filtered edge is not cut into 0.25 m squares).
//
// Prior art: Splatoon's ink (a flat bright body, a crisp edge, a gloss highlight), suminagashi marbling, the craquelure and crawl of a
// glaze (the cracks of light), the frost on a window (the hexagonal lattice), and the dot, hatch and stipple of a printer's screen,
// which tell inks apart where colour cannot (every map legend for the colour-blind). The hash is Dave Hoskins' "Hash without Sine"
// (Shadertoy 4djSRW, MIT), which holds its precision at the Dunes' coordinates where sin() does not.
//
//   PAINT_LOOK_HEAD       the declarations and functions (after the map's uniforms and varyings)
//   PAINT_LOOK_BODY       the block that lays the paint on diffuseColor (at <alphamap_fragment>; sets pmGlow, pmWet, pmK)
//   (the motif byte is a float: its whole part the motif, its fraction a slick's age)
//   PAINT_LOOK_ROUGH      the line after <roughnessmap_fragment>: the paint's gloss (standard materials; a no-op on others)
//   paintMotifCode(aspectIndex, crudeKind, k) -> the motif byte a cell is uploaded with (k: a slick's share left, its age 1 - k)
//   PAINT_MOTIF   CRUDE_MOTIF   SLICK_MOTIF
// ---------------------------------------------------------------------------------------
import { ASPECTS } from '../progress/weather.js';

/** The motif each feeling's paint carries (the byte in the map's second channel; 0 is bare ground). */
export const PAINT_MOTIF = { wonder: 1, mirth: 2, desire: 3, fury: 4, gall: 5, grief: 6, dread: 7 };
export const CRUDE_MOTIF = 8, SLICK_MOTIF = 9;
const BY_INDEX = ASPECTS.map((a) => PAINT_MOTIF[a] || 0);
/** A cell's motif byte: its feeling's (index into ASPECTS), or crude's (`crudeKind` 1 a blot's, 2 a slick's: paintmap.js `crude`); a
 *  slick carries its age in the fraction (`k` its share left: 1 fresh, 0 gone), so it oxidises on as it fades. */
export const paintMotifCode = (aspectIndex, crudeKind = 0, k = 1) => (crudeKind === 2 ? SLICK_MOTIF + 0.95 * Math.min(1, Math.max(0, 1 - k)) : crudeKind ? CRUDE_MOTIF : BY_INDEX[aspectIndex] || 0);

export const PAINT_LOOK_HEAD = /* glsl */`
vec3 pmGlow = vec3(0.0); float pmWet = 0.0, pmK = 0.0;
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
// (the bauble's oil film, its four tones in turn: courier/lachryma.js oxMaterial's oxFilm, the same stops)
vec3 pmoFilm(float t) { t = fract(t) * 4.0; vec3 a = vec3(0.30, 0.06, 0.70), b = vec3(0.04, 0.55, 0.75), c = vec3(0.95, 0.72, 0.18), d = vec3(0.85, 0.10, 0.50);
  return t < 1.0 ? mix(a, b, smoothstep(0.0, 1.0, t)) : t < 2.0 ? mix(b, c, smoothstep(1.0, 2.0, t)) : t < 3.0 ? mix(c, d, smoothstep(2.0, 3.0, t)) : mix(d, a, smoothstep(3.0, 4.0, t)); }
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
// a feeling's paint with its motif (col linear, un-premultiplied; xz world metres; view toward the eye; age a slick's, 0..1); emit: light
// it gives off; wet: its gloss (0 matte .. 1 a mirror)
vec3 paintMotif(vec3 col, vec2 xz, float code, float age, vec3 view, out vec3 emit, out float wet) {
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
  } else {                                                                // CRUDE: liquid Lachryma, the bauble's last stage, and on
    float fres = pow(1.0 - clamp(view.y, 0.0, 1.0), 2.2);                // (the bauble's Fresnel: the film shows at a grazing eye)
    float n = pmoFbm(xz * 0.55) * 1.4 + fres * 0.8;                       // (its tones in slow swirls, turning as the eye moves)
    float swirl = 0.35 + 0.65 * smoothstep(0.3, 0.75, pmoNoise(xz * 0.9 + 2.0));
    float live = pow(1.0 - age, 1.5);                                     // (a slick oxidises on: the film thins as it sinks in)
    emit = pmoFilm(n) * (0.008 + 0.2 * fres) * swirl * live;
    wet = 0.95;                                                           // (its gloss goes as it dries: PAINT_LOOK_BODY, pmK)
    return vec3(0.0016, 0.0013, 0.0032);                                  // (near-black: the bauble's 0x05040a)
  }
  emit = col * glow;
  return m > 0.0 ? mix(col, vec3(1.0, 0.97, 0.92), 0.5 * m) : col * (1.0 + 0.7 * m);
}
`;

export const PAINT_LOOK_BODY = /* glsl */`{
    vec2 pmUv = (vPmPos.xz - uPmWin.xy) / uPmWin.z;
    if (pmUv.x > 0.0 && pmUv.y > 0.0 && pmUv.x < 1.0 && pmUv.y < 1.0) {
      vec4 pc = texture2D(uPmCol, pmUv);
      if (pc.a > 0.004) {
        vec2 cell = paintMapCell(pmUv);
        float code = floor(cell.g + 0.02), age = clamp(cell.g - code, 0.0, 1.0); // (the motif, and a slick's age in the fraction)
        float near = 1.0 - smoothstep(0.5, 0.9, abs(vPmPos.y - cell.r));
        float up = smoothstep(0.55, 0.8, normalize(vPmN).y);
        float grain = pmoH1(floor(vPmPos.xz * 6.0));
        vec3 col = pc.rgb / max(pc.a, 0.05); // (the colour un-premultiplied: the texture filters colour and coverage together)
        float k = smoothstep(0.25, 0.5, pc.a + (grain - 0.5) * 0.1) * near * up * (1.0 - smoothstep(0.7, 0.95, age)); // (a wet edge, a little ragged; a slick sinks away)
        if (k > 0.001) {
          vec3 emit; float wet;
          col *= min(0.72, 0.5 / max(max(col.r, max(col.g, col.b)), 0.01)); // (a pigment, no brighter than the floors it lies on: a full colour under a room's light, not a pastel blown white)
          col = paintMotif(col, vPmPos.xz, code, age, normalize(cameraPosition - vPmPos), emit, wet);
          if (code > 7.5) col = mix(col, diffuseColor.rgb * vec3(0.42, 0.36, 0.34), smoothstep(0.1, 0.8, age)); // (a slick drying: the floor stained dark, no longer a pool on it)
          diffuseColor.rgb = mix(diffuseColor.rgb, col, k * 0.9);
          pmGlow = (col * 0.08 + emit) * k; // (Lachryma glows a little; Fury's cracks more; crude only its film)
          pmWet = wet; pmK = k * (1.0 - smoothstep(0.1, 0.8, age)); // (the gloss, gone as a slick dries into the floor)
        }
      }
    }
  }`;

export const PAINT_LOOK_ROUGH = /* glsl */`
  roughnessFactor = mix(roughnessFactor, mix(0.8, 0.3, pmWet), pmK); // (the paint's sheen, Splatoon's wet ink: never a mirror, which turns every colour white at a grazing angle)`;
