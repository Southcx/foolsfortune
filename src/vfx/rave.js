// ---------------------------------------------------------------------------------------
// RAVE: what a prismatic chest does to the room: about seven seconds of blacklight rave, on the beat of a synthesized four-on-the-floor
// (audio/sfx.js raveLoop, 124 bpm), then the lights come back up. Everything in it is a thing that is actually there, moving:
//
//   THE DARK       the room's own lights go nearly out and turn violet (mood.js), so that what is left is what glows.
//   BEAMS          eight cones of coloured light from the ceiling, each swept round the chest along its own figure, with a soft pool of
//                  light where it lands on the floor.
//   THE BALL       a mirror ball lowers on a wire and turns; forty specks of light are cast from it (a ray from its middle for each, so
//                  they fall on whatever the room really has: walls, the floor, the plinths) and turn with it.
//   BLACKLIGHT     neon splatter, zig-zags and stars on the walls around, fading in: the paint that only shows under an ultraviolet lamp.
//   THE FLOOR      a ring of coloured light goes out over the floor on every beat.
//   THE CUBES      the Lachryma cubes glow (cubes.glow), their film turning through the spectrum with the bars.
//   THE CAMERA     four cuts on the bar lines: an orbit, a low shot up into the beams and the ball, a close one on what the chest gave,
//                  and a crane out to the whole room. Cuts land on beats.
//
// Nothing strobes: colours turn and sweep, the only thing that pulses is a ring of light leaving the floor twice a second, and the
// dark comes down once, in a quarter of a second. (The rule of the project's comfort section: nothing that flickers over a large
// part of the screen at a variable rate.)
//
// Prior art: the light show of a club and the blacklight parties before it (UV-reactive paint, white and neon that glow, the beams),
// the mirror ball's cast light (its facets throw a spot each), the "rave" set pieces of Rez (the world becomes a beat), Jet Set Radio
// and Persona 5's "all-out" moments (cut on the bar, colour that owns the frame), and Just Dance's stage. The music is a plain house
// pattern (kick, offbeat bass, claps, hats, an arpeggio that opens up), because that is what a club plays.
//
//   const rave = new Rave(game);   rave.start(ceremony);   rave.update(rawDt);   rave.stop();   rave.active
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GROUPS } from '../core/physics.js';
import { sfx } from '../audio/sfx.js';

const BPM = 124, SPB = 60 / BPM, BEATS = 14, DUR = BEATS * SPB;
const NEON = [0xff2fb0, 0x22e8ff, 0xb6ff2a, 0xff8a1f, 0x9a5cff, 0xffe600, 0xff3a3a, 0x3a7bff];
const N_BEAMS = 8, N_SPECKS = 40, N_DECALS = 8;
const D = THREE.MathUtils.damp, lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _q = new THREE.Quaternion(), _col = new THREE.Color(), _m = new THREE.Matrix4();
const DOWN = new THREE.Vector3(0, -1, 0), Z = new THREE.Vector3(0, 0, 1);

const CONE_V = `
varying float vY; varying vec3 vN; varying vec3 vV;
void main() {
  vY = -position.y / ${'LEN'};
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const CONE_F = `
uniform vec3 uColor; uniform float uOpacity;
varying float vY; varying vec3 vN; varying vec3 vV;
void main() {
  float fall = pow(1.0 - clamp(vY, 0.0, 1.0), 1.15);
  float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
  gl_FragColor = vec4(uColor, uOpacity * fall * edge);
  #include <colorspace_fragment>
}`;

/** The paint that only shows under a black light: neon splatter, zig-zags, stars, drips and rings, on one transparent sheet. */
function uvSheet(seed) {
  const s = 512, c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d');
  let r = seed * 9301 + 49297; const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  const col = () => `#${NEON[Math.floor(rnd() * NEON.length)].toString(16).padStart(6, '0')}`;
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (let i = 0; i < 5; i++) { // splatter: a blob, satellites, and a drip
    const x = rnd() * s, y = rnd() * s * 0.8, R = 22 + rnd() * 46, k = col();
    g.fillStyle = k; g.shadowColor = k; g.shadowBlur = 16;
    g.beginPath(); g.arc(x, y, R, 0, 7); g.fill();
    for (let j = 0; j < 8; j++) { const a = rnd() * 6.28, d = R * (1.2 + rnd() * 1.6); g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 3 + rnd() * 9, 0, 7); g.fill(); }
    g.fillRect(x - 4, y, 8, R + 20 + rnd() * 90);
  }
  for (let i = 0; i < 4; i++) { // zig-zags and spirals
    const k = col(); g.strokeStyle = k; g.shadowColor = k; g.shadowBlur = 14; g.lineWidth = 7 + rnd() * 5;
    g.beginPath(); let x = rnd() * s, y = rnd() * s;
    if (i % 2) { for (let j = 0; j < 7; j++) { x += 26; y += (j % 2 ? 34 : -34); g.lineTo(x, y); } }
    else { const cx = x, cy = y; for (let a = 0; a < 15; a += 0.3) g.lineTo(cx + Math.cos(a) * (4 + a * 5), cy + Math.sin(a) * (4 + a * 5)); }
    g.stroke();
  }
  for (let i = 0; i < 3; i++) { // stars
    const k = col(), x = rnd() * s, y = rnd() * s, R = 26 + rnd() * 26; g.fillStyle = k; g.shadowColor = k; g.shadowBlur = 18;
    g.beginPath(); for (let j = 0; j < 10; j++) { const a = j / 10 * 6.283 - 1.57, rr = j % 2 ? R * 0.45 : R; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Rave {
  constructor(game) {
    this.game = game;
    this.active = false; this.t = 0; this.stopping = false;
    const scene = game.scene;
    this.root = new THREE.Group(); this.root.visible = false; scene.add(this.root);
    // ---- the beams: a cone from a fixture, and a pool of light where it lands
    this.beams = [];
    const BL = 9; // (the length they are built to; they are scaled to the height of the room)
    const geo = new THREE.ConeGeometry(1, 1, 28, 1, true); geo.translate(0, -0.5, 0); geo.scale(1, BL, 1);
    for (let i = 0; i < N_BEAMS; i++) {
      const mat = new THREE.ShaderMaterial({ uniforms: { uColor: { value: new THREE.Color(NEON[i]) }, uOpacity: { value: 0 } }, vertexShader: CONE_V.replace('LEN', BL.toFixed(1)), fragmentShader: CONE_F,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
      const cone = new THREE.Mesh(geo, mat); cone.frustumCulled = false; cone.renderOrder = 6; this.root.add(cone);
      const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshBasicMaterial({ map: game.fx.haloTexture, color: NEON[i], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, toneMapped: false }));
      pool.rotation.x = -Math.PI / 2; pool.renderOrder = 3; this.root.add(pool);
      this.beams.push({ cone, pool, mat, ph: i / N_BEAMS * 6.283, sp: 0.55 + (i % 3) * 0.22, rad: 1.2 + (i % 4) * 0.75, fix: new THREE.Vector3(), aim: new THREE.Vector3() });
    }
    // ---- the mirror ball on its wire, and the light it throws
    this.ball = new THREE.Group(); this.root.add(this.ball);
    const facets = new THREE.Mesh(new THREE.IcosahedronGeometry(0.44, 2), new THREE.MeshStandardMaterial({ color: 0xdfe4ff, metalness: 1, roughness: 0.12, flatShading: true, envMap: game.sky?.env ?? null, envMapIntensity: 1.0, emissive: 0x201048, emissiveIntensity: 0.6 }));
    this.ball.add(facets); this.facets = facets;
    this.wire = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 5), new THREE.MeshBasicMaterial({ color: 0x9a9ab0 })); this.root.add(this.wire);
    this.dirs = []; this.specks = [];
    const sg = new THREE.PlaneGeometry(0.24, 0.24);
    for (let i = 0; i < N_SPECKS; i++) {
      const d = new THREE.Vector3().randomDirection(); if (d.y > 0.25) d.y *= -0.6; d.normalize(); this.dirs.push(d);
      const m = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ color: NEON[i % NEON.length], transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
      m.renderOrder = 4; m.visible = false; this.root.add(m); this.specks.push(m);
    }
    // ---- the black light's paint: sheets on the walls around
    this.sheets = [uvSheet(1), uvSheet(2), uvSheet(3), uvSheet(4)];
    this.decals = [];
    for (let i = 0; i < N_DECALS; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.sheets[i % 4], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, toneMapped: false }));
      m.renderOrder = 3; m.visible = false; this.root.add(m); this.decals.push(m);
    }
    this.k = 0; this.beat = 0; this.beatI = -1; this.sp = 0;
  }

  // (no warm-up of its own: a hitch at the first chest would be the show's worst moment, and the boot's warm-up covers it, compiling
  //  every material in the scene, hidden or not, and drawing everything hidden once: main.js. Its own warm-up compiled the whole scene
  //  before the God Hand's cutaway plane was installed, thirteen programs for a clipping state no frame draws with: the casebook, 2026-10-08)

  // ---------------------------------------------------------------- start / stop
  start(cer) {
    if (this.active) return;
    const g = this.game, c = cer.c;
    this.active = true; this.stopping = false; this.t = 0; this.beatI = -1;
    this.cer = cer; this.center = c.clone(); this.floor = cer.chest.floor; this.base = cer.base;
    // the room: how high is the ceiling above the chest? (a ray up; open sky is 8 m)
    const up = g.physics.raycast(_a.copy(c).setY(c.y + 0.6), _b.set(0, 1, 0), 14, cer.chest.col, GROUPS.controllerQuery);
    this.ceil = up ? up.point.y - 0.15 : c.y + 8;
    this.ballY = Math.min(c.y + 3.6, this.ceil - 1.0);
    this.root.visible = true;
    // the decals go on the walls around the chest, wherever the room has them
    let n = 0;
    for (let i = 0; i < 26 && n < N_DECALS; i++) {
      const a = (i / 26) * 6.283 + Math.random() * 0.4, dir = _a.set(Math.cos(a), (Math.random() - 0.3) * 0.5, Math.sin(a)).normalize();
      const org = _b.copy(c).setY(this.floor + 1.4 + Math.random() * 1.2);
      const hit = g.physics.raycast(org, dir, 16, cer.chest.col, GROUPS.controllerQuery);
      if (!hit || hit.distance < 2.2) continue;
      const m = this.decals[n++];
      m.visible = true; m.position.copy(hit.point).addScaledVector(hit.normal, 0.04);
      m.quaternion.setFromUnitVectors(Z, hit.normal); m.rotateZ(Math.random() * 6.283);
      m.scale.setScalar(1.8 + Math.random() * 1.8);
      m.material.opacity = 0;
    }
    for (let i = n; i < N_DECALS; i++) this.decals[i].visible = false;
    // the fixtures: a ring of them on the ceiling around the chest
    this.beams.forEach((b, i) => { const a = i / N_BEAMS * 6.283; b.fix.set(c.x + Math.cos(a) * 2.6, this.ceil - 0.2, c.z + Math.sin(a) * 2.6); });
    // the lights, and the music
    g.mood.set('rave', { dim: 0.94, tint: 0x230a4a, tintK: 0.9, fog: 1, ease: 10 });
    this.audio = sfx.raveLoop?.(BPM) || null;
    g.events.emit('rave.start', {});
    this.camA = Math.atan2(cer.front.x, cer.front.z) + 0.95;
  }

  stop(fast = false) {
    if (!this.active || this.stopping) return;
    this.stopping = true; this.fade = fast ? 0.25 : 0.9;
    this.audio?.stop(fast ? 0.25 : 0.6); this.audio = null;
    this.game.mood.free('rave');
    this.game.cinema.unshot('rave');
    this.game.cubes.glow(0x2a1450, 0);
    this.stopT = 0;
  }

  /** How far into the beat we are, from the audio clock if there is one. */
  phase() { return this.audio ? this.audio.phase() : this.t / SPB; }

  // ---------------------------------------------------------------- per frame (real seconds: the show does not slow with the world)
  update() {
    if (!this.active) return;
    const g = this.game, dt = g.rawDt || 0.016;
    this.t += dt;
    const ph = this.phase(), bi = Math.floor(ph), frac = ph - bi;
    if (this.stopping) {
      this.stopT += dt; const k = 1 - this.stopT / this.fade;
      this.k = Math.max(0, k);
      if (k <= 0) { this.finish(); return; }
    } else {
      this.k = D(this.k, 1, 6, dt);
      if (this.t >= DUR) { this.finale(); this.stop(); }
    }
    const k = this.k;
    // a beat has happened: a ring goes out over the floor, the cubes flare, the hue steps
    if (bi !== this.beatI && bi >= 0) {
      this.beatI = bi;
      if (!this.stopping) {
        g.chests.ringBurst(_a.copy(this.center).setY(this.floor + 0.04), NEON[bi % NEON.length], 5 + (bi % 4 === 0 ? 2 : 0), 0.85, true);
        g.player.fovPunch = Math.max(g.player.fovPunch || 0, bi % 4 === 0 ? 2.4 : 1.1);
        if (bi % 4 === 0) g.player.shake = Math.max(g.player.shake, 0.08);
      }
    }
    const pulse = Math.pow(1 - frac, 2.2);                              // (the envelope of a kick)
    _col.setHSL((ph * 0.09) % 1, 0.9, 0.6);
    g.cubes.glow(_col, k * (0.35 + 1.1 * pulse));
    g.cubes.uni.uHue.value = (ph * 0.11) % 1;
    // the light on the chest
    const L = g.chests.light; L.color.setHSL((ph * 0.06 + 0.75) % 1, 0.9, 0.6); L.intensity = k * (2.5 + 5 * pulse);
    L.position.copy(this.center).setY(this.center.y + 1.1);
    // the beams
    const ceil = this.ceil, len = ceil - this.floor;
    this.beams.forEach((b, i) => {
      const a = ph * 0.5 * b.sp * 3.14 + b.ph, r = b.rad * (1 + 0.5 * Math.sin(ph * 0.35 + i));
      b.aim.set(this.center.x + Math.cos(a) * r, this.floor, this.center.z + Math.sin(a * 1.3) * r * 0.85);
      _a.subVectors(b.aim, b.fix); const L2 = _a.length(); _a.divideScalar(L2 || 1);
      b.cone.position.copy(b.fix); b.cone.quaternion.setFromUnitVectors(DOWN, _a);
      const w = Math.tan(0.13 + 0.03 * Math.sin(ph + i)) * L2;               // (the width at the far end)
      b.cone.scale.set(w, L2 / 9, w);
      const on = k * (this.t > 0.25 + i * 0.06 ? 1 : 0);
      b.mat.uniforms.uOpacity.value = on * (0.42 + 0.22 * pulse);
      b.mat.uniforms.uColor.value.setHSL(((i / N_BEAMS) + ph * 0.02) % 1, 1, 0.58);
      b.pool.position.copy(b.aim).setY(this.floor + 0.03); b.pool.scale.setScalar(0.9 + w * 0.9);
      b.pool.material.opacity = on * 0.7; b.pool.material.color.copy(b.mat.uniforms.uColor.value);
    });
    // the ball: lowers on its wire, turns, and its specks fall where its rays end
    const lower = this.stopping ? k : easeOutBack(clamp(this.t / 0.9, 0, 1)), by = lerp(ceil, this.ballY, lower);
    this.ball.position.set(this.center.x, by, this.center.z);
    this.ball.rotation.y += dt * 0.9; this.ball.scale.setScalar(1 + 0.08 * pulse);
    this.wire.position.set(this.center.x, (by + ceil) / 2 + 0.4, this.center.z); this.wire.scale.set(1, Math.max(0.01, ceil - by), 1);
    this.facets.material.emissiveIntensity = 0.5 + 1.2 * pulse;
    this.castSpecks(k);
    // the black light's paint fades in
    for (const m of this.decals) if (m.visible) m.material.opacity = 0.7 * k * (this.stopping ? 1 : clamp((this.t - 0.15) / 0.9, 0, 1)) * (0.75 + 0.25 * pulse);
    if (!this.stopping) this.camera(ph);
  }

  /** The specks: a ray from the ball's middle along each fixed direction (turning with the ball); where it hits, a spot of light. */
  castSpecks(k) {
    const g = this.game, o = this.ball.position, ry = this.ball.rotation.y;
    const cos = Math.cos(ry), sin = Math.sin(ry);
    this.sp ^= 1; // (half of them each frame: the ball turns slowly, and a ray each is the cost)
    for (let i = this.sp; i < N_SPECKS; i += 2) {
      const d = this.dirs[i], m = this.specks[i];
      _a.set(d.x * cos + d.z * sin, d.y, -d.x * sin + d.z * cos);
      const hit = k > 0.05 ? g.physics.raycast(o, _a, 22, this.cer.chest.col, GROUPS.controllerQuery) : null;
      if (!hit) { m.visible = false; continue; }
      m.visible = true; m.position.copy(hit.point).addScaledVector(hit.normal, 0.03);
      m.quaternion.setFromUnitVectors(Z, hit.normal);
      m.material.opacity = k * 0.85 * clamp(1.4 - hit.distance / 18, 0.2, 1);
      m.scale.setScalar(0.7 + 0.5 * (i % 3) / 2);
    }
  }

  // ---------------------------------------------------------------- the camera: four cuts, on bars
  camera(ph) {
    const g = this.game, c = this.center, p = clamp(ph, 0, BEATS);
    const cer = this.cer, rig = cer.chest.rig;
    let pos = _a, look = _b, fov = 0, roll = 0;
    const top = this.base + 0.7;
    if (p < 4) {                    // an orbit, close and low, round the chest
      const a = this.camA + p * 0.22;
      pos.set(c.x + Math.cos(a) * 3.2, this.base + 1.0, c.z + Math.sin(a) * 3.2); look.set(c.x, top, c.z); fov = -6; roll = 0.05 * Math.sin(p);
    } else if (p < 8) {             // a low shot from the floor up into the beams and the ball
      const a = this.camA + 2.6 - (p - 4) * 0.1;
      pos.set(c.x + Math.cos(a) * 2.6, this.floor + 0.3, c.z + Math.sin(a) * 2.6); look.set(c.x, lerp(top + 0.6, this.ballY - 0.3, clamp((p - 4) / 3, 0, 1)), c.z); fov = 8; roll = -0.07;
    } else if (p < 11) {            // in close on what the chest gave, from the front, a little below
      const a = Math.atan2(cer.front.x, cer.front.z) - 0.35 + (p - 8) * 0.05;
      pos.set(c.x + Math.cos(a) * 2.5, this.base + 1.2, c.z + Math.sin(a) * 2.5); look.set(c.x, this.base + 1.85, c.z); fov = -9; roll = 0.03;
    } else {                        // out, and up: the whole room
      const q = (p - 11) / 3, a = this.camA + 4 + q * 0.5, r = lerp(3.6, 6.6, q);
      pos.set(c.x + Math.cos(a) * r, this.base + lerp(1.4, 3.4, q), c.z + Math.sin(a) * r); look.set(c.x, top + 0.4, c.z); fov = lerp(0, 6, q); roll = 0.02;
    }
    // (never through a wall)
    const dir = _c.subVectors(pos, look), len = dir.length(); dir.divideScalar(len || 1);
    const hit = g.physics.raycast(look, dir, len + 0.25, cer.chest.col, GROUPS.controllerQuery);
    if (hit) pos.copy(look).addScaledVector(dir, Math.max(0.8, hit.distance - 0.25));
    g.cinema.shot('rave', { pos, look, fov, roll, bars: 1, ease: 9 });
  }

  /** The last beat: one ring after another, and a bang. */
  finale() {
    const g = this.game;
    for (let i = 0; i < 4; i++) g.chests.ringBurst(_a.copy(this.center).setY(this.floor + 0.05 + i * 0.01), NEON[(i * 2) % NEON.length], 5 + i * 2.5, 0.9, i % 2 === 0);
    g.player.shake = Math.max(g.player.shake, 0.4); g.player.fovPunch = Math.max(g.player.fovPunch || 0, 8);
    sfx.chestBurst(4);
  }

  finish() {
    this.active = false; this.stopping = false;
    this.game.cinema.unshot('rave'); this.game.mood.free('rave');
    this.root.visible = false;
    for (const m of this.decals) m.visible = false;
    for (const m of this.specks) m.visible = false;
    const L = this.game.chests.light; L.intensity = 0;
    this.game.cubes.glow(0x2a1450, 0);
    this.game.events.emit('rave.end', {});
  }
}

const easeOutBack = (x) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
