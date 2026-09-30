// ---------------------------------------------------------------------------------------
// GLYPHS: the punctuation of a world. A chunky "!", "!!" or "!!!" (or "?", "…", "♪") that pops out of something in the world, on a
// sprite that always faces the camera and draws through water and walls: a fish that has noticed the lure, a probe, the bite that
// has to be answered. The glyph is squashed and stretched as it pops (it overshoots, wobbles, settles and rises), with a burst of
// spikes and a ring behind it for the ones that matter. Tinted per use (the lure's aspect), always with a heavy dark outline.
//
// Prior art: the exclamation mark over the head of every alerted enemy from Metal Gear Solid onward, Animal Crossing's and FFXIV's
// bite indicators (the number of marks is the weight of the bite: ! !! !!!), and the comic-book onomatopoeia the pop's timing is
// borrowed from (a fast overshoot, a wobble, a held beat, a rise and a fade). It is text in the world, on the thing it is about; it is
// not a HUD message, and the log stays the only place the game *says* anything.
//
//   game.glyphs.pop('bang3', position, { color: 0xffd76a, size: 1, burst: true, follow: () => vec })
//   const g = game.glyphs.pop('bang3', pos, { hold: 1.2 })    a mark that stays for a window (and shakes harder as it closes) until g.close()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const CACHE = new Map();

function glyphCanvas(text, w, h, font) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineCap = 'round';
  g.font = font;
  const x = w / 2, y = h / 2 + h * 0.03;
  g.save(); g.translate(x, y); g.rotate(-0.09); g.transform(1, 0, -0.18, 1, 0, 0); // (italic lean, and a tilt)
  g.strokeStyle = '#150806'; g.lineWidth = h * 0.24; g.strokeText(text, 0, 0); // heavy outline
  g.strokeStyle = '#ffffff'; g.lineWidth = h * 0.105; g.strokeText(text, 0, 0); // the light rim
  const grad = g.createLinearGradient(0, -h * 0.4, 0, h * 0.4);
  grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.55, '#f6e6c8'); grad.addColorStop(1, '#c9a67a');
  g.fillStyle = grad; g.fillText(text, 0, 0);
  g.restore();
  return c;
}

function burstCanvas() {
  const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d');
  g.translate(s / 2, s / 2);
  const spikes = 14;
  g.beginPath();
  for (let i = 0; i < spikes * 2; i++) { const a = (i / (spikes * 2)) * Math.PI * 2, r = i % 2 ? s * 0.28 : s * 0.5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  g.closePath();
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, s * 0.5);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.6, 'rgba(255,255,255,0.75)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fill();
  return c;
}

const KINDS = {
  bang1: { text: '!', w: 256, h: 256, font: '900 200px "Arial Black", Impact, "Helvetica Neue", sans-serif', aspect: 1 },
  bang2: { text: '!!', w: 384, h: 256, font: '900 200px "Arial Black", Impact, "Helvetica Neue", sans-serif', aspect: 1.5 },
  bang3: { text: '!!!', w: 512, h: 256, font: '900 200px "Arial Black", Impact, "Helvetica Neue", sans-serif', aspect: 2 },
  ask: { text: '?', w: 256, h: 256, font: '900 200px "Arial Black", Impact, "Helvetica Neue", sans-serif', aspect: 1 },
  dots: { text: '…', w: 384, h: 256, font: '900 200px "Arial Black", Impact, "Helvetica Neue", sans-serif', aspect: 1.5 },
  note: { text: '♪', w: 256, h: 256, font: '900 200px "Arial Black", "Segoe UI Symbol", sans-serif', aspect: 1 },
  star: { text: '★', w: 256, h: 256, font: '900 190px "Segoe UI Symbol", "Arial Black", sans-serif', aspect: 1 },
};

const tex = (kind) => {
  if (CACHE.has(kind)) return CACHE.get(kind);
  const K = KINDS[kind];
  const t = new THREE.CanvasTexture(kind === 'burst' ? burstCanvas() : glyphCanvas(K.text, K.w, K.h, K.font));
  t.colorSpace = THREE.SRGBColorSpace;
  CACHE.set(kind, t);
  return t;
};

const ease = {
  // overshoot: 0 -> 1.35 -> 0.94 -> 1
  pop: (u) => (u < 0.4 ? (u / 0.4) * 1.35 : u < 0.7 ? 1.35 - 0.41 * ((u - 0.4) / 0.3) : 0.94 + 0.06 * ((u - 0.7) / 0.3)),
};

export class Glyphs {
  constructor(game) {
    this.game = game;
    this.list = [];
    this.ringTex = game.fx.haloTexture;
  }

  pop(kind, pos, { color = 0xffd76a, size = 0.6, life = 1.1, float = 0.7, burst = false, follow = null, ring = false, hold = 0 } = {}) {
    const K = KINDS[kind] || KINDS.bang1, g = this.game;
    const mk = (map, blending) => new THREE.Sprite(new THREE.SpriteMaterial({ map, color, transparent: true, depthTest: false, depthWrite: false, blending, fog: false }));
    const main = mk(tex(kind), THREE.NormalBlending);
    main.renderOrder = 30;
    const parts = { main, burst: null, ring: null };
    g.scene.add(main);
    if (burst) { parts.burst = mk(tex('burst'), THREE.AdditiveBlending); parts.burst.renderOrder = 29; g.scene.add(parts.burst); }
    if (ring) { parts.ring = mk(this.ringTex, THREE.AdditiveBlending); parts.ring.renderOrder = 28; g.scene.add(parts.ring); }
    const q = { K, parts, pos: pos.clone(), follow, t: 0, life: hold > 0 ? hold + 0.25 : life, hold, size, float, aspect: K.aspect, seed: Math.random() * 6 };
    q.close = () => { q.life = Math.min(q.life, q.t + 0.25); q.hold = 0; q.closing = true; };
    this.list.push(q);
    return q;
  }

  update(dt) {
    const cam = this.game.camera.position;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const q = this.list[i];
      q.t += dt;
      const u = q.t / q.life;
      if (u >= 1) { for (const s of Object.values(q.parts)) if (s) { this.game.scene.remove(s); s.material.dispose(); } this.list.splice(i, 1); continue; }
      if (q.follow) q.pos.copy(q.follow());
      const d = cam.distanceTo(q.pos);
      const worldK = q.size * (0.7 + 0.075 * d); // (farther ones are larger, so that they still read)
      const held = q.hold > 0 && !q.closing && q.t < q.hold;
      const urg = held ? Math.min(1, q.t / q.hold) : 0; // (how far through the window it is)
      const pop = ease.pop(Math.min(1, q.t / 0.28)) * (held ? 1 + 0.07 * Math.sin(q.t * (9 + 22 * urg)) * (0.3 + urg) : 1);
      const wob = held ? Math.sin(q.t * (14 + 30 * urg) + q.seed) * (0.04 + 0.13 * urg) : Math.sin(q.t * 16 + q.seed) * 0.13 * Math.max(0, 1 - q.t / 0.7);
      const squash = 1 + 0.32 * Math.max(0, 1 - q.t / 0.22) * Math.cos(q.t * 45); // (a fast squash and stretch as it pops)
      const fade = q.closing || q.hold > 0 ? THREE.MathUtils.clamp((q.life - q.t) / 0.25, 0, 1) : u > 0.72 ? 1 - (u - 0.72) / 0.28 : 1;
      const m = q.parts.main;
      const rise = held || q.closing ? 0 : (u > 0.72 ? (u - 0.72) * q.float : 0);
      m.position.copy(q.pos); m.position.y += q.float * (1 - Math.pow(1 - Math.min(1, q.t / 0.5), 2)) + rise;
      m.scale.set(worldK * q.aspect * pop / squash, worldK * pop * squash, 1);
      m.material.rotation = wob; m.material.opacity = fade;
      if (q.parts.burst) {
        const b = q.parts.burst, k = Math.min(1, q.t / 0.35);
        b.position.copy(m.position); b.scale.setScalar(worldK * (1.6 + 1.6 * k)); b.material.rotation = q.t * 1.5; b.material.opacity = 0.85 * (1 - k) * (1 - k);
      }
      if (q.parts.ring) {
        const r = q.parts.ring, k = Math.min(1, q.t / 0.5);
        r.position.copy(m.position); r.scale.setScalar(worldK * (0.6 + 4 * k)); r.material.opacity = 0.7 * (1 - k);
      }
    }
  }
}
