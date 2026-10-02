// ---------------------------------------------------------------------------------------
// THE PSYCHIC PULSE: a sounding as a thing in the world. From a point (the lure, wherever it is: on the surface, ten metres down) a
// shell of light grows out to a radius: a sphere with a bright rim and a few fixed meridians and parallels, so it reads as a volume
// from outside, plus a ring that always faces the camera at the shell's edge (it reads from inside too, and it is the "billboard"
// part). Where the shell crosses something that lives (a fish) a small blip opens and fades: what it touches, it lights.
//
// Prior art: Horizon Zero Dawn's Focus pulse and Subnautica's sonar (an expanding sphere that marks what it passes), the scan pulse
// of Metroid Prime's visor. The shell grows (it is the motion); nothing on it scrolls or shimmers.
//
//   game.pulse.emit(pos, radius, color, { life })     game.pulse.blip(pos, color, size)     game.pulse.update(dt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime, mindTick } from './labradorite.js';

const SHELL_V = 'varying vec3 vN, vV, vP, vW; void main() { vP = position; vW = (modelMatrix * vec4(position, 1.0)).xyz; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }';
// (a sounding is the Mind's: the shell is labradorite, leaning to the colour of whatever sent it out)
const SHELL_F = `uniform vec3 uColor; uniform float uA;
varying vec3 vN, vV, vP, vW;
${LAB_GLSL}
void main() {
  float ndv = abs(dot(normalize(vN), normalize(vV)));
  float rim = pow(1.0 - ndv, 1.7);
  vec3 p = normalize(vP);
  float lat = abs(fract(asin(clamp(p.y, -1.0, 1.0)) * 3.8197) - 0.5);
  float lon = abs(fract(atan(p.z, p.x) * 1.9099) - 0.5);
  float w = 0.02 + 0.5 * fwidth(lat);
  float grid = max(1.0 - smoothstep(0.0, w * 2.2, lat), 1.0 - smoothstep(0.0, w * 2.2 / max(0.35, sqrt(1.0 - p.y * p.y)), lon));
  // (seen from inside, as the Courier mostly does, the rim is thin: the lattice carries the shell then)
  float a = uA * (0.06 + 0.9 * rim + grid * (0.15 + 0.35 * (1.0 - ndv)));
  vec3 c = mix(labSoft(labPhase(vW, normalize(cameraPosition - vW))), uColor, 0.45);
  gl_FragColor = vec4(c * (0.75 + 0.8 * rim), a);
}`;

export class PsychicPulse {
  constructor(game) {
    this.game = game;
    this.shellGeo = new THREE.IcosahedronGeometry(1, 3);
    this.ringGeo = new THREE.RingGeometry(0.985, 1, 72);
    this.cutGeo = new THREE.RingGeometry(0.975, 1, 96).rotateX(-Math.PI / 2);
    this.pulses = [];
    this.blips = [];
    this.haloTex = game.fx.haloTexture;
  }

  /** A pulse from `pos`: grows to `radius` over `life`, easing out. */
  emit(pos, radius, color = 0xffb27a, { life = 1.9, depthTest = true, surfaceY = null } = {}) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uA: { value: 1 }, uMindT: mindTime },
      vertexShader: SHELL_V, fragmentShader: SHELL_F, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false, depthTest,
    });
    const shell = new THREE.Mesh(this.shellGeo, mat);
    shell.renderOrder = 8; shell.frustumCulled = false;
    const ring = new THREE.Mesh(this.ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    ring.renderOrder = 9; ring.frustumCulled = false;
    shell.position.copy(pos); ring.position.copy(pos);
    this.game.scene.add(shell, ring);
    // where the shell meets a water surface: a flat ring, so that a pulse from deep down still reads on the water above it
    let cut = null;
    if (surfaceY != null) {
      cut = new THREE.Mesh(this.cutGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
      cut.renderOrder = 8; cut.frustumCulled = false; cut.position.set(pos.x, surfaceY + 0.04, pos.z); cut.visible = false;
      this.game.scene.add(cut);
    }
    const p = { shell, ring, cut, dy: surfaceY != null ? pos.y - surfaceY : 0, mat, t: 0, life, R: radius, pos: pos.clone() };
    this.pulses.push(p);
    return p;
  }

  /** Where a pulse's edge is now (for whatever it should be lighting). */
  radiusOf(p) { const u = Math.min(1, p.t / p.life); return p.R * (1 - Math.pow(1 - u, 3)); }

  /** A small opening ring where the pulse meets something. */
  blip(pos, color = 0xffffff, size = 1) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.haloTex, color, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    s.renderOrder = 31; s.position.copy(pos);
    this.game.scene.add(s);
    this.blips.push({ s, t: 0, life: 0.9, size });
  }

  update(dt) {
    const cam = this.game.camera;
    if (this.pulses.length) mindTick();
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.t += dt;
      const u = p.t / p.life;
      if (u >= 1) { this.dropPulse(p); this.pulses.splice(i, 1); continue; }
      const r = Math.max(0.01, this.radiusOf(p));
      const a = Math.pow(1 - u, 1.4) * Math.min(1, u * 14 + 0.2);
      p.shell.scale.setScalar(r); p.mat.uniforms.uA.value = a;
      p.ring.scale.setScalar(r); p.ring.quaternion.copy(cam.quaternion); p.ring.material.opacity = 0.85 * a;
      if (p.cut) { // (the circle where a sphere of radius r cuts the plane dy above/below its centre)
        const rr = r > Math.abs(p.dy) ? Math.sqrt(r * r - p.dy * p.dy) : 0;
        p.cut.visible = rr > 0.05; p.cut.scale.setScalar(Math.max(0.01, rr)); p.cut.material.opacity = 0.95 * a;
      }
    }
    for (let i = this.blips.length - 1; i >= 0; i--) {
      const b = this.blips[i];
      b.t += dt;
      const u = b.t / b.life;
      if (u >= 1) { this.game.scene.remove(b.s); b.s.material.dispose(); this.blips.splice(i, 1); continue; }
      const d = cam.position.distanceTo(b.s.position);
      b.s.scale.setScalar(b.size * (0.5 + 0.06 * d) * (0.35 + 1.5 * (1 - Math.pow(1 - u, 3))));
      b.s.material.opacity = 0.9 * (1 - u) * (1 - u);
    }
  }

  dropPulse(p) {
    this.game.scene.remove(p.shell, p.ring); p.mat.dispose(); p.ring.material.dispose();
    if (p.cut) { this.game.scene.remove(p.cut); p.cut.material.dispose(); }
  }

  clear() {
    for (const p of this.pulses) this.dropPulse(p);
    for (const b of this.blips) { this.game.scene.remove(b.s); b.s.material.dispose(); }
    this.pulses.length = 0; this.blips.length = 0;
  }
}
