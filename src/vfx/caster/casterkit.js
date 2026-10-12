// ---------------------------------------------------------------------------------------
// THE CASTER SHADERS' KIT: the few parts the caster shells' shaders share (docs/plans/CASTER-SHELLS.md section 1, S1 to S10), so each
// shader module is only its look: one material a look, shared by every copy, with each copy's own numbers handed to it as it is drawn;
// the frame as drawn so far, for the shaders that bend what is behind them; and the noise they all drift by.
//
//   ownUniforms(mesh, material, u)   the copy's uniforms (u: { name: { value } }) put into the shared material just before the mesh draws
//                                    (three.js uploads a ShaderMaterial's uniforms again when `uniformsNeedUpdate` is set): one program,
//                                    one material, many copies, no draw call more than the copies' own
//   sceneGrab(renderer) -> { texture, size } | null   the frame drawn so far this frame (the opaque world and what was drawn before),
//                                    copied once a frame by a framebuffer blit (which also resolves the scene buffer's multisampling) the
//                                    first time a refracting thing asks; null when the frame is drawn straight to the canvas (glow off)
//   viewSize(renderer, out) -> out   the size in pixels of what is being drawn into (the 480-line buffer: render/present.js)
//   NOISE_GLSL                       hash3, vnoise(vec3) (a smooth value noise, -1..1), fbm3(vec3) (three octaves): low frequency only
//   GROUND_Y                         where a copy is parked to be compiled in the warm-up (50 m under the world, as the others park)
//
// Prior art: three.js's own `onBeforeRender` and `uniformsNeedUpdate` (per-object uniforms on a shared material), the "grab pass" of
// Unity's ShaderLab and Unreal's scene colour (the frame so far, sampled by a refracting surface), Half-Life 2's refract shader and the
// PS2's framebuffer reads (heat haze, water) that this copies the cheap way: one copy a frame, no extra draw of the world.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const GROUND_Y = -50;

/** Put a copy's own uniforms into the shared material just before it draws. `u` holds the copy's values ({ name: { value } }); only the
 *  names the material has are copied. */
export function ownUniforms(mesh, material, u) {
  const names = Object.keys(u).filter((k) => material.uniforms[k]);
  mesh.onBeforeRender = (renderer, scene, camera, geometry, mat) => {
    if (mat !== material) return;
    mesh.userData.beforeDraw?.(renderer, camera); // (a copy that reads the frame or its size sets its uniforms first)
    for (const k of names) material.uniforms[k].value = u[k].value;
    material.uniformsNeedUpdate = true;
  };
}

const _v4 = new THREE.Vector4();
/** The size in pixels of what is being drawn into right now. */
export function viewSize(renderer, out = new THREE.Vector2()) {
  const t = renderer.getRenderTarget();
  if (t) return out.set(t.width, t.height);
  renderer.getCurrentViewport(_v4);
  return out.set(_v4.z, _v4.w);
}

// the copy of the frame: one target, sized and typed as what the world is drawn into (a multisampled buffer resolves only into one of
// the same format and size), copied once for each frame drawn (renderer.info's frame count)
let grab = null, grabFrame = -1;
const grabSize = new THREE.Vector2();
export function sceneGrab(renderer) {
  const src = renderer.getRenderTarget();
  if (!src) return null; // (the canvas itself: its format is the browser's, so it is not copied; the refraction shows nothing then)
  const frame = renderer.info.render.frame, gl = renderer.getContext(), state = renderer.state;
  if (grab && grabFrame === frame && grab.width === src.width && grab.height === src.height) return { texture: grab.texture, size: grabSize };
  const from = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING); // (what is being drawn into: the scene buffer's multisampled framebuffer)
  const type = src.texture.type, format = src.texture.format;
  if (!grab || grab.texture.type !== type || grab.texture.format !== format) {
    grab?.dispose();
    grab = new THREE.WebGLRenderTarget(src.width, src.height, { type, format, depthBuffer: false, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter, generateMipmaps: false });
    grab.texture.name = 'caster-grab';
    renderer.initRenderTarget(grab);
  } else if (grab.width !== src.width || grab.height !== src.height) { grab.setSize(src.width, src.height); renderer.initRenderTarget(grab); }
  const to = renderer.properties.get(grab).__webglFramebuffer;
  if (!to) { state.bindFramebuffer(gl.FRAMEBUFFER, from); return null; }
  const scissor = gl.isEnabled(gl.SCISSOR_TEST);
  if (scissor) gl.disable(gl.SCISSOR_TEST);
  // (through three.js's state, so its cache of what is bound stays true: setting up the copy's target bound nothing, and the frame's own
  // binding is put back for the draws still to come)
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER, from);
  state.bindFramebuffer(gl.DRAW_FRAMEBUFFER, to);
  gl.blitFramebuffer(0, 0, src.width, src.height, 0, 0, src.width, src.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
  state.bindFramebuffer(gl.FRAMEBUFFER, from);
  if (scissor) gl.enable(gl.SCISSOR_TEST);
  grabFrame = frame; grabSize.set(src.width, src.height);
  return { texture: grab.texture, size: grabSize };
}

export const NOISE_GLSL = /* glsl */`
float hash3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return -1.0 + 2.0 * mix(mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x), mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
                          mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x), mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm3(vec3 p) { return 0.57 * vnoise(p) + 0.29 * vnoise(p * 2.03 + 7.1) + 0.14 * vnoise(p * 4.07 + 13.7); }
`;
