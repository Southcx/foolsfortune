// ---------------------------------------------------------------------------------------
// THE PARRY MARK: what can be parried wears Lachryma (the owner, 2026-10-06; docs/plans/PARRY.md, OVERLAY.md). Every projectile that can
// be turned back, and the striking part of a creature's windup that can be answered (for its eta), is outlined in Lachryma: a shell of
// near-black ink round its silhouette with the oil film creeping through it. NOTHING ELSE EVER WEARS IT, so the eye learns one thing:
// that outline means "answer this". On a windup the outline thickens as the strike nears and is fullest in the window itself.
//
// Prior art: Cuphead's pink parry objects (one colour means "parry this", and nothing else in the game uses it), Sekiro's perilous
// kanji and Elden Ring's glint (a windup that marks itself), and the inverted hull outline of every cel-shaded game since Jet Set Radio
// (the mesh drawn again, its back faces pushed out along the normals: a silhouette line that needs no post pass).
//
//   game.parryMark = new ParryMark()   const h = parryMark.mark(object3D, { eta? })   h.eta(seconds | null)   h.clear()   .update(rawDt, camera)
//   (eta: the seconds to the strike; null for a projectile, which wears it at full width while it can be parried)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const V = /* glsl */`
#include <common>
#include <skinning_pars_vertex>
uniform float uPx, uW, uAsp; varying vec3 vW;
void main() {
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  vec4 wp = modelMatrix * vec4(transformed, 1.0); vW = wp.xyz;
  vec4 cp = projectionMatrix * viewMatrix * wp;
  vec3 n = normalize(mat3(viewMatrix) * mat3(modelMatrix) * objectNormal);
  vec2 dir = normalize((projectionMatrix * vec4(n, 0.0)).xy + 1e-6);
  cp.xy += dir * vec2(1.0 / uAsp, 1.0) * uW * uPx * cp.w;                       // (pushed out along the normal by a constant number of pixels)
  gl_Position = cp;
}`;
const F = /* glsl */`uniform float uT, uA; varying vec3 vW;
void main() {
  float ph = dot(vW, vec3(0.9, 1.3, 0.7)) * 2.0 - uT * 0.6;
  vec3 film = 0.5 + 0.5 * cos(6.2832 * (ph + vec3(0.0, 0.33, 0.67)));
  gl_FragColor = vec4(vec3(0.004, 0.003, 0.007) + film * film * 0.1, uA); // (Lachryma: ink, its oil film running through it)
}`;

const WIDTH = 3.6; // (pixels at the 480-line present)

export class ParryMark {
  constructor() {
    this.t = { value: 0 }; this.px = { value: 2 / 480 }; this.asp = { value: 16 / 9 };
    this.base = new THREE.ShaderMaterial({ name: 'parry-mark', uniforms: { uT: this.t, uPx: this.px, uAsp: this.asp, uW: { value: WIDTH }, uA: { value: 1 } }, vertexShader: V, fragmentShader: F, side: THREE.BackSide, transparent: true, depthWrite: false });
    this.marks = new Set();
  }

  /** Outline every mesh in `obj` in Lachryma. Returns a handle: eta(seconds to the strike, or null), clear(). */
  mark(obj, { eta = null } = {}) {
    const mat = this.base.clone(); mat.uniforms.uT = this.t; mat.uniforms.uPx = this.px; mat.uniforms.uAsp = this.asp; // (one program; its width and fade its own)
    const shells = [];
    obj.traverse((o) => {
      if (!o.isMesh || o.userData.parryShell || o.userData.isOutline) return;
      const s = o.isSkinnedMesh ? new THREE.SkinnedMesh(o.geometry, mat) : new THREE.Mesh(o.geometry, mat);
      if (o.isSkinnedMesh) s.bind(o.skeleton, o.bindMatrix);
      s.userData.parryShell = true; s.renderOrder = (o.renderOrder || 0) + 1; s.frustumCulled = false; s.raycast = () => {};
      o.add(s); shells.push(s);
    });
    const h = {
      mat, shells, eta: (e) => { h.e = e; },
      clear: () => { for (const s of shells) s.parent?.remove(s); mat.dispose(); this.marks.delete(h); },
    };
    h.e = eta; this.marks.add(h);
    return h;
  }

  /** Once a frame: the film runs, and a windup's outline thickens toward its strike (fullest in the last 0.25 s). */
  update(raw = 1 / 60, camera = null) {
    this.t.value += raw; if (camera?.aspect) this.asp.value = camera.aspect;
    for (const h of this.marks) {
      const e = h.e, k = e == null ? 1 : THREE.MathUtils.clamp(1 - (e - 0.25) / 0.8, 0.25, 1);
      h.mat.uniforms.uW.value = WIDTH * (0.5 + 0.5 * k); h.mat.uniforms.uA.value = 0.55 + 0.45 * k;
    }
  }
}
