// ---------------------------------------------------------------------------------------
// A SKIN'S PATTERN (the owner, 2026-10-24: "pull out all the stops ... the Courier could use more skin options in the kiln"): what the
// kiln's skin tones (courier/vessel/glazes.js, kind 'skin', a row's `look`) draw on the Lachryma of the body beyond a colour, a glow, a
// rim and a translucency. The body is the base material's (docs/plans/REGISTERS.md: the vessel's words hold for any material), so the
// tones run from the human range (flesh, its undertone carried through the thin edges) through the potter's clay bodies to the strange.
//
// It is drawn in the skin branch of the vessel's one finish program (vfx/finish.js), never a program of its own: `uFinM` (the gem's
// mineral uniform: x the pattern, y SKIN_UNITS / the body's height, z its strength, w its frequency), `uFinC` (its third colour), and one uniform
// of the skin's own, `uFinQ` (x the bump's height in metres, y a glow, z an extra, w unused), with one varying, `vFinE` (the way to the
// eye in the body's own space, for the starfield's parallax). Everything is laid out in the body's bind-pose space (vFinObj), so a
// pattern holds still on the body as it moves; and every detail fades as it shrinks under a pixel or two (finSee, finLine: CLAUDE.md, no
// aliasing crawl), so a far body shows its colour and the pattern's mean.
//
//   1 FLESH       a natural tone: the faintest mottle of its undertone, freckles where asked (w), the undertone lit through the thin edges
//   2 PORCELAIN   blue-white, the glaze pooled bluish at the turns, faint throwing rings, warm light through it
//   3 SPECKLE     a clay body's grog or iron: specks of its third colour (k how many, w how fine), an iron spot's bleed (Q.z)
//   4 BURNISH     terra sigillata: a body burnished to a sheen in strokes round it, a fire flash clouded over it
//   5 SMOKE       raku: a white crackle pulled red-hot and smoked, carbon in the crazing and clouds of it, copper's flash (Q.z)
//   6 CELADON     a jade glass body, deeper where it lies thick, a fine crackle (Q.z)
//   7 MARBLE      agateware: two clays wedged and swirled, laminated in fine layers
//   8 NACRE       mother-of-pearl: wavy layers and the interference colours riding over them with the angle
//   9 PATINA      bronze, verdigris crusting over it where water would run and lie
//  10 WOOD        polished wood: growth rings round the trunk, late wood darker, open pores
//  11 SUMI        ink wash: washes laid one under another, each pooled dark at its foot, a dried bloom's edge, ink in the turns
//  12 STARS       a night sky inside the skin: three layers of stars at depth (parallaxed with the eye) and a nebula behind them
//  13 GLASS       stained glass: leaded cells of jewel colour, lit from inside, the lead proud
//  14 SLIP        slip-trailed: raised lines of a contrasting slip trailed over a dark body under a honey glaze
//  15 SCHILLER    Lachryma-lit: a dark body with veins, and the film's schiller (the house's labradorite stops) flashing up under it
//  16 LEAF        gold leaf over clay: torn patches, flaked through, crinkled
//  17 KINTSUGI    the cracks already mended in gold, raised a little, as lacquer is
//  18 MOLTEN      a cooled crust with its cracks still glowing (Q.y)
//  19 MOSS        stone with lichen rosettes (grey-green, now and then orange) and moss in clumps where it faces up
//
// Prior art: the subsurface "wrap" and translucency of skin since Half-Life 2 and the undertone colour of GPU Gems 3's skin chapter;
// real ceramics for the bodies (grog, iron spot, terra sigillata's burnish, raku's post-firing reduction, agateware's wedged clays,
// slipware's trailing after Thomas Toft); Worley's cells (finish.js finCells) for specks, crazing, lichen, the leading and the stars;
// the wood-grain shader of Perlin's "Hypertexture" (1989); sumi-e's graded wash and watercolour's edge darkening (Curtis et al.,
// "Computer-Generated Watercolor", 1997); the interior-mapping parallax of ice and galaxy skins (Far Cry, Destiny, Fortnite's Galaxy);
// three.js's perturbNormalArb (Mikkelsen's bump mapping without tangents) for the raised and sunk details; and the house's labradorite
// (vfx/labradorite.js) for the schiller's palette.
//
//   dressSkin(U, look, span) -> the finish's skin uniforms (vfx/finish.js dressFinish) set from a row's `look` ({ pattern, c3, k, w,
//     bump, glow, aux }) at the body's height `span`; a row with no look clears the pattern
//   SKIN_HEAD, SKIN_DECL, SKIN_COLOR, SKIN_SURFACE, SKIN_LIGHT_PRE, SKIN_LIGHT, SKIN_VERTEX   the GLSL vfx/finish.js places
// ---------------------------------------------------------------------------------------

// the pattern's unit: an eighth of the body's height (about 22 cm), because the skin shows as the doll's ball joints, the neck and the
// core between the armour's plates (a few centimetres each), so a pattern is laid out to be read on a joint
export const SKIN_UNITS = 8;
/** Set a skin's pattern on the finish's uniforms (no look: none). */
export function dressSkin(U, look, span = 1) {
  const L = look || {};
  U.uFinM.value.set(L.pattern || 0, SKIN_UNITS / (span || 1), L.k ?? 1, L.w ?? 0);
  U.uFinC.value.setHex(L.c3 ?? 0xffccaa);
  U.uFinQ.value.set(L.bump || 0, L.glow || 0, L.aux || 0, 0);
}

// the vertex's part: the way to the eye in the body's own space (only the skin needs it)
export const SKIN_VERTEX = /* glsl */`
  vFinE = vec3(0.0); if (uFinKind == 3) vFinE = inverse(mat3(modelViewMatrix)) * (-mvPosition.xyz);`;

export const SKIN_HEAD = /* glsl */`
uniform vec4 uFinQ; varying vec3 vFinE;
float finFbm(vec3 p) { return finNoise(p) * 0.5 + finNoise(p * 2.03 + 1.7) * 0.3 + finNoise(p * 4.01 + 3.1) * 0.2; }
// how much of a detail of frequency f (per body height) is still worth drawing at this pixel's footprint px
float finSee(float px, float f) { return 1.0 - smoothstep(0.25, 0.7, px * f); }
// a line of half-width wd on a distance e: antialiased by its own footprint, faded out once it is thinner than a pixel
float finLine(float e, float wd) { float aa = max(fwidth(e), 1e-5); return (1.0 - smoothstep(wd - aa, wd + aa, e)) * smoothstep(0.2, 0.6, wd / aa); }
// a height h (0..1) of k metres raised on the shaded normal, with no tangents (three.js perturbNormalArb, Mikkelsen 2010)
vec3 finBump(vec3 n, float h, float k) {
  vec3 p = -vViewPosition, dx = dFdx(p), dy = dFdy(p), r1 = cross(dy, n), r2 = cross(n, dx);
  float det = dot(dx, r1); vec3 g = sign(det) * (dFdx(h) * k * r1 + dFdy(h) * k * r2);
  return normalize(abs(det) * n - g); }
// a fracture net: x the crack (big shards, and hairlines off some of them), y its stain or glow round it, z the shard's own random
vec3 finCrack(vec3 q, float f, float px) {
  vec3 w = q + (vec3(finNoise(q * 6.0), finNoise(q * 6.0 + 7.1), finNoise(q * 6.0 + 3.7)) - 0.5) * (0.6 / max(f, 1.0));
  vec3 a = finCells(w * f), b = finCells(w * f * 2.7);
  float big = finLine(a.y - a.x, 0.035), fine = finLine(b.y - b.x, 0.025) * step(0.55, fract(a.z * 9.7)) * 0.8;
  return vec3(max(big, fine), (1.0 - smoothstep(0.0, 0.25, a.y - a.x)) * finSee(px, f * 2.0), a.z); }`;

// what the pattern hands the later stages (declared once at the top of main, beside the glaze's)
export const SKIN_DECL = /* glsl */`
  float finSkH = 0.0, finSkPh = 0.0, finSkMet = 0.0, finSkMetK = 0.0, finSkRough = 0.0, finSkRoughK = 0.0; // (H the bump's height; Ph a phase for the light; Met / Rough targets and how much of each)
  vec3 finSkE = vec3(0.0), finSkSSS = vec3(1.0, 0.8, 0.6), finSkGlass = vec3(0.0); // (E light of its own; SSS the colour through the thin edges; Glass a cell's colour)`;

// THE COLOUR: after the skin's own (diffuseColor is the tone already)
export const SKIN_COLOR = /* glsl */`
  if (uFinOn > 0.5 && uFinM.x > 0.5) {
    vec3 q = vFinObj * uFinM.y; float px = length(fwidth(q)), k = uFinM.z, w = uFinM.w; int sp = int(uFinM.x + 0.5);
    vec3 A = diffuseColor.rgb, C = uFinC;
    #ifndef FLAT_SHADED
    float ndvC = abs(dot(normalize(vNormal), normalize(vViewPosition)));
    #else
    float ndvC = 1.0;
    #endif
    if (sp == 1) {                                                                                                   // FLESH
      vec3 under = C / max(max(C.r, max(C.g, C.b)), 1e-3);
      diffuseColor.rgb = A * mix(vec3(1.0), under, smoothstep(0.45, 0.8, finFbm(q * 6.0)) * 0.22) * (1.0 + (finNoise(q * 23.0) - 0.5) * 0.06 * finSee(px, 23.0));
      if (w > 0.0) {                                                                                                 // freckles, thicker up top
        vec3 c = finCells(q * w); float r = 0.14 + 0.16 * c.z, dens = mix(0.2, 0.7, smoothstep(0.5, 0.82, q.y / 8.0)) * smoothstep(0.25, 0.6, finNoise(q * 5.0));
        float f = (1.0 - smoothstep(r * 0.55, r, c.x)) * step(1.0 - dens, fract(c.z * 7.13)) * finSee(px, w);
        diffuseColor.rgb = mix(diffuseColor.rgb, A * vec3(0.64, 0.47, 0.36), f * (0.55 + 0.45 * fract(c.z * 3.1)));
      }
      finSkSSS = C;
    } else if (sp == 2) {                                                                                            // PORCELAIN
      float ring = (0.5 + 0.5 * sin(q.y * 30.0 + finNoise(q * 3.0) * 4.0)) * finSee(px, 5.0);
      diffuseColor.rgb = mix(A * (1.0 - 0.035 * ring), A * vec3(0.8, 0.88, 1.0), pow(1.0 - ndvC, 2.0) * 0.55);
      finSkSSS = C; finSkH = ring;
    } else if (sp == 3) {                                                                                            // SPECKLE
      vec3 c = finCells(q * w); float r = 0.16 + 0.22 * c.z, on = step(1.0 - k, fract(c.z * 7.31)), see = finSee(px, w);
      float spk = (1.0 - smoothstep(r * 0.55, r, c.x)) * on * see, halo = (1.0 - smoothstep(r, r * 2.4, c.x)) * on * see * 0.45;
      vec3 col = A * (1.0 + (finNoise(q * w * 0.6) - 0.5) * 0.14 * finSee(px, w * 0.6));
      col = mix(col, mix(A, C, 0.5), halo * uFinQ.z);
      diffuseColor.rgb = mix(col, C, spk); finSkH = spk;
    } else if (sp == 4) {                                                                                            // BURNISH
      float see = finSee(px, 8.0);
      float stroke = finNoise(vec3(q.x * 2.0, q.y * 14.0, q.z * 2.0) + finNoise(q * 3.0) * 2.0);
      float flash = smoothstep(0.4, 0.78, finFbm(q * 2.2 + 5.0));
      diffuseColor.rgb = mix(A, C, flash * k) * (1.0 + (stroke - 0.5) * 0.1 * see);
      finSkRough = mix(0.42, 0.16, mix(0.5, stroke, see)); finSkRoughK = 1.0; finSkH = stroke * see;
    } else if (sp == 5) {                                                                                            // SMOKE
      vec3 cr = finCrack(q, w, px); float smoke = smoothstep(0.35, 0.78, finFbm(q * 3.0 + 2.0));
      vec3 col = mix(A, mix(A, C, 0.78), smoke * k);
      col = mix(col, mix(col, C, 0.35), cr.y);                                                                     // (carbon soaked in round the crazing)
      diffuseColor.rgb = mix(col, C, cr.x);
      float cu = smoothstep(0.64, 0.72, finFbm(q * 4.0 + 9.0)) * uFinQ.z;                                          // (copper's flash, where the reduction caught it)
      finSkE = finSpectrum(0.05 + finNoise(q * 6.0) * 0.25) * cu * 0.1; finSkMet = 0.6; finSkMetK = cu;
      finSkH = 1.0 - cr.x;
    } else if (sp == 6) {                                                                                            // CELADON
      float t = smoothstep(0.3, 0.8, finFbm(q * 4.0 + 1.3));
      vec3 col = mix(A, A * vec3(0.5, 0.72, 0.58), t * 0.65 + pow(1.0 - ndvC, 2.0) * 0.4);
      vec3 cr = finCrack(q, w, px);
      diffuseColor.rgb = mix(col, col * vec3(0.55, 0.5, 0.42), cr.x * uFinQ.z);
      finSkSSS = C; finSkH = 1.0 - cr.x * uFinQ.z;
    } else if (sp == 7) {                                                                                            // MARBLE
      vec3 p = q * 2.6; p += (vec3(finFbm(p * 1.1), finFbm(p * 1.1 + 4.1), finFbm(p * 1.1 + 8.2)) - 0.5) * 2.4;
      float t = p.y * w + p.x * 1.3 + p.z * 0.7, s = 0.5 + 0.5 * sin(t);
      float lam = (0.5 + 0.5 * sin(t * 5.0 + finNoise(p * 3.0) * 2.0)) - 0.5;
      float clay = smoothstep(0.4, 0.6, s);
      diffuseColor.rgb = mix(A, C, clay) * (1.0 + lam * 0.14 * finSee(px, w * 5.0 * 2.6 / 6.283)); finSkH = clay;
    } else if (sp == 8) {                                                                                            // NACRE
      vec3 p = q * 5.0; float ph = finFbm(p + (vec3(finNoise(p * 0.7), finNoise(p * 0.7 + 3.3), finNoise(p * 0.7 + 6.6)) - 0.5) * 2.0) * w;
      float band = fract(ph), see = finSee(px, 5.0 * w * 1.5);
      float lay = smoothstep(0.0, 0.2, band) * (1.0 - smoothstep(0.8, 1.0, band));                                 // (each layer's lip, no hard step)
      diffuseColor.rgb = A * (0.9 + 0.1 * mix(0.6, lay, see));
      finSkPh = ph; finSkH = lay * see;
    } else if (sp == 9) {                                                                                            // PATINA
      float run = (finNoise(vec3(q.x * 36.0, q.y * 2.5, q.z * 36.0)) - 0.5) * 0.25 * finSee(px, 36.0);            // (where water ran down it)
      float verd = smoothstep(0.5, 0.62, finFbm(q * 5.0 + 3.0) + run - vFinN.y * 0.12 + (0.5 - q.y / 8.0) * 0.1 + (k - 0.5) * 0.3);
      float crust = finNoise(q * 40.0) * finSee(px, 40.0);
      diffuseColor.rgb = mix(A, C * (0.85 + 0.3 * crust), verd);
      finSkMet = 0.0; finSkMetK = verd; finSkRough = 0.9; finSkRoughK = verd;
      finSkE = A * (1.0 - verd) * 0.14;                                                                             // (a lift: there is no sky in the bronze to mirror)
      finSkH = verd * (0.6 + 0.4 * crust);
    } else if (sp == 10) {                                                                                           // WOOD
      float r = length(q.xz) * w + finFbm(q * vec3(2.5, 0.5, 2.5)) * 3.0 + q.y * 0.6, ring = fract(r);
      float late = smoothstep(0.55, 0.88, ring) * (1.0 - smoothstep(0.9, 1.0, ring));
      float pore = smoothstep(0.62, 0.8, finNoise(vec3(q.x * 60.0, q.y * 4.0, q.z * 60.0))) * finSee(px, 60.0);
      float see = finSee(px, w * 1.5);
      diffuseColor.rgb = mix(A, C, mix(0.35, late, see) * k) * (1.0 - pore * 0.18);
      finSkRough = mix(0.3, 0.45, late); finSkRoughK = 1.0; finSkH = 1.0 - late * 0.4 * see - pore * 0.4;
    } else if (sp == 11) {                                                                                           // SUMI
      float v = finFbm(q * vec3(2.2, 1.1, 2.2) + 0.7), s = fract(q.y * w + v * 1.6);
      float wash = smoothstep(0.0, 0.92, s) * (1.0 - smoothstep(0.92, 1.0, s)) * smoothstep(0.3, 0.5, v);       // (each wash pooled at its foot)
      float edge = finLine(abs(v - 0.5), 0.012);                                                                    // (a dried bloom's dark edge)
      float gran = (finNoise(q * 40.0) - 0.5) * finSee(px, 40.0);                                                // (the ink settling in the grain)
      float ink = clamp(wash * 0.75 + edge * 0.55 + pow(1.0 - ndvC, 2.5) * 0.55 * k + gran * 0.2 * wash, 0.0, 1.0);
      diffuseColor.rgb = mix(A, C, ink);
    } else if (sp == 12) {                                                                                           // STARS
      diffuseColor.rgb = A * (0.6 + 0.8 * finFbm(q * 3.0));
    } else if (sp == 13) {                                                                                           // GLASS
      vec3 c = finCells(q * w + (vec3(finNoise(q * 3.0), finNoise(q * 3.0 + 5.0), finNoise(q * 3.0 + 9.0)) - 0.5) * 0.4);
      float lead = mix(finLine(c.y - c.x, 0.05), 0.22, 1.0 - finSee(px, w * 4.0));                                 // (far: the leading's mean)
      int pick = int(floor(c.z * 6.0));
      vec3 jw = pick == 0 ? vec3(0.75, 0.06, 0.10) : pick == 1 ? vec3(0.10, 0.22, 0.80) : pick == 2 ? vec3(0.95, 0.62, 0.12)
        : pick == 3 ? vec3(0.10, 0.62, 0.30) : pick == 4 ? vec3(0.45, 0.18, 0.70) : vec3(0.85, 0.88, 0.75);
      jw = mix(pow(jw, vec3(2.2)), C, uFinQ.z);
      float seedy = (finNoise(q * w * 6.0) - 0.5) * finSee(px, w * 6.0);
      finSkGlass = jw * (1.0 + 0.5 * seedy) * (1.0 - lead);
      diffuseColor.rgb = mix(jw * 0.25, A, lead);
      finSkMet = 0.5; finSkMetK = lead; finSkRough = mix(0.06, 0.55, lead); finSkRoughK = 1.0; finSkH = lead;
    } else if (sp == 14) {                                                                                           // SLIP
      float f = finFbm(q * 2.4 + 4.0) * w + q.y * w * 0.25, e = abs(fract(f) - 0.5), aa = max(fwidth(e), 1e-5);
      float vis = smoothstep(0.2, 0.6, 0.11 / aa), ln = finLine(e, 0.11);
      diffuseColor.rgb = mix(mix(A, C, ln), mix(A, C, 0.25), 1.0 - vis);
      finSkH = sqrt(max(0.0, 1.0 - e / 0.11)) * vis;
    } else if (sp == 15) {                                                                                           // SCHILLER
      float vf = finFbm(q * 3.0 + 1.0);
      diffuseColor.rgb = mix(A, C, finLine(abs(vf - 0.5), 0.02) * 0.7);
      finSkPh = vf;
    } else if (sp == 16) {                                                                                           // LEAF
      float n = finFbm(q * w + 2.0) + (finNoise(q * w * 14.0) - 0.5) * 0.04 * finSee(px, w * 14.0), fn = max(fwidth(n), 1e-4);
      float leaf = smoothstep(0.5 - fn, 0.5 + fn, n);
      vec3 c = finCells(q * w * 10.0); leaf *= 1.0 - (1.0 - smoothstep(0.2, 0.3, c.x)) * step(0.72, c.z) * finSee(px, w * 10.0); // (flaked through)
      float wr = finNoise(q * w * 12.0) * finSee(px, w * 12.0);                                                     // (crinkled)
      diffuseColor.rgb = mix(A, C * (0.85 + 0.3 * wr), leaf);
      finSkMet = 0.95; finSkMetK = leaf; finSkRough = 0.2 + 0.2 * wr; finSkRoughK = leaf;
      finSkE = C * leaf * 0.12; finSkH = leaf * (0.6 + 0.4 * wr);
    } else if (sp == 17) {                                                                                           // KINTSUGI
      vec3 cr = finCrack(q, w, px);
      diffuseColor.rgb = mix(A * (1.0 + (finNoise(q * 20.0) - 0.5) * 0.06 * finSee(px, 20.0)), C, cr.x);
      finSkMet = 0.95; finSkMetK = cr.x; finSkRough = 0.2; finSkRoughK = cr.x;
      finSkE = C * cr.x * 0.18; finSkH = cr.x;
    } else if (sp == 18) {                                                                                           // MOLTEN
      vec3 cr = finCrack(q, w, px);
      diffuseColor.rgb = mix(A * (0.7 + 0.6 * finFbm(q * 8.0)), C, cr.x);
      finSkE = C * (cr.x * 1.6 + cr.y * 0.35) * uFinQ.y; finSkH = 1.0 - cr.x;
    } else if (sp == 19) {                                                                                           // MOSS
      vec3 c = finCells(q * w); float r = 0.3 + 0.3 * c.z, on = step(0.5, c.z), see = finSee(px, w);
      float lich = (1.0 - smoothstep(r * 0.85, r, c.x)) * on * see, lrim = exp(-pow((c.x - r * 0.8) / (r * 0.1), 2.0)) * on * see;
      vec3 lc = fract(c.z * 13.7) > 0.7 ? vec3(0.62, 0.32, 0.06) : C;                                              // (now and then an orange one)
      float m = smoothstep(0.5, 0.6, finFbm(q * 4.0 + 6.0) + vFinN.y * 0.12 + (k - 0.5) * 0.3);
      float fuzz = finNoise(q * 60.0) * finSee(px, 60.0);
      vec3 stone = A * (1.0 + (finNoise(q * 30.0) - 0.5) * 0.3 * finSee(px, 30.0));
      vec3 col = mix(stone, lc * (1.0 + lrim * 0.4), lich);
      diffuseColor.rgb = mix(col, mix(vec3(0.05, 0.12, 0.02), vec3(0.18, 0.32, 0.04), fuzz), m);
      finSkRough = 0.95; finSkRoughK = 1.0; finSkH = m * (0.5 + 0.5 * fuzz) + lich * 0.2;
    }
  }`;

// THE SURFACE: metal and gloss where the pattern says (gold, bronze, the lead, a burnish)
export const SKIN_SURFACE = /* glsl */`
  if (uFinOn > 0.5 && uFinM.x > 0.5) { metalnessFactor = mix(metalnessFactor, finSkMet, finSkMetK); roughnessFactor = mix(roughnessFactor, finSkRough, finSkRoughK); }`;

// THE LIGHT: first the raised and sunk details on the normal (so the rest of the light, and the lamps after it, see them)
export const SKIN_LIGHT_PRE = /* glsl */`
  if (uFinOn > 0.5 && uFinM.x > 0.5 && uFinQ.x > 0.0) normal = finBump(normal, finSkH, uFinQ.x);`;
// then, after the skin's own light, what a pattern throws back of its own
export const SKIN_LIGHT = /* glsl */`
  if (uFinOn > 0.5 && uFinM.x > 0.5) {
    vec3 V = normalize(vViewPosition), n = normalize(normal); float ndv = abs(dot(n, V)), rim = 1.0 - ndv, k = uFinM.z; int sp = int(uFinM.x + 0.5);
    vec3 q = vFinObj * uFinM.y; float px = length(fwidth(q));
    totalEmissiveRadiance += finSkE;
    if (sp == 8) totalEmissiveRadiance += finSpectrum(finSkPh * 0.7 + ndv * 1.4) * (0.05 + pow(rim, 1.5) * 0.4) * k; // NACRE: interference
    else if (sp == 12) {                                                                                             // STARS: at depth, with the eye
      vec3 E = normalize(vFinE + vec3(0.0, 0.0, 1e-5)), sky = vec3(0.0);
      float nb = smoothstep(0.45, 0.85, finFbm(q * 2.5 - E * 0.05 + 3.0));
      sky += mix(uFinC, uFinB, finNoise(q * 1.7 - E * 0.05)) * nb * 0.3 * k;
      for (int i = 0; i < 3; i++) {
        float fi = float(i), f = 35.0 + 20.0 * fi;
        vec3 c = finCells((q - E * (0.03 + 0.04 * fi)) * f); float b = clamp((c.z - 0.8) * 5.0, 0.0, 1.0);
        float s = (1.0 - smoothstep(0.0, 0.1 + 0.12 * b, c.x)) * b;
        vec3 tint = mix(vec3(0.7, 0.8, 1.0), vec3(1.0, 0.85, 0.6), fract(c.z * 31.0));
        sky += tint * mix(0.012, s * 1.6, finSee(px, f)) * (1.0 - 0.25 * fi);                                     // (under a pixel, the layer's mean)
      }
      totalEmissiveRadiance += sky;
    } else if (sp == 13) totalEmissiveRadiance += finSkGlass * (0.45 + 0.55 * ndv) * k;                            // GLASS: lit from inside
    else if (sp == 15) {                                                                                             // SCHILLER: the film under the dark
      vec3 dom = vec3(finNoise(q * 3.0), finNoise(q * 3.0 + 5.3), finNoise(q * 3.0 + 9.1)) - 0.5;
      float flash = smoothstep(0.6, 0.95, dot(normalize(n + dom * 1.8), V)) * k;
      float ph = finSkPh * 2.0 + dot(V, n) * 0.3, x = fract(ph) * 7.0, i = floor(x), f = smoothstep(0.0, 1.0, x - i);
      totalEmissiveRadiance += mix(finLab(int(i)), finLab(int(mod(i + 1.0, 7.0))), f) * (flash * 0.9 + 0.04);
    }
  }`;
