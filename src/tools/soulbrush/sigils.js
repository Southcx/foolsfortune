// ---------------------------------------------------------------------------------------
// SIGILS: while the Soul Brush is out, every clapperjar near enough carries a little queue of brushed marks over its head (a stroke
// across, a stroke down, a V, a caret, a lightning bolt; a raider carries three). Drawing a mark on the Celestial Brush's canvas takes
// that mark off the FRONT of every queue it heads, all at once, wherever those jars are on the screen; a jar whose queue is emptied is
// undone (it comes apart in a burst of ink). So a crowd is read and answered, mark by mark, the way a sentence is written.
//
// Prior art: Magic Cat Academy (Google's Halloween Doodle, 2016): Momo the cat draws the symbol over a ghost's head to pop it, one symbol
// pops it from every ghost that shows it, and the lightning bolt and the heart are special symbols. The marks here are drawn as brush
// strokes (they are shapes, not letters: marks in the world are not text), dark ink with a pale rim so they read on any ground.
//
//   const s = new Sigils(game)   s.update(dt, on)  (on: the brush is out)   s.pop('h' | 'v' | 'vee' | 'caret' | 'bolt') -> { popped, cleared }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { stream } from '../../core/rng.js';
const simRand = stream('tools/soulbrush/sigils'); // (the simulation's chance: core/rng.js, the same twice)

export const SIGIL_KEYS = ['h', 'v', 'vee', 'caret', 'bolt'];
/** What the recognizer calls a drawn mark -> the sigil it answers. */
export const SIGIL_OF = { '—': 'h', '|': 'v', V: 'vee', '^': 'caret', 'ϟ': 'bolt' };
const SHAPES = {
  h: [[0.14, 0.5, 0.86, 0.5]],
  v: [[0.5, 0.14, 0.5, 0.86]],
  vee: [[0.16, 0.2, 0.5, 0.84, 0.84, 0.2]],
  caret: [[0.16, 0.8, 0.5, 0.16, 0.84, 0.8]],
  bolt: [[0.62, 0.08, 0.3, 0.5, 0.68, 0.5, 0.36, 0.92]],
};
const RANGE = 16, SIZE = 0.46;

function sigilTexture(key) {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  g.lineCap = 'round'; g.lineJoin = 'round';
  const path = (xy) => { g.beginPath(); g.moveTo(xy[0] * S, xy[1] * S); for (let i = 2; i < xy.length; i += 2) g.lineTo(xy[i] * S, xy[i + 1] * S); g.stroke(); };
  for (const [w, col] of [[S * 0.2, 'rgba(246,228,190,0.95)'], [S * 0.11, '#17111a']]) { g.strokeStyle = col; g.lineWidth = w; for (const p of SHAPES[key]) path(p); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Sigils {
  constructor(game) {
    this.game = game;
    this.tex = Object.fromEntries(SIGIL_KEYS.map((k) => [k, sigilTexture(k)]));
    this.on = new Map(); // clapper -> { keys, sprites, k }
    this.bursts = [];
  }

  /** A queue for a clapperjar: a raider carries three, the rest one or two; the bolt is rare. */
  deal(c) {
    const n = c.raider ? 3 : simRand() < 0.45 ? 2 : 1;
    const pick = () => (simRand() < 0.12 ? 'bolt' : SIGIL_KEYS[Math.floor(simRand() * 4)]);
    return Array.from({ length: n }, pick);
  }

  sprite(key) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex[key], transparent: true, depthWrite: false, fog: false }));
    s.renderOrder = 26; s.userData.key = key;
    this.game.scene.add(s);
    return s;
  }
  drop(s) { this.game.scene.remove(s); s.material.dispose(); }

  update(dt, on) {
    const g = this.game, P = g.player, cam = g.camera;
    const live = new Set(g.clappers?.list || []);
    for (const [c, e] of this.on) if (!live.has(c) || !c.alive || c.ally) { e.sprites.forEach((s) => this.drop(s)); this.on.delete(c); }
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    this.t = (this.t || 0) + dt;
    for (const c of live) {
      if (!c.alive || c.ally) continue;
      const near = c.pos.distanceTo(P.pos) < RANGE;
      let e = this.on.get(c);
      if (!e) {
        if (!on || !near) continue;
        c.sigils ||= this.deal(c);
        e = { keys: c.sigils, sprites: c.sigils.map((k) => this.sprite(k)), k: 0 };
        this.on.set(c, e);
      }
      e.k = THREE.MathUtils.damp(e.k, on && near ? 1 : 0, 10, dt);
      if (e.k < 0.01 && !(on && near)) { e.sprites.forEach((s) => this.drop(s)); this.on.delete(c); continue; }
      const n = e.sprites.length;
      e.sprites.forEach((s, i) => {
        s.position.copy(c.pos).addScaledVector(right, (i - (n - 1) / 2) * SIZE * 1.05);
        s.position.y += 1.2 + Math.sin(this.t * 2.2 + i) * 0.02;
        const lead = i === 0 ? 1.15 : 0.9;
        s.scale.setScalar(SIZE * lead * (0.4 + 0.6 * e.k));
        s.material.opacity = e.k * (i === 0 ? 1 : 0.75);
      });
    }
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.t += dt;
      const k = b.t / 0.3;
      if (k >= 1) { this.drop(b.s); this.bursts.splice(i, 1); continue; }
      b.s.scale.setScalar(SIZE * (1.15 + 1.4 * k)); b.s.material.opacity = 1 - k; b.s.position.y += dt * 1.5;
    }
  }

  /** Every queue near a point loses its front mark (Death, a card): an emptied one unwrites its jar. */
  dropFront(at, r) {
    let n = 0;
    for (const [c, e] of [...this.on]) if (c.pos.distanceTo(at) < r && e.keys.length) { if (this.pop(e.keys[0], c).popped) n++; }
    return n;
  }

  /** Does any queue in view start with this mark? */
  heads(key) { for (const e of this.on.values()) if (e.k > 0.5 && e.keys[0] === key) return true; return false; }

  /** A mark was drawn: it comes off the front of every queue it heads (in range, shown). */
  pop(key, only = null) {
    const g = this.game, P = g.player;
    let popped = 0, cleared = 0;
    for (const [c, e] of [...this.on]) {
      if ((only && c !== only) || (!only && e.k < 0.5) || e.keys[0] !== key) continue;
      e.keys.shift();
      const s = e.sprites.shift();
      this.bursts.push({ s, t: 0 });
      popped++;
      if (!e.keys.length) {
        cleared++;
        this.on.delete(c);
        const p = c.pos.clone().setY(c.pos.y + 0.35), dir = p.clone().sub(P.pos).setY(0).normalize();
        const ink = new THREE.Color(0x17111a), sheen = new THREE.Color(0x8c56dc);
        for (let i = 0; i < 26; i++) g.fx.alpha.emit({ pos: p, vel: new THREE.Vector3().randomDirection().multiplyScalar(2 + simRand() * 3), life: 0.5 + simRand() * 0.4, size: 0.12, sizeEnd: 0.03, color: i % 4 ? ink : sheen, alpha: 0.85, drag: 3, gravity: 5 });
        g.clappers.hit(c, p, dir, 1, 'brushed');
      }
    }
    return { popped, cleared };
  }

  clear() { for (const e of this.on.values()) e.sprites.forEach((s) => this.drop(s)); this.on.clear(); }
}
