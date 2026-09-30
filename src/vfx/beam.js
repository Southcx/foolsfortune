// ---------------------------------------------------------------------------------------
// BEAM: a column of light standing on a point: an open cylinder, additive, brightest at the foot and gone at the top, soft at its
// edges (the edge fades where the surface turns away from the eye, so it reads as a volume and not as a tube). It is the colour
// beam of a chest that is about to open, the faint pillar above an epic one, and the shaft under a spotlight.
//
// Prior art: the item-drop beams of every loot game (Diablo III's coloured pillars, Borderlands' rarity beams, Destiny's engram
// light, Genshin's wish meteor): the colour of the light is the rarity of the thing, and a beam is visible from across the map.
//
//   const b = new Beam(scene, { radius: 0.4, height: 9 });   b.place(vec3);   b.set(0xb26bff, 0.6, 0.5);   b.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const VERT = `
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FRAG = `
uniform vec3 uColor; uniform float uOpacity; uniform float uFoot;
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main() {
  float up = pow(1.0 - vUv.y, uFoot);
  float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.3);
  float a = uOpacity * up * edge;
  gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.45 * up * up), a);
  #include <colorspace_fragment>
}`;

export class Beam {
  constructor(scene, { radius = 0.4, height = 8, color = 0xffffff, opacity = 0, foot = 1.5, additive = false } = {}) {
    this.scene = scene;
    this.height = height;
    this.uniforms = { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uFoot: { value: foot } };
    const geo = new THREE.CylinderGeometry(radius * 0.55, radius, height, 24, 1, true);
    geo.translate(0, height / 2, 0);
    this.mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: this.uniforms, vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide, toneMapped: false,
    }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 6; this.mesh.visible = false;
    this.radius = radius;
    scene.add(this.mesh);
  }
  place(p) { this.mesh.position.copy(p); }
  /** Colour, brightness and width (a width of 1 is the radius it was built with). */
  set(color, opacity, width = 1) {
    if (color != null) this.uniforms.uColor.value.set(color);
    this.uniforms.uOpacity.value = opacity;
    this.mesh.scale.set(width, 1, width);
    this.mesh.visible = opacity > 0.004;
  }
  dispose() { this.scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}
