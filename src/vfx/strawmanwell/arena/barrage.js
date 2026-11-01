// ---------------------------------------------------------------------------------------
// THE BARRAGE'S LOOK (the brawler's held jab, my take on Closers' J and his Omega-III Rush; South, 2026-11-01: "your take on the
// character J's kit ... his barrage punch"; the rule Dovina's, fighter/toolkits.js; its key poses courier/anim/keys/fighterkits.js):
//   the ghost fists   while the barrage runs, fists faster than the eye: cut-out fists with their speed lines thrown out ahead of the
//                     Courier at chest height, two or three a frame, each gone in a tenth of a second, in your side's lapis with a white
//                     knuckle (the duel's sides' colours, duelview/fxkit.js), so the four drawn punches read as a hundred
//   the board         the kabuki tsuke's running beat under it (well.tsuke { kind: 'batabata' }) as it starts, its double beat
//                     ('battari') when the finisher lands: Wanda's sounds (audio/welltheatre.js), the Well's theatre in the fight
// Looks only: it reads the kit's fighter (its state and move) and draws; the blows, the boxes and the hits stay the kit's.
//
// Prior art: JoJo's barrages and E. Honda's hundred hands (many ghost fists, a blur, then the one blow that ends it), Closers' J
// (wiki.biligame.com/closers/J: the charge, the punches, the kick and the forward strike), Smash's rapid jab; the house's flats'
// cut-out (flats/kit.js) and the kurogo's one material (strawmanwell/kurogo.js: the flats' own program, nothing new compiled).
//
//   const B = new BarrageLook(ctx)   B.group   B.update(dt, kit)   B.dispose()   BARRAGE_LOOK   barrageOn(kit, F)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const BARRAGE_LOOK = { per: 2.2, life: 0.12, ahead: [0.5, 1.5], height: [0.85, 1.6], size: [0.5, 0.78], z: 0.28, col: 0x7a8cff, max: 28 };
const B = BARRAGE_LOOK;

/** Is fighter F in the barrage (the brawler's held jab3, or a move the kit names barrage)? */
export const barrageOn = (kit, F) => !!F && F.st === 'attack' && (F.m === 'barrage' || (F.m === 'jab3' && (kit?.set === 'brawler' || kit?.kitId === 'brawler' || F.set === 'brawler')));

/** A fist side-on, knuckles forward (right), its speed lines trailing left; white so the vertex colours tint it. */
function fistTexture() {
  const W = 128, H = 64, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineCap = 'round';
  for (const [y, l, w] of [[18, 56, 5], [32, 70, 6], [46, 52, 5], [26, 40, 3], [40, 46, 3]]) { g.lineWidth = w; g.beginPath(); g.moveTo(66 - l, y); g.lineTo(66, y); g.stroke(); }
  g.fillStyle = '#ffffff'; g.strokeStyle = '#2a1a12'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(70, 14); g.quadraticCurveTo(118, 8, 120, 32); g.quadraticCurveTo(118, 56, 70, 50); g.quadraticCurveTo(62, 32, 70, 14); g.fill(); g.stroke();
  g.lineWidth = 2.5; for (const y of [22, 32, 42]) { g.beginPath(); g.moveTo(100, y - 4); g.quadraticCurveTo(114, y, 100, y + 4); g.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class BarrageLook {
  constructor(ctx) {
    this.ctx = ctx; this.group = new THREE.Group(); this.group.name = 'arena.barrage';
    this.tex = fistTexture();
    this.mat = new THREE.MeshBasicMaterial({ name: 'well-kurogo', map: this.tex, alphaTest: 0.5, vertexColors: true, side: THREE.DoubleSide });
    const NV = B.max * 6; this.pos = new Float32Array(NV * 3); this.col = new Float32Array(NV * 3); const uv = new Float32Array(NV * 2);
    const UV = [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]]; for (let i = 0; i < NV; i++) { uv[i * 2] = UV[i % 6][0]; uv[i * 2 + 1] = UV[i % 6][1]; }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); this.geo.setDrawRange(0, 0);
    const mesh = new THREE.Mesh(this.geo, this.mat); mesh.frustumCulled = false; this.group.add(mesh);
    this.fists = []; this.acc = 0; this.was = false; this.side = new THREE.Color(B.col); this.c = new THREE.Color();
    const g = ctx.game;
    this.off = g.events?.on?.('well.fighter.hit', (e) => { if (e?.by === 'courier' && e.move === 'barrageEnd') this.say('battari'); });
  }

  say(kind) { const g = this.ctx.game, p = g.player?.pos; g.events?.emit('well.tsuke', { kind, x: p?.x ?? 0, y: p?.y ?? 0, by: 'courier' }); }

  update(dt, kit) {
    const F = kit?.courier, on = barrageOn(kit, F), z = kit?.stage?.z;
    if (on && !this.was) this.say('batabata');
    this.was = on;
    if (on && z != null) {
      this.acc += dt * 60 * B.per;
      while (this.acc >= 1 && this.fists.length < B.max) {
        this.acc -= 1; const R = Math.random;
        this.fists.push({ x: F.x + F.face * (B.ahead[0] + R() * (B.ahead[1] - B.ahead[0])), y: F.y + B.height[0] + R() * (B.height[1] - B.height[0]), z: z + B.z + R() * 0.2,
          s: B.size[0] + R() * (B.size[1] - B.size[0]), face: F.face, tilt: (R() - 0.5) * 0.5, age: 0, tint: R() });
      }
      if (this.acc > 1) this.acc = 1;
    } else this.acc = 0;
    let n = 0;
    for (let i = this.fists.length - 1; i >= 0; i--) { const f = this.fists[i]; f.age += dt; if (f.age > B.life) this.fists.splice(i, 1); }
    for (const f of this.fists) {
      const k = f.age / B.life, w = f.s * (1 + k * 0.4), h = w * 0.5, push = k * 0.25 * f.face, ca = Math.cos(f.tilt), sa = Math.sin(f.tilt);
      this.c.copy(this.side).lerp(new THREE.Color(1, 1, 1), f.tint * 0.5 * (1 - k));
      const corner = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
      for (let v = 0; v < 6; v++) {
        const [cx, cy] = corner[v], x = cx * ca - cy * sa, y = cx * sa + cy * ca, o = (n * 6 + v) * 3;
        this.pos[o] = f.x + push + x * f.face; this.pos[o + 1] = f.y + y; this.pos[o + 2] = f.z;
        this.col[o] = this.c.r; this.col[o + 1] = this.c.g; this.col[o + 2] = this.c.b;
      }
      n++;
    }
    this.geo.setDrawRange(0, n * 6);
    if (n) { this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true; }
  }

  dispose() { this.off?.(); this.group.removeFromParent(); this.geo.dispose(); this.mat.dispose(); this.tex.dispose(); }
}
