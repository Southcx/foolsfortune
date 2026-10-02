// ---------------------------------------------------------------------------------------
// THE RING AT HER FEET: the Courier's Lachryma and what has noticed her, drawn on the ground round her, in the world, with no words
// and no numbers (docs/LOOK.md, the 3D HUD). It is the always-on gauge; the Lachrimeter panel steps forward only while the Lachryma
// is moving (hud.js).
//
//   THE POOL      a band of Lachryma itself (matter, never line: near-black liquid with its oil-film sheen) filling the ring from the
//                 near side (her body never hides it), clockwise on the screen, as far as she has it; what is held for a charge runs
//                 on after it, paler
//   THE FRAME     the band is held between two fine labradorite lines (the Mind's: vfx/labradorite.js)
//   THE BEADS     the Blink's charges, as beads of Lachryma set in the frame before the band begins (an empty socket when spent)
//   THREAT ARCS   outside the frame, an arc toward each creature that has noticed her, as wide as it is aware of her, cool (blue) far
//                 off and hot (copper) close: Zone of the Enders' ring radar on the frame itself
//
// It brightens while something is happening (the pool moving, a threat near) and sinks to a faint ring when all is full and still.
// Everything in it moves by easing; nothing blinks.
//
// Prior art: Zone of the Enders' ring radar (round the mech, threat by direction and colour), Dead Space's spine gauge (the gauge on the
// body), Metal Gear Solid's alert, and Parasite Eve's and Vagrant Story's floor-borne wireframes.
//
//   const ring = new HudRing(game)      ring.update(dt, { blink })      ring.visible = false (first person, cinematics)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime, mindTick } from './labradorite.js';

const MAX_THREATS = 6;
const RADIUS = 0.85; // metres, the ring's outer edge

const V = /* glsl */`
varying vec2 vP; varying vec3 vW;
void main() {
  vP = position.xy; // (the ring is built flat in xy and laid down by its object's rotation: local x is world x, local y is world -z)
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const F = /* glsl */`
varying vec2 vP; varying vec3 vW;
uniform float uFill, uRes, uAlpha, uStart, uSign;
uniform vec3 uBeads;                  // count, max, the next one's fill
uniform vec4 uThreat[${MAX_THREATS}];  // angle, half-width, heat (0 far .. 1 close), alpha
${LAB_GLSL}
float band(float r, float a, float b) { float w = fwidth(r) * 1.2; return smoothstep(a - w, a + w, r) * (1.0 - smoothstep(b - w, b + w, r)); }
float line(float r, float at) { float w = fwidth(r); return 1.0 - smoothstep(0.4 * w, 1.6 * w, abs(r - at)); }
void main() {
  float r = length(vP);
  float a = atan(-vP.y, vP.x);                                 // (the world angle on the ground: atan(z, x))
  float d = mod(uSign * (a - uStart) + 6.2831853, 6.2831853) / 6.2831853; // 0..1 round the ring from the near side, clockwise on screen
  vec3 view = normalize(cameraPosition - vW);
  float ph = labPhase(vW, view) + 0.15 * d;
  vec4 col = vec4(0.0);
  // the band of Lachryma: liquid as far as she has it, paler for what is held, the empty rest barely there
  float b = band(r, 0.72, 0.84);
  if (b > 0.0) {
    float fw = fwidth(d) * 1.5;
    float liquid = 1.0 - smoothstep(uFill - fw, uFill + fw, d);
    float held = (1.0 - smoothstep(uFill + uRes - fw, uFill + uRes + fw, d)) - liquid;
    vec3 oil = labInk(ph * 2.3 + r * 3.0, 0.22 + 0.4 * pow(1.0 - abs(view.y), 2.0)); // (near-black, the oil film in streaks)
    vec3 c = oil * liquid + mix(oil, labLin(vec3(0.8, 0.74, 0.86)), 0.6) * held + labLin(vec3(0.12, 0.1, 0.16)) * (1.0 - liquid - held);
    col = vec4(c, b * (0.9 * liquid + 0.75 * held + 0.18 * (1.0 - liquid - held)));
  }
  // the frame: two fine lines of the Mind
  float fr = max(line(r, 0.7), line(r, 0.86));
  col = mix(col, vec4(labSoft(ph), 1.0), fr * 0.85);
  // the beads (the Blink's charges), just before the band begins, set in the frame
  for (int i = 0; i < 3; i++) {
    if (float(i) >= uBeads.y) break;
    float ba = uStart - uSign * (0.17 + 0.2 * float(i));     // (counter-clockwise from the band's start: before it)
    vec2 c = vec2(cos(ba), -sin(ba)) * 0.78;
    float dd = length(vP - c);
    float rr = 0.075;
    float disc = 1.0 - smoothstep(rr - fwidth(dd), rr + fwidth(dd), dd);
    float have = float(i) < uBeads.x ? 1.0 : (float(i) < uBeads.x + 1.0 ? uBeads.z : 0.0);
    vec3 bead = labInk(ph + 0.4 + dd * 3.0, 0.5 + 0.5 * (1.0 - dd / rr));
    vec3 socket = labLin(vec3(0.16, 0.13, 0.2));
    // (a socket fills from the bottom as the charge comes back)
    float filled = step((c.y - vP.y) / (2.0 * rr) + 0.5, have) ;
    vec3 bc = mix(socket, bead, max(filled, step(1.0, have)));
    float ringEdge = 1.0 - smoothstep(0.0, fwidth(dd) * 1.5, abs(dd - rr));
    col = mix(col, vec4(mix(bc, labSoft(ph), ringEdge * 0.7), 1.0), max(disc, ringEdge));
  }
  // the threat arcs, outside the frame
  for (int i = 0; i < ${MAX_THREATS}; i++) {
    vec4 t = uThreat[i];
    if (t.w <= 0.0) continue;
    float da = abs(mod(a - t.x + 3.1415927, 6.2831853) - 3.1415927);
    float arc = (1.0 - smoothstep(t.y * 0.8, t.y, da)) * band(r, 0.9, 0.97);
    vec3 hot = mix(labradorite(0.3), labradorite(0.93), t.z);
    col = mix(col, vec4(hot * (1.0 + 0.5 * t.z), 1.0), arc * t.w);
  }
  gl_FragColor = vec4(col.rgb, col.a * uAlpha);
}`;

const _f = new THREE.Vector3(), _r = new THREE.Vector3();

export class HudRing {
  constructor(game) {
    this.game = game;
    const threats = Array.from({ length: MAX_THREATS }, () => new THREE.Vector4());
    this.u = {
      uFill: { value: 1 }, uRes: { value: 0 }, uAlpha: { value: 0 }, uStart: { value: 0 }, uSign: { value: 1 },
      uBeads: { value: new THREE.Vector3(0, 0, 0) }, uThreat: { value: threats }, uMindT: mindTime,
    };
    this.mesh = new THREE.Mesh(new THREE.RingGeometry(0.55, 1.0, 96, 1), new THREE.ShaderMaterial({
      uniforms: this.u, vertexShader: V, fragmentShader: F, transparent: true, depthWrite: false, fog: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }));
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.scale.setScalar(RADIUS);
    this.mesh.renderOrder = 6; this.mesh.frustumCulled = false;
    game.scene.add(this.mesh);
    this.visible = true;
    this.fill = 1; this.res = 0; this.alpha = 0; this.busy = 0; this.last = -1;
    this.threats = threats.map(() => ({ a: 0, w: 0, heat: 0, k: 0 }));
  }

  update(dt, { blink = null } = {}) {
    const g = this.game, P = g.player, pool = g.lachryma, cam = g.camera;
    mindTick();
    const show = this.visible && !(P.fpWeight > 0.5) && !g.god?.controlling;
    // the pool, eased (it is liquid)
    const fill = pool ? pool.available / pool.max : 1, res = pool ? pool.reserved / pool.max : 0;
    this.fill += (fill - this.fill) * (1 - Math.exp(-dt * 10));
    this.res += (res - this.res) * (1 - Math.exp(-dt * 10));
    if (Math.abs(fill - this.last) > 0.001 || res > 0) { this.last = fill; this.busy = 3; }
    this.busy = Math.max(0, this.busy - dt);
    // what has noticed her: the creatures whose minds hold her (ai/memory.js), nearest first
    const near = [];
    for (const c of g.creatures?.list || []) {
      if (!c.alive || c.ally) continue;
      const f = c.mem?.fact?.(P);
      const aware = f?.aware ?? 0;
      if (aware < 0.2) continue;
      const dx = c.pos.x - P.pos.x, dz = c.pos.z - P.pos.z, dist = Math.hypot(dx, dz);
      if (dist > 45 || Math.abs(c.pos.y - P.pos.y) > 10) continue;
      near.push({ a: Math.atan2(dz, dx), aware, heat: THREE.MathUtils.clamp(1 - (dist - 3) / 25, 0, 1) });
    }
    near.sort((x, y) => y.heat - x.heat);
    for (let i = 0; i < MAX_THREATS; i++) {
      const t = this.threats[i], n = near[i];
      const want = n ? Math.min(1, 0.4 + n.aware * 0.6) : 0;
      if (n) {
        // (turn toward it the short way round, so an arc slides rather than jumps)
        const da = Math.atan2(Math.sin(n.a - t.a), Math.cos(n.a - t.a));
        t.a = t.k < 0.02 ? n.a : t.a + da * (1 - Math.exp(-dt * 8));
        t.w = 0.18 + 0.32 * n.aware; t.heat += (n.heat - t.heat) * (1 - Math.exp(-dt * 4));
      }
      t.k += (want - t.k) * (1 - Math.exp(-dt * (want > t.k ? 6 : 2.5)));
      this.u.uThreat.value[i].set(t.a, t.w, t.heat, t.k);
      if (t.k > 0.3) this.busy = Math.max(this.busy, 1);
    }
    const want = show ? (this.busy > 0 || fill < 0.999 ? 0.95 : 0.45) : 0;
    this.alpha += (want - this.alpha) * (1 - Math.exp(-dt * (want > this.alpha ? 6 : 2)));
    this.mesh.visible = this.alpha > 0.01;
    if (!this.mesh.visible) return;
    // where she stands, and which way is "up the screen" on the ground (the band starts at the far side and runs clockwise on screen)
    this.mesh.position.set(P.renderPos.x, P.renderPos.y + 0.04, P.renderPos.z);
    cam.getWorldDirection(_f); _f.y = 0; if (_f.lengthSq() < 1e-6) _f.set(0, 0, -1); _f.normalize();
    _r.set(-_f.z, 0, _f.x); // (the camera's right, on the ground)
    const aF = Math.atan2(_f.z, _f.x), aR = Math.atan2(_r.z, _r.x);
    this.u.uStart.value = aF + Math.PI; // (from the near side, which her body never hides, clockwise on the screen)
    this.u.uSign.value = Math.sin(aR - aF) > 0 ? 1 : -1;
    this.u.uFill.value = this.fill; this.u.uRes.value = this.res;
    this.u.uBeads.value.set(blink ? blink.n : 0, blink ? blink.max : 0, blink ? blink.fill : 0);
    this.u.uAlpha.value = this.alpha;
  }
}
