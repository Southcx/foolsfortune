// ---------------------------------------------------------------------------------------
// THE MAW WIPE: the seam into a Well covered (the owner: entering a Well lagged; Dovina's: "a descent through the maw"). The Great
// Dunemaw's own pool (vfx/dunemaw.js: ink, the labradorite's arms wound inward, an iridescent lip) opens from the middle of the view
// until it fills it, turns while the floor is built behind it, then its eye widens and lets the floor through. A loading screen with no
// words, and diegetic: you go down the thing you stepped into.
//
// It is drawn in the frame, inside the 480 lines, over the world and under the HUD (Petra's ruling): one full-screen quad, last in the
// scene, its pool painted in the shader (the same arms and the same labradorite as the mouth). The seam (render/seam.js) times it:
// close, the floor changed under it, two drawn frames held, open. A floor builds in a frame now, so the turn never has to outlast a stall.
// Nothing flickers: one slow turn, two eased irises.
//
// Prior art: the iris wipe (silent film, Looney Tunes, Mario's star wipe), the swirl transition into battle of the sixth-generation
// RPGs (Final Fantasy X's shattering, Dragon Quest's spiral), and Okami's ink-swallow into another place.
//
//   game.mawWipe = new MawWipe(game)   .close(onCovered)  (about 0.6 s; calls back once the view is covered; false, and nothing, while one waits)   .open()  (about 0.7 s)
//   .update(rawDt)  (each frame, before the draw)   .covered   .active
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL } from './labradorite.js';

const CLOSE = 0.6, OPEN = 0.7;
const ease = (x) => x * x * (3 - 2 * x);

export class MawWipe {
  constructor(game) {
    this.game = game;
    this.u = { uT: { value: 0 }, uMindT: { value: 0 }, uClose: { value: 0 }, uHole: { value: 0 }, uAspect: { value: 1 } };
    this.mesh = null; // (made the first time it closes: nothing compiled for a session that never goes down a Well)
    this.k = 0; this.dir = 0; this.mode = null; this.cb = null; this.t = 0;
  }

  make() {
    const m = new THREE.ShaderMaterial({ name: 'maw-wipe',
      uniforms: this.u, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false,
      vertexShader: 'varying vec2 vS; void main() { vS = position.xy; gl_Position = vec4(position.xy, 0.0, 1.0); }', // (the whole view, whatever the camera)
      fragmentShader: `varying vec2 vS; uniform float uT, uClose, uHole, uAspect;
${LAB_GLSL}
void main() {
  vec2 p = vS * vec2(uAspect, 1.0) / max(uAspect, 1.0);          // (round in the view: 1 at the long edge)
  float r = length(p) * 0.62, a = atan(p.y, p.x);                  // (the pool a little larger than the view: its lip just past the corners)
  if (r > uClose) discard;                                         // (closing: a disc of the pool grows from the middle)
  float hole = smoothstep(uHole - 0.02, uHole + 0.02, r);         // (opening: its eye widens to a hole the floor shows through)
  if (hole <= 0.0) discard;
  float arm = 0.5 + 0.5 * sin(a * 3.0 + log(max(r, 0.02)) * 7.0 + uT * 1.4);
  float arms = smoothstep(0.6, 0.95, arm) * smoothstep(0.04, 0.35, r);
  vec3 col = mix(LAB_INK, labSoft(a * 0.16 + r * 0.6) * 0.9, arms * 0.85);
  float lip = smoothstep(0.82, 0.93, r) * (1.0 - smoothstep(0.93, 1.0, r));
  col = mix(col, labradorite(a * 0.16 + 0.3) * 1.2, lip * 0.9);
  col *= 0.12 + 0.88 * smoothstep(0.0, 0.6, r);                    // (the depth, painted: darker toward the eye)
  float edge = 1.0 - smoothstep(uClose - 0.015, uClose, r);         // (the closing disc's rim, soft by a hair)
  gl_FragColor = vec4(col, edge * hole);
  #include <colorspace_fragment>
}`,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 10000; this.mesh.visible = false; this.mesh.userData.zoneFree = true;
    this.game.scene?.add(this.mesh);
  }
  get covered() { return this.mode === 'close' && this.k >= 1; }
  get active() { return !!this.mesh?.visible; }

  /** The pool opens from the middle until it fills the view; then `onCovered` (the place changes behind it). */
  close(onCovered) {
    if (this.cb) return false; // (one passage at a time: a second close while the first waits would drop its callback, and the seam would stay busy for good)
    if (!this.mesh) this.make(); this.cb = onCovered || null; this.mode = 'close'; this.dir = 1; this.k = 0; this.mesh.visible = true; return true;
  }
  /** Its eye widens and lets the new place through; then it is gone. */
  open() { if (!this.mesh) this.make(); this.mode = 'open'; this.dir = -1; this.k = 1; this.mesh.visible = true; }

  update(dt) {
    if (!this.mesh?.visible) return;
    dt = Math.min(dt, 0.1); // (a stalled frame does not jump the iris)
    this.t += dt; this.u.uT.value = this.t; this.u.uMindT.value = this.t;
    const c = this.game.camera; if (c) this.u.uAspect.value = c.aspect || 1;
    this.k = THREE.MathUtils.clamp(this.k + (this.dir > 0 ? dt / CLOSE : -dt / OPEN), 0, 1);
    const e = ease(this.k);
    if (this.mode === 'close') { this.u.uClose.value = e * 1.02; this.u.uHole.value = -1; }
    else { this.u.uClose.value = 2; this.u.uHole.value = (1 - e) * 1.02; }
    if (this.mode === 'close' && this.k >= 1 && this.cb) { const cb = this.cb; this.cb = null; cb(); } // (covered: held, still turning, until open())
    if (this.mode === 'open' && this.k <= 0) { this.mesh.visible = false; this.mode = null; }
  }

  dispose() { if (!this.mesh) return; this.mesh.parent?.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}
