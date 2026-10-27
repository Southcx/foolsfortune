// ---------------------------------------------------------------------------------------
// THE FLASH'S LOOK (the Veritome at sea: Dovina's SEA_MOUNTS.veritome, Petra's world/opensea/seamounts.js `c.open`), a part of the
// mounts' look (vfx/opensea/seamounts.js). A white burst off the bow, the camera's, and a second where it lands; a plate's four corner
// brackets thrown wide round the beast's head and closing on it (the lens's frame's corners, vfx/veritomeframe.js, in the world), white
// as they lock and gold while the weak point is held open, a gold rim breathing round the head; when it closes the brackets spring
// out and fade. A world mark: no words.
// Prior art: Pokemon Snap's flash and its frame (the shot's corners on the subject), Fatal Frame's camera obscura (the frame that locks
// and holds a weak moment open), the lock-on's brackets every shooter teaches.
//
//   new FlashLook(M)   .fired(e)   .update(dt)   .parked() -> [mesh]
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** burst: its size (m), rise and fade (real s); lock: real s the brackets take to close, how wide they start (x); size: the frame x the
 *  head's radius (m, at least `min`); gold / white: the colours; out: real s they spring out once it closes; cap: frames at once. */
export const FLASH_LOOK = { burst: { size: 16, at: 9, rise: 0.06, fade: 0.4 }, lock: 0.28, wide: 2.6, size: 2.4, min: 6, gold: 0xffd36a, white: 0xffffff, out: 0.3, cap: 2 };
const FL = FLASH_LOOK, _v = new THREE.Vector3(), _c = new THREE.Color(), GOLD = new THREE.Color(FL.gold);

/** A soft round glow, white: the burst's sprite. */
function glowTexture() {
  const N = 64, d = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const r = Math.hypot(x - N / 2 + 0.5, y - N / 2 + 0.5) / (N / 2), v = Math.round(255 * Math.max(0, Math.exp(-r * r * 4) - 0.02)); d.set([255, 255, 255, v], (y * N + x) * 4); }
  const t = new THREE.DataTexture(d, N, N); t.needsUpdate = true; return t;
}
/** Four corner brackets in a unit square (each two arms), facing +Z. */
function bracketGeometry() {
  const arm = 0.3, th = 0.05, parts = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const a = new THREE.PlaneGeometry(arm, th); a.translate(sx * (0.5 - arm / 2), sy * (0.5 - th / 2), 0);
    const b = new THREE.PlaneGeometry(th, arm); b.translate(sx * (0.5 - th / 2), sy * (0.5 - arm / 2), 0);
    parts.push(a, b);
  }
  const g = new THREE.BufferGeometry(), pos = [], idx = []; let o = 0;
  for (const p of parts) { pos.push(...p.attributes.position.array); for (const i of p.index.array) idx.push(i + o); o += p.attributes.position.count; }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
}

export class FlashLook {
  constructor(M) {
    this.M = M; const sc = M.game.scene; this.bursts = []; this.frames = [];
    const tex = glowTexture(), bg = bracketGeometry(), ring = new THREE.RingGeometry(0.9, 1, 48);
    this.burstPool = Array.from({ length: 4 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: FL.white, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); s.visible = false; s.renderOrder = 70; s.userData.zone = 'opensea'; sc?.add(s); return s; });
    this.framePool = Array.from({ length: FL.cap }, () => {
      const b = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: FL.white, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      const r = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({ color: FL.gold, transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      for (const x of [b, r]) { x.visible = false; x.renderOrder = 71; x.frustumCulled = false; x.userData.zone = 'opensea'; sc?.add(x); }
      return { b, r, busy: false };
    });
  }
  parked() { return [this.burstPool[0], this.framePool[0].b, this.framePool[0].r]; }

  burst(at, size) { const s = this.burstPool.find((x) => !x.visible) || this.burstPool[0]; s.visible = true; s.position.copy(at); this.bursts.push({ s, t: 0, size }); }

  /** sea.mount veritome ok: the bow's flash, and a frame on the beast it held open (`hit` 'beast'). */
  fired(e) {
    const M = this.M, S = M.serpents, at = M.mountAt('veritome', _v).clone();
    this.burst(at, FL.burst.size);
    for (let i = 0; i < 10; i++) M.fx?.add?.emit({ pos: at.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 10, Math.random() * 6, (Math.random() - 0.5) * 10), life: 0.25, size: 0.2, sizeEnd: 0.02, color: 0xffffff, alpha: 1, drag: 3, gravity: 0, floor: -1e9 });
    if (e.hit !== 'beast' || !S) return;
    let c = null; for (const b of S.list) if (b.alive && b.open > 0 && (!c || b.open > c.open)) c = b;
    if (!c) return;
    this.burst(S.at(c, 0), FL.burst.at);
    for (const f of this.frames) if (f.c === c) f.done = true;
    const P = this.framePool.find((p) => !p.busy) || this.frames.shift()?.P; if (!P) return;
    P.busy = true; this.frames.push({ P, c, t: 0, out: -1, done: false });
  }

  update(dt) {
    const M = this.M, S = M.serpents, cam = M.game.camera, B = FL.burst;
    for (const b of this.bursts) {
      b.t += dt; const k = b.t < B.rise ? b.t / B.rise : Math.max(0, 1 - (b.t - B.rise) / B.fade);
      if (k <= 0 || !M.live) { b.s.visible = false; b.done = true; continue; }
      b.s.scale.setScalar(b.size * (0.4 + 0.6 * Math.min(1, b.t / B.rise))); b.s.material.opacity = k;
    }
    this.bursts = this.bursts.filter((b) => !b.done);
    for (const f of this.frames) {
      const P = f.P, c = f.c; f.t += dt;
      if (!f.done && (!M.live || !c.alive || !(c.open > 0))) f.out = f.out < 0 ? 0 : f.out;
      if (f.out >= 0) f.out += dt;
      if (f.done || f.out >= FL.out || !S) { P.busy = false; P.b.visible = P.r.visible = false; f.done = true; continue; }
      const head = S.at(c, 0), R = Math.max(FL.min, S.rOf(c, 0) * FL.size), u = Math.min(1, f.t / FL.lock), lock = 1 - (1 - u) * (1 - u);
      const out = f.out >= 0 ? f.out / FL.out : 0, wide = 1 + (FL.wide - 1) * (1 - lock) + out * 0.7, a = (0.4 + 0.6 * lock) * (1 - out);
      P.b.visible = true; P.b.position.copy(head); P.b.quaternion.copy(cam.quaternion); P.b.rotateZ((1 - lock) * 0.6); P.b.scale.setScalar(R * wide);
      const held = lock >= 1 && f.out < 0, pulse = 0.85 + 0.15 * Math.sin(f.t * 7);
      P.b.material.color.copy(_c.setHex(FL.white).lerp(GOLD, held ? 1 : u * u)); P.b.material.opacity = a * (held ? pulse : 1);
      P.r.visible = lock > 0.6; P.r.position.copy(head); P.r.quaternion.copy(cam.quaternion); P.r.scale.setScalar(S.rOf(c, 0) * 1.25 * (1 + out * 0.4)); P.r.material.opacity = (held ? 0.55 + 0.35 * Math.sin(f.t * 5) : 0.4) * (1 - out);
    }
    this.frames = this.frames.filter((f) => !f.done);
  }
}
