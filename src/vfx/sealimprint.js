// ---------------------------------------------------------------------------------------
// THE IMPRINT'S LOOK: your imprint burned into a cradle when you seal into it (docs/plans/HANKO.md; OVERLAY.md 10.5c; Espada's word:
// an imprint, what a seal leaves). On `seal.set` the cradle's floor takes your seal face in the window colour: a flash, the face and its
// pad ring lit, then cooling over about two real seconds to a dim imprint, its marks bitten into the floor, that stays. On `seal.unset`
// it is left dim. A Shrine's arch cradle stands upright, so its imprint faces out of the tablet; every other lies on its cradle's floor.
//
// One mesh an imprinted cradle, one texture a seal (shared by every cradle it is pressed into). The texture holds masks, not colour
// (red the face, green its glow, blue the pad ring), so the window colour is a uniform: changing it repaints nothing.
//
// Prior art: round six's gate (Calissa's mock, overlay/r6-gate: the burn lit, then dim, with its scorch and the dots gone out) and round
// five's print on a cradle's floor (overlay/r5-jar); the pilgrim's goshuin, the red seal pressed at each temple; a branding iron's glow
// cooling off the hide; Breath of the Wild's shrine pedestal lighting under the Slate.
//
//   game.sealImprints = new SealImprints(game)   (listens to seal.set and seal.unset; nothing to call)
//   .of(cradleId) -> mesh | undefined   .dispose()   (it cools on the wall clock as it is drawn: no update to call)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { drawSealFace } from './sealface.js';
import { THEMES, theme } from '../ui/theme.js';

const TEX = 256, FACE = 0.82; // (the texture's px; how much of the disc the face fills: the pad ring is round it)
const COOL = 2.0, FLASH = 0.35; // (real seconds: the burn cooling to dim; the flash at the stamp)
const RADIUS = 0.27;
const now = () => performance.now(); // (m: the imprint's radius on a cradle's floor; a Shrine's threshold well is 0.28)

const V = /* glsl */`varying vec2 vU;
#include <fog_pars_vertex>
void main() { vU = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
const F = /* glsl */`uniform sampler2D uMask; uniform vec3 uInk, uHot; uniform float uLit, uFlash, uPad; varying vec2 vU;
#include <fog_pars_fragment>
float h(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
void main() {
  vec3 m = texture2D(uMask, vU).rgb; float r = length(vU - 0.5) * 2.0;
  float soot = smoothstep(1.0, 0.75, r) * smoothstep(0.0, 0.5, r) * 0.42 + smoothstep(0.85, 0.2, r) * 0.18;   // (the scorch round it)
  float bite = step(0.86, h(floor(vU * 22.0))) * (1.0 - uLit) * 0.8;                                     // (dots of it gone out, cold)
  float face = m.r * (1.0 - bite);
  vec3 c = uInk * face * mix(0.62, 1.0, uLit) + uInk * m.g * (0.5 + 1.6 * uLit) * mix(0.35, 1.0, uLit);  // (the burn, and its glow)
  c = mix(c, uHot * 2.4, face * uLit * 0.55) + uHot * (face + m.g) * uFlash * 3.0;                        // (the hot core, the flash)
  c += uInk * m.b * uPad * 2.2;                                                                            // (the pad ring lit)
  float a = clamp(max(max(face, m.g * (0.45 + 0.55 * uLit)), max(m.b * uPad, soot)), 0.0, 1.0);
  gl_FragColor = vec4(c, a);
#include <fog_fragment>
}`;

export class SealImprints {
  constructor(game) {
    this.game = game; this.draw = drawSealFace;
    this.list = new Map(); // (cradle id -> { mesh, t0, done })
    this.tex = new Map(); // (seal key -> texture)
    this.ink = new THREE.Color(); this.hot = new THREE.Color(); this.theme = null;
    this.geo = new THREE.PlaneGeometry(1, 1);
    game.events?.on?.('seal.set', (e) => this.burn(e));
    game.events?.on?.('seal.unset', (e) => { const I = this.list.get(e.cradle); if (I) I.t0 = Math.min(I.t0, now() - COOL * 600); }); // (out early: it cools the faster, and stays dim)
  }

  of(id) { return this.list.get(id)?.mesh; }

  /** The window colour, as the imprint's ink (the frame's middle tone: round six's dim verdigris) and its hot core (the frame's light). */
  colours() {
    if (this.theme === theme.id) return;
    const T = THEMES[theme.id] || THEMES.kiln; this.theme = theme.id;
    this.ink.set(`rgb(${T.sel})`); this.hot.set(T.hi);
    for (const I of this.list.values()) { I.mesh.material.uniforms.uInk.value.copy(this.ink); I.mesh.material.uniforms.uHot.value.copy(this.hot); }
  }

  /** The masks of a seal, drawn once: red the face, green its glow, blue the pad ring (a cradle's 32 pads round the face). */
  texOf(seal) {
    const key = seal ? `${seal.name}|${seal.outline}|${seal.carving}` : '-';
    if (this.tex.has(key)) return this.tex.get(key);
    const S = TEX, cv = () => { const c = document.createElement('canvas'); c.width = c.height = S; return c; };
    const face = cv(), f = face.getContext('2d'), inset = S * (1 - FACE) / 2;
    f.translate(inset, inset); drawSealFace(f, seal, { size: S * FACE, ink: '#fff' });
    const tint = (src, col, blur) => { const c = cv(), x = c.getContext('2d'); if (blur) x.filter = `blur(${blur}px)`; x.drawImage(src, 0, 0); x.filter = 'none'; x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, S, S); return c; };
    const out = cv(), o = out.getContext('2d');
    o.fillStyle = '#000'; o.fillRect(0, 0, S, S); o.globalCompositeOperation = 'lighter';
    o.drawImage(tint(face, '#f00'), 0, 0); o.drawImage(tint(face, '#0f0', 3), 0, 0); o.drawImage(tint(face, '#0f0', 6), 0, 0);
    o.fillStyle = '#00f'; o.translate(S / 2, S / 2);
    for (let i = 0; i < 32; i++) { o.save(); o.rotate(i / 32 * Math.PI * 2); o.fillRect(S * 0.43, -S * 0.012, S * 0.05, S * 0.024); o.restore(); }
    const t = new THREE.CanvasTexture(out); t.anisotropy = 4; // (masks: linear, not colour)
    this.tex.set(key, t);
    return t;
  }

  /** Your imprint into a cradle, at its stamp (seal.set). */
  burn(e) {
    const g = this.game, c = g.cradles?.list.find((x) => x.id === e.cradle); if (!c) return;
    this.colours();
    let I = this.list.get(c.id);
    const map = this.texOf(e.seal);
    if (!I) {
      const mat = new THREE.ShaderMaterial({
        name: 'seal-imprint', vertexShader: V, fragmentShader: F, transparent: true, depthWrite: false, fog: true,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, toneMapped: false,
        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uMask: { value: null }, uInk: { value: new THREE.Color() }, uHot: { value: new THREE.Color() }, uLit: { value: 1 }, uFlash: { value: 1 }, uPad: { value: 1 } }]),
      });
      const mesh = new THREE.Mesh(this.geo, mat); mesh.name = `imprint.${c.id}`; mesh.renderOrder = 2; mesh.frustumCulled = true;
      const upright = /\.arch$/.test(c.id); // (a Shrine's arch cradle stands in the tablet, facing out: vfx/shrine.js)
      const r = (c.imprintRadius ?? (upright ? ARCH : RADIUS)) / FACE * 2;
      mesh.scale.set(r, r, 1);
      mesh.position.copy(c.pos);
      if (upright) { mesh.rotation.set(0, c.yaw, 0); mesh.position.add(new THREE.Vector3(Math.sin(c.yaw), 0, Math.cos(c.yaw)).multiplyScalar(0.004)); }
      else { mesh.rotation.set(-Math.PI / 2, c.yaw, 0, 'YXZ'); mesh.position.y += 0.004; } // (its top away from the cradle's front: it reads from there)
      g.scene.add(mesh);
      I = { mesh, t0: 0 }; this.list.set(c.id, I);
      mesh.onBeforeRender = () => this.tick(I); // (it cools on the wall clock, ticked only while it is drawn: nothing to call each frame)
      mat.uniforms.uInk.value.copy(this.ink); mat.uniforms.uHot.value.copy(this.hot);
    }
    I.mesh.material.uniforms.uMask.value = map; I.t0 = now(); I.done = false;
  }

  /** The burn's clock: the flash, then the lit face and pad ring cooling to dim (real seconds since the stamp). */
  tick(I) {
    this.colours(); // (the window colour may have changed: a string compared, a uniform copied)
    const t = (now() - I.t0) / 1000; if (I.done && t > COOL) return;
    const u = I.mesh.material.uniforms, k = Math.min(1, t / COOL), cool = 1 - k * k * (3 - 2 * k);
    u.uFlash.value = Math.max(0, 1 - t / FLASH) ** 2; u.uLit.value = cool; u.uPad.value = cool;
    I.done = t > COOL;
  }

  dispose() {
    for (const I of this.list.values()) { I.mesh.removeFromParent(); I.mesh.material.dispose(); }
    for (const t of this.tex.values()) t.dispose();
    this.list.clear(); this.tex.clear(); this.geo.dispose();
  }
}
