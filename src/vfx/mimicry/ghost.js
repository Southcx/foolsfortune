// ---------------------------------------------------------------------------------------
// THE MIMICRY GHOST (plain name; docs/plans/MIMICRY.md 7, "Calissa's ghost (in place of the gold wire)"): the target a mimicry puzzle
// asks for, drawn over its 12 m patch as the System's sight over the matter, a topographic hologram in the overlay's material (the
// labradorite film, vfx/labradorite.js) on the System's dark ink, in place of the placeholder's gold wire net (hidden while this shows):
//   - THE CHANGE ASKED, AS CONTOURS: a sheet laid at the target's own height, cell for cell (the island field's half-metre cells), and on
//     it the contour lines of the change asked (target minus start), one every 0.2 m of rise or fall, and an outline round where any
//     change is asked. A mound reads as rings stacked over the flat; a hollow's rings lie under the sand and are seen through it, dashed
//     and dimmed (an x-ray pass of the same sheet, drawn only where the ground hides it); a channel as long lines down its banks.
//   - THE COPY NEARING: where your ground already stands within a hand's breadth of the target over a change asked, its lines and a
//     wash under them turn gold (the System's gold, the cradle's and the lens's frame's); where you moved ground no change was asked of,
//     an ember wash. So the copy reads as it nears, and a stray stroke shows where it went. Refreshed from the live field a few times a
//     real second (attributes only).
//   - THE SCAN: a soft band sweeping the patch corner to corner every 3.2 real s, the lines brightening as it passes (the sight being
//     read); on the turn (`mimic.turn`) a sweep at once, the sheet up from the demonstration's dimmer strength.
//   - THE FRAME: four corner brackets and a faint border round the patch, so its edge is known from the hand's height.
//   - THE SOLVE'S BEAT: a gold ring sweeping out from the patch's middle to its corners, every line it passes turned gold, then the sheet
//     lifted and let go (1.6 real s); a puzzle left unsolved fades out in 0.4.
// Every line is a fixed width in the frame's own pixels (its height's or its uv's screen derivative), a dark keyline round a light core
// so it reads on the pale sand at noon and on the dark at night, at the desk's lines and the phone's alike; nothing is thresholded,
// so nothing crawls (docs/CASEBOOK.md, the kilns' bands). No words: a world mark (the log says the rest).
// DRAWS: two (the sheet and its x-ray), 1,058 triangles each, one program for both (the ghost's own: a raise of one, warmed at boot).
//
// Prior art: the topographic map's contour lines (the Ordnance Survey's, a line every fixed rise), the sci-fi hologram table's
// scanned terrain (the scan band and the glow of Prometheus's and Halo's map rooms), Islands of Insight's Matchbox (the object to match
// shown beside your own), Populous's and From Dust's terrain read from above, and the AR building overlay (a site's planned volume over
// the real ground, green where the build matches, red where it does not).
//
//   const gh = new MimicryGhost(game)   gh.open(S)   (S: game.mimicry.S, the open puzzle: { at, F, fr: { start, target } })
//   gh.demo(on)   gh.turn()   gh.update(raw, F)   (F: the live field while open, null after)   gh.solve()   gh.leave()   gh.done
//   GHOST_LOOK   ghostMaterial({ xray })   prewarmGhost(scene) -> park (removes it)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime, mindTick } from '../labradorite.js';
import { MIMIC } from '../../progress/mimicry.js';

/** The numbers: a contour every `step` metres of change; the change under `still` is no change; the target's sheet `lift` metres over
 *  its ground; `ok` the error (m) inside which a cell reads as copied (gold from its first number, full at its second); `stray` the
 *  movement (m) of ground no change was asked of that reads as a stray stroke; the scan's period; the demonstration's strength; the
 *  solve's and the leave's times; how often the live field is read. */
export const GHOST_LOOK = { step: 0.2, still: [0.03, 0.07], lift: 0.05, ok: [0.35, 0.1], stray: [0.12, 0.3], scan: 3.2, demo: 0.6, solve: 1.6, leave: 0.4, read: 0.12 };
const G = GHOST_LOOK;

const VERT = /* glsl */`
attribute float aD; attribute vec2 aUV; attribute vec2 aNow;
uniform float uLift;
varying float vD; varying vec2 vUV; varying vec2 vNow; varying vec3 vW; varying vec3 vView;
void main() {
  vec3 p = position; p.y += uLift;
  vec4 w = modelMatrix * vec4(p, 1.0);
  vW = w.xyz; vView = normalize(cameraPosition - w.xyz); vD = aD; vUV = aUV; vNow = aNow;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const FRAG = /* glsl */`
uniform float uK, uXray, uT, uScan, uSolve, uStep, uHalf;
uniform vec2 uStill; uniform vec3 uMid;
varying float vD; varying vec2 vUV; varying vec2 vNow; varying vec3 vW; varying vec3 vView;
${LAB_GLSL}
// a line a fixed width in the frame's pixels where f crosses a whole number: its light core and its dark keyline round it
vec2 lineAt(float f) { float d = abs(fract(f - 0.5) - 0.5) / max(fwidth(f), 1e-4); return vec2(1.0 - smoothstep(0.45, 1.15, d), 1.0 - smoothstep(1.15, 2.4, d)); }
// the same where f crosses zero
vec2 zeroAt(float f) { float d = abs(f) / max(fwidth(f), 1e-4); return vec2(1.0 - smoothstep(0.45, 1.15, d), 1.0 - smoothstep(1.15, 2.4, d)); }
void main() {
  float ad = abs(vD), inside = smoothstep(uStill.x, uStill.y, ad);
  vec2 L = vec2(0.0);
  // the contours of the change asked (never its zero level, which would cover every flat cell), and the outline round it
  float f = vD / uStep;
  L = max(L, lineAt(f) * inside * smoothstep(0.35, 0.6, abs(f)));
  L = max(L, zeroAt(ad - 0.05) * smoothstep(0.0, 0.002, fwidth(ad)));
  // the patch's frame: corner brackets and a faint border
  vec2 q = min(vUV, 1.0 - vUV), qa = vec2(zeroAt(q.x).x, zeroAt(q.y).x), qh = vec2(zeroAt(q.x).y, zeroAt(q.y).y);
  float br = max(qa.x * step(q.y, 0.12), qa.y * step(q.x, 0.12)), brh = max(qh.x * step(q.y, 0.12), qh.y * step(q.x, 0.12));
  L = max(L, vec2(br, brh));
  float border = max(qa.x, qa.y) * 0.35;
  // the scan: a soft band corner to corner
  float diag = (vUV.x + vUV.y) * 0.5, s = fract((uT - uScan) / ${G.scan.toFixed(2)}) * 1.5 - 0.25, band = exp(-pow((diag - s) / 0.04, 2.0));
  // the colours: the film, gold where copied, ember where ground was moved that no change was asked of
  vec3 film = labSoft(labPhase(vW, vView)), gold = vec3(1.0, 0.62, 0.16), ember = vec3(1.0, 0.16, 0.05);
  vec3 c = mix(film, gold, vNow.x); c = mix(c, ember, vNow.y);
  // the solve's ring sweeping out from the middle, gold behind it
  float r = length(vW.xz - uMid.xz) / (uHalf * 1.4142), R = uSolve * 1.3;
  float ring = uSolve > 0.0 ? exp(-pow((r - R) / 0.05, 2.0)) : 0.0, behind = uSolve > 0.0 ? step(r, R) : 0.0;
  c = mix(c, gold, max(behind, ring));
  // the x-ray (what the ground hides): dashed and dimmed
  float dash = mix(1.0, step(0.45, fract((vW.x + vW.z) * 1.6)), uXray), dim = mix(1.0, 0.42, uXray);
  float aLine = max(L.y * 0.55, L.x) * dash, core = L.x * dash;
  float aFill = (inside * (0.1 + 0.2 * vNow.x) + 0.22 * vNow.y + band * 0.06 * inside + ring * 0.75 + border) * dim;
  vec3 lineCol = mix(LAB_INK, c * (1.15 + 0.9 * band), smoothstep(0.0, 1.0, core / max(aLine, 1e-3)));
  float a = aLine * dim + aFill * (1.0 - aLine);
  vec3 col = (lineCol * aLine * dim + c * (1.0 + band) * aFill * (1.0 - aLine)) / max(a, 1e-3);
  float fade = 1.0 - smoothstep(0.72, 1.0, uSolve);
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * uK * fade);
}`;

/** The ghost's material: the sheet (`xray` false: drawn where it is in front of the ground) or its x-ray (drawn where the ground
 *  hides it). One program for both: depth is the material's state, not its code. */
export function ghostMaterial({ xray = false } = {}) {
  return new THREE.ShaderMaterial({
    name: xray ? 'mimicry-ghost-xray' : 'mimicry-ghost',
    uniforms: {
      uK: { value: 0 }, uXray: { value: xray ? 1 : 0 }, uT: { value: 0 }, uScan: { value: 0 }, uSolve: { value: 0 }, uLift: { value: 0 },
      uStep: { value: G.step }, uHalf: { value: MIMIC.half }, uStill: { value: new THREE.Vector2(...G.still) }, uMid: { value: new THREE.Vector3() }, uMindT: mindTime,
    },
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: true,
    depthFunc: xray ? THREE.GreaterDepth : THREE.LessEqualDepth, side: THREE.DoubleSide, fog: false, forceSinglePass: true,
  });
}

/** A sheet of m x m vertices (a cell's middle each) at its heights `y[o]`, its change asked `d[o]`. */
function sheet(m, xz, y, d) {
  const N = m * m, pos = new Float32Array(N * 3), uv = new Float32Array(N * 2), now = new Float32Array(N * 2), idx = [];
  for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) {
    const o = j * m + i; pos[o * 3] = xz[o * 2]; pos[o * 3 + 1] = y[o]; pos[o * 3 + 2] = xz[o * 2 + 1];
    uv[o * 2] = i / (m - 1); uv[o * 2 + 1] = j / (m - 1);
    if (i < m - 1 && j < m - 1) idx.push(o, o + m, o + 1, o + 1, o + m, o + m + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aD', new THREE.BufferAttribute(new Float32Array(d), 1));
  geo.setAttribute('aUV', new THREE.BufferAttribute(uv, 2)); geo.setAttribute('aNow', new THREE.BufferAttribute(now, 2).setUsage(THREE.DynamicDrawUsage));
  geo.setIndex(idx); geo.computeBoundingSphere();
  return geo;
}
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export class MimicryGhost {
  constructor(game) { this.game = game; this.group = null; this.done = true; }

  /** The ghost laid over an open puzzle's patch: its target's heights and its change asked, cell for cell. */
  open(S) {
    this.dispose();
    const { at, F, fr } = S, T = fr.target, S0 = fr.start, m = T.m, c = MIMIC.cell, x0 = at.x - MIMIC.half, z0 = at.z - MIMIC.half;
    const N = m * m, xz = new Float32Array(N * 2), y = new Float32Array(N), d = new Float32Array(N), k = (this.cells = new Int32Array(N));
    const tot = (Sn, o) => Sn.firm[o] + Sn.loose[o] + Sn.w[o];
    this.tgt = new Float32Array(N); this.st0 = new Float32Array(N);
    for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) {
      const o = j * m + i, x = x0 + (i + 0.5) * c, z = z0 + (j + 0.5) * c, kk = F.cellAt(x, z);
      k[o] = kk; xz[o * 2] = x; xz[o * 2 + 1] = z;
      this.tgt[o] = tot(T, o); this.st0[o] = tot(S0, o);
      y[o] = (kk >= 0 ? F.base[kk] : at.y) + this.tgt[o] + G.lift; d[o] = this.tgt[o] - this.st0[o];
    }
    this.m = m; this.geo = sheet(m, xz, y, d);
    this.mats = [ghostMaterial(), ghostMaterial({ xray: true })];
    const grp = (this.group = new THREE.Group()); grp.name = 'mimicry-ghost'; grp.userData.zone = 'dunes';
    this.meshes = this.mats.map((mat, i) => { const me = new THREE.Mesh(this.geo, mat); me.name = mat.name; me.renderOrder = 6 + i; me.frustumCulled = false; grp.add(me); return me; });
    for (const mat of this.mats) mat.uniforms.uMid.value.set(at.x, at.y, at.z);
    this.game.scene?.add(grp);
    this.k = 0; this.want = S.demo ? G.demo : 1; this.solveT = -1; this.leaveT = -1; this.readT = 0; this.t = 0; this.done = false;
    this.read(F);
  }

  /** The demonstration running (the sheet at its dimmer strength) or over. */
  demo(on) { this.want = on ? G.demo : 1; }
  /** Your turn: the sheet up to full, and a scan sweeping it at once. */
  turn() { this.want = 1; for (const mat of this.mats || []) mat.uniforms.uScan.value = this.t + G.scan * 0.15; }

  /** The live field read into the sheet: gold where copied over a change asked, ember where ground was moved that none was asked of. */
  read(F) {
    if (!F || !this.geo) return;
    const A = this.geo.attributes.aNow, a = A.array, N = this.m * this.m;
    for (let o = 0; o < N; o++) {
      const kk = this.cells[o]; if (kk < 0) continue;
      const now = F.firm[kk] + F.loose[kk] + F.w[kk], asked = Math.abs(this.tgt[o] - this.st0[o]), ask = sm(G.still[0], G.still[1] + 0.05, asked);
      a[o * 2] = ask * sm(G.ok[0], G.ok[1], Math.abs(now - this.tgt[o]));
      a[o * 2 + 1] = (1 - ask) * sm(G.stray[0], G.stray[1], Math.abs(now - this.st0[o]));
    }
    A.needsUpdate = true;
  }

  /** The solve's beat: the ring swept out, then the sheet let go. */
  solve() { if (!this.done) { this.solveT = 0; this.want = 1; } }
  /** Left unsolved: faded out. */
  leave() { if (!this.done && this.solveT < 0) this.leaveT = 0; }

  update(raw, F) {
    if (this.done) return;
    mindTick(); this.t += raw;
    if (F && this.solveT < 0 && this.leaveT < 0 && (this.readT -= raw) <= 0) { this.readT = G.read; this.read(F); }
    this.k += (this.want - this.k) * Math.min(1, raw * 6);
    let solve = 0, lift = 0, k = this.k;
    if (this.solveT >= 0) { this.solveT += raw; solve = Math.min(1, this.solveT / G.solve); lift = 0.6 * sm(0.6, 1, solve); if (solve >= 1) { this.dispose(); return; } }
    if (this.leaveT >= 0) { this.leaveT += raw; k *= Math.max(0, 1 - this.leaveT / G.leave); if (this.leaveT >= G.leave) { this.dispose(); return; } }
    for (const mat of this.mats) { const U = mat.uniforms; U.uK.value = k; U.uT.value = this.t; U.uSolve.value = solve; U.uLift.value = lift; }
  }

  dispose() {
    if (this.group) this.game.scene?.remove(this.group);
    this.geo?.dispose(); for (const mat of this.mats || []) mat.dispose();
    this.group = this.geo = this.mats = this.meshes = null; this.done = true;
  }
}

/** The ghost's program compiled at boot: a 2 x 2 sheet in both its materials, parked 50 m down (boot/warmup.js); the returned
 *  function hides it, never disposes it, so its program lives while the game does and an open puzzle compiles nothing (the casebook's
 *  rules 17 and 18). */
export function prewarmGhost(scene) {
  const geo = sheet(2, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), new Float32Array(4), new Float32Array(4)), grp = new THREE.Group();
  const mats = [ghostMaterial(), ghostMaterial({ xray: true })];
  for (const mat of mats) { mat.uniforms.uK.value = 0.001; const me = new THREE.Mesh(geo, mat); me.frustumCulled = false; grp.add(me); }
  grp.position.set(0, -50, 0); grp.userData.zoneFree = true; scene.add(grp);
  return () => { grp.visible = false; };
}
