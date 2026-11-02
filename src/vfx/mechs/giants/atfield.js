// ---------------------------------------------------------------------------------------
// THE AT FIELD'S LOOK (plain name; ATFieldLook; docs/plans/MECHS.md 8.2 item 4, Dovina's note of 2026-11-02; South: "Neon Genesis
// Evangelion mixed with armored core"): a giant's barrier (Dovina's rules, progress/mechs/rules.js BARRIER; the runtime's shell,
// world/hangar/giant.js) drawn as Evangelion's AT Field in the film's colours, and your mech's barrier pressed into it.
//   THE SHELL     a sphere at the placeholder shell's place and size, mostly invisible: a faint hex net (triplanar on its own
//                 sphere, so the cells stay even), a fresnel rim and a slow shimmer band climbing it; the placeholder's yellow is hidden
//   A BLOW        a blow that stops on it (`mech.hit { blocked }`; a pierced one smaller) flares there: nested octagons rippling out
//                 from the point (Eva's octagonal AT Field), the hex cells round it lit, in the film's oil colours
//   YOUR FIELD    while your mech presses (the pilot's `pressing`) within reach (BARRIER.reach) of a holding barrier: your hex wall in
//                 your BODY glaze pressed onto its shell where it faces you (a cap of the sphere, a little outside it), both fields
//                 grinding at the contact (the cells jittering, sparks and hex chips thrown); pressed with nothing to press, your
//                 field round your frame in your glaze (the parts body's own yellow sphere hidden while it shows)
//   THE TEAR      `mech.barrier { neutralised: true }`: the shell torn open from the contact, cell by cell, its edge burning, hex
//                 shards thrown; gone while its downT runs; `neutralised: false` grows it back from the far side
// Looks only: the barrier's rules, its timers and the blows are Dovina's and Petra's; this reads them and draws.
// Prior art: Evangelion's AT Field (the orange octagons where a blow is stopped, two fields meeting and one torn open by the other at
// close range: episode 1's Sachiel, episode 5's Ramiel), the caster's bubble (vfx/caster/bubble.js: a hex net that rings where struck),
// the hex-shield of Halo's and Overwatch's barriers, the film's colours (vfx/oxidation.js FILM).
//
//   new ATFieldLook(game)  .update(dt, t, giant, pilot)  .dispose()   AT_FIELD (its numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { BARRIER } from '../../../progress/mechs/rules.js';
import { FILM } from '../../oxidation.js';
import { GLAZES, DEFAULT_LOOK } from '../../../courier/vessel/glazes.js';

/** The look's numbers: a blow's ripple speed (m/s) and life (real s), the hexes' size (cells round the sphere), the idle's faintness,
 *  your cap's angle (rad) and lift off the shell (m), the grind's spark rate (real s), the tear's and the regrowth's times. */
export const AT_FIELD = { speed: 16, life: 1.4, cells: 9, idle: 1, cap: 0.62, lift: 0.7, grind: 0.07, tear: 0.7, grow: 1.2, hits: 4 };
const N = AT_FIELD.hits;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _n = new THREE.Vector3(), _q = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);

const VERT = /* glsl */`
  varying vec3 vWP; varying vec3 vN; varying vec3 vO;
  void main() {
    vO = normalize(position);
    vec4 w = modelMatrix * vec4(position, 1.0); vWP = w.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const FRAG = /* glsl */`
  uniform float uTime, uK, uCells, uPress, uTear, uTearR, uOwn, uCap, uGrind;
  uniform vec3 uFilm[4]; uniform vec3 uTint; uniform vec3 uCentre;
  uniform vec3 uPC, uPT, uPB; uniform vec3 uTC;
  uniform vec3 uHC[${N}], uHT[${N}], uHB[${N}]; uniform float uHA[${N}], uHK[${N}];
  varying vec3 vWP; varying vec3 vN; varying vec3 vO;
  float hd(vec2 p) { p = abs(p); return max(dot(p, vec2(0.5, 0.8660254)), p.x); }
  vec3 hex(vec2 uv) { // (x: the edge's nearness 0 .. 0.5 at the heart; yz: the cell's id)
    vec2 r = vec2(1.0, 1.7320508), h = r * 0.5;
    vec2 a = mod(uv, r) - h, b = mod(uv - h, r) - h, g = dot(a, a) < dot(b, b) ? a : b;
    return vec3(0.5 - hd(g), uv - g);
  }
  float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float oct(vec2 q) { vec2 a = abs(q); return max(max(a.x, a.y), (a.x + a.y) * 0.70710678); }
  vec3 film(float t) { t = fract(t) * 4.0; int i = int(floor(t)); float f = fract(t);
    vec3 c0 = uFilm[0], c1 = uFilm[1]; if (i == 1) { c0 = uFilm[1]; c1 = uFilm[2]; } else if (i == 2) { c0 = uFilm[2]; c1 = uFilm[3]; } else if (i == 3) { c0 = uFilm[3]; c1 = uFilm[0]; }
    return mix(c0, c1, smoothstep(0.0, 1.0, f)); }
  void main() {
    vec3 d = normalize(vO), w = pow(abs(d), vec3(4.0)); w /= (w.x + w.y + w.z);
    vec2 jit = uGrind * vec2(sin(uTime * 41.0 + d.y * 30.0), cos(uTime * 37.0 + d.x * 30.0)) * 0.04;
    vec3 hx = hex(d.yz * uCells + jit), hy = hex(d.zx * uCells + jit), hz = hex(d.xy * uCells + jit);
    float e = hx.x * w.x + hy.x * w.y + hz.x * w.z;
    vec2 id = w.x > w.y && w.x > w.z ? hx.yz : (w.y > w.z ? hy.yz + 7.0 : hz.yz + 13.0);
    float rnd = h21(id), line = 1.0 - smoothstep(0.015, 0.075, e);
    vec3 V = normalize(cameraPosition - vWP), Nn = normalize(vN);
    float fr = pow(1.0 - abs(dot(Nn, V)), 3.0);
    // idle: the net barely there, the rim, a shimmer band climbing it
    float band = exp(-pow((d.y - (fract(uTime * 0.12) * 2.6 - 1.3)) * 5.0, 2.0));
    float a = (0.05 * line + 0.10 * fr + 0.22 * band * line) * uK;
    vec3 col = film(rnd * 0.3 + d.y * 0.4 + uTime * 0.05) * (0.9 + 0.6 * line);
    // the blows: nested octagons rippling out from each point, the cells round it lit
    for (int i = 0; i < ${N}; i++) {
      float ag = uHA[i]; if (ag < 0.0) continue;
      vec3 rel = vWP - uHC[i]; vec3 nh = normalize(cross(uHT[i], uHB[i]));
      float front = smoothstep(-0.1, 0.4, dot(Nn, nh));
      float o = oct(vec2(dot(rel, uHT[i]), dot(rel, uHB[i])));
      float R = ag * ${AT_FIELD.speed.toFixed(1)}, fade = exp(-ag * 2.6) * uHK[i] * front;
      float rings = 0.0; for (int k = 0; k < 3; k++) { float rr = R - float(k) * 1.8; rings += step(0.0, rr) * exp(-pow((o - rr) / 0.45, 2.0)) * (1.0 - float(k) * 0.25); }
      float glow = rings + line * exp(-o / (2.5 + R)) * 1.4 + exp(-o * 0.5) * exp(-ag * 7.0) * 2.0;
      a += glow * fade; col = mix(col, film(o * 0.06 - ag * 0.8 + 0.1) * 2.2, clamp(glow * fade, 0.0, 1.0));
    }
    // the press: your field grinding on it at the contact (the cells there lit and flickering, rings drawn in)
    if (uPress > 0.0) {
      vec3 rel = vWP - uPC; float o = oct(vec2(dot(rel, uPT), dot(rel, uPB)));
      float front = smoothstep(-0.1, 0.4, dot(Nn, normalize(cross(uPT, uPB))));
      float flick = 0.5 + 0.5 * sin(rnd * 40.0 + uTime * 23.0);
      float g = (line * flick * 1.2 + exp(-pow(fract(o * 0.18 + uTime * 1.6) - 0.5, 2.0) * 60.0) * 0.8) * exp(-o / 7.0) * uPress * front;
      a += g; col = mix(col, (uOwn > 0.5 ? uTint : film(o * 0.05 + uTime * 0.3)) * 2.0, clamp(g, 0.0, 1.0));
    }
    // your own field: in your glaze, its cap's edge soft
    if (uOwn > 0.5) { col = mix(col, uTint * (1.2 + line), 0.85); if (uCap > 0.0) a *= smoothstep(uCap, uCap + 0.12, d.y); }
    // the tear: cells gone from the contact outward, the edge burning
    if (uTear > 0.0) {
      float dist = length(vWP - uTC) / max(1.0, uTearR * 2.0) + rnd * 0.22;
      float cut = uTear * 1.25; if (dist < cut) discard;
      float edge = exp(-(dist - cut) * 28.0);
      a += edge * 1.6 * (0.4 + line); col = mix(col, film(rnd + uTime) * 2.6, clamp(edge, 0.0, 1.0));
    }
    if (a < 0.004) discard;
    gl_FragColor = vec4(col, clamp(a, 0.0, 0.9));
  }`;

function fieldMaterial() {
  const u = {
    uTime: { value: 0 }, uK: { value: 1 }, uCells: { value: AT_FIELD.cells }, uPress: { value: 0 }, uTear: { value: 0 }, uTearR: { value: 12 },
    uOwn: { value: 0 }, uCap: { value: 0 }, uGrind: { value: 0 }, uFilm: { value: FILM.map((c) => new THREE.Vector3(...c)) },
    uTint: { value: new THREE.Vector3(1, 1, 1) }, uCentre: { value: new THREE.Vector3() },
    uPC: { value: new THREE.Vector3() }, uPT: { value: new THREE.Vector3(1, 0, 0) }, uPB: { value: new THREE.Vector3(0, 1, 0) }, uTC: { value: new THREE.Vector3() },
    uHC: { value: Array.from({ length: N }, () => new THREE.Vector3()) }, uHT: { value: Array.from({ length: N }, () => new THREE.Vector3(1, 0, 0)) },
    uHB: { value: Array.from({ length: N }, () => new THREE.Vector3(0, 1, 0)) }, uHA: { value: new Array(N).fill(-1) }, uHK: { value: new Array(N).fill(1) },
  };
  return new THREE.ShaderMaterial({ name: 'giant.atfield', uniforms: u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
}
/** A tangent frame at a point on a sphere about `centre`: its two axes into t and b. */
function frameAt(p, centre, t, b) { _n.subVectors(p, centre).normalize(); t.crossVectors(Math.abs(_n.y) > 0.9 ? _a.set(1, 0, 0) : UP, _n).normalize(); b.crossVectors(_n, t).normalize(); }

export class ATFieldLook {
  constructor(game) {
    this.game = game; this.giant = null; this.hitI = 0; this.tear = 0; this.tearDir = 0; this.grindT = 0; this.press = 0;
    const geo = this.geo = new THREE.SphereGeometry(1, 48, 32);
    this.mat = fieldMaterial(); this.shell = new THREE.Mesh(geo, this.mat); this.shell.name = 'giant.atfield'; this.shell.renderOrder = 7; this.shell.frustumCulled = false;
    this.ownMat = fieldMaterial(); this.ownMat.uniforms.uOwn.value = 1; this.ownMat.uniforms.uCells.value = AT_FIELD.cells * 1.4;
    this.own = new THREE.Mesh(geo, this.ownMat); this.own.name = 'mech.atfield'; this.own.renderOrder = 8; this.own.frustumCulled = false; this.own.visible = false;
    game.scene?.add(this.own);
    this.off = [
      game.events?.on?.('mech.hit', (e) => { if (e?.blocked || e?.pierced) this.blow(e.blocked ? 1 : 0.5); }),
      game.events?.on?.('mech.barrier', (e) => { if (e?.neutralised === true) this.torn(); else if (e?.neutralised === false) this.tearDir = -1; }),
    ];
  }
  /** Your glaze (the vessel's BODY), as a colour lifted toward light. */
  glaze() { const V = this.game.vessel, id = V?.look?.body ?? DEFAULT_LOOK.body, g = V?.glaze?.(id) ?? GLAZES[id] ?? GLAZES[DEFAULT_LOOK.body]; const c = new THREE.Color(g?.color ?? 0x6f8fe0); return c.lerp(new THREE.Color(1, 1, 1), 0.15); }
  centre(out) { return this.shell.getWorldPosition(out); }
  radius() { return this.shell.scale.x; }
  /** Where your mech meets its shell (on the line from its centre to your chest). */
  contact(pilot, out) { const c = this.centre(_c); _a.copy(pilot.pos).setY(pilot.pos.y + 8).sub(c).normalize(); return out.copy(c).addScaledVector(_a, this.radius()); }

  /** A blow stopped on the shell: a ripple where it faces your mech. */
  blow(k) {
    const P = this.game.hangar?.pilot; if (!this.giant || !P || !this.shell.visible) return;
    const U = this.mat.uniforms, i = this.hitI++ % N, p = this.contact(P, _b);
    p.y += (Math.random() - 0.5) * 3; // (a little up or down the shell: blows land where they land)
    U.uHC.value[i].copy(p); frameAt(p, this.centre(_c), U.uHT.value[i], U.uHB.value[i]); U.uHA.value[i] = 0; U.uHK.value[i] = k;
    try { this.game.vfx?.play('giant.field.hit', { pos: p, scale: k }); } catch { /* (headless) */ }
  }
  torn() {
    const P = this.game.hangar?.pilot; if (!this.giant) return;
    const p = P ? this.contact(P, _b) : this.centre(_b);
    this.mat.uniforms.uTC.value.copy(p); this.tearDir = 1; this.tear = Math.max(this.tear, 0.001);
    try { this.game.vfx?.play('giant.field.tear', { pos: p, scale: 1.4 }); this.game.vfx?.play('giant.field.hit', { pos: p, scale: 2 }); } catch { /* (headless) */ }
  }

  /** One frame: the shell kept on the placeholder's (hidden), its blows aged, the press and the tear stepped, your field placed. */
  update(dt, t, giant, pilot) {
    const U = this.mat.uniforms, O = this.ownMat.uniforms;
    if (giant !== this.giant) {
      this.shell.removeFromParent(); this.giant = giant; this.tear = 0; this.tearDir = 0;
      if (giant?.shell) { giant.shell.parent.add(this.shell); }
    }
    U.uTime.value = O.uTime.value = t;
    for (let i = 0; i < N; i++) if (U.uHA.value[i] >= 0) { U.uHA.value[i] += dt; if (U.uHA.value[i] > AT_FIELD.life) U.uHA.value[i] = -1; }
    let pressing = false;
    if (giant?.shell) {
      const S = giant.shell; if (giant.mats?.barrier) giant.mats.barrier.visible = false;
      this.shell.position.copy(S.position); const R = S.geometry?.parameters?.radius ?? 12; this.shell.scale.setScalar(R); U.uTearR.value = R;
      const holds = giant.barrier?.downT <= 0 && giant.down <= 0 && giant.G?.barrier !== false;
      // the tear: run to 1 at the fall and held while down, back to 0 as it rises
      if (this.tearDir > 0) this.tear = Math.min(1, this.tear + dt / AT_FIELD.tear);
      else if (this.tearDir < 0 || (holds && this.tear > 0)) { this.tear = Math.max(0, this.tear - dt / AT_FIELD.grow); if (this.tear <= 0) this.tearDir = 0; }
      if (holds && this.tearDir > 0 && this.tear >= 1) this.tearDir = -1; // (risen again with no word: grow back)
      U.uTear.value = this.tear;
      this.shell.visible = (holds || this.tear > 0) && this.tear < 1 && giant.group?.visible !== false;
      U.uK.value = AT_FIELD.idle * (0.6 + 0.4 * (giant.barrier?.up ?? 1));
      // your press on it
      const near = pilot && pilot.mode === 'pilot' && Math.hypot(pilot.pos.x - giant.pos.x, pilot.pos.z - giant.pos.z) <= BARRIER.reach;
      pressing = !!(pilot?.pressing && near && holds);
    }
    this.press += ((pressing ? 1 : 0) - this.press) * Math.min(1, dt * 6);
    U.uPress.value = this.press; U.uGrind.value = this.press;
    const tint = this.glaze(); O.uTint.value.set(tint.r, tint.g, tint.b);
    if (this.press > 0.01 && this.shell.visible) {
      const p = this.contact(pilot, _b), c = this.centre(_c);
      U.uPC.value.copy(p); frameAt(p, c, U.uPT.value, U.uPB.value);
      O.uPC.value.copy(p); O.uPT.value.copy(U.uPT.value); O.uPB.value.copy(U.uPB.value); O.uPress.value = this.press; O.uGrind.value = this.press;
      this.own.position.copy(c); this.own.scale.setScalar(this.radius() + AT_FIELD.lift);
      this.own.quaternion.setFromUnitVectors(UP, _a.subVectors(p, c).normalize()); O.uCap.value = Math.cos(AT_FIELD.cap);
      O.uK.value = 2.2 * this.press; this.own.visible = true;
      this.grindT -= dt;
      if (this.grindT <= 0 && pressing) {
        this.grindT = AT_FIELD.grind;
        frameAt(p, c, _a, _n); const q = _c.copy(p).addScaledVector(_a, (Math.random() - 0.5) * 9).addScaledVector(_n, (Math.random() - 0.5) * 9);
        try { this.game.vfx?.play('giant.field.grind', { pos: q, dir: _b.copy(pilot.pos).sub(q).setY(0).normalize(), tint: tint.getHex() }); } catch { /* (headless) */ }
      }
      if (pilot.mech?.barrier) pilot.mech.barrier.visible = false;
    } else if (pilot?.pressing && pilot.mech?.barrier) {
      // pressed with nothing to press: your field round your frame
      const M = pilot.mech.barrier; M.visible = false; M.getWorldPosition(this.own.position);
      this.own.scale.setScalar(M.geometry?.parameters?.radius ?? 9); this.own.quaternion.identity();
      O.uCap.value = 0; O.uPress.value = 0; O.uGrind.value = 0; O.uK.value = 1.6; this.own.visible = true;
    } else this.own.visible = false;
  }
  dispose() { for (const f of this.off) if (typeof f === 'function') f(); this.shell.removeFromParent(); this.own.removeFromParent(); this.geo.dispose(); this.mat.dispose(); this.ownMat.dispose(); }
}
