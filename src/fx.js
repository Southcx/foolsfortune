import * as THREE from 'three';
import { T, PALETTE } from './config.js';

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const UP = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

function radialTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  grd.addColorStop(1, outer);
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Generic GPU point particles (soft round sprites). One additive pool, one alpha pool.
class ParticlePool {
  constructor(scene, max, additive) {
    this.max = max;
    this.p = [];
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4);
    this.size = new Float32Array(max);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: radialTexture() }, scale: { value: 600 } },
      vertexShader: `
        attribute float size; attribute vec4 color; varying vec4 vColor; uniform float scale;
        void main(){ vColor = color; vec4 mv = modelViewMatrix * vec4(position,1.0);
          gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `
        uniform sampler2D map; varying vec4 vColor;
        void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vColor.rgb, vColor.a * t.a); }`,
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = additive ? 3 : 2;
    scene.add(this.points);
  }

  emit(o) {
    if (this.p.length >= this.max) this.p.shift();
    this.p.push({
      x: o.pos.x, y: o.pos.y, z: o.pos.z,
      vx: o.vel?.x || 0, vy: o.vel?.y || 0, vz: o.vel?.z || 0,
      life: o.life, age: 0, s0: o.size, s1: o.sizeEnd ?? o.size,
      c: o.color, a: o.alpha ?? 1, drag: o.drag ?? 1, grav: o.gravity ?? 0,
      tw: o.twinkle || 0, seed: Math.random() * 100,
    });
  }

  update(dt) {
    const arr = this.p;
    let w = 0;
    for (let i = 0; i < arr.length; i++) {
      const q = arr[i];
      q.age += dt;
      if (q.age >= q.life) continue;
      const k = Math.exp(-q.drag * dt);
      q.vx *= k; q.vy = q.vy * k - q.grav * dt; q.vz *= k;
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      if (q.y < 0.02) { q.y = 0.02; q.vy *= -0.3; }
      arr[w++] = q;
    }
    arr.length = w;
    for (let i = 0; i < w; i++) {
      const q = arr[i], t = q.age / q.life;
      this.pos[i * 3] = q.x; this.pos[i * 3 + 1] = q.y; this.pos[i * 3 + 2] = q.z;
      this.col[i * 4] = q.c.r; this.col[i * 4 + 1] = q.c.g; this.col[i * 4 + 2] = q.c.b;
      this.col[i * 4 + 3] = q.a * (1 - t) * Math.min(1, t * 12 + 0.3);
      this.size[i] = (q.s0 + (q.s1 - q.s0) * t) * (q.tw ? 0.35 + 0.65 * Math.abs(Math.sin(q.age * q.tw + q.seed)) : 1);
    }
    this.geo.setDrawRange(0, w);
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
    this.geo.attributes.size.needsUpdate = true;
  }
}

// Tiny ballistic clay chips (instanced, no physics engine cost)
class Chips {
  constructor(scene, max = 400) {
    this.max = max;
    const g = new THREE.TetrahedronGeometry(1, 0);
    this.mesh = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: PALETTE.fracture, roughness: 0.9, flatShading: true }), max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = false;
    scene.add(this.mesh);
    this.c = [];
  }
  emit(pos, vel, size, life = 2.5) {
    if (this.c.length >= this.max) this.c.shift();
    this.c.push({ p: pos.clone(), v: vel.clone(), s: size, life, age: 0,
      q: new THREE.Quaternion().random(), w: new THREE.Vector3().randomDirection().multiplyScalar(15) });
  }
  update(dt) {
    let w = 0;
    for (const c of this.c) {
      c.age += dt;
      if (c.age > c.life) continue;
      c.v.y -= T.physics.gravity * dt;
      c.p.addScaledVector(c.v, dt);
      if (c.p.y < c.s) { c.p.y = c.s; c.v.y *= -0.35; c.v.x *= 0.6; c.v.z *= 0.6; c.w.multiplyScalar(0.6); }
      _q.setFromAxisAngle(_v.copy(c.w).normalize(), c.w.length() * dt);
      c.q.premultiply(_q);
      const sc = c.s * Math.min(1, (c.life - c.age) * 3);
      _m.compose(c.p, c.q, _v.set(sc, sc, sc));
      this.mesh.setMatrixAt(w, _m);
      this.c[w++] = c;
    }
    this.c.length = w;
    this.mesh.count = w;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

export class FX {
  constructor(scene) {
    this.scene = scene;
    this.add = new ParticlePool(scene, 1500, true);
    this.alpha = new ParticlePool(scene, 1500, false);
    this.chips = new Chips(scene);
    this.tracers = [];
    this.trails = [];
    this.timed = [];

    const tracerGeo = new THREE.CylinderGeometry(1, 1, 1, 5, 1, true);
    tracerGeo.translate(0, 0.5, 0);
    tracerGeo.rotateX(Math.PI / 2); // along +Z, from 0..1
    this.tracerGeo = tracerGeo;
    this.tracerMat = new THREE.MeshBasicMaterial({ color: 0xfff1dc, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    this.tracerGlowMat = new THREE.MeshBasicMaterial({ color: PALETTE.glow, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
    this.trailMat = new THREE.LineBasicMaterial({ color: PALETTE.cream, transparent: true, opacity: 0.3, depthWrite: false });

    // muzzle flash: 3 crossed quads with a soft star texture
    const flashTex = radialTexture('rgba(255,250,235,1)', 'rgba(255,160,90,0)');
    const flashMat = new THREE.MeshBasicMaterial({ map: flashTex, color: 0xffd2a8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.flash = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), flashMat);
      if (i === 0) { pl.scale.set(0.9, 0.9, 1); } // facing forward
      else { pl.rotation.y = Math.PI / 2; pl.rotation.x = (i - 1) * Math.PI / 2; pl.scale.set(1.6, 0.55, 1); pl.position.z = 0.35; }
      this.flash.add(pl);
    }
    this.flash.visible = false;
    this.flash.renderOrder = 4;
    scene.add(this.flash);
    this.flashLight = new THREE.PointLight(0xffb27a, 0, 9, 1.6);
    scene.add(this.flashLight);
    this.flashT = 0;

    this.boomLight = new THREE.PointLight(0xff9a5c, 0, 16, 1.4);
    scene.add(this.boomLight);
    this.boomT = 0;

    // bullet hole decals
    const decalTex = radialTexture('rgba(20,8,4,0.95)', 'rgba(20,8,4,0)');
    this.decalMat = new THREE.MeshBasicMaterial({ map: decalTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
    this.decalGeo = new THREE.PlaneGeometry(0.16, 0.16);
    this.decals = [];
    this.beams = [];
    this.rings = [];
  }

  tracer(from, to) {
    const dir = _v.subVectors(to, from);
    const dist = dir.length();
    if (dist < 0.05) return;
    dir.divideScalar(dist);
    const core = new THREE.Mesh(this.tracerGeo, this.tracerMat);
    const glow = new THREE.Mesh(this.tracerGeo, this.tracerGlowMat);
    core.frustumCulled = glow.frustumCulled = false;
    core.renderOrder = glow.renderOrder = 5;
    this.scene.add(core, glow);
    const q = new THREE.Quaternion().setFromUnitVectors(Z, dir);
    this.tracers.push({ core, glow, from: from.clone(), dir: dir.clone(), dist, q, head: 0 });

    // faint lingering smoke line
    const g = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
    const line = new THREE.Line(g, this.trailMat.clone());
    line.frustumCulled = false;
    this.scene.add(line);
    this.trails.push({ line, age: 0 });
  }

  muzzleFlash(pos, dir) {
    this.flash.visible = true;
    this.flash.position.copy(pos);
    this.flash.quaternion.setFromUnitVectors(Z, dir);
    this.flash.rotateZ(Math.random() * Math.PI);
    const s = 0.28 + Math.random() * 0.1;
    this.flash.scale.set(s, s, s);
    this.flashT = 0.05;
    this.flashLight.position.copy(pos).addScaledVector(dir, 0.2);
    this.flashLight.intensity = 30;
    const c = new THREE.Color(PALETTE.cream);
    for (let i = 0; i < 6; i++) {
      const v = _v.copy(dir).multiplyScalar(2 + Math.random() * 3).add(new THREE.Vector3().randomDirection().multiplyScalar(0.8));
      this.alpha.emit({ pos, vel: v, life: 0.5 + Math.random() * 0.4, size: 0.06, sizeEnd: 0.35, color: c, alpha: 0.25, drag: 5 });
    }
  }

  impact(point, normal, { color = PALETTE.pale, sparks = 6, dust = 6, decal = false } = {}) {
    const c = new THREE.Color(color);
    const hot = new THREE.Color(PALETTE.hot);
    for (let i = 0; i < sparks; i++) {
      const v = new THREE.Vector3().randomDirection().add(normal).normalize().multiplyScalar(4 + Math.random() * 6);
      this.add.emit({ pos: point, vel: v, life: 0.15 + Math.random() * 0.2, size: 0.05, sizeEnd: 0.01, color: hot, drag: 3, gravity: 9 });
    }
    for (let i = 0; i < dust; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(0.6).add(_v.copy(normal).multiplyScalar(1 + Math.random() * 1.5));
      this.alpha.emit({ pos: point, vel: v, life: 0.6 + Math.random() * 0.6, size: 0.08, sizeEnd: 0.5, color: c, alpha: 0.45, drag: 3.5, gravity: -0.2 });
    }
    for (let i = 0; i < 4; i++) {
      const v = new THREE.Vector3().randomDirection().add(normal).multiplyScalar(2 + Math.random() * 2);
      this.chips.emit(point, v, 0.012 + Math.random() * 0.012, 1.5);
    }
    if (decal) this.decal(point, normal);
  }

  decal(point, normal) {
    const d = new THREE.Mesh(this.decalGeo, this.decalMat);
    d.position.copy(point).addScaledVector(normal, 0.004);
    d.quaternion.setFromUnitVectors(Z, normal);
    d.rotateZ(Math.random() * Math.PI * 2);
    const s = 0.7 + Math.random() * 0.5;
    d.scale.set(s, s, s);
    this.scene.add(d);
    this.decals.push(d);
    if (this.decals.length > 80) this.scene.remove(this.decals.shift());
  }

  // Dust cloud + chips for a pot bursting (amounts scale with the clay body)
  shatterBurst(center, size, dir, M = { dust: 1, chips: 1 }) {
    const dust = new THREE.Color(PALETTE.pale);
    const n = Math.round(14 * T.shatter.dust * size * M.dust);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(1.5 + Math.random() * 2).addScaledVector(dir, 1.5);
      const p = _v.copy(center).add(new THREE.Vector3().randomDirection().multiplyScalar(0.15 * size));
      this.alpha.emit({ pos: p, vel: v, life: 0.8 + Math.random() * 1.0, size: 0.15 * size, sizeEnd: 0.9 * size, color: dust, alpha: 0.4, drag: 3, gravity: -0.15 });
    }
    const chips = Math.round(T.shatter.chips * M.chips);
    for (let i = 0; i < chips; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(2 + Math.random() * 4).addScaledVector(dir, 2).add(new THREE.Vector3(0, 1.5, 0));
      this.chips.emit(center, v, (0.01 + Math.random() * 0.025) * Math.sqrt(size), 2 + Math.random() * 2);
    }
  }

  // Porcelain "diamond dust": twinkling specks seeded across the vanished pieces
  glitter(points, center, dir, color) {
    const bright = new THREE.Color(PALETTE.hot), tint = color.clone().lerp(new THREE.Color(0xffffff), 0.5);
    for (const p of points) {
      for (let i = 0; i < 7; i++) {
        const v = p.clone().sub(center).normalize().multiplyScalar(1 + Math.random() * 3)
          .addScaledVector(dir, 1.5 + Math.random() * 2).add(new THREE.Vector3().randomDirection().multiplyScalar(0.8));
        this.add.emit({ pos: p, vel: v, life: 0.9 + Math.random() * 1.6, size: 0.022 + Math.random() * 0.02, sizeEnd: 0.012,
          color: Math.random() < 0.5 ? bright : tint, alpha: 0.95, drag: 2.6, gravity: 1.2, twinkle: 25 + Math.random() * 20 });
      }
    }
    const haze = new THREE.Color(PALETTE.cream);
    for (let i = 0; i < 8; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(0.8).addScaledVector(dir, 0.8);
      this.alpha.emit({ pos: center, vel: v, life: 0.9, size: 0.1, sizeEnd: 0.6, color: haze, alpha: 0.25, drag: 3 });
    }
  }

  // Lantern cores spill glowing embers
  embers(center, n = 24) {
    const hot = new THREE.Color(PALETTE.hot), glow = new THREE.Color(PALETTE.glow);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(1 + Math.random() * 2.5).add(new THREE.Vector3(0, 1, 0));
      this.add.emit({ pos: center, vel: v, life: 0.8 + Math.random() * 1.2, size: 0.05, sizeEnd: 0.015, color: Math.random() < 0.5 ? hot : glow,
        drag: 1.2, gravity: 4, twinkle: 12 });
    }
  }

  // Charged shot: thick lingering beam + ring shockwave at the far end
  beam(from, to, power) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = dir.length();
    if (len < 0.05) return;
    dir.divideScalar(len);
    const q = new THREE.Quaternion().setFromUnitVectors(Z, dir);
    const mk = (mat, w) => {
      const m = new THREE.Mesh(this.tracerGeo, mat.clone());
      m.position.copy(from); m.quaternion.copy(q); m.scale.set(w, w, len);
      m.frustumCulled = false; m.renderOrder = 5;
      this.scene.add(m);
      return m;
    };
    const w = 0.03 + 0.05 * power;
    this.beams.push({ parts: [mk(this.tracerMat, w), mk(this.tracerGlowMat, w * 4)], age: 0, life: 0.18 + 0.12 * power, w });
    for (let i = 0; i < 40 * power; i++) {
      const p = from.clone().addScaledVector(dir, Math.random() * len);
      this.add.emit({ pos: p, vel: new THREE.Vector3().randomDirection().multiplyScalar(0.6), life: 0.3 + Math.random() * 0.4,
        size: 0.04, sizeEnd: 0.01, color: new THREE.Color(PALETTE.hot), drag: 2, twinkle: 30 });
    }
  }

  shockwave(center, radius) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 32), new THREE.MeshBasicMaterial({
      color: PALETTE.hot, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    ring.position.copy(center);
    ring.lookAt(this.camPos || center.clone().add(Z));
    ring.renderOrder = 5;
    this.scene.add(ring);
    this.rings.push({ ring, age: 0, life: 0.3, radius });
  }

  // Charging: sparks spiral into the muzzle
  chargeTick(muzzle, level, dt) {
    const n = Math.random() < level * 60 * dt ? 1 + Math.floor(level * 2) : 0;
    const c = new THREE.Color(PALETTE.hot);
    for (let i = 0; i < n; i++) {
      const off = new THREE.Vector3().randomDirection().multiplyScalar(0.25 + Math.random() * 0.2);
      this.add.emit({ pos: muzzle.clone().add(off), vel: off.multiplyScalar(-4.5), life: 0.2, size: 0.03, sizeEnd: 0.005, color: c, drag: 0 });
    }
  }

  explosion(center, radius) {
    const hot = new THREE.Color(PALETTE.hot), glow = new THREE.Color(PALETTE.glow), smoke = new THREE.Color(PALETTE.dark);
    for (let i = 0; i < 60; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(4 + Math.random() * 10);
      this.add.emit({ pos: center, vel: v, life: 0.3 + Math.random() * 0.6, size: 0.08, sizeEnd: 0.02, color: Math.random() < 0.5 ? hot : glow, drag: 2, gravity: 6 });
    }
    for (let i = 0; i < 16; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(2 + Math.random() * 3);
      this.add.emit({ pos: center, vel: v, life: 0.25 + Math.random() * 0.2, size: radius * 0.35, sizeEnd: radius * 0.8, color: glow, alpha: 0.6, drag: 6 });
    }
    for (let i = 0; i < 28; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(1 + Math.random() * 3).add(new THREE.Vector3(0, 1, 0));
      this.alpha.emit({ pos: center, vel: v, life: 1.5 + Math.random() * 1.5, size: 0.4, sizeEnd: 2.2, color: smoke, alpha: 0.5, drag: 2, gravity: -0.4 });
    }
    this.boomLight.position.copy(center).y += 0.5;
    this.boomLight.intensity = 120;
    this.boomT = 0.35;
  }

  // Generic timed callback (used by chain explosions)
  after(delay, fn) { this.timed.push({ t: delay, fn }); }

  update(dt, camera) {
    for (let i = this.timed.length - 1; i >= 0; i--) {
      const e = this.timed[i];
      e.t -= dt;
      if (e.t <= 0) { this.timed.splice(i, 1); e.fn(); }
    }
    // tracers: a bright slug that races from muzzle to impact
    const len = T.tracer.length, w = T.tracer.width;
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.head += T.tracer.speed * dt;
      const head = Math.min(t.head, t.dist);
      const tail = Math.max(0, t.head - len);
      if (tail >= t.dist) {
        this.scene.remove(t.core, t.glow);
        this.tracers.splice(i, 1);
        continue;
      }
      const l = Math.max(0.001, head - tail);
      for (const [m, s] of [[t.core, w], [t.glow, w * 3.2]]) {
        m.position.copy(t.from).addScaledVector(t.dir, tail);
        m.quaternion.copy(t.q);
        m.scale.set(s, s, l);
      }
    }
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const tr = this.trails[i];
      tr.age += dt;
      const k = 1 - tr.age / T.tracer.trailLife;
      if (k <= 0) { this.scene.remove(tr.line); tr.line.geometry.dispose(); tr.line.material.dispose(); this.trails.splice(i, 1); continue; }
      tr.line.material.opacity = T.tracer.trailOpacity * k * k;
    }
    if (this.flashT > 0) {
      this.flashT -= dt;
      this.flashLight.intensity = Math.max(0, this.flashT / 0.05) * 30;
      if (this.flashT <= 0) { this.flash.visible = false; this.flashLight.intensity = 0; }
    }
    if (this.boomT > 0) {
      this.boomT -= dt;
      this.boomLight.intensity = Math.max(0, this.boomT / 0.35) ** 2 * 120;
    }
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.age += dt;
      const k = 1 - b.age / b.life;
      if (k <= 0) { for (const m of b.parts) { this.scene.remove(m); m.material.dispose(); } this.beams.splice(i, 1); continue; }
      b.parts.forEach((m, j) => { const w = b.w * (j ? 4 : 1) * (0.4 + 0.6 * k); m.scale.x = m.scale.y = w; m.material.opacity = (j ? 0.5 : 1) * k; });
    }
    this.camPos = camera.position;
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.age += dt;
      const t = r.age / r.life;
      if (t >= 1) { this.scene.remove(r.ring); r.ring.geometry.dispose(); r.ring.material.dispose(); this.rings.splice(i, 1); continue; }
      r.ring.scale.setScalar(0.2 + r.radius * (1 - (1 - t) ** 3));
      r.ring.lookAt(camera.position);
      r.ring.material.opacity = (1 - t) * 0.9;
    }
    this.add.update(dt);
    this.alpha.update(dt);
    this.chips.update(dt);
    const h = window.innerHeight;
    const fov = camera.fov * Math.PI / 180;
    const scale = (h / (2 * Math.tan(fov / 2))) * (this.pixelRatio || 1);
    this.add.mat.uniforms.scale.value = scale;
    this.alpha.mat.uniforms.scale.value = scale;
  }
}
