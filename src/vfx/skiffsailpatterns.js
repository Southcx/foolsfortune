// ---------------------------------------------------------------------------------------
// THE SAIL'S PATTERNS (the owner, 2026-10-24: "more sails, new paintjobs for the skiff"): eight more patterns for the Solar Skiff's
// cloth, beside vfx/skiffpaintlook.js's solid, stripe, chevron, the feeling's motif and the kiln pattern, as GLSL that bake's fragment
// program calls (one program, one draw a change: nothing here runs a frame). Each is drawn in the sail's metres (`p`: x aft from the
// luff, y up from the foot) with the chosen dye as its ground and a fitting second colour, at the cloth's 512 px, its edges smoothed
// over a texel and a half (`SP_AA`) and its smallest mark a few texels wide, so the mips carry it to racing distance without a crawl.
//   waves           seigaiha: rows of overlapping fans of concentric rings, the front row over the one behind (the second's lines)
//   sunburst        rays fanned from a sun half-risen over the boom near the luff, alternating dye and gold, the sun gold
//   diamonds        harlequin: a diamond lattice in the dye and its second, keylined in gold
//   checker         a racing checker run down the leech, three squares wide, deep and cream, a pinstripe inboard of it
//   kintsugi        the cloth crazed into cells and some of their seams mended in gold (the iron wire left out: only the gold)
//   constellations  a night sky in the dye darkened: a chart's ring, field stars, and the Plough, Orion and Cassiopeia joined in cream
//   flames          tongues licking up from the foot and leaning aft, gold over a paler back row, a cream core, keylined dark
//   split           two-tone: the sail halved on the diagonal from the luff's head to the clew, the lower half the second, a gold seam
// Every colour is shaded by the painting's own lightness after (`lc`), so the grain, the border and the seams of the owner's cloth
// show through every pattern as they do through the dye.
//
// Prior art: the seigaiha of Japanese textiles; a sunburst on a 1970s spinnaker and the Rising Sun banner's rays; the harlequin's
// lozenges (commedia dell'arte); the chequered flag and a racing car's checker stripe; kintsugi's gold joins (the house's own: a
// sibling's shatter); a star chart's constellation lines (Bayer's Uranometria); a hot rod's flames; a regatta sail's two-tone panels.
// The cell border distance is Inigo Quilez's (voronoi edges, 2012).
//
//   SAIL_PATTERNS { id: index } (6 .. 13, after skiffpaintlook.js's own 0 .. 5)   SAIL_PATTERN_GLSL (the functions; sailPattern(...) the call)
// ---------------------------------------------------------------------------------------

export const SAIL_PATTERNS = { waves: 6, sunburst: 7, diamonds: 8, checker: 9, kintsugi: 10, constellations: 11, flames: 12, split: 13 };

/** The sail's size in its metres (the cloth's UVs, u 0.015..0.735 and v 0.98..0.02, by skiffpaintlook.js's `metres`): for the layouts. */
const W = '1.994', H = '1.872';

export const SAIL_PATTERN_GLSL = /* glsl */`
#define SP_AA 0.0065
float spIn(float d) { return smoothstep(-SP_AA, SP_AA, d); }                 // (1 where d > 0, d in metres)
float spHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 spHash2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
float spSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }

// waves: seigaiha (fans of radius R on a 2R x R lattice, odd rows offset R; the lowest fan holding the point is in front)
vec3 spWaves(vec3 base, vec2 p, vec3 line) {
  float R = 0.2; vec2 q = p / R; float best = 1e9, bd = 2.0;
  float j0 = floor(q.y);
  for (int dj = -1; dj <= 2; dj++) {
    float j = j0 + float(dj), off = mod(j, 2.0), i = floor((q.x - off) * 0.5 + 0.5);
    for (int di = -1; di <= 1; di++) { vec2 c = vec2((i + float(di)) * 2.0 + off, j); float d = length(q - c); if (d < 1.0 && c.y < best) { best = c.y; bd = d; } }
  }
  float ring = abs(fract(bd * 3.5 + 0.5) - 0.5) * R / 3.5;                   // (metres to the nearest of its rings, its rim one of them)
  return mix(base, line, 1.0 - spIn(ring - 0.011));
}

// sunburst: rays from a sun half-risen over the boom near the luff
vec3 spSunburst(vec3 base, vec2 p, vec3 gold) {
  vec2 c = vec2(0.42, -0.18), e = p - c; float r = length(e), a = atan(e.y, e.x);
  float N = 16.0, k = a / (3.14159265 / N), f = fract(k), edge = min(f, 1.0 - f) * (3.14159265 / N) * r;
  float odd = mod(floor(k), 2.0), ray = mix(odd, 0.5, 1.0 - spIn(edge));
  vec3 col = mix(base, gold, ray);
  col = mix(col, base, 1.0 - spIn(abs(r - 0.62) - 0.025));                    // (a ring of the dye round the sun)
  return mix(col, gold, 1.0 - spIn(r - 0.55));                               // (the sun)
}

// diamonds: harlequin lozenges keylined in gold
vec3 spDiamonds(vec3 base, vec2 p, vec3 second, vec3 gold) {
  vec2 s = vec2(0.42, 0.62); float a = p.x / s.x + p.y / s.y, b = p.x / s.x - p.y / s.y, m = 1.0 / length(1.0 / s);
  float ed = min(min(fract(a), 1.0 - fract(a)), min(fract(b), 1.0 - fract(b))) * m;
  vec3 col = mod(floor(a) + floor(b), 2.0) < 0.5 ? base : second;
  return mix(gold, col, spIn(ed - 0.012));
}

// checker: three squares wide down the leech, a pinstripe inboard
vec3 spChecker(vec3 base, vec2 p, vec3 deep, vec3 cream) {
  float sq = 0.18, x0 = ${W} - 3.0 * sq;
  vec2 g = p / sq, f = fract(g), ed = min(f, 1.0 - f) * sq;
  float par = mod(floor(g.x) + floor(g.y), 2.0), k = mix(par, 0.5, 1.0 - spIn(min(ed.x, ed.y)));
  vec3 chk = mix(cream, deep, k);
  vec3 col = mix(base, chk, spIn(p.x - x0));
  return mix(col, deep, 1.0 - spIn(abs(p.x - (x0 - 0.06)) - 0.014));
}

// kintsugi: cells, some of their borders gold (Quilez's border distance; a border's pair hashed so both cells agree)
vec3 spKintsugi(vec3 base, vec2 p, vec3 gold) {
  vec2 x = p / 0.34, n = floor(x), f = fract(x), mg = vec2(0.0), mr = vec2(0.0); float md = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j)), r = g + 0.15 + 0.7 * spHash2(n + g) - f; float d = dot(r, r); if (d < md) { md = d; mr = r; mg = g; } }
  md = 8.0; float on = 0.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = mg + vec2(float(i), float(j)), r = g + 0.15 + 0.7 * spHash2(n + g) - f;
    if (dot(mr - r, mr - r) > 1e-5) { float e = dot(0.5 * (mr + r), normalize(r - mr)); if (e < md) { md = e; on = step(0.38, spHash(2.0 * n + g + mg)); } }
  }
  float d = md * 0.34;                                                        // (metres to the nearest border)
  vec3 col = mix(base, base * 0.82, on * (1.0 - spIn(d - 0.03)));             // (the join's lacquer, a shade under the gold)
  return mix(col, gold, on * (1.0 - spIn(d - 0.011)));
}

// constellations: a night sky, its stars and figures in the sail's metres
const vec2 SP_STAR[20] = vec2[20](
  vec2(0.95, 1.50), vec2(0.98, 1.30), vec2(1.22, 1.27), vec2(1.24, 1.45), vec2(1.42, 1.52), vec2(1.58, 1.55), vec2(1.76, 1.47),   // the Plough
  vec2(1.05, 0.95), vec2(1.40, 0.92), vec2(1.17, 0.70), vec2(1.23, 0.68), vec2(1.29, 0.66), vec2(1.12, 0.42), vec2(1.44, 0.45), vec2(1.22, 1.08), // Orion
  vec2(0.22, 1.40), vec2(0.35, 1.56), vec2(0.48, 1.43), vec2(0.62, 1.60), vec2(0.74, 1.45));                                      // Cassiopeia
const ivec2 SP_LINK[21] = ivec2[21](ivec2(0, 1), ivec2(1, 2), ivec2(2, 3), ivec2(3, 0), ivec2(3, 4), ivec2(4, 5), ivec2(5, 6),
  ivec2(7, 9), ivec2(8, 11), ivec2(9, 10), ivec2(10, 11), ivec2(9, 12), ivec2(11, 13), ivec2(7, 14), ivec2(8, 14), ivec2(7, 8),
  ivec2(15, 16), ivec2(16, 17), ivec2(17, 18), ivec2(18, 19), ivec2(12, 13));
vec3 spConstellations(vec2 p, vec3 deep, vec3 gold, vec3 cream) {
  vec3 col = deep;
  col = mix(col, gold, 0.45 * (1.0 - spIn(abs(length(p - vec2(1.0, 0.95)) - 0.82) - 0.005)));     // (the chart's ring)
  vec2 g = floor(p / 0.11), o = spHash2(g); float h = spHash(g + 7.3);                              // (field stars, one a cell or none)
  if (h > 0.55) col = mix(col, cream, (0.4 + 0.6 * o.y) * (1.0 - spIn(length(p - (g + 0.2 + 0.6 * o) * 0.11) - 0.006 - 0.008 * h)));
  float ln = 9.0; for (int i = 0; i < 21; i++) ln = min(ln, spSeg(p, SP_STAR[SP_LINK[i].x], SP_STAR[SP_LINK[i].y]));
  col = mix(col, cream, 0.6 * (1.0 - spIn(ln - 0.0055)));
  float st = 9.0; for (int i = 0; i < 20; i++) st = min(st, length(p - SP_STAR[i]));
  col = mix(col, gold * 0.6 + deep * 0.4, 1.0 - spIn(st - 0.04));                                  // (a halo)
  return mix(col, gold, 1.0 - spIn(st - 0.022));
}

// flames: tongues from the foot, leaning aft (the wind's way), sharp at their tips and round between
float spTongue(vec2 p, float w, float seed, float H0, float yb) {
  float x = p.x - 0.24 * p.y, k = x / w, f = fract(k), t = 1.0 - abs(2.0 * f - 1.0);
  float H = H0 * (0.55 + 0.6 * spHash(vec2(floor(k), seed))), hgt = yb + H * pow(t, 1.8);
  float slope = H * 1.8 * pow(max(t, 1e-3), 0.8) * 2.0 / w;
  return (hgt - p.y) / sqrt(1.0 + slope * slope);                            // (metres inside the tongue, roughly)
}
vec3 spFlames(vec3 base, vec2 p, vec3 second, vec3 deep, vec3 cream) {
  float back = spTongue(p + vec2(0.16, 0.0), 0.32, 3.0, 1.15, 0.14);
  float front = spTongue(p, 0.32, 1.0, 0.95, 0.1);
  float core = spTongue(p * vec2(1.0, 1.0 / 0.6) + vec2(0.0, 0.02), 0.32, 1.0, 0.95, 0.04) * 0.6;
  vec3 col = mix(base, mix(base, second, 0.5), spIn(back));
  col = mix(col, deep, spIn(front + 0.02));                                   // (the keyline)
  col = mix(col, second, spIn(front));
  return mix(col, cream, spIn(core - 0.01));
}

// split: two-tone on the diagonal, luff's head to clew, a gold seam
vec3 spSplit(vec3 base, vec2 p, vec3 second, vec3 gold) {
  vec2 n = vec2(1.0 / ${W}, 1.0 / ${H}); float d = (dot(p, n) - 1.0) / length(n);
  vec3 col = mix(second, base, spIn(d));
  return mix(col, gold, 1.0 - spIn(abs(d) - 0.016));
}

/** One of the eight (pat 6 .. 13): the ground (the dye, or the cloth's cream, unshaded), the sail's metres, the painting's lightness
 *  there (its grain, shading the whole after), and the colours a pattern may want. */
vec3 sailPattern(int pat, vec3 cloth, vec2 p, float lc, vec3 second, vec3 gold, vec3 deep, vec3 cream) {
  vec3 c;
  if (pat == 6) c = spWaves(cloth, p, second);
  else if (pat == 7) c = spSunburst(cloth, p, gold);
  else if (pat == 8) c = spDiamonds(cloth, p, second, gold);
  else if (pat == 9) c = spChecker(cloth, p, deep, cream);
  else if (pat == 10) c = spKintsugi(cloth, p, gold);
  else if (pat == 11) c = spConstellations(p, deep, gold, cream);
  else if (pat == 12) c = spFlames(cloth, p, gold, deep, cream);
  else c = spSplit(cloth, p, second, gold);
  return c * min(lc, 1.08);
}
`;
