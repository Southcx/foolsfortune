// Dev-only clip viewer (npm run dev, then /dev/animlab.html): poses the Courier from the
// baked clip pack; sheet(name) / sheet2(name, t0, t1) draw contact sheets for picking frames.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import courierB64 from '../src/assets/courier.glb?b64';
import allB64 from '../src/assets/anims.bin?b64';
import { decodeAnims } from '../src/anims.js';
const W = 360, H = 360;
const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
r.setSize(W * 4, H * 2); document.body.appendChild(r.domElement);
r.setScissorTest(true);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x3a2418);
scene.add(new THREE.HemisphereLight(0xffeedd, 0x442211, 2.2));
const sun = new THREE.DirectionalLight(0xffffff, 2); sun.position.set(2, 4, 3); scene.add(sun);
const grid = new THREE.GridHelper(4, 8, 0x886655, 0x664433); scene.add(grid);
const buf = Uint8Array.from(atob(courierB64), (c) => c.charCodeAt(0)).buffer;
const g = await new GLTFLoader().parseAsync(buf, '');
const model = g.scene; scene.add(model);
model.traverse((o) => { if (o.isMesh) { o.material = new THREE.MeshStandardMaterial({ color: 0xc08060, flatShading: true }); o.frustumCulled = false; } });
const pack = decodeAnims(allB64);
// raw frames -> THREE clips for the mixer
const clips = {};
for (const [name, c] of Object.entries(pack.clips)) {
  const times = Float32Array.from({ length: c.n }, (_, f) => Math.min(c.dur, f / pack.fps));
  const tracks = pack.bones.map((b, i) => {
    const v = new Float32Array(c.n * 4);
    for (let f = 0; f < c.n; f++) v.set(c.q.subarray((f * pack.bones.length + i) * 4, (f * pack.bones.length + i) * 4 + 4), f * 4);
    return new THREE.QuaternionKeyframeTrack(`${b}.quaternion`, times, v);
  });
  tracks.push(new THREE.VectorKeyframeTrack('spine.position', times, c.p));
  clips[name] = new THREE.AnimationClip(name, c.dur, tracks);
}
const mixer = new THREE.AnimationMixer(model);
const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
window.clipNames = Object.keys(clips).map((k) => [k, clips[k].duration]);
// draw clip at 8 times: row 0 side view, row 1 front-ish view
window.sheet = (name) => {
  const c = clips[name]; mixer.stopAllAction(); const a = mixer.clipAction(c); a.reset().play();
  for (let i = 0; i < 4; i++) for (let row = 0; row < 2; row++) {
    const t = (c.duration * i) / 4 + (row ? c.duration / 8 : 0);
    mixer.setTime(t);
    model.updateMatrixWorld(true);
    const ang = row ? 0.6 : Math.PI / 2;
    cam.position.set(Math.sin(ang) * 4.2, 1.1, Math.cos(ang) * 4.2); cam.lookAt(0, 0.85, 0);
    r.setViewport(i * W, (1 - row) * H, W, H); r.setScissor(i * W, (1 - row) * H, W, H);
    r.render(scene, cam);
  }
};
window.__ready = true;
// 8 side views from t0..t1 (fractions of the clip), labelled by time
window.sheet2 = (name, t0 = 0, t1 = 1) => {
  const c = clips[name]; mixer.stopAllAction(); const a = mixer.clipAction(c); a.reset().play();
  const out = [];
  for (let k = 0; k < 8; k++) {
    const i = k % 4, row = (k / 4) | 0;
    const t = c.duration * (t0 + (t1 - t0) * k / 7);
    out.push(t.toFixed(2));
    mixer.setTime(t); model.updateMatrixWorld(true);
    cam.position.set(4.2, 1.1, 0); cam.lookAt(0, 0.85, 0);
    r.setViewport(i * W, (1 - row) * H, W, H); r.setScissor(i * W, (1 - row) * H, W, H);
    r.render(scene, cam);
  }
  return out;
};
