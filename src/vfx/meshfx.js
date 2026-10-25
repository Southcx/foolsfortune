// ---------------------------------------------------------------------------------------
// MESH FX: effect meshes made in Mesh Create (scripts/meshflow.mjs: TakayuStudio's browser tool, its projects kept in
// source_assets/meshflow/ so the owner can open one, change it by hand and save it), drawn in the game the way the tool previews them:
// the texture scrolled at the project's U/V speeds, multiplied by its painted vertex colour and alpha, blended as the project says
// (additive, alpha), and tinted here. On top, what the game's own look wants: a tint per use (a chest's rarity colour), the Mind's
// labradorite (vfx/labradorite.js) mixed in by `labradorite`, and one `k` (0..1) that fades it in and out.
//
// Prior art: the scrolling-UV effect mesh of every action game since the sixth generation (Devil May Cry's and God of War's slashes
// and rings, Monster Hunter's and Genshin's skill VFX: a hand-shaped mesh, a small tiling texture flowing over it, vertex alpha fading
// its edges), which is exactly what Mesh Create is for, and Unity's / Unreal's material parameters for the per-use tint and fade.
//
//   await meshFx.load()                          once (parses every baked GLB)
//   const fx = meshFx.make('chest_circle', { tint, labradorite, opacity })   -> { group, u (uniforms), set(k), update(dt), dispose() }
//   fx.group.position / scale / rotation          where it is (the mesh as authored: metres, Y up)
// ---------------------------------------------------------------------------------------
import { base64Bytes } from '../core/base64.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LAB_GLSL, mindTime, mindTick } from './labradorite.js';
import { bakedCanvasTexture } from '../render/bakedcanvas.js';
import { tierScale } from './tierscale.js';

/** A baked mesh's texture drawn again at half its size (the resolution pass, 2026-10-25, docs/plans/art/texture-budget.md: eight 512
 *  textures, 10.7 MB on the GPU, for small tiling textures scrolled over an effect a few metres across), a baked canvas that lets its
 *  pixels go once on the GPU (render/bakedcanvas.js); the glTF's own texture let go. glTF's v runs down: no flip. */
function halved(map) {
  const im = map?.image; if (!im?.width) return map;
  const t = bakedCanvasTexture((g, w, h) => g.drawImage(im, 0, 0, w, h), im.width, im.height, { scale: 0.5 * tierScale() }); // (a quarter on a phone: vfx/tierscale.js)
  t.flipY = false; t.name = map.name; t.offset.copy(map.offset); t.repeat.copy(map.repeat);
  map.dispose();
  return t;
}
// (every baked mesh in src/assets/vfx/, by its file name: a new one is in the game the moment it is baked)
const SOURCES = Object.fromEntries(Object.entries(import.meta.glob('../assets/vfx/*.glb', { query: '?b64', import: 'default', eager: true }))
  .map(([f, b64]) => [f.split('/').pop().replace(/\.glb$/, ''), b64]));

// (one program for a baked mesh's effect and a library decal (vfx/vfx.js): their differences are uniforms, arithmetic only, never a
// mode (the program audit, 2026-10-25). A decal passes uPhR 1, uPhN 0, uUseRgb 0, uGain 1.3; a mesh the defaults)
export const FX_V = /* glsl */`
attribute vec4 color;
varying vec2 vUv; varying vec4 vCol; varying vec3 vW; varying vec3 vN;
uniform vec2 uScroll;
void main() {
  vUv = uv + uScroll; vCol = color;
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
export const FX_F = /* glsl */`
uniform sampler2D uMap; uniform vec3 uTint; uniform float uOpacity, uK, uLabradorite, uAdd, uGain, uGlow, uUseRgb, uPhR, uPhN;
varying vec2 vUv; varying vec4 vCol; varying vec3 vW; varying vec3 vN;
${LAB_GLSL}
void main() {
  vec4 t = texture2D(uMap, vUv);
  float a = t.a * vCol.a * uOpacity * uK;
  if (a < 0.003) discard;
  vec3 view = normalize(cameraPosition - vW);
  float ph = labPhase(vW, view) + uPhN * 0.3 * dot(vN, view) + uPhR * 1.5 * length(vUv - 0.5); // (a mesh's phase runs with its facing, a decal's outward from its middle)
  vec3 c = mix(vec3(1.0), t.rgb, uUseRgb) * vCol.rgb * mix(uTint, labSoft(ph) * uGain, uLabradorite) * uGlow;
  // (additive: the colour carries the alpha; alpha blending: straight)
  gl_FragColor = vec4(c * mix(1.0, a, uAdd), a);
}`;
/** The shared program's uniforms past a caller's own: a baked mesh's defaults. */
export const fxUniforms = (u) => ({ uOpacity: { value: 1 }, uAdd: { value: 1 }, uGain: { value: 1.4 }, uGlow: { value: 1 }, uUseRgb: { value: 1 }, uPhR: { value: 0 }, uPhN: { value: 1 }, uScroll: { value: new THREE.Vector2() }, ...u });

class MeshFx {
  constructor() { this.src = {}; }

  async load() {
    if (this.loaded) return;
    const loader = new GLTFLoader();
    for (const [name, b64] of Object.entries(SOURCES)) {
      const bin = base64Bytes(b64); // (core/base64.js: a loop, not a callback a byte)
      const gltf = await loader.parseAsync(bin.buffer, '');
      let mesh = null;
      gltf.scene.traverse((o) => { if (o.isMesh && !mesh) mesh = o; });
      if (!mesh) continue;
      const map = halved(mesh.material.map);
      if (map) { map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; map.needsUpdate = true; }
      if (!mesh.geometry.attributes.color) { // (always a colour to multiply by)
        const n = mesh.geometry.attributes.position.count;
        mesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(n * 4).fill(1), 4));
      }
      this.src[name] = { geometry: mesh.geometry, map, meta: mesh.userData.meshFlow || {} };
    }
    this.loaded = true;
  }

  has(name) { return !!this.src[name]; }

  /** A live copy of an effect mesh, hidden (k = 0) until set(). */
  make(name, { tint = 0xffffff, labradorite = 0, opacity = 1, scene = null, renderOrder = 7 } = {}) {
    const S = this.src[name];
    if (!S) return null;
    const M = S.meta, add = (M.blend || 'additive') !== 'alpha' && M.blend !== 'opaque';
    const u = fxUniforms({
      uMap: { value: S.map }, uTint: { value: new THREE.Color(tint) }, uOpacity: { value: opacity }, uK: { value: 0 }, uLabradorite: { value: labradorite },
      uAdd: { value: add ? 1 : 0 }, uMindT: mindTime,
    });
    const mat = new THREE.ShaderMaterial({
      uniforms: u, vertexShader: FX_V, fragmentShader: FX_F, transparent: true, depthWrite: false, fog: false,
      side: M.side === 'front' ? THREE.FrontSide : THREE.DoubleSide,
      blending: add ? THREE.CustomBlending : THREE.NormalBlending,
      ...(add ? { blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation } : {}),
    });
    const mesh = new THREE.Mesh(S.geometry, mat);
    mesh.frustumCulled = false; mesh.renderOrder = renderOrder;
    const group = new THREE.Group(); group.add(mesh); group.visible = false;
    scene?.add(group);
    const motion = M.motion || { speedU: 0, speedV: 0, rate: 1 };
    const fx = {
      group, mesh, u, k: 0,
      set(k) { fx.k = k; u.uK.value = Math.max(0, k); group.visible = k > 0.002; },
      update(dt) {
        if (!group.visible) return;
        mindTick();
        const r = motion.rate ?? 1;
        u.uScroll.value.x = (u.uScroll.value.x + motion.speedU * r * dt) % 1;
        u.uScroll.value.y = (u.uScroll.value.y + motion.speedV * r * dt) % 1;
      },
      dispose() { group.parent?.remove(group); mat.dispose(); },
    };
    return fx;
  }
}

export const meshFx = new MeshFx();
