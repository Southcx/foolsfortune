// ---------------------------------------------------------------------------------------
// TRIPLANAR: a texture laid on a surface from the world itself, no UVs. The texture is projected along the three axes (onto the
// planes x = c, y = c, z = c) and the three samples are blended by how much the surface faces each axis, so a wall, a floor, a slope or
// a rough rock skin all take the texture at one density with no seams and no stretching. A second texture can take the faces that look
// up (sand settled on the tops of rock), a second, coarser sample of the same texture breaks its repeat, and a FOOT blends a band at
// the ground into the ground's own texture: the skirt where a mesh meets the ground (the owner, R46: "meshes that interact with the
// ground need mesh skirts to blend textures between materials").
//
// Prior art: GPU Gems 3, ch. 1 (Ryan Geiss, "Generating Complex Procedural Terrains Using the GPU": the blend by the normal, sharpened
// by a power); Ben Golus, "Normal Mapping for a Triplanar Shader" (2017: the weights and their sharpness); the "top texture" of every
// terrain shader since (Unreal's world-aligned blend); and the two-scale sample against tiling (Inigo Quilez, "texture repetition").
// Patched into three.js's own materials (onBeforeCompile), so lighting, shadows and fog stay the material's, and every material
// with the same options shares one program (customProgramCacheKey).
//
//   triplanar(material, { side, top?, foot?: { tex, height, y? }, scale?, sharp?, strength?, mode? }) -> material
//     side / top / foot.tex: a THREE.Texture (surfaceTexture below)   scale: repeats a metre (0.25 = one tile every 4 m)
//     sharp: the blend's power (higher, crisper seams between the axes)   strength: 0..1, how much the texture shows
//     mode: 'detail' (the default: the texture over its own mean modulates the material's colour, so the palette stays the
//           material's and the texture brings only its light and shade) or 'albedo' (the texture is the colour; material colour white)
//     foot: the band `height` metres over the ground takes foot.tex as its colour, fading up; the ground is the object's own origin
//           (a model stands on its origin), or the world height `y` when given (level geometry, merged in world space)
//     (the uniforms are kept on material.userData.triplanar: tpStrength, tpScale, tpSharp)
//   surfaceTexture(name) -> THREE.Texture   Calissa's CC0 tiling surfaces (src/assets/textures/, credited in the README), loaded once:
//     sand, sand_packed, rock, clay_floor, plaster, stone_flags
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import sand from '../assets/textures/sand.jpg?b64';
import sandPacked from '../assets/textures/sand_packed.jpg?b64';
import rock from '../assets/textures/rock.jpg?b64';
import clayFloor from '../assets/textures/clay_floor.jpg?b64';
import plaster from '../assets/textures/plaster.jpg?b64';
import stoneFlags from '../assets/textures/stone_flags.jpg?b64';

const SOURCES = { sand, sand_packed: sandPacked, rock, clay_floor: clayFloor, plaster, stone_flags: stoneFlags };
const loaded = new Map();

/** One of the CC0 surfaces as a tiling, mipmapped texture (shared: one per name). */
export function surfaceTexture(name) {
  if (loaded.has(name)) return loaded.get(name);
  const b64 = SOURCES[name];
  if (!b64) throw new Error(`triplanar: no surface "${name}"`);
  const t = new THREE.Texture();
  const img = new Image();
  img.onload = () => { t.image = img; t.needsUpdate = true; };
  img.src = `data:image/jpeg;base64,${b64}`;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  loaded.set(name, t);
  return t;
}

const VERT_DECL = 'varying vec3 vTpPos;\nvarying vec3 vTpNrm;\n#ifdef TP_FOOT\nvarying float vTpUp;\n#endif\n';
const FRAG_DECL = `varying vec3 vTpPos;
varying vec3 vTpNrm;
uniform sampler2D tpSide;
uniform float tpScale, tpSharp, tpStrength;
#ifdef TP_TOP
uniform sampler2D tpTop;
#endif
#ifdef TP_FOOT
varying float vTpUp;
uniform sampler2D tpFoot;
uniform float tpFootH;
#endif
vec3 tpSample(sampler2D t, vec3 w, vec3 p) {
  return texture2D(t, p.zy).rgb * w.x + texture2D(t, p.xz).rgb * w.y + texture2D(t, p.xy).rgb * w.z;
}
// (two scales of one texture, the coarse one turned, so the repeat does not read across a dune)
vec3 tpTwo(sampler2D t, vec3 w, vec3 p) {
  return 0.5 * (tpSample(t, w, p) + tpSample(t, w, mat3(0.8, 0.0, -0.6, 0.0, 1.0, 0.0, 0.6, 0.0, 0.8) * p * 0.29));
}
vec3 tpMean(sampler2D t) { return max(textureLod(t, vec2(0.5), 12.0).rgb, vec3(0.02)); }
`;

const anchor = '#include <alphamap_fragment>'; // (after map_fragment and color_fragment: a patch on the colour, vertex colours included)

/** Lay `side` (and `top`, and a `foot`) on a material from the world. Mutates and returns it. Call once per material. */
export function triplanar(material, { side, top = null, foot = null, scale = 0.25, sharp = 4, strength = 1, mode = 'detail' } = {}) {
  const footAbs = foot && foot.y !== undefined;
  const u = {
    tpSide: { value: side }, tpScale: { value: scale }, tpSharp: { value: sharp }, tpStrength: { value: strength },
    ...(top ? { tpTop: { value: top } } : {}),
    ...(foot ? { tpFoot: { value: foot.tex }, tpFootH: { value: foot.height } } : {}),
  };
  const defines = { ...(top ? { TP_TOP: '' } : {}), ...(foot ? { TP_FOOT: '' } : {}), ...(footAbs ? { TP_FOOT_ABS: foot.y.toFixed(4) } : {}), ...(mode === 'albedo' ? { TP_ALBEDO: '' } : {}) };
  const prev = material.onBeforeCompile;
  // (a material patched before without a key of its own is told apart by its patch's source, as three.js itself would)
  const before = material.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey ? material.customProgramCacheKey() : prev.toString();
  material.onBeforeCompile = (sh, r) => {
    prev?.call(material, sh, r);
    Object.assign(sh.uniforms, u);
    sh.defines = { ...(sh.defines || {}), ...defines };
    sh.vertexShader = VERT_DECL + sh.vertexShader
      .replace('#include <begin_vertex>', `#include <begin_vertex>
  { mat4 tpM = modelMatrix;
  #ifdef USE_INSTANCING
    tpM = tpM * instanceMatrix;
  #endif
    vTpPos = (tpM * vec4(transformed, 1.0)).xyz;
  #ifdef TP_FOOT
  #ifdef TP_FOOT_ABS
    vTpUp = vTpPos.y - TP_FOOT_ABS;
  #else
    vTpUp = vTpPos.y - tpM[3].y;
  #endif
  #endif
  }`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
  { mat3 tpN = mat3(modelMatrix);
  #ifdef USE_INSTANCING
    tpN = tpN * mat3(instanceMatrix);
  #endif
    vTpNrm = normalize(tpN * objectNormal); }`);
    sh.fragmentShader = FRAG_DECL + sh.fragmentShader.replace(anchor, `{
    vec3 n = normalize(vTpNrm), w = pow(abs(n), vec3(tpSharp)); w /= (w.x + w.y + w.z + 1e-5);
    vec3 p = vTpPos * tpScale;
  #ifdef TP_ALBEDO
    vec3 tp = tpTwo(tpSide, w, p);
  #else
    vec3 tp = tpTwo(tpSide, w, p) / tpMean(tpSide);
  #endif
  #ifdef TP_TOP
  #ifdef TP_ALBEDO
    vec3 tt = tpTwo(tpTop, w, p);
  #else
    vec3 tt = tpTwo(tpTop, w, p) / tpMean(tpTop);
  #endif
    tp = mix(tp, tt, smoothstep(0.55, 0.85, n.y)); // (the faces that look up take the top texture)
  #endif
  #ifdef TP_ALBEDO
    diffuseColor.rgb = mix(diffuseColor.rgb, tp, tpStrength);
  #else
    diffuseColor.rgb *= mix(vec3(1.0), tp, tpStrength); // (the texture's light and shade over the material's own colour)
  #endif
  #ifdef TP_FOOT
    diffuseColor.rgb = mix(tpSample(tpFoot, w, p), diffuseColor.rgb, smoothstep(0.0, tpFootH, vTpUp)); // (the skirt: the ground's own colour)
  #endif
  }
  ${anchor}`);
  };
  const key = `tp${top ? 't' : ''}${foot ? (footAbs ? `F${foot.y}` : 'f') : ''}${mode === 'albedo' ? 'a' : ''}|${before}`;
  material.customProgramCacheKey = () => key;
  material.userData.triplanar = u; // (its uniforms, to tune or turn down: u.tpStrength.value)
  material.needsUpdate = true;
  return material;
}
