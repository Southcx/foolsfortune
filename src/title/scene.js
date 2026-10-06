// ---------------------------------------------------------------------------------------
// THE FOOL'S PRECIPICE: the title (docs/PLAN.md, piece 1; the owner's references in docs/ref/). Not the workshop: the moment before
// setting out. The Courier sits on the lip of a crooked hill under a twisted tree, legs over the edge, a clapperjar at their side (the
// Fool's little dog); below and beyond, a checkerboard sea bends down into a slow whirlpool, its giant pieces playing a game on the
// beat (title/board.js); tarot cards fall like leaves, a spiral moon with a face hangs over it all, and motes of Lachryma rise.
//
// PRESS START, and they take THE FOOL'S STEP: stands, and steps off the edge, and the camera goes down after them while the menu comes
// in; they hang in the fall, cards turning round them, until a choice is made; then the camera dives after them into the spiral and the
// world is there (no load: it was built behind the title). It is drawn by the game's own renderer and its own post (the 480 lines, the
// glow and the grade), with a Courier of its own (the same model and clips: character.js), so the game itself does not run behind it.
//
// Prior art: the tarot's Fool (the step off the cliff, the dog at his heel, the sun or the moon over him), Kingdom Hearts' titles (a
// world drifting behind the menu, Sora on the island looking out), Wind Waker's living title, and the attract loops of the PS2: a title
// that is a place you could be in.
//
//   const t = new TitleScene(game, { charG, gunG, clipPack, clapG })   t.update(dt)   t.render()   t.state   t.go() / t.dive(onDone)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Character } from '../courier/character.js';
import { Board } from './board.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

const _v = new THREE.Vector3(), _w = new THREE.Vector3();
const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const OWN_BPM = 100;
// where the board lies, from the hill (the hill's lip is the origin; they look down -Z into the spiral)
const BOARD_AT = new THREE.Vector3(0, -34, -120);

export class TitleScene {
  constructor(game, { charG, gunG, clipPack, clapG }) {
    this.game = game;
    const S = (this.scene = new THREE.Scene());
    S.fog = new THREE.Fog(0x3a2550, 140, 520);
    this.camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 2000);
    addEventListener('resize', () => { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); });
    this.sky(); this.moon(); this.hill(); this.lights();
    this.board = new Board(S); this.board.group.position.copy(BOARD_AT);
    this.cards(); this.motes();
    // the Courier: a vessel of their own for the title (the same model and clips; posed straight from the UAL clips, no IK)
    this.ch = new Character(S, charG, gunG, clipPack);
    this.ch.gun.visible = false; this.ch.gunOff = true;
    this.pose = this.ch.clips.pose();
    this.ch.root.rotation.y = Math.PI; // (facing out, down -Z, into the spiral)
    // the Fool's little dog: a clapperjar, sitting by them
    this.jar = cloneSkinned(clapG.scene); // (a skinned clone of its own: Object3D.clone kept the model's own bones, so the jar was drawn where they were, not where it was put)
    this.jar.scale.setScalar(0.85); this.jar.position.set(0.6, 0, -0.58); this.jar.rotation.y = Math.PI + 0.3; // (beside them on the lip, level with them and looking out over the sea with them, not behind their back: the owner, 2026-10-06)
    const clay = new THREE.MeshStandardMaterial({ color: 0xc8805a, roughness: 0.8, flatShading: true }); // (the jars are glazed at run time by clappers.js: here, plain terracotta)
    this.jar.traverse((o) => { if (o.isMesh) { o.material = clay; o.castShadow = false; } });
    S.add(this.jar);
    this.state = 'idle'; this.t = 0; this.st = 0; this.ownT0 = performance.now() / 1000;
    this.fall = new THREE.Vector3();
  }

  // ---------------------------------------------------------------- the set
  sky() {
    const g = new THREE.SphereGeometry(1500, 24, 16);
    const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uTop: { value: new THREE.Color(0x0b0614) }, uMid: { value: new THREE.Color(0x2a1640) }, uLow: { value: new THREE.Color(0x5a3260) } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uTop, uMid, uLow; varying vec3 vP; void main(){ float y = vP.y; vec3 c = y > 0.0 ? mix(uMid, uTop, smoothstep(0.0, 0.6, y)) : mix(uMid, uLow, smoothstep(0.0, -0.4, y)); gl_FragColor = vec4(c, 1.0); }' });
    this.scene.add(new THREE.Mesh(g, m));
    // stars: steady (no twinkle: nothing that flickers), a few brighter
    const n = 700, p = new Float32Array(n * 3), c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = _v.randomDirection(); v.y = Math.abs(v.y) * 0.9 + 0.08; v.normalize().multiplyScalar(1200);
      p.set([v.x, v.y, v.z], i * 3); const b = 0.4 + Math.random() * 0.6; c.set([b, b * 0.95, b * 0.85], i * 3);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(p, 3)); sg.setAttribute('color', new THREE.BufferAttribute(c, 3));
    this.scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, fog: false })));
  }
  moon() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(128, 128, 60, 128, 128, 128); grd.addColorStop(0, 'rgba(255,240,214,0.35)'); grd.addColorStop(1, 'rgba(255,240,214,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#f4e6cc'; g.beginPath(); g.arc(128, 128, 72, 0, Math.PI * 2); g.fill();
    // its spiral, and its face in the spiral (the owner's Fool card)
    g.strokeStyle = '#b8a3c8'; g.lineWidth = 5; g.beginPath();
    for (let a = 0; a < Math.PI * 7; a += 0.05) { const r = 4 + a * 2.9; g.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); }
    g.stroke();
    g.fillStyle = '#4a3058'; for (const x of [104, 152]) { g.beginPath(); g.ellipse(x, 116, 7, 10, 0, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = '#4a3058'; g.lineWidth = 5; g.beginPath(); g.arc(128, 140, 22, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, fog: false, depthWrite: false }));
    s.position.set(-360, 150, -260); s.scale.setScalar(150);
    this.scene.add(s); this.moonS = s;
  }
  hill() {
    const S = this.scene;
    const rock = new THREE.MeshStandardMaterial({ color: 0x46304a, roughness: 0.9, flatShading: true });
    const moss = new THREE.MeshStandardMaterial({ color: 0x3c4a3a, roughness: 1, flatShading: true });
    const bark = new THREE.MeshStandardMaterial({ color: 0x2c1c26, roughness: 0.95, flatShading: true });
    const leaf = new THREE.MeshStandardMaterial({ color: 0x3a2a48, roughness: 1, flatShading: true });
    // the crooked hill: a spire leaning out over the board, twisted, its top a small flat lip (they sit at the origin, the lip at -Z)
    const prof = []; for (let i = 0; i <= 14; i++) { const y = -i * 6; prof.push(new THREE.Vector2(1.6 + i * i * 0.09 + (i % 3) * 0.4, y)); }
    prof.unshift(new THREE.Vector2(0, 0.02)); prof.splice(1, 0, new THREE.Vector2(1.5, 0.02));
    const hg = new THREE.LatheGeometry(prof.reverse(), 9);
    const pos = hg.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i), k = Math.min(1, -y / 80), a = k * 1.4; // (a twist that grows downward, and a lean toward the board)
      let x = pos.getX(i), z = pos.getZ(i);
      [x, z] = [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)];
      const n = Math.sin(y * 0.7 + x) * 0.5 + Math.cos(z * 0.9 - y * 0.3) * 0.4;
      pos.setXYZ(i, x + n + k * k * 6, y, z + n - k * 10); // (leaning out over the board, -Z)
    }
    hg.computeVertexNormals();
    const h = new THREE.Mesh(hg, rock); h.position.set(0, 0, 0.6); S.add(h);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.5, 0.25, 9), moss); cap.position.set(0, -0.08, 0.7); S.add(cap);
    // the twisted tree behind them, arching over (the Fool card's tree)
    const trunk = new THREE.CatmullRomCurve3([[-1.3, -0.2, 1.1], [-1.9, 1.6, 1.5], [-1.4, 3.4, 0.9], [-0.4, 4.6, 0.2], [0.9, 5.1, -0.9], [2.0, 4.6, -1.9]].map((p) => new THREE.Vector3(...p)));
    S.add(new THREE.Mesh(new THREE.TubeGeometry(trunk, 40, 0.26, 6, false), bark));
    for (const pts of [[[-1.4, 3.4, 0.9], [-2.6, 4.6, 0.3], [-3.4, 5.4, -0.4]], [[-0.4, 4.6, 0.2], [-0.6, 6.0, -0.6], [-1.2, 6.8, -1.4]], [[0.9, 5.1, -0.9], [1.6, 6.2, -0.7]]]) {
      S.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 16, 0.1, 5, false), bark));
    }
    for (const [x, y, z, r] of [[-3.4, 5.6, -0.5, 1.1], [-1.2, 7.0, -1.5, 1.3], [1.7, 6.3, -0.8, 1.0], [2.2, 4.9, -2.1, 0.8], [-2.2, 6.2, 0.1, 0.9]]) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), leaf); b.position.set(x, y, z); b.rotation.set(x, y, z); S.add(b);
    }
    // roots over the lip
    for (const pts of [[[-1.2, -0.1, 1.0], [-0.8, -0.6, 0.0], [-1.1, -1.8, -0.6]], [[-1.3, -0.1, 1.2], [-2.0, -0.8, 1.3], [-2.4, -2.2, 0.8]]]) {
      S.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 12, 0.09, 5, false), bark));
    }
  }
  lights() {
    const S = this.scene;
    S.add(new THREE.HemisphereLight(0x9a8ac8, 0x2a1838, 1.1));
    const moon = new THREE.DirectionalLight(0xe6dcff, 2.2); moon.position.set(-360, 150, -260).normalize().multiplyScalar(50); S.add(moon);
    const fill = new THREE.DirectionalLight(0xffb27a, 0.7); fill.position.set(6, 3, 8); S.add(fill); // (a warm rim from behind them: the world they are leaving)
  }
  cards() {
    // a tarot card's back (after the owner's: a mirrored pattern of moons and stars, plum and cream)
    const c = document.createElement('canvas'); c.width = 64; c.height = 104;
    const g = c.getContext('2d');
    g.fillStyle = '#e8d7b6'; g.fillRect(0, 0, 64, 104); g.fillStyle = '#3a2148'; g.fillRect(3, 3, 58, 98);
    g.fillStyle = '#d9c7b0';
    for (const [x, y, r] of [[32, 52, 9], [32, 18, 6], [32, 86, 6], [14, 34, 4], [50, 34, 4], [14, 70, 4], [50, 70, 4]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#3a2148'; g.beginPath(); g.arc(35, 50, 7, 0, Math.PI * 2); g.fill();
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
    const m = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.6 });
    const geo = new THREE.PlaneGeometry(0.62, 1.0);
    this.cardList = [];
    for (let i = 0; i < 22; i++) {
      const mesh = new THREE.Mesh(geo, m); this.scene.add(mesh);
      const k = { mesh, spin: new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2), sway: Math.random() * 6.28, speed: 0.6 + Math.random() * 0.8 };
      this.resetCard(k, true); this.cardList.push(k);
    }
  }
  resetCard(k, anywhere = false) {
    const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 22;
    k.mesh.position.set(Math.cos(a) * r, anywhere ? -30 + Math.random() * 45 : 16 + Math.random() * 6, -6 + Math.sin(a) * r - 10);
    k.mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
  }
  motes() {
    const n = 220, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) p.set([(Math.random() - 0.5) * 60, -40 + Math.random() * 60, -10 - Math.random() * 70], i * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    this.moteP = g;
    this.scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffe9c8, size: 0.18, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending })));
  }

  // ---------------------------------------------------------------- the beat (the music's, or the title's own)
  beat() {
    const G = this.game.music?.grid?.();
    const now = G ? this.game.music.ctx.currentTime : performance.now() / 1000;
    const spb = G ? G.spb : 60 / OWN_BPM, beats = G ? G.beats : 4, t0 = G ? G.t0 : this.ownT0;
    const b = (now - t0) / spb;
    return { spb, bar: Math.floor(b / beats), beat: Math.floor(b) % beats, phase: b - Math.floor(b) };
  }

  // ---------------------------------------------------------------- the states
  /** PRESS START: the Fool's Step. */
  go() { if (this.state !== 'idle') return; this.state = 'step'; this.st = 0; }
  /** A choice made: the camera dives after them into the spiral; `done` when the world is to be shown. */
  dive(done) { this.state = 'dive'; this.st = 0; this.onDived = done; }

  update(dt) {
    this.t += dt; this.st += dt;
    const beat = this.beat();
    this.board.update(dt, beat);
    // the cards fall like leaves; the motes rise; the jar breathes (it yaps when they stand)
    for (const k of this.cardList) {
      const m = k.mesh; k.sway += dt;
      m.position.y -= k.speed * dt * (this.state === 'menu' || this.state === 'step' ? 1.3 : 1);
      m.position.x += Math.sin(k.sway * 0.9) * dt * 0.6;
      m.rotation.x += k.spin.x * dt * 0.5; m.rotation.y += k.spin.y * dt * 0.5; m.rotation.z += k.spin.z * dt * 0.3;
      if (m.position.y < this.fall.y - 40) this.resetCard(k);
    }
    const mp = this.moteP.attributes.position;
    for (let i = 0; i < mp.count; i++) { let y = mp.getY(i) + dt * (0.6 + (i % 5) * 0.2); if (y > 22) y = -40; mp.setY(i, y); }
    mp.needsUpdate = true;
    this.jar.position.y = Math.abs(Math.sin(this.t * 2.2)) * 0.03 + (this.state === 'step' && this.st < 1 ? Math.abs(Math.sin(this.st * 14)) * 0.12 : 0);
    this.poseCourier(dt);
    this.cameraPath(dt);
  }

  poseCourier() {
    const ch = this.ch, C = ch.clips, P = this.pose;
    const root = ch.root;
    let clip = 'sitIdle', ct = this.t, loop = true;
    root.position.set(0, -0.42, -0.62); // (seated on the lip, legs over it)
    if (this.state === 'step' || this.state === 'menu' || this.state === 'dive') {
      const u = this.state === 'step' ? this.st : 99;
      const exitD = C.clips.sitExit?.dur ?? 1.2;
      if (u < exitD) { clip = 'sitExit'; ct = u; loop = false; root.position.z = -0.62 + smooth(0, exitD, u) * 0.3; root.position.y = -0.42 + smooth(0, exitD, u) * 0.42; }
      else {
        // the step: up and out over the edge, then the long fall (slowed while the menu is open)
        const f = u - exitD;
        const out = Math.min(f, 0.6);
        const fallT = this.state === 'step' ? Math.max(0, f - 0.25) : 1.15 + this.st * (this.state === 'dive' ? 1.2 : 0.1);
        this.fall.set(0, Math.min(0, -1.4 * fallT * fallT + out * 1.6), -0.32 - out * 2.2 - fallT * 3.5); // (out over the board, clear of the hill)
        root.position.copy(this.fall);
        clip = f < 0.35 ? 'jumpStart' : 'jumpLoop'; ct = f < 0.35 ? f : f; loop = f >= 0.35;
        if (this.state === 'step' && f > 1.4) { this.state = 'menu'; this.st = 0; this.onMenu?.(); }
      }
    }
    if (!C.clips[clip]) clip = 'idle';
    ch.resetPose();
    ch.applyPose(C.sample(clip, ct, P, loop));
    root.updateMatrixWorld(true);
  }

  cameraPath(dt) {
    const cam = this.camera, t = this.t;
    // idle: behind them and to their right, above the lip, looking past them into the spiral; a slow breath of drift
    const idle = _v.set(3.0 + Math.sin(t * 0.13) * 0.35, 1.8 + Math.sin(t * 0.21) * 0.12, 3.8);
    const look = _w.set(-14, -6, -40);
    if (this.state === 'idle' || (this.state === 'step' && this.st < 1.4)) {
      cam.position.lerp(idle, 1 - Math.exp(-dt * 3));
    } else {
      // after them, down
      const f = this.fall, k = this.state === 'dive' ? smooth(0, 1.1, this.st) : 0;
      const want = new THREE.Vector3(f.x + 2.6, f.y + 1.6, f.z + 4.8).lerp(new THREE.Vector3(BOARD_AT.x, BOARD_AT.y - 8, BOARD_AT.z), k * k);
      cam.position.lerp(want, 1 - Math.exp(-dt * (this.state === 'dive' ? 6 : 2.2)));
      look.set(f.x - 3, f.y - 2.5, f.z - 12); // (them on the left, the menu on the right, the spiral below)
      if (this.state === 'dive') look.lerp(BOARD_AT, k);
      if (this.state === 'dive' && this.st > 1.15 && this.onDived) { const d = this.onDived; this.onDived = null; d(); }
    }
    cam.lookAt(look);
  }

  render() { this.game.post.render(this.scene, this.camera); }
  dispose() { this.scene.traverse((o) => { o.geometry?.dispose?.(); }); }
}
