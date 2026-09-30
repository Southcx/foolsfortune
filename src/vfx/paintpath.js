// ---------------------------------------------------------------------------------------
// PAINT PATHS: a stroke of paint laid on the world, as a ribbon on the surfaces it passed over. Every so often (a few tens of
// centimetres) the painter pushes where the bristles are, the surface's normal there and how wide the stroke is; the ribbon between the
// samples is drawn with a bristle texture (streaks along the stroke, dry-brush breaks at the edges), wet at first and drying as it ages
// (darker, matte), and it fades out at the end of its life. All the paths of one kind are one mesh, one draw.
//
// Prior art: Splatoon's ink (the Inkbrush's and the Roller's trail: a stroke laid under the weapon as it moves, the one you swim in),
// Okami's brush strokes (a tapered sumi stroke with dry-brush edges), and the sixth-generation way of drawing it: a strip of quads with a
// texture, a colour that changes with age, no decals stacking up. (What the paint DOES, the slip you can dive into, is the painter's to
// register: this is only the picture.)
//
//   const p = new PaintPath(scene, { wet: 0xe8ab86, dry: 0xb4603f, life: 14 })
//   p.add(point, normal, dir, width)   a sample (the stroke continues from the last one)      p.gap()   the stroke ends
//   p.update(dt)   every frame                 p.clear()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

function bristleTexture() {
  const W = 128, H = 128, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const img = g.createImageData(W, H);
  // across the stroke (x), each bristle is a streak with its own load; along it (y), the load thins and breaks a little (dry brush)
  const load = Array.from({ length: W }, (_, x) => { const e = Math.abs(x / (W - 1) * 2 - 1); return (0.55 + 0.45 * Math.random()) * (e < 0.7 ? 1 : Math.max(0, 1 - (e - 0.7) / 0.3) ** 0.7); });
  for (let x = 0; x < W; x++) {
    const ph = Math.random() * 6, f = 1 + Math.random() * 3;
    for (let y = 0; y < H; y++) {
      const e = Math.abs(x / (W - 1) * 2 - 1);
      const brk = e > 0.55 ? 0.5 + 0.5 * Math.sin((y / H) * Math.PI * 2 * f + ph) : 1; // (the edges skip)
      const a = Math.min(1, load[x] * (e > 0.55 ? brk * 1.3 : 1));
      const i = (y * W + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 200 + 55 * load[x];
      img.data[i + 3] = 255 * a;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class PaintPath {
  constructor(scene, { wet = 0xe8ab86, dry = 0xb4603f, life = 14, max = 700, lift = 0.014 } = {}) {
    this.life = life; this.max = max; this.lift = lift;
    this.s = []; // { p, side, age, brk, v, w }
    this.brk = true; this.v = 0;
    const nv = max * 2;
    this.pos = new Float32Array(nv * 3); this.uv = new Float32Array(nv * 2); this.age = new Float32Array(nv);
    this.idx = new Uint16Array(max * 6);
    const geo = (this.geo = new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv', new THREE.BufferAttribute(this.uv, 2).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('age', new THREE.BufferAttribute(this.age, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setIndex(new THREE.BufferAttribute(this.idx, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: bristleTexture() }, uWet: { value: new THREE.Color(wet) }, uDry: { value: new THREE.Color(dry) } },
      transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, side: THREE.DoubleSide,
      vertexShader: 'attribute float age; varying vec2 vUv; varying float vAge; void main() { vUv = uv; vAge = age; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform sampler2D uMap; uniform vec3 uWet, uDry; varying vec2 vUv; varying float vAge;
        void main() {
          vec4 t = texture2D(uMap, vUv);
          float dry = smoothstep(0.05, 0.6, vAge);
          vec3 c = mix(uWet * (1.08 + 0.25 * (1.0 - dry) * t.r), uDry, dry * 0.85) * (0.85 + 0.15 * t.r);
          float a = t.a * (1.0 - smoothstep(0.82, 1.0, vAge));
          if (a < 0.02) discard;
          gl_FragColor = vec4(c, a * 0.95);
        }`,
    });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 2;
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  /** A sample: the stroke goes on from the last one (unless it was broken off by `gap`). */
  add(point, normal, dir, width) {
    const side = new THREE.Vector3().crossVectors(normal, dir);
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0); else side.normalize();
    const last = this.s[this.s.length - 1];
    if (!this.brk && last) this.v += last.p.distanceTo(point) / Math.max(0.4, width * 1.6);
    else this.v = Math.random();
    this.s.push({ p: point.clone().addScaledVector(normal, this.lift), side, w: width, age: 0, brk: this.brk, v: this.v });
    this.brk = false;
    if (this.s.length > this.max) this.s.shift();
    this.dirty = true;
  }
  gap() { this.brk = true; }

  update(dt) {
    const s = this.s;
    let drop = 0;
    for (const q of s) { q.age += dt / this.life; if (q.age >= 1) drop++; }
    if (drop) { s.splice(0, drop); if (s.length) s[0].brk = true; }
    this.mesh.visible = s.length > 1;
    if (!this.mesh.visible) return;
    // (rebuilt every frame: the ages change; a few hundred quads at most)
    let n = 0, k = 0;
    for (let i = 0; i < s.length; i++) {
      const q = s[i], nxt = s[i + 1];
      // the stroke tapers in at its start and out at its end (a brush lifted, not cut)
      const startK = q.brk ? 0.35 : 1, endK = !nxt || nxt.brk ? 0.45 : 1;
      const hw = q.w * 0.5 * Math.min(startK, endK);
      const o = n * 3;
      this.pos[o] = q.p.x + q.side.x * hw; this.pos[o + 1] = q.p.y + q.side.y * hw; this.pos[o + 2] = q.p.z + q.side.z * hw;
      this.pos[o + 3] = q.p.x - q.side.x * hw; this.pos[o + 4] = q.p.y - q.side.y * hw; this.pos[o + 5] = q.p.z - q.side.z * hw;
      this.uv[n * 2] = 0; this.uv[n * 2 + 1] = q.v; this.uv[n * 2 + 2] = 1; this.uv[n * 2 + 3] = q.v;
      this.age[n] = this.age[n + 1] = q.age;
      if (nxt && !nxt.brk) { this.idx[k++] = n; this.idx[k++] = n + 1; this.idx[k++] = n + 2; this.idx[k++] = n + 1; this.idx[k++] = n + 3; this.idx[k++] = n + 2; }
      n += 2;
    }
    const g = this.geo;
    g.setDrawRange(0, k);
    g.attributes.position.needsUpdate = true; g.attributes.uv.needsUpdate = true; g.attributes.age.needsUpdate = true; g.index.needsUpdate = true;
  }

  clear() { this.s.length = 0; this.brk = true; this.mesh.visible = false; }
}
