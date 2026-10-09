// ---------------------------------------------------------------------------------------
// THE RAIL'S MARK: one shader program for every mark of the fight at sea (docs/plans/RAIL-OVERHAUL.md section 8; Calissa's look for the
// crossing: "the storm bends the world, never the danger"). A mark is a SEGMENT seen by the camera: two points (A, B) and a half-width
// at each, made into a quad in SCREEN SPACE by the vertex shader and shaded by its STYLE in the fragment shader:
//
//   astral    a foe's astral shot: a white-gold core, a dark rim, a soft glow (its core is past the glow's threshold, render/glow.js);
//             a capsule from its tail (A) to its head (B), the head the hit sphere's centre, tapering to the tail so it reads which
//             way it flies
//   umbral    a foe's umbral shot: a black core and a pale rim (under the glow's threshold: no glow), the same capsule
//             (either outlined: the parry mark round it, vfx/parrymark.js's two parts, its ink and its oil film, at the parry mark's
//             3.6 px; the film is set at the outline's outer edge, bright enough to read on the black crude)
//   gun       the psygun's shot on the rail: a needle in the ship's colour, white at its heart, light added (no rim: never a foe's)
//   ribbon    one segment of a ribbon (an Itano lance's: vfx/itano.js): its two ends turned by its neighbours (P before A, N after B),
//             so the segments of a strip meet edge to edge, never overlapping (the screen-space polyline of MeshLine and Matt
//             DesLauriers' "Drawing Lines is Hard"); its colour over the frame, a paler heart, a shade at its edges, tapering, fading
//   spark     a hot point (a ribbon's head), light added
//   ring      the closing ring (vfx/closingring.js): a ring at A of radius wA shrinking to the part's own ring (wB): ink, with the Mind's
//             schiller (vfx/labradorite.js) as a line inside it, the parry mark's line weight
//   hurtbox   the ship's hurtbox: a pale core and a dark ring, its outer edge exactly the hurtbox's radius (never larger or smaller
//             than what is hit), the ring edged pale outside so it reads on the black crude too
//   wire      a mount's preview (vfx/mountpreview.js): a ribbon's segment in the mount's colour, shaded dark at its edges, with the
//             Mind's schiller (vfx/labradorite.js) along its heart (a negative wA: the colour alone). The one style that keeps its
//             DEPTH: it lies on the water in the world, so a jetty, a hull or the Courier in front of it hides it (its buffer's material
//             takes `depthTest`, a state and not a program: the same rail-mark program, casebook rule 124)
//
// Everything is in pixels of the target being drawn (the 480-line present: render/present.js): every mark at least a few pixels (a
// far shot is the same shape scaled up, so it reads the same), every line of the parry mark's 3.6 px. A shot (a capsule) within five metres
// of the eye fades out as it nears it (a head at a metre across is a hundred pixels and white: a flash); no shot a player must read is
// ever that near (the nearest view's camera is seven metres from the ship). Drawn over everything (no depth
// test), never fogged, never bent: a mesh made here carries `userData.unbent` (the storm's warp leaves it alone, it must) and
// `userData.zoneFree`. One blend for all of it: premultiplied alpha, so a body covers (alpha 1) and a glow adds (alpha 0) in one draw.
//
// Prior art: every danmaku's bullet sprite (Touhou's and Cave's: a bright core and a dark edge, an elongated sprite for a fast bullet,
// smaller faster bullets over larger slower ones), the signed-distance capsule (Inigo Quilez, "2D distance functions"), screen-space
// lines (MeshLine; DesLauriers 2015), osu!'s approach circle (the closing ring's shrink), and the parry mark's own Cuphead.
//
//   const B = new MarkBuffer(cap, { renderOrder })   parent.add(B.mesh)
//   B.put(i, ax, ay, az, wa, bx, by, bz, wb, px, py, pz, aa, nx, ny, nz, ab, style, s1, s2, s3)   B.count = n   B.flush()
//   (points in the mesh's parent's frame, the scene's in the game: the world; wa, wb half-widths in metres; aa, ab alpha at A and B;
//    style a STYLE; s1..s3 by style: astral/umbral (outlined 0|1, -, seed), gun/ribbon/spark/wire (r, g, b in linear light))
//   B.time(t)   the film's and the schiller's drift (seconds)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime } from './labradorite.js';

export const STYLE = { astral: 0, umbral: 1, gun: 2, ribbon: 3, spark: 4, ring: 5, hurtbox: 6, wire: 7 };
/** A shot's kind, as the runtime may name it ('astral' | 'umbral' | 0 | 1): astral by default. */
export const kindOf = (k) => (k === 'umbral' || k === 1 ? 1 : 0);
/** The parry mark's line, in pixels at the 480-line present (vfx/parrymark.js WIDTH). */
export const MARK_LINE = 3.6;

const STRIDE = 20;

const V = /* glsl */`
attribute vec4 iA, iB, iP, iN, iS;
uniform vec2 uRes;
varying vec4 vS;   // the style and its numbers
varying vec4 vL;   // x, y: this pixel in the mark's own frame (px: x along from A, y across); z: the segment's length (px); w: 0 at A, 1 at B
varying vec4 vR;   // x, y: half-widths at A and B (px); z: the outline's width (px), or a wire's heart (0 or 1); w: alpha
varying float vPh; // a wire's place on the schiller's palette (labradorite.js labPhase, its drift added in the fragment)
const float ZC = -0.15;                                                  // (a plane just before the eye: what is behind it is cut off)
vec3 eye(vec3 p) { return (modelViewMatrix * vec4(p, 1.0)).xyz; }
vec2 scr(vec3 v, out float pxm) { vec4 c = projectionMatrix * vec4(v, 1.0); pxm = projectionMatrix[1][1] * 0.5 * uRes.y / c.w; return c.xy / c.w * 0.5 * uRes; }
void main() {
  vS = iS; vL = vec4(0.0); vR = vec4(0.0); vPh = 0.0;
  int st = int(iS.x + 0.5);
  gl_Position = vec4(0.0, 0.0, 2.0, 1.0);                               // (off, until it is placed)
  vec3 a = eye(iA.xyz), b = eye(iB.xyz);
  if (a.z > ZC && b.z > ZC) return;
  if (a.z > ZC) a = mix(a, b, (a.z - ZC) / (a.z - b.z));
  if (b.z > ZC) b = mix(b, a, (b.z - ZC) / (b.z - a.z));
  float pa, pb; vec2 sa = scr(a, pa), sb = scr(b, pb);
  float ra = abs(iA.w) * pa, rb = abs(iB.w) * pb;
  vec2 pos;
  if (st == 3 || st == 7) {
    // a ribbon's segment: each end turned by the line through its neighbours, so the next segment starts on the same two corners
    vec3 p = eye(iP.xyz), n = eye(iN.xyz); float q;
    vec2 sp = sa, sn = sb, dd = sb - sa;
    if (p.z < ZC) sp = scr(p, q);
    if (n.z < ZC) sn = scr(n, q);
    vec2 d0 = sb - sp, d1 = sn - sa;
    vec2 t0 = length(dd) > 1e-3 ? normalize(dd) : vec2(1.0, 0.0);
    vec2 ta = length(d0) > 1e-3 ? normalize(d0) : t0, tb = length(d1) > 1e-3 ? normalize(d1) : t0;
    float side = position.y;
    float fa = max(ra, 0.75), fb = max(rb, 0.75);                        // (never thinner than a pixel and a half: thinner is fainter instead)
    pos = position.x < 0.5 ? sa + vec2(-ta.y, ta.x) * fa * side : sb + vec2(-tb.y, tb.x) * fb * side;
    vL = vec4(0.0, side, length(dd), position.x);
    vR = vec4(fa, fb, st == 7 && iA.w > 0.0 ? 1.0 : 0.0, mix(iP.w * min(1.0, ra / fa), iN.w * min(1.0, rb / fb), position.x));
    if (st == 7) { vec3 wp = (modelMatrix * vec4(position.x < 0.5 ? iA.xyz : iB.xyz, 1.0)).xyz; vPh = dot(wp, vec3(0.071, 0.103, 0.057)) + 0.42 * dot(normalize(cameraPosition - wp), vec3(0.55, 0.62, -0.56)); }
  } else if (st >= 4) {
    // a round mark about A: a spark, a ring (and the part's ring inside it, wB), the hurtbox (its true size: no least size)
    if (st == 4) ra = max(ra, 2.0);
    rb = iB.w * pa;
    float h = max(ra, rb) + (st == 5 ? MARK_HALF + 1.5 : 1.5);
    vec2 c = vec2(position.x * 2.0 - 1.0, position.y) * h;
    pos = sa + c;
    vL = vec4(c, 0.0, 0.0);
    vR = vec4(ra, rb, 0.0, iN.w);
  } else {
    // a capsule, tail A to head B: at least MIN px across at the head, and the whole shape scaled with it (a far shot reads as a near one)
    float k = max(1.0, (st == 2 ? 1.0 : 4.0) / max(rb, 1e-4));
    ra *= k; rb *= k; if (st != 2) sa = sb + (sa - sb) * k;
    vec2 d = sb - sa; float L = length(d);
    vec2 t = L > 1e-3 ? d / L : vec2(1.0, 0.0), nrm = vec2(-t.y, t.x);
    float ow = (st < 2 && iS.y > 0.5) ? MARK_LINE + 1.6 : 0.0;          // (outlined: the parry mark's ink, and its film outside it)
    float halo = st == 0 ? rb * 1.1 : 0.0;                              // (room for the astral glow)
    float R = max(ra, rb) + ow + halo + 1.0;
    float s = position.x < 0.5 ? -R : L + R;
    float nearFade = smoothstep(1.2, 5.0, -b.z);                        // (a shot at the eye is a screen-wide flash: it fades out over its last four metres)
    pos = sa + t * s + nrm * position.y * R;
    vL = vec4(s, position.y * R, L, 0.0);
    vR = vec4(ra, rb, ow, iN.w * nearFade);
  }
  gl_Position = vec4(pos / (0.5 * uRes), 0.0, 1.0);
  // a wire keeps its end's own depth (the screen-space quad at that end's clip w), so the world in front of it hides it
  if (st == 7) { vec4 c = projectionMatrix * vec4(position.x < 0.5 ? a : b, 1.0); gl_Position = vec4(gl_Position.xy * c.w, c.z, c.w); }
}`;

const F = /* glsl */`
uniform float uTime;
varying vec4 vS, vL, vR;
varying float vPh;
${LAB_GLSL}
const vec3 INK = vec3(0.004, 0.003, 0.007);                                // (the parry mark's ink, in linear light)
vec3 film(float ph) { vec3 f = 0.5 + 0.5 * cos(6.2832 * (ph + vec3(0.0, 0.33, 0.67))); return f * f; } // (the parry mark's oil film)
float cover(float e) { return clamp(e + 0.5, 0.0, 1.0); }                 // (a signed distance in px to coverage: one pixel of antialiasing)
void main() {
  int st = int(vS.x + 0.5);
  vec3 col = vec3(0.0); float a = 0.0;                                     // (premultiplied: col is added after the frame is darkened by a)
  float al = vR.w;
  if (st < 3) {
    float s = vL.x, t = vL.y, L = vL.z;
    float h = L > 1e-3 ? clamp(s / L, 0.0, 1.0) : 1.0;                    // (0 at the tail, 1 at the head)
    float r = mix(vR.x, vR.y, h), dx = s - clamp(s, 0.0, L), d = length(vec2(dx, t)), q = d / max(r, 1e-3);
    float body = cover(r - d);
    if (st == 2) {
      col = mix(vec3(1.6), vS.yzw * 1.8, smoothstep(0.0, 0.85, q)) * body * mix(0.2, 1.0, h * h) * al; a = body * al * 0.6; // (an alpha, not light alone: at alpha 0 the needle wrote nothing, the owner's R16 v133; it also darkens a bright sky behind it, so it reads by day: Petra's crossing, Calissa's to refine)
    } else {
      bool astral = st == 0;
      float inner = cover(0.58 * r - d);                                   // (the core: inside six tenths of the radius)
      vec3 core = astral ? mix(vec3(1.0, 0.96, 0.86) * 4.2, vec3(1.0, 0.8, 0.42) * 2.4, smoothstep(0.0, 0.58, q)) * mix(0.4, 1.0, h)
                         : vec3(0.0022, 0.0018, 0.0035);
      vec3 rim = astral ? vec3(0.016, 0.011, 0.02) : vec3(0.8, 0.78, 0.9) * mix(0.7, 1.0, h);
      col = mix(rim, core, inner) * body * al; a = body * al;
      if (vS.y > 0.5) {
        float ow = vR.z, e = d - r;
        float outline = cover(e) * cover(ow - e) * al;
        float ph = atan(t, dx + 1e-4) * 0.159 + vS.w + uTime * 0.35;     // (the film runs round the outline, slowly and at one rate)
        vec3 f = film(ph);
        vec3 oc = mix(INK + f * 0.1, f * 0.95 + 0.05, smoothstep(ow - 2.4, ow - 0.6, e));
        col += oc * outline * (1.0 - a); a += outline * (1.0 - a);
      }
      if (astral) { float e = max(d - r - vR.z, 0.0) / max(r * 0.5, 1.0); col += vec3(1.0, 0.72, 0.3) * 0.22 * exp(-e * e) * (1.0 - a) * al; } // (a soft glow, gone before the quad's edge)
    }
  } else if (st == 3) {
    // the lance's colour over what is behind (added light would go white on the gold), a paler heart, a shade of it at its edges
    float edge = 1.0 - abs(vL.y), body = smoothstep(0.0, 0.3, edge), lit = smoothstep(0.35, 0.7, edge);
    vec3 c = mix(vS.yzw * 0.12, mix(vS.yzw * 1.4, vS.yzw * 0.5 + vec3(1.1), smoothstep(0.8, 1.0, edge)), lit);
    a = body * 0.9 * al; col = c * a;
  } else if (st == 7) {
    // a mount's preview: its colour shaded dark at the edges (it holds on noon sand and on the black crude alike), the Mind's schiller
    // along the heart of a wire (vR.z), drifting at the Mind's one slow rate
    float hw = mix(vR.x, vR.y, vL.w), edge = 1.0 - abs(vL.y), body = smoothstep(0.0, clamp(1.0 / hw, 0.3, 1.0), edge); // (a pixel of soft edge at least: a thin line never crawls)
    float lit = smoothstep(0.3, 0.6, edge), heart = smoothstep(0.72, 0.95, edge) * vR.z;
    vec3 c = mix(vS.yzw * 0.1, vS.yzw * 1.35, lit);
    c = mix(c, labSoft(vPh + uMindT * 0.018) * 1.7, heart);
    a = body * 0.92 * al; col = c * a;
  } else {
    float d = length(vL.xy), r = vR.x;
    if (st == 4) {
      float q = d / max(r, 1.0);
      col = (vec3(1.4) + vS.yzw * 2.2) * pow(max(1.0 - q, 0.0), 1.8) * al; a = pow(max(1.0 - q, 0.0), 1.8) * al * 0.5; // (the same: a spark at alpha 0 wrote nothing)
    } else if (st == 5) {
      // the ring coming in: ink, the schiller inside it; the part's own ring, fainter, where it will close
      float line = cover(MARK_HALF - abs(d - r)), lit = cover(0.75 - abs(d - r));
      float ang = atan(vL.y, vL.x) * 0.159;
      vec3 c = mix(INK, labSoft(ang + uTime * 0.12) * 1.7, lit);
      float part = cover(1.1 - abs(d - vR.y)) * 0.55, plit = cover(0.5 - abs(d - vR.y));
      vec3 pc = mix(INK, labSoft(ang - uTime * 0.12) * 1.3, plit);
      col = pc * part * al; a = part * al;
      col = c * line * al + col * (1.0 - line * al); a = line * al + a * (1.0 - line * al);
    } else {
      // the hurtbox: a pale core, a dark ring, a pale edge; its outer edge the radius exactly
      float coreR = max(r * 0.3, 1.6), ringIn = max(r - 2.8, coreR + 0.8);
      float core = cover(coreR - d), ring = cover(d - ringIn) * cover(r - 1.0 - d), edge = cover(d - (r - 1.0)) * cover(r - d);
      vec3 pale = vec3(1.0, 0.97, 0.92);
      col = pale * 1.5 * core + INK * ring + pale * 0.8 * edge * 0.75; a = core + ring * 0.85 + edge * 0.75;
      col *= al; a *= al;
    }
  }
  gl_FragColor = vec4(col, a);
}`;

const DEFS = `#define MARK_LINE ${MARK_LINE.toFixed(2)}\n#define MARK_HALF ${(MARK_LINE / 2).toFixed(2)}\n`;

/** The one material (a program shared by every mark: the same source compiles once, whatever instance asks: casebook rule 5). */
export function railMarkMaterial() {
  return new THREE.ShaderMaterial({
    name: 'rail-mark', uniforms: { uRes: { value: new THREE.Vector2(854, 480) }, uTime: { value: 0 }, uMindT: mindTime },
    vertexShader: DEFS + V, fragmentShader: DEFS + F,
    transparent: true, depthTest: false, depthWrite: false, fog: false, premultipliedAlpha: true,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
}

const _px = new THREE.Vector2();

/** A pool of marks, one instanced draw: written each frame from the start, `count` of them drawn. */
export class MarkBuffer {
  constructor(cap, { renderOrder = 40 } = {}) {
    this.cap = cap; this.count = 0;
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, -1, 0, 1, -1, 0, 0, 1, 0, 1, 1, 0], 3)); // (x 0 at A, 1 at B; y across)
    g.setIndex([0, 1, 2, 2, 1, 3]);
    this.data = new Float32Array(cap * STRIDE);
    this.buf = new THREE.InstancedInterleavedBuffer(this.data, STRIDE).setUsage(THREE.DynamicDrawUsage);
    for (const [k, off] of [['iA', 0], ['iB', 4], ['iP', 8], ['iN', 12], ['iS', 16]]) g.setAttribute(k, new THREE.InterleavedBufferAttribute(this.buf, 4, off));
    g.instanceCount = 0;
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1); g.boundingBox = new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));
    this.mat = railMarkMaterial();
    const m = (this.mesh = new THREE.Mesh(g, this.mat));
    m.frustumCulled = false; m.matrixAutoUpdate = false; m.renderOrder = renderOrder; m.raycast = () => {};
    m.userData.zoneFree = true; m.userData.unbent = true; m.name = 'rail-marks';
    m.onBeforeRender = (r) => { const rt = r.getRenderTarget(); if (rt) _px.set(rt.width, rt.height); else r.getDrawingBufferSize(_px); this.mat.uniforms.uRes.value.copy(_px); }; // (the pixels of whatever is drawn into: the present's 480 lines)
  }
  time(t) { this.mat.uniforms.uTime.value = t % 3600; }
  put(i, ax, ay, az, wa, bx, by, bz, wb, px, py, pz, aa, nx, ny, nz, ab, style, s1 = 0, s2 = 0, s3 = 0) {
    const d = this.data, o = i * STRIDE;
    d[o] = ax; d[o + 1] = ay; d[o + 2] = az; d[o + 3] = wa;
    d[o + 4] = bx; d[o + 5] = by; d[o + 6] = bz; d[o + 7] = wb;
    d[o + 8] = px; d[o + 9] = py; d[o + 10] = pz; d[o + 11] = aa;
    d[o + 12] = nx; d[o + 13] = ny; d[o + 14] = nz; d[o + 15] = ab;
    d[o + 16] = style; d[o + 17] = s1; d[o + 18] = s2; d[o + 19] = s3;
  }
  /** The first `count` written are drawn (only those are sent). */
  flush() {
    const n = Math.min(this.count, this.cap);
    this.mesh.geometry.instanceCount = n;
    if (n) { this.buf.clearUpdateRanges(); this.buf.addUpdateRange(0, n * STRIDE); this.buf.needsUpdate = true; }
  }
  dispose() { this.mesh.parent?.remove(this.mesh); this.mesh.geometry.dispose(); this.mat.dispose(); }
}
