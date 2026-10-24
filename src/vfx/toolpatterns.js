// ---------------------------------------------------------------------------------------
// TOOL PATTERNS: the finishes a tool's skin lays on its parts (vfx/toolskins.js TOOL_SKINS), as more of the finish program's GLAZE kind
// (vfx/finish.js: one program for the glaze, gem, hair and skin kinds). Nothing here is a program of its own: this is GLSL that finish.js
// writes into the glaze branch, run only on a part that says it is a tool's (`uFinPart` 3: the vessel's parts are 0 to 2), so the
// vessel's glazes never meet it. The kiln patterns (1 to 7) stay the vessel's; the tool patterns are 8 and up (`TOOL_PATTERN`).
//
// The glaze kind's uniforms, as a tool part reads them:
//   uFinA the part's colour, uFinB the pattern's, uFinP (keep, mid, pattern, scale): keep and mid as the glaze's (how much of the
//   painting's light and shade to keep, and its midpoint), the pattern's number, its scale (cells a model unit).
//   uFinM (zone, y, x, stock) and uFinC, uFinS.xy: A ZONE, a second finish on part of one mesh (the psygun's one body: its grip, where
//   y < M.y and x < M.z, and a stock behind x < M.w, the Carbine's): the zone's colour C, its pattern S.x and scale S.y. The gem kind's
//   mineral uniforms, free in the glaze branch.
//   uFinS.z a live amount (the Lockheart's fill in the glass reliquary, the Crucibelle's last note in the glass bell), uFinS.w a clock
//   (real seconds: the molten skin's pulse, the circuit's, the glitch's jumps), both set by the skins' runtime (vfx/toolskinwear.js);
//   uFinC is the glass bell's note colour where no zone is worn.
// Each pattern fades its fine detail to its average as its cells shrink toward a pixel (`tlFade`), as the kiln patterns do: the house
// rule against shimmer.
//
// Prior art, as on a museum label: wood's growth rings (a noise-warped distance from the pith, the trick of every procedural wood since
// Perlin's 1985 marble), pattern-welded steel and the hamon of a differentially hardened blade (the clay line of yaki-ire), raden (mother
// of pearl set in lacquer) and maki-e (gold dust sprinkled into urushi), Jingdezhen's blue-and-white and its dragons' scales, the eye of a
// peacock's train, wickerwork's over-and-under, Worley's cells (1996) for pores, pits, scales, crazing and kintsugi's golden seams, raku's
// copper flash and carbon-smoked crackle, verdigris in a bronze's hollows, Widmanstätten's iron, a reliquary's glass, a jester's motley,
// and .hack's data showing through (the glitch).
//
//   TOOL_PATTERN { grain: 8, ... }   TOOL_HEAD (functions)   TOOL_COLOR (the glaze branch's tool block)   TOOL_LIGHT (its sheen)
//   TOOL_DECL (outputs the light and surface stages read)   TOOL_SURFACE (metal taken off where a patina lies)
// ---------------------------------------------------------------------------------------

/** Each tool pattern's number in the glaze kind (uFinP.z): the kiln patterns are 1 to 7. */
export const TOOL_PATTERN = {
  grain: 8, damascus: 9, hamon: 10, pearl: 11, cobalt: 12, peacock: 13, weave: 14, bamboo: 15, coral: 16, obsidian: 17,
  verdigris: 18, makie: 19, glitch: 20, starfield: 21, bone: 22, scales: 23, molten: 24, reliquary: 25, jade: 26, kintsugi: 27,
  raku: 28, circuit: 29, opal: 30, filigree: 31, tortoiseshell: 32, hammered: 33, harlequin: 34, chime: 35, frost: 36, moss: 37,
};

export const TOOL_HEAD = `
float tlFade(float px, float f) { return 1.0 - smoothstep(0.3, 0.7, px * f); }
vec3 tlWarp(vec3 q, float f, float a) { return q + (vec3(finNoise(q * f), finNoise(q * f + 7.1), finNoise(q * f + 3.7)) - 0.5) * a; }`;

export const TOOL_DECL = `
  float finTlS = 0.0, finTlI = 0.0, finTlH = 0.0, finTlMo = 0.0; vec3 finTlC = vec3(0.0); // (a slanting sheen: strength, how spectral, its hue; metal off)`;

const P = TOOL_PATTERN;
export const TOOL_COLOR = `
  if (uFinOn > 0.5 && uFinPart > 2.5) {
    float tp = uFinP.z, ts = uFinP.w; vec3 tA = uFinA, tB = uFinB;
    if (uFinM.x > 0.5 && ((vFinObj.y < uFinM.y && vFinObj.x < uFinM.z) || vFinObj.x < uFinM.w)) { // (the zone: a grip, a stock)
      tp = uFinS.x; ts = uFinS.y; tA = uFinC; tB = uFinC * 0.42;
      diffuseColor.rgb = tA * finShade; finPatM = 0.0; finPatR = 0.0; finPatRo = 0.0; finPatE = vec3(0.0); finPatS = 0.0;
    }
    vec3 q = vFinObj * ts; float px = length(fwidth(q)); int tq = int(tp + 0.5);
    if (tq == ${P.grain}) {
      float r = length(q.yz) * 9.0 + finNoise(q * vec3(0.8, 5.0, 5.0)) * 1.8 + finNoise(q * vec3(0.25, 1.5, 1.5)) * 2.5;
      float k = tlFade(px, 9.0), late = smoothstep(0.55, 0.95, fract(r)) * k;
      float pore = smoothstep(0.62, 0.8, finNoise(vec3(q.x * 3.0, q.y * 70.0, q.z * 70.0))) * tlFade(px, 70.0);
      diffuseColor.rgb = mix(tA, tB, late * 0.75 + 0.3 * pore + 0.3 * (1.0 - k)) * finShade; finPatRo = 0.35; finPatR = 0.25 * late;
    } else if (tq == ${P.damascus}) {
      float w = q.x * 2.0 + finNoise(q * 3.0) * 2.4 + finNoise(q * 9.0) * 0.6 + sin(q.y * 9.0 + q.z * 7.0) * 0.4;
      float lay = mix(0.5, smoothstep(0.3, 0.7, 0.5 + 0.5 * sin(w * 14.0)), tlFade(px, 4.5));
      diffuseColor.rgb = mix(tB, tA, lay) * finShade; finPatR = lay * 0.6;
    } else if (tq == ${P.hamon}) { // (the cutlass's blade, in its own frame: tools/sondelass/model.js bladeGeometry, the spine's curve and width)
      vec3 o = vFinObj; float s = clamp(o.x / 0.82, 0.0, 1.0), sp = -0.075 * s * s * s - 0.02 * s * s, bw = 0.052 * (1.0 - 0.35 * s);
      float v = clamp((o.y - sp) / max(bw, 1e-3), 0.0, 1.2);
      float w = q.x * 2.0 + finNoise(q * 3.0) * 2.4 + finNoise(q * 9.0) * 0.6;
      float lay = mix(0.5, smoothstep(0.3, 0.7, 0.5 + 0.5 * sin(w * 14.0)), tlFade(px, 4.5));
      float line = 0.55 + 0.07 * sin(s * 48.0) + 0.05 * sin(s * 17.0 + 1.0) + 0.04 * (finNoise(vec3(s * 30.0, 0.0, 0.0)) - 0.5);
      float hard = smoothstep(line - 0.04, line + 0.04, v), nie = exp(-pow((v - line) / 0.035, 2.0));
      diffuseColor.rgb = mix(mix(tB, tA, lay), mix(tA, vec3(0.93, 0.95, 0.98), 0.6), hard) * finShade;
      finPatE = vec3(0.6, 0.7, 0.8) * nie * 0.12; finTlS = hard * 0.25; finTlC = vec3(0.8, 0.85, 0.95); finPatR = hard * 0.5;
    } else if (tq == ${P.pearl}) {
      vec3 c = finCells(q * 6.0); float inl = smoothstep(0.05, 0.09, c.y - c.x) * step(0.42, c.z) * tlFade(px, 6.0);
      diffuseColor.rgb = mix(tA * finShade, tB * (0.85 + 0.15 * finNoise(q * 40.0)), inl);
      finTlS = inl * 0.55; finTlI = inl; finTlC = tB; finTlH = c.z * 3.0; finPatR = inl;
    } else if (tq == ${P.cobalt}) {
      float n = finNoise(q * 2.2) * 0.65 + finNoise(q * 6.0) * 0.35, wash = smoothstep(0.5, 0.56, n);
      vec2 sp = vec2(q.x + q.z, q.y + q.z * 0.5) * 7.0; sp.x += mod(floor(sp.y), 2.0) * 0.5; vec2 f = fract(sp) - vec2(0.5, 0.0);
      float scl = (1.0 - smoothstep(0.03, 0.08, abs(length(f) - 0.5))) * tlFade(px, 7.0);
      float cn = n * 7.0, aa = fwidth(cn), line = smoothstep(0.44 - aa, 0.44, abs(fract(cn) - 0.5)) * (1.0 - smoothstep(0.3, 0.6, aa));
      vec3 col = mix(tA, mix(tA, tB, 0.45), wash);
      diffuseColor.rgb = mix(col, tB, max(line * (1.0 - wash), scl * wash) * 0.95) * finShade; finPatR = 1.0;
    } else if (tq == ${P.peacock}) {
      vec3 c = finCells(q * vec3(3.0, 6.0, 6.0)); float d = c.x, k = tlFade(px, 6.0);
      float barbs = finNoise(vec3(q.x * 4.0, q.y * 90.0, q.z * 90.0)) * tlFade(px, 90.0);
      vec3 col = mix(tA, tA * 0.6, barbs * 0.5);
      col = mix(col, vec3(0.75, 0.55, 0.2), (1.0 - smoothstep(0.3, 0.36, d)) * k);
      col = mix(col, tB, (1.0 - smoothstep(0.2, 0.24, d)) * k);
      col = mix(col, vec3(0.03, 0.06, 0.25), (1.0 - smoothstep(0.12, 0.15, d)) * k);
      diffuseColor.rgb = col * finShade; finTlS = 0.5; finTlI = 0.8; finTlC = tB; finTlH = d * 2.0; finPatR = 0.5;
    } else if (tq == ${P.weave}) {
      vec2 g = vec2(q.x + q.z, q.y - q.z * 0.3) * 12.0, cell = floor(g), f = fract(g); float ck = mod(cell.x + cell.y, 2.0);
      float crs = ck > 0.5 ? f.x : f.y, len = ck > 0.5 ? f.y : f.x, k = tlFade(px, 12.0);
      float sh = sin(crs * 3.14159) * (0.75 + 0.25 * sin(len * 3.14159));
      diffuseColor.rgb = mix(tB, tA, mix(0.7, 0.3 + 0.7 * sh, k)) * finShade; finPatRo = 0.7;
    } else if (tq == ${P.bamboo}) {
      float f = fract(q.x), node = exp(-pow((f - 0.5) / 0.025, 2.0)), swell = exp(-pow((f - 0.5) / 0.09, 2.0));
      float fib = finNoise(vec3(q.x * 2.0, q.y * 60.0, q.z * 60.0)) * tlFade(px, 60.0);
      vec3 col = mix(tA, tA * vec3(1.15, 1.12, 0.8) + vec3(0.06, 0.05, 0.0), swell * 0.6);
      diffuseColor.rgb = mix(col, tB, node * 0.85) * (0.92 + 0.12 * fib) * finShade; finPatR = 0.6 * (1.0 - node);
    } else if (tq == ${P.coral}) {
      vec3 c = finCells(q * 10.0); float k = tlFade(px, 10.0);
      float pore = (1.0 - smoothstep(0.12, 0.22, c.x)) * k, ridge = smoothstep(0.45, 0.6, finNoise(q * 3.0));
      float pearl = (1.0 - smoothstep(0.18, 0.26, c.x)) * step(0.88, c.z) * k;
      vec3 col = mix(mix(tA, tA * vec3(1.1, 0.75, 0.7), ridge * 0.5), tA * 0.35, pore * 0.8);
      diffuseColor.rgb = mix(col, tB, pearl) * finShade; finTlS = pearl * 0.8; finTlI = pearl; finTlC = tB; finPatR = pearl; finPatRo = (1.0 - pearl) * 0.6;
    } else if (tq == ${P.obsidian}) {
      vec3 c = finCells(q * 3.0); float rip = 0.5 + 0.5 * sin(c.x * 30.0 + c.z * 6.0);
      diffuseColor.rgb = tA * (0.85 + 0.3 * mix(0.5, rip, tlFade(px, 15.0))) * finShade; finPatR = 1.0;
      finTlS = 0.45; finTlI = 0.7; finTlC = tB; finTlH = c.z + rip * 0.2;
    } else if (tq == ${P.verdigris}) {
      float n = finNoise(q * 4.0) * 0.6 + finNoise(q * 13.0) * 0.4, hollow = 1.0 - smoothstep(0.7, 1.1, finShade);
      float pat = smoothstep(0.52, 0.6, n + hollow * 0.2);
      diffuseColor.rgb = mix(tA, tB * (0.85 + 0.3 * finNoise(q * 30.0)), pat) * finShade; finTlMo = pat; finPatRo = pat;
    } else if (tq == ${P.makie}) {
      vec3 c = finCells(q * 60.0); float dust = (1.0 - smoothstep(0.1, 0.2, c.x)) * step(0.55, c.z) * tlFade(px, 60.0);
      vec2 sp = vec2(q.x, q.y + q.z) * 5.0; sp.x += mod(floor(sp.y), 2.0) * 0.5; vec2 f = fract(sp) - vec2(0.5, 0.0); float wave = 0.0;
      for (int i = 0; i < 3; i++) wave = max(wave, 1.0 - smoothstep(0.02, 0.05, abs(length(f) - 0.18 - 0.14 * float(i))));
      wave *= tlFade(px, 35.0) * smoothstep(0.55, 0.62, finNoise(q * 1.5)); float gold = max(dust, wave);
      diffuseColor.rgb = mix(tA, tB, gold) * finShade; finPatM = gold; finPatR = 1.0; finPatE = tB * gold * 0.12;
    } else if (tq == ${P.glitch}) {
      float T = uFinS.w, band = floor(q.y * 8.0 + floor(T * 2.0) * 0.37); vec3 h = finHash3(vec3(band, floor(T * 3.0), 1.7));
      float on = step(0.72, h.x), sx = q.x + (h.y - 0.5) * 0.6 * on;
      float cell = step(0.8, finHash3(floor(vec3(sx * 10.0, q.y * 10.0, q.z * 10.0))).x) * tlFade(px, 10.0);
      float scan = mix(0.5, 0.5 + 0.5 * sin(q.y * 140.0), tlFade(px, 25.0));
      vec3 col = mix(mix(tA * (0.8 + 0.25 * scan), tB, cell * 0.8), finSpectrum(h.z + T * 0.1), on * 0.6);
      diffuseColor.rgb = col * finShade; finPatE = (tB * cell * 0.6 + finSpectrum(h.z) * on * 0.5) * (0.6 + 0.4 * scan);
    } else if (tq == ${P.starfield}) {
      vec3 c = finCells(q * 14.0); float star = exp(-c.x * c.x * 120.0) * step(0.75, c.z) * tlFade(px, 42.0);
      float neb = finNoise(q * 1.6) * 0.6 + finNoise(q * 4.5) * 0.4;
      vec3 col = mix(mix(tA, tB, smoothstep(0.45, 0.85, neb) * 0.7), finSpectrum(neb * 1.5 + 0.55) * 0.5, smoothstep(0.7, 0.95, neb) * 0.4);
      diffuseColor.rgb = col * finShade; finPatE = col * 0.25 + vec3(1.0, 0.95, 0.85) * star * 1.4; finPatR = 0.7;
    } else if (tq == ${P.bone}) {
      float lines = mix(0.5, 0.5 + 0.5 * sin(q.x * 40.0 + finNoise(q * 3.0) * 6.0), tlFade(px, 6.4));
      vec3 c = finCells(q * 26.0); float pit = (1.0 - smoothstep(0.06, 0.12, c.x)) * step(0.6, c.z) * tlFade(px, 26.0);
      float age = smoothstep(0.4, 0.8, finNoise(q * 2.0)) * 0.3 + (1.0 - smoothstep(0.6, 1.0, finShade)) * 0.4;
      diffuseColor.rgb = mix(mix(tA, tA * vec3(0.85, 0.78, 0.62), age) * (0.94 + 0.08 * lines), tB, pit) * finShade; finPatRo = 0.4;
    } else if (tq == ${P.scales}) {
      vec3 c = finCells(q * vec3(8.0, 12.0, 12.0)); float k = tlFade(px, 12.0);
      float dome = mix(0.6, 1.0 - c.x * 0.8, k), edge = (1.0 - smoothstep(0.0, 0.08, c.y - c.x)) * k;
      diffuseColor.rgb = mix(mix(tA, tB, c.z * 0.5) * dome, tA * 0.25, edge) * finShade;
      finTlS = 0.35 * k; finTlI = 0.6; finTlC = tB; finTlH = c.z; finPatR = 0.6;
    } else if (tq == ${P.molten}) {
      vec3 a = finCells(tlWarp(q, 5.0, 0.15) * 4.0); float crack = (1.0 - smoothstep(0.0, 0.1, a.y - a.x)) * tlFade(px, 24.0);
      float pulse = 0.75 + 0.25 * sin(uFinS.w * 2.0 + a.z * 6.28);
      diffuseColor.rgb = mix(tA * (0.7 + 0.5 * finNoise(q * 9.0)), tB, crack) * finShade;
      finPatE = tB * (crack * 1.6 * pulse + 0.05); finPatRo = (1.0 - crack) * 0.8;
    } else if (tq == ${P.reliquary}) { // (q.y from -0.5 to 0.5 over the coffin's height at its scale: the fill rising from its foot)
      float lvl = mix(-0.5, 0.5, clamp(uFinS.z, 0.0, 1.0)), aa = fwidth(q.y) + 1e-4;
      float fill = 1.0 - smoothstep(lvl - aa, lvl + aa, q.y), men = exp(-pow((q.y - lvl) / 0.025, 2.0)) * step(0.01, uFinS.z);
      float swirl = finNoise(q * 6.0 + vec3(0.0, uFinS.w * 0.4, 0.0));
      diffuseColor.rgb = mix(tA * 0.25, tB * 0.5, fill) * finShade;
      finPatE = tB * fill * (0.35 + 0.35 * swirl) + vec3(1.0) * men * 0.4; finTlS = 0.6; finTlC = mix(vec3(0.85, 0.92, 1.0), tA, 0.3); finPatR = 1.0;
    } else if (tq == ${P.jade}) {
      float n = finNoise(q * 3.0) * 0.6 + finNoise(q * 9.0) * 0.4;
      float vein = (1.0 - smoothstep(0.0, 0.02 + fwidth(n), abs(n - 0.5))) * 0.5 * tlFade(px, 9.0);
      diffuseColor.rgb = mix(tA, tB, smoothstep(0.42, 0.85, n)) * (1.0 - vein * 0.4) * finShade;
      finTlS = 0.3; finTlC = tA * 1.4 + 0.05; finPatR = 0.75; finPatE = tA * 0.06;
    } else if (tq == ${P.kintsugi}) {
      vec3 w = tlWarp(q, 6.0, 0.06), a = finCells(w * 3.0), b = finCells(w * 11.0);
      float seam = (1.0 - smoothstep(0.0, 0.035, a.y - a.x)) * tlFade(px, 36.0);
      float craze = (1.0 - smoothstep(0.0, 0.04, b.y - b.x)) * tlFade(px, 132.0) * 0.5;
      diffuseColor.rgb = mix(mix(tA, tA * 0.6, craze), tB, seam) * finShade; finPatM = seam; finPatR = max(seam, 0.6); finPatE = tB * seam * 0.22;
    } else if (tq == ${P.raku}) {
      vec3 a = finCells(tlWarp(q, 6.0, 0.06) * 7.0); float crack = (1.0 - smoothstep(0.0, 0.05, a.y - a.x)) * tlFade(px, 84.0);
      float smoke = smoothstep(0.35, 0.75, finNoise(q * 2.2) * 0.7 + finNoise(q * 6.0) * 0.3);
      diffuseColor.rgb = mix(mix(tA, tA * 0.3, smoke * 0.6), vec3(0.03), crack * 0.9) * finShade;
      finTlS = (1.0 - smoke) * 0.5 * (1.0 - crack); finTlI = 1.0; finTlC = tB; finTlH = smoke; finPatR = 0.7;
    } else if (tq == ${P.circuit}) {
      vec2 g = vec2(q.x, q.y + q.z * 0.7) * 6.0, cell = floor(g), f = fract(g); vec3 h = finHash3(vec3(cell, 3.3));
      float aa = fwidth(g.x) + fwidth(g.y), k = 1.0 - smoothstep(0.25, 0.5, aa);
      float tr = h.x < 0.45 ? abs(f.y - 0.5) : (h.x < 0.9 ? abs(f.x - 0.5) : 1.0);
      float trace = (1.0 - smoothstep(0.06, 0.06 + aa, tr)) * k, pad = (1.0 - smoothstep(0.16, 0.16 + aa, length(f - 0.5))) * step(0.7, h.y) * k;
      float pulse = 0.5 + 0.5 * sin(uFinS.w * 3.0 - (cell.x + cell.y) * 0.7), lit = max(trace, pad);
      diffuseColor.rgb = mix(tA, tB * 0.6, lit) * finShade; finPatE = tB * max(trace * (0.3 + 0.7 * pulse), pad) * 0.8; finPatM = lit * 0.6;
    } else if (tq == ${P.opal}) {
      vec3 c = finCells(q * 4.0);
      diffuseColor.rgb = mix(tA, tB, finNoise(q * 3.0) * 0.4) * finShade;
      finTlS = 0.7 * mix(0.6, 1.0, tlFade(px, 4.0)); finTlI = 1.0; finTlH = c.z * 2.0 + finNoise(q * 2.0); finTlC = tB; finPatR = 0.9;
    } else if (tq == ${P.filigree}) {
      float n = finNoise(q * 2.5) * 0.7 + finNoise(q * 7.0) * 0.3, cn = n * 9.0, aa = fwidth(cn);
      float line = (1.0 - smoothstep(0.08, 0.08 + aa, abs(fract(cn) - 0.5))) * (1.0 - smoothstep(0.3, 0.6, aa));
      diffuseColor.rgb = mix(tA, tB, line) * finShade; finPatM = line; finPatR = line; finPatE = tB * line * 0.1;
    } else if (tq == ${P.tortoiseshell}) {
      float spot = smoothstep(0.48, 0.62, finNoise(q * 4.0) * 0.6 + finNoise(q * 12.0) * 0.4);
      diffuseColor.rgb = mix(tA, tB, spot) * finShade; finTlS = 0.3 * (1.0 - spot); finTlC = tA * 1.2; finPatR = 1.0;
    } else if (tq == ${P.hammered}) {
      vec3 c = finCells(q * 16.0);
      diffuseColor.rgb = tA * mix(1.0, 0.82 + 0.3 * c.x, tlFade(px, 16.0)) * finShade; finPatR = 0.4;
    } else if (tq == ${P.harlequin}) {
      vec2 g = vec2(q.x, (q.y + q.z) * 1.6) * 4.0, r = vec2(g.x + g.y, g.x - g.y) * 0.7071, f = fract(r);
      float ck = mod(floor(r.x) + floor(r.y), 2.0), aa = fwidth(r.x) + fwidth(r.y), far = smoothstep(0.3, 0.6, aa);
      float edge = (1.0 - smoothstep(0.03, 0.03 + aa, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)))) * (1.0 - far);
      vec3 col = mix(mix(tA, tB, ck), mix(tA, tB, 0.5), far);
      diffuseColor.rgb = mix(col, vec3(0.95, 0.78, 0.35), edge) * finShade; finPatM = edge; finPatR = 0.6;
    } else if (tq == ${P.chime}) { // (the glass bell: lit in its last note's colour, uFinC, as hard as uFinS.z)
      float swirl = finNoise(q * 5.0 + vec3(uFinS.w * 0.3)); vec3 ring = mix(tB, uFinC, clamp(uFinS.z * 1.5, 0.0, 1.0));
      diffuseColor.rgb = tA * 0.3 * finShade; finPatE = ring * (0.12 + 0.9 * uFinS.z) * (0.6 + 0.4 * swirl);
      finTlS = 0.6; finTlC = mix(vec3(0.9, 0.95, 1.0), ring, 0.5); finPatR = 1.0;
    } else if (tq == ${P.frost}) {
      diffuseColor.rgb = mix(tA, tB, smoothstep(0.55, 0.8, finNoise(q * 12.0)) * tlFade(px, 12.0) * 0.6) * finShade; finTlS = 0.45; finTlC = tB; finPatR = 0.7;
    } else if (tq == ${P.moss}) {
      float n = finNoise(q * 5.0) * 0.6 + finNoise(q * 15.0) * 0.4, hollow = 1.0 - smoothstep(0.7, 1.1, finShade);
      float moss = smoothstep(0.55, 0.65, n + hollow * 0.25);
      diffuseColor.rgb = mix(tA, tB * (0.8 + 0.4 * finNoise(q * 40.0)), moss) * finShade; finTlMo = moss; finPatRo = moss;
    }
  }`;

export const TOOL_SURFACE = `metalnessFactor *= 1.0 - finTlMo;`;

export const TOOL_LIGHT = `
  if (finTlS > 0.0) { // (a tool skin's sheen at a slant: pearl, a peacock's eye, obsidian's, raku's copper flash, opal's play)
    float slt = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));
    totalEmissiveRadiance += mix(finTlC, finSpectrum(finTlH + slt * 0.9), finTlI) * finTlS * (0.08 + 0.6 * slt * slt);
  }`;
