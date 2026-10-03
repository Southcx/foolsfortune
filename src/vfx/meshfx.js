// ---------------------------------------------------------------------------------------
// MESH FX: effect meshes made in Mesh Create (tools/meshflow.mjs: TakayuStudio's browser tool, its projects kept in
// source_assets/meshflow/ so the owner can open one, change it by hand and save it), drawn in the game the way the tool previews them:
// the texture scrolled at the project's U/V speeds, multiplied by its painted vertex colour and alpha, blended as the project says
// (additive, alpha), and tinted here. On top, what the game's own look wants: a tint per use (a chest's rarity colour), the Mind's
// labradorite (vfx/labradorite.js) mixed in by `lab`, and one `k` (0..1) that fades it in and out.
//
// Prior art: the scrolling-UV effect mesh of every action game since the sixth generation (Devil May Cry's and God of War's slashes
// and rings, Monster Hunter's and Genshin's skill VFX: a hand-shaped mesh, a small tiling texture flowing over it, vertex alpha fading
// its edges), which is exactly what Mesh Create is for, and Unity's / Unreal's material parameters for the per-use tint and fade.
//
//   await meshFx.load()                          once (parses every baked GLB)
//   const fx = meshFx.make('chest_circle', { tint, lab, opacity })   -> { group, u (uniforms), set(k), update(dt), dispose() }
//   fx.group.position / scale / rotation          where it is (the mesh as authored: metres, Y up)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LAB_GLSL, mindTime, mindTick } from './labradorite.js';
// (every baked mesh in src/assets/vfx/, by its file name: a new one is in the game the moment it is baked)
const SOURCES = Object.fromEntries(Object.entries(import.meta.glob('../assets/vfx/*.glb', { query: '?b64', import: 'default', eager: true }))
  .map(([f, b64]) => [f.split('/').pop().replace(/\.glb$/, ''), b64]));

const V = /* glsl */`
attribute vec4 color;
varying vec2 vUv; varying vec4 vCol; varying vec3 vW; varying vec3 vN;
uniform vec2 uScroll;
void main() {
  vUv = uv + uScroll; vCol = color;
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const F = /* glsl */`
uniform sampler2D uMap; uniform vec3 uTint; uniform float uOpacity, uK, uLab, uAdd;
varying vec2 vUv; varying vec4 vCol; varying vec3 vW; varying vec3 vN;
${LAB_GLSL}
void main() {
  vec4 t = texture2D(uMap, vUv);
  float a = t.a * vCol.a * uOpacity * uK;
  vec3 view = normalize(cameraPosition - vW);
  vec3 c = t.rgb * vCol.rgb * mix(uTint, labSoft(labPhase(vW, view) + 0.3 * dot(vN, view)) * 1.4, uLab);
  // (additive: the colour carries the alpha; alpha blending: straight)
  gl_FragColor = uAdd > 0.5 ? vec4(c * a, a) : vec4(c, a);
}`;

class MeshFx {
  constructor() { this.src = {}; }

  async load() {
    if (this.loaded) return;
    const loader = new GLTFLoader();
    for (const [name, b64] of Object.entries(SOURCES)) {
      const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const gltf = await loader.parseAsync(bin.buffer, '');
      let mesh = null;
      gltf.scene.traverse((o) => { if (o.isMesh && !mesh) mesh = o; });
      if (!mesh) continue;
      const map = mesh.material.map;
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
  make(name, { tint = 0xffffff, lab = 0, opacity = 1, scene = null, renderOrder = 7 } = {}) {
    const S = this.src[name];
    if (!S) return null;
    const M = S.meta, add = (M.blend || 'additive') !== 'alpha' && M.blend !== 'opaque';
    const u = {
      uMap: { value: S.map }, uTint: { value: new THREE.Color(tint) }, uOpacity: { value: opacity }, uK: { value: 0 }, uLab: { value: lab },
      uAdd: { value: add ? 1 : 0 }, uScroll: { value: new THREE.Vector2() }, uMindT: mindTime,
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: u, vertexShader: V, fragmentShader: F, transparent: true, depthWrite: false, fog: false,
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
